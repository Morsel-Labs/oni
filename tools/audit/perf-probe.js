// Mobile performance probe. Run `npm run build` first.
// Usage: node tools/audit/perf-probe.js [cpuThrottle=4] [--offline-fonts]
// Measures: load timings, boot time, FPS (rAF count over 5 s) + frame-time percentiles in landing, village and fight,
// long tasks, JS heap, canvas backing sizes vs CSS sizes, packed online state size.
const { chromium, devices } = require('playwright');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '..', '..', 'dist', 'oni-fighter.html');
const THR = +(process.argv.find(a => /^\d+$/.test(a)) || 4);
const OFFLINE_FONTS = process.argv.includes('--offline-fonts');

const INIT = () => {
  window.__lt = []; window.__boot = null;
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push(e.duration); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}
  const raf = window.requestAnimationFrame.bind(window); let first = true;
  window.requestAnimationFrame = cb => raf(t => { if (first) { first = false; window.__boot = performance.now(); } cb(t); });
};
async function fps(p, ms = 5000) {
  return p.evaluate(ms => new Promise(res => {
    const ts = []; const lt0 = window.__lt.length; const t0 = performance.now();
    const tick = t => { ts.push(t); if (t - t0 < ms) requestAnimationFrame(tick); else {
      const d = ts.slice(1).map((v, i) => v - ts[i]).sort((a, b) => a - b); const q = x => +d[Math.floor(x * (d.length - 1))].toFixed(1);
      const lt = window.__lt.slice(lt0);
      res({ fps: +((ts.length - 1) / ((ts[ts.length - 1] - ts[0]) / 1000)).toFixed(1), p50: q(0.5), p95: q(0.95), p99: q(0.99), max: +d[d.length - 1].toFixed(1),
        over33ms: d.filter(x => x > 33.4).length, longTasks: lt.length, longTaskMax: lt.length ? Math.round(Math.max(...lt)) : 0 });
    } };
    requestAnimationFrame(tick);
  }), ms);
}
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent });
  if (OFFLINE_FONTS) await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const fontReq = []; ctx.on('request', r => { if (/fonts\./.test(r.url())) fontReq.push(r.url().slice(0, 60)); });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THR });
  await cdp.send('Performance.enable');
  await p.addInitScript(INIT);
  const t0 = Date.now();
  await p.goto(URL, { waitUntil: 'load' });
  const loadWall = Date.now() - t0;
  await p.waitForFunction(() => window.__boot != null, null, { timeout: 30000 });
  const nav = await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; const pt = performance.getEntriesByType('paint');
    return { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), fcp: Math.round((pt.find(x => x.name === 'first-contentful-paint') || {}).startTime || -1), boot: Math.round(window.__boot), dpr: devicePixelRatio,
      fontOK: document.fonts && document.fonts.check('8px "Press Start 2P"') }; });
  await p.click('#ag-yes', { force: true, timeout: 3000 }).catch(() => {});
  await p.waitForTimeout(1000);
  const out = { throttle: THR, offlineFonts: OFFLINE_FONTS, loadWallMs: loadWall, nav, fontRequests: fontReq.length };
  out.landing = await fps(p);
  await p.click('#ld-play', { force: true }).catch(() => {}); await p.waitForTimeout(1500);
  out.village = await fps(p);
  await p.evaluate(() => { openSelect('cpu'); startCPU(); }); await p.waitForTimeout(4000);
  out.fight = await fps(p);
  out.packBytes = await p.evaluate(() => { let mx = 0; try { mx = JSON.stringify({ r: 'h', s: pack(M), sk: 0, mp: 0, fm: 'bo3', ck: 0, rd: 0 }).length; } catch (e) { mx = -1; } return mx; });
  out.canvases = await p.evaluate(() => [...document.querySelectorAll('canvas')].filter(c => c.getBoundingClientRect().width > 0)
    .map(c => { const r = c.getBoundingClientRect(); return `${c.id || c.className || 'canvas'} ${c.width}x${c.height} -> css ${r.width | 0}x${r.height | 0} (x${(r.width * devicePixelRatio / c.width).toFixed(1)} device px/canvas px)`; }).slice(0, 6));
  const m = await cdp.send('Performance.getMetrics'); const g = k => (m.metrics.find(x => x.name === k) || {}).value;
  out.heapMB = +(g('JSHeapUsedSize') / 1048576).toFixed(1); out.heapTotalMB = +(g('JSHeapTotalSize') / 1048576).toFixed(1);
  out.nodes = g('Nodes'); out.layoutCount = g('LayoutCount'); out.recalcStyleCount = g('RecalcStyleCount'); out.taskDurationS = +g('TaskDuration').toFixed(2);
  out.errors = errs.slice(0, 5);
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
