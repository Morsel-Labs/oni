// Runs locally what CI (.github/workflows/ci.yml) runs. Usage:
//   npm run check                 # build + freshness, sim sync, tests, server tests, escrow (Rust if cargo exists)
//   npm run check -- --mobile     # also tools/mobile-shots.js + check-mobile-report.js (needs Playwright)
//   npm run check -- --quick      # skip the slow tests/flow.js (about 3 min)
// Installs missing server/ and contracts/oni-escrow/ node_modules with `npm ci`.
const { spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const results = [];
const run = (label, cmd, cmdArgs, cwd = ROOT, opt = {}) => {
  console.log(`\n=== ${label}: ${cmd} ${cmdArgs.join(' ')}${cwd !== ROOT ? `  (in ${path.relative(ROOT, cwd)})` : ''}`);
  const t = Date.now();
  const r = spawnSync(cmd, cmdArgs, { cwd, stdio: 'inherit', shell: process.platform === 'win32', ...opt });
  const pass = r.status === 0;
  results.push({ label, status: pass ? 'PASS' : 'FAIL', secs: ((Date.now() - t) / 1000).toFixed(1) });
  return pass;
};
const skip = (label, why) => { results.push({ label, status: 'SKIP', secs: '-', why }); console.log(`\n=== ${label}: SKIP (${why})`); };
const has = (bin) => spawnSync(bin, ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' }).status === 0;
const ensureDeps = (dir) => fs.existsSync(path.join(dir, 'node_modules')) || run(`npm ci (${path.relative(ROOT, dir) || '.'})`, 'npm', ['ci'], dir);

ensureDeps(ROOT);
if (run('build', 'npm', ['run', 'build'])) {
  run('built files committed and fresh', 'git', ['diff', '--exit-code', '--stat', '--', 'dist', 'server/public']);
}
run('sim sync', 'node', ['tools/check-sim-sync.js']);
run('mechanics tests', 'node', ['tests/mech.js']);
if (args.includes('--quick')) skip('flow tests', '--quick'); else run('flow tests', 'node', ['tests/flow.js']);

const server = path.join(ROOT, 'server');
if (ensureDeps(server)) run('server tests', 'npm', ['test'], server);

const escrow = path.join(ROOT, 'contracts', 'oni-escrow');
if (ensureDeps(escrow)) {
  if (has('cargo')) run('escrow cargo test', 'cargo', ['test', '-p', 'oni_escrow'], escrow);
  else skip('escrow cargo test', 'cargo not installed');
  run('escrow client checks', 'node', ['tests/client.test.js'], escrow);
}

if (args.includes('--mobile')) {
  const out = path.join(require('os').tmpdir(), 'oni-check-shots');
  if (run('mobile shots', 'node', ['tools/mobile-shots.js', out])) run('mobile report', 'node', ['tools/check-mobile-report.js', path.join(out, 'report.json'), '--min-screens=88']);
} else skip('mobile shots', 'pass --mobile (needs Playwright + Chromium)');

console.log('\n=== summary');
for (const r of results) console.log(`${r.status.padEnd(5)} ${r.label.padEnd(34)} ${String(r.secs).padStart(6)}s${r.why ? '  ' + r.why : ''}`);
const failed = results.filter((r) => r.status === 'FAIL').length;
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
