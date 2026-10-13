# ONI escrow (Solana, SOL stakes)

**Unaudited. Not deployed. Devnet only until audited.** The game does not call it yet.

Holds both players' SOL stakes in a program-owned vault, then pays the winner and splits the fee by fixed rules:

| Step | Instruction | Who signs |
| --- | --- | --- |
| Open a match, lock stake | `create_match(match_id, stake)` | player A |
| Join with the same stake | `join_match` | player B |
| Report the verified winner | `settle_match(winner, fee_bps)` | ONI server (referee) only |
| Take the stake back if nobody joined | `cancel_match` | player A |
| Refund both after 1 hour without a result | `refund_expired` | anyone |
| Stop new matches (never freezes stakes) | `set_paused` | admin |

Payout of a settled pot (2 x stake): winner gets pot minus fee; fee is 3% to 5% by $ONI tier; 1% goes to the season pot and 0.5% to the Curse Cauldron, ONI keeps the rest. Rounding dust goes to the winner. Fees outside 3-5% are refused on-chain.

## What is tested today

```bash
npm install
npm test     # Rust unit tests (payout math) + JS client checks, no network needed
```

- `cargo test`: the program compiles with Anchor 0.32.1; 6 tests check the payout math ($10 example, Gold tier, nothing lost for any stake and tier, fee bounds, no overflow) and print Anchor's instruction discriminators.
- `tests/client.test.js`: 6 checks that the JS client's discriminators, account order, signers and arguments match the program.

## Deploy to devnet (test SOL)

Needs the Solana CLI and Anchor 0.32.1 (`avm install 0.32.1`).

```bash
solana config set --url devnet
solana airdrop 2
anchor keys sync          # replaces the placeholder program id with your deploy key
anchor build
anchor deploy --provider.cluster devnet
PROGRAM_ID=<printed id> npm run demo:devnet
```

The demo creates throwaway wallets, funds them from the faucet, initializes the config, plays a 0.01 SOL match, settles it as the referee and prints Solana Explorer links. It refuses to run outside devnet.

## Not done yet (before any real money)

- Built for SBF and deployed on devnet (above).
- Integration tests against a local validator (LiteSVM or `anchor test`).
- Wiring into the game server: the server replays each staked match (`/api/verify`) and only then signs `settle_match`.
- External audit, then mainnet.
