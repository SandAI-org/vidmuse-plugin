# The review loop — plan, sketch, build

How a `storyboard: yes` run earns fidelity one pass at a time without HyperFrames Studio or its timeline UI. Collaborative mode waits at each checkpoint. Autonomous mode posts the same checkpoint summaries and continues, keeping one question before render.

## 1. Plan

Present the plan in chat as a frame table: frame, beat, duration, on-screen content, and narrative role. Ask whether to approve or revise it and whether to review wireframe sketches before the full build. Apply changes only to the named frames.

## 2. Sketch

When requested, create each wireframe as a real composition at `compositions/frames/NN-*.html`: template wrapper, `data-composition-id`, `#root` styling, and one paused empty timeline registered at `window.__timelines["<frame_id>"]`.

Run `npx hyperframes lint`, then capture one representative snapshot per frame. Present the snapshot files or a contact sheet for review. Revise only the named frames until the layout is approved. A confirmed storyboard may be the final deliverable when the user asked only for a storyboard.

## 3. Build

Dress the approved layout with final design, assets, and motion without redrawing its placement, hierarchy, or copy. Mark each frame `animated` as it lands.

## 4. Final look

After checks pass, capture representative scene midpoints with `npx hyperframes snapshot --at <times>`. Ask “render now, or what changes?” Render only after explicit approval. Never open HyperFrames Studio, `preview`, `beats`, or its timeline UI.

Route media generation, ASR, TTS, background removal, and model choice through `vidmuse-media`; do not use HyperFrames-managed models.
