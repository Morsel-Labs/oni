# ONI: status (October 8, 2026)

Plain status for reviewers. "Works" means it runs today and is covered by tests or was checked in a browser.
Nothing in ONI moves real money yet.

| Works today | Preview or demo | Roadmap |
| --- | --- | --- |
| 1v1 fighting game in the browser, desktop and phone: 7 playable fighters and Enma (boss), 9 arenas, specials, supers, throws, blocks | Stakes on 1v1 matches: rules, fees and limits work, but no money moves | Escrow deployed on devnet (one-command script ready) and integration-tested |
| CPU opponents with 5 difficulty levels, training, tutorial, arcade | TENKA cups: playable, but lobbies fill with simulated opponents | Real wallet login (signed message) in the game |
| Deterministic fight engine shared by the game and the server | Enma's $1 jar: the jar fills in demo money only | Game connected to the escrow on devnet, test money only |
| Match verification: the server replays a match from its key log and confirms the winner (tests: honest matches verify, false winners and cut logs are rejected) | Market and inventory: buying, bundles and equipping work with demo balances | Audit of the escrow program and the server |
| Shared village with walking, emotes and doors to every mode | Trade market: sample listings, demo purchases | Real SOL payments on mainnet, only after the audit and a legal review |
| Missions, chests with published odds, levels, achievements, medals, Spirit Shards (free rewards for beating the CPU, capped daily, not ONI) | $ONI holder tiers (Bronze, Silver, Jade, Gold): computed from a demo balance | Grand Tournament registration (160 players) |
| Clans: create, join, emblems, monthly Clan War ranking | "Connect wallet" creates a demo address | Clan War and season prizes paid out |
| 18+ gate, player limits per match and per day, breaks from paid modes (kept on the device) | Escrow program (`contracts/oni-escrow`): compiles with Anchor 0.32.1 and passes payout-math tests and client checks, but is unaudited, not deployed and not called by the game | Live streaming of cup matches |
| Region check endpoint on the server (`/api/geo`) and paid-mode blocking in the game | Identity-check (KYC) notice on big payouts: a message only, no provider yet | Identity checks through a provider, limits kept per account on the server |
| Legal pages in the game: terms, privacy, responsible play, fees and odds, token risk, contact | Legal pages are drafts for a lawyer to review; contact emails are placeholders until set up | Battle Pass, Clan Wars 3v3 and 5v5, God tier fighters, new fighters every few weeks, open-world era |
| Game server (rooms, verification, regions) runs locally and passes its tests | Game server is not deployed yet | Game server deployed for online 1v1, card on-ramps through partners |

## Facts

- Fighters (from `game/main.js`, list `FIGHTERS`): ONI, Kaze, Genbu, Kira, Hayate, Seiryu, Kage. Enma is the boss and is not selectable.
- Currency: SOL for stakes, cups, Enma tries and prizes; $ONI for cosmetics.
- Escrow tests (October 8, 2026): 6 of 6 Rust payout-math tests, 6 of 6 JS client checks; devnet deploy not done yet.
- Tests on October 3, 2026: `npm test` 12 of 12 mechanic checks and 28 of 28 full matches; `server/npm test` 6 of 6 honest matches verified and 6 of 6 false winners caught.
