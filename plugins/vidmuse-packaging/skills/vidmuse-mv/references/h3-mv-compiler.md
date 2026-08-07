# H3 MV prompt compiler

Use this reference to translate one approved MV generation clip into one H3 request. A generation clip is one provider call and one Timeline item; it may contain one or several explicitly timed internal `[Shot N]` shots. Query the live VidMuse model catalog before every paid run; the catalog, not this document, is authoritative for supported fields, duration, resolution, aspect ratio, input count, media format, and price.

This routing adapts the compositional ideas in MiniMax's official H3 material rather than copying its examples:

- [H3 prompt-writing skill](https://github.com/MiniMax-AI/MiniMax-H3/blob/main/skills/h3-prompt-writing/SKILL.md)
- [Base prompt guide](https://github.com/MiniMax-AI/MiniMax-H3/blob/main/skills/h3-prompt-writing/references/base-en.txt)
- [Full-reference prompt guide](https://github.com/MiniMax-AI/MiniMax-H3/blob/main/skills/h3-prompt-writing/references/ref-en.txt)
- [MV and lyric-animation workflow](https://github.com/MiniMax-AI/MiniMax-H3/blob/main/skills/mv-subtitle-skill-confirmed/SKILL.cn.md)

## Clip variables

Resolve these variables from the actual storyboard. Omit irrelevant values instead of filling them with generic prose.

| Variable | Meaning |
| --- | --- |
| `CLIP_ID` | stable generation and Timeline identifier |
| `TIMELINE_SPAN` | exact start and end on the immutable master audio |
| `TIMELINE_DURATION` | exact duration used in Timeline |
| `H3_DURATION` | live-supported integer duration that covers the Timeline span |
| `CLIP_FUNCTIONS` | performance, narrative, atmosphere, typography, visualizer, or transition roles inside the clip |
| `INTERNAL_SHOT_MAP` | ordered `[Shot N]` plan with composition, action, camera, audio cue, and transition; timestamps are optional and normally omitted for audio-referenced clips |
| `CUT_DENSITY` | restrained, moderate, or rapid, derived from phrase structure and energy rather than a fixed quota |
| `PERFORMANCE_MODE` | singing/lip-sync, speaking, acting, reacting, dancing, or none |
| `CONTINUITY_IDS` | approved Character, Look, Location, and Prop IDs active in this clip |
| `REFERENCES` | only the identity, scene, object, wardrobe, motion, or typography inputs needed by this clip |
| `AUDIO_INTENT` | vocal articulation, phrase performance, rhythm/beat, mood, or none |
| `LOCKED_LYRICS` | exact per-internal-shot lyrics in the source language, or empty for instrumental shots |
| `MUST_LAND` | small ordered set of beat, word, gesture, camera, typography, and transition events |
| `CONTINUITY_IN` | identity and state inherited from the previous approved clip |
| `CONTINUITY_OUT` | visible state the next clip should inherit |
| `CREATIVE_FREEDOM` | staging, metaphor, motion, camera, or environmental details H3 may invent |

## Choose the request mode

| Clip need | H3 generation type | Inputs | Consequence |
| --- | --- | --- | --- |
| lip-sync or music-responsive performance | `reference_to_video` | exact audio segment plus identity image or element | best audio semantics; continuity comes from reference/state, not an exact tail frame |
| beat-synced narrative, lyric, atmosphere, or visualizer | `reference_to_video` | exact audio segment plus relevant visual reference | audio drives rhythm and meaning; explicitly forbid mouthing when no performer should sing |
| independently designed opening composition | `image_to_video` | approved authored keyframe | use when composition control matters more than audio response; do not extract the previous clip's tail frame automatically |
| designed visual path | `images_to_video` or another live keyframe mode | independently authored start/end images allowed by live schema | use when a planned transformation matters more than audio response |
| unconstrained establishing image | `text_to_video` | prompt only | use only when identity and seam continuity are unimportant |

Never send audio alone to `reference_to_video`. Do not mix keyframe-specific fields with multi-modal reference fields unless the live schema explicitly permits it.

Do not use a previous generated clip's extracted tail frame as the next clip's default first-frame input. That feedback loop often causes H3 to hold the inherited frame before motion restarts, producing a visible freeze or cadence hitch. Prefer independently generated clips joined on a breath, phrase edge, snare, drop, or other justified cut, while carrying continuity through stable references and matched direction, action, shape, color, light, prop state, or foreground occlusion. Use tail-frame continuation only for an explicitly requested uninterrupted-take extension after accepting the seam risk.

When an identity input is a white-background face close-up or full-body three-view, define the blank background and sheet arrangement as isolation metadata, not shot content. Tell H3 to preserve only the named identity traits, never reproduce the white studio, multiple views, neutral turnaround pose, borders, or sheet layout, and take the actual environment from the shot's Location ID or scene description.

## Plan shots inside one H3 request

Do not equate one H3 request with one camera shot. Resolve the clip's internal edit before writing prose:

- When reference audio is supplied, use ordered `[Shot 1]`, `[Shot 2]`, and later labels without timestamps. Describe each cut by its audible trigger—vocal pickup, breath, phrase change, snare, drop, bass hit, hi-hat roll, or final accent—and let H3 derive the actual timing from the audio.
- Use `[Shot 2] At 00:03.500, ...` only for text/keyframe modes without reference audio or when a fixed event time is genuinely required. Keep any explicit cut times strictly increasing and inside `H3_DURATION`.
- A later shot must introduce new information about viewpoint, subject, space, state, graphic layout, or time. If only distance or a slight angle changes, use camera motion inside the current shot instead.
- Let music determine density. A punchy 15-second hook often supports roughly 3–5 internal shots; a medium-energy phrase may support 2–4; a slow or intimate passage may use one evolving take. These are judgment ranges, not quotas.
- Place cuts on meaningful phrase boundaries, breaths, snares, drops, bass hits, lyric stresses, or transition sounds. Do not cut mechanically on every beat or through a held syllable.
- When the same vocal line crosses a cut, use `<scenetrans>` at the connecting lyric spans and state that the supplied audio continues uninterrupted across the cut.
- For energetic passages, prefer motivated hard cuts, jump cuts, match cuts, whip-pan cuts, flash cuts, foreground wipes, or graphic cuts. Use dissolves or fades only when the approved direction asks for softness or temporal drift.

Every internal shot needs a readable motion sentence: current composition → subject or environmental action → camera motion → visible payoff. Write camera movement as a natural action with motion type and, when meaningful, amplitude and speed. “Dynamic camera,” “cinematic motion,” and “the subject moves naturally” are not instructions.

## Compile by information density

Use the official base structure for text/keyframe modes and the official full-reference structure for multi-reference generation. Do not rename, reorder, or omit required fields.

For base text/keyframe modes, compile exactly:

1. `integrated_multimodal_description`
2. `overall_soundscape`
3. `non_diegetic_music`

For a full-reference request, compile these sections:

1. `subject_definitions`: bind stable Character, Look, Location, and Prop IDs to only the referenced performer, character, scene, object, or typography assets that appear. State each input's single role and exclude its unassigned background, pose, wardrobe, or layout.
2. `summary`: begin with the truthful task-type prefix, usually `[reference generation + audio reference]`, then summarize the target clip and main reference relationships.
3. `retention_analysis`: use the official relationship markers such as `fully_preserved`, `partially_preserved`, `attribute_transfer`, `weak_reference`, or audio `reference`; state which invariants persist and which approved state change occurs.
4. `detailed_description`: establish the overall style, then describe every `[Shot N]` in playback order with composition, subjects, environment/light, action and state changes, camera, reference use, exact vocals, and cuts.
5. `overall_soundscape`: summarize only ambience, physical sounds, and non-verbal human sounds. Do not repeat lyrics, dialogue, or audience-only music here.
6. `non_diegetic_music`: identify the supplied audio segment as the music reference, describe its tempo/rhythm/dynamic development concretely, and state that visual timing follows it without inventing replacement music.

Keep reference labels stable across all six sections. Use `<Subject N>` for reusable visible content and `<Audio N>` for the supplied music or vocal reference. Use `<Picture N>` only when an image is a concrete keyframe or composition anchor, not merely because it defines a character.

### Compact audio-referenced multi-shot pattern

Adapt the number and order of shots to the real phrase; do not copy these events literally. The supplied audio is the timing authority, so this prompt intentionally contains no shot timestamps:

```text
detailed_description:
The target clip uses a high-contrast editorial music-video style with one stable performer identity and beat-reactive spatial typography.
[Shot 1] A low wide-angle close-up places <Subject 1> against oversized black lettering. <Subject 1> (S1) sings: <d>[Language] {EXACT LOCKED LYRIC}</d>, matching <Audio 1>, while she leans into the lens and the camera pushes in at fast speed; her mouth, jaw, breath, and shoulder accents follow the phrasing.
[Shot 2] On the next bass hit, a hard cut switches to a side-profile medium shot in a red-lit corridor. The camera trucks right with large amplitude at fast speed as the same gesture continues across the cut and one exact lyric phrase strikes into the background as spatial type.
[Shot 3] As the hi-hat roll tightens into the snare, a jump cut moves to an extreme close-up. The performer snaps her gaze to camera; the typography stretches and tears behind her while the lens rolls slightly clockwise.
[Shot 4] On the final strong accent, a match cut on her raised hand reveals a full-body performance setup. The camera arcs around her at fast speed and lands on a clean silhouette.
```

## Performance and lip-sync

- Pass only the exact audio interval for the clip, including a small natural breath or lead-in when it fits inside the selected span.
- Include each exact locked phrase as `<d>[Language] 原语言歌词</d>` inside the internal shot where it is performed.
- Name the active singer and bind the voice to that subject. If several people are visible, explicitly state who sings and who only reacts.
- Describe mouth, jaw, breath, facial intensity, body gesture, and gaze as one performance tied to phrasing—not as independent animations.
- Use stronger gestures or camera changes on musically important words and accents; leave quieter syllables room.
- Do not ask for lip-sync in a narrative or atmosphere internal shot merely because vocals are present in the audio.

## Beat and narrative synchronization

- Name the few accents that visibly change state: a drop can trigger a fall, rupture, flash, reveal, cut, or camera acceleration; a sustained phrase can support continuous movement.
- Prefer phrase-scale choreography over one action per beat.
- Bind metaphors to lyric meaning only when the connection is legible. A literal lyric illustration is optional, not the default.
- Give the clip a beginning state, escalation, payoff, and outgoing state even when it contains no performer.
- Make motion come from more than lip sync: combine performer blocking, cloth or hair response, prop or environment change, parallax/depth, camera travel, reframing, light, and spatial graphics according to the Style. Do not activate every layer at once; choose the few that make the current accent legible.

## Lyric typography

- Use exact original-language words and request no extra text when typography is part of the generated scene.
- Prefer one primary lyric event per internal shot: materialized in space, written by an object, revealed by light, integrated into architecture, or transformed by motion.
- Treat generated lettering as a candidate. When a word is misspelled or delivery requires exact typography, keep the approved picture motion and replace the lettering with a deterministic Timeline/HyperFrames overlay.

## Continuity

- Repeat the stable reference identity and current wardrobe/scene state, not a long physical description already supplied by the image.
- Carry at least one visible bridge across every cut: pose direction, gaze, screen movement, prop, silhouette, dominant color, light source, camera vector, or shape.
- Record the outgoing state after each approved clip and compile it into the next clip's `CONTINUITY_IN`.
- Within one H3 request, describe action, audio, and visual bridges directly across `[Shot N]` cuts.
- Across independently generated clips, prefer editorial continuity and stable Character/Look/Location/Prop references over tail-frame feedback. A hard cut can be seamless in rhythm without being a literal frame continuation.

## Current request shape

The exact live schema may change. A current audio-driven request has this conceptual shape:

```json
{
  "model_name": "minimax/hailuo-h3",
  "generation_type": "reference_to_video",
  "prompt": "<compiled official H3 multi-shot structure with exact source-language lyrics>",
  "image_urls": ["/absolute/path/character.png"],
  "audios": ["/absolute/path/clip-01.mp3"],
  "duration": 15,
  "resolution": "<live-supported value>",
  "aspect_ratio": "16:9"
}
```

Use explicit canonical `generation_type`. Do not add `negative_prompt`, `guidance_scale`, voice/avatar fields, custom watermark fields, or speculative parameters that the live H3 catalog does not list. Keep generated audio disabled or omitted so the Timeline master audio remains authoritative.

At the time this reference was authored, the live catalog reported up to 9 images, 3 videos, and 3 audio files; audio limited to MP3/WAV; visual reference video limited to H.264/H.265 MP4/MOV; each reference audio/video interval between 2 and 15 seconds; total reference audio and video duration no more than 15 seconds; and generated durations of 5–15 integer seconds. Verify all of these again before use.
