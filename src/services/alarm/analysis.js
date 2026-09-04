/**
 * 报警统计接口封装，包含概览汇总、时间粒度趋势和设备坐标分布。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { getRequest } from "@/services/shared/crud";

/** 按类型/级别/状态汇总报警数量。 */
export function getAlarmOverview(params) {
  return getRequest(`/api/alarm-record/statistics/overview`, params);
}

/** 时间粒度趋势（granularity: hour/day，默认 day）。 */
export function getAlarmTrend(params) {
  return getRequest(`/api/alarm-record/statistics/trend`, params);
}

/** 报警按设备坐标分布（供地图打点 / 分布表）。 */
export function getAlarmDistribution(params) {
  return getRequest(`/api/alarm-record/statistics/distribution`, params);
}

export default {
  getAlarmOverview,
  getAlarmTrend,
  getAlarmDistribution,
};
