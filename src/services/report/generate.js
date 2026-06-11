import { createCrudService, postRequest } from "@/services/shared/crud";

const reportTemplateApi = createCrudService("/api/report-template");
const reportTaskApi = createCrudService("/api/report-task");

export const getReportTemplatePage = reportTemplateApi.getPage;
export const getReportTemplateList = reportTemplateApi.getList;
export const getReportTemplateDetail = reportTemplateApi.getDetail;
export const createReportTemplate = reportTemplateApi.create;
export const updateReportTemplate = reportTemplateApi.update;
export const deleteReportTemplate = reportTemplateApi.delete;
export const batchDeleteReportTemplate = reportTemplateApi.batchDelete;

export const getReportTaskPage = reportTaskApi.getPage;
export const getReportTaskDetail = reportTaskApi.getDetail;

export function generateReport(data) {
  return postRequest("/api/report/generate", data);
}

export default {
  getReportTemplatePage,
  getReportTemplateList,
  getReportTemplateDetail,
  createReportTemplate,
  updateReportTemplate,
  deleteReportTemplate,
  batchDeleteReportTemplate,
  getReportTaskPage,
  getReportTaskDetail,
  generateReport,
};
