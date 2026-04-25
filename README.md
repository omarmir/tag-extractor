# Tag Extractor

Nuxt extension support package for browser-side agreement tag extraction. It
supports both fixed taxonomy suggestions and dynamic phrase tags from the same
narrative.

This repository follows the same layout as `quality-meter`:

- `library/`: the host-agnostic TypeScript package.
- `docs/`: VitePress documentation.
- `tools/benchmark/`: benchmark datasets and model catalog.
- `tools/scripts/`: report and packaging scripts.

The library is intentionally independent of GCS-SSC host APIs. A future
`gcs-agreement-tags` extension update can consume this package for tag ranking,
worker runtime, and benchmark-calibrated defaults.

Two model paths are benchmarked:

- unified embedding: one small feature-extraction model ranks fixed tags and
  dynamic phrase candidates;
- dual model: DeBERTa zero-shot classification ranks fixed tags while a small
  embedding model extracts dynamic phrase tags.

## Development

```bash
bun install
bun run build:library
bun run report:main
bun run report:model-bakeoff
bun run docs:dev
```
