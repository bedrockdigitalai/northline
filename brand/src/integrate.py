import re, shutil, sys
sys.path.insert(0,'/workspace/_logo')
from gen import *
R='/workspace/northline-immersive/'
n=FINAL
# --- inline lockup (classes for animation)
x0,y0,x1,y1=MARKS[n]['bbox']
lk,vb=lockup_svg(n,WHITE,ACC,WHITE,STEEL)
import re
paths=re.findall(r'<path d="([^"]+)" fill="([^"]+)"/>',lk)
# order: N body, vector, wordmark, sub
(nb,_),(vec,_),(word,_),(sub,_)=paths
VB='%.0f %.0f %.2f %.0f'%vb
def lockup(cls,h):
    return ('<svg class="%s" viewBox="%s" height="%d" fill="none" aria-hidden="true" focusable="false">'
      '<g transform="translate(%s %s)"><path class="lk-n" d="%s" fill="#F5F7FA"/><path class="lk-v" d="%s" fill="#2E7CF6"/></g>'
      '<path class="lk-w" d="%s" fill="#F5F7FA"/><path class="lk-s" d="%s" fill="#8A94A3"/></svg>')%(cls,VB,h,-x0,-y0,nb,vec,word,sub)
def mark(cls,w,h,attrs=''):
    return ('<svg class="%s" viewBox="%d %d %d %d" width="%d" height="%d" fill="none" aria-hidden="true" focusable="false"%s>'
      '<path class="lk-n" d="%s" fill="#F5F7FA"/><path class="lk-v" d="%s" fill="#2E7CF6"/></svg>')%(cls,x0,y0,x1-x0,y1-y0,w,h,attrs,nb,vec)

h=open(R+'index.html').read()
# nav
old_nav=re.search(r'<a href="#top" class="brand".*?</a>',h,re.S).group(0)
h=h.replace(old_nav,'<a href="#top" class="brand" aria-label="Northline Technologies — home">\n        '+lockup('brand__lk',38)+'\n      </a>')
# preloader
old_pl=re.search(r'<svg width="44" height="44".*?</svg>',h,re.S).group(0)
h=h.replace(old_pl,mark('pl-mark',66,70).replace('class="lk-n"','class="lk-n pl-path"').replace('class="lk-v"','class="lk-v pl-path"').replace('<path class="lk-n pl-path" d="%s" fill="#F5F7FA"/>'%nb,'<path class="lk-n pl-path" d="%s" fill="#F5F7FA" pathLength="1"/>'%nb).replace('<path class="lk-v pl-path" d="%s" fill="#2E7CF6"/>'%vec,'<path class="lk-v pl-path" d="%s" fill="#2E7CF6" pathLength="1"/>'%vec))
# footer
old_f=re.search(r'<div class="fbrand">.*?</div>',h,re.S).group(0)
h=h.replace(old_f,'<div class="fbrand">'+lockup('fbrand__lk',44)+'</div>')
# mobile menu foot
h=h.replace('<div class="menu__foot mono" style="--i:5">\n','<div class="menu__foot mono" style="--i:5">\n    '+mark('menu__mark',34,36)+'\n',1)
# favicon links
h=h.replace('<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">',
 '<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">\n<link rel="icon" href="assets/img/favicon-32.png" type="image/png" sizes="32x32">\n<link rel="alternate icon" href="assets/img/favicon.ico" sizes="any">\n<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">')
open(R+'index.html','w').write(h)

# assets
B=R+'brand/'
for f in ('favicon.svg','favicon.ico','favicon-32.png','apple-touch-icon.png'): shutil.copy(B+f,R+'assets/img/'+f)

# css
c=open(R+'assets/css/main.css').read()
c+='''
/* ---- Northline logo system ---- */
.brand{gap:0}
.brand__lk{display:block;height:38px;width:auto;overflow:visible}
.fbrand{margin-bottom:10px}
.fbrand__lk{display:block;height:44px;width:auto;overflow:visible}
.menu__mark{display:block;margin-bottom:10px;opacity:.9}
html.motion .pl-mark{overflow:visible}
html.motion .pl-mark .pl-path{fill-opacity:0;stroke-width:1.1;stroke-linejoin:miter;stroke-dasharray:1;stroke-dashoffset:1}
html.motion .pl-mark .lk-n{stroke:#F5F7FA}
html.motion .pl-mark .lk-v{stroke:#2E7CF6}
.brand:hover .lk-v{transform:translateY(-2px)}
.lk-v{transition:transform .5s var(--ease)}
@media (max-width:640px){.brand__lk{height:32px}}
'''
open(R+'assets/css/main.css','w').write(c)

# js
j=open(R+'assets/js/main.js').read()
old=".fromTo('.pl-peak', { strokeDasharray: 120, strokeDashoffset: 120 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 0)"
assert old in j
new=(".fromTo('.pl-path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut', stagger: 0.18 }, 0)\n"
     "      .fromTo('.pl-path', { fillOpacity: 0 }, { fillOpacity: 1, duration: 0.45, ease: 'power1.out', stagger: 0.1 }, 0.75)\n"
     "      .to('.pl-path', { strokeOpacity: 0, duration: 0.3 }, 1.15)")
j=j.replace(old,new)
open(R+'assets/js/main.js','w').write(j)
