export interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
  timestamp?: number;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size?: number;
  current?: number;
}

export type ServiceId = string | number;
export type ServiceQuery = Record<string, unknown>;

export interface ProtocolDefinition {
  id?: ServiceId;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  protocolCode?: string;
  protocolName?: string;
  protocolVersion?: string;
  description?: string;
  enabled?: boolean;
  priority?: number;
}

export interface DeviceProtocolRelation {
  id?: ServiceId;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  deviceId?: ServiceId;
  deviceName?: string;
  deviceAlias?: string;
  deviceNumber?: string;
  protocolId?: ServiceId;
  protocolName?: string;
  afn?: string;
  taskType?: string;
  contentPrefix?: string;
  priority?: number;
  enabled?: boolean;
}

export interface DeviceProtocolRelationQuery extends ServiceQuery {
  pageNum?: number;
  pageSize?: number;
  startTime?: string;
  endTime?: string;
  sortOrder?: "asc" | "desc" | string;
  sortField?: string;
  deviceNumber?: string;
  deviceAlias?: string;
}

export function getProtocolDefinitionPage(data: ServiceQuery): Promise<ApiResponse<PageResult<ProtocolDefinition>>>;
export function getProtocolDefinitionList(params?: ServiceQuery): Promise<ApiResponse<ProtocolDefinition[]>>;
export function getProtocolDefinitionDetail(id: ServiceId): Promise<ApiResponse<ProtocolDefinition>>;
export function createProtocolDefinition(data: ProtocolDefinition): Promise<ApiResponse<ProtocolDefinition>>;
export function updateProtocolDefinition(id: ServiceId, data: ProtocolDefinition): Promise<ApiResponse<boolean>>;
export function deleteProtocolDefinition(id: ServiceId, isForce?: boolean): Promise<ApiResponse<boolean>>;
export function batchDeleteProtocolDefinition(data: ServiceId[], isForce?: boolean): Promise<ApiResponse<boolean>>;

export function getDeviceProtocolRelationPage(data: DeviceProtocolRelationQuery): Promise<ApiResponse<PageResult<DeviceProtocolRelation>>>;
export function getDeviceProtocolRelationList(params?: ServiceQuery): Promise<ApiResponse<DeviceProtocolRelation[]>>;
export function getDeviceProtocolRelationDetail(id: ServiceId): Promise<ApiResponse<DeviceProtocolRelation>>;
export function createDeviceProtocolRelation(data: DeviceProtocolRelation): Promise<ApiResponse<DeviceProtocolRelation>>;
export function updateDeviceProtocolRelation(id: ServiceId, data: DeviceProtocolRelation): Promise<ApiResponse<boolean>>;
export function deleteDeviceProtocolRelation(id: ServiceId, isForce?: boolean): Promise<ApiResponse<boolean>>;
export function batchDeleteDeviceProtocolRelation(data: ServiceId[], isForce?: boolean): Promise<ApiResponse<boolean>>;
export function getDeviceProtocolRelationByDevice(deviceId: ServiceId, params?: ServiceQuery): Promise<ApiResponse<DeviceProtocolRelation[]>>;
export function getDeviceProtocolRelationByProtocol(protocolId: ServiceId, params?: ServiceQuery): Promise<ApiResponse<DeviceProtocolRelation[]>>;

declare const service: {
  getProtocolDefinitionPage: typeof getProtocolDefinitionPage;
  getProtocolDefinitionList: typeof getProtocolDefinitionList;
  getProtocolDefinitionDetail: typeof getProtocolDefinitionDetail;
  createProtocolDefinition: typeof createProtocolDefinition;
  updateProtocolDefinition: typeof updateProtocolDefinition;
  deleteProtocolDefinition: typeof deleteProtocolDefinition;
  batchDeleteProtocolDefinition: typeof batchDeleteProtocolDefinition;
  getDeviceProtocolRelationPage: typeof getDeviceProtocolRelationPage;
  getDeviceProtocolRelationList: typeof getDeviceProtocolRelationList;
  getDeviceProtocolRelationDetail: typeof getDeviceProtocolRelationDetail;
  createDeviceProtocolRelation: typeof createDeviceProtocolRelation;
  updateDeviceProtocolRelation: typeof updateDeviceProtocolRelation;
  deleteDeviceProtocolRelation: typeof deleteDeviceProtocolRelation;
  batchDeleteDeviceProtocolRelation: typeof batchDeleteDeviceProtocolRelation;
  getDeviceProtocolRelationByDevice: typeof getDeviceProtocolRelationByDevice;
  getDeviceProtocolRelationByProtocol: typeof getDeviceProtocolRelationByProtocol;
};

export default service;
