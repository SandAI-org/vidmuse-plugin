# VidMuse Recut Upstream Integration

Historical maintainer note. This file is intentionally outside the plugin
payload and is not part of the Recut runtime reference graph.

How this skill plugs into the HyperFrames workflow ecosystem (heygen-com/hyperframes). Written so the skill can be proposed upstream as a replacement for, or alternative to, `talking-head-recut`.

## Router entries

A workflow skill occupies one entry in each of three router files. The drafts below match the upstream format.

### Destination of the upstream route table (VidMuse plugin patch)

In the **VidMuse Codex plugin**, `/vidmuse` is the intent router and vendored
`skills/hyperframes/SKILL.md` is only a domain reference. `/vidmuse` hands a
packaging / dress-up / recut / director deliverable to `/vidmuse-recut`.
The legacy route to `/talking-head-recut` is retired.

Standalone/upstream proposal (if contributing back to heygen-com/hyperframes someday) would still look like:

| Priority | Request | Workflow |
| --- | --- | --- |
| 4 | Add designed graphic overlays to existing talking-head, interview, or podcast footage without changing the footage | `/vidmuse-recut` |

### `references/workflow-catalog.md` entry

```markdown
## `/vidmuse-recut`

- **Input:** Existing talking-head, interview, podcast, or product-explainer footage. Packaging mode keeps it primary; Director mode may reframe, composite, or temporarily hide it for a justified proof scene.
- **Output:** The same footage with transcript-synced graphic-overlay cards — kinetic titles, lower-thirds, data callouts, pull-quotes, side panels, or picture-in-picture — styled by a composed design system with one content-driven signature move. Any length.
- **Triggers:** "package this video", "add graphic overlays to my talk", "add lower-thirds or data callouts to this interview", "dress up my video".
```

### `references/route-briefs.md` entry

```markdown
## `/vidmuse-recut`

- **Must-haves:** which clip (the input file).
- **Deferred (announce):** the direction-and-strategy round — design direction (shown as the frame showcase), aspect ratio, layout, intervention plan — stays at its Step 6, where the recommendations come from the probed footage, transcript, and taste-library selection. Say it's coming.
- **Run-shape:** neither.
```

## BRIEF.md

When routed through `/vidmuse`, the selected workflow writes or resumes a
`BRIEF.md` carrying confirmed input and user notes. This skill's Setup reads it
first and never re-asks an answered question.

## Preference memory

Both memory systems are honored, at different altitudes:

- **HyperFrames preference store** (`media-use` `prefs.mjs` / `recipe.mjs`): parameter-level memory — aspect, layout, caption identity. Read before asking (remembered value becomes the recommended option with named provenance); write confirmed preference-backed choices after the run.
- **VidMuse taste flow** (`evaluation.json` `feedback.events`): aesthetic memory — accepted/rejected directions, corrections at the frame-showcase gate, post-render edits. Feeds the curated library's private layer.

They do not overlap: one remembers settings, the other accumulates taste.

## Question channels

The upstream three-tier degradation applies to every user-facing question round:

1. Native structured-question tool (e.g. `AskUserQuestion`) when the runtime has one.
2. Another native clarification tool with the same questions and options.
3. Plain text: one message, numbered questions with lettered options, recommendation marked, "reply 'default' to accept all recommendations".

2–5 questions per round. An autonomous signal ("surprise me", "don't ask", "just build it") skips the round; state the chosen defaults in one sentence and record unanswered fields as inferred decisions with receipts.

## Skill installation

Workflow skills are installed by name:

```bash
npx skills add <source> --skill vidmuse-recut -y
```

This skill depends on the technical HyperFrames domain skills (`hyperframes`, all `hyperframes-*`, `media-use`). In the **VidMuse Codex plugin** those skills are **vendored as sibling directories** under `skills/` and verified by `scripts/setup.sh` (network reinstall is only a fallback when the plugin layout is incomplete). HyperFrames-specific GSAP guidance lives in `hyperframes-animation/adapters/`, so generic web-animation skills are not part of the plugin payload. The live official Registry catalog and this skill's taste overlay still supply effect implementations. It does not use other HyperFrames **creation workflows** (especially not `talking-head-recut`) as design authorities — direction comes from the composed design system and VidMuse editorial judgment. Installed Registry HTML is implementation source material, not a competing taste system.

## Differences from `talking-head-recut` (for a PR argument)

Kept from THR: the probe/align/assemble/render pipeline (transcription is replaced by VidMuse audio-text alignment of user-provided text), layout vocabulary, aspect conversion, question-channel degradation, work-directory conventions, dense-keyframe re-encode, transcript clamping, and font resolution. Media mounting follows the current HyperFrames direct-root contract; source reframing uses the host timeline rather than a nested video wrapper.

Replaced: the 10-template style groups, fixed themeId palettes, and 13-atom animation set — with judged selection over the taste library plus official Registry catalog, a film spine with optional act worlds, effect weighting and anti-patterns, pixels-first confirmation, hero-frame and motion-reel review, and rendered-output evaluation with a correction loop.

Added over THR's architecture: a live catalog overlay (`scripts/effects.py` + `data/effects-overlay.jsonl`) that joins upstream implementations with VidMuse `use_when`/`avoid`/weight/zone/compatibility metadata; LLM-authored adaptation that preserves advanced official mechanisms; an auditable `effect-sources.json`; pinned-CDN policy; and separate host/sub-composition timeline ownership. The previous declarative compiler and reference cards remain legacy-native compatibility assets, not the main path.

Evidence standard: same source clip run through both workflows, outputs compared on coherence, content fit, hierarchy, restraint, and originality; `evaluation.json` records the checks.
