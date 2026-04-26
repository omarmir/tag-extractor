import { s as TagExtractorWorkerRequest, r as TagExtractorWorkerEvent } from './types-BdeRlwWh.js';

type WorkerScope = {
    onmessage: ((event: MessageEvent<TagExtractorWorkerRequest>) => void | Promise<void>) | null;
    postMessage(message: TagExtractorWorkerEvent): void;
};
declare function registerTagExtractorWorker(scope?: WorkerScope): void;

export { registerTagExtractorWorker };
