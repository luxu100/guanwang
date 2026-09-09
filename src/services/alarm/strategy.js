/**
 * 报警规则服务 —— 视图入口（薄转发层）。实现见 api.js（对齐后端 6 接口契约）。
 */
export {
  getRulePage,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
  getRuleFields,
} from "./api";

import api from "./api";
export default api;
