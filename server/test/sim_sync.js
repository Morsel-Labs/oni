// node test/sim_sync.js : the server runs the exact fight code the game ships.
// server/src/sim.js is a build copy of game/sim.js (tools/build.js); this fails if they drift.
const fs = require('fs'), path = require('path');
const game = path.join(__dirname, '..', '..', 'game', 'sim.js'), server = path.join(__dirname, '..', 'src', 'sim.js');
if (!fs.existsSync(game)) { console.log('sim sync: game/sim.js not present (server-only checkout), skipped'); process.exit(0); }
const same = fs.readFileSync(game).equals(fs.readFileSync(server));
console.log(same ? 'sim sync: server/src/sim.js is identical to game/sim.js' : 'sim sync: server/src/sim.js differs from game/sim.js. Run `npm run build` at the repo root.');
process.exit(same ? 0 : 1);
