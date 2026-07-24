---
name: vidmuse-create
description: >
  Create a designed motion film when there is NO recording of a person speaking.
  Sibling of /vidmuse-recut (which owns existing speaking footage). Use for
  "make an explainer / knowledge video about X from a script or topic",
  "website or product promo from a URL with no talking-head clip", narrated
  script+TTS films, generated-media films via `vidmuse model run`, and
  Vox-style / editorial paper-collage / halftone 拼贴 B-roll (or full collage
  explainers) via recipe vox-collage-* and references/vox-collage.md. Trigger
  only when material must be made (script, site, generated media, collage
  plates) — not when the user already has speech video to package. HARD
  REQUIREMENT: narration-led films MUST use VidMuse CLI TTS (`vidmuse model run`)
  then `doubao_speech/audio_text_alignment` for word-level transcript.json —
  never guess timestamps, use OS/browser TTS, or ship silent slide-deck HTML.
  Anti-PPT (non-Vox): path-routed craft stack — story-design + time-coded
  shot_sequence paced to ATA cues + blueprints/shot-cards; not one card per
  sentence. Vox/paper-collage stays on references/vox-collage.md only (craft
  hard-fails off). Promo/site paths require real-capture proof when a URL
  exists. Sources assets via the shared ladder (user > real > AI). Hand off
  to /vidmuse-recut if speaking footage appears. Shares recut taste stack; not
  a slideshow generator.
compatibility: Same host as vidmuse-recut — Node.js 22+, ffmpeg/ffprobe, Python 3, `vidmuse` on PATH (login required for model/TTS/ATA), HyperFrames CLI via `npx hyperframes`. Depends on sibling skill vidmuse-recut (shares references and scripts).
---

# VidMuse Create

Direct a film into existence when there is no source footage: knowledge
explainers, website and product promos, script-driven narrated pieces. This
skill is the **grounding and production-source layer**; the aesthetic system,
gates, and delivery pipeline are shared with `/vidmuse-recut` and referenced
from its directory (`../vidmuse-recut/references/…`) — read them there, do not
duplicate them.

**Routing:** any project whose primary material is an existing recording of a
person speaking belongs to `/vidmuse-recut`, even if it also needs generated
assets. This skill owns projects whose material must be *made*: narration to
record, imagery to source or generate, a website to translate into film.

## Anti-goals (this skill fails if any slip through)

The product is a **directed film**, not a Keynote export. Stop and rewrite if
you are shipping:

| failure | what it looks like | fix |
| --- | --- | --- |
| **Silent deck** | full-screen titles only, no (or fake) narration track | run CLI TTS + ATA; put `audio.mp3` on Timeline sounds |
| **Guessed timeline** | `transcript.json` from `duration/N` math or hand AE keys | only ATA words; never invent `start`/`end` |
| **Non-VidMuse voice** | macOS `say`, browser TTS, random edge-tts, unpaid external TTS with no ATA | `vidmuse model list` → TTS via `vidmuse model run` → ATA |
| **PPT spacing** | one centered card per sentence, identical fade-up, hard cuts | film plan with relations + quiet beats; motion language + scene transitions |
| **Catalog collage** | un-reskinned Registry demos / random accent pals | FRAME tokens + registry-integration reskin (not a ban on editorial *paper*-collage — that is `vox-collage`) |
| **Ungrounded SaaS look** | generic dark grid, no brand/subject evidence | grounding pass first; charter 9 |

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
| **path routing + beat contract + hard fails + deck policy (SSOT)** | [references/path-routing.md](references/path-routing.md) — **read first after voice; do not re-copy rules from here** |
| non-Vox story craft | [story-design-explainer.md](references/story-design-explainer.md) · [story-design-promo.md](references/story-design-promo.md) |
| non-Vox shot sequence + motion | [visual-design.md](references/visual-design.md) · [motion-language.md](references/motion-language.md) · [cut-catalog.md](references/cut-catalog.md) |
| promo/UI shot priors (curated) | [references/shot-cards/README.md](references/shot-cards/README.md) · `scripts/shot_cards.py` |
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
command -v vidmuse
vidmuse profile get                    # must be logged in
vidmuse model list -o json > "$WORK_DIR/model-list.json"
```

If `vidmuse` is missing or login fails, **tell the user how to fix** and do
not substitute OS/browser TTS. Do not continue to composition HTML until
voice is resolved or the user explicitly orders a **muted visual-only** stub
(record that exception in the film plan).

### Gate B — script, then TTS, then ATA (order locked)

1. Draft or receive the script. Confirm **as text** with the user when the
   brief is thin (script gate = cheapest gate in the pipeline).
2. Save exact locked copy to `$WORK_DIR/transcript-source.txt`.
3. Pick a **live** TTS id from `model-list.json` (names move). Prefer after
   verifying the id exists in the list:
   - Chinese-forward: `minimax/speech-2.6-hd`, `index-tts-2/text-to-speech`
   - Multilingual: `elevenlabs/eleven_multilingual_v2`
4. Run TTS **only** through VidMuse:

```bash
vidmuse model run -o json --param "$(python3 -c '
import json, sys
print(json.dumps({
    "model_name": sys.argv[1],
    "prompt": open(sys.argv[2]).read().strip(),
}, ensure_ascii=False))' "<tts-model-id-from-list>" "$WORK_DIR/transcript-source.txt")" \
  > "$WORK_DIR/tts-response.json"
```

Decode/write the audio payload to `$WORK_DIR/narration.mp3` and
`cp`/`ln -sf` to `$WORK_DIR/audio.mp3`. If the response shape is unclear,
inspect JSON keys and extract the file/URL bytes — do not invent silence.

5. Word-level align with the **same** model as recut (prompt = script text,
   files = audio):

```bash
vidmuse model run -o json --param "$(python3 -c '
import json, sys
print(json.dumps({
    "model_name": "doubao_speech/audio_text_alignment",
    "prompt": open(sys.argv[1]).read().strip(),
    "files": [sys.argv[2]],
}, ensure_ascii=False))' "$WORK_DIR/transcript-source.txt" "$WORK_DIR/audio.mp3")" \
  > "$WORK_DIR/alignment.json"
```

6. Convert ATA `utterances[].words[]` (`start_time`/`end_time` in **ms**) to
   `$WORK_DIR/transcript.json`: flat `[{ "text", "start", "end" }, …]` in
   **seconds**. Use utterance boundaries as sentence groups for captions.
7. Probe narration duration into `metadata.json` (ffprobe on `audio.mp3` is
   fine when there is no camera plate). Clamp downstream times to that
   duration. Never hand-edit word timestamps; fix the script and re-TTS +
   re-ATA instead.

**Regenerate voice → must re-run ATA.** Stale `transcript.json` is a defect.

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
graphics. A film that only exists as HF preview with no voice track is not
ready for taste gates.

Record in `video-context.json`: `tts_model`, `alignment_model`, paths to
`tts-response.json` / `alignment.json`, and `voice_spine: ok`.

## Grounding without a room

Recut's taste authority rank 2 is "source footage — the room decides." A
create film has no room, but rank 2 does not go empty; it is filled by the
**subject's real world**, gathered before any style decision:

- **Website / product promo:** the product's actual design language *is* the
  room. Fetch the real site, capture real screenshots, extract palette, type
  feel, spacing rhythm, and voice. FRAME.md derives from *their* brand.
- **Knowledge explainer:** the subject's material culture is the room —
  diagrams, notation, era, palette. Name it in the film plan; generic "clean
  explainer" is the rut.
- **Script-driven personal pieces:** author brand + script register; ask once.

Record grounding evidence in `video-context.json`. Charter 9 operational
test: *would someone who knows this product/subject recognize its world in a
muted frame?*

## Production spine (deltas from recut's 13 steps)

**1–2. Script + voice spine (above).** Replaces probe-of-camera + align-on-
speech-plate. Everything below is **transcript-driven** exactly like recut.

**3. Path + video-context.json** — after voice is green, decide
`create_path` and load the matching craft stack via the SSOT
[path-routing.md](references/path-routing.md) (first match: vox → promo →
explainer). Record `create_path`, content type, audience, channel, density,
`structure_recipe` from [promo-recipes.md](references/promo-recipes.md),
voice_spine receipt, and later `shot_refs` / `blueprint` ids.

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

### 4b. Path `vox` only

Follow [vox-collage.md](references/vox-collage.md). Argument-length clips +
`target_duration_s`. Skip non-Vox craft (§4c). Non-Vox hard fails **off**
(path-routing).

### 4c. Paths `explainer` + `promo` — craft stack (required)

Full field list, `shot_sequence` shape, hard fails **1–8**, and deck open
rules: **[path-routing.md](references/path-routing.md)** (SSOT). Executive
summary only:

1. Read path **story-design** → structure/arc, `path_role`, cue-cut `vo_cues`.
2. Read [visual-design.md](references/visual-design.md) → every beat gets
   VO-paced `shot_sequence` (no front-load).
3. Tag blueprint / `shot_ref` / `compose` per path-routing beat contract;
   motion-language + cut-catalog for moves/seams; `transition_in` between beats.
4. Fail the plan **before** taste work if path-routing hard fails trigger.
5. Optional craft mirror: `$WORK_DIR/STORYBOARD.md` — delivery remains Timeline.

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

**8–11. Plan, assets, assemble, craft render.** Follow
`asset-sourcing.md`. Prefer i2v from approved stills. Provenance in
`asset-sources.json`. Effects: `registry-integration.md` — Registry supplies
mechanism; FRAME supplies skin.

### Create craft (performance & anti-PPT motion)

**Non-Vox (`explainer` / `promo`):** implement each beat's locked
`shot_sequence` under [motion-language.md](references/motion-language.md)
doctrine (VO-paced sequential reveal, `power3` default, stillness over
screensaver). Within-beat seams → [cut-catalog.md](references/cut-catalog.md).
Also read recut `camera-and-transition-craft.md` when multi-scene director
density applies.

**Vox:** only [vox-collage.md](references/vox-collage.md) motion/duration
rules — do not force shot_sequence GSAP grammar onto generative plates.

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

**Timeline main track (create):** no talking-head plate by default. Prefer
program bed (`public/program.mp4` / HF bake) as main when ready; packaging
HTML as overlay if separate; **sounds = narration + music**; **subtitles from
ATA transcript**. Refresh DSL after `public/index.html` exists. Never leave
main pointing at a missing `input-video.mp4`.

**12–13. Evaluate and deliver — unchanged** schemas, plus create checks:

- [ ] `tts-response.json` + `alignment.json` + `transcript.json` present
- [ ] Timeline scrub: VO audible, captions track speech (sample 3 timestamps)
- [ ] film plan was confirmed (or autonomous skip recorded)
- [ ] `create_path` recorded; craft stack matched path
- [ ] **non-Vox:** path-routing beat contract + hard fails **1–8** clean; sample
      2 beats at mid-window (not only t=0) for content still developing
- [ ] **non-Vox:** not PPT-shaped (mixed `visual_kind`; quiet passages if explainer)
- [ ] **promo:** ≥1 real-capture proof beat when URL/surface existed
- [ ] **vox:** duration discipline only (vox-collage); no forced shot_sequence
- [ ] FRAME Taste Gate filled with counts where required
- [ ] generated-video / collage beats: plan had `target_duration_s` matched to
      ATA before spend; delivers cover those spans
- [ ] `vidmuse serve` URL reported; `final.mp4` only after user approval path

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
product proof would otherwise ship a **static chart PNG**:

1. Load sibling skill **`../vidmuse-motion/SKILL.md`**.
2. `python3 ../vidmuse-motion/scripts/motion_recipes.py --tag dataviz` (or `--index`).
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
3. **Do not** apply path-routing non-Vox hard fails or require `shot_sequence` /
   blueprint contracts.
4. **Plan first:** ATA argument spans → each beat `target_duration_s` on the
   video model's `duration_options` (Seedance often 4–15). One clip per
   argument, phases inside the clip — not one sentence per clip, not short
   motion under long VO.
5. V1 metaphor (with duration) → V2 still → V3 motion at planned length.
6. `vidmuse model run`: set `generation_type` from that model's live
   `required_params` keys (`text_to_image`, `image_to_video`,
   `images_to_video`, …). See catalog table in `vox-collage.md`.
7. Optional `scripts/collage_frames.py` for ffmpeg only. Not Anti-collage
   (Registry dump ban).
8. Voice + Timeline spine still run (Gates A–C).

## Isolation (recut + vox)

- **`/vidmuse-recut`:** unchanged. Create may *read* shared recut references;
  create craft files are not part of the recut spine. Never require
  `shot_sequence` on packaging plates.
- **Vox:** production logic stays in `vox-collage.md`. New create craft is
  additive for `explainer`/`promo` only.
- **Delivery:** still VidMuse Timeline (`write_dsl` + `vidmuse serve` /
  `render`). Non-Vox craft does not switch handoff to HF MP4-only.

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
2. Else muted: `npx hyperframes init` under `$WORK_DIR/public` scaffold, minimal
   edits, HF check — label output **stub**, not delivery.
3. Never use light path for "explainer", "promo", "launch", or client-facing
   work without an explicit stub waiver in chat.

## Report

Tell the user: work directory, grounding one-liner, **`create_path`**, recipe
if used, `shot_refs` / key blueprints if non-Vox, **TTS + ATA models used**,
Timeline URL (VO + captions + picture), quality caveats.
Do not claim finished if Gate B/C failed or non-Vox hard fails remain.
