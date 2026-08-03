---
name: vidmuse-media
description: "Produce the minimal verified media artifacts required by VidMuse film workflows: probe local audio/video metadata, extract audio, synthesize narration with VidMuse TTS, transcribe with VidMuse ASR, align a transcript or locked script to explicit word timestamps, validate or normalize the official flat transcript.json contract, derive safe-length Timeline subtitles or optional SRT, and extract representative source frames. Also use for these operations as standalone deliverables. Do not decide story, packaging, placement, visual direction, script wording, or voice casting, and do not claim unimplemented generation or transformation capabilities."
---

# VidMuse Media

Turn one exact media operation into a verified local artifact. Own execution and data integrity; let the calling film skill decide why the artifact is needed and how it is used.

## Scope

Implement:

1. `probe`
2. `extract-audio`
3. `text-to-speech`
4. `transcribe-and-align`
5. `transcript-to-srt`
6. `transcript-to-timeline-subtitles`
7. `extract-frames`

Do not expand a request into BGM, SFX, image/video generation, download, trim, crop, reframe, background removal, or grading in this version.

Own every media model call a film workflow needs. A film owner decides *whether* narration is generated, in what voice, and from what script; this skill decides nothing editorial and only executes the call, verifies the artifact, and returns it. When a caller needs a media operation that is not in this list, report the exact missing capability rather than routing around this skill.

## Output contracts

| operation | canonical result |
| --- | --- |
| probe | `metadata.json` from ffprobe with format and stream metadata |
| extract audio | `audio.mp3`, first program-audio stream, mono 16 kHz |
| TTS | `narration.mp3` plus the complete raw response as `tts.raw.json` |
| ASR | raw JSON containing a non-empty `text` string |
| alignment | raw provider JSON retained until its exact structure is inspected |
| transcript | flat `transcript.json`: `[{"text":"word","start":0.0,"end":0.2}]` in seconds |
| subtitles | `subtitles.timeline.json` for Serve review and optional `subtitles.srt`, both derived only from the validated transcript |
| frames | timestamp-named JPEG or PNG files without crop or annotation |

Never substitute SRT for `transcript.json` inside a film workflow. Treat the word-level JSON as the internal timing source and SRT as a derived interchange format.

## Preflight

- Require the input to exist, be readable, and match the requested operation.
- Resolve `ffprobe` and `ffmpeg`; use `FFPROBE_BIN` or `FFMPEG_BIN` only when explicitly supplied or safely discovered.
- Load `vidmuse-cli` for TTS, ASR, or alignment. Use its bundled binary and authentication rules.
- For a paid operation, have `vidmuse-cli` read the credit balance and estimate the cost from live `priceItems` first. State both to the caller. When the balance will not cover it, report the shortfall with `https://vidmuse.ai/en/pricing` once and let the caller decide — do not silently truncate the input, downgrade quality, or retry a call the provider rejected for insufficient credits.
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

## Synthesize narration

Generate speech only from a script the caller has already locked. Do not rewrite, trim, translate, or re-punctuate it, and do not choose the voice or model on editorial grounds — the owning workflow supplies both.

Confirm the requested voice model exists in the live catalog first, because ids move:

```bash
"$VIDMUSE_BIN" model list -o json > "$WORK_DIR/model-list.json"
```

Current voice models, all priced per second of output. Each one requires its own voice selector — this is the most common cause of a failed TTS call:

| model | use | required voice selector |
| --- | --- | --- |
| `minimax/speech-2.6-hd` | zh/en narration; default | `voice_id` from `voice list` `model_ids` |
| `index-tts-2/text-to-speech` | voice cloning from a reference recording; zh/en | `audio_url` reference; no `voice_id` |
| `elevenlabs/eleven_multilingual_v2` | scripts outside zh/en | a native ElevenLabs `voice_id`, supplied by the caller |

Every TTS request needs **both** `generation_type: "text_to_speech"` and the model's voice selector. Omitting either returns `aion api returned status 400`, surfaced by the CLI as `API error (HTTP 502)` with no field name in it. Do not read that opaque 400 as an outage, a bad script, or a missing credit — check these two fields first.

Ignore `required_params` when deciding whether to send `generation_type`. All three voice models report `required_params: {}`, and that empty object is not permission to omit the route; Aion still rejects the request. `supported_params` remains a useful signal for which *optional* fields a model accepts.

### Resolve the voice id first

For `minimax/speech-2.6-hd`, `voice_id` must be the **model-specific** id under `model_ids["minimax/speech-2.6-hd"]`, not the catalog `voice_id` such as `M-ZH-002`. Passing the catalog id is rejected with the same opaque 400.

`voice list` defaults to a page size of 20, which currently returns English voices only. Always pass an explicit `--limit` before concluding a language is unavailable:

```bash
"$VIDMUSE_BIN" voice list -o json --limit 200 > "$WORK_DIR/voice-list.json"
```

Resolve the caller's chosen catalog id to the model id, and fail loudly rather than guessing a voice:

```bash
VOICE_ID="$(python3 -c '
import json, sys
voices = json.load(open(sys.argv[1], encoding="utf-8"))["data"]
wanted, model = sys.argv[2], sys.argv[3]
for v in voices:
    if v["voice_id"] == wanted:
        resolved = (v.get("model_ids") or {}).get(model)
        if not resolved:
            sys.exit(f"voice {wanted} has no id for {model}")
        print(resolved)
        break
else:
    sys.exit(f"voice {wanted} not in catalog")' \
  "$WORK_DIR/voice-list.json" "$CATALOG_VOICE_ID" "$VOICE_MODEL")"
```

### Call the model

Serialize the JSON with a real encoder:

```bash
"$VIDMUSE_BIN" model run -o json --param "$(python3 -c '
import json, sys
print(json.dumps({
    "model_name": sys.argv[1],
    "generation_type": "text_to_speech",
    "prompt": open(sys.argv[2], encoding="utf-8").read().strip(),
    "voice_id": sys.argv[3],
}, ensure_ascii=False))' "$VOICE_MODEL" "$WORK_DIR/script.txt" "$VOICE_ID")" \
  > "$WORK_DIR/tts.raw.json"
```

For `index-tts-2/text-to-speech`, drop `voice_id` and pass the caller's reference recording as `audio_url` plus `language` (`zh` or `en`). Add `language` to the other models only when the caller supplied it and `supported_params` lists it.

Save the complete response as `tts.raw.json` before interpreting it. A successful voice run returns a bare JSON array of public URLs — `["https://.../a141ccbc632ac1d3.mp3"]` — with no wrapper object and no task id, so read element `0` rather than looking for an `audio_url` or `data` key. Download it to `$WORK_DIR/narration.mp3`. Never synthesize silence, substitute OS or browser TTS, or fabricate a duration when the shape is unclear — report the unexpected response instead.

After writing the file, probe it and require a nonzero duration and at least one audio stream. Return the local path, the measured duration, and the model name to the caller. Regenerated narration invalidates any existing alignment: when the script or voice changes, the caller must re-align, and a stale `transcript.json` is a defect.

## Transcribe and align

Use two distinct VidMuse CLI calls. Serialize request JSON with a real JSON encoder; never construct it by interpolating unescaped paths or transcript text.

Treat the chain as indivisible for every timed-caption workflow:

`ASR text → spelling/name correction → Doubao ATA → validated word timings → subtitle grouping`

ASR supplies language content, not trustworthy cue timing. Doubao ATA is mandatory whenever `transcript.json`, SRT, Timeline subtitles, or Serve captions are required. Never send raw ASR text directly into subtitle grouping, never reuse ASR segments as word timings, and never consider the transcription stage complete until ATA returns explicit timing.

When the audio was synthesized from a script the caller already owns, the locked script is the exact text: skip ASR and its correction pass and begin at ATA with that script as `prompt`. Everything after ATA is unchanged, and ATA remains mandatory. Do not treat an authored script as a substitute for word timing, and do not skip ASR for any recorded audio, where the spoken words are not known in advance.

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

Omit `generation_type` here. ASR and ATA are the genuine exceptions to the rule that voice calls carry a route: ASR is selected by `extra_params.sub_model_type`, and ATA by its model name alone. Do not copy `text_to_speech` into either request.

Save the complete ASR response as `asr.raw.json` and the complete alignment response as `ata.raw.json` before interpreting either one. Their presence is the audit trail that prevents an ASR-only run from silently reaching Serve.

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
- Do not decide whether narration should exist, how the script reads, or which voice suits the film; execute the call the owner specifies.
- Do not replace VidMuse TTS/ASR/alignment with HyperFrames transcription or synthesis, OS or browser TTS, downloaded local models, or guessed timings.
- Route visual interpretation of extracted frames back to `vidmuse-recut` or the owning film skill.
- Route DSL preview and render to `vidmuse-timeline` through `vidmuse-cli`.
