#!/usr/bin/env python3
"""Measure a composited video against the alpha test asset's ground truth.

For each sampled time it reports:
  block_x   left edge of the magenta block   (expected: 40 + 594*n/599, n = round(t*60))
  bar_w     width of the cyan bottom bar     (expected: max(2, 854*n/599))
  square    mean RGB in the 50%-lime region vs. the same region of the raw source
  src_var   pixel variance in an uncovered region -> is the source picture visible at all?
  black%    fraction of near-black pixels    -> did alpha get lost (opaque black matte)?
"""
import subprocess
import sys

import numpy as np

W, H, FPS, NFRAMES = 854, 480, 60, 600
SQ = (slice(20, 120), slice(734, 834))            # lime 50% square
BAR = slice(452, 468)                              # cyan bar rows
FREE = (slice(250, 440), slice(0, 700))            # region no shape covers


def frame(path, t):
    out = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-ss", f"{t:.6f}",
         "-frames:v", "1", "-pix_fmt", "rgb24", "-f", "rawvideo", "-"],
        capture_output=True)
    a = np.frombuffer(out.stdout, dtype=np.uint8)
    if a.size < W * H * 3:
        raise RuntimeError(f"{path} @ {t}s: got {a.size} bytes, want {W*H*3}")
    return a[:W * H * 3].reshape(H, W, 3).astype(np.int16)


def expect(t):
    n = min(NFRAMES - 1, int(round(t * FPS)))
    return (int(round(40 + 594 * n / (NFRAMES - 1))),
            max(2, int(round(W * n / (NFRAMES - 1)))))


def measure(f):
    r, g, b = f[:, :, 0], f[:, :, 1], f[:, :, 2]
    mag = (r > 170) & (g < 100) & (b > 170)
    mag[BAR, :] = False
    cols = np.argwhere(mag.any(axis=0))
    block_x = int(cols[0][0]) if cols.size else None

    bar = (r < 110) & (g > 150) & (b > 150)
    bar[: BAR.start, :] = False
    bar[BAR.stop:, :] = False
    bcols = np.argwhere(bar.any(axis=0))
    bar_w = int(bcols[-1][0]) + 1 if bcols.size else 0

    near_black = int(((f.max(axis=2)) < 18).sum())
    return dict(block_x=block_x, bar_w=bar_w,
                square=f[SQ].reshape(-1, 3).mean(axis=0).round(1).tolist(),
                src_var=round(float(f[FREE].var()), 1),
                black_pct=round(100 * near_black / (W * H), 1))


def main():
    path, src = sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None
    times = [float(x) for x in (sys.argv[3:] or ["0.5", "2.5", "5.0", "7.5", "9.5"])]
    print(f"== {path}")
    print(f"{'t':>6} {'block_x':>9} {'want':>5} {'d':>4} {'bar_w':>6} {'want':>5} "
          f"{'d':>5}  {'square_mean':>20} {'src_var':>8} {'black%':>7}")
    ok = True
    for t in times:
        try:
            m = measure(frame(path, t))
        except RuntimeError as e:
            print(f"{t:6.2f}  ERROR: {e}")
            ok = False
            continue
        ex, eb = expect(t)
        dx = "-" if m["block_x"] is None else m["block_x"] - ex
        sq = m["square"]
        if src:
            s = measure(frame(src, t))["square"]
            sq = f"{sq} src{s}"
        print(f"{t:6.2f} {str(m['block_x']):>9} {ex:5d} {str(dx):>4} "
              f"{m['bar_w']:6d} {eb:5d} {m['bar_w']-eb:5d}  {str(sq):>20} "
              f"{m['src_var']:8.1f} {m['black_pct']:7.1f}")
        if m["block_x"] is None or abs(m["block_x"] - ex) > 3 or abs(m["bar_w"] - eb) > 6:
            ok = False
    print("VERDICT:", "overlay present and in sync" if ok else "MISMATCH / overlay missing")


if __name__ == "__main__":
    main()
