import os
import shutil
from pathlib import Path

src = Path(r'D:/guanwang/guanwang/.manual-work-20261021/build-new.docx')
dst = Path(r'D:/guanwang/guanwang/outputs/城市管网渗漏预警平台Web用户操作手册_图文版.docx')
try:
    os.replace(src, dst)
    print('REPLACED', dst.stat().st_size)
except Exception as e:
    alt = dst.with_name('城市管网渗漏预警平台Web用户操作手册_图文版_7页签.docx')
    shutil.copyfile(src, alt)
    print('LOCKED, saved alt:', alt, alt.stat().st_size)
