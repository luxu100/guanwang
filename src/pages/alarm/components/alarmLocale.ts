/**
 * alarmLocale.ts — 报警模块公共枚举双语映射（唯一来源）。
 *
 * 抽取背景（2026-09-10）：报警类型/级别/状态/规则类型等枚举此前在策略页与处理页
 * 各自手写 localeText，同一英文术语存在多套表达。按《报警模块中英双语 UI 国际化
 * 规范》抽取为公共映射：术语调整只改本文件，策略页/处理页/alarmColumns 的筛选
 * 下拉、表格胶囊、详情、弹窗全部从这里读取。
 *
 * 规则：
 *  - API value（OFFLINE/ACTIVE 等）保持与后端协议一致，本文件只管展示 label；
 *  - 同一中文业务概念只有一个标准英文（Rule Type / Suspected Leak / Acknowledged
 *    / Closed / Built-in / Recovery Time / Handling Notes / Monitored Field）；
 *  - 未知编码回退顺序：fallbackName（后端附带中文名）→ 原码。
 *
 * localeText 由调用方传入（标准版传纯中文取值器，localized 版传双语取值器）。
 */

type LocaleText = (zh: string, en: string) => string;

/* ==================== 报警类型 alarmType ==================== */

export const ALARM_TYPE_MAP: Record<string, { zh: string; en: string }> = {
  OFFLINE: { zh: "设备离线", en: "Offline" },
  NO_DATA: { zh: "数据超时", en: "No Data" },
  LEAK_SUSPECT: { zh: "渗漏疑似", en: "Suspected Leak" },
  CUSTOM: { zh: "自定义规则", en: "Custom Rule" },
};

export function alarmTypeOptions(t: LocaleText) {
  return [
    { label: t("不限", "All"), value: null as string | null },
    { label: t("设备离线", "Offline"), value: "OFFLINE" },
    { label: t("数据超时", "No Data"), value: "NO_DATA" },
    { label: t("渗漏疑似", "Suspected Leak"), value: "LEAK_SUSPECT" },
    { label: t("自定义规则", "Custom Rule"), value: "CUSTOM" },
  ];
}

/* ==================== 报警级别 alarmLevel ==================== */

export const ALARM_LEVEL_MAP: Record<string, { zh: string; en: string }> = {
  INFO: { zh: "提示", en: "Info" },
  WARNING: { zh: "警告", en: "Warning" },
  CRITICAL: { zh: "严重", en: "Critical" },
};

export function alarmLevelOptions(t: LocaleText) {
  return [
    { label: t("提示", "Info"), value: "INFO" },
    { label: t("警告", "Warning"), value: "WARNING" },
    { label: t("严重", "Critical"), value: "CRITICAL" },
  ];
}

/* ==================== 报警状态 alarmStatus ==================== */

export const ALARM_STATUS_MAP: Record<string, { zh: string; en: string }> = {
  ACTIVE: { zh: "活跃", en: "Active" },
  CONFIRMED: { zh: "已确认", en: "Acknowledged" },
  RESOLVED: { zh: "已关闭", en: "Closed" },
};

export function alarmStatusOptions(t: LocaleText) {
  return [
    { label: t("不限", "All"), value: null as string | null },
    { label: t("活跃", "Active"), value: "ACTIVE" },
    { label: t("已确认", "Acknowledged"), value: "CONFIRMED" },
    { label: t("已关闭", "Closed"), value: "RESOLVED" },
  ];
}

/* ==================== 规则类型 ruleKind ==================== */

export const RULE_KIND_MAP: Record<string, { zh: string; en: string }> = {
  FIXED: { zh: "固定", en: "Built-in" },
  CUSTOM: { zh: "自定义", en: "Custom" },
};

/* ==================== 通用取值函数 ==================== */

/** 按编码取枚举显示文本：中文界面取 zh，英文界面取 en；未知编码回退 fallbackName 或原码。 */
export function mapEnumText(
  map: Record<string, { zh: string; en: string }>,
  value: string | null | undefined,
  t: LocaleText,
  fallbackName?: string | null,
): string {
  if (value == null) return fallbackName || "-";
  const hit = map[value];
  if (hit) return t(hit.zh, hit.en);
  return fallbackName || value;
}
