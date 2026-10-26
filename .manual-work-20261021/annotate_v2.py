from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'captures'
OUT = ROOT / 'annotated-v2'
OUT.mkdir(exist_ok=True)

# key: (source, [(x, y), ...], crop-or-None)
FIG = {
    'login': ('login', [(1240,323),(1240,399),(1240,526,0,66),(1460,55,60,85)], None),
    'one-map': ('one-map', [(100,192),(1450,290),(450,500),(900,500),(1360,500),(1360,850)], None),
    'leak-monitor': ('leak-monitor', [(1250,200),(1250,360),(1150,600),(1450,940)], None),
    'network-home': ('network-home', [(315,163),(770,355),(320,820),(790,940)], None),
    'pipe-editor': ('pipe-editor', [(325,292),(550,430,180,-105),(550,690,180,-30),(550,762,180,45),(795,940,150,-70)], None),
    'facility-editor': ('facility-editor', [(405,292),(550,490,175,0),(450,546,175,0),(795,940,150,-55)], None),
    'facility-form': ('facility-form', [(450,655,175,0),(450,707,175,0),(795,940,150,-55)], None),
    'draft-warning': ('facility-form2', [(800,512,0,-40),(911,590,0,55),(991,590,0,55),(1069,590,0,55)], (480,400,1250,700)),
    'water-hammer': ('water-hammer', [(1280,163),(1440,164),(800,500),(800,900)], None),
    'water-hammer-editor': ('water-hammer-editor', [(1300,130),(1200,300),(1450,345),(1518,970)], None),
    'water-hammer-result': ('water-hammer-result', [(450,280),(1400,385),(800,550),(800,910)], None),
    'partition': ('partition', [(450,150),(1200,160),(700,500),(1400,500)], None),
    'device-info': ('device-info', [(450,150),(900,215),(700,480),(1380,450)], None),
    'device-maintenance': ('device-maintenance', [(450,150),(1200,210),(700,500),(1400,500)], None),
    'device-protocol': ('device-protocol', [(450,150),(1200,193),(700,500),(1000,500)], None),
    'protocol-bind-form': ('protocol-bind-form', [(500,287),(1050,287),(500,375),(1310,835)], (232,126,1368,872)),
    'device-parameter': ('device-parameter', [(450,150),(1200,210),(700,500),(1400,500)], None),
    'device-valve': ('device-valve', [(450,150),(1200,210),(700,500),(1400,500)], None),
    'command-manage': ('command-manage', [(450,150),(950,150),(900,500),(1450,500)], None),
    'firmware': ('firmware', [(450,150),(1510,167),(700,500),(1450,500)], None),
    'history-overview': ('history-overview', [(500,170),(1350,170),(900,500),(1350,800)], None),
    'data-overview': ('data-overview', [(800,280)], None),
    'audio-data': ('audio-data', [(450,150),(1200,210),(700,500),(1400,500)], None),
    'leakage-data': ('leakage-data', [(450,150),(1200,210),(700,500),(1400,500)], None),
    'suspect-management': ('suspect-management', [(450,150),(1200,210),(700,500),(1350,500)], None),
    'suspect-processing': ('suspect-processing', [(450,150),(1200,210),(700,500),(1350,500)], None),
    'leak-management': ('leak-management', [(450,150),(1200,210),(700,500),(1350,500)], None),
    'leak-analysis': ('leak-analysis', [(450,150),(1200,210),(700,500),(1350,500)], None),
    'work-order-create': ('work-order-create', [(450,150),(1100,235),(700,500),(1350,500)], None),
    'work-order-form': ('work-order-form', [(500,240),(1050,240),(1300,835)], (236,132,1354,868)),
    'work-order-processing': ('work-order-processing', [(450,150),(1100,235),(700,500),(1350,500)], None),
    'work-order-process': ('work-order-process', [(500,240),(500,467),(1300,835)], (236,132,1354,868)),
    'device-resume': ('device-resume', [(450,150),(1200,210),(700,500),(1400,500)], None),
    'device-ledger': ('device-ledger', [(450,150),(1200,210),(700,500),(1400,500)], None),
    'battery-health': ('battery-health', [(450,150),(1200,210),(700,400),(1400,500)], None),
    'operation-analysis': ('operation-analysis', [(450,150),(1200,210),(700,400),(1400,500)], None),
    'burst-identification': ('burst-identification', [(450,150),(700,300),(700,500),(1400,500)], None),
    'measurement-analysis': ('measurement-analysis', [(450,150),(1200,210),(700,500),(1400,500)], None),
    'leak-location': ('leak-location', [(450,150),(700,500),(1000,500),(1200,800)], None),
    'loss-report': ('loss-report', [(450,150),(1200,210),(700,500),(1400,500)], None),
    'alarm-strategy': ('alarm-strategy', [(450,150),(1100,210),(700,500),(1400,500)], None),
    'alarm-processing': ('alarm-processing', [(450,150),(700,500),(1250,500),(1400,700)], None),
    'system-user': ('system-user', [(450,150),(1050,163),(700,500),(800,780)], None),
    'user-create': ('user-create', [(700,700),(1050,700),(1000,780),(1490,937)], None),
    'system-auth': ('system-auth', [(450,150),(650,300),(1000,500),(1300,900)], None),
    'system-menu': ('system-menu', [(450,150),(1200,210),(700,500),(1400,500)], None),
    'system-search': ('system-search', [(450,150),(1200,210),(700,500),(1400,500)], None),
    'system-dict': ('system-dict', [(450,150),(1200,210),(700,500),(1400,500)], None),
    'protocol-management': ('protocol-management', [(450,150),(1500,230),(700,500),(1450,500)], None),
    'protocol-fields': ('protocol-fields', [(500,280),(900,600),(1300,500)], None),
    'data-parse': ('data-parse', [(450,150),(1200,210),(700,500),(1400,500)], None),
    'data-record': ('data-record', [(450,150),(1200,210),(700,500),(1400,500)], None),
    'leak-detail-noise': ('leak-detail-noise', [(275,249,700,286,'box'),(284,292,935,690,'box')], None),
    'leak-detail-history': ('leak-detail-history', [(275,249,700,286,'box'),(815,249,900,286,'box'),(284,292,932,505,'box'),(284,510,932,990,'box')], None),
    'leak-detail-info': ('leak-detail-info', [(284,250,935,690,'box'),(884,158,918,183,'box')], None),
    'leak-detail-maintenance': ('leak-detail-maintenance', [(284,250,700,330,'box'),(284,332,935,585,'box'),(755,588,935,625,'box')], None),
    'leak-detail-manual': ('leak-detail-manual', [(284,250,690,530,'box'),(730,250,932,530,'box'),(712,548,935,582,'box'),(284,590,932,765,'box')], None),
    'leak-detail-related': ('leak-detail-related', [(275,250,470,286,'box'),(284,292,935,640,'box')], None),
    'leak-detail-find': ('leak-detail-find', [(284,255,935,300,'box'),(284,305,935,880,'box'),(860,305,915,495,'box')], None),
}

def make():
    font = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 26)
    for key, (src, marks, crop) in FIG.items():
        path = SRC / f'{src}.png'
        if not path.exists():
            path = SRC / f'{src}.jpg'
        im = Image.open(path).convert('RGB')
        if im.size != (1600, 1000):
            im = im.resize((1600, 1000))
        if crop:
            im = im.crop(crop)
            marks = [(m[0] - crop[0], m[1] - crop[1]) + tuple(m[2:]) for m in marks]
        d = ImageDraw.Draw(im)
        for i, item in enumerate(marks, 1):
            if len(item) == 5 and item[4] == 'box':
                x0, y0, x1, y1 = item[0], item[1], item[2], item[3]
                d.rectangle((x0, y0, x1, y1), outline=(214, 45, 32), width=3)
                bx, by = x0 - 24, y0
                d.ellipse((bx-21, by-21, bx+21, by+21), fill=(255, 255, 255))
                d.ellipse((bx-18, by-18, bx+18, by+18), fill=(214, 45, 32), outline=(255, 255, 255), width=2)
                d.text((bx, by-1), str(i), font=font, fill='white', anchor='mm')
                continue
            x, y = item[0], item[1]
            px, py = (x + item[2], y + item[3]) if len(item) == 4 else (x, y)
            r = 20
            if (px, py) != (x, y):
                # callout: thin leader line plus a small target dot
                d.line((px, py, x, y), fill=(214, 45, 32), width=3)
                d.ellipse((x - 5, y - 5, x + 5, y + 5), fill=(214, 45, 32), outline=(255, 255, 255), width=2)
            # soft halo for map/dark backgrounds
            d.ellipse((px-r-3, py-r-3, px+r+3, py+r+3), fill=(255,255,255))
            d.ellipse((px-r, py-r, px+r, py+r), fill=(214,45,32), outline=(255,255,255), width=2)
            d.text((px, py-1), str(i), font=font, fill='white', anchor='mm')
        im.save(OUT / f'{key}.png')
    print(f'wrote {len(FIG)} annotated figures')

if __name__ == '__main__':
    make()
