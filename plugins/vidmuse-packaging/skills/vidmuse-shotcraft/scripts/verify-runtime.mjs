#!/usr/bin/env node
import { execFile } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import {
  installLocal,
  loadRegistry,
  policiesRoot,
  readJson,
} from "./registry-lib.mjs";

const execFileAsync = promisify(execFile);

function parseArgs(argv) {
  const options = { concurrency: 4, cliVersion: "0.7.90", keep: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--keep") options.keep = true;
    else if (arg === "--concurrency") {
      options.concurrency = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--cli-version") {
      options.cliVersion = argv[index + 1];
      index += 1;
    } else throw new Error(`Unknown option ${arg}.`);
  }
  if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
    throw new Error("--concurrency must be a positive integer.");
  }
  if (!/^\d+\.\d+\.\d+/.test(options.cliVersion)) {
    throw new Error("--cli-version must be an explicit semver.");
  }
  return options;
}

function buildHost(name, item) {
  const rootId = `${name}-runtime-check`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  </head>
  <body>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: #000; }
    </style>
    <div
      id="runtime-root"
      data-composition-id="${rootId}"
      data-start="0"
      data-duration="${item.duration}"
      data-width="1920"
      data-height="1080"
      style="position:absolute;inset:0;width:1920px;height:1080px;overflow:hidden"
    >
      <div
        id="runtime-${name}"
        class="clip"
        data-composition-id="${name}"
        data-composition-src="compositions/${name}.html"
        data-start="0"
        data-duration="${item.duration}"
        data-track-index="1"
        data-width="1920"
        data-height="1080"
      ></div>
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["${rootId}"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`;
}

function setupProject(root, entry, index) {
  const project = join(root, `${String(index + 1).padStart(3, "0")}-${entry.name}`);
  mkdirSync(project, { recursive: true });
  writeFileSync(
    join(project, "hyperframes.json"),
    `${JSON.stringify(
      {
        $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
        paths: { blocks: "compositions", components: "compositions/components", assets: "assets" },
        media: { autoProxy: true },
      },
      null,
      2,
    )}\n`,
  );
  installLocal(entry.name, { projectDir: project });
  const lock = JSON.parse(readFileSync(join(project, "shotcraft-lock.json"), "utf8"));
  const item = lock.items[entry.name];
  writeFileSync(join(project, "index.html"), buildHost(entry.name, item), "utf8");
  writeFileSync(
    join(project, "package.json"),
    `${JSON.stringify({ name: `shotcraft-runtime-${index + 1}`, private: true, type: "module" }, null, 2)}\n`,
    "utf8",
  );
  return { name: entry.name, project };
}

async function checkProject(task, cliVersion, progress) {
  try {
    await execFileAsync("npx", ["--yes", `hyperframes@${cliVersion}`, "check"], {
      cwd: task.project,
      encoding: "utf8",
      timeout: 180_000,
      maxBuffer: 4 * 1024 * 1024,
      env: { ...process.env, HYPERFRAMES_SKIP_SKILLS: "1" },
    });
    progress(true, task.name);
    return { name: task.name, ok: true };
  } catch (error) {
    const fullDetail = `${error.stdout ?? ""}\n${error.stderr ?? ""}`.trim();
    const detail =
      fullDetail.length > 14_000
        ? `${fullDetail.slice(0, 2_000)}\n… output truncated …\n${fullDetail.slice(-12_000)}`
        : fullDetail;
    progress(false, task.name);
    return {
      name: task.name,
      ok: false,
      runtimeClean: lintAndRuntimeAreClean(fullDetail),
      findings: compactFindings(fullDetail),
      detail,
    };
  }
}

async function runPool(tasks, concurrency, callback) {
  const results = new Array(tasks.length);
  let cursor = 0;
  async function worker() {
    while (cursor < tasks.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await callback(tasks[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()),
  );
  return results;
}

function lintAndRuntimeAreClean(detail) {
  const lint = detail.match(/Lint\n([\s\S]*?)\nRuntime\n/)?.[1] ?? "";
  const runtime = detail.match(/Runtime\n([\s\S]*?)\nLayout\n/)?.[1] ?? "";
  return !lint.includes("✗") && runtime.includes("◇ 0 errors, 0 warnings");
}

function compactFindings(detail) {
  return detail
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("✗") || line.startsWith("⚠"))
    .slice(0, 8);
}

const options = parseArgs(process.argv.slice(2));
const root = mkdtempSync(join(tmpdir(), "vidmuse-shotcraft-runtime-"));

try {
  const { manifest } = loadRegistry();
  const policy = readJson(join(policiesRoot, "runtime-check.json"));
  if (policy.cliVersion !== options.cliVersion) {
    throw new Error(
      `Runtime policy is pinned to HyperFrames ${policy.cliVersion}; received ${options.cliVersion}.`,
    );
  }
  const knownNames = new Set(Object.values(policy.knownFindings).flat());
  const tasks = manifest.items.map((entry, index) => setupProject(root, entry, index));
  let completed = 0;
  const results = await runPool(tasks, options.concurrency, (task) =>
    checkProject(task, options.cliVersion, (ok, name) => {
      completed += 1;
      process.stderr.write(
        `Shotcraft runtime ${completed}/${tasks.length}: ${name} ${ok ? "passed" : "failed"}\n`,
      );
    }),
  );
  const strictFailures = results.filter((result) => !result.ok);
  const knownFindings = strictFailures
    .filter((result) => knownNames.has(result.name) && result.runtimeClean)
    .map((result) => ({ name: result.name, findings: result.findings }));
  const knownFindingNames = new Set(knownFindings.map((result) => result.name));
  const unexpectedFailures = strictFailures.filter(
    (result) => !knownFindingNames.has(result.name),
  );
  const resolvedKnownFindings = [...knownNames].filter(
    (name) => !strictFailures.some((result) => result.name === name),
  );
  const report = {
    ok: unexpectedFailures.length === 0,
    cliVersion: options.cliVersion,
    blocks: manifest.items.length,
    concurrency: options.concurrency,
    strictPassed: results.length - strictFailures.length,
    baselinePassed: results.length - unexpectedFailures.length,
    knownFindings,
    resolvedKnownFindings,
    unexpectedFailures,
    temporaryRoot: options.keep ? root : null,
  };
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
  if (!options.keep) rmSync(root, { recursive: true, force: true });
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error.message, temporaryRoot: root }, null, 2));
  process.exitCode = 1;
}
