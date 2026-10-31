# ONI server (theonicurse.xyz)

Ο server του ONI. Κάνει τρία πράγματα, όπως το claude.ai στο prototype:
1. **Λογαριασμοί**: guest αυτόματα, και σύνδεση με wallet Solana (υπογραφή μηνύματος) έτοιμη στο API.
2. **Ζωντανή βάση**: matches, προφίλ, Enma, airdrop points, CPU streaks, inventory, με κανόνες (κανείς δεν γράφει στα δεδομένα άλλου, κανείς δεν σβήνει matches).
3. **Δωμάτια**: το χωριό (ως 40 παίκτες ανά "αντίγραφο", ανοίγουν αυτόματα κι άλλα) και τα δωμάτια των 1v1.

Το παιχνίδι είναι το ίδιο αρχείο με το artifact, με ένα μικρό script (`public/shim.js`) που το συνδέει στον server.

> Φάση 2: σε αυτόν τον server τα online 1v1 τα τρέχει ο ίδιος ο server (authoritative) και γράφει μόνος του το αποτέλεσμα. Δες «Authoritative 1v1» πιο κάτω. Στο claude.ai μένει η παλιά ροή (η μάχη τρέχει στον host).

---

## Στήσιμο βήμα βήμα (~30 λεπτά)

### 1. Νοίκιασε server
- Hetzner Cloud: **CPX22** (2 vCPU, 4 GB) ή μεγαλύτερο, **Ubuntu 24.04**. Περιοχή: Ashburn (ΗΠΑ) ή Falkenstein (Ευρώπη), ανάλογα με το πού είναι οι περισσότεροι παίκτες.
- Βάλε το SSH key σου στη δημιουργία. Σημείωσε την **IP** του server.

### 2. Σύνδεσε το domain
Στον πάροχο DNS του theonicurse.xyz (π.χ. Cloudflare):
- `A` record: `theonicurse.xyz` → IP του server
- `A` record: `www` → IP του server
- Αν είναι Cloudflare: στην αρχή βάλ' τα **DNS only (γκρι σύννεφο)**, ώστε ο Caddy να πάρει το πιστοποιητικό HTTPS. Μετά μπορείς να τα κάνεις πορτοκαλί με SSL mode **Full (strict)**.

### 3. Εγκατάσταση Docker στον server
```bash
ssh root@IP
curl -fsSL https://get.docker.com | sh
```

### 4. Ανέβασε τον κώδικα
Από τον υπολογιστή σου, στον φάκελο όπου αποσυμπίεσες το zip:
```bash
scp -r oni-server root@IP:/opt/
```

### 5. Βάλε το παιχνίδι
Το `public/index.html` είναι ήδη μέσα. Όταν βγάζουμε νέα έκδοση του παιχνιδιού:
```bash
cd /opt/oni-server
sh scripts/build-client.sh /path/to/oni-fighter.html
docker compose restart oni
```

### 6. Ξεκίνα
```bash
cd /opt/oni-server
docker compose up -d --build
docker compose logs -f oni     # πρέπει να δεις: ONI server on :8080
```
Άνοιξε https://theonicurse.xyz . Έλεγχος: https://theonicurse.xyz/health

### 7. Backups (συνιστάται)
```bash
crontab -e
# πρόσθεσε:
0 4 * * * cd /opt/oni-server && sh scripts/backup.sh
```

---

## Χρήσιμα
- Επανεκκίνηση: `docker compose restart oni`
- Ενημέρωση κώδικα server: ανέβασε τα νέα αρχεία και `docker compose up -d --build`
- Η βάση είναι στο `data/oni.db` (SQLite). Μην τη σβήσεις.
- Τοπικό τεστ: `npm install && npm start` και άνοιξε http://localhost:8080

## API
- `POST /api/guest` → νέος λογαριασμός `{id, token}`
- `POST /api/nonce {wallet}` → μήνυμα για υπογραφή από το wallet
- `POST /api/wallet {token, wallet, signature}` → σύνδεση wallet (signature σε base58)
- `GET /api/leaderboard?season=N` → matches του season
- `POST /api/verify {proof}` ή `{id}` → ξαναπαίζει έναν αγώνα (`{id}`: αγώνας που κατέγραψε ο server)
- `GET /health`

## Επόμενα (Φάση 2)
- ~~Η μάχη να τρέχει στον server~~ (έγινε: `src/match.js`). Matchmaking "Find match".
- Σύνδεση wallet από το UI του παιχνιδιού.
- Escrow στο Solana για τα stakes σε SOL (το preview είναι στο `oni-contract-preview`, unaudited, όχι ακόμα σε devnet).

## Security

Every client write is checked on the server; the client protocol (`public/shim.js`) is unchanged.

**Rules** (`src/rules.js`, `src/schema.js`)
- Reads and subscriptions need an authenticated socket (`hello`). Public collections: `profiles`, `practice`, `tickets`, `boss`, `matches`, `grants`. `data/users/{id}/…` is readable and writable by that user only. Queries: `==` filters only, at most 1000 docs.
- `profiles`: own doc; name `^[A-Za-z0-9_]{3,16}$` and unique (case-insensitive); allow-listed keys; `admin`/`role`/`rating`-style keys rejected; `created` and `ref` owned by the server; images ≤ 48 KB data URLs; `xp`/medals grow in bounded steps.
- `tickets`: at most one new day per write, and only today (±1 day); missions only for today, ≤ 3 per day.
- `boss`: counters only grow; `kills`/`paid`/`jacks` by 1 per write; kills ≥ 5 s apart; `best` ≤ 50; `jackOut` bounded by the jar.
- `practice`: CPU streak grows by 1 per write, writes ≥ 5 s apart.
- `matches`: create-only (no overwrite, no delete); writer must be `a` or `b`, both real accounts; stake must be one the arena offers; current season; `ts` within 10 min.
- `grants`: only uids in `ONI_OWNERS`.
- Server code writes without client rules via `store.systemWrite(coll, id, data)` or `rules.write(store, rules.SYSTEM, …)`. Set `rules.options.clientMatches = false` once the server records every match itself.

**Limits** (`src/http.js`, `src/dbapi.js`, `src/ratelimit.js`): token buckets per IP for HTTP (all routes 30/s burst 120; guest 5/min burst 10; nonce/wallet 10/min burst 20; verify 6/min), per socket for messages (120/s burst 240), per user for writes (5/s burst 40; matches 1 per 20 s), 16 sockets per IP, 32 subscriptions per socket. Bodies over the route cap get 413, wrong methods 405. Wallet nonces expire after 5 min, are pruned every minute and capped at 10 000. Tokens are looked up by SHA-256 and compared in constant time; they are never logged. Responses carry CSP (inline scripts allowed by hash, Google Fonts), `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors 'none'`.

**Env**: `TRUST_PROXY` (number of proxies that append to X-Forwarded-For; `1` behind Caddy, set in docker-compose; unset = header ignored), `ONI_OWNERS` (comma list of uids allowed to write `grants`), `WS_ORIGINS` (optional comma list of allowed Origins), and overrides `HTTP_RATE`, `HTTP_BURST`, `GUEST_PER_MIN`, `GUEST_BURST`, `WALLET_PER_MIN`, `WALLET_BURST`, `VERIFY_PER_MIN`, `VERIFY_BURST`, `WS_MSG_RATE`, `WS_MSG_BURST`, `WS_MAX_PER_IP`, `WS_MAX_SUBS`, `WRITE_RATE`, `WRITE_BURST`, `MAX_NONCES`.

Tests: `npm test`. Room joins and the match service: `test/match.js`.

## Ασφάλεια αγώνων και περιοχές
- **`/api/verify`** (POST `{proof}`): ο server ξαναπαίζει κάθε αγώνα με πόνταρισμα από τα πλήκτρα (ίδιος κώδικας μάχης, `src/sim.js`) και επιβεβαιώνει τον νικητή. Μόνο επιβεβαιωμένοι αγώνες πρέπει να πληρώνονται. Τεστ: `node test/verify.js`.
- **`/api/geo`**: χώρα και περιοχή από τα headers του Cloudflare (`CF-IPCountry`, και `CF-Region-Code` με Managed Transform). Οι αποκλεισμένες περιοχές για paid modes μπαίνουν στη μεταβλητή **`PAID_BLOCKED`** (π.χ. `PAID_BLOCKED=XX,US-AB`), όπως τις ορίσει ο δικηγόρος. Το free play μένει ανοιχτό παντού.
- Το `src/sim.js` είναι αντίγραφο του `game/sim.js`: το `npm run build` στη ρίζα το αντιγράφει, και το `test/sim_sync.js` αποτυγχάνει αν διαφέρουν.

## Authoritative 1v1 (Phase 2)

On this server the fight of an online 1v1 runs on the server (`src/match.js`, `src/inputbuf.js`), not on the host's browser.
Clients send inputs, the server steps the same `sim.js` the game ships, streams snapshots, and writes the match record itself.
Clients cannot report results: `rules.options.clientMatches` is `false` (set `CLIENT_MATCHES=1` only to bring back legacy client-written matches).

**Flow.** Host `mh` (creates code, seat 0) → guest `mp` (peek: stake/arena/format for the review screen) → guest `mj` (seat 1; the match goes live at once, the 150-frame VS screen is the countdown) → both stream `mi` → server streams `ms` + `mx` → at the K.O. the server writes `matches/srv_<hex>` and `match_logs/srv_<hex>` → both `mr` for a rematch, or `ml`/close.
Seats are bound to the two **authenticated** accounts (`hello` first) that took them; re-sending `mh`/`mj` from the same account (reconnect, new tab) resumes that seat, a third account gets `seat_taken` and can only `mw` (spectate, read-only, max 32).

**Client → server** (websocket JSON; `rid` gets `ok`/`err` like every other message)

| t | fields | meaning |
|---|---|---|
| `mh` | `code` (4-8 `A-Z0-9`), `kit`, `pal`, `stake` (cents, 0..50000), `map` (0..8), `fmt` (`bo3`/`ko`), `t3` | host a match / resume own seat. Errors: `code_taken`, `invalid_argument`, `unauthenticated` |
| `mp` | `code` | peek: returns the status object below |
| `mj` | `code`, `kit`, `pal`, `t3` | take seat 1 / resume own seat. Errors: `seat_taken`, `not_found` |
| `mw` | `code` | watch (read-only) |
| `mi` | `f` (client frame number of `b[0]`), `b` (≤64 masks, 0..255) | input frames, one 8-bit `IN` mask per client 60 Hz frame; all unacked frames are resent, duplicates are dropped. Refused (`not_seated`) for non-players |
| `mr` | | ready for rematch (both → new match, same config) |
| `ml` | | leave; forfeits a live match |

Input = the `sim.js` bitmask (`L1 R2 U4 P8 K16 S32 T64 D128`) sampled once per fixed 60 Hz frame (not per display frame); press edges are therefore per frame and no separate press counters are needed.

**Server → client**
- `ms` snapshot: `{t:'ms', k:code, a:ack, c:consumed, s:pack(m)}`; `s` is `sim.pack()` (the same compact format the host flow uses: `q` server frame, fighters as arrays, x/y ×10, projectiles, last 12 events with ids). `a` = highest input frame received from you (drop older unacked frames), `c` = the input frame the server applied last (your effective delay = sent − `c`). Spectators get `s` only. Sent at `MATCH_SNAP_HZ` (default 60) when the state changed, and on every scene change.
- `mx` status: `{t:'mx', why, code, st:'waiting'|'live'|'over'|'closed', seat, stake, map, fmt, need, seats:[{uid,kit,pal,t3,on,rd}], watchers, games, res:{w,end:'ko'|'forfeit'|'timeout',id,rounds,frames,hash}, delay, snapHz, grace}`. `why`: `start`, `resume`, `disconnect`, `left`, `ready`, `ko`, `forfeit`, `replaced`, `host_left`, `host_gone`, `abandoned`, `ended`.

**Timing.** One drift-corrected 60 Hz clock for all sessions. Each seat has a jitter buffer: it consumes one mask per sim step, waits for `MATCH_INPUT_DELAY` (default **2 frames, ~33 ms**) of cushion after any stall, repeats the last mask when empty (neutral after 30 empty frames), and is capped at `MATCH_MAX_BUFFER` (8) frames by first removing frames equal to their predecessor (keeps every press edge). The slow-motion after a K.O. uses the client's cadence (one step per 2.5 ticks); the replayable log has one entry per step, exactly what `replayMatch` expects.

**Ending.** K.O. (match won) → record with `end:'ko'`. A seat that disconnects keeps its seat for `MATCH_GRACE_MS` (default 10 s; the fight does not pause), then forfeits; `ml` forfeits at once; both gone → abandoned, no record. A waiting host is dropped after `MATCH_WAIT_MS` (15 min); a finished match closes after `MATCH_REMATCH_MS` (90 s) or when both left. Fights longer than 20 min (`MAX_FRAMES`) stop with `end:'timeout'` (log kept, no ranked record).
The record (`matches/srv_<16 hex>`) has the fields the leaderboard reads (`season, a, b, ka, kb, map, stake, w, rounds, ts, fm, ta, tb`) plus `src:'server'`, `end`, `frames`, `log:'sha256:<hex of the encoded input log>'`. The full proof is in `match_logs` (server-only). `POST /api/verify {id}` checks the hash and replays it: for `ko` the replayed winner must match; for `forfeit` the log must be intact and unfinished.

**Private presence rooms** (`oni-<code>`) are bound to the match with that code: seated players may publish presence, other signed-in players are read-only, rooms without a match are refused. The lobby stays open.

**Client.** `public/shim.js` exposes `window.claude.use('match')` → `{peek, join(code,{as:'host'|'seat'|'watch',...}), sendInput(mask), onState(cb), onStatus(cb), ready(), leave()}`; it batches input frames per tick, resends until acked and rejoins after a reconnect. In `game/main.js` the online flow uses it when present (mode `net`): inputs go out at a fixed 60 Hz, snapshots are rendered ~1.5 snapshot intervals + jitter in the past with interpolation of fighters and projectiles. No client-side prediction yet: the local player feels RTT + ~33 ms buffer + ~25 ms interpolation. **Fallback:** where `use('match')` does not exist (claude.ai) the old host-run presence flow is used unchanged, except that the guest now sends presence at most 30/s and only on change (1 s keepalive), and the village presence keeps a 33 ms floor even for forced sends.

**Tests**: `node test/match.js` (real server + websockets: full match to K.O., consistent snapshots for both players and a spectator, server record and `/api/verify`, seat binding, no fake results, rematch, leave and disconnect forfeits, reconnect within grace, room binding). Browser e2e: `node tools/net-e2e.js http://localhost:8124 /tmp/net-shots` from the repo root.
