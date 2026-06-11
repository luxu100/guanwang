/**
 * 疑点处理接口封装，包含分配、确认、排除和转工单等处理动作。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService, postRequest } from "@/services/shared/crud";

const suspectedLeakApi = createCrudService("/api/suspected-leak");

export const getPendingSuspectPage = suspectedLeakApi.getPage;
export const getSuspectProcessDetail = suspectedLeakApi.getDetail;
export const updateSuspectProcess = suspectedLeakApi.update;

export function assignSuspectProcessor(id, data) {
  return postRequest(`/api/suspected-leak/${id}/assign`, data);
}

export function confirmSuspect(id, data) {
  return postRequest(`/api/suspected-leak/${id}/confirm`, data);
}

export function excludeSuspect(id, data) {
  return postRequest(`/api/suspected-leak/${id}/exclude`, data);
}

export function createWorksheetFromSuspect(id, data) {
  return postRequest(`/api/suspected-leak/${id}/worksheet`, data);
}

export default {
  getPendingSuspectPage,
  getSuspectProcessDetail,
  updateSuspectProcess,
  assignSuspectProcessor,
  confirmSuspect,
  excludeSuspect,
  createWorksheetFromSuspect,
};
