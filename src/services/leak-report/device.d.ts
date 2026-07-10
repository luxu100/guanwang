export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export interface DeviceOption extends Record<string, unknown> {
  deviceNumber: string;
}

export function getDeviceVisibleList(params?: Record<string, unknown>): Promise<ApiResponse<DeviceOption[]>>;

declare const service: {
  getDeviceVisibleList: typeof getDeviceVisibleList;
};

export default service;
