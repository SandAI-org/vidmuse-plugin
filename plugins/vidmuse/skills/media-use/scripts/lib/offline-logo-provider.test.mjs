import { strict as assert } from "node:assert";
import { test } from "node:test";

import { indexBrands, offlineLogoSearch } from "./offline-logo-provider.mjs";
import { LogoResolutionConstraintError } from "./logo-provider.mjs";

const INDEX = {
  schema: "vidmuse.core-pack.index.v1",
  packs: {
    "lobe-brands": {
      type: "brand",
      license_state: "verified-commercial",
      upstream: {
        npm: "@lobehub/icons-static-svg",
        version: "1.94.0",
        catalog_npm: "@lobehub/icons",
        catalog_version: "5.15.0",
      },
    },
  },
  types: { brand: {} },
  items: [
    { id: "lobe-brands/alibaba", pack: "lobe-brands", type: "brand", root: "core-pack", path: "packs/lobe-brands/logos/alibaba.svg", tags: ["Alibaba", "color"], aliases_zh: ["阿里巴巴", "阿里"] },
    { id: "lobe-brands/openai", pack: "lobe-brands", type: "brand", root: "core-pack", path: "packs/lobe-brands/logos/openai.svg", tags: ["OpenAI"] },
    { id: "lobe-brands/codex", pack: "lobe-brands", type: "brand", root: "core-pack", path: "packs/lobe-brands/logos/codex.svg", tags: ["Codex"] },
    // Must be ignored: a different pack and a different type.
    { id: "lucide/trash", pack: "lucide", type: "icon", root: "core-pack", path: "packs/lucide/icons/trash.svg", tags: ["trash"] },
  ],
};

test("brands map one-to-one, and only from the brand pack", () => {
  const brands = indexBrands(INDEX);
  assert.equal(brands.size, 3); // alibaba, openai, codex — not lucide/trash
  // One mark per brand: no variant table to walk.
  assert.equal(brands.get("alibaba").variant, "color");
  assert.equal(brands.get("openai").variant, "mono");
  assert.ok(brands.get("alibaba").aliases.has("阿里巴巴"));
});

test("a Chinese company name resolves offline against the real pack", async () => {
  // Chinese names are carried as per-brand aliases so a 中文 query works offline.
  // They are matched with the same exact-equality rule as the English id — an
  // alias names one company, it is not a category.
  const hit = await offlineLogoSearch("阿里巴巴", { entity: "阿里巴巴" });
  assert.ok(hit, "阿里巴巴 should resolve from the curated set");
  assert.equal(hit.metadata.provenance.resolved_entity, "alibaba");
});

test("a Chinese company name resolves to its own mark, not a neighbour's", async () => {
  const hit = await offlineLogoSearch("字节跳动", { entity: "字节跳动" });
  assert.ok(hit);
  assert.equal(hit.metadata.provenance.resolved_entity, "bytedance");
});

test("a product is never substituted for its parent company", async () => {
  // Lobe's fullTitle says "Codex (OpenAI)". Treating that parenthetical as an
  // alias would silently serve the OpenAI mark for a Codex request, or vice
  // versa — the exact substitution the semantic asset pass forbids.
  const brands = indexBrands(INDEX);
  assert.ok(brands.has("codex"));
  assert.ok(brands.has("openai"));
  assert.ok(!brands.get("codex").aliases.has("OpenAI"));
  assert.ok(!brands.get("openai").aliases.has("Codex"));
});

test("an unknown brand is a clean miss, not an approximation", async () => {
  const result = await offlineLogoSearch("Zeabur logo", { entity: "zeabur" });
  assert.equal(result, null);
});

test("a missing index is a clean miss", async () => {
  const result = await offlineLogoSearch("Alibaba", {
    entity: "alibaba",
    corePackRoot: "/definitely/not/a/core/pack",
  });
  assert.equal(result, null);
});

test("an unavailable explicit variant is terminal against the real pack", async () => {
  // Anthropic is monochrome by design, so only a mono mark is frozen. Serving it
  // for a "color" request would be a visual substitution the caller never
  // approved, so this must throw rather than quietly hand back a different mark.
  await assert.rejects(
    () => offlineLogoSearch("Anthropic", { entity: "anthropic", variant: "color" }),
    (error) => {
      assert.ok(error instanceof LogoResolutionConstraintError);
      assert.equal(error.code, "logo_variant_unavailable");
      assert.equal(error.terminal, true);
      assert.deepEqual(error.details.available_variants, ["mono"]);
      return true;
    },
  );
});

test("a real offline hit carries identity, pinned packages, and a staleness note", async () => {
  const hit = await offlineLogoSearch("Anthropic logo", { entity: "anthropic" });
  assert.ok(hit, "anthropic is in the curated set");
  assert.equal(hit.source, "core-pack");
  assert.equal(hit.metadata.provider, "core-pack.brands");
  // resolved_entity is the field the cache-reuse identity check reads, so an
  // offline hit must populate it exactly like a live one.
  assert.equal(hit.metadata.provenance.resolved_entity, "anthropic");
  assert.equal(hit.metadata.provenance.offline_fallback, true);
  assert.match(hit.metadata.provenance.asset_package, /icons-static-svg@\d/);
  assert.match(hit.metadata.provenance.catalog_package, /@lobehub\/icons@\d/);
  // A reviewer must be able to tell a frozen mark from a live one.
  assert.match(hit.metadata.provenance.staleness_note, /re-resolve online/i);
  assert.equal(hit.metadata.license.id, "MIT");
  assert.match(hit.metadata.license.trademark_note, /trademark rights remain/i);
});

test("a variant this tier never freezes is terminal, not a substitution", async () => {
  // Wordmarks and lockups exist upstream but are not frozen; the tier must not
  // hand back a plain mark as if it were the wordmark that was asked for.
  await assert.rejects(
    () => offlineLogoSearch("Alibaba", { entity: "alibaba", variant: "text-cn" }),
    (error) => error.code === "logo_variant_unavailable",
  );
});

test("color is frozen where upstream has it, mono where it does not", async () => {
  const color = await offlineLogoSearch("Alibaba", { entity: "alibaba" });
  assert.equal(color.metadata.provenance.variant, "color");
  // 32 curated brands are monochrome by design; a color-only rule would have
  // silently dropped them from the offline floor.
  const mono = await offlineLogoSearch("Anthropic", { entity: "anthropic" });
  assert.equal(mono.metadata.provenance.variant, "mono");
});
