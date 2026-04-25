# What Is This?

Tag Extractor is a small TypeScript package for ranking a configured tag
vocabulary against a short narrative and discovering organic phrase tags from
that same text. It is a standalone library for applications that need local,
browser-friendly tag extraction without tying scoring logic to a host product.

The package does three things:

- normalizes tag definitions into scoring text;
- combines semantic embedding similarity with lexical and alias boosts for fixed tags;
- extracts dynamic n-gram tags with a KeyBERT-style document-similarity pass;
- exposes the same worker-client pattern used by the quality-meter package.

It does not save tags, own persistence, or call host application routes. Those
responsibilities stay with the consuming application.
