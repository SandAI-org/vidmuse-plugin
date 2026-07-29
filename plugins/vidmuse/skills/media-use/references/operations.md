# Media operations

AI generation belongs to VidMuse CLI. Deterministic file transforms use local
ffmpeg/ffprobe, then register the output with `resolve --from`.

## Cut / trim

```bash
ffmpeg -i in.mp4 -ss 00:00:12 -to 00:00:20 -c copy out.mp4
node <SKILL_DIR>/scripts/resolve.mjs --type video --from out.mp4 --project .
```

## Reframe / crop

```bash
ffmpeg -i in.mp4 -vf "crop=ih*9/16:ih,scale=1080:1920" out.mp4
```

## Stitch

Use an ffmpeg concat list and register the result. Do not use a generative model
for deterministic assembly.

## Transcript-driven cut

First produce VidMuse-timed words:

```bash
node <SKILL_DIR>/scripts/transcribe.mjs --input talk.mp4 --out talk.transcribe.json
```

Then compile exact cuts:

```bash
node <SKILL_DIR>/scripts/transcript-cut.mjs \
  --input talk.mp4 \
  --transcript talk.transcribe.json \
  --remove "12.41-15.02,88.3-91.7" \
  --remove-fillers "um,uh,like" \
  --cut-silence 0.8 \
  --out talk.cut.mp4
```

Use `--plan` before encoding when cuts need review.

## Ducking and loudness

`scripts/audio-duck.mjs` compiles volume keyframes from `audio_meta.json`.
For a standalone export, ffmpeg sidechain compression is appropriate.

Use two-pass `loudnorm`; common targets are -14 LUFS for social video and -16
LUFS for podcasts. Probe the output with ffprobe before delivery.

## AI image, voice, music, and video

Use `resolve` so the live VidMuse catalog, route validation, output freezing, and
provenance remain one path:

```bash
node <SKILL_DIR>/scripts/resolve.mjs --type image --intent "..." --project .
node <SKILL_DIR>/scripts/resolve.mjs --type voice --intent "..." --project .
node <SKILL_DIR>/scripts/resolve.mjs --type bgm --intent "..." --project .
node <SKILL_DIR>/scripts/resolve.mjs --type video --intent "..." --project .
```

Background removal, upscaling, lipsync, translation, or another operation may
only be promised when a matching capability appears in the live
`vidmuse model list` output. Do not fall back to a HyperFrames command,
provider-specific CLI, or a newly installed local AI model.
