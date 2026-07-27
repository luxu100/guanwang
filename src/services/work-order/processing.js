/**
 * 工单处理接口封装。
 *
 * Swagger 当前仅提供 worksheet 的标准 CRUD 接口，处理、关闭等动作通过更新工单字段完成。
 */
import { createCrudService, getRequest, patchRequest, postRequest, putRequest } from "@/services/shared/crud";

const worksheetApi = createCrudService("/api/worksheet");
const manualAnalysisWorkOrderApi = createCrudService("/api/manual-analysis/work-orders");

export const getWorksheetProcessPage = worksheetApi.getPage;
export const getWorksheetProcessDetail = worksheetApi.getDetail;
export const updateWorksheetProcess = worksheetApi.update;
export const deleteWorksheet = worksheetApi.delete;

export function assignWorksheet(id, data) {
  return updateWorksheetProcess(id, data);
}

export function urgeWorksheet(id, data) {
  return updateWorksheetProcess(id, data);
}

export function closeWorksheet(id, data) {
  return updateWorksheetProcess(id, {
    ...data,
    worksheetStatus: 3,
  });
}

export const getManualAnalysisProcessPage = manualAnalysisWorkOrderApi.getPage;
export const getManualAnalysisProcessDetail = manualAnalysisWorkOrderApi.getDetail;
export const updateManualAnalysisWorkOrder = manualAnalysisWorkOrderApi.update;
export const deleteManualAnalysisWorkOrder = manualAnalysisWorkOrderApi.delete;

export function updateManualAnalysisWorkOrderStatus(id, data) {
  return patchRequest(`/api/manual-analysis/work-orders/${id}/status`, data);
}

export function getManualAnalysisWorkOrderProcess(id, params) {
  return getRequest(`/api/manual-analysis/work-orders/${id}/process`, params);
}

export function submitManualAnalysisWorkOrderProcess(id, data) {
  return postRequest(`/api/manual-analysis/work-orders/${id}/process`, data);
}

export function updateManualAnalysisWorkOrderProcess(id, data) {
  return putRequest(`/api/manual-analysis/work-orders/${id}/process`, data);
}

export default {
  getWorksheetProcessPage,
  getWorksheetProcessDetail,
  updateWorksheetProcess,
  deleteWorksheet,
  assignWorksheet,
  urgeWorksheet,
  closeWorksheet,
  getManualAnalysisProcessPage,
  getManualAnalysisProcessDetail,
  updateManualAnalysisWorkOrder,
  deleteManualAnalysisWorkOrder,
  updateManualAnalysisWorkOrderStatus,
  getManualAnalysisWorkOrderProcess,
  submitManualAnalysisWorkOrderProcess,
  updateManualAnalysisWorkOrderProcess,
};
