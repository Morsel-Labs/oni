// Document store on SQLite with live subscriptions (the "db" the game uses).
// Access rules live in rules.js; this layer only stores. Server code that needs to write
// without client rules (e.g. match results) calls systemWrite.
const crypto = require('crypto');
const Database = require('better-sqlite3');
const MAX_DOC = 256 * 1024;
const sha256 = s => crypto.createHash('sha256').update(String(s)).digest('hex');

class Store {
  constructor(file) {
    this.db = new Database(file);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`CREATE TABLE IF NOT EXISTS docs(coll TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, updated INTEGER NOT NULL, PRIMARY KEY(coll,id));
                  CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, token TEXT UNIQUE NOT NULL, wallet TEXT UNIQUE, created INTEGER NOT NULL);`);
    this.migrate();
    this.q = {
      put: this.db.prepare('INSERT INTO docs(coll,id,data,updated) VALUES(?,?,?,?) ON CONFLICT(coll,id) DO UPDATE SET data=excluded.data, updated=excluded.updated'),
      ins: this.db.prepare('INSERT OR IGNORE INTO docs(coll,id,data,updated) VALUES(?,?,?,?)'),
      get: this.db.prepare('SELECT data, updated FROM docs WHERE coll=? AND id=?'),
      del: this.db.prepare('DELETE FROM docs WHERE coll=? AND id=?'),
      all: this.db.prepare('SELECT id,data FROM docs WHERE coll=?'),
      user: this.db.prepare('SELECT 1 FROM users WHERE id=?'),
    };
    this.subs = new Map(); // coll -> Set(sub)
    this.dirty = new Set();
    this.timer = setInterval(() => this.flush(), 200);
    if (this.timer.unref) this.timer.unref();
  }
  // Tokens are looked up by their SHA-256 (column th) so the lookup never compares secrets directly.
  migrate() {
    const cols = this.db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
    if (!cols.includes('th')) this.db.exec('ALTER TABLE users ADD COLUMN th TEXT');
    const missing = this.db.prepare('SELECT id, token FROM users WHERE th IS NULL').all();
    if (missing.length) { const up = this.db.prepare('UPDATE users SET th=? WHERE id=?'); this.db.transaction(rows => { for (const r of rows) up.run(sha256(r.token), r.id); })(missing); }
    this.db.exec('CREATE UNIQUE INDEX IF NOT EXISTS users_th ON users(th)');
  }
  get(coll, id) { const r = this.q.get.get(coll, id); return r ? JSON.parse(r.data) : null; }
  getMeta(coll, id) { const r = this.q.get.get(coll, id); return r ? { data: JSON.parse(r.data), updated: r.updated } : null; }
  encode(data) {
    const s = JSON.stringify(data);
    if (s === undefined || s.length > MAX_DOC) throw Object.assign(new Error('document too large'), { code: 'invalid_argument' });
    return s;
  }
  set(coll, id, data) { this.q.put.run(coll, id, this.encode(data), Date.now()); this.dirty.add(coll); }
  // Create-only write. Returns false (and changes nothing) when the id already exists.
  insert(coll, id, data) { const ok = this.q.ins.run(coll, id, this.encode(data), Date.now()).changes === 1; if (ok) this.dirty.add(coll); return ok; }
  systemWrite(coll, id, data) { this.set(coll, id, data); }
  del(coll, id) { this.q.del.run(coll, id); this.dirty.add(coll); }
  userExists(id) { return typeof id === 'string' && !!this.q.user.get(id); }
  query(coll, q) {
    let rows = this.q.all.all(coll).map(r => ({ id: r.id, data: JSON.parse(r.data) }));
    for (const [f, op, v] of (q && q.where) || []) if (op === '==') rows = rows.filter(r => r.data[f] === v);
    if (q && q.orderBy) { const [f, dir] = q.orderBy; const m = dir === 'desc' ? -1 : 1; rows.sort((a, b) => ((a.data[f] > b.data[f]) - (a.data[f] < b.data[f])) * m); }
    const lim = Math.min(1000, (q && q.limit) || 1000);
    return rows.slice(0, lim);
  }
  subscribe(sub) { if (!this.subs.has(sub.coll)) this.subs.set(sub.coll, new Set()); this.subs.get(sub.coll).add(sub); sub.push(this.query(sub.coll, sub.q)); }
  unsubscribe(sub) { const s = this.subs.get(sub.coll); if (s) { s.delete(sub); if (!s.size) this.subs.delete(sub.coll); } }
  flush() {
    for (const coll of this.dirty) { const s = this.subs.get(coll); if (!s) continue; for (const sub of s) { try { sub.push(this.query(coll, sub.q)); } catch (e) {} } }
    this.dirty.clear();
  }
  close() { clearInterval(this.timer); this.db.close(); }
}
module.exports = { Store, sha256 };
