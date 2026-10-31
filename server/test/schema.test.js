// Schema rules. Each "game write" case builds the document exactly as game/main.js does.
const test = require('node:test');
const assert = require('node:assert/strict');
const { validate, seasonOf, dayKey, LIMITS } = require('../src/schema');

const NOW = Date.UTC(2026, 9, 31, 12, 0, 0);
const ME = 'uAbCdEfGhIjKl', OTHER = 'uZyXwVuTsRqPo';
const ok = r => { assert.equal(r.ok, true, r.error); return r.doc; };
const bad = (r, re) => { assert.equal(r.ok, false, 'expected rejection'); if (re) assert.match(r.error, re); };
const ctx = (extra) => Object.assign({ uid: ME, now: NOW, prev: null, prevUpdated: 0 }, extra);
const jpeg = 'data:image/jpeg;base64,' + 'A'.repeat(4000);

// ---- profiles ----
const profileDoc = () => ({ name: 'Kenji_1', wallet: '1'.repeat(44), walletApp: 'Phantom', main: 'oni', ts: NOW, created: NOW, av: jpeg, x: 'kenji', friends: [OTHER], clan: 'ONI', ref: null });

test('profiles: saveProfile() document is accepted', () => {
  const d = ok(validate('profiles', ME, profileDoc(), ctx()));
  assert.equal(d.name, 'Kenji_1');
  assert.equal(d.created, NOW);
});
test('profiles: every patchProfile() patch is accepted', () => {
  const prev = ok(validate('profiles', ME, profileDoc(), ctx()));
  const patches = [{ owned: ['oni', 'saru'] }, { avatar: 'tanuki' }, { avatar: null }, { friends: [OTHER, 'uQwErTyUiOp'] }, { friends: [] },
    { medals: { ronin: 1 } }, { clanMeta: { tag: 'ONI', sym: '鬼', col: '#C1121F', img: null } }, { clanMeta: { tag: 'ONI', sym: '鬼', col: '#C1121F', img: jpeg } },
    { clan: null }, { clan: 'AB12', clanMeta: { tag: 'AB12', sym: '龍', col: '#2E8A5A', img: null } }, { xp: 1200 }];
  for (const p of patches) ok(validate('profiles', ME, Object.assign({}, prev, p, { ts: NOW }), ctx({ prev })));
});
test('profiles: offline-created doc with founder flag is saved without the flag', () => {
  const d = ok(validate('profiles', ME, Object.assign(profileDoc(), { founder: 1 }), ctx()));
  assert.equal(d.founder, undefined);
});
test('profiles: name rules (length, charset, HTML, uniqueness)', () => {
  for (const name of ['ab', 'a'.repeat(17), '<img src=x onerror=alert(1)>', 'has space', 'ñame', '', 42]) bad(validate('profiles', ME, Object.assign(profileDoc(), { name }), ctx()), /name/);
  bad(validate('profiles', ME, profileDoc(), ctx({ nameTaken: () => true })), /taken/);
  const prev = profileDoc();   // keeping your own name is not "taken"
  ok(validate('profiles', ME, profileDoc(), ctx({ prev, nameTaken: () => true })));
});
test('profiles: no self-awarded flags, no foreign docs, no unknown keys', () => {
  for (const k of ['admin', 'isAdmin', 'role', 'rating', 'verified']) bad(validate('profiles', ME, Object.assign(profileDoc(), { [k]: true }), ctx()), /server-only/);
  bad(validate('profiles', OTHER, profileDoc(), ctx()), /own document/);
  bad(validate('profiles', ME, Object.assign(profileDoc(), { junk: 1 }), ctx()), /unknown field/);
  bad(validate('profiles', ME, Object.assign(profileDoc(), { avatar: 'emperor' }), ctx()), /admins/);
  ok(validate('profiles', ME, Object.assign(profileDoc(), { avatar: 'emperor' }), ctx({ isAdmin: true })));
});
test('profiles: server owns created and ref; xp and medals grow in bounded steps', () => {
  const prev = Object.assign(profileDoc(), { created: NOW - 1e9, ref: OTHER, xp: 100, medals: { ronin: 2 } });
  const d = ok(validate('profiles', ME, Object.assign(profileDoc(), { created: 1, ref: 'uSomeoneElse', xp: 1e7, medals: { ronin: 99 } }), ctx({ prev })));
  assert.equal(d.created, NOW - 1e9);
  assert.equal(d.ref, OTHER);
  assert.equal(d.xp, 100 + LIMITS.xpStep);
  assert.equal(d.medals.ronin, 3);
  bad(validate('profiles', ME, Object.assign(profileDoc(), { medals: { fake: 1 } }), ctx({ prev })), /medals/);
  assert.equal(ok(validate('profiles', ME, Object.assign(profileDoc(), { created: 1 }), ctx())).created, NOW);
  assert.equal(ok(validate('profiles', ME, Object.assign(profileDoc(), { ref: ME }), ctx())).ref, null);
});
test('profiles: saveProfile() keeps fields it does not send (xp, owned, medals...)', () => {
  const prev = Object.assign(profileDoc(), { xp: 500, owned: ['oni'], medals: { grand: 1 } });
  const d = ok(validate('profiles', ME, profileDoc(), ctx({ prev })));
  assert.equal(d.xp, 500); assert.deepEqual(d.owned, ['oni']); assert.deepEqual(d.medals, { grand: 1 });
});
test('profiles: size limits', () => {
  bad(validate('profiles', ME, Object.assign(profileDoc(), { av: 'data:image/jpeg;base64,' + 'A'.repeat(60000) }), ctx()), /48 KB/);
  bad(validate('profiles', ME, Object.assign(profileDoc(), { av: 'javascript:alert(1)' }), ctx()), /image/);
  bad(validate('profiles', ME, Object.assign(profileDoc(), { friends: Array.from({ length: 201 }, (_, i) => 'uFriend' + i) }), ctx()), /friends/);
  bad(validate('profiles', ME, Object.assign(profileDoc(), { clanMeta: { tag: 'ONI', sym: '<b>', col: 'red' } }), ctx()), /clanMeta/);
});

// ---- tickets ----
const today = dayKey(NOW), yesterday = dayKey(NOW - 864e5);
test('tickets: claimTicket() adds today', () => {
  ok(validate('tickets', ME, { days: [today], ts: NOW }, ctx()));
  ok(validate('tickets', ME, { days: [yesterday, today], ts: NOW }, ctx({ prev: { days: [yesterday] } })));
});
test('tickets: claimTicket() may drop days from past drops and keeps missions it omits', () => {
  const prev = { days: ['2026-10-01', yesterday], mis: { [yesterday]: ['win2'] } };
  const d = ok(validate('tickets', ME, { days: [yesterday, today], ts: NOW }, ctx({ prev })));
  assert.deepEqual(d.mis, prev.mis);
});
test('tickets: misReward() adds a mission for today', () => {
  const prev = { days: [today] };
  ok(validate('tickets', ME, { days: [today], mis: { [today]: ['win2'] }, ts: NOW }, ctx({ prev })));
  ok(validate('tickets', ME, { days: [today], mis: { [today]: ['win2', 'play3', 'enma'] }, ts: NOW }, ctx({ prev: { days: [today], mis: { [today]: ['win2', 'play3'] } } })));
});
test('tickets: no 365 days in one write, no back-dating, no extra missions', () => {
  bad(validate('tickets', ME, { days: Array.from({ length: 365 }, (_, i) => 'd' + i), ts: NOW }, ctx()));
  bad(validate('tickets', ME, { days: Array.from({ length: 365 }, (_, i) => dayKey(NOW - i * 864e5)), ts: NOW }, ctx()), /one new day/);
  bad(validate('tickets', ME, { days: ['2026-01-01'], ts: NOW }, ctx()), /today/);
  bad(validate('tickets', ME, { days: [], mis: { '2026-01-01': ['win2'] } }, ctx()), /today/);
  bad(validate('tickets', ME, { days: [], mis: { [today]: ['a', 'b', 'c', 'd'] } }, ctx()), /mis/);
  bad(validate('tickets', OTHER, { days: [today] }, ctx()), /own document/);
});

// ---- boss ----
test('boss: recordBossKill(), payTry(), payJackpot() writes', () => {
  const k1 = ok(validate('boss', ME, { kills: 1, best: 1, ts: NOW }, ctx()));
  const paid = ok(validate('boss', ME, { kills: 1, best: 1, paid: 1, jackOut: 0, jacks: 0, ts: NOW }, ctx({ prev: k1, prevUpdated: NOW - 1000 })));
  const k2 = ok(validate('boss', ME, { kills: 2, best: 2, ts: NOW }, ctx({ prev: paid, prevUpdated: NOW - 60e3 })));
  assert.equal(k2.paid, 1, 'recordBossKill() omits paid; the server keeps it');
  ok(validate('boss', ME, { kills: 2, best: 2, paid: 1, jackOut: 90, jacks: 1, ts: NOW }, ctx({ prev: k2, jarCents: 90 })));
});
test('boss: kills grow by one, spaced in time; jackpots bounded by the jar', () => {
  bad(validate('boss', ME, { kills: 99999, best: 99, ts: NOW }, ctx()));
  bad(validate('boss', ME, { kills: 5, best: 1 }, ctx({ prev: { kills: 3 }, prevUpdated: NOW - 60e3 })), /kills/);
  bad(validate('boss', ME, { kills: 4, best: 1 }, ctx({ prev: { kills: 3 }, prevUpdated: NOW - 1000 })), /too fast/);
  bad(validate('boss', ME, { kills: 0, best: 51 }, ctx()), /best/);
  bad(validate('boss', ME, { kills: 0, jackOut: 5000, jacks: 1 }, ctx({ prev: { kills: 0 }, jarCents: 100 })), /jackOut/);
  bad(validate('boss', ME, { kills: 0, jackOut: 50, jacks: 0 }, ctx({ prev: { kills: 0 }, jarCents: 100 })), /jackpot/);
  assert.equal(ok(validate('boss', ME, { kills: 2 }, ctx({ prev: { kills: 7 }, prevUpdated: NOW - 60e3 }))).kills, 7, 'stale lower value keeps the stored one');
});

// ---- practice ----
test('practice: recordPractice() writes; streak grows by one per write', () => {
  ok(validate('practice', ME, { best: 1, kit: 'oni', ts: NOW }, ctx()));
  const d = ok(validate('practice', ME, { best: 3, kit: 'ryu', ts: NOW }, ctx({ prev: { best: 1 }, prevUpdated: NOW - 60e3 })));
  assert.equal(d.best, 2);
  bad(validate('practice', ME, { best: 2, kit: 'oni' }, ctx({ prev: { best: 1 }, prevUpdated: NOW - 100 })), /too fast/);
  bad(validate('practice', ME, { best: -1, kit: 'oni' }, ctx()), /best/);
  bad(validate('practice', ME, { best: 1, kit: 'oni', extra: 1 }, ctx()), /unknown/);
});

// ---- matches ----
const season = seasonOf(NOW);
const matchDoc = (o) => Object.assign({ season, ta: 0, tb: 0, fm: 'bo3', a: ME, b: OTHER, ka: 'oni', kb: 'ryu', map: 1, stake: 1000, w: 0, rounds: [2, 1], ts: NOW }, o);
const mctx = (extra) => ctx(Object.assign({ userExists: () => true }, extra));
test('matches: recordMatch() writes for every arena and stake the game offers', () => {
  const cases = [[0, 0], [0, 100], [0, 300], [1, 1000], [2, 2500], [3, 5000], [3, 12300], [3, 50000], [7, 10000]];
  for (const [map, stake] of cases) ok(validate('matches', '123456789', matchDoc({ map, stake }), mctx()));
  ok(validate('matches', '42', matchDoc({ fm: 'ko', w: 1, rounds: [0, 1] }), mctx()));
  ok(validate('matches', '42', matchDoc(), mctx({ uid: OTHER })));
});
test('matches: forgery, overwrite and bad values are rejected', () => {
  bad(validate('matches', '42', matchDoc(), mctx({ prev: matchDoc() })), /already/);
  bad(validate('matches', '42', matchDoc({ a: OTHER, b: 'uThirdPerson' }), mctx()), /participant/);
  bad(validate('matches', '42', matchDoc({ b: 'nobody' }), mctx({ userExists: id => id === ME })), /unknown player|format/);
  bad(validate('matches', '42', matchDoc({ stake: 1e9 }), mctx()), /stake/);
  bad(validate('matches', '42', matchDoc({ map: 1, stake: 2500 }), mctx()), /stake/);
  bad(validate('matches', '42', matchDoc({ map: 3, stake: 5050 }), mctx()), /stake/);
  bad(validate('matches', '42', matchDoc({ map: 4, stake: 1000 }), mctx()), /stake/);
  bad(validate('matches', '42', matchDoc({ b: ME }), mctx()), /same player/);
  bad(validate('matches', '42', matchDoc({ ts: 1 }), mctx()), /ts/);
  bad(validate('matches', '42', matchDoc({ season: season + 5 }), mctx()), /season/);
  bad(validate('matches', '42', matchDoc({ w: 0, rounds: [0, 2] }), mctx()), /rounds/);
  bad(validate('matches', 'm1', matchDoc(), mctx()), /match id/);
  bad(validate('matches', '42', matchDoc({ bonus: 1 }), mctx()), /unknown/);
});

// ---- grants / inventory ----
test('grants: setAdmin() works for the owner only', () => {
  ok(validate('grants', OTHER, { admin: true, by: ME, ts: NOW }, ctx({ isOwner: true })));
  bad(validate('grants', OTHER, { admin: true, by: ME, ts: NOW }, ctx()), /owner/);
  bad(validate('grants', OTHER, { admin: true, by: OTHER, ts: NOW }, ctx({ isOwner: true })), /by/);
});
test('inventory: saveOwned() writes data/users/{me}/inv', () => {
  ok(validate('data/users/' + ME, 'inv', { owned: ['oni', 'saru'], ts: NOW }, ctx()));
  bad(validate('data/users/' + ME, 'other', { owned: [] }, ctx()), /inv/);
  bad(validate('data/users/' + ME, 'inv', { owned: Array.from({ length: 100 }, (_, i) => 'k' + i) }, ctx()), /owned/);
});
test('unknown collections and non-object docs are rejected', () => {
  bad(validate('clans', 'x', {}, ctx()), /unknown collection/);
  bad(validate('profiles', ME, 'str', ctx()), /object/);
  bad(validate('profiles', ME, [1], ctx()), /object/);
});
