# Σημειώσεις ανάπτυξης (ελληνικά)

Για την ομάδα. Το επίσημο README είναι στα αγγλικά.


1v1 pixel fighting game στο browser, με χωριό (open world hub), ranked seasons, τουρνουά (TENKA), community boss (Enma), καζάνια και server για το **theonicurse.xyz**.

## Γρήγορο ξεκίνημα
```bash
npm install            # μόνο για τα τεστ
npm run build          # φτιάχνει dist/oni-fighter.html και server/public/index.html
npm test               # τεστ μηχανικών και ροής (28 πλήρεις αγώνες με CPU)
npm run server         # τρέχει τον server στο http://localhost:8080
```
Μπορείς να ανοίξεις και κατευθείαν το `dist/oni-fighter.html` στον browser. Τα online κομμάτια θέλουν είτε claude.ai είτε τον server.

## Δομή
```
game/
  sim.js        Η μάχη. Καθαρή, ντετερμινιστική, χωρίς DOM. Χαρακτήρες (CH, KITS), φυσική, hitboxes, AI του CPU.
  main.js       Όλο το υπόλοιπο παιχνίδι: rendering, ήχος, input, μενού, χωριό, online, leaderboard, market, τουρνουά.
  page.html     HTML και CSS. Τα %%ART%%, %%SIM%% και %%MAIN%% τα συμπληρώνει το build.
  art/
    hi.js       Οι χαρακτήρες σε υψηλή ανάλυση (σκελετός και στάσεις). Ένας renderer για μάχη, πορτρέτα και previews.
    arenas_hi.js  Οι αρένες (480x270).
    vil.js      Το χωριό: χάρτης, chibi, ταμπέλες, champions, κελί του boss.
    cauldhi.js  Τα καζάνια.
    gods2.js    God tier (Raijin, Fujin), μόνο ως preview για τώρα.
tools/build.js  Ενώνει τα παραπάνω σε ένα αρχείο HTML.
tests/          mech.js (μηχανικές μάχης), flow.js (ολόκληρα παιχνίδια με CPU).
server/         Ο game server. Δες server/README.md για το στήσιμο.
dist/           Το έτοιμο παιχνίδι μετά το build.
```

## Πώς δουλεύει
- **Μάχη**: `step(match, [input0, input1])` 60 φορές το δευτερόλεπτο, στο `sim.js`. Χωρίς τυχαιότητα, οπότε ίδια inputs δίνουν ίδιο αποτέλεσμα. Το rendering διαβάζει μόνο την κατάσταση.
- **Κλίμακα**: όλα τα hitboxes πολλαπλασιάζονται με το `GEO` (1.45). Τα γραφικά ζωγραφίζονται σε 480x270 και 1 μονάδα κόσμου = 1.5 px. Οι κινήσεις στο `hi.js` ζωγραφίζονται όσο ακριβώς φτάνει το hitbox.
- **Online**: το παιχνίδι ζητάει τρεις υπηρεσίες με `window.claude.use('room' | 'db' | 'user')`. Στο claude.ai τις δίνει το claude.ai. Στο theonicurse.xyz τις δίνει ο δικός μας server μέσω του `server/public/shim.js`, με την ίδια ακριβώς μορφή, οπότε το παιχνίδι δεν αλλάζει.
- **1v1**: ο host τρέχει τη μάχη και στέλνει την κατάσταση. Ο guest στέλνει μόνο inputs. (Φάση 2: η μάχη θα τρέχει στον server.)
- **Βάση (collections)**: `matches`, `profiles`, `boss`, `tickets` (airdrop points), `practice` (CPU streaks), `data/users/{id}/inv` (inventory). Κανόνες στο `server/src/rules.js`: κανείς δεν γράφει στα έγγραφα άλλου, κανείς δεν σβήνει matches.

## Πού αλλάζουν τα βασικά
| Τι | Πού |
|---|---|
| Χαρακτήρες, ζωή, ζημιά, κινήσεις | `sim.js` → `CH` |
| Αρένες και stakes | `main.js` → `MAPS` |
| Τουρνουά | `main.js` → `CUPS`, `TSPLIT` |
| Season (2 εβδομάδες), έπαθλα | `main.js` → `SEASON_START`, `BRACKETS`, `ELIG`, `paidPlaces` |
| Activity bonus | `main.js` → `ACT` |
| Ranks | `main.js` → `RANKS` |
| Founders (Genesis Oni) | `main.js` → `FOUNDER_CAP` |

## Κανόνες της ομάδας
1. **"Style, never power."** Ό,τι πουλιέται δεν δίνει πλεονέκτημα στις μάχες με λεφτά. Το balance είναι 48–53% σε όλα τα matchups.
2. **Αλλαγή στο `sim.js` = τρέχεις `npm test`** και ελέγχεις το balance.
3. Μετά από κάθε αλλαγή: `npm run build` και άνοιγμα του `dist/oni-fighter.html` σε desktop και κινητό.
4. Δουλεύουμε σε **branches** και κάνουμε **pull request** στο `main`.

## Λειτουργίες (Wave 1)
Διαδραστικό tutorial (10 βήματα), Arcade mode (6 αντίπαλοι + Enma), daily missions (airdrop points), achievements, clans (tag στο προφίλ, καρτέλα Clans), referrals (`?ref=ID`), bounty (+25 points για νίκη πάνω στον #1 σε rating), Weekly Free Cup, κάρτα K.O. για share, event Yokai Night (Οκτώβριος). Όλα στο `game/main.js`, ενότητα "WAVE 1".

## Τι υπάρχει στο παιχνίδι (τελευταία έκδοση)
- **Μαχητές**: 7 + Enma, όλοι σε HD. Σελίδα **Champions** για να τους βλέπεις.
- **Practice** με δυσκολία: Very easy, Easy, Normal, Hard, Auto (`DIFFS` στο `main.js`, `level<0` στο `cpuInput` του `sim.js`).
- **Χωριό**: απλωμένο x1.75 (περίπου 3x επιφάνεια): το παλιό σχέδιο χτίζεται εκτός οθόνης και κάθε νησίδα μεταφέρεται σε νέα θέση (`VS=1.75`, `VPIECES` στο `vil.js`). HD σπίτια, πόρτες που ανοίγουν περπατώντας, dock και πάπυρος (Tab), κάρτα παίκτη με level και balance, χάλκινα καζάνια ding.
- **Levels και XP**, **Missions** με daily sweep (σεντούκι + 100 XP) και streak, **σεντούκια** με φανερές πιθανότητες.
- **Market**: καρτέλες ανά ομάδα, τιμές σε SOL/SOL, -20% με $ONI, bonus αγοράς, Bundles. **Trade**: fee 2.5% αγοραστής + 2.5% πωλητής σε $ONI, με συνολικό κόστος. **Inventory** σε δική του σελίδα.
- **ONI holder tiers**: Bronze/Silver/Gold (`HOLD`).
- **TENKA**: 5 κύπελλα σε λίστα με θέσεις, διαμαντένια σελίδα, **Grand Tournament** (160 θέσεις, $20, πληρώνονται οι 20 πρώτοι, `GRAND`), **μετάλλια** ανά πληρωμένο κύπελλο (`MEDALS`), ενότητα **Live** στην αρχική από τους 16 (`DB.live`).
- **Enma**: Free ή $1 try, το **βάζο** (90% κάθε $1, όλο στον νικητή), πολύ δύσκολος (`bossMods`, `bossAI`).
- **Clans 2.0**: εμβλήματα (σύμβολο/χρώμα ή εικόνα, `clanMeta` στο προφίλ του αρχηγού), Clan War **μηνιαίο** με βάθρο και 500K $ONI (250K/150K/100K, `CLAN_PRIZE`, `clanWarStart`), $ONI που κέρδισε κάθε clan.
- **Ένα boss**: ο Enma (με το βάζο). Ο Shuten-doji μένει μόνο ως διακόσμηση στη φυλακή του χωριού.

- **Avatar skins** (`avatars.js`): Straw Ronin, Lantern Ghost, Komainu, Golden Shogun (limited 500, tradeable), στο Market → Avatars, Equip στο Inventory, στέλνονται στους άλλους στο χωριό (`av` στο presence).
- **Admins**: συλλογή `grants`, **εγγραφή μόνο από τον ιδιοκτήτη** (κανόνας `write: owner`). Ο ιδιοκτήτης πατάει "Owner: become admin" στο προφίλ του, και μετά "Make admin" στο προφίλ άλλων. Οι admins φοράνε τον **Oni Emperor**: λευκός σογκούν πάνω σε λευκό άλογο, με **2x ταχύτητα** στο χωριό. Αν κάποιος στείλει `av:'emperor'` χωρίς να είναι admin, εμφανίζεται κανονικά.

- **Fees**: 1v1 5% (1% rank rewards, 0.5% Curse Cauldron, 3.5% ONI; `SEASON_BPS=100` στο `sim.js`). TENKA 10% (5% ONI, 3% rank rewards, 2% Curse Cauldron). Trade 2.5% + 2.5% σε $ONI, όλα για διαφήμιση.

- **Legal** (`legalDocs()` στο main.js): Terms, Privacy, Responsible Play, Fees and odds, Token and risk. **Πρόχειρα**, θέλουν έλεγχο από δικηγόρο. Συμπλήρωσε `LEGAL_CO`, `LEGAL_MAIL`, [State].

## Roadmap
- **Τώρα (Q1)**: launch με 7 μαχητές, χωριό, TENKA, Enma, market, clans. Μετά, ένας νέος μαχητής κάθε 2-4 εβδομάδες (Taro, Bunbuku, Fubuki, Hone, Yui, Kasa, Kumo, Orochi).
- **Q2: η επόμενη εποχή**, με προσωρινό όνομα **"Dragon Age"** (ή άλλο που θα βρούμε μαζί). Εκεί αναπτύσσεται το **open world** κομμάτι του παιχνιδιού. Προχωράει **αν το project πάει καλά**.

## Για τον server (εκκρεμεί)
Online 1v1, πραγματικές θέσεις στα κύπελλα (`DB.cupSeats`, `DB.grandSeats`), ζωντανή μετάδοση (`DB.live`), επαλήθευση των $1 μαχών με τον Enma στον server (ασφάλεια του βάζου), wallet και πληρωμές, holder tiers από το on-chain balance.

## Solana και $ONI (σχέδιο, demo στο παιχνίδι)
- **Νόμισμα: SOL** για πονταρίσματα, κύπελλα, Enma, καζάνια και έπαθλα. Τα ποσά φαίνονται σε $ και μετατρέπονται σε SOL τη στιγμή της πληρωμής. Το **$ONI** για cosmetics (−20%).
- **Κατάσταση πληρωμών (ειλικρινά)**: το demo δεν κινεί λεφτά, το "Connect wallet" φτιάχνει demo address, το escrow (`oni-contract-preview`) είναι **unaudited preview** που δεν έχει ανέβει και δεν καλείται από το παιχνίδι. Πληρωμές: roadmap, μετά από devnet, σύνδεση με το παιχνίδι και audit.
- **Αγορές στο market**: SOL, ή **$ONI με -20%**. Bonus σε κάθε αγορά μαχητή (μόνο εμφάνιση και XP): `TIER_BONUS` στο `main.js`.
- **Κλίμακες ONI holders**: Free, $1 και $3 χωρίς $ONI. Bronze $30 (για πονταρίσματα πάνω από $3, +5% airdrop points), Silver $100 (fee 4%, Daimyo/Shogun Cup, Battle Pass), Jade $500 (fee 3.5%, Battle Pass, +10% airdrop points), Gold $1,000 (fee 3%, Battle Pass, Tenno Cup). Η αξία μετριέται σε USD τη στιγμή του ελέγχου: `HOLD`, `ONI_USD` στο `main.js` (demo τιμές). Ο server πρέπει να διαβάζει το balance του wallet on-chain και να εφαρμόζει τους κανόνες.
- **Fees δικτύου σε SOL**: τα πληρώνει ο server (fee payer) για λογαριασμό του παίκτη.
- **Bundles** με γνωστό περιεχόμενο (`BUNDLES`) αντί για τυχαία πακέτα. **Σεντούκια** μόνο ως ανταμοιβή (ένα ανά level), με φανερές πιθανότητες (`CHEST_ODDS`), και τα items τους δεν πωλούνται.
- Πριν το launch: νομικός έλεγχος για stakes, holder tiers και αγορά/πώληση μεταξύ παικτών.

## Γνωστά ανοιχτά θέματα
- Φάση 1: η μάχη των 1v1 τρέχει στον host. Πριν τα πραγματικά stakes πρέπει να τρέχει στον server.
- Η σύνδεση wallet είναι έτοιμη στον server (`/api/nonce`, `/api/wallet`) αλλά όχι ακόμα στο κουμπί "Connect wallet".
- God tier και PvE Final Boss (Shuten-dōji) υπάρχουν μόνο ως teasers.
- Wave 2: Season Pass, Spectate, combo trials. Το "Find match" θέλει τη μάχη στον server.
- Το χωριό είναι 1120x720. Το αρχικό χωριό βρίσκεται στο (VOX, VOY) μέσα στον μεγαλύτερο κόσμο (δες `game/art/vil.js`).
