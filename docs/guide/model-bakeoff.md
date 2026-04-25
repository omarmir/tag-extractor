# Model Bakeoff

The model bakeoff script compares candidate embedding models and dual-model
pipelines against the same benchmark cases.

The model catalog records an estimated browser asset size. Candidates above
100 MB are skipped by default.

The catalog covers the unified embedding path and the dual-model path:
DeBERTa zero-shot classification for fixed taxonomy tags plus a small embedding
model for dynamic KeyBERT-style phrase extraction.

Current results:

| Candidate | Strategy | Estimated MB | Precision | Recall | F1 | Dynamic recall | Exact |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `Xenova/all-MiniLM-L6-v2` | Unified embedding | 23 | 0.391 | 0.708 | 0.496 | 0.759 | 0.023 |
| `Xenova/paraphrase-MiniLM-L3-v2` | Unified embedding, calibrated top-2 | 18 | 0.743 | 0.615 | 0.658 | 0.777 | 0.357 |
| `Xenova/all-MiniLM-L12-v2` | Unified embedding | 45 | 0.443 | 0.717 | 0.537 | 0.766 | 0.073 |
| `Xenova/bge-small-en-v1.5` | Unified embedding | 67 | 0.321 | 0.642 | 0.428 | 0.770 | 0.000 |
| `Xenova/nli-deberta-v3-xsmall` + `Xenova/all-MiniLM-L6-v2` | Dual model | 55 | 0.566 | 0.687 | 0.610 | 0.759 | 0.217 |
| `Xenova/nli-deberta-v3-xsmall` + `Xenova/bge-micro-v2` | Dual model | 78 | Failed | Failed | Failed | Failed | Failed |

The current recommendation is `Xenova/paraphrase-MiniLM-L3-v2` with a top-2
fixed suggestion cap. A corpus-wide sweep kept `minScore: 0.2` and selected
`maxSuggestions: 2`, improving F1 from `0.647` to `0.658` without adding
subject-specific rules. The generic negation penalty also improved the dual
DeBERTa plus MiniLM path from `0.590` to `0.610` F1 while remaining under the
100 MB budget. `Xenova/bge-micro-v2` was attempted for the dual dynamic model
but Hugging Face returned an unauthorized config response for that public Xenova
path during this run.
