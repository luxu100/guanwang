/**
 * 工单统计接口封装。
 *
 * 后端 Swagger 目前只暴露工单分页和列表接口，统计数据由页面基于查询结果汇总。
 */
import { createCrudService } from "@/services/shared/crud";

const worksheetApi = createCrudService("/api/worksheet");

export const getWorksheetStatisticsPage = worksheetApi.getPage;
export const getWorksheetStatisticsList = worksheetApi.getList;

export function getWorksheetStatistics(data) {
  return worksheetApi.getPage(data);
}

export function exportWorksheetStatistics(data) {
  return worksheetApi.getPage(data);
}

export default {
  getWorksheetStatisticsPage,
  getWorksheetStatisticsList,
  getWorksheetStatistics,
  exportWorksheetStatistics,
};
