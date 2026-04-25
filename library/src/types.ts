export type TagExtractorLocale = 'en' | 'fr'

export type TagExtractorModelPhase = 'idle' | 'loading' | 'ready' | 'error'

export type TagExtractorModelSourceMode = 'local' | 'url' | 'huggingface'

export type TagExtractorModelSourceConfig = {
  mode: TagExtractorModelSourceMode
  localModelPath: string
  remoteHost: string
  remotePathTemplate: string
  revision: string
  useBrowserCache: boolean | 'auto'
}

export type TagExtractorExecutionConfig = {
  device: 'cpu' | 'wasm' | 'webgpu'
  useEmbeddingCache: boolean
}

export type TagExtractorScorerConfig = {
  task: 'feature-extraction'
  modelId: string
  dtype: 'auto' | 'q8' | 'fp32' | 'fp16' | 'int8' | 'uint8' | 'q4' | 'bnb4' | 'q4f16'
  minScore: number
  maxSuggestions: number
  semanticWeight: number
  lexicalWeight: number
  exactAliasBoost: number
  modelSource: TagExtractorModelSourceConfig
  execution: TagExtractorExecutionConfig
}

export type TagExtractorScorerConfigInput = Partial<Omit<TagExtractorScorerConfig, 'modelSource' | 'execution'>> & {
  modelSource?: Partial<TagExtractorModelSourceConfig>
  execution?: Partial<TagExtractorExecutionConfig>
}

export type TagDefinition = {
  key: string
  label: Record<TagExtractorLocale, string>
  description: Record<TagExtractorLocale, string>
  aliases: string[]
}

export type TagExtractionInput = {
  text: string
  tags: TagDefinition[]
  locale?: TagExtractorLocale
  config?: Partial<Pick<TagExtractorScorerConfig, 'minScore' | 'maxSuggestions' | 'semanticWeight' | 'lexicalWeight' | 'exactAliasBoost'>>
}

export type TagSuggestion = {
  key: string
  score: number
  semanticScore: number
  lexicalScore: number
  exactAliasMatches: string[]
}

export type TagExtractorModelStatusEvent = {
  phase: TagExtractorModelPhase
  message: string
}

export type TagExtractorModelProgressEvent = {
  progress: number
  loaded: number
  total: number
  file?: string
}

export type TagExtractorLoadCallbacks = {
  onStatus?: (event: TagExtractorModelStatusEvent) => void
  onProgress?: (event: TagExtractorModelProgressEvent) => void
}

export type TagExtractor = {
  readonly config: TagExtractorScorerConfig
  loadModel(callbacks?: TagExtractorLoadCallbacks): Promise<void>
  extract(input: TagExtractionInput): Promise<TagSuggestion[]>
  reset(nextConfig?: TagExtractorScorerConfigInput): void
}

export type TagExtractorWorkerClientOptions = {
  config: TagExtractorScorerConfigInput
  createWorker: () => Worker
  onModelStatus?: (event: TagExtractorModelStatusEvent) => void
  onModelProgress?: (event: TagExtractorModelProgressEvent) => void
}

export type TagExtractorWorkerClient = {
  loadModel(nextConfig?: TagExtractorScorerConfigInput): Promise<void>
  extract(input: TagExtractionInput): Promise<TagSuggestion[]>
  reset(nextConfig?: TagExtractorScorerConfigInput): Promise<void>
  terminate(): void
  getConfig(): TagExtractorScorerConfig
}

export type TagExtractorWorkerRequest =
  | {
      type: 'INIT_MODEL'
      config: TagExtractorScorerConfig
    }
  | {
      type: 'EXTRACT_TAGS'
      requestId: string
      input: TagExtractionInput
    }

export type TagExtractorWorkerEvent =
  | {
      type: 'MODEL_STATUS'
      phase: TagExtractorModelPhase
      message: string
    }
  | {
      type: 'MODEL_PROGRESS'
      progress: number
      loaded: number
      total: number
      file?: string
    }
  | {
      type: 'EXTRACT_RESULT'
      requestId: string
      suggestions: TagSuggestion[]
    }
  | {
      type: 'WORKER_ERROR'
      requestId?: string
      message: string
    }
