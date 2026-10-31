// ONI escrow client: builds the program's instructions with @solana/web3.js.
// No Anchor IDL needed. Discriminators, account order, signers and argument layout are
// checked against the Rust program by tests/client.test.js. Devnet only until audited.
const { PublicKey, TransactionInstruction, SystemProgram } = require('@solana/web3.js');

const DISC = {
  initialize_config: [208, 127, 21, 1, 194, 190, 196, 70],
  create_match: [107, 2, 184, 145, 70, 142, 17, 165],
  join_match: [244, 8, 47, 130, 192, 59, 179, 44],
  settle_match: [71, 124, 117, 96, 191, 217, 116, 24],
  void_match: [108, 111, 216, 72, 110, 46, 217, 140],
  cancel_match: [142, 136, 247, 45, 92, 112, 180, 83],
  refund_expired: [118, 153, 164, 244, 40, 128, 242, 250],
  withdraw_fees: [198, 212, 171, 109, 144, 215, 174, 89],
  set_paused: [91, 60, 125, 192, 176, 225, 166, 218],
  set_referee: [130, 195, 201, 162, 170, 95, 231, 191],
  set_fee_accounts: [145, 233, 138, 59, 228, 130, 42, 54],
  propose_admin: [121, 214, 199, 212, 87, 39, 117, 234],
  accept_admin: [112, 42, 45, 90, 116, 181, 13, 170],
};

// Must match the Rust constants.
const SETTLE_TIMEOUT_SECS = 60 * 60;
const MIN_STAKE = 1_000_000;
const FEE_BPS_MIN = 300, FEE_BPS_MAX = 500;
const OPEN = PublicKey.default; // opponent for an open match (join needs the referee's co-signature)
const BPF_UPGRADEABLE_LOADER = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
const MATCH_STATES = ['Open', 'Ready', 'Settled', 'Cancelled', 'Refunded'];

const u64 = (n) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(n)); return b; };
const u16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; };
const data = (name, ...parts) => Buffer.concat([Buffer.from(DISC[name]), ...parts]);
const w = (pubkey, isSigner = false) => ({ pubkey, isSigner, isWritable: true });
const r = (pubkey, isSigner = false) => ({ pubkey, isSigner, isWritable: false });
const SYS = r(SystemProgram.programId);

function configPda(programId) {
  return PublicKey.findProgramAddressSync([Buffer.from('config')], programId)[0];
}
// Match ids are per creator: seeds = ["match", player_a, match_id].
function matchPda(programId, playerA, matchId) {
  return PublicKey.findProgramAddressSync([Buffer.from('match'), new PublicKey(playerA).toBuffer(), u64(matchId)], programId)[0];
}
function programDataPda(programId) {
  return PublicKey.findProgramAddressSync([programId.toBuffer()], BPF_UPGRADEABLE_LOADER)[0];
}

/** Decodes a Match account (after the 8-byte discriminator). */
function decodeMatch(buf) {
  let o = 8;
  const id = buf.readBigUInt64LE(o); o += 8;
  const playerA = new PublicKey(buf.subarray(o, o + 32)); o += 32;
  const playerB = new PublicKey(buf.subarray(o, o + 32)); o += 32;
  const stake = buf.readBigUInt64LE(o); o += 8;
  const state = MATCH_STATES[buf[o]]; o += 1;
  const createdAt = buf.readBigInt64LE(o); o += 8;
  const readyAt = buf.readBigInt64LE(o); o += 8;
  return { matchId: id, playerA, playerB, stake, state, createdAt, readyAt, bump: buf[o],
    settleDeadline: state === 'Ready' ? readyAt + BigInt(SETTLE_TIMEOUT_SECS) : null };
}

function client(programId) {
  programId = new PublicKey(programId);
  const ix = (keys, d) => new TransactionInstruction({ programId, keys, data: d });
  const config = configPda(programId);
  return {
    programId, config,
    matchPda: (playerA, matchId) => matchPda(programId, playerA, matchId),
    programData: () => programDataPda(programId),
    /** admin must be the program's upgrade authority. */
    initializeConfig({ admin, referee, treasury, seasonPot, cursePot }) {
      return ix([w(config), w(admin, true), r(programId), r(programDataPda(programId)), r(treasury), r(seasonPot), r(cursePot), SYS],
        data('initialize_config', referee.toBuffer()));
    },
    /** opponent: the only wallet allowed to join, or OPEN (then join needs the referee). */
    createMatch({ player, matchId, stakeLamports, opponent = OPEN }) {
      if (BigInt(stakeLamports) < BigInt(MIN_STAKE)) throw new Error('stake below MIN_STAKE');
      return ix([r(config), w(matchPda(programId, player, matchId)), w(player, true), SYS],
        data('create_match', u64(matchId), u64(stakeLamports), new PublicKey(opponent).toBuffer()));
    },
    /** referee: pass the referee pubkey (it must co-sign) to join an OPEN match; omit for a named match. */
    joinMatch({ player, playerA, matchId, referee }) {
      return ix([r(config), w(matchPda(programId, playerA, matchId)), w(player, true),
        referee ? r(referee, true) : r(programId), SYS], data('join_match'));
    },
    settleMatch({ referee, playerA, playerB, matchId, winner, feeBps }) {
      if (!(feeBps >= FEE_BPS_MIN && feeBps <= FEE_BPS_MAX)) throw new Error('feeBps must be 300..500');
      return ix([w(config), r(referee, true), w(matchPda(programId, playerA, matchId)), w(playerA), w(playerB)],
        data('settle_match', new PublicKey(winner).toBuffer(), u16(feeBps)));
    },
    voidMatch({ referee, playerA, playerB, matchId }) {
      return ix([r(config), r(referee, true), w(matchPda(programId, playerA, matchId)), w(playerA), w(playerB)], data('void_match'));
    },
    cancelMatch({ playerA, matchId }) {
      return ix([w(matchPda(programId, playerA, matchId)), w(playerA, true)], data('cancel_match'));
    },
    /** Anyone can send this once the settle window is over; no signer needed besides the fee payer. */
    refundExpired({ playerA, playerB, matchId }) {
      return ix([w(matchPda(programId, playerA, matchId)), w(playerA), w(playerB)], data('refund_expired'));
    },
    withdrawFees({ treasury, seasonPot, cursePot }) {
      return ix([w(config), w(treasury), w(seasonPot), w(cursePot)], data('withdraw_fees'));
    },
    setPaused({ admin, paused }) {
      return ix([w(config), r(admin, true)], data('set_paused', Buffer.from([paused ? 1 : 0])));
    },
    setReferee({ admin, referee }) {
      return ix([w(config), r(admin, true)], data('set_referee', new PublicKey(referee).toBuffer()));
    },
    setFeeAccounts({ admin, treasury, seasonPot, cursePot }) {
      return ix([w(config), r(admin, true), r(treasury), r(seasonPot), r(cursePot)], data('set_fee_accounts'));
    },
    proposeAdmin({ admin, newAdmin }) {
      return ix([w(config), r(admin, true)], data('propose_admin', new PublicKey(newAdmin).toBuffer()));
    },
    acceptAdmin({ newAdmin }) {
      return ix([w(config), r(newAdmin, true)], data('accept_admin'));
    },
  };
}

module.exports = { client, configPda, matchPda, programDataPda, decodeMatch, DISC, OPEN, SETTLE_TIMEOUT_SECS, MIN_STAKE, FEE_BPS_MIN, FEE_BPS_MAX };
