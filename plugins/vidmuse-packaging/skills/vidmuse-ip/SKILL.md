---
name: vidmuse-ip
description: "Create complete VidMuse films led by a reusable creator IP, mascot, avatar, or stylized likeness. Use when the user wants an IP video, IP 视频, 角色讲解, 动漫博主, 3D 卡通博主, 简笔画角色, virtual host, creator avatar, or a repeatable character series. Own IP setup or reuse, live VidMuse CLI style recommendation and user confirmation, script and narration timing, IP images, Hailuo H3 or Seedance motion, deterministic graphics, Timeline review, and delivery."
---

# VidMuse IP

Create one complete IP-led film while preserving a simple reusable identity for future episodes.

The IP is not one fixed style. The same creator may use 2D animation, 3D cartoon, line drawing, stop-motion, or another user-approved style. Keep this skill as the film owner when the recurring character is the video's primary identity.

## Core rules

1. **No film-level duration limit.** Confirm a target, use supplied audio, or let the locked script and narration determine the final length. Model limits apply only to individual generated clips.
2. **The user confirms the style.** Query the live CLI catalog, recommend at most three candidates, show previews, and wait before generating the IP.
3. **Approve the IP before making episode media.** Reuse an approved IP whenever possible.
4. **Generate character performance; compose exact information.** Keep captions, Chinese text, numbers, diagrams, UI, logos, and citations in HyperFrames rather than inside generated video.

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

Each film keeps the normal VidMuse project structure:

```text
videos/YYYY-MM-DD-ip-<title>/
├── BRIEF.md
├── IP-SNAPSHOT.md
├── STORYBOARD.md
├── SCRIPT.md              # when narrated
├── transcript.json        # when narrated
├── FRAME.md
├── media/
├── compositions/
├── dsl.json
└── renders/
```

`IP-SNAPSHOT.md` is a copy of the approved IP description used by that film, so later IP changes do not silently alter old episodes.

## Scenario modules

Choose the scenario from the requested film, not from the character style.

- Read `references/scenarios/knowledge-explainer.md` for knowledge, opinion, tutorial, process, or concept explanation.
- For a scenario without a module, label it `custom` and use the core workflow. Do not force knowledge-video grammar onto advertising, narrative, music-led, or future scenarios.

Future modules may change story grammar, IP roles, and media choices. They may not bypass style confirmation, identity approval, cost preflight, or QA.

## Workflow

Resume from existing approved files. Do not rebuild the IP because a later episode step is incomplete.

### 1. Confirm the brief

Confirm or safely infer:

- viewer promise, audience, platform, language, and scenario;
- aspect ratio;
- duration intent: exact, approximate, supplied-audio-driven, or script-driven;
- TTS, supplied narration, or silent;
- existing IP versus a new IP;
- source material, factual evidence, brand rules, and references.

There is no default maximum duration. If the user delegates duration, record `script-driven` and measure the final length from the narration or deliberate silent timing.

Write `BRIEF.md`.

### 2. Recommend and confirm a style

Load `vidmuse-cli` and query the live catalog:

```bash
"$VIDMUSE_BIN" style list --scope all --view summary --limit 200 -o json
```

Continue with `--offset` when the result is paginated. Rank styles from the user's references, IP source, subject, audience, and platform.

When the user has no preference, recommend one live candidate from each relevant default category:

- 2D animation / anime;
- 3D cartoon / stylized render;
- line drawing / doodle / pencil illustration.

These are recommendations, not automatic choices. Inspect no more than three finalists:

```bash
"$VIDMUSE_BIN" style get <style-id> --view full -o json
```

Show the preview, name, useful tags, fit, and tradeoff. Wait for the user to choose. Save the exact result to `style.json`. A user-supplied custom reference is also valid when explicitly confirmed.

Changing the style later requires regenerating affected IP and episode assets; say that before acting.

**Gate:** one style is explicitly confirmed.

### 3. Create or reuse the IP

Classify a new IP as:

- supplied avatar or mascot;
- creator likeness transformed into the chosen style;
- original text-defined character.

Require explicit consent before using a real person's likeness or cloning a voice.

Before generation, propose a short identity direction:

- face, silhouette, proportions, and signature marks;
- fixed and flexible wardrobe;
- palette and material;
- expression and gesture range;
- details that must never drift.

Wait for direction approval. Then check the live image model, price, and credit balance through `vidmuse-cli`. Generate the minimum useful reference set: hero view, full-body or 3/4 view, turnaround, and expressions. Use image-to-image when preserving an existing avatar or likeness.

Generate clean reference images without labels, captions, logos, watermark, or fake UI. Present a contact sheet and wait for approval. Save approved assets and write `IP.md`, `style.json`, and `provenance.json`.

**Gate:** the user approves the IP identity and its reusable reference images.

### 4. Write and time the episode

Choose the story arc from the scenario and viewer promise. Lock `SCRIPT.md` before audio generation.

Load `vidmuse-media` for TTS and word alignment:

- reuse the approved IP voice unless the user chooses another;
- synthesize the locked script or use supplied narration;
- require validated word-level `transcript.json` before timing narrated beats.

Split the film into argument beats. Read durations from narration spans. For silent work, plan from actions, reading time, supplied music, and the story arc.

A long film becomes more beats and clips. Never shorten the film because H3, Seedance, TTS, or music has a per-call limit.

### 5. Plan the material for each beat

For every beat record:

- viewer change and evidence;
- IP role: host, actor, reaction, POV/hands, miniature guide, cutout, or offscreen;
- material: generated performance, generated still, reusable cutout, deterministic graphic, or mixed;
- narration/action/music anchor;
- selected reusable assets and missing assets;
- duration and semantic events.

Use generated video when the IP must act, react, manipulate an object, or carry an emotional moment. Use HyperFrames for explanation that must be exact. The IP can remain present through voice, cutouts, recurring props, palette, or miniature-guide behavior without occupying every frame.

Show the storyboard and media choices before episode generation.

**Gate:** the storyboard and material plan are approved.

### 6. Check cost

Before the first paid call, load `vidmuse-cli`, read the balance and live prices, and estimate the approved batch: images, generated motion, TTS, alignment, and BGM. Include a visible retry allowance for motion.

When credits are short, first reuse more approved assets and replace nonessential generated shots with cutouts, stills, or deterministic graphics. Do not silently change the style, narration, or total story.

### 7. Generate episode assets and motion

Generate missing stills first when the character pose, composition, prop relationship, or final frame must be approved. Bind every prompt to the selected style, approved IP references, fixed identity details, one main action, framing, environment, and aspect ratio. Keep exact text out of the plate.

Present the still contact sheet before video generation.

Use live VidMuse video capabilities through `vidmuse-cli`:

| need | preferred route |
| --- | --- |
| standard IP action | `minimax/hailuo-h3` when its live reference mode fits |
| stronger element or multi-shot control, or retry | `seedance-2.0-pro` |
| exact start and end composition | `images_to_video` |
| simple action from one plate | `image_to_video` |
| recurring character references | supported `reference_to_video` route |

Verify model ids, prices, required fields, generation type, duration options, and resolution immediately before the batch. One provider clip may be short; the assembled film is not. Split long beats at semantic events and join them in Timeline.

Preserve raw outputs, normalize returned duration and dimensions, and record the actual model and prompt in `provenance.json`. Retry only when identity, action, style, framing, or duration fails; change one variable per retry.

### 8. Add BGM and compose

Choose BGM after narration and story timing are known. Query the live audio catalog and use an implemented music model through `vidmuse-cli`. A provider's maximum music duration is not the film maximum; use multiple cues or an intentional continuation for longer films.

Load `vidmuse-design` to turn the selected style and IP into `FRAME.md`, and `vidmuse-motion` for cue timing. Use HyperFrames for captions, diagrams, precise text, cutout choreography, transitions, and composition.

Load `vidmuse-timeline` to assemble and validate `dsl.json`, open the required loopback Serve review, and render after review.

### 9. Validate and deliver

Require:

- the IP's face, silhouette, proportions, signature marks, and voice remain consistent;
- the approved style remains recognisable;
- captions and exact information are deterministic and readable;
- character actions have a semantic reason and visible completion;
- no generated clip freezes merely to fill narration;
- BGM yields to speech;
- total duration follows the complete program rather than a provider limit;
- the final render has the requested dimensions, frame rate, audio, and duration.

Return the render, project path, IP kit path, selected style, reusable assets added, actual spend, and known limitations.

## Boundaries

- Own the complete IP film, style approval, IP direction, scenario, story, media routing, IP prompts, model strategy, BGM direction, cost tradeoffs, and delivery.
- Load `vidmuse-cli` for style/model/voice discovery, balance, prices, and commands.
- Load `vidmuse-media` for probe, TTS, transcription, alignment, subtitles, and frame extraction.
- Load focused VidMuse and HyperFrames skills only for design, motion, composition, Timeline, and rendering; ownership returns here.
- Do not use `image_gen`, HyperFrames-managed media models, OS/browser TTS, downloaded local models, unapproved provider substitutions, or unconsented likeness/voice cloning.
