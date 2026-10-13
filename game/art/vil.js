
/* ===== clean stone paths: a band with dark edges and stones laid along the direction ===== */
let VPATHS=null;
function vilPath(g,x0,y0,x1,y1,w){if(VPATHS){const t=g.getTransform();VPATHS.push([(t.a*x0+t.e)/2,(t.d*y0+t.f)/2,(t.a*x1+t.e)/2,(t.d*y1+t.f)/2,w]);return;}const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy);if(L<1)return;const ux=dx/L,uy=dy/L,nx=-uy,ny=ux;const P=(t,o)=>[x0+ux*t+nx*o,y0+uy*t+ny*o];
  hiPoly(g,[P(-2,w/2+1),P(L+2,w/2+1),P(L+2,-w/2-1),P(-2,-w/2-1)],'#6E6252');hiPoly(g,[P(-2,w/2),P(L+2,w/2),P(L+2,-w/2),P(-2,-w/2)],'#8E7E6A');
  const cols=['#B0A08A','#A6967E','#BCAC94','#A89A84'];let k=0;
  for(const lane of [-0.25,0.25])for(let t=1+(lane>0?2.8:0);t<L-1;t+=5.6){const c=P(t,lane*w),hl=2.4,hw=w*0.2;
    hiPoly(g,[[c[0]-ux*hl+nx*hw,c[1]-uy*hl+ny*hw],[c[0]+ux*hl+nx*hw,c[1]+uy*hl+ny*hw],[c[0]+ux*hl-nx*hw,c[1]+uy*hl-ny*hw],[c[0]-ux*hl-nx*hw,c[1]-uy*hl-ny*hw]],cols[(k++)%4]);
    g.fillStyle='rgba(255,255,255,.18)';g.fillRect(c[0]-0.5,c[1]-hw+0.5,1,0.5);}}
/* ===== ONI VILLAGE: map, chibis (480-space pixels) ===== */
const VS=1.75,VTOP=330,VW0=1120,VH0=720,VW=Math.round(VW0*VS),VH=Math.round(VH0*VS),VOX=200,VOY=110; // the village is laid out on the old 1120x720 plan, then spread out by VS
const VPIECES={
 dojo:[464,216,644,334,560,316], gate:[338,220,462,318,401,318], lords:[628,222,782,316,705,312], market:[288,318,446,420,374,406],
 tenka:[676,300,826,418,753,408], home:[316,420,448,536,380,504], arena:[676,420,826,518,750,506], plaza:[426,316,694,506,560,386],
 pond:[770,497,930,590,850,542], bench:[648,510,720,550,684,530], champs:[8,232,212,458,110,470], prison:[868,226,1114,458,1010,470],
 bridge:[512,632,608,700,560,666], sign:[500,520,580,570,518,530]};
const VTREES=[[60,560],[150,620],[1080,560],[420,630],[300,600],[240,490]];

const TK={cx:1470,cy:640,rx:126,ry:90,gate:[1470,752],from:[753*VS,408*VS]};
function drawTenkaArena(g,t){const {cx,cy,rx,ry}=TK;
  const E=(x,y,a,b,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,a,b,0,0,6.283);g.fill();};
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};let s=17;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647;};
  E(cx,cy+ry+6,rx+12,22,'rgba(0,0,0,.35)');
  // outer wall: top rim, then the front face with arches
  E(cx,cy+16,rx+6,ry+6,'#7A86A8');E(cx,cy,rx+7,ry+7,'#FFC93A');E(cx,cy,rx+5,ry+5,'#EEF4FC');E(cx,cy,rx,ry,'#C8D4EA');
  g.save();g.beginPath();g.ellipse(cx,cy+16,rx+6,ry+6,0,0,Math.PI);g.lineTo(cx-rx-6,cy);g.ellipse(cx,cy,rx+6,ry+6,0,Math.PI,0,true);g.closePath();g.clip();
  R(cx-rx-8,cy,2*rx+16,ry+30,'#DCE6F4');for(let a=0.06;a<Math.PI-0.03;a+=0.09){const x=cx+Math.cos(a)*(rx+4),y=cy+Math.sin(a)*(ry+4);
    g.fillStyle=((a*100)|0)%2?'#9FE8FF':'#C49BFF';g.globalAlpha=.55;g.beginPath();g.moveTo(x,y+1);g.lineTo(x+3.5,y+6);g.lineTo(x,y+12);g.lineTo(x-3.5,y+6);g.closePath();g.fill();g.globalAlpha=1;g.fillStyle='#FFFFFF';g.fillRect(x-1,y+3,1,2);}
  R(cx-rx-8,cy+ry+10,2*rx+16,2,'#FFC93A');g.restore();
  // seats: rings of crowd, darker toward the field
  const rings=[[0.97,'#4A5A82'],[0.88,'#3E4C74'],[0.79,'#344068'],[0.70,'#2A345C']];
  for(const [k,c] of rings)E(cx,cy,rx*k,ry*k,c);
  const CROWD=['#FFE08A','#FF6A5A','#9FE8FF','#C49BFF','#FFFFFF','#7FD6A0','#FFB000'];
  for(let i=0;i<900;i++){const a=rnd()*6.283,r=0.66+rnd()*0.31;const x=cx+Math.cos(a)*rx*r,y=cy+Math.sin(a)*ry*r;g.fillStyle=CROWD[(rnd()*CROWD.length)|0];g.fillRect(x,y,1.2,1.2);}
  // the field
  E(cx,cy+2,rx*0.62,ry*0.6,'#2A2030');E(cx,cy,rx*0.6,ry*0.58,'#D8C49A');E(cx,cy,rx*0.6-3,ry*0.58-3,'#E6D4AA');
  g.strokeStyle='rgba(120,90,50,.45)';g.lineWidth=1;g.beginPath();g.ellipse(cx,cy,rx*0.36,ry*0.34,0,0,6.283);g.stroke();
  g.fillStyle='#5AB8D8';g.beginPath();g.moveTo(cx,cy-14);g.lineTo(cx+12,cy);g.lineTo(cx,cy+14);g.lineTo(cx-12,cy);g.closePath();g.fill();
  g.fillStyle='#BFF4FF';g.beginPath();g.moveTo(cx,cy-14);g.lineTo(cx+4,cy);g.lineTo(cx,cy+14);g.lineTo(cx-4,cy);g.closePath();g.fill();
  // banners on the rim
  const BAN=['#9FE8FF','#C49BFF','#FFFFFF','#FFC93A'];for(let i=0;i<14;i++){const a=Math.PI+0.12+i*(Math.PI-0.24)/13;const x=cx+Math.cos(a)*(rx+2),y=cy+Math.sin(a)*(ry+2);R(x-0.5,y-14,1,14,'#2A2436');R(x+0.5,y-14,5,8,BAN[i%4]);R(x+0.5,y-7,5,1,'rgba(0,0,0,.3)');}
  // four light pylons with beams
  for(const [px,py] of [[cx-rx-2,cy-30],[cx+rx+2,cy-30],[cx-rx+20,cy+ry-10],[cx+rx-20,cy+ry-10]]){
    const gr=g.createLinearGradient(px,py-60,px,py);gr.addColorStop(0,'rgba(159,232,255,0)');gr.addColorStop(1,'rgba(159,232,255,.35)');g.fillStyle=gr;g.beginPath();g.moveTo(px-2,py-8);g.lineTo(px-12,py-70);g.lineTo(px+12,py-70);g.lineTo(px+2,py-8);g.fill();
    R(px-2,py-10,4,30,'#3A3448');R(px-4,py-14,8,5,'#E6FAFF');R(px-3,py-13,6,3,'#BFF4FF');}
  // the floating crystal above the north stands
  const kx=cx,ky=cy-ry-26;const gl=g.createRadialGradient(kx,ky,2,kx,ky,40);gl.addColorStop(0,'rgba(196,155,255,.55)');gl.addColorStop(1,'rgba(196,155,255,0)');g.fillStyle=gl;g.fillRect(kx-40,ky-40,80,80);
  const P=(pts,c)=>{g.fillStyle=c;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill();};
  P([[kx,ky-22],[kx+13,ky-4],[kx,ky+22],[kx-13,ky-4]],'#7FD6F0');P([[kx,ky-22],[kx,ky+22],[kx-13,ky-4]],'#BFF4FF');P([[kx,ky-22],[kx+13,ky-4],[kx+4,ky-4]],'#E6DCFF');P([[kx-13,ky-4],[kx+13,ky-4],[kx,ky+22]],'rgba(90,60,160,.25)');
  E(kx,ky+30,10,3,'rgba(196,155,255,.35)');for(let i=0;i<10;i++){const a=i*0.63,r=26+(i%3)*5;R(kx+Math.cos(a)*r,ky+Math.sin(a)*r*0.7,1.5,1.5,i%2?'#FFFFFF':'#BFF4FF');}
  // the gate: red pillars, gold beam, TENKA sign
  const gx=TK.gate[0],gy=cy+ry+4;
  for(const s of [-1,1]){const px=gx+s*24;g.fillStyle='#BFF4FF';g.beginPath();g.moveTo(px-4,gy+8);g.lineTo(px-4,gy-22);g.lineTo(px,gy-30);g.lineTo(px+4,gy-22);g.lineTo(px+4,gy+8);g.closePath();g.fill();R(px-4,gy-22,2,30,'#FFFFFF');R(px+2,gy-22,2,30,'#7FD6F0');}
  R(gx-34,gy-32,68,6,'#FFC93A');R(gx-34,gy-32,68,2,'#FFF2B0');R(gx-30,gy-26,60,3,'#C88A00');
  R(gx-20,gy-22,40,30,'#14101A');{const gg=g.createLinearGradient(0,gy-20,0,gy+8);gg.addColorStop(0,'rgba(159,232,255,.55)');gg.addColorStop(1,'rgba(196,155,255,.15)');g.fillStyle=gg;g.fillRect(gx-18,gy-20,36,28);}
  R(gx-30,gy-48,60,14,'#FFC93A');R(gx-28,gy-46,56,10,'#14101A');g.fillStyle='#BFF4FF';g.font='bold 8px "Press Start 2P", monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('TENKA',gx,gy-40.5);
  R(gx-40,gy+8,80,6,'#9A94AE');R(gx-40,gy+8,80,2,'#BAB4CE');
}

function drawBattleHall(g){const [dx,dy]=vpD('arena');const X=750+dx,Y=506+dy;  // door point
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(X+x,Y+y,w,h);};const P=(pts,c)=>{g.fillStyle=c;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(X+p[0],Y+p[1]):g.moveTo(X+p[0],Y+p[1]));g.closePath();g.fill();};
  g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(X,Y+2,76,8,0,0,6.283);g.fill();
  // stone base and steps
  R(-70,-8,140,8,'#8E8498');R(-70,-8,140,2,'#B4AABE');R(-22,-4,44,6,'#A49AB0');R(-18,0,36,3,'#C4BAD0');
  // walls, pillars, windows
  R(-60,-40,120,32,'#F2E8D6');R(-60,-40,120,3,'#D8CCB4');for(const x of [-60,-38,-16,12,34,56])R(x,-42,5,34,'#B3161F');for(const x of [-60,-38,-16,12,34,56])R(x+1,-42,1,34,'#E0384A');
  for(const x of [-33,22])for(let k=0;k<3;k++)R(x+k*4,-34,3,16,'#E8DCC0'),R(x+k*4,-34,3,1,'#9A8A70');
  // the open entrance with a glowing ring inside
  R(-14,-36,28,32,'#1A0E10');{const gr=g.createRadialGradient(X,Y-16,2,X,Y-16,18);gr.addColorStop(0,'rgba(255,170,60,.85)');gr.addColorStop(1,'rgba(255,170,60,0)');g.fillStyle=gr;g.fillRect(X-14,Y-36,28,32);}
  g.strokeStyle='#FFC93A';g.lineWidth=1;g.beginPath();g.ellipse(X,Y-10,9,3,0,0,6.283);g.stroke();
  // lower roof with gold edges
  P([[-78,-40],[78,-40],[66,-54],[-66,-54]],'#2A2430');P([[-78,-40],[78,-40],[76,-43],[-76,-43]],'#FFC93A');for(let x=-70;x<70;x+=6)R(x,-52,1,10,'#3E3646');
  P([[-82,-42],[-72,-40],[-78,-36]],'#FFC93A');P([[82,-42],[72,-40],[78,-36]],'#FFC93A');
  // upper floor and roof
  R(-36,-66,72,13,'#F2E8D6');for(const x of [-36,-14,10,32])R(x,-67,4,14,'#B3161F');R(-6,-64,12,9,'#1A0E10');
  P([[-50,-66],[50,-66],[38,-80],[-38,-80]],'#2A2430');P([[-50,-66],[50,-66],[48,-69],[-48,-69]],'#FFC93A');for(let x=-44;x<44;x+=6)R(x,-78,1,10,'#3E3646');
  P([[-54,-68],[-44,-66],[-50,-62]],'#FFC93A');P([[54,-68],[44,-66],[50,-62]],'#FFC93A');R(-2,-86,4,7,'#FFC93A');R(-1,-89,2,3,'#FFF2B0');
  // sign with crossed swords
  R(-50,-58,100,13,'#FFC93A');R(-49,-57,98,11,'#3A1014');g.strokeStyle='#E6EEF6';g.lineWidth=1.2;g.beginPath();g.moveTo(X-46,Y-48);g.lineTo(X-38,Y-56);g.moveTo(X-46,Y-56);g.lineTo(X-38,Y-48);g.stroke();
  g.fillStyle='#FFE08A';g.font='bold 6px "Press Start 2P", monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('1V1 BATTLE',X+5,Y-51.5);
  // banners and lanterns
  for(const s of [-1,1]){R(s*68-1,-62,2,56,'#2A1A10');R(s*68+(s<0?-9:1),-60,8,22,'#B3161F');R(s*68+(s<0?-9:1),-40,8,2,'#FFC93A');g.fillStyle='#FFE08A';g.font='bold 6px serif';g.fillText('⚔',X+s*68+(s<0?-5:5),Y-50);
    R(s*44-3,-24,6,8,'#FF8A3C');R(s*44-2,-23,4,6,'#FFD08A');R(s*44-3,-26,6,2,'#1A0E10');}
}
function vpD(id){const p=VPIECES[id];return[p[4]*(VS-1),p[5]*(VS-1)];}
const VZONE_PIECE={dojo:'dojo',gate:'gate',lords:'lords',market:'market',shrine:'tenka',home:'home',arena:'arena',cauldrons:'plaza',champs:'champs'};
const VZ0=[ // interaction zones: door positions and what they open
 {id:'dojo',x:360,y:206,label:'Enter the Dojo'},{id:'gate',x:201,y:208,label:'Face Enma'},{id:'lords',x:505,y:202,label:'Hall of Lords'},
 {id:'market',x:174,y:296,label:'Oni Market'},{id:'shrine',x:553,y:298,label:'Tenka'},{id:'home',x:180,y:394,label:'Your home'},
 {id:'arena',x:550,y:396,label:'1v1 Battle'},{id:'cauldrons',x:360,y:302,label:'The Cauldrons'}];
const VZ_OLD=VZ0.map(z=>Object.assign({},z,{x:z.x+VOX,y:z.y+VOY})).concat([{id:'champs',x:110,y:470,label:'Season champions'}]);
let VZ=[];
const VBLOCK0=[[462,410,44,20],[300,130,120,70],[160,140,82,60],[455,138,100,58],[130,232,88,58],[505,226,96,66],[140,338,80,50],[500,336,100,54]];
const VCIRC=[[322,282,24],[398,282,24]];
const VBLOCK_NEW=[[20,256,180,124],[30,388,160,46],[930,246,170,140],[880,388,48,26],[914,392,180,40]];
let VBLK=[],VCIR=[],VPOND=[0,0];
function vilInitLayout(){const sh=(id,x,y)=>{const [dx,dy]=vpD(id);return[x+dx,y+dy];};
  VZ=VZ_OLD.map(z=>{const [x,y]=sh(VZONE_PIECE[z.id]||'plaza',z.x,z.y);return Object.assign({},z,{x,y});});
  const owner0=['bench','dojo','gate','lords','market','tenka','home','arena'];
  VBLK=VBLOCK0.map(([bx,by,bw,bh],i)=>{const [x,y]=sh(owner0[i],bx+VOX,by+VOY);return[x,y,bw,bh];}).concat(VBLOCK_NEW.map(([bx,by,bw,bh],i)=>{const [x,y]=sh(i<2?'champs':'prison',bx,by);return[x,y,bw,bh];}));
  {const z=VZ.find(q=>q.id==='shrine');if(z){z.x=TK.gate[0];z.y=TK.gate[1];}VBLK[5]=[TK.cx-TK.rx-6,TK.cy-TK.ry-6,2*TK.rx+12,2*TK.ry+4];{const [adx,ady]=vpD('arena');VBLK[7]=[750+adx-72,506+ady-46,144,40];}}
  VCIR=VCIRC.map(([cx,cy,r])=>{const [x,y]=sh('plaza',cx+VOX,cy+VOY);return[x,y,r];});VPOND=sh('pond',650+VOX,432+VOY);}
function vilBlocked(x,y){if(x<10||x>VW-10||y<VTOP||y>VH-8)return true;
  for(const [bx,by,bw,bh] of VBLK)if(x>bx-4&&x<bx+bw+4&&y>by&&y<by+bh)return true;
  const sy=652*VS,bx=560*VS;if(y>sy-2&&y<sy+30&&!(x>bx-30&&x<bx+30))return true;   // the stream, crossable only on the bridge
  for(const [cx,cy,r] of VCIR)if(Math.hypot(x-cx,(y-cy)*1.8)<r)return true;
  if(Math.hypot(x-VPOND[0],(y-VPOND[1])*2)<66)return true;return false;}
vilInitLayout();
let VNOGROUND=false;
function buildVillageBGOld(){
  const cv=document.createElement('canvas');cv.width=VW0*2;cv.height=VH0*2;const g0=cv.getContext('2d');g0.imageSmoothingEnabled=false;g0.setTransform(2,0,0,2,0,0);
  buildVillageOuter(g0);g0.save();g0.translate(VOX,VOY);const g=g0;
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};const P=(x,y,c)=>R(x,y,1,1,c);
  const poly=(pts,c)=>hiPoly(g,pts,c);
  const disc=(cx,cy,r,c,sy)=>{sy=sy||1;g.fillStyle=c;for(let dy=-Math.round(r*sy);dy<=Math.round(r*sy);dy++){const w=Math.round(r*Math.sqrt(Math.max(0,1-(dy/(r*sy))**2)));g.fillRect(Math.round(cx-w),Math.round(cy+dy),w*2+1,1);}};
  let seed=21;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const glow=(x,y,r,rgb,a)=>{for(let k=10;k>=1;k--){g.fillStyle=`rgba(${rgb},${a})`;g.beginPath();g.ellipse(x,y,r*k/10,r*k/10*0.75,0,0,Math.PI*2);g.fill();}};
  if(VNOGROUND)g.globalAlpha=0;
  R(0,0,720,470,'#3F6A46');for(let i=0;i<6500;i++){const x=rnd()*720,y=rnd()*470;P(x,y,rnd()<0.45?'#4A7A50':rnd()<0.6?'#365C3C':'#5A8E5E');}
  for(let i=0;i<420;i++){const x=rnd()*720,y=rnd()*470;P(x,y,'#7AB070');P(x+1,y-1,'#6AA062');}
  for(let i=0;i<90;i++){const x=rnd()*720,y=120+rnd()*350;P(x,y,rnd()<0.5?'#F4E4A0':'#FFB7D0');}
  R(0,0,720,108,'#2A4A30');for(let i=0;i<800;i++)P(rnd()*720,rnd()*108,rnd()<0.5?'#335A38':'#24402A');
  g.globalAlpha=1;
  function path(x0,y0,x1,y1,w){vilPath(g,x0,y0,x1,y1,w);return;const L=Math.hypot(x1-x0,y1-y0);for(let i=0;i<=L;i+=2){const x=x0+(x1-x0)*i/L,y=y0+(y1-y0)*i/L;R(x-w/2,y-w/2,w,w,'#8A7A68');}
    for(let i=0;i<=L;i+=9){const x=x0+(x1-x0)*i/L,y=y0+(y1-y0)*i/L;R(x-w/2+2+(i%18?0:4),y-w/2+2,w/2-2,w/2-2,'#A08E7A');R(x+1,y+1,w/2-3,w/2-3,'#96846E');}}
  const PX=360,PY=288;
  path(PX,PY,PX,200,28);path(PX,PY,210,PY,28);path(PX,PY,530,PY,28);path(PX,PY,PX,460,28);path(PX,PY,505,200,22);path(PX,PY,205,205,22);path(PX,PY,180,392,22);path(PX,PY,550,392,22);
  disc(PX,PY,98,'#6A5C4E',0.6);disc(PX,PY,94,'#B0A088',0.6);
  for(let r=18;r<94;r+=14)for(let a=0;a<6.28;a+=0.04)P(PX+Math.cos(a)*r,PY+Math.sin(a)*r*0.6,'#8E7E6A');
  for(let a=0;a<6.28;a+=0.26)for(let r=10;r<94;r+=2)P(PX+Math.cos(a)*r,PY+Math.sin(a)*r*0.6,'#A08E78');
  // raised stone dais for the cauldrons
  disc(PX,PY-6,64,'#5A4C40',0.42);disc(PX,PY-9,62,'#8E7E6A',0.4);disc(PX,PY-11,58,'#C8B89C',0.38);for(let a=0;a<6.28;a+=0.2)P(PX+Math.cos(a)*50,PY-11+Math.sin(a)*19,'#A8987E');
  for(const s of [-1,1]){R(PX-14+s*0,PY+13,28,3,'#8E7E6A');R(PX-12,PY+16,24,3,'#6A5C4E');}
  disc(650,432,72,'#2A5A7A',0.5);disc(650,432,68,'#3A7AA8',0.5);for(let i=0;i<80;i++){const a=rnd()*6.28,d=rnd()*62;P(650+Math.cos(a)*d,432+Math.sin(a)*d*0.5,'#8AC8E8');}
  for(const [lx,ly] of [[612,424],[680,438],[636,446]]){disc(lx,ly,5,'#4E9A4A',0.5);P(lx,ly-1,'#FFB7D0');}
  disc(668,424,8,'#C1121F',0.5);for(const [kx,ky,c] of [[620,444,'#FF8A2A'],[640,422,'#F3E9E4'],[688,444,'#FF8A2A']]){R(kx,ky,4,2,c);P(kx+4,ky,c);}
  function tree(x,y,sak){R(x-2,y-10,5,12,'#3A2018');const c=sak?['#FFB7D0','#FF8FB8','#FFD8E6']:['#1F4A2A','#2A5A34','#163A20'];
    for(let i=0;i<80;i++){const a=rnd()*6.28,d=rnd()*17;R(x+Math.cos(a)*d*1.2,y-21+Math.sin(a)*d*0.9,3,3,c[Math.floor(rnd()*3)]);}g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(x+3,y+2,14,4,0,0,6.28);g.fill();}
  for(const [tx,ty,s] of [[262,244,1],[458,244,1],[262,362,1],[458,362,1],[40,380,0]])tree(tx,ty,s);
  function bldg(x,y,w,h,roofH,wall,roof,roofL,sign,opt){
    opt=opt||{};const F=(px,py,ww,hh,c)=>{g.fillStyle=c;g.fillRect(Math.round(px*2)/2,Math.round(py*2)/2,ww,hh);};
    const plaster=opt.plaster||'#EFE4CC',noren=opt.noren||'#1B3A6A',stone=opt.stone;
    // ground shadow
    g.fillStyle='rgba(0,0,0,.32)';g.fillRect(x+3,y+h,w+2,5);
    // stone foundation
    const fh=Math.max(5,Math.round(h*0.16));F(x-2,y+h-fh,w+4,fh,'#8A8078');for(let sx=x-2;sx<x+w+2;sx+=7){F(sx,y+h-fh,6.5,fh-0.5,'#9A9088');F(sx,y+h-fh,6.5,0.5,'#B8B0A8');F(sx+6.5,y+h-fh,0.5,fh,'#6A625C');}
    // walls: timber frame with plaster panels, or plain stone
    const wt=y,wb=y+h-fh;
    if(stone){F(x,wt,w,wb-wt,stone);for(let yy=wt+1;yy<wb;yy+=4)for(let xx=x+((Math.floor((yy-wt)/4))%2)*4;xx<x+w;xx+=8){F(xx,yy,7.5,3.5,'rgba(255,255,255,.07)');F(xx,yy+3.5,7.5,0.5,'rgba(0,0,0,.25)');}}
    else{F(x,wt,w,wb-wt,plaster);F(x,wt+(wb-wt)*0.62,w,(wb-wt)*0.38,wall);for(let yy=wt+(wb-wt)*0.62+2;yy<wb;yy+=2.5)F(x,yy,w,0.5,'rgba(0,0,0,.18)');
      for(let xx=x;xx<=x+w-2;xx+=Math.max(14,w/6))F(xx,wt,2,wb-wt,wall);F(x+w-2,wt,2,wb-wt,wall);F(x,wt+(wb-wt)*0.6,w,1.5,wall);F(x,wt+1.5,w,1.5,wall);}
    // eave shadow on the wall
    g.fillStyle='rgba(0,0,0,.22)';g.fillRect(x,wt,w,3.5);
    // door with noren curtain and steps
    const dw=Math.min(22,w*0.22),dx=x+w/2-dw/2,dt=wb-Math.min(24,(wb-wt)*0.82);
    F(dx-1,dt-1,dw+2,wb-dt+1,'#3A2414');F(dx,dt,dw,wb-dt,'#140A06');glow(x+w/2,wb-6,16,'255,170,80',0.04);
    const nw=dw/3;for(let k=0;k<3;k++){F(dx+k*nw+0.5,dt,nw-1,(wb-dt)*0.42,noren);F(dx+k*nw+0.5,dt,nw-1,0.5,'rgba(255,255,255,.35)');}
    g.fillStyle='rgba(255,255,255,.85)';g.beginPath();g.arc(x+w/2,dt+(wb-dt)*0.2,Math.min(3.5,nw*0.45),0,6.28);g.fill();g.fillStyle=noren;g.beginPath();g.arc(x+w/2,dt+(wb-dt)*0.2,Math.min(2,nw*0.25),0,6.28);g.fill();
    F(dx-4,y+h,dw+8,2,'#A8A098');F(dx-2,y+h+2,dw+4,1.5,'#8A8078');
    // hanging lanterns at the door
    for(const s of [-1,1]){const lx=x+w/2+s*(dw/2+5),ly=dt+3;F(lx-0.25,dt-2,0.5,2,'#2A1410');glow(lx,ly+3,10,'255,140,50',0.05);F(lx-2.5,ly,5,6,'#E0503A');F(lx-1.5,ly+1,3,4,'#FFD27A');F(lx-2.5,ly,5,0.5,'#2A1410');F(lx-2.5,ly+5.5,5,0.5,'#2A1410');}
    // tiled roof with upturned eaves, ridge and end tiles
    const rx0=x-9,rx1=x+w+9,ry=y+2,rt=y-roofH;
    poly([[rx0,ry],[rx1,ry],[x+w-3,rt],[x+3,rt]],roof);
    for(let yy=rt+2;yy<ry;yy+=2.5){const t=(yy-rt)/(ry-rt);const ax=x+3+(rx0-(x+3))*t,bx=x+w-3+(rx1-(x+w-3))*t;F(ax,yy,bx-ax,0.5,roofL);F(ax,yy+0.5,bx-ax,0.5,'rgba(0,0,0,.28)');
      for(let xx=ax+((Math.floor(yy)%2)*2);xx<bx;xx+=4)F(xx,yy-1.5,0.5,1.5,'rgba(0,0,0,.25)');}
    F(rx0,ry-1,rx1-rx0,2.5,roofL);F(rx0,ry+1.5,rx1-rx0,1,'rgba(0,0,0,.4)');
    poly([[rx0-4,ry-3],[rx0+2,ry-1],[rx0+2,ry+1.5],[rx0-2,ry+0.5]],roof);poly([[rx1+4,ry-3],[rx1-2,ry-1],[rx1-2,ry+1.5],[rx1+2,ry+0.5]],roof);
    F(x+1,rt-2.5,w-2,3,'#141820');F(x+1,rt-2.5,w-2,0.5,roofL);F(x-1,rt-4.5,5,6,'#141820');F(x+w-4,rt-4.5,5,6,'#141820');F(x,rt-4,1,1,roofL);F(x+w-3,rt-4,1,1,roofL);
    // sign plank
    if(sign){g.font='8px "Press Start 2P"';const sw=g.measureText(sign).width+14;const sy=rt-19;
      F(x+w/2-sw/2-2.5,sy-2.5,sw+5,17,'#2A1408');F(x+w/2-sw/2,sy,sw,12,'#C8962A');F(x+w/2-sw/2,sy,sw,1,'#FFE08A');F(x+w/2-sw/2,sy+11,sw,1,'#8A5A10');
      for(let k=0;k<3;k++)F(x+w/2-sw/2+2,sy+3+k*3,sw-4,0.5,'rgba(120,70,10,.25)');F(x+w/2-0.25,sy+12,0.5,5,'#2A1408');
      g.fillStyle='#2A1408';g.textAlign='center';g.textBaseline='middle';g.fillText(sign,x+w/2,sy+6.5);}
  }
  function win(x,y){const F=(px,py,ww,hh,c)=>{g.fillStyle=c;g.fillRect(px,py,ww,hh);};glow(x+6,y+5,14,'255,200,120',0.03);F(x-1,y-1,14,12,'#3A2414');F(x,y,12,10,'#FBE6B8');for(let k=1;k<4;k++)F(x+k*3,y,0.5,10,'#8A6A4A');F(x,y+3.3,12,0.5,'#8A6A4A');F(x,y+6.6,12,0.5,'#8A6A4A');F(x,y,12,1,'rgba(255,255,255,.5)');}
  function lantern(x,y){glow(x,y+4,24,'255,140,50',0.035);R(x-1,y,3,12,'#2A1410');R(x-3,y-6,7,7,'#E0503A');R(x-2,y-5,5,5,'#FFD27A');}
  bldg(300,158,120,44,28,'#5A3A22','#1E2230','#4A5070','DOJO',{noren:'#1B3A6A'});win(314,174);win(394,174);R(304,162,6,34,'#C1121F');R(410,162,6,34,'#C1121F');
  glow(200,178,60,'150,40,220',0.045);R(160,146,10,56,'#1A0B20');R(232,146,10,56,'#1A0B20');R(154,140,94,8,'#0E0612');R(170,152,62,50,'#0A0410');
  for(let i=0;i<34;i++)P(174+rnd()*54,156+rnd()*44,rnd()<0.5?'#9B59D0':'#FF3B30');disc(201,172,8,'#C1121F');R(197,170,3,2,'#FFE14A');R(203,170,3,2,'#FFE14A');
  bldg(455,160,100,38,22,'#4A4A58','#2A2E40','#5A6080','HALL OF LORDS',{stone:'#6A6878',noren:'#5A2A8A'});for(const [sx,c] of [[478,'#C8CCD8'],[505,'#FFC93A'],[532,'#C07A3A']]){R(sx-4,206,8,4,'#6A6A78');R(sx-3,194,6,12,c);R(sx-2,190,4,4,c);}
  bldg(130,252,88,40,20,'#6A3A1E','#5A1A12','#A03A22','MARKET',{noren:'#8E1015'});for(let k=0;k<6;k++)R(132+k*14,272,14,6,k%2?'#F3E9E4':'#C1121F');
  bldg(505,252,96,42,26,'#8E1015','#8E1015','#D03030','TENKA',{plaster:'#F6EEDC',noren:'#C1121F'});R(544,270,18,20,'#FFB000');glow(553,280,24,'255,190,60',0.03);R(492,280,6,28,'#C1121F');R(608,280,6,28,'#C1121F');R(488,276,130,4,'#1A0708');
  bldg(140,356,80,34,18,'#5A3A26','#2A2E40','#4A5070','HOME',{noren:'#2E6A4A'});win(150,368);win(198,368);
  bldg(500,356,100,36,20,'#3A2A2A','#8E1015','#D03030','ARENA 1V1',{plaster:'#E8DCC8',noren:'#1A1A22'});R(504,360,4,28,'#FFB000');R(592,360,4,28,'#FFB000');
  // Enma sign over the gate
  g.font='8px "Press Start 2P"';R(158,122,86,15,'#1A0B0C');R(160,124,82,11,'#9B59D0');g.fillStyle='#FFFFFF';g.textAlign='center';g.textBaseline='middle';g.fillText('ENMA',201,130);
  // pole lanterns removed: they read as stray torches once the village was spread out

  // ---- props that say what each building is
  {const F=(px,py,ww,hh,c)=>{g.fillStyle=c;g.fillRect(px,py,ww,hh);};
   // Dojo: straw training dummies and a rack of wooden swords
   for(const dx of [314,404]){F(dx-1,196,2,16,'#5A3A1E');for(let k=0;k<3;k++){F(dx-3,199+k*4,6,3,'#D8C080');F(dx-3,199+k*4,6,0.5,'#F0DCA0');F(dx-3,201.5+k*4,6,0.5,'#A88A50');}F(dx-4,197,8,1.5,'#5A3A1E');}
   F(286,184,10,1.5,'#5A3A1E');F(286,192,10,1.5,'#5A3A1E');F(286,184,1.5,22,'#5A3A1E');F(294.5,184,1.5,22,'#5A3A1E');for(let k=0;k<3;k++)F(288+k*2.6,180,1,26,'#C8A060');
   // Market: crates, a barrel and a mask stand
   for(const [cx,cy] of [[120,288],[124,296],[214,294]]){F(cx,cy,9,7,'#8A5A2A');F(cx,cy,9,1,'#B07A40');F(cx+4,cy,1,7,'#5A3A1A');F(cx,cy+3,9,0.5,'#5A3A1A');}
   F(224,286,7,10,'#6A4A2A');F(224,288,7,1,'#2A1A10');F(224,293,7,1,'#2A1A10');F(225,286,1,10,'#8A6A3A');
   F(110,262,1.5,24,'#5A3A1E');F(104,262,14,1.5,'#5A3A1E');for(const [mx,c] of [[105,'#D7262E'],[111,'#2F6FE0']]){F(mx,265,5,5,c);F(mx+1,266,1,1,'#1A0506');F(mx+3,266,1,1,'#1A0506');}
   // Hall of Lords: stone lanterns
   for(const lx of [446,562]){F(lx-3,192,6,8,'#8A8A94');F(lx-4,188,8,4,'#A8A8B2');F(lx-2,184,4,4,'#9A9AA4');F(lx-1,185,2,2,'#FFD27A');F(lx-5,182,10,2,'#7A7A84');F(lx-3,200,6,2,'#6A6A74');}
   // TENKA: a golden trophy on a plinth and gold banners
   F(514,294,14,8,'#8A8078');F(514,294,14,1,'#B0A8A0');F(517,284,8,8,'#FFC93A');F(516,282,10,3,'#FFE08A');F(519,292,4,2,'#C88A00');F(514,286,2,4,'#FFC93A');F(526,286,2,4,'#FFC93A');
   for(const bx of [498,604]){F(bx,240,1.5,22,'#5A3A1E');F(bx+1.5,242,7,14,'#FFC93A');F(bx+3,246,4,4,'#C1121F');}
   // Home: a small garden with a fence, a bonsai and stepping stones
   for(let fx=134;fx<226;fx+=5){if(fx>168&&fx<192)continue;F(fx,394,1.5,6,'#8A6A3A');}F(134,396,92,1,'#8A6A3A');
   F(224,384,6,4,'#8A4A2A');F(222,378,10,6,'#2E6A3A');F(224,375,6,4,'#3A7A44');
   for(const [sx,sy] of [[180,400],[176,406],[182,412]]){F(sx-2,sy,5,2.5,'#A8A098');F(sx-2,sy,5,0.5,'#C8C0B8');}
   // Arena: crossed swords over the door and red fighting banners
   for(const s of [-1,1]){for(let i=0;i<12;i++)F(550+s*(-5+i*0.85),344+i*0.85,1.2,1.2,'#DDE4EE');F(550+s*5-1,343,2,2,'#FFC93A');}
   for(const bx of [494,606]){F(bx,330,1.5,30,'#3A2418');F(bx+1.5,332,8,16,'#C1121F');F(bx+1.5,332,8,1,'#FF6A5A');F(bx+4,337,3,3,'#1A1A22');}
  }
  // bench by the pond
  R(464,420,40,4,'#6A4A2A');R(464,420,40,1,'#8A6A3A');R(466,424,3,6,'#4A2A1A');R(499,424,3,6,'#4A2A1A');R(464,412,40,3,'#6A4A2A');
  g0.restore();
  {const R2=(x,y,w,h,c)=>{g0.fillStyle=c;g0.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
   const path=(x0,x1,y,w)=>{for(let x=x0;x<x1;x+=2)R2(x,y-w/2,2,w,'#8A7A68');for(let x=x0;x<x1;x+=9){R2(x+2,y-w/2+2,w/2-2,w/2-2,'#A08E7A');R2(x+5,y+1,w/2-3,w/2-3,'#96846E');}};
   vilPath(g0,560,526,250,526,18);vilPath(g0,250,526,140,474,18);vilPath(g0,560,604,960,604,18);vilPath(g0,960,604,1010,486,18);vilPath(g0,560,572,560,648,26);vilPath(g0,560,686,560,VH0,26);}
  if(!VNOGROUND){g0.fillStyle='rgba(255,170,90,.05)';g0.fillRect(0,0,VW0,VH0);}
  return cv;
}
function vilCauldron(g,cx,cy,kind,t,amt){if(typeof dingDraw==='function'){
  g.fillStyle='rgba(120,110,100,.9)';g.beginPath();g.ellipse(cx,cy+2,22,6,0,0,6.283);g.fill();g.fillStyle='rgba(160,150,140,.9)';g.beginPath();g.ellipse(cx,cy+1,20,5,0,0,6.283);g.fill();
  dingDraw(g,cx,cy,0.27,kind,t,0.5);g.font='7px "Press Start 2P"';g.textAlign='center';g.textBaseline='middle';const w=g.measureText(amt).width+8;
  g.fillStyle='rgba(10,5,6,.85)';g.fillRect(cx-w/2,cy-50,w,11);g.fillStyle=kind==='season'?'#FFC93A':'#7FE7FF';g.fillText(amt,cx,cy-44.5);return;}

  const S=kind==='season';
  const C=S?{r0:'#FFF2B0',r1:'#FFC93A',r2:'#C88A00',r3:'#7A4E00',b0:'#5A4A4A',b1:'#34282C',b2:'#1E161A',l0:'#FF8A5A',l1:'#E0282E',l2:'#9E1620',glow:'255,90,40',f:['#C1121F','#FF6A00','#FFB000','#FFF2A8']}
          :{r0:'#E6FFFF',r1:'#7FE7FF',r2:'#2EC4B6',r3:'#16746B',b0:'#3A5A54',b1:'#223A36',b2:'#12221F',l0:'#BFFFF8',l1:'#2EC4B6',l2:'#1E8A7A',glow:'46,196,182',f:['#146B5E','#2EC4B6','#9BF07A','#E6FFFF']};
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};const P=(x,y,c)=>R(x,y,1,1,c);
  const el=(x,y,rx,ry,c)=>{g.fillStyle=c;for(let dy=-ry;dy<=ry;dy++){const w=Math.round(rx*Math.sqrt(Math.max(0,1-(dy*dy)/(ry*ry))));g.fillRect(Math.round(x-w),Math.round(y+dy),w*2+1,1);}};
  for(let k=10;k>=1;k--){g.fillStyle=`rgba(${C.glow},0.035)`;g.beginPath();g.ellipse(cx,cy-6,58*k/10,44*k/10,0,0,6.28);g.fill();}
  // stone fire ring and flames
  el(cx,cy+20,26,6,'#4A4048');for(let k=0;k<10;k++){const a=k/10*6.28;el(cx+Math.cos(a)*24,cy+20+Math.sin(a)*5,4,2,k%2?'#8A8090':'#6A6070');}
  for(let i=0;i<9;i++){const h=8+Math.round(4*Math.sin(t*0.25+i*1.4))+(i%2)*3;for(let r=0;r<h;r++){const q=r/h;R(cx-18+i*4.5-Math.max(1,Math.round(2*(1-q))),cy+20-r,Math.max(1,Math.round(4*(1-q))),1,C.f[Math.min(3,Math.floor(q*4))]);}}
  // legs
  for(const lx of [-16,0,16])R(cx+lx-2,cy+8,4,10,C.r2);
  // pot body
  for(let y=0;y<26;y++){const q=y/26;const w=Math.round(26*Math.sqrt(Math.max(0.08,1-Math.pow((q-0.3)/0.72,2))));R(cx-w,cy-12+y,w*2,1,C.b1);R(cx-w,cy-12+y,Math.round(w*0.35),1,C.b0);R(cx+w-Math.round(w*0.3),cy-12+y,Math.round(w*0.3),1,C.b2);}
  R(cx-25,cy-6,50,3,C.r2);R(cx-25,cy-6,50,1,C.r1);
  // emblem
  if(S){el(cx,cy+3,6,5,C.r3);el(cx,cy+3,5,4,C.r1);R(cx-4,cy-3,2,3,C.r0);R(cx+2,cy-3,2,3,C.r0);R(cx-3,cy+2,2,1,'#FF3B30');R(cx+1,cy+2,2,1,'#FF3B30');}
  else{el(cx,cy+3,5,5,'#D8FFF6');R(cx-3,cy+2,2,2,C.b2);R(cx+1,cy+2,2,2,C.b2);R(cx-2,cy+6,4,1,C.b2);}
  // handles
  for(const s of [-1,1])for(let a=0;a<6.28;a+=0.3)P(cx+s*28+Math.cos(a)*3,cy-6+Math.sin(a)*3,C.r1);
  // rim and liquid
  el(cx,cy-13,29,8,C.r3);el(cx,cy-14,28,7,C.r2);el(cx,cy-15,27,6,C.r1);el(cx,cy-15,24,5,'#0A0406');el(cx,cy-15,22,4,C.l2);el(cx,cy-16,18,3,C.l1);el(cx-6,cy-17,6,1,C.l0);
  for(let k=0;k<5;k++){const a=t*0.05+k*1.25;const bx=cx+Math.cos(a)*13,by=cy-15+Math.sin(a*1.3)*2;if(S){R(bx-1,by-1,3,2,'#FFC93A');P(bx,by-1,'#FFF2B0');}else P(bx,by,C.l0);}
  // rising sparks or souls
  for(let k=0;k<6;k++){const ph=(t*0.8+k*19)%70;const x=cx-12+k*5+Math.sin((t+k*9)*0.1)*3,y=cy-18-ph*0.8;g.globalAlpha=Math.max(0,1-ph/70);
    if(S)R(x,y,2,2,k%2?'#FFB000':'#FFE08A');else{R(x-1,y-2,3,3,'#D8FFF6');P(x-1,y+1,'#BFFFF8');}g.globalAlpha=1;}
  // amount plaque
  g.font='8px "Press Start 2P"';g.textAlign='center';g.textBaseline='middle';const w=g.measureText(amt).width+12;
  R(cx-w/2-1,cy-47,w+2,16,'#1A0B0C');R(cx-w/2,cy-46,w,14,S?'#3A1410':'#0E2A26');R(cx-w/2,cy-46,w,1,C.r1);g.fillStyle=S?'#FFE08A':'#BFFFF8';g.fillText(amt,cx,cy-39);
}
const CHIBI={genesis:['#2A1418','#1A0A0E','#6A2A30','#FF3B30'],aka:['#D7262E','#9E1620','#FF7A6A','#FFB000'],ao:['#2F6FE0','#1B4AA8','#8FBCFF','#FFE14A'],kin:['#FFC93A','#C88A00','#FFF4B0','#FF3B30'],kongo:['#CFF6FF','#7FD8F0','#FFFFFF','#FF5AD8']};
const CHIBI_ARM={genesis:['#1E1418','#140C10','#FF3B30','#1E1418','#140C10'],kin:['#1E1A14','#14110C','#FFD86A','#221D16','#15120D'],kongo:['#D8E6F2','#9AB4CC','#BFFFF8','#C8DAEA','#8AA6C2']};
/* per-character chibi palettes: body, bodyDark, accent, legs, legsDark, head, headDark, headLight, eye */
const CHB={saru:['#B3161F','#7A0A12','#FFC93A','#8E1015','#5A0A0E','#C98A2E','#8A5A1A','#F4DDB8','#FFB000'],
 kappa:['#5FA85A','#3A7A3A','#C1121F','#5FA85A','#3A7A3A','#5FA85A','#3A7A3A','#E8DCA8','#FFE14A'],
 kitsune:['#F8F0EA','#C8C0B8','#C1121F','#C1121F','#7A0A12','#E8A040','#A86A20','#FFD890','#FFB000'],
 tengu:['#EDE8DC','#B8B0A0','#C1121F','#2A2A38','#16161E','#2A2A38','#16161E','#5A5A76','#FFE14A'],
 ryu:['#2E9E4F','#1B6B33','#E8D9A0','#2E9E4F','#1B6B33','#2E9E4F','#1B6B33','#8BE8A6','#FFE14A'],
 onryo:['#E8E8F0','#A8A8C0','#5A3A7A','#E8E8F0','#A8A8C0','#D8E0E8','#0A0A12','#2A2A3A','#FF3B30']};
function chibiDraw(g,x,y,dir,look,step,t){
  const R=(px,py,w,h,col)=>{g.fillStyle=col;g.fillRect(Math.round(px),Math.round(py),w,h);};const P=(px,py,col)=>R(px,py,1,1,col);
  g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(x,y,9,3,0,0,6.28);g.fill();
  const lo=step?1:0;const side=dir==='left'?-1:1;const back=dir==='up',front=dir==='down',prof=!back&&!front;
  if(CHIBI[look]){ // ONI and its skins
    const c=CHIBI[look];const a=CHIBI_ARM[look]||['#3A3F52','#262A38',c[0],'#2E3240','#1E212C'];
    R(x-6,y-9,5,8+lo,a[3]);R(x+1,y-9,5,8-lo,a[4]);R(x-7,y-2+lo,6,2,'#3A2414');R(x+1,y-2-lo,6,2,'#3A2414');
    R(x-7,y-17,14,9,a[0]);R(x+2,y-17,5,9,a[1]);for(const yy of [y-15,y-12])for(let k=-5;k<6;k+=3)P(x+k,yy,a[2]);R(x-7,y-9,14,2,c[1]);
    R(x-9,y-16,3,7,a[0]);R(x+6,y-16,3,7,a[1]);R(x-9,y-10,3,2,'#B07A52');R(x+6,y-10,3,2,'#7A4E30');
    if(back){R(x-6,y-26,2,18,'#DDE4EE');R(x-6,y-28,2,3,'#1A1A22');}else for(let i=0;i<12;i++)P(x-side*8+side*i*0.2,y-18-i,'#9AA4B4');
    const hx=x-8,hy=y-31;
    if(back){R(hx,hy,16,14,'#1C1C24');R(hx+2,hy+1,12,4,'#2A2A34');R(x-2,hy-4,4,4,'#1C1C24');}
    else{R(hx,hy,16,14,c[0]);R(hx,hy,16,2,c[2]);R(hx+12,hy,4,14,c[1]);R(hx-1,hy+1,2,6,'#1C1C24');R(hx+15,hy+1,2,6,'#1C1C24');
      if(front){R(hx+3,hy+5,3,2,c[3]);R(hx+10,hy+5,3,2,c[3]);R(hx+2,hy+4,4,1,c[1]);R(hx+10,hy+4,4,1,c[1]);R(hx+4,hy+9,8,2,'#2A0505');P(hx+4,hy+9,'#FFFFFF');P(hx+11,hy+9,'#FFFFFF');}
      else{R(side<0?hx+2:hx+10,hy+5,3,2,c[3]);R(side<0?hx+1:hx+9,hy+9,6,2,'#2A0505');R(side<0?hx+10:hx,hy,6,14,'#1C1C24');}}
    const hc=look==='kongo'?'#BFFFF8':look==='kin'?'#FFE08A':look==='genesis'?'#FF5A4E':'#DCCA9C';
    if(look==='genesis'&&t%4===0){g.fillStyle=Math.random()<0.5?'#FF6A00':'#FF3B30';g.fillRect(Math.round(x+(Math.random()*2-1)*10),Math.round(y-10-Math.random()*28),1,1);}R(hx+1,hy-5,2,5,hc);R(hx,hy-7,2,3,hc);R(hx+13,hy-5,2,5,hc);R(hx+14,hy-7,2,3,hc);
    if(look==='kin'&&t%3===0)for(let i=0;i<3;i++)P(x+(Math.random()*2-1)*12,y-8-Math.random()*30,'#FFD86A');
    if(look==='kongo'&&t%4===0){const px=Math.round(x+(Math.random()*2-1)*12),py=Math.round(y-8-Math.random()*30);P(px,py,'#FFFFFF');P(px-1,py,'#BFFFF8');P(px+1,py,'#BFFFF8');}
    return;}
  const c=CHB[look]||CHB.saru;const[b0,b1,acc,l0,l1,h0,h1,h2,eye]=c;const hx=x-8,hy=y-31;
  // things behind the body when seen from the front or side: tails, shell, wings
  const behind=()=>{
    if(look==='saru'){const s=-side*(back?0:1);for(let i=0;i<9;i++)R(x+s*(5+i)+(back?(i-4):0),y-10-Math.round(Math.sin(i*0.5)*4)-(i>6?(i-6)*2:0),2,2,h0);}
    if(look==='kitsune'){for(let k=0;k<3;k++)for(let i=0;i<7;i++)R(x-side*(5+i)+(back?(k-1)*4:0),y-10-i-k*2,3,3,i>5?'#FFFFFF':k===1?h0:h1);}
    if(look==='ryu'){for(let i=0;i<10;i++)R(x-side*(5+i)+(back?(i-5):0),y-5-Math.round(i*0.3),Math.max(2,4-Math.floor(i/4)),3,i%3===1?'#D02030':b0);}
    if(look==='tengu'){R(x-7,y-24,4,12,'#16161E');R(x+3,y-24,4,12,'#16161E');}
    if(look==='kappa'){R(x-8,y-24,16,15,'#8A6A2A');for(const [dx,dy] of [[-5,-21],[1,-21],[-3,-15],[3,-15]])R(x+dx,y+dy,3,3,'#C8A050');}};
  if(!back)behind();
  // legs, or a floating hem for Kage
  if(look==='onryo'){const hov=Math.round(Math.sin(t*0.1)*1.5);for(let k=-7;k<=7;k++)R(x+k,y-10+hov,1,6+((k*7+(t>>3))%3+3)%3,b1);R(x-7,y-18+hov,14,10,b0);R(x-6,y-14+hov,12,2,acc);y+=hov;}
  else{R(x-6,y-9,5,8+lo,l0);R(x+1,y-9,5,8-lo,l1);R(x-7,y-2+lo,6,2,look==='tengu'?'#F0B030':look==='ryu'?'#F3E9E4':'#3A2414');R(x+1,y-2-lo,6,2,look==='tengu'?'#F0B030':look==='ryu'?'#F3E9E4':'#3A2414');}
  // torso and arms
  if(look!=='onryo'){R(x-7,y-17,14,9,b0);R(x+2,y-17,5,9,b1);R(x-7,y-10,14,2,acc);
    if(look==='kappa'&&!back)R(x-3,y-16,6,7,'#E8DCA8');if(look==='ryu'&&!back)R(x-3,y-16,6,7,'#E8D9A0');if(look==='tengu'&&!back){P(x-2,y-15,'#C1121F');P(x+1,y-12,'#C1121F');}
    if(look==='kitsune'&&!back){P(x-1,y-17,acc);P(x,y-16,acc);P(x+1,y-17,acc);}}
  const armC=look==='onryo'?b0:look==='saru'||look==='kappa'||look==='ryu'?h0:b0;R(x-9,y-16,3,7,armC);R(x+6,y-16,3,7,look==='onryo'?b1:h1);
  if(look==='saru'&&!back)for(let i=0;i<14;i++)P(x+side*(4+i*0.2)-side*6,y-22+i*1.2,'#B3161F');
  if(back)behind();
  // heads
  if(look==='saru'){R(hx+1,hy+1,14,13,h0);R(hx,hy+4,2,5,h0);R(hx+14,hy+4,2,5,h0);if(!back){if(front){R(hx+3,hy+4,10,9,h2);R(hx+4,hy+6,2,2,'#1A0506');R(hx+10,hy+6,2,2,'#1A0506');R(hx+6,hy+10,4,1,'#5A2A1A');}
    else{R(side<0?hx+1:hx+7,hy+4,8,9,h2);R(side<0?hx+3:hx+11,hy+6,2,2,'#1A0506');}}R(hx+1,hy+2,14,2,acc);R(hx+6,hy-1,4,3,acc);}
  else if(look==='kappa'){R(hx+1,hy+2,14,12,h0);R(hx+12,hy+2,3,12,h1);R(hx,hy+1,16,2,'#1E3A1E');R(hx+3,hy-1,10,2,'#9ADFE8');R(hx+5,hy-2,6,1,'#FFFFFF');
    if(!back){if(front){R(hx+4,hy+6,2,2,eye);R(hx+10,hy+6,2,2,eye);R(hx+5,hy+10,6,3,'#E0B040');}else{R(side<0?hx+2:hx+10,hy+6,2,2,eye);R(side<0?hx-3:hx+12,hy+9,6,3,'#E0B040');}}}
  else if(look==='kitsune'){R(hx+1,hy+2,14,12,h0);R(hx+1,hy-4,4,6,h0);R(hx+11,hy-4,4,6,h0);R(hx+2,hy-2,2,3,'#C1121F');R(hx+12,hy-2,2,3,'#C1121F');
    if(!back){if(front){R(hx+5,hy+8,6,5,h2);R(hx+3,hy+5,3,2,eye);R(hx+10,hy+5,3,2,eye);R(hx+7,hy+9,2,1,'#1A0506');}else{R(side<0?hx-3:hx+11,hy+7,8,4,h0);R(side<0?hx-3:hx+11,hy+9,8,2,h2);R(side<0?hx+3:hx+9,hy+5,3,2,eye);}}}
  else if(look==='tengu'){R(hx+1,hy+1,14,13,h0);R(hx+4,hy-2,8,3,h1);if(!back){if(front){R(hx+6,hy+7,4,7,'#F0B030');R(hx+3,hy+4,3,2,eye);R(hx+10,hy+4,3,2,eye);}else{R(side<0?hx-6:hx+12,hy+6,10,3,'#F0B030');R(side<0?hx+3:hx+10,hy+4,3,2,eye);}}}
  else if(look==='ryu'){for(let k=0;k<5;k++)R(back?hx+1+k*3:(side<0?hx+12:hx),hy+2+k*3,4,3,'#D02030');R(hx+1,hy+1,14,13,h0);R(hx+12,hy+1,3,13,h1);
    R(hx+2,hy-5,2,6,'#FFC93A');R(hx+12,hy-5,2,6,'#FFC93A');if(!back){if(front){R(hx+4,hy+5,3,2,eye);R(hx+10,hy+5,3,2,eye);R(hx+4,hy+10,8,3,h2);}else{R(side<0?hx-6:hx+12,hy+6,10,6,h0);R(side<0?hx-6:hx+12,hy+10,10,2,'#E8D9A0');R(side<0?hx+2:hx+11,hy+5,3,2,eye);}}}
  else if(look==='onryo'){R(hx+2,hy+2,12,12,h0);R(hx,hy,16,6,h1);R(hx,hy,3,20,h1);R(hx+13,hy,3,20,h1);
    if(back)R(hx+2,hy,12,22,h1);else{for(const k of [3,6,9,12])R(hx+k,hy+4,1,10,h1);R(front?hx+7:(side<0?hx+4:hx+9),hy+7,2,2,eye);}}
}
/* ===== village signboard and NPCs ===== */
function vilSignboard(g,x,y,count){ // x,y = bottom center in screen space
  const R=(px,py,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(px),Math.round(py),w,h);};
  g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(x,y+1,40,4,0,0,6.28);g.fill();
  R(x-34,y-40,5,40,'#3A2418');R(x+29,y-40,5,40,'#3A2418');R(x-33,y-40,2,40,'#5A3A26');R(x+30,y-40,2,40,'#5A3A26');
  R(x-44,y-66,88,34,'#1A0B0C');R(x-42,y-64,84,30,'#6A4A2A');for(let k=0;k<4;k++)R(x-42,y-58+k*7,84,1,'#5A3A20');R(x-42,y-64,84,2,'#8A6A3A');
  R(x-46,y-70,92,5,'#2A1E30');R(x-44,y-72,88,3,'#3A3048');
  for(const [nx,ny] of [[-39,-61],[37,-61],[-39,-38],[37,-38]]){R(x+nx,y+ny,2,2,'#C8A060');}
  g.textAlign='center';g.textBaseline='middle';g.font='7px "Press Start 2P"';g.fillStyle='#1A0B0C';g.fillText('ONLINE NOW',x,y-57);
  g.font='14px "Press Start 2P"';g.fillStyle='#1A0506';g.fillText(String(count),x+1,y-43);g.fillStyle='#FFE08A';g.fillText(String(count),x,y-44);
}
const NPCS=[];
function npcDraw(g,n,x,y,t){
  const R=(px,py,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(px),Math.round(py),w,h);};const P=(px,py,c)=>R(px,py,1,1,c);
  const face=n.dir<0?-1:1;const X=v=>x+v*face;
  g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(x,y,8,2.5,0,0,6.28);g.fill();
  const bob=Math.round(Math.sin(t*0.15+n.hx)*1);
  if(n.id==='inu'){const st=n.walk?Math.floor(t/7)%2:0;
    R(x-8,y-9,16,7,'#E8A040');R(x-6,y-5,12,3,'#FFE8C8');R(x-7,y-3+st,3,3,'#C88030');R(x+4,y-3-st,3,3,'#C88030');
    for(const [cx,cy] of [[-5,-8],[1,-7],[4,-9]])P(X(cx),y+cy,'#6A3A1A');
    R(X(face>0?-11:9),y-11,3,3,'#E8A040');P(X(-10),y-12,'#FFE8C8');
    R(X(face>0?5:-12),y-16,8,8,'#E8A040');R(X(face>0?7:-10),y-12,5,4,'#FFE8C8');R(X(face>0?5:-12),y-19,3,3,'#E8A040');R(X(face>0?10:-7),y-19,3,3,'#E8A040');
    P(X(face>0?8:-8),y-14,'#1A0506');P(X(face>0?12:-12),y-12,'#1A0506');R(X(face>0?9:-10),y-10,2,1,'#6A3A1A');}
  else if(n.id==='frog'){R(x-7,y-9+bob,14,8,'#4E9A4A');R(x-7,y-3+bob,14,2,'#3A7A3A');R(x-5,y-5+bob,10,3,'#A8D890');
    R(x-6,y-12+bob,4,4,'#4E9A4A');R(x+2,y-12+bob,4,4,'#4E9A4A');P(x-4,y-11+bob,'#1A0506');P(x+4,y-11+bob,'#1A0506');R(x-2,y-7+bob,4,1,'#2A5A2A');
    R(x-10,y-15+bob,20,2,'#C8A060');R(x-6,y-17+bob,12,2,'#D8B070');R(x-2,y-19+bob,4,2,'#E8C888');for(let i=0;i<8;i++)P(X(6+i),y-6-i*0.5+bob,'#9AA4B4');}
  else if(n.id==='tanuki'){R(x-7,y-12,14,11,'#8A6A4A');R(x-4,y-8,8,6,'#D8C0A0');R(x-6,y-16,12,6,'#8A6A4A');R(x-6,y-13,12,3,'#3A2A1A');P(x-3,y-13,'#FFFFFF');P(x+2,y-13,'#FFFFFF');
    R(x-6,y-18,3,3,'#6A4A2A');R(x+3,y-18,3,3,'#6A4A2A');R(x-2,y-21,5,4,'#5FA85A');P(x,y-22,'#8AD88A');R(X(8),y-10,4,7,'#E8DCC0');R(X(8),y-10,4,2,'#C1121F');}
  else if(n.id==='neko'){const wave=Math.floor(t/10)%2;R(x-6,y-10,12,9,'#FFFFFF');R(x-6,y-4,12,3,'#E8E8F0');R(x-5,y-17,10,8,'#FFFFFF');R(x-5,y-19,3,3,'#FFFFFF');R(x+2,y-19,3,3,'#FFFFFF');
    P(x-4,y-18,'#FF8FB8');P(x+3,y-18,'#FF8FB8');P(x-3,y-14,'#1A0506');P(x+2,y-14,'#1A0506');P(x,y-12,'#FF8FB8');R(x-5,y-10,10,2,'#C1121F');R(x-1,y-9,2,2,'#FFD86A');
    R(x+6,y-(wave?18:15),3,5,'#FFFFFF');P(x+7,y-(wave?18:15),'#FF8FB8');R(x-9,y-8,4,3,'#FFC93A');P(x-8,y-7,'#FFF2B0');}
  else if(n.id==='kasa'){const hop=Math.abs(Math.round(Math.sin(t*0.2)*3));const by=y-hop;
    for(let r=0;r<10;r++){const w=Math.round(2+r*1.1);for(let s=-w;s<w;s++)P(x+s,by-22+r,(Math.floor((s+20)/4)%2)?'#C1121F':'#F3E9E4');}
    R(x-1,by-12,2,9,'#6A4A2A');R(x-1,by-3,2,3,'#E8B090');R(x-3,by-18,6,4,'#FFFFFF');R(x-1,by-17,2,2,'#1A0506');R(x,by-14,2,3,'#FF5A6A');R(x-1,by-24,2,2,'#1A0506');}
  else if(n.id==='kodama'){g.globalAlpha=0.9;R(x-4,y-8,8,7,'#E8F0E8');R(x-5,y-16,10,9,'#F4FAF4');P(x-2,y-13,'#1A1A1A');P(x+1,y-13,'#1A1A1A');R(x-1,y-10,2,1,'#1A1A1A');g.globalAlpha=1;
    if(t%40<20){g.fillStyle='rgba(200,255,200,.12)';g.beginPath();g.ellipse(x,y-10,10,10,0,0,6.28);g.fill();}}
  else if(n.id==='chochin'){const fl=Math.round(Math.sin(t*0.08)*2);const by=y-6+fl;
    g.fillStyle='rgba(255,140,50,.14)';g.beginPath();g.ellipse(x,by-8,16,14,0,0,6.28);g.fill();
    R(x-6,by-16,12,2,'#1A0506');for(let r=0;r<12;r++){const w=Math.round(6*Math.sqrt(1-Math.pow((r-6)/7,2)));R(x-w,by-14+r,w*2,1,r%3===0?'#C04028':'#E8603A');}R(x-6,by-2,12,2,'#1A0506');
    R(x-4,by-11,3,3,'#FFFFFF');P(x-3,by-10,'#1A0506');R(x+1,by-11,3,3,'#FFFFFF');P(x+2,by-10,'#1A0506');R(x-2,by-6,4,1,'#2A0505');R(x-1,by-5,2,4,'#FF5A6A');}
}

/* ===== champions statues, the boss in his cell with the Curse Bag, and two sitters ===== */
function vilChamps(g,ox,oy,names,season){
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x+ox),Math.round(y+oy),w,h);};
  const MET=[['#FFE08A','#C88A00'],['#E8ECF4','#9AA4B4'],['#E0A060','#8A5A2A'],['#A8A0B0','#6A6070'],['#A8A0B0','#6A6070']];
  [[87,34,0],[66,26,1],[108,20,2],[45,14,3],[129,10,4]].forEach(([px,h,rank])=>{if(!names[rank])return;const [c1,c2]=MET[rank];const top=164-h;
    R(px-5,top-14,10,14,c1);R(px+1,top-14,4,14,c2);R(px-6,top-24,12,10,c1);R(px+2,top-24,4,10,c2);R(px-6,top-27,2,4,c1);R(px+4,top-27,2,4,c1);
    R(px-3,top-21,2,2,c2);R(px+1,top-21,2,2,c2);for(let i=0;i<10;i++)R(px+6+i*0.4,top-12-i,1,1,c2);});
  g.font='6px "Press Start 2P"';g.textAlign='left';g.textBaseline='middle';
  g.fillStyle='#1A0B0C';g.fillText('SEASON '+season,40+ox,191+oy);
  for(let i=0;i<5;i++){const n=names[i]||'-';g.fillStyle=i===0?'#8A5A00':'#1A0B0C';g.fillText((i+1)+' '+String(n).slice(0,12),40+ox,199+i*4.2+oy);}
}
function vilCell(g,ox,oy,bag,t){
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x+ox),Math.round(y+oy),w,h);};
  // the boss, chained, sitting
  const br=Math.round(Math.sin(t*0.05));
  R(628,160+br,46,36,'#8E1015');R(628,160+br,14,36,'#B3161F');R(636,188,30,10,'#5A0A0E');
  R(634,136+br,34,26,'#B3161F');R(634,136+br,10,26,'#D7262E');R(630,128+br,8,10,'#F3E9E4');R(664,128+br,8,10,'#F3E9E4');
  R(640,146+br,6,4,'#FFE14A');R(656,146+br,6,4,'#FFE14A');R(642,156+br,18,4,'#2A0505');R(643,156+br,2,3,'#FFFFFF');R(657,156+br,2,3,'#FFFFFF');
  for(let i=0;i<9;i++){R(604+i*3,150+i*2,3,2,'#6A6A7A');R(698-i*3,150+i*2,3,2,'#6A6A7A');}
  // bars in front
  for(let x=604;x<704;x+=9){R(x,122,3,78,'#4A4A5A');R(x,122,1,78,'#7A7A8A');}R(600,128,104,3,'#4A4A5A');R(600,190,104,3,'#4A4A5A');
  // the Curse Bag next to the cell
  const bx=580,by=196;R(bx-14,by-18,28,18,'#8A6A3A');R(bx-12,by-22,24,6,'#A07A44');R(bx-4,by-26,8,5,'#6A4A2A');R(bx-16,by-4,32,4,'#6A4A2A');
  for(const [dx,dy] of [[-8,-10],[2,-14],[6,-6],[-2,-4]]){R(bx+dx,by+dy,4,3,'#FFC93A');R(bx+dx,by+dy,2,1,'#FFF2B0');}
  g.font='6px "Press Start 2P"';g.textAlign='center';g.textBaseline='middle';const txt='CURSE BAG '+bag;const w=g.measureText(txt).width+8;
  R(bx-w/2,by+4,w,11,'#1A0B0C');g.fillStyle='#FFC93A';g.fillText(txt,bx+ox,by+10+oy);
}

/* ===== the spread-out village: islands keep their size, their places move apart by VS ===== */
function buildVillageBG(){
  VPATHS=[];VNOGROUND=true;const old=buildVillageBGOld();VNOGROUND=false;const segs=VPATHS;VPATHS=null;
  const cv=document.createElement('canvas');cv.width=VW*2;cv.height=VH*2;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.setTransform(2,0,0,2,0,0);
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};const P=(x,y,c)=>R(x,y,1,1,c);
  let seed=91;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  R(0,0,VW,VH,'#3F6A46');for(let i=0;i<14000*VS*VS;i++){const x=rnd()*VW,y=rnd()*VH;P(x,y,rnd()<0.45?'#4A7A50':rnd()<0.6?'#365C3C':'#5A8E5E');}
  const dens=(VW*VH)/(720*470);for(let i=0;i<6500*dens;i++){const x=rnd()*VW,y=rnd()*VH;P(x,y,rnd()<0.45?'#4A7A50':rnd()<0.6?'#365C3C':'#5A8E5E');}
  for(let i=0;i<420*dens;i++){const x=rnd()*VW,y=rnd()*VH;P(x,y,'#7AB070');P(x+1,y-1,'#6AA062');}
  for(let i=0;i<220*VS*VS;i++){const x=rnd()*VW,y=240*VS+rnd()*(VH-240*VS);P(x,y,rnd()<0.5?'#F4E4A0':'#FFB7D0');}
  const ft=VTOP-20;R(0,0,VW,ft,'#2A4A30');for(let i=0;i<2600*VS*VS;i++)P(rnd()*VW,rnd()*ft,rnd()<0.5?'#335A38':'#24402A');
  for(let x=0;x<VW;x+=14){const h=18+Math.round(rnd()*14);R(x,ft-h,14,h,'#244A2C');R(x+2,ft-h-6,10,8,'#2E5A34');R(x+4,ft-h-4,4,3,'#3E7040');}
  const sy=Math.round(652*VS);for(let y=sy;y<sy+30;y++)R(0,y,VW,1,y<sy+4||y>sy+25?'#2A5A7A':'#3A7AA8');for(let i=0;i<160*VS;i++)R(rnd()*VW,sy+4+rnd()*22,3,1,'#8AC8E8');
  // longer paths, same directions
  for(const [x0,y0,x1,y1,w] of segs)vilPath(g,x0*VS,y0*VS,x1*VS,y1*VS,w);
  // islands
  const RANK={dojo:3,gate:3,lords:3,market:3,home:3,champs:3,prison:3,bridge:3,pond:2,bench:2,plaza:1},GONE=['tenka','arena'];
  const paste=(x0,y0,x1,y1,dx,dy,hard,own)=>{const w=(x1-x0)*2,h=(y1-y0)*2;const t=document.createElement('canvas');t.width=w;t.height=h;const tg=t.getContext('2d');tg.drawImage(old,x0*2,y0*2,w,h,0,0,w,h);
    if(own){for(const [id,p] of Object.entries(VPIECES)){if(id===own||id==='sign')continue;const ix0=Math.max(x0,p[0]),iy0=Math.max(y0,p[1]),ix1=Math.min(x1,p[2]),iy1=Math.min(y1,p[3]);if(!(ix1>ix0&&iy1>iy0))continue;
      const full=(GONE.includes(id)&&['plaza','lords','bench'].includes(own))||(RANK[id]||0)>(RANK[own]||0);const tie=!GONE.includes(id)&&(RANK[id]||0)===(RANK[own]||0)&&RANK[own];
      if(full)tg.clearRect((ix0-x0)*2,(iy0-y0)*2,(ix1-ix0)*2,(iy1-iy0)*2);
      else if(tie){const oc=[(x0+x1)/2,(y0+y1)/2],pc=[(p[0]+p[2])/2,(p[1]+p[3])/2];
        if(ix1-ix0<=iy1-iy0){const mid=(ix0+ix1)/2;const cx0=pc[0]<oc[0]?ix0:mid,cx1=pc[0]<oc[0]?mid:ix1;tg.clearRect((cx0-x0)*2,(iy0-y0)*2,(cx1-cx0)*2,(iy1-iy0)*2);}
        else{const mid=(iy0+iy1)/2;const cy0=pc[1]<oc[1]?iy0:mid,cy1=pc[1]<oc[1]?mid:iy1;tg.clearRect((ix0-x0)*2,(cy0-y0)*2,(ix1-ix0)*2,(cy1-cy0)*2);}}}}
    if(!hard){const f=Math.min(26,w/5,h/5);tg.globalCompositeOperation='destination-in';const gx=tg.createLinearGradient(0,0,w,0);gx.addColorStop(0,'rgba(0,0,0,0)');gx.addColorStop(f/w,'#000');gx.addColorStop(1-f/w,'#000');gx.addColorStop(1,'rgba(0,0,0,0)');tg.fillStyle=gx;tg.fillRect(0,0,w,h);
      const gy=tg.createLinearGradient(0,0,0,h);gy.addColorStop(0,'rgba(0,0,0,0)');gy.addColorStop(f/h,'#000');gy.addColorStop(1-f/h,'#000');gy.addColorStop(1,'rgba(0,0,0,0)');tg.fillStyle=gy;tg.fillRect(0,0,w,h);}
    g.drawImage(t,0,0,w,h,x0+dx,y0+dy,x1-x0,y1-y0);};
  {let best=null,bd=1e9;for(const [x0,y0,x1,y1] of segs)for(const [ex,ey] of [[x0,y0],[x1,y1]]){const d=Math.hypot(ex-753,ey-408);if(d<bd){bd=d;best=[ex*VS,ey*VS];}}
   const [fx,fy]=best||TK.from,py=TK.gate[1]+36;vilPath(g,fx,fy,fx,py,12);vilPath(g,fx,py,TK.gate[0],py,12);vilPath(g,TK.gate[0],py,TK.gate[0],TK.gate[1],12);}
  for(const id of ['plaza','dojo','gate','lords','market','home','pond','bench','champs','prison','bridge']){const p=VPIECES[id];const [dx,dy]=vpD(id);paste(p[0],p[1],p[2],p[3],dx,dy,true,id);}
  // each path reaches its door cleanly: a short piece drawn over the house's own ground
  for(const [x0,y0,x1,y1,w] of segs)for(const [ex,ey,ox,oy] of [[x0,y0,x1,y1],[x1,y1,x0,y0]])for(const id of ['dojo','gate','lords','market','home','arena']){const p=VPIECES[id];
    if(Math.hypot(ex-p[4],ey-p[5])<16){const [dx,dy]=vpD(id);const sx=ex+dx,sy=ey+dy,L=Math.hypot(ox-ex,oy-ey)||1;
      const fp=VBLK[['bench','dojo','gate','lords','market','tenka','home','arena'].indexOf(id)];g.save();g.beginPath();g.rect(0,0,VW,VH);if(fp){g.rect(fp[0]-6,fp[1]-60,fp[2]+12,fp[3]+62);}g.clip('evenodd');
      vilPath(g,sx,sy,sx+(ox-ex)/L*34,sy+(oy-ey)/L*34,w);g.restore();}}
  drawTenkaArena(g,0);drawBattleHall(g);
  for(const [x,y] of VTREES){const dx=x*(VS-1),dy=y*(VS-1);paste(x-22,y-44,x+22,y+4,dx,dy,true);}
  return cv;}
function vilSitters(g,ox,oy,t){ox-=80;oy+=10;
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x+ox),Math.round(y+oy),w,h);};
  const D=(cx,cy,r,c)=>{g.fillStyle=c;for(let dy=-r;dy<=r;dy++){const w=Math.round(Math.sqrt(r*r-dy*dy));g.fillRect(Math.round(cx-w+ox),Math.round(cy+dy+oy),w*2+1,1);}};
  const b=Math.round(Math.sin(t*0.06));
  // a white lucky cat waving its paw, and a small black kitten
  D(556,402+b,6,'#F6F2EA');D(556,394+b,5,'#F6F2EA');R(552,388+b,2,3,'#F6F2EA');R(558,388+b,2,3,'#F6F2EA');R(552,389+b,1,1,'#FF8AA0');R(559,389+b,1,1,'#FF8AA0');
  R(554,393+b,1,1,'#1A0506');R(557,393+b,1,1,'#1A0506');R(555,395+b,2,1,'#FF6A7A');R(553,398+b,6,1,'#C1121F');R(555,399+b,2,2,'#FFC93A');
  const wave=Math.round(Math.sin(t*0.15)*1.5);R(561,394+wave+b,2,4,'#F6F2EA');R(552,408,2,3,'#F6F2EA');R(558,408,2,3,'#F6F2EA');R(549,400+b,3,2,'#E0A060');
  const mb=Math.round(Math.sin(t*0.06+1.5));D(572,405+mb,4,'#1E1A22');D(572,399+mb,3,'#1E1A22');R(570,395+mb,1,2,'#1E1A22');R(573,395+mb,1,2,'#1E1A22');R(571,399+mb,1,1,'#FFE14A');R(573,399+mb,1,1,'#FFE14A');R(575,404+mb,3,1,'#1E1A22');
  R(569,403+mb,1,1,'#1A0506');R(572,403+mb,1,1,'#1A0506');R(570,405+mb,2,1,'#5A2A1A');R(569,408,1,3,'#8A5A2A');R(572,408,1,3,'#8A5A2A');
}

/* ===== the outer world: forest frame, two new districts, paths and a stream ===== */
function buildVillageOuter(g){
  if(VNOGROUND)g.globalAlpha=0;
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};const P=(x,y,c)=>R(x,y,1,1,c);
  let seed=91;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  R(0,0,VW0,VH0,'#3F6A46');for(let i=0;i<14000;i++){const x=rnd()*VW0,y=rnd()*VH0;P(x,y,rnd()<0.45?'#4A7A50':rnd()<0.6?'#365C3C':'#5A8E5E');}
  for(let i=0;i<220;i++){const x=rnd()*VW0,y=240+rnd()*(VH0-240);P(x,y,rnd()<0.5?'#F4E4A0':'#FFB7D0');}
  g.globalAlpha=1;
  // forest along the top (not on the old plan used for the spread-out village)
  if(!VPATHS){R(0,0,VW0,222,'#2A4A30');for(let i=0;i<2600;i++)P(rnd()*VW0,rnd()*222,rnd()<0.5?'#335A38':'#24402A');
  for(let x=0;x<VW0;x+=14){const h=18+Math.round(rnd()*14);R(x,222-h,14,h,'#244A2C');R(x+2,222-h-6,10,8,'#2E5A34');R(x+4,222-h-4,4,3,'#3E7040');}}
  // paths to the new districts
  const path=(x0,x1,y,w)=>{for(let x=x0;x<x1;x+=2)R(x,y-w/2,2,w,'#8A7A68');for(let x=x0;x<x1;x+=9){R(x+2,y-w/2+2,w/2-2,w/2-2,'#A08E7A');R(x+5,y+1,w/2-3,w/2-3,'#96846E');}};
  // the stream and its red bridge
  if(VNOGROUND)g.globalAlpha=0;
  for(let y=652;y<682;y++)R(0,y,VW0,1,y<656||y>677?'#2A5A7A':'#3A7AA8');for(let i=0;i<160;i++)R(rnd()*VW0,656+rnd()*22,3,1,'#8AC8E8');
  g.globalAlpha=1;
  R(526,646,68,40,'#8E1015');R(530,650,60,32,'#C1121F');for(let x=532;x<588;x+=6)R(x,650,2,32,'#8E1015');R(526,646,68,3,'#FF5A4E');R(526,683,68,3,'#5A0A0E');
  // champions plaza: stone floor
  for(let y=258;y<450;y+=2)for(let x=14;x<206;x+=2)if(((x/2+y/2)|0)%9===0)P(x,y,'#9A8A74');
  R(14,256,192,196,'#B0A088');for(let y=262;y<450;y+=12)for(let x=18+((y/12)%2)*12;x<204;x+=24)R(x,y,22,10,'#C0B098');R(14,256,192,3,'#D8C8B0');
  // prison yard: dark stone
  R(914,240,196,212,'#4A4450');for(let y=246;y<450;y+=12)for(let x=918+((y/12)%2)*12;x<1108;x+=24)R(x,y,22,10,'#56505E');R(914,240,196,3,'#6A6472');
  // a few trees outside the districts
  const tree=(x,y)=>{R(x-2,y-10,5,12,'#3A2018');for(let i=0;i<80;i++){const a=rnd()*6.28,d=rnd()*17;R(x+Math.cos(a)*d*1.2,y-21+Math.sin(a)*d*0.9,3,3,['#1F4A2A','#2A5A34','#163A20'][Math.floor(rnd()*3)]);}};
  for(const [x,y] of [[60,560],[150,620],[1080,560],[420,630],[300,600]])tree(x,y);
}
/* ===== champions plaza (big podium) ===== */
function vilChampsBig(g,ox,oy,names,season){
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x+ox),Math.round(y+oy),Math.round(w),Math.round(h));};
  // arch with the title
  R(26,262,8,118,'#8E1015');R(186,262,8,118,'#8E1015');R(18,256,184,12,'#1A0708');R(22,270,176,6,'#C1121F');
  g.font='8px "Press Start 2P"';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#FFE08A';g.fillText('SEASON '+season+' CHAMPIONS',110+ox,262+oy);
  // podium: 4 2 1 3 5
  const MET=[['#FFE08A','#C88A00'],['#E8ECF4','#9AA4B4'],['#E0A060','#8A5A2A'],['#B8B0C0','#7A7280'],['#B8B0C0','#7A7280']];
  const ped=[[44,22,3],[77,34,1],[110,46,0],[143,28,2],[176,16,4]];
  R(28,376,164,10,'#6A6070');R(28,376,164,2,'#9A92A0');
  for(const [px,h,rank] of ped){const top=376-h;R(px-15,top,30,h,'#8A8090');R(px-15,top,30,2,'#C0B8C8');R(px+9,top,6,h,'#6A6070');
    g.font='8px "Press Start 2P"';g.fillStyle=rank===0?'#FFE08A':'#2A2430';g.fillText(String(rank+1),px+ox,top+h/2+1+oy);
    if(!names[rank])continue;const [c1,c2]=MET[rank];const s=rank===0?1.35:rank<3?1.15:1;
    const fy=top;R(px-7*s,fy-20*s,14*s,20*s,c1);R(px+2*s,fy-20*s,5*s,20*s,c2);R(px-8*s,fy-34*s,16*s,14*s,c1);R(px+3*s,fy-34*s,5*s,14*s,c2);
    R(px-8*s,fy-39*s,3*s,6*s,c1);R(px+5*s,fy-39*s,3*s,6*s,c1);R(px-4*s,fy-29*s,3*s,3*s,c2);R(px+1*s,fy-29*s,3*s,3*s,c2);
    for(let i=0;i<14*s;i++)R(px+8*s+i*0.3,fy-16*s-i,1.5,1.5,c2);}
  // name tablet
  R(30,392,160,52,'#5A5260');R(33,395,154,46,'#7A7280');R(30,392,160,2,'#A09AA8');
  g.textAlign='left';g.font='7px "Press Start 2P"';
  for(let i=0;i<5;i++){const n=names[i]||'Open spot';g.fillStyle=i===0?'#FFE08A':i===1?'#F3F3F8':i===2?'#F0B880':'#E0DCE4';g.fillText((i+1)+'. '+String(n).slice(0,16),40+ox,401+i*9+oy);}
}
/* ===== Shuten-doji's prison with the Curse Bag board ===== */
function vilPrison(g,ox,oy,bag,t){
  const F=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round((x+ox)*2)/2,Math.round((y+oy)*2)/2,w,h);};
  const poly=(pts,c)=>hiPoly(g,pts.map(p=>[p[0]+ox,p[1]+oy]),c);
  const glow=(x,y,r,rgb,a)=>{for(let k=8;k>=1;k--){g.fillStyle=`rgba(${rgb},${a})`;g.beginPath();g.arc(x+ox,y+oy,r*k/8,0,6.28);g.fill();}};
  // stone plinth and steps
  F(928,374,148,12,'#7A7480');F(928,374,148,1.5,'#A8A2AE');for(let x=930;x<1074;x+=12)F(x,375,0.5,11,'#5A5460');F(944,386,116,5,'#6A6470');F(960,391,84,4,'#5A5460');
  // dark interior and a faint purple aura
  F(940,272,124,102,'#0E0A14');glow(1002,330,60,'140,60,200',0.025);
  // the boss: sitting cross-legged, chained, breathing
  const b=Math.round(Math.sin(t*0.04)*1.5);const x=1002,y=370;
  poly([[x-32,y],[x+32,y],[x+26,y-12],[x-26,y-12]],'#7A0A12');poly([[x-30,y-2],[x-4,y-2],[x-8,y-11],[x-26,y-11]],'#9E1620');
  poly([[x-24,y-12+b],[x+24,y-12+b],[x+20,y-50+b],[x-20,y-50+b]],'#B3161F');poly([[x-24,y-12+b],[x-12,y-12+b],[x-10,y-50+b],[x-20,y-50+b]],'#D7262E');poly([[x+10,y-12+b],[x+24,y-12+b],[x+20,y-50+b],[x+10,y-50+b]],'#8E1015');
  F(x-12,y-44+b,10,7,'#8E1015');F(x+2,y-44+b,10,7,'#8E1015');for(const yy of [-34,-28,-22])F(x-6,y+yy+b,12,3,'#9E1620');
  F(x-22,y-16+b,44,4,'#C88A00');F(x-22,y-16+b,44,1,'#FFE08A');
  // head, white mane, horns, glowing eyes, fangs
  for(let k=0;k<9;k++){const a=Math.PI*(0.05+k*0.11);poly([[x,y-62+b],[x+Math.cos(Math.PI+a)*24,y-62+b+Math.sin(Math.PI+a)*20],[x+Math.cos(Math.PI+a+0.15)*14,y-62+b+Math.sin(Math.PI+a+0.15)*12]],k%2?'#F3E9E4':'#C8C0CC');}
  poly([[x-14,y-74+b],[x+14,y-74+b],[x+16,y-58+b],[x+10,y-50+b],[x-10,y-50+b],[x-16,y-58+b]],'#B3161F');poly([[x-13,y-73+b],[x-4,y-73+b],[x-6,y-58+b],[x-14,y-60+b]],'#D7262E');
  poly([[x-11,y-72+b],[x-16,y-88+b],[x-7,y-74+b]],'#FFC93A');poly([[x+11,y-72+b],[x+16,y-88+b],[x+7,y-74+b]],'#FFC93A');
  glow(x-6,y-64+b,6,'255,220,80',0.06);glow(x+6,y-64+b,6,'255,220,80',0.06);F(x-9,y-65+b,6,2.5,'#FFE14A');F(x+3,y-65+b,6,2.5,'#FFE14A');
  F(x-8,y-56+b,16,4,'#2A0505');F(x-7,y-56+b,2,3,'#FFFFFF');F(x+5,y-56+b,2,3,'#FFFFFF');
  // arms forward on the knees, iron cuffs and chains to the walls
  for(const s of [-1,1]){poly([[x+s*20,y-46+b],[x+s*28,y-30+b],[x+s*20,y-14],[x+s*14,y-18],[x+s*20,y-30+b],[x+s*14,y-44+b]],'#B3161F');F(x+s*18-4,y-20,8,4,'#4A4A5A');
    for(let k=0;k<9;k++)F(x+s*(22+k*4.4),y-20-k*3.2,2.5,2,k%2?'#6A6A7A':'#8A8A9A');}
  // cage: timber posts and bars with iron bands
  F(936,264,8,112,'#3A2414');F(1060,264,8,112,'#3A2414');F(936,264,1.5,112,'#6A4A2A');F(1060,264,1.5,112,'#6A4A2A');
  for(let bx=952;bx<1056;bx+=13){F(bx,272,4,102,'#4A2E18');F(bx,272,1,102,'#7A5A30');}
  for(const by of [288,346]){F(936,by,132,4,'#4A4A5A');F(936,by,132,1,'#8A8A9A');for(let bx=940;bx<1066;bx+=13)F(bx,by+1,1.5,1.5,'#B0B0BA');}
  // paper talismans (ofuda) sealing the bars
  for(const [ox2,oy2,r] of [[958,296,-0.1],[996,300,0.08],[1036,294,-0.05]]){poly([[ox2,oy2],[ox2+7,oy2+0.6],[ox2+6.4,oy2+18],[ox2-0.6,oy2+17.4]],'#F6EEDC');F(ox2+2,oy2+3,3,1,'#C1121F');F(ox2+3,oy2+5,1,8,'#C1121F');F(ox2+1.5,oy2+9,4,1,'#C1121F');}
  // small tiled roof
  poly([[924,266],[1080,266],[1066,250],[938,250]],'#2A1416');for(let yy=252;yy<266;yy+=3)F(930,yy,144,0.5,'#5A2A2A');F(920,264,164,3,'#8E1015');F(920,264,164,1,'#D03030');
  poly([[916,262],[924,264],[922,268]],'#8E1015');poly([[1088,262],[1080,264],[1082,268]],'#8E1015');F(940,247,124,3,'#141018');
  // sacred rope (shimenawa) with paper streamers (shide)
  for(let k=0;k<=24;k++){const xx=940+k*5,yy=272+Math.sin(k/24*Math.PI)*6;F(xx,yy,5.5,2.5,k%2?'#D8C080':'#B8A060');}
  for(const sx of [956,980,1004,1028,1052]){const sy=272+Math.sin((sx-940)/120*Math.PI)*6+2;F(sx,sy,3,2,'#FFFFFF');F(sx+1,sy+2,3,2,'#FFFFFF');F(sx,sy+4,3,2,'#FFFFFF');F(sx+1,sy+6,3,2,'#FFFFFF');}
  // name plaque
  F(966,232,72,14,'#2A1408');F(968,234,68,10,'#C8962A');F(968,234,68,1,'#FFE08A');g.font='6px "Press Start 2P"';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#2A1408';g.fillText('SHUTEN-DOJI',1002+ox,239.5+oy);
  // stone lanterns with a soft purple flame
  for(const lx of [916,1088]){F(lx-4,352,8,22,'#8A8A94');F(lx-6,346,12,6,'#A8A8B2');F(lx-3,340,6,6,'#9A9AA4');F(lx-2,341,4,4,'#C49BFF');glow(lx,343,10,'196,155,255',0.05);F(lx-7,336,14,4,'#7A7A84');}
  // Curse Bag board
  F(916,396,180,52,'#1A0B0C');F(919,399,174,46,'#2A1410');F(919,399,174,2,'#FFC93A');
  g.font='7px "Press Start 2P"';g.fillStyle='#FFC93A';g.fillText('SEALED FOREVER',1006+ox,407+oy);
  g.font='bold 15px serif';g.fillStyle='#1A0506';g.fillText('封印',1007+ox,423+oy);g.fillStyle='#FFE08A';g.fillText('封印',1006+ox,422+oy);
  g.font='6px "Press Start 2P"';g.fillStyle='#C9A9A2';g.fillText('THE KING OF ALL ONI',1006+ox,437+oy);
  // no money sack: the prison is only decoration now
}

/* ===== HD chibis: drawn at double resolution with a thin outline and soft light ===== */
const chibiLow=chibiDraw;const CHB_BUF=document.createElement('canvas');CHB_BUF.width=128;CHB_BUF.height=160;const CHB_OUT=document.createElement('canvas');CHB_OUT.width=128;CHB_OUT.height=160;
chibiDraw=function(g,x,y,dir,look,step,t){const tf=g.getTransform();if(Math.abs(tf.a)<1.5)return chibiLow(g,x,y,dir,look,step,t);
  const b=CHB_BUF.getContext('2d'),o=CHB_OUT.getContext('2d');b.setTransform(1,0,0,1,0,0);b.clearRect(0,0,128,160);b.imageSmoothingEnabled=false;b.setTransform(2,0,0,2,64,140);chibiLow(b,0,0,dir,look,step,t);b.setTransform(1,0,0,1,0,0);
  o.globalCompositeOperation='source-over';o.clearRect(0,0,128,160);for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])o.drawImage(CHB_BUF,dx,dy);o.globalCompositeOperation='source-in';o.fillStyle='rgba(12,6,8,.9)';o.fillRect(0,0,128,160);
  o.globalCompositeOperation='source-over';o.drawImage(CHB_BUF,0,0);o.globalCompositeOperation='source-atop';const gr=o.createLinearGradient(0,40,0,150);gr.addColorStop(0,'rgba(255,240,220,.16)');gr.addColorStop(1,'rgba(0,0,0,.18)');o.fillStyle=gr;o.fillRect(0,0,128,160);o.globalCompositeOperation='source-over';
  g.save();g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;g.drawImage(CHB_OUT,Math.round(tf.a*x+tf.e-64),Math.round(tf.d*y+tf.f-140));g.restore();};
