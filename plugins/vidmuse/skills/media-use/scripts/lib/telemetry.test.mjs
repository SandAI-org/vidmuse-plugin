import { strict as assert } from "node:assert";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { __anonymousIdForTest, __resetTelemetryForTest, optedOut, track } from "./telemetry.mjs";

function sandbox() {
  const root = mkdtempSync(join(tmpdir(), "vidmuse-media-telemetry-"));
  const home = join(root, "home");
  mkdirSync(home, { recursive: true });
  process.env.HOME = home;
  return { root, home };
}

function restoreEnv(saved) {
  for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
  Object.assign(process.env, saved);
}

function clearOptOuts() {
  for (const key of ["DO_NOT_TRACK", "VIDMUSE_NO_TELEMETRY", "CI", "NODE_ENV"]) {
    delete process.env[key];
  }
}

test("optedOut uses VidMuse and standard opt-out variables", () => {
  const saved = { ...process.env };
  try {
    clearOptOuts();
    assert.equal(optedOut(), false);
    process.env.VIDMUSE_NO_TELEMETRY = "1";
    assert.equal(optedOut(), true);
    delete process.env.VIDMUSE_NO_TELEMETRY;
    process.env.DO_NOT_TRACK = "1";
    assert.equal(optedOut(), true);
    delete process.env.DO_NOT_TRACK;
    process.env.CI = "true";
    assert.equal(optedOut(), true);
  } finally {
    restoreEnv(saved);
  }
});

test("opted-out tracking does not touch disk or network", async () => {
  const saved = { ...process.env };
  const originalFetch = globalThis.fetch;
  const { root, home } = sandbox();
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return { ok: true };
  };
  try {
    process.env.VIDMUSE_NO_TELEMETRY = "1";
    await track("media_use_resolve", { type: "image" });
    assert.equal(calls, 0);
    assert.equal(existsSync(join(home, ".vidmuse", "media-use-telemetry.json")), false);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv(saved);
    rmSync(root, { recursive: true, force: true });
    __resetTelemetryForTest();
  }
});

test("anonymous id is stored under ~/.vidmuse and reused", () => {
  const saved = { ...process.env };
  const { root, home } = sandbox();
  try {
    clearOptOuts();
    const first = __anonymousIdForTest();
    const second = __anonymousIdForTest();
    const path = join(home, ".vidmuse", "media-use-telemetry.json");
    assert.match(first, /^[0-9a-f-]{36}$/i);
    assert.equal(second, first);
    assert.equal(JSON.parse(readFileSync(path, "utf8")).anonymousId, first);
    assert.equal(existsSync(join(home, ".hyperframes")), false);
    assert.equal(existsSync(join(home, ".heygen")), false);
  } finally {
    restoreEnv(saved);
    rmSync(root, { recursive: true, force: true });
    __resetTelemetryForTest();
  }
});

test("track sends one anonymous VidMuse event and shows notice once", async () => {
  const saved = { ...process.env };
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  const { root, home } = sandbox();
  const calls = [];
  const stderr = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true };
  };
  console.error = (...args) => stderr.push(args.join(" "));
  try {
    clearOptOuts();
    await track("media_use_resolve", { type: "voice", provider: "vidmuse.model" });
    await track("media_use_resolve", { type: "video", provider: "vidmuse.model" });
    assert.equal(calls.length, 2);
    const batches = calls.map((call) => JSON.parse(call.options.body).batch[0]);
    assert.equal(batches[0].properties.surface, "vidmuse-media-use");
    assert.equal(batches[0].distinct_id, batches[1].distinct_id);
    assert.equal(batches.some((entry) => entry.event === "$identify"), false);
    assert.equal(stderr.filter((line) => /coarse usage telemetry/.test(line)).length, 1);
    assert.equal(
      JSON.parse(readFileSync(join(home, ".vidmuse", "media-use-telemetry.json"), "utf8"))
        .telemetryNoticeShown,
      true,
    );
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
    restoreEnv(saved);
    rmSync(root, { recursive: true, force: true });
    __resetTelemetryForTest();
  }
});
