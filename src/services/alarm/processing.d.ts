/**
 * 报警记录接口类型声明（2026-09-09 对齐后端实况）。
 * 枚举为字符串编码：alarmType=OFFLINE/NO_DATA/LEAK_SUSPECT/CUSTOM、
 * alarmLevel=INFO/WARNING/CRITICAL、status=ACTIVE/CONFIRMED/RESOLVED（三态）。
 * 后端暂缺 ignore/batch-confirm/dispatch/export/unread-count/latest?since。
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

/** 报警类型（后端字符串枚举）。 */
export type AlarmType = "OFFLINE" | "NO_DATA" | "LEAK_SUSPECT" | "CUSTOM";
/** 报警级别。 */
export type AlarmLevel = "INFO" | "WARNING" | "CRITICAL";
/** 报警状态（三态状态机：ACTIVE→CONFIRMED→RESOLVED；自动恢复 ACTIVE→RESOLVED）。 */
export type AlarmStatus = "ACTIVE" | "CONFIRMED" | "RESOLVED";

/** 报警记录分页查询入参（对齐 AlarmRecordPageDTO + BasePageDTO；时间按 firstTriggeredAt）。 */
export interface AlarmPageQuery {
  pageNum?: number;
  pageSize?: number;
  startTime?: string;
  endTime?: string;
  sortOrder?: string;
  sortField?: string;
  deviceId?: number;
  /** 设备编号（后端 eq 精确匹配） */
  deviceNumber?: string;
  alarmType?: AlarmType;
  alarmLevel?: AlarmLevel;
  status?: AlarmStatus;
  deptId?: number;
}

/** 确认/关闭报警入参（对齐 AlarmHandleDTO）。 */
export interface AlarmHandlePayload {
  handleRemark?: string;
}

/** 报警记录（对齐 AlarmRecordVO）。 */
export interface AlarmRecord {
  id?: number;
  ruleId?: number;
  ruleName?: string;
  /** FIXED / CUSTOM */
  ruleKind?: string;
  alarmType?: AlarmType;
  /** 报警类型中文名（后端 VO 附带） */
  alarmTypeName?: string;
  /** 自定义字段名（CUSTOM 记录有值） */
  fieldName?: string | null;
  alarmLevel?: AlarmLevel;
  /** 报警级别中文名（后端 VO 附带） */
  alarmLevelName?: string;
  deviceId?: number;
  deviceNumber?: string;
  deviceAlias?: string;
  deptId?: number;
  status?: AlarmStatus;
  /** 状态中文名（后端 VO 附带） */
  statusName?: string;
  /** 触发时实测值 */
  triggerValue?: number | string;
  /** 累计触发次数 */
  triggerCount?: number;
  /** 首次触发时间（分页排序与时间过滤依据） */
  firstTriggeredAt?: string;
  /** 最后触发时间 */
  lastTriggeredAt?: string;
  /** 恢复时间（resolve 后写入） */
  recoveredAt?: string;
  /** 触发上下文快照 JSON */
  contextJson?: string;
  handleUserId?: number;
  handleRemark?: string;
  createdAt?: string;
}

/** 当前活跃报警列表项（对齐 AlarmMapItemVO；铃铛轮询比对基准 firstTriggeredAt）。 */
export interface AlarmMapItem {
  alarmRecordId?: number;
  deviceNumber?: string;
  deviceAlias?: string;
  longitude?: number | null;
  latitude?: number | null;
  alarmType?: AlarmType;
  alarmTypeName?: string;
  alarmLevel?: AlarmLevel;
  firstTriggeredAt?: string;
  triggerValue?: number | string;
}

export function getAlarmPage(data: AlarmPageQuery): Promise<ApiResponse<PageInfo<AlarmRecord>>>;
export function getAlarmDetail(id: number | string): Promise<ApiResponse<AlarmRecord>>;
export function confirmAlarm(id: number | string, data?: AlarmHandlePayload): Promise<ApiResponse>;
export function resolveAlarm(id: number | string, data?: AlarmHandlePayload): Promise<ApiResponse>;
export function getLatestActiveAlarms(limit?: number): Promise<ApiResponse<AlarmMapItem[]>>;
export function getAlarmTrend(data?: Record<string, unknown>): Promise<ApiResponse<unknown>>;
export function getAlarmOverview(data?: Record<string, unknown>): Promise<ApiResponse<unknown>>;
export function getAlarmMap(data?: Record<string, unknown>): Promise<ApiResponse<unknown>>;

declare const service: {
  getAlarmPage: typeof getAlarmPage;
  getAlarmDetail: typeof getAlarmDetail;
  confirmAlarm: typeof confirmAlarm;
  resolveAlarm: typeof resolveAlarm;
  getLatestActiveAlarms: typeof getLatestActiveAlarms;
  getAlarmTrend: typeof getAlarmTrend;
  getAlarmOverview: typeof getAlarmOverview;
  getAlarmMap: typeof getAlarmMap;
};

export default service;
