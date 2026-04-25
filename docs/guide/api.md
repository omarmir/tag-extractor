# API

```ts
import { createTransformersTagExtractor } from '@browser-tag-extractor/core'

const extractor = createTransformersTagExtractor({
  modelSource: {
    mode: 'local',
    localModelPath: '/extensions/gcs-agreement-tags/models/',
  },
})

await extractor.loadModel()

const suggestions = await extractor.extract({
  text: 'The agreement funds training and coaching for local coordinators.',
  tags: [
    {
      key: 'capacity-building',
      label: { en: 'Capacity building', fr: 'Renforcement des capacités' },
      description: {
        en: 'Training, staffing, tools, and organizational capacity.',
        fr: 'Formation, dotation, outils et capacité organisationnelle.',
      },
      aliases: ['training', 'skills development'],
    },
  ],
})
```

The returned suggestions include the final score, the semantic score, the
lexical score, and any exact alias matches that contributed to the boost.
