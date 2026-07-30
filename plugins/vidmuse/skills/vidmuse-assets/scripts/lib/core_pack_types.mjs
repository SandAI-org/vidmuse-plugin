// Type registry loader. types.json is the single source of truth for which
// asset types the Core Pack indexes and how each one is discovered. Nothing
// else in the plugin may hard-code a second type list — that divergence is
// exactly what made the v1 layout hard to extend.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve as pathResolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_CORE_PACK_ROOT = pathResolve(HERE, "../../assets/core-pack");

export const DISCOVERY_MODES = new Set(["keyword", "table", "sheet"]);

let cache = new Map();

/** Load and shallow-validate types.json for a Core Pack root. */
export function loadTypes(root = DEFAULT_CORE_PACK_ROOT) {
  const key = pathResolve(root);
  if (cache.has(key)) return cache.get(key);
  const path = join(key, "types.json");
  if (!existsSync(path)) throw new Error(`missing type registry: ${path}`);
  let doc;
  try {
    doc = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`cannot read ${path}: ${error.message}`);
  }
  if (doc?.schema !== "vidmuse.core-pack.types.v1") {
    throw new Error(`${path}: schema must equal vidmuse.core-pack.types.v1`);
  }
  if (!doc.types || typeof doc.types !== "object" || Array.isArray(doc.types)) {
    throw new Error(`${path}: types must be an object`);
  }
  for (const [name, spec] of Object.entries(doc.types)) {
    if (!DISCOVERY_MODES.has(spec?.discovery)) {
      throw new Error(
        `${path}: type "${name}" has unsupported discovery "${spec?.discovery}" (known: ${[...DISCOVERY_MODES].join(", ")})`,
      );
    }
    if (!Array.isArray(spec.extensions) || spec.extensions.length === 0) {
      throw new Error(`${path}: type "${name}" needs a non-empty extensions array`);
    }
  }
  cache.set(key, doc);
  return doc;
}

/** Reset the loader cache (tests write types.json into temp roots). */
export function clearTypeCache() {
  cache = new Map();
}

/** Every indexed type name. */
export function typeNames(root) {
  return Object.keys(loadTypes(root).types);
}

/** Type names this plugin actually redistributes (no external_root). */
export function ownedTypeNames(root) {
  const { types } = loadTypes(root);
  return Object.keys(types).filter((name) => !types[name].external_root);
}

export function typeSpec(name, root) {
  return loadTypes(root).types[name] || null;
}

/** Which discovery mode a type uses, or null for an unknown type. */
export function discoveryFor(name, root) {
  return typeSpec(name, root)?.discovery || null;
}

/** Types that a given external root is allowed to contribute. */
export function typesForExternalRoot(rootName, root) {
  const { types } = loadTypes(root);
  return Object.keys(types).filter((name) => types[name].external_root === rootName);
}

/** Extension -> type map, for probing files whose type is not declared. */
export function extensionOwners(root) {
  const { types } = loadTypes(root);
  const owners = new Map();
  for (const [name, spec] of Object.entries(types)) {
    for (const ext of spec.extensions) {
      if (!owners.has(ext)) owners.set(ext, []);
      owners.get(ext).push(name);
    }
  }
  return owners;
}
