# Transcription

```bash
node <SKILL_DIR>/scripts/transcribe.mjs --input talk.mp4 --out talk.transcribe.json
```

The contract is:

```text
no text -> VidMuse ASR -> recognized text -> VidMuse ATA -> word timestamps
provided/corrected text --------------------^
```

ASR returns text only. ATA returns the word timing required by captions,
transcript cuts, and semantic edit points. Output contains:

```json
{
  "text": "…",
  "text_source": "vidmuse-asr",
  "alignment_model": "doubao_speech/audio_text_alignment",
  "words": [{ "id": "w0", "text": "…", "start": 0.0, "end": 0.32 }],
  "utterances": [{ "id": "u0", "text": "…", "start": 0.0, "end": 2.4, "word_ids": ["w0"] }]
}
```

Use `--text-file corrected.txt` to rerun ATA after correcting names or numbers.
Never hand-edit individual timestamps. `--asr-only` is explicitly untimed.
