# What Is This?

Tag Extractor is a small TypeScript package for ranking a configured tag
vocabulary against a short narrative and discovering organic dynamic tags from
that same text. It is a standalone library for applications that need local,
browser-friendly tag extraction without tying scoring logic to a host product.

The package does five things:

- normalizes tag definitions into scoring text;
- combines semantic embedding similarity with lexical and alias boosts for fixed tags;
- extracts dynamic n-gram candidates with a KeyBERT-style document-similarity pass;
- returns dynamic labels as lowercase hyphenated strings, such as `data-analytics`;
- ships the default `Xenova/all-MiniLM-L12-v2` model files for local use.

The main API is intentionally narrow: pass `text`, `predefinedTags`,
`allowDynamicTags`, and `k`. Model choice, quantization, thresholds, and remote
model loading are benchmark concerns, not part of the main consumer API.

It does not save tags, own persistence, or call host application routes. Those
responsibilities stay with the consuming application.
