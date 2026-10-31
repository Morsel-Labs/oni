// Builds the single-file game: dist/oni-fighter.html (for claude.ai) and server/public/index.html (for theonicurse.xyz).
const fs = require('fs'), path = require('path');
const G = p => path.join(__dirname, '..', p);
const read = p => fs.readFileSync(G(p), 'utf8');
const ART = ['game/art/hi.js', 'game/art/cauldhi.js', 'game/art/vil.js', 'game/art/avatars.js', 'game/art/arenas_hi.js', 'game/art/gods2.js'].map(read).join('\n');
const html = read('game/page.html').split('%%ART%%').join(ART).split('%%SIM%%').join(read('game/sim.js')).split('%%MAIN%%').join(read('game/main.js'));
// the server runs the same fight code: copy it so game/sim.js and server/src/sim.js can never drift (checked by server/test/sim_sync.js)
fs.copyFileSync(G('game/sim.js'), G('server/src/sim.js'));
fs.mkdirSync(G('dist'), { recursive: true });
fs.writeFileSync(G('dist/oni-fighter.html'), html);
const i = html.indexOf('<script');
fs.mkdirSync(G('server/public'), { recursive: true });
fs.writeFileSync(G('server/public/index.html'), html.slice(0, i) + '<script src="/shim.js"></script>\n' + html.slice(i));
console.log('Built dist/oni-fighter.html and server/public/index.html (' + Math.round(html.length / 1024) + ' KB)');
