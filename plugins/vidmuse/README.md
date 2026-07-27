# VidMuse Agent Plugin

The VidMuse plugin connects [Codex](https://openai.com/codex) to [VidMuse](https://vidmuse.ai) so you can turn speaking footage, scripts, and product briefs into designed motion films with AI assistance.

Use it to package talking-head or interview clips, build explainers and promos from a script with no source footage, generate assets and paper-collage B-roll, align word-level captions to real speech, preview everything on a multi-track VidMuse Timeline, and export.

Two product skills cover all workflows:

- `/vidmuse-recut` — you already have a person speaking on camera (talking-head, interview, podcast, product explainer).
- `/vidmuse-create` — there is no speaking plate (knowledge explainers, website and product promos, script + TTS films, Vox-style collage B-roll).

Both share the same taste system and deliver through VidMuse Timeline (`vidmuse serve`): picture, overlays, narration, and word-level captions — not a baked MP4-only handoff.

## What Is Included

- `.codex-plugin/plugin.json` — Codex plugin metadata.
- `skills/vidmuse-recut/` — product skill for existing speaking footage.
- `skills/vidmuse-create/` — product skill for films without source footage.
- `skills/` (everything else) — domain skills (motion, media, HyperFrames, GSAP) that load automatically when the agent needs them.
- `assets/` — shared icon and logo.
- `SKILLS.md` — full skill list for maintainers.
- `scripts/package-codex-plugin.mjs` — plugin packaging script.

End users only need the two product skills. The rest loads on demand.

## Requirements

- macOS on Apple Silicon.
- Codex with plugin support.
- Node.js 22+, ffmpeg / ffprobe, and Python 3.
- A [VidMuse](https://vidmuse.ai) account and the VidMuse CLI on your `PATH`.
- Optional: network access so the agent can run `npx hyperframes` when a project needs HTML motion layers.

## Install

```bash
codex plugin add vidmuse@personal
```

Or install from the ChatGPT desktop app: Plugins → Personal → VidMuse → Install. Then open a new thread in your project workspace, not inside the plugin folder.

Run first-time host setup once from the installed plugin:

```bash
bash skills/vidmuse-recut/scripts/setup.sh
```

`setup.sh` checks host tools and, if needed, installs the bundled `vidmuse` CLI from `skills/vidmuse-recut/assets/vendor/vidmuse-cli/`.

## Authentication

```bash
vidmuse login
vidmuse profile get
```

Model calls (TTS, alignment, image and video generation), timeline cloud features, and export all use this session. No separate API key file is required once `vidmuse login` succeeds.

## Example Prompts

- `Package this talking-head video with designed graphic overlays: ~/Movies/talk.mp4 — script: …`
- `Director-mode recut of my interview into a short launch-film piece.`
- `Make a 60s knowledge explainer from this script (no camera footage).`
- `Promo film for this website — no talking-head clip.`
- `Vox-style paper-collage B-roll for this VO line: …`

Finished work lands in the session workspace, never in the plugin directory.

## Repository

```
https://github.com/SandAI-org/vidmuse-plugin.git
```

For maintainers: `npm run validate:skill` checks skills, and `npm run package:codex-plugin` builds `dist/vidmuse-plugin.zip` from git HEAD. See [SKILLS.md](./SKILLS.md) to refresh vendored domain skills. Current plugin version: **0.3.12** (see `.codex-plugin/plugin.json`).

## License

UNLICENSED — VidMuse internal / controlled distribution. Some bundled third-party skill packs keep their upstream licenses (see their trees under `skills/`).

## Support

- Product: [vidmuse.ai](https://vidmuse.ai)
- Contact: [hello@vidmuse.ai](mailto:hello@vidmuse.ai)
