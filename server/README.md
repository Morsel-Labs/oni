# ONI server (theonicurse.xyz)

Ο server του ONI. Κάνει τρία πράγματα, όπως το claude.ai στο prototype:
1. **Λογαριασμοί**: guest αυτόματα, και σύνδεση με wallet Solana (υπογραφή μηνύματος) έτοιμη στο API.
2. **Ζωντανή βάση**: matches, προφίλ, Enma, airdrop points, CPU streaks, inventory, με κανόνες (κανείς δεν γράφει στα δεδομένα άλλου, κανείς δεν σβήνει matches).
3. **Δωμάτια**: το χωριό (ως 40 παίκτες ανά "αντίγραφο", ανοίγουν αυτόματα κι άλλα) και τα δωμάτια των 1v1.

Το παιχνίδι είναι το ίδιο αρχείο με το artifact, με ένα μικρό script (`public/shim.js`) που το συνδέει στον server.

> Φάση 1: χωρίς πραγματικά λεφτά. Στα 1v1 την μάχη την τρέχει ο host παίκτης. Πριν μπουν stakes, η μάχη πρέπει να τρέχει στον server (Φάση 2).

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
- `GET /health`

## Επόμενα (Φάση 2)
- Η μάχη να τρέχει στον server (anti-cheat) και matchmaking "Find match".
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

Tests: `npm test`. Not covered here: room joins (`rooms.js`, match service).

## Ασφάλεια αγώνων και περιοχές
- **`/api/verify`** (POST `{proof}`): ο server ξαναπαίζει κάθε αγώνα με πόνταρισμα από τα πλήκτρα (ίδιος κώδικας μάχης, `src/sim.js`) και επιβεβαιώνει τον νικητή. Μόνο επιβεβαιωμένοι αγώνες πρέπει να πληρώνονται. Τεστ: `node test/verify.js`.
- **`/api/geo`**: χώρα και περιοχή από τα headers του Cloudflare (`CF-IPCountry`, και `CF-Region-Code` με Managed Transform). Οι αποκλεισμένες περιοχές για paid modes μπαίνουν στη μεταβλητή **`PAID_BLOCKED`** (π.χ. `PAID_BLOCKED=XX,US-AB`), όπως τις ορίσει ο δικηγόρος. Το free play μένει ανοιχτό παντού.
- Όταν αλλάζει ο κώδικας μάχης του παιχνιδιού, αντέγραψε το `sim.js` και στο `src/sim.js`.
