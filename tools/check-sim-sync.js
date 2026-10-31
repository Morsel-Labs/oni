// Fails if the client sim (game/sim.js) and the server sim (server/src/sim.js) differ.
// /api/verify replays matches with the server copy, so any drift silently breaks verification.
// Usage: node tools/check-sim-sync.js
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const files = ['game/sim.js', 'server/src/sim.js'];
const [a, b] = files.map((f) => fs.readFileSync(path.join(root, f)));
const md5 = (x) => crypto.createHash('md5').update(x).digest('hex');
if (!a.equals(b)) {
  const la = a.toString('utf8').split('\n'), lb = b.toString('utf8').split('\n');
  let i = 0; while (i < la.length && la[i] === lb[i]) i++;
  console.error(`FAIL sim drift: ${files[0]} (${md5(a)}) != ${files[1]} (${md5(b)}); first difference at line ${i + 1}`);
  console.error('Edit game/sim.js, then: cp game/sim.js server/src/sim.js');
  process.exit(1);
}
console.log(`OK sim in sync (${md5(a)}, ${a.length} bytes)`);
