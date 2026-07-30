#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve as pathResolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

export const SCHEMA = "vidmuse.asset-plan.v1";
export const PLAN_FILE = "asset-plan.json";
export const PASS_CONTRACT = "semantic-asset-pass.v1";

const HERE = dirname(fileURLToPath(import.meta.url));
const MEDIA_RESOLVE = pathResolve(HERE, "../../media-use/scripts/resolve.mjs");
const SCHEMA_PATH = pathResolve(HERE, "../schemas/asset-plan.schema.json");
const PLAN_SCHEMA = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
const enumSet = (values) => new Set(values || []);

// JSON Schema is the source of truth for closed vocabularies. Manual checks
// below enforce cross-field/editorial constraints that JSON Schema cannot
// express cleanly; they must not maintain a second enum list.
const WORKFLOWS = enumSet(PLAN_SCHEMA.properties?.workflow?.enum);
const ENTITY_TYPES = enumSet(
  PLAN_SCHEMA.$defs?.opportunity?.properties?.entity_type?.enum,
);
const SEMANTIC_ROLES = enumSet(
  PLAN_SCHEMA.$defs?.opportunity?.properties?.semantic_role?.enum,
);
const VISUAL_JOBS = enumSet(
  PLAN_SCHEMA.$defs?.opportunity?.properties?.visual_job?.enum,
);
const DECISIONS = enumSet(
  PLAN_SCHEMA.$defs?.opportunity?.properties?.decision?.enum,
);
const QUERY_TYPES = enumSet(PLAN_SCHEMA.$defs?.query?.properties?.type?.enum);
const QUERY_MODES = enumSet(PLAN_SCHEMA.$defs?.query?.properties?.mode?.enum);
const LOGO_VARIANTS = enumSet(
  PLAN_SCHEMA.$defs?.query?.properties?.variant?.enum,
);
const GROUP_KINDS = enumSet(PLAN_SCHEMA.$defs?.group?.properties?.kind?.enum);
const FILE_DECISIONS = new Set([
  "show-logo",
  "show-icon",
  "show-photo",
  "reuse-existing",
]);
const NO_FILE_DECISIONS = new Set(["diagram-node", "text-label-only", "suppress"]);

function isText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizedIdentity(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function requestFingerprint(query) {
  const normalized = {
    type: String(query?.type || "").trim().toLowerCase(),
    mode: String(query?.mode || "").trim().toLowerCase(),
    intent: String(query?.intent || "").trim().replace(/\s+/g, " "),
    entity: normalizedIdentity(query?.entity),
    variant: String(query?.variant || "").trim().toLowerCase(),
    provider: String(query?.provider || "").trim().toLowerCase(),
    core_pack_id: String(query?.core_pack_id || "").trim(),
    creator_library_id: String(query?.creator_library_id || "").trim(),
  };
  return sha256Bytes(JSON.stringify(normalized));
}

function declaredPassInputs(plan) {
  const transcript = isText(plan?.transcript) ? plan.transcript : "transcript.json";
  const inputs = [{ role: "transcript", path: transcript }];
  for (const entry of Array.isArray(plan?.decision_inputs) ? plan.decision_inputs : []) {
    if (!entry || entry.role === "transcript" || entry.path === transcript) continue;
    inputs.push({ role: entry.role, path: entry.path });
  }
  return inputs;
}

export function validatePassReceipt(plan, projectDir = null) {
  const errors = [];
  const receipt = plan?.pass_receipt;
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    return ["pass_receipt is required — complete the Semantic Asset Pass"];
  }
  if (receipt.contract !== PASS_CONTRACT) {
    errors.push(`pass_receipt.contract must equal ${PASS_CONTRACT}`);
  }
  if (receipt.status !== "completed") {
    errors.push("pass_receipt.status must be completed");
  }
  if (!receipt.input || typeof receipt.input !== "object") {
    errors.push("pass_receipt.input is required");
    return errors;
  }
  if (!isText(receipt.input.path) || receipt.input.path !== plan.transcript) {
    errors.push("pass_receipt.input.path must equal transcript");
  }
  if (!/^[a-f0-9]{64}$/.test(String(receipt.input.sha256 || ""))) {
    errors.push("pass_receipt.input.sha256 must be a SHA-256 digest");
  }
  const declared = declaredPassInputs(plan);
  const receiptInputs = Array.isArray(receipt.inputs)
    ? receipt.inputs
    : [{ role: "transcript", ...receipt.input }];
  const declaredKeys = new Set();
  for (const [index, input] of declared.entries()) {
    const where = `decision input ${index}`;
    if (!isText(input.role) || !isText(input.path)) {
      errors.push(`${where} requires role and path`);
      continue;
    }
    const key = `${input.role}\u0000${input.path}`;
    if (declaredKeys.has(key)) errors.push(`${where} is duplicated`);
    declaredKeys.add(key);
    const stamped = receiptInputs.find(
      (entry) => entry?.role === input.role && entry?.path === input.path,
    );
    if (!stamped) {
      errors.push(`pass_receipt.inputs is missing ${input.role}: ${input.path}`);
    } else if (!/^[a-f0-9]{64}$/.test(String(stamped.sha256 || ""))) {
      errors.push(`pass_receipt input ${input.role} must have a SHA-256 digest`);
    }
  }
  if (receiptInputs.length !== declared.length) {
    errors.push("pass_receipt.inputs does not match the current decision_inputs");
  }
  if (receipt.opportunity_count !== plan.opportunities?.length) {
    errors.push("pass_receipt.opportunity_count is stale");
  }
  if (!isText(receipt.completed_at) || Number.isNaN(Date.parse(receipt.completed_at))) {
    errors.push("pass_receipt.completed_at must be an ISO timestamp");
  }

  if (projectDir) {
    for (const input of receiptInputs) {
      if (!isText(input?.path)) continue;
      const inputPath = pathResolve(projectDir, input.path);
      if (!existsSync(inputPath)) {
        errors.push(`pass_receipt input is missing: ${input.path}`);
      } else {
        const actual = sha256Bytes(readFileSync(inputPath));
        if (actual !== input.sha256) {
          errors.push(
            `pass_receipt is stale: ${input.path} changed after the Semantic Asset Pass`,
          );
        }
      }
    }
    // Keep the compatibility alias honest as well; old consumers still read it.
    const transcriptStamp = receiptInputs.find(
      (input) => input.role === "transcript" && input.path === plan.transcript,
    );
    if (transcriptStamp && transcriptStamp.sha256 !== receipt.input.sha256) {
      errors.push("pass_receipt.input must mirror the transcript entry in inputs");
    }
  }
  return errors;
}

export function completePassReceipt(plan, projectDir, now = new Date()) {
  const transcript = isText(plan?.transcript) ? plan.transcript : "transcript.json";
  plan.transcript = transcript;
  const inputs = declaredPassInputs(plan).map((input) => {
    const inputPath = pathResolve(projectDir, input.path);
    if (!existsSync(inputPath)) {
      throw new Error(`cannot complete pass: missing ${input.role} input ${inputPath}`);
    }
    return {
      role: input.role,
      path: input.path,
      sha256: sha256Bytes(readFileSync(inputPath)),
    };
  });
  const transcriptInput = inputs.find((input) => input.role === "transcript");
  plan.pass_receipt = {
    contract: PASS_CONTRACT,
    status: "completed",
    input: {
      path: transcript,
      sha256: transcriptInput.sha256,
    },
    inputs,
    opportunity_count: Array.isArray(plan.opportunities) ? plan.opportunities.length : 0,
    completed_at: now.toISOString(),
  };
  return plan.pass_receipt;
}

function opportunityLabel(item, index) {
  return isText(item?.id) ? item.id : `opportunities[${index}]`;
}

export function validateAssetPlan(plan) {
  const errors = [];
  const err = (message) => errors.push(message);

  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    return ["asset-plan.json must contain a JSON object"];
  }
  if (plan.schema !== SCHEMA) err(`schema must equal ${SCHEMA}`);
  if (!WORKFLOWS.has(plan.workflow)) err("workflow must be create or recut");
  if (!Array.isArray(plan.opportunities)) {
    err("opportunities must be an array");
    return errors;
  }
  if (plan.decision_inputs != null && !Array.isArray(plan.decision_inputs)) {
    err("decision_inputs must be an array when present");
  } else {
    for (const [index, input] of (plan.decision_inputs || []).entries()) {
      if (!input || typeof input !== "object" || !isText(input.role) || !isText(input.path)) {
        err(`decision_inputs[${index}] requires role and path`);
      } else if (input.role === "transcript" || input.path === plan.transcript) {
        err(`decision_inputs[${index}] must not duplicate the transcript input`);
      }
    }
  }
  for (const error of validatePassReceipt(plan)) err(error);

  const ids = new Set();
  const logoVariants = new Map();
  plan.opportunities.forEach((item, index) => {
    const where = opportunityLabel(item, index);
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      err(`${where}: must be an object`);
      return;
    }
    if (!/^ao_[a-z0-9][a-z0-9_-]*$/.test(String(item.id || ""))) {
      err(`${where}: id must match ao_<stable-slug>`);
    } else if (ids.has(item.id)) {
      err(`${where}: duplicate id`);
    } else {
      ids.add(item.id);
    }
    for (const key of ["mention", "canonical_entity", "reason"]) {
      if (!isText(item[key])) err(`${where}: ${key} is required`);
    }
    if (!ENTITY_TYPES.has(item.entity_type)) {
      err(`${where}: unknown entity_type ${String(item.entity_type)}`);
    }
    if (!SEMANTIC_ROLES.has(item.semantic_role)) {
      err(`${where}: unknown semantic_role ${String(item.semantic_role)}`);
    }
    if (!VISUAL_JOBS.has(item.visual_job)) {
      err(`${where}: unknown visual_job ${String(item.visual_job)}`);
    }
    if (!DECISIONS.has(item.decision)) {
      err(`${where}: unknown decision ${String(item.decision)}`);
    }
    if (
      typeof item.confidence !== "number" ||
      item.confidence < 0 ||
      item.confidence > 1
    ) {
      err(`${where}: confidence must be a number in [0, 1]`);
    }
    if (!Array.isArray(item.ranges) || item.ranges.length === 0) {
      err(`${where}: ranges must contain at least one ATA [start, end] pair`);
    } else {
      item.ranges.forEach((range, rangeIndex) => {
        if (
          !Array.isArray(range) ||
          range.length !== 2 ||
          !range.every((value) => typeof value === "number") ||
          range[0] < 0 ||
          range[1] <= range[0]
        ) {
          err(`${where}: ranges[${rangeIndex}] must be [start>=0, end>start]`);
        }
      });
    }

    const query = item.asset_query;
    if (FILE_DECISIONS.has(item.decision) && !query) {
      err(`${where}: decision ${item.decision} requires asset_query`);
    }
    if (NO_FILE_DECISIONS.has(item.decision) && query) {
      err(`${where}: decision ${item.decision} must not fetch an asset`);
    }
    if (!query) return;
    if (!query || typeof query !== "object" || Array.isArray(query)) {
      err(`${where}: asset_query must be an object`);
      return;
    }
    if (!QUERY_TYPES.has(query.type)) {
      err(`${where}: asset_query.type is unsupported`);
    }
    if (!isText(query.intent)) err(`${where}: asset_query.intent is required`);
    if (!QUERY_MODES.has(query.mode)) {
      err(`${where}: asset_query.mode is unsupported`);
    }
    if (query.core_pack_id && query.creator_library_id) {
      err(`${where}: choose core_pack_id or creator_library_id, not both`);
    }
    if (query.core_pack_id && query.mode !== "deterministic") {
      err(`${where}: core_pack_id requires mode=deterministic`);
    }
    if (query.type === "logo" && query.core_pack_id) {
      err(`${where}: logo uses exact entity/variant resolution, not core_pack_id`);
    }
    if (query.mode === "creator-library" && !isText(query.creator_library_id)) {
      err(`${where}: creator-library mode requires creator_library_id`);
    }
    if (query.creator_library_id && query.mode !== "creator-library") {
      err(`${where}: creator_library_id requires mode=creator-library`);
    }
    if (item.decision === "show-logo" && query.type !== "logo") {
      err(`${where}: show-logo requires asset_query.type=logo`);
    }
    if (item.decision === "show-icon" && query.type !== "icon") {
      err(`${where}: show-icon requires asset_query.type=icon`);
    }
    if (item.decision === "show-photo" && query.type !== "image") {
      err(`${where}: show-photo requires asset_query.type=image`);
    }
    if (query.type === "logo") {
      if (!isText(query.entity)) {
        err(`${where}: logo query requires an exact entity`);
      }
      if (!["deterministic", "creator-library"].includes(query.mode)) {
        err(`${where}: logos must use deterministic or creator-library mode; never generate a mark`);
      }
      if (query.variant && !LOGO_VARIANTS.has(query.variant)) {
        err(`${where}: unsupported logo variant ${query.variant}`);
      }
      if (String(query.provider || "").toLowerCase() === "vidmuse") {
        err(`${where}: logo provider cannot be generative`);
      }
      if (
        isText(query.entity) &&
        normalizedIdentity(query.entity) !== normalizedIdentity(item.canonical_entity)
      ) {
        err(
          `${where}: logo query entity ${query.entity} does not match canonical entity ` +
            `${item.canonical_entity}; parent company, product, and model identities ` +
            "must be explicit separate opportunities",
        );
      }
      const key = String(item.canonical_entity || "").toLowerCase();
      const variant = query.variant || "default";
      if (key && logoVariants.has(key) && logoVariants.get(key) !== variant) {
        err(
          `${where}: canonical entity ${item.canonical_entity} uses variant ${variant}, ` +
            `but an earlier opportunity uses ${logoVariants.get(key)}`,
        );
      } else if (key) {
        logoVariants.set(key, variant);
      }
    }
  });

  const groups = plan.groups || [];
  if (!Array.isArray(groups)) {
    err("groups must be an array when present");
  } else {
    const groupIds = new Set();
    groups.forEach((group, index) => {
      const where = isText(group?.id) ? group.id : `groups[${index}]`;
      if (!isText(group?.id)) err(`${where}: id is required`);
      else if (groupIds.has(group.id)) err(`${where}: duplicate group id`);
      else groupIds.add(group.id);
      if (!GROUP_KINDS.has(group?.kind)) {
        err(`${where}: unsupported group kind`);
      }
      if (!Array.isArray(group?.member_ids) || group.member_ids.length < 2) {
        err(`${where}: member_ids must contain at least two opportunity ids`);
      } else {
        for (const member of group.member_ids) {
          if (!ids.has(member)) err(`${where}: unknown member id ${member}`);
        }
      }
      if (group?.variant_policy && !LOGO_VARIANTS.has(group.variant_policy)) {
        err(`${where}: unsupported variant_policy ${group.variant_policy}`);
      }
    });
  }
  return errors;
}

export function validateResolutionReceipts(plan) {
  const errors = [];
  for (const [index, item] of (plan?.opportunities || []).entries()) {
    const where = opportunityLabel(item, index);
    const query = item?.asset_query;
    const receipt = item?.resolution;
    if (!query || !receipt || receipt.status !== "resolved") continue;
    if (receipt.request_fingerprint !== requestFingerprint(query)) {
      errors.push(`${where}: resolved receipt is stale for its asset_query`);
    }
    if (query.core_pack_id && receipt.core_pack_id !== query.core_pack_id) {
      errors.push(`${where}: resolved Core Pack id does not match ${query.core_pack_id}`);
    }
    if (
      query.creator_library_id &&
      receipt.creator_library_id !== query.creator_library_id
    ) {
      errors.push(
        `${where}: resolved Creator Library id does not match ${query.creator_library_id}`,
      );
    }
    if (query.type === "logo") {
      if (
        normalizedIdentity(receipt.resolved_entity) !==
        normalizedIdentity(query.entity)
      ) {
        errors.push(
          `${where}: resolved logo identity ${receipt.resolved_entity} does not ` +
            `match requested entity ${query.entity}`,
        );
      }
      if (query.variant && receipt.variant !== query.variant) {
        errors.push(
          `${where}: resolved logo variant ${receipt.variant} does not satisfy ` +
            `${query.variant}`,
        );
      }
    }
  }
  return errors;
}

export function buildResolveArgs(item, projectDir) {
  const query = item.asset_query;
  const args = [
    MEDIA_RESOLVE,
    "--type",
    query.type,
    "--intent",
    query.intent,
    "--project",
    projectDir,
    "--json",
  ];
  // Logo has no generative fallback, so its deterministic network catalogs
  // are safe. Other deterministic requests stay local-only to prevent an
  // accidental VidMuse generation when no library/provider hit exists.
  if (query.type !== "logo" || query.mode === "creator-library") {
    args.push("--local-only");
  }
  if (query.entity) args.push("--entity", query.entity);
  if (query.variant) args.push("--variant", query.variant);
  if (query.core_pack_id) args.push("--core-pack-id", query.core_pack_id);
  if (query.creator_library_id) {
    args.push("--creator-library-id", query.creator_library_id);
    args.push("--provider", "creator-library");
  } else if (query.provider) {
    args.push("--provider", query.provider);
  }
  return args;
}

function parseJsonOutput(stdout) {
  const lines = String(stdout || "")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      return JSON.parse(lines[index]);
    } catch {
      // Continue backward in case a dependency printed a non-JSON notice.
    }
  }
  return null;
}

function resolutionFromReceipt(receipt, item) {
  const query = item.asset_query || {};
  const provider = receipt.provenance?.provider || null;
  const resolvedEntity =
    receipt.provenance?.resolved_entity ||
    (provider === "lobehub.icons" ? receipt.provenance?.slug : null) ||
    receipt.entity ||
    query.entity ||
    null;
  return {
    status: "resolved",
    asset_id: receipt.id,
    type: receipt.type,
    path: receipt.path,
    source: receipt._source || receipt.source,
    provider,
    variant: receipt.variant || receipt.provenance?.variant || null,
    requested_entity: query.entity || null,
    resolved_entity: resolvedEntity,
    request_fingerprint: requestFingerprint(query),
    core_pack_id: receipt.provenance?.core_pack_id || null,
    creator_library_id: receipt.provenance?.creator_library_id || null,
    license_state: receipt.license_state || null,
    copyright_state: receipt.copyright_state || null,
    trademark_state: receipt.trademark_state || null,
    license: receipt.license || null,
  };
}

function writeJsonAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.tmp-${process.pid}`;
  writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temp, path);
}

export function syncAssetSources(plan, projectDir) {
  const path = join(projectDir, "asset-sources.json");
  let document = { schema: "vidmuse.asset-sources.v1", assets: [] };
  if (existsSync(path)) {
    const current = JSON.parse(readFileSync(path, "utf8"));
    document = Array.isArray(current)
      ? { schema: "vidmuse.asset-sources.v1", assets: current }
      : current;
    if (!Array.isArray(document.assets)) document.assets = [];
  }
  const byRef = new Map(
    document.assets
      .filter((entry) => entry && typeof entry === "object" && entry.asset_ref)
      .map((entry, index) => [entry.asset_ref, index]),
  );
  let changed = false;
  for (const item of plan.opportunities || []) {
    const receipt = item.resolution;
    if (!receipt || receipt.status !== "resolved" || !receipt.path) continue;
    const query = item.asset_query || {};
    const entry = {
      id: receipt.asset_id || item.id,
      asset_ref: item.id,
      type: query.type === "logo" ? "official_logo" : query.type,
      rung: receipt.provider === "core-pack" ? "core" : "real",
      source: {
        provider: receipt.provider || null,
        intent: query.intent || null,
        entity: query.entity || item.canonical_entity,
        resolved_entity: receipt.resolved_entity || query.entity || item.canonical_entity,
        variant: receipt.variant || query.variant || null,
      },
      local_file: receipt.path,
      usage: item.beat_id ? [item.beat_id] : [],
      license_state: receipt.license_state || null,
      copyright_state: receipt.copyright_state || null,
      trademark_state: receipt.trademark_state || null,
      license: receipt.license || null,
    };
    const index = byRef.get(item.id);
    if (index == null) {
      byRef.set(item.id, document.assets.length);
      document.assets.push(entry);
    } else {
      document.assets[index] = entry;
    }
    changed = true;
  }
  if (changed) writeJsonAtomic(path, document);
  return { changed, path, assets: document.assets.length };
}

function template(workflow) {
  return {
    schema: SCHEMA,
    workflow,
    transcript: "transcript.json",
    decision_inputs: [],
    pass_receipt: {
      contract: PASS_CONTRACT,
      status: "pending",
      input: { path: "transcript.json", sha256: null },
      inputs: [{ role: "transcript", path: "transcript.json", sha256: null }],
      opportunity_count: 0,
      completed_at: null,
    },
    opportunities: [],
    groups: [],
  };
}

export function resolveDeterministic(plan, projectDir, { dryRun = false } = {}) {
  let resolved = 0;
  let reused = 0;
  let skipped = 0;
  let missed = 0;
  const operations = [];

  for (const item of plan.opportunities) {
    const query = item.asset_query;
    if (!query || !["deterministic", "creator-library"].includes(query.mode)) {
      skipped += 1;
      continue;
    }
    const fingerprint = requestFingerprint(query);
    const identityMatches =
      query.type !== "logo" ||
      !item.resolution?.resolved_entity ||
      normalizedIdentity(item.resolution.resolved_entity) ===
        normalizedIdentity(query.entity);
    if (
      item.resolution?.status === "resolved" &&
      item.resolution?.request_fingerprint === fingerprint &&
      identityMatches &&
      item.resolution?.path &&
      existsSync(join(projectDir, item.resolution.path))
    ) {
      reused += 1;
      continue;
    }
    const commandArgs = buildResolveArgs(item, projectDir);
    operations.push({ id: item.id, type: query.type, entity: query.entity || null });
    if (dryRun) continue;

    const run = spawnSync(process.execPath, commandArgs, {
      cwd: projectDir,
      encoding: "utf8",
    });
    const receipt = parseJsonOutput(run.stdout);
    if (run.status !== 0 || !receipt?.ok) {
      item.resolution = {
        status: "miss",
        ...(receipt?.code ? { code: receipt.code } : {}),
        ...(receipt?.details ? { details: receipt.details } : {}),
        request_fingerprint: fingerprint,
        ...(query.entity ? { requested_entity: query.entity } : {}),
        error:
          receipt?.error ||
          String(run.stderr || "").trim() ||
          `media-use exited ${run.status}`,
      };
      missed += 1;
      continue;
    }
    const resolution = resolutionFromReceipt(receipt, item);
    if (
      query.type === "logo" &&
      normalizedIdentity(resolution.resolved_entity) !== normalizedIdentity(query.entity)
    ) {
      item.resolution = {
        status: "miss",
        code: "logo_identity_mismatch",
        error:
          `resolved logo identity ${resolution.resolved_entity} does not match ` +
          `requested entity ${query.entity}`,
        request_fingerprint: fingerprint,
      };
      missed += 1;
      continue;
    }
    item.resolution = resolution;
    resolved += 1;
  }

  return { resolved, reused, skipped, missed, operations };
}

export function runCli(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      project: { type: "string", short: "p", default: "." },
      plan: { type: "string", default: PLAN_FILE },
      workflow: { type: "string", default: "create" },
      init: { type: "boolean", default: false },
      force: { type: "boolean", default: false },
      "complete-pass": { type: "boolean", default: false },
      validate: { type: "boolean", default: false },
      resolve: { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
    strict: true,
  });

  if (values.help) {
    console.log(`vidmuse-assets asset plan

Usage:
  node asset_plan.mjs --project <dir> --init [--workflow create|recut]
  node asset_plan.mjs --project <dir> --complete-pass
  node asset_plan.mjs --project <dir> --validate
  node asset_plan.mjs --project <dir> --resolve
  node asset_plan.mjs --project <dir> --dry-run

--resolve executes asset_query.mode=deterministic and exact-id creator-library
entries through media-use. Generated and official-web entries remain planned.`);
    return 0;
  }

  const projectDir = pathResolve(values.project);
  const planPath = pathResolve(projectDir, values.plan);

  if (values.init) {
    if (!WORKFLOWS.has(values.workflow)) {
      console.error("error: --workflow must be create or recut");
      return 2;
    }
    if (existsSync(planPath) && !values.force) {
      console.error(`error: ${planPath} already exists (pass --force to replace)`);
      return 1;
    }
    writeJsonAtomic(planPath, template(values.workflow));
    console.log(`initialized ${planPath}`);
    return 0;
  }

  if (!existsSync(planPath)) {
    console.error(`error: missing ${planPath} — run --init or write the Semantic Asset Pass`);
    return 1;
  }

  let plan;
  try {
    plan = JSON.parse(readFileSync(planPath, "utf8"));
  } catch (error) {
    console.error(`error: cannot read ${planPath}: ${error.message}`);
    return 1;
  }
  if (values["complete-pass"]) {
    try {
      completePassReceipt(plan, projectDir);
      writeJsonAtomic(planPath, plan);
    } catch (error) {
      console.error(`error: ${error.message}`);
      return 1;
    }
  }
  const structuralErrors = validateAssetPlan(plan);
  const errors = [
    ...structuralErrors,
    ...validatePassReceipt(plan, projectDir).filter(
      (error) => !structuralErrors.includes(error),
    ),
    ...(!values.resolve && !values["dry-run"]
      ? validateResolutionReceipts(plan)
      : []),
  ];
  if (errors.length > 0) {
    if (values.json) {
      console.log(JSON.stringify({ ok: false, errors }));
    } else {
      for (const error of errors) console.error(`FAIL ${error}`);
      console.error(`error: ${errors.length} asset-plan violation(s)`);
    }
    return 1;
  }

  if (values.resolve || values["dry-run"]) {
    const summary = resolveDeterministic(plan, projectDir, {
      dryRun: values["dry-run"],
    });
    if (!values["dry-run"]) {
      plan.resolved_at = new Date().toISOString();
      writeJsonAtomic(planPath, plan);
      syncAssetSources(plan, projectDir);
    }
    if (values.json) {
      console.log(JSON.stringify({ ok: summary.missed === 0, ...summary }));
    } else {
      const prefix = values["dry-run"] ? "dry-run" : "resolved";
      console.log(
        `${prefix}: ${summary.resolved} new, ${summary.reused} reused, ` +
          `${summary.skipped} deferred, ${summary.missed} missed`,
      );
      for (const operation of summary.operations) {
        console.log(
          `  ${operation.id}: ${operation.type}` +
            `${operation.entity ? ` ${operation.entity}` : ""}`,
        );
      }
    }
    return summary.missed === 0 ? 0 : 1;
  }

  if (values.json) {
    console.log(
      JSON.stringify({
        ok: true,
        opportunities: plan.opportunities.length,
        groups: (plan.groups || []).length,
      }),
    );
  } else {
    console.log(
      `ok: ${planPath} — ${plan.opportunities.length} opportunities, ` +
        `${(plan.groups || []).length} groups`,
    );
  }
  return 0;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(pathResolve(process.argv[1])).href
) {
  process.exitCode = runCli();
}
