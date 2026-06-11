import { createCrudService, postRequest } from "@/services/shared/crud";

const reportApi = createCrudService("/api/report");

export const getReportPage = reportApi.getPage;
export const getReportList = reportApi.getList;
export const getReportDetail = reportApi.getDetail;
export const deleteReport = reportApi.delete;
export const batchDeleteReport = reportApi.batchDelete;

export function exportReport(id, data) {
  return postRequest(`/api/report/${id}/export`, data);
}

export function printReport(id, data) {
  return postRequest(`/api/report/${id}/print`, data);
}

export default {
  getReportPage,
  getReportList,
  getReportDetail,
  deleteReport,
  batchDeleteReport,
  exportReport,
  printReport,
};
