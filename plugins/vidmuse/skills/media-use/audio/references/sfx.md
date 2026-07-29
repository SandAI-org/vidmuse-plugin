# Sound effects

The audio engine first looks for a live VidMuse audio model supporting
`sound_effect`. If none exists, it resolves a deterministic match from the
plugin's bundled SFX library.

The fallback is intentionally not another AI provider. Unknown cues are
reported as anomalies and do not block the render.
