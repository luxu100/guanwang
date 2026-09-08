/**
 * 报警规则接口类型声明（2026-09-08 回切完整模型）。
 * 规则类型：协议四类（压力/渗漏/爆管/离线）；静态/动态阈值；含静默期。
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

/** 报警类型（协议四类，数字枚举）。 */
export type RuleAlarmType = 1 | 2 | 3 | 4;
/** 报警级别。 */
export type AlarmLevel = 1 | 2 | 3;
/** 阈值模式：0-静态 1-动态 */
export type ThresholdType = 0 | 1;
/** 生效范围：0-全局 1-部门 2-指定设备 */
export type ScopeType = 0 | 1 | 2;

/** 报警规则分页查询入参。 */
export interface AlarmRulePageQuery {
  pageNum?: number;
  pageSize?: number;
  startTime?: string;
  endTime?: string;
  sortOrder?: string;
  sortField?: string;
  /** 规则名称（模糊） */
  ruleName?: string;
  ruleType?: number;
  alarmLevel?: number;
  enabled?: boolean | number;
  scopeType?: number;
  deptId?: number;
  deviceNumber?: string;
}

/** 报警规则实体。 */
export interface AlarmRule {
  id?: number;
  ruleName?: string;
  /** 报警类型：1-压力异常 2-渗漏 3-爆管 4-设备离线 */
  ruleType?: number;
  /** 报警级别：1-提示 2-警告 3-严重 */
  alarmLevel?: number;
  /** 阈值模式：0-静态 1-动态 */
  thresholdType?: number;
  thresholdUpper?: number | string | null;
  thresholdLower?: number | string | null;
  /** 动态阈值：统计窗口长度（分钟） */
  windowMinutes?: number | null;
  /** 动态阈值：均值±Nσ 的 N */
  sigmaTimes?: number | null;
  /** 离线判定分钟数（设备离线类专用） */
  offlineMinutes?: number | null;
  /** 持续时长（秒），超限持续该时长才报警 */
  durationSeconds?: number;
  /** 静默期（秒），同一设备同一规则静默期内重复触发不重复报警 */
  silenceSeconds?: number;
  /** 生效时间段（如 "22:00-06:00"，空为全天） */
  effectivePeriod?: string;
  /** 生效范围：0-全局 1-部门 2-指定设备 */
  scopeType?: number;
  deptId?: number | null;
  deviceIds?: number[] | string | null;
  enabled?: boolean;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** 新建/更新规则的入参。 */
export interface AlarmRulePayload extends AlarmRule {}

export function getRulePage(data: AlarmRulePageQuery): Promise<ApiResponse<PageInfo<AlarmRule>>>;
export function getRuleList(params?: Record<string, unknown>): Promise<ApiResponse<AlarmRule[]>>;
export function getRuleDetail(id: number | string): Promise<ApiResponse<AlarmRule>>;
export function createRule(data: AlarmRulePayload): Promise<ApiResponse<AlarmRule>>;
export function updateRule(id: number | string, data: AlarmRulePayload): Promise<ApiResponse<AlarmRule>>;
export function deleteRule(id: number | string, isForce?: boolean): Promise<ApiResponse>;

declare const service: {
  getRulePage: typeof getRulePage;
  getRuleList: typeof getRuleList;
  getRuleDetail: typeof getRuleDetail;
  createRule: typeof createRule;
  updateRule: typeof updateRule;
  deleteRule: typeof deleteRule;
};

export default service;
