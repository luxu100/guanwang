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
  id?: DeviceId;
  deviceNumber: string;
  deviceAlias?: string;
  deptNames?: string;
  deptName?: string;
  regionNames?: string;
  regionName?: string;
  deptId?: DeviceId;
  regionId?: DeviceId;
  deviceType?: string;
  status?: string;
  /** 0 离线，1 在线；缺失时显示 —。 */
  onlineStatus?: number | string | null;
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
  deviceType?: string;
  productId?: number;
  onlineStatus?: number;
  installState?: number;
  leakStatus?: number;
  startTime?: string;
  endTime?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

export interface DepartmentNode {
  id: DeviceId;
  deptName?: string;
  name?: string;
  children?: DepartmentNode[];
}

export interface DeviceLedgerQuery {
  pageNum: number;
  pageSize: number;
  deviceNumber?: string;
  deviceAlias?: string;
  deviceType?: string;
  algorithmType?: string;
  tubeGroup?: string;
  enableState?: number;
  onlineStatus?: number;
  tcpOnlineStatus?: number;
  leakStatus?: number;
  deptId?: DeviceId;
  startTime?: string;
  endTime?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

export interface DeviceLedgerItem {
  id: DeviceId;
  deviceNumber: string;
  [key: string]: unknown;
  deviceAlias?: string;
  deviceType?: string;
  serialNumber?: string;
  productName?: string;
  hardwareVersion?: string;
  softwareVersion?: string;
  enableState?: number;
  installState?: number;
  installMode?: number;
  installAddress?: string;
  installLongitude?: number;
  installLatitude?: number;
  onlineStatus?: number;
  leakStatus?: number;
  lastSamplingTime?: string;
  createdAt?: string;
}

export interface DeviceInstallDetail {
  [key: string]: unknown;
  deviceStatus?: number;
  installState?: number;
  installAddress?: string;
  coordinate?: string;
  deptNames?: string;
  valveNumber?: string;
  tubeNumber?: string;
  tubeMaterial?: string;
  tubeBore?: string;
  algorithmVersion?: string;
}

export interface DeviceMaintenanceQuery {
  pageNum: number;
  pageSize: number;
  deviceNumber?: string;
  deviceAlias?: string;
  installState?: number;
  valveNumber?: string;
  maintainType?: number;
  uninstallType?: number;
  startTime?: string;
  endTime?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

export interface DeviceMaintenanceItem {
  id: DeviceId;
  deviceId?: DeviceId;
  deviceNumber?: string;
  maintainType?: number;
  uninstallType?: number;
  maintainTime?: string;
  maintainAddress?: string;
  maintainCoordinate?: string;
  maintainAccount?: string;
  maintainFeedback?: string;
  installState?: number;
  maintainAddress?: string;
  maintainAccount?: string;
  maintainFeedback?: string;
  remark?: string;
  createdAt?: string;
}

export interface DeviceMaintenanceManageItem {
  id: DeviceId;
  deviceNumber?: string;
  maintainType?: number;
  uninstallType?: number;
  operationTime?: string;
  address?: string;
  operator?: string;
  remark?: string;
}

export interface ReportWorksheetQuery {
  pageNum: number;
  pageSize: number;
  worksheetNumber?: string;
  worksheetType?: number;
  worksheetStatus?: number;
  riseAccount?: string;
  executeAccount?: string;
  startTime?: string;
  endTime?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

export interface ReportWorksheetItem {
  id: DeviceId;
  worksheetNumber?: string;
  worksheetType?: number;
  worksheetStatus?: number;
  deviceReference?: string;
  riseTime?: string;
  finishTime?: string;
  deadlineTime?: string;
  createdAt?: string;
}

export interface ReportAlarmQuery {
  pageNum: number;
  pageSize: number;
  deviceId?: DeviceId;
  deviceNumber?: string;
  alarmType?: string;
  alarmLevel?: string;
  status?: string;
  deptId?: DeviceId;
  startTime?: string;
  endTime?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

export interface ReportAlarmItem {
  id: DeviceId;
  deviceId?: DeviceId;
  deviceNumber?: string;
  alarmType?: string;
  alarmLevel?: string;
  status?: string;
  firstTriggeredAt?: string;
  lastTriggeredAt?: string;
  recoveredAt?: string;
}

export interface ReportAlarmTrendQuery {
  startTime?: string;
  endTime?: string;
  granularity?: "DAY" | "WEEK" | "MONTH";
  deptId?: DeviceId;
  deviceId?: DeviceId;
  alarmType?: string;
  alarmLevel?: string;
}

export interface ReportAlarmTrend {
  granularity?: string;
  items?: Record<string, unknown>[];
}

/** 合并 POST /api/device-query/device-info/page 与 POST /api/device/page 的分页结果。 */
export function getDeviceResumePage(data: DeviceResumeQuery): Promise<ApiResponse<PageInfo<DeviceResumeItem>>>;
/** GET /api/region/tree */
export function getDeviceResumeDeptTree(): Promise<ApiResponse<DepartmentNode[]>>;
/** POST /api/device/page */
export function getDeviceLedgerPage(data: DeviceLedgerQuery): Promise<ApiResponse<PageInfo<DeviceLedgerItem>>>;
/** GET /api/device/{id} */
export function getDeviceLedgerDetail(deviceId: DeviceId): Promise<ApiResponse<DeviceLedgerItem>>;
/** GET /api/device/{id}/detail */
export function getDeviceLedgerInstallDetail(deviceId: DeviceId): Promise<ApiResponse<DeviceInstallDetail>>;
/** GET /api/device/{id}/relation-info */
export function getDeviceLedgerRelationInfo(deviceId: DeviceId): Promise<ApiResponse<Record<string, unknown>>>;
/** GET /api/valve/{id} */
export function getDeviceLedgerValveDetail(valveId: DeviceId): Promise<ApiResponse<Record<string, unknown>>>;
/** POST /api/maintenance-record/page */
export function getDeviceMaintenancePage(data: DeviceMaintenanceQuery): Promise<ApiResponse<PageInfo<DeviceMaintenanceItem>>>;
/** POST /api/maintenance-record/manage/page */
export function getDeviceMaintenanceManagePage(data: DeviceMaintenanceQuery): Promise<ApiResponse<PageInfo<DeviceMaintenanceManageItem>>>;
/** GET /api/maintenance-record/{id} */
export function getDeviceMaintenanceDetail(id: DeviceId): Promise<ApiResponse<DeviceMaintenanceItem>>;
/** POST /api/worksheet/page */
export function getReportWorksheetPage(data: ReportWorksheetQuery): Promise<ApiResponse<PageInfo<ReportWorksheetItem>>>;
/** POST /api/alarm-record/page */
export function getReportAlarmPage(data: ReportAlarmQuery): Promise<ApiResponse<PageInfo<ReportAlarmItem>>>;
/** POST /api/alarm-record/stats/trend */
export function getReportAlarmTrend(data: ReportAlarmTrendQuery): Promise<ApiResponse<ReportAlarmTrend>>;

declare const service: {
  getDeviceResumePage: typeof getDeviceResumePage;
  getDeviceResumeDeptTree: typeof getDeviceResumeDeptTree;
  getDeviceLedgerPage: typeof getDeviceLedgerPage;
  getDeviceLedgerDetail: typeof getDeviceLedgerDetail;
  getDeviceLedgerInstallDetail: typeof getDeviceLedgerInstallDetail;
  getDeviceLedgerRelationInfo: typeof getDeviceLedgerRelationInfo;
  getDeviceLedgerValveDetail: typeof getDeviceLedgerValveDetail;
  getDeviceMaintenancePage: typeof getDeviceMaintenancePage;
  getDeviceMaintenanceManagePage: typeof getDeviceMaintenanceManagePage;
  getDeviceMaintenanceDetail: typeof getDeviceMaintenanceDetail;
  getReportWorksheetPage: typeof getReportWorksheetPage;
  getReportAlarmPage: typeof getReportAlarmPage;
  getReportAlarmTrend: typeof getReportAlarmTrend;
};
export default service;
