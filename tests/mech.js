// targeted tests of the new mechanics
const S=require('../game/sim.js');const IN=S.IN;
function setup(k0='oni',k1='oni',gap=40){const m=S.mkMatch('t',0,[k0,k1],1);m.scene='fight';m.f[0].x=140;m.f[1].x=140+gap;return m;}
function run(m,f0,f1,n){for(let t=0;t<n;t++){S.step(m,[typeof f0==='function'?f0(t):f0,typeof f1==='function'?f1(t):f1]);}}
const R=[];const ok=(name,c)=>R.push((c?'PASS ':'FAIL ')+name);
// 1. standing block vs punch (defender holds back = R since attacker on left)
{const m=setup();run(m,t=>t===1?IN.P:0,IN.R,20);ok('stand block stops punch',m.f[1].hp>=m.f[1].mhp-2);}
// 2. sweep beats standing block
{const m=setup();run(m,t=>t===1?(IN.D|IN.K):IN.D,IN.R,30);ok('sweep hits a standing blocker',m.f[1].hp<=m.f[1].mhp-8);}
// 3. crouch block stops sweep
{const m=setup();run(m,t=>t===1?(IN.D|IN.K):IN.D,IN.R|IN.D,30);ok('crouch block stops sweep',m.f[1].hp>=m.f[1].mhp-2);}
// 4. overhead (jump attack) beats crouch block
{const m=setup('oni','oni',60);run(m,t=>t===0?(IN.U|IN.R):t===24?IN.K:0,IN.R|IN.D,60);ok('jump-in (kick on the way down) hits a crouch blocker',m.f[1].hp<m.f[1].mhp-4);}
{const m=setup('oni','oni',60);run(m,t=>t===0?(IN.U|IN.R):t===24?IN.K:0,IN.R,60);ok('stand block stops the same jump-in (chip only)',m.f[1].hp>=m.f[1].mhp-4);}
// 5. throw beats block
{const m=setup('oni','oni',24);run(m,t=>t===1?IN.T:0,IN.R,50);ok('throw beats block',m.f[1].hp<=m.f[1].mhp-12);}
// 6. throw tech
{const m=setup('oni','oni',24);run(m,t=>t===1?IN.T:0,t=>t===7?IN.T:0,50);ok('throw tech prevents damage',m.f[1].hp===m.f[1].mhp);}
// 7. dash
{const m=setup('oni','oni',120);const x0=m.f[0].x;run(m,t=>[IN.R,0,IN.R,IN.R,IN.R,IN.R,IN.R][t]||0,0,12);ok('dash moves fast forward',m.f[0].x-x0>25);}
// 8. super needs full meter, and hits
{const m=setup('oni','oni',40);m.f[0].meter=100;run(m,t=>t<2?IN.D:t===2?(IN.D|IN.S):0,0,60);ok('super hits for 26',m.f[1].mhp-m.f[1].hp>=26);}
{const m=setup('oni','oni',40);m.f[0].meter=60;let sp=false,su=false;run(m,t=>{sp=sp||m.f[0].st==='special';su=su||m.f[0].st==='super';return t<2?IN.D:t===2?(IN.D|IN.S):0;},0,60);ok('no super at 60 meter (special instead)',sp&&!su);}
// 9. super invulnerable at startup: opponent punches during startup
{const m=setup('oni','oni',30);m.f[0].meter=100;run(m,t=>t<2?IN.D:t===2?(IN.D|IN.S):0,t=>t===3?IN.P:0,60);ok('super startup is invulnerable',m.f[0].hp===m.f[0].mhp);}
// 10. crouch lowers hurtbox
{const m=setup();run(m,0,IN.D,5);ok('crouch state',m.f[1].st==='crouch'&&m.f[1].crouch);}
console.log(R.join('\n'));
const fails=R.filter(r=>r.startsWith('FAIL')).length;console.log(fails?fails+' FAILED':'all '+R.length+' passed');process.exitCode=fails?1:0;
