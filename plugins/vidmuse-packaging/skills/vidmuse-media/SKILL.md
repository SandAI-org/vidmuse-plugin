---
name: vidmuse-media
description: "Produce the minimal verified media artifacts required by VidMuse speaking-video workflows: probe local audio/video metadata, extract audio, transcribe with VidMuse ASR, align the transcript to explicit word timestamps, validate or normalize the official flat transcript.json contract, derive safe-length Timeline subtitles or optional SRT, and extract representative source frames. Also use for these operations as standalone deliverables. Do not decide story, packaging, placement, visual direction, or model strategy, and do not claim unimplemented generation or transformation capabilities."
---

# VidMuse Media

Turn one exact media operation into a verified local artifact. Own execution and data integrity; let the calling film skill decide why the artifact is needed and how it is used.

## V1 scope

Implement only:

1. `probe`
2. `extract-audio`
3. `transcribe-and-align`
4. `transcript-to-srt`
5. `transcript-to-timeline-subtitles`
6. `extract-frames`

Do not expand a request into TTS, BGM, SFX, image/video generation, download, trim, crop, reframe, background removal, or grading in this version.

## Output contracts

| operation | canonical result |
| --- | --- |
| probe | `metadata.json` from ffprobe with format and stream metadata |
| extract audio | `audio.mp3`, first program-audio stream, mono 16 kHz |
| ASR | raw JSON containing a non-empty `text` string |
| alignment | raw provider JSON retained until its exact structure is inspected |
| transcript | flat `transcript.json`: `[{"text":"word","start":0.0,"end":0.2}]` in seconds |
| subtitles | `subtitles.timeline.json` for Serve review and optional `subtitles.srt`, both derived only from the validated transcript |
| frames | timestamp-named JPEG or PNG files without crop or annotation |

Never substitute SRT for `transcript.json` inside a film workflow. Treat the word-level JSON as the internal timing source and SRT as a derived interchange format.

## Preflight

- Require the input to exist, be readable, and match the requested operation.
- Resolve `ffprobe` and `ffmpeg`; use `FFPROBE_BIN` or `FFMPEG_BIN` only when explicitly supplied or safely discovered.
- Load `vidmuse-cli` only for ASR or alignment. Use its bundled binary and authentication rules.
- Use absolute input and output paths for provider calls.
- Do not overwrite an existing output unless the user or owning workflow explicitly allows it.

## Probe

Write raw, inspectable ffprobe JSON:

```bash
"${FFPROBE_BIN:-ffprobe}" -v error \
  -show_entries stream=index,codec_type,codec_name,width,height,r_frame_rate,avg_frame_rate,sample_rate,channels \
  -show_entries format=duration,format_name,bit_rate \
  -of json "$INPUT" > "$WORK_DIR/metadata.json"
```

Require a finite positive duration. Require a video stream for visual work and an audio stream for transcription. Evaluate frame-rate fractions only when a numeric fps is needed; preserve the original strings in `metadata.json`.

## Extract audio

Use the first program-audio stream and fail clearly when none exists:

```bash
"${FFMPEG_BIN:-ffmpeg}" -y -i "$INPUT" -map 0:a:0 -vn \
  -ac 1 -ar 16000 -c:a libmp3lame -q:a 2 "$WORK_DIR/audio.mp3"
```

After extraction, probe `audio.mp3` and require a nonzero duration, one audio stream, 16 kHz sample rate, and no video stream.

## Transcribe and align

Use two distinct VidMuse CLI calls. Serialize request JSON with a real JSON encoder; never construct it by interpolating unescaped paths or transcript text.

Treat the chain as indivisible for every timed-caption workflow:

`ASR text → spelling/name correction → Doubao ATA → validated word timings → subtitle grouping`

ASR supplies language content, not trustworthy cue timing. Doubao ATA is mandatory whenever `transcript.json`, SRT, Timeline subtitles, or Serve captions are required. Never send raw ASR text directly into subtitle grouping, never reuse ASR segments as word timings, and never consider the transcription stage complete until ATA returns explicit timing.

### 1. ASR text

Call `model run` with exactly one local media file:

```json
{"files":["/absolute/path/audio.mp3"],"extra_params":{"sub_model_type":"asr"}}
```

Do not include `model_name`, `prompt`, `messages`, or generation controls. Save stdout as raw JSON and require a non-empty top-level `text` string. Correct only obvious names, homophones, and technical terms before alignment; preserve the meaning and spoken order.

### 2. Audio-text alignment

First confirm the live catalog contains the exact model `doubao_speech/audio_text_alignment` with subtype `ata`. Then call it with the corrected transcript and the same audio:

```json
{
  "model_name": "doubao_speech/audio_text_alignment",
  "prompt": "<corrected transcript>",
  "files": ["/absolute/path/audio.mp3"]
}
```

Omit `generation_type`. Save the complete ASR response as `asr.raw.json` and the complete alignment response as `ata.raw.json` before interpreting either one. Their presence is the audit trail that prevents an ASR-only run from silently reaching Serve.

Inspect the actual response shape. Accept it only when it explicitly provides ordered word tokens with numeric start and end times and a documented time unit. Map those explicit fields to `text`, `start`, and `end` in seconds. Do not infer milliseconds versus seconds from magnitude, split segment durations evenly, or invent word timings.

If ATA is unavailable, fails, or omits explicit word timing, keep the ASR text and both raw responses, report the alignment failure, and do not create `transcript.json`, SRT, Timeline subtitles, or the subtitle Serve checkpoint. This is a blocking data-quality failure, not a reason to use ASR segments or fall back to a local model.

## Normalize and validate transcript

After mapping the inspected alignment response to explicit `text/start/end` fields, run:

```bash
node "$SKILL_DIR/scripts/transcript-tools.mjs" normalize \
  "$WORK_DIR/transcript.candidate.json" "$WORK_DIR/transcript.json" \
  --duration "$MEDIA_DURATION_SECONDS"
```

The normalizer accepts only a flat array or a top-level `words` array whose entries already use `text`, `start`, and `end` mapped from the inspected ATA response. It converts no undocumented provider keys. It clamps small end overruns to media duration, rejects empty text, invalid or ambiguous timing, decreasing word order, and words beginning outside the media.

After correcting transcript text, change only `text`; preserve every `start` and `end` value.

## Derive safe subtitle cues

For a speaking-video workflow, create Timeline subtitles immediately after `transcript.json` validates:

```bash
node "$SKILL_DIR/scripts/transcript-tools.mjs" timeline-subtitles \
  "$WORK_DIR/transcript.json" "$WORK_DIR/subtitles.timeline.json" \
  --duration "$MEDIA_DURATION_SECONDS" --target-chars 15 --max-chars 16
```

Target 15 characters and enforce a hard maximum of 16 Unicode characters per cue. Break earlier at sentence punctuation, a meaningful pause, or the duration limit. Never exceed the hard limit merely to preserve a phrase. If one aligned token itself exceeds 16 characters, stop and repair the provider tokenization; do not split its timing by guesswork. This conservative limit is the first defense against unexpected wrapping or overflow; the film owner must still visually inspect the actual caption rail at the output ratio.

Create SRT only when requested or required by another subtitle workflow, using the same grouping policy:

```bash
node "$SKILL_DIR/scripts/transcript-tools.mjs" srt \
  "$WORK_DIR/transcript.json" "$WORK_DIR/subtitles.srt" \
  --duration "$MEDIA_DURATION_SECONDS" --target-chars 15 --max-chars 16
```

Never run a second transcription to make either subtitle artifact.

## Extract representative frames

Let the caller provide timestamps or candidate windows. For a window-analysis request, extract its start, midpoint, and end plus additional timestamps at shot, crop, subtitle-state, camera-position, or meaningful subject-motion changes.

Extract one unmodified frame per timestamp:

```bash
"${FFMPEG_BIN:-ffmpeg}" -y -i "$INPUT" -ss "$AT_SECONDS" \
  -frames:v 1 -q:v 2 "$FRAME_DIR/frame-at-${AT_LABEL}s.jpg"
```

Do not crop, resize, annotate, detect subjects, or decide safe zones. Return frame paths and exact timestamps to the owning workflow for visual inspection.

## Verification and handoff

- Verify every expected file exists, has nonzero size, and can be probed or parsed.
- Require transcript words to remain within media duration and in spoken order.
- Report provider, input path, output path, duration, and any quality limitation without exposing credentials.
- Reuse valid existing artifacts when their source and constraints match; resume from the first missing or invalid artifact.
- Do not delete raw provider responses or source media unless the user asks.

## Boundaries

- Own exact media execution, timing integrity, file verification, and standalone outputs.
- Do not decide whether a film needs a graphic or asset, where it appears, how dense packaging should be, or how it animates.
- Do not replace VidMuse ASR/alignment with HyperFrames transcription, downloaded local models, or guessed timings.
- Route visual interpretation of extracted frames back to `vidmuse-recut` or the owning film skill.
- Route DSL preview and render to `vidmuse-timeline` through `vidmuse-cli`.
