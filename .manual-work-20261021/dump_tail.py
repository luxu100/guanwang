from pathlib import Path
from docx import Document

out = Path(r'D:/guanwang/guanwang/outputs')
docx = sorted(out.glob('*.docx'), key=lambda p: p.stat().st_mtime)[-1]
doc = Document(docx)
for p in doc.paragraphs[-8:]:
    brs = p._p.xpath('.//w:br')
    print(repr(p.text[:40]), p.style.name, 'breaks=', [b.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}type') for b in brs], 'pb=', p.paragraph_format.page_break_before, 'keep=', p.paragraph_format.keep_with_next)
