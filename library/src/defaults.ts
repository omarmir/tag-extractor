import type { TagExtractorScorerConfig, TagExtractorScorerConfigInput } from './types'

export const DEFAULT_TAG_EXTRACTOR_CONFIG: TagExtractorScorerConfig = {
  task: 'feature-extraction',
  modelId: 'Xenova/all-MiniLM-L12-v2',
  dtype: 'q8',
  minScore: 0.36,
  maxSuggestions: 5,
  maxDynamicTags: 5,
  minDynamicScore: 0.34,
  dynamicNgramMin: 1,
  dynamicNgramMax: 3,
  semanticWeight: 0.75,
  lexicalWeight: 0.25,
  exactAliasBoost: 0.45,
  negationPenalty: 0.45,
  negationWindow: 6,
  modelSource: {
    mode: 'local',
    localModelPath: getDefaultLocalModelPath(),
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

function getDefaultLocalModelPath() {
  const viteBase = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL
  if (typeof viteBase === 'string' && viteBase.length > 0) {
    return `${viteBase.replace(/\/?$/, '/')}models/`
  }

  return '/models/'
}
