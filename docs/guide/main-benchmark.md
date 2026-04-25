# Main Benchmark

The main benchmark uses a 300-example corpus covering workforce, health,
housing, infrastructure, community, environment, food security, safety, arts,
and digital inclusion agreements.

Each case has:

- agreement text;
- the configured tag vocabulary;
- expected positive tags;
- expected negative tags.

The report summarizes precision, recall, F1, and top misses.

Current lexical baseline:

| Metric | Value |
| --- | ---: |
| Cases | 300 |
| Mean precision | 0.594 |
| Mean recall | 0.455 |
| Mean F1 | 0.498 |
| Exact match rate | 0.220 |

The lexical baseline is intentionally kept as a fallback. The model bakeoff
shows higher recall and F1 for the best small embedding models.
