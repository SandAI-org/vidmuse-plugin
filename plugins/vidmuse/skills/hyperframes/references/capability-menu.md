# Capability menu — VidMuse plugin

This is a capability inventory, not a product router.

- Fresh VidMuse intent → `/vidmuse`.
- Existing speaking footage → `/vidmuse-recut`.
- No speaking plate, including script + TTS, website promos, and generated
  media films → `/vidmuse-create`.
- Standalone ASR, ATA, TTS, generation, or deterministic operation →
  `/media-use`.
- Semantic asset/library request → `/vidmuse-assets`.
- Semantic motion inside an owned VidMuse run → `/vidmuse-motion`.
- Existing HyperFrames composition operations → `/hyperframes-cli`.

All skills named below ship in this plugin. Never lazily install upstream
creation workflows or use them as alternate product entries.

| Capability | Say it to the user as… | VidMuse-native entry and result |
| --- | --- | --- |
| Design system | “colors, typography, spacing, and materials stay consistent” | Owning product skill + `/vidmuse-design` → validated project `FRAME.md` and real-content showcase |
| Website capture | “I can capture the real site and build from its look” | `npx hyperframes capture <URL> -o <dir>` inside `/vidmuse-create` → real screenshots/assets, then a VidMuse-owned film |
| Beat-aware motion | “cuts and motion can land on the music” | `/hyperframes-animation` `references/audio-reactive.md` + `scripts/extract-audio-data.py` → deterministic audio map used by the owning product |
| Motion blueprints | “each scene gets a proven motion treatment” | `/hyperframes-animation` blueprints/rules + `/vidmuse-motion` recipes → seek-safe composition behavior |
| Voice, music, SFX, images, and grades | “I can generate or resolve the media and freeze it into the project” | `/media-use` `scripts/resolve.mjs` and `audio/scripts/audio.mjs` → live VidMuse model selection, local files, provenance ledger |
| AI video and digital humans | “I can generate a shot, animate an approved still, or create a presenter” | `/media-use` `scripts/resolve.mjs --type video` with a live VidMuse route such as `text_to_video`, `image_to_video`, `images_to_video`, or `avatar` → frozen local clip + ledger |
| Transcription and captions | “accurate, word-timed captions styled to match” | `/media-use` `scripts/transcribe.mjs` → VidMuse ASR + ATA transcript; owning product skill groups and styles captions |
| Transcript-based cutting | “I can trim footage by choosing the sentences to keep” | `/media-use` `scripts/transcript-cut.mjs` → trimmed clip + updated transcript |
| Designed overlays on speaking footage | “titles, lower-thirds, callouts, and PiP timed to speech” | `/vidmuse-recut` → multi-track Timeline DSL and HyperFrames/GSAP overlay assets |
| Registry blocks | “ready-made scenes we can install and restyle” | `/hyperframes-registry` + `npx hyperframes add <block>` → wired sub-composition |
| Scene transitions | “the handoff between scenes can carry the story” | `/hyperframes-animation` transition references, implemented under the owning VidMuse workflow |
| User media on the Timeline | “your own footage, screenshots, and photos stay first-class” | `/media-use` `--from` / `--adopt` → local assets + manifest records, then Timeline tracks |
| Shareable output | “preview and export the multi-track piece” | `vidmuse serve "$WORK_DIR/dsl.json"` → review; `vidmuse render` after approval |

## Optional connected sources

Figma or map data is not bundled as a VidMuse skill. Use it only when the
corresponding connected app/tool is available and the user supplies or
authorizes that source. Otherwise ask for an exported design/map asset; never
claim a missing workflow or install one from an upstream pack.

## Design ask

- If the user has brand guidelines, `FRAME.md`, or a design spec, record it as
  brand truth.
- If the look matters but no spec exists, load `/vidmuse-design`; compare
  complete worlds only when the decision is genuinely ambiguous.
- If the user does not care, let the owning VidMuse workflow choose and record
  the rationale.

Genre-specific taste belongs to the owning VidMuse product. Product promos,
explainers, website films, and code walkthroughs without speaking footage all
route through `/vidmuse-create`; the plugin does not borrow missing upstream
workflow machinery.
