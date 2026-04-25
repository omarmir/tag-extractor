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
): Pick<TagSuggestion, 'lexicalScore' | 'exactAliasMatches'> {
  const textTokens = new Set(tokenize(text))
  const tagTokens = new Set(tokenize(buildTagText(tag, locale)))
  const hits = Array.from(tagTokens).filter((token) => textTokens.has(token)).length
  const exactAliasMatches = tag.aliases.filter((alias) => {
    const aliasTokens = tokenize(alias)
    return aliasTokens.length > 0 && aliasTokens.every((token) => textTokens.has(token))
  })

  const overlap = tagTokens.size > 0 ? hits / tagTokens.size : 0
  return {
    lexicalScore: Math.min(1, overlap + (exactAliasMatches.length > 0 ? exactAliasBoost : 0)),
    exactAliasMatches,
  }
}

export function rankTagsByKeywordOverlap(
  text: string,
  tags: TagDefinition[],
  maxSuggestions: number,
  exactAliasBoost: number,
  locale: TagExtractorLocale = 'en',
): TagSuggestion[] {
  return tags
    .map((tag) => {
      const lexical = scoreLexicalOverlap(text, tag, exactAliasBoost, locale)
      return {
        key: tag.key,
        score: lexical.lexicalScore,
        semanticScore: 0,
        ...lexical,
      }
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, maxSuggestions)
}
