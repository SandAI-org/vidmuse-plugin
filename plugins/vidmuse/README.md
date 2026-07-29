# VidMuse Agent Plugin

The VidMuse plugin connects [Codex](https://openai.com/codex) to [VidMuse](https://vidmuse.ai) so you can turn speaking footage, scripts, and product briefs into designed motion films with AI assistance.

Use `/vidmuse` as the front door. It can package talking-head or interview
clips, build explainers and promos from a script with no source footage,
perform standalone ASR/TTS and media operations, generate assets and
paper-collage B-roll, align word-level captions to real speech, preview films
on a multi-track VidMuse Timeline, and export.

It routes to the owner of the requested deliverable:

- `/vidmuse` — mandatory entry and intent router.
- `/vidmuse-recut` — you already have a person speaking on camera (talking-head, interview, podcast, product explainer).
- `/vidmuse-create` — the film's primary material must be made (knowledge explainers, website and product promos, script + TTS films, Vox-style collage B-roll).
- `/vidmuse-assets` — proactively scan film semantics or handle explicit
  requests, canonicalize entities, plan and license-check assets, and operate
  the hybrid Core Pack / Creator Library / provider system. Lobe Icons is the
  first built-in AI/LLM Logo Provider; `media-use` performs the underlying
  downloads, generation, transforms, cache, and project freeze.
- `/media-use` — standalone transcription/ASR, ATA, TTS/voiceover, generation,
  trim/reframe/transform, grading, and exact media execution for workflows.

Both share the same taste system and deliver through VidMuse Timeline (`vidmuse serve`): picture, overlays, narration, and word-level captions — not a baked MP4-only handoff.

For non-Vox Create films, production begins only after an agency-style
pre-production pass: verified product/subject truth, a one-proposition brief,
three distinct treatments, real storyboard frames, and a full-duration
approved animatic. A website capture supplies evidence; it is never used as an
automatic shot list.

## What Is Included

- `.codex-plugin/plugin.json` — Codex plugin metadata.
- `skills/vidmuse/` — mandatory intent router and shared runtime policy.
- `skills/vidmuse-recut/` — film workflow for existing speaking footage.
- `skills/vidmuse-create/` — product skill for films without source footage.
- `skills/vidmuse-assets/` — asset intelligence, Semantic Asset Pass, hybrid
  library policy, plan validator/resolver, and framework-only Core Pack.
- `skills/media-use/` — direct media capability and shared execution runtime.
- `skills/` (everything else) — domain skills (motion, HyperFrames, GSAP) that load automatically when the agent needs them.
- `assets/` — shared icon and logo.
- `SKILLS.md` — full skill list for maintainers.

End users enter through `/vidmuse`; direct capability requests can then finish
in `media-use` or `vidmuse-assets` without creating a film workflow.

## Requirements

- macOS on Apple Silicon.
- Codex with plugin support.
- Node.js 22+, ffmpeg / ffprobe, and Python 3.
- A [VidMuse](https://vidmuse.ai) account and the VidMuse CLI on your `PATH`.
- Optional: network access so the agent can run `npx hyperframes` when a project needs HTML motion layers.

All AI media work is dispatched through the authenticated VidMuse CLI:
TTS, music, images, icons, digital-human/video generation, ASR, and word-level
ATA alignment. The plugin does not install or diagnose separate provider CLIs
or local AI runtimes. `ffmpeg` and `ffprobe` remain the local deterministic
media tools.

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
- `Transcribe ~/Movies/talk.mp4 with word timing; do not package the video.`
- `Turn this Chinese paragraph into a female voice and return the audio only.`
- `Director-mode recut of my interview into a short launch-film piece.`
- `Make a 60s knowledge explainer from this script (no camera footage).`
- `Make an AI development-history film; identify and source useful model/company marks automatically.`
- `Promo film for this website — no talking-head clip.`
- `Vox-style paper-collage B-roll for this VO line: …`
- `Find the Codex color logo from Lobe Icons and add it to this project's asset library.`

Finished work lands in the session workspace, never in the plugin directory.

## Repository

```
https://github.com/SandAI-org/vidmuse-plugin.git
```

For maintainers: validate skill folders and the plugin before packaging from git HEAD. See [SKILLS.md](./SKILLS.md) to refresh vendored domain skills. Current plugin version: **0.4.0** (see `.codex-plugin/plugin.json`).

## License

UNLICENSED — VidMuse internal / controlled distribution. Some bundled third-party skill packs keep their upstream licenses (see their trees under `skills/`).

## Support

- Product: [vidmuse.ai](https://vidmuse.ai)
- Contact: [hello@vidmuse.ai](mailto:hello@vidmuse.ai)
