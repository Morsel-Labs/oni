// The websocket side of the database (sub/unsub/get/set/del/names) plus per-connection limits.
// The wire protocol is the one public/shim.js speaks; only the server-side checks are new.
const rules = require('./rules');
const { Limiter, Counter, Bucket, clientIp } = require('./ratelimit');

const env = (k, d) => (process.env[k] != null && process.env[k] !== '' ? +process.env[k] : d);
const MAX_SUBS = env('WS_MAX_SUBS', 32);
const MAX_DROPS = 2000;   // messages dropped in a row before the socket is closed

function createDbApi(store) {
  const writes = new Limiter({ rate: env('WRITE_RATE', 5), burst: env('WRITE_BURST', 40) });       // per user, all connections
  const matchWrites = new Limiter({ rate: 1 / 20, burst: 3 });                                      // a real match takes longer than 20 s
  const conns = new Counter(env('WS_MAX_PER_IP', 16));
  const origins = new Set((process.env.WS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean));

  // Call on 'connection'. Returns false (and closes the socket) when the IP has too many sockets or the Origin is not allowed.
  function accept(conn, ws, req) {
    conn.ip = clientIp(req);
    if (origins.size && !origins.has(String(req.headers.origin || ''))) { ws.close(1008, 'origin'); return false; }
    if (!conns.open(conn.ip)) { ws.close(1013, 'too many connections'); return false; }
    conn.msgs = new Bucket(env('WS_MSG_RATE', 120), env('WS_MSG_BURST', 240)); conn.drops = 0;
    ws.on('close', () => conns.close(conn.ip));
    return true;
  }

  // Per-connection flood guard. Calls with a rid get an error so the client promise settles.
  function admit(conn, m, reply) {
    if (!conn.msgs || conn.msgs.take(1)) { conn.drops = 0; return true; }
    if (++conn.drops > MAX_DROPS) conn.ws.terminate();
    reply(false, null, 'rate_limited');
    return false;
  }

  function writeAllowed(conn, coll) {
    if (!writes.take(conn.uid)) return false;
    return coll !== 'matches' || matchWrites.take(conn.uid);
  }

  // Returns true when it handled the message.
  function handle(conn, m, reply) {
    switch (m.t) {
      case 'sub': {
        const q = rules.cleanQuery(m.q);
        if (!rules.canRead(conn.uid, m.coll) || !q) return reply(false, null, 'not_permitted'), true;
        if (conn.subs.size >= MAX_SUBS && !conn.subs.has(m.sid)) return reply(false, null, 'resource_exhausted'), true;
        const old = conn.subs.get(m.sid); if (old) store.unsubscribe(old);
        const sub = { coll: m.coll, q, push: docs => conn.send({ t: 'snap', sid: m.sid, docs }) };
        conn.subs.set(m.sid, sub); store.subscribe(sub); return true;
      }
      case 'unsub': { const s = conn.subs.get(m.sid); if (s) { store.unsubscribe(s); conn.subs.delete(m.sid); } return true; }
      case 'get':
        if (!rules.canRead(conn.uid, m.coll) || !rules.validId(m.id)) return reply(false, null, conn.uid ? 'not_permitted' : 'unauthenticated'), true;
        return reply(true, store.get(m.coll, m.id)), true;
      case 'set': case 'del': {
        if (!conn.uid) return reply(false, null, 'unauthenticated'), true;
        if (!writeAllowed(conn, m.coll)) return reply(false, null, 'rate_limited'), true;
        const e = m.t === 'set' ? rules.write(store, conn.uid, m.coll, m.id, m.data === undefined ? {} : m.data) : rules.remove(store, conn.uid, m.coll, m.id);
        return (e ? reply(false, null, e.code, e.reason) : reply(true, null)), true;
      }
      case 'names': {
        if (!conn.uid) return reply(false, null, 'unauthenticated'), true;
        const out = {};
        for (const id of (Array.isArray(m.ids) ? m.ids : []).slice(0, 200)) { if (!rules.validId(String(id))) continue; const p = store.get('profiles', String(id)); if (p && p.name) out[id] = { name: p.name }; }
        return reply(true, out), true;
      }
    }
    return false;
  }

  return { accept, admit, handle };
}
module.exports = { createDbApi };
