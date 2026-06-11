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
