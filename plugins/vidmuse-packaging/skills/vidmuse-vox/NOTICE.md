# Attribution

VidMuse preserves the three-gate approval protocol and the editorial halftone paper-collage
visual contract of the `gbro-collage-broll` skill. Its provider layer routes image and video
generation through VidMuse model serve, and its duration model is narration-driven rather
than fixed-length; the gate semantics, visual system, prompt structure, and QA standards
remain intact.

The `vidmuse-vox` skill is **adapted from** the open-source **gbro-collage-broll** project:

> https://github.com/pyang5166/gbro-collage-broll
>
> Pinned at commit `a1a4ee2e2abf7d44e460026b706d0c72c2cf8a91` (2026-07-15).

Adaptations for this repo:

- Renamed to `vidmuse-vox` and scoped as a VidMuse capability owner reachable through the
  `vidmuse` router.
- **Duration is planned from narration instead of fixed at 5 seconds.** The upstream skill
  delivers a fixed 5-second silent clip per script line. VidMuse resolves narration and word
  timing first, splits the script into arguments rather than sentences, and generates one clip
  per argument at a duration covering its measured narration span, phasing the assembly across
  long spans. This is the largest departure from upstream and follows the VidMuse
  duration-discipline rule that forbids short motion under a long narration span.
- **A mandatory voice spine was added.** The upstream skill treats the voiceover as an external
  artifact supplied by the user. VidMuse generates narration through `minimax/speech-2.6-hd`
  (with `index-tts-2/text-to-speech` and `elevenlabs/eleven_multilingual_v2` as alternates) and
  aligns it with `doubao_speech/audio_text_alignment`, because word timing is the source of the
  duration plan. Both calls are executed by the `vidmuse-media` skill, which owns media model
  execution and artifact verification. Clips are still delivered silent, with narration carried
  as a separate track.
- Still generation repointed from the Codex built-in `image_gen` tool to `gpt-image-2` through
  `vidmuse-cli`. This removes the upstream skill's only host-environment dependency, so the
  workflow no longer requires Codex.
- Video generation repointed from a direct `gemini-omni-flash-preview` API call to
  `minimax/hailuo-h3` through `vidmuse-cli`, with `seedance-2.0-pro` as the fallback. Both
  accept a two-image request meaning exactly first frame and last frame. The upstream legacy
  Veo script is dropped.
- **Motion output is normalized locally before QA.** The provider does not reliably honor the
  requested resolution or duration — a `720p` request has returned 1440×2560 running several
  tenths of a second long — so each clip is scaled, frame-rate locked, and trimmed to exactly
  `target_duration_s × 24` frames, with surplus tail frames cut rather than short clips padded
  by a freeze. `raw.mp4` is kept read-only, and provenance records the returned spec beside the
  requested one plus the single variable each retry changed.
- An explicit `generation_type` is now required on every image, video, and voice model call.
  For image and video models a model's `options.required_params` keys are its legal route
  values. The voice models are an exception to that inference: they report
  `required_params: {}` yet still reject a request that omits `text_to_speech`, so the route
  is now stated unconditionally rather than derived from the catalog. Narration also requires
  an explicitly cast voice, resolved from `voice list` `model_ids` to a model-specific id.
- Trimmed the upstream animation prompt's negative list to shot discipline only. The
  artifact-suppression negatives (no subtitles, no logo, no watermark, no text, no sound) are
  removed: current video models do not volunteer that content, and naming it risks
  introducing it. Typography is governed at Gate 2 and silence by the request plus ffmpeg.
- The upstream `GEMINI_API_KEY`, shared `~/hyperframes-projects/.omni-venv` virtualenv,
  `google-genai` dependency, `scripts/check_setup.sh` environment self-check,
  `scripts/generate_video.py`, and `scripts/upload_file.py` are all removed: VidMuse
  authentication and local-path upload are handled by the official installed CLI against VidMuse production.
- Result fetching, local verification, and per-item `provenance.json` were added, since
  VidMuse model runs return public URLs rather than local files.
- **A budget phase was added between the beat plan and the first gate.** The upstream skill has
  no cost model. VidMuse costs the whole film from live catalog prices, compares it against the
  real credit balance plus a retry reserve, and — when the balance is short — offers a subset the
  balance can pay for rather than refusing the film or silently shrinking it. Beats may be
  dropped whole; a beat is never shortened below its narration span to fit a budget.
- Artifacts aligned to the `videos/<project>/` convention, and Chinese-named project
  artifacts renamed to the repo's English filenames.

The original is MIT-licensed; its notice is retained below as required.

```
MIT License

Copyright (c) 2026 狗哥笔记

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
