import {
  createTransformersTagExtractor
} from "./chunk-ASGMASG2.js";
import {
  resolveTagExtractorConfig
} from "./chunk-Y3KSGS5U.js";

// library/src/public-api.ts
var DEFAULT_K = 5;
function createTagExtractor() {
  const extractor = createTransformersTagExtractor(resolveTagExtractorConfig());
  return {
    loadModel(callbacks) {
      return extractor.loadModel(callbacks);
    },
    async extract(request) {
      return toPublicResult(
        await extractor.extract(toInternalRequest(request)),
        request.predefinedTags
      );
    },
    reset() {
      extractor.reset(resolveTagExtractorConfig());
    }
  };
}
async function extractTextTags(request) {
  const extractor = createTagExtractor();
  return extractor.extract(request);
}
function toInternalRequest(request) {
  const k = normalizeK(request.k);
  return {
    text: request.text,
    tags: request.predefinedTags.map(toInternalTag),
    config: {
      minScore: 0,
      maxSuggestions: k,
      minDynamicScore: 0,
      maxDynamicTags: request.allowDynamicTags === false ? 0 : k
    }
  };
}
function toInternalTag(tag) {
  return {
    key: tag.key,
    label: {
      en: tag.label,
      fr: tag.label
    },
    description: {
      en: tag.description ?? tag.label,
      fr: tag.description ?? tag.label
    },
    aliases: tag.aliases ?? []
  };
}
function toPublicResult(result, tags) {
  const labels = new Map(tags.map((tag) => [tag.key, tag.label]));
  return {
    predefined: result.predefined.map((suggestion) => toPredefinedResult(suggestion, labels)),
    dynamic: result.dynamic.map(toDynamicResult)
  };
}
function toPredefinedResult(suggestion, labels) {
  return {
    key: suggestion.key,
    label: labels.get(suggestion.key) ?? suggestion.key,
    score: suggestion.score
  };
}
function toDynamicResult(suggestion) {
  return {
    label: suggestion.label,
    score: suggestion.score
  };
}
function normalizeK(k) {
  if (typeof k !== "number" || !Number.isFinite(k)) {
    return DEFAULT_K;
  }
  return Math.max(1, Math.floor(k));
}
export {
  createTagExtractor,
  extractTextTags
};
//# sourceMappingURL=index.js.map