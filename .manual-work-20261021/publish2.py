import shutil
from pathlib import Path
from docx import Document
import zipfile

src = Path(r'D:/guanwang/guanwang/.manual-work-20261021/build-new.docx')
out = Path(r'D:/guanwang/guanwang/outputs')
final = out / '城市管网渗漏预警平台Web用户操作手册_图文版_设备详情7页签.docx'
shutil.copyfile(src, final)

old_alt = out / '城市管网渗漏预警平台Web用户操作手册_图文版_7页签.docx'
if old_alt.exists():
    old_alt.unlink()

doc = Document(final)
with zipfile.ZipFile(final) as z:
    media = [n for n in z.namelist() if n.startswith('word/media/')]
print('FINAL', final.name, round(final.stat().st_size / 1024 / 1024, 2), 'MB', 'paras', len(doc.paragraphs), 'media', len(media), 'zip_ok', zipfile.ZipFile(final).testzip() is None)
