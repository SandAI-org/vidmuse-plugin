# Semantic alignment contract

Use this contract whenever a frame, reticle, cursor, callout, underline, or
label must remain visually attached to product UI, an image region, a card,
or a moving row. It makes alignment a DOM relationship instead of duplicated
pixel coordinates.

## Two coordinate spaces

- **Content space:** product capture plus every precise overlay that belongs
  to it. Move one shared parent.
- **Screen space:** titles, captions, and editorial chrome intentionally fixed
  to the 1920×1080 frame. Keep them outside the content-space wrapper.

Never animate the capture and its precision overlays as siblings. If a camera
move targets only the capture, the overlay will drift even when both endpoints
look correct.

## Raster/UI recipe

Author the inner space at the capture's native dimensions. Scale or move the
outer camera, not the image or overlay children.

```html
<div id="ui-camera">
  <div
    id="ui-space"
    data-vm-align-space="homepage"
    data-vm-space-size="1920 1080"
  >
    <img id="ui-proof" src="assets/homepage.png" alt="">

    <div
      id="input-frame"
      data-vm-anchor-target="#ui-proof"
      style="
        position:absolute;
        left:21%; top:35%; width:58%; height:16%;
      "
    ></div>
  </div>
</div>
```

```css
#ui-camera {
  position: absolute;
  left: 150px;
  top: 90px;
  width: 1620px;
  height: 910px;
  overflow: hidden;
}
#ui-space {
  position: absolute;
  left: 0;
  top: 0;
  width: 1920px;
  height: 1080px;
  transform-origin: 0 0;
}
#ui-proof {
  display: block;
  width: 1920px;
  height: 1080px;
}
```

```js
// Correct: target and overlay inherit exactly the same transform.
tl.to("#ui-space", { x: -24, y: 22, scale: 1.065, duration: 2.25 }, "camera");

// Wrong: the raster moves under a fixed sibling overlay.
// tl.to("#ui-proof", { x: -24, y: 22, scale: 1.065 }, "camera");
```

The anchor's inline `left/top/width/height` percentages are the single source
of truth for the normalized box. Do not duplicate the same box in pixel CSS.

## DOM target recipe

When the target is a real DOM row/card, put the precision overlay inside that
target. The target itself becomes the alignment space.

```html
<div id="performance-row" data-vm-align-space="performance">
  <div class="row-content">…</div>
  <div
    id="performance-reticle"
    data-vm-anchor-target="#performance-row"
  ></div>
</div>
```

Move the list/rail ancestor. The row and reticle follow together. Do not
calculate a second global `top` for the reticle.

## Media-fit rule

Do not align in 1920×1080 frame coordinates against a `1800×640` source using
`object-fit: contain` or `cover`. Letterbox/crop math creates a hidden second
coordinate system. Instead:

1. author the content space at the source's native size, then scale its parent;
2. or precompose the source to the final frame size before adding overlays.

Use soft spotlight/glow treatment instead of a tight border when the target
moves *inside* a video and no tracking data exists.

## Local-motion exception

Opacity, color, border, and shadow animation do not change alignment. Direct
`x/y/scale/rotation` on a target or precision overlay is rejected. When local
motion is intentional, declare the exception with a non-empty reason:

```html
<div
  id="input-frame"
  data-vm-anchor-target="#ui-proof"
  data-vm-anchor-local-motion="brief 1.03x confirmation pulse; returns to 1"
></div>
```

Keep the exception scarce. Prefer a glow pulse over changing the box geometry.

## Gate

`check_motion.py` S5 checks:

- every `screenshot-camera` / `hybrid-slices` proof beat has a
  `data-vm-align-space`;
- every `data-vm-anchor-target` resolves to a local `#id`;
- anchor and target share the same nearest alignment space;
- raster spaces declare `data-vm-space-size`;
- raster anchor boxes use valid normalized percentages inside 0–100%;
- target/anchor do not receive independent spatial tweens without an explicit
  local-motion reason.

Layout overflow/occlusion waivers do not bypass S5.
