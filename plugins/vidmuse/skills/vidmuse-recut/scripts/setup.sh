#!/usr/bin/env bash
# First-run environment setup for VidMuse product skills (recut + create). Idempotent.
#
# What must be GLOBAL (user machine PATH):
#   Node 22+, ffmpeg/ffprobe, Python 3, vidmuse CLI
#
# What comes from the PLUGIN bundle only (not user global skill homes):
#   vidmuse-recut + sibling HF/GSAP skills under <plugin>/skills/
#
# This script does NOT require skills under ~/.codex/skills or ~/.agents/skills.
# When Codex installs the plugin, agents load skills from the plugin payload.
set -u

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
SKILL_DIR=$(dirname "$SCRIPT_DIR")
# skills/vidmuse-recut/scripts → skills/ → plugin root
PLUGIN_SKILLS_DIR=$(cd "$SKILL_DIR/.." && pwd)
PLUGIN_ROOT=$(cd "$PLUGIN_SKILLS_DIR/.." && pwd)

ok=1

echo "VidMuse recut setup"
echo "  plugin root : $PLUGIN_ROOT"
echo "  skills dir  : $PLUGIN_SKILLS_DIR  (authoritative for agent skills)"
echo ""

# ── Global host tools ───────────────────────────────────────────────────────

# Node.js >= 22
if command -v node >/dev/null 2>&1; then
  ver=$(node -v)
  major=${ver#v}; major=${major%%.*}
  if [ "$major" -ge 22 ] 2>/dev/null; then
    echo "[ok] Node.js $ver  (global)"
  else
    echo "[missing] Node.js 22+ required, found $ver — https://nodejs.org (macOS: brew install node)"
    ok=0
  fi
else
  echo "[missing] Node.js not found — install Node.js 22+ from https://nodejs.org (macOS: brew install node)"
  ok=0
fi

# ffmpeg / ffprobe
for bin in ffmpeg ffprobe; do
  if command -v "$bin" >/dev/null 2>&1; then
    echo "[ok] $bin  (global PATH: $(command -v "$bin"))"
  else
    echo "[missing] $bin not found — macOS: brew install ffmpeg; other platforms: https://ffmpeg.org/download.html"
    ok=0
  fi
done

# Python 3
if command -v python3 >/dev/null 2>&1; then
  echo "[ok] python3 $(python3 -c 'import sys;print(".".join(map(str,sys.version_info[:3])))')  (global)"
else
  echo "[missing] python3 not found — macOS: brew install python3"
  ok=0
fi

if [ "$ok" -eq 0 ]; then
  echo ""
  echo "Fix the [missing] global tools above, then re-run: bash scripts/setup.sh"
  exit 1
fi

# VidMuse CLI — MUST be on global PATH (serve / render / model / login)
# Prefer an existing global install; otherwise install the plugin-vendored binary into PATH.
if command -v vidmuse >/dev/null 2>&1; then
  echo "[ok] vidmuse CLI  (global: $(command -v vidmuse) · $(vidmuse --version 2>/dev/null | head -1))"
else
  BUNDLED_CLI="$SKILL_DIR/assets/vendor/vidmuse-cli/vidmuse"
  if [ ! -f "$BUNDLED_CLI" ]; then
    echo "[missing] vidmuse not on PATH and plugin has no assets/vendor/vidmuse-cli/vidmuse"
    echo "          Install a VidMuse CLI build with serve/render/model, then: vidmuse login"
    exit 1
  fi
  if [ "$(uname -sm)" != "Darwin arm64" ]; then
    echo "[missing] bundled vidmuse CLI is darwin-arm64 only; this machine is $(uname -sm)"
    echo "          Install a matching vidmuse CLI onto PATH manually, then: vidmuse login"
    exit 1
  fi
  dest=/usr/local/bin
  if [ ! -w "$dest" ]; then dest="$HOME/.local/bin"; fi
  mkdir -p "$dest"
  cp "$BUNDLED_CLI" "$dest/vidmuse"
  chmod +x "$dest/vidmuse"
  xattr -d com.apple.quarantine "$dest/vidmuse" 2>/dev/null || true
  echo "[ok] vidmuse CLI installed to global PATH: $dest/vidmuse"
  case ":$PATH:" in
    *":$dest:"*) ;;
    *)
      echo "[note] $dest is not on your PATH — add it, e.g.:"
      echo "       echo 'export PATH=\"$dest:\$PATH\"' >> ~/.zshrc && source ~/.zshrc"
      ;;
  esac
fi

# Timeline capability (global binary)
if ! vidmuse serve --help >/dev/null 2>&1 || ! vidmuse render --help >/dev/null 2>&1; then
  echo "[missing] global vidmuse lacks serve/render — install a Timeline-capable build (e.g. v0.3.0+)"
  exit 1
fi
echo "[ok] vidmuse serve + render  (global)"

# VidMuse login
if vidmuse profile get >/dev/null 2>&1; then
  echo "[ok] vidmuse logged in  (global session)"
else
  echo "[action] not logged in — run: vidmuse login   (then re-run: bash scripts/setup.sh)"
  exit 1
fi

# VidMuse-native media preflight. This checks the authenticated VidMuse
# profile/plan/live model catalog plus deterministic host media tools. It does
# not diagnose HyperFrames, provider CLIs, Hugging Face, or local AI runtimes.
MEDIA_USE_DIR="$PLUGIN_SKILLS_DIR/media-use"
echo ""
echo "Verifying VidMuse media substrate..."
if node "$MEDIA_USE_DIR/scripts/resolve.mjs" --doctor; then
  echo ""
  echo "[ok] VidMuse media substrate ready"
else
  echo ""
  echo "[failed] VidMuse media diagnosis reported problems — fix its findings above, then re-run"
  exit 1
fi

# ── Plugin-bundled agent skills ONLY ────────────────────────────────────────
# Codex loads these from the installed plugin payload. Do not look in
# ~/.codex/skills or ~/.agents/skills for health. Do not npx-install skills
# into the user global home as the happy path.

REQUIRED_PLUGIN_SKILLS=(
  vidmuse-recut
  vidmuse-create
  hyperframes
  hyperframes-animation
  hyperframes-cli
  hyperframes-core
  hyperframes-creative
  hyperframes-keyframes
  hyperframes-registry
  media-use
  gsap-core
  gsap-timeline
  gsap-plugins
  gsap-utils
  gsap-performance
)

echo ""
echo "Checking agent skills inside the plugin bundle (not user global skill homes)..."
echo "  look in: $PLUGIN_SKILLS_DIR"
bundled_ok=1
missing_list=()
for name in "${REQUIRED_PLUGIN_SKILLS[@]}"; do
  # entry skill may be SKILL_DIR itself when name=vidmuse-recut
  if [ "$name" = "vidmuse-recut" ]; then
    skill_md="$SKILL_DIR/SKILL.md"
  else
    skill_md="$PLUGIN_SKILLS_DIR/$name/SKILL.md"
  fi
  if [ -f "$skill_md" ]; then
    echo "[ok] plugin skill: $name"
  else
    echo "[missing] plugin skill: $name  (expected $skill_md)"
    bundled_ok=0
    missing_list+=("$name")
  fi
done

if [ "$bundled_ok" -ne 1 ]; then
  echo ""
  echo "[failed] plugin payload incomplete — missing: ${missing_list[*]}"
  echo "         Reinstall / re-link the VidMuse Codex plugin so <plugin>/skills/* is complete."
  echo "         Skills are NOT installed into ~/.codex/skills by this setup."
  echo "         Do not run bare 'npx hyperframes skills update' for packaging."
  exit 1
fi

echo "[ok] all agent skills present in plugin bundle"
echo "[note] product skills: /vidmuse-recut (speaking footage) · /vidmuse-create (no source plate)"
echo "[note] HF/GSAP siblings are domain references only"
echo "[note] global skill homes (~/.codex/skills etc.) are optional and NOT required for health"

echo ""
echo "Environment ready."
echo "  global tools : node, ffmpeg, ffprobe, python3, vidmuse"
echo "  on demand    : npx hyperframes (composition/render runtime; not a media health prerequisite)"
echo "  plugin skills: $PLUGIN_SKILLS_DIR  ($(echo "${REQUIRED_PLUGIN_SKILLS[@]}" | wc -w | tr -d ' ') skills)"
echo "  entry skills : vidmuse-recut · vidmuse-create"
echo "  work dirs    : outside this plugin (e.g. videos/<project>/ under your session workspace)"
