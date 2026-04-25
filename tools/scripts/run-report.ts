import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import {
  applyNegationPenalty,
  createDualModelTagExtractor,
  createTransformersTagExtractor,
  evaluateTagSuggestions,
  extractTags,
  resolveTagExtractorConfig,
  scoreLexicalOverlap,
  summarizeTagEvaluation,
  type TagEvaluationResult,
  type TagExtractionInput,
  type TagExtractionResult,
  type TagExtractorScorerConfig,
  type TagSuggestion,
} from '@browser-tag-extractor/core'
import type { ModelCandidate } from '../benchmark/model-catalog'
import { BENCHMARK_CASES } from '../benchmark/cases'
import { getBenchmarkModelCandidates } from '../benchmark/model-catalog'

const REPORTS_DIR = fileURLToPath(new URL('../reports/', import.meta.url))
const reportName = Bun.argv[2] ?? 'main'
const EXPLORATION_K_VALUES = [2, 5, 10, 20]

type BenchmarkMode = 'accurate' | 'exploration'
type BenchmarkEvaluation = ModelCandidate & {
  mode: BenchmarkMode
  k: number
  status: 'completed' | 'failed'
  primaryMetric: 'f1' | 'dynamicRecall'
  summary?: ReturnType<typeof summarizeTagEvaluation>
  error?: string
}

await mkdir(REPORTS_DIR, { recursive: true })

if (reportName === 'main') {
  await runMainReport()
} else if (reportName === 'model-bakeoff') {
  await runModelBakeoff()
} else {
  throw new Error(`Unknown report: ${reportName}`)
}

async function runMainReport() {
  const config = resolveTagExtractorConfig({
    minScore: 0.2,
    maxSuggestions: 4,
  })
  const results: TagEvaluationResult[] = []
  const progress = createProgressReporter('main benchmark', BENCHMARK_CASES.length)

  for (const [index, testCase] of BENCHMARK_CASES.entries()) {
    const extraction = await extractTags({
      text: testCase.text,
      tags: testCase.tags,
      config,
    })
    results.push(evaluateTagSuggestions(testCase, extraction.predefined, extraction.dynamic))
    progress(index + 1, testCase.id)
  }

  const summary = summarizeTagEvaluation(results)
  await writeReport('benchmark-results.json', {
    mode: 'lexical-baseline',
    summary,
    results,
  })

  console.log(JSON.stringify(compactSummary(summary), null, 2))
}

async function runModelBakeoff() {
  const candidates = getBenchmarkModelCandidates()
  const evaluations: BenchmarkEvaluation[] = []

  for (const candidate of candidates) {
    const accurateConfig = {
      minScore: candidate.benchmarkConfig?.minScore ?? 0.2,
      maxSuggestions: candidate.benchmarkConfig?.maxSuggestions ?? 4,
      maxDynamicTags: candidate.benchmarkConfig?.maxDynamicTags ?? 6,
    }
    const explorationConfig = {
      minScore: 0,
      maxSuggestions: Math.max(...EXPLORATION_K_VALUES),
      maxDynamicTags: Math.max(...EXPLORATION_K_VALUES),
      minDynamicScore: 0,
    }
    const extractor = candidate.strategy === 'zero-shot'
      ? createZeroShotBenchmarkExtractor(candidate, explorationConfig)
      : candidate.strategy === 'dual-model'
        ? createDualModelTagExtractor({
          predefinedModelId: candidate.predefinedModelId,
          dynamicModelId: candidate.dynamicModelId,
          predefinedDtype: candidate.dtype,
          dynamicDtype: candidate.dtype,
          ...explorationConfig,
          modelSource: {
            mode: 'huggingface',
            useBrowserCache: false,
          },
        })
        : createTransformersTagExtractor({
          modelId: candidate.modelId,
          dtype: candidate.dtype,
          ...explorationConfig,
          modelSource: {
            mode: 'huggingface',
            useBrowserCache: false,
          },
        })

    const extractions: Array<{ testCase: typeof BENCHMARK_CASES[number]; extraction: TagExtractionResult }> = []
    const progress = createProgressReporter(candidate.id, BENCHMARK_CASES.length)
    try {
      await extractor.loadModel()
      for (const [index, testCase] of BENCHMARK_CASES.entries()) {
        const extraction = await extractor.extract({
          text: testCase.text,
          tags: testCase.tags,
        })
        extractions.push({ testCase, extraction })
        progress(index + 1, testCase.id)
      }

      const accurateResults = extractions.map(({ testCase, extraction }) =>
        evaluateTagSuggestions(
          testCase,
          extraction.predefined.slice(0, accurateConfig.maxSuggestions)
            .filter((suggestion) => suggestion.score >= accurateConfig.minScore),
          extraction.dynamic.slice(0, accurateConfig.maxDynamicTags),
          { mode: 'accurate' },
        )
      )
      evaluations.push({
        ...candidate,
        mode: 'accurate',
        k: accurateConfig.maxSuggestions,
        status: 'completed',
        primaryMetric: 'f1',
        summary: summarizeTagEvaluation(accurateResults),
      })

      for (const k of EXPLORATION_K_VALUES) {
        const explorationResults = extractions.map(({ testCase, extraction }) =>
          evaluateTagSuggestions(testCase, extraction.predefined, extraction.dynamic, {
            mode: 'exploration',
            k,
          })
        )
        evaluations.push({
          ...candidate,
          mode: 'exploration',
          k,
          status: 'completed',
          primaryMetric: 'dynamicRecall',
          summary: summarizeTagEvaluation(explorationResults),
        })
      }
    } catch (error) {
      for (const row of [{ mode: 'accurate' as const, k: accurateConfig.maxSuggestions }, ...EXPLORATION_K_VALUES.map((k) => ({ mode: 'exploration' as const, k }))]) {
        evaluations.push({
          ...candidate,
          ...row,
          status: 'failed',
          primaryMetric: row.mode === 'accurate' ? 'f1' : 'dynamicRecall',
          error: error instanceof Error ? error.message : 'Unknown model benchmark error',
        })
      }
    } finally {
      extractor.reset()
    }
  }

  await writeReport('model-bakeoff.json', {
    maxModelMb: 100,
    candidateCount: candidates.length,
    evaluationCount: evaluations.length,
    explorationKValues: EXPLORATION_K_VALUES,
    evaluations,
  })

  console.log(JSON.stringify({
    candidateCount: candidates.length,
    evaluationCount: evaluations.length,
    accurateWinner: compactEvaluationWinner(findAccurateWinner(evaluations)),
    explorationWinner: compactEvaluationWinner(findExplorationWinner(evaluations)),
    evaluations: evaluations.map((item) => ({
      id: item.id,
      status: item.status,
      mode: item.mode,
      k: item.k,
      summary: item.summary ? compactSummary(item.summary, { includeTopMisses: false }) : undefined,
      error: item.error,
    })),
  }, null, 2))
}

function createZeroShotBenchmarkExtractor(
  candidate: ModelCandidate,
  benchmarkConfig: { minScore: number; maxSuggestions: number },
) {
  type TransformersModule = typeof import('@huggingface/transformers')
  type ZeroShotPipeline = (
    text: string,
    labels: string[],
    options?: { multi_label?: boolean; hypothesis_template?: string },
  ) => Promise<unknown>

  const config = resolveTagExtractorConfig({
    modelId: candidate.predefinedModelId ?? candidate.modelId,
    dtype: candidate.dtype,
    ...benchmarkConfig,
    modelSource: {
      mode: 'huggingface',
      useBrowserCache: false,
    },
  })
  let classifierPromise: Promise<ZeroShotPipeline> | null = null

  return {
    async loadModel() {
      if (!classifierPromise) {
        const transformers = await import('@huggingface/transformers') as TransformersModule
        transformers.env.allowRemoteModels = true
        transformers.env.allowLocalModels = false
        transformers.env.useBrowserCache = false
        classifierPromise = transformers.pipeline('zero-shot-classification', config.modelId, {
          dtype: config.dtype,
        }) as Promise<ZeroShotPipeline>
      }

      await classifierPromise
    },
    async extract(input: TagExtractionInput): Promise<TagExtractionResult> {
      await this.loadModel()
      return {
        predefined: await scoreZeroShotTags(input, config, await classifierPromise),
        dynamic: [],
      }
    },
    reset() {
      classifierPromise = null
    },
  }
}

async function scoreZeroShotTags(
  input: TagExtractionInput,
  config: TagExtractorScorerConfig,
  classifier: ((text: string, labels: string[], options?: { multi_label?: boolean; hypothesis_template?: string }) => Promise<unknown>) | null,
): Promise<TagSuggestion[]> {
  const text = input.text.trim()
  const tags = input.tags ?? []
  if (!text || tags.length === 0 || !classifier) {
    return []
  }

  const locale = input.locale ?? 'en'
  const mergedConfig = {
    ...config,
    ...input.config,
  }
  const labels = tags.map((tag) => tag.label[locale] || tag.key)
  const output = await classifier(text, labels, {
    multi_label: true,
    hypothesis_template: 'This text is about {}.',
  })
  const scores = parseZeroShotOutput(output)

  return tags
    .map((tag): TagSuggestion => {
      const label = tag.label[locale] || tag.key
      const zeroShotScore = scores.get(label) ?? 0
      const lexical = scoreLexicalOverlap(text, tag, mergedConfig.exactAliasBoost, locale, mergedConfig.negationWindow)
      const rawScore = Math.min(
        1,
        (zeroShotScore * mergedConfig.semanticWeight) + (lexical.lexicalScore * mergedConfig.lexicalWeight),
      )
      return {
        key: tag.key,
        semanticScore: zeroShotScore,
        lexicalScore: lexical.lexicalScore,
        exactAliasMatches: lexical.exactAliasMatches,
        negatedTermMatches: lexical.negatedTermMatches,
        score: applyNegationPenalty(rawScore, lexical.negatedTermMatches, mergedConfig.negationPenalty),
      }
    })
    .filter((item) => item.score >= mergedConfig.minScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, mergedConfig.maxSuggestions)
}

function parseZeroShotOutput(output: unknown) {
  const scores = new Map<string, number>()
  if (isZeroShotOutput(output)) {
    output.labels.forEach((label, index) => {
      scores.set(label, Number(output.scores[index] ?? 0))
    })
  }
  return scores
}

function isZeroShotOutput(value: unknown): value is { labels: string[]; scores: number[] } {
  return typeof value === 'object'
    && value !== null
    && Array.isArray((value as { labels?: unknown }).labels)
    && Array.isArray((value as { scores?: unknown }).scores)
}

async function writeReport(name: string, value: unknown) {
  await Bun.write(
    fileURLToPath(new URL(`../reports/${name}`, import.meta.url)),
    `${JSON.stringify(value, null, 2)}\n`,
  )
}

function compactSummary(
  summary: ReturnType<typeof summarizeTagEvaluation>,
  options: { includeTopMisses?: boolean } = { includeTopMisses: true },
) {
  const compact = {
    caseCount: summary.caseCount,
    meanPrecision: round(summary.meanPrecision),
    meanRecall: round(summary.meanRecall),
    meanF1: round(summary.meanF1),
    meanDynamicRecall: round(summary.meanDynamicRecall),
    meanDiversity: round(summary.meanDiversity),
    exactMatchRate: round(summary.exactMatchRate),
  }

  if (options.includeTopMisses === false) {
    return compact
  }

  return {
    ...compact,
    topMisses: summary.topMisses.slice(0, 5).map((item) => ({
      id: item.id,
      expectedTags: item.expectedTags,
      predictedTags: item.predictedTags,
      expectedDynamicTags: item.expectedDynamicTags,
      predictedDynamicTags: item.predictedDynamicTags,
      f1: round(item.f1),
      dynamicRecall: round(item.dynamicRecall),
      diversity: round(item.diversity),
    })),
  }
}

function compactEvaluationWinner(evaluation: BenchmarkEvaluation | null) {
  if (!evaluation) {
    return null
  }

  return {
    id: evaluation.id,
    strategy: evaluation.strategy,
    estimatedAssetMb: evaluation.estimatedAssetMb,
    mode: evaluation.mode,
    k: evaluation.k,
    primaryMetric: evaluation.primaryMetric,
    summary: evaluation.summary ? compactSummary(evaluation.summary, { includeTopMisses: false }) : undefined,
  }
}

function findAccurateWinner(evaluations: BenchmarkEvaluation[]) {
  return evaluations
    .filter((item) => item.status === 'completed' && item.mode === 'accurate' && item.summary)
    .sort((left, right) =>
      right.summary!.meanF1 - left.summary!.meanF1
      || right.summary!.meanPrecision - left.summary!.meanPrecision
      || right.summary!.exactMatchRate - left.summary!.exactMatchRate
    )[0] ?? null
}

function findExplorationWinner(evaluations: BenchmarkEvaluation[]) {
  return evaluations
    .filter((item) => item.status === 'completed' && item.mode === 'exploration' && item.summary)
    .sort((left, right) =>
      right.summary!.meanDynamicRecall - left.summary!.meanDynamicRecall
      || right.summary!.meanRecall - left.summary!.meanRecall
      || right.summary!.meanDiversity - left.summary!.meanDiversity
      || right.summary!.meanPrecision - left.summary!.meanPrecision
    )[0] ?? null
}

function round(value: number) {
  return Math.round(value * 1000) / 1000
}

function createProgressReporter(label: string, total: number) {
  let lastReported = 0
  return (done: number, id: string) => {
    const nextReported = Math.floor((done / total) * 10)
    if (nextReported !== lastReported || done === total) {
      lastReported = nextReported
      console.log(`[${label}] ${done}/${total} ${id}`)
    }
  }
}
