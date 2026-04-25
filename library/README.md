# @browser-tag-extractor/core

Host-agnostic browser tag extraction for configured tag vocabularies.

The package exposes:

- lexical fallback ranking;
- Transformers.js embedding-backed ranking;
- model configuration defaults;
- evaluation helpers;
- a worker runtime and worker client.

## Install

```bash
bun add @browser-tag-extractor/core @huggingface/transformers
```

## Usage

```ts
import { createTransformersTagExtractor } from '@browser-tag-extractor/core'

const extractor = createTransformersTagExtractor({
  modelId: 'Xenova/all-MiniLM-L6-v2',
  modelSource: {
    mode: 'local',
    localModelPath: '/models/',
  },
})

await extractor.loadModel()
const suggestions = await extractor.extract({ text, tags })
```
