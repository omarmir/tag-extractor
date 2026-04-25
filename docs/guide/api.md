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

The main package entrypoint always uses the bundled L12 model. Benchmark-only
configuration for alternate models, quantization, thresholds, and remote model
loading lives in `@browser-tag-extractor/core/benchmark`.

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
- `k`: the ranked suggestion count for both predefined and dynamic tags. If it
  is omitted, the library uses `5`.

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

Dynamic tag labels are normalized as lowercase hyphenated strings, such as
`data-analytics` or `incident-response`, never `data analytics`. The scorer may
use space-separated phrases internally for embeddings, but returned dynamic
labels are formatted for tag storage and display.

## Package Assets

The package release includes the default model files:

```txt
models/Xenova/all-MiniLM-L12-v2/config.json
models/Xenova/all-MiniLM-L12-v2/tokenizer_config.json
models/Xenova/all-MiniLM-L12-v2/tokenizer.json
models/Xenova/all-MiniLM-L12-v2/onnx/model_quantized.onnx
```

In Vite and VitePress builds, the default model path follows `BASE_URL`, so a
site deployed under `/tag-extractor/` loads from `/tag-extractor/models/...`.
In other setups, serve the same files at `/models/...`.
