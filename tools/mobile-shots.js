// Mobile QA harness. Builds nothing: run `npm run build` first.
// Usage: node tools/mobile-shots.js [outDir] [--only=fight,village,...] [--devices=P,L,Ps]
// Writes PNG screenshots per device and screen, plus report.json with layout problems:
//   small touch targets (<40px), horizontal overflow, interactive elements overlapping
//   the fight area, elements off-screen, page errors.
// Uses the pre-installed Playwright (require('playwright')); no install needed.
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const OUT = path.resolve(args.find(a => !a.startsWith('--')) || '/tmp/oni-shots');
const opt = k => (args.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const ONLY = opt('only') ? opt('only').split(',') : null;
const URL = 'file://' + path.resolve(__dirname, '..', 'dist', 'oni-fighter.html');
const DEV = {
  P: { width: 390, height: 844 },   // iPhone 13/14 portrait
  L: { width: 844, height: 390 },   // iPhone 13/14 landscape
  Ps: { width: 360, height: 640 },  // small Android portrait
  Ls: { width: 640, height: 360 },  // small Android landscape
};
const DEVS = (opt('devices') || 'P,L,Ps,Ls').split(',');
fs.mkdirSync(OUT, { recursive: true });

// Screens: name -> async (page) => void. Each starts from a fresh, age-verified page.
const SCREENS = {
  landing: async p => { await p.evaluate(() => show('p-landing')); },
  village: async p => { await p.click('#ld-play', { force: true }).catch(() => {}); await p.waitForTimeout(1500); },
  vmenu: async p => { await p.click('#ld-play', { force: true }).catch(() => {}); await p.waitForTimeout(1200);
    await p.evaluate(() => { const b = [...document.querySelectorAll('#dock button')].find(b => /menu/i.test(b.textContent)); b && b.click(); }); },
  select: async p => { await p.evaluate(() => openSelect('cpu')); },
  fight: async p => { await p.evaluate(() => { openSelect('cpu'); startCPU(); }); await p.waitForTimeout(5500); },
  training: async p => { await p.evaluate(() => { const b = document.getElementById('b-training'); b && b.click(); }); await p.waitForTimeout(2500); },
  tutorial: async p => { await p.evaluate(() => { const b = document.getElementById('b-tut'); b && b.click(); }); await p.waitForTimeout(2500); },
  end: async p => { await p.evaluate(() => { openSelect('cpu'); startCPU(); M.f[1].hp = 0; }); await p.waitForTimeout(7000); },
  store: async p => { await p.evaluate(() => openStore()); },
  profile: async p => { await p.evaluate(() => openProfile()); },
  tourney: async p => { await p.evaluate(() => openTourney()); },
  boss: async p => { await p.evaluate(() => openBoss()); },
  how: async p => { await p.evaluate(() => openHow()); },
  missions: async p => { await p.evaluate(() => openMissions()); },
  clans: async p => { await p.evaluate(() => openClans()); },
  settings: async p => { await p.evaluate(() => openSettings()); },
  inventory: async p => { await p.evaluate(() => openInventory()); },
  champions: async p => { await p.evaluate(() => openChampions()); },
  cauldron: async p => { await p.evaluate(() => openCauldrons()); },
  controls: async p => { await p.evaluate(() => openControls()); },
  legal: async p => { await p.evaluate(() => openLegal()); },
  board: async p => { await p.evaluate(() => { const b = document.getElementById('b-board'); b && b.click(); }); },
};

async function audit(p) {
  return p.evaluate(() => {
    const vw = innerWidth, vh = innerHeight, out = { small: [], offscreen: [], overlapFight: [], hOverflow: false };
    out.hOverflow = document.documentElement.scrollWidth > vw + 1;
    const visible = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
    const label = el => (el.id ? '#' + el.id : el.className ? '.' + String(el.className).split(' ')[0] : el.tagName) + ' "' + (el.textContent || '').trim().slice(0, 18) + '"';
    const inter = [...document.querySelectorAll('button,a[href],input,select,.pb,[role=button]')].filter(visible);
    for (const el of inter) {
      const r = el.getBoundingClientRect();
      // only things actually on screen in the scroll container's visible area
      const top = document.elementFromPoint(Math.min(vw - 1, Math.max(0, r.x + r.width / 2)), Math.min(vh - 1, Math.max(0, r.y + r.height / 2)));
      const onTop = top && (top === el || el.contains(top));
      if (r.bottom < 0 || r.top > vh) continue;
      if (onTop && (r.width < 40 || r.height < 40)) out.small.push(label(el) + ` ${r.width | 0}x${r.height | 0}`);
      if (r.right > vw + 2 || r.left < -2) out.offscreen.push(label(el));
    }
    // overlap with fight canvas when in a fight
    const inFight = typeof M !== 'undefined' && M && !document.body.classList.contains('menu');
    if (inFight) {
      const c = document.getElementById('cv').getBoundingClientRect();
      for (const el of inter) { const r = el.getBoundingClientRect();
        const ix = Math.max(0, Math.min(r.right, c.right) - Math.max(r.left, c.left)), iy = Math.max(0, Math.min(r.bottom, c.bottom) - Math.max(r.top, c.top));
        if (ix * iy > 0.25 * r.width * r.height) out.overlapFight.push(label(el)); }
      out.canvas = [c.x, c.y, c.width, c.height].map(v => v | 0);
      out.canvasShare = +((c.width * c.height) / (vw * vh)).toFixed(2);
    }
    return out;
  });
}

(async () => {
  const b = await chromium.launch();
  const report = {};
  for (const d of DEVS) {
    for (const [name, fn] of Object.entries(SCREENS)) {
      if (ONLY && !ONLY.includes(name)) continue;
      const ctx = await b.newContext({ viewport: DEV[d], deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent });
      const p = await ctx.newPage(); const errs = [];
      p.on('pageerror', e => errs.push(e.message));
      p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
      await p.goto(URL); await p.waitForTimeout(700);
      await p.click('#ag-yes', { force: true, timeout: 2000 }).catch(() => {});
      await p.waitForTimeout(300);
      try { await fn(p); } catch (e) { errs.push('screen: ' + e.message.split('\n')[0]); }
      await p.waitForTimeout(800);
      const file = path.join(OUT, `${d}-${name}.png`);
      await p.screenshot({ path: file });
      const a = await audit(p).catch(e => ({ err: e.message }));
      a.errors = errs.slice(0, 5);
      report[`${d}-${name}`] = a;
      const flags = [a.hOverflow && 'H-OVERFLOW', a.small && a.small.length && `small:${a.small.length}`, a.offscreen && a.offscreen.length && `off:${a.offscreen.length}`,
        a.overlapFight && a.overlapFight.length && `overFight:${a.overlapFight.length}`, a.canvasShare != null && `canvas:${a.canvasShare}`, errs.length && `ERR:${errs.length}`].filter(Boolean);
      console.log(`${d}-${name}`.padEnd(20), flags.join(' '));
      await ctx.close();
    }
  }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
  console.log('Wrote', OUT);
  await b.close();
})();
