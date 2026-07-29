# Setup — VidMuse CLI and deterministic media tools

## Required

```bash
command -v vidmuse
vidmuse --version
vidmuse profile get -o json
vidmuse plan get -o json
vidmuse model list -o json
ffmpeg -version
ffprobe -version
node --version
```

If VidMuse is missing, run the plugin setup:

```bash
bash <VIDMUSE_PLUGIN>/skills/vidmuse-recut/scripts/setup.sh
```

Authenticate with:

```bash
vidmuse login
vidmuse profile get -o json
```

For a headless session:

```bash
vidmuse login --device --start
# approve the printed URL
vidmuse login --device --complete
```

## Doctor

```bash
node <SKILL_DIR>/scripts/resolve.mjs --doctor
```

Doctor checks:

- VidMuse CLI present and runnable
- VidMuse profile/login
- active plan and remaining credits
- live model catalog
- bundled deterministic SFX assets
- ffmpeg and ffprobe
- Node.js runtime

It deliberately does not check or install HeyGen, HyperFrames, Parakeet,
Whisper, Kokoro, mflux, LTX, MusicGen, Lyria, Codex image generation, or other
provider-specific/local AI stacks.

## Provider rule

VidMuse CLI is the only AI provider boundary. It owns authentication, provider
selection, billing, local media upload, live model discovery, and output URLs.
ffmpeg/ffprobe remain local because cutting, probing, loudness, and format
conversion are deterministic operations rather than AI generation.

`--local-only` means cache/ingest/deterministic processing only. There is no
local AI fallback inside this skill.
