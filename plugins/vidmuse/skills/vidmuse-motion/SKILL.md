---
name: vidmuse-motion
description: >
  Semantic motion recipes for HyperFrames/GSAP when the Registry has no
  matching block. Use when implementing KPI counters, bar charts, sparklines,
  tables, stat-card layouts, or a named semantic transformation that catalog
  search misses. Do not load it merely because a product film should feel
  dynamic; /vidmuse-create owns launch-film direction and camera grammar.
  Not a product router. Never Remotion. Never invent metrics.
compatibility: Node 22+, npx hyperframes, ffmpeg. Depends on hyperframes-core +
  hyperframes-animation (rules/blueprints). Shares FRAME/taste with vidmuse-recut.
---

# VidMuse Motion — semantic compose skill

**Job:** turn a *viewer job* (“show weekly growth”, “land the KPI”) into a
**deterministic HyperFrames composition** using packaged **motion recipes**,
even when `hyperframes add` finds nothing.

This is a **dependency skill**, not a product entry. Product skills remain:

| Skill | Owns |
| --- | --- |
| `/vidmuse-create` | No speaking plate; promo / explainer / TTS spine |
| `/vidmuse-recut` | Existing speaking footage packaging |
| **`/vidmuse-motion` (this)** | Intent → recipe → HF rules → native HTML/GSAP |

For product launch films, first follow
`../vidmuse-create/references/product-launch-film.md`. Open this skill only
when a specific shot needs a semantic mechanism from the recipe library.
Flow, lensing, scene handoffs, transition families, typography, and overall
motion density remain film-direction decisions; recipes do not choose them.

## Architecture (who wins)

```text
Film plan beat (job + real numbers)
        │
        ▼
  motion-recipes index  ←── you are here
        │ shortlist ≤3
        ▼
  recipe full text (steps, forbid, verify)
        │
        ├─► optional registry_optional → effects.py / hyperframes add + FRAME skin
        │
        └─► always valid: native HTML/GSAP from steps
                │
                ▼
        HF rules named in recipe (read those files)
                │
                ▼
        hyperframes lint → check → snapshot --at verify.times
```

**Authority order**

1. Real numbers / copy from user, script, or ATA — **never invent metrics**
2. Project `FRAME.md` (palette, type, radius) — recipe inherits motion only
3. This skill’s recipe `steps` + `forbid`
4. HyperFrames rules/blueprints listed on the recipe
5. Registry — **optional accelerator**, never a stop condition

**Sibling libraries (do not conflate)**

| Library | Granularity | Runtime |
| --- | --- | --- |
| `product-launch-film` (create) | whole-film direction | n/a |
| **`motion-recipes` (this)** | **implementable mechanism unit** | **hyperframes-gsap required** |
| `effects-overlay` (recut) | Registry taste metadata | installed HTML |

## When to open this skill

Open when **any** is true:

- Film plan needs dataviz / KPI / chart / table / multi-stat cards
- `structure_recipe` is `data-beat` or promo proof needs animated real numbers
- Registry / `effects.py` search returned nothing useful
- User names a recipe id (`kpi-glow-count`) or says “semantic motion”
- You are about to ship a **static screenshot of a chart** as “motion”

**Stay closed** when: pure lower-third packaging; Registry item already covers
the mechanism after FRAME reskin and check; light-path stubs.

## How to use (Agent loop)

```bash
# from this skill directory (or path into plugin cache)
python3 scripts/motion_recipes.py --index
python3 scripts/motion_recipes.py --tag dataviz
python3 scripts/motion_recipes.py kpi-glow-count,weekly-bar-rise --get
python3 scripts/motion_recipes.py --validate
```

1. **Name the job** in one line on the beat (viewer should *understand X*).
2. **Shortlist ≤3** recipes from `--index` / `--tag` (prefer one primary).
3. **`--get` full text** — names alone are not enough; steps and `forbid` bind.
4. **Read each listed HF rule** under `../hyperframes-animation/rules/<id>.md`
   (or the animation skill path in this plugin).
5. **Write native composition** (standalone `index.html` or sub-composition):
   - paused GSAP → `window.__timelines[id]`
   - transform aliases only for spatial motion
   - `gsap.set` / `fromTo` pre-state (never CSS `transform:` fighting GSAP)
6. **Skin with FRAME** tokens; do not leave recipe demo purple unless FRAME is purple.
7. **Verify the mechanism:**

```bash
npx hyperframes lint "$COMP_DIR"
npx hyperframes check "$COMP_DIR"
npx hyperframes snapshot "$COMP_DIR" --at <recipe verify.times> -o "$WORK/proof" --describe false
```

8. Record on the beat / `effect-sources` / `video-context`:
   `motion_recipe_ids: ["kpi-glow-count", …]`, `rules_used`, `registry: none|ids`.

## Hard rules (non-negotiable)

- **Runtime = HyperFrames + GSAP only.** No Remotion, no second engine.
- **Registry miss ≠ fail.** Compose native from the recipe.
- **No metric invention.** Missing data → ask or drop the beat.
- **Seek-safe:** `fromTo` + explicit from; no `Math.random` / `Date.now`.
- **Spatial motion:** `x` `y` `scale` `rotation` (+ opacity/color). Not `width/height/top/left` for motion.
- **Counters:** `font-variant-numeric: tabular-nums`; proxy `onUpdate` + `toLocaleString`; scale transform not `font-size` tween.
- **Bars:** authored CSS **height** (layout); GSAP **`scaleY` 0→1**, origin bottom; **`gsap.set(scaleY:0)` before first paint of the beat**.
- **Paths:** measure `getTotalLength()`, drive `strokeDashoffset`.
- **Contrast:** large type on dark intentional glow still must pass `check` AA — brighten solid fill if glow alone fails.
- **Caps:** ≤3 recipes per scene; ≤1 `production_cost: very-high` per film unless plan documents exception.
- **Gold proof:** `examples/dataviz-semantic/` is a **passed** compose (lint/check/render). Prefer adapting it over freestyle.

## Recipe catalog (v1)

| id | job | cost |
| --- | --- | --- |
| `kpi-glow-count` | Hero money/metric count-up with glow | medium |
| `weekly-bar-rise` | Category/week bars grow with labels | medium |
| `sparkline-draw` | Single series line draws L→R | medium |
| `stat-card-trio` | 1–3 evidence cards entrance + orchestration | low |
| `collapse-merge-morph` | Many inputs collapse into one resolved state | medium |
| `cue-paced-reveal` | Reveal named elements on real narration cues | low |
| `line-carry-transition` | Carry one semantic line across a handoff | medium |
| `pullback-reveal` | Pull back from detail into the larger system | high |
| `ui-strip-away-lock` | Remove interface chrome and lock the proof state | medium |

The table mirrors all records currently in `references/index.jsonl`; query the
index rather than relying on memory when the catalog grows. Full bodies live at
`references/recipes/<id>.md`.

## Docs for humans / skill authors

| Doc | Purpose |
| --- | --- |
| [references/architecture.md](references/architecture.md) | Layers, data flow, anti-patterns |
| [references/agent-playbook.md](references/agent-playbook.md) | Step-by-step Agent checklist + failure recovery |
| [references/verified-run.md](references/verified-run.md) | How the first fail→fix HyperFrames proof was done |
| [examples/dataviz-semantic/](examples/dataviz-semantic/) | Gold HTML + contact sheet |

## Import into product skills

**create:** when `data-beat` / product proof needs charts, load this skill after
promo-recipes; prefer motion-recipes over static PNGs.

**recut:** only for insert/B-roll evidence cards (`recut_ok` true on recipe);
never full-screen dataviz wall over a talking face without plan budget.

## Report

When used, tell the user: recipe ids, rules read, registry none/used,
`check` pass, snapshot paths or contact-sheet, output mp4 path if rendered.
