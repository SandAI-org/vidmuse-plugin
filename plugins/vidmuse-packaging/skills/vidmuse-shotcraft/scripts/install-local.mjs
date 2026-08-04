#!/usr/bin/env node
import { installLocal } from "./registry-lib.mjs";

function parseArgs(argv) {
  const options = { force: false, json: false };
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--force") options.force = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--dir") {
      options.projectDir = argv[index + 1];
      if (!options.projectDir) throw new Error("--dir requires a project path.");
      index += 1;
    } else if (arg.startsWith("--")) throw new Error(`Unknown option ${arg}.`);
    else positional.push(arg);
  }
  return { options, positional };
}

try {
  const { options, positional } = parseArgs(process.argv.slice(2));
  const name = positional[0];
  if (!name) throw new Error("Usage: install-local.mjs <shot-name> --dir <project> [--json]");
  const result = installLocal(name, options);
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Installed ${result.name}`);
    for (const path of result.written) console.log(`  wrote ${path}`);
    for (const path of result.skipped) console.log(`  kept  ${path}`);
    console.log("\nWire snippet:\n");
    console.log(result.snippet);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
