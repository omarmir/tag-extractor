# Model Bakeoff

The model bakeoff script compares candidate embedding models, zero-shot
classification, and dual-model pipelines against the same 300-example corpus.
The model catalog records an estimated browser asset size, and candidates above
100 MB are skipped by default.

The benchmark now evaluates a model, strategy, mode, and K value as one unit.
That matters because the same model can be excellent when auto-applying two
tags and much weaker when asked to fill a broad suggestion tray.

## Evaluation Modes

Accurate mode is for auto-applying a small final set of tags. It prioritizes
fixed-tag F1 and precision, then exact match as a secondary signal. The existing
calibrated top-2 strategy remains available in this mode.

Exploration mode is for suggesting a wider set of possible tags to a user. It
uses ranked top-K evaluation for K = 2, 5, 10, and 20. DynamicRecall@K is the
primary exploration metric because suggestion UIs should surface relevant
organic phrases even when the final fixed taxonomy choice is still uncertain.
Recall@K, Diversity@K, and reasonable Precision@K are secondary ranking signals.
Exact match is still reported, but it should not drive exploration-mode
selection because a broad suggestion list is not expected to equal the final tag
set exactly.

Top-K metrics are needed because every candidate produces a ranked list, not
only a thresholded final answer. Evaluating the top 2, 5, 10, and 20 suggestions
shows how quickly useful tags appear as the UI gives the user more room to
explore.

## Current Results

| Candidate/model | Strategy | Estimated MB | Mode | K | Precision | Recall | F1 | Dynamic recall | Exact | Diversity |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `all-minilm-l6-v2-q8` | unified-embedding | 23 | accurate | 4 | 0.378 | 0.743 | 0.500 | 0.649 | 0.007 | 1.000 |
| `all-minilm-l6-v2-q8` | unified-embedding | 23 | exploration | 2 | 0.642 | 0.642 | 0.642 | 0.437 | 0.483 | 1.000 |
| `all-minilm-l6-v2-q8` | unified-embedding | 23 | exploration | 5 | 0.306 | 0.765 | 0.437 | 0.601 | 0.000 | 1.000 |
| `all-minilm-l6-v2-q8` | unified-embedding | 23 | exploration | 10 | 0.158 | 0.792 | 0.264 | 0.781 | 0.000 | 1.000 |
| `all-minilm-l6-v2-q8` | unified-embedding | 23 | exploration | 20 | 0.080 | 0.800 | 0.145 | 0.914 | 0.000 | 1.000 |
| `paraphrase-minilm-l3-v2-q8` | unified-embedding | 18 | accurate | 2 | 0.615 | 0.615 | 0.615 | 0.641 | 0.447 | 1.000 |
| `paraphrase-minilm-l3-v2-q8` | unified-embedding | 18 | exploration | 2 | 0.608 | 0.608 | 0.608 | 0.386 | 0.440 | 1.000 |
| `paraphrase-minilm-l3-v2-q8` | unified-embedding | 18 | exploration | 5 | 0.291 | 0.727 | 0.415 | 0.596 | 0.000 | 1.000 |
| `paraphrase-minilm-l3-v2-q8` | unified-embedding | 18 | exploration | 10 | 0.159 | 0.793 | 0.264 | 0.779 | 0.000 | 1.000 |
| `paraphrase-minilm-l3-v2-q8` | unified-embedding | 18 | exploration | 20 | 0.080 | 0.800 | 0.145 | 0.916 | 0.000 | 0.998 |
| `all-minilm-l12-v2-q8` | unified-embedding | 45 | accurate | 4 | 0.366 | 0.723 | 0.485 | 0.697 | 0.007 | 1.000 |
| `all-minilm-l12-v2-q8` | unified-embedding | 45 | exploration | 2 | 0.620 | 0.620 | 0.620 | 0.443 | 0.457 | 1.000 |
| `all-minilm-l12-v2-q8` | unified-embedding | 45 | exploration | 5 | 0.294 | 0.735 | 0.420 | 0.636 | 0.000 | 1.000 |
| `all-minilm-l12-v2-q8` | unified-embedding | 45 | exploration | 10 | 0.158 | 0.788 | 0.263 | 0.818 | 0.000 | 1.000 |
| `all-minilm-l12-v2-q8` | unified-embedding | 45 | exploration | 20 | 0.080 | 0.800 | 0.145 | 0.921 | 0.000 | 1.000 |
| `bge-small-en-v1-5-q8` | unified-embedding | 67 | accurate | 4 | 0.361 | 0.722 | 0.481 | 0.667 | 0.000 | 1.000 |
| `bge-small-en-v1-5-q8` | unified-embedding | 67 | exploration | 2 | 0.658 | 0.658 | 0.658 | 0.437 | 0.520 | 1.000 |
| `bge-small-en-v1-5-q8` | unified-embedding | 67 | exploration | 5 | 0.297 | 0.743 | 0.425 | 0.630 | 0.000 | 1.000 |
| `bge-small-en-v1-5-q8` | unified-embedding | 67 | exploration | 10 | 0.158 | 0.792 | 0.264 | 0.793 | 0.000 | 1.000 |
| `bge-small-en-v1-5-q8` | unified-embedding | 67 | exploration | 20 | 0.080 | 0.800 | 0.145 | 0.909 | 0.000 | 1.000 |
| `nli-deberta-v3-xsmall-q8` | zero-shot | 33 | accurate | 4 | 0.653 | 0.598 | 0.597 | 0.200 | 0.243 | 1.000 |
| `nli-deberta-v3-xsmall-q8` | zero-shot | 33 | exploration | 2 | 0.602 | 0.602 | 0.602 | 0.200 | 0.430 | 1.000 |
| `nli-deberta-v3-xsmall-q8` | zero-shot | 33 | exploration | 5 | 0.291 | 0.727 | 0.415 | 0.200 | 0.000 | 1.000 |
| `nli-deberta-v3-xsmall-q8` | zero-shot | 33 | exploration | 10 | 0.158 | 0.788 | 0.263 | 0.200 | 0.000 | 1.000 |
| `nli-deberta-v3-xsmall-q8` | zero-shot | 33 | exploration | 20 | 0.080 | 0.800 | 0.145 | 0.200 | 0.000 | 1.000 |
| `dual-deberta-xsmall-minilm-l6-v2-q8` | dual-model | 55 | accurate | 4 | 0.653 | 0.598 | 0.597 | 0.649 | 0.243 | 1.000 |
| `dual-deberta-xsmall-minilm-l6-v2-q8` | dual-model | 55 | exploration | 2 | 0.602 | 0.602 | 0.602 | 0.437 | 0.430 | 1.000 |
| `dual-deberta-xsmall-minilm-l6-v2-q8` | dual-model | 55 | exploration | 5 | 0.291 | 0.727 | 0.415 | 0.601 | 0.000 | 1.000 |
| `dual-deberta-xsmall-minilm-l6-v2-q8` | dual-model | 55 | exploration | 10 | 0.158 | 0.788 | 0.263 | 0.781 | 0.000 | 1.000 |
| `dual-deberta-xsmall-minilm-l6-v2-q8` | dual-model | 55 | exploration | 20 | 0.080 | 0.800 | 0.145 | 0.914 | 0.000 | 1.000 |
| `dual-deberta-xsmall-bge-micro-v2-q8` | dual-model | 78 | accurate | 4 | 0.653 | 0.598 | 0.597 | 0.670 | 0.243 | 1.000 |
| `dual-deberta-xsmall-bge-micro-v2-q8` | dual-model | 78 | exploration | 2 | 0.602 | 0.602 | 0.602 | 0.427 | 0.430 | 1.000 |
| `dual-deberta-xsmall-bge-micro-v2-q8` | dual-model | 78 | exploration | 5 | 0.291 | 0.727 | 0.415 | 0.631 | 0.000 | 1.000 |
| `dual-deberta-xsmall-bge-micro-v2-q8` | dual-model | 78 | exploration | 10 | 0.158 | 0.788 | 0.263 | 0.806 | 0.000 | 1.000 |
| `dual-deberta-xsmall-bge-micro-v2-q8` | dual-model | 78 | exploration | 20 | 0.080 | 0.800 | 0.145 | 0.921 | 0.000 | 1.000 |

## Interpretation

The accurate-mode winner is `paraphrase-minilm-l3-v2-q8` with the calibrated
top-2 strategy. It has the best fixed-tag F1 and the strongest exact-match rate
for auto-applying a compact final tag set.

The exploration-mode winner is `dual-deberta-xsmall-bge-micro-v2-q8` at K = 20.
It has the strongest DynamicRecall@K while staying under the 100 MB browser
asset budget. `all-minilm-l12-v2-q8` reaches nearly the same DynamicRecall@20
with one embedding model, so it is a strong simpler option when fixed taxonomy
classification does not need the zero-shot pass.

Diversity is normalized against the available fixed taxonomy size. In this
corpus most ranked lists cover the requested K without duplicate fixed tags, so
it mainly acts as a guardrail against repeated or collapsed suggestion lists.
