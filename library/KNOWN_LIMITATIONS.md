# Known Limitations

- The scorer only ranks configured tags; it does not create new tag definitions.
- Short descriptions can under-specify the correct tag.
- Broad aliases can cause false positives.
- Small embedding models can confuse adjacent public-sector concepts.
- French quality depends on the selected embedding model.
- The lexical fallback is deterministic but less flexible than model-backed scoring.
