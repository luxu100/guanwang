/**
 * 报警记录服务 —— 视图入口（薄转发层）。
 *
 * 实际接口实现统一在 api.js（对齐后端 13 接口契约）。
 */
export {
  getAlarmPage,
  getAlarmDetail,
  confirmAlarm,
  resolveAlarm,
  getLatestActiveAlarms,
  getAlarmTrend,
  getAlarmOverview,
  getAlarmMap,
} from "./api";

import api from "./api";
export default api;
