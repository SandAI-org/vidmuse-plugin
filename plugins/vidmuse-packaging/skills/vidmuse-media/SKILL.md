---
name: vidmuse-media
description: "Produce the minimal verified media artifacts required by VidMuse film workflows: probe local audio/video metadata, extract audio, synthesize narration with VidMuse TTS, transcribe to native word timestamps, optionally verify transcript text, align a supplied transcript or locked script to audio, analyze music, validate or normalize the official flat transcript.json contract, derive safe-length Timeline subtitles or optional SRT, and extract representative source frames. Also use for these operations as standalone deliverables. Do not decide story, packaging, placement, visual direction, script wording, or voice casting, and do not claim unimplemented generation or transformation capabilities."
---

# VidMuse Media

Turn one exact media operation into a verified local artifact. Own execution and data integrity; let the calling film skill decide why the artifact is needed and how it is used.

## Scope

Implement:

1. `probe`
2. `extract-audio`
3. `text-to-speech`
4. `transcribe`
5. `verify-transcript`
6. `align-transcript`
7. `analyze-music`
8. `transcript-to-srt`
9. `transcript-to-timeline-subtitles`
10. `extract-frames`

These are atomic operations. Do not make `transcribe` automatically call verification or alignment, and do not make `analyze-music` generate, select, download, or edit music. Do not expand a request into BGM, SFX, image/video generation, download, trim, crop, reframe, background removal, or grading in this version.

Own every media model call a film workflow needs. A film owner decides *whether* narration is generated, in what voice, and from what script; this skill decides nothing editorial and only executes the call, verifies the artifact, and returns it. When a caller needs a media operation that is not in this list, report the exact missing capability rather than routing around this skill.

## Output contracts

| operation | canonical result |
| --- | --- |
| probe | `metadata.json` from ffprobe with format and stream metadata |
| extract audio | `audio.mp3`, first program-audio stream, mono 16 kHz |
| TTS | `narration.mp3` plus the complete raw response as `tts.raw.json` |
| transcribe | complete outer response as `asr.raw.json`, non-empty text as `asr.txt`, optional decoded object as `asr.provider.json`, and `transcript.json` only when the response actually contains valid word timing |
| transcript verification | complete Gemini response as `asr.verify.raw.json` plus untimed review text; never a timing source |
| alignment | complete provider response as `ata.raw.json` and validated `transcript.json` from explicit alignment timing |
| music analysis | complete tool response as `music-analysis.json` |
| transcript | flat `transcript.json`: `[{"text":"word","start":0.0,"end":0.2}]` in seconds |
| subtitles | `subtitles.timeline.json` for Serve review and optional `subtitles.srt`, both derived only from the validated transcript |
| frames | timestamp-named JPEG or PNG files without crop or annotation |

Never substitute SRT for `transcript.json` inside a film workflow. Treat the word-level JSON as the internal timing source and SRT as a derived interchange format.

## Preflight

- Require the input to exist, be readable, and match the requested operation.
- Resolve `ffprobe` and `ffmpeg`; use `FFPROBE_BIN` or `FFMPEG_BIN` only when explicitly supplied or safely discovered.
- Load `vidmuse-cli` for TTS, ASR, alignment, or music analysis. Use its PATH resolution or official installation flow, explicit production endpoint, and production-account authentication rules.
- For a paid operation, have `vidmuse-cli` read the production credit balance and estimate the cost from live `priceItems` first. State both to the caller. If a callable route exposes no price metadata, state that the estimate is unavailable and record the before/after balance delta after an authorized call. When the balance will not cover a known estimate, report the shortfall with `https://vidmuse.ai/en/pricing` once and let the caller decide — do not silently truncate the input, downgrade quality, or retry a call the provider rejected for insufficient credits.
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
env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" model list -o json > "$WORK_DIR/model-list.json"
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
env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" voice list -o json --limit 200 > "$WORK_DIR/voice-list.json"
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
env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" model run -o json --param "$(python3 -c '
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

After writing the file, probe it and require a nonzero duration and at least one audio stream. Return the local path, the measured duration, and the model name to the caller. Regenerated narration invalidates timing derived from the previous audio: when the script or voice changes, the caller must re-align, and a stale `transcript.json` is a defect.

## Transcription, verification, and alignment are atomic

Serialize request JSON with a real JSON encoder; never construct it by interpolating unescaped paths or transcript text. Run only the operation requested by the caller.

### Transcribe and preserve timestamps when returned

Use `scribe-v2` as the default ASR. Send only the documented ASR routing fields:

```json
{
  "model_name": "scribe-v2",
  "files": ["/absolute/path/audio.mp3"],
  "extra_params": {"sub_model_type": "asr"}
}
```

Do not include `prompt`, `messages`, language, timestamp, diarization, or generation controls unless current live metadata explicitly exposes such a field. Save the complete stdout as `asr.raw.json`. Require a non-empty top-level `text`. If that string is valid JSON and decodes to an object, save the object as `asr.provider.json`; otherwise preserve it directly as `asr.txt`.

When the decoded response includes a non-empty ordered `words` array whose entries have non-empty `text` and finite numeric `start` and `end` values in seconds, copy only those explicit fields into `transcript.candidate.json`, then normalize it. Do not infer timings from segments or distribute durations across words.

If `scribe-v2` returns non-empty text without valid word timing, transcription succeeded but timestamped transcription did not. Retain the text and raw response, do not create `transcript.json`, and report the timing gap explicitly. Do not silently retry with Gemini or alignment: each is a separate paid operation with different input and output semantics. Alignment becomes available only after the user or owning workflow accepts exact text for alignment and authorizes that separate call.

### Verify transcript text with Gemini

Use Gemini only when the user actively asks to verify, check, or correct subtitles/transcript text. It is an optional text-only comparison pass, not the default transcription provider and not an automatic fallback after `scribe-v2` failure. Have `vidmuse-cli` confirm and explicitly request the enabled Gemini model; the current fallback is `gemini-3.1-pro`.

Save the complete response as `asr.verify.raw.json` and require a non-empty untimed text result. Return that text as a correction candidate alongside the current `transcript.json`; never claim it has word timing or replace the timestamped transcript automatically. Apply only user-approved or unambiguous text corrections that preserve the spoken order and the existing token's `start` and `end`. If a correction changes tokenization or wording materially, report that it needs a separately requested `align-transcript` call against the exact corrected text.

### Align exact text to audio

Use alignment only when the caller has accepted exact text plus its matching audio, especially a user-provided spoken script and recording, narration synthesized from a locked TTS script, or reviewed ASR text. Do not run it automatically after `scribe-v2`.

First confirm the live catalog contains the exact model `doubao_speech/audio_text_alignment` with subtype `ata`. Then call it with the exact transcript and matching audio:

```json
{
  "model_name": "doubao_speech/audio_text_alignment",
  "prompt": "<exact transcript or locked script>",
  "files": ["/absolute/path/audio.mp3"]
}
```

Omit `generation_type`, `messages`, and unrelated generation controls. The `prompt` must be the exact caller-supplied transcript or locked script, not text recovered implicitly from another operation.

Save the complete alignment response as `ata.raw.json` before interpreting it.

Inspect the actual response shape. Accept it only when it explicitly provides ordered word tokens with numeric start and end times and a documented time unit. Map those explicit fields to `text`, `start`, and `end` in seconds. Do not infer milliseconds versus seconds from magnitude, split segment durations evenly, or invent word timings.

If ATA is unavailable, fails, or omits explicit word timing, keep `ata.raw.json`, report the alignment failure, and do not create a new `transcript.json` from that alignment run. This failure does not invalidate an independently produced `scribe-v2` transcript.

## Normalize and validate transcript

After mapping either the decoded `scribe-v2` words or the inspected alignment response to explicit `text/start/end` fields, run:

```bash
node "$SKILL_DIR/scripts/transcript-tools.mjs" normalize \
  "$WORK_DIR/transcript.candidate.json" "$WORK_DIR/transcript.json" \
  --duration "$MEDIA_DURATION_SECONDS"
```

The normalizer accepts only a flat array or a top-level `words` array whose entries already use `text`, `start`, and `end` mapped from the inspected provider response. It converts no undocumented provider keys. It clamps small end overruns to media duration, rejects empty text, invalid or ambiguous timing, decreasing word order, and words beginning outside the media.

After correcting transcript text, change only `text`; preserve every `start` and `end` value.

## Analyze music

Analyze only an existing local audio file selected by the caller:

```bash
env VIDMUSE_BASE_URL=https://vidmuse.ai "$VIDMUSE_BIN" tool run analyze_music \
  --param "$(python3 -c 'import json, sys; print(json.dumps({"audio_path": sys.argv[1]}))' "$INPUT")" \
  -o json > "$WORK_DIR/music-analysis.json"
```

Preserve the complete response. Require a non-empty object and validate any returned temporal series before handoff: beat and downbeat times must be finite, non-negative, and ordered; `beat_positions` must correspond to the beat sequence when both are present; phrase intervals must have valid ordered bounds inside the probed media duration; rhythmic-density timestamps must be ordered. Return the available `global_features`, `beats`, `beat_positions`, `downbeats`, `phrases`, and `rhythmic_density` without inventing missing musical semantics. Treat `converted_mp3_path` as an implementation detail unless that file is explicitly verified and requested as an output.

This artifact may inform beat-led editing, MV structure, transitions, or motion anchors. It does not choose the music, require a cut on every beat, or alter the timeline by itself.

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
- Do not replace VidMuse TTS/ASR/alignment or music analysis with HyperFrames transcription or synthesis, OS or browser TTS, downloaded local models, or guessed timings.
- Route visual interpretation of extracted frames back to `vidmuse-recut` or the owning film skill.
- Route DSL preview and render to `vidmuse-timeline` through `vidmuse-cli`.
