/* ===== HI-RES CAULDRONS (drawn in a 480-space canvas) ===== */

/* ===== bronze ding cauldrons (modern Chinese style) ===== */
function dingDraw(g,cx,base,s,kind,t,fill){
  const S=kind==='season';const L=S?['#FFF2B0','#FFC93A','#E09A10']:['#E6FFFF','#7FE7FF','#2EC4B6'];const glow=S?'255,190,60':'60,220,200';
  const E=(x,y,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(cx+x*s,base+y*s,rx*s,ry*s,0,0,6.283);g.fill();};
  const Pp=(pts,c)=>{g.fillStyle=c;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(cx+p[0]*s,base+p[1]*s):g.moveTo(cx+p[0]*s,base+p[1]*s));g.closePath();g.fill();};
  E(0,2,66,10,'rgba(0,0,0,.35)');
  // glow behind
  const gr=g.createRadialGradient(cx,base-90*s,6*s,cx,base-90*s,110*s);gr.addColorStop(0,`rgba(${glow},${0.28+0.2*(fill||0)})`);gr.addColorStop(1,`rgba(${glow},0)`);g.fillStyle=gr;g.fillRect(cx-120*s,base-210*s,240*s,220*s);
  // three legs
  for(const lx of [-36,0,36]){Pp([[lx-7,-34],[lx+7,-34],[lx+5,-6],[lx+8,0],[lx-8,0],[lx-5,-6]],lx?'#5A4228':'#6E5230');Pp([[lx-7,-34],[lx-3,-34],[lx-3,-4],[lx-6,-4]],'#8A6A3A');}
  // bronze belly with patina and highlight
  E(0,-62,56,36,'#4A3820');E(0,-63,54,34,'#7A5A30');E(-18,-72,22,16,'rgba(220,180,110,.35)');
  E(22,-52,16,10,'rgba(62,122,106,.55)');E(-30,-48,10,7,'rgba(62,122,106,.45)');E(34,-70,8,6,'rgba(62,122,106,.4)');
  // emblem: 金 for the Season Cauldron, 咒 for the Curse Cauldron
  g.fillStyle=S?'#FFC93A':'#7FE7FF';g.font=`bold ${Math.round(26*s)}px serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(S?'金':'咒',cx,base-56*s);
  // gold band with cloud motifs
  Pp([[-54,-90],[54,-90],[56,-80],[-56,-80]],'#B8862A');Pp([[-54,-90],[54,-90],[54,-88],[-54,-88]],'#FFE08A');
  g.strokeStyle='#6A4A10';g.lineWidth=Math.max(1,1.4*s);for(let x=-46;x<=46;x+=13){g.beginPath();g.arc(cx+x*s,base-85*s,3.2*s,Math.PI*0.2,Math.PI*1.7);g.stroke();}
  // upright handles
  for(const hx of [-40,40]){g.strokeStyle='#4A3820';g.lineWidth=7*s;g.strokeRect(cx+(hx-8)*s,base-122*s,16*s,28*s);g.strokeStyle='#C8962A';g.lineWidth=3.5*s;g.strokeRect(cx+(hx-8)*s,base-122*s,16*s,28*s);}
  // rim and glowing liquid
  E(0,-92,58,12,'#3A2A16');E(0,-93,52,9,L[2]);E(0,-94,48,7,L[1]);E(-10,-95,20,3,L[0]);
  for(let i=0;i<6;i++){const ph=((t||0)*0.9+i*23)%60;const x=-36+i*14+Math.sin((t||0)*0.05+i)*4;g.globalAlpha=Math.max(0,1-ph/60);E(x,-96-ph*1.4,2.2,2.2,L[0]);g.globalAlpha=1;}
}
function cauldHi(g,cx,base,kind,fill,t,amount){dingDraw(g,cx,base,0.95,kind,t,fill);
  const SK=kind==='season';g.font='8px "Press Start 2P"';g.textAlign='center';g.textBaseline='middle';const lab=SK?'SEASON CAULDRON':'CURSE CAULDRON';
  const w=Math.max(g.measureText(lab).width,g.measureText(amount||'').width)+18;g.fillStyle='#1A0B0C';g.fillRect(cx-w/2,base+14,w,30);g.fillStyle=SK?'#FFC93A':'#2EC4B6';g.fillRect(cx-w/2,base+14,w,2);
  g.fillStyle=SK?'#FFE08A':'#BFFFF8';g.fillText(lab,cx,base+22);g.font='12px "Press Start 2P"';g.fillStyle='#FFF6F0';g.fillText(amount||'',cx,base+36);return;

  const S=kind==='season';
  const C=S?{rim0:'#FFF2B0',rim1:'#FFC93A',rim2:'#C88A00',rim3:'#7A4E00',body0:'#4A3A3A',body1:'#2A2226',body2:'#18141A',liq0:'#FF8A5A',liq1:'#E0282E',liq2:'#9E1620',liq3:'#5E0A10',glow:'255,70,40',fire:['#FFF2A8','#FFB000','#FF6A00','#C1121F'],mark:'#FFC93A',eye:'#FF3B30'}
          :{rim0:'#E6FFFF',rim1:'#7FE7FF',rim2:'#2EC4B6',rim3:'#16746B',body0:'#2E4A44',body1:'#1C302C',body2:'#0E1C1A',liq0:'#BFFFF8',liq1:'#2EC4B6',liq2:'#1E8A7A',liq3:'#0E4A42',glow:'46,196,182',fire:['#E6FFFF','#9BF07A','#2EC4B6','#146B5E'],mark:'#9BF07A',eye:'#BFFFF8'};
  const P=(x,y,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),1,1);};const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const ell=(x,y,rx,ry,c)=>{g.fillStyle=c;for(let dy=-ry;dy<=ry;dy++){const w=Math.round(rx*Math.sqrt(1-(dy*dy)/(ry*ry)));g.fillRect(Math.round(x-w),Math.round(y+dy),w*2+1,1);}};
  const glow=(x,y,r,a)=>{for(let k=12;k>=1;k--){g.fillStyle=`rgba(${C.glow},${a})`;g.beginPath();g.ellipse(x,y,r*k/12,r*k/12*0.8,0,0,Math.PI*2);g.fill();}};
  glow(cx,base-70,120,0.022);
  // stone fire pit
  ell(cx,base,78,12,'#2A2224');for(let i=0;i<16;i++){const a=i/16*Math.PI*2;const sx=cx+Math.cos(a)*70,sy=base+Math.sin(a)*9;ell(sx,sy-2,9,5,i%2?'#5A5058':'#4A4048');ell(sx-2,sy-4,4,2,'#6A6068');}
  // fire tongues
  for(let i=0;i<13;i++){const fx=cx-54+i*9,h=26+Math.round(10*Math.sin(t*0.22+i*1.3))+(i%3)*6;
    for(let r=0;r<h;r++){const q=r/h,w=Math.max(1,Math.round(5*(1-q)+(r<3?1:0)));const sway=Math.round(Math.sin(t*0.3+r*0.25+i)*q*2.5);
      R(fx-w+sway,base-4-r,w*2,1,q<0.3?C.fire[3]:q<0.6?C.fire[2]:q<0.85?C.fire[1]:C.fire[0]);}}
  // claw legs
  for(const lx of [-44,0,44]){g.fillStyle=C.rim2;g.fillRect(cx+lx-4,base-40,8,26);g.fillStyle=C.rim1;g.fillRect(cx+lx-4,base-40,3,26);for(const k of [-6,0,6]){R(cx+lx+k-1,base-16,3,5,C.rim3);P(cx+lx+k,base-11,C.rim1);}}
  // pot body (belly)
  const top=base-128,H=92;
  for(let y=0;y<H;y++){const q=y/H;const w=Math.round(66*Math.sqrt(Math.max(0.06,1-Math.pow((q-0.38)/0.66,2))));
    R(cx-w,top+y,w*2,1,C.body1);R(cx-w,top+y,Math.round(w*0.35),1,C.body0);R(cx+w-Math.round(w*0.28),top+y,Math.round(w*0.28),1,C.body2);}
  // bands
  for(const by of [top+10,top+60]){const q=(by-top)/H;const w=Math.round(66*Math.sqrt(Math.max(0.06,1-Math.pow((q-0.38)/0.66,2))));R(cx-w,by,w*2,5,C.rim2);R(cx-w,by,w*2,1,C.rim1);R(cx-w,by+4,w*2,1,C.rim3);
    for(let x=cx-w+6;x<cx+w-4;x+=10){P(x,by+2,C.rim0);}}
  // emblem: oni mask (season) or ghost face (curse)
  const ey=top+34;
  if(S){ell(cx,ey,15,13,C.rim3);ell(cx,ey,13,11,C.rim1);ell(cx-3,ey-4,6,3,C.rim0);R(cx-9,ey-16,3,8,C.rim0);R(cx+6,ey-16,3,8,C.rim0);R(cx-8,ey-3,5,3,C.eye);R(cx+3,ey-3,5,3,C.eye);R(cx-6,ey+4,12,3,C.rim3);P(cx-5,ey+4,'#FFFFFF');P(cx+4,ey+4,'#FFFFFF');}
  else{ell(cx,ey,14,14,C.rim3);ell(cx,ey,12,12,'#D8FFF6');R(cx-7,ey-3,5,5,C.body2);R(cx+2,ey-3,5,5,C.body2);P(cx-5,ey-1,C.eye);P(cx+4,ey-1,C.eye);R(cx-1,ey+3,2,3,C.body2);for(let k=-6;k<=6;k+=3)R(cx+k,ey+8,2,3,C.body2);}
  // side handles held by rings
  for(const s of [-1,1]){const hx=cx+s*70;for(let a=0;a<6.28;a+=0.12)P(hx+Math.cos(a)*9,top+26+Math.sin(a)*9,C.rim1);for(let a=0;a<6.28;a+=0.12)P(hx+Math.cos(a)*8,top+26+Math.sin(a)*8,C.rim2);}
  if(!S)for(const s of [-1,1])for(let k=0;k<7;k++){const x=cx+s*(60-k*2),y=top+34+k*6;R(x-1,y,3,4,'#6A7A78');R(x,y+1,1,2,'#9AAAA8');}
  // rim and liquid surface
  ell(cx,top,72,15,C.rim3);ell(cx,top-1,70,13,C.rim2);ell(cx,top-2,68,12,C.rim1);ell(cx,top-2,62,10,'#0A0406');
  const ly=top-2+Math.round((1-fill)*4);ell(cx,ly,60,9,C.liq3);ell(cx,ly-1,58,8,C.liq2);ell(cx,ly-1,50,6,C.liq1);
  for(let k=0;k<9;k++){const a=t*0.04+k*0.7;const bx=cx+Math.cos(a)*38,by=ly+Math.sin(a*1.3)*4;ell(bx,by,2+(k%2),1,C.liq0);}
  ell(cx-16,ly-3,14,2,C.liq0);
  // floating tokens: coins (season) or souls (curse)
  if(S){for(let k=0;k<6;k++){const a=t*0.035+k*1.05;const x=cx+Math.cos(a)*34,y=ly-2+Math.sin(a*2)*3;ell(x,y,4,2,'#8A5A00');ell(x,y-1,4,2,'#FFC93A');P(x-1,y-2,'#FFF2B0');}}
  else{for(let k=0;k<5;k++){const ph=(t*0.9+k*37)%90;const x=cx-30+k*15+Math.sin((t+k*20)*0.08)*5,y=ly-6-ph*0.9;const al=Math.max(0,1-ph/90);
    g.globalAlpha=al;ell(x,y,4,5,'#D8FFF6');R(x-2,y-1,1,2,'#0E1C1A');R(x+1,y-1,1,2,'#0E1C1A');R(x-3,y+4,2,4,'#D8FFF6');R(x+1,y+5,2,3,'#BFFFF8');g.globalAlpha=1;}}
  // rising embers / sparks
  for(let k=0;k<14;k++){const ph=(t*1.3+k*29)%110;const x=cx-40+((k*37)%80)+Math.sin((t+k*9)*0.05)*6,y=ly-4-ph;g.globalAlpha=Math.max(0,1-ph/110);P(x,y,k%2?C.fire[1]:C.liq0);g.globalAlpha=1;}
  // plaque with name and amount
  const pw=150;R(cx-pw/2-3,base+16,pw+6,40,'#1A0B0C');R(cx-pw/2,base+19,pw,34,S?'#3A1410':'#0E2A26');R(cx-pw/2,base+19,pw,2,C.rim1);R(cx-pw/2,base+51,pw,2,C.rim2);
  g.textAlign='center';g.textBaseline='middle';g.font='7px "Press Start 2P"';g.fillStyle=C.rim1;g.fillText(S?'SEASON CAULDRON':'CURSE CAULDRON',cx,base+28);
  g.font='14px "Press Start 2P"';g.fillStyle='#1A0506';g.fillText(amount,cx+1,base+44);g.fillStyle=S?'#FFE08A':'#BFFFF8';g.fillText(amount,cx,base+43);
}
