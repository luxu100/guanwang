export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

export interface PageInfo<T = unknown> {
  records?: T[];
  total?: number;
  size?: number;
  current?: number;
}

export type DeviceId = string | number;
export type EventType = "CREATE" | "INSTALL" | "MAINTAIN" | "REMOVE" | "REPAIR" | "INSPECT" | "SCRAP";

export interface DeviceResumeItem {
  id: DeviceId;
  deviceNumber: string;
  deviceAlias?: string;
  deptNames?: string;
  deviceType?: string;
  status?: string;
  /** 0 离线，1 在线；缺失时显示 —。 */
  onlineStatus?: number | null;
  installTime?: string;
  installAddress?: string;
}

export interface LifecycleEvent {
  id: DeviceId;
  deviceId: DeviceId;
  eventType: string;
  eventName: string;
  eventTime: string;
  operatorId?: DeviceId;
  operatorName?: string;
  address?: string;
  coordinate?: string;
  beforeStatus?: string;
  afterStatus?: string;
  description?: string;
  remark?: string;
}

export interface DeviceResumeQuery {
  pageNum: number;
  pageSize: number;
  deviceNumber?: string;
  deptId?: DeviceId;
}

export interface DepartmentNode {
  id: DeviceId;
  deptName?: string;
  name?: string;
  children?: DepartmentNode[];
}

/** POST /api/device-query/device-info/page */
export function getDeviceResumePage(data: DeviceResumeQuery): Promise<ApiResponse<PageInfo<DeviceResumeItem>>>;
/** GET /api/device/{deviceId}/lifecycle */
export function getDeviceLifecycle(deviceId: DeviceId): Promise<ApiResponse<LifecycleEvent[]>>;
/** GET /api/dept/tree */
export function getDeviceResumeDeptTree(): Promise<ApiResponse<DepartmentNode[]>>;

declare const service: {
  getDeviceResumePage: typeof getDeviceResumePage;
  getDeviceLifecycle: typeof getDeviceLifecycle;
  getDeviceResumeDeptTree: typeof getDeviceResumeDeptTree;
};
export default service;
