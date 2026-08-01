#!/usr/bin/env python3
"""Render preview.png for native library effects via headless Chrome.

An effect without a rendered preview is invisible to both the agent and the
user: nobody trusts — or picks — a mechanism they have never seen. This tool
freezes each native effect at its developed moment on top of a real footage
frame and screenshots it into the effect's own directory as preview.png.

Each effect directory may carry a preview-harness.html (a self-contained page
that composes the effect over a backdrop and seeks its timeline to the
developed state). Full-composition blocks that already render standalone are
screenshot directly.

Examples:
  render_previews.py --all
  render_previews.py word-strike --backdrop /path/to/f25s.jpg
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parents[1]
NATIVE = SKILL_ROOT / "library" / "native"
# Reuse the browser stack HyperFrames already ships — same engine that renders
# real frames, no separate Chrome dependency.
HF_MODULES = Path("/opt/homebrew/lib/node_modules/hyperframes/node_modules")

SHOT_JS = """
const puppeteer = require('puppeteer-core');
const [, , url, out, w, h] = process.argv;
(async () => {
  const browser = await puppeteer.launch({
    channel: 'chrome', headless: true,
    args: ['--disable-gpu', '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: +w, height: +h });
  // Registry items call the HyperFrames host API; shim just enough of it
  // that a standalone block boots with its declared variable defaults.
  await page.evaluateOnNewDocument(() => {
    if (window.__hyperframes) return;
    window.__hyperframes = {
      getVariables() {
        const defs = JSON.parse(document.documentElement.getAttribute('data-composition-variables') || '[]');
        return Object.fromEntries(defs.map(d => [d.id, d.default]));
      },
    };
  });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 600)); // fonts + first paint settle
  // Developed state: harnesses seek themselves; for raw standalone blocks
  // whose paused timelines still sit at 0, seek those to 60% so the preview
  // shows the effect, not a blank canvas.
  await page.evaluate(() => {
    const named = Object.values(window.__timelines || {});
    const found = window.gsap
      ? window.gsap.globalTimeline.getChildren(false, false, true)
      : [];
    for (const tl of [...named, ...found]) {
      const d = tl.duration();
      if (d > 0 && tl.paused() && tl.time() === 0) tl.seek(d * 0.6);
    }
  });
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: out });
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
"""


def screenshot(page: Path, out: Path, size: str = "1280,720") -> None:
    w, h = size.split(",")
    subprocess.run(
        ["node", "-e", SHOT_JS, "shot", page.resolve().as_uri(), str(out), w, h],
        check=True, capture_output=True, text=True, timeout=90,
        env={"NODE_PATH": str(HF_MODULES), "PATH": "/opt/homebrew/bin:/usr/bin:/bin"},
    )


def find_targets(names: list[str]) -> list[Path]:
    dirs = [d for kind in ("components", "blocks") for d in sorted((NATIVE / kind).glob("*")) if d.is_dir()]
    if names:
        dirs = [d for d in dirs if d.name in names]
    return dirs


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("names", nargs="*", help="effect directory names; default all with a harness")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--size", default="1280,720")
    args = parser.parse_args()

    targets = find_targets([] if args.all else args.names)
    done, skipped = [], []
    for d in targets:
        harness = d / "preview-harness.html"
        main_html = d / f"{d.name}.html"
        page = harness if harness.is_file() else (main_html if main_html.is_file() and "data-composition-variables" in main_html.read_text(encoding="utf-8", errors="replace") else None)
        if page is None:
            skipped.append(d.name)
            continue
        out = d / "preview.png"
        screenshot(page, out, args.size)
        done.append(f"{d.name} -> {out.relative_to(SKILL_ROOT)}")
    for line in done:
        print(line)
    if skipped:
        print(f"skipped (no harness / not standalone): {', '.join(skipped)}", file=sys.stderr)
    return 0 if done or not targets else 1


if __name__ == "__main__":
    sys.exit(main())
