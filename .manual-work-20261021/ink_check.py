from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent / 'render-v2'
import pypdfium2 as pdfium

n = len(pdfium.PdfDocument(root / 'manual.pdf'))
for extra in range(n + 1, 200):
    p = root / f'page-{extra:02d}.png'
    if p.exists():
        p.unlink()

for f in sorted(root.glob('page-*.png')):
    im = Image.open(f).convert('L')
    im = im.crop((0, 0, im.width, int(im.height * 0.94)))
    px = list(im.resize((200, 259)).getdata())
    ink = sum(1 for v in px if v < 235) / len(px)
    flag = '  <== sparse' if ink < 0.055 else ''
    print(f'{f.stem} {ink*100:5.1f}%{flag}')
