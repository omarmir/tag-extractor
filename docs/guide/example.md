# Example

```ts
import { extractTags, resolveTagExtractorConfig } from '@browser-tag-extractor/core'

const suggestions = await extractTags({
  text: 'We are looking to increase the trainers ability to perform tasks by providing them training.',
  tags: [
    {
      key: 'capacity-building',
      label: { en: 'Capacity building', fr: 'Renforcement des capacités' },
      description: {
        en: 'Training, staffing, tools, or organizational capacity.',
        fr: 'Formation, dotation, outils ou capacité organisationnelle.',
      },
      aliases: ['training'],
    },
  ],
}, undefined, resolveTagExtractorConfig({ minScore: 0 }))

console.log(suggestions[0]?.key)
```

The lexical fallback should rank `capacity-building` for this sentence even
when the embedding model is unavailable.
