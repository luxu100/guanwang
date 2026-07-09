export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export type LeakPointQuery = Record<string, unknown>;
export type LeakPointPayload = Record<string, unknown>;

export function getLeakPointPage(data: LeakPointQuery): Promise<ApiResponse>;
export function getLeakPointList(params?: LeakPointQuery): Promise<ApiResponse>;
export function getLeakPointDetail(id: number | string): Promise<ApiResponse>;
export function createLeakPoint(data: LeakPointPayload): Promise<ApiResponse>;
export function createLeakPointDirect(data: LeakPointPayload): Promise<ApiResponse>;
export function updateLeakPoint(id: number | string, data: LeakPointPayload): Promise<ApiResponse>;
export function deleteLeakPoint(id: number | string): Promise<ApiResponse>;

declare const service: {
  getLeakPointPage: typeof getLeakPointPage;
  getLeakPointList: typeof getLeakPointList;
  getLeakPointDetail: typeof getLeakPointDetail;
  createLeakPoint: typeof createLeakPoint;
  createLeakPointDirect: typeof createLeakPointDirect;
  updateLeakPoint: typeof updateLeakPoint;
  deleteLeakPoint: typeof deleteLeakPoint;
};

export default service;
