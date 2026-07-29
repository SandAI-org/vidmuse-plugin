# Create structure recipes

**Purpose:** short intent → path + mechanism shortlists so create films borrow
*structure* from proven HyperFrames patterns without borrowing foreign skins
or collapsing into PPT card stacks.

**Authority:** FRAME.md and the film plan still win. A recipe is a prior, not a
template to paste. Always reskin via
[`../../vidmuse-recut/references/registry-integration.md`](../../vidmuse-recut/references/registry-integration.md).

**Voice:** every narration-led recipe still requires the VidMuse TTS → ATA
spine in `../SKILL.md`. Recipes never replace `transcript.json`.

**Path routing (SSOT):** every recipe declares `path:`. Non-Vox paths **must**
load craft refs and satisfy the beat contract + hard fails **1–15** in
[path-routing.md](path-routing.md) — **do not re-list those fields or fail
numbers here.** Also owned only there: continuity strategy, optional literal
hero throughline, audio_delivery,
UI proof path, execution trace (film-plan.json → scaffold → check_motion),
shot-card open/close (including `data-beat` explainer vs promo).
**Vox recipes skip non-Vox craft entirely** — only [vox-collage.md](vox-collage.md).

## How to use

1. Match the brief to **one** recipe id (or `none` — composed from atoms).
2. Set `create_path` from the recipe's `path` (or path-routing decision order).
3. If path is `explainer` or `promo`, read the craft stack for that path
   and fill the **path-routing beat contract** on every beat; pass for
   path-routing hard fails.
4. If path-routing says the shot-card deck is open, shortlist motion priors
   (`python3 ../scripts/shot_cards.py --recipe recipe:<id>`).
5. Copy candidate HyperFrames / shotcraft ids into the film plan as
   *mechanism hypotheses* (`blueprint:`, `shot_ref: shotcraft:<id>`, registry ids).
6. `python3 ../../vidmuse-recut/scripts/effects.py --index` and shortlist;
   `npx hyperframes add <id>` only after plan + FRAME direction gates.
7. Record `structure_recipe`, `create_path`, and any `shot_refs` in
   `video-context.json`.

Upstream registry ids below are **examples**. **Verify with live catalog /
`effects.py` before add.** Shot-card ids are motion priors only — implement in
HyperFrames/GSAP, never Remotion.

---

## recipe:saas-promo-30s

| | |
| --- | --- |
| **path** | `promo` |
| **required_refs** | [story-design-promo.md](story-design-promo.md), [visual-design.md](visual-design.md), [motion-language.md](motion-language.md), [cut-catalog.md](cut-catalog.md), [shot-cards](shot-cards/README.md) |
| **use when** | product/marketing launch energy, ~20–45s, UI is the hero |
| **avoid when** | long knowledge lecture; pure brand POEM with no product surface; Vox collage |
| **grounding** | real product screenshots / live site capture (rung 2) before any generated UI |
| **arc** | Hook claim → pain or stakes → product proof (real UI) → resolve / logo hold |
| **scene craft** | 3–5 scenes; named `transition_in`; path-routing beat contract on every beat |
| **mechanism shortlist** | app/product showcase or multi-device layout; UI reveal / 3D panel fly-in; kinetic title for **one** hook line; logo outro; optional one shader or flash transition max |
| **blueprint priors** | `kinetic-type-beats`, `device-surface-showcase`, `cursor-ui-demo`, `logo-assemble-lockup`, `dataviz-countup` |
| **example add names** (verify live) | `app-showcase`, `ui-3d-reveal`, `logo-outro`, one transition block only if plan calls it |
| **shot-card priors** | `deck-deal-flyin`, `spotlight-hero-card`, `row-embed`, `ai-stream-response`, `command-palette-summon`, `ui-to-brand-morph` — `python3 ../scripts/shot_cards.py --recipe recipe:saas-promo-30s` |
| **PPT failure mode** | four full-bleed word slides + stock icons, no real UI; front-loaded fade-ups; full-html-rebuild when screenshot-camera enough |
| **density** | ground-led or real-UI proof ≥ half; one signature max |
| **runtime guidance** | prefer ~18–30s when claim fits; 4–6 beats |

---

## recipe:site-to-video

| | |
| --- | --- |
| **path** | `promo` |
| **required_refs** | story-design-promo, visual-design, motion-language, cut-catalog, shot-cards |
| **use when** | brief is a URL / "turn this page into a film" |
| **grounding** | fetch site; ≥3 viewport screenshots; extract palette/type into FRAME |
| **arc** | Brand entrance → scroll or section tour (real captures) → key feature proof → CTA |
| **mechanism shortlist** | multi-viewport framed sites; device chrome only if it earns clarity; matched-geometry wipes; restrained type lower-thirds for section labels |
| **blueprint priors** | `device-surface-showcase`, `camera-journey`, `zoom-out-workspace-reveal`, `titlecard-reveal` |
| **example add names** | website/follow/device blocks if catalog has them; else native framed `<img>` + craft transitions |
| **shot-card priors** | `scroll-brake-moves`, `crane-rise-reveal`, `spotlight-hero-card`, `wipe-transitions`, `ui-strip-away-outro` |
| **PPT failure mode** | paraphrasing the homepage as bullets on a dark gradient |
| **proof rule** | generated "fake screens" are tell V3 — real captures only for claims |

---

## recipe:knowledge-explainer

| | |
| --- | --- |
| **path** | `explainer` |
| **required_refs** | [story-design-explainer.md](story-design-explainer.md), [visual-design.md](visual-design.md), [motion-language.md](motion-language.md), [cut-catalog.md](cut-catalog.md) |
| **use when** | teach a topic from script; default create path for 教育 / 科普 briefs |
| **grounding** | subject-world (field's own diagrams, era, palette) named in film plan |
| **arc** | Hook question → build concept with diagram/type → one worked example → takeaway line |
| **scene craft** | cumulative body run (not one body card); cue-cut VO; path-routing beat contract |
| **mechanism shortlist** | continuous caption system + quiet progress; diagram/relationship for scarce heroes; chapter marks only when chapters are real |
| **blueprint priors** | `kinetic-type-beats`, `spatial-pan-stations`, `dataviz-countup`, `titlecard-reveal`, compose diagrams |
| **example add names** | prefer native/recut patterns; catalog charts only when numbers are real |
| **shot-cards** | **closed** by default |
| **PPT failure mode** | title card per sentence, identical fade-ups, no quiet holds, front-load freeze, no authored continuity strategy |
| **density** | ground-led (type/diagram on ground color) ≥ half runtime |
| **continuity** | required `continuity_strategy`; literal `hero_throughline` only when the treatment follows one real recurring object |

---

## recipe:data-beat

| | |
| --- | --- |
| **path** | `explainer` or `promo` (match surrounding brief) |
| **required_refs** | path story-design + visual-design + motion-language; open `/vidmuse-motion` for KPI/bars |
| **use when** | script turns on comparison, rank change, or one decisive statistic |
| **grounding** | numbers from user sources only; bake encoding path for digits |
| **arc** | Frame the question → reveal setup → animate the relation → hold the number long enough to read |
| **mechanism shortlist** | bar/line/ranking motion; counter with `tabular-nums`; annotation callouts — **one** family per beat |
| **blueprint priors** | `dataviz-countup` |
| **shot-card deck** | **optional on explainer**; optional priors on promo if useful — not a global auto-open (SSOT: path-routing deck policy). Priors if opened: `odometer-digit-roll`, `chart-live-moves`, `dataviz-landscape-open` |
| **motion-recipes** (implement) | open `/vidmuse-motion` — `kpi-glow-count`, `weekly-bar-rise`, `sparkline-draw`, `stat-card-trio` via `python3 ../../vidmuse-motion/scripts/motion_recipes.py --tag dataviz` |
| **PPT failure mode** | huge number pops with confetti every sentence; static chart PNG under VO |
| **craft** | counters mechanical (no bounce on evidence); prefer motion-recipes over static charts |

---

## recipe:brand-sizzle

| | |
| --- | --- |
| **path** | `promo` |
| **required_refs** | story-design-promo, visual-design, motion-language, cut-catalog, shot-cards |
| **use when** | user asks launch-film / sizzle / kinetic brand energy, no deep teach |
| **grounding** | brand kit or site; if neither exists, ask once — do not invent a luxury skin |
| **arc** | Audio or visual sting → 2–3 motif beats → logo lockup |
| **mechanism shortlist** | kinetic type; grain/light motif; logo outro; optional audio-reactive **only** if music is planned and ducking is designed |
| **blueprint priors** | `kinetic-type-beats`, `logo-assemble-lockup`, `titlecard-reveal` |
| **shot-card priors** | `brand-ink-open`, `brand-frame-snap`, `letterspace-materialize`, `slam-entrance-moves`, `color-block-step-wipe` |
| **PPT failure mode** | random shader zoo, three catalogs of accents |
| **density** | spectacle allowed higher share **only** if film plan says spectacle-first; still one identity (Gate 3) |

---

## recipe:hook-proof-outro (generic short)

| | |
| --- | --- |
| **path** | `promo` if product/URL; else `explainer` |
| **required_refs** | matching story-design + visual-design + motion-language + cut-catalog |
| **use when** | ≤30s, unclear genre, need a default spine |
| **arc** | **Hook** (one line or one image) → **Proof** (one real or knot diagram) → **Outro** (takeaway + brand) |
| **mechanism shortlist** | one title treatment; one proof device; one end card — stop |
| **blueprint priors** | `kinetic-type-beats`, `titlecard-reveal`, `dataviz-countup` / compose diagram |
| **shot-card priors** (optional) | `marker-underline-title`, `card-flip-reveal`, `panel-grid-moves`, `scene-locked-title` |
| **PPT failure mode** | five hooks, zero proof; three title cards |
| **gate** | three-part plan maps to ATA ranges; path-routing beat contract each |

---

## recipe:vox-collage-broll

| | |
| --- | --- |
| **path** | **`vox`** |
| **required_refs** | **only** [vox-collage.md](vox-collage.md) — do **not** load non-Vox craft stack |
| **hard fails** | off (path-routing Vox) |
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
| **path** | **`vox`** |
| **required_refs** | **only** [vox-collage.md](vox-collage.md) |
| **hard fails** | off (path-routing Vox) |
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
7. Non-Vox paths never satisfy craft without the path-routing beat contract
   on every beat (shot-card intent alone is not enough).

## Mapping to shot cards + recut tools

```bash
# motion priors when path-routing says deck is open (promo; data-beat explainer optional)
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
