import re
from pathlib import Path
import pdfplumber

pdf = Path(r'D:/guanwang/guanwang/.manual-work-20261021/render-v2/manual.pdf')
with pdfplumber.open(pdf) as d:
    pages = [p.extract_text() or '' for p in d.pages]

toc = pages[1]
pairs = []
for m in re.finditer(r'(\d{2})\s*([^\n]{2,30}?)\s+(\d{1,3})\s', toc):
    pairs.append((m.group(1), m.group(3)))
found = {}
for i, t in enumerate(pages[2:], start=3):
    lines = [l.strip() for l in t.splitlines() if l.strip()]
    for l in lines[1:4]:
        m = re.match(r'^(\d{2})\s', l)
        if m and m.group(1) not in found:
            found[m.group(1)] = i
bad = [(n, toc_no, found.get(n)) for n, toc_no in pairs if str(found.get(n)) != str(toc_no)]
print('toc entries', len(pairs), 'chapters found', len(found))
print('mismatch', bad[:10])
