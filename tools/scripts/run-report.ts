import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import {
  createDualModelTagExtractor,
  createTransformersTagExtractor,
  evaluateTagSuggestions,
  extractTags,
  resolveTagExtractorConfig,
  summarizeTagEvaluation,
  type TagEvaluationResult,
} from '@browser-tag-extractor/core'
import { BENCHMARK_CASES } from '../benchmark/cases'
import { getBenchmarkModelCandidates } from '../benchmark/model-catalog'

const REPORTS_DIR = fileURLToPath(new URL('../reports/', import.meta.url))
const reportName = Bun.argv[2] ?? 'main'

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
  const summaries = []

  for (const candidate of candidates) {
    const benchmarkConfig = {
      minScore: candidate.benchmarkConfig?.minScore ?? 0.2,
      maxSuggestions: candidate.benchmarkConfig?.maxSuggestions ?? 4,
    }
    const extractor = candidate.strategy === 'dual-model'
      ? createDualModelTagExtractor({
          predefinedModelId: candidate.predefinedModelId,
          dynamicModelId: candidate.dynamicModelId,
          predefinedDtype: candidate.dtype,
          dynamicDtype: candidate.dtype,
          ...benchmarkConfig,
          modelSource: {
            mode: 'huggingface',
            useBrowserCache: false,
          },
        })
      : createTransformersTagExtractor({
          modelId: candidate.modelId,
          dtype: candidate.dtype,
          ...benchmarkConfig,
          modelSource: {
            mode: 'huggingface',
            useBrowserCache: false,
          },
        })

    const results: TagEvaluationResult[] = []
    const progress = createProgressReporter(candidate.id, BENCHMARK_CASES.length)
    try {
      await extractor.loadModel()
      for (const [index, testCase] of BENCHMARK_CASES.entries()) {
        const extraction = await extractor.extract({
          text: testCase.text,
          tags: testCase.tags,
        })
        results.push(evaluateTagSuggestions(testCase, extraction.predefined, extraction.dynamic))
        progress(index + 1, testCase.id)
      }

      const summary = summarizeTagEvaluation(results)
      summaries.push({
        ...candidate,
        status: 'completed',
        summary,
      })
    } catch (error) {
      summaries.push({
        ...candidate,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown model benchmark error',
      })
    } finally {
      extractor.reset()
    }
  }

  await writeReport('model-bakeoff.json', {
    maxModelMb: 100,
    candidateCount: candidates.length,
    summaries,
  })

  console.log(JSON.stringify({
    candidateCount: candidates.length,
    summaries: summaries.map((item) => ({
      id: item.id,
      status: item.status,
      summary: 'summary' in item ? compactSummary(item.summary) : undefined,
      error: 'error' in item ? item.error : undefined,
    })),
  }, null, 2))
}

async function writeReport(name: string, value: unknown) {
  await Bun.write(
    fileURLToPath(new URL(`../reports/${name}`, import.meta.url)),
    `${JSON.stringify(value, null, 2)}\n`,
  )
}

function compactSummary(summary: ReturnType<typeof summarizeTagEvaluation>) {
  return {
    caseCount: summary.caseCount,
    meanPrecision: round(summary.meanPrecision),
    meanRecall: round(summary.meanRecall),
    meanF1: round(summary.meanF1),
    meanDynamicRecall: round(summary.meanDynamicRecall),
    exactMatchRate: round(summary.exactMatchRate),
    topMisses: summary.topMisses.slice(0, 5).map((item) => ({
      id: item.id,
      expectedTags: item.expectedTags,
      predictedTags: item.predictedTags,
      expectedDynamicTags: item.expectedDynamicTags,
      predictedDynamicTags: item.predictedDynamicTags,
      f1: round(item.f1),
      dynamicRecall: round(item.dynamicRecall),
    })),
  }
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
