import asyncio
from playwright.async_api import async_playwright
from PIL import Image
URL='file:///workspace/northline-immersive/index.html'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--enable-unsafe-swiftshader'])
        pg=await b.new_page(viewport={'width':1200,'height':630})
        await pg.goto(URL); await pg.wait_for_timeout(6500)
        await pg.add_style_tag(content='.brand__lk{height:54px!important}')
        await pg.wait_for_timeout(400)
        await pg.screenshot(path='og.png')
        await b.close()
asyncio.run(main())
Image.open('og.png').convert('RGB').save('/workspace/northline-immersive/assets/img/og-northline.jpg',quality=88,optimize=True)
