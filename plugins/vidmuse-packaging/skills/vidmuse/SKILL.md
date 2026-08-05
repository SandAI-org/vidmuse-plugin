---
name: vidmuse
description: "Route any new or resumed VidMuse request to one owning skill by the requested deliverable. Use when the user wants to create, recut, or build an IP-led film, establish a reusable character identity, define a visual system, plan or source assets, produce one media result, work with a VidMuse Timeline project, or run a direct VidMuse CLI operation."
---

# VidMuse Router

Route the request. Do not produce the deliverable here.

## Choose the owner

First decide whether the user wants a complete film. A complete film remains owned by one film workflow even when the request also mentions assets, media, design, Timeline, rendering, or CLI operations.

| Requested deliverable | Load |
| --- | --- |
| Complete film with speaking footage as the primary material | `vidmuse-recut` |
| Reusable IP Kit or a complete film led by a recurring creator avatar, mascot, stylized likeness, or virtual character | `vidmuse-ip` |
| Complete film from an idea, text, script, website, audio, or non-speaking media | `vidmuse-create` |
| Visual direction, style system, or `FRAME.md` only | `vidmuse-design` |
| Motion direction, speech synchronization, camera/PIP choreography, effect selection, or animation lifecycle only | `vidmuse-motion` |
| Asset decisions, identity, sourcing plan, library policy, or licensing only | `vidmuse-assets` |
| Vox-style editorial paper-collage film or B-roll, where each clip's length is planned from narration | `vidmuse-vox` |
| One concrete media output: transcript, voice, music, image, video, trim, crop, transform, grade, or background removal | `vidmuse-media` |
| Open, assemble, serve, review, synchronize, or render a VidMuse Timeline/DSL project | `vidmuse-timeline` |
| A direct `vidmuse` command or account/service operation: login, update, profile, plan, credits, models, voices, styles, memory, threads, or messages | `vidmuse-cli` |

## Routing rules

1. Preserve an existing film owner. `IP-SNAPSHOT.md` or an episode referencing an approved `ip-kits/<ip-id>/IP.md` means `vidmuse-ip`; a non-IP creation-mode `BRIEF.md` or official `STORYBOARD.md` means `vidmuse-create`; `edit-plan.json` or official recut `storyboard.json` means `vidmuse-recut` unless the user explicitly changes the deliverable. Preserve legacy `film-plan.json` as `vidmuse-create` when resuming an older project.
2. Route by output, not merely by input. “Turn this interview into a launch film” is `vidmuse-recut`; “transcribe this interview” is `vidmuse-media`.
3. Treat focused capabilities as subordinate to a film. “Make a film and generate a voiceover” stays with the film owner, which may later load `vidmuse-media`.
4. Keep semantic motion subordinate to the film owner. `vidmuse-motion` decides choreography after the owner selects a beat; `hyperframes-animation` implements it after the motion brief exists.
5. Distinguish asset judgment from transport. Deciding which logo, icon, photograph, screenshot, or font is appropriate — including license-aware web sourcing — belongs to `vidmuse-assets`. Use the host Agent's native web search, browser, download, and file tools to localize approved assets when available; use official HyperFrames Capture only when those capabilities are unavailable or insufficient. Do not recreate generic network transport in `vidmuse-media`.
6. Distinguish Timeline delivery from CLI syntax. Working on a Timeline project belongs to `vidmuse-timeline`; running or explaining a specific command belongs to `vidmuse-cli`.
7. Route by continuity system, not by beat count. When a reusable IP character and its approved identity lead the film, `vidmuse-ip` owns it end to end even when the user asks for Vox-like narration timing, collage styling, knowledge, advertising, narrative, music-led, or another genre. A small mascot cameo, one character insert, or a stylized avatar inside an otherwise product-, capture-, or footage-led film does not change that film's existing owner.
8. When paper-collage metaphor is the film's visual language and no reusable IP character leads it, `vidmuse-vox` owns it end to end, including the script, voice choice, and duration plan, and loads `vidmuse-media` for narration and alignment. When a film's primary proof is real capture, product UI, or supplied footage and collage would only be one texture among many, `vidmuse-create` stays the owner and may load `vidmuse-vox` for individual clips. A single already-decided image or video generation with no identity, metaphor, or approval judgment is `vidmuse-media`.
9. If two owners remain plausible and choosing incorrectly would change the deliverable, ask one short question about the final output. Do not conduct the production brief here.
10. Do not check credits or quote costs while routing. Every owner checks the balance before its own first paid call and owns the budget conversation for its deliverable. A "how many credits do I have" question is itself a `vidmuse-cli` request.

## Handoff

- Load exactly one owner skill next.
- Carry forward the user's request, supplied files, existing project state, and explicit constraints.
- Let the owner load capability skills as needed and return to itself after each capability finishes.
- Stop routing once ownership is established.

## Boundaries

- Do not inspect media, design frames, source assets, write project files, or run commands in this router.
- Do not split one film across multiple owners.
- Do not enter the HyperFrames router. Film owners may load the narrow HyperFrames domain skills for implementation.
- Do not start HyperFrames Studio/Timeline UI or use HyperFrames-managed media models.
