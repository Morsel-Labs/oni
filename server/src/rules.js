// Who may write what. Mirrors the rules of the claude.ai version.
const OWN_DOC = new Set(['profiles', 'practice', 'tickets', 'boss']);
const OPEN_APPEND = new Set(['matches']);
function canRead(coll) { return OWN_DOC.has(coll) || OPEN_APPEND.has(coll) || /^data\/users\/[A-Za-z0-9_-]{4,64}$/.test(coll); }
function canWrite(uid, coll, id, del) {
  if (!uid) return false;
  if (OWN_DOC.has(coll)) return id === uid;
  if (OPEN_APPEND.has(coll)) return !del;          // any signed-in player may record a match; nobody may delete them
  const m = /^data\/users\/([A-Za-z0-9_-]{4,64})$/.exec(coll);
  if (m) return m[1] === uid;                      // private per-player space (inventory)
  return false;
}
function validId(id) { return typeof id === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(id); }
module.exports = { canRead, canWrite, validId };
