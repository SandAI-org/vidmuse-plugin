#!/usr/bin/env node
import { buildIndexes } from "./registry-lib.mjs";

try {
  const result = buildIndexes();
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exitCode = 1;
}
