# Intent capture — VidMuse product ownership

This reference does not route new work through HyperFrames. `/vidmuse`
selects the owner by requested deliverable:

- Existing speaking footage → `/vidmuse-recut`.
- Film material must be made → `/vidmuse-create`.
- Semantic asset/library result → `/vidmuse-assets`.
- Standalone ASR, ATA, TTS, generation, or media transform → `/media-use`.

HyperFrames domain skills load only after one of those products owns the run,
or when the user requests a specific operation on an existing HyperFrames
composition.

## Read memory before asking

Let `<MEDIA_DIR>` be the bundled `/media-use` directory and `<MEMORY_ROOT>` the
project root. For a pre-project probe, use a deliberately nonexistent temporary
path rather than the current workspace.

```bash
node <MEDIA_DIR>/scripts/prefs.mjs get --project <MEMORY_ROOT> --json
node <MEDIA_DIR>/scripts/recipe.mjs list --project <MEMORY_ROOT> --json
```

Remembered values reorder recommendations; they do not silently answer a
required product question.

## Input triage

- User media remains first priority and is adopted through `/media-use`.
- A website URL is captured as real product evidence inside
  `/vidmuse-create`; it is not a separate product workflow.
- A Figma source may be imported only through an available connected
  app/tool. If none is available, ask for exported frames/assets. Freeze the
  result locally and record provenance.
- AI voice, music, image, avatar, and video generation always discovers and
  runs a live VidMuse model through `/media-use`.
- Missing spoken text uses VidMuse ASR; real word timing uses VidMuse ATA.

## Question discipline

Ask only what the owning product skill needs and the request has not already
answered. One question per field, recommended option first with a short reason.
Keep user-stated facts separate from inferred/defaulted decisions.

`flow` and `storyboard` remain independent:

- `flow`: `automation` or `companion`
- `storyboard`: `yes` or `no`

A “just build it” signal sets automation with no storyboard. A storyboard
request sets storyboard yes. Neither choice changes the owning product.

## Capability offers

Use the VidMuse-normalized `capability-menu.md`. Offer one or two capabilities
that clearly follow from the brief; do not enumerate the whole menu unless the
user asks. Do not install an upstream workflow because a capability is
requested.

## Durable handoff

The owning product writes `BRIEF.md` before production, preserving:

- message, audience, destination, aspect, language, and length;
- source assets and provenance;
- chosen design direction and optional capabilities;
- `flow`, `storyboard`, and the derived collaboration mode;
- user-stated versus inferred/defaulted decisions.

Rendering remains user-gated. The default review surface is the VidMuse
Timeline from `vidmuse serve`, not HyperFrames Studio.
