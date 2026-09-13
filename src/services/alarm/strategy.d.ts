/**
 * 报警规则接口类型声明（2026-09-09 对齐后端实况）。
 * ruleKind=FIXED/CUSTOM；alarmType=OFFLINE/NO_DATA/LEAK_SUSPECT/CUSTOM；
 * 级别 INFO/WARNING/CRITICAL；无静态/动态阈值与静默期字段。
 */

export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export interface PageInfo<T = unknown> {
  records?: T[];
  total?: number;
  size?: number;
  current?: number;
}

/** 规则类型：FIXED 系统预置 / CUSTOM 用户自定义。 */
export type RuleKind = "FIXED" | "CUSTOM";
/** 报警类型（后端字符串枚举）。 */
export type AlarmType = "OFFLINE" | "NO_DATA" | "LEAK_SUSPECT" | "CUSTOM";
/** 报警级别。 */
export type AlarmLevel = "INFO" | "WARNING" | "CRITICAL";

/** 报警规则分页查询入参（对齐 AlarmRulePageDTO + BasePageDTO）。 */
export interface AlarmRulePageQuery {
  pageNum?: number;
  pageSize?: number;
  startTime?: string;
  endTime?: string;
  sortOrder?: string;
  sortField?: string;
  /** 规则名称（模糊） */
  ruleName?: string;
  ruleKind?: RuleKind;
  alarmType?: AlarmType;
  enabled?: boolean;
}

/** 可选字段下拉项（对齐 AlarmFieldOptionVO）。 */
export interface AlarmFieldOption {
  /** 字段英文名（写入规则的 fieldName） */
  fieldName?: string;
  /** 字段中文名 */
  fieldCnName?: string;
  /** 单位 */
  unit?: string;
  /** 字段描述 */
  description?: string;
}

/** 报警规则实体（对齐 AlarmRuleVO）。 */
export interface AlarmRule {
  id?: number;
  ruleName?: string;
  /** FIXED / CUSTOM */
  ruleKind?: RuleKind;
  alarmType?: AlarmType;
  /** 报警类型中文名（后端 VO 附带） */
  alarmTypeName?: string;
  /** 自定义字段名（CUSTOM 专用） */
  fieldName?: string | null;
  /** 区间下限（可空） */
  minValue?: number | string | null;
  /** 区间上限（可空） */
  maxValue?: number | string | null;
  /** 渗漏疑似触发值集合（如 "2,0"，FIXED-LEAK_SUSPECT 专用） */
  triggerValue?: string | null;
  /** 离线判定分钟数（FIXED-OFFLINE 专用） */
  thresholdMinutes?: number | null;
  /** 超时判定小时数（FIXED-NO_DATA 专用） */
  thresholdHours?: number | null;
  alarmLevel?: AlarmLevel;
  /** 报警级别中文名（后端 VO 附带） */
  alarmLevelName?: string;
  /** 作用范围部门ID */
  deptId?: number | null;
  notifyEnabled?: boolean;
  enabled?: boolean;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** 新建/修改规则入参（对齐 AlarmRuleCreateDTO；新建固定写入 CUSTOM，FIXED 编辑仅提交可改项）。 */
export interface AlarmRulePayload {
  ruleName?: string;
  ruleKind?: RuleKind;
  alarmType?: AlarmType;
  fieldName?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
  /** FIXED-OFFLINE：离线判定分钟数 */
  thresholdMinutes?: number | null;
  /** FIXED-NO_DATA：超时判定小时数 */
  thresholdHours?: number | null;
  /** FIXED-LEAK_SUSPECT：渗漏触发值集合（如 "2,0"） */
  triggerValue?: string | null;
  alarmLevel?: AlarmLevel;
  deptId?: number | null;
  notifyEnabled?: boolean;
  enabled?: boolean;
  remark?: string;
}

export function getRulePage(data: AlarmRulePageQuery): Promise<ApiResponse<PageInfo<AlarmRule>>>;
export function createRule(data: AlarmRulePayload): Promise<ApiResponse<AlarmRule>>;
export function updateRule(id: number | string, data: AlarmRulePayload): Promise<ApiResponse<AlarmRule>>;
export function deleteRule(id: number | string): Promise<ApiResponse>;
export function toggleRule(id: number | string): Promise<ApiResponse>;
export function getRuleFields(): Promise<ApiResponse<AlarmFieldOption[]>>;

declare const service: {
  getRulePage: typeof getRulePage;
  createRule: typeof createRule;
  updateRule: typeof updateRule;
  deleteRule: typeof deleteRule;
  toggleRule: typeof toggleRule;
  getRuleFields: typeof getRuleFields;
};

export default service;
