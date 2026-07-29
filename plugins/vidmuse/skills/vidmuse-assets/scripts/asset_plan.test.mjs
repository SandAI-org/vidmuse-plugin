import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  buildResolveArgs,
  completePassReceipt,
  requestFingerprint,
  resolveDeterministic,
  runCli,
  syncAssetSources,
  validateAssetPlan,
  validatePassReceipt,
  validateResolutionReceipts,
} from "./asset_plan.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

function opportunity(overrides = {}) {
  return {
    id: "ao_openai_intro",
    mention: "OpenAI",
    canonical_entity: "openai",
    entity_type: "organization",
    semantic_role: "subject",
    visual_job: "establish-identity",
    ranges: [[12.4, 13.8]],
    beat_id: "b03",
    decision: "show-logo",
    reason: "First meaningful introduction of the organization.",
    confidence: 0.97,
    asset_query: {
      type: "logo",
      intent: "OpenAI official logo",
      entity: "openai",
      variant: "mono",
      mode: "deterministic",
    },
    ...overrides,
  };
}

function plan(items = [opportunity()]) {
  return {
    schema: "vidmuse.asset-plan.v1",
    workflow: "create",
    transcript: "transcript.json",
    pass_receipt: {
      contract: "semantic-asset-pass.v1",
      status: "completed",
      input: {
        path: "transcript.json",
        sha256: "0".repeat(64),
      },
      opportunity_count: items.length,
      completed_at: "2026-07-29T00:00:00.000Z",
    },
    opportunities: items,
    groups: [],
  };
}

test("accepts a canonical deterministic logo opportunity", () => {
  assert.deepEqual(validateAssetPlan(plan()), []);
});

test("the shipped OpenAI/GPT-4 example validates", () => {
  const example = JSON.parse(
    readFileSync(resolve(HERE, "../references/asset-plan.example.json"), "utf8"),
  );
  assert.deepEqual(validateAssetPlan(example), []);
});

test("requires a query for a file decision", () => {
  const errors = validateAssetPlan(plan([opportunity({ asset_query: undefined })]));
  assert.ok(errors.some((error) => error.includes("requires asset_query")));
});

test("forbids generated logos", () => {
  const item = opportunity();
  item.asset_query = { ...item.asset_query, mode: "generated" };
  const errors = validateAssetPlan(plan([item]));
  assert.ok(errors.some((error) => error.includes("never generate a mark")));
});

test("rejects a company/product/model identity substitution", () => {
  const item = opportunity({
    canonical_entity: "chatgpt",
    entity_type: "product",
    asset_query: {
      type: "logo",
      intent: "ChatGPT official logo",
      entity: "openai",
      variant: "mono",
      mode: "deterministic",
    },
  });
  const errors = validateAssetPlan(plan([item]));
  assert.ok(errors.some((error) => error.includes("does not match canonical entity")));
});

test("requires a completed Semantic Asset Pass receipt even when the plan is empty", () => {
  const value = plan([]);
  value.pass_receipt.status = "pending";
  value.pass_receipt.input.sha256 = null;
  value.pass_receipt.completed_at = null;
  const errors = validateAssetPlan(value);
  assert.ok(errors.some((error) => error.includes("status must be completed")));
  assert.ok(errors.some((error) => error.includes("SHA-256")));
});

test("completed pass receipt is bound to the current transcript bytes", () => {
  const project = mkdtempSync(join(tmpdir(), "vidmuse-pass-receipt-"));
  writeFileSync(join(project, "transcript.json"), '[{"text":"OpenAI"}]\n');
  const value = plan();
  completePassReceipt(value, project, new Date("2026-07-29T00:00:00.000Z"));
  assert.deepEqual(validatePassReceipt(value, project), []);
  writeFileSync(join(project, "transcript.json"), '[{"text":"Anthropic"}]\n');
  assert.ok(
    validatePassReceipt(value, project).some((error) => error.includes("changed after")),
  );
});

test("catches inconsistent variants for one canonical entity", () => {
  const second = opportunity({
    id: "ao_openai_repeat",
    ranges: [[22, 23]],
    asset_query: {
      type: "logo",
      intent: "OpenAI color logo",
      entity: "openai",
      variant: "color",
      mode: "deterministic",
    },
  });
  const errors = validateAssetPlan(plan([opportunity(), second]));
  assert.ok(errors.some((error) => error.includes("earlier opportunity uses mono")));
});

test("checks entity-rich group references", () => {
  const value = plan();
  value.groups = [
    {
      id: "ai-history",
      kind: "timeline",
      member_ids: ["ao_openai_intro", "ao_missing"],
      variant_policy: "mono",
    },
  ];
  const errors = validateAssetPlan(value);
  assert.ok(errors.some((error) => error.includes("unknown member id ao_missing")));
});

test("buildResolveArgs keeps semantic decision outside media-use", () => {
  const args = buildResolveArgs(opportunity(), "/tmp/project");
  assert.equal(args[0].endsWith("/media-use/scripts/resolve.mjs"), true);
  assert.deepEqual(args.slice(1), [
    "--type",
    "logo",
    "--intent",
    "OpenAI official logo",
    "--project",
    "/tmp/project",
    "--json",
    "--entity",
    "openai",
    "--variant",
    "mono",
  ]);
});

test("non-logo deterministic resolution cannot fall through to generation", () => {
  const item = opportunity({
    decision: "show-icon",
    asset_query: {
      type: "icon",
      intent: "generic timeline milestone icon",
      mode: "deterministic",
    },
  });
  const args = buildResolveArgs(item, "/tmp/project");
  assert.ok(args.includes("--local-only"));
});

test("--init creates an empty framework plan", () => {
  const project = mkdtempSync(join(tmpdir(), "vidmuse-asset-plan-"));
  assert.equal(runCli(["--project", project, "--init", "--workflow", "recut"]), 0);
  const created = JSON.parse(readFileSync(join(project, "asset-plan.json"), "utf8"));
  assert.equal(created.schema, "vidmuse.asset-plan.v1");
  assert.equal(created.workflow, "recut");
  assert.deepEqual(created.opportunities, []);
  assert.equal(created.pass_receipt.status, "pending");
});

test("--complete-pass stamps an empty deliberate plan against the transcript", () => {
  const project = mkdtempSync(join(tmpdir(), "vidmuse-asset-pass-cli-"));
  writeFileSync(join(project, "transcript.json"), "[]\n");
  assert.equal(runCli(["--project", project, "--init", "--workflow", "recut"]), 0);
  assert.equal(runCli(["--project", project, "--complete-pass", "--validate"]), 0);
  const created = JSON.parse(readFileSync(join(project, "asset-plan.json"), "utf8"));
  assert.equal(created.pass_receipt.status, "completed");
  assert.equal(created.pass_receipt.opportunity_count, 0);
  assert.match(created.pass_receipt.input.sha256, /^[a-f0-9]{64}$/);
});

test("changed queries invalidate an otherwise existing resolution", () => {
  const project = mkdtempSync(join(tmpdir(), "vidmuse-query-fingerprint-"));
  const local = ".media/images/logo_001.svg";
  mkdirSync(join(project, ".media", "images"), { recursive: true });
  writeFileSync(join(project, local), "<svg/>");
  const value = plan();
  value.opportunities[0].resolution = {
    status: "resolved",
    path: local,
    resolved_entity: "openai",
    request_fingerprint: requestFingerprint(value.opportunities[0].asset_query),
  };
  assert.equal(resolveDeterministic(value, project, { dryRun: true }).reused, 1);

  value.opportunities[0].asset_query = {
    ...value.opportunities[0].asset_query,
    intent: "OpenAI official wordmark",
    variant: "text",
  };
  const result = resolveDeterministic(value, project, { dryRun: true });
  assert.equal(result.reused, 0);
  assert.equal(result.operations.length, 1);
  assert.ok(
    validateResolutionReceipts(value).some((error) =>
      error.includes("stale for its asset_query"),
    ),
  );
});

test("resolved logo identity and variant must satisfy the exact request", () => {
  const value = plan();
  value.opportunities[0].resolution = {
    status: "resolved",
    path: ".media/images/logo_001.svg",
    resolved_entity: "chatgpt",
    variant: "color",
    request_fingerprint: requestFingerprint(value.opportunities[0].asset_query),
  };
  const errors = validateResolutionReceipts(value);
  assert.ok(errors.some((error) => error.includes("resolved logo identity")));
  assert.ok(errors.some((error) => error.includes("resolved logo variant")));
});

test("resolved opportunities sync into composition-facing asset-sources", () => {
  const project = mkdtempSync(join(tmpdir(), "vidmuse-asset-sources-"));
  const value = plan();
  value.opportunities[0].resolution = {
    status: "resolved",
    asset_id: "logo_001",
    path: ".media/images/logo_001.svg",
    provider: "lobehub.icons",
    variant: "mono",
    resolved_entity: "openai",
    request_fingerprint: requestFingerprint(value.opportunities[0].asset_query),
    license_state: "verified-commercial",
    license: { id: "MIT" },
  };
  const result = syncAssetSources(value, project);
  assert.equal(result.changed, true);
  const sources = JSON.parse(readFileSync(join(project, "asset-sources.json"), "utf8"));
  assert.equal(sources.assets[0].asset_ref, "ao_openai_intro");
  assert.equal(sources.assets[0].type, "official_logo");
  assert.equal(sources.assets[0].local_file, ".media/images/logo_001.svg");
});
