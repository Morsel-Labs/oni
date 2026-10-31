# ONI escrow (Solana, SOL stakes)

**Unaudited. Not deployed. Devnet only until an external audit.** The game does not call it yet.

Holds both players' SOL stakes in the match account (a program-owned PDA), then pays the winner and accrues the fee by fixed rules.

| Step | Instruction | Who signs | Blocked by pause? |
| --- | --- | --- | --- |
| One-time setup | `initialize_config(referee)` | program upgrade authority | - |
| Open a match, lock stake | `create_match(match_id, stake, opponent)` | player A | yes |
| Join with the same stake | `join_match` | player B (+ referee if the match is open) | yes |
| Report the verified winner (inside the settle window) | `settle_match(winner, fee_bps)` | referee | no |
| Refund both in full (draw / no contest) | `void_match` | referee | no |
| Take the stake back while nobody has joined | `cancel_match` | player A | no |
| Refund both after the settle window (1 hour) | `refund_expired` | anyone | no |
| Pay accrued fees to the configured wallets | `withdraw_fees` | anyone | no |
| Stop new matches and joins | `set_paused` | admin | - |
| Rotate the referee key | `set_referee` | admin | - |
| Change fee wallets | `set_fee_accounts` | admin | - |
| Hand over admin (two steps) | `propose_admin` / `accept_admin` | admin / new admin | - |

Payout of a settled pot (2 x stake): winner gets pot minus fee; fee is 3% to 5% by $ONI tier; 1% goes to the season pot and 0.5% to the Curse Cauldron, ONI keeps the rest. Rounding dust goes to the winner. Fees outside 3-5% are refused on-chain. Fees accrue in the config PDA and `withdraw_fees` moves them out; a missing or unfunded fee wallet can never block a player payout.

Every terminal instruction (`settle_match`, `void_match`, `cancel_match`, `refund_expired`) closes the match account and returns its rent (plus any lamports someone sent to it) to player A, who paid it.

## Who can join (griefing fix)

Before this change anyone could join any open match, lock both stakes and walk away, so the creator waited an hour for the refund. Now the creator chooses at `create_match`:

- **Named opponent** (`opponent = <pubkey>`, the default for ONI): only that wallet can join. A referee co-signature cannot override it. This is what the game uses once matchmaking has paired two wallets.
- **Open** (`opponent = Pubkey::default()`): any wallet can join, but only with the **referee's co-signature**. The server signs a join only for the player its matchmaker paired, so a sniper without the server's signature can't get in.

In both modes, player A can `cancel_match` at any moment while the match is unjoined, with no timeout, no config read and no pause check. Once joined, money leaves only through `settle_match` / `void_match` (referee, before the deadline) or `refund_expired` (anyone, from the deadline on). The windows are exact complements: settle needs `now < ready_at + 3600`, refund needs `now >= ready_at + 3600`, so at every second exactly one of them works. `refund_expired` takes no config account and no signer, so a paused program, a lost admin key or a dead referee cannot block it.

Trade-offs considered:

| Option | For | Against |
| --- | --- | --- |
| Named opponent only | No trust in the server to join; simplest | Needs the opponent's wallet before creating; no public lobby |
| Open + referee co-sign (chosen for open matches) | Public lobby still possible; sniping impossible | Join depends on the server being up (the creator can always cancel) |
| Open + creator may cancel a joined-but-unplayed match | No server dependency | A creator who is losing could "cancel" mid-fight; needs on-chain "played" proof we don't have |
| Shorter timeout only | Trivial | Only shrinks the grief, doesn't stop it |

## Trust model (read this before staking anything)

- **One referee key decides every result.** `settle_match` pays whoever the referee names, within the 3-5% fee cap. The program cannot tell whether the referee is honest. It is exactly as trustworthy as the ONI server and how that key is stored.
- The referee is only meaningful if the server *knows* the result. Today online 1v1 is host-authoritative (see `docs/AUDIT.md`, P1 #5): the host's own input log is what the server replays, so a cheating host could make the server sign a false result. **Another workstream is moving online 1v1 to a server-authoritative simulation** (the server runs the sim from both clients' inputs). Staked matches must not be enabled before that ships.
- **What the referee can't do:** take funds for itself, pay anyone who isn't a player of the match, charge outside 3-5%, settle twice, settle after the deadline, or stop `refund_expired` / `cancel_match`.
- **The admin can rotate the referee**, which is equivalent to referee power over every Ready match. The admin also can pause new matches and redirect *future fee withdrawals*. The admin can't touch stakes or block refunds. Keep the admin in a multisig (e.g. Squads) and the referee in an HSM/KMS, ideally with the server signing only after its own replay check.
- `initialize_config` checks that the signer is the program's upgrade authority, so nobody can front-run the deploy and install their own admin. The upgrade authority itself can replace the program code, which is the ultimate trust root. Move it to the multisig (or make the program immutable) before mainnet.

Known residual risks (accepted for the preview, listed for the auditor):

- A match id can be reused by the same creator after the old match is closed. A referee transaction signed for the old match could only land on a new match with the same id, the same players and a fresh Ready state, all within that transaction's blockhash lifetime (about 1 minute). The server should use fresh ids (e.g. a counter) and never re-sign stale results.
- `Clock::unix_timestamp` can drift a few seconds from wall time, which shifts the deadline by that much.
- No integration tests on a validator yet (below).

## What is tested today

```bash
npm ci
npm test     # cargo test (Rust rules + payout math) + JS client checks, no network needed after deps are fetched
```

- `cargo test -p oni_escrow`: 16 tests. Payout math: the $10 example, Gold tier, no lamport lost for any stake and every fee from 300 to 500 bps, fee never above the cap, pot must fit in u64. State guards: create rules, only the invited wallet joins a named match, open match needs the referee, join once and not while paused, settle/refund windows are exact complements at the boundary, wrong-state refusals, checked deadline math. Lamport flow of a settle on real `AccountInfo`s. Stable account sizes, and it prints the Anchor discriminators.
- `tests/client.test.js`: 13 checks. It parses `lib.rs` and checks that every client instruction matches its `#[derive(Accounts)]` struct (account count, order of writable/signer flags, argument byte layout), plus discriminators, PDA seeds, constants, the `Match` decoder, and that cancel/refund don't depend on config.

`cargo test` needs crates.io the first time (CI caches `~/.cargo` and `target/`).

## Deploy to devnet (test SOL)

Needs the Solana CLI and Anchor 0.32.1 (`avm install 0.32.1`). Not verified in this repo's CI.

```bash
solana config set --url devnet
solana airdrop 2
anchor keys sync          # replaces the placeholder program id with your deploy key
anchor build
anchor deploy --provider.cluster devnet
PROGRAM_ID=<printed id> npm run demo:devnet   # admin = your deploy wallet (upgrade authority)
```

The demo creates throwaway players and a throwaway referee, plays a 0.01 SOL match against a named opponent, settles it and prints Solana Explorer links. It refuses to run outside devnet.

## Not done yet (before any real money)

- SBF build and devnet deploy (above), then integration tests on a local validator (LiteSVM or `anchor test`) for each instruction and every refusal path.
- Server-authoritative online 1v1 (in progress elsewhere), then wiring: the server signs `join_match` for paired players and `settle_match` / `void_match` only for results it computed itself.
- Admin multisig, referee key in an HSM, upgrade authority policy.
- External audit, then mainnet.
