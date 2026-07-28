# VidMuse CLI Reference

The execution substrate for both product skills. This file records the parts an
agent can get **wrong from `--help` alone**: values `--help` misstates, inputs
that upload silently, and commands that answer questions the pipeline actually
asks.

Not a workflow. Delivery topology lives in
[`vidmuse-timeline.md`](vidmuse-timeline.md); the generation ladder and route
table live in [`asset-sourcing.md`](asset-sourcing.md).

Verified against `v0.3.1-81e017e darwin-arm64` (bundled at
`assets/vendor/vidmuse-cli/`).

## Runtime prerequisites

Service-query commands (`profile` / `model list` / `voice` / `style` / `plan`)
need only the binary plus network. The two local-media commands need more:

| Command | Needs |
| --- | --- |
| `serve` | FFmpeg (video thumbnails). The Preview UI's Render action inherits every `render` requirement |
| `render` | **Node.js 22+**, `ffmpeg`, `ffprobe`. FontTools optional (font subsetting). Network on the first render when no local HyperFrames binary is set |

```bash
node --version && ffmpeg -version && ffprobe -version
```

Override discovery with `NODE_BIN`, `FFMPEG_BIN`, `FFPROBE_BIN`,
`HYPERFRAMES_BIN`, `PYFTSUBSET_BIN`. With no local HyperFrames binary the CLI
shells to `npx --yes hyperframes@0.7.26`, which downloads on first render —
budget for it, or pre-warm before a gate.

## `render` — validated flag values

Every value below is enforced; a wrong one is a `USAGE_ERROR` before any work
happens. **`--help` misreports `--mode`:** it prints `full or transparent`, but
`transparent` is rejected. The legal pair is `full` / `overlay`.

| Flag | Legal values | Error text when wrong |
| --- | --- | --- |
| `--mode` | `full`, `overlay` | `--mode must be full or overlay` |
| `--quality` | `draft`, `standard`, `high` | `--quality must be draft, standard, or high` |
| `--resolution` | `source`, `720p`, `1080p`, `4k` | `--resolution must be source, 720p, 1080p, or 4k` |
| `--fps` | `24`, `30`, `60` | `--fps must be 24, 30, or 60` |

Mode and container are locked together:

```
--mode overlay  →  --output must use .webm     (VP9 + alpha)
--mode full     →  --output must use .mp4      (H.264)
```

`overlay` drops the main video track **and its source audio**, keeping
HyperFrames + subtitles + independent sound tracks on a transparent channel —
that is the dual-render target in `vidmuse-timeline.md`.

Defaults: resolution and aspect follow the **DSL canvas** (source video
dimensions when the DSL defines no canvas), and frame rate follows the source.
Output lands at `<dsl-dir>/renders/<dsl-name>-<UTC-timestamp>.<ext>` with an
auto version suffix on same-second collisions. `-o/--output` sets a full path,
`-O/--output-dir` a directory, `--output-name` just the stem.

## `voice` — where `voice_id` comes from

`text_to_speech` usually needs `voice_id`, and **no other command surfaces a
legal value**. Query, don't guess, and don't ask the user for a raw ID.

```bash
vidmuse voice list --language zh --gender female --scope official -o json
vidmuse voice search -q "warm documentary narrator" -o json
vidmuse voice get <voiceId> --view full -o json
```

`voice list` filters on `--language`, `--gender`, `--age-group`, `--emotion`,
`--model` (only voices mapped to that model key), `--scope all|official|user`,
`--query`, plus `--view summary|full` / `--fields` and `--limit` / `--offset`.
Filter by `--model` when a specific TTS model is already chosen — voice
availability is per model.

## `asset` — read-only, and what that rules out

```bash
vidmuse asset list
vidmuse asset generation-params --file-path ./still.png -o json
```

`generation-params` reads a **local file path** and reports the generation
params for it — use it to ground a `model run` body instead of guessing which
fields a model wants.

**There is no upload command.** `asset` has exactly `list` and
`generation-params`. Do not look for `asset create` / `upload` / presign — the
CLI has no such verb, and `image_urls` is not filled by a separate upload step.
See below for how local paths actually reach the API.

## `model run` — local paths upload implicitly

One flag only: `--param`, holding the **complete Aion request JSON**, and it
must contain `model_name`. Use canonical snake_case Aion field names, including
nested ones (`elements[].reference_image_urls`,
`elements[].frontal_image_url`).

The CLI passes public media URLs through untouched, but **local paths in known
media input fields are uploaded first** — ATA `files[]` entries become the
returned `savedPath`, while image / video / audio inputs become the returned
`downloadUrl`. So a local still is legal directly:

```bash
vidmuse model run --param '{"model_name":"<i2v>","generation_type":"image_to_video","prompt":"Slow push-in","image_urls":["./first-frame.png"]}'
```

The CLI never infers or rewrites `prompt`, `elements`, or `generation_type` —
route correctness is yours (table in [`asset-sourcing.md`](asset-sourcing.md)).
Text models emit JSON; media models emit **only public CDN URLs**, no task ID.
Aion ATA does not generate or register SRT text assets.

## ASR transcription

Cloud speech-to-text. Paired with ATA, this is what lets a packaging run start
from **nothing but a video file** — no subtitle file or script required. See
SKILL.md step 2 for the pipeline position.

A distinct call shape from every other `model run`, selected **only** by
`extra_params.sub_model_type=asr`:

```bash
vidmuse model run --param '{"files":["./interview.wav"],"extra_params":{"sub_model_type":"asr"}}'
```

Exactly one local audio/video file, or one public HTTP(S) **audio** URL. Pass
no `model_name`, `prompt`, `messages`, or generation controls. Public *video*
URLs are unsupported. Success on stdout is `{"text":"..."}`.

A public URL must be HTTP(S), public host, no credentials, and an audio
extension when its path has one. The CLI checks only URL *shape* — Aion does
DNS/IP, redirect, and MIME validation when it fetches, so CLI acceptance is not
proof the fetch will succeed.

This is **transcription, not alignment** — the two tools compose:

```
no transcript ──ASR──> raw text ──user corrects──> transcript-source.txt
                                                          │
                                    audio.mp3 ────────────┴──ATA──> transcript.json
```

ASR returns `{"text":"..."}` with **no word timings**, so it cannot feed
captions or packaging points directly. ATA is what produces word-level
`transcript.json`, and it needs the text as its `prompt`. ASR fills that
`prompt` when the user has nothing; it never replaces ATA.

Surface ASR text to the user (labeled as machine-recognized) without blocking on
it. It misrecognizes proper nouns, product names, and numbers — precisely the
words a recut builds its overlays on — and ATA will faithfully align whatever
wrong text it is given, so an uncorrected error propagates silently into
captions and every packaging point.

Transient upstream errors are possible on this route; if the call fails, ask the
user for the text instead of retrying in a loop.

## Auth

```bash
vidmuse profile get        # cheapest liveness + login probe
vidmuse plan get           # subscription + remaining credits
```

Token priority: `VIDMUSE_AUTH_TOKEN` > `VIDMUSE_WEB_TOKEN` > `sessionToken` in
`~/.vidmuse/config.json` (mode `0600`).

Headless / agent-run login splits into two non-blocking halves — prefer this
over bare `vidmuse login`, which waits on a local callback:

```bash
vidmuse login --device --start      # prints URL, saves pending state, returns
# user approves in browser, then:
vidmuse login --device --complete
```

Check `plan get` before a generation batch: `model run` spends credits, and
finding out mid-ladder is worse than finding out first.

## `style`

```bash
vidmuse style list --scope official --limit 12 --view summary -o json
vidmuse style get <styleId> --view full -o json
```

Server-side style catalog, distinct from the project's own FRAME tokens. It does
not override `FRAME.md` — treat a style as reference, not authority.

## Commands the pipeline deliberately skips

`thread` (`create` / `list` / `status` / `use`), `message` (`list` / `send`),
and `memory` (`create` / `get` / `list` / `update` / `append` / `push` / `pop`)
drive the hosted VidMuse conversational product — server-side threads and cloud
memory. Recut and create own their state in `$WORK_DIR` on local disk.

Reach for them only on explicit user request. Routing film work through a
hosted thread splits the source of truth away from the work directory.

`logout` and `update` are user-run maintenance. Never run `update` mid-project:
it swaps the binary under a pipeline pinned to a verified version.

## Global flags

```bash
-o, --output   json | text | table      # -o json for anything parsed
    --verbose                            # HTTP debug to stderr, credentials redacted
```

`VIDMUSE_VERBOSE=1` does the same. Always `-o json` when a script consumes the
result — the default `text` shape is for humans and is not a stable contract.

## `serve` exposure

`serve` binds `127.0.0.1:5175` and reads `dsl.json` from the working directory
when given no path. `--host` genuinely exposes it: there is **no
authentication**, and it restricts neither local paths nor remote HTTP(S)
targets. Keep the loopback default unless the user asks otherwise and the
network is trusted. `--read-only` disables DSL edits from the preview — use it
when handing a review URL that must not mutate the work directory.

Remote `filePath` values (`http://`, `https://`) work for video and audio: the
preview downloads them to `<dsl-dir>/local-assets/remote-media`, render pulls
each once into its temp workspace, and export keeps a local copy. **Remote
HyperFrames HTML sources are not supported** — overlay HTML must be local.

`Export project` in the preview writes a portable, UTC-stamped directory under
`<dsl-dir>/exports`: `timeline.fcpxml`, `timeline.otio`, `project.dsl.json`,
assets sorted into `video` / `audio` / `images` / `hyperframes`, and any
existing renders. That is the handoff when a user wants the edit in Resolve or
Premiere rather than a finished file.
