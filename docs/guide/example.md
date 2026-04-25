# Example

Use this demo to test fixed taxonomy matching and dynamic tag extraction with
the lexical fallback. The model-backed APIs use the same scoring knobs, but
replace the fallback similarity with Transformers.js embeddings or the dual
zero-shot plus embedding path.

<script setup lang="ts">
import TagExtractorExample from '../.vitepress/components/TagExtractorExample.vue'
</script>

<TagExtractorExample />

```ts
import { extractTags, resolveTagExtractorConfig } from '@browser-tag-extractor/core'

const result = await extractTags({
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

console.log(result.predefined[0]?.key)
console.log(result.dynamic.map((item) => item.label))
```
