# Hero Frame Aesthetic Review

Review rendered hero frames as images before adding any animation. A static frame that fails here will not be saved by motion.

Each check below serves a dimension of [aesthetic-charter.md](aesthetic-charter.md); when a check and a dimension conflict on this film, the dimension wins and the override is recorded. Before the detailed checks, ask the four charter questions of every hero frame:

- **Poster test** *(charter 10)* — would you ship this frame as the thumbnail?
- **Single focus** *(charter 8)* — what is the one thing a viewer should look at? If the frame cannot answer, it fails before any token check.
- **This room** *(charter 9)* — does it still look like this room, this person?
- **Deletion test** *(charter 1)* — for each graphic element: what would the frame lose without it?

## When

After the static hero frame of each Visual Slot (Packaging mode) or substantial
scene (Director mode) is rendered, before animating it. Review the actual
rendered image, not the HTML source.

## How

Render each slot or scene's hero frame to a still image. Open the image and
check it against the work directory's `FRAME.md`. Director scenes must also
express their storyboard visual proof and act world. Fix and re-render until
the checks pass, then animate.

## Checks

### Fidelity to the design system

- The visible decisions express the selected style atoms, not merely the anchor
  profile's old appearance. Name the source fact behind each major atom choice.
- The frame visibly supports every recorded project delta. If the anchor profile
  would produce the same frame, the composition has not actually been adapted.
- Colors on screen match `implementation.palette` values. If a color drifted, the frame fails.
- Fonts on screen are the `implementation.fonts` families, actually loaded, not a fallback.
- Text sizes follow `implementation.type_scale` roles. No invented in-between sizes.
- Radius, stroke, and surface treatment match the system's material language.

### Typography craft

- Tracking is size-specific, never one value for all sizes. Display text carries slightly negative tracking (around -0.02em); body stays near zero; meta and small caps take slightly positive tracking. A single letter-spacing value across the scale is wrong somewhere.
- Leading tracks size inversely: tight on display lines, comfortable on body. A display line with body leading reads as a mistake.
- Hierarchy is built from weight, size, and leading as a set, not from size alone. If two levels differ only in font-size, the hierarchy is underbuilt.

### Hierarchy

- Squint test: with the image blurred or viewed small, the most important element still reads first.
- Exactly one focal point. If two elements compete, demote one.
- Metadata and captions are quiet; they never outweigh the content they describe.

### Composition

- Nothing violates the safe area or collides with the subject's face, hands, or gaze line.
- Empty space is intentional and load-bearing, not leftover.
- Alignment is exact. A 2px misalignment reads as sloppiness at video scale.

### Restraint and anti-patterns

- The frame contains nothing from the system's `avoid` list.
- Every graphic element has an editorial purpose you can state in one sentence. Remove any element that fails this test.
- The frame does not look like a template with content poured in. If swapping the text to any other topic would produce an equally plausible frame, it is template-shaped — bind at least one element to this content specifically.
- The official effect's demo styling is no longer recognizable as a foreign skin;
  its useful mechanism remains, but type, color, geometry, timing, and content fit
  this project's composed atoms.

### Signature move

- If this slot or scene carries the signature sequence, its focal idea is
  visible and legible in the static frame.
- If it does not carry the signature sequence, nothing in the frame competes
  with that sequence's role in the full film.

## Recording

Write one review entry per slot or scene into `evaluation.json` with the frame
path as evidence. Aesthetic observations that required a fix go into the
applicable hero-frame pass and correction history.

## Learn from edits

When the user manually changes a rendered result, record the change as a `feedback.events` entry with `action: "modify"`, the `from` and `to` values, and the scope the user stated. A modification is the highest-value taste signal; capture direction and magnitude, not just the fact of the change.
