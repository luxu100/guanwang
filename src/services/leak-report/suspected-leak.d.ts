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

export interface SuspectPageQuery {
  pageNum?: number;
  pageSize?: number;
  startTime?: string;
  endTime?: string;
  sortOrder?: string;
  sortField?: string;
  processStatus?: number;
  detectType?: string;
  isLeakPoint?: number;
  leakPointType?: string;
  deptId?: number;
  deviceNumber?: string;
  reporter?: string;
}

export interface SuspectPayload {
  detectType?: string;
  processStatus?: number;
  isLeakPoint?: number;
  leakPointType?: string;
  initialLevel?: string;
  leakPointSize?: string;
  tubeBore?: string;
  tubeMaterial?: string;
  leakRoadSurface?: string;
  coordinatePosition?: string;
  leakPointPosition?: string;
  suspectSceneImages?: string;
  leakSceneImages?: string;
  sceneVideo?: string;
  reporter?: string;
  reportTime?: string;
  remark?: string;
  patrolNo?: string;
  repairStatus?: string;
  repairTime?: string;
  repairPerson?: string;
  leakUnit?: string;
  maintenanceUnit?: string;
  deptId?: number;
  deviceNumber?: string;
  noiseTime?: string;
  leakStatus?: string;
  featureValue?: string;
  audioFile?: string;
}

export interface DispatchPayload {
  workOrderNo?: string;
  expectedTime?: string;
  urgencyLevel?: string;
  workOrderCategory?: string;
  flowType?: string;
  processFlow?: string;
  handler?: string;
  remark?: string;
  deviceNo?: string;
  deviceId?: number;
  deptId?: number;
  leakageStatus?: string;
  installImage?: string;
  installAddress?: string;
  detail?: string;
}

export interface SuspectRecord {
  id?: number;
  detectType?: string;
  processStatus?: number;
  isLeakPoint?: number;
  leakPointType?: string;
  initialLevel?: string;
  leakPointSize?: string;
  tubeBore?: string;
  tubeMaterial?: string;
  leakRoadSurface?: string;
  coordinatePosition?: string;
  leakPointPosition?: string;
  suspectSceneImages?: string;
  leakSceneImages?: string;
  sceneVideo?: string;
  reporter?: string;
  reportTime?: string;
  remark?: string;
  patrolNo?: string;
  repairStatus?: string;
  repairTime?: string;
  repairPerson?: string;
  leakUnit?: string;
  maintenanceUnit?: string;
  deptId?: number;
  deviceNumber?: string;
  noiseTime?: string;
  leakStatus?: string;
  featureValue?: string;
  audioFile?: string;
  workOrderId?: number;
  workOrderNo?: string;
  leakPointRecordId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export function getSuspectPage(data: SuspectPageQuery): Promise<ApiResponse<PageInfo<SuspectRecord>>>;
export function getSuspectList(params?: Record<string, unknown>): Promise<ApiResponse<SuspectRecord[]>>;
export function getSuspectDetail(id: number | string): Promise<ApiResponse<SuspectRecord>>;
export function createSuspect(data: SuspectPayload): Promise<ApiResponse<SuspectRecord>>;
export function createSuspectDirect(data: SuspectPayload): Promise<ApiResponse<SuspectRecord>>;
export function updateSuspect(id: number | string, data: SuspectPayload): Promise<ApiResponse<SuspectRecord>>;
export function deleteSuspect(id: number | string, isForce?: boolean): Promise<ApiResponse>;
export function getCurrentUserSuspectList(params?: Record<string, unknown>): Promise<ApiResponse<SuspectRecord[]>>;
export function dispatchSuspect(id: number | string, data: DispatchPayload): Promise<ApiResponse>;
export function confirmLeakPoint(id: number | string, data: Record<string, unknown>): Promise<ApiResponse>;
export function confirmSuspectAsLeakPoint(id: number | string, data: Record<string, unknown>): Promise<ApiResponse>;
// excludeSuspect 已移除：后端不存在 /api/suspected-leak/{id}/exclude 路由。
// 状态 4 按后端合同显示"已取消"，不再作为自创"已排除"语义。

declare const service: {
  getSuspectPage: typeof getSuspectPage;
  getSuspectList: typeof getSuspectList;
  getSuspectDetail: typeof getSuspectDetail;
  createSuspect: typeof createSuspect;
  createSuspectDirect: typeof createSuspectDirect;
  updateSuspect: typeof updateSuspect;
  deleteSuspect: typeof deleteSuspect;
  getCurrentUserSuspectList: typeof getCurrentUserSuspectList;
  dispatchSuspect: typeof dispatchSuspect;
  confirmLeakPoint: typeof confirmLeakPoint;
  confirmSuspectAsLeakPoint: typeof confirmSuspectAsLeakPoint;
};

export default service;
