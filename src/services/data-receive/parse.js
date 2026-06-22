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

export const getProtocolParseRecordPage = protocolParseRecordApi.getPage;

export function batchSaveProtocolFields(data) {
  return postRequest("/api/protocol-field-definition/batch-save", data);
}

export function getFieldsByProtocol(protocolId, params) {
  return getRequest(`/api/protocol-field-definition/by-protocol/${protocolId}`, params);
}

export default {
  getProtocolFieldPage,
  getProtocolFieldDetail,
  createProtocolField,
  updateProtocolField,
  deleteProtocolField,
  batchSaveProtocolFields,
  getProtocolParseRecordPage,
  getFieldsByProtocol,
};
