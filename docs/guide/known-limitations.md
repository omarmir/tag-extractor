# Known Limitations

Small embedding models are fast enough for browser use but are imperfect.

- They can over-rank semantically adjacent tags when descriptions are vague.
- They need lexical boosts for acronyms, program names, and exact operational terms.
- Dynamic tags are phrase candidates, so they may return a useful longer phrase
  instead of the shortest human label.
- Negative phrasing such as "does not include training" now receives a generic
  absence penalty when tag labels or aliases appear near negation cues. It is
  still a local heuristic, not a full contradiction model.
- French support depends on the default model and the quality of translated tag descriptions.
- The public library uses `Xenova/all-MiniLM-L12-v2` as the bundled default.
  Other model and quantization choices are benchmark-only concerns.

The benchmark tools are intended to make those limitations visible before the
library is wired into an extension release.
