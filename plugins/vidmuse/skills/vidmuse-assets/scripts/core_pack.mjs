#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve as pathResolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ROOT = pathResolve(HERE, "../assets/core-pack");
const TYPES = new Set(["brand", "font", "icon", "texture", "sfx"]);

function inside(root, path) {
  const full = pathResolve(root, path);
  return full === root || full.startsWith(`${root}/`);
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function validateCorePack(manifest, root = DEFAULT_ROOT) {
  const errors = [];
  const err = (message) => errors.push(message);
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return ["manifest must be a JSON object"];
  }
  if (manifest.schema !== "vidmuse.core-pack.v1") {
    err("schema must equal vidmuse.core-pack.v1");
  }
  if (!manifest.categories || typeof manifest.categories !== "object") {
    err("categories object is required");
  }
  if (!Array.isArray(manifest.assets)) {
    err("assets must be an array");
    return errors;
  }

  const ids = new Set();
  manifest.assets.forEach((asset, index) => {
    const where = asset?.id || `assets[${index}]`;
    if (!asset || typeof asset !== "object" || Array.isArray(asset)) {
      err(`${where}: must be an object`);
      return;
    }
    if (typeof asset.id !== "string" || !asset.id.trim()) err(`${where}: id is required`);
    else if (ids.has(asset.id)) err(`${where}: duplicate id`);
    else ids.add(asset.id);
    if (!TYPES.has(asset.type)) err(`${where}: unsupported type ${String(asset.type)}`);
    if (typeof asset.path !== "string" || !asset.path.trim()) {
      err(`${where}: path is required`);
    } else if (!inside(root, asset.path)) {
      err(`${where}: path must stay inside Core Pack`);
    } else {
      const full = pathResolve(root, asset.path);
      if (!existsSync(full)) err(`${where}: file does not exist: ${asset.path}`);
      else if (!/^[a-f0-9]{64}$/.test(String(asset.sha256 || ""))) {
        err(`${where}: sha256 must be a lowercase 64-character digest`);
      } else if (sha256(full) !== asset.sha256) {
        err(`${where}: sha256 does not match file bytes`);
      }
    }
    const license = asset.license;
    if (!license || typeof license !== "object") {
      err(`${where}: license receipt is required`);
    } else {
      if (license.redistributable !== true) {
        err(`${where}: license.redistributable must be true`);
      }
      if (license.commercial_output !== true) {
        err(`${where}: license.commercial_output must be true`);
      }
      if (typeof license.receipt !== "string" || !license.receipt.trim()) {
        err(`${where}: license.receipt is required`);
      } else if (!inside(root, license.receipt)) {
        err(`${where}: license receipt must stay inside Core Pack`);
      } else if (!existsSync(join(root, license.receipt))) {
        err(`${where}: license receipt does not exist: ${license.receipt}`);
      }
    }
  });
  return errors;
}

export function runCli(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      root: { type: "string", default: DEFAULT_ROOT },
      json: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
    strict: true,
  });
  if (values.help) {
    console.log("Usage: node core_pack.mjs [--root <core-pack-dir>] [--json]");
    return 0;
  }
  const root = pathResolve(values.root);
  const path = join(root, "manifest.json");
  if (!existsSync(path)) {
    console.error(`error: missing ${path}`);
    return 1;
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    console.error(`error: cannot read ${path}: ${error.message}`);
    return 1;
  }
  const errors = validateCorePack(manifest, root);
  if (values.json) {
    console.log(
      JSON.stringify({
        ok: errors.length === 0,
        assets: Array.isArray(manifest.assets) ? manifest.assets.length : 0,
        errors,
      }),
    );
  } else if (errors.length > 0) {
    for (const error of errors) console.error(`FAIL ${error}`);
    console.error(`error: ${errors.length} Core Pack violation(s)`);
  } else {
    console.log(`ok: Core Pack ${manifest.version} — ${manifest.assets.length} assets`);
  }
  return errors.length === 0 ? 0 : 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(pathResolve(process.argv[1])).href
) {
  process.exitCode = runCli();
}
