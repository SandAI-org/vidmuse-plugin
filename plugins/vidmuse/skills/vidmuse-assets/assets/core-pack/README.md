# VidMuse Core Pack

This directory is the preinstalled, read-only baseline for assets that must be
available without a provider lookup. The framework is active; the content list
is intentionally empty until VidMuse chooses the initial pack.

Add an asset only when:

1. the file may be redistributed with the plugin;
2. commercial video output is permitted;
3. its notice/receipt exists under `licenses/`;
4. `manifest.json` records its path, SHA-256, type, tags, and license;
5. its size and general usefulness justify every plugin install.

Do not place purchased marketplace packs, scraped collections, arbitrary brand
logos, or unverified free fonts here. Those belong in the private Creator
Library or a dynamic provider.

Reserved categories:

- `brand/` — VidMuse-owned marks only by default;
- `fonts/` — deliberately selected redistributable fallbacks;
- `icons/` — small generic/offline UI primitives;
- `textures/` — small seamless or procedural support material;
- `sfx/` — minimal offline sound primitives;
- `licenses/` — one receipt/notice per admitted item or package.

`manifest.json` is the source of truth. A file not listed there is not a Core
Pack asset.

Validate the framework or future content:

```bash
node ../../scripts/core_pack.mjs
```
