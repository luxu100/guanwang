/**
 * 报警策略接口封装，围绕 alarm-strategy 资源提供 CRUD 能力。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
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
