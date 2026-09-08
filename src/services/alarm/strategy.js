/**
 * 报警规则服务 —— 视图入口（薄转发层）。实现见 api.js。
 */
export {
  getRulePage,
  getRuleList,
  getRuleDetail,
  createRule,
  updateRule,
  deleteRule,
} from "./api";

import api from "./api";
export default api;
