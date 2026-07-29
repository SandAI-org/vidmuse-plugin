# Changelog

All notable changes to the VidMuse Codex plugin (`vidmuse@personal`) are documented here.

Format: version <= git tag conceptually; plugin and package.json versions stay in lockstep.

---

## 0.4.2 — 2026-07-29

### Create picture direction and review ownership

Breaking for in-flight non-Vox work directories: `film-plan.json` now requires
`film_design_read`, `continuity_strategy`, and per-beat `focal_subject` /
`layer_map`; real-UI beats also require `screenshot_treatment`.

- Added a picture-design contract before motion: explicit focal hierarchy,
  field/evidence/reading-surface layers, six screenshot treatments, typography
  roles, and four creative dials including depth separation.
- Replaced the required recurring hero with a general continuity strategy.
  Persistent motifs default to none; a line, rail, or ribbon is allowed only
  when it encodes a named relation and changes meaningfully.
- Added role-tagged VO cues. Only `event` promises a picture change; `carry`,
  `read`, `prelap`, and `offscreen` preserve editorial freedom. A beat may use
  one still `read`/`hold` window, and silent beats may use `vo_cues: []`.
- Made `check_motion.py` a fast static correctness preflight by default.
  Rendered frame sampling is optional/advisory unless explicitly made strict;
  the first playable animatic goes to VidMuse Timeline for user-owned aesthetic
  review.

## 0.4.1 — 2026-07-29

### Create direction and anti-PPT gates

Breaking for in-flight work directories: a `film-plan.json` written before this
release fails `film_plan.py` until it carries `creative_direction`,
`preproduction`, and the per-beat `world_id` / `continuity_in` /
`camera_intent` / `storyboard_frames` fields.

- Added an agency-style pre-production contract for non-Vox Create films:
  discovery/product truth, one-proposition brief, three materially different
  treatments, director treatment, real storyboard frames, and a full-duration
  approved animatic before HyperFrames/GSAP production.
- URL capture is now explicitly an evidence bank rather than a shot list.
  Selected treatments must define a film-wide directorial device, spatial
  model, camera grammar, continuity rule, and negative motifs.
- `film_plan.py` now validates pre-production artifacts, storyboard bindings,
  and the exact animatic SHA-256 before resolving a production plan.
- `check_motion.py` now rejects repeated full-frame luminance washes away from
  scene boundaries, closing the cue-flash/ambient-scan loophole that could make
  a technically green render aesthetically worse. R3 exempts declared grammar:
  beat seams count both `ata_range` ends, and `exit` / `morph` / `camera`
  windows are approved whole-frame events, so a planned crossfade or dissolve
  no longer fails the gate. Wash events cluster in a single pass over the
  merged cue+step list (a nested pre-cluster under-counted sustained washes),
  and `mean_shift` is measured over the changed pixels at a threshold that
  ignores luminance moves no viewer reads as a flash.
- `film_plan.py` now requires every beat to bind at least one approved
  storyboard frame; the previous index-level count could pass with one beat
  holding every frame and the rest holding none.

## 0.4.0 — 2026-07-29

### Skill architecture

- **One front door.** Added `/vidmuse` as the mandatory deliverable-based
  router. It resumes existing work, selects one owner, and does not execute
  media or author films itself.
- **Standalone media is first-class.** `/media-use` is now a user-facing
  capability as well as the shared runtime. ASR, ATA, TTS, generation,
  trim/reframe/transform, grading, and other exact media asks no longer route
  through recut/create.
- **Vertical film ownership.** `/vidmuse-recut` owns existing
  speaking-footage films; `/vidmuse-create` owns films whose primary material
  must be made. Loading assets, media, HyperFrames, motion, or GSAP skills does
  not transfer the final deliverable.
- **Shared runtime policy.** Namespace guards, vendored-skill rules, safe
  HyperFrames initialization, and Timeline preview policy now live once under
  `vidmuse/references/runtime-policy.md` instead of being duplicated across
  both film workflows.
- **Media execution receipts.** Recut uses `media-use/transcribe.mjs` for
  ASR→ATA; create uses the shared audio engine for TTS→ATA and preserves
  `audio_request.json` / `audio_meta.json`.
- Added routing eval prompts covering transcript-only, TTS-only, film,
  semantic-asset, transform, caption, and existing-HyperFrames requests.

## 0.3.19 — 2026-07-29

### Fixed

- **Logo identity continuity.** Lobe relationship parentheticals no longer act
  as synonyms, so a ChatGPT request cannot silently return the OpenAI provider
  mark. Legacy cached Lobe entries are checked against their resolved slug.
- **Variant fail-open.** Explicit logo variants are hard constraints across the
  provider cascade. Unsupported Lobe variants return a structured terminal
  error with available variants instead of falling through to an unverified
  SVG or favicon.
- **Stale asset reuse.** Resolution receipts now include a normalized request
  fingerprint; changing intent, entity, variant, provider, type, or mode forces
  a new resolve.

### Added

- **Semantic Pass receipts.** Every asset plan, including a deliberate empty
  plan, is stamped against the current transcript SHA-256 and opportunity
  count. Changed transcripts invalidate the plan.
- **Create/Recut asset gates.** Create's motion check and Recut's new
  `asset_gate.py` require approved assets to exist locally and appear as real
  `data-asset-ref` DOM nodes pointing at the exact receipt path. Recut runs the
  gate before layered Timeline attachment and evaluation approval.
- **Resilient CDN probes.** A rejected or unavailable HEAD request falls back
  to a ranged GET before a deterministic logo source is declared missing.

## 0.3.18 — 2026-07-29

### Added

- **Proactive Semantic Asset Pass.** Create and Recut now scan the full timed
  content after grounding—even without an explicit asset request—then record
  canonical entities, editorial show/suppress decisions, ATA ranges, groups,
  exact asset queries, and local receipts in `asset-plan.json`.
- **Machine-traceable asset binding.** `asset_plan.mjs` validates plans and
  resolves deterministic entries through `media-use`; create
  `film-plan.json` binds stable `asset_refs`, verifies local receipts, and
  carries them into the GSAP scaffold.
- **Hybrid-library framework.** A manifest-driven, currently empty Core Pack
  skeleton defines brand/font/icon/texture/SFX admission and license receipts;
  Creator Library, project freeze, and dynamic-provider boundaries are
  documented without bundling undecided third-party content.

### Changed

- `/vidmuse-assets` is the asset-intelligence/policy layer; `media-use` is now
  explicitly an internal media runtime. Editorial need, canonical identity,
  density, and licensing no longer overlap with download/generation/cache
  implementation.
- Create and Recut treat logos and other real assets as timed editorial
  interventions, reuse repeated entities, and forbid silent company/product/
  model identity substitutions.

## 0.3.17 — 2026-07-29

### Added

- **`/vidmuse-assets` asset-library capability.** Standalone or in-film logo,
  icon, font, material, provenance, licensing, reuse, and Creator Library
  requests now have a user-facing owner while `media-use` remains the
  execution layer.
- **Pinned Lobe Icons Logo Provider.** Exact AI/LLM entity matching uses the
  `@lobehub/icons` catalog and `@lobehub/icons-static-svg` assets before the
  existing SVGL → Simple Icons → GitHub avatar → favicon cascade. Static SVG
  variants (`mono`, `color`, `text`, `text-cn`, `text-color`, `brand`,
  `brand-color`) freeze locally and record package versions, source URL,
  variant, brand metadata, and MIT license.
- Logo cache identity now includes an optional variant so a wordmark, mono
  glyph, and color mark for the same entity do not overwrite or incorrectly
  satisfy one another.

### Changed

- **All active media routes are now VidMuse-native across the bundled skill
  pack.** HyperFrames CLI documentation no longer claims TTS, transcription,
  background removal, AI video, provider authentication, or managed-provider
  rendering as VidMuse product capabilities.
- **Plugin setup now runs the VidMuse media doctor.** It checks the authenticated
  VidMuse substrate and deterministic host tools, without making HyperFrames
  doctor a general environment prerequisite.
- HyperFrames transcription examples now require `--skip-transcribe` and hand
  media to VidMuse ASR + ATA; script/animation references use VidMuse voice
  discovery, TTS, and word timing.
- The capability menu and lifecycle references now use only bundled VidMuse
  product/domain skills. Missing upstream creation workflows are no longer
  lazily installed or advertised as fallbacks.
- Registry URLs that name their upstream component host remain unchanged as
  provenance/runtime registry sources; they are not AI generation or
  authentication routes.

## 0.3.16 — 2026-07-29

### Changed

- **Media Use is now VidMuse-native.** TTS, music, image, icon, digital-human,
  and video generation discover and run models through `vidmuse model
  list/run`; provider-specific CLIs and local AI runtimes are no longer part of
  the media resolution cascade.
- **Transcription now uses VidMuse ASR + ATA.** ASR supplies text when needed,
  ATA supplies word-level timing, and corrected text can be aligned without
  rerunning recognition.
- **Environment diagnosis now checks only the real execution substrate:**
  VidMuse CLI version/session/plan/model catalog, Node.js, `ffmpeg`, `ffprobe`,
  and bundled deterministic SFX. It no longer diagnoses or installs unrelated
  model runtimes.
- Media telemetry is VidMuse-scoped under `~/.vidmuse`, does not inspect
  provider credentials or identify accounts, and uses
  `VIDMUSE_NO_TELEMETRY=1` for its product-specific opt-out.

### Removed

- Legacy HeyGen, Parakeet/Whisper, Kokoro, mflux, LTX, MusicGen/Lyria, and
  Codex image-generation adapters from the bundled `media-use` skill.
- External LUT CDN dependency; bundled looks now build deterministically from
  local parameters.

## 0.3.15 — 2026-07-28

### Added

- **Cloud ASR closes the transcript requirement** — recut step 2 no longer stops
  to ask the user for spoken text. With no transcript available it now runs
  `vidmuse model run` with `extra_params.sub_model_type=asr`, writes
  `asr.json` → `transcript-source.txt`, and feeds that into the unchanged ATA
  alignment. **A packaging run can now start from nothing but a video file.**
  ASR returns text with no timings, so ASR and ATA always run as a pair — ASR
  fills the `prompt` that ATA needs; it never replaces ATA. The recognized text
  is surfaced to the user labeled as machine-recognized, non-blocking, because
  ASR misreads proper nouns / product names / numbers and ATA aligns a wrong
  word just as faithfully as a right one.
- **`vidmuse-recut/references/vidmuse-cli.md`** — CLI contract reference for the
  parts `--help` gets wrong or omits. Covers the `render` validated value sets
  and the mode↔container lock, `voice list/search/get` as the only source of
  `voice_id`, `asset generation-params`, implicit upload of local media paths in
  `model run`, the ASR call shape, headless `login --device --start/--complete`,
  `serve --host` exposure (no auth), and `Export project` (fcpxml / otio).
  Records which commands the pipeline deliberately skips (`thread`, `message`,
  `memory` are hosted-product state; `update` must not run mid-project) so
  agents stop rediscovering them.

### Fixed

- **`render --mode` legal values corrected against the binary** — `--help`
  prints "full or transparent", but `transparent` is rejected with
  `--mode must be full or overlay`. Reference records the tested pair plus the
  container lock (`overlay` → `.webm`, `full` → `.mp4`) and the enforced sets
  for `--quality`, `--resolution`, `--fps`.
- **`voice_id` was unobtainable** — `asset-sourcing.md` and `vox-collage.md` both
  required the field for `text_to_speech` while no file named the command that
  produces one. `asset-sourcing.md` now points at `vidmuse voice list --model`.
- **Corrected: `model run` does accept local media paths.** Known media input
  fields upload implicitly (ATA `files[]` → `savedPath`; image/video/audio →
  `downloadUrl`), so `image_urls: ["./still.png"]` is valid. The CLI has no
  `asset` upload verb — `asset` is `list` + `generation-params` only — which had
  made the local→URL path look unreachable.

### Changed

- Bundled `vidmuse` CLI → `v0.3.1-81e017e` (was `v0.3.0-a78bedd`). Command
  surface is otherwise identical; `render --resolution` now defaults to the DSL
  canvas rather than `source`, which no code path depends on since every DSL
  writer sets `resolution` explicitly.
- `vidmuse-recut/README.md` entry instructions no longer tell users to attach
  spoken text; both text sources are described, with user-supplied still
  preferred.
- `vidmuse-timeline.md` CLI preflight records the `render` runtime prerequisites
  (Node.js 22+ / ffmpeg / ffprobe) and links the CLI reference.

## 0.3.14 — 2026-07-27

### Added

- **Semantic alignment contract for precise product/UI overlays** — new
  `vidmuse-create/references/alignment-contract.md` separates content-space
  overlays from screen-space chrome. Capture, reticle, cursor, frame, and
  callout must share one `data-vm-align-space`; raster sub-regions use
  normalized percentage geometry instead of a second set of pixel
  coordinates; camera motion targets the shared parent.
- **`check_motion.py` S5 alignment gate** — promo
  `screenshot-camera`/`hybrid-slices` proof beats now require an alignment
  space. Declared anchors must resolve to a local target in the same transform
  space, raster spaces must preserve native dimensions, percentage boxes must
  stay inside the source, and direct spatial tweens on target/anchor fail
  unless they carry a written local-motion exception.

### Changed

- `shot_scaffold.py` now prints the alignment requirement into every promo UI
  proof section.
- `vidmuse-create`, visual design, site capture, path routing, HyperFrames core,
  and animation guidance now use the same “one animated ancestor” rule.
- Plugin version bumped to 0.3.14.

---

## 0.3.13 — 2026-07-27

### Fixed

- **`generation_type` route table corrected against the API docs** — the rule is **required for every video request, optional for audio**, not "required when the model is multi-mode" as both references previously framed it. Full table now recorded with primary inputs in `vidmuse-recut/references/asset-sourcing.md` and `vidmuse-create/references/vox-collage.md`: video `text_to_video` · `image_to_video` · `images_to_video` · `reference_to_video` · `avatar`; audio `text_to_audio` · `text_to_music` · `text_to_speech` · `sound_effect`; stills `text_to_image` / `image_to_image`. Also records that `avatar` takes `image_urls` + `audio_url` and no `prompt`, and that `text_to_speech` usually needs `voice_id`.
- **Audio routes are no longer described as invented** — `vox-collage.md` previously told agents that voice/ATA entries expose no audio type and to "not block on invented audio types", waiting for a 400 to name one. The four audio routes are real documented values, so that guidance actively steered agents away from passing a valid `text_to_speech`. Empty `required_params` in `model list` means the field is *optional* there, not invalid.
- **TTS call site now passes the route** — the Gate B `vidmuse model run` TTS example in `vidmuse-create/SKILL.md` sets `"generation_type": "text_to_speech"` (optional for audio, but needed to disambiguate a voice model that also exposes other audio modes) and notes `voice_id`. The two `doubao_speech/audio_text_alignment` calls are intentionally left without the field — ATA is not one of the documented routes and reports empty `required_params`.

---

## 0.3.12 — 2026-07-27

### Fixed

- **Routing hijack via skill-name shadowing** — a 0.3.11 URL-promo run entered upstream `/product-launch-video` and auto-opened HyperFrames Studio on port 3017 instead of delivering VidMuse Timeline. Root cause was **not** the skill text: the plugin vendors upstream domain skills under their original names (`hyperframes`, `hyperframes-*`, `media-use`), and `npx hyperframes init` **refreshes that "core set" from GitHub mid-run** (upstream `skill-lifecycle.md`: installs the core set *eagerly*). The refreshed upstream `hyperframes` reinstated `description: Mandatory entry point` plus its § 2 route table, whose row 8 sends any URL promo to `/product-launch-video`; that workflow's own review loop then forces `npx hyperframes preview` + storyboard ("don't ask whether to"). The plugin's bans lived in `hyperframes/SKILL.md` § 0/§ 5 — the exact file being overwritten — so they never reached the model. This is **not** an artifact of a crowded dev machine: a clean install self-pollutes on its first `init`.
- **Guards moved to skills that cannot be shadowed** — new **Routing authority** section in `vidmuse-create/SKILL.md` and `vidmuse-recut/SKILL.md` (the two skills that never collide with an upstream name, so they load reliably). Each declares that this file outranks any router claiming mandatory entry, and forbids entering / installing `/product-launch-video`, `/talking-head-recut`, `/embedded-captions`, `/general-video`, `/slideshow`, `/music-to-video`, `/faceless-explainer`. Restates Timeline-not-Studio delivery. Cites the upstream basis (`skill-lifecycle.md` @ `69446e7`) so the constraint can be revisited if upstream changes.
- **`HYPERFRAMES_SKIP_SKILLS=1` on every executable `init`** — `--skip-skills` is documented upstream as *temporarily ignored*, making the env var the only working opt-out. Applied in `hyperframes-cli/SKILL.md` step 1, all 7 examples in `init-and-scaffold.md`, `vidmuse-create` light path, and 3 `vidmuse-motion` runnable snippets.
- **Stale-skill reminder is now explicitly ignored** — upstream prints a one-line stale notice during `lint` / `check` / `render` and instructs agents to update on it. Acting on it runs bare `skills update`, which refreshes the core set and re-triggers the hijack. The previous ban only covered `skills update <workflow>`; both forms plus bare `npx hyperframes skills` are now forbidden, and the notice must be logged rather than acted on.
- **Hijack is now self-reporting** — `vidmuse-create` anti-goals gains a **Hijacked route** failure row, and the evaluate checklist gains two self-checks (no competing workflow entered; every `init` carried the env var). Previously this class of failure was only visible by reading the full run log by hand.

---

## 0.3.11 — 2026-07-27

### Changed

- **HF Studio Preview is opt-in** — default development / review loops no longer instruct agents to run `npx hyperframes preview`. Official Studio conflicts with VidMuse Timeline (`vidmuse serve`). User-facing review remains `vidmuse serve`; agent picture gates stay on `lint` / `check` / `snapshot` / `keyframes`; composition-only watch may use `hyperframes play --no-open`. Studio starts only when the user explicitly asks. Updated: `hyperframes-cli/SKILL.md`, `preview-render.md`, `hyperframes-core` review/production loops + validation checklist, `vidmuse-create` Gate C + evaluate checklist, `vidmuse-recut` skill + `pipeline.md`, registry examples.

---

## 0.3.10 — 2026-07-24

### Added

- **Full site capture as the default URL grounding** — new `vidmuse-create/references/site-capture.md`. Benchmarked against the official HyperFrames `website-to-hyperframes` flow (whose captures returned 200+ assets vs our 3 manual screenshots): URL promos now run `npx hyperframes capture "<URL>" -o "$WORK_DIR/capture"` (tokens, scroll screenshots, full asset download with DOM-context descriptions, video/lottie/shader manifests; `--video` mode downloads the site's real videos). Includes the reading protocol (write-down-and-forget, sub-agent catalog for 30+ images), `ASSET_AUDIT.md` curation into `$WORK_DIR/assets/`, and provenance registration so `check_motion.py` S3 verifies proof beats against the curated set. tokens.json seeds FRAME; visible-text.txt grounds script copy; asset-descriptions casts beat `asset_candidates`.
- **Segmented voice spine (optional, promo-recommended)** — SKILL Gate B variant: one TTS+ATA per beat, concatenated with planned inter-beat gaps, per-segment word timings merged by offset. VO boundaries equal beat boundaries exactly; single-line retakes don't touch other beats.
- **SFX sourcing ladder + Timeline placement** — path-routing Audio delivery: user assets → `/media-use` catalog → small reusable local library → skip with reason; level/trim rules; SFX must land on visual mech moments.
- **Beat contract extensions** — optional `asset_candidates` (expected on visual beats when a capture inventory exists) and per-beat `sfx: [{t, role}]`; `film_plan.py` validates both and resolves SFX to absolute times; `shot_scaffold.py` surfaces them as section/timeline comments.

### Changed

- `vidmuse-create/SKILL.md` grounding: manual browser screenshots demoted to fallback for URL subjects.

---

## 0.3.9 — 2026-07-24

### Added

- **Execution trace machine gate for `/vidmuse-create` non-Vox films (hard fail 13)** — closes the "correct film plan, generic fade-up implementation" gap found in a real promo render (frame-diff showed 0.1% pixel change during an 8s beat). Three new scripts in `vidmuse-create/scripts/`:
  - `film_plan.py` — structured `film-plan.json` mirror of the film plan; validates the beat contract and `--resolve`s `vo_cues` phrase strings to absolute times against ATA `transcript.json` (cue times can never be guessed)
  - `shot_scaffold.py` — generates the GSAP skeleton from the resolved plan: one locked `tl.addLabel("bXX.wY", t_abs)` per approved shot_sequence window + on_screen/move/cue FILL comments; implementation becomes fill-the-slots, not free-write
  - `check_motion.py` — post-render hard gate → `motion-check.json`. Static: beat sections, label survival + tween usage, `ui_proof_path` beats must reference a real capture from `asset-sources.json`, hero throughline DOM coverage. Rendered (ffmpeg frame sampling): no ≥1.5s freeze inside non-hold windows; a measurable state change must land on each `vo_cue` (event spike vs ambient Ken Burns drift — drift does not pass). Thresholds calibrated on the known-bad render: 46/76 checks fail on it, zero false kills on its genuinely animated cues
- **5 shot execution recipes in `/vidmuse-motion`** (`motion_recipes.py --tag shot`): `cue-paced-reveal`, `collapse-merge-morph`, `pullback-reveal`, `line-carry-transition`, `ui-strip-away-lock` — semantic code paths for the shot grammar film plans already specify

### Changed

- `path-routing.md` (SSOT): new **Execution trace** section; hard fails extended to **1–13**; craft-stack load order now includes structured mirror → scaffold → render gate; assemble checklist updated
- `vidmuse-create/SKILL.md`: anti-goals table gains **Plan→code drift** row; create craft starts from the machine skeleton (never a blank file); evaluate checklist replaces prose mid-window self-audit with `check_motion.py` **GATE PASS**; uniform per-section `appear()` fade templates explicitly banned
- `vidmuse-motion/SKILL.md` + description: covers shot execution recipes alongside dataviz

### Isolation

- **Vox frozen**: execution-trace scripts and hard fail 13 are non-Vox only.
- **`/vidmuse-recut` unchanged**: no recut behavior touched.

---

## 0.3.8 — 2026-07-24

### Added

- **Path-routed anti-PPT craft stack for `/vidmuse-create` non-Vox films** — new SSOT `references/path-routing.md` routes `create_path: vox | explainer | promo` and owns the full craft contract:
  - **Beat contract**: `ata_range`, `path_role`, `key_message`, `vo_cues`, `visual_kind`, `blueprint|shot_ref|compose`, `transition_in`, time-coded `shot_sequence` (≥2 windows + terminal hold)
  - **Hard fails 1–12**: front-load, title-card runs, mono-ease clone, fake-UI proof, undivided VO, missing quiet passages, cover/density (>3 active), missing hero throughline, undecided audio, needless full-html-rebuild
  - **`hero_throughline`** (film-level, required on standard explainers): 1–2 subjects persist and change state across body beats — kills orphan-card films
  - **`audio_delivery`** contract: BGM must be a real Timeline path or explicit `none` + reason; optional named `sfx_cues`
  - **`ui_proof_path`** decision tree (promo): `screenshot-camera` (default) → `hybrid-slices` → `full-html-rebuild` (written spend reason required)
  - Thin process gate: `$WORK_DIR/direction-approved.md` after film-plan confirmation
- New craft references: `story-design-explainer.md`, `story-design-promo.md`, `visual-design.md`, `motion-language.md`, `cut-catalog.md` (VidMuse-adapted from HyperFrames; timing truth = ATA, delivery = Timeline)
- `promo-recipes.md`: every recipe declares `path:` + `required_refs` + blueprint priors

### Changed

- SKILL.md / promo-recipes / shot-cards README / story-design refs now **point at path-routing SSOT** instead of re-listing contracts; deck open/close policy (incl. `data-beat` explainer-optional) lives only there.

### Isolation

- **Vox frozen**: `create_path: vox` stays on `vox-collage.md` only — no shot_sequence / hero / SFX-BGM / UI-tree obligations.
- **`/vidmuse-recut` unchanged**: create craft is not part of the recut spine.

---

## 0.3.7 — 2026-07-24

### Added

- **`/vidmuse-motion` dependency skill** — semantic motion recipes for HyperFrames/GSAP when Registry has no block.
  - `skills/vidmuse-motion/` — SKILL, `scripts/motion_recipes.py`, architecture / agent-playbook / verified-run docs
  - v1 recipes (4): `kpi-glow-count`, `weekly-bar-rise`, `sparkline-draw`, `stat-card-trio`
  - Gold example `examples/dataviz-semantic/` (HF check-passed trio board)
  - Human guide: `docs/MOTION-SEMANTIC-LAYER.md`
- Create wires to motion skill on data-beat / Registry miss; `validate:skill` includes motion recipes.

### Note

- Motion recipes **do not** replace product routers or shot-cards; they are the implement path after intent is known.
- First end-to-end verify (lint/check/snapshot/render) documented in `verified-run.md` (HF 0.7.69).

### Install

```bash
codex plugin add vidmuse@personal
# expect cache …/vidmuse/0.3.7 after package + sync
```

---

## 0.3.6 — 2026-07-23

### Added

- **Shot-card deck for `/vidmuse-create`** — curated **32 / 106** motion recipe priors extracted from [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) (Apache-2.0; text only).
  - `skills/vidmuse-create/references/shot-cards/` — `bridge.jsonl`, full `cards/*.md`, `NOTICE.md`, README menu
  - `skills/vidmuse-create/scripts/shot_cards.py` — `--index` / `--recipe` / `--get` / `--validate`
  - Agent **auto-opens** on promo/UI recipes (`saas-promo-30s`, `site-to-video`, `brand-sizzle`, `data-beat`, `hook-proof-outro`), user-named cards, or product-UI-hero briefs; stays **closed** for quiet explainers, Vox collage, stubs, and `/vidmuse-recut` (`recut_ok: false`)
  - Implement via **HyperFrames + GSAP** only (FRAME skins); Remotion demos / gallery media **not** vendored — previews stay at the upstream gallery URL
- `npm run validate:skill` now includes `shot_cards.py --validate`.
- `VENDOR-SOURCES.json` records the shotcraft extract provenance.

### Changed

- `promo-recipes.md` wires shot-card shortlists into promo-family recipes; film plan may carry `shot_ref: shotcraft:<id>` and `video-context.json` → `shot_refs`.
- `vidmuse-create` SKILL documents deck open rules, shortlist caps (≤5/film, ≤1 very-high), and report of `shot_refs`.

### Install

```bash
codex plugin add vidmuse@personal
# expect cache: ~/.codex/plugins/cache/personal/vidmuse/0.3.6
# open a new Codex Thread
```

---

## 0.3.2 — 2026-07-23

### Added

- **Create voice spine as hard gates** (`vidmuse-create` SKILL.md): Gate A (env/login check, no OS/browser TTS fallback) → Gate B (script lock → VidMuse TTS → `doubao_speech/audio_text_alignment` → `transcript.json`; never guessed timestamps; regenerate voice ⇒ re-run ATA) → Gate C (early Timeline serve with real VO + ATA captions before hero graphics).
- **Anti-PPT enforcement**: anti-goals failure table (silent deck / guessed timeline / non-VidMuse voice / PPT spacing / catalog collage / ungrounded look), film-plan rejection criteria, create craft rules (static layout before motion, scene transitions, entrance-ease diversity, golden-line ladder), light-path stub waiver for ≤20s tests, delivery checklist.
- **`skills/vidmuse-create/references/promo-recipes.md`** — six intent → structure recipes (saas-promo-30s, site-to-video, knowledge-explainer, data-beat, brand-sizzle, hook-proof-outro) with mechanism shortlists and anti-collage rules; structure priors, not templates.
- **`write_dsl.py --mode audio`** — narration + ATA subtitles DSL when no picture exists yet (create Gate C); main/overlay tracks empty, duration probed from `audio.mp3`. Documented in `vidmuse-timeline.md`.

### Changed

- `vidmuse-create` frontmatter description rewritten around the hard voice requirement (kept under the 1024-char limit); `SKILLS.md` create row matches.
- Create Taste Gate 7 is now count-ready (entrance tabulation at assemble).

---

## 0.3.1 — 2026-07-23

### Changed

- Brand assets: `assets/icon.png` and `assets/logo.png` replaced with the official mark from [vidmuse.ai](https://vidmuse.ai/en) (`/logo.png`, upscaled to 512² / 1024² with transparency).

---

## 0.3.0 — 2026-07-22

### Added

- **`/vidmuse-create`** — second product skill for films **without** a recording of a person speaking:
  knowledge explainers (script → TTS → ATA → shared pipeline), website/product promos grounded in the real site, generated-media films via `vidmuse model run`.
- **`skills/vidmuse-recut/references/asset-sourcing.md`** — shared media ladder (user-provided → real-world → AI generation), FRAME-governed prompts, `asset-sources.json` provenance, recut gated generated video, create-mode fabric rules.
- Create **Taste Gate adaptations** (ground-led vs spectacle), **TTS → ATA** cookbook spine, **Timeline main-track** guidance when there is no talking-head plate.
- Orientation defaults on recut: **progress rail default-on** (plain time vs chaptered); **marked transitions** at real chapter boundaries (`device-craft`, `camera-and-transition-craft`, `packaging-tells` V6 carve-out for plain rails).

### Changed

- Product surface is **dual-entry**: speaking footage → `/vidmuse-recut`; no speaking plate → `/vidmuse-create`. Recut is no longer described as the sole product router.
- `SKILLS.md`, `plugin.json` description / longDescription / defaultPrompts, `setup.sh` skill whitelist (**includes `vidmuse-create`**), and `/hyperframes` §0 route table hand off create work correctly.
- Recut artifact table lists `asset-sources.json`; recut may generate stills/music/SFX inside a packaging run with video B-roll user-gated.

### Shared taste stack (from 0.2.6, still in force)

- Aesthetic charter, packaging tells, countable Taste Gate, motion language, captions/device craft, taste distillation — one system for both product skills.

### Install

```bash
# from plugin source (or after packaging)
codex plugin add vidmuse@personal
# expect cache: ~/.codex/plugins/cache/personal/vidmuse/0.3.0
# open a new Codex Thread
```

---

## 0.2.6 — 2026-07-22

### Added

- `aesthetic-charter.md` — twelve dimensions of “good” + film-level trade-offs.
- `packaging-tells.md` — temporal T1–T8 and visual V1–V6 unexamined-default list.
- `captions-and-golden-lines.md`, `device-craft.md`, `taste-distillation.md`.
- Motion language in `camera-and-transition-craft.md` (easing, duration anchors, ≤2 movers); FRAME.motion is runtime law.
- Taste Gate mechanical *count* items (source-led share denominators, status tokens, emphasis); entrance diversity deferred to motion review.
- Style-composition anti-rut shortlist; packaging-analysis **Charter trades** section.

### Changed

- Charter dimensions may override craft *anchors* with a written reason; they may **not** silently cancel density caps, Gate counts, single-anchor, or Numerals & Claims.
- `taste-authority.md` clarifies relation to the charter (what good is vs who wins source conflicts).

---

## 0.2.5 — 2026-07-22

### Added

- `taste-authority.md` authority stack (BRIEF → room → FRAME → single anchor → creative hygiene → Registry).
- Proof-density cap for locked-off mono; Frame **Taste Gate** (room first, source-led share, single anchor, status chrome).
- Director mode reframed as density/ownership, not a prestige tier; short static mono prefer Packaging.

### Changed

- Direction phase must not browse `hyperframes-creative` as an art menu.

---

## 0.2.4 and earlier

See git history and `docs/HANDOFF-2026-07-22.md` for routing fixes, layered Timeline (`write_dsl.py`), setup global-CLI vs plugin-only skills, and initial plugin shell.
