import type { TagDefinition, TagExtractorLocale, TagSuggestion } from './types'

export function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2)
}

export function buildTagText(tag: TagDefinition, locale: TagExtractorLocale = 'en'): string {
  return [
    tag.label[locale],
    tag.description[locale],
    tag.label.en,
    tag.description.en,
    ...tag.aliases,
  ]
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .join('. ')
}

export function scoreLexicalOverlap(
  text: string,
  tag: TagDefinition,
  exactAliasBoost: number,
  locale: TagExtractorLocale = 'en',
  negationWindow = 6,
): Pick<TagSuggestion, 'lexicalScore' | 'exactAliasMatches' | 'negatedTermMatches'> {
  const textTokens = new Set(tokenize(text))
  const tagTokens = new Set(tokenize(buildTagText(tag, locale)))
  const hits = Array.from(tagTokens).filter((token) => textTokens.has(token)).length
  const exactAliasMatches = tag.aliases.filter((alias) => {
    const aliasTokens = tokenize(alias)
    return aliasTokens.length > 0 && aliasTokens.every((token) => textTokens.has(token))
  })
  const negatedTermMatches = findNegatedTermMatches(text, tag, locale, negationWindow)

  const overlap = tagTokens.size > 0 ? hits / tagTokens.size : 0
  return {
    lexicalScore: Math.min(1, overlap + (exactAliasMatches.length > 0 ? exactAliasBoost : 0)),
    exactAliasMatches,
    negatedTermMatches,
  }
}

export function rankTagsByKeywordOverlap(
  text: string,
  tags: TagDefinition[],
  maxSuggestions: number,
  exactAliasBoost: number,
  locale: TagExtractorLocale = 'en',
  negationPenalty = 0.45,
  negationWindow = 6,
): TagSuggestion[] {
  return tags
    .map((tag) => {
      const lexical = scoreLexicalOverlap(text, tag, exactAliasBoost, locale, negationWindow)
      const score = applyNegationPenalty(lexical.lexicalScore, lexical.negatedTermMatches, negationPenalty)
      return {
        key: tag.key,
        score,
        semanticScore: 0,
        ...lexical,
      }
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, maxSuggestions)
}

export function applyNegationPenalty(score: number, negatedTermMatches: string[], negationPenalty: number) {
  if (negatedTermMatches.length === 0) {
    return score
  }

  return score * Math.max(0, Math.min(1, negationPenalty))
}

function findNegatedTermMatches(
  text: string,
  tag: TagDefinition,
  locale: TagExtractorLocale,
  windowSize: number,
) {
  const textTokens = tokenizeForNegation(text)
  const terms = [
    tag.key,
    tag.label[locale],
    tag.label.en,
    ...tag.aliases,
  ]
  const matches = new Set<string>()

  for (const term of terms) {
    const termTokens = tokenizeForNegation(term).filter((token) => !NEGATION_CUES.has(token))
    if (termTokens.length === 0) {
      continue
    }

    for (let index = 0; index <= textTokens.length - termTokens.length; index += 1) {
      const isTermAtIndex = termTokens.every((token, offset) => textTokens[index + offset] === token)
      if (!isTermAtIndex) {
        continue
      }

      const before = textTokens.slice(Math.max(0, index - windowSize), index)
      if (before.some((token) => NEGATION_CUES.has(token))) {
        matches.add(term)
      }
    }
  }

  return Array.from(matches)
}

const NEGATION_CUES = new Set([
  'absent',
  'avoid',
  'avoids',
  'denied',
  'exclude',
  'excludes',
  'excluding',
  'lack',
  'lacks',
  'neither',
  'never',
  'no',
  'none',
  'nor',
  'not',
  'omit',
  'omits',
  'outside',
  'without',
])

function tokenizeForNegation(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1)
}
