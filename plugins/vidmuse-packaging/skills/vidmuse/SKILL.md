---
name: vidmuse
description: "Route any new or resumed VidMuse request to one owning skill by the requested deliverable. Use when the user wants to create or recut a film, build an AI MV or IP-led film, create an AI advertisement, establish a reusable character identity, define a visual system, plan or source assets, produce one media result, work with a VidMuse Timeline project, or run a direct VidMuse CLI operation."
---

# VidMuse Router

Route the request. Do not produce the deliverable here.

## Choose the owner

Choose by the requested final deliverable and existing project ownership. The
table lists alternative owners, not a priority order. A complete film remains
owned by one film workflow even when the request also mentions assets, media,
design, Timeline, rendering, or CLI operations.

Use `vidmuse-ads` when the requested result is an AI product ad or UGC ad, or a
follow-up within an established ad workflow. A product, brand, or marketing
context alone does not turn a recut, MV, IP, or general film request into ads.

| Requested deliverable | Load |
| --- | --- |
| Complete film with speaking footage as the primary material | `vidmuse-recut` |
| Reusable IP Kit or a complete film led by a recurring creator avatar, mascot, stylized likeness, or virtual character | `vidmuse-ip` |
| Complete generative music video whose uploaded or newly generated song will become the master timeline, without an existing reusable IP Kit lead | `vidmuse-mv` |
| Complete film from an idea, text, script, website, audio, or non-speaking media | `vidmuse-create` |
| Visual direction or style-system work only | `vidmuse-design` |
| Motion direction, speech synchronization, camera/PIP choreography, effect selection, or animation lifecycle only | `vidmuse-motion` |
| Asset decisions, identity, sourcing plan, library policy, or licensing only | `vidmuse-assets` |
| Vox-style editorial paper-collage film or B-roll, where each clip's length is planned from narration | `vidmuse-vox` |
| AI product advertisement or UGC ad, including its references and clip repairs | `vidmuse-ads` |
| One implemented media operation: probe, audio extraction, TTS, transcription, transcript verification, alignment, music analysis, SRT or Timeline subtitle conversion, or frame extraction | `vidmuse-media` |
| Standalone music, image, or video generation with the model, creative prompt, and material inputs already selected | `vidmuse-cli` |
| Open, assemble, serve, review, synchronize, or render a VidMuse Timeline/DSL project | `vidmuse-timeline` |
| A direct `vidmuse` command or account/service operation: login, update, profile, plan, credits, models, voices, styles, memory, threads, or messages | `vidmuse-cli` |

## Routing rules

1. Preserve an existing owner unless the user changes the deliverable. Follow-ups to an ad stay with `vidmuse-ads`, including reference generation, audio checks, and segment repair. For non-ad films, `IP-SNAPSHOT.md` or an episode referencing an approved `ip-kits/<ip-id>/IP.md` means `vidmuse-ip`; an `MV-SCRIPT.md` whose master spine is supplied or generated music means `vidmuse-mv`. Separate MV `BRIEF.md`, `FRAME.md`, or `STORYBOARD.md` are legacy signals and still resume as `vidmuse-mv`; new MV projects use only `MV-SCRIPT.md` as their human-readable plan. Another non-IP creation-mode `BRIEF.md` or official `STORYBOARD.md` means `vidmuse-create`; `edit-plan.json` or official recut `storyboard.json` means `vidmuse-recut` unless the user explicitly changes the deliverable. Preserve legacy `film-plan.json` as `vidmuse-create` when resuming an older project.
2. Route by output, not merely by input. “Turn this interview into a launch film” is `vidmuse-recut`; “transcribe this interview” is `vidmuse-media`.
3. Treat focused capabilities as subordinate to their owner. Let the selected owner's instructions determine its supporting skills; do not prescribe business-specific dependency chains in this router.
4. Keep semantic motion subordinate to the film owner. `vidmuse-motion` decides choreography after the owner selects a beat; `hyperframes-animation` implements it after the motion brief exists.
5. Distinguish asset judgment from transport. Deciding which logo, icon, photograph, screenshot, or font is appropriate — including license-aware web sourcing — belongs to `vidmuse-assets`. Use the host Agent's native web search, browser, download, and file tools to localize approved assets when available; use official HyperFrames Capture only when those capabilities are unavailable or insufficient. Do not recreate generic network transport in `vidmuse-media`.
6. Distinguish Timeline delivery from CLI syntax. Working on a Timeline project belongs to `vidmuse-timeline`; running or explaining a specific command belongs to `vidmuse-cli`.
7. For non-ad films, route by continuity system, not by beat count. When a reusable IP character and its approved identity lead the film, `vidmuse-ip` owns it end to end even when the user asks for Vox-like narration timing, collage styling, knowledge, narrative, music-led, or another genre. Creating a reusable IP Kit remains an IP request; using an existing identity in an ad remains an ads request. A small mascot cameo, one character insert, or a stylized avatar inside an otherwise product-, capture-, or footage-led film does not change that film's existing owner.
8. When the requested final deliverable is an MV, `vidmuse-mv` owns it even if no song has been uploaded yet; it offers upload or Suno generation, then locks the selected song as timing. A standalone song-generation execution with a selected model and authored song prompt belongs to `vidmuse-cli`. Music used only as support inside a product film, explainer, recut, or other visual story does not change that owner's workflow. An approved reusable IP Kit still keeps the film in `vidmuse-ip`.
9. When paper-collage metaphor is the film's visual language and no reusable IP character leads it, `vidmuse-vox` owns it end to end, including the script, voice choice, duration plan, and complete-film delivery, and loads `vidmuse-media` for narration and alignment. When a film's primary proof is real capture, product UI, or supplied footage and collage would only be one texture among many, `vidmuse-create` stays the owner and may load `vidmuse-vox` for individual clips. A standalone image or video generation with a selected model, creative prompt, and material inputs belongs to `vidmuse-cli`.
10. If two owners remain plausible and choosing incorrectly would change the deliverable, ask one short question about the final output. Do not conduct the production brief here.
11. Do not check credits or quote costs while routing. Every owner checks the balance before its own first paid call and owns the budget conversation for its deliverable. A "how many credits do I have" question is itself a `vidmuse-cli` request.
12. Match standalone media requests to the implemented operations in `vidmuse-media` Scope. For standalone generation, `vidmuse-cli` executes the selected model and creative request and identifies any missing execution inputs. For other standalone operations or creative deliverables, identify the required capability and its availability before selecting an execution owner; report the precise capability gap when the plugin has no matching implementation. Within a film, carry the requirement back to its existing owner for an execution decision.

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
