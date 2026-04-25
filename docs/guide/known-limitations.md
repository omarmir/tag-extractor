# Known Limitations

Small embedding models are fast enough for browser use but are imperfect.

- They can over-rank semantically adjacent tags when descriptions are vague.
- They need lexical boosts for acronyms, program names, and exact operational terms.
- They should not invent custom tags; they only rank configured tags.
- French support depends on the selected model and the quality of French tag descriptions.

The benchmark tools are intended to make those limitations visible before the
library is wired into an extension release.
