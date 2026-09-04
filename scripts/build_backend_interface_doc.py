from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

from pathlib import Path


OUT = Path(r"D:\guanwang\guanwang\outputs\管网一张图与风险监测接口需求说明.docx")

BLUE = "2E74B5"
DARK_BLUE = "1F4D78"
INK = "0B2545"
MUTED = "5F6B7A"
LIGHT_BLUE = "E8EEF5"
LIGHT_GRAY = "F2F4F7"
CALLOUT = "F4F6F9"
WHITE = "FFFFFF"
RED = "9B1C1C"
GOLD = "7A5A00"
GREEN = "1F6B4F"


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=80, start=120, bottom=80, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for m, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{m}"))
        if node is None:
            node = OxmlElement(f"w:{m}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_cell_width(cell, width_dxa):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_w = tc_pr.find(qn("w:tcW"))
    if tc_w is None:
        tc_w = OxmlElement("w:tcW")
        tc_pr.append(tc_w)
    tc_w.set(qn("w:w"), str(width_dxa))
    tc_w.set(qn("w:type"), "dxa")


def set_table_geometry(table, widths):
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    table.autofit = False
    tbl = table._tbl
    tbl_pr = tbl.tblPr

    tbl_w = tbl_pr.find(qn("w:tblW"))
    if tbl_w is None:
        tbl_w = OxmlElement("w:tblW")
        tbl_pr.append(tbl_w)
    tbl_w.set(qn("w:w"), str(sum(widths)))
    tbl_w.set(qn("w:type"), "dxa")

    tbl_ind = tbl_pr.find(qn("w:tblInd"))
    if tbl_ind is None:
        tbl_ind = OxmlElement("w:tblInd")
        tbl_pr.append(tbl_ind)
    tbl_ind.set(qn("w:w"), "120")
    tbl_ind.set(qn("w:type"), "dxa")

    grid = tbl.tblGrid
    for child in list(grid):
        grid.remove(child)
    for width in widths:
        col = OxmlElement("w:gridCol")
        col.set(qn("w:w"), str(width))
        grid.append(col)

    for row in table.rows:
        for cell, width in zip(row.cells, widths):
            set_cell_width(cell, width)
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER


def set_run_font(run, name="Calibri", size=11, color=None, bold=None, italic=None):
    run.font.name = name
    run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
    run.font.size = Pt(size)
    if color:
        run.font.color.rgb = RGBColor.from_string(color)
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.italic = italic


def style_paragraph(paragraph, before=0, after=6, line=1.25, align=None):
    fmt = paragraph.paragraph_format
    fmt.space_before = Pt(before)
    fmt.space_after = Pt(after)
    fmt.line_spacing = line
    if align is not None:
        paragraph.alignment = align


def add_text(doc, text, bold=False, color=None, size=11, after=6, before=0, align=None):
    paragraph = doc.add_paragraph()
    style_paragraph(paragraph, before=before, after=after, line=1.25, align=align)
    run = paragraph.add_run(text)
    set_run_font(run, size=size, color=color or INK, bold=bold)
    return paragraph


def add_bullet(doc, text, level=0):
    paragraph = doc.add_paragraph(style="List Bullet")
    style_paragraph(paragraph, after=4, line=1.25)
    paragraph.paragraph_format.left_indent = Inches(0.375 + level * 0.25)
    paragraph.paragraph_format.first_line_indent = Inches(-0.188)
    run = paragraph.add_run(text)
    set_run_font(run, size=10.5, color=INK)
    return paragraph


def add_number(doc, text):
    paragraph = doc.add_paragraph(style="List Number")
    style_paragraph(paragraph, after=4, line=1.25)
    paragraph.paragraph_format.left_indent = Inches(0.375)
    paragraph.paragraph_format.first_line_indent = Inches(-0.188)
    run = paragraph.add_run(text)
    set_run_font(run, size=10.5, color=INK)
    return paragraph


def add_heading(doc, text, level=1):
    paragraph = doc.add_paragraph(style=f"Heading {level}")
    run = paragraph.add_run(text)
    set_run_font(run, size={1: 16, 2: 13, 3: 12}[level],
                 color=BLUE if level < 3 else DARK_BLUE, bold=True)
    return paragraph


def add_callout(doc, title, text, fill=CALLOUT, accent=BLUE):
    table = doc.add_table(rows=1, cols=1)
    set_table_geometry(table, [9360])
    cell = table.cell(0, 0)
    set_cell_shading(cell, fill)
    cell._tc.get_or_add_tcPr().append(OxmlElement("w:tcBorders"))
    paragraph = cell.paragraphs[0]
    style_paragraph(paragraph, before=0, after=3, line=1.2)
    run = paragraph.add_run(title)
    set_run_font(run, size=10.5, color=accent, bold=True)
    paragraph.add_run("\n")
    run = paragraph.add_run(text)
    set_run_font(run, size=10.5, color=INK)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def add_table(doc, headers, rows, widths, header_fill=LIGHT_BLUE, font_size=9.5):
    table = doc.add_table(rows=1, cols=len(headers))
    set_table_geometry(table, widths)
    header = table.rows[0].cells
    for index, text in enumerate(headers):
        set_cell_shading(header[index], header_fill)
        p = header[index].paragraphs[0]
        style_paragraph(p, after=0, line=1.12)
        r = p.add_run(str(text))
        set_run_font(r, size=font_size, color=INK, bold=True)
    for row_data in rows:
        cells = table.add_row().cells
        for index, value in enumerate(row_data):
            p = cells[index].paragraphs[0]
            style_paragraph(p, after=0, line=1.12)
            r = p.add_run(str(value))
            set_run_font(r, size=font_size, color=INK)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return table


def add_label_detail_table(doc, rows):
    return add_table(doc, ["项目", "要求"], rows, [2700, 6660], font_size=9.7)


def add_interface(doc, title, status, method, path, purpose, request, response, notes=None):
    add_heading(doc, title, level=3)
    add_table(doc, ["属性", "内容"], [
        ("实现状态", status),
        ("方法与路径", f"{method} {path}"),
        ("用途", purpose),
        ("请求参数", request),
        ("响应内容", response),
    ], [1800, 7560], font_size=9.5)
    if notes:
        add_callout(doc, "后端实现注意", notes, fill="FFF8E8", accent=GOLD)


def add_page_number(paragraph):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = paragraph.add_run("第 ")
    set_run_font(run, size=9, color=MUTED)
    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = " PAGE "
    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "end")
    run._r.append(fld_char1)
    run._r.append(instr_text)
    run._r.append(fld_char2)
    run = paragraph.add_run(" 页")
    set_run_font(run, size=9, color=MUTED)


def configure_document(doc):
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)
    section.header_distance = Inches(0.492)
    section.footer_distance = Inches(0.492)

    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
    normal.font.size = Pt(11)
    normal.font.color.rgb = RGBColor.from_string(INK)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.25

    for name, size, color, before, after in [
        ("Heading 1", 16, BLUE, 18, 10),
        ("Heading 2", 13, BLUE, 14, 7),
        ("Heading 3", 12, DARK_BLUE, 10, 5),
    ]:
        style = doc.styles[name]
        style.font.name = "Calibri"
        style._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
        style._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor.from_string(color)
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.line_spacing = 1.25

    header = section.header.paragraphs[0]
    style_paragraph(header, after=0, line=1.0)
    r = header.add_run("管网在线安全监测项目 | 后端接口需求说明")
    set_run_font(r, size=9, color=MUTED, bold=True)

    footer = section.footer.paragraphs[0]
    add_page_number(footer)


def build_doc():
    doc = Document()
    configure_document(doc)

    add_text(doc, "后端接口需求说明", bold=True, color=BLUE, size=11, after=2)
    title = doc.add_paragraph()
    style_paragraph(title, after=5, line=1.05)
    run = title.add_run("管网一张图与风险监测")
    set_run_font(run, size=25, color=INK, bold=True)
    subtitle = doc.add_paragraph()
    style_paragraph(subtitle, after=16, line=1.15)
    run = subtitle.add_run("二维 GIS 管线融合、物联网监测、报警分析、风险评估与噪声关联定位")
    set_run_font(run, size=13, color=MUTED)

    add_label_detail_table(doc, [
        ("文档用途", "发送后端工程师，用于接口设计、字段确认、联调和验收"),
        ("文档版本", "V1.0"),
        ("编制日期", "2026年9月3日"),
        ("适用页面", "渗漏监测、系统设置、数据接收与解析"),
        ("地图范围", "仅二维管线、设备、报警和定位结果展示；前端建议使用 OpenLayers"),
        ("接口策略", "兼容现有 /api 资源接口，补充缺失能力；路径为建议路径，可按后端规范调整"),
    ])

    add_callout(
        doc,
        "给后端的交付重点",
        "地图能否正确展示，关键不只是返回经纬度，还需要返回管线有序坐标、坐标系、管线段标识以及设备与管线段的关联关系。噪声关联算法若只返回文本或“距 A 点距离”，前端无法可靠地把问题位置落到弯曲管线上。",
        fill="EAF4FF",
        accent=BLUE,
    )

    add_heading(doc, "1. 需求边界与来源说明", level=1)
    add_text(doc, "本说明只抽取与本轮接口建设直接相关的内容。技术协议中的硬件参数、安装运输、质保、APP、水锤模拟等内容不作为本轮接口实现范围。")
    add_text(doc, "用户明确要求的功能包括：接入 GIS 管网数据，在地图上融合管线、设备和物联网监测数据；展示设备位置、实时状态、报警分布和报警明细；展示近一周报警趋势、数量及至少一年历史趋势；基于材质、管龄、管径等因素展示管线风险评估结果；用不同颜色显示管线风险区域。")
    add_text(doc, "组内讨论确定的前端约束包括：只绘制二维管线；通过坐标绘制线和区域；优先使用 OpenLayers；不要求三维精细建模；渗漏监测页面加载“管线 + 设备”图层。")

    add_heading(doc, "2. 现有代码基础与接口缺口", level=1)
    add_table(doc, ["模块", "当前已有能力", "本轮需要补充"], [
        ("渗漏监测地图", "已有设备可见列表、设备详情、分区列表和地图点位标准化逻辑", "管线几何、风险图层、报警图层、统一地图监测数据"),
        ("噪声关联分析", "已有附近设备查询、音频查询、WAV读取和漏点定位请求/结果字段", "返回管线段、A/B锚点、沿线距离或疑似漏点坐标"),
        ("报警", "页面路由存在，报警 service 尚未封装实际接口", "报警分页、详情、汇总、趋势、分布和处理关联"),
        ("数据接收解析", "已有协议、协议绑定、字段定义、解析记录、采样记录和算法结果接口", "标准化指标、事件时间、原始报文追溯和统一监测查询"),
        ("系统设置", "已有用户、角色、权限、菜单、字典接口", "地图配置、风险配置、报警配置和相关权限编码"),
    ], [1800, 3600, 3960], font_size=9.3)
    add_text(doc, "现有代码中可复用的主要资源路径包括 /api/device/visible-list、/api/device/{id}/detail、/api/tube-network/list、/api/region/list、/api/device-query/nearby-analysis/{deviceNumber} 和 /api/leak-locate/analyze。", color=MUTED, size=9.5, after=8)

    add_heading(doc, "3. 通用接口约定", level=1)
    add_table(doc, ["项目", "统一要求"], [
        ("响应包装", "统一返回 code、msg、data、timestamp；可选 requestId。HTTP 非 2xx 时返回可识别错误。"),
        ("分页", "请求使用 pageNum、pageSize、sortField、sortOrder；响应使用 records、total、pageNum、pageSize。"),
        ("时间", "统一使用 ISO 8601，建议带时区；事件发生时间与数据入库时间分开返回。"),
        ("数值", "返回数值类型和单位；不要用“--”替代空值。空值需由 null 或明确质量状态表达。"),
        ("坐标", "所有地图数据必须返回 coordinateSystem，建议统一输出 WGS84；若保留 GCJ02，必须明确声明。"),
        ("数据质量", "建议统一返回 dataQuality：NORMAL、MISSING、STALE、INVALID、ESTIMATED，并附 qualityMessage。"),
        ("权限", "接口侧校验地图、管线、设备、报警、风险、算法和配置权限，不能只依赖前端隐藏按钮。"),
    ], [1800, 7560], font_size=9.6)

    add_heading(doc, "4. GIS 管线与地图图层接口", level=1)
    add_text(doc, "OpenLayers 可以直接消费 GeoJSON，因此管线和风险图层建议采用 GeoJSON FeatureCollection。接口至少需要支持按地图范围返回数据，避免一次加载全部历史管线。")

    add_interface(
        doc,
        "4.1 管线 GIS 图层",
        "新增，建议路径",
        "GET",
        "/api/tube-network/gis/list",
        "返回地图绘制所需的二维管线段和管线业务属性。",
        "regionId、tubeType、status、visibleOnly、bbox、minZoom、maxZoom、updatedSince；bbox 格式建议为 minLng,minLat,maxLng,maxLat。",
        "GeoJSON FeatureCollection；每个 Feature 的 geometry 为 LineString 或 MultiLineString，properties 至少包含 segmentId、tubeName、lengthM、material、constructionYear、ageYears、diameterMm、wallThicknessMm、deptId、upstreamSegmentId、downstreamSegmentId、deviceIds、coordinateSystem、visible。",
        "必须返回有序坐标。不能只返回管线起点和终点，否则弯曲管线无法正确绘制，也无法承载沿线漏点定位。",
    )
    add_interface(
        doc,
        "4.2 管线详情",
        "复用并扩展现有 /api/tube-network/{id}",
        "GET",
        "/api/tube-network/{id}",
        "查看单段管线的基础资料、几何、风险和关联设备。",
        "路径参数 id；可选 includeRisk、includeDevices、includeAlarmSummary。",
        "segmentId、tubeName、geometry、lengthM、material、constructionYear、ageYears、diameterMm、wallThicknessMm、deptId、关联设备、风险摘要、近期开关状态、创建和更新时间。",
        "详情返回的 segmentId 必须与 GIS 图层、风险结果、报警结果和算法定位结果使用同一标识。",
    )
    add_interface(
        doc,
        "4.3 地图图层汇总",
        "新增，建议路径",
        "GET",
        "/api/leak-monitor/map-overview",
        "一次返回渗漏监测页面初始化所需的管线、设备、分区、风险和报警图层摘要。",
        "regionId、bbox、zoom、layerTypes、updatedSince；layerTypes 可包含 pipe、device、region、risk、alarm、leakLocation。",
        "coordinateSystem、mapConfig、pipes、devices、regions、riskSegments、alarms、leakLocations、generatedAt、dataVersion。",
        "该接口可作为 BFF 聚合接口；如果后端不做聚合，前端将分别调用 4.1、5.1、6.4 和 7.1。",
    )

    add_heading(doc, "5. 设备与物联网实时监测接口", level=1)
    add_interface(
        doc,
        "5.1 地图设备监测列表",
        "新增或扩展现有 /api/device/visible-list",
        "GET",
        "/api/device-query/map-monitoring",
        "返回设备点位、实时状态和最新监测指标，用于地图设备图层和侧边统计。",
        "deviceIds、deviceNumber、regionId、segmentId、onlineStatus、leakStatus、bbox、updatedSince、includeMetrics。",
        "deviceId、deviceNumber、deviceName、deviceAlias、model、lng、lat、coordinateSystem、installAddress、segmentId、deptId、onlineStatus、lastSeenAt、lastSamplingTime、leakStatus、manualAnalysisStatus、algorithmAnalysisStatus、pressure、noiseValue、leakEsa、leakIntensity、leakFrequency、flow、batteryVoltage、batteryLevel、dataQuality、alarmCount。",
        "实时状态必须带 lastSeenAt 或数据时间，前端据此判断离线和过期；不能只返回一个 onlineStatus 数字。",
    )
    add_interface(
        doc,
        "5.2 设备详情",
        "复用并扩展现有 /api/device/{id}/detail",
        "GET",
        "/api/device/{id}/detail",
        "展示设备台账、安装位置、所属管线、最新状态、传感器和维护关联。",
        "路径参数 id；可选 includeLatestStatus、includePipe、includeMaintenance。",
        "设备基础信息、设备坐标、coordinateSystem、segmentId、tubeGroup、tubeNumber、tubeMaterial、tubeBore、最新压力/噪声/流量、电池和信号、最近报警、最近采样、维护记录摘要。",
        "设备与管线段关联建议使用 segmentId；tubeGroup 或 tubeNumber 可作为兼容字段，但不应作为唯一关联键。",
    )
    add_interface(
        doc,
        "5.3 实时监测轮询",
        "新增，建议路径",
        "GET",
        "/api/device-query/map-monitoring/changes",
        "按更新时间增量返回设备状态变化，降低地图轮询数据量。",
        "since、until、deviceIds、regionId；since 为空时返回当前快照。",
        "serverTime、nextSince、items；items 使用 5.1 的设备实时字段，并包含 changedFields。",
        "最低实现可以使用普通轮询；如后端具备推送能力，可额外提供 WebSocket/SSE，但不作为本轮前端必需依赖。",
    )

    add_heading(doc, "6. 报警接口", level=1)
    add_text(doc, "报警页面路由和 service 文件已存在，但当前尚未有可调用的报警资源接口。以下接口是近一周趋势、数量、分布和明细的最小闭环。")
    add_interface(
        doc,
        "6.1 报警明细分页",
        "新增",
        "POST",
        "/api/alarm/page",
        "分页查询报警记录，支持地图点击、列表查看和历史筛选。",
        "pageNum、pageSize、startTime、endTime、alarmType、alarmLevel、status、deviceId、deviceNumber、segmentId、regionId、bbox、sortField、sortOrder。",
        "records、total；记录包含 alarmId、alarmType、alarmLevel、status、occurredAt、recoveredAt、deviceId、deviceNumber、segmentId、regionId、lng、lat、coordinateSystem、message、metricName、metricValue、thresholdValue、algorithmResultId、workOrderId、createdAt。",
        "报警记录必须能够关联到设备和管线段；地图分布不能只返回一个无法回溯的坐标点。",
    )
    add_interface(
        doc,
        "6.2 报警详情",
        "新增",
        "GET",
        "/api/alarm/{id}",
        "查看报警完整信息、触发数据、算法依据和处理状态。",
        "路径参数 id。",
        "报警基础字段、设备与管线信息、触发前后指标、阈值规则、算法结果、确认人、确认时间、忽略原因、工单信息、原始数据引用。",
        "原始数据建议通过 recordId、samplingId、audioId、algorithmResultId 等 ID 关联，不建议把大段原始报文直接嵌入报警列表。",
    )
    add_interface(
        doc,
        "6.3 报警汇总",
        "新增",
        "GET",
        "/api/alarm/summary",
        "返回当前时间范围内的报警数量、类型、等级和处理状态统计。",
        "startTime、endTime、regionId、segmentId、deviceId、alarmType、alarmLevel。",
        "total、unhandledCount、handledCount、recoveredCount、byType、byLevel、byStatus、topDevices、topSegments。",
        "summary 的 total 必须与同条件分页数据的统计口径一致。",
    )
    add_interface(
        doc,
        "6.4 报警趋势",
        "新增",
        "GET",
        "/api/alarm/trend",
        "支持渗漏监测页面展示近 7 日趋势及至少一年历史趋势。",
        "startTime、endTime、granularity(day/week/month)、regionId、segmentId、alarmType、alarmLevel。",
        "points 数组；每项包含 time、totalCount、leakCount、burstCount、pressureCount、offlineCount、otherCount，并返回 startTime、endTime、granularity。",
        "后端负责按时间粒度聚合，不能要求前端拉取一年报警明细后自行计算。",
    )
    add_interface(
        doc,
        "6.5 报警分布",
        "新增",
        "GET",
        "/api/alarm/distribution",
        "返回地图上的报警点、报警管线段和分区聚合结果。",
        "startTime、endTime、regionId、alarmType、alarmLevel、status、bbox、groupBy(point/segment/region)。",
        "按点返回 alarmId、lng、lat、coordinateSystem、alarmLevel；按管线段返回 segmentId、alarmCount、highestLevel、lastOccurredAt；按分区返回 regionId、alarmCount。",
        "分布接口应支持聚合，避免报警数量较大时在地图上创建大量重复点。",
    )
    add_interface(
        doc,
        "6.6 报警处理关联",
        "可选扩展",
        "POST",
        "/api/alarm/{id}/confirm、/ignore、/work-order",
        "支持后续报警确认、忽略和转工单。",
        "操作人、操作时间、备注或忽略原因、workOrderId。",
        "alarmId、status、updatedAt、operator。",
        "本轮地图展示至少需要读取处理状态；动作接口可与报警处理页面一起实现。",
    )

    add_heading(doc, "7. 管线风险评估接口", level=1)
    add_interface(
        doc,
        "7.1 风险地图结果",
        "新增",
        "GET",
        "/api/tube-network/risk/map",
        "返回按管线段划分的风险评估结果和地图几何。",
        "regionId、segmentId、material、minAgeYears、maxAgeYears、minDiameterMm、maxDiameterMm、startTime、endTime、riskLevel、modelVersion、bbox、zoom。",
        "GeoJSON FeatureCollection；geometry 为管线几何，properties 包含 segmentId、material、constructionYear、ageYears、diameterMm、wallThicknessMm、pressureTransientCount、pressureTransientIntensity、alarmCount、leakEventCount、riskScore、riskLevel、riskFactors、modelVersion、evaluatedAt、displayColor。",
        "风险颜色必须与 riskLevel 和 riskScore 同时返回；前端可按颜色绘制，但不能只依赖颜色判断业务等级。",
    )
    add_interface(
        doc,
        "7.2 单段风险详情",
        "新增",
        "GET",
        "/api/tube-network/risk/{segmentId}",
        "查看某一管线段的风险评分、计算因素和历史变化。",
        "路径参数 segmentId；可选 startTime、endTime、modelVersion。",
        "管线基础属性、riskScore、riskLevel、riskFactors、指标明细、历史报警摘要、历史渗漏摘要、模型版本、评估时间、数据覆盖范围和质量状态。",
        "需要明确风险结果是实时快照、定时计算结果还是历史版本，建议返回 evaluatedAt 和 modelVersion。",
    )
    add_interface(
        doc,
        "7.3 触发风险评估",
        "新增，可后续启用",
        "POST",
        "/api/tube-network/risk/evaluate",
        "按管线、分区或条件触发一次风险重算。",
        "regionId、segmentIds、startTime、endTime、modelVersion、forceRefresh。",
        "taskId、status、submittedAt、estimatedCompletedAt；完成后可通过任务查询或 7.1 获取结果。",
        "如果评估耗时较短可同步返回结果；如果使用模型计算，建议异步任务化，避免阻塞地图请求。",
    )

    add_heading(doc, "8. 噪声关联分析与问题管段定位接口", level=1)
    add_text(doc, "现有前端已经调用 /api/leak-locate/analyze，并提交两个音频 ID、A/B 距离、管材、管径、壁厚、土壤类型和埋深。当前返回的漏点距离和位置标识可以支撑直线示意，但不足以支撑任意弯曲管线的地图定位。")
    add_interface(
        doc,
        "8.1 附近设备与信号处理结果",
        "复用并扩展现有接口",
        "GET",
        "/api/device-query/nearby-analysis/{deviceNumber}",
        "查询基准设备附近的关联设备和算法可分析结果。",
        "路径参数 deviceNumber；query radiusKm、startTime、endTime、status。",
        "每项包含 deviceId、deviceNumber、distanceKm、segmentId、signalprocessingResults；每个信号结果建议包含 resultId、algorithmName、algorithmVersion、status、audioId、estimatedDistanceM、positionFlag、confidence、createdAt、rawResult。",
        "signalprocessingResult1/2/3 可保留原始文本，但应增加结构化结果对象，方便报警和地图消费。",
    )
    add_interface(
        doc,
        "8.2 双设备漏点定位",
        "复用并扩展现有接口",
        "POST",
        "/api/leak-locate/analyze",
        "调用算法完成双设备声学关联定位，并将结果映射到管线段。",
        "audioId1、audioId2、deviceId1、deviceId2、segmentId、distanceAB、pipeMaterial、diameterMm、wallThicknessMm、soilType、buriedDepthM。",
        "analysisId、audioId1、audioId2、deviceId1、deviceId2、segmentId、pointA、pointB、distanceAB、leakDistanceA、leakDistanceB、positionFlag、leakPoint、alongPipeDistanceM、uncertaintyM、confidence、amplitudeA、amplitudeB、totalAlpha、algorithmVersion、analyzedAt、expiresAt。",
        "推荐至少返回 leakPoint 坐标；如果算法不能返回坐标，必须返回 segmentId、管线有序坐标和沿线累计距离 alongPipeDistanceM。否则前端无法把结果落到弯曲管线上。",
    )
    add_interface(
        doc,
        "8.3 定位结果查询",
        "新增，建议路径",
        "GET",
        "/api/leak-locate/{analysisId}",
        "查询已保存的定位分析结果，供地图、报警详情和历史记录复用。",
        "路径参数 analysisId。",
        "完整请求参数、算法结果、管线段、设备 A/B、音频关联、地图定位结果、误差和置信度。",
        "定位分析建议持久化 analysisId，避免只在页面内保存一次性计算结果。",
    )

    add_heading(doc, "9. 数据接收与解析接口", level=1)
    add_text(doc, "现有协议管理和解析页面可以继续使用已有 CRUD 接口。本轮重点是确保解析结果能够转换成地图、报警和风险评估可使用的标准化数据。")
    add_table(doc, ["现有接口资源", "用途", "本轮字段要求"], [
        ("/api/protocol-definition", "协议定义", "协议编码、名称、版本、优先级、启用状态"),
        ("/api/device-protocol-relation", "设备协议绑定", "deviceId/deviceNumber、protocolId、AFN、任务类型、启用状态"),
        ("/api/protocol-field-definition", "协议字段定义", "字段名、中文名、数据类型、单位、缩放系数、枚举映射、有效值、业务语义编码"),
        ("/api/protocol-parse-record", "解析记录", "设备、协议、事件时间、接收时间、解析状态、错误信息、原始报文引用、标准化值"),
        ("/api/protocol-parse-record/parsed-json/page", "解析 JSON", "保留 rawPayloadId、parsedJson、字段质量和解析版本"),
        ("/api/sampling-record、/api/sampling-detail", "采样及渗漏指标", "采样时间、压力、噪声、ESA、强度、频率、渗漏状态、设备和管线段"),
        ("/api/sampling-pressure", "压力数据", "压力文件引用、采样时间、设备、管线段、单位和数据质量"),
        ("/api/algorithm-result", "算法结果", "采样/音频/设备/管线追溯，以及结构化定位结果"),
    ], [3000, 2400, 3960], font_size=9.1)

    add_interface(
        doc,
        "9.1 统一监测数据查询",
        "新增，建议路径",
        "POST",
        "/api/data-query/monitoring/page",
        "为地图、报警和风险评估提供统一的标准化监测数据查询。",
        "pageNum、pageSize、deviceIds、deviceNumber、segmentId、metricTypes、startTime、endTime、quality、sortField、sortOrder。",
        "records、total；每条包含 recordId、deviceId、deviceNumber、segmentId、eventTime、receivedAt、metricType、metricValue、unit、dataQuality、sourceType、samplingId、parseRecordId、algorithmResultId。",
        "metricType 建议使用 PRESSURE、NOISE、FLOW、LEAK_ESA、LEAK_INTENSITY、LEAK_FREQUENCY、BATTERY_VOLTAGE 等稳定编码。",
    )
    add_interface(
        doc,
        "9.2 解析链路追溯",
        "新增，建议路径",
        "GET",
        "/api/data-query/trace/{recordId}",
        "从标准化监测数据追溯到解析记录、原始报文、采样、音频和算法结果。",
        "路径参数 recordId。",
        "monitoringRecord、parseRecord、rawPayload、samplingRecord、audioRecords、algorithmResults、alarmRecords。",
        "该接口主要用于后端联调、报警详情和问题排查，不建议将所有原始大字段放入地图列表。",
    )

    add_heading(doc, "10. 系统设置、字典与权限接口", level=1)
    add_text(doc, "现有系统设置页面已覆盖用户、角色、权限、菜单和字典。为支持地图、风险和报警，建议新增以下配置资源；如果后端已有统一配置中心，也可映射到现有配置接口。")
    add_interface(
        doc,
        "10.1 地图配置",
        "新增，建议路径",
        "GET / PUT",
        "/api/system/map-config",
        "维护地图默认中心、缩放、坐标系、图层开关和刷新周期。",
        "GET 无请求体；PUT 提交 defaultCenter、defaultZoom、coordinateSystem、pollingIntervalSec、layerVisibility、minZoom/maxZoom。",
        "返回 configId、defaultCenter、defaultZoom、coordinateSystem、pollingIntervalSec、layerVisibility、updatedAt、updatedBy。",
        "地图配置应按项目或租户隔离；不要把地图 Key、密钥等敏感信息通过普通接口返回给前端。",
    )
    add_interface(
        doc,
        "10.2 风险配置",
        "新增，建议路径",
        "GET / PUT",
        "/api/system/risk-config",
        "维护风险等级、评分区间、颜色、图例、计算口径和模型版本。",
        "GET 无请求体；PUT 提交 levels、scoreRanges、colors、legend、defaultModelVersion、enabledFactors。",
        "返回 configId、levels、scoreRanges、colors、legend、modelVersions、updatedAt、updatedBy。",
        "风险颜色应由后端配置统一下发，风险结果仍需返回实际 riskLevel 和 riskScore。",
    )
    add_interface(
        doc,
        "10.3 报警配置",
        "新增，建议路径",
        "GET / PUT",
        "/api/system/alarm-config",
        "维护报警类型、等级、阈值、统计口径和离线判定规则。",
        "GET 无请求体；PUT 提交 alarmTypes、levels、thresholds、offlineTimeoutSec、aggregationWindowSec。",
        "返回配置版本、报警类型、等级、阈值、离线规则、updatedAt、updatedBy。",
        "静态阈值和动态阈值需要区分，并返回单位和适用指标。",
    )
    add_table(doc, ["权限编码建议", "用途"], [
        ("page:leak-monitor", "进入渗漏监测一张图"),
        ("data:pipe:read", "读取 GIS 管线和风险图层"),
        ("data:device:monitoring", "读取设备实时监测数据"),
        ("data:alarm:read", "读取报警分布、趋势和明细"),
        ("data:alarm:operate", "确认、忽略、转工单"),
        ("data:algorithm:analyze", "调用噪声关联定位算法"),
        ("config:map:manage", "维护地图配置"),
        ("config:risk:manage", "维护风险配置"),
        ("config:alarm:manage", "维护报警配置"),
    ], [3000, 6360], font_size=9.5)

    add_heading(doc, "11. 关键数据结构建议", level=1)
    add_heading(doc, "11.1 GeoJSON 管线 Feature 示例", level=2)
    add_text(doc, '{\n  "type": "FeatureCollection",\n  "coordinateSystem": "WGS84",\n  "features": [{\n    "type": "Feature",\n    "id": "SEG-001",\n    "geometry": {"type": "LineString", "coordinates": [[120.10, 30.20], [120.11, 30.21]]},\n    "properties": {\n      "segmentId": "SEG-001", "tubeName": "再生水干线", "lengthM": 860.5,\n      "material": "DUCTILE_IRON", "constructionYear": 2018, "ageYears": 8,\n      "diameterMm": 300, "deptId": 12, "deviceIds": ["D001", "D002"],\n      "riskScore": 72.5, "riskLevel": "HIGH", "displayColor": "#F97316"\n    }\n  }]\n}', color=INK, size=9.2, after=8)

    add_heading(doc, "11.2 统一错误与数据质量示例", level=2)
    add_text(doc, '{\n  "code": 0,\n  "msg": "success",\n  "timestamp": "2026-09-03T10:00:00+08:00",\n  "data": {"records": [], "total": 0},\n  "requestId": "req-20260903-0001"\n}\n\n数据缺失时使用 dataQuality: "MISSING"；设备数据过期时使用 "STALE"；算法失败时返回 status: "FAILED" 和 errorMessage。', color=INK, size=9.2, after=8)

    add_heading(doc, "12. 联调与验收清单", level=1)
    for item in [
        "管线接口能返回任意弯曲管线的有序 LineString 坐标，并明确坐标系。",
        "设备点位能够关联到设备和管线段，展示位置、在线状态、最新采样时间和实时指标。",
        "近 7 日报警趋势、报警总数、报警分布和报警明细的统计口径一致。",
        "历史趋势至少支持 1 年，并支持日、周、月粒度。",
        "风险结果按管线段返回评分、等级、因素、颜色、模型版本和评估时间。",
        "材质、管龄、管径筛选能够影响风险结果或风险查询条件。",
        "噪声关联结果能定位到 A/B 设备之间的具体管线段，或返回可绘制的疑似漏点坐标。",
        "OUTSIDE_A、OUTSIDE_B、BETWEEN_AB、UNKNOWN 四类位置结果均有明确含义。",
        "解析数据能够追溯到原始报文、采样、音频、算法结果和报警记录。",
        "接口对无坐标、离线、过期、无数据和算法失败情况返回明确状态。",
        "权限不足时接口返回统一无权限错误；配置接口记录操作人和更新时间。",
    ]:
        add_bullet(doc, item)

    add_heading(doc, "13. 后端提交物", level=1)
    for item in [
        "接口文档：方法、路径、请求参数、响应字段、字段类型、单位、枚举和错误码。",
        "数据字典：材质、风险等级、报警类型、报警等级、设备状态、数据质量和坐标系。",
        "接口样例：至少提供 1 组真实或脱敏的管线、设备、报警、风险和算法定位数据。",
        "联调环境：可访问的 API 地址、认证方式、测试账号或 Token、测试数据范围。",
        "数据关联说明：deviceId、segmentId、samplingId、audioId、algorithmResultId、alarmId 的关联关系。",
        "历史数据说明：报警趋势和风险评估可回溯的时间范围、数据覆盖率和缺失规则。",
    ]:
        add_number(doc, item)

    add_callout(
        doc,
        "优先确认的 5 个问题",
        "1）管线坐标的来源和坐标系；2）管线段唯一 ID 及设备挂接规则；3）报警表和报警类型枚举；4）风险模型输出格式与颜色配置；5）算法能否返回沿管线距离或疑似漏点坐标。",
        fill="FFF8E8",
        accent=GOLD,
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUT)
    print(OUT)


if __name__ == "__main__":
    build_doc()
