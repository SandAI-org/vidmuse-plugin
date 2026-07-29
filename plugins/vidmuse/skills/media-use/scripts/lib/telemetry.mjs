// Coarse, opt-out usage telemetry for the VidMuse media adapter.
//
// The install identity is local to VidMuse media-use. It never reads provider
// credentials, account email, prompts, filenames, or media paths. Events only
// carry the small properties supplied by call sites (type, resolution source,
// winning provider, and similar operational labels).

import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const POSTHOG_API_KEY = "phc_zjjbX0PnWxERXrMHhkEJWj9A9BhGVLRReICgsfTMmpx";
const POSTHOG_HOST = "https://us.i.posthog.com";
const TIMEOUT_MS = 1500;
let warnedNonDefaultHost = false;

function isTestOrCiContext() {
  return (
    process.env.CI === "true" ||
    process.env.CI === "1" ||
    process.env.NODE_ENV === "test" ||
    process.env.NODE_ENV === "development"
  );
}

function posthogHost() {
  const override = process.env.MEDIA_USE_TELEMETRY_HOST;
  if (override && !warnedNonDefaultHost && !isTestOrCiContext()) {
    warnedNonDefaultHost = true;
    console.error(
      `media-use: telemetry is redirected via MEDIA_USE_TELEMETRY_HOST (${override})`,
    );
  }
  return override || POSTHOG_HOST;
}

export function optedOut() {
  return (
    process.env.VIDMUSE_NO_TELEMETRY === "1" ||
    process.env.DO_NOT_TRACK === "1" ||
    process.env.CI === "true" ||
    process.env.CI === "1" ||
    process.env.NODE_ENV === "development"
  );
}

function statePath() {
  return join(homedir(), ".vidmuse", "media-use-telemetry.json");
}

function readState() {
  try {
    const file = statePath();
    if (!existsSync(file)) return {};
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeState(state) {
  const dir = join(homedir(), ".vidmuse");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(statePath(), `${JSON.stringify(state, null, 2)}\n`);
}

function anonymousId() {
  try {
    const state = readState();
    if (typeof state.anonymousId === "string" && state.anonymousId.trim()) {
      return state.anonymousId.trim();
    }
    const id = randomUUID();
    writeState({ ...state, anonymousId: id });
    return id;
  } catch {
    return "anon";
  }
}

function showTelemetryNotice() {
  if (optedOut()) return;
  try {
    const state = readState();
    if (state.telemetryNoticeShown === true) return;
    console.error(
      "media-use sends coarse usage telemetry without prompts, filenames, paths, or account identity. Opt out with VIDMUSE_NO_TELEMETRY=1 or DO_NOT_TRACK=1.",
    );
    writeState({ ...state, telemetryNoticeShown: true });
  } catch {
    // Best effort only.
  }
}

async function postEvent(event, properties, distinctId) {
  try {
    await fetch(`${posthogHost()}/batch/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify({
        api_key: POSTHOG_API_KEY,
        batch: [
          {
            event,
            properties: { ...properties, surface: "vidmuse-media-use", $ip: null },
            distinct_id: distinctId,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // Telemetry must never break media work.
  }
}

export async function track(event, properties = {}) {
  if (optedOut()) return;
  showTelemetryNotice();
  await postEvent(event, properties, anonymousId());
}

export function __anonymousIdForTest() {
  return anonymousId();
}

export function __resetTelemetryForTest() {
  warnedNonDefaultHost = false;
}
