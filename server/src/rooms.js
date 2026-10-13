// Presence rooms: the village lobby (sharded, 40 players each) and private match rooms.
const LOBBY_CAP = 40, MAX_PRESENCE = 4096;
class Rooms {
  constructor() { this.rooms = new Map(); this.dirty = new Set(); setInterval(() => this.flush(), 50); }
  room(name) { let r = this.rooms.get(name); if (!r) { r = { name, members: new Map() }; this.rooms.set(name, r); } return r; }
  lobbyFor(conn) {
    for (let i = 0; ; i++) { const n = 'lobby#' + i; const r = this.room(n); if (r.members.size < LOBBY_CAP || r.members.has(conn.peer)) return n; }
  }
  join(conn, name) { const r = this.room(name); r.members.set(conn.peer, { conn, presence: {}, updatedAt: Date.now() }); conn.rooms.add(name); this.dirty.add(name); }
  leave(conn, name) { const r = this.rooms.get(name); if (!r) return; r.members.delete(conn.peer); conn.rooms.delete(name); this.dirty.add(name); if (!r.members.size) this.rooms.delete(name); }
  leaveAll(conn) { for (const n of [...conn.rooms]) this.leave(conn, n); }
  presence(conn, name, patch) {
    const r = this.rooms.get(name); const m = r && r.members.get(conn.peer); if (!m) return 'not_found';
    const next = Object.assign({}, m.presence);
    for (const k of Object.keys(patch || {})) { if (patch[k] === null) delete next[k]; else next[k] = patch[k]; }
    if (JSON.stringify(next).length > MAX_PRESENCE) return 'invalid_argument';
    m.presence = next; m.updatedAt = Date.now(); this.dirty.add(name); return null;
  }
  flush() {
    for (const name of this.dirty) {
      const r = this.rooms.get(name); if (!r) continue;
      const list = [...r.members.values()].map(m => ({ peer: m.conn.peer, by: m.conn.uid, kind: 'viewer', guest: false, presence: m.presence, updatedAt: m.updatedAt, tab: m.conn.tab }));
      for (const m of r.members.values()) {
        const peers = list.map(p => ({ peer: p.peer, by: p.by, kind: p.kind, guest: p.guest, presence: p.presence, updatedAt: p.updatedAt, isMe: p.by === m.conn.uid, sameTab: p.peer === m.conn.peer }));
        m.conn.send({ t: 'peers', room: m.conn.alias.get(name) || name, peers });
      }
    }
    this.dirty.clear();
  }
}
module.exports = { Rooms };
