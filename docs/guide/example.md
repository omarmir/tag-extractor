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
  text: 'The document describes API reference cleanup and release note automation.',
  tags: [
    {
      key: 'content-documentation',
      label: { en: 'Content and documentation', fr: 'Content and documentation' },
      description: {
        en: 'Documentation, knowledge bases, release notes, editorial workflows, or style guidance.',
        fr: 'Documentation, knowledge bases, release notes, editorial workflows, or style guidance.',
      },
      aliases: ['documentation', 'release notes'],
    },
  ],
}, undefined, resolveTagExtractorConfig({ minScore: 0 }))

console.log(result.predefined[0]?.key)
console.log(result.dynamic.map((item) => item.label))
```
