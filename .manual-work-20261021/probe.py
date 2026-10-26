import pdfplumber
from pathlib import Path

pdf = Path(r'D:/guanwang/guanwang/.manual-work-20261021/render-v2/manual.pdf')
with pdfplumber.open(pdf) as d:
    for idx in (56, 57):
        page = d.pages[idx]
        words = page.extract_words()
        ys = [w["bottom"] for w in words if w["bottom"] < 740]
        print('page', idx + 1, 'body_max_y', max(ys) if ys else None)
        for w in words[-6:]:
            print('   ', w['text'], round(w['top'], 1), round(w['bottom'], 1))
