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
