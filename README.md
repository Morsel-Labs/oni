# ONI: The Curse You Choose

Skill-based 1v1 pixel fighting in the browser, designed for trustless SOL stakes on Solana. Built by Morsel Labs.

**Play the free demo: https://theonicurse.xyz**

> **Free demo. No real money moves.** See [`STATUS.md`](STATUS.md) for what works today and what is on the roadmap, and [`CHANGES.md`](CHANGES.md) for recent changes.

## Layout

| Path | What it is |
| --- | --- |
| `game/` | `sim.js` (deterministic fight engine, shared with the server), `main.js` (game, village, menus), `page.html`, `art/` |
| `tools/build.js` | Joins everything into one file: `dist/oni-fighter.html` and `server/public/index.html` |
| `tests/` | `mech.js` (12 mechanic checks) and `flow.js` (28 full CPU matches) |
| `server/` | Game server: rooms, `/api/verify` (match replay), `/api/geo` (region check) |
| `contracts/oni-escrow/` | Anchor 0.32.1 escrow program for SOL stakes: create, join, settle, cancel, refund after timeout, pause. Unaudited, not deployed. See its README |
| `docs/ONI-Overview.pdf` | Project overview |
| `docs/NOTES-el.md` | Developer notes in Greek |

## Play

Open `dist/oni-fighter.html` in a browser, or play at https://theonicurse.xyz. To rebuild after changing code: `npm run build`.

## Controls

A / D walk, W or Space jump, S crouch, **E block** (E + S blocks low), J attack, K kick, L curse (special), Q or I throw, S + L super.

## Tests (Node.js 20+)

```bash
npm install
npm test                 # mechanic checks + 28 full matches, about 4-5 minutes
cd server && npm install && npm test   # match verification: honest results pass, false winners are caught
cd contracts/oni-escrow && npm install && npm test   # Rust payout-math tests + client checks (needs Rust)
```

## Server

```bash
cd server && npm install && npm start   # http://localhost:8080
```

Optional settings: `PORT`, `DATA_DIR`, `PAID_BLOCKED`. No keys or secrets are needed.
When the fight code in `game/sim.js` changes, copy it to `server/src/sim.js` so replays stay identical.
