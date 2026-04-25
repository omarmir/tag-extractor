# Main Benchmark

The main benchmark uses a 300-example corpus covering common software,
operations, support, finance, legal, HR, research, marketing, data, product,
and documentation use cases.

Each case has:

- source text;
- the configured tag vocabulary;
- expected positive tags;
- expected dynamic phrase tags;
- expected negative tags.

The report summarizes fixed-tag precision, fixed-tag recall, fixed-tag F1,
dynamic-tag recall, and top misses.

Current lexical baseline:

| Metric | Value |
| --- | ---: |
| Cases | 300 |
| Mean precision | 0.706 |
| Mean recall | 0.620 |
| Mean F1 | 0.639 |
| Mean dynamic recall | 0.673 |
| Exact match rate | 0.337 |

The lexical baseline is intentionally kept as a fallback. The model bakeoff
shows higher dynamic recall and stronger fixed-tag F1 for the best small model
paths.
