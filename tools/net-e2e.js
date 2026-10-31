// Two real browsers play an authoritative online 1v1 against a local ONI server.
//   (cd server && PORT=8124 DATA_DIR=/tmp/net-data node src/server.js &)
//   node tools/net-e2e.js [http://localhost:8124] [/tmp/net-shots]
const { chromium } = require('playwright');
const fs = require('fs');
const URL = process.argv[2] || 'http://localhost:8124', OUT = process.argv[3] || '/tmp/net-shots';
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(pg, js, ms, what) { const t = Date.now(); while (Date.now() - t < ms) { if (await pg.evaluate(js).catch(() => false)) return; await sleep(100); } throw new Error('timeout: ' + what); }
const state = pg => pg.evaluate(() => ({ mode, seat: NET.seat, auth: !!NET.auth, scene: M && M.scene, t: M && M.sceneT, seq: M && M.seq, hp: M && M.f.map(f => f.hp), x: M && M.f.map(f => Math.round(f.x)), snaps: NETA.snaps.length }));

(async () => {
  const b = await chromium.launch();
  const open = async name => {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const pg = await ctx.newPage(); const errs = [];
    await pg.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' })); await pg.route('**/fonts.gstatic.com/**', r => r.abort());
    pg.on('pageerror', e => errs.push(String(e))); await pg.goto(URL); await pg.click('#ag-yes', { timeout: 10000 });
    await until(pg, '!!(NET.mt && DB.me)', 10000, name + ' match capability'); return { pg, errs };
  };
  const A = await open('A'), B = await open('B');
  let ok = true; const log = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); ok = ok && c; };
  log(await A.pg.evaluate('!!NET.mt') && await B.pg.evaluate('!!NET.mt'), 'both pages got the authoritative match capability');
  // host creates the room
  await A.pg.evaluate(() => { openSelect('online'); SEL.map = 0; SEL.low = 0; SEL.fmt = 'ko'; buildFormats(); });
  await A.pg.evaluate(() => { document.querySelector('#sel-actions button.gold').click(); });
  await until(A.pg, "mode==='hostwait' && NET.auth && NET.seat===0", 8000, 'host waiting');
  const code = await A.pg.evaluate("document.getElementById('mycode').textContent");
  log(/^[A-Z0-9]{4}$/.test(code), 'host room code ' + code);
  // guest joins with the code and accepts the stake review
  await B.pg.evaluate(() => openSelect('online'));
  await B.pg.fill('#codein', code); await B.pg.evaluate(() => joinMatch());
  await until(B.pg, "document.getElementById('p-stake').classList.contains('on')", 8000, 'stake review');
  await B.pg.click('#b-accept');
  await until(A.pg, "mode==='net'", 8000, 'host in fight'); await until(B.pg, "mode==='net' && NET.seat===1", 8000, 'guest in fight');
  log(true, 'both players are in the authoritative fight (host seat 0, guest seat 1)');
  await until(A.pg, "M && M.scene==='fight'", 15000, 'fight scene');
  const s0 = [await state(A.pg), await state(B.pg)];
  // host walks in and punches, guest walks back
  await A.pg.bringToFront(); await A.pg.keyboard.down('KeyD'); await B.pg.keyboard.down('KeyA');
  for (let i = 0; i < 10; i++) { await A.pg.keyboard.press('KeyJ'); await sleep(120); }
  await A.pg.screenshot({ path: OUT + '/host-midfight.png' }); await B.pg.screenshot({ path: OUT + '/guest-midfight.png' });
  for (let i = 0; i < 20; i++) { await A.pg.keyboard.press('KeyJ'); await sleep(110); }
  await A.pg.keyboard.up('KeyD'); await B.pg.keyboard.up('KeyA'); await sleep(300);
  const s1 = [await state(A.pg), await state(B.pg)];
  console.log('before', JSON.stringify(s0)); console.log('after ', JSON.stringify(s1));
  log(s1[0].seq > s0[0].seq + 100 && s1[1].seq > s0[1].seq + 100, 'server frames advance in both pages');
  log(Math.abs(s1[0].seq - s1[1].seq) < 30, 'both pages show (nearly) the same server frame');
  log(s1[0].x[0] !== s0[0].x[0] && s1[1].x[0] === s1[0].x[0] || Math.abs(s1[1].x[0] - s1[0].x[0]) < 12, 'host movement is visible in both pages');
  log(s1[0].hp[1] < s0[0].hp[1] || s1[0].scene !== 'fight', 'host punches land on the guest (server-side)');
  log(JSON.stringify(s1[0].hp) === JSON.stringify(s1[1].hp) || s1[0].scene !== s1[1].scene, 'both pages agree on health');
  log(!A.errs.length && !B.errs.length, 'no page errors ' + JSON.stringify(A.errs.concat(B.errs).slice(0, 3)));
  console.log('screenshots:', OUT + '/host-midfight.png', OUT + '/guest-midfight.png');
  await b.close(); process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
