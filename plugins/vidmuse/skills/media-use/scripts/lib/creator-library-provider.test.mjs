import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  CreatorLibraryConstraintError,
  creatorLibrarySearch,
} from "./creator-library-provider.mjs";

function fixture(overrides = {}) {
  const root = mkdtempSync(join(tmpdir(), "vidmuse-creator-provider-"));
  mkdirSync(join(root, "icons"), { recursive: true });
  const bytes = "<svg/>";
  writeFileSync(join(root, "icons", "chosen.svg"), bytes);
  const asset = {
    id: "chosen-icon",
    type: "icon",
    path: "icons/chosen.svg",
    description: "Approved private icon",
    license_state: "verified-commercial",
    sha256: createHash("sha256").update(bytes).digest("hex"),
    ...overrides,
  };
  writeFileSync(
    join(root, "manifest.json"),
    `${JSON.stringify({
      schema: "vidmuse.creator-library.v1",
      version: "1.0.0",
      private: true,
      assets: [asset],
    })}\n`,
  );
  return { root, asset };
}

test("Creator Library resolves only an exact approved id", async () => {
  const { root } = fixture();
  assert.equal(
    await creatorLibrarySearch("something fuzzy", {
      type: "icon",
      creatorLibraryRoot: root,
    }),
    null,
  );
  const hit = await creatorLibrarySearch("irrelevant wording", {
    type: "icon",
    creatorLibraryId: "chosen-icon",
    creatorLibraryRoot: root,
  });
  assert.equal(hit.metadata.provenance.creator_library_id, "chosen-icon");
  assert.equal(hit.metadata.provenance.private_library, true);
  assert.equal(hit.metadata.license_state, "verified-commercial");
});

test("Creator Library exact id cannot fall through on a type mismatch", async () => {
  const { root } = fixture();
  await assert.rejects(
    () =>
      creatorLibrarySearch("chosen", {
        type: "video",
        creatorLibraryId: "chosen-icon",
        creatorLibraryRoot: root,
      }),
    (error) =>
      error instanceof CreatorLibraryConstraintError &&
      error.code === "creator_library_type_mismatch" &&
      error.terminal === true,
  );
});

test("unknown-license private assets remain discovery-only", async () => {
  const { root } = fixture({ license_state: "unknown" });
  await assert.rejects(
    () =>
      creatorLibrarySearch("chosen", {
        type: "icon",
        creatorLibraryId: "chosen-icon",
        creatorLibraryRoot: root,
      }),
    (error) => error.code === "creator_library_license_blocked",
  );
});

test("an exact private logo id still has to attest canonical identity", async () => {
  const { root } = fixture({
    type: "logo",
    entity: "openai",
    variant: "mono",
  });
  await assert.rejects(
    () =>
      creatorLibrarySearch("ChatGPT logo", {
        type: "logo",
        entity: "chatgpt",
        variant: "mono",
        creatorLibraryId: "chosen-icon",
        creatorLibraryRoot: root,
      }),
    (error) => error.code === "creator_library_identity_mismatch",
  );
});
