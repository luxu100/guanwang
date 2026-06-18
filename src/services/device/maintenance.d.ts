export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export type ServiceQuery = Record<string, unknown>;
export type ServicePayload = Record<string, unknown>;
export type ServiceId = string | number;

export function getMaintenanceRecordPage(data: ServiceQuery): Promise<ApiResponse>;
export function getMaintenanceRecordList(params?: ServiceQuery): Promise<ApiResponse>;
export function getMaintenanceRecordDetail(id: ServiceId): Promise<ApiResponse>;
export function createMaintenanceRecord(data: ServicePayload): Promise<ApiResponse>;
export function updateMaintenanceRecord(id: ServiceId, data: ServicePayload): Promise<ApiResponse>;
export function deleteMaintenanceRecord(id: ServiceId): Promise<ApiResponse>;
export function batchDeleteMaintenanceRecord(data: ServicePayload): Promise<ApiResponse>;

declare const service: {
  getMaintenanceRecordPage: typeof getMaintenanceRecordPage;
  getMaintenanceRecordList: typeof getMaintenanceRecordList;
  getMaintenanceRecordDetail: typeof getMaintenanceRecordDetail;
  createMaintenanceRecord: typeof createMaintenanceRecord;
  updateMaintenanceRecord: typeof updateMaintenanceRecord;
  deleteMaintenanceRecord: typeof deleteMaintenanceRecord;
  batchDeleteMaintenanceRecord: typeof batchDeleteMaintenanceRecord;
};

export default service;
