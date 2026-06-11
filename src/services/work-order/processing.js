/**
 * 工单处理接口封装，包含工单详情、更新、分派、催办和关闭动作。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService, postRequest } from "@/services/shared/crud";

const worksheetApi = createCrudService("/api/worksheet");

export const getWorksheetProcessPage = worksheetApi.getPage;
export const getWorksheetProcessDetail = worksheetApi.getDetail;
export const updateWorksheetProcess = worksheetApi.update;

export function assignWorksheet(id, data) {
  return postRequest(`/api/worksheet/${id}/assign`, data);
}

export function urgeWorksheet(id, data) {
  return postRequest(`/api/worksheet/${id}/urge`, data);
}

export function closeWorksheet(id, data) {
  return postRequest(`/api/worksheet/${id}/close`, data);
}

export default {
  getWorksheetProcessPage,
  getWorksheetProcessDetail,
  updateWorksheetProcess,
  assignWorksheet,
  urgeWorksheet,
  closeWorksheet,
};
