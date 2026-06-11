/**
 * 报表操作接口封装，包含报表查询、删除、导出和打印动作。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
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
