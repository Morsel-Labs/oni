# Two real browsers against the local ONI server: accounts, village presence, a 1v1 by code, the match record, leaderboard sync and write rules.
import time
from playwright.sync_api import sync_playwright
URL='http://localhost:8080/'
def page(b):
    ctx=b.new_context(viewport={'width':1280,'height':720});pg=ctx.new_page()
    pg.route("**/fonts.googleapis.com/**",lambda r:r.fulfill(status=200,content_type='text/css',body=''));pg.route("**/fonts.gstatic.com/**",lambda r:r.abort())
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.goto(URL);return pg,errs
with sync_playwright() as p:
    b=p.chromium.launch();A,ea=page(b);B,eb=page(b);time.sleep(3)
    print('A id:',A.evaluate('DB.me'),'| db:',A.evaluate('DB.state'),'| B id:',B.evaluate('DB.me'),'| db:',B.evaluate('DB.state'))
    A.evaluate("document.getElementById('ld-play').click()");B.evaluate("document.getElementById('ld-play').click()");time.sleep(1.5)
    print('village peers seen by A:',A.evaluate("VIL.peers.filter(p=>p.presence&&p.presence.v).length"),'| by B:',B.evaluate("VIL.peers.filter(p=>p.presence&&p.presence.v).length"))
    A.evaluate("savedProfile=null;saveProfile({name:'Theo',wallet:demoWallet(),main:'oni'})");B.evaluate("saveProfile({name:'Friend',wallet:demoWallet(),main:'ryu'})");time.sleep(1.2)
    print('A sees names:',A.evaluate("Object.values(DB.profiles).map(p=>p.name).sort().join(',')"))
    A.evaluate("SEL.ctx='online';SEL.map=0;SEL.low=0;SEL.fmt='ko';createMatch()");time.sleep(1.5);code=A.evaluate("document.getElementById('mycode').textContent")
    B.evaluate(f"SEL.ctx='online';openSelect('online');document.getElementById('codein').value='{code}';joinMatch()");time.sleep(2.5)
    B.evaluate("const b=document.getElementById('b-accept');if(b&&!b.closest('.panel').hidden)b.click()");time.sleep(3)
    print('code',code,'| A mode:',A.evaluate('mode'),'| B mode:',B.evaluate('mode'),'| scene:',A.evaluate('M&&M.scene'))
    for i in range(60):
        A.evaluate("if(M&&M.scene==='fight'){M.f[1].hp=Math.min(M.f[1].hp,5);M.timer=Math.min(M.timer,30);}");time.sleep(0.5)
        if A.evaluate("!!(M&&M.recorded)"):break
    time.sleep(1.5)
    print('match recorded by host:',A.evaluate("!!(M&&M.recorded)"),'| B sees matches:',B.evaluate("DB.matches.length"),'| B board size:',B.evaluate("DB.board?DB.board.list.length:0"))
    r=B.evaluate("DB.db.collection('profiles').doc(%s).set({name:'hacked'}).then(()=>'WRITE ALLOWED',e=>'blocked: '+e.code)"%repr(A.evaluate('DB.me')))
    print("B writing A's profile ->",r)
    r=B.evaluate("DB.db.collection('matches').doc('x').delete().then(()=>'DELETE ALLOWED',e=>'blocked: '+e.code)")
    print('B deleting a match ->',r)
    print('errors A:',ea[:3],'B:',eb[:3]);b.close()
