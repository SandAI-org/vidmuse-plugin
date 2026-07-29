# VidMuse Timeline Contract

VidMuse Timeline (`vidmuse serve` / `vidmuse render`) is the **user-facing multi-track workbench**. It is not a passive “play the finished MP4” player.

```text
HyperFrames                         VidMuse Timeline
────────────────                    ────────────────
Produce packaging layers            Assemble & preview the film
(seek-safe HTML / GSAP)             main (source) + sub (packaging) + subtitles + sounds
lint / check / snapshot             serve → scrub / edit / write-back dsl.json
optional bake → output.mp4          render → final.mp4 from current DSL
```

They **do not conflict**. HyperFrames owns how a packaging layer looks and moves. Timeline owns how **source + packaging points + captions** sit on one editable timeline.

## CLI preflight

All three must succeed (a bare `vidmuse --version` is not enough):

```bash
command -v vidmuse
vidmuse serve --help
vidmuse render --help
vidmuse profile get          # login required for alignment models; good hygiene before serve
```

`render` additionally needs **Node.js 22+ / ffmpeg / ffprobe** on PATH, and
`serve` needs ffmpeg for thumbnails. Validated flag values, the `full` /
`overlay` mode↔container lock, headless `login --device`, and `serve --host`
exposure are in [`vidmuse-cli.md`](vidmuse-cli.md).

## Default delivery topology (layered)

`dsl.json` (version `"2"`) at the work-directory root. Paths are **relative to `dsl.json`**.

| Track | Owns | Typical files |
| --- | --- | --- |
| `videoTracks` `type:"main"` | Source picture | `public/input-video.mp4` (dense-keyframe re-encode) |
| `videoTracks` `type:"sub"` + item `type:"hyperframes"` | Packaging / design layer | `public/index.html` (or per-slot overlay HTML) |
| `sounds[]` | Program / VO audio | `audio.mp3` (or demuxed source audio) |
| `subtitles[]` | Delivery / review captions | Derived from `transcript.json` (sentence groups) |

### Template shape

```json
{
  "version": "2",
  "projectName": "<project>",
  "totalDuration": 60.0,
  "options": { "aspectRatio": "16:9", "resolution": "source", "frameRate": 30 },
  "sourceVideo": {
    "filePath": "public/input-video.mp4",
    "metadata": { "width": 1920, "height": 1080, "frameRate": 30, "duration": 60.0 }
  },
  "videoTracks": [
    {
      "id": "main-track",
      "type": "main",
      "items": [{
        "id": "source-main",
        "type": "main",
        "startTime": 0.0,
        "duration": 60.0,
        "videoClipStartTime": 0.0,
        "muted": true,
        "videoFile": [{ "filePath": "public/input-video.mp4", "active": true }]
      }]
    },
    {
      "id": "overlay-track",
      "type": "sub",
      "items": [{
        "id": "hyperframes-packaging",
        "type": "hyperframes",
        "startTime": 0.0,
        "duration": 60.0,
        "htmlSourceFilePath": "public/index.html",
        "params": { "enabled": true, "sourceStartTime": 0.0 }
      }]
    }
  ],
  "sounds": [{
    "id": "source-audio",
    "startTime": 0.0,
    "duration": 60.0,
    "audioFile": [{ "filePath": "audio.mp3", "active": true }]
  }],
  "subtitles": [
    { "id": "subtitle-001", "text": "…", "startTime": 0.12, "endTime": 1.4 }
  ],
  "characters": [],
  "visualStyles": [],
  "scenes": []
}
```

Generate with:

```bash
python3 scripts/write_dsl.py "$WORK_DIR" --mode layered
# early (source + captions only, no overlay yet):
python3 scripts/write_dsl.py "$WORK_DIR" --mode layered --no-overlay
# fallback single-file bake review:
python3 scripts/write_dsl.py "$WORK_DIR" --mode baked
```

## HyperFrames layer rules (when hung on Timeline)

For **layered** Timeline preview, the packaging HTML must not fight the main track for media ownership:

- Prefer a **transparent** packaging composition (no full-bleed opaque matte that hides the source unless the design intends a takeover).
- When Timeline main already owns source A/V, the overlay HTML should **not** also play loud source audio. Mute internal `<video>` / omit `<audio>` in the overlay build, or keep source elements only for HyperFrames-only bake/check passes.
- Full duration overlay (`startTime: 0`, `duration: total`) is valid for a single ship composition (`public/index.html`).
- Per-slot overlays are also valid: one `type:"hyperframes"` item per packaging point / group, with `startTime`/`duration` from the edit or scene plan and `params.sourceStartTime` aligned when one HTML serves many beats:

```json
{
  "id": "<slot-id>",
  "type": "hyperframes",
  "startTime": 12.0,
  "duration": 4.0,
  "htmlSourceFilePath": "public/compositions/<slot-id>/index.html",
  "params": { "enabled": true, "sourceStartTime": 12.0 }
}
```

- Local assets under the HTML’s directory; relative URLs; no `../` escape of the asset root for Timeline-served overlays when possible.

## Subtitles vs designed type

| Kind | Where | Role |
| --- | --- | --- |
| **Timeline `subtitles[]`** | DSL list | Scrub-friendly captions for review & delivery edits |
| **HF kinetic / treatment type** | Packaging HTML | Design system emphasis, golden-line type, art captions |

Both may exist. Do not assume one replaces the other. Build `subtitles[]` from aligned `transcript.json` (sentence groups at punctuation / utterance breaks). User Timeline edits to subtitle text/times are first-class.

### One owner for the spoken line

Both tracks *existing* is fine; both **rendering the same spoken words at the same time** is not. Two caption systems in one frame double the text, fight for the caption band, and are the mechanism behind captions getting shoved out of their zone. Decide the owner once per film:

| Owner of the continuous spoken line | The other track's job |
| --- | --- |
| HF caption component in the packaging HTML | `subtitles[]` stays a delivery / review track — keep it out of the overlay render (`--mode overlay` carries `subtitles[]`, so do not also bake HF captions into that pass) |
| DSL `subtitles[]` | HF caption mechanisms fire only as scarce escalations (golden-line rungs 2–3) |

When an escalation takes over a span, the regular caption for exactly that span yields — the same rule as [captions-and-golden-lines.md](captions-and-golden-lines.md) rung 2: the words are *absorbed* into the treatment, never shown twice on screen. `write_dsl.py` does not check this (it writes `subtitles[]` from the transcript unconditionally); verify it on the Timeline by scrubbing a cue where a caption effect is active.

## When to start `serve`

1. **Early (recommended):** after probe + transcript alignment — main source + `subtitles[]` (+ sounds), overlay empty or omitted (`--no-overlay`). User already watches the real cut on Timeline.
   Create films with no picture yet: `write_dsl.py <work> --mode audio` — narration on `sounds[]` + ATA `subtitles[]`, main/overlay tracks empty, duration probed from `audio.mp3`. Re-run with `--mode layered` once a program bed or packaging HTML exists.
2. **As packaging lands:** attach or refresh the hyperframes sub-track item(s); reload the Timeline page if the UI does not hot-reload external DSL writes.
3. **After hero / motion gates:** keep the same `serve` session; do not demote Timeline to a post-bake only step.

```bash
vidmuse serve "$WORK_DIR/dsl.json" &    # default http://127.0.0.1:5175/
```

HyperFrames `snapshot` / `check` remain **agent production QA**. They are not the user-facing packaging-point surface.

## Baked mode (fallback only)

`--mode baked` puts **only** `output.mp4` on main (packaging pixels flattened). Use when:

- Timeline CLI cannot host hyperframes HTML items, or
- You need a single-file offline handoff, or
- Evaluating a final flattened prod render.

Baked mode still **should** carry `subtitles[]` when transcript exists (review captions on top of the bake). Prefer layered for normal product runs.

## Write-back discipline

The user edits timing, subtitle copy, volumes, enable flags, and trims in the Timeline UI; changes persist into the same `dsl.json`:

1. Re-read `dsl.json` from disk before every agent write.
2. Merge by stable `id`; preserve unknown fields.
3. Record user moves/deletes/text edits as `evaluation.json` `feedback.events`.
4. Packaging **design** changes (new card look, wrong mechanism) → edit composition HTML / re-check / update overlay path — not by painting on the bake alone.
5. Export only after approval:

```bash
vidmuse render "$WORK_DIR/dsl.json" --output "$WORK_DIR/final.mp4" --quality standard
```

Verify `final.mp4` with `ffprobe` (duration / size / fps).

## Dual render targets

| Artifact | Producer | Purpose |
| --- | --- | --- |
| Hero stills / motion-reel / `output-draft.mp4` / optional `output.mp4` | `npx hyperframes …` | Craft QA, director loop, optional bake |
| Timeline preview URL | `vidmuse serve` | User sees **source + packaging + subtitles** |
| `final.mp4` | `vidmuse render` | Delivery export from DSL assembly |

Optional `output.mp4` bake remains useful evidence for evaluation gates; it is **not** required to be the only thing on Timeline main.
