const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');const fs=require('fs');
const stub=()=>new Proxy(function(){},{get:(t,k)=>{if(k==='classList')return{toggle(){},add(){},remove(){},contains(){return false}};if(k==='style')return{};if(k==='dataset')return{};if(k==='value')return'100';if(k===Symbol.toPrimitive)return()=>'';return t[k]!==undefined?t[k]:stub();},set:(t,k,v)=>{t[k]=v;return true;},apply:()=>stub()});
const main=createCanvas(320,180);
global.document={getElementById:id=>id==='cv'?main:stub(),createElement:t=>t==='canvas'?createCanvas(64,72):stub(),querySelectorAll:()=>[],body:{classList:{toggle(){},add(){},contains(){return false}}},activeElement:null,fonts:null};
global.window=global;global.addEventListener=()=>{};global.matchMedia=()=>({matches:false});global.localStorage={_s:{},getItem(k){return this._s[k]||null},setItem(k,v){this._s[k]=v}};
global.requestAnimationFrame=()=>{};let NOW=0;global.performance={now:()=>NOW};global.setTimeout=()=>0;global.clearTimeout=()=>{};global.setInterval=()=>0;global.clearInterval=()=>{};
const sim=fs.readFileSync(__dirname+'/../game/sim.js','utf8').replace(/if\(typeof module[^\n]*/,'');
let src=fs.readFileSync(__dirname+'/../game/main.js','utf8').replace(/if\(document\.fonts[^\n]*\n?$/,'');
const lib=new Function(sim+'\n'+src+`;return {buildAll,loop,startCPU,openSelect,SEL,getM:()=>M,getMode:()=>mode,endShownF:()=>endShown};`)();
lib.buildAll();
let runs=0,ends=0;
for(const kit of (process.env.KITS||'oni,saru,ryu,kitsune,tengu,kappa,onryo').split(','))for(let map=0;map<4;map++){
  lib.openSelect('cpu');lib.SEL.kit=kit;lib.SEL.map=map;lib.startCPU();runs++;
  let frames=0,sawEnd=false;
  while(frames<60*60*6){NOW+=16.7;lib.loop(NOW);frames++;const M=lib.getM();if(lib.endShownF())sawEnd=true;if(lib.getMode()==='title')break;}
  if(sawEnd)ends++;else throw new Error('no end for '+kit+' map '+map+' mode '+lib.getMode()+' scene '+(lib.getM()&&lib.getM().scene));
}
lib.openSelect('online');
console.log('cpu runs',runs,'reached end screen',ends,'final mode',lib.getMode());
process.exit(runs>0&&ends===runs?0:1);
