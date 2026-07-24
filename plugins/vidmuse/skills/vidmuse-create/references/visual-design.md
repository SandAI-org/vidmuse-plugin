# Visual design — time-coded shot sequence (create non-Vox)

Adapted from HyperFrames explainer/promo visual-design for **VidMuse Create**.
You enrich each film-plan beat with how it **looks and moves**. You write **no
requirement** to spawn HF frame-workers — but you **must** write the same unit
they would receive: a **time-coded shot sequence** paced to ATA VO cues.

**Load when:** `create_path` is `explainer` or `promo`.  
**Skip when:** `vox` ([vox-collage.md](vox-collage.md) owns plates).  
**Motion doctrine:** [motion-language.md](motion-language.md).  
**Within-beat seams:** [cut-catalog.md](cut-catalog.md).  
**Shapes menu:** `../../hyperframes-animation/blueprints-index.md`.

## The unit is a time-coded shot sequence

A beat is **not** a static slide with one fade-in. It is a sequence of time
windows across its ATA span.

```
Scene 1 (0.0–Xs):  only what the VO is saying at beat-local t=0
Scene 2 (Xs–Ys):   next piece reveals as VO names it
  …
Scene N (…–end):   content resolved; hold the read (stillness; subtle jitter at most)
```

- Times are **beat-local seconds** (0 = `ata_range[0]`).  
- **Window count ≈ number of `vo_cues`** (plus optional hold). A two-cue line →
  ~2–3 windows. No mandatory three-act mantra — the sin is **front-load**.
- **Nothing appears before its cue.** At local t=0 show only the first cue's
  subject; later pieces wait.
- **End on a held read.** Prefer stillness to bad motion (breathing, lazy pan).
- Silent beats: pace windows to the argument, not equal thirds.

### Front-load failure (primary PPT tell)

Everything that will ever appear dumps in the first ~25% of the beat, then freezes
for the rest of the VO. **Reject and rewrite** the shot_sequence.

## Pick the shape

1. Open blueprints-index; match `path_role` → blueprint (or confirm story candidate).
2. Read `blueprints/<id>.md` — time-coded template + **signature move**.
3. **Reproduce** / **Adapt** (state keep/change; never drop signature move) /
   **Compose** (`blueprint: compose` + name the signature move yourself).
4. Promo UI may use `shot_ref: shotcraft:<id>` as motion prior — still flesh into
   Scene lines; still FRAME-skin; never paste Remotion demos.

## What each beat gains

Keep story fields. Append:

- `blueprint:` id + `(Reproduce|Adapt)` or `compose` or `shot_ref:`
- `focal:` hero element (invented type/diagram node, or real-ui surface)
- `roles:` foreground / background / supporting (few, load-bearing)
- `shot_sequence:` Scene lines with on_screen + move + layout inline
- optional `sfx:` names only (do not embed random `<audio>` in overlay HTML)

Example:

```yaml
- id: beat-03
  path_role: feature_showcase
  ata_range: [12.4, 18.1]
  vo_cues: ["First the snowball", "then the hill", "then the speed"]
  visual_kind: diagram
  blueprint: compose
  focal: snowball with labeled rings
  transition_in: push-slide LEFT
  shot_sequence:
    - t: [0.0, 1.2]
      on_screen: "hill field dim; small snowball seats upper-left"
      move: "spring-pop entrance → settle"
      layout: "centered ~45%"
    - t: [1.2, 4.0]
      on_screen: "one labeled ring per cue; total ticks"
      move: "layer-reveal + count-up on cue"
      layout: "asymmetric 60/40, 3 depth layers"
    - t: [4.0, 5.7]
      on_screen: "final ring + total held"
      move: "stillness (subtle jitter ok)"
      layout: "hold center"
```

## Explainer — invent the visual

No capture required. First-class treatments:

- **Type / kinetic** — hero word, coined term, short enumeration (often primary)
- **Abstract graphic** — metaphor the script names (snowball, spotlight)
- **Diagram / dataviz** — build across Scenes; KPI beats prefer `/vidmuse-motion`
  or blueprint `dataviz-countup`, not a static chart PNG

Invented hero fills **~40–60%** of frame. Not a postage stamp in empty dark.

## Promo — ground in real UI

- Proof beats: real screenshots / device chrome around **real** UI when URL exists.
- Capture early; put paths in work dir; reference in `on_screen`.
- Fake generated dashboards as sole proof → hard fail (path-routing #5).

## Layout vocabulary (inline per Scene)

Framing: centered · rule-of-thirds · split · layered-depth · asymmetric 60/40 ·
triptych · full-width strip.  
Density: primary ≥40% canvas; ≥3 depth layers when busy.  
Hierarchy: ≥2 of size / weight / contrast / position / motion.  
**Vary framing across the film** — not the same template every beat.

Caption band: plan primary content in top ~83% (Timeline captions often sit low).

## `## Video direction` once

At top of film plan / STORYBOARD, write shared invariants once:

- palette system (from FRAME)
- motion grammar + VO-paced reveal model
- which beats are intentional held breathers
- negative list: front-load slideshow · screensaver floaters · default bounce ·
  catalog dump skins

Per-beat lines are **deltas**, not restatements.

## FRAME / preset seed

Before pretty HTML:

1. If brand/site tokens exist → derive FRAME roles from them.
2. Else pick **one** preset under
   `../../hyperframes-creative/frame-presets/` whose look fits register
   (e.g. editorial for knowledge, bold-poster / blue-professional for SaaS).
3. Copy roles into FRAME.md; do not ship pure `#000` canvas + white Inter as the
   entire identity without a named intent.

## Compose checklist

- [ ] `## Video direction` written once
- [ ] Every non-Vox beat has shot_sequence, no front-load
- [ ] Blueprint / shot_ref / compose named; Adapt keeps signature move
- [ ] Moves named from motion-language (not raw ms recipes in the plan)
- [ ] Promo proof includes real-ui where required
- [ ] Stillness holds allocated; not every beat busy
