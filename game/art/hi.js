/* ===== HI-RES ONI RIG (480x270 space; 1 world unit = 1.5 px) ===== */
const HI_RAMPS={
 aka:{m0:'#FF7A6A',m1:'#D7262E',m2:'#9E1620',m3:'#5E0A10',cord:'#E0323A',cordD:'#8E1015',eye:'#FFB000',flame:['#FFF2A8','#FFB000','#FF6A00','#C1121F']},
 ao:{m0:'#8FBCFF',m1:'#2F6FE0',m2:'#1B4AA8',m3:'#0E2A66',cord:'#2EC4B6',cordD:'#16746B',eye:'#FFE14A',flame:['#E6FFFF','#7FE7FF','#2EC4B6','#1B5FD1']},
 kin:{m0:'#FFF4B0',m1:'#FFC93A',m2:'#C88A00',m3:'#7A4E00',cord:'#FFD86A',cordD:'#A87000',eye:'#FF3B30',flame:['#FFFFFF','#FFF2A8','#FFC93A','#C88A00'],
   ov:{arm0:'#3A3024',arm1:'#1E1A14',arm2:'#14110C',arm3:'#FFB000',gi1:'#1A1612',gi2:'#0E0C09',hak0:'#3A3228',hak1:'#221D16',hak2:'#15120D',hak3:'#0C0A07',
       horn0:'#FFFFFF',horn1:'#FFE08A',horn2:'#C88A00',tsuba:'#FFD86A',blade0:'#FFFFFF',blade1:'#FFF4C8',blade2:'#E0B040',sandal:'#3A2A14',strap:'#FFD86A'}},
 genesis:{m0:'#6A2A30',m1:'#2A1418',m2:'#1A0A0E',m3:'#FF3B30',cord:'#FF3B30',cordD:'#8E1015',eye:'#FF5A3C',flame:['#FFE0D0','#FF8A5A','#FF3B30','#8E1015'],
   ov:{arm0:'#4A2A30',arm1:'#1E1418',arm2:'#140C10',arm3:'#FF3B30',gi1:'#18100F',gi2:'#0E0808',hak0:'#3A2A2E',hak1:'#1E1418',hak2:'#140C10',hak3:'#0A0606',
       horn0:'#FFD0C8',horn1:'#FF5A4E',horn2:'#8E1015',tsuba:'#FF3B30',blade0:'#FFFFFF',blade1:'#FFD0C8',blade2:'#FF3B30',sandal:'#1E1418',strap:'#FF3B30',hair1:'#0A0606',hair2:'#000000'}},
 kongo:{m0:'#FFFFFF',m1:'#CFF6FF',m2:'#7FD8F0',m3:'#2E8AB0',cord:'#BFFFF8',cordD:'#2EC4B6',eye:'#FF5AD8',flame:['#FFFFFF','#E6FFFF','#7FE7FF','#2EC4B6'],
   ov:{arm0:'#FFFFFF',arm1:'#D8E6F2',arm2:'#9AB4CC',arm3:'#5A7A96',gi1:'#E8F0F8',gi2:'#A8C0D8',hak0:'#F4F8FC',hak1:'#C8DAEA',hak2:'#8AA6C2',hak3:'#5A7896',
       horn0:'#FFFFFF',horn1:'#BFFFF8',horn2:'#5ACCE0',hair0:'#E8F0F8',hair1:'#B8CCE0',hair2:'#7A94B0',tsuba:'#BFFFF8',blade0:'#FFFFFF',blade1:'#E6FFFF',blade2:'#7FE7FF',sandal:'#9AB4CC',strap:'#FFFFFF',skin1:'#E8F0F8',skin2:'#A8C0D8'}}};
const HI_C0={horn0:'#FAF0D8',horn1:'#DCCA9C',horn2:'#A8946A',hair0:'#3A3A48',hair1:'#1C1C24',hair2:'#0E0E14',
 arm0:'#5A6280',arm1:'#3A3F52',arm2:'#262A38',arm3:'#161924',gi1:'#2E3244',gi2:'#1E212C',hak0:'#4A5068',hak1:'#2E3240',hak2:'#1E212C',hak3:'#12141B',
 skin1:'#B07A52',skin2:'#7A4E30',sandal:'#6B4226',sandalD:'#3A2414',strap:'#C8A060',blade0:'#FFFFFF',blade1:'#DDE4EE',blade2:'#9AA4B4',
 tsuba:'#C9A227',tsubaD:'#7A5A10',wrap:'#1A1A22',wrapL:'#E8D8B0'};
function hiPoly(g,pts,c){g.fillStyle=c;let y0=1e9,y1=-1e9;for(const p of pts){if(p[1]<y0)y0=p[1];if(p[1]>y1)y1=p[1];}
  for(let y=Math.floor(y0);y<=Math.ceil(y1);y++){const xs=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];
    if((a[1]<=y+0.5&&b[1]>y+0.5)||(b[1]<=y+0.5&&a[1]>y+0.5))xs.push(a[0]+(y+0.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));}
    xs.sort((p,q)=>p-q);for(let i=0;i+1<xs.length;i+=2){const x0=Math.round(xs[i]),x1=Math.round(xs[i+1]);if(x1>x0)g.fillRect(x0,y,x1-x0,1);}}}
function hiLimb(g,a,b,w0,w1,c,cs){const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
  hiPoly(g,[[a[0]+nx*w0/2,a[1]+ny*w0/2],[b[0]+nx*w1/2,b[1]+ny*w1/2],[b[0]-nx*w1/2,b[1]-ny*w1/2],[a[0]-nx*w0/2,a[1]-ny*w0/2]],c);
  if(cs)hiPoly(g,[[a[0],a[1]],[b[0],b[1]],[b[0]-nx*w1/2,b[1]-ny*w1/2],[a[0]-nx*w0/2,a[1]-ny*w0/2]],cs);}
function hiElbow(sh,hand,len,down){const dx=hand[0]-sh[0],dy=hand[1]-sh[1],d=Math.hypot(dx,dy)||1;const mx=(sh[0]+hand[0])/2,my=(sh[1]+hand[1])/2;
  const h=d<len*2?Math.sqrt(len*len-(d/2)*(d/2)):0;const nx=-dy/d,ny=dx/d;const s=down?1:-1;return[mx+nx*h*s,my+ny*h*s];}
const lerp=(a,b,t)=>a+(b-a)*t,lp=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t)];
/* poses: all numbers in px, facing right, feet at y=0 */
function hiPose(f,fr){
  const st=f.st,t=f.t,c=CH[f.ch]||CH.oni,ph=Math.floor(fr/22)%2;
  let P={hip:[0,-38+ph],lean:0.05,kb:[-10,-20],fb:[-15,0],kf:[10,-20],ff:[15,0],grip:[15,-46+ph],hb:null,ang:-0.72,len:48,head:0,hurt:false,arc:null,flame:null,crouch:false};
  if(st==='walk'){const k=Math.sin(fr*0.22);P.kb=[-8+k*4,-20];P.fb=[-12+k*8,0];P.kf=[8-k*4,-20];P.ff=[12-k*8,0];P.hip[1]=-38+Math.abs(k);}
  else if(st==='dash'){P.lean=0.3;P.kb=[-14,-18];P.fb=[-24,0];P.kf=[14,-22];P.ff=[20,0];P.ang=-0.2;P.grip=[14,-44];}
  else if(st==='jump'||(f.air&&(st==='idle'||st==='walk'))){P.hip=[0,-44];P.kb=[-8,-28];P.fb=[-12,-14];P.kf=[10,-32];P.ff=[8,-16];P.ang=-0.45;}
  else if(st==='crouch'||(st==='block'&&f.crouch)){P.crouch=true;P.hip=[0,-23];P.lean=0.18;P.kb=[-12,-13];P.fb=[-17,0];P.kf=[14,-15];P.ff=[17,0];P.grip=[13,-31];P.ang=-0.55;P.len=44;
    if(st==='block'){P.grip=[17,-32];P.ang=-1.57;P.len=38;}}
  else if(st==='block'){P.lean=-0.05;P.grip=[17,-46];P.ang=-1.57;P.len=44;}
  else if(st==='punch'){const a=f.atk==='cpunch'?c.cpunch:c.punch,low=f.atk==='cpunch';const reach=a.reach*GEO*1.5;
    if(low){P.crouch=true;P.hip=[0,-23];P.lean=0.28;P.kb=[-12,-13];P.fb=[-17,0];P.kf=[16,-15];P.ff=[20,0];}
    const y=low?-27:-48;
    if(t<=a.s){P.grip=low?[0,-40]:[2,-68];P.ang=low?-2.0:-2.4;P.lean=low?0.1:-0.1;P.len=44;}
    else if(t<=a.s+a.a+2){P.lean=low?0.35:0.22;P.hip[0]=4;P.kf=[14,low?-15:-22];P.ff=[20,0];P.grip=[30,y];P.ang=0;P.len=reach-30;P.arc={cx:8,cy:y-2,r:reach-8,a0:-1.3,a1:0.25};}
    else{P.grip=[22,y+8];P.ang=0.55;P.len=44;P.lean=low?0.2:0.12;}}
  else if(st==='kick'){const sw=f.atk==='sweep';const a=sw?c.sweep:c.kick,reach=a.reach*GEO*1.5;const act=t>a.s-2&&t<=a.s+a.a+4;
    if(sw){P.crouch=true;P.hip=[-2,-19];P.lean=0.32;P.kb=[-11,-6];P.fb=[-21,0];P.kf=act?[26,-8]:[12,-10];P.ff=act?[reach,-4]:[20,0];P.grip=[4,-30];P.ang=-0.95;P.len=40;}
    else{P.lean=-0.22;P.kf=act?[24,-24]:[12,-24];P.ff=act?[reach,-19]:[18,-8];P.grip=[-2,-48];P.ang=-1.25;P.len=44;}}
  else if(st==='throw'){P.lean=0.2;P.hb=[32,-48];P.grip=[-6,-38];P.ang=2.3;P.len=40;}
  else if(st==='special'){P.grip=[0,-38];P.ang=1.0;P.len=42;if(t<10){P.hb=[-20,-58];P.flame={x:-22,y:-62,r:3+Math.floor(t/3)};}else{P.hb=[32,-54];P.lean=0.18;}}
  else if(st==='super'){if(t<SUPER.startup){P.crouch=true;P.hip=[0,-26];P.lean=0.3;P.kb=[-14,-14];P.fb=[-20,0];P.kf=[14,-16];P.ff=[20,0];P.grip=[-6,-34];P.ang=2.9;P.len=44;P.glow=true;}
    else{P.lean=0.38;P.kb=[-16,-16];P.fb=[-30,0];P.kf=[18,-22];P.ff=[26,0];P.grip=[36,-46];P.ang=0.05;P.len=48;P.arc={cx:6,cy:-50,r:78,a0:-1.5,a1:0.6};}}
  else if(st==='hurt'||st==='grabbed'){P.lean=-0.32;P.hip=[-3,-37];P.head=-2;P.hurt=true;P.grip=[8,-38];P.ang=0.95;P.len=42;}
  else if(st==='win'){P.grip=[4,-80];P.ang=-1.57;P.len=46;P.hb2=[-12,-38];}
  return P;
}
function hiDrawOni(g,f,fr,palName){
  const r=HI_RAMPS[palName]||HI_RAMPS.aka;const C=Object.assign({},HI_C0,r.ov||{});const flash=f.flash>0&&f.flash%2===0;
  const col=k=>flash?'#FFFFFF':(C[k]||r[k]||k);
  if(f.st==='ko'&&!f.air){ // lying on the back, sword dropped
    for(let i=0;i<40;i++){g.fillStyle=col(i<10?'wrap':i<11?'tsuba':'blade1');g.fillRect(-52+i,-1,1,2);}
    hiLimb(g,[-4,-8],[-20,-12],14,13,col('hak2'),col('hak3'));hiLimb(g,[-20,-12],[-34,-4],13,15,col('hak2'));
    hiLimb(g,[-2,-6],[-18,-6],15,14,col('hak1'),col('hak2'));hiLimb(g,[-18,-6],[-36,-3],14,16,col('hak1'));
    hiPoly(g,[[-40,-7],[-30,-7],[-29,0],[-41,0]],col('sandal'));
    hiPoly(g,[[-4,-16],[20,-16],[22,0],[-6,0]],col('arm1'));hiPoly(g,[[-4,-16],[20,-16],[20,-11],[-4,-11]],col('arm0'));
    for(const x of [0,5,10,15]){g.fillStyle=col('arm3');g.fillRect(x,-15,1,14);g.fillStyle=col('cord');g.fillRect(x+2,-12,1,2);g.fillRect(x+2,-6,1,2);}
    hiPoly(g,[[-7,-16],[-3,-16],[-3,0],[-7,0]],col('m2'));
    hiLimb(g,[14,-12],[20,2],8,7,col('gi2'));g.fillStyle=col('skin2');g.fillRect(18,0,5,3);
    hiPoly(g,[[20,-18],[36,-18],[38,-4],[20,-4]],col('hair1'));
    hiPoly(g,[[22,-19],[36,-19],[37,-9],[22,-7]],col('m1'));hiPoly(g,[[22,-19],[36,-19],[36,-16],[22,-16]],col('m0'));
    g.fillStyle=col('m3');g.fillRect(25,-15,3,1);g.fillRect(31,-15,3,1);g.fillStyle='#2A0505';g.fillRect(26,-11,8,2);g.fillStyle='#FFFFFF';g.fillRect(26,-11,1,2);g.fillRect(33,-11,1,2);
    hiPoly(g,[[36,-18],[44,-24],[48,-26],[44,-20],[38,-14]],col('horn1'));hiPoly(g,[[36,-10],[44,-10],[49,-8],[44,-6],[37,-6]],col('horn1'));
    return;}
  const P=hiPose(f,fr);const L=P.lean;
  const rot=(p)=>{const dx=p[0]-P.hip[0],dy=p[1]-P.hip[1];return[P.hip[0]+dx*Math.cos(L)-dy*Math.sin(L),P.hip[1]+dx*Math.sin(L)+dy*Math.cos(L)];};
  const neck=rot([P.hip[0],P.hip[1]-32]),shB=rot([P.hip[0]-9,P.hip[1]-29]),shF=rot([P.hip[0]+10,P.hip[1]-29]);
  const hipB=[P.hip[0]-7,P.hip[1]],hipF=[P.hip[0]+7,P.hip[1]];
  // back leg
  hiLimb(g,hipB,P.kb,15,14,col('hak2'),col('hak3'));hiLimb(g,P.kb,[P.fb[0],P.fb[1]-4],14,17,col('hak2'),col('hak3'));
  hiPoly(g,[[P.fb[0]-8,P.fb[1]-5],[P.fb[0]+8,P.fb[1]-5],[P.fb[0]+10,P.fb[1]],[P.fb[0]-9,P.fb[1]]],col('sandalD'));
  // back arm (only when free)
  const hb=P.hb||(palName==='genesis'?[P.grip[0]-12,P.grip[1]+8]:[P.grip[0]-5,P.grip[1]+3]);const eB=hiElbow(shB,hb,14,true);
  hiLimb(g,shB,eB,9,8,col('gi2'));hiLimb(g,eB,hb,8,7,col('gi2'));g.fillStyle=col('skin2');g.fillRect(Math.round(hb[0]-2),Math.round(hb[1]-2),5,5);
  // hakama waist + front leg
  hiPoly(g,[rot([P.hip[0]-17,P.hip[1]-4]),rot([P.hip[0]+17,P.hip[1]-4]),[P.hip[0]+18,P.hip[1]+6],[P.hip[0]-18,P.hip[1]+6]],col('hak1'));
  hiLimb(g,hipF,P.kf,16,15,col('hak1'),col('hak2'));hiLimb(g,P.kf,[P.ff[0],P.ff[1]-4],15,19,col('hak1'),col('hak2'));
  const kd=[P.ff[0]-P.kf[0],P.ff[1]-P.kf[1]];for(const k of [-3,3]){g.fillStyle=col('hak2');for(let i=2;i<9;i++){const q=i/10;g.fillRect(Math.round(P.kf[0]+kd[0]*q+k),Math.round(P.kf[1]+kd[1]*q),1,2);}}
  hiPoly(g,[[P.ff[0]-8,P.ff[1]-5],[P.ff[0]+11,P.ff[1]-5],[P.ff[0]+13,P.ff[1]],[P.ff[0]-9,P.ff[1]]],col('sandal'));g.fillStyle=col('strap');g.fillRect(Math.round(P.ff[0]-6),Math.round(P.ff[1]-4),15,1);
  // torso: gi, do armor with lacing, belt
  const T=(x,y)=>rot([P.hip[0]+x,P.hip[1]+y]);
  hiPoly(g,[T(-15,-32),T(15,-32),T(17,-6),T(-17,-6)],col('gi1'));
  hiPoly(g,[T(-13,-28),T(13,-28),T(14,-8),T(-14,-8)],col('arm1'));hiPoly(g,[T(2,-28),T(13,-28),T(14,-8),T(4,-8)],col('arm2'));hiPoly(g,[T(-13,-28),T(-8,-28),T(-9,-8),T(-14,-8)],col('arm0'));
  for(let row=0;row<4;row++){const y=-25+row*5;const a=T(-12,y),b=T(13,y);g.fillStyle=col('arm3');for(let i=0;i<=25;i++){const q=i/25;g.fillRect(Math.round(lerp(a[0],b[0],q)),Math.round(lerp(a[1],b[1],q)),1,1);}
    for(let k=-10;k<12;k+=4){const p=T(k,y+1);g.fillStyle=col('cord');g.fillRect(Math.round(p[0]),Math.round(p[1]),1,2);}}
  hiPoly(g,[T(-17,-6),T(17,-6),T(18,0),T(-18,0)],col('m2'));hiPoly(g,[T(-17,-6),T(17,-6),T(17,-4),T(-17,-4)],col('m1'));
  // back shoulder guard
  const sb=(x,y)=>[shB[0]+x,shB[1]+y];hiPoly(g,[sb(-10,-3),sb(1,-3),sb(2,11),sb(-11,9)],col('arm1'));hiPoly(g,[sb(-10,-3),sb(-6,-3),sb(-7,10),sb(-11,9)],col('arm0'));
  for(const y of [1,5,9]){g.fillStyle=col('arm3');g.fillRect(Math.round(shB[0]-10),Math.round(shB[1]+y),11,1);}
  // head (hair, mask, horns), anchored at the neck
  const H=(x,y)=>[neck[0]+x+P.head,neck[1]+y+8];
  hiPoly(g,[H(-6,-8),H(6,-8),H(2,0),H(-2,0)],col('gi2'));
  hiPoly(g,[H(-9,-22),H(9,-22),H(11,-8),H(-11,-8)],col('hair1'));hiPoly(g,[H(-12,-18),H(-8,-20),H(-9,-2),H(-13,-4)],col('hair2'));
  g.fillStyle=col('hair1');g.fillRect(Math.round(H(-2,-28)[0]),Math.round(H(-2,-28)[1]),6,6);g.fillStyle=col('hair0');g.fillRect(Math.round(H(-1,-29)[0]),Math.round(H(-1,-29)[1]),3,2);
  hiPoly(g,[H(-7,-20),H(9,-20),H(10,-6),H(6,-3),H(-6,-3),H(-8,-6)],col('m1'));hiPoly(g,[H(4,-20),H(9,-20),H(10,-6),H(6,-3)],col('m2'));hiPoly(g,[H(-7,-20),H(-3,-20),H(-5,-6),H(-8,-6)],col('m0'));
  hiPoly(g,[H(-2,-16),H(3,-14),H(8,-16),H(8,-14),H(3,-12),H(-2,-14)],col('m3'));
  if(palName==='genesis'&&!flash){const cr=[[-5,-19],[-4,-17],[-4,-15],[-3,-9],[7,-19],[8,-17],[6,-8],[5,-6]];for(const [x,y] of cr){const p=H(x,y);g.fillStyle='#FF3B30';g.fillRect(Math.round(p[0]),Math.round(p[1]),1,2);}
    for(let i=0;i<3;i++){const ph=(fr*1.4+i*37)%60;const ex=Math.round(Math.sin(i*2.1+fr*0.05)*16),ey=Math.round(-10-ph*1.3);g.globalAlpha=Math.max(0,1-ph/60);g.fillStyle=i%2?'#FF6A00':'#FF3B30';g.fillRect(ex,ey,2,2);g.globalAlpha=1;}}
  const E=(x,y,w,h,k)=>{const p=H(x,y);g.fillStyle=col(k);g.fillRect(Math.round(p[0]),Math.round(p[1]),w,h);};
  if(P.hurt){E(0,-12,3,1,'m3');E(5,-12,3,1,'m3');}else{E(0,-13,3,2,'eye');E(5,-13,3,2,'eye');E(0,-13,1,1,'#FFF6D0');E(5,-13,1,1,'#FFF6D0');}
  E(3,-10,2,3,'m2');E(1,-6,9,2,'#2A0505');E(1,-6,1,3,'#FFFFFF');E(8,-6,1,3,'#FFFFFF');
  hiPoly(g,[H(-7,-20),H(-10,-28),H(-13,-34),H(-10,-32),H(-6,-26),H(-4,-20)],col('horn1'));hiPoly(g,[H(-10,-28),H(-13,-34),H(-12,-32)],col('horn0'));
  hiPoly(g,[H(6,-20),H(9,-28),H(13,-34),H(11,-28),H(9,-22)],col('horn1'));hiPoly(g,[H(9,-28),H(13,-34),H(12,-30)],col('horn0'));
  // Genesis: twin sai and a ninja scarf instead of the katana
  if(palName==='genesis'&&!flash){const nk=neck;const fl=Math.sin(fr*0.2)*3;
    hiPoly(g,[[nk[0]-4,nk[1]+2],[nk[0]-22,nk[1]+8+fl],[nk[0]-20,nk[1]+12+fl],[nk[0]-2,nk[1]+6]],'#C1121F');hiPoly(g,[[nk[0]-6,nk[1]+4],[nk[0]-18,nk[1]+14+fl],[nk[0]-16,nk[1]+16+fl],[nk[0]-4,nk[1]+7]],'#8E1015');}
  const sai=(x,y,ang,len)=>{const ca=Math.cos(ang),sa=Math.sin(ang);
    for(let i=-6;i<0;i++){g.fillStyle=col(i%2?'wrap':'wrapL');g.fillRect(Math.round(x+ca*i),Math.round(y+sa*i),2,2);}
    for(let i=0;i<len;i++){g.fillStyle=col(i>len-3?'blade0':'blade1');g.fillRect(Math.round(x+ca*i),Math.round(y+sa*i),2,2);if(i%4===1){g.fillStyle=col('blade2');g.fillRect(Math.round(x+ca*i-sa),Math.round(y+sa*i+ca),1,1);}}
    for(const s of [-1,1]){const px=x-sa*5*s,py=y+ca*5*s;g.fillStyle=col('tsuba');g.fillRect(Math.round((x+px)/2),Math.round((y+py)/2),2,2);
      for(let i=0;i<6;i++){g.fillStyle=col('blade1');g.fillRect(Math.round(px+ca*i),Math.round(py+sa*i),2,2);}}};
  if(palName==='genesis'){const act=P.arc;const g0=P.grip;
    sai(g0[0],g0[1],act?0:P.ang*0.6-0.2,act?24:20);
    const hb2=P.hb||[g0[0]-12,g0[1]+8];sai(hb2[0],hb2[1],act?-0.6:P.ang*0.6+0.5,18);
    if(act){g.fillStyle='rgba(255,90,70,.6)';for(let a=P.arc.a0;a<=P.arc.a1;a+=0.05)g.fillRect(Math.round(P.arc.cx+Math.cos(a)*P.arc.r),Math.round(P.arc.cy+Math.sin(a)*P.arc.r),2,2);}}
  else if(P.len>0){const ca=Math.cos(P.ang),sa=Math.sin(P.ang);const gp=P.grip;
    for(let i=-12;i<0;i++){g.fillStyle=col(i%3===0?'wrapL':'wrap');g.fillRect(Math.round(gp[0]+ca*i),Math.round(gp[1]+sa*i),2,2);}
    hiLimb(g,[gp[0]-sa*4,gp[1]+ca*4],[gp[0]+sa*4,gp[1]-ca*4],3,3,col('tsuba'));
    for(let i=1;i<P.len;i++){const x=Math.round(gp[0]+ca*i),y=Math.round(gp[1]+sa*i);g.fillStyle=col('blade1');g.fillRect(x,y,2,2);g.fillStyle=col('blade2');g.fillRect(x-Math.round(sa),y+Math.round(ca)+1,1,1);if(i%6<2){g.fillStyle=col('blade0');g.fillRect(x,y,1,1);}}}
  // front arm to the grip
  const hf=P.hb&&P.st!=='x'?(P.len>0&&P.grip[0]<P.hb[0]?P.hb:P.grip):P.grip;const handF=P.hb&&P.hb[0]>P.grip[0]?P.hb:P.grip;
  const eF=hiElbow(shF,handF,14,true);hiLimb(g,shF,eF,10,9,col('gi1'),col('gi2'));hiLimb(g,eF,handF,9,7,col('gi1'),col('gi2'));
  g.fillStyle=col('skin1');g.fillRect(Math.round(handF[0]-3),Math.round(handF[1]-3),6,6);g.fillStyle=col('skin2');g.fillRect(Math.round(handF[0]+1),Math.round(handF[1]-1),2,4);
  if(P.hb2){g.fillStyle=col('skin2');g.fillRect(P.hb2[0],P.hb2[1],5,5);}
  // ---- HD details (double resolution only): armor lames, lacing, mask shading, horn ridges, hakama folds
  if(Math.abs(g.getTransform().a)>=1.5&&!flash){
    const dot=(p,c)=>{g.fillStyle=c;g.fillRect(p[0],p[1],0.5,0.5);};
    const line=(a,b,c,n)=>{n=n||Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2);for(let k=0;k<=n;k++){const q=k/n;dot([a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q],c);}};
    for(let row=0;row<4;row++){const y=-25+row*5;line(T(-12,y-1.5),T(12,y-1.5),col('arm0'));line(T(-12,y+1),T(12,y+1),col('arm3'));
      for(let x=-10;x<12;x+=4){line(T(x,y-0.5),T(x+1.5,y+0.5),col('cord'),4);line(T(x+1.5,y-0.5),T(x,y+0.5),col('cordD'),4);}}
    line(T(-16,-5.5),T(16,-5.5),col('m0'));dot(T(10,-3),col('m3'));dot(T(10.5,-2.5),col('m3'));
    for(const s of [-1,1])for(let k=0;k<5;k++)line([P.kf[0]+s*2.5+(P.ff[0]-P.kf[0])*k/5,P.kf[1]+(P.ff[1]-P.kf[1])*k/5],[P.kf[0]+s*2.5+(P.ff[0]-P.kf[0])*(k+0.6)/5,P.kf[1]+(P.ff[1]-P.kf[1])*(k+0.6)/5],col('hak0'),3);
    const Hp=(x,y)=>H(x,y);
    for(let k=0;k<6;k++){dot(Hp(-6+k*0.5,-19+k*0.4),col('m0'));dot(Hp(9-k*0.3,-12+k*1.2),col('m3'));}
    line(Hp(-1,-16.5),Hp(3,-15),col('m0'),6);line(Hp(4,-15),Hp(8,-16.5),col('m0'),6);
    for(let k=0;k<5;k++){dot(Hp(-9-k*0.6,-22-k*1.2),col('horn2'));dot(Hp(10+k*0.6,-22-k*1.2),col('horn2'));}
    dot(Hp(1.5,-12.5),'#FFFFFF');dot(Hp(6.5,-12.5),'#FFFFFF');
  }
  // front shoulder guard
  const sf=(x,y)=>[shF[0]+x,shF[1]+y];hiPoly(g,[sf(-1,-3),sf(10,-3),sf(11,10),sf(-2,11)],col('arm2'));for(const y of [1,5,9]){g.fillStyle=col('arm3');g.fillRect(Math.round(shF[0]-1),Math.round(shF[1]+y),11,1);}
  g.fillStyle=col('cordD');g.fillRect(Math.round(shF[0]),Math.round(shF[1]-2),1,11);
  // effects drawn with the body
  if(P.arc){const a0=P.arc.a0+0.35,a1=P.arc.a1;for(let a=a0;a<=a1;a+=0.015){const x=P.arc.cx+Math.cos(a)*P.arc.r,y=P.arc.cy+Math.sin(a)*P.arc.r;g.fillStyle='rgba(255,255,255,.85)';g.fillRect(Math.round(x),Math.round(y),2,2);g.fillStyle='rgba(255,255,255,.3)';g.fillRect(Math.round(x-Math.cos(a)*2),Math.round(y-Math.sin(a)*2),2,1);}}
  if(P.flame){const fc=r.flame;const R2=P.flame.r;for(let k=3;k>=0;k--){g.fillStyle=fc[3-k];const rr=Math.max(1,R2-k);for(let dy=-rr;dy<=rr;dy++){const w=Math.round(Math.sqrt(rr*rr-dy*dy));g.fillRect(P.flame.x-w,P.flame.y+dy,w*2+1,1);}}}
  if(P.glow){const fc=r.flame;for(let k=0;k<14;k++){const a=k/14*6.28+fr*0.3;g.fillStyle=fc[k%3];g.fillRect(Math.round(Math.cos(a)*26),Math.round(-30+Math.sin(a)*26),2,2);}}
}

/* ===== KAZE (hi-res) ===== */
const KZ={kaze0:{f0:'#F0C060',f1:'#C98A2E',f2:'#8A5A1A',f3:'#5A3A10',face:'#F4DDB8',faceD:'#D8B890',pant:'#8E1015',pantD:'#5A0A0E',vest:'#B3161F',vestD:'#7A0A12',gold:'#FFC93A',goldD:'#C88A00',scarf:'#FFE08A',scarfD:'#E0B040',staff:'#B3161F',staffD:'#7A0A12',eye:'#FFB000'},
 kaze1:{f0:'#9A7A5A',f1:'#6A4A3A',f2:'#3E2A20',f3:'#221812',face:'#E0C8A8',faceD:'#B89878',pant:'#1B3A5A',pantD:'#0E2238',vest:'#2F6FE0',vestD:'#1B4AA8',gold:'#DDE3EE',goldD:'#9AA4B4',scarf:'#8FF0E6',scarfD:'#2EC4B6',staff:'#1B3A5A',staffD:'#0E2238',eye:'#8FF0E6'}};
function kazePose(f,fr){
  const P=hiPose(f,fr);const c=CH.saru,sp=c.special,st=f.st,t=f.t;
  for(const k of ['hip','kb','fb','kf','ff']){if(P[k])P[k]=[P[k][0],P[k][1]*0.9];}
  P.fl=50;P.bl=36;P.grip=[8,P.crouch?-24:-36];P.ang=-0.4;P.hb=null;
  if(st==='jump'||f.air)P.ang=-0.2;
  if(st==='block'){P.grip=[16,P.crouch?-26:-38];P.ang=-1.57;P.fl=40;P.bl=34;}
  if(st==='punch'){const a=f.atk==='cpunch'?c.cpunch:c.punch;const reach=a.reach*GEO*1.5;const y=f.atk==='cpunch'?-24:-40;
    if(t<=a.s){P.grip=[0,y];P.ang=0;P.fl=36;P.bl=48;}else if(t<=a.s+a.a+2){P.grip=[18,y];P.ang=0;P.fl=reach-18;P.bl=26;P.arc=null;}else{P.grip=[12,y+4];P.ang=0.25;P.fl=44;P.bl=34;}}
  if(st==='kick'){P.grip=[-4,-40];P.ang=-1.1;P.fl=42;P.bl=38;}
  if(st==='throw'){P.hb=[30,-42];P.grip=[-4,-32];P.ang=2.4;P.fl=40;P.bl=30;}
  if(st==='special'){const reach=sp.reach*GEO*1.5,y=-(sp.y+sp.h/2)*GEO*1.5;
    if(t<=sp.at){P.grip=[2,-46];P.ang=-1.4+t*0.3;P.fl=42;P.bl=42;P.spin=true;}
    else if(t<=sp.at+sp.act+2){P.grip=[20,y];P.ang=0;P.fl=reach-20;P.bl=24;P.magic=true;P.lean=0.22;}
    else{P.grip=[16,y+4];P.ang=0;P.fl=Math.max(50,reach-20-(t-sp.at-sp.act)*14);P.bl=24;}
    P.hb=null;P.flame=null;}
  if(st==='super'){if(t<SUPER.startup){P.grip=[-4,-30];P.ang=2.8;P.fl=40;P.bl=40;}else{P.grip=[30,-40];P.ang=0.05;P.fl=64;P.bl=26;}}
  if(st==='hurt'||st==='grabbed'){P.grip=[6,-30];P.ang=0.9;P.fl=40;P.bl=34;}
  if(st==='win'){P.grip=[0,-72];P.ang=0;P.fl=40;P.bl=40;}
  return P;
}
function hiDrawKaze(g,f,fr,skin){
  const r=KZ[skin]||KZ.kaze0;const flash=f.flash>0&&f.flash%2===0;const col=k=>flash?'#FFFFFF':(r[k]||k);
  if(f.st==='ko'&&!f.air){
    hiLimb(g,[-4,-6],[-30,-4],10,9,col('f1'));hiLimb(g,[-2,-8],[-20,-10],12,11,col('pant'));hiPoly(g,[[-4,-14],[18,-14],[20,0],[-6,0]],col('vest'));hiPoly(g,[[2,-14],[10,-14],[10,0],[2,0]],col('f0'));
    hiPoly(g,[[18,-16],[32,-16],[34,-2],[18,-2]],col('f1'));hiPoly(g,[[22,-13],[32,-13],[32,-5],[22,-5]],col('face'));g.fillStyle=col('gold');g.fillRect(18,-17,15,2);
    g.fillStyle=col('f2');g.fillRect(26,-10,2,1);g.fillRect(29,-10,2,1);
    for(let i=0;i<30;i++){const x=-30+i,y=-2+Math.round(Math.sin(i*0.3)*2);g.fillStyle=col(i>26?'f0':'f1');g.fillRect(x-30,y,2,2);}
    for(let i=0;i<50;i++){g.fillStyle=col(i<4||i>45?'gold':'staff');g.fillRect(-40+i,1,1,2);}return;}
  const P=kazePose(f,fr);const L=P.lean;
  const rot=(p)=>{const dx=p[0]-P.hip[0],dy=p[1]-P.hip[1];return[P.hip[0]+dx*Math.cos(L)-dy*Math.sin(L),P.hip[1]+dx*Math.sin(L)+dy*Math.cos(L)];};
  const T=(x,y)=>rot([P.hip[0]+x,P.hip[1]+y]);
  const neck=T(0,-28),shB=T(-8,-25),shF=T(9,-25);const hipB=[P.hip[0]-6,P.hip[1]],hipF=[P.hip[0]+6,P.hip[1]];
  // tail: falls behind, then curls up at the tip
  const sw=Math.sin(fr*0.12);let tx=P.hip[0]-10,ty=P.hip[1]-2,ta=Math.PI-0.15;
  for(let i=0;i<22;i++){ta+=(i<8?0.02:i<16?0.12:0.3)+sw*0.012;const nx=tx+Math.cos(ta)*2.4,ny=ty-Math.sin(ta)*2.4;
    hiLimb(g,[tx,ty],[nx,ny],i<16?4:3,i<16?4:3,col(i>17?'f0':'f1'));tx=nx;ty=ny;}
  // back leg: fur shin, pants, bare foot
  hiLimb(g,hipB,P.kb,12,11,col('pantD'));hiLimb(g,P.kb,[P.fb[0],P.fb[1]-3],8,8,col('f2'));
  hiPoly(g,[[P.fb[0]-6,P.fb[1]-4],[P.fb[0]+7,P.fb[1]-4],[P.fb[0]+8,P.fb[1]],[P.fb[0]-6,P.fb[1]]],col('faceD'));
  // back arm
  const hb=P.hb||[P.grip[0]-4,P.grip[1]+2];const eB=hiElbow(shB,hb,11,true);hiLimb(g,shB,eB,7,6,col('f2'));hiLimb(g,eB,hb,6,5,col('f2'));
  g.fillStyle=col('vestD');g.fillRect(Math.round(eB[0]+(hb[0]-eB[0])*0.6)-2,Math.round(eB[1]+(hb[1]-eB[1])*0.6)-2,5,4);
  // front leg
  hiLimb(g,hipF,P.kf,13,12,col('pant'),col('pantD'));hiLimb(g,P.kf,[P.ff[0],P.ff[1]-3],9,8,col('f1'),col('f2'));
  g.fillStyle=col('gold');g.fillRect(Math.round(P.kf[0]-4),Math.round(P.kf[1]-1),8,3);
  hiPoly(g,[[P.ff[0]-6,P.ff[1]-4],[P.ff[0]+8,P.ff[1]-4],[P.ff[0]+10,P.ff[1]],[P.ff[0]-6,P.ff[1]]],col('face'));g.fillStyle=col('faceD');for(const k of [2,5,8])g.fillRect(Math.round(P.ff[0]+k),Math.round(P.ff[1]-2),1,2);
  // torso: fur chest, red lamellar vest, gold belt, scarf
  hiPoly(g,[T(-12,-28),T(12,-28),T(13,-4),T(-13,-4)],col('f1'));
  hiPoly(g,[T(-12,-28),T(-2,-28),T(-3,-4),T(-13,-4)],col('vest'));hiPoly(g,[T(4,-28),T(12,-28),T(13,-4),T(5,-4)],col('vestD'));
  hiPoly(g,[T(-2,-26),T(4,-26),T(5,-8),T(-3,-8)],col('f0'));
  for(let row=0;row<4;row++){const a=T(-12,-24+row*5),b=T(-3,-24+row*5);g.fillStyle=col('vestD');for(let i=0;i<=9;i++){const q=i/9;g.fillRect(Math.round(a[0]+(b[0]-a[0])*q),Math.round(a[1]+(b[1]-a[1])*q),1,1);}}
  hiPoly(g,[T(-14,-5),T(14,-5),T(14,0),T(-14,0)],col('goldD'));hiPoly(g,[T(-14,-5),T(14,-5),T(14,-3),T(-14,-3)],col('gold'));
  const sc=T(-6,-28);const sflap=Math.sin(fr*0.2)*3;hiPoly(g,[T(-10,-30),T(10,-30),T(8,-25),T(-8,-25)],col('scarf'));hiPoly(g,[[sc[0],sc[1]],[sc[0]-16,sc[1]+4+sflap],[sc[0]-14,sc[1]+8+sflap],[sc[0]+2,sc[1]+4]],col('scarfD'));
  // shoulder pads
  hiPoly(g,[[shB[0]-7,shB[1]-3],[shB[0]+3,shB[1]-3],[shB[0]+3,shB[1]+6],[shB[0]-7,shB[1]+5]],col('goldD'));
  // head: fur, heart-shaped face, ears, circlet
  const H=(x,y)=>[neck[0]+x,neck[1]+y+4];const E=(x,y,w,hh,k)=>{const p=H(x,y);g.fillStyle=col(k);g.fillRect(Math.round(p[0]),Math.round(p[1]),w,hh);};
  hiPoly(g,[H(-10,-20),H(8,-22),H(12,-12),H(10,-2),H(-8,-2),H(-11,-10)],col('f1'));hiPoly(g,[H(-9,-19),H(-4,-21),H(-6,-6),H(-10,-8)],col('f2'));
  E(-13,-14,4,6,'f1');E(-12,-13,2,4,'faceD');E(-3,-26,4,5,'f0');E(0,-28,3,4,'f1');
  hiPoly(g,[H(-2,-15),H(4,-16),H(9,-14),H(11,-8),H(8,-3),H(0,-3),H(-3,-8)],col('face'));
  E(1,-12,3,2,'eye');E(6,-12,3,2,'eye');E(1,-12,1,1,'#1A0506');E(6,-12,1,1,'#1A0506');E(0,-14,4,1,'f2');E(5,-14,4,1,'f2');
  E(8,-9,2,2,'faceD');E(3,-6,6,1,'#5A2A1A');E(7,-6,1,2,'#FFFFFF');
  E(-10,-18,21,3,'gold');E(-10,-18,21,1,'#FFF2B0');E(2,-21,3,3,'gold');E(-11,-17,2,2,'goldD');const tl=H(-11,-16);
  hiPoly(g,[[tl[0],tl[1]],[tl[0]-10,tl[1]+6+sflap*0.5],[tl[0]-8,tl[1]+8+sflap*0.5],[tl[0]+1,tl[1]+2]],col('goldD'));
  // staff (both ends, magic extension glows)
  {const ca=Math.cos(P.ang),sa=Math.sin(P.ang),gp=P.grip;const glow=P.magic;
    for(let i=-P.bl;i<P.fl;i++){const x=Math.round(gp[0]+ca*i),y=Math.round(gp[1]+sa*i);const end=i<-P.bl+5||i>P.fl-6;
      g.fillStyle=col(end?'gold':'staff');g.fillRect(x,y,3,3);g.fillStyle=col(end?'goldD':'staffD');g.fillRect(x+Math.round(sa),y+2,2,1);
      if(glow&&i>20&&i%3===0){g.fillStyle='rgba(255,220,120,.55)';g.fillRect(x,y-2,2,1);g.fillRect(x+1,y+4,2,1);}}
    if(glow){const tip=[gp[0]+ca*P.fl,gp[1]+sa*P.fl];g.fillStyle='rgba(255,230,140,.8)';g.fillRect(Math.round(tip[0])-2,Math.round(tip[1])-3,6,8);}
}
  // front arm to the staff
  const handF=P.hb&&P.hb[0]>P.grip[0]?P.hb:P.grip;const eF=hiElbow(shF,handF,11,true);hiLimb(g,shF,eF,8,7,col('f1'),col('f2'));hiLimb(g,eF,handF,7,6,col('f1'),col('f2'));
  g.fillStyle=col('vest');g.fillRect(Math.round(eF[0]+(handF[0]-eF[0])*0.55)-3,Math.round(eF[1]+(handF[1]-eF[1])*0.55)-2,6,4);
  g.fillStyle=col('face');g.fillRect(Math.round(handF[0]-3),Math.round(handF[1]-3),6,6);
  hiPoly(g,[[shF[0]-2,shF[1]-3],[shF[0]+8,shF[1]-3],[shF[0]+9,shF[1]+6],[shF[0]-2,shF[1]+7]],col('gold'));
}

/* ===================== SHARED RIG FOR THE REST OF THE ROSTER ===================== */
function hiKickAct(f){const c=CH[f.ch];const a=f.atk==='sweep'?c.sweep:c.kick;return f.st==='kick'&&f.t>a.s-2&&f.t<=a.s+a.a+4;}
function hiCharPose(f,fr){
  const c=CH[f.ch];const k=c.h/36;const P=hiPose(f,fr);const ka=hiKickAct(f);
  for(const key of ['hip','kb','fb','kf','ff'])if(P[key]&&!(ka&&key==='ff'))P[key]=[P[key][0]*k,P[key][1]*k];
  if(ka){const a=f.atk==='sweep'?c.sweep:c.kick;P.ff=[a.reach*GEO*1.5,f.atk==='sweep'?-4:-(a.y+a.h/2)*GEO*1.5];}
  P.k=k;P.ka=ka;return P;
}
/* hands for unarmed fighters: guard, strikes that reach the hitbox, block, win */
function hiHands(f,P){
  const c=CH[f.ch],k=P.k,st=f.st,t=f.t;let hf=[13*k,-46*k],hb=[4*k,-48*k];
  if(P.crouch){hf=[13*k,-30*k];hb=[4*k,-32*k];}
  if(st==='punch'){const a=f.atk==='cpunch'?c.cpunch:c.punch;const y=-(a.y+a.h/2)*GEO*1.5;
    if(t<=a.s){hf=[-6*k,y-6*k];}else if(t<=a.s+a.a+2){hf=[a.reach*GEO*1.5-4,y];P.strike=true;}else{hf=[16*k,y+4*k];}}
  else if(st==='block'){hf=[12*k,(P.crouch?-34:-52)*k];hb=[9*k,(P.crouch?-28:-44)*k];}
  else if(st==='throw'){hf=[30*k,-44*k];hb=[24*k,-42*k];}
  else if(st==='win'){hf=[6*k,-76*k];hb=[-10*k,-40*k];}
  else if(st==='hurt'||st==='grabbed'){hf=[10*k,-34*k];hb=[-2*k,-36*k];}
  else if(st==='super'){if(t<SUPER.startup){hf=[-8*k,-36*k];hb=[-12*k,-34*k];}else{hf=[SUPER.reach*GEO*1.5-10,-44*k];P.strike=true;}}
  return{hf,hb};
}
function hiFrame(f,fr){const P=hiCharPose(f,fr);const L=P.lean;const k=P.k;
  const rot=(p)=>{const dx=p[0]-P.hip[0],dy=p[1]-P.hip[1];return[P.hip[0]+dx*Math.cos(L)-dy*Math.sin(L),P.hip[1]+dx*Math.sin(L)+dy*Math.cos(L)];};
  const T=(x,y)=>rot([P.hip[0]+x*k,P.hip[1]+y*k]);return{P,k,T};}
const hiCol=(r,f)=>{const flash=f.flash>0&&f.flash%2===0;return key=>flash?'#FFFFFF':(r[key]||key);};
function hiRect(g,p,x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(p[0]+x),Math.round(p[1]+y),w,h);}
function hiArc(g,cx,cy,r,a0,a1,c){for(let a=a0;a<=a1;a+=0.04){g.fillStyle=c;g.fillRect(Math.round(cx+Math.cos(a)*r),Math.round(cy+Math.sin(a)*r),2,1);}}
function hiDisc(g,cx,cy,r,c,sy){sy=sy||1;g.fillStyle=c;for(let dy=-Math.round(r*sy);dy<=Math.round(r*sy);dy++){const w=Math.round(r*Math.sqrt(Math.max(0,1-(dy/(r*sy))**2)));g.fillRect(Math.round(cx-w),Math.round(cy+dy),w*2+1,1);}}
function hiLeg(g,hip,knee,foot,w1,w2,c1,c2,footC,footW){hiLimb(g,hip,knee,w1,w1-1,c1,c2);hiLimb(g,knee,[foot[0],foot[1]-3],w1-1,w2,c1,c2);
  hiPoly(g,[[foot[0]-6,foot[1]-4],[foot[0]+(footW||8),foot[1]-4],[foot[0]+(footW||8)+2,foot[1]],[foot[0]-6,foot[1]]],footC);}
function hiArm(g,sh,hand,len,w,c1,c2){const e=hiElbow(sh,hand,len,true);hiLimb(g,sh,e,w,w-1,c1,c2);hiLimb(g,e,hand,w-1,w-2,c1,c2);return e;}

/* ---------- GENBU ---------- */
const GB={g0:{sk0:'#9AD88A',sk1:'#5FA85A',sk2:'#3A7A3A',sk3:'#245A24',sh0:'#C8A050',sh1:'#8A6A2A',sh2:'#5A4418',be0:'#F4ECC0',be1:'#E0D4A0',be2:'#B8A878',beak:'#E0B040',beakD:'#A07A20',dish:'#9ADFE8',hair:'#1E3A1E',water:'#7FE7FF',sash:'#C1121F',eye:'#FFE14A'},
 g1:{sk0:'#8ABAE0',sk1:'#4A8AB8',sk2:'#2A5A80',sk3:'#163A5A',sh0:'#8A6A8A',sh1:'#5A3A5A',sh2:'#3A2238',be0:'#E8E8F0',be1:'#D8D8E0',be2:'#A8A8B8',beak:'#C0C0C8',beakD:'#8A8A94',dish:'#FFD890',hair:'#1A2A3A',water:'#9BF07A',sash:'#FFB000',eye:'#FFE14A'}};
function hiDrawGenbu(g,f,fr,skin){
  const r=GB[skin]||GB.g0;const col=hiCol(r,f);
  if(f.st==='ko'&&!f.air){hiPoly(g,[[-26,-12],[18,-12],[20,0],[-28,0]],col('sh1'));for(let x=-22;x<16;x+=8)hiPoly(g,[[x,-10],[x+6,-10],[x+7,-4],[x-1,-4]],col('sh0'));
    hiPoly(g,[[-22,-18],[14,-18],[16,-12],[-24,-12]],col('be1'));hiLimb(g,[-16,-16],[-24,-26],7,6,col('sk1'));hiLimb(g,[8,-16],[14,-26],7,6,col('sk1'));
    hiDisc(g,24,-10,8,col('sk1'));hiRect(g,[24,-10],6,-3,7,4,col('beak'));hiRect(g,[24,-10],-6,-8,10,3,col('hair'));hiRect(g,[24,-10],-4,-11,8,2,col('dish'));return;}
  const {P,k,T}=hiFrame(f,fr);const H=hiHands(f,P);const sh=T(-6,-28),sf=T(8,-28);
  // shell behind
  const sc=T(-10,-18);hiDisc(g,sc[0],sc[1],15*k,col('sh2'),1.25);hiDisc(g,sc[0]+1,sc[1],13*k,col('sh1'),1.22);
  for(const [dx,dy] of [[-4,-12],[4,-12],[-6,-2],[2,-2],[-4,8],[4,8]]){const x=sc[0]+dx*k,y=sc[1]+dy*k;hiPoly(g,[[x-4,y],[x-2,y-3],[x+2,y-3],[x+4,y],[x+2,y+3],[x-2,y+3]],col('sh0'));}
  // legs: thick, webbed feet
  const hipB=[P.hip[0]-6*k,P.hip[1]],hipF=[P.hip[0]+6*k,P.hip[1]];
  hiLeg(g,hipB,P.kb,P.fb,13,12,col('sk2'),col('sk3'),col('sk2'),10);
  hiArm(g,sh,H.hb,12*k,9,col('sk2'),col('sk3'));hiRect(g,H.hb,-3,-3,7,6,col('sk2'));
  hiLeg(g,hipF,P.kf,P.ff,14,12,col('sk1'),col('sk2'),col('sk1'),11);
  // torso with segmented belly plate and sash
  hiPoly(g,[T(-14,-30),T(14,-30),T(15,-2),T(-15,-2)],col('sk1'));hiPoly(g,[T(8,-30),T(14,-30),T(15,-2),T(9,-2)],col('sk2'));
  hiPoly(g,[T(-4,-28),T(10,-28),T(11,-4),T(-5,-4)],col('be1'));for(const y of [-22,-16,-10])hiPoly(g,[T(-4,y),T(10,y),T(10,y+1),T(-4,y+1)],col('be2'));hiPoly(g,[T(-4,-28),T(0,-28),T(-1,-4),T(-5,-4)],col('be0'));
  hiPoly(g,[T(-15,-6),T(15,-6),T(15,-1),T(-15,-1)],col('sash'));
  // head: round, beak, hair ring, dish
  const hd=T(2,-40);hiDisc(g,hd[0],hd[1],10*k,col('sk1'));hiDisc(g,hd[0]-2,hd[1]-3,5*k,col('sk0'));
  hiPoly(g,[[hd[0]+6*k,hd[1]-1],[hd[0]+15*k,hd[1]+2],[hd[0]+6*k,hd[1]+5*k]],col('beak'));hiRect(g,hd,6*k,3*k,8*k,1,col('beakD'));
  hiRect(g,hd,2*k,-4*k,3,3,col('eye'));hiRect(g,hd,3*k,-4*k,1,1,'#1A0506');
  hiPoly(g,[[hd[0]-11*k,hd[1]-6*k],[hd[0]+11*k,hd[1]-6*k],[hd[0]+10*k,hd[1]-9*k],[hd[0]-10*k,hd[1]-9*k]],col('hair'));
  hiDisc(g,hd[0],hd[1]-10*k,7*k,col('hair'),0.35);hiDisc(g,hd[0],hd[1]-11*k,6*k,col('dish'),0.3);hiRect(g,hd,-3*k,-12*k,3,1,'#FFFFFF');
  // front arm and palm strike
  hiArm(g,sf,H.hf,12*k,10,col('sk1'),col('sk2'));hiRect(g,H.hf,-4,-4,8,8,col('sk0'));hiRect(g,H.hf,3,-5,2,10,col('sk1'));
  if(P.strike){for(let i=0;i<8;i++){const a=-1+i*0.28;hiRect(g,H.hf,6+Math.cos(a)*9,Math.sin(a)*9,2,2,col('water'));}}
  // counter stance: rotating water ring
  if(f.st==='special'){const cs=CH.kappa.special;if(f.t>=cs.from&&f.t<=cs.to){const c0=T(2,-26);for(let q=0;q<6;q++){const aa=q*1.047+fr*0.12;hiDisc(g,c0[0]+Math.cos(aa)*28*k,c0[1]+Math.sin(aa)*32*k,2,col('water'));}}}
  if(f.st==='win')for(let i=0;i<6;i++)hiRect(g,hd,-1+(i%2),-14*k-i*4,2,3,col('water'));
}
/* ---------- KIRA ---------- */
const KR={k0:{f0:'#FFD890',f1:'#E8A040',f2:'#A86A20',mark:'#C1121F',robe:'#F8F0EA',robeD:'#C8C0B8',hak:'#C1121F',hakD:'#7A0A12',fire0:'#E6FFFF',fire1:'#7FE7FF',fire2:'#2E8AB0',eye:'#FFB000',tip:'#FFFFFF'},
 k1:{f0:'#FFFFFF',f1:'#F0ECE6',f2:'#B8B2A8',mark:'#9B59D0',robe:'#3A3058',robeD:'#221C38',hak:'#5A2A8A',hakD:'#34184E',fire0:'#FFFFFF',fire1:'#C49BFF',fire2:'#6B2FA0',eye:'#C49BFF',tip:'#E6DCFF'}};
function hiDrawKira(g,f,fr,skin){
  const r=KR[skin]||KR.k0;const col=hiCol(r,f);
  if(f.st==='ko'&&!f.air){hiPoly(g,[[-24,-10],[16,-10],[18,0],[-26,0]],col('robe'));hiPoly(g,[[-30,-8],[-20,-8],[-18,0],[-32,0]],col('hak'));
    hiDisc(g,24,-8,7,col('f1'));hiPoly(g,[[28,-10],[36,-7],[28,-4]],col('f1'));hiRect(g,[20,-15],0,0,3,5,col('f1'));hiRect(g,[25,-15],0,0,3,5,col('f1'));
    for(let i=0;i<3;i++)for(let j=0;j<14;j++)hiDisc(g,-36-j*1.5,-3-i*3+Math.sin(j*0.4)*2,2,col(j>11?'tip':'f1'));return;}
  const {P,k,T}=hiFrame(f,fr);const H=hiHands(f,P);const sh=T(-7,-29),sf=T(8,-29);
  // three fluffy tails
  const hp=T(-10,-6);const sw=Math.sin(fr*0.12)*3;
  for(let tl=2;tl>=0;tl--){for(let i=0;i<16;i++){const q=i/16;const x=hp[0]-q*22*k-tl*3,y=hp[1]-q*(10+tl*8)*k+Math.sin(q*3)*3+sw*q;hiDisc(g,x,y,Math.max(2,Math.round((2+4*Math.sin(q*3.1))*k)),col(q>0.8?'tip':tl===1?'f1':'f2'));}}
  // legs in hakama
  const hipB=[P.hip[0]-6*k,P.hip[1]],hipF=[P.hip[0]+6*k,P.hip[1]];
  hiLeg(g,hipB,P.kb,P.fb,14,15,col('hakD'),null,col('f2'),7);
  hiArm(g,sh,H.hb,12*k,8,col('robeD'));hiRect(g,H.hb,-2,-2,5,5,col('f2'));
  hiPoly(g,[T(-15,-6),T(15,-6),[P.hip[0]+16*k,P.hip[1]+6],[P.hip[0]-16*k,P.hip[1]+6]],col('hak'));
  hiLeg(g,hipF,P.kf,P.ff,15,16,col('hak'),col('hakD'),col('f1'),8);
  // robe torso with red collar
  hiPoly(g,[T(-12,-30),T(12,-30),T(14,-4),T(-14,-4)],col('robe'));hiPoly(g,[T(6,-30),T(12,-30),T(14,-4),T(8,-4)],col('robeD'));
  hiPoly(g,[T(-5,-30),T(-1,-30),T(3,-18),T(1,-18)],col('hak'));hiPoly(g,[T(5,-30),T(9,-30),T(3,-18),T(1,-18)],col('hak'));
  hiPoly(g,[T(-14,-7),T(14,-7),T(14,-3),T(-14,-3)],col('hakD'));
  // fox head
  const hd=T(3,-40);hiDisc(g,hd[0],hd[1],8*k,col('f1'));hiPoly(g,[[hd[0]+4*k,hd[1]-3*k],[hd[0]+15*k,hd[1]+1*k],[hd[0]+14*k,hd[1]+4*k],[hd[0]+4*k,hd[1]+5*k]],col('f1'));
  hiPoly(g,[[hd[0]+4*k,hd[1]+1*k],[hd[0]+14*k,hd[1]+3*k],[hd[0]+4*k,hd[1]+6*k]],col('f0'));hiRect(g,hd,14*k,0,2,2,'#1A0506');
  hiPoly(g,[[hd[0]-6*k,hd[1]-5*k],[hd[0]-4*k,hd[1]-16*k],[hd[0]+1*k,hd[1]-6*k]],col('f1'));hiPoly(g,[[hd[0]-4*k,hd[1]-6*k],[hd[0]-4*k,hd[1]-13*k],[hd[0]-1*k,hd[1]-6*k]],col('mark'));
  hiPoly(g,[[hd[0]+1*k,hd[1]-6*k],[hd[0]+5*k,hd[1]-16*k],[hd[0]+7*k,hd[1]-5*k]],col('f1'));hiPoly(g,[[hd[0]+3*k,hd[1]-6*k],[hd[0]+5*k,hd[1]-12*k],[hd[0]+6*k,hd[1]-6*k]],col('mark'));
  hiRect(g,hd,3*k,-3*k,4,2,col('eye'));hiRect(g,hd,5*k,-3*k,1,2,'#1A0506');hiRect(g,hd,2*k,-5*k,6,1,col('mark'));hiRect(g,hd,-2*k,2*k,4,1,col('mark'));
  // front arm with wide sleeve and claws
  const e=hiArm(g,sf,H.hf,12*k,9,col('robe'),col('robeD'));hiPoly(g,[[e[0]-5,e[1]],[e[0]+5,e[1]],[e[0]+3,e[1]+9],[e[0]-3,e[1]+8]],col('robeD'));
  hiRect(g,H.hf,-3,-3,6,6,col('f1'));for(const dy of [-3,0,3])hiRect(g,H.hf,3,dy,4,1,col('tip'));
  const ff=Math.floor(fr/4)%2;
  if(P.strike){const c0=T(8,-30);const R=Math.hypot(H.hf[0]-c0[0],H.hf[1]-c0[1]);for(let a=-0.9;a<=0.3;a+=0.015){g.fillStyle=col(a>0?'fire0':'fire1');g.fillRect(Math.round(c0[0]+Math.cos(a)*R),Math.round(c0[1]+Math.sin(a)*R),2,2);}}
  else if(f.st==='special'){for(const s of [-1,1]){const o=T(s*16,-40);hiDisc(g,o[0],o[1],3+ff,col('fire1'));hiDisc(g,o[0],o[1]-1,2,col('fire0'));}}
  else if(f.st==='win'){hiDisc(g,H.hf[0],H.hf[1]-8,4+ff,col('fire1'));hiDisc(g,H.hf[0],H.hf[1]-9,2,col('fire0'));}
  else{hiDisc(g,H.hf[0]+6,H.hf[1]-6,2+ff,col('fire1'));}
}
/* ---------- HAYATE ---------- */
const HY={h0:{fe0:'#5A5A76',fe1:'#2A2A38',fe2:'#16161E',robe:'#EDE8DC',robeD:'#B8B0A0',pom:'#C1121F',beak:'#F0B030',beakD:'#A87010',leaf:'#4E9A4A',leafD:'#2E6A2A',eye:'#FFE14A',leg:'#2A2A38'},
 h1:{fe0:'#FFFFFF',fe1:'#D8D8E0',fe2:'#9A9AA8',robe:'#2A2A36',robeD:'#18181F',pom:'#2EC4B6',beak:'#E08A30',beakD:'#A05A10',leaf:'#8A3A8A',leafD:'#5A1A5A',eye:'#FF5A6A',leg:'#3A3A46'}};
function hiDrawHayate(g,f,fr,skin){
  const r=HY[skin]||HY.h0;const col=hiCol(r,f);
  if(f.st==='ko'&&!f.air){hiPoly(g,[[-22,-10],[14,-10],[16,0],[-24,0]],col('robe'));hiPoly(g,[[-40,-8],[-18,-12],[-16,-2],[-38,0]],col('fe1'));
    hiDisc(g,22,-8,7,col('fe1'));hiPoly(g,[[28,-9],[40,-7],[28,-5]],col('beak'));hiRect(g,[20,-8],0,0,2,2,col('eye'));return;}
  const {P,k,T}=hiFrame(f,fr);const H=hiHands(f,P);const sh=T(-7,-29),sf=T(8,-29);
  const spread=f.air||f.st==='win'||f.st==='special';const flap=Math.floor(fr/5)%2;
  // wings
  const wb=T(-6,-28);
  if(spread){for(let i=0;i<7;i++){const a=-2.3+i*0.22+(flap?0.08:0);const L=(34-i*2.5)*k;hiLimb(g,wb,[wb[0]+Math.cos(a)*L,wb[1]+Math.sin(a)*L],6,2,col(i%2?'fe1':'fe2'));}
    for(let i=0;i<5;i++){const a=-2.1+i*0.25;const L=(24-i*2)*k;hiLimb(g,wb,[wb[0]+Math.cos(a)*L,wb[1]+Math.sin(a)*L],4,2,col('fe0'));}}
  else{hiPoly(g,[[wb[0]-4,wb[1]-2],[wb[0]+4,wb[1]-2],[wb[0]-2,wb[1]+26*k],[wb[0]-10,wb[1]+22*k]],col('fe2'));hiPoly(g,[[wb[0]-3,wb[1]],[wb[0]+1,wb[1]],[wb[0]-4,wb[1]+22*k],[wb[0]-8,wb[1]+18*k]],col('fe1'));}
  // legs with talons
  const hipB=[P.hip[0]-5*k,P.hip[1]],hipF=[P.hip[0]+5*k,P.hip[1]];
  hiLeg(g,hipB,P.kb,P.fb,9,7,col('leg'),null,col('beakD'),9);
  hiArm(g,sh,H.hb,12*k,8,col('fe1'));hiRect(g,H.hb,-2,-2,5,5,col('fe2'));
  hiLeg(g,hipF,P.kf,P.ff,10,8,col('fe1'),col('fe2'),col('beak'),10);for(const d of [2,6,10])hiRect(g,P.ff,d,-1,1,2,col('beakD'));
  // yamabushi robe with pompoms
  hiPoly(g,[T(-13,-30),T(13,-30),T(15,-2),T(-15,-2)],col('robe'));hiPoly(g,[T(7,-30),T(13,-30),T(15,-2),T(9,-2)],col('robeD'));
  for(const [x,y] of [[-2,-26],[2,-20],[-2,-14]]){const p=T(x,y);hiDisc(g,p[0],p[1],2,col('pom'));}
  hiPoly(g,[T(-15,-6),T(15,-6),T(15,-3),T(-15,-3)],col('robeD'));
  // crow head with beak and tokin cap
  const hd=T(2,-40);hiDisc(g,hd[0],hd[1],8*k,col('fe1'));hiDisc(g,hd[0]-2,hd[1]-3,4*k,col('fe0'));
  hiPoly(g,[[hd[0]+5*k,hd[1]-2*k],[hd[0]+20*k,hd[1]+1*k],[hd[0]+17*k,hd[1]+3*k],[hd[0]+5*k,hd[1]+4*k]],col('beak'));hiPoly(g,[[hd[0]+5*k,hd[1]+2*k],[hd[0]+17*k,hd[1]+3*k],[hd[0]+5*k,hd[1]+4*k]],col('beakD'));
  hiRect(g,hd,2*k,-3*k,3,3,col('eye'));hiRect(g,hd,3*k,-3*k,1,1,'#1A0506');hiRect(g,hd,-3*k,-11*k,7,4,col('fe2'));
  // leaf fan in the front hand
  hiArm(g,sf,H.hf,12*k,9,col('fe1'),col('fe2'));hiRect(g,H.hf,-3,-3,6,6,col('fe2'));
  const lf=[H.hf[0]+(P.strike?4:2),H.hf[1]-(P.strike?2:10)];hiPoly(g,[[lf[0],lf[1]-12],[lf[0]+7,lf[1]-4],[lf[0]+5,lf[1]+6],[lf[0]-2,lf[1]+4],[lf[0]-5,lf[1]-6]],col('leaf'));
  hiPoly(g,[[lf[0],lf[1]-10],[lf[0]+1,lf[1]-10],[lf[0]+1,lf[1]+4],[lf[0],lf[1]+4]],col('leafD'));
  if(P.strike)for(let i=0;i<3;i++){g.fillStyle='rgba(255,255,255,.6)';g.fillRect(Math.round(sf[0]+6),Math.round(lf[1]-8+i*6),Math.round(lf[0]-sf[0]-8),1);}
  if(f.st==='special'&&f.t>CH.tengu.special.at)for(let i=0;i<2;i++){g.fillStyle='rgba(255,255,255,.5)';g.fillRect(Math.round(wb[0]-40-i*6),Math.round(wb[1]-10+i*7),24,1);}
}
/* ---------- SEIRYU ---------- */
const SR={s0:{b0:'#8BE8A6',b1:'#2E9E4F',b2:'#1B6B33',b3:'#0E4A22',be0:'#F4EAC0',be1:'#E0D0A0',be2:'#B8A878',mane:'#D02030',maneD:'#7A0A12',horn:'#FFC93A',hornD:'#C88A00',claw:'#F3E9E4',eye:'#FFE14A'},
 s1:{b0:'#8FE0D8',b1:'#1F7F78',b2:'#135650',b3:'#0A3430',be0:'#E8DCF4',be1:'#D0C0E0',be2:'#A898B8',mane:'#7A3AC0',maneD:'#3E1560',horn:'#DDE3EE',hornD:'#9AA4B4',claw:'#FFFFFF',eye:'#C49BFF'}};
function hiDrawSeiryu(g,f,fr,skin){
  const r=SR[skin]||SR.s0;const col=hiCol(r,f);
  if(f.st==='ko'&&!f.air){for(let i=0;i<30;i++)hiDisc(g,-10-i*1.6,-4+Math.sin(i*0.3)*2,Math.max(2,6-i*0.18),col('b1'));
    hiPoly(g,[[-14,-14],[18,-14],[20,0],[-16,0]],col('b1'));hiPoly(g,[[-10,-8],[14,-8],[16,0],[-12,0]],col('be1'));
    hiPoly(g,[[18,-14],[40,-10],[40,-4],[18,-2]],col('b1'));hiRect(g,[22,-18],0,0,3,6,col('horn'));hiRect(g,[28,-18],0,0,3,6,col('horn'));hiRect(g,[16,-16],0,0,6,10,col('mane'));return;}
  const {P,k,T}=hiFrame(f,fr);const H=hiHands(f,P);const sh=T(-7,-29),sf=T(8,-29);
  // long tail
  let tx=P.hip[0]-10*k,ty=P.hip[1]+2,ta=Math.PI+0.2;const sw=Math.sin(fr*0.1)*0.02;
  for(let i=0;i<26;i++){ta+=(i<14?-0.025:0.06)+sw;const nx=tx+Math.cos(ta)*2.6,ny=ty-Math.sin(ta)*2.6;const w=Math.max(3,Math.round(11-i*0.33));hiLimb(g,[tx,ty],[nx,ny],w,Math.max(3,w-1),col('b1'),col('b2'));if(i%5===2)hiRect(g,[nx,ny],-1,-w/2-2,3,3,col('mane'));tx=nx;ty=ny;}
  // legs: thick scaled, clawed feet
  const hipB=[P.hip[0]-7*k,P.hip[1]],hipF=[P.hip[0]+7*k,P.hip[1]];
  hiLeg(g,hipB,P.kb,P.fb,15,12,col('b2'),col('b3'),col('b2'),10);
  hiArm(g,sh,H.hb,13*k,10,col('b2'),col('b3'));hiRect(g,H.hb,-3,-3,7,6,col('b2'));
  hiLeg(g,hipF,P.kf,P.ff,16,13,col('b1'),col('b2'),col('b1'),12);for(const d of [3,7,11])hiRect(g,P.ff,d,-2,2,3,col('claw'));
  // torso with belly plates
  hiPoly(g,[T(-15,-30),T(15,-30),T(16,-2),T(-16,-2)],col('b1'));hiPoly(g,[T(9,-30),T(15,-30),T(16,-2),T(10,-2)],col('b2'));
  hiPoly(g,[T(-4,-28),T(11,-28),T(12,-3),T(-5,-3)],col('be1'));for(const y of [-23,-18,-13,-8])hiPoly(g,[T(-4,y),T(11,y),T(11,y+1),T(-4,y+1)],col('be2'));
  for(let i=0;i<14;i++){const p=T(-14+(i%4)*5,-28+Math.floor(i/4)*7);hiRect(g,p,0,0,2,1,col('b0'));}
  // head: snout, horns, whiskers, mane
  const hd=T(3,-40);const open=f.st==='special'&&f.t>=CH.ryu.special.at-2;
  for(let i=0;i<6;i++){hiPoly(g,[[hd[0]-4-i*3,hd[1]-6+i*3],[hd[0]-12-i*3,hd[1]-2+i*4],[hd[0]-6-i*3,hd[1]+4+i*3]],col(i%2?'mane':'maneD'));}
  hiDisc(g,hd[0],hd[1],9*k,col('b1'));hiDisc(g,hd[0]-2,hd[1]-3,4*k,col('b0'));
  hiPoly(g,[[hd[0]+5*k,hd[1]-5*k],[hd[0]+20*k,hd[1]-2*k],[hd[0]+20*k,hd[1]+(open?0:3)*k],[hd[0]+5*k,hd[1]+2*k]],col('b1'));
  hiPoly(g,[[hd[0]+5*k,hd[1]+(open?5:3)*k],[hd[0]+19*k,hd[1]+(open?8:4)*k],[hd[0]+5*k,hd[1]+7*k]],col('be1'));
  if(open){hiPoly(g,[[hd[0]+6*k,hd[1]+1*k],[hd[0]+20*k,hd[1]+1*k],[hd[0]+20*k,hd[1]+6*k],[hd[0]+6*k,hd[1]+4*k]],'#FF6A00');hiRect(g,hd,16*k,2*k,4,3,'#FFF2A8');}
  hiRect(g,hd,17*k,-3*k,2,2,'#1A0506');hiRect(g,hd,3*k,-5*k,4,3,col('eye'));hiRect(g,hd,5*k,-5*k,1,3,'#1A0506');
  hiPoly(g,[[hd[0]-2*k,hd[1]-7*k],[hd[0]-8*k,hd[1]-20*k],[hd[0]-4*k,hd[1]-18*k],[hd[0]+1*k,hd[1]-8*k]],col('horn'));
  hiPoly(g,[[hd[0]+3*k,hd[1]-8*k],[hd[0]+1*k,hd[1]-21*k],[hd[0]+4*k,hd[1]-19*k],[hd[0]+6*k,hd[1]-8*k]],col('hornD'));
  for(let i=0;i<8;i++){hiRect(g,hd,20*k+i,1*k+Math.round(Math.sin(i*0.8+fr*0.2)*2),1,1,col('mane'));}
  // front arm with claws
  hiArm(g,sf,H.hf,13*k,11,col('b1'),col('b2'));hiRect(g,H.hf,-4,-4,8,8,col('b1'));for(const dy of [-4,0,4])hiRect(g,H.hf,4,dy,4,2,col('claw'));
  if(P.strike){const c0=T(8,-30);const R=Math.hypot(H.hf[0]-c0[0],H.hf[1]-c0[1]);for(let a=-0.8;a<=0.35;a+=0.015){g.fillStyle='rgba(255,255,255,.8)';g.fillRect(Math.round(c0[0]+Math.cos(a)*R),Math.round(c0[1]+Math.sin(a)*R),2,2);}}
}
/* ---------- KAGE ---------- */
const KG={q0:{r0:'#FFFFFF',r1:'#E8E8F0',r2:'#A8A8C0',r3:'#707090',hair:'#0A0A12',hairL:'#2A2A3A',skin:'#D8E0E8',aura:'#9B59D0',eye:'#FF3B30',nail:'#F3E9E4',obi:'#5A3A7A'},
 q1:{r0:'#E8F8FF',r1:'#B8D8E8',r2:'#7898A8',r3:'#4A6878',hair:'#101820',hairL:'#2A3848',skin:'#C8E0E8',aura:'#2EC4B6',eye:'#FFB000',nail:'#E8F8FF',obi:'#1E5A5A'}};
function hiDrawKage(g,f,fr,skin){
  const r=KG[skin]||KG.q0;const col=hiCol(r,f);
  if(f.st==='ko'&&!f.air){hiPoly(g,[[-26,-8],[18,-8],[22,0],[-30,0]],col('r1'));hiPoly(g,[[-26,-3],[18,-3],[22,0],[-30,0]],col('r2'));
    hiPoly(g,[[14,-10],[34,-8],[40,-2],[14,-2]],col('hair'));hiDisc(g,16,-8,5,col('skin'));return;}
  const {P,k,T}=hiFrame(f,fr);const H=hiHands(f,P);const hov=-4-Math.round(Math.sin(fr*0.08)*2);
  const TT=(x,y)=>{const p=T(x,y);return[p[0],p[1]+hov];};const sh=TT(-7,-29),sf=TT(8,-29);
  // long hair behind
  const hb0=TT(-6,-48);hiPoly(g,[[hb0[0]-6,hb0[1]],[hb0[0]+6,hb0[1]],[hb0[0]+2,hb0[1]+44*k],[hb0[0]-10,hb0[1]+42*k]],col('hair'));
  // kimono: widening skirt with a ragged hem, no feet
  const top=TT(0,-30);const bot=P.hip[1]+hov+4;const H2=bot-top[1];
  for(let y=0;y<H2;y++){const q=y/H2;const w=Math.round((10+q*9)*k);const cx=top[0]+(P.lean*y*0.5);g.fillStyle=col('r1');g.fillRect(Math.round(cx-w),Math.round(top[1]+y),w*2,1);g.fillStyle=col('r2');g.fillRect(Math.round(cx+w-3*k),Math.round(top[1]+y),Math.round(3*k),1);}
  for(let x=-19;x<=19;x+=2){const len=4+((x*7+(fr>>3))%5+5)%5;g.fillStyle=col('r2');g.fillRect(Math.round(top[0]+x*k),Math.round(bot),2,len);}
  hiPoly(g,[TT(-11,-18),TT(11,-18),TT(11,-14),TT(-11,-14)],col('obi'));
  hiPoly(g,[TT(-4,-30),TT(0,-30),TT(4,-20),TT(1,-20)],col('r2'));
  // back sleeve and hand
  hiArm(g,sh,[H.hb[0],H.hb[1]+hov],12*k,10,col('r2'));hiRect(g,[H.hb[0],H.hb[1]+hov],-2,-2,4,5,col('skin'));
  // head: pale face hidden by hair, one red eye
  const hd=TT(2,-40);hiDisc(g,hd[0],hd[1],8*k,col('skin'));hiDisc(g,hd[0]-1,hd[1]-3,9*k,col('hair'),0.7);
  for(const x of [-3,0,3,6])hiRect(g,hd,x*k,-4*k,2,Math.round((12+Math.abs(x))*k),col('hair'));
  if(f.st!=='hurt')hiRect(g,hd,2*k,-1*k,2,2,col('eye'));
  // front arm: long sleeve, long nails
  const hf=[H.hf[0],H.hf[1]+hov];const e=hiArm(g,sf,hf,13*k,11,col('r1'),col('r2'));hiPoly(g,[[e[0]-6,e[1]],[e[0]+6,e[1]],[e[0]+4,e[1]+12],[e[0]-4,e[1]+10]],col('r2'));
  hiRect(g,hf,-2,-3,5,6,col('skin'));for(const dy of [-3,0,3])hiRect(g,hf,3,dy,5,1,col('nail'));
  if(P.ka){const a=f.atk==='sweep'?CH.onryo.sweep:CH.onryo.kick;const y=(f.atk==='sweep'?-4:-(a.y+a.h/2)*GEO*1.5)+hov;const x1=a.reach*GEO*1.5;
    for(let i=0;i<5;i++){g.fillStyle=col(i%2?'hair':'hairL');g.fillRect(Math.round(hb0[0]),Math.round(y-2+i),Math.round(x1-hb0[0]),1);}hiDisc(g,x1,y,4,col('hair'));}
}
/* ---------- ENMA ---------- */
const EM={e0:{r0:'#E03030',r1:'#B3161F',r2:'#7A0A12',r3:'#4A060B',inner:'#F3E9E4',sk0:'#FF6A5A',sk1:'#D7262E',sk2:'#8E1015',beard:'#121218',beardL:'#2A2A34',crown:'#16161C',gold:'#FFC93A',goldD:'#C88A00',club:'#2A2A34',clubL:'#4A4A58',stud:'#C8CCD8',hilt:'#5A3A1A',eye:'#FFE14A',boot:'#16161C'},
 e1:{r0:'#8A4AC8',r1:'#5A2A8A',r2:'#34184E',r3:'#1E0A36',inner:'#E8DCFF',sk0:'#6A9AF0',sk1:'#2F6FE0',sk2:'#173E8A',beard:'#F3E9E4',beardL:'#FFFFFF',crown:'#0A0A12',gold:'#2EC4B6',goldD:'#16746B',club:'#1A1A22',clubL:'#3A3A46',stud:'#BFFFF8',hilt:'#3A2A5A',eye:'#FFE14A',boot:'#0A0A12'}};
function hiDrawEnma(g,f,fr,skin){
  const r=EM[skin]||EM.e0;const col=hiCol(r,f);
  if(f.st==='ko'&&!f.air){hiPoly(g,[[-34,-16],[24,-16],[28,0],[-38,0]],col('r1'));hiPoly(g,[[-10,-16],[-4,-16],[-4,0],[-10,0]],col('gold'));
    hiDisc(g,34,-12,11,col('sk1'));hiPoly(g,[[38,-8],[52,-4],[48,4],[36,2]],col('beard'));hiPoly(g,[[26,-24],[40,-24],[40,-18],[26,-18]],col('crown'));
    for(let i=0;i<46;i++){g.fillStyle=col(i<10?'hilt':'club');g.fillRect(-80+i,-2,1,5);if(i>12&&i%5===0){g.fillStyle=col('stud');g.fillRect(-80+i,-3,1,1);}}return;}
  const {P,k,T}=hiFrame(f,fr);const c=CH.enma,st=f.st,t=f.t;const sh=T(-10,-29),sf=T(10,-29);
  // club pose (grip, angle, length)
  let grip=[14*k,-40*k],ang=-1.45,len=46*k;
  if(st==='punch'){const a=c.punch,reach=a.reach*GEO*1.5;if(t<=a.s){grip=[-2*k,-62*k];ang=-2.3;}else if(t<=a.s+a.a+3){grip=[22*k,-44*k];ang=0.28;len=reach-22*k;P.strike=true;}else{grip=[18*k,-32*k];ang=0.75;}}
  else if(st==='block'){grip=[16*k,-60*k];ang=1.57;len=44*k;}
  else if(st==='special'){grip=[14*k,-36*k];ang=-1.2;}
  else if(st==='win'){grip=[6*k,-78*k];ang=-1.4;}
  else if(st==='hurt'){grip=[10*k,-30*k];ang=0.9;}
  else if(st==='kick'){grip=[4*k,-44*k];ang=-1.8;}
  // legs and boots under the robe
  const hipB=[P.hip[0]-8*k,P.hip[1]],hipF=[P.hip[0]+8*k,P.hip[1]];
  hiLeg(g,hipB,P.kb,P.fb,16,14,col('r3'),null,col('boot'),12);
  // back sleeve with hand
  const hbk=st==='special'?[-18*k,-58*k]:[grip[0]-6*k,grip[1]+6*k];hiArm(g,sh,hbk,15*k,14,col('r2'),col('r3'));hiRect(g,hbk,-4,-4,8,8,col('sk2'));
  if(st==='special'){const rr=3+Math.min(6,Math.floor(t/2));hiDisc(g,hbk[0],hbk[1]-10,rr+2,'#C1121F');hiDisc(g,hbk[0],hbk[1]-10,rr,'#FF6A00');hiDisc(g,hbk[0],hbk[1]-11,Math.max(1,rr-3),'#FFE08A');}
  hiLeg(g,hipF,P.kf,P.ff,17,15,col('r2'),col('r3'),col('boot'),13);
  // wide robe torso
  hiPoly(g,[T(-18,-32),T(18,-32),T(22,-2),T(-22,-2)],col('r1'));hiPoly(g,[T(10,-32),T(18,-32),T(22,-2),T(13,-2)],col('r2'));hiPoly(g,[T(-18,-32),T(-12,-32),T(-15,-2),T(-22,-2)],col('r0'));
  hiPoly(g,[T(-5,-32),T(5,-32),T(2,-20),T(-2,-20)],col('inner'));
  hiPoly(g,[T(-22,-12),T(22,-12),T(22,-6),T(-22,-6)],col('gold'));hiPoly(g,[T(-22,-8),T(22,-8),T(22,-6),T(-22,-6)],col('goldD'));hiPoly(g,[T(-3,-12),T(3,-12),T(3,0),T(-3,0)],col('gold'));
  // head: red face, brows, beard, judge crown
  const hd=T(2,-42);hiDisc(g,hd[0],hd[1],10*k,col('sk1'));hiDisc(g,hd[0]-3,hd[1]-4,5*k,col('sk0'));
  hiRect(g,hd,-6*k,-5*k,5,2,col('beard'));hiRect(g,hd,3*k,-5*k,5,2,col('beard'));hiRect(g,hd,-4*k,-3*k,3,2,col('eye'));hiRect(g,hd,4*k,-3*k,3,2,col('eye'));
  hiPoly(g,[[hd[0]-11*k,hd[1]+1*k],[hd[0]+11*k,hd[1]+1*k],[hd[0]+8*k,hd[1]+14*k],[hd[0],hd[1]+18*k],[hd[0]-8*k,hd[1]+14*k]],col('beard'));
  for(let i=-3;i<=3;i++)hiRect(g,hd,i*3*k,6*k,1,Math.round(8*k),col('beardL'));hiRect(g,hd,-3*k,2*k,7*k,2,'#2A0505');hiRect(g,hd,-2*k,2*k,1,2,'#FFFFFF');hiRect(g,hd,3*k,2*k,1,2,'#FFFFFF');
  hiPoly(g,[[hd[0]-9*k,hd[1]-9*k],[hd[0]+9*k,hd[1]-9*k],[hd[0]+8*k,hd[1]-22*k],[hd[0]-8*k,hd[1]-22*k]],col('crown'));
  hiPoly(g,[[hd[0]-12*k,hd[1]-9*k],[hd[0]+12*k,hd[1]-9*k],[hd[0]+12*k,hd[1]-11*k],[hd[0]-12*k,hd[1]-11*k]],col('crown'));
  hiRect(g,hd,-4*k,-20*k,Math.round(8*k),Math.round(8*k),col('gold'));hiRect(g,hd,-3*k,-18*k,Math.round(6*k),1,col('crown'));hiRect(g,hd,-3*k,-15*k,Math.round(6*k),1,col('crown'));hiRect(g,hd,0,-19*k,1,Math.round(7*k),col('crown'));
  // iron club (kanabo)
  const ca=Math.cos(ang),sa=Math.sin(ang);for(let i=-10;i<len;i++){const x=grip[0]+ca*i,y=grip[1]+sa*i;const th=i<6?3:Math.round(4+Math.min(3,i/12));g.fillStyle=col(i<6?'hilt':'club');g.fillRect(Math.round(x-th/2),Math.round(y-th/2),th,th);
    if(i>8&&i%5===0){g.fillStyle=col('stud');g.fillRect(Math.round(x-sa*th/2),Math.round(y+ca*th/2),1,1);g.fillRect(Math.round(x+sa*th/2),Math.round(y-ca*th/2),1,1);}}
  if(P.strike){const c0=T(4,-40);const R=len+22*k;for(let a=-1.0;a<=0.4;a+=0.015){g.fillStyle='rgba(255,255,255,.8)';g.fillRect(Math.round(c0[0]+Math.cos(a)*R),Math.round(c0[1]+Math.sin(a)*R),2,2);}}
  // front sleeve and hand on the club
  hiArm(g,sf,grip,15*k,15,col('r1'),col('r2'));hiRect(g,grip,-4,-4,8,8,col('sk1'));
}
function hiDrawAny(g,f,fr,side){
  switch(f.ch){case 'saru':return hiDrawKaze(g,f,fr,side?'kaze1':'kaze0');case 'kappa':return hiDrawGenbu(g,f,fr,side?'g1':'g0');case 'kitsune':return hiDrawKira(g,f,fr,side?'k1':'k0');
    case 'tengu':return hiDrawHayate(g,f,fr,side?'h1':'h0');case 'ryu':return hiDrawSeiryu(g,f,fr,side?'s1':'s0');case 'onryo':return hiDrawKage(g,f,fr,side?'q1':'q0');case 'enma':return hiDrawEnma(g,f,fr,side?'e1':'e0');}
}


/* ===== device-resolution polygons for HD drawing ===== */
const hiPolyLow=hiPoly;
hiPoly=function(g,pts,c){const t=g.getTransform();if(Math.abs(t.a)<1.5)return hiPolyLow(g,pts,c);g.save();g.setTransform(1,0,0,1,0,0);
  hiPolyLow(g,pts.map(p=>[p[0]*t.a+p[1]*t.c+t.e,p[0]*t.b+p[1]*t.d+t.f]),c);g.restore();};

/* ===== ONI in HD: same rig and poses, redrawn with more detail at double resolution ===== */
const HDPAL={
 genesis:{m:['#0A0406','#1E0C10','#3A1A20','#5A2A30','#7A3A40'],ar:['#060406','#100A0C','#1C1216','#2C1C20','#4A2A30'],cord:['#5A0A10','#C1121F','#FF4A3A'],hk:['#060406','#0E080A','#18101A','#2A1A20'],
  gold:['#5A0A10','#8E1015','#FF3B30','#FFB0A0'],hair:['#040204','#0A0608','#140C10'],eye:'#FF5A3C',horn:['#5A0A10','#C1121F','#FF5A4E','#FFD0C8'],genesis:true},
 aka:{m:['#4A0A10','#8E1015','#D02A2A','#FF6A5A','#FFB0A0'],ar:['#0E1018','#1C2030','#2C3248','#454E6E','#6E7AA0'],cord:['#5A0A10','#B3161F','#FF4A4A'],hk:['#0C0D14','#161824','#22263A','#343A54'],
  gold:['#6A4A00','#B8860B','#FFC93A','#FFF2B0'],hair:['#08080C','#14141C','#24242E'],eye:'#FFB000',horn:['#6A5A3A','#B8A070','#E8DCB8','#FFFFFF']},
 kin:{m:['#6A4A00','#C88A00','#FFC93A','#FFE08A','#FFF6D0'],ar:['#08070A','#141218','#22202A','#3A3640','#5A5460'],cord:['#7A5A10','#FFC93A','#FFF2B0'],hk:['#08070A','#121016','#1C1A22','#2A2830'],
  gold:['#6A4A00','#B8860B','#FFC93A','#FFF2B0'],hair:['#08080C','#14141C','#24242E'],eye:'#FF3B30',horn:['#8A6A20','#E0B040','#FFE08A','#FFFFFF']},
 kongo:{m:['#5A9AB8','#9FD8EC','#D8F4FF','#F2FCFF','#FFFFFF'],ar:['#6E86A0','#9AB0C8','#C8D8E8','#E4EEF8','#FFFFFF'],cord:['#2E8AB0','#5ACCE0','#BFFFF8'],hk:['#5A7896','#8AA6C2','#B4C8DC','#D8E6F2'],
  gold:['#5A8AA8','#8FC8E0','#CFF6FF','#FFFFFF'],hair:['#A8BCD0','#C8D8E8','#E8F0F8'],eye:'#FF5AD8',horn:['#5ACCE0','#9FE8F8','#DFFAFF','#FFFFFF']},
 ao:{m:['#0A1A4A','#1B4AA8','#2F6FE0','#7FB0FF','#C8E0FF'],ar:['#0E1018','#1C2030','#2C3248','#454E6E','#6E7AA0'],cord:['#0E3A44','#1E8A7A','#4FE0D0'],hk:['#0C0D14','#161824','#22263A','#343A54'],
  gold:['#6A4A00','#B8860B','#FFC93A','#FFF2B0'],hair:['#08080C','#14141C','#24242E'],eye:'#FFE14A',horn:['#6A5A3A','#B8A070','#E8DCB8','#FFFFFF']}};
function hdDrawOni(g,f,fr,pal){
  const C=HDPAL[pal]||HDPAL.aka;const P=hiPose(f,fr);const L=P.lean;
  const rot=p=>{const dx=p[0]-P.hip[0],dy=p[1]-P.hip[1];return[P.hip[0]+dx*Math.cos(L)-dy*Math.sin(L),P.hip[1]+dx*Math.sin(L)+dy*Math.cos(L)];};
  const T=(x,y)=>rot([P.hip[0]+x,P.hip[1]+y]);const pg=(pts,c)=>hiPoly(g,pts,c);
  const px=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x*2)/2,Math.round(y*2)/2,w,h);};
  const ln=(a,b,c,w)=>{w=w||0.5;const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy);
    if(L<3){const n=Math.ceil(L*2);for(let k=0;k<=n;k++){const q=k/n;px(a[0]+dx*q,a[1]+dy*q,w,w,c);}return;}
    const nx=-dy/L*w/2,ny=dx/L*w/2;pg([[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]],c);};
  const quad=(a,b,c,d,col)=>pg([a,b,c,d],col);
  const neck=T(0,-32),shB=T(-9,-29),shF=T(10,-29);const hipB=[P.hip[0]-7,P.hip[1]],hipF=[P.hip[0]+7,P.hip[1]];
  // ---- hair mane behind the head
  const hn=[neck[0],neck[1]-14];for(let k=0;k<9;k++){const a=Math.PI*0.55+k*0.13;const len=16+(k%3)*4;pg([[hn[0]-2,hn[1]+2],[hn[0]-2+Math.cos(a)*len,hn[1]+Math.sin(a)*len*0.9],[hn[0]+1,hn[1]+4]],C.hair[k%2]);}
  // ---- back leg: hakama with folds
  const leg=(hp,kn,ft,dark)=>{const sh=dark?C.hk[0]:C.hk[1],md=dark?C.hk[1]:C.hk[2],li=dark?C.hk[2]:C.hk[3];
    hiLimb(g,hp,kn,16,15,md,sh);hiLimb(g,kn,[ft[0],ft[1]-4],15,20,md,sh);
    for(const o of [-3.5,0,3.5])ln([kn[0]+o,kn[1]+1],[ft[0]+o*1.4,ft[1]-5],li);ln([hp[0]-6,hp[1]+2],[kn[0]-6,kn[1]],li);
    // sandal and strap
    pg([[ft[0]-7,ft[1]-3],[ft[0]+10,ft[1]-3],[ft[0]+11,ft[1]],[ft[0]-8,ft[1]]],dark?'#2A1A10':'#4A2E1A');px(ft[0]-7,ft[1]-1,18,1,dark?'#1A1008':'#2A1A10');
    pg([[ft[0]-5,ft[1]-6],[ft[0]+6,ft[1]-6],[ft[0]+7,ft[1]-3],[ft[0]-6,ft[1]-3]],dark?'#C8B080':'#E8D8B0');ln([ft[0]-4,ft[1]-4.5],[ft[0]+5,ft[1]-4.5],C.cord[1]);};
  leg(hipB,P.kb,P.fb,true);
  // ---- back arm (armored sleeve)
  const arm=(sh,hand,dark)=>{const e=hiElbow(sh,hand,14,true);hiLimb(g,sh,e,10,9,dark?C.ar[0]:C.ar[1],C.ar[0]);hiLimb(g,e,hand,9,8,dark?C.ar[1]:C.ar[2],C.ar[0]);
    for(let k=1;k<6;k++){const q=k/6;px(sh[0]+(e[0]-sh[0])*q,sh[1]+(e[1]-sh[1])*q,1,0.5,C.ar[3]);}
    const m=[e[0]+(hand[0]-e[0])*0.5,e[1]+(hand[1]-e[1])*0.5];const d=[hand[0]-e[0],hand[1]-e[1]];const dl=Math.hypot(d[0],d[1])||1;const nx=-d[1]/dl*3,ny=d[0]/dl*3;
    pg([[m[0]-d[0]/dl*5+nx,m[1]-d[1]/dl*5+ny],[m[0]+d[0]/dl*5+nx,m[1]+d[1]/dl*5+ny],[m[0]+d[0]/dl*5-nx,m[1]+d[1]/dl*5-ny],[m[0]-d[0]/dl*5-nx,m[1]-d[1]/dl*5-ny]],dark?C.ar[2]:C.ar[3]);
    ln([m[0]-d[0]/dl*5+nx,m[1]-d[1]/dl*5+ny],[m[0]+d[0]/dl*5+nx,m[1]+d[1]/dl*5+ny],C.ar[4]);
    pg([[hand[0]-3,hand[1]-3],[hand[0]+3,hand[1]-3],[hand[0]+3.5,hand[1]+3],[hand[0]-3,hand[1]+3]],dark?'#5A3A20':'#8A5A30');return e;};
  const hb=P.hb||(C.genesis?[P.grip[0]-10,P.grip[1]+7]:[P.grip[0]-5,P.grip[1]+3]);arm(shB,hb,true);
  // ---- front leg
  leg(hipF,P.kf,P.ff,false);
  // ---- torso: under-robe, do (chest armor) in curved lames with lacing
  pg([T(-15,-32),T(15,-32),T(17,-6),T(-17,-6)],C.hk[2]);
  for(let r=0;r<5;r++){const y0=-29+r*4.6,y1=y0+4.2,bow=0.8;
    quad(T(-13,y0),T(13,y0),T(13.5,y1),T(-13.5,y1),C.ar[2]);quad(T(4,y0),T(13,y0),T(13.5,y1),T(4.5,y1),C.ar[1]);quad(T(-13,y0),T(-8,y0),T(-8.5,y1),T(-13.5,y1),C.ar[3]);
    ln(T(-13,y0+0.25),T(13,y0+0.25),C.ar[4]);ln(T(-13.5,y1-0.5),T(13.5,y1-0.5),C.ar[0]);
    for(let x=-11;x<12;x+=3.2){ln(T(x,y0+1),T(x+1.2,y1-1),C.cord[1]);ln(T(x+1.2,y0+1),T(x,y1-1),C.cord[0]);px(T(x+0.4,y0+2)[0],T(x+0.4,y0+2)[1],0.5,0.5,C.cord[2]);}}
  // belt (obi) and knot
  quad(T(-17,-6),T(17,-6),T(17.5,-1.5),T(-17.5,-1.5),C.m[1]);ln(T(-17,-5.5),T(17,-5.5),C.m[3]);ln(T(-17.5,-2),T(17.5,-2),C.m[0]);
  pg([T(8,-6),T(13,-7),T(12,-1),T(8,-2)],C.m[2]);pg([T(10,-2),T(13,4),T(11,5),T(9,-1)],C.m[1]);
  // kusazuri: armor skirt plates over the hakama
  for(let k=0;k<5;k++){const x0=-16+k*6.6;const a=T(x0,-1.5),b=T(x0+6,-1.5);const c2=[b[0]+0.6,b[1]+10],d2=[a[0]-0.6,a[1]+10];
    pg([a,b,c2,d2],k%2?C.ar[2]:C.ar[1]);ln(a,b,C.ar[4]);for(let j=1;j<4;j++){const q=j/4;ln([a[0]+(d2[0]-a[0])*q,a[1]+(d2[1]-a[1])*q],[b[0]+(c2[0]-b[0])*q,b[1]+(c2[1]-b[1])*q],C.cord[1]);}ln(d2,c2,C.ar[0]);}
  // back shoulder guard (sode)
  const sode=(s,dark,side)=>{for(let r=0;r<4;r++){const y=s[1]-3+r*3.4;const x0=s[0]+(side<0?-11:-2),x1=s[0]+(side<0?2:11);
      pg([[x0,y],[x1,y],[x1+0.5,y+3.2],[x0-0.5,y+3.2]],dark?C.ar[r%2?1:0]:C.ar[r%2?2:3]);ln([x0,y],[x1,y],dark?C.ar[2]:C.ar[4]);for(let x=x0+1.5;x<x1;x+=3)px(x,y+1.4,0.5,1,C.cord[1]);}};
  sode(shB,true,-1);
  // ---- head: sculpted oni mask
  const H=(x,y)=>[neck[0]+x,neck[1]+y+8];
  pg([H(-5,-8),H(5,-8),H(3,0),H(-3,0)],C.hk[1]);
  pg([H(-8,-21),H(9,-21),H(11,-9),H(7,-2.5),H(-6,-2.5),H(-9,-9)],C.m[1]);
  pg([H(-7,-20.5),H(1,-20.5),H(-1,-10),H(-6,-9)],C.m[3]);pg([H(4,-20.5),H(9,-20.5),H(10.5,-9),H(6,-4)],C.m[0]);
  pg([H(-6,-16),H(-1,-15),H(-1,-13),H(-6,-14)],C.m[0]);pg([H(3,-15),H(8.5,-16),H(8.5,-14),H(3,-13)],C.m[0]);           // brow ridges
  px(H(-5,-13)[0],H(-5,-13)[1],3,1.5,C.eye);px(H(4,-13)[0],H(4,-13)[1],3,1.5,C.eye);px(H(-4.5,-13)[0],H(-4.5,-13)[1],0.5,0.5,'#FFFFFF');px(H(4.5,-13)[0],H(4.5,-13)[1],0.5,0.5,'#FFFFFF');
  ln(H(1,-12),H(1.5,-8),C.m[0]);ln(H(-0.5,-9),H(3,-9),C.m[0]);ln(H(-6,-11),H(-4,-8),C.m[4]);ln(H(9,-11),H(8,-8),C.m[0]);
  pg([H(-4,-6.5),H(7,-6.5),H(6,-3.5),H(-3,-3.5)],'#1A0204');
  for(const x of [-3,-1,1,3,5])pg([H(x,-6.5),H(x+1,-6.5),H(x+0.5,-5.5)],'#F3E9E4');
  pg([H(-3.5,-6.5),H(-2.5,-6.5),H(-3,-3.5)],'#FFFFFF');pg([H(5.5,-6.5),H(6.5,-6.5),H(6,-3.5)],'#FFFFFF');
  // horns with ridges
  const horn=(x,s)=>{const b=H(x,-20);const pts=[b,[b[0]+s*1,b[1]-6],[b[0]+s*5,b[1]-13],[b[0]+s*7.5,b[1]-15],[b[0]+s*4.5,b[1]-8],[b[0]+s*3,b[1]+0.5]];
    pg(pts,C.horn[1]);pg([b,[b[0]+s*1,b[1]-6],[b[0]+s*5,b[1]-13],[b[0]+s*2.5,b[1]-5]],C.horn[2]);for(let k=1;k<5;k++){const q=k/5;ln([b[0]+s*(0.5+q*3),b[1]-q*10],[b[0]+s*(2+q*3.5),b[1]-q*9+1],C.horn[0]);}px(b[0]+s*7,b[1]-14.5,0.5,0.5,C.horn[3]);};
  horn(-7,-1);horn(7,1);
  // topknot
  pg([H(-2,-24),H(3,-24),H(3,-20),H(-2,-20)],C.hair[1]);px(H(-1,-25)[0],H(-1,-25)[1],3,1,C.hair[2]);
  // ---- Genesis: glowing mask cracks, ninja scarf, twin sai
  if(C.genesis){
    for(const [x0,y0,x1,y1] of [[-6,-19,-4.5,-15],[-4.5,-15,-5.5,-11],[8,-19,6.5,-15],[6.5,-15,7.5,-10],[1,-4,2,-2.5]]){ln(H(x0,y0),H(x1,y1),'#FF3B30');}
    const nk=neck;const sw=Math.sin(fr*0.2)*2;pg([[nk[0]-4,nk[1]+2],[nk[0]-24,nk[1]+7+sw],[nk[0]-21,nk[1]+11+sw],[nk[0]-2,nk[1]+6]],'#8E1015');ln([nk[0]-4,nk[1]+2.5],[nk[0]-23,nk[1]+7.5+sw],'#C1121F');
    const sai=(hx,hy,ang,len)=>{const ca=Math.cos(ang),sa=Math.sin(ang),nx=-sa,ny=ca;const at=d=>[hx+ca*d,hy+sa*d];
      for(let d=-6;d<0;d+=1){const p=at(d);pg([[p[0]+nx*1.2,p[1]+ny*1.2],[p[0]+ca+nx*1.2,p[1]+sa+ny*1.2],[p[0]+ca-nx*1.2,p[1]+sa-ny*1.2],[p[0]-nx*1.2,p[1]-ny*1.2]],d%2?'#1A0A0C':'#8E1015');}
      for(const s of [-1,1]){const b=at(1);const m1=[b[0]+nx*s*3.5,b[1]+ny*s*3.5],tp=[m1[0]+ca*4,m1[1]+sa*4];ln(b,m1,'#AEB8C8',1);ln(m1,tp,'#DDE4EE',1);}
      const a0=at(1),a1=at(len-2),tip=at(len);const st=(o0,o1,col)=>pg([[a0[0]+nx*o0,a0[1]+ny*o0],[a1[0]+nx*o0,a1[1]+ny*o0],[a1[0]+nx*o1,a1[1]+ny*o1],[a0[0]+nx*o1,a0[1]+ny*o1]],col);
      st(1,0.3,'#6A7488');st(0.3,-0.4,'#DDE4EE');st(-0.4,-1,'#FFFFFF');pg([[a1[0]+nx,a1[1]+ny],[tip[0],tip[1]],[a1[0]-nx,a1[1]-ny]],'#F3F6FA');};
    sai(hb[0],hb[1],P.ang+0.35,20);sai(P.grip[0],P.grip[1],P.ang,25);
    for(let i=0;i<3;i++){const ph=(fr*1.4+i*37)%60;g.globalAlpha=Math.max(0,1-ph/60);px(Math.sin(i*2.1+fr*0.05)*14,-12-ph*1.2,1,1,i%2?'#FF6A00':'#FF3B30');g.globalAlpha=1;}
  }
  // ---- katana
  if(P.len>0&&!C.genesis){const ca=Math.cos(P.ang),sa=Math.sin(P.ang);const gp=P.grip;const at=d=>[gp[0]+ca*d,gp[1]+sa*d];const nx=-sa,ny=ca;
    for(let d=-12;d<-1;d+=1){const p=at(d);pg([[p[0]+nx*1.4,p[1]+ny*1.4],[p[0]+ca+nx*1.4,p[1]+sa+ny*1.4],[p[0]+ca-nx*1.4,p[1]+sa-ny*1.4],[p[0]-nx*1.4,p[1]-ny*1.4]],'#14141C');
      const q=at(d+0.5);px(q[0]+(d%2?nx:-nx)*0.6,q[1]+(d%2?ny:-ny)*0.6,0.5,0.5,'#E8D8B0');}
    const k0=at(-13);px(k0[0]-0.5,k0[1]-0.5,1.5,1.5,C.gold[1]);
    const tb=at(-0.5);pg([[tb[0]+nx*4.2,tb[1]+ny*4.2],[tb[0]+ca*1.5+nx*4.2,tb[1]+sa*1.5+ny*4.2],[tb[0]+ca*1.5-nx*4.2,tb[1]+sa*1.5-ny*4.2],[tb[0]-nx*4.2,tb[1]-ny*4.2]],C.gold[1]);
    ln([tb[0]+nx*4,tb[1]+ny*4],[tb[0]-nx*4,tb[1]-ny*4],C.gold[3]);const hb2=at(1.5);px(hb2[0]-0.5,hb2[1]-0.5,1.5,1.5,C.gold[2]);
    {const a0=at(2),a1=at(P.len-3),tip=at(P.len);const strip=(o0,o1,col)=>pg([[a0[0]+nx*o0,a0[1]+ny*o0],[a1[0]+nx*o0,a1[1]+ny*o0],[a1[0]+nx*o1,a1[1]+ny*o1],[a0[0]+nx*o1,a0[1]+ny*o1]],col);
      strip(1.75,1.0,'#6A7488');strip(1.0,0.25,'#AEB8C8');strip(0.25,-0.5,'#DDE4EE');strip(-0.5,-1.25,'#F3F6FA');strip(-1.25,-1.75,'#FFFFFF');
      pg([[a1[0]+nx*1.75,a1[1]+ny*1.75],[tip[0],tip[1]],[a1[0]-nx*1.75,a1[1]-ny*1.75]],'#DDE4EE');pg([[a1[0]-nx*0.2,a1[1]-ny*0.2],[tip[0],tip[1]],[a1[0]-nx*1.75,a1[1]-ny*1.75]],'#FFFFFF');
      for(let d=4;d<P.len-4;d+=2.5){const p=at(d);px(p[0]-nx*0.8+Math.sin(d)*0.4*nx,p[1]-ny*0.8,0.5,0.5,'#FFFFFF');}}}
  // ---- front arm and front shoulder guard
  const handF=P.hb&&P.hb[0]>P.grip[0]?P.hb:P.grip;arm(shF,handF,false);sode(shF,false,1);
  ln([shF[0]-1,shF[1]-3],[shF[0]+10,shF[1]-3],C.cord[2]);
  // strike arc, kept clean
  if(P.arc){for(let a=P.arc.a0+0.35;a<=P.arc.a1;a+=0.012){const x=P.arc.cx+Math.cos(a)*P.arc.r,y=P.arc.cy+Math.sin(a)*P.arc.r;px(x,y,1,1,'rgba(255,255,255,.9)');px(x-Math.cos(a)*1.5,y-Math.sin(a)*1.5,1,0.5,'rgba(255,255,255,.35)');}}
}
/* ===== SEIRYU in HD: same rig, redrawn at double resolution ===== */
const HDSR={s0:{b:['#082214','#134E26','#1F8A4A','#3EB86A','#9BEEB4'],be:['#7A6A40','#B8A870','#E8D9A0','#FFF6D8'],mn:['#3A0206','#7A0A12','#C81828','#FF6A5A'],hn:['#6A4A08','#B8860B','#FFC93A','#FFF2B0'],eye:'#FFE14A'},
 s1:{b:['#06201E','#0E4A44','#1A7A72','#38AAA0','#9AEAE0'],be:['#5A4A70','#9A88B8','#D0C0E8','#F4ECFF'],mn:['#1A0838','#3E1560','#7A3AC0','#C49BFF'],hn:['#5A6A7A','#9AA4B4','#DDE3EE','#FFFFFF'],eye:'#C49BFF'}};
function hdDrawSeiryu(g,f,fr,skin){
  const C=HDSR[skin]||HDSR.s0;const flash=f.flash>0&&f.flash%2===0;const col=c=>flash?'#FFFFFF':c;
  const {P,k,T}=hiFrame(f,fr);const H=hiHands(f,P);const pg=(pts,c)=>hiPoly(g,pts,col(c));
  const px=(x,y,w,h,c)=>{g.fillStyle=col(c);g.fillRect(Math.round(x*2)/2,Math.round(y*2)/2,w,h);};
  const ln=(a,b,c,w)=>{w=w||0.5;const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy);if(L<0.6){px(a[0],a[1],w,w,c);return;}const nx=-dy/L*w/2,ny=dx/L*w/2;pg([[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]],c);};
  const limb=(a,b,w0,w1,c1,c2,scales)=>{hiLimb(g,a,b,w0,w1,col(c1),col(c2));const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
    ln([a[0]+nx*w0*0.3,a[1]+ny*w0*0.3],[b[0]+nx*w1*0.3,b[1]+ny*w1*0.3],C.b[3]);
    if(scales)for(let q=0.15;q<0.9;q+=0.18)for(const s of [-0.15,0.1]){const cx=a[0]+dx*q+nx*w0*s,cy=a[1]+dy*q+ny*w0*s;px(cx,cy,1,0.5,C.b[1]);px(cx+0.5,cy+0.5,0.5,0.5,C.b[3]);}};
  if(f.st==='ko'&&!f.air){
    for(let i=0;i<30;i++){const x=-10-i*1.6,y=-4+Math.sin(i*0.3)*2;hiDisc(g,x,y,Math.max(2,6-i*0.18),col(C.b[2]));px(x,y-3,1,0.5,C.b[3]);}
    pg([[-14,-14],[18,-14],[20,0],[-16,0]],C.b[2]);pg([[-10,-8],[14,-8],[16,0],[-12,0]],C.be[2]);for(let x=-8;x<14;x+=4)ln([x,-8],[x+1,0],C.be[1]);
    pg([[18,-14],[40,-10],[40,-4],[18,-2]],C.b[2]);pg([[22,-18],[25,-25],[27,-17]],C.hn[2]);pg([[28,-18],[31,-25],[33,-17]],C.hn[2]);pg([[14,-16],[20,-16],[18,-4],[12,-6]],C.mn[2]);return;}
  // ---- tail with a spine of ridges and a mane tuft at the tip
  let tx=P.hip[0]-10*k,ty=P.hip[1]+2,ta=Math.PI+0.2;const sw=Math.sin(fr*0.1)*0.02;const pts=[];
  for(let i=0;i<26;i++){ta+=(i<14?-0.025:0.06)+sw;const nx2=tx+Math.cos(ta)*2.6,ny2=ty-Math.sin(ta)*2.6;pts.push([tx,ty,nx2,ny2,Math.max(3,11-i*0.33)]);tx=nx2;ty=ny2;}
  for(const [x0,y0,x1,y1,w] of pts)hiLimb(g,[x0,y0],[x1,y1],w,Math.max(3,w-0.33),col(C.b[2]),col(C.b[1]));
  pts.forEach(([x0,y0,x1,y1,w],i)=>{const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;ln([x0-nx*w*0.25,y0-ny*w*0.25],[x1-nx*w*0.25,y1-ny*w*0.25],C.b[3]);
    if(i%3===1){const b=[x0-nx*w/2,y0-ny*w/2];pg([[b[0]-dx*0.6,b[1]-dy*0.6],[b[0]-nx*3.5,b[1]-ny*3.5],[b[0]+dx*0.6,b[1]+dy*0.6]],C.mn[2]);}
    if(i%2===0)px(x0+nx*w*0.2,y0+ny*w*0.2,1,0.5,C.b[1]);});
  const tl=pts[pts.length-1];for(let j=0;j<5;j++)pg([[tl[2],tl[3]],[tl[2]-6+j*2,tl[3]-6-j],[tl[2]-2+j*2,tl[3]-1]],j%2?C.mn[2]:C.mn[3]);
  // ---- back leg and arm
  const hipB=[P.hip[0]-7*k,P.hip[1]],hipF=[P.hip[0]+7*k,P.hip[1]];
  limb(hipB,P.kb,15,13,C.b[1],C.b[0],true);limb(P.kb,[P.fb[0],P.fb[1]-3],13,11,C.b[1],C.b[0]);
  pg([[P.fb[0]-6,P.fb[1]-4],[P.fb[0]+10,P.fb[1]-4],[P.fb[0]+11,P.fb[1]],[P.fb[0]-6,P.fb[1]]],C.b[1]);for(const d of [3,6.5,10])pg([[P.fb[0]+d,P.fb[1]-1.5],[P.fb[0]+d+2.5,P.fb[1]+0.5],[P.fb[0]+d,P.fb[1]+0.5]],'#F3E9E4');
  const shB=T(-7,-29),shF=T(8,-29);const eB=hiElbow(shB,H.hb,13*k,true);limb(shB,eB,10,9,C.b[1],C.b[0]);limb(eB,H.hb,9,8,C.b[1],C.b[0]);hiDisc(g,H.hb[0],H.hb[1],3.5,col(C.b[1]));
  // ---- front leg
  limb(hipF,P.kf,16,14,C.b[2],C.b[1],true);limb(P.kf,[P.ff[0],P.ff[1]-3],14,12,C.b[2],C.b[1]);
  pg([[P.ff[0]-6,P.ff[1]-4],[P.ff[0]+11,P.ff[1]-4],[P.ff[0]+12,P.ff[1]],[P.ff[0]-6,P.ff[1]]],C.b[2]);ln([P.ff[0]-5,P.ff[1]-3.5],[P.ff[0]+10,P.ff[1]-3.5],C.b[3]);
  for(const d of [3.5,7.5,11.5])pg([[P.ff[0]+d,P.ff[1]-2],[P.ff[0]+d+3,P.ff[1]+0.5],[P.ff[0]+d,P.ff[1]+0.5]],'#FFFFFF');
  // ---- torso: scaled back, segmented belly
  pg([T(-15,-30),T(15,-30),T(16,-2),T(-16,-2)],C.b[2]);pg([T(9,-30),T(15,-30),T(16,-2),T(10,-2)],C.b[1]);pg([T(-15,-30),T(-10,-30),T(-11,-2),T(-16,-2)],C.b[3]);
  for(let r=0;r<6;r++)for(let c2=0;c2<4;c2++){const p=T(-13+c2*3.4+(r%2)*1.7,-27+r*4.2);px(p[0],p[1],1.5,0.5,C.b[3]);px(p[0]+0.5,p[1]+0.5,0.5,0.5,C.b[0]);}
  pg([T(-4,-28),T(11,-28),T(12,-3),T(-5,-3)],C.be[2]);pg([T(6,-28),T(11,-28),T(12,-3),T(7,-3)],C.be[1]);
  for(const y of [-24,-19.5,-15,-10.5,-6]){ln(T(-4.5,y),T(11.5,y),C.be[0]);ln(T(-4.5,y-0.6),T(11.5,y-0.6),C.be[3]);}
  // ---- head: mane, horns (antlers), snout, jaw, eye, whiskers
  const hd=T(3,-40);const open=f.st==='special'&&f.t>=CH.ryu.special.at-2;
  for(let i=0;i<7;i++){const bx=hd[0]-3-i*2.6,by=hd[1]-5+i*3.2;pg([[bx,by],[bx-11+Math.sin(fr*0.12+i)*1.5,by+3+i*0.6],[bx-4,by+6]],i%2?C.mn[1]:C.mn[2]);ln([bx-1,by+1],[bx-8,by+4],C.mn[3]);}
  hiDisc(g,hd[0],hd[1],9*k,col(C.b[2]));hiDisc(g,hd[0]-2,hd[1]-3,4.5*k,col(C.b[3]));
  const sn=(x,y)=>[hd[0]+x*k,hd[1]+y*k];
  pg([sn(5,-5),sn(20,-2.5),sn(21,0),sn(20,open?0:3),sn(5,2)],C.b[2]);ln(sn(6,-4.5),sn(19,-2.2),C.b[3],0.8);
  pg([sn(5,open?5:3),sn(19,open?8:4.2),sn(17,open?9:5.5),sn(5,7)],C.be[2]);for(let x=8;x<18;x+=2.5)pg([sn(x,open?1:2.6),sn(x+0.8,open?3:4),sn(x+1.6,open?1:2.6)],'#FFFFFF');
  if(open){pg([sn(6,1),sn(20,1),sn(20,6),sn(6,4)],'#3A0204');pg([sn(13,2),sn(24,1),sn(24,6),sn(14,5)],'#FF6A00');pg([sn(17,2.8),sn(26,2.5),sn(26,4.5),sn(18,4.2)],'#FFF2A8');}
  px(sn(18,-2)[0],sn(18,-2)[1],1,1,'#082214');
  pg([sn(1,-7),sn(9,-8),sn(9,-6.5),sn(1,-5)],C.b[0]);pg([sn(3,-6),sn(8,-6),sn(7.5,-3.5),sn(3,-4)],col(C.eye));ln(sn(5.5,-6),sn(5.5,-3.7),'#082214',0.6);px(sn(4,-5.6)[0],sn(4,-5.6)[1],0.5,0.5,'#FFFFFF');
  const antler=(bx,by,s)=>{const b=sn(bx,by);const t1=[b[0]-4*s,b[1]-18],t2=[b[0]-1*s,b[1]-10],t3=[b[0]+4*s,b[1]-15];
    ln(b,t1,C.hn[2],2);ln([b[0]+0.5,b[1]],[t1[0]+0.5,t1[1]],C.hn[3],0.5);ln(t2,t3,C.hn[2],1.5);ln([b[0]-2*s,b[1]-6],[b[0]-7*s,b[1]-10],C.hn[1],1.2);px(t1[0],t1[1],1,1,C.hn[3]);};
  antler(-2,-7,1);antler(3,-8,-0.6);
  for(let j=0;j<2;j++){let wx=sn(19,1+j*1.5)[0],wy=sn(19,1+j*1.5)[1];for(let i=0;i<14;i++){const nx2=wx+1.1,ny2=wy+Math.sin(i*0.6+fr*0.15+j)*0.9+0.25;ln([wx,wy],[nx2,ny2],C.mn[3]);wx=nx2;wy=ny2;}}
  // ---- front arm with claws
  const eF=hiElbow(shF,H.hf,13*k,true);limb(shF,eF,11,10,C.b[2],C.b[1],true);limb(eF,H.hf,10,9,C.b[2],C.b[1]);
  hiDisc(g,H.hf[0],H.hf[1],4.5,col(C.b[2]));for(const dy of [-4,0,4])pg([[H.hf[0]+3,H.hf[1]+dy-1],[H.hf[0]+8,H.hf[1]+dy],[H.hf[0]+3,H.hf[1]+dy+1]],'#FFFFFF');
  if(P.strike){const c0=T(8,-30);const R=Math.hypot(H.hf[0]-c0[0],H.hf[1]-c0[1]);for(let a=-0.8;a<=0.35;a+=0.012)px(c0[0]+Math.cos(a)*R,c0[1]+Math.sin(a)*R,1,1,'rgba(255,255,255,.85)');}
}

/* ===== HD pass for the other fighters: same drawing at double resolution, plus fine details clipped to the body ===== */
function hdOverlay(g,f,fr,kit){
  if(f.st==='ko'&&!f.air)return;const {P,k,T}=hiFrame(f,fr);const H=hiHands(f,P);
  const ln=(a,b,c,w)=>{w=w||0.5;const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy);if(L<0.5)return;const nx=-dy/L*w/2,ny=dx/L*w/2;hiPoly(g,[[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]],c);};
  const dot=(p,c)=>{g.fillStyle=c;g.fillRect(Math.round(p[0]*2)/2,Math.round(p[1]*2)/2,0.5,0.5);};
  g.save();g.globalCompositeOperation='source-atop';
  const DK='rgba(0,0,0,.22)',LT='rgba(255,255,255,.22)';
  // legs: two fold lines down each leg
  for(const [hp,kn,ft] of [[[P.hip[0]-7*k,P.hip[1]],P.kb,P.fb],[[P.hip[0]+7*k,P.hip[1]],P.kf,P.ff]])for(const o of [-2.5,2.5]){ln([hp[0]+o,hp[1]+2],[kn[0]+o*0.8,kn[1]],o<0?LT:DK);ln([kn[0]+o*0.8,kn[1]+1],[ft[0]+o*0.6,ft[1]-4],o<0?LT:DK);}
  // arms: a lit edge along each arm
  const shB=T(-8,-29),shF=T(9,-29);for(const [s,h] of [[shB,H.hb],[shF,H.hf]]){const e=hiElbow(s,h,13*k,true);ln([s[0]-1,s[1]-1],[e[0]-1,e[1]-1],LT);ln([e[0]-1,e[1]-1],[h[0]-1,h[1]-1],LT);}
  // torso: soft folds and a centre highlight
  for(const y of [-25,-18,-11])ln(T(-11,y),T(11,y+1),DK);ln(T(-2,-30),T(-2,-6),LT);
  // a signature detail per fighter
  if(kit==='saru'){ln(T(-14,-30),T(14,-30),'rgba(255,214,90,.75)',0.8);ln(T(-14,-8),T(14,-8),'rgba(255,214,90,.75)',0.8);for(let y=-28;y<-8;y+=3)dot(T(13,y),'rgba(255,230,140,.8)');}
  if(kit==='kappa'){for(let r=0;r<4;r++)for(let c=0;c<3;c++){const p=T(-15+c*4+(r%2)*2,-28+r*6);ln([p[0]-1.5,p[1]],[p[0],p[1]-1.5],'rgba(255,255,255,.18)');ln([p[0],p[1]-1.5],[p[0]+1.5,p[1]],'rgba(255,255,255,.18)');ln([p[0]-1.5,p[1]],[p[0],p[1]+1.5],DK);ln([p[0],p[1]+1.5],[p[0]+1.5,p[1]],DK);}}
  if(kit==='kitsune'){ln(T(-6,-31),T(2,-20),'rgba(255,255,255,.7)',0.8);ln(T(10,-31),T(2,-20),'rgba(255,255,255,.7)',0.8);for(let i=0;i<5;i++)ln(T(-10+i*5,-6),T(-11+i*5,4),DK);}
  if(kit==='tengu'){for(let r=0;r<4;r++)for(let c=-2;c<=2;c++){const p=T(c*4,-27+r*5);ln([p[0]-2,p[1]-1],[p[0],p[1]+1],DK);ln([p[0],p[1]+1],[p[0]+2,p[1]-1],DK);}}
  if(kit==='onryo'){const hd=T(1,-38);for(let i=0;i<8;i++){const x=hd[0]-7+i*2;ln([x,hd[1]-6],[x+Math.sin(i+fr*0.05)*1.5-1,hd[1]+18],i%2?'rgba(120,120,160,.35)':'rgba(255,255,255,.12)');}for(const y of [-22,-12,-2])ln(T(-12,y),T(12,y+3),'rgba(120,130,180,.25)');}
  if(kit==='enma'){for(let y=-28;y<-6;y+=4)for(let x=-10;x<=10;x+=5)dot(T(x+(y%8?2:0),y),'rgba(255,214,90,.7)');ln(T(-15,-30),T(15,-30),'rgba(255,214,90,.8)',0.8);ln(T(-2,-30),T(-2,-4),'rgba(255,214,90,.55)',0.8);}
  // fur, scales, feathers or folds along every limb
  const TEX={saru:['rgba(255,230,170,.35)','rgba(60,30,10,.3)',2.2],kappa:['rgba(255,255,255,.22)','rgba(0,40,10,.3)',1.4],kitsune:['rgba(255,255,255,.3)','rgba(120,40,10,.25)',2.4],
    tengu:['rgba(160,170,210,.3)','rgba(0,0,10,.35)',2],onryo:['rgba(255,255,255,.18)','rgba(60,60,110,.25)',2.6],enma:['rgba(255,214,90,.35)','rgba(40,0,0,.3)',2.4]}[kit];
  if(TEX){const limbs=[[[P.hip[0]-7*k,P.hip[1]],P.kb],[P.kb,P.fb],[[P.hip[0]+7*k,P.hip[1]],P.kf],[P.kf,P.ff],[shB,hiElbow(shB,H.hb,13*k,true)],[shF,hiElbow(shF,H.hf,13*k,true)]];
    for(const [a,b] of limbs){const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
      for(let q=0.12;q<0.92;q+=0.11)for(const s of [-1,1]){const p=[a[0]+dx*q+nx*s*2.2,a[1]+dy*q+ny*s*2.2];
        if(kit==='kappa'){dot(p,TEX[0]);dot([p[0]+0.5,p[1]+0.5],TEX[1]);}
        else if(kit==='tengu'){ln([p[0]-nx*1.2,p[1]-ny*1.2],[p[0]+dx/L*1.4,p[1]+dy/L*1.4],s<0?TEX[0]:TEX[1]);}
        else ln(p,[p[0]+dx/L*TEX[2],p[1]+dy/L*TEX[2]],s<0?TEX[0]:TEX[1]);}}}
  if(kit==='kappa'){for(let a=-1.2;a<1.2;a+=0.08){const p=T(-14+Math.cos(a)*3,-18+Math.sin(a)*14);dot(p,'rgba(255,240,200,.45)');}}
  if(kit==='enma'){const hd=T(1,-40);for(let i=0;i<7;i++)ln([hd[0]-5+i*1.6,hd[1]+5],[hd[0]-6+i*1.8,hd[1]+13+(i%2)*2],'rgba(0,0,0,.35)');for(const y of [-8,-6])ln(T(-14,y),T(14,y),'rgba(255,214,90,.55)');}
  if(kit==='kitsune'){for(let i=0;i<4;i++)ln(T(-12+i*7,-2),T(-13+i*7,8),'rgba(255,255,255,.25)');}
  if(kit==='onryo'){const hd=T(1,-38);for(let i=0;i<6;i++)ln([hd[0]-8+i*3,hd[1]-2],[hd[0]-9+i*3.2,hd[1]+24],'rgba(10,10,30,.35)');}
  g.restore();
}
function hdDrawGeneric(g,f,fr,side){hiDrawAny(g,f,fr,side);hdOverlay(g,f,fr,f.ch);}

/* ===== KIRA and KAZE in full HD: same geometry and effects, redrawn with fine detail on top ===== */
function hdKit(g){
  const px=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x*2)/2,Math.round(y*2)/2,w,h);};
  const ln=(a,b,c,w)=>{w=w||0.5;const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy);if(L<0.4){px(a[0],a[1],w,w,c);return;}const nx=-dy/L*w/2,ny=dx/L*w/2;hiPoly(g,[[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]],c);};
  const glowD=(x,y,r,rgb,a)=>{const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(${rgb},${a})`);gr.addColorStop(1,`rgba(${rgb},0)`);g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,6.283);g.fill();};
  return{px,ln,glowD};}
function hdDrawKira(g,f,fr,skin){
  hiDrawKira(g,f,fr,skin);if((f.st==='ko'&&!f.air)||(f.flash>0&&f.flash%2===0))return;
  const r=KR[skin]||KR.k0;const {px,ln,glowD}=hdKit(g);const {P,k,T}=hiFrame(f,fr);const H=hiHands(f,P);
  // tails: fur strands along each tail and a soft white tip
  const hp=T(-10,-6);const sw=Math.sin(fr*0.12)*3;
  for(let tl=2;tl>=0;tl--)for(let i=1;i<16;i+=1.5){const q=i/16;const x=hp[0]-q*22*k-tl*3,y=hp[1]-q*(10+tl*8)*k+Math.sin(q*3)*3+sw*q;const rr=Math.max(2,(2+4*Math.sin(q*3.1))*k);
    ln([x-rr*0.6,y-rr*0.5],[x-rr*0.6-1.6,y-rr*0.5-0.8],q>0.8?'rgba(255,255,255,.8)':'rgba(255,240,210,.45)');ln([x+rr*0.2,y+rr*0.6],[x-0.8,y+rr*0.6+1.2],'rgba(90,40,0,.35)');}
  // hakama pleats
  for(const [hpX,kn,ft] of [[P.hip[0]-6*k,P.kb,P.fb],[P.hip[0]+6*k,P.kf,P.ff]])for(const o of [-3,0,3]){ln([hpX+o,P.hip[1]+2],[kn[0]+o*0.8,kn[1]],'rgba(0,0,0,.25)');ln([kn[0]+o*0.8,kn[1]],[ft[0]+o*0.9,ft[1]-6],o<0?'rgba(255,255,255,.18)':'rgba(0,0,0,.25)');}
  // robe: folds, a red tasuki cord and a crisp collar
  for(const y of [-24,-17,-11])ln(T(-10,y),T(10,y+1.5),'rgba(120,110,100,.35)');
  ln(T(-11,-28),T(10,-8),r.hak,1);ln(T(-11,-27.5),T(10,-7.5),'rgba(255,255,255,.35)');
  ln(T(-5,-30),T(2,-18),r.hakD,0.6);ln(T(9,-30),T(2,-18),r.hakD,0.6);ln(T(-14,-7),T(14,-7),'rgba(255,255,255,.25)');
  // fox head: inner ears, cheek fur, eye shine, nose and whiskers
  const hd=T(3,-40);const Q=(x,y)=>[hd[0]+x*k,hd[1]+y*k];
  hiPoly(g,[Q(-5,-6),Q(-4,-13.5),Q(-1.5,-6.5)],'#FFB0B8');hiPoly(g,[Q(2.5,-6.5),Q(5,-12.5),Q(6,-6)],'#FFB0B8');
  for(const [a,b] of [[[-7,0],[-11,3]],[[-7,2],[-10,6]],[[-6,4],[-8,8]]])hiPoly(g,[Q(a[0],a[1]),Q(b[0],b[1]),Q(a[0]+2,a[1]+1)],r.f0);
  px(Q(4.6,-3)[0],Q(4.6,-3)[1],1,0.5,'#FFFFFF');px(Q(15,-0.5)[0],Q(15,-0.5)[1],1.5,1.5,'#1A0506');
  for(const dy of [1.5,3])ln(Q(11,dy),Q(17,dy+0.8),'rgba(255,255,255,.55)');
  // sleeve folds and a red cuff on the front arm
  const sf=T(8,-29);const e=hiElbow(sf,H.hf,12*k,true);ln([e[0]-4,e[1]+2],[e[0]-2,e[1]+8],'rgba(120,110,100,.45)');ln([e[0]+1,e[1]+1],[e[0]+2,e[1]+8],'rgba(120,110,100,.35)');
  ln([e[0]-3,e[1]+8.5],[e[0]+3,e[1]+9],r.hak,1);
  // foxfire glows
  const ff=Math.floor(fr/4)%2;
  if(f.st==='special'){for(const s of [-1,1]){const o=T(s*16,-40);glowD(o[0],o[1],10,'127,231,255',0.45);}}
  else if(f.st==='win')glowD(H.hf[0],H.hf[1]-8,10,'127,231,255',0.4);
  else if(!P.strike)glowD(H.hf[0]+6,H.hf[1]-6,6+ff,'127,231,255',0.35);
}
function hdDrawKaze(g,f,fr,skin){
  hiDrawKaze(g,f,fr,skin);if((f.st==='ko'&&!f.air)||(f.flash>0&&f.flash%2===0))return;
  const r=KZ[skin]||KZ.kaze0;const {px,ln,glowD}=hdKit(g);const P=kazePose(f,fr);const L=P.lean;
  const rot=(p)=>{const dx=p[0]-P.hip[0],dy=p[1]-P.hip[1];return[P.hip[0]+dx*Math.cos(L)-dy*Math.sin(L),P.hip[1]+dx*Math.sin(L)+dy*Math.cos(L)];};
  const T=(x,y)=>rot([P.hip[0]+x,P.hip[1]+y]);const neck=T(0,-28);
  // fur strokes on the shins and arms
  for(const [a,b] of [[P.kb,P.fb],[P.kf,P.ff]]){const dx=b[0]-a[0],dy=b[1]-a[1];for(let q=0.15;q<0.85;q+=0.14){const p=[a[0]+dx*q,a[1]+dy*q];ln([p[0]-2.5,p[1]],[p[0]-3.5,p[1]+2],'rgba(255,230,160,.55)');ln([p[0]+2,p[1]],[p[0]+3,p[1]+2],'rgba(70,40,10,.4)');}}
  // lamellar vest: lit edges and gold rivets
  for(let row=0;row<4;row++){ln(T(-12,-25.5+row*5),T(-3,-25.5+row*5),'rgba(255,170,150,.45)');for(let i=0;i<3;i++)px(T(-10+i*3,-23+row*5)[0],T(-10+i*3,-23+row*5)[1],0.5,0.5,r.gold);}
  for(let row=0;row<4;row++)ln(T(5,-25.5+row*5),T(12,-25.5+row*5),'rgba(0,0,0,.3)');
  // belt engraving and scarf folds
  for(let x=-12;x<13;x+=4)ln(T(x,-4.5),T(x+1.5,-3.2),r.goldD);ln(T(-9,-29),T(9,-29),'rgba(255,255,255,.4)');
  // face: fur tufts, eye shine, a crisp circlet with its jewel
  const H=(x,y)=>[neck[0]+x,neck[1]+y+4];
  for(let i=0;i<6;i++){const a=Math.PI*(0.6+i*0.13);ln(H(0+Math.cos(a)*10,-11+Math.sin(a)*9),H(Math.cos(a)*13,-11+Math.sin(a)*12),'rgba(255,220,150,.55)');}
  px(H(1.5,-12)[0],H(1.5,-12)[1],0.5,0.5,'#FFFFFF');px(H(6.5,-12)[0],H(6.5,-12)[1],0.5,0.5,'#FFFFFF');
  ln(H(-10,-17.2),H(11,-17.2),'#FFF2B0');for(let x=-8;x<10;x+=3)px(H(x,-16.5)[0],H(x,-16.5)[1],1,0.5,r.goldD);px(H(3,-20.5)[0],H(3,-20.5)[1],1.5,1.5,'#C1121F');
  // staff: a smooth shaft with gold bands, redrawn over the stepped one
  {const ca=Math.cos(P.ang),sa=Math.sin(P.ang),gp=P.grip,nx=-sa,ny=ca;const A=[gp[0]-ca*P.bl,gp[1]-sa*P.bl],B=[gp[0]+ca*P.fl,gp[1]+sa*P.fl];
    const strip=(o0,o1,c)=>hiPoly(g,[[A[0]+nx*o0,A[1]+ny*o0],[B[0]+nx*o0,B[1]+ny*o0],[B[0]+nx*o1,B[1]+ny*o1],[A[0]+nx*o1,A[1]+ny*o1]],c);
    strip(1.6,0.6,r.staffD);strip(0.6,-0.4,r.staff);strip(-0.4,-1.4,'#E0384A');strip(-1.4,-1.8,'rgba(255,255,255,.35)');
    for(const d of [-P.bl,-P.bl+2.5,P.fl-5,P.fl-2.5]){const p=[gp[0]+ca*d,gp[1]+sa*d];hiPoly(g,[[p[0]+nx*2,p[1]+ny*2],[p[0]+ca*2.2+nx*2,p[1]+sa*2.2+ny*2],[p[0]+ca*2.2-nx*2,p[1]+sa*2.2-ny*2],[p[0]-nx*2,p[1]-ny*2]],r.gold);ln([p[0]-nx*2,p[1]-ny*2],[p[0]+ca*2.2-nx*2,p[1]+sa*2.2-ny*2],'#FFF2B0');}
    if(P.magic){glowD(B[0],B[1],12,'255,220,120',0.6);for(let d=20;d<P.fl;d+=6){const p=[gp[0]+ca*d,gp[1]+sa*d];glowD(p[0],p[1],4,'255,220,120',0.3);}}}
}

/* ===== HAYATE and KAGE in full HD: same geometry and effects, fine detail on top ===== */
function hdDrawHayate(g,f,fr,skin){
  hiDrawHayate(g,f,fr,skin);if((f.st==='ko'&&!f.air)||(f.flash>0&&f.flash%2===0))return;
  const r=HY[skin]||HY.h0;const {px,ln,glowD}=hdKit(g);const {P,k,T}=hiFrame(f,fr);const H=hiHands(f,P);const sf=T(8,-29);
  const spread=f.air||f.st==='win'||f.st==='special';const flap=Math.floor(fr/5)%2;const wb=T(-6,-28);
  // wing feathers: a quill line and a lit edge on every feather
  if(spread){for(let i=0;i<7;i++){const a=-2.3+i*0.22+(flap?0.08:0);const Lw=(34-i*2.5)*k;const e=[wb[0]+Math.cos(a)*Lw,wb[1]+Math.sin(a)*Lw];
      ln([wb[0]+Math.cos(a)*6,wb[1]+Math.sin(a)*6],[e[0]-Math.cos(a)*2,e[1]-Math.sin(a)*2],'rgba(255,255,255,.25)');ln([wb[0]+Math.cos(a)*8-Math.sin(a)*2,wb[1]+Math.sin(a)*8+Math.cos(a)*2],[e[0]-Math.sin(a)*1,e[1]+Math.cos(a)*1],'rgba(0,0,0,.35)');}}
  else{for(let i=0;i<5;i++){const y=wb[1]+4+i*4.2*k;ln([wb[0]-7+i*0.4,y],[wb[0]-2,y+3],'rgba(255,255,255,.22)');}}
  // breast feathers in scallops
  for(let r2=0;r2<4;r2++)for(let c=-2;c<=2;c++){const p=T(c*4+(r2%2)*2,-27+r2*5);ln([p[0]-2,p[1]-1],[p[0],p[1]+1],'rgba(0,0,0,.22)');ln([p[0],p[1]+1],[p[0]+2,p[1]-1],'rgba(0,0,0,.22)');}
  // robe folds, pompom shine and a knotted rope belt
  for(const y of [-24,-16,-9])ln(T(-12,y),T(12,y+1.5),'rgba(120,110,100,.3)');
  for(const [x,y] of [[-2,-26],[2,-20],[-2,-14]]){const p=T(x,y);px(p[0]-1,p[1]-1,1,0.5,'rgba(255,255,255,.7)');}
  ln(T(-15,-4.5),T(15,-4.5),'rgba(255,255,255,.3)');hiPoly(g,[T(9,-5),T(12,-5),T(13,3),T(10,3)],r.robeD);
  // head: tokin cap ties, eye shine, beak nostril and a lit ridge
  const hd=T(2,-40);const Q=(x,y)=>[hd[0]+x*k,hd[1]+y*k];
  ln(Q(-3,-7),Q(-7,-2),'#1A1A24',0.8);ln(Q(4,-7),Q(6,-2),'#1A1A24',0.8);px(Q(2.6,-2.6)[0],Q(2.6,-2.6)[1],0.5,0.5,'#FFFFFF');
  ln(Q(6,-1.5),Q(18,1),'rgba(255,240,180,.7)');px(Q(9,0)[0],Q(9,0)[1],1,0.5,r.beakD);
  for(let i=0;i<5;i++)ln(Q(-7+i*0.5,-6+i*2),Q(-10+i*0.4,-4+i*2.2),'rgba(255,255,255,.18)');
  // leaf fan: veins
  const lf=[H.hf[0]+(P.strike?4:2),H.hf[1]-(P.strike?2:10)];for(const [a,b] of [[[0,-6],[5,-3]],[[0,-2],[5,2]],[[0,-6],[-4,-4]],[[0,-1],[-2,3]]])ln([lf[0]+a[0],lf[1]+a[1]],[lf[0]+b[0],lf[1]+b[1]],r.leafD);
  if(P.strike)for(let i=0;i<3;i++){const y=lf[1]-8+i*6;glowD(sf[0]+(lf[0]-sf[0])*0.6,y,5,'255,255,255',0.25);}
}
function hdDrawKage(g,f,fr,skin){
  hiDrawKage(g,f,fr,skin);if((f.st==='ko'&&!f.air)||(f.flash>0&&f.flash%2===0))return;
  const r=KG[skin]||KG.q0;const {px,ln,glowD}=hdKit(g);const {P,k,T}=hiFrame(f,fr);const H=hiHands(f,P);const hov=-4-Math.round(Math.sin(fr*0.08)*2);
  const TT=(x,y)=>{const p=T(x,y);return[p[0],p[1]+hov];};const sf=TT(8,-29);
  // hair: long strands that sway, with a cold sheen
  const hb0=TT(-6,-48);for(let i=0;i<9;i++){const x=hb0[0]-8+i*1.8;const sway=Math.sin(fr*0.06+i*0.7)*1.5;ln([x,hb0[1]+2],[x-2+sway,hb0[1]+42*k],i%3?'rgba(60,60,90,.55)':'rgba(140,140,190,.35)');}
  // kimono: soft vertical folds, a pale sheen, and a frayed hem with tatters
  const top=TT(0,-30);const bot=P.hip[1]+hov+4;
  for(const x of [-8,-3,3,8]){ln([top[0]+x*0.8,top[1]+4],[top[0]+x*1.5,bot-2],x<0?'rgba(255,255,255,.35)':'rgba(90,90,130,.35)');}
  for(let x=-18;x<=18;x+=3){const len=3+((x*5+(fr>>3))%4+4)%4;ln([top[0]+x*k,bot],[top[0]+x*k+0.6,bot+len+1],'rgba(160,160,190,.5)');}
  // obi knot and a sash cord
  hiPoly(g,[TT(5,-18.5),TT(9,-18.5),TT(10,-12),TT(6,-12)],r.obi);ln(TT(-11,-16),TT(11,-16),'rgba(255,255,255,.25)');
  // face: one glowing red eye under the hair, and a faint purple aura
  const hd=TT(2,-40);for(const x of [-4,-1,2,5])ln([hd[0]+x*k,hd[1]-4*k],[hd[0]+x*k-0.5,hd[1]+(10+Math.abs(x))*k],'rgba(40,40,70,.6)');
  if(f.st!=='hurt'){glowD(hd[0]+3*k,hd[1],5,'255,59,48',0.55);px(hd[0]+2.5*k,hd[1]-0.5*k,1,1,'#FFD0C8');}
  glowD(hd[0],hd[1]+16,26,'155,89,208',f.st==='special'?0.22:0.08);
  // long sleeve folds and pale nails
  const hf=[H.hf[0],H.hf[1]+hov];const e=hiElbow(sf,hf,13*k,true);ln([e[0]-4,e[1]+2],[e[0]-2,e[1]+10],'rgba(90,90,130,.45)');ln([e[0]+1,e[1]+1],[e[0]+2,e[1]+10],'rgba(255,255,255,.35)');
  for(const dy of [-3,0,3])ln([hf[0]+3,hf[1]+dy+0.5],[hf[0]+8.5,hf[1]+dy+0.8],'rgba(255,255,255,.8)');
}

/* ===== GENBU and ENMA in full HD: same geometry and effects, fine detail on top ===== */
function hdDrawGenbu(g,f,fr,skin){
  hiDrawGenbu(g,f,fr,skin);if((f.st==='ko'&&!f.air)||(f.flash>0&&f.flash%2===0))return;
  const r=GB[skin]||GB.g0;const {px,ln,glowD}=hdKit(g);const {P,k,T}=hiFrame(f,fr);const H=hiHands(f,P);
  // shell: dark seams between plates, growth rings and a lit rim
  const sc=T(-10,-18);
  for(const [dx,dy] of [[-4,-12],[4,-12],[-6,-2],[2,-2],[-4,8],[4,8]]){const x=sc[0]+dx*k,y=sc[1]+dy*k;
    const hex=[[x-4,y],[x-2,y-3],[x+2,y-3],[x+4,y],[x+2,y+3],[x-2,y+3]];for(let i=0;i<6;i++)ln(hex[i],hex[(i+1)%6],r.sh2,0.6);
    ln([x-2.5,y],[x-1.2,y-1.8],'rgba(255,240,200,.5)');ln([x-1.6,y+0.6],[x+1.6,y+0.6],'rgba(90,60,20,.35)');}
  for(let a=-2.4;a<-0.4;a+=0.05){const xx=sc[0]+1+Math.cos(a)*13*k,yy=sc[1]+Math.sin(a)*13*k*1.22;px(xx,yy,0.5,0.5,'rgba(255,230,170,.6)');}
  // skin: scale dots on the limbs
  for(const [a,b] of [[P.kb,P.fb],[P.kf,P.ff]]){const dx=b[0]-a[0],dy=b[1]-a[1];for(let q=0.15;q<0.85;q+=0.17)for(const s of [-2,2]){const p=[a[0]+dx*q+s,a[1]+dy*q];px(p[0],p[1],1,0.5,'rgba(255,255,255,.22)');px(p[0],p[1]+0.5,1,0.5,'rgba(0,40,10,.35)');}}
  // belly plates: lit tops, sash knot
  for(const y of [-22,-16,-10])ln(T(-4,y-0.6),T(10,y-0.6),'rgba(255,255,255,.4)');ln(T(-15,-5.5),T(15,-5.5),'rgba(255,255,255,.3)');hiPoly(g,[T(10,-6),T(13,-6),T(14,3),T(11,3)],r.sash);
  // head: dish shine, beak ridge, eye shine, hair strands
  const hd=T(2,-40);const Q=(x,y)=>[hd[0]+x*k,hd[1]+y*k];
  ln(Q(-4,-12.2),Q(2,-12.6),'rgba(255,255,255,.7)');ln(Q(6.5,0),Q(14,2),'rgba(255,240,180,.7)');px(Q(2.6,-3.6)[0],Q(2.6,-3.6)[1],0.5,0.5,'#FFFFFF');
  for(let i=-9;i<=9;i+=3)ln(Q(i,-7.5),Q(i+0.5,-5),'rgba(0,0,0,.35)');
  // water: glowing drops on the palm strike and the counter ring
  if(P.strike)for(let i=0;i<8;i+=2){const a=-1+i*0.28;glowD(H.hf[0]+6+Math.cos(a)*9,H.hf[1]+Math.sin(a)*9,4,'127,231,255',0.45);}
  if(f.st==='special'){const cs=CH.kappa.special;if(f.t>=cs.from&&f.t<=cs.to){const c0=T(2,-26);for(let q=0;q<6;q++){const aa=q*1.047+fr*0.12;glowD(c0[0]+Math.cos(aa)*28*k,c0[1]+Math.sin(aa)*32*k,5,'127,231,255',0.5);}}}
}
function hdDrawEnma(g,f,fr,skin){
  hiDrawEnma(g,f,fr,skin);if((f.st==='ko'&&!f.air)||(f.flash>0&&f.flash%2===0))return;
  const r=EM[skin]||EM.e0;const {px,ln,glowD}=hdKit(g);const {P,k,T}=hiFrame(f,fr);const c=CH.enma,st=f.st,t=f.t;
  // the same club pose as the classic drawing
  let grip=[14*k,-40*k],ang=-1.45,len=46*k;
  if(st==='punch'){const a=c.punch,reach=a.reach*GEO*1.5;if(t<=a.s){grip=[-2*k,-62*k];ang=-2.3;}else if(t<=a.s+a.a+3){grip=[22*k,-44*k];ang=0.28;len=reach-22*k;}else{grip=[18*k,-32*k];ang=0.75;}}
  else if(st==='block'){grip=[16*k,-60*k];ang=1.57;len=44*k;}else if(st==='special'){grip=[14*k,-36*k];ang=-1.2;}else if(st==='win'){grip=[6*k,-78*k];ang=-1.4;}
  else if(st==='hurt'){grip=[10*k,-30*k];ang=0.9;}else if(st==='kick'){grip=[4*k,-44*k];ang=-1.8;}
  // robe: deep folds, gold embroidered hem and collar, belt plaque engraving
  for(const x of [-14,-7,7,14])ln(T(x*0.85,-30),T(x*1.15,-3),x<0?'rgba(255,200,160,.25)':'rgba(40,0,0,.35)');
  for(let x=-20;x<=20;x+=4){px(T(x,-10)[0],T(x,-10)[1],1,1,'#FFE08A');}ln(T(-21,-11.6),T(21,-11.6),'#FFF2B0');for(let y=-11;y<0;y+=2.5)ln(T(-2.5,y),T(2.5,y),'rgba(120,70,0,.5)');
  ln(T(-5,-31.5),T(-2,-20.5),r.gold||'#FFC93A',0.7);ln(T(5,-31.5),T(2,-20.5),r.gold||'#FFC93A',0.7);
  // face: fierce brows, eye glow, beard strands, crown jewel
  const hd=T(2,-42);const Q=(x,y)=>[hd[0]+x*k,hd[1]+y*k];
  glowD(Q(-2.5,-2)[0],Q(-2.5,-2)[1],4,'255,220,80',0.35);glowD(Q(5.5,-2)[0],Q(5.5,-2)[1],4,'255,220,80',0.35);
  ln(Q(-7,-6.5),Q(-1,-4.5),'#1A0506',0.8);ln(Q(9,-6.5),Q(3,-4.5),'#1A0506',0.8);
  for(let i=0;i<9;i++){const x=-9+i*2.2;ln(Q(x,2),Q(x*0.7,13+(i%3)*1.5),i%2?'rgba(255,255,255,.18)':'rgba(0,0,0,.3)');}
  px(Q(-0.5,-17.5)[0],Q(-0.5,-17.5)[1],1.5,1.5,'#C1121F');ln(Q(-9,-21.5),Q(9,-21.5),'rgba(255,255,255,.3)');
  // kanabo: a smooth iron club with studs, redrawn over the stepped one
  const ca=Math.cos(ang),sa=Math.sin(ang),nx=-sa,ny=ca;const at=d=>[grip[0]+ca*d,grip[1]+sa*d];
  const seg=(d0,d1,w0,w1,col)=>{const a=at(d0),b=at(d1);hiPoly(g,[[a[0]+nx*w0,a[1]+ny*w0],[b[0]+nx*w1,b[1]+ny*w1],[b[0]-nx*w1,b[1]-ny*w1],[a[0]-nx*w0,a[1]-ny*w0]],col);};
  seg(-10,6,1.6,1.6,'#4A2A18');for(let d=-9;d<5;d+=2.5){const p=at(d);ln([p[0]+nx*1.6,p[1]+ny*1.6],[p[0]-nx*1.6,p[1]-ny*1.6],'#8A5A30',0.6);}
  seg(6,len,2,3.6,'#3A3A46');seg(6,len,1.2,2.4,'#55556A');{const a=at(6),b=at(len);ln([a[0]-nx*1.6,a[1]-ny*1.6],[b[0]-nx*3,b[1]-ny*3],'rgba(255,255,255,.3)');}
  for(let d=9;d<len-2;d+=5){const w=2+Math.min(1.6,d/12);for(const s of [-1,1]){const p=at(d);hiPoly(g,[[p[0]+nx*s*w,p[1]+ny*s*w],[p[0]+nx*s*(w+1.6)+ca*0.6,p[1]+ny*s*(w+1.6)+sa*0.6],[p[0]+ca*1.4+nx*s*w,p[1]+sa*1.4+ny*s*w]],'#C8C8D4');}}
  // hellfire charge glow
  if(st==='special'){const hbk=[-18*k,-58*k];glowD(hbk[0],hbk[1]-10,10+Math.min(8,t/2),'255,120,40',0.5);}
}
