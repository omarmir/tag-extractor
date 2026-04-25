# Example

Use this demo to test fixed taxonomy matching and dynamic tag extraction with
the simplified public API. The bundled default model is `Xenova/all-MiniLM-L12-v2`.

<script setup lang="ts">
import TagExtractorExample from '../.vitepress/components/TagExtractorExample.vue'
</script>

<TagExtractorExample />

```ts
import { extractTextTags } from '@browser-tag-extractor/core'

const result = await extractTextTags({
  text: 'The document describes API reference cleanup and release note automation.',
  predefinedTags: [
    {
      key: 'content-documentation',
      label: 'Content and documentation',
      description: 'Documentation, knowledge bases, release notes, editorial workflows, or style guidance.',
      aliases: ['documentation', 'release notes'],
    },
  ],
  allowDynamicTags: true,
  k: 5,
})

console.log(result.predefined[0]?.key)
console.log(result.dynamic.map((item) => item.label))
```
