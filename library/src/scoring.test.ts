import { describe, expect, it } from 'vitest'
import { resolveTagExtractorConfig } from './defaults'
import { evaluateTagSuggestions } from './evaluator'
import { rankTagsByKeywordOverlap } from './lexical'
import { extractCandidatePhrases, extractTags, scoreTagSuggestions } from './scoring'
import type { DynamicTagSuggestion, TagDefinition, TagSuggestion } from './types'

const tags: TagDefinition[] = [
  {
    key: 'capacity-building',
    label: { en: 'Capacity building', fr: 'Renforcement des capacités' },
    description: { en: 'Training, tools, staffing, and organizational capacity.', fr: 'Formation, outils et capacité organisationnelle.' },
    aliases: ['training', 'skills development'],
  },
  {
    key: 'infrastructure',
    label: { en: 'Infrastructure', fr: 'Infrastructure' },
    description: { en: 'Construction, facilities, equipment, and capital assets.', fr: 'Construction, installations, équipement et immobilisations.' },
    aliases: ['facility', 'equipment'],
  },
]

describe('tag scoring', () => {
  it('boosts exact alias matches in lexical mode', () => {
    const result = rankTagsByKeywordOverlap(
      'The document describes staff training and skills development workshops.',
      tags,
      2,
      0.45,
    )

    expect(result[0]?.key).toBe('capacity-building')
  })

  it('combines semantic and lexical scores', async () => {
    const embeddings: Record<string, number[]> = {
      'The document provides training for local coordinators.': [1, 0],
      'Capacity building. Training, tools, staffing, and organizational capacity. Capacity building. Training, tools, staffing, and organizational capacity. training. skills development': [1, 0],
      'Infrastructure. Construction, facilities, equipment, and capital assets. Infrastructure. Construction, facilities, equipment, and capital assets. facility. equipment': [0, 1],
    }

    const result = await scoreTagSuggestions(
      {
        text: 'The document provides training for local coordinators.',
        tags,
      },
      resolveTagExtractorConfig({ minScore: 0 }),
      async (text) => embeddings[text] ?? [0, 0],
    )

    expect(result[0]?.key).toBe('capacity-building')
    expect(result[0]?.score).toBeGreaterThan(0)
  })

  it('penalizes negated fixed-tag evidence generically', async () => {
    const result = await scoreTagSuggestions(
      {
        text: 'The project has no training, coaching, or skills development component.',
        tags,
      },
      resolveTagExtractorConfig({
        minScore: 0,
        negationPenalty: 0.4,
      }),
      async () => [1, 0],
    )

    const capacityBuilding = result.find((item) => item.key === 'capacity-building')
    expect(capacityBuilding?.negatedTermMatches).toContain('training')
    expect(capacityBuilding?.score).toBeLessThan(capacityBuilding?.semanticScore ?? 0)
  })

  it('extracts dynamic candidate tags without a predefined taxonomy', async () => {
    const result = await extractTags({
      text: 'The program provides solar training, solar installation coaching, and community retrofit planning.',
      tags: [],
      config: {
        minDynamicScore: 0,
        maxDynamicTags: 5,
      },
    })

    expect(result.predefined).toEqual([])
    expect(result.dynamic.map((item) => item.label)).toContain('solar training solar')
  })

  it('generates n-gram candidates after stopword removal', () => {
    const candidates = extractCandidatePhrases('Funding supports emergency shelter safety planning.', 1, 2)
    expect(candidates.map((item) => item.label)).toContain('emergency shelter')
  })
})

describe('tag evaluation', () => {
  const suggestions: TagSuggestion[] = [
    suggestion('capacity-building'),
    suggestion('infrastructure'),
    suggestion('irrelevant'),
  ]
  const dynamicSuggestions: DynamicTagSuggestion[] = [
    dynamicSuggestion('solar installation coaching', 0.9),
    dynamicSuggestion('community retrofit planning', 0.8),
    dynamicSuggestion('unrelated phrase', 0.7),
  ]
  const testCase = {
    id: 'evaluation-case',
    text: 'The work includes training, facilities, and solar coaching.',
    tags,
    expectedTags: ['capacity-building', 'infrastructure'],
    expectedDynamicTags: ['solar installation coaching', 'community retrofit planning'],
    rejectedTags: ['irrelevant'],
  }

  it('keeps accurate mode based on selected predictions', () => {
    const result = evaluateTagSuggestions(testCase, suggestions.slice(0, 2), dynamicSuggestions.slice(0, 1), {
      mode: 'accurate',
    })

    expect(result.precision).toBe(1)
    expect(result.recall).toBe(1)
    expect(result.f1).toBe(1)
    expect(result.dynamicRecall).toBe(0.5)
  })

  it('evaluates exploration mode with ranked top-k suggestions', () => {
    const result = evaluateTagSuggestions(testCase, suggestions, dynamicSuggestions, {
      mode: 'exploration',
      k: 3,
    })

    expect(result.precision).toBeCloseTo(2 / 3)
    expect(result.recall).toBe(1)
    expect(result.dynamicRecall).toBe(1)
    expect(result.diversity).toBe(1)
  })

  it('uses k as the exploration precision denominator even when fewer tags are returned', () => {
    const result = evaluateTagSuggestions(testCase, suggestions.slice(0, 1), dynamicSuggestions, {
      mode: 'exploration',
      k: 2,
    })

    expect(result.precision).toBe(0.5)
    expect(result.recall).toBe(0.5)
  })
})

function suggestion(key: string): TagSuggestion {
  return {
    key,
    score: 1,
    semanticScore: 1,
    lexicalScore: 0,
    exactAliasMatches: [],
    negatedTermMatches: [],
  }
}

function dynamicSuggestion(label: string, score: number): DynamicTagSuggestion {
  return {
    label,
    score,
    semanticScore: score,
    lexicalScore: 0,
    occurrences: 1,
    ngramSize: label.split(' ').length,
  }
}
