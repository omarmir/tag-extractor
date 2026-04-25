import { resolveTagExtractorConfig } from './defaults'
import { createTransformersTagExtractor } from './transformers-tag-extractor'
import type {
  TagExtractor,
  TagExtractorWorkerEvent,
  TagExtractorWorkerRequest,
} from './types'

type WorkerScope = {
  onmessage: ((event: MessageEvent<TagExtractorWorkerRequest>) => void | Promise<void>) | null
  postMessage(message: TagExtractorWorkerEvent): void
}

export function registerTagExtractorWorker(scope: WorkerScope = self as unknown as WorkerScope) {
  let extractor: TagExtractor | null = null
  let serializedConfig = ''

  scope.onmessage = async (event: MessageEvent<TagExtractorWorkerRequest>) => {
    const message = event.data

    switch (message.type) {
      case 'INIT_MODEL':
        try {
          const nextConfig = resolveTagExtractorConfig(message.config)
          const nextSerializedConfig = JSON.stringify(nextConfig)
          if (!extractor || serializedConfig !== nextSerializedConfig) {
            extractor = createTransformersTagExtractor(nextConfig)
            serializedConfig = nextSerializedConfig
          }

          await extractor.loadModel({
            onStatus: (status) => post(scope, { type: 'MODEL_STATUS', ...status }),
            onProgress: (progress) => post(scope, { type: 'MODEL_PROGRESS', ...progress }),
          })
        } catch (error) {
          post(scope, {
            type: 'WORKER_ERROR',
            message: getErrorMessage(error),
          })
        }
        break

      case 'EXTRACT_TAGS':
        try {
          if (!extractor) {
            throw new Error('Model is not initialized. Call loadModel() before extracting tags.')
          }

          const result = await extractor.extract(message.input)
          post(scope, {
            type: 'EXTRACT_RESULT',
            requestId: message.requestId,
            result,
          })
        } catch (error) {
          post(scope, {
            type: 'WORKER_ERROR',
            requestId: message.requestId,
            message: getErrorMessage(error),
          })
        }
        break
    }
  }
}

function post(scope: WorkerScope, message: TagExtractorWorkerEvent) {
  scope.postMessage(message)
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unknown tag extractor worker error.'
}
