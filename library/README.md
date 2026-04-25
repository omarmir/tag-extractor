# @browser-tag-extractor/core

Browser-side tag extraction for fixed taxonomy suggestions and optional dynamic
phrase tags.

The package uses `Xenova/all-MiniLM-L12-v2` by default and includes the model
files in the Git-installable package snapshot.

## Install From GitHub

```bash
npm install github:omarmir/tag-extractor#package-release
bun add github:omarmir/tag-extractor#package-release
```

The package includes `models/`. Serve that directory at `/models/` in your app,
or at your Vite `BASE_URL` plus `models/` when deploying under a subpath.

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

Returned predefined tags include `key`, `label`, and `score`. Returned dynamic
tags include `label` and `score`.

Benchmark-only model, quantization, and source configuration helpers are
available from `@browser-tag-extractor/core/benchmark` for this repository's
report runners, but they are not part of the main consumer API.
