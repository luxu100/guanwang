export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export type ServiceQuery = Record<string, unknown>;
export type ServicePayload = Record<string, unknown>;
export type ServiceId = string | number;

export function getDevicePage(data: ServiceQuery): Promise<ApiResponse>;
export function getDeviceList(params?: ServiceQuery): Promise<ApiResponse>;
export function getDeviceDetail(id: ServiceId): Promise<ApiResponse>;
export function createDevice(data: ServicePayload): Promise<ApiResponse>;
export function updateDevice(id: ServiceId, data: ServicePayload): Promise<ApiResponse>;
export function deleteDevice(id: ServiceId): Promise<ApiResponse>;
export function batchDeleteDevice(data: ServicePayload): Promise<ApiResponse>;

export function getDeviceProductPage(data: ServiceQuery): Promise<ApiResponse>;
export function getDeviceProductList(params?: ServiceQuery): Promise<ApiResponse>;
export function getDeviceProductDetail(id: ServiceId): Promise<ApiResponse>;
export function createDeviceProduct(data: ServicePayload): Promise<ApiResponse>;
export function updateDeviceProduct(id: ServiceId, data: ServicePayload): Promise<ApiResponse>;
export function deleteDeviceProduct(id: ServiceId): Promise<ApiResponse>;
export function batchDeleteDeviceProduct(data: ServicePayload): Promise<ApiResponse>;

export function getDeviceProtocolPage(data: ServiceQuery): Promise<ApiResponse>;
export function createDeviceProtocol(data: ServicePayload): Promise<ApiResponse>;
export function getDeviceProtocolByDevice(deviceId: ServiceId, params?: ServiceQuery): Promise<ApiResponse>;
export function getDeviceProtocolByProtocol(protocolId: ServiceId, params?: ServiceQuery): Promise<ApiResponse>;

declare const service: {
  getDevicePage: typeof getDevicePage;
  getDeviceList: typeof getDeviceList;
  getDeviceDetail: typeof getDeviceDetail;
  createDevice: typeof createDevice;
  updateDevice: typeof updateDevice;
  deleteDevice: typeof deleteDevice;
  batchDeleteDevice: typeof batchDeleteDevice;
  getDeviceProductPage: typeof getDeviceProductPage;
  getDeviceProductList: typeof getDeviceProductList;
  getDeviceProductDetail: typeof getDeviceProductDetail;
  createDeviceProduct: typeof createDeviceProduct;
  updateDeviceProduct: typeof updateDeviceProduct;
  deleteDeviceProduct: typeof deleteDeviceProduct;
  batchDeleteDeviceProduct: typeof batchDeleteDeviceProduct;
  getDeviceProtocolPage: typeof getDeviceProtocolPage;
  createDeviceProtocol: typeof createDeviceProtocol;
  getDeviceProtocolByDevice: typeof getDeviceProtocolByDevice;
  getDeviceProtocolByProtocol: typeof getDeviceProtocolByProtocol;
};

export default service;
