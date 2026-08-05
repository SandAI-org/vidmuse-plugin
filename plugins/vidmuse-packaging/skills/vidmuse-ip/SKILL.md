---
name: vidmuse-ip
description: "Create generation-first VidMuse films led by a reusable creator IP, mascot, avatar, or stylized likeness. Use when the user wants an IP video, IP 视频, 角色讲解, 动漫博主, 3D 卡通博主, 简笔画角色, virtual host, creator avatar, or a repeatable character series. Own IP setup or reuse, live style recommendation, narration-timed visual beats, character-bound prompts, Hailuo H3 or Seedance motion, minimal assembly, review, and delivery. Limit packaging to unobtrusive subtitles, an edge progress indicator, and shot transitions."
---

# VidMuse IP

Create a complete IP-led film as a sequence of narration-timed generated scenes. Preserve one simple reusable identity for later episodes.

The video model and its prompt own the picture. Timeline owns only assembly. Do not build a conventional explainer and decorate it with an IP afterward.

## Core rules

1. **Generate the content; do not package around it.** Translate each spoken argument into a moving scene in which the IP, environment, objects, and camera express the idea.
2. **Let narration determine picture length.** Confirm a target, use supplied audio, or let the locked script determine the film. Model limits apply only to individual clips.
3. **Let the user confirm the style and IP.** Query the live style catalog, then approve reusable identity references before episode generation.
4. **Keep packaging minimal.** Join clips, narration, BGM, subtitles, an optional edge progress indicator, and shot transitions. These elements must not cover the IP, important objects, or visible actions. Do not add information cards, timelines, diagrams, callouts, cutouts, or other packaging points.
5. **Keep exact facts out of generated frames.** Put exact wording, dates, numbers, citations, and spelling in narration, optional captions, or delivery notes. Treat generated historical or technical scenes as illustration, not documentary evidence.

## Minimal files

Keep the reusable IP small:

```text
ip-kits/<ip-id>/
├── IP.md
├── style.json
├── assets/
│   ├── references/
│   └── approved/
└── provenance.json
```

Read `references/ip-kit.md` when creating or updating these files.

Keep each film equally direct:

```text
videos/YYYY-MM-DD-ip-<title>/
├── BRIEF.md
├── IP-SNAPSHOT.md
├── SCRIPT.md
├── transcript.json
├── STORYBOARD.md
├── SHOT-PROMPTS.md
├── media/
├── clips/
├── dsl.json
└── renders/
```

`IP-SNAPSHOT.md` freezes the approved identity used by that film.

## Scenario modules

Choose the scenario from the requested film, not from the character style.

- Read `references/scenarios/knowledge-explainer.md` for knowledge, opinion, tutorial, process, or concept explanation.
- For a scenario without a module, label it `custom` and use the core workflow. Do not force knowledge-video grammar onto advertising, narrative, music-led, or future scenarios.

## Workflow

Resume from approved files. Do not rebuild an IP because a later episode step is incomplete.

### 1. Confirm the brief

Confirm or safely infer:

- viewer promise, audience, platform, language, and scenario;
- aspect ratio;
- duration intent: exact, approximate, supplied-audio-driven, or script-driven;
- TTS, supplied narration, or silent;
- existing IP versus a new IP;
- source material, factual evidence, brand rules, and references.

There is no default maximum duration. If the user delegates duration, record `script-driven` and measure it from narration or deliberate silent timing. Write `BRIEF.md`.

### 2. Recommend and confirm a style

Load `vidmuse-cli` and query the live catalog:

```bash
"$VIDMUSE_BIN" style list --scope all --view summary --limit 200 -o json
```

Continue with `--offset` when paginated. Rank styles from the user's references, IP source, subject, audience, and platform. With no preference, recommend at most three live candidates across useful defaults such as 2D animation, 3D cartoon, and line drawing.

Inspect each finalist with:

```bash
"$VIDMUSE_BIN" style get <style-id> --view full -o json
```

Show preview, name, tags, fit, and tradeoff. Wait for the user's choice and save the exact receipt to `style.json`. A confirmed custom reference is also valid.

**Gate:** one style is explicitly confirmed.

### 3. Create or reuse the IP

Classify a new IP as a supplied avatar or mascot, a creator likeness transformed into the chosen style, or an original text-defined character. Require explicit consent before using a real person's likeness or cloning a voice.

Propose a short identity direction covering face, silhouette, proportions, signature marks, wardrobe, palette, expression range, and anti-drift details. Wait for approval. Then check the live image model, price, and credit balance through `vidmuse-cli`.

Generate the minimum identity reference set: hero view, full-body or 3/4 view, turnaround, and expressions. Use image-to-image when preserving an existing avatar or likeness. Generate clean references without labels, logos, watermarks, or fake UI. Present one contact sheet and wait for approval, then write the IP Kit.

**Gate:** the reusable IP identity is approved.

### 4. Lock and align the narration

Write the episode as arguments, not packaging points. Lock `SCRIPT.md` before audio generation.

Load `vidmuse-media` to synthesize or accept narration and produce validated word-level `transcript.json`. Reuse the approved IP voice unless the user chooses another. Narration timing is mandatory for narrated work.

### 5. Plan generated visual beats

Split the aligned narration at changes of argument or visual situation. One argument may use one clip or several semantic subclips when the narration exceeds a provider limit.

For every beat record:

- narration span and target duration;
- the exact idea the viewer understands;
- one visual proposition that makes the idea happen on screen;
- the IP's visible role and one main action;
- environment, important objects, framing, and camera behavior;
- 2–4 continuous motion phases that cover the whole clip;
- selected IP references and generation route.

Prefer physical causality over explanation graphics: build, fail, compare, launch, return, transform, search, discover, escape, or resolve. Let the spoken fact become an action, event, or changing world.

Reject a plan when the IP merely stands beside information, when a static picture is expected to carry a long narration span, or when the plan relies on later cards, timelines, arrows, labels, or diagrams to become understandable.

Write `STORYBOARD.md` and `SHOT-PROMPTS.md`, present the visual propositions and media cost, and wait.

**Gate:** the generated-scene plan is approved.

### 6. Check cost

Before the first paid episode call, load `vidmuse-cli`, read the balance and live prices, and estimate images, motion, TTS, alignment, BGM, and a visible motion retry allowance.

When credits are short, generate fewer complete beats or a still contact sheet. Do not replace planned generated scenes with packaging, shorten a clip below its narration span, or silently change the story or style.

### 7. Generate scene plates and motion

Generate a scene still first when the pose, environment, object relationship, or final composition needs approval. Bind every image and video request to the approved style and IP references.

Each video prompt must contain:

- the spoken idea translated into one visual event;
- the IP's identity anchors and reference inputs;
- one main physical action with a visible result;
- environment and object relationships;
- framing and camera behavior;
- motion phases covering the full requested duration;
- aspect ratio and style invariants.

Do not ask the video model to render readable facts. Do not leave empty space for a later information card. Do not plan a static talking pose unless stillness itself is the intended dramatic action.

Use live VidMuse routes:

| need | preferred route |
| --- | --- |
| recurring character bound to references | supported `reference_to_video` route |
| approved scene start or simple action | `image_to_video` |
| exact start and end composition | `images_to_video` |
| standard IP motion | `minimax/hailuo-h3` when its live reference mode fits |
| stronger element, action, or multi-shot control | `seedance-2.0-pro` |

Verify model ids, prices, fields, generation type, duration options, and resolution immediately before the batch. Preserve raw outputs, normalize returned duration and dimensions, and record the model, prompt, references, and cost in provenance. Retry only for identity, action, style, framing, or duration failure, changing one variable per attempt.

### 8. Add minimal packaging and assemble

Choose BGM after narration and shot timing are known. Join the generated clips in narration order and mix narration and BGM.

Limit visual packaging to:

- readable subtitles;
- an optional thin progress indicator at a frame edge;
- simple transitions between generated shots.

Reserve space from the generated frame instead of covering the IP's face, hands, important objects, or semantic action. Keep overlays visually quiet and remove any one that competes with the generated scene.

Do not load `vidmuse-design`, `vidmuse-motion`, Shotcraft, or HyperFrames composition to invent additional visual beats. Load `vidmuse-timeline` only to assemble, review, validate, and render the approved clips and audio.

### 9. Validate and deliver

Require:

- the IP's face, silhouette, proportions, signature marks, style, and voice remain consistent;
- every narration beat has moving generated content for its full span;
- each clip communicates through scene, action, emotion, object behavior, or camera rather than overlay graphics;
- no long freeze fills missing duration;
- generated illustration is not presented as documentary proof;
- subtitles and the optional progress indicator remain readable without hiding generated content;
- transitions connect shots without becoming separate content;
- BGM yields to speech;
- the final render has the requested dimensions, frame rate, audio, and duration.

Return the render, project path, IP Kit path, selected style, generated clips, reusable references added, actual spend, and known model limitations.

## Boundaries

- Own the complete IP film, identity, scenario, story, visual propositions, prompts, generation strategy, budget tradeoffs, and delivery.
- Load `vidmuse-cli` for styles, models, voices, balance, prices, and generation commands.
- Load `vidmuse-media` for probe, TTS, transcription, alignment, subtitles, and frame extraction.
- Load `vidmuse-timeline` only for assembly, review, and rendering after the generated clips are approved.
- Limit packaging to subtitles, an optional edge progress indicator, and shot transitions; never obscure generated content.
- Do not use `image_gen`, HyperFrames-managed media models, OS/browser TTS, downloaded local models, unapproved provider substitutions, or unconsented likeness or voice cloning.
