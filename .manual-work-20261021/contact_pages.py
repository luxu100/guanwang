from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
root=Path(r'D:/guanwang/guanwang/.manual-work-20261021/render-v2')
files=sorted(root.glob('page-*.png'))
cols,rows=4,4
th=(320,414)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
for start in range(0,len(files),16):
    sheet=Image.new('RGB',(cols*th[0],rows*(th[1]+22)),'white')
    d=ImageDraw.Draw(sheet)
    for i,f in enumerate(files[start:start+16]):
        im=Image.open(f).convert('RGB'); im.thumbnail(th)
        x=(i%cols)*th[0]; y=(i//cols)*(th[1]+22)
        sheet.paste(im,(x,y))
        d.text((x+4,y+th[1]+2),f.stem,font=font,fill='black')
    sheet.save(root.parent/f'pages-{start//16+1}.jpg',quality=88)
print(len(files))
