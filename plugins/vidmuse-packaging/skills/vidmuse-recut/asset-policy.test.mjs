import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const recut = readFileSync(new URL("./SKILL.md", import.meta.url), "utf8");
const assets = readFileSync(new URL("../vidmuse-assets/SKILL.md", import.meta.url), "utf8");
const create = readFileSync(new URL("../vidmuse-create/SKILL.md", import.meta.url), "utf8");
const media = readFileSync(new URL("../vidmuse-media/SKILL.md", import.meta.url), "utf8");
const router = readFileSync(new URL("../vidmuse/SKILL.md", import.meta.url), "utf8");

test("recut runs a blocking asset opportunity pass before design preview", () => {
  assert.match(recut, /load `vidmuse-assets` before writing `FRAME\.md`/);
  assert.match(recut, /Search the web when network tools are available/);
  assert.match(recut, /the asset pass fails/);
  assert.match(recut, /Do not silently replace a searchable real-world object with a home-drawn SVG board/);
});

test("remote assets are licensed, localized, and recorded without hotlinks", () => {
  assert.match(assets, /Treat search results as discovery only/);
  assert.match(assets, /author\/owner and license or allowed-use terms/);
  assert.match(recut, /Localize the result into `design-preview\/assets\/`/);
  assert.match(recut, /Rendering must never depend on a remote URL/);
  assert.match(recut, /`Asset ledger` section of `FRAME\.md`/);
});

test("host-native retrieval is preferred and Capture remains the fallback", () => {
  for (const skill of [recut, assets, create, router]) {
    const nativeIndex = skill.indexOf("native web search");
    const captureIndex = skill.indexOf("HyperFrames Capture", nativeIndex);
    assert.ok(nativeIndex >= 0, "expected native Agent retrieval guidance");
    assert.ok(captureIndex > nativeIndex, "expected Capture after native Agent retrieval");
  }
});

test("VidMuse does not duplicate generic network transport in media", () => {
  assert.doesNotMatch(media, /localize-remote-image/);
  assert.match(router, /Do not recreate generic network transport in `vidmuse-media`/);
});
