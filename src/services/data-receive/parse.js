/**
 * 数据解析接口封装，包含协议字段、解析记录和字段批量保存。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService, getRequest, postRequest } from "@/services/shared/crud";

const protocolFieldDefinitionApi = createCrudService("/api/protocol-field-definition");
const protocolParseRecordApi = createCrudService("/api/protocol-parse-record");

export const getProtocolFieldPage = protocolFieldDefinitionApi.getPage;
export const getProtocolFieldDetail = protocolFieldDefinitionApi.getDetail;
export const createProtocolField = protocolFieldDefinitionApi.create;
export const updateProtocolField = protocolFieldDefinitionApi.update;
export const deleteProtocolField = protocolFieldDefinitionApi.delete;
export const getProtocolFieldList = protocolFieldDefinitionApi.getList;
export const batchDeleteProtocolField = protocolFieldDefinitionApi.batchDelete;

export const getProtocolParseRecordPage = protocolParseRecordApi.getPage;
export const getProtocolParseRecordList = protocolParseRecordApi.getList;
export const getProtocolParseRecordDetail = protocolParseRecordApi.getDetail;

export function getProtocolParsedJsonPage(data) {
  return postRequest("/api/protocol-parse-record/parsed-json/page", data);
}

export function batchSaveProtocolFields(data) {
  return postRequest("/api/protocol-field-definition/batch-save", data);
}

export function getFieldsByProtocol(protocolId, params) {
  return getRequest(`/api/protocol-field-definition/by-protocol/${protocolId}`, params);
}

export function getProtocolFieldFormats(params) {
  return getRequest("/api/protocol-field-formats", params);
}

export default {
  getProtocolFieldPage,
  getProtocolFieldDetail,
  createProtocolField,
  updateProtocolField,
  deleteProtocolField,
  getProtocolFieldList,
  batchDeleteProtocolField,
  batchSaveProtocolFields,
  getProtocolParseRecordPage,
  getProtocolParseRecordList,
  getProtocolParseRecordDetail,
  getProtocolParsedJsonPage,
  getFieldsByProtocol,
  getProtocolFieldFormats,
};
