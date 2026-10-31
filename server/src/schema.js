// Per-collection document schemas. Pure functions: everything they need about the world
// (previous doc, clock, season, lookups) arrives in `ctx`, so they are unit-testable.
//
// validate(coll, id, data, ctx) -> { ok: true, doc } | { ok: false, error }
//   ctx = { uid, now, prev, prevUpdated, isAdmin, nameTaken(name), userExists(id), jarCents }
// `doc` is what gets stored. Fields the server owns (profile `created`, monotonic counters)
// are normalized instead of rejected, so an honest-but-stale client still saves.

const DAY_MS = 86400000;
// Mirrors SEASON_START / SEASON_LEN in game/main.js.
const SEASON_START = Date.UTC(2026, 8, 28), SEASON_LEN = 14 * DAY_MS;
// Mirrors MAPS and LOWSTAKES in game/main.js (cents). Tournament arenas are never staked.
const MAP_STAKES = { 0: [0, 100, 300], 1: [1000], 2: [2500], 3: 'range', 4: [0], 5: [0], 6: [0], 7: [10000], 8: [0] };
const COLOSSEUM = { min: 5000, max: 50000, step: 100 };
const FORMATS = new Set(['bo3', 'ko']);
const MEDALS = new Set(['ronin', 'daimyo', 'shogun', 'tenno', 'grand']);
const LIMITS = {
  docBytes: { profiles: 128 * 1024, matches: 2048, tickets: 16 * 1024, boss: 1024, practice: 512, grants: 512, inv: 4096 },
  imageBytes: 48 * 1024,
  friends: 200, owned: 64, ticketDays: 400, missionsPerDay: 3,
  xpMax: 1e8, xpStep: 50000, practiceMax: 10000, bossLevelMax: 50, counterMax: 1e7,
  bossKillGapMs: 5000, practiceGapMs: 5000, matchClockSkewMs: 10 * 60e3,
};

const RE = {
  uid: /^[A-Za-z0-9_-]{4,64}$/,
  name: /^[A-Za-z0-9_]{3,16}$/,
  kit: /^[a-z0-9_]{1,24}$/,
  wallet: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  walletApp: /^[A-Za-z0-9 _.-]{0,32}$/,
  x: /^[A-Za-z0-9_]{1,15}$/,
  clan: /^[A-Z0-9]{2,5}$/,
  color: /^#[0-9A-Fa-f]{6}$/,
  day: /^\d{4}-\d{2}-\d{2}$/,
  mission: /^[a-z0-9]{1,16}$/,
  matchId: /^[0-9]{1,12}$/,
  image: /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/,
};
// Keys no client may ever set on itself. Rejected outright (not stripped): writing them is an attack.
const PRIVILEGED = new Set(['admin', 'isAdmin', 'role', 'roles', 'mod', 'owner', 'staff', 'verified', 'banned', 'rating']);

class Invalid extends Error {}
const fail = msg => { throw new Invalid(msg); };
const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function int(v, min, max, f) { if (!Number.isInteger(v) || v < min || v > max) fail(f + ': integer ' + min + '..' + max); return v; }
function num(v, f) { if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) fail(f + ': number'); return v; }
function str(v, re, f) { if (typeof v !== 'string' || !re.test(v)) fail(f + ': bad format'); return v; }
function opt(v, check) { return v == null ? null : check(v); }
function image(v, f) { if (typeof v !== 'string' || v.length > LIMITS.imageBytes || !RE.image.test(v)) fail(f + ': image data URL up to 48 KB'); return v; }
function onlyKeys(o, allowed, f, privileged = PRIVILEGED) {
  for (const k of Object.keys(o)) { if (privileged.has(k)) fail(f + ': ' + k + ' is server-only'); if (!allowed.has(k)) fail(f + ': unknown field ' + k); }
}
function list(v, max, check, f) {
  if (!Array.isArray(v) || v.length > max) fail(f + ': list of at most ' + max);
  v.forEach((x, i) => check(x, f + '[' + i + ']'));
  if (new Set(v).size !== v.length) fail(f + ': duplicates');
  return v;
}
// Counters may only grow, by at most `step` per write. A stale client that sends a lower
// value keeps the stored one rather than failing. With `clamp`, a bigger jump is cut to the
// step instead of rejected (for values the game merges from local storage).
function counter(next, prev, step, f, clamp) {
  const p = Number.isInteger(prev) ? prev : 0;
  if (next === undefined) return p;
  int(next, 0, LIMITS.counterMax, f);
  if (next < p) return p;
  if (next - p > step) { if (clamp) return p + step; fail(f + ': grows by at most ' + step + ' per write'); }
  return next;
}
const dayKey = t => new Date(t).toISOString().slice(0, 10);
function seasonOf(t) { return Math.max(1, Math.floor((t - SEASON_START) / SEASON_LEN) + 1); }
function stakeOk(map, stake) {
  const rule = MAP_STAKES[map];
  if (rule === 'range') return Number.isInteger(stake) && stake >= COLOSSEUM.min && stake <= COLOSSEUM.max && stake % COLOSSEUM.step === 0;
  return !!rule && rule.includes(stake);
}

const PROFILE_KEYS = new Set(['name', 'wallet', 'walletApp', 'main', 'ts', 'created', 'av', 'x', 'friends', 'clan', 'ref', 'owned', 'avatar', 'medals', 'clanMeta', 'xp', 'founder']);
// saveProfile() in the game rebuilds the doc without these, which would wipe them on every edit.
const PROFILE_CARRY = ['owned', 'avatar', 'medals', 'clanMeta', 'xp'];
function profiles(d, ctx) {
  if (ctx.id !== ctx.uid) fail('profiles: own document only');
  onlyKeys(d, PROFILE_KEYS, 'profile');
  const prev = ctx.prev || {};
  const doc = {};
  doc.name = str(d.name, RE.name, 'name');
  if ((prev.name || '').toLowerCase() !== doc.name.toLowerCase() && ctx.nameTaken && ctx.nameTaken(doc.name)) fail('name: taken');
  if (has(d, 'wallet')) doc.wallet = opt(d.wallet, v => str(v, RE.wallet, 'wallet'));
  if (has(d, 'walletApp')) doc.walletApp = str(d.walletApp == null ? '' : d.walletApp, RE.walletApp, 'walletApp');
  if (has(d, 'main')) doc.main = opt(d.main, v => str(v, RE.kit, 'main'));
  if (has(d, 'av')) doc.av = opt(d.av, v => image(v, 'av'));
  if (has(d, 'x')) doc.x = d.x === '' ? null : opt(d.x, v => str(v, RE.x, 'x'));
  if (has(d, 'friends')) doc.friends = list(d.friends, LIMITS.friends, (v, f) => str(v, RE.uid, f), 'friends');
  if (has(d, 'clan')) doc.clan = opt(d.clan, v => str(v, RE.clan, 'clan'));
  if (has(d, 'owned')) doc.owned = list(d.owned, LIMITS.owned, (v, f) => str(v, RE.kit, f), 'owned');
  if (has(d, 'avatar')) doc.avatar = opt(d.avatar, v => str(v, RE.kit, 'avatar'));
  if (doc.avatar === 'emperor' && !ctx.isAdmin) fail('avatar: emperor is for admins');
  if (has(d, 'medals')) {
    if (!isObj(d.medals)) fail('medals: object');
    const pm = isObj(prev.medals) ? prev.medals : {};
    doc.medals = {};
    for (const [k, v] of Object.entries(d.medals)) { if (!MEDALS.has(k)) fail('medals: unknown ' + k); doc.medals[k] = counter(v, pm[k], 1, 'medals.' + k, true); }
  }
  if (has(d, 'clanMeta')) doc.clanMeta = opt(d.clanMeta, m => {
    if (!isObj(m)) fail('clanMeta: object');
    onlyKeys(m, new Set(['tag', 'sym', 'col', 'img']), 'clanMeta');
    const o = { tag: str(m.tag, RE.clan, 'clanMeta.tag') };
    if (m.sym != null) { if (typeof m.sym !== 'string' || !m.sym.length || m.sym.length > 4 || /[<>&"']/.test(m.sym)) fail('clanMeta.sym'); o.sym = m.sym; }
    if (m.col != null) o.col = str(m.col, RE.color, 'clanMeta.col');
    o.img = opt(m.img, v => image(v, 'clanMeta.img'));
    return o;
  });
  if (has(d, 'xp')) { int(d.xp, 0, LIMITS.xpMax, 'xp'); doc.xp = Math.min(d.xp, (prev.xp | 0) + LIMITS.xpStep); }
  for (const k of PROFILE_CARRY) if (!has(doc, k) && has(prev, k)) doc[k] = prev[k];
  // The referrer is fixed once set; `created` decides founder slots and clan leaders, so the server owns it.
  doc.ref = prev.ref || opt(d.ref, v => { str(v, RE.uid, 'ref'); return v === ctx.uid ? null : v; });
  doc.created = Number.isFinite(prev.created) ? prev.created : ctx.now;
  doc.ts = d.ts === undefined ? ctx.now : num(d.ts, 'ts');
  return doc;
}

function tickets(d, ctx) {
  if (ctx.id !== ctx.uid) fail('tickets: own document only');
  onlyKeys(d, new Set(['days', 'mis', 'ts']), 'tickets');
  const prev = ctx.prev || {};
  const near = new Set([dayKey(ctx.now - DAY_MS), dayKey(ctx.now), dayKey(ctx.now + DAY_MS)]);
  const prevDays = new Set(Array.isArray(prev.days) ? prev.days : []);
  const days = list(d.days === undefined ? [...prevDays] : d.days, LIMITS.ticketDays, (v, f) => str(v, RE.day, f), 'days');
  const added = days.filter(x => !prevDays.has(x));
  if (added.length > 1) fail('days: one new day per write');
  if (added.length && !near.has(added[0])) fail('days: only today can be claimed');
  const doc = { days };
  const pm = isObj(prev.mis) ? prev.mis : {};
  const mis = d.mis === undefined ? pm : d.mis;
  if (!isObj(mis) || Object.keys(mis).length > LIMITS.ticketDays) fail('mis: object');
  if (Object.keys(mis).length) {
    doc.mis = {};
    for (const [day, ids] of Object.entries(mis)) {
      str(day, RE.day, 'mis day');
      list(ids, LIMITS.missionsPerDay, (v, f) => str(v, RE.mission, f), 'mis.' + day);
      const before = new Set(Array.isArray(pm[day]) ? pm[day] : []);
      if (!near.has(day) && ids.some(x => !before.has(x))) fail('mis: only today\'s missions can be added');
      doc.mis[day] = ids;
    }
  }
  doc.ts = d.ts === undefined ? ctx.now : num(d.ts, 'ts');
  return doc;
}

function boss(d, ctx) {
  if (ctx.id !== ctx.uid) fail('boss: own document only');
  onlyKeys(d, new Set(['kills', 'best', 'paid', 'jackOut', 'jacks', 'ts']), 'boss');
  const prev = ctx.prev || {};
  const doc = {};
  doc.kills = counter(d.kills, prev.kills, 1, 'kills');
  if (ctx.prev && doc.kills > (prev.kills | 0) && ctx.now - (ctx.prevUpdated || 0) < LIMITS.bossKillGapMs) fail('kills: too fast');
  doc.best = Math.max(prev.best | 0, d.best === undefined ? 0 : int(d.best, 0, LIMITS.bossLevelMax, 'best'));
  doc.paid = counter(d.paid, prev.paid, 1, 'paid');
  doc.jacks = counter(d.jacks, prev.jacks, 1, 'jacks');
  doc.jackOut = counter(d.jackOut, prev.jackOut, Math.max(0, ctx.jarCents | 0), 'jackOut');
  if (doc.jackOut > (prev.jackOut | 0) && doc.jacks === (prev.jacks | 0)) fail('jackOut: needs a jackpot');
  doc.ts = d.ts === undefined ? ctx.now : num(d.ts, 'ts');
  return doc;
}

function practice(d, ctx) {
  if (ctx.id !== ctx.uid) fail('practice: own document only');
  onlyKeys(d, new Set(['best', 'kit', 'ts']), 'practice');
  const prev = ctx.prev;
  int(d.best, 0, LIMITS.practiceMax, 'best');
  if (prev && ctx.now - (ctx.prevUpdated || 0) < LIMITS.practiceGapMs) fail('best: too fast');
  // The CPU streak grows one win at a time; a larger jump is clamped and the client catches up on later wins.
  const p = prev ? prev.best | 0 : 0;
  const doc = { best: Math.max(p, Math.min(d.best, p + 1)) };
  if (d.kit != null) doc.kit = str(d.kit, RE.kit, 'kit');
  doc.ts = d.ts === undefined ? ctx.now : num(d.ts, 'ts');
  return doc;
}

const MATCH_KEYS = new Set(['season', 'ta', 'tb', 'fm', 'a', 'b', 'ka', 'kb', 'map', 'stake', 'w', 'rounds', 'ts']);
function matches(d, ctx) {
  if (ctx.prev) fail('matches: already recorded');
  str(ctx.id, RE.matchId, 'match id');
  onlyKeys(d, MATCH_KEYS, 'match');
  str(d.a, RE.uid, 'a'); str(d.b, RE.uid, 'b');
  if (d.a === d.b) fail('match: same player twice');
  if (ctx.uid !== d.a && ctx.uid !== d.b) fail('match: writer must be a participant');
  if (ctx.userExists && !(ctx.userExists(d.a) && ctx.userExists(d.b))) fail('match: unknown player');
  const season = seasonOf(ctx.now);
  int(d.season, 1, 1e4, 'season');
  if (d.season !== season && d.season !== season - 1) fail('season: not current');
  int(d.map, 0, 8, 'map');
  int(d.stake, 0, COLOSSEUM.max, 'stake');
  if (!stakeOk(d.map, d.stake)) fail('stake: not allowed in this arena');
  int(d.w, 0, 1, 'w');
  if (!Array.isArray(d.rounds) || d.rounds.length !== 2) fail('rounds: pair');
  d.rounds.forEach((r, i) => int(r, 0, 9, 'rounds[' + i + ']'));
  if (d.rounds[d.w] < d.rounds[1 - d.w]) fail('rounds: winner has fewer rounds');
  str(d.ka, RE.kit, 'ka'); str(d.kb, RE.kit, 'kb');
  if (d.fm !== undefined && !FORMATS.has(d.fm)) fail('fm');
  if (d.ta !== undefined) int(d.ta, 0, 1, 'ta');
  if (d.tb !== undefined) int(d.tb, 0, 1, 'tb');
  num(d.ts, 'ts');
  if (Math.abs(d.ts - ctx.now) > LIMITS.matchClockSkewMs) fail('ts: clock too far off');
  return Object.assign({}, d);
}

function grants(d, ctx) {
  if (!ctx.isOwner) fail('grants: owner only');
  str(ctx.id, RE.uid, 'grant id');
  onlyKeys(d, new Set(['admin', 'by', 'ts']), 'grant', new Set());
  if (typeof d.admin !== 'boolean') fail('admin: boolean');
  if (d.by !== ctx.uid) fail('by: must be you');
  return { admin: d.admin, by: d.by, ts: d.ts === undefined ? ctx.now : num(d.ts, 'ts') };
}

// Private per-player space: data/users/{uid}/inv
function inv(d, ctx) {
  if (ctx.id !== 'inv') fail('inv: only the inv document');
  onlyKeys(d, new Set(['owned', 'ts']), 'inv');
  return { owned: list(d.owned || [], LIMITS.owned, (v, f) => str(v, RE.kit, f), 'owned'), ts: d.ts === undefined ? ctx.now : num(d.ts, 'ts') };
}

const SCHEMAS = { profiles, tickets, boss, practice, matches, grants };
const USER_COLL = /^data\/users\/([A-Za-z0-9_-]{4,64})$/;
function schemaKey(coll) { return USER_COLL.test(coll) ? 'inv' : (SCHEMAS[coll] ? coll : null); }

function validate(coll, id, data, ctx) {
  const key = schemaKey(coll);
  if (!key) return { ok: false, error: 'unknown collection' };
  if (!isObj(data)) return { ok: false, error: 'document must be an object' };
  if (JSON.stringify(data).length > LIMITS.docBytes[key]) return { ok: false, error: 'document too large' };
  try { return { ok: true, doc: (key === 'inv' ? inv : SCHEMAS[key])(data, Object.assign({ id }, ctx)) }; }
  catch (e) { if (e instanceof Invalid) return { ok: false, error: e.message }; throw e; }
}

module.exports = { validate, seasonOf, stakeOk, dayKey, LIMITS, RE, USER_COLL };
