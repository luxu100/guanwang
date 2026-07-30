/**
 * 疑点上报接口封装，围绕 /api/suspected-leak 资源提供 CRUD + 派单 + 确认漏点能力。
 */
import { createCrudService } from "@/services/shared/crud";
import { postRequest, getRequest } from "@/services/shared/crud";

const suspectedLeakApi = createCrudService("/api/suspected-leak");

// ========== 基础 CRUD ==========
export const getSuspectPage = suspectedLeakApi.getPage;
export const getSuspectList = suspectedLeakApi.getList;
export const getSuspectDetail = suspectedLeakApi.getDetail;
export const createSuspect = suspectedLeakApi.create;
export const updateSuspect = suspectedLeakApi.update;
export const deleteSuspect = suspectedLeakApi.delete;

export function createSuspectDirect(data) {
  return postRequest("/api/suspected-leak", data);
}

// ========== 当前用户可见列表 ==========
export function getCurrentUserSuspectList(params) {
  return getRequest("/api/suspected-leak/list", params);
}

// ========== 派单 ==========
export function dispatchSuspect(id, dispatchPayload) {
  return postRequest(`/api/suspected-leak/${id}/dispatch`, dispatchPayload);
}

// ========== 确认漏点 ==========
export function confirmLeakPoint(id, leakPointPayload) {
  return postRequest(`/api/suspected-leak/${id}/confirm-leak-point`, leakPointPayload);
}

export function confirmSuspectAsLeakPoint(id, leakPointPayload) {
  return confirmLeakPoint(id, leakPointPayload);
}

// ========== 排除疑点 ==========
// 后端不存在 /api/suspected-leak/{id}/exclude 路由，本函数已移除。
// 状态 4 按后端合同显示"已取消"，不再作为自创"已排除"语义。
// 如需恢复，必须先在后端建立独立路由、字段、权限和审计合同。

export default {
  getSuspectPage,
  getSuspectList,
  getSuspectDetail,
  createSuspect,
  createSuspectDirect,
  updateSuspect,
  deleteSuspect,
  getCurrentUserSuspectList,
  dispatchSuspect,
  confirmLeakPoint,
  confirmSuspectAsLeakPoint,
};
