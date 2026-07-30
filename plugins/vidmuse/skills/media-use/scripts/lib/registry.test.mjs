import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  getProviders,
  listTypes,
  providerMatches,
  providerNamesFor,
  runProviders,
} from "./registry.mjs";

test("all AI media types route through VidMuse", () => {
  for (const type of ["bgm", "image", "icon", "voice", "video"]) {
    const generators = getProviders(type).filter((provider) => provider.generate);
    assert.deepEqual(generators.map((p) => p.name), ["vidmuse.model"], type);
    const provider = generators[0];
    assert.equal(provider.network, true);
    assert.equal(provider.paid, true);
    assert.equal(typeof provider.generate, "function");
  }
});

test("Core Pack is consulted before generation and never generates", () => {
  // library-layout.md's lookup order puts the preinstalled library ahead of
  // generation. Before this existed the Core Pack had no read path at all: the
  // lookup order named it, but no provider served it.
  assert.deepEqual(providerNamesFor("icon"), [
    "creator-library",
    "core-pack",
    "vidmuse.model",
  ]);
  assert.deepEqual(providerNamesFor("texture"), [
    "creator-library",
    "core-pack",
    "vidmuse.model",
  ]);
  const corePack = getProviders("icon")[1];
  assert.equal(corePack.name, "core-pack");
  assert.equal(typeof corePack.search, "function");
  assert.equal(corePack.generate, undefined);
  assert.notEqual(corePack.network, true); // participates under --local-only
});

test("static Core Pack types have no generative route at all", () => {
  // A typeface or a pre-baked Lottie timeline is not something a model should
  // invent on demand; a wrong one is worse than a clean miss.
  for (const type of ["font", "shape", "lottie", "palette"]) {
    assert.deepEqual(providerNamesFor(type), ["creator-library", "core-pack"], type);
    assert.equal(getProviders(type)[1].generate, undefined, type);
  }
});

test("surface treatment generates, but a local asset still wins", () => {
  // Textures/overlays are film-specific, so they are generated rather than
  // shipped — but an adopted project file or Creator Library set must not be
  // bypassed in favor of paying to generate.
  for (const type of ["texture", "overlay"]) {
    assert.deepEqual(
      providerNamesFor(type),
      ["creator-library", "core-pack", "vidmuse.model"],
      type,
    );
  }
});

test("brand means a project/private design system, never a company logo", () => {
  assert.deepEqual(providerNamesFor("brand"), ["design_spec", "creator-library"]);
});

test("SFX exhausts approved deterministic libraries before generation", () => {
  assert.deepEqual(providerNamesFor("sfx"), [
    "creator-library",
    "core-pack",
    "bundled.sfx",
    "vidmuse.model",
  ]);
  assert.equal(typeof getProviders("sfx")[2].search, "function");
});

test("official logos never use a generative provider", () => {
  assert.deepEqual(providerNamesFor("logo"), [
    "creator-library",
    "lobehub.icons",
    "svgl",
    "simple-icons",
    "github.avatar",
    "favicon.ddg",
    "core-pack.brands",
  ]);
  for (const provider of getProviders("logo")) {
    assert.equal(provider.generate, undefined, provider.name);
  }
});

test("the offline logo floor is last, local, and variant-constrained", () => {
  const tiers = getProviders("logo");
  const offline = tiers.at(-1);
  // Ordering is the design: brand marks change and new models ship constantly,
  // so a live source must always win. A frozen copy is only correct when no live
  // tier answered.
  assert.equal(offline.name, "core-pack.brands");
  assert.notEqual(offline.network, true);
  // Every tier ahead of it must be a network tier, or "offline floor" is a lie.
  for (const tier of tiers.slice(1, -1)) {
    assert.equal(tier.network, true, `${tier.name} should be a live source`);
  }
  assert.equal(tiers[0].name, "creator-library");
  assert.notEqual(tiers[0].network, true);
  // One mark per brand is frozen (color where upstream has it, mono otherwise),
  // so an explicit --variant it cannot serve skips the tier rather than being
  // silently substituted.
  assert.deepEqual(offline.variants, ["mono", "color"]);
});

test("logo survives --local-only through exact private choice or offline floor", async () => {
  // Before the offline floor existed, every logo tier was network-only, so
  // --local-only failed 100% of logo requests.
  const local = getProviders("logo").filter((p) => !p.network);
  assert.equal(local.length, 2);
  assert.deepEqual(local.map((provider) => provider.name), [
    "creator-library",
    "core-pack.brands",
  ]);
});

test("all resolve types remain available", () => {
  for (const type of [
    "bgm",
    "sfx",
    "image",
    "icon",
    "logo",
    "voice",
    "video",
    "brand",
    "grade",
    "lut",
  ]) {
    assert.ok(listTypes().includes(type), `missing ${type}`);
    assert.ok(getProviders(type).length > 0, `no provider for ${type}`);
  }
});

test("provider override accepts vidmuse prefix", () => {
  assert.equal(providerMatches("image", "vidmuse"), true);
  assert.equal(providerMatches("image", "heygen"), false);
  assert.equal(providerMatches("image", "mflux"), false);
});

test("--local-only skips VidMuse and can reach deterministic fallback", async () => {
  let remoteRan = false;
  const providers = [
    {
      name: "vidmuse.model",
      network: true,
      generate: async () => {
        remoteRan = true;
        return { source: "remote" };
      },
    },
    { name: "bundled", generate: async () => ({ source: "local" }) },
  ];
  const result = await runProviders(providers, "generate", "whoosh", { localOnly: true });
  assert.deepEqual(result, { source: "local" });
  assert.equal(remoteRan, false);
});

test("an explicit variant only runs providers that can attest that variant", async () => {
  let untypedRan = false;
  const providers = [
    {
      name: "variant-aware",
      variants: ["mono"],
      search: async () => null,
    },
    {
      name: "unknown-variant",
      search: async () => {
        untypedRan = true;
        return { source: "wrong" };
      },
    },
  ];
  const result = await runProviders(providers, "search", "OpenAI color logo", {
    variant: "color",
  });
  assert.equal(result, null);
  assert.equal(untypedRan, false);
});
