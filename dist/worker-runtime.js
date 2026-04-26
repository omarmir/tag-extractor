import {
  createTransformersTagExtractor
} from "./chunk-ASGMASG2.js";
import {
  resolveTagExtractorConfig
} from "./chunk-Y3KSGS5U.js";

// library/src/worker-runtime.ts
function registerTagExtractorWorker(scope = self) {
  let extractor = null;
  let serializedConfig = "";
  scope.onmessage = async (event) => {
    const message = event.data;
    switch (message.type) {
      case "INIT_MODEL":
        try {
          const nextConfig = resolveTagExtractorConfig(message.config);
          const nextSerializedConfig = JSON.stringify(nextConfig);
          if (!extractor || serializedConfig !== nextSerializedConfig) {
            extractor = createTransformersTagExtractor(nextConfig);
            serializedConfig = nextSerializedConfig;
          }
          await extractor.loadModel({
            onStatus: (status) => post(scope, { type: "MODEL_STATUS", ...status }),
            onProgress: (progress) => post(scope, { type: "MODEL_PROGRESS", ...progress })
          });
        } catch (error) {
          post(scope, {
            type: "WORKER_ERROR",
            message: getErrorMessage(error)
          });
        }
        break;
      case "EXTRACT_TAGS":
        try {
          if (!extractor) {
            throw new Error("Model is not initialized. Call loadModel() before extracting tags.");
          }
          const result = await extractor.extract(message.input);
          post(scope, {
            type: "EXTRACT_RESULT",
            requestId: message.requestId,
            result
          });
        } catch (error) {
          post(scope, {
            type: "WORKER_ERROR",
            requestId: message.requestId,
            message: getErrorMessage(error)
          });
        }
        break;
    }
  };
}
function post(scope, message) {
  scope.postMessage(message);
}
function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown tag extractor worker error.";
}
export {
  registerTagExtractorWorker
};
//# sourceMappingURL=worker-runtime.js.map