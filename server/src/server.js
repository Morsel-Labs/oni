// ONI server: serves the game, runs accounts, the live database and the presence rooms.
const verify = require('./verify');
const geo = require('./geo');
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const { Store } = require('./store');
const { Rooms } = require('./rooms');
const rules = require('./rules');
const auth = require('./auth');
const httpx = require('./http');
const { createDbApi } = require('./dbapi');

const PORT = +process.env.PORT || 8080;
const DATA = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA, { recursive: true });
const store = new Store(path.join(DATA, 'oni.db'));
const rooms = new Rooms();
const dbapi = createDbApi(store);
const PUB = path.join(__dirname, '..', 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon' };

function json(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); }
const guard = httpx.createGuard({ indexFile: path.join(PUB, 'index.html') });
function body(req) { return httpx.readJson(req, httpx.bodyLimit(new URL(req.url, 'http://x').pathname)); }

async function handle(req, res) {
  const u = new URL(req.url, 'http://x');
  if (!guard(req, res, u.pathname)) return;
  if (u.pathname === '/health') return json(res, 200, { ok: true, rooms: rooms.rooms.size, conns: wss.clients.size });
  if (u.pathname === '/api/geo') return json(res, 200, geo.geoOf(req));
  if (u.pathname === '/api/verify' && req.method === 'POST') { const b = await body(req); if (!b || !b.proof) return json(res, 400, { ok: false, error: 'no_proof' }); const r = verify.verifyProof(b.proof); return json(res, 200, r); }
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
  handle(req, res).catch(e => { if (e && e.status) return httpx.reject(res, e.status, e.status === 413 ? 'body_too_large' : 'bad_request'); console.error('request error', e && e.message); if (!res.headersSent) { res.writeHead(500); } res.end(); });
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 300 * 1024 });
let seq = 0;
wss.on('connection', (ws, req) => {
  const conn = { ws, uid: null, peer: 'p' + (++seq).toString(36) + Math.random().toString(36).slice(2, 6), rooms: new Set(), alias: new Map(), subs: new Map(), tab: null,
    send(m) { if (ws.readyState === 1) ws.send(JSON.stringify(m)); } };
  if (!dbapi.accept(conn, ws, req)) return;
  ws.isAlive = true; ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || typeof m !== 'object') return;
    const reply = (ok, data, code, msg) => m.rid != null && conn.send(ok ? { t: 'ok', rid: m.rid, data } : { t: 'err', rid: m.rid, code, msg });
    if (!dbapi.admit(conn, m, reply)) return;
    try {
      if (dbapi.handle(conn, m, reply)) return;
      switch (m.t) {
        case 'hello': { const u = auth.byToken(store, m.token); if (!u) return reply(false, null, 'unauthenticated'); conn.uid = u.id; conn.tab = m.tab ? String(m.tab).slice(0, 32) : null; return reply(true, { id: u.id, peer: conn.peer }); }
        case 'join': { if (!conn.uid) return reply(false, null, 'unauthenticated'); let name = String(m.room || ''); if (!/^[a-z0-9#_-]{1,64}$/i.test(name)) return reply(false, null, 'invalid_argument');
          if (name === 'lobby') { name = rooms.lobbyFor(conn); conn.alias.set(name, 'lobby'); } rooms.join(conn, name); return reply(true, { room: m.room }); }
        case 'leave': { const name = m.room === 'lobby' ? [...conn.alias.entries()].find(([, a]) => a === 'lobby')?.[0] : m.room; if (name) rooms.leave(conn, name); return reply(true, null); }
        case 'pres': { const name = m.room === 'lobby' ? [...conn.alias.entries()].find(([, a]) => a === 'lobby')?.[0] : m.room; const e = name ? rooms.presence(conn, name, m.patch) : 'not_found'; if (e) return reply(false, null, e); return; }
      }
    } catch (e) { reply(false, null, e.code || 'upstream_error'); }
  });
  ws.on('close', () => { rooms.leaveAll(conn); for (const s of conn.subs.values()) store.unsubscribe(s); });
});
setInterval(() => { for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; ws.ping(); } }, 15000);
process.on('unhandledRejection', e => console.error('unhandled rejection', e && e.message));
server.listen(PORT, () => console.log(`ONI server on :${PORT}`));
