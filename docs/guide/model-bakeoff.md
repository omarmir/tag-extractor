# Model Bakeoff

The model bakeoff script compares candidate embedding models against the same
benchmark cases.

The model catalog records an estimated browser asset size. Candidates above
100 MB are skipped by default.

The initial catalog focuses on small sentence embedding models that can run in
browser workers through Transformers.js.

Current results:

| Candidate | Estimated MB | Precision | Recall | F1 | Exact |
| --- | ---: | ---: | ---: | ---: | ---: |
| `Xenova/all-MiniLM-L6-v2` | 23 | 0.601 | 0.692 | 0.613 | 0.183 |
| `Xenova/paraphrase-MiniLM-L3-v2` | 18 | 0.607 | 0.663 | 0.605 | 0.193 |
| `Xenova/all-MiniLM-L12-v2` | 45 | 0.549 | 0.673 | 0.583 | 0.183 |
| `Xenova/bge-small-en-v1.5` | 67 | 0.367 | 0.733 | 0.489 | 0.000 |

The current recommendation is `Xenova/all-MiniLM-L6-v2`: it has the best F1
while staying well below the 100 MB budget.
