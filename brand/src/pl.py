import asyncio
from playwright.async_api import async_playwright
URL='file:///workspace/northline-immersive/index.html'
S='/workspace/northline-immersive/shots/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--enable-unsafe-swiftshader'])
        pg=await b.new_page(viewport={'width':1440,'height':900})
        await pg.goto(URL,wait_until='commit')
        await pg.wait_for_selector('#plCount',state='attached')
        for i,t in enumerate([250,350,350,400]):
            await pg.wait_for_timeout(t)
            v=await pg.evaluate("document.getElementById('plCount').textContent+' '+[...document.querySelectorAll('.pl-path')].map(e=>getComputedStyle(e).strokeDashoffset+'/'+getComputedStyle(e).fillOpacity).join(',')")
            print(i,v)
            await pg.screenshot(path=S+'logo-preloader-%d.png'%i)
        await b.close()
asyncio.run(main())
