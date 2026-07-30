# Audio — VidMuse TTS, music, ASR, ATA, SFX

## Full audio pass

```bash
node <SKILL_DIR>/audio/scripts/audio.mjs \
  --request ./audio_request.json \
  --project . \
  --out ./audio_meta.json
```

Request:

```json
{
  "lang": "zh",
  "voice_id": "F-ZH-009",
  "models": {
    "voice": "minimax/speech-2.6-hd",
    "bgm": "elevenlabs/elevenlabs_music"
  },
  "model_params": {
    "voice": {},
    "bgm": {}
  },
  "lines": [
    { "id": "01", "text": "欢迎来到 VidMuse。", "sfx": ["whoosh"] }
  ],
  "bgm": {
    "mode": "generate",
    "prompt": "restrained cinematic technology underscore",
    "duration": 30
  }
}
```

The engine:

1. discovers or uses the pinned VidMuse TTS model;
2. resolves a legal voice with `vidmuse voice list`;
3. runs TTS with `vidmuse model run`;
4. downloads the returned audio;
5. aligns the known line with VidMuse ATA for word timestamps;
6. generates BGM through a VidMuse music model;
7. resolves an approved Creator Library or bundled deterministic SFX first,
   then uses a live VidMuse SFX model only when those tiers miss;
8. writes `audio_meta.json`.

There is no detached local MusicGen/Lyria job and no `wait-bgm` step.

## Transcription

```bash
node <SKILL_DIR>/scripts/transcribe.mjs --input talk.mp4 --out talk.transcribe.json
```

- No supplied text: VidMuse ASR returns text, then ATA adds word timing.
- `--text` / `--text-file`: skip ASR and align approved text.
- `--asr-only`: text only, explicitly no caption timing.

ASR mistakes in names, products, and numbers must be surfaced to the user.
Corrections require re-running ATA; never hand-edit individual word times.

## Caption ownership

The transcript output includes flat `words[]` and ATA-derived `utterances[]`.
The owning `vidmuse-recut` or `vidmuse-create` workflow groups and styles
captions and writes them to VidMuse Timeline. Media Use supplies truthful timing;
it does not take over product caption strategy.
