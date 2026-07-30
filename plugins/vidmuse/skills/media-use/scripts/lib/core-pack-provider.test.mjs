import assert from "node:assert/strict";
import test from "node:test";

import {
  CorePackConstraintError,
  corePackSearch,
} from "./core-pack-provider.mjs";

test("Core Pack exact id wins regardless of fuzzy intent wording", async () => {
  const hit = await corePackSearch("this wording should not choose anything", {
    type: "icon",
    corePackId: "lucide/trash",
  });
  assert.ok(hit);
  assert.equal(hit.metadata.provenance.core_pack_id, "lucide/trash");
});

test("Core Pack exact id rejects a mismatched requested type", async () => {
  await assert.rejects(
    () =>
      corePackSearch("trash", {
        type: "shape",
        corePackId: "lucide/trash",
      }),
    (error) =>
      error instanceof CorePackConstraintError &&
      error.code === "core_pack_type_mismatch" &&
      error.terminal === true,
  );
});
