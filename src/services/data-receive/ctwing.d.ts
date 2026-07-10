export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export type ServicePayload = Record<string, unknown>;

export function receiveCtwingDeviceUpData(data: ServicePayload): Promise<ApiResponse>;
export function receiveCtwingDeviceOnlineStatus(data: ServicePayload): Promise<ApiResponse>;
export function receiveCtwingDeviceCommandResult(data: ServicePayload): Promise<ApiResponse>;
export function receiveCtwingDeviceCommandReturned(data: ServicePayload): Promise<ApiResponse>;

declare const service: {
  receiveCtwingDeviceUpData: typeof receiveCtwingDeviceUpData;
  receiveCtwingDeviceOnlineStatus: typeof receiveCtwingDeviceOnlineStatus;
  receiveCtwingDeviceCommandResult: typeof receiveCtwingDeviceCommandResult;
  receiveCtwingDeviceCommandReturned: typeof receiveCtwingDeviceCommandReturned;
};

export default service;
