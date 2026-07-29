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

## Core Pack admission

An item may enter Core Pack only when all are true:

- VidMuse owns it or redistribution is explicitly permitted;
- commercial output is permitted;
- required notices are stored under `licenses/`;
- the manifest records id, type, relative path, hash, license, attribution,
  tags, and intended use;
- the file is small and broadly useful enough to justify every install.

Brand logos, large icon collections, marketplace packs, and per-font
free-download claims do not qualify by default.

The initial Core Pack is framework-only. Its manifest has an empty `assets`
array until the user selects content.

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

## Stable identity

Use content hashes to deduplicate bytes, stable asset ids to bind plans, and
canonical entity plus variant to reuse identity assets. Provider/catalog
updates never rewrite a project-frozen file automatically.
