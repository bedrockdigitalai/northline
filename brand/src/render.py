import sys, asyncio
from playwright.async_api import async_playwright
async def render(jobs):
    # jobs: (svgpath, pngpath, width, height, transparent)
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        for svg,png,w,h,tr in jobs:
            pg=await b.new_page(viewport={'width':w,'height':h})
            s=open(svg).read()
            await pg.set_content('<html><body style="margin:0;background:transparent"><div style="width:%dpx;height:%dpx">%s</div><style>svg{width:100%%;height:100%%;display:block}</style></body></html>'%(w,h,s))
            await pg.screenshot(path=png,omit_background=tr)
            await pg.close()
        await b.close()
def run(jobs): asyncio.run(render(jobs))
if __name__=='__main__':
    D='/workspace/northline-immersive/brand/concepts/'
    run([('concept-%d.svg'%n,D+'option-%d.png'%n,1600,900,False) for n in (1,2,3)])
