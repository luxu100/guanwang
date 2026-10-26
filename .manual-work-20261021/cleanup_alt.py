from pathlib import Path

out = Path(r'D:/guanwang/guanwang/outputs')
p = out / '城市管网渗漏预警平台Web用户操作手册_图文版_7页签.docx'
if p.exists():
    p.unlink()
for f in sorted(out.glob('*图文版*.docx')):
    print(f.name, round(f.stat().st_size / 1024 / 1024, 2), 'MB')
