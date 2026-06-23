export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export type SuspectQuery = Record<string, unknown>;
export type SuspectPayload = Record<string, unknown>;

export function getSuspectPage(data: SuspectQuery): Promise<ApiResponse>;
export function getSuspectList(params?: SuspectQuery): Promise<ApiResponse>;
export function getSuspectDetail(id: number | string): Promise<ApiResponse>;
export function createSuspect(data: SuspectPayload): Promise<ApiResponse>;
export function updateSuspect(id: number | string, data: SuspectPayload): Promise<ApiResponse>;
export function deleteSuspect(id: number | string): Promise<ApiResponse>;
export function batchDeleteSuspect(data: SuspectPayload): Promise<ApiResponse>;

declare const service: {
  getSuspectPage: typeof getSuspectPage;
  getSuspectList: typeof getSuspectList;
  getSuspectDetail: typeof getSuspectDetail;
  createSuspect: typeof createSuspect;
  updateSuspect: typeof updateSuspect;
  deleteSuspect: typeof deleteSuspect;
  batchDeleteSuspect: typeof batchDeleteSuspect;
};

export default service;
