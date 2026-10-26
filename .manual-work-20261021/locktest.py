from pathlib import Path

p = Path(r'D:/guanwang/guanwang/outputs/城市管网渗漏预警平台Web用户操作手册_图文版.docx')
try:
    with open(p, 'ab'):
        pass
    print('WRITABLE')
except Exception as e:
    print('LOCKED', e)
