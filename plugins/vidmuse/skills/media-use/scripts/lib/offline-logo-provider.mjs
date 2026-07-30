// Offline floor for the logo cascade.
//
// This is the LAST tier, after Lobe Icons, SVGL, Simple Icons, GitHub avatars,
// and favicons. Ordering is the whole design: brand marks change and new models
// appear constantly, so a live source must always win. A frozen copy is only
// correct when there is no live answer available — offline, or every online tier
// missed.
//
// It deliberately does NOT use the Core Pack's keyword ranking. Icon search
// wants recall; identity search wants exactness. A near-miss icon is a stylistic
// choice, a near-miss logo is a factual error in the finished film, so matching
// here reuses the live provider's exact-identity rule: normalized equality
// against the brand's own id, never a relationship parenthetical, a group, or a
// fuzzy score.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { corePackRoot, readIndex, resolveItemPath } from "./core-pack-provider.mjs";
import { entityFrom, LogoResolutionConstraintError, titleMatches } from "./logo-provider.mjs";

const PACK = "lobe-brands";

/**
 * Group the preinstalled brand marks by brand id.
 *
 * The pack freezes exactly ONE mark per brand — color where upstream has it,
 * mono otherwise — so this is a straight id → item map. The variant that was
 * chosen is recorded on the item's tags and reported in the receipt; this tier
 * does not offer a styling menu, which is what the live cascade is for.
 *
 * Chinese names come from the pack's own `aliases_zh` so a 中文 query resolves
 * offline too, but they are matched with the same exact-equality rule as the
 * English id — an alias is an alternate name for one company, not a category.
 */
export function indexBrands(index) {
  const brands = new Map();
  for (const item of index?.items || []) {
    if (item.pack !== PACK || item.type !== "offline-logo") continue;
    const brand = item.id.split("/").pop();
    const variant = (item.tags || []).includes("color") ? "color" : "mono";
    brands.set(brand, {
      brand,
      item,
      variant,
      aliases: new Set(item.aliases_zh || []),
    });
  }
  return brands;
}

function findBrand(brands, entity) {
  for (const record of brands.values()) {
    if (titleMatches(record.brand, entity)) return record;
    for (const alias of record.aliases) {
      if (titleMatches(alias, entity)) return record;
    }
  }
  return null;
}

/**
 * Resolve a logo from the preinstalled set.
 *
 * Returns null (a clean miss) rather than an approximate match when the brand is
 * not in the curated set — the caller then reports a normal miss, which is the
 * honest outcome for a mark we do not have.
 */
export async function offlineLogoSearch(intent, ctx = {}) {
  const root = ctx.corePackRoot || corePackRoot();
  const index = readIndex(root);
  if (!index) return null;

  const brands = indexBrands(index);
  if (brands.size === 0) return null;

  const entity = entityFrom(intent, ctx.entity);
  if (!entity) return null;
  const record = findBrand(brands, entity);
  if (!record) return null;

  // An explicit variant is a hard constraint, exactly as in the live cascade:
  // silently serving a different variant than the one asked for is a visual
  // substitution the caller never approved. Since only one mark per brand is
  // frozen, a request for anything else is terminal rather than approximated.
  if (ctx.variant && ctx.variant !== record.variant) {
    throw new LogoResolutionConstraintError(
      "logo_variant_unavailable",
      `logo variant "${ctx.variant}" is unavailable offline for ${record.brand}`,
      {
        requested_entity: entity,
        resolved_entity: record.brand,
        requested_variant: ctx.variant,
        available_variants: [record.variant],
        note: "the offline Core Pack floor freezes one mark per brand — color where upstream has it, mono otherwise. Other variants resolve online only.",
      },
    );
  }

  return freeze(record, record.item, record.variant, entity, root, index);
}

function freeze(record, item, variant, entity, root, index) {
  const localPath = resolveItemPath(item, root);
  if (!localPath || !existsSync(localPath)) return null;
  const packMeta = index?.packs?.[PACK] || {};
  const upstream = packMeta.upstream || {};

  return {
    localPath,
    ext: ".svg",
    source: "core-pack",
    metadata: {
      description: `${record.brand} logo (${variant}, preinstalled offline fallback)`,
      provider: "core-pack.brands",
      // `license_state` remains the shared media-use copyright field. Trademark
      // permission is separate and deliberately not implied by the MIT receipt.
      license_state: "verified-commercial",
      copyright_state: "verified-redistributable",
      trademark_state: "identification-only",
      license: {
        id: "MIT",
        notice_required: true,
        commercial_use: true,
        source_url: "https://github.com/lobehub/lobe-icons/blob/master/LICENSE",
        copyright: "Copyright (c) 2023 LobeHub",
        trademark_note: "Third-party identification mark; trademark rights remain with owner.",
      },
      provenance: {
        entity,
        requested_entity: entity,
        // Same field the live cascade sets, so cache-reuse identity checks
        // (logoIdentityMatches) treat an offline hit exactly like an online one.
        resolved_entity: record.brand,
        variant,
        catalog_package: upstream.catalog_npm
          ? `${upstream.catalog_npm}@${upstream.catalog_version}`
          : null,
        asset_package: upstream.npm ? `${upstream.npm}@${upstream.version}` : null,
        license: "MIT",
        copyright_state: "verified-redistributable",
        trademark_state: "identification-only",
        license_url: "https://github.com/lobehub/lobe-icons/blob/master/LICENSE",
        copyright: "Copyright (c) 2023 LobeHub",
        core_pack_id: item.id,
        offline_fallback: true,
        // Recorded so a reviewer can tell a frozen mark from a live one and
        // knows to re-resolve online if the brand may have changed.
        staleness_note:
          "Resolved from the preinstalled Core Pack because no live logo source answered. The frozen catalog may lag the brand's current mark; re-resolve online to confirm before shipping a brand-sensitive film.",
      },
    },
  };
}

export const offlineLogoProvider = { search: offlineLogoSearch };
