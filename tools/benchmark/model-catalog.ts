export type ModelCandidate = {
  id: string
  strategy: 'unified-embedding' | 'zero-shot' | 'dual-model'
  modelId: string
  predefinedModelId?: string
  dynamicModelId?: string
  dtype: 'q8' | 'fp32'
  estimatedAssetMb: number
  benchmarkConfig?: {
    minScore?: number
    maxSuggestions?: number
    maxDynamicTags?: number
  }
  notes: string
}

export const MAX_BROWSER_MODEL_MB = 100

export const MODEL_CANDIDATES: ModelCandidate[] = [
  {
    id: 'all-minilm-l6-v2-q8',
    strategy: 'unified-embedding',
    modelId: 'Xenova/all-MiniLM-L6-v2',
    dtype: 'q8',
    estimatedAssetMb: 23,
    notes: 'Small sentence embedding baseline for English short-text similarity.',
  },
  {
    id: 'paraphrase-minilm-l3-v2-q8',
    strategy: 'unified-embedding',
    modelId: 'Xenova/paraphrase-MiniLM-L3-v2',
    dtype: 'q8',
    estimatedAssetMb: 18,
    benchmarkConfig: {
      minScore: 0.2,
      maxSuggestions: 2,
    },
    notes: 'Smaller MiniLM variant for low-latency browser use. A corpus-wide sweep selected top-2 fixed suggestions for the best F1 balance.',
  },
  {
    id: 'all-minilm-l12-v2-q8',
    strategy: 'unified-embedding',
    modelId: 'Xenova/all-MiniLM-L12-v2',
    dtype: 'q8',
    estimatedAssetMb: 45,
    notes: 'Larger MiniLM candidate for better semantic separation while staying below budget.',
  },
  {
    id: 'bge-small-en-v1-5-q8',
    strategy: 'unified-embedding',
    modelId: 'Xenova/bge-small-en-v1.5',
    dtype: 'q8',
    estimatedAssetMb: 67,
    notes: 'Small retrieval model; useful for tag-description matching.',
  },
  {
    id: 'nli-deberta-v3-xsmall-q8',
    strategy: 'zero-shot',
    modelId: 'Xenova/nli-deberta-v3-xsmall',
    predefinedModelId: 'Xenova/nli-deberta-v3-xsmall',
    dtype: 'q8',
    estimatedAssetMb: 33,
    notes: 'Zero-shot classification only for fixed taxonomy tags; dynamic extraction is intentionally disabled for this benchmark.',
  },
  {
    id: 'dual-deberta-xsmall-minilm-l6-v2-q8',
    strategy: 'dual-model',
    modelId: 'Xenova/all-MiniLM-L6-v2',
    predefinedModelId: 'Xenova/nli-deberta-v3-xsmall',
    dynamicModelId: 'Xenova/all-MiniLM-L6-v2',
    dtype: 'q8',
    estimatedAssetMb: 55,
    notes: 'Dual path: zero-shot NLI for predefined tags plus MiniLM KeyBERT-style dynamic extraction.',
  },
  {
    id: 'dual-deberta-xsmall-bge-micro-v2-q8',
    strategy: 'dual-model',
    modelId: 'SmartComponents/bge-micro-v2',
    predefinedModelId: 'Xenova/nli-deberta-v3-xsmall',
    dynamicModelId: 'SmartComponents/bge-micro-v2',
    dtype: 'q8',
    estimatedAssetMb: 78,
    notes: 'Dual path: zero-shot NLI for predefined tags plus BGE micro dynamic extraction.',
  },
]

export const getBenchmarkModelCandidates = () =>
  MODEL_CANDIDATES.filter((candidate) => candidate.estimatedAssetMb <= MAX_BROWSER_MODEL_MB)
