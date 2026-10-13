/* ===================== HI-RES ARENAS (480x270, floor from y 216) ===================== */
function arenaKit(seed0){
  const W=480,H=270;const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};const P=(x,y,c)=>R(x,y,1,1,c);
  const poly=(pts,c)=>hiPoly(g,pts,c);
  const disc=(cx,cy,r,c,sy)=>{sy=sy||1;g.fillStyle=c;for(let dy=-Math.round(r*sy);dy<=Math.round(r*sy);dy++){const w=Math.round(r*Math.sqrt(Math.max(0,1-(dy/(r*sy))**2)));g.fillRect(Math.round(cx-w),Math.round(cy+dy),w*2+1,1);}};
  let seed=seed0||7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const glow=(x,y,r,rgb,a,n)=>{n=n||14;for(let k=n;k>=1;k--){g.fillStyle=`rgba(${rgb},${a})`;g.beginPath();g.arc(x,y,r*k/n,0,Math.PI*2);g.fill();}};
  const sky=(cols,h)=>{const bh=h/cols.length;cols.forEach((c,i)=>{R(0,i*bh,W,bh+1,c);if(i)for(let x=0;x<W;x+=2){P(x+(i%2),i*bh,cols[i-1]);P(x+((i+1)%2),i*bh+2,cols[i-1]);}});};
  const ridge=(base,amp,c,sd,f,top)=>{for(let x=0;x<W;x++){const h=amp*(0.55+0.45*Math.sin(x*f+sd)+0.2*Math.sin(x*f*3.1+sd*2));R(x,base-h,1,h+2,c);if(top&&h>amp*0.9)P(x,base-h,top);}};
  return{W,H,cv,g,R,P,poly,disc,rnd,glow,sky,ridge};
}
function buildSummitHi(){
  const {W,H,cv,g,R,P,poly,disc,rnd,glow,sky,ridge}=arenaKit(5);
  sky(['#4AA6EA','#5CB0EE','#70BCF1','#86C8F4','#9CD3F6','#B2DDF7','#C8E8F9','#DCF1FA'],110);R(0,110,W,40,'#DCF1FA');
  glow(372,40,70,'255,245,200',0.03);disc(372,40,18,'#FFF6D0');disc(372,40,15,'#FFFFFF');
  const cloud=(x,y,s)=>{for(const [dx,dy,r] of [[0,0,10],[12,-4,12],[26,0,10],[36,3,7],[-10,3,7]]){disc(x+dx*s,y+dy*s,Math.round(r*s),'#FFFFFF',0.6);}for(const [dx,r] of [[0,10],[14,12],[28,9]])disc(x+dx*s,y+5*s,Math.round(r*s),'#E6F0F8',0.35);};
  cloud(70,34,1.1);cloud(230,20,1.3);cloud(430,64,0.9);cloud(170,70,0.7);
  // far peaks with snow
  for(const [px,ph,pw] of [[60,70,70],[150,56,60],[330,64,80],[440,50,60]]){poly([[px-pw,110],[px,110-ph],[px+pw,110]],'#8CA8C4');poly([[px-12,110-ph+14],[px,110-ph],[px+12,110-ph+14],[px+4,110-ph+10],[px-4,110-ph+12]],'#FFFFFF');}
  // sea
  R(0,104,W,16,'#2F7FC8');R(0,104,W,1,'#BFE4FF');for(let i=0;i<90;i++)R(rnd()*W,106+rnd()*12,2+rnd()*5,1,'#9AD5FF');
  disc(60,105,32,'#4C8FB0',0.12);disc(318,105,22,'#4C8FB0',0.12);
  // patchwork plains, river, villages
  R(0,118,W,60,'#7CC46A');const fc=['#8ED27A','#A6DA6E','#C8E06A','#6FB85E','#E2D27A','#94CC84','#B8DC8A'];
  for(let y=118;y<178;y+=6)for(let x=-10;x<W;){const w=14+rnd()*30;R(x,y,w,6,fc[Math.floor(rnd()*fc.length)]);R(x,y,w,1,'rgba(255,255,255,.2)');R(x,y+5,w,1,'rgba(0,0,0,.08)');x+=w;}
  let rx=230;for(let y=118;y<178;y++){rx+=Math.round((rnd()-0.5)*3);R(rx,y,3+Math.floor((y-118)/12),1,'#5AA8E0');P(rx+1,y,'#9AD5FF');}
  for(let i=0;i<14;i++){const vx=20+rnd()*440,vy=124+rnd()*44;R(vx,vy,6,4,'#F3E9E4');poly([[vx-1,vy],[vx+7,vy],[vx+5,vy-3],[vx+1,vy-3]],'#8E2A1A');}
  // rolling hills between the plains and the summit (no gaps left in the background)
  R(0,174,W,40,'#5E9A58');for(let x=0;x<W;x++){const h=6+Math.round(Math.sin(x*0.03)*4+Math.sin(x*0.011+1)*5);R(x,174-h,1,h,'#6AAA60');P(x,174-h,'#8ACA78');}
  for(let i=0;i<260;i++)P(rnd()*W,176+rnd()*36,rnd()<0.5?'#4E8A4A':'#76B868');
  for(let i=0;i<34;i++){const tx=rnd()*W,ty=184+rnd()*20;R(tx,ty,1,4,'#3A2A1A');hiPoly(g,[[tx-3,ty+1],[tx,ty-6],[tx+3,ty+1]],rnd()<0.5?'#2E5A34':'#3A6A40');}
  // forest slopes
  const slope=(x0,dir,top,c,cs)=>{for(let i=0;i<220;i++){const x=x0+dir*i;const h=Math.max(0,top-i*0.85+Math.sin(i*0.2)*3);R(x,216-h,1,h,c);if(i%3===0)P(x,216-h,cs);}};
  slope(0,1,120,'#5A7E6A','#7A9E8A');slope(W-1,-1,110,'#5A7E6A','#7A9E8A');
  for(let i=0;i<60;i++){const side=rnd()<0.5;const tx=side?rnd()*140:W-rnd()*130;const ty=216-rnd()*80;const lim=side?120-(tx)*0.85:110-(W-tx)*0.85;if(216-ty>lim-6)continue;
    R(tx,ty,1,5,'#3A2A1A');poly([[tx-4,ty+1],[tx,ty-7],[tx+4,ty+1]],rnd()<0.5?'#2E5A34':'#3A6A40');}
  slope(0,1,70,'#3E6A44','#5A8A5E');slope(W-1,-1,64,'#3E6A44','#5A8A5E');
  // summit ground
  R(0,208,W,62,'#8A7A66');for(let x=0;x<W;x+=2)R(x,205+Math.round(Math.sin(x*0.07)*2),2,4,'#9A8A74');
  R(0,216,W,54,'#7A6A58');R(0,216,W,2,'#B0A088');for(let i=0;i<70;i++){const gx=rnd()*W,gy=219+rnd()*48;R(gx,gy,5+rnd()*12,2,'#6A5A4A');R(gx+1,gy-1,3,1,'#8E7E6A');}
  for(let i=0;i<34;i++){const gx=rnd()*W;R(gx,212,1,5,'#5FA85A');R(gx+2,211,1,6,'#6FB85E');R(gx-2,213,1,4,'#4E9A4A');}
  // torii with sacred rope and shide
  const tc='#C1121F';R(28,120,7,96,tc);R(28,120,2,96,'#FF5A4E');R(96,120,7,96,tc);R(96,120,2,96,'#FF5A4E');
  poly([[14,112],[118,112],[124,104],[8,104]],'#1A0708');R(18,112,96,6,tc);R(18,112,96,1,'#FF6B5E');R(24,130,82,5,tc);
  for(let x=35;x<96;x++)P(x,142+Math.round(Math.sin((x-35)/61*Math.PI)*5),'#E8D9A0');for(let x=35;x<96;x++)P(x,143+Math.round(Math.sin((x-35)/61*Math.PI)*5),'#C8B880');
  for(const sx of [48,62,76]){R(sx,148,2,4,'#FFFFFF');R(sx+1,151,2,4,'#FFFFFF');R(sx,154,2,3,'#FFFFFF');}
  // stone lantern
  R(128,196,14,20,'#8A8A94');R(124,188,22,8,'#A8A8B2');R(130,178,10,10,'#9A9AA4');R(132,181,6,4,'#FFD27A');poly([[122,178],[148,178],[140,170],[130,170]],'#7A7A84');R(126,214,18,4,'#6A6A74');
  // cherry tree
  R(430,140,6,76,'#5A3A2A');R(420,154,12,4,'#5A3A2A');R(434,160,16,4,'#5A3A2A');
  for(let i=0;i<180;i++){const a=rnd()*6.28,d=rnd()*38;R(432+Math.cos(a)*d*1.3,130+Math.sin(a)*d*0.7,3,3,rnd()<0.4?'#FFB7D0':rnd()<0.6?'#FF8FB8':'#FFD8E6');}
  for(let i=0;i<18;i++)R(380+rnd()*100,200+rnd()*16,2,1,'#FFB7D0');
  return cv;
}
function buildYomiHi(){
  const {W,H,cv,g,R,P,poly,disc,rnd,glow,sky,ridge}=arenaKit(9);
  sky(['#05040C','#080616','#0C0A20','#10102A','#131634','#161C3C','#182244','#1A284A'],200);
  for(let i=0;i<120;i++)P(rnd()*W,rnd()*140,rnd()<0.2?'#BFFFF8':'#6A7AA8');
  ridge(170,40,'#0C1020',1,0.012);
  // dead trees
  const tree=(x,h)=>{R(x,216-h,3,h,'#06080E');for(let k=0;k<6;k++){const y=216-h+k*10;const d=k%2?1:-1;for(let i=0;i<14-k;i++)P(x+1+d*i,y-Math.round(i*0.5),'#06080E');}};
  for(const [x,h] of [[20,110],[60,80],[410,100],[455,120],[110,60],[370,70]])tree(x,h);
  // the great gate
  glow(240,120,150,'60,220,200',0.018);
  R(150,40,30,176,'#1A1E2E');R(300,40,30,176,'#1A1E2E');R(150,40,6,176,'#2A3048');R(300,40,6,176,'#2A3048');
  poly([[120,40],[360,40],[350,26],[130,26]],'#10121E');R(126,40,228,6,'#22263A');
  R(180,60,120,156,'#070810');for(let y=64;y<216;y+=8)R(184,y,112,1,'#0E101C');R(239,60,2,156,'#161A28');
  for(let i=0;i<40;i++)P(186+rnd()*108,70+rnd()*140,rnd()<0.5?'#2EC4B6':'#1E6A64');
  R(210,72,60,22,'#10121E');g.fillStyle='#2EC4B6';g.font='16px serif';g.textAlign='center';g.textBaseline='middle';g.fillText('黄泉',240,84);
  // hanging chains
  for(const cx of [168,312])for(let y=46;y<130;y+=4){R(cx,y,3,3,'#3A3E52');P(cx+1,y+1,'#6A6E82');}
  // spirit river and floor
  R(0,208,W,10,'#0E3A3A');for(let x=0;x<W;x+=3)P(x,210+Math.round(Math.sin(x*0.2)*1.5),'#2EC4B6');for(let i=0;i<50;i++)R(rnd()*W,209+rnd()*7,4,1,'#7FE7FF');
  R(0,216,W,54,'#141624');R(0,216,W,2,'#2EC4B6');for(let y=222;y<H;y+=8)for(let x=((y/8)%2)*16;x<W;x+=32)R(x,y,30,6,'#1A1E30');
  for(let y=220;y<H;y+=2){const w=Math.round(8+(y-220)*0.3);R(240-w,y,w*2,1,`rgba(46,196,182,${0.12-(y-220)*0.002})`);}
  // mist
  for(let i=0;i<6;i++){g.fillStyle='rgba(120,200,210,.05)';g.beginPath();g.ellipse(rnd()*W,190+rnd()*30,120,10,0,0,6.28);g.fill();}
  return cv;
}
function buildColosseumHi(){
  const {W,H,cv,g,R,P,poly,disc,rnd,glow,sky}=arenaKit(13);
  sky(['#140608','#1A080A','#200A0C','#260C0E'],40);
  // tiers of the crowd
  const crowdC=['#C1121F','#FFB000','#2F6FE0','#F3E9E4','#2EC4B6','#9B59D0','#5FA85A','#E8A040'];
  for(let tier=0;tier<6;tier++){const y=34+tier*26;R(0,y,W,26,tier%2?'#2A1618':'#241214');R(0,y+22,W,4,'#3A2022');
    for(let x=2;x<W;x+=5){const c=crowdC[Math.floor(rnd()*crowdC.length)];R(x,y+10+Math.round(rnd()*2),3,4,c);R(x,y+6+Math.round(rnd()*2),3,3,'#D8B090');if(rnd()<0.12)R(x,y+2,1,6,'#F3E9E4');}}
  // banners with oni crest
  for(const bx of [40,150,300,410]){R(bx,34,22,50,'#8E1015');R(bx,34,22,3,'#FFB000');disc(bx+11,58,6,'#FFB000');disc(bx+11,58,4,'#8E1015');R(bx+8,55,2,2,'#FFB000');R(bx+12,55,2,2,'#FFB000');}
  // spotlights
  for(const [x0,x1] of [[60,220],[420,260]]){g.fillStyle='rgba(255,240,200,.06)';g.beginPath();g.moveTo(x0,0);g.lineTo(x1-50,216);g.lineTo(x1+50,216);g.closePath();g.fill();}
  // arena wall with torches
  R(0,190,W,26,'#4A2E22');for(let y=192;y<216;y+=8)for(let x=((y/8)%2)*14;x<W;x+=28)R(x,y,26,6,'#5A3A2A');R(0,190,W,2,'#8A5A3A');
  for(const tx of [60,180,300,420]){R(tx,176,4,14,'#3A2418');glow(tx+2,172,26,'255,150,50',0.035);disc(tx+2,172,4,'#FF6A00');disc(tx+2,170,2,'#FFE08A');}
  // sand floor with crest
  R(0,216,W,54,'#B08A5A');R(0,216,W,2,'#D8B080');for(let i=0;i<260;i++)P(rnd()*W,218+rnd()*52,rnd()<0.5?'#9A7648':'#C8A070');
  g.fillStyle='rgba(140,20,30,.35)';g.beginPath();g.ellipse(240,244,120,18,0,0,6.28);g.fill();g.fillStyle='rgba(176,138,90,1)';g.beginPath();g.ellipse(240,244,110,15,0,0,6.28);g.fill();
  g.fillStyle='rgba(140,20,30,.3)';g.beginPath();g.ellipse(240,244,34,6,0,0,6.28);g.fill();
  return cv;
}
function buildBridgeHi(){
  const {W,H,cv,g,R,P,poly,disc,rnd,glow,sky,ridge}=arenaKit(71);
  sky(['#2A1A4A','#3A1E52','#4A2256','#5E2856','#7A2E56','#963A50','#B8424A','#D05840','#E0683A','#EE8440','#F29444','#F6AC56','#F8BC62'],132);
  for(let i=0;i<40;i++)P(rnd()*W,rnd()*60,'#E8C8E0');
  glow(310,126,80,'255,180,90',0.02);disc(310,126,30,'#FFB24A');disc(310,126,26,'#FFD27A');disc(304,120,14,'#FFF0B8');
  for(const [x,y,w] of [[40,50,90],[200,34,120],[380,70,80],[120,90,60]]){R(x,y,w,3,'rgba(120,40,70,.55)');R(x+10,y+3,w-24,2,'rgba(120,40,70,.35)');}
  ridge(128,38,'#5A2A5A',1,0.013);ridge(132,22,'#3E1E48',4,0.02);
  R(0,132,W,84,'#2E3A6A');for(let y=134;y<216;y+=3)R(0,y,W,1,'#34427A');
  for(let y=134;y<216;y+=2){const w=Math.round(26-((y-134)/82)*12+Math.sin(y)*4);R(310-w,y,w*2,1,y%4?'#F29444':'#FFD27A');}
  for(let i=0;i<90;i++)R(rnd()*W,136+rnd()*78,2+rnd()*4,1,'#6A7AB0');
  for(let i=0;i<14;i++){const lx=20+rnd()*440,ly=160+rnd()*48;R(lx,ly,6,4,'#FF9A3A');R(lx+1,ly-1,4,1,'#FFE08A');R(lx,ly+4,6,1,'#5A2A1A');g.fillStyle='rgba(255,154,58,.2)';g.fillRect(lx-3,ly+5,12,3);}
  const pine=(x,h)=>{R(x,216-h,3,h,'#1A0E1E');for(let k=0;k<6;k++){const w=15-k*2.2;R(x-w+1,216-h+k*8+2,w*2,5,'#1E1428');}};
  pine(20,92);pine(46,70);pine(452,86);pine(428,64);
  R(0,188,W,6,'#C1121F');R(0,188,W,2,'#FF5A4E');R(0,206,W,3,'#9A0E18');
  for(let x=10;x<W;x+=58){R(x,182,6,34,'#C1121F');R(x+1,182,2,34,'#FF5A4E');disc(x+3,178,4,'#E0B040');P(x+2,175,'#FFE08A');}
  R(0,216,W,54,'#6A3A22');R(0,216,W,3,'#9A5A32');for(let y=222;y<H;y+=7)R(0,y,W,1,'#4A2616');
  for(let x=0;x<W;x+=38)R(x+((Math.floor(x/38))%2)*12,219,1,51,'#4A2616');for(let i=0;i<60;i++)P(rnd()*W,220+rnd()*48,'#7A4A2A');
  return cv;
}
function buildCastleHi(){
  const {W,H,cv,g,R,P,poly,disc,rnd,glow,sky}=arenaKit(83);
  sky(['#060A22','#081028','#0A1030','#0E163C','#121A44','#131C48','#182254','#1C2860'],190);
  for(let i=0;i<110;i++)P(rnd()*W,rnd()*150,rnd()<0.2?'#FFE08A':'#AFC0FF');
  glow(78,54,60,'255,245,200',0.02);disc(78,54,24,'#FFF4C8');disc(78,54,21,'#FFFBE8');disc(70,47,6,'#FFFFFF',0.6);for(const [x,y,r] of [[86,60,3],[74,62,2],[88,46,2]])disc(x,y,r,'#E8DCB0');
  const burst=(cx,cy,rad,c1,c2)=>{for(let a=0;a<6.28;a+=0.2){for(let k=4;k<=rad;k+=3){P(cx+Math.cos(a)*k,cy+Math.sin(a)*k,k>rad-5?c2:c1);}}disc(cx,cy,2,'#FFFFFF');glow(cx,cy,rad,'255,220,180',0.012,8);};
  burst(372,44,24,'#FF5A4E','#FFD27A');burst(436,86,16,'#2EC4B6','#BFFFF8');burst(308,30,13,'#FFB000','#FFFFFF');burst(160,40,11,'#9B59D0','#E6DCFF');
  const cx=240;
  R(cx-82,156,164,52,'#4A4A58');for(let y=158;y<208;y+=8)for(let x=cx-82+((y/8)%2)*8;x<cx+82;x+=16)R(x,y,15,7,'#5A5A6A');
  const tier=(y,w,h)=>{R(cx-w/2,y,w,h,'#E8E4DC');R(cx-w/2,y,w,2,'#FFFFFF');R(cx+w/2-6,y,6,h,'#C8C4BC');for(let x=cx-w/2+8;x<cx+w/2-8;x+=16){R(x,y+h/2-3,7,6,'#FFB24A');glow(x+3,y+h/2,8,'255,180,90',0.02,4);}
    poly([[cx-w/2-12,y],[cx+w/2+12,y],[cx+w/2+4,y-8],[cx-w/2-4,y-8]],'#2A2F45');R(cx-w/2-14,y-2,5,3,'#2A2F45');R(cx+w/2+9,y-2,5,3,'#2A2F45');R(cx-w/2-4,y-8,w+8,1,'#4A5070');};
  tier(126,130,30);tier(100,100,26);tier(78,70,22);tier(60,44,18);
  R(cx-16,46,32,6,'#2A2F45');R(cx-20,40,5,6,'#FFB000');R(cx+15,40,5,6,'#FFB000');P(cx-18,38,'#FFE08A');P(cx+17,38,'#FFE08A');
  R(0,182,cx-86,34,'#E8E4DC');R(cx+86,182,W,34,'#E8E4DC');R(0,176,cx-84,6,'#2A2F45');R(cx+84,176,W,6,'#2A2F45');for(let x=0;x<W;x+=8)if(x<cx-86||x>cx+86)P(x,175,'#4A5070');
  for(const [bx,red] of [[36,1],[176,0],[296,1],[436,0]]){R(bx,138,3,78,'#3A2A1A');R(bx+3,140,18,50,red?'#C1121F':'#F3E9E4');disc(bx+12,165,6,red?'#F3E9E4':'#C1121F');}
  R(92,168,6,48,'#3A2A1A');for(const [x,y,w] of [[74,162,30],[80,152,24],[88,144,16]])R(x,y,w,8,'#1E4A2E');
  R(0,216,W,54,'#8A8A94');R(0,216,W,2,'#B0B0BA');for(let y=220;y<H;y+=5)for(let x=0;x<W;x+=2)P(x,y+Math.round(Math.sin(x*0.06)*1),'#7A7A84');
  return cv;
}
function buildHallHi(){
  const {W,H,cv,g,R,P,poly,disc,rnd,glow}=arenaKit(97);
  R(0,0,W,H,'#1A0E0A');R(0,0,W,20,'#2A1A12');for(let x=0;x<W;x+=60)R(x,0,8,20,'#3A2418');R(0,20,W,3,'#8A5A20');
  for(let i=0;i<8;i++){const x=i*60,y=30;R(x+1,y,58,156,i%2?'#D8A83A':'#C8962A');R(x+1,y,58,2,'#FFE08A');R(x+58,y,2,156,'#8A5A10');for(let k=0;k<60;k++)P(x+2+rnd()*55,y+2+rnd()*150,'#E8C060');}
  const cloud=(x,y,w)=>{disc(x,y,w,'#F3E9E4',0.3);disc(x+w*0.6,y-3,Math.round(w*0.5),'#F3E9E4',0.4);disc(x-w*0.5,y+1,Math.round(w*0.4),'#E8DCC8',0.35);};
  cloud(60,60,20);cloud(226,50,26);cloud(390,70,20);cloud(144,96,14);cloud(330,110,12);
  const pineB=(x,y)=>{R(x,y,4,46,'#4A2A1A');R(x-15,y+3,34,7,'#2E6A3A');R(x-9,y-4,24,7,'#3A7A44');R(x-21,y+15,26,6,'#2E6A3A');R(x+6,y+24,22,5,'#3A7A44');};
  pineB(104,104);pineB(354,96);
  R(174,156,132,32,'#5A1A12');R(174,156,132,3,'#C88A20');R(188,144,104,12,'#6A2016');R(188,144,104,2,'#FFB000');
  R(218,116,44,30,'#C1121F');R(218,116,44,3,'#FF6B5E');for(let x=222;x<260;x+=6)P(x,130,'#FFB000');
  disc(240,106,14,'#2A2A34',0.7);R(226,106,28,6,'#2A2A34');R(236,90,8,10,'#FFB000');P(233,89,'#FFB000');P(246,89,'#FFB000');R(230,104,20,2,'#FFB000');
  for(const x of [12,72,408,466]){R(x,20,14,184,'#8E1015');R(x+3,20,3,184,'#C1121F');R(x-3,190,20,9,'#3A2418');R(x-3,20,20,6,'#C88A20');}
  for(const x of [134,332]){R(x,24,22,60,'#8E1015');R(x,24,22,3,'#FFB000');R(x+6,78,10,9,'#8E1015');disc(x+11,46,7,'#FFB000');disc(x+11,46,4,'#8E1015');}
  for(const x of [50,430]){R(x-9,198,18,9,'#3A2A20');R(x-3,207,6,9,'#2A1A12');glow(x,190,34,'255,140,40',0.03);disc(x,192,7,'#FF6A00');disc(x,189,4,'#FFB000');P(x,184,'#FFF2A8');}
  R(0,204,W,12,'#3A2418');R(0,204,W,2,'#8A5A20');
  R(0,216,W,54,'#B8B070');R(0,216,W,2,'#E0D890');for(let x=0;x<W;x+=96)R(x,216,3,54,'#2A3A2A');R(0,238,W,3,'#2A3A2A');for(let x=48;x<W;x+=96)R(x,238,3,32,'#2A3A2A');
  for(let i=0;i<220;i++)P(rnd()*W,218+rnd()*50,'#A8A060');g.fillStyle='rgba(255,200,90,.08)';g.fillRect(0,216,W,54);
  return cv;
}

function buildLaunchpadHi(){
  const {W,H,cv,g,R,P,poly,disc,rnd,glow,sky}=arenaKit(31);
  sky(['#07040F','#0A0616','#0D081E','#110A26','#140C2E','#160E34','#18103A','#1A1240'],200);
  for(let i=0;i<120;i++)P(rnd()*W,rnd()*150,rnd()<0.2?'#9BF07A':'#B8A8E8');
  glow(420,40,60,'200,255,200',0.02);disc(420,40,20,'#E8FFE0');disc(414,34,6,'#FFFFFF',0.6);for(const [x,y,r] of [[428,46,3],[416,48,2]])disc(x,y,r,'#C8E8C0');
  // neon skyline
  let x=0;while(x<W){const w=18+rnd()*34,h=40+rnd()*70;R(x,196-h,w,h,'#120A22');R(x,196-h,w,1,'#2A1A4A');
    for(let yy=196-h+6;yy<190;yy+=8)for(let xx=x+3;xx<x+w-3;xx+=6)if(rnd()<0.45)R(xx,yy,3,4,rnd()<0.6?'#3AF07A':'#E040C0');x+=w+3;}
  // giant screen with rising candles and a full bonding curve
  const sx=150,sy=34,sw=180,sh=120;glow(sx+sw/2,sy+sh/2,130,'60,240,120',0.018);
  R(sx-6,sy-6,sw+12,sh+12,'#2A2A3A');R(sx-4,sy-4,sw+8,sh+8,'#0A0A12');R(sx,sy,sw,sh,'#06140C');
  for(let yy=sy+10;yy<sy+sh-24;yy+=12)R(sx+4,yy,sw-8,1,'#0E2A18');
  let y=sy+sh-34;for(let i=0;i<16;i++){const up=rnd()<0.8;const bh=6+Math.floor(rnd()*14);const cx=sx+8+i*10.5;const top=up?y-bh:y;
    R(cx+2,top-4,1,bh+8,up?'#3AF07A':'#FF4A6A');R(cx,top,5,bh,up?'#3AF07A':'#FF4A6A');y=up?y-Math.floor(bh*0.8):y+Math.floor(bh*0.4);}
  g.font='8px "Press Start 2P"';g.textAlign='left';g.textBaseline='middle';g.fillStyle='#9BF07A';g.fillText('$ONI',sx+8,sy+10);g.fillStyle='#3AF07A';g.textAlign='right';g.fillText('+1337%',sx+sw-8,sy+10);
  R(sx+8,sy+sh-20,sw-16,10,'#0E2A18');R(sx+8,sy+sh-20,sw-16,10,'#3AF07A');R(sx+8,sy+sh-20,sw-16,2,'#BFFFD0');
  g.textAlign='center';g.fillStyle='#06140C';g.fillText('BONDING CURVE 100%',sx+sw/2,sy+sh-14);
  R(sx+sw/2-44,sy+sh+10,88,14,'#3AF07A');g.fillStyle='#06140C';g.fillText('GRADUATED!',sx+sw/2,sy+sh+17);
  R(sx+sw/2-4,sy+sh+6,8,90,'#2A2A3A');
  // rocket on the launch gantry
  R(40,70,8,146,'#3A3A4A');for(let yy=74;yy<216;yy+=12){for(let k=0;k<12;k++)P(40+k*0.8,yy+k,'#5A5A6A');}
  R(58,96,26,96,'#E8E8F0');R(58,96,8,96,'#FFFFFF');R(78,96,6,96,'#B8B8C8');poly([[58,96],[84,96],[71,66]],'#C1121F');
  disc(71,120,6,'#1A1240');disc(71,120,4,'#3AF07A');poly([[50,178],[58,160],[58,192],[50,192]],'#C1121F');poly([[92,178],[84,160],[84,192],[92,192]],'#C1121F');
  glow(71,204,30,'255,160,60',0.04);for(let i=0;i<30;i++){g.fillStyle=`rgba(230,230,240,${0.08+rnd()*0.1})`;g.beginPath();g.arc(50+rnd()*44,200+rnd()*16,4+rnd()*8,0,6.28);g.fill();}
  // launch deck floor with hazard stripes and neon grid
  R(0,216,W,54,'#1C1C28');R(0,216,W,3,'#3AF07A');
  for(let x2=-20;x2<W;x2+=16)poly([[x2,219],[x2+8,219],[x2+2,227],[x2-6,227]],'#FFC93A');R(0,227,W,1,'#0A0A12');
  for(let i=-12;i<=12;i++){const x0=240+i*20,x1=240+i*60;for(let yy=228;yy<H;yy++){const t=(yy-228)/42;P(x0+(x1-x0)*t,yy,'rgba(58,240,122,.35)');}}
  for(const yy of [236,246,258])R(0,yy,W,1,'rgba(58,240,122,.3)');
  for(let yy=230;yy<H;yy+=2){const w=Math.round(16+(yy-230)*0.4);R(240-w,yy,w*2,1,`rgba(58,240,122,${0.1-(yy-230)*0.002})`);}
  // confetti
  for(let i=0;i<60;i++)R(rnd()*W,rnd()*200,2,1,['#3AF07A','#FFC93A','#E040C0','#FFFFFF'][Math.floor(rnd()*4)]);
  return cv;
}
function buildHelipadHi(){
  const {W,H,cv,g,R,P,poly,disc,rnd,glow,sky}=arenaKit(57);
  sky(['#0A0A24','#0E0E2E','#141438','#1C1A44','#28204E','#3A2656','#522C5A','#6E345A','#8E3E56','#B04C50'],170);
  for(let i=0;i<90;i++)P(rnd()*W,rnd()*110,rnd()<0.2?'#FFE8C8':'#9A9AC8');
  glow(380,58,70,'255,220,180',0.02);disc(380,58,20,'#FFF0D8');disc(374,52,6,'#FFFFFF',0.6);
  // the city far below: towers with lit windows and red aviation lights
  let x=-10;while(x<W){const w=14+rnd()*26,h=40+rnd()*90;R(x,210-h,w,h,rnd()<0.5?'#10102A':'#141432');
    for(let yy=210-h+5;yy<206;yy+=6)for(let xx=x+2;xx<x+w-2;xx+=4)if(rnd()<0.35)R(xx,yy,2,2,rnd()<0.7?'#FFD27A':'#7FE7FF');
    if(rnd()<0.6){R(x+w/2,210-h-5,1,5,'#3A3A5A');R(x+w/2-1,210-h-7,3,2,'#FF3B30');}x+=w+2;}
  // a giant sign on a tower
  R(40,64,60,34,'#1A0B0C');R(42,66,56,30,'#C1121F');g.fillStyle='#FFE08A';g.font='22px serif';g.textAlign='center';g.textBaseline='middle';g.fillText('天皇',70,82);
  // helicopters with searchlights
  const heli=(hx,hy,s,dir)=>{g.fillStyle='rgba(255,250,220,.07)';g.beginPath();g.moveTo(hx,hy+6*s);g.lineTo(hx-30*s+dir*40,216);g.lineTo(hx+30*s+dir*40,216);g.closePath();g.fill();
    poly([[hx-14*s,hy],[hx+10*s,hy],[hx+14*s,hy+5*s],[hx+10*s,hy+9*s],[hx-12*s,hy+9*s]],'#1E2030');R(hx-6*s,hy+2*s,8*s,4*s,'#5A7A9A');
    R(hx-30*s,hy+3*s,18*s,2*s,'#1E2030');R(hx-32*s,hy-1*s,3*s,7*s,'#1E2030');R(hx-22*s,hy-5*s,44*s,1,'#3A3A5A');R(hx-2*s,hy-4*s,2*s,4*s,'#1E2030');
    R(hx-12*s,hy+11*s,20*s,1,'#3A3A5A');R(hx+10*s,hy+4*s,2,2,'#FF3B30');R(hx-31*s,hy-1*s,2,2,'#2EE88A');};
  heli(120,36,1,1);heli(420,90,0.7,-1);heli(300,22,0.5,-1);
  // rooftop railing and the helipad
  R(0,196,W,12,'#2A2A38');for(let xx=0;xx<W;xx+=12){R(xx,190,2,18,'#4A4A5A');}R(0,188,W,3,'#5A5A6A');
  for(let xx=6;xx<W;xx+=40){R(xx,184,3,3,'#FF3B30');glow(xx+1,185,8,'255,60,50',0.04,4);}
  R(0,208,W,62,'#2E3038');R(0,208,W,3,'#FFD24A');for(let xx=0;xx<W;xx+=24){R(xx,212,10,3,'#FFD24A');}
  R(0,216,W,54,'#262830');g.fillStyle='rgba(255,210,74,.9)';g.beginPath();g.ellipse(240,244,120,20,0,0,6.28);g.fill();g.fillStyle='#262830';g.beginPath();g.ellipse(240,244,114,17,0,0,6.28);g.fill();
  R(222,234,6,20,'#F3E9E4');R(252,234,6,20,'#F3E9E4');R(222,242,36,4,'#F3E9E4');
  for(let a=0;a<6.28;a+=0.39){const lx=240+Math.cos(a)*126,ly=244+Math.sin(a)*22;R(lx-1,ly-1,3,2,'#7FE7FF');}
  for(let i=0;i<200;i++)P(rnd()*W,218+rnd()*52,rnd()<0.5?'#2A2C34':'#30323C');
  return cv;
}
