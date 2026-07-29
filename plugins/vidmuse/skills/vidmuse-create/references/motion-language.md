# Motion language — create non-Vox

Adapted from HyperFrames motion-language for **VidMuse Create**. Use when writing
and implementing `shot_sequence` on `explainer` / `promo` paths.

**Skip for `vox`.** Recut keeps its own camera craft under
`../vidmuse-recut/references/camera-and-transition-craft.md` — create non-Vox
should read **this** file for beat-internal motion; still read recut camera craft
for multi-scene director density when useful.

Rule bodies live in `../../hyperframes-animation/rules/`. Name moves here; resolve
curves there at HTML time. Between-beat transitions stay as `transition_in` names
(path-routing) — implemented in composition / Timeline assembly, not confused
with within-beat seams in [cut-catalog.md](cut-catalog.md).

---

# Part 1 — move vocabulary (name these in shot_sequence)

Pick 2–4 moves per beat (entrance → sequential reveal → settle), not all at once.
Cite rule id after `→` when implementing.

## Kinetic type

- **hard-cut / flash word-swap** → `discrete-text-sequence`
- **in-place token cycle** → `discrete-text-sequence`
- **per-word staggered reveal** → `dynamic-content-sequencing`
- **kinetic beat-slam** → `kinetic-beat-slam`

## Typewriter

- **type-on with caret** / **backspace-and-retype** → `discrete-text-sequence`

## Count-up / data

- **value-scaled counter** → `counting-dynamic-scale`
- **bars / progress / ring fill** → `stat-bars-and-fills`  
  Prefer `/vidmuse-motion` recipes when building KPI/bars/sparklines natively.

## Reveal / decode

- **SVG self-draw** → `svg-path-draw`
- **3D char flip-decode** → `hacker-flip-3d` (use sparingly)

## Camera

- **push / focus / drift** → `multi-phase-camera` (no lazy back-half pan)
- **zoom-to-target** → `coordinate-target-zoom`
- **pan / focus-lock** → `viewport-change`

## Layout motion

- **cluster→outward expansion** → `center-outward-expansion`
- **split-tilt cards** → `split-tilt-cards`
- **orbit** → `orbit-3d-entry` (scarce)

## Surface / UI (promo)

- **3D page-scroll** → `3d-page-scroll`
- **cursor click + ripple** → `cursor-click-ripple`
- **button press** → `press-release-spring`
- **keyword glow** → `asr-keyword-glow` (align glow to ATA word times when possible)

## Morph / handoff

- **scale-swap** → `scale-swap-transition`
- **card morph-anchor** → `card-morph-anchor`

## Seam cuts (inside one beat)

- **zoom-through / inverse zoom-through** · **cut-the-curve** · **waterfall**  
  → [cut-catalog.md](cut-catalog.md)

## Hold aliveness (scarce)

- **subtle jitter** only → low-amplitude `sine-wave-loop`  
- Live SVG internals → `svg-icon-enrichment`  
- **No** lazy card breathing as decoration

## Entrances

- **spring-pop / long-tail settle** → `spring-pop-entrance` (`power3` default)
- **ambient glow bloom** (scarce hero) → `ambient-glow-bloom`

---

# Part 2 — doctrine (load-bearing)

## 1. Smooth beats bouncy — `power3` default

Long-tail decel. No `back.out` / `bounce.out` / `elastic.out` as house style.
Overshoot only when briefly explicitly playful.

## 2. Sequential reveal timed to VO (anti-PPT)

- Do **not** dump the full beat canvas in the first ~25%.
- Reveal each piece when the matching **`vo_cue` / ATA span** names it.
- Spread reveals across the beat, especially the back half.
- Map local scene times using words in `transcript.json` for that beat's
  `ata_range`.

## 3. No motion over bad motion

- No circular breathing(scale loop) to fake life.
- No aimless slow pan/push in the back half that churns the eye.
- Held still > weak motion. Subtle jitter is the only default aliveness.
- A machine-check miss is not permission to add motion. Name the **local
  object** and **semantic verb** the animatic intended, then repair that
  action. If no such action exists, change the plan or mark a hold.

## 4. Local semantic response beats global stimulus

- A spoken `Skill` cue may wake the Skill card, its connector, or the object it
  creates. It must not default to a full-frame tint.
- A product action should move the real UI target/cursor/result, not trigger a
  decorative scan over unrelated pixels.
- Full-frame flashes, color washes, and scan bands are scarce scene-level
  punctuation. Repeating them at cue intervals reads as a system fault.
- Ambient drift, breathing, and glow do not count as semantic cue response.

## 5. Internal seams are velocity-matched

Within-beat swaps use cut-catalog (same direction/speed at the cut), not hard
slideshow cuts between local Scenes.

## One-line

Smooth long-tail; VO-paced local semantic reveal; stillness over screensaver;
coherent camera space; velocity-matched internal seams.

---

# Part 3 — seek-safe / HyperFrames hard rules

Program beds and compositions are seeked frame-by-frame:

- No infinite `repeat` / `yoyo` as life
- No `Math.random` / `Date.now` motion
- Entrances prefer explicit `fromTo` into a locked layout (layout-before-motion)
- No CSS `@keyframes` / `transition` for primary motion — drive GSAP on the
  composition timeline
- Between-beat exit owned by `transition_in` / next entrance — intermediate
  beats should not prefab empty themselves with long exits

## Forbidden

| Mode | Fix |
| --- | --- |
| Slideshow front-load | doctrine 2 + rewrite shot_sequence |
| Screensaver floaters | stillness + jitter only |
| Default bounce | power3 |
| One global `y+30 opacity power2.out` | vary eases/families; tabulate entrances |
| Cue-bound full-frame flash / periodic wash | animate the named local object; reserve one justified scene-level punctuation at most |
| Camera drift added to avoid freeze | lock off or execute the approved camera intent |

---

# Naming example

> Scene 1 (0.0–1.0s): hero line **per-word staggered reveal**  
> Scene 2 (1.0–3.2s): nodes **cluster→outward** as each cue fires; counter **value-scaled** on its cue  
> Scene 3 (3.2–4.5s): hold; optional keyword glow on payoff word; stillness
