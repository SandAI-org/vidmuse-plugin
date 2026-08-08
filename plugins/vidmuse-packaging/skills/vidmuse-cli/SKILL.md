---
name: vidmuse-cli
description: "Operate the official VidMuse command-line interface for authentication, profiles, credit balance and cost estimation, models, supported tools, generated assets, voices, styles, memories, threads, messages, and VidMuse DSL preview or rendering. Load whenever another VidMuse skill needs to invoke the CLI, install it when missing, authenticate a production account, or determine what a generation will cost against the user's balance. The plugin carries no CLI executable; use the official installer and the production service. Do not make film, editorial, design, placement, or asset-planning decisions."
---

# VidMuse CLI

Be the command authority for the `vidmuse` binary. Execute a decision already made by the calling skill and return structured results, identifiers, paths, or actionable failures.

## Resolve or install the CLI

This plugin carries rules, not a VidMuse executable. Never search the skill directory, plugin cache, another project's files, or historical backups for a CLI binary.

Resolve an existing installation from `PATH` first:

```bash
VIDMUSE_BIN="$(command -v vidmuse 2>/dev/null || true)"
```

If it is missing, install the latest official release with the public installer and capture the absolute installed path it prints:

```bash
VIDMUSE_BIN="$(curl -fsSL https://vidmuse.sandcdn.com/cli/install.sh | bash)"
```

The installer owns supported OS/architecture detection, downloads the matching release, verifies its published SHA-256 checksum, selects a writable installation directory, and prints the final executable path. Do not use `sudo`, relocate the result, copy it into the plugin or project, or edit shell startup files. If `curl` is unavailable, report that prerequisite instead of substituting an untrusted download source. If installation fails or the returned path is not executable, preserve the installer's stderr and report the exact failure.

Before first use in a run, require a non-empty executable `VIDMUSE_BIN`, then verify startup against production:

```bash
test -n "$VIDMUSE_BIN" && test -x "$VIDMUSE_BIN"
env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" --version
env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" --help
```

Live help is authoritative for command syntax and capabilities. Use an explicitly supplied binary path when the user requests one. Run `vidmuse update` only when the user asks to update or a required capability is absent from an older installed build; the missing-CLI path above already installs the latest release.

## Production environment

Every VidMuse invocation in this skill and every calling skill must target the production service explicitly:

```bash
env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" <command>
```

Do not trust an ambient `VIDMUSE_BASE_URL`: it may point to development or staging. Do not persist the production value in `.zshrc`, `.bashrc`, or another user configuration file; the process-local prefix prevents this workflow from altering the user's other environments. Never authenticate against `vidmuse-dev.sandaii.cn` or another non-production host unless the user explicitly changes the task's target environment.

## Minimal workflow

1. Resolve or install the CLI, then verify the executable.
2. Prefix every command with `env VIDMUSE_BASE_URL=https://vidmuse.ai`.
3. Run `env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" <command> --help` before using an unfamiliar subcommand or flag. Treat live help as authoritative over remembered syntax.
4. Check the production account only for network-backed commands. Check local runtime dependencies only for `serve` or `render`.
5. Execute the narrowest command that satisfies the caller's request.
6. Verify exit status and expected output before parsing stdout or reporting success.
7. Return stdout data, created identifiers, local paths, and concise stderr diagnostics to the calling skill.

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

Use `env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" profile get -o json` as the non-destructive production-account check. Never print, copy, or inspect token values, and do not echo the profile email in progress or final responses. The CLI resolves authentication itself from its protected local config for the selected service.

When login is required, prefer the agent-friendly device flow:

```bash
env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" login --device --start
# User opens the returned URL and approves.
env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" login --device --complete
```

Stop and return the production approval URL and device code when user action is required. After approval, complete the flow and rerun the production `profile get` check. Run `logout`, memory mutations, thread creation/use, or message sending only when the user's request or the calling workflow authorizes that external state change.

## Credits and cost preflight

Reading the balance is free, is never a paid call, and is the only honest basis for a cost warning:

```bash
env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" plan get -o json
```

It returns `credits` as the spendable balance, plus `planName`, `hasActivePlan`, `nextRenewTime`, and a `creditDetails` array whose entries carry `creditAmount`, `creditType`, and `expireTime`. Report the `credits` total; do not sum `creditDetails` yourself, and do not echo the email from `profile get`.

Estimate cost from the chosen model's live `priceItems` rather than a remembered rate. Each item has a `unit_type`, an optional `properties` filter, and `price.output` in credits per unit:

| `unit_type` | estimate |
| --- | --- |
| `seconds` | `duration_seconds × price.output` |
| `images` | `image_count × price.output` |
| `audios` | `expected_audio_count × price.output` |
| `30 seconds` | `ceil(audio_seconds / 30) × price.output` |

Match `properties` to the request you are actually sending — `resolution`, and `audio` on models that price sound separately. An item with no `properties` is the fallback default, not a cheaper option.

Do not assume price rises with resolution. On `minimax/hailuo-h3` today, 1080p costs 11 credits/second while 720p costs 12, so the higher tier is the cheaper one; on `seedance-2.0-pro` 1080p is 50 against 720p's 20. Read both before recommending a tier.

Check the balance before the first paid call of a run, and again before any batch whose estimate is a large fraction of what is left. When the estimate is close to the balance, also read `creditDetails[].expireTime`: a balance that covers the run today may not cover it next week.

When the balance cannot be read, treat it as unknown. Report the estimate and the failure, and let the owning workflow decide — never invent a balance, and never let an unreadable balance silently become either a green light or a refusal.

Some callable service routes, including an ASR route that is not exposed in the public model catalog, may have no discoverable `priceItems`. In that case, say before execution that the estimate is unavailable; do not borrow a provider's dollar price, invent a Credits conversion, or extrapolate a permanent rate from one previous run. When the user authorizes the paid call, record the production balance immediately before and after it and report the actual Credits delta as an execution receipt.

When the balance is short, return the numbers and this link, once:

> https://vidmuse.ai/en/pricing

Then hand the shortfall back to the caller. Deciding what to build within a budget is the owning workflow's judgment, not this skill's: do not shrink a request, drop a stage, downgrade a resolution, or abandon a run here, and do not treat a sufficient balance as authorization to spend.

## Model execution

Discover compatible models first with `model list` filters. Pass exactly one complete Aion request JSON object through `model run --param`; do not rename, infer, or translate request fields.

```bash
env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" model run --param '<complete-json-object>' -o json
```

For video, use the canonical generation types `text_to_video`, `image_to_video`, `images_to_video`, `reference_to_video`, or `avatar`. Audio uses `text_to_audio`, `text_to_music`, `text_to_speech`, or `sound_effect`. Image requests omit `generation_type`; local paths in supported media fields are uploaded by the CLI.

Send `generation_type` on every audio request rather than relying on the documented `text_to_audio` default, and send it even when the model reports `required_params: {}` — the voice models do, and they still reject a request without it. A rejected Aion request surfaces as `API error (HTTP 502)` wrapping `aion api returned status 400`, with no indication of which field is wrong; report that shape verbatim instead of inferring an outage or retrying unchanged.

### Suno music requests

When an owning workflow requests an original Suno song:

1. Run `model list --audio -o json` and return the compatible live entries whose model name begins with `suno/` and whose subtype is music. Do not use an old “latest” label when a newer compatible catalog entry exists.
2. Inspect the selected entry's live description, required parameters, options, price items, and current command help before forming the request. The catalog currently exposes `suno/V5_5` as well as earlier models, but availability and supported controls are live facts.
3. Send `generation_type: "text_to_music"` and `customMode: true` when the selected model requires Custom Mode. Keep the model's exact field separation: `style` carries musical direction; `prompt` carries section metatags and lyrics; `title` names the song. Use `vocalGender`, `styleWeight`, duration, exclusions, or any other optional control only if that exact field is exposed for the selected model.
4. Do not invent a raw request from these semantic names alone. Pass the complete JSON object using the nesting and field names returned by the live model metadata or VidMuse documentation. If the schema cannot be resolved, return that gap to the owner before spending credits.
5. Compute cost with the live `audios` price item and the actual expected output count. A successful run may return multiple public audio URLs; preserve them all and return them with the exact model/request receipt for localization and user selection.

Suno prompt authorship, lyrics, creative tradeoffs, candidate selection, and whether the MV covers a full song or an excerpt remain the owning workflow's decisions. This skill validates and executes the chosen request only.

Text-to-speech also needs a voice selector, and `voice_id` values are model-specific:

```bash
env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" voice list -o json --limit 200
env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" voice search -q "news anchor" -o json
env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" voice get <voiceId> -o json
```

`voice list` and `voice search` default to a page size of 20; pass `--limit` before reporting that a language has no voices. For `minimax/speech-2.6-hd`, pass the id under the entry's `model_ids["minimax/speech-2.6-hd"]`, not the catalog `voice_id`. Successful voice runs return a bare JSON array of public URLs with no task id.

ASR is a special request and must contain exactly one local audio/video file or one public HTTP(S) audio URL. Use `scribe-v2` by default:

```json
{"model_name":"scribe-v2","files":["/absolute/path/interview.mp4"],"extra_params":{"sub_model_type":"asr"}}
```

Do not include `prompt`, `messages`, language, timestamp, diarization, or generation controls unless current live help or model metadata explicitly adds such a field. Preserve the complete stdout before parsing it. A successful production response may contain only an outer `{"text":"..."}` with plain transcript text; it may also contain a JSON-encoded provider object. Decode the `text` value once only when it is valid JSON. Require non-empty transcript text. When explicit `words` with numeric `start` and `end` values exist, validate their order and preserve them; when they do not, report transcription as successful but untimed. Never promise word timestamps, fabricate timing, or mislabel untimed text as a timestamped transcript.

Gemini is an explicit text-only fallback, not the default ASR. Invoke it only when the user actively asks to verify, check, or correct subtitles/transcript text. Confirm the model is enabled, then name it explicitly; the current request shape is `{"model_name":"gemini-3.1-pro","files":["/absolute/path/interview.mp4"],"extra_params":{"sub_model_type":"asr"}}`. Its untimed `{"text":"..."}` result is a review artifact; never present it as word timing, automatically replace a validated timestamped transcript with it, or run it merely because `scribe-v2` failed.

Audio-text alignment (ATA) is not a separate CLI subcommand. Discover and invoke the live model through the generic model surface:

```bash
env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" model list --model doubao_speech/audio_text_alignment -o json
env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" model run --param '<complete-ata-request-json>' -o json
```

Require the discovered model name to be exactly `doubao_speech/audio_text_alignment` with subtype `ata`. Its request must contain exact accepted transcript text or a locked script in `prompt` and the matching local audio in `files`; omit `generation_type`, `messages`, and unrelated generation controls. Return the complete raw response to `vidmuse-media`. Alignment is an atomic, separately priced operation for known text plus audio, such as a user-provided spoken script or TTS narration. If `scribe-v2` returned untimed text and word timing is required, return that gap first; run alignment only after the owning workflow or user accepts the ASR text as the exact alignment text and authorizes the separate cost. Do not append it automatically to a successful `scribe-v2` transcription.

Before a credit-consuming generation, ensure the chosen model supports the requested operation, that the caller has supplied all material inputs, and that the balance has been checked as above.

A run that fails on insufficient credits mid-batch is the expensive failure: earlier beats are already paid for and the film is unfinishable. Surface the balance before the batch, not after the provider rejects a call. A successful media generation returns public result URLs; return those URLs to `vidmuse-media` or the owning workflow for download and provenance recording.

Use `model run --async` only when the owning workflow needs to continue local work while generation runs. Preserve the returned Aion task ID, then resolve that exact task with `model result <taskId> -o json`; do not submit the paid request again merely because the async invocation has no result URLs yet.

Use `tool run <toolName> --param '<json-object>' -o json` only for a tool name and complete argument object supplied by the owning workflow or live VidMuse documentation. The CLI does not expose a tool catalog, so do not guess tool names or arguments from the command surface.

The supported atomic music-analysis call is:

```bash
env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" tool run analyze_music \
  --param '{"audio_path":"/absolute/path/music.mp3"}' -o json
```

Return its complete JSON result to `vidmuse-media`; do not turn analysis into an editorial decision or couple it to transcription, alignment, music generation, or timeline assembly.

## Style discovery

Style reads are free and do not require a balance check. Use the live catalog whenever an owning workflow needs a visual-style recommendation or an exact style receipt:

```bash
env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" style list --scope all --view summary --limit 200 -o json
```

Use `--scope official` or `--scope user` only when the caller explicitly narrows the source. `style list` has no search flag; filter the returned `name` and `tags` locally, or use repeatable exact `--tag` filters. If `total` exceeds the returned page, continue with `--offset` until the caller has the complete requested scope. Never report that no relevant style exists from the default or a truncated page.

Summary entries contain `id`, `name`, `tags`, and `imageUrl`. After the owning workflow shortlists no more than three candidates, inspect each exact entry:

```bash
env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" style get <styleId> --view full -o json
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
- In supported current CLI builds, Serve includes a visual Style catalog behind the top-right **Styles** palette control. Confirm the installed build exposes the relevant Serve and Style behavior through live help rather than pinning the workflow to a vendored version. The panel loads visual cards for official and user Styles, supports local search and Live Action / 3D / Stop Motion / Mixed Media filters, shows the selected Style's preview and full descriptive fields, and offers **Copy for Agent** plus **Copy Style ID**. Read-only mode permits browsing and copying because neither action mutates `dsl.json`.
- When an owning workflow declares a pre-generation Style-selection checkpoint, serve its minimal validated DSL even if the Timeline currently contains only the locked master audio. Tell the user exactly where the **Styles** control is and ask them to return the copied Agent reference or Style ID. The copied Agent reference contains the name, ID, tags, description, prompt sample, and preview image URL; preserve the URL as receipt data but do not render it in chat as an image, thumbnail, or substitute gallery.
- Serve **Styles** is the visual selection surface. `style list` / `style get` remain Agent discovery and receipt tools, not a chat-based visual picker. If the Serve catalog cannot load, return the failure without changing the DSL and leave visual selection unresolved; do not fall back to remote preview links, thumbnails, or broken image boxes in chat. Do not claim that opening a card applies the Style to media or Timeline content.
- Try the default port first. If it is already occupied, do not terminate another process; find a confirmed free loopback port, pass it with `--port`, and report the actual URL.

For `render`:

- Require Node.js 22+, FFmpeg, and ffprobe. Use `NODE_BIN`, `FFMPEG_BIN`, `FFPROBE_BIN`, `HYPERFRAMES_BIN`, or `PYFTSUBSET_BIN` only when supplied or discovered safely.
- Prefer an explicit new output path: `.mp4` for `--mode full`, `.webm` for `--mode overlay`.
- Preserve the DSL canvas and source frame rate unless the caller explicitly requests `--resolution` or `--fps`.
- Use `--quality draft|standard|high` according to the caller's review or delivery intent.
- Verify the output exists, has nonzero size, and matches the requested container before returning it.

Do not start `serve` as an implicit preview after rendering. Start it when requested by the user or required by an owning workflow; a required post-transcription checkpoint is explicit workflow authorization.

## Boundaries

- Own CLI resolution or official installation, production endpoint pinning, command syntax, production-account authentication, execution, result parsing, balance reads, and cost arithmetic from live `priceItems`.
- Do not decide story, cut points, packaging density, visual direction, asset need, model choice strategy, or timeline content.
- Do not decide what to cut when credits are short, and do not spend up to the balance because it happens to be sufficient. Report balance, estimate, and shortfall; the owning workflow decides.
- Do not invent undocumented flags. Re-read live help when a command rejects an argument.
- Do not expose credentials, treat stderr as clean structured data, or report success from a zero-byte/missing output.
