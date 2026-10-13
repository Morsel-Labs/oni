// Document store on SQLite with live subscriptions (the "db" the game uses).
const Database = require('better-sqlite3');
const MAX_DOC = 256 * 1024;

class Store {
  constructor(file) {
    this.db = new Database(file);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`CREATE TABLE IF NOT EXISTS docs(coll TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, updated INTEGER NOT NULL, PRIMARY KEY(coll,id));
                  CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, token TEXT UNIQUE NOT NULL, wallet TEXT UNIQUE, created INTEGER NOT NULL);`);
    this.q = {
      put: this.db.prepare('INSERT INTO docs(coll,id,data,updated) VALUES(?,?,?,?) ON CONFLICT(coll,id) DO UPDATE SET data=excluded.data, updated=excluded.updated'),
      get: this.db.prepare('SELECT data FROM docs WHERE coll=? AND id=?'),
      del: this.db.prepare('DELETE FROM docs WHERE coll=? AND id=?'),
      all: this.db.prepare('SELECT id,data FROM docs WHERE coll=?'),
    };
    this.subs = new Map(); // coll -> Set(sub)
    this.dirty = new Set();
    setInterval(() => this.flush(), 200);
  }
  get(coll, id) { const r = this.q.get.get(coll, id); return r ? JSON.parse(r.data) : null; }
  set(coll, id, data) {
    const s = JSON.stringify(data);
    if (s.length > MAX_DOC) throw Object.assign(new Error('document too large'), { code: 'invalid_argument' });
    this.q.put.run(coll, id, s, Date.now()); this.dirty.add(coll);
  }
  del(coll, id) { this.q.del.run(coll, id); this.dirty.add(coll); }
  query(coll, q) {
    let rows = this.q.all.all(coll).map(r => ({ id: r.id, data: JSON.parse(r.data) }));
    for (const [f, op, v] of (q && q.where) || []) if (op === '==') rows = rows.filter(r => r.data[f] === v);
    if (q && q.orderBy) { const [f, dir] = q.orderBy; const m = dir === 'desc' ? -1 : 1; rows.sort((a, b) => ((a.data[f] > b.data[f]) - (a.data[f] < b.data[f])) * m); }
    const lim = Math.min(1000, (q && q.limit) || 1000);
    return rows.slice(0, lim);
  }
  subscribe(sub) { if (!this.subs.has(sub.coll)) this.subs.set(sub.coll, new Set()); this.subs.get(sub.coll).add(sub); sub.push(this.query(sub.coll, sub.q)); }
  unsubscribe(sub) { const s = this.subs.get(sub.coll); if (s) s.delete(sub); }
  flush() {
    for (const coll of this.dirty) { const s = this.subs.get(coll); if (!s) continue; for (const sub of s) { try { sub.push(this.query(coll, sub.q)); } catch (e) {} } }
    this.dirty.clear();
  }
}
module.exports = { Store };
