# Reports Overview

Reports are generated under `tools/reports/`.

```bash
bun run report:main
bun run report:model-bakeoff
```

The main report evaluates the default hybrid scorer over the benchmark corpus.
The model bakeoff report compares model candidates that are expected to remain
under the 100 MB browser-asset budget.
