<p align="center">
  <img src="plugins/vidmuse-packaging/assets/icon.png" alt="VidMuse" width="112" />
</p>

<h1 align="center">VidMuse Agent Plugin</h1>

<p align="center">
  Turn ideas, scripts, songs, websites, and speaking footage into designed videos with an AI agent.
</p>

VidMuse is a plugin for ChatGPT, Codex, Cursor, and Claude that gives an agent production workflows for creating, recutting, designing, assembling, reviewing, and rendering video projects. It combines VidMuse generation and Timeline tools with HyperFrames motion composition and a local library of 162 Shotcraft effects.

This repository is both human-readable documentation and an installable marketplace for Codex, Cursor, and Claude. If you are an agent, follow the [Agent installation contract](#agent-installation-contract) exactly.

## What you can make

- Product launches, website films, explainers, and script-led videos
- Recut talking-head, interview, podcast, course, and founder videos
- Generative AI music videos from an uploaded song or a newly generated track
- Reusable IP characters, mascots, avatars, and character-led series
- Vox-style editorial paper-collage films
- Transcripts, narration, music analysis, subtitles, and other media artifacts
- Editable VidMuse Timeline projects and final renders

The plugin also provides visual direction, semantic motion choreography, asset planning, HyperFrames composition, and a bilingual catalog of 162 installable `shot-*` treatments.

## Install

### Requirements

- ChatGPT desktop with Codex, or Codex CLI with plugin support; **or** Cursor ≥ 1.3 with plugin support; **or** Claude Code ≥ 1.5 with plugin support
- Git and internet access for the marketplace snapshot
- A [VidMuse](https://vidmuse.ai) account for production services
- Node.js 22+, FFmpeg, and ffprobe when a workflow needs local preview or rendering

The plugin does not bundle an executable or credentials. When a workflow first needs the VidMuse CLI, its `vidmuse-cli` skill resolves an existing installation or uses the official installer for the latest supported release. Login uses the VidMuse production service and may require a browser/device approval step.

### Install from Codex CLI

```bash
codex plugin marketplace add SandAI-org/vidmuse-plugin --ref main
codex plugin add vidmuse-packaging@vidmuse-plugin
codex plugin list --json
```

The expected identities are:

| Field | Value |
| --- | --- |
| Repository | `SandAI-org/vidmuse-plugin` |
| Git ref | `main` |
| Marketplace | `vidmuse-plugin` |
| Plugin | `vidmuse-packaging` |

If the marketplace is already configured, refresh it before reinstalling or updating:

```bash
codex plugin marketplace upgrade vidmuse-plugin
```

After installation, start a **new task or CLI session**. Plugin skills are loaded into new sessions; the task that performed the installation should not claim that it can already use newly installed skills.

### Install from Codex app

In ChatGPT desktop, open **Plugins**, select the **VidMuse Plugin** marketplace, open **VidMuse Packaging**, and install it. Then start a new task.

If the marketplace is not visible yet, add it with the CLI command above and reopen the app.

### Install in Cursor

```bash
cursor plugin install SandAI-org/vidmuse-plugin
```

Or, from Cursor's **Plugins** panel, paste this repository URL and select **VidMuse Packaging**. After installation, reload the window or open a new workspace — Cursor loads plugin skills at workspace start.

### Install in Claude Code

```bash
claude plugin marketplace add SandAI-org/vidmuse-plugin --name vidmuse-plugin
claude plugin add vidmuse-packaging@vidmuse-plugin
```

The root `.claude-plugin/marketplace.json` name (`vidmuse-plugin`) must match the `marketplace add --name` argument exactly. After installation, start a new Claude Code session; plugin skills are only loaded at session start.

## Install with an agent

Paste this into a new Codex task:

```text
/goal Read https://github.com/SandAI-org/vidmuse-plugin#agent-installation-contract and follow the Agent installation contract exactly. Install vidmuse-packaging from the vidmuse-plugin marketplace on main, verify the installed state, and report the exact result. Do not stop after cloning or reading the repository. If permissions or user action are required, ask for them. Finish by telling me to start a new task and give me one safe first-use prompt that verifies VidMuse is loaded without spending credits.
```

### Agent installation contract

This section is normative for an agent asked to install the plugin.

**Target**

```yaml
repository: https://github.com/SandAI-org/vidmuse-plugin
ref: main
marketplace: vidmuse-plugin
plugin: vidmuse-packaging
marketplace_manifest: .agents/plugins/marketplace.json
plugin_manifest: plugins/vidmuse-packaging/.codex-plugin/plugin.json
```

**Required procedure**

1. Confirm that the host supports plugins. Use ChatGPT desktop with Codex or Codex CLI. Do not claim installation from an unsupported surface.
2. Inspect the configured marketplaces with `codex plugin marketplace list`.
3. If `vidmuse-plugin` is absent, run:

   ```bash
   codex plugin marketplace add SandAI-org/vidmuse-plugin --ref main
   ```

   If it is already present, refresh it with:

   ```bash
   codex plugin marketplace upgrade vidmuse-plugin
   ```

4. Inspect availability with `codex plugin list --available --json`. Confirm that marketplace `vidmuse-plugin` exposes plugin `vidmuse-packaging`.
5. If the plugin is not installed, run:

   ```bash
   codex plugin add vidmuse-packaging@vidmuse-plugin
   ```

6. Run `codex plugin list --json` and verify that `vidmuse-packaging@vidmuse-plugin` is installed and enabled. Base the report on command output, not assumption.
7. Tell the user to start a new task or CLI session before first use. Provide the safe verification prompt below.

**Completion criteria**

- The `vidmuse-plugin` marketplace is configured from this repository's `main` ref.
- `vidmuse-packaging@vidmuse-plugin` is reported as installed and enabled.
- No repository clone is misreported as a plugin installation.
- The user is told that first use must happen in a new task or session.
- Any missing permissions, unavailable host capability, network failure, or authentication requirement is reported explicitly.

**Safe first-use verification**

In the new task, enter:

```text
$vidmuse Route this request only: I have an interview video and want a designed recut. Tell me which VidMuse workflow owns it and what input you need next. Do not create files, sign in, or spend credits.
```

A successful response should route the request to `vidmuse-recut`. After that check, describe the actual video you want to make.

## Use VidMuse

Describe the deliverable in ordinary language. The `vidmuse` router selects one owning workflow and loads focused capabilities as needed. In Codex, you can type `$vidmuse` to invoke the router explicitly. In ChatGPT, type `@` and select VidMuse Packaging when you want to force plugin selection.

Example prompts:

```text
$vidmuse Create a 16:9 product launch film from https://example.com. Start by confirming the audience, destination, and duration.
```

```text
$vidmuse Recut /absolute/path/interview.mp4 into a polished 16:9 founder video with readable captions and evidence-led graphics.
```

```text
$vidmuse Create a complete AI music video from /absolute/path/song.wav. Use the whole song and confirm the treatment before generation.
```

```text
$vidmuse Build a reusable illustrated mascot and use it to make a short knowledge video series.
```

```text
$vidmuse Turn this script into a Vox-style editorial paper-collage film with narration-timed scenes.
```

For local files, provide absolute paths. For paid generation, the workflow should inspect live model pricing and the account balance before asking for authorization to spend credits.

## How routing works

| Your requested result | Owning skill |
| --- | --- |
| Film led by existing speaking footage | `vidmuse-recut` |
| Film from an idea, script, URL, or non-speaking media | `vidmuse-create` |
| Music-led generative film | `vidmuse-mv` |
| Reusable character/IP or IP-led film | `vidmuse-ip` |
| Vox-style paper-collage film | `vidmuse-vox` |
| One transcript, voice, subtitle, or media artifact | `vidmuse-media` |
| Timeline assembly, review, edit, or render | `vidmuse-timeline` |
| Direct account, credits, model, voice, or CLI operation | `vidmuse-cli` |

The router keeps a complete film under one owner. Design, motion, assets, media operations, HyperFrames, Shotcraft, and Timeline are loaded as supporting capabilities rather than competing workflows.

## Authentication, permissions, and credits

- Installing the plugin does not sign you into VidMuse.
- Network-backed VidMuse operations use `https://vidmuse.ai`.
- Login may pause for browser/device approval. The agent must not expose tokens or credentials.
- Reading profile and credit balance is non-destructive.
- Generative media can consume VidMuse credits. A workflow should show a live cost estimate and request authorization before paid execution.
- Local preview servers should stay on loopback unless you explicitly request trusted network access.

## Repository structure

```text
.
├── .agents/plugins/marketplace.json     # Codex marketplace
├── .claude-plugin/marketplace.json      # Claude marketplace
├── plugins/vidmuse-packaging/
│   ├── .codex-plugin/plugin.json        # Codex plugin manifest
│   ├── .cursor-plugin/plugin.json       # Cursor plugin manifest
│   ├── .claude-plugin/plugin.json       # Claude plugin manifest
│   ├── assets/
│   └── skills/                          # shared across Codex, Cursor, Claude
├── CHANGELOG.md
├── LICENSE
└── README.md
```

- `.agents/plugins/marketplace.json` makes this repository an installable Codex marketplace.
- `.claude-plugin/marketplace.json` makes this repository an installable Claude marketplace; it points Claude at `./plugins/vidmuse-packaging`.
- Each host-specific `.codex-plugin/`, `.cursor-plugin/`, `.claude-plugin/` under `plugins/vidmuse-packaging/` describes the same plugin for that host's installer; all three resolve `skills/` to the same directory.
- `skills/vidmuse/SKILL.md` is the top-level deliverable router.
- The remaining skills own individual film workflows and production capabilities.

## Updating or removing

Refresh the marketplace snapshot, then reinstall from the plugin browser or CLI if an updated version is available:

```bash
codex plugin marketplace upgrade vidmuse-plugin
```

To remove the plugin:

```bash
codex plugin remove vidmuse-packaging@vidmuse-plugin
```

To remove the marketplace source as well:

```bash
codex plugin marketplace remove vidmuse-plugin
```

## License

The repository is licensed under the [MIT License](LICENSE). Individual vendored assets or components may carry their own notices and licenses within the relevant skill directories.
