# API Examples

The public API is deliberately narrow. Pass text, predefined tags, whether
dynamic tags are allowed, and K. The bundled L12 model is used automatically.
Dynamic tag labels are returned as lowercase hyphenated strings.

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

## Tag Shape

```ts
const predefinedTags = [
  {
    key: 'incident-response',
    label: 'Incident response',
    description: 'Outages, escalation work, remediation, root cause analysis, and service recovery.',
    aliases: ['outage', 'postmortem', 'escalation'],
  },
]
```
