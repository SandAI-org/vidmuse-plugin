---
name: vidmuse-cli
description: "Operate the bundled VidMuse command-line interface for authentication, profiles, credit balance and cost estimation, models, supported tools, generated assets, voices, styles, memories, threads, messages, and VidMuse DSL preview or rendering. Load whenever another VidMuse skill needs to invoke the CLI or needs to know what a generation will cost against the user's balance. The current plugin bundle supports macOS on Apple silicon and does not require a package download. Do not make film, editorial, design, placement, or asset-planning decisions."
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
| discover or run models | `model list`, `model run`, `model result` |
| run supported VidMuse tools | `tool run` |
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

## Credits and cost preflight

Reading the balance is free, is never a paid call, and is the only honest basis for a cost warning:

```bash
"$VIDMUSE_BIN" plan get -o json
```

It returns `credits` as the spendable balance, plus `planName`, `hasActivePlan`, `nextRenewTime`, and a `creditDetails` array whose entries carry `creditAmount`, `creditType`, and `expireTime`. Report the `credits` total; do not sum `creditDetails` yourself, and do not echo the email from `profile get`.

Estimate cost from the chosen model's live `priceItems` rather than a remembered rate. Each item has a `unit_type`, an optional `properties` filter, and `price.output` in credits per unit:

| `unit_type` | estimate |
| --- | --- |
| `seconds` | `duration_seconds × price.output` |
| `images` | `image_count × price.output` |
| `30 seconds` | `ceil(audio_seconds / 30) × price.output` |

Match `properties` to the request you are actually sending — `resolution`, and `audio` on models that price sound separately. An item with no `properties` is the fallback default, not a cheaper option.

Do not assume price rises with resolution. On `minimax/hailuo-h3` today, 1080p costs 11 credits/second while 720p costs 12, so the higher tier is the cheaper one; on `seedance-2.0-pro` 1080p is 50 against 720p's 20. Read both before recommending a tier.

Check the balance before the first paid call of a run, and again before any batch whose estimate is a large fraction of what is left. When the estimate is close to the balance, also read `creditDetails[].expireTime`: a balance that covers the run today may not cover it next week.

When the balance cannot be read, treat it as unknown. Report the estimate and the failure, and let the owning workflow decide — never invent a balance, and never let an unreadable balance silently become either a green light or a refusal.

When the balance is short, return the numbers and this link, once:

> https://vidmuse.ai/en/pricing

Then hand the shortfall back to the caller. Deciding what to build within a budget is the owning workflow's judgment, not this skill's: do not shrink a request, drop a stage, downgrade a resolution, or abandon a run here, and do not treat a sufficient balance as authorization to spend.

## Model execution

Discover compatible models first with `model list` filters. Pass exactly one complete Aion request JSON object through `model run --param`; do not rename, infer, or translate request fields.

```bash
"$VIDMUSE_BIN" model run --param '<complete-json-object>' -o json
```

For video, use the canonical generation types `text_to_video`, `image_to_video`, `images_to_video`, `reference_to_video`, or `avatar`. Audio uses `text_to_audio`, `text_to_music`, `text_to_speech`, or `sound_effect`. Image requests omit `generation_type`; local paths in supported media fields are uploaded by the CLI.

Send `generation_type` on every audio request rather than relying on the documented `text_to_audio` default, and send it even when the model reports `required_params: {}` — the voice models do, and they still reject a request without it. A rejected Aion request surfaces as `API error (HTTP 502)` wrapping `aion api returned status 400`, with no indication of which field is wrong; report that shape verbatim instead of inferring an outage or retrying unchanged.

Text-to-speech also needs a voice selector, and `voice_id` values are model-specific:

```bash
"$VIDMUSE_BIN" voice list -o json --limit 200
"$VIDMUSE_BIN" voice search -q "news anchor" -o json
"$VIDMUSE_BIN" voice get <voiceId> -o json
```

`voice list` and `voice search` default to a page size of 20; pass `--limit` before reporting that a language has no voices. For `minimax/speech-2.6-hd`, pass the id under the entry's `model_ids["minimax/speech-2.6-hd"]`, not the catalog `voice_id`. Successful voice runs return a bare JSON array of public URLs with no task id.

Timestamped ASR is a special request and must contain exactly one local audio/video file or one public HTTP(S) audio URL. Use `scribe-v2` by default:

```json
{"model_name":"scribe-v2","files":["/absolute/path/interview.mp4"],"extra_params":{"sub_model_type":"asr"}}
```

Do not include `prompt`, `messages`, or generation controls. Preserve the complete stdout before parsing it. `scribe-v2` currently returns an outer `{"text":"..."}` whose `text` value is a JSON-encoded provider object; decode that value once and require a non-empty transcript plus ordered `words` entries with numeric `start` and `end` values in seconds. Treat absent, invalid, or decreasing word timing as a failed timestamped transcription rather than silently substituting another provider or guessed timing.

Gemini is an explicit text-only fallback, not the default ASR. Invoke it only when the user actively asks to verify, check, or correct subtitles/transcript text. Confirm the model is enabled, then name it explicitly; the current request shape is `{"model_name":"gemini-3.1-pro","files":["/absolute/path/interview.mp4"],"extra_params":{"sub_model_type":"asr"}}`. Its untimed `{"text":"..."}` result is a review artifact; never present it as word timing, automatically replace a validated timestamped transcript with it, or run it merely because `scribe-v2` failed.

Audio-text alignment (ATA) is not a separate CLI subcommand. Discover and invoke the live model through the generic model surface:

```bash
"$VIDMUSE_BIN" model list --model doubao_speech/audio_text_alignment -o json
"$VIDMUSE_BIN" model run --param '<complete-ata-request-json>' -o json
```

Require the discovered model name to be exactly `doubao_speech/audio_text_alignment` with subtype `ata`. Its request must contain a caller-supplied exact transcript or locked script in `prompt` and the matching local audio in `files`; omit `generation_type`, `messages`, and unrelated generation controls. Return the complete raw response to `vidmuse-media`. Alignment is an atomic operation for known text plus audio, such as a user-provided spoken script or TTS narration; do not append it automatically to a successful `scribe-v2` transcription.

Before a credit-consuming generation, ensure the chosen model supports the requested operation, that the caller has supplied all material inputs, and that the balance has been checked as above.

A run that fails on insufficient credits mid-batch is the expensive failure: earlier beats are already paid for and the film is unfinishable. Surface the balance before the batch, not after the provider rejects a call. A successful media generation returns public result URLs; return those URLs to `vidmuse-media` or the owning workflow for download and provenance recording.

Use `model run --async` only when the owning workflow needs to continue local work while generation runs. Preserve the returned Aion task ID, then resolve that exact task with `model result <taskId> -o json`; do not submit the paid request again merely because the async invocation has no result URLs yet.

Use `tool run <toolName> --param '<json-object>' -o json` only for a tool name and complete argument object supplied by the owning workflow or live VidMuse documentation. The CLI does not expose a tool catalog, so do not guess tool names or arguments from the command surface.

The supported atomic music-analysis call is:

```bash
"$VIDMUSE_BIN" tool run analyze_music \
  --param '{"audio_path":"/absolute/path/music.mp3"}' -o json
```

Return its complete JSON result to `vidmuse-media`; do not turn analysis into an editorial decision or couple it to transcription, alignment, music generation, or timeline assembly.

## Style discovery

Style reads are free and do not require a balance check. Use the live catalog whenever an owning workflow needs a visual-style recommendation or an exact style receipt:

```bash
"$VIDMUSE_BIN" style list --scope all --view summary --limit 200 -o json
```

Use `--scope official` or `--scope user` only when the caller explicitly narrows the source. `style list` has no search flag; filter the returned `name` and `tags` locally, or use repeatable exact `--tag` filters. If `total` exceeds the returned page, continue with `--offset` until the caller has the complete requested scope. Never report that no relevant style exists from the default or a truncated page.

Summary entries contain `id`, `name`, `tags`, and `imageUrl`. After the owning workflow shortlists no more than three candidates, inspect each exact entry:

```bash
"$VIDMUSE_BIN" style get <styleId> --view full -o json
```

The full result contains the stable receipt fields used by film workflows: `id`, `name`, `scope`, `tags`, `imageUrl`, `description`, `analysis`, and `promptSample`. Return those fields unchanged. Do not turn `promptSample` into a film direction, decide which candidate wins, or treat a preview as user approval; those remain the owner's judgment.

Use `--fields` only when a caller explicitly needs a smaller response. Do not invent `style search`, style-creation commands, or undocumented filter values.

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

- Own binary resolution, command syntax, authentication mechanics, execution, result parsing, balance reads, and cost arithmetic from live `priceItems`.
- Do not decide story, cut points, packaging density, visual direction, asset need, model choice strategy, or timeline content.
- Do not decide what to cut when credits are short, and do not spend up to the balance because it happens to be sufficient. Report balance, estimate, and shortfall; the owning workflow decides.
- Do not invent undocumented flags. Re-read live help when a command rejects an argument.
- Do not expose credentials, treat stderr as clean structured data, or report success from a zero-byte/missing output.
