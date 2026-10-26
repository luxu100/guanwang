import os
from pathlib import Path
import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image

ROOT = Path(__file__).resolve().parent
ANN = ROOT / 'annotated-v2'
OUT = Path(os.environ.get('MANUAL_OUT', str(ROOT.parent / 'outputs' / '城市管网渗漏预警平台Web用户操作手册_图文版.docx')))
OUT.parent.mkdir(exist_ok=True)
FONT = 'Microsoft YaHei'
BLUE = RGBColor(21, 101, 192)
RED = RGBColor(198, 40, 40)
GRAY = RGBColor(90, 90, 90)


def set_font(style, size, bold=False, color=RGBColor(0, 0, 0)):
    style.font.name = FONT
    style.font.size = Pt(size)
    style.font.bold = bold
    style.font.italic = False
    style.font.color.rgb = color
    style.element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'), FONT)
    for el in style.element.xpath('.//w:pBdr'):
        el.getparent().remove(el)
    for el in style.element.xpath('.//w:rFonts'):
        for key in ['asciiTheme', 'hAnsiTheme', 'eastAsiaTheme', 'cstheme']:
            el.attrib.pop(qn('w:' + key), None)


def field(paragraph, instr, value='1', size=None):
    r = OxmlElement('w:r')
    f = OxmlElement('w:fldChar'); f.set(qn('w:fldCharType'), 'begin'); r.append(f); paragraph._p.append(r)
    r = OxmlElement('w:r')
    t = OxmlElement('w:instrText'); t.set(qn('xml:space'), 'preserve'); t.text = ' ' + instr + ' '; r.append(t); paragraph._p.append(r)
    r = OxmlElement('w:r')
    s = OxmlElement('w:fldChar'); s.set(qn('w:fldCharType'), 'separate'); r.append(s); paragraph._p.append(r)
    run = paragraph.add_run(value)
    if size:
        run.font.size = Pt(size); run.font.name = FONT
    r = OxmlElement('w:r')
    e = OxmlElement('w:fldChar'); e.set(qn('w:fldCharType'), 'end'); r.append(e); paragraph._p.append(r)


def bookmark(paragraph, name, num):
    s = OxmlElement('w:bookmarkStart'); s.set(qn('w:id'), str(num)); s.set(qn('w:name'), name)
    e = OxmlElement('w:bookmarkEnd'); e.set(qn('w:id'), str(num))
    paragraph._p.insert(0, s); paragraph._p.append(e)


def hyperlink(paragraph, text, anchor, size=None):
    h = OxmlElement('w:hyperlink'); h.set(qn('w:anchor'), anchor); h.set(qn('w:history'), '1')
    r = OxmlElement('w:r')
    if size:
        rPr = OxmlElement('w:rPr')
        sz = OxmlElement('w:sz'); sz.set(qn('w:val'), str(int(size * 2))); rPr.append(sz)
        szc = OxmlElement('w:szCs'); szc.set(qn('w:val'), str(int(size * 2))); rPr.append(szc)
        rf = OxmlElement('w:rFonts'); rf.set(qn('w:ascii'), FONT); rf.set(qn('w:hAnsi'), FONT); rf.set(qn('w:eastAsia'), FONT); rPr.append(rf)
        r.append(rPr)
    t = OxmlElement('w:t'); t.text = text; r.append(t); h.append(r)
    paragraph._p.append(h)


def shade(cell, color):
    tcPr = cell._tc.get_or_add_tcPr()
    sh = OxmlElement('w:shd'); sh.set(qn('w:fill'), color); tcPr.append(sh)


def cell_margins(cell, w=100):
    tcPr = cell._tc.get_or_add_tcPr()
    m = OxmlElement('w:tcMar')
    for side in ['top', 'bottom', 'left', 'right']:
        el = OxmlElement('w:' + side); el.set(qn('w:w'), str(w)); el.set(qn('w:type'), 'dxa'); m.append(el)
    tcPr.append(m)


def make_table(doc, rows, widths, header=True, size=10.5):
    t = doc.add_table(rows=0, cols=len(rows[0]))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    for c, w in zip(t.columns, widths):
        c.width = Inches(w)
    pr = t._tbl.tblPr
    borders = OxmlElement('w:tblBorders')
    for name in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
        edge = OxmlElement('w:' + name)
        edge.set(qn('w:val'), 'single'); edge.set(qn('w:sz'), '4'); edge.set(qn('w:color'), 'D9D9D9')
        borders.append(edge)
    pr.append(borders)
    for i, row in enumerate(rows):
        cells = t.add_row().cells
        for j, (cell, text) in enumerate(zip(cells, row)):
            cell.width = Inches(widths[j])
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.line_spacing = 1.12
            r = p.add_run(text)
            r.font.name = FONT; r.font.size = Pt(size); r.font.color.rgb = RGBColor(0, 0, 0)
            r.font.bold = header and i == 0
            r._element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'), FONT)
            cell_margins(cell)
            if header and i == 0:
                shade(cell, 'EAF2FB')
            elif i % 2 == 0:
                shade(cell, 'F7F9FC')
        trPr = t.rows[i]._tr.get_or_add_trPr()
        trPr.append(OxmlElement('w:cantSplit'))
        if header and i == 0:
            trPr.append(OxmlElement('w:tblHeader'))
    doc.add_paragraph().paragraph_format.space_after = Pt(1)


def add_cover(doc):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(30)
    r = p.add_run('WEB 用户操作手册')
    r.font.name = FONT; r.font.size = Pt(11); r.font.bold = True; r.font.color.rgb = BLUE
    r._element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'), FONT)

    p = doc.add_paragraph(style='Title')
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    p.add_run('城市管网渗漏预警平台')

    p = doc.add_paragraph(style='Subtitle')
    p.paragraph_format.space_after = Pt(10)
    p.add_run('Web 用户操作手册')

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(12)
    r = p.add_run('按页面截图和编号步骤说明日常监测、设备维护、工单处理、报警处置和管理员配置操作。')
    r.font.name = FONT; r.font.size = Pt(11.5)
    r._element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'), FONT)

    make_table(doc, [
        ['项目', '交付信息'],
        ['正式访问地址', 'http://47.243.219.33:28081/'],
        ['演示账号', 'string1'],
        ['演示密码', 'string'],
        ['适用对象', '监测人员、运维人员、系统管理员'],
        ['文档版本', 'V2.0 图文操作版'],
        ['编制日期', '2026 年 10 月 24 日'],
    ], [1.55, 4.95], size=10)

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run('系统简介')
    r.font.name = FONT; r.font.size = Pt(12); r.font.bold = True
    r._element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'), FONT)

    for text in [
        '平台把管网 GIS、噪声监测终端、报警、疑漏点、工单、水锤演示和运维报表整合在同一个桌面 Web 工作区：左侧目录进入业务模块，顶部页签保留已打开页面。',
        '本手册按“先看截图，再按编号操作”的方式编写，图中数字与图下步骤一一对应；设备编号、时间、数量和状态只代表截图时刻，不代表现场固定值。',
        '本页演示账号仅用于验收演示，正式账号由管理员分配；示例坐标和业务数据不得直接照抄到生产环境。',
    ]:
        p = doc.add_paragraph(text)
        p.paragraph_format.line_spacing = 1.3
        p.paragraph_format.space_after = Pt(4)


def add_toc(doc, heads):
    p = doc.add_paragraph('目录', style='Heading 1')
    p.paragraph_format.page_break_before = True
    p.paragraph_format.space_before = Pt(0)
    p = doc.add_paragraph('单击章节名称可跳转到对应页面。页码在 Word 中更新域后显示。')
    p.paragraph_format.space_after = Pt(8)

    half = (len(heads) + 1) // 2
    t = doc.add_table(rows=0, cols=2)
    t.autofit = False
    for c in t.columns:
        c.width = Inches(3.35)
    borders = OxmlElement('w:tblBorders')
    for name in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
        edge = OxmlElement('w:' + name); edge.set(qn('w:val'), 'nil'); borders.append(edge)
    t._tbl.tblPr.append(borders)
    for i in range(half):
        cells = t.add_row().cells
        for j, cell in enumerate(cells):
            cell.width = Inches(3.35)
            cell_margins(cell, 0)
            idx = i + j * half
            if idx >= len(heads):
                continue
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.0
            p.paragraph_format.tab_stops.add_tab_stop(Inches(3.1), WD_TAB_ALIGNMENT.RIGHT)
            hyperlink(p, heads[idx], f'ch{idx + 1}', size=10)
            run = p.add_run('\t'); run.font.size = Pt(10); run.font.name = FONT
            field(p, f'PAGEREF ch{idx + 1} \\h', '', size=10)
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    r = p.add_run('阅读说明：截图为桌面 1600×1000 视口、100% 缩放下的中文界面；编号圆点只用于指示位置，不是系统按钮。示例坐标和业务数据不得直接照抄到生产环境。')
    r.font.size = Pt(10); r.font.color.rgb = GRAY


FIG_WIDTH = {
    'login': 6.9,
    'pipe-editor': 5.95,
    'facility-editor': 6.75,
    'draft-warning': 6.9,
    'work-order-form': 6.9,
    'work-order-process': 6.9,
    'protocol-bind-form': 6.9,
}


def add_figure(doc, key, caption, fig_no):
    path = ANN / f'{key}.png'
    im = Image.open(path)
    w, h = im.size
    width = FIG_WIDTH.get(key, 6.05)
    width = min(width, 7.05 * w / h)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run()
    pic = r.add_picture(str(path), width=Inches(width))
    pic._inline.docPr.set('descr', caption)
    p = doc.add_paragraph(caption, style='Caption')
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(6)


def add_body(doc, text, chapter):
    if not text.strip():
        return
    p = doc.add_paragraph()
    m = re.match(r'^(\d+)\.\s*(.*)$', text)
    lead = re.match(r'^(适用人员|开始前|结果核对|注意|说明|失败处理|建议)[:：](.*)$', text)
    if m:
        p.paragraph_format.left_indent = Inches(0.24)
        p.paragraph_format.first_line_indent = Inches(-0.24)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(m.group(1) + '.')
        r.font.name = FONT; r.font.size = Pt(10.5); r.font.bold = True; r.font.color.rgb = BLUE
        r._element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'), FONT)
        r = p.add_run(' ' + m.group(2))
        r.font.name = FONT; r.font.size = Pt(10.5); r.font.color.rgb = RGBColor(0, 0, 0)
        r._element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'), FONT)
    elif lead:
        r = p.add_run(lead.group(1) + '：')
        r.font.name = FONT; r.font.size = Pt(10.5); r.font.bold = True
        r._element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'), FONT)
        r = p.add_run(lead.group(2))
        r.font.name = FONT; r.font.size = Pt(10.5)
        r._element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'), FONT)
    else:
        r = p.add_run(text)
        r.font.name = FONT; r.font.size = Pt(10.5)
        r._element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'), FONT)
    p.paragraph_format.line_spacing = 1.26
    p.paragraph_format.space_after = Pt(3.5)


def build():
    doc = Document()
    sec = doc.sections[0]
    sec.page_width = Inches(8.5); sec.page_height = Inches(11)
    sec.top_margin = Inches(0.7); sec.bottom_margin = Inches(0.62)
    sec.left_margin = Inches(0.8); sec.right_margin = Inches(0.8)
    sec.header_distance = Inches(0.25); sec.footer_distance = Inches(0.25)
    sec.different_first_page_header_footer = True

    for name, size, bold in [('Normal', 11, False), ('Title', 27, True), ('Subtitle', 17, False),
                             ('Heading 1', 18, True), ('Heading 2', 14, True),
                             ('Caption', 9.5, False)]:
        set_font(doc.styles[name], size, bold)
    n = doc.styles['Normal'].paragraph_format
    n.line_spacing = 1.32; n.space_after = Pt(6); n.widow_control = True
    h1 = doc.styles['Heading 1'].paragraph_format
    h1.space_before = Pt(0); h1.space_after = Pt(9); h1.keep_with_next = True
    h1.page_break_before = True
    h2 = doc.styles['Heading 2'].paragraph_format
    h2.space_before = Pt(10); h2.space_after = Pt(5); h2.keep_with_next = True

    p = sec.header.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = p.add_run('城市管网渗漏预警平台  |  Web 用户操作手册')
    r.font.name = FONT; r.font.size = Pt(8.5); r.font.color.rgb = GRAY
    r._element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'), FONT)
    p = sec.footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run('第 '); r.font.size = Pt(9); r.font.color.rgb = GRAY
    field(p, 'PAGE')
    r = p.add_run(' 页'); r.font.size = Pt(9); r.font.color.rgb = GRAY

    doc.core_properties.title = '城市管网渗漏预警平台 Web 用户操作手册'
    doc.core_properties.subject = '桌面 Web 图文操作手册'
    doc.core_properties.author = '项目交付组'
    doc.core_properties.last_modified_by = '项目交付组'
    doc.core_properties.keywords = 'Web 用户手册 管网 渗漏 操作指南'

    add_cover(doc)

    text = (ROOT / 'manuscript_v2.md').read_text(encoding='utf-8')
    lines = text.splitlines()
    heads = [line[2:].strip() for line in lines if line.startswith('# ')]
    add_toc(doc, heads)

    chapter = 0
    fig_no = 0
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if line.startswith('# '):
            chapter += 1
            fig_no = 0
            p = doc.add_paragraph(line[2:], style='Heading 1')
            bookmark(p, f'ch{chapter}', chapter)
            continue
        if line.startswith('## '):
            doc.add_paragraph(line[3:], style='Heading 2')
            continue
        if line.startswith('@figure '):
            payload = line[8:]
            key, caption = payload.split('|', 1)
            fig_no += 1
            add_figure(doc, key.strip(), caption.strip(), fig_no)
            continue
        add_body(doc, line, chapter)

    settings = doc.settings.element
    update = OxmlElement('w:updateFields'); update.set(qn('w:val'), 'true'); settings.append(update)
    doc.save(OUT)
    print(f'{OUT}|chapters={chapter}|figures={sum(1 for l in lines if l.startswith("@figure"))}|bytes={OUT.stat().st_size}')


if __name__ == '__main__':
    build()
