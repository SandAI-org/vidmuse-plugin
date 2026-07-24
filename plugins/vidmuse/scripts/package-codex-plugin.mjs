#!/usr/bin/env node

/**
 * Build the upload-ready Codex plugin archive from the committed HEAD
 * version of the manifest, brand assets, and skills — same contract as
 * heygen-com/hyperframes `bun run package:codex-plugin`.
 *
 * Output: dist/vidmuse-plugin.zip  (root folder: vidmuse/)
 * Fails if the archive exceeds Codex's 100 MB (decimal) upload limit.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..");
const OUTPUT = join(REPO_ROOT, "dist", "vidmuse-plugin.zip");
const MAX_UPLOAD_BYTES = 100 * 1_000_000;

const pluginManifest = JSON.parse(
  readFileSync(join(REPO_ROOT, ".codex-plugin", "plugin.json"), "utf8"),
);
const pluginName = typeof pluginManifest.name === "string" ? pluginManifest.name : "vidmuse";

const assetPaths = [
  ...new Set(
    Object.values(pluginManifest.interface ?? {})
      .filter((value) => typeof value === "string")
      .map((value) => value.replace(/^\.\//, ""))
      .filter((value) => value.startsWith("assets/")),
  ),
].sort();

if (assetPaths.some((assetPath) => assetPath.split("/").includes(".."))) {
  throw new Error("Plugin manifest contains an unsafe asset path.");
}

const PLUGIN_PATHS = [".codex-plugin", ...assetPaths, "skills", "README.md", "SKILLS.md"];

// Require a git repo so archive content is reproducible from HEAD.
try {
  execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd: REPO_ROOT,
    stdio: "ignore",
  });
} catch {
  throw new Error(
    "Not a git repository. Run `git init && git add -A && git commit` first so packaging is from committed HEAD.",
  );
}

for (const pluginPath of PLUGIN_PATHS) {
  try {
    execFileSync("git", ["cat-file", "-e", `HEAD:${pluginPath}`], {
      cwd: REPO_ROOT,
      stdio: "ignore",
    });
  } catch {
    throw new Error(
      `Missing committed path HEAD:${pluginPath}. Commit it before packaging.`,
    );
  }
}

const dirtyCheck = spawnSync("git", ["diff", "--quiet", "HEAD", "--", ...PLUGIN_PATHS], {
  cwd: REPO_ROOT,
});
if (dirtyCheck.error || (dirtyCheck.status !== 0 && dirtyCheck.status !== 1)) {
  throw dirtyCheck.error ?? new Error("Unable to inspect the plugin working tree state.");
}
if (dirtyCheck.status === 1) {
  console.warn("Warning: packaging committed HEAD; uncommitted plugin changes are excluded.");
}

mkdirSync(join(REPO_ROOT, "dist"), { recursive: true });
rmSync(OUTPUT, { force: true });

execFileSync(
  "git",
  [
    "archive",
    "--format=zip",
    `--prefix=${pluginName}/`,
    "--output",
    OUTPUT,
    "HEAD",
    "--",
    ...PLUGIN_PATHS,
  ],
  { cwd: REPO_ROOT, stdio: "inherit" },
);

const bytes = statSync(OUTPUT).size;
if (bytes > MAX_UPLOAD_BYTES) {
  rmSync(OUTPUT);
  throw new Error(
    `Codex plugin archive is ${(bytes / 1_000_000).toFixed(1)} MB; the upload limit is 100 MB.`,
  );
}

console.log(`Wrote ${OUTPUT} (${(bytes / 1_000_000).toFixed(1)} MB).`);
console.log(`Root folder: ${pluginName}/`);
console.log(`Included: ${PLUGIN_PATHS.join(", ")}`);
