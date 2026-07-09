export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export type WorksheetQuery = Record<string, unknown>;
export type WorksheetPayload = Record<string, unknown>;

export function createWorksheet(data: WorksheetPayload): Promise<ApiResponse>;
export function getWorksheetCreatePage(data: WorksheetQuery): Promise<ApiResponse>;
export function getWorksheetCreateList(params?: WorksheetQuery): Promise<ApiResponse>;
export function getWorksheetCreateDetail(id: number | string): Promise<ApiResponse>;
export function createManualAnalysisWorkOrder(data: WorksheetPayload): Promise<ApiResponse>;
export function getManualAnalysisWorkOrderPage(data: WorksheetQuery): Promise<ApiResponse>;
export function getManualAnalysisWorkOrderDetail(id: number | string): Promise<ApiResponse>;

declare const service: {
  createWorksheet: typeof createWorksheet;
  getWorksheetCreatePage: typeof getWorksheetCreatePage;
  getWorksheetCreateList: typeof getWorksheetCreateList;
  getWorksheetCreateDetail: typeof getWorksheetCreateDetail;
  createManualAnalysisWorkOrder: typeof createManualAnalysisWorkOrder;
  getManualAnalysisWorkOrderPage: typeof getManualAnalysisWorkOrderPage;
  getManualAnalysisWorkOrderDetail: typeof getManualAnalysisWorkOrderDetail;
};

export default service;
