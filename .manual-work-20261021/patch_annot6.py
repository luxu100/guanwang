import io

p = r'D:/guanwang/guanwang/.manual-work-20261021/annotate_v2.py'
s = io.open(p, encoding='utf-8').read()
old = '                bx, by = x0, y0'
new = '                bx, by = x0 - 24, y0'
if old not in s:
    raise SystemExit('badge line missing')
s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
