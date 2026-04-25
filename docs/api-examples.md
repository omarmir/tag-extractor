# API Examples

## Lexical Fallback

```ts
import { extractTags } from '@browser-tag-extractor/core'

const suggestions = await extractTags({ text, tags })
```

## Worker Runtime

```ts
import { createTagExtractorWorkerClient } from '@browser-tag-extractor/core'

const client = createTagExtractorWorkerClient({
  config: {},
  createWorker: () => new Worker('/tag-extractor-worker.js', { type: 'module' }),
})

await client.loadModel()
const suggestions = await client.extract({ text, tags })
```
