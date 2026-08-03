# play, render, publish

Play, render, and share commands. VidMuse does not use this reference to start HyperFrames Studio, preview, or its timeline UI.

## play (lightweight player)

```bash
npx hyperframes play                  # current project, port 3003
npx hyperframes play ./my-video       # specific project
npx hyperframes play --port 8080      # custom port
```

`play` serves the composition through the embeddable `<hyperframes-player>` web component without the Studio editor or timeline panels. Use it only when a lightweight playback link is explicitly useful; it is not part of the default VidMuse validation loop.

The player's `playback-rate` attribute is clamped to `[0.1, 5]`; values `≤ 0` or non-finite fall back to `1`. This is a playback knob, not a composition `data-*` attribute — authored motion still renders at `1×`.

To use an explicit Chromium-compatible browser, pass `--browser-path` and a throwaway `--user-data-dir`. Add `--remote-debugging-port` only when an external CDP client is required.

## render

> Render only after the user has reviewed representative snapshots and approved. Don't auto-render when the checks pass.

```bash
npx hyperframes render                                # standard MP4 from cwd
npx hyperframes render ./my-video --output ./out.mp4  # render from outside the project dir
npx hyperframes render --output final.mp4             # named output (no timestamp)
npx hyperframes render -c compositions/intro.html -o intro.mp4  # render a specific sub-composition file
npx hyperframes render --quality draft                # fast iteration
npx hyperframes render --fps 60 --quality high        # final delivery
npx hyperframes render --format webm                  # transparent WebM
npx hyperframes render --docker                       # byte-identical
```

> Default `--output` is `renders/<project-name>_<YYYY-MM-DD>_<HH-MM-SS>.<ext>` — timestamped per render so successive runs don't clobber each other. Pass `--output` to get a stable name.

| Flag                                 | Options                                                                                            | Default                        | Notes                                                                                                                                                                                                                                                                                    |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dir` (positional)                   | path                                                                                               | cwd                            | Project directory. Omit to use current working directory.                                                                                                                                                                                                                                |
| `--composition`, `-c`                | path to composition file                                                                           | `index.html`                   | Render a specific composition file (e.g. `compositions/intro.html`) instead of the project's `index.html`.                                                                                                                                                                               |
| `--output`, `-o`                     | path                                                                                               | `renders/<project>_<ts>.<ext>` | Output path. Default is timestamped (`<project-name>_YYYY-MM-DD_HH-MM-SS.<ext>`).                                                                                                                                                                                                        |
| `--fps`                              | 24, 30, 60                                                                                         | 30                             | 60fps doubles render time                                                                                                                                                                                                                                                                |
| `--quality`                          | draft, standard, high                                                                              | standard                       | draft for iterating                                                                                                                                                                                                                                                                      |
| `--format`                           | mp4, webm, mov, gif, png-sequence                                                                  | mp4                            | WebM/MOV render with transparency; gif for inline autoplay in GitHub PRs/READMEs/docs (two-pass palette encode, fps capped at 30 — prefer `--fps 15` — no audio, 1-bit transparency only, HDR falls back to SDR); png-sequence writes RGBA frames to a directory (AE/Nuke/Fusion ingest) |
| `--gif-loop`                         | 0-65535                                                                                            | 0                              | GIF loop count; `0` loops forever. Only with `--format gif`.                                                                                                                                                                                                                             |
| `--resolution`                       | landscape, portrait, landscape-4k, portrait-4k, square, square-4k (+ aliases `1080p`, `4k`, `uhd`) | —                              | Supersample via Chrome `deviceScaleFactor`. Aspect ratio must match composition; scale must be an integer. Not with `--hdr`.                                                                                                                                                             |
| `--crf`                              | 0-51                                                                                               | —                              | Encoder CRF (lower = higher quality). Mutually exclusive with `--video-bitrate`.                                                                                                                                                                                                         |
| `--video-bitrate`                    | e.g. `10M`, `5000k`                                                                                | —                              | Target bitrate. Mutually exclusive with `--crf`.                                                                                                                                                                                                                                         |
| `--hdr`                              | flag                                                                                               | off                            | Force HDR output even with SDR sources. MP4 only.                                                                                                                                                                                                                                        |
| `--sdr`                              | flag                                                                                               | off                            | Force SDR even with HDR sources.                                                                                                                                                                                                                                                         |
| `--workers`                          | number or `auto`                                                                                   | auto                           | Each worker spawns Chrome (~256 MB)                                                                                                                                                                                                                                                      |
| `--docker`                           | flag                                                                                               | off                            | Reproducible output across hosts                                                                                                                                                                                                                                                         |
| `--gpu`                              | flag                                                                                               | off                            | GPU-accelerated FFmpeg encoding (NVENC / VideoToolbox / VAAPI / QSV)                                                                                                                                                                                                                     |
| `--browser-gpu` / `--no-browser-gpu` | flag                                                                                               | auto (local), off (docker)     | Host GPU for Chrome/WebGL capture                                                                                                                                                                                                                                                        |
| `--browser-timeout`                  | seconds (0.001–86400)                                                                              | 60                             | Puppeteer page-navigation timeout for the entry HTML. Raise when heavy compositions (many videos / fonts / remote assets) can't reach `domcontentloaded` within the 60s default.                                                                                                         |
| `--quiet`                            | flag                                                                                               | off                            | Suppress verbose output                                                                                                                                                                                                                                                                  |
| `--strict`                           | flag                                                                                               | off                            | Fail on lint errors                                                                                                                                                                                                                                                                      |
| `--strict-all`                       | flag                                                                                               | off                            | Fail on lint errors AND warnings                                                                                                                                                                                                                                                         |
| `--variables`                        | JSON object                                                                                        | —                              | Override values declared in `data-composition-variables`                                                                                                                                                                                                                                 |
| `--variables-file`                   | path                                                                                               | —                              | JSON file with variable values (alternative to `--variables`)                                                                                                                                                                                                                            |
| `--strict-variables`                 | flag                                                                                               | off                            | Fail render on undeclared keys or type mismatches in `--variables`                                                                                                                                                                                                                       |

**Quality guidance:** `draft` while iterating, `standard` for review, `high` for final delivery.

**Parametrized renders:** the composition declares its variables on the `<html>` root with **`data-composition-variables`** — a JSON **array of declarations** (`{id, type, label, default}` per entry) that defines the schema. Scripts inside read the resolved values via `window.__hyperframes.getVariables()`. The CLI `--variables '{"title":"Q4 Report"}'` is a JSON **object keyed by id** that overrides those declared defaults for one render; missing keys fall through, so the same composition runs unchanged in snapshots and production. Sub-comp hosts can also override per-instance with `data-variable-values`. See the `hyperframes-core` skill for the full pattern.

### feedback (report after rendering)

After a render is verified, send one feedback line per task. This is the maintainers' primary signal — a render that finishes silently tells them nothing.

```bash
npx hyperframes feedback --rating 10                              # clean run, no notes
npx hyperframes feedback --rating 6 --comment "bg <video> renders grey in multi-scene; worked around with --format png-sequence"
```

`--rating` is an integer from 0-10 (required); `--comment` is free text. Feedback is anonymous and attaches a `doctorSummary` (OS/Node/CPU/mem/ffmpeg) automatically, so don't repeat those fields. A clean run needs only a short result. Before sending any bug, workaround, or confusing behavior, collect this compact reproduction packet:

```text
REPRO COMMAND: <HF_*/PRODUCER_* env> npx hyperframes <exact command>   # run from the project directory; do NOT paste absolute paths
EXPECTED / ACTUAL: <expected behavior> / <observed behavior and isolated trigger>
EXACT ERROR: <verbatim error or warning; include frame/timestamp for visual defects>
OUTCOME: <output correct | output corrupt | fallback succeeded | hard exit | command hung>
WORKAROUND: <exact workaround, or none>
COMPOSITION_STRUCTURE:
  elements: video=<n> audio=<n> img=<n> svg=<n> canvas=<n> subComps=<n>
  attributes: <comma-joined subset of clip-path, filter, mix-blend-mode, transform, mask, position:fixed, overflow:hidden, z-index, data-has-audio, data-duration, data-start, data-composition-src, background-image:url, mask-image:url — or "(none present)">
  timeline: <flat | nested (<n> sub-comps)>; driver=<gsap | data-timeline | gsap+data-timeline | none>
  delta: <what differs between the working workaround-render and the broken default render>
  defect: <spatial location + frame index range, e.g. top-left / frames 0-30 — omit for non-visual defects>
```

`COMPOSITION_STRUCTURE:` is a privacy-preserving structural anatomy: counts + presence flags only, no file paths, no src URLs, no user text. It lets maintainers pattern-match the report against known bug families (e.g. "sub-comp mount + clip-path", "GSAP timeline + z-index") without receiving the composition ZIP. Required for any rating ≤ 7 that describes a visual defect (black frame, flicker, corrupt output, wrong frame, blank output, other visual anomaly); optional but appreciated on higher ratings. Agents on this skill can auto-fill the block by calling `buildCompositionCensus(html)` and `renderCompositionCensusBlock(census)` from `packages/cli/src/utils/compositionCensus.ts` against the composition HTML they already have access to — the human user does not fill this out by hand.

**Feedback is submitted to a public channel — anonymize before sending.** Redact absolute paths (which leak user home directory + machine identity), any user or project names embedded in paths, secrets, and credentials. Path arguments in the command should stay relative to the project directory (`./renders/out.mp4`, not `/Users/<user>/Documents/…/out.mp4`; `.hf-tmp/`, not `/home/<user>/projects/<real-name>/.hf-tmp/`). Similarly strip absolute paths from `EXACT ERROR:` stack traces and log excerpts — keep the file basename and line number, drop the leading directory. Preserve flags and relevant `HF_*` / `PRODUCER_*` variables verbatim. If the failure no longer reproduces, include the last failing command and log excerpt (redacted the same way). Share a project link only when one is already available and safe to share.

The `hyperframes feedback` command soft-warns when a non-10 `--comment` is missing `REPRO COMMAND:`, and when a rating-≤-7 visual-defect comment is missing `COMPOSITION_STRUCTURE:`. The warnings print above the submission ack and do not block — some legitimate reports (a one-line "cloudrun quota bumped yesterday, fine now") won't fit the mold. Fix the packet and rerun to silence them.

Hit a reproducible bug? Add `--file-issue` (optionally `--dir <project>` and `--yes` for non-interactive shells) to also publish a minimal repro to a public URL and open a pre-filled GitHub `bug` issue draft for a maintainer to file. This publishes the project publicly, so it is opt-in and consent-gated; the issue is never auto-submitted.

## publish

```bash
npx hyperframes publish              # upload current project, return public URL
npx hyperframes publish ./my-video   # specific project
npx hyperframes publish --yes        # skip the confirmation prompt (scripts/CI)
```

Uploads the project's source (HTML + assets) and returns a stable public URL that renders in the browser. Use this for sharing a draft for review before rendering MP4, or for embedding the composition elsewhere. Lint findings are surfaced before upload but do not block.
