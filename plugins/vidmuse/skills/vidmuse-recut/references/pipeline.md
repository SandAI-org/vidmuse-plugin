# Pipeline

Engineering details for probe, extract, stage, assemble, and render. Distilled from upstream `talking-head-recut` (provenance: distilled:talking-head-recut).

## Probe and extract

```bash
VIDEO_PATH="/absolute/path/input.mp4"
WORK_DIR="videos/$(basename "$VIDEO_PATH" | sed 's/\.[^.]*$//')"
mkdir -p "$WORK_DIR"

# metadata — duration / width / height / fps
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate \
  -show_entries format=duration -of json "$VIDEO_PATH" > "$WORK_DIR/metadata.json"

# audio for transcript alignment
ffmpeg -y -i "$VIDEO_PATH" -vn -acodec libmp3lame -q:a 2 "$WORK_DIR/audio.mp3"
```

fps = the `r_frame_rate` fraction evaluated (`30000/1001 → 29.97`).

## Transcript handling

`transcript.json` is a flat array of word objects `[{ "text", "start", "end" }, …]` — no `segments`, no `words` wrapper. Group words into sentences at terminal punctuation and pauses — the alignment response's utterance boundaries are the natural grouping. The text comes from the user; when it mismatches the audio, fix the source text and re-run the alignment; never hand-edit timestamps.

**Clamp to media duration.** Alignment can return the final word's `end` past the actual clip length. Clamp every slot `end` and the composition duration to the `metadata.json` duration, or the render shows a black tail.

## Stage assets and CDN dependencies

```bash
mkdir -p "$WORK_DIR/public/fonts" "$WORK_DIR/public/effects" "$WORK_DIR/public/compositions"
```

Keep pinned Registry runtime/font CDN URLs when selected; record them in
`effect-sources.json` and follow [registry-integration.md](registry-integration.md).
User-supplied or licensed local fonts still live under `public/fonts/` and use
explicit `@font-face` declarations. Do not copy the skill's legacy vendored GSAP
into every project when the selected effects already use the approved pinned CDN.

**Re-encode the source with dense keyframes.** Sources with a sparse GOP (keyframe interval > ~1 s) freeze on seek in the renderer — a frozen frame under the overlays. Set `-g` / `-keyint_min` to the composition fps:

```bash
ffmpeg -y -i "$VIDEO_PATH" -c:v libx264 -crf 18 -g 30 -keyint_min 30 \
  -pix_fmt yuv420p -movflags +faststart -c:a aac "$WORK_DIR/public/input-video.mp4"
```

## Assembly structure

`public/index.html` structure (contract details in [composition-contract.md](composition-contract.md)):

- Root `<div id="stage" data-composition-id="…" data-start data-duration data-fps data-width data-height>`.
- Layer 1: muted `<video id="source-video" class="clip">` as a **direct child** of the root, with `data-start`/`data-duration`/`data-track-index`, fixed full-canvas geometry, and `object-fit:cover`.
- Root-level `<audio>` mounting the same source file (`data-volume="1"`, its own track index) — preserves program audio with independently controllable volume, no manual remux.
- Layer 2: inline effect hosts and `data-composition-src` block hosts at the zones resolved by the edit plan. Every mounted block satisfies the current template/id/timeline contract.
- One main paused GSAP timeline for source-video transforms, inline components, and native inline motion. Each sub-composition registers and owns its separate timeline; HyperFrames seeks it independently.

Timing: absolute seconds = slot start + within-effect offset, quantized to 1/fps (`Math.round(t * fps) / fps`). Clip lifecycle is owned by HyperFrames; inner-wrapper hard hides use an explicit zero-duration timeline boundary set when needed.

## User preview — VidMuse Timeline (default)

Multi-track DSL (source + HyperFrames packaging HTML + subtitles + audio). Full contract: [vidmuse-timeline.md](vidmuse-timeline.md).

```bash
python3 scripts/write_dsl.py "$WORK_DIR" --mode layered          # or --no-overlay early
vidmuse serve "$WORK_DIR/dsl.json" &                             # http://127.0.0.1:5175/
vidmuse render "$WORK_DIR/dsl.json" --output "$WORK_DIR/final.mp4" --quality standard
```

Timeline is complementary to HyperFrames: HF builds the packaging layer; `serve` lets the user scrub packaging points, captions, and source together.

## Render (HyperFrames craft / optional bake)

```bash
cd "$WORK_DIR"
npx hyperframes lint
npx hyperframes check
npx hyperframes keyframes public --runtime all
npx hyperframes snapshot public --at <slot-midpoints>   # eyeball each frame
PRODUCER_BROWSER_GPU_MODE=hardware npx hyperframes render public -o output.mp4 --fps <fps>
```

`PRODUCER_BROWSER_GPU_MODE=hardware` is strongly recommended on macOS; software rendering times out on most laptops. `validate` / `inspect` / `layout` are deprecated aliases of `check` — do not use them. After bake, verify duration / resolution / fps with `ffprobe` against `edit-plan.json` (Packaging mode) or `scene-plan.json` (Director mode) when using bake evidence. Director mode keeps `motion-reel.mp4`, optional `act-renders/`, `output-draft.mp4`, and correction evidence before final delivery.

Do not use `npx hyperframes preview` as the user-facing packaging surface — that role belongs to `vidmuse serve`. HF preview remains an optional agent tool only.
