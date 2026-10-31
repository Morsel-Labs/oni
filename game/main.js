/* ===================== RENDER PRIMITIVES ===================== */
const cv=document.getElementById('cv');let ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
/* Fight camera (touch layouts): the fight is rendered into a 960x540 buffer, then the display canvas (#cv) shows a
   zoomed, fighter-following window of it with the HUD re-laid out in bands. Off on desktop: render goes straight to #cv. */
const CAM={on:false,el:cv,ectx:ctx,buf:null,bctx:null,ph:180,s:1,x:0,y:0,grabbed:false,init:false};
function camBuf(){if(!CAM.buf){CAM.buf=document.createElement('canvas');CAM.buf.width=960;CAM.buf.height=540;CAM.bctx=CAM.buf.getContext('2d');}return CAM.bctx;}
let G=ctx;const FONT='"Press Start 2P", monospace';
function rect(x,y,w,h,c){G.fillStyle=c;G.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function px(x,y,c){G.fillStyle=c;G.fillRect(Math.round(x),Math.round(y),1,1);}
function ell(cx,cy,rx,ry,c){G.fillStyle=c;cx=Math.round(cx);cy=Math.round(cy);for(let dy=-ry;dy<=ry;dy++){const w=Math.round(rx*Math.sqrt(Math.max(0,1-(dy*dy)/((ry+0.5)*(ry+0.5)))));G.fillRect(cx-w,cy+dy,w*2+1,1);}}
function disc(cx,cy,r,c){ell(cx,cy,r,r,c);}

const COM={eye:'#FFB000',eyeHi:'#FFF2A8',mouth:'#2A0505',fang:'#FFFFFF',hair:'#121218',horn:'#EAD9B0',hornD:'#A8946A',
  gi:'#343B4E',giD:'#20242F',giL:'#6B7593',pant:'#262A36',pantD:'#161920',sandal:'#6B4226',hand:'#8A5A3A',
  blade:'#DDE3EE',bladeD:'#8C95A6',hilt:'#3A1A12',guard:'#C9A227',swoosh:'rgba(255,255,255,.6)',claw:'#F3E9E4'};
const PAL={
  oni:[{face:'#D7262E',faceD:'#8E1015',faceL:'#FF6B5E',belt:'#C1121F',beltD:'#7A0A12',flame:['#FFF2A8','#FFB000','#FF6A00','#C1121F'],main:'#D7262E',name:'#FF8A80'},
       {face:'#2F6FE0',faceD:'#173E8A',faceL:'#7FB0FF',belt:'#2EC4B6',beltD:'#16746B',flame:['#E6FFFF','#7FE7FF','#2EC4B6','#1B5FD1'],main:'#2F6FE0',name:'#8FB8FF'},
       {face:'#FFC93A',faceD:'#C88A00',faceL:'#FFF4B0',belt:'#FFD86A',beltD:'#A87000',gi:'#1E1A14',giD:'#14110C',giL:'#FFB000',pant:'#221D16',pantD:'#15120D',blade:'#FFF4C8',bladeD:'#E0B040',flame:['#FFFFFF','#FFF2A8','#FFC93A','#C88A00'],main:'#FFC93A',name:'#FFD86A'},
       {face:'#CFF6FF',faceD:'#7FD8F0',faceL:'#FFFFFF',belt:'#BFFFF8',beltD:'#2EC4B6',gi:'#D8E6F2',giD:'#9AB4CC',giL:'#FFFFFF',pant:'#C8DAEA',pantD:'#8AA6C2',hair:'#B8CCE0',blade:'#E6FFFF',bladeD:'#7FE7FF',flame:['#FFFFFF','#E6FFFF','#7FE7FF','#2EC4B6'],main:'#9FE8FF',name:'#CFF6FF'},
       {face:'#2A1418',faceD:'#1A0A0E',faceL:'#6A2A30',belt:'#FF3B30',beltD:'#8E1015',gi:'#1E1418',giD:'#140C10',giL:'#FF3B30',pant:'#1E1418',pantD:'#140C10',blade:'#FFD0C8',bladeD:'#FF3B30',flame:['#FFE0D0','#FF8A5A','#FF3B30','#8E1015'],main:'#FF3B30',name:'#FF8A7A'}],
  saru:[{fur:'#C98A2E',furD:'#8A5A1A',furL:'#F0C060',face:'#E8C9A0',band:'#C1121F',bandL:'#FF4A55',vest:'#7A0A12',vestD:'#4A060B',staff:'#6B3A1A',staffD:'#40210E',cap:'#FFB000',main:'#E0A030',name:'#F0C060'},
        {fur:'#6A4A3A',furD:'#3E2A20',furL:'#9A7A5A',face:'#D8B890',band:'#2EC4B6',bandL:'#8FF0E6',vest:'#1B3A5A',vestD:'#0E2238',staff:'#3A2A22',staffD:'#221812',cap:'#DDE3EE',main:'#9A7A5A',name:'#D8B890'}],
  ryu:[{body:'#2E9E4F',bodyD:'#1B6B33',bodyL:'#6BD88A',belly:'#E8D9A0',mane:'#C1121F',maneD:'#7A0A12',horn:'#FFB000',breath:['#F0FFE0','#9BF07A','#2E9E4F','#145A2A'],main:'#2E9E4F',name:'#8BE0A0'},
       {body:'#1F5F5A',bodyD:'#123B38',bodyL:'#4FA59C',belly:'#D9D0B8',mane:'#6B2FA0',maneD:'#3E1560',horn:'#DDE3EE',breath:['#F4E6FF','#C49BFF','#6B2FA0','#2A0F45'],main:'#3F9A92',name:'#9FE0D8'}],
  kitsune:[{fur:'#E8A040',furD:'#A86A20',furL:'#FFD890',mark:'#C1121F',robe:'#F3E9E4',robeD:'#C8C0B8',hakama:'#C1121F',hakamaD:'#7A0A12',fire:'#7FE7FF',main:'#E8A040',name:'#FFD890'},
           {fur:'#F4F0EA',furD:'#B8B2A8',furL:'#FFFFFF',mark:'#9B59D0',robe:'#2A2440',robeD:'#1A1628',hakama:'#4A2A7A',hakamaD:'#2A1848',fire:'#C49BFF',main:'#C8C0E0',name:'#E6DCFF'}],
  tengu:[{feather:'#1C1C26',featherD:'#0E0E14',featherL:'#4A4A62',robe:'#E8E4D8',robeD:'#B0A898',pom:'#C1121F',beak:'#F0B030',beakD:'#A87010',leaf:'#3E8A3A',leafD:'#245A22',main:'#6A6A88',name:'#C8C8E0'},
         {feather:'#D8D8E0',featherD:'#9A9AA8',featherL:'#FFFFFF',robe:'#2A2A36',robeD:'#18181F',pom:'#2EC4B6',beak:'#E08A30',beakD:'#A05A10',leaf:'#8A3A8A',leafD:'#5A1A5A',main:'#B8B8C8',name:'#F0F0FF'}],
  kappa:[{skin:'#5FA85A',skinD:'#3A7A3A',skinL:'#9AD88A',shell:'#7A6530',shellD:'#4A3A18',shellL:'#A8904A',belly:'#E0D8A8',beak:'#E0B040',dish:'#9ADFE8',hair:'#1E3A1E',water:'#7FE7FF',main:'#5FA85A',name:'#9AD88A'},
         {skin:'#4A8AB8',skinD:'#2A5A80',skinL:'#8ABAE0',shell:'#5A3A5A',shellD:'#3A2238',shellL:'#8A6A8A',belly:'#D8D8E0',beak:'#C0C0C8',dish:'#FFD890',hair:'#1A2A3A',water:'#9BF07A',main:'#4A8AB8',name:'#8ABAE0'}],
  enma:[{robe:'#8E1015',robeD:'#5A0A0E',robeL:'#C1121F',inner:'#F3E9E4',skin:'#D7262E',skinD:'#8E1015',beard:'#121218',crown:'#16161C',gold:'#FFB000',club:'#2A2A34',stud:'#9AA0B0',hilt:'#5A3A1A',main:'#C1121F',name:'#FF8A80',flame:['#FFF2A8','#FFB000','#FF6A00','#8E1015']},
        {robe:'#3A1560',robeD:'#1E0A36',robeL:'#6B2FA0',inner:'#E8DCFF',skin:'#2F6FE0',skinD:'#173E8A',beard:'#F3E9E4',crown:'#0A0A12',gold:'#2EC4B6',club:'#1A1A22',stud:'#BFFFF8',hilt:'#3A2A5A',main:'#6B2FA0',name:'#C49BFF',flame:['#E6FFFF','#7FE7FF','#2EC4B6','#1B5FD1']}],
  onryo:[{robe:'#E8E8F0',robeD:'#A8A8C0',robeL:'#FFFFFF',hair:'#0A0A12',hairL:'#2A2A3A',skin:'#D8E0E8',aura:'#9B59D0',eyeR:'#FF3B30',nail:'#E8E8F0',main:'#C8C8E0',name:'#E6DCFF'},
         {robe:'#B8D8E8',robeD:'#7898A8',robeL:'#E8F8FF',hair:'#101820',hairL:'#2A3848',skin:'#C8E0E8',aura:'#2EC4B6',eyeR:'#FFB000',nail:'#E8F8FF',main:'#8AB8C8',name:'#BFFFF8'}]
};
const fname=(kit,pal,skin)=>kit==='oni'?(skin==='kin'?'KIN-ONI':skin==='kongo'?'KONGO-ONI':pal===4?'GENESIS ONI':pal?'AO ONI':'AKA ONI'):CH[kit].name;
const palOf=(m,i)=>m&&m.pal?m.pal[i]:i;

function kitTools(f,side){
  const s=f.face,x=Math.round(f.x),y=Math.round(f.y),fl=f.flash>0&&f.flash%2===0;const P=PAL[f.ch][side];
  const col=k=>fl&&k!=='swoosh'?'#FFFFFF':(P[k]||COM[k]||k);
  const R=(dx,dy,w,h,k)=>rect(s>0?x+dx:x-dx-w+1,y+dy,w,h,col(k));
  return{s,x,y,P,col,R};
}
function lineT(L,x0,y0,ax,ay,len,k,k2){for(let i=0;i<len;i++){const lx=Math.round(x0+ax*i),ly=Math.round(y0+ay*i);L(lx,ly,1,1,k);if(k2)L(lx,ly+1,1,1,k2);}}

/* ---------- ONI ---------- */
function drawOni(f,fr,side){
  const {s,x,y,P,R}=kitTools(f,side);const st=f.st;
  if(!NOSHADOW)ell(x,GROUND+1,12,2,'rgba(0,0,0,.45)');
  if(st==='ko'&&!f.air){
    R(-16,-6,22,5,'gi');R(-16,-2,22,1,'giD');R(-21,-5,5,4,'pant');R(-5,-6,2,5,'belt');
    R(6,-9,8,7,'face');R(12,-9,2,7,'faceD');R(8,-11,1,2,'horn');R(12,-11,1,2,'horn');R(14,-8,2,6,'hair');
    R(8,-6,1,1,'hair');R(11,-6,1,1,'hair');R(8,-4,4,1,'mouth');for(let k=0;k<20;k++)R(-24+k,-1,1,1,k<16?'blade':'hilt');return;
  }
  let bob=0,lean=0;if(st==='idle')bob=Math.floor(fr/20)%2;if(st==='hurt')lean=-2;if(st==='win')bob=-Math.abs(Math.round(Math.sin(fr*0.15)*3));
  const L=(dx,dy,w,h,k)=>R(dx+lean,dy+bob,w,h,k);const line=(a,b,c,d,e,k,k2)=>lineT(L,a,b,c,d,e,k,k2);
  const A=CH.oni;const wk=st==='walk'?(Math.floor(fr/7)%2?2:-2):0;
  const kick=st==='kick'&&f.t>A.kick.s-2&&f.t<=A.kick.s+A.kick.a+4;
  if(f.air&&st!=='hurt'){R(-6,-15,5,8,'pant');R(2,-15,5,8,'pant');R(-7,-8,5,2,'sandal');R(3,-8,5,2,'sandal');}
  else{R(-7+wk,-12,4,10,'pant');R(-6+wk,-12,1,10,'pantD');R(-9+wk,-2,6,2,'sandal');
    if(kick){R(2,-15,14,4,'pant');R(2,-12,14,1,'pantD');R(15,-17,3,7,'sandal');}
    else{R(3-wk,-12,4,10,'pant');R(6-wk,-12,1,10,'pantD');R(3-wk,-2,6,2,'sandal');}}
  L(-8,-17,16,6,'pant');L(4,-17,4,6,'pantD');L(-8,-26,3,8,'giD');L(-6,-27,12,11,'gi');L(2,-27,4,11,'giD');
  for(let k=0;k<5;k++){L(-2+k,-27+k,1,1,'giL');L(3-k,-27+k,1,1,'giL');}
  L(-7,-18,14,2,'belt');L(-7,-17,14,1,'beltD');L(5,-18,2,5,'belt');
  L(-1,-40,3,3,'hair');L(-5,-37,10,3,'hair');L(-6,-35,2,7,'hair');L(-4,-35,9,8,'face');L(3,-35,2,8,'faceD');L(-4,-35,3,1,'faceL');
  L(-4,-39,1,3,'horn');L(-5,-40,1,2,'horn');L(4,-39,1,3,'horn');L(5,-41,1,2,'horn');L(5,-39,1,1,'hornD');
  L(-1,-33,2,1,'faceD');L(3,-33,2,1,'faceD');L(1,-32,1,1,'faceD');
  if(st==='hurt'){L(-1,-31,2,1,'hair');L(3,-31,2,1,'hair');}else{L(0,-32,1,2,'eye');L(3,-32,1,2,'eye');L(0,-32,1,1,'eyeHi');L(3,-32,1,1,'eyeHi');}
  L(-1,-29,6,1,'mouth');L(-1,-28,1,1,'fang');L(4,-28,1,1,'fang');
  const pS=A.punch.s,pA=A.punch.a;
  if(st==='punch'&&f.t<=pS){L(-1,-36,3,3,'hand');L(-3,-38,4,2,'hilt');line(-3,-39,-0.6,-0.8,15,'blade','bladeD');}
  else if(st==='punch'&&f.t<=pS+pA+3){L(3,-26,8,3,'gi');L(10,-26,3,3,'hand');L(13,-27,1,5,'guard');line(14,-25,1,0,A.punch.reach-14,'blade','bladeD');
    for(let a=-1.3;a<=0.35;a+=0.1)L(Math.round(8+Math.cos(a)*22),Math.round(-24+Math.sin(a)*22),1,1,'swoosh');}
  else if(st==='punch'){L(5,-22,3,3,'hand');L(8,-22,3,2,'hilt');line(11,-21,0.9,0.45,16,'blade','bladeD');}
  else if(st==='block'){L(6,-29,3,3,'hand');L(7,-31,2,2,'guard');line(8,-44,0,1,13,'blade');line(9,-44,0,1,13,'bladeD');}
  else if(st==='special'){if(f.t<10){L(-10,-28,3,3,'hand');disc(s>0?x-10:x+10,y-31+bob,2+(fr%2),P.flame[2]);}else{L(3,-27,9,3,'gi');L(11,-27,3,3,'hand');}}
  else if(st==='win'){L(-1,-44,3,3,'hand');L(-1,-46,3,2,'guard');line(0,-60,0,1,14,'blade');line(1,-60,0,1,14,'bladeD');}
  else{L(5,-22,3,3,'hand');L(6,-23,4,2,'hilt');L(9,-24,1,3,'guard');line(10,-24,0.8,-0.6,17,'blade','bladeD');}
}
/* ---------- SARU ---------- */
function drawSaru(f,fr,side){
  const {s,x,y,P,R}=kitTools(f,side);const st=f.st;const A=CH.saru;
  if(!NOSHADOW)ell(x,GROUND+1,11,2,'rgba(0,0,0,.45)');
  if(st==='ko'&&!f.air){
    R(-14,-6,18,5,'fur');R(-14,-2,18,1,'furD');R(-8,-6,8,4,'vest');R(4,-9,8,7,'fur');R(6,-8,5,5,'face');R(4,-9,8,1,'band');
    R(7,-6,1,1,'hair');R(9,-6,1,1,'hair');for(let k=0;k<30;k++)R(-26+k,-1,1,1,k<2||k>27?'cap':'staff');
    R(-18,-4,4,2,'fur');R(-21,-6,3,2,'fur');return;
  }
  let bob=0,lean=0;if(st==='idle')bob=Math.floor(fr/14)%2;if(st==='hurt')lean=-2;if(st==='win')bob=-Math.abs(Math.round(Math.sin(fr*0.2)*4));
  if(f.air&&st==='jump')bob=-1;
  const L=(dx,dy,w,h,k)=>R(dx+lean,dy+bob,w,h,k);const line=(a,b,c,d,e,k,k2)=>lineT(L,a,b,c,d,e,k,k2);
  const staff=(x0,y0,ax,ay,len)=>{for(let i=0;i<len;i++){const lx=Math.round(x0+ax*i),ly=Math.round(y0+ay*i);L(lx,ly,1,1,(i<2||i>=len-2)?'cap':'staff');L(lx,ly+1,1,1,(i<2||i>=len-2)?'cap':'staffD');}};
  // tail
  const sw=Math.round(Math.sin(fr*0.1)*1.5);
  [[-7,-11],[-9,-12],[-11,-14],[-12,-16],[-12+sw,-18],[-11+sw,-20],[-9+sw,-21]].forEach(([a,b],i)=>{L(a,b,2,2,i===6?'furL':'fur');});
  const wk=st==='walk'?(Math.floor(fr/5)%2?2:-2):0;
  const kick=st==='kick'&&f.t>A.kick.s-2&&f.t<=A.kick.s+A.kick.a+4;
  if(f.air&&st!=='hurt'&&!kick){R(-6,-13,4,6,'fur');R(1,-13,4,6,'fur');R(-7,-8,5,2,'furD');R(1,-8,5,2,'furD');}
  else{R(-6+wk,-10,4,8,'fur');R(-8+wk,-2,5,2,'furD');
    if(kick){R(1,-14,14,4,'fur');R(1,-11,14,1,'furD');R(14,-15,3,5,'furD');}
    else{R(2-wk,-10,4,8,'fur');R(3-wk,-2,5,2,'furD');}}
  L(-7,-14,14,5,'vest');L(3,-14,4,5,'vestD');
  L(-5,-24,10,11,'fur');L(-2,-22,5,7,'face');L(-6,-24,3,10,'vest');L(3,-24,3,10,'vest');L(-6,-14,12,1,'cap');
  // head
  L(-2,-34,1,2,'fur');L(0,-35,1,2,'fur');L(2,-34,1,2,'fur');
  L(-4,-32,9,8,'fur');L(-2,-30,7,6,'face');L(-5,-30,2,3,'face');
  L(-4,-31,9,1,'band');L(-5,-31,1,4,'band');L(-6,-29,1,3,'bandL');L(0,-32,1,1,'cap');
  if(st==='hurt'){L(1,-28,2,1,'hair');L(4,-28,1,1,'hair');}else{L(1,-29,1,2,'eye');L(4,-29,1,2,'eye');L(1,-29,1,1,'eyeHi');L(0,-27,1,1,'band');L(5,-27,1,1,'band');}
  L(2,-26,3,1,'mouth');L(4,-25,1,1,'fang');
  // staff by state
  const pS=A.punch.s,pA=A.punch.a,sp=A.special;
  if(st==='punch'&&f.t<=pS){L(-2,-20,3,3,'fur');staff(-16,-20,1,0,30);}
  else if(st==='punch'&&f.t<=pS+pA+3){L(3,-20,3,3,'fur');L(8,-20,3,3,'fur');staff(-2,-19,1,0,A.punch.reach+2);for(let k=0;k<3;k++)L(-8-k*4,-23+k*3,3,1,'swoosh');}
  else if(st==='punch'){L(4,-19,3,3,'fur');staff(-8,-18,1,0.08,32);}
  else if(st==='block'){L(4,-24,3,3,'fur');L(4,-15,3,3,'fur');staff(8,-36,0,1,32);}
  else if(st==='special'){
    if(f.t<=sp.at){const a=fr*0.7;L(-1,-37,3,3,'fur');for(let i=-15;i<15;i++){const lx=Math.round(Math.cos(a)*i),ly=Math.round(-38+Math.sin(a)*i*0.35);L(lx,ly,1,1,Math.abs(i)>12?'cap':'staff');}}
    else{const k=f.t<=sp.at+sp.act+2?1:Math.max(0.3,1-(f.t-sp.at-sp.act-2)/12);const len=Math.round(6+(sp.reach-6)*k);
      L(3,-20,3,3,'fur');staff(4,-19,1,0,len);for(let i=10;i<len;i+=6)L(i,-21,2,1,'bandL');L(len+2,-21,3,5,'cap');}
  }
  else if(st==='win'){L(-4,-38,3,3,'fur');L(3,-38,3,3,'fur');const a=fr*0.4;for(let i=-15;i<15;i++){L(Math.round(Math.cos(a)*i),Math.round(-40+Math.sin(a)*i*0.3),1,1,Math.abs(i)>12?'cap':'staff');}}
  else{L(1,-18,3,3,'fur');L(-4,-13,3,3,'fur');staff(-10,-6,0.8,-0.78,34);}
}
/* ---------- RYU ---------- */
function drawRyu(f,fr,side){
  const {s,x,y,P,R}=kitTools(f,side);const st=f.st;const A=CH.ryu;
  if(!NOSHADOW)ell(x,GROUND+1,15,2,'rgba(0,0,0,.45)');
  if(st==='ko'&&!f.air){
    R(-18,-7,28,6,'body');R(-18,-2,28,1,'bodyD');for(let k=-14;k<8;k+=4)R(k,-4,3,2,'belly');R(-30,-4,12,3,'body');R(-34,-2,4,2,'bodyD');
    R(10,-10,10,8,'body');R(18,-8,5,5,'body');R(13,-7,1,1,'hair');R(15,-7,1,1,'hair');R(11,-13,1,3,'horn');R(14,-13,1,3,'horn');
    for(let k=-16;k<8;k+=3)R(k,-9,2,2,'mane');return;
  }
  let bob=0,lean=0;if(st==='idle')bob=Math.floor(fr/24)%2;if(st==='hurt')lean=-2;if(st==='win')bob=-2;
  const L=(dx,dy,w,h,k)=>R(dx+lean,dy+bob,w,h,k);
  const kick=st==='kick'&&f.t>A.kick.s-3&&f.t<=A.kick.s+A.kick.a+6;
  const sw=Math.round(Math.sin(fr*0.08)*2);
  // tail
  if(kick){R(6,-9,8,5,'body');R(13,-7,9,4,'body');R(21,-5,9,3,'body');R(29,-4,4,2,'bodyD');for(let k=8;k<30;k+=4)R(k,-10+Math.floor(k/12),2,1,'mane');
    for(let k=0;k<3;k++)R(18+k*4,-12+k,3,1,'swoosh');}
  else{R(-12,-9,6,5,'body');R(-18,-7,7,4,'body');R(-24,-5+sw,7,3,'body');R(-29,-4+sw,5,2,'bodyD');for(let k=-26;k<-10;k+=4)R(k,-10+(k<-20?sw:0)+2,2,1,'mane');}
  // legs
  const wk=st==='walk'?(Math.floor(fr/9)%2?2:-2):0;
  if(f.air&&st!=='hurt'){R(-7,-15,6,8,'body');R(2,-15,6,8,'body');R(-8,-8,7,2,'bodyD');R(2,-8,7,2,'bodyD');}
  else{R(-7+wk,-13,6,11,'body');R(-7+wk,-13,2,11,'bodyD');R(-9+wk,-2,8,2,'bodyD');R(-2+wk,-2,1,1,'claw');
    R(2-wk,-13,6,11,'body');R(2-wk,-13,2,11,'bodyD');R(2-wk,-2,8,2,'bodyD');R(9-wk,-2,1,1,'claw');}
  // mane + torso
  for(let k=0;k<11;k++)L(-10+(k%2),-40+k*2,3,2,k%3?'mane':'maneD');
  L(-7,-31,14,19,'body');L(4,-31,3,19,'bodyD');for(let k=0;k<6;k++)L(-2,-29+k*3,6,2,'belly');
  // head
  const roar=st==='win'||(st==='special'&&f.t>=A.special.at-4&&f.t<A.special.at+10);const hy=st==='win'?-3:0;
  L(-4,-43+hy,10,9,'body');L(5,-40+hy,7,5,'body');L(5,-40+hy,7,1,'bodyL');L(11,-39+hy,1,1,'hair');
  if(roar){L(5,-35+hy,7,1,'mouth');L(5,-34+hy,7,2,'bodyD');L(6,-35+hy,1,1,'claw');L(10,-35+hy,1,1,'claw');}
  else{L(5,-35+hy,7,2,'bodyD');L(7,-36+hy,1,1,'claw');L(10,-36+hy,1,1,'claw');}
  if(st==='hurt')L(2,-40+hy,3,1,'hair');else{L(2,-40+hy,2,2,'eye');L(2,-40+hy,1,1,'eyeHi');L(1,-42+hy,4,1,'bodyD');}
  lineT(L,-2,-44+hy,-0.5,-1,6,'horn');lineT(L,-4,-47+hy,-1,0,3,'horn');lineT(L,1,-44+hy,-0.2,-1,5,'horn');
  lineT(L,12,-37+hy,1,0.35,8,'belly');lineT(L,11,-36+hy,0.8,0.8,6,'belly');
  // arms
  const pS=A.punch.s,pA=A.punch.a;
  if(st==='punch'&&f.t<=pS){L(-6,-28,5,4,'body');L(-8,-30,2,2,'claw');}
  else if(st==='punch'&&f.t<=pS+pA+4){L(5,-27,12,4,'body');L(16,-28,3,1,'claw');L(17,-26,3,1,'claw');L(16,-24,3,1,'claw');
    for(let k=0;k<3;k++)lineT(L,17+k*4,-36,0.5,1,11,'swoosh');}
  else if(st==='block'){L(2,-32,7,10,'body');L(8,-33,2,1,'claw');L(8,-24,2,1,'claw');}
  else{L(4,-27,5,3,'body');L(8,-25,2,2,'body');L(9,-24,1,1,'claw');}
}

/* ---------- KITSUNE ---------- */
function drawKitsune(f,fr,side){
  const {s,x,y,P,R}=kitTools(f,side);const st=f.st;const A=CH.kitsune;
  if(!NOSHADOW)ell(x,GROUND+1,10,2,'rgba(0,0,0,.45)');
  if(st==='ko'&&!f.air){R(-14,-6,18,5,'robe');R(-14,-2,18,1,'robeD');R(-19,-5,6,4,'hakama');R(4,-9,8,7,'fur');R(10,-7,4,3,'fur');
    R(5,-12,2,3,'fur');R(9,-12,2,3,'fur');R(7,-7,1,1,'hair');R(10,-6,1,1,'hair');R(-28,-4,10,3,'fur');R(-26,-7,8,2,'fur');R(-29,-4,2,2,'furL');return;}
  let bob=0,lean=0;if(st==='idle')bob=Math.floor(fr/16)%2;if(st==='hurt')lean=-2;if(st==='win')bob=-Math.abs(Math.round(Math.sin(fr*0.2)*3));
  const L=(dx,dy,w,h,k)=>R(dx+lean,dy+bob,w,h,k);
  const sw=Math.round(Math.sin(fr*0.12)*2);
  for(let t=2;t>=0;t--){for(let u=0;u<=1.001;u+=0.07){const a=Math.round(-6-9*u-t*3+sw*u*u),b=Math.round(-10-15*u+t*2*u-(t===1?3*u:0));
    const w=u<0.2?2:u>0.8?2:4;L(a-1,b-1,w,w,u>0.78?'furL':(t===1?'fur':'furD'));}}
  const wk=st==='walk'?(Math.floor(fr/5)%2?2:-2):0;const kick=st==='kick'&&f.t>A.kick.s-2&&f.t<=A.kick.s+A.kick.a+4;
  if(f.air&&st!=='hurt'&&!kick){R(-6,-13,5,7,'hakama');R(1,-13,5,7,'hakama');R(-6,-6,4,2,'furD');R(2,-6,4,2,'furD');}
  else{R(-7+wk,-12,5,10,'hakama');R(-8+wk,-2,5,2,'furD');
    if(kick){R(1,-14,14,4,'hakama');R(14,-15,3,4,'fur');}else{R(2-wk,-12,5,10,'hakama');R(2-wk,-2,5,2,'furD');}}
  L(-7,-15,14,4,'hakama');L(3,-15,4,4,'hakamaD');
  L(-6,-25,3,8,'robeD');L(-5,-25,10,11,'robe');L(2,-25,3,11,'robeD');
  for(let k=0;k<4;k++){L(-2+k,-25+k,1,1,'hakama');L(2-k,-25+k,1,1,'hakama');}
  L(-4,-33,8,7,'fur');L(3,-31,5,3,'fur');L(7,-31,1,1,'hair');L(-4,-33,8,1,'furL');
  L(-3,-37,2,4,'fur');L(-3,-36,1,2,'mark');L(1,-37,2,4,'fur');L(1,-36,1,2,'mark');L(0,-31,3,1,'mark');
  if(st==='hurt')L(1,-30,2,1,'hair');else{L(1,-30,2,1,'eye');L(2,-30,1,1,'hair');}
  L(4,-28,3,1,'mouth');
  const pS=A.punch.s,pA=A.punch.a,fl=fr%2?'fire':'furL';
  if(st==='punch'&&f.t<=pS){L(-8,-24,3,3,'fur');}
  else if(st==='punch'&&f.t<=pS+pA+3){L(3,-23,7,3,'robe');L(9,-23,3,3,'fur');L(12,-24,2,1,'claw');L(12,-22,2,1,'claw');
    for(let a=-1.1;a<=0.35;a+=0.1)L(Math.round(6+Math.cos(a)*(A.punch.reach-6)),Math.round(-22+Math.sin(a)*18),1,1,'fire');}
  else if(st==='block'){L(3,-27,4,9,'robe');L(6,-28,2,2,'fur');}
  else if(st==='special'){L(-9,-28,3,3,fl);L(8,-28,3,3,fl);L(-1,-40,3,3,'fire');}
  else if(st==='win'){L(3,-38,3,9,'robe');L(3,-41,3,3,'fur');L(3,-45,3,3,fl);}
  else{L(3,-22,3,6,'robe');L(4,-17,3,3,'fur');L(8,-20+(Math.floor(fr/8)%2),2,2,fl);}
}
/* ---------- TENGU ---------- */
function drawTengu(f,fr,side){
  const {s,x,y,P,R}=kitTools(f,side);const st=f.st;const A=CH.tengu;
  if(!NOSHADOW)ell(x,GROUND+1,11,2,'rgba(0,0,0,.45)');
  if(st==='ko'&&!f.air){R(-14,-6,20,5,'robe');R(-22,-4,10,3,'feather');R(-20,-7,8,2,'featherD');R(6,-9,8,7,'feather');R(14,-7,6,2,'beak');R(9,-6,1,1,'hair');R(11,-6,1,1,'hair');return;}
  let bob=0,lean=0;if(st==='idle')bob=Math.floor(fr/18)%2;if(st==='hurt')lean=-2;if(st==='win')bob=-2;
  const L=(dx,dy,w,h,k)=>R(dx+lean,dy+bob,w,h,k);
  const spread=f.air||st==='win'||st==='special';const flap=Math.floor(fr/5)%2;
  if(spread){L(-24,-33+flap*2,17,3,'feather');L(-22,-30+flap*2,15,3,'featherD');L(-20,-27+flap,12,3,'feather');L(-17,-24,8,3,'featherD');for(let k=0;k<5;k++)L(-24+k*3,-30+flap*2+ (k%2),1,2,'featherL');}
  else{L(-10,-28,5,15,'featherD');L(-11,-26,2,11,'feather');}
  const wk=st==='walk'?(Math.floor(fr/6)%2?2:-2):0;const kick=st==='kick'&&f.t>A.kick.s-2&&f.t<=A.kick.s+A.kick.a+4;
  if(f.air&&st!=='hurt'&&!kick){R(-4,-13,3,7,'featherD');R(2,-13,3,7,'featherD');R(-5,-6,5,2,'beak');R(2,-6,5,2,'beak');}
  else{R(-5+wk,-12,3,10,'featherD');R(-6+wk,-2,6,2,'beak');
    if(kick){R(2,-15,13,3,'featherD');R(14,-17,3,6,'beak');}else{R(2-wk,-12,3,10,'featherD');R(1-wk,-2,6,2,'beak');}}
  L(-6,-26,12,14,'robe');L(3,-26,3,14,'robeD');L(-2,-24,2,2,'pom');L(1,-21,2,2,'pom');L(-6,-14,12,1,'robeD');
  L(-4,-35,8,8,'feather');L(-4,-35,8,1,'featherL');L(-1,-37,3,2,'featherD');
  L(4,-31,6,2,'beak');L(4,-29,5,1,'beakD');L(9,-30,2,1,'beakD');
  if(st==='hurt'){L(1,-32,2,1,'hair');}else{L(1,-32,2,2,'eye');L(2,-32,1,1,'hair');}
  const pS=A.punch.s,pA=A.punch.a;
  if(st==='punch'&&f.t<=pS){L(-6,-34,3,3,'feather');L(-10,-42,5,8,'leaf');L(-9,-41,3,6,'leafD');}
  else if(st==='punch'&&f.t<=pS+pA+3){L(4,-24,8,3,'robe');const e=A.punch.reach;L(e-9,-31,6,11,'leaf');L(e-8,-30,4,9,'leafD');L(e-12,-22,3,1,'beakD');
    for(let k=0;k<3;k++)L(12,-30+k*4,e-20,1,'swoosh');}
  else if(st==='block'){L(4,-25,3,3,'feather');L(7,-35,6,12,'leaf');L(8,-34,4,10,'leafD');}
  else if(st==='special'&&f.t>A.special.at){for(let k=0;k<4;k++)L(-10-k*4,-34+k*5,8,1,'swoosh');L(4,-22,4,3,'feather');}
  else{L(4,-20,3,3,'feather');L(7,-28,5,8,'leaf');L(8,-27,3,6,'leafD');L(6,-21,1,2,'beakD');}
}
/* ---------- KAPPA ---------- */
function drawKappa(f,fr,side){
  const {s,x,y,P,R}=kitTools(f,side);const st=f.st;const A=CH.kappa;
  if(!NOSHADOW)ell(x,GROUND+1,13,2,'rgba(0,0,0,.45)');
  if(st==='ko'&&!f.air){R(-12,-7,22,6,'shell');R(-12,-3,22,2,'shellD');R(-10,-10,18,3,'belly');R(-9,-14,3,4,'skin');R(4,-14,3,4,'skin');
    R(10,-10,8,7,'skin');R(10,-12,8,2,'hair');R(16,-8,3,2,'beak');R(12,-8,1,1,'hair');R(14,-8,1,1,'hair');R(20,-4,2,1,'water');R(23,-3,1,1,'water');return;}
  let bob=0,lean=0;if(st==='idle')bob=Math.floor(fr/22)%2;if(st==='hurt')lean=-2;if(st==='win')bob=-Math.abs(Math.round(Math.sin(fr*0.2)*2));
  const L=(dx,dy,w,h,k)=>R(dx+lean,dy+bob,w,h,k);
  L(-12,-24,4,13,'shellD');L(-11,-27,7,18,'shell');L(-10,-24,2,2,'shellL');L(-10,-18,2,2,'shellL');L(-8,-21,2,2,'shellL');
  const wk=st==='walk'?(Math.floor(fr/8)%2?2:-2):0;const kick=st==='kick'&&f.t>A.kick.s-2&&f.t<=A.kick.s+A.kick.a+4;
  if(f.air&&st!=='hurt'){R(-6,-12,5,6,'skin');R(2,-12,5,6,'skin');R(-7,-6,7,2,'skinD');R(1,-6,7,2,'skinD');}
  else{R(-6+wk,-9,5,7,'skin');R(-8+wk,-2,7,2,'skinD');
    if(kick){R(2,-9,15,3,'skin');R(16,-10,3,4,'skinD');}else{R(2-wk,-9,5,7,'skin');R(1-wk,-2,7,2,'skinD');}}
  L(-6,-24,12,15,'skin');L(4,-24,2,15,'skinD');L(-1,-22,6,12,'belly');L(-1,-18,6,1,'shellL');L(-1,-14,6,1,'shellL');
  L(-4,-32,9,8,'skin');L(-4,-32,9,1,'skinL');L(4,-28,5,3,'beak');L(4,-26,4,1,'shellD');
  L(-5,-33,11,2,'hair');L(-3,-35,7,2,'dish');L(-2,-36,5,1,'dish');
  if(st==='hurt')L(1,-30,2,1,'hair');else{L(1,-30,2,2,'eye');L(2,-30,1,1,'hair');}
  const pS=A.punch.s,pA=A.punch.a;
  const ring=(r)=>{for(let a=0;a<6.28;a+=0.35){const aa=a+fr*0.15;L(Math.round(Math.cos(aa)*r),Math.round(-18+Math.sin(aa)*r*1.1),1,1,'water');}};
  if(st==='punch'&&f.t<=pS){L(-8,-22,3,3,'skin');}
  else if(st==='punch'&&f.t<=pS+pA+3){L(3,-22,A.punch.reach-16,3,'skin');const e=A.punch.reach-13;L(e,-24,3,7,'skinL');for(let k=0;k<5;k++)L(e+3+k,-26+k*2,1,1,'water');}
  else if(st==='block'){L(2,-30,4,9,'skin');L(5,-31,2,2,'skinD');}
  else if(st==='special'){L(2,-31,4,10,'skin');L(-7,-31,3,6,'skin');ring(16);}
  else if(st==='win'){L(-7,-40,3,8,'skin');L(4,-40,3,8,'skin');for(let k=0;k<4;k++)L(0+(k%2),-38-k*2,1,1,'water');}
  else{L(4,-21,3,6,'skin');L(5,-16,4,2,'skinD');}
}
/* ---------- ONRYO ---------- */
function drawOnryo(f,fr,side){
  const {s,x,y,P,R}=kitTools(f,side);const st=f.st;const A=CH.onryo;
  if(!NOSHADOW)ell(x,GROUND+1,9,2,'rgba(0,0,0,.35)');
  if(st==='ko'&&!f.air){R(-14,-5,24,5,'robe');R(-14,-1,24,1,'robeD');R(8,-6,12,4,'hair');R(15,-3,7,2,'hair');R(6,-7,4,4,'skin');return;}
  const hov=-3+Math.round(Math.sin(fr*0.08)*1.5);let lean=st==='hurt'?-2:0;
  const L=(dx,dy,w,h,k)=>R(dx+lean,dy+hov,w,h,k);
  for(let k=-9;k<=9;k++)L(k,-6+((k*7+(fr>>3))%3),1,3,'robeD');
  for(let r=0;r<24;r++){const w=Math.round(6+r*0.16);L(-w,-30+r,w*2,1,'robe');L(w-2,-30+r,2,1,'robeD');}
  L(-6,-20,12,2,'robeD');
  L(-7,-35,3,24,'hair');L(-3,-37,7,7,'skin');L(-4,-38,9,3,'hair');
  L(-1,-35,1,9,'hair');L(1,-35,1,11,'hair');L(3,-35,1,13,'hair');L(5,-35,1,8,'hair');
  if(st!=='hurt')L(2,-32,1,1,'eyeR');
  const pS=A.punch.s,pA=A.punch.a;
  if(st==='punch'&&f.t<=pS){L(-8,-27,4,4,'robe');L(-10,-27,2,3,'skin');}
  else if(st==='punch'&&f.t<=pS+pA+3){const e=A.punch.reach;L(4,-27,e-12,3,'robe');L(e-8,-28,3,4,'skin');L(e-5,-28,3,1,'nail');L(e-5,-26,3,1,'nail');
    for(let k=0;k<4;k++)L(-6-k*3,-30+k*2,2,1,'hair');}
  else if(st==='kick'&&f.t>A.kick.s-2&&f.t<=A.kick.s+A.kick.a+4){L(2,-11,20,2,'hair');L(20,-13,5,5,'hair');L(4,-26,4,9,'robe');}
  else if(st==='block'){L(2,-31,6,11,'robe');L(6,-31,2,3,'skin');}
  else if(st==='special'){L(-13,-28,7,3,'robe');L(6,-28,7,3,'robe');L(-15,-28,2,3,'skin');L(13,-28,2,3,'skin');
    for(let a=0;a<6.28;a+=0.4)L(Math.round(Math.cos(a+fr*0.2)*14),Math.round(-20+Math.sin(a+fr*0.2)*16),1,1,'aura');}
  else if(st==='win'){L(-10,-36,4,10,'robe');L(6,-36,4,10,'robe');L(-10,-38,3,3,'skin');L(7,-38,3,3,'skin');}
  else{L(4,-27,4,10,'robe');L(6,-17,2,3,'skin');L(6,-14,2,1,'nail');}
  if(fr%24<2)L(Math.round(Math.sin(fr)*8),-38,1,1,'aura');
}

/* ---------- ENMA (boss) ---------- */
function drawEnma(f,fr,side){
  const {s,x,y,P,R}=kitTools(f,side);const st=f.st;const A=CH.enma;
  if(!NOSHADOW)ell(x,GROUND+1,16,2,'rgba(0,0,0,.45)');
  if(st==='ko'&&!f.air){R(-22,-8,32,7,'robe');R(-22,-2,32,1,'robeD');R(-12,-8,3,7,'gold');R(10,-13,10,10,'skin');R(18,-11,5,8,'beard');R(10,-17,9,4,'crown');R(13,-16,3,2,'gold');
    for(let i=0;i<26;i++){R(-34+i,-3,1,3,i<6?'hilt':'club');if(i%5===2)R(-34+i,-4,1,1,'stud');}return;}
  let bob=0,lean=0;if(st==='idle')bob=Math.floor(fr/26)%2;if(st==='hurt')lean=-2;if(st==='win')bob=-1;
  const L=(dx,dy,w,h,k)=>R(dx+lean,dy+bob,w,h,k);
  const club=(x0,y0,ax,ay,len)=>{for(let i=0;i<len;i++){const lx=Math.round(x0+ax*i),ly=Math.round(y0+ay*i);const th=i<6?2:3;L(lx,ly,th,th,i<6?'hilt':'club');if(i>6&&i%4===1)L(lx+(ax>0?0:1),ly-1,1,1,'stud');}};
  const wk=st==='walk'?(Math.floor(fr/9)%2?2:-2):0;const kick=st==='kick'&&f.t>A.kick.s-3&&f.t<=A.kick.s+A.kick.a+5;
  // legs and boots
  if(f.air&&st!=='hurt'){R(-9,-15,7,8,'robeD');R(3,-15,7,8,'robeD');R(-10,-8,9,2,'crown');R(3,-8,9,2,'crown');}
  else{R(-10+wk,-11,7,9,'robeD');R(-11+wk,-2,9,2,'crown');
    if(kick){R(3,-15,16,5,'robeD');R(18,-18,4,9,'crown');}else{R(4-wk,-11,7,9,'robeD');R(4-wk,-2,9,2,'crown');}}
  // back sleeve
  L(-18,-34,7,14,'robeD');L(-18,-21,7,2,'gold');
  // robe
  for(let r=0;r<24;r++){const w=Math.round(12-Math.abs(r-6)*0.08);L(-w,-34+r,w*2,1,'robe');L(w-3,-34+r,3,1,'robeD');}
  L(-3,-34,6,7,'inner');for(let k=0;k<4;k++){L(-4+k,-34+k,1,1,'robeL');L(3-k,-34+k,1,1,'robeL');}
  L(-12,-19,24,3,'gold');L(-12,-17,24,1,'#8A5A00');L(-2,-19,4,6,'gold');
  // head, beard, crown
  L(-6,-45,12,11,'skin');L(4,-45,2,11,'skinD');
  L(-5,-42,4,1,'beard');L(2,-42,4,1,'beard');L(-4,-43,2,1,'beard');L(3,-43,2,1,'beard');
  if(st==='hurt'){L(-3,-40,3,1,'beard');L(2,-40,3,1,'beard');}else{L(-3,-41,2,2,'eye');L(3,-41,2,2,'eye');L(-3,-41,1,1,'eyeHi');L(3,-41,1,1,'eyeHi');}
  L(0,-38,2,2,'skinD');
  L(-7,-36,14,7,'beard');for(let k=0;k<7;k++)L(-6+k*2,-29+(k%2),1,2,'beard');L(-1,-35,5,2,'mouth');L(0,-35,1,1,'fang');L(3,-35,1,1,'fang');
  L(-7,-54,14,9,'crown');L(-9,-46,18,2,'crown');L(-10,-49,2,7,'crown');L(8,-49,2,7,'crown');
  L(-3,-52,6,5,'gold');L(-2,-51,4,1,'crown');L(-2,-49,4,1,'crown');L(-2,-48,4,1,'crown');L(0,-52,1,5,'crown');
  // arms and the iron club
  const pS=A.punch.s,pA=A.punch.a;
  if(st==='punch'&&f.t<=pS){L(-2,-46,5,5,'skin');club(-1,-46,-0.7,-0.6,26);}
  else if(st==='punch'&&f.t<=pS+pA+3){L(6,-32,9,5,'robe');L(13,-31,5,5,'skin');club(16,-30,1,0.28,A.punch.reach-12);
    for(let a=-1.4;a<=0.35;a+=0.09)L(Math.round(10+Math.cos(a)*30),Math.round(-26+Math.sin(a)*30),1,1,'swoosh');}
  else if(st==='punch'){L(8,-24,5,5,'skin');club(11,-22,0.78,0.62,24);}
  else if(st==='block'){L(8,-34,5,5,'skin');club(11,-52,0,1,32);}
  else if(st==='special'){L(-16,-36,5,5,'skin');const fc=P.flame;const r=2+Math.min(4,Math.floor(f.t/3));if(!fl0(f))disc(s>0?x-14:x+14,y-42+bob,r,fc[2]);L(8,-24,5,5,'skin');club(10,-24,-0.35,-1,24);}
  else if(st==='win'){L(6,-50,5,5,'skin');club(8,-52,0.25,-1,26);}
  else{L(9,-24,5,5,'skin');club(12,-22,0.12,-1,28);}
}
function fl0(f){return f.flash>0&&f.flash%2===0;}
function poseOf(f){
  const c=CH[f.ch];let st=f.st,t=f.t;
  if(st==='crouch')st='idle';
  else if(st==='dash')st='walk';
  else if(st==='grabbed')st='hurt';
  else if(st==='throw'){st='punch';t=c.punch.s+1;}
  else if(st==='super'){if(t<SUPER.startup){st='special';t=Math.min(t,8);}else{st='punch';t=c.punch.s+1;}}
  else if((st==='punch'||st==='kick')&&(f.atk==='cpunch'||f.atk==='sweep')){const a=c[f.atk],b=c[st];t=Math.round(f.t*(b.s+b.a+b.r)/(a.s+a.a+a.r));}
  return Object.assign({},f,{st,t});
}
function drawFighterRaw(f,fr,side){
  f=poseOf(f);
  switch(f.ch){case 'saru':drawSaru(f,fr,side);break;case 'ryu':drawRyu(f,fr,side);break;case 'kitsune':drawKitsune(f,fr,side);break;
    case 'tengu':drawTengu(f,fr,side);break;case 'kappa':drawKappa(f,fr,side);break;case 'onryo':drawOnryo(f,fr,side);break;case 'enma':drawEnma(f,fr,side);break;default:drawOni(f,fr,side);}
}
let NOSHADOW=false;
const SPR=document.createElement('canvas');SPR.width=288;SPR.height=144;const SG=SPR.getContext('2d');const SOX=144,SOY=128;
const OUT=document.createElement('canvas');OUT.width=288;OUT.height=144;const OG=OUT.getContext('2d');
function outline(){
  OG.globalCompositeOperation='source-over';OG.clearRect(0,0,288,144);
  OG.drawImage(SPR,-1,0);OG.drawImage(SPR,1,0);OG.drawImage(SPR,0,-1);OG.drawImage(SPR,0,1);
  OG.globalCompositeOperation='source-in';OG.fillStyle='rgba(10,5,6,.92)';OG.fillRect(0,0,288,144);
  OG.globalCompositeOperation='source-over';OG.drawImage(SPR,0,0);
}
const HB=document.createElement('canvas');HB.width=560;HB.height=240;const HG=HB.getContext('2d');
const HO=document.createElement('canvas');HO.width=560;HO.height=240;const HOG=HO.getContext('2d');
const HR=document.createElement('canvas');HR.width=560;HR.height=240;const HRG=HR.getContext('2d');
const HAX=280,HAY=212;
function hiSkin(f,side){if(f.skin)return f.skin;return side===4?'genesis':side===2?'kin':side===3?'kongo':side?'ao':'aka';}
function hiRender(f,fr,side,rim){
  HG.setTransform(1,0,0,1,0,0);HG.clearRect(0,0,560,240);HG.imageSmoothingEnabled=false;
  HG.setTransform(f.face>0?1:-1,0,0,1,HAX,HAY);if(f.ch==='oni')hiDrawOni(HG,f,fr,hiSkin(f,side));else hiDrawAny(HG,f,fr,side);HG.setTransform(1,0,0,1,0,0);
  HOG.globalCompositeOperation='source-over';HOG.clearRect(0,0,560,240);
  HOG.drawImage(HB,-1,0);HOG.drawImage(HB,1,0);HOG.drawImage(HB,0,-1);HOG.drawImage(HB,0,1);
  HOG.globalCompositeOperation='source-in';HOG.fillStyle='rgba(8,3,4,.95)';HOG.fillRect(0,0,560,240);HOG.globalCompositeOperation='source-over';HOG.drawImage(HB,0,0);
  if(rim){HRG.globalCompositeOperation='source-over';HRG.clearRect(0,0,560,240);HRG.drawImage(HB,0,0);HRG.globalCompositeOperation='destination-out';HRG.drawImage(HB,-1,0);
    HRG.globalCompositeOperation='source-in';HRG.fillStyle=rim;HRG.fillRect(0,0,560,240);HRG.globalCompositeOperation='source-over';HOG.drawImage(HR,0,0);}
  return HO;
}
const RIM={7:'rgba(120,255,160,.55)',0:'rgba(255,220,160,.55)',1:'rgba(255,120,90,.7)',2:'rgba(120,230,220,.6)',3:'rgba(255,200,120,.6)',4:'rgba(255,170,90,.7)',5:'rgba(200,210,255,.6)',6:'rgba(255,200,110,.6)'};
const GFX={hd:(()=>{try{return localStorage.getItem('oni-gfx')!=='classic';}catch(e){return true;}})()};
const HDW=640,HDH=300,HDAX=320,HDAY=286;const HDC=new WeakMap();
function hdMk(){const c=document.createElement('canvas');c.width=HDW;c.height=HDH;return c;}
function hdSkinOf(f,side){if(f.ch==='oni'){const s=hiSkin(f,side);return (typeof HDPAL!=='undefined'&&HDPAL[s])?s:null;}
  if(f.ch==='ryu')return typeof hdDrawSeiryu==='function'?(side?'s1':'s0'):null;
  if(['saru','kappa','kitsune','tengu','onryo','enma'].includes(f.ch))return typeof hdDrawGeneric==='function'?'g'+(side|0):null;return null;}
const HDDRAW={oni:(g,f,fr,s)=>hdDrawOni(g,f,fr,s),ryu:(g,f,fr,s)=>hdDrawSeiryu(g,f,fr,s)};
for(const k of ['saru','kappa','kitsune','tengu','onryo','enma'])HDDRAW[k]=(g,f,fr,s)=>hdDrawGeneric(g,f,fr,+String(s).slice(1));
HDDRAW.kitsune=(g,f,fr,s)=>hdDrawKira(g,f,fr,+String(s).slice(1)?'k1':'k0');
HDDRAW.saru=(g,f,fr,s)=>hdDrawKaze(g,f,fr,+String(s).slice(1)?'kaze1':'kaze0');
HDDRAW.tengu=(g,f,fr,s)=>hdDrawHayate(g,f,fr,+String(s).slice(1)?'h1':'h0');
HDDRAW.onryo=(g,f,fr,s)=>hdDrawKage(g,f,fr,+String(s).slice(1)?'q1':'q0');
HDDRAW.kappa=(g,f,fr,s)=>hdDrawGenbu(g,f,fr,+String(s).slice(1)?'g1':'g0');
HDDRAW.enma=(g,f,fr,s)=>hdDrawEnma(g,f,fr,+String(s).slice(1)?'e1':'e0');
function hiRenderHD(f,fr,side,rim){
  const skin=hdSkinOf(f,side);let c=HDC.get(f);if(!c){c={B:hdMk(),O:hdMk(),R:hdMk(),key:''};HDC.set(f,c);}
  const P=hiPose(f,fr);const r2=a=>a?Math.round(a[0]*2)+','+Math.round(a[1]*2):'';
  const key=f.ch+'|'+(f.st==='idle'||f.st==='block'||f.st==='crouch'?0:f.t)+'|'+(f.ch==='ryu'?Math.floor(fr/6):0)+'|'+[P.hip,P.kb,P.fb,P.kf,P.ff,P.grip,P.hb].map(r2).join('|')+'|'+[P.lean,P.ang,P.len].map(v=>Math.round((v||0)*60)).join(',')+'|'+f.st+f.face+skin+(f.flash>0&&f.flash%2===0?'F':'')+(P.arc?'a':'')+(rim||'');
  if(key===c.key)return c.O;{const cad=String(skin).startsWith('g')?3:2;if(c.key&&(fr+(side|0)*(cad===3?1:1))%cad!==0&&fr-(c.fr||-9)<cad+1)return c.O;}c.key=key;c.fr=fr;
  const BG=c.B.getContext('2d'),OG=c.O.getContext('2d'),RG=c.R.getContext('2d');
  BG.setTransform(1,0,0,1,0,0);BG.clearRect(0,0,HDW,HDH);BG.imageSmoothingEnabled=false;
  BG.setTransform(f.face>0?2:-2,0,0,2,HDAX,HDAY);HDDRAW[f.ch](BG,f,fr,skin);BG.setTransform(1,0,0,1,0,0);
  OG.globalCompositeOperation='source-over';OG.clearRect(0,0,HDW,HDH);
  for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])OG.drawImage(c.B,dx,dy);
  OG.globalCompositeOperation='source-in';OG.fillStyle='rgba(8,3,4,.95)';OG.fillRect(0,0,HDW,HDH);OG.globalCompositeOperation='source-over';OG.drawImage(c.B,0,0);
  if(rim){RG.globalCompositeOperation='source-over';RG.clearRect(0,0,HDW,HDH);RG.drawImage(c.B,0,0);RG.globalCompositeOperation='destination-out';RG.drawImage(c.B,-2,1);
    RG.globalCompositeOperation='source-in';RG.fillStyle=rim;RG.fillRect(0,0,HDW,HDH);RG.globalCompositeOperation='source-over';OG.drawImage(c.R,0,0);}
  if(String(skin).startsWith('g')){RG.globalCompositeOperation='source-over';RG.clearRect(0,0,HDW,HDH);RG.drawImage(c.B,0,0);RG.globalCompositeOperation='destination-out';RG.drawImage(c.B,2,2);
    RG.globalCompositeOperation='source-in';RG.fillStyle='rgba(255,236,210,.45)';RG.fillRect(0,0,HDW,HDH);OG.globalCompositeOperation='source-atop';OG.drawImage(c.R,0,0);OG.globalCompositeOperation='source-over';}
  return c.O;}
function drawOniHi(f,fr,side){
  if(GFX.hd&&HDDRAW[f.ch]&&hdSkinOf(f,side)&&(f.st!=='ko'||f.ch!=='oni')){
    const img=hiRenderHD(f,fr,side,null);const tf=ctx.getTransform();ctx.save();ctx.setTransform(1,0,0,1,tf.e,tf.f);ctx.imageSmoothingEnabled=false;
    if(f.phase>0)ctx.globalAlpha=0.35+0.15*Math.sin(fr*0.5);ctx.drawImage(img,Math.round(f.x*3-HDAX),Math.round(f.y*3-HDAY));ctx.restore();return;}
  hiRender(f,fr,side,RIM[M?M.map:1]||null);
  const tf=ctx.getTransform();ctx.save();ctx.setTransform(2,0,0,2,tf.e,tf.f);ctx.imageSmoothingEnabled=false;
  if(f.phase>0)ctx.globalAlpha=0.35+0.15*Math.sin(fr*0.5);
  ctx.drawImage(HO,Math.round(f.x*1.5-HAX),Math.round(f.y*1.5-HAY));ctx.restore();
}
function drawFighter(f,fr,side,scale){
  scale=scale||GEO;const target=G;
  if(target===ctx&&typeof hiDrawAny==='function'){if(!NOSHADOW&&f.st!=='ko')ell(f.x,GROUND+1,Math.round(12*scale),2,'rgba(0,0,0,.42)');drawOniHi(f,fr,side);return;}
  if(!NOSHADOW&&f.st!=='ko')ell(f.x,GROUND+1,Math.round(12*scale),2,'rgba(0,0,0,.42)');
  SG.setTransform(1,0,0,1,0,0);SG.clearRect(0,0,288,144);
  G=SG;const ns=NOSHADOW;NOSHADOW=true;drawFighterRaw(Object.assign({},f,{x:SOX,y:SOY,phase:0}),fr,side);NOSHADOW=ns;G=target;
  outline();
  target.save();target.imageSmoothingEnabled=false;
  if(f.phase>0||f.inv>0&&f.st!=='super')target.globalAlpha=0.35+0.15*Math.sin(fr*0.5);
  const dx=Math.round(f.x-SOX*scale),dy=Math.round(f.y-SOY*scale);
  const crouch=f.crouch&&!f.air&&f.st!=='ko'&&f.st!=='hurt';
  if(crouch){
    const drop=Math.round(CH[f.ch].h*0.34),legs=14;const cut=SOY-legs;
    target.drawImage(OUT,0,0,288,cut,dx,dy+Math.round(drop*scale),Math.round(288*scale),Math.round(cut*scale));
    target.drawImage(OUT,0,cut,288,legs+2,dx,dy+Math.round((cut+drop)*scale),Math.round(288*scale),Math.round(Math.max(4,legs-drop)*scale+2));
  } else target.drawImage(OUT,dx,dy,Math.round(288*scale),Math.round(144*scale));
  if(f.st==='super'&&f.t<SUPER.startup){target.globalAlpha=0.5;const pc=PAL[f.ch][side]||{};target.fillStyle=pc.main||'#FFB000';
    for(let k=0;k<8;k++){const a=k/8*6.28+fr*0.3;target.fillRect(Math.round(f.x+Math.cos(a)*22),Math.round(f.y-24+Math.sin(a)*22),2,2);}}
  target.restore();
}
function drawProj(p,fr,pal){
  if(pal==null)pal=p.owner;const s=p.vx>0?1:-1;
  if(p.kit==='ryu'||p.kit==='enma'){const c=p.kit==='enma'?PAL.enma[pal].flame:PAL.ryu[pal].breath;const r=p.r;
    for(let k=1;k<6;k++)disc(p.x-s*k*4,p.y+Math.sin((fr+k)*0.8),Math.max(1,r-3-k),c[3]);
    disc(p.x,p.y,r,c[3]);disc(p.x+s,p.y,r-2,c[2]);disc(p.x+s*2,p.y-1,r-4,c[1]);disc(p.x+s*3,p.y-1,Math.max(1,r-7),c[0]);
    for(let k=0;k<4;k++)px(p.x+Math.cos(fr*0.5+k)*r,p.y+Math.sin(fr*0.5+k)*r,c[1]);return;}
  const c=PAL.oni[pal].flame;
  for(let k=1;k<6;k++)px(p.x-s*(k*3+3),p.y+((fr+k)%3)-1,c[(k%3)+1]);
  disc(p.x,p.y,6,c[3]);disc(p.x+s,p.y-1,4,c[2]);disc(p.x+s*2,p.y-1,3,c[1]);disc(p.x+s*2,p.y-2,1,c[0]);
  rect(p.x-s*7,p.y-4+(fr%2),4,1,c[2]);rect(p.x-s*8,p.y+2-(fr%2),4,1,c[3]);
}

/* ===================== ARENAS ===================== */
const MAPS=[
  {id:'summit',name:'Kurama Summit',stake:300,amb:'petal'},
  {id:'temple',name:'Blood Moon Temple',stake:1000,amb:'ember'},
  {id:'yomi',name:'Gates of Yomi',stake:2500,amb:'wisp'},
  {id:'colosseum',name:'Oni Colosseum',stake:null,min:5000,max:50000,amb:'gold'},
  {id:'bridge',name:'Sunset Bridge',tourney:true,amb:'fire'},
  {id:'castle',name:'Daimyo Castle',tourney:true,amb:'spark'},
  {id:'hall',name:"Shogun's Hall",tourney:true,amb:'ember'},
  {id:'launchpad',name:'The Launchpad',stake:10000,amb:'spark'},
  {id:'helipad',name:'Sky Helipad',tourney:true,amb:'spark'}
];
const BG=[];
function mkRnd(seed){return()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};}
function bands(cols,h){for(let i=0;i<cols.length;i++){rect(0,i*h,W,h,cols[i]);if(i>0)for(let x=0;x<W;x+=2){px(x+(i%2),i*h,cols[i-1]);px(x+((i+1)%2),i*h+2,cols[i-1]);}}}
function kanji(list,color,size){G.textAlign='center';G.textBaseline='middle';G.font=(size||12)+'px serif';G.fillStyle=color;list.forEach(([k,a,b])=>G.fillText(k,a,b));}
function lantern(lx,ly,body,core){rect(lx,0,1,ly-8,'#2A0C0D');G.fillStyle='rgba(255,106,0,.14)';G.beginPath();G.arc(lx,ly,14,0,Math.PI*2);G.fill();
  rect(lx-3,ly-9,7,2,'#1A0506');ell(lx,ly,5,7,body);ell(lx,ly,3,5,core);rect(lx-5,ly-2,11,1,'#00000055');rect(lx-5,ly+3,11,1,'#00000055');rect(lx-3,ly+7,7,2,'#1A0506');}
function buildSummit(){
  const r=mkRnd(5);
  // bright sky
  const sky=['#5FB4F0','#72C0F2','#86CBF4','#9AD5F5','#AEDEF6','#C2E7F7','#D6EFF8'];bands(sky,12);
  disc(250,26,13,'#FFF4C8');disc(250,26,10,'#FFFFFF');
  const cloud=(x,y,w)=>{ell(x,y,w,4,'#FFFFFF');ell(x-w*0.4,y+2,w*0.6,3,'#F2F8FC');ell(x+w*0.4,y+1,w*0.5,3,'#FFFFFF');};
  cloud(60,22,20);cloud(170,14,26);cloud(290,40,16);cloud(120,46,14);
  // far sea
  rect(0,62,W,12,'#2F7FC8');rect(0,62,W,1,'#9AD5F5');for(let i=0;i<50;i++)rect(r()*W,63+r()*10,2+r()*4,1,'#BFE4FF');
  // distant islands
  ell(40,62,22,3,'#4C8FB0');ell(210,62,14,2,'#4C8FB0');
  // plains with patchwork fields and a river
  rect(0,74,W,40,'#7CC46A');
  const fieldC=['#8ED27A','#A6DA6E','#C8E06A','#6FB85E','#E2D27A','#94CC84'];
  for(let y=74;y<114;y+=5)for(let x=-10;x<W;){const w=10+r()*22;rect(x,y,w,5,fieldC[Math.floor(r()*fieldC.length)]);rect(x,y,w,1,'rgba(255,255,255,.18)');x+=w;}
  let rx=150;for(let y=74;y<114;y++){rx+=Math.round((r()-0.5)*3);rect(rx,y,3+Math.floor((y-74)/10),1,'#5AA8E0');}
  for(let i=0;i<9;i++){const vx=20+r()*280,vy=80+r()*28;rect(vx,vy,4,3,'#F3E9E4');rect(vx-1,vy-1,6,1,'#C1121F');}
  // forested mountainside below the summit
  rect(0,112,W,30,'#4E7E4E');for(let x=0;x<W;x+=2)rect(x,110+Math.round(Math.sin(x*0.07)*2),2,3,'#5A8A55');
  for(let i=0;i<70;i++){const tx=r()*W,ty=114+r()*24;rect(tx,ty,1,3,'#2E4A2E');rect(tx-1,ty+1,3,2,'#3E6A40');px(tx,ty-1,'#3E6A40');}
  for(let i=0;i<30;i++)px(r()*W,113+r()*26,'#7FB070');
  // side mountains
  const slope=(x0,dir,top,c,cs)=>{for(let i=0;i<150;i++){const x=x0+dir*i;const h=Math.max(0,top-i*0.9+Math.sin(i*0.25)*3);rect(x,150-h,1,h,c);if(i%3===0)px(x,150-h,cs);}};
  slope(0,1,95,'#6A8A7A','#E8F0F0');slope(W-1,-1,88,'#6A8A7A','#E8F0F0');
  slope(0,1,66,'#4F7A5A','#7FA880');slope(W-1,-1,60,'#4F7A5A','#7FA880');
  // summit plateau
  rect(0,140,W,40,'#8A7A66');for(let x=0;x<W;x+=2)rect(x,138+Math.round(Math.sin(x*0.1)*2),2,3,'#9A8A74');
  rect(0,150,W,30,'#7A6A58');rect(0,150,W,1,'#B0A088');
  for(let i=0;i<40;i++){const gx=r()*W,gy=151+r()*26;rect(gx,gy,4+r()*8,2,'#6A5A4A');}
  for(let i=0;i<22;i++){const gx=r()*W;rect(gx,149,1,3,'#5FA85A');rect(gx+2,148,1,4,'#6FB85E');}
  // shrine gate and sacred rope
  rect(18,96,4,54,'#C1121F');rect(62,96,4,54,'#C1121F');rect(12,92,60,4,'#D7262E');rect(12,92,60,1,'#FF6B5E');px(11,91,'#D7262E');px(72,91,'#D7262E');rect(16,102,52,3,'#C1121F');
  for(let x=22;x<62;x+=1)px(x,109+Math.round(Math.sin((x-22)/40*Math.PI)*3),'#E8D9A0');
  [30,40,50].forEach(x=>{rect(x,112,1,5,'#FFFFFF');rect(x+1,114,1,4,'#FFFFFF');});
  // cherry tree on the right edge
  rect(292,100,5,50,'#5A3A2A');rect(286,108,8,3,'#5A3A2A');rect(280,104,8,3,'#5A3A2A');
  for(let i=0;i<60;i++){const a=r()*6.28,d=r()*22;rect(290+Math.cos(a)*d*1.2,94+Math.sin(a)*d*0.7,3,3,r()<0.5?'#FFB7D0':'#FF8FB8');}
  G.fillStyle='rgba(255,183,208,.0)';
}
function buildBridge(){
  const r=mkRnd(71);
  bands(['#2A1A4A','#4A2256','#7A2E56','#B8424A','#E0683A','#F29444','#F8BC62'],13);
  // sun on the horizon
  for(let k=5;k>=0;k--){G.fillStyle=`rgba(255,${180+k*10},${90+k*20},${0.08+k*0.02})`;G.beginPath();G.arc(206,84,26+k*6,0,Math.PI*2);G.fill();}
  disc(206,84,20,'#FFB24A');disc(206,84,17,'#FFD27A');disc(202,80,9,'#FFF0B8');
  // mountains
  const ridge=(base,amp,c,seed)=>{for(let x=0;x<W;x++){const h=amp*(0.55+0.45*Math.sin(x*0.02+seed)+0.2*Math.sin(x*0.07+seed*2));rect(x,base-h,1,h+2,c);}};
  ridge(86,26,'#5A2A5A',1);ridge(88,14,'#3E1E48',4);
  // lake with sun reflection
  rect(0,88,W,62,'#2E3A6A');for(let y=90;y<150;y+=3)rect(0,y,W,1,'#34427A');
  for(let y=90;y<150;y+=2){const w=Math.round(18-((y-90)/60)*8+Math.sin(y)*3);rect(206-w,y,w*2,1,y%4?'#F29444':'#FFD27A');}
  for(let i=0;i<60;i++)rect(r()*W,90+r()*58,2+r()*3,1,'#6A7AB0');
  // floating lanterns
  for(let i=0;i<9;i++){const lx=20+r()*280,ly=108+r()*36;rect(lx,ly,4,3,'#FF9A3A');px(lx+1,ly-1,'#FFE08A');rect(lx,ly+3,4,1,'#5A2A1A');G.fillStyle='rgba(255,154,58,.18)';G.fillRect(lx-2,ly+4,8,2);}
  // pines
  const pine=(x,h)=>{rect(x,150-h,2,h,'#1A0E1E');for(let k=0;k<5;k++){const w=10-k*1.6;rect(x-w+1,150-h+k*6+2,w*2,4,'#1E1428');}};
  pine(14,62);pine(30,48);pine(300,58);pine(284,44);
  // bridge railing (behind the fighters)
  rect(0,126,W,4,'#C1121F');rect(0,126,W,1,'#FF5A4E');rect(0,138,W,2,'#9A0E18');
  for(let x=8;x<W;x+=40){rect(x,122,4,28,'#C1121F');rect(x+1,122,1,28,'#FF5A4E');disc(x+2,120,3,'#E0B040');px(x+1,118,'#FFE08A');}
  // wooden deck
  rect(0,150,W,30,'#6A3A22');rect(0,150,W,2,'#9A5A32');for(let y=154;y<H;y+=5)rect(0,y,W,1,'#4A2616');
  for(let x=0;x<W;x+=26)rect(x+((Math.floor(x/26))%2)*8,152,1,28,'#4A2616');
}
function buildCastle(){
  const r=mkRnd(83);
  bands(['#060A22','#0A1030','#0E163C','#131C48','#182254','#1C2860'],20);
  for(let i=0;i<70;i++)px(r()*W,r()*100,r()<0.2?'#FFE08A':'#AFC0FF');
  disc(52,36,16,'#FFF4C8');disc(52,36,14,'#FFFBE8');ell(47,31,4,2,'#FFFFFF');px(57,40,'#E8DCB0');px(50,42,'#E8DCB0');
  // fireworks
  const burst=(cx,cy,rad,c1,c2)=>{for(let a=0;a<6.28;a+=0.26){for(let k=3;k<=rad;k+=3){px(cx+Math.cos(a)*k,cy+Math.sin(a)*k,k>rad-4?c2:c1);}}disc(cx,cy,2,'#FFFFFF');};
  burst(250,30,16,'#FF5A4E','#FFD27A');burst(292,58,11,'#2EC4B6','#BFFFF8');burst(206,20,9,'#FFB000','#FFFFFF');
  // castle keep
  const cx=160;
  rect(cx-54,104,108,34,'#4A4A58');for(let y=106;y<138;y+=6)for(let x=cx-54+((y/6)%2)*6;x<cx+54;x+=12)rect(x,y,11,5,'#5A5A6A');
  const tier=(y,w,h)=>{rect(cx-w/2,y,w,h,'#E8E4DC');rect(cx-w/2,y,w,2,'#FFFFFF');for(let x=cx-w/2+6;x<cx+w/2-6;x+=12)rect(x,y+h/2-2,5,4,'#FFB24A');
    rect(cx-w/2-8,y-5,w+16,5,'#2A2F45');px(cx-w/2-9,y-6,'#2A2F45');px(cx+w/2+8,y-6,'#2A2F45');rect(cx-w/2-6,y-6,w+12,1,'#4A5070');};
  tier(84,86,20);tier(66,66,18);tier(50,46,16);tier(38,28,12);
  rect(cx-10,30,20,4,'#2A2F45');px(cx-12,29,'#FFB000');px(cx+11,29,'#FFB000');rect(cx-13,26,3,3,'#FFB000');rect(cx+10,26,3,3,'#FFB000');
  // courtyard walls with tile caps
  rect(0,122,cx-58,20,'#E8E4DC');rect(cx+58,122,W,20,'#E8E4DC');rect(0,118,cx-56,4,'#2A2F45');rect(cx+56,118,W,4,'#2A2F45');
  for(let x=0;x<W;x+=6)if(x<cx-58||x>cx+58)px(x,117,'#4A5070');
  // clan banners
  [[24],[120],[200],[296]].forEach(([bx],i)=>{rect(bx,92,2,58,'#3A2A1A');rect(bx+2,94,12,34,i%2?'#F3E9E4':'#C1121F');disc(bx+8,110,4,i%2?'#C1121F':'#F3E9E4');});
  // pine
  rect(62,112,4,38,'#3A2A1A');[[50,108,20],[56,100,16],[62,94,12]].forEach(([x,y,w])=>rect(x,y,w,6,'#1E4A2E'));
  // raked gravel
  rect(0,150,W,30,'#8A8A94');rect(0,150,W,1,'#B0B0BA');for(let y=154;y<H;y+=4)for(let x=0;x<W;x+=2)px(x,y+Math.round(Math.sin(x*0.08)*1),'#7A7A84');
}
function buildHall(){
  const r=mkRnd(97);
  rect(0,0,W,H,'#1A0E0A');
  // ceiling beams
  rect(0,0,W,14,'#2A1A12');for(let x=0;x<W;x+=40)rect(x,0,6,14,'#3A2418');rect(0,14,W,2,'#8A5A20');
  // gold folding screens with pines and clouds
  for(let i=0;i<8;i++){const x=i*40,y=22;rect(x+1,y,38,104,i%2?'#D8A83A':'#C8962A');rect(x+1,y,38,2,'#FFE08A');rect(x+39,y,1,104,'#8A5A10');
    for(let k=0;k<30;k++)px(x+2+r()*36,y+2+r()*100,'#E8C060');}
  const cloud=(x,y,w)=>{ell(x,y,w,3,'#F3E9E4');ell(x+w*0.6,y-2,w*0.5,3,'#F3E9E4');};
  cloud(40,40,14);cloud(150,34,18);cloud(260,46,14);cloud(96,64,10);
  const pineB=(x,y)=>{rect(x,y,3,30,'#4A2A1A');rect(x-10,y+2,24,5,'#2E6A3A');rect(x-6,y-3,16,5,'#3A7A44');rect(x-14,y+10,18,4,'#2E6A3A');};
  pineB(70,70);pineB(236,64);
  // throne dais
  rect(116,104,88,22,'#5A1A12');rect(116,104,88,2,'#C88A20');rect(126,96,68,8,'#6A2016');rect(126,96,68,1,'#FFB000');
  rect(146,78,28,20,'#C1121F');rect(146,78,28,2,'#FF6B5E');
  // helmet on the throne
  ell(160,72,9,6,'#2A2A34');rect(151,72,18,4,'#2A2A34');rect(157,62,6,6,'#FFB000');px(155,61,'#FFB000');px(164,61,'#FFB000');
  // pillars
  [[8],[48],[272],[304]].forEach(([x])=>{rect(x,14,10,122,'#8E1015');rect(x+2,14,2,122,'#C1121F');rect(x-2,126,14,6,'#3A2418');rect(x-2,14,14,4,'#C88A20');});
  // hanging banners
  [[90],[222]].forEach(([x])=>{rect(x,16,16,40,'#8E1015');rect(x,16,16,2,'#FFB000');rect(x+4,52,8,6,'#8E1015');disc(x+8,30,5,'#FFB000');disc(x+8,30,3,'#8E1015');});
  // braziers
  [[34],[286]].forEach(([x])=>{rect(x-6,132,12,6,'#3A2A20');rect(x-2,138,4,12,'#2A1A12');G.fillStyle='rgba(255,140,40,.2)';G.beginPath();G.arc(x,126,18,0,Math.PI*2);G.fill();
    disc(x,128,5,'#FF6A00');disc(x,126,3,'#FFB000');px(x,122,'#FFF2A8');});
  // tatami floor
  rect(0,136,W,14,'#3A2418');rect(0,136,W,1,'#8A5A20');
  rect(0,150,W,30,'#B8B070');rect(0,150,W,1,'#E0D890');
  for(let x=0;x<W;x+=64)rect(x,150,2,30,'#2A3A2A');rect(0,164,W,2,'#2A3A2A');for(let x=32;x<W;x+=64)rect(x,164,2,16,'#2A3A2A');
  for(let i=0;i<120;i++)px(r()*W,151+r()*28,'#A8A060');
  G.fillStyle='rgba(255,200,90,.08)';G.fillRect(0,150,W,30);
}
function buildBamboo(){
  const r=mkRnd(3);bands(['#06140E','#0A1C14','#0E2419','#122C1E','#173524','#1C3F2A','#224A31'],22);
  disc(78,36,20,'#1E3A2A');disc(78,36,18,'#E8E4C8');disc(74,32,14,'#F6F2DC');ell(70,28,4,2,'#FFFFFF');
  for(let i=0;i<30;i++)px(r()*W,r()*80,'#CFE8C0');
  const stalk=(x,w,c,cd,node,top)=>{rect(x,top,w,150-top,c);rect(x+w-1,top,1,150-top,cd);for(let y=top+10;y<150;y+=14+Math.floor(r()*6)){rect(x-1,y,w+2,2,node);}
    for(let k=0;k<3;k++){const ly=top+10+r()*80;for(let j=0;j<7;j++)px(x+w+j,ly+j*0.5,'#2F6B3A');}};
  for(let i=0;i<22;i++)stalk(r()*W,3,'#123322','#0B2217','#1E4A30',20+r()*30);
  for(let i=0;i<14;i++)stalk(r()*W,5,'#2E6B3E','#1E4A2A','#4F9A5E',r()*20);
  [[40,120],[282,122]].forEach(([tx,ty])=>{rect(tx-5,ty,10,30,'#3A3A36');rect(tx-9,ty-4,18,4,'#4A4A44');rect(tx-4,ty+6,8,7,'#FFB000');rect(tx-3,ty+7,6,5,'#FFE08A');rect(tx-11,ty-7,22,3,'#4A4A44');G.fillStyle='rgba(255,176,0,.12)';G.beginPath();G.arc(tx,ty+9,16,0,Math.PI*2);G.fill();});
  rect(0,150,W,30,'#1D2A1E');rect(0,150,W,1,'#4F7A4A');for(let gx=0;gx<W;gx+=18)rect(gx,152,1,28,'#162118');for(let gy=160;gy<H;gy+=9)rect(0,gy,W,1,'#162118');
  for(let i=0;i<40;i++)px(r()*W,152+r()*26,r()<0.5?'#3F6B3A':'#6B8A4A');
  kanji([['竹',160,60]],'rgba(207,232,192,.18)',14);
}
function buildTemple(){
  const r=mkRnd(11);bands(['#070304','#0D0506','#140708','#1E090A','#2A0C0D','#3A1012','#4A1513'],22);
  for(let i=0;i<40;i++)px(r()*W,r()*80,r()<0.3?'#FF6A00':'#6B3A3A');
  disc(252,40,24,'#3A0A0C');disc(252,40,22,'#6E0B10');disc(252,40,21,'#8E1015');disc(248,36,16,'#B3161F');ell(244,31,5,3,'#D7262E');
  for(let k=0;k<9;k++)px(258+k,34+Math.round(k*0.7),'#5A0A0E');
  kanji([['呪',30,38],['鬼',74,22],['火',196,62],['刀',298,96],['桜',22,98],['甘',132,28]],'rgba(46,196,182,.32)',12);
  const pagoda=(cx,base,w,tiers)=>{let yy=base;for(let t=0;t<tiers;t++){const bw=w-t*6,h=12;rect(cx-bw/2+3,yy-h,bw-6,h,'#0B0506');rect(cx-bw/2-3,yy-h-3,bw+6,3,'#0B0506');
      px(cx-bw/2-4,yy-h-4,'#0B0506');px(cx+bw/2+3,yy-h-4,'#0B0506');if(r()<0.8)rect(cx-2,yy-h+4,4,4,'#FF6A00');yy-=h+3;}rect(cx-1,yy-8,2,8,'#0B0506');};
  pagoda(30,150,44,4);pagoda(290,150,40,3);pagoda(262,150,30,2);
  let x=0;while(x<W){const w=14+r()*20,h=12+r()*16;rect(x,150-h,w,h,'#120708');x+=w;}
  rect(98,72,6,78,'#6E0B10');rect(216,72,6,78,'#6E0B10');rect(99,72,2,78,'#8E1015');rect(217,72,2,78,'#8E1015');
  rect(84,64,152,6,'#8E1015');rect(84,64,152,2,'#B3161F');px(83,63,'#8E1015');px(82,62,'#8E1015');px(236,63,'#8E1015');px(237,62,'#8E1015');
  rect(92,78,136,4,'#6E0B10');rect(152,66,16,14,'#1A0506');kanji([['鬼',160,73]],'#FFB000',9);
  [[46,48],[274,74],[128,40]].forEach(([a,b])=>lantern(a,b,'#C1121F','#FF6A00'));
  rect(0,140,W,10,'rgba(193,18,31,.12)');rect(0,150,W,30,'#1A1111');rect(0,150,W,1,'#7A1A12');rect(0,151,W,1,'#2A0C0D');
  for(let gx=0;gx<W;gx+=24)rect(gx,152,1,28,'#241818');for(let gy=160;gy<H;gy+=8)rect(0,gy,W,1,'#241818');
  for(let i=0;i<20;i++)px(r()*W,156+r()*22,r()<0.5?'#FF6A00':'#7A1A12');
}
function buildYomi(){
  const r=mkRnd(23);bands(['#05030A','#090512','#0E071B','#140A24','#1A0D2C','#1F1034','#23123A'],22);
  for(let i=0;i<50;i++)px(r()*W,r()*100,r()<0.4?'#2EC4B6':'#4A3A6A');
  // great gate
  rect(104,34,112,116,'#07040C');rect(108,38,104,112,'#120B1C');rect(158,38,4,112,'#07040C');
  for(let k=0;k<6;k++){rect(112,48+k*17,42,1,'#1F1430');rect(166,48+k*17,42,1,'#1F1430');}
  rect(96,26,128,8,'#07040C');rect(92,22,136,4,'#1F1430');px(90,21,'#1F1430');px(229,21,'#1F1430');
  ell(160,30,7,4,'#3A0A0C');ell(160,30,5,3,'#C1121F');rect(159,28,2,5,'#FFB000');
  G.fillStyle='rgba(46,196,182,.10)';G.fillRect(108,120,104,30);
  kanji([['黄泉',160,90]],'rgba(46,196,182,.55)',14);
  // jagged rocks
  const rock=(x0,w,h,c)=>{for(let i=0;i<w;i++){const hh=Math.round(h*(0.5+0.5*Math.sin(i*0.35+x0))+r()*4);rect(x0+i,150-hh,1,hh,c);}};
  rock(0,100,50,'#0B0714');rock(220,100,54,'#0B0714');rock(0,90,26,'#140C20');rock(236,84,30,'#140C20');
  // hitodama flames
  [[40,70],[282,62],[70,104],[250,100]].forEach(([a,b])=>{G.fillStyle='rgba(46,196,182,.15)';G.beginPath();G.arc(a,b,10,0,Math.PI*2);G.fill();disc(a,b,3,'#2EC4B6');disc(a,b-1,2,'#BFFFF8');rect(a-1,b-6,2,3,'#2EC4B6');});
  // river of souls + floor
  rect(0,144,W,6,'#0C3A3A');for(let i=0;i<W;i+=3)px(i,145+((i*7)%4),'#2EC4B6');
  rect(0,150,W,30,'#120D18');rect(0,150,W,1,'#2EC4B6');
  for(let i=0;i<14;i++){let cx=r()*W,cy=154+r()*22;for(let k=0;k<8;k++){px(cx,cy,'#1E6B66');cx+=r()<0.5?1:-1;cy+=r()<0.5?1:0;}}
  for(let gy=160;gy<H;gy+=9)rect(0,gy,W,1,'#1A1222');
}
function buildColosseum(){
  const r=mkRnd(41);bands(['#0A0506','#120708','#1A0A0B','#220C0D','#2A0E0F'],22);
  // stands
  for(let t=0;t<6;t++){const yy=30+t*16;rect(0,yy,W,16,t%2?'#1A0E0E':'#221212');rect(0,yy,W,1,'#3A1A18');
    for(let x=2;x<W;x+=4){if(r()<0.85){const c=['#C1121F','#FFB000','#F3E9E4','#2F6FE0','#2EC4B6','#8A5A3A','#6B7593'][Math.floor(r()*7)];rect(x,yy+5+(x%3),2,2,c);rect(x,yy+8+(x%3),2,3,'#0E0808');}}}
  // banners
  [[30],[100],[220],[290]].forEach(([bx],i)=>{rect(bx-1,0,2,40,'#3A1A18');rect(bx-10,4,20,30,i%2?'#C1121F':'#1A0506');rect(bx-10,34,4,4,i%2?'#C1121F':'#1A0506');rect(bx+6,34,4,4,i%2?'#C1121F':'#1A0506');
    kanji([['鬼',bx,18]],i%2?'#FFB000':'#C1121F',12);});
  // spotlights
  G.fillStyle='rgba(255,236,190,.07)';G.beginPath();G.moveTo(60,0);G.lineTo(110,150);G.lineTo(160,150);G.closePath();G.fill();
  G.beginPath();G.moveTo(260,0);G.lineTo(160,150);G.lineTo(210,150);G.closePath();G.fill();
  // wall + torches
  rect(0,126,W,24,'#2A1614');rect(0,126,W,2,'#5A2A20');for(let x=0;x<W;x+=20)rect(x,128,1,22,'#1A0C0A');
  [[20],[160],[300]].forEach(([tx])=>{rect(tx-1,110,3,16,'#3A1A12');disc(tx,108,3,'#FF6A00');disc(tx,107,2,'#FFE08A');G.fillStyle='rgba(255,106,0,.15)';G.beginPath();G.arc(tx,108,12,0,Math.PI*2);G.fill();});
  // sand
  rect(0,150,W,30,'#6B4A2A');rect(0,150,W,1,'#A87A45');for(let i=0;i<260;i++)px(r()*W,151+r()*29,r()<0.5?'#7E5A34':'#58391E');
  ell(160,166,70,9,'rgba(193,18,31,.18)');
}

/* ===================== HI-RES ARENAS (480x270) ===================== */
const BGHI={};
function buildTempleHi(){
  const W=480,H=270,GROUND=232;const cvh=document.createElement('canvas');cvh.width=W;cvh.height=H;let g=cvh.getContext('2d');g.imageSmoothingEnabled=false;
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};const P=(x,y,c)=>R(x,y,1,1,c);
  const poly=(pts,c)=>hiPoly(g,pts,c);
  const disc=(cx,cy,r,c)=>{g.fillStyle=c;for(let dy=-r;dy<=r;dy++){const w=Math.round(Math.sqrt(r*r-dy*dy));g.fillRect(Math.round(cx-w),Math.round(cy+dy),w*2+1,1);}};
  let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
const sky=['#070304','#0B0405','#110607','#18080A','#210B0D','#2C0E10','#3A1213','#4A1715','#5C1D17','#6E2419'];
for(let i=0;i<sky.length;i++){R(0,i*20,W,20,sky[i]);if(i)for(let x=0;x<W;x+=2){P(x+(i%2),i*20,sky[i-1]);P(x+((i+1)%2),i*20+2,sky[i-1]);P(x+(i%2),i*20+4,sky[i-1]);}}
R(0,200,W,70,'#6E2419');
for(let i=0;i<110;i++){const x=rnd()*W,y=rnd()*130;P(x,y,rnd()<0.15?'#FFB06A':rnd()<0.5?'#8A5A5A':'#D8C0B0');}
// blood moon with glow and craters
for(let k=20;k>=1;k--){g.fillStyle='rgba(255,70,40,0.014)';g.beginPath();g.arc(372,78,36+k*3.4,0,Math.PI*2);g.fill();}
disc(372,78,36,'#5A0A0E');disc(372,78,34,'#8E1015');disc(368,74,30,'#B3161F');disc(363,69,22,'#D02A26');disc(356,62,10,'#E8483A');
for(const [x,y,r] of [[384,70,5],[364,92,4],[390,92,3],[352,80,3],[378,58,2],[396,78,2]]){disc(x,y,r,'#8E1015');disc(x-1,y-1,r-1,'#A8151D');}
// thin clouds over the moon
for(const [x,y,w] of [[300,70,110],[330,86,90],[270,104,70],[410,60,60]]){R(x,y,w,2,'rgba(26,6,8,.85)');R(x+8,y+2,w-24,1,'rgba(26,6,8,.6)');}
// mountains
const ridge=(base,amp,c,sd,f)=>{for(let x=0;x<W;x++){const h=amp*(0.55+0.45*Math.sin(x*f+sd)+0.18*Math.sin(x*f*3.3+sd*2));R(x,base-h,1,h+2,c);}};
ridge(176,46,'#2A0C0E',1.3,0.011);ridge(186,30,'#1E0809',4.1,0.017);
// pagodas with rim light and lit windows
function pagoda(cx,base,w,tiers,dark,rim){let y=base;for(let t=0;t<tiers;t++){const bw=w-t*9,h=17;
  R(cx-bw/2+4,y-h,bw-8,h,dark);for(let k=0;k<3;k++)R(cx-bw/2+8+k*((bw-20)/2),y-h+6,4,6,rnd()<0.8?'#FF8A2A':'#3A1010');
  poly([[cx-bw/2-8,y-h],[cx+bw/2+8,y-h],[cx+bw/2+2,y-h-5],[cx-bw/2-2,y-h-5]],dark);P(cx-bw/2-9,y-h-1,dark);P(cx+bw/2+9,y-h-1,dark);R(cx-bw/2-2,y-h-5,bw+4,1,rim);y-=h+5;}
  R(cx-1,y-12,3,12,dark);P(cx,y-13,rim);}
pagoda(44,212,60,5,'#0C0405','#5A1E16');pagoda(438,212,54,4,'#0C0405','#5A1E16');pagoda(398,212,40,3,'#0A0304','#4A1612');
// far roofs
let x=0;while(x<W){const w=24+rnd()*36,h=16+rnd()*20;R(x,212-h,w,h,'#120607');poly([[x-4,212-h],[x+w+4,212-h],[x+w-4,212-h-6],[x+4,212-h-6]],'#120607');x+=w+4;}
// fog band
for(let y=196;y<216;y++){g.fillStyle=`rgba(180,60,40,${0.06*(1-Math.abs(y-206)/10)})`;g.fillRect(0,y,W,1);}
// torii gate, shaded
const tc='#A0141C',tl='#D02A26',td='#6E0B10',bk='#1A0708';
R(150,106,10,110,tc);R(150,106,3,110,tl);R(157,106,3,110,td);R(320,106,10,110,tc);R(320,106,3,110,tl);R(327,106,3,110,td);
R(146,208,18,10,'#2A1210');R(316,208,18,10,'#2A1210');
poly([[120,92],[360,92],[368,84],[112,84]],bk);R(112,84,256,2,'#3A1A18');P(110,82,bk);P(111,83,bk);P(369,83,bk);P(370,82,bk);
R(128,92,224,8,tc);R(128,92,224,2,tl);R(128,98,224,2,td);R(140,114,200,6,tc);R(140,114,200,1,tl);R(140,119,200,1,td);
R(228,98,24,18,bk);R(230,100,20,14,'#2A0C0D');g.fillStyle='#FFB000';g.font='12px serif';g.textAlign='center';g.textBaseline='middle';g.fillText('鬼',240,107);
// hanging lanterns with glow
for(const [lx,ly] of [[80,70],[420,112],[196,58]]){R(lx,0,1,ly-11,'#2A0C0D');
  for(let k=14;k>=1;k--){g.fillStyle=`rgba(255,120,40,${0.018})`;g.beginPath();g.arc(lx,ly,6+k*2.6,0,Math.PI*2);g.fill();}
  R(lx-5,ly-12,11,3,'#1A0506');for(let dy=-9;dy<=9;dy++){const w=Math.round(8*Math.sqrt(1-(dy*dy)/100));R(lx-w,ly+dy,w*2+1,1,dy<-6||dy>6?'#8E1015':'#C1121F');}
  for(let dy=-7;dy<=7;dy++){const w=Math.round(5*Math.sqrt(1-(dy*dy)/64));R(lx-w,ly+dy,w*2+1,1,Math.abs(dy)<3?'#FFD27A':'#FF8A2A');}
  for(const dy of [-5,0,5])R(lx-8,ly+dy,17,1,'rgba(90,10,14,.6)');R(lx-5,ly+10,11,3,'#1A0506');R(lx,ly+13,1,4,'#C1121F');}
// stone floor with perspective and moon reflection
R(0,216,W,54,'#1E1413');
for(let y=216;y<H;y++){const t=(y-216)/54;g.fillStyle=`rgba(0,0,0,${0.35*(1-t)})`;g.fillRect(0,y,W,1);}
for(let i=-12;i<=12;i++){const x0=240+i*18,x1=240+i*62;for(let y=216;y<H;y++){const t=(y-216)/54;P(x0+(x1-x0)*t,y,'#2C1E1C');}}
for(const y of [219,224,231,240,252,266])R(0,y,W,1,'#2C1E1C');
R(0,216,W,1,'#8A2A1A');R(0,217,W,1,'#3A1414');
for(let y=220;y<H;y+=2){const w=Math.round(10+(y-220)*0.35+Math.sin(y)*3);R(372-w,y,w*2,1,`rgba(210,40,36,${0.22-(y-220)*0.003})`);}
for(let i=0;i<40;i++)P(rnd()*W,222+rnd()*46,rnd()<0.5?'#FF8A2A':'#6E2A1A');

  return cvh;
}

/* ===================== EYE COMFORT: calmer arenas ===================== */
const CALM={0:{s:.84,c:.9,b:.93},1:{s:.74,c:.88,b:.95},2:{s:.9,c:.92,b:.97},3:{s:.6,c:.8,b:.9},4:{s:.8,c:.88,b:.92},5:{s:.88,c:.92,b:.96},6:{s:.72,c:.85,b:.88},7:{s:.66,c:.85,b:.9},8:{s:.84,c:.9,b:.95}};
function calmArena(cv,p){if(!cv||!p)return cv;const g=cv.getContext('2d');const d=g.getImageData(0,0,cv.width,cv.height);const a=d.data;
  for(let i=0;i<a.length;i+=4){const l=0.299*a[i]+0.587*a[i+1]+0.114*a[i+2];
    for(let k=0;k<3;k++){let v=l+(a[i+k]-l)*p.s;v=(v-96)*p.c+96;v*=p.b;if(v>215)v=215+(v-215)*0.5;a[i+k]=v<0?0:v>255?255:v;}a[i+3]=255;}
  g.putImageData(d,0,0);return cv;}
const COMFORT={on:(()=>{try{return localStorage.getItem('oni-comfort')==='on';}catch(e){return false;}})()};
function buildAll(){[buildSummit,buildTemple,buildYomi,buildColosseum,buildBridge,buildCastle,buildHall].forEach((fn,i)=>{const c=document.createElement('canvas');c.width=W;c.height=H;G=c.getContext('2d');fn();BG[i]=c;});G=ctx;try{BGHI[1]=buildTempleHi();}catch(e){}
  const HIB={0:'buildSummitHi',2:'buildYomiHi',3:'buildColosseumHi',4:'buildBridgeHi',5:'buildCastleHi',6:'buildHallHi',7:'buildLaunchpadHi',8:'buildHelipadHi'};
  for(const k in HIB){try{if(typeof window[HIB[k]]==='function')BGHI[k]=window[HIB[k]]();}catch(e){}}
  for(const k in BGHI){try{calmArena(BGHI[k],CALM[k]);}catch(e){}}
  if(!BG[7]){const c=document.createElement('canvas');c.width=W;c.height=H;const g2=c.getContext('2d');if(BGHI[7])g2.drawImage(BGHI[7],0,0,W,H);BG[7]=c;}}

/* ===================== FX ===================== */
const FX={sparks:[],pops:[],amb:[],aura:[],fin:null,shake:0,flash:0};
function sparks(x,y,n,cols){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,sp=0.8+Math.random()*2.4;FX.sparks.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-0.6,life:10+Math.random()*12,c:cols[i%cols.length]});}}
function pop(text,x,y,c){FX.pops.push({text,x,y,life:50,c});}
function updFx(mapI){
  for(const s of FX.sparks){s.x+=s.vx;s.y+=s.vy;s.vy+=0.12;s.life--;}FX.sparks=FX.sparks.filter(s=>s.life>0);
  for(const p of FX.pops){p.y-=0.35;p.life--;}FX.pops=FX.pops.filter(p=>p.life>0);
  const amb=MAPS[mapI].amb;
  if(Math.random()<(amb==='gold'?0.2:0.35)){
    if(amb==='spark')FX.amb.push({x:Math.random()*W,y:8+Math.random()*80,vx:0,vy:0.04,life:30+Math.random()*30,t:amb});
    else if(amb==='petal')FX.amb.push({x:-4+Math.random()*W*0.7,y:-4+Math.random()*60,vx:0.35+Math.random()*0.35,vy:0.18+Math.random()*0.2,life:260+Math.random()*120,t:amb});
    else if(amb==='fire')FX.amb.push({x:Math.random()*W,y:40+Math.random()*110,vx:(Math.random()-0.5)*0.3,vy:(Math.random()-0.5)*0.2,life:120+Math.random()*120,t:amb});
    else FX.amb.push({x:Math.random()*W,y:180,vx:(Math.random()-0.5)*0.3,vy:-0.3-Math.random()*0.5,life:160+Math.random()*120,t:amb});
  }
  for(const e of FX.amb){e.x+=e.vx+Math.sin(e.life*0.05)*0.15;e.y+=e.vy;e.life--;}FX.amb=FX.amb.filter(e=>e.life>0&&e.y>-4);if(FX.amb.length>160)FX.amb.splice(0,FX.amb.length-160);
  for(const a of FX.aura){a.y+=a.vy;a.x+=Math.sin(a.life*0.2)*0.2;a.life--;}FX.aura=FX.aura.filter(a=>a.life>0);
  if(FX.fin){FX.fin.t++;if(FX.fin.t>70)FX.fin=null;}
  if(COMFORT.on&&FX.shake>1.2)FX.shake=1.2;if(FX.shake>0)FX.shake*=0.85;if(FX.shake<0.3)FX.shake=0;if(FX.flash>0)FX.flash--;
}
function auraTick(m){for(const f of m.f){if(CH[f.ch].tier!==3||f.st==='ko')continue;if(Math.random()<0.45){const h=CH[f.ch].h;
  FX.aura.push({x:f.x+(Math.random()*2-1)*(CH[f.ch].w*GEO/2+5),y:f.y-Math.random()*h*GEO,vy:-0.35-Math.random()*0.4,life:26+Math.random()*16});}}}
function drawAura(){for(const a of FX.aura){G.globalAlpha=Math.min(1,a.life/20);px(a.x,a.y,a.life%10<5?'#FFB000':'#FFE08A');}G.globalAlpha=1;}
function drawFinisher(){const F=FX.fin;if(!F)return;const r=F.t*3.2;G.globalAlpha=Math.max(0,1-F.t/70);
  for(let a=0;a<6.28;a+=0.05){px(F.x+Math.cos(a)*r,F.y+Math.sin(a)*r*0.55,F.c);if(F.tier===3)px(F.x+Math.cos(a)*r*0.7,F.y+Math.sin(a)*r*0.4,'#FFE08A');}
  G.globalAlpha=1;if(F.t<60)txt(F.tier===3?'LEGENDARY FINISH':'FINISH!',160,146,F.tier===3?9:10,F.tier===3?'#FFD86A':'#F3E9E4','#1A0506');}
function drawAmb(mapI){
  for(const e of FX.amb){if(e.t!==MAPS[mapI].amb)continue;const a=Math.min(1,e.life/60);G.globalAlpha=a;
    const c=e.t==='spark'?(['#FFD27A','#FF5A4E','#BFFFF8','#FFFFFF'][Math.floor(e.x)%4]):e.t==='petal'?(e.life%20<10?'#FFB7D0':'#FF8FB8'):e.t==='fire'?(e.life%30<15?'#D8FF6A':'#6BD88A'):e.t==='wisp'?(e.life%40<20?'#2EC4B6':'#BFFFF8'):e.t==='gold'?'#FFB000':(e.life%40<20?'#FF6A00':'#FFB000');px(e.x,e.y,c);}
  G.globalAlpha=1;
  if(MAPS[mapI].id==='colosseum')for(let i=0;i<3;i++)if(Math.random()<0.5)px(Math.random()*W,34+Math.random()*90,'#FFFFFF');
}
function txt(s,x,y,size,fill,stroke,align){
  G.font=size+'px '+FONT;G.textAlign=align||'center';G.textBaseline='middle';
  if(stroke){G.fillStyle=stroke;const o=Math.max(1,Math.round(size/8));for(const [dx,dy] of [[-o,0],[o,0],[0,-o],[0,o],[-o,-o],[o,o],[-o,o],[o,-o],[0,o+1]])G.fillText(s,x+dx,y+dy);}
  G.fillStyle=fill;G.fillText(s,x,y);
}
const usd=c=>'$'+((c%100)?(c/100).toFixed(2):String(c/100));
const HUDTR=[null,null];
function hud(m,me){
  const bar=(x,f,col,right,idx)=>{const mh=(f.mhp||CH[f.ch].hp);const hp=Math.max(0,f.hp);HUDTR[idx]=HUDTR[idx]==null||HUDTR[idx]<hp?hp:Math.max(hp,HUDTR[idx]-mh*0.006);
    rect(x-2,8,124,11,'#1A0506');rect(x-1,9,122,9,'#5A3A2E');rect(x,10,120,7,'#24100C');
    const tw=Math.round(120*HUDTR[idx]/mh),w=Math.round(120*hp/mh);rect(right?x+120-tw:x,10,tw,7,'#FFF2D8');rect(right?x+120-w:x,10,w,7,col);rect(right?x+120-w:x,10,w,2,'rgba(255,255,255,.35)');rect(right?x+120-w:x,15,w,2,'rgba(0,0,0,.25)');
    rect(x-2,8,3,3,'#FFC93A');rect(x+119,8,3,3,'#FFC93A');};
  const P0=PAL[m.f[0].ch][palOf(m,0)],P1=PAL[m.f[1].ch][palOf(m,1)];
  bar(8,m.f[0],P0.main,false,0);bar(192,m.f[1],P1.main,true,1);
  for(let i=0;i<2;i++){const g=Math.min(100,m.f[i].guard||0);if(g>0){const w=Math.round(120*g/100);rect(i?312-w:8,18,w,2,g>70?'#FF6A00':'#FFE08A');}}
  const t30=CH[m.f[0].ch].tier===3,t31=CH[m.f[1].ch].tier===3;
  const dia=(dx,dy)=>{px(dx,dy-2,'#FFB000');rect(dx-1,dy-1,3,1,'#FFB000');rect(dx-2,dy,5,1,'#FFE08A');rect(dx-1,dy+1,3,1,'#FFB000');px(dx,dy+2,'#FFB000');};
  G.font='8px '+FONT;const n0=fname(m.f[0].ch,palOf(m,0),m.f[0].skin)+(me===0?' (YOU)':''),n1=(me===1?'(YOU) ':'')+fname(m.f[1].ch,palOf(m,1),m.f[1].skin);
  txt(n0,9,24,8,t30?'#FFC940':P0.name,'#1A0506','left');if(t30)dia(14+G.measureText(n0).width,24);
  txt(n1,311,24,8,t31?'#FFC940':P1.name,'#0A0506','right');if(t31)dia(306-G.measureText(n1).width,24);
  for(let i=0;i<((m.need||2)>5?0:(m.need||2));i++){disc(10+i*9,33,3,'#F3E9E4');disc(10+i*9,33,2,m.wins[0]>i?'#FFB000':'#1A0506');disc(310-i*9,33,3,'#F3E9E4');disc(310-i*9,33,2,m.wins[1]>i?'#FFB000':'#1A0506');}
  rect(144,5,32,22,'#1A0506');rect(145,6,30,20,'#5A3A2E');rect(146,7,28,18,'#2A0C0D');rect(146,7,28,2,'#3A1A16');rect(144,5,3,3,'#FFC93A');rect(173,5,3,3,'#FFC93A');txt(m.mode==='training'?'--':String(Math.max(0,Math.ceil(m.timer/60))),160,17,10,'#FFB000');
  if(m.stake>0)txt('POT '+usd(m.stake*2),160,33,6,'#FFB000','#1A0506');
  const meter=(x,v,right)=>{rect(x-1,169,62,6,'#F3E9E4');rect(x,170,60,4,'#1A0506');const w=Math.round(60*v/100);rect(right?x+60-w:x,170,w,4,v>=50?'#FF6A00':'#6E0B10');rect(x+30,170,1,4,'#F3E9E4');};
  meter(8,m.f[0].meter,false);meter(252,m.f[1].meter,true);
  const lab=v=>v>=100?'SUPER':'CURSE',lc=v=>v>=100&&frameN%20<12?'#FFE08A':'#FF6A00';
  txt(lab(m.f[0].meter),74,172,6,lc(m.f[0].meter),'#1A0506','left');txt(lab(m.f[1].meter),246,172,6,lc(m.f[1].meter),'#1A0506','right');
}
const PORT={};
function portrait(kit,side,pal){if(pal==null)pal=side;const key=kit+side+'_'+pal;if(PORT[key])return PORT[key];
  const c=document.createElement('canvas');c.width=128;c.height=144;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  if(typeof hiDrawAny!=='function'){const old=G;G=g;NOSHADOW=true;drawFighter({ch:kit,x:64,y:140,face:side?-1:1,st:'idle',t:0,flash:0,air:false},0,pal,1);NOSHADOW=false;G=old;PORT[key]=c;return c;}
  const f={ch:kit,x:0,y:0,face:side?-1:1,st:'idle',t:0,flash:0,air:false,crouch:false,atk:'punch',skin:kit==='oni'?(pal===2?'kin':pal===3?'kongo':pal===4?'genesis':null):null};
  const buf=hiRender(f,0,pal,null);const dx=kit==='ryu'?(side?-18:18):kit==='saru'?(side?-8:8):0;
  g.drawImage(buf,HAX-64-dx,HAY-138,128,144,0,0,128,144);PORT[key]=c;return c;}
function drawVS(m,t){
  rect(0,0,W,H,'#6E0B10');
  G.fillStyle='#0E1A45';G.beginPath();G.moveTo(W,0);G.lineTo(W,H);G.lineTo(0,H);G.lineTo(W*0.62,0);G.closePath();G.fill();
  G.fillStyle='#FFB000';G.beginPath();G.moveTo(W*0.62,0);G.lineTo(W*0.62+4,0);G.lineTo(4,H);G.lineTo(0,H);G.closePath();G.fill();
  for(let i=0;i<14;i++){const y=(i*29+t*3)%H;rect(0,y,W*0.5-i*6,1,'rgba(255,106,0,.18)');}
  const e=Math.min(1,t/30),sl=Math.round((1-e)*120);G.imageSmoothingEnabled=false;
  const a=portrait(m.f[0].ch,0,palOf(m,0)),b=portrait(m.f[1].ch,1,palOf(m,1));
  G.drawImage(a,8-sl,0,128*1.1,144*1.1);G.drawImage(b,W-8-128*1.1+sl,H-144*1.1+4,128*1.1,144*1.1);
  txt(fname(m.f[0].ch,palOf(m,0)),62-sl,160,11,PAL[m.f[0].ch][palOf(m,0)].name,'#1A0506');txt(fname(m.f[1].ch,palOf(m,1)),W-70+sl,20,11,PAL[m.f[1].ch][palOf(m,1)].name,'#0A1030');
  txt(MAPS[m.map].name.toUpperCase(),160,172,6,'#F3E9E4','#1A0506');
  if(t>30){const k=t<40?1+(40-t)*0.08:1;txt('VS',160,92,Math.round(34*k),'#FFB000','#2A1300');}
}

/* ===================== AUDIO ===================== */
const AU={c:null,m:null,muted:false,musicOn:false,next:0,step:0,timer:null};
function auInit(){if(AU.c)return;try{AU.c=new (window.AudioContext||window.webkitAudioContext)();AU.m=AU.c.createGain();AU.m.gain.value=AU.muted?0:0.9;AU.m.connect(AU.c.destination);}catch(e){AU.c=null;}}
function tone(f,d,type,vol,when,slide){if(!AU.c||mode==='demo')return;const t=AU.c.currentTime+(when||0);const o=AU.c.createOscillator(),g=AU.c.createGain();
  o.type=type||'square';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),t+d);
  g.gain.setValueAtTime(vol||0.15,t);g.gain.exponentialRampToValueAtTime(0.0008,t+d);o.connect(g);g.connect(AU.m);o.start(t);o.stop(t+d+0.02);}
function noise(d,vol,freq,when){if(!AU.c||mode==='demo')return;const t=AU.c.currentTime+(when||0);const n=Math.floor(AU.c.sampleRate*d);const b=AU.c.createBuffer(1,n,AU.c.sampleRate);const a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;
  const s=AU.c.createBufferSource();s.buffer=b;const fl=AU.c.createBiquadFilter();fl.type='bandpass';fl.frequency.value=freq||1500;const g=AU.c.createGain();g.gain.setValueAtTime(vol||0.2,t);g.gain.exponentialRampToValueAtTime(0.001,t+d);s.connect(fl);fl.connect(g);g.connect(AU.m);s.start(t);}
const SFX={
  swing(h){if(h)noise(0.12,0.2,900);else{noise(0.1,0.22,3600);tone(2400,0.08,'sine',0.05,0,1200);}},
  hit(h){tone(h?95:130,0.14,'square',0.26,0,40);noise(0.12,0.35,h?600:1100);},
  block(){tone(1480,0.25,'sine',0.14);tone(2210,0.2,'sine',0.08);noise(0.05,0.2,4200);},
  special(kit){if(kit===1){noise(0.25,0.25,2500);tone(300,0.3,'square',0.12,0,1200);tone(1320,0.3,'sine',0.1,0.12);}
    else if(kit===2){tone(90,0.6,'sawtooth',0.26,0,45);noise(0.55,0.3,380);}
    else if(kit===3){tone(600,0.25,'triangle',0.14,0,2400);noise(0.2,0.15,5000);}
    else if(kit===4){noise(0.4,0.3,1200);tone(900,0.4,'sawtooth',0.1,0,200);}
    else if(kit===5){tone(300,0.12,'sine',0.2,0,600);noise(0.15,0.15,1800,0.05);}
    else if(kit===7){tone(55,0.8,'sawtooth',0.3,0,30);noise(0.7,0.35,300);}
    else if(kit===6){tone(440,0.6,'sine',0.12,0,220);tone(452,0.6,'sine',0.12,0,226);}
    else{tone(180,0.45,'sawtooth',0.18,0,60);noise(0.45,0.25,500);}},
  splash(){noise(0.2,0.3,1600);tone(220,0.2,'sine',0.2,0,90);},
  clash(){tone(1320,0.35,'sine',0.16);tone(1980,0.3,'sine',0.1);noise(0.1,0.3,3000);},
  jump(){noise(0.08,0.15,2000);tone(600,0.08,'triangle',0.08,0,1200);},
  taiko(){tone(70,0.35,'sine',0.4,0,45);noise(0.08,0.2,200);},
  fight(){tone(60,0.5,'sawtooth',0.26,0,35);noise(0.35,0.3,300);},
  ko(){tone(98,1.8,'sine',0.35);tone(147,1.4,'sine',0.18);tone(196,1.0,'sine',0.08);noise(0.3,0.3,400);},
  win(){[69,72,76,81,84].forEach((n,i)=>tone(440*Math.pow(2,(n-69)/12),i===4?0.6:0.16,'triangle',0.2,i*0.12));},
  coin(){tone(1320,0.08,'triangle',0.18);tone(1760,0.3,'triangle',0.16,0.08);},
  select(){tone(1320,0.05,'triangle',0.14);}
};
const LEAD=[69,71,72,76,77,76,72,71,69,72,76,81,77,76,72,76,64,69,71,72,71,69,64,65,69,71,72,76,72,71,69,64];
const BASS=[45,45,52,45,41,41,48,41,43,43,50,43,40,40,47,40];
function musicStart(){if(!AU.c||AU.musicOn)return;AU.musicOn=true;AU.next=AU.c.currentTime+0.05;AU.step=0;
  AU.timer=setInterval(()=>{const sp=60/132/4;while(AU.next<AU.c.currentTime+0.12){const w=AU.next-AU.c.currentTime;
    if(AU.step%2===0)tone(440*Math.pow(2,(LEAD[(AU.step>>1)%32]-69)/12),sp*1.7,'square',0.03,w);
    if(AU.step%4===0)tone(440*Math.pow(2,(BASS[(AU.step>>2)%16]-69)/12),sp*3.5,'triangle',0.08,w);
    if(AU.step%8===0||AU.step%16===14)tone(62,0.25,'sine',0.2,w,40);
    if(AU.step%8===4)noise(0.05,0.06,2500,w);
    AU.step++;AU.next+=sp;}},25);}
function musicStop(){AU.musicOn=false;if(AU.timer)clearInterval(AU.timer);AU.timer=null;}
function setMute(v){AU.muted=v;if(AU.m)AU.m.gain.value=v?0:0.9;const mb=document.getElementById('mute');mb.textContent=v?'SOUND OFF':'SOUND ON';if(mb.dataset)mb.dataset.off=v?'1':'0';try{localStorage.setItem('oni-mute',v?'1':'0');}catch(e){}}

/* ===================== INPUT ===================== */
const held=new Set(),pressed=new Set();
const KEYMAP={KeyA:'L',ArrowLeft:'L',KeyD:'R',ArrowRight:'R',KeyW:'U',ArrowUp:'U',Space:'U',KeyS:'D',ArrowDown:'D',KeyJ:'P',KeyK:'K',KeyL:'S',KeyI:'T',KeyQ:'T',KeyE:'B',ShiftLeft:'B',ShiftRight:'B',KeyZ:'P',KeyX:'K',KeyC:'S',KeyV:'T'};
addEventListener('keydown',e=>{const k=KEYMAP[e.code];if(!k)return;const tag=document.activeElement&&document.activeElement.tagName;if(tag==='INPUT'||tag==='BUTTON'&&document.body.classList.contains('menu'))return;e.preventDefault();auInit();if(!held.has(k))pressed.add(k);held.add(k);});
addEventListener('keyup',e=>{const k=KEYMAP[e.code];if(k)held.delete(k);});
addEventListener('keydown',e=>{if(e.key!=='Escape')return;
  if(!document.body.classList.contains('menu')&&M){e.preventDefault();if(mode==='training'){$('tr-exit').click();}else $('quit').click();return;}
  const open=[...document.querySelectorAll('.panel.on')].map(p=>p.id);
  if(open.length&&!open.includes('p-title')&&!open.includes('p-end')&&mode==='title'){e.preventDefault();goHome();}});
addEventListener('blur',()=>{held.clear();padReset();});
/* ---- Touch controls: one d-pad zone (8-way from thumb position, slide to change direction) + an action cluster
   (nearest button wins, slide between buttons). Each pointer is tracked on its own, so both thumbs work at once. ---- */
const PAD={hold:new Map(),dirId:null,dir:'',btn:new Map()};
function hapticsOn(){try{return localStorage.getItem('oni-haptics')!=='0';}catch(e){return true;}}
function hap(ms){if(!hapticsOn())return;try{if(navigator.vibrate)navigator.vibrate(ms);}catch(e){}}
function padDown(k){const c=(PAD.hold.get(k)||0)+1;PAD.hold.set(k,c);if(c===1){if(!held.has('t'+k))pressed.add(k);held.add('t'+k);}}
function padUp(k){const c=(PAD.hold.get(k)||0)-1;if(c<=0){PAD.hold.delete(k);held.delete('t'+k);}else PAD.hold.set(k,c);}
function padPaint(){const st=document.getElementById('stick');if(st&&st.classList)for(const d of 'UDLR')st.classList.toggle('on'+d,PAD.dir.includes(d));
  document.querySelectorAll('#btns .pb').forEach(b=>b.classList.toggle('down',PAD.hold.has(b.dataset.k)));}
function padReset(){for(const k of PAD.hold.keys())held.delete('t'+k);PAD.hold.clear();PAD.btn.clear();PAD.dirId=null;PAD.dir='';padPaint();padNub(0,0);}
function dirOf(dx,dy,r){const len=Math.hypot(dx,dy);if(len<r*0.2)return '';const cx=dx/len,cy=dy/len;let d='';
  if(cy<-0.5)d+='U';else if(cy>0.38)d+='D';if(cx<-0.4)d+='L';else if(cx>0.4)d+='R';return d;}
function padSetDir(d){if(d===PAD.dir)return;for(const k of PAD.dir)if(!d.includes(k))padUp(k);for(const k of d)if(!PAD.dir.includes(k))padDown(k);
  if(d)hap(7);PAD.dir=d;padPaint();}
function padNub(x,y){const n=document.querySelector('#stick .nub');if(n&&n.style)n.style.transform=`translate(${x}px,${y}px)`;}
function padStick(e){const z=e.currentTarget.getBoundingClientRect();const r=Math.min(z.width,z.height)/2;const dx=e.clientX-(z.left+z.width/2),dy=e.clientY-(z.top+z.height/2);
  const l=Math.hypot(dx,dy),m=Math.min(1,r*0.55/(l||1));padNub(dx*m,dy*m);padSetDir(dirOf(dx,dy,r));}
function padNearest(x,y){let best=null,bd=1e9;document.querySelectorAll('#btns .pb').forEach(b=>{const r=b.getBoundingClientRect();if(!r.width)return;
  const dx=Math.max(r.left-x,0,x-r.right),dy=Math.max(r.top-y,0,y-r.bottom),d=Math.hypot(dx,dy);if(d<bd){bd=d;best=b.dataset.k;}});return bd<=22?best:null;}
function padBtn(id,k){const o=PAD.btn.get(id)||null;if(o===k)return;if(o)padUp(o);if(k){padDown(k);hap(12);}if(k)PAD.btn.set(id,k);else PAD.btn.delete(id);padPaint();}
(function padBind(){
  const st=document.getElementById('stick'),bt=document.getElementById('btns');
  const cap=(el,e)=>{try{el.setPointerCapture(e.pointerId);}catch(_){}};
  if(st&&st.addEventListener){
    st.addEventListener('pointerdown',e=>{e.preventDefault();auInit();if(PAD.dirId!=null&&PAD.dirId!==e.pointerId)return;PAD.dirId=e.pointerId;cap(st,e);padStick(e);});
    st.addEventListener('pointermove',e=>{if(e.pointerId===PAD.dirId)padStick(e);});
    const end=e=>{if(e.pointerId!==PAD.dirId)return;PAD.dirId=null;padSetDir('');padNub(0,0);};
    ['pointerup','pointercancel','lostpointercapture'].forEach(t=>st.addEventListener(t,end));}
  if(bt&&bt.addEventListener){
    bt.addEventListener('pointerdown',e=>{e.preventDefault();auInit();cap(bt,e);padBtn(e.pointerId,padNearest(e.clientX,e.clientY));});
    bt.addEventListener('pointermove',e=>{if(PAD.btn.has(e.pointerId)||e.buttons||e.pointerType==='touch'&&e.pressure>0)padBtn(e.pointerId,padNearest(e.clientX,e.clientY));});
    const end=e=>padBtn(e.pointerId,null);
    ['pointerup','pointercancel','lostpointercapture'].forEach(t=>bt.addEventListener(t,end));}
  const pd=document.getElementById('pad');
  if(pd&&pd.addEventListener){pd.addEventListener('contextmenu',e=>e.preventDefault());pd.addEventListener('touchstart',e=>{if(e.cancelable)e.preventDefault();},{passive:false});}
  // no long-press menus, pinch or double-tap zoom while a fight is on screen
  addEventListener('contextmenu',e=>{if(document.body.classList.contains('fight'))e.preventDefault();});
  addEventListener('gesturestart',e=>{if(document.body.classList.contains('fight'))e.preventDefault();});
  addEventListener('dblclick',e=>{if(document.body.classList.contains('fight'))e.preventDefault();});
})();
if(matchMedia('(pointer:coarse)').matches||('ontouchstart' in window))document.body.classList.add('touch');
const PRESS_COUNT={P:0,K:0,S:0,U:0,T:0,L:0,R:0};
function sampleInput(){
  let b=0;const has=k=>held.has(k)||held.has('t'+k)||pressed.has(k);
  if(has('L'))b|=IN.L;if(has('R'))b|=IN.R;if(has('U'))b|=IN.U;if(has('D'))b|=IN.D;if(has('P'))b|=IN.P;if(has('K'))b|=IN.K;if(has('S'))b|=IN.S;if(has('T'))b|=IN.T;
  if(has('B')&&typeof M!=='undefined'&&M&&M.f){const me=myIdx(),f=M.f[me];if(f){const back=f.face>0?IN.L:IN.R,fwd=f.face>0?IN.R:IN.L;b=(b&~fwd)|back;}}
  for(const k of ['P','K','S','U','T','L','R'])if(pressed.has(k))PRESS_COUNT[k]++;
  pressed.clear();return b;
}

/* ---- Fight screen on touch devices: layout state, camera, pause ---- */
const FIGHT_MODES=['cpu','host','tourney','training','boss','guest','spectate','net'];
function inFight(){return !!M&&FIGHT_MODES.includes(mode)&&!document.body.classList.contains('menu');}
const PXI={ // 9x9 pixel icons for the action buttons
  P:['.........','..#####..','.#######.','##.#.#.##','#########','#########','.#######.','..#####..','.........'],
  K:['..###....','..###....','..###....','..###....','..####...','..######.','..#######','..#######','.........'],
  S:['....#....','....##...','...###...','..####.#.','.#######.','.###.####','.##...###','.##...##.','..#####..'],
  T:['.#.#.#...','.#.#.#.#.','.#.#.#.#.','.#######.','.#######.','#.######.','##.####..','.#####...','..###....'],
  B:['#########','#.......#','#.#####.#','#.#####.#','.#.###.#.','.#.###.#.','..#.#.#..','...#.#...','....#....']};
function pxSvg(rows){let r='';rows.forEach((row,y)=>{for(let x=0;x<row.length;x++)if(row[x]==='#')r+=`M${x} ${y}h1v1h-1z`;});
  return `<svg viewBox="0 0 9 9" aria-hidden="true" shape-rendering="crispEdges"><path d="${r}" fill="currentColor"/></svg>`;}
function fightUiInit(){
  const hudEl=$('hud');if(!hudEl||typeof document.createElement!=='function')return;
  document.querySelectorAll('#btns .pb').forEach(b=>{const i=b.querySelector&&b.querySelector('i');if(i&&PXI[b.dataset.k])i.innerHTML=pxSvg(PXI[b.dataset.k]);});
  const mk=(id,label,fn)=>{const b=document.createElement('button');b.type='button';b.id=id;b.className='hb';b.setAttribute('aria-label',label);b.onclick=e=>{b.blur&&b.blur();fn(e);};return b;};
  const pz=mk('pz-b','Pause',()=>pauseOpen(false));const tt=mk('tr-tog','Training options',()=>{document.body.classList.toggle('tr-open');});
  if(hudEl.insertBefore){hudEl.insertBefore(pz,hudEl.firstChild);hudEl.insertBefore(tt,$('mute'));}
  const rh=$('rotate-hint');let rot='1';try{rot=localStorage.getItem('oni-rot')||'1';}catch(e){}
  if(rh&&hudEl.insertBefore){rh.textContent='↻ ROTATE';rh.setAttribute('role','button');rh.setAttribute('aria-label','Tip: turn your phone sideways for a wider view. Tap to hide.');rh.removeAttribute('aria-hidden');
    hudEl.insertBefore(rh,$('mute'));rh.onclick=()=>{document.body.classList.add('rot-off');try{localStorage.setItem('oni-rot','0');}catch(e){}};if(rot==='0')document.body.classList.add('rot-off');}
  const mb=$('mute');if(mb&&mb.dataset)mb.dataset.off=AU.muted?'1':'0';
  addEventListener('resize',()=>{CAM.dirty=true;});addEventListener('orientationchange',()=>{CAM.dirty=true;});
  if(document.addEventListener)document.addEventListener('visibilitychange',()=>{if(document.hidden){held.clear();padReset();pauseOpen(true);}});
  addEventListener('blur',()=>pauseOpen(true));
}
function camSync(){
  const b=document.body;if(!b.classList.contains('touch'))return;
  const f=inFight();
  if(f!==b.classList.contains('fight')){b.classList.toggle('fight',f);CAM.dirty=true;padReset();if(!f){pauseClose();b.classList.remove('tr-open');}}
  b.classList.toggle('training',f&&mode==='training');
  if(f!==CAM.on||CAM.dirty)camFit(f);
}
function camFit(on){CAM.dirty=false;CAM.on=on;CAM.init=false;let ph=180;
  if(on){const r=cv.getBoundingClientRect();if(r.width>0&&r.height>0)ph=Math.max(180,Math.min(288,Math.round(320*r.height/r.width)));}
  CAM.ph=ph;if(cv.width!==960)cv.width=960;if(cv.height!==ph*3)cv.height=ph*3;CAM.ectx.imageSmoothingEnabled=false;}
function camGrab(m){
  const e=CAM.ectx,PH=CAM.ph,a=m.f[0],b=m.f[1];
  const lo=Math.min(a.x,b.x),hi=Math.max(a.x,b.x);
  const ts=320/Math.max(188,Math.min(320,hi-lo+112)),tx=(lo+hi)/2;
  if(!CAM.init){CAM.init=true;CAM.s=ts;CAM.x=tx;CAM.y=null;}
  CAM.s+=(ts-CAM.s)*0.08;CAM.x+=(tx-CAM.x)*0.12;
  const s=CAM.s,ww=320/s,wh=PH/s,x0=Math.max(0,Math.min(320-ww,CAM.x-ww/2));
  let ty;if(wh>=180)ty=180-wh;else{const top=Math.min(a.y,b.y)-96;ty=Math.max(0,Math.min(180-wh,top-40/s));}
  CAM.y=CAM.y==null?ty:CAM.y+(ty-CAM.y)*0.15;const y0=wh>=180?ty:CAM.y;
  e.setTransform(1,0,0,1,0,0);e.imageSmoothingEnabled=false;e.fillStyle='#0A0506';e.fillRect(0,0,960,PH*3);
  const k=3*s,y1=Math.min(180,y0+wh),sy=Math.max(0,y0);
  if(y0<0){e.drawImage(CAM.buf,x0*3,0,ww*3,3,0,0,960,Math.ceil(-y0*k)+2);}
  e.drawImage(CAM.buf,x0*3,sy*3,ww*3,(y1-sy)*3,0,Math.round((sy-y0)*k),960,Math.round((y1-sy)*k));
  // bands behind the HUD so bars and names read on any background
  let g=e.createLinearGradient(0,0,0,150);g.addColorStop(0,'rgba(10,5,6,.72)');g.addColorStop(1,'rgba(10,5,6,0)');e.fillStyle=g;e.fillRect(0,0,960,150);
  g=e.createLinearGradient(0,PH*3-72,0,PH*3);g.addColorStop(0,'rgba(10,5,6,0)');g.addColorStop(1,'rgba(10,5,6,.6)');e.fillStyle=g;e.fillRect(0,PH*3-72,960,72);
  const c=CAM.bctx;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,960,540);CAM.grabbed=true;
}
function camPresent(){
  if(!CAM.on)return;const e=CAM.ectx,b=CAM.buf,PH=CAM.ph;if(!b)return;e.setTransform(1,0,0,1,0,0);e.imageSmoothingEnabled=false;
  if(!CAM.grabbed){e.fillStyle='#0A0506';e.fillRect(0,0,960,PH*3);e.drawImage(b,0,Math.round((PH-180)*1.5));return;}
  e.drawImage(b,0,0,960,120,0,0,960,120); // top HUD: bars, names, timer, rounds
  e.drawImage(b,0,486,960,54,0,PH*3-54,960,54); // bottom HUD: curse meters
  e.drawImage(b,0,120,960,366,0,120+Math.round((PH-180)*1.5),960,366); // centre: round calls, training readout
}
const PAUSE={on:false,el:null};
function pausable(){return ['cpu','training','tourney','boss'].includes(mode);}
function pauseBuild(){if(PAUSE.el)return PAUSE.el;const d=document.createElement('div');d.id='pause';d.hidden=true;d.setAttribute('role','dialog');d.setAttribute('aria-label','Paused');
  d.innerHTML='<div class="pz-card"><div class="pz-t">PAUSED</div><p class="pz-n" id="pz-n"></p><button type="button" class="pz-go" id="pz-res">Resume</button><div class="pz-row"><button type="button" id="pz-snd"></button><button type="button" id="pz-hap"></button></div><button type="button" class="pz-q" id="pz-quit">Quit match</button></div>';
  document.body.appendChild(d);PAUSE.el=d;
  d.addEventListener('pointerdown',e=>{if(e.target===d)pauseClose();});
  $('pz-res').onclick=()=>pauseClose();
  $('pz-snd').onclick=()=>{auInit();setMute(!AU.muted);pausePaint();};
  $('pz-hap').onclick=()=>{try{localStorage.setItem('oni-haptics',hapticsOn()?'0':'1');}catch(e){}pausePaint();hap(20);};
  $('pz-quit').onclick=()=>{pauseClose();$('quit').click();};return d;}
function pausePaint(){$('pz-snd').textContent='Sound: '+(AU.muted?'off':'on');$('pz-hap').textContent='Vibration: '+(hapticsOn()?'on':'off');
  $('pz-hap').hidden=!document.body.classList.contains('touch')||!navigator.vibrate;
  $('pz-n').textContent=pausable()?(mode==='tourney'?'Quitting forfeits this tournament match.':''):'Online match: the fight keeps running.';}
function pauseOpen(auto){if(!inFight()||(PAUSE.el&&!PAUSE.el.hidden))return;if(auto&&(!pausable()||!M||M.scene==='matchEnd'))return;
  const d=pauseBuild();PAUSE.on=pausable();padReset();pausePaint();d.hidden=false;document.body.classList.add('paused');const r=$('pz-res');if(r&&!auto&&!document.body.classList.contains('touch'))r.focus();}
function pauseClose(){PAUSE.on=false;if(PAUSE.el)PAUSE.el.hidden=true;document.body.classList.remove('paused');}

/* ===================== APP STATE + SELECT ===================== */
let mode='title',M=null,cpuMem={hold:0,bits:0,gap:false},level=0,frameN=0,lastEv=0,endShown=false,contT=0,cpuKit='ryu';
const $=id=>document.getElementById(id);
function show(id){if(id==='p-title'&&typeof VIL!=='undefined'&&VIL.active){id=null;mode='village';M=null;const tb=document.getElementById('trbar');if(tb)tb.hidden=true;const q=document.getElementById('quit');if(q)q.hidden=true;}
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('on',p.id===id));document.body.classList.toggle('menu',!!id);document.body.classList.toggle('landing',id==='p-landing');}
function streak(){try{return +localStorage.getItem('oni-streak')||0;}catch(e){return 0;}}
function setStreak(v){try{localStorage.setItem('oni-streak',String(v));}catch(e){}}
function refreshTitle(){const s=streak();const rl=(typeof rankLine==='function')?rankLine():'';$('streak').textContent=(rl?rl+' ':'')+(s>0?`CPU streak: ${s}.`:(rl?'':'Seven fighters, four arenas. Win two rounds to take the match.'));$('quit').hidden=true;}
function goHome(){if(typeof buildVillageBG==='function'){enterVillage();}else{show('p-landing');}}
function toTitle(){mode='title';M=null;const tb=document.getElementById('trbar');if(tb)tb.hidden=true;refreshTitle();musicStop();netLeave();goHome();}

const FIGHTERS=[
  {kit:'oni',tag:'Balanced. The fighter everyone starts with.',st:[3,3,3],mv:['Curse Flame','A fireball that crosses the whole arena.']},
  {kit:'saru',tag:'Staff master. The fastest fighter in the roster.',st:[5,2,2],mv:['Staff Strike','The staff shoots out across the arena. Also jumps twice.']},
  {kit:'kappa',tag:'Shell-backed guardian. The hardest to knock out.',st:[2,3,5],mv:['Counter Stance','Get hit during the stance and Genbu strikes back.']},
  {kit:'kitsune',tag:'Fox trickster wrapped in blue foxfire.',st:[5,3,2],mv:['Fox Blink','Teleports behind the opponent in a flash.']},
  {kit:'tengu',tag:'Crow warrior of the mountains.',st:[3,3,4],mv:['Sky Dive','Leaps and dives from the sky. Hold jump to glide.']},
  {kit:'ryu',tag:'Green dragon, guardian of the east. Slow and heavy.',st:[1,5,5],mv:['Dragon Fire','A huge fire blast at short range.']},
  {kit:'onryo',tag:'A vengeful shadow. Hard to catch, easy to break.',st:[4,3,2],mv:['Phase','Turns untouchable and walks through attacks.']}];
const TIER=[{n:'Free',label:'STARTER',c:'#C9A9A2',price:0},{n:'Tier 1',label:'RARE',c:'#C8CCD8',price:2000,perk:'A fighter with a unique move.'},{n:'Tier 2',label:'EPIC',c:'#D08CFF',price:8900,perk:'Unique move plus its own K.O. finisher.'},
  {n:'Tier 3',label:'LEGENDARY',c:'#FFB000',price:20000,perk:'Legendary aura, gold name, badge, legendary finisher and access to the Oni Colosseum.'}];
function tierBadge(t){return `<span class="tbadge t${t}">${TIER[t].label}</span>`;}
const OWN=new Set(['oni']);
const owns=k=>OWN.has(k);const hasT3=()=>[...OWN].some(k=>CH[k].tier===3);
function loadOwned(){try{JSON.parse(localStorage.getItem('oni-owned')||'[]').forEach(k=>{if(CH[k])OWN.add(k);});}catch(e){}}
function saveOwned(){try{localStorage.setItem('oni-owned',JSON.stringify([...OWN]));}catch(e){}try{if(typeof patchProfile==='function'&&myProfile()){const cur=(myProfile().owned||[]).slice().sort().join(',');const now=[...OWN].sort().join(',');if(cur!==now)patchProfile({owned:[...OWN]});}}catch(e){}
  if(typeof DB!=='undefined'&&DB.db&&DB.me)DB.db.collection('data/users/'+DB.me).doc('inv').set({owned:[...OWN],ts:Date.now()}).catch(()=>{});}
async function syncOwned(){if(!DB.db||!DB.me)return;try{const d=await DB.db.collection('data/users/'+DB.me).doc('inv').get();
  if(d.exists){let add=false;(d.data().owned||[]).forEach(k=>{if(CH[k]&&!OWN.has(k)){OWN.add(k);add=true;}});if(add){try{localStorage.setItem('oni-owned',JSON.stringify([...OWN]));}catch(e){}}}}catch(e){}}
loadOwned();
const SEL={kit:'oni',map:1,ctx:'cpu',fmt:'bo3',opal:0,low:300};
const LOWSTAKES=[[0,'Free','Half season points. Up to 5 airdrop points a day.'],[100,'$1','Smallest real stake. Full points. No $ONI needed.'],[300,'$3','Full points. No $ONI needed.']];
try{const v=+localStorage.getItem('oni-color');SEL.opal=v===1||v===4?v:0;}catch(e){}
const myPal=k=>k==='oni'?SEL.opal:0;
const FMTS={bo3:{need:2,hpMul:1,label:'Best of 3',desc:'First to win 2 rounds.'},ko:{need:1,hpMul:1,label:'Knockout',desc:'One round. No second chances.'}};
function fdef(k){return FIGHTERS.find(f=>f.kit===k);}
function barsHTML(st){return '<div class="bars">'+['Speed','Power','Health'].map((lb,i)=>`<span>${lb}</span><span class="bar"><i style="width:${st[i]*20}%"></i></span>`).join('')+'</div>';}
/* ---------- live fighter showcase ---------- */
const SHOWS=new Map();
function showcase(cv,kit,map,pal){if(!cv)return;const s=SHOWS.get(cv)||{t:0};if(s.kit!==kit){s.t=0;}s.kit=kit;s.map=map;s.pal=pal==null?myPal(kit):pal;SHOWS.set(cv,s);}
function godLayer(kind,fr,k,w,h,fx,fy,face){const L=document.createElement('canvas');L.width=w;L.height=h;const lg=L.getContext('2d');lg.imageSmoothingEnabled=false;
  lg.setTransform(face||1,0,0,1,fx,fy);drawGodClean(lg,kind,fr,k);lg.setTransform(1,0,0,1,0,0);
  const O=document.createElement('canvas');O.width=w;O.height=h;const og=O.getContext('2d');for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])og.drawImage(L,dx,dy);
  og.globalCompositeOperation='source-in';og.fillStyle='rgba(8,3,10,.95)';og.fillRect(0,0,w,h);og.globalCompositeOperation='source-over';og.drawImage(L,0,0);return O;}
function godPortrait(kind){const key='god'+kind;if(PORT[key])return PORT[key];const c=document.createElement('canvas');c.width=128;c.height=144;
  c.getContext('2d').drawImage(godLayer(kind,0,1.0,128,144,64,140),0,0);PORT[key]=c;return c;}
function drawShow(cv,s){
  const g=cv.getContext('2d');g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;const map=s.map|0;
  if(String(s.kit).startsWith('god:')){const kind=s.kit.slice(4);if(BGHI[2])g.drawImage(BGHI[2],-90,-99);g.fillStyle='rgba(20,10,40,.35)';g.fillRect(0,0,cv.width,cv.height);
    g.drawImage(godLayer(kind,s.t,1.45,300,165,150,138,kind==='fujin'?-1:1),0,0);return;}
  if(BGHI[map])g.drawImage(BGHI[map],-90,-99);else g.drawImage(BG[map],0,0,320,180,-90,-99,480,270);
  const kit=s.kit,c=CH[kit],sp=c.special;
  const seq=[['idle',60],['walk',48],['punch',c.punch.s+c.punch.a+c.punch.r+8],['kick',c.kick.s+c.kick.a+c.kick.r+8],['special',Math.max(sp.len||40,56)],['block',34],['win',64]];
  const total=seq.reduce((a,x)=>a+x[1],0);let tt=s.t%total,st='idle',lt=0;for(const [n,d] of seq){if(tt<d){st=n;lt=tt;break;}tt-=d;}
  const f={ch:kit,x:140,y:GROUND,face:1,st,t:lt,flash:0,air:false,phase:0,crouch:false,atk:st==='kick'?'kick':'punch',skin:kit==='oni'?(s.pal===2?'kin':s.pal===3?'kongo':s.pal===4?'genesis':null):null};
  if(st==='walk')f.x=140+(lt<24?lt:48-lt)*0.9;
  if(st==='special'){
    if(sp.type==='dive'){const up=Math.min(lt,sp.at);f.y=GROUND-up*2.6;if(lt>sp.at){f.y=Math.min(GROUND,GROUND-sp.at*2.6+(lt-sp.at)*3.4);f.x=140+(lt-sp.at)*3;}f.air=f.y<GROUND-0.5;if(!f.air&&lt>sp.at)f.st='idle';}
    if(sp.type==='blink'&&lt>=sp.at){f.x=196;f.face=-1;}
    if(sp.type==='phase'&&lt>=sp.at)f.phase=30;
  }
  const buf=hiRender(f,s.t,s.pal|0,RIM[map]||null);
  if(f.phase>0)g.globalAlpha=0.45;g.drawImage(buf,Math.round(f.x*1.5-HAX-90),Math.round(f.y*1.5-HAY-99));g.globalAlpha=1;
  const old=G;G=g;g.setTransform(1.5,0,0,1.5,-90,-99);
  if(st==='special'&&sp.type==='proj'&&lt>=sp.at){const dx=14*GEO+(lt-sp.at)*sp.vx;if(f.x+dx<270)drawProj({x:f.x+dx,y:GROUND-sp.y*GEO,vx:1,owner:0,r:sp.r*GEO,kit},s.t,s.pal|0);}
  if(st==='special'&&sp.type==='blink'&&lt>=sp.at&&lt<sp.at+8)for(let k=0;k<8;k++){px(140+Math.sin(k*2+lt)*8,GROUND-18+Math.cos(k*3)*10,'#7FE7FF');}
  if(CH[kit].tier===3&&s.t%3===0)for(let k=0;k<3;k++)px(f.x+(Math.random()*2-1)*16,f.y-Math.random()*CH[kit].h*GEO,Math.random()<0.5?'#FFB000':'#FFE08A');
  g.setTransform(1,0,0,1,0,0);G=old;
}
function tickShowcases(){for(const [cv,s] of SHOWS){if(!cv.isConnected||cv.offsetParent===null)continue;drawShow(cv,s);s.t++;}}
function fiHTML(kit,opts){
  const fd=fdef(kit),t=CH[kit].tier;
  let h=`${tierBadge(t)}<h3>${esc(CH[kit].name)}</h3><div>${esc(fd.tag)}</div><div><span class="mv">${esc(fd.mv[0])}:</span> ${esc(fd.mv[1])}</div>`+barsHTML(fd.st);
  if(opts&&opts.note)h+=`<div class="own">${opts.note}</div>`;
  return h;
}
function portraitEl2(kit,pal){const c=document.createElement('canvas');c.width=128;c.height=144;c.getContext('2d').drawImage(portrait(kit,0,pal==null?myPal(kit):pal),0,0);return c;}

/* ===================== FIGHTER POSTERS ===================== */
const POSTER={oni:['鬼','#8E1015','#2A0508'],saru:['猿','#C98A2E','#3A2208'],kappa:['亀','#3A8A4A','#0E2A14'],kitsune:['狐','#E07A30','#3A1408'],tengu:['烏','#3A3A5A','#0E0E1C'],ryu:['龍','#1F8A4A','#062A14'],onryo:['霊','#6A5A9A','#120E24'],enma:['閻','#B3161F','#1A0204']};
const POSTERS={};
function posterEl(kit,pal){if(typeof hiDrawAny!=='function')return portraitEl2(kit,pal);const key=kit+'_'+pal;let src=POSTERS[key];
  if(!src){const PW=240,PH=330;src=document.createElement('canvas');src.width=PW;src.height=PH;const g=src.getContext('2d');g.imageSmoothingEnabled=false;const [kj,c1,c2]=POSTER[kit]||POSTER.oni;
    const grd=g.createLinearGradient(0,0,0,PH);grd.addColorStop(0,c1);grd.addColorStop(1,c2);g.fillStyle=grd;g.fillRect(0,0,PW,PH);
    g.save();g.globalAlpha=0.12;g.fillStyle='#FFFFFF';for(let i=0;i<11;i++){g.beginPath();g.moveTo(PW/2,190);const a=-Math.PI/2+(i-5)*0.28;g.lineTo(PW/2+Math.cos(a-0.06)*420,190+Math.sin(a-0.06)*420);g.lineTo(PW/2+Math.cos(a+0.06)*420,190+Math.sin(a+0.06)*420);g.closePath();g.fill();}g.restore();
    g.save();g.globalAlpha=0.18;g.fillStyle='#FFFFFF';g.font='bold 170px serif';g.textAlign='center';g.textBaseline='middle';g.fillText(kj,PW/2,120);g.restore();
    const rg=g.createRadialGradient(PW/2,210,10,PW/2,210,120);rg.addColorStop(0,'rgba(255,240,210,.38)');rg.addColorStop(1,'rgba(255,240,210,0)');g.fillStyle=rg;g.fillRect(0,0,PW,PH);
    const f={ch:kit,x:0,y:0,face:1,st:'idle',t:0,flash:0,air:false,crouch:false,atk:'punch',skin:kit==='oni'?(pal===2?'kin':pal===3?'kongo':pal===4?'genesis':null):null};
    const buf=hiRender(f,0,pal,null);const dx=kit==='ryu'?14:kit==='saru'?6:kit==='enma'?0:0;const big=kit==='enma'||kit==='ryu';
    if(big)g.drawImage(buf,HAX-60-dx,HAY-150,120,150,0,30,240,300);else g.drawImage(buf,HAX-60-dx,HAY-142,120,148,0,26,240,296);
    const sh=g.createLinearGradient(0,PH-80,0,PH);sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(0,0,0,.8)');g.fillStyle=sh;g.fillRect(0,PH-80,PW,80);
    g.strokeStyle='rgba(255,224,138,.85)';g.lineWidth=3;g.strokeRect(1.5,1.5,PW-3,PH-3);POSTERS[key]=src;}
  const c=document.createElement('canvas');c.width=src.width;c.height=src.height;c.className='poster';c.getContext('2d').drawImage(src,0,0);return c;}
function buildFighterCards(){
  const row=$('fighters');row.innerHTML='';
  FIGHTERS.forEach(fd=>{
    const locked=!owns(fd.kit),t=CH[fd.kit].tier;
    const b=document.createElement('button');b.className='fc'+(locked?' locked':'');b.type='button';b.setAttribute('aria-pressed',SEL.kit===fd.kit?'true':'false');
    b.setAttribute('aria-label',CH[fd.kit].name+', '+TIER[t].label+(locked?', locked':''));
    const n=document.createElement('div');n.textContent=CH[fd.kit].name;
    const tl=document.createElement('div');tl.className='tl'+(t===3?' t3':'');tl.textContent=locked?'Locked':TIER[t].label;
    b.classList.add('pfc');b.append(posterEl(fd.kit,myPal(fd.kit)),n,tl);
    b.onclick=()=>{if(locked&&SEL.ctx==='online'){openStore(fd.kit);return;}SEL.kit=fd.kit;SFX.select();buildFighterCards();};
    row.appendChild(b);
  });
  const locked=!owns(SEL.kit);
  $('sel-fi').innerHTML=fiHTML(SEL.kit,{note:locked?(SEL.ctx==='cpu'?'Locked. Free to try against the CPU.':'Unlock this fighter in the market to play online.'):''});
  if(SEL.kit==='oni'){const row=document.createElement('div');row.className='colors';row.innerHTML='<span>Color</span>';
    [['Aka, red',0,'#D7262E'],['Ao, blue',1,'#2F6FE0']].concat(isFounder()?[['Genesis',4,'#FF3B30']]:[]).forEach(([lb,v,c])=>{const b=document.createElement('button');b.type='button';b.className='cpick';b.setAttribute('aria-pressed',SEL.opal===v?'true':'false');
      b.innerHTML=`<i style="background:${c}"></i>${lb}`;b.onclick=()=>{SEL.opal=v;try{localStorage.setItem('oni-color',String(v));}catch(e){}SFX.select();buildFighterCards();};row.appendChild(b);});
    $('sel-fi').appendChild(row);}
  showcase($('sel-cv'),SEL.kit,SEL.map);
}
const STORE={sel:'ryu',tab:'fighters',myth:null,cat:'fighters',rar:new Set(),avail:'all',trade:false,sort:'featured',open:false};

/* ===================== MARKET 2.0: prices in USD, paid in SOL, -20% with $ONI, bonuses ===================== */
const ONI_DISC=0.2;
const TIER_BONUS={1:{xp:500,items:[['emote','Emote pack: GG']]},2:{xp:1500,items:[['blade','Hellfire blade'],['emote','Emote pack: GG']]},3:{xp:3000,items:[['fin','K.O. finisher: Ink seal'],['frame','Sakura frame'],['pet','Pet: Tanuki']]}};
let INV=null;function inv(){if(!INV){const OLD1=['Coo','kie Inu'].join(''),OLD2=['Title: Coo','kie Champion'].join('');const RN={[OLD1]:'Mame Shiba',[OLD2]:'Title: Village Legend'};INV=LS.get('oni-inv',[]).map(n=>RN[n]||n).filter((n,i,a)=>a.indexOf(n)===i);LS.set('oni-inv',INV);}return INV;}
function grantBonus(t){const b=TIER_BONUS[t];if(!b)return;const I=inv();for(const [k,n] of b.items)if(!I.includes(n))I.push(n);LS.set('oni-inv',I);awardXP(b.xp,'purchase bonus');}
function payBlock(k,t){const price=TIER[t].price,disc=Math.round(price*(1-ONI_DISC));const b=TIER_BONUS[t];
  return `<div class="price">${usd(price)} <small class="cur">in SOL</small></div><div class="oni-deal">${usd(disc)} with $ONI <span>-20%</span></div>`+
    `<div class="bonus"><b>Bonus</b>${b.items.map(i=>`<span>${esc(i[1])}</span>`).join('')}<span>+${b.xp.toLocaleString()} XP</span></div><div class="perk">${esc(TIER[t].perk)}</div>`;}
function buyFighter(k,cur){const t=CH[k].tier;OWN.add(k);saveOwned();grantBonus(t);SFX.coin();SFX.win();toast(CH[k].name+' unlocked ('+cur+', demo)');renderStore();}
/* art for items that are coming */
const MKART={
 blade(cols,glow){const c=document.createElement('canvas');c.width=128;c.height=96;const g=c.getContext('2d');g.fillStyle='#14203A';g.fillRect(0,0,128,96);g.save();g.translate(64,48);g.rotate(-0.6);
   if(glow){g.fillStyle=glow;for(let k=6;k>0;k--){g.globalAlpha=0.06*k;g.fillRect(-46-k,-5-k,90+2*k,10+2*k);}g.globalAlpha=1;}
   g.fillStyle='#2A1A10';g.fillRect(-56,-3,20,6);g.fillStyle=cols[3];g.fillRect(-37,-7,4,14);g.fillStyle=cols[0];g.fillRect(-33,-3,80,6);g.fillStyle=cols[1];g.fillRect(-33,-3,80,2);g.fillStyle=cols[2];g.fillRect(-33,2,80,1);
   g.beginPath();g.moveTo(47,-3);g.lineTo(56,0);g.lineTo(47,3);g.fillStyle=cols[1];g.fill();g.restore();return c;},
 pet(draw){const c=document.createElement('canvas');c.width=128;c.height=96;const g=c.getContext('2d');g.fillStyle='#14203A';g.fillRect(0,0,128,96);g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(64,80,22,5,0,0,6.28);g.fill();draw(g,(x,y,r,col)=>{g.fillStyle=col;g.beginPath();g.arc(x,y,r,0,6.28);g.fill();});return c;},
 fin(draw){const c=document.createElement('canvas');c.width=128;c.height=96;const g=c.getContext('2d');g.fillStyle='#0E1424';g.fillRect(0,0,128,96);draw(g);g.fillStyle='#FFB000';g.font='10px "Press Start 2P"';g.textAlign='center';g.fillText('K.O.',64,88);return c;}};
function soonItems(){return [
 [MKART.blade(['#FF6A00','#FFE14A','#B3161F','#2A1A10'],'#FF6A00'),'Hellfire blade','$15','rare'],[MKART.blade(['#9FE8FF','#FFFFFF','#5AB8D8','#BFF4FF'],'#9FE8FF'),'Crystal blade','$35','epic'],
 [MKART.blade(['#FFC93A','#FFF2B0','#C88A00','#FFC93A'],'#FFC93A'),'Shogun gold','$99 · 300 only','ltd'],
 [MKART.blade(['#E8DCC0','#FFFFFF','#A8987A','#5A4A3A']),'Bone blade','$35','epic'],
 [MKART.pet((g,C)=>{C(64,58,15,'#22222E');C(64,50,10,'#2E2E3E');g.fillStyle='#FFC93A';g.beginPath();g.moveTo(72,50);g.lineTo(84,53);g.lineTo(72,55);g.fill();C(67,48,2,'#FF3B30');}),'Karasu crow','$12','rare'],
 [MKART.pet((g,C)=>{C(64,60,18,'#8A6A4A');C(64,66,11,'#E8D8B8');C(64,46,12,'#8A6A4A');g.fillStyle='#3A2A1A';g.fillRect(54,42,7,5);g.fillRect(67,42,7,5);C(50,36,4,'#6A4A2A');C(78,36,4,'#6A4A2A');}),'Tanuki','$12','rare'],
 [MKART.pet((g,C)=>{C(64,58,18,'#E07A30');C(64,62,12,'#FFF2DA');g.fillStyle='#E07A30';g.beginPath();g.moveTo(50,46);g.lineTo(46,28);g.lineTo(58,42);g.fill();g.beginPath();g.moveTo(78,46);g.lineTo(82,28);g.lineTo(70,42);g.fill();C(57,55,2.5,'#1A0506');C(71,55,2.5,'#1A0506');C(88,66,9,'#E07A30');C(40,34,4,'#7FE7FF');}),'Kitsune-bi','$12','rare'],
 [MKART.pet((g,C)=>{C(62,58,16,'#1F8A4A');C(62,64,10,'#E8D9A0');C(78,48,10,'#1F8A4A');C(82,46,2.5,'#FFE14A');g.fillStyle='#FFC93A';g.fillRect(74,32,3,9);g.fillRect(81,32,3,9);}),'Baby dragon','$25','epic'],
 [MKART.pet((g,C)=>{C(64,60,17,'#E0943A');C(58,66,7,'#FFF2DA');C(70,66,7,'#FFF2DA');C(64,44,12,'#E0943A');C(60,48,5,'#FFF2DA');C(68,48,5,'#FFF2DA');g.fillStyle='#E0943A';g.beginPath();g.moveTo(54,38);g.lineTo(52,26);g.lineTo(60,34);g.fill();g.beginPath();g.moveTo(74,38);g.lineTo(76,26);g.lineTo(68,34);g.fill();C(59,43,2,'#1A0506');C(69,43,2,'#1A0506');C(64,49,1.6,'#1A0506');C(84,58,5,'#E0943A');C(86,55,3,'#FFF2DA');}),'Mame Shiba','$30 · 500 only','ltd'],
 [MKART.fin(g=>{g.strokeStyle='#9FE8FF';g.lineWidth=3;g.beginPath();g.moveTo(70,4);g.lineTo(56,34);g.lineTo(72,38);g.lineTo(52,74);g.stroke();}),'Finisher: Thunder','$9','rare'],
 [MKART.fin(g=>{for(let i=0;i<40;i++){g.fillStyle=i%2?'#FFB7D0':'#FF8AB0';g.fillRect((i*37)%120+4,(i*23)%70+4,4,3);}}),'Finisher: Sakura storm','$9','rare'],
 [MKART.fin(g=>{g.fillStyle='#000';g.beginPath();g.arc(64,40,26,0,6.28);g.fill();g.fillStyle='#C1121F';g.font='22px serif';g.textAlign='center';g.fillText('鬼',64,48);}),'Finisher: Ink seal','$19','epic']];}
const RARC={rare:['#2F6FE0','RARE'],epic:['#8A3AC0','EPIC'],ltd:['#2EC4B6','LIMITED']};
function renderStoreInfo(){
  if(STORE.avatar){const a=STORE.avatar,A=AVATARS[a];const el=$('st-fi');const disc=Math.round(A.price*(1-ONI_DISC));const own=inv().includes(A.name);
    el.innerHTML=`<span class="tbadge t3">AVATAR</span><h3>${esc(A.name)}</h3><div>Walk the village in this look. Everyone sees it.${A.ltd?' '+A.ltd+' only, tradeable.':''}</div><div class="price">${usd(A.price)} <small class="cur">in SOL</small></div><div class="oni-deal">${usd(disc)} with $ONI <span>-20%</span></div>`;
    const ac=document.createElement('div');ac.className='acts';
    if(own){const b=document.createElement('button');b.className='arc gold';b.type='button';b.textContent=myAvatar()===a?'Equipped':'Equip';b.onclick=()=>{equipAvatar(a);renderStore();};ac.appendChild(b);}
    else for(const [lab,cur,cls] of [['Buy with SOL','SOL','gold'],['Buy with $ONI  -20%','$ONI','oni']]){const x=document.createElement('button');x.className='arc '+cls;x.type='button';x.textContent=lab;x.onclick=()=>buyAvatar(a,cur);ac.appendChild(x);}
    el.appendChild(ac);const cv=$('st-cv');SHOWS.delete(cv);const g=cv.getContext('2d');g.setTransform(1,0,0,1,0,0);g.fillStyle='#2E5A38';g.fillRect(0,0,300,165);
    const draw=k=>{g.setTransform(1,0,0,1,0,0);g.fillStyle='#2E5A38';g.fillRect(0,0,300,165);['down','right','left','up'].forEach((d,i)=>{g.setTransform(1,0,0,1,45+i*70,150);avatarDraw(g,0,0,d,a,(k>>3)%2,k);});g.setTransform(1,0,0,1,0,0);};
    let k=0;clearInterval(STORE.avT);STORE.avT=setInterval(()=>{if(!STORE.avatar||!$('p-store').classList.contains('on')){clearInterval(STORE.avT);return;}draw(k+=2);},60);draw(0);return;}
  clearInterval(STORE.avT);
  if(STORE.bundle){const b=BUNDLES.find(x=>x.id===STORE.bundle);const el=$('st-fi');const val=bundleValue(b);const disc=Math.round(b.price*(1-ONI_DISC));
    el.innerHTML=`<span class="tbadge t3">BUNDLE</span><h3>${esc(b.name)}</h3><div>${b.items.length} items, known before you buy.${b.ltd?' '+esc(b.ltd)+'.':''}</div>`+
      `<div class="bonus"><b>Contains</b>${b.items.map(n=>`<span>${esc(n)}</span>`).join('')}</div>`+
      `<div class="price">${usd(b.price)} <small class="cur">in SOL</small></div><div class="oni-deal">${usd(disc)} with $ONI <span>-20%</span></div><div class="perk">Worth ${usd(val)} bought one by one.</div>`;
    const a=document.createElement('div');a.className='acts';
    if(b.items.every(n=>inv().includes(n)))a.insertAdjacentHTML('beforeend','<span class="own">Owned</span>');
    else for(const [lab,cur,cls] of [['Buy with SOL','SOL','gold'],['Buy with $ONI  -20%','$ONI','oni']]){const x=document.createElement('button');x.className='arc '+cls;x.type='button';x.textContent=lab;x.onclick=()=>buyBundle(b.id,cur);a.appendChild(x);}
    el.appendChild(a);const cv=$('st-cv');const g=cv.getContext('2d');SHOWS.delete(cv);g.setTransform(1,0,0,1,0,0);g.fillStyle='#1C2029';g.fillRect(0,0,300,165);g.imageSmoothingEnabled=false;g.drawImage(bundleArt(b),54,10,192,144);return;}
  if(STORE.myth==='raijin'||STORE.myth==='fujin'){const r=STORE.myth==='raijin';const el=$('st-fi');
    el.innerHTML=`<span class="tbadge t6">GOD TIER</span><h3>${r?'Raijin':'Fujin'}</h3><div>${r?'God of thunder. A ring of taiko drums on his back and a diamond helmet with a lightning crest.':'God of wind. The wind bag over his shoulders and a diamond helmet with a crescent crest.'} 45% taller than any fighter.</div>`+
      `<div class="price">$1,199</div><div>Limited supply, coming before launch. To buy one: Samurai rank or higher, 50 ranked matches and an account at least 14 days old.</div><div class="own">Coming soon</div>`;
    showcase($('st-cv'),'god:'+STORE.myth,0,0);return;}
  if(STORE.myth==='boss'){const el=$('st-fi');
    el.innerHTML=`<span class="tbadge t5">PVE FINAL BOSS</span><h3>Shuten-doji</h3><div>The king of all oni. Brutally hard, but beatable.</div><div class="price">$1 a try</div>`+
      `<div>Every try fills the Curse Bag. When someone beats him, the whole bag buys $ONI and is locked in liquidity forever, and he comes back 10 levels stronger. The winner gets the Oni Slayer title and a trophy.</div><div class="own">Coming soon</div>`;
    showcase($('st-cv'),'god:raijin',0,0);return;}
  if(STORE.myth==='genesis'){const el=$('st-fi');const no=DB.me?founderNo(DB.me):0;
    el.innerHTML=`<span class="tbadge t5">FOUNDER</span><h3>Genesis Oni</h3><div>The first oni. Obsidian armor split by glowing red cracks, crimson horns and a crimson blade, with embers rising around him.</div>`+
      `<div class="price">Only 200</div><div>Given to the first 200 accounts, each one numbered. Unlike Mythic skins, the Genesis Oni will be tradeable on the marketplace.</div>`+
      `<div class="own">${isFounder()?'You are a Founder'+(no?' #'+no:'')+'. Pick Genesis in the ONI color choice.':foundersLeft()+' of 200 left. Create your account to claim one.'}</div>`;
    const a=document.createElement('div');a.className='acts';if(!isFounder()&&foundersLeft()>0){const b=document.createElement('button');b.className='arc gold';b.type='button';b.textContent='Create account';b.onclick=()=>openProfile();a.appendChild(b);}
    el.appendChild(a);showcase($('st-cv'),'oni',1,4);return;}
  if(STORE.myth){const kin=STORE.myth==='kin';const el=$('st-fi');
    el.innerHTML=`<span class="tbadge t4">MYTHIC</span><h3>${kin?'Kin-Oni':'Kongo-Oni'}</h3>`+
      `<div>${kin?'The gold Oni. Lacquered black armor, a golden mask and a golden blade, wrapped in drifting gold dust.':'The diamond Oni. White crystal armor, a crystal mask and a cyan blade that glitters like diamond.'}</div>`+
      `<div class="price">${kin?'Places 11 to 50':'Top 10'}</div><div>Earned by the best players of every 2-week season. Never sold, never traded, yours forever with the season on it.</div>`+
      `<div class="own">Same Oni, same strength. Pure status.</div>`;
    const a=document.createElement('div');a.className='acts';const b=document.createElement('button');b.className='arc alt';b.type='button';b.textContent='See the season ranking';
    b.onclick=()=>{SFX.select();DB.tab='lords';show('p-board');renderBoard();};a.appendChild(b);el.appendChild(a);
    showcase($('st-cv'),'oni',1,kin?2:3);return;}
  const k=STORE.sel,t=CH[k].tier;const el=$('st-fi');el.innerHTML=fiHTML(k);
  if(t>0)el.insertAdjacentHTML('beforeend',payBlock(k,t));
  const a=document.createElement('div');a.className='acts';
  if(owns(k)){a.insertAdjacentHTML('beforeend',`<span class="own">${t?'Owned':'Free for everyone'}</span>`);}
  else{for(const [lab,cur,cls] of [['Buy with SOL','SOL','gold'],['Buy with $ONI  -20%','$ONI','oni']]){const b=document.createElement('button');b.className='arc '+cls;b.type='button';b.textContent=lab;b.onclick=()=>buyFighter(k,cur);a.appendChild(b);}}
  const tr=document.createElement('button');tr.className='arc alt';tr.type='button';tr.textContent='Try vs CPU';tr.onclick=()=>{SEL.kit=k;openSelect('cpu');};a.appendChild(tr);
  el.appendChild(a);showcase($('st-cv'),k,[1,0,2,3][t]);
}

/* ===================== ONI HOLDER TIERS (demo) ===================== */
const ONI_USD=0.004, DEMO_ONI=12500;
const HOLD=[{n:'Gold',usd:1000,fee:3,perks:['Match fee 3%','Tenno Cup access','Battle Pass included (coming soon)','Gold name in the village']},{n:'Jade',usd:500,fee:3.5,perks:['Match fee 3.5%','Daimyo and Shogun Cup access','Battle Pass included (coming soon)','+10% airdrop points']},{n:'Silver',usd:100,fee:4,perks:['Match fee 4%','Daimyo and Shogun Cup access','Battle Pass included (coming soon)']},{n:'Bronze',usd:30,fee:5,perks:['Stakes above $3','+5% airdrop points']}];
function oniBal(){return myProfile()?DEMO_ONI:0;}
function holderTier(){const v=oniBal()*ONI_USD;return HOLD.find(t=>v>=t.usd)||null;}
function holderNext(){const v=oniBal()*ONI_USD;const up=[...HOLD].reverse().find(t=>v<t.usd);return up?{t:up,need:up.usd-v}:null;}
function tierNeedForStake(c){return c>300?'Bronze':null;}
const STAKE_MIN_ONI_USD=30;
function canStake(){return !!holderTier();}
function tierNeedForCup(c){return c.id==='tenno'?'Gold':(c.id==='daimyo'||c.id==='shogun')?'Silver':null;}
function holderCard(){const t=holderTier(),nx=holderNext();const v=oniBal()*ONI_USD;
  return `<div class="hold"><div class="hold-t"><span>ONI holder</span><b class="${t?t.n.toLowerCase():''}">${t?t.n:'None'}</b></div><div class="hold-v">${oniBal().toLocaleString()} $ONI ≈ ${usd(Math.round(v*100))}</div>`+
    (t?`<ul>${t.perks.map(p=>`<li>${p}</li>`).join('')}</ul>`:`<div class="hold-v">Hold $30 of $ONI for stakes above $3 (Bronze).</div>`)+(nx?`<div class="hold-n">${usd(Math.round(nx.need*100))} more for ${nx.t.n}</div>`:'')+`</div>`;}
/* ===================== BUNDLES ===================== */
const BUNDLES=[
 {id:'samurai',name:'Samurai bundle',items:['Hellfire blade','Sakura frame','Emote pack: GG'],price:1600,rar:'rare'},
 {id:'yokai',name:'Yokai bundle',items:['Kitsune-bi','Finisher: Sakura storm','Emote pack: Taunts'],price:1700,rar:'rare'},
 {id:'dragon',name:'Dragon bundle',items:['Baby dragon','Crystal blade','Finisher: Thunder'],price:4900,rar:'epic'},
 {id:'shadow',name:'Shadow bundle',items:['Bone blade','Finisher: Ink seal','Karasu crow'],price:4600,rar:'epic'},
 {id:'shiba',name:'Shiba bundle',items:['Mame Shiba','Shogun gold','Title: Village Legend'],price:9900,rar:'ltd',ltd:'300 only'}];
function bundleArt(b){const c=document.createElement('canvas');c.width=128;c.height=96;const g=c.getContext('2d');g.fillStyle='#232833';g.fillRect(0,0,128,96);
  const arts=soonItems();const pick=b.items.map(n=>(arts.find(a=>a[1]===n)||[])[0]).filter(Boolean).slice(0,3);
  pick.forEach((a,i)=>{g.save();g.globalAlpha=1;g.drawImage(a,8+i*30,8+i*10,72,54);g.restore();});
  g.fillStyle='rgba(245,184,65,.95)';g.fillRect(0,80,128,16);g.fillStyle='#14171D';g.font='bold 10px Inter, sans-serif';g.textAlign='center';g.fillText(b.items.length+' ITEMS',64,92);return c;}
function bundleValue(b){const L=marketItems();return b.items.reduce((s,n)=>{const it=L.find(x=>x.name===n);return s+(it?it.price:0);},0);}
function buyBundle(id,cur){const b=BUNDLES.find(x=>x.id===id);const I=inv();for(const n of b.items)if(!I.includes(n))I.push(n);LS.set('oni-inv',I);SFX.coin();SFX.win();toast(b.name+' unlocked ('+cur+', demo)');renderStore();}
/* ===================== REWARD CHESTS (earned, never sold) ===================== */
const CHEST_ODDS=[['Common',60,['Emote pack: GG','Emote pack: Taunts']],['Rare',30,['Hellfire blade','Kitsune-bi','Karasu crow','Finisher: Thunder','Sakura frame','Tanuki']],['Epic',9,['Crystal blade','Baby dragon','Finisher: Ink seal','Bone blade']],['Legendary',1,['Title: Demon of the Village']]];
function chests(){return LS.get('oni-chests',0);}
function addChest(n){LS.set('oni-chests',chests()+(n||1));}
function openChest(){if(chests()<1)return null;LS.set('oni-chests',chests()-1);let r=Math.random()*100,tier=CHEST_ODDS[0];for(const t of CHEST_ODDS){if(r<t[1]){tier=t;break;}r-=t[1];}
  const pool=tier[2];const item=pool[Math.floor(Math.random()*pool.length)];const I=inv();const dupe=I.includes(item);if(!dupe)I.push(item);LS.set('oni-inv',I);if(dupe)awardXP(150,'duplicate turned into XP');SFX.coin();return{tier:tier[0],item,dupe};}


/* ===================== TRADE: player to player (demo) ===================== */
const TRADE_FEE=0.05,BUYER_FEE=0.025,SELLER_FEE=0.025;
const oniAmt=c=>Math.round(c/100/ONI_USD).toLocaleString('en-US');
const DEMO_LISTINGS=[['Genesis Oni',14,'Vicape',42000],['Genesis Oni',61,'Hudson',45500],['Mame Shiba',233,'Hudson',6400],['Mame Shiba',41,'Genji',7200],['Shogun gold',91,'KurokageX',21000],
 ['Raijin',7,'Genji',240000],['Hellfire blade',1203,'Sakura',1800],['Kitsune-bi',844,'Kenji',1400],['Finisher: Ink seal',77,'Aiko',2400],['Crystal blade',312,'Vicape',3900],['Baby dragon',120,'TnSfan',2900]];
function myListings(){return LS.get('oni-listings',[]).map(l=>l.name===['Coo','kie Inu'].join('')?Object.assign({},l,{name:'Mame Shiba'}):l);}
function allListings(){const L=marketItems();const find=n=>L.find(x=>x.name===n);
  return DEMO_LISTINGS.map(([n,no,s,p],i)=>({id:'d'+i,name:n,no,seller:s,price:p,mine:false})).concat(myListings().map(x=>Object.assign({mine:true,seller:'You'},x))).map(x=>Object.assign(x,{it:find(x.name)}));}
function floorOf(name){const ps=allListings().filter(x=>x.name===name).map(x=>x.price);return ps.length?Math.min(...ps):0;}
function tradeableOwned(){const L=marketItems();const out=[];for(const n of inv()){const it=L.find(x=>x.name===n);if(it&&it.trade)out.push(it);}if(isFounder&&isFounder())out.push(L.find(x=>x.name==='Genesis Oni'));return out.filter(Boolean);}
function renderTrade(body){const LS2=allListings();const cat=STORE.tcat||'all';const sort=STORE.tsort||'low';
  let L=LS2.filter(x=>cat==='all'||(x.it&&x.it.cat===cat));L.sort(sort==='low'?(a,b)=>a.price-b.price:sort==='high'?(a,b)=>b.price-a.price:(a,b)=>(b.no||0)-(a.no||0));
  const vol=LS2.reduce((s,x)=>s+x.price,0)*0.35;
  body.innerHTML=`<div class="tr-stats"><div><b>${LS2.length}</b><span>Listings</span></div><div><b>${usd(Math.round(vol))}</b><span>24h volume</span></div><div><b>2.5% + 2.5%</b><span>Fee in $ONI · buyer + seller</span></div><div><b>${myListings().length}</b><span>Your listings</span></div></div>`+
    `<div class="mk-top"><span><select id="tr-cat">${[['all','All items'],['skins','ONI skins'],['god','God tier'],['weapons','Weapon skins'],['pets','Pets'],['finishers','K.O. finishers']].map(([k,l])=>`<option value="${k}" ${cat===k?'selected':''}>${l}</option>`).join('')}</select></span>`+
    `<label>Sort <select id="tr-sort">${[['low','Price: low to high'],['high','Price: high to low'],['new','Newest']].map(([k,l])=>`<option value="${k}" ${sort===k?'selected':''}>${l}</option>`).join('')}</select></label></div>`+
    `<div class="mk-row tr mk-hd"><span></span><span>Item</span><span class="hm">Seller</span><span class="num">Price</span><span class="num hm">Fee 2.5%</span><span class="num">Total</span><span></span></div>`;
  $('tr-cat').onchange=e=>{STORE.tcat=e.target.value;renderStore();};$('tr-sort').onchange=e=>{STORE.tsort=e.target.value;renderStore();};
  if(!L.length)body.insertAdjacentHTML('beforeend','<div class="mk-empty">No listings in this category yet.</div>');
  for(const x of L){const row=document.createElement('div');row.className='mk-row tr';const th=document.createElement('span');th.className='th';const tc=x.it?x.it.thumb():iconEl('board');tc.classList.add('mk-thumb');th.appendChild(tc);row.appendChild(th);
    const fl=floorOf(x.name);
    row.insertAdjacentHTML('beforeend',`<span class="nm"><b>${esc(x.name)} <span class="sn">#${String(x.no).padStart(3,'0')}</span></b>${x.it?`<i class="rb rbm" style="background:${RAR_COL[x.it.rar]}">${RAR_LABEL[x.it.rar]}</i>`:''}${x.price===fl?'<small class="trd">Floor price</small>':''}</span><span class="hm">${esc(x.seller)}<small class="flr">Floor ${usd(fl)}</small></span><span class="num pr">${usd(x.price)}</span><span class="num hm fee">${usd(Math.round(x.price*BUYER_FEE))}<small>${oniAmt(Math.round(x.price*BUYER_FEE))} $ONI</small></span><span class="num tot">${usd(x.price+Math.round(x.price*BUYER_FEE))}</span><span class="ac">${x.mine?'<button type="button" class="mk-st cancel">Cancel</button>':'<button type="button" class="mk-buy">Buy</button>'}</span>`);
    const bb=row.querySelector('.mk-buy');if(bb)bb.onclick=()=>{if(!confirm(`Buy ${x.name} #${x.no}\nPrice ${usd(x.price)} + fee ${usd(Math.round(x.price*BUYER_FEE))} (${oniAmt(Math.round(x.price*BUYER_FEE))} $ONI)\nTotal ${usd(x.price+Math.round(x.price*BUYER_FEE))} (demo)`))return;const I=inv();if(!I.includes(x.name))I.push(x.name);LS.set('oni-inv',I);DEMO_LISTINGS.splice(DEMO_LISTINGS.findIndex(d=>d[0]===x.name&&d[1]===x.no),1);SFX.coin();toast(`${x.name} #${x.no} is yours (demo)`);renderStore();};
    const cb=row.querySelector('.cancel');if(cb)cb.onclick=()=>{LS.set('oni-listings',myListings().filter(l=>l.id!==x.id));toast('Listing cancelled');renderStore();};
    body.appendChild(row);}
}
function renderMine(body){const L=marketItems().filter(it=>it.cat!=='bundles');const own=L.filter(it=>it.state==='owned'||inv().includes(it.name)||(it.name==='Genesis Oni'&&isFounder&&isFounder()));
  const listed=new Set(myListings().map(l=>l.name));
  body.innerHTML=`<div class="mk-top"><span>${own.length} items you own</span><span>Only tradeable items can be listed.</span></div><div class="mine-grid"></div><div id="list-form"></div>`;
  const grid=body.querySelector('.mine-grid');
  if(isAdmin(DB.me)){const d=document.createElement('div');d.className='mine adm';const th=document.createElement('div');th.className='th';const tc=avatarThumb('emperor');tc.classList.add('mk-thumb');th.appendChild(tc);d.appendChild(th);
    d.insertAdjacentHTML('beforeend','<b>Oni Emperor</b><i class="rb" style="background:#C49BFF">ADMIN</i>');const eq=document.createElement('button');eq.type='button';eq.className=myAvatar()==='emperor'?'mk-st ok':'mk-buy';eq.textContent=myAvatar()==='emperor'?'Equipped':'Equip';eq.onclick=()=>{equipAvatar(myAvatar()==='emperor'?'':'emperor');renderMine(body);};d.appendChild(eq);grid.appendChild(d);}
  for(const it of own){const d=document.createElement('div');d.className='mine';const tc=it.thumb();tc.classList.add('mk-thumb');const th=document.createElement('div');th.className='th';th.appendChild(tc);d.appendChild(th);
    d.insertAdjacentHTML('beforeend',`<b>${esc(it.name)}</b><i class="rb" style="background:${RAR_COL[it.rar]}">${RAR_LABEL[it.rar]}</i>`);
    if(it.cat==='avatars'){const eq=document.createElement('button');eq.type='button';eq.className=myAvatar()===it.avatar?'mk-st ok':'mk-buy';eq.textContent=myAvatar()===it.avatar?'Equipped':'Equip';eq.onclick=()=>{equipAvatar(myAvatar()===it.avatar?'':it.avatar);renderMine(body);};d.appendChild(eq);}
    if(it.trade){const btn=document.createElement('button');btn.type='button';btn.className=listed.has(it.name)?'mk-st':'mk-buy';btn.textContent=listed.has(it.name)?'Listed':'List for sale';btn.disabled=listed.has(it.name);btn.onclick=()=>listForm(it);d.appendChild(btn);}
    else d.insertAdjacentHTML('beforeend','<span class="mk-st">Account bound</span>');
    grid.appendChild(d);}
}
function listForm(it){const f=$('list-form');const fl=floorOf(it.name)||it.price||1000;
  f.innerHTML=`<div class="lf"><b>List ${esc(it.name)}</b><label>Price in $ (paid in SOL) <input id="lf-p" type="number" min="1" step="0.5" value="${(fl/100).toFixed(2)}"></label><div id="lf-calc"></div><div class="acts"><button type="button" class="mk-buy" id="lf-go">List for sale</button><button type="button" class="mk-st" id="lf-x">Cancel</button></div><small>Floor: ${usd(fl)}. You pay 2.5% in $ONI, the buyer pays 2.5% in $ONI. All trade fees in $ONI go to ONI's advertising.</small></div>`;
  const calc=()=>{const c=Math.round((parseFloat($('lf-p').value)||0)*100);$('lf-calc').innerHTML=`<span>Price ${usd(c)}</span><span>Your fee 2.5%: ${oniAmt(Math.round(c*SELLER_FEE))} $ONI (${usd(Math.round(c*SELLER_FEE))})</span><span class="get">You receive ${usd(c)}</span><span>Buyer pays ${usd(c+Math.round(c*BUYER_FEE))}</span>`;return c;};calc();$('lf-p').oninput=calc;
  $('lf-x').onclick=()=>{f.innerHTML='';};
  $('lf-go').onclick=()=>{const c=calc();if(c<100){toast('Minimum price is $1');return;}const L=myListings();L.push({id:'m'+Date.now(),name:it.name,no:1+Math.floor(Math.random()*999),price:c});LS.set('oni-listings',L);SFX.coin();toast('Listed for '+usd(c));openStore();STORE.view='trade';renderStore();};
  f.scrollIntoView({block:'center'});}


/* ===================== AVATAR SKINS (+ the admin-only Oni Emperor) ===================== */
function isAdmin(id){return !!(id&&DB.grants&&DB.grants[id]&&DB.grants[id].admin);}
function myAvatar(){const a=LS.get('oni-avatar','');if(a==='emperor')return isAdmin(DB.me)?a:'';return a&&AVATARS[a]&&inv().includes(AVATARS[a].name)?a:'';}
function equipAvatar(a){LS.set('oni-avatar',a||'');if(myProfile())patchProfile({avatar:a||null});SFX.select();toast(a?'Equipped: '+(a==='emperor'?'Oni Emperor':AVATARS[a].name):'Back to your fighter look');vilPublish(true);}
function avatarThumb(a){const c=document.createElement('canvas');c.width=128;c.height=128;const g=c.getContext('2d');g.fillStyle='#2E5A38';g.fillRect(0,0,128,128);g.setTransform(1,0,0,1,64,112);
  if(a==='emperor'){g.setTransform(1,0,0,1,64,118);emperorDraw(g,0,0,'right',0,12,0.72);}else avatarDraw(g,0,0,'down',a,0,12);return c;}
function buyAvatar(a,cur){const I=inv();if(!I.includes(AVATARS[a].name))I.push(AVATARS[a].name);LS.set('oni-inv',I);SFX.coin();SFX.win();toast(AVATARS[a].name+' unlocked ('+cur+', demo)');equipAvatar(a);renderStore();}
async function setAdmin(id,on){if(!DB.db){toast('Admins need the online version');return;}try{await DB.db.collection('grants').doc(id).set({admin:!!on,by:DB.me,ts:Date.now()});toast(on?'Admin granted: Oni Emperor unlocked':'Admin removed');}catch(e){toast('Only the owner of ONI can change admins');}}

/* ===================== MARKET 3.0: a filterable list ===================== */
setTimeout(()=>{const x=document.getElementById('mk-close');if(x)x.onclick=()=>{STORE.open=false;renderStore();};document.querySelectorAll('#mk-views [data-view]').forEach(b=>b.onclick=()=>{STORE.view=b.dataset.view;STORE.open=false;SFX.select();renderStore();});},0);
const RAR_ORDER={free:0,common:1,rare:2,epic:3,leg:4,ltd:5,myth:6,god:7};
const RAR_LABEL={free:'Free',common:'Common',rare:'Rare',epic:'Epic',leg:'Legendary',ltd:'Limited',myth:'Mythic',god:'God'};
const RAR_COL={free:'#7C8596',common:'#8A93A3',rare:'#3D7BE6',epic:'#9B5DE5',leg:'#F5B841',ltd:'#2EC4B6',myth:'#E5484D',god:'#7FD6F0'};
const CATS=[['fighters','Fighters'],['avatars','Avatars'],['bundles','Bundles'],['skins','ONI skins'],['weapons','Weapon skins'],['pets','Pets'],['finishers','K.O. finishers'],['emotes','Emotes'],['frames','Frames'],['god','God tier']];
function marketItems(){const L=[];const tr=['','rare','epic','leg'];
  FIGHTERS.forEach((fd,i)=>{const t=CH[fd.kit].tier;L.push({id:'f:'+fd.kit,cat:'fighters',name:CH[fd.kit].name,rar:t?tr[t]:'free',price:t?TIER[t].price:0,kit:fd.kit,state:owns(fd.kit)?'owned':(t?'buy':'owned'),trade:false,feat:i,thumb:()=>posterEl(fd.kit,myPal(fd.kit))});});
  L.push({id:'g:raijin',cat:'god',name:'Raijin',rar:'god',price:119900,state:'soon',trade:true,feat:20,myth:'raijin',thumb:()=>godPortrait('raijin')});
  L.push({id:'g:fujin',cat:'god',name:'Fujin',rar:'god',price:119900,state:'soon',trade:true,feat:21,myth:'fujin',thumb:()=>godPortrait('fujin')});
  [['Aka-Oni',0,'free','owned'],['Ao-Oni',1,'free','owned'],['Genesis Oni',4,'myth','founder'],['Kin-Oni',2,'myth','earned'],['Kongo-Oni',3,'myth','earned']].forEach(([n,pal,r,s],i)=>
    L.push({id:'s:'+n,cat:'skins',name:n,rar:r,price:0,state:s,trade:pal===4,feat:30+i,myth:pal===4?'genesis':pal===2?'kin':pal===3?'kongo':null,thumb:()=>portraitEl2('oni',pal)}));
  soonItems().forEach(([art,n,p,r],i)=>{const cat=/blade|gold/i.test(n)?'weapons':/Finisher/.test(n)?'finishers':'pets';const price=Math.round(parseFloat(p.replace('$',''))*100);
    L.push({id:'c:'+n,cat,name:n,rar:r,price,state:inv().includes(n)?'owned':'soon',trade:true,feat:40+i,thumb:()=>{const c=document.createElement('canvas');c.width=art.width;c.height=art.height;c.getContext('2d').drawImage(art,0,0);return c;},ltd:/only/.test(p)?p.split('·')[1].trim():null});});
  Object.entries(AVATARS).forEach(([k,a],i)=>L.push({id:'a:'+k,cat:'avatars',name:a.name,rar:a.ltd?'ltd':['rare','rare','epic'][i]||'epic',price:a.price,state:inv().includes(a.name)?'owned':'buy',trade:!!a.ltd,feat:5+i,avatar:k,ltd:a.ltd?a.ltd+' only':null,thumb:()=>avatarThumb(k)}));
  BUNDLES.forEach((b,i)=>L.push({id:'b:'+b.id,cat:'bundles',name:b.name,rar:b.rar,price:b.price,state:b.items.every(n=>inv().includes(n))?'owned':'buy',trade:false,feat:10+i,bundle:b.id,ltd:b.ltd||null,thumb:()=>bundleArt(b)}));
  L.push({id:'e:gg',cat:'emotes',name:'Emote pack: GG',rar:'common',price:300,state:inv().includes('Emote pack: GG')?'owned':'soon',trade:false,feat:60,thumb:()=>iconEl('missions')});
  L.push({id:'e:taunt',cat:'emotes',name:'Emote pack: Taunts',rar:'common',price:300,state:inv().includes('Emote pack: Taunts')?'owned':'soon',trade:false,feat:61,thumb:()=>iconEl('enma')});
  L.push({id:'fr:gold',cat:'frames',name:'Gold frame',rar:'common',price:0,state:'earned',trade:false,feat:70,note:'Lv 10 reward',thumb:()=>iconEl('board')});
  L.push({id:'fr:sakura',cat:'frames',name:'Sakura frame',rar:'rare',price:500,state:inv().includes('Sakura frame')?'owned':'soon',trade:true,feat:71,thumb:()=>iconEl('clans')});
  return L;}
function renderStore(){
  STORE.view=STORE.view||'shop';document.querySelectorAll('#mk-views [data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===STORE.view?'true':'false'));
  if(STORE.view!=='shop'){$('st-detail').hidden=true;$('mk-side').hidden=true;document.querySelector('.mk3').classList.add('solo');const body=$('store-body');
    const bal=$('mk-bal');if(bal&&!bal.innerHTML){}
    renderTrade(body);return;}
  $('mk-side').hidden=false;document.querySelector('.mk3').classList.remove('solo');
  renderStoreInfo();$('st-detail').hidden=!STORE.open;
  const bal=$('mk-bal');if(bal){const st=DB.me?statsOf(DB.me):{pnl:0};bal.innerHTML=`<span>Balance</span><b>${myProfile()?usd(10000+(st.pnl||0)):'-'}</b><span class="sep"></span><b class="oni">${myProfile()?'12,500':'-'} $ONI</b><small>demo</small>`;}
  const side=$('mk-side');
  if(!CATS.find(c=>c[0]===STORE.cat))STORE.cat='fighters';
  side.innerHTML=holderCard()+
    `<details class="mk-more"${STORE.fopen||(innerWidth>820&&innerHeight>500)?' open':''}><summary>Filters${STORE.rar.size||STORE.avail!=='all'||STORE.trade?' (on)':''}</summary><div class="mk-h">Rarity</div>`+['free','common','rare','epic','leg','ltd','myth','god'].map(r=>`<label class="mk-chk"><input type="checkbox" data-rar="${r}" ${STORE.rar.has(r)?'checked':''}><i style="background:${RAR_COL[r]}"></i>${RAR_LABEL[r]}</label>`).join('')+
    `<div class="mk-h">Status</div>`+[['all','All'],['buy','Buy now'],['owned','Owned'],['soon','Coming soon'],['earned','Earned only']].map(([k,l])=>`<label class="mk-chk"><input type="radio" name="mkav" data-av="${k}" ${STORE.avail===k?'checked':''}>${l}</label>`).join('')+
    `<label class="mk-chk tg"><input type="checkbox" id="mk-trade" ${STORE.trade?'checked':''}>Tradeable only</label></details>`;
  {const dm=side.querySelector('.mk-more');if(dm)dm.ontoggle=()=>{if(innerWidth<=820||innerHeight<=500)STORE.fopen=dm.open;};}
  side.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{STORE.cat=b.dataset.cat;renderStore();});
  side.querySelectorAll('[data-rar]').forEach(c=>c.onchange=()=>{c.checked?STORE.rar.add(c.dataset.rar):STORE.rar.delete(c.dataset.rar);renderStore();});
  side.querySelectorAll('[data-av]').forEach(c=>c.onchange=()=>{STORE.avail=c.dataset.av;renderStore();});
  $('mk-trade').onchange=e=>{STORE.trade=e.target.checked;renderStore();};
  let L=marketItems().filter(it=>(STORE.cat==='all'||it.cat===STORE.cat)&&(!STORE.rar.size||STORE.rar.has(it.rar))&&(!STORE.trade||it.trade)&&
    (STORE.avail==='all'||(STORE.avail==='earned'?(it.state==='earned'||it.state==='founder'):it.state===STORE.avail)));
  const S={featured:(a,b)=>a.feat-b.feat,low:(a,b)=>a.price-b.price,high:(a,b)=>b.price-a.price,rarity:(a,b)=>RAR_ORDER[b.rar]-RAR_ORDER[a.rar]}[STORE.sort];L.sort(S);
  const body=$('store-body');
  body.innerHTML=`<div class="mk-tabs" role="group" aria-label="Market sections">${CATS.map(([k,l])=>`<button type="button" class="mk-tab${STORE.cat===k?' on':''}" data-cat="${k}" aria-pressed="${STORE.cat===k}">${l}<small>${marketItems().filter(x=>x.cat===k).length}</small></button>`).join('')}</div>`+`<div class="mk-top"><span>${L.length} item${L.length===1?'':'s'}</span><label>Sort <select id="mk-sort">${[['featured','Featured'],['low','Price: low to high'],['high','Price: high to low'],['rarity','Rarity']].map(([k,l])=>`<option value="${k}" ${STORE.sort===k?'selected':''}>${l}</option>`).join('')}</select></label></div>`+
    `<div class="mk-row mk-hd"><span></span><span>Item</span><span class="hm">Category</span><span>Rarity</span><span class="num">Price</span><span class="num hm">With $ONI</span><span></span></div>`;
  $('mk-sort').onchange=e=>{STORE.sort=e.target.value;renderStore();};
  body.querySelectorAll('.mk-tab').forEach(b=>b.onclick=()=>{STORE.cat=b.dataset.cat;SFX.select();renderStore();});
  setTimeout(()=>body.querySelectorAll('[data-see]').forEach(b=>b.onclick=()=>{STORE.cat=b.dataset.see;renderStore();}),0);
  if(!L.length)body.insertAdjacentHTML('beforeend','<div class="mk-empty">No items match these filters.</div>');
  const grouped=false;let lastCat=null;
  if(grouped){const order=CATS.map(c=>c[0]);L.sort((a,b)=>(order.indexOf(a.cat)-order.indexOf(b.cat))||S(a,b));}
  for(const it of L){
    if(grouped&&it.cat!==lastCat){lastCat=it.cat;const n=L.filter(x=>x.cat===it.cat).length;body.insertAdjacentHTML('beforeend',`<div class="mk-group"><span>${(CATS.find(c=>c[0]===it.cat)||[0,''])[1]}</span><small>${n}</small><button type="button" class="mk-see" data-see="${it.cat}">See all</button></div>`);}
    const row=document.createElement('div');row.className='mk-row'+(STORE.open&&((it.kit&&!STORE.myth&&STORE.sel===it.kit)||(it.myth&&STORE.myth===it.myth))?' sel':'');
    const th=document.createElement('span');th.className='th';const tc=it.thumb();tc.classList.add('mk-thumb');th.appendChild(tc);row.appendChild(th);
    const catL=(CATS.find(c=>c[0]===it.cat)||[0,''])[1];
    const fmt=c=>'$'+(c/100).toLocaleString('en-US',{minimumFractionDigits:c%100?2:0,maximumFractionDigits:2});const pr=it.price?fmt(it.price):(it.state==='owned'?'Free':'-');const po=it.price?fmt(Math.round(it.price*(1-ONI_DISC))):'-';
    const act=it.state==='buy'?`<button type="button" class="mk-buy">Buy now</button>`:it.state==='owned'?`<span class="mk-st ok">Owned</span>`:it.state==='soon'?`<span class="mk-st">Soon</span>`:it.state==='founder'?`<span class="mk-st f">Founders</span>`:`<span class="mk-st">${it.note||'Earned'}</span>`;
    row.insertAdjacentHTML('beforeend',`<span class="nm"><b>${esc(it.name)}</b><i class="rb rbm" style="background:${RAR_COL[it.rar]}">${RAR_LABEL[it.rar]}</i>${it.ltd?`<small>${esc(it.ltd)}</small>`:''}${it.trade?'<small class="trd">Tradeable</small>':''}</span><span class="hm cat">${catL}</span><span><i class="rb" style="background:${RAR_COL[it.rar]}">${RAR_LABEL[it.rar]}</i></span><span class="num pr">${pr}</span><span class="num hm po">${po}</span><span class="ac">${act}</span>`);
    const openIt=()=>{STORE.bundle=null;STORE.avatar=null;if(it.avatar){STORE.avatar=it.avatar;STORE.myth=null;}else if(it.kit){STORE.sel=it.kit;STORE.myth=null;}else if(it.myth){STORE.myth=it.myth;}else if(it.bundle){STORE.bundle=it.bundle;STORE.myth=null;}else{toast(it.name+(it.state==='owned'?': owned':': coming soon'));return;}STORE.open=true;SFX.select();renderStore();$('p-store').scrollTop=0;};
    row.onclick=openIt;const bb=row.querySelector('.mk-buy');if(bb)bb.onclick=e=>{e.stopPropagation();openIt();};
    body.appendChild(row);}
}
function openStore(focus){STORE.sel=focus||STORE.sel;STORE.myth=null;STORE.tab='fighters';STORE.open=!!focus;STORE.view='shop';STORE.cat=focus&&CH[focus]?'fighters':(STORE.cat||'fighters');renderStore();show('p-store');$('p-store').scrollTop=0;}
document.querySelectorAll('#p-store [data-stab]').forEach(b=>b.onclick=()=>{STORE.tab=b.dataset.stab;SFX.select();renderStore();});
function stakeCents(){if(SEL.map===0)return SEL.low;const m=MAPS[SEL.map];if(m.stake)return m.stake;let v=Math.round(+$('amt').value||0);v=Math.max(50,Math.min(500,v));return v*100;}
const MAPTHUMB={};
function mapThumb(i){if(MAPTHUMB[i])return MAPTHUMB[i];const c=document.createElement('canvas');c.width=160;c.height=90;const g=c.getContext('2d');g.imageSmoothingEnabled=!!BGHI[i];g.drawImage(BGHI[i]||BG[i],0,0,160,90);MAPTHUMB[i]=c;return c;}
function buildMaps(){
  const row=$('maps');row.innerHTML='';if(SEL.ctx==='online'&&!MAPS[SEL.map].stake&&!hasT3())SEL.map=2;
  MAPS.forEach((mp,i)=>{
    if(mp.tourney)return;
    const vip=!mp.stake,lock=vip&&SEL.ctx==='online'&&!hasT3();
    const b=document.createElement('button');b.type='button';b.className='ar'+(vip?' vip':'')+(lock?' lock':'');b.setAttribute('aria-pressed',SEL.map===i?'true':'false');
    const c=document.createElement('canvas');c.width=160;c.height=90;c.getContext('2d').drawImage(mapThumb(i),0,0);
    const al=document.createElement('div');al.className='al';
    const right=SEL.ctx==='online'?(i===0?'Free to $3':mp.id==='launchpad'?'$100 LAUNCH BONUS':mp.stake?usd(mp.stake):(lock?'Legendary only':'No limit')):(vip?'VIP arena':'Free');
    al.innerHTML=`<span>${esc(mp.name)}</span><b>${right}</b>`;b.append(c,al);
    b.setAttribute('aria-label',mp.name+', '+right);
    b.onclick=()=>{if(lock){$('sel-note').innerHTML='The Oni Colosseum is the no-limit arena for owners of a <strong>Legendary</strong> fighter: Seiryu or Kage.';SFX.block();return;}SEL.map=i;SFX.select();buildMaps();renderMoney();showcase($('sel-cv'),SEL.kit,SEL.map);};
    row.appendChild(b);
  });
  $('nolimit').hidden=!(SEL.ctx==='online'&&!MAPS[SEL.map].stake);
  const ls=$('lowstake');ls.hidden=!(SEL.ctx==='online'&&SEL.map===0);ls.innerHTML='';
  if(!ls.hidden)LOWSTAKES.forEach(([c,l,d])=>{const b=document.createElement('button');b.type='button';b.className='fm';b.setAttribute('aria-pressed',SEL.low===c?'true':'false');
    b.innerHTML=`<b>${l}</b><small>${d}</small>`;b.onclick=()=>{SEL.low=c;SFX.select();buildMaps();renderMoney();};ls.appendChild(b);});
  showcase($('sel-cv'),SEL.kit,SEL.map);
}
const DIFFS=[['veryeasy','Very easy',-1],['easy','Easy',-0.5],['normal','Normal',0],['hard','Hard',3],['auto','Auto',null]];
function buildDiffs(){const row=$('diffs');if(!row)return;const on=SEL.ctx==='cpu';row.hidden=!on;$('diff-ttl').hidden=!on;if(!on)return;row.innerHTML='';SEL.diff=SEL.diff||LS.get('oni-diff','auto');
  DIFFS.forEach(([k,l])=>{const b=document.createElement('button');b.type='button';b.className='fmt';b.textContent=l;b.setAttribute('aria-pressed',SEL.diff===k?'true':'false');b.onclick=()=>{SEL.diff=k;LS.set('oni-diff',k);SFX.select();buildDiffs();};row.appendChild(b);});}
function diffLevel(){const d=DIFFS.find(x=>x[0]===(SEL.diff||'auto'));return d&&d[2]!=null?d[2]:Math.min(3,streak());}
function buildFormats(){buildDiffs();const row=$('fmts');row.innerHTML='';
  Object.entries(FMTS).forEach(([k,f])=>{const b=document.createElement('button');b.type='button';b.className='fm';b.setAttribute('aria-pressed',SEL.fmt===k?'true':'false');
    b.innerHTML=`${f.label}<small>${f.desc}</small>`;b.onclick=()=>{SEL.fmt=k;SFX.select();buildFormats();renderMoney();};row.appendChild(b);});}
function renderMoney(){
  const el=$('sel-money');$('sel-clock').innerHTML=`${FMTS[SEL.fmt].label}<b>${SEL.ctx==='online'?'Winner takes the pot':'No stake'}</b>`;
  if(SEL.ctx==='cpu'){el.innerHTML=`<div class="m-row"><span>Format</span><b>${FMTS[SEL.fmt].label}</b></div><div class="m-row"><span>Stake</span><b>Free</b></div><div class="m-foot">Practice against the CPU. It picks a random fighter.</div>`;return;}
  const st=stakeCents(),p=payout(st);
  if(MAPS[SEL.map].id==='launchpad'&&SEL.ctx==='online'){el.insertAdjacentHTML('afterbegin','');}
  if(st===0){el.innerHTML=`<div class="m-row"><span>Format</span><b>${FMTS[SEL.fmt].label}</b></div><div class="m-row big"><span>Stake</span><b>Free</b></div><div class="m-foot">Counts for rank. Half season points. 1 airdrop point per opponent a day, up to 5.</div>`;return;}
  el.innerHTML=`<div class="m-row"><span>Format</span><b>${FMTS[SEL.fmt].label}</b></div><div class="m-row"><span>Your stake</span><b>${usd(st)}</b></div><div class="m-row big"><span>Winner takes</span><b>${usd(p.win)}</b></div><div class="m-foot">Pot ${usd(p.pot)}, 5% fee: 1% rank rewards, 0.5% Curse Cauldron. Demo: no money moves.</div>`;
  {const need=tierNeedForStake(st);const t=holderTier();const fee=t?t.fee:5;el.insertAdjacentHTML('beforeend',`<div class="m-foot hold-note">${need?(canStake()?'':`<b>Stakes above $3 need $30 of $ONI.</b> `):''}Your match fee: ${fee}%${t?' ('+t.n+')':''}. Stakes are in SOL.</div>`);}
}
function selNote(){renderMoney();}
$('amt').addEventListener('input',renderMoney);
function openSelect(ctxName){
  SEL.ctx=ctxName;
  $('sel-kicker').textContent=ctxName==='online'?'ONI online':'ONI practice';
  $('sel-title').textContent=ctxName==='online'?'1v1 Match':'Practice';
  $('arena-ttl').textContent=ctxName==='online'?'Arena and stake':'Arena';
  buildFighterCards();buildFormats();buildMaps();renderMoney();$('sel-note').textContent=NET.avail===false&&ctxName==='online'?'Online play works when this page is opened on claude.ai and shared with your opponent.':'';
  const a=$('sel-actions');a.innerHTML='';
  const btn=(label,cls,fn,parent)=>{const b=document.createElement('button');b.className='arc '+(cls||'');b.type='button';b.textContent=label;b.onclick=fn;(parent||a).appendChild(b);return b;};
  if(ctxName==='cpu'){btn('Fight','gold',startCPU);btn('Arcade mode','',()=>{if(!owns(SEL.kit)){openStore(SEL.kit);return;}startArcade();});btn('Training mode','',startTraining);btn('Tutorial','alt',startTutorial);}
  else{
    const c=btn('Create match','gold',createMatch);c.disabled=!NET.avail;
    const jr=document.createElement('div');jr.className='joinrow';jr.innerHTML='<span class="or">Or join a friend</span>';a.appendChild(jr);
    const inp=document.createElement('input');inp.className='codein';inp.id='codein';inp.maxLength=4;inp.placeholder='CODE';inp.setAttribute('aria-label','Match code to join');inp.autocomplete='off';jr.appendChild(inp);
    const j=btn('Join','',joinMatch,jr);j.disabled=!NET.avail;inp.addEventListener('keydown',e=>{if(e.key==='Enter')joinMatch();});
  }
  show('p-select');$('p-select').scrollTop=0;
}
$('sel-back').onclick=()=>{SFX.select();goHome();};
function startCPU(){vilPublish(true,true);auInit();SFX.select();level=diffLevel();cpuKit=FIGHTERS[Math.floor(Math.random()*3)].kit;mode='cpu';
  M=mkMatch('cpu',0,[SEL.kit,cpuKit],SEL.map,Object.assign({pal:[myPal(SEL.kit),cpuKit==='oni'?1-myPal(SEL.kit):0]},FMTS[SEL.fmt]));cpuMem={hold:0,bits:0,gap:false};lastEv=0;endShown=false;show(null);$('quit').hidden=false;musicStart();}
$('b-cpu').onclick=()=>{auInit();SFX.select();openSelect('cpu');};
$('b-online').onclick=()=>{auInit();SFX.select();openSelect('online');};
$('b-help').onclick=openControls;
$('b-profile').onclick=openProfile;
$('b-tourney').onclick=openTourney;
$('b-boss').onclick=openBoss;
$('bs-back').onclick=()=>{SFX.select();goHome();};
$('c-back').onclick=()=>{SFX.select();goHome();};
$('b-training').onclick=()=>{auInit();SFX.select();openSelect('cpu');$('sel-note').innerHTML='Pick your fighter and arena, then press <strong>Training mode</strong>.';};
$('tn-back').onclick=()=>{SFX.select();goHome();};
$('br-back').onclick=()=>{SFX.select();TN=null;mode='title';openTourney();};
$('pf-back').onclick=()=>{SFX.select();PROFILE.draft=null;goHome();};
$('b-cauldron').onclick=()=>{auInit();SFX.select();openCauldrons();};
$('b-store').onclick=()=>{auInit();SFX.select();openStore();};
$('b-back4').onclick=()=>{SFX.select();goHome();};
$('b-board').onclick=()=>{auInit();SFX.select();show('p-board');renderBoard();};
$('b-back3').onclick=()=>{SFX.select();goHome();};
$('b-back2').onclick=()=>{SFX.select();show(mode==='title'?'p-title':null);};
$('b-cancel').onclick=()=>toTitle();
$('quit').onclick=()=>{if(mode==='tourney'&&M){M.winner=1;M.wins=[0,M.need||2];tourneyEnd();return;}toTitle();};
$('mute').onclick=()=>{auInit();setMute(!AU.muted);};
try{if(localStorage.getItem('oni-mute')==='1')setMute(true);}catch(e){}

function endPanel(){
  endShown=true;const me=myIdx();const won=M.winner===me;const row=$('end-row');row.innerHTML='';
  bump('games');misProgress('play3');if(won){bump('wins');misProgress('win2');}if(M.perfect&&won){bump('perfect');misProgress('perfect');}
  if(mode!=='training')awardXP((won?100:40)+(M.perfect&&won?25:0),won?'victory':'good fight');
  if(mode==='cpu'&&won)addShards(SHARD_WIN[SEL.diff||'auto']||10,'win vs CPU');
  if(mode==='host'||mode==='guest'||mode==='net')misProgress('online');if(mode==='boss')misProgress('enma');
  const btn=(label,cls,fn)=>{const b=document.createElement('button');b.className='arc '+(cls||'');b.textContent=label;b.onclick=fn;row.appendChild(b);return b;};
  const link=(label,href)=>{const a=document.createElement('a');a.className='arc';a.href=href;a.target='_blank';a.rel='noopener';a.textContent=label;row.appendChild(a);};
  const share='https://x.com/intent/post?text='+encodeURIComponent((won?`I just won a 1v1 as ${fname(M.f[me].ch,palOf(M,me))} in ONI`:'I lost a 1v1 in ONI. Rematch soon')+'. The curse you choose. theonicurse.xyz');
  if(mode==='boss'){
    const L=TR.bossL||1;
    if(won){const jar=TR.bossPaid?jarCents():0;recordBossKill(L);if(TR.bossPaid&&jar>0){payJackpot(jar);$('end-note').innerHTML=`<strong>Enma falls. You win the jar: ${usd(jar)}</strong> (demo). He rises again at level ${L+1}.${kycCheck(jar)}`;}else $('end-note').innerHTML=`<strong>Enma falls.</strong> ${TR.bossPaid?'':'Free try, no jar. '}He will rise again at level ${L+1}, for everyone.`;SFX.win();}
    else $('end-note').innerHTML=`Enma wins at level ${L}. His club is longer than yours: get close, block low, and punish.`;
    btn(won?'Face him again':'Try again','gold',startBoss);btn('Enma page','',()=>{mode='title';M=null;musicStop();openBoss();});btn('Menu','alt',toTitle);
  } else if(mode==='tourney'){
    const fin=TN&&TN.cur;$('end-note').textContent=won?'You advance.':'You are out of this round.';
    btn('Back to the bracket','gold',tourneyEnd);
  } else if(mode==='cpu'&&ARC.on){
    if(won){misProgress('arcade');ARC.i++;if(ARC.i>=ARC.list.length){ARC.on=false;bump('arcade');awardXP(200,'arcade cleared');addShards(SHARD_ARCADE,'arcade cleared');$('end-note').innerHTML='<strong>Arcade cleared!</strong> Every fighter and Enma, beaten.';SFX.win();btn('Menu','gold',toTitle);}
      else{$('end-note').textContent=`Opponent ${ARC.i} of ${ARC.list.length} down. Next: ${CH[ARC.list[ARC.i]].name}.`;btn('Next opponent','gold',arcadeMatch);btn('Quit Arcade','alt',()=>{ARC.on=false;toTitle();});}}
    else{$('end-note').textContent=`Arcade: lost to ${CH[ARC.list[ARC.i]].name} (${ARC.i+1} of ${ARC.list.length}).`;btn('Continue','gold',arcadeMatch);btn('Quit Arcade','alt',()=>{ARC.on=false;toTitle();});}
  } else if(mode==='cpu'){
    if(won){setStreak(streak()+1);recordPractice(streak(),M.f[0].ch);$('end-note').textContent=`Win streak: ${streak()}. The CPU fights harder next match.`;
      btn('Fight again','gold',startCPU);btn('Change fighter','',()=>openSelect('cpu'));btn('Menu','alt',toTitle);link('Post on X',share);}
    else{setStreak(0);contT=600;$('end-note').textContent='Continue?';btn('Continue','gold',startCPU);btn('Change fighter','',()=>openSelect('cpu'));btn('Menu','alt',toTitle);}
  } else if(mode==='host'||mode==='guest'||mode==='net'){
    const p=payout(M.stake);
    $('end-note').innerHTML=(M.stake>0?(won?`You won <strong>${usd(p.win)}</strong> (demo).`:`You lost ${usd(M.stake)} (demo).`):(won?'You won the 1v1.':'You lost the 1v1.'))+
      (M.stake>0?`<br>This match added ${usd(p.season)} to the Season Cauldron and ${usd(p.airdrop)} to the Curse Cauldron. You got 1 airdrop point.`:'')+'<span id="rank-delta"></span>';updateDelta();
    if(won)SFX.coin();
    const rb=btn('Rematch, same stake','gold',()=>{NET.ready=true;rb.disabled=true;rb.textContent='Waiting for opponent';});
    btn('Leave','alt',toTitle);link('Post on X',share);
  } else {$('end-note').textContent='Match over.';btn('Leave','alt',toTitle);}
  if(mode!=='boss'&&mode!=='training'){const kb=document.createElement('button');kb.className='arc';kb.textContent='Share K.O. card';kb.onclick=shareKO;row.appendChild(kb);}
  checkAch();show('p-end');
}

/* ===================== ONLINE (room presence) ===================== */
const NET={lobby:null,avail:null,room:null,role:null,code:null,peers:[],pc:{P:0,K:0,S:0,U:0},lastSeq:-1,prev:null,cur:null,curT:0,ready:false,matchId:null,joinTimer:null,stake:0,map:1,kit:'oni'};
async function netInit(){try{if(!window.claude||!window.claude.use){NET.avail=false;return;}const r=await window.claude.use('room');NET.lobby=r;NET.avail=!!r;if(r)r.onPeers(ch=>{VIL.peers=ch.peers;},()=>{});}catch(e){NET.avail=false;}
  // our server offers 'match' (the server runs the fight); claude.ai does not, and keeps the host-run presence flow below
  if(NET.avail&&ON_SERVER)try{const mt=await Promise.race([window.claude.use('match'),new Promise(r=>setTimeout(()=>r(null),2000))]);if(mt&&mt.join){NET.mt=mt;mt.onStatus(netStatus);mt.onState(netState);}}catch(e){}
  if($('p-select').classList.contains('on')&&SEL.ctx==='online')openSelect('online');}
function genCode(){const a='ABCDEFGHJKMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<4;i++)s+=a[Math.floor(Math.random()*a.length)];return s;}
async function netJoin(code,asHost){
  if(NET.mt)return netJoinAuth(code,asHost);
  NET.code=code;NET.role=asHost?'host':'pending';NET.lastSeq=-1;NET.cur=null;NET.prev=null;NET.ready=false;
  try{NET.room=await NET.lobby.join('oni-'+code.toLowerCase());}catch(e){$('sel-note').textContent='Could not open the match. Try again in a moment.';return false;}
  NET.room.onPeers(ch=>{NET.peers=ch.peers;onPeers();},()=>netLost('The connection to the match ended.'));
  NET.room.presence(asHost?{r:'h',s:null,sk:NET.stake,mp:NET.map,fm:NET.fmt||'bo3',ck:KITS.indexOf(NET.kit),op:SEL.opal,t3:hasT3()?1:0}:{r:'x'});
  return true;
}
function netLeave(){if(NET.auth){try{NET.mt.leave();}catch(e){}NET.auth=false;NET.seat=-1;NETA.snaps=[];NETA.final=null;}if(NET.room){try{NET.room.leave();}catch(e){}}NET.room=null;NET.role=null;NET.peers=[];clearTimeout(NET.joinTimer);}
function netLost(msg){toTitle();openSelect('online');$('sel-note').textContent=msg;}
function findPeer(r){return NET.peers.find(p=>!p.isMe&&p.presence&&p.presence.r===r);}
function onPeers(){
  if(NET.role==='pending'){
    const h=findPeer('h');if(!h)return;clearTimeout(NET.joinTimer);
    if(findPeer('g')||findPeer('gp')){NET.role='spec';mode='spectate';NET.room.presence({r:'s'});show(null);$('quit').hidden=false;musicStart();lastEv=0;endShown=false;return;}
    NET.room.presence({r:'gp',ck:KITS.indexOf(NET.kit),t3:hasT3()?1:0});
    reviewStake(h.presence.sk,h.presence.mp,h.presence.fm,KITS[h.presence.ck|0]);return;
  }
  if(NET.role==='host'){
    const g=findPeer('g');
    if(!g&&mode==='hostwait')$('wait-note').textContent=findPeer('gp')?'Your opponent is reviewing the stake.':`${MAPS[NET.map].name}, ${usd(NET.stake)} each. Send this code to your opponent.`;
    if(g&&mode==='hostwait'&&!MAPS[NET.map].stake&&!g.presence.t3)return;
    if(g&&mode==='hostwait'){const gk=KITS[g.presence.ck|0]||'oni';NET.guestBy=g.by||null;NET.guestT3=g.presence.t3?1:0;snapshotBefore();mode='host';NET.gpal=g.presence.op|0;M=mkMatch('online',NET.stake,[NET.kit,gk],NET.map,Object.assign({pal:[myPal(NET.kit),NET.gpal]},FMTS[NET.fmt||'bo3']));
      const c=g.presence.c||[0,0,0,0,0,0,0];NET.pc={P:c[0],K:c[1],S:c[2],U:c[3],T:c[4]|0,L:c[5]|0,R:c[6]|0};lastEv=0;endShown=false;show(null);$('quit').hidden=false;musicStart();}
    if(!g&&mode==='host'){mode='hostwait';M=null;show('p-wait');$('wait-note').textContent='Your opponent left. In the real version, leaving forfeits the pot. Waiting for a new opponent.';musicStop();}
  }
  if((NET.role==='guest'||NET.role==='spec'||NET.role==='review')&&!findPeer('h'))netLost('The host left the match.');
}
// the guest reviews arena, format and stake before taking the seat (both online paths)
function reviewStake(sk,mp,fm,hk){
    NET.role='review';NET.stake=sk|0;NET.map=mp|0;NET.fmt=FMTS[fm]?fm:'bo3';hk=hk||'oni';const p=payout(NET.stake);
    if(NET.stake>0&&paidBlock(NET.stake)){$('stake-note').innerHTML=paidBlock(NET.stake);$('b-accept').hidden=true;show('p-stake');return;}
    if(NET.stake>300&&!canStake()){$('stake-note').innerHTML=`This match has a stake of <strong>${usd(NET.stake)}</strong>. Stakes above $3 need at least <strong>$30 of $ONI</strong> in your wallet.`;$('b-accept').hidden=true;show('p-stake');return;}
    if(!MAPS[NET.map].stake&&!hasT3()){$('stake-note').innerHTML='This match is in the <strong>Oni Colosseum</strong>, the no-limit arena for Legendary fighter owners. Unlock Seiryu or Kage to enter.';$('b-accept').hidden=true;show('p-stake');return;}
    $('b-accept').hidden=false;
    $('stake-note').innerHTML=`Arena: <strong>${MAPS[NET.map].name}</strong>. Format: <strong>${FMTS[NET.fmt].label}</strong>. Your opponent plays ${fname(hk,0)}, you play ${fname(NET.kit,1)}.<br>`+
      (NET.stake>0?`Stake <strong>${usd(NET.stake)}</strong> each. Pot ${usd(p.pot)}. Winner gets <strong>${usd(p.win)}</strong> after the ${(holderTier()||{fee:5}).fee}% fee.<br>Demo: no money moves in this version.`:'Friendly match, no stake.');
    show('p-stake');
}
$('b-accept').onclick=()=>{if(NET.auth){netAcceptAuth();return;}SFX.coin();NET.role='guest';mode='guest';NET.room.presence({r:'g',op:SEL.opal,ck:KITS.indexOf(NET.kit),t3:hasT3()?1:0,i:0,c:[0,0,0,0],rd:0});show(null);$('quit').hidden=false;musicStart();lastEv=0;endShown=false;};
$('b-decline').onclick=()=>toTitle();
async function createMatch(codeArg){if(!owns(SEL.kit)){openStore(SEL.kit);return;}if(stakeCents()>0&&!paidGate(stakeCents(),$('sel-note')))return;if(stakeCents()>300&&!canStake()){$('sel-note').textContent='Stakes above $3 need at least $30 of $ONI. Free, $1 and $3 matches need nothing.';toast('Hold $30 of $ONI for stakes above $3');return;}if(!MAPS[SEL.map].stake&&!hasT3())return;SFX.select();NET.fmt=SEL.fmt;NET.stake=stakeCents();NET.map=SEL.map;NET.kit=SEL.kit;const code=(typeof codeArg==='string'&&codeArg)?codeArg:genCode();$('mycode').textContent=code;
  $('wait-note').textContent=`${MAPS[NET.map].name}, ${usd(NET.stake)} each. Send this code to your opponent.`;show('p-wait');mode='hostwait';await netJoin(code,true);}
async function joinMatch(){SFX.select();const code=($('codein').value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(code.length!==4){$('sel-note').textContent='Enter the 4-character code from your opponent.';return;}
  if(!owns(SEL.kit)){openStore(SEL.kit);return;}
  NET.kit=SEL.kit;$('sel-note').textContent='Joining match '+code+'...';
  if(await netJoin(code,false)){NET.joinTimer=setTimeout(()=>{if(NET.role==='pending'){netLeave();$('sel-note').textContent='No match found with code '+code+'. Check the code and that the host is still waiting.';}},6000);}}
function hostTick(){
  const g=findPeer('g');let gb=0;
  if(g&&g.presence){const p=g.presence;const c=p.c||[0,0,0,0,0,0,0];gb=(p.i|0)&(IN.L|IN.R|IN.U|IN.D);
    const keys=['P','K','S','U','T','L','R'],bitsK=[IN.P,IN.K,IN.S,IN.U,IN.T,0,0];
    NET.dq=NET.dq||[];
    keys.forEach((k,ix)=>{const v=c[ix]|0,d=v-(NET.pc[k]|0);if(d>0){if(bitsK[ix])gb|=bitsK[ix];
      if(k==='L'||k==='R'){const bit=k==='L'?IN.L:IN.R;for(let n=0;n<Math.min(d,3);n++)NET.dq.push([bit,1],[bit,1],[bit,0]);}}NET.pc[k]=v;});
    if(NET.dq.length){const [bit,val]=NET.dq.shift();gb=(gb&~bit)|(val?bit:0);}
    if(M.scene==='matchEnd'&&NET.ready&&p.rd===1&&M.sceneT>90){M=mkMatch('online',NET.stake,M.kits,NET.map,Object.assign({pal:[myPal(NET.kit),NET.gpal|0]},FMTS[NET.fmt||'bo3']));snapshotBefore();NET.guestBy=g.by||NET.guestBy;NET.ready=false;lastEv=0;endShown=false;show(null);musicStart();}
  }
  return gb;
}
let pubT=0;
function hostPublish(){const now=performance.now();if(now-pubT<30)return;pubT=now;try{NET.room.presence({r:'h',s:pack(M),sk:NET.stake,mp:NET.map,fm:NET.fmt||'bo3',ck:KITS.indexOf(NET.kit),rd:NET.ready?1:0});}catch(e){}}
// Guest input goes out at most every 33 ms (<=30/s) and only when it changed (1 s keepalive), whatever the display rate:
// a 120 Hz phone used to send 120/s and hit the server's flood cap. Presses survive the throttle as counters (c),
// held directions in between are OR-ed into the next send.
const GPRES={t:-1e9,s:'',dir:0};
function guestTick(bits){
  if(NET.role==='guest'){GPRES.dir|=bits&(IN.L|IN.R|IN.U|IN.D);const now=performance.now();
    if(now-GPRES.t>=33){const p={r:'g',op:SEL.opal,ck:KITS.indexOf(NET.kit),t3:hasT3()?1:0,i:GPRES.dir|bits,c:[PRESS_COUNT.P,PRESS_COUNT.K,PRESS_COUNT.S,PRESS_COUNT.U,PRESS_COUNT.T,PRESS_COUNT.L,PRESS_COUNT.R],rd:NET.ready?1:0};
      const js=JSON.stringify(p);if(js!==GPRES.s||now-GPRES.t>=1000){GPRES.t=now;GPRES.s=js;GPRES.dir=0;try{NET.room.presence(p);}catch(e){}}}}
  const h=findPeer('h');if(!h||!h.presence||!h.presence.s)return;
  const s=h.presence.s;if(s.q===NET.lastSeq)return;NET.lastSeq=s.q;
  const now=performance.now();if(NET.curT)NET.iv=Math.min(200,Math.max(16,NET.iv?NET.iv*0.8+(now-NET.curT)*0.2:now-NET.curT));
  NET.prev=NET.cur;NET.cur=unpack(s);NET.curT=now;
  if(NET.matchId!==NET.cur.id){NET.matchId=NET.cur.id;snapshotBefore();NET.ready=false;endShown=false;lastEv=0;show(null);musicStart();}
  M=withSkins(NET.cur);
}
function interp(){
  if(!NET.cur||!NET.prev)return NET.cur;const k=Math.min(1,(performance.now()-NET.curT)/(NET.iv||33));const o=NET.cur;
  return Object.assign({},o,{f:o.f.map((f,i)=>{const p=NET.prev.f[i];if(!p||Math.abs(f.x-p.x)>30)return f;return Object.assign({},f,{x:p.x+(f.x-p.x)*k,y:p.y+(f.y-p.y)*k});})});
}

/* ---- Authoritative online (our server, window.claude.use('match')): the server runs the fight ----
   Both players send one input mask per 60 Hz frame, the server steps sim.js and streams snapshots, and it writes the
   result itself. The client renders snapshots through a small jitter buffer with interpolation. */
const NETA={snaps:[],iv:16.7,jit:4,lastAt:0,acc:0,final:null,games:-1};
function myIdx(){return mode==='guest'||(mode==='net'&&NET.seat===1)?1:0;}
async function netJoinAuth(code,asHost){
  NET.auth=true;NET.code=code;NET.seat=-1;NET.role=asHost?'host':'pending';NET.ready=false;NET.readySent=false;NETA.snaps=[];NETA.final=null;NETA.games=-1;
  if(asHost){
    try{await NET.mt.join(code,{as:'host',kit:NET.kit,pal:SEL.opal,stake:NET.stake,map:NET.map,fmt:NET.fmt||'bo3',t3:hasT3()?1:0});NET.seat=0;return true;}
    catch(e){if(e&&e.code==='code_taken'){const c2=genCode();$('mycode').textContent=c2;return netJoinAuth(c2,true);}
      NET.auth=false;$('wait-note').textContent='Could not open the match. Try again in a moment.';return false;}
  }
  let info;try{info=await NET.mt.peek(code);}catch(e){NET.auth=false;$('sel-note').textContent=e&&e.code==='not_found'?'No match found with code '+code+'. Check the code and that the host is still waiting.':'Could not open the match. Try again in a moment.';return false;}
  const mine=info.seats.findIndex(x=>x&&DB.me&&x.uid===DB.me);
  if(mine>=0){try{const st=await NET.mt.join(code,{as:mine?'seat':'host',kit:NET.kit,pal:SEL.opal,t3:hasT3()?1:0});if(st.st==='live')netAuthStart(st);else if(st.st==='waiting'){mode='hostwait';$('mycode').textContent=code;show('p-wait');}}catch(e){}return true;} // back to my own seat
  if(info.seats[1]||info.st!=='waiting')return netWatch(code);
  reviewStake(info.stake,info.map,info.fmt,info.seats[0]&&info.seats[0].kit);return true;
}
async function netWatch(code){
  try{await NET.mt.join(code,{as:'watch'});}catch(e){NET.auth=false;$('sel-note').textContent='Could not open the match. Try again in a moment.';return false;}
  NET.role='spec';mode='spectate';NETA.snaps=[];show(null);$('quit').hidden=false;musicStart();lastEv=0;endShown=false;return true;
}
async function netAcceptAuth(){
  SFX.coin();$('b-accept').disabled=true;
  try{const info=await NET.mt.join(NET.code,{as:'seat',kit:NET.kit,pal:SEL.opal,t3:hasT3()?1:0});if(info&&info.st==='live'&&info.seat>=0)netAuthStart(info);}
  catch(e){$('b-accept').disabled=false;if(e&&e.code==='seat_taken'){netWatch(NET.code);return;}netLost(e&&e.code==='not_found'?'The host left the match.':'Could not join the match.');return;}
  $('b-accept').disabled=false;
}
function netAuthStart(st){ // a (re)match went live on the server
  if(NETA.games===st.games&&mode==='net')return;NETA.games=st.games;
  NET.seat=st.seat;NET.role=st.seat===0?'host':'guest';mode='net';NETA.snaps=[];NETA.final=null;NETA.acc=0;NET.ready=false;NET.readySent=false;
  snapshotBefore();lastEv=0;endShown=false;show(null);$('quit').hidden=false;musicStart();
}
function netStatus(st){
  if(!NET.auth)return;NET.info=st;
  if(st.st==='closed'){if(st.why==='replaced'){netLost('This match continued in another tab.');return;}
    if(mode==='hostwait'||NET.role==='review'||mode==='spectate'||(mode==='net'&&!endShown))netLost(st.why==='host_left'||st.why==='host_gone'?'The host left the match.':'The match ended.');return;}
  if(st.st==='live'&&st.seat>=0)netAuthStart(st);
  if(mode==='net'&&st.why==='disconnect'){const o=st.seats[1-NET.seat];if(o&&!o.on)toast(`Opponent disconnected. They forfeit in ${Math.round((st.grace||10000)/1000)} s unless they return.`);}
  if(mode==='net'&&st.why==='resume'&&st.seats.every(x=>x&&x.on))toast('Both players connected.');
  if(st.st==='over'&&st.res&&st.res.end!=='ko'&&(mode==='net'||mode==='spectate')&&M&&M.scene!=='matchEnd'){
    // forfeit or time cap: the server froze the fight; show the result it decided
    NETA.final=Object.assign({},M,{scene:'matchEnd',sceneT:91,winner:st.res.w});
    toast(st.res.end==='forfeit'?(mode==='net'&&st.res.w===myIdx()?'Your opponent left. You win by forfeit.':'Match forfeited.'):'Match stopped: time limit.');
  }
  if(mode==='hostwait'&&st.st==='waiting')$('wait-note').textContent=`${MAPS[NET.map].name}, ${usd(NET.stake)} each. Send this code to your opponent.`;
}
function netState(m){
  if(!NET.auth)return;const s=unpack(m.s),t=m.at||performance.now();
  if(NETA.lastAt){const d=t-NETA.lastAt;NETA.iv=NETA.iv*0.9+d*0.1;NETA.jit=NETA.jit*0.9+Math.abs(d-NETA.iv)*0.1;}NETA.lastAt=t;
  const sn=NETA.snaps;if(sn.length&&sn[sn.length-1].s.id!==s.id)sn.length=0; // a new match: drop the old one
  if(sn.length&&s.seq<=sn[sn.length-1].s.seq)return;
  sn.push({t,s});if(sn.length>40)sn.splice(0,sn.length-40);
}
function netTick(dt){
  if(mode==='net'){ // fixed 60 Hz input frames, independent of the display rate
    NETA.acc+=dt;let n=0;while(NETA.acc>=1000/60&&n<6){NET.mt.sendInput(sampleInput());NETA.acc-=1000/60;n++;}if(n>=6)NETA.acc=0;
    if(NET.ready&&!NET.readySent){NET.readySent=true;NET.mt.ready().catch(()=>{NET.readySent=false;NET.ready=false;});}
  }
  if(NETA.final){M=NETA.final;return M;}
  const sn=NETA.snaps;if(!sn.length)return M;
  // render a little in the past (1.5 snapshot intervals + jitter) and interpolate between the two snapshots around it
  const delay=Math.min(120,Math.max(20,NETA.iv*1.5+NETA.jit*2)),rt=performance.now()-delay;
  let i=0;while(i<sn.length-1&&sn[i+1].t<=rt)i++;if(i>2){sn.splice(0,i-2);i=2;}
  const a=sn[i],b=sn[i+1];M=withSkins(a.s);
  if(!b||b.t<=a.t||rt<=a.t)return M;
  const k=Math.min(1,(rt-a.t)/(b.t-a.t));
  return Object.assign({},M,{f:M.f.map((f,j)=>{const g=b.s.f[j];if(!g||Math.abs(g.x-f.x)>30)return f;return Object.assign({},f,{x:f.x+(g.x-f.x)*k,y:f.y+(g.y-f.y)*k});}),
    proj:M.proj.map((p,j)=>{const q=b.s.proj[j];return q&&q.owner===p.owner&&Math.abs(q.x-p.x)<30?Object.assign({},p,{x:p.x+(q.x-p.x)*k,y:p.y+(q.y-p.y)*k}):p;})});
}


/* ===================== RANKING + SEASON (db) ===================== */
const SEASON_START=Date.UTC(2026,8,28),SEASON_LEN=14*86400000;
const SEASON=(()=>{const n=Math.max(1,Math.floor((Date.now()-SEASON_START)/SEASON_LEN)+1);return{n,start:SEASON_START+(n-1)*SEASON_LEN,ends:SEASON_START+n*SEASON_LEN};})();
const RANKS=[{n:'Ashigaru',min:0,c:'#A8A8B0',d:[0,975,1025]},{n:'Ronin',min:1050,c:'#6FA3C8',d:[1050,1085,1120]},{n:'Samurai',min:1150,c:'#E23B3B',d:[1150,1200,1250]},
  {n:'Daimyo',min:1300,c:'#B06CE0',d:[1300,1350,1400]},{n:'Shogun',min:1450,c:'#FFB000',d:[1450,1500,1550]},{n:'Oni Lord',min:Infinity,c:'#FF5A3C',lord:true}];
const DIV=['III','II','I'];const LORDS=50;
const TIER_MULT=[1,2,3,4,1,1,1,4,1];
const BRACKETS=[{from:1,to:1,pct:15},{from:2,to:2,pct:10},{from:3,to:3,pct:7},{from:4,to:4,pct:5},{from:5,to:5,pct:4},
  {from:6,to:10,pct:2.5},{from:11,to:25,pct:1.2},{from:26,to:50,pct:0.6},{from:51,to:100,pct:0.27}];
const ELIG={games:5,opps:3};
function sharePct(r){const b=BRACKETS.find(x=>r>=x.from&&r<=x.to);return b?b.pct:0;}
function paidPlaces(eligible){return Math.min(100,eligible,Math.max(3,Math.floor(eligible*0.3)));}
function assignPrizes(board){
  const el=board.list.filter(p=>p.games>=ELIG.games&&Object.keys(p.opp).length>=ELIG.opps);
  const places=paidPlaces(el.length);let sum=0;for(let r=1;r<=places;r++)sum+=sharePct(r);
  board.eligible=el.length;board.places=places;
  for(const p of board.list){p.elig=false;p.prank=0;p.prize=0;}
  el.forEach((p,i)=>{p.elig=true;if(i<places){p.prank=i+1;p.prize=sum?Math.floor(board.pool*sharePct(i+1)/sum):0;}});
}
const DB={db:null,user:null,me:null,matches:[],practice:[],board:null,names:{},asked:new Set(),state:'loading',tab:'season'};
function rankOf(r){let k=RANKS[0];for(const x of RANKS)if(!x.lord&&r>=x.min)k=x;return k;}
function divOf(r){const k=rankOf(r);let d=0;k.d.forEach((t,i)=>{if(r>=t)d=i;});return d;}
function rankName(r,lord){return lord?'Oni Lord':rankOf(r).n+' '+DIV[divOf(r)];}
function nextRank(r){const k=rankOf(r),d=divOf(r);if(d<2)return{n:k.n+' '+DIV[d+1],min:k.d[d+1]};const nx=RANKS[RANKS.indexOf(k)+1];return nx&&!nx.lord?{n:nx.n+' III',min:nx.min}:null;}
/* pixel emblems, drawn once and cached as images */
const EMB={};
function emblem(ti,div,size){const key=ti+'_'+div+'_'+(size||24);if(EMB[key])return EMB[key];
  const c=document.createElement('canvas');c.width=24;c.height=24;const g=c.getContext('2d');const old=G;G=g;const R=RANKS[ti],col=R.c;
  const dark='#1A0B0C';
  // frame: diamond crest
  for(let y=0;y<20;y++){const w=y<10?y+1:20-y;rect(12-w,1+y,w*2,1,dark);}
  for(let y=1;y<19;y++){const w=(y<10?y+1:20-y)-1;if(w>0){rect(12-w,1+y,1,1,col);rect(11+w,1+y,1,1,col);}}
  rect(11,1,2,1,col);rect(11,20,2,1,col);
  // icon per rank
  if(ti===0){rect(7,11,10,2,'#8A8A94');rect(9,9,6,2,'#A8A8B0');rect(11,7,2,2,'#C8C8D0');rect(7,13,10,1,'#5A5A64');}
  else if(ti===1){rect(5,11,14,2,'#C8A060');rect(8,9,8,2,'#D8B070');rect(11,8,2,1,'#E8C888');for(let k=0;k<9;k++)px(7+k,15-Math.floor(k/3),'#DDE3EE');}
  else if(ti===2){rect(8,10,8,5,'#3A3A46');rect(7,13,10,2,'#2A2A34');rect(9,9,6,1,'#5A5A6A');px(8,7,col);px(9,8,col);px(15,7,col);px(14,8,col);rect(11,8,2,2,'#FFB000');}
  else if(ti===3){rect(11,13,2,4,'#6A3A1A');for(let y=0;y<6;y++){const w=6-Math.abs(y-2)*1;rect(12-w,7+y,w*2,1,y%2?col:'#E8D0FF');}}
  else if(ti===4){rect(8,11,8,5,'#C88A00');rect(7,14,10,2,'#8A5A00');rect(9,10,6,1,'#FFD86A');for(const [x,y] of [[6,6],[8,5],[16,5],[18,6]])px(x,y,'#FFD86A');rect(10,6,4,4,'#FFB000');px(11,7,'#FFF2B0');}
  else{for(let k=0;k<6;k++){px(6+k*2,4+(k%2),'#FF6A00');px(7+k*2,3+(k%2),'#FFB000');}
    rect(8,8,8,8,'#C1121F');rect(8,8,8,2,'#FF5A4E');px(8,6,'#EAD9B0');px(8,7,'#EAD9B0');px(15,6,'#EAD9B0');px(15,7,'#EAD9B0');rect(9,11,2,2,'#FFB000');rect(13,11,2,2,'#FFB000');rect(10,14,4,1,'#2A0505');px(10,15,'#FFFFFF');px(13,15,'#FFFFFF');}
  // division pips (III = 1, II = 2, I = 3)
  if(!R.lord){const n=div+1;for(let k=0;k<n;k++)rect(12-n*2+k*4+1,21,2,2,col);}
  G=old;EMB[key]=c.toDataURL();return EMB[key];}

const ACT={perDay:3,step:0.05,days:7,freeTickets:5};
function actMult(p,day){const n=p.ad.filter(d=>d<=day&&d>day-ACT.days).length;return 1+ACT.step*n;}
function computeBoard(matches){
  const P=new Map();const get=id=>{if(!P.has(id))P.set(id,{id,rating:1000,games:0,w:0,l:0,pts:0,streak:0,best:0,kits:{},vs:{},opp:{},pnl:0,vol:0,lord:0,dc:{},ad:[],tk:{},fk:{}});return P.get(id);};
  let pool=0,vol=0,count=0,drop=0;const wk0=lastDrop();const tix={};
  for(const m of matches){
    if(!m||!m.a||!m.b||m.a===m.b||(m.w!==0&&m.w!==1))continue;count++;
    const A=get(m.a),B=get(m.b);const win=m.w===0?A:B,lose=m.w===0?B:A;
    const ew=1/(1+Math.pow(10,(lose.rating-win.rating)/400));
    win.rating+=Math.round((win.games<10?40:24)*(1-ew));lose.rating-=Math.round((lose.games<10?40:24)*(1-ew));
    win.games++;lose.games++;win.w++;lose.l++;win.opp[lose.id]=1;lose.opp[win.id]=1;
    let topId=null,topR=-1;for(const q of P.values())if(q.games>=3&&q.rating>topR){topR=q.rating;topId=q.id;}
    const day=Math.floor((m.ts||0)/86400000);for(const q of [win,lose]){q.dc[day]=(q.dc[day]||0)+1;if(q.dc[day]===ACT.perDay)q.ad.push(day);}
    const free=!(m.stake>0)?0.5:1;
    const mult=TIER_MULT[m.map|0]||1;const n=(win.vs[lose.id]=(win.vs[lose.id]||0)+1);
    win.pts+=Math.round(10*mult*(n===1?1:n===2?0.5:n===3?0.25:0.1)*free*actMult(win,day));lose.pts+=Math.round(mult*free*actMult(lose,day));if(lose.id===topId&&win.id!==topId){win.pts+=25;win.bounties=(win.bounties||0)+1;}
    win.streak++;win.best=Math.max(win.best,win.streak);lose.streak=0;
    A.lg=m.ta?1:0;B.lg=m.tb?1:0;
    const wk=m.w===0?m.ka:m.kb,lk=m.w===0?m.kb:m.ka;win.kits[wk]=(win.kits[wk]||0)+1;lose.kits[lk]=(lose.kits[lk]||0)+1;
    if(m.stake>0){const p=payout(m.stake);pool+=p.season;vol+=p.pot;if(m.ts>=wk0)drop+=p.airdrop;win.pnl+=p.win-m.stake;lose.pnl-=m.stake;win.vol+=m.stake;lose.vol+=m.stake;}
    if(m.ts>=wk0){for(const [q,o] of [[A,B],[B,A]]){const key=day+':'+o.id;if(q.tk[key])continue;
      if(!(m.stake>0)){q.fk[day]=(q.fk[day]||0)+1;if(q.fk[day]>ACT.freeTickets)continue;}q.tk[key]=1;tix[q.id]=(tix[q.id]||0)+1;}}
  }
  const list=[...P.values()].sort((x,y)=>y.pts-x.pts||y.rating-x.rating);
  const today=Math.floor(Date.now()/86400000);for(const p of list){p.act=actMult(p,today);p.actDays=p.ad.filter(d=>d<=today&&d>today-ACT.days).length;}
  list.forEach((p,i)=>p.pos=i+1);
  const lords=[...P.values()].filter(p=>p.games>=ELIG.games).sort((a,b)=>b.rating-a.rating||b.w-a.w).slice(0,LORDS);lords.forEach((p,i)=>p.lord=i+1);
  const board={list,map:P,pool,vol,count,drop,tix,lords};assignPrizes(board);return board;
}
async function dbInit(){
  try{
    if(!window.claude||!window.claude.use){DB.state='off';onBoard();return;}
    const [db,user]=await Promise.all([window.claude.use('db'),window.claude.use('user')]);
    DB.db=db;DB.user=user;if(user){try{DB.me=await user.id();}catch(e){}}
    if(db&&DB.me)syncOwned();
    if(!db){DB.state='off';onBoard();return;}
    db.collection('matches').where('season','==',SEASON.n).orderBy('ts','asc').limit(1000).onSnapshot(s=>{
      DB.matches=s.docs.map(d=>d.data());DB.board=computeBoard(DB.matches);DB.state='ok';onBoard();},e=>{DB.state='err';DB.err=e&&e.code;onBoard();});
    db.collection('profiles').limit(1000).onSnapshot(s=>{const o={};s.docs.forEach(d=>{o[d.id]=d.data();});DB.profiles=o;refreshProfileBtn();onBoard();if(typeof renderLanding==='function'&&$('p-landing').classList.contains('on'))renderLanding();},()=>{});
    db.collection('grants').limit(500).onSnapshot(s=>{const o={};s.docs.forEach(d=>{o[d.id]=d.data();});DB.grants=o;if($('p-profile')&&$('p-profile').classList.contains('on'))renderProfile();},()=>{});
    db.collection('boss').limit(1000).onSnapshot(s=>{DB.boss=s.docs.map(d=>Object.assign({id:d.id},d.data()));if($('p-boss').classList.contains('on'))renderBoss();},()=>{});
    db.collection('tickets').limit(1000).onSnapshot(s=>{DB.tickets=s.docs.map(d=>Object.assign({id:d.id},d.data()));onBoard();},()=>{});
    db.collection('practice').orderBy('best','desc').limit(50).onSnapshot(s=>{
      DB.practice=s.docs.map(d=>Object.assign({id:d.id},d.data()));onBoard();},()=>{});
  }catch(e){DB.state='off';onBoard();}
}
function nameOf(id){const pp=DB.profiles&&DB.profiles[id];if(pp&&pp.name)return pp.name;const n=DB.names[id];if(n)return n;return id===DB.me?'You':'Player '+String(id).slice(-4);}
async function resolveNames(ids){
  if(!DB.user)return;const need=ids.filter(id=>id&&!DB.asked.has(id));if(!need.length)return;need.forEach(id=>DB.asked.add(id));
  try{const ps=await DB.user.profiles(need);let changed=false;for(const id of need){const n=ps&&ps[id]&&ps[id].name;if(n){DB.names[id]=n;changed=true;}}if(changed)onBoard();}catch(e){}
}
function myEntry(){return DB.board&&DB.me?DB.board.map.get(DB.me):null;}
function daysLeft(){return Math.max(0,Math.ceil((SEASON.ends-Date.now())/86400000));}
function rankChip(r,lord){const k=lord?RANKS[5]:rankOf(r),ti=RANKS.indexOf(k),d=lord?0:divOf(r);return `<span class="rk${lord?' lord':''}" style="--rc:${k.c}"><img class="emb" src="${emblem(ti,d)}" alt="">${lord?'Oni Lord #'+lord:k.n+' '+DIV[d]}</span>`;}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function favKit(p){let best='oni',n=-1;for(const [k,c] of Object.entries(p.kits||{}))if(c>n&&CH[k]){best=k;n=c;}return best;}
function portraitEl(kit,cls){const c=document.createElement('canvas');c.width=128;c.height=144;c.getContext('2d').drawImage(portrait(kit,0),0,0);if(cls)c.className=cls;return c;}
function renderBoard(){
  setTimeout(()=>wirePlayerLinks($('bd-body')),0);
  const b=DB.board;const me=myEntry();$('bd-title').textContent='Season '+SEASON.n;
  $('bd-clock').innerHTML=`Ends in<b>${fmtLeft(SEASON.ends-Date.now())}</b>every season lasts 2 weeks`;
  $('bd-stats').innerHTML=`<div class="lb-stat s"><b>${usd(b?b.pool:0)}</b>Season Cauldron, the top 100 split it</div>`+
    `<div class="lb-stat"><b class="w">${me?'#'+me.pos:'-'}</b>${me?me.pts+' points'+(me.prize?', '+usd(me.prize)+' prize now':''):'Your spot. Win a ranked 1v1 to join.'}</div>`;
  document.querySelectorAll('#p-board [data-tab]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.tab===DB.tab?'true':'false'));
  const body=$('bd-body');body.innerHTML='';$('bd-me').innerHTML='';
  const empty=t=>{body.innerHTML=`<div class="lb-empty">${t}</div>`;};
  if(DB.tab!=='rules'){
    if(DB.state==='off')return empty('The leaderboard works when this page is opened on claude.ai.');
    if(DB.state==='loading')return empty('Loading the season...');
    if(DB.state==='err')return empty('The leaderboard could not load. Reopen the page to retry.');
  }
  const who=p=>`<button type="button" class="plink" data-pid="${esc(p.id)}">${esc(nameOf(p.id))}</button>${founderNo(p.id)?' <span class="tbadge t5 mini">F</span>':''}`;
  const table=(head,rows)=>{const t=document.createElement('table');t.className='lbt clean';t.innerHTML='<thead><tr>'+head.map(([h,c])=>`<th class="${c||''}">${h}</th>`).join('')+'</tr></thead>';
    const tb=document.createElement('tbody');rows.forEach(r=>tb.appendChild(r));t.appendChild(tb);const w=document.createElement('div');w.className='lbwrap';w.appendChild(t);return w;};
  if(DB.tab==='season'){
    if(!b||!b.list.length)return empty('No ranked matches yet this season.<br>Win a 1v1 to take the first spot.');
    const top=b.list.slice(0,100);resolveNames(top.map(p=>p.id));
    const pod=document.createElement('div');pod.className='podium';
    [1,0,2].forEach(ix=>{const p=top[ix];const d=document.createElement('div');d.className='pod p'+(ix+1);
      if(p){d.appendChild(portraitEl(favKit(p)));d.insertAdjacentHTML('beforeend',`<div class="nm">${who(p)}</div><div class="blk"><span class="n">#${ix+1}</span><span>${p.pts} pts</span>${p.prize?`<span class="pz">${usd(p.prize)}</span>`:''}</div>`);}
      else d.insertAdjacentHTML('beforeend',`<div class="blk"><span class="n">#${ix+1}</span><span>Open</span></div>`);pod.appendChild(d);});
    body.appendChild(pod);
    const rows=top.slice(3).map((p,i)=>{const tr=document.createElement('tr');if(p.id===DB.me)tr.className='me';
      tr.innerHTML=`<td class="pos">${i+4}</td>`;const td=document.createElement('td');td.className='hide-s';td.appendChild(portraitEl2(favKit(p)));tr.appendChild(td);
      tr.insertAdjacentHTML('beforeend',`<td class="who">${who(p)}</td><td class="hide-m">${rankChip(p.rating,p.lord)}</td><td class="num">${p.pts}</td><td class="num pz">${p.prize?usd(p.prize):'-'}</td>`);return tr;});
    if(rows.length)body.appendChild(table([['#'],['','hide-s'],['Player'],['Rank','hide-m'],['Points','num'],['Prize','num']],rows));
  }else if(DB.tab==='clans'){
    const cl=clanBoard();setTimeout(()=>{const x=document.getElementById('bd-clanpage');if(x)x.onclick=openClans;},0);if(!cl.length)return empty('No clans yet. <button type="button" class="arc" id="bd-clanpage">Open the Clans page</button>');
    const rows=cl.map((c,i)=>{const tr=document.createElement('tr');tr.innerHTML=`<td class="pos">${i+1}</td><td class="who">[${esc(c.tag)}]</td><td class="num">${c.members}</td><td class="num">${c.pts}</td><td class="hide-s">${c.top?who(c.top):''}</td>`;return tr;});
    body.appendChild(table([['#'],['Clan'],['Members','num'],['Points','num'],['Best player','hide-s']],rows));
  }else if(DB.tab==='lords'){
    const lords=b?b.list.filter(p=>p.lord).sort((x,y)=>y.rating-x.rating):[];
    if(!lords.length)return empty(`No Oni Lords yet. The top 50 by rating, with ${ELIG.games}+ matches, become Oni Lords.`);
    resolveNames(lords.map(p=>p.id));
    const rows=lords.map((p,i)=>{const tr=document.createElement('tr');if(p.id===DB.me)tr.className='me';
      tr.innerHTML=`<td class="pos">${i+1}</td>`;const td=document.createElement('td');td.className='hide-s';td.appendChild(portraitEl2(favKit(p)));tr.appendChild(td);
      tr.insertAdjacentHTML('beforeend',`<td class="who">${who(p)}</td><td class="num">${p.rating}</td><td class="num">${p.w}-${p.l}</td><td class="num hide-s">${i<10?'<span class="tbadge t4 mini">KONGO</span>':'<span class="tbadge t3 mini">KIN</span>'}</td>`);return tr;});
    body.appendChild(table([['#'],['','hide-s'],['Player'],['Rating','num'],['W-L','num'],['Skin at season end','num hide-s']],rows));
  }else{
    let h='<div class="ladder compact">'+RANKS.map((r,i)=>`<div class="rung" style="--rc:${r.c}"><img class="embl" src="${emblem(i,2)}" alt=""><b>${r.n}</b>${r.lord?'Top 50':r.min}</div>`).join('')+'</div>';
    h+='<div class="rsteps">'+[
      ['1','Climb','Win ranked 1v1s to raise your rating. Each rank has 3 divisions. The top 50 are Oni Lords.'],
      ['2','Score','A win gives 10 points times the arena tier, 1 to 4. Play 3 matches a day for up to x1.35.'],
      ['3','Get paid','Every 2 weeks the top 100 split the Season Cauldron. Qualify with 5 matches against 3 players.'],
      ['4','Earn Mythic','Top 10 get the diamond Kongo-Oni, places 11 to 50 the gold Kin-Oni. Never sold.']]
      .map(([n,t,d])=>`<div class="rstep"><span class="rn">${n}</span><b>${t}</b>${d}</div>`).join('')+'</div>';
    h+='<div class="rsplit"><b>Payout</b>'+BRACKETS.map(x=>`<span>${x.from===x.to?'#'+x.from:'#'+x.from+'-'+x.to} <i>${x.pct}%${x.from===x.to?'':' each'}</i></span>`).join('')+'</div>';
    body.innerHTML=h;
  }
}
function renderMe(){}
function rankLine(){
  const me=myEntry();
  if(!me)return DB.state==='ok'?'You have no ranked matches yet. Win a 1v1 to get a rank.':'';
  const nx=nextRank(me.rating);
  return `${rankName(me.rating,me.lord)}, rating ${me.rating}. Season ${SEASON.n}: #${me.pos} with ${me.pts} points.`+(me.lord?'':nx?` ${nx.min-me.rating} rating to ${nx.n}.`:' Reach the top 50 to become an Oni Lord.');
}
function onBoard(){
  if($('p-board').classList.contains('on'))renderBoard();
  if($('p-cauldron').classList.contains('on'))renderCauldronInfo();
  if($('p-profile').classList.contains('on')&&!PROFILE.draft)renderProfile();
  if(mode==='title'){refreshTitle();refreshProfileBtn();}
  if(endShown&&(mode==='host'||mode==='guest'||mode==='net'))updateDelta();
}
function updateDelta(){
  const el=$('rank-delta');if(!el||!NET.before)return;const me=myEntry();
  if(NET.unranked){el.textContent=NET.unranked;return;}
  if(!me||me.games<=NET.before.games){el.textContent='Saving the result...';return;}
  const dr=me.rating-NET.before.rating,dp=me.pts-NET.before.pts;const n0=rankName(NET.before.rating),n1=rankName(me.rating,me.lord);const up=me.rating>NET.before.rating;
  el.textContent=`Rating ${NET.before.rating} to ${me.rating} (${dr>=0?'+':''}${dr}). Season points +${dp}.`+(n0!==n1?(up?` Rank up: ${n1}!`:` Rank down: ${n1}.`):'');
}
async function recordMatch(m){
  if(m.log&&m.log.length){m.proof=matchProof(m);if(m.stake>0)verifyOnServer(m.proof);}
  if(!DB.db||!DB.me){NET.unranked='Unranked: the leaderboard is not available here.';updateDelta();return;}
  if(!NET.guestBy){NET.unranked='Unranked: your opponent could not be identified.';updateDelta();return;}
  if(NET.guestBy===DB.me){NET.unranked='Unranked: both sides are the same account.';updateDelta();return;}
  try{await DB.db.collection('matches').doc(String(m.id)).set({season:SEASON.n,ta:hasT3()?1:0,tb:NET.guestT3|0,fm:NET.fmt||'bo3',a:DB.me,b:NET.guestBy,ka:m.kits[0],kb:m.kits[1],map:m.map,stake:m.stake,w:m.winner,rounds:m.wins,ts:Date.now()});}
  catch(e){NET.unranked='Unranked: the result could not be saved.';updateDelta();}
}
async function recordPractice(best,kit){
  if(!DB.db||!DB.me)return;const mine=DB.practice.find(p=>p.id===DB.me);if(mine&&mine.best>=best)return;
  try{await DB.db.collection('practice').doc(DB.me).set({best,kit,ts:Date.now()});}catch(e){}
}
function snapshotBefore(){const me=myEntry();NET.before=me?{rating:me.rating,pts:me.pts,games:me.games}:{rating:1000,pts:0,games:0};NET.unranked=null;}
document.querySelectorAll('#p-board [data-tab]').forEach(b=>b.onclick=()=>{DB.tab=b.dataset.tab;SFX.select();renderBoard();$('p-board').scrollTop=0;});


/* ===================== CAULDRONS ===================== */
const DROP_WINNERS=20,DROP_SPLIT=Array(20).fill(5);
function lastDrop(now){now=now||Date.now();const d=new Date(now);const day=d.getUTCDay();
  let t=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),20,0,0)-day*86400000;if(t>now)t-=7*86400000;return t;}
function nextDrop(){return lastDrop()+7*86400000;}
function todayKey(){return new Date().toISOString().slice(0,10);}
DB.tickets=[];
function freeTickets(doc){if(!doc||!Array.isArray(doc.days))return 0;const since=lastDrop();return doc.days.filter(d=>Date.parse(d+'T00:00:00Z')+86400000>since).length;}
function ticketState(){
  const b=DB.board;const matchT=b&&b.tix?b.tix:{};const tot={};
  for(const [id,n] of Object.entries(matchT))tot[id]=(tot[id]||0)+n;
  for(const t of DB.tickets){tot[t.id]=(tot[t.id]||0)+freeTickets(t);}
  const all=Object.values(tot).reduce((a,c)=>a+c,0);const mine=DB.me?(tot[DB.me]||0):0;
  const myDoc=DB.tickets.find(t=>t.id===DB.me);const claimed=!!(myDoc&&Array.isArray(myDoc.days)&&myDoc.days.includes(todayKey()));
  return{all,mine,claimed,players:Object.keys(tot).length};
}
async function claimTicket(){
  if(!DB.db||!DB.me)return;const myDoc=DB.tickets.find(t=>t.id===DB.me);const since=lastDrop();
  const days=((myDoc&&myDoc.days)||[]).filter(d=>Date.parse(d+'T00:00:00Z')+86400000>since);if(days.includes(todayKey()))return;
  days.push(todayKey());try{await DB.db.collection('tickets').doc(DB.me).set({days,ts:Date.now()});SFX.coin();}catch(e){$('c-actions').insertAdjacentHTML('beforeend','<div class="note">Could not save your airdrop point. Try again.</div>');}
}
function fmtLeft(ms){ms=Math.max(0,ms);const d=Math.floor(ms/86400000),h=Math.floor(ms%86400000/3600000),mi=Math.floor(ms%3600000/60000);return (d?d+'d ':'')+h+'h '+mi+'m';}
function renderCauldronInfo(){
  const b=DB.board;const pool=b?b.pool:0,drop=b?b.drop:0;const me=myEntry();const ts=ticketState();
  $('c-season').innerHTML=`<h3>Season Cauldron</h3><span class="amt">${usd(pool)}</span>The top 100 split it in ${fmtLeft(SEASON.ends-Date.now())}.`+(me&&me.prize?` <strong>Your share now: ${usd(me.prize)}</strong>`:'');
  $('c-drop').innerHTML=`<h3>Curse Cauldron</h3><span class="amt">${usd(drop)}</span>Airdrop to 20 players on Sunday, in ${fmtLeft(nextDrop()-Date.now())}. <strong>You have ${ts.mine} airdrop point${ts.mine===1?'':'s'}.</strong>`;
  const a=$('c-actions');a.innerHTML='';
  const btn=(label,cls,fn,dis)=>{const x=document.createElement('button');x.className='arc '+(cls||'');x.type='button';x.textContent=label;x.onclick=fn;x.disabled=!!dis;a.appendChild(x);return x;};
  if(DB.state==='ok'&&DB.me)btn(ts.claimed?'Daily point claimed':'Claim daily airdrop point','gold',claimTicket,ts.claimed);
  btn('Season ranking','',()=>{DB.tab='season';show('p-board');renderBoard();});
  $('c-clock').innerHTML=`Next airdrop in<b>${fmtLeft(nextDrop()-Date.now())}</b>Sundays 20:00 UTC`;
  $('c-rules').innerHTML=`<div class="rsplit"><b>How they fill</b><span>1.5% of every staked pot: 1% Season (rank rewards), 0.5% Curse</span><span>1 airdrop point per ranked match, plus 1 free a day</span><span>On-chain and verifiable at launch</span></div>`;
  if(DB.state!=='ok'){a.insertAdjacentHTML('afterbegin','<div class="note">Demo money.</div>');}
}
const ccv=document.getElementById('ccv');const cctx=ccv?ccv.getContext('2d'):null;const CB=[];
function drawCauldron(cx,fill,liq,liqL,glow,label,amount,fr,kind){
  const top=58,rx=52,ry=10,bodyH=58;
  // fire
  for(let i=0;i<9;i++){const fx=cx-32+i*8,h=15+Math.round(5*Math.sin(fr*0.25+i*1.7))+(i%2)*3;
    for(let r=0;r<h;r++){const t=r/h,w=Math.max(1,Math.round(4*(1-t)+(r<2?1:0)));const c=t<0.35?'#C1121F':t<0.7?'#FF6A00':'#FFB000';rect(fx-w+Math.round(Math.sin(fr*0.3+r*0.5+i)*(t*1.5)),141-r,w*2,1,c);}
    px(fx,141-h,'#FFF2A8');}
  rect(cx-44,140,88,6,'#1A0A08');
  // legs
  rect(cx-40,128,6,12,'#141414');rect(cx+34,128,6,12,'#141414');
  // glow behind
  G.fillStyle=glow;G.beginPath();G.ellipse(cx,top,rx+14,40,0,0,Math.PI*2);G.fill();
  // body
  for(let y=0;y<bodyH;y++){const t=y/bodyH;const w=Math.round(rx*Math.sqrt(Math.max(0.08,1-Math.pow(Math.max(0,t-0.15)/0.95,2))));rect(cx-w,top+y,w*2,1,y%6===0?'#1E1E24':'#26262E');rect(cx-w,top+y,3,1,'#3A3A46');rect(cx+w-4,top+y,4,1,'#15151A');}
  // rim + liquid
  ell(cx,top,rx+4,ry+2,'#3A3A46');ell(cx,top,rx,ry,'#101014');
  const lvl=Math.round((1-fill)*6);ell(cx,top+lvl,rx-4,ry-3,liq);
  for(let i=0;i<5;i++)rect(cx-30+i*13,top+lvl-1+((fr>>2)+i)%2,6,1,liqL);
  // bubbles
  for(const b of CB){if(b.k!==kind)continue;const y=top+lvl-b.h;G.globalAlpha=Math.min(1,b.life/12);disc(cx+b.x,y,b.r,liqL);G.globalAlpha=1;}
  if(kind==='s'){for(let i=0;i<3;i++){const a=fr*0.03+i*2.1;const x=cx+Math.cos(a)*26,y=top+lvl-2+Math.sin(a*1.7)*2;disc(x,y,3,'#8A5A00');disc(x,y,2,'#FFB000');px(x-1,y-1,'#FFF2A8');}}
  else{for(let i=0;i<3;i++){const a=fr*0.02+i*2.1;const x=cx+Math.cos(a)*24,y=top+lvl-8-((fr+i*30)%40)/3;G.globalAlpha=0.7;disc(x,y,2,'#BFFFF8');px(x,y-3,'#2EC4B6');G.globalAlpha=1;}}
  // handles
  rect(cx-rx-8,top+8,6,3,'#3A3A46');rect(cx+rx+2,top+8,6,3,'#3A3A46');
  txt(label,cx,top-30,7,kind==='s'?'#FFB000':'#2EC4B6','#0A0506');
  txt(amount,cx,top+30,11,'#F3E9E4','#0A0506');
}
let cfr=0;
function renderCauldrons(){
  if(!cctx)return;cfr++;cctx.imageSmoothingEnabled=false;const g=cctx;
  const sky=['#0A0612','#0E0818','#130A1E','#1A0C22','#220E24','#2C1024','#381422','#46181E','#521C1A','#5E2016'];
  sky.forEach((c,i)=>{g.fillStyle=c;g.fillRect(0,i*27,480,27);});
  for(let i=0;i<40;i++){g.fillStyle=i%5?'#8A7A9A':'#FFD8A0';g.fillRect((i*97+Math.floor(cfr*0.05))%480,(i*53)%120,1,1);}
  g.fillStyle='#1E1412';g.fillRect(0,214,480,56);g.fillStyle='#2A1E1C';for(let x=0;x<480;x+=24)g.fillRect(x,222+(x/24%2)*8,22,5);
  const b=DB.board;const pool=b?b.pool:0,drop=b?b.drop:0;const f=v=>0.2+0.8*(1-Math.exp(-v/50000));
  if(typeof cauldHi==='function'){cauldHi(g,130,190,'season',f(pool),cfr,usd(pool));cauldHi(g,350,190,'curse',f(drop*3),cfr,usd(drop));}
}
function openCauldrons(){renderCauldronInfo();show('p-cauldron');}



/* ===================== FOUNDERS: GENESIS ONI ===================== */
const FOUNDER_CAP=200;
function founderList(){return Object.entries(DB.profiles||{}).filter(([id,p])=>p&&p.created).sort((a,b)=>a[1].created-b[1].created||(a[0]<b[0]?-1:1)).slice(0,FOUNDER_CAP).map(x=>x[0]);}
function founderNo(id){if(!id)return 0;const i=founderList().indexOf(id);return i>=0?i+1:0;}
function isFounder(){return DB.me?founderNo(DB.me)>0:!!(PROFILE.local&&PROFILE.local.founder);}
function foundersLeft(){return Math.max(0,FOUNDER_CAP-founderList().length);}

/* ===================== WALLET + PROFILE ===================== */
DB.profiles={};
const PROFILE={draft:null};
function myProfile(){return (DB.me&&DB.profiles[DB.me])||PROFILE.local||null;}
try{PROFILE.local=JSON.parse(localStorage.getItem('oni-profile')||'null');}catch(e){}
function shortW(w){return w?w.slice(0,4)+'...'+w.slice(-4):'';}
function demoWallet(){const a='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';let s='';for(let i=0;i<44;i++)s+=a[Math.floor(Math.random()*a.length)];return s;}
function validName(n){return /^[A-Za-z0-9_]{3,16}$/.test(n);}
function nameTaken(n){const l=n.toLowerCase();return Object.entries(DB.profiles).some(([id,p])=>id!==DB.me&&p&&p.name&&p.name.toLowerCase()===l);}
function bestTier(){let t=0;for(const k of OWN)t=Math.max(t,CH[k].tier);return t;}
function statsOf(id){
  const rows=[];let pnl=0,staked=0,w=0,l=0;
  if(id)for(const mt of DB.matches){if(mt.a!==id&&mt.b!==id)continue;const side=mt.a===id?0:1;const won=mt.w===side;
    const d=mt.stake>0?(won?payout(mt.stake).win-mt.stake:-mt.stake):0;pnl+=d;staked+=mt.stake||0;won?w++:l++;
    rows.push({ts:mt.ts,won,d,stake:mt.stake||0,map:mt.map|0,opp:side?mt.a:mt.b,kit:side?mt.kb:mt.ka,okit:side?mt.ka:mt.kb});}
  rows.sort((a,b)=>b.ts-a.ts);return{rows,pnl,staked,w,l,games:w+l};
}
function myStats(){return statsOf(DB.me);}
const signed=c=>(c>0?'+':c<0?'-':'')+usd(Math.abs(c));
function avatarEl(pr,kit,size){
  if(pr&&pr.av&&/^data:image\/(png|jpeg|webp);base64,/.test(pr.av)){const im=document.createElement('img');im.src=pr.av;im.alt='';im.className='avatar';im.width=size;im.height=size;return im;}
  const c=portraitEl2(kit||'oni');c.className='avatar';return c;
}
const safeX=h=>/^[A-Za-z0-9_]{1,15}$/.test(h||'')?h:'';
let PROFILE_VIEW=null,PF_TAB='overview';
function isOnline(id){return !!(id&&VIL.peers.some(p=>p.by===id&&p.presence&&p.presence.v));}
function syncOwnedToProfile(){try{const p=myProfile();if(p&&(!p.owned||[...p.owned].sort().join(',')!==[...OWN].sort().join(',')))patchProfile({owned:[...OWN]});}catch(e){}}
function myFriends(){const p=myProfile();return p&&Array.isArray(p.friends)?p.friends:[];}
function renderProfile(){
  if(!PROFILE_VIEW||PROFILE_VIEW===DB.me)syncOwnedToProfile();
  const viewId=PROFILE_VIEW&&PROFILE_VIEW!==DB.me?PROFILE_VIEW:null;const own=!viewId;
  const pr=own?myProfile():(DB.profiles[viewId]||{name:nameOf(viewId)});const body=$('pf-body');body.innerHTML='';
  if(own&&!pr){return renderConnect();}
  const id=own?DB.me:viewId;const e=DB.board&&id?DB.board.map.get(id):null;const st=statsOf(id);
  const main=pr.main&&CH[pr.main]?pr.main:(e?favKit(e):'oni');const clan=safeClan(pr.clan);const fno=founderNo(id);const xh=safeX(pr.x);
  $('pf-title').textContent=pr.name||'Player';$('pf-clock').innerHTML=own?`Your profile<b>${clan?'['+clan+']':'ONI'}</b>${pr.wallet?esc(shortW(pr.wallet)):''}`:`Player<b>${clan?'['+clan+']':'ONI'}</b>${isOnline(id)?'Online now':'Offline'}`;
  // banner
  const hero=document.createElement('div');hero.className='pf2-hero';
  const art=document.createElement('div');art.className='pf2-art';const cv=document.createElement('canvas');cv.width=300;cv.height=165;art.appendChild(cv);
  const idb=document.createElement('div');idb.className='pf2-id';const av=avatarEl(pr,main,96);av.classList.add('big');idb.appendChild(av);
  const on=isOnline(id)||own;const wr=st.games?Math.round(st.w/st.games*100):0;
  idb.insertAdjacentHTML('beforeend',`<div class="pf2-name"><span class="dot ${on?'on':''}"></span>${clan?`<span class="ctag">[${clan}]</span> `:''}${esc(pr.name||'Player')}</div>
    <div class="badges">${rankChip(e?e.rating:1000,e&&e.lord)}<span>${e?e.rating:1000} rating</span>${fno?`<span class="tbadge t5">FOUNDER #${fno}</span>`:''}${isAdmin(id)?'<span class="tbadge" style="background:linear-gradient(#C49BFF,#7A3AC0);color:#fff;border-color:#FFE08A">ADMIN</span>':''}${e?`<span>Season #${e.pos}</span>`:''}${xh?`<a class="xlink" href="https://x.com/${xh}" target="_blank" rel="noopener noreferrer">@${xh}</a>`:''}</div>
    <div class="pf2-quick"><div><b>${st.w}-${st.l}</b>W-L</div><div><b>${wr}%</b>Win rate</div><div><b>${e?e.pts:0}</b>Points</div><div><b class="${st.pnl>0?'up':st.pnl<0?'dn':''}">${signed(st.pnl)}</b>PnL</div></div>`);
  const acts=document.createElement('div');acts.className='acts';
  const ab=(t,c,fn,dis)=>{const b=document.createElement('button');b.className='arc '+(c||'');b.type='button';b.textContent=t;b.onclick=fn;b.disabled=!!dis;acts.appendChild(b);};
  if(own){ab('Edit profile','',()=>{PROFILE.draft=Object.assign({},pr);renderConnect(true);});ab('Disconnect','alt',disconnectWallet);
    if(DB.db&&DB.me&&DB.grants&&!Object.values(DB.grants).some(x=>x&&x.admin))ab('Owner: become admin','alt',()=>setAdmin(DB.me,true));}
  else{const fr=myFriends().includes(id);if(myProfile())ab(fr?'Friends ✓':'Add friend',fr?'alt':'gold',async()=>{await patchProfile({friends:fr?myFriends().filter(x=>x!==id):myFriends().concat([id])});toast(fr?'Removed from friends':'Added to friends');renderProfile();});
    const peer=VIL.peers.find(p=>p.by===id&&p.presence&&p.presence.v);ab(peer?'Challenge':'Offline','',()=>{if(peer){vilChallenge(peer);}},!peer);ab('Back to my profile','alt',()=>{PROFILE_VIEW=null;PF_TAB='overview';renderProfile();});
    if(isAdmin(DB.me))ab(isAdmin(id)?'Remove admin':'Make admin',isAdmin(id)?'alt':'gold',()=>setAdmin(id,!isAdmin(id)));}
  idb.appendChild(acts);hero.append(art,idb);body.appendChild(hero);
  showcase(cv,main,[1,0,2,3][CH[main].tier],main==='oni'&&own?SEL.opal:0);
  // tabs
  const tabs=[['overview','Overview'],['matches','Matches']].concat(own?[['ach','Achievements'],['friends','Friends'],['aff','Affiliate']]:[]);if(!tabs.find(t=>t[0]===PF_TAB))PF_TAB='overview';
  const tb=document.createElement('div');tb.className='lb-tabs pf2-tabs';tabs.forEach(([k,l])=>{const b=document.createElement('button');b.className='lb-tab';b.type='button';b.textContent=l+(k==='friends'?` (${myFriends().length})`:'');b.setAttribute('aria-pressed',PF_TAB===k?'true':'false');b.onclick=()=>{PF_TAB=k;renderProfile();};tb.appendChild(b);});
  body.appendChild(tb);const sec=document.createElement('div');sec.className='pf2-sec';body.appendChild(sec);
  if(PF_TAB==='overview'){
    const form=st.rows.slice(0,10).reverse();const kits={};for(const r of st.rows){const k=CH[r.kit]?r.kit:'oni';const o=kits[k]||(kits[k]={w:0,l:0});r.won?o.w++:o.l++;}
    let h=`<div class="pf2-grid"><div class="card"><h4>Last 10</h4><div class="form">${form.length?form.map(r=>`<span class="${r.won?'w':'l'}">${r.won?'W':'L'}</span>`).join(''):'<small>No ranked matches yet.</small>'}</div></div>`+
      `<div class="card"><h4>Season</h4><div class="kv"><span>Points</span><b>${e?e.pts:0}</b><span>Prize now</span><b>${e&&e.prize?usd(e.prize):'-'}</b><span>Activity</span><b>x${(e&&e.act?e.act:1).toFixed(2)}</b><span>Best streak</span><b>${e?e.best:0}</b><span>Bounties</span><b>${e&&e.bounties?e.bounties:0}</b></div></div>`+
      (own?`<div class="card"><h4>Wallet</h4><div class="kv"><span>Staked</span><b>${usd(st.staked)}</b><span>PnL</span><b>${signed(st.pnl)}</b><span>Airdrop points</span><b>${typeof ticketState==='function'?ticketState().mine:0}</b><span>Balance</span><b>-</b></div><small>Balance shows once a real wallet is connected.</small></div>`:'')+'</div>';
    const kl=Object.entries(kits).sort((a,b)=>(b[1].w+b[1].l)-(a[1].w+a[1].l));
    h+=`<h4 class="pf2-h">By fighter</h4><div class="pf2-kits">${kl.length?kl.map(([k,o])=>`<div class="kit"><span data-k="${k}" data-p="0"></span><div><b>${esc(CH[k].name)}</b><small>${o.w}-${o.l}, ${Math.round(o.w/(o.w+o.l)*100)}%</small><i style="width:${Math.round(o.w/(o.w+o.l)*100)}%"></i></div></div>`).join(''):'<small>Play ranked matches to see stats for each fighter.</small>'}</div>`;
    const ownedSet=new Set(own?[...OWN]:((pr.owned&&pr.owned.length)?pr.owned:['oni']));ownedSet.add('oni');
    {const md=medalsOf(pr,own);const tot=MEDALS.reduce((a,x)=>a+(md[x[0]]|0),0);h+=`<h4 class="pf2-h">Medals <small>${tot} won</small></h4><div class="pf2-medals" id="pf-medals"></div>`;}
    h+=`<h4 class="pf2-h">Fighters owned <small>${FIGHTERS.filter(fd=>ownedSet.has(fd.kit)).length} of ${FIGHTERS.length}</small></h4><div class="pf2-own" id="pf-own"></div>`;
    sec.innerHTML=h;fillPortraits(sec);
    {const mg=document.getElementById('pf-medals');if(mg){const md=medalsOf(pr,own);MEDALS.forEach(x=>mg.appendChild(medalEl(x[0],md[x[0]]|0)));}}
    const og=document.getElementById('pf-own');FIGHTERS.forEach(fd=>{const has=ownedSet.has(fd.kit);const d=document.createElement('div');d.className='po'+(has?'':' no');
      const pc=posterEl(fd.kit,has&&own?myPal(fd.kit):0);d.appendChild(pc);d.insertAdjacentHTML('beforeend',`<span>${esc(CH[fd.kit].name)}</span>${has?'':'<i aria-label="not owned">&#128274;</i>'}`);og.appendChild(d);});
  }else if(PF_TAB==='matches'){
    if(!st.rows.length){sec.innerHTML='<div class="lb-empty">No ranked matches this season yet.</div>';}
    else{resolveNames(st.rows.slice(0,30).map(r=>r.opp));const t=document.createElement('table');t.className='lbt clean';t.innerHTML='<thead><tr><th>Result</th><th></th><th>Opponent</th><th class="hide-s">Arena</th><th class="num">Stake</th><th class="num">PnL</th><th class="num hide-s">When</th></tr></thead>';
      const tbody=document.createElement('tbody');for(const r of st.rows.slice(0,30)){const tr=document.createElement('tr');tr.innerHTML=`<td class="${r.won?'win':'loss'}">${r.won?'Win':'Loss'}</td>`;const td=document.createElement('td');td.appendChild(portraitEl2(CH[r.kit]?r.kit:'oni'));tr.appendChild(td);
        tr.insertAdjacentHTML('beforeend',`<td class="who"><button type="button" class="plink" data-pid="${esc(r.opp)}">${esc(nameOf(r.opp))}</button></td><td class="hide-s">${esc(MAPS[r.map].name)}</td><td class="num">${r.stake?usd(r.stake):'Free'}</td><td class="num ${r.d>0?'win':r.d<0?'loss':''}">${r.stake?signed(r.d):'-'}</td><td class="num hide-s">${new Date(r.ts).toISOString().slice(5,16).replace('T',' ')}</td>`);tbody.appendChild(tr);}
      t.appendChild(tbody);const w=document.createElement('div');w.className='lbwrap';w.appendChild(t);sec.appendChild(w);}
  }else if(PF_TAB==='ach'){const got=checkAch();sec.innerHTML=`<div class="achs2">`+ACH.map(([aid,n,d])=>`<div class="ach${got.includes(aid)?' got':''}"><span class="ic">${got.includes(aid)?'&#10003;':'&#9679;'}</span><div><b>${n}</b><small>${d}</small></div></div>`).join('')+'</div>';}
  else if(PF_TAB==='friends'){renderFriends(sec);}
  else if(PF_TAB==='aff'){renderAffiliate(sec);}
  wirePlayerLinks(body);
}
function renderFriends(sec){
  sec.innerHTML=`<div class="fr-search"><input class="nmin" id="fr-q" placeholder="Find a player by name" autocomplete="off" aria-label="Find a player"><div id="fr-res"></div></div><h4 class="pf2-h">Your friends</h4><div id="fr-list"></div>`;
  const row=(fid,extra)=>{const p=DB.profiles[fid]||{name:nameOf(fid)};const e=DB.board?DB.board.map.get(fid):null;const on=isOnline(fid);const mutual=Array.isArray(p.friends)&&p.friends.includes(DB.me);
    const d=document.createElement('div');d.className='fr-row';d.appendChild(avatarEl(p,p.main&&CH[p.main]?p.main:'oni',40));
    d.insertAdjacentHTML('beforeend',`<div class="fr-who"><b><span class="dot ${on?'on':''}"></span>${safeClan(p.clan)?'['+safeClan(p.clan)+'] ':''}${esc(p.name||nameOf(fid))}</b><small>${rankChip(e?e.rating:1000,e&&e.lord)} ${on?'Online in the village':'Offline'}${mutual?' · Mutual':''}</small></div>`);
    const acts=document.createElement('div');acts.className='fr-acts';const b=(t,c,fn,dis)=>{const x=document.createElement('button');x.type='button';x.className='arc '+(c||'');x.textContent=t;x.onclick=fn;x.disabled=!!dis;acts.appendChild(x);};
    extra(b,on);d.appendChild(acts);return d;};
  const list=$('fr-list');const fr=myFriends();
  if(!fr.length)list.innerHTML='<div class="lb-empty">No friends yet. Find players above, or from the leaderboard.</div>';
  else [...fr].sort((a,b)=>isOnline(b)-isOnline(a)).forEach(fid=>list.appendChild(row(fid,(b,on)=>{const peer=VIL.peers.find(p=>p.by===fid&&p.presence&&p.presence.v);
    b('Challenge','gold',()=>{if(peer)vilChallenge(peer);},!peer);b('Profile','',()=>openPlayer(fid));b('Remove','alt',async()=>{await patchProfile({friends:myFriends().filter(x=>x!==fid)});renderProfile();});})));
  const q=$('fr-q'),res=$('fr-res');
  q.oninput=()=>{const v=q.value.trim().toLowerCase();res.innerHTML='';if(v.length<2)return;
    const hits=Object.entries(DB.profiles||{}).filter(([fid,p])=>fid!==DB.me&&p&&p.name&&p.name.toLowerCase().includes(v)).slice(0,6);
    if(!hits.length){res.innerHTML='<small>No players found.</small>';return;}
    hits.forEach(([fid])=>res.appendChild(row(fid,(b)=>{const has=myFriends().includes(fid);b(has?'Friends ✓':'Add friend',has?'alt':'gold',async()=>{if(has)return;await patchProfile({friends:myFriends().concat([fid])});toast('Added to friends');renderProfile();},has);b('Profile','',()=>openPlayer(fid));})));};
}
function openPlayer(id){if(!id)return;auInit();SFX.select();PROFILE.draft=null;PF_TAB='overview';PROFILE_VIEW=id===DB.me?null:id;renderProfile();show('p-profile');$('p-profile').scrollTop=0;}
function wirePlayerLinks(root){root.querySelectorAll('[data-pid]').forEach(b=>{b.onclick=ev=>{ev.stopPropagation();openPlayer(b.dataset.pid);};});}
function renderConnect(edit){
  const body=$('pf-body');body.innerHTML='';const d=PROFILE.draft=PROFILE.draft||{name:'',wallet:'',walletApp:'',main:'oni'};
  $('pf-title').textContent=edit?'Edit profile':'Connect wallet';$('pf-clock').innerHTML='Solana<b>Demo</b>no real wallet here';
  const cn=document.createElement('div');cn.className='cn';
  const s1=document.createElement('div');s1.className='step';
  s1.innerHTML=`<h3>1. Wallet</h3>Stakes, prizes and fighters live in your wallet. In the real version your wallet signs a message to prove it is yours. Here it creates a demo address.`;
  const wl=document.createElement('div');wl.className='wallets';
  ['Phantom','Solflare','Backpack'].forEach(n=>{const b=document.createElement('button');b.type='button';b.className='wbtn';b.textContent=n;b.setAttribute('aria-pressed',d.walletApp===n?'true':'false');
    b.onclick=()=>{d.walletApp=n;if(!d.wallet)d.wallet=demoWallet();SFX.coin();renderConnect(edit);};wl.appendChild(b);});
  s1.appendChild(wl);if(d.wallet)s1.insertAdjacentHTML('beforeend',`<div class="ok" style="margin-top:10px">Connected: ${esc(shortW(d.wallet))}</div>`);
  const fl=foundersLeft();if(!edit&&fl>0)cn.insertAdjacentHTML('beforeend',`<div class="step" style="border-color:#FF3B30"><h3 style="color:#FF6A5A">Founder reward</h3>Create your account now and you get the <b style="color:#FF8A7A">Genesis Oni</b>, numbered, only for the first 200 players. ${fl} of 200 left. It will be tradeable on the marketplace.</div>`);
  const s2=document.createElement('div');s2.className='step';
  s2.innerHTML=`<h3>2. Player name</h3>This is how everyone sees you on the leaderboard and in matches. 3 to 16 letters, numbers or _.`;
  const inp=document.createElement('input');inp.className='nmin';inp.maxLength=16;inp.value=d.name||'';inp.placeholder='YourName';inp.setAttribute('aria-label','Player name');inp.autocomplete='off';
  const msg=document.createElement('div');msg.style.marginTop='8px';
  const check=()=>{d.name=inp.value.trim();if(!d.name){msg.className='';msg.textContent='';return false;}
    if(!validName(d.name)){msg.className='err';msg.textContent='Use 3 to 16 letters, numbers or _.';return false;}
    if(nameTaken(d.name)){msg.className='err';msg.textContent='That name is taken.';return false;}
    msg.className='ok';msg.textContent='Available.';return true;};
  inp.addEventListener('input',check);s2.append(inp,msg);
  const sp=document.createElement('div');sp.className='step';sp.innerHTML='<h3>Profile photo</h3>Upload a photo, or keep your main fighter. Photos are shown to other players.';
  const prev=document.createElement('div');prev.className='pf-top';prev.appendChild(avatarEl(d,d.main||'oni',72));sp.appendChild(prev);
  const fin=document.createElement('input');fin.type='file';fin.accept='image/png,image/jpeg,image/webp';fin.hidden=true;
  const up=document.createElement('button');up.type='button';up.className='arc';up.textContent='Upload photo';up.onclick=()=>fin.click();
  const pix=document.createElement('button');pix.type='button';pix.className='arc alt';pix.textContent=d.pix?'Pixel style: on':'Pixel style: off';
  const rm=document.createElement('button');rm.type='button';rm.className='arc alt';rm.textContent='Use my fighter';rm.onclick=()=>{d.av=null;d.src=null;renderConnect(edit);};
  const bake=(img)=>{const S=96,c=document.createElement('canvas');c.width=S;c.height=S;const g=c.getContext('2d');const s=Math.min(img.width,img.height);
    if(d.pix){const t=document.createElement('canvas');t.width=32;t.height=32;const tg=t.getContext('2d');tg.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,32,32);g.imageSmoothingEnabled=false;g.drawImage(t,0,0,S,S);}
    else{g.imageSmoothingEnabled=true;g.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,S,S);}
    d.av=c.toDataURL('image/jpeg',0.85);renderConnect(edit);};
  pix.onclick=()=>{d.pix=!d.pix;if(d.src){const im=new Image();im.onload=()=>bake(im);im.src=d.src;}else renderConnect(edit);};
  fin.onchange=()=>{const f=fin.files&&fin.files[0];if(!f)return;if(f.size>8e6){alert('Please pick an image under 8 MB.');return;}
    const rd=new FileReader();rd.onload=()=>{d.src=rd.result;const im=new Image();im.onload=()=>bake(im);im.src=rd.result;};rd.readAsDataURL(f);};
  const pr2=document.createElement('div');pr2.className='row';pr2.style.justifyContent='flex-start';pr2.append(up,pix,rm,fin);sp.appendChild(pr2);
  const sx=document.createElement('div');sx.className='step';sx.innerHTML='<h3>X (Twitter)</h3>Optional. Shown as a link on your profile. Verified linking comes with the full launch.';
  const xin=document.createElement('input');xin.className='nmin';xin.maxLength=16;xin.placeholder='handle, without @';xin.value=d.x||'';xin.setAttribute('aria-label','X handle');xin.autocomplete='off';
  const xm=document.createElement('div');xm.style.marginTop='8px';
  xin.addEventListener('input',()=>{const v=xin.value.trim().replace(/^@/,'');d.x=v;xm.className=v&&!safeX(v)?'err':'';xm.textContent=v&&!safeX(v)?'Letters, numbers or _, up to 15.':'';});sx.append(xin,xm);
  const sc=document.createElement('div');sc.className='step';sc.innerHTML='<h3>Clan</h3>Optional. 2 to 5 letters or numbers. Players with the same tag form a clan and climb the clan ranking together.';
  const cin=document.createElement('input');cin.className='nmin';cin.maxLength=5;cin.placeholder='e.g. ONI';cin.value=d.clan||'';cin.setAttribute('aria-label','Clan tag');cin.autocomplete='off';
  cin.addEventListener('input',()=>{cin.value=cin.value.toUpperCase().replace(/[^A-Z0-9]/g,'');d.clan=cin.value;});sc.appendChild(cin);
  const s3=document.createElement('div');s3.className='step';s3.innerHTML='<h3>3. Main fighter</h3>Shown on your profile and next to your name.';
  const mains=document.createElement('div');mains.className='mains';
  FIGHTERS.filter(fd=>owns(fd.kit)).forEach(fd=>{const b=document.createElement('button');b.type='button';b.className='fc';b.setAttribute('aria-pressed',d.main===fd.kit?'true':'false');
    const n=document.createElement('div');n.textContent=CH[fd.kit].name;b.append(portraitEl2(fd.kit),n);b.onclick=()=>{d.main=fd.kit;SFX.select();renderConnect(edit);};mains.appendChild(b);});
  s3.appendChild(mains);
  const save=document.createElement('button');save.className='arc gold';save.type='button';save.textContent=edit?'Save profile':'Create profile';
  const err=document.createElement('div');err.className='err';
  save.onclick=async()=>{if(!d.wallet){err.textContent='Connect a wallet first.';return;}if(!check()){err.textContent='Pick a valid, free name.';return;}await saveProfile(d);};
  const back=document.createElement('button');back.className='arc alt';back.type='button';back.textContent='Cancel';back.onclick=()=>{PROFILE.draft=null;myProfile()?renderProfile():goHome();};
  const row=document.createElement('div');row.className='row';row.style.justifyContent='flex-start';row.append(save,back);
  cn.append(s1,s2,sp,sx,sc,s3,row,err);body.appendChild(cn);check();
}
async function saveProfile(d){
  const prev=myProfile();const doc={name:d.name,wallet:d.wallet,walletApp:d.walletApp||'',main:d.main||'oni',ts:Date.now(),created:(prev&&prev.created)||Date.now(),av:d.av||null,x:safeX(d.x)||null,friends:(prev&&Array.isArray(prev.friends)?prev.friends:[]).slice(0,200),clan:safeClan(d.clan)||null,ref:(prev&&prev.ref)||((LS.get('oni-ref',null)&&LS.get('oni-ref',null)!==DB.me)?LS.get('oni-ref',null):null)};
  if(!DB.db&&foundersLeft()>0)doc.founder=1;
  PROFILE.local=doc;try{localStorage.setItem('oni-profile',JSON.stringify(doc));}catch(e){}
  if(DB.db&&DB.me){try{await DB.db.collection('profiles').doc(DB.me).set(doc);DB.profiles[DB.me]=doc;}catch(e){}}
  PROFILE.draft=null;SFX.win();refreshProfileBtn();renderProfile();
}
async function patchProfile(patch){const prev=myProfile();if(!prev)return false;const doc=Object.assign({},prev,patch,{ts:Date.now()});
  PROFILE.local=doc;if(DB.me)DB.profiles[DB.me]=doc;try{localStorage.setItem('oni-profile',JSON.stringify(doc));}catch(e){}
  if(DB.db&&DB.me){try{await DB.db.collection('profiles').doc(DB.me).set(doc);}catch(e){toast('Could not save. Try again.');return false;}}refreshProfileBtn();return true;}
async function disconnectWallet(){
  PROFILE.local=null;try{localStorage.removeItem('oni-profile');}catch(e){}
  if(DB.db&&DB.me){try{await DB.db.collection('profiles').doc(DB.me).delete();}catch(e){}delete DB.profiles[DB.me];}
  refreshProfileBtn();goHome();
}
function refreshProfileBtn(){const pr=myProfile();const vb=document.getElementById('vb-profile');if(vb)vb.textContent=pr?pr.name:'Connect wallet';const b=$('b-profile');if(!b)return;if(!pr){b.textContent='Connect wallet';return;}const me=typeof myEntry==='function'?myEntry():null;b.innerHTML=`<span>${esc(pr.name)}</span>${rankChip(me?me.rating:1000,me&&me.lord)}`;}
function openProfile(){auInit();SFX.select();PROFILE.draft=null;PROFILE_VIEW=null;PF_TAB='overview';renderProfile();show('p-profile');$('p-profile').scrollTop=0;}


/* ===================== TENKA TOURNAMENTS ===================== */
const CUPS=[
  {id:'weekly',name:'Ashigaru Cup',entry:0,size:16,map:0,lvl:[0,1,2,3],prize:'50,000 $ONI'},
  {id:'ronin',name:'Ronin Cup',entry:500,size:8,map:4,lvl:[0,1,2]},
  {id:'daimyo',name:'Daimyo Cup',entry:2500,size:16,map:5,lvl:[1,1,2,3]},
  {id:'shogun',name:'Shogun Cup',entry:10000,size:16,map:6,lvl:[1,2,3,3]},
  {id:'tenno',name:'Tenno Cup',entry:17500,size:16,map:8,lvl:[2,2,3,3]}];
const TSPLIT={first:55,second:17.5,third:17.5,oni:5,season:3,weekly:2};
const T_FMT_EARLY={need:2,hpMul:0.7},T_FMT_TOP4={need:3,hpMul:0.7};
const RONIN_NAMES=['Kurokage','Yamabushi','Hayate','Tsubame','Akane','Genji','Raiden','Shiro','Kaede','Musashi','Oboro','Jinbei','Sakon','Hotaru','Isamu','Kagerou','Tatsuya','Yukimura','Sora','Benkei','Arashi','Mikazuki','Hanzo','Kiri'];
function cupPayout(c){const pot=c.entry*c.size;const f=k=>Math.floor(pot*TSPLIT[k]/100);const o={pot,first:f('first'),second:f('second'),third:f('third'),oni:f('oni'),season:f('season'),weekly:f('weekly')};o.prizes=o.first+o.second+o.third;return o;}
function roundName(n,size){const left=size/Math.pow(2,n);return left===2?'Final':left===4?'Semifinals':left===8?'Quarterfinals':'Round of '+left;}
function seedOrder(n){let o=[1];while(o.length<n){const m=o.length*2+1;o=o.flatMap(s=>[s,m-s]);}return o;}
let TN=null;
function drawDiamondTrophy(g){g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,160,180);const P=(pts,c)=>{g.fillStyle=c;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill();};
  // handles
  g.strokeStyle='#9FE8FF';g.lineWidth=7;g.beginPath();g.arc(32,58,18,Math.PI*0.5,Math.PI*1.5);g.stroke();g.beginPath();g.arc(128,58,18,Math.PI*1.5,Math.PI*0.5);g.stroke();
  g.strokeStyle='#FFFFFF';g.lineWidth=2;g.beginPath();g.arc(32,58,18,Math.PI*0.6,Math.PI*1.3);g.stroke();
  // faceted crystal cup
  P([[34,30],[126,30],[118,82],[80,108],[42,82]],'#7FD6F0');P([[34,30],[80,30],[80,108],[42,82]],'#BFF4FF');P([[80,30],[126,30],[118,82],[80,108]],'#5AB8D8');
  P([[34,30],[58,30],[66,70],[42,82]],'#E6FAFF');P([[102,30],[126,30],[118,82],[94,70]],'#4A9CC0');P([[58,30],[102,30],[94,70],[66,70]],'#9FE8FF');P([[66,70],[94,70],[80,108]],'#D8C8FF');
  P([[30,24],[130,24],[126,32],[34,32]],'#FFFFFF');P([[30,24],[130,24],[128,27],[32,27]],'#E6DCFF');
  // stem and gold base
  P([[72,106],[88,106],[86,128],[74,128]],'#9FE8FF');P([[72,106],[78,106],[77,128],[74,128]],'#FFFFFF');
  P([[54,128],[106,128],[112,146],[48,146]],'#C88A00');P([[54,128],[106,128],[104,134],[56,134]],'#FFE08A');P([[42,146],[118,146],[118,158],[42,158]],'#8A5A10');P([[42,146],[118,146],[118,149],[42,149]],'#FFC93A');
  // sparkles
  const sp=(x,y,r)=>{g.fillStyle='#FFFFFF';P([[x,y-r],[x+r*0.25,y-r*0.25],[x+r,y],[x+r*0.25,y+r*0.25],[x,y+r],[x-r*0.25,y+r*0.25],[x-r,y],[x-r*0.25,y-r*0.25]],'#FFFFFF');};sp(50,42,8);sp(112,22,6);sp(98,92,5);}


/* ===================== MEDALS (one per paid cup, plus the Grand Tournament) ===================== */
const MEDALS=[['ronin','Ronin Cup','#C8783A','#F0B07A'],['daimyo','Daimyo Cup','#AEB8C8','#F3F6FA'],['shogun','Shogun Cup','#C88A00','#FFE08A'],['tenno','Tenno Cup','#5AB8D8','#E6FAFF'],['grand','Grand Tournament','#8A3AC0','#FFE14A']];
function medalsOf(pr,own){const m=Object.assign({},(pr&&pr.medals)||{});if(own){const l=LS.get('oni-medals',{});for(const k in l)m[k]=Math.max(m[k]|0,l[k]|0);}return m;}
function awardMedal(id){if(!MEDALS.find(x=>x[0]===id))return;const l=LS.get('oni-medals',{});l[id]=(l[id]|0)+1;LS.set('oni-medals',l);if(myProfile())patchProfile({medals:medalsOf(myProfile(),true)});toast('Medal won: '+MEDALS.find(x=>x[0]===id)[1]);}
function medalEl(id,count){const [k,n,c1,c2]=MEDALS.find(x=>x[0]===id);const c=document.createElement('canvas');c.width=72;c.height=96;const g=c.getContext('2d');
  g.fillStyle=k==='grand'?'#C1121F':'#8E1015';g.beginPath();g.moveTo(22,0);g.lineTo(36,30);g.lineTo(50,0);g.lineTo(40,0);g.lineTo(36,10);g.lineTo(32,0);g.closePath();g.fill();
  g.fillStyle=k==='grand'?'#FFC93A':'#1B3A6A';g.fillRect(30,0,12,18);
  const gr=g.createRadialGradient(30,52,4,36,58,26);gr.addColorStop(0,c2);gr.addColorStop(1,c1);g.fillStyle=gr;g.beginPath();g.arc(36,58,25,0,6.283);g.fill();
  g.lineWidth=3;g.strokeStyle='rgba(0,0,0,.35)';g.stroke();g.lineWidth=1.5;g.strokeStyle='rgba(255,255,255,.6)';g.beginPath();g.arc(36,58,19,0,6.283);g.stroke();
  if(k==='grand'){g.fillStyle='#FFE14A';g.beginPath();g.moveTo(22,66);g.lineTo(24,48);g.lineTo(30,58);g.lineTo(36,44);g.lineTo(42,58);g.lineTo(48,48);g.lineTo(50,66);g.closePath();g.fill();g.fillStyle='#BFF4FF';g.beginPath();g.arc(36,54,3,0,6.283);g.fill();}
  else{g.fillStyle='rgba(0,0,0,.45)';g.font='bold 22px serif';g.textAlign='center';g.textBaseline='middle';g.fillText({ronin:'浪',daimyo:'名',shogun:'将',tenno:'天'}[k],36,59);}
  const w=document.createElement('div');w.className='md'+(count?'':' none');w.title=n;w.appendChild(c);w.insertAdjacentHTML('beforeend',`<span>${esc(n)}</span>${count?`<b>x${count}</b>`:''}`);return w;}
/* ===================== LIVE (Grand Tournament from the Round of 16) ===================== */
function liveMatches(){return (typeof DB!=='undefined'&&Array.isArray(DB.live))?DB.live:[];}
function renderLive(){const el=document.getElementById('ld-live');if(!el)return;const L=liveMatches();
  if(L.length){el.innerHTML=`<h2><i class="live-dot"></i>LIVE now</h2><div class="live-list">`+L.map(x=>`<div class="live-card"><span class="live-tag">● LIVE</span><b>${esc(x.p1||'Player')} <em>vs</em> ${esc(x.p2||'Player')}</b><small>${esc(x.round||'Round of 16')} · ${esc(x.cup||'Grand Tournament')}</small><button type="button" class="cl-go" disabled>Watch</button></div>`).join('')+'</div>';}
  else el.innerHTML=`<h2><i class="live-dot off"></i>Live on ONI</h2><p class="live-p">From the Round of 16, Grand Tournament matches will stream live right here (planned).<br><b>Next: ${new Date(grandNext()).toUTCString().slice(0,16)}, 18:00 UTC</b></p>`;}

/* ===================== GRAND TOURNAMENT (monthly, coming soon) ===================== */
const GRAND={seats:160,entry:2000,devOni:1000000,paid:20,prizes:[['1st',100000,1],['2nd',45000,1],['3rd',28000,1],['4th',18000,1],['5th',14000,1],['6th',12000,1],['7th',10000,1],['8th',8500,1],['9th',8000,1],['10th',7000,1],['11th–15th',5500,5],['16th–20th',2000,5]]};
function grandNext(){const d=new Date();let t=Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1,18);const w=new Date(t).getUTCDay();t+=((6-w+7)%7)*864e5;return t;}
function grandCard(){const pool=GRAND.prizes.reduce((a,x)=>a+x[1]*x[2],0);const seats=(typeof DB!=='undefined'&&DB.grandSeats)|0;const ord=n=>n+(['th','st','nd','rd'][(n%100-20)%10]||['th','st','nd','rd'][n%100]||'th');
  return `<section class="gt"><div class="gt-l"><span class="gt-kick">Coming soon · monthly</span><h3>Grand Tournament</h3><p>${GRAND.seats} fighters. One night. The top ${GRAND.paid} get paid, the ONI team adds a bonus on top, and the champion takes the <b>Grand medal</b>. From the Round of 16, matches will stream live on the ONI home page (planned).</p>
    <div class="gt-facts"><div><b>${usdC(GRAND.entry)}</b><span>Entry</span></div><div><b>${usdC(pool)}</b><span>Prize pool if full</span></div><div><b>+${(GRAND.devOni).toLocaleString('en-US')} $ONI</b><span>Bonus from the ONI team</span></div></div>
    <div class="gt-seats"><div class="gt-sl"><b>${seats}<em>/${GRAND.seats}</em></b><span>seats taken · starts when all ${GRAND.seats} are filled</span></div><div class="cl-bar"><i style="width:${Math.round(seats/GRAND.seats*100)}%"></i></div></div>
    <div class="gt-cta"><button type="button" class="cl-go" disabled>Registration opens soon</button><span class="gt-when">Next date: ${new Date(grandNext()).toUTCString().slice(0,16)}, 18:00 UTC</span></div></div>
    <div class="gt-r"><b>Prizes</b>${GRAND.prizes.map(([p,c,n])=>`<div class="gt-p${n>1?' grp':''}"><span>${p}</span><b>${usdC(c)}${n>1?' each':''}${p.startsWith('16')?' <em>entry back</em>':''}</b></div>`).join('')}<small>Details may change before launch.</small></div></section>`;}
function tenkaStats(){const el=document.getElementById('tk-stats');if(!el)return;const top=CUPS.filter(c=>c.entry).sort((a,b)=>b.entry-a.entry)[0];const free=CUPS.find(c=>!c.entry);
  el.innerHTML=`<div><i aria-hidden="true">🏆</i><b>${usdC(cupPayout(top).first)}</b><span>${esc(top.name)} champion</span></div>`+
    (free?`<div><i aria-hidden="true">🎁</i><b>${esc(free.prize||'Free')}</b><span>${esc(free.name)}, free every week</span></div>`:'')+
    `<div><i aria-hidden="true">⚔️</i><b>Best of 5</b><span>Semifinals and final</span></div>`;}
function drawTrophy(g,t){if(g.canvas&&g.canvas.width===160){drawDiamondTrophy(g);return;}
  const old=G;G=g;g.clearRect(0,0,64,72);
  const gold=['#8A5A00','#C88A00','#FFB000','#FFD86A','#FFF2B0'];
  // base
  rect(14,62,36,8,'#1A0B0C');rect(14,62,36,2,'#C88A00');rect(18,56,28,6,'#2A1410');rect(18,56,28,1,'#FFB000');
  // stem
  rect(28,44,8,12,gold[1]);rect(30,44,2,12,gold[3]);rect(24,52,16,4,gold[2]);
  // bowl
  for(let y=0;y<30;y++){const w=Math.round(20-Math.pow(y/30,2)*12);rect(32-w,14+y,w*2,1,y<3?gold[3]:gold[2]);rect(32-w,14+y,3,1,gold[1]);rect(32+w-3,14+y,3,1,gold[0]);}
  rect(12,12,40,4,gold[3]);rect(12,12,40,1,gold[4]);
  // handles
  for(const s of [-1,1]){const x=s<0?8:52;rect(x-(s<0?0:3),18,4,3,gold[2]);rect(s<0?6:54,20,4,12,gold[2]);rect(x-(s<0?0:3),30,4,3,gold[2]);}
  // oni emblem
  rect(26,22,12,10,'#C1121F');rect(26,22,12,2,'#FF5A4E');px(28,20,'#EAD9B0');px(35,20,'#EAD9B0');rect(28,25,2,2,'#FFB000');rect(34,25,2,2,'#FFB000');rect(28,29,8,1,'#2A0505');
  // moving shine
  const sx=((t*0.6)%90)-20;for(let y=12;y<44;y++){const x=Math.round(sx+(y-12)*0.35);if(x>12&&x<52)rect(x,y,2,1,'rgba(255,255,255,.55)');}
  G=old;
}
let trophyT=0;
function tickTrophy(){const c=$('trophy');if(!c||c.offsetParent===null)return;trophyT++;if(trophyT%2)drawTrophy(c.getContext('2d'),trophyT/2);}
/* seats taken in each cup's lobby: filled from the server's live presence (DB.cupSeats), 0 until then */
const usdC=c=>{c=Math.round(c);return '$'+(c/100).toLocaleString('en-US',{minimumFractionDigits:c%100?2:0,maximumFractionDigits:2});};
function cupSeats(c){const s=(typeof DB!=='undefined'&&DB.cupSeats&&DB.cupSeats[c.id])||0;return Math.max(0,Math.min(c.size,s|0));}
function renderCups(){
  {const gw=document.getElementById('grand');if(gw)gw.innerHTML=grandCard();}
  const box=$('cups');box.innerHTML='';box.className='cup-list';
  box.insertAdjacentHTML('beforeend',`<div class="cl-row cl-hd"><span></span><span>Cup</span><span class="cl-n">Entry</span><span>Players</span><span class="cl-n">Champion</span><span class="cl-n cl-hm">2nd · 3rd</span><span></span></div>`);
  CUPS.forEach((c,ci)=>{const p=cupPayout(c);const seats=cupSeats(c);const row=document.createElement('div');row.className='cl-row';
    const th=document.createElement('span');th.className='cl-th';const cv=document.createElement('canvas');cv.width=160;cv.height=90;cv.getContext('2d').drawImage(mapThumb(c.map),0,0);th.appendChild(cv);row.appendChild(th);
    const need=tierNeedForCup(c);
    row.insertAdjacentHTML('beforeend',`<span class="cl-name"><b>${esc(c.name)}</b><small>${esc(MAPS[c.map].name)}${c.prize?' · every week':''}</small>${need?`<i class="cl-req">${need} holder</i>`:''}${c.entry?`<i class="cl-med">🏅 ${esc(c.name.replace(' Cup',''))} medal</i>`:''}</span>`+
      `<span class="cl-n"><b>${c.entry?usdC(c.entry):'Free'}</b><small class="cl-lbl">Entry</small></span>`+
      `<span class="cl-seats"><b>${seats}<em>/${c.size}</em></b><span class="cl-bar"><i style="width:${Math.round(seats/c.size*100)}%"></i></span><small class="cl-lbl">Players</small></span>`+
      `<span class="cl-n cl-prize"><b>${c.prize?esc(c.prize):usdC(p.first)}</b><small class="cl-lbl">Champion</small></span>`+
      `<span class="cl-n cl-hm"><b>${c.prize?'Top 3':usdC(p.second)}</b><small class="cl-lbl">${c.prize?'in $ONI':'each'}</small></span>`);
    const ac=document.createElement('span');ac.className='cl-ac';const go=document.createElement('button');go.type='button';go.className='cl-go';go.textContent=c.entry?'Enter '+usdC(c.entry):'Enter free';go.onclick=()=>enterCup(c);ac.appendChild(go);row.appendChild(ac);
    box.appendChild(row);});
  const R=[
    ['How it works','Pay the entry and take a seat in the bracket. Win and you move on, lose and you are out. The two semifinal losers fight once more for 3rd place.'],
    ['Format','Rounds are 30% faster than a normal 1v1. Early rounds are best of 3. The semifinals, the final and the match for 3rd place are best of 5.'],
    ['Prizes','90% of all entries goes to the top three. The champion takes 55% of the pot, 2nd and 3rd take 17.5% each. Prizes go to your wallet when the final ends.'],
    ['Fees','10% of entries: 5% to ONI, 3% to rank rewards (the Season Cauldron) and 2% to the Curse Cauldron. The cauldrons are paid back to players.'],
    ['Seeding','Players are seeded by rating, so the strongest meet as late as possible. The top seed plays the lowest seed first.'],
    ['Fair play','You have 60 seconds to press Ready or you forfeit the match. Leaving or disconnecting loses the match. Every fighter has the same strength.']];
  $('tn-rules').innerHTML='<h3>Rules</h3><div class="rcards">'+R.map(([h,t])=>`<div class="rcard"><h3>${h}</h3>${t}</div>`).join('')+'</div>';
}
function openTourney(){auInit();SFX.select();renderCups();tenkaStats();show('p-tourney');$('p-tourney').scrollTop=0;const c=$('trophy');if(c)drawTrophy(c.getContext('2d'),0);}
function myRating(){const me=typeof myEntry==='function'?myEntry():null;return me?me.rating:1000;}
function makeCupPlayers(c){
  const pr=myProfile();const names=[...RONIN_NAMES].sort(()=>Math.random()-0.5);const me=myEntry();
  const you={id:'you',name:pr?pr.name:'You',kit:SEL.kit&&owns(SEL.kit)?SEL.kit:'oni',pal:myPal(SEL.kit),rating:myRating(),w:me?me.w:0,l:me?me.l:0,you:true};
  const list=[you];
  for(let i=1;i<c.size;i++){const k=KITS.filter(x=>x!=='enma')[Math.floor(Math.random()*7)];const rating=Math.round(900+Math.random()*450);
    const games=20+Math.floor(Math.random()*70);const wr=Math.max(0.2,Math.min(0.8,0.35+(rating-900)/1000));const w=Math.round(games*wr);
    list.push({id:'c'+i,name:names[i%names.length]+(i>=names.length?i:''),kit:k,pal:Math.random()<0.5?0:1,rating,w,l:games-w});}
  return list;
}
const LOBBY={t:null};
function seatHTML(q,isNew){if(!q)return '<div class="seat empty">Waiting for a player...</div>';
  return `<div class="seat${q.you?' you':''}${isNew?' new':''}"><span data-k="${q.kit}" data-p="${q.pal}"></span><div><b>${esc(q.name)}${q.you&&q.name!=='You'?' (you)':''}</b>${rankChip(q.rating)}<br>Rating ${q.rating}, ${q.w}-${q.l}</div></div>`;}
function renderLobby(newIdx){
  const L=LOBBY,c=L.cup,n=L.shown;
  $('lo-title').textContent=c.name;$('lo-clock').innerHTML=`Entry ${c.entry?usd(c.entry):'Free'}<b>Champion wins ${c.prize||usd(cupPayout(c).first)}</b>${MAPS[c.map].name}`;
  $('lo-n').textContent=`${n} / ${c.size}`;$('lo-bar').style.width=(n/c.size*100)+'%';
  $('lo-state').textContent=n>=c.size?'Full. The bracket starts now.':`Waiting for ${c.size-n} more player${c.size-n===1?'':'s'}. Starts as soon as it is full.`;
  const seats=$('lo-seats');seats.innerHTML=Array.from({length:c.size},(_,i)=>seatHTML(i<n?L.players[i]:null,i===newIdx)).join('');fillPortraits(seats);
  $('lo-note').textContent='Live lobbies fill with real players once the ONI game server is running. In this demo, CPU players take the empty seats. Demo money.';
}
function enterCup(c){
  if(c.entry&&!paidGate(c.entry))return;
  SFX.coin();clearTimeout(LOBBY.t);LOBBY.cup=c;LOBBY.players=makeCupPlayers(c);LOBBY.shown=Math.min(c.size-1,1+Math.floor(Math.random()*3));
  renderLobby(-1);show('p-lobby');$('p-lobby').scrollTop=0;
  const tick=()=>{if(!$('p-lobby').classList.contains('on'))return;
    if(LOBBY.shown<c.size){LOBBY.shown++;SFX.select();renderLobby(LOBBY.shown-1);LOBBY.t=setTimeout(tick,350+Math.random()*900);}
    else{LOBBY.t=setTimeout(()=>{if($('p-lobby').classList.contains('on'))startCup(c,LOBBY.players);},1400);}};
  LOBBY.t=setTimeout(tick,700);
}
$('lo-back').onclick=()=>{clearTimeout(LOBBY.t);SFX.select();openTourney();};
function startCup(c,players){
  SFX.fight();players=[...players].sort((a,b)=>b.rating-a.rating);players.forEach((q,i)=>q.seed=i+1);const order=seedOrder(c.size);
  const r0=[];for(let i=0;i<c.size;i+=2)r0.push({a:players[order[i]-1],b:players[order[i+1]-1],w:null,sc:[0,0]});
  TN={cup:c,players,rounds:[r0],third:null,done:false,out:false,place:0,round:0};
  renderBracket();show('p-bracket');$('p-bracket').scrollTop=0;
}
function simBot(a,b,fmt,lv){
  const m=mkMatch('sim',0,[a.kit,b.kit],TN.cup.map,Object.assign({pal:[a.pal,b.pal]},fmt));const mem=[{hold:0,bits:0,gap:false},{hold:0,bits:0,gap:false}];
  let g=0;while(m.scene!=='matchEnd'&&g<60*60*20){step(m,[cpuInput(m,0,mem[0],lv),cpuInput(m,1,mem[1],lv)]);if(m.slow>0)m.slow--;g++;}
  if(m.scene!=='matchEnd'){m.winner=Math.random()<0.5?0:1;m.wins[m.winner]=fmt.need;}
  return{w:m.winner,sc:m.wins.slice()};
}
function fmtFor(ri){const rounds=Math.log2(TN.cup.size);return ri>=rounds-2?T_FMT_TOP4:T_FMT_EARLY;}
function yourMatch(){if(TN.done)return null;const r=TN.rounds[TN.round];const m=r&&r.find(x=>x.w===null&&(x.a.you||x.b.you));if(m)return{m,third:false};
  if(TN.third&&TN.third.w===null&&(TN.third.a.you||TN.third.b.you))return{m:TN.third,third:true};return null;}
function settleRound(){
  const r=TN.rounds[TN.round];const fmt=fmtFor(TN.round);const lv=TN.cup.lvl[Math.min(TN.round,TN.cup.lvl.length-1)];
  for(const x of r)if(x.w===null&&!x.a.you&&!x.b.you){const res=simBot(x.a,x.b,fmt,lv);x.w=res.w;x.sc=res.sc;}
  if(TN.third&&TN.third.w===null&&!TN.third.a.you&&!TN.third.b.you){const res=simBot(TN.third.a,TN.third.b,T_FMT_TOP4,lv);TN.third.w=res.w;TN.third.sc=res.sc;}
  if(r.some(x=>x.w===null)||(TN.third&&TN.third.w===null))return;
  const rounds=Math.log2(TN.cup.size);
  if(TN.round===rounds-1){finishCup();return;}
  const win=x=>x.w===0?x.a:x.b,lose=x=>x.w===0?x.b:x.a;
  const next=[];for(let i=0;i<r.length;i+=2)next.push({a:win(r[i]),b:win(r[i+1]),w:null,sc:[0,0]});
  if(TN.round===rounds-2)TN.third={a:lose(r[0]),b:lose(r[1]),w:null,sc:[0,0]};
  TN.rounds.push(next);TN.round++;
  if(!yourMatch())settleRound();
}
function finishCup(){
  TN.done=true;const f=TN.rounds[TN.rounds.length-1][0];const win=x=>x.w===0?x.a:x.b,lose=x=>x.w===0?x.b:x.a;
  TN.podium=[win(f),lose(f),TN.third?win(TN.third):null];
  const i=TN.podium.findIndex(p=>p&&p.you);TN.place=i>=0?i+1:0;
  if(TN.place===1){bump('tenka');checkAch();awardXP(300,'TENKA champion');if(TN.cup&&TN.cup.entry)awardMedal(TN.cup.id);}
  if(TN.place&&TN.cup&&TN.cup.entry){const pz=cupPayout(TN.cup);const won=[pz.first,pz.second,pz.third][TN.place-1]||0;const k=won?kycCheck(won):'';if(k)setTimeout(()=>toast(k.trim()),1200);}
  if(TN.place===1){try{const t=JSON.parse(localStorage.getItem('oni-titles')||'{}');t[TN.cup.id]=(t[TN.cup.id]||0)+1;localStorage.setItem('oni-titles',JSON.stringify(t));}catch(e){}}
}
function playYourMatch(){
  const y=yourMatch();if(!y)return;const x=y.m;const youA=x.a.you;const you=youA?x.a:x.b,opp=youA?x.b:x.a;
  const fmt=y.third?T_FMT_TOP4:fmtFor(TN.round);TN.cur={x,youA};
  level=TN.cup.lvl[Math.min(TN.round,TN.cup.lvl.length-1)];cpuMem={hold:0,bits:0,gap:false};
  mode='tourney';M=mkMatch('tourney',0,[you.kit,opp.kit],TN.cup.map,Object.assign({pal:[you.pal,opp.pal]},fmt));
  lastEv=0;endShown=false;show(null);$('quit').hidden=false;auInit();musicStart();
}
function tourneyEnd(){
  const x=TN.cur.x;const youWon=M.winner===0;const wi=TN.cur.youA?(youWon?0:1):(youWon?1:0);
  x.w=wi;x.sc=TN.cur.youA?M.wins.slice():[M.wins[1],M.wins[0]];
  if(!youWon&&!(TN.third&&x===TN.third))TN.out=!(TN.round===Math.log2(TN.cup.size)-2);
  mode='bracket';M=null;musicStop();settleRound();
  if(!TN.done&&!yourMatch()){while(!TN.done)settleRound();}
  renderBracket();show('p-bracket');
}
function bmHTML(x,live){
  const row=(p,i)=>{if(!p)return `<div class="pl"><span class="nm">TBD</span></div>`;const w=x.w===i;
    return `<div class="pl${w?' w':''}${p.you?' you':''}"><span data-k="${p.kit}" data-p="${p.pal}"></span><span class="nm">${p.seed?p.seed+'. ':''}${esc(p.name)}<span class="rt">${p.rating}</span></span><span class="sc">${x.w===null?'':x.sc[i]}</span></div>`;};
  return `<div class="bm${live?' live':''}">${live?'<i class="bm-tag">YOUR MATCH</i>':''}${row(x.a,0)}${row(x.b,1)}</div>`;
}

/* HD head portraits for the TENKA lobby and bracket, computed once per fighter and colour */
const HDPORT={};
function portraitHD(kit,pal){const key=kit+'|'+(pal|0);
  if(!HDPORT[key]){const S=900,c=document.createElement('canvas');c.width=S;c.height=S;const g=c.getContext('2d');
    const f=mkFighter(kit,0,1,1,1);f.st='idle';f.t=0;f.flash=0;f.air=false;const skin=kit==='oni'?(pal===4?'genesis':pal===2?'kin':pal===3?'kongo':pal?'ao':'aka'):kit==='ryu'?'s0':'g'+((pal|0)%2);
    g.setTransform(6,0,0,6,S/2,S-20);try{HDDRAW[kit](g,f,10,skin);}catch(e){}g.setTransform(1,0,0,1,0,0);
    const d=g.getImageData(0,0,S,S).data;let top=S,bot=0,x0=S,x1=0;for(let y=0;y<S;y+=3)for(let x=0;x<S;x+=3)if(d[(y*S+x)*4+3]>30){if(y<top)top=y;if(y>bot)bot=y;if(x<x0)x0=x;if(x>x1)x1=x;}
    const band=Math.max(30,Math.round((bot-top)*0.3));let sx=0,n=0;for(let y=top;y<top+band;y+=3)for(let x=x0;x<=x1;x+=3)if(d[(y*S+x)*4+3]>30){sx+=x;n++;}
    const cx=n?sx/n:(x0+x1)/2,size=Math.round((bot-top)*0.4);const o=document.createElement('canvas');o.width=96;o.height=96;const og=o.getContext('2d');
    og.drawImage(c,cx-size/2,top-size*0.08,size,size,0,0,96,96);HDPORT[key]=o;}
  const c=document.createElement('canvas');c.width=96;c.height=96;c.className='hdp';c.getContext('2d').drawImage(HDPORT[key],0,0);return c;}
function portraitAny(kit,pal){try{if(GFX.hd&&typeof HDDRAW!=='undefined'&&HDDRAW[kit])return portraitHD(kit,pal);}catch(e){}return portraitEl2(kit,pal);}
function fillPortraits(root){root.querySelectorAll('span[data-k]').forEach(s=>{let c;try{c=GFX.hd&&typeof HDDRAW!=='undefined'&&HDDRAW[s.dataset.k]?portraitHD(s.dataset.k,+s.dataset.p):portraitEl2(s.dataset.k,+s.dataset.p);}catch(e){c=portraitEl2(s.dataset.k,+s.dataset.p);}s.replaceWith(c);});}
function renderBracket(){
  const c=TN.cup,p=cupPayout(c),rounds=Math.log2(c.size);
  $('br-title').textContent=c.name;$('br-kicker').textContent='Tenka, '+usd(c.entry)+' entry';
  $('br-clock').innerHTML=TN.cup.prize?`Champion wins<b>${TN.cup.prize}</b>Free every week`:`Champion wins<b>${usd(p.first)}</b>2nd and 3rd ${usd(p.second)}`;
  const y=yourMatch();const nx=$('br-next');nx.innerHTML='';
  if(TN.done){
    const pl=TN.place;const prize=pl===1?p.first:pl===2?p.second:pl===3?p.third:0;
    nx.innerHTML=`<div><b>${pl===1?'Champion of the '+esc(c.name)+'!':pl?'You finished '+(pl===2?'2nd':'3rd')+'.':'Tournament over.'}</b><br>`+
      (prize?`You won <b style="color:var(--gold)">${usd(prize)}</b> (demo).`:'The bracket is complete. Enter again to take another shot.')+`</div>`;
    const again=document.createElement('button');again.className='arc gold';again.type='button';again.textContent='Enter again';again.onclick=()=>enterCup(c);
    const back=document.createElement('button');back.className='arc alt';back.type='button';back.textContent='All cups';back.onclick=openTourney;
    const r=document.createElement('div');r.className='row';r.append(again,back);nx.appendChild(r);
    if(pl===1)SFX.win();
  } else if(y){
    const x=y.m,you=x.a.you?x.a:x.b,opp=x.a.you?x.b:x.a;const fmt=y.third?T_FMT_TOP4:fmtFor(TN.round);
    const stage=y.third?'Match for 3rd place':roundName(TN.round,c.size);
    const v=document.createElement('div');v.className='vs';v.append(portraitAny(you.kit,you.pal));
    v.insertAdjacentHTML('beforeend',`<div><b>${stage}</b><br>You vs ${esc(opp.name)} (${esc(fname(opp.kit,opp.pal))}), rating ${opp.rating}.<br>${fmt.need===3?'Best of 5':'Best of 3'}, rounds 30% faster.</div>`);
    v.appendChild(portraitAny(opp.kit,opp.pal));nx.appendChild(v);
    const go=document.createElement('button');go.className='arc gold';go.type='button';go.textContent='Fight';go.onclick=playYourMatch;nx.appendChild(go);
  } else {nx.innerHTML='<div>Waiting for the other matches...</div>';}
  const br=$('bracket');let h='';
  for(let ri=0;ri<rounds;ri++){const r=TN.rounds[ri];const count=c.size/Math.pow(2,ri+1);
    h+=`<div class="bcol"><h4>${roundName(ri,c.size)}${ri>=rounds-2?', Bo5':''}</h4><div class="bms">`;
    for(let k=0;k<count;k++){const x=r&&r[k];h+=x?bmHTML(x,y&&y.m===x):bmHTML({a:null,b:null,w:null,sc:[0,0]},false);}
    h+='</div></div>';}
  br.innerHTML=h;
  const th=$('br-third');th.innerHTML='';
  if(TN.third){th.innerHTML=`<div><h4>Match for 3rd place, Bo5</h4>${bmHTML(TN.third,y&&y.m===TN.third)}</div>`;}
  if(TN.done&&TN.podium){const pod=document.createElement('div');pod.className='podium small';
    [1,0,2].forEach(ix=>{const q=TN.podium[ix];const d=document.createElement('div');d.className='pod p'+(ix+1);
      if(q){d.appendChild(portraitAny(q.kit,q.pal));d.insertAdjacentHTML('beforeend',`<div class="nm">${esc(q.name)}</div><div class="blk"><span class="n">#${ix+1}</span><span class="pz">${usd([p.first,p.second,p.third][ix])}</span></div>`);}
      pod.appendChild(d);});th.appendChild(pod);}
  fillPortraits(br);fillPortraits(th);
  const alive=new Set();const last=TN.rounds[TN.rounds.length-1];for(const x of last){if(x.w===null){alive.add(x.a&&x.a.id);alive.add(x.b&&x.b.id);}else alive.add((x.w===0?x.a:x.b).id);}
  const ps=$('br-players');if(ps&&TN.players){const t=document.createElement('table');t.className='lbt';
    t.innerHTML='<thead><tr><th>Seed</th><th></th><th>Player</th><th class="hide-m">Rank</th><th class="num">Rating</th><th class="num hide-s">W-L</th><th class="num">Status</th></tr></thead>';
    const tb=document.createElement('tbody');for(const q of TN.players){const tr=document.createElement('tr');tr.className=q.you?'me':'';tr.innerHTML=`<td class="pos">${q.seed}</td>`;
      const td=document.createElement('td');td.appendChild(portraitAny(q.kit,q.pal));tr.appendChild(td);
      const st=TN.done?(TN.podium&&TN.podium.indexOf(q)>=0?['1st','2nd','3rd'][TN.podium.indexOf(q)]:'Out'):(alive.has(q.id)?'In':'Out');
      tr.insertAdjacentHTML('beforeend',`<td class="who">${esc(q.name)}</td><td class="hide-m">${rankChip(q.rating)}</td><td class="num">${q.rating}</td><td class="num hide-s">${q.w}-${q.l}</td><td class="num ${st==='Out'?'loss':'win'}">${st}</td>`);tb.appendChild(tr);}
    t.appendChild(tb);ps.innerHTML='<h3>Players</h3>';const wrap=document.createElement('div');wrap.className='lbwrap';wrap.appendChild(t);ps.appendChild(wrap);}
}


/* ===================== TRAINING MODE ===================== */
const TR={skin:null,dummy:'stand',hb:true,meter:true,kit:'oni',last:null,hist:[],lastBits:-1,dmg:0,shownDmg:0,idle:0,prevSt:'idle'};
function trainingDummyKits(){return FIGHTERS.map(f=>f.kit);}
function startTraining(){
  auInit();SFX.select();mode='training';
  M=mkMatch('training',0,[SEL.kit,TR.kit],SEL.map,{need:99,pal:[myPal(SEL.kit),TR.kit==='oni'?1-myPal(SEL.kit):0],skins:[SEL.kit==='oni'?TR.skin:null,null]});M.scene='fight';M.sceneT=0;M.f.forEach((f,i)=>{f.skin=M.skins[i];});
  cpuMem={hold:0,bits:0,gap:false};lastEv=0;endShown=false;TR.last=null;TR.hist=[];TR.dmg=0;TR.shownDmg=0;TR.idle=0;
  show(null);$('quit').hidden=false;$('trbar').hidden=false;renderTrBar();musicStop();
}
function renderTrBar(){
  document.querySelectorAll('#trbar [data-dm]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.dm===TR.dummy?'true':'false'));
  $('tr-kit').textContent='Dummy: '+CH[TR.kit].name;$('tr-skin').hidden=SEL.kit!=='oni';$('tr-skin').textContent='Skin: '+({null:'standard',kin:'Kin-Oni',kongo:'Kongo-Oni'})[TR.skin];$('tr-hb').textContent='Hitboxes '+(TR.hb?'on':'off');$('tr-mt').textContent='Meter '+(TR.meter?'full':'normal');
  $('tr-hb').setAttribute('aria-pressed',TR.hb?'true':'false');$('tr-mt').setAttribute('aria-pressed',TR.meter?'true':'false');
}
document.querySelectorAll('#trbar [data-dm]').forEach(b=>b.onclick=()=>{TR.dummy=b.dataset.dm;cpuMem={hold:0,bits:0,gap:false};SFX.select();renderTrBar();b.blur();});
$('tr-kit').onclick=()=>{const ks=trainingDummyKits();TR.kit=ks[(ks.indexOf(TR.kit)+1)%ks.length];startTraining();};
$('tr-skin').onclick=()=>{const o=[null,'kin','kongo'];TR.skin=o[(o.indexOf(TR.skin)+1)%3];startTraining();};
$('tr-hb').onclick=()=>{TR.hb=!TR.hb;renderTrBar();$('tr-hb').blur();};
$('tr-mt').onclick=()=>{TR.meter=!TR.meter;renderTrBar();$('tr-mt').blur();};
$('tr-reset').onclick=()=>{if(!M)return;const k=M.kits;M.f=[mkFighter(k[0],96,1),mkFighter(k[1],224,-1)];M.proj=[];TR.dmg=0;TR.shownDmg=0;$('tr-reset').blur();};
$('tr-exit').onclick=()=>{$('trbar').hidden=true;toTitle();};
function dummyInput(){
  const d=M.f[1],p=M.f[0];const away=p.x<d.x?IN.R:IN.L;
  switch(TR.dummy){
    case 'crouch':return IN.D;
    case 'block':{const low=p.st==='kick'&&p.atk==='sweep';const over=p.air&&(p.st==='punch'||p.st==='kick');return away|(low&&!over?IN.D:0);}
    case 'jump':return frameN%50<3?IN.U:0;
    case 'poke':{if(Math.abs(p.x-d.x)>40)return p.x<d.x?IN.L:IN.R;return frameN%55<2?IN.P:0;}
    case 'cpu':return cpuInput(M,1,cpuMem,1);
    default:return 0;
  }
}
function moveInfo(f){
  const c=CH[f.ch];
  if(f.st==='punch'||f.st==='kick'){const a=c[f.atk]||c[f.st];const names={punch:'Attack',kick:'Kick',cpunch:'Crouch attack',sweep:'Sweep'};
    return{n:names[f.atk]||f.st,s:a.s+1,a:a.a,r:a.r,adv:(BLOCKSTUN[f.atk]||7)-(a.a-1+a.r),p:a.low?'low':f.over?'overhead':'mid'};}
  if(f.st==='special'){const sp=c.special;const fd=fdef(f.ch);return{n:fd.mv[0],s:(sp.at||sp.from||1)+1,a:sp.act||(sp.type==='proj'?'proj':'-'),r:sp.len-(sp.at||0),adv:null,p:sp.type};}
  if(f.st==='super')return{n:'Oni Wrath (super)',s:SUPER.startup+1,a:SUPER.active,r:SUPER.len-SUPER.startup-SUPER.active,adv:BLOCKSTUN.super-(SUPER.active-1+SUPER.len-SUPER.startup-SUPER.active),p:'invulnerable start'};
  if(f.st==='throw')return{n:'Throw',s:THROW.s+1,a:THROW.a,r:THROW.r,adv:null,p:'beats block'};
  return null;
}
function trainingTick(mine){tutTick();
  const p=M.f[0],d=M.f[1];
  if(TR.meter){p.meter=100;}
  if(p.st!==TR.prevSt&&['punch','kick','special','super','throw'].includes(p.st))TR.last=moveInfo(p);
  TR.prevSt=p.st;
  if(mine!==TR.lastBits){TR.lastBits=mine;if(mine){const fw=p.face>0?IN.R:IN.L,bk=p.face>0?IN.L:IN.R;let s='';
    if(mine&IN.U)s+='U';if(mine&IN.D)s+='D';if(mine&fw)s+='F';if(mine&bk)s+='B';
    const btn=[[IN.P,'A'],[IN.K,'K'],[IN.S,'C'],[IN.T,'T']].filter(([b])=>mine&b).map(x=>x[1]).join('+');
    TR.hist.unshift((s||'')+(s&&btn?' ':'')+btn);if(TR.hist.length>10)TR.hist.pop();}}
  if(d.stun>0||d.st==='hurt'||d.st==='grabbed'){TR.idle=0;TR.dmg=d.mhp-d.hp;TR.shownDmg=TR.dmg;}
  else{TR.idle++;if(TR.idle>50&&d.hp<d.mhp){d.hp=d.mhp;TR.dmg=0;}}
  if(p.stun===0&&p.hp<p.mhp*0.5&&TR.idle>50)p.hp=p.mhp;
}
function hitboxOf(f){
  const c=CH[f.ch];
  if((f.st==='punch'||f.st==='kick')){const a=c[f.atk]||c[f.st];if(f.t>a.s&&f.t<=a.s+a.a){const R=a.reach*GEO;return{x1:Math.min(f.x+f.face*4*GEO,f.x+f.face*R),x2:Math.max(f.x+f.face*4*GEO,f.x+f.face*R),y1:f.y-(a.y+a.h)*GEO,y2:f.y-a.y*GEO};}}
  if(f.st==='super'&&f.t>SUPER.startup&&f.t<=SUPER.startup+SUPER.active){const R=SUPER.reach*GEO;return{x1:Math.min(f.x-f.face*6,f.x+f.face*R),x2:Math.max(f.x-f.face*6,f.x+f.face*R),y1:f.y-(SUPER.y+SUPER.h)*GEO,y2:f.y-SUPER.y*GEO};}
  if(f.st==='throw'&&f.t>THROW.s&&f.t<=THROW.s+THROW.a){const R=((c.w+18)/2)*GEO+THROW.range;return{x1:Math.min(f.x,f.x+f.face*R),x2:Math.max(f.x,f.x+f.face*R),y1:f.y-c.h*GEO*0.7,y2:f.y-c.h*GEO*0.2};}
  const sp=c.special;if(f.st==='special'&&sp.type==='staff'&&f.t>sp.at&&f.t<=sp.at+sp.act)return{x1:Math.min(f.x+f.face*6*GEO,f.x+f.face*sp.reach*GEO),x2:Math.max(f.x+f.face*6*GEO,f.x+f.face*sp.reach*GEO),y1:f.y-(sp.y+sp.h)*GEO,y2:f.y-sp.y*GEO};
  return null;
}
function drawTraining(m){if(TUT.on)return;
  if(!CAM.on)drawHitboxes(m);
  drawTrainingPanel(m);}
function drawHitboxes(m){
  if(TR.hb){for(const f of m.f){const b=box(f);ctx.strokeStyle='rgba(80,160,255,.9)';ctx.lineWidth=1/3;ctx.strokeRect(Math.round(b.x1)+0.5,Math.round(b.y1)+0.5,Math.round(b.x2-b.x1),Math.round(b.y2-b.y1));
      const h=hitboxOf(f);if(h){ctx.fillStyle='rgba(255,60,60,.35)';ctx.fillRect(h.x1,h.y1,h.x2-h.x1,h.y2-h.y1);ctx.strokeStyle='rgba(255,60,60,.95)';ctx.strokeRect(Math.round(h.x1)+0.5,Math.round(h.y1)+0.5,Math.round(h.x2-h.x1),Math.round(h.y2-h.y1));}}
    for(const p of m.proj){ctx.strokeStyle='rgba(255,60,60,.95)';ctx.strokeRect(Math.round(p.x-p.r)+0.5,Math.round(p.y-p.r)+0.5,Math.round(p.r*2),Math.round(p.r*2));}}}
function drawTrainingPanel(m){
  rect(98,40,124,38,'rgba(10,5,6,.78)');
  txt('TRAINING',160,46,6,'#FFB000',null);
  const L=TR.last;
  if(L){txt(L.n.toUpperCase(),160,55,6,'#F3E9E4',null);
    txt(`START ${L.s}  ACTIVE ${L.a}  REC ${L.r}`,160,64,5,'#C9A9A2',null);
    txt((L.adv==null?'':(L.adv>=0?'ON BLOCK +'+L.adv:'ON BLOCK '+L.adv)+'  ')+String(L.p).toUpperCase(),160,72,5,L.adv!=null&&L.adv<0?'#FF8A80':'#2EC4B6',null);}
  else txt('USE A MOVE TO SEE ITS FRAMES',160,62,5,'#C9A9A2',null);
  if(TR.shownDmg>0){txt('COMBO DAMAGE',270,50,5,'#C9A9A2',null);txt(String(TR.shownDmg),270,62,12,'#FFB000','#1A0506');}
  rect(4,44,34,6+TR.hist.length*9,'rgba(10,5,6,.6)');
  TR.hist.forEach((h,i)=>txt(h,8,50+i*9,5,i===0?'#FFE08A':'#C9A9A2',null,'left'));
}


/* ===================== CONTROLS PAGE ===================== */
let CTAB='kb';
function K(...ks){return ks.map(k=>k==='/'?'<span>or</span>':k==='+'?'<span>+</span>':k==='then'?'<span>then</span>':`<kbd${k.length>3?' class="w"':''}>${k}</kbd>`).join('');}
function renderControls(){
  document.querySelectorAll('#help [data-ctab]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.ctab===CTAB?'true':'false'));
  const body=$('ctl-body');
  const row=(keys,title,desc,tag)=>`<div class="crow"><div class="keys">${keys}</div><div class="cdo"><b>${title}${tag||''}</b><span>${desc}</span></div></div>`;
  const tag=(c,t)=>`<span class="tg ${c}">${t}</span>`;
  if(CTAB==='kb'){
    body.innerHTML=`<div class="cgroups">
      <div class="cgroup"><h3>MOVE</h3>
        ${row(K('A','D','/','←','→'),'Walk','Toward or away from your opponent.')}
        ${row(K('W','/','↑','/','Space'),'Jump','Kaze can jump again in the air. Hayate glides while you hold jump.')}
        ${row(K('S','/','↓'),'Crouch','Ducks under high attacks.')}
        ${row(K('D','D','/','A','A'),'Dash','Tap forward or back twice, quickly.')}
      </div>
      <div class="cgroup"><h3>ATTACK</h3>
        ${row(K('J'),'Attack','Fast, reaches mid height.')}
        ${row(K('K'),'Kick','Slower and harder.')}
        ${row(K('S','+','K'),'Sweep','Knocks the opponent down.',tag('low','LOW'))}
        ${row(K('W','then','J','/','K'),'Jump-in','Any attack in the air.',tag('over','OVERHEAD'))}
        ${row(K('L'),'Curse','The special move of your fighter. Costs half the meter.')}
      </div>
      <div class="cgroup"><h3>DEFEND</h3>
        ${row(K('E'),'Block','Hold E (or Shift, or hold back) to block high and mid attacks. Add S to block low.')}
        ${row(K('S','+','back'),'Crouch block','Stops lows. Overheads still hit you.')}
        ${row(K('I','/','J','+','K'),'Throw','Grabs an opponent who is blocking.',tag('beat','BEATS BLOCK'))}
        ${row(K('I'),'Escape a throw','Press throw right after you are grabbed.')}
      </div>
      <div class="cgroup"><h3>SUPER</h3>
        ${row(K('S','+','L'),'Oni Wrath','Needs a full meter. The meter reads SUPER when it is ready. Invulnerable at the start, 26 damage.')}
        ${row(K('Z','X','C','V'),'Other keys','Attack, kick, curse and throw, if you prefer the left hand.')}
        ${row(K('Esc'),'Quit or go back','Leaves a match, or closes a menu page.')}
      </div>
    </div>
    <div class="cgroup cspec"><h3>CURSE MOVES BY FIGHTER</h3><div class="specs" id="ctl-specs"></div></div>`;
  } else {
    body.innerHTML=`<div class="phone">
      <div class="pdiag" aria-hidden="true">
        <div class="dp"><span></span><div class="k">▲</div><span></span><div class="k">◀</div><div class="k">▼</div><div class="k">▶</div></div>
        <div class="bt"><div class="k" style="background:rgba(193,18,31,.6)">ATTACK</div><div class="k" style="background:rgba(47,111,224,.5)">KICK</div><div class="k" style="background:rgba(46,196,182,.35)">THROW</div><div class="k" style="background:rgba(255,106,0,.5)">CURSE</div></div>
      </div>
      <div class="cgroup"><h3>ON YOUR PHONE</h3>
        ${row(K('◀','▶'),'Walk, and block','Hold away from your opponent to block.')}
        ${row(K('▲'),'Jump','Attack in the air for an overhead.')}
        ${row(K('▼'),'Crouch','Hold ▼ and away to block lows.')}
        ${row(K('▼','+','KICK'),'Sweep',tag('low','LOW'))}
        ${row(K('THROW'),'Throw','Beats block. Tap it right after you are grabbed to escape.')}
        ${row(K('▼','+','CURSE'),'Super','With a full meter.')}
        ${row(K('◀','◀','/','▶','▶'),'Dash','Double tap.')}
      </div>
    </div>`;
  }
  const sp=$('ctl-specs');if(sp){FIGHTERS.forEach(fd=>{const d=document.createElement('div');d.className='spec';d.appendChild(portraitEl2(fd.kit));
    d.insertAdjacentHTML('beforeend',`<div><b>${esc(CH[fd.kit].name)}</b><i>${esc(fd.mv[0])}</i>. ${esc(fd.mv[1])}</div>`);sp.appendChild(d);});}
}
document.querySelectorAll('#help [data-ctab]').forEach(b=>b.onclick=()=>{CTAB=b.dataset.ctab;SFX.select();renderControls();});
function openControls(){auInit();SFX.select();CTAB=document.body.classList.contains('touch')?'ph':'kb';renderControls();show('help');$('help').scrollTop=0;}


/* ===================== BOSS: ENMA ===================== */
DB.boss=[];
function bossLocal(){try{return JSON.parse(localStorage.getItem('oni-boss')||'{"kills":0,"best":0}');}catch(e){return{kills:0,best:0};}}
function bossTotal(){const n=DB.boss.reduce((a,d)=>a+(d.kills|0),0);return DB.state==='ok'?n:bossLocal().kills;}
function bossLevel(){return Math.min(50,1+bossTotal());}
function bossMods(L){return{hp:Math.min(3,1.8+0.04*(L-1)),dmg:Math.min(2,1.35+0.02*(L-1))};}
function bossAI(L){return Math.min(3.4,2.6+(L-1)*0.06);}
function myBossKills(){const d=DB.me&&DB.boss.find(x=>x.id===DB.me);return d?d.kills|0:bossLocal().kills;}
async function recordBossKill(L){
  const loc=bossLocal();loc.kills++;loc.best=Math.max(loc.best,L);try{localStorage.setItem('oni-boss',JSON.stringify(loc));}catch(e){}
  if(DB.db&&DB.me){const d=DB.boss.find(x=>x.id===DB.me)||{kills:0,best:0};try{await DB.db.collection('boss').doc(DB.me).set({kills:(d.kills|0)+1,best:Math.max(d.best|0,L),ts:Date.now()});}catch(e){}}
}

const JAR_TRY=100,JAR_SHARE=0.9;
function bossLocal2(){try{return JSON.parse(localStorage.getItem('oni-boss')||'{}');}catch(e){return{};}}
function jarCents(){if(DB.state==='ok'){const tries=DB.boss.reduce((a,d)=>a+(d.paid|0),0),out=DB.boss.reduce((a,d)=>a+(d.jackOut|0),0);return Math.max(0,Math.round(tries*JAR_TRY*JAR_SHARE)-out);}
  const l=bossLocal2();return Math.max(0,Math.round((l.paid|0)*JAR_TRY*JAR_SHARE)-(l.jackOut|0));}
async function bossSave(patch){const l=Object.assign({kills:0,best:0},bossLocal2(),patch);try{localStorage.setItem('oni-boss',JSON.stringify(l));}catch(e){}
  if(DB.db&&DB.me){const d=DB.boss.find(x=>x.id===DB.me)||{};try{await DB.db.collection('boss').doc(DB.me).set(Object.assign({kills:d.kills|0,best:d.best|0,paid:d.paid|0,jackOut:d.jackOut|0,jacks:d.jacks|0},d.id?{}:{},patch,{ts:Date.now()}));}catch(e){}}}
function myBossDoc(){return (DB.me&&DB.boss.find(x=>x.id===DB.me))||bossLocal2();}
function payTry(){const d=myBossDoc();bossSave({paid:(d.paid|0)+1});}
function payJackpot(amt){const d=myBossDoc();bossSave({jackOut:(d.jackOut|0)+amt,jacks:(d.jacks|0)+1});}
function drawJar(cv,cents,L){const g=cv.getContext('2d');const W=cv.width,H=cv.height;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,H);
  const cx=W/2,top=40,bot=H-30,w=W*0.62;const fill=Math.min(1,Math.log10(1+cents/100)/3.2);
  // back of the glass
  g.fillStyle='rgba(180,230,255,.10)';g.beginPath();g.roundRect(cx-w/2,top,w,bot-top,26);g.fill();
  // money inside: stacked bills and coins up to the fill level
  g.save();g.beginPath();g.roundRect(cx-w/2+6,top+6,w-12,bot-top-12,22);g.clip();
  const yTop=bot-(bot-top-14)*fill;let seed=7;const rnd=()=>(seed=(seed*9301+49297)%233280)/233280;
  for(let y=bot-10;y>yTop;y-=7)for(let i=0;i<5;i++){const x=cx-w/2+8+rnd()*(w-56),a=(rnd()-0.5)*0.6;g.save();g.translate(x+22,y);g.rotate(a);g.fillStyle=rnd()<0.5?'#3E8A4E':'#4FA05C';g.fillRect(-22,-6,44,12);g.strokeStyle='#2A6A3A';g.lineWidth=1;g.strokeRect(-19,-4,38,8);
    g.fillStyle='#CFEFD2';g.font='bold 8px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('$',0,0.5);g.restore();}
  for(let i=0;i<Math.round(fill*16);i++){const x=cx-w/2+16+rnd()*(w-32),y=bot-12-rnd()*(bot-top-20)*fill;g.fillStyle='#C88A00';g.beginPath();g.ellipse(x,y,6,4,0,0,6.28);g.fill();g.fillStyle='#FFD55A';g.beginPath();g.ellipse(x,y-1,5,3,0,0,6.28);g.fill();}
  g.restore();
  // glass front: outline, highlights, lid
  g.strokeStyle='rgba(220,245,255,.85)';g.lineWidth=3;g.beginPath();g.roundRect(cx-w/2,top,w,bot-top,26);g.stroke();
  g.fillStyle='rgba(255,255,255,.28)';g.beginPath();g.roundRect(cx-w/2+10,top+16,10,bot-top-60,6);g.fill();g.fillStyle='rgba(255,255,255,.14)';g.beginPath();g.roundRect(cx+w/2-24,top+30,6,bot-top-90,4);g.fill();
  g.fillStyle='#6A4A2A';g.beginPath();g.roundRect(cx-w/2+14,top-18,w-28,22,6);g.fill();g.fillStyle='#8A6A3A';g.fillRect(cx-w/2+18,top-14,w-36,5);
  g.fillStyle='#C1121F';g.beginPath();g.roundRect(cx-34,top+(bot-top)*0.18,68,26,6);g.fill();g.fillStyle='#FFE8C8';g.font='12px "Press Start 2P", monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('ENMA',cx,top+(bot-top)*0.18+13);
  // amount and level
  const py=bot-(bot-top)*0.46;g.fillStyle='rgba(12,6,8,.82)';g.beginPath();g.roundRect(cx-72,py-26,144,66,14);g.fill();g.strokeStyle='rgba(255,201,58,.7)';g.lineWidth=2;g.stroke();
  g.font='bold 30px Inter, sans-serif';g.fillStyle='#FFFFFF';g.fillText(usd(cents),cx,py);g.font='700 13px Inter, sans-serif';g.fillStyle='#FFC93A';g.fillText('ENMA LEVEL '+L,cx,py+26);}
function renderBoss(){
  const L=bossLevel(),md=bossMods(L);
  $('bs-clock').innerHTML=`Level<b>${L}</b>stronger after every defeat`;
  $('bs-fi').innerHTML=`<span class="tbadge t3" style="background:linear-gradient(#FF6A3C,#8E1015);color:#FFF2E0;border-color:#FF6A00">BOSS</span><h3>Enma, King of Hell</h3>`+
    `<div>Judge of the dead. Every time a player defeats him, anywhere, he returns one level stronger for everyone.</div><div class="lvl">LEVEL ${L}</div>`+
    `<div><span class="mv">Hellfire:</span> a huge fireball. His iron club outreaches every fighter.</div><div class="jar-note">Every $1 try puts 90¢ in the jar. Beat Enma on a $1 try and the whole jar is yours. Free tries are practice. He gets harder every time anyone wins.</div>`;
  const a=document.createElement('div');a.className='acts';const nm=CH[owns(SEL.kit)?SEL.kit:'oni'].name;
  const paid=document.createElement('button');paid.className='arc boss';paid.type='button';paid.textContent='$1 try as '+nm+' · win the jar';paid.onclick=()=>{if(paidBlock(100)){toast(paidBlock(100));return;}if(!confirm('Pay $1 for one try against Enma? 90% goes into the jar. Beat him and the whole jar is yours. (Demo: no real money moves.)'))return;addSpend(100);payTry();startBoss(true);};
  const go=document.createElement('button');go.className='arc alt';go.type='button';go.textContent='Free try';go.onclick=()=>startBoss(false);a.append(paid);
  const pick=document.createElement('button');pick.className='arc alt';pick.type='button';pick.textContent='Change fighter';pick.onclick=()=>{openSelect('cpu');$('sel-note').innerHTML='Pick your fighter, then go back to <strong>Challenge Enma</strong>.';};
  a.append(go,pick);$('bs-fi').appendChild(a);
  showcase($('bs-cv'),'enma',2,0);drawJar($('bs-jar'),jarCents(),L);
  $('bs-stats').innerHTML=`<div class="lb-stat s"><b>${usd(jarCents())}</b>In the jar</div><div class="lb-stat"><b class="w">x${md.hp.toFixed(2)}</b>Health</div><div class="lb-stat"><b class="w">x${md.dmg.toFixed(2)}</b>Damage</div>`+
    `<div class="lb-stat s"><b>${bossTotal()}</b>Defeats by the community</div><div class="lb-stat d"><b>${myBossKills()}</b>Your defeats of Enma</div>`;
  const sec=$('bs-slayers');const list=DB.boss.filter(d=>d.kills>0).sort((a,b)=>b.best-a.best||b.kills-a.kills).slice(0,20);
  if(!list.length){sec.innerHTML='<h3>Enma Slayers</h3><div class="lb-empty">Nobody has defeated Enma yet. Be the first name on this wall.</div>';return;}
  resolveNames(list.map(d=>d.id));
  sec.innerHTML='<h3>Enma Slayers</h3><div class="lbwrap"><table class="lbt"><thead><tr><th>#</th><th>Player</th><th class="num">Highest level beaten</th><th class="num">Defeats</th></tr></thead><tbody>'+
    list.map((d,i)=>`<tr class="${d.id===DB.me?'me':''}"><td class="pos">${i+1}</td><td class="who">${esc(nameOf(d.id))}</td><td class="num">${d.best|0}</td><td class="num">${d.kills|0}</td></tr>`).join('')+'</tbody></table></div>';
}
function openBoss(){auInit();SFX.select();renderBoss();show('p-boss');$('p-boss').scrollTop=0;}
function startBoss(paid){
  auInit();SFX.fight();const L=bossLevel();TR.bossPaid=!!paid;const kit=owns(SEL.kit)?SEL.kit:'oni';
  level=bossAI(L);cpuMem={hold:0,bits:0,gap:false};mode='boss';TR.bossL=L;
  M=mkMatch('boss',0,[kit,'enma'],2,{need:2,pal:[myPal(kit),0],mods:[{hp:1,dmg:1},bossMods(L)]});
  lastEv=0;endShown=false;show(null);$('quit').hidden=false;musicStart();
}


/* ===================== LANDING PAGE ===================== */
const DEMO={i:0,mem:{hold:0,bits:0,gap:false},pairs:[['aka','ao'],['kin','kongo'],['ao','kin'],['kongo','aka']]};
function startDemo(){
  const pr=DEMO.pairs[DEMO.i%DEMO.pairs.length];DEMO.i++;
  mode='demo';cpuMem={hold:0,bits:0,gap:false};DEMO.mem={hold:0,bits:0,gap:false};
  M=mkMatch('demo',0,['oni','oni'],1,{pal:[0,1],skins:pr});M.scene='intro';M.sceneT=0;M.f.forEach((f,i)=>{f.skin=pr[i];});lastEv=0;
}
function demoTick(){if(mode==='demo'&&M&&M.scene==='matchEnd'&&M.sceneT>150)startDemo();}
function leaveLanding(){auInit();SFX.select();enterVillage();}
function renderLanding(){
  const ev=document.getElementById('ld-event');if(ev){ev.hidden=!EVENT;if(EVENT)ev.innerHTML=`<b>YOKAI NIGHT</b> October event: ghost fire in the village and double fun. Ends ${new Date(EVENT.until).toISOString().slice(0,10)}.`;}
  renderLive();
  const fb=document.getElementById('ld-founders');if(fb)fb.innerHTML=`<b>FOUNDERS</b> Genesis Oni for the first 200 · ${foundersLeft()} left`;
  const F=[['play','1v1 for the pot','Same stake. Winner takes it.',()=>{SFX.select();openSelect('online');}],['tenka','TENKA','Five cups and the Grand Tournament',openTourney],['enma',"Enma's jar",'$1 a try. Beat him, take the jar.',openBoss],
    ['clans','Clans','Win $ONI every week',openClans],['shop','Market','SOL, or $ONI for -20%',()=>openStore()],['missions','Missions','Daily rewards, chests, streaks',openMissions]];
  const fe=$('ld-feats');fe.innerHTML='';F.forEach(([ic,b,s,go])=>{const d=document.createElement('button');d.type='button';d.className='ld-feat2';const ib=document.createElement('span');ib.className='ld-ib';ib.appendChild(iconEl(ic));d.appendChild(ib);
    d.insertAdjacentHTML('beforeend',`<b>${b}</b><small>${s}</small>`);d.onclick=()=>{auInit();enterVillage();go();};fe.appendChild(d);});
  {const hero=document.querySelector&&document.querySelector('#p-landing .ld-hero'),bot=hero&&hero.querySelector('.ld-bot');
    if(hero&&bot&&!hero.querySelector('.ld-fan')){const fan=document.createElement('div');fan.className='ld-fan';fan.setAttribute('aria-hidden','true'); // hero art: a fanned hand of fighter cards
      ['kitsune','oni','tengu'].forEach((k,i)=>{const c=document.createElement('span');c.className='ld-card c'+i;c.appendChild(posterEl(k,0));fan.appendChild(c);});hero.insertBefore(fan,bot);}}
  const r=$('ld-roster');r.innerHTML='';
  FIGHTERS.forEach(fd=>{const d=document.createElement('button');d.type='button';d.className='ld-f2';d.appendChild(posterEl(fd.kit,0));d.insertAdjacentHTML('beforeend',`<span>${esc(CH[fd.kit].name)}</span>`);d.onclick=()=>{auInit();enterVillage();openChampions(fd.kit);};r.appendChild(d);});
}
$('ld-play').onclick=leaveLanding;$('ld-play2').onclick=leaveLanding;
/* ===================== HOW TO PLAY ===================== */
let HOW_BACK='p-title';
function openHow(from){auInit();SFX.select();HOW_BACK=from||'p-title';renderHow();show('p-how');$('p-how').scrollTop=0;}
function renderHow(){
  const S=[];const sec=(id,t,html)=>S.push({id,t,html});
  const tab=(head,rows)=>`<table class="htab"><thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  sec('goal','The goal',`<p>Two fighters, one arena. Knock your opponent out to win a round. A normal match is <b>best of 3</b>: the first to win <b>2 rounds</b> wins. Each round lasts <b>60 seconds</b>. If time runs out, the fighter with more health left, in percent, wins the round.</p>
    <p><b>Knockout</b> is one round, no second chances. In tournaments, rounds are <b>30% faster</b> and the last four play <b>best of 5</b>.</p>`);
  sec('keys','Buttons',tab(['Action','Keyboard','Phone'],[
    ['Walk','A / D or arrows','◀ ▶'],['Jump','W, ↑ or Space','▲'],['Crouch','S or ↓','▼'],['Attack','J','ATTACK'],['Kick','K','KICK'],['Curse (special)','L','CURSE'],
    ['Throw','Q or I, or J and K together','THROW'],['Block','Hold E or Shift (or hold back)','BLOCK'],['Crouch block','E + S','BLOCK + ▼'],['Sweep','S + K','▼ + KICK'],
    ['Dash','Tap forward or back twice','Double tap ◀ or ▶'],['Super','S + L with a full meter','▼ + CURSE'],['Other keys','Z attack, X kick, C curse, V throw','']]));
  sec('attacks','Attacks and heights',`<p>Every attack hits at a height. Reading heights is how you break a defense.</p>`+tab(['Move','Height','How to block it'],[
    ['Attack (J)','High','Stand block. <b>Crouching dodges it completely.</b>'],['Kick (K)','Mid','Stand or crouch block'],['Crouch attack (S+J)','Mid','Stand or crouch block'],
    ['Sweep (S+K)','Low, knocks down','Only a crouch block'],['Any attack in the air','Overhead','Only a stand block'],['Curse moves','Mostly mid','See each fighter'],['Throw','Unblockable','Escape it, see Defense'],['Super','Mid','Stand or crouch block, heavy chip']]));
  sec('defense','Defense',`<p><b>Block</b> by holding away from your opponent while they attack. There is no guard button. Hold down and away to block low.</p>
    <p><b>Chip damage:</b> a blocked hit still does 25% of its damage, 30% for supers.</p>
    <p><b>Guard Break:</b> a thin line under your health shows your guard. Every block fills it. Block too much in a row, about five kicks, and your guard breaks: you are stunned and open. The line empties again after a short break from blocking.</p>
    <p><b>Throws</b> beat blocking. You cannot be thrown while you are being hit, in the air, or already stunned. When you are grabbed, press throw right away to <b>escape</b>. If both players throw at the same moment, nobody gets thrown.</p>`);
  sec('meter','Meter, curses and super',`<p>The CURSE meter fills when you land hits, a little when you are hit, and a little when your attacks are blocked.</p>
    <p><b>Curse</b> is your fighter's special move and costs <b>half</b> the meter. At full meter the label changes to SUPER.</p>
    <p><b>Oni Wrath</b> is the super for every fighter: down and curse with a full meter. It is invulnerable at the start, lunges forward and does <b>26 damage</b>.</p>`+
    tab(['Fighter','Curse move'],FIGHTERS.map(fd=>[esc(CH[fd.kit].name),`<b>${esc(fd.mv[0])}</b>. ${esc(fd.mv[1])}`])));
  sec('modes','Modes',tab(['Mode','What it is'],[
    ['Practice','Fight the CPU for free. Pick the opponent: Very easy, Easy, Normal, Hard or Auto.'],['Training','Hitboxes, frame data, input history and a dummy you control.'],['Play 1v1','Real stakes against another player. Create a match or join with a code.'],
    ['TENKA','Tournaments: Ashigaru Cup (free, weekly), Ronin, Daimyo, Shogun and Tenno Cup, each on its own arena, plus the monthly Grand Tournament.'],['Enma','The community boss. Free tries for practice, or $1 tries that fill his jar. Beat him on a $1 try and the whole jar is yours.'],['Coming soon','Grand Tournament, Clan Wars 3v3 and 5v5, God tier fighters and new fighters every few weeks.']]));
  sec('stakes','Stakes and fees',`<p>Both players put in the same stake. The winner takes the pot minus the game fee: <b>5%</b>, or <b>4%</b> for Silver, <b>3.5%</b> for Jade and <b>3%</b> for Gold $ONI holders. Stakes are in SOL. Of that 5%, <b>1%</b> goes to rank rewards (the Season Cauldron), <b>0.5%</b> to the Curse Cauldron, and 3.5% to ONI.</p>
    `+tab(['Arena','Stake per player'],MAPS.filter(mp=>!mp.tourney).map((mp,i)=>[esc(mp.name),i===0?'Free, $0.50 or $3':mp.id==='launchpad'?'$100, Launch Bonus Mode for the first weeks after launch':mp.stake?usd(mp.stake):'No limit, $50 to $500, Legendary fighter owners only']))+
    `<p>Leaving a match or disconnecting counts as a loss.</p>`);
  sec('tourney','Tournaments',`<p>Pay the entry, get seeded by rating so the strongest meet late, and win every match. The two semifinal losers play once more for 3rd place.</p>`+
    tab(['Cup','Entry','Players','Champion'],CUPS.map(c=>[c.name,c.entry?usdC(c.entry):'Free',String(c.size),c.prize?esc(c.prize):usdC(cupPayout(c).first)]))+
    `<p>Prizes are 90% of all entries: <b>55%</b> to the champion, <b>17.5%</b> each to 2nd and 3rd. The other 10% is 5% to ONI, 3% to rank rewards (the Season Cauldron) and 2% to the Curse Cauldron.</p><p>Every paid cup gives its own <b>medal</b> to the champion: Ronin, Daimyo, Shogun and Tenno, shown on your profile.</p><p><b>Grand Tournament</b>, once a month: 160 players, $20 entry, the top 20 are paid ($1,000 to the champion, $20 back for 16th to 20th), a $ONI bonus from the ONI team, and the Grand medal. From the Round of 16, matches will stream live on the ONI home page (planned).</p>`);
  sec('ranked','Ranks and rating',`<p>Everyone starts at a rating of <b>1000</b>. Beating a stronger player moves you more, and your first 10 matches move faster. Each rank has three divisions, III to I.</p>`+
    tab(['Rank','From rating'],RANKS.map(r=>[r.n,r.lord?'The top 50 rated players of the season':String(r.min)])));
  sec('season','Seasons and prizes',`<p><b>Season points</b> decide the prizes. A win gives 10 points times the arena tier: Summit 1, Temple 2, Yomi 3, Colosseum and Launchpad 4. A loss gives the tier once. Free matches give half. Beating the same opponent again counts less: full, half, a quarter, then a tenth.</p><p><b>Activity bonus:</b> 3 ranked matches in a day makes it an active day. Each active day in the last 7 adds 5% to all your season points, up to <b>x1.35</b> if you play every day.</p>
    <p>Seasons last <b>2 weeks</b>. To qualify, play <b>5 ranked matches against 3 different opponents</b>. The <b>top 100</b> split the Season Cauldron when the season ends.</p>`+
    tab(['Place','Share'],BRACKETS.map(x=>[x.from===x.to?'#'+x.from:'#'+x.from+' to #'+x.to,x.pct+'% each']))+
    `<p><b>Mythic skins:</b> when the season ends, the top 10 Oni Lords get the diamond <b>Kongo-Oni</b>, places 11 to 50 get the gold <b>Kin-Oni</b>. They can never be bought.</p>`);
  sec('cauldrons','The Curse Cauldron airdrop',`<p>Every <b>Sunday at 20:00 UTC</b> the Curse Cauldron is airdropped to <b>20 players</b>, 5% each. You earn <b>airdrop points</b> from ranked matches, one per opponent per day (up to 5 a day from free matches), plus <b>one free point a day</b>. No purchase is needed.</p>`);
  sec('fighters','Fighters and tiers',`<p><b>Every fighter has the same strength</b>, tested over thousands of fights. Buying a fighter gets you a new way to play and style, never an advantage.</p>`+
    tab(['Tier','Price','What you get'],[['Starter','Free','Aka or Ao Oni'],['Rare','$20 · $16 with $ONI','A fighter with a unique move, an emote pack and 500 XP'],['Epic','$89 · $71.20 with $ONI','Plus a weapon skin, an emote pack and 1,500 XP'],['Legendary','$200 · $160 with $ONI','Plus a finisher, a frame, a pet, 3,000 XP and the Oni Colosseum'],['Mythic','Earned','Kin-Oni and Kongo-Oni, top 50 of a season']])+`<p>Pay in SOL, or with <b>$ONI and save 20%</b>. Purchase bonuses are cosmetics and XP only.</p>`);
  sec('enma','Enma',`<p>Enma is the King of Hell. Each time any player defeats him, he returns <b>one level stronger for everyone</b>: more health, more damage and a sharper mind. The Enma Slayers wall shows who beat him at the highest level.</p><p><b>The jar:</b> every $1 try puts 90¢ in Enma's jar. Beat him on a $1 try and the whole jar is yours. Free tries are practice.</p>`);
  sec('progress','Levels, missions and chests',`<p>Every match gives <b>XP</b>: 100 for a win, 40 for a loss, more for a flawless win, missions, Arcade and TENKA titles. Your level shows next to your name in the village.</p><p>Three <b>daily missions</b> give +30 XP and an airdrop point each. Finish all three for the <b>daily sweep</b>: a bonus chest and +100 XP. Do it day after day to build your streak.</p><p><b>Reward chests</b> come from every new level and every daily sweep. Odds are shown on the Missions page, and chest items stay on your account.</p>`);
  sec('clans','Clans',`<p>Join or create a clan with a tag of 2 to 5 letters. The leader picks the emblem. Your ranked wins score for your clan.</p><p>Every month the top 3 clans of the <b>Clan War</b> win <b>250K, 150K and 100K $ONI</b> (500K in total), shared by their members. Clan Wars 3v3 and 5v5 are coming.</p>`);
  sec('market','Market and trade',`<p>The Market has fighters, bundles (you always see what is inside), skins, weapon skins, pets, finishers, emotes and frames, all cosmetic.</p><p><b>Trade:</b> limited items can be sold to other players. The fee is <b>2.5% for the buyer and 2.5% for the seller</b>, paid in $ONI, and it all goes to advertising ONI. Every listing shows the total cost.</p><p><b>$ONI holders:</b> free, $1 and $3 matches need no $ONI. Bronze ($30) is needed for stakes above $3, Silver ($100) lowers the fee to 4% and opens Daimyo and Shogun Cups, Jade ($500) lowers it to 3.5%, Gold ($1,000) lowers it to 3% and opens the Tenno Cup. From Silver up, the Battle Pass is included (coming soon).</p>`);
  sec('fair','Fair play',`<p>Results are decided by the game server, not by either player's device. Leaving or disconnecting loses the match. In tournaments you have 60 seconds to press Ready. Collusion and multiple accounts to farm points are against the rules, and repeated wins against the same opponent earn fewer points.</p>
    <p>This is a demo: no real money moves yet.</p>`);
  $('how-toc').innerHTML=S.map(s=>`<a href="#how-${s.id}">${s.t}</a>`).join('');
  $('how-body').innerHTML=S.map(s=>`<section id="how-${s.id}"><h3 class="hs">${s.t}</h3>${s.html}</section>`).join('');
  document.querySelectorAll('#how-toc a').forEach(a=>a.onclick=e=>{e.preventDefault();const el=document.getElementById(a.getAttribute('href').slice(1));if(el)el.scrollIntoView({behavior:'smooth',block:'start'});});
}
$('ld-how').onclick=()=>openHow('p-landing');
$('b-how').onclick=()=>openHow('p-title');
$('hw-back').onclick=()=>{SFX.select();show(HOW_BACK);};


/* ===================== ONI VILLAGE (playable) ===================== */
const VIL={active:false,x:Math.round(560*(typeof VS!=='undefined'?VS:1)),y:Math.round(386*(typeof VS!=='undefined'?VS:1))+74,dir:'up',step:0,walk:0,t:0,cam:[0,0],bg:null,peers:[],rp:{},emote:null,et:0,prev:0,pubT:0,last:'',incoming:null,dismissed:{},prompt:null,myPeer:null,chal:null};
const EMOTES=['GG!','BOW','FIGHT ME!','NICE!'];
const NPCST=[];
function npcInit(){if(NPCST.length||typeof NPCS==='undefined')return;for(const n of NPCS)NPCST.push(Object.assign({},n,{x:n.hx,y:n.hy,tx:n.hx,ty:n.hy,wait:Math.random()*200,dir:1,walk:0,say:null,sayT:0,li:0,next:300+Math.random()*600}));}
function npcTick(){for(const n of NPCST){
  if(n.wait>0){n.wait--;n.walk=0;}else{const dx=n.tx-n.x,dy=n.ty-n.y,d=Math.hypot(dx,dy);
    if(d<1){n.wait=90+Math.random()*240;const a=Math.random()*6.28,r=Math.random()*n.r;n.tx=n.hx+Math.cos(a)*r;n.ty=n.hy+Math.sin(a)*r*0.6;}
    else{const sp=0.45;const nx=n.x+dx/d*sp,ny=n.y+dy/d*sp;if(!vilBlocked(nx,ny)){n.x=nx;n.y=ny;n.walk=1;n.dir=dx<0?-1:1;}else{n.tx=n.hx;n.ty=n.hy;}}}
  if(n.sayT>0)n.sayT--;else if(--n.next<=0){n.say=n.lines[Math.floor(Math.random()*n.lines.length)];n.sayT=200;n.next=600+Math.random()*900;}}}
function myLook(){const pr=myProfile();const k=pr&&pr.main&&CH[pr.main]?pr.main:SEL.kit;return k==='oni'?(SEL.opal===4?'genesis':SEL.opal?'ao':'aka'):k;}
function peerName(p){return p.isMe?(myProfile()?myProfile().name:'You'):p.by?nameOf(p.by):'Guest';}
function peerRank(by){const e=DB.board&&by?DB.board.map.get(by):null;const r=e?e.rating:1000;return{t:rankName(r,e&&e.lord).toUpperCase(),c:(e&&e.lord?RANKS[5]:rankOf(r)).c};}
function enterVillage(){setTimeout(()=>{let near=null,nd=1e9;for(const z of VZ){const d=Math.hypot(z.x-VIL.x,(z.y-VIL.y)*1.3);if(d<nd){nd=d;near=z;}}VIL.lockZone=near&&nd<30?near.id:null;renderPCard();},0);
  if(!VIL.bg&&typeof buildVillageBG==='function')VIL.bg=buildVillageBG();
  auInit();VIL.active=true;mode='village';M=null;musicStop();
  const tb=document.getElementById('trbar');if(tb)tb.hidden=true;$('quit').hidden=true;
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('on'));document.body.classList.remove('menu','landing');
  $('vil-menu').hidden=false;refreshProfileBtn();
}
function classicMenu(){openSettings();}
function vilOpen(id){
  SFX.select();
  const go={dojo:()=>{openSelect('cpu');$('sel-note').innerHTML='Fight the CPU, or press <strong>Training mode</strong>.';},gate:openBoss,lords:()=>{DB.tab='season';show('p-board');renderBoard();$('p-board').scrollTop=0;},
    market:()=>openStore(),shrine:openTourney,home:openProfile,arena:()=>openSelect('online'),cauldrons:openCauldrons,
    champs:()=>{DB.tab='season';show('p-board');renderBoard();},cell:()=>{openStore();STORE.myth='boss';renderStore();}}[id];
  if(go)go();
}
function vilNearPeer(){let best=null,bd=34;for(const p of VIL.peers){if(p.isMe||!p.presence||!p.presence.v)continue;const r=VIL.rp[p.peer];if(!r)continue;const d=Math.hypot(r.x-VIL.x,(r.y-VIL.y)*1.4);if(d<bd){bd=d;best=p;}}return best;}
async function vilChallenge(p){
  if(!NET.avail){VIL.toast='Challenges work when the game is opened on claude.ai.';VIL.toastT=180;return;}
  const code=genCode();VIL.chal={to:p.peer,code,t:Date.now()};vilPublish(true);
  SEL.ctx='online';SEL.map=0;SEL.low=0;SEL.fmt='bo3';if(!owns(SEL.kit))SEL.kit='oni';
  await createMatch(code);
}
async function vilAccept(){
  const inc=VIL.incoming;if(!inc)return;VIL.dismissed[inc.code]=1;VIL.incoming=null;SFX.coin();
  SEL.ctx='online';if(!owns(SEL.kit))SEL.kit='oni';NET.kit=SEL.kit;vilPublish(true,true);
  if(await netJoin(inc.code,false)){NET.joinTimer=setTimeout(()=>{if(NET.role==='pending'){netLeave();enterVillage();VIL.toast='That challenge is no longer open.';VIL.toastT=180;}},6000);}
}
function vilPublish(force,away){
  if(!NET.lobby)return;const now=performance.now();
  const v=(!VIL.active||away||mode!=='village')?null:{x:Math.round(VIL.x),y:Math.round(VIL.y),d:VIL.dir,l:myLook(),av:myAvatar()||undefined,e:VIL.emote,et:VIL.et,w:VIL.walk>0?1:0,ch:VIL.chal&&Date.now()-VIL.chal.t<30000?{to:VIL.chal.to,code:VIL.chal.code}:null};
  const s=JSON.stringify(v);if(!force&&(s===VIL.last||now-VIL.pubT<60))return;
  // forced sends (emotes, challenges) still keep a 33 ms floor: a burst collapses into one trailing send
  if(force&&now-VIL.pubT<33){clearTimeout(VIL.pubTm);VIL.pubTm=setTimeout(()=>vilPublish(true,away),34);return;}
  VIL.last=s;VIL.pubT=now;try{NET.lobby.presence({v});}catch(e){}
}
function vilInput(bits){
  const edge=bits&~VIL.prev;VIL.prev=bits;
  let dx=((bits&IN.R)?1:0)-((bits&IN.L)?1:0),dy=((bits&IN.D)?1:0)-((bits&IN.U)?1:0);
  if(dx||dy){const len=Math.hypot(dx,dy);const sp=myAvatar()==='emperor'?3.4:1.7;const nx=VIL.x+dx/len*sp,ny=VIL.y+dy/len*sp;
    if(!vilBlocked(nx,VIL.y))VIL.x=nx;if(!vilBlocked(VIL.x,ny))VIL.y=ny;
    VIL.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');VIL.walk++;}else VIL.walk=0;
  VIL.step=Math.floor(VIL.walk/8)%2;
  if((edge&IN.P)||VIL.wantE){VIL.wantE=false;vilAct();}
  if(edge&IN.K){vilEmote((EMOTES.indexOf(VIL.emote)+1)%EMOTES.length);}
  if(edge&IN.S){classicMenu();}
}
function vilEmote(i){misProgress('emote');VIL.emote=EMOTES[i];VIL.et=Date.now();SFX.select();vilPublish(true);}
function vilAct(){const pr=VIL.prompt;if(!pr)return;if(pr.kind==='npc'){const n=pr.npc;n.li=(n.li+1)%n.lines.length;n.say=n.lines[n.li];n.sayT=260;n.next=900;SFX.select();return;}if(pr.kind==='accept')vilAccept();else if(pr.kind==='zone')vilOpen(pr.id);else if(pr.kind==='peer')vilChallenge(pr.peer);}
function vilTick(bits){
  VIL.t++;vilInput(bits);
  if(VIL.emote&&Date.now()-VIL.et>3500)VIL.emote=null;
  for(const p of VIL.peers){const v=p.presence&&p.presence.v;if(p.isMe||!v)continue;const r=VIL.rp[p.peer]||(VIL.rp[p.peer]={x:v.x,y:v.y});r.x+=(v.x-r.x)*0.25;r.y+=(v.y-r.y)*0.25;}
  const me=VIL.peers.find(p=>p.isMe&&p.sameTab);VIL.myPeer=me?me.peer:null;
  VIL.incoming=null;
  for(const p of VIL.peers){const v=p.presence&&p.presence.v;if(p.isMe||!v||!v.ch||v.ch.to!==VIL.myPeer||VIL.dismissed[v.ch.code])continue;VIL.incoming={from:p,code:v.ch.code};}
  let pr=null;
  if(VIL.incoming)pr={kind:'accept',text:'Accept '+peerName(VIL.incoming.from)+"'s challenge"};
  else{const np=vilNearPeer();if(np)pr={kind:'peer',peer:np,text:'Challenge '+peerName(np)};
    else{let nn=null,nd=22;for(const n of NPCST){const d=Math.hypot(n.x-VIL.x,(n.y-VIL.y)*1.3);if(d<nd){nd=d;nn=n;}}
      if(nn)pr={kind:'npc',npc:nn,text:'Talk to '+nn.name};
      else for(const z of VZ){if(Math.hypot(z.x-VIL.x,(z.y-VIL.y)*1.3)<24){pr={kind:'zone',id:z.id,text:z.label};break;}}}}
  VIL.prompt=window.STAGE_NOTAGS?null:pr;
  {let near=null,nd=1e9;for(const z of VZ){const d=Math.hypot(z.x-VIL.x,(z.y-VIL.y)*1.3);if(d<nd){nd=d;near=z;}}
   if(VIL.lockZone&&(!near||near.id!==VIL.lockZone||nd>30))VIL.lockZone=null;
   if(near&&nd<13&&VIL.lockZone!==near.id&&VIL.walk>0&&VIL.dir==='up'&&VIL.y>=near.y-2&&!VIL.incoming){VIL.lockZone=near.id;vilOpen(near.id);}}
  const cx=Math.max(0,Math.min(VW-480,VIL.x-240)),cy=Math.max(VTOP-110,Math.min(VH-270,VIL.y-((VIL.x<230*VS||VIL.x>880*VS)?255:195)));VIL.cam=[cx,cy];
  vilPublish(false);
  if(VIL.toastT>0)VIL.toastT--;
}
function renderVillage(){
  const g=ctx;g.setTransform(2,0,0,2,0,0);g.imageSmoothingEnabled=false;const [cx,cy]=VIL.cam;
  if(VIL.bg)g.drawImage(VIL.bg,Math.round(cx*2),Math.round(cy*2),960,540,0,0,480,270);
  const b=DB.board;{const [pdx,pdy]=vpD('plaza');vilCauldron(g,328+VOX+pdx-cx,276+VOY+pdy-cy,'season',VIL.t,usd(b?b.pool:0));vilCauldron(g,392+VOX+pdx-cx,276+VOY+pdy-cy,'curse',VIL.t,usd(b?b.drop:0));}
  const ents=[{x:VIL.x,y:VIL.y,d:VIL.dir,l:myLook(),av:myAvatar(),s:VIL.step,me:true,name:myProfile()?myProfile().name:'You',by:DB.me,e:VIL.emote}];
  for(const p of VIL.peers){const v=p.presence&&p.presence.v;if(p.isMe||!v)continue;const r=VIL.rp[p.peer]||v;ents.push({x:r.x,y:r.y,d:v.d||'down',l:v.l||'aka',av:v.av==='emperor'?(isAdmin(p.by)?'emperor':''):(AVATARS[v.av]?v.av:''),s:v.w?Math.floor(VIL.t/8)%2:0,name:peerName(p),by:p.by,e:v.e&&Date.now()-(v.et||0)<3500?v.e:null});}
  const online=VIL.peers.filter(p=>p.presence&&p.presence.v).length+(VIL.peers.some(p=>p.isMe&&p.sameTab&&p.presence&&p.presence.v)?0:1);
  {const [sdx,sdy]=vpD('sign');vilSignboard(g,Math.round(318+VOX+sdx-cx),Math.round(420+VOY+sdy-cy),online);}
  const b2=DB.board;const champs=b2&&b2.list?b2.list.slice(0,5).map(p=>nameOf(p.id)):[];
  if(typeof vilChampsBig==='function'){const c1=vpD('champs'),c2=vpD('prison'),c3=vpD('bench');vilChampsBig(g,c1[0]-cx,c1[1]-cy,champs,SEASON.n);vilPrison(g,c2[0]-cx,c2[1]-cy,usd(0),VIL.t);vilSitters(g,VOX+c3[0]-cx,VOY+c3[1]-cy,VIL.t);}
  const all=ents.concat(NPCST.map(n=>({npc:n,x:n.x,y:n.y})));all.sort((a,b)=>a.y-b.y);
  for(const e of all){if(e.npc)npcDraw(g,e.npc,Math.round(e.x-cx),Math.round(e.y-cy),VIL.t);else if(e.av==='emperor')emperorDraw(g,Math.round(e.x-cx),Math.round(e.y-cy),e.d,e.s,VIL.t);else if(e.av)avatarDraw(g,Math.round(e.x-cx),Math.round(e.y-cy),e.d,e.av,e.s,VIL.t);else chibiDraw(g,Math.round(e.x-cx),Math.round(e.y-cy),e.d,e.l,e.s,VIL.t);}
  g.textAlign='center';g.textBaseline='middle';
  for(const n of NPCST){if(n.sayT<=0||!n.say)continue;const x=Math.round(n.x-cx),y=Math.round(n.y-cy);g.font='7px "Press Start 2P"';
    const bw=Math.max(g.measureText(n.say).width,g.measureText(n.name).width)+12;g.fillStyle='rgba(243,233,228,.96)';g.fillRect(x-bw/2,y-50,bw,24);g.fillRect(x-2,y-26,4,3);
    g.fillStyle='#8A5A00';g.fillText(n.name,x,y-44);g.fillStyle='#1A0506';g.fillText(n.say,x,y-34);}
  g.textAlign='center';g.textBaseline='middle';
  for(const e of ents){if(window.STAGE_NOTAGS)break;const x=Math.round(e.x-cx),y0=Math.round(e.y-cy),big=e.av==='emperor',y=big?y0-42:y0;const rk=peerRank(e.by);
    g.font='7px "Press Start 2P"';const w=Math.max(g.measureText(e.name).width,g.measureText(rk.t).width)+10;
    {const nm=(clanOf(e.by)?'['+clanOf(e.by)+'] ':'')+e.name;const lvt=' Lv '+levelOf(e.me?myXP():xpOfId(e.by)).L;g.font='7px "Press Start 2P"';const w1=g.measureText(nm).width,w2=g.measureText(lvt).width,ww=w1+w2+10;
      g.fillStyle=big?'rgba(40,10,60,.9)':'rgba(10,5,6,.82)';g.fillRect(x-ww/2,y-50,ww,12);if(big){g.fillStyle='#FFC93A';g.fillRect(x-ww/2,y-50,ww,1);g.fillRect(x-ww/2,y-39,ww,1);}g.textAlign='left';g.fillStyle=big?'#FFE08A':e.me?'#2EC4B6':'#F3E9E4';g.fillText(nm,x-ww/2+5,y-44);g.fillStyle='#FFC93A';g.fillText(lvt,x-ww/2+5+w1,y-44);g.textAlign='center';
      if(big){g.font='6px "Press Start 2P"';g.fillStyle='#C49BFF';g.fillText('★ ONI EMPEROR ★',x,y-56);}}
    if(e.e){g.font='8px "Press Start 2P"';const bw=g.measureText(e.e).width+12;g.fillStyle='#F3E9E4';g.fillRect(x-bw/2,y-78,bw,15);g.fillRect(x-2,y-63,4,3);g.fillStyle='#1A0506';g.fillText(e.e,x,y-70);}}
  if(EVENT&&EVENT.id==='yokai'){g.fillStyle='rgba(40,0,70,.16)';g.fillRect(0,0,480,270);
    for(let k=0;k<16;k++){const wx=(k*173)%VW,wy=240+(k*97)%420;const sx=wx-cx,sy=wy-cy+Math.sin((VIL.t+k*30)*0.05)*3;if(sx<-10||sx>490||sy<-10||sy>280)continue;
      g.fillStyle='rgba(120,200,255,.25)';g.beginPath();g.arc(sx,sy,6,0,6.28);g.fill();g.fillStyle=k%2?'#9BD8FF':'#C49BFF';g.fillRect(Math.round(sx)-2,Math.round(sy)-3,4,5);g.fillStyle='#FFFFFF';g.fillRect(Math.round(sx)-1,Math.round(sy)-2,2,2);}
    g.font='7px "Press Start 2P"';g.textAlign='center';g.fillStyle='rgba(10,5,6,.85)';g.fillRect(170,6,140,14);g.fillStyle='#C49BFF';g.fillText('YOKAI NIGHT EVENT',240,14);}
  // top-left: village and players online. Phones: portrait drops the minimap (the canvas is small and the
  // HUD lives in the tray below it), landscape gets a compact minimap so the corners stay clear for the pad.
  const touch=document.body.classList.contains('touch'),port=touch&&innerHeight>innerWidth;VIL.online=online;
  if(port){g.font='9px "Press Start 2P"';const ot=online+' online',ow=g.measureText(ot).width+22;g.fillStyle='rgba(10,5,6,.82)';g.fillRect(4,4,ow,16);g.fillStyle='#2EE88A';g.fillRect(9,10,4,4);g.textAlign='left';g.fillStyle='#F3E9E4';g.fillText(ot,17,13);}
  else{g.fillStyle='rgba(10,5,6,.85)';g.fillRect(6,6,104,26);g.textAlign='left';g.font='8px "Press Start 2P"';g.fillStyle='#2EC4B6';g.fillText('ONI VILLAGE',12,14);g.font='7px "Press Start 2P"';g.fillStyle='#C9A9A2';g.fillText(online+' online',12,25);}
  // minimap
  const mmx=6,mmy=36,mmw=touch?70:94,mmh=touch?44:62;
  if(VIL.bg&&!port){g.fillStyle='rgba(10,5,6,.88)';g.fillRect(mmx,mmy,mmw+4,mmh+4);g.drawImage(VIL.bg,0,0,VW*2,VH*2,mmx+2,mmy+2,mmw,mmh);
    const mx=x=>mmx+2+x/VW*mmw,my=y=>mmy+2+y/VH*mmh;for(const e of ents){g.fillStyle=e.me?'#2EC4B6':'#F3E9E4';g.fillRect(Math.round(mx(e.x))-1,Math.round(my(e.y))-1,3,3);}
    g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=1;g.strokeRect(mx(cx)+0.5,my(cy)+0.5,480/VW*mmw,270/VH*mmh);}
  // prompt: phones get a tappable DOM chip (#vact) instead of canvas text
  const pr=VIL.prompt;if(touch)vilHud(pr);
  if(pr&&!touch){g.font='8px "Press Start 2P"';const key=touch?'ATK':'E';const tw=g.measureText(pr.text).width;const kw=g.measureText(key).width+8;const w=tw+kw+22;const x0=240-w/2,y0=236;
    g.fillStyle='rgba(10,5,6,.92)';g.fillRect(x0,y0,w,22);g.fillStyle=pr.kind==='accept'?'#FF6A3C':'#FFB000';g.fillRect(x0,y0,w,2);
    g.fillStyle='#F3E9E4';g.fillRect(x0+6,y0+5,kw,13);g.fillStyle='#1A0506';g.textAlign='center';g.fillText(key,x0+6+kw/2,y0+12);g.fillStyle='#F3E9E4';g.textAlign='left';g.fillText(pr.text,x0+kw+14,y0+12);}
  if(VIL.incoming){g.font='8px "Press Start 2P"';const t=peerName(VIL.incoming.from)+' challenges you to a free 1v1!';const w=g.measureText(t).width+20;g.fillStyle='rgba(90,10,14,.92)';g.fillRect(240-w/2,40,w,20);g.fillStyle='#FFE08A';g.textAlign='center';g.fillText(t,240,50);}
  if(VIL.toastT>0&&VIL.toast){g.font=port?'9px "Press Start 2P"':'7px "Press Start 2P"';const w=g.measureText(VIL.toast).width+16,ty=touch?66:210;g.fillStyle='rgba(10,5,6,.9)';g.fillRect(240-w/2,ty,w,port?18:16);g.fillStyle='#F3E9E4';g.textAlign='center';g.fillText(VIL.toast,240,ty+(port?9:8));}
  // help line (keyboard only; phones show the hint chips in #vact)
  if(!touch){g.font='7px "Press Start 2P"';g.textAlign='right';g.fillStyle='rgba(243,233,228,.75)';g.fillText('WASD: walk   E: enter   1-4: emotes   Tab: menu',474,264);}
  g.setTransform(3,0,0,3,0,0);
}
// Phone context bar: the action you can take right now as a big tappable chip, or button hints when idle.
function vilHud(pr){const el=document.getElementById('vact');if(!el||!el.dataset)return;const k=pr?pr.kind+'|'+pr.text:'-';if(el.dataset.k===k)return;el.dataset.k=k;el.className=pr?'go':'idle';
  if(pr){el.innerHTML=`<button type="button" class="va-go${pr.kind==='accept'?' hot':''}"><i class="va-k">ATK</i><span>${esc(pr.text)}</span><b aria-hidden="true">&#9654;</b></button>`;
    el.firstChild.onclick=()=>{VIL.wantE=true;};}
  else el.innerHTML='<span class="va-h"><i class="va-k mv">&#10021;</i>Walk</span><span class="va-h"><i class="va-k">ATK</i>Enter</span><span class="va-h"><i class="va-k kk">KICK</i>Emote</span>';}
window.addEventListener('keydown',e=>{if(mode!=='village')return;
  if(e.code==='KeyE'){VIL.wantE=true;e.preventDefault();}
  else if(/^Digit[1-4]$/.test(e.code)){vilEmote(+e.code.slice(5)-1);}
  else if(e.code==='KeyM'||e.code==='Escape'){classicMenu();}});
$('vil-menu').onclick=classicMenu;
function gfxLabel(){const b=document.getElementById('b-gfx');if(b)b.textContent='Graphics: '+(GFX.hd?'HD':'Classic');}
$('b-comfort').onclick=()=>{COMFORT.on=!COMFORT.on;try{localStorage.setItem('oni-comfort',COMFORT.on?'on':'off');}catch(e){}$('b-comfort').textContent='Comfort: '+(COMFORT.on?'On':'Off');SFX.select();};
$('b-comfort').textContent='Comfort: '+(COMFORT.on?'On':'Off');
$('b-gfx').onclick=()=>{GFX.hd=!GFX.hd;try{localStorage.setItem('oni-gfx',GFX.hd?'hd':'classic');}catch(e){}gfxLabel();SFX.select();};gfxLabel();
$('b-tut').onclick=startTutorial;$('b-arcade').onclick=()=>{if(!owns(SEL.kit))SEL.kit='oni';startArcade();};$('b-missions').onclick=openMissions;
$('mis-back').onclick=()=>{SFX.select();goHome();};$('cl-back').onclick=()=>{SFX.select();goHome();};$('b-clans').onclick=openClans;$('ko-back').onclick=()=>{SFX.select();show('p-end');};
$('how-tut').onclick=startTutorial;
$('quit').addEventListener('click',()=>{TUT.on=false;tutShow();ARC.on=false;});
document.querySelectorAll('#vbar [data-go]').forEach(b=>b.onclick=()=>{b.blur();auInit();const k=b.dataset.go;
  ({online:()=>{SFX.select();openSelect('online');},tourney:openTourney,boss:openBoss,cpu:()=>{SFX.select();openSelect('cpu');},
    board:()=>{SFX.select();DB.tab='season';show('p-board');renderBoard();$('p-board').scrollTop=0;},store:()=>{SFX.select();openStore();},
    cauldrons:openCauldrons,profile:openProfile,how:()=>openHow('p-title'),missions:openMissions,clans:openClans})[k]();});
$('b-village').onclick=enterVillage;


/* ===================== WAVE 1: TUTORIAL, ARCADE, MISSIONS, ACHIEVEMENTS, CLANS, REFERRALS, EVENTS ===================== */
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
const STATS=LS.get('oni-stats',{wins:0,games:0,perfect:0,arcade:0,tenka:0,tut:0,emotes:0});
function bump(k,n){STATS[k]=(STATS[k]||0)+(n||1);LS.set('oni-stats',STATS);}
/* ---- event: Yokai Night runs through October ---- */
const EVENT=null; // seasonal events: off for now
/* ---- interactive tutorial ---- */
const TUT={on:false,i:0,x0:0,hold:0};
const TUT_STEPS=[
 ['Walk forward','D or →','▶',f=>f.x>TUT.x0+28],
 ['Jump','W or ↑','▲',f=>f.air],
 ['Crouch','S or ↓','▼',f=>f.crouch&&!f.air],
 ['Attack (high)','J','ATTACK',f=>f.st==='punch'&&f.atk==='punch'],
 ['Kick (mid)','K','KICK',f=>f.st==='kick'&&f.atk==='kick'],
 ['Sweep (low): hold down and kick','S + K','▼ + KICK',f=>f.st==='kick'&&f.atk==='sweep'],
 ['Block: hold E while the dummy attacks','hold E (or back)','hold BLOCK',(f,d)=>f.st==='block'],
 ['Throw: get close and grab','I, or J + K','THROW',f=>f.st==='throw'],
 ['Curse, your special move','L','CURSE',f=>f.st==='special'],
 ['Super: meter is full. Down and curse','S + L','▼ + CURSE',f=>f.st==='super']];
function startTutorial(){auInit();SFX.select();SEL.kit='oni';TR.dummy='stand';VIL.active=false;startTraining();TUT.on=true;TUT.i=0;TUT.hold=0;TUT.x0=M.f[0].x;tutShow();}
function tutShow(){const el=$('tut');if(!TUT.on){el.hidden=true;return;}el.hidden=false;const s=TUT_STEPS[TUT.i];const touch=document.body.classList.contains('touch');
  el.innerHTML=TUT.i>=TUT_STEPS.length?`<b>Tutorial complete!</b><span>You know every move. Try Arcade mode or a ranked 1v1.</span><button type="button" class="arc gold" id="tut-done">Finish</button>`:
    `<small>Step ${TUT.i+1} of ${TUT_STEPS.length}</small><b>${s[0]}</b><span>${touch?s[2]:s[1]}</span><i style="width:${TUT.i/TUT_STEPS.length*100}%"></i>`;
  const d=document.getElementById('tut-done');if(d)d.onclick=()=>{TUT.on=false;tutShow();toTitle();};}
function tutTick(){if(!TUT.on||!M||TUT.i>=TUT_STEPS.length)return;const f=M.f[0],d=M.f[1];const s=TUT_STEPS[TUT.i];
  TR.dummy=TUT.i===6?'poke':'stand';if(TUT.i===7&&Math.abs(f.x-d.x)>34)d.x=f.x+(d.x>f.x?30:-30);if(TUT.i===9)f.meter=100;if(TUT.i===8)f.meter=Math.max(f.meter,50);
  if(s[3](f,d)){TUT.hold++;if(TUT.hold>2){TUT.i++;TUT.hold=0;TUT.x0=f.x;SFX.coin();if(TUT.i>=TUT_STEPS.length){bump('tut');checkAch();awardXP(50,'tutorial');}tutShow();}}else TUT.hold=0;}
/* ---- arcade mode: every fighter, then Enma ---- */
const ARC={on:false,i:0,list:[]};
function startArcade(){auInit();SFX.select();ARC.on=true;ARC.i=0;ARC.list=FIGHTERS.map(f=>f.kit).filter(k=>k!==SEL.kit).sort(()=>Math.random()-0.5).slice(0,6).concat(['enma']);arcadeMatch();}
function arcadeMatch(){const opp=ARC.list[ARC.i];vilPublish(true,true);mode='cpu';level=Math.min(3,Math.floor(ARC.i/2)+(opp==='enma'?1:0));cpuKit=opp;
  M=mkMatch('cpu',0,[SEL.kit,opp],[0,1,2,4,5,6,8][ARC.i%7],Object.assign({pal:[myPal(SEL.kit),opp==='oni'?1-myPal(SEL.kit):0]},FMTS.bo3));cpuMem={hold:0,bits:0,gap:false};lastEv=0;endShown=false;show(null);$('quit').hidden=false;musicStart();}
/* ---- daily missions (+1 airdrop point each) ---- */
const MIS_POOL=[['win2','Win 2 matches',2],['play3','Play 3 matches',3],['perfect','Win a round without taking a hit',1],['online','Play an online 1v1',1],['enma','Fight Enma',1],['emote','Use an emote in the village',1],['arcade','Beat 3 opponents in Arcade',3]];
function dayKeyNow(){return new Date().toISOString().slice(0,10);}
function todaysMissions(){const d=dayKeyNow();let h=0;for(const c of d)h=(h*31+c.charCodeAt(0))>>>0;const pool=[...MIS_POOL];const out=[];for(let i=0;i<3;i++){out.push(pool.splice(h%pool.length,1)[0]);h=(h*1103515245+12345)>>>0;}return out;}
function misState(){const s=LS.get('oni-mis',{});if(s.day!==dayKeyNow())return{day:dayKeyNow(),prog:{},done:[]};return s;}
function misProgress(id,n){const s=misState();const list=todaysMissions();const m=list.find(x=>x[0]===id);if(!m||s.done.includes(id))return;s.prog[id]=(s.prog[id]||0)+(n||1);
  if(s.prog[id]>=m[2]){s.done.push(id);SFX.coin();misReward(id);setTimeout(()=>awardXP(30,'mission done'),900);
    if(s.done.length>=list.length&&!s.swept){s.swept=true;addChest(1);const st=LS.get('oni-mstreak',{last:'',n:0});const y=new Date(Date.now()-864e5).toISOString().slice(0,10);st.n=st.last===y?st.n+1:(st.last===dayKeyNow()?st.n:1);st.last=dayKeyNow();LS.set('oni-mstreak',st);
      setTimeout(()=>{awardXP(100,'all missions done');toast('Daily sweep! Bonus chest · streak '+st.n);},1800);}}LS.set('oni-mis',s);}
function drawChestIcon(){const c=document.getElementById('mx-chest-cv');if(!c)return;const g=c.getContext('2d');const n=chests();
  const P=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};g.clearRect(0,0,120,96);
  if(n){const gr=g.createRadialGradient(60,46,4,60,46,60);gr.addColorStop(0,'rgba(255,214,90,.55)');gr.addColorStop(1,'rgba(255,214,90,0)');g.fillStyle=gr;g.fillRect(0,0,120,96);}
  P(22,44,76,40,'#7A4A1E');P(22,44,76,6,'#9A6A2E');P(22,30,76,16,'#8A5A26');P(22,30,76,4,'#B07A3A');for(const x of [22,54,90])P(x,30,8,54,'#C8962A');P(54,30,8,54,'#FFC93A');
  P(52,48,12,12,'#3A2410');P(55,51,6,6,'#FFE08A');P(22,82,76,4,'#4A2A10');}
function misStreak(){const st=LS.get('oni-mstreak',{last:'',n:0});const y=new Date(Date.now()-864e5).toISOString().slice(0,10);return (st.last===dayKeyNow()||st.last===y)?st.n:0;}
async function misReward(id){if(!DB.db||!DB.me)return;const doc=DB.tickets.find(t=>t.id===DB.me)||{};const mis=Object.assign({},doc.mis||{});const d=dayKeyNow();mis[d]=(mis[d]||[]).concat([id]);
  try{await DB.db.collection('tickets').doc(DB.me).set({days:doc.days||[],mis,ts:Date.now()});}catch(e){}}
const _freeTickets=freeTickets;
freeTickets=function(doc){const base=_freeTickets(doc);if(!doc||!doc.mis)return base;const since=lastDrop();let n=0;for(const [d,ids] of Object.entries(doc.mis))if(Date.parse(d+'T00:00:00Z')+86400000>since)n+=Math.min(3,(ids||[]).length);return base+n;};
/* ---- achievements ---- */
const ACH=[['first','First Blood','Win your first match',()=>STATS.wins>=1],['ten','Rising Oni','Win 10 matches',()=>STATS.wins>=10],['hundred','Demon','Win 100 matches',()=>STATS.wins>=100],
 ['student','Student','Finish the tutorial',()=>STATS.tut>=1],['flawless','Flawless','Win a round without taking a hit',()=>STATS.perfect>=1],['arcade','Arcade Legend','Beat Arcade mode',()=>STATS.arcade>=1],
 ['slayer','Enma Slayer','Beat Enma',()=>{const b=DB.boss&&DB.me&&DB.boss.find?DB.boss.find(x=>x.id===DB.me):null;return !!(b&&b.kills>0);}],['champ','Champion','Win a TENKA tournament',()=>STATS.tenka>=1],
 ['clan','Brotherhood','Join a clan',()=>!!(myProfile()&&myProfile().clan)],['founder','Founder','Be one of the first 200 accounts',()=>isFounder()],['lord','Oni Lord','Reach the top 50',()=>{const e=myEntry();return !!(e&&e.lord);}]];
function checkAch(){const got=LS.get('oni-ach',[]);let changed=false;for(const [id,n] of ACH.map(a=>[a[0],a[1]]))if(!got.includes(id)&&ACH.find(a=>a[0]===id)[3]()){got.push(id);changed=true;toast('Achievement unlocked: '+n);}if(changed)LS.set('oni-ach',got);return got;}
function toast(t){const el=$('toast');el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>{el.hidden=true;},2600);}
/* ---- clans and referrals ---- */
const safeClan=t=>/^[A-Z0-9]{2,5}$/.test(t||'')?t:'';
function clanOf(id){const p=id&&DB.profiles[id];return p?safeClan(p.clan):'';}
function clanBoard(){const b=DB.board;const out={};if(!b)return[];for(const p of b.list){const c=clanOf(p.id);if(!c)continue;const o=out[c]||(out[c]={tag:c,pts:0,members:0,top:null});o.pts+=p.pts;o.members++;if(!o.top||p.pts>o.top.pts)o.top=p;}
  return Object.values(out).sort((a,b)=>b.pts-a.pts);}
function referralsOf(id){return Object.values(DB.profiles||{}).filter(p=>p&&p.ref===id).length;}
const REF0=(()=>{try{const q=new URLSearchParams(location.search);const r=q.get('ref');if(r&&/^[A-Za-z0-9_-]{4,64}$/.test(r))LS.set('oni-ref',r);return q;}catch(e){return null;}})();
function inviteBase(){return /claude\.ai|claudeusercontent|claude\.site/.test(location.hostname)||location.protocol==='file:'?'https://theonicurse.xyz/':location.origin+'/';}
/* ---- missions and achievements page ---- */
function openMissions(){auInit();SFX.select();renderMissions();show('p-missions');$('p-missions').scrollTop=0;}
function renderMissions(){const s=misState();const got=checkAch();
  const left=(()=>{const t=new Date();const n=Date.UTC(t.getUTCFullYear(),t.getUTCMonth(),t.getUTCDate()+1);return fmtLeft(n-Date.now());})();
  const list=todaysMissions();const nd=s.done.length,str=misStreak();
  const ICON={win2:'⚔',play3:'🎮',perfect:'💎',emote:'💬',arcade:'🏯',boss:'👹',online:'🌐',tenka:'🏆',special:'🔥'};
  let h=`<div class="mx-hero"><div class="mx-ring" style="--p:${Math.round(nd/list.length*100)}"><b>${nd}/${list.length}</b><span>today</span></div>`+
    `<div class="mx-hi"><h3>Daily missions</h3><p>Finish all ${list.length} for a <b>bonus chest</b> and <b>+100 XP</b>.</p><div class="mx-chips"><span class="mx-chip t">⏱ New in ${left}</span><span class="mx-chip f">🔥 Streak ${str} day${str===1?'':'s'}</span><span class="mx-chip c">🎁 ${chests()} chest${chests()===1?'':'s'} ready</span></div></div></div>`;
  h+='<div class="mx-list">'+list.map(([id,t,n],k)=>{const p=Math.min(n,s.prog[id]||0);const done=s.done.includes(id);
    return `<div class="mx-row${done?' done':''}" style="--h:${[150,280,32,200,340][k%5]}"><span class="mx-ic">${done?'✓':(ICON[id]||'★')}</span><div class="mx-main"><b>${t}</b><div class="mx-bar"><i style="width:${p/n*100}%"></i></div></div><span class="mx-num">${p}/${n}</span><span class="mx-rw">${done?'Done':'+30 XP · +1 pt'}</span></div>`;}).join('')+
    `<div class="mx-row sweep${s.swept?' done':''}"><span class="mx-ic">🎁</span><div class="mx-main"><b>Daily sweep</b><div class="mx-bar"><i style="width:${nd/list.length*100}%"></i></div></div><span class="mx-num">${nd}/${list.length}</span><span class="mx-rw">${s.swept?'Claimed':'Chest + 100 XP'}</span></div></div>`;
  h+=`<div class="mis-head"><h3>Achievements</h3><small>${got.length} of ${ACH.length}</small></div><div class="achs2">`+
    ACH.map(([id,n,d])=>`<div class="ach${got.includes(id)?' got':''}" title="${d}"><span class="ic">${got.includes(id)?'&#10003;':'&#9679;'}</span><div><b>${n}</b><small>${d}</small></div></div>`).join('')+'</div>';
  h+=`<div class="mis-head"><h3>Reward chests</h3><small>one per level, one per daily sweep</small></div><div class="mx-chest"><canvas id="mx-chest-cv" width="120" height="96" aria-hidden="true"></canvas><div><b>${chests()}</b><span>chest${chests()===1?'':'s'} ready</span></div><button type="button" class="mx-open" id="open-chest" ${chests()?'':'disabled'}>Open a chest</button></div>`+
    `<div class="rsplit"><b>Odds</b>${CHEST_ODDS.map(o=>`<span>${o[0]} <i>${o[1]}%</i></span>`).join('')}<span>Chest items stay on your account and cannot be sold.</span></div>`;
  const ref=DB.me?inviteBase()+'?ref='+encodeURIComponent(DB.me):'';
  h+=`<div class="mis-head"><h3>Invite friends</h3><small>+1 point per friend</small></div><div class="invite"><span>Friends invited <b>${DB.me?referralsOf(DB.me):0}</b></span>${ref?`<button type="button" class="arc" id="copy-ref">Copy invite link</button>`:'<span>Create an account to get your invite link.</span>'}</div>`;
  h+=`<div class="mis-head"><h3>Spirit Shards</h3><small>win vs the CPU · ${shardsToday()}/${SHARD_CAP} today</small></div><div class="mx-shards"><div><b>${shards()}</b><span>Spirit Shards</span><small>Not ONI, not tradeable, no cash value. ${SHARD_CHEST} shards = 1 reward chest.</small></div><button type="button" class="arc" id="trade-shards" ${shards()<SHARD_CHEST?'disabled':''}>Trade ${SHARD_CHEST} for a chest</button></div>`;
  $('mis-body').innerHTML=h;drawChestIcon();{const ts=document.getElementById('trade-shards');if(ts)ts.onclick=()=>{tradeShards();renderMissions();};}{const oc=document.getElementById('open-chest');if(oc)oc.onclick=()=>{const r=openChest();if(r){toast(r.dupe?`${r.tier}: ${r.item} (duplicate, +150 XP)`:`${r.tier}: ${r.item}!`);}renderMissions();};}const cr=document.getElementById('copy-ref');if(cr)cr.onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(ref).then(()=>toast('Invite link copied'),()=>toast(ref));};}
/* ---- K.O. card: a shareable image of the finish ---- */
function koCard(){const me=myIdx();const won=M&&M.winner===me;const c=document.createElement('canvas');c.width=960;c.height=540;const g=c.getContext('2d');{const sc=$('cv'),sh=Math.min(sc.height,sc.width*9/16);g.drawImage(sc,0,(sc.height-sh)/2,sc.width,sh,0,0,960,540);}
  g.fillStyle='rgba(10,5,6,.55)';g.fillRect(0,420,960,120);g.font='28px "Press Start 2P", monospace';g.textAlign='left';g.fillStyle=won?'#FFB000':'#F3E9E4';
  g.fillText(won?'K.O. VICTORY':'GOOD FIGHT',30,470);g.font='14px "Press Start 2P", monospace';g.fillStyle='#F3E9E4';g.fillText(fname(M.f[me].ch,palOf(M,me),M.f[me].skin)+' vs '+fname(M.f[1-me].ch,palOf(M,1-me),M.f[1-me].skin),30,505);
  g.textAlign='right';g.fillStyle='#D7262E';g.font='34px "Press Start 2P", monospace';g.fillText('ONI',930,475);g.font='11px "Press Start 2P", monospace';g.fillStyle='#C9A9A2';g.fillText('theonicurse.xyz',930,505);return c;}
function shareKO(){const c=koCard();const url=c.toDataURL('image/png');$('ko-img').src=url;show('p-ko');
  $('ko-native').hidden=!(navigator.canShare);$('ko-native').onclick=()=>{c.toBlob(b=>{const file=new File([b],'oni-ko.png',{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[file]}))navigator.share({files:[file],text:'ONI: The Curse You Choose. theonicurse.xyz'}).catch(()=>{});});};
  $('ko-copy').onclick=()=>{c.toBlob(b=>{try{navigator.clipboard.write([new ClipboardItem({'image/png':b})]).then(()=>toast('Image copied. Paste it in your post.'),()=>toast('Long-press or right-click the image to save it.'));}catch(e){toast('Long-press or right-click the image to save it.');}});};}



/* ===================== AFFILIATE ===================== */
const AFF={rate:0.01,rateHigh:0.015,highAt:100,months:6};
function affiliateStats(id){
  const refs=Object.entries(DB.profiles||{}).filter(([pid,p])=>p&&p.ref===id).map(([pid,p])=>({id:pid,p,since:p.created||0}));
  const n=refs.length,rate=n>=AFF.highAt?AFF.rateHigh:AFF.rate;const win=AFF.months*30*86400000;const by={};let vol=0,earn=0;
  for(const r of refs)by[r.id]={vol:0,earn:0,games:0};
  for(const mt of DB.matches){if(!(mt.stake>0))continue;for(const pid of [mt.a,mt.b]){const r=by[pid];if(!r)continue;const ref=refs.find(x=>x.id===pid);if((mt.ts||0)>ref.since+win)continue;
    r.vol+=mt.stake;r.games++;const e=mt.stake*2*rate;r.earn+=e;vol+=mt.stake;earn+=e;}}
  return{refs,by,n,rate,vol,earn,active:refs.filter(r=>by[r.id].games>0).length};
}
function renderAffiliate(sec){
  if(!DB.me){sec.innerHTML='<div class="lb-empty">Create an account to get your affiliate link.</div>';return;}
  const s=affiliateStats(DB.me);const link=inviteBase()+'?ref='+encodeURIComponent(DB.me);
  let h=`<div class="pf2-quick aff"><div><b>${s.n}</b>Players you brought</div><div><b>${s.active}</b>Active</div><div><b>${usd(s.vol)}</b>Their volume</div><div><b class="up">${usd(Math.round(s.earn))}</b>Your earnings (demo)</div></div>`;
  h+=`<div class="invite"><span>Your link: <b style="font-size:1em">${esc(link)}</b></span><button type="button" class="arc gold" id="aff-copy">Copy link</button></div>`;
  h+=`<div class="rsplit"><b>How it pays</b><span>${(s.rate*100).toFixed(1)}% of every pot your players play, for ${AFF.months} months after they join</span><span>1.5% once you bring ${AFF.highAt}+ players</span><span>It comes from the ONI fee: your players pay nothing extra</span><span>Paid out on-chain at launch</span></div>`;
  if(s.refs.length){h+=`<h4 class="pf2-h">Your players</h4><div class="lbwrap"><table class="lbt clean"><thead><tr><th>Player</th><th class="num">Matches</th><th class="num">Volume</th><th class="num">You earned</th></tr></thead><tbody>`+
    s.refs.map(r=>`<tr><td class="who"><button type="button" class="plink" data-pid="${esc(r.id)}">${esc(r.p.name||nameOf(r.id))}</button></td><td class="num">${s.by[r.id].games}</td><td class="num">${usd(s.by[r.id].vol)}</td><td class="num win">${usd(Math.round(s.by[r.id].earn))}</td></tr>`).join('')+'</tbody></table></div>';}
  else h+='<div class="lb-empty">No players yet. Share your link: you earn from every pot they play.</div>';
  sec.innerHTML=h;const c=document.getElementById('aff-copy');if(c)c.onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(link).then(()=>toast('Affiliate link copied'),()=>toast(link));};
}

/* ===================== CLANS PAGE ===================== */
let CLAN_TAB='week',CLAN_SEL=null;
function clanWarStart(t){const d=new Date(t||Date.now());return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1);}
function clanWarEnd(){const d=new Date();return Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1);}
function clanWeek(){const since=clanWarStart();const b=computeBoard(DB.matches.filter(x=>(x.ts||0)>=since));const out={};for(const p of b.list){const c=clanOf(p.id);if(!c)continue;const o=out[c]||(out[c]={tag:c,pts:0,members:0});o.pts+=p.pts;o.members++;}
  return Object.values(out).sort((a,b)=>b.pts-a.pts);}
function clanMembers(tag){return Object.entries(DB.profiles||{}).filter(([id,p])=>p&&safeClan(p.clan)===tag).map(([id,p])=>{const e=DB.board?DB.board.map.get(id):null;return{id,p,pts:e?e.pts:0,rating:e?e.rating:1000,lord:e&&e.lord};}).sort((a,b)=>b.pts-a.pts);}
function openClans(){auInit();SFX.select();CLAN_SEL=null;renderClans();show('p-clans');$('p-clans').scrollTop=0;}
/* ===================== CLANS 2.0 ===================== */
const CLAN_SYMS=['鬼','龍','狐','風','雷','月','炎','刀'],CLAN_COLS=['#C1121F','#E0A020','#2E8A5A','#2F6FE0','#8A3AC0','#1A1A22'];
const CLAN_PRIZE=[250000,150000,100000];
function clanHash(t){let h=0;for(const ch of t)h=(h*31+ch.charCodeAt(0))>>>0;return h;}
function clanMeta(tag){let best=null;for(const [id,p] of Object.entries(DB.profiles||{}))if(p&&p.clanMeta&&p.clanMeta.tag===tag&&safeClan(p.clan)===tag&&(!best||(p.created||0)<(best.p.created||0)))best={id,p};
  if(best)return Object.assign({leader:best.id},best.p.clanMeta);const h=clanHash(tag);return{tag,sym:CLAN_SYMS[h%CLAN_SYMS.length],col:CLAN_COLS[(h>>3)%CLAN_COLS.length],leader:null};}
const CLAN_IMG={};
function clanEmblem(tag,size,meta){meta=meta||clanMeta(tag);const c=document.createElement('canvas');c.width=c.height=96;c.className='cl-emb';c.style.width=c.style.height=(size||48)+'px';const g=c.getContext('2d');
  const shield=()=>{g.beginPath();g.moveTo(10,6);g.lineTo(86,6);g.lineTo(86,52);g.quadraticCurveTo(86,80,48,92);g.quadraticCurveTo(10,80,10,52);g.closePath();};
  if(meta.img){const im=CLAN_IMG[meta.img]||(CLAN_IMG[meta.img]=Object.assign(new Image(),{src:meta.img}));const draw=()=>{g.save();shield();g.clip();g.drawImage(im,0,0,96,96);g.restore();g.lineWidth=4;g.strokeStyle='#FFC93A';shield();g.stroke();};if(im.complete)draw();else im.onload=draw;return c;}
  shield();g.fillStyle=meta.col;g.fill();g.save();shield();g.clip();g.fillStyle='rgba(255,255,255,.16)';g.fillRect(10,6,38,90);g.restore();
  g.lineWidth=4;g.strokeStyle='#FFC93A';shield();g.stroke();g.fillStyle='#FFF6E0';g.font='bold 44px serif';g.textAlign='center';g.textBaseline='middle';g.fillText(meta.sym,48,48);return c;}
function clanWeekRange(a,b){const bd=computeBoard(DB.matches.filter(x=>(x.ts||0)>=a&&(x.ts||0)<b));const out={};for(const p of bd.list){const c=clanOf(p.id);if(!c)continue;const o=out[c]||(out[c]={tag:c,pts:0,members:0});o.pts+=p.pts;o.members++;}return Object.values(out).sort((x,y)=>y.pts-x.pts);}
function clanOniWon(){const won={};const ts=DB.matches.map(x=>x.ts||0).filter(Boolean);if(!ts.length)return won;let w=clanWarStart();const first=Math.min(...ts);
  for(let k=0;k<12&&w>first;k++){const a=clanWarStart(w-864e5);clanWeekRange(a,w).slice(0,3).forEach((c,i)=>{if(c.pts>0)won[c.tag]=(won[c.tag]||0)+CLAN_PRIZE[i];});w=a;}return won;}
function oniFmt(n){return n>=1e6?(n/1e6).toFixed(n%1e6?1:0)+'M':n>=1e3?Math.round(n/1e3)+'K':String(n);}
let CLAN_EDIT=null;
function emblemPicker(meta){return `<div class="cl-pick"><div class="cl-syms">${CLAN_SYMS.map(s=>`<button type="button" class="cl-sym${meta.sym===s&&!meta.img?' on':''}" data-sym="${s}">${s}</button>`).join('')}</div>`+
  `<div class="cl-cols">${CLAN_COLS.map(c=>`<button type="button" class="cl-col${meta.col===c&&!meta.img?' on':''}" data-col="${c}" style="background:${c}" aria-label="Colour ${c}"></button>`).join('')}</div>`+
  `<label class="cl-up">Upload image<input type="file" accept="image/*" id="cl-file" hidden></label>${meta.img?'<button type="button" class="cl-rm" id="cl-rmimg">Remove image</button>':''}</div>`;}
function renderClans(){
  const me=myProfile();const my=me?safeClan(me.clan):'';const season=clanBoard(),week=clanWeek(),won=clanOniWon();const body=$('cl-body');
  $('cl-clock').innerHTML=`Clan War ends in<b>${fmtLeft(clanWarEnd()-Date.now())}</b>Every month, 1st 00:00 UTC`;
  let h='';
  if(my){const pos=season.findIndex(c=>c.tag===my);const c=season[pos];const meta=clanMeta(my);const lead=meta.leader===DB.me;const mine=DB.board&&DB.board.map.get(DB.me);
    h+=`<section class="cx-hero"><div class="cx-emb" id="cx-emb"></div><div class="cx-main"><span class="cx-kick">Your clan${lead?' · Leader':''}</span><h3>[${esc(my)}]</h3>`+
      `<div class="cx-chips"><div><b>${c?'#'+(pos+1):'-'}</b><span>Season rank</span></div><div><b>${c?c.pts:0}</b><span>Points</span></div><div><b>${clanMembers(my).length}</b><span>Members</span></div><div class="oni"><b>${oniFmt(won[my]||0)} $ONI</b><span>Won by the clan</span></div><div><b>${mine?mine.pts:0}</b><span>Your share</span></div></div>`+
      `<div class="cx-acts"><button class="cx-btn" type="button" id="cl-view">View clan</button>${lead?'<button class="cx-btn alt" type="button" id="cl-edit">Edit emblem</button>':''}<button class="cx-btn ghost" type="button" id="cl-leave">Leave</button></div></div></section>`;
    if(lead&&CLAN_EDIT===my)h+=`<section class="cx-card">${emblemPicker(meta)}</section>`;}
  else{const meta=CLAN_EDIT&&typeof CLAN_EDIT==='object'?CLAN_EDIT:{sym:'鬼',col:'#C1121F'};CLAN_EDIT=meta;
    h+=`<section class="cx-hero"><div class="cx-emb" id="cx-emb"></div><div class="cx-main"><span class="cx-kick">No clan yet</span><h3>Create or join a clan</h3><p class="cx-p">Type a tag of 2 to 5 letters or numbers. If it exists you join it. If not, you create it with this emblem.</p>`+
      `<div class="cl-join"><input class="nmin" id="cl-tag" maxlength="5" placeholder="e.g. ONI" aria-label="Clan tag"><button class="cx-btn" type="button" id="cl-go">${me?'Join or create':'Create an account first'}</button></div>${emblemPicker(meta)}</div></section>`;}
  h+=`<div class="cx-soon"><b>Clan Wars 3v3 · 5v5</b><span>Team battles, clan against clan. Coming soon.</span></div>`;
  h+=`<div class="cx-tabs"><button class="cx-tab" type="button" data-ct="week" aria-pressed="${CLAN_TAB==='week'}">Clan War · this month</button><button class="cx-tab" type="button" data-ct="season" aria-pressed="${CLAN_TAB==='season'}">Season ranking</button></div>`;
  if(CLAN_TAB==='week'){h+=`<p class="cx-note">Win ranked 1v1s to score for your clan. Every month the top 3 clans win <b>${CLAN_PRIZE.map(oniFmt).join(' / ')} $ONI</b> (500K in total), shared by their members.</p>`;
    if(!week.length)h+='<div class="cx-empty">No clan points yet this month.</div>';
    else{const pod=[week[1],week[0],week[2]];h+='<div class="cx-pod">'+pod.map((c,k)=>{if(!c)return '<div></div>';const r=[2,1,3][k];return `<div class="cx-pd r${r}"><span class="cx-place">${r}</span><span class="cx-pe" data-emb="${esc(c.tag)}"></span><b>[${esc(c.tag)}]</b><small>${c.pts} pts</small><i>${oniFmt(CLAN_PRIZE[r-1])} $ONI</i></div>`;}).join('')+'</div>';
      if(week.length>3)h+='<div class="cx-list">'+week.slice(3).map((c,i)=>clanRow(c,i+4,won)).join('')+'</div>';}}
  else{if(!season.length)h+='<div class="cx-empty">No clans yet. Be the first to create one.</div>';else h+='<div class="cx-list">'+season.map((c,i)=>clanRow(c,i+1,won)).join('')+'</div>';}
  if(CLAN_SEL){const meta=clanMeta(CLAN_SEL);const ms=clanMembers(CLAN_SEL);const wk=clanWeekMembers();
    h+=`<section class="cx-detail"><div class="cx-dh"><span class="cx-pe big" data-emb="${esc(CLAN_SEL)}"></span><div><h3>[${esc(CLAN_SEL)}]</h3><small>${ms.length} members${meta.leader?' · Leader '+esc(nameOf(meta.leader)):''} · ${oniFmt(won[CLAN_SEL]||0)} $ONI won</small></div><button type="button" class="cx-btn ghost" id="cx-close">Close</button></div>`+
      '<div class="cx-mem">'+ms.sort((a,b)=>b.pts-a.pts).map(x=>`<div class="cx-m"><span class="dot ${isOnline(x.id)?'on':''}"></span><button type="button" class="plink" data-pid="${esc(x.id)}">${esc(x.p.name||'Player')}</button>${meta.leader===x.id?'<i class="cx-role">Leader</i>':''}<span class="cx-mp"><b>${wk[x.id]||0}</b> this month</span><span class="cx-mp"><b>${x.pts}</b> season</span></div>`).join('')+'</div></section>';}
  body.innerHTML=h;wirePlayerLinks(body);
  const he=document.getElementById('cx-emb');if(he)he.appendChild(clanEmblem(my||'NEW',96,my?clanMeta(my):CLAN_EDIT));
  body.querySelectorAll('[data-emb]').forEach(e=>e.appendChild(clanEmblem(e.dataset.emb,e.classList.contains('big')?72:e.closest('.cx-pd')?64:40)));
  body.querySelectorAll('[data-ct]').forEach(b=>b.onclick=()=>{CLAN_TAB=b.dataset.ct;renderClans();});
  body.querySelectorAll('[data-clan]').forEach(b=>b.onclick=()=>{CLAN_SEL=b.dataset.clan;renderClans();setTimeout(()=>{const d=document.querySelector('.cx-detail');if(d)d.scrollIntoView({block:'start',behavior:'smooth'});},0);});
  const cc=document.getElementById('cx-close');if(cc)cc.onclick=()=>{CLAN_SEL=null;renderClans();};
  const v=document.getElementById('cl-view');if(v)v.onclick=()=>{CLAN_SEL=my;renderClans();};
  const ed=document.getElementById('cl-edit');if(ed)ed.onclick=()=>{CLAN_EDIT=CLAN_EDIT===my?null:my;renderClans();};
  const saveMeta=async(patch)=>{if(my){const cur=clanMeta(my);await patchProfile({clanMeta:Object.assign({tag:my,sym:cur.sym,col:cur.col,img:cur.img||null},patch)});}else{CLAN_EDIT=Object.assign({},CLAN_EDIT,patch);}renderClans();};
  body.querySelectorAll('[data-sym]').forEach(b=>b.onclick=()=>saveMeta({sym:b.dataset.sym,img:null}));
  body.querySelectorAll('[data-col]').forEach(b=>b.onclick=()=>saveMeta({col:b.dataset.col,img:null}));
  const rm=document.getElementById('cl-rmimg');if(rm)rm.onclick=()=>saveMeta({img:null});
  const fi=document.getElementById('cl-file');if(fi)fi.onchange=()=>{const f=fi.files&&fi.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');const s=Math.min(im.width,im.height);
    g.drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,96,96);saveMeta({img:c.toDataURL('image/jpeg',0.82)});};im.src=r.result;};r.readAsDataURL(f);};
  const l=document.getElementById('cl-leave');if(l)l.onclick=async()=>{await patchProfile({clan:null});toast('You left ['+my+']');CLAN_EDIT=null;renderClans();};
  const go=document.getElementById('cl-go');if(go)go.onclick=async()=>{if(!me){openProfile();return;}const t=safeClan(($('cl-tag').value||'').toUpperCase().replace(/[^A-Z0-9]/g,''));if(!t){toast('Use 2 to 5 letters or numbers');return;}
    const exists=clanMembers(t).length>0;const patch={clan:t};if(!exists)patch.clanMeta={tag:t,sym:CLAN_EDIT.sym,col:CLAN_EDIT.col,img:CLAN_EDIT.img||null};await patchProfile(patch);toast(exists?'Joined ['+t+']':'Created ['+t+']');CLAN_EDIT=null;renderClans();};
  const ti=document.getElementById('cl-tag');if(ti)ti.oninput=()=>{ti.value=ti.value.toUpperCase().replace(/[^A-Z0-9]/g,'');};
}
function clanRow(c,pos,won){return `<div class="cx-row${c.tag===safeClan((myProfile()||{}).clan)?' me':''}"><span class="cx-pos">${pos}</span><span class="cx-pe" data-emb="${esc(c.tag)}"></span><b class="cx-tag">[${esc(c.tag)}]</b><span class="cx-n"><b>${c.members}</b> members</span><span class="cx-n"><b>${c.pts}</b> pts</span><span class="cx-n oni"><b>${oniFmt(won[c.tag]||0)}</b> $ONI won</span><button type="button" class="cx-btn ghost sm" data-clan="${esc(c.tag)}">View</button></div>`;}
function clanWeekMembers(){const bd=computeBoard(DB.matches.filter(x=>(x.ts||0)>=clanWarStart()));const o={};for(const p of bd.list)o[p.id]=p.pts;return o;}



/* ===================== XP AND LEVELS ===================== */
function levelOf(xp){let L=1,need=100;xp=Math.max(0,xp|0);while(xp>=need&&L<99){xp-=need;L++;need=Math.round(100*Math.pow(L,1.35));}return{L,cur:xp,need};}
function myXP(){const p=myProfile();return Math.max(STATS.xp||0,(p&&p.xp)||0);}
function xpOfId(id){if(id&&id===DB.me)return myXP();const p=id&&DB.profiles[id];return (p&&p.xp)||0;}
let XPSAVE=0;
function awardXP(n,why){const before=levelOf(myXP()).L;STATS.xp=myXP()+n;LS.set('oni-stats',STATS);const after=levelOf(STATS.xp).L;
  if(after>before){toast('Level up! Lv '+after+' · reward chest');SFX.coin();addChest(after-before);}else if(why)toast('+'+n+' XP, '+why);
  clearTimeout(XPSAVE);XPSAVE=setTimeout(()=>{if(myProfile())patchProfile({xp:STATS.xp});},1500);renderPCard();}
function renderPCard(){const el=document.getElementById('pcard');if(!el)return;const p=myProfile();const lv=levelOf(myXP());const st=DB.me?statsOf(DB.me):{pnl:0};
  const bal=10000+(st.pnl||0);
  el.innerHTML=`<div class="pc-top"><b>${p?esc(p.name):'Guest'}</b><span class="lv">Lv ${lv.L}</span></div><div class="xpb"><i style="width:${Math.round(lv.cur/lv.need*100)}%"></i></div>`+
    `<div class="pc-bal"><span>Balance</span><b>${p?usd(bal):'-'}</b>${p?'<small>demo</small>':'<small>connect wallet</small>'}</div><span class="pc-go" aria-hidden="true">&#9654;</span>`;}

/* ===================== DOCK + SCROLL MENU ===================== */
const ICONS={ // 16x16 pixel icons: rows of palette letters
 play:['................','..W..........W..','...W........W...','....W......W....','.....W....W.....','......W..W......','.......WW.......','.......WW.......','......W..W......','.....G....G.....','....GG....GG....','...GG......GG...','..R..........R..','.RR..........RR.','................','................'],
 tenka:['................','..YYYYYYYYYYYY..','.YY.YYYYYYYY.YY.','.Y..YYYWWYYY..Y.','.YY.YYYWWYYY.YY.','..YYYYYYYYYYYY..','....YYYYYYYY....','.....YYYYYY.....','......YYYY......','.......YY.......','.......YY.......','.....YYYYYY.....','....OOOOOOOO....','....OOOOOOOO....','................','................'],
 missions:['................','...BBBBBBBBBB...','..BCCCCCCCCCCB..','..BCCCCCCCCCCB..','...CKKKKKKKKC...','...CCCCCCCCCC...','...CKKKKKKCCC...','...CCCCCCCCCC...','...CKKKKKKKKC...','...CCCCCCCCCC...','...CKKKKKCCCC...','..BCCCCCCCCCCB..','..BCCCCCCCCCCB..','...BBBBBBBBBB...','................','................'],
 menu:['................','.RRRRRRRRRRRRRR.','..RRRRRRRRRRRR..','....R......R....','..RRRRRRRRRRRR..','....R......R....','....R......R....','....R......R....','....R......R....','....R......R....','....R......R....','...RR......RR...','................','................','................','................'],
 enma:['................','....R......R....','...RR......RR...','...RRRRRRRRRR...','..RRRRRRRRRRRR..','..RRYYRRRRYYRR..','..RRRRRRRRRRRR..','..RRRRRRRRRRRR..','..RRKKKKKKKKRR..','..RRKWKWKWKKRR..','...RRRRRRRRRR...','....RRRRRRRR....','................','................','................','................'],
 clans:['................','.....RRRRRR.....','....RRRRRRRR....','...RR.YYYY.RR...','...RR.Y..Y.RR...','...RR.YYYY.RR...','...RRRRRRRRRR...','....RRRRRRRR....','.....RRRRRR.....','......RRRR......','.......RR.......','................','................','................','................','................'],
 fighters:['................','.....WWWWWW.....','....WRRRRRRW....','...WRRRRRRRRW...','...WRYYRRYYRW...','...WRRRRRRRRW...','...WRRKKKKRRW...','....WRRRRRRW....','.....WWWWWW.....','....GGGGGGGG....','...GGGGGGGGGG...','..GGGGGGGGGGGG..','................','................','................','................'],
 board:['................','......YYYY......','......YWWY......','..OOO.YYYY......','..OWO.YYYY.GGG..','..OOO.YYYY.GWG..','..OOO.YYYY.GGG..','..OOO.YYYY.GGG..','..OOO.YYYY.GGG..','................','................','................','................','................','................','................'],
 cauld:['................','...RRRRRRRRRR...','..YYYYYYYYYYYY..','..KKKKKKKKKKKK..','..KKKKKKKKKKKK..','...KKKKKKKKKK...','....KKKKKKKK....','....O.O..O.O....','...OOOOOOOOOO...','................','................','................','................','................','................','................'],
 profile:['................','......CCCC......','.....CCCCCC.....','.....CCCCCC.....','......CCCC......','....GGGGGGGG....','...GGGGGGGGGG...','...GGGGGGGGGG...','................','................','................','................','................','................','................','................'],
 how:['................','.....YYYYYY.....','....YY....YY....','..........YY....','.........YY.....','........YY......','.......YY.......','.......YY.......','................','.......YY.......','................','................','................','................','................','................'],
 gear:['................','.......WW.......','...W..WWWW..W...','....WWWWWWWW....','....WWW..WWW....','..WWWW....WWWW..','....WWW..WWW....','....WWWWWWWW....','...W..WWWW..W...','.......WW.......','................','................','................','................','................','................']};
const ICOL={W:'#F3F6FA',G:'#C8962A',R:'#D7262E',Y:'#FFC93A',O:'#E07A30',B:'#8A5A2A',C:'#F4E8C8',K:'#3A2A20'};
function drawIcon(g,name){const S=64;g.lineJoin='round';g.lineCap='round';const O='#2A1410';
  const sh=(f,c)=>{g.beginPath();f();g.fillStyle=c;g.fill();g.lineWidth=3;g.strokeStyle=O;g.stroke();};
  const rr=(x,y,w,h,r)=>{g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();};
  switch(name){
   case 'play':for(const s of [1,-1]){g.save();g.translate(32,32);g.rotate(s*Math.PI/4);sh(()=>rr(-3.5,-26,7,34,2),'#E8EEF6');g.fillStyle='#FFFFFF';g.fillRect(-1.5,-24,2,30);sh(()=>rr(-9,8,18,5,2),'#FFC93A');sh(()=>rr(-3,13,6,12,2),'#8E1015');g.restore();}break;
   case 'tenka':sh(()=>{g.moveTo(16,10);g.lineTo(48,10);g.lineTo(46,30);g.quadraticCurveTo(32,42,18,30);g.closePath();},'#FFC93A');
     g.lineWidth=4;g.strokeStyle=O;g.beginPath();g.arc(13,18,6,Math.PI*0.5,Math.PI*1.6);g.stroke();g.beginPath();g.arc(51,18,6,Math.PI*1.4,Math.PI*0.5);g.stroke();
     sh(()=>rr(28,38,8,10,2),'#E0A020');sh(()=>rr(18,47,28,8,3),'#8A5A2A');sh(()=>{g.moveTo(32,15);g.lineTo(37,21);g.lineTo(32,27);g.lineTo(27,21);g.closePath();},'#BFF4FF');break;
   case 'missions':sh(()=>rr(14,10,36,44,4),'#F6EBCF');sh(()=>rr(10,6,44,8,4),'#C8962A');sh(()=>rr(10,50,44,8,4),'#C8962A');g.fillStyle='#8A6A4A';for(const y of [22,30,38])g.fillRect(20,y,24,3);g.fillStyle='#C1121F';g.fillRect(20,44,12,3);break;
   case 'menu':sh(()=>rr(6,10,52,8,3),'#C1121F');sh(()=>rr(12,22,40,6,2),'#C1121F');sh(()=>rr(16,18,7,40,2),'#C1121F');sh(()=>rr(41,18,7,40,2),'#C1121F');g.fillStyle='#FF6A5A';g.fillRect(9,11,46,2);break;
   case 'enma':sh(()=>{g.moveTo(12,26);g.quadraticCurveTo(12,8,32,8);g.quadraticCurveTo(52,8,52,26);g.lineTo(48,48);g.quadraticCurveTo(32,58,16,48);g.closePath();},'#D7262E');
     sh(()=>{g.moveTo(14,16);g.lineTo(8,2);g.lineTo(20,12);g.closePath();},'#F3E9E4');sh(()=>{g.moveTo(50,16);g.lineTo(56,2);g.lineTo(44,12);g.closePath();},'#F3E9E4');
     g.fillStyle='#FFE14A';g.fillRect(20,24,8,5);g.fillRect(36,24,8,5);g.fillStyle=O;g.fillRect(22,38,20,6);g.fillStyle='#FFFFFF';g.fillRect(23,38,3,4);g.fillRect(38,38,3,4);break;
   case 'clans':sh(()=>rr(29,6,6,52,2),'#8A5A2A');sh(()=>{g.moveTo(35,10);g.lineTo(56,10);g.lineTo(56,38);g.lineTo(46,32);g.lineTo(35,38);g.closePath();},'#C1121F');
     g.fillStyle='#FFC93A';g.beginPath();g.arc(45.5,21,6,0,6.28);g.fill();g.fillStyle='#C1121F';g.beginPath();g.arc(45.5,21,3,0,6.28);g.fill();break;
   case 'fighters':sh(()=>{g.moveTo(10,34);g.quadraticCurveTo(10,10,32,10);g.quadraticCurveTo(54,10,54,34);g.lineTo(54,40);g.lineTo(10,40);g.closePath();},'#2F3A5A');
     sh(()=>rr(6,38,52,8,3),'#3A4668');sh(()=>{g.moveTo(32,6);g.lineTo(22,18);g.lineTo(32,14);g.lineTo(42,18);g.closePath();},'#FFC93A');sh(()=>rr(18,44,28,14,4),'#D7262E');g.fillStyle='#FFE14A';g.fillRect(23,48,6,3);g.fillRect(35,48,6,3);break;
   case 'board':sh(()=>rr(24,16,16,40,2),'#FFC93A');sh(()=>rr(6,28,16,28,2),'#DDE3EE');sh(()=>rr(42,34,16,22,2),'#E0A060');g.fillStyle=O;g.font='bold 12px sans-serif';g.textAlign='center';g.fillText('1',32,30);g.fillText('2',14,42);g.fillText('3',50,48);break;
   case 'cauld':for(let k=0;k<3;k++)sh(()=>{g.moveTo(20+k*12,56);g.quadraticCurveTo(14+k*12,46,22+k*12,40);g.quadraticCurveTo(26+k*12,48,26+k*12,56);g.closePath();},'#FF8A2A');
     sh(()=>{g.moveTo(10,20);g.lineTo(54,20);g.quadraticCurveTo(56,46,32,48);g.quadraticCurveTo(8,46,10,20);g.closePath();},'#3A3A46');sh(()=>rr(6,16,52,7,3),'#FFC93A');g.fillStyle='#E0282E';g.fillRect(12,18,40,3);break;
   case 'profile':sh(()=>{g.arc(32,22,12,0,6.28);},'#F4D8B0');sh(()=>{g.moveTo(10,58);g.quadraticCurveTo(10,36,32,36);g.quadraticCurveTo(54,36,54,58);g.closePath();},'#2E6A9A');break;
   case 'how':sh(()=>{g.arc(32,32,24,0,6.28);},'#FFC93A');g.fillStyle=O;g.font='bold 34px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('?',32,34);break;
   case 'shop':sh(()=>rr(10,26,44,30,3),'#C88A50');for(let i=0;i<5;i++)sh(()=>{g.moveTo(8+i*10,14);g.lineTo(18+i*10,14);g.lineTo(18+i*10,28);g.quadraticCurveTo(13+i*10,32,8+i*10,28);g.closePath();},i%2?'#F3E9E4':'#C1121F');
     sh(()=>rr(26,38,12,18,2),'#5A3A1A');break;
   case 'champ':sh(()=>{g.moveTo(14,12);g.lineTo(50,12);g.lineTo(50,30);g.quadraticCurveTo(50,48,32,56);g.quadraticCurveTo(14,48,14,30);g.closePath();},'#C1121F');
     g.fillStyle='#FFC93A';g.font='bold 22px serif';g.textAlign='center';g.textBaseline='middle';g.fillText('鬼',32,32);break;
   case 'bag':sh(()=>{g.moveTo(22,18);g.lineTo(42,18);g.quadraticCurveTo(58,34,52,52);g.quadraticCurveTo(32,60,12,52);g.quadraticCurveTo(6,34,22,18);g.closePath();},'#A8844A');
     sh(()=>rr(22,12,20,8,3),'#C1121F');g.fillStyle='#FFC93A';g.beginPath();g.arc(32,38,7,0,6.28);g.fill();break;
   case 'cage':sh(()=>rr(8,14,48,42,4),'#1A0E14');g.fillStyle='#D7262E';g.beginPath();g.arc(32,36,11,0,6.28);g.fill();g.fillStyle='#FFE14A';g.fillRect(26,33,4,3);g.fillRect(34,33,4,3);
     g.fillStyle='#F3E9E4';g.beginPath();g.moveTo(23,28);g.lineTo(20,20);g.lineTo(27,26);g.fill();g.beginPath();g.moveTo(41,28);g.lineTo(44,20);g.lineTo(37,26);g.fill();
     for(const x of [16,26,38,48])sh(()=>rr(x-2,14,4,42,1),'#8A5A2A');sh(()=>rr(4,8,56,8,3),'#8E1015');break;
   case 'gear':sh(()=>{for(let k=0;k<16;k++){const a=k/16*Math.PI*2,r=k%2?18:26;k?g.lineTo(32+Math.cos(a)*r,32+Math.sin(a)*r):g.moveTo(32+Math.cos(a)*r,32+Math.sin(a)*r);}g.closePath();},'#AEB8C8');sh(()=>{g.arc(32,32,8,0,6.28);},'#F3F6FA');break;
  }}
function iconEl(name,sz){const c=document.createElement('canvas');c.width=64;c.height=64;c.className='pxi';drawIcon(c.getContext('2d'),name);if(sz)c.style.width=c.style.height=sz+'px';return c;}
const MENU_ITEMS=[['play','Play 1v1','online'],['tenka','TENKA','tourney'],['enma','Enma','boss'],['fighters','Practice','cpu'],['missions','Missions','missions'],['clans','Clans','clans'],['shop','Market','store'],['champ','Champions','champs'],['bag','Inventory','inv'],['board','Leaderboard','board'],['cauld','Cauldrons','cauldrons'],['profile','Profile','profile'],['how','How to play','how'],['gear','Settings','settings']];
function goMenu(k){closeScroll();auInit();({online:()=>{SFX.select();openSelect('online');},tourney:openTourney,boss:openBoss,cpu:()=>{SFX.select();openSelect('cpu');},missions:openMissions,clans:openClans,
  store:()=>{SFX.select();openStore();},finalboss:openFinalBoss,champs:()=>openChampions(),inv:openInventory,board:()=>{SFX.select();DB.tab='season';show('p-board');renderBoard();},cauldrons:openCauldrons,profile:openProfile,how:()=>openHow('p-title'),settings:()=>{classicMenu();}})[k]();}
function buildDock(){const d=$('dock');d.innerHTML='';[['play','Play','online'],['tenka','TENKA','tourney'],['missions','Missions','missions'],['menu','Menu','menu']].forEach(([ic,l,k])=>{
  const b=document.createElement('button');b.type='button';b.className='dk'+(k==='menu'?' main':'');b.setAttribute('aria-label',l);b.appendChild(iconEl(ic));const s=document.createElement('span');s.textContent=l;b.appendChild(s);
  if(k==='missions'){const dot=document.createElement('i');dot.className='badge';dot.id='dock-dot';b.appendChild(dot);}
  b.onclick=()=>{if(k==='menu')toggleScroll();else goMenu(k);};d.appendChild(b);});updateDockDot();}
function updateDockDot(){const dot=document.getElementById('dock-dot');if(!dot)return;const s=misState();dot.hidden=s.done.length>=3;}
const TILEC={champs:'#FFE6D8',inv:'#E6F0E0',finalboss:'#EADCF4',online:'#FFE0D8',tourney:'#FFF1C8',boss:'#FFD8D8',cpu:'#DDE8FF',missions:'#F4ECD8',clans:'#FFE0E0',store:'#E0E8FF',board:'#FFF4D0',cauldrons:'#E8E4F4',profile:'#DDF0FF',how:'#FFF6D0',settings:'#ECEFF4'};
const MENU_ICONS={
 online:'<path d="M5 19L19 5M15 5h4v4M5 5l14 14M9 19H5v-4"/>',
 tourney:'<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6M10 17h4"/>',
 boss:'<path d="M5 4l3 4h8l3-4"/><path d="M6 8c0 7 3 11 6 11s6-4 6-11"/><path d="M9.5 12h1M13.5 12h1M10 16h4"/>',
 cpu:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8"/>',
 missions:'<path d="M7 3h10v18l-5-3-5 3z"/><path d="M10 8l1.5 1.5L14 7M10 13h4"/>',
 clans:'<path d="M6 21V4M6 4h11l-2 4 2 4H6"/>',
 store:'<path d="M4 9l2-5h12l2 5"/><path d="M4 9h16v2a3 3 0 0 1-6 0 2 2 0 0 1-4 0 3 3 0 0 1-6 0V9zM5 13v7h14v-7"/>',
 champs:'<path d="M4 8l4 3 4-6 4 6 4-3-2 10H6L4 8z"/>',
 inv:'<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
 board:'<path d="M5 20V12M12 20V6M19 20v-9"/>',
 cauldrons:'<path d="M4 10h16l-1.5 7a3 3 0 0 1-3 2.5h-7a3 3 0 0 1-3-2.5L4 10z"/><path d="M8 7c0-1.5 1-2 1-3M12 7c0-1.5 1-2 1-3M16 7c0-1.5 1-2 1-3"/>',
 profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
 how:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'};
const MENU_SUB={online:'Ranked and staked duels',tourney:'Cups and the Grand',boss:'Break the jar',cpu:'Train against the CPU'};
const MENU_GROUPS=[['Play',4],['World',4],['You',6]];
function buildScroll(){const grid=$('scroll-grid');grid.innerHTML='';$('scroll').classList.add('v3');let i=0;
  for(const [title,n] of MENU_GROUPS){const h=document.createElement('div');h.className='mg-h';h.textContent=title;grid.appendChild(h);
    const box=document.createElement('div');box.className='mg mg-'+title.toLowerCase();grid.appendChild(box);
    for(let k=0;k<n&&i<MENU_ITEMS.length;k++,i++){const [ic,l,key]=MENU_ITEMS[i];const b=document.createElement('button');b.type='button';b.className='st';b.dataset.k=key;
      b.innerHTML=`<span class="mi"><svg viewBox="0 0 24 24" aria-hidden="true">${MENU_ICONS[key]||MENU_ICONS.how}</svg></span><span class="ml"><b>${l}</b>${MENU_SUB[key]?`<small>${MENU_SUB[key]}</small>`:''}</span>`;
      if(document.body.classList.contains('touch')){const mi=b.querySelector('.mi');mi.innerHTML='';mi.appendChild(iconEl(ic));} // phones: chunky pixel icons
      b.onclick=()=>goMenu(key);box.appendChild(b);}}}
function toggleScroll(){const s=$('scroll');if(s.classList.contains('open'))closeScroll();else{buildScroll();s.hidden=false;document.body.classList.toggle('vmenu',true);requestAnimationFrame(()=>s.classList.add('open'));SFX.select();}}
function closeScroll(){const s=$('scroll');s.classList.remove('open');document.body.classList.toggle('vmenu',false);setTimeout(()=>{if(!s.classList.contains('open'))s.hidden=true;},260);}
$('scroll-x').onclick=closeScroll;
$('scroll').addEventListener('click',e=>{if(e.target&&e.target.id==='scroll')closeScroll();}); // tap the dimmed backdrop to close
$('pcard').onclick=()=>{if(mode==='village'){auInit();openProfile();}};
window.addEventListener('keydown',e=>{if(e.code==='Tab'&&mode==='village'){e.preventDefault();toggleScroll();}else if(e.code==='Escape'&&!$('scroll').hidden){closeScroll();}});
buildDock();renderPCard();setInterval(()=>{if(mode==='village')renderPCard();},4000);







/* ===================== SPIRIT SHARDS: free rewards for beating the CPU =====================
   Not ONI, not transferable, no cash value. Capped per day so bots gain nothing.
   ONI itself is only won in human competition with a fixed budget (the free weekly Ashigaru Cup). */
const SHARD_CAP=200,SHARD_CHEST=300,SHARD_WIN={veryeasy:2,easy:5,normal:10,hard:20,auto:10},SHARD_ARCADE=50;
function shards(){return LS.get('oni-shards',0);}
function shardsToday(){const d=new Date().toISOString().slice(0,10);const s=LS.get('oni-shards-day',{});return s.day===d?(s.n|0):0;}
function addShards(n,why){if(n<=0)return 0;const d=new Date().toISOString().slice(0,10);const room=Math.max(0,SHARD_CAP-shardsToday());const g=Math.min(n,room);
  if(g<=0){toast('Daily Spirit Shard limit reached ('+SHARD_CAP+'). Come back tomorrow.');return 0;}
  LS.set('oni-shards',shards()+g);LS.set('oni-shards-day',{day:d,n:shardsToday()+g});setTimeout(()=>toast('+'+g+' Spirit Shards'+(why?' · '+why:'')),1300);return g;}
function tradeShards(){if(shards()<SHARD_CHEST)return false;LS.set('oni-shards',shards()-SHARD_CHEST);addChest(1);SFX.coin();toast('Traded '+SHARD_CHEST+' Spirit Shards for a reward chest');return true;}

/* ===================== SAFETY: server checks, 18+, region, limits, identity checks ===================== */
const ON_SERVER=typeof location!=='undefined'&&!/claude\.ai|claudeusercontent|claude\.site/.test(location.hostname)&&location.protocol!=='file:';
async function verifyOnServer(proof){if(!ON_SERVER)return null;try{const r=await fetch('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({proof})});return await r.json();}catch(e){return null;}}
// region: the server says if paid modes are allowed where the player is
const REGION={country:null,paid:true,checked:false};
async function geoCheck(){if(!ON_SERVER){REGION.checked=true;return;}try{const r=await fetch('/api/geo');const j=await r.json();REGION.country=j.country;REGION.paid=j.paid!==false;}catch(e){}REGION.checked=true;}
// player limits, kept on this device until the server keeps them per account
function limits(){return Object.assign({stake:0,daily:0,breakUntil:0},LS.get('oni-limits',{}));}
function setLimits(p){LS.set('oni-limits',Object.assign(limits(),p));}
function spentToday(){const s=LS.get('oni-spend',{});const d=new Date().toISOString().slice(0,10);return s.day===d?(s.cents|0):0;}
function addSpend(c){const d=new Date().toISOString().slice(0,10);LS.set('oni-spend',{day:d,cents:spentToday()+c});}
function paidBlock(cents){
  if(!REGION.paid)return 'Paid modes are not available in your region. Free play is open to everyone.';
  const L=limits();
  if(L.breakUntil>Date.now())return 'You are on a break from paid modes until '+new Date(L.breakUntil).toLocaleString()+'.';
  if(L.stake&&cents>L.stake)return 'This is above your own limit of '+usd(L.stake)+' per match. You can change it in Settings.';
  if(L.daily&&spentToday()+cents>L.daily)return 'This would pass your daily limit of '+usd(L.daily)+'. You can change it in Settings.';
  return null;}
function paidGate(cents,noteEl){const why=paidBlock(cents);if(why){if(noteEl)noteEl.textContent=why;toast(why);return false;}addSpend(cents);return true;}
// identity checks for big payouts
const KYC_PAYOUT=60000,KYC_YEAR=200000;
function kycCheck(cents){const y=new Date().getFullYear();const k=LS.get('oni-kyc-year',{});const tot=(k.y===y?k.c|0:0)+cents;LS.set('oni-kyc-year',{y,c:tot});
  if(cents>=KYC_PAYOUT||tot>=KYC_YEAR)return ' To withdraw this, an identity check (KYC) will be needed. Demo: no real money moves.';return '';}
// 18+ gate on the first visit
function ageGate(){if(LS.get('oni-age',0)===1)return;const d=document.createElement('div');d.id='age-gate';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
  d.innerHTML=`<div class="ag-box"><div class="ag-k">鬼</div><h2>Welcome to ONI</h2><p>ONI includes matches and tournaments with entry fees. You must be <b>18 or older</b> to play.</p><div class="ag-b"><button type="button" id="ag-yes">I am 18 or older</button><button type="button" id="ag-no">I am under 18</button></div><small>By entering you accept the <a href="#" data-lg="terms">Terms</a> and <a href="#" data-lg="privacy">Privacy Policy</a>.</small></div>`;
  document.body.appendChild(d);
  d.querySelector('#ag-yes').onclick=()=>{LS.set('oni-age',1);d.remove();};
  d.querySelector('#ag-no').onclick=()=>{d.querySelector('.ag-box').innerHTML='<div class="ag-k">鬼</div><h2>Sorry</h2><p>ONI is only for players 18 and over. Come back when you are old enough.</p>';};
  d.querySelectorAll('[data-lg]').forEach(a=>a.onclick=e=>{e.preventDefault();d.style.display='none';openLegal(a.dataset.lg);const back=$('lg-back').onclick;$('lg-back').onclick=()=>{d.style.display='';show('p-landing');$('lg-back').onclick=back;};});}

/* ===================== LEGAL (drafts, to be reviewed by a lawyer before real money) ===================== */
const LEGAL_CO='[Company name] LLC',LEGAL_MAIL='legal@theonicurse.xyz',LEGAL_DATE='October 2, 2026';
function legalDocs(){const tiers=HOLD.slice().reverse().map(h=>`<tr><td>${h.n}</td><td>$${h.usd.toLocaleString('en-US')} of $ONI</td><td>${h.fee}%</td></tr>`).join('');
  const odds=CHEST_ODDS.map(o=>`<tr><td>${o[0]}</td><td>${o[1]}%</td><td>${o[2].join(', ')}</td></tr>`).join('');
  return [
  ['terms','Terms of Service',`<p>These Terms are an agreement between you and ${LEGAL_CO} ("ONI", "we"), which runs the game at theonicurse.xyz. By playing you accept them. If you do not agree, do not use ONI.</p>
   <h4>1. Who can play</h4><p>You must be at least 18 years old, or the age of majority where you live if that is higher. Paid matches, cups, Enma tries and trading are only for people in places where skill-based games with entry fees are legal. You are responsible for checking the law where you are. We may block regions and may ask for identity checks (KYC) before payouts.</p>
   <h4>2. Your account and wallet</h4><p>You are responsible for your wallet, its keys and everything done with it. We never ask for your seed phrase. One account per person.</p>
   <h4>3. Skill games, not house games</h4><p>Matches and cups are decided by player skill. ONI never plays against you for money and never takes a side: the pot comes from the players and ONI keeps the published fee. Enma is a computer opponent; every $1 try is published with its rules and the jar is paid to whoever beats him on a paid try.</p>
   <h4>4. Fees</h4><p>All fees are listed on the Fees and odds page and shown before you pay. Fees on settled matches are not refunded.</p>
   <h4>5. Fair play</h4><p>Not allowed: cheating, bots or scripts, exploiting bugs, multiple accounts, collusion or match fixing, and harassing other players. We may void results, hold or cancel payouts and close accounts that break these rules.</p>
   <h4>6. Items and $ONI</h4><p>Cosmetic items give a licence to use them in ONI and change looks only, never strength. Some limited items can be resold to other players in the Trade market. $ONI is a community token; it is not an investment, it gives no ownership in ${LEGAL_CO}, and its price can go to zero. See the Token and risk page.</p>
   <h4>7. Availability</h4><p>ONI is offered "as is". It may change, pause or have downtime. If a paid match cannot be finished, stakes are refunded under the match rules.</p>
   <h4>8. Liability</h4><p>To the extent the law allows, our total liability to you is limited to the fees you paid us in the last 12 months.</p>
   <h4>9. Law and disputes</h4><p>These Terms are governed by the laws of [State], USA. [Dispute resolution clause to be set by counsel.]</p>
   <h4>10. Changes and contact</h4><p>We may update these Terms and will show the date of the latest version. Questions: ${LEGAL_MAIL}.</p>`],
  ['privacy','Privacy Policy',`<p>This explains what data ONI uses and why.</p>
   <h4>What we collect</h4><p>Your public wallet address, your display name, profile photo and clan if you set them, your match results, purchases and rankings, and basic technical data (device type, errors) to keep the game working. For payouts above legal limits, identity data may be collected by a verification partner.</p>
   <h4>What we do not collect</h4><p>Your seed phrase or private keys, your contacts, or your location beyond the country needed for legal checks.</p>
   <h4>Why</h4><p>To run matches and cups, pay prizes, show leaderboards and profiles, stop cheating and meet legal duties.</p>
   <h4>What is public</h4><p>Your name, rank, profile, clan and match history are visible to other players. Blockchain transactions are public by nature.</p>
   <h4>Sharing</h4><p>We do not sell your data. We share it only with service providers that help run ONI (hosting, payments, identity checks) or when the law requires it.</p>
   <h4>Your choices</h4><p>You can change your profile or ask us to delete it at ${LEGAL_MAIL}. On-chain records cannot be deleted.</p>
   <h4>Data in your browser</h4><p>ONI saves settings and progress in your browser's local storage so the game remembers you. It does not use advertising trackers. Clearing your browser data removes this.</p>`],
  ['play','Responsible Play',`<p>ONI is a game first. Play for fun, and only with money you can afford to lose.</p>
   <h4>Stay in control</h4><p>Free matches, free practice and free Enma tries are always available. Set yourself a budget and a time limit before you play for stakes, and stop if it stops being fun.</p>
   <h4>Signs to take a break</h4><p>Chasing losses, playing longer than planned, hiding how much you play, or feeling stressed about results.</p>
   <h4>Tools</h4><p>In Settings, Responsible play, you can set a limit per match, a daily limit, and take a break from all paid modes for 1, 7 or 30 days. For longer blocks, write to support@theonicurse.xyz.</p>
   <h4>Get help</h4><p>If gaming with money is causing you problems, talk to someone you trust or a local support service. In the US you can call or text 1-800-GAMBLER.</p>
   <p><b>18+ only. Not financial advice.</b></p>`],
  ['fees','Fees and odds',`<h4>1v1 matches</h4><p>Stakes, cup entries, Enma tries and prizes are paid in SOL; amounts are shown in USD and converted at the rate when you pay. Both players put in the same stake. The winner takes the pot minus a fee of 5%: 3.5% to ONI, 1% to rank rewards (Season Cauldron), 0.5% to the Curse Cauldron. $ONI holders pay less:</p>
   <table><tr><th>Tier</th><th>Hold</th><th>Match fee</th></tr>${tiers}</table><p>Free, $1 and $3 matches need no $ONI. Stakes above $3 need at least $30 of $ONI.</p>
   <h4>TENKA cups</h4><p>10% of all entries: 5% to ONI, 3% to rank rewards, 2% to the Curse Cauldron. 90% is paid in prizes as shown on each cup.</p>
   <h4>Enma</h4><p>$1 per paid try. 90% goes into the jar, 10% to ONI. The whole jar is paid to the player who beats Enma on a paid try. Free tries win no money.</p>
   <h4>Trade</h4><p>2.5% from the buyer and 2.5% from the seller, paid in $ONI. All of it funds advertising for ONI.</p>
   <h4>Market</h4><p>Prices are shown in USD and paid in SOL at the rate when you pay. Paying in $ONI gives 20% off. Bundles always show what is inside.</p>
   <h4>Reward chest odds</h4><table><tr><th>Rarity</th><th>Chance</th><th>Items</th></tr>${odds}</table><p>Chests are earned by playing and are never sold for money.</p>
   <h4>Spirit Shards</h4><p>Earned by beating the CPU in practice or arcade: 2 to 20 per win by difficulty, +50 for clearing arcade, up to ${SHARD_CAP} a day. ${SHARD_CHEST} shards trade for one reward chest. Shards are not $ONI, cannot be transferred or sold, and have no cash value.</p>`],
  ['contact','Contact and support',`<p>We read every message.</p>
   <h4>Support</h4><p>Questions, bugs, payments or account problems: <b>support@theonicurse.xyz</b>. Please add your wallet address and what happened.</p>
   <h4>Report a player</h4><p>Cheating, bots, collusion or abuse: <b>report@theonicurse.xyz</b>, with the match time and the player name.</p>
   <h4>Limits and breaks</h4><p>Set your own limits or pause paid modes any time in Settings, Responsible play. To close your account or block paid modes for longer, write to support.</p>
   <h4>Legal and privacy</h4><p>${LEGAL_MAIL}</p>
   <h4>Community</h4><p>X: @TheOniCurse · Discord: [invite link]</p>`],
  ['token','Token and risk',`<p>$ONI is a community token on Solana used inside the game for discounts, holder tiers and trade fees.</p>
   <h4>Not an investment</h4><p>Holding $ONI does not give shares, profit rights, dividends or ownership of ${LEGAL_CO}. Nothing in ONI is financial advice.</p>
   <h4>Risks</h4><p>The price of $ONI and any crypto can move fast and can fall to zero. Transactions on a blockchain are final and cannot be reversed. Smart contracts can have bugs even after audits. Laws about crypto and games with entry fees are changing and may limit where ONI can be offered.</p>
   <h4>Your keys</h4><p>Only you control your wallet. Lost keys cannot be recovered by us.</p>`]];}
function openLegal(tab){SFX.select();renderLegal(tab||'terms');show('p-legal');$('p-legal').scrollTop=0;}
function renderLegal(tab){const D=legalDocs();const cur=D.find(d=>d[0]===tab)||D[0];
  $('lg-tabs').innerHTML=D.map(d=>`<button type="button" data-lg="${d[0]}" aria-pressed="${d[0]===cur[0]}">${d[1]}</button>`).join('');
  $('lg-tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{SFX.select();renderLegal(b.dataset.lg);$('p-legal').scrollTop=0;});
  $('lg-body').innerHTML=`<h3>${cur[1]}</h3><div class="lg-draft">Draft for review by counsel before real-money launch. Placeholders are in [brackets].</div>${cur[2]}<p class="lg-date">Last updated ${LEGAL_DATE}</p>`;}
$('lg-back').onclick=()=>{SFX.select();goHome();};
document.querySelectorAll('.ld-foot [data-lg]').forEach(a=>a.onclick=e=>{e.preventDefault();openLegal(a.dataset.lg);});

/* ===================== SETTINGS (replaces the old title menu) ===================== */
function openSettings(){auInit();SFX.select();renderSettings();show('p-settings');$('p-settings').scrollTop=0;}
function renderSettings(){const el=$('set-body');const lim=(t,d,id,opts,cur)=>`<div class="set-row"><div><b>${t}</b><small>${d}</small></div><select class="set-sel" id="${id}">${opts.map(([v,l])=>`<option value="${v}"${v===cur?' selected':''}>${l}</option>`).join('')}</select></div>`;const row=(t,d,lab,fn,id)=>`<div class="set-row"><div><b>${t}</b><small>${d}</small></div><button type="button" class="set-btn" id="${id}">${lab}</button></div>`;
  el.innerHTML=`<h3 class="set-h">Game</h3>`+row('Graphics','HD fighters, or the classic pixel look.',GFX.hd?'HD':'Classic',0,'st-gfx')+row('Comfort mode','Fewer flashes and less screen shake.',COMFORT.on?'On':'Off',0,'st-comfort')+row('Sound','Music and effects.',AU.muted?'Off':'On',0,'st-sound')+(document.body.classList.contains('touch')?row('Vibration','A short buzz when you press a button.',hapticsOn()?'On':'Off',0,'st-hap'):'')+
    `<h3 class="set-h">Learn</h3>`+row('Tutorial','A short guided first fight.','Start',0,'st-tut')+row('Training','Practise moves and combos with no timer.','Open',0,'st-train')+row('Controls','Keys and touch buttons.','Show',0,'st-ctrl')+
    `<h3 class="set-h">More modes</h3>`+row('Arcade','Beat every fighter in a row, then face Enma.','Play',0,'st-arcade')+
    `<h3 class="set-h">Responsible play</h3>`+lim('Limit per match','The most you can stake in one match.','st-lstake',[[0,'No limit'],[300,'$3'],[1000,'$10'],[2500,'$25'],[5000,'$50']],limits().stake)+lim('Daily limit','The most you can spend on paid modes in a day.','st-ldaily',[[0,'No limit'],[1000,'$10'],[2500,'$25'],[5000,'$50'],[10000,'$100']],limits().daily)+row('Take a break','Pause all paid modes. Free play stays open.',limits().breakUntil>Date.now()?'On break':'Pause',0,'st-break')+
    `<h3 class="set-h">Legal</h3>`+row('Terms of Service','The rules for using ONI.','Read',0,'st-terms')+row('Privacy Policy','What data ONI uses and why.','Read',0,'st-priv')+row('Responsible Play','Stay in control, 18+ only.','Read',0,'st-resp')+row('Fees and odds','Every fee, tier and chest chance.','Read',0,'st-fees')+row('Token and risk','What $ONI is and is not.','Read',0,'st-token')+row('Contact and support','Help, reports, account requests.','Open',0,'st-contact');
  $('st-gfx').onclick=()=>{$('b-gfx').click();renderSettings();};$('st-comfort').onclick=()=>{$('b-comfort').click();renderSettings();};$('st-sound').onclick=()=>{auInit();setMute(!AU.muted);renderSettings();};if($('st-hap'))$('st-hap').onclick=()=>{try{localStorage.setItem('oni-haptics',hapticsOn()?'0':'1');}catch(e){}hap(20);renderSettings();};
  $('st-tut').onclick=()=>$('b-tut').click();$('st-train').onclick=()=>$('b-training').click();$('st-ctrl').onclick=()=>$('b-help').click();$('st-arcade').onclick=()=>$('b-arcade').click();
  $('st-lstake').onchange=e=>{setLimits({stake:+e.target.value});toast('Limit per match saved');};$('st-ldaily').onchange=e=>{setLimits({daily:+e.target.value});toast('Daily limit saved');};
  $('st-break').onclick=()=>{if(limits().breakUntil>Date.now()){toast('Your break ends on '+new Date(limits().breakUntil).toLocaleString());return;}const d=prompt('Pause paid modes for how many days? (1, 7 or 30)','7');const n=[1,7,30].includes(+d)?+d:0;if(!n)return;setLimits({breakUntil:Date.now()+n*864e5});toast('Paid modes paused for '+n+' day'+(n>1?'s':''));renderSettings();};
  $('st-terms').onclick=()=>openLegal('terms');$('st-priv').onclick=()=>openLegal('privacy');$('st-resp').onclick=()=>openLegal('play');$('st-fees').onclick=()=>openLegal('fees');$('st-token').onclick=()=>openLegal('token');$('st-contact').onclick=()=>openLegal('contact');}
$('set-back').onclick=()=>{SFX.select();goHome();};

/* ===================== INVENTORY (its own page) ===================== */
function openInventory(){auInit();SFX.select();renderMine($('inv-body'));show('p-inv');$('p-inv').scrollTop=0;}
$('inv-back').onclick=()=>{SFX.select();goHome();};
$('inv-market').onclick=()=>{openStore();};
/* ===================== CHAMPIONS (look only) ===================== */
const CHAMP={sel:'oni'};
function openChampions(k){auInit();SFX.select();if(k)CHAMP.sel=k;renderChampions();show('p-champs');$('p-champs').scrollTop=0;}
function renderChampions(){const k=CHAMP.sel,fd=FIGHTERS.find(x=>x.kit===k)||FIGHTERS[0],t=CH[k].tier;
  const el=$('ch-fi');el.innerHTML=fiHTML(k)+`<div class="ch-moves"><b>Special move</b><span><i>${esc(fd.mv[0])}</i>${fd.mv[1]?': '+esc(fd.mv[1]):''}</span></div>`+
    `<div class="ch-st">${owns(k)?'<span class="own">'+(t?'Owned':'Free for everyone')+'</span>':'<span class="ch-lock">Not owned · '+usd(TIER[t].price)+' in the Market</span>'}</div>`;
  const a=document.createElement('div');a.className='acts';const tr=document.createElement('button');tr.className='arc gold';tr.type='button';tr.textContent='Try vs CPU';tr.onclick=()=>{SEL.kit=k;openSelect('cpu');};a.appendChild(tr);
  if(!owns(k)){const mk=document.createElement('button');mk.className='arc alt';mk.type='button';mk.textContent='See in Market';mk.onclick=()=>openStore(k);a.appendChild(mk);}el.appendChild(a);
  showcase($('ch-cv'),k,[1,0,2,3][t]);
  const grid=$('ch-grid');grid.innerHTML='';FIGHTERS.forEach(f2=>{const b=document.createElement('button');b.type='button';b.className='ch-card'+(f2.kit===k?' on':'')+(owns(f2.kit)?'':' locked');b.setAttribute('aria-pressed',f2.kit===k?'true':'false');
    b.appendChild(posterEl(f2.kit,myPal(f2.kit)));b.insertAdjacentHTML('beforeend',`<span>${esc(CH[f2.kit].name)}</span>`);b.onclick=()=>{CHAMP.sel=f2.kit;SFX.select();renderChampions();$('p-champs').scrollTop=0;};grid.appendChild(b);});}
$('ch-back').onclick=()=>{SFX.select();goHome();};

/* ===================== PvE FINAL BOSS (its own mode, coming soon) ===================== */
function openFinalBoss(){auInit();SFX.select();const cv=$('fb-cv');const g=cv.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);g.imageSmoothingEnabled=false;
  g.fillStyle='#2A2430';g.fillRect(0,0,cv.width,cv.height);g.setTransform(2,0,0,2,0,0);if(typeof vilPrison==='function')vilPrison(g,-872,-226,usd(0),0);g.setTransform(1,0,0,1,0,0);show('p-finalboss');$('p-finalboss').scrollTop=0;}
$('fb-back').onclick=()=>{SFX.select();goHome();};

/* ===================== EVENTS -> SOUND + FX ===================== */
function processEvents(m){
  if(!m||!m.events)return;
  for(const e of m.events){if(e.id<=lastEv)continue;lastEv=e.id;
    switch(e.type){
      case 'round':SFX.taiko();setTimeout(()=>SFX.taiko(),180);break;
      case 'fight':SFX.fight();FX.shake=3;break;
      case 'swing':SFX.swing(e.a);break;
      case 'jump2':SFX.jump();sparks(e.x,e.y,5,['#F3E9E4','#C9A9A2']);break;
      case 'hit':{const heavy=e.a&1,combo=e.a>>1;SFX.hit(heavy);sparks(e.x,e.y,heavy?14:9,['#FFFFFF','#FFB000','#C1121F']);FX.shake=heavy?5:3;if(combo>=2)pop(combo+' HIT COMBO',e.x,e.y-18,'#FFB000');break;}
      case 'block':SFX.block();sparks(e.x,e.y,7,['#FFFFFF','#DDE3EE','#FFB000']);break;
      case 'special':{const kit=e.a>>1;SFX.special(kit);if(kit===2)FX.shake=4;pop(['CURSE!','STAFF STRIKE!','DRAGON FIRE!','FOX BLINK','SKY DIVE!','COUNTER STANCE','PHASE','HELLFIRE!'][kit]||'',e.x,e.y-14,'#FF6A00');break;}
      case 'gbreak':SFX.clash();SFX.hit(1);FX.shake=7;sparks(e.x,e.y,18,['#FFE08A','#FFFFFF','#FFB000']);pop('GUARD BREAK',e.x,e.y-14,'#FFE08A');break;
      case 'tech':SFX.block();sparks(e.x,e.y,10,['#FFFFFF','#DDE3EE']);pop('TECH',e.x,e.y-16,'#F3E9E4');break;
      case 'throw':SFX.hit(1);FX.shake=4;pop('THROW',e.x,e.y-18,'#FFB000');break;
      case 'dash':SFX.jump();sparks(e.x,e.y-2,5,['#C9A9A2','#8A6A5A']);break;
      case 'super':SFX.special(2);SFX.fight();FX.flash=10;FX.shake=6;FX.superT=40;pop('ONI WRATH',e.x,e.y-26,'#FFB000');break;
      case 'blink':sparks(e.x,e.y,12,['#7FE7FF','#FFFFFF','#C49BFF']);break;
      case 'counter':SFX.splash();sparks(e.x,e.y,16,['#7FE7FF','#9BF07A','#FFFFFF']);pop('COUNTER!',e.x,e.y-22,'#7FE7FF');FX.shake=5;break;
      case 'phase':sparks(e.x,e.y,10,['#9B59D0','#2EC4B6','#FFFFFF']);break;
      case 'clash':SFX.clash();sparks(e.x,e.y,14,['#FF6A00','#2EC4B6','#FFFFFF']);FX.shake=4;break;
      case 'ko':{SFX.ko();musicStop();FX.shake=10;FX.flash=8;sparks(e.x,e.y,26,['#FFFFFF','#FFB000','#C1121F']);
        const wf=m.f[e.a];const tier=wf?CH[wf.ch].tier:0;const final=m.wins&&m.wins[e.a]>=2;
        if(tier>=2&&final){FX.fin={x:e.x,y:e.y,t:0,tier,c:PAL[wf.ch][palOf(m,e.a)].main};if(tier===3){sparks(e.x,e.y,40,['#FFB000','#FFE08A','#FFFFFF']);setTimeout(()=>SFX.win(),300);}else SFX.clash();}
        break;}
      case 'time':case 'draw':SFX.taiko();musicStop();break;
      case 'win':SFX.win();break;
    }
  }
}

/* ===================== LOOP ===================== */
let acc=0,last=performance.now();
const titleF=[{ch:'oni',x:62,face:1},{ch:'oni',x:258,face:-1}].map(o=>Object.assign({y:GROUND,st:'idle',t:0,flash:0,air:false},o));
function render(m){
  ctx=CAM.on?camBuf():CAM.ectx;CAM.grabbed=false;
  if(mode==='village'){renderVillage();return;}
  if(m&&m.scene==='intro'&&m.sceneT<2){HUDTR[0]=null;HUDTR[1]=null;}
  const mapI=m?m.map:1;
  const sx=FX.shake?Math.round((Math.random()*2-1)*FX.shake):0,sy=FX.shake?Math.round((Math.random()*2-1)*FX.shake):0;
  G=ctx;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0A0506';ctx.fillRect(0,0,960,540);ctx.setTransform(3,0,0,3,0,0);ctx.imageSmoothingEnabled=false;
  if(m&&m.scene==='vs'){drawVS(m,m.sceneT);return;}
  if(BGHI[mapI]){ctx.setTransform(2,0,0,2,sx*3,sy*3);ctx.drawImage(BGHI[mapI],0,0);}else{ctx.setTransform(3,0,0,3,sx*3,sy*3);ctx.drawImage(BG[mapI],0,0);}
  ctx.setTransform(3,0,0,3,sx*3,sy*3);drawAmb(mapI);
  if(!m){
    titleF.forEach((f,i)=>drawFighter(f,frameN,i));
    const b=Math.round(Math.sin(frameN*0.05)*2);
    txt('ONI',160,30+b,34,'#D7262E','#1A0506');txt('THE CURSE YOU CHOOSE',160,54,7,'#F3E9E4','#1A0506');
    ctx.setTransform(3,0,0,3,0,0);return;
  }
  drawAura();const order=m.f[0].st==='hurt'?[0,1]:[1,0];order.forEach(i=>drawFighter(m.f[i],frameN,palOf(m,i)));
  m.proj.forEach(p=>drawProj(p,frameN,palOf(m,p.owner)));
  for(const s of FX.sparks)rect(s.x,s.y,s.life>8?2:1,s.life>8?2:1,s.c);
  if(m.scene==='ko'&&m.winner>=0&&m.f[1-m.winner].hp<=0&&m.sceneT<56){const L=m.f[1-m.winner];const q=Math.min(1,m.sceneT/14),z=1+0.22*(m.sceneT<40?q:Math.max(0,1-(m.sceneT-40)/16));
    const fx=L.x*3,fy=(L.y-26)*3;ctx.setTransform(1,0,0,1,0,0);const sw=960/z,sh=540/z;const sx0=Math.max(0,Math.min(960-sw,fx-sw/2)),sy0=Math.max(0,Math.min(540-sh,fy-sh/2));
    if(z>1.001)ctx.drawImage(ctx.canvas,sx0,sy0,sw,sh,0,0,960,540);
    if(m.sceneT<26){const cxk=(fx-sx0)*z,cyk=(fy-sy0)*z;ctx.globalCompositeOperation='lighter';for(let i=0;i<14;i++){const a=i*0.449+m.sceneT*0.03,r0=40+m.sceneT*6,r1=r0+90;ctx.strokeStyle=`rgba(255,${i%2?220:150},90,${0.5*(1-m.sceneT/26)})`;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(cxk+Math.cos(a)*r0,cyk+Math.sin(a)*r0);ctx.lineTo(cxk+Math.cos(a)*r1,cyk+Math.sin(a)*r1);ctx.stroke();}ctx.globalCompositeOperation='source-over';}
    if(m.sceneT<4&&!COMFORT.on){ctx.fillStyle=`rgba(255,250,240,${0.55-m.sceneT*0.12})`;ctx.fillRect(0,0,960,540);}}
  ctx.setTransform(3,0,0,3,0,0);
  const cam=CAM.on;
  if(cam){/* world-space overlays go with the zoomed world; then hand the world to the camera and draw the HUD on a clear layer */
    if(mode==='training'&&!TUT.on)drawHitboxes(m);
    for(const p of FX.pops)txt(p.text,Math.max(48,Math.min(272,p.x)),p.y,7,p.c,'#1A0506');
    screenFx(true);camGrab(m);ctx.setTransform(3,0,0,3,0,0);}
  const me=myIdx();if(mode!=='demo')hud(m,mode==='spectate'?-1:me);
  if(!cam)for(const p of FX.pops)txt(p.text,Math.max(48,Math.min(272,p.x)),p.y,7,p.c,'#1A0506');
  if(mode==='training')drawTraining(m);
  if(m.scene==='intro'){const nd=m.need||2,fin=nd>1&&m.wins[0]===nd-1&&m.wins[1]===nd-1;
    if(m.sceneT<72)txt(nd===1?'KNOCKOUT':fin?'FINAL ROUND':'ROUND '+m.round,160,70,fin||nd===1?18:20,fin||nd===1?'#FFB000':'#F3E9E4','#1A0506');
    if(m.sceneT<72&&nd===3&&m.round===1)txt('BEST OF 5',160,92,8,'#FFB000','#1A0506');
    if(m.sceneT>=72)txt('FIGHT!',160,74,26,'#D7262E','#1A0506');}
  if(m.scene==='ko'){
    if(m.winner<0)txt('DRAW',160,78,24,'#F3E9E4','#1A0506');
    else if(m.timer<=0&&m.f[1-m.winner].hp>0)txt('TIME',160,78,24,'#FFB000','#2A1300');
    else{const k=m.sceneT<12?1.6-m.sceneT*0.05:1;txt('K.O.',160,78,Math.round(34*k),'#D7262E','#FFB000');}
    if(m.sceneT>70&&m.winner>=0){txt(fname(m.f[m.winner].ch,palOf(m,m.winner),m.f[m.winner].skin)+' WINS',160,108,10,'#F3E9E4','#1A0506');if(m.perfect)txt('FLAWLESS',160,124,10,'#FFB000','#2A1300');}
  }
  if(m.scene==='matchEnd'){
    const sp=mode==='spectate',won=m.winner===me;
    txt(sp?fname(m.f[m.winner].ch,palOf(m,m.winner),m.f[m.winner].skin)+' WINS':(won?'YOU WIN':'YOU LOSE'),160,60,sp?14:20,won||sp?'#FFB000':'#D7262E','#1A0506');
    if(m.stake>0&&!sp){const p=payout(m.stake);txt(won?'+'+usd(p.win):'-'+usd(m.stake),160,84,11,won?'#2EC4B6':'#D7262E','#1A0506');}
    else if(m.perfect)txt('FLAWLESS VICTORY',160,86,9,'#F3E9E4','#1A0506');
    if(mode==='cpu'&&!won&&contT>0){const n=Math.ceil(contT/60)-1;txt('CONTINUE? '+Math.max(0,n),160,106,10,'#F3E9E4','#D7262E');}
  }
  if(!cam)screenFx(false);
}
function screenFx(cam){
  if(FX.superT>0){FX.superT--;ctx.fillStyle='rgba(10,0,0,'+Math.min(0.35,FX.superT/60)+')';ctx.fillRect(0,0,W,H);}
  if(cam)ctx.setTransform(3,0,0,3,0,0);
  drawFinisher();
  if(FX.flash>0&&!COMFORT.on){ctx.fillStyle='rgba(255,255,255,'+(FX.flash/14)+')';ctx.fillRect(0,0,W,H);}
}
const DEMO_BADGE=document.getElementById('demo-badge');
function loop(now){if(DEMO_BADGE){const fight=!!M&&mode!=='title'&&mode!=='village'&&!(document.querySelector&&document.querySelector('.panel.on'));DEMO_BADGE.style.display=fight?'none':'';const v=mode==='village'&&!document.querySelector('.panel.on')&&document.getElementById('scroll').hidden;DEMO_BADGE.style.top=v?'8px':'';DEMO_BADGE.style.bottom=v?'auto':'';}
  requestAnimationFrame(loop);
  const dt=Math.min(100,now-last);last=now;frameN++;
  camSync();
  document.body.classList.toggle('village',mode==='village');
  if(mode==='village'&&!document.body.classList.contains('menu')){acc+=dt;let n=0;while(acc>=1000/60&&n<5){vilTick(sampleInput());acc-=1000/60;n++;}if(n>=5)acc=0;}
  if(mode==='cpu'||mode==='host'||mode==='tourney'||mode==='training'||mode==='boss'||mode==='demo'){
    acc+=dt;if(PAUSE.on)acc=0;
    while(M){const stepMs=M.slow>0?1000/60*2.5:1000/60;if(acc<stepMs)break;acc-=stepMs;
      const mine=mode==='demo'?cpuInput(M,0,DEMO.mem,2):sampleInput();const other=mode==='demo'?cpuInput(M,1,cpuMem,2):mode==='training'?dummyInput():(mode==='cpu'||mode==='tourney'||mode==='boss')?cpuInput(M,1,cpuMem,level):hostTick();
      if(mode==='host'){if(!M.log)M.log=[];M.log.push((mine&255)|((other&255)<<8));}
      step(M,[mine,other]);if(mode==='training')trainingTick(mine);if(M.slow>0)M.slow--;}
    if(mode==='host'&&M){hostPublish();if(M.scene==='matchEnd'&&!M.recorded){M.recorded=true;recordMatch(M);}}
    if(M){processEvents(M);
      if(M.scene==='matchEnd'&&M.sceneT>90&&!endShown)endPanel();
      if(mode==='cpu'&&M&&M.scene==='matchEnd'&&contT>0&&M.winner!==0){contT-=dt/16.67;if(contT<=0)toTitle();}
    }
    render(M);
  } else if(mode==='guest'||mode==='spectate'||mode==='net'){
    const m=NET.auth?netTick(dt):(guestTick(sampleInput()),interp());processEvents(M);
    if(M&&M.scene==='matchEnd'&&M.sceneT>90&&!endShown)endPanel();
    render(m||null);
  } else render(null);
  camPresent();
  demoTick();if(M&&M.f)auraTick(M);updFx(M?M.map:1);
  if(document.body.classList.contains('menu')&&$('p-cauldron').classList.contains('on'))renderCauldrons();
  if(document.body.classList.contains('menu')){tickShowcases();tickTrophy();}
}
function boot(){fightUiInit();ageGate();geoCheck();buildAll();refreshTitle();refreshProfileBtn();renderLanding();startDemo();show('p-landing');requestAnimationFrame(loop);netInit();dbInit();}
if(document.fonts&&document.fonts.load){Promise.race([document.fonts.load('8px "Press Start 2P"'),new Promise(r=>setTimeout(r,1500))]).then(boot,boot);}else boot();
