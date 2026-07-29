#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve as pathResolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = pathResolve(HERE, "../templates/creator-library/manifest.json");
export const DEFAULT_ROOT = pathResolve(
  process.env.VIDMUSE_CREATOR_LIBRARY ||
    join(homedir(), ".media", "libraries", "creator"),
);
const LICENSE_STATES = new Set([
  "verified-commercial",
  "verified-personal",
  "user-licensed",
  "unknown",
  "no-redistribution",
]);
const TYPES = new Set([
  "brand",
  "font",
  "icon",
  "logo",
  "image",
  "texture",
  "sfx",
  "music",
  "video",
]);

function inside(root, path) {
  const full = pathResolve(root, path);
  return full === root || full.startsWith(`${root}/`);
}

export function validateCreatorLibrary(manifest, root = DEFAULT_ROOT) {
  const errors = [];
  const err = (message) => errors.push(message);
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return ["manifest must be a JSON object"];
  }
  if (manifest.schema !== "vidmuse.creator-library.v1") {
    err("schema must equal vidmuse.creator-library.v1");
  }
  if (manifest.private !== true) {
    err("private must be true; Creator Library is never plugin-distributed");
  }
  if (!Array.isArray(manifest.assets)) {
    err("assets must be an array");
    return errors;
  }
  const ids = new Set();
  for (const [index, asset] of manifest.assets.entries()) {
    const where = asset?.id || `assets[${index}]`;
    if (!asset || typeof asset !== "object" || Array.isArray(asset)) {
      err(`${where}: must be an object`);
      continue;
    }
    if (typeof asset.id !== "string" || !asset.id.trim()) err(`${where}: id is required`);
    else if (ids.has(asset.id)) err(`${where}: duplicate id`);
    else ids.add(asset.id);
    if (!TYPES.has(asset.type)) err(`${where}: unsupported type ${String(asset.type)}`);
    if (typeof asset.path !== "string" || !asset.path.trim()) {
      err(`${where}: path is required`);
    } else if (!inside(root, asset.path)) {
      err(`${where}: path must stay inside Creator Library`);
    } else if (!existsSync(pathResolve(root, asset.path))) {
      err(`${where}: file does not exist: ${asset.path}`);
    }
    if (!LICENSE_STATES.has(asset.license_state)) {
      err(`${where}: license_state is required`);
    }
    if (asset.license_state === "user-licensed") {
      if (typeof asset.license_receipt !== "string" || !asset.license_receipt.trim()) {
        err(`${where}: user-licensed asset requires license_receipt`);
      } else if (!inside(root, asset.license_receipt)) {
        err(`${where}: license_receipt must stay inside Creator Library`);
      } else if (!existsSync(pathResolve(root, asset.license_receipt))) {
        err(`${where}: license receipt does not exist: ${asset.license_receipt}`);
      }
    }
  }
  return errors;
}

function initialize(root) {
  if (existsSync(join(root, "manifest.json"))) {
    throw new Error(`${join(root, "manifest.json")} already exists`);
  }
  for (const category of [
    "brand-kits",
    "fonts",
    "icons",
    "photos/work",
    "photos/life",
    "photos/teaching",
    "textures",
    "sfx",
    "music",
    "video",
    "licenses",
  ]) {
    mkdirSync(join(root, category), { recursive: true });
  }
  writeFileSync(join(root, "manifest.json"), readFileSync(TEMPLATE));
}

export function runCli(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      root: { type: "string", default: DEFAULT_ROOT },
      init: { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
    strict: true,
  });
  if (values.help) {
    console.log(
      "Usage: node creator_library.mjs [--root <private-dir>] [--init] [--json]",
    );
    return 0;
  }
  const root = pathResolve(values.root);
  if (values.init) {
    try {
      initialize(root);
    } catch (error) {
      console.error(`error: ${error.message}`);
      return 1;
    }
  }
  const path = join(root, "manifest.json");
  if (!existsSync(path)) {
    console.error(`error: missing ${path} — pass --init to create the private framework`);
    return 1;
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    console.error(`error: cannot read ${path}: ${error.message}`);
    return 1;
  }
  const errors = validateCreatorLibrary(manifest, root);
  if (values.json) {
    console.log(
      JSON.stringify({
        ok: errors.length === 0,
        root,
        assets: Array.isArray(manifest.assets) ? manifest.assets.length : 0,
        errors,
      }),
    );
  } else if (errors.length > 0) {
    for (const error of errors) console.error(`FAIL ${error}`);
    console.error(`error: ${errors.length} Creator Library violation(s)`);
  } else {
    console.log(`ok: private Creator Library — ${manifest.assets.length} assets at ${root}`);
  }
  return errors.length === 0 ? 0 : 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(pathResolve(process.argv[1])).href
) {
  process.exitCode = runCli();
}
