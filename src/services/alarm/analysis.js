/**
 * 报警分析接口封装，包含报警记录查询、统计、趋势和导出能力。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
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
