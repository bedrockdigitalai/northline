import os, json
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

SG='/usr/share/fonts/truetype/sand-box/google/Space Grotesk/SpaceGrotesk-VariableFont_wght.ttf'
JB='/usr/share/fonts/truetype/sand-box/google/JetBrains Mono/JetBrainsMono-VariableFont_wght.ttf'
sg=instantiateVariableFont(TTFont(SG),{'wght':700})
jb=instantiateVariableFont(TTFont(JB),{'wght':500})

def text_path(font,txt,size,track_em,x0=0,y0=0):
    """returns (path d, width, capheight) ; baseline at y0, tracking after each glyph except last"""
    gs=font.getGlyphSet(); cmap=font.getBestCmap(); upm=font['head'].unitsPerEm
    s=size/upm; x=x0; ds=[]
    for i,ch in enumerate(txt):
        gn=cmap[ord(ch)]; pen=SVGPathPen(gs,ntos=lambda v:('%.2f'%v).rstrip('0').rstrip('.'))
        tp=TransformPen(pen,(s,0,0,-s,x,y0)); gs[gn].draw(tp); ds.append(pen.getCommands())
        x+=gs[gn].width*s + (track_em*size if i<len(txt)-1 else 0)
    cap=font['OS/2'].sCapHeight*s
    return ' '.join(ds), x-x0, cap

WHITE='#F5F7FA'; VOID='#0A0E14'; STEEL='#8A94A3'; ACC='#2E7CF6'; INK_STEEL='#5B6573'

# ---------- marks (120x120 box) ----------
# Each mark: list of (shape-kind, d, role)  role: 'main' | 'acc'
MARKS={}
# Option 1: Meridian Peak — ridge triangle split on a north meridian, bearing line rising above
MARKS[1]=dict(name='Meridian Peak',
  shapes=[('main','M14 102 L57 34 L57 102 Z'),('acc','M63 102 L63 34 L106 102 Z'),('main','M58.5 8 L61.5 8 L61.5 26 L58.5 26 Z')],
  bbox=(14,8,106,102))
# Option 2: Bearing — open compass ring with a north needle
import math
def arc(cx,cy,r,a0,a1):
    p=lambda a:(cx+r*math.sin(math.radians(a)),cy-r*math.cos(math.radians(a)))
    x0,y0=p(a0);x1,y1=p(a1); large=1 if (a1-a0)%360>180 else 0
    return 'M%.2f %.2f A%d %d 0 %d 1 %.2f %.2f'%(x0,y0,r,r,large,x1,y1)
def ring(cx,cy,ro,ri,a0,a1):
    p=lambda r,a:(cx+r*math.sin(math.radians(a)),cy-r*math.cos(math.radians(a)))
    large=1 if (a1-a0)%360>180 else 0
    ox0,oy0=p(ro,a0);ox1,oy1=p(ro,a1);ix1,iy1=p(ri,a1);ix0,iy0=p(ri,a0)
    return 'M%.2f %.2f A%d %d 0 %d 1 %.2f %.2f L%.2f %.2f A%d %d 0 %d 0 %.2f %.2f Z'%(ox0,oy0,ro,ro,large,ox1,oy1,ix1,iy1,ri,ri,large,ix0,iy0)
MARKS[2]=dict(name='Bearing',
  shapes=[('main',ring(60,64,44,34,24,336)),('acc','M60 14 L72 64 L48 64 Z'),('main','M48 64 L72 64 L60 114 Z')],
  bbox=(16,14,104,114))
# Option 3: Vector N — precise angular N, right stem capped with a north vector
MARKS[3]=dict(name='Vector N',
  shapes=[('main','M16 104 L16 36 L36 36 L82 84 L82 58 L100 58 L100 104 L80 104 L34 56 L34 104 Z'),('acc','M78 47 L91 10 L104 47 Z')],
  bbox=(16,10,104,104))
FINAL=3

def mark_svg_body(n,main,acc,tx=0,ty=0,s=1.0,extra=''):
    m=MARKS[n]; out=[]
    for role,d in m['shapes']:
        out.append('<path d="%s" fill="%s"/>'%(d,main if role=='main' else acc))
    return '<g transform="translate(%s %s) scale(%s)"%s>%s</g>'%(tx,ty,s,extra,''.join(out))

def mark_svg(n,main,acc,pad=0,bg=None,title='Northline mark'):
    x0,y0,x1,y1=MARKS[n]['bbox']; w=x1-x0; h=y1-y0; side=max(w,h)+2*pad
    ox=(side-w)/2-x0; oy=(side-h)/2-y0
    b='<rect width="%s" height="%s" fill="%s"/>'%(side,side,bg) if bg else ''
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %s %s" role="img"><title>%s</title>%s%s</svg>'%(side,side,title,b,mark_svg_body(n,main,acc,ox,oy))

def lockup_svg(n,main,acc,word,sub,bg=None,pad=0):
    x0,y0,x1,y1=MARKS[n]['bbox']; mw=x1-x0; mh=y1-y0
    scale=1.0
    capW=0
    # wordmark
    size=60; wd,ww,cap=text_path(sg,'NORTHLINE',size,0.14)
    sd,sw,scap=text_path(jb,'TECHNOLOGIES',18,0.42)
    gap=26; subgap=19
    block_h=cap+subgap+scap
    H=mh*scale
    mark_x=-x0; mark_y=-y0
    tx=mw*scale+gap
    top=(H-block_h)/2
    wd,ww,cap=text_path(sg,'NORTHLINE',size,0.14,tx,top+cap)
    sd,sw,scap=text_path(jb,'TECHNOLOGIES',18,0.42,tx+1.5,top+cap+subgap+scap)
    W=tx+ww
    vb=(-pad,-pad,W+2*pad,H+2*pad)
    b='<rect x="%s" y="%s" width="%s" height="%s" fill="%s"/>'%(vb[0],vb[1],vb[2],vb[3],bg) if bg else ''
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%.2f %.2f %.2f %.2f" role="img"><title>Northline Technologies</title>%s'
      '<g>%s</g><path d="%s" fill="%s"/><path d="%s" fill="%s"/></svg>')%(vb+(b,mark_svg_body(n,main,acc,mark_x,mark_y),wd,word,sd,sub)), vb

if __name__=='__main__':
    # concept sheets: each concept = mark + lockup on dark
    os.makedirs('/workspace/northline-immersive/brand/concepts',exist_ok=True)
    for n in (1,2,3):
        lk,vb=lockup_svg(n,WHITE,ACC,WHITE,STEEL)
        # compose concept board 1600x900: big mark left, lockup right, small-size tests bottom
        board=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900"><rect width="1600" height="900" fill="%s"/>'%VOID]
        # grid lines
        board.append('<g stroke="#1B2230" stroke-width="1"><path d="M0 150H1600M0 750H1600M150 0V900M1450 0V900"/></g>')
        board.append('<text x="150" y="110" fill="%s" font-family="monospace" font-size="20" letter-spacing="4">OPTION 0%d — %s</text>'%(STEEL,n,MARKS[n]['name'].upper()))
        x0,y0,x1,y1=MARKS[n]['bbox']; s=420/max(x1-x0,y1-y0)
        board.append(mark_svg_body(n,WHITE,ACC,150-x0*s+ (420-(x1-x0)*s)/2,200-y0*s+(420-(y1-y0)*s)/2,round(s,4)))
        # lockup scaled
        lw=vb[2]; ls=860/lw; lh=vb[3]*ls
        board.append('<g transform="translate(620 %.1f) scale(%.4f) translate(%.2f %.2f)">%s</g>'%(330,ls,-vb[0],-vb[1],lk.split('</title>')[1].rsplit('</svg>',1)[0]))
        # small-size tests
        yy=640
        for i,px in enumerate((64,32,16)):
            sx=px/ max(x1-x0,y1-y0)
            board.append(mark_svg_body(n,WHITE,ACC,150+i*130-x0*sx+(px-(x1-x0)*sx)/2 if False else 150+i*130-x0*sx,yy-y0*sx + (64-px)/2,round(sx,4)))
        board.append('<text x="150" y="720" fill="%s" font-family="monospace" font-size="14" letter-spacing="3">64 / 32 / 16 PX</text>'%STEEL)
        board.append('</svg>')
        open('/workspace/_logo/concept-%d.svg'%n,'w').write(''.join(board))
