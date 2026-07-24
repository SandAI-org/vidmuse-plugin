# Cut catalog — within-beat seams (create non-Vox)

Worker-built **inside one beat / composition**, not between-film-plan beats.
Between-beat seams use `transition_in` (`crossfade`, `push-slide`, …) from
story-design — those names are **not** this catalog's technique names
(except the shared idea of zoom-through at different scopes).

**Skip for `vox`.**

Principle for all four: **cut at peak velocity; match direction and speed on
both sides of the cut.**

---

## When to use which

| Technique | Scope | Feel |
| --- | --- | --- |
| **Zoom-through** | Within-beat text/subject swap, Z toward viewer | progressing through |
| **Inverse zoom-through** | Payoff / arrival | landing on |
| **Cut-the-curve** | Local Scene→Scene on x/y | carried sideways |
| **Waterfall** | Word-by-word text→text seam | wave across the line |

Unfinished phrase building one idea across local Scenes → cut-the-curve / waterfall.  
State change inside a beat → zoom-through family.

---

## Blur (Z-axis variants)

| Subject | Peak blur |
| --- | --- |
| Headline / short phrase | **~10px** |
| Full-frame surface (card, screenshot) | **~18–20px** |

Same peak blur both sides of the cut. Blur the wrapper, not every child.

---

## 1. Zoom-through (forward)

Never show both texts at once. Outgoing scales up + blurs + fades; hard swap at
peak; incoming continues from smaller scale into focus.

- Exit ~0.2s: scale `1→~1.2`, blur `0→peak`, opacity `1→~0.15`; scale ease `power3.in`; opacity linear
- Cut: outgoing opacity 0; incoming at opacity ~0.15, scale ~0.75, blur peak
- Entry ~0.5s: scale →1, blur →0, opacity →1 on `expo.out` / long-tail

## 2. Inverse zoom-through

Outgoing recedes (`1→~0.8`); incoming starts oversized (`~1.25`) and retracts to
1. Same-direction shrink rule. Good for payoff lines.

## 3. Cut-the-curve (default local Scene seam)

Partial travel + fade — not full off-screen tours.

| Direction | A exit | B entry start → end |
| --- | --- | --- |
| Left | `x: 0→-230` | `x: +230→0` |
| Right | `x: 0→+230` | `x: -230→0` |
| Up / down | mirror on y | mirror on y |

Mirror eases: exit `power4.in`, entry `power4.out`, same distance/duration.
Opacity on exit finishes early (~25–30% of travel) so nothing dies in dead air
long before the cut.

## 4. Waterfall (word-level cut-the-curve)

Each outgoing word ramps (`x` + fast fade) with reading-order stagger; incoming
words cascade with mirrored ease and shrinking stagger. Strongest text→text seam.

---

## Anti-patterns

| Don't | Instead |
| --- | --- |
| Two texts visible mid zoom-through | hard cut at blur peak |
| 20px blur on small text | 10px text / 20px surfaces |
| Different directions across a cut | same axis + direction |
| Full off-screen exits | partial travel + fade |
| Gentle entry ease after hard exit | mirror velocities |
| Using catalog names as film-level `transition_in` | keep registry transition set separate |

---

## Tie-back

Name the seam inside `shot_sequence` Scene lines
(`move: "cut-the-curve left"`). Implement seek-safe GSAP on the composition
timeline ([motion-language.md](motion-language.md) Part 3).
