// Turns tools/mobile-shots.js report.json into the markdown "Mobile scorecard" used in docs/AUDIT.md.
// Usage: node tools/audit/scorecard.js /tmp/oni-shots/report.json
// Rules (menus): FAIL = any off-screen control, page error, horizontal overflow or >=10 sub-40px targets;
// WARN = 3-9 sub-40px targets; PASS otherwise. Fight-type screens are WARN by default (portrait canvas share,
// landscape pad over the arena) and FAIL when the tutorial/training toolbar has >=10 small targets.
// Cells listed in MANUAL come from visual review of the screenshots.
const fs = require('fs');
const r = JSON.parse(fs.readFileSync(process.argv[2] || '/tmp/oni-shots/report.json', 'utf8'));
const SCREENS = ['landing', 'village', 'vmenu', 'select', 'fight', 'training', 'tutorial', 'end', 'store', 'profile', 'tourney', 'boss', 'how', 'missions', 'clans', 'settings', 'inventory', 'champions', 'cauldron', 'controls', 'legal', 'board'];
// MANUAL verdicts were made by eye on the pre-overhaul baseline; apply them only with BASELINE=1.
const MANUAL = process.env.BASELINE !== '1' ? {} : { 'village:P': 'WARN (dock covers card + hint)', 'village:Ps': 'WARN (dock covers card + hint)', 'village:L': 'WARN (player card over pad)', 'village:Ls': 'WARN (player card over pad)',
  'tutorial:L': 'FAIL (toolbar hides lesson text)', 'tutorial:Ls': 'FAIL (toolbar hides lesson text)' };
const tot = { PASS: 0, WARN: 0, FAIL: 0 };
const lines = ['| Screen | P 390x844 | L 844x390 | Ps 360x640 | Ls 640x360 |', '|---|---|---|---|---|'];
for (const s of SCREENS) {
  const row = [];
  for (const d of ['P', 'L', 'Ps', 'Ls']) {
    const a = r[`${d}-${s}`]; if (!a) { row.push('n/a'); continue; }
    const sm = (a.small || []).length, off = (a.offscreen || []).length, ov = (a.overlapFight || []).length, e = (a.errors || []).length;
    let v;
    if (MANUAL[`${s}:${d}`]) v = MANUAL[`${s}:${d}`];
    else if (a.canvasShare != null) v = (s === 'tutorial' && sm >= 10 ? 'FAIL' : 'WARN') + ` (canvas ${Math.round(a.canvasShare * 100)}%, ${sm} small, ${ov} over arena)`;
    else { const k = off || e || a.hOverflow || sm >= 10 ? 'FAIL' : sm >= 3 ? 'WARN' : 'PASS';
      const det = [sm && `${sm} small`, off && `${off} off-screen`, e && `${e} errors`, a.hOverflow && 'h-overflow'].filter(Boolean);
      v = k + (det.length ? ` (${det.join(', ')})` : ''); }
    tot[v.split(' ')[0]]++; row.push(v);
  }
  lines.push(`| ${s} | ${row.join(' | ')} |`);
}
console.log(lines.join('\n'));
console.log(`\nTotals: ${tot.PASS} PASS, ${tot.WARN} WARN, ${tot.FAIL} FAIL (of ${tot.PASS + tot.WARN + tot.FAIL})`);
