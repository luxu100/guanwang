import os
from pathlib import Path
from docx import Document
import zipfile

out = Path(r'D:/guanwang/guanwang/outputs')
new = out / '城市管网渗漏预警平台Web用户操作手册_图文版_设备详情7页签.docx'
final = out / '城市管网渗漏预警平台Web用户操作手册_图文版.docx'

os.replace(new, final)

lock = out / '~$城市管网渗漏预警平台Web用户操作手册_图文版.docx'
if lock.exists():
    print('note: lock file still present ->', lock.name)

doc = Document(final)
with zipfile.ZipFile(final) as z:
    media = [n for n in z.namelist() if n.startswith('word/media/')]
heads = [p.text for p in doc.paragraphs if p.style.name == 'Heading 1']
print('REPLACED', final.name)
print('size_MB', round(final.stat().st_size / 1024 / 1024, 2), 'paras', len(doc.paragraphs), 'media', len(media), 'h1', len(heads))
print('zip_ok', zipfile.ZipFile(final).testzip() is None)
print('ch04_subheads', [p.text for p in doc.paragraphs if p.style.name == 'Heading 2' and p.text.startswith('4.')])
for f in sorted(out.glob('*图文版*.docx')):
    print('file', f.name, round(f.stat().st_size / 1024 / 1024, 2))
