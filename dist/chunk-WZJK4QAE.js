import {
  resolveTagExtractorConfig
} from "./chunk-Y3KSGS5U.js";

// library/src/lexical.ts
function tokenize(value) {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
}
function buildTagText(tag, locale = "en") {
  return [
    tag.label[locale],
    tag.description[locale],
    tag.label.en,
    tag.description.en,
    ...tag.aliases
  ].map((item) => item.trim()).filter((item) => item.length > 0).join(". ");
}
function scoreLexicalOverlap(text, tag, exactAliasBoost, locale = "en", negationWindow = 6) {
  const textTokens = new Set(tokenize(text));
  const tagTokens = new Set(tokenize(buildTagText(tag, locale)));
  const hits = Array.from(tagTokens).filter((token) => textTokens.has(token)).length;
  const exactAliasMatches = tag.aliases.filter((alias) => {
    const aliasTokens = tokenize(alias);
    return aliasTokens.length > 0 && aliasTokens.every((token) => textTokens.has(token));
  });
  const negatedTermMatches = findNegatedTermMatches(text, tag, locale, negationWindow);
  const overlap = tagTokens.size > 0 ? hits / tagTokens.size : 0;
  return {
    lexicalScore: Math.min(1, overlap + (exactAliasMatches.length > 0 ? exactAliasBoost : 0)),
    exactAliasMatches,
    negatedTermMatches
  };
}
function rankTagsByKeywordOverlap(text, tags, maxSuggestions, exactAliasBoost, locale = "en", negationPenalty = 0.45, negationWindow = 6) {
  return tags.map((tag) => {
    const lexical = scoreLexicalOverlap(text, tag, exactAliasBoost, locale, negationWindow);
    const score = applyNegationPenalty(lexical.lexicalScore, lexical.negatedTermMatches, negationPenalty);
    return {
      key: tag.key,
      score,
      semanticScore: 0,
      ...lexical
    };
  }).filter((item) => item.score > 0).sort((left, right) => right.score - left.score).slice(0, maxSuggestions);
}
function applyNegationPenalty(score, negatedTermMatches, negationPenalty) {
  if (negatedTermMatches.length === 0) {
    return score;
  }
  return score * Math.max(0, Math.min(1, negationPenalty));
}
function findNegatedTermMatches(text, tag, locale, windowSize) {
  const textTokens = tokenizeForNegation(text);
  const terms = [
    tag.key,
    tag.label[locale],
    tag.label.en,
    ...tag.aliases
  ];
  const matches = /* @__PURE__ */ new Set();
  for (const term of terms) {
    const termTokens = tokenizeForNegation(term).filter((token) => !NEGATION_CUES.has(token));
    if (termTokens.length === 0) {
      continue;
    }
    for (let index = 0; index <= textTokens.length - termTokens.length; index += 1) {
      const isTermAtIndex = termTokens.every((token, offset) => textTokens[index + offset] === token);
      if (!isTermAtIndex) {
        continue;
      }
      const before = textTokens.slice(Math.max(0, index - windowSize), index);
      if (before.some((token) => NEGATION_CUES.has(token))) {
        matches.add(term);
      }
    }
  }
  return Array.from(matches);
}
var NEGATION_CUES = /* @__PURE__ */ new Set([
  "absent",
  "avoid",
  "avoids",
  "denied",
  "exclude",
  "excludes",
  "excluding",
  "lack",
  "lacks",
  "neither",
  "never",
  "no",
  "none",
  "nor",
  "not",
  "omit",
  "omits",
  "outside",
  "without"
]);
function tokenizeForNegation(value) {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 1);
}

// library/src/scoring.ts
function cosineSimilarity(left, right) {
  const length = Math.min(left.length, right.length);
  if (length === 0) {
    return 0;
  }
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dot += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }
  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}
async function scoreTagSuggestions(input, config, embed) {
  const text = input.text.trim();
  const tags = dedupeTags(input.tags ?? []);
  const locale = input.locale ?? "en";
  const mergedConfig = {
    ...config,
    ...input.config
  };
  if (!text || tags.length === 0) {
    return [];
  }
  if (!embed) {
    return rankTagsByKeywordOverlap(
      text,
      tags,
      mergedConfig.maxSuggestions,
      mergedConfig.exactAliasBoost,
      locale,
      mergedConfig.negationPenalty,
      mergedConfig.negationWindow
    ).filter((item) => item.score >= mergedConfig.minScore);
  }
  const textEmbedding = await embed(text);
  const scored = await Promise.all(tags.map(async (tag) => {
    const semanticScore = cosineSimilarity(textEmbedding, await embed(buildTagText(tag, locale)));
    const lexical = scoreLexicalOverlap(text, tag, mergedConfig.exactAliasBoost, locale, mergedConfig.negationWindow);
    const rawScore = Math.min(
      1,
      semanticScore * mergedConfig.semanticWeight + lexical.lexicalScore * mergedConfig.lexicalWeight
    );
    return {
      key: tag.key,
      semanticScore,
      lexicalScore: lexical.lexicalScore,
      exactAliasMatches: lexical.exactAliasMatches,
      negatedTermMatches: lexical.negatedTermMatches,
      score: applyNegationPenalty(rawScore, lexical.negatedTermMatches, mergedConfig.negationPenalty)
    };
  }));
  return scored.filter((item) => item.key && item.score >= mergedConfig.minScore).sort((left, right) => right.score - left.score).slice(0, mergedConfig.maxSuggestions);
}
async function extractDynamicTags(input, config, embed) {
  const text = input.text.trim();
  const mergedConfig = {
    ...config,
    ...input.config
  };
  if (!text) {
    return [];
  }
  const candidates = extractCandidatePhrases(text, mergedConfig.dynamicNgramMin, mergedConfig.dynamicNgramMax).filter((candidate) => !isTaxonomyCandidate(candidate.label, input.tags ?? [], input.locale ?? "en"));
  if (candidates.length === 0) {
    return [];
  }
  if (!embed) {
    return candidates.map((candidate) => ({
      label: formatDynamicTagLabel(candidate.label),
      score: candidate.lexicalScore,
      semanticScore: 0,
      lexicalScore: candidate.lexicalScore,
      occurrences: candidate.occurrences,
      ngramSize: candidate.ngramSize
    })).filter((candidate) => candidate.score >= mergedConfig.minDynamicScore).sort(compareDynamicTags).slice(0, mergedConfig.maxDynamicTags);
  }
  const textEmbedding = await embed(text);
  const scored = await Promise.all(candidates.map(async (candidate) => {
    const semanticScore = cosineSimilarity(textEmbedding, await embed(candidate.label));
    const score = Math.min(
      1,
      semanticScore * mergedConfig.semanticWeight + candidate.lexicalScore * mergedConfig.lexicalWeight
    );
    return {
      label: formatDynamicTagLabel(candidate.label),
      score,
      semanticScore,
      lexicalScore: candidate.lexicalScore,
      occurrences: candidate.occurrences,
      ngramSize: candidate.ngramSize
    };
  }));
  return scored.filter((candidate) => candidate.score >= mergedConfig.minDynamicScore).sort(compareDynamicTags).slice(0, mergedConfig.maxDynamicTags);
}
async function extractTags(input, embed, config = resolveTagExtractorConfig()) {
  const [predefined, dynamic] = await Promise.all([
    scoreTagSuggestions(input, config, embed),
    extractDynamicTags(input, config, embed)
  ]);
  return {
    predefined,
    dynamic
  };
}
function dedupeTags(tags) {
  const seen = /* @__PURE__ */ new Set();
  return tags.flatMap((tag) => {
    const key = tag.key.trim();
    if (!key || seen.has(key)) {
      return [];
    }
    seen.add(key);
    return [{ ...tag, key }];
  });
}
var STOPWORDS = /* @__PURE__ */ new Set([
  "about",
  "above",
  "after",
  "again",
  "against",
  "also",
  "and",
  "are",
  "because",
  "been",
  "being",
  "between",
  "both",
  "but",
  "can",
  "completed",
  "connects",
  "coordination",
  "could",
  "deliver",
  "deliverables",
  "delivery",
  "described",
  "describes",
  "details",
  "does",
  "document",
  "explains",
  "for",
  "from",
  "had",
  "has",
  "have",
  "identify",
  "includes",
  "intake",
  "into",
  "its",
  "matching",
  "measurable",
  "must",
  "names",
  "not",
  "operational",
  "over",
  "paragraph",
  "participant",
  "phased",
  "phrases",
  "plan",
  "program",
  "project",
  "proposal",
  "provides",
  "quarterly",
  "rather",
  "reporting",
  "service",
  "simply",
  "staff",
  "support",
  "supports",
  "surrounding",
  "taxonomy",
  "that",
  "the",
  "their",
  "them",
  "this",
  "through",
  "will",
  "with",
  "without",
  "work"
]);
function extractCandidatePhrases(text, minNgram = 1, maxNgram = 3) {
  const tokens = text.toLowerCase().split(/[^a-z0-9]+/).map((token) => token.trim()).filter((token) => token.length > 2 && !STOPWORDS.has(token));
  const counts = /* @__PURE__ */ new Map();
  for (let index = 0; index < tokens.length; index += 1) {
    for (let size = minNgram; size <= maxNgram; size += 1) {
      const slice = tokens.slice(index, index + size);
      if (slice.length !== size) {
        continue;
      }
      const label = slice.join(" ");
      const existing = counts.get(label);
      counts.set(label, {
        occurrences: (existing?.occurrences ?? 0) + 1,
        ngramSize: size
      });
    }
  }
  return Array.from(counts.entries()).map(([label, value]) => ({
    label,
    occurrences: value.occurrences,
    ngramSize: value.ngramSize,
    lexicalScore: Math.min(1, 0.18 + value.ngramSize * 0.12 + value.occurrences * 0.08)
  }));
}
function compareDynamicTags(left, right) {
  if (right.score !== left.score) {
    return right.score - left.score;
  }
  if (right.ngramSize !== left.ngramSize) {
    return right.ngramSize - left.ngramSize;
  }
  return right.occurrences - left.occurrences;
}
function isTaxonomyCandidate(label, tags, locale) {
  const normalized = normalizePhrase(label);
  return tags.some((tag) => {
    const values = [
      tag.key,
      tag.label[locale],
      tag.description[locale],
      ...tag.aliases
    ];
    return values.some((value) => normalizePhrase(value) === normalized);
  });
}
function formatDynamicTagLabel(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function normalizePhrase(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export {
  tokenize,
  buildTagText,
  scoreLexicalOverlap,
  rankTagsByKeywordOverlap,
  applyNegationPenalty,
  cosineSimilarity,
  scoreTagSuggestions,
  extractDynamicTags,
  extractTags,
  extractCandidatePhrases,
  formatDynamicTagLabel
};
//# sourceMappingURL=chunk-WZJK4QAE.js.map