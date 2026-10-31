// UX / robustness probe. Run `npm run build` first.  Usage: node tools/audit/ux-probe.js
// Checks: taps to first fight for a new user, back-button behaviour, multi-touch on the pad, card/pad overlap
// in landscape village, localStorage throwing, a11y basics (names, dialogs, focus), contrast of key colours,
// and hostile data from the online db/room (XSS + crash resilience) via a fake window.claude.
const { chromium, devices } = require('playwright');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '..', '..', 'dist', 'oni-fighter.html');
const P = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent };
const L = Object.assign({}, P, { viewport: { width: 844, height: 390 } });
const out = {};
async function page(b, opt, init) {
  const ctx = await b.newContext(opt); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message.split('\n')[0])); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
  if (init) await p.addInitScript(init);
  await p.goto(URL); await p.waitForTimeout(900); return { ctx, p, errs };
}
const tap = async (p, sel) => { const el = await p.$(sel); if (!el) return false; const bb = await el.boundingBox(); if (!bb) return false; await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(500); return true; };
const tapText = async (p, re) => { const h = await p.evaluateHandle(src => { const r = new RegExp(src, 'i'); return [...document.querySelectorAll('button,[role=button],a')].find(b => r.test(b.textContent) && b.getBoundingClientRect().width > 0 && b.offsetParent !== null) || null; }, re.source);
  const el = h.asElement(); if (!el) return false; const bb = await el.boundingBox(); if (!bb) return false; await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(600); return true; };
const state = p => p.evaluate(() => ({ mode, panel: (document.querySelector('.panel.on') || {}).id || null, inFight: !!M && !document.body.classList.contains('menu') }));

(async () => {
  const b = await chromium.launch();
  // 1. first-time flow: count taps to the first fight via the most obvious path (dock Play -> ... )
  { const { ctx, p, errs } = await page(b, P); const steps = [];
    const gate = await p.$('#age-gate'); steps.push('age gate shown: ' + !!gate);
    await tap(p, '#ag-yes'); steps.push('tap 1: I am 18+ -> ' + JSON.stringify(await state(p)));
    await tap(p, '#ld-play'); await p.waitForTimeout(800); steps.push('tap 2: PLAY -> ' + JSON.stringify(await state(p)));
    const dock = await p.evaluate(() => [...document.querySelectorAll('#dock button')].map(b => b.textContent.trim()));
    steps.push('dock: ' + dock.join(' | '));
    await tapText(p, /^\s*Menu\s*$/); steps.push('tap 3: Menu -> ' + JSON.stringify(await state(p)));
    const menu = await p.evaluate(() => [...document.querySelectorAll('.panel.on button, #vmenu button, [class*=vm] button')].filter(b => b.getBoundingClientRect().width > 0).map(b => b.textContent.trim()).slice(0, 20));
    steps.push('menu items: ' + menu.join(' | '));
    await tapText(p, /Practice\s*Train/); steps.push('tap 4: Practice -> ' + JSON.stringify(await state(p)));
    await tapText(p, /^\s*Fight\s*$/); await p.waitForTimeout(1200); steps.push('tap 5: Fight -> ' + JSON.stringify(await state(p)));
    // back button behaviour from inside a fight
    const hl = await p.evaluate(() => history.length);
    const r = await p.goBack({ timeout: 3000 }).catch(e => 'goBack error: ' + e.message.split('\n')[0]);
    steps.push(`history.length in fight = ${hl}; Back -> ${typeof r === 'string' ? r : r ? 'navigated to ' + r.url() : 'no navigation (null)'}; url now ${p.url().slice(0, 40)}`);
    out.firstFlow = { steps, errors: errs }; await ctx.close(); }
  // 1b. dock "Play" path
  { const { ctx, p } = await page(b, P); await tap(p, '#ag-yes'); await tap(p, '#ld-play'); await p.waitForTimeout(800);
    await tapText(p, /^\s*Play\s*$/); const s1 = await state(p); const txt = await p.evaluate(() => { const e = document.querySelector('.panel.on'); return e ? e.innerText.replace(/\s+/g, ' ').slice(0, 220) : ''; });
    out.dockPlay = { state: s1, text: txt }; await ctx.close(); }
  // 2. multi-touch on the pad (hold LEFT + tap ATTACK) in a CPU fight
  { const { ctx, p } = await page(b, L); await tap(p, '#ag-yes');
    await p.evaluate(() => { openSelect('cpu'); startCPU(); }); await p.waitForTimeout(3500);
    const c = await p.evaluate(() => { const g = k => { const e = document.querySelector('.pb[data-k="' + k + '"]'); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2, r.width, r.height]; }; return { L: g('L'), P: g('P'), R: g('R'), B: g('B') }; });
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: c.L[0], y: c.L[1], id: 1 }] });
    await p.waitForTimeout(80);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: c.L[0], y: c.L[1], id: 1 }, { x: c.P[0], y: c.P[1], id: 2 }] });
    await p.waitForTimeout(30);
    const held1 = await p.evaluate(() => [...held]);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: c.L[0], y: c.L[1], id: 1 }] });
    await p.waitForTimeout(30);
    const held2 = await p.evaluate(() => [...held]);
    // slide finger from LEFT to RIGHT without lifting (common d-pad gesture)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: c.L[0], y: c.L[1], id: 3 }] });
    for (let i = 1; i <= 6; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: c.L[0] + (c.R[0] - c.L[0]) * i / 6, y: c.L[1], id: 3 }] }); await p.waitForTimeout(16); }
    const held3 = await p.evaluate(() => [...held]);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    out.multiTouch = { padSizes: c, holdLeftThenAttack: held1, afterReleasingLeft: held2, slideLeftToRight: held3 };
    // what is on top of the pad buttons in the landscape fight
    out.fightTopAt = await p.evaluate(c => Object.fromEntries(Object.entries(c).map(([k, v]) => { const e = document.elementFromPoint(v[0], v[1]); return [k, e ? (e.id || e.className || e.tagName) : null]; })), c);
    await ctx.close(); }
  // 3. landscape village: what receives a touch at the ATTACK / THROW button centres
  { const { ctx, p } = await page(b, L); await tap(p, '#ag-yes'); await tap(p, '#ld-play'); await p.waitForTimeout(1200);
    out.villageL = await p.evaluate(() => Object.fromEntries(['P', 'K', 'T', 'S', 'B', 'L', 'U'].map(k => { const e = document.querySelector('.pb[data-k="' + k + '"]'); if (!e) return [k, 'missing'];
      const r = e.getBoundingClientRect(); const t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return [k, t === e || e.contains(t) ? 'ok' : 'BLOCKED by ' + (t ? (t.id || String(t.className).split(' ')[0] || t.tagName) : 'null')]; })));
    await ctx.close(); }
  // 4. localStorage throws (Safari private mode / blocked storage)
  { const { ctx, p, errs } = await page(b, P, () => { const thr = () => { throw new DOMException('denied', 'SecurityError'); }; Storage.prototype.getItem = thr; Storage.prototype.setItem = thr; });
    await tap(p, '#ag-yes'); await tap(p, '#ld-play'); await p.waitForTimeout(500);
    await p.evaluate(() => { openSelect('cpu'); startCPU(); M.f[1].hp = 0; }).catch(e => errs.push('eval: ' + e.message.split('\n')[0]));
    await p.waitForTimeout(6500); out.storageThrows = { state: await state(p), errors: [...new Set(errs)].slice(0, 6) }; await ctx.close(); }
  // 5. a11y basics on landing + village + a menu
  { const { ctx, p } = await page(b, P);
    out.a11y = await p.evaluate(() => {
      const nameOf = e => (e.getAttribute('aria-label') || e.textContent || e.title || '').trim();
      const all = [...document.querySelectorAll('button,a[href],[role=button],input,select')];
      const unnamed = all.filter(e => !nameOf(e) && !(e.labels && e.labels.length)).map(e => e.id || e.className || e.tagName);
      const dialogs = [...document.querySelectorAll('[role=dialog]')].map(d => d.id);
      const panels = [...document.querySelectorAll('.panel')].length;
      const panelsWithRole = [...document.querySelectorAll('.panel[role],.panel [role=dialog]')].length;
      const ariaLive = document.querySelectorAll('[aria-live]').length;
      const canvasLabelled = [...document.querySelectorAll('canvas')].filter(c => c.getAttribute('aria-label') || c.getAttribute('role')).length;
      const focusVisibleRules = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch (e) { return []; } }).filter(r => /focus/.test(r.selectorText || '')).length;
      const outlineNone = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch (e) { return []; } }).filter(r => /outline:\s*(none|0)/.test(r.cssText || '')).length;
      const ag = document.getElementById('age-gate');
      return { interactive: all.length, unnamed: unnamed.slice(0, 12), unnamedCount: unnamed.length, dialogs, panels, panelsWithRole, ariaLive, canvases: document.querySelectorAll('canvas').length, canvasLabelled,
        focusRules: focusVisibleRules, outlineNoneRules: outlineNone, focusAfterLoad: document.activeElement && (document.activeElement.id || document.activeElement.tagName), ageGateFocusInside: !!(ag && ag.contains(document.activeElement)),
        htmlLang: document.documentElement.lang, viewport: document.querySelector('meta[name=viewport]').content };
    });
    // keyboard: tab order through age gate
    const order = []; for (let i = 0; i < 6; i++) { await p.keyboard.press('Tab'); order.push(await p.evaluate(() => { const e = document.activeElement; return (e.id || e.tagName) + ':' + (e.textContent || '').trim().slice(0, 14) + (document.getElementById('age-gate') && document.getElementById('age-gate').contains(e) ? '' : ' [OUTSIDE GATE]'); })); }
    out.a11y.tabOrderWithGateOpen = order;
    // Does the game turn Comfort mode on by itself when the OS asks for reduced motion?
    await p.emulateMedia({ reducedMotion: 'reduce' }); await p.reload(); await p.waitForTimeout(900);
    out.a11y.comfortOnWithReducedMotion = await p.evaluate(() => typeof COMFORT !== 'undefined' ? !!COMFORT.on : 'n/a');
    await ctx.close(); }
  // 6. contrast of key colour pairs
  { const hex = h => h.match(/\w\w/g).map(x => parseInt(x, 16) / 255).map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const lum = h => { const [r, g, bb] = hex(h); return 0.2126 * r + 0.7152 * g + 0.0722 * bb; };
    const cr = (a, c) => { const [x, y] = [lum(a), lum(c)].sort((m, n) => n - m); return +((x + 0.05) / (y + 0.05)).toFixed(2); };
    out.contrast = { 'ink #F3E9E4 on night #0A0506': cr('F3E9E4', '0A0506'), 'mute #E2CBC4 on night': cr('E2CBC4', '0A0506'), 'mute on card ~#4A2723': cr('E2CBC4', '4A2723'),
      'blood #C1121F on night': cr('C1121F', '0A0506'), 'red #D7262E on night (YOU LOSE)': cr('D7262E', '0A0506'), 'gold #FFB000 on night': cr('FFB000', '0A0506'),
      'line #B07E70 on night': cr('B07E70', '0A0506'), 'ink on DEMO badge? #1A0B0C on #F2C230': cr('1A0B0C', 'F2C230'), 'ATTACK label #F3E9E4 on #7A101A': cr('F3E9E4', '7A101A') }; }
  // 7. hostile online data: fake window.claude with malicious profiles / matches / presence
  { const FAKE = () => {
      window.__xss = 0; const X = '<img src=x onerror="window.__xss++">';
      const prof = { name: X, clan: X, x: X, main: X, av: X, avatar: X, wallet: X, owned: [X], bio: X };
      const data = {
        profiles: [['evil', prof], ['me1', { name: 'Me' }]],
        matches: [['m1', { season: 99, a: 'evil', b: 'me1', ka: X, kb: 'oni', map: 99, stake: X, w: 0, rounds: [2, 0], ts: 1 }], ['m2', { season: 99, a: X, b: 'me1', ka: 'oni', kb: 'oni', map: 0, stake: 50, w: 1, ts: 2 }]],
        tickets: [['evil', { days: X, mis: X }]], boss: [['evil', { kills: X, best: X }]], practice: [['evil', { best: X, kit: X }]], grants: [['evil', { admin: true }]] };
      const Q = (c, q) => ({ where: () => Q(c), orderBy: () => Q(c), limit: () => Q(c),
        onSnapshot(cb) { setTimeout(() => { if (c === 'matches') data.matches.forEach(m => { m[1].season = window.SEASON ? SEASON.n : m[1].season; }); cb({ docs: (data[c] || []).map(([id, d]) => ({ id, data: () => d })) }); }, 50); return () => {}; },
        doc: id => ({ id, set: async () => null, get: async () => ({ exists: false, id, data: () => null }), delete: async () => null }) });
      const peers = [{ peer: 'px', by: 'evil', presence: { v: { x: 'NaN', y: X, d: X, l: X, av: X, e: X, et: X, w: 1, ch: X, n: X, nm: X } } }];
      const room = { presence: async () => {}, onPeers(cb) { setTimeout(() => cb({ peers, joined: peers, left: [], updated: peers }), 100); return () => {}; }, peers: () => peers, leave() {}, join: async () => room };
      window.claude = { use: async cap => cap === 'db' ? { collection: c => Q(c) } : cap === 'user' ? { id: async () => 'me1', profiles: async () => ({ evil: { name: X } }) } : cap === 'room' ? room : null };
    };
    const { ctx, p, errs } = await page(b, P, FAKE); await tap(p, '#ag-yes'); await tap(p, '#ld-play'); await p.waitForTimeout(1500);
    const visited = [];
    for (const fn of ['openBoard', 'openProfile', 'openClans', 'openBoss', 'openTourney', 'openMissions', 'openChampions', 'openInventory', 'openStore']) {
      const r = await p.evaluate(fn => { try { if (fn === 'openBoard') { const b = document.getElementById('b-board'); b ? b.click() : (DB.tab = 'season', show('p-board'), renderBoard()); } else window[fn](); return 'ok'; } catch (e) { return 'THROW ' + e.message; } }, fn);
      await p.waitForTimeout(400); visited.push(fn + ':' + r); }
    const r2 = await p.evaluate(() => { try { PROFILE_VIEW = 'evil'; renderProfile(); return 'ok'; } catch (e) { return 'THROW ' + e.message; } }); visited.push('profile(evil):' + r2);
    await p.waitForTimeout(500);
    await p.evaluate(() => goHome()); await p.waitForTimeout(1500);
    out.hostile = { xssFired: await p.evaluate(() => window.__xss), visited, errors: [...new Set(errs)].slice(0, 10) };
    await ctx.close(); }
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
