# Composition Contract

The technical contract for every composition and effect this skill writes. Execution rules follow the current upstream HyperFrames core contract.

## Division of authority

The installed HyperFrames Registry item owns the effect mechanism. VidMuse's effect overlay and the work directory's `FRAME.md` decide editorial fit, intervention weight, content, and visual treatment. The LLM adapts the installed code; the HyperFrames technical skills (`hyperframes-core`, `hyperframes-cli`, `hyperframes-keyframes`) and automated checks decide whether the result is seekable and renderable. Do not use other workflow skills as competing design authorities.

## Effect source contract

Read every installed Registry file before adapting it. Do not infer block/component structure from its name, catalog description, or a previous version. Preserve the useful mechanism and remove demo-only content.

The accepted integration shapes are:

- a block adapted into a valid independently seeked sub-composition;
- a component mechanism integrated into the owning composition;
- a timeline hook attached where its source requires;
- a VidMuse-native block/component using the same contracts.

- No inline event handlers.
- IDs are unique across the assembled page; prefix internal ids with the effect/slot id.
- Replace every demo transcript, identity, image, data point, and placeholder.
- Resolve colors, type, spacing, and geometry from the design direction and real footage. Use upstream composition variables when present; direct LLM adaptation is valid when they are absent.
- Record source, adaptations, integration mode, and dependencies in `effect-sources.json`.

## Pinned CDN policy

External runtime and font CDNs are allowed with the policy in [registry-integration.md](registry-integration.md): exact runtime versions, explicit font families/weights, approved hosts, and complete URLs recorded in `effect-sources.json`. Never use `@latest`, a floating runtime version, dynamic URL construction, or an unrecorded host. The render is online-dependent by design, and `hyperframes check` must report no failed request.

## LLM-authored motion

The LLM writes and adapts GSAP/CSS/adapter code directly from the installed effect and current content. Build the visible hero state first, then author seek-safe entrances, internal development, holds, and exits. Quantize editorial beat times to `1/fps` when calculating absolute offsets.

## Timeline contract

- Exactly one `gsap.timeline({ paused: true })` per composition, built synchronously at page load, registered at `window.__timelines["<id>"]` where `<id>` equals that composition's root `data-composition-id`.
- The host and mounted sub-compositions have independent timelines. HyperFrames seeks them; never insert a child timeline into the host timeline.
- No `async`, `Promise`, `setTimeout`, or event handlers building render-critical motion; no `tl.play()`.
- Every timed element carries `class="clip"` alongside its own classes; the framework gates its visibility to the `data-start … data-start+data-duration` window.
- Do not `gsap.set()` later-scene clip elements at page load; use `tl.set(selector, vars, time)` at or after the clip's start.
- Use `data-track-index` (not `data-layer`) and `data-duration` (not `data-end`).

## Determinism invariants

- No `Date.now()`, `performance.now()`, unseeded `Math.random()`, dynamic render-time fetches, or input state. Static pinned CDN script/font tags are the only accepted network dependency.
- No `repeat: -1`. Finite count: `repeat: Math.max(0, Math.floor(duration / cycleDuration) - 1)` — floor, not ceil.
- Animate only the visual-property allowlist: `opacity`, `x`, `y`, `scale`, `rotation`, `color`, `backgroundColor`, `borderRadius`, transforms, and `filter` blur within the blur budget (total ≤ 20px on any animated element). Never animate layout dimensions, `letter-spacing`, `display`, or raw `visibility`.
- Two visibility exceptions, on non-clip elements or wrappers inside a clip only: GSAP `autoAlpha`, and a zero-duration `tl.set(..., { visibility })` at an explicit beat boundary — the correct deterministic hard-hide for cards and captions.
- Never animate the same property on the same element from two timelines at once.

## Layout invariants

- Build the visible end-state in static HTML/CSS first; animate from/to it.
- Transformed elements must be block-level and explicitly sized; a transform on an inline or auto-width element renders nothing.
- No `<br>` in body text; wrap via `max-width` or fit with `window.__hyperframes.fitTextFontSize`.
- Absolutely-positioned decoratives that pulse or overshoot need clearance at peak size and must not straddle an `overflow: hidden` edge.
- Body and global `font-family` must list concrete font names — the renderer's static font resolver does not expand CSS variables (`font_family_without_font_face`). Cards may use `var(--font)` internally once the `@font-face` declarations are loaded.
- A full-screen fill goes on a full-bleed child (`position:absolute; inset:0`), never on the composition root — root backgrounds can drop to black in the rendered frame even when preview looks right.

## Media contract

- The muted visual `<video id="source-video">` and program `<audio>` are direct children of the host root; the framework owns playback.
- Never nest media inside a wrapper or sub-composition. Apply source-video camera/reframing motion from the host timeline using seek-safe visual transforms and clipping rather than animated layout dimensions.
- Duplicate `<video>`/`<img>` ids render blank; ids must be unique across the assembled page.

## Motion craft

- Never enter from `scale(0)`; entrances start at `scale(0.95–0.97)` + `opacity: 0`.
- Anchored elements (bubbles, callouts, labels) grow from their anchor point via `transform-origin`; full-frame cards and centered statements are exempt.
- Exits usually run faster than entrances; use the design system's motion temperament while respecting the upstream mechanism.
- A visible two-state crossfade takes ≤ 2px of blur to fuse into one perceived transformation.
- Every effect's palette, type, graphics, and motion trace back to the design direction and installed source; local overrides for source legibility or content semantics are recorded in the slot and source receipt.

## Director scene boundaries

- Quantize substantial-scene boundaries to output fps and keep the declared
  source state unambiguous at every frame.
- A sub-composition timeline must cover its complete master slot. Pad a short
  timeline with a deterministic no-op so the runtime cannot hide it early.
- Review the last two frames before a boundary, the boundary frame, and the
  first two frames after it for black flashes, scale jumps, repeated frames,
  and direction discontinuity.
- Implement the handoff declared in `scene-plan.json`: continue, counter, stop,
  match geometry, bridge sound, or cut for semantic contrast. A technically
  valid transition still fails when it expresses the wrong relationship.

## Quality gate

```bash
npx hyperframes lint
npx hyperframes check       # 0 findings
npx hyperframes snapshot public --at <slot-midpoints>
```

Tool success is necessary but insufficient: inspect rendered hero frames and transitions in the exported video, then record results in `evaluation.json`.
