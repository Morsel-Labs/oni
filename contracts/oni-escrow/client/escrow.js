// ONI escrow client: builds the program's instructions with @solana/web3.js.
// No Anchor IDL needed. Discriminators and account order are checked against the
// Rust program by tests/client.test.js. Devnet only until the program is audited.
const { PublicKey, TransactionInstruction, SystemProgram } = require('@solana/web3.js');

const DISC = {
  initialize_config: [208, 127, 21, 1, 194, 190, 196, 70],
  create_match: [107, 2, 184, 145, 70, 142, 17, 165],
  join_match: [244, 8, 47, 130, 192, 59, 179, 44],
  settle_match: [71, 124, 117, 96, 191, 217, 116, 24],
  cancel_match: [142, 136, 247, 45, 92, 112, 180, 83],
  refund_expired: [118, 153, 164, 244, 40, 128, 242, 250],
  set_paused: [91, 60, 125, 192, 176, 225, 166, 218],
};

const u64 = (n) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(n)); return b; };
const u16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; };
const data = (name, ...parts) => Buffer.concat([Buffer.from(DISC[name]), ...parts]);
const w = (pubkey, isSigner = false) => ({ pubkey, isSigner, isWritable: true });
const r = (pubkey, isSigner = false) => ({ pubkey, isSigner, isWritable: false });
const SYS = r(SystemProgram.programId);

function pdas(programId, matchId) {
  const id = u64(matchId);
  const [config] = PublicKey.findProgramAddressSync([Buffer.from('config')], programId);
  const [matchAcc] = PublicKey.findProgramAddressSync([Buffer.from('match'), id], programId);
  const [vault] = PublicKey.findProgramAddressSync([Buffer.from('vault'), id], programId);
  return { config, matchAcc, vault };
}

function client(programId) {
  programId = new PublicKey(programId);
  const ix = (keys, d) => new TransactionInstruction({ programId, keys, data: d });
  return {
    programId, pdas: (matchId) => pdas(programId, matchId),
    initializeConfig({ admin, referee, treasury, seasonPot, cursePot }) {
      const { config } = pdas(programId, 0);
      return ix([w(config), w(admin, true), r(treasury), r(seasonPot), r(cursePot), SYS], data('initialize_config', referee.toBuffer()));
    },
    createMatch({ player, matchId, stakeLamports }) {
      const p = pdas(programId, matchId);
      return ix([r(p.config), w(p.matchAcc), w(p.vault), w(player, true), SYS], data('create_match', u64(matchId), u64(stakeLamports)));
    },
    joinMatch({ player, matchId }) {
      const p = pdas(programId, matchId);
      return ix([w(p.matchAcc), w(p.vault), w(player, true), SYS], data('join_match'));
    },
    settleMatch({ referee, matchId, winner, feeBps, treasury, seasonPot, cursePot }) {
      const p = pdas(programId, matchId);
      return ix([r(p.config), r(referee, true), w(p.matchAcc), w(p.vault), w(winner), w(treasury), w(seasonPot), w(cursePot), SYS],
        data('settle_match', winner.toBuffer(), u16(feeBps)));
    },
    cancelMatch({ playerA, matchId }) {
      const p = pdas(programId, matchId);
      return ix([w(p.matchAcc), w(playerA, true), w(p.vault), SYS], data('cancel_match'));
    },
    refundExpired({ matchId, playerA, playerB }) {
      const p = pdas(programId, matchId);
      return ix([w(p.matchAcc), w(p.vault), w(playerA), w(playerB), SYS], data('refund_expired'));
    },
    setPaused({ admin, paused }) {
      const { config } = pdas(programId, 0);
      return ix([w(config), r(admin, true)], data('set_paused', Buffer.from([paused ? 1 : 0])));
    },
  };
}

module.exports = { client, pdas, DISC };
