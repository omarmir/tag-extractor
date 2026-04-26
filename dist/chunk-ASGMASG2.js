import {
  resolveTagExtractorConfig
} from "./chunk-Y3KSGS5U.js";

// library/src/transformers-tag-extractor.ts
function createTransformersTagExtractor(inputConfig = {}) {
  let config = resolveTagExtractorConfig(inputConfig);
  let extractorPromise = null;
  const embeddingCache = /* @__PURE__ */ new Map();
  const loadModel = async (callbacks = {}) => {
    callbacks.onStatus?.({ phase: "loading", message: `Loading ${config.modelId}` });
    if (!extractorPromise) {
      const transformers = await import("@huggingface/transformers");
      configureTransformers(transformers, config, callbacks);
      extractorPromise = transformers.pipeline(config.task, config.modelId, {
        dtype: config.dtype
      });
    }
    await extractorPromise;
    callbacks.onStatus?.({ phase: "ready", message: `${config.modelId} ready` });
  };
  const embed = async (text) => {
    if (config.execution.useEmbeddingCache) {
      const cached = embeddingCache.get(text);
      if (cached) {
        return cached;
      }
    }
    await loadModel();
    const extractor = await extractorPromise;
    if (!extractor) {
      return [];
    }
    const output = await extractor(text, {
      pooling: "mean",
      normalize: true
    });
    const vector = toVector(output);
    if (config.execution.useEmbeddingCache) {
      embeddingCache.set(text, vector);
    }
    return vector;
  };
  return {
    get config() {
      return config;
    },
    loadModel,
    async extract(input) {
      try {
        const { extractTags } = await import("./scoring-VWQATRFO.js");
        return await extractTags(input, embed, config);
      } catch {
        const { extractTags } = await import("./scoring-VWQATRFO.js");
        return await extractTags(input, void 0, config);
      }
    },
    reset(nextConfig = {}) {
      config = resolveTagExtractorConfig(nextConfig);
      extractorPromise = null;
      embeddingCache.clear();
    }
  };
}
function configureTransformers(transformers, config, callbacks) {
  transformers.env.allowRemoteModels = config.modelSource.mode === "huggingface" || config.modelSource.mode === "url";
  transformers.env.allowLocalModels = config.modelSource.mode === "local";
  transformers.env.useBrowserCache = config.modelSource.useBrowserCache === "auto" ? typeof caches !== "undefined" : config.modelSource.useBrowserCache && typeof caches !== "undefined";
  if (config.modelSource.mode === "local") {
    transformers.env.localModelPath = config.modelSource.localModelPath;
  }
  const env = transformers.env;
  if (env.backends.onnx.wasm) {
    env.backends.onnx.wasm.proxy = false;
    env.backends.onnx.wasm.wasmPaths = "";
  }
  env.progress_callback = (progress) => {
    if (!isProgress(progress)) {
      return;
    }
    callbacks.onProgress?.({
      progress: progress.progress,
      loaded: progress.loaded,
      total: progress.total,
      file: typeof progress.file === "string" ? progress.file : void 0
    });
  };
}
function toVector(output) {
  if (isTensorLike(output)) {
    return Array.from(output.data);
  }
  if (Array.isArray(output)) {
    return output.flat(Number.POSITIVE_INFINITY).filter((value) => typeof value === "number");
  }
  return [];
}
function isTensorLike(value) {
  return typeof value === "object" && value !== null && "data" in value && typeof value.data?.length === "number";
}
function isProgress(value) {
  return typeof value === "object" && value !== null && typeof value.progress === "number" && typeof value.loaded === "number" && typeof value.total === "number";
}

export {
  createTransformersTagExtractor
};
//# sourceMappingURL=chunk-ASGMASG2.js.map