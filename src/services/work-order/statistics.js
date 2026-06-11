/**
 * 工单统计接口封装，包含工单分页、列表、统计和导出能力。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService, postRequest } from "@/services/shared/crud";

const worksheetApi = createCrudService("/api/worksheet");

export const getWorksheetStatisticsPage = worksheetApi.getPage;
export const getWorksheetStatisticsList = worksheetApi.getList;

export function getWorksheetStatistics(data) {
  return postRequest("/api/worksheet/statistics", data);
}

export function exportWorksheetStatistics(data) {
  return postRequest("/api/worksheet/export", data);
}

export default {
  getWorksheetStatisticsPage,
  getWorksheetStatisticsList,
  getWorksheetStatistics,
  exportWorksheetStatistics,
};
