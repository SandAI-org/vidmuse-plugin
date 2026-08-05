# Timeline preview integrity

`hyperframes check` proves that a host is a valid seekable composition. It does
not prove that VidMuse Timeline composites that host correctly over a main video,
or that continuous playback advances it. Treat the served Timeline as a separate
runtime contract.

## Choose one media owner

Use exactly one of these topologies:

### Layered Timeline

Use this when the DSL already owns the source picture, program audio, or
captions. The HyperFrames host is packaging-only:

- `html`, `body`, and the composition root explicitly paint a transparent
  background;
- no source-video plate, source/program `<audio>`, or duplicate continuous
  captions exist inside the host;
- a full-canvas matte exists only inside a timed takeover clip, never as an
  unconditional page background;
- every Timeline packaging item starts when its first graphic pixel begins to
  appear and ends when its last graphic pixel has resolved.

Do not copy the source video into the packaging host to hide a black preview.
That creates a second picture owner, can drift or seek differently from the main
track, doubles decoding cost, and makes Timeline preview semantics differ from
full render semantics.

### Self-contained composition

Use this only when the DSL does not also mount the same source picture, program
audio, or captions. A self-contained `public/index.html` may own those layers,
but then it is the film, not an overlay above another copy of the film.

## Static preflight

Before Serve:

1. Run `validate-dsl.mjs` and fix every layered-host error.
2. Run the pinned HyperFrames check on every referenced host.
3. Confirm the layered host has explicit transparent root backgrounds and no
   unconditional full-canvas fill outside timed clips.
4. Reconcile each Timeline item against the visual interval, not merely the
   broader spoken beat. A contextual sentence that stays clean source is not
   part of the packaging item.
5. Snapshot the item at start + one frame, a developed/hero state, and end minus
   one frame. A completely empty head or tail longer than two output frames is a
   timing failure; trim it or split the treatment.

## Live Serve gate

After every DSL or host change, reload the Timeline page before reviewing. Then
test the actual composed preview:

1. Confirm the main preview video has loaded media (`readyState >= 2`, positive
   video dimensions, and no media error).
2. At a light-overlay beat, confirm real source pixels remain visible through
   every intended transparent region. A black, white, or solid-color fill where
   the source should remain visible fails the gate.
3. Press Play before the item starts and watch continuously through its exit.
   Text, diagrams, and images must advance to their developed states; seek-only
   correctness is insufficient.
4. Check one frame immediately before and after the item. No overlay residue may
   remain, and the source must return without a flash or discontinuity.
5. Fit the Timeline and confirm item lengths match their visible payload. No
   segment may occupy a long clean-source interval merely because the surrounding
   spoken beat supplied context.
6. Confirm the page has no `Failed to fetch`, media error, or console
   warning/error attributable to the project.

Present the Timeline to the user only after every packaging item passes this
gate. Opening Serve or seeing track rectangles is not sufficient.

## Failure triage

| Symptom | Likely layer | Required response |
| --- | --- | --- |
| Main picture is black even with no active package | source path, codec, or media loading | inspect the preview `<video>` state, local-file response, and dense-keyframe proxy |
| Picture turns black only while HyperFrames is active | alpha compositing between Timeline and the HyperFrames player | keep the host packaging-only; do not add a source plate; block handoff and update/fix the preview runtime |
| Static seek works but Play leaves an empty panel | continuous-playback bridge is not advancing the paused master timeline | block handoff; fix player synchronization before review |
| Package appears at the wrong internal pose | `params.sourceStartTime` mismatch | align the shared host clock or use a zero-based per-item host |
| Timeline item is much longer than visible graphics | spoken context was mistaken for visual lifetime | trim start/end to the first and last visible graphic frames |
| `Failed to fetch` | stale Serve session or unresolved project-local path | validate paths, restart Serve, reload, and retest |

If the HTML compositor cannot preserve alpha and a product-runtime fix is not
available, a temporary review fallback may use a locally rendered transparent
WebM as the timed sub-track item. Keep the HyperFrames HTML as the source of
truth and disclose that element-level Timeline editing is unavailable in that
fallback. Never use a second source-video plate as the workaround.
