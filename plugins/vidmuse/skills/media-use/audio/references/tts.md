# Text to speech

TTS uses VidMuse CLI only.

```bash
vidmuse model list --audio -o json
vidmuse voice list --language zh --scope official -o json
vidmuse voice list --model minimax/speech-2.6-hd --language zh -o json
```

Run through the asset layer:

```bash
node <SKILL_DIR>/scripts/resolve.mjs \
  --type voice \
  --intent "欢迎来到 VidMuse" \
  --voice-id F-ZH-009 \
  --project .
```

Or use the full audio engine for multiple lines. It runs ATA against each
generated line so captions use real word timing. Voice ids are model-specific;
query rather than inventing one.

Do not use HeyGen, ElevenLabs directly, Kokoro, or `hyperframes tts`.
