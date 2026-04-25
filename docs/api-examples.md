# API Examples

## Direct Extraction

```ts
import { extractTextTags } from '@browser-tag-extractor/core'

const suggestions = await extractTextTags({
  text,
  predefinedTags,
  allowDynamicTags: true,
  k: 5,
})
```

## Reused Extractor

```ts
import { createTagExtractor } from '@browser-tag-extractor/core'

const extractor = createTagExtractor()
await extractor.loadModel()

const suggestions = await extractor.extract({
  text,
  predefinedTags,
  allowDynamicTags: false,
  k: 2,
})
```
