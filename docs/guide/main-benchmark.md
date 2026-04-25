# Main Benchmark

The main benchmark uses a 300-example corpus covering workforce, health,
housing, infrastructure, community, environment, food security, safety, arts,
and digital inclusion agreements.

Each case has:

- agreement text;
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
| Mean precision | 0.618 |
| Mean recall | 0.480 |
| Mean F1 | 0.521 |
| Mean dynamic recall | 0.849 |
| Exact match rate | 0.213 |

The lexical baseline is intentionally kept as a fallback. The model bakeoff
shows higher dynamic recall and stronger fixed-tag F1 for the best small model
paths.
