# Transcription

```bash
node <SKILL_DIR>/scripts/transcribe.mjs --input talk.mp4 --out talk.transcribe.json
```

The contract is:

```text
short media -> VidMuse ASR ---------------------------> recognized text
long media  -> WAV chunks -> per-chunk ASR -> dedupe -> recognized text
provided/corrected text ---------------------------------------|
                                                               v
original media + recognized text -> VidMuse ATA -> word timestamps
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

ASR calls retry transient CLI/API failures twice by default with exponential
backoff, for at most three attempts. Deterministic authentication, credit,
validation, and unsupported-model failures return immediately. Override the
number of retries with `--asr-retries`.

Local media longer than five minutes is automatically split into temporary
16 kHz mono PCM WAV chunks, each at most five minutes (about 9.6 MB), with a
two-second overlap. ASR runs independently on every chunk and the overlap is
deduplicated before ATA aligns the merged text against the original media.
Temporary chunks are always removed. Tune the threshold/size with
`--asr-chunk-seconds` and overlap with `--asr-chunk-overlap`.
