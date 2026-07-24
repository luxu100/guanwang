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
export interface WorksheetProcessPayload {
  worksheetNumber?: string;
  worksheetType?: number;
  riseAccount?: string;
  executeAccount?: string;
  deviceReference?: string;
  urgencyLevel?: number;
  riseTime?: string;
  finishTime?: string;
  deadlineTime?: string;
  worksheetStatus?: number;
  worksheetFeedback?: string;
  worksheetInstruction?: string;
  remark?: string;
  address?: string;
  coordinate?: string;
  pictureIds?: string;
  leakageId?: number;
  [key: string]: unknown;
}

export function getWorksheetProcessPage(data: WorksheetQuery): Promise<ApiResponse>;
export function getWorksheetProcessDetail(id: number | string): Promise<ApiResponse>;
export function updateWorksheetProcess(id: number | string, data: WorksheetProcessPayload): Promise<ApiResponse>;
export function deleteWorksheet(id: number | string): Promise<ApiResponse>;
export function assignWorksheet(id: number | string, data: WorksheetProcessPayload): Promise<ApiResponse>;
export function urgeWorksheet(id: number | string, data: WorksheetProcessPayload): Promise<ApiResponse>;
export function closeWorksheet(id: number | string, data: WorksheetProcessPayload): Promise<ApiResponse>;
export function getManualAnalysisProcessPage(data: WorksheetQuery): Promise<ApiResponse>;
export function getManualAnalysisProcessDetail(id: number | string): Promise<ApiResponse>;
export function updateManualAnalysisWorkOrder(id: number | string, data: WorksheetProcessPayload): Promise<ApiResponse>;
export function deleteManualAnalysisWorkOrder(id: number | string): Promise<ApiResponse>;
export function updateManualAnalysisWorkOrderStatus(id: number | string, data: WorksheetProcessPayload): Promise<ApiResponse>;
export function getManualAnalysisWorkOrderProcess(id: number | string, params?: WorksheetQuery): Promise<ApiResponse>;
export function submitManualAnalysisWorkOrderProcess(id: number | string, data: WorksheetProcessPayload): Promise<ApiResponse>;
export function updateManualAnalysisWorkOrderProcess(id: number | string, data: WorksheetProcessPayload): Promise<ApiResponse>;

declare const service: {
  getWorksheetProcessPage: typeof getWorksheetProcessPage;
  getWorksheetProcessDetail: typeof getWorksheetProcessDetail;
  updateWorksheetProcess: typeof updateWorksheetProcess;
  deleteWorksheet: typeof deleteWorksheet;
  assignWorksheet: typeof assignWorksheet;
  urgeWorksheet: typeof urgeWorksheet;
  closeWorksheet: typeof closeWorksheet;
  getManualAnalysisProcessPage: typeof getManualAnalysisProcessPage;
  getManualAnalysisProcessDetail: typeof getManualAnalysisProcessDetail;
  updateManualAnalysisWorkOrder: typeof updateManualAnalysisWorkOrder;
  deleteManualAnalysisWorkOrder: typeof deleteManualAnalysisWorkOrder;
  updateManualAnalysisWorkOrderStatus: typeof updateManualAnalysisWorkOrderStatus;
  getManualAnalysisWorkOrderProcess: typeof getManualAnalysisWorkOrderProcess;
  submitManualAnalysisWorkOrderProcess: typeof submitManualAnalysisWorkOrderProcess;
  updateManualAnalysisWorkOrderProcess: typeof updateManualAnalysisWorkOrderProcess;
};

export default service;
