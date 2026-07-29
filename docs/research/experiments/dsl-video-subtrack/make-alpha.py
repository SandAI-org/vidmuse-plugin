#!/usr/bin/env python3
"""Build the alpha test asset directly with ffmpeg (no HyperFrames involved).

Content, 854x480 @ 60fps, 10s (600 frames):
  - magenta 120x120 block, alpha=255, moving left->right  -> motion + timing signal
  - lime 100x100 square, alpha=128, fixed top-right       -> partial-alpha signal
  - cyan bar at the bottom, width = n/599 * 854, alpha=255 -> precise time readout
  - everything else alpha=0                                -> alpha-loss discriminator

Frames are generated as RGBA with numpy and piped into ffmpeg, because ffmpeg's
drawbox has no time variable in its expressions (`t` there is thickness) and does
not write the alpha plane unless replace=1.
"""
import subprocess
import sys

import numpy as np

W, H, FPS, NFRAMES = 854, 480, 60, 600
OUT = sys.argv[1] if len(sys.argv) > 1 else "public/alpha-test.webm"

MOV_W = MOV_H = 120
MOV_Y = 180
MOV_X0, MOV_X1 = 40, 634          # left edge travel, inclusive
SQ_X, SQ_Y, SQ_W, SQ_H = 734, 20, 100, 100
BAR_Y, BAR_H = 452, 16


def block_x(n):
    """Left edge of the moving block at frame n. Ground truth for verification."""
    return int(round(MOV_X0 + (MOV_X1 - MOV_X0) * n / (NFRAMES - 1)))


def bar_w(n):
    return max(2, int(round(W * n / (NFRAMES - 1))))


def main():
    proc = subprocess.Popen(
        ["ffmpeg", "-y", "-v", "error",
         "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
         "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-auto-alt-ref", "0",
         "-b:v", "0", "-crf", "20", OUT],
        stdin=subprocess.PIPE,
    )
    for n in range(NFRAMES):
        f = np.zeros((H, W, 4), dtype=np.uint8)          # fully transparent
        x = block_x(n)
        f[MOV_Y:MOV_Y + MOV_H, x:x + MOV_W] = (255, 0, 255, 255)      # magenta, opaque
        f[SQ_Y:SQ_Y + SQ_H, SQ_X:SQ_X + SQ_W] = (0, 255, 0, 128)      # lime, 50% alpha
        f[BAR_Y:BAR_Y + BAR_H, 0:bar_w(n)] = (0, 255, 255, 255)       # cyan, opaque
        proc.stdin.write(f.tobytes())
    proc.stdin.close()
    rc = proc.wait()
    if rc:
        sys.exit(rc)
    print(f"built {OUT}")
    for n in (0, 300, 599):
        print(f"  ground truth frame {n:3d}  t={n/FPS:5.3f}s  "
              f"block_x={block_x(n):3d}  bar_w={bar_w(n):3d}")


if __name__ == "__main__":
    main()
