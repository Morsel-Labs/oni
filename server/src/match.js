// Server-authoritative online 1v1 (Phase 2).
//
// The server owns the fight: both seated players stream input masks ('mi'), the server runs
// sim.step at a fixed 60 Hz, broadcasts packed snapshots ('ms') and status ('mx'), keeps the
// full input log, and writes the match record itself when the match ends. Clients never report
// results in this mode. Protocol: see server/README.md ("Authoritative 1v1").
const crypto = require('crypto');
const S = require('./sim.js');
const { InputBuffer } = require('./inputbuf.js');

const TICK_MS = 1000 / 60;
const FMTS = { bo3: { need: 2, hpMul: 1 }, ko: { need: 1, hpMul: 1 } };
const MAPS = 9, MAX_STAKE = 50000, MAX_PAL = 4;
const MAX_FRAMES = 60 * 60 * 20;          // same cap replayMatch accepts (20 min)
const CODE_RE = /^[A-Z0-9]{4,8}$/;
const num = (v, d) => (v != null && v !== '' && isFinite(+v) ? +v : d);

const season = require('./schema').seasonOf; // the same season clock the game uses
function err(code) { return Object.assign(new Error(code), { code }); }
function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }

class Session {
  constructor(srv, code, cfg) {
    this.srv = srv; this.code = code; this.cfg = cfg;
    this.seats = [null, null];   // {uid, conn, kit, pal, t3, buf, goneAt, rd, left}
    this.watchers = new Set();
    this.state = 'waiting';      // waiting -> live -> over -> (live again on rematch) -> closed
    this.created = this.overAt = srv.now();
    this.m = null; this.log = null; this.acc = 0; this.tick = 0; this.sentSeq = -1;
    this.result = null; this.games = 0;
  }
  seatOf(conn) { return this.seats.findIndex(s => s && s.conn === conn); }
  seatOfUid(uid) { return this.seats.findIndex(s => s && s.uid === uid); }
  info(forConn) {
    const me = forConn ? this.seatOf(forConn) : -1;
    return { code: this.code, st: this.state, seat: me, stake: this.cfg.stake, map: this.cfg.map, fmt: this.cfg.fmt, need: FMTS[this.cfg.fmt].need,
      seats: this.seats.map(s => s && { uid: s.uid, kit: s.kit, pal: s.pal, t3: s.t3, on: !!s.conn, rd: !!s.rd }),
      watchers: this.watchers.size, games: this.games, res: this.result, delay: this.srv.opts.delay, snapHz: this.srv.opts.snapHz, grace: this.srv.opts.graceMs };
  }
  members() { const out = []; for (const s of this.seats) if (s && s.conn) out.push(s.conn); for (const w of this.watchers) out.push(w); return out; }
  status(why) { for (const c of this.members()) c.send(Object.assign({ t: 'mx', why: why || undefined }, this.info(c))); }
  seat(i, conn, uid, p) {
    this.seats[i] = { uid, conn, kit: p.kit, pal: p.pal, t3: p.t3, buf: new InputBuffer({ delay: this.srv.opts.delay, max: this.srv.opts.maxBuf }), goneAt: 0, rd: false, left: false };
    conn.match = this;
  }
  attach(i, conn) { // the same account comes back (reconnect or a newer tab): the newest connection holds the seat
    const s = this.seats[i]; if (s.conn && s.conn !== conn) { s.conn.send({ t: 'mx', code: this.code, st: 'closed', why: 'replaced' }); s.conn.match = null; }
    s.conn = conn; s.goneAt = 0; s.left = false; conn.match = this;
  }
  begin() {
    const [a, b] = this.seats, f = FMTS[this.cfg.fmt];
    this.m = S.mkMatch('online', this.cfg.stake, [a.kit, b.kit], this.cfg.map, { pal: [a.pal, b.pal], need: f.need, hpMul: f.hpMul });
    this.log = []; this.acc = 0; this.sentSeq = -1; this.result = null; this.frozen = false; this.state = 'live'; this.games++;
    for (const s of this.seats) { s.buf.clear(); s.rd = false; }
    this.srv.wake(); this.status('start');
  }
  step() {
    const m = this.m; if (!m) return;
    this.acc += TICK_MS;
    for (;;) {
      const stepMs = m.slow > 0 ? TICK_MS * 2.5 : TICK_MS; // the same slow-motion cadence the client loop uses
      if (this.acc < stepMs) break; this.acc -= stepMs;
      if (this.state === 'live') {
        const a = this.seats[0].buf.next(), b = this.seats[1].buf.next();
        this.log.push(a | (b << 8)); S.step(m, [a, b]);
        if (m.slow > 0) m.slow--;
        if (m.scene === 'matchEnd') { this.finish('ko', m.winner); break; }
        if (this.log.length >= MAX_FRAMES) { this.finish('timeout', -1); break; }
      } else if (!this.frozen && m.sceneT < 600) { S.step(m, [0, 0]); if (m.slow > 0) m.slow--; } // win pose, then hold
    }
    this.tick++;
    if (m.seq !== this.sentSeq && (this.tick % this.srv.snapEvery === 0 || m.scene !== this.lastScene)) this.snapshot();
  }
  snapshot() {
    const m = this.m; this.sentSeq = m.seq; this.lastScene = m.scene;
    const body = JSON.stringify(S.pack(m));
    for (let i = 0; i < 2; i++) { const s = this.seats[i]; if (s && s.conn && s.conn.ws.readyState === 1) s.conn.ws.send(`{"t":"ms","k":"${this.code}","a":${s.buf.lastFrame},"c":${s.buf.consumed},"s":${body}}`); }
    if (this.watchers.size) { const w = `{"t":"ms","k":"${this.code}","s":${body}}`; for (const c of this.watchers) if (c.ws.readyState === 1) c.ws.send(w); }
  }
  finish(end, winner) {
    const m = this.m; this.state = 'over'; this.overAt = this.srv.now(); this.frozen = end !== 'ko';
    for (const s of this.seats) { s.buf.clear(); s.rd = false; }
    const rec = this.srv.record(this, end, winner);
    this.result = { w: winner, end, id: rec ? rec.id : null, rounds: m.wins.slice(), frames: this.log.length, hash: rec ? rec.hash : null };
    this.snapshot(); this.status(end);
  }
  forfeit(loser, why) {
    if (this.state !== 'live') return;
    this.finish('forfeit', 1 - loser); if (why) this.status(why);
  }
  housekeep(now) {
    const o = this.srv.opts;
    const gone = this.seats.map(s => !!s && (!s.conn || s.left) && now - s.goneAt > o.graceMs);
    if (this.state === 'waiting') { if (gone[0] || now - this.created > o.waitMs) return this.close('host_gone'); }
    else if (this.state === 'live') {
      if (gone[0] && gone[1]) return this.close('abandoned');
      if (gone[0]) this.forfeit(0); else if (gone[1]) this.forfeit(1);
    } else if (this.state === 'over') {
      const away = this.seats.map(s => !s || !s.conn || s.left);
      if ((away[0] && away[1]) || now - this.overAt > o.rematchMs) return this.close('ended');
    }
  }
  close(why) {
    if (this.state === 'closed') return;
    this.status(why); this.state = 'closed';
    for (const c of this.members()) if (c.match === this) c.match = null;
    this.watchers.clear(); this.srv.sessions.delete(this.code);
  }
}

class Matches {
  constructor(opts) {
    opts = opts || {};
    const env = process.env;
    this.store = opts.store;
    this.opts = {
      delay: num(opts.delay, num(env.MATCH_INPUT_DELAY, 2)),        // frames of jitter cushion
      maxBuf: num(opts.maxBuf, num(env.MATCH_MAX_BUFFER, 8)),
      snapHz: num(opts.snapHz, num(env.MATCH_SNAP_HZ, 60)),
      graceMs: num(opts.graceMs, num(env.MATCH_GRACE_MS, 10000)),   // disconnect grace before forfeit
      waitMs: num(opts.waitMs, num(env.MATCH_WAIT_MS, 15 * 60e3)),  // host waits this long for an opponent
      rematchMs: num(opts.rematchMs, num(env.MATCH_REMATCH_MS, 90e3)),
      speed: num(opts.speed, num(env.MATCH_SPEED, 1)),              // test-only time scale
      maxSessions: num(opts.maxSessions, 5000), maxWatchers: num(opts.maxWatchers, 32),
    };
    this.snapEvery = Math.max(1, Math.round(60 / this.opts.snapHz));
    this.sessions = new Map(); this.timer = null; this.next = 0; this.lastHk = 0;
    this.now = opts.now || (() => Date.now());
    this.hr = () => Number(process.hrtime.bigint()) / 1e6;
  }
  // ---- ticker: one drift-corrected 60 Hz clock for every session ----
  wake() { if (this.timer) return; this.next = this.hr(); this.loop(); }
  loop() {
    const t = this.hr(), dt = TICK_MS / this.opts.speed; let n = 0;
    while (t >= this.next && n < 8) { this.tickAll(); this.next += dt; n++; }
    if (t - this.next > 250) this.next = t; // after a long stall, skip ahead instead of fast-forwarding
    this.timer = this.sessions.size ? setTimeout(() => this.loop(), Math.max(0, this.next - this.hr())) : null;
  }
  tickAll() {
    const now = this.now(), hk = now - this.lastHk >= 100; if (hk) this.lastHk = now;
    for (const s of [...this.sessions.values()]) {
      try { if (s.state === 'live' || s.state === 'over') s.step(); if (hk) s.housekeep(now); }
      catch (e) { console.error('match', s.code, e && e.stack); s.close('server_error'); }
    }
  }
  // ---- messages from server.js ----
  handle(conn, m, reply) {
    if (!Matches.TYPES.includes(m.t)) return false;
    try { const r = this[m.t](conn, m); if (r !== undefined) reply(true, r); }
    catch (e) { reply(false, null, e.code || 'upstream_error'); }
    return true;
  }
  validKit(k) { return typeof k === 'string' && S.KITS.includes(k); }
  player(m) {
    if (!this.validKit(m.kit)) throw err('invalid_argument');
    const pal = m.pal | 0; if (pal < 0 || pal > MAX_PAL) throw err('invalid_argument');
    return { kit: m.kit, pal, t3: m.t3 ? 1 : 0 };
  }
  find(m) { const code = String(m.code || '').toUpperCase(); if (!CODE_RE.test(code)) throw err('invalid_argument'); return { code, s: this.sessions.get(code) }; }
  detach(conn, keep) {
    const s = conn.match; if (!s || s === keep) return;
    const i = s.seatOf(conn); if (i >= 0) this.ml(conn, {}); else { s.watchers.delete(conn); conn.match = null; }
  }
  mh(conn, m) { // host: create (or resume) a match bound to this account as seat 0
    if (!conn.uid) throw err('unauthenticated');
    const { code, s } = this.find(m);
    if (s) { const i = s.seatOfUid(conn.uid); if (i < 0) throw err('code_taken'); this.detach(conn, s); s.attach(i, conn); s.status('resume'); return s.info(conn); }
    const p = this.player(m);
    const stake = m.stake | 0, map = m.map | 0, fmt = FMTS[m.fmt] ? m.fmt : 'bo3';
    if (stake < 0 || stake > MAX_STAKE || map < 0 || map >= MAPS) throw err('invalid_argument');
    if (this.sessions.size >= this.opts.maxSessions) throw err('resource_exhausted');
    this.detach(conn);
    const ns = new Session(this, code, { stake, map, fmt }); ns.seat(0, conn, conn.uid, p);
    this.sessions.set(code, ns); this.wake(); return ns.info(conn);
  }
  mp(conn, m) { const { s } = this.find(m); if (!s) throw err('not_found'); return s.info(conn); }
  mj(conn, m) { // take seat 1 (or resume your own seat)
    if (!conn.uid) throw err('unauthenticated');
    const { s } = this.find(m); if (!s || s.state === 'closed') throw err('not_found');
    const i = s.seatOfUid(conn.uid);
    if (i >= 0) { this.detach(conn, s); s.attach(i, conn); s.status('resume'); return s.info(conn); }
    if (s.seats[1] || s.state !== 'waiting') throw err('seat_taken');
    const p = this.player(m); this.detach(conn);
    s.seat(1, conn, conn.uid, p); s.begin(); return s.info(conn);
  }
  mw(conn, m) { // spectate: read-only
    const { s } = this.find(m); if (!s || s.state === 'closed') throw err('not_found');
    if (s.seatOf(conn) >= 0) return s.info(conn);
    if (s.watchers.size >= this.opts.maxWatchers) throw err('resource_exhausted');
    this.detach(conn, s); s.watchers.add(conn); conn.match = s; this.wake();
    if (s.m) { s.sentSeq = -1; } return s.info(conn);
  }
  mi(conn, m) { // input frames: {f: first client frame, b: [mask, ...]}
    const s = conn.match, i = s ? s.seatOf(conn) : -1; if (i < 0) throw err('not_seated');
    const f = m.f, b = m.b;
    if (!Number.isInteger(f) || f < 0 || !Array.isArray(b) || b.length > 64 || !b.every(v => Number.isInteger(v) && v >= 0 && v < 256)) throw err('invalid_argument');
    const buf = s.seats[i].buf;
    if (s.state !== 'live') { buf.lastFrame = Math.max(buf.lastFrame, f + b.length - 1); return undefined; } // ack but ignore outside a fight
    buf.push(f, b); return undefined;
  }
  mr(conn) { // ready for a rematch
    const s = conn.match, i = s ? s.seatOf(conn) : -1; if (i < 0) throw err('not_seated');
    if (s.state !== 'over') throw err('failed_precondition');
    s.seats[i].rd = true;
    if (s.seats.every(x => x && x.rd && x.conn && !x.left)) s.begin(); else s.status('ready');
    return null;
  }
  ml(conn) { // leave: forfeits a live match
    const s = conn.match; if (!s) return null;
    const i = s.seatOf(conn);
    if (i < 0) { s.watchers.delete(conn); conn.match = null; return null; }
    conn.match = null; s.seats[i].conn = null; s.seats[i].left = true; s.seats[i].goneAt = this.now();
    if (s.state === 'live') s.forfeit(i, 'left');
    else if (s.state === 'waiting') s.close('host_left');
    else { s.status('left'); s.housekeep(this.now()); }
    return null;
  }
  drop(conn) { // websocket closed: keep the seat for the grace period
    const s = conn.match; if (!s) return;
    const i = s.seatOf(conn);
    if (i < 0) { s.watchers.delete(conn); conn.match = null; return; }
    s.seats[i].conn = null; s.seats[i].goneAt = this.now(); conn.match = null; s.status('disconnect');
  }
  // ---- the referee writes the result ----
  record(s, end, winner) {
    if (!this.store) return null;
    const m = s.m, [a, b] = s.seats, log = S.encodeLog(s.log);
    const id = 'srv_' + crypto.randomBytes(8).toString('hex'), hash = 'sha256:' + sha256(log), ts = this.now();
    const proof = Object.assign(S.matchProof(Object.assign({}, m, { log: s.log })), { winner, end, id, code: s.code, a: a.uid, b: b.uid, ts });
    try {
      this.store.systemWrite('match_logs', id, proof); // server-only collection: clients can neither read nor write it
      // ranked fields are the ones the client used to write (see recordMatch in game/main.js)
      if (end !== 'timeout') this.store.systemWrite('matches', id, { season: season(ts), ta: a.t3, tb: b.t3, fm: s.cfg.fmt, a: a.uid, b: b.uid, ka: m.kits[0], kb: m.kits[1], map: m.map, stake: m.stake,
        w: winner, rounds: m.wins.slice(), ts, src: 'server', end, frames: s.log.length, log: hash, sim: m.id });
    } catch (e) { console.error('match record', e && e.message); return null; }
    return { id, hash };
  }
  // presence rooms 'oni-<code>' are bound to the match with that code: seated players read/write, anyone else signed in reads
  roomAccess(conn, name) {
    const r = /^oni-([a-z0-9]{4,8})$/i.exec(String(name)); if (!r || !conn.uid) return null;
    const s = this.sessions.get(r[1].toUpperCase()); if (!s || s.state === 'closed') return null;
    return s.seatOfUid(conn.uid) >= 0 ? 'rw' : 'ro';
  }
  storedProof(id) { return this.store && typeof id === 'string' && /^srv_[0-9a-f]{16}$/.test(id) ? this.store.get('match_logs', id) : null; }
  verifyStored(id, verifyProof) {
    const p = this.storedProof(id); if (!p) return { ok: false, error: 'not_found' };
    const rec = this.store.get('matches', id);
    const hashOk = !rec || rec.log === 'sha256:' + sha256(p.log);
    if (p.end === 'ko') { const r = verifyProof(p); return Object.assign(r, { ok: r.ok && hashOk, id, end: p.end, hash_ok: hashOk }); }
    const r = S.replayMatch(p); // forfeit/timeout: the log is replayable but the match did not finish in the fight
    return { ok: hashOk && !r.ok, id, end: p.end, winner: p.winner, frames: p.frames, hash_ok: hashOk, replay: { finished: r.ok, wins: r.wins } };
  }
}
Matches.TYPES = ['mh', 'mp', 'mj', 'mw', 'mi', 'mr', 'ml'];
module.exports = { Matches, InputBuffer, season, TICK_MS };
