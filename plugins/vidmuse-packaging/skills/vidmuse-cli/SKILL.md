---
name: vidmuse-cli
description: "Operate the bundled VidMuse command-line interface for authentication, profiles, credits, models, generated assets, voices, styles, memories, threads, messages, and VidMuse DSL preview or rendering. Load whenever another VidMuse skill needs to invoke the CLI. The current plugin bundle supports macOS on Apple silicon and does not require a package download. Do not make film, editorial, design, placement, or asset-planning decisions."
---

# VidMuse CLI

Be the command authority for the `vidmuse` binary. Execute a decision already made by the calling skill and return structured results, identifiers, paths, or actionable failures.

## Resolve the bundled binary

Use the binary shipped with this skill; do not depend on `vidmuse` being installed on `PATH`:

```bash
SKILL_DIR="<base directory for this skill>"
VIDMUSE_BIN="$SKILL_DIR/assets/bin/vidmuse-darwin-arm64"
```

Before first use in a run:

1. Require `uname -s` to be `Darwin` and `uname -m` to be `arm64`.
2. Require `VIDMUSE_BIN` to exist and be executable.
3. Verify the bundled checksum from the binary directory:

   ```bash
   (cd "$SKILL_DIR/assets/bin" && shasum -a 256 -c SHA256SUMS)
   ```

4. Run `"$VIDMUSE_BIN" --help` to confirm it starts.

This bundle is intentionally version-agnostic. Do not run `vidmuse update`, download an installer, copy the binary into a system directory, or modify the user's shell configuration. If the host is not macOS arm64, report that the bundled platform is unsupported; do not silently substitute a PATH binary. Use another binary only when the user explicitly supplies its path.

## Minimal workflow

1. Resolve and verify the binary.
2. Run `"$VIDMUSE_BIN" <command> --help` before using an unfamiliar subcommand or flag. Treat live help as authoritative over remembered syntax.
3. Check authentication only for network-backed commands. Check local runtime dependencies only for `serve` or `render`.
4. Execute the narrowest command that satisfies the caller's request.
5. Verify exit status and expected output before parsing stdout or reporting success.
6. Return stdout data, created identifiers, local paths, and concise stderr diagnostics to the calling skill.

## Command map

| need | command |
| --- | --- |
| sign in or out | `login`, `logout` |
| user and credits | `profile get`, `plan get` |
| discover or run models | `model list`, `model run` |
| query generated assets | `asset list`, `asset generation-params` |
| query voices | `voice list`, `voice search`, `voice get` |
| query visual styles | `style list`, `style get` |
| persistent preferences | `memory list/get/create/update/append/push/pop` |
| remote conversations | `thread create/list/status/use`, `message list/send` |
| local Timeline review | `serve [dsl-path]` |
| local final output | `render [dsl-path]` |

Prefer `-o json` for network query commands when another skill consumes the result. Preserve stdout for machine-readable data and stderr for diagnostics. Do not append `-o json` to `render`: for `render`, `-o` means the output media path. `serve` has no structured-output flag.

## Authentication

Use `"$VIDMUSE_BIN" profile get -o json` as the non-destructive authentication check. Never print, copy, or inspect token values. The CLI resolves authentication itself from environment or its protected local config.

When login is required, prefer the agent-friendly device flow:

```bash
"$VIDMUSE_BIN" login --device --start
# User opens the returned URL and approves.
"$VIDMUSE_BIN" login --device --complete
```

Stop and return the approval URL when user action is required. Run `logout`, memory mutations, thread creation/use, or message sending only when the user's request or the calling workflow authorizes that external state change.

## Model execution

Discover compatible models first with `model list` filters. Pass exactly one complete Aion request JSON object through `model run --param`; do not rename, infer, or translate request fields.

```bash
"$VIDMUSE_BIN" model run --param '<complete-json-object>' -o json
```

For video, use the canonical generation types `text_to_video`, `image_to_video`, `images_to_video`, `reference_to_video`, or `avatar`. Audio may use `text_to_audio`, `text_to_music`, `text_to_speech`, or `sound_effect`. Image requests omit `generation_type`; local paths in supported media fields are uploaded by the CLI.

ASR is a special request and must contain exactly one local audio/video file or one public HTTP(S) audio URL:

```json
{"files":["/absolute/path/interview.mp4"],"extra_params":{"sub_model_type":"asr"}}
```

Do not include `model_name`, `prompt`, `messages`, or generation controls in ASR requests. Expect successful ASR stdout shaped as `{"text":"..."}`; do not claim word timing unless the returned payload actually contains it.

Audio-text alignment (ATA) is not a separate CLI subcommand. Discover and invoke the live model through the generic model surface:

```bash
"$VIDMUSE_BIN" model list --model doubao_speech/audio_text_alignment -o json
"$VIDMUSE_BIN" model run --param '<complete-ata-request-json>' -o json
```

Require the discovered model name to be exactly `doubao_speech/audio_text_alignment` with subtype `ata`. Its request must contain the corrected ASR text in `prompt` and the same local audio in `files`; omit `generation_type`, `messages`, and unrelated generation controls. Return the complete raw response to `vidmuse-media`. Never describe ASR text as aligned or use ASR-only output to construct timed captions.

Before a credit-consuming generation, ensure the chosen model supports the requested operation and that the caller has supplied all material inputs. A successful media generation returns public result URLs; return those URLs to `vidmuse-media` or the owning workflow for download and provenance recording.

## Local preview and render

For both commands, require an existing DSL JSON path. Keep the DSL owner responsible for its content.

For `serve`:

- Default to loopback `127.0.0.1` and use `--read-only` for review unless editing was explicitly requested.
- Use a non-loopback `--host` only when the user explicitly requests network access and the network is trusted; the preview has no authentication and can access project paths.
- Treat it as a long-lived process, report the URL, and keep the process available to the caller.
- When an owning workflow declares a mandatory Serve checkpoint, start the validated DSL immediately; do not downgrade the requirement to a suggestion or wait for another user request. Confirm the process remains alive and send the URL as a user-visible progress update before returning control to the owner.
- Try the default port first. If it is already occupied, do not terminate another process; find a confirmed free loopback port, pass it with `--port`, and report the actual URL.

For `render`:

- Require Node.js 22+, FFmpeg, and ffprobe. Use `NODE_BIN`, `FFMPEG_BIN`, `FFPROBE_BIN`, `HYPERFRAMES_BIN`, or `PYFTSUBSET_BIN` only when supplied or discovered safely.
- Prefer an explicit new output path: `.mp4` for `--mode full`, `.webm` for `--mode overlay`.
- Preserve the DSL canvas and source frame rate unless the caller explicitly requests `--resolution` or `--fps`.
- Use `--quality draft|standard|high` according to the caller's review or delivery intent.
- Verify the output exists, has nonzero size, and matches the requested container before returning it.

Do not start `serve` as an implicit preview after rendering. Start it when requested by the user or required by an owning workflow; a required post-transcription checkpoint is explicit workflow authorization.

## Boundaries

- Own binary resolution, command syntax, authentication mechanics, execution, and result parsing.
- Do not decide story, cut points, packaging density, visual direction, asset need, model choice strategy, or timeline content.
- Do not invent undocumented flags. Re-read live help when a command rejects an argument.
- Do not expose credentials, treat stderr as clean structured data, or report success from a zero-byte/missing output.
