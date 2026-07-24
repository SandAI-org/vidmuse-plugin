# Verified run — dataviz semantic trio (2026-07-24)

This documents a **real HyperFrames verification**, not a design wish. Goal:
prove that **semantic recipes → rules → native HTML/GSAP** can reproduce a
competitor-style three-card analytics board (KPI + weekly bars + retention
line) **without Registry and without Remotion**.

## Environment

| | |
| --- | --- |
| HyperFrames CLI | `0.7.69` (npx) |
| Node | 22+ |
| Host | macOS, local Chrome renderer |
| Workdir | `/tmp/hf-dataviz-verify` |
| Plugin gold copy | `skills/vidmuse-motion/examples/dataviz-semantic/` |

## Semantic mapping used

| Recipe | Rule | Technique |
| --- | --- | --- |
| kpi-glow-count | counting-dynamic-scale | proxy count + scale + text-shadow |
| weekly-bar-rise | stat-bars-and-fills | CSS height layout; GSAP scaleY stagger |
| sparkline-draw | svg-path-draw | strokeDashoffset  len→0 |
| stat-card-trio | entrance only | card opacity/y/scale stagger |

Blueprint touchstone: `dataviz-countup` (numbers/charts as hero).

## Sequence of work

1. `npx hyperframes init . --example blank` (skills install noise ignored).
2. Replace `index.html` with a single 9s `main` composition, three cards.
3. **lint fail #1** — `gsap_css_transform_conflict` on `.bar`  
   CSS had `transform: scaleY(0)` while GSAP tweened `scaleY`.  
   **Fix:** remove CSS transform; use `tl.fromTo(bars, {scaleY:0}, {scaleY:1})`.
4. **check fail #1** — WCAG contrast on `#kpi` and chart grid labels (glow-only
   purple failed solid contrast sampling).  
   **Fix:** lighten KPI fill to `#e9d5ff`; grid label opacity ≈0.72.
5. **lint** 0/0 · **check passed** (95/95 contrast, motion/layout clean).
6. `hyperframes snapshot --at 0.5,1.5,3.2,5.5,8.0` → 6 PNGs + contact-sheet.
7. `hyperframes render -o out/dataviz-semantic.mp4` → **9.0s · 1920×1080 · h264 · ~754KB**.

## Proof frames (what progress looked like)

| t | Expected |
| --- | --- |
| 0.5s | Cards entering |
| 1.5s | KPI mid-count (e.g. ~$9.1k visible during run) |
| 3.2s | KPI final $9,946; bars mostly up; labels |
| 5.5s–8s | Sparkline drawn; hold readable |

Artifacts mirrored under `docs/verify-dataviz-semantic/` in the plugin repo
(local proof; large binaries may stay untracked).

## Lessons written back into recipes

1. **Never leave motion pre-state only in CSS `transform`.**
2. **Always `gsap.set(scaleY:0)` (or from state) before bar beat** so t=0 is empty.
3. **Glow ≠ contrast.** Solid fill must pass AA; glow is decoration.
4. **`immediateRender: false` on fromTo does not replace a t=0 hide** if the
   beat starts late — set initial state at timeline build.
5. **Registry absence did not block** shipping.

## How another Agent should replay

Follow [agent-playbook.md](agent-playbook.md) using recipes in this skill and
optionally start from `examples/dataviz-semantic/index.html`. Success gate is
the same: **check passed + snapshots at verify times**.

Do not claim the look is “port of Remotion”; claim **HF native compose from
semantic recipes**.
