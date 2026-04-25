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
} from '@browser-tag-extractor/core/benchmark'
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
  await writeDoc('main-benchmark.md', renderMainBenchmarkDoc(summary))

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
  await writeDoc('model-bakeoff.md', renderModelBakeoffDoc(evaluations))

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

async function writeDoc(name: string, value: string) {
  await Bun.write(
    fileURLToPath(new URL(`../../docs/guide/${name}`, import.meta.url)),
    `${value.trimEnd()}\n`,
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

function renderMainBenchmarkDoc(summary: ReturnType<typeof summarizeTagEvaluation>) {
  return `# Main Benchmark

<!-- This page is generated by \`bun run report:main\`. Edit the report runner instead of hand-editing benchmark values. -->

The main benchmark uses a 300-example corpus covering common software,
operations, support, finance, legal, HR, research, marketing, data, product,
and documentation use cases.

Each case has:

- source text;
- the configured tag vocabulary;
- expected positive tags;
- expected dynamic phrase tags;
- expected negative tags.

The report summarizes fixed-tag precision, fixed-tag recall, fixed-tag F1,
dynamic-tag recall, diversity, and top misses.

Current lexical baseline:

| Metric | Value |
| --- | ---: |
| Cases | ${summary.caseCount} |
| Mean precision | ${formatMetric(summary.meanPrecision)} |
| Mean recall | ${formatMetric(summary.meanRecall)} |
| Mean F1 | ${formatMetric(summary.meanF1)} |
| Mean dynamic recall | ${formatMetric(summary.meanDynamicRecall)} |
| Mean diversity | ${formatMetric(summary.meanDiversity)} |
| Exact match rate | ${formatMetric(summary.exactMatchRate)} |

The lexical baseline is intentionally kept as a fallback. The model bakeoff
shows higher dynamic recall and stronger fixed-tag F1 for the best small model
paths.
`
}

function renderModelBakeoffDoc(evaluations: BenchmarkEvaluation[]) {
  const completed = evaluations.filter((item) => item.status === 'completed' && item.summary)
  const labels = createCandidateLabels(evaluations)
  const accurateWinner = findAccurateWinner(evaluations)
  const explorationWinner = findExplorationWinner(evaluations)
  const defaultEvaluation = completed.find((item) => item.id === 'all-minilm-l12-v2-q8' && item.mode === 'exploration' && item.k === 5)
  const explorationKs = [...new Set(completed
    .filter((item) => item.mode === 'exploration')
    .map((item) => item.k))]
    .sort((left, right) => left - right)
  const diversityExceptions = completed
    .filter((item) => item.mode === 'exploration' && item.summary && round(item.summary.meanDiversity) !== 1)
    .map((item) => `${labels.get(item.id)?.label ?? item.id} at K = ${item.k}, which is \`${formatMetric(item.summary!.meanDiversity)}\``)

  return `# Model Bakeoff

<!-- This page is generated by \`bun run report:model-bakeoff\`. Edit the report runner instead of hand-editing benchmark values. -->

The model bakeoff script compares candidate embedding models, zero-shot
classification, and dual-model pipelines against the same 300-example corpus.
The model catalog records an estimated browser asset size, and candidates above
100 MB are skipped by default.

The benchmark now evaluates a model, strategy, mode, and K value as one unit.
That matters because the same model can be excellent when auto-applying two
tags and much weaker when asked to fill a broad suggestion tray.

## Evaluation Modes

Accurate mode is for auto-applying a small final set of tags. It prioritizes
fixed-tag F1 and precision, then exact match as a secondary signal. The existing
calibrated top-2 strategy remains available in this mode.

Exploration mode is for suggesting a wider set of possible tags to a user. It
uses ranked top-K evaluation for K = ${formatList(explorationKs)}. DynamicRecall@K is the
primary exploration metric because suggestion UIs should surface relevant
organic phrases even when the final fixed taxonomy choice is still uncertain.
Recall@K, Diversity@K, and reasonable Precision@K are secondary ranking signals.
Exact match is still reported, but it should not drive exploration-mode
selection because a broad suggestion list is not expected to equal the final tag
set exactly.

Top-K metrics are needed because every candidate produces a ranked list, not
only a thresholded final answer. Evaluating the top ${formatList(explorationKs)} suggestions
shows how quickly useful tags appear as the UI gives the user more room to
explore.

## Current Results

### Model Labels

${renderModelLabelsTable(labels, evaluations)}

### Winners

| Mode | Candidate | K | F1 | Dynamic recall | Exact |
| --- | --- | ---: | ---: | ---: | ---: |
${renderWinnerRow('Accurate', accurateWinner, labels)}
${renderWinnerRow('Exploration', explorationWinner, labels)}

### Exploration Dynamic Recall by K

DynamicRecall@K is the primary exploration metric. Higher K values intentionally
trade precision for coverage.

${renderExplorationMetricTable(completed, labels, explorationKs, 'meanDynamicRecall')}

### Accurate Mode Detail

${renderAccurateTable(completed, labels)}

### Exploration Precision@K

${renderExplorationMetricTable(completed, labels, explorationKs, 'meanPrecision')}

### Exploration Recall@K

${renderExplorationMetricTable(completed, labels, explorationKs, 'meanRecall')}

### Exploration F1@K

${renderExplorationMetricTable(completed, labels, explorationKs, 'meanF1')}

${renderDiversityNote(diversityExceptions)}

## Interpretation

The accurate-mode winner is ${renderWinnerName(accurateWinner, labels)}. It has
the best fixed-tag F1 and precision balance for auto-applying a compact final
tag set.

The exploration-mode winner is ${renderWinnerName(explorationWinner, labels)}.
It has the strongest DynamicRecall@K under the current benchmark ranking while
staying under the 100 MB browser asset budget.

The public library default is ${labels.get('all-minilm-l12-v2-q8')?.label ?? 'L12'}${
  defaultEvaluation?.summary
    ? ` at K = ${defaultEvaluation.k}, which keeps one bundled embedding model while scoring F1 \`${formatMetric(defaultEvaluation.summary.meanF1)}\` and DynamicRecall@K \`${formatMetric(defaultEvaluation.summary.meanDynamicRecall)}\`.`
    : ', which keeps one bundled embedding model for the main package API.'
}

Diversity is normalized against the available fixed taxonomy size. In this
corpus it mainly acts as a guardrail against repeated or collapsed suggestion
lists.
`
}

function renderModelLabelsTable(labels: Map<string, CandidateLabel>, evaluations: BenchmarkEvaluation[]) {
  const rows = orderedCandidates(evaluations)
    .map((candidate) => {
      const label = labels.get(candidate.id)
      if (!label) {
        return ''
      }
      return `| ${label.label} | ${label.modelDisplay} | ${candidate.strategy} | ${candidate.estimatedAssetMb} |`
    })
    .filter(Boolean)

  return [
    '| Label | Candidate/model | Strategy | MB |',
    '| --- | --- | --- | ---: |',
    ...rows,
  ].join('\n')
}

function renderWinnerRow(mode: string, evaluation: BenchmarkEvaluation | null, labels: Map<string, CandidateLabel>) {
  if (!evaluation?.summary) {
    return `| ${mode} | n/a | n/a | n/a | n/a | n/a |`
  }

  const label = labels.get(evaluation.id)?.label ?? evaluation.id
  return `| ${mode} | ${label} | ${evaluation.k} | ${formatMetric(evaluation.summary.meanF1)} | ${formatMetric(evaluation.summary.meanDynamicRecall)} | ${formatMetric(evaluation.summary.exactMatchRate)} |`
}

function renderAccurateTable(evaluations: BenchmarkEvaluation[], labels: Map<string, CandidateLabel>) {
  const rows = orderedCandidates(evaluations)
    .map((candidate) => evaluations.find((item) => item.id === candidate.id && item.mode === 'accurate'))
    .filter((item): item is BenchmarkEvaluation => Boolean(item?.summary))
    .map((item) => `| ${labels.get(item.id)?.label ?? item.id} | ${item.k} | ${formatMetric(item.summary!.meanPrecision)} | ${formatMetric(item.summary!.meanRecall)} | ${formatMetric(item.summary!.meanF1)} | ${formatMetric(item.summary!.meanDynamicRecall)} | ${formatMetric(item.summary!.exactMatchRate)} |`)

  return [
    '| Candidate | K | Precision | Recall | F1 | Dynamic recall | Exact |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...rows,
  ].join('\n')
}

function renderExplorationMetricTable(
  evaluations: BenchmarkEvaluation[],
  labels: Map<string, CandidateLabel>,
  ks: number[],
  metric: keyof ReturnType<typeof summarizeTagEvaluation>,
) {
  const rows = orderedCandidates(evaluations)
    .map((candidate) => {
      const cells = ks.map((k) => {
        const row = evaluations.find((item) => item.id === candidate.id && item.mode === 'exploration' && item.k === k)
        const value = row?.summary?.[metric]
        return typeof value === 'number' ? formatMetric(value) : 'n/a'
      })
      return `| ${labels.get(candidate.id)?.label ?? candidate.id} | ${cells.join(' | ')} |`
    })

  return [
    `| Candidate | ${ks.map((k) => `K=${k}`).join(' | ')} |`,
    `| --- | ${ks.map(() => '---:').join(' | ')} |`,
    ...rows,
  ].join('\n')
}

function renderDiversityNote(exceptions: string[]) {
  if (exceptions.length === 0) {
    return 'All completed exploration rows have Diversity@K of `1.000`.'
  }

  return `All completed exploration rows have Diversity@K of \`1.000\`, except ${exceptions.join('; ')}.`
}

function renderWinnerName(evaluation: BenchmarkEvaluation | null, labels: Map<string, CandidateLabel>) {
  if (!evaluation) {
    return 'not available'
  }

  return `${labels.get(evaluation.id)?.label ?? evaluation.id} at K = ${evaluation.k}`
}

type CandidateLabel = {
  label: string
  modelDisplay: string
}

function createCandidateLabels(evaluations: BenchmarkEvaluation[]) {
  const explicitLabels: Record<string, string> = {
    'all-minilm-l6-v2-q8': 'L6',
    'paraphrase-minilm-l3-v2-q8': 'L3',
    'all-minilm-l12-v2-q8': 'L12',
    'bge-small-en-v1-5-q8': 'BGE small',
    'nli-deberta-v3-xsmall-q8': 'DeBERTa',
    'dual-deberta-xsmall-minilm-l6-v2-q8': 'DeBERTa + L6',
    'dual-deberta-xsmall-bge-micro-v2-q8': 'DeBERTa + BGE micro',
  }
  const labels = new Map<string, CandidateLabel>()

  for (const candidate of orderedCandidates(evaluations)) {
    labels.set(candidate.id, {
      label: explicitLabels[candidate.id] ?? shortModelLabel(candidate),
      modelDisplay: candidate.strategy === 'dual-model'
        ? `\`${candidate.predefinedModelId ?? candidate.modelId}\` + \`${candidate.dynamicModelId ?? candidate.modelId}\``
        : `\`${candidate.predefinedModelId ?? candidate.modelId}\``,
    })
  }

  return labels
}

function orderedCandidates(evaluations: BenchmarkEvaluation[]) {
  const candidates = new Map<string, BenchmarkEvaluation>()
  for (const evaluation of evaluations) {
    if (!candidates.has(evaluation.id)) {
      candidates.set(evaluation.id, evaluation)
    }
  }
  return [...candidates.values()]
}

function shortModelLabel(candidate: BenchmarkEvaluation) {
  const raw = candidate.id
    .replace(/-q8$/, '')
    .replace(/^dual-/, '')
    .replace(/-v\d+(?:-\d+)?/g, '')
    .split('-')
    .filter((part) => !['xenova', 'small', 'en'].includes(part))
    .slice(0, 4)
    .join(' ')

  return raw || candidate.id
}

function formatMetric(value: number) {
  return value.toFixed(3)
}

function formatList(values: number[]) {
  if (values.length <= 1) {
    return values.join('')
  }

  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`
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
