#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fontRoot = join(skillRoot, "assets", "fonts");
const manifestPath = join(fontRoot, "font-pack.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

function usage() {
  return `Usage:
  stage-fonts.mjs --list [--json]
  stage-fonts.mjs --project <directory> --font <id>[,<id>...] [--font <id>] [--json]

The selected fonts, their OFL license files, a deterministic stylesheet, and a
provenance receipt are staged under assets/fonts/vidmuse in the project.`;
}

function parseArgs(argv) {
  const result = { fontIds: [], json: false, list: false, project: undefined };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--font") {
      const value = argv[index + 1];
      if (!value) throw new Error("--font requires a font id");
      result.fontIds.push(...value.split(",").map((id) => id.trim()).filter(Boolean));
      index += 1;
    } else if (argument === "--project") {
      const value = argv[index + 1];
      if (!value) throw new Error("--project requires a directory");
      result.project = value;
      index += 1;
    } else if (argument === "--list") {
      result.list = true;
    } else if (argument === "--json") {
      result.json = true;
    } else if (argument === "--help" || argument === "-h") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return result;
}

function safeAssetPath(assetPath) {
  const absolutePath = resolve(fontRoot, assetPath);
  const pathFromRoot = relative(fontRoot, absolutePath);
  if (pathFromRoot.startsWith("..") || isAbsolute(pathFromRoot)) {
    throw new Error(`Font manifest path escapes the asset directory: ${assetPath}`);
  }
  return absolutePath;
}

function verifyFile(assetPath, expectedHash, expectedSize) {
  const absolutePath = safeAssetPath(assetPath);
  const size = statSync(absolutePath).size;
  const hash = createHash("sha256").update(readFileSync(absolutePath)).digest("hex");
  if (size !== expectedSize || hash !== expectedHash) {
    throw new Error(`Integrity check failed for ${assetPath}`);
  }
  return absolutePath;
}

function cssForFont(font) {
  return font.faces
    .map((face) => {
      const fileName = basename(face.path);
      return `@font-face {
  font-family: "${font.family}";
  font-style: ${face.style};
  font-weight: ${face.weight};
  font-display: block;
  src: url("./${font.id}/${fileName}") format("${face.format}");
}`;
    })
    .join("\n\n");
}

function listFonts(asJson) {
  const listing = manifest.fonts.map(({ id, displayName, scripts, roles }) => ({
    id,
    displayName,
    scripts,
    roles,
  }));
  if (asJson) {
    process.stdout.write(`${JSON.stringify(listing, null, 2)}\n`);
    return;
  }
  for (const font of listing) {
    process.stdout.write(`${font.id}\t${font.displayName}\t${font.roles.join(", ")}\n`);
  }
}

function stageFonts(projectPath, requestedIds, asJson) {
  if (!projectPath) throw new Error("--project is required when staging fonts");
  if (requestedIds.length === 0) throw new Error("Select at least one font with --font");

  const uniqueIds = new Set(requestedIds);
  const knownIds = new Set(manifest.fonts.map((font) => font.id));
  for (const id of uniqueIds) {
    if (!knownIds.has(id)) throw new Error(`Unknown font id: ${id}`);
  }

  const selected = manifest.fonts.filter((font) => uniqueIds.has(font.id));
  const projectRoot = resolve(projectPath);
  const destinationRoot = join(projectRoot, "assets", "fonts", "vidmuse");
  mkdirSync(destinationRoot, { recursive: true });

  for (const font of selected) {
    const familyDestination = join(destinationRoot, font.id);
    mkdirSync(familyDestination, { recursive: true });
    for (const face of font.faces) {
      const source = verifyFile(face.path, face.sha256, face.size);
      copyFileSync(source, join(familyDestination, basename(face.path)));
    }
    const licenseSource = verifyFile(
      font.license.path,
      font.license.sha256,
      font.license.size,
    );
    copyFileSync(licenseSource, join(familyDestination, "OFL.txt"));
  }

  const stylesheet = `${selected.map(cssForFont).join("\n\n")}\n`;
  writeFileSync(join(destinationRoot, "fonts.css"), stylesheet, "utf8");

  const receipt = {
    schema: "vidmuse.staged-fonts.v1",
    stylesheet: "assets/fonts/vidmuse/fonts.css",
    policy: manifest.policy,
    fonts: selected,
  };
  writeFileSync(
    join(destinationRoot, "font-pack.json"),
    `${JSON.stringify(receipt, null, 2)}\n`,
    "utf8",
  );

  const output = {
    project: projectRoot,
    stylesheet: join(destinationRoot, "fonts.css"),
    link: '<link rel="stylesheet" href="assets/fonts/vidmuse/fonts.css">',
    fontIds: selected.map((font) => font.id),
  };
  if (asJson) {
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  } else {
    process.stdout.write(`Staged ${output.fontIds.join(", ")}\n${output.link}\n`);
  }
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.list) {
    listFonts(args.json);
  } else {
    stageFonts(args.project, args.fontIds, args.json);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`stage-fonts: ${message}\n\n${usage()}\n`);
  process.exitCode = 1;
}
