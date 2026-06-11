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
