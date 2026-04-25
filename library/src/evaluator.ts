import type { DynamicTagSuggestion, TagSuggestion } from './types'

export type TagEvaluationCase = {
  id: string
  text: string
  expectedTags: string[]
  expectedDynamicTags?: string[]
  rejectedTags: string[]
  tags?: unknown[]
}

export type TagEvaluationResult = TagEvaluationCase & {
  predictedTags: string[]
  predictedDynamicTags: string[]
  truePositives: string[]
  falsePositives: string[]
  falseNegatives: string[]
  dynamicHits: string[]
  dynamicMisses: string[]
  precision: number
  recall: number
  f1: number
  dynamicRecall: number
  diversity: number
}

export type TagEvaluationSummary = {
  caseCount: number
  meanPrecision: number
  meanRecall: number
  meanF1: number
  meanDynamicRecall: number
  meanDiversity: number
  exactMatchRate: number
  topMisses: TagEvaluationResult[]
}

export function evaluateTagSuggestions(
  testCase: TagEvaluationCase,
  suggestions: TagSuggestion[],
  dynamicSuggestions: DynamicTagSuggestion[] = [],
  options: { k?: number; mode?: 'accurate' | 'exploration' } = {},
): TagEvaluationResult {
  const k = options.k
  const selectedSuggestions = typeof k === 'number' ? suggestions.slice(0, k) : suggestions
  const selectedDynamicSuggestions = typeof k === 'number' ? dynamicSuggestions.slice(0, k) : dynamicSuggestions
  const predictedTags = selectedSuggestions.map((suggestion) => suggestion.key)
  const predictedDynamicTags = selectedDynamicSuggestions.map((suggestion) => suggestion.label)
  const expected = new Set(testCase.expectedTags)
  const expectedDynamicTags = testCase.expectedDynamicTags ?? []
  const predictedDynamic = predictedDynamicTags.map(normalizeDynamicTag)
  const predicted = new Set(predictedTags)
  const truePositives = predictedTags.filter((tag) => expected.has(tag))
  const falsePositives = predictedTags.filter((tag) => !expected.has(tag))
  const falseNegatives = testCase.expectedTags.filter((tag) => !predicted.has(tag))
  const dynamicHits = expectedDynamicTags.filter((tag) => hasDynamicMatch(normalizeDynamicTag(tag), predictedDynamic))
  const dynamicMisses = expectedDynamicTags.filter((tag) => !hasDynamicMatch(normalizeDynamicTag(tag), predictedDynamic))
  const precisionDenominator = options.mode === 'exploration' && typeof k === 'number' ? k : predictedTags.length
  const precision = precisionDenominator > 0 ? truePositives.length / precisionDenominator : expected.size === 0 ? 1 : 0
  const recall = expected.size > 0 ? truePositives.length / expected.size : falsePositives.length === 0 ? 1 : 0
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0
  const dynamicRecall = expectedDynamicTags.length > 0 ? dynamicHits.length / expectedDynamicTags.length : 1
  const diversity = calculateDiversity(predictedTags, testCase.tags?.length, k)

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
    diversity,
  }
}

export function summarizeTagEvaluation(results: TagEvaluationResult[]): TagEvaluationSummary {
  const caseCount = results.length
  const exactMatches = results.filter((result) =>
    result.falsePositives.length === 0 && result.falseNegatives.length === 0
  ).length
  const topMisses = [...results]
    .sort((left, right) => left.f1 - right.f1)
    .slice(0, 20)

  return {
    caseCount,
    meanPrecision: average(results.map((result) => result.precision)),
    meanRecall: average(results.map((result) => result.recall)),
    meanF1: average(results.map((result) => result.f1)),
    meanDynamicRecall: average(results.map((result) => result.dynamicRecall)),
    meanDiversity: average(results.map((result) => result.diversity)),
    exactMatchRate: caseCount > 0 ? exactMatches / caseCount : 0,
    topMisses,
  }
}

function normalizeDynamicTag(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function hasDynamicMatch(expected: string, predicted: string[]) {
  return predicted.some((item) => item === expected || item.includes(expected) || expected.includes(item))
}

function calculateDiversity(predictedTags: string[], tagCount: number | undefined, k: number | undefined) {
  const denominator = typeof k === 'number'
    ? Math.min(k, tagCount ?? k)
    : Math.min(predictedTags.length, tagCount ?? predictedTags.length)
  if (denominator === 0) {
    return 1
  }

  return Math.min(1, new Set(predictedTags).size / denominator)
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}
