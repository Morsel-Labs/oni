# ONI — QA / UX / Security Audit

Date: 2026-10-31 · Base: `mobile-overhaul` @ `f517700` · Build: `dist/oni-fighter.html` (686 KB, one file)
Method: code read, Playwright on 4 phone viewports (`tools/mobile-shots.js`, baseline in `/tmp/oni-base`), CDP CPU throttling, and a local server instance under attack by `tools/audit/server-probe.js`. All numbers below come from those runs. Headless Chromium renders in software, so treat FPS as relative, not absolute.

Reproduce:
```bash
npm run build
node tools/mobile-shots.js /tmp/audit-shots && node tools/audit/scorecard.js /tmp/audit-shots/report.json
node tools/audit/perf-probe.js 4            # 4x CPU throttle; add --offline-fonts
node tools/audit/ux-probe.js                # flows, multi-touch, back button, storage, a11y, hostile data
(cd server && npm ci && PORT=18080 DATA_DIR=/tmp/oni-data node src/server.js &)
NODE_PATH=server/node_modules node tools/audit/server-probe.js http://localhost:18080   # local only; last check crashes the server
```

---

## 1. Executive summary

- **The server falls over on one request.** `GET /%E0%A4%A` throws in `decodeURIComponent`. Nothing catches the error, so the Node process exits. Confirmed live. Docker restarts it, but anyone can keep it down by sending the request in a loop. **P0.**
- **Server-side data is trusted from the client and can be forged.** Any guest can overwrite or invent `matches` (the leaderboard), write unlimited airdrop `tickets` and invent `boss` kills. Anyone, even without signing in, can read every player's "private" inventory. Online 1v1 is host-authoritative, and the host also writes the replay log that the server "verifies". So none of the ranking, airdrop or stake data can be trusted yet.
- **The fight loop is sound.** It uses a fixed 60 Hz timestep with an accumulator and clamps `dt` at 100 ms, and the sim is deterministic (`npm test` passes 12/12 mechanics and 28/28 CPU matches). The weak points are the extremes. It doesn't interpolate, so 90/144 Hz screens judder. Below 10 FPS the game runs in slow motion. Online guests send one presence message per rendered frame, which reaches the server's 120 msg/s flood cap on 120 Hz phones.
- **Mobile fight layout works but wastes space.** In portrait the arena gets 26% of the screen (32% on a small Android), with ~45% empty black between the hint and the pad. In landscape the pad covers both fighters' feet and P2's curse meter. SOUND and QUIT (88x21 and 52x21 px) sit on P2's health bar. A finger that slides along the d-pad stays locked to the first direction, because of pointer capture.
- **New players struggle to reach their first fight, and Back loses the game.** The obvious **Play** in the dock opens *staked online 1v1*. Practice takes 5 taps plus 2 screens of scrolling: the Fight CTA sits at y=1664 on an 844 px screen. The tutorial is never offered. Android/browser Back exits the app mid-fight (`history.length`=2, no `popstate`).
- **Performance is fine on mid-range phones and marginal on low-end ones.** Unthrottled: 60 FPS everywhere, 6 MB heap, 1.2k DOM nodes. At 4x throttle: village 59, fight 53, landing 45 FPS. At 6x: fight 41 FPS with 90 ms long tasks. The Google Fonts stylesheet blocks rendering: a stalled font CDN means **8 s of blank screen** in our test.
- **Accessibility is partial.** Dialog roles and button names are mostly present (0 of 110 controls unnamed). But focus is not managed: Tab leaves the 18+ gate and goes to the landing behind it. JS effects ignore `prefers-reduced-motion`. Pixel text is drawn at 5–9 px (village HUD, pad labels). The fight itself has no text alternative.
- **Code health:** `game/sim.js` and `server/src/sim.js` are identical today (same md5), but by copy, not by import. `main.js` is 3,071 lines with 369 top-level functions and 145 globals, plus layered "2.0/3.0" rewrites. Build artifacts and two zip snapshots (1.1 MB) are committed. There is no CI.

| Area | Score /10 | One-liner |
|---|---|---|
| Mobile UX | 5 | Playable, but portrait wastes the screen, landscape pad covers the HUD, small chrome buttons |
| Performance | 7 | Fixed-step sim and a small heap; render-blocking fonts; low-end phones drop to ~40 FPS |
| Accessibility | 4 | Names and roles OK; no focus management, ignores reduced motion, tiny pixel text |
| Game feel / flows | 5 | Good fight feel; first-fight path, Back button and tutorial discoverability are poor |
| Robustness (client) | 7 | No page errors on 88 screen×device runs; storage failure is safe; no pause or visibility handling |
| Code health | 4 | Monolith, copied sim, no CI, artifacts in git, tests slow and narrow |
| Security (server + economy) | 2 | Remote crash, forgeable leaderboard/airdrop, public "private" data, no rate limits |

---

## 2. P0 / P1 list

| # | Sev | Area | Where | Finding | Fix |
|---|---|---|---|---|---|
| 1 | **P0** | Security | `server/src/server.js:32` | Malformed `%` in the URL throws inside the async handler. The resulting unhandled rejection kills the process (confirmed: `/health` stops answering) | Wrap the handler in try/catch and return 400; add `process.on('unhandledRejection')` logging |
| 2 | **P1→P0 before any value** | Security | `server/src/rules.js:2-8` | `matches` is "open append" but `set` is an upsert. Any guest can overwrite someone else's match or invent wins (stake 1e9 accepted). Leaderboard, season and affiliate stats all come from it | Server-side match records only (written by the room/referee); reject writes to existing ids |
| 3 | **P1→P0 before airdrop** | Security | `rules.js` OWN_DOC + `main.js:1606-1608, 2575` | Players write their own `tickets` doc. One write with 365 `days` was accepted, which means unlimited airdrop points. `boss` kills are also self-reported (99999 accepted) | Make these server-computed; never trust client counters |
| 4 | P1 | Security / privacy | `rules.js:3` `canRead` | Reads need no auth and ignore the caller. Anonymous sockets can `get` `data/users/<id>/inv` ("private per-player space") and subscribe to every collection | `canRead(uid, coll, id)`; require `hello` before `get`/`sub` |
| 5 | P1 | Security / fairness | `main.js:1369-1395`, `sim.js:310-318`, `verify.js` | Online 1v1 is host-authoritative. The host also produces the input log the server replays, so `/api/verify` only proves the log is self-consistent, not that it's honest. README already says Phase 2 must move the sim server-side | Must happen before stakes or escrow: server runs the sim from both clients' inputs |
| 6 | P1 | Netcode | `main.js:1383-1384`, `server.js:45` | The guest sends a `pres` message every rAF frame (unthrottled). On a 120 Hz phone that's 120 msg/s, which is the server's silent drop limit (`>120/s`), so any extra message drops inputs. The host publishes every 30 ms, but the server batches presence every 50 ms (`rooms.js:4`). The guest's `interp()` assumes 33 ms between snapshots, so the guest view stutters at ~20 Hz | Send guest input at a fixed 60 Hz (or on change); use a direct relay, not presence batching; interpolate over the measured snapshot interval |
| 7 | P1 | Mobile UX | `page.html` portrait `body.touch` rules; screenshot `P-fight.png` | Portrait fight: arena is 390x219 (26% of the screen, 32% on 360x640) with ~45% empty black. Players lose the fight on the default orientation | Pin the pad to the bottom and scale the arena up to the space left (~60%), or crop the stage taller in portrait |
| 8 | P1 | Mobile UX | `L-fight.png`, `Ls-fight.png` | Landscape: pad sits over the arena (8–11 controls over the canvas). BLOCK covers P2's curse meter; the d-pad covers P1's feet and meter. The letterbox bars on 19.5:9 phones (148 px each side on 844x390) go unused | Move the pad into the side bars when the aspect ratio is >16:9; keep HUD rows clear |
| 9 | P1 | Flow | `main.js:2782`, dock; `/tmp` flow probe | First fight needs **age → PLAY → Menu → Practice → scroll 2 screens → Fight**: 5 taps plus scrolling. The Fight button is at y=1664 on an 844 px screen. The dock's most obvious **Play** opens *staked online 1v1* | Make the first session go straight into the tutorial or a CPU fight; keep a sticky Fight CTA; point dock "Play" at quick CPU when no one is online |
| 10 | P1 | Flow | whole app (no `history` / `popstate`) | Android/browser Back during a fight or menu leaves the app (probe: Back → `about:blank`). Progress mid-match is lost | Push a history state per panel or fight; map `popstate` to close panel / pause / quit-confirm |
| 11 | P1 | Performance | `page.html:7-9` | The Google Fonts `<link rel=stylesheet>` blocks rendering. If the font CDN stalls, FCP waits for it: we measured **8,064 ms** FCP with an 8 s stall (204 ms normally). If Google is blocked in a region the screen stays blank | Inline or self-host the two fonts (subset Press Start 2P is ~10 KB as woff2) or load them async with `media=print onload` |
| 12 | P1 | Tutorial | `Ls-tutorial.png`, `L-tutorial.png` | In landscape the training toolbar (12–13 buttons at 25 px tall) covers the lesson text. Step text can't be read on any landscape phone. In portrait the lesson box covers both health bars and QUIT | Hide the training toolbar during the tutorial; put the lesson in a bottom strip |

---

## 3. Mobile UX

**Fight canvas share** (`report.json` `canvasShare`): P 26%, Ps 32%, L 82%, Ls 100%. Portrait renders the arena at 390x219 CSS px. Below it are the "Turn your phone sideways" hint and ~380 px of empty black, then the pad (`P-fight.png`).

**Control overlap.**
- In every fight screen, `#mute` (88x21) and `#quit` (52x21) sit on top of P2's health bar and name. The QUIT target is 21 px tall, right next to SOUND, so the two are easy to mis-tap mid-fight.
- Landscape: ATTACK/KICK/THROW/CURSE/BLOCK sit over the right third of the arena, and BLOCK hides P2's curse meter.
- After a match, the end screen's "Connect wallet" button covers P1's name and health bar (`/tmp/audit-end-390.png`).
- The achievement toast's lines overlap each other ("Achievement unlocked: First Blood").

**Touch targets.** The pad is fine: 56x56 d-pad, 68x58 face buttons and a 144x40 BLOCK in landscape. Everything else isn't:

| Screen | Problem |
|---|---|
| End screen (portrait) | Buttons are 30 px tall (Fight again 112x30, Menu 56x30) |
| Practice select | Back 56x30; Arcade / Training / Tutorial 358x30 |
| Training toolbar | 25 px tall throughout |
| Store | 13x13 checkboxes |
| How to play, Clans | 15–19 sub-40 px targets each |

**Multi-touch** (CDP touch probe, `ux-probe.js`):
- Holding ◀ then tapping ATTACK registers both (`held=[tL,tP]`), and releasing ◀ keeps ATTACK. Good.
- **Rolling a thumb from ◀ to ▶ without lifting still reads ◀** (`setPointerCapture`, `main.js:838`). The player can't do a walk-back to dash-forward motion, can't reverse quickly, and can't do diagonals on a single thumb. That's a core fighting-game gesture. **P1 game feel.** Fix: track the pointer position over a single d-pad zone and resolve 8 directions from the angle.

**Input latency path.** Each pointer event writes to `held` or `pressed`. Inputs are read once per fixed sim step (`sampleInput`, `main.js:843`), and the same rAF frame renders the result. Added latency is ≤1 sim step (avg ~8 ms) plus compositor time. Taps shorter than a frame are kept via `pressed`. This part is fine.

**Frame pacing** (`main.js:3044-3062`):
- The sim runs on a fixed 60 Hz accumulator, and `dt` is clamped at 100 ms. The fight loop has no step cap, but the clamp bounds it at 6 steps per frame.
- At **120 Hz** every other frame does no sim step and re-renders the same state. The output looks correct but burns CPU and battery for nothing.
- At **90/144 Hz** the step pattern is uneven (1-1-0 / 0-1-0-1-1…). With no render interpolation this shows as judder.
- Below 10 FPS the clamp turns the game into slow motion. That's acceptable for CPU modes, but online it is a desync source.
- Fix: skip rendering on frames with no sim step (or interpolate between steps), and cap rAF work at 60 Hz.

**Safe areas and orientation.**
- `viewport-fit=cover` is set and `env(safe-area-inset-*)` is used on `:root`, the pad and the panels.
- Orientation is handled with CSS only: there's a portrait hint, but no `screen.orientation.lock` attempt even in fullscreen, and no Fullscreen API on Android.

**Scroll and zoom.** `touch-action:manipulation` on body and `touch-action:none` on the pad prevent double-tap zoom and pad panning. Pinch-zoom stays allowed (good for a11y). `user-select:none` is set.

**Text legibility.** Press Start 2P runs at 9 px in the fight HUD (8 elements). In the village it runs at 5.1–9 px (14 elements, including the PAD/ATTACK/KICK hint row, which the dock also covers). End-screen text is 7–9 px. Below about 10 px on a 3x screen, Press Start 2P stops being readable. Set a 10 px floor for pixel text, and use Inter for anything longer than a label.

**Village.**
- Portrait: the dock overlaps the player card and the controls hint.
- Landscape: the player card is drawn over the ATTACK/THROW buttons. Touches still reach the buttons (probe: all `ok`), but the labels can't be read.
- The village reuses the fight pad, so buttons labelled ATTACK/KICK actually mean "enter"/"emote". Relabel them in village mode.

**DPR.** `#cv` is a fixed 960x540 backing store. On a 3x 390-wide phone that's 1.22 device px per canvas px, so pixel art gets uneven nearest-neighbour widths (shimmer on scroll). Size the backing store to an integer multiple of 320x180 that is at least CSS width × DPR.

---

## 4. Performance (Playwright + CDP, 390x844 @3x, iPhone UA)

| Metric | 1x CPU | 4x CPU | 6x CPU | 4x, fonts blocked |
|---|---|---|---|---|
| DOMContentLoaded / load (ms) | 405 / 660 | 589 / 712 | 2148 / 2151 | 1291 / 1295 |
| First contentful paint (ms) | 388 | 432 | 380 | 312 |
| Boot (first game rAF, ms) | 828 | 1353 | 1703 | 1117 |
| Landing FPS (p95 frame ms) | 59.8 (16.7) | **45 (33.4)** | **30.7 (66.6)** | 49.2 |
| Village FPS | 60 | 58.8 | 50 | 59.8 |
| Fight FPS (p99 frame ms) | 60 (16.8) | **53 (49.9)** | **41 (66.7)**, 8 long tasks ≤90 ms | 57.2 |
| JS heap used / total | 6.3 / 10.1 MB | 5.0 / 10.6 MB | 6.7 / 10.9 MB | 5.6 / 10.1 MB |
| DOM nodes | 1202 | 1202 | 1202 | 1202 |

- **The landing page is the heaviest screen** (45 FPS at 4x). It runs the demo fight in the canvas behind a DOM landing page with animated gradients. Pause the demo while the landing is scrolled away, and drop the canvas work entirely when `p-landing` covers it.
- **Every frame does extra DOM work**: `loop()` calls `document.querySelector('.panel.on')` twice and `classList.toggle('village')` (`main.js:3044-3047`). It also re-renders the Cauldrons panel every frame while that panel is open (`main.js:3069`). Cache the active panel and only re-render on change.
- **Payload.** The single HTML file is 686 KB and is not minified (`tools/build.js` only concatenates). Art modules account for 190 KB, main.js for 338 KB and the CSS (inside page.html) for ~150 KB. Gzip is applied by Caddy on the server build. Minify plus brotli would land at about 150 KB.
- **Fonts**: covered in P1 #11. With fonts aborted, `boot()` still starts within its 1.5 s font race, but layout falls back to Courier New.
- **Online state size**: `pack(M)` plus the presence wrapper is 518 bytes, well under the 4 KB presence cap. No risk there.
- **No `visibilitychange` handling.** rAF stops in background tabs (good for CPU), but the music `setInterval` scheduler and the AudioContext keep running (`main.js:814`). Background-tab throttling then makes the music stutter or overlap. Suspend `AU.c` on hide.

---

## 5. Accessibility

- **Dialogs.** 21 elements have `role=dialog` (19 panels plus help and age gate), and the age gate has `aria-modal`. But:
  - focus is never moved into a dialog (`activeElement` = BODY after load);
  - focus isn't trapped: Tab from the gate goes to `PLAY`, `How to play` and the landing cards behind it, all outside the gate;
  - focus isn't restored on close.

  **P2.** Fix: use `inert` on the background, focus the first control, and return focus to the opener.
- **Names.** 0 of 110 interactive elements lack an accessible name, and the lock icons have `aria-label`. Good.
- **Contrast** (WCAG, against `--night #0A0506`):

  | Pair | Ratio | Verdict |
  |---|---|---|
  | ink | 16.96 | ✓ |
  | mute | 13.09 | ✓ |
  | gold | 11.05 | ✓ |
  | line | 5.85 | ✓ |
  | YOU LOSE red `#D7262E` | 4.06 | Fails AA for small text |
  | blood `#C1121F` | 3.25 | Fails AA for text; used on borders, CURSE labels and "Change fighter" |

- **Reduced motion.** CSS honours `prefers-reduced-motion` in 3 rules, but the JS effects ignore it: screen shake, white flashes (`FX.flash`) and super darkening. `COMFORT.on` (calm arenas, no flash) exists but is opt-in in Settings; the probe found `COMFORT.on === false` with reduced motion emulated. Default it to on when `matchMedia('(prefers-reduced-motion: reduce)')` matches. That also matters for photosensitivity.
- **Canvas-only content.** The fight (HP, timer, round, winner) is canvas-only. 8 of 26 canvases have labels. There is no `aria-live` announcement of round or match results (the only 2 `aria-live` regions are the tutorial box and the landing "live" section). Announce "Round 1: you win" and similar in a polite live region.
- **Language and fonts.** `lang="en"` is set. Most body copy is pixel font at 7–11 px, which is hard for dyslexic and low-vision users. Use Inter for paragraphs (the menu already does).

---

## 6. Game feel and UX flows

**First-time flow.** These were measured as taps on a phone viewport.

1. The 18+ age gate is shown (1 tap).
2. Landing → **PLAY** (tap 2) drops the player in the village, with no orientation or hint beyond a 6 px controls line under the dock.
3. Dock: **Play | TENKA | Missions | Menu**. "Play" opens the online staked 1v1 select ("Winner takes the pot"), with no opponent and a 4-character code flow. That's a dead end for a solo new player.
4. The working path is **Menu → Practice → scroll past 7 fighter cards, difficulty, format and arena → Fight**: 5 taps plus about 2 screens of scrolling.
5. Practice shows **6 of 7 fighters "Locked"**, so the store gates even CPU practice. A free "Try vs CPU" exists, but only inside the Store.
6. The tutorial (10 steps, decent content) can only be reached via Practice → bottom → Tutorial, or How to play → Tutorial. It is never offered automatically.

**End of match.**
- KO to end panel takes ~8.1–8.6 s, with no way to skip (there's no skip handler in `endPanel`).
- Actions: Fight again / Change fighter / Menu / Post on X / Share K.O. card. That's clear.
- There's no XP or reward summary even though the village shows levels. The CPU "CONTINUE?" countdown auto-returns to title.

**Back navigation.** There is no history integration. Android Back exits from anywhere (P1 #10). Escape works on desktop (`main.js:829-832`).

**Pause.** There's no pause in CPU fights, and no pause on `visibilitychange`. A phone call or notification mid-fight means a loss. Add a pause overlay on hide or blur in offline modes.

**Error states.**
- Online join gives up after 6 s with a clear message (`main.js:1368`).
- DB write failures show toasts in places, but most `catch(e){}` blocks are silent (40 empty catches).
- The "Under 18" path is a soft dead end: no persistence, so a reload brings the gate back.

**Visual consistency.** The new Inter-based menu sheet (`P-vmenu.png`) looks like a different product from the pixel UI around it. Pick one system per layer.

---

## 7. Robustness

- **Console and page errors.** Zero across all 88 screen×device runs in `report.json`, plus the throttled perf runs and the UX probe.
- **localStorage throwing** (Safari private mode or blocked storage, simulated with `Storage.prototype` throwing): boot, village and a full CPU match ran with no errors. `LS` wraps everything in try/catch (`main.js:2529`). One side effect: the age gate comes back on every visit.
- **Hostile online data.** A fake `window.claude` fed profiles, matches, tickets, presence and boss docs containing `<img onerror>` payloads, bad map indices (99) and bad kit ids into 10 screens. Result: **0 XSS executions, 0 exceptions.** `esc()` is used consistently, `safeClan()` whitelists tags, and `MAPS[...]` lookups survived. Good hygiene; keep it.
- **Offline.** Fonts fall back to Courier New and the game boots. Online features fail silently, with `DB.state='off'` shown on the board. The 8 s stall case is covered in P1 #11. There's no service worker, so a reload while offline gives the browser's offline page.
- **Server.** The P0 crash. `body()` never resolves when a body is over the size limit (the request hangs). The nonce map grows without bound (probe: 300 random wallets stored, never pruned). Each subscription re-runs a full collection scan plus `JSON.parse` of up to all docs every 200 ms after any write (`store.js:15,23`). With 1k matches and 100 subscribers that's ~100k parses per write burst, an easy amplification target.

---

## 8. Code health

- **`sim.js` duplication.** `game/sim.js` and `server/src/sim.js` are byte-identical (`md5 3c698a0b…`), but nothing enforces that. One edit on either side silently breaks `/api/verify`. Make `tools/build.js` copy it, or symlink it, and add a test that fails on any diff.
- **`main.js`.** 3,071 lines / 338 KB, 369 top-level functions, 145 top-level `let`/`const`, 134 `onclick=` assignments, 99 lines over 300 characters, and about 40 sections, some versioned ("MARKET 2.0", "MARKET 3.0", "CLANS 2.0") with the older layers still present. Everything shares global state (`M`, `mode`, `NET`, `DB`, `VIL`). Split it into ES modules along the existing section banners (render, input, net, db, village, store, ui). The build already concatenates, so esbuild can bundle and minify at no cost.
- **Build.** String-replace templating into one HTML file, with no minification and no sourcemaps. `dist/` and `server/public/index.html` are committed artifacts (no `.gitignore`), and so are `ONI-github-repo.zip` (808 KB) and `oni-github-repo.zip` (320 KB). Remove them, add `.gitignore`, and build in CI.
- **Tests.**
  - `npm test` passes: 12/12 mechanics checks, and 28/28 CPU kit×map matches reach the end screen.
  - Runtime is **2 min 58 s**: `flow.js` steps full 60 FPS matches headless.
  - `server && npm test` (replay verify: 6/6 honest, 6/6 forged caught) passes but isn't wired into the root `npm test`.
  - There are no UI tests, netcode tests or server-rules tests. `tools/mobile-shots.js` and the probes here are a ready start for CI smoke tests.
  - There is no CI config (`.github/` absent).
- **Docs.** The server README is in Greek and the main docs are in English. Fine for the team, but note it for outside contributors and auditors.

---

## 9. Security (defensive quick scan)

Results from `tools/audit/server-probe.js` against a local instance (every line is a confirmed weakness):
```
FAIL unauthenticated client cannot read another player's private inventory :: {"owned":["secret-skin"]}
FAIL unauthenticated client cannot subscribe to collections
FAIL player cannot overwrite a match record written by someone else
FAIL player cannot invent a won match (leaderboard forgery)
FAIL player cannot self-grant 365 airdrop days in one write
FAIL player cannot self-report boss kills
FAIL server rejects HTML in profile names               (client escapes it, so no XSS today)
FAIL player cannot join arbitrary private rooms         (can spectate any 1v1 by guessing its 4-char code)
FAIL guest account creation is rate-limited (200 in a burst) :: 200/200 created
FAIL wallet nonces are bounded (300 random wallets) :: 300 nonces stored, never pruned
FAIL server survives GET /%E0%A4%A (malformed percent-encoding) :: PROCESS CRASHED
```

Additional notes:
- **Auth.** The bearer token is stored in `localStorage` (`shim.js`), never rotates and never expires. Any future XSS would mean full account takeover. Wallet sign-in is implemented correctly: ed25519 over a server nonce with a 5-minute TTL, and the nonce is deleted after use. The message has no domain or chain binding beyond its text, which is acceptable.
- **No WS Origin check, no CSP, no security headers** (`server.js`, `Caddyfile`). Add a CSP: inline scripts would need hashes, or move the JS to files.
- **`/api/verify`** is unauthenticated and synchronous. A 600 KB body replays up to 72k frames on the main thread, so it can be used to stall the server. Rate-limit it, or run it in a worker.
- **Room codes** are 4 characters and anyone may `join` any room name. Combined with presence, that allows spectating and griefing (for example, joining as `r:'g'`).
- **Client-side admin.** `setAdmin` writes `grants`. The server doesn't allow `grants` writes (good), but the client renders admin state from `DB.grants` read without auth.
- **Escrow (`contracts/oni-escrow`, unaudited, not deployed).** The surface is small and the code is tidy: PDA vaults, `has_one` on config, fee bounds 3–5% enforced on-chain, a timeout refund anyone can trigger, and a pause flag that can't freeze existing funds. High-level concerns:
  1. **Trust model.** A single `referee` key decides the winner and the fee. That key sits on the same server that today accepts host-authored logs (P1 #5). The contract is only as honest as that server.
  2. **Open join.** `join_match` accepts *any* signer, so a third party can snipe an open match meant for someone else. The match then can't be played and the funds are locked for the timeout. Bind `player_b` at creation, or require a server co-signature.
  3. **Predictable PDA seeds.** `match_id` is chosen by the client and the seeds don't include the creator, so IDs can be squatted.
  4. **Accounts are never closed**, so rent isn't reclaimed.
  5. Needs a professional audit before mainnet, which the README already states.

---

## 10. Mobile scorecard

Source: `/tmp/oni-base/report.json` via `node tools/audit/scorecard.js`, plus visual review of the PNGs. "small" means interactive elements under 40 px on either axis. Fight-type screens are WARN at best until P1 #7/#8 are fixed. Note that the harness's `training` screen ends on the select panel, not in training mode (clicking `#b-training` from the landing doesn't start a session), so training itself is covered by the `tutorial` row.

| Screen | P 390x844 | L 844x390 | Ps 360x640 | Ls 640x360 |
|---|---|---|---|---|
| landing | PASS | PASS | PASS | PASS |
| village | WARN (dock covers card + hint) | WARN (player card over pad) | WARN (dock covers card + hint) | WARN (player card over pad) |
| vmenu | PASS (1 small) | PASS (2 small) | PASS (1 small) | PASS (2 small) |
| select | WARN (3 small) | PASS | WARN (3 small) | PASS (1 small) |
| fight | WARN (canvas 26%, 2 small, 2 over arena) | WARN (canvas 82%, 2 small, 8 over arena) | WARN (canvas 32%, 2 small, 2 over arena) | WARN (canvas 100%, 2 small, 11 over arena) |
| training | WARN (3 small) | PASS | WARN (3 small) | PASS (1 small) |
| tutorial | FAIL (canvas 26%, 12 small, 2 over arena) | FAIL (toolbar hides lesson text) | FAIL (canvas 32%, 12 small, 2 over arena) | FAIL (toolbar hides lesson text) |
| end | WARN (canvas 26%, 2 small, 2 over arena) | WARN (canvas 82%, 2 small, 8 over arena) | WARN (canvas 32%, 2 small, 2 over arena) | WARN (canvas 100%, 2 small, 11 over arena) |
| store | FAIL (18 small, 7 off-screen) | FAIL (11 small, 5 off-screen) | FAIL (12 small) | WARN (4 small) |
| profile | WARN (5 small) | PASS | PASS (2 small) | PASS (1 small) |
| tourney | PASS (2 small) | PASS | PASS (1 small) | PASS (1 small) |
| boss | WARN (4 small) | PASS | WARN (4 small) | PASS (1 small) |
| how | FAIL (19 small) | FAIL (17 small) | FAIL (19 small, 2 off-screen) | FAIL (19 small) |
| missions | PASS (1 small) | PASS | PASS (1 small) | PASS (1 small) |
| clans | FAIL (18 small) | FAIL (15 small) | FAIL (16 small) | PASS (1 small) |
| settings | WARN (8 small) | WARN (3 small) | WARN (7 small) | WARN (4 small) |
| inventory | PASS (2 small) | PASS | PASS (2 small) | PASS (2 small) |
| champions | FAIL (2 small, 4 off-screen) | PASS | FAIL (2 small, 4 off-screen) | PASS (1 small) |
| cauldron | PASS (2 small) | PASS | PASS (1 small) | PASS (1 small) |
| controls | WARN (3 small) | PASS (2 small) | WARN (3 small) | WARN (3 small) |
| legal | WARN (7 small) | WARN (6 small) | WARN (7 small) | WARN (7 small) |
| board | WARN (5 small) | WARN (4 small) | PASS (1 small) | WARN (5 small) |

**Totals: 38 PASS · 34 WARN · 16 FAIL (of 88).** Recurring small targets: `#mute` 88x21 and `#quit` 52x21 (every fight screen); Back buttons 53–56x30–35; store filter checkboxes 13x13; How-to-play anchor nav; Clans emblem picker.

---

## 11. Roadmap

**Now (this week, before more players are invited)**
1. Server: catch handler errors (P0 #1), and require auth for reads (#4).
2. Server: make `matches`, `tickets` and `boss` server-written or append-only with ownership checks (#2, #3).
3. Server: add rate limits on `/api/guest`, `/api/nonce` and `/api/verify`; prune nonces.
4. Self-host or inline the fonts (#11).
5. Throttle guest input sends to a fixed 60 Hz (#6).
6. Mobile: move SOUND/QUIT off the HUD at ≥44 px; landscape pad into the letterbox and off the HUD rows (#8); bigger portrait arena (#7). This overlaps with the mobile agents' current work, so re-run `mobile-shots.js` and `scorecard.js` after merge.
7. Hide the training toolbar during the tutorial (#12).

**Next (2–4 weeks)**
1. First-session flow: offer the tutorial, then a CPU fight. Dock "Play" goes to quick CPU when no one is online. Sticky Fight CTA (#9).
2. History/Back integration and a pause on `visibilitychange` (#10).
3. D-pad slide and diagonal resolution.
4. A11y: focus management, `inert`, reduced motion defaulting Comfort on, a 10 px pixel-font floor, and a live region for round results.
5. Render only on frames with a sim step; DPR-aware canvas backing size.
6. CI: `npm test`, server tests, a sim-parity check, and a smoke `mobile-shots` run with scorecard thresholds. Add `.gitignore`; drop artifacts and zips.

**Later (before any real money)**
1. Server-authoritative 1v1 (or input-relay plus server sim/rollback). Retire host-authored proofs (#5).
2. Escrow: bind `player_b` / co-sign joins, multisig or HSM for the referee, close accounts, external audit.
3. Split `main.js` into modules with esbuild (minify, sourcemaps); remove dead "2.0/3.0" layers.
4. Service worker for offline shell and fonts; a CSP and security headers.
