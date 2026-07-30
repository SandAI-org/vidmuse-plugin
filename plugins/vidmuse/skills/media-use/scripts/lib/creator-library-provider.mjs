// Exact-id adapter for the private Creator Library.
//
// vidmuse-assets owns admission and approval. media-use only copies one
// already-approved item into the project and records its private provenance.
// There is intentionally no fuzzy fallback: searching a private collection and
// silently choosing a neighbour would turn an editorial decision into provider
// guesswork.

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, resolve as pathResolve } from "node:path";

import {
  DEFAULT_ROOT,
  validateCreatorLibrary,
} from "../../../vidmuse-assets/scripts/creator_library.mjs";

const TYPE_ALIASES = Object.freeze({
  bgm: new Set(["bgm", "music"]),
});

export class CreatorLibraryConstraintError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "CreatorLibraryConstraintError";
    this.code = code;
    this.details = details;
    this.terminal = true;
  }
}

function typeMatches(stored, requested) {
  if (stored === requested) return true;
  return TYPE_ALIASES[requested]?.has(stored) === true;
}

function normalizedIdentity(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function readCreatorLibrary(root = DEFAULT_ROOT) {
  const manifestPath = join(root, "manifest.json");
  if (!existsSync(manifestPath)) return null;
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const errors = validateCreatorLibrary(manifest, root);
    return errors.length === 0 ? manifest : null;
  } catch {
    return null;
  }
}

export async function creatorLibrarySearch(_intent, ctx = {}) {
  const id = String(ctx.creatorLibraryId || "").trim();
  if (!id) return null;

  const root = pathResolve(ctx.creatorLibraryRoot || DEFAULT_ROOT);
  const manifest = readCreatorLibrary(root);
  if (!manifest) {
    throw new CreatorLibraryConstraintError(
      "creator_library_unavailable",
      `Creator Library is missing or invalid at ${root}`,
      { creator_library_id: id },
    );
  }

  const asset = manifest.assets.find((entry) => entry?.id === id);
  if (!asset) {
    throw new CreatorLibraryConstraintError(
      "creator_library_asset_missing",
      `Creator Library asset "${id}" does not exist`,
      { creator_library_id: id },
    );
  }
  if (!typeMatches(asset.type, ctx.type)) {
    throw new CreatorLibraryConstraintError(
      "creator_library_type_mismatch",
      `Creator Library asset "${id}" is ${asset.type}, not ${ctx.type}`,
      { creator_library_id: id, stored_type: asset.type, requested_type: ctx.type },
    );
  }
  if (asset.license_state === "unknown" || asset.license_state === "no-redistribution") {
    throw new CreatorLibraryConstraintError(
      "creator_library_license_blocked",
      `Creator Library asset "${id}" cannot be frozen with license_state=${asset.license_state}`,
      { creator_library_id: id, license_state: asset.license_state },
    );
  }
  if (ctx.variant && asset.variant !== ctx.variant) {
    throw new CreatorLibraryConstraintError(
      "creator_library_variant_mismatch",
      `Creator Library asset "${id}" does not attest variant "${ctx.variant}"`,
      {
        creator_library_id: id,
        requested_variant: ctx.variant,
        stored_variant: asset.variant || null,
      },
    );
  }
  if (
    ctx.type === "logo" &&
    normalizedIdentity(asset.entity) !== normalizedIdentity(ctx.entity)
  ) {
    throw new CreatorLibraryConstraintError(
      "creator_library_identity_mismatch",
      `Creator Library logo "${id}" identifies ${asset.entity}, not ${ctx.entity}`,
      {
        creator_library_id: id,
        stored_entity: asset.entity || null,
        requested_entity: ctx.entity || null,
      },
    );
  }

  const localPath = pathResolve(root, asset.path);
  if (!existsSync(localPath)) {
    throw new CreatorLibraryConstraintError(
      "creator_library_file_missing",
      `Creator Library file is missing for "${id}": ${asset.path}`,
      { creator_library_id: id },
    );
  }
  const actualSha = sha256(localPath);
  if (asset.sha256 && asset.sha256 !== actualSha) {
    throw new CreatorLibraryConstraintError(
      "creator_library_hash_mismatch",
      `Creator Library asset "${id}" changed after admission`,
      { creator_library_id: id, expected_sha256: asset.sha256, actual_sha256: actualSha },
    );
  }

  return {
    localPath,
    source: "creator-library",
    ...(extname(localPath) ? { ext: extname(localPath) } : {}),
    metadata: {
      description: asset.description || asset.title || id,
      provider: "creator-library",
      license_state: asset.license_state,
      license: {
        ...(asset.license_id ? { id: asset.license_id } : {}),
        ...(asset.license_scope ? { scope: asset.license_scope } : {}),
        ...(asset.license_receipt ? { receipt: asset.license_receipt } : {}),
      },
      ...(asset.width != null ? { width: asset.width } : {}),
      ...(asset.height != null ? { height: asset.height } : {}),
      ...(asset.duration != null ? { duration: asset.duration } : {}),
      provenance: {
        creator_library_id: id,
        creator_library_version: manifest.version || null,
        source_sha256: actualSha,
        ...(asset.entity ? { resolved_entity: asset.entity } : {}),
        ...(asset.variant ? { variant: asset.variant } : {}),
        private_library: true,
      },
    },
  };
}

export const creatorLibraryProvider = { search: creatorLibrarySearch };
