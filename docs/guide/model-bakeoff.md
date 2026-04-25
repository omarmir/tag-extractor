# Model Bakeoff

The model bakeoff script compares candidate embedding models and dual-model
pipelines against the same benchmark cases.

The model catalog records an estimated browser asset size. Candidates above
100 MB are skipped by default.

The catalog covers unified embedding, zero-shot-only, and dual-model paths.
The dual-model path uses DeBERTa zero-shot classification for fixed taxonomy
tags plus a small embedding model for dynamic KeyBERT-style phrase extraction.

Current results:

| Candidate | Strategy | Estimated MB | Precision | Recall | F1 | Dynamic recall | Exact |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `Xenova/all-MiniLM-L6-v2` | Unified embedding | 23 | 0.378 | 0.743 | 0.500 | 0.649 | 0.007 |
| `Xenova/paraphrase-MiniLM-L3-v2` | Unified embedding, calibrated top-2 | 18 | 0.615 | 0.615 | 0.615 | 0.641 | 0.447 |
| `Xenova/all-MiniLM-L12-v2` | Unified embedding | 45 | 0.366 | 0.723 | 0.485 | 0.697 | 0.007 |
| `Xenova/bge-small-en-v1.5` | Unified embedding | 67 | 0.361 | 0.722 | 0.481 | 0.667 | 0.000 |
| `Xenova/nli-deberta-v3-xsmall` | Zero-shot only | 33 | 0.653 | 0.598 | 0.597 | 0.200 | 0.243 |
| `Xenova/nli-deberta-v3-xsmall` + `Xenova/all-MiniLM-L6-v2` | Dual model | 55 | 0.653 | 0.598 | 0.597 | 0.649 | 0.243 |
| `Xenova/nli-deberta-v3-xsmall` + `SmartComponents/bge-micro-v2` | Dual model | 78 | 0.653 | 0.598 | 0.597 | 0.670 | 0.243 |

The current recommendation is `Xenova/paraphrase-MiniLM-L3-v2` with a top-2
fixed suggestion cap. It has the best fixed-tag F1 and exact-match rate in this
general document corpus. DeBERTa is benchmarked on its own for fixed taxonomy
classification, and both dual-model strategies now complete successfully. The
`SmartComponents/bge-micro-v2` dual path provides the strongest dynamic recall
among the completed dual strategies while staying under the 100 MB budget.
