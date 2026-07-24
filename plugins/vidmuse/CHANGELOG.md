# Changelog

All notable changes to the VidMuse Codex plugin (`vidmuse@personal`) are documented here.

Format: version <= git tag conceptually; plugin and package.json versions stay in lockstep.

---

## 0.3.7 — 2026-07-24

### Added

- **`/vidmuse-motion` dependency skill** — semantic motion recipes for HyperFrames/GSAP when Registry has no block.
  - `skills/vidmuse-motion/` — SKILL, `scripts/motion_recipes.py`, architecture / agent-playbook / verified-run docs
  - v1 recipes (4): `kpi-glow-count`, `weekly-bar-rise`, `sparkline-draw`, `stat-card-trio`
  - Gold example `examples/dataviz-semantic/` (HF check-passed trio board)
  - Human guide: `docs/MOTION-SEMANTIC-LAYER.md`
- Create wires to motion skill on data-beat / Registry miss; `validate:skill` includes motion recipes.

### Note

- Motion recipes **do not** replace product routers or shot-cards; they are the implement path after intent is known.
- First end-to-end verify (lint/check/snapshot/render) documented in `verified-run.md` (HF 0.7.69).

### Install

```bash
codex plugin add vidmuse@personal
# expect cache …/vidmuse/0.3.7 after package + sync
```

---

## 0.3.6 — 2026-07-23

### Added

- **Shot-card deck for `/vidmuse-create`** — curated **32 / 106** motion recipe priors extracted from [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) (Apache-2.0; text only).
  - `skills/vidmuse-create/references/shot-cards/` — `bridge.jsonl`, full `cards/*.md`, `NOTICE.md`, README menu
  - `skills/vidmuse-create/scripts/shot_cards.py` — `--index` / `--recipe` / `--get` / `--validate`
  - Agent **auto-opens** on promo/UI recipes (`saas-promo-30s`, `site-to-video`, `brand-sizzle`, `data-beat`, `hook-proof-outro`), user-named cards, or product-UI-hero briefs; stays **closed** for quiet explainers, Vox collage, stubs, and `/vidmuse-recut` (`recut_ok: false`)
  - Implement via **HyperFrames + GSAP** only (FRAME skins); Remotion demos / gallery media **not** vendored — previews stay at the upstream gallery URL
- `npm run validate:skill` now includes `shot_cards.py --validate`.
- `VENDOR-SOURCES.json` records the shotcraft extract provenance.

### Changed

- `promo-recipes.md` wires shot-card shortlists into promo-family recipes; film plan may carry `shot_ref: shotcraft:<id>` and `video-context.json` → `shot_refs`.
- `vidmuse-create` SKILL documents deck open rules, shortlist caps (≤5/film, ≤1 very-high), and report of `shot_refs`.

### Install

```bash
codex plugin add vidmuse@personal
# expect cache: ~/.codex/plugins/cache/personal/vidmuse/0.3.6
# open a new Codex Thread
```

---

## 0.3.2 — 2026-07-23

### Added

- **Create voice spine as hard gates** (`vidmuse-create` SKILL.md): Gate A (env/login check, no OS/browser TTS fallback) → Gate B (script lock → VidMuse TTS → `doubao_speech/audio_text_alignment` → `transcript.json`; never guessed timestamps; regenerate voice ⇒ re-run ATA) → Gate C (early Timeline serve with real VO + ATA captions before hero graphics).
- **Anti-PPT enforcement**: anti-goals failure table (silent deck / guessed timeline / non-VidMuse voice / PPT spacing / catalog collage / ungrounded look), film-plan rejection criteria, create craft rules (static layout before motion, scene transitions, entrance-ease diversity, golden-line ladder), light-path stub waiver for ≤20s tests, delivery checklist.
- **`skills/vidmuse-create/references/promo-recipes.md`** — six intent → structure recipes (saas-promo-30s, site-to-video, knowledge-explainer, data-beat, brand-sizzle, hook-proof-outro) with mechanism shortlists and anti-collage rules; structure priors, not templates.
- **`write_dsl.py --mode audio`** — narration + ATA subtitles DSL when no picture exists yet (create Gate C); main/overlay tracks empty, duration probed from `audio.mp3`. Documented in `vidmuse-timeline.md`.

### Changed

- `vidmuse-create` frontmatter description rewritten around the hard voice requirement (kept under the 1024-char limit); `SKILLS.md` create row matches.
- Create Taste Gate 7 is now count-ready (entrance tabulation at assemble).

---

## 0.3.1 — 2026-07-23

### Changed

- Brand assets: `assets/icon.png` and `assets/logo.png` replaced with the official mark from [vidmuse.ai](https://vidmuse.ai/en) (`/logo.png`, upscaled to 512² / 1024² with transparency).

---

## 0.3.0 — 2026-07-22

### Added

- **`/vidmuse-create`** — second product skill for films **without** a recording of a person speaking:
  knowledge explainers (script → TTS → ATA → shared pipeline), website/product promos grounded in the real site, generated-media films via `vidmuse model run`.
- **`skills/vidmuse-recut/references/asset-sourcing.md`** — shared media ladder (user-provided → real-world → AI generation), FRAME-governed prompts, `asset-sources.json` provenance, recut gated generated video, create-mode fabric rules.
- Create **Taste Gate adaptations** (ground-led vs spectacle), **TTS → ATA** cookbook spine, **Timeline main-track** guidance when there is no talking-head plate.
- Orientation defaults on recut: **progress rail default-on** (plain time vs chaptered); **marked transitions** at real chapter boundaries (`device-craft`, `camera-and-transition-craft`, `packaging-tells` V6 carve-out for plain rails).

### Changed

- Product surface is **dual-entry**: speaking footage → `/vidmuse-recut`; no speaking plate → `/vidmuse-create`. Recut is no longer described as the sole product router.
- `SKILLS.md`, `plugin.json` description / longDescription / defaultPrompts, `setup.sh` skill whitelist (**includes `vidmuse-create`**), and `/hyperframes` §0 route table hand off create work correctly.
- Recut artifact table lists `asset-sources.json`; recut may generate stills/music/SFX inside a packaging run with video B-roll user-gated.

### Shared taste stack (from 0.2.6, still in force)

- Aesthetic charter, packaging tells, countable Taste Gate, motion language, captions/device craft, taste distillation — one system for both product skills.

### Install

```bash
# from plugin source (or after packaging)
codex plugin add vidmuse@personal
# expect cache: ~/.codex/plugins/cache/personal/vidmuse/0.3.0
# open a new Codex Thread
```

---

## 0.2.6 — 2026-07-22

### Added

- `aesthetic-charter.md` — twelve dimensions of “good” + film-level trade-offs.
- `packaging-tells.md` — temporal T1–T8 and visual V1–V6 unexamined-default list.
- `captions-and-golden-lines.md`, `device-craft.md`, `taste-distillation.md`.
- Motion language in `camera-and-transition-craft.md` (easing, duration anchors, ≤2 movers); FRAME.motion is runtime law.
- Taste Gate mechanical *count* items (source-led share denominators, status tokens, emphasis); entrance diversity deferred to motion review.
- Style-composition anti-rut shortlist; packaging-analysis **Charter trades** section.

### Changed

- Charter dimensions may override craft *anchors* with a written reason; they may **not** silently cancel density caps, Gate counts, single-anchor, or Numerals & Claims.
- `taste-authority.md` clarifies relation to the charter (what good is vs who wins source conflicts).

---

## 0.2.5 — 2026-07-22

### Added

- `taste-authority.md` authority stack (BRIEF → room → FRAME → single anchor → creative hygiene → Registry).
- Proof-density cap for locked-off mono; Frame **Taste Gate** (room first, source-led share, single anchor, status chrome).
- Director mode reframed as density/ownership, not a prestige tier; short static mono prefer Packaging.

### Changed

- Direction phase must not browse `hyperframes-creative` as an art menu.

---

## 0.2.4 and earlier

See git history and `docs/HANDOFF-2026-07-22.md` for routing fixes, layered Timeline (`write_dsl.py`), setup global-CLI vs plugin-only skills, and initial plugin shell.
