// Who may read and write what in the live database. Mirrors the rules of the claude.ai version,
// plus server-side schema validation (schema.js) for every client write.
//
// API for server code (e.g. the match service):
//   rules.SYSTEM                      identity for server-side writes. It is a Symbol, so no client
//                                     message (JSON) can ever carry it; client uids are DB strings.
//   store.systemWrite(coll, id, data) write as the server: no rules, no schema (size cap only).
//   rules.write(store, SYSTEM, ...)   same, through the normal entry point.
//   rules.options.clientMatches       set to false once the server records every match itself;
//                                     client writes to `matches` are then refused.
//
// API used by the websocket layer (dbapi.js):
//   canRead(uid, coll)                     get/sub permission (auth required)
//   cleanQuery(q)                          sanitized query, or null if malformed
//   write(store, uid, coll, id, data)      -> null on success, or { code, reason }
//   remove(store, uid, coll, id)           -> null on success, or { code, reason }
const schema = require('./schema');

const SYSTEM = Symbol('system');
const options = {
  clientMatches: true,
  owners: new Set((process.env.ONI_OWNERS || '').split(',').map(s => s.trim()).filter(Boolean)),
};
const PUBLIC = new Set(['profiles', 'practice', 'tickets', 'boss', 'matches', 'grants']);
const OWN_DOC = new Set(['profiles', 'practice', 'tickets', 'boss']);
const DELETABLE = new Set(['profiles']);           // the game deletes a profile on wallet disconnect
const MAX_LIMIT = 1000, MAX_WHERE = 4;

const isUser = uid => typeof uid === 'string' && uid.length > 0;
function ownerOfPrivate(coll) { const m = schema.USER_COLL.exec(coll); return m ? m[1] : null; }
function validId(id) { return typeof id === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(id); }

function canRead(uid, coll) {
  if (!isUser(uid) || typeof coll !== 'string') return false;
  if (PUBLIC.has(coll)) return true;
  return ownerOfPrivate(coll) === uid;
}

function cleanQuery(q) {
  if (q == null) return { limit: MAX_LIMIT };
  if (typeof q !== 'object' || Array.isArray(q)) return null;
  const out = {};
  if (q.where != null) {
    if (!Array.isArray(q.where) || q.where.length > MAX_WHERE) return null;
    out.where = [];
    for (const w of q.where) {
      if (!Array.isArray(w) || w.length !== 3 || typeof w[0] !== 'string' || w[0].length > 64 || w[1] !== '==') return null;
      if (w[2] !== null && !['string', 'number', 'boolean'].includes(typeof w[2])) return null;
      out.where.push([w[0], '==', w[2]]);
    }
  }
  if (q.orderBy != null) {
    const o = q.orderBy;
    if (!Array.isArray(o) || typeof o[0] !== 'string' || o[0].length > 64 || !['asc', 'desc', undefined].includes(o[1])) return null;
    out.orderBy = [o[0], o[1] || 'asc'];
  }
  out.limit = Number.isInteger(q.limit) && q.limit > 0 ? Math.min(q.limit, MAX_LIMIT) : MAX_LIMIT;
  return out;
}

const deny = reason => ({ code: 'not_permitted', reason });
const invalid = reason => ({ code: 'invalid_argument', reason });

function canWriteColl(uid, coll, id) {
  if (OWN_DOC.has(coll)) return id === uid;
  if (coll === 'matches') return options.clientMatches;
  if (coll === 'grants') return options.owners.has(uid);
  return ownerOfPrivate(coll) === uid;
}

// Everything schema.validate needs to know about the world, gathered lazily from the store.
function context(store, uid, coll, id, cur) {
  const ctx = { uid, now: Date.now(), prev: cur ? cur.data : null, prevUpdated: cur ? cur.updated : 0 };
  if (coll === 'profiles') {
    const g = store.get('grants', uid); ctx.isAdmin = !!(g && g.admin);
    ctx.nameTaken = name => { const l = name.toLowerCase(); return store.query('profiles', {}).some(r => r.id !== uid && r.data && typeof r.data.name === 'string' && r.data.name.toLowerCase() === l); };
  }
  if (coll === 'matches') ctx.userExists = u => store.userExists(u);
  if (coll === 'boss') {
    const all = store.query('boss', {}).map(r => r.data);
    const tries = all.reduce((a, d) => a + (d.paid | 0), 0), out = all.reduce((a, d) => a + (d.jackOut | 0), 0);
    ctx.jarCents = Math.max(0, Math.round(tries * 100 * 0.9) - out);   // JAR_TRY, JAR_SHARE in game/main.js
  }
  if (coll === 'grants') ctx.isOwner = options.owners.has(uid);
  return ctx;
}

function write(store, uid, coll, id, data) {
  if (!validId(id) || typeof coll !== 'string') return invalid('bad id');
  if (uid === SYSTEM) { store.systemWrite(coll, id, data); return null; }
  if (!isUser(uid)) return deny('sign in first');
  if (!canWriteColl(uid, coll, id)) return deny('not your document');
  const cur = store.getMeta(coll, id);
  const r = schema.validate(coll, id, data, context(store, uid, coll, id, cur));
  if (!r.ok) return invalid(r.error);
  if (coll === 'matches') return store.insert(coll, id, r.doc) ? null : invalid('matches: already recorded');
  store.set(coll, id, r.doc);
  return null;
}

function remove(store, uid, coll, id) {
  if (!validId(id) || typeof coll !== 'string') return invalid('bad id');
  if (uid === SYSTEM) { store.del(coll, id); return null; }
  if (!isUser(uid)) return deny('sign in first');
  const own = (DELETABLE.has(coll) && id === uid) || ownerOfPrivate(coll) === uid || (coll === 'grants' && options.owners.has(uid));
  if (!own) return deny('cannot delete');
  store.del(coll, id);
  return null;
}

module.exports = { SYSTEM, options, canRead, cleanQuery, validId, write, remove };
