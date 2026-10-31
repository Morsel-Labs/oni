// Per-seat input jitter buffer for the authoritative match.
//
// Clients send one 8-bit input mask per local 60 Hz frame, numbered by the client.
// The server consumes exactly one mask per simulation step. The buffer:
//   - drops duplicates/resends (frame number <= last received),
//   - holds `delay` frames of cushion after a stall before it starts consuming again,
//   - repeats the last mask when empty (and decays to neutral after `idleNeutral` empty steps,
//     so a vanished client does not keep walking or blocking forever),
//   - stays bounded at `max` frames: it first removes a frame equal to its predecessor
//     (that never removes a press edge), else drops the oldest.
// No press is lost because of jitter: it is only delayed.
class InputBuffer {
  constructor(opts) {
    opts = opts || {};
    this.delay = opts.delay != null ? opts.delay : 2;
    this.max = Math.max(this.delay + 1, opts.max || 8);
    this.idleNeutral = opts.idleNeutral || 30;
    this.q = [];           // [clientFrame, mask]
    this.last = 0;         // last applied mask
    this.lastFrame = -1;   // highest client frame received (the ack)
    this.consumed = -1;    // client frame number of the last applied mask
    this.starving = true;
    this.starve = 0;
    this.dropped = 0; this.repeated = 0;
  }
  push(f0, masks) {
    let added = 0;
    for (let i = 0; i < masks.length; i++) {
      const fr = f0 + i; if (fr <= this.lastFrame) continue;
      this.q.push([fr, masks[i] & 255]); this.lastFrame = fr; added++;
    }
    while (this.q.length > this.max) {
      let k = -1;
      for (let i = 1; i < this.q.length; i++) if (this.q[i][1] === this.q[i - 1][1]) { k = i; break; }
      if (k > 0) this.q.splice(k, 1); else this.q.shift();
      this.dropped++;
    }
    return added;
  }
  next() {
    if (!this.q.length || (this.starving && this.q.length < this.delay)) {
      this.starving = true; this.repeated++;
      if (++this.starve > this.idleNeutral) this.last = 0;
      return this.last;
    }
    this.starving = false; this.starve = 0;
    const [fr, b] = this.q.shift(); this.consumed = fr; this.last = b; return b;
  }
  clear() { this.q = []; this.last = 0; this.starving = true; this.starve = 0; }
}
module.exports = { InputBuffer };
