// Rate limiting, HTTP helpers, auth and read rules.
const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('os'), fs = require('fs'), path = require('path');
const { PassThrough } = require('stream');
const { Bucket, Limiter, Counter, clientIp } = require('../src/ratelimit');
const { cspFor, readJson } = require('../src/http');
const rules = require('../src/rules');
const { Store } = require('../src/store');
const auth = require('../src/auth');

test('token bucket: burst, then refill at the rate', () => {
  const b = new Bucket(1, 3, 0);
  assert.deepEqual([b.take(1, 0), b.take(1, 0), b.take(1, 0), b.take(1, 0)], [true, true, true, false]);
  assert.equal(b.take(1, 999), false);
  assert.equal(b.take(1, 1000), true);
});
test('limiter: keys are independent and the key map is bounded', () => {
  const l = new Limiter({ rate: 0, burst: 1, maxKeys: 3 });
  assert.equal(l.take('a', 1, 0), true); assert.equal(l.take('a', 1, 0), false); assert.equal(l.take('b', 1, 0), true);
  for (let i = 0; i < 10; i++) l.take('k' + i, 1, 0);
  assert.ok(l.map.size <= 3);
  clearInterval(l.timer);
});
test('connection counter caps per key', () => {
  const c = new Counter(2);
  assert.deepEqual([c.open('ip'), c.open('ip'), c.open('ip')], [true, true, false]);
  c.close('ip'); assert.equal(c.open('ip'), true);
});
test('client IP: X-Forwarded-For only counts behind a trusted proxy', () => {
  const req = { socket: { remoteAddress: '::ffff:10.0.0.2' }, headers: { 'x-forwarded-for': '6.6.6.6, 1.2.3.4' } };
  assert.equal(clientIp(req, 0), '10.0.0.2');
  assert.equal(clientIp(req, 1), '1.2.3.4');
  assert.equal(clientIp(req, 2), '6.6.6.6');
});

test('CSP: inline scripts and handlers by hash, fonts allowed, framing denied', () => {
  const csp = cspFor('<link onload="this.media=\'all\'"><script src="/shim.js"></script><script>var a=1;</script><button onclick="go()">x</button>');
  assert.match(csp, /script-src 'self' 'sha256-[^']+' 'unsafe-hashes' 'sha256-[^']+' 'sha256-[^']+'/);
  assert.doesNotMatch(csp, /script-src[^;]*unsafe-inline/);
  assert.match(csp, /fonts\.googleapis\.com/); assert.match(csp, /fonts\.gstatic\.com/);
  assert.match(csp, /frame-ancestors 'none'/);
  const crypto = require('crypto');
  assert.ok(csp.includes(crypto.createHash('sha256').update('var a=1;').digest('base64')));
});
test('readJson: bounded body rejects with 413', async () => {
  const mk = (body, len) => { const r = new PassThrough(); r.headers = len ? { 'content-length': String(len) } : {}; setImmediate(() => r.end(body)); return r; };
  assert.deepEqual(await readJson(mk('{"a":1}'), 100), { a: 1 });
  assert.deepEqual(await readJson(mk('not json'), 100), {});
  await assert.rejects(readJson(mk('x'.repeat(200)), 100), e => e.status === 413);
  await assert.rejects(readJson(mk('', 5000), 100), e => e.status === 413);
});

test('read rules: auth required, private space owner only, queries sanitized', () => {
  assert.equal(rules.canRead(null, 'profiles'), false);
  assert.equal(rules.canRead('uMe1234', 'profiles'), true);
  assert.equal(rules.canRead('uMe1234', 'grants'), true);
  assert.equal(rules.canRead('uMe1234', 'data/users/uMe1234'), true);
  assert.equal(rules.canRead('uMe1234', 'data/users/uOther12'), false);
  assert.equal(rules.canRead('uMe1234', 'users'), false);
  assert.equal(rules.canRead('uMe1234', 'secrets'), false);
  assert.deepEqual(rules.cleanQuery({ where: [['season', '==', 2]], orderBy: ['ts', 'asc'], limit: 1e6 }), { where: [['season', '==', 2]], orderBy: ['ts', 'asc'], limit: 1000 });
  assert.equal(rules.cleanQuery({ where: [['a', '>', 1]] }), null);
  assert.equal(rules.cleanQuery({ where: 'x' }), null);
  assert.equal(rules.cleanQuery({ where: [['a', '==', { $ne: 1 }]] }), null);
  assert.equal(rules.cleanQuery({}).limit, 1000);
});

function tmpStore() { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oni-test-')); return new Store(path.join(dir, 'oni.db')); }
test('write gateway: owner-only docs, create-only matches, system writes', () => {
  const store = tmpStore();
  const a = auth.guest(store), b = auth.guest(store);
  const now = Date.now(), season = require('../src/schema').seasonOf(now);
  const match = { season, a: a.id, b: b.id, ka: 'oni', kb: 'ryu', map: 1, stake: 1000, w: 0, rounds: [2, 0], fm: 'bo3', ta: 0, tb: 0, ts: now };
  assert.equal(rules.write(store, a.id, 'matches', '777', match), null);
  assert.equal(rules.write(store, b.id, 'matches', '777', Object.assign({}, match, { w: 1, rounds: [0, 2] })).reason, 'matches: already recorded');
  assert.equal(store.get('matches', '777').w, 0);
  assert.equal(rules.write(store, a.id, 'profiles', b.id, { name: 'Hijack' }).code, 'not_permitted');
  assert.equal(rules.write(store, a.id, 'grants', a.id, { admin: true, by: a.id }).code, 'not_permitted');
  assert.equal(rules.remove(store, a.id, 'matches', '777').code, 'not_permitted');
  assert.equal(rules.remove(store, a.id, 'boss', a.id).code, 'not_permitted');
  assert.notEqual(rules.write(store, 'system', 'matches', '778', { anything: 1 }), null, 'the string "system" gets client rules');
  assert.equal(rules.write(store, rules.SYSTEM, 'matches', '779', { server: true }), null);
  store.systemWrite('matches', '780', { server: true });
  assert.deepEqual(store.get('matches', '780'), { server: true });
  rules.options.clientMatches = false;
  assert.equal(rules.write(store, a.id, 'matches', '781', match).code, 'not_permitted');
  rules.options.clientMatches = true;
  store.close();
});
test('auth: token lookup by hash, nonce map bounded and pruned', () => {
  const store = tmpStore();
  const g = auth.guest(store);
  assert.equal(auth.byToken(store, g.token).id, g.id);
  assert.equal(auth.byToken(store, g.token.slice(0, -1) + (g.token.endsWith('A') ? 'B' : 'A')), null);
  assert.equal(auth.byToken(store, { $gt: '' }), null);
  assert.equal(store.db.prepare('SELECT COUNT(*) n FROM users WHERE th IS NULL').get().n, 0);
  for (let i = 0; i < 50; i++) auth.nonce('W' + i);
  assert.ok(auth.nonceCount() >= 50);
  auth.pruneNonces(Date.now() + 6 * 60e3);
  assert.equal(auth.nonceCount(), 0);
  assert.equal(auth.safeEqual('abc', 'abc'), true); assert.equal(auth.safeEqual('abc', 'abd'), false); assert.equal(auth.safeEqual('abc', 'ab'), false);
  store.close();
});
test('store migration hashes tokens of existing users', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oni-mig-')), file = path.join(dir, 'oni.db');
  const Database = require('better-sqlite3'); const db = new Database(file);
  db.exec('CREATE TABLE users(id TEXT PRIMARY KEY, token TEXT UNIQUE NOT NULL, wallet TEXT UNIQUE, created INTEGER NOT NULL)');
  db.prepare('INSERT INTO users VALUES(?,?,?,?)').run('uOld12345', 'old-token-0123456789', null, 1); db.close();
  const store = new Store(file);
  assert.equal(auth.byToken(store, 'old-token-0123456789').id, 'uOld12345');
  store.close();
});
