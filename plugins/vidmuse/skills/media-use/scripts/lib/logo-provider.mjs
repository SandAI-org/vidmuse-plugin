// Official brand marks — the `logo` type's provider tiers, tried in registry
// order. Every tier was verified against a 54-brand stress test (2026-07,
// 100% cascade hit). Hit counts below are a snapshot of that run — they
// drift as the alias/org maps grow; re-run the stress test to refresh them.
//
//   1. Lobe Icons    — AI / LLM model, provider, and application marks with
//                      explicit mono / color / wordmark variants. Both the
//                      catalog and SVG package are pinned for deterministic
//                      resolution.
//   2. svgl          — official full-color vector SVGs (+ wordmark variants);
//                      40/54 first-hits. Search is substring-based, so
//                      entities go through alias normalization first
//                      ("nextjs" never matches "Next.js" raw).
//   3. simple-icons  — monochrome official glyphs; caught the long tail the
//                      others miss (nike, visa, toyota, wechat, bytedance).
//                      Pinned CDN build for determinism.
//   4. github avatar — the org's official logo for brands with a GitHub
//                      presence. Known orgs only: guessing a login risks a
//                      same-named personal account.
//   5. domain favicon — small-raster last resort (DuckDuckGo ip3). Responses
//                      under ~500B are DDG's globe placeholder, not a hit.
//
// HeyGen asset search is deliberately absent: for brand queries it returns
// generic look-alike icons (0/3 in testing) — worse than a miss. A total miss
// falls through to resolve's normal failure path (`no provider could resolve
// logo`, exit 1).

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SVGL_API = "https://api.svgl.app";
const SIMPLE_ICONS_CDN = "https://cdn.jsdelivr.net/npm/simple-icons@16.25.0/icons";
const FAVICON_MIN_BYTES = 500;
export const LOBE_ICONS_VERSION = "5.15.0";
export const LOBE_STATIC_SVG_VERSION = "1.94.0";
const LOBE_TOC_URL = `https://unpkg.com/@lobehub/icons@${LOBE_ICONS_VERSION}/es/toc.json`;
const LOBE_SVG_CDN = `https://unpkg.com/@lobehub/icons-static-svg@${LOBE_STATIC_SVG_VERSION}/icons`;

const LOBE_VARIANTS = {
  mono: { suffix: "", flag: null },
  color: { suffix: "-color", flag: "hasColor" },
  text: { suffix: "-text", flag: "hasText" },
  "text-cn": { suffix: "-text-cn", flag: "hasTextCn" },
  "text-color": { suffix: "-text-color", flag: "hasTextColor" },
  brand: { suffix: "-brand", flag: "hasBrand" },
  "brand-color": { suffix: "-brand-color", flag: "hasBrandColor" },
};
export const LOBE_VARIANT_NAMES = Object.freeze(Object.keys(LOBE_VARIANTS));

export class LogoResolutionConstraintError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "LogoResolutionConstraintError";
    this.code = code;
    this.details = details;
    this.terminal = true;
  }
}

// svgl search queries per entity, tried in order after the raw entity.
const SVGL_ALIASES = {
  nextjs: ["next.js", "next"],
  aws: ["amazon web services"],
  huggingface: ["hugging face"],
  cocacola: ["coca-cola"],
  mcdonalds: ["mcdonald's"],
};

// simple-icons slugs that differ from the normalized entity.
const SIMPLE_ICON_SLUGS = {
  nextjs: "nextdotjs",
  aws: "amazonwebservices",
};

// Known GitHub orgs. Only mapped entities resolve at this tier — a brand name
// is NOT a GitHub login, and guessing hits same-named personal accounts.
const GITHUB_ORGS = {
  slack: "slackhq",
  meta: "facebook",
  google: "google",
  microsoft: "microsoft",
  aws: "aws",
  vercel: "vercel",
  nextjs: "vercel",
  alibaba: "alibaba",
  heygen: "heygen-com",
};

// Favicon domains that aren't `<entity>.com`.
const FAVICON_DOMAINS = {
  cocacola: "coca-cola.com",
  aws: "aws.amazon.com",
  nextjs: "nextjs.org",
};

// Strip case, spacing, and punctuation so "Next.js" ≡ "nextjs", while KEEPING
// every letter and digit in any script.
//
// A previous `[^a-z0-9]` version erased non-Latin text entirely, so every
// Chinese name normalized to "" — and two empty strings compare equal, which
// made any 中文 brand query match whichever brand was scanned first. Silent
// wrong-identity is the worst failure mode for a logo, so identity comparison
// must never discard the characters that carry the identity.
const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");

const identityKey = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");

export function resolvedLogoEntity(record) {
  const provenance = record?.provenance || {};
  return (
    provenance.resolved_entity ||
    (provenance.provider === "lobehub.icons" ? provenance.slug : null) ||
    record?.entity ||
    null
  );
}

export function logoIdentityMatches(record, requestedEntity) {
  const resolved = identityKey(resolvedLogoEntity(record));
  return Boolean(resolved) && resolved === identityKey(requestedEntity);
}

/** The brand entity for a query: --entity wins; else the intent minus filler. */
export function entityFrom(intent, entity) {
  if (entity) return entity.toLowerCase().trim();
  return String(intent)
    .toLowerCase()
    .replace(/\b(logo|logos|icon|brand|official|mark)\b/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

/** Exact match after stripping case/spacing/punctuation — "Next.js" ≡ "nextjs". */
export function titleMatches(title, entity) {
  const a = norm(title);
  const b = norm(entity);
  // Two strings that normalize to nothing are not the same brand. Guarding here
  // as well as in norm() means a future normalization change cannot resurrect
  // "everything matches everything" for punctuation-only or emoji-only input.
  return a.length > 0 && a === b;
}

function lobePrimaryFields(entry) {
  return [entry?.id, entry?.title, entry?.docsUrl].filter(Boolean);
}

/**
 * Exact normalized identity match only.
 *
 * Lobe's `fullTitle` parentheticals describe several different relationships:
 * product → company (`Codex (OpenAI)`), provider → product (`OpenAI
 * (ChatGPT)`), and occasionally a display-name clarification. They are not
 * safe synonyms. Treating every parenthetical as an alias silently swaps a
 * product/model identity for its company mark.
 */
export function findLobeEntry(entries, entity) {
  return (
    entries.find((entry) =>
    lobePrimaryFields(entry).some((value) => titleMatches(value, entity)),
    ) || null
  );
}

export function availableLobeVariants(entry) {
  if (!entry?.id) return [];
  return Object.entries(LOBE_VARIANTS)
    .filter(([, spec]) => !spec.flag || entry?.param?.[spec.flag])
    .map(([variant]) => variant);
}

export function chooseLobeVariant(entry, requested = null) {
  const variant = requested || (entry?.param?.hasColor ? "color" : "mono");
  const spec = LOBE_VARIANTS[variant];
  if (!spec) return null;
  if (spec.flag && !entry?.param?.[spec.flag]) return null;
  return variant;
}

export function lobeIconUrl(entry, variant) {
  const spec = LOBE_VARIANTS[variant];
  if (!entry?.id || !spec) return null;
  return `${LOBE_SVG_CDN}/${norm(entry.id)}${spec.suffix}.svg`;
}

export function svglQueriesFor(entity) {
  return [entity, ...(SVGL_ALIASES[norm(entity)] || [])];
}

export function simpleIconSlugsFor(entity) {
  const slugs = [norm(entity)];
  const alias = SIMPLE_ICON_SLUGS[norm(entity)];
  if (alias) slugs.push(alias);
  return slugs;
}

export function githubOrgFor(entity) {
  return GITHUB_ORGS[norm(entity)] || null;
}

export function faviconDomainFor(entity) {
  return FAVICON_DOMAINS[norm(entity)] || `${norm(entity)}.com`;
}

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return null;
  return res.json();
}

async function urlExists(url) {
  try {
    const head = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(10_000),
    });
    if (head.ok) return true;
    if (![403, 405, 501].includes(head.status)) return false;
  } catch {
    // Some CDNs/proxies reject or drop HEAD while serving GET normally.
  }

  try {
    const get = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      signal: AbortSignal.timeout(10_000),
    });
    const ok = get.ok;
    await get.body?.cancel();
    return ok;
  } catch {
    return false;
  }
}

export async function lobeIconsSearch(intent, ctx = {}) {
  const entity = entityFrom(intent, ctx.entity);
  let entries;
  try {
    entries = await fetchJson(LOBE_TOC_URL);
  } catch {
    return null;
  }
  if (!Array.isArray(entries)) return null;

  const hit = findLobeEntry(entries, entity);
  if (!hit) return null;
  const variant = chooseLobeVariant(hit, ctx.variant);
  if (!variant) {
    const available = availableLobeVariants(hit);
    throw new LogoResolutionConstraintError(
      "logo_variant_unavailable",
      `logo variant "${ctx.variant}" is unavailable for ${hit.id}`,
      {
        requested_entity: entity,
        resolved_entity: hit.id,
        requested_variant: ctx.variant,
        available_variants: available,
      },
    );
  }
  const url = lobeIconUrl(hit, variant);
  try {
    if (!url || !(await urlExists(url))) return null;
  } catch {
    return null;
  }

  return {
    url,
    ext: ".svg",
    source: "search",
    metadata: {
      description: `${hit.fullTitle || hit.title || hit.id} logo (${variant}, Lobe Icons)`,
      provider: "lobehub.icons",
      license_state: "verified-commercial",
      license: {
        id: "MIT",
        notice_required: true,
        commercial_use: true,
        source_url: "https://github.com/lobehub/lobe-icons/blob/master/LICENSE",
        copyright: "Copyright (c) 2023 LobeHub",
        trademark_note: "Third-party identification mark; trademark rights remain with owner.",
      },
      provenance: {
        entity,
        requested_entity: entity,
        resolved_entity: hit.id,
        resolved_group: hit.group || null,
        slug: norm(hit.id),
        variant,
        group: hit.group,
        brand_color: hit.color || null,
        official_url: hit.desc || null,
        catalog_package: `@lobehub/icons@${LOBE_ICONS_VERSION}`,
        asset_package: `@lobehub/icons-static-svg@${LOBE_STATIC_SVG_VERSION}`,
        license: "MIT",
        license_url: "https://github.com/lobehub/lobe-icons/blob/master/LICENSE",
        copyright: "Copyright (c) 2023 LobeHub",
        url,
      },
    },
  };
}

export async function svglSearch(intent, ctx = {}) {
  const entity = entityFrom(intent, ctx.entity);
  for (const q of svglQueriesFor(entity)) {
    let items;
    try {
      items = await fetchJson(`${SVGL_API}?search=${encodeURIComponent(q)}`);
    } catch {
      return null; // network down — let the next tier try its own host
    }
    if (!Array.isArray(items)) continue;
    const hit = items.find((it) => titleMatches(it.title, q) || titleMatches(it.title, entity));
    if (!hit) continue;
    const route = typeof hit.route === "string" ? hit.route : hit.route?.light;
    if (!route) continue;
    return {
      url: route,
      ext: ".svg",
      source: "search",
      metadata: {
        description: `${hit.title} logo (official mark)`,
        provider: "svgl",
        provenance: {
          entity,
          requested_entity: entity,
          resolved_entity: hit.title,
          query: q,
          route,
          wordmark: Boolean(hit.wordmark),
        },
      },
    };
  }
  return null;
}

export async function simpleIconsSearch(intent, ctx = {}) {
  const entity = entityFrom(intent, ctx.entity);
  for (const slug of simpleIconSlugsFor(entity)) {
    const url = `${SIMPLE_ICONS_CDN}/${slug}.svg`;
    let ok;
    try {
      ok = await urlExists(url);
    } catch {
      return null;
    }
    if (!ok) continue;
    return {
      url,
      ext: ".svg",
      source: "search",
      metadata: {
        description: `${entity} logo (official monochrome glyph)`,
        provider: "simple-icons",
        provenance: {
          entity,
          requested_entity: entity,
          resolved_entity: entity,
          slug,
          pinned: "simple-icons@16.25.0",
        },
      },
    };
  }
  return null;
}

export async function githubAvatarSearch(intent, ctx = {}) {
  const entity = entityFrom(intent, ctx.entity);
  const org = githubOrgFor(entity);
  if (!org) return null;
  const url = `https://github.com/${org}.png?size=460`;
  try {
    if (!(await urlExists(url))) return null;
  } catch {
    return null;
  }
  return {
    url,
    ext: ".png",
    source: "search",
    metadata: {
      description: `${entity} logo (GitHub org avatar)`,
      provider: "github.avatar",
      provenance: {
        entity,
        requested_entity: entity,
        resolved_entity: entity,
        org,
      },
    },
  };
}

export async function faviconSearch(intent, ctx = {}) {
  const entity = entityFrom(intent, ctx.entity);
  const domain = faviconDomainFor(entity);
  const url = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  let body;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    body = Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
  if (body.byteLength < FAVICON_MIN_BYTES) return null; // DDG placeholder, not a logo
  // Hand the verified bytes over as a local file: the freeze step copies it
  // instead of re-downloading, so the size check is authoritative over what
  // gets frozen and the favicon tier costs one network round-trip, not two.
  const bytes = body.byteLength;
  const tmp = join(mkdtempSync(join(tmpdir(), "media-use-logo-")), `${domain}.ico`);
  writeFileSync(tmp, body);
  return {
    localPath: tmp,
    ext: ".ico",
    source: "search",
    metadata: {
      description: `${entity} favicon (small raster — chip-size use only)`,
      provider: "favicon.ddg",
      provenance: {
        entity,
        requested_entity: entity,
        resolved_entity: entity,
        domain,
        bytes,
        low_res: true,
      },
    },
  };
}
