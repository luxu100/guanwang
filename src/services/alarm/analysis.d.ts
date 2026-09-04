export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

/** 统计接口通用入参（AlarmStatisticsQueryDTO）。 */
export interface AlarmStatisticsQuery {
  startTime?: string;
  endTime?: string;
  /** 报警类型：1-压力异常 2-渗漏 3-爆管 4-离线 */
  ruleType?: number;
  deptId?: number;
  /** trend 接口时间粒度：hour-小时 day-天（默认 day，由前端入参指定） */
  granularity?: "hour" | "day";
}

/** 概览汇总：各类型/各级别/各状态数量。 */
export interface AlarmOverview {
  /** key 为 ruleType/alarmLevel/status 的枚举值 */
  byType?: Record<string, number>;
  byLevel?: Record<string, number>;
  byStatus?: Record<string, number>;
  total?: number;
}

/** 趋势分桶项。 */
export interface AlarmTrendItem {
  /** 分桶时间（如 2026-09-01 / 2026-09-01 14:00） */
  time?: string;
  count?: number;
}

/** 设备分布项（供地图打点 / 分布表）。 */
export interface AlarmDistributionItem {
  deviceId?: number;
  deviceNumber?: string;
  coordinate?: string;
  alarmCount?: number;
  latestAlarmTime?: string;
  latestAlarmLevel?: number;
}

export function getAlarmOverview(params?: AlarmStatisticsQuery): Promise<ApiResponse<AlarmOverview>>;
export function getAlarmTrend(params?: AlarmStatisticsQuery): Promise<ApiResponse<AlarmTrendItem[]>>;
export function getAlarmDistribution(params?: AlarmStatisticsQuery): Promise<ApiResponse<AlarmDistributionItem[]>>;

declare const service: {
  getAlarmOverview: typeof getAlarmOverview;
  getAlarmTrend: typeof getAlarmTrend;
  getAlarmDistribution: typeof getAlarmDistribution;
};

export default service;
