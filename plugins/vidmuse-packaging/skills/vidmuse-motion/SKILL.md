---
name: vidmuse-motion
description: "Direct semantic motion and speech-synchronized choreography for VidMuse films. Use when a film owner needs to decide whether and how footage, picture-in-picture, diagrams, text, callouts, transitions, masks, focus changes, or AE-like effects should move; when animation feels arbitrary, simultaneous, repetitive, over-zoomed, or disconnected from narration; or when writing the motion section of FRAME.md and timed card guidance before HyperFrames implementation."
---

# VidMuse Motion

Act as the film's motion director. Convert a change in the viewer's understanding into a change on screen, synchronized to the speaker and source performance. Do not begin from an effect name.

This skill owns **why motion happens, what changes, and when**. The film owner still selects the beat and intensity; `vidmuse-design` owns the visual language; `hyperframes-animation` implements the approved choreography with a seek-safe runtime.

## Read motion evidence

Read the corrected transcript with ATA word timing, the selected beat, representative source frames across its entire interval, the approved `FRAME.md`, and any real gesture, gaze, object, camera, or edit events. Distinguish:

- **semantic events:** a subject is introduced, a number lands, a contrast turns, a cause produces an effect, a list advances, evidence appears, or a conclusion resolves;
- **performance events:** breath, pause, emphasis, gesture onset or apex, gaze shift, expression, and change of speaking energy;
- **source events:** shot, crop, camera, object, screen, subtitle, or lighting change.

Treat ATA timing as the precision rail, not the director. A timestamp says when a word occurs; the word's rhetorical function and the visible performance decide whether anything should move.

## Start from the viewer-state change

For each candidate intervention, write:

> Before this beat, the viewer understands **[state A]**. At **[spoken or visible trigger]**, the viewer should notice or understand **[state B]**. Motion expresses the change by **[relationship verb]**.

Use a relationship verb such as `reveal`, `identify`, `connect`, `branch`, `accumulate`, `compare`, `replace`, `focus`, `separate`, `merge`, `prove`, or `resolve`. If no state change or attention transfer can be named, prefer stillness.

Choose the lowest-interruption spatial strategy that makes the change clear:

- keep the source stable and annotate it when the referent already exists in the frame;
- use open whitespace or a small overlay for one compact supporting fact;
- use picture-in-picture, split, or stack when the speaker and a detailed explanation, example, screen, or comparison must remain visible together for a sustained passage;
- use a takeover when the viewer must read a structure or piece of evidence that cannot share attention with the speaker;
- transform the source camera only when the source itself contains the new focal target or a genuine rhetorical shift benefits from changed intimacy.

A source-camera transform moves every pixel and resets spatial memory, so treat it as an expensive attention intervention rather than default punctuation. Let a new framing settle and become useful before changing it again. Repeated corrective zooms usually mean the beat needs a stable picture-in-picture or graphic space instead.

## Build a cue chain, not one entrance

Never equate the card's start time with the reveal time of all its contents. Build a causal cue chain:

1. **Prepare:** establish space, an origin, or a quiet anticipation without revealing the answer early.
2. **Trigger:** attach the meaningful change to the exact word onset, pause, gesture, or source event that causes it.
3. **Respond:** let the first visible consequence follow the trigger immediately and in the same perceptual direction.
4. **Develop:** reveal later nodes, clauses, values, or comparisons at their own semantic anchors.
5. **Hold:** stop asking for attention while the viewer reads or watches the speaker complete the thought.
6. **Resolve:** remove, collapse, carry, or return the treatment when its referent expires or the argument changes.

An entrance may begin just before a spoken anchor when the eye needs preparation, but the semantic payload must not land before the speaker supplies it. Derive anticipation, attack, hold, and recovery from speech pace, reading load, motion distance, and emotional weight; do not apply one duration preset to every element.

Keep the prepare phase short and self-sufficient. Preparation establishes space or an origin measured in moments, not a surface that sits visibly unfinished while the speech catches up. If the next semantic anchor is far away — as a guide, more than about eight seconds — do not bridge the gap with an empty or heading-only container: close the treatment and re-enter at the later anchor, hand continuity to a compact persistent element such as a chapter rail or small label, or move the entrance later. Every intermediate state of the choreography must be a frame that could stand on its own; a container whose content has visibly not arrived fails this test.

Use relative cues and named timeline labels tied to words or events. Sequence dependent information in dependency order. Parallel items may arrive together only when the speech presents them as a group and the viewer can parse them together.

Never invert structural causality. A connector, arrow, path, or rail exists because of the things it connects, so it may only draw after its origin node is on screen, and its arrival must coincide with or immediately produce its destination node — the line lands, the consequence appears. Pre-drawing an entire diagram skeleton of lines, boxes-to-be, or an empty circuit and back-filling content later reads as the film waiting for itself and is always wrong. Grow a diagram along its causal path, one node → edge → node segment at a time, and route each edge as a direct readable relationship between its endpoints, not as long abstract wiring around empty canvas. When the source footage contains the referent, prefer growing the diagram out of the frame — from the speaker's gesture, the named object, or a stable edge of the subject — over floating an unanchored chart in blank space.

## Choose effects by their native meaning

Treat AE techniques as visual verbs. Select one because its physical behavior matches the content relationship and source, not because it is available.

| technique family | earns its use when | natural lifecycle |
| --- | --- | --- |
| mask, matte, wipe, crop reveal | information is uncovered, crossed, contained, or handed off directionally | originate from the concealing edge or object; continue, retract, or complete that direction |
| tracked label, spotlight, object callout | speech names something visible in the footage | grow from the referent, follow it without drift, retire when the reference ends |
| range-based text reveal or emphasis | wording, order, contrast, or one phrase is itself the evidence | reveal by phrase or word cue, hold the complete thought, clear without replaying every character |
| line draw, path, nodes, connectors | the idea is a route, dependency, process, cause, hierarchy, or flow | origin first, connection second, consequence last; resolve toward the conclusion |
| counter, bar, stack, particles-as-units | quantity changes, accumulates, distributes, or reaches a threshold | establish baseline, change with the spoken value, settle on the proof state |
| picture-in-picture, split, stack | two visual contexts must coexist or a detailed explanation needs stable space | reframe once, hold the relationship, return through the same spatial logic or cut on a real section change |
| shared-element move, match transform, morph | one entity persists while its role, scale, or context changes | keep the shared anchor visible so the viewer can follow identity across states |
| focus, blur, isolation, light or color shift | the frame contains competing information and attention must transfer | soften support, land focus on the named target, restore hierarchy after the beat |
| depth, parallax, camera move | spatial hierarchy or discovery is the message | move toward a real target, settle, then return or hand off; never oscillate for ambience |
| freeze-frame dressing or held still | a transient source moment needs inspection or annotation | capture the meaningful instant, build the note, release back to temporal flow; in recut, keep the original program clip playing unchanged underneath |
| glitch, displacement, chromatic split, shake | failure, instability, rupture, overload, or unreliable signal is actually present in the story | brief disruption, readable peak, decisive recovery; do not use as generic technology styling |
| flash, glow, light leak, impact pulse | arrival, ignition, threshold, or payoff needs a short energy event | fast attack, restrained decay, clean recovery; it cannot become a persistent surface treatment |

Effects may combine only when they describe different parts of the same event, such as a tracked callout whose connector draws after its anchor appears. Do not combine unrelated effect signatures to increase spectacle.

## Pair every entrance with an exit

Design the whole lifespan before implementation. The entrance answers “where did this come from?” The exit answers “where does attention go next?” Preserve an origin, shared edge, anchor, direction, material behavior, or deliberate cut across both.

- Let attached graphics retract toward or release from their referent.
- Let diagrams finish their causal statement before simplifying or yielding.
- Let a picture-in-picture composition remain stable during detailed explanation; return the source through the inverse spatial relationship rather than another arbitrary zoom.
- Let takeovers hand back through a shared element, a motivated occlusion, or a clean structural cut.
- Let transient impacts recover quickly so the next phrase starts from a calm baseline.

Do not leave an element hovering after its meaning expires, hide it mechanically at the clip boundary, or restart an identical entrance when continuity could carry it forward.

## Write the motion brief

Keep the film owner's official schema unchanged. Record this compact brief in `FRAME.md` and existing free-form beat/card hints:

```markdown
- Viewer change: state A → state B
- Anchors: exact spoken phrase + ATA time; performance/source cue
- Relationship verb:
- Spatial strategy and source-camera cost:
- Cue chain: prepare → trigger → respond → develop → hold → resolve
- Effect family and semantic reason:
- Continuity anchor:
- Exit destination and recovery:
```

For multi-part explanations, list each semantic payload beside its own anchor. Do not add private required fields to Storyboard, Timeline DSL, or HyperFrames contracts.

## Declare a closed motion grammar

Before implementation, fix the film's motion vocabulary in `FRAME.md` as a small closed token set: about three named durations (fast / base / slow), one enter ease, one exit ease, one move ease, and one stagger interval. Derive the values from the film's pace and emotional weight, then spend the whole film inside them; a semantic reveal chooses which token applies, not a new number. Reserve any value outside the set for at most one or two named hero moments, recorded with their reason. Uniform tokens are what make varied choreography read as one hand; per-element invented timings read as noise even when each looks fine alone.

## Hand off to HyperFrames

After the motion brief is approved:

1. Load `hyperframes-animation` and choose rules or a blueprint that realize the named relationship and lifecycle.
2. Build one paused master timeline with labels derived from the cue chain and ATA anchors.
3. Keep source reframing, container motion, semantic reveals, and exit/recovery separately addressable even when they share one timeline.
4. Run the animation map, HyperFrames lint/check, and snapshots across entrance, each semantic anchor, hold, and exit.

Review the result with sound at normal speed, then scrub around each cue and inspect silent playback. Pass only when the viewer can infer why each motion starts, follow information in spoken order, read before the next change, and return to a stable attention state. Remove or redesign motion that is attractive frame by frame but damages the complete rhythm.

## Boundaries

- Do not select beats, invent facts, change spoken timing, or edit the source program clip.
- Do not choose the film's palette, typography, shape language, or overall packaging density.
- Do not implement runtime code before the motion brief exists.
- Do not start HyperFrames Studio, preview, or Timeline UI or use HyperFrames-managed AI/media models.
