import { describe, expect, it } from 'vitest'
import { resolveTagExtractorConfig } from './defaults'
import { rankTagsByKeywordOverlap } from './lexical'
import { scoreTagSuggestions } from './scoring'
import type { TagDefinition } from './types'

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
      'The project funds staff training and skills development workshops.',
      tags,
      2,
      0.45,
    )

    expect(result[0]?.key).toBe('capacity-building')
  })

  it('combines semantic and lexical scores', async () => {
    const embeddings: Record<string, number[]> = {
      'The agreement provides training for local coordinators.': [1, 0],
      'Capacity building. Training, tools, staffing, and organizational capacity. Capacity building. Training, tools, staffing, and organizational capacity. training. skills development': [1, 0],
      'Infrastructure. Construction, facilities, equipment, and capital assets. Infrastructure. Construction, facilities, equipment, and capital assets. facility. equipment': [0, 1],
    }

    const result = await scoreTagSuggestions(
      {
        text: 'The agreement provides training for local coordinators.',
        tags,
      },
      resolveTagExtractorConfig({ minScore: 0 }),
      async (text) => embeddings[text] ?? [0, 0],
    )

    expect(result[0]?.key).toBe('capacity-building')
    expect(result[0]?.score).toBeGreaterThan(0)
  })
})
