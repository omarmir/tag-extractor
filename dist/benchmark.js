import {
  createTransformersTagExtractor
} from "./chunk-ASGMASG2.js";
import {
  applyNegationPenalty,
  buildTagText,
  cosineSimilarity,
  extractCandidatePhrases,
  extractDynamicTags,
  extractTags,
  formatDynamicTagLabel,
  rankTagsByKeywordOverlap,
  scoreLexicalOverlap,
  scoreTagSuggestions,
  tokenize
} from "./chunk-WZJK4QAE.js";
import {
  DEFAULT_TAG_EXTRACTOR_CONFIG,
  resolveTagExtractorConfig
} from "./chunk-Y3KSGS5U.js";

// library/src/evaluator.ts
function evaluateTagSuggestions(testCase, suggestions, dynamicSuggestions = [], options = {}) {
  const k = options.k;
  const selectedSuggestions = typeof k === "number" ? suggestions.slice(0, k) : suggestions;
  const selectedDynamicSuggestions = typeof k === "number" ? dynamicSuggestions.slice(0, k) : dynamicSuggestions;
  const predictedTags = selectedSuggestions.map((suggestion) => suggestion.key);
  const predictedDynamicTags = selectedDynamicSuggestions.map((suggestion) => suggestion.label);
  const expected = new Set(testCase.expectedTags);
  const expectedDynamicTags = testCase.expectedDynamicTags ?? [];
  const predictedDynamic = predictedDynamicTags.map(normalizeDynamicTag);
  const predicted = new Set(predictedTags);
  const truePositives = predictedTags.filter((tag) => expected.has(tag));
  const falsePositives = predictedTags.filter((tag) => !expected.has(tag));
  const falseNegatives = testCase.expectedTags.filter((tag) => !predicted.has(tag));
  const dynamicHits = expectedDynamicTags.filter((tag) => hasDynamicMatch(normalizeDynamicTag(tag), predictedDynamic));
  const dynamicMisses = expectedDynamicTags.filter((tag) => !hasDynamicMatch(normalizeDynamicTag(tag), predictedDynamic));
  const precisionDenominator = options.mode === "exploration" && typeof k === "number" ? k : predictedTags.length;
  const precision = precisionDenominator > 0 ? truePositives.length / precisionDenominator : expected.size === 0 ? 1 : 0;
  const recall = expected.size > 0 ? truePositives.length / expected.size : falsePositives.length === 0 ? 1 : 0;
  const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
  const dynamicRecall = expectedDynamicTags.length > 0 ? dynamicHits.length / expectedDynamicTags.length : 1;
  const diversity = calculateDiversity(predictedTags, testCase.tags?.length, k);
  return {
    id: testCase.id,
    text: testCase.text,
    expectedTags: testCase.expectedTags,
    expectedDynamicTags,
    rejectedTags: testCase.rejectedTags,
    predictedTags,
    predictedDynamicTags,
    truePositives,
    falsePositives,
    falseNegatives,
    dynamicHits,
    dynamicMisses,
    precision,
    recall,
    f1,
    dynamicRecall,
    diversity
  };
}
function summarizeTagEvaluation(results) {
  const caseCount = results.length;
  const exactMatches = results.filter(
    (result) => result.falsePositives.length === 0 && result.falseNegatives.length === 0
  ).length;
  const topMisses = [...results].sort((left, right) => left.f1 - right.f1).slice(0, 20);
  return {
    caseCount,
    meanPrecision: average(results.map((result) => result.precision)),
    meanRecall: average(results.map((result) => result.recall)),
    meanF1: average(results.map((result) => result.f1)),
    meanDynamicRecall: average(results.map((result) => result.dynamicRecall)),
    meanDiversity: average(results.map((result) => result.diversity)),
    exactMatchRate: caseCount > 0 ? exactMatches / caseCount : 0,
    topMisses
  };
}
function normalizeDynamicTag(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function hasDynamicMatch(expected, predicted) {
  return predicted.some((item) => item === expected || item.includes(expected) || expected.includes(item));
}
function calculateDiversity(predictedTags, tagCount, k) {
  const denominator = typeof k === "number" ? Math.min(k, tagCount ?? k) : Math.min(predictedTags.length, tagCount ?? predictedTags.length);
  if (denominator === 0) {
    return 1;
  }
  return Math.min(1, new Set(predictedTags).size / denominator);
}
function average(values) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// library/src/dual-model-tag-extractor.ts
var DEFAULT_PREDEFINED_MODEL_ID = "Xenova/nli-deberta-v3-xsmall";
var DEFAULT_DYNAMIC_MODEL_ID = "Xenova/all-MiniLM-L6-v2";
function createDualModelTagExtractor(inputConfig = {}) {
  let config = resolveTagExtractorConfig({
    ...inputConfig,
    modelId: inputConfig.dynamicModelId ?? inputConfig.modelId ?? DEFAULT_DYNAMIC_MODEL_ID,
    dtype: inputConfig.dynamicDtype ?? inputConfig.dtype ?? "q8"
  });
  let predefinedModelId = inputConfig.predefinedModelId ?? DEFAULT_PREDEFINED_MODEL_ID;
  let predefinedDtype = inputConfig.predefinedDtype ?? "q8";
  let dynamicExtractorPromise = null;
  let zeroShotPromise = null;
  const embeddingCache = /* @__PURE__ */ new Map();
  const loadModel = async (callbacks = {}) => {
    callbacks.onStatus?.({ phase: "loading", message: `Loading ${predefinedModelId} and ${config.modelId}` });
    const transformers = await import("@huggingface/transformers");
    configureTransformers(transformers, config, callbacks);
    if (!zeroShotPromise) {
      zeroShotPromise = transformers.pipeline("zero-shot-classification", predefinedModelId, {
        dtype: predefinedDtype
      });
    }
    if (!dynamicExtractorPromise) {
      dynamicExtractorPromise = transformers.pipeline("feature-extraction", config.modelId, {
        dtype: config.dtype
      });
    }
    await Promise.all([zeroShotPromise, dynamicExtractorPromise]);
    callbacks.onStatus?.({ phase: "ready", message: `${predefinedModelId} and ${config.modelId} ready` });
  };
  const embed = async (text) => {
    if (config.execution.useEmbeddingCache) {
      const cached = embeddingCache.get(text);
      if (cached) {
        return cached;
      }
    }
    await loadModel();
    const extractor = await dynamicExtractorPromise;
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
        await loadModel();
        const [predefined, dynamic] = await Promise.all([
          scoreZeroShotTags(input, config, await zeroShotPromise),
          extractDynamicTags(input, config, embed)
        ]);
        return { predefined, dynamic };
      } catch {
        const { extractTags: extractTags2 } = await import("./scoring-VWQATRFO.js");
        return await extractTags2(input, void 0, config);
      }
    },
    reset(nextConfig = {}) {
      config = resolveTagExtractorConfig({
        ...nextConfig,
        modelId: nextConfig.dynamicModelId ?? nextConfig.modelId ?? DEFAULT_DYNAMIC_MODEL_ID,
        dtype: nextConfig.dynamicDtype ?? nextConfig.dtype ?? "q8"
      });
      predefinedModelId = nextConfig.predefinedModelId ?? DEFAULT_PREDEFINED_MODEL_ID;
      predefinedDtype = nextConfig.predefinedDtype ?? "q8";
      dynamicExtractorPromise = null;
      zeroShotPromise = null;
      embeddingCache.clear();
    }
  };
}
async function scoreZeroShotTags(input, config, classifier) {
  const text = input.text.trim();
  const tags = input.tags ?? [];
  if (!text || tags.length === 0 || !classifier) {
    return [];
  }
  const locale = input.locale ?? "en";
  const mergedConfig = {
    ...config,
    ...input.config
  };
  const labels = tags.map((tag) => tag.label[locale] || tag.key);
  const output = await classifier(text, labels, {
    multi_label: true,
    hypothesis_template: "This text is about {}."
  });
  const scores = parseZeroShotOutput(output, labels);
  return tags.map((tag) => {
    const label = tag.label[locale] || tag.key;
    const zeroShotScore = scores.get(label) ?? 0;
    const lexical = scoreLexicalOverlap(text, tag, mergedConfig.exactAliasBoost, locale, mergedConfig.negationWindow);
    const rawScore = Math.min(
      1,
      zeroShotScore * mergedConfig.semanticWeight + lexical.lexicalScore * mergedConfig.lexicalWeight
    );
    const score = applyNegationPenalty(rawScore, lexical.negatedTermMatches, mergedConfig.negationPenalty);
    return {
      key: tag.key,
      score,
      semanticScore: zeroShotScore,
      lexicalScore: lexical.lexicalScore,
      exactAliasMatches: lexical.exactAliasMatches,
      negatedTermMatches: lexical.negatedTermMatches
    };
  }).filter((item) => item.score >= mergedConfig.minScore).sort((left, right) => right.score - left.score).slice(0, mergedConfig.maxSuggestions);
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
function parseZeroShotOutput(output, fallbackLabels) {
  const scores = /* @__PURE__ */ new Map();
  if (isZeroShotOutput(output)) {
    output.labels.forEach((label, index) => {
      scores.set(label, Number(output.scores[index] ?? 0));
    });
    return scores;
  }
  if (Array.isArray(output)) {
    output.forEach((item, index) => {
      if (isZeroShotOutput(item)) {
        item.labels.forEach((label, labelIndex) => {
          scores.set(label, Math.max(scores.get(label) ?? 0, Number(item.scores[labelIndex] ?? 0)));
        });
      } else if (typeof item === "number") {
        scores.set(fallbackLabels[index] ?? `${index}`, item);
      }
    });
  }
  return scores;
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
function isZeroShotOutput(value) {
  return typeof value === "object" && value !== null && Array.isArray(value.labels) && Array.isArray(value.scores);
}
function isTensorLike(value) {
  return typeof value === "object" && value !== null && "data" in value && typeof value.data?.length === "number";
}
function isProgress(value) {
  return typeof value === "object" && value !== null && typeof value.progress === "number" && typeof value.loaded === "number" && typeof value.total === "number";
}

// library/src/worker-client.ts
function createTagExtractorWorkerClient(options) {
  let config = resolveTagExtractorConfig(options.config);
  const worker = options.createWorker();
  const pending = /* @__PURE__ */ new Map();
  let nextRequestId = 1;
  worker.addEventListener("message", (event) => {
    const message = event.data;
    if (message.type === "MODEL_STATUS") {
      options.onModelStatus?.({
        phase: message.phase,
        message: message.message
      });
      return;
    }
    if (message.type === "MODEL_PROGRESS") {
      options.onModelProgress?.({
        progress: message.progress,
        loaded: message.loaded,
        total: message.total,
        file: message.file
      });
      return;
    }
    if (message.type === "EXTRACT_RESULT") {
      const request = pending.get(message.requestId);
      if (!request) {
        return;
      }
      pending.delete(message.requestId);
      request.resolve(message.result);
      return;
    }
    if (message.type === "WORKER_ERROR" && message.requestId) {
      const request = pending.get(message.requestId);
      if (!request) {
        return;
      }
      pending.delete(message.requestId);
      request.reject(new Error(message.message));
    }
  });
  const loadModel = async (nextConfig) => {
    if (nextConfig) {
      config = resolveTagExtractorConfig(nextConfig);
    }
    worker.postMessage({
      type: "INIT_MODEL",
      config
    });
  };
  return {
    loadModel,
    extract(input) {
      const requestId = String(nextRequestId);
      nextRequestId += 1;
      return new Promise((resolve, reject) => {
        pending.set(requestId, { resolve, reject });
        worker.postMessage({
          type: "EXTRACT_TAGS",
          requestId,
          input
        });
      });
    },
    async reset(nextConfig = {}) {
      config = resolveTagExtractorConfig(nextConfig);
      await loadModel(config);
    },
    terminate() {
      worker.terminate();
      pending.clear();
    },
    getConfig() {
      return config;
    }
  };
}
export {
  DEFAULT_TAG_EXTRACTOR_CONFIG,
  applyNegationPenalty,
  buildTagText,
  cosineSimilarity,
  createDualModelTagExtractor,
  createTagExtractorWorkerClient,
  createTransformersTagExtractor,
  evaluateTagSuggestions,
  extractCandidatePhrases,
  extractDynamicTags,
  extractTags,
  formatDynamicTagLabel,
  rankTagsByKeywordOverlap,
  resolveTagExtractorConfig,
  scoreLexicalOverlap,
  scoreTagSuggestions,
  summarizeTagEvaluation,
  tokenize
};
//# sourceMappingURL=benchmark.js.map