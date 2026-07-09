/**
 * Suspected leak management API wrappers.
 *
 * All paths are present in jiekou/suspected leak docs: /api/suspected-leak.
 */
import { createCrudService, postRequest } from "@/services/shared/crud";

const suspectedLeakApi = createCrudService("/api/suspected-leak");

export const getSuspectPage = suspectedLeakApi.getPage;
export const getSuspectList = suspectedLeakApi.getList;
export const getSuspectDetail = suspectedLeakApi.getDetail;
export const createSuspect = suspectedLeakApi.create;
export const updateSuspect = suspectedLeakApi.update;
export const deleteSuspect = suspectedLeakApi.delete;

export function createSuspectDirect(data) {
  return postRequest("/api/suspected-leak", data);
}

export function dispatchSuspect(id, data) {
  return postRequest(`/api/suspected-leak/${id}/dispatch`, data);
}

export function confirmSuspectAsLeakPoint(id, data) {
  return postRequest(`/api/suspected-leak/${id}/confirm-leak-point`, data);
}

export default {
  getSuspectPage,
  getSuspectList,
  getSuspectDetail,
  createSuspect,
  createSuspectDirect,
  updateSuspect,
  deleteSuspect,
  dispatchSuspect,
  confirmSuspectAsLeakPoint,
};
