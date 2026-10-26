import io

p = r'D:/guanwang/guanwang/.manual-work-20261021/annotate_v2.py'
s = io.open(p, encoding='utf-8').read()

NEW = """    'leak-detail-noise': ('leak-detail-noise', [(275,249,692,286,'box'),(284,292,932,690,'box')], None),
    'leak-detail-history': ('leak-detail-history', [(275,249,700,286,'box'),(815,249,900,286,'box'),(284,292,932,505,'box'),(284,510,932,990,'box')], None),
    'leak-detail-info': ('leak-detail-info', [(284,255,932,660,'box'),(880,158,918,183,'box')], None),
    'leak-detail-maintenance': ('leak-detail-maintenance', [(284,255,700,340,'box'),(284,345,932,585,'box'),(755,588,935,625,'box')], None),
    'leak-detail-manual': ('leak-detail-manual', [(284,250,690,530,'box'),(730,250,932,530,'box'),(712,548,935,582,'box'),(284,590,932,765,'box')], None),
    'leak-detail-related': ('leak-detail-related', [(275,250,470,286,'box'),(284,292,855,440,'box'),(855,345,932,435,'box')], None),
    'leak-detail-find': ('leak-detail-find', [(284,255,932,300,'box'),(284,305,932,880,'box'),(860,330,915,490,'box')], None),
"""

anchor = '\n}\n\ndef make():'
if anchor not in s:
    raise SystemExit('anchor missing')
s = s.replace(anchor, '\n' + NEW + '}\n\ndef make():')
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
