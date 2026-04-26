type TagExtractorLocale = 'en' | 'fr';
type TagExtractorModelPhase = 'idle' | 'loading' | 'ready' | 'error';
type TagExtractorModelSourceMode = 'local' | 'url' | 'huggingface';
type TagExtractorModelSourceConfig = {
    mode: TagExtractorModelSourceMode;
    localModelPath: string;
    remoteHost: string;
    remotePathTemplate: string;
    revision: string;
    useBrowserCache: boolean | 'auto';
};
type TagExtractorExecutionConfig = {
    device: 'cpu' | 'wasm' | 'webgpu';
    useEmbeddingCache: boolean;
};
type TagExtractorScorerConfig = {
    task: 'feature-extraction';
    modelId: string;
    dtype: 'auto' | 'q8' | 'fp32' | 'fp16' | 'int8' | 'uint8' | 'q4' | 'bnb4' | 'q4f16';
    minScore: number;
    maxSuggestions: number;
    maxDynamicTags: number;
    minDynamicScore: number;
    dynamicNgramMin: number;
    dynamicNgramMax: number;
    semanticWeight: number;
    lexicalWeight: number;
    exactAliasBoost: number;
    negationPenalty: number;
    negationWindow: number;
    modelSource: TagExtractorModelSourceConfig;
    execution: TagExtractorExecutionConfig;
};
type TagExtractorScorerConfigInput = Partial<Omit<TagExtractorScorerConfig, 'modelSource' | 'execution'>> & {
    modelSource?: Partial<TagExtractorModelSourceConfig>;
    execution?: Partial<TagExtractorExecutionConfig>;
};
type DualModelTagExtractorConfigInput = TagExtractorScorerConfigInput & {
    predefinedModelId?: string;
    predefinedDtype?: TagExtractorScorerConfig['dtype'];
    dynamicModelId?: string;
    dynamicDtype?: TagExtractorScorerConfig['dtype'];
};
type TagDefinition = {
    key: string;
    label: Record<TagExtractorLocale, string>;
    description: Record<TagExtractorLocale, string>;
    aliases: string[];
};
type TagExtractionInput = {
    text: string;
    tags?: TagDefinition[];
    locale?: TagExtractorLocale;
    config?: Partial<Pick<TagExtractorScorerConfig, 'minScore' | 'maxSuggestions' | 'maxDynamicTags' | 'minDynamicScore' | 'dynamicNgramMin' | 'dynamicNgramMax' | 'semanticWeight' | 'lexicalWeight' | 'exactAliasBoost' | 'negationPenalty' | 'negationWindow'>>;
};
type TagSuggestion = {
    key: string;
    score: number;
    semanticScore: number;
    lexicalScore: number;
    exactAliasMatches: string[];
    negatedTermMatches: string[];
};
type DynamicTagSuggestion = {
    label: string;
    score: number;
    semanticScore: number;
    lexicalScore: number;
    occurrences: number;
    ngramSize: number;
};
type TagExtractionResult = {
    predefined: TagSuggestion[];
    dynamic: DynamicTagSuggestion[];
};
type TagExtractorModelStatusEvent = {
    phase: TagExtractorModelPhase;
    message: string;
};
type TagExtractorModelProgressEvent = {
    progress: number;
    loaded: number;
    total: number;
    file?: string;
};
type TagExtractorLoadCallbacks = {
    onStatus?: (event: TagExtractorModelStatusEvent) => void;
    onProgress?: (event: TagExtractorModelProgressEvent) => void;
};
type TagExtractor = {
    readonly config: TagExtractorScorerConfig;
    loadModel(callbacks?: TagExtractorLoadCallbacks): Promise<void>;
    extract(input: TagExtractionInput): Promise<TagExtractionResult>;
    reset(nextConfig?: TagExtractorScorerConfigInput): void;
};
type TagExtractorWorkerClientOptions = {
    config: TagExtractorScorerConfigInput;
    createWorker: () => Worker;
    onModelStatus?: (event: TagExtractorModelStatusEvent) => void;
    onModelProgress?: (event: TagExtractorModelProgressEvent) => void;
};
type TagExtractorWorkerClient = {
    loadModel(nextConfig?: TagExtractorScorerConfigInput): Promise<void>;
    extract(input: TagExtractionInput): Promise<TagExtractionResult>;
    reset(nextConfig?: TagExtractorScorerConfigInput): Promise<void>;
    terminate(): void;
    getConfig(): TagExtractorScorerConfig;
};
type TagExtractorWorkerRequest = {
    type: 'INIT_MODEL';
    config: TagExtractorScorerConfig;
} | {
    type: 'EXTRACT_TAGS';
    requestId: string;
    input: TagExtractionInput;
};
type TagExtractorWorkerEvent = {
    type: 'MODEL_STATUS';
    phase: TagExtractorModelPhase;
    message: string;
} | {
    type: 'MODEL_PROGRESS';
    progress: number;
    loaded: number;
    total: number;
    file?: string;
} | {
    type: 'EXTRACT_RESULT';
    requestId: string;
    result: TagExtractionResult;
} | {
    type: 'WORKER_ERROR';
    requestId?: string;
    message: string;
};

export type { DynamicTagSuggestion as D, TagExtractorLoadCallbacks as T, TagExtractorModelProgressEvent as a, TagExtractorModelStatusEvent as b, TagExtractorScorerConfig as c, TagExtractorScorerConfigInput as d, TagDefinition as e, TagExtractorLocale as f, TagSuggestion as g, TagExtractionInput as h, TagExtractionResult as i, TagExtractor as j, DualModelTagExtractorConfigInput as k, TagExtractorWorkerClientOptions as l, TagExtractorWorkerClient as m, TagExtractorExecutionConfig as n, TagExtractorModelPhase as o, TagExtractorModelSourceConfig as p, TagExtractorModelSourceMode as q, TagExtractorWorkerEvent as r, TagExtractorWorkerRequest as s };
