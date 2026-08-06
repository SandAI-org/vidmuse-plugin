# H3 MV prompt compiler

Use this reference to translate one approved MV shot into one H3 request. Query the live VidMuse model catalog before every paid run; the catalog, not this document, is authoritative for supported fields, duration, resolution, aspect ratio, input count, media format, and price.

This routing adapts the compositional ideas in MiniMax's official H3 material rather than copying its examples:

- [H3 prompt skill](https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills)
- [Base prompt guide](https://github.com/MiniMax-AI/MiniMax-H3/blob/main/skills/minimax-h3-prompt-skill/references/base-en.md)
- [Multi-modal reference guide](https://github.com/MiniMax-AI/MiniMax-H3/blob/main/skills/minimax-h3-prompt-skill/references/ref-en.md)
- [MV and lyric-animation workflow](https://github.com/MiniMax-AI/MiniMax-H3/blob/main/skills/mv-subtitle-skill-confirmed/SKILL.cn.md)

## Shot variables

Resolve these variables from the actual storyboard. Omit irrelevant values instead of filling them with generic prose.

| Variable | Meaning |
| --- | --- |
| `TIMELINE_SPAN` | exact start and end on the immutable master audio |
| `TIMELINE_DURATION` | exact duration used in Timeline |
| `H3_DURATION` | live-supported integer duration that covers the Timeline span |
| `SHOT_FUNCTION` | performance, narrative, atmosphere, typography, visualizer, or transition |
| `PERFORMANCE_MODE` | singing/lip-sync, speaking, acting, reacting, dancing, or none |
| `REFERENCES` | only the identity, scene, object, wardrobe, or typography inputs needed by this shot |
| `AUDIO_INTENT` | vocal articulation, phrase performance, rhythm/beat, mood, or none |
| `LOCKED_LYRIC` | exact matching lyric in the source language, or empty for an instrumental shot |
| `MUST_LAND` | small ordered set of beat, word, gesture, camera, typography, and transition events |
| `CONTINUITY_IN` | identity and state inherited from the previous approved shot |
| `CONTINUITY_OUT` | visible state the next shot should inherit |
| `CREATIVE_FREEDOM` | staging, metaphor, motion, camera, or environmental details H3 may invent |

## Choose the request mode

| Shot need | H3 generation type | Inputs | Consequence |
| --- | --- | --- | --- |
| lip-sync or music-responsive performance | `reference_to_video` | exact audio segment plus identity image or element | best audio semantics; continuity comes from reference/state, not an exact tail frame |
| beat-synced narrative, lyric, atmosphere, or visualizer | `reference_to_video` | exact audio segment plus relevant visual reference | audio drives rhythm and meaning; explicitly forbid mouthing when no performer should sing |
| exact incoming-frame continuation | `image_to_video` | approved incoming or tail frame | strongest visual seam; master Timeline audio supplies music because keyframe and multi-modal audio modes may be mutually exclusive |
| identity-led silent motion | `image_to_video` or `images_to_video` | identity/start/end images allowed by live schema | use when audio response is less important than shape or pose continuity |
| unconstrained establishing image | `text_to_video` | prompt only | use only when identity and seam continuity are unimportant |

Never send audio alone to `reference_to_video`. Do not mix keyframe-specific fields with multi-modal reference fields unless the live schema explicitly permits it.

## Compile by information density

Use a compact natural prompt for a simple shot. Use the full-reference structure when a shot has several references, locked performance, multiple timed events, spatial lyric typography, or a continuity handoff.

For a full-reference request, compile these sections:

1. `subject_definitions`: bind stable names to only the referenced performer, character, scene, object, or typography assets that appear.
2. `summary`: one sentence covering duration, shot function, visual arc, camera intent, and ending state.
3. `retention_analysis`: state which identity and scene traits must be preserved and which details may change.
4. `detailed_description`: describe events in time order, anchored to phrases, accents, or approximate intervals. Give every event a cause and visible result.
5. `overall_soundscape`: explain how vocal, breath, beats, and accents drive visible action. Do not request replacement music or duplicate dialogue.
6. `non_diegetic_music`: state that the supplied reference audio is the immutable music spine and that the shot should synchronize to it without creating a new soundtrack.

These are semantic sections, not a fixed wording template. Vary their contents and omit empty sections when the live task is simple.

## Performance and lip-sync

- Pass only the exact audio interval for the shot, including a small natural breath or lead-in when it fits inside the selected span.
- Include the exact locked phrase as `<d>原语言歌词</d>` so articulation is unambiguous.
- Name the active singer and bind the voice to that subject. If several people are visible, explicitly state who sings and who only reacts.
- Describe mouth, jaw, breath, facial intensity, body gesture, and gaze as one performance tied to phrasing—not as independent animations.
- Use stronger gestures or camera changes on musically important words and accents; leave quieter syllables room.
- Do not ask for lip-sync in a narrative or atmosphere shot merely because vocals are present in the audio.

## Beat and narrative synchronization

- Name the few accents that visibly change state: a drop can trigger a fall, rupture, flash, reveal, cut, or camera acceleration; a sustained phrase can support continuous movement.
- Prefer phrase-scale choreography over one action per beat.
- Bind metaphors to lyric meaning only when the connection is legible. A literal lyric illustration is optional, not the default.
- Give a shot a beginning state, development, payoff, and outgoing state even when it contains no performer.

## Lyric typography

- Use exact original-language words and request no extra text when typography is part of the generated scene.
- Prefer one primary lyric event per shot: materialized in space, written by an object, revealed by light, integrated into architecture, or transformed by motion.
- Treat generated lettering as a candidate. When a word is misspelled or delivery requires exact typography, keep the approved picture motion and replace the lettering with a deterministic Timeline/HyperFrames overlay.

## Continuity

- Repeat the stable reference identity and current wardrobe/scene state, not a long physical description already supplied by the image.
- Carry at least one visible bridge across every cut: pose direction, gaze, screen movement, prop, silhouette, dominant color, light source, camera vector, or shape.
- Record the outgoing state after each approved shot and compile it into the next shot's `CONTINUITY_IN`.
- For performance shots that need audio reference, use identity and state continuity; do not pretend to have exact tail-frame control.
- Reserve tail-frame image-to-video continuation for non-performance seams where exact spatial continuity matters more than live audio response.

## Current request shape

The exact live schema may change. A current audio-driven request has this conceptual shape:

```json
{
  "model_name": "minimax/hailuo-h3",
  "generation_type": "reference_to_video",
  "prompt": "<compiled English control prompt with exact source-language lyrics>",
  "image_urls": ["/absolute/path/character.png"],
  "audios": ["/absolute/path/shot-01.mp3"],
  "duration": 8,
  "resolution": "<live-supported value>",
  "aspect_ratio": "9:16"
}
```

Use explicit canonical `generation_type`. Do not add `negative_prompt`, `guidance_scale`, voice/avatar fields, custom watermark fields, or speculative parameters that the live H3 catalog does not list. Keep generated audio disabled or omitted so the Timeline master audio remains authoritative.

At the time this reference was authored, the live catalog reported up to 9 images, 3 videos, and 3 audio files; audio limited to MP3/WAV; visual reference video limited to H.264/H.265 MP4/MOV; each reference audio/video interval between 2 and 15 seconds; total reference audio and video duration no more than 15 seconds; and generated durations of 5–15 integer seconds. Verify all of these again before use.
