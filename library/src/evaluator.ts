import type { TagSuggestion } from './types'

export type TagEvaluationCase = {
  id: string
  text: string
  expectedTags: string[]
  rejectedTags: string[]
}

export type TagEvaluationResult = TagEvaluationCase & {
  predictedTags: string[]
  truePositives: string[]
  falsePositives: string[]
  falseNegatives: string[]
  precision: number
  recall: number
  f1: number
}

export type TagEvaluationSummary = {
  caseCount: number
  meanPrecision: number
  meanRecall: number
  meanF1: number
  exactMatchRate: number
  topMisses: TagEvaluationResult[]
}

export function evaluateTagSuggestions(
  testCase: TagEvaluationCase,
  suggestions: TagSuggestion[],
): TagEvaluationResult {
  const predictedTags = suggestions.map((suggestion) => suggestion.key)
  const expected = new Set(testCase.expectedTags)
  const predicted = new Set(predictedTags)
  const truePositives = predictedTags.filter((tag) => expected.has(tag))
  const falsePositives = predictedTags.filter((tag) => !expected.has(tag))
  const falseNegatives = testCase.expectedTags.filter((tag) => !predicted.has(tag))
  const precision = predictedTags.length > 0 ? truePositives.length / predictedTags.length : expected.size === 0 ? 1 : 0
  const recall = expected.size > 0 ? truePositives.length / expected.size : falsePositives.length === 0 ? 1 : 0
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0

  return {
    ...testCase,
    predictedTags,
    truePositives,
    falsePositives,
    falseNegatives,
    precision,
    recall,
    f1,
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
    exactMatchRate: caseCount > 0 ? exactMatches / caseCount : 0,
    topMisses,
  }
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}
