// Fails CI if a tools/mobile-shots.js report has layout problems.
// Usage: node tools/check-mobile-report.js [/tmp/oni-shots/report.json] [--min-screens=N]
// Fails on any: sub-40px touch target, horizontal overflow, off-screen control,
// control over the fight arena, page/console error, audit crash, or too few screens.
const fs = require('fs');
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--')) || '/tmp/oni-shots/report.json';
const minScreens = +((args.find((a) => a.startsWith('--min-screens=')) || '').split('=')[1] || 1);
const r = JSON.parse(fs.readFileSync(file, 'utf8'));
const problems = [];
for (const [k, a] of Object.entries(r)) {
  if (a.err) problems.push(`${k}: audit failed: ${a.err}`);
  if (a.hOverflow) problems.push(`${k}: horizontal overflow`);
  for (const [key, what] of [['small', 'small target'], ['offscreen', 'off-screen'], ['overlapFight', 'over the arena'], ['errors', 'page error']]) {
    for (const x of a[key] || []) problems.push(`${k}: ${what}: ${x}`);
  }
}
const n = Object.keys(r).length;
if (n < minScreens) problems.push(`only ${n} screens in the report (expected >= ${minScreens})`);
if (problems.length) {
  console.error(`FAIL mobile report ${file}: ${problems.length} problem(s) in ${n} screens`);
  for (const p of problems.slice(0, 200)) console.error('  ' + p);
  process.exit(1);
}
console.log(`OK mobile report: ${n} screens, no small targets, overflow, off-screen controls, arena overlap or page errors`);
