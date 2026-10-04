from PIL import Image, ImageDraw, ImageFont
D='/workspace/northline-immersive/brand/concepts/'
ims=[Image.open(D+'option-%d.png'%i).convert('RGB').resize((800,450),Image.LANCZOS) for i in (1,2,3)]
s=Image.new('RGB',(1660,1030),'#0A0E14')
f=ImageFont.truetype('/usr/share/fonts/truetype/sand-box/google/JetBrains Mono/JetBrainsMono-VariableFont_wght.ttf',16)
d=ImageDraw.Draw(s)
for im,p in zip(ims,[(20,60),(840,60),(20,550)]): s.paste(im,p)
d.text((20,22),'NORTHLINE — LOGO CONCEPTS / 01 MERIDIAN PEAK · 02 BEARING · 03 VECTOR N',fill='#8A94A3',font=f)
fin=Image.open('/workspace/northline-immersive/brand/logo-lockup-dark-2400.png').convert('RGBA')
fin=fin.resize((700,round(700*fin.height/fin.width)),Image.LANCZOS)
d.rectangle((840,550,1620,1000),outline='#2E7CF6')
d.text((860,570),'SELECTED → 03 VECTOR N',fill='#2E7CF6',font=f)
s.paste(fin,(880,720),fin)
s.save(D+'contact-sheet.png')
