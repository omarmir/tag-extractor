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
| `Xenova/all-MiniLM-L6-v2` | Unified embedding | 23 | 0.384 | 0.702 | 0.489 | 0.759 | 0.017 |
| `Xenova/paraphrase-MiniLM-L3-v2` | Unified embedding | 18 | 0.607 | 0.545 | 0.547 | 0.777 | 0.140 |
| `Xenova/all-MiniLM-L12-v2` | Unified embedding | 45 | 0.423 | 0.697 | 0.517 | 0.766 | 0.053 |
| `Xenova/bge-small-en-v1.5` | Unified embedding | 67 | 0.321 | 0.642 | 0.428 | 0.770 | 0.000 |
| `Xenova/nli-deberta-v3-xsmall` + `Xenova/all-MiniLM-L6-v2` | Dual model | 55 | 0.546 | 0.667 | 0.590 | 0.759 | 0.197 |
| `Xenova/nli-deberta-v3-xsmall` + `Xenova/bge-micro-v2` | Dual model | 78 | Failed | Failed | Failed | Failed | Failed |

The current recommendation is the dual DeBERTa plus MiniLM path when the extra
model load is acceptable. It has the best fixed-tag F1 while remaining under
the 100 MB budget. The smaller `paraphrase-MiniLM-L3-v2` path is the best
single-model option in this corpus. `Xenova/bge-micro-v2` was attempted for the
dual dynamic model but Hugging Face returned an unauthorized config response for
that public Xenova path during this run.
