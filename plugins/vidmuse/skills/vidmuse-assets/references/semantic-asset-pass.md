# Semantic Asset Pass

Use this pass after transcript timing and source grounding, before a create
film plan or recut packaging analysis is confirmed. Its purpose is not to
decorate named words. It identifies where a real asset helps the viewer
recognize, compare, remember, or follow the argument.

## Pass order

1. Read the complete transcript and semantic chapter map.
2. Extract meaningful named entities and recurring visual subjects with ATA
   ranges. Do not rely on isolated keyword matches.
3. Canonicalize each mention as an organization, product, model, person,
   place, event, or concept.
4. Assign its role in this passage:
   `subject`, `comparison`, `history-node`, `source`, `incidental`, or
   `already-visible`.
5. Decide the viewer job:
   `establish-identity`, `compare`, `timeline-node`, `explain-relation`,
   `evidence`, `recall`, or `none`.
6. Decide whether to show a logo, generic icon, photo, diagram node, text
   label, existing asset, or nothing.
7. Group related opportunities such as an AI-model history timeline.
8. Write `asset-plan.json`; run `--complete-pass` to bind the decision set to
   the current transcript SHA-256, then validate it before any provider call.
9. Resolve approved deterministic entries. Each resolution must carry the
   current request fingerprint and exact resolved identity.
10. Bind stable opportunity ids into the film/packaging plan.

## Editorial gate

An entity mention is a candidate, not an instruction to show a logo.

Prefer an asset when it:

- establishes a subject at first meaningful introduction;
- makes a comparison or historical sequence scan faster;
- anchors a recurring subject across several beats;
- supplies real-world identity/evidence that type alone would weaken.

Prefer text-only or suppression when:

- the mention is incidental;
- the source frame already shows the identity clearly;
- the mark would repeat without adding information;
- the asset would create a logo wall, fight captions, or replace a stronger
  diagram;
- identity is ambiguous or no official mark exists.

One quiet introduction plus reuse is usually stronger than replaying the same
logo on every mention. Treat all assets as part of the film's intervention
density, not as free decoration.

## Canonical identity rules

- Preserve organization/product/model boundaries. `OpenAI`, `ChatGPT`,
  `GPT-4`, `Codex`, and `Sora` are related but not interchangeable.
- Provider aliases help retrieve the canonical mark; they do not authorize an
  editorial substitution.
- When a model has no independent official mark, prefer its name as editable
  type plus the owning organization's mark when the relationship is relevant.
- Never invent, redraw, or generate a missing logo.
- Use low confidence to choose `text-label-only` or `suppress`, not to guess.

## Entity-rich sequences

For histories, comparisons, ecosystems, and model maps:

- create one group with ordered `member_ids`;
- choose one variant policy for the sequence;
- keep label, date, and logo roles consistent;
- reuse the same resolved asset for repeated entities;
- use company mark + model label when model-specific identity is unavailable;
- preserve quiet beats around the sequence so it reads as an argument, not an
  asset catalog.

## Plan contract

Schema: `../schemas/asset-plan.schema.json`.
Example: [asset-plan.example.json](asset-plan.example.json).

Every opportunity records:

- stable `id`;
- literal `mention` and `canonical_entity`;
- `entity_type`, `semantic_role`, and `visual_job`;
- one or more ATA `ranges`;
- optional `beat_id`;
- `decision`, `reason`, and confidence;
- `asset_query` only when a file is actually required;
- optional placement/weight guidance;
- `resolution` only after `media-use` returns a local receipt.

The plan also requires a completed `pass_receipt` containing the Semantic Pass
contract version, transcript path and SHA-256, opportunity count, and completion
time. A deliberate empty plan is valid; an unstamped empty array is not.

Resolved file opportunities record `request_fingerprint`,
`requested_entity`, and `resolved_entity`. Editing an asset query makes an old
receipt stale. For logos, canonical, requested, and resolved identities must
agree after punctuation/case normalization.

`show-logo` requires an exact deterministic `logo` query. Decisions such as
`text-label-only`, `diagram-node`, and `suppress` require no download.

## Create integration

Run after the voice/ATA spine and subject grounding, before the film plan.
Film-plan beats refer to approved opportunities through `asset_refs`. A
website-capture filename may remain in legacy `asset_candidates`, but semantic
entities should use ids.

## Recut integration

Run after transcript alignment and source inspection, before packaging
coverage. Only include an asset opportunity when it improves the plate.
Respect the source-led density cap; `already-visible` usually suppresses an
overlay.

## Resolve and report

```bash
node ../vidmuse-assets/scripts/asset_plan.mjs \
  --project <work-dir> --complete-pass

node ../vidmuse-assets/scripts/asset_plan.mjs \
  --project <work-dir> --validate

node ../vidmuse-assets/scripts/asset_plan.mjs \
  --project <work-dir> --resolve
```

Resolution writes the exact receipt back to `asset-plan.json` and mirrors
resolved entries into composition-facing `asset-sources.json`.

The final composition uses real `data-asset-ref="ao_*"` DOM bindings pointing
at the receipt path. Comments or planning prose do not count as implementation.

Report resolved, reused, missed, and deliberately suppressed opportunities.
Do not report a film asset as usable until its local path and license receipt
exist.
