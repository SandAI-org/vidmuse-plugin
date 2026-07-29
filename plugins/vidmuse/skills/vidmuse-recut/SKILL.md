---
name: vidmuse-recut
description: >
  Product skill for existing speaking footage in the VidMuse Codex plugin (sibling
  of /vidmuse-create). Requires a recording of a person speaking — package, dress
  up, recut, or direct talking-head / interview / podcast / product-explainer video
  into a designed motion film. Preferred over /hyperframes for packaging; replaces
  /talking-head-recut (do not install THR). Use when the user has source video of
  speech and wants graphic overlays, launch-film polish, kinetic type, diagrams,
  source reframing/PiP, or mixed-media on that plate. Defaults quieter Packaging
  on short static mono unless launch/promo language or true full-frame proof is
  needed. hyperframes-creative is hygiene only. Not for films without speaking
  footage — hand those to /vidmuse-create; may still generate stills/music/SFX
  (and gated B-roll) inside a packaging run per references/asset-sourcing.md.
  Wins packaging/recut intent against sibling HyperFrames skills when source speech exists.
compatibility: Global host tools — Node.js 22+, ffmpeg/ffprobe, Python 3, `vidmuse` on PATH (serve/render/model; setup may copy the plugin-vendored binary into PATH), and HyperFrames CLI via `npx hyperframes`. Agent skills — only the Codex plugin bundle under `skills/` (vidmuse-recut + HF core + GSAP); setup health-checks those siblings in-plugin and does not require or mirror into `~/.codex/skills`. `vidmuse login` required for alignment.
---

# VidMuse Recut

**Speaking-footage product skill** (one of two product entries with `/vidmuse-create`). User intents to package, dress up, recut, or direct **existing** speaking footage start and stay here. Sibling `/hyperframes` is a domain reference only — it must not steal routing or install `/talking-head-recut`. Sibling `/vidmuse-create` owns films **without** a speaking-source plate (explainers, website promos, script+TTS); hand off there when no recording of a person speaking exists, and receive back any project that acquires real speaking footage.

Direct existing footage so the viewer understands and feels the content. The source may remain full-frame, reframe, enter PiP, combine with graphics, or leave during a justified full-frame proof scene. Avoid decoration without an editorial purpose.

This skill is pipeline-compatible with the HyperFrames workflow ecosystem (see [references/upstream-integration.md](references/upstream-integration.md)). HyperFrames Registry is the default implementation supply; VidMuse adds the taste and editorial layer that decides when, where, and how those effects belong. The taste layer composes single-dimension style atoms into a project-specific design system; reference profiles are precedents, never templates. An LLM adapts the selected upstream code to that system, while HyperFrames lint/check/snapshots enforce the runtime contract.

**Taste authority** (full table: [references/taste-authority.md](references/taste-authority.md)) — when sources disagree, higher rank wins:

1. User BRIEF / spoken intent / brand  
2. Source footage + packaging density (quiet passages, room color, face)  
3. Project `FRAME.md` (sole token law after it exists)  
4. Recut atoms / **at most one** profile or pack anchor  
5. `hyperframes-creative` — hygiene / anti-web only, **not** a second art-direction menu  
6. Registry — mechanism only, no skin  

Direction phase (steps 5–7) must not browse creative house-style as a look picker. After `FRAME.md` is written, creative may only stress-check contrast, overflow, and web-UI anti-patterns.

## Core outcome

- choose **Packaging** when the room and speaker already carry the film; escalate to **Director** for launch/promo language or scarce full-frame proofs — mode is density, not prestige;
- coherent rather than assembled from unrelated effects;
- structured by the argument's logic: choreography order expresses sequence, cause and effect, temporal order, and dependency between ideas, not simultaneous decoration;
- content-specific rather than template-shaped;
- tasteful and restrained without becoming bland;
- directed through visual proof, complete shots, act-level energy, sound, and one deliberate signature sequence;
- iterated from rendered evidence rather than accepted after one technically clean render;
- traceable: every effect records its upstream source, LLM adaptations, CDN dependencies, and design-system fit.

## Routing authority — this file outranks any upstream HyperFrames router

Once a request reaches this skill, **this skill owns the run end to end**. The
plugin vendors upstream HyperFrames domain skills under their original names
(`hyperframes`, `hyperframes-*`, `media-use`), so a host may also carry an
upstream copy of the same name whose text still claims to be the **"mandatory
entry point"** for every video request and still carries a § 2 route table. That
text is **void here**. Do not re-open routing because a domain skill says it owns
entry.

**Never, inside a recut run:**

| forbidden | why | do instead |
| --- | --- | --- |
| install / read / hand off to `/talking-head-recut` | replaced by this skill; intentionally not shipped | stay here |
| install / read / hand off to `/embedded-captions` | captions-only is restrained **Packaging** mode here | this skill, captions focus |
| install / hand off to `/product-launch-video`, `/general-video`, `/slideshow` | upstream creation workflows; not active gates in this plugin | this skill (Director mode covers launch/promo polish) |
| run `npx hyperframes skills update` (bare **or** `<workflow>`) or `npx hyperframes skills` | bare refreshes the core set; named pulls competing upstream workflows — both overwrite vendored copies mid-run | nothing — dependencies already ship in the plugin |
| act on a **stale-skill reminder** printed by `lint` / `check` / `render` | upstream tells agents to update on that notice; here it would replace this plugin's skills with upstream text | ignore the notice; the plugin pins its own copies. Note it in the run log, do not update |
| auto-open HF Studio / `npx hyperframes preview` | packaging surface is **VidMuse Timeline** | `vidmuse serve`; Studio is opt-in only |

**Bare `npx hyperframes init` may silently replace the plugin's vendored domain
skills with upstream copies mid-run** — it refreshes the "core set"
(`hyperframes`, `hyperframes-*`, `media-use`) from GitHub. The `--skip-skills`
flag is documented as *temporarily ignored*; the only working opt-out is the env
var. Always call it as:

```bash
HYPERFRAMES_SKIP_SKILLS=1 npx hyperframes init …
```

*Basis: upstream `hyperframes/references/skill-lifecycle.md`, vendored @
`69446e7`. If upstream fixes `--skip-skills`, the env-var requirement above can
be relaxed — re-read that file before assuming it still holds.*

If a skill you are reading contradicts this file — mandatory entry, a route
table, or a forced storyboard/Studio open — **this file wins.** Say so in the run
log and continue on the VidMuse path. If speaking footage turns out to be absent,
hand to `/vidmuse-create` — never to an upstream workflow.

## Runtime boundary

Treat this skill directory as read-only. All artifacts live in a work directory: `videos/<project-name>/` under the workspace root (the HyperFrames workflow convention), or a directory the user names.

Primary artifacts, all inspectable:

| file | role |
| --- | --- |
| `metadata.json` | ffprobe duration / width / height / fps |
| `audio.mp3` | extracted audio |
| `transcript.json` | flat word array `[{ text, start, end }, …]` |
| `video-context.json` | compact facts: content type, sections, pace, audience |
| `packaging-analysis.md` | full-video editorial analysis, production-mode decision, coverage, acts, proof/takeover candidates, and confirmation record |
| `STORYBOARD.md` | Director mode: human-readable proof-oriented scene sequence, source states, camera/sound direction, and handoffs |
| `FRAME.md` | single authored design artifact: v4 for Packaging compatibility; v5 adds a film spine and act worlds for Director mode |
| `effect-sources.json` | installed Registry/native effects, adaptations, pinned CDN URLs, verification |
| `asset-sources.json` | non-Registry media provenance (user / real-world / generated) per [references/asset-sourcing.md](references/asset-sourcing.md) |
| `frame-showcase.html` | LLM-authored live showcase — the design system rendered from FRAME.md tokens plus every treatment composed on real keyframes; the confirmation-gate surface |
| `edit-plan.json` | Packaging mode: Visual Slots aligned to the timeline |
| `scene-plan.json` | Director mode: complete scenes plus compatible lightweight interventions |
| `motion-reel.mp4` | Director mode: opening, central proof, signature move, risky transition, and ending review reel |
| `act-renders/` / `output-draft.mp4` | Director mode: chapter and full-film review renders |
| `public/effects/` / `public/compositions/` | LLM-adapted inline effects and Registry blocks |
| `public/index.html` | assembled HyperFrames packaging composition (Timeline overlay source) |
| `public/input-video.mp4` | dense-keyframe source for main track + composition |
| `output.mp4` | optional HyperFrames bake (craft QA / fallback); **not** the only Timeline surface |
| `evaluation.json` | deterministic checks + aesthetic checks + feedback events |
| `dsl.json` | VidMuse Timeline multi-track project: **source + packaging overlay + subtitles + audio** |
| `final.mp4` | Timeline export after user approval (`vidmuse render`) |

## Workflow

### 1. Setup

If a `BRIEF.md` exists in the work directory, read it first — it carries the confirmed input and user notes; do not re-ask anything it answers. Check the environment — on first use this downloads and installs the HyperFrames CLI:

```bash
bash scripts/setup.sh
python3 scripts/taste.py --validate >/dev/null
python3 scripts/effects.py --validate >/dev/null
```

If `setup.sh` reports a missing prerequisite, relay its fix instructions to the user and wait for the environment to be ready before continuing.

Create the work directory (`videos/<basename>/`), then probe and extract per [references/pipeline.md](references/pipeline.md): `metadata.json`, `audio.mp3`.

### 2. Align the transcript

Two steps, and they are separate concerns: **get the text**, then **align it**. Alignment is always `doubao_speech/audio_text_alignment` (ATA) — that never changes. Only the source of the text varies:

| Text source | When | Cost |
| --- | --- | --- |
| User-provided (subtitles / script / `BRIEF.md`) | Available — still the **preferred** path | Free, and it is the words the user actually intends |
| Cloud ASR (`vidmuse model run` `sub_model_type=asr`) | No text available — run it automatically, do not ask first | One extra call; surface the text for correction without blocking on it |

**No transcript is not a blocker — never stop and ask for one.** When the user supplies no text, run ASR then ATA automatically and keep going. A packaging run should reach the Timeline from nothing but a video file.

```bash
# Text source B — cloud ASR. One local audio/video file.
# No model_name, no prompt. stdout is {"text":"..."}.
vidmuse model run -o json --param "$(python3 -c '
import json, sys
print(json.dumps({
    "files": [sys.argv[1]],
    "extra_params": {"sub_model_type": "asr"},
}, ensure_ascii=False))' "$WORK_DIR/audio.mp3")" > "$WORK_DIR/asr.json"

python3 -c 'import json,sys; sys.stdout.write(json.load(open(sys.argv[1]))["text"])' \
  "$WORK_DIR/asr.json" > "$WORK_DIR/transcript-source.txt"
```

ASR gives **text only — no usable timings.** It never replaces ATA; it only fills the `prompt` that ATA needs, which is why the two always run as a pair.

**Show the recognized text to the user alongside the Timeline hand-off, and say it came from ASR.** Do not block on their reply — proceed to alignment. ASR misreads proper nouns, product names, and numbers, and ATA will faithfully align a wrong word, so the error would otherwise reach captions and every packaging point silently. If they correct anything, fix `transcript-source.txt` and re-run the alignment (never hand-edit timestamps).

If the ASR call errors, fall back to asking the user for the text — do not retry in a loop. Call shape and URL-input rules are in [references/vidmuse-cli.md](references/vidmuse-cli.md).

Either way you end up with `$WORK_DIR/transcript-source.txt`. Align it to the extracted audio with the VidMuse CLI (model `doubao_speech/audio_text_alignment`; `prompt` = the text, `files` = the audio path):

```bash
vidmuse model run -o json --param "$(python3 -c '
import json, sys
print(json.dumps({
    "model_name": "doubao_speech/audio_text_alignment",
    "prompt": open(sys.argv[1]).read().strip(),
    "files": [sys.argv[2]],
}, ensure_ascii=False))' "$WORK_DIR/transcript-source.txt" "$WORK_DIR/audio.mp3")" > "$WORK_DIR/alignment.json"
```

The response nests sentence-level `utterances` with word-level `words`; `start_time`/`end_time` are milliseconds. Convert it to `transcript.json` — the flat word array `[{ text, start, end }, …]` in seconds — and use the utterance boundaries as your sentence grouping. If the aligned text mismatches what is actually spoken, fix `transcript-source.txt` and re-run the alignment; never hand-edit timestamps. Clamp all downstream times to the `metadata.json` duration; the final word's `end` can overshoot the clip length.

**Start the user Timeline early** once source media and transcript exist (even before style work). Read [references/vidmuse-timeline.md](references/vidmuse-timeline.md). VidMuse Timeline is the multi-track preview for **source + packaging points + subtitles** — not a post-hoc finished-MP4 player. HyperFrames remains the packaging-layer engine; the two layers do not conflict.

```bash
# after probe + re-encode path exists (or as soon as public/input-video.mp4 is ready)
python3 scripts/write_dsl.py "$WORK_DIR" --mode layered --no-overlay
vidmuse serve "$WORK_DIR/dsl.json" &          # default http://127.0.0.1:5175/ — tell the user the URL
```

Re-run `write_dsl.py` without `--no-overlay` after `public/index.html` exists so the packaging track attaches. Keep the same serve session when possible; reload the Timeline page after external DSL writes.

### 3. Understand and choose production mode

Create `video-context.json` from the transcript, metadata, and user request: content type, semantic sections, pace, audience, channel, brand assets, constraints. Inspect keyframes only when a design or edit decision depends on composition, subject position, shot change, or available visual space. Describe facts; do not choose a style yet.

Read [references/director-pass.md](references/director-pass.md). Production mode is a **density and ownership choice**, not a quality tier:

- Prefer **Packaging mode** when the plate is mostly single-camera talking head **without** B-roll / product demo / true on-screen data, and the user did not ask for launch-film / promo / full-frame redesign. Quiet source-led films are the correct default for short founders' monologues under ~3 minutes.
- Prefer **Director mode** when the user explicitly wants official-sample, launch-film, promo, motion-film, or effect-first language—or when the argument truly needs full-frame visual proof beyond captions and light rails.
- If unsure, write the packaging analysis as Packaging first; escalate only specific beats to Director proof denseness rather than labels.

Record the choice and evidence in `video-context.json`; the mode controls later artifacts, not authorization for external media generation.

### 4. Direct the film and confirm coverage (gate)

Minimum required reading here: the opening and the "Taste is the trade-off" section of [references/aesthetic-charter.md](references/aesthetic-charter.md), a scan of the tell **titles** in [references/packaging-tells.md](references/packaging-tells.md) (open a tell's body only when the plan reaches for that device), and [references/packaging-analysis.md](references/packaging-analysis.md) in full. Do not reread the whole charter per point — the analysis touches it once through its required "Charter trades" section. Analyze the **entire** transcript and the source footage before selecting a style or effect. Build a chapter/act map, inspect distributed frames from every major semantic section, and identify continuous systems, timed interventions, visual proofs, source-state changes, energy, and deliberate silence. Three showcase examples are never a complete plan for a substantial video.

Write `$WORK_DIR/packaging-analysis.md` as a user-facing review artifact and also present its essential Markdown in the conversation. The document is an editorial proposal, not a form to fill. Every recommended point needs a trustworthy time range and an intelligible reason; add transcript evidence, frame evidence, proposed content, layout relationship, HyperFrames mechanisms, risks, and confidence wherever they materially help the user judge it. Group repeated light beats when that makes the proposal easier to understand.

Use hooks, identity/context, chapters, semantic transitions, argument turns, comparisons, specifications/data, lists, causal explanations, source annotations, demonstrations, quotes/golden lines, conclusions/recommendations, captions, source-camera treatment, and finish layers as **lenses for noticing possibilities**, not categories that must all be populated. Craft depth for the recurring device families lives in [references/captions-and-golden-lines.md](references/captions-and-golden-lines.md) (caption system, golden-line qualification and escalation) and [references/device-craft.md](references/device-craft.md) (progress/index, data moments, demonstrations) — open them **only when** the analysis actually proposes a device of that class, not as up-front reading.

The analysis must distinguish:

- **continuous systems:** spoken captions (band and identity decided once — default band in [references/captions-and-golden-lines.md](references/captions-and-golden-lines.md); graphics yield to it, and leaving it needs a written reason), the orientation progress rail (default-on — plain when the film has no real chapters, carrying chapter marks when it does; [references/device-craft.md](references/device-craft.md)), safe-zone behavior, source framing/motion, color/contrast treatment, grain/vignette/finish;
- **timed light interventions:** keyword emphasis, labels, chapter-mark beats on the rail, small callouts;
- **timed medium interventions:** comparisons, data, causal chains, annotations, PiP, lists;
- **hero interventions:** hook, major chapter break, signature visual, final recommendation or decision model.

Reason like an editor and motion designer before mapping effects. Ask what the viewer should notice, understand, remember, or feel; whether the source footage already does that job; how the moment relates to the beats before and after it; and whether intervention improves the film enough to justify its visual cost. When claims relate — steps in a sequence, cause and effect, before/after, contrast, dependency — the relation itself is packaging material: plan the intervention so the viewer sees the relation, not just its members. Prefer the mechanism whose character and complexity fit that answer. HyperFrames capabilities—seek-safe kinetic type, FLIP, SVG draw/path, masks, texture/luminance text, particles, 3D/parallax layers, blend modes, motion blur, charts, shader transitions, and finish layers—are a palette, not a checklist. A sophisticated effect may be the right answer, but sophistication alone is never the reason.

Make a deliberate pass over major chapter boundaries, quantified claims, named product features, visible demonstrations, advantages/disadvantages, summaries, and recommendations so important opportunities are not missed. There is **no target count, interval, family quota, or required effect mix**. Two orientation defaults sit outside that rule: the quiet progress rail is **default-on** (plain time-only when the chapter test fails; carrying chapter marks on the rail when it passes — [references/device-craft.md](references/device-craft.md)), and every chapter boundary the chapter map confirms as real defaults to a **marked transition** (pick a family in [references/camera-and-transition-craft.md](references/camera-and-transition-craft.md); in Packaging mode this can be as light as a source-state change or brief matched-geometry wipe). Dropping either default needs a written reason in the analysis, not silence — but neither default licenses manufacturing chapters the content does not have (tell V6). Let narrative density, source variation, information load, emotional energy, and neighboring interventions determine the result. Richness comes from perceptive selection, coherent variation, contrast, and well-judged restraint—not from the number of overlays.

Treat negative space and unmodified footage as active design choices. When the source image already carries the evidence or emotion, the strongest proposal may be captions only, a small orientation cue, or an explicit source-only scene. Preserve rhythm by allowing quiet passages between hero moments. Seek one project-specific signature sequence only when the content itself suggests one; do not force it because the workflow mentions innovation.

**Proof-density cap (static talking head):** do not prove every sentence. For a single locked-off plate with no B-roll:

- at most **one** full-frame Hero proof per ~60–90s of runtime (or one clear Hero for a ≤2 min clip);
- at most **one or two** light continuous rails / indexes that reappear;
- majority of beats stay source-led (caption + orientation rail + optional whisper label);
- diagrams, cascade nets, pressure loops, module stacks, and night-canvas takeovers are scarce—each needs a unique relation the plate cannot show;
- status chrome in English mono (`EXPIRED` / `STALE` / `ACTIVE` / SaaS chips) is capped: prefer short Chinese judgment lines drawn from the transcript.

Count planned Hero + medium system scenes in the analysis; if more than roughly one-third of runtime is system takeover, cut.

In Director mode, read [references/storyboard-contract.md](references/storyboard-contract.md) and write `$WORK_DIR/STORYBOARD.md` after coverage confirmation (or record the user's autonomous skip). Every substantial scene needs a narrative job, viewer response, visual proof, source mode, act world, camera verb, entry/development/hold/exit/handoff, sound cue, hero time, and risks. Repeating the spoken sentence as animated type is not visual proof by itself.

Show the Markdown and wait for the user to confirm, add, remove, or reprioritize points. Record the outcome in the document. Do not browse/select the visual direction, build the frame showcase, or render packaging until this coverage gate is approved, unless the user explicitly requests an autonomous run.

### 5. Browse and compose the taste direction

Read [references/taste-authority.md](references/taste-authority.md) and [references/style-composition.md](references/style-composition.md) before choosing a direction. Do **not** open `hyperframes-creative` house-style / typography packs as a direction shortlist in this step—recut taste + rooms first. In Director mode also read [references/act-worlds.md](references/act-worlds.md): define one global film spine, then motivated act worlds with distinct visual cultures, materials, typography character, camera language, and sound state. Prefer **few** act worlds on short static mono; a new world must earn its emotional turn. The active library is browsed by index, not searched — there is no ranking engine between you and the candidates. Each domain exposes a compact digest small enough to read in full:

```bash
# Official visual templates (12 looks from hyperframes.dev/design) — prefer when user names a style
python3 scripts/taste.py --index --domain packs
# Structure / production references (not ready-made talking-head skins)
python3 scripts/taste.py --index --domain examples
python3 scripts/taste.py --index --domain showcases
# Compositional vocabulary (default when no pack is chosen)
python3 scripts/taste.py --index --domain atoms
python3 scripts/taste.py --index --domain profiles
python3 scripts/taste.py --index --domain patterns
python3 scripts/taste.py --index --domain cases
```

Two legitimate modes, decided by the user's intent:

- **preset** — the user picked a ready **style pack** (`pack:coral`, `pack:biennale-yellow`, … from the packs index; vendored under `library/frame-packs/`) or treated a library profile as fixed. Adopt its tokens faithfully; your judgment goes into casting its treatments onto this footage, not into redesigning it. Zero visual deltas is correct here.
  1. `python3 scripts/taste.py pack:<name> --get --domain packs` — read `source.frame_md`, `default_motion`, `effect_affinity`.
  2. `python3 scripts/frame_md.py library/frame-packs/<name>/FRAME.md --check` reports `mode: upstream-pack` and lists keys to add.
  3. Write project `FRAME.md` by copying the pack's `colors` / `typography` / `spacing` / `components` (all four — do not drop `spacing`), then adding `schema` / `project` / `mode: preset` / `anchor: pack:<name>` + `motion` from catalog `default_motion` (upstream packs stop at composition). Cast Frame Treatments onto this transcript and safe zones.
  4. When selecting effects, start from `effect_affinity.prefer` and avoid `effect_affinity.avoid` unless packaging analysis absolutely requires a listed mechanism.
- **composed** — the default when no pack is named. Choose editorial stance and source relationship from the content and footage first. Then compose visual culture, material, typography, composition, color logic, and motion temperament. Use **at most one** reference profile as an anchor; it is evidence of coherence, not a package to copy. Do not silently dual-anchor (e.g. name `editorial-intelligence` while shipping pervasive night-blueprint tiles, status chips, and mono supremacy like `technical-blueprint`). Structure may appear as a motivated act-world departure, not a second unstated skin. Official **examples** and **showcases** are structure/technique teachers only (demo timings stay locked) — never install them as the film's skin.

Read all candidate digests and judge them against `video-context.json` and representative frames: source composition, color temperature, speaker energy, content formality, audience, channel, and brand. Record why every serious pack/atom/profile alternative lost. Prefer palette from wall / wardrobe / room light; full-screen night canvases are an exception that must earn the takeover beat.

The taste direction does not own effect implementations. Browse the live HyperFrames catalog merged with VidMuse's taste overlay; the official catalog remains the implementation authority, while overlay fields such as `weight`, `use_when`, `avoid`, `zones`, and `integration_mode` guide editorial selection — further narrowed by the chosen pack's `effect_affinity` in preset mode:

```bash
python3 scripts/effects.py --index
```

Read the compact catalog and judge plausible candidates against the transcript, footage, and intervention budget. `curation_status: unreviewed` means the item is available, not approved: inspect its installed HTML before selecting it. Prefer an upstream effect when it expresses the mechanism well. Use a VidMuse-native effect only when Registry has no suitable mechanism or the content-driven signature move is not yet generalizable.

Fetch full overlay and compatibility records only for shortlisted ids:

```bash
python3 scripts/effects.py "hf:<id1>,hf:<id2>" --get
```

**Shortlist the caption identity as its own decision — not as one line item in the effect sweep.** Captions are on screen in nearly every frame, so the choice sets the film's perceived quality floor, while a one-off effect is visible for seconds. Chosen incidentally in a 130-item list, the caption defaults to whatever the transcript's genre suggests and the user never sees the decision. Narrow to the caption family and read those digests deliberately:

```bash
python3 scripts/effects.py --index | python3 -c '
import sys, json
for line in sys.stdin:
    record = json.loads(line)
    if "captions" in (record.get("tags") or []):
        print(json.dumps(record, ensure_ascii=False))'
```

Carry **two or three candidates** into the showcase gate (step 7) with one recommended — the caption band from [references/captions-and-golden-lines.md](references/captions-and-golden-lines.md) is a separate, defaulted decision, not something a mechanism gets to relocate. In preset mode start from the pack's `effect_affinity.prefer` and respect its `avoid`; in composed mode derive candidates from the atom set. Most films want a restrained continuous system with rung-1 emphasis; per-word karaoke is a genre costume (tell **T8**), legitimate only when the content's tone actually asks for it.

If the HyperFrames preference store is available (`media-use` `prefs.mjs`), read remembered defaults and treat them as selection signals with named provenance; an external user taste profile works the same way (explicit dislikes exclude, context-matched likes bias).

When the plan needs media the project does not have — images, icons, logos, textures, music, SFX, or (gated) generated B-roll — follow [references/asset-sourcing.md](references/asset-sourcing.md): the sourcing ladder (user-provided > real material > AI generation via `vidmuse model run`), FRAME-token-governed prompts, provenance in `asset-sources.json`, and the per-instance user gate for generated video inside a recut.

### 6. Write the project FRAME.md

Synthesize the selected evidence into `$WORK_DIR/FRAME.md` — the single authored design artifact, written in the upstream frame-pack shape (see any vendored pack's `library/frame-packs/<name>/FRAME.md`). Two layers, one document:

- **Frontmatter:** Packaging compatibility may use schema `vidmuse.recut.frame.v4`. New projects use `vidmuse.recut.frame.v5` with `production_mode`; Director mode additionally requires `film_spine` and non-empty `act_worlds`. Both carry `mode` (`preset` | `composed`), the optional `anchor`, and every concrete token — `colors`, `typography`, `spacing`, `motion`, and `components`. Downstream tools and the showcase read these tokens.
- **Prose spec** (the body): Overview, a Frame Craft Bar of eyeball tests, Colors/Typography/Depth/Motion direction with the reasoning inline, **Frame Treatments** — one per packaging-point class from step 4, each written in the recipe grammar `ground · composes · focal · chrome · accent · silence · Fixed/Free · density`, and **always including the caption system** (band, chosen caption identity, rung-1 emphasis treatment) since it is the one treatment present in nearly every frame — Composition Rules (Do/Don't), aspect-ratio behavior, the Signature move, "Why this departs from its anchor" (composed mode: which anchor decisions changed and the footage-grounded reason; also record the serious candidates that lost and why), a Numerals & Claims hard rule, and a Pre-Render Self-Audit with **frame criteria**, **temporal criteria**, and the **Taste Gate** below.

Aesthetic discipline lives in the prose and is enforced by your own self-audit and the user's eyes at the gate — no script judges it. What the script checks is mechanical (it parses; tokens the pipeline needs exist; colors are hex/rgba tokens; `spacing` and `motion` are present):

```bash
python3 scripts/frame_md.py "$WORK_DIR/FRAME.md" --check
```

**Taste Gate (required in every Pre-Render Self-Audit; fail → revise FRAME before showcase).** Items marked *count* are mechanical: produce the table or number, then judge. A gate answered with an impression instead of its count is not passed. Each item names the [references/aesthetic-charter.md](references/aesthetic-charter.md) dimension it protects; also clear the film against [references/packaging-tells.md](references/packaging-tells.md).

1. **Room first** *(charter 9)* — Would a viewer who never heard the argument still say "this looks like that room / that person"? If the first answer is "product methodology deck", rewrite.
2. **Source-led share** *(charter 4; count)* — Definitions first (same as the proof-density cap's): **source-led** = seconds carrying at most the continuous caption system, the orientation progress rail, plus a transient whisper label; **packaged** = seconds carrying anything more; the denominator is film runtime. Build a table: treatment class × instance count × packaged seconds. On a static mono plate, source-led seconds are ≥ half of runtime **and** light treatments are ≥ half of treatment classes; list the source-led time ranges. "Feels mostly quiet" without the table is a fail.
3. **Single anchor** *(charter 2)* — Named `anchor` matches the dominant culture on screen. If night grids + status chips dominate while anchor is warm editorial, either rename the anchor honestly or strip the dual skin.
4. **Chinese judgment > English status chrome** *(charter 3; count)* — Count distinct mono status words (`EXPIRED`, `STALE`, `ACTIVE`, `CONTINUED`, SaaS ops chips). Max **two** on the whole film unless the transcript itself is English status jargon. Zero is a fine answer.
5. **Mono hierarchy** *(charter 8)* — Technical mono may label structure; it must not own more screen area than Chinese judgment type across Hero frames.
6. **Proof scarcity** *(charter 4, 6; count)* — Count full-frame system takeovers and diagram scenes against the density cap in step 4 and list them with time ranges. Extra cascade/timeline/stack diagrams die or merge.
7. **Entrance intent** *(charter 1)* — At FRAME time, per-tween directions don't exist yet, so no table is faked here: the gate only forbids declaring one entrance direction × ease as the whole film's default without a written intent (tell T3). The **count** version — tabulate actual entrances by direction × ease family — runs later, at scene-plan/assemble review and in motion review's temporal review.
8. **Emphasis scarcity** *(charter 5; count)* — Count caption cues carrying any visually emphasized span (accent color **or** weight shift — both count; this is the same population as the captions reference's rung-1 "weight shift"). Anchor: roughly one in five cues; it moves with content density (a spec-heavy comparison earns more, a monologue fewer) but a majority of cues emphasized always fails — demote until the emphasized cues are the ones a viewer should quote.
9. **Creative demotion** *(charter 1)* — Confirm no visual decision was taken solely from `hyperframes-creative` house defaults against BRIEF/room/`FRAME.md`.

Derive exact palette, fonts, type scale, material values, and motion from the atom relationships, brand, footage, contrast, and output channel — in preset mode, from the chosen pack. A design system made only of adjectives has no force downstream. The signature move is the one principal creative departure — derived from the content, source motion, visual metaphor, or brand; a color swap or extra transition is not sufficient.

### 7. Build the frame showcase and confirm direction (gate)

Read [references/frame-showcase.md](references/frame-showcase.md), then author `$WORK_DIR/frame-showcase.html` — a single self-contained page in the manner of the upstream frame-pack showcases, wired entirely to the FRAME.md tokens through one `:root` CSS block (see any vendored pack's `library/frame-packs/<name>/frame-showcase.html`). Three things are confirmed in one round, before final timeline assembly:

1. **Direction as pixels on the user's footage.** The showcase renders the system live (direction + palette chips + type specimens + component demos) and then — its heart — every Frame Treatment composed over a real keyframe from the section where it will run, labeled with its time range and intent. Shortlisted Registry effects appear as adapted hero states with real transcript content, never as upstream demo styling. Extract keyframes with ffmpeg (`select='eq(n\,0)+gt(scene\,0.3)'`, plus `-ss <t>` pulls for specific treatments). Run the FRAME.md Pre-Render Self-Audit **and Taste Gate** against the page yourself before showing it. Ask first: *does this look like this room / this person?* — then: *is the argument clearer?* Do not ask the user to approve names or catalog thumbnails.

2. **Caption system.** The band (default bottom-centered per aspect; a departure is presented with its reason) and the caption identity — the 2–3 candidates from step 5 rendered on a real keyframe with real transcript text, one recommended. This is the film's most constant element and the one the user has the strongest instincts about; it does not ride along inside the treatment grid.

3. **Render strategy.** Aspect ratio (recommend from source aspect: ≥1.5 → 16:9, ≤0.7 → 9:16, else 4:5), canvas layout (split / stack / pip / overlay), and the intervention plan — how many visual interventions, at which weights, within the budget in [references/layout-vocabulary.md](references/layout-vocabulary.md). Editorial judgment still rules: a section that is clearer without any intervention gets none.

Use the best available question channel: a native structured-question tool when the runtime has one; otherwise one plain-text message with numbered options (2–5 questions max). Announce deferred asks up front. On an autonomous signal ("surprise me", "don't ask", pre-approved defaults) skip the round, pick the recommended values, and say what you picked in one sentence.

Apply corrections to `FRAME.md` first — frontmatter tokens and prose in the same edit — then re-wire the showcase `:root` so the two artifacts never disagree. Record each correction as an `evaluation.json` `feedback.events` modify entry with `from`/`to`. Do not proceed until direction is confirmed (or the skip is recorded).

### 8. Plan

In Packaging mode, create `edit-plan.json` with Visual Slots aligned to the timeline. Each slot: time range, editorial intent, selected pattern, `effect` source/id/integration mode, actual content, priority, `zone`, `accentIndex` when the palette defines alternates, and source-aware constraints or a justified local override.

In Director mode, translate the approved storyboard into `scene-plan.json` using [references/storyboard-contract.md](references/storyboard-contract.md) and validate it:

```bash
python3 scripts/scene_plan.py "$WORK_DIR/scene-plan.json" --check
```

The scene plan covers the complete timeline with substantial scenes or explicit source-only scenes. Lightweight captions, marks, and annotations remain compatible `interventions`; full-frame narrative scenes are not counted as panel cards.

The plan stays inside the intervention budget ([references/layout-vocabulary.md](references/layout-vocabulary.md)): heavy panel surfaces are the scarce resource; lighter weights are uncapped and paced by editorial judgment. Slot times stay inside the clamped duration and do not overlap unless intentional. Do not put HTML, CSS, or GSAP tweens in the plan.

### 9. Install and adapt effects

Read [references/registry-integration.md](references/registry-integration.md) before installing anything. Install each selected official item into the work directory and keep the machine-readable receipt:

```bash
npx hyperframes add <upstream-id> --dir "$WORK_DIR/registry-source" --no-clipboard --json
```

Read the installed files; never infer their structure from the catalog description. Keep the work directory's `FRAME.md` open while adapting and writing composition HTML — it is the composition-facing view of the confirmed design system, and every color, font, size, and motion token you write comes from it. The LLM adapts real content, palette, typography, sizing, timing, IDs, variables, safe areas, and integration shape while preserving the effect's useful mechanism. Pinned CDN dependencies are allowed. Reuse the host's pinned runtime when practical, but do not rewrite an effect merely to force it through a local abstraction.

Use the upstream type deliberately:

- **block:** adapt it as an independently seeked sub-composition; its timeline stays independent from the host;
- **component:** integrate only the reusable mechanism into the host or a dedicated sub-composition; do not paste demo roots, transcripts, or duplicate timeline registrations;
- **timeline hook:** attach it at the point required by its source code, usually after tweens and before timeline registration;
- **native:** follow the same HyperFrames block/component contracts under `library/native/`.

Write `effect-sources.json` with the exact HyperFrames version, effect IDs, adaptations, CDN URLs, integration modes, and proof stills/checks. The LLM is the adapter and motion author; HyperFrames is the mechanical validator.

**Hero frame first.** Render each complete scene's fully developed moment as a still and review it against [references/hero-frame-review.md](references/hero-frame-review.md); fix failures before finalizing animation. An effect is a mechanism inside that scene, not the review unit.

### 10. Assemble

Stage assets and write `public/index.html` per [references/pipeline.md](references/pipeline.md): re-encode the source with dense keyframes to `public/input-video.mp4`; place inline effects and sub-composition hosts at their resolved zones. The host has one paused main timeline for source-video transforms, layout, inline components, and native inline motion. Each mounted block owns its independent registered timeline; never add child timelines to the host timeline.

**Dual use of the composition:**

1. **HyperFrames craft QA** — may include muted source `<video>` + `<audio>` inside the host for `lint` / `check` / `snapshot` / optional bake.
2. **Timeline overlay (default user preview)** — attach the same (or a Timeline-tuned) HTML on a `type:"hyperframes"` sub-track. Prefer transparent packaging chrome; when Timeline main already plays source A/V, mute or omit competitive source audio inside the overlay so tracks do not double. See [references/vidmuse-timeline.md](references/vidmuse-timeline.md).

After `public/index.html` is writable, refresh multi-track DSL and confirm packaging appears on the running Timeline:

```bash
python3 scripts/write_dsl.py "$WORK_DIR" --mode layered
# reload Timeline URL if needed
```

You may attach **per-slot** overlay items (one HTML or one head HTML with multiple DSL items and `params.sourceStartTime`) as packaging points land — incremental Timeline feedback is preferred over waiting for a full bake.

Choreograph multi-element scenes as staged timeline sequences: elements enter in the order the logic demands — causes before effects, steps in their order, moments along their timeline — with position offsets and staggers carrying the rhythm. Reserve simultaneous entrances for genuinely simultaneous ideas. In both modes, apply the Motion language section of [references/camera-and-transition-craft.md](references/camera-and-transition-craft.md) — easing semantics, duration anchors, the ≤2-moving-elements rule, and the deviation clause — when writing any tween. For timeline sequencing, easing, stagger, and plugin mechanics, consult the bundled GSAP skill pack (`gsap-core`, `gsap-timeline`, `gsap-plugins`, `gsap-utils`, `gsap-performance` — siblings of this skill in the Codex plugin; confirmed present by `scripts/setup.sh`).

The full technical contract — determinism rules, animatable-property allowlist, visibility exceptions, font resolution — is [references/composition-contract.md](references/composition-contract.md). Read it before writing composition HTML.

### 11. Render and iterate

In Director mode, read [references/camera-and-transition-craft.md](references/camera-and-transition-craft.md), [references/sound-design.md](references/sound-design.md), [references/motion-review.md](references/motion-review.md), [references/iteration-loop.md](references/iteration-loop.md), and [references/official-quality-benchmark.md](references/official-quality-benchmark.md). Render `motion-reel.mp4` before the full film; correct failed camera weight, scene development, handoffs, source integration, and sound timing. Render act reviews when complexity warrants them, then `output-draft.mp4`, complete at least one full-film correction review, and only then produce `output.mp4`.

Packaging mode may proceed directly from confirmed hero frames to the full render.

```bash
npx hyperframes lint
npx hyperframes check        # includes failed CDN requests, runtime, layout, motion, contrast
npx hyperframes keyframes public --runtime all
npx hyperframes snapshot public --at <slot-midpoints>   # eyeball each frame
PRODUCER_BROWSER_GPU_MODE=hardware npx hyperframes render public -o output.mp4 --fps <fps>
```

Use HyperFrames render for **craft evidence** (`motion-reel`, act drafts, optional `output.mp4` bake) after the applicable confirmation and motion gates pass. Do **not** treat HyperFrames Studio as the user-facing packaging surface — that is VidMuse Timeline (`vidmuse serve`), where the user already scrubs **source + overlay + subtitles**. **Never auto-run `npx hyperframes preview`** during recut gates, checks, or handoffs (conflicts with VidMuse Timeline); Studio is opt-in only if the user explicitly asks. Agent picture tools stay `lint` / `check` / `snapshot` / `keyframes`.

### 12. Evaluate

Evaluate the rendered output, not only its source. Sample exported frames at slot boundaries and hero moments. Write `evaluation.json`:

- deterministic checks: duration, overflow, contrast, blank frames, direct-root media playback, CDN request success, timeline registration, effect timing, intervention budget (panel-card count, coverage, and adjacency per [references/layout-vocabulary.md](references/layout-vocabulary.md));
- aesthetic checks: content fit, visual proof, coherence across act worlds, hierarchy, restraint, originality, template feel, camera/motion craft, sound fit, and transition handoffs;
- Director review history: hero frames, motion reel, act review, full-film review, reference-gap review, corrections, final polish, and every named stop condition;
- user feedback: accepted, rejected, regenerated, manually changed, and learning scope.

Feedback events are also the raw material of the cross-project taste loop: when the user asks to distill taste (or after a project with substantial feedback), run the pass in [references/taste-distillation.md](references/taste-distillation.md) — repeated rejections become new packaging tells, repeated modifications move craft anchors, always proposed to the user before writing back.

Packaging mode may retain `vidmuse.packaging.evaluation.v1`. Director mode uses `vidmuse.recut.evaluation.v2`; validate it before reporting approval:

```bash
python3 scripts/evaluation.py "$WORK_DIR/evaluation.json" --check
```

The validator rejects false approval when a stop condition fails, a critical or major finding remains open, a required rendered review pass has not passed, evidence is missing, or the final render path is absent. A score never overrides a named failure.

When the HyperFrames preference store is available, record confirmed preference-backed choices (aspect, layout, direction) so the next run recommends them.

### 13. Deliver on VidMuse Timeline (multi-track)

Read [references/vidmuse-timeline.md](references/vidmuse-timeline.md). Preflight the CLI — all three must succeed; a bare `vidmuse --version` proves nothing:

```bash
command -v vidmuse && vidmuse serve --help >/dev/null && vidmuse render --help >/dev/null
```

If the CLI is missing, fall back to a HyperFrames bake (`output.mp4`) and say Timeline was unavailable.

**Default DSL is layered**, not bake-only:

| Track | Content |
| --- | --- |
| main | source `public/input-video.mp4` |
| sub (`type: hyperframes`) | packaging `public/index.html` (or per-slot composition HTML) |
| sounds | `audio.mp3` |
| subtitles | cues from `transcript.json` / `subtitles.json` |

```bash
python3 scripts/write_dsl.py "$WORK_DIR" --mode layered
vidmuse serve "$WORK_DIR/dsl.json" &          # if not already running; URL e.g. http://127.0.0.1:5175/
# user reviews packaging points, captions, and source together on multiple tracks
vidmuse render "$WORK_DIR/dsl.json" --output "$WORK_DIR/final.mp4" --quality standard   # after approval
```

Optional flat review only when needed:

```bash
python3 scripts/write_dsl.py "$WORK_DIR" --mode baked    # main → output.mp4; still keeps subtitles when present
```

**Write-back:** the user trims, toggles overlay enablement, edits subtitle text/times, or adjusts audio on Timeline; those edits persist into `dsl.json`. Re-read DSL from disk before any agent update; merge by stable `id`; record edits as `evaluation.json` `feedback.events`. **Design** changes to a card/effect → edit composition HTML, re-`check`/`snapshot`, refresh overlay path or `params`, reload Timeline — do not pretend Timeline alone redesigned HF motion. Verify `final.mp4` with ffprobe (duration, resolution, fps) before reporting.

## Report

Tell the user: work directory path, the design direction chosen and why (one sentence), the intervention plan and how it was chosen (one sentence), the **VidMuse Timeline preview URL** (multi-track: source + packaging + subtitles), any bake artifact if produced, and quality caveats. When the project produced substantial feedback events, offer a taste-distillation pass ([references/taste-distillation.md](references/taste-distillation.md)) in one sentence. Do not delete the work directory unless asked.
