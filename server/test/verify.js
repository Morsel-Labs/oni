// node test/verify.js : the server replays matches and catches false results
const S = require('../src/sim.js'); const { verifyProof } = require('../src/verify.js');
let ok = 0, caught = 0;
for (let t = 0; t < 6; t++) {
  const m = S.mkMatch('host', 500, [S.KITS[t % S.KITS.length], S.KITS[(t + 2) % S.KITS.length]], t % 9, { need: 2 }); m.log = [];
  const A = { hold: 0, bits: 0, gap: false }, B = { hold: 0, bits: 0, gap: false };
  for (let i = 0; i < 60 * 60 * 12 && m.scene !== 'matchEnd'; i++) { const a = S.cpuInput(m, 0, A, 2), b = S.cpuInput(m, 1, B, 2); m.log.push(a | (b << 8)); S.step(m, [a, b]); if (m.slow > 0) m.slow--; }
  const p = S.matchProof(m);
  if (verifyProof(p).ok) ok++;
  if (!verifyProof(Object.assign({}, p, { winner: 1 - p.winner })).ok) caught++;
}
console.log('honest matches verified:', ok, 'of 6 | false winners caught:', caught, 'of 6');
process.exit(ok === 6 && caught === 6 ? 0 : 1);
