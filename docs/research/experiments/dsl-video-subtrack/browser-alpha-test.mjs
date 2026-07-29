// Measure whether the browser (the engine behind `vidmuse serve`'s preview) can
// decode each alpha asset WITH its alpha channel.
//
// Method: draw the video frame at t=5s onto a canvas pre-filled with pure red.
//   - alpha honoured  -> uncovered pixels stay red (255,0,0)
//   - alpha dropped   -> uncovered pixels become black (the file's RGB under alpha=0)
// The page is loaded from the serve origin so the local-file endpoint is same-origin
// and canvas readback is not tainted.
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = 9333;
const ORIGIN = process.argv[2] || "http://127.0.0.1:5199";
const CHROME = "/Users/az/.cache/puppeteer/chrome/mac_arm-150.0.7871.24/" +
  "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";

const FILES = [
  ["VP9 alpha WebM", "/tmp/vw-exp1/public/alpha-test.webm"],
  ["ProRes 4444 MOV", "/tmp/vw-exp1/public/alpha-test.mov"],
  ["VP8 alpha WebM", "/tmp/vw-exp1/public/alpha-test-vp8.webm"],
  ["QT RLE MOV", "/tmp/vw-exp1/public/alpha-test-qtrle.mov"],
];

const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`,
  "--no-first-run", "--no-default-browser-check",
  "--user-data-dir=/tmp/vw-exp1/.chrome-profile",
  "--autoplay-policy=no-user-gesture-required",
  "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
chrome.stderr.on("data", () => {});

async function cdpTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      return (await r.json()).webSocketDebuggerUrl;
    } catch { await sleep(250); }
  }
  throw new Error("chrome did not come up");
}

const ws = new WebSocket(await cdpTarget());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const send = (method, params = {}) => new Promise((res) => {
  const n = ++id;
  pending.set(n, res);
  ws.send(JSON.stringify({ id: n, method, params }));
});

// Attach to a page target on the serve origin.
const { result: tgt } = await send("Target.createTarget", { url: ORIGIN });
const { result: sess } = await send("Target.attachToTarget",
  { targetId: tgt.targetId, flatten: true });
const sessionId = sess.sessionId;
const sendS = (method, params = {}) => new Promise((res) => {
  const n = ++id;
  pending.set(n, res);
  ws.send(JSON.stringify({ id: n, method, params, sessionId }));
});
await sleep(2500);

const PROBE = (url) => `(async () => {
  const v = document.createElement('video');
  v.crossOrigin = 'anonymous'; v.muted = true; v.preload = 'auto';
  v.src = ${JSON.stringify(url)};
  const meta = await new Promise(r => {
    v.addEventListener('loadedmetadata', () => r('ok'), {once:true});
    v.addEventListener('error', () => r('error'), {once:true});
    setTimeout(() => r('timeout'), 8000);
  });
  if (meta !== 'ok') return {stage:'load', result: meta, canPlay: v.canPlayType(v.src.includes('.mov')?'video/quicktime':'video/webm; codecs="vp9"')};
  v.currentTime = 5.0;
  const seek = await new Promise(r => {
    v.addEventListener('seeked', () => r('ok'), {once:true});
    v.addEventListener('error', () => r('error'), {once:true});
    setTimeout(() => r('timeout'), 8000);
  });
  if (seek !== 'ok') return {stage:'seek', result: seek, w: v.videoWidth, h: v.videoHeight};
  const c = document.createElement('canvas');
  c.width = v.videoWidth || 854; c.height = v.videoHeight || 480;
  const g = c.getContext('2d');
  g.fillStyle = 'rgb(255,0,0)'; g.fillRect(0,0,c.width,c.height);   // red backdrop
  g.drawImage(v, 0, 0);
  const px = (x,y) => { const d = g.getImageData(x,y,1,1).data; return [d[0],d[1],d[2]]; };
  return {
    stage: 'ok', w: c.width, h: c.height,
    uncovered: px(400, 400),     // nothing drawn here -> should stay red
    block:     px(390, 240),     // magenta block at t=5 (x 337..457)
    square:    px(780, 60),      // 50% lime over red -> ~[128,128,0]
    bar:       px(200, 460),     // cyan bar
  };
})()`;

for (const [label, path] of FILES) {
  const url = `${ORIGIN}/__vidmuse/api/local-file?path=${encodeURIComponent(path)}`;
  const r = await sendS("Runtime.evaluate",
    { expression: PROBE(url), awaitPromise: true, returnByValue: true });
  const v = r.result?.result?.value ?? r.result?.exceptionDetails ?? r;
  console.log(label.padEnd(18), JSON.stringify(v));
}

ws.close();
chrome.kill();
