// Provider registry for the VidMuse plugin.
//
// AI generation has one execution substrate: the VidMuse CLI. Model names are
// discovered from the live `vidmuse model list` catalog and executed through
// `vidmuse model run`; media-use never shells to provider-specific CLIs or
// installs local AI models. Deterministic/non-generative utilities remain
// local: bundled SFX, official logo resolution, design tokens, and LUTs.

import { bundledSfxProvider } from "./bundled-sfx-provider.mjs";
import { brandProvider } from "./brand-provider.mjs";
import { corePackProvider } from "./core-pack-provider.mjs";
import { offlineLogoProvider } from "./offline-logo-provider.mjs";
import {
  lobeIconsSearch,
  svglSearch,
  simpleIconsSearch,
  githubAvatarSearch,
  faviconSearch,
  LOBE_VARIANT_NAMES,
} from "./logo-provider.mjs";
import { generateWithVidMuse } from "./vidmuse-provider.mjs";

const A = (name, caps) => ({ name, ...caps }); // local, free
const N = (name, caps) => ({ name, network: true, ...caps }); // remote, free
const P = (name, caps) => ({ name, network: true, paid: true, ...caps }); // remote, paid

const V = (type) =>
  P("vidmuse.model", {
    generate(intent, ctx) {
      return generateWithVidMuse(type, intent, { ...ctx, type });
    },
  });

// Core Pack is preinstalled, licensed, and offline. library-layout.md's lookup
// order puts it ahead of any generative provider, so it is declared first for
// every type it can serve.
const CP = A("core-pack", { search: corePackProvider.search });

// Variants the offline logo floor can attest. It freezes ONE mark per brand —
// color where upstream has it, mono otherwise — so only these two are possible.
// Declared so an explicit --variant it cannot serve (a wordmark, a lockup) skips
// this tier instead of being silently substituted (runProviders enforces this).
const OFFLINE_LOGO_VARIANTS = Object.freeze(["mono", "color"]);

const REGISTRY = {
  bgm: [V("bgm")],
  sfx: [V("sfx"), A("bundled.sfx", { search: bundledSfxProvider.search })],
  image: [V("image")],
  icon: [CP, V("icon")],
  // Static asset classes served from the preinstalled library. Fonts, shapes,
  // Lottie, and palettes have no generation route on purpose: a typeface or a
  // pre-baked animation timeline is not something a model should invent on
  // demand, and a wrong one is worse than a miss.
  font: [CP],
  shape: [CP],
  lottie: [CP],
  palette: [CP],
  // Textures and overlays are film-specific surface treatment — the palette,
  // grain, and era have to match one frame — so a shipped set would be both
  // heavy and usually wrong. Core Pack still runs first so an adopted project
  // file or a Creator Library set wins over paying to generate.
  texture: [CP, V("image")],
  overlay: [CP, V("image")],
  logo: [
    // Logos are evidence, not illustration: resolve official marks and never
    // send them to a generative model.
    N("lobehub.icons", { search: lobeIconsSearch, variants: LOBE_VARIANT_NAMES }),
    N("svgl", { search: svglSearch }),
    N("simple-icons", { search: simpleIconsSearch }),
    N("github.avatar", { search: githubAvatarSearch }),
    N("favicon.ddg", { search: faviconSearch }),
    // Offline floor, deliberately LAST. Brand marks change and new models ship
    // constantly, so a live source must always win; a frozen copy is only
    // correct when there is no live answer (offline, or every tier above
    // missed). Being local, it is also the only logo tier that survives
    // --local-only, which otherwise fails every logo request.
    A("core-pack.brands", {
      search: offlineLogoProvider.search,
      variants: OFFLINE_LOGO_VARIANTS,
    }),
  ],
  voice: [V("voice")],
  video: [V("video")],
  brand: [
    // Local design spec — reads frame.md / design.md tokens. Project-specific
    // brand tokens win over the preinstalled VidMuse marks.
    A("design_spec", { search: brandProvider.search }),
    CP,
  ],
  grade: [
    // Local deterministic cascade handled by resolve.mjs so grade records can
    // carry an inline block as well as an optional frozen .cube file.
    A("color_grade.local", { search: async () => null, generate: async () => null }),
  ],
  lut: [
    // Lower-level local LUT generation/freezing path handled by resolve.mjs.
    A("cube_lut.local", { search: async () => null, generate: async () => null }),
  ],
};

function listFor(type) {
  const list = REGISTRY[type];
  if (!list) throw new Error(`unknown media type: ${type}`);
  return list;
}

/** Ordered providers for a type. */
export function getProviders(type) {
  return listFor(type);
}

/** All declared media types. */
export function listTypes() {
  return Object.keys(REGISTRY);
}

/** Provider names available for a type, in cascade order (for --provider validation). */
export function providerNamesFor(type) {
  return listFor(type).map((p) => p.name);
}

/**
 * Does an override token (full name like "vidmuse.model" or a prefix like
 * "vidmuse") match any provider declared for the type? Same match rule as
 * runProviders, so validation and dispatch never disagree.
 */
export function providerMatches(type, want) {
  return providerNamesFor(type).some((n) => n === want || n.startsWith(`${want}.`));
}

/**
 * Back-compat shim for the v1 single-provider API. Returns the first declared
 * provider for the type (tagged with `type`); throws for an unknown type.
 * Kept for v1 callers only — new code should use getProviders/runCapability.
 */
export function getProvider(type) {
  const first = listFor(type)[0] || {};
  return { ...first, type };
}

/**
 * Run a capability across an explicit ordered provider list. Tries each in
 * order, returns the first non-null result, skips providers that don't expose
 * the capability. Pure over its input — the unit-testable core of the cascade.
 *
 * Offline guard: a `network` provider is skipped when `ctx.localOnly` is set —
 * unconditionally, even under a `ctx.provider` override. --local-only is a hard
 * safety flag: it must never make a network call. Forcing a network provider
 * while offline yields a clean miss (the caller explains the conflict), never a
 * silent network request.
 * Provider override: `ctx.provider` (a full name like "vidmuse.model" or the
 * prefix "vidmuse") pins resolution to matching providers only.
 */
export async function runProviders(providers, capability, intent, ctx) {
  const want = ctx?.provider;
  for (const p of providers) {
    if (want && p.name !== want && !p.name.startsWith(`${want}.`)) continue;
    if (p.network && ctx?.localOnly) continue; // --local-only wins, even over --provider
    if (ctx?.variant && (!Array.isArray(p.variants) || !p.variants.includes(ctx.variant))) {
      continue;
    }
    const fn = p[capability];
    if (typeof fn !== "function") continue;
    const res = await fn(intent, ctx);
    if (res) return res;
  }
  return null;
}

/** Run a capability over the providers for a type. */
export async function runCapability(type, capability, intent, ctx) {
  return runProviders(getProviders(type), capability, intent, ctx);
}
