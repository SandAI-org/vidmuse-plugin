# Story design — create path `promo`

Adapted from HyperFrames `product-launch-video` story-design for **VidMuse Create**.
Proof prefers **real capture** (site/app screenshots, product UI). Timing =
**ATA**. Delivery = **VidMuse Timeline**.

**Load when:** `create_path: promo` ([path-routing.md](path-routing.md)).
**Do not load for:** `vox`, quiet knowledge explainers, `/vidmuse-recut`.

## Core rule

A website is an information layout. A promo is an **emotional sequence** around
one promise. Reorder, merge, and omit page sections freely — never follow nav order.

## Method

### 1. Extract product truth

- **Audience** · **Pain / desire** · **Promise** (one-line thesis)
- **Product role** in the story · **Proof** (UI moments, metrics, logos)
- **CTA** — what to do next

Build around the **promise**, not a feature laundry list.

### 2. Choose one arc

| Arc | Beat order (compress to runtime) |
| --- | --- |
| `PAS` | hook → pain → agitation → solution tease → product → proof → CTA |
| `Future Pacing` | imagine → name product → remove pain → mechanism → outcome → CTA |
| `Demo Loop` | question → product → demo₁ → demo₂ → trust → CTA |
| `BAB` | before → after tease → bridge/product → steps → wow → CTA |
| `Feature-Benefit Cascade` | category hook → (feature→benefit)×N → climax → CTA |

Name `arc:` on the film plan. Demo value almost always needs a **multi-beat**
sequence on the same surface (input → response → result), not one isolated UI still.

### 3. Roles (`path_role`)

`hook | pain_point | product_intro | feature_showcase | benefit_highlight | social_proof | branding | cta`

One job per beat. Opening 3–5s: one hook (stat, pain, question, spectacle, category
claim) — never generic company description. Promise lands by beat 2.

### 4. VO as cues + blueprints

Same cue discipline as explainer: phrase-segment into `vo_cues` so reveals have
something to hang on.

Soft-tag `blueprint:` from
`../../hyperframes-animation/blueprints-index.md`. Vary shapes. Common promo fits:

| Role | Shape shortlist |
| --- | --- |
| Hook | `kinetic-type-beats`, `dataviz-countup`, `ticker-takeover`, `prompt-type-submit-generate` |
| Pain | `overwhelm-surround`, `kinetic-type-beats`, `spatial-pan-stations` |
| Product intro | `device-surface-showcase`, `cursor-ui-demo`, `logo-assemble-lockup` |
| Feature | `cursor-ui-demo`, `device-surface-showcase`, `panel-edit-live-sync`, `grid-card-assemble` |
| Benefit | `kinetic-type-beats`, `camera-journey`, `titlecard-reveal` |
| Social proof | `constellation-hub`, `grid-card-assemble`, `dataviz-countup` |
| CTA / outro | `logo-assemble-lockup`, `cta-morph-press`, `titlecard-reveal` |

For UI-hero films also open [shot-cards](shot-cards/README.md) and tag
`shot_ref: shotcraft:<id>` (motion grammar only; implement in HF/GSAP + FRAME).

Story truth still wins: omit blueprint when none fit; never invent beats for a shape.

### 5. Proof & assets

- Prefer **rung-2 real capture** for claims (live site, product screenshots).
Generated "fake UI" is packaging tell when a real surface exists.
- List proof sources on the beat (`visual_kind: real-ui` + path under work dir).
- Pure type beats may skip capture; entire proof spine may not.

### 6. Transitions

Same registry set as explainer. Default `crossfade` / `blur-crossfade` within a
visual world; `zoom-through` at section turns (hook→context, demo→CTA);
`push-slide` for consecutive demo cards. Repeat a small set.

## Compact script patterns (shape VO; swap product names)

**Hook — kinetic:** punchy claim or jab whose KEY WORD swaps/escalates.  
**Hook — stat:** one number cold-open; scale is the tension.  
**Pain:** 3–5 short pain bars, each landing solo, no product yet.  
**Product:** "Introducing…" / do the core loop once / first cursor-led look.  
**Feature:** one workflow end-to-end (2–4 real edits), land on result.  
**Benefit:** short value stack with clear phrase boundaries, or calm title hold.  
**CTA:** logo lockup + one clear action/URL line.

Draft in these **shapes**; do not paste foreign brand copy.

## PPT autopsy (fail here)

- Homepage bullets on a dark gradient
- Four word slides + stock icons, no real UI
- Feature list with no benefit translation
- Every beat a different random effect family
- Generated UI only when URL was available

## Output

Film plan (+ optional `STORYBOARD.md`) with full
[path-routing.md](path-routing.md) beat contract before visual design.
