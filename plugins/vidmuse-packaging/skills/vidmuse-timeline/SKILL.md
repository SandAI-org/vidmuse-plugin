---
name: vidmuse-timeline
description: Assemble, inspect, incrementally update, validate, serve, review, or render a VidMuse DSL v2 Timeline project. Use when a film workflow needs dsl.json delivery; when a project contains main video, timed overlay video, HyperFrames HTML, subtitles, or independent audio; when official HyperFrames blocks or components must be delivered through a composed host HTML; or when the user asks to open, edit, export, review, or render a project in VidMuse Timeline. Preserve film-owner decisions and unknown DSL fields.
---

# VidMuse Timeline

Own the VidMuse DSL assembly and review surface. Translate already-approved film decisions into one valid `dsl.json`; do not become the editor, designer, asset planner, HyperFrames author, or command authority.

## Source-of-truth boundary

- Treat the film owner's official `STORYBOARD.md` for Create, single `MV-SCRIPT.md` for MV, or `storyboard.json` for Recut as the planning input, together with approved media, generated review candidates, the active design contract, captions, audio plan, and validated HyperFrames HTML. Accept separate MV `BRIEF.md`, `FRAME.md`, or `STORYBOARD.md` only as legacy resume inputs; do not require or recreate them for a new MV. A review candidate may enter Timeline before visual approval; Timeline inclusion does not approve it.
- Treat `dsl.json` as the source of truth for VidMuse track assembly, playback settings, Timeline edits, and CLI rendering.
- Keep Timeline edits in `dsl.json` or the explicitly edited HyperFrames HTML. Do not silently back-propagate them into the owning film plan or design contract; report the difference to the owner for acceptance.
- Preserve unknown fields and stable IDs when updating an existing DSL. Never rebuild the whole document merely to change one clip.

## Minimal workflow

1. Decide whether to create, inspect, update, review, edit, or render a Timeline project.
2. Read the existing DSL first, then the owner artifacts needed for the requested change.
3. Assemble or patch the narrowest DSL fields without changing editorial intent.
4. Run `scripts/validate-dsl.mjs` and fix every error. Treat warnings as review items, not automatic failures.
5. Validate every referenced HyperFrames host with the pinned `hyperframes-cli` checks before Timeline review.
6. For a layered preview, read [preview-integrity.md](./references/preview-integrity.md) and pass its static and live Serve gates; standalone HyperFrames correctness is not proof of Timeline compositing or continuous playback.
7. Load `vidmuse-cli` to serve or render the validated absolute DSL path.
8. Re-read files after an editable Timeline session, validate again, and return a concise change summary or rendered paths to the film owner.

## Canonical DSL v2

For a new project, write only the fields required by the actual assembly. Prefer this shape:

```json
{
  "version": "2",
  "projectName": "example-film",
  "totalDuration": 12,
  "options": {
    "aspectRatio": "16:9",
    "resolution": "1080p"
  },
  "sourceVideo": {
    "filePath": "assets/source.mp4",
    "metadata": {
      "duration": 12,
      "width": 1920,
      "height": 1080,
      "frameRate": 30,
      "hasAudio": true
    }
  },
  "videoTracks": [
    {
      "id": "main-video",
      "type": "main",
      "videos": [
        {
          "id": "source",
          "type": "video",
          "duration": 12,
          "videoClipStartTime": 0,
          "playbackRate": 1,
          "muted": false,
          "volume": 1,
          "videoFile": [
            {
              "source": "upload",
              "active": true,
              "filePath": "assets/source.mp4"
            }
          ]
        }
      ]
    },
    {
      "id": "graphics",
      "type": "sub",
      "videos": [
        {
          "id": "hook",
          "type": "hyperframes",
          "startTime": 1,
          "duration": 3,
          "htmlSourceFilePath": "hyperframes/hook/index.html",
          "params": {
            "sourceStartTime": 0,
            "enabled": true
          }
        }
      ]
    }
  ],
  "sounds": [],
  "subtitles": []
}
```

Use `videos` for new tracks. Existing projects may use the deprecated `items` collection; preserve that collection during focused edits. When both exist, the runtime prefers a non-empty `videos` array, so never populate both intentionally.

Do not add `scenes`, `packagingPlan`, `harness`, generation placeholders, or compatibility fields to a new assembled project unless an existing owner workflow requires them. They are accepted inputs and fallbacks, not the minimal render contract.

For a pre-generation Style-selection checkpoint, a pictureless review DSL is valid. An IP project may use a one-second canvas with the brief's `options` and empty `videoTracks`, `sounds`, and `subtitles`. An MV keeps the locked master audio as one audible `sounds` item starting at `0`, sets `totalDuration` to its full duration, and leaves `videoTracks` empty. Validate either normally. These DSLs exist only to open Serve's catalog, and for MV to hear the timing spine; do not add placeholder picture or pretend that Style browsing has changed the film.

## Timing and track semantics

Use numeric seconds in new DSL. Preserve valid numeric or `HH:MM:SS.mmm`/`HH:MM:SS,mmm` values already present unless editing them.

- Ordinary video items on a non-`sub` track are sequential. Their array order defines placement; `startTime` does not.
- Items on a `sub` track use absolute `startTime` and may overlap.
- A HyperFrames item is always timed by absolute `startTime`, even if placed on another track type. Put it on `sub` for clarity.
- Give every item an explicit positive `duration`. Do not rely on the runtime's three-second fallback.
- Keep `endTime`, when present, equal to `startTime + duration` for timed items.
- Use `videoClipStartTime` as the source-media in-point. The required source range is `videoClipStartTime + duration × playbackRate`.
- Keep `playbackRate` within `0.1–16` and `volume` within `0–2`.
- Recompute `totalDuration` from the latest end across main video, timed overlays, HyperFrames, subtitles, independent audio, and a source-video fallback. Do not truncate content with a smaller declared duration.

Give every track, item, sound, and subtitle a stable project-wide unique ID. Reordering a main track is an editorial change; do it only when explicitly approved by the owner or user.

## Media and audio

- Resolve relative paths from the directory containing `dsl.json`.
- Allow local paths, `file:` URLs, and HTTP(S) media paths supported by the CLI. Require HyperFrames HTML to be local.
- Use the first explicitly active asset; keep exactly one active entry when alternatives are present.
- Preserve source metadata for canvas, frame-rate, duration, and audio decisions even when an explicit main track references the same source.
- Keep exactly one intended program-audio path. Do not leave the main source audible while also adding an extracted copy as independent source/program audio.
- Use `sounds` for independently timed music, voiceover, or extracted program audio. Remember that overlay rendering preserves `sounds` while excluding the main video track and its embedded audio.

Use DSL subtitles only when Timeline owns the caption overlay. If the validated HyperFrames composition already renders the same captions, leave `subtitles` empty. Timeline captions are independent top-layer overlays, not track geometry or a reserved empty rail: footage and HyperFrames packaging may continue behind them. For new subtitles, use numeric seconds, normalized `layout.x`/`layout.y` coordinates, and style values inherited from the active design contract—`MV-SCRIPT.md` → `## Visual Direction` for MV, `FRAME.md` elsewhere; default to horizontal center unless the approved design says otherwise. Preserve this through the native subtitle collection and runtime ordering—do not invent a private `zIndex`, layer, or component field.

## HyperFrames compatibility

Treat `htmlSourceFilePath` as a reference to one complete renderable HyperFrames host document.

- Read `hyperframes-registry` to install and wire official items.
- Let `hyperframes-core` and `hyperframes-animation` assemble the host and its seekable motion.
- Run the pinned HyperFrames lint, browser check, and representative snapshots before accepting the HTML.
- Never point `htmlSourceFilePath` directly at `compositions/components/<name>.html`. Components are snippets without their own canvas or timeline; merge their HTML, CSS, JS, and timeline calls into a host first.
- Do not point directly at a raw Registry block template. Wire the block into a standalone host, or into the film's full overlay composition.
- Do not add a private DSL component field. Keep component provenance in the active design contract, `hyperframes.json`, and the HyperFrames project.

Choose the assembly mode from media ownership, not convenience:

### Layered packaging host

Use this whenever the DSL main track owns the source picture or program audio,
or DSL subtitles own the continuous captions. Reference a validated packaging-only
host with explicit transparent roots and no duplicate source video, program audio,
or Timeline-owned captions:

```json
{
  "id": "film-packaging",
  "type": "hyperframes",
  "startTime": 0,
  "duration": 12,
  "htmlSourceFilePath": "timeline-overlay/index.html",
  "params": { "sourceStartTime": 0, "enabled": true }
}
```

One shared host may serve several discrete Timeline items when every item sets
`params.sourceStartTime` explicitly. The item interval is the first-to-last visible
graphic interval, not the broader spoken context that motivated the graphic.

### Self-contained composition

Reference `public/index.html` only when it is the sole owner of the source picture,
program audio, and its captions. Do not mount a self-contained film above another
copy of the same main video. If the DSL already owns those layers, derive a
packaging-only host instead.

### Isolated composition items

Reference one complete host per independently timed visual. Set `params.sourceStartTime` explicitly, usually `0`. When reusing the same long HTML source across multiple items, set the intended source time on every item instead of relying on shared-source inference.

The host composition's finite duration must cover `sourceStartTime + duration`. A raw component or template is not a valid host.

## Incremental update protocol

When modifying an existing project:

1. Parse and preserve the complete JSON object.
2. Locate targets by stable ID; use array position only to disambiguate a broken legacy file.
3. Preserve the track's existing `videos` or `items` collection.
4. Change only requested fields and coupled invariants such as `endTime` and `totalDuration`.
5. Preserve unrelated timing, media paths, options, metadata, mute state, volume, subtitle style, custom params, and unknown extensions.
6. Validate the result before replacing the accepted version.

Do not normalize all timecodes, sort timed items, rename IDs, migrate legacy fields, or rewrite formatting as collateral work.

## Validate

Run the bundled semantic validator from any working directory:

```bash
TIMELINE_SKILL_DIR="<directory containing this SKILL.md>"
node "$TIMELINE_SKILL_DIR/scripts/validate-dsl.mjs" /absolute/path/to/dsl.json
node "$TIMELINE_SKILL_DIR/scripts/validate-dsl.mjs" /absolute/path/to/dsl.json --json
```

The validator checks DSL v2, IDs, time ranges, canonical track behavior, total duration, local paths, active assets, playback settings, subtitle bounds, possible program-audio duplication, complete HyperFrames host structure, and common layered-host ownership/background violations. It cannot prove alpha compositing or continuous playback; the live Serve gate in [preview-integrity.md](./references/preview-integrity.md) remains mandatory.

Stop before serve or render when errors remain. Review warnings in context; do not suppress them by deleting intentional project data.

## Build the mandatory transcript-review surface

When a speaking-video owner requests the post-transcription review checkpoint, assemble the smallest valid DSL containing the user's original video with program audio and the validated Timeline subtitle cues. Do not wait for graphics, `FRAME.md`, cards, or the final HyperFrames composition.

```bash
node "$TIMELINE_SKILL_DIR/scripts/build-transcript-review.mjs" \
  --project "$PROJECT_DIR" \
  --video "$SOURCE_VIDEO" \
  --metadata "$PROJECT_DIR/metadata.json" \
  --subtitles "$PROJECT_DIR/subtitles.timeline.json" \
  --output "$PROJECT_DIR/dsl.json"

node "$TIMELINE_SKILL_DIR/scripts/validate-dsl.mjs" "$PROJECT_DIR/dsl.json"
```

The builder references the real source file, preserves its embedded program audio, creates an empty graphics track for later incremental packaging, centers every review subtitle horizontally with normalized layout, and rejects any subtitle longer than 16 characters. The subtitle collection remains the top-layer review overlay; the empty graphics track does not reserve space for it. The builder never overwrites an existing DSL. On resume, validate and patch the existing DSL through the incremental-update protocol instead.

Treat this early DSL as a transcription-review surface, not a design approval. Later, patch graphics and final caption styling into the same stable DSL. If the full HyperFrames composition eventually owns the identical caption overlay, disable the preliminary DSL subtitles to avoid double rendering; do not discard their timing or corrected text.

## Serve and review

Load `vidmuse-cli` for the exact binary path and live command syntax.

- Default review to loopback and `--read-only`.
- Start editable serve only when the user explicitly requests Timeline or HyperFrames editing.
- Treat editable serve as a real local mutation session: the UI can persist the complete DSL and edit HyperFrames HTML.
- Keep the foreground process alive, report its URL, and do not expose a non-loopback host implicitly.
- With bundled CLI `v0.3.7-1b501e1` or a confirmed newer compatible build, an owner-declared Style-selection checkpoint may put a validated pictureless IP or audio-only MV DSL into read-only Serve before any picture exists. Tell the user to open the top-right **Styles** palette, compare visual cards, and return **Copy for Agent** output or the copied Style ID. Browsing, filtering, selecting, and copying a card do not mutate the DSL or approve the Style by themselves; the IP owner records the explicit choice in `style.json`, while the MV owner records it in `MV-SCRIPT.md` → `## Visual Direction`. If the catalog fails, report it to the owner; do not replace this surface with chat thumbnails or preview links.
- When the owning film workflow marks Serve as a mandatory perception checkpoint, start it immediately after validation without asking another confirmation. Do not continue past that checkpoint until the process is alive and the URL has been reported to the user.
- When an IP or MV owner requests immediate generated-clip review, assemble candidates sequentially with their master narration or music, run structural DSL validation, and start Serve before any Agent visual inspection. Add or replace each stable clip in the same DSL as soon as it returns. Do not watch the clips, extract sample frames, create contact sheets, render a review file, score the generation, or delay the URL for autonomous quality judgment.
- The immediate generated-candidate checkpoint overrides the following live-perception instructions until the user has seen the sequence. For other reviews, and after user-requested revisions or packaging edits, reload the page and exercise the real preview continuously across every packaging item. Confirm the source remains visible through intended transparency, motion advances during Play, item bounds match the first and last visible graphic frames, and no black fill, residue, or fetch/media error appears.
- Treat a black fill that appears only while a transparent HyperFrames item is active as a preview-compositor failure. Do not hide it by embedding a second source-video plate in the packaging host; follow [preview-integrity.md](./references/preview-integrity.md) and block review until the runtime or an explicitly disclosed alpha-overlay proxy is valid.
- After editing, re-read DSL and referenced HTML, inspect the actual diff, run both validators again, and return changed timing/style fields to the owner.

Do not claim that opening Timeline approved the film. Report review state separately from artifact validity.

## Render and deliver

Use `vidmuse-cli` only after DSL and HyperFrames validation:

- Use `--quality draft` for review renders and `--quality high` for approved delivery.
- Use `--mode full` for the assembled film and an explicit new `.mp4` path.
- Use `--mode overlay` for transparent HyperFrames, DSL subtitles, and independent sounds, with an explicit new `.webm` path.
- Preserve DSL canvas and source frame rate unless the user explicitly requests an override.
- Verify command success, nonzero output, expected container, duration, dimensions, frame rate, and audio intent before returning the path.

Do not start serve automatically after render. Do not render merely because the user asked to open or inspect the project.

## Ownership and boundaries

- Own DSL assembly, incremental DSL edits, semantic validation, Timeline serve mode, synchronization, render request definition, and review handoff.
- Accept review-only generated candidates from an owner and preserve their candidate status until the user approves or requests replacement.
- Let the film owner decide story, clip order, cut points, packaging density, design, caption policy, and acceptance of Timeline edits.
- Let `vidmuse-design` define visual direction, `vidmuse-media` execute media operations, and the HyperFrames skills build and validate composition HTML.
- Let `vidmuse-cli` resolve the bundled binary, flags, dependencies, process execution, and output parsing.
- Do not invent DSL fields, install Registry items, mutate HyperFrames internals, download models, or start HyperFrames Studio/Timeline UI.
