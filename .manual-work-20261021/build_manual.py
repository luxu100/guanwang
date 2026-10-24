from pathlib import Path
import re, json, math
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parent
OUT = ROOT.parent / 'outputs' / '城市管网渗漏预警平台Web用户操作手册.docx'
OUT.parent.mkdir(exist_ok=True)
ANN = ROOT / 'annotated'
ANN.mkdir(exist_ok=True)
FONT = 'Microsoft YaHei'
FIGURES = {
 'overview': ('one-map', (265,140,1555,735), [(1,950,100,1023,163),(2,700,100,560,285),(3,1000,235,1100,315)]),
 'network': ('network-home', (275,145,835,965), [(1,185,35,70,75),(2,430,188,510,210),(3,430,800,510,796)]),
 'pipe': ('pipe-editor', (280,490,820,910), [(1,190,35,250,64),(2,205,150,268,224),(3,160,315,299,379)]),
 'manual': ('manual-analysis', (275,150,935,790), [(1,490,95,390,65),(2,85,180,170,155),(3,500,370,573,415)]),
 'hammer-form': ('water-hammer-editor',(982,0,1595,425),[(1,405,80,330,130),(2,500,220,455,305)]),
 'hammer-result': ('water-hammer-result',(275,350,1550,820),[(1,970,85,1140,36),(2,520,295,310,220),(3,630,400,780,439)]),
 'location': ('leak-location-pair',(280,190,1545,400),[(1,470,25,290,128),(2,1090,25,955,128)]),
 'order-create': ('work-order-create',(240,135,1360,865),[(1,570,100,540,215),(2,580,425,540,510),(3,875,650,1045,695)]),
 'order-process': ('work-order-process-form',(240,135,1360,865),[(1,230,100,210,215),(2,660,390,470,505),(3,870,650,1040,695)]),
 'alarm': ('alarm-rule',(390,220,1195,805),[(1,620,120,420,185),(2,590,230,610,295),(3,590,380,425,438)]),
 'protocol-meta': ('protocol-fields',(270,200,1560,430),[(1,160,15,220,112),(2,970,15,1245,32)]),
 'protocol-fields': ('protocol-fields',(275,455,1550,923),[(1,530,25,560,115),(2,910,25,1035,115)]),
 'scene': ('protocol-scene',(1245,275,1575,970),[(1,265,40,155,110),(2,270,195,155,270),(3,260,440,120,537)]),
 'permissions': ('permissions-checked',(265,195,1570,972),[(1,170,40,90,80),(2,580,70,360,170),(3,1000,650,1250,730)]),
 'user': ('user-create',(495,550,1560,968),[(1,470,25,220,168),(2,550,160,335,240),(3,850,280,925,389)]),
}

def annotate():
    font = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',24)
    for key,(src,box,marks) in FIGURES.items():
        im=Image.open(ROOT/'screens'/f'{src}.jpg').convert('RGB').crop(box)
        d=ImageDraw.Draw(im)
        if key=='user':
            for rect in [(12,91,267,125),(277,91,530,125)]:
                d.rectangle(rect,fill='#e2e5e8')
                d.text((rect[0]+8,rect[1]+4),'ACCOUNT',font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18),fill='#555555')
        for n,x,y,tx,ty in marks:
            dx,dy=tx-x,ty-y
            length=max(math.hypot(dx,dy),1)
            ux,uy=dx/length,dy/length
            d.line((x+ux*19,y+uy*19,tx,ty),fill='#c62828',width=3)
            d.polygon([(tx,ty),(tx-ux*14-uy*6,ty-uy*14+ux*6),(tx-ux*14+uy*6,ty-uy*14-ux*6)],fill='#c62828')
            d.ellipse((x-18,y-18,x+18,y+18),fill='#c62828',outline='white',width=2)
            d.text((x,y-1),str(n),font=font,fill='white',anchor='mm')
        im.save(ANN/f'{key}.png')

def field(p, instruction, value='1'):
    r=OxmlElement('w:r'); b=OxmlElement('w:fldChar');b.set(qn('w:fldCharType'),'begin');r.append(b);p._p.append(r)
    r=OxmlElement('w:r');t=OxmlElement('w:instrText');t.set(qn('xml:space'),'preserve');t.text=' '+instruction+' ';r.append(t);p._p.append(r)
    r=OxmlElement('w:r');s=OxmlElement('w:fldChar');s.set(qn('w:fldCharType'),'separate');r.append(s);p._p.append(r)
    p.add_run(value)
    r=OxmlElement('w:r');e=OxmlElement('w:fldChar');e.set(qn('w:fldCharType'),'end');r.append(e);p._p.append(r)

def bookmark(p,name,num):
    start=OxmlElement('w:bookmarkStart');start.set(qn('w:id'),str(num));start.set(qn('w:name'),name)
    end=OxmlElement('w:bookmarkEnd');end.set(qn('w:id'),str(num))
    p._p.insert(0,start);p._p.append(end)

def link(p,text,name):
    h=OxmlElement('w:hyperlink');h.set(qn('w:anchor'),name);h.set(qn('w:history'),'1')
    r=OxmlElement('w:r');props=OxmlElement('w:rPr');color=OxmlElement('w:color');color.set(qn('w:val'),'000000');props.append(color);r.append(props)
    t=OxmlElement('w:t');t.text=text;r.append(t);h.append(r);p._p.append(h)

def fontstyle(style,size,bold=False):
    style.font.name=FONT;style.font.size=Pt(size);style.font.bold=bold;style.font.italic=False;style.font.color.rgb=RGBColor(0,0,0)
    style.element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'),FONT)
    for el in style.element.xpath('.//w:pBdr'):
        el.getparent().remove(el)
    for el in style.element.xpath('.//w:rFonts'):
        for key in ['asciiTheme','hAnsiTheme','eastAsiaTheme','cstheme']:
            el.attrib.pop(qn('w:'+key),None)

def table(doc,rows):
    t=doc.add_table(rows=1,cols=len(rows[0]));t.alignment=WD_TABLE_ALIGNMENT.CENTER;t.autofit=False
    widths=([1.45,5.45] if len(rows[0])==2 else [1.35,2.15,3.4])
    if len(rows[0])==4: widths=[1.05,1.35,1.5,3.0]
    for c,w in zip(t.columns,widths):c.width=Inches(w)
    pr=t._tbl.tblPr; borders=OxmlElement('w:tblBorders')
    for name in ['top','left','bottom','right','insideH','insideV']:
        edge=OxmlElement('w:'+name);edge.set(qn('w:val'),'single');edge.set(qn('w:sz'),'4');edge.set(qn('w:color'),'D9D9D9');borders.append(edge)
    pr.append(borders)
    for i,row in enumerate(rows):
        cells=t.rows[0].cells if i==0 else t.add_row().cells
        for j,(cell,txt) in enumerate(zip(cells,row)):
            cell.width=Inches(widths[j]);cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
            p=cell.paragraphs[0];p.paragraph_format.space_after=Pt(4);p.paragraph_format.space_before=Pt(4);p.paragraph_format.line_spacing=1.15
            r=p.add_run(txt);r.font.size=Pt(10.5);r.bold=i==0
            tcPr=cell._tc.get_or_add_tcPr();m=OxmlElement('w:tcMar')
            for side in ['top','bottom','left','right']:
                el=OxmlElement('w:'+side);el.set(qn('w:w'),'90');el.set(qn('w:type'),'dxa');m.append(el)
            tcPr.append(m)
            if i==0:
                sh=OxmlElement('w:shd');sh.set(qn('w:fill'),'E7EFF6');tcPr.append(sh)
        trPr=t.rows[i]._tr.get_or_add_trPr();cant=OxmlElement('w:cantSplit');trPr.append(cant)
        if i==0: repeat=OxmlElement('w:tblHeader');trPr.append(repeat)
    doc.add_paragraph().paragraph_format.space_after=Pt(2)

def build():
    annotate(); doc=Document();sec=doc.sections[0]
    sec.page_width=Inches(8.5);sec.page_height=Inches(11)
    sec.top_margin=Inches(.7);sec.bottom_margin=Inches(.65);sec.left_margin=Inches(.8);sec.right_margin=Inches(.8)
    sec.header_distance=Inches(.25);sec.footer_distance=Inches(.25);sec.different_first_page_header_footer=True
    for name,size,bold in [('Normal',11,False),('Title',26,True),('Subtitle',16,False),('Heading 1',18,True),('Heading 2',14,True),('Heading 3',12,True),('Caption',10.5,False)]:
        fontstyle(doc.styles[name],size,bold)
    normal=doc.styles['Normal'].paragraph_format;normal.line_spacing=1.35;normal.space_after=Pt(6);normal.widow_control=True
    for level in [1,2,3]:
        pf=doc.styles[f'Heading {level}'].paragraph_format;pf.space_before=Pt(14);pf.space_after=Pt(8);pf.keep_with_next=True
    doc.styles['Heading 1'].paragraph_format.page_break_before=True
    p=sec.header.paragraphs[0];p.add_run('城市管网渗漏预警平台  Web 用户操作手册').font.size=Pt(9)
    p=sec.footer.paragraphs[0];p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p.add_run('第 ');field(p,'PAGE');p.add_run(' 页')
    doc.core_properties.title='城市管网渗漏预警平台 Web 用户操作手册'
    doc.core_properties.subject='桌面 Web 用户操作'
    doc.core_properties.author='项目交付组';doc.core_properties.last_modified_by='项目交付组'
    doc.core_properties.keywords='Web 用户手册 管网 渗漏 操作指南'
    doc.add_paragraph('城市管网渗漏预警平台',style='Title').paragraph_format.space_before=Pt(92)
    doc.add_paragraph('Web 用户操作手册',style='Subtitle')
    doc.add_paragraph('日常监测人员  运维人员  系统管理员').paragraph_format.space_before=Pt(36)
    doc.add_paragraph('版本 V1.0\n编制日期 2026年10月21日\n适用代码版本 master b6394f9\n代码提交日期 2026年10月15日').paragraph_format.space_before=Pt(38)
    doc.add_paragraph('本手册说明桌面浏览器中的监测、查询、维护和管理操作。涉及设备控制、工单提交和权限变更时，请先确认操作对象及授权。').paragraph_format.space_before=Pt(26)
    doc.add_page_break();doc.add_paragraph('文档使用说明',style='Heading 2')
    doc.add_paragraph('第一次使用请先阅读快速入门及第1章、第2章。日常值守可从第3章一张图开始；处理设备疑漏请阅读第4章、第9章和第10章；管理员配置请阅读第14章、第15章。目录条目可点击跳转，Word 中可按住 Ctrl 后单击。')
    doc.add_paragraph('截图采用中文桌面界面，展示的数量、编号、时间和状态仅对应截图时刻，不代表交付现场的固定值。截图中的编号圆点用于指示操作位置，不是系统按钮。所有坐标示例只用于解释填写格式，不应照抄到实际管网。')
    doc.add_paragraph('功能边界：水锤分析是静态模拟；电池健康度和运行分析报告当前使用演示数据；一张图的管线风险历史尚不可用；数据系统总览及我的收藏为预留页面。业务查询无数据、正在加载和接口失败是三种不同情况，不得将空白视为运行正常。')
    doc.add_paragraph('访问地址：使用项目管理员提供的正式 Web 地址。截图来自核验环境，正式入口和账号以交付通知为准。不要将开发地址、接口地址或 Swagger 地址作为日常业务入口。')
    doc.add_paragraph('修订记录',style='Heading 2')
    table(doc,[['版本','日期','说明'],['V1.0','2026年10月21日','根据当前代码和中文 Web 页面整理首次操作手册，覆盖全部现有菜单及复杂流程。']])
    doc.add_paragraph('使用角色',style='Heading 2')
    table(doc,[['人员','主要工作','操作边界'],['监测人员','查看报警、趋势、设备状态和波形','不因颜色或单次异常直接认定漏水或爆管。'],['运维人员','现场复核、疑点处理、维护记录和工单反馈','变更记录需与实际现场情况一致。'],['系统管理员','用户、角色、协议、字典和设备配置','先核对影响范围；不要用生产对象练习。']])
    text=(ROOT/'manuscript.md').read_text(encoding='utf-8')
    lines=text.splitlines();heads=[]
    for line in lines:
        if line.startswith('# '): heads.append((line[2:],'ch'+str(len(heads)+1)))
    doc.add_page_break();doc.add_paragraph('目录',style='Heading 2')
    for i,(title,anchor) in enumerate(heads):
        p=doc.add_paragraph();p.paragraph_format.space_after=Pt(8);p.paragraph_format.tab_stops.add_tab_stop(Inches(6.55),WD_TAB_ALIGNMENT.RIGHT)
        link(p,title,anchor);p.add_run('\t');field(p,f'PAGEREF {anchor} \\h','')
    doc.add_paragraph('目录为可点击的章节索引；各章内部按任务分节。页码随 Word 排版自动计算。')
    idx=0;chapter=0;fig=0;image_manifest=[]
    while idx<len(lines):
        line=lines[idx].strip();idx+=1
        if not line: continue
        if line.startswith('# '):
            chapter+=1;fig=0;p=doc.add_paragraph(line[2:],style='Heading 1');bookmark(p,'ch'+str(chapter),chapter);continue
        if line.startswith('## '):doc.add_paragraph(line[3:],style='Heading 2');continue
        if line.startswith('### '):doc.add_paragraph(line[4:],style='Heading 3');continue
        if line.startswith('|'):
            rows=[[v.strip() for v in line.strip('|').split('|')]]
            while idx<len(lines) and lines[idx].strip().startswith('|'):
                rows.append([v.strip() for v in lines[idx].strip().strip('|').split('|')]);idx+=1
            table(doc,rows);continue
        if line.startswith('@figure '):
            key,caption=line[8:].split('|',1);fig+=1
            im=Image.open(ANN/f'{key}.png');w,h=im.size
            width=min(6.85,7.05*w/h)
            p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.keep_with_next=True;p.paragraph_format.space_before=Pt(6)
            r=p.add_run();pic=r.add_picture(str(ANN/f'{key}.png'),width=Inches(width));pic._inline.docPr.set('descr',caption)
            p=doc.add_paragraph(f'图{chapter-1}-{fig}  {caption}',style='Caption');p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.space_after=Pt(10)
            image_manifest.append({'key':key,'caption':caption,'width_in':width});continue
        p=doc.add_paragraph()
        if re.match(r'^\d+\.',line):p.paragraph_format.left_indent=Inches(.18);p.paragraph_format.first_line_indent=Inches(-.18)
        split=re.match(r'^(适用人员|目的|开始前|入口|结果核对|失败处理|注意|影响|说明|提交前检查|示例|图中编号)[:：](.*)',line)
        if split:p.add_run(split[1]+'：').bold=True;p.add_run(split[2])
        else:p.add_run(line)
    settings=doc.settings.element;update=OxmlElement('w:updateFields');update.set(qn('w:val'),'true');settings.append(update)
    doc.save(OUT)
    (ROOT/'figure-manifest.json').write_text(json.dumps(image_manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'output':str(OUT),'chapters':chapter,'figures':len(image_manifest),'paragraphs':len(doc.paragraphs),'tables':len(doc.tables),'bytes':OUT.stat().st_size},ensure_ascii=False))

if __name__=='__main__':build()
