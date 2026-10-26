from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
root=Path(r'D:/guanwang/guanwang/.manual-work-20261021/screens')
files=sorted(root.glob('*.jpg'))
cols,rows=4,6
th=(380,238)
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',14)
for page in range((len(files)+cols*rows-1)//(cols*rows)):
    sheet=Image.new('RGB',(cols*th[0],rows*(th[1]+22)),'white')
    d=ImageDraw.Draw(sheet)
    for i,f in enumerate(files[page*cols*rows:(page+1)*cols*rows]):
        im=Image.open(f).convert('RGB'); im.thumbnail(th)
        x=(i%cols)*th[0]; y=(i//cols)*(th[1]+22)
        sheet.paste(im,(x,y))
        d.text((x+4,y+th[1]+2),f.stem,font=font,fill='black')
    sheet.save(root.parent/f'contact-{page+1}.jpg',quality=90)
print(len(files))
