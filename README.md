# Tag Extractor

Browser-side TypeScript library for extracting tags from plain text. It
supports both fixed taxonomy suggestions and dynamic phrase tags from the same
document.

This repository follows the same layout as `quality-meter`:

- `library/`: the host-agnostic TypeScript package.
- `docs/`: VitePress documentation.
- `tools/benchmark/`: benchmark datasets and model catalog.
- `tools/scripts/`: report and packaging scripts.

The library is intentionally independent of any host application. It works with
plain text, tag definitions, scoring configuration, and optional browser worker
runtime helpers.

Two model paths are benchmarked:

- unified embedding: one small feature-extraction model ranks fixed tags and
  dynamic phrase candidates;
- dual model: DeBERTa zero-shot classification ranks fixed tags while a small
  embedding model extracts dynamic phrase tags.

The current benchmark winner is `Xenova/paraphrase-MiniLM-L3-v2` with a
corpus-calibrated top-2 fixed suggestion cap. The scorer also applies a generic
negation penalty when configured tag terms appear near cues such as "no",
"not", or "without".

## Development

```bash
bun install
bun run build:library
bun run report:main
bun run report:model-bakeoff
bun run docs:dev
```
