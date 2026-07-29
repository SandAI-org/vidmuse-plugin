---
name: vidmuse-create
description: >
  End-to-end film workflow entered through /vidmuse when no recording of a
  person speaking exists and the requested deliverable is a designed film.
  Use for knowledge explainers from text, website/product promos from a URL,
  narrated script+TTS films, generated media, and Vox-style paper-collage or
  halftone 拼贴 B-roll/explainers. Do not use for standalone TTS, ASR,
  image/video generation, or another single media result; /media-use owns
  those requests. Narration-led films use the media-use VidMuse TTS + ATA
  engine; never guess timestamps or use OS/browser TTS. Non-Vox films use the
  path-routed, machine-gated anti-PPT production spine. After ATA/grounding,
  proactively run the vidmuse-assets Semantic Asset Pass over the full script
  and bind approved asset_refs; the user need not ask. Vox uses its dedicated
  collage path. Deliver through VidMuse Timeline, not as a slideshow.
---

# VidMuse Create

Runtime: Node.js 22+, ffmpeg/ffprobe, Python 3, `vidmuse` on PATH (login
required for model/TTS/ATA), and HyperFrames CLI via `npx hyperframes`.
Depends on sibling skill `vidmuse-recut` for shared references and scripts.

Direct a film into existence when there is no source footage: knowledge
explainers, website and product promos, script-driven narrated pieces. This
skill is the **grounding and production-source layer**; the aesthetic system,
gates, and delivery pipeline are shared with `/vidmuse-recut` and referenced
from its directory (`../vidmuse-recut/references/…`) — read them there, do not
duplicate them.

Fresh requests enter through `/vidmuse`. This workflow owns projects whose
primary material must be *made*: narration to record, imagery to source or
generate, or a website to translate into film. A standalone TTS, ASR,
generation, download, or transform task belongs to `/media-use` and must not
bootstrap this film pipeline.

## Workflow ownership

`/vidmuse` is the routing authority; this skill is the selected vertical
workflow. Read
[`../vidmuse/references/runtime-policy.md`](../vidmuse/references/runtime-policy.md)
once before setup. It centrally defines the namespace guard, vendored-skill
policy, safe HyperFrames initialization, and VidMuse Timeline review surface.

After this workflow owns a valid create film, loading `/vidmuse-assets`,
`/media-use`, `/hyperframes-*`, `/vidmuse-motion`, or `/gsap-*` does not
transfer ownership. If real speaking footage becomes the primary material,
return to `/vidmuse` for a new route.

## Anti-goals (this skill fails if any slip through)

The product is a **directed film**, not a Keynote export. Stop and rewrite if
you are shipping:

| failure | what it looks like | fix |
| --- | --- | --- |
| **Silent deck** | full-screen titles only, no (or fake) narration track | run CLI TTS + ATA; put `audio.mp3` on Timeline sounds |
| **Guessed timeline** | `transcript.json` from `duration/N` math or hand AE keys | only ATA words; never invent `start`/`end` |
| **Non-VidMuse voice** | macOS `say`, browser TTS, random edge-tts, unpaid external TTS with no ATA | `vidmuse model list` → TTS via `vidmuse model run` → ATA |
| **PPT spacing** | one centered card per sentence, identical fade-up, hard cuts | film plan with relations + quiet beats; motion language + scene transitions |
| **Orphan-card film** (non-Vox) | every beat a new centered graphic; no continuous hero | path-routing `hero_throughline` + morph state across body |
| **Mute-by-neglect** (non-Vox) | VO only, BGM forgotten, no `bgm: none` decision | path-routing `audio_delivery` |
| **Fake UI proof** (promo) | generated dashboards when URL/screens exist | screenshot-camera / hybrid-slices first |
| **Catalog collage** | un-reskinned Registry demos / random accent pals | FRAME tokens + registry-integration reskin (not a ban on editorial *paper*-collage — that is `vox-collage`) |
| **Ungrounded SaaS look** | generic dark grid, no brand/subject evidence | grounding pass first; charter 9 |
| **Plan→code drift** (non-Vox) | film plan has cue-paced shot_sequence; shipped GSAP is front-loaded fade-ups + long freezes | execution trace: `film_plan.py --resolve` → `shot_scaffold.py` fill → `check_motion.py` green (hard fail 13) |
| **Hijacked route** | run log cites `/product-launch-video`, `/talking-head-recut`, or an upstream "mandatory entry point"; HF Studio opened instead of Timeline | routing authority above; kill the preview, resume the VidMuse path |

Create may use a **light path** for ≤20s stub tests (see end) — never as the
default for a user-facing explainer or promo.

## What is shared (read from vidmuse-recut)

The charter, tells, taste authority, motion language, FRAME.md contract,
Taste Gate, showcase gate, hero-frame and motion review, device craft,
captions and golden lines, asset sourcing, evaluation, and VidMuse Timeline
delivery are **the same system**:

| concern | read |
| --- | --- |
| what good means, trade-offs | `../vidmuse-recut/references/aesthetic-charter.md` |
| machine-made defaults to avoid | `../vidmuse-recut/references/packaging-tells.md` |
| who wins on conflict | `../vidmuse-recut/references/taste-authority.md` |
| style composition, anti-rut shortlist | `../vidmuse-recut/references/style-composition.md` |
| FRAME.md + Taste Gate | `../vidmuse-recut/SKILL.md` step 6 |
| motion language, camera, transitions | `../vidmuse-recut/references/camera-and-transition-craft.md` |
| captions, golden lines | `../vidmuse-recut/references/captions-and-golden-lines.md` |
| progress / data / demonstration craft | `../vidmuse-recut/references/device-craft.md` |
| asset ladder + `vidmuse model run` menu + generation governance | `../vidmuse-recut/references/asset-sourcing.md` |
| composition contract, pipeline, Timeline delivery | `../vidmuse-recut/references/pipeline.md`, `vidmuse-timeline.md`, `composition-contract.md` |
| effects install + reskin | `../vidmuse-recut/references/registry-integration.md` |
| create intent → structure shortlists | [references/promo-recipes.md](references/promo-recipes.md) |
| URL grounding: full site capture + asset curation | [references/site-capture.md](references/site-capture.md) |
| **path routing + beat contract + hard fails + execution trace + deck policy (SSOT)** | [references/path-routing.md](references/path-routing.md) — **read first after voice; do not re-copy rules from here** |
| plan→code enforcement scripts (non-Vox) | `scripts/film_plan.py` (validate/resolve) · `scripts/shot_scaffold.py` (GSAP skeleton) · `scripts/check_motion.py` (render gate) |
| non-Vox story craft | [story-design-explainer.md](references/story-design-explainer.md) · [story-design-promo.md](references/story-design-promo.md) |
| non-Vox shot sequence + motion | [visual-design.md](references/visual-design.md) · [motion-language.md](references/motion-language.md) · [cut-catalog.md](references/cut-catalog.md) |
| promo/UI shot priors (curated) | [references/shot-cards/README.md](references/shot-cards/README.md) · `scripts/shot_cards.py` |
| precise UI/image overlay alignment | [references/alignment-contract.md](references/alignment-contract.md) — shared transform space + normalized anchors; `check_motion.py` S5 |
| semantic HF compose (Registry miss) | sibling **`/vidmuse-motion`** — `../vidmuse-motion/SKILL.md` · `motion_recipes.py` |
| proven shot shapes (menu) | `../hyperframes-animation/blueprints-index.md` + `blueprints/<id>.md` |
| frame preset seeds (optional skin start) | `../hyperframes-creative/frame-presets/` |
| Vox / paper-collage B-roll & explainer | [references/vox-collage.md](references/vox-collage.md) **only** for path `vox`; optional `scripts/collage_frames.py` |

Work directory layout, validators (`../vidmuse-recut/scripts/*.py`), and the
13-step spine carry over. Artifact rename: `packaging-analysis.md` → **film
plan** (same gate role). This document only defines create deltas.

## Non-negotiable: VidMuse CLI voice spine

Narration-led create films **stop** until this spine is green. HyperFrames
does not own voice.

### Gate A — environment

```bash
MEDIA_DIR="<sibling-media-use-skill-dir>"
node "$MEDIA_DIR/scripts/resolve.mjs" --doctor
```

Media Use owns VidMuse CLI discovery, login, plan/credit, model-catalog, and
host-media checks. If doctor fails, relay its fix and do not substitute
OS/browser TTS or a provider-specific CLI. Do not continue to composition HTML
until voice is resolved or the user explicitly orders a **muted visual-only**
stub; record that exception in the film plan.

### Gate B — script, then TTS, then ATA (order locked)

1. Draft or receive the script. Confirm **as text** with the user when the
   brief is thin (script gate = cheapest gate in the pipeline).
2. Save exact locked copy to `$WORK_DIR/transcript-source.txt`.
3. Load `/media-use` and read `references/audio.md`. Author
   `$WORK_DIR/audio_request.json`; use one line for a monolithic narration or
   one line per planned beat for a segmented spine. Pin a model or voice only
   after Media Use verifies it against the live catalog.
4. Run the shared engine:

```bash
node "$MEDIA_DIR/audio/scripts/audio.mjs" \
  --request "$WORK_DIR/audio_request.json" \
  --project "$WORK_DIR" \
  --out "$WORK_DIR/audio_meta.json" \
  --only tts
```

5. Treat any `audio_meta.json.anomalies` entry, missing voice, zero-byte file,
   or missing ATA words as a failed gate. Media Use freezes each voice under
   `assets/voice/` and records its live model, voice id, duration, and
   ATA-truthful words.
6. Materialize the workflow artifacts:
   - monolithic: copy/link the one voice file to `$WORK_DIR/audio.mp3` and save
     its `words` as the flat `$WORK_DIR/transcript.json`;
   - segmented: concatenate the voice files with the planned inter-beat gaps,
     add each segment's deterministic concat offset to its word times, and save
     the combined flat array as `transcript.json`.
7. Probe the final `audio.mp3` duration into `metadata.json`; clamp downstream
   times to it. Preserve `audio_request.json` + `audio_meta.json` as the
   provider/alignment receipt.

**Regenerate voice → must re-run ATA.** Stale `transcript.json` is a defect.

**Segmented voice spine (optional, recommended for promos).** For films that
want hard beat cuts and per-line retakes, put **one request line per beat**
instead of one monolithic line:

1. Give every line a stable beat id and keep the same verified model/voice.
2. Plan inter-beat gaps (typically 0.2–0.6s) and record the gap list.
3. Concatenate once with ffmpeg and compute offsets from the concat plan.
4. Merge words by adding only their segment offset; never hand-shift
   individual words.
5. Beat `ata_range` equals its segment's offset span. VO boundaries now **equal**
   beat boundaries exactly — transitions land in real silence, and one bad
   line re-records without touching the other beats.

Both spines end at the same contract: one `audio.mp3`, one flat
`transcript.json`, ATA-true word times. Record `voice_spine: segmented` +
the gap list in `video-context.json`.

### Gate C — early Timeline (still before pretty frames)

As soon as `audio.mp3` + `transcript.json` exist:

```bash
# audio mode: no picture yet — sounds = audio.mp3, subtitles from transcript.json,
# duration probed from the narration; main/overlay tracks empty until assemble
python3 ../vidmuse-recut/scripts/write_dsl.py "$WORK_DIR" --mode audio
vidmuse serve "$WORK_DIR/dsl.json" &
```

Once program picture exists (program bed or packaging HTML), re-run with
`--mode layered` (see Timeline main track below) — layered requires a video
main and will refuse to run before one exists; that refusal is correct.

Tell the user the Timeline URL. They should hear the **real** VO and see
**ATA captions** scrub in sync **before** you spend tokens on hero
graphics. A film that only exists as HF Studio/`preview` with no voice track
is not ready for taste gates. **Never** auto-run `npx hyperframes preview`
during create — it opens official Studio and conflicts with VidMuse Timeline.
Picture verification stays on `lint` / `check` / `snapshot` / `keyframes`;
user review stays on `vidmuse serve`.

Record in `video-context.json`: the model and voice ids from
`audio_meta.json`, paths to `audio_request.json` / `audio_meta.json`, and
`voice_spine: ok`.

## Grounding without a room

Recut's taste authority rank 2 is "source footage — the room decides." A
create film has no room, but rank 2 does not go empty; it is filled by the
**subject's real world**, gathered before any style decision:

- **Website / product promo:** the product's actual design language *is* the
  room. **Default: full machine capture** —
  `npx hyperframes capture "<URL>" -o "$WORK_DIR/capture"` per
  [references/site-capture.md](references/site-capture.md) (reading protocol,
  ASSET_AUDIT curation, provenance registration, real site-video downloads).
  Three manual screenshots is a fallback, not a grounding. FRAME.md derives
  from *their* tokens; beats cast `asset_candidates` from the real inventory.
- **Knowledge explainer:** the subject's material culture is the room —
  diagrams, notation, era, palette. Name it in the film plan; generic "clean
  explainer" is the rut.
- **Script-driven personal pieces:** author brand + script register; ask once.

Record grounding evidence in `video-context.json`. Charter 9 operational
test: *would someone who knows this product/subject recognize its world in a
muted frame?*

## Semantic Asset Pass — mandatory before the film plan

After ATA timing and grounding, load sibling `/vidmuse-assets` and read
`../vidmuse-assets/references/semantic-asset-pass.md`. Scan the **full
script**, not only named keywords, and write `$WORK_DIR/asset-plan.json` even
when the correct result is an empty opportunity list.

The film skill decides whether an entity deserves screen time; the asset skill
canonicalizes it and selects the legal source; `media-use` only executes the
exact request. Do not equate related entities such as OpenAI, ChatGPT, GPT-4,
Codex, and Sora.

```bash
node ../vidmuse-assets/scripts/asset_plan.mjs \
  --project "$WORK_DIR" --complete-pass

node ../vidmuse-assets/scripts/asset_plan.mjs \
  --project "$WORK_DIR" --validate

# Safe deterministic catalog entries may resolve before the film-plan gate.
# Generated/ambiguous entries remain deferred.
node ../vidmuse-assets/scripts/asset_plan.mjs \
  --project "$WORK_DIR" --resolve
```

Bind approved opportunities into beats with stable `asset_refs`. Repeated
mentions reuse one resolution. `asset_candidates` remains only for legacy
site-capture filenames. A missing model-specific logo falls back to editable
model type plus its canonical organization mark when editorially relevant;
never generate a mark. The scaffold emits real `data-asset-ref` image nodes,
and `check_motion.py` fails delivery if the final beat DOM drops them or points
them at a different file.

## Production spine (deltas from recut's 13 steps)

**1–2. Script + voice spine (above).** Replaces probe-of-camera + align-on-
speech-plate. Everything below is **transcript-driven** exactly like recut.

**3. Path + video-context.json + asset-plan.json** — after voice is green,
decide
`create_path` and load the matching craft stack via the SSOT
[path-routing.md](references/path-routing.md) (first match: vox → promo →
explainer). Record `create_path`, content type, audience, channel, density,
`structure_recipe` from [promo-recipes.md](references/promo-recipes.md),
voice_spine receipt, semantic asset-pass receipt, and later `shot_refs` /
`blueprint` ids.

**Do not** load non-Vox craft refs on Vox. **Do not** apply create craft to
`/vidmuse-recut`. Paths, hard-fail on/off, and craft-stack names: **only** in
path-routing — do not re-copy that table here.

**4. Film plan (gate) — kills PPT.** Same user-gate role as
`packaging-analysis.md`. Inverted question: not "where does footage need
help?" but **"what must the viewer see at each beat, from which source
rung, and how does the shot develop across the ATA span?"**

### 4a. Every path — base beat fields

- time range from **ATA transcript** (not equal slices)
- viewer job (notice / understand / feel / remember)
- **planned visual source**: real capture / generated still / i2v from
  approved still / typographic scene / diagram / (rare) full-world spectacle
- when source is generated **video** (collage i2v, B-roll, …):
  **`target_duration_s`** snapped to that model's live `duration_options`,
  covering the ATA span — plan the picture length **with** the VO, not after
- relation to neighbors (sequence, cause→effect, contrast, dependence)
- intervention weight: continuous system / light / medium / hero
- approved semantic assets as stable `asset_refs` (never a guessed path)

### 4b. Path `vox` only

Follow [vox-collage.md](references/vox-collage.md). Argument-length clips +
`target_duration_s`. Skip non-Vox craft (§4c). Non-Vox hard fails **off**
(path-routing).

### 4c. Paths `explainer` + `promo` — craft stack (required)

Full field list, `shot_sequence` shape, hard fails **1–13**, hero throughline,
audio delivery, UI proof path, execution trace, and deck rules:
**[path-routing.md](references/path-routing.md)** (SSOT). Executive summary only:

1. Read path **story-design** → structure/arc, `path_role`, cue-cut `vo_cues`,
   film-level **`hero_throughline`** (standard explainers).
2. Read [visual-design.md](references/visual-design.md) → every beat gets
   VO-paced `shot_sequence` (no front-load; cover test / ≤3 active).
3. Tag blueprint / `shot_ref` / `compose`; promo proof beats add
   **`ui_proof_path`** (screenshot-camera default). Motion-language +
   cut-catalog; `transition_in` between beats.
4. Plan **`audio_delivery`** (VO + BGM path or explicit `none`; optional SFX cues).
5. Fail the plan **before** taste work if path-routing hard fails trigger.
6. On confirmation: write `$WORK_DIR/direction-approved.md` (path, recipe,
   confirmation line, hero). Optional craft mirror: `STORYBOARD.md`.
   Delivery remains Timeline + **HyperFrames/GSAP** picture (no second Stage runtime).
7. **Execution trace (required):** mirror the beats to `$WORK_DIR/film-plan.json`
   and run `python3 scripts/film_plan.py "$WORK_DIR" --resolve` — cue strings
   become ATA-resolved absolute times. Scaffold + render gate follow at craft
   time (path-routing § Execution trace).

Present the film plan Markdown and wait for confirmation (unless autonomous).

**5–7. Taste, FRAME.md, showcase.** Grounding stills instead of room keyframes.
**FRAME seed (non-Vox):** if brand/site tokens exist, derive FRAME from them;
else adopt **one** preset from `../hyperframes-creative/frame-presets/` whose
register fits, then remap roles — do not ship anonymous black canvas + white
type as the whole system without named intent. Open promo-recipes for
structure shortlists before `effects.py` browse. When shot-cards are required
or open, shortlist motion priors **before** registry browse; implement via
HF/GSAP + FRAME skin. Write `## Video direction` once on the plan
(visual-design). Creative remains hygiene only.

**Create Taste Gate adaptations** (keep numbers; change definitions):

| Gate | Create reading |
| --- | --- |
| 1 Room first | Charter 9 → brand/subject recognizable when muted |
| 2 Source-led share | **Ground-led** ≥ half runtime on default explainers (type/diagram/real capture on ground color). **Spectacle** = full-bleed world takeover — scarce unless brief is spectacle-first |
| 3–5 | Unchanged (single anchor, status chrome, mono hierarchy) |
| 6 Proof scarcity | Evidence prefers real captures (rung 2); scarce full-world takeovers |
| 7 Entrance intent | **Count-ready:** no single direction×ease as whole-film default without written intent; at assemble, tabulate entrances (see craft below) |
| 8–9 | Unchanged (emphasis scarcity, creative demotion) |

**8–11. Plan, assets, assemble, craft render.** Materialize approved
`asset-plan.json` entries through `/vidmuse-assets`; `media-use` freezes each
receipt. Follow `asset-sourcing.md` for non-catalog/generated material. Prefer
i2v from approved stills. Provenance remains in `asset-sources.json` plus
`.media/manifest.jsonl`. Effects: `registry-integration.md` — Registry
supplies mechanism; FRAME supplies skin.

### Create craft (performance & anti-PPT motion)

**Non-Vox (`explainer` / `promo`):** start from the machine skeleton, never a
blank file: `python3 scripts/shot_scaffold.py "$WORK_DIR"` emits
`public/index.html` with one locked `tl.addLabel("bXX.wY", t)` per approved
window plus its on_screen/move/cue FILL comment. Implementation = fill the
slots with tweens positioned at those labels, under
[motion-language.md](references/motion-language.md) doctrine (VO-paced
sequential reveal, long-tail settle default, stillness over screensaver).
Shortlist `/vidmuse-motion` shot recipes (`--tag shot`) as code paths for the
windows. Keep **`hero_throughline`** alive across body beats (morph state,
don't hard-swap orphans). Within-beat seams → [cut-catalog.md](references/cut-catalog.md).
Also read recut `camera-and-transition-craft.md` when multi-scene director
density applies. Picture engine = **HyperFrames/GSAP** only.

**Vox:** only [vox-collage.md](references/vox-collage.md) motion/duration
rules — do not force shot_sequence, hero throughline, or non-Vox SFX/BGM
contract onto generative plates.

Scoped hard rules (promo / multi-scene director density; do not force every
quiet caption-led explainer into sizzle):

1. **Layout before motion.** For each scene, lock the **hero static layout**
   (fully entered, readable) in HTML/CSS first. Animate with `gsap.from` /
   `fromTo` into that layout. Do not position elements at off-screen start
   states and guess the landing. Hero-frame review judges that static state
   before polish.
2. **Implement shot_sequence windows.** Map beat-local Scene times onto ATA
   absolute times; reveal each piece on its `vo_cue` — never dump the beat
   canvas at local t=0 then freeze.
3. **Scene transitions when scenes exist.** Multi-scene / multi-act create
   films: use planned `transition_in` — no anonymous jump cuts between
   scenes. Intermediate scenes should not empty themselves with exit tweens
   just before a transition; the transition owns the exit. Final scene may
   fade or resolve on purpose.
4. **Choreography is argument order.** Causes before effects; steps in order;
   ≤2 significant movers at once unless ideas are truly simultaneous.
5. **Entrance diversity.** Within a dense scene, vary ease families (target
   ≥3 across the film's hero entrances unless a written mono-ease intent
   exists). Ban whole-film clone of one `y+30 opacity 0→1 power2.out` template.
6. **Golden-line ladder** (`captions-and-golden-lines.md`): most cues quiet;
   escalate only true golds — weight/color first; marker-sweep or circle as a
   scarce second rung; karaoke only for lyric-like or intentionally rhythmic
   VO, never default explainer captions.
7. **Html-in-canvas / device mock / liquid glass:** at most one signature
   complex when the brief earns it (real product UI as texture preferred);
   `production_cost: very-high` mind-set — not wallpaper.
8. **Precision overlays share coordinates.** For UI/image frames, reticles,
   callouts, cursors, or underlines that must track a target, read
   [alignment-contract.md](references/alignment-contract.md). Put the target
   and overlay in one `data-vm-align-space`, use normalized raster boxes, and
   animate the shared parent. Never tune two absolute coordinate sets.

**Timeline main track (create):** no talking-head plate by default. Prefer
program bed (`public/program.mp4` / HF bake) as main when ready; packaging
HTML as overlay if separate; **sounds = narration + BGM (or recorded `none`) +
optional SFX** per path-routing `audio_delivery`; **subtitles from ATA
transcript**. Refresh DSL after `public/index.html` exists. Never leave main
pointing at a missing `input-video.mp4`.

**12–13. Evaluate and deliver — unchanged** schemas, plus create checks:

- [ ] `audio_request.json` + `audio_meta.json` + `audio.mp3` + `transcript.json` present
- [ ] Timeline scrub: VO audible, captions track speech (sample 3 timestamps)
- [ ] film plan was confirmed (or autonomous skip recorded)
- [ ] `asset-plan.json` exists and validates (an empty deliberate plan is valid)
- [ ] every beat `asset_ref` resolves to a non-suppressed opportunity and local receipt
- [ ] no related company/product/model identity was silently substituted
- [ ] `create_path` recorded; craft stack matched path
- [ ] **non-Vox:** path-routing beat contract + hard fails **1–13** clean
- [ ] **non-Vox:** `python3 scripts/check_motion.py "$WORK_DIR"` **GATE PASS**
      on the rendered picture (`motion-check.json` saved) — this is the
      mid-window / cue-pacing check, by script, not by prose self-audit
- [ ] **non-Vox:** `hero_throughline` + `direction-approved.md` + `audio_delivery`
- [ ] **non-Vox:** not PPT-shaped (mixed `visual_kind`; quiet passages if explainer)
- [ ] **promo:** ≥1 real-capture proof; proof beats name `ui_proof_path`
- [ ] **promo UI/image precision overlays:** `check_motion.py` S5 alignment
      contract green; no target/overlay transform-space drift
- [ ] **vox:** duration discipline only (vox-collage); no forced shot_sequence /
      hero / non-Vox audio contract
- [ ] FRAME Taste Gate filled with counts where required
- [ ] generated-video / collage beats: plan had `target_duration_s` matched to
      ATA before spend; delivers cover those spans
- [ ] `vidmuse serve` URL reported; `final.mp4` only after user approval path
- [ ] **no** auto `npx hyperframes preview` / HF Studio during the run (opt-in only)
- [ ] **no** competing workflow entered (`/product-launch-video`,
      `/talking-head-recut`, `/general-video`, …) and no `skills update <workflow>`
- [ ] every `npx hyperframes init` ran with `HYPERFRAMES_SKIP_SKILLS=1`

## Intent recipes (structure, not skins)

Before browsing effects for promos / data films / site-to-video, read
[references/promo-recipes.md](references/promo-recipes.md) and
[path-routing.md](references/path-routing.md). Pick **at most one** recipe as
a structure prior; set `create_path`; still pass film-plan and FRAME gates.
Recipes name **mechanisms to shortlist**, never mandatory effect quotas.
Vox recipes point only at vox-collage.

## Shot-card deck (motion priors — Agent auto)

Curated **32 / 106** recipe cards from video-shotcraft, packaged as text
priors only. Full menu: [references/shot-cards/README.md](references/shot-cards/README.md).
Attribution: [references/shot-cards/NOTICE.md](references/shot-cards/NOTICE.md).

**When to open / keep closed / `data-beat` special case:** SSOT in
[path-routing.md](references/path-routing.md) § Shot-card deck policy —
including: promo recipes auto-open; **`data-beat` deck optional on explainer**,
motion craft still required. Do not re-state the open list here.

### How to use once open

```bash
python3 scripts/shot_cards.py --index
python3 scripts/shot_cards.py --recipe recipe:saas-promo-30s
python3 scripts/shot_cards.py deck-deal-flyin,spotlight-hero-card --get
python3 scripts/shot_cards.py --validate
```

1. Shortlist **≤5** cards per film; **≤1** `production_cost: very-high`.
2. Read full `references/shot-cards/cards/<id>.md` for each shortlist pick
   (parameters + 已知坑). Names alone are not enough.
3. Write `shot_ref: shotcraft:<id>` on plan beats with one-line why.
4. Implement with **HyperFrames + GSAP** (blueprint / registry / native).
   Never run Remotion demos; never paste unskinned upstream demo identity.
5. FRAME owns palette/type/material. Inherit **motion grammar only**.
6. Record `shot_refs` on `video-context.json`. Prefer gallery previews at
   https://vincentwei1021.github.io/video-shotcraft/ for user-facing pick
   when helpful (external — not bundled).

## Semantic motion (`/vidmuse-motion`) — implement without Registry

When a beat needs **KPI / bars / sparklines / stat cards / tables** and
`effects.py` / `hyperframes add` has no good match — or `recipe:data-beat` /
product proof would otherwise ship a **static chart PNG** — or a
`shot_sequence` window needs a proven **shot code path** (cue-paced reveal,
collapse-merge, pullback, line-carry, strip-away lock):

1. Load sibling skill **`../vidmuse-motion/SKILL.md`**.
2. `python3 ../vidmuse-motion/scripts/motion_recipes.py --tag dataviz`
   (data beats) / `--tag shot` (shot execution) / `--index`.
3. Shortlist ≤3 recipes; `--get` full steps; read cited HF rules.
4. Compose **native HyperFrames HTML/GSAP** (gold: `../vidmuse-motion/examples/dataviz-semantic/`).
5. `npx hyperframes lint` + `check` + `snapshot` at recipe verify times.
6. Record `motion_recipe_ids` on the beat / `video-context.json`.

**Registry miss is not a stop.** Do not invent metrics. Architecture +
playbook: `../vidmuse-motion/references/architecture.md`,
`agent-playbook.md`, `verified-run.md`. Human guide:
`../../docs/MOTION-SEMANTIC-LAYER.md`.

Shot-cards remain *cinematic priors*; motion-recipes are *code paths*. A beat
may list both (`shot_ref` + `motion_recipe_ids`).

### Vox paper-collage path (frozen — do not dilute)

Triggers: `Vox style`, `纸拼贴`, `halftone collage`, `collage b-roll`,
`拼贴 B-roll`, `Vox 风`, film-plan `visual_source: collage-broll`, or recipes
`vox-collage-*`. Set `create_path: vox`.

1. Read [references/vox-collage.md](references/vox-collage.md) **only** for
   visual production. Recipe: `vox-collage-broll` or `vox-collage-explainer`.
2. **Do not** load story-design-explainer/promo, visual-design,
   motion-language, cut-catalog, or shot-cards for this path.
3. **Do not** apply path-routing non-Vox hard fails **1–13**, hero throughline,
   SFX/BGM mandatory contract, UI proof tree, execution-trace scripts, or
   `shot_sequence` / blueprint contracts.
4. **Plan first:** ATA argument spans → each beat `target_duration_s` on the
   video model's `duration_options` (Seedance often 4–15). One clip per
   argument, phases inside the clip — not one sentence per clip, not short
   motion under long VO.
5. V1 metaphor (with duration) → V2 still → V3 motion at planned length.
6. `vidmuse model run`: set `generation_type` from that model's live
   `required_params` keys (`text_to_image`, `image_to_video`,
   `images_to_video`, …). **Required on every video request** — omitting it
   400s; optional for audio, but still pass `text_to_speech` / `sound_effect`
   on multi-mode audio models. Full route table in `vox-collage.md`.
7. Optional `scripts/collage_frames.py` for ffmpeg only. Not Anti-collage
   (Registry dump ban).
8. Voice + Timeline spine still run (Gates A–C).

## Isolation (recut + vox)

- **`/vidmuse-recut`:** **no behavioral change.** Create may *read* shared
  recut references; create craft (hero, shot_sequence, audio_delivery, UI
  tree, hard fails 1–13, execution-trace scripts) is **not** part of the recut
  spine. Never require those fields on packaging plates.
- **Vox:** production logic stays in `vox-collage.md`. The new craft rules
  (hero throughline, audio_delivery, UI proof path, hard fails 9–12) apply to
  **`explainer`/`promo` only**.
- **Delivery:** still VidMuse Timeline (`write_dsl` + `vidmuse serve` /
  `render`) with HyperFrames/GSAP layers — not a second Stage/rAF runtime,
  not HF MP4-only handoff.

## Mode boundaries

- Digital-presenter (avatar) is **opt-in only** after user approves avatar +
  voice; once presenter pixels exist, packaging craft follows recut and the
  synthetic nature is not hidden.
- Real speaking footage uploaded mid-flight → hand packaging of that plate to
  recut rules.
- Empty grounding (no site, no brand, vague subject) → one clear question,
  not a default rut deck.
- **Muted visual-only** (no TTS) only if the user explicitly wants no voice;
  still forbidden to fake a transcript.

## Light path (internal / ≤20s stub only)

When the user asks for a quick disposable test ("just give me a 5s motion
probe") **and** accepts no full film craft:

1. Still prefer real TTS+ATA if any speech is promised.
2. Else muted: `HYPERFRAMES_SKIP_SKILLS=1 npx hyperframes init` under
   `$WORK_DIR/public` scaffold, minimal edits, HF check — label output **stub**,
   not delivery.
3. Never use light path for "explainer", "promo", "launch", or client-facing
   work without an explicit stub waiver in chat.

## Report

Tell the user: work directory, grounding one-liner, **`create_path`**, recipe
if used, `shot_refs` / key blueprints if non-Vox, **TTS + ATA models used**,
Timeline URL (VO + captions + picture), quality caveats.
Do not claim finished if Gate B/C failed or non-Vox hard fails remain.
