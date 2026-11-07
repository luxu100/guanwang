/** 后端通用响应结构。 */
export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
  timestamp?: number;
}

/** 设备参数设置记录，具体字段与后端 DeviceSettingVO 保持一致。 */
export interface DeviceSetting {
  id?: number;
  deviceNumber?: string;
  recordSource?: "COMMAND" | "DEVICE_REPORT" | string;
  batchId?: string | null;
  commandSendLogId?: number | null;
  commandId?: number | null;
  commandExecuteStatus?: number | null;
  commandStatus?: string | null;
  commandFeedback?: string | null;
  commandSentAt?: string | null;
  commandExpiresAt?: string | null;
  createdAt?: string | null;
  [key: string]: unknown;
}

/** 设备参数设置分页查询参数。 */
export interface DeviceSettingPageParams {
  pageNum: number;
  pageSize: number;
  [key: string]: unknown;
}

/** 按需设置设备参数的请求参数，与后端 DeviceParameterApplyDTO 保持一致。 */
export interface DeviceParameterApplyParams {
  deviceNumbers: string[];
  parameters: Record<string, number | string>;
  clientRequestId?: string;
  expiresAt?: string;
}

/** 设备参数设置申请结果，与后端 DeviceParameterApplyVO 保持一致。 */
export interface DeviceParameterApplyResult {
  batchId: string;
  tasks: DeviceParameterTask[];
}

/** 单台设备参数设置任务状态，与后端 DeviceParameterTaskVO 保持一致。 */
export interface DeviceParameterTask {
  settingId?: number | null;
  commandId?: number | null;
  deviceNumber?: string;
  transportChannel?: "DIRECT_TCP" | "AEP_NB" | "AEP_TCP" | string | null;
  protocolVersion?: 0 | 1 | null;
  executeStatus?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | null;
  status?: string | null;
  feedback?: string | null;
  platformStatus?: string | null;
  deviceConfirmed?: boolean | null;
  confirmationSource?: "PLATFORM" | "DEVICE" | string | null;
  cloudOnline?: boolean | null;
  tcpOnline?: boolean | null;
  sentAt?: string | null;
  expiresAt?: string | null;
  [key: string]: unknown;
}

/** 通用分页结果，兼容 records 和 list 两种记录字段。 */
export interface PageResult<T> {
  records?: T[];
  list?: T[];
  total: number;
  pageNum?: number;
  pageSize?: number;
  pages?: number;
  [key: string]: unknown;
}

export type ServiceId = string | number;

/** 分页查询设备参数设置记录。 */
export function getDeviceSettingPage(
  data: DeviceSettingPageParams,
): Promise<ApiResponse<PageResult<DeviceSetting>>>;

/** 按需设置一台或多台设备参数。 */
export function applyDeviceParameters(
  data: DeviceParameterApplyParams,
): Promise<ApiResponse<DeviceParameterApplyResult>>;

/** 根据记录 ID 获取设备参数设置详情。 */
export function getDeviceSettingDetail(
  id: ServiceId,
): Promise<ApiResponse<DeviceSetting>>;

/** 查询单台设备参数设置任务状态。 */
export function getDeviceSettingResult(
  id: ServiceId,
): Promise<ApiResponse<DeviceParameterTask>>;

/** 获取全部设备参数设置记录。 */
export function getDeviceSettingList(): Promise<ApiResponse<DeviceSetting[]>>;

declare const service: {
  getDeviceSettingPage: typeof getDeviceSettingPage;
  applyDeviceParameters: typeof applyDeviceParameters;
  getDeviceSettingDetail: typeof getDeviceSettingDetail;
  getDeviceSettingResult: typeof getDeviceSettingResult;
  getDeviceSettingList: typeof getDeviceSettingList;
};

export default service;
