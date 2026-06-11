/**
 * 报表生成接口封装，包含报表模板、生成任务和生成动作。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
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
