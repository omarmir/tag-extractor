import type { TagExtractorScorerConfig, TagExtractorScorerConfigInput } from './types'

export const DEFAULT_TAG_EXTRACTOR_CONFIG: TagExtractorScorerConfig = {
  task: 'feature-extraction',
  modelId: 'Xenova/all-MiniLM-L6-v2',
  dtype: 'q8',
  minScore: 0.36,
  maxSuggestions: 4,
  maxDynamicTags: 6,
  minDynamicScore: 0.34,
  dynamicNgramMin: 1,
  dynamicNgramMax: 3,
  semanticWeight: 0.75,
  lexicalWeight: 0.25,
  exactAliasBoost: 0.45,
  modelSource: {
    mode: 'local',
    localModelPath: '/models/',
    remoteHost: 'https://huggingface.co',
    remotePathTemplate: '{modelId}/resolve/{revision}/',
    revision: 'main',
    useBrowserCache: true,
  },
  execution: {
    device: 'cpu',
    useEmbeddingCache: true,
  },
}

export function resolveTagExtractorConfig(input: TagExtractorScorerConfigInput = {}): TagExtractorScorerConfig {
  return {
    ...DEFAULT_TAG_EXTRACTOR_CONFIG,
    ...input,
    modelSource: {
      ...DEFAULT_TAG_EXTRACTOR_CONFIG.modelSource,
      ...input.modelSource,
    },
    execution: {
      ...DEFAULT_TAG_EXTRACTOR_CONFIG.execution,
      ...input.execution,
    },
  }
}
