# What Is This?

Tag Extractor is a small TypeScript package for ranking a configured tag
vocabulary against a short narrative. It is meant to become the host-agnostic
engine behind the GCS-SSC agreement tagging extension.

The package does three things:

- normalizes tag definitions into scoring text;
- combines semantic embedding similarity with lexical and alias boosts;
- exposes the same worker-client pattern used by the quality-meter package.

It does not save tags, know about agreements, or call host application routes.
Those responsibilities remain in the extension.
