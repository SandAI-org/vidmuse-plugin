import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));

export const skillRoot = resolve(scriptDir, "..");
export const registryRoot = join(skillRoot, "registry");
export const indexesRoot = join(skillRoot, "indexes");
export const policiesRoot = join(skillRoot, "policies");

export const DEFAULT_PROJECT_PATHS = Object.freeze({
  blocks: "compositions",
  assets: "assets",
});

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporary, path);
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function sha256File(path) {
  return sha256(readFileSync(path));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function assertSafeRelativePath(value, label = "path") {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty relative path.`);
  }
  if (isAbsolute(value) || /^[A-Za-z]:[/\\]/.test(value)) {
    throw new Error(`Unsafe ${label} "${value}": absolute paths are not allowed.`);
  }
  const parts = value.replaceAll("\\", "/").split("/");
  if (parts.some((part) => part === "..")) {
    throw new Error(`Unsafe ${label} "${value}": ".." segments are not allowed.`);
  }
  return parts.filter((part) => part && part !== ".").join("/");
}

export function resolveInside(root, relativePath, label = "path") {
  const safe = assertSafeRelativePath(relativePath, label);
  const destination = resolve(root, ...safe.split("/"));
  const rel = relative(resolve(root), destination);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`Unsafe ${label} "${relativePath}": it resolves outside ${root}.`);
  }
  return destination;
}

export function loadRegistry() {
  const manifestPath = join(registryRoot, "registry.json");
  const manifest = readJson(manifestPath);
  if (!Array.isArray(manifest.items)) {
    throw new Error(`${manifestPath} must contain an items array.`);
  }
  return { manifest, manifestPath };
}

export function loadItem(name) {
  const { manifest } = loadRegistry();
  const entry = manifest.items.find((candidate) => candidate.name === name);
  if (!entry) {
    throw new Error(`Unknown Shotcraft item "${name}".`);
  }
  const itemDir = join(registryRoot, "blocks", name);
  const manifestPath = join(itemDir, "registry-item.json");
  return { entry, item: readJson(manifestPath), itemDir, manifestPath };
}

function listFilesRecursive(root) {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...listFilesRecursive(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

export function registryTreeDigest() {
  const rows = listFilesRecursive(registryRoot)
    .map((path) => `${relative(registryRoot, path).replaceAll("\\", "/")} ${sha256File(path)}`)
    .sort();
  return sha256(`${rows.join("\n")}\n`);
}

export function verifyRegistry({ requireIndexes = false } = {}) {
  const errors = [];
  const warnings = [];
  const { manifest } = loadRegistry();
  const entries = manifest.items;
  const names = entries.map((entry) => entry.name);
  const nameSet = new Set(names);
  const blockRoot = join(registryRoot, "blocks");
  const blockDirs = readdirSync(blockRoot).filter((name) =>
    statSync(join(blockRoot, name)).isDirectory(),
  );
  const targetHashes = new Map();
  let payloadFiles = 0;
  let assetFiles = 0;
  let variableBlocks = 0;

  if (manifest.name !== "vidmuse-shotcraft") {
    errors.push(`registry name is "${manifest.name}", expected "vidmuse-shotcraft"`);
  }
  if (entries.length !== 162) errors.push(`registry has ${entries.length} items, expected 162`);
  if (nameSet.size !== entries.length) errors.push("registry item names are not unique");

  for (const dirName of blockDirs) {
    if (!nameSet.has(dirName)) errors.push(`unlisted block directory: ${dirName}`);
  }
  for (const name of names) {
    if (!blockDirs.includes(name)) errors.push(`missing block directory: ${name}`);
  }

  for (const entry of entries) {
    try {
      const { item, itemDir } = loadItem(entry.name);
      if (entry.type !== "hyperframes:block") {
        errors.push(`${entry.name}: registry entry type is ${entry.type}`);
      }
      if (item.name !== entry.name) errors.push(`${entry.name}: manifest name mismatch`);
      if (item.type !== entry.type) errors.push(`${entry.name}: manifest type mismatch`);
      if (!item.title || !item.description) errors.push(`${entry.name}: missing title or description`);
      if (!Array.isArray(item.tags) || !item.tags.includes("shotcraft")) {
        errors.push(`${entry.name}: tags must include shotcraft`);
      }
      if (item.dimensions?.width !== 1920 || item.dimensions?.height !== 1080) {
        errors.push(`${entry.name}: dimensions must be 1920x1080`);
      }
      if (!Number.isFinite(item.duration) || item.duration <= 0) {
        errors.push(`${entry.name}: invalid duration ${item.duration}`);
      }
      if (!Array.isArray(item.files) || item.files.length === 0) {
        errors.push(`${entry.name}: files must be a non-empty array`);
        continue;
      }

      const compositions = item.files.filter(
        (file) => file.type === "hyperframes:composition",
      );
      if (compositions.length !== 1) {
        errors.push(`${entry.name}: expected exactly one composition file`);
      }

      for (const file of item.files) {
        payloadFiles += 1;
        const source = resolveInside(itemDir, file.path, `${entry.name} files[].path`);
        assertSafeRelativePath(file.target, `${entry.name} files[].target`);
        if (!existsSync(source)) {
          errors.push(`${entry.name}: missing payload ${file.path}`);
          continue;
        }
        const hashes = targetHashes.get(file.target) ?? new Set();
        hashes.add(sha256File(source));
        targetHashes.set(file.target, hashes);
        if (file.type === "hyperframes:asset") assetFiles += 1;
      }

      const composition = compositions[0];
      if (composition) {
        if (composition.path !== `${entry.name}.html`) {
          errors.push(`${entry.name}: composition path is ${composition.path}`);
        }
        if (composition.target !== `compositions/${entry.name}.html`) {
          errors.push(`${entry.name}: composition target is ${composition.target}`);
        }
        const htmlPath = resolveInside(itemDir, composition.path, `${entry.name} composition`);
        if (existsSync(htmlPath)) {
          const html = readFileSync(htmlPath, "utf8");
          const idPattern = new RegExp(`data-composition-id=["']${escapeRegex(entry.name)}["']`);
          const timelinePattern = new RegExp(
            `window\\.__timelines\\s*\\[\\s*["']${escapeRegex(entry.name)}["']\\s*\\]`,
          );
          if (!idPattern.test(html)) errors.push(`${entry.name}: internal composition id mismatch`);
          if (!timelinePattern.test(html)) errors.push(`${entry.name}: timeline is not registered`);
          const durationMatch = html.match(
            new RegExp(
              `data-composition-id=["']${escapeRegex(entry.name)}["'][\\s\\S]{0,600}?data-duration=["']([^"']+)["']`,
            ),
          );
          if (Number(durationMatch?.[1]) !== item.duration) {
            errors.push(
              `${entry.name}: HTML duration ${durationMatch?.[1] ?? "missing"} != manifest ${item.duration}`,
            );
          }
          if (html.includes("data-composition-variables=")) variableBlocks += 1;
          if (/Date\.now\s*\(|Math\.random\s*\(/.test(html)) {
            errors.push(`${entry.name}: nondeterministic Date.now/Math.random usage`);
          }
        }
      }
    } catch (error) {
      errors.push(`${entry.name}: ${error.message}`);
    }
  }

  for (const [target, hashes] of targetHashes) {
    if (hashes.size > 1) errors.push(`shared target ${target} has conflicting payload hashes`);
  }

  if (requireIndexes) {
    try {
      const catalog = readJson(join(indexesRoot, "catalog.json"));
      const indexed = new Set(catalog.map((item) => item.name));
      if (catalog.length !== entries.length || indexed.size !== entries.length) {
        errors.push("indexes/catalog.json does not cover the 162 unique blocks");
      }
      if (names.some((name) => !indexed.has(name))) {
        errors.push("indexes/catalog.json is missing registry items");
      }
    } catch (error) {
      errors.push(`cannot validate indexes/catalog.json: ${error.message}`);
    }
    try {
      const runtimePolicy = readJson(join(policiesRoot, "runtime-check.json"));
      const findingNames = Object.values(runtimePolicy.knownFindings ?? {}).flat();
      if (new Set(findingNames).size !== findingNames.length) {
        errors.push("policies/runtime-check.json contains duplicate block names");
      }
      const unknown = findingNames.filter((name) => !nameSet.has(name));
      if (unknown.length > 0) {
        errors.push(`runtime policy references unknown blocks: ${unknown.join(", ")}`);
      }
      if (!/^\d+\.\d+\.\d+/.test(runtimePolicy.cliVersion ?? "")) {
        errors.push("runtime policy must pin an explicit HyperFrames CLI semver");
      }
    } catch (error) {
      errors.push(`cannot validate policies/runtime-check.json: ${error.message}`);
    }
  }

  if (variableBlocks !== 159) {
    warnings.push(`${variableBlocks} blocks declare variables; the imported pilot baseline was 159`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: {
      registry: manifest.name,
      blocks: entries.length,
      blockDirectories: blockDirs.length,
      payloadFiles,
      declaredAssetFiles: assetFiles,
      uniqueTargets: targetHashes.size,
      variableBlocks,
      treeSha256: registryTreeDigest(),
    },
  };
}

export function loadProjectConfig(projectDir) {
  let parsed = {};
  const path = join(projectDir, "hyperframes.json");
  if (existsSync(path)) parsed = readJson(path);
  const blocks = assertSafeRelativePath(
    parsed.paths?.blocks ?? DEFAULT_PROJECT_PATHS.blocks,
    "hyperframes.json paths.blocks",
  );
  const assets = assertSafeRelativePath(
    parsed.paths?.assets ?? DEFAULT_PROJECT_PATHS.assets,
    "hyperframes.json paths.assets",
  );
  return { blocks, assets };
}

function addInstallMarker(source, name) {
  if (/^\s*<!--\s*hyperframes-registry-item:/i.test(source.slice(0, 512))) return source;
  return `<!-- hyperframes-registry-item: ${name} -->\n${source}`;
}

function namespacedAssetTarget(itemName, originalTarget, assetsRoot) {
  const safe = assertSafeRelativePath(originalTarget, `${itemName} asset target`);
  const suffix = safe.startsWith("assets/") ? safe.slice("assets/".length) : safe;
  return posix.join(assetsRoot, "vidmuse-shotcraft", itemName, suffix);
}

function buildInstallFiles(item, itemDir, projectPaths) {
  const assets = item.files.filter((file) => file.type === "hyperframes:asset");
  const assetMap = new Map(
    assets.map((file) => [
      file.target,
      namespacedAssetTarget(item.name, file.target, projectPaths.assets),
    ]),
  );
  return item.files.map((file) => {
    const sourcePath = resolveInside(itemDir, file.path, `${item.name} files[].path`);
    let target = file.target;
    let content = readFileSync(sourcePath);
    if (file.type === "hyperframes:composition") {
      target = file.target.replace(/^compositions\//, `${projectPaths.blocks}/`);
      let html = content.toString("utf8");
      for (const [original, isolated] of assetMap) html = html.replaceAll(original, isolated);
      content = Buffer.from(addInstallMarker(html, item.name));
    } else if (file.type === "hyperframes:asset") {
      target = assetMap.get(file.target);
    }
    assertSafeRelativePath(target, `${item.name} install target`);
    return {
      type: file.type,
      source: file.path,
      sourcePath,
      target,
      content,
      sourceSha256: sha256File(sourcePath),
      installedSha256: sha256(content),
    };
  });
}

function readLock(projectDir) {
  const path = join(projectDir, "shotcraft-lock.json");
  if (!existsSync(path)) {
    return { schema: "vidmuse-shotcraft.lock.v1", registry: "vidmuse-shotcraft", items: {} };
  }
  const lock = readJson(path);
  if (lock.schema !== "vidmuse-shotcraft.lock.v1" || typeof lock.items !== "object") {
    throw new Error(`Unsupported or invalid ${path}.`);
  }
  return lock;
}

function sortedObject(value) {
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}

export function buildWireSnippet(item, compositionTarget) {
  return [
    `<div`,
    `  class="clip"`,
    `  data-composition-id="${item.name}"`,
    `  data-composition-src="${compositionTarget}"`,
    `  data-start="0"`,
    `  data-duration="${item.duration}"`,
    `  data-track-index="1"`,
    `  data-width="${item.dimensions.width}"`,
    `  data-height="${item.dimensions.height}"`,
    `></div>`,
  ].join("\n");
}

export function installLocal(name, { projectDir, force = false } = {}) {
  if (!projectDir) throw new Error("--dir <project> is required.");
  const destinationRoot = resolve(projectDir);
  if (!existsSync(destinationRoot) || !statSync(destinationRoot).isDirectory()) {
    throw new Error(`Project directory does not exist: ${destinationRoot}`);
  }
  const { item, itemDir, manifestPath } = loadItem(name);
  const projectPaths = loadProjectConfig(destinationRoot);
  const files = buildInstallFiles(item, itemDir, projectPaths);
  const conflicts = [];
  const skipped = [];

  for (const file of files) {
    const destination = resolveInside(destinationRoot, file.target, `${name} destination`);
    if (!existsSync(destination)) continue;
    if (sha256File(destination) === file.installedSha256) skipped.push(file.target);
    else conflicts.push(file.target);
  }
  if (conflicts.length > 0 && !force) {
    throw new Error(
      `Refusing to overwrite modified files: ${conflicts.join(", ")}. Re-run with --force only if replacement is intentional.`,
    );
  }

  const written = [];
  for (const file of files) {
    if (skipped.includes(file.target)) continue;
    const destination = resolveInside(destinationRoot, file.target, `${name} destination`);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, file.content);
    written.push(file.target);
  }

  const composition = files.find((file) => file.type === "hyperframes:composition");
  const lock = readLock(destinationRoot);
  lock.items[name] = {
    manifestSha256: sha256File(manifestPath),
    duration: item.duration,
    dimensions: item.dimensions,
    files: files.map((file) => ({
      source: file.source,
      target: file.target,
      sourceSha256: file.sourceSha256,
      installedSha256: file.installedSha256,
    })),
  };
  lock.items = sortedObject(lock.items);
  writeJson(join(destinationRoot, "shotcraft-lock.json"), lock);

  return {
    ok: true,
    name,
    type: item.type,
    written,
    skipped,
    overwritten: force ? conflicts : [],
    lockFile: "shotcraft-lock.json",
    assetPolicy: "item-namespaced-copy-on-write",
    snippet: buildWireSnippet(item, composition.target),
  };
}

export function loadPolicies() {
  return {
    jobs: readJson(join(policiesRoot, "jobs.json")),
    recut: readJson(join(policiesRoot, "recut.json")),
  };
}

export function recutStatusMap(policy) {
  const map = new Map();
  for (const name of policy.safe ?? []) map.set(name, "recut:safe");
  for (const name of policy.adapt ?? []) map.set(name, "recut:adapt");
  return map;
}

export function buildIndexes() {
  const { manifest } = loadRegistry();
  const policies = loadPolicies();
  const recut = recutStatusMap(policies.recut);
  const overlap = (policies.recut.safe ?? []).filter((name) =>
    (policies.recut.adapt ?? []).includes(name),
  );
  if (overlap.length > 0) {
    throw new Error(`Recut policy assigns multiple statuses to: ${overlap.join(", ")}`);
  }
  const catalog = manifest.items.map(({ name }) => {
    const { item } = loadItem(name);
    return {
      name: item.name,
      type: item.type,
      title: item.title,
      description: item.description,
      tags: item.tags ?? [],
      dimensions: item.dimensions,
      duration: item.duration,
      recut: recut.get(item.name) ?? policies.recut.default,
      files: item.files,
    };
  });
  const byTag = {};
  for (const item of catalog) {
    for (const tag of item.tags) (byTag[tag] ??= []).push(item.name);
  }
  for (const tag of Object.keys(byTag)) byTag[tag].sort();

  const known = new Set(catalog.map((item) => item.name));
  const unknownPolicyNames = [
    ...(policies.recut.safe ?? []),
    ...(policies.recut.adapt ?? []),
    ...policies.jobs.jobs.flatMap((job) => job.candidates),
  ].filter((name) => !known.has(name));
  if (unknownPolicyNames.length > 0) {
    throw new Error(`Policies reference unknown blocks: ${[...new Set(unknownPolicyNames)].join(", ")}`);
  }

  writeJson(join(indexesRoot, "catalog.json"), catalog);
  writeJson(join(indexesRoot, "by-tag.json"), sortedObject(byTag));
  writeJson(join(indexesRoot, "by-job.json"), policies.jobs);
  return { catalog: catalog.length, tags: Object.keys(byTag).length, jobs: policies.jobs.jobs.length };
}

function normalizeText(value) {
  return String(value ?? "").normalize("NFKC").toLocaleLowerCase().trim();
}

function tokenize(value) {
  return normalizeText(value).match(/[\p{L}\p{N}]+/gu) ?? [];
}

export function searchCatalog({ query = "", tag, recut, limit = 10 } = {}) {
  const catalog = readJson(join(indexesRoot, "catalog.json"));
  const jobs = readJson(join(indexesRoot, "by-job.json")).jobs;
  const normalizedQuery = normalizeText(query);
  const tokens = tokenize(query);
  const jobScores = new Map();

  if (normalizedQuery) {
    for (const job of jobs) {
      const labels = [job.id, ...(job.labels ?? [])].map(normalizeText);
      const exact = labels.some(
        (label) => label === normalizedQuery || label.includes(normalizedQuery) || normalizedQuery.includes(label),
      );
      const tokenHits = labels.reduce(
        (best, label) => Math.max(best, tokens.filter((token) => label.includes(token)).length),
        0,
      );
      if (!exact && tokenHits === 0) continue;
      job.candidates.forEach((name, index) => {
        jobScores.set(name, Math.max(jobScores.get(name) ?? 0, (exact ? 1000 : 500) - index));
      });
    }
  }

  const normalizedRecut = recut
    ? recut === "create-only" || recut.startsWith("recut:")
      ? recut
      : `recut:${recut}`
    : undefined;
  return catalog
    .filter((item) => !tag || item.tags.includes(tag))
    .filter((item) => !normalizedRecut || item.recut === normalizedRecut)
    .map((item) => {
      const haystack = normalizeText(
        [item.name, item.title, item.description, ...item.tags].join(" "),
      );
      let score = jobScores.get(item.name) ?? 0;
      if (normalizedQuery === normalizeText(item.name)) score += 2000;
      for (const token of tokens) {
        if (item.tags.some((candidate) => normalizeText(candidate) === token)) score += 80;
        else if (haystack.includes(token)) score += 20;
      }
      return { ...item, score };
    })
    .filter((item) => !normalizedQuery || item.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, Number(limit) || 10);
}
