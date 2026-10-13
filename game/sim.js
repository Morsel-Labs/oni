/* ===== Pure fight simulation, no DOM. Runs unchanged on an authoritative game server. ===== */
const W=320,H=180,GROUND=156,LEFT=14,RIGHT=306;
const IN={L:1,R:2,U:4,P:8,K:16,S:32,T:64,D:128};
const GEO=1.45; // fighters are drawn 25% larger; all hit geometry scales with them
const KITS=['oni','saru','ryu','kitsune','tengu','kappa','onryo','enma'];
const CH={
  oni:{name:'ONI',tier:0,hp:94,speed:1.38,jump:-5.3,dj:false,w:18,h:36,
    punch:{high:true,s:5,a:3,r:10,dmg:7,reach:32,y:16,h:12,kb:2.4,stun:13,hs:4},
    kick:{s:6,a:4,r:14,dmg:9,reach:28,y:4,h:9,kb:3.2,stun:17,hs:6},
    special:{type:'proj',at:10,len:32,vx:3.2,life:120,r:5,y:24,dmg:13,stun:18,kb:2.6}},
  saru:{name:'KAZE',tier:1,hp:95,speed:1.5,jump:-5.5,dj:true,w:16,h:32,
    punch:{high:true,s:5,a:3,r:13,dmg:5,reach:34,y:16,h:8,kb:2.0,stun:12,hs:3},
    kick:{s:6,a:4,r:15,dmg:7,reach:24,y:6,h:10,kb:3.0,stun:15,hs:5},
    special:{type:'staff',at:10,act:4,len:36,reach:105,y:17,h:7,dmg:10,stun:15,kb:3.0}},
  ryu:{name:'SEIRYU',tier:3,hp:118,speed:1.05,jump:-4.9,dj:false,w:24,h:40,
    punch:{high:true,s:7,a:4,r:14,dmg:10,reach:30,y:18,h:14,kb:2.8,stun:15,hs:5},
    kick:{s:10,a:4,r:20,dmg:12,reach:31,y:2,h:10,kb:3.6,stun:19,hs:7},
    special:{type:'proj',at:12,len:36,vx:2.3,life:42,r:9,y:26,dmg:15,stun:20,kb:3.0}},
  kitsune:{name:'KIRA',tier:2,hp:92,speed:1.5,jump:-5.4,dj:false,w:16,h:34,
    punch:{high:true,s:4,a:3,r:12,dmg:6,reach:33,y:17,h:10,kb:2.2,stun:13,hs:4},
    kick:{s:6,a:4,r:14,dmg:8,reach:27,y:5,h:9,kb:3.0,stun:16,hs:5},
    special:{type:'blink',at:8,len:10,dist:20}},
  tengu:{name:'HAYATE',tier:2,hp:110,speed:1.3,jump:-5.6,dj:false,glide:true,w:18,h:36,
    punch:{high:true,s:5,a:3,r:11,dmg:7,reach:31,y:17,h:10,kb:2.3,stun:13,hs:4},
    kick:{s:6,a:4,r:14,dmg:9,reach:27,y:4,h:9,kb:3.1,stun:17,hs:6},
    special:{type:'dive',at:12,len:70,vx:4.2,vy:3.2,dmg:13,stun:18,kb:3.0}},
  kappa:{name:'GENBU',tier:1,hp:100,speed:1.25,jump:-5.0,dj:false,w:22,h:32,
    punch:{high:true,s:5,a:3,r:12,dmg:8,reach:29,y:14,h:12,kb:2.6,stun:14,hs:5},
    kick:{s:7,a:4,r:15,dmg:10,reach:30,y:3,h:10,kb:3.4,stun:18,hs:6},
    special:{type:'counter',from:3,to:24,len:36,dmg:15,stun:22,kb:3.5,range:48}},
  onryo:{name:'KAGE',tier:3,hp:97,speed:1.4,jump:-5.2,dj:false,w:16,h:36,
    punch:{high:true,s:4,a:3,r:10,dmg:7,reach:32,y:18,h:10,kb:2.2,stun:13,hs:4},
    kick:{s:6,a:4,r:14,dmg:9,reach:26,y:4,h:9,kb:3.0,stun:16,hs:5},
    special:{type:'phase',at:4,len:10,dur:50,spd:1.3}},
  enma:{name:'ENMA',tier:9,boss:true,hp:108,speed:1.05,jump:-4.8,dj:false,w:26,h:46,
    punch:{high:true,s:6,a:4,r:14,dmg:9,reach:33,y:18,h:14,kb:3,stun:15,hs:6},
    kick:{s:8,a:4,r:16,dmg:11,reach:32,y:3,h:10,kb:3.6,stun:18,hs:7},
    special:{type:'proj',at:12,len:36,vx:3.0,life:95,r:10,y:28,dmg:16,stun:20,kb:3.2}}
};
/* shared moves: every fighter gets the same crouch attacks, throw and super, scaled to its reach */
const THROW={s:3,a:2,r:20,dmg:12,stun:30,kb:3.4,range:10,tech:8};
const SUPER={startup:16,active:10,len:46,dmg:26,stun:30,kb:4.2,reach:36,y:6,h:28,cost:100};
const BLOCKSTUN={punch:7,kick:9,cpunch:6,sweep:10,special:10,super:16};
for(const k in CH){const c=CH[k];
  c.cpunch={s:4,a:3,r:9,dmg:5,reach:Math.round(c.punch.reach*0.82),y:7,h:10,kb:1.6,stun:12,hs:3};
  c.sweep={s:7,a:4,r:18,dmg:8,reach:c.kick.reach+2,y:0,h:6,kb:1.2,stun:26,hs:6,low:true,kd:true};}
const EV=['round','fight','hit','block','special','clash','ko','time','win','swing','draw','jump2','blink','counter','phase','tech','super','dash','throw','gbreak'];
const SC=['vs','intro','fight','ko','matchEnd'];
const ST=['idle','walk','jump','punch','kick','special','hurt','block','ko','win','crouch','throw','grabbed','super','dash'];
const FEE_BPS=500,SEASON_BPS=100,AIRDROP_BPS=50; // 5% fee: 1% rank rewards, 0.5% Curse Cauldron, 3.5% ONI
function payout(stake){const pot=stake*2;const fee=Math.round(pot*FEE_BPS/10000);const season=Math.round(pot*SEASON_BPS/10000);const airdrop=Math.round(pot*AIRDROP_BPS/10000);return{pot,fee,season,airdrop,house:fee-season-airdrop,win:pot-fee};}
function mkFighter(ch,x,face,hpMul,dmul){const mhp=Math.round(CH[ch].hp*(hpMul||1));return{dmul:dmul||1,guard:0,ch,x,y:GROUND,vx:0,vy:0,face,hp:mhp,mhp,meter:0,st:'idle',t:0,stun:0,hitDone:false,air:false,dj:false,combo:0,flash:0,prev:0,taken:0,phase:0,landT:0,gl:false,crouch:false,inp:0,tapF:0,tapB:0,inv:0,grab:0,atk:'punch',over:false};}
function choosePal(kits,pref){const a=pref&&pref[0]!=null?(pref[0]|0):0,b=pref&&pref[1]!=null?(pref[1]|0):1;const p=[kits[0]==='oni'?a:0,kits[1]==='oni'?b:0];if(kits[0]===kits[1]&&p[0]===p[1])p[1]=p[0]===0?1:0;return p;}
function mkMatch(mode,stake,kits,map,fmt){
  kits=kits||['oni','oni'];fmt=fmt||{};const skins=fmt.skins||[null,null];const need=fmt.need||2,hpMul=fmt.hpMul||1;const mods=fmt.mods||[{hp:1,dmg:1},{hp:1,dmg:1}];const pal=choosePal(kits,fmt.pal);
  return{id:Math.floor(Math.random()*1e9),mode,stake:stake||0,kits,skins,pal,mods,map:map||0,need,hpMul,scene:'vs',sceneT:0,round:1,wins:[0,0],timer:60*60,
    f:[mkFighter(kits[0],96,1,hpMul*mods[0].hp,mods[0].dmg),mkFighter(kits[1],224,-1,hpMul*mods[1].hp,mods[1].dmg)],proj:[],events:[],evId:0,hitstop:0,slow:0,winner:-1,perfect:false,seq:0};
}
function applySkins(m){if(m.skins)m.f.forEach((f,i)=>{f.skin=m.skins[i]||null;});}
function ev(m,type,x,y,a){m.evId++;m.events.push({id:m.evId,type,x:x|0,y:y|0,a:a||0});if(m.events.length>12)m.events.shift();}
function resetRound(m){
  const keep=[m.f[0].meter,m.f[1].meter];
  const md=m.mods||[{hp:1,dmg:1},{hp:1,dmg:1}];m.f=[mkFighter(m.kits[0],96,1,m.hpMul*md[0].hp,md[0].dmg),mkFighter(m.kits[1],224,-1,m.hpMul*md[1].hp,md[1].dmg)];m.f[0].meter=keep[0];m.f[1].meter=keep[1];
  m.proj=[];m.timer=60*60;m.scene='intro';m.sceneT=0;m.winner=-1;m.perfect=false;applySkins(m);
}
function step(m,inp){
  m.seq++;
  if(m.hitstop>0){m.hitstop--;return;}
  m.sceneT++;
  switch(m.scene){
    case 'vs': if(m.sceneT===1)applySkins(m);if(m.sceneT>=150){m.scene='intro';m.sceneT=0;} break;
    case 'intro':
      if(m.sceneT===2)ev(m,'round',160,70,m.round);
      if(m.sceneT===72)ev(m,'fight',160,70);
      physics(m,[0,0],true);
      if(m.sceneT>=112){m.scene='fight';m.sceneT=0;}
      break;
    case 'fight': if(m.mode!=='training')m.timer--;physics(m,inp,false);if(m.scene==='fight'&&m.timer<=0)timeUp(m);break;
    case 'ko': physics(m,[0,0],true);if(m.sceneT>=160)afterKO(m);break;
    case 'matchEnd': physics(m,[0,0],true);break;
  }
}
const hpPct=f=>f.hp/(f.mhp||CH[f.ch].hp);
function timeUp(m){
  const a=hpPct(m.f[0]),b=hpPct(m.f[1]);m.scene='ko';m.sceneT=0;
  if(Math.abs(a-b)<1e-9){m.winner=-1;ev(m,'draw',160,70);return;}
  const w=a>b?0:1;m.winner=w;m.wins[w]++;m.perfect=false;ev(m,'time',160,70);
}
function ko(m,w){
  const l=m.f[1-w];m.scene='ko';m.sceneT=0;m.winner=w;m.wins[w]++;m.slow=70;m.perfect=m.f[w].taken===0;
  l.st='ko';l.air=true;l.vy=-3.2;l.vx=-l.face*1.8;l.stun=0;l.phase=0;ev(m,'ko',l.x,l.y-20,w);
}
function afterKO(m){
  if(m.winner>=0&&m.wins[m.winner]>=(m.need||2)){m.scene='matchEnd';m.sceneT=0;const wf=m.f[m.winner];wf.st='win';wf.t=0;ev(m,'win',wf.x,wf.y);}
  else{m.round++;resetRound(m);}
}
function box(f){const c=CH[f.ch];const h=c.h*GEO*(f.crouch&&!f.air?0.62:1);return{x1:f.x-c.w*GEO/2,x2:f.x+c.w*GEO/2,y1:f.y-h,y2:f.y};}
function overlap(a,b){return a.x1<b.x2&&a.x2>b.x1&&a.y1<b.y2&&a.y2>b.y1;}
function atkData(f){const c=CH[f.ch];return c[f.atk]||c.punch;}
function startAtk(m,f,kind){f.atk=kind;f.st=(kind==='cpunch'||kind==='punch')?'punch':'kick';f.crouch=!f.air&&(kind==='cpunch'||kind==='sweep');f.over=f.air;f.t=0;f.hitDone=false;if(!f.air)f.vx=0;ev(m,'swing',f.x,f.y-20,f.st==='kick'?1:0);}
function attacking(f){return f.st==='punch'||f.st==='kick'||f.st==='super'||f.st==='throw'||(f.st==='special'&&['proj','staff','dive'].includes(CH[f.ch].special.type));}
function physics(m,inp,noInput){
  const faceTo=[m.f[1].x>m.f[0].x?1:-1,m.f[0].x>m.f[1].x?1:-1];const pre=[];
  for(let i=0;i<2;i++){
    const f=m.f[i],o=m.f[1-i],c=CH[f.ch];const b=noInput?0:(inp[i]|0);const edge=b&~f.prev;f.inp=b;
    if(f.flash>0)f.flash--;if(f.phase>0)f.phase--;if(f.inv>0)f.inv--;f.gT=(f.st==='block')?0:(f.gT||0)+1;if(f.gT>45&&f.guard>0)f.guard=Math.max(0,f.guard-1.2);if(f.tapF>0)f.tapF--;if(f.tapB>0)f.tapB--;
    f.gl=!!c.glide&&!!(b&IN.U);
    const throwIn=(edge&IN.T)||(((edge&IN.P)||(edge&IN.K))&&(b&IN.P)&&(b&IN.K));
    if(f.st==='ko'||f.st==='win'){f.t++;}
    else if(f.st==='grabbed'){
      f.grab--;f.vx=0;
      if(throwIn){f.st='idle';f.grab=0;o.st='idle';o.t=0;f.vx=-f.face*3;o.vx=-o.face*3;ev(m,'tech',(f.x+o.x)/2,f.y-22);}
      else if(f.grab<=0){o.st='idle';o.t=0;pre.push({ai:1-i,dmg:THROW.dmg,stun:THROW.stun,kb:THROW.kb,hs:8,blockable:false,heavy:true,hx:f.x,hy:f.y-20*GEO,kd:true,thr:true});}
    }
    else if(f.stun>0){f.stun--;if(f.st!=='block')f.st='hurt';if(f.stun===0){f.st=f.air?'jump':'idle';f.combo=0;f.crouch=false;}}
    else if(f.st==='throw'){f.t++;if(o.st!=='grabbed'&&f.t>=THROW.s+THROW.a+THROW.r){f.st='idle';f.t=0;}}
    else if(f.st==='super'){f.t++;
      if(f.t===SUPER.startup){f.vx=f.face*5;}if(f.t>SUPER.startup+SUPER.active)f.vx*=0.7;
      if(f.t>=SUPER.len){f.st='idle';f.t=0;}}
    else if(f.st==='dash'){f.t++;if(f.t>=10){f.st='idle';f.t=0;}}
    else if(f.st==='punch'||f.st==='kick'){f.t++;const a=atkData(f);if(f.t>=a.s+a.a+a.r){f.st=f.air?'jump':'idle';f.t=0;f.crouch=false;f.over=false;}}
    else if(f.st==='special'){
      f.t++;const sp=c.special;let done=f.t>=sp.len;
      if(sp.type==='proj'&&f.t===sp.at)m.proj.push({x:f.x+f.face*14*GEO,y:f.y-sp.y*GEO,vx:f.face*sp.vx,owner:i,life:sp.life,r:sp.r*GEO,kit:f.ch});
      else if(sp.type==='blink'&&f.t===sp.at){const from=f.x;let nx=o.x-o.face*sp.dist*GEO;if(nx<LEFT||nx>RIGHT)nx=o.x+o.face*sp.dist*GEO;f.x=Math.max(LEFT,Math.min(RIGHT,nx));f.face=o.x>f.x?1:-1;ev(m,'blink',from,f.y-18,i);}
      else if(sp.type==='dive'){
        if(f.t===1){f.air=true;f.vy=-4.6;f.vx=0;}
        if(f.t===sp.at){f.face=o.x>f.x?1:-1;f.vx=f.face*sp.vx;f.vy=sp.vy;}
        if(f.t>sp.at&&!f.air){if(!f.landT)f.landT=f.t;if(f.t-f.landT>=12)done=true;}
      }
      else if(sp.type==='phase'&&f.t===sp.at){f.phase=sp.dur;ev(m,'phase',f.x,f.y-18,i);}
      if(done){f.st=f.air?'jump':'idle';f.t=0;f.landT=0;}
    } else {
      if(!f.air)f.face=faceTo[i];
      const fwdB=f.face>0?IN.R:IN.L,backB=f.face>0?IN.L:IN.R;const down=!f.air&&!!(b&IN.D);
      let dashed=false;
      if(!f.air&&!down){
        if(edge&fwdB){if(f.tapF>0){f.st='dash';f.t=0;f.vx=f.face*3.6;f.tapF=0;dashed=true;ev(m,'dash',f.x,f.y,0);}else f.tapF=12;}
        else if(edge&backB){if(f.tapB>0){f.st='dash';f.t=0;f.vx=-f.face*3.2;f.tapB=0;dashed=true;ev(m,'dash',f.x,f.y,1);}else f.tapB=12;}
      }
      if(dashed){f.crouch=false;}
      else if(throwIn&&!f.air){f.st='throw';f.t=0;f.vx=0;f.hitDone=false;f.crouch=false;ev(m,'swing',f.x,f.y-20,0);}
      else if((edge&IN.S)&&!f.air&&down&&f.meter>=SUPER.cost){f.st='super';f.t=0;f.vx=0;f.meter-=SUPER.cost;f.inv=SUPER.startup;f.hitDone=false;f.crouch=false;ev(m,'super',f.x,f.y-24,i);}
      else if(edge&IN.P)startAtk(m,f,down?'cpunch':'punch');
      else if(edge&IN.K)startAtk(m,f,down?'sweep':'kick');
      else if((edge&IN.S)&&f.meter>=50&&!f.air){f.st='special';f.t=0;f.vx=0;f.hitDone=false;f.crouch=false;f.meter-=50;ev(m,'special',f.x,f.y-24,KITS.indexOf(f.ch)*2+i);}
      else{
        const projNear=m.proj.some(p=>p.owner!==i&&Math.sign(f.x-p.x)===Math.sign(p.vx)&&Math.abs(f.x-p.x)<90*GEO);
        const threat=(attacking(o)&&Math.abs(o.x-f.x)<120*GEO)||projNear;
        if(!f.air&&(b&backB)&&threat){f.st='block';f.crouch=down;f.vx=0;}
        else if(down){f.st='crouch';f.crouch=true;f.vx=0;}
        else{
          f.crouch=false;
          const dir=((b&IN.R)?1:0)-((b&IN.L)?1:0);const spd=c.speed*(f.phase>0?c.special.spd||1:1)*(dir===-f.face?0.85:1);
          if(!f.air){f.vx=dir*spd;f.st=dir?'walk':'idle';if(b&IN.U){f.vy=c.jump;f.air=true;f.dj=false;f.st='jump';f.vx=dir*c.speed*1.15;}}
          else if(c.dj&&!f.dj&&(edge&IN.U)){f.dj=true;f.vy=c.jump*0.85;if(dir)f.vx=dir*c.speed*1.1;ev(m,'jump2',f.x,f.y);}
        }
        f.t++;
      }
    }
    f.prev=b;
  }
  for(let i=0;i<2;i++){const f=m.f[i];
    if(f.st==='grabbed'){const o=m.f[1-i];f.x=o.x+o.face*((CH[o.ch].w+CH[f.ch].w)/2)*GEO*0.9;}
    f.x+=f.vx;
    if(f.air){f.vy+=0.28;if(f.gl&&f.vy>0.7&&f.st!=='special')f.vy=0.7;f.y+=f.vy;if(f.y>=GROUND){f.y=GROUND;f.vy=0;f.air=false;f.dj=false;f.over=false;if(f.st==='jump')f.st='idle';if(f.st==='ko')f.vx=0;}}
    if(!f.air&&f.st!=='dash'&&f.st!=='super'&&f.st!=='walk'&&f.st!=='idle')f.vx*=0.8;
    if(f.x<LEFT)f.x=LEFT;if(f.x>RIGHT)f.x=RIGHT;
  }
  const A=m.f[0],B=m.f[1];const minD=((CH[A.ch].w+CH[B.ch].w)/2-4)*GEO;const dx=B.x-A.x;
  if(Math.abs(dx)<minD&&Math.abs(A.y-B.y)<26*GEO&&A.st!=='ko'&&B.st!=='ko'&&A.phase<=0&&B.phase<=0&&A.st!=='grabbed'&&B.st!=='grabbed'){
    const push=(minD-Math.abs(dx))/2*(dx>0?1:dx<0?-1:A.face);A.x-=push;B.x+=push;
    for(const f of m.f){if(f.x<LEFT)f.x=LEFT;if(f.x>RIGHT)f.x=RIGHT;}
  }
  const hits=pre;
  for(let i=0;i<2;i++){
    const f=m.f[i],o=m.f[1-i],c=CH[f.ch];if(o.st==='ko'||o.phase>0)continue;
    const inv=o.inv>0;
    if(f.st==='throw'&&!f.hitDone&&f.t>THROW.s&&f.t<=THROW.s+THROW.a){
      const reach=((c.w+CH[o.ch].w)/2)*GEO+THROW.range;
      if(!o.air&&!inv&&o.stun<=0&&['idle','walk','crouch','block','dash'].includes(o.st)&&Math.abs(o.x-f.x)<=reach){
        f.hitDone=true;o.st='grabbed';o.grab=THROW.tech;o.crouch=false;o.vx=0;f.t=THROW.s+THROW.a;ev(m,'throw',(f.x+o.x)/2,f.y-22,i);
      } else if(o.st==='throw'&&o.t<=THROW.s+THROW.a&&Math.abs(o.x-f.x)<=reach&&i===0){
        f.hitDone=true;o.hitDone=true;f.st='idle';o.st='idle';f.vx=-f.face*3;o.vx=-o.face*3;ev(m,'tech',(f.x+o.x)/2,f.y-22);
      }
    }
    if(inv)continue;
    if(f.st==='special'&&c.special.type==='dive'&&f.t>c.special.at&&f.air&&!f.hitDone&&overlap(box(f),box(o))){f.hitDone=true;const sp=c.special;hits.push({ai:i,dmg:sp.dmg,stun:sp.stun,kb:sp.kb,hs:6,blockable:true,heavy:true,hx:(f.x+o.x)/2,hy:f.y-18*GEO,over:true,bs:BLOCKSTUN.special});}
    if((f.st==='punch'||f.st==='kick')&&!f.hitDone){const a=atkData(f);
      if(f.t>a.s&&f.t<=a.s+a.a){
        const R=a.reach*GEO;const hb={x1:Math.min(f.x+f.face*4*GEO,f.x+f.face*R),x2:Math.max(f.x+f.face*4*GEO,f.x+f.face*R),y1:f.y-(a.y+a.h)*GEO,y2:f.y-a.y*GEO};
        if(a.high&&o.crouch&&!o.air&&f.atk==='punch'){}
        else if(overlap(hb,box(o))){f.hitDone=true;hits.push({ai:i,dmg:a.dmg,stun:a.stun,kb:a.kb,hs:a.hs,blockable:true,heavy:f.st==='kick',hx:f.x+f.face*(Math.min(R,Math.abs(o.x-f.x))-4),hy:f.y-(a.y+a.h/2)*GEO,low:!!a.low,over:f.over,kd:!!a.kd,bs:BLOCKSTUN[f.atk]||7});}
      }}
    if(f.st==='super'&&!f.hitDone&&f.t>SUPER.startup&&f.t<=SUPER.startup+SUPER.active){
      const R=SUPER.reach*GEO;const hb={x1:Math.min(f.x-f.face*6,f.x+f.face*R),x2:Math.max(f.x-f.face*6,f.x+f.face*R),y1:f.y-(SUPER.y+SUPER.h)*GEO,y2:f.y-SUPER.y*GEO};
      if(overlap(hb,box(o))){f.hitDone=true;hits.push({ai:i,dmg:SUPER.dmg,stun:SUPER.stun,kb:SUPER.kb,hs:12,blockable:true,heavy:true,hx:o.x-f.face*6,hy:f.y-20*GEO,sup:true,bs:BLOCKSTUN.super});}
    }
    if(f.st==='special'&&c.special.type==='staff'&&!f.hitDone){const sp=c.special;
      if(f.t>sp.at&&f.t<=sp.at+sp.act){
        const hb={x1:Math.min(f.x+f.face*6*GEO,f.x+f.face*sp.reach*GEO),x2:Math.max(f.x+f.face*6*GEO,f.x+f.face*sp.reach*GEO),y1:f.y-(sp.y+sp.h)*GEO,y2:f.y-sp.y*GEO};
        if(overlap(hb,box(o))){f.hitDone=true;hits.push({ai:i,dmg:sp.dmg,stun:sp.stun,kb:sp.kb,hs:6,blockable:true,heavy:true,hx:o.x-f.face*6,hy:f.y-(sp.y+3)*GEO,bs:BLOCKSTUN.special});}
      }}
  }
  for(const p of m.proj){p.x+=p.vx;p.life--;}
  for(let a=0;a<m.proj.length;a++)for(let q=a+1;q<m.proj.length;q++){
    const p=m.proj[a],r=m.proj[q];
    if(p.owner!==r.owner&&p.life>0&&r.life>0&&Math.abs(p.x-r.x)<p.r+r.r&&Math.abs(p.y-r.y)<p.r+r.r+4){p.life=0;r.life=0;ev(m,'clash',(p.x+r.x)/2,(p.y+r.y)/2);}
  }
  for(const p of m.proj){
    if(p.life<=0)continue;const o=m.f[1-p.owner];const sp=CH[p.kit].special;
    if(o.st!=='ko'&&o.phase<=0&&o.inv<=0&&overlap({x1:p.x-p.r,x2:p.x+p.r,y1:p.y-p.r,y2:p.y+p.r},box(o))){p.life=0;hits.push({ai:p.owner,dmg:sp.dmg,stun:sp.stun,kb:sp.kb,hs:6,blockable:true,heavy:true,hx:p.x,hy:p.y,bs:BLOCKSTUN.special});}
    if(p.x<-12||p.x>W+12)p.life=0;
  }
  m.proj=m.proj.filter(p=>p.life>0);
  if(hits.length){
    const guards=[0,1].map(k=>{const d=m.f[k];const backB=d.face>0?IN.L:IN.R;
      return{ok:!d.air&&['idle','walk','crouch','block'].includes(d.st)&&!!(d.inp&backB),crouch:!!(d.inp&IN.D)};});
    const stunned=[m.f[0].stun>0&&m.f[0].st==='hurt',m.f[1].stun>0&&m.f[1].st==='hurt'];
    for(const h of hits)applyHit(m,guards,stunned,h);
    if(m.mode==='training'){for(const f of m.f)if(f.hp<1)f.hp=1;}
    else if(m.scene==='fight'){
      const d0=m.f[0].hp<=0,d1=m.f[1].hp<=0;
      if(d0&&d1){m.scene='ko';m.sceneT=0;m.winner=-1;m.slow=70;for(const f of m.f){f.st='ko';f.air=true;f.vy=-3;f.vx=-f.face*1.5;f.stun=0;}ev(m,'draw',160,70);}
      else if(d1)ko(m,0);else if(d0)ko(m,1);
    }
  }
}
function applyHit(m,guards,stunned,h){
  const ai=h.ai,f=m.f[ai],o=m.f[1-ai],oi=1-ai;const facingAtk=o.face===(f.x>o.x?1:-1);
  const oc=CH[o.ch].special;
  if(!h.thr&&o.st==='special'&&oc.type==='counter'&&o.t>=oc.from&&o.t<=oc.to){
    ev(m,'counter',o.x,o.y-20,oi);o.st='idle';o.t=0;o.meter=Math.min(100,o.meter+10);m.hitstop=Math.max(m.hitstop,8);
    if(Math.abs(o.x-f.x)<=oc.range*GEO&&f.phase<=0&&f.st!=='ko'){
      f.hp=Math.max(0,f.hp-oc.dmg);f.taken+=oc.dmg;f.st='hurt';f.stun=oc.stun;f.t=0;f.vx=(f.x>o.x?1:-1)*oc.kb;f.flash=6;if(f.air)f.vy=Math.min(f.vy,-2.4);
      ev(m,'hit',f.x,f.y-20,3);
    }
    return;
  }
  const g=guards[oi];const heightOk=!(h.low&&!g.crouch)&&!(h.over&&g.crouch);
  if(h.blockable&&g.ok&&facingAtk&&heightOk){
    const dmg=h.dmg*(f.dmul||1);const chip=Math.ceil(dmg*(h.sup?0.3:0.25));o.hp=Math.max(0,o.hp-chip);o.taken+=chip;o.vx=(o.x>f.x?1:-1)*1.3;o.stun=h.bs||7;o.st='block';o.crouch=g.crouch;
    o.guard+=dmg*2.2;m.hitstop=Math.max(m.hitstop,2);f.meter=Math.min(100,f.meter+3);
    if(o.guard>=100){o.guard=0;o.st='hurt';o.stun=42;o.crouch=false;o.flash=8;m.hitstop=Math.max(m.hitstop,10);ev(m,'gbreak',o.x,o.y-26);}
    else ev(m,'block',h.hx,h.hy);
  } else {
    const hd=Math.round(h.dmg*(f.dmul||1));o.hp=Math.max(0,o.hp-hd);o.taken+=hd;o.guard=Math.max(0,o.guard-20);o.st='hurt';o.stun=h.stun;o.t=0;o.vx=(o.x>f.x?1:-1)*h.kb;o.flash=6;o.crouch=false;
    if(o.air)o.vy=Math.min(o.vy,-2.4);else if(h.kd){o.air=true;o.vy=-2.2;}
    f.combo=stunned[oi]?f.combo+1:1;f.meter=Math.min(100,f.meter+(h.sup?0:10));o.meter=Math.min(100,o.meter+5);
    m.hitstop=Math.max(m.hitstop,h.hs);ev(m,'hit',h.hx,h.hy,f.combo*2+(h.heavy?1:0));
  }
}
function cpuInput(m,i,mem,level){
  const f=m.f[i],o=m.f[1-i],c=CH[f.ch];
  if(m.scene!=='fight')return 0;
  if(f.st==='grabbed'){return Math.random()<0.1+0.08*level?IN.T:0;}
  if(f.stun>0){mem.q=null;return 0;}
  if(mem.q&&mem.q.length)return mem.q.shift();
  if(mem.gap){mem.gap=false;return 0;}
  if(mem.hold>0){mem.hold--;if(mem.hold===0)mem.gap=true;return mem.bits;}
  const dx=o.x-f.x,dist=Math.abs(dx),toward=dx>0?IN.R:IN.L,away=dx>0?IN.L:IN.R;
  if(level<0){ // very easy (-1) and easy (-0.5): no specials, supers or throws
    const ez=level>-1,rr=Math.random(),reach=CH[f.ch].punch.reach*GEO-4;
    if(ez&&attacking(o)&&dist<reach+14&&rr<0.55){mem.hold=10;mem.bits=away;return away;}
    if(dist<reach&&rr<(ez?0.62:0.18)){const k=ez&&Math.random()<0.5?IN.K:IN.P;mem.hold=3;mem.bits=k;return k;}
    if(rr<(ez?0.2:0.5)){mem.hold=ez?8:22;mem.bits=0;return 0;}
    if(dist>reach){mem.hold=ez?6:8;mem.bits=toward;return toward;}
    mem.hold=10;mem.bits=0;return 0;}
  const r=Math.random(),react=0.3+0.13*level;let bits=0,hold=6;
  const range=Math.max(c.punch.reach,c.kick.reach)*GEO-5;const oRange=Math.max(CH[o.ch].punch.reach,CH[o.ch].kick.reach+2,SUPER.reach)*GEO;
  const close=dist<((c.w+CH[o.ch].w)/2)*GEO+THROW.range-2;
  const sp=c.special,T=sp.type,has=f.meter>=50;
  const spOk=has&&(T==='staff'?dist>44*GEO&&dist<(sp.reach-10)*GEO:T==='proj'?dist>(sp.life<60?30:70)*GEO&&dist<(sp.life<60?90*GEO:999):T==='blink'?dist>55*GEO:T==='dive'?dist>40*GEO&&dist<140*GEO:false);
  const pr=m.proj.find(p=>p.owner!==i&&Math.sign(f.x-p.x)===Math.sign(p.vx)&&Math.abs(f.x-p.x)<75*GEO);
  const threat=attacking(o)&&o.st!=='throw'&&dist<oRange+8;
  const oLow=(o.st==='kick'&&o.atk==='sweep'),oOver=o.air&&(o.st==='punch'||o.st==='kick');
  if(has&&(T==='counter'||T==='phase')&&(threat||(pr&&Math.abs(f.x-pr.x)<40*GEO))&&r<react+0.1){bits=IN.S;hold=2;}
  else if(pr&&r<react+0.25){bits=Math.random()<0.55?away:(IN.U|toward);hold=14;}
  else if(threat&&r<react){bits=away|(oLow||(!oOver&&Math.random()<0.4)?IN.D:0);if(oOver)bits=away;hold=10;}
  else if(o.st==='throw'&&close&&r<react*0.6){bits=IN.T;hold=2;}
  else if(close&&(o.st==='block'||o.st==='crouch'||mem.blocks>1)&&r<0.3+0.08*level){bits=IN.T;hold=2;mem.blocks=0;}
  else if(f.meter>=SUPER.cost&&dist<SUPER.reach*GEO+10&&r<0.3){mem.q=[IN.D,IN.D|IN.S,IN.D|IN.S];bits=0;hold=1;}
  else if(dist<range){const x=Math.random();
    bits=x<0.3?(o.crouch?IN.K:IN.P):x<0.52?IN.K:x<0.66?(IN.D|IN.P):x<0.8?(IN.D|IN.K):x<0.9?away:(IN.U|toward);hold=3;}
  else if(spOk&&r<0.22+0.05*level){bits=IN.S;hold=2;}
  else if(r<0.05&&dist>range+20){mem.q=[toward,0,toward,toward,toward,toward];bits=0;hold=1;}
  else if(r<0.08){bits=IN.U|toward;hold=c.glide?9:4;mem.jumpAtk=true;}
  else if(r<0.12+0.04*(3-level)){bits=0;hold=10;}
  else{bits=toward;hold=6+Math.floor(Math.random()*10);}
  if(o.st==='block')mem.blocks=(mem.blocks||0)+1;
  if(f.air&&mem.jumpAtk&&dist<range+10){mem.jumpAtk=false;bits=Math.random()<0.5?IN.K:IN.P;hold=2;}
  mem.bits=bits;mem.hold=hold;return bits;
}
function pack(m){
  const r=v=>Math.round(v*10);
  return{q:m.seq,id:m.id,sn:m.skins,md:m.mods,pl:m.pal,nd:m.need,hm:m.hpMul,sk:m.stake,k:m.kits.map(k=>KITS.indexOf(k)),mp:m.map,sc:SC.indexOf(m.scene),t:m.sceneT,rn:m.round,tm:m.timer,w:m.wins,wi:m.winner,pf:m.perfect?1:0,
    f:m.f.map(f=>[r(f.x),r(f.y),f.face,f.hp,f.meter,ST.indexOf(f.st),f.t,f.flash,f.combo,f.phase,f.crouch?1:0,['punch','kick','cpunch','sweep'].indexOf(f.atk)]),
    p:m.proj.map(p=>[p.owner,r(p.x),r(p.y),p.vx>0?1:-1,KITS.indexOf(p.kit),p.r]),
    e:m.events.map(e=>[e.id,EV.indexOf(e.type),e.x,e.y,e.a])};
}
function unpack(s){
  const kits=s.k.map(i=>KITS[i]);
  return{id:s.id,skins:s.sn||[null,null],mods:s.md,pal:s.pl||[0,1],need:s.nd||2,hpMul:s.hm||1,stake:s.sk||0,kits,map:s.mp|0,seq:s.q,scene:SC[s.sc],sceneT:s.t,round:s.rn,timer:s.tm,wins:s.w,winner:s.wi,perfect:!!s.pf,hitstop:0,slow:0,
    f:s.f.map((a,i)=>({ch:kits[i],x:a[0]/10,y:a[1]/10,face:a[2],hp:a[3],meter:a[4],st:ST[a[5]]||'idle',t:a[6],flash:a[7],combo:a[8],phase:a[9]|0,crouch:!!a[10],atk:['punch','kick','cpunch','sweep'][a[11]|0]||'punch',mhp:Math.round(CH[kits[i]].hp*(s.hm||1)),air:a[1]/10<GROUND-0.5})),
    proj:s.p.map(a=>({owner:a[0],x:a[1]/10,y:a[2]/10,vx:a[3],kit:KITS[a[4]],r:a[5]})),
    events:s.e.map(a=>({id:a[0],type:EV[a[1]],x:a[2],y:a[3],a:a[4]}))};
}
function withSkins(u){if(u.skins)u.f.forEach((f,i)=>{f.skin=u.skins[i]||null;});return u;}

/* ===== match proof and replay: the same code runs in the game and on the server ===== */
function encodeLog(log){let s='';for(const v of log)s+=(v&0xFFFF).toString(16).padStart(4,'0');return s;}
function decodeLog(s){const out=[];for(let i=0;i+4<=s.length;i+=4)out.push(parseInt(s.slice(i,i+4),16));return out;}
function matchProof(m){return{v:1,kits:m.kits,map:m.map,stake:m.stake,need:m.need,hpMul:m.hpMul,mods:m.mods,winner:m.winner,frames:(m.log||[]).length,log:encodeLog(m.log||[])};}
function replayMatch(p){
  if(!p||!Array.isArray(p.kits)||p.kits.length!==2||!p.kits.every(k=>CH[k]))return{ok:false,error:'bad_kits'};
  const L=decodeLog(String(p.log||''));if(!L.length||L.length>60*60*20)return{ok:false,error:'bad_log'};
  const m=mkMatch('replay',p.stake|0,p.kits,p.map|0,{need:p.need||2,hpMul:p.hpMul||1,mods:p.mods});
  let i=0;for(;i<L.length&&m.scene!=='matchEnd';i++){step(m,[L[i]&255,(L[i]>>8)&255]);if(m.slow>0)m.slow--;}
  return{ok:m.scene==='matchEnd',winner:m.winner,frames:i,wins:m.wins,hp:[m.f[0].hp,m.f[1].hp]};}
if(typeof module!=='undefined')module.exports={THROW,SUPER,choosePal,mkMatch,step,cpuInput,pack,unpack,payout,IN,CH,KITS,GEO,encodeLog,decodeLog,matchProof,replayMatch};
