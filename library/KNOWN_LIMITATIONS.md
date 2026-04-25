# Known Limitations

- The scorer ranks configured tags and extracts dynamic phrase suggestions; it does not create canonical taxonomy definitions for you.
- Short descriptions can under-specify the correct tag.
- Broad aliases can cause false positives.
- Small embedding models can confuse adjacent concepts.
- French quality depends on the selected embedding model.
- The lexical fallback is deterministic but less flexible than model-backed scoring.
