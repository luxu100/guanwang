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

/** 报警记录分页查询入参（AlarmRecordPageDTO）。 */
export interface AlarmPageQuery {
  pageNum?: number;
  pageSize?: number;
  alarmNo?: string;
  /** 报警类型：1-压力异常 2-渗漏 3-爆管 4-离线 */
  ruleType?: number;
  /** 报警级别：1-提示 2-警告 3-严重 */
  alarmLevel?: number;
  /** 状态：0-未处理 1-已确认 2-已忽略 3-已转工单 4-已恢复 */
  status?: number;
  deviceNumber?: string;
  deptId?: number;
  startTime?: string;
  endTime?: string;
}

/** 确认/忽略报警入参（AlarmHandleDTO）。 */
export interface AlarmHandlePayload {
  /** 处理人账号（可取当前登录用户） */
  handler?: string;
  handleRemark?: string;
}

/** 报警转工单入参（AlarmDispatchDTO，字段对齐 Worksheet）。 */
export interface AlarmDispatchPayload {
  /** 工单类型：0-巡检 1-检漏 2-拆装 3-维护（报警转工单默认 1-检漏） */
  worksheetType?: number;
  /** 执行人账号 */
  executeAccount?: string;
  /** 紧急程度：0-一般 1-紧急 */
  urgencyLevel?: number;
  /** 截止时间 */
  deadlineTime?: string;
  /** 工单说明 */
  worksheetInstruction?: string;
  remark?: string;
}

/** 报警记录实体（alarm_record）。 */
export interface AlarmRecord {
  id?: number;
  alarmNo?: string;
  ruleId?: number;
  /** 报警类型：1-压力异常 2-渗漏 3-爆管 4-离线 */
  ruleType?: number;
  /** 报警级别：1-提示 2-警告 3-严重 */
  alarmLevel?: number;
  deviceId?: number;
  deviceNumber?: string;
  deptId?: number;
  /** 触发值（报警时刻的实际值） */
  triggerValue?: string;
  /** 阈值快照（报警时规则配置） */
  thresholdSnapshot?: string;
  alarmTime?: string;
  /** 状态：0-未处理 1-已确认 2-已忽略 3-已转工单 4-已恢复 */
  status?: number;
  recoverTime?: string;
  handler?: string;
  handleTime?: string;
  handleRemark?: string;
  worksheetId?: number;
  worksheetNo?: string;
  /** 静默期内重复触发次数（合并计数） */
  triggerCount?: number;
  createdAt?: string;
  updatedAt?: string;
  /* —— 详情 VO 扩展（关联设备信息 / 命中规则快照） —— */
  /** 设备安装地址 */
  deviceInstallAddress?: string;
  /** 命中规则名称快照 */
  ruleName?: string;
  /** 部门名称 */
  deptName?: string;
}

export function getAlarmPage(data: AlarmPageQuery): Promise<ApiResponse<PageInfo<AlarmRecord>>>;
export function getAlarmDetail(id: number | string): Promise<ApiResponse<AlarmRecord>>;
export function deleteAlarm(id: number | string, isForce?: boolean): Promise<ApiResponse>;
export function confirmAlarm(id: number | string, data?: AlarmHandlePayload): Promise<ApiResponse>;
export function ignoreAlarm(id: number | string, data?: AlarmHandlePayload): Promise<ApiResponse>;
export function batchConfirmAlarms(ids: Array<number | string>): Promise<ApiResponse>;
export function dispatchAlarm(id: number | string, data: AlarmDispatchPayload): Promise<ApiResponse>;
export function getUnreadAlarmCount(): Promise<ApiResponse<number>>;
export function getLatestAlarms(since?: string): Promise<ApiResponse<AlarmRecord[]>>;
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
  exportAlarms: typeof exportAlarms;
};

export default service;
