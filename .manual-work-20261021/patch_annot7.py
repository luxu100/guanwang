import io
import re

p = r'D:/guanwang/guanwang/.manual-work-20261021/annotate_v2.py'
s = io.open(p, encoding='utf-8').read()

NEW = {
    'leak-detail-noise': "[(275,249,700,286,'box'),(284,292,935,690,'box')]",
    'leak-detail-info': "[(284,250,935,652,'box'),(884,158,918,183,'box')]",
    'leak-detail-maintenance': "[(284,250,700,330,'box'),(284,332,935,585,'box'),(755,588,935,625,'box')]",
    'leak-detail-related': "[(275,250,470,286,'box'),(284,292,935,640,'box')]",
    'leak-detail-find': "[(284,255,935,300,'box'),(284,305,935,880,'box'),(860,305,915,495,'box')]",
}

for key, marks in NEW.items():
    pat = re.compile(r"('" + key + r"':\s*\([^,]+,\s*)\[[^\]]*\]")
    s, n = pat.subn(lambda m: m.group(1) + marks, s)
    if n != 1:
        raise SystemExit('MISS ' + key)

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
