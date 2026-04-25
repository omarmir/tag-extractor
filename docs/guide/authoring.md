# Authoring Tags

A tag definition should be specific enough that a short text can match it
without relying on broad business words.

Good tag definitions include:

- a stable key;
- a concise label;
- a concrete description;
- aliases users naturally type in notes, tickets, documents, or task summaries.

Labels and descriptions can be translated by the consuming application, but the
standalone public API accepts a single `label` and optional `description` per
tag.

Prefer concrete aliases such as `release notes`, `root cause analysis`,
`facility renovation`, `API reference`, or `support ticket`. Avoid aliases that
match every document, such as `project`, `task`, or `update`.
