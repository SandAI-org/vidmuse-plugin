import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DEFAULT_ROOT,
  validateCorePack,
} from "./core_pack.mjs";

test("framework-only Core Pack is valid with zero assets", () => {
  const manifest = JSON.parse(readFileSync(`${DEFAULT_ROOT}/manifest.json`, "utf8"));
  assert.deepEqual(validateCorePack(manifest), []);
  assert.deepEqual(manifest.assets, []);
  assert.equal(manifest.status, "framework");
});

test("Core Pack rejects entries without redistribution receipts", () => {
  const manifest = {
    schema: "vidmuse.core-pack.v1",
    categories: {},
    assets: [
      {
        id: "unsafe",
        type: "icon",
        path: "icons/unsafe.svg",
        sha256: "0".repeat(64),
      },
    ],
  };
  const errors = validateCorePack(manifest);
  assert.ok(errors.some((error) => error.includes("license receipt is required")));
});
