#!/usr/bin/env node
import { verifyRegistry } from "./registry-lib.mjs";

const requireIndexes = process.argv.includes("--require-indexes");

try {
  const result = verifyRegistry({ requireIndexes });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
} catch (error) {
  console.error(JSON.stringify({ ok: false, errors: [error.message] }, null, 2));
  process.exitCode = 1;
}
