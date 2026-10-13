// Offline checks for the JavaScript client (no network): run with `node tests/client.test.js`.
const assert = require('assert');
const crypto = require('crypto');
const { Keypair, SystemProgram } = require('@solana/web3.js');
const { client, DISC } = require('../client/escrow');

let n = 0; const ok = (name, fn) => { fn(); n++; console.log('PASS', name); };
const programId = Keypair.generate().publicKey;
const esc = client(programId);
const [a, b, ref, t, s, c, admin] = Array.from({ length: 7 }, () => Keypair.generate().publicKey);

ok('discriminators match Anchor (sha256 "global:<name>")', () => {
  for (const [name, d] of Object.entries(DISC)) {
    const want = [...crypto.createHash('sha256').update('global:' + name).digest().subarray(0, 8)];
    assert.deepStrictEqual(d, want, name);
  }
});
ok('create_match: accounts, signer and args', () => {
  const ix = esc.createMatch({ player: a, matchId: 42, stakeLamports: 10_000_000 });
  const p = esc.pdas(42);
  assert.deepStrictEqual(ix.keys.map((k) => k.pubkey.toBase58()), [p.config, p.matchAcc, p.vault, a, SystemProgram.programId].map((x) => x.toBase58()));
  assert.ok(ix.keys[3].isSigner && ix.keys[3].isWritable);
  assert.strictEqual(ix.data.length, 8 + 8 + 8);
  assert.strictEqual(ix.data.readBigUInt64LE(8), 42n);
  assert.strictEqual(ix.data.readBigUInt64LE(16), 10_000_000n);
});
ok('settle_match: only the referee signs, winner and fee encoded', () => {
  const ix = esc.settleMatch({ referee: ref, matchId: 7, winner: b, feeBps: 350, treasury: t, seasonPot: s, cursePot: c });
  assert.deepStrictEqual(ix.keys.filter((k) => k.isSigner).map((k) => k.pubkey.toBase58()), [ref.toBase58()]);
  assert.strictEqual(ix.keys.length, 9);
  assert.ok(ix.data.subarray(8, 40).equals(b.toBuffer()));
  assert.strictEqual(ix.data.readUInt16LE(40), 350);
});
ok('vault and match addresses differ per match', () => {
  assert.notStrictEqual(esc.pdas(1).vault.toBase58(), esc.pdas(2).vault.toBase58());
  assert.notStrictEqual(esc.pdas(1).vault.toBase58(), esc.pdas(1).matchAcc.toBase58());
});
ok('refund_expired needs no signer (anyone can trigger it)', () => {
  const ix = esc.refundExpired({ matchId: 9, playerA: a, playerB: b });
  assert.strictEqual(ix.keys.filter((k) => k.isSigner).length, 0);
});
ok('set_paused is signed by the admin', () => {
  const ix = esc.setPaused({ admin, paused: true });
  assert.ok(ix.keys[1].isSigner); assert.strictEqual(ix.data[8], 1);
});
console.log(`all ${n} client checks passed`);
