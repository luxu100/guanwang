import io
import re

p = r'D:/guanwang/guanwang/.manual-work-20261021/annotate_v2.py'
s = io.open(p, encoding='utf-8').read()


def set_crop(text, key, box):
    pat = re.compile(r"('" + key + r"':\s*\(.*?\],\s*)\([^)]*\)(\))", re.S)
    new, n = pat.subn(lambda m: m.group(1) + box + m.group(2), text)
    if n != 1:
        raise SystemExit('MISS ' + key)
    return new


s = set_crop(s, 'work-order-form', '(236,132,1354,868)')
s = set_crop(s, 'work-order-process', '(236,132,1354,868)')
s = set_crop(s, 'protocol-bind-form', '(232,126,1368,872)')
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
