# Changelog

All notable changes to the VidMuse packaging plugin.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.4] — 2026-08-04

### Added

- **VidMuse now carries 162 locally installable HyperFrames Shotcraft blocks.** The
  new `vidmuse-shotcraft` skill exposes bilingual communicative-job discovery for
  transitions, type, camera, data, UI entrance, interaction, impact, rhythm,
  openings, and outros without replacing the configured official HyperFrames
  Registry. The complete canonical Registry is shipped in-tree with Apache-2.0
  provenance, generated machine indexes, and a concise job guide.
- **A fail-closed local installation path for every `shot-*` item.** The current
  HyperFrames CLI cannot merge an HTTP Registry with a second filesystem root,
  so Shotcraft owns `install-local.mjs`: it preflights every write, honors the
  project's block and asset roots, isolates assets per item, refuses to overwrite
  modified files without an explicit `--force`, writes `shotcraft-lock.json`, and
  returns a complete `class="clip"` mount. Registry structure, Chinese job search,
  recut policy, custom paths, asset isolation, and overwrite behavior have
  deterministic tests.
- **Recut safety is curated separately from generated indexes.** Thirty
  blocks begin as `recut:safe`, thirty-one as `recut:adapt`, and every unlisted
  block fails closed to `create-only`; regenerating catalog indexes cannot erase
  the hand-maintained policy.

### Changed

- `vidmuse-create`, `vidmuse-recut`, `vidmuse-design`, the official Registry
  guidance, and transition guidance now route approved jobs to Shotcraft without
  letting the effect library take over story or motion direction. They explicitly
  reject raw Timeline mounts, demo residue, whole-canvas aspect-ratio scaling, and
  the false assumption that shortening a host mount automatically retimes a
  block's internal GSAP timeline.

## [0.2.3] — 2026-08-04

### Added

- **Credit-aware cost preflight across every paid path.** `vidmuse-cli` gained a
  balance-and-cost section: `plan get -o json` returns a spendable `credits`
  total plus per-bucket `creditDetails[].expireTime`, and estimates are computed
  from each model's live `priceItems` (`seconds`, `images`, and `30 seconds` unit
  types, matched on `properties` such as `resolution` and `audio`) rather than a
  remembered rate. Reading the balance is free and is now required before the
  first paid call of a run, and again before any batch that is a large fraction
  of what remains. An unreadable balance is reported as unknown — never invented,
  and never silently converted into either a green light or a refusal.
- **`vidmuse-vox` gained a budget phase (Phase 1b) between the beat plan and
  Gate 1.** The beat plan is the first moment the film's total cost is knowable
  and nothing has been paid for, so the film is costed there, including a retry
  reserve of ~20 percent of the motion subtotal — a plan that spends its last
  credit on the first pass has no room for the retry ladder. Recorded in a new
  `budget.json` artifact.
- **A short balance now yields an affordable film rather than a refusal.** When
  credits will not cover the plan, the skill proposes the subset the balance can
  actually pay for — the opening beat plus the strongest metaphor, not beats 1
  through N in order — states what the user will hold at the end, names the
  shortfall for the rest, and gives `https://vidmuse.ai/en/pricing` once, after
  the numbers rather than before them. Cheaper knobs are ordered by preference,
  down to a stills-only contact sheet when motion is unaffordable at any
  duration. Beats are dropped whole: shortening a beat below its narration span
  to fit a budget is forbidden, since that produces a film that fails QA rather
  than a cheaper film. If the user declines to top up, the affordable version is
  built well and the run stops there.
- Batches that the balance cannot finish must not start, since a mid-batch credit
  failure leaves paid-for beats inside an unfinishable film. A call rejected for
  insufficient credits is never retried. `vidmuse-create`, `vidmuse-recut`, and
  `vidmuse-media` check the balance before their own first paid call; the
  `vidmuse` router explicitly does not, since each owner owns its own budget
  conversation.

### Changed

- **`vidmuse-vox` motion now defaults to `minimax/hailuo-h3`.** A production run
  confirmed the two-image first/last-frame assembly holds up on H3 at 12
  credits/second against `seedance-2.0-pro`'s 20 — a 12-second beat drops from
  240 credits to 144 at the same 720p delivery spec. `seedance-2.0-pro` becomes
  the fallback and keeps its role in the retry ladder. Because H3 has a
  5-second floor, no beat may be planned at 4 seconds under the default: round
  the span up to 5, or say plainly that the beat is moving to Seedance.
- The request shape narrowed to what H3 accepts: `generate_audio` is omitted
  rather than sent false, and `guidance_scale`, `keep_original_sound`,
  `audio_id`, `voice_list`, avatar parameters, watermark URLs, and
  `extra_params` are named as fields to never send. Quoted credit figures are
  now explicitly stale-by-default — re-read the live price before each batch.
- **Higher resolution is not assumed to cost more, because on H3 it does not.**
  The live catalog prices `minimax/hailuo-h3` at 11 credits/second for 1080p
  against 12 for 720p, so 1080p is both better and cheaper on the new default
  model; `seedance-2.0-pro` keeps the intuitive ordering at 20 against 50. Both
  `vidmuse-vox` and `vidmuse-cli` now say to read the live prices and to
  surface the inversion when it appears.
- **H3's 5-second floor is treated as authoritative over its own
  `duration_options`.** The catalog advertises `[4, …, 15]` while the same
  model's description restricts duration to 5–15 second integers, so the `4` is
  not trustworthy: spans under 5 seconds round up to 5, or move to
  `seedance-2.0-pro`, which honors 4. Beat planning now floors
  `target_duration_s` at 5 on the default model rather than trusting the
  advertised option list.

### Fixed

- **Motion output is normalized locally before QA rather than trusted.** A `720p`
  request has returned 1440×2560 at 24fps running 0.1–0.7 second past the
  requested `duration`, and a beat that is 0.4 second long no longer matches
  the narration span it was planned from. Each clip is now scaled, frame-rate
  locked, and trimmed to exactly `target_duration_s × 24` frames from a
  read-only `raw.mp4`, cutting the provider's surplus tail rather than padding a
  short clip with a freeze frame. The duration pass criterion checks the
  normalized file, not the model's obedience.

### Added

- Animation prompts must split action into 2–4 continuous phases whose last
  boundary equals `duration` exactly, with a recommended 20–30 / 35–45 / 25–35
  percent split and one main visual verb per beat — a phase list that stops
  short of the full span is what produces an end-of-clip freeze.
- A single-variable retry rule and an ordered failure ladder covering stalled
  motion, drifting end frames, cuts and camera moves, invented objects, and
  mid-clip photoreal drift, ending in shortening or splitting the beat rather
  than growing the prompt further.
- Per-run provenance records the provider's returned spec beside the requested
  one plus the one variable that run changed, and a prompt pattern earns reuse
  on the next film only after its beat passed Gate 3 QA.

## [0.2.2] — 2026-08-03

### Fixed

- **`vidmuse-create` no longer produces slideshows.** The workflow could reach a
  finished film without a single word-level timestamp: step 5 required the
  ASR → correction → ATA chain only "for supplied speech", so narration this
  workflow synthesized itself was timed by its `ffprobe` total duration alone.
  With no anchors, the existing cue-chain and "graphics respond to words"
  instructions had nothing to bind to. Alignment is now mandatory for every
  narrated film — the synthesized-narration branch skips ASR and begins at ATA,
  as `vidmuse-media` already supports — and `transcript.json` joins the official
  artifact table.
- **Beat durations come from measured narration spans.** Each beat reads its
  `script_span` from the aligned words, adopting the rule `vidmuse-vox` already
  enforces: spans of 6.5 / 15.3 / 9.5 seconds become beats of about
  7 / 15 / 10 seconds, never an even division of the total.

### Added

- **`vidmuse-recut` gained a blocking Timeline synchronization gate.** A real run
  delivered a correct `output.mp4` containing all 8 packaging moments while
  `dsl.json`'s `graphics` track held 0 — the film was right, but the Timeline
  exposed no editable packaging. The requirement to patch graphics back into the
  DSL already existed, but it was spread across skills and sat after render and
  result reporting, so the flow was fail-open: an omission still delivered
  successfully. It is now fail-closed and placed before render. Every approved
  storyboard card maps to exactly one timed item, counts are reconciled across
  `storyboard.json`, the implemented hosts, and `dsl.json` within one output
  frame, and the user reviews the packaging points as segments on the Timeline
  before anything renders. `dsl.json` merely existing no longer satisfies
  `Required artifacts`, and completion now requires both delivery surfaces — a
  verified render beside an unreconciled graphics track is an incomplete
  delivery.
- **The packaging-point DSL shape is documented.** One item per packaging point
  on a `type: "sub"` graphics track using `videos`, with the
  `params.sourceStartTime` rule that silently shifts packaging when wrong: it
  equals `startTime` for a shared overlay host on the film's clock, and `0` for a
  per-card host starting at its own zero. Mounting `public/index.html` directly
  is called out as duplicating media whenever the DSL already owns the source
  video, program audio, or captions; the fix is an overlay-safe host derived from
  the validated composition, keeping the cards and the single GSAP master
  timeline while stripping source video, program audio, subtitles, and the opaque
  background. Card fragments and raw Registry templates are rejected as hosts.
  Reconciliation is documented as owner-level semantic validation, since
  `validate-dsl` must keep allowing a legitimately zero-packaging project and
  therefore cannot catch this class of omission.
- **Three irreversible parameters are now confirmed with the user, not inferred.**
  Duration, aspect ratio, and narration intent (TTS / supplied / silent) each
  invalidate the whole film when guessed wrong: duration drives beat count and
  script length, aspect ratio drives capture headroom and every crop, and
  narration intent decides whether word-level alignment exists at all. Step 1
  previously discouraged asking — "ask one short question only when an
  unresolved choice would materially change the deliverable" — so a run could
  silently adopt 16:9 and a guessed length. They are now one short up-front
  exchange presented with a recommendation, before anything is captured,
  written, or paid for. An unstated aspect ratio is missing information, not
  permission to assume; an explicit "you decide" is an answer and is recorded as
  an assumption in `BRIEF.md`. A resumed project treats them as settled and does
  not re-ask.
- **A per-beat semantic-event contract.** Beats split at arguments rather than
  sentences, and each beat records the ordered changes it must show with their
  causes. Any beat over roughly four seconds needs at least two distinct events;
  an entrance plus its own resolution counts as one. Single-event beats must be
  short or record why the stillness is deliberate. Silent films are held to the
  same density — only their anchors differ, coming from actions, reading load,
  and music instead of word onsets. Four
  explicit rejections cover the failure shape: beats one-to-one with sentences,
  one spoken passage over one unchanging picture, uniform treatment throughout,
  and a beat whose only event is its own entrance.
- **The animation map is now a Create gate.** Step 9's checks were entirely
  static, and a slide deck passes all of them — an unchanging screenshot is a
  flawless snapshot and a coherent contact sheet. `animation-map.mjs` and its
  dead-zone report are the only mechanical evidence that the film moves. Each
  dead zone must be either a named defensible stillness or a missing entrance,
  and every storyboard event must appear at its anchor; an unexplained dead zone
  spanning narration is blocking.
- **A named motion vocabulary for Product mode.** Seven existing
  `hyperframes-animation` rules for real-interface footage — `3d-page-scroll`,
  `camera-cursor-tracking`, `context-sensitive-cursor`, `cursor-click-ripple`,
  `control-target-sync`, `coordinate-target-zoom`, `multi-phase-camera`,
  plus sequencing and focus-transfer families — are mapped to beat jobs so each
  run stops rediscovering which rules apply to screenshot-led films. The beat's
  event still chooses the rule, never the reverse.

### Changed

- **The recut design gate is explicitly `FRAME.md` plus `design-preview/index.html`,
  accepted together.** The gate previously named only the preview, leaving the
  normative artifact out of the approval. Accepting a preview whose `FRAME.md`
  disagrees with it approves nothing, so both are now presented and the workflow
  waits; a revision round revises both.
- **Camera restraint is scoped to whole-frame work.** "Treat full-frame
  reframing and source-camera transforms as expensive attention transfers" read,
  when executed mechanically, as a general instruction to move less. It now
  states explicitly that it is not a budget on semantic events inside the frame
  and never justifies a static picture under a spoken passage: a held frame
  containing an anchored reveal or state change is the intended default.
- **Four checks were added to the film quality gate.** The previous fourteen
  were all satisfiable by a competent slideshow.

## [0.2.1] — 2026-08-03

### Fixed

- **Text-to-speech calls no longer fail with an opaque 400.** `vidmuse-media` and
  `vidmuse-vox` instructed agents to omit `generation_type` on voice requests,
  reasoning from the voice models' empty `options.required_params`. Aion rejects
  such requests. Every TTS request now carries
  `generation_type: "text_to_speech"`, and the `required_params`-keys-are-legal-
  routes rule is scoped to image and video models, where it holds.
- **Narration now resolves a real `voice_id`.** `minimax/speech-2.6-hd` requires
  one, and it must be the model-specific id under
  `model_ids["minimax/speech-2.6-hd"]` rather than the catalog `voice_id` such as
  `F-ZH-002`; the catalog id is rejected identically. `vidmuse-media` owns the
  resolution and fails loudly on an unknown voice, `vidmuse-vox` casts the voice
  as an explicit editorial decision, and `index-tts-2/text-to-speech` instead
  takes the caller's reference `audio_url`.

### Changed

- **Voice failures are documented as request defects, not outages.** A rejected
  Aion request surfaces as `API error (HTTP 502)` wrapping `aion api returned
  status 400` with no field name, so the previous "pass exactly what the error
  names" guidance was unreachable. The skills now name the two fields to check
  and forbid retrying an unchanged request.
- **`vidmuse-cli` documents the `voice` surface** and warns that `voice list` and
  `voice search` default to a page size of 20, which currently returns English
  voices only — Chinese voices require an explicit `--limit`.
- **The TTS response shape is stated.** A successful voice run returns a bare
  JSON array of public URLs with no wrapper object and no task id. ASR and ATA
  remain the genuine exceptions that carry no `generation_type`.

## [0.2.0] — 2026-08-03

### Added

- **`vidmuse-vox` skill** — a Vox-style editorial halftone paper-collage film
  workflow, adapted from the MIT-licensed
  [gbro-collage-broll](https://github.com/pyang5166/gbro-collage-broll) project
  (pinned at `a1a4ee2`). It keeps the upstream three-gate approval protocol —
  metaphor, then still, then motion — and the paper-collage visual system, while
  replacing the execution layer with VidMuse model serve. See
  `skills/vidmuse-vox/NOTICE.md` for attribution and the full adaptation list.
- **Narration-driven duration planning.** Picture length is planned from the
  narration span before any video spend: resolve voice and word timing first,
  split the script into arguments rather than sentences, and generate one clip
  per argument at a duration covering its measured span, phasing the assembly
  across long spans. Fixed-length clips under a variable-length voiceover are
  rejected, as is short motion padded with a held still.
- **`text-to-speech` in `vidmuse-media`** — narration synthesis through
  `minimax/speech-2.6-hd`, with `index-tts-2/text-to-speech` for voice cloning
  and `elevenlabs/eleven_multilingual_v2` outside zh/en. Produces
  `narration.mp3` plus the raw `tts.raw.json` audit trail, both verified by
  probe before return.

### Changed

- **`vidmuse-media` no longer bans TTS.** The skill owns every media model call
  a film workflow needs; it decides nothing editorial. New boundary: it does not
  decide whether narration should exist, how the script reads, or which voice
  suits the film — it executes the call the owner specifies.
- **Alignment accepts a locked script.** When audio was synthesized from a
  script the caller already owns, ASR and its correction pass are skipped and
  the chain begins at alignment. Alignment itself stays mandatory, and ASR is
  still required for recorded audio whose words are not known in advance.
- **`vidmuse` router** — added the Vox row and a rule that routes by material
  system rather than beat count. When paper-collage metaphor is the film's own
  visual language, `vidmuse-vox` owns it end to end; when the primary proof is
  real capture or product UI, `vidmuse-create` stays the owner and may load
  `vidmuse-vox` per clip.
- **Plugin version no longer carries the `+codex.<timestamp>` build suffix.**

### Notes

- Model contracts were verified against the live catalog: `gpt-image-2` for
  stills at 1080p, `seedance-2.0-pro` for motion at 720p (20 credits/second)
  with `minimax/hailuo-h3` as the fallback (12 credits/second, 5-second floor).
- An explicit `generation_type` is now required on every multi-mode model call —
  a model's `options.required_params` keys are its legal route values, and
  omitting one returns a 400.
- Animation-prompt negatives are limited to shot discipline (camera, cuts,
  morphing, invented objects). Artifact-suppression negatives are deliberately
  absent: current video models do not volunteer subtitles, logos, or watermarks,
  and naming them risks introducing them. Typography is governed at the still
  gate; silence is enforced by the request and by ffmpeg.

## [0.1.0]

### Added

- Initial VidMuse packaging plugin: one router, two film owners
  (`vidmuse-create`, `vidmuse-recut`), focused design, motion, asset, media,
  timeline, and CLI capability skills, a bundled macOS Apple-silicon VidMuse
  CLI, and pinned HyperFrames domain skills.
- The official talking-head recut visual protocol, adapted to VidMuse media and
  review providers.
