# API

```ts
import {
  createDualModelTagExtractor,
  createTransformersTagExtractor,
} from '@browser-tag-extractor/core'

const extractor = createTransformersTagExtractor({
  modelSource: {
    mode: 'local',
    localModelPath: '/extensions/gcs-agreement-tags/models/',
  },
})

await extractor.loadModel()

const tags = [
  {
    key: 'capacity-building',
    label: { en: 'Capacity building', fr: 'Renforcement des capacités' },
    description: {
      en: 'Training, staffing, tools, and organizational capacity.',
      fr: 'Formation, dotation, outils et capacité organisationnelle.',
    },
    aliases: ['training', 'skills development'],
  },
]

const result = await extractor.extract({
  text: 'The agreement funds training and coaching for local coordinators.',
  tags,
})
```

`result.predefined` contains configured taxonomy matches. `result.dynamic`
contains organic phrase tags extracted from the narrative.

For the highest-accuracy benchmark path, load a zero-shot classifier for fixed
tags and an embedding model for dynamic KeyBERT-style extraction:

```ts
const dualExtractor = createDualModelTagExtractor({
  predefinedModelId: 'Xenova/nli-deberta-v3-xsmall',
  dynamicModelId: 'Xenova/all-MiniLM-L6-v2',
  predefinedDtype: 'q8',
  dynamicDtype: 'q8',
})

const dualResult = await dualExtractor.extract({
  text: 'The agreement funds training and coaching for local coordinators.',
  tags,
})
```

Returned fixed suggestions include the final score, semantic score, lexical
score, any exact alias matches that contributed to the boost, and any negated
term matches that triggered the generic absence penalty. Dynamic suggestions
include the label, score, n-gram size, and occurrence count.
