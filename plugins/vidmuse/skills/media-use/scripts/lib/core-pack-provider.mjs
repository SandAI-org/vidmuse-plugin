// Core Pack provider — the read path for preinstalled assets.
//
// vidmuse-assets owns the Core Pack's contents, license policy, and index; this
// adapter only resolves an already-decided request against that index. It is a
// local provider (no `network` flag), so it participates under --local-only and
// runs before any generative provider, which is what library-layout.md's lookup
// order has always specified.
//
// Ranking lives in vidmuse-assets/scripts/lib/core_pack_query.mjs so the CLI an
// agent runs and the resolution a film performs can never disagree.

import { existsSync, readFileSync } from "node:fs";
import { join, resolve as pathResolve } from "node:path";

import { queryIndex, stableChoice } from "../../../vidmuse-assets/scripts/lib/core_pack_query.mjs";
import { resolveIndexItem } from "../../../vidmuse-assets/scripts/core_pack.mjs";

const CORE_PACK_ROOT =
  process.env.VIDMUSE_CORE_PACK_DIR ||
  pathResolve(import.meta.dirname, "../../../vidmuse-assets/assets/core-pack");

export class CorePackConstraintError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "CorePackConstraintError";
    this.code = code;
    this.details = details;
    this.terminal = true;
  }
}

export function corePackRoot() {
  return CORE_PACK_ROOT;
}

/** Read index.json, or null when the Core Pack has never been indexed. */
export function readIndex(root = CORE_PACK_ROOT) {
  const path = join(root, "index.json");
  if (!existsSync(path)) return null;
  try {
    const doc = JSON.parse(readFileSync(path, "utf8"));
    return doc?.schema === "vidmuse.core-pack.index.v1" ? doc : null;
  } catch {
    return null; // a corrupt index is a clean miss, not a crash
  }
}

/** Chinese query lexicon; absent means no expansion, never an error. */
export function readLexicon(root = CORE_PACK_ROOT) {
  const path = join(root, "lexicon-zh.json");
  if (!existsSync(path)) return null;
  try {
    const doc = JSON.parse(readFileSync(path, "utf8"));
    return doc?.schema === "vidmuse.core-pack.lexicon.v1" ? doc : null;
  } catch {
    return null;
  }
}

/**
 * Absolute path for an index item.
 *
 * Owned items are relative to the Core Pack root. External-root items (sfx,
 * palettes) are relative to their own root, which manifest.json declares — the
 * files stay where their vendored skill owns them and are never copied.
 */
export function resolveItemPath(item, root = CORE_PACK_ROOT) {
  if (!item?.path) return null;
  if (!item.root || item.root === "core-pack") return join(root, item.path);
  const manifestPath = join(root, "manifest.json");
  if (!existsSync(manifestPath)) return null;
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const spec = manifest?.roots?.[item.root];
    if (!spec?.path) return null;
    return pathResolve(root, spec.path, item.path);
  } catch {
    return null;
  }
}

/**
 * Search the Core Pack for one deterministic request.
 *
 * Returns the media-use provider result shape (same as brand-provider): a
 * localPath plus provenance metadata, which resolve.mjs freezes into the project
 * and records in .media/manifest.jsonl.
 *
 * `entity` is NOT used as a search key here. Core Pack holds generic material;
 * identity assets resolve through the logo cascade, and letting an entity name
 * fuzzy-match a generic icon is exactly the wrong-identity substitution the
 * semantic pass forbids.
 */
export async function corePackSearch(intent, ctx = {}) {
  const root = ctx.corePackRoot || CORE_PACK_ROOT;
  const index = readIndex(root);
  if (!index) return null;

  const type = ctx.type;
  if (!type) return null;
  // Only serve types the index actually carries, so an unrelated request falls
  // through to the next provider immediately.
  if (!index.items?.some((item) => item.type === type)) return null;

  let chosen;
  if (ctx.corePackId) {
    const exact = index.items.find((item) => item.id === ctx.corePackId);
    if (!exact) {
      throw new CorePackConstraintError(
        "core_pack_asset_missing",
        `Core Pack asset "${ctx.corePackId}" does not exist`,
        { core_pack_id: ctx.corePackId },
      );
    }
    if (exact.type !== type) {
      throw new CorePackConstraintError(
        "core_pack_type_mismatch",
        `Core Pack asset "${ctx.corePackId}" is ${exact.type}, not ${type}`,
        { core_pack_id: ctx.corePackId, stored_type: exact.type, requested_type: type },
      );
    }
    chosen = resolveIndexItem(index, exact);
  } else {
    const { results } = queryIndex(index, {
      query: intent,
      type,
      top: 8,
      mode: "keyword",
      // Same expansion the CLI uses, so browsing candidates and resolving them
      // can never disagree about what a Chinese intent matches.
      lexicon: readLexicon(root),
      ...(ctx.pack ? { pack: ctx.pack } : {}),
      ...(ctx.tileable != null ? { tileable: ctx.tileable } : {}),
      ...(ctx.alpha != null ? { alpha: ctx.alpha } : {}),
    });
    if (results.length === 0) return null;

    // Interchangeable top scorers (same pack, same score) are picked
    // deterministically rather than by first-in-index order, so a request is
    // reproducible without spending a model call separating near-identical files.
    const best = results[0];
    const tied = results.filter(
      (row) => row.score === best.score && row.item.pack === best.item.pack,
    );
    // Rejoin pack/type headers: the index normalizes license, upstream pin, and
    // usage guidance out of each item to keep the file small.
    chosen = resolveIndexItem(
      index,
      (tied.length > 1 ? stableChoice(tied, ctx.assetId || intent) : best).item,
    );
  }

  const localPath = resolveItemPath(chosen, root);
  if (!localPath || !existsSync(localPath)) return null;

  const ext = chosen.path.includes(".") ? `.${chosen.path.split(".").pop()}` : undefined;
  return {
    localPath,
    source: "core-pack",
    ...(ext ? { ext } : {}),
    metadata: {
      description: chosen.description || `${chosen.type} from Core Pack ${chosen.pack || chosen.root}`,
      provider: "core-pack",
      ...(chosen.license_state ? { license_state: chosen.license_state } : {}),
      ...(chosen.license ? { license: chosen.license } : {}),
      ...(chosen.geometry?.width != null ? { width: chosen.geometry.width } : {}),
      ...(chosen.geometry?.height != null ? { height: chosen.geometry.height } : {}),
      ...(chosen.geometry?.alpha != null ? { transparent: chosen.geometry.alpha } : {}),
      ...(chosen.duration != null ? { duration: chosen.duration } : {}),
      provenance: {
        core_pack_id: chosen.id,
        core_pack_root: chosen.root,
        ...(chosen.pack ? { pack: chosen.pack } : {}),
        ...(chosen.upstream ? { upstream: chosen.upstream } : {}),
        ...(chosen.value ? { value: chosen.value } : {}),
        // Carried through to the manifest so the composition author gets the
        // runtime contract with the file — a Lottie left on autoplay renders
        // non-deterministically, and that must not be discoverable only by
        // reading another skill's docs.
        ...(chosen.usage_contract ? { usage_contract: chosen.usage_contract } : {}),
        ...(chosen.hf_usage ? { hf_usage: chosen.hf_usage } : {}),
        // e.g. a subsetted CJK font: characters outside the subset render as
        // tofu boxes, so the limitation belongs in the receipt.
        ...(chosen.coverage ? { coverage: chosen.coverage } : {}),
        ...(chosen.license_origin ? { license_origin: chosen.license_origin } : {}),
      },
    },
  };
}

export const corePackProvider = { search: corePackSearch };
