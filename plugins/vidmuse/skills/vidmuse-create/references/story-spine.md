# Story spine — value-first narrative doctrine

Applies to narrated, story-driven `/vidmuse-create` films and to newly authored
narrative segments inside an owning VidMuse run. It does **not** override the
story already present in `/vidmuse-recut` source footage, and it does not force
a narration spine onto music-led or purely semantic-motion pieces.

Each workflow's own story-design reference owns its archetypes, beat sequences, and frame vocabulary. This file owns three cross-workflow rules about **order** and **justification** — the reverse iceberg: lead with why it's valuable, not with what it is or how it was made.

## 1. The hook speaks the viewer's language

The first beat answers "why should I care" in **outcome language** — what the viewer gains, avoids, or finally understands. Subject-internal vocabulary is banned in the hook: file / function / API names for a code change; a feature list for a product; the source article's section headings for an explainer. Numbers are welcome only when they carry stakes ("40% faster cold starts"), never inventory ("23 files changed").

## 2. Reverse iceberg — value before evidence

The value claim (the brief's `message`) lands **by the second beat**. Everything after it is evidence in service of that claim — the diff, the mechanism, the feature demo, the site's screenshots. Implementation is the footnote of the story, not the spine.

Self-check on the finished beat list:

- Delete every evidence beat — the remaining beats must still state the value on their own.
- Delete the value beats — if the video still seems to work, it was a feature tour / diff readout, not a story.

Structure is value-first; the **voice** stays whatever the workflow prescribes (a PR video keeps its plain, no-hype developer voice — leading with value is an ordering decision, not a marketing register).

## 3. The storyboard is a proposal, not a listing

When Create step 4 presents the scene plan (using the evidence rules in
[`../../hyperframes-core/references/brief-contract.md`](../../hyperframes-core/references/brief-contract.md)):

- Open by echoing the strategy line: **"This video tells [audience] that [message]."**
- Present the frames as a markdown table, one row per frame:

  | Frame            | Beat      | On screen                                               | Why                             |
  | ---------------- | --------- | ------------------------------------------------------- | ------------------------------- |
  | 01 — Not anymore | hook · 9s | States the old pain and resolves it in the same breath. | Lands the value claim in beat 1 |

  **Why** is the frame's job in the story (from its `narrativeRole`), traced back to the message — a frame whose why cannot be traced to the message is a frame to cut, not to decorate.

- Recommendations keep their receipts (brief-contract § 3): the archetype choice, the beat count, and any beat the user might question each state their basis.

The proposal shape — echo line → frame table → style / duration footer → "approve or adjust" — is the cheapest place to iterate: a frame change here costs 30 seconds; the same change after build costs minutes.
