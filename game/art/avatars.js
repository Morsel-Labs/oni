/* ===== avatar skins for the village (preview) ===== */
const AVATARS={ronin:{name:'Straw Ronin',price:500},lantern:{name:'Lantern Ghost',price:700},komainu:{name:'Komainu',price:900},shogun:{name:'Golden Shogun',price:1500,ltd:500}};
function avatarLow(g,x,y,dir,av,step,t){
  const R=(px,py,w,h,col)=>{g.fillStyle=col;g.fillRect(Math.round(px*2)/2,Math.round(py*2)/2,w,h);};const P=(px,py,col)=>R(px,py,1,1,col);
  const poly=(pts,col)=>{g.fillStyle=col;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill();};
  const lo=step?1:0,side=dir==='left'?-1:1,back=dir==='up',front=dir==='down',prof=!back&&!front;
  g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(x,y,9,3,0,0,6.28);g.fill();
  if(av==='ronin'){
    R(x-6,y-9,5,8+lo,'#3A3F52');R(x+1,y-9,5,8-lo,'#2A2E3E');R(x-7,y-2+lo,6,2,'#C8A060');R(x+1,y-2-lo,6,2,'#A8803E');
    R(x-7,y-18,14,10,'#7A6A5A');R(x+2,y-18,5,10,'#5A4C40');R(x-5,y-15,3,3,'#8E7E6A');R(x+3,y-12,2,2,'#4A3E34');R(x-7,y-10,14,2,'#2A2A36');
    if(!back){poly([[x-2,y-18],[x+2,y-18],[x,y-13]],'#E8D8C0');}
    R(x-9,y-17,3,8,'#7A6A5A');R(x+6,y-17,3,8,'#5A4C40');R(x-9,y-10,3,2,'#E8C8A0');R(x+6,y-10,3,2,'#C8A880');
    if(back)R(x-1,y-19,2,14,'#2A1A10');else{R(x+side*4,y-11,side*10,2,'#2A1A10');R(x+side*4,y-11,side*2,2,'#C8962A');}
    const hx=x-7,hy=y-30;R(hx,hy,14,12,'#F2D2B0');R(hx+10,hy,4,12,'#D8B490');
    if(front){R(hx+3,hy+6,2,2,'#2A1A10');R(hx+9,hy+6,2,2,'#2A1A10');R(hx+3,hy+10,8,1,'#A8806A');for(let i=0;i<6;i++)P(hx+3+i,hy+11,'#8A6A5A');}
    else if(prof){R(side<0?hx+2:hx+9,hy+6,2,2,'#2A1A10');R(side<0?hx+8:hx,hy,6,12,'#2A1A10');}else R(hx,hy+2,14,10,'#2A1A10');
    poly([[x-16,y-29],[x+16,y-29],[x+3,y-40],[x-3,y-40]],'#D8B46A');poly([[x+4,y-29],[x+16,y-29],[x+3,y-40]],'#B8944A');
    for(let k=0;k<4;k++){g.fillStyle='rgba(120,80,20,.5)';g.fillRect(x-14+k*2.4,y-30.5-k*2.6,28-k*4.8,0.6);}
    R(x-16,y-29,32,1.2,'#8A6A2A');R(x-1,y-41,2,2,'#B8944A');
    return;}
  if(av==='lantern'){
    const bob=Math.round(Math.sin(t*0.18)*1.5)-(step?1:0);const cy=y-17+bob;
    const gr=g.createRadialGradient(x,cy,2,x,cy,24);gr.addColorStop(0,'rgba(255,170,70,.35)');gr.addColorStop(1,'rgba(255,170,70,0)');g.fillStyle=gr;g.beginPath();g.arc(x,cy,24,0,6.28);g.fill();
    R(x-4,y-3+bob,2,3,'#2A1A10');R(x+2,y-3+bob,2,3,'#2A1A10');
    g.fillStyle='#F6EBD8';g.beginPath();g.ellipse(x,cy,10,13,0,0,6.28);g.fill();g.fillStyle='#E8D2B0';g.beginPath();g.ellipse(x+4,cy,5,12,0,0,6.28);g.fill();
    for(let k=-9;k<=9;k+=3){g.fillStyle='rgba(140,90,40,.45)';g.fillRect(x-Math.sqrt(Math.max(0,100-k*k*100/169))*1,cy+k,Math.sqrt(Math.max(0,100-k*k*100/169))*2,0.6);}
    R(x-6,cy-15,12,3,'#1A1414');R(x-6,cy+12,12,3,'#1A1414');R(x-1,cy-18,2,3,'#1A1414');
    if(!back){const ex=prof?x+side*3:x;g.fillStyle='#FFFFFF';g.beginPath();g.ellipse(ex,cy-4,4,3.4,0,0,6.28);g.fill();g.fillStyle='#1A0506';g.beginPath();g.arc(ex+(prof?side*1:0),cy-4,1.8,0,6.28);g.fill();
      R(ex-4,cy+3,8,3,'#8E1015');R(ex-1.5,cy+5,3,6+Math.round(Math.sin(t*0.3)),'#E0384A');}
    else{g.fillStyle='#C1121F';g.font='bold 10px serif';g.textAlign='center';g.textBaseline='middle';g.fillText('鬼',x,cy+1);}
    return;}
  if(av==='komainu'){
    R(x-6,y-9,5,8+lo,'#B3161F');R(x+1,y-9,5,8-lo,'#8E1015');R(x-7,y-2+lo,6,2,'#FFE08A');R(x+1,y-2-lo,6,2,'#E0A020');
    R(x-7,y-18,14,10,'#C1121F');R(x+2,y-18,5,10,'#8E1015');for(const xx of [-5,-1,3])R(x+xx,y-15,2,2,'#FFC93A');
    R(x-9,y-17,3,8,'#C1121F');R(x+6,y-17,3,8,'#8E1015');R(x-9,y-10,3,2,'#FFE08A');R(x+6,y-10,3,2,'#E0A020');
    if(back||prof){const tx=x-(prof?side:1)*8;for(let i=0;i<5;i++){g.fillStyle=i%2?'#2E8A5A':'#4EB07A';g.beginPath();g.arc(tx-(prof?side:1)*i*1.2,y-14-i*2,2.4,0,6.28);g.fill();}}
    const hx=x-8,hy=y-31;for(let i=0;i<10;i++){const a=i/10*6.28;g.fillStyle=i%2?'#2E8A5A':'#4EB07A';g.beginPath();g.arc(x+Math.cos(a)*9,hy+7+Math.sin(a)*8,3.2,0,6.28);g.fill();}
    R(hx+1,hy+1,14,12,'#C1121F');R(hx+11,hy+1,4,12,'#8E1015');
    if(!back){const ex=prof?(side<0?hx+3:hx+9):hx+3;R(ex,hy+4,3,2,'#FFE14A');if(front)R(hx+10,hy+4,3,2,'#FFE14A');R(hx+4,hy+8,8,3,'#F6EBD8');P(hx+5,hy+8,'#1A0506');P(hx+10,hy+8,'#1A0506');R(x-1,hy+6,2,2,'#1A0506');}
    R(x-1,hy-3,2,4,'#FFC93A');
    return;}
  if(av==='shogun'){
    R(x-6,y-9,5,8+lo,'#2A2A36');R(x+1,y-9,5,8-lo,'#1A1A24');R(x-7,y-2+lo,6,2,'#1A1A24');R(x+1,y-2-lo,6,2,'#0E0E14');
    R(x-7,y-12,14,4,'#C88A00');for(let k=-6;k<7;k+=3)R(x+k,y-12,1,4,'#8E1015');
    R(x-7,y-19,14,8,'#FFC93A');R(x+2,y-19,5,8,'#C88A00');R(x-7,y-19,14,1,'#FFF2B0');for(const yy of [y-16,y-13])R(x-6,yy,12,0.6,'#8A5A00');
    R(x-10,y-19,4,6,'#FFC93A');R(x+6,y-19,4,6,'#C88A00');R(x-10,y-14,4,1,'#8E1015');R(x+6,y-14,4,1,'#8E1015');
    const hx=x-8,hy=y-31;R(hx-1,hy,18,6,'#FFC93A');R(hx-1,hy,18,1,'#FFF2B0');R(hx+12,hy,5,6,'#C88A00');R(hx-3,hy+5,22,2,'#C88A00');
    if(!back){R(hx+2,hy+6,12,7,'#1A1414');R(hx+4,hy+7,3,2,'#FF3B30');R(hx+9,hy+7,3,2,'#FF3B30');R(hx+5,hy+10,6,1,'#FFC93A');}else R(hx+1,hy+6,14,7,'#C88A00');
    g.strokeStyle='#FFE14A';g.lineWidth=2;g.beginPath();g.arc(x,hy-2,8,Math.PI*1.1,Math.PI*1.9);g.stroke();g.strokeStyle='#FFF2B0';g.lineWidth=0.7;g.beginPath();g.arc(x,hy-2.5,8,Math.PI*1.15,Math.PI*1.5);g.stroke();
    if(t%4===0)for(let i=0;i<2;i++){g.fillStyle='#FFE08A';g.fillRect(Math.round(x+(Math.random()*2-1)*12),Math.round(y-8-Math.random()*30),1,1);}
    return;}
}
function avatarDraw(g,x,y,dir,av,step,t){const tf=g.getTransform();const B=document.createElement('canvas');B.width=128;B.height=160;const b=B.getContext('2d');b.setTransform(2,0,0,2,64,140);avatarLow(b,0,0,dir,av,step,t);
  const O=document.createElement('canvas');O.width=128;O.height=160;const o=O.getContext('2d');for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])o.drawImage(B,dx,dy);o.globalCompositeOperation='source-in';o.fillStyle='rgba(12,6,8,.9)';o.fillRect(0,0,128,160);o.globalCompositeOperation='source-over';o.drawImage(B,0,0);
  g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(O,Math.round(tf.a*x+tf.e-64),Math.round(tf.d*y+tf.f-140));g.restore();}
/* ===== the Oni Emperor: admin only, a white shogun on a white horse (HD) ===== */
function emperorLow(g,x,y,dir,step,t){
  const P=(pts,c)=>{g.fillStyle=c;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(x+p[0],y+p[1]):g.moveTo(x+p[0],y+p[1]));g.closePath();g.fill();};
  const E=(cx,cy,rx,ry,c,rot)=>{g.fillStyle=c;g.beginPath();g.ellipse(x+cx,y+cy,rx,ry,rot||0,0,6.283);g.fill();};
  const L=(x0,y0,x1,y1,c,w)=>{g.strokeStyle=c;g.lineWidth=w||0.6;g.lineCap='round';g.beginPath();g.moveTo(x+x0,y+y0);g.lineTo(x+x1,y+y1);g.stroke();};
  const back=dir==='up',front=dir==='down',s=dir==='left'?-1:1;const run=step?1:0,gal=Math.sin(t*0.35)*(step?1:0.15),flow=Math.sin(t*0.12);
  const W='#F6F4EF',W2='#DCD8D0',W3='#B8B2AA',GD='#E0A020',GL='#FFE08A',RD='#B3161F',RD2='#7A0A12',INK='#16121A';
  g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(x,y,front||back?9:17,3.2,0,0,6.283);g.fill();
  if(!front&&!back){g.save();g.translate(x,y);g.scale(s,1);g.translate(-x,-y);
    // tail, hind legs, body, front legs
    for(let i=0;i<5;i++)L(-12,-18,-19-i*0.7+flow,-6-i*0.6,i%2?'#C8C6CE':'#E8E6EE',1.4);
    const leg=(lx,ph,c)=>{const k=Math.sin(t*0.35+ph)*(step?3:0.4);L(lx,-13,lx+k*0.5,-6,c,2.2);L(lx+k*0.5,-6,lx+k,-1,c,1.8);E(lx+k,-0.6,1.4,0.9,INK);};
    leg(-8,0,W3);leg(7,Math.PI,W3);
    E(0,-16,13,6.6,W);E(0,-13.6,11,3.4,W2);E(-4,-18.5,6,2.2,'#FFFFFF');for(const [dx,dy] of [[-6,-15],[-2,-13],[3,-16],[6,-14],[-9,-17]])E(dx,dy,1.1,0.8,'rgba(150,145,160,.35)');
    leg(-10,Math.PI,W2);leg(9,0,W2);
    // neck, head, mane, bridle
    P([[7,-20],[13,-30],[17,-29],[12,-15]],W);P([[13,-31],[22,-28],[23.5,-25],[21,-23.5],[13,-26]],W);E(22,-25,2,1.6,'#C8C2C8');E(16,-28.2,0.8,0.8,INK);P([[13.5,-31],[14.5,-34],[15.8,-30.6]],W2);
    for(let i=0;i<6;i++)L(8+i*1.1,-21-i*1.6,5+i*1.1+flow*0.6,-19-i*1.6,i%2?'#C8C6CE':'#E8E6EE',1.2);
    L(14,-29,22,-26.5,RD,0.7);L(17,-25,21,-24,RD,0.7);L(18.5,-25,6,-27,'#5A0A0E',0.5);
    // saddle cloth and saddle
    P([[-7,-21],[6,-21],[6.5,-15],[-7.5,-15]],RD);P([[-7.5,-15.6],[6.5,-15.6],[6.5,-14.8],[-7.5,-14.8]],GD);P([[-4,-23],[4,-23],[4,-20.5],[-4,-20.5]],RD2);
    // rider: leg, cape, torso, arm, head
    P([[-2,-23],[3,-23],[3,-16],[1,-13],[-1,-13]],'#E8E4DC');P([[0,-13.5],[2.6,-13.5],[2.6,-12],[0,-12]],INK);
    P([[-4,-34],[-1,-34],[-7+flow*1.5,-18],[-12+flow*2,-19]],RD);P([[-4,-34],[-3,-34],[-9+flow*1.5,-19],[-10.5+flow*1.5,-19.5]],'#E0384A');
    P([[-4,-34],[4,-34],[4.5,-23],[-4.5,-23]],W);P([[1.5,-34],[4,-34],[4.5,-23],[2,-23]],W2);for(const yy of [-31,-28,-25])L(-4,yy,4.2,yy,GD,0.5);L(0,-34,0,-23,GL,0.4);
    P([[-5,-35],[0,-35],[0,-31],[-5,-31.5]],W2);P([[0,-35],[5,-35],[5.5,-31],[0,-31]],W);L(-5,-31.2,5.5,-31,GD,0.5);
    L(3,-31,8,-27,W2,2);L(8,-27,10,-26.6,'#E8D8C0',1.6);
    E(0.5,-38.6,4.4,4,W);P([[-4.6,-38],[5.6,-38],[6.6,-35.6],[-5.6,-35.6]],W2);P([[0.8,-37.6],[5,-37.6],[4.6,-34.6],[1.2,-34.6]],INK);E(3.6,-36.8,0.6,0.45,'#FF3B30');L(1.6,-35.2,4.2,-35.2,GL,0.4);
    g.strokeStyle=GD;g.lineWidth=1.1;g.beginPath();g.arc(x+0.6,y-42.5,4.4,Math.PI*1.08,Math.PI*1.92);g.stroke();g.strokeStyle=GL;g.lineWidth=0.4;g.stroke();E(0.6,-42.6,0.8,0.8,'#C49BFF');
    g.restore();}
  else{
    // front or back: the horse head-on (or from behind) with the rider above
    const k=Math.sin(t*0.35)*(step?1.5:0);
    if(back){for(let i=0;i<5;i++)L(-0.5+i*0.25,-17,-1+i*0.5+flow,-5,i%2?'#C8C6CE':'#E8E6EE',1.3);}
    L(-4,-13,-4,-1+k,W3,2.2);L(4,-13,4,-1-k,W3,2.2);E(-4,-0.6+k,1.3,0.8,INK);E(4,-0.6-k,1.3,0.8,INK);
    E(0,-16,7.5,7,W);E(-2,-18.5,3,2,'#FFFFFF');P([[-6,-20],[6,-20],[6.5,-14],[-6.5,-14]],RD);P([[-6.5,-14.6],[6.5,-14.6],[6.5,-13.8],[-6.5,-13.8]],GD);
    if(front){P([[-2.6,-20],[2.6,-20],[2.2,-8],[-2.2,-8]],W);E(0,-8.6,2.4,1.6,'#C8C2C8');E(-1.6,-17.5,0.7,0.7,INK);E(1.6,-17.5,0.7,0.7,INK);L(-2.4,-16,2.4,-16,RD,0.6);P([[-2.6,-21],[-3.6,-24],[-1.4,-21.4]],W2);P([[2.6,-21],[3.6,-24],[1.4,-21.4]],W2);}
    if(back)P([[-5,-34],[5,-34],[7+flow,-17],[-7+flow,-17]],RD);
    P([[-4,-34],[4,-34],[4.5,-23],[-4.5,-23]],back?'#E8E4DC':W);for(const yy of [-31,-28,-25])L(-4,yy,4.2,yy,GD,0.5);
    P([[-7,-35],[-3,-35],[-3,-30.5],[-7.5,-31]],W2);P([[3,-35],[7,-35],[7.5,-31],[3,-30.5]],W2);
    E(0,-38.6,4.4,4,W);P([[-5.4,-38],[5.4,-38],[6.4,-35.6],[-6.4,-35.6]],W2);
    if(front){P([[-2.6,-37.6],[2.6,-37.6],[2.4,-34.4],[-2.4,-34.4]],INK);E(-1.2,-36.6,0.6,0.45,'#FF3B30');E(1.2,-36.6,0.6,0.45,'#FF3B30');L(-1.6,-35,1.6,-35,GL,0.4);}
    g.strokeStyle=GD;g.lineWidth=1.1;g.beginPath();g.arc(x,y-42.5,4.4,Math.PI*1.08,Math.PI*1.92);g.stroke();g.strokeStyle=GL;g.lineWidth=0.4;g.stroke();E(0,-42.6,0.8,0.8,'#C49BFF');}
  if(t%5===0){g.fillStyle=Math.random()<0.5?'#FFE08A':'#C49BFF';g.fillRect(x+(Math.random()*2-1)*16,y-6-Math.random()*36,0.8,0.8);}
}
const EMP_SCALE=1.6;
function emperorDraw(g,x,y,dir,step,t,sc){sc=sc||EMP_SCALE;const tf=g.getTransform();const W=Math.ceil(176*sc),H=Math.ceil(150*sc),AX=Math.round(88*sc),AY=Math.round(140*sc);
  const B=document.createElement('canvas');B.width=W;B.height=H;const b=B.getContext('2d');b.setTransform(2*sc,0,0,2*sc,AX,AY);emperorLow(b,0,0,dir,step,t);
  const O=document.createElement('canvas');O.width=W;O.height=H;const o=O.getContext('2d');for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])o.drawImage(B,dx,dy);o.globalCompositeOperation='source-in';o.fillStyle='rgba(12,6,8,.9)';o.fillRect(0,0,W,H);o.globalCompositeOperation='source-over';o.drawImage(B,0,0);
  g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(O,Math.round(tf.a*x+tf.e-AX),Math.round(tf.d*y+tf.f-AY));g.restore();}
