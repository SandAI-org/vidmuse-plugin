import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  runCli,
  validateCreatorLibrary,
} from "./creator_library.mjs";

test("--init creates a private empty Creator Library framework", () => {
  const parent = mkdtempSync(join(tmpdir(), "vidmuse-creator-library-"));
  const root = join(parent, "creator");
  assert.equal(runCli(["--root", root, "--init", "--json"]), 0);
  const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
  assert.equal(manifest.private, true);
  assert.deepEqual(manifest.assets, []);
  assert.deepEqual(validateCreatorLibrary(manifest, root), []);
});

test("Creator Library rejects a user-licensed asset without its receipt", () => {
  const root = mkdtempSync(join(tmpdir(), "vidmuse-creator-invalid-"));
  const manifest = {
    schema: "vidmuse.creator-library.v1",
    private: true,
    assets: [
      {
        id: "thiings-clay-001",
        type: "icon",
        path: "icons/clay-001.png",
        license_state: "user-licensed",
      },
    ],
  };
  const errors = validateCreatorLibrary(manifest, root);
  assert.ok(errors.some((error) => error.includes("requires license_receipt")));
});
