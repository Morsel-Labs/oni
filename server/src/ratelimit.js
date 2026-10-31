// Token buckets keyed by IP, connection or user, and the client-IP rule for proxies.
class Bucket {
  // rate: tokens per second, burst: bucket size
  constructor(rate, burst, now) { this.rate = rate; this.burst = burst; this.tokens = burst; this.t = now ?? Date.now(); }
  take(n, now) {
    now = now ?? Date.now();
    this.tokens = Math.min(this.burst, this.tokens + (now - this.t) / 1000 * this.rate); this.t = now;
    if (this.tokens < (n || 1)) return false;
    this.tokens -= n || 1; return true;
  }
  full(now) { return this.tokens + ((now ?? Date.now()) - this.t) / 1000 * this.rate >= this.burst; }
}

class Limiter {
  constructor({ rate, burst, maxKeys = 100000 }) {
    this.rate = rate; this.burst = burst; this.maxKeys = maxKeys; this.map = new Map();
    this.timer = setInterval(() => this.sweep(), 60e3); this.timer.unref();
  }
  take(key, n, now) {
    let b = this.map.get(key);
    if (!b) {
      if (this.map.size >= this.maxKeys) this.sweep(now);
      if (this.map.size >= this.maxKeys) this.map.delete(this.map.keys().next().value);
      b = new Bucket(this.rate, this.burst, now); this.map.set(key, b);
    }
    return b.take(n, now);
  }
  // A full bucket is the same as no bucket, so it can be forgotten.
  sweep(now) { for (const [k, b] of this.map) if (b.full(now)) this.map.delete(k); }
}

const perMinute = (n, burst) => ({ rate: n / 60, burst });

// Behind a reverse proxy every socket comes from the proxy. TRUST_PROXY=<hops> tells us how many
// proxies append to X-Forwarded-For, so the client is that many entries from the right.
// Without it the header is ignored: clients can write anything into it.
function clientIp(req, trustProxy) {
  const hops = trustProxy === undefined ? +(process.env.TRUST_PROXY || 0) : +trustProxy;
  const direct = (req.socket && req.socket.remoteAddress) || '';
  if (hops > 0) {
    const xff = String(req.headers['x-forwarded-for'] || '').split(',').map(s => s.trim()).filter(Boolean);
    if (xff.length) return xff[Math.max(0, xff.length - hops)];
  }
  return direct.replace(/^::ffff:/, '');
}

// Open connections per IP.
class Counter {
  constructor(max) { this.max = max; this.map = new Map(); }
  open(key) { const n = this.map.get(key) || 0; if (n >= this.max) return false; this.map.set(key, n + 1); return true; }
  close(key) { const n = (this.map.get(key) || 1) - 1; if (n > 0) this.map.set(key, n); else this.map.delete(key); }
}

module.exports = { Bucket, Limiter, Counter, clientIp, perMinute };
