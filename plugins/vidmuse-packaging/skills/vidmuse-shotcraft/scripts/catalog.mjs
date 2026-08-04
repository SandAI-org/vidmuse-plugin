#!/usr/bin/env node
import { loadItem, searchCatalog } from "./registry-lib.mjs";

function parseArgs(argv) {
  const options = { json: false, limit: 10 };
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") options.json = true;
    else if (["--query", "--tag", "--recut", "--limit"].includes(arg)) {
      const value = argv[index + 1];
      if (!value) throw new Error(`${arg} requires a value.`);
      options[arg.slice(2)] = value;
      index += 1;
    } else if (arg.startsWith("--")) throw new Error(`Unknown option ${arg}.`);
    else positional.push(arg);
  }
  return { options, positional };
}

function printRows(items) {
  if (items.length === 0) {
    console.log("No Shotcraft blocks matched.");
    return;
  }
  for (const item of items) {
    console.log(`${item.name}\t${item.recut}\t${item.duration}s\t${item.description}`);
  }
}

try {
  const { options, positional } = parseArgs(process.argv.slice(2));
  const command = positional.shift() ?? "search";
  if (command === "inspect") {
    const name = positional.shift();
    if (!name) throw new Error("inspect requires a shot-* name.");
    const { item } = loadItem(name);
    console.log(JSON.stringify(item, null, 2));
  } else if (command === "search" || command === "catalog") {
    const query = options.query ?? positional.join(" ");
    const items = searchCatalog({
      query,
      tag: options.tag,
      recut: options.recut,
      limit: Number(options.limit),
    });
    if (options.json) console.log(JSON.stringify(items, null, 2));
    else printRows(items);
  } else {
    throw new Error(`Unknown command "${command}". Use search, catalog, or inspect.`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
