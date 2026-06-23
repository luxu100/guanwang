export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export type SuspectProcessingQuery = Record<string, unknown>;
export type SuspectProcessingPayload = Record<string, unknown>;

export function getSuspectProcessingPage(data: SuspectProcessingQuery): Promise<ApiResponse>;
export function getSuspectProcessingList(params?: SuspectProcessingQuery): Promise<ApiResponse>;
export function getSuspectProcessingDetail(id: number | string): Promise<ApiResponse>;
export function confirmSuspect(id: number | string, data: SuspectProcessingPayload): Promise<ApiResponse>;
export function excludeSuspect(id: number | string): Promise<ApiResponse>;
export function convertToWorksheet(suspectId: number | string, worksheetPayload: SuspectProcessingPayload): Promise<ApiResponse>;

declare const service: {
  getSuspectProcessingPage: typeof getSuspectProcessingPage;
  getSuspectProcessingList: typeof getSuspectProcessingList;
  getSuspectProcessingDetail: typeof getSuspectProcessingDetail;
  confirmSuspect: typeof confirmSuspect;
  excludeSuspect: typeof excludeSuspect;
  convertToWorksheet: typeof convertToWorksheet;
};

export default service;
