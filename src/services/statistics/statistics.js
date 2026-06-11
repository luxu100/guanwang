/**
 * 统计分析接口封装，提供设备、渗漏、工单和报警等汇总统计查询。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { postRequest } from "@/services/shared/crud";

export function getStatisticsSummary(data) {
  return postRequest("/api/statistics/summary", data);
}

export function getDeviceStatistics(data) {
  return postRequest("/api/statistics/device", data);
}

export function getLeakageStatistics(data) {
  return postRequest("/api/statistics/leakage", data);
}

export function getWorksheetStatistics(data) {
  return postRequest("/api/statistics/worksheet", data);
}

export function getAlarmStatistics(data) {
  return postRequest("/api/statistics/alarm", data);
}

export default {
  getStatisticsSummary,
  getDeviceStatistics,
  getLeakageStatistics,
  getWorksheetStatistics,
  getAlarmStatistics,
};
