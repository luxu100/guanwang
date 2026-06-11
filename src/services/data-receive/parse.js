import { createCrudService, getRequest, postRequest } from "@/services/shared/crud";

const protocolFieldDefinitionApi = createCrudService("/api/protocol-field-definition");
const protocolParseRecordApi = createCrudService("/api/protocol-parse-record");

export const getProtocolFieldPage = protocolFieldDefinitionApi.getPage;
export const getProtocolFieldDetail = protocolFieldDefinitionApi.getDetail;
export const createProtocolField = protocolFieldDefinitionApi.create;
export const updateProtocolField = protocolFieldDefinitionApi.update;
export const deleteProtocolField = protocolFieldDefinitionApi.delete;

export const getProtocolParseRecordPage = protocolParseRecordApi.getPage;

export function getFieldsByProtocol(protocolId, params) {
  return getRequest(`/api/protocol-field-definition/by-protocol/${protocolId}`, params);
}

export function batchSaveProtocolFields(data) {
  return postRequest("/api/protocol-field-definition/batch-save", data);
}

export default {
  getProtocolFieldPage,
  getProtocolFieldDetail,
  createProtocolField,
  updateProtocolField,
  deleteProtocolField,
  getProtocolParseRecordPage,
  getFieldsByProtocol,
  batchSaveProtocolFields,
};
