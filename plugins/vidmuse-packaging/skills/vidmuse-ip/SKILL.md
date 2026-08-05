---
name: vidmuse-ip
description: "Create generation-first VidMuse films led by a reusable creator IP, mascot, avatar, or stylized likeness. Use when the user wants an IP video, IP 视频, 角色讲解, 动漫博主, 3D 卡通博主, 简笔画角色, virtual host, creator avatar, or a repeatable character series. Own IP setup or reuse, live style recommendation, narration-timed visual beats, variable-compiled prompts, Hailuo H3 or Seedance motion, immediate Timeline review, minimal assembly, and delivery. Limit packaging to unobtrusive subtitles, an edge progress indicator, and shot transitions."
---

# VidMuse IP

Create a complete IP-led film as a sequence of narration-timed generated scenes. Preserve one simple reusable identity for later episodes.

The video model and its prompt own the picture. Timeline owns only assembly. Do not build a conventional explainer and decorate it with an IP afterward.

## Core rules

1. **Generate the content; do not package around it.** Translate each spoken argument into a moving scene in which the IP, environment, objects, and camera express the idea.
2. **Compile prompts from beat variables.** Decide semantic focus, IP role, required result, fact binding, continuity, and creative freedom for the current narration beat. Emit only resolved clauses; never send the model a universal template, option list, or empty variable.
3. **Let approved references carry identity.** Pass approved character references and use their model reference tokens. Do not repeat visible face, hair, wardrobe, or body traits in every prompt unless a real drift failure requires one short corrective anchor.
4. **Keep IP performance flexible.** Let the IP present, act, guide, observe, or combine roles according to the current beat. Do not force continuous lip-sync or forbid speaking across the whole film.
5. **Let narration determine picture length.** Confirm a target, use supplied audio, or let the locked script determine the film. Model limits apply only to individual clips.
6. **Bind exact facts to sources.** Permit words, names, dates, percentages, prices, and numbers that the narration or evidence explicitly supplies. Do not invent unsupported exact claims merely to decorate a frame.
7. **Let the user confirm the style and IP.** Query the live style catalog, then approve reusable identity references before episode generation.
8. **Show generated clips to the user immediately.** After generation, place candidate clips in narration order on a minimal Timeline and start review. Do not delay first sight with Agent visual inspection, frame sampling, contact sheets, scoring, or autonomous retries.
9. **Keep packaging minimal.** After clip approval, join narration, optional BGM, subtitles, an optional edge progress indicator, and shot transitions. These elements must not cover the IP, important objects, or visible actions. Do not add information cards, timelines, diagrams, callouts, cutouts, or other packaging points.

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

- Read `references/prompt-rules.md` before planning or compiling any generated video prompt.
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
- any user preference for speaking, acting, or hybrid IP performance; otherwise decide per beat;
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

Read `references/prompt-rules.md`. For every beat record the internal variables needed to compile its prompt:

- narration span and target duration;
- semantic function and the exact meaning the viewer should understand;
- IP role: `auto`, `presenter`, `actor`, `guide`, `observer`, or `hybrid`;
- a must-show event and result only when the beat truly requires them;
- source-bound facts that may appear literally or symbolically;
- creative freedom: `high`, `medium`, or `low`;
- selected IP references and generation route.

Default capable multimodal models to high creative freedom. Prefer physical causality over explanation graphics: build, fail, compare, launch, return, transform, search, discover, escape, or resolve. Let the spoken fact become an action, event, or changing world.

Do not preselect every gesture, chart, metaphor, camera move, or timed phase. Leave `IP_ROLE` or `MUST_SHOW` unresolved when no choice is necessary; the compiler must omit that clause instead of listing alternatives.

Write the variables and their compiled prompts to `SHOT-PROMPTS.md`; write only the viewer-facing beat plan to `STORYBOARD.md`. Present the beat intentions and media cost, then wait.

**Gate:** the generated-scene plan is approved.

### 6. Check cost

Before the first paid episode call, load `vidmuse-cli`, read the balance and live prices, and estimate images, motion, TTS, alignment, BGM, and a visible motion retry allowance.

When credits are short, generate fewer complete beats or a still contact sheet. Do not replace planned generated scenes with packaging, shorten a clip below its narration span, or silently change the story or style.

### 7. Generate scene plates and motion

Generate a scene still first when the pose, environment, object relationship, or final composition needs approval. Bind every image and video request to the approved style and IP references.

Compile each request according to `references/prompt-rules.md`. When the route supports multimodal references, pass the approved IP image and matching narration audio so the model can follow identity, semantics, rhythm, and emotion. Use one concise resolved prompt for the first attempt. Do not send the internal variable schema, all possible IP roles, or a menu of visual treatments.

Treat explicit narration facts as available prompt material. Ask for literal display only when exact visual rendering matters; otherwise let the model express the fact symbolically. Keep generated historical or technical scenes illustrative rather than documentary evidence.

Use live VidMuse routes:

| need | preferred route |
| --- | --- |
| recurring character bound to references | supported `reference_to_video` route |
| approved scene start or simple action | `image_to_video` |
| exact start and end composition | `images_to_video` |
| standard IP motion | `minimax/hailuo-h3` when its live reference mode fits |
| stronger element, action, or multi-shot control | `seedance-2.0-pro` |

Verify model ids, prices, fields, generation type, duration options, and resolution immediately before the batch. Preserve raw outputs, localize returned media, and record the model, prompt variables, compiled prompt, references, and cost in provenance.

After a clip returns, do not watch it, extract frames, build a contact sheet, score identity or action, or regenerate it on Agent judgment before the user sees it. Perform only the minimum technical work required to reference the non-empty media in Timeline. If a synchronous request times out after acceptance, recover the result from generated assets before considering a retry.

### 8. Assemble immediate Timeline review

As soon as all candidate clips are available, load `vidmuse-timeline` and create or patch the minimal `dsl.json`:

- place clips sequentially on one main video track in narration order;
- add the locked narration as the single program-audio path and mute model-native clip audio unless the user intends to review it;
- omit new BGM, subtitles, transitions, progress indicators, and HyperFrames packaging at this checkpoint;
- run only required DSL structural validation, then start a read-only Timeline Serve immediately;
- report the review URL and stop for user feedback.

Do not render a review file or conduct a separate Agent perception pass first. Timeline inclusion means “candidate for review,” not “approved.”

**Gate:** the user reviews the generated sequence and approves it or identifies clips to revise.

For a requested revision, change the smallest relevant prompt variable, regenerate only the named clip, replace that Timeline item in place, validate, and return to the same review gate.

### 9. Add minimal packaging after approval

Choose BGM after narration and shot timing are known. Join the generated clips in narration order and mix narration and BGM.

Limit visual packaging to:

- readable subtitles;
- an optional thin progress indicator at a frame edge;
- simple transitions between generated shots.

Reserve space from the generated frame instead of covering the IP's face, hands, important objects, or semantic action. Keep overlays visually quiet and remove any one that competes with the generated scene.

Do not load `vidmuse-design`, `vidmuse-motion`, Shotcraft, or HyperFrames composition to invent additional visual beats. Patch approved packaging into the reviewed Timeline without rebuilding its clip order or stable IDs.

### 10. Validate and deliver

Run final technical and visual validation only after the user has reviewed the generated sequence. Require:

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
- Load `vidmuse-timeline` immediately after candidate generation for sequential user review, then reuse the same stable DSL for revisions, packaging, and rendering.
- Limit packaging to subtitles, an optional edge progress indicator, and shot transitions; never obscure generated content.
- Do not use `image_gen`, HyperFrames-managed media models, OS/browser TTS, downloaded local models, unapproved provider substitutions, or unconsented likeness or voice cloning.
