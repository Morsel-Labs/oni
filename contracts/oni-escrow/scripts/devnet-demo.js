// End-to-end demo of the escrow on Solana DEVNET (test SOL only, no real money).
// Prerequisites: `anchor build && anchor deploy --provider.cluster devnet`, then
//   PROGRAM_ID=<deployed id> node scripts/devnet-demo.js
// It creates throwaway wallets, funds them from the devnet faucet, initializes the config
// (first run only), plays a 0.01 SOL match, settles it as the referee and prints explorer links.
const { Connection, Keypair, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction, clusterApiUrl } = require('@solana/web3.js');
const { client } = require('../client/escrow');

const RPC = process.env.RPC_URL || clusterApiUrl('devnet');
if (!RPC.includes('devnet') && !process.env.ALLOW_NON_DEVNET) throw new Error('Refusing to run outside devnet.');
const PROGRAM_ID = process.env.PROGRAM_ID;
if (!PROGRAM_ID) throw new Error('Set PROGRAM_ID to the deployed devnet program id.');

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
  const [admin, referee, playerA, playerB, treasury, seasonPot, cursePot] = Array.from({ length: 7 }, () => Keypair.generate());
  console.log('Funding test wallets from the devnet faucet...');
  for (const kp of [admin, referee, playerA, playerB]) await fund(kp, 1);
  for (const kp of [treasury, seasonPot, cursePot]) await fund(kp, 0.01); // rent-exempt receivers

  const { config } = esc.pdas(0);
  if (!(await conn.getAccountInfo(config))) {
    await send(esc.initializeConfig({ admin: admin.publicKey, referee: referee.publicKey, treasury: treasury.publicKey,
      seasonPot: seasonPot.publicKey, cursePot: cursePot.publicKey }), [admin], 'init config');
  } else {
    console.log('Config already exists: set TREASURY/SEASON/CURSE/REFEREE to the existing ones to settle (see README).');
    process.exit(0);
  }

  const matchId = Date.now();
  const stake = 0.01 * LAMPORTS_PER_SOL;
  await send(esc.createMatch({ player: playerA.publicKey, matchId, stakeLamports: stake }), [playerA], 'create match');
  await send(esc.joinMatch({ player: playerB.publicKey, matchId }), [playerB], 'join match');
  const before = await conn.getBalance(playerA.publicKey);
  await send(esc.settleMatch({ referee: referee.publicKey, matchId, winner: playerA.publicKey, feeBps: 500,
    treasury: treasury.publicKey, seasonPot: seasonPot.publicKey, cursePot: cursePot.publicKey }), [referee], 'settle (A wins)');
  const after = await conn.getBalance(playerA.publicKey);
  console.log(`Winner received ${(after - before) / LAMPORTS_PER_SOL} SOL (expected 0.019).`);
})().catch((e) => { console.error(e); process.exit(1); });
