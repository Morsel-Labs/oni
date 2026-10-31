// Offline checks for the JavaScript client (no network): run with `node tests/client.test.js`.
// Besides unit checks, it parses programs/oni_escrow/src/lib.rs and checks every client
// instruction against the Rust #[derive(Accounts)] structs: account count and order,
// which accounts are writable and which sign, and the argument byte layout.
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Keypair, PublicKey } = require('@solana/web3.js');
const E = require('../client/escrow');

let n = 0; const ok = (name, fn) => { fn(); n++; console.log('PASS', name); };
const programId = Keypair.generate().publicKey;
const esc = E.client(programId);
const [a, b, ref, t, s, c, admin, stranger] = Array.from({ length: 8 }, () => Keypair.generate().publicKey);
const SRC = fs.readFileSync(path.join(__dirname, '..', 'programs', 'oni_escrow', 'src', 'lib.rs'), 'utf8');

// ---- tiny parser for the Rust program
const ARG_SIZE = { u64: 8, u16: 2, Pubkey: 32, bool: 1 };
function parseProgram(src) {
  const ixs = {};
  for (const m of src.matchAll(/pub fn (\w+)\(ctx: Context<(\w+)>((?:, \w+: \w+)*)\)/g)) {
    const args = [...m[3].matchAll(/, (\w+): (\w+)/g)].map((x) => ({ name: x[1], type: x[2] }));
    ixs[m[1]] = { struct: m[2], args, argBytes: args.reduce((sum, x) => sum + ARG_SIZE[x.type], 0) };
  }
  const structs = {};
  for (const m of src.matchAll(/#\[derive\(Accounts\)\][^\n]*\n(?:#\[[^\n]*\n)*pub struct (\w+)<'info> \{([\s\S]*?)\n\}/g)) {
    const fields = []; let attr = '';
    for (const line of m[2].split('\n')) {
      const f = line.match(/^(.*?)pub (\w+): (.+),\s*(\/\/.*)?$/);
      if (!f) { attr += line; continue; }
      attr += f[1];
      fields.push({ name: f[2], type: f[3], mut: /#\[account\([^\]]*\b(mut|init)\b/.test(attr), signer: /Signer</.test(f[3]), optional: /^Option</.test(f[3]) });
      attr = '';
    }
    structs[m[1]] = fields;
  }
  return { ixs, structs };
}
const P = parseProgram(SRC);

// one sample call per instruction (open-match join co-signed by the referee)
const SAMPLES = {
  initialize_config: () => esc.initializeConfig({ admin, referee: ref, treasury: t, seasonPot: s, cursePot: c }),
  create_match: () => esc.createMatch({ player: a, matchId: 42, stakeLamports: 10_000_000, opponent: b }),
  join_match: () => esc.joinMatch({ player: b, playerA: a, matchId: 42, referee: ref }),
  settle_match: () => esc.settleMatch({ referee: ref, playerA: a, playerB: b, matchId: 7, winner: b, feeBps: 350 }),
  void_match: () => esc.voidMatch({ referee: ref, playerA: a, playerB: b, matchId: 7 }),
  cancel_match: () => esc.cancelMatch({ playerA: a, matchId: 7 }),
  refund_expired: () => esc.refundExpired({ playerA: a, playerB: b, matchId: 7 }),
  withdraw_fees: () => esc.withdrawFees({ treasury: t, seasonPot: s, cursePot: c }),
  set_paused: () => esc.setPaused({ admin, paused: true }),
  set_referee: () => esc.setReferee({ admin, referee: stranger }),
  set_fee_accounts: () => esc.setFeeAccounts({ admin, treasury: t, seasonPot: s, cursePot: c }),
  propose_admin: () => esc.proposeAdmin({ admin, newAdmin: stranger }),
  accept_admin: () => esc.acceptAdmin({ newAdmin: stranger }),
};

ok('the parser found every instruction and accounts struct', () => {
  assert.ok(Object.keys(P.ixs).length >= 13, 'instructions: ' + Object.keys(P.ixs));
  for (const [name, i] of Object.entries(P.ixs)) assert.ok(P.structs[i.struct], `${name} -> ${i.struct}`);
});
ok('client covers exactly the program instructions', () => {
  assert.deepStrictEqual(Object.keys(E.DISC).sort(), Object.keys(P.ixs).sort());
  assert.deepStrictEqual(Object.keys(SAMPLES).sort(), Object.keys(P.ixs).sort());
});
ok('discriminators match Anchor (sha256 "global:<name>")', () => {
  for (const [name, d] of Object.entries(E.DISC)) {
    const want = [...crypto.createHash('sha256').update('global:' + name).digest().subarray(0, 8)];
    assert.deepStrictEqual(d, want, name);
  }
});
ok('every instruction: account count, writable and signer flags, arg layout match lib.rs', () => {
  for (const [name, make] of Object.entries(SAMPLES)) {
    const ix = make(); const spec = P.ixs[name]; const fields = P.structs[spec.struct];
    assert.ok(ix.programId.equals(programId), name);
    assert.strictEqual(ix.keys.length, fields.length, `${name}: ${fields.map((f) => f.name)}`);
    fields.forEach((f, i) => {
      assert.strictEqual(ix.keys[i].isWritable, f.mut, `${name}.${f.name} writable`);
      assert.strictEqual(ix.keys[i].isSigner, f.signer, `${name}.${f.name} signer`);
    });
    assert.strictEqual(ix.data.length, 8 + spec.argBytes, `${name} data length`);
    assert.deepStrictEqual([...ix.data.subarray(0, 8)], E.DISC[name], name);
  }
});
ok('match PDA includes the creator, so ids cannot be squatted', () => {
  assert.notStrictEqual(esc.matchPda(a, 1).toBase58(), esc.matchPda(b, 1).toBase58());
  assert.notStrictEqual(esc.matchPda(a, 1).toBase58(), esc.matchPda(a, 2).toBase58());
  assert.ok(/seeds = \[b"match"\.as_ref\(\), player\.key\(\)\.as_ref\(\), match_id\.to_le_bytes\(\)\.as_ref\(\)\]/.test(SRC), 'Rust seeds changed');
  const [want] = PublicKey.findProgramAddressSync([Buffer.from('match'), a.toBuffer(), Buffer.from([1, 0, 0, 0, 0, 0, 0, 0])], programId);
  assert.ok(esc.matchPda(a, 1).equals(want));
});
ok('create_match: player signs, args are id, stake, opponent', () => {
  const ix = SAMPLES.create_match();
  assert.ok(ix.keys[1].pubkey.equals(esc.matchPda(a, 42)));
  assert.strictEqual(ix.data.readBigUInt64LE(8), 42n);
  assert.strictEqual(ix.data.readBigUInt64LE(16), 10_000_000n);
  assert.ok(ix.data.subarray(24, 56).equals(b.toBuffer()));
  const open = esc.createMatch({ player: a, matchId: 1, stakeLamports: E.MIN_STAKE });
  assert.ok(open.data.subarray(24, 56).equals(Buffer.alloc(32)), 'default opponent = open match');
  assert.throws(() => esc.createMatch({ player: a, matchId: 1, stakeLamports: E.MIN_STAKE - 1 }));
});
ok('join_match: named match passes no referee (Anchor None = program id), open match makes it a signer', () => {
  const named = esc.joinMatch({ player: b, playerA: a, matchId: 42 });
  assert.ok(named.keys[3].pubkey.equals(programId) && !named.keys[3].isSigner);
  assert.deepStrictEqual(named.keys.filter((k) => k.isSigner).map((k) => k.pubkey.toBase58()), [b.toBase58()]);
  const open = SAMPLES.join_match();
  assert.deepStrictEqual(open.keys.filter((k) => k.isSigner).map((k) => k.pubkey.toBase58()), [b.toBase58(), ref.toBase58()]);
});
ok('settle_match: only the referee signs, winner and fee encoded, fee bounds enforced client-side too', () => {
  const ix = SAMPLES.settle_match();
  assert.deepStrictEqual(ix.keys.filter((k) => k.isSigner).map((k) => k.pubkey.toBase58()), [ref.toBase58()]);
  assert.ok(ix.data.subarray(8, 40).equals(b.toBuffer()));
  assert.strictEqual(ix.data.readUInt16LE(40), 350);
  for (const bad of [299, 501, 0]) assert.throws(() => esc.settleMatch({ referee: ref, playerA: a, playerB: b, matchId: 7, winner: b, feeBps: bad }));
});
ok('cancel and refund cannot be blocked: no config, no admin, refund needs no signer', () => {
  for (const name of ['cancel_match', 'refund_expired']) {
    const fields = P.structs[P.ixs[name].struct].map((f) => f.name);
    assert.ok(!fields.includes('config'), `${name} must not depend on config (pause/admin)`);
  }
  assert.strictEqual(SAMPLES.refund_expired().keys.filter((k) => k.isSigner).length, 0);
  assert.deepStrictEqual(SAMPLES.cancel_match().keys.filter((k) => k.isSigner).map((k) => k.pubkey.toBase58()), [a.toBase58()]);
});
ok('terminal instructions close the match account to player A', () => {
  for (const name of ['settle_match', 'void_match', 'cancel_match', 'refund_expired']) {
    const body = SRC.match(new RegExp(`pub struct ${P.ixs[name].struct}<'info> \\{([\\s\\S]*?)\\n\\}`))[1];
    assert.ok(/close = player_a/.test(body), name);
  }
});
ok('constants match the Rust program', () => {
  const k = (name) => Number(SRC.match(new RegExp(`pub const ${name}: \\w+ = ([^;]+);`))[1].replace(/_/g, '').split('//')[0].trim().split(' * ').reduce((x, y) => x * Number(y), 1));
  assert.strictEqual(k('SETTLE_TIMEOUT_SECS'), E.SETTLE_TIMEOUT_SECS);
  assert.strictEqual(k('MIN_STAKE'), E.MIN_STAKE);
  assert.strictEqual(k('FEE_BPS_MIN'), E.FEE_BPS_MIN);
  assert.strictEqual(k('FEE_BPS_MAX'), E.FEE_BPS_MAX);
});
ok('decodeMatch reads the Match layout', () => {
  const buf = Buffer.concat([Buffer.alloc(8), Buffer.from(new BigUint64Array([5n]).buffer), a.toBuffer(), b.toBuffer(),
    Buffer.from(new BigUint64Array([BigInt(E.MIN_STAKE * 3)]).buffer), Buffer.from([1]),
    Buffer.from(new BigInt64Array([100n]).buffer), Buffer.from(new BigInt64Array([200n]).buffer), Buffer.from([254])]);
  assert.strictEqual(buf.length, 8 + 8 + 32 * 2 + 8 + 1 + 8 + 8 + 1);
  const m = E.decodeMatch(buf);
  assert.strictEqual(m.matchId, 5n); assert.ok(m.playerA.equals(a) && m.playerB.equals(b));
  assert.strictEqual(m.stake, BigInt(E.MIN_STAKE * 3)); assert.strictEqual(m.state, 'Ready');
  assert.strictEqual(m.readyAt, 200n); assert.strictEqual(m.settleDeadline, 200n + BigInt(E.SETTLE_TIMEOUT_SECS)); assert.strictEqual(m.bump, 254);
});
ok('initialize_config passes the program and its ProgramData (upgrade authority check)', () => {
  const ix = SAMPLES.initialize_config();
  assert.ok(ix.keys[2].pubkey.equals(programId));
  assert.ok(ix.keys[3].pubkey.equals(esc.programData()));
});
console.log(`all ${n} client checks passed`);
