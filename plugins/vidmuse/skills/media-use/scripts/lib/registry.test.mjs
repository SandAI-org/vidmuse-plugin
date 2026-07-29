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
    assert.deepEqual(providerNamesFor(type), ["vidmuse.model"], type);
    const provider = getProviders(type)[0];
    assert.equal(provider.network, true);
    assert.equal(provider.paid, true);
    assert.equal(typeof provider.generate, "function");
  }
});

test("SFX uses VidMuse when available and bundled deterministic fallback", () => {
  assert.deepEqual(providerNamesFor("sfx"), ["vidmuse.model", "bundled.sfx"]);
  assert.equal(typeof getProviders("sfx")[1].search, "function");
});

test("official logos never use a generative provider", () => {
  assert.deepEqual(providerNamesFor("logo"), [
    "lobehub.icons",
    "svgl",
    "simple-icons",
    "github.avatar",
    "favicon.ddg",
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
