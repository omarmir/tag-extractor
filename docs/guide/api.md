# API

The public API is intentionally small. The library ships with
`Xenova/all-MiniLM-L12-v2` as the default local model, so callers choose the
text, the predefined taxonomy, whether dynamic tags are allowed, and the K value
for the ranked suggestions.

## Installation

```bash
npm install github:omarmir/tag-extractor#package-release
bun add github:omarmir/tag-extractor#package-release
```

The Git-installable package includes the model files under `models/`. Serve
that directory at `/models/`, or at your Vite `BASE_URL` plus `models/` when
deploying under a subpath.

## Usage

```ts
import { createTagExtractor } from '@browser-tag-extractor/core'

const extractor = createTagExtractor()
await extractor.loadModel()

const result = await extractor.extract({
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
```

For one-off calls, use `extractTextTags(...)`:

```ts
import { extractTextTags } from '@browser-tag-extractor/core'

const result = await extractTextTags({
  text,
  predefinedTags,
  allowDynamicTags: false,
  k: 2,
})
```

## Request

```ts
type TagExtractorRequest = {
  text: string
  predefinedTags: PredefinedTag[]
  allowDynamicTags?: boolean
  k?: number
}

type PredefinedTag = {
  key: string
  label: string
  description?: string
  aliases?: string[]
}
```

- `text`: the text to tag.
- `predefinedTags`: your fixed taxonomy.
- `allowDynamicTags`: set `false` when you only want taxonomy matches.
- `k`: the ranked suggestion count for both predefined and dynamic tags.

## Result

```ts
type TagExtractorResult = {
  predefined: Array<{
    key: string
    label: string
    score: number
  }>
  dynamic: Array<{
    label: string
    score: number
  }>
}
```

The benchmark-only model, dtype, and source configuration APIs are kept out of
the main package entrypoint. Benchmark tooling imports them from
`@browser-tag-extractor/core/benchmark`.
