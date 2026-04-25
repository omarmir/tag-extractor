# Reports Overview

Reports are generated under `tools/reports/`.

```bash
bun run report:main
bun run report:model-bakeoff
```

The main report evaluates the default hybrid scorer over the benchmark corpus.
The model bakeoff report compares model candidates that are expected to remain
under the 100 MB browser-asset budget.

The model bakeoff emits one row per model, strategy, mode, and K value. Accurate
mode reports the small final tag set that is suitable for auto-apply workflows.
Exploration mode reports ranked top-K suggestion quality for K = 2, 5, 10, and
20, where DynamicRecall@K is the primary metric for broad suggestion UIs.
