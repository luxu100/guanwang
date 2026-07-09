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
  startBit?: number;
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

export interface ProtocolParseRecordJson extends Omit<ProtocolParseRecord, "contentBytes" | "values"> {
  contentBytes?: number;
  parsedJson?: string;
}

export interface FieldFormatMetadata {
  code?: string;
  name?: string;
  category?: string;
  description?: string;
  outputType?: string;
  dynamicLength?: boolean;
  supportedLengthBytes?: number[];
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
export function getProtocolFieldList(params?: ServiceQuery): Promise<ApiResponse<ProtocolFieldDefinition[]>>;
export function batchDeleteProtocolField(data: ServiceId[], isForce?: boolean): Promise<ApiResponse<boolean>>;
export function batchSaveProtocolFields(data: ProtocolFieldDefinition[]): Promise<ApiResponse<boolean>>;
export function getProtocolParseRecordPage(data: ProtocolParseRecordQuery): Promise<ApiResponse<PageResult<ProtocolParseRecord>>>;
export function getProtocolParseRecordList(params?: ServiceQuery): Promise<ApiResponse<ProtocolParseRecord[]>>;
export function getProtocolParseRecordDetail(id: ServiceId): Promise<ApiResponse<ProtocolParseRecord>>;
export function getProtocolParsedJsonPage(data: ProtocolParseRecordQuery): Promise<ApiResponse<PageResult<ProtocolParseRecordJson>>>;
export function getFieldsByProtocol(protocolId: ServiceId, params?: ServiceQuery): Promise<ApiResponse<ProtocolFieldDefinition[]>>;
export function getProtocolFieldFormats(params?: ServiceQuery): Promise<ApiResponse<FieldFormatMetadata[]>>;

declare const service: {
  getProtocolFieldPage: typeof getProtocolFieldPage;
  getProtocolFieldDetail: typeof getProtocolFieldDetail;
  createProtocolField: typeof createProtocolField;
  updateProtocolField: typeof updateProtocolField;
  deleteProtocolField: typeof deleteProtocolField;
  getProtocolFieldList: typeof getProtocolFieldList;
  batchDeleteProtocolField: typeof batchDeleteProtocolField;
  batchSaveProtocolFields: typeof batchSaveProtocolFields;
  getProtocolParseRecordPage: typeof getProtocolParseRecordPage;
  getProtocolParseRecordList: typeof getProtocolParseRecordList;
  getProtocolParseRecordDetail: typeof getProtocolParseRecordDetail;
  getProtocolParsedJsonPage: typeof getProtocolParsedJsonPage;
  getFieldsByProtocol: typeof getFieldsByProtocol;
  getProtocolFieldFormats: typeof getProtocolFieldFormats;
};

export default service;
