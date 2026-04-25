import { buildTagText, rankTagsByKeywordOverlap, scoreLexicalOverlap } from './lexical'
import { resolveTagExtractorConfig } from './defaults'
import type { TagDefinition, TagExtractionInput, TagExtractorScorerConfig, TagSuggestion } from './types'

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
  const tags = dedupeTags(input.tags)
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
    ).filter((item) => item.score >= mergedConfig.minScore)
  }

  const textEmbedding = await embed(text)
  const scored = await Promise.all(tags.map(async (tag) => {
    const semanticScore = cosineSimilarity(textEmbedding, await embed(buildTagText(tag, locale)))
    const lexical = scoreLexicalOverlap(text, tag, mergedConfig.exactAliasBoost, locale)
    return {
      key: tag.key,
      semanticScore,
      lexicalScore: lexical.lexicalScore,
      exactAliasMatches: lexical.exactAliasMatches,
      score: Math.min(
        1,
        (semanticScore * mergedConfig.semanticWeight) + (lexical.lexicalScore * mergedConfig.lexicalWeight),
      ),
    }
  }))

  return scored
    .filter((item) => item.key && item.score >= mergedConfig.minScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, mergedConfig.maxSuggestions)
}

export async function extractTags(input: TagExtractionInput, embed?: Embedder, config = resolveTagExtractorConfig()) {
  return await scoreTagSuggestions(input, config, embed)
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
