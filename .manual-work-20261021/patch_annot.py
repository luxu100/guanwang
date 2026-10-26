import io

p = r'D:/guanwang/guanwang/.manual-work-20261021/annotate_v2.py'
s = io.open(p, encoding='utf-8').read()

REPS = [
    ("'work-order-form': ('work-order-form', [(500,340),(1100,340),(1300,835)], None),",
     "'work-order-form': ('work-order-form', [(500,340),(1100,340),(1300,835)], (225,125,1375,875)),"),
    ("'work-order-process': ('work-order-process', [(500,340),(1100,340),(1300,835)], None),",
     "'work-order-process': ('work-order-process', [(500,340),(1100,340),(1300,835)], (225,125,1375,875)),"),
    ("'protocol-bind-form': ('protocol-bind-form', [(500,287),(1050,287),(500,375),(1310,835)], None),",
     "'protocol-bind-form': ('protocol-bind-form', [(500,287),(1050,287),(500,375),(1310,835)], (225,120,1375,880)),"),
    ("'draft-warning': ('facility-form2', [(800,512),(920,590),(1005,590),(970,590)], None),",
     "'draft-warning': ('facility-form2', [(800,512),(920,590),(1005,590)], (480,400,1250,700)),"),
    ("        if crop:\n            im = im.crop(crop)",
     "        if crop:\n            im = im.crop(crop)\n            marks = [(m[0] - crop[0], m[1] - crop[1]) + tuple(m[2:]) for m in marks]"),
]

for old, new in REPS:
    if old not in s:
        raise SystemExit('MISS: ' + old[:60])
    s = s.replace(old, new)

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('patched')
