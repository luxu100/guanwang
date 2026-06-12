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

declare const service: {
  getWorksheetProcessPage: typeof getWorksheetProcessPage;
  getWorksheetProcessDetail: typeof getWorksheetProcessDetail;
  updateWorksheetProcess: typeof updateWorksheetProcess;
  assignWorksheet: typeof assignWorksheet;
  urgeWorksheet: typeof urgeWorksheet;
  closeWorksheet: typeof closeWorksheet;
};

export default service;
