// End-to-end demo of the escrow on Solana DEVNET (test SOL only, no real money).
// Prerequisites: `anchor build && anchor deploy --provider.cluster devnet`, then
//   PROGRAM_ID=<deployed id> node scripts/devnet-demo.js
// The config can only be initialized by the program's upgrade authority, so the demo loads
// the deploy wallet from ADMIN_KEYPAIR (default ~/.config/solana/id.json) as admin.
// It creates throwaway players and a throwaway referee, plays a 0.01 SOL match against a
// NAMED opponent, settles it as the referee and prints explorer links.
const fs = require('fs'), os = require('os'), path = require('path');
const { Connection, Keypair, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction, clusterApiUrl } = require('@solana/web3.js');
const { client } = require('../client/escrow');

const RPC = process.env.RPC_URL || clusterApiUrl('devnet');
if (!RPC.includes('devnet') && !process.env.ALLOW_NON_DEVNET) throw new Error('Refusing to run outside devnet.');
const PROGRAM_ID = process.env.PROGRAM_ID;
if (!PROGRAM_ID) throw new Error('Set PROGRAM_ID to the deployed devnet program id.');
const ADMIN_PATH = process.env.ADMIN_KEYPAIR || path.join(os.homedir(), '.config', 'solana', 'id.json');

const conn = new Connection(RPC, 'confirmed');
const esc = client(PROGRAM_ID);
const link = (sig) => `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
const send = async (ix, signers, label) => {
  const sig = await sendAndConfirmTransaction(conn, new Transaction().add(ix), signers);
  console.log(`${label.padEnd(16)} ${link(sig)}`);
  return sig;
};
const fund = async (kp, sol) => {
  const sig = await conn.requestAirdrop(kp.publicKey, sol * LAMPORTS_PER_SOL);
  await conn.confirmTransaction(sig, 'confirmed');
};

(async () => {
  const admin = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(ADMIN_PATH, 'utf8'))));
  const [referee, playerA, playerB, treasury, seasonPot, cursePot] = Array.from({ length: 6 }, () => Keypair.generate());
  console.log('Funding test wallets from the devnet faucet...');
  for (const kp of [playerA, playerB]) await fund(kp, 1);

  if (!(await conn.getAccountInfo(esc.config))) {
    await send(esc.initializeConfig({ admin: admin.publicKey, referee: referee.publicKey, treasury: treasury.publicKey,
      seasonPot: seasonPot.publicKey, cursePot: cursePot.publicKey }), [admin], 'init config');
  } else {
    // Existing config: rotate the referee to this run's throwaway key (admin only).
    await send(esc.setReferee({ admin: admin.publicKey, referee: referee.publicKey }), [admin], 'set referee');
  }

  const matchId = Date.now();
  const stake = 0.01 * LAMPORTS_PER_SOL;
  await send(esc.createMatch({ player: playerA.publicKey, matchId, stakeLamports: stake, opponent: playerB.publicKey }), [playerA], 'create match');
  await send(esc.joinMatch({ player: playerB.publicKey, playerA: playerA.publicKey, matchId }), [playerB], 'join match');
  const before = await conn.getBalance(playerA.publicKey);
  // The referee needs no SOL of its own: player A pays the fee for this transaction.
  const tx = new Transaction().add(esc.settleMatch({ referee: referee.publicKey, playerA: playerA.publicKey, playerB: playerB.publicKey,
    matchId, winner: playerA.publicKey, feeBps: 500 }));
  tx.feePayer = playerA.publicKey;
  const sig = await sendAndConfirmTransaction(conn, tx, [playerA, referee]);
  console.log(`${'settle (A wins)'.padEnd(16)} ${link(sig)}`);
  const after = await conn.getBalance(playerA.publicKey);
  console.log(`Player A balance change ${(after - before) / LAMPORTS_PER_SOL} SOL (0.019 prize + match rent back - tx fee).`);
})().catch((e) => { console.error(e); process.exit(1); });
