/* ===== GOD TIER, clean style: fighter proportions, few shapes, no busy effects ===== */
const GODC={raijin:{s0:'#FF6A5A',s1:'#D7262E',s2:'#9E1620',hair:'#F3E9E4',hairD:'#B8B0C0',horn:'#FFC93A',gold:'#FFC93A',goldD:'#C88A00',tig:'#F0B030',tigD:'#1A0E06',eye:'#FFE14A',acc:'#7FE7FF'},
 fujin:{s0:'#8AD890',s1:'#3E9A4A',s2:'#1E6A2A',hair:'#1E3A24',hairD:'#0E2412',horn:'#F3E9E4',gold:'#FFC93A',goldD:'#C88A00',tig:'#F0B030',tigD:'#1A0E06',eye:'#FFE14A',bag:'#E6F6FF',bagD:'#9AC4DC',acc:'#BFFFF8'}};
function drawGodClean(g,kind,fr,k){ // feet at (0,0), facing right; k=1.45 makes a god 45% taller than a fighter
  k=k||1.45;const c=GODC[kind];
  const L=(a,b,w0,w1,col,cs)=>hiLimb(g,[a[0]*k,a[1]*k],[b[0]*k,b[1]*k],w0*k,w1*k,col,cs);const Pg=(p,col)=>hiPoly(g,p.map(q=>[q[0]*k,q[1]*k]),col);
  const D=(x,y,r,col,sy)=>{sy=sy||1;x*=k;y*=k;r*=k;g.fillStyle=col;for(let dy=-Math.round(r*sy);dy<=Math.round(r*sy);dy++){const w=Math.round(r*Math.sqrt(Math.max(0,1-(dy/(r*sy))**2)));g.fillRect(Math.round(x-w),Math.round(y+dy),w*2+1,1);}};
  const R=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(Math.round(x*k),Math.round(y*k),Math.max(1,Math.round(w*k)),Math.max(1,Math.round(h*k)));};
  const br=Math.round(Math.sin(fr*0.12));
  // back piece
  if(kind==='raijin'){for(let a=Math.PI*1.08;a<=Math.PI*1.92;a+=0.03){R(-4+Math.cos(a)*34,-66+Math.sin(a)*30,2,2,c.goldD);R(-4+Math.cos(a)*33,-66+Math.sin(a)*29,2,1,c.gold);}
    for(const a of [Math.PI*1.18,Math.PI*1.5,Math.PI*1.82]){const x=-4+Math.cos(a)*34,y=-66+Math.sin(a)*30;D(x,y,7,c.s2);D(x,y,6,'#F3E9E4');D(x,y,3,c.s1);}}
  else{Pg([[-14,-72],[-30,-58],[-34,-30],[-26,-34],[-20,-56]],c.bagD);Pg([[-12,-74],[-26,-60],[-28,-36],[-22,-40],[-16,-58]],c.bag);}
  // legs: wide stance
  L([-7,-40+br],[-16,-20],13,12,c.s2);L([-16,-20],[-20,-3],12,11,c.s2);
  L([7,-40+br],[16,-21],14,13,c.s1,c.s2);L([16,-21],[18,-3],13,11,c.s1,c.s2);
  for(const [fx,col] of [[-20,c.s2],[18,c.s1]]){Pg([[fx-7,-5],[fx+9,-5],[fx+10,0],[fx-7,0]],col);R(fx-6,-8,13,2,c.gold);}
  // tiger loincloth and gold belt
  Pg([[-15,-46+br],[15,-46+br],[13,-30],[0,-33],[-13,-30]],c.tig);for(const x of [-9,-2,5,11])R(x,-44+br,2,9,c.tigD);R(-15,-48+br,30,4,c.gold);R(-15,-48+br,30,1,'#FFF2B0');
  // torso
  Pg([[-15,-76+br],[15,-76+br],[13,-47+br],[-13,-47+br]],c.s1);Pg([[5,-76+br],[15,-76+br],[13,-47+br],[5,-47+br]],c.s2);Pg([[-15,-76+br],[-10,-76+br],[-10,-48+br],[-13,-47+br]],c.s0);
  R(-9,-70+br,8,6,c.s2);R(1,-70+br,8,6,c.s2);R(-5,-60+br,4,3,c.s2);R(1,-60+br,4,3,c.s2);R(-5,-55+br,4,3,c.s2);R(1,-55+br,4,3,c.s2);
  if(kind==='fujin'){Pg([[-16,-78+br],[16,-78+br],[14,-72+br],[-14,-72+br]],c.bag);R(-16,-73+br,32,2,c.bagD);}
  // head
  const hy=-86+br;
  if(kind==='raijin'){for(let k=0;k<7;k++){const a=-Math.PI*0.95+k*0.45;Pg([[Math.cos(a)*5,hy-2+Math.sin(a)*5],[Math.cos(a)*15,hy-2+Math.sin(a)*14],[Math.cos(a+0.25)*6,hy-2+Math.sin(a+0.25)*6]],k%2?c.hair:c.hairD);}}
  else{Pg([[-10,hy-4],[10,hy-4],[12,hy+6],[8,hy-9],[-8,hy-9],[-12,hy+6]],c.hair);}
  D(1,hy,9,c.s1);D(-2,hy-3,4,c.s0);
  Pg([[-5,hy-8],[-9,hy-17],[-3,hy-9]],c.horn);Pg([[5,hy-8],[9,hy-17],[7,hy-8]],c.horn);
  R(-5,hy-3,4,2,c.eye);R(3,hy-3,4,2,c.eye);R(-6,hy-5,5,1,'#1A0506');R(2,hy-5,5,1,'#1A0506');
  R(-4,hy+3,9,3,'#2A0505');R(-3,hy+3,1,2,'#FFFFFF');R(3,hy+3,1,2,'#FFFFFF');
  // diamond kabuto helmet
  Pg([[-12,hy-3],[12,hy-3],[11,hy-9],[6,hy-14],[-6,hy-14],[-11,hy-9]],'#5AB8D8');
  Pg([[-11,hy-4],[11,hy-4],[10,hy-9],[5,hy-13],[-5,hy-13],[-10,hy-9]],'#BFF4FF');
  Pg([[-10,hy-5],[-3,hy-5],[-4,hy-12],[-9,hy-9]],'#FFFFFF');Pg([[3,hy-5],[10,hy-5],[9,hy-9],[4,hy-12]],'#8FE0F8');Pg([[-3,hy-5],[3,hy-5],[4,hy-12],[-4,hy-12]],'#E6DCFF');
  R(-13,hy-4,26,2,'#5AB8D8');Pg([[-15,hy-4],[-11,hy-4],[-11,hy+1],[-15,hy-1]],'#BFF4FF');Pg([[11,hy-4],[15,hy-4],[15,hy-1],[11,hy+1]],'#8FE0F8');
  if(kind==='raijin')Pg([[-1,hy-13],[4,hy-21],[1,hy-21],[6,hy-29],[-2,hy-19],[1,hy-19],[-3,hy-13]],'#FFE14A');
  else{Pg([[-7,hy-14],[-9,hy-22],[-4,hy-27],[0,hy-28],[-3,hy-24],[-5,hy-20],[-2,hy-14]],'#E6FFFF');Pg([[2,hy-14],[4,hy-19],[8,hy-24],[5,hy-18],[5,hy-14]],'#BFFFF8');}
  R(-1,hy-12,2,2,'#FFFFFF');
  // arms
  const shB=[-13,-72+br],shF=[13,-72+br];
  if(kind==='raijin'){const hb=[-22,-50],hf=[26,-58];L(shB,[-20,-60],10,9,c.s2);L([-20,-60],hb,9,8,c.s2);L(shF,[22,-66],11,10,c.s1,c.s2);L([22,-66],hf,10,9,c.s1,c.s2);
    for(const [h,a] of [[hb,1.9],[hf,-0.9]]){for(let i=0;i<16;i++)R(h[0]+Math.cos(a)*i,h[1]+Math.sin(a)*i,2,2,i>12?c.gold:'#8A5A2A');D(h[0],h[1],4,c.s1);}
    R(-24,-60,8,3,c.gold);R(18,-66,8,3,c.gold);}
  else{const hb=[-20,-66],hf=[20,-68];L(shB,[-22,-58],10,9,c.s2);L([-22,-58],hb,9,8,c.s2);L(shF,[24,-60],11,10,c.s1,c.s2);L([24,-60],hf,10,9,c.s1,c.s2);
    D(hb[0],hb[1],4,c.s2);D(hf[0],hf[1],4,c.s1);R(-26,-60,8,3,c.gold);R(20,-62,8,3,c.gold);
    for(let k=0;k<3;k++){const y=-30-k*14;for(let i=0;i<12;i++)R(26+i,y+Math.round(Math.sin(i*0.5+fr*0.2)*1),1,1,c.acc);}}
}
