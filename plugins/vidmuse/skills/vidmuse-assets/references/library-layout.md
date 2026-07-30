# Hybrid Asset Library

VidMuse preinstalls a small legal core and the intelligence to find more. It
does not become a warehouse of third-party files.

## Four layers

| Layer | Location | Owner | Purpose |
| --- | --- | --- | --- |
| Project Freeze | `<project>/.media/` | `media-use` runtime | Immutable files actually used by one film |
| Creator Library | `~/.media/libraries/creator/` | user + `vidmuse-assets` policy | Private licensed and personal material |
| Core Pack | `vidmuse-assets/assets/core-pack/` | plugin | Tiny redistributable offline baseline |
| Dynamic Providers | provider adapters | `vidmuse-assets` policy + `media-use` execution | Exact on-demand retrieval/generation |

Project Freeze always wins because the shipped film must remain reproducible.
Creator Library is private and must never be copied into the plugin package.
Core Pack is read-only at runtime. Provider results become project files
before composition.

## Core Pack structure

Core Pack is organized as **packs**, not as loose files, and it separates the
license ledger from the retrieval index:

| File | Role |
| --- | --- |
| `types.json` | Which asset types exist and how each is discovered |
| `packs/<id>/pack.json` | Ledger: one license + one pinned upstream version per pack, plus per-file hashes |
| `packs/<id>/tags.json` | Semantic tags and Chinese aliases; survives reindex |
| `index.json` | Derived query surface — the only file the provider reads |

Read `assets/core-pack/README.md` before admitting content or adding a type.

Core Pack is also the **single query surface** over static assets that live in
other skills. `manifest.json` declares roots; only `core-pack` is owned. `sfx`
(from `media-use`) and `palette` (from `hyperframes-creative`) are indexed
read-only, in place. Those skills are vendored from upstream HyperFrames, so
copying their files would mean a permanent re-vendor patch and a second source of
truth. One index, one query, zero byte movement.

## Core Pack admission

An item may enter an owned pack only when all are true:

- VidMuse owns it or redistribution is explicitly permitted;
- commercial output is permitted;
- its notice is stored inside its own pack directory;
- `pack.json` pins an upstream version (`npm`+`version`, `url`+`ref`, or
  `self: true` for original work) and hashes every file;
- the file is within its type's size budget and broadly useful enough to justify
  every install.

Brand logos, large marketplace packs, and per-font free-download claims do not
qualify by default. Fonts HyperFrames already pre-bundles do not qualify either —
re-shipping them is pure install weight.

Retrieval is deterministic keyword matching over upstream tags, mechanical
probes, and curated aliases. No embedding model: the plugin promises reproducible
receipts and a hard-offline `--local-only` path, and an explainable match lets an
agent fix a bad result by editing a tag instead of tuning a threshold.

## Creator Library admission

Creator Library may contain private materials that cannot be redistributed:

- purchased icon/illustration packs;
- user brand kits;
- personal work/life/teaching photos;
- confirmed fonts, SFX, textures, music, and references.

Each entry still needs a source/license scope. `user-licensed` means the user
may use it under their receipt; it does not mean VidMuse may redistribute it.

Initialize the private framework only when the user wants one:

```bash
node scripts/creator_library.mjs --init
```

Override its location with `--root` or `VIDMUSE_CREATOR_LIBRARY`. Initialization
creates empty category folders plus a private manifest; it imports nothing.

## Lookup order

```text
project freeze
→ creator library
→ core pack
→ deterministic catalog
→ official web source
→ VidMuse generation
```

Logos stop before generation. Unknown-license material is preview-only.

This order is enforced in `media-use/scripts/lib/registry.mjs`: the `core-pack`
provider is declared ahead of `vidmuse.model` for every type it can serve, and it
exposes `search` only — it can never generate. `shape`, `texture`, `overlay`,
`font`, `lottie`, and `palette` resolve through it.

**`logo` inverts the order deliberately.** Brand marks change and new models ship
constantly, so live sources stay authoritative and the preinstalled set is the
*last* tier, not the third:

```text
lobehub.icons → svgl → simple-icons → github.avatar → favicon.ddg → core-pack.brands
```

A frozen mark is only correct when no live source answered — offline, or every
online tier missed. It is also the only logo tier that survives `--local-only`.
An offline hit is stamped `offline_fallback: true` with a staleness note; a brand
outside the curated set is a clean miss rather than an approximation, because a
near-miss logo is a factual error in the film, not a stylistic choice.

## Stable identity

Use content hashes to deduplicate bytes, stable asset ids to bind plans, and
canonical entity plus variant to reuse identity assets. Provider/catalog
updates never rewrite a project-frozen file automatically.
