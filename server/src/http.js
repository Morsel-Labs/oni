// HTTP hardening: security headers, CSP for the single-file game, per-route methods,
// per-IP rate limits and bounded request bodies.
const crypto = require('crypto');
const fs = require('fs');
const { Limiter, clientIp, perMinute } = require('./ratelimit');

const env = (k, d) => (process.env[k] != null && process.env[k] !== '' ? +process.env[k] : d);
// Route table: allowed methods, which bucket, body cap. Paths not listed are static files.
const ROUTES = {
  '/health': { methods: ['GET', 'HEAD'] },
  '/api/geo': { methods: ['GET'] },
  '/api/leaderboard': { methods: ['GET'], bucket: 'read' },
  '/api/guest': { methods: ['POST'], bucket: 'guest' },
  '/api/nonce': { methods: ['POST'], bucket: 'wallet', body: 4096 },
  '/api/wallet': { methods: ['POST'], bucket: 'wallet', body: 4096 },
  '/api/verify': { methods: ['POST'], bucket: 'verify', body: 6e5 },
};
const STATIC_METHODS = ['GET', 'HEAD'];

function limiters() {
  return {
    all: new Limiter({ rate: env('HTTP_RATE', 30), burst: env('HTTP_BURST', 120) }),
    guest: new Limiter(perMinute(env('GUEST_PER_MIN', 5), env('GUEST_BURST', 10))),
    wallet: new Limiter(perMinute(env('WALLET_PER_MIN', 10), env('WALLET_BURST', 20))),
    verify: new Limiter(perMinute(env('VERIFY_PER_MIN', 6), env('VERIFY_BURST', 6))),
    read: new Limiter({ rate: 1, burst: 10 }),
  };
}

// Inline <script> blocks and the few inline handlers are allowed by hash, so injected
// script still cannot run. Styles stay 'unsafe-inline': the game sets style="" everywhere.
function cspFor(html) {
  const h = s => "'sha256-" + crypto.createHash('sha256').update(s, 'utf8').digest('base64') + "'";
  const scripts = new Set(), handlers = new Set();
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) scripts.add(h(m[1]));
  const markup = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  for (const m of markup.matchAll(/\son[a-z]+="([^"]*)"/gi)) handlers.add(h(m[1]));
  const script = ["'self'", ...scripts].concat(handlers.size ? ["'unsafe-hashes'", ...handlers] : []);
  return [
    "default-src 'self'",
    'script-src ' + script.join(' '),
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    "connect-src 'self' ws: wss:",
    "media-src 'self' data: blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

// Recomputed when index.html changes (a new build), checked at most every 2 s.
function cspCache(file) {
  let mtime = -1, value = cspFor(''), checked = 0;
  return () => {
    const now = Date.now(); if (now - checked < 2000) return value; checked = now;
    try { const st = fs.statSync(file); if (st.mtimeMs !== mtime) { mtime = st.mtimeMs; value = cspFor(fs.readFileSync(file, 'utf8')); } } catch (e) {}
    return value;
  };
}

function securityHeaders(res, csp) {
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
}

function reject(res, code, msg, extra) {
  if (res.headersSent) return res.end();
  res.writeHead(code, Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, extra || {}));
  res.end(JSON.stringify({ error: msg }));
}

// Reads a JSON body up to `max` bytes. Rejects with { status } so the caller can answer 413/400.
function readJson(req, max) {
  max = max || 1e5;
  return new Promise((resolve, rejectP) => {
    const len = +req.headers['content-length'];
    if (len > max) { req.resume(); return rejectP(Object.assign(new Error('body too large'), { status: 413 })); }
    const chunks = []; let size = 0, done = false;
    req.on('data', c => {
      if (done) return; size += c.length;
      if (size > max) { done = true; req.resume(); return rejectP(Object.assign(new Error('body too large'), { status: 413 })); }
      chunks.push(c);
    });
    req.on('end', () => { if (done) return; done = true; const s = Buffer.concat(chunks).toString('utf8'); try { const v = JSON.parse(s || '{}'); resolve(v && typeof v === 'object' ? v : {}); } catch (e) { resolve({}); } });
    req.on('error', e => { if (!done) { done = true; rejectP(Object.assign(e, { status: 400 })); } });
  });
}

// One call at the top of the request handler. Sets headers, enforces method and rate limits.
// Returns false when it has already answered the request.
function createGuard({ indexFile, trustProxy } = {}) {
  const lim = limiters();
  const csp = indexFile ? cspCache(indexFile) : () => cspFor('');
  return function guard(req, res, pathname) {
    securityHeaders(res, csp());
    const route = ROUTES[pathname];
    const methods = route ? route.methods : STATIC_METHODS;
    if (!methods.includes(req.method)) { reject(res, 405, 'method_not_allowed', { Allow: methods.join(', ') }); return false; }
    const ip = clientIp(req, trustProxy);
    if (!lim.all.take(ip) || (route && route.bucket && !lim[route.bucket].take(ip))) { reject(res, 429, 'rate_limited', { 'Retry-After': '30' }); return false; }
    return true;
  };
}
const bodyLimit = pathname => (ROUTES[pathname] && ROUTES[pathname].body) || 1e5;

module.exports = { createGuard, readJson, bodyLimit, cspFor, securityHeaders, reject, ROUTES };
