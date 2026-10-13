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

## Ασφάλεια αγώνων και περιοχές
- **`/api/verify`** (POST `{proof}`): ο server ξαναπαίζει κάθε αγώνα με πόνταρισμα από τα πλήκτρα (ίδιος κώδικας μάχης, `src/sim.js`) και επιβεβαιώνει τον νικητή. Μόνο επιβεβαιωμένοι αγώνες πρέπει να πληρώνονται. Τεστ: `node test/verify.js`.
- **`/api/geo`**: χώρα και περιοχή από τα headers του Cloudflare (`CF-IPCountry`, και `CF-Region-Code` με Managed Transform). Οι αποκλεισμένες περιοχές για paid modes μπαίνουν στη μεταβλητή **`PAID_BLOCKED`** (π.χ. `PAID_BLOCKED=XX,US-AB`), όπως τις ορίσει ο δικηγόρος. Το free play μένει ανοιχτό παντού.
- Όταν αλλάζει ο κώδικας μάχης του παιχνιδιού, αντέγραψε το `sim.js` και στο `src/sim.js`.
