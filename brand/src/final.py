from gen import *
from render import run
from PIL import Image
import shutil
B='/workspace/northline-immersive/brand/'
n=FINAL
def w(name,s): open(B+name,'w').write(s)
w('logo-mark.svg',mark_svg(n,WHITE,ACC,pad=0,title='Northline mark'))
w('logo-mark-black.svg',mark_svg(n,VOID,ACC,pad=0,title='Northline mark'))
w('logo-mark-accent.svg',mark_svg(n,ACC,ACC,pad=0,title='Northline mark'))
dark,vb=lockup_svg(n,WHITE,ACC,WHITE,STEEL); w('logo-lockup-dark.svg',dark)
light,_=lockup_svg(n,VOID,ACC,VOID,INK_STEEL); w('logo-lockup-light.svg',light)
acc,_=lockup_svg(n,ACC,ACC,WHITE,STEEL); w('logo-lockup-accent.svg',acc)
# favicon (rounded dark tile)
fav=mark_svg(n,WHITE,ACC,pad=9,bg=None,title='Northline')
side=94+18
fav='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d"><rect width="%d" height="%d" rx="20" fill="%s"/>%s</svg>'%(side,side,side,side,VOID,mark_svg(n,WHITE,ACC,pad=9).split('</title>')[1].replace('</svg>',''))
w('favicon.svg',fav)
apple=mark_svg(n,WHITE,ACC,pad=24,bg=VOID,title='Northline')
w('apple-touch-icon.svg',apple)
fav_sq=fav.replace('rx="20"','rx="0"'); open('fav_sq.svg','w').write(fav_sq)
ratio=vb[3]/vb[2]
jobs=[(B+'logo-mark.svg',B+'logo-mark-512.png',512,512,True),(B+'logo-mark.svg',B+'logo-mark-1024.png',1024,1024,True),
 (B+'logo-mark-accent.svg',B+'logo-mark-accent-512.png',512,512,True),(B+'logo-mark-black.svg',B+'logo-mark-black-512.png',512,512,True),
 (B+'logo-lockup-dark.svg',B+'logo-lockup-dark-2400.png',2400,round(2400*ratio),True),
 (B+'logo-lockup-light.svg',B+'logo-lockup-light-2400.png',2400,round(2400*ratio),True),
 (B+'logo-lockup-accent.svg',B+'logo-lockup-accent-2400.png',2400,round(2400*ratio),True),
 (B+'favicon.svg',B+'favicon-512.png',512,512,True),
 (B+'apple-touch-icon.svg',B+'apple-touch-icon.png',180,180,False),
 (B+'favicon.svg','f16.png',16,16,True),(B+'favicon.svg','f32.png',32,32,True),(B+'favicon.svg','f48.png',48,48,True),(B+'favicon.svg','f64.png',64,64,True)]
run(jobs)
ims=[Image.open('f%d.png'%s).convert('RGBA') for s in (16,32,48)]
ims[2].save(B+'favicon.ico',sizes=[(16,16),(32,32),(48,48)],append_images=ims[:2]) if False else Image.open('f48.png').convert('RGBA').save(B+'favicon.ico',sizes=[(16,16),(32,32),(48,48)])
shutil.copy('f32.png',B+'favicon-32.png'); shutil.copy('f16.png',B+'favicon-16.png')
print(vb,ratio)
