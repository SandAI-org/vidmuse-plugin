# info, upgrade, compositions, docs, benchmark, telemetry

Catch-all reference for commands that don't fit the main dev loop.

## info

```bash
npx hyperframes info                   # project metadata
npx hyperframes info ./my-video        # specific project
npx hyperframes info --json
```

Prints **project** metadata: name, resolution, duration, element counts by type,
track count, and total project size. Project-level — not environment. For
VidMuse media/environment health use `/media-use`
`scripts/resolve.mjs --doctor`. Use HyperFrames doctor only for a concrete
HyperFrames browser or render-runtime failure.

## upgrade

```bash
npx hyperframes upgrade                # check + interactive prompt
npx hyperframes upgrade --check        # check and exit, no prompt (agent-friendly)
npx hyperframes upgrade --check --json # machine-readable: current / latest / updateAvailable
npx hyperframes upgrade --yes          # print upgrade commands without prompting
```

Compares the installed CLI version against npm latest.

`--project [dir]` bumps a **project's** pinned scripts instead of the global install: it rewrites every `npx …hyperframes@<version>…` in `<dir>/package.json` (default cwd) to npm-latest. Always invoke it unpinned (`npx hyperframes@latest upgrade --project`) — a project scaffolded on an old CLI stays frozen otherwise. `--project . --check` reports the delta without writing; add `--json` for `{ changed, from, to, path }`. Pass the dir explicitly whenever another flag follows `--project` — on older releases a bare `--project` consumes the next flag as its directory value.

## compositions, docs

```bash
npx hyperframes compositions           # list compositions in project
npx hyperframes compositions --json
npx hyperframes docs                   # list available topics
npx hyperframes docs rendering         # print one topic inline in the terminal
```

`compositions` lists every `data-composition-id` in the project (including sub-comps) with duration, resolution, and element count.

`docs` prints inline documentation **in the terminal** — it does not open a browser. Topics: `data-attributes`, `examples`, `rendering`, `gsap`, `troubleshooting`, `compositions`. Run without a topic to see the list.

## benchmark

```bash
npx hyperframes benchmark              # run the preset matrix in current project
npx hyperframes benchmark ./my-video   # specific project
npx hyperframes benchmark --runs 5     # repeat each config N times (default 3)
npx hyperframes benchmark --json
```

Renders the project with 5 preset configurations — `30fps draft 2w`, `30fps standard 2w`, `30fps high 2w`, `30fps standard 4w`, `60fps standard 4w` — and prints a comparison of render speed and output file size. Use it to find the fastest acceptable preset for your machine. Not a single-render-with-stage-breakdown.

## telemetry

```bash
npx hyperframes telemetry status      # show telemetry state
npx hyperframes telemetry disable     # disable anonymous usage telemetry
npx hyperframes telemetry enable      # re-enable telemetry
```

Telemetry is anonymous usage counters only. Disable globally with `HYPERFRAMES_NO_TELEMETRY=1` if env-var control is preferred over the subcommand.

Events include two fingerprint properties used to distinguish managed-sandbox runs from real laptops — no PII, no env-var **values**, only existence checks:

- **`sandbox_runtime`**: `gvisor` / `firecracker` / `docker` / `kvm` / `wsl` / `null`. gVisor via kernel string + `/proc/version`. Firecracker via `/dev/vsock` + DMI sys_vendor. Docker via `/.dockerenv` + cgroup.
- **`agent_runtime`**: `claude_code` / `codex` / `cursor` / `copilot_agent` / `jules` / `replit` / `devin` / `aider` / `gemini_cli` / `hermes` / `openclaw` / `null`. Detected by the existence of well-known vendor env vars; the values themselves are never read.

## Media preprocessing belongs to VidMuse

Do not use HyperFrames media preprocessing commands in this plugin.

- TTS/music/SFX → `/media-use` `audio/scripts/audio.mjs` or
  `scripts/resolve.mjs`, backed by live `vidmuse model list/run`.
- ASR + word timing → `/media-use`
  `scripts/transcribe.mjs <media> --output <transcript.json>`.
- Image edits such as background isolation → resolve a live VidMuse image-edit
  model with the required `image_to_image` route and explicit model parameters.
  If no live model supports the operation, use a deterministic mask/chroma-key
  transform only when the source permits it; do not download a local AI model.

The resulting frozen files can be placed in a composition. HyperFrames stays
focused on authoring, verification, and rendering.
