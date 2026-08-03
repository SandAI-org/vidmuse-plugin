# Changelog

All notable changes to the VidMuse packaging plugin.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
