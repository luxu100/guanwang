import { createCrudService, postRequest } from "@/services/shared/crud";

const alarmRecordApi = createCrudService("/api/alarm-record");

export const getAlarmAnalysisPage = alarmRecordApi.getPage;
export const getAlarmAnalysisDetail = alarmRecordApi.getDetail;

export function getAlarmStatistics(data) {
  return postRequest("/api/alarm-record/statistics", data);
}

export function getAlarmTrend(data) {
  return postRequest("/api/alarm-record/trend", data);
}

export function exportAlarmRecords(data) {
  return postRequest("/api/alarm-record/export", data);
}

export default {
  getAlarmAnalysisPage,
  getAlarmAnalysisDetail,
  getAlarmStatistics,
  getAlarmTrend,
  exportAlarmRecords,
};
