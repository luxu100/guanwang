/**
 * 表格列配置类型定义
 *
 * 用于驱动表格列的动态渲染，替代硬编码的列头和数据行。
 * 后端加字段时只需更新配置数组，无需改模板代码。
 */

/** 单元格渲染类型 */
export type CellRenderType =
  | "text" // 普通文本
  | "index" // 序号
  | "checkbox" // 复选框
  | "dateTime" // 日期时间格式化
  | "statusTag" // 状态标签（带颜色背景）
  | "levelPill" // 状态胶囊（漏点等级）
  | "audio" // 音频播放按钮
  | "video" // 视频播放按钮
  | "link" // 链接跳转
  | "algorithmName" // 算法名称翻译
  | "title"; // 带 title 提示的文本（hover 显示完整内容）

/** 列定义 */
export interface ColumnDef {
  /** 字段名（后端返回的字段 key，或前端伪 key 如 _index/_select） */
  key: string;
  /** i18n 翻译 key（如 "table.detectTime"） */
  labelKey: string;
  /** 导出 CSV 表头的 i18n 翻译 key（不传则使用 labelKey） */
  exportLabelKey?: string;
  /** 渲染类型 */
  renderType: CellRenderType;
  /** 中文列宽（如 "minmax(140px, 1.5fr)"） */
  widthZh: string;
  /** 英文列宽 */
  widthEn: string;
  /** CSS class（保留原有样式，如 "data-cell--index"） */
  cellClass?: string;
  /** 是否可排序 */
  sortable?: boolean;
  /** 是否参与导出（默认 true） */
  exportable?: boolean;
  /** 状态渲染的子类型（用于 statusTag/levelPill 区分 leakage/deviceUpload/algorithm） */
  statusVariant?: "leakage" | "deviceUpload" | "algorithm";
  /** 链接跳转的处理函数标识 */
  linkHandler?: "workOrder";
  /** 单位（后端字段定义） */
  unit?: string;
  /** 排序优先级（后端字段定义） */
  sortOrder?: number;
}
