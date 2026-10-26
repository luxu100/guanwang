import io
import re

p = r'D:/guanwang/guanwang/.manual-work-20261021/annotate_v2.py'
s = io.open(p, encoding='utf-8').read()
key = 'leak-detail-info'
marks = "[(284,250,935,690,'box'),(884,158,918,183,'box')]"
pat = re.compile(r"('" + key + r"':\s*\([^,]+,\s*)\[[^\]]*\]")
s, n = pat.subn(lambda m: m.group(1) + marks, s)
if n != 1:
    raise SystemExit('miss')
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
