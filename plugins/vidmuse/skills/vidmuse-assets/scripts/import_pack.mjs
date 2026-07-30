#!/usr/bin/env node

// Import a third-party asset set into a Core Pack pack.
//
// Separate from core_pack.mjs on purpose: importing is a one-time, network-and-
// npm-touching operation with per-source quirks (where the files live, where the
// upstream tag metadata lives, what needs stripping). core_pack.mjs stays a
// pure local ledger/index/query tool with no network and no npm.
//
// What this does, in order:
//   1. `npm pack` the pinned version into a temp dir — never a floating range,
//      so the ledger's upstream pin is real.
//   2. Verify the license is one we may redistribute, before copying anything.
//   3. Copy + minify the assets.
//   4. Harvest the UPSTREAM tag metadata into tags.json. This is the highest
//      quality tag source available and it is free; re-deriving it with a model
//      would be slower, worse, and expensive.
//   5. Hand off to core_pack.mjs --ingest for hashing/probing, so there is one
//      implementation of the ledger format.

import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve as pathResolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const HERE = dirname(fileURLToPath(import.meta.url));
const CORE_PACK = pathResolve(HERE, "../assets/core-pack");

// Licenses that permit redistribution inside this plugin plus commercial video
// output. An importer refuses anything else rather than leaving the judgement
// to whoever reads the diff.
const ALLOWED_LICENSES = new Set(["ISC", "MIT", "CC0-1.0", "Apache-2.0", "OFL-1.1", "BSD-3-Clause"]);

export function minifySvg(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\sclass="[^"]*"/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .replace(/\s+\/>/g, "/>")
    .replace(/\s+>/g, ">")
    .trim();
}

function npmPack(spec, cwd) {
  const out = execFileSync("npm", ["pack", spec, "--silent"], {
    cwd,
    encoding: "utf8",
    timeout: 180000,
  });
  const tarball = out.trim().split("\n").pop().trim();
  execFileSync("tar", ["-xzf", tarball], { cwd, timeout: 180000 });
  return join(cwd, "package");
}

/**
 * GB2312 level-1: 3755 hanzi that cover ~99.7% of running modern Chinese, plus
 * Latin, digits, and CJK punctuation.
 *
 * Full Noto SC is ~1.1MB per weight because it carries ~7900 glyphs including
 * level-2 and rare/historic forms. Subsetting is standard practice for CJK web
 * fonts, but it is a real tradeoff — an uncovered character renders as a tofu
 * box, not a fallback glyph — so the covered range is recorded in the pack
 * ledger rather than left implicit.
 */
export function commonChineseChars() {
  const chars = new Set();
  for (let hi = 0xb0; hi < 0xd8; hi += 1) {
    for (let lo = 0xa1; lo < 0xff; lo += 1) {
      try {
        const decoded = new TextDecoder("gb2312", { fatal: true }).decode(
          new Uint8Array([hi, lo]),
        );
        if (decoded && decoded !== "�") chars.add(decoded);
      } catch {
        // unassigned code point in the table
      }
    }
  }
  for (let code = 0x20; code < 0x7f; code += 1) chars.add(String.fromCharCode(code));
  for (const ch of "　、。〈〉《》「」『』【】〔〕！？，．：；·—…“”‘’（）％＋－×÷＝￥°①②③④⑤⑥⑦⑧⑨⑩") {
    chars.add(ch);
  }
  return [...chars].sort().join("");
}

/** Subset a font with fontTools, which must be importable by python3. */
function subsetFont(src, dest, text) {
  try {
    execFileSync(
      "python3",
      [
        "-m",
        "fontTools.subset",
        src,
        `--text=${text}`,
        "--flavor=woff2",
        "--layout-features=*",
        `--output-file=${dest}`,
      ],
      { stdio: ["ignore", "ignore", "pipe"], timeout: 180000 },
    );
  } catch (error) {
    const detail = error.stderr ? String(error.stderr).trim().split("\n").pop() : error.message;
    throw new Error(
      `font subsetting needs fontTools (pip install fonttools brotli): ${detail}`,
    );
  }
}

/** Sources this importer knows how to read. */
export const SOURCES = {
  lucide: {
    npm: "lucide-static",
    type: "icon",
    license: { spdx: "ISC", file: "LICENSE" },
    iconDir: "icons",
    ext: ".svg",
    subdir: "icons",
    url: "https://lucide.dev",
    description:
      "Lucide icon set — consistent 24x24 stroke marks. currentColor stroke, so CSS tints every icon without editing the file.",
    tags: ["ui", "interface", "stroke", "line"],
    // Upstream ships per-icon synonyms; this is exactly the metadata that makes
    // keyword discovery work, and it costs nothing to reuse.
    harvestTags(pkgDir) {
      const path = join(pkgDir, "tags.json");
      if (!existsSync(path)) return {};
      return JSON.parse(readFileSync(path, "utf8"));
    },
  },

  // Curated offline floor for the logo cascade.
  //
  // Lobe Icons is already the FIRST tier of the live logo cascade
  // (media-use/scripts/lib/logo-provider.mjs). This pack is not a replacement
  // for that: it is a small, deliberately conservative offline fallback that
  // sits at the END of the cascade, so a live source always wins and a frozen
  // copy is only reached when the network is unavailable or every online tier
  // misses.
  //
  // Only settled brands are admitted. A mark that may change this quarter — a
  // brand-new model or startup — stays live-only, because a stale local hit
  // would shadow a correct online one. That risk is the whole reason `logo` is
  // otherwise excluded from the Core Pack.
  //
  // ONE mark per brand. An offline floor exists to answer "show this company",
  // not to offer a styling menu — variant choice is what the live cascade is
  // for, and three files per brand made the set needlessly granular.
  //
  // Color is preferred, with mono as the fallback: 32 of the curated brands
  // (OpenAI, Anthropic, Apple, Cursor, Midjourney…) are monochrome by design and
  // ship no color variant upstream, so a literal color-only rule would silently
  // drop them.
  "lobe-brands": {
    npm: "@lobehub/icons-static-svg",
    catalogNpm: "@lobehub/icons",
    type: "offline-logo",
    license: { spdx: "MIT", file: "LICENSE" },
    iconDir: "icons",
    ext: ".svg",
    subdir: "logos",
    url: "https://github.com/lobehub/lobe-icons",
    description:
      "Curated offline brand marks for well-known international and Chinese companies, AI labs, and developer tools. Offline fallback only — the live Lobe/SVGL/Simple-Icons cascade resolves first so a mark is never served stale when the network is available.",
    tags: ["brand", "logo", "official", "品牌", "标识"],
    // Ordered preference — the first variant a brand actually has is the one
    // frozen, and the rest are skipped.
    variants: [
      { suffix: "-color", flag: "hasColor", name: "color" },
      { suffix: "", flag: null, name: "mono" },
    ],
    onePerBrand: true,
    curated: {
      "ai-labs": ["OpenAI", "Anthropic", "Claude", "DeepMind", "Gemini", "Meta", "MetaAI", "Mistral", "Cohere", "XAI", "Grok", "HuggingFace", "Stability"],
      "big-tech": ["Google", "Microsoft", "Apple", "Nvidia", "Adobe", "Aws", "Azure", "GoogleCloud", "IBM", "Figma", "Github", "Notion", "Vercel", "Cloudflare", "Snowflake", "Yandex", "LG"],
      "cn-majors": ["Alibaba", "AlibabaCloud", "Baidu", "BaiduCloud", "ByteDance", "Tencent", "TencentCloud", "Huawei", "HuaweiCloud", "AntGroup", "Bilibili", "Volcengine", "Qiniu", "ModelScope"],
      "cn-models": ["DeepSeek", "Qwen", "Kimi", "Moonshot", "Doubao", "Hunyuan", "Zhipu", "ChatGLM", "Yi", "ZeroOne", "Minimax", "Stepfun", "Baichuan", "InternLM", "SenseNova", "Wenxin", "Spark", "Yuanbao", "LongCat", "XiaomiMiMo", "Skywork", "Jimeng", "Kling", "CapCut"],
      "dev-tools": ["Cursor", "Copilot", "GithubCopilot", "Codex", "ClaudeCode", "Ollama", "LangChain", "LlamaIndex", "Replicate", "Replit", "Windsurf", "Trae", "Dify", "ComfyUI", "LmStudio", "OpenRouter", "N8n", "Zapier", "Gradio", "Colab"],
      "media-ai": ["Midjourney", "Dalle", "Sora", "Runway", "Luma", "Pika", "ElevenLabs", "Suno", "Udio", "Flux", "Ideogram", "Recraft", "Krea", "Vidu", "Hailuo", "Viggle", "Kolors", "NotebookLM", "Perplexity", "Poe", "Groq", "Together", "Fireworks", "Fal", "DeepL"],
    },
  },

  "noto-cjk-sc": {
    // Two npm packages in one pack: sans and serif are one editorial decision
    // (a Chinese type system needs both voices) and share one OFL receipt.
    multi: [
      { npm: "@fontsource/noto-sans-sc", family: "NotoSansSC", weights: [400, 700, 900] },
      { npm: "@fontsource/noto-serif-sc", family: "NotoSerifSC", weights: [400, 700] },
    ],
    type: "font",
    license: { spdx: "OFL-1.1", file: "LICENSE" },
    subdir: "fonts",
    ext: ".woff2",
    url: "https://fonts.google.com/noto",
    subset: "common-chinese",
    description:
      "Simplified Chinese type system — Noto Sans SC and Noto Serif SC. HyperFrames pre-bundles Noto Sans JP but no Chinese face, and a locally-installed-only font fails in distributed/cloud renders, so Chinese compositions need an embedded family.",
    tags: ["chinese", "simplified", "cjk", "中文", "简体", "字体"],
  },
};

export function importPack(name, { root = CORE_PACK, version, dryRun = false } = {}) {
  const source = SOURCES[name];
  if (!source) {
    throw new Error(`unknown source ${name} (known: ${Object.keys(SOURCES).join(", ")})`);
  }
  if (!version) throw new Error(`--version is required: the ledger must pin an exact upstream`);
  if (!ALLOWED_LICENSES.has(source.license.spdx)) {
    throw new Error(`${name}: license ${source.license.spdx} is not redistributable here`);
  }

  const work = mkdtempSync(join(tmpdir(), `import-${name}-`));
  try {
    if (source.multi) return importMulti(name, source, { root, version, dryRun, work });
    if (source.curated) return importCurated(name, source, { root, version, dryRun, work });
    const pkgDir = npmPack(`${source.npm}@${version}`, work);
    const meta = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
    if (meta.version !== version) {
      throw new Error(`${name}: npm returned ${meta.version}, expected ${version}`);
    }
    // Trust the package's own license field over our table, and fail if they
    // disagree — an upstream relicense must not slip through silently.
    if (meta.license && meta.license !== source.license.spdx) {
      throw new Error(
        `${name}: upstream declares license ${meta.license}, expected ${source.license.spdx}. Re-verify before importing.`,
      );
    }

    const srcDir = join(pkgDir, source.iconDir);
    if (!existsSync(srcDir)) throw new Error(`${name}: expected assets at ${source.iconDir}`);
    const files = readdirSync(srcDir)
      .filter((file) => file.toLowerCase().endsWith(source.ext))
      .sort();
    if (files.length === 0) throw new Error(`${name}: no ${source.ext} files found`);

    const upstreamTags = source.harvestTags ? source.harvestTags(pkgDir) : {};
    if (dryRun) {
      return {
        name,
        version,
        files: files.length,
        tagged: Object.keys(upstreamTags).length,
        dryRun: true,
      };
    }

    const packDir = join(root, "packs", name);
    // A re-import must not leave orphans from a previous version.
    rmSync(join(packDir, source.subdir), { recursive: true, force: true });
    mkdirSync(join(packDir, source.subdir), { recursive: true });

    let bytes = 0;
    for (const file of files) {
      const body =
        source.ext === ".svg"
          ? minifySvg(readFileSync(join(srcDir, file), "utf8"))
          : readFileSync(join(srcDir, file));
      writeFileSync(join(packDir, source.subdir, file), body);
      bytes += typeof body === "string" ? Buffer.byteLength(body) : body.length;
    }

    const licenseSrc = join(pkgDir, source.license.file);
    if (!existsSync(licenseSrc)) throw new Error(`${name}: upstream has no ${source.license.file}`);
    cpSync(licenseSrc, join(packDir, "LICENSE.txt"));

    writeFileSync(
      join(packDir, "pack.json"),
      `${JSON.stringify(
        {
          schema: "vidmuse.core-pack.pack.v1",
          id: name,
          type: source.type,
          title: meta.name,
          description: source.description,
          upstream: {
            npm: source.npm,
            version,
            url: source.url,
            imported_by: "scripts/import_pack.mjs",
          },
          license: {
            spdx: source.license.spdx,
            receipt: "LICENSE.txt",
            redistributable: true,
            commercial_output: true,
            attribution_required: false,
            copyright: readCopyright(join(packDir, "LICENSE.txt")),
          },
          tags: source.tags || [],
          files: [],
        },
        null,
        2,
      )}\n`,
    );

    // tags.json keys must be pack-relative asset paths, matching what
    // core_pack.mjs --reindex looks up.
    const tagFiles = {};
    let tagged = 0;
    for (const file of files) {
      const stem = basename(file, source.ext);
      const synonyms = upstreamTags[stem];
      if (!Array.isArray(synonyms) || synonyms.length === 0) continue;
      tagFiles[`${source.subdir}/${file}`] = { tags: synonyms };
      tagged += 1;
    }
    writeFileSync(
      join(packDir, "tags.json"),
      `${JSON.stringify(
        {
          schema: "vidmuse.core-pack.tags.v1",
          notes: `Upstream ${source.npm}@${version} synonyms, harvested at import. Regenerate by re-running import_pack.mjs; hand-added entries here are lost on re-import, so put local additions in a separate reviewed commit.`,
          files: tagFiles,
        },
        null,
        2,
      )}\n`,
    );

    return { name, version, files: files.length, tagged, bytes, packDir };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

/**
 * Import several npm packages into one pack.
 *
 * Used when a single editorial decision spans multiple upstream packages (a
 * Chinese type system needs both a sans and a serif voice) and they share one
 * license receipt. Every package is pinned to the same version string.
 */
function importMulti(name, source, { root, version, dryRun, work }) {
  const packDir = join(root, "packs", name);
  const subsetText = source.subset === "common-chinese" ? commonChineseChars() : null;
  const planned = [];
  const pkgDirs = [];

  for (const member of source.multi) {
    const pkgDir = npmPack(`${member.npm}@${version}`, mkdtempSync(join(work, "m-")));
    const meta = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
    if (meta.version !== version) {
      throw new Error(`${member.npm}: npm returned ${meta.version}, expected ${version}`);
    }
    if (meta.license && meta.license !== source.license.spdx) {
      throw new Error(
        `${member.npm}: upstream declares ${meta.license}, expected ${source.license.spdx}. Re-verify before importing.`,
      );
    }
    const slug = member.npm.split("/").pop();
    for (const weight of member.weights) {
      // fontsource splits by unicode range; the chinese-simplified cut also
      // carries Latin, so one file serves mixed-script text.
      const src = join(pkgDir, "files", `${slug}-chinese-simplified-${weight}-normal.woff2`);
      if (!existsSync(src)) throw new Error(`${member.npm}: missing ${src}`);
      planned.push({ src, out: `${member.family}-${weight}.woff2`, family: member.family, weight });
    }
    pkgDirs.push({ member, pkgDir });
  }

  if (dryRun) {
    return { name, version, files: planned.length, tagged: planned.length, dryRun: true };
  }

  rmSync(join(packDir, source.subdir), { recursive: true, force: true });
  mkdirSync(join(packDir, source.subdir), { recursive: true });
  let bytes = 0;
  for (const item of planned) {
    const dest = join(packDir, source.subdir, item.out);
    if (subsetText) subsetFont(item.src, dest, subsetText);
    else cpSync(item.src, dest);
    bytes += statSync(dest).size;
  }

  cpSync(join(pkgDirs[0].pkgDir, source.license.file), join(packDir, "LICENSE.txt"));

  const coverage = subsetText
    ? {
        subset: "gb2312-level-1",
        chars: subsetText.length,
        note: "GB2312 level-1 (3755 hanzi) plus Latin, digits, and CJK punctuation — about 99.7% of running modern Chinese. A character outside this set renders as a tofu box, not a fallback glyph: for classical text, rare surnames, or names with uncommon characters, verify the render or embed the full face from @fontsource directly.",
      }
    : null;

  writeFileSync(
    join(packDir, "pack.json"),
    `${JSON.stringify(
      {
        schema: "vidmuse.core-pack.pack.v1",
        id: name,
        type: source.type,
        title: name,
        description: source.description,
        upstream: {
          npm: source.multi.map((m) => m.npm).join(" + "),
          version,
          url: source.url,
          imported_by: "scripts/import_pack.mjs",
        },
        license: {
          spdx: source.license.spdx,
          receipt: "LICENSE.txt",
          redistributable: true,
          commercial_output: true,
          attribution_required: false,
          copyright: readCopyright(join(packDir, "LICENSE.txt")),
        },
        // CJK faces carry thousands of glyphs and cannot meet a budget written
        // for Latin fonts even after subsetting.
        size_budget_kb: 1600,
        size_budget_reason:
          "Subsetted CJK faces run 400-900KB per weight. The Latin-oriented 400KB default is unreachable for any Chinese font; this ceiling still fails an unsubsetted 1.1MB+ import.",
        ...(coverage ? { coverage } : {}),
        tags: source.tags || [],
        files: [],
      },
      null,
      2,
    )}\n`,
  );

  const tagFiles = {};
  for (const item of planned) {
    const serif = /serif/i.test(item.family);
    tagFiles[`${source.subdir}/${item.out}`] = {
      tags: [
        serif ? "serif" : "sans",
        serif ? "宋体" : "黑体",
        String(item.weight),
        ...(item.weight >= 700 ? ["bold", "heavy", "粗体"] : []),
        ...(item.weight === 900 ? ["black", "特粗"] : []),
        ...(item.weight === 400 ? ["regular", "body", "正文"] : []),
      ],
      aliases_zh: serif ? ["宋体", "衬线", "中文宋体"] : ["黑体", "无衬线", "中文黑体"],
      description: `${item.family} weight ${item.weight} — ${serif ? "serif" : "sans-serif"} Simplified Chinese${item.weight === 400 ? ", body text" : item.weight === 900 ? ", display" : ", headings"}.`,
    };
  }
  writeFileSync(
    join(packDir, "tags.json"),
    `${JSON.stringify(
      {
        schema: "vidmuse.core-pack.tags.v1",
        notes: `Derived at import from family and weight. Regenerated by re-running import_pack.mjs.`,
        files: tagFiles,
      },
      null,
      2,
    )}\n`,
  );

  return { name, version, files: planned.length, tagged: planned.length, bytes, packDir };
}

/**
 * Import a curated subset of a large upstream set.
 *
 * Used when taking everything would be wrong rather than merely large: the Lobe
 * catalog tracks a fast-moving field, so only settled brands are frozen and the
 * rest stay live-only.
 *
 * `catalogNpm` is fetched too, because the variant flags live in the catalog's
 * toc.json, not in the SVG package. Both versions are pinned in the ledger.
 */
function importCurated(name, source, { root, version, dryRun, work }) {
  const pkgDir = npmPack(`${source.npm}@${version}`, work);
  const meta = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
  if (meta.version !== version) {
    throw new Error(`${name}: npm returned ${meta.version}, expected ${version}`);
  }
  if (meta.license && meta.license !== source.license.spdx) {
    throw new Error(
      `${name}: upstream declares ${meta.license}, expected ${source.license.spdx}. Re-verify before importing.`,
    );
  }

  // The catalog package carries toc.json (titles, groups, variant flags).
  const catalogVersion = readCatalogVersion(pkgDir, source, version);
  const catalogDir = npmPack(`${source.catalogNpm}@${catalogVersion}`, mkdtempSync(join(work, "cat-")));
  const tocPath = join(catalogDir, "es", "toc.json");
  if (!existsSync(tocPath)) throw new Error(`${name}: no toc.json in ${source.catalogNpm}`);
  const toc = new Map(JSON.parse(readFileSync(tocPath, "utf8")).map((e) => [e.id, e]));

  const wanted = [];
  const missingBrands = [];
  for (const [group, brands] of Object.entries(source.curated)) {
    for (const brand of brands) {
      const entry = toc.get(brand);
      if (!entry) {
        missingBrands.push(brand);
        continue;
      }
      const flags = entry.param || {};
      for (const variant of source.variants) {
        if (variant.flag && !flags[variant.flag]) continue;
        const file = `${brand.toLowerCase()}${variant.suffix}${source.ext}`;
        const src = join(pkgDir, source.iconDir, file);
        if (!existsSync(src)) continue;
        wanted.push({ src, file, brand, group, variant: variant.name, entry });
        // One mark per brand: take the first available variant in preference
        // order and stop.
        if (source.onePerBrand) break;
      }
    }
  }
  // A curated list that has drifted from upstream must be loud, not silent: a
  // brand we think we ship but do not is a hole in the offline fallback.
  if (missingBrands.length > 0) {
    throw new Error(
      `${name}: ${missingBrands.length} curated brand(s) are not in ${source.catalogNpm}@${catalogVersion}: ${missingBrands.join(", ")}. Update the curated list.`,
    );
  }
  if (wanted.length === 0) throw new Error(`${name}: curated selection matched no files`);

  if (dryRun) {
    return {
      name,
      version,
      files: wanted.length,
      tagged: wanted.length,
      brands: new Set(wanted.map((w) => w.brand)).size,
      dryRun: true,
    };
  }

  const packDir = join(root, "packs", name);
  rmSync(join(packDir, source.subdir), { recursive: true, force: true });
  mkdirSync(join(packDir, source.subdir), { recursive: true });
  let bytes = 0;
  for (const item of wanted) {
    const body = minifySvg(readFileSync(item.src, "utf8"));
    // With one mark per brand the upstream "-color" suffix carries no
    // information, so the frozen file is named for the brand alone. The variant
    // actually chosen is recorded in tags.json and the receipt.
    item.out = source.onePerBrand ? `${item.brand.toLowerCase()}${source.ext}` : item.file;
    writeFileSync(join(packDir, source.subdir, item.out), body);
    bytes += Buffer.byteLength(body);
  }
  // The SVG package declares MIT in its metadata but ships no notice file; the
  // catalog package carries the actual LICENSE. Take it from wherever it exists
  // rather than writing our own paraphrase of someone else's terms.
  const licenseSrc = [
    join(pkgDir, source.license.file),
    join(catalogDir, source.license.file),
  ].find((candidate) => existsSync(candidate));
  if (!licenseSrc) {
    throw new Error(
      `${name}: no ${source.license.file} in ${source.npm}@${version} or ${source.catalogNpm}@${catalogVersion}`,
    );
  }
  cpSync(licenseSrc, join(packDir, "LICENSE.txt"));

  const brands = [...new Set(wanted.map((w) => w.brand))];
  writeFileSync(
    join(packDir, "pack.json"),
    `${JSON.stringify(
      {
        schema: "vidmuse.core-pack.pack.v1",
        id: name,
        type: source.type,
        title: "Lobe brand marks (curated offline set)",
        description: source.description,
        upstream: {
          npm: source.npm,
          version,
          catalog_npm: source.catalogNpm,
          catalog_version: catalogVersion,
          url: source.url,
          imported_by: "scripts/import_pack.mjs",
        },
        license: {
          spdx: source.license.spdx,
          receipt: "LICENSE.txt",
          redistributable: true,
          commercial_output: true,
          attribution_required: false,
          copyright: readCopyright(join(packDir, "LICENSE.txt")),
          trademark_note:
            "These are identification marks, not permission to impersonate a brand or adopt its trademark as your own. Use them to identify the entity being discussed.",
        },
        role: "offline-fallback",
        role_note:
          "Resolved LAST in the logo cascade. Live sources (Lobe → SVGL → Simple Icons → GitHub avatar → favicon) run first so a mark is never served stale when the network is reachable. Reached only when offline or when every live tier misses.",
        curation: {
          policy:
            "Settled brands only — established companies, major AI labs, and mature developer tools whose marks change on multi-year timescales. Fast-moving new models and startups stay live-only, because a stale local hit would shadow a correct online one.",
          groups: Object.fromEntries(
            Object.entries(source.curated).map(([group, list]) => [group, list.length]),
          ),
          brands: brands.length,
          one_per_brand: true,
          variant_preference: source.variants.map((v) => v.name),
          variant_note:
            "One mark per brand: color where upstream has it, mono otherwise (32 curated brands are monochrome by design and ship no color variant). Wordmarks and lockups are not frozen — variant choice is what the live cascade is for.",
        },
        tags: source.tags || [],
        files: [],
      },
      null,
      2,
    )}\n`,
  );

  const tagFiles = {};
  for (const item of wanted) {
    const { entry } = item;
    const zh = [...(BRAND_ZH[item.brand] || [])];
    tagFiles[`${source.subdir}/${item.out || item.file}`] = {
      // Identity tags are the brand's OWN id and title only.
      //
      // Lobe's `fullTitle` carries relationship parentheticals — `Codex
      // (OpenAI)`, `OpenAI (ChatGPT)` — that describe ownership, not synonymy.
      // Letting them into searchable text makes a query for "OpenAI" rank
      // Codex/Sora/DALL·E as matches, which is the wrong-identity substitution
      // logo-provider.mjs deliberately refuses. Same rule must hold here.
      tags: [entry.title || item.brand, item.brand, item.variant, "logo", "brand"].filter(Boolean),
      ...(zh.length ? { aliases_zh: [...new Set(zh)] } : {}),
      description: `${stripRelationship(entry.title || item.brand)} — official mark, ${item.variant} variant.`,
      // Group is recorded for browsing, but under a key the query engine does
      // not search, so "provider" or "dev-tools" never acts as an identity.
      meta: { curated_group: item.group, lobe_group: entry.group || null },
    };
  }
  writeFileSync(
    join(packDir, "tags.json"),
    `${JSON.stringify(
      {
        schema: "vidmuse.core-pack.tags.v1",
        notes:
          "Derived at import from the Lobe catalog (title, group, variant). Regenerated by re-running import_pack.mjs.",
        files: tagFiles,
      },
      null,
      2,
    )}\n`,
  );

  return { name, version, files: wanted.length, tagged: wanted.length, brands: brands.length, bytes, packDir };
}

/**
 * Drop a relationship parenthetical from a display title.
 *
 * `Codex (OpenAI)` is a product owned by a company, not an alias for it. The
 * bare title is the identity.
 */
export function stripRelationship(title) {
  return String(title).replace(/\s*\([^)]*\)\s*$/, "").trim() || String(title);
}

/**
 * Chinese names for brands whose marks are preinstalled.
 *
 * These are per-brand identities, not general vocabulary, so they belong on the
 * asset rather than in lexicon-zh.json — the lexicon expands a concept to many
 * candidates, which is the opposite of what a brand query needs. A wrong brand
 * mark is a factual error in the film, so nothing here is a category or a guess.
 */
const BRAND_ZH = {
  Alibaba: ["阿里巴巴", "阿里"],
  AlibabaCloud: ["阿里云"],
  Baidu: ["百度"],
  BaiduCloud: ["百度智能云"],
  ByteDance: ["字节跳动", "字节"],
  Tencent: ["腾讯"],
  TencentCloud: ["腾讯云"],
  Huawei: ["华为"],
  HuaweiCloud: ["华为云"],
  AntGroup: ["蚂蚁集团", "蚂蚁"],
  Bilibili: ["哔哩哔哩", "B站"],
  Volcengine: ["火山引擎"],
  Qiniu: ["七牛云"],
  ModelScope: ["魔搭"],
  DeepSeek: ["深度求索"],
  Qwen: ["通义千问", "千问", "通义"],
  Kimi: ["月之暗面"],
  Moonshot: ["月之暗面"],
  Doubao: ["豆包"],
  Hunyuan: ["混元", "腾讯混元"],
  Zhipu: ["智谱"],
  ChatGLM: ["智谱清言"],
  Minimax: ["稀宇科技"],
  Stepfun: ["阶跃星辰"],
  Baichuan: ["百川智能", "百川"],
  InternLM: ["书生浦语", "书生"],
  SenseNova: ["商汤日日新", "商汤"],
  Wenxin: ["文心一言", "文心"],
  Spark: ["讯飞星火", "星火"],
  Yuanbao: ["腾讯元宝", "元宝"],
  XiaomiMiMo: ["小米"],
  Skywork: ["天工"],
  Jimeng: ["即梦"],
  Kling: ["可灵"],
  CapCut: ["剪映"],
  LongCat: ["美团龙猫"],
  ZeroOne: ["零一万物"],
  Yi: ["零一万物"],
  Nvidia: ["英伟达"],
  Microsoft: ["微软"],
  Apple: ["苹果"],
  Google: ["谷歌"],
  // Only names actually in common use are listed. Adobe, IBM, GitHub, and Meta
  // are referred to by their English names in Chinese tech writing; inventing a
  // transliteration would make a query match something nobody would type, and a
  // wrong brand mark is a factual error in the finished film.
};

/** Catalog version to pair with the SVG package. */
function readCatalogVersion(pkgDir, source, version) {
  // Prefer whatever the SVG package itself depends on, so the pair is coherent
  // rather than two independently-chosen versions.
  try {
    const meta = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
    const dep =
      meta.dependencies?.[source.catalogNpm] ||
      meta.peerDependencies?.[source.catalogNpm] ||
      meta.devDependencies?.[source.catalogNpm];
    if (dep) {
      const exact = String(dep).replace(/^[\^~>=<\s]+/, "");
      if (/^\d+\.\d+\.\d+/.test(exact)) return exact;
    }
  } catch {
    // fall through to the pinned default
  }
  return source.catalogVersion || LOBE_CATALOG_FALLBACK;
}

// Kept in sync with media-use/scripts/lib/logo-provider.mjs LOBE_ICONS_VERSION:
// the live cascade and the offline fallback should describe the same catalog.
const LOBE_CATALOG_FALLBACK = "5.15.0";

export function readCopyright(licensePath) {
  const lines = readFileSync(licensePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const explicit = lines.find(
    (line) =>
      /^copyright\s*(?:\(c\)|©|\d{4})/i.test(line),
  );
  if (explicit) return explicit;

  // OFL packages commonly put the holder on the first line ("Google Inc.")
  // and contain the word Copyright only later in the license definitions. That
  // definition is not provenance, so use the leading holder line when present.
  const holder = lines.find(
    (line) =>
      !/^this .*licensed/i.test(line) &&
      !/^https?:/i.test(line) &&
      !/^sil open font license/i.test(line) &&
      !/^-{3,}$/.test(line),
  );
  return holder || "see LICENSE.txt";
}

export function runCli(argv = process.argv.slice(2)) {
  let values;
  try {
    ({ values } = parseArgs({
      args: argv,
      options: {
        source: { type: "string" },
        version: { type: "string" },
        root: { type: "string", default: CORE_PACK },
        "dry-run": { type: "boolean", default: false },
        json: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
      },
      strict: true,
    }));
  } catch (error) {
    console.error(`error: ${error.message}`);
    return 1;
  }
  if (values.help || !values.source) {
    console.log(`Usage: node import_pack.mjs --source <name> --version <exact> [--dry-run]

Sources: ${Object.keys(SOURCES).join(", ")}

Imports a pinned upstream release into packs/<name>/, harvests upstream tag
metadata, then run:
  node core_pack.mjs --ingest assets/core-pack/packs/<name>
  node core_pack.mjs --reindex`);
    return values.source ? 0 : 1;
  }
  try {
    const result = importPack(values.source, {
      root: pathResolve(values.root),
      version: values.version,
      dryRun: values["dry-run"],
    });
    if (values.json) {
      console.log(JSON.stringify({ ok: true, ...result }));
    } else {
      console.log(
        `${result.dryRun ? "would import" : "imported"} ${result.name}@${result.version}: ${result.files} file(s), ${result.tagged} with upstream tags${result.bytes ? ` (${Math.round(result.bytes / 1024)}KB)` : ""}`,
      );
      if (!result.dryRun) {
        console.log(`next: node core_pack.mjs --ingest ${result.packDir} && node core_pack.mjs --reindex`);
      }
    }
    return 0;
  } catch (error) {
    if (values.json) console.log(JSON.stringify({ ok: false, error: error.message }));
    else console.error(`error: ${error.message}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(pathResolve(process.argv[1])).href) {
  process.exitCode = runCli();
}
