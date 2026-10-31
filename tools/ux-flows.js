// UX flow checks for navigation, first fight and dialog accessibility. Run `npm run build` first.
// Usage: node tools/ux-flows.js [shotsDir]   (exits non-zero if any check fails)
// Uses the pre-installed Playwright (require('playwright')); no install needed.
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = path.resolve(process.argv[2] || '/tmp/oni-ux');
const URL = 'file://' + path.resolve(__dirname, '..', 'dist', 'oni-fighter.html');
fs.mkdirSync(OUT, { recursive: true });
let fails = 0;
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) fails++; };

async function page(b, { fresh = false, vp = { width: 390, height: 844 }, hash = '' } = {}) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent });
  const p = await ctx.newPage(); p.errs = [];
  p.on('pageerror', e => p.errs.push(e.message));
  if (!fresh) await ctx.addInitScript(() => { try { localStorage.setItem('oni-age', '1'); } catch (e) {} });
  await p.goto(URL + hash); await p.waitForTimeout(900);
  return p;
}
const st = p => p.evaluate(() => ({ key: navKey(), mode, scene: M && M.scene, ov: NAV.ov.map(x => x.id), hlen: history.length,
  panel: (document.querySelector('.panel.on') || {}).id || null, focus: document.activeElement && (document.activeElement.id || document.activeElement.className) }));
const back = async p => { await p.goBack({ waitUntil: 'commit' }).catch(() => {}); await p.waitForTimeout(450); };

(async () => {
  const b = await chromium.launch();

  // (a) Back from the market returns to the village
  { const p = await page(b);
    await p.click('#ld-play'); await p.waitForTimeout(500);
    await p.click('#md-x'); await p.waitForTimeout(500);
    ok((await st(p)).key === 'village', 'landing PLAY, close chooser: in the village');
    await p.evaluate(() => { const b = [...document.querySelectorAll('#dock button')].find(b => /menu/i.test(b.textContent)); b.click(); });
    await p.waitForTimeout(500);
    await p.click('#scroll-grid [data-k="store"]'); await p.waitForTimeout(600);
    let s = await st(p); ok(s.panel === 'p-store', 'menu -> Market opens the market');
    ok(await p.evaluate(() => location.hash) === '#market', 'market has the #market hash');
    await back(p); s = await st(p);
    ok(s.key === 'village' && !s.panel, '(a) Back from the market returns to the village (got ' + s.key + ')');
    // UI back button goes to where you came from: champions -> market -> Back button -> champions
    await p.evaluate(() => openChampions()); await p.waitForTimeout(300);
    await p.evaluate(() => openStore()); await p.waitForTimeout(300);
    await back(p); s = await st(p); ok(s.panel === 'p-champs', 'Back from market opened from Champions returns to Champions');
    await back(p); s = await st(p); ok(s.key === 'village', 'Back again: village');
    await back(p); s = await st(p); ok(s.key === 'p-landing', 'Back from the village: landing');
    ok(!p.errs.length, 'no page errors (a) ' + p.errs.join(' | '));
    await p.context().close(); }

  // (b) Back during a CPU fight opens pause, the app stays; second Back asks to quit; then close + resume
  { const p = await page(b);
    await p.click('#ld-play'); await p.waitForTimeout(500);
    await p.click('#md-list [data-m="quick"]'); await p.waitForTimeout(1500);
    let s = await st(p); ok(s.key === 'fight' && s.mode === 'cpu', 'quick fight running');
    await back(p); s = await st(p);
    ok(s.key === 'fight' && s.ov.join() === 'pause' && await p.evaluate(() => !document.getElementById('pause').hidden), '(b) Back in a CPU fight opens pause (ov=' + s.ov + ')');
    ok(await p.evaluate(() => PAUSE.on && !!M), 'fight is frozen and still there');
    await back(p); s = await st(p); ok(s.ov.join() === 'pause,nconf', 'second Back from pause asks to quit');
    await p.screenshot({ path: path.join(OUT, 'P-quit-confirm.png') });
    await back(p); s = await st(p); ok(s.ov.join() === 'pause', 'Back on the question closes it');
    await p.click('#pz-res'); await p.waitForTimeout(500); s = await st(p);
    ok(!s.ov.length && s.key === 'fight', 'Resume closes pause');
    await back(p); s = await st(p); ok(s.ov.join() === 'pause', 'Back after resume pauses again');
    await p.click('#pz-quit'); await p.waitForTimeout(800); s = await st(p);
    ok(s.key === 'village', 'Quit match returns to the village (got ' + s.key + ')');
    await back(p); s = await st(p); ok(s.key === 'p-landing', 'Back from the village after a fight: landing (got ' + s.key + ')');
    ok(!p.errs.length, 'no page errors (b) ' + p.errs.join(' | '));
    await p.context().close(); }

  // (c) Back closes the village scroll menu
  { const p = await page(b);
    await p.click('#ld-play'); await p.waitForTimeout(500); await p.click('#md-x'); await p.waitForTimeout(400);
    await p.evaluate(() => { const b = [...document.querySelectorAll('#dock button')].find(b => /menu/i.test(b.textContent)); b.click(); });
    await p.waitForTimeout(500); let s = await st(p); ok(s.ov.join() === 'scroll', 'menu open');
    await back(p); s = await st(p);
    ok(!s.ov.length && s.key === 'village' && await p.evaluate(() => document.getElementById('scroll').hidden), '(c) Back closes the scroll menu');
    // Back closes the Play chooser too
    await p.evaluate(() => { const b = [...document.querySelectorAll('#dock button')].find(b => /play/i.test(b.textContent)); b.click(); });
    await p.waitForTimeout(400); s = await st(p); ok(s.ov.join() === 'modes', 'dock Play opens the mode chooser');
    await back(p); s = await st(p); ok(!s.ov.length && s.key === 'village', 'Back closes the mode chooser');
    // keyboard: Escape closes the scroll menu and focus returns to the opener
    await p.evaluate(() => { const b = [...document.querySelectorAll('#dock button')].find(b => /menu/i.test(b.textContent)); b.focus(); b.click(); });
    await p.waitForTimeout(400); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    ok(await p.evaluate(() => document.getElementById('scroll').hidden && /menu/i.test(document.activeElement.textContent)), 'Escape closes the menu and focus goes back to the Menu button');
    ok(!p.errs.length, 'no page errors (c) ' + p.errs.join(' | '));
    await p.context().close(); }

  // (d) age gate: initial focus, Tab and Shift+Tab stay inside, Escape does not dismiss
  { const p = await page(b, { fresh: true, vp: { width: 1280, height: 800 } });
    ok(await p.evaluate(() => document.getElementById('age-gate').contains(document.activeElement)), 'age gate gets initial focus');
    let inside = true;
    for (let i = 0; i < 8; i++) { await p.keyboard.press(i % 3 === 2 ? 'Shift+Tab' : 'Tab'); inside = inside && await p.evaluate(() => document.getElementById('age-gate').contains(document.activeElement)); }
    ok(inside, '(d) Tab cycles inside the age gate');
    await p.keyboard.press('Escape'); ok(await p.evaluate(() => !!document.getElementById('age-gate')), 'Escape does not dismiss the age gate');
    ok(await p.evaluate(() => { const d = document.getElementById('age-gate'); return d.getAttribute('aria-modal') === 'true' && !!document.getElementById(d.getAttribute('aria-labelledby')); }), 'age gate is a labelled aria-modal dialog');
    // pause + chooser dialogs trap focus too
    await p.click('#ag-yes'); await p.click('#ld-play'); await p.waitForTimeout(500);
    let t = true; for (let i = 0; i < 9; i++) { await p.keyboard.press('Tab'); t = t && await p.evaluate(() => document.getElementById('modes').contains(document.activeElement)); }
    ok(t, 'Tab cycles inside the mode chooser');
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => document.getElementById('modes').hidden), 'Escape closes the mode chooser');
    // icon-only / unnamed buttons
    const unnamed = await p.evaluate(() => [...document.querySelectorAll('button,[role=button],a[href]')].filter(e => e.getClientRects().length && !(e.getAttribute('aria-label') || e.textContent.trim() || e.title)).map(e => e.id || e.className));
    ok(!unnamed.length, 'every visible button has an accessible name ' + unnamed.join(','));
    ok(!p.errs.length, 'no page errors (d) ' + p.errs.join(' | '));
    await p.context().close(); }

  // (e) fresh storage: age gate -> Play -> Quick fight reaches a fight in 2 taps after the gate
  for (const [n, vp] of [['P', { width: 390, height: 844 }], ['L', { width: 844, height: 390 }], ['Ps', { width: 360, height: 640 }], ['Ls', { width: 640, height: 360 }]]) {
    const p = await page(b, { fresh: true, vp });
    await p.tap('#ag-yes'); await p.waitForTimeout(300);
    await p.tap('#ld-play'); await p.waitForTimeout(600);
    await p.screenshot({ path: path.join(OUT, n + '-modes.png') });
    const tut = await p.evaluate(() => !document.getElementById('md-tut').hidden);
    await p.tap('#md-list [data-m="quick"]');
    await p.waitForFunction(() => M && M.scene === 'fight', null, { timeout: 8000 }).catch(() => {});
    const s = await st(p);
    ok(s.scene === 'fight' && s.mode === 'cpu', `(e) ${n}: gate -> Play -> Quick fight reaches M.scene==='fight' in 2 taps (scene=${s.scene})`);
    if (n === 'P') ok(tut, 'first-timers see the tutorial offer in the chooser');
    ok(!p.errs.length, `no page errors (e) ${n} ` + p.errs.join(' | '));
    await p.context().close(); }

  // deep links + remembered choice + no staked default
  { const p = await page(b, { hash: '#tenka' });
    let s = await st(p); ok(s.panel === 'p-tourney', 'deep link #tenka opens TENKA');
    await back(p); s = await st(p); ok(s.key === 'village', 'Back from a deep link: village');
    await p.evaluate(() => { LS.set('oni-play-last', 'online'); openModes(); }); await p.waitForTimeout(300);
    ok(await p.evaluate(() => document.activeElement.dataset.m === 'online' && !!document.querySelector('[data-m="online"] .md-last')), 'chooser remembers and focuses the last choice');
    await p.click('#md-list [data-m="online"]'); await p.waitForTimeout(400);
    ok(await p.evaluate(() => SEL.ctx === 'online' && stakeCents() === 0), 'Online 1v1 from Play starts on a free stake');
    await p.context().close(); }
  { const p = await page(b, { hash: '#market' }); const s = await st(p); ok(s.panel === 'p-store', 'deep link #market opens the market');
    ok(!p.errs.length, 'no page errors (deep) ' + p.errs.join(' | ')); await p.context().close(); }
  { const p = await page(b, { fresh: true, hash: '#market' }); ok((await st(p)).panel !== 'p-store', 'deep link waits for the age gate');
    await p.click('#ag-yes'); await p.waitForTimeout(500); ok((await st(p)).panel === 'p-store', 'deep link opens after the age gate'); await p.context().close(); }

  // reduced motion turns Comfort on by default
  { const ctx = await b.newContext({ reducedMotion: 'reduce' }); const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(500);
    ok(await p.evaluate(() => COMFORT.on), 'prefers-reduced-motion: Comfort mode on by default'); await ctx.close(); }

  // toast avoids the end-of-match buttons (all 4 phone sizes)
  for (const [n, vp] of [['L', { width: 844, height: 390 }], ['Ls', { width: 640, height: 360 }], ['P', { width: 390, height: 844 }], ['Ps', { width: 360, height: 640 }]]) {
    const p = await page(b, { vp });
    await p.evaluate(() => { openSelect('cpu'); SEL.fmt = 'ko'; startCPU(); M.f[1].hp = 0; });
    await p.waitForFunction(() => document.querySelector('#p-end.on'), null, { timeout: 20000 }).catch(() => {});
    await p.waitForTimeout(400); await p.evaluate(() => toast('+10 Spirit Shards · win vs CPU · a long toast line'));
    await p.waitForTimeout(150);
    const hit = await p.evaluate(() => { const t = document.getElementById('toast').getBoundingClientRect();
      return [...document.querySelectorAll('#p-end.on button,#p-end.on a')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.left < t.right && r.right > t.left && r.top < t.bottom && r.bottom > t.top; }).map(e => e.textContent); });
    await p.screenshot({ path: path.join(OUT, n + '-end-toast.png') });
    ok(!hit.length, `${n}: toast does not cover end buttons ${hit.join(',')}`);
    await p.context().close(); }

  await b.close();
  console.log(fails ? fails + ' FAILED' : 'all passed', '· shots in', OUT);
  process.exit(fails ? 1 : 0);
})();
