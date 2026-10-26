import io
import re

p = r'D:/guanwang/guanwang/.manual-work-20261021/annotate_v2.py'
s = io.open(p, encoding='utf-8').read()

# drop the two old chapter-04 figures
for key in ('leak-detail', 'manual-analysis'):
    s = re.sub(r"\n\s*'" + key + r"':\s*\(.*?\),\s*(?=\n)", '', s)

NEW = """
    'leak-detail-noise': ('leak-detail-noise', [(275,249,692,286,'box'),(284,292,932,690,'box')], None),
    'leak-detail-history': ('leak-detail-history', [(275,249,700,286,'box'),(815,249,900,286,'box'),(284,292,932,505,'box'),(284,510,932,990,'box')], None),
    'leak-detail-info': ('leak-detail-info', [(284,255,932,660,'box'),(880,158,918,183,'box')], None),
    'leak-detail-maintenance': ('leak-detail-maintenance', [(284,255,700,340,'box'),(284,345,932,585,'box'),(755,588,935,625,'box')], None),
    'leak-detail-manual': ('leak-detail-manual', [(284,250,690,530,'box'),(730,250,932,530,'box'),(712,548,935,582,'box'),(284,590,932,765,'box')], None),
    'leak-detail-related': ('leak-detail-related', [(275,250,470,286,'box'),(284,292,855,440,'box'),(855,345,932,435,'box')], None),
    'leak-detail-find': ('leak-detail-find', [(284,255,932,300,'box'),(284,305,932,880,'box'),(860,330,915,490,'box')], None),
"""
s = s.replace("\n}\n\n\ndef make():", NEW + "}\n\n\ndef make():")

# box-style annotation support
OLD_LOOP = """        for i, item in enumerate(marks, 1):
            x, y = item[0], item[1]"""
NEW_LOOP = """        for i, item in enumerate(marks, 1):
            if len(item) == 5 and item[4] == 'box':
                x0, y0, x1, y1 = item[0], item[1], item[2], item[3]
                d.rectangle((x0, y0, x1, y1), outline=(214, 45, 32), width=3)
                bx, by = x0, y0
                d.ellipse((bx-21, by-21, bx+21, by+21), fill=(255, 255, 255))
                d.ellipse((bx-18, by-18, bx+18, by+18), fill=(214, 45, 32), outline=(255, 255, 255), width=2)
                d.text((bx, by-1), str(i), font=font, fill='white', anchor='mm')
                continue
            x, y = item[0], item[1]"""
if OLD_LOOP not in s:
    raise SystemExit('loop not found')
s = s.replace(OLD_LOOP, NEW_LOOP)

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
