import { createCrudService } from "@/services/shared/crud";

const alarmStrategyApi = createCrudService("/api/alarm-strategy");

export const getAlarmStrategyPage = alarmStrategyApi.getPage;
export const getAlarmStrategyList = alarmStrategyApi.getList;
export const getAlarmStrategyDetail = alarmStrategyApi.getDetail;
export const createAlarmStrategy = alarmStrategyApi.create;
export const updateAlarmStrategy = alarmStrategyApi.update;
export const deleteAlarmStrategy = alarmStrategyApi.delete;
export const batchDeleteAlarmStrategy = alarmStrategyApi.batchDelete;

export default {
  getAlarmStrategyPage,
  getAlarmStrategyList,
  getAlarmStrategyDetail,
  createAlarmStrategy,
  updateAlarmStrategy,
  deleteAlarmStrategy,
  batchDeleteAlarmStrategy,
};
