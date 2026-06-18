export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export type ServiceQuery = Record<string, unknown>;
export type ServicePayload = Record<string, unknown>;
export type ServiceId = string | number;

export function getDeviceStatusPage(data: ServiceQuery): Promise<ApiResponse>;
export function getDeviceStatusDetail(id: ServiceId): Promise<ApiResponse>;
export function updateDeviceStatus(id: ServiceId, data: ServicePayload): Promise<ApiResponse>;

export function getDeviceStatusUploadPage(data: ServiceQuery): Promise<ApiResponse>;
export function getDeviceStatusUploadList(params?: ServiceQuery): Promise<ApiResponse>;
export function getDeviceStatusUploadDetail(id: ServiceId): Promise<ApiResponse>;

export function getDeviceDailyDataPage(data: ServiceQuery): Promise<ApiResponse>;
export function getDeviceDailyDataList(params?: ServiceQuery): Promise<ApiResponse>;
export function getDeviceDailyDataDetail(id: ServiceId): Promise<ApiResponse>;

declare const service: {
  getDeviceStatusPage: typeof getDeviceStatusPage;
  getDeviceStatusDetail: typeof getDeviceStatusDetail;
  updateDeviceStatus: typeof updateDeviceStatus;
  getDeviceStatusUploadPage: typeof getDeviceStatusUploadPage;
  getDeviceStatusUploadList: typeof getDeviceStatusUploadList;
  getDeviceStatusUploadDetail: typeof getDeviceStatusUploadDetail;
  getDeviceDailyDataPage: typeof getDeviceDailyDataPage;
  getDeviceDailyDataList: typeof getDeviceDailyDataList;
  getDeviceDailyDataDetail: typeof getDeviceDailyDataDetail;
};

export default service;
