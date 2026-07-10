export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export type WorksheetQuery = Record<string, unknown>;
export type WorksheetPayload = Record<string, unknown>;

export function getWorksheetProcessPage(data: WorksheetQuery): Promise<ApiResponse>;
export function getWorksheetProcessDetail(id: number | string): Promise<ApiResponse>;
export function updateWorksheetProcess(id: number | string, data: WorksheetPayload): Promise<ApiResponse>;
export function assignWorksheet(id: number | string, data: WorksheetPayload): Promise<ApiResponse>;
export function urgeWorksheet(id: number | string, data: WorksheetPayload): Promise<ApiResponse>;
export function closeWorksheet(id: number | string, data: WorksheetPayload): Promise<ApiResponse>;
export function getManualAnalysisProcessPage(data: WorksheetQuery): Promise<ApiResponse>;
export function getManualAnalysisProcessDetail(id: number | string): Promise<ApiResponse>;
export function updateManualAnalysisWorkOrder(id: number | string, data: WorksheetPayload): Promise<ApiResponse>;
export function deleteManualAnalysisWorkOrder(id: number | string): Promise<ApiResponse>;
export function updateManualAnalysisWorkOrderStatus(id: number | string, data: WorksheetPayload): Promise<ApiResponse>;
export function getManualAnalysisWorkOrderProcess(id: number | string, params?: WorksheetQuery): Promise<ApiResponse>;
export function submitManualAnalysisWorkOrderProcess(id: number | string, data: WorksheetPayload): Promise<ApiResponse>;
export function updateManualAnalysisWorkOrderProcess(id: number | string, data: WorksheetPayload): Promise<ApiResponse>;

declare const service: {
  getWorksheetProcessPage: typeof getWorksheetProcessPage;
  getWorksheetProcessDetail: typeof getWorksheetProcessDetail;
  updateWorksheetProcess: typeof updateWorksheetProcess;
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
