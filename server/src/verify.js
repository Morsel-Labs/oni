// Replays a staked match from its key log with the same fight code the game uses,
// and says whether the claimed winner is the real one.
const S = require('./sim.js');
function verifyProof(proof) {
  const r = S.replayMatch(proof);
  if (!r.ok) return { ok: false, error: r.error || 'match_not_finished' };
  return { ok: r.winner === proof.winner, winner: r.winner, claimed: proof.winner, frames: r.frames };
}
module.exports = { verifyProof };
