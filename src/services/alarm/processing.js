/**
 * 报警处理接口封装，包含报警确认、忽略和转工单动作。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService, postRequest } from "@/services/shared/crud";

const alarmRecordApi = createCrudService("/api/alarm-record");

export const getAlarmRecordPage = alarmRecordApi.getPage;
export const getAlarmRecordList = alarmRecordApi.getList;
export const getAlarmRecordDetail = alarmRecordApi.getDetail;
export const updateAlarmRecord = alarmRecordApi.update;

export function confirmAlarm(id, data) {
  return postRequest(`/api/alarm-record/${id}/confirm`, data);
}

export function ignoreAlarm(id, data) {
  return postRequest(`/api/alarm-record/${id}/ignore`, data);
}

export function createWorksheetFromAlarm(id, data) {
  return postRequest(`/api/alarm-record/${id}/worksheet`, data);
}

export default {
  getAlarmRecordPage,
  getAlarmRecordList,
  getAlarmRecordDetail,
  updateAlarmRecord,
  confirmAlarm,
  ignoreAlarm,
  createWorksheetFromAlarm,
};
