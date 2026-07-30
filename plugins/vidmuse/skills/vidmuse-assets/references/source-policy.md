# Asset Source and License Policy

Read this file when onboarding a source, importing an asset pack, or deciding
whether an asset can ship in a commercial film.

## Source matrix

| Source | Product role | Automation rule |
| --- | --- | --- |
| [Lobe Icons](https://github.com/lobehub/lobe-icons) | AI/LLM brand marks | Exact match; pinned static SVG; MIT receipt; trademark caution |
| [Thiings](https://www.thiings.co/terms) | 3D concept illustrations | Never bundle or scrape; only index a user-licensed private collection |
| [喵闪字库](https://www.miao3.cn/) | Chinese font discovery | Verify original author/license; aggregator claim alone is insufficient |
| [DaFont](https://www.dafont.com/faq.php) | Latin/display font discovery | Read archive README/license and author site; labels are indications only |

## Provider admission checklist

- The source permits the intended commercial or personal use.
- Redistribution terms allow the way VidMuse stores or ships the asset.
- Attribution requirements can be expressed in the output.
- A stable source id and version/date are recordable.
- The provider can return direct bytes without scraping around access control.
- The final project freezes its own copy; the provider URL is provenance, not
  a render-time dependency.

If one item is unknown, keep the source in discovery/preview mode.

## Distribution boundary

- **Core Pack:** only plugin-redistributable assets with commercial-output
  rights and a bundled notice. Admission is stricter than project use.
- **Creator Library:** private/user-licensed material; may be copied into an
  authorized project but never into the plugin package.
- **Project Freeze:** the exact local file used by one film, with source and
  license scope recorded.
- **Provider catalog:** metadata and adapters may ship even when the asset
  bytes may not.

Read [library-layout.md](library-layout.md) before moving an asset between
these scopes.

## Copyright and trademark are separate gates

`license_state` describes copyright/redistribution permission for the asset
bytes. It does not grant trademark rights. Identification marks additionally
record:

- `copyright_state: verified-redistributable` when the packaged bytes and
  notice may be redistributed;
- `trademark_state: identification-only` when the mark may identify the entity
  being discussed but must not imply sponsorship, endorsement, or ownership.

Do not collapse these into a blanket “commercially cleared” claim. A film may
have copyright permission to render the SVG and still need contextual review
for how the trademark is presented.

## Thiings

Free downloads are personal/non-commercial and require visible attribution.
Paid tiers permit commercial project use within their revenue/client scope,
but no tier permits reselling or redistributing the icons as a standalone
collection.

The safe future implementation is a local provider:

```text
~/.media/libraries/thiings/
  license.json
  metadata.json
  assets/
```

The provider verifies `license.json`, searches local metadata, and copies only
the selected asset into the project. The plugin must not contain the
collection.

## Fonts

Treat a font as software plus artwork, not as an unlicensed image.

Before use, record:

- family/style and source;
- original author URL;
- license id and license file;
- commercial-use scope;
- embedding and redistribution permission;
- whether subsetting/modification is allowed;
- glyph coverage needed by the locked transcript.

Default commercial allowlist:

```text
OFL-1.1 | Apache-2.0 | CC0/Public Domain | explicit author commercial license
```

Block by default:

```text
personal use | demo | unknown | no license file/source | embedding prohibited
```

Third-party fonts normally live under the film's `public/fonts/` and use
explicit `@font-face`. A font may enter Core Pack only as a narrow exception
when it uses the allowlist above, redistribution and modification/subsetting
are confirmed, the complete license receipt ships beside it, its family is not
already bundled by HyperFrames, and the pack ledger records glyph coverage and
the modified/subset status. Unverified, purchased, or project-specific fonts
never enter the plugin.
