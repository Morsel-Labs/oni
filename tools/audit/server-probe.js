// Defensive probe of the ONI server rules. Run ONLY against a local test instance you own.
// Usage: NODE_PATH=server/node_modules node tools/audit/server-probe.js http://localhost:8080
// Prints PASS/FAIL per expectation (FAIL = a weakness was confirmed). The last check crashes a vulnerable server.
const WebSocket = require('ws');
const BASE = process.argv[2] || 'http://localhost:8080';
const WS = BASE.replace(/^http/, 'ws') + '/ws';
const out = [];
const res = (name, weak, detail) => out.push(`${weak ? 'FAIL' : 'PASS'} ${name}${detail ? ' :: ' + detail : ''}`);
const post = (p, b) => fetch(BASE + p, { method: 'POST', body: b ? JSON.stringify(b) : undefined }).then(r => r.json());
function client(token) {
  return new Promise(ok => {
    const ws = new WebSocket(WS); let rid = 0; const pend = new Map(), snaps = new Map();
    ws.on('message', d => { const m = JSON.parse(d); if (m.rid && pend.has(m.rid)) { pend.get(m.rid)(m); pend.delete(m.rid); } if (m.t === 'snap') (snaps.get(m.sid) || (() => {}))(m.docs); });
    const call = msg => new Promise(r => { const id = ++rid; pend.set(id, r); ws.send(JSON.stringify(Object.assign({ rid: id }, msg))); setTimeout(() => r({ t: 'timeout' }), 1500); });
    const sub = (coll, sid) => new Promise(r => { snaps.set(sid, r); ws.send(JSON.stringify({ t: 'sub', sid, coll, q: {} })); setTimeout(() => r(null), 1500); });
    ws.on('open', async () => { if (token) await call({ t: 'hello', token }); ok({ ws, call, sub }); });
  });
}
(async () => {
  const a = await post('/api/guest'), b = await post('/api/guest');
  const A = await client(a.token), B = await client(b.token);
  // 1. private inventory readable by others / unauthenticated
  await A.call({ t: 'set', coll: 'data/users/' + a.id, id: 'inv', data: { owned: ['secret-skin'] } });
  const anon = await client(null);
  const g = await anon.call({ t: 'get', coll: 'data/users/' + a.id, id: 'inv' });
  res("unauthenticated client cannot read another player's private inventory", g.t === 'ok' && g.data, JSON.stringify(g.data));
  const s = await anon.sub('profiles', 1);
  res('unauthenticated client cannot subscribe to collections', Array.isArray(s), s ? `got ${s.length} docs` : '');
  // 2. matches: overwrite someone else's match record / invent one
  await A.call({ t: 'set', coll: 'matches', id: 'm1', data: { a: a.id, b: b.id, w: 0, season: 1, ts: 1 } });
  const ov = await B.call({ t: 'set', coll: 'matches', id: 'm1', data: { a: b.id, b: a.id, w: 0, season: 1, ts: 1 } });
  res('player cannot overwrite a match record written by someone else', ov.t === 'ok');
  const forged = await B.call({ t: 'set', coll: 'matches', id: 'fake' + Date.now(), data: { a: b.id, b: 'nobody', w: 0, stake: 1e9, season: 1, ts: Date.now() } });
  res('player cannot invent a won match (leaderboard forgery)', forged.t === 'ok');
  // 3. airdrop tickets / boss stats self-granted
  const days = Array.from({ length: 365 }, (_, i) => 'd' + i);
  const tk = await A.call({ t: 'set', coll: 'tickets', id: a.id, data: { days, ts: Date.now() } });
  res('player cannot self-grant 365 airdrop days in one write', tk.t === 'ok');
  const bs = await A.call({ t: 'set', coll: 'boss', id: a.id, data: { kills: 99999, best: 99, ts: Date.now() } });
  res('player cannot self-report boss kills', bs.t === 'ok');
  // 4. HTML in profile name accepted verbatim
  const x = await A.call({ t: 'set', coll: 'profiles', id: a.id, data: { name: '<img src=x onerror=alert(1)>' } });
  res('server rejects HTML in profile names', x.t === 'ok');
  // 5. join arbitrary room names
  const j = await B.call({ t: 'join', room: 'match-anything' });
  res('player cannot join arbitrary private rooms', j.t === 'ok');
  // 6. guest creation is rate-limited
  let n = 0; await Promise.all(Array.from({ length: 200 }, () => post('/api/guest').then(r => r.token && n++).catch(() => {})));
  res('guest account creation is rate-limited (200 in a burst)', n === 200, `${n}/200 created`);
  // 7. nonce map growth
  let k = 0; for (let i = 0; i < 300; i++) { const w = ('1'.repeat(32 - String(i).length) + i).replace(/0/g, '2'); const r = await post('/api/nonce', { wallet: w }); if (r.message) k++; }
  res('wallet nonces are bounded (300 random wallets)', k === 300, `${k} nonces stored, never pruned`);
  // 8. malformed URL crashes the process (run last)
  await fetch(BASE + '/%E0%A4%A').catch(() => {});
  await new Promise(r => setTimeout(r, 400));
  const alive = await fetch(BASE + '/health').then(r => r.ok).catch(() => false);
  res('server survives GET /%E0%A4%A (malformed percent-encoding)', !alive, alive ? 'alive' : 'PROCESS CRASHED');
  console.log(out.join('\n'));
  process.exit(0);
})();
