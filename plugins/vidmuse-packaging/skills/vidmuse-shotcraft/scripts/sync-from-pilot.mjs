#!/usr/bin/env node
import { cpSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destination = join(skillRoot, "registry");

function parseArgs(argv) {
  const sourceIndex = argv.indexOf("--source");
  const source = sourceIndex >= 0 ? argv[sourceIndex + 1] : undefined;
  return { source, replace: argv.includes("--replace") };
}

function validateSource(source) {
  const manifestPath = join(source, "registry.json");
  if (!existsSync(manifestPath)) throw new Error(`Missing ${manifestPath}`);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!Array.isArray(manifest.items) || manifest.items.length !== 162) {
    throw new Error("Source registry must contain exactly 162 items.");
  }
  for (const entry of manifest.items) {
    const dir = join(source, "blocks", entry.name);
    const itemPath = join(dir, "registry-item.json");
    if (!existsSync(itemPath)) throw new Error(`Missing ${itemPath}`);
    const item = JSON.parse(readFileSync(itemPath, "utf8"));
    for (const file of item.files ?? []) {
      if (!existsSync(join(dir, file.path))) {
        throw new Error(`Missing ${entry.name}/${file.path}`);
      }
    }
  }
  return manifest;
}

try {
  const { source, replace } = parseArgs(process.argv.slice(2));
  if (!source) throw new Error("--source <pilot-registry> is required.");
  const sourceRoot = resolve(source);
  const manifest = validateSource(sourceRoot);
  if (existsSync(destination) && !replace) {
    throw new Error("Destination registry already exists; pass --replace for an intentional refresh.");
  }

  const temporary = `${destination}.incoming`;
  const backup = `${destination}.previous`;
  if (existsSync(temporary) || existsSync(backup)) {
    throw new Error("A previous sync staging/backup directory exists; inspect it before retrying.");
  }
  cpSync(sourceRoot, temporary, { recursive: true, errorOnExist: true });
  manifest.name = "vidmuse-shotcraft";
  writeFileSync(join(temporary, "registry.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  if (existsSync(destination)) renameSync(destination, backup);
  renameSync(temporary, destination);
  console.log(
    JSON.stringify(
      {
        ok: true,
        items: manifest.items.length,
        destination,
        backup: existsSync(backup) ? backup : null,
        note: "Run verify-registry.mjs and remove the backup only after review.",
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
