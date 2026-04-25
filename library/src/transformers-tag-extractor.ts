import { resolveTagExtractorConfig } from './defaults'
import type {
  TagExtractionInput,
  TagExtractor,
  TagExtractorLoadCallbacks,
  TagExtractorScorerConfig,
  TagExtractorScorerConfigInput,
} from './types'

type TransformersModule = typeof import('@huggingface/transformers')
type FeatureExtractionPipeline = (text: string, options: { pooling: 'mean'; normalize: true }) => Promise<unknown>

export function createTransformersTagExtractor(inputConfig: TagExtractorScorerConfigInput = {}): TagExtractor {
  let config = resolveTagExtractorConfig(inputConfig)
  let extractorPromise: Promise<FeatureExtractionPipeline> | null = null
  const embeddingCache = new Map<string, number[]>()

  const loadModel = async (callbacks: TagExtractorLoadCallbacks = {}) => {
    callbacks.onStatus?.({ phase: 'loading', message: `Loading ${config.modelId}` })

    if (!extractorPromise) {
      const transformers = await import('@huggingface/transformers') as TransformersModule
      configureTransformers(transformers, config, callbacks)
      extractorPromise = transformers.pipeline(config.task, config.modelId, {
        dtype: config.dtype,
      }) as Promise<FeatureExtractionPipeline>
    }

    await extractorPromise
    callbacks.onStatus?.({ phase: 'ready', message: `${config.modelId} ready` })
  }

  const embed = async (text: string) => {
    if (config.execution.useEmbeddingCache) {
      const cached = embeddingCache.get(text)
      if (cached) {
        return cached
      }
    }

    await loadModel()
    const extractor = await extractorPromise
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
        const { extractTags } = await import('./scoring')
        return await extractTags(input, embed, config)
      } catch {
        const { extractTags } = await import('./scoring')
        return await extractTags(input, undefined, config)
      }
    },
    reset(nextConfig: TagExtractorScorerConfigInput = {}) {
      config = resolveTagExtractorConfig(nextConfig)
      extractorPromise = null
      embeddingCache.clear()
    },
  }
}

function configureTransformers(
  transformers: TransformersModule,
  config: TagExtractorScorerConfig,
  callbacks: TagExtractorLoadCallbacks,
) {
  transformers.env.allowRemoteModels = config.modelSource.mode === 'huggingface' || config.modelSource.mode === 'url'
  transformers.env.allowLocalModels = config.modelSource.mode === 'local'
  transformers.env.useBrowserCache = config.modelSource.useBrowserCache === 'auto'
    ? true
    : config.modelSource.useBrowserCache

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

function toVector(output: unknown): number[] {
  if (isTensorLike(output)) {
    return Array.from(output.data)
  }

  if (Array.isArray(output)) {
    return output.flat(Number.POSITIVE_INFINITY).filter((value): value is number => typeof value === 'number')
  }

  return []
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
