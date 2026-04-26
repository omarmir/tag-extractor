import { c as TagExtractorScorerConfig, d as TagExtractorScorerConfigInput, e as TagDefinition, f as TagExtractorLocale, g as TagSuggestion, h as TagExtractionInput, D as DynamicTagSuggestion, i as TagExtractionResult, j as TagExtractor, k as DualModelTagExtractorConfigInput, l as TagExtractorWorkerClientOptions, m as TagExtractorWorkerClient } from './types-BdeRlwWh.js';
export { n as TagExtractorExecutionConfig, T as TagExtractorLoadCallbacks, o as TagExtractorModelPhase, a as TagExtractorModelProgressEvent, p as TagExtractorModelSourceConfig, q as TagExtractorModelSourceMode, b as TagExtractorModelStatusEvent, r as TagExtractorWorkerEvent, s as TagExtractorWorkerRequest } from './types-BdeRlwWh.js';

declare const DEFAULT_TAG_EXTRACTOR_CONFIG: TagExtractorScorerConfig;
declare function resolveTagExtractorConfig(input?: TagExtractorScorerConfigInput): TagExtractorScorerConfig;

declare function tokenize(value: string): string[];
declare function buildTagText(tag: TagDefinition, locale?: TagExtractorLocale): string;
declare function scoreLexicalOverlap(text: string, tag: TagDefinition, exactAliasBoost: number, locale?: TagExtractorLocale, negationWindow?: number): Pick<TagSuggestion, 'lexicalScore' | 'exactAliasMatches' | 'negatedTermMatches'>;
declare function rankTagsByKeywordOverlap(text: string, tags: TagDefinition[], maxSuggestions: number, exactAliasBoost: number, locale?: TagExtractorLocale, negationPenalty?: number, negationWindow?: number): TagSuggestion[];
declare function applyNegationPenalty(score: number, negatedTermMatches: string[], negationPenalty: number): number;

type Embedder = (text: string) => Promise<number[]>;
declare function cosineSimilarity(left: number[], right: number[]): number;
declare function scoreTagSuggestions(input: TagExtractionInput, config: TagExtractorScorerConfig, embed?: Embedder): Promise<TagSuggestion[]>;
declare function extractDynamicTags(input: TagExtractionInput, config: TagExtractorScorerConfig, embed?: Embedder): Promise<DynamicTagSuggestion[]>;
declare function extractTags(input: TagExtractionInput, embed?: Embedder, config?: TagExtractorScorerConfig): Promise<TagExtractionResult>;
type CandidatePhrase = {
    label: string;
    lexicalScore: number;
    occurrences: number;
    ngramSize: number;
};
declare function extractCandidatePhrases(text: string, minNgram?: number, maxNgram?: number): CandidatePhrase[];
declare function formatDynamicTagLabel(label: string): string;

type TagEvaluationCase = {
    id: string;
    text: string;
    expectedTags: string[];
    expectedDynamicTags?: string[];
    rejectedTags: string[];
    tags?: unknown[];
};
type TagEvaluationResult = TagEvaluationCase & {
    predictedTags: string[];
    predictedDynamicTags: string[];
    truePositives: string[];
    falsePositives: string[];
    falseNegatives: string[];
    dynamicHits: string[];
    dynamicMisses: string[];
    precision: number;
    recall: number;
    f1: number;
    dynamicRecall: number;
    diversity: number;
};
type TagEvaluationSummary = {
    caseCount: number;
    meanPrecision: number;
    meanRecall: number;
    meanF1: number;
    meanDynamicRecall: number;
    meanDiversity: number;
    exactMatchRate: number;
    topMisses: TagEvaluationResult[];
};
declare function evaluateTagSuggestions(testCase: TagEvaluationCase, suggestions: TagSuggestion[], dynamicSuggestions?: DynamicTagSuggestion[], options?: {
    k?: number;
    mode?: 'accurate' | 'exploration';
}): TagEvaluationResult;
declare function summarizeTagEvaluation(results: TagEvaluationResult[]): TagEvaluationSummary;

declare function createTransformersTagExtractor(inputConfig?: TagExtractorScorerConfigInput): TagExtractor;

declare function createDualModelTagExtractor(inputConfig?: DualModelTagExtractorConfigInput): TagExtractor;

declare function createTagExtractorWorkerClient(options: TagExtractorWorkerClientOptions): TagExtractorWorkerClient;

export { DEFAULT_TAG_EXTRACTOR_CONFIG, DualModelTagExtractorConfigInput, DynamicTagSuggestion, type Embedder, TagDefinition, type TagEvaluationCase, type TagEvaluationResult, type TagEvaluationSummary, TagExtractionInput, TagExtractionResult, TagExtractor, TagExtractorLocale, TagExtractorScorerConfig, TagExtractorScorerConfigInput, TagExtractorWorkerClient, TagExtractorWorkerClientOptions, TagSuggestion, applyNegationPenalty, buildTagText, cosineSimilarity, createDualModelTagExtractor, createTagExtractorWorkerClient, createTransformersTagExtractor, evaluateTagSuggestions, extractCandidatePhrases, extractDynamicTags, extractTags, formatDynamicTagLabel, rankTagsByKeywordOverlap, resolveTagExtractorConfig, scoreLexicalOverlap, scoreTagSuggestions, summarizeTagEvaluation, tokenize };
