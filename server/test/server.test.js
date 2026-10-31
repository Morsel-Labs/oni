// End-to-end: a real server process on a free port with a throwaway database.
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('child_process');
const os = require('os'), fs = require('fs'), path = require('path'), net = require('net');
const WebSocket = require('ws');
const { seasonOf, dayKey } = require('../src/schema');

let BASE, proc;
const freePort = () => new Promise(r => { const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => r(p)); }); });
test.before(async () => {
  const port = await freePort();
  BASE = 'http://127.0.0.1:' + port;
  const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'oni-e2e-'));
  proc = spawn(process.execPath, [path.join(__dirname, '..', 'src', 'server.js')], { env: Object.assign({}, process.env, { PORT: String(port), DATA_DIR, WS_MAX_PER_IP: '8', TRUST_PROXY: '' }), stdio: ['ignore', 'pipe', 'pipe'] });
  proc.stderr.on('data', d => process.stderr.write(d));
  await new Promise((ok, no) => { proc.stdout.on('data', d => { if (/ONI server on/.test(d)) ok(); }); proc.on('exit', c => no(new Error('server exited ' + c))); });
});
test.after(() => proc && proc.kill());

const post = (p, body, headers) => fetch(BASE + p, { method: 'POST', body, headers });
function client(token) {
  return new Promise((ok, no) => {
    const ws = new WebSocket(BASE.replace('http', 'ws') + '/ws'); let rid = 0; const pend = new Map(), snaps = new Map();
    ws.on('message', d => { const m = JSON.parse(d); if (m.rid && pend.has(m.rid)) { pend.get(m.rid)(m); pend.delete(m.rid); } if (m.t === 'snap' && snaps.has(m.sid)) snaps.get(m.sid)(m.docs); });
    const call = msg => new Promise(r => { const id = ++rid; pend.set(id, r); ws.send(JSON.stringify(Object.assign({ rid: id }, msg))); setTimeout(() => r({ t: 'timeout' }), 1500); });
    const sub = (coll, q, sid) => new Promise(r => { snaps.set(sid, r); ws.send(JSON.stringify({ t: 'sub', rid: 1000 + sid, sid, coll, q })); pend.set(1000 + sid, m => r(m)); setTimeout(() => r(null), 800); });
    ws.on('open', async () => { if (token) { const h = await call({ t: 'hello', token, tab: 't' }); ws.uid = h.data && h.data.id; } ok({ ws, call, sub, close: () => ws.close() }); });
    ws.on('error', no);
  });
}
let A, B, a, b;
test('guest accounts and authenticated sockets', async () => {
  a = await (await post('/api/guest')).json(); b = await (await post('/api/guest')).json();
  A = await client(a.token); B = await client(b.token);
  assert.equal(A.ws.uid, a.id);
});

test('reads: no auth means no reads; private space is owner-only', async () => {
  assert.equal((await A.call({ t: 'set', coll: 'data/users/' + a.id, id: 'inv', data: { owned: ['oni'], ts: Date.now() } })).t, 'ok');
  const anon = await client(null);
  const g = await anon.call({ t: 'get', coll: 'data/users/' + a.id, id: 'inv' });
  assert.equal(g.t, 'err'); assert.equal(g.code, 'unauthenticated');
  const s = await anon.sub('profiles', {}, 1);
  assert.ok(!Array.isArray(s), 'anonymous subscription must not get docs');
  assert.equal((await B.call({ t: 'get', coll: 'data/users/' + a.id, id: 'inv' })).code, 'not_permitted');
  assert.equal((await B.sub('data/users/' + a.id, {}, 2)).code, 'not_permitted');
  assert.deepEqual((await A.call({ t: 'get', coll: 'data/users/' + a.id, id: 'inv' })).data.owned, ['oni']);
  assert.equal((await A.sub('users', {}, 3)).code, 'not_permitted');
  const docs = await A.sub('matches', { where: [['season', '==', seasonOf(Date.now())]], orderBy: ['ts', 'asc'], limit: 1000 }, 4);
  assert.ok(Array.isArray(docs));
  assert.equal((await anon.call({ t: 'names', ids: [a.id] })).code, 'unauthenticated');
  anon.close();
});

test('every write the game makes is accepted', async () => {
  const now = Date.now(), today = dayKey(now);
  const writes = [
    ['profiles', a.id, { name: 'TestA_' + a.id.slice(-4).replace(/[^A-Za-z0-9_]/g, '_'), wallet: '1'.repeat(44), walletApp: 'Phantom', main: 'oni', ts: now, created: now, av: null, x: null, friends: [], clan: null, ref: null }],
    ['practice', a.id, { best: 1, kit: 'oni', ts: now }],
    ['tickets', a.id, { days: [today], ts: now }],
    ['boss', a.id, { kills: 1, best: 1, ts: now }],
    ['matches', String(Math.floor(Math.random() * 1e9)), { season: seasonOf(now), ta: 0, tb: 0, fm: 'bo3', a: a.id, b: b.id, ka: 'oni', kb: 'ryu', map: 0, stake: 0, w: 0, rounds: [2, 1], ts: now }],
    ['data/users/' + a.id, 'inv', { owned: ['oni', 'saru'], ts: now }],
  ];
  for (const [coll, id, data] of writes) { const r = await A.call({ t: 'set', coll, id, data }); assert.equal(r.t, 'ok', coll + ': ' + r.code + ' ' + r.msg); }
  const prof = (await A.call({ t: 'get', coll: 'profiles', id: a.id })).data;
  assert.equal((await A.call({ t: 'set', coll: 'profiles', id: a.id, data: Object.assign({}, prof, { xp: 30, ts: Date.now() }) })).t, 'ok');
  assert.equal((await A.call({ t: 'set', coll: 'tickets', id: a.id, data: { days: [today], mis: { [today]: ['win2'] }, ts: Date.now() } })).t, 'ok');
  assert.equal((await A.call({ t: 'del', coll: 'profiles', id: a.id })).t, 'ok');
});

test('attacks from the audit fail', async () => {
  const now = Date.now();
  const m = { season: seasonOf(now), ta: 0, tb: 0, fm: 'bo3', a: a.id, b: b.id, ka: 'oni', kb: 'ryu', map: 1, stake: 1000, w: 0, rounds: [2, 0], ts: now };
  assert.equal((await A.call({ t: 'set', coll: 'matches', id: '1001', data: m })).t, 'ok');
  const ov = await B.call({ t: 'set', coll: 'matches', id: '1001', data: Object.assign({}, m, { w: 1, rounds: [0, 2] }) });
  assert.equal(ov.t, 'err'); assert.match(ov.msg, /already/);
  assert.equal((await B.call({ t: 'set', coll: 'matches', id: '1002', data: Object.assign({}, m, { a: b.id, b: 'nobody', stake: 1e9 }) })).t, 'err');
  assert.equal((await B.call({ t: 'del', coll: 'matches', id: '1001' })).t, 'err');
  const days = Array.from({ length: 365 }, (_, i) => dayKey(now - i * 864e5));
  assert.equal((await B.call({ t: 'set', coll: 'tickets', id: b.id, data: { days, ts: now } })).t, 'err');
  assert.equal((await B.call({ t: 'set', coll: 'boss', id: b.id, data: { kills: 99999, best: 99, ts: now } })).t, 'err');
  assert.equal((await B.call({ t: 'set', coll: 'profiles', id: b.id, data: { name: '<img src=x onerror=alert(1)>' } })).t, 'err');
  assert.equal((await B.call({ t: 'set', coll: 'profiles', id: b.id, data: { name: 'Bob_ok', admin: true } })).t, 'err');
  assert.equal((await B.call({ t: 'set', coll: 'grants', id: b.id, data: { admin: true, by: b.id } })).t, 'err');
  assert.equal((await B.call({ t: 'set', coll: 'profiles', id: a.id, data: { name: 'Hijack' } })).code, 'not_permitted');
});

test('write rate limit per user', async () => {
  const now = Date.now(); let limited = 0;
  const rs = await Promise.all(Array.from({ length: 80 }, (_, i) => B.call({ t: 'set', coll: 'data/users/' + b.id, id: 'inv', data: { owned: ['k' + i], ts: now } })));
  for (const r of rs) if (r.code === 'rate_limited') limited++;
  assert.ok(limited > 0, 'some writes must be rate limited');
});

test('HTTP: security headers, CSP, methods, body limits, bad URLs', async () => {
  const r = await fetch(BASE + '/');
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(r.headers.get('referrer-policy'));
  const csp = r.headers.get('content-security-policy');
  assert.match(csp, /frame-ancestors 'none'/); assert.match(csp, /fonts\.gstatic\.com/); assert.match(csp, /'sha256-/);
  assert.equal((await fetch(BASE + '/api/guest')).status, 405);
  assert.equal((await fetch(BASE + '/index.html', { method: 'DELETE' })).status, 405);
  assert.equal((await post('/api/nonce', 'x'.repeat(10000))).status, 413);
  assert.equal((await post('/api/verify', 'x'.repeat(7e5))).status, 413);
  assert.equal((await fetch(BASE + '/%E0%A4%A')).status, 400);
  assert.equal((await fetch(BASE + '/health')).status, 200);
});

test('rate limits: guest creation per IP, X-Forwarded-For ignored without TRUST_PROXY, ws connections per IP', async () => {
  const codes = await Promise.all(Array.from({ length: 30 }, (_, i) => post('/api/guest', null, { 'X-Forwarded-For': '9.9.9.' + i }).then(r => r.status)));
  assert.ok(codes.filter(c => c === 200).length <= 10, 'burst of 10 per IP');
  assert.ok(codes.includes(429));
  const socks = [];
  for (let i = 0; i < 12; i++) socks.push(new WebSocket(BASE.replace('http', 'ws') + '/ws'));
  const closed = await Promise.all(socks.map(s => new Promise(r => { s.on('close', c => r(c)); s.on('error', () => {}); setTimeout(() => r(null), 800); })));
  assert.ok(closed.filter(c => c === 1013).length >= 4, 'sockets beyond the per-IP cap are closed');
  socks.forEach(s => s.terminate());
  A.close(); B.close();
});
