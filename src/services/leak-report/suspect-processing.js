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
