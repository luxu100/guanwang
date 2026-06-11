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
