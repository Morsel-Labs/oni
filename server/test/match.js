// node test/match.js : the authoritative 1v1 over real websockets against a started server.
// Two guests authenticate, play a scripted match the server runs to the end, and the server writes
// and verifies the record. A third client cannot take a seat, a disconnect forfeits after the grace
// period, a reconnect inside it keeps the seat, and clients cannot write a fake result.
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs'), os = require('os');
const WebSocket = require('ws');
const S = require('../src/sim.js');
const { InputBuffer } = require('../src/inputbuf.js');

const PORT = 20000 + Math.floor(Math.random() * 20000), BASE = `http://127.0.0.1:${PORT}`;
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'oni-match-'));
const GRACE = 1200;
let fails = 0, passes = 0;
function check(ok, what) { if (ok) { passes++; console.log('  ok  ', what); } else { fails++; console.log('  FAIL', what); } }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, ms, what) { const t = Date.now(); while (Date.now() - t < ms) { const v = fn(); if (v) return v; await sleep(20); } throw new Error('timeout waiting for ' + what); }
const post = (p, b) => fetch(BASE + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b || {}) }).then(r => r.json());

class Client {
  constructor(name) { this.name = name; this.rid = 0; this.pending = new Map(); this.snaps = []; this.status = []; this.frame = 0; this.script = null; }
  async open(token) {
    this.token = token || (await post('/api/guest')).token;
    this.ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
    await new Promise((res, rej) => { this.ws.once('open', res); this.ws.once('error', rej); });
    this.ws.on('message', raw => this.onMsg(JSON.parse(raw)));
    const me = await this.call({ t: 'hello', token: this.token }); this.uid = me.id; return this;
  }
  onMsg(m) {
    if (m.t === 'ok' || m.t === 'err') { const p = this.pending.get(m.rid); if (p) { this.pending.delete(m.rid); m.t === 'ok' ? p.res(m.data) : p.rej(Object.assign(new Error(m.code), { code: m.code })); } return; }
    if (m.t === 'ms') { this.snaps.push(m); if (this.script) this.feed(m); }
    if (m.t === 'mx') this.status.push(m);
  }
  feed(m) { // keep a few frames ahead of what the server consumed, like a 60 Hz client would
    const st = S.unpack(m.s), want = m.c + 4, b = [];
    const f0 = this.frame;
    while (this.frame <= want && b.length < 32) { b.push(this.script(st, this.frame)); this.frame++; }
    if (b.length) this.send({ t: 'mi', f: f0, b });
  }
  call(msg) { return new Promise((res, rej) => { const id = ++this.rid; this.pending.set(id, { res, rej }); this.send(Object.assign({ rid: id }, msg)); }); }
  async callErr(msg) { try { await this.call(msg); return 'OK'; } catch (e) { return e.code; } }
  send(m) { if (this.ws.readyState === 1) this.ws.send(JSON.stringify(m)); }
  last(st) { return [...this.status].reverse().find(s => !st || s.st === st); }
  close() { this.ws.close(); }
}
// seat 0 walks in and punches; seat 1 stands still: seat 0 must win by K.O.
const attacker = (st, f) => { if (st.scene !== 'fight') return 0; const d = Math.abs(st.f[1].x - st.f[0].x); return d > 38 ? S.IN.R : (f % 6 === 0 ? S.IN.P : 0); };
const idle = () => 0;

function unitBuffer() {
  console.log('input buffer');
  const b = new InputBuffer({ delay: 2, max: 6 });
  check(b.next() === 0 && b.repeated === 1, 'empty buffer repeats neutral');
  b.push(0, [8]); check(b.next() === 0, 'waits for the delay cushion before consuming');
  b.push(1, [0]); check(b.next() === 8 && b.next() === 0 && b.consumed === 1, 'consumes in order once cushioned');
  check(b.next() === 0 && b.starving, 'starves and repeats when empty');
  b.push(0, [99, 99]); check(b.q.length === 0 && b.lastFrame === 1, 'resent frames are dropped');
  b.push(2, [1, 1, 1, 1, 8, 0, 1, 1, 1]);
  check(b.q.length === 6 && b.q.some(x => x[1] === 8), 'bounded buffer keeps the press edge when trimming');
  const h = new InputBuffer({ delay: 1, idleNeutral: 3 }); h.push(0, [2]); h.next();
  const r = [h.next(), h.next(), h.next(), h.next()]; check(r[0] === 2 && r[3] === 0, 'held input decays to neutral after a long stall');
}

async function main() {
  unitBuffer();
  const srv = spawn(process.execPath, [path.join(__dirname, '..', 'src', 'server.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_DIR: DATA, MATCH_SPEED: '4', MATCH_GRACE_MS: String(GRACE), MATCH_SNAP_HZ: '60' }), stdio: ['ignore', 'pipe', 'inherit'] });
  srv.stdout.on('data', () => {});
  try {
    await until(() => srv.exitCode === null && true, 100, 'spawn');
    for (let i = 0; i < 100; i++) { try { const h = await fetch(BASE + '/health'); if (h.ok) break; } catch (e) {} await sleep(50); }

    console.log('authentication');
    const anon = new WebSocket(`ws://127.0.0.1:${PORT}/ws`); await new Promise(r => anon.once('open', r));
    const anonC = Object.assign(new Client('anon'), { ws: anon }); anon.on('message', raw => anonC.onMsg(JSON.parse(raw)));
    check(await anonC.callErr({ t: 'mh', code: 'ANON', kit: 'oni' }) === 'unauthenticated', 'unauthenticated socket cannot host');
    check(await anonC.callErr({ t: 'mj', code: 'ANON', kit: 'oni' }) === 'unauthenticated', 'unauthenticated socket cannot take a seat');
    anon.close();

    console.log('full match');
    const A = await new Client('A').open(), B = await new Client('B').open(), C = await new Client('C').open();
    check(await A.callErr({ t: 'mh', code: 'BAD!', kit: 'oni' }) === 'invalid_argument', 'bad code rejected');
    check(await A.callErr({ t: 'mh', code: 'T1', kit: 'nope' }) === 'invalid_argument', 'bad kit rejected');
    const hi = await A.call({ t: 'mh', code: 'TEST', kit: 'oni', pal: 0, stake: 100, map: 0, fmt: 'ko' });
    check(hi.seat === 0 && hi.st === 'waiting', 'host holds seat 0 and waits');
    check(await B.callErr({ t: 'mh', code: 'TEST', kit: 'oni' }) === 'code_taken', 'another account cannot host the same code');
    check(await A.callErr({ t: 'mj', code: 'TEST', kit: 'oni' }) === 'OK', 'host re-joining resumes its own seat (no double seat)');
    check(A.last().seat === 0 && (await A.call({ t: 'mp', code: 'TEST' })).seats[1] === null, 'seat 1 still free after host resume');
    const peek = await B.call({ t: 'mp', code: 'TEST' });
    check(peek.stake === 100 && peek.fmt === 'ko' && peek.seats[0].kit === 'oni', 'guest can peek stake and format before accepting');
    A.script = attacker; B.script = idle;
    const ji = await B.call({ t: 'mj', code: 'TEST', kit: 'ryu', pal: 1 });
    check(ji.seat === 1 && ji.st === 'live', 'guest takes seat 1 and the match goes live');
    check(await C.callErr({ t: 'mj', code: 'TEST', kit: 'oni' }) === 'seat_taken', 'third client cannot take a seat');
    const wi = await C.call({ t: 'mw', code: 'TEST' });
    check(wi.seat === -1, 'third client may spectate');
    check(await C.callErr({ t: 'mi', f: 0, b: [8, 8, 8] }) === 'not_seated', 'spectator inputs are refused');
    check(await C.callErr({ t: 'mr' }) === 'not_seated', 'spectator cannot ready up');
    // kick-start input streams (the scripts then follow snapshots)
    A.send({ t: 'mi', f: 0, b: [0] }); A.frame = 1; B.send({ t: 'mi', f: 0, b: [0] }); B.frame = 1;
    const dbg = setInterval(() => { const s = A.snaps[A.snaps.length - 1]; if (process.env.DBG && s) { const u = S.unpack(s.s); console.log('dbg', s.s.q, u.scene, u.timer, u.f.map(f => [f.x, f.hp, f.st]), 'a', s.a, 'c', s.c, 'frame', A.frame, A.snaps.length); } }, 1000);
    const over = await until(() => A.last('over'), 60000, 'match over'); clearInterval(dbg);
    await sleep(150);
    check(over.res && over.res.end === 'ko' && over.res.w === 0, 'server ran the match to a K.O. win for seat 0');
    check(over.res.rounds[0] === 1 && over.res.frames > 300, 'result carries rounds and frame count');
    check(B.last('over') && B.last('over').res.id === over.res.id, 'both players got the same result');
    // snapshot consistency: the same server frame must look identical to every client
    const byQ = cl => new Map(cl.snaps.map(s => [s.s.q, JSON.stringify(s.s)]));
    const qa = byQ(A), qb = byQ(B), qc = byQ(C); let same = 0, diff = 0;
    for (const [q, s] of qa) { if (qb.has(q)) { qb.get(q) === s ? same++ : diff++; } if (qc.has(q)) { qc.get(q) === s ? same++ : diff++; } }
    check(same > 200 && diff === 0, `snapshots consistent across players and spectator (${same} shared frames, ${diff} mismatches)`);
    const qs = A.snaps.map(s => s.s.q); check(qs.every((q, i) => !i || q > qs[i - 1]), 'snapshot frame numbers increase monotonically');
    check(A.snaps.some(s => s.a > 100) && B.snaps.every(s => s.a >= -1), 'snapshots carry each player\'s input ack');
    const lastA = S.unpack(A.snaps[A.snaps.length - 1].s);
    check(lastA.scene === 'matchEnd' && lastA.winner === 0, 'final snapshot shows match end');
    const board = await (await fetch(BASE + '/api/leaderboard')).json();
    const rec = board.find(r => r.src === 'server' && r.a === A.uid && r.b === B.uid);
    check(rec && rec.w === 0 && rec.stake === 100 && rec.ka === 'oni' && rec.kb === 'ryu' && rec.end === 'ko', 'server wrote the match record with the right winner and stake');
    check(rec && /^sha256:[0-9a-f]{64}$/.test(rec.log) && rec.season >= 1 && rec.fm === 'ko', 'record carries log hash, season and format');
    const v = await post('/api/verify', { id: over.res.id });
    check(v.ok === true && v.winner === 0 && v.hash_ok === true, '/api/verify replays the stored log and agrees');
    check((await post('/api/verify', { id: 'srv_0000000000000000' })).ok === false, '/api/verify rejects unknown ids');

    console.log('no fake results');
    check(await B.callErr({ t: 'set', coll: 'matches', id: over.res.id, data: Object.assign({}, rec, { w: 1 }) }) === 'not_permitted', 'loser cannot overwrite the server record');
    check(await B.callErr({ t: 'del', coll: 'matches', id: over.res.id }) === 'not_permitted', 'loser cannot delete the server record');
    check(await B.callErr({ t: 'set', coll: 'matches', id: 'srv_ffffffffffffffff', data: { a: B.uid, b: A.uid, w: 0, src: 'server' } }) === 'not_permitted', 'clients cannot mint server-namespace records');
    check(await B.callErr({ t: 'set', coll: 'match_logs', id: over.res.id, data: {} }) === 'not_permitted', 'clients cannot touch stored logs');
    B.send({ t: 'mres', w: 1 }); B.send({ t: 'mi', f: 1e6, b: [300] }); await sleep(200);
    const board2 = await (await fetch(BASE + '/api/leaderboard')).json();
    const rec2 = board2.find(r => r.sim === rec.sim);
    check(rec2 && rec2.w === 0 && board2.filter(r => r.src === 'server').length === 1, 'record unchanged after forgery attempts');
    check((await post('/api/verify', { id: over.res.id })).ok === true, 'stored log still verifies');

    console.log('rematch');
    await A.call({ t: 'mr' }); check(A.last().st === 'over' && A.last().seats[0].rd, 'one player ready: still waiting');
    await B.call({ t: 'mr' }); await until(() => A.last('live') && A.status.filter(s => s.why === 'start').length >= 2, 3000, 'rematch start');
    check(true, 'both ready: rematch starts');
    A.script = null; B.script = null; A.call({ t: 'ml' }); const ff = await until(() => B.last('over') && B.last('over').res.end === 'forfeit' ? B.last('over') : null, 3000, 'leave forfeit');
    check(ff.res.w === 1, 'leaving a live match forfeits it to the opponent');

    console.log('disconnect');
    const D = await new Client('D').open(), E = await new Client('E').open();
    await D.call({ t: 'mh', code: 'DROP', kit: 'kappa', fmt: 'bo3' }); D.script = idle; E.script = idle;
    await E.call({ t: 'mj', code: 'DROP', kit: 'saru' }); D.send({ t: 'mi', f: 0, b: [0] }); D.frame = 1; E.send({ t: 'mi', f: 0, b: [0] }); E.frame = 1;
    await sleep(300); const t0 = Date.now(); E.close();
    const dis = await until(() => D.status.find(s => s.why === 'disconnect'), 2000, 'disconnect status');
    check(dis.seats[1].on === false && dis.st === 'live', 'opponent sees the disconnect, match still live during grace');
    const ov = await until(() => D.last('over'), GRACE + 3000, 'forfeit');
    const dt = Date.now() - t0;
    check(ov.res.end === 'forfeit' && ov.res.w === 0 && dt >= GRACE - 50, `disconnect forfeits after the grace period (${dt} ms, grace ${GRACE})`);
    const fv = await post('/api/verify', { id: ov.res.id });
    check(fv.ok === true && fv.end === 'forfeit' && fv.hash_ok, 'forfeit record and log verify');
    const board3 = await (await fetch(BASE + '/api/leaderboard')).json();
    check(board3.some(r => r.end === 'forfeit' && r.a === D.uid && r.w === 0), 'forfeit is on the leaderboard');

    console.log('reconnect inside grace');
    const F = await new Client('F').open(), G = await new Client('G').open();
    await F.call({ t: 'mh', code: 'BACK', kit: 'oni', fmt: 'bo3' }); F.script = idle; G.script = idle;
    await G.call({ t: 'mj', code: 'BACK', kit: 'oni' }); F.send({ t: 'mi', f: 0, b: [0] }); F.frame = 1; G.send({ t: 'mi', f: 0, b: [0] }); G.frame = 1;
    await sleep(200); G.close(); await sleep(300);
    const G2 = await new Client('G2').open(G.token); G2.script = idle;
    const back = await G2.call({ t: 'mj', code: 'BACK', kit: 'oni' });
    check(back.seat === 1 && back.st === 'live', 'same account reconnects to its seat');
    G2.send({ t: 'mi', f: 1000, b: [0] }); G2.frame = 1001;
    await sleep(GRACE + 600);
    check(F.last().st === 'live' && !F.last('over'), 'no forfeit after a reconnect inside grace');
    const H = await new Client('H').open();
    check(await H.callErr({ t: 'mj', code: 'BACK', kit: 'oni' }) === 'seat_taken', 'seat stays bound to the two accounts');
    for (const c of [A, B, C, D, F, G2, H]) c.close();
  } catch (e) { fails++; console.error('ERROR', e.stack || e); }
  finally { srv.kill(); }
  console.log(`match tests: ${passes} passed, ${fails} failed`);
  process.exit(fails ? 1 : 0);
}
main();
