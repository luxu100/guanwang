import io
import re

p = r'D:/guanwang/guanwang/.manual-work-20261021/annotate_v2.py'
s = io.open(p, encoding='utf-8').read()


def set_marks(text, key, marks):
    pat = re.compile(r"('" + key + r"':\s*\([^,]+,\s*)\[[^\]]*\]")
    new, n = pat.subn(lambda m: m.group(1) + '[' + marks + ']', text)
    if n != 1:
        raise SystemExit('MISS ' + key)
    return new


s = set_marks(s, 'work-order-form', '(500,240),(1050,240),(1300,835)')
s = set_marks(s, 'work-order-process', '(500,240),(500,467),(1300,835)')
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
