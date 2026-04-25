import { resolveTagExtractorConfig } from './defaults'
import type {
  TagExtractionInput,
  TagExtractorScorerConfig,
  TagExtractorScorerConfigInput,
  TagExtractorWorkerClient,
  TagExtractorWorkerClientOptions,
  TagExtractorWorkerEvent,
  TagExtractionResult,
} from './types'

type PendingRequest = {
  resolve: (value: TagExtractionResult) => void
  reject: (reason: Error) => void
}

export function createTagExtractorWorkerClient(options: TagExtractorWorkerClientOptions): TagExtractorWorkerClient {
  let config = resolveTagExtractorConfig(options.config)
  const worker = options.createWorker()
  const pending = new Map<string, PendingRequest>()
  let nextRequestId = 1

  worker.addEventListener('message', (event: MessageEvent<TagExtractorWorkerEvent>) => {
    const message = event.data

    if (message.type === 'MODEL_STATUS') {
      options.onModelStatus?.({
        phase: message.phase,
        message: message.message,
      })
      return
    }

    if (message.type === 'MODEL_PROGRESS') {
      options.onModelProgress?.({
        progress: message.progress,
        loaded: message.loaded,
        total: message.total,
        file: message.file,
      })
      return
    }

    if (message.type === 'EXTRACT_RESULT') {
      const request = pending.get(message.requestId)
      if (!request) {
        return
      }

      pending.delete(message.requestId)
      request.resolve(message.result)
      return
    }

    if (message.type === 'WORKER_ERROR' && message.requestId) {
      const request = pending.get(message.requestId)
      if (!request) {
        return
      }

      pending.delete(message.requestId)
      request.reject(new Error(message.message))
    }
  })

  const loadModel = async (nextConfig?: TagExtractorScorerConfigInput) => {
    if (nextConfig) {
      config = resolveTagExtractorConfig(nextConfig)
    }

    worker.postMessage({
      type: 'INIT_MODEL',
      config,
    })
  }

  return {
    loadModel,
    extract(input: TagExtractionInput) {
      const requestId = String(nextRequestId)
      nextRequestId += 1

      return new Promise<TagExtractionResult>((resolve, reject) => {
        pending.set(requestId, { resolve, reject })
        worker.postMessage({
          type: 'EXTRACT_TAGS',
          requestId,
          input,
        })
      })
    },
    async reset(nextConfig: TagExtractorScorerConfigInput = {}) {
      config = resolveTagExtractorConfig(nextConfig)
      await loadModel(config)
    },
    terminate() {
      worker.terminate()
      pending.clear()
    },
    getConfig(): TagExtractorScorerConfig {
      return config
    },
  }
}
