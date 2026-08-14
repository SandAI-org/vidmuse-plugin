# Seedance 2.5 MV production SOP

Use this reference for every `vidmuse-mv` picture-generation chapter. It captures the production path that produced a coherent 30-second Rap/R&B climax with multi-shot action, transitions, English lip-sync, instrument performance, stable identity, and exact master-audio timing.

Query the live VidMuse catalog before every paid run. The live schema, provider validation, price, and account balance override remembered values in this document.

## Proven default

- Use `seedance-2.5` as the default MV picture model when the live catalog still supports the required inputs.
- For an excerpt, hook, or climax that fits the live duration limit, prefer one continuous 20–30 second multi-shot request over several short generated clips.
- For a longer MV, divide the song into musically complete chapters, normally at section or phrase boundaries. Generate one chapter at a time and assemble them over the unchanged master audio.
- Default to `16:9` and the strongest affordable live resolution. The validated production path used `720p`, 1280×720 output, and 24 fps.
- Keep generated video muted. The immutable Timeline master audio remains the sole program-audio path.

One long request gives Seedance enough context to carry identity, geography, performance, camera direction, and motivated transitions across a full musical arc. Do not use the duration limit as permission to stretch a static scene; a long chapter still needs several meaningful internal shots.

## Chapter variables

Resolve these values from `MV-SCRIPT.md` before compiling the request:

| Variable | Meaning |
| --- | --- |
| `CHAPTER_ID` | stable generation and Timeline identifier |
| `TIMELINE_SPAN` | exact start and end on the immutable master audio |
| `REQUEST_DURATION` | live-supported duration covering the span |
| `LOCKED_LYRICS` | exact words performed in each internal shot |
| `INTERNAL_SHOT_MAP` | ordered shots with composition, action, performance, camera, cue, and transition |
| `CONTINUITY_IDS` | active Character, Look, Location, and Prop IDs |
| `ELEMENT_ROLES` | ordered `@ElementN` bindings with exactly one role per input |
| `MUST_LAND` | few important lyric, beat, gesture, camera, type, and transition events |
| `CONTINUITY_IN` | visible state entering the chapter |
| `CONTINUITY_OUT` | visible state leaving the chapter |
| `MODEL_FREEDOM` | staging, environment, camera, transition, or graphic details Seedance may invent |

Prefer chapter boundaries at a section change, breath, phrase end, downbeat, drop, or other musical closure. Never cut through a held syllable merely to fill a round duration.

## Lock the audio input

1. Extract the exact chapter interval from `media/master-audio.mp3` without changing speed or pitch.
2. Probe the segment and require a finite positive duration matching `TIMELINE_SPAN`.
3. Try direct audio only when the live schema and provider validation accept the complete interval.
4. If the provider rejects the full interval, accepts only one shorter audio, or reports a direct-audio limit below the chapter duration, wrap the exact audio in a pure-black reference video instead of splitting the song into mismatched audio inputs.

The catalog may advertise more audio inputs than the backend accepts. In the validated production run, the backend accepted only one direct audio input and rejected a source longer than 15 seconds, even though the catalog advertised more audio slots; the 30-second black reference video carried the complete audio successfully. Treat the actual validation response as authoritative. Do not repeatedly submit slightly different paid requests to discover the same limit.

## Build a compliant black audio-wrapper video

Use a normal HD frame, not a tiny placeholder. A 512×512 wrapper has failed Seedance's minimum reference-video pixel count; 1280×720 is the safe default for a 16:9 MV.

Conceptual command:

```bash
ffmpeg -y \
  -f lavfi -i "color=c=black:s=1280x720:r=24:d=${DURATION}" \
  -i "$AUDIO_SEGMENT" \
  -map 0:v:0 -map 1:a:0 \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -r 24 \
  -c:a aac -b:a 192k \
  -t "$DURATION" -shortest -movflags +faststart \
  "$WRAPPER_VIDEO"
```

Probe the wrapper before upload and require:

- H.264 video plus AAC audio in MP4;
- 1280×720, square pixels, and a provider-supported frame rate such as 24 fps;
- duration equal to the chapter audio within normal container tolerance;
- non-empty stereo or mono audio;
- file size and total reference duration inside the live model limits;
- pixel count inside the live provider range. The observed minimum was 407,696 pixels, so 512×512 is invalid while 1280×720 is safely above it.

Upload or otherwise resolve the wrapper to a public VidMuse asset URL before the paid model call. Record the local path, public URL, duration, dimensions, codecs, and source-audio span in `MV-SCRIPT.md`.

## Bind ordered elements

Use the minimum references needed for continuity. A proven order is:

1. `@Element1`: character identity and primary wardrobe sheet;
2. `@Element2`: recurring hero prop, vehicle, instrument, or location anchor;
3. `@Element3`: pure-black audio-wrapper video.

State each role in the first paragraph of the prompt. For an identity sheet, tell Seedance to preserve the named person and wardrobe while ignoring the white background, turnaround layout, borders, labels, neutral poses, and duplicated views. For the audio wrapper, use explicit language equivalent to:

> `@Element3` is a black reference video whose embedded audio is the exact timing, lyric, lip-sync, performance, and edit spine. Use its audio continuously from beginning to end, but ignore its featureless black visual frames completely.

Do not pass every available reference into every chapter. Extra elements dilute role clarity and can compete with performance fidelity.

## Compile the multi-shot prompt

Use an English control wrapper for reliable instruction following. Organize the prompt in this order:

1. one-sentence deliverable, duration, aspect ratio, genre, and audio-synchronization goal;
2. ordered `@ElementN` roles and continuity invariants;
3. visual world, realism/stylization target, palette, light, texture, and exclusions;
4. optional generated-typography policy;
5. ordered `[Shot N]` blocks with exact performed lyrics;
6. editing, transition, motion, audio, and soundtrack rules.

For each internal shot, write:

- current composition and lens or framing;
- visible performer, prop, environment, and continuity state;
- specific physical action or performance process;
- camera motion with direction, amplitude, and speed when meaningful;
- exact source-language lyric performed in that shot;
- the audible phrase, bass hit, snare, breath, pickup, drop, or sustained note that motivates the cut;
- the transition into the next shot and the new information it reveals.

Use semantic musical cues instead of timestamps when the embedded audio is the timing authority. Make every cut reveal a new viewpoint, space, action, state, graphic layout, or time. When only distance or angle changes, animate the camera inside the current shot rather than pretending it is a new shot.

### Motion and transition vocabulary

For high-energy Rap, R&B, pop, dance, or rock passages, useful motivated transitions include:

- hard cut on a bass hit or phrase start;
- jump cut that reveals a genuinely closer or changed composition;
- whip-pan following a head turn, hand strike, or moving vehicle;
- practical flash or headlight flare;
- foreground pillar, body, instrument, rain-spray, or car-pass occlusion;
- shape, road-line, string, mirror, gaze, or match-action cut.

Do not request impossible driving, unsafe loss of control, fantasy physics, or generic “dynamic cinematic” movement. Describe the concrete motion and its payoff.

## Lip-sync and instrument performance

- Include the exact locked lyric in every shot where the performer sings or raps.
- Bind mouth, jaw, breath, facial intensity, gaze, shoulders, hands, and body accents to the same phrase performance.
- State who sings when several people are visible; everyone else acts or reacts without mouthing the lyric.
- For guitar, drums, keys, or another instrument, describe plausible fretting, strumming, striking, fingering, or body mechanics tied to the groove.
- Do not require lip-sync in a pure narrative, atmosphere, road, or insert shot merely because vocals continue in the reference audio.

Lip-sync is the first acceptance criterion for performance chapters. If a retry improves typography but causes visible mouth drift, keep the stronger performance take.

## Model-native lyric typography

Generated typography is optional picture content, not a reliable spelling system.

- Keep model-native text to a few short, high-value words or phrases.
- Place each phrase at the moment the same words are sung and keep it away from the performer's mouth.
- Integrate it with a road line, mirror, pillar, headlight flare, environmental plane, or transition only when that supports readability.
- Do not ask for many mandatory exact phrases while also demanding dense cuts, identity continuity, instrument mechanics, and precise lip-sync. These goals compete for model attention.
- When text is absent or misspelled but the performance is strong, preserve the generated picture and use a deterministic Timeline/HyperFrames overlay after the user approves the take.

A typography-heavy retry is a separate creative candidate. Never overwrite the better lip-sync take automatically.

## Current conceptual request shape

The live schema may change. A proven audio-wrapper request has this shape:

```json
{
  "model_name": "seedance-2.5",
  "generation_type": "reference_to_video",
  "duration": 30,
  "resolution": "720p",
  "aspect_ratio": "16:9",
  "generate_audio": false,
  "prompt": "<English multi-shot MV prompt>",
  "elements": [
    {"frontal_image_url": "<identity sheet URL>"},
    {"frontal_image_url": "<prop or location URL>"},
    {"video_url": "<black audio-wrapper video URL>"}
  ]
}
```

Use only fields exposed by the live catalog. Keep `generate_audio` false or omit it when allowed; the Timeline master audio is authoritative. Do not add speculative negative-prompt, guidance, avatar, voice, watermark, or provider-specific fields.

Before submission, query the live model entry and record:

- supported duration, aspect ratio, resolution, generation types, reference counts, formats, and size limits;
- reference-video duration and pixel constraints;
- price item and any discount rate;
- current account balance;
- estimated charge for the requested seconds and the approved retry allowance.

The validated run exposed 4–30 second output durations, a 30-second reference-video ceiling, and a 720p list price of 23 Credits/second with a `0.3` discount rate, producing an observed 207-Credit charge for one successful 30-second request. These numbers are evidence, not constants; always recompute from the current catalog.

## Submit asynchronously and wait safely

Long 30-second multi-shot requests can outlive a synchronous HTTP request. Use the async route and preserve the returned task ID immediately.

1. Submit once with `vidmuse model run --async`.
2. Save the task ID beside the resolved prompt and request receipt.
3. Query that same ID with `vidmuse model result`.
4. Treat `did not complete within 1200 seconds`, HTTP 502, or HTTP 504 as an indeterminate wait result, not proof that generation failed.
5. Continue polling the same task at a measured interval. Do not submit another paid request merely because a result poll timed out.
6. Check the account balance and generated-asset list when state is ambiguous.

Interpret ambiguous state conservatively:

- credits still deducted and no explicit terminal error: keep waiting;
- a new generated video asset appears after submission: retrieve and probe it before considering another call;
- credits restored, no new asset exists, and the same task repeatedly returns the completed timeout/error state: record the refund and terminal failure, then one documented resubmission is allowed within the approved retry budget;
- provider rejects a reference on dimensions, pixels, duration, format, or count: fix only that input, verify the refund, and resubmit once. Do not change creative direction at the same time.

Never run parallel duplicate generations for the same chapter. Preserve rejected, failed, or alternate task IDs and receipts in `MV-SCRIPT.md`.

## Download, Timeline, and delivery

1. Download the returned public URL to `clips/<chapter-id>.mp4`.
2. Probe only structure before the user sees it: readable container, finite duration, video codec, dimensions, frame rate, and whether native audio exists.
3. Append or replace the stable chapter ID in `dsl.json`; mute the generated video.
4. Keep the unchanged master audio as the only Timeline sound.
5. Validate the DSL and surface the updated Timeline before Agent-led aesthetic inspection or autonomous retry.
6. After approval, render and probe the final output for exact duration, canvas, frame rate, H.264 video, and AAC audio.

Seedance may return a silent video even when it followed the embedded audio for timing. This is acceptable and expected; mux the immutable master audio during Timeline render rather than trying to preserve provider audio.

## Retry ladder

Change one failed dimension at a time:

1. invalid wrapper or reference media → rebuild only the wrapper/reference;
2. weak identity → simplify element set and strengthen identity role binding;
3. weak lip-sync → reduce competing actions or typography and sharpen exact lyric/performance instructions;
4. flat motion → improve shot actions, camera amplitude, and motivated transitions;
5. missing or misspelled type → prefer deterministic overlay; use a typography-heavy regeneration only when the user explicitly values model-native lettering over performance risk;
6. chapter seam problem → revise continuity-out/in and transition logic, not the entire song treatment.

Preserve every candidate and never replace an approved take silently.
