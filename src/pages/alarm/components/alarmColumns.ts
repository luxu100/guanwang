/**
 * alarmColumns.ts — 报警模块表格与详情字段配置（标准版/localized 版共用一份）
 *
 * 参照 data-analysis 的 dataAnalysisColumns.ts 先例：字段的内容和数量按需求增删改时只动本文件，
 * 视图层仅按 renderType 分支渲染；grid 列宽从 width 拼接（参照 leak-report 列配置拼接先例）。
 *
 * 约定：
 *  - label/labelEn 为该字段的中英文显示名，localized 视图用 localeText(label, labelEn) 取值；
 *  - 枚举类文案（规则类型、生效范围等）的业务格式化器仍注册在各视图内（textFormatters /
 *    detailFormatters，按 formatKey 关联），因为localized 变体的枚举文案需要走 localeText；
 *  - 新增普通文本列：在本文件加一条 { key, label, labelEn, renderType: "text", width } 即可，
 *    视图零改动；新增枚举/计算列需同时在视图 textFormatters 里注册同名 formatKey。
 */

export interface AlarmTableColumn {
  /** 数据字段名（index/action 为虚拟列，不取数据） */
  key: string;
  /** 中文列名 */
  label: string;
  /** 英文列名（localized 变体使用） */
  labelEn: string;
  /**
   * 单元格渲染方式：
   *  index        序号（按页码与行号计算）
   *  text         文本（可配 formatKey 走视图格式化器，缺省输出 item[key]，null/undefined/空串显示 "-"）
   *  level-pill   报警级别胶囊（INFO/WARNING/CRITICAL）
   *  status-pill  报警状态胶囊（ACTIVE/CONFIRMED/RESOLVED）
   *  action       操作列（行内按钮）
   */
  renderType: "index" | "text" | "level-pill" | "status-pill" | "action";
  /** 该列在 grid-template-columns 中的宽度定义 */
  width: string;
  /** 单元格附加 class（如 col-index） */
  className?: string;
  /** 视图内 textFormatters 的注册名；缺省直接取原始字段值 */
  formatKey?: string;
}

export interface AlarmDetailField {
  /** 数据字段名 */
  key: string;
  /** 中文标签 */
  label: string;
  /** 英文标签 */
  labelEn: string;
  /** 渲染方式：缺省 text 文本；level-pill / status-pill 渲染为胶囊 */
  renderType?: "text" | "level-pill" | "status-pill";
  /** 视图内 detailFormatters 的注册名；缺省直接取原始字段值 */
  formatKey?: string;
  /** 占整行（detail-item--full） */
  full?: boolean;
}

/* ========================= 报警处理页 ========================= */

/** 复选框列为固定交互列，不进配置；宽度单独导出供 grid 拼接。批量确认暂缓（后端 P0-3 未补齐）时列宽不含此列 */
export const PROCESSING_CHECKBOX_WIDTH = "44px";

export const processingColumns: AlarmTableColumn[] = [
  { key: "index", label: "序号", labelEn: "No.", renderType: "index", width: "54px", className: "col-index" },
  { key: "ruleName", label: "命中规则", labelEn: "Rule", renderType: "text", width: "minmax(120px, 1.1fr)" },
  { key: "alarmType", label: "报警类型", labelEn: "Alarm Type", renderType: "text", formatKey: "alarmType", width: "minmax(96px, 1fr)" },
  { key: "alarmLevel", label: "报警级别", labelEn: "Alarm Level", renderType: "level-pill", width: "minmax(72px, 0.8fr)" },
  { key: "deviceNumber", label: "设备编号", labelEn: "Device No.", renderType: "text", width: "minmax(96px, 0.9fr)" },
  { key: "triggerValue", label: "触发值", labelEn: "Trigger Value", renderType: "text", width: "minmax(88px, 0.9fr)" },
  { key: "triggerCount", label: "触发次数", labelEn: "Trigger Count", renderType: "text", width: "minmax(72px, 0.7fr)" },
  { key: "lastTriggeredAt", label: "最后触发", labelEn: "Last Triggered", renderType: "text", formatKey: "lastTriggeredAt", width: "minmax(140px, 1.3fr)", className: "col-alarm-time" },
  { key: "status", label: "状态", labelEn: "Status", renderType: "status-pill", width: "minmax(80px, 0.8fr)" },
  { key: "action", label: "操作", labelEn: "Actions", renderType: "action", width: "minmax(250px, 1.1fr)" },
];

/** 处理页表格 grid 列宽（不含复选框列——后端无 batch-confirm，批量确认未提供） */
export const processingGridColumnsNoCheck = processingColumns.map((column) => column.width).join(" ");

/** 兼容导出：历史名称，现等同于不含复选框列的宽度 */
export const processingGridColumns = processingGridColumnsNoCheck;

export const processingDetailFields: AlarmDetailField[] = [
  { key: "ruleName", label: "命中规则", labelEn: "Matched Rule" },
  { key: "ruleKind", label: "规则类型", labelEn: "Rule Type" },
  { key: "alarmType", label: "报警类型", labelEn: "Alarm Type", formatKey: "alarmType" },
  { key: "alarmLevel", label: "报警级别", labelEn: "Alarm Level", renderType: "level-pill" },
  { key: "status", label: "状态", labelEn: "Status", renderType: "status-pill" },
  { key: "deviceNumber", label: "设备编号", labelEn: "Device No." },
  { key: "deviceAlias", label: "设备别名", labelEn: "Device Alias" },
  { key: "fieldName", label: "自定义字段", labelEn: "Field" },
  { key: "triggerValue", label: "触发值", labelEn: "Trigger Value" },
  { key: "triggerCount", label: "触发次数", labelEn: "Trigger Count" },
  { key: "firstTriggeredAt", label: "首次触发", labelEn: "First Triggered", formatKey: "firstTriggeredAt" },
  { key: "lastTriggeredAt", label: "最后触发", labelEn: "Last Triggered", formatKey: "lastTriggeredAt" },
  { key: "recoveredAt", label: "恢复时间", labelEn: "Recovery Time", formatKey: "recoveredAt" },
  { key: "handleRemark", label: "处理备注", labelEn: "Handling Notes", full: true },
];

/* ========================= 报警策略页 ========================= */

export const strategyColumns: AlarmTableColumn[] = [
  { key: "index", label: "序号", labelEn: "No.", renderType: "index", width: "54px", className: "col-index" },
  { key: "ruleName", label: "规则名称", labelEn: "Rule Name", renderType: "text", width: "minmax(140px, 1.4fr)", className: "col-rule-name" },
  { key: "ruleKind", label: "规则类型", labelEn: "Rule Type", renderType: "text", formatKey: "ruleKind", width: "minmax(80px, 0.8fr)" },
  { key: "alarmType", label: "报警类型", labelEn: "Alarm Type", renderType: "text", formatKey: "alarmType", width: "minmax(96px, 1fr)" },
  { key: "alarmLevel", label: "报警级别", labelEn: "Alarm Level", renderType: "level-pill", width: "minmax(72px, 0.8fr)" },
  { key: "thresholdDesc", label: "判定条件", labelEn: "Condition", renderType: "text", formatKey: "thresholdDesc", width: "minmax(140px, 1.3fr)" },
  { key: "scopeDesc", label: "生效范围", labelEn: "Scope", renderType: "text", formatKey: "scope", width: "minmax(88px, 0.9fr)" },
  { key: "enabled", label: "状态", labelEn: "Status", renderType: "text", formatKey: "enabledText", width: "minmax(68px, 0.7fr)" },
  { key: "notifyEnabled", label: "邮件通知", labelEn: "Email Notify", renderType: "text", formatKey: "notifyText", width: "minmax(72px, 0.75fr)" },
  { key: "action", label: "操作", labelEn: "Actions", renderType: "action", width: "minmax(200px, 1fr)" },
];

/** 策略页表格 grid 列宽 */
export const strategyGridColumns = strategyColumns.map((column) => column.width).join(" ");
