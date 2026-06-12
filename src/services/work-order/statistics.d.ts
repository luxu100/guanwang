export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export type WorksheetQuery = Record<string, unknown>;

export function getWorksheetStatisticsPage(data: WorksheetQuery): Promise<ApiResponse>;
export function getWorksheetStatisticsList(params?: WorksheetQuery): Promise<ApiResponse>;
export function getWorksheetStatistics(data: WorksheetQuery): Promise<ApiResponse>;
export function exportWorksheetStatistics(data: WorksheetQuery): Promise<ApiResponse>;

declare const service: {
  getWorksheetStatisticsPage: typeof getWorksheetStatisticsPage;
  getWorksheetStatisticsList: typeof getWorksheetStatisticsList;
  getWorksheetStatistics: typeof getWorksheetStatistics;
  exportWorksheetStatistics: typeof exportWorksheetStatistics;
};

export default service;
