import { T as TagExtractorLoadCallbacks } from './types-BdeRlwWh.js';
export { a as TagExtractorModelProgressEvent, b as TagExtractorModelStatusEvent } from './types-BdeRlwWh.js';

type PredefinedTag = {
    key: string;
    label: string;
    description?: string;
    aliases?: string[];
};
type TagExtractorRequest = {
    text: string;
    predefinedTags: PredefinedTag[];
    allowDynamicTags?: boolean;
    k?: number;
};
type PredefinedTagResult = {
    key: string;
    label: string;
    score: number;
};
type DynamicTagResult = {
    label: string;
    score: number;
};
type TagExtractorResult = {
    predefined: PredefinedTagResult[];
    dynamic: DynamicTagResult[];
};
type BrowserTagExtractor = {
    loadModel(callbacks?: TagExtractorLoadCallbacks): Promise<void>;
    extract(request: TagExtractorRequest): Promise<TagExtractorResult>;
    reset(): void;
};
declare function createTagExtractor(): BrowserTagExtractor;
declare function extractTextTags(request: TagExtractorRequest): Promise<TagExtractorResult>;

export { type BrowserTagExtractor, type DynamicTagResult, type PredefinedTag, type PredefinedTagResult, TagExtractorLoadCallbacks, type TagExtractorRequest, type TagExtractorResult, createTagExtractor, extractTextTags };
