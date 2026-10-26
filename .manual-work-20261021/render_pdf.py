import pypdfium2 as pdfium
from pathlib import Path
pdf=Path(r'D:/guanwang/guanwang/.manual-work-20261021/render-v2/manual.pdf')
out=pdf.parent
page_count=len(pdfium.PdfDocument(pdf))
doc=pdfium.PdfDocument(pdf)
for i in range(page_count):
    page=doc[i]
    bitmap=page.render(scale=1600/page.get_width()*1.0)
    bitmap.to_pil().save(out/f'page-{i+1:02d}.png')
print(page_count)
