# NOTICE — video-shotcraft shot card extract

This directory contains a **curated subset** of shot recipe cards originally
published in:

- **Project:** [Vincentwei1021/video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft)
- **Upstream paths:** `references/shots/<id>.md`
- **License:** Apache License 2.0 (see upstream `LICENSE`)
- **Copyright:** Copyright 2026 Wei Yihao (and contributors), as stated upstream

## What we took

- Editorial / motion **recipe text** only (intent, parameters, pitfalls, sound notes).
- A VidMuse `bridge.jsonl` mapping layer (roles, recipe affinity, HF hints).

## What we did **not** take

- Remotion `demos/**` TypeScript implementations
- Full-movie `template/` project
- Gallery media (mp4/webm) — browse upstream:
  https://vincentwei1021.github.io/video-shotcraft/
- Mixkit / third-party audio binaries

## How VidMuse uses this material

1. Cards are **motion priors** for `/vidmuse-create` film plans.
2. **Authority:** project `FRAME.md` + film plan still win over any card skin.
3. **Runtime:** implement with HyperFrames composition + GSAP (or HF Registry
   mechanisms after reskin). Do **not** execute Remotion demos inside this plugin.
4. Redistribution of these markdown extracts must retain Apache-2.0 attribution.

Upstream project and trademarks of studied product films remain with their
respective owners; cards document re-implemented motion techniques only.
