// Accounts: a guest account on first visit, and wallet sign-in (Phantom, Solflare, Backpack) with a signed message.
const crypto = require('crypto');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const nonces = new Map();
function newId() { return 'u' + crypto.randomBytes(9).toString('base64url'); }
function newToken() { return crypto.randomBytes(24).toString('base64url'); }
function guest(store) {
  const id = newId(), token = newToken();
  store.db.prepare('INSERT INTO users(id,token,created) VALUES(?,?,?)').run(id, token, Date.now());
  return { id, token };
}
function byToken(store, token) { if (!token) return null; return store.db.prepare('SELECT id,wallet FROM users WHERE token=?').get(token) || null; }
function nonce(wallet) { const n = crypto.randomBytes(16).toString('hex'); nonces.set(wallet, { n, t: Date.now() }); return `Sign in to ONI (theonicurse.xyz)\nWallet: ${wallet}\nNonce: ${n}`; }
// Verifies the signature, then links the wallet to the current account (or returns the account that already owns it).
function walletLogin(store, token, wallet, signatureB58) {
  const rec = nonces.get(wallet); if (!rec || Date.now() - rec.t > 5 * 60e3) return { error: 'expired' };
  const msg = new TextEncoder().encode(`Sign in to ONI (theonicurse.xyz)\nWallet: ${wallet}\nNonce: ${rec.n}`);
  let ok = false; try { ok = nacl.sign.detached.verify(msg, bs58.decode(signatureB58), bs58.decode(wallet)); } catch (e) {}
  if (!ok) return { error: 'bad_signature' };
  nonces.delete(wallet);
  const owner = store.db.prepare('SELECT id,token FROM users WHERE wallet=?').get(wallet);
  if (owner) return { id: owner.id, token: owner.token };
  const me = byToken(store, token);
  if (me && !me.wallet) { store.db.prepare('UPDATE users SET wallet=? WHERE id=?').run(wallet, me.id); return { id: me.id, token }; }
  const id = newId(), t = newToken(); store.db.prepare('INSERT INTO users(id,token,wallet,created) VALUES(?,?,?,?)').run(id, t, wallet, Date.now()); return { id, token: t };
}
module.exports = { guest, byToken, nonce, walletLogin };
