---
name: hyperframes-animation
description: "Implement approved motion choreography in HyperFrames with atomic rules, multi-phase scene blueprints, transitions, techniques, runtime adapters, and animation-map auditing. Use after a VidMuse motion brief exists, or directly for runtime-specific GSAP, Lottie, Three.js, Anime.js, CSS, WAAPI, TypeGPU, or named text-effect implementation. HyperFrames-native: one paused seek-safe deterministic timeline; do not use an effect catalog to invent the film's motion reason."
---

# HyperFrames Animation

All motion knowledge in one skill: **rules** (atomic recipes), **blueprints** (multi-phase scene templates), **transitions** (scene-to-scene), **techniques** (broader motion-design patterns), and **adapters** (per-runtime APIs).

For the composition contract (data attributes, sub-compositions, determinism) see `hyperframes-core`.

In a VidMuse film, read the approved `vidmuse-motion` brief before choosing a rule, blueprint, transition, or effect. This skill implements motion; it does not invent the semantic reason, speech cue, camera intervention, or effect family. If the brief is missing, return to the film owner and motion director instead of browsing animation recipes for inspiration.

Keep this skill animation-only. Never start HyperFrames Studio or a timeline UI, and never select or download HyperFrames-managed AI/media models. A GSAP paused timeline is allowed because it is the deterministic render clock, not a UI.

## Default: compose the approved cue chain

Pick the smallest set of atomic rules from `rules-index.md` that realizes the approved relationship verb and full lifecycle. Build one paused GSAP timeline with named labels for prepare, spoken or visible triggers, dependent responses, hold, resolve, and handoff. A clip start is not permission to reveal every layer at once.

Keep container entry separate from semantic payload. It is valid to establish a surface before the speaker reaches the claim, but land each word, node, value, branch, or proof at its own cue. Pair every entrance with an authored exit or continuity handoff, and keep source-camera transforms stable between meaningful attention transfers.

## Load a blueprint when

- The scene matches an existing pre-designed multi-phase template (brand-reveal, social-proof, etc.) and reusing its phase pipeline saves real authoring time
- You want runnable ground-truth code for a complex 4-5 phase choreography

Blueprints live in `blueprints-index.md`. Each entry points to `blueprints/<id>.md` (recipe). Do not read it speculatively; load it when you've already decided you need scene-level orchestration.

## Routing

| Want to…                                                                       | Read                                                |
| ------------------------------------------------------------------------------ | --------------------------------------------------- |
| Pick an atomic motion pattern by trigger / tag                                 | `rules-index.md`                                    |
| Read one rule's full HTML / CSS / GSAP recipe                                  | `rules/<name>.md`                                   |
| Pick a multi-phase scene template                                              | `blueprints-index.md`                               |
| Read one blueprint's full recipe                                               | `blueprints/<id>.md`                                |
| Author a scene transition (CSS-driven, between two clips)                      | `transitions/overview.md`, `transitions/catalog.md` |
| Look up a broader motion-design technique                                      | `techniques.md`                                     |
| Analyze an existing composition's animation map                                | `scripts/animation-map.mjs`                         |
| GSAP API — timeline / tweens / position parameters                             | `adapters/gsap.md`                                  |
| GSAP — drop-in effect recipes                                                  | `rules/gsap-effects.md`                             |
| GSAP — transforms / perf                                                       | `adapters/gsap-transforms-and-perf.md`              |
| GSAP — eases / stagger                                                         | `adapters/gsap-easing-and-stagger.md`               |
| GSAP — timeline / labels                                                       | `adapters/gsap-timeline-and-labels.md`              |
| Lottie / dotLottie (After Effects exports, `window.__hfLottie`)                | `adapters/lottie.md`                                |
| Three.js / WebGL (3D scenes, `AnimationMixer`, `hf-seek`)                      | `adapters/three.md`                                 |
| Anime.js (`window.__hfAnime`)                                                  | `adapters/animejs.md`                               |
| CSS keyframes (`animation-delay` / `play-state` / `fill-mode`)                 | `adapters/css-animations.md`                        |
| Web Animations API (`element.animate()`, `currentTime` seek)                   | `adapters/waapi.md`                                 |
| TypeGPU / WebGPU (`navigator.gpu`, WGSL, compute pipelines)                    | `adapters/typegpu.md`                               |
| HTML-as-texture + WebGL/GLSL post-fx (capture live DOM via `drawElementImage`) | `adapters/html-in-canvas-patterns.md`               |
| Named text-animation effects (24 IDs via external `animate-text` skill)        | `adapters/animate-text.md`                          |

## Picking a runtime

- **GSAP** is the default for 95% of motion work — covers timeline orchestration, transforms, easing, stagger. All atomic rules in this skill are GSAP-based.
- **Lottie** when an asset has its own pre-baked timeline (typically After Effects exports).
- **Three.js** for 3D scenes, camera motion, shader-driven visuals.
- **Anime.js** for lightweight tweening when GSAP is overkill.
- **CSS** for simple repeated motifs, decoration, shimmer — no JavaScript animation cost.
- **WAAPI** for native browser keyframes without a GSAP dependency.
- **TypeGPU / WebGPU** for GPU-rendered canvases (particles, liquid glass, custom shaders).

Multiple runtimes can coexist in one composition. Each registers its instances on the runtime-specific global so HyperFrames can seek all of them in one pass.

## Critical Constraints

**Prerequisite: `hyperframes-core` → Non-Negotiable Rules** (single paused timeline, `data-duration` governs length, no `Math.random` / `Date.now` / `performance.now`, no `repeat: -1`, no page-load `gsap.set` on later-scene clips, no `display` or raw `visibility` tweens, and no timeline construction inside `async` / `setTimeout` / `Promise`). GSAP `autoAlpha` and zero-duration visibility sets at explicit timeline boundaries remain allowed by core. Use those exceptions only on non-clip elements or wrappers inside a clip; the framework owns `.clip` lifecycle. Don't restate the full contract here.

Animation-craft additions on top of core's contract:

- **Pre-calculated layout constants** — never derive positions from `getBoundingClientRect()` at tween time. Tween-time DOM measurements desync because the renderer samples in parallel; compute coordinates once at composition setup and reuse.
- **Spatial motion uses GSAP transform aliases only** (`x`, `y`, `scale`, `rotation`). Core's allowlist also permits `opacity` / `color` / `backgroundColor` / `borderRadius` for non-spatial property tweens — but never `width` / `height` / `top` / `left` for layout changes.
- **Semantic labels are timeline anchors** — derive labels from the motion brief's exact ATA, performance, and source cues. Use relative offsets only for consequences within the same causal event; do not distribute reveals evenly merely to fill duration.
- **Lifecycle is complete** — sample and verify the pre-state, each payload landing, the readable hold, and the exit or handoff. Do not rely on the framework hiding a clip to stand in for designed resolution.

## Scripts

```bash
node skills/hyperframes-animation/scripts/animation-map.mjs <composition-dir> \
  --out <composition-dir>/.hyperframes/anim-map
```

Reads every GSAP timeline registered on `window.__timelines`, enumerates tweens, samples bboxes, computes flags, outputs `animation-map.json`. Use it to audit choreography (dead zones, stagger consistency, lifecycle warnings) after authoring.

`animation-map.mjs` resolves helper packages from the current project first, then can bootstrap the bundled HyperFrames package version. Set `HYPERFRAMES_SKILL_PKG_VERSION=<version>` only when running the skill outside the bundled CLI/skill install and you need to pin that bootstrap version explicitly.

## See Also

- `hyperframes-core` — composition structure, data attributes, sub-compositions, deterministic render contract
- `vidmuse-design` — palettes, typography, narration, and creative direction
- `hyperframes-cli` — allowed local `lint / check / snapshot / render` loop
