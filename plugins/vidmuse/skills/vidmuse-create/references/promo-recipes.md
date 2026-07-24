# Create structure recipes

**Purpose:** short intent → mechanism shortlists so create films borrow
*structure* from proven HyperFrames patterns without borrowing foreign
skins or collapsing into PPT card stacks.

**Authority:** FRAME.md and the film plan still win. A recipe is a prior for
step 5–9 effect browsing (`effects.py` / `hyperframes add`), not a template
to paste. Always reskin via
[`../../vidmuse-recut/references/registry-integration.md`](../../vidmuse-recut/references/registry-integration.md).

**Voice:** every narration-led recipe still requires the VidMuse TTS → ATA
spine in `../SKILL.md`. Recipes never replace `transcript.json`.

**How to use**

1. Match the brief to **one** recipe id (or `none` — composed from atoms).
2. If the recipe is promo/UI family (table below), open the curated
   [shot-cards](shot-cards/README.md) deck and shortlist motion priors
   (`python3 ../scripts/shot_cards.py --recipe recipe:<id>`).
3. Copy candidate HyperFrames / shotcraft ids into the film plan as
   *mechanism hypotheses* (`shot_ref: shotcraft:<id>` and/or registry ids).
4. `python3 ../../vidmuse-recut/scripts/effects.py --index` and shortlist;
   `npx hyperframes add <id>` only after plan + FRAME direction gates.
5. Record `structure_recipe` and any `shot_refs` in `video-context.json`.

Upstream registry ids below are **examples** that often exist in HyperFrames
Registry / community catalog. **Verify with live catalog / `effects.py`
before add.** Shot-card ids are motion priors only — implement in
HyperFrames/GSAP, never Remotion. If a registry id is missing, keep the
*job* (hook / proof / end-card) and pick the nearest reviewed mechanism.

**Recipes that auto-open the shot-card deck:** `saas-promo-30s`,
`site-to-video`, `brand-sizzle`, `data-beat`, `hook-proof-outro`.
**Stay closed by default:** `knowledge-explainer`, `vox-collage-*`.

---

## recipe:saas-promo-30s

| | |
| --- | --- |
| **use when** | product/marketing launch energy, ~20–45s, UI is the hero |
| **avoid when** | long knowledge lecture; pure brand POEM with no product surface |
| **grounding** | real product screenshots / live site capture (rung 2) before any generated UI |
| **arc** | Hook claim → pain or stakes → product proof (real UI) → resolve / logo hold |
| **scene craft** | 3–5 scenes; marked transitions between scenes; no jump cuts |
| **mechanism shortlist** | app/product showcase or multi-device layout; UI reveal / 3D panel fly-in; kinetic title for **one** hook line; logo outro / end card; optional one shader or flash transition max |
| **example add names** (verify live) | `app-showcase`, `ui-3d-reveal`, `logo-outro`, one transition block only if plan calls it |
| **shot-card priors** (optional) | `deck-deal-flyin`, `spotlight-hero-card`, `row-embed`, `ai-stream-response`, `command-palette-summon`, `ui-to-brand-morph` — `python3 ../scripts/shot_cards.py --recipe recipe:saas-promo-30s` |
| **PPT failure mode** | four full-bleed word slides + stock icons, no real UI |
| **density** | ground-led or real-UI proof ≥ half; one signature max |

---

## recipe:site-to-video

| | |
| --- | --- |
| **use when** | brief is a URL / "turn this page into a film" |
| **grounding** | fetch site; 3 viewport screenshots (or more); extract palette/type into FRAME |
| **arc** | Brand entrance → scroll or section tour (real captures) → key feature proof → CTA |
| **mechanism shortlist** | multi-viewport framed sites; device chrome only if it earns clarity; matched-geometry wipes between sections; restrained type lower-thirds for section labels |
| **example add names** | website/follow/device composition blocks if catalog has them; else native framed `<img>` sequence with craft transitions |
| **shot-card priors** (optional) | `scroll-brake-moves`, `crane-rise-reveal`, `spotlight-hero-card`, `wipe-transitions`, `ui-strip-away-outro` |
| **PPT failure mode** | paraphrasing the homepage as bullets on a dark gradient |
| **proof rule** | generated "fake screens" are tell V3 — real captures only for claims |

---

## recipe:knowledge-explainer

| | |
| --- | --- |
| **use when** | teach a topic from script; default create path for 教育 / 科普 briefs |
| **grounding** | subject-world (field's own diagrams, era, palette) named in film plan |
| **arc** | Hook question → build concept with diagram/type → one worked example → takeaway line |
| **mechanism shortlist** | continuous caption system + quiet progress rail; diagram or relationship layout for **scarce** hero proofs; chapter marks only when chapters are real |
| **example add names** | prefer native/recut patterns (`concept-relationship` mental model); catalog charts only when numbers are real |
| **PPT failure mode** | title card per sentence, identical fade-ups, no quiet holds |
| **density** | ground-led (type/diagram on ground color) ≥ half runtime |

---

## recipe:data-beat

| | |
| --- | --- |
| **use when** | script turns on comparison, rank change, or one decisive statistic |
| **grounding** | numbers from user sources only; bake encoding path for digits |
| **arc** | Frame the question → reveal setup → animate the relation → hold the number long enough to read |
| **mechanism shortlist** | bar/line/ranking motion; counter with `tabular-nums`; annotation callouts — **one** family per beat |
| **example add names** | data-chart / race / rollup class if present; else native SVG + GSAP |
| **shot-card priors** (optional) | `odometer-digit-roll`, `chart-live-moves`, `dataviz-landscape-open` |
| **motion-recipes** (implement) | open `/vidmuse-motion` — `kpi-glow-count`, `weekly-bar-rise`, `sparkline-draw`, `stat-card-trio` via `python3 ../../vidmuse-motion/scripts/motion_recipes.py --tag dataviz` |
| **PPT failure mode** | huge number pops with confetti every sentence |
| **craft** | counters are mechanical (linear/ease appropriate); no bounce on evidence; prefer motion-recipes over static chart screenshots |

---

## recipe:brand-sizzle

| | |
| --- | --- |
| **use when** | user asks launch-film / sizzle / kinetic brand energy, no deep teach |
| **grounding** | brand kit or site; if neither exists, ask once — do not invent a luxury skin |
| **arc** | Audio or visual sting → 2–3 motif beats → logo lockup |
| **mechanism shortlist** | kinetic type; grain/light motif; logo outro; optional audio-reactive **only** if music is planned and ducking is designed |
| **example add names** | kinetic-type, logo-outro, grain/finish layers |
| **shot-card priors** (optional) | `brand-ink-open`, `brand-frame-snap`, `letterspace-materialize`, `slam-entrance-moves`, `color-block-step-wipe` |
| **PPT failure mode** | random shader zoo, three catalogs of accents |
| **density** | spectacle allowed higher share **only** if film plan says spectacle-first; still one identity (Gate 3) |

---

## recipe:hook-proof-outro (generic short)

| | |
| --- | --- |
| **use when** | ≤30s, unclear genre, need a default spine |
| **arc** | **Hook** (one line or one image) → **Proof** (one real or knot diagram) → **Outro** (takeaway + brand) |
| **mechanism shortlist** | one title treatment; one proof device; one end card — stop |
| **shot-card priors** (optional) | `marker-underline-title`, `card-flip-reveal`, `panel-grid-moves`, `scene-locked-title` |
| **PPT failure mode** | five hooks, zero proof |
| **gate** | three-part plan must map to ATA time ranges |

---

## recipe:vox-collage-broll

| | |
| --- | --- |
| **use when** | Vox / paper-collage / 拼贴 B-roll under VO; `visual_source: collage-broll` |
| **avoid when** | real UI proof; exact in-frame numbers/logos (use composition); need full HF layer control |
| **arc** | ATA argument span → `target_duration_s` → still → motion at that duration |
| **scene craft** | one clip per argument; duration covers VO (Seedance 4–15 ladder); phases inside clip |
| **models** | still `gpt-image-2` / seedream · video `seedance-2.0-pro` + `generation_type` from list |
| **fail** | sentence-per-clip; plan without durations; short motion + long still under VO |
| **full** | [vox-collage.md](vox-collage.md) |

---

## recipe:vox-collage-explainer

| | |
| --- | --- |
| **use when** | full Vox-style collage explainer / ad from topic or script |
| **avoid when** | UI-hero product proof; data film that must show real numbers in-frame |
| **arc** | hook → few argument-length collage clips → takeaway; bake-off style once |
| **scene craft** | same duration discipline as B-roll; staged motion inside each long clip |
| **models / fail** | same as B-roll |
| **voice** | TTS → ATA (create spine) |
| **full** | [vox-collage.md](vox-collage.md) |

---

## Anti-collage rules (all recipes)

**Named carefully:** this section blocks *unrelated Registry effect dumps*, not
the editorial **paper-collage** recipes above.

1. **At most one** recipe anchor per film.
2. **At most one** very-high-cost signature (device html-in-canvas, particle
   takeover, multi-shader stack). Paper-collage i2v clips count toward
   spectacle budget when they dominate runtime.
3. Catalog HTML ships as **mechanism**; colors/fonts/copy come from FRAME.
4. Voice timeline is ATA; do not align interiors of blocks to guessed beats.
5. If the live catalog lacks a named id, keep the row's *job* and choose the
   nearest overlay-reviewed effect — do not abandon the film plan.
6. Vox paper-collage is **one material system** (see `vox-collage.md`), never
   a dump of random generative stills under the word "collage."

## Mapping to shot cards + recut tools

```bash
# motion priors (create only; optional)
python3 ../scripts/shot_cards.py --recipe recipe:saas-promo-30s
python3 ../scripts/shot_cards.py deck-deal-flyin --get

# after FRAME exists and plan is confirmed
python3 ../../vidmuse-recut/scripts/effects.py --index
python3 ../../vidmuse-recut/scripts/effects.py "hf:<id1>,hf:<id2>" --get
npx hyperframes add <upstream-id> --dir "$WORK_DIR/registry-source" --no-clipboard --json
```

Write adaptations + receipts to `effect-sources.json` as in registry-integration.
Shot-card `shot_ref`s are plan annotations; executable HTML still comes from
adapted Registry items or native HF/GSAP compositions.
