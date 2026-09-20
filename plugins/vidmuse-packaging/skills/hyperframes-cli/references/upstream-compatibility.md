# HyperFrames upstream compatibility

VidMuse uses HyperFrames as its composition and rendering backend, but the vendored skills carry VidMuse policy patches. This record separates upstream runtime improvements that are safe to consume from upstream surfaces that belong to HyperFrames Studio or HyperFrames-managed media workflows.

## Review receipt

- Upstream: `https://github.com/heygen-com/hyperframes`
- Vendored skill reference: `343c02518889f46ee3962256b19ac4189264907d` (2026-08-01)
- Reviewed release: `v0.8.50`
- Reviewed commit: `34644a199390741a6aa2c3fbea006813176902a4`
- Runtime check on 2026-09-19: `npx hyperframes --version` returned `0.8.50`

## Safe compatibility surface

These upstream changes are relevant to VidMuse projects and can be adopted through the official CLI/runtime, subject to the normal project checks:

- composition sizing and sub-composition lint correctness, especially for portrait projects;
- media and image readiness before the first captured frame;
- non-Latin file paths and filenames;
- HDR/SDR render handling and cancellation cleanup;
- finite media tails and long-capture cache lifetime;
- optional sub-frame motion blur for approved motion-heavy renders;
- official Registry discovery and installation through the configured remote Registry.

Do not turn any of these into a new VidMuse default without a representative snapshot and render check. Motion blur is an opt-in render quality feature and may increase capture cost.

## VidMuse-owned boundaries

Keep these rules from the local skills even when the upstream repository changes:

- do not start HyperFrames Studio, its timeline UI, `preview`, or `beats` during a VidMuse run;
- route transcription, TTS, captions, background removal, model selection, and paid media calls through `vidmuse-media` and `vidmuse-cli`;
- keep the VidMuse Timeline DSL as the owner of source video, program audio, subtitles, and layered packaging ownership;
- keep the local Shotcraft filesystem Registry separate from the official remote Registry;
- preserve the transparent layered-host rule: do not duplicate the source video, program audio, or Timeline-owned captions inside an overlay host.

## Deferred upstream surfaces

Studio editing SDK changes, Studio timeline UX, Studio-only Agent interactions, and HyperFrames-managed media-model workflows are intentionally deferred. They do not belong in the VidMuse packaging runtime contract.

## Upgrade gate

Before changing the pinned vendored skill text or adopting a new default:

1. Compare upstream `hyperframes-core`, `hyperframes-cli`, `hyperframes-animation`, `hyperframes-keyframes`, and `hyperframes-registry` against the last reviewed reference.
2. Re-apply VidMuse policy patches instead of copying upstream files wholesale.
3. Run a layered transparent overlay, a subtitle review DSL, a sub-composition, a local Shotcraft block, and a portrait project through lint/check/snapshot.
4. Verify the rendered output has the expected dimensions, duration, alpha behavior, audio ownership, and caption ownership.
5. Update `VENDOR-SOURCES.json` with the new receipt and the exact deferred surfaces.
