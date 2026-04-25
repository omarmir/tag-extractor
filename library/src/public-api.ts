import { resolveTagExtractorConfig } from './defaults'
import { createTransformersTagExtractor } from './transformers-tag-extractor'
import type {
  DynamicTagSuggestion,
  TagDefinition,
  TagExtractionResult,
  TagExtractorLoadCallbacks,
  TagSuggestion,
} from './types'

export type PredefinedTag = {
  key: string
  label: string
  description?: string
  aliases?: string[]
}

export type TagExtractorRequest = {
  text: string
  predefinedTags: PredefinedTag[]
  allowDynamicTags?: boolean
  k?: number
}

export type PredefinedTagResult = {
  key: string
  label: string
  score: number
}

export type DynamicTagResult = {
  label: string
  score: number
}

export type TagExtractorResult = {
  predefined: PredefinedTagResult[]
  dynamic: DynamicTagResult[]
}

export type BrowserTagExtractor = {
  loadModel(callbacks?: TagExtractorLoadCallbacks): Promise<void>
  extract(request: TagExtractorRequest): Promise<TagExtractorResult>
  reset(): void
}

const DEFAULT_K = 5

export function createTagExtractor(): BrowserTagExtractor {
  const extractor = createTransformersTagExtractor(resolveTagExtractorConfig())

  return {
    loadModel(callbacks?: TagExtractorLoadCallbacks) {
      return extractor.loadModel(callbacks)
    },
    async extract(request: TagExtractorRequest) {
      return toPublicResult(
        await extractor.extract(toInternalRequest(request)),
        request.predefinedTags,
      )
    },
    reset() {
      extractor.reset(resolveTagExtractorConfig())
    },
  }
}

export async function extractTextTags(request: TagExtractorRequest): Promise<TagExtractorResult> {
  const extractor = createTagExtractor()
  return extractor.extract(request)
}

function toInternalRequest(request: TagExtractorRequest) {
  const k = normalizeK(request.k)
  return {
    text: request.text,
    tags: request.predefinedTags.map(toInternalTag),
    config: {
      minScore: 0,
      maxSuggestions: k,
      minDynamicScore: 0,
      maxDynamicTags: request.allowDynamicTags === false ? 0 : k,
    },
  }
}

function toInternalTag(tag: PredefinedTag): TagDefinition {
  return {
    key: tag.key,
    label: {
      en: tag.label,
      fr: tag.label,
    },
    description: {
      en: tag.description ?? tag.label,
      fr: tag.description ?? tag.label,
    },
    aliases: tag.aliases ?? [],
  }
}

function toPublicResult(result: TagExtractionResult, tags: PredefinedTag[]): TagExtractorResult {
  const labels = new Map(tags.map((tag) => [tag.key, tag.label]))
  return {
    predefined: result.predefined.map((suggestion) => toPredefinedResult(suggestion, labels)),
    dynamic: result.dynamic.map(toDynamicResult),
  }
}

function toPredefinedResult(suggestion: TagSuggestion, labels: Map<string, string>): PredefinedTagResult {
  return {
    key: suggestion.key,
    label: labels.get(suggestion.key) ?? suggestion.key,
    score: suggestion.score,
  }
}

function toDynamicResult(suggestion: DynamicTagSuggestion): DynamicTagResult {
  return {
    label: suggestion.label,
    score: suggestion.score,
  }
}

function normalizeK(k: number | undefined) {
  if (typeof k !== 'number' || !Number.isFinite(k)) {
    return DEFAULT_K
  }

  return Math.max(1, Math.floor(k))
}
