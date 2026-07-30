import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";

import { readCopyright } from "./import_pack.mjs";

test("OFL provenance reads the holder, not a license definition", () => {
  const path = resolve(
    import.meta.dirname,
    "../assets/core-pack/packs/noto-cjk-sc/LICENSE.txt",
  );
  assert.equal(readCopyright(path), "Google Inc.");
});

test("MIT provenance keeps the explicit copyright line", () => {
  const path = resolve(
    import.meta.dirname,
    "../assets/core-pack/packs/lobe-brands/LICENSE.txt",
  );
  assert.match(readCopyright(path), /^Copyright \(c\) 2023 LobeHub$/);
});
