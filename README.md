# Tag Extractor

Browser-side TypeScript library for extracting tags from plain text. It ranks
predefined taxonomy tags and can also suggest dynamic phrase tags from the same
document.

This repository follows the same layout as `quality-meter`:

- `library/`: the host-agnostic TypeScript package.
- `docs/`: VitePress documentation.
- `tools/benchmark/`: benchmark datasets and model catalog.
- `tools/scripts/`: report and packaging scripts.

The library is intentionally independent of any host application. The public API
takes plain text, predefined tags, whether dynamic tags are allowed, and a K
value for ranked suggestions. The default runtime uses the bundled
`Xenova/all-MiniLM-L12-v2` model and does not expose model selection or
quantization settings to normal consumers.

## Install

```bash
npm install github:omarmir/tag-extractor#package-release
bun add github:omarmir/tag-extractor#package-release
```

The package snapshot includes `library/models/` in the published package as
`models/`. Serve those files at `/models/`, or at your Vite `BASE_URL` plus
`models/` when deploying under a subpath.

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
      description: 'Documentation, knowledge bases, release notes, or editorial workflows.',
      aliases: ['documentation', 'release notes'],
    },
  ],
  allowDynamicTags: true,
  k: 5,
})
```

Two model paths are benchmarked:

- unified embedding: one small feature-extraction model ranks fixed tags and
  dynamic phrase candidates;
- dual model: DeBERTa zero-shot classification ranks fixed tags while a small
  embedding model extracts dynamic phrase tags.

Benchmarks report both accurate mode for auto-applying a small final tag set and
exploration mode for ranked top-K suggestions. The library default is
`Xenova/all-MiniLM-L12-v2`, which is the best practical single-model default
from the current bakeoff.

The scorer also applies a generic negation penalty when configured tag terms
appear near cues such as "no", "not", or "without".

Dynamic tags are returned as lowercase hyphenated labels, for example
`data-analytics` rather than `data analytics`.

## Development

```bash
bun install
bun run build:library
bun run report:main
bun run report:model-bakeoff
bun run docs:dev
```
