import asyncio
from playwright.async_api import async_playwright
URL='file:///workspace/northline-immersive/index.html'
S='/workspace/northline-immersive/shots/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'])
        for w,h in((1440,900),(390,844)):
            pg=await b.new_page(viewport={'width':w,'height':h})
            logs=[]
            pg.on('console',lambda m: logs.append((m.type,m.text)) if m.type in('error','warning') else None)
            pg.on('pageerror',lambda e: logs.append(('pageerror',str(e))))
            pg.on('requestfailed',lambda r: logs.append(('reqfail',r.url)))
            await pg.goto(URL)
            await pg.wait_for_timeout(450); await pg.screenshot(path=S+'logo-preloader-a-%d.png'%w)
            await pg.wait_for_timeout(500); await pg.screenshot(path=S+'logo-preloader-b-%d.png'%w)
            await pg.wait_for_timeout(5000)
            await pg.screenshot(path=S+'logo-nav-hero-%d.png'%w, clip={'x':0,'y':0,'width':w,'height':160})
            if w==390:
                await pg.click('#menuBtn'); await pg.wait_for_timeout(1600)
                await pg.screenshot(path=S+'logo-menu-390.png')
                await pg.click('#menuBtn'); await pg.wait_for_timeout(1000)
            await pg.evaluate('window.scrollTo(0,document.documentElement.scrollHeight)'); await pg.wait_for_timeout(1800)
            await pg.screenshot(path=S+'logo-footer-%d.png'%w)
            print(w,logs,await pg.evaluate('({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth})'))
            # favicon / link checks
            print(await pg.evaluate("[...document.querySelectorAll('link[rel*=icon]')].map(l=>l.href)"))
            await pg.close()
        # reduced motion
        ctx=await b.new_context(viewport={'width':1440,'height':900},reduced_motion='reduce'); pg=await ctx.new_page()
        logs=[]; pg.on('console',lambda m: logs.append(m.text) if m.type=='error' else None); pg.on('pageerror',lambda e: logs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500); await pg.screenshot(path=S+'logo-reduced-1440.png',clip={'x':0,'y':0,'width':1440,'height':160}); print('reduced',logs)
        await b.close()
asyncio.run(main())
