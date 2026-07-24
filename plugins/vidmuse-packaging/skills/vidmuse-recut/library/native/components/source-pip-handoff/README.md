# source-pip-handoff

A VidMuse-native timeline hook for the full-frame → corner PiP → full-frame
handoff. Use it when designed information needs the main canvas but the speaker
should remain visibly present.

## Host contract

1. Keep the source video as a direct child of the HyperFrames root, give it a
   stable `id`, and add the `vm-source-pip-media` class.
2. Copy/adapt the component styles and markup. Set both timed clips to the real
   interval, and replace the sample copy and palette.
3. Build one paused host GSAP timeline, then call:

   ```js
   VidMuseNativeEffects.attachSourcePipHandoff({
     timeline,
     start: 12.4,
     duration: 7.6,
     pipWidth: 520,
     pipHeight: 292,
     right: 64,
     bottom: 56,
   });
   ```

4. Register that same timeline synchronously with HyperFrames.

The default geometry targets a 1920×1080 frame and a 520×292 lower-right PiP.
Do not overlap this interval with another hook that owns the source video's
`x`, `y`, `scale`, or `borderRadius` transforms.

## VidMuse Timeline boundary

If the Timeline owns the source video outside the HyperFrames DOM, a transparent
HyperFrames overlay cannot transform it. Use this component for the background,
copy, and window outline, and apply the returned `scale`, `x`, and `y` geometry
to the native video item over the same interval. If the local Timeline API
cannot express seek-safe transforms, render the interval as a self-contained
HyperFrames composition instead.
