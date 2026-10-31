/* ONI server shim: gives the game the same window.claude.use('room' | 'db' | 'user') it has on claude.ai,
   backed by the ONI server. Loaded only on theonicurse.xyz (or any host running oni-server). */
(function () {
  const URL_WS = window.ONI_SERVER || (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
  let ws, readyRes, rid = 0, sid = 0, me = null, myPeer = null, first = true;
  let ready = new Promise(r => { readyRes = r; });
  const pending = new Map(), snaps = new Map(), peerCbs = new Map(), peersNow = new Map(), wantRooms = new Set(), presNow = new Map();
  const tab = Math.random().toString(36).slice(2);
  async function token() {
    let t = localStorage.getItem('oni-token');
    if (!t) { const r = await fetch('/api/guest', { method: 'POST' }); const j = await r.json(); t = j.token; localStorage.setItem('oni-token', t); }
    return t;
  }
  function call(msg) { return new Promise((res, rej) => { const id = ++rid; pending.set(id, { res, rej }); ws.send(JSON.stringify(Object.assign({ rid: id }, msg))); }); }
  function connect() {
    if (!first) ready = new Promise(r => { readyRes = r; });
    first = false;
    ws = new WebSocket(URL_WS);
    ws.onopen = async () => {
      const r = await new Promise(res => { const id = ++rid; pending.set(id, { res, rej: () => res(null) }); ws.send(JSON.stringify({ t: 'hello', rid: id, token: localStorage.getItem('oni-token'), tab })); });
      if (!r) { localStorage.removeItem('oni-token'); await token(); ws.close(); return; }
      me = r.id; myPeer = r.peer;
      for (const [id, s] of snaps) ws.send(JSON.stringify({ t: 'sub', sid: id, coll: s.coll, q: s.q }));
      for (const room of wantRooms) { try { await call({ t: 'join', room }); } catch (e) { continue; } if (presNow.get(room)) ws.send(JSON.stringify({ t: 'pres', room, patch: presNow.get(room) })); }
      readyRes();
      Match.resume();
    };
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.t === 'ok' || m.t === 'err') { const p = pending.get(m.rid); if (p) { pending.delete(m.rid); m.t === 'ok' ? p.res(m.data) : p.rej(Object.assign(new Error(m.code), { code: m.code })); } }
      else if (m.t === 'snap') { const s = snaps.get(m.sid); if (s) s.cb({ docs: m.docs.map(d => ({ id: d.id, data: () => d.data })) }); }
      else if (m.t === 'peers') { const prev = peersNow.get(m.room) || []; peersNow.set(m.room, m.peers);
        const ids = new Set(prev.map(p => p.peer)), now = new Set(m.peers.map(p => p.peer));
        const ch = { peers: m.peers, joined: m.peers.filter(p => !ids.has(p.peer)), left: prev.filter(p => !now.has(p.peer)), updated: m.peers };
        for (const cb of peerCbs.get(m.room) || []) try { cb(ch); } catch (err) { console.error(err); } }
      else if (m.t === 'ms' || m.t === 'mx') Match.recv(m);
    };
    ws.onclose = () => { for (const p of pending.values()) p.rej(Object.assign(new Error('closed'), { code: 'upstream_error' })); pending.clear(); setTimeout(connect, 1500); };
  }
  function Query(coll, q) {
    return {
      where(f, op, v) { return Query(coll, Object.assign({}, q, { where: (q.where || []).concat([[f, op, v]]) })); },
      orderBy(f, dir) { return Query(coll, Object.assign({}, q, { orderBy: [f, dir || 'asc'] })); },
      limit(n) { return Query(coll, Object.assign({}, q, { limit: n })); },
      onSnapshot(cb, onErr) { const id = ++sid; snaps.set(id, { coll, q, cb, onErr }); ready.then(() => ws.send(JSON.stringify({ t: 'sub', sid: id, coll, q }))); return () => { snaps.delete(id); if (ws.readyState === 1) ws.send(JSON.stringify({ t: 'unsub', sid: id })); }; },
      doc(id) { return {
        id,
        async set(data) { await ready; return call({ t: 'set', coll, id: String(id), data }); },
        async get() { await ready; const d = await call({ t: 'get', coll, id: String(id) }); return { exists: !!d, id, data: () => d }; },
        async delete() { await ready; return call({ t: 'del', coll, id: String(id) }); } }; }
    };
  }
  function Room(name) {
    wantRooms.add(name);
    const joined = ready.then(() => call({ t: 'join', room: name }));
    return {
      presence(patch) { presNow.set(name, Object.assign({}, presNow.get(name) || {}, patch)); return joined.then(() => ws.send(JSON.stringify({ t: 'pres', room: name, patch }))); },
      onPeers(cb) { if (!peerCbs.has(name)) peerCbs.set(name, new Set()); peerCbs.get(name).add(cb); return () => peerCbs.get(name).delete(cb); },
      peers() { return peersNow.get(name) || []; },
      leave() { wantRooms.delete(name); presNow.delete(name); peerCbs.delete(name); if (ws.readyState === 1) ws.send(JSON.stringify({ t: 'leave', room: name })); },
      join(n) { return Promise.resolve(Room(n)); }
    };
  }
  /* 'match': the server-authoritative 1v1 (see server/README.md, "Authoritative 1v1").
     join(code, {as:'host'|'seat'|'watch', kit, pal, stake, map, fmt, t3}) -> info; peek(code) -> info;
     sendInput(mask) queues one 60 Hz input frame (batched and resent until acked); onState(cb) gets every
     snapshot {s: packed state, a: ack, c: consumed, at: arrival ms}; onStatus(cb) gets status changes; ready(); leave(). */
  const Match = (() => {
    let cur = null, frame = 0, unacked = [], flushQ = false;
    const stateCbs = new Set(), statusCbs = new Set();
    const T = { host: 'mh', seat: 'mj', watch: 'mw' };
    function flush() {
      flushQ = false; if (!cur || cur.as === 'watch' || !unacked.length || !ws || ws.readyState !== 1) return;
      const b = unacked.slice(-64); ws.send(JSON.stringify({ t: 'mi', f: frame - b.length, b }));
    }
    function msg(code, opts) { return Object.assign({}, opts || {}, { t: T[(opts && opts.as) || 'seat'], code }); }
    return {
      recv(m) {
        if (!cur || m.k && m.k !== cur.code || m.code && m.code !== cur.code) return;
        if (m.t === 'ms') { if (m.a != null && m.a >= 0) { const keep = frame - 1 - m.a; unacked = keep > 0 ? unacked.slice(-keep) : []; } m.at = performance.now(); for (const cb of stateCbs) try { cb(m); } catch (e) { console.error(e); } }
        else { if (m.st === 'closed') cur = null; for (const cb of statusCbs) try { cb(m); } catch (e) { console.error(e); } }
      },
      resume() { if (!cur) return; const c = cur; call(msg(c.code, c.opts)).then(flush, e => { if (cur === c) this.recv({ t: 'mx', code: c.code, st: 'closed', why: (e && e.code) || 'lost' }); }); },
      api: {
        async peek(code) { await ready; return call({ t: 'mp', code }); },
        async join(code, opts) { await ready; opts = Object.assign({ as: 'seat' }, opts); code = String(code).toUpperCase();
          if (!cur || cur.code !== code) { frame = 0; unacked = []; }
          const info = await call(msg(code, opts)); cur = { code, as: opts.as, opts }; return info; },
        sendInput(mask) { if (!cur || cur.as === 'watch') return; unacked.push(mask & 255); frame++; if (unacked.length > 240) unacked.shift(); if (!flushQ) { flushQ = true; queueMicrotask(flush); } },
        onState(cb) { stateCbs.add(cb); return () => stateCbs.delete(cb); },
        onStatus(cb) { statusCbs.add(cb); return () => statusCbs.delete(cb); },
        async ready() { await ready; return call({ t: 'mr' }); },
        leave() { const was = cur; cur = null; unacked = []; if (was && ws && ws.readyState === 1) ws.send(JSON.stringify({ t: 'ml' })); },
        get code() { return cur && cur.code; }
      }
    };
  })();
  const started = token().then(connect);
  const lobby = Room('lobby');
  window.claude = {
    async use(cap) {
      await started; await ready;
      if (cap === 'room') return lobby;
      if (cap === 'db') return { collection: c => Query(c, {}) };
      if (cap === 'match') return Match.api;
      if (cap === 'user') return { id: async () => me, profiles: async ids => call({ t: 'names', ids }) };
      return null;
    }
  };
})();
