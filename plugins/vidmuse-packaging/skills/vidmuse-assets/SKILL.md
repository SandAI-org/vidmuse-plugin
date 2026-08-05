---
name: vidmuse-assets
description: Plan and select semantically meaningful assets for VidMuse films. Use inside vidmuse-create or vidmuse-recut to turn story claims into evidence needs, search license-clear web sources when supplied media is insufficient, shortlist official HyperFrames Capture output or supplied/remote media, design capture sequences, select focal/supporting/fallback assets, and record provenance, identity, licensing, privacy, crop, and resolution constraints. Also use directly for logos, icons, fonts, brand identity, asset-library policy, or license-aware sourcing. Do not use for an already-decided download, generation, transform, animation, or render.
---

# VidMuse Assets

Decide what the film must show and which real asset can prove it. Do not treat availability as editorial value.

## Read the story need

Read the request, `BRIEF.md`, provisional or approved `STORYBOARD.md`, `SCRIPT.md`, `FRAME.md` when present, and the authoritative source inventory.

For each beat identify:

- the viewer's question;
- the claim or feeling being advanced;
- what visible evidence would make it believable;
- whether the evidence is an identity, context, action, mechanism, result, comparison, human trace, or atmosphere;
- whether the proof must change over time or can remain still.

If no honest evidence exists, return the gap to the film owner. Do not fill it with a vaguely related image.

## Work from canonical inventories

For official HyperFrames Capture, treat `capture/extracted/asset-descriptions.md` and the capture command result as the canonical inventory. Shortlist semantically before opening raw files. Then inspect the actual pixels, frames, or DOM of serious candidates at the intended output ratio.

For supplied media, build a compact inventory from the real files and representative frames. Preserve the user's filenames and paths. For licensed or remote assets, record the source, license, author/owner, allowed use, and any attribution or redistribution obligation.

Do not accept filenames, alt text, generated descriptions, or dominant-color summaries as proof that an asset is visually usable.

## Search for missing real-world coverage

When a film beat names a real person, place, product, interface, publication, document, tool, object, historical event, or recognizable industry activity and the supplied inventory cannot show it, use available web-search and browser tools to find a small candidate set. Recut should reach this step before inventing a substitute interface or illustrating concrete props from scratch.

Search by identity plus visual job. For example, search for an official product interface when the beat needs product proof, a license-clear editing-suite photograph when the beat needs filmmaking atmosphere, or an official open icon library when the beat needs a familiar symbolic cue. Do not search a generic mood such as "technology background" and mistake visual polish for relevance.

Use this preference order:

1. canonical official source for the named identity or interface;
2. the creator's or publisher's authorized page;
3. a public-domain or license-clear repository with per-asset provenance;
4. a stock library with explicit terms, used for context or atmosphere rather than identity proof;
5. generated or original illustration only when real media would be dishonest, unavailable, or semantically weaker.

Treat search results as discovery only. Open the original asset page and verify the visible candidate, author/owner, license or usage terms, attribution requirement, and a canonical downloadable file or capture target. A search thumbnail, copied CDN URL, repost, or aggregator page is not a source receipt. Prefer no asset over one with unclear rights or identity.

For each approved remote candidate, return:

- the source page and canonical file or capture URL;
- author/owner and license or allowed-use terms;
- its role as `evidence`, `context`, or `atmosphere`;
- the intended beat and strongest reason for selection;
- crop, resolution, attribution, brand, or privacy constraints;
- a fallback if download, capture, rights, or crop validation fails.

Use the host Agent's native web search, browser, download, and file capabilities first for discovery, source inspection, and localizing an approved canonical file. Do not wrap or duplicate those general-purpose capabilities inside a VidMuse skill. If the host cannot search or download, the native attempt fails or is insufficient, or a useful source exists only as a webpage/interface state rather than one canonical file, ask the film owner to run official HyperFrames Capture. The resulting file must become project-local before design preview or render; remote hotlinks are not a delivery asset. The film owner records the local path and provenance in its normative design/story artifact.

## Select evidence sequences

When a claim depends on change, plan a sequence rather than one screenshot:

1. **Establish:** orient the viewer to the product, place, object, or starting state.
2. **Action:** show the meaningful input, choice, gesture, or event.
3. **Response:** preserve the immediate causal reaction.
4. **Result:** hold the outcome long enough to recognize and read.

Not every sequence needs four separate shots. Combine stages when the cause remains clear. Never show a result before the action merely because it is more attractive.

Prefer real continuous capture when timing, interaction, or state change is the proof. Prefer a high-resolution still when the viewer must inspect a stable result, comparison, number, or dense interface. Use a separable DOM or image element only when that element must move independently. Use explanatory graphics only when the real source cannot directly express an abstract relationship.

## Evaluate candidates

Judge each serious candidate by:

- **narrative necessity:** which claim or emotional turn it serves;
- **authenticity:** whether it shows the real product, person, object, data, or source state;
- **change potential:** whether its action and consequence can be followed;
- **legibility:** whether the important detail survives the target aspect ratio and viewing distance;
- **crop and motion headroom:** whether it can be framed without distortion or destructive zoom;
- **continuity:** whether an object, direction, color, sound, or state can bridge adjacent shots;
- **specificity:** whether it belongs recognizably to this subject rather than any generic film;
- **redundancy:** whether it adds information not already carried by another asset;
- **provenance and safety:** whether rights, privacy, version, account, and source are acceptable.

Do not reduce the decision to a numeric score. State the strongest reason for selection and the strongest limitation.

## Build one coverage set per beat

Select only what downstream work needs:

- **focal:** the primary evidence the scene is built around;
- **supporting:** optional context or secondary proof that earns shared attention;
- **fallback:** an alternate that survives a crop, quality, rights, or availability failure.

For a time-based claim, the focal may be a capture sequence rather than one file. Keep the same identity and data across its states. Request targeted supplementary capture when a required state, resolution, viewport, or clean account is missing.

Capture at native or higher useful resolution. For a planned push-in, capture the region with real pixel headroom. For a scroll, prefer a trustworthy full-page capture or overlapping real positions. Do not upscale a 1× plate and call it a detail shot. Do not rebuild an entire page when one independently moving element is enough.

## Preserve human evidence

Human presence can live in behavior without filming hands or inventing personality. Useful evidence includes:

- real text being entered or selected;
- a cursor or focus state that reveals intention;
- a pause while the system works;
- a before/after state that preserves the same object;
- a result being opened, checked, exported, shared, or compared;
- real creator language, annotation, or source-native marks;
- supplied faces, gestures, voices, objects, and environments when authorized.

Use these only when they explain actual use. Do not manufacture random cursor movement, fake loading, arbitrary handwritten marks, or synthetic imperfections.

## Reject weak assets

Reject or replace:

- repeated homepage heroes and repeated logos with no new role;
- generic stock or decorative marketing images presented as evidence; stock may serve a named context or atmosphere role when its license and limitation are explicit;
- tiny icons or full-page screenshots that cannot be read at delivery size;
- inconsistent app versions, themes, accounts, locales, or data states;
- loading, error, cookie, notification, or modal states unless they are the subject;
- private data, unauthorized people, unlicensed brands, and unclear provenance;
- imagery that requires distortion, excessive zoom, or impossible cropping;
- any asset selected only because the timeline has an empty space.

## Record the decision

Inside a complete film, write the result into the matching `STORYBOARD.md` frame narrative:

```markdown
Claim and proof: <claim> → <visible evidence>
Capture sequence: <establish> → <action> → <response> → <result>
Selected media:
- focal: <canonical id or project-relative path> — <reason>
- supporting: <id/path or none> — <reason>
- fallback: <id/path> — <limitation it protects against>
Constraints: <rights, privacy, crop, resolution, version, or continuity notes>
```

Keep this prose compact and omit irrelevant lines. Do not create another storyboard or private required fields.

Write `asset-plan.json` only for a direct asset-planning request or when multiple unresolved sourcing/licensing decisions need an independent machine-readable receipt. Otherwise the official capture inventory plus `STORYBOARD.md` is sufficient.

Ask `vidmuse-media` to resolve an approved media operation it implements, or return an exact capture request to the film owner for execution through `hyperframes-cli`. Preserve returned local paths and provenance receipts; do not replace the approved identity with a convenient substitute.

## Selection gate

Pass only when:

- every factual claim has evidence or is explicitly marked unsupported;
- every selected asset has a unique narrative role;
- state-changing claims have understandable cause and result coverage;
- focal details remain legible at the final ratio;
- adjacent assets can be edited without losing orientation;
- rights, privacy, source, and version are known enough for the intended use;
- no decorative candidate is standing in for missing proof.

## Boundaries

- Own evidence needs, semantic identity, candidate selection, capture coverage, provenance, licensing, privacy, library policy, and sourcing constraints.
- Let the film owner decide claims, beat order, packaging density, and final acceptance.
- Let `vidmuse-design` decide visual treatment and `vidmuse-motion` decide choreography.
- Let the host Agent's native web, browser, download, and file tools execute approved remote discovery and localization when available.
- Let `hyperframes-cli` execute official website capture only as the fallback when native Agent capabilities are unavailable or insufficient; let `vidmuse-timeline` assemble or render the film.
- Treat HyperFrames Registry items as reusable visual units, not as the raw asset library.
- Do not generate, transform, animate, compose, or render files here. Select and hand off exact native-download or Capture targets; the executing capability returns the verified local path.
