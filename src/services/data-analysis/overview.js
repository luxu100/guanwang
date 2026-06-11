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
