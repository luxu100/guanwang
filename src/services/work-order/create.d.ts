export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export interface WorksheetQuery {
  pageNum?: number;
  pageSize?: number;
  startTime?: string;
  endTime?: string;
  sortField?: "createdAt" | "updatedAt" | "riseTime";
  sortOrder?: "asc" | "desc";
  worksheetNumber?: string;
  worksheetType?: 0 | 1 | 2 | 3;
  worksheetStatus?: 0 | 1 | 2 | 3;
  riseAccount?: string;
  executeAccount?: string;
}

export interface WorksheetCreatePayload {
  worksheetNumber?: string;
  worksheetType?: 0 | 1 | 2 | 3;
  riseAccount?: string;
  executeAccount?: string;
  deviceReference?: string;
  urgencyLevel?: 0 | 1;
  riseTime?: string;
  finishTime?: string;
  deadlineTime?: string;
  worksheetStatus?: 0 | 1 | 2 | 3;
  worksheetFeedback?: string;
  worksheetInstruction?: string;
  remark?: string;
  address?: string;
  coordinate?: string;
  pictureIds?: string;
  leakageId?: number;
}

export function createWorksheet(data: WorksheetCreatePayload): Promise<ApiResponse>;
export function getWorksheetCreatePage(data: WorksheetQuery): Promise<ApiResponse>;
export function getWorksheetCreateList(params?: WorksheetQuery): Promise<ApiResponse>;
export function getWorksheetCreateDetail(id: number | string): Promise<ApiResponse>;
export function createManualAnalysisWorkOrder(data: WorksheetCreatePayload): Promise<ApiResponse>;
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
