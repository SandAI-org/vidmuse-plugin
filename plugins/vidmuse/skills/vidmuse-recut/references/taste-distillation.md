# Taste Distillation

How project feedback compounds into the plugin's taste layer. Without this
loop, `evaluation.json` `feedback.events` is an archive; with it, every
project makes the next one's defaults smarter. A rejected choice carries more
information than an accepted one — it marks the exact edge of the user's
taste, which no amount of confirmed defaults reveals.

This is a manual, user-initiated pass (run it when the user asks to "distill
taste" / 沉淀品味, or offer it after a project with substantial feedback). It
never runs silently: every write-back below is proposed to the user before it
lands, because taste memory is the user's, not the agent's.

**Boundary note:** during a packaging run the skill directory is read-only
(SKILL.md Runtime boundary). Distillation is not part of a packaging run — it
is a maintenance pass on the plugin **source repository**, done with the user,
followed by a version bump and re-package so the installed skill actually
updates. Never edit the installed skill copy in place mid-project.

## Inputs

Across the projects being distilled (one or several work directories):

- `evaluation.json` → `feedback.events` — especially `action: "modify"`
  entries with `from`/`to` (direction and magnitude of the user's hand) and
  rejections at the coverage or direction gates;
- direction-gate outcomes — which candidate directions the user picked and
  which lost (see the shortlist step in
  [VidMuse style composition](../../vidmuse-design/references/style-composition.md));
- Timeline write-back edits — overlay disablements and trims are quiet
  rejections.

## Distillation rules

Look for **repetition across projects**, not single events. One rejection is
a project fact; the same rejection twice is a taste fact.

| repeated signal | destination |
| --- | --- |
| the same device family rejected or toned down (e.g. per-word captions turned off, status chips deleted) | new or sharpened tell in [VidMuse packaging tells](../../vidmuse-design/references/packaging-tells.md), with its *why* and charter dimension |
| the same direction family losing at the gate against a stated preference | note on the relevant atom/profile digests (`data/*.jsonl`) so future shortlists carry the precedent |
| the same modify direction on tokens (e.g. durations always shortened, accents always desaturated) | adjusted anchor in the relevant craft reference, with the old anchor noted |
| aspect/layout/direction confirmations | HyperFrames preference store (`media-use` `prefs.mjs`) — already part of step 12 |

What does **not** get distilled: single-project choices explained by that
project's content or brand, user experiments they later reverted, and
anything the user marked as project-scoped when giving the feedback (the
`learning scope` field in `feedback.events` decides; when it's absent, ask).

## Write-back discipline

- Propose each candidate write-back as a one-line diff summary ("add tell:
  per-word captions rejected in 3/3 recent projects"); the user approves per
  item.
- Tells are appended with the same three-part form as the rest of the file:
  the pattern, why it reads as generated, the charter dimension.
- Anchor adjustments keep the deviation clause intact — an anchor is moved,
  never hardened into a ban, unless the user says ban.
- Record the distillation itself (date, projects covered, items written) at
  the bottom of this file so the next pass starts where this one ended.

## Distillation log

*(append entries here: date · projects · items written)*
