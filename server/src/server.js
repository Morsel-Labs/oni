// ONI server: serves the game, runs accounts, the live database and the presence rooms.
const verify = require('./verify');
const geo = require('./geo');
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const { Store } = require('./store');
const { Rooms } = require('./rooms');
const rules = require('./rules');
const auth = require('./auth');
const { Matches } = require('./match');

const PORT = +process.env.PORT || 8080;
const DATA = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA, { recursive: true });
const store = new Store(path.join(DATA, 'oni.db'));
const rooms = new Rooms();
const matches = new Matches({ store }); // authoritative 1v1 (Phase 2)
const PUB = path.join(__dirname, '..', 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon' };

function json(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); }
function body(req, max) { max = max || 1e5; return new Promise(r => { let b = ''; req.on('data', c => { b += c; if (b.length > max) req.destroy(); }); req.on('end', () => { try { r(JSON.parse(b || '{}')); } catch (e) { r({}); } }); }); }

async function handle(req, res) {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/health') return json(res, 200, { ok: true, rooms: rooms.rooms.size, conns: wss.clients.size });
  if (u.pathname === '/api/geo') return json(res, 200, geo.geoOf(req));
  if (u.pathname === '/api/verify' && req.method === 'POST') { const b = await body(req, 6e5); if (!b || (!b.proof && typeof b.id !== 'string')) return json(res, 400, { ok: false, error: 'no_proof' }); const r = b.proof ? verify.verifyProof(b.proof) : matches.verifyStored(b.id, verify.verifyProof); return json(res, 200, r); }
  if (u.pathname === '/api/guest' && req.method === 'POST') return json(res, 200, auth.guest(store));
  if (u.pathname === '/api/nonce' && req.method === 'POST') { const b = await body(req); if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(b.wallet || '')) return json(res, 400, { error: 'bad_wallet' }); return json(res, 200, { message: auth.nonce(b.wallet) }); }
  if (u.pathname === '/api/wallet' && req.method === 'POST') { const b = await body(req); const r = auth.walletLogin(store, b.token, b.wallet, b.signature); return json(res, r.error ? 401 : 200, r); }
  if (u.pathname === '/api/leaderboard') { const season = +u.searchParams.get('season') || 0; return json(res, 200, store.query('matches', { where: season ? [['season', '==', season]] : [], orderBy: ['ts', 'asc'], limit: 1000 }).map(d => d.data)); }
  // static files
  let p; try { p = decodeURIComponent(u.pathname); } catch (e) { res.writeHead(400); return res.end('Bad request'); }
  if (p === '/') p = '/index.html';
  const f = path.normalize(path.join(PUB, p)); if (!f.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end('Not found'); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': p.endsWith('.html') ? 'no-cache' : 'max-age=3600' }); res.end(data); });
}
const server = http.createServer((req, res) => {
  handle(req, res).catch(e => { console.error('request error', e && e.message); if (!res.headersSent) { res.writeHead(500); } res.end(); });
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 300 * 1024 });
let seq = 0;
wss.on('connection', ws => {
  const conn = { ws, uid: null, peer: 'p' + (++seq).toString(36) + Math.random().toString(36).slice(2, 6), rooms: new Set(), alias: new Map(), subs: new Map(), tab: null,
    rate: { t: Date.now(), n: 0 }, send(m) { if (ws.readyState === 1) ws.send(JSON.stringify(m)); } };
  ws.isAlive = true; ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', raw => {
    // simple flood guard: 120 messages per second per connection
    const now = Date.now(); if (now - conn.rate.t > 1000) { conn.rate = { t: now, n: 0 }; } if (++conn.rate.n > 120) return;
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    const reply = (ok, data, code) => m.rid != null && conn.send(ok ? { t: 'ok', rid: m.rid, data } : { t: 'err', rid: m.rid, code });
    try {
      switch (m.t) {
        case 'hello': { const u = auth.byToken(store, m.token); if (!u) return reply(false, null, 'unauthenticated'); conn.uid = u.id; conn.tab = m.tab || null; return reply(true, { id: u.id, peer: conn.peer }); }
        case 'sub': { if (!rules.canRead(m.coll)) return reply(false, null, 'not_permitted'); const sub = { coll: m.coll, q: m.q || {}, push: docs => conn.send({ t: 'snap', sid: m.sid, docs }) }; conn.subs.set(m.sid, sub); store.subscribe(sub); return; }
        case 'unsub': { const s = conn.subs.get(m.sid); if (s) { store.unsubscribe(s); conn.subs.delete(m.sid); } return; }
        case 'get': { if (!rules.canRead(m.coll) || !rules.validId(m.id)) return reply(false, null, 'not_permitted'); return reply(true, store.get(m.coll, m.id)); }
        case 'set': { if (!rules.validId(m.id) || matches.protects(m.coll, m.id) || !rules.canWrite(conn.uid, m.coll, m.id, false)) return reply(false, null, 'not_permitted'); store.set(m.coll, m.id, m.data || {}); return reply(true, null); }
        case 'del': { if (!rules.validId(m.id) || matches.protects(m.coll, m.id) || !rules.canWrite(conn.uid, m.coll, m.id, true)) return reply(false, null, 'not_permitted'); store.del(m.coll, m.id); return reply(true, null); }
        case 'names': { const out = {}; for (const id of (m.ids || []).slice(0, 200)) { const p = store.get('profiles', String(id)); if (p && p.name) out[id] = { name: p.name }; } return reply(true, out); }
        case 'join': { if (!conn.uid) return reply(false, null, 'unauthenticated'); let name = String(m.room || ''); if (!/^[a-z0-9#_-]{1,64}$/i.test(name)) return reply(false, null, 'invalid_argument');
          if (name === 'lobby') { name = rooms.lobbyFor(conn); conn.alias.set(name, 'lobby'); } rooms.join(conn, name); return reply(true, { room: m.room }); }
        case 'leave': { const name = m.room === 'lobby' ? [...conn.alias.entries()].find(([, a]) => a === 'lobby')?.[0] : m.room; if (name) rooms.leave(conn, name); return reply(true, null); }
        case 'mh': case 'mp': case 'mj': case 'mw': case 'mi': case 'mr': case 'ml': return matches.handle(conn, m, reply); // authoritative 1v1: src/match.js
        case 'pres': { const name = m.room === 'lobby' ? [...conn.alias.entries()].find(([, a]) => a === 'lobby')?.[0] : m.room; const e = name ? rooms.presence(conn, name, m.patch) : 'not_found'; if (e) return reply(false, null, e); return; }
      }
    } catch (e) { reply(false, null, e.code || 'upstream_error'); }
  });
  ws.on('close', () => { matches.drop(conn); rooms.leaveAll(conn); for (const s of conn.subs.values()) store.unsubscribe(s); });
});
setInterval(() => { for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; ws.ping(); } }, 15000);
server.listen(PORT, () => console.log(`ONI server on :${PORT}`));
