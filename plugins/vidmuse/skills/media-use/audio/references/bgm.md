# Background music

BGM generation uses a live VidMuse audio model that supports
`text_to_music`. Query before choosing:

```bash
vidmuse model list --audio -o json
```

For a one-off asset, use `resolve --type bgm`. For a narration pass, put the
music prompt and optional model/duration in `audio_request.json`; the audio
engine downloads the result and records it in `audio_meta.json`.

Under narration, default volume is 0.12. Without narration, default volume is
0.9. Use `audio-duck.mjs` or ffmpeg sidechain compression for final mixing.

There is no HeyGen catalog retrieval and no local MusicGen/Lyria fallback.
