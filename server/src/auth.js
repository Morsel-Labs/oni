// Accounts: a guest account on first visit, and wallet sign-in (Phantom, Solflare, Backpack) with a signed message.
// Tokens are bearer secrets: never log them.
const crypto = require('crypto');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const { sha256 } = require('./store');

const NONCE_TTL = 5 * 60e3, MAX_NONCES = +process.env.MAX_NONCES || 10000;
const nonces = new Map();   // wallet -> { n, t }, insertion-ordered so the oldest is evicted first
function pruneNonces(now) {
  now = now || Date.now();
  for (const [w, r] of nonces) if (now - r.t > NONCE_TTL) nonces.delete(w);
}
setInterval(pruneNonces, 60e3).unref();

function newId() { return 'u' + crypto.randomBytes(9).toString('base64url'); }
function newToken() { return crypto.randomBytes(24).toString('base64url'); }
const isToken = t => typeof t === 'string' && t.length >= 16 && t.length <= 128;
function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function guest(store) {
  const id = newId(), token = newToken();
  store.db.prepare('INSERT INTO users(id,token,th,created) VALUES(?,?,?,?)').run(id, token, sha256(token), Date.now());
  return { id, token };
}
function byToken(store, token) {
  if (!isToken(token)) return null;
  const r = store.db.prepare('SELECT id,wallet,token FROM users WHERE th=?').get(sha256(token));
  return r && safeEqual(r.token, token) ? { id: r.id, wallet: r.wallet } : null;
}
const message = (wallet, n) => `Sign in to ONI (theonicurse.xyz)\nWallet: ${wallet}\nNonce: ${n}`;
function nonce(wallet) {
  const n = crypto.randomBytes(16).toString('hex');
  nonces.delete(wallet);
  if (nonces.size >= MAX_NONCES) pruneNonces();
  while (nonces.size >= MAX_NONCES) nonces.delete(nonces.keys().next().value);
  nonces.set(wallet, { n, t: Date.now() });
  return message(wallet, n);
}
// Verifies the signature, then links the wallet to the current account (or returns the account that already owns it).
function walletLogin(store, token, wallet, signatureB58) {
  if (typeof wallet !== 'string' || typeof signatureB58 !== 'string' || signatureB58.length > 128) return { error: 'bad_request' };
  const rec = nonces.get(wallet); if (!rec || Date.now() - rec.t > NONCE_TTL) return { error: 'expired' };
  const msg = new TextEncoder().encode(message(wallet, rec.n));
  let ok = false; try { ok = nacl.sign.detached.verify(msg, bs58.decode(signatureB58), bs58.decode(wallet)); } catch (e) {}
  if (!ok) return { error: 'bad_signature' };
  nonces.delete(wallet);
  const owner = store.db.prepare('SELECT id,token FROM users WHERE wallet=?').get(wallet);
  if (owner) return { id: owner.id, token: owner.token };
  const me = byToken(store, token);
  if (me && !me.wallet) { store.db.prepare('UPDATE users SET wallet=? WHERE id=?').run(wallet, me.id); return { id: me.id, token }; }
  const id = newId(), t = newToken();
  store.db.prepare('INSERT INTO users(id,token,th,wallet,created) VALUES(?,?,?,?,?)').run(id, t, sha256(t), wallet, Date.now());
  return { id, token: t };
}
module.exports = { guest, byToken, nonce, walletLogin, pruneNonces, nonceCount: () => nonces.size, safeEqual };
