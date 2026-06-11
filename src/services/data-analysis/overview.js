/**
 * 系统总览接口封装，提供首页/总览类统计数据查询。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { postRequest } from "@/services/shared/crud";

export function getSystemOverview(data) {
  return postRequest("/api/statistics/overview", data);
}

export function getDeviceOverview(data) {
  return postRequest("/api/statistics/device", data);
}

export function getLeakageOverview(data) {
  return postRequest("/api/statistics/leakage", data);
}

export function getWorksheetOverview(data) {
  return postRequest("/api/statistics/worksheet", data);
}

export function getAlarmOverview(data) {
  return postRequest("/api/statistics/alarm", data);
}

export default {
  getSystemOverview,
  getDeviceOverview,
  getLeakageOverview,
  getWorksheetOverview,
  getAlarmOverview,
};
