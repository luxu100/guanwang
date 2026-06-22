import type { ApiResponse, PageResult, ServiceId, ServiceQuery } from "@/services/data-receive/access";

export interface ProtocolFieldDefinition {
  id?: ServiceId;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  protocolId?: ServiceId;
  afn?: string;
  taskType?: string;
  taskTypeName?: string;
  contentPrefix?: string;
  fieldName?: string;
  fieldCnName?: string;
  startPosition?: number;
  fieldLength?: number;
  positionUnit?: string;
  format?: string;
  scale?: string;
  outputType?: string;
  unit?: string;
  required?: boolean;
  defaultValue?: string;
  invalidValues?: string;
  enumMapping?: string;
  description?: string;
  sortOrder?: number;
  enabled?: boolean;
}

export interface ProtocolParseRecord {
  id?: ServiceId;
  traceId?: string;
  channel?: string;
  deviceId?: ServiceId;
  deviceNumber?: string;
  protocolId?: ServiceId;
  protocolCode?: string;
  protocolName?: string;
  protocolVersion?: string;
  afn?: string;
  taskType?: string;
  taskTypeName?: string;
  contentPrefix?: string;
  commandGroup?: string;
  frameCount?: number;
  contentBytes?: string;
  fieldCount?: number;
  parseStatus?: string;
  errorMessage?: string;
  parseTime?: string;
  values?: unknown;
}

export interface ProtocolParseRecordQuery extends ServiceQuery {
  deviceNumber?: string;
  protocolId?: ServiceId;
  afn?: string;
  taskType?: string;
  contentPrefix?: string;
  parseStatus?: string;
  fields?: string[];
}

export function getProtocolFieldPage(data: ServiceQuery): Promise<ApiResponse<PageResult<ProtocolFieldDefinition>>>;
export function getProtocolFieldDetail(id: ServiceId): Promise<ApiResponse<ProtocolFieldDefinition>>;
export function createProtocolField(data: ProtocolFieldDefinition): Promise<ApiResponse<ProtocolFieldDefinition>>;
export function updateProtocolField(id: ServiceId, data: ProtocolFieldDefinition): Promise<ApiResponse<boolean>>;
export function deleteProtocolField(id: ServiceId, isForce?: boolean): Promise<ApiResponse<boolean>>;
export function getProtocolParseRecordPage(data: ProtocolParseRecordQuery): Promise<ApiResponse<PageResult<ProtocolParseRecord>>>;
export function getFieldsByProtocol(protocolId: ServiceId, params?: ServiceQuery): Promise<ApiResponse<ProtocolFieldDefinition[]>>;

declare const service: {
  getProtocolFieldPage: typeof getProtocolFieldPage;
  getProtocolFieldDetail: typeof getProtocolFieldDetail;
  createProtocolField: typeof createProtocolField;
  updateProtocolField: typeof updateProtocolField;
  deleteProtocolField: typeof deleteProtocolField;
  getProtocolParseRecordPage: typeof getProtocolParseRecordPage;
  getFieldsByProtocol: typeof getFieldsByProtocol;
};

export default service;
