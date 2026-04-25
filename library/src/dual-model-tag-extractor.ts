import { resolveTagExtractorConfig } from './defaults'
import { applyNegationPenalty, scoreLexicalOverlap } from './lexical'
import { extractDynamicTags } from './scoring'
import type {
  DualModelTagExtractorConfigInput,
  TagDefinition,
  TagExtractionInput,
  TagExtractor,
  TagExtractorLoadCallbacks,
  TagExtractorScorerConfig,
  TagSuggestion,
} from './types'

type TransformersModule = typeof import('@huggingface/transformers')
type FeatureExtractionPipeline = (text: string, options: { pooling: 'mean'; normalize: true }) => Promise<unknown>
type ZeroShotPipeline = (
  text: string,
  labels: string[],
  options?: { multi_label?: boolean; hypothesis_template?: string },
) => Promise<unknown>

const DEFAULT_PREDEFINED_MODEL_ID = 'Xenova/nli-deberta-v3-xsmall'
const DEFAULT_DYNAMIC_MODEL_ID = 'Xenova/all-MiniLM-L6-v2'

export function createDualModelTagExtractor(inputConfig: DualModelTagExtractorConfigInput = {}): TagExtractor {
  let config = resolveTagExtractorConfig({
    ...inputConfig,
    modelId: inputConfig.dynamicModelId ?? inputConfig.modelId ?? DEFAULT_DYNAMIC_MODEL_ID,
    dtype: inputConfig.dynamicDtype ?? inputConfig.dtype ?? 'q8',
  })
  let predefinedModelId = inputConfig.predefinedModelId ?? DEFAULT_PREDEFINED_MODEL_ID
  let predefinedDtype = inputConfig.predefinedDtype ?? 'q8'
  let dynamicExtractorPromise: Promise<FeatureExtractionPipeline> | null = null
  let zeroShotPromise: Promise<ZeroShotPipeline> | null = null
  const embeddingCache = new Map<string, number[]>()

  const loadModel = async (callbacks: TagExtractorLoadCallbacks = {}) => {
    callbacks.onStatus?.({ phase: 'loading', message: `Loading ${predefinedModelId} and ${config.modelId}` })

    const transformers = await import('@huggingface/transformers') as TransformersModule
    configureTransformers(transformers, config, callbacks)

    if (!zeroShotPromise) {
      zeroShotPromise = transformers.pipeline('zero-shot-classification', predefinedModelId, {
        dtype: predefinedDtype,
      }) as Promise<ZeroShotPipeline>
    }

    if (!dynamicExtractorPromise) {
      dynamicExtractorPromise = transformers.pipeline('feature-extraction', config.modelId, {
        dtype: config.dtype,
      }) as Promise<FeatureExtractionPipeline>
    }

    await Promise.all([zeroShotPromise, dynamicExtractorPromise])
    callbacks.onStatus?.({ phase: 'ready', message: `${predefinedModelId} and ${config.modelId} ready` })
  }

  const embed = async (text: string) => {
    if (config.execution.useEmbeddingCache) {
      const cached = embeddingCache.get(text)
      if (cached) {
        return cached
      }
    }

    await loadModel()
    const extractor = await dynamicExtractorPromise
    if (!extractor) {
      return []
    }

    const output = await extractor(text, {
      pooling: 'mean',
      normalize: true,
    })
    const vector = toVector(output)
    if (config.execution.useEmbeddingCache) {
      embeddingCache.set(text, vector)
    }
    return vector
  }

  return {
    get config() {
      return config
    },
    loadModel,
    async extract(input: TagExtractionInput) {
      try {
        await loadModel()
        const [predefined, dynamic] = await Promise.all([
          scoreZeroShotTags(input, config, await zeroShotPromise),
          extractDynamicTags(input, config, embed),
        ])
        return { predefined, dynamic }
      } catch {
        const { extractTags } = await import('./scoring')
        return await extractTags(input, undefined, config)
      }
    },
    reset(nextConfig: DualModelTagExtractorConfigInput = {}) {
      config = resolveTagExtractorConfig({
        ...nextConfig,
        modelId: nextConfig.dynamicModelId ?? nextConfig.modelId ?? DEFAULT_DYNAMIC_MODEL_ID,
        dtype: nextConfig.dynamicDtype ?? nextConfig.dtype ?? 'q8',
      })
      predefinedModelId = nextConfig.predefinedModelId ?? DEFAULT_PREDEFINED_MODEL_ID
      predefinedDtype = nextConfig.predefinedDtype ?? 'q8'
      dynamicExtractorPromise = null
      zeroShotPromise = null
      embeddingCache.clear()
    },
  }
}

async function scoreZeroShotTags(
  input: TagExtractionInput,
  config: TagExtractorScorerConfig,
  classifier: ZeroShotPipeline | null,
): Promise<TagSuggestion[]> {
  const text = input.text.trim()
  const tags = input.tags ?? []
  if (!text || tags.length === 0 || !classifier) {
    return []
  }

  const locale = input.locale ?? 'en'
  const mergedConfig = {
    ...config,
    ...input.config,
  }
  const labels = tags.map((tag) => tag.label[locale] || tag.key)
  const output = await classifier(text, labels, {
    multi_label: true,
    hypothesis_template: 'This text is about {}.',
  })
  const scores = parseZeroShotOutput(output, labels)

  return tags
    .map((tag): TagSuggestion => {
      const label = tag.label[locale] || tag.key
      const zeroShotScore = scores.get(label) ?? 0
      const lexical = scoreLexicalOverlap(text, tag, mergedConfig.exactAliasBoost, locale, mergedConfig.negationWindow)
      const rawScore = Math.min(
        1,
        (zeroShotScore * mergedConfig.semanticWeight) + (lexical.lexicalScore * mergedConfig.lexicalWeight),
      )
      const score = applyNegationPenalty(rawScore, lexical.negatedTermMatches, mergedConfig.negationPenalty)
      return {
        key: tag.key,
        score,
        semanticScore: zeroShotScore,
        lexicalScore: lexical.lexicalScore,
        exactAliasMatches: lexical.exactAliasMatches,
        negatedTermMatches: lexical.negatedTermMatches,
      }
    })
    .filter((item) => item.score >= mergedConfig.minScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, mergedConfig.maxSuggestions)
}

function configureTransformers(
  transformers: TransformersModule,
  config: TagExtractorScorerConfig,
  callbacks: TagExtractorLoadCallbacks,
) {
  transformers.env.allowRemoteModels = config.modelSource.mode === 'huggingface' || config.modelSource.mode === 'url'
  transformers.env.allowLocalModels = config.modelSource.mode === 'local'
  transformers.env.useBrowserCache = config.modelSource.useBrowserCache === 'auto'
    ? typeof caches !== 'undefined'
    : config.modelSource.useBrowserCache && typeof caches !== 'undefined'

  if (config.modelSource.mode === 'local') {
    transformers.env.localModelPath = config.modelSource.localModelPath
  }

  const env = transformers.env as TransformersModule['env'] & {
    progress_callback?: (progress: unknown) => void
  }
  if (env.backends.onnx.wasm) {
    env.backends.onnx.wasm.proxy = false
    env.backends.onnx.wasm.wasmPaths = ''
  }
  env.progress_callback = (progress: unknown) => {
    if (!isProgress(progress)) {
      return
    }

    callbacks.onProgress?.({
      progress: progress.progress,
      loaded: progress.loaded,
      total: progress.total,
      file: typeof progress.file === 'string' ? progress.file : undefined,
    })
  }
}

function parseZeroShotOutput(output: unknown, fallbackLabels: string[]) {
  const scores = new Map<string, number>()
  if (isZeroShotOutput(output)) {
    output.labels.forEach((label, index) => {
      scores.set(label, Number(output.scores[index] ?? 0))
    })
    return scores
  }

  if (Array.isArray(output)) {
    output.forEach((item, index) => {
      if (isZeroShotOutput(item)) {
        item.labels.forEach((label, labelIndex) => {
          scores.set(label, Math.max(scores.get(label) ?? 0, Number(item.scores[labelIndex] ?? 0)))
        })
      } else if (typeof item === 'number') {
        scores.set(fallbackLabels[index] ?? `${index}`, item)
      }
    })
  }

  return scores
}

function toVector(output: unknown): number[] {
  if (isTensorLike(output)) {
    return Array.from(output.data)
  }

  if (Array.isArray(output)) {
    return output.flat(Number.POSITIVE_INFINITY).filter((value): value is number => typeof value === 'number')
  }

  return []
}

function isZeroShotOutput(value: unknown): value is { labels: string[]; scores: number[] } {
  return typeof value === 'object'
    && value !== null
    && Array.isArray((value as { labels?: unknown }).labels)
    && Array.isArray((value as { scores?: unknown }).scores)
}

function isTensorLike(value: unknown): value is { data: ArrayLike<number> } {
  return typeof value === 'object'
    && value !== null
    && 'data' in value
    && typeof (value as { data?: { length?: unknown } }).data?.length === 'number'
}

function isProgress(value: unknown): value is { progress: number; loaded: number; total: number; file?: unknown } {
  return typeof value === 'object'
    && value !== null
    && typeof (value as { progress?: unknown }).progress === 'number'
    && typeof (value as { loaded?: unknown }).loaded === 'number'
    && typeof (value as { total?: unknown }).total === 'number'
}
