import { applyNegationPenalty, buildTagText, rankTagsByKeywordOverlap, scoreLexicalOverlap } from './lexical'
import { resolveTagExtractorConfig } from './defaults'
import type { DynamicTagSuggestion, TagDefinition, TagExtractionInput, TagExtractionResult, TagExtractorScorerConfig, TagSuggestion } from './types'

export type Embedder = (text: string) => Promise<number[]>

export function cosineSimilarity(left: number[], right: number[]): number {
  const length = Math.min(left.length, right.length)
  if (length === 0) {
    return 0
  }

  let dot = 0
  let leftMagnitude = 0
  let rightMagnitude = 0
  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index] ?? 0
    const rightValue = right[index] ?? 0
    dot += leftValue * rightValue
    leftMagnitude += leftValue * leftValue
    rightMagnitude += rightValue * rightValue
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude))
}

export async function scoreTagSuggestions(
  input: TagExtractionInput,
  config: TagExtractorScorerConfig,
  embed?: Embedder,
): Promise<TagSuggestion[]> {
  const text = input.text.trim()
  const tags = dedupeTags(input.tags ?? [])
  const locale = input.locale ?? 'en'
  const mergedConfig = {
    ...config,
    ...input.config,
  }

  if (!text || tags.length === 0) {
    return []
  }

  if (!embed) {
    return rankTagsByKeywordOverlap(
      text,
      tags,
      mergedConfig.maxSuggestions,
      mergedConfig.exactAliasBoost,
      locale,
      mergedConfig.negationPenalty,
      mergedConfig.negationWindow,
    ).filter((item) => item.score >= mergedConfig.minScore)
  }

  const textEmbedding = await embed(text)
  const scored = await Promise.all(tags.map(async (tag) => {
    const semanticScore = cosineSimilarity(textEmbedding, await embed(buildTagText(tag, locale)))
    const lexical = scoreLexicalOverlap(text, tag, mergedConfig.exactAliasBoost, locale, mergedConfig.negationWindow)
    const rawScore = Math.min(
      1,
      (semanticScore * mergedConfig.semanticWeight) + (lexical.lexicalScore * mergedConfig.lexicalWeight),
    )
    return {
      key: tag.key,
      semanticScore,
      lexicalScore: lexical.lexicalScore,
      exactAliasMatches: lexical.exactAliasMatches,
      negatedTermMatches: lexical.negatedTermMatches,
      score: applyNegationPenalty(rawScore, lexical.negatedTermMatches, mergedConfig.negationPenalty),
    }
  }))

  return scored
    .filter((item) => item.key && item.score >= mergedConfig.minScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, mergedConfig.maxSuggestions)
}

export async function extractDynamicTags(
  input: TagExtractionInput,
  config: TagExtractorScorerConfig,
  embed?: Embedder,
): Promise<DynamicTagSuggestion[]> {
  const text = input.text.trim()
  const mergedConfig = {
    ...config,
    ...input.config,
  }
  if (!text) {
    return []
  }

  const candidates = extractCandidatePhrases(text, mergedConfig.dynamicNgramMin, mergedConfig.dynamicNgramMax)
    .filter((candidate) => !isTaxonomyCandidate(candidate.label, input.tags ?? [], input.locale ?? 'en'))
  if (candidates.length === 0) {
    return []
  }

  if (!embed) {
    return candidates
      .map((candidate) => ({
        label: candidate.label,
        score: candidate.lexicalScore,
        semanticScore: 0,
        lexicalScore: candidate.lexicalScore,
        occurrences: candidate.occurrences,
        ngramSize: candidate.ngramSize,
      }))
      .filter((candidate) => candidate.score >= mergedConfig.minDynamicScore)
      .sort(compareDynamicTags)
      .slice(0, mergedConfig.maxDynamicTags)
  }

  const textEmbedding = await embed(text)
  const scored = await Promise.all(candidates.map(async (candidate) => {
    const semanticScore = cosineSimilarity(textEmbedding, await embed(candidate.label))
    const score = Math.min(
      1,
      (semanticScore * mergedConfig.semanticWeight) + (candidate.lexicalScore * mergedConfig.lexicalWeight),
    )

    return {
      label: candidate.label,
      score,
      semanticScore,
      lexicalScore: candidate.lexicalScore,
      occurrences: candidate.occurrences,
      ngramSize: candidate.ngramSize,
    }
  }))

  return scored
    .filter((candidate) => candidate.score >= mergedConfig.minDynamicScore)
    .sort(compareDynamicTags)
    .slice(0, mergedConfig.maxDynamicTags)
}

export async function extractTags(input: TagExtractionInput, embed?: Embedder, config = resolveTagExtractorConfig()): Promise<TagExtractionResult> {
  const [predefined, dynamic] = await Promise.all([
    scoreTagSuggestions(input, config, embed),
    extractDynamicTags(input, config, embed),
  ])

  return {
    predefined,
    dynamic,
  }
}

function dedupeTags(tags: TagDefinition[]): TagDefinition[] {
  const seen = new Set<string>()
  return tags.flatMap((tag) => {
    const key = tag.key.trim()
    if (!key || seen.has(key)) {
      return []
    }

    seen.add(key)
    return [{ ...tag, key }]
  })
}

const STOPWORDS = new Set([
  'about', 'above', 'after', 'again', 'against', 'also', 'and', 'are', 'because', 'been', 'being',
  'between', 'both', 'but', 'can', 'completed', 'connects', 'coordination', 'could', 'deliver', 'deliverables',
  'delivery', 'described', 'describes', 'details', 'does', 'document', 'explains', 'for', 'from',
  'had', 'has', 'have', 'identify', 'includes', 'intake', 'into', 'its', 'matching',
  'measurable', 'must', 'names', 'not', 'operational', 'over', 'paragraph', 'participant', 'phased', 'phrases',
  'plan', 'program', 'project', 'proposal', 'provides', 'quarterly', 'rather', 'reporting',
  'service', 'simply', 'staff', 'support', 'supports', 'surrounding', 'taxonomy', 'that', 'the', 'their',
  'them', 'this', 'through', 'will', 'with', 'without', 'work',
])

type CandidatePhrase = {
  label: string
  lexicalScore: number
  occurrences: number
  ngramSize: number
}

export function extractCandidatePhrases(text: string, minNgram = 1, maxNgram = 3): CandidatePhrase[] {
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token))
  const counts = new Map<string, { occurrences: number; ngramSize: number }>()

  for (let index = 0; index < tokens.length; index += 1) {
    for (let size = minNgram; size <= maxNgram; size += 1) {
      const slice = tokens.slice(index, index + size)
      if (slice.length !== size) {
        continue
      }

      const label = slice.join(' ')
      const existing = counts.get(label)
      counts.set(label, {
        occurrences: (existing?.occurrences ?? 0) + 1,
        ngramSize: size,
      })
    }
  }

  return Array.from(counts.entries()).map(([label, value]) => ({
    label,
    occurrences: value.occurrences,
    ngramSize: value.ngramSize,
    lexicalScore: Math.min(1, 0.18 + (value.ngramSize * 0.12) + (value.occurrences * 0.08)),
  }))
}

function compareDynamicTags(left: DynamicTagSuggestion, right: DynamicTagSuggestion) {
  if (right.score !== left.score) {
    return right.score - left.score
  }

  if (right.ngramSize !== left.ngramSize) {
    return right.ngramSize - left.ngramSize
  }

  return right.occurrences - left.occurrences
}

function isTaxonomyCandidate(label: string, tags: TagDefinition[], locale: 'en' | 'fr') {
  const normalized = normalizePhrase(label)
  return tags.some((tag) => {
    const values = [
      tag.key,
      tag.label[locale],
      tag.description[locale],
      ...tag.aliases,
    ]
    return values.some((value) => normalizePhrase(value) === normalized)
  })
}

function normalizePhrase(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}
