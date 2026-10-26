from pathlib import Path
from docx import Document
import zipfile

out = Path(r'D:/guanwang/guanwang/outputs')
for p in sorted(out.glob('*.docx')):
    print(f'{p.name}  {p.stat().st_size/1024/1024:.2f} MB  {p.stat().st_mtime:.0f}')

target = Path(r'D:/guanwang/guanwang/outputs/城市管网渗漏预警平台Web用户操作手册_图文版.docx')
doc = Document(target)
print('paragraphs', len(doc.paragraphs))
with zipfile.ZipFile(target) as z:
    media = [n for n in z.namelist() if n.startswith('word/media/')]
print('media files', len(media))
print('bad zip ok', zipfile.ZipFile(target).testzip() is None)
