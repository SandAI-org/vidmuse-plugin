#!/usr/bin/env node
/**
 * Remembered defaults CLI — the lightweight tier of VidMuse project memory.
 *
 *   node prefs.mjs get --project . [--json]
 *     Print the merged view (project `.media/preferences.json` over user
 *     `~/.media/preferences.json`), each key with its source and the receipt
 *     material (confirmed_in, updated_at).
 *
 *   node prefs.mjs record --project . --key destination --value x-feed [--workflow <w>]
 *     Record one confirmed brief answer into the project tier; the same value
 *     confirmed in two different projects promotes the key to the user tier.
 *
 * A remembered value becomes a recommended option with a receipt; it does not
 * silently override the current VidMuse brief.
 */
import { parseArgs } from "node:util";
import { mergedPreferences, recordPreference } from "./lib/prefs-store.mjs";

const { values: args, positionals } = parseArgs({
  options: {
    project: { type: "string" },
    hyperframes: { type: "string" },
    key: { type: "string" },
    value: { type: "string" },
    workflow: { type: "string" },
    json: { type: "boolean", default: false },
  },
  allowPositionals: true,
});

const verb = positionals[0];
const projectDir = args.project || args.hyperframes || ".";

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (verb === "get") {
  const merged = mergedPreferences(projectDir);
  if (args.json) {
    console.log(JSON.stringify(merged, null, 2));
  } else if (Object.keys(merged).length === 0) {
    console.log("no remembered preferences yet");
  } else {
    for (const [key, entry] of Object.entries(merged)) {
      console.log(
        `${key} = ${entry.value}  (${entry.source}; confirmed in ${entry.confirmed_in.join(", ")})`,
      );
    }
  }
} else if (verb === "record") {
  if (!args.key || !args.value) fail("record needs --key and --value");
  try {
    const result = recordPreference({
      projectDir,
      key: args.key,
      value: args.value,
      workflow: args.workflow,
    });
    const promotion = result.promoted ? "; promoted to user tier" : "";
    console.log(`recorded ${result.key} = ${result.value} (project${promotion})`);
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }
} else {
  fail(
    "usage: prefs.mjs <get|record> --project . [--key <k> --value <v> --workflow <w>] [--json]",
  );
}
