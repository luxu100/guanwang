/**
 * 报警记录接口类型声明。
 * 枚举为数字编码（与页面胶囊一致）；导出/忽略/批量确认/转工单等函数签名一并保留。
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

/** 报警类型（协议四类）。 */
export type AlarmType = 1 | 2 | 3 | 4;
/** 报警级别。 */
export type AlarmLevel = 1 | 2 | 3;
/** 报警状态（状态机：未处理→已确认/已忽略/已转工单→已恢复）。 */
export type AlarmStatus = 0 | 1 | 2 | 3 | 4;

/** 报警记录分页查询入参（时间按 alarmTime 过滤）。 */
export interface AlarmPageQuery {
  pageNum?: number;
  pageSize?: number;
  /** 报警编号（模糊） */
  alarmNo?: string;
  ruleType?: AlarmType;
  alarmLevel?: AlarmLevel;
  status?: AlarmStatus;
  deviceNumber?: string;
  deptId?: number;
  startTime?: string;
  endTime?: string;
}

/** 确认/忽略报警入参。 */
export interface AlarmHandlePayload {
  handleRemark?: string;
}

/** 报警转工单入参（对齐 Worksheet 字段）。 */
export interface AlarmDispatchPayload {
  worksheetType?: number;
  executeAccount?: string;
  urgencyLevel?: number;
  deadlineTime?: string;
  worksheetInstruction?: string;
  remark?: string;
}

/** 报警记录。 */
export interface AlarmRecord {
  id?: number;
  /** 报警编号（如 AL202609080001） */
  alarmNo?: string;
  ruleId?: number;
  ruleName?: string;
  /** 报警类型：1-压力异常 2-渗漏 3-爆管 4-设备离线 */
  ruleType?: AlarmType;
  alarmLevel?: AlarmLevel;
  deviceId?: number;
  deviceNumber?: string;
  deviceAlias?: string;
  deptId?: number;
  status?: AlarmStatus;
  /** 触发时实测值 */
  triggerValue?: number | string;
  /** 命中阈值快照 */
  thresholdSnapshot?: string;
  triggerCount?: number;
  alarmTime?: string;
  recoverTime?: string;
  handler?: string;
  handleTime?: string;
  handleRemark?: string;
  /** 关联工单编号（转工单后回写） */
  worksheetNo?: string;
  worksheetId?: number;
  createdAt?: string;
}

/** 当前活跃报警列表项（轮询比对基准：alarmTime）。 */
export interface AlarmMapItem {
  alarmRecordId?: number;
  deviceNumber?: string;
  deviceAlias?: string;
  longitude?: number | string;
  latitude?: number | string;
  ruleType?: AlarmType;
  alarmLevel?: AlarmLevel;
  alarmTime?: string;
  triggerValue?: number | string;
}

export function getAlarmPage(data: AlarmPageQuery): Promise<ApiResponse<PageInfo<AlarmRecord>>>;
export function getAlarmDetail(id: number | string): Promise<ApiResponse<AlarmRecord>>;
export function deleteAlarm(id: number | string, isForce?: boolean): Promise<ApiResponse>;
export function confirmAlarm(id: number | string, data?: AlarmHandlePayload): Promise<ApiResponse>;
export function ignoreAlarm(id: number | string, data?: AlarmHandlePayload): Promise<ApiResponse>;
export function batchConfirmAlarms(ids: Array<number | string>): Promise<ApiResponse>;
export function dispatchAlarm(id: number | string, data: AlarmDispatchPayload): Promise<ApiResponse>;
export function getUnreadAlarmCount(): Promise<ApiResponse<number>>;
export function getLatestAlarms(since: string): Promise<ApiResponse<AlarmRecord[]>>;
export function getLatestActiveAlarms(limit?: number): Promise<ApiResponse<AlarmMapItem[]>>;
export function exportAlarms(query?: AlarmPageQuery): Promise<ApiResponse<{ filename: string; filePath?: string }>>;

declare const service: {
  getAlarmPage: typeof getAlarmPage;
  getAlarmDetail: typeof getAlarmDetail;
  deleteAlarm: typeof deleteAlarm;
  confirmAlarm: typeof confirmAlarm;
  ignoreAlarm: typeof ignoreAlarm;
  batchConfirmAlarms: typeof batchConfirmAlarms;
  dispatchAlarm: typeof dispatchAlarm;
  getUnreadAlarmCount: typeof getUnreadAlarmCount;
  getLatestAlarms: typeof getLatestAlarms;
  getLatestActiveAlarms: typeof getLatestActiveAlarms;
  exportAlarms: typeof exportAlarms;
};

export default service;
