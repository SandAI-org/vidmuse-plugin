---
name: hyperframes-cli
description: >
  Use the HyperFrames CLI development loop: init, add, catalog, capture, lint, check, snapshot,
  compare, grade-compare, play, present, keyframes, single or batch render, publish,
  cloud, cloudrun, feedback, lambda, doctor, browser, info, upgrade, skills, compositions, docs,
  benchmark, telemetry, and auth. Also use when diagnosing build
  or render failures. validate, inspect, and layout are deprecated aliases; use check. Covers local,
  HeyGen-hosted cloud, AWS Lambda, and Google Cloud Run rendering.
---

# HyperFrames CLI

Run commands as `npx hyperframes ...` unless project instructions provide a wrapper. Obey the wrapper when present. The CLI requires Node.js 22 or newer and FFmpeg.

**VidMuse boundary:** never run `preview`, `beats`, or any command that opens HyperFrames Studio or its timeline UI. Never run HyperFrames `tts`, `transcribe`, `remove-background`, or any option that selects or downloads a HyperFrames-managed AI/media model. Use `vidmuse-media`, `vidmuse-cli`, and `vidmuse-timeline` for those capabilities. GSAP's paused code timeline remains allowed because it is the deterministic render clock, not a UI.

## Development loop

1. **Scaffold:** `npx hyperframes init <project>` or capture a site. In non-TTY mode, pass `--non-interactive --example=<name>`.
2. **Author:** write the composition using `/hyperframes-core`.
3. **Get fast feedback while editing:** run `npx hyperframes lint` after the first HTML pass and after structural changes.
4. **Run the final gate:** run `npx hyperframes check`; it reruns lint before opening the browser. Do not prepend a redundant standalone lint invocation. Add `--snapshots` for annotated overview frames and finding crops.
5. **Inspect sub-compositions:** when `index.html` mounts `data-composition-src`, capture midpoint snapshots and inspect each mounted scene.
6. **Review snapshots:** capture representative timestamps and ask whether to revise or render.
7. **Render only after approval:** use draft quality for iteration and high quality for delivery.
8. **Verify the output:** confirm the file exists, is non-empty, and has a plausible duration.

```bash
# Fast iteration check; repeat while authoring as needed.
npx hyperframes lint

# Required final gate; includes lint.
npx hyperframes check
npx hyperframes snapshot --at 0,2,4
npx hyperframes render --quality high --output out.mp4
test -s out.mp4
ffprobe -v error -show_format out.mp4
```

`check` runs lint first, then uses one browser session and one seek pass to audit runtime errors, failed requests, layout, `*.motion.json` assertions, and WCAG contrast. Persistent findings gate the exit code; transient entrance or exit findings are informational. Use `--strict` to gate warnings. `validate`, `inspect`, and `layout` remain aliases for compatibility but must not appear in new instructions or scripts.

## Sub-composition smoke test

Static audits cannot catch every mount failure. When the project uses sub-compositions, capture at least one visible midpoint for each host slot:

```bash
npx hyperframes snapshot --at <t1>,<t2>,<t3>
```

Treat tiny unstyled content, canvas-sized icons, missing hero elements, or timeline-registration timeouts as render-blocking mount defects. See `hyperframes-core/references/sub-compositions.md` for the corresponding fixes.

## Agent conventions

- Prefer `--json` for agent and CI calls. Server-mode `render` and `play` do not provide ordinary JSON output.
- `doctor --json` always exits zero. Gate on its payload:

  ```bash
  npx hyperframes doctor --json | jq -e '.ok' >/dev/null
  ```

- Non-TTY mode is automatic. `init` requires `--example` there; use `--non-interactive` to force deterministic behavior on a TTY.
- Use one `HYPERFRAMES_RUN_ID` for all commands in the same verification loop.
- Use `--strict`, `--strict-all`, and `--strict-variables` when the corresponding warnings, variables, or CI conditions must gate the render.
- JSON paths redact the home directory as `$HOME`; do not try to reverse the redaction.
- When a hosted cloud project approaches or exceeds the 200 MB upload limit, use `cloud render --dry-run --json` and follow the `.hyperframesignore` investigation in `references/cloud.md`. Never ignore an asset merely because it is large.
- Never render merely because checks pass. Pause after snapshot review and wait for approval.

## Render choices

| Need                                     | Command                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| Fast local iteration                     | `npx hyperframes render --quality draft`                                      |
| Final local delivery                     | `npx hyperframes render --quality high --output out.mp4`                      |
| Reproducible container render            | `npx hyperframes render --docker --strict --output out.mp4`                   |
| Local variable-driven batch render       | `npx hyperframes render --batch rows.json --output "renders/{name}.mp4"`      |
| HeyGen-hosted zero-infrastructure render | `npx hyperframes cloud render`                                                |
| Self-managed distributed AWS render      | `npx hyperframes lambda render <project> --width 1920 --height 1080 --wait`   |
| Self-managed distributed GCP render      | `npx hyperframes cloudrun render <project> --width 1920 --height 1080 --wait` |

Skill attribution is automatic — the examples above need no `--skill`. A project scaffolded by a workflow (`hyperframes init --skill=<workflow>`) records its owning skill in `hyperframes.json`, and every later render inherits it on anonymous telemetry: re-renders, `npm run render`, and `--batch` alike. Pass `--skill=<slug>` explicitly only to stamp a project that was not created through a workflow (its first render then persists it).

Use cloud rendering when the user wants hosted rendering without local Chrome, FFmpeg, or AWS. Use Lambda only when AWS ownership is a requirement. Use Cloud Run only when GCP ownership is a requirement. Read the matching reference before running any cloud path.

After verifying a successful render, send one feedback report unless telemetry is disabled or the user opted out:

```bash
npx hyperframes feedback --rating <0-10> --comment "<specific result or friction>"
```

Keep clean-run feedback concise. For any bug or friction, capture a **reproduction packet** before submitting; do not send only a symptom summary. Include the rerunnable command (relative to the project directory — feedback is submitted to a public channel, so do **not** paste absolute paths, home-directory prefixes, or user/machine identifiers), expected versus actual behavior, exact error (also strip absolute paths from stack traces — keep basename + line, drop the leading directory), whether output completed/fell back/failed, workaround, and repro-project status. For a rating ≤ 7 that describes a visual defect (black frame, flicker, corrupt output, wrong frame, blank output, other visual anomaly), also include a `COMPOSITION_STRUCTURE:` block — a privacy-preserving structural anatomy (element census + attribute presence + timeline shape) so maintainers can pattern-match against known bug families without the composition ZIP. Agents auto-fill this via the composition-census helper; the human user does not fill it by hand. If the issue did not reproduce again, say so and still include the last failing command and logs. Use `--file-issue` only with consent: it publishes a minimal reproduction to a public URL. The required packet format and privacy warning live in `references/preview-render.md`.

## Read the matching reference before running a command

The following references and owning skills are mandatory command contracts, not optional background reading. Before running a command in the table, read its matching row.

| Need                                                                                   | Reference                             |
| -------------------------------------------------------------------------------------- | ------------------------------------- |
| `init`, `capture`, `skills`                                                            | `references/init-and-scaffold.md`     |
| `lint`, `check`, motion sidecars, `snapshot`                                           | `references/lint-validate-inspect.md` |
| `compare`, `grade-compare`, variable-driven `render --batch`                           | `references/compare-and-batch.md`     |
| `play`, `render`, `publish`, feedback                                                  | `references/preview-render.md`        |
| `doctor`, browser management                                                           | `references/doctor-browser.md`        |
| `auth`, HeyGen-hosted cloud rendering, and template variables                          | `references/cloud.md`                 |
| AWS Lambda deployment and rendering                                                    | `references/lambda.md`                |
| Google Cloud Run deployment and rendering                                              | `references/cloudrun.md`              |
| `info`, `upgrade`, `compositions`, `docs`, `benchmark`, telemetry                      | `references/upgrade-info-misc.md`     |

For composition variables, also read `hyperframes-core` → `references/variables-and-media.md`. For `hyperframes add` and `hyperframes catalog`, use `hyperframes-registry`. Before `hyperframes present`, use the relevant VidMuse deliverable workflow; before `hyperframes keyframes`, read `hyperframes-keyframes`. Route TTS, transcription, captions, background removal, and every model choice through `vidmuse-media`.

The specialized commands are deliberately documented by their owning workflows:

```bash
npx hyperframes present <project-dir> --port 3004 --no-open
npx hyperframes keyframes <project-dir> --json
```

`present` serves a navigable deck with presenter and audience synchronization. `keyframes` surfaces seek-safe animation and motion-path diagnostics.
