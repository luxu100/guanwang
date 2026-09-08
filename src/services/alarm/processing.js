/**
 * 报警记录服务 —— 视图入口（薄转发层）。
 *
 * 实际接口实现统一在 api.js。
 * 本地演示模式（VITE_ALARM_USE_MOCK=true）由 api.js 内 withMock 转发到本地引擎。
 */
export {
  getAlarmPage,
  getAlarmDetail,
  deleteAlarm,
  confirmAlarm,
  ignoreAlarm,
  batchConfirmAlarms,
  dispatchAlarm,
  getUnreadAlarmCount,
  getLatestAlarms,
  getLatestActiveAlarms,
  exportAlarms,
} from "./api";

import api from "./api";
export default api;
