import { createCrudService, getRequest } from "@/services/shared/crud";

const protocolDefinitionApi = createCrudService("/api/protocol-definition");
const deviceProtocolRelationApi = createCrudService("/api/device-protocol-relation");

export const getProtocolDefinitionPage = protocolDefinitionApi.getPage;
export const getProtocolDefinitionList = protocolDefinitionApi.getList;
export const getProtocolDefinitionDetail = protocolDefinitionApi.getDetail;
export const createProtocolDefinition = protocolDefinitionApi.create;
export const updateProtocolDefinition = protocolDefinitionApi.update;
export const deleteProtocolDefinition = protocolDefinitionApi.delete;

export const getDeviceProtocolRelationPage = deviceProtocolRelationApi.getPage;
export const createDeviceProtocolRelation = deviceProtocolRelationApi.create;

export function getDeviceProtocolRelationByDevice(deviceId, params) {
  return getRequest(`/api/device-protocol-relation/by-device/${deviceId}`, params);
}

export function getDeviceProtocolRelationByProtocol(protocolId, params) {
  return getRequest(`/api/device-protocol-relation/by-protocol/${protocolId}`, params);
}

export default {
  getProtocolDefinitionPage,
  getProtocolDefinitionList,
  getProtocolDefinitionDetail,
  createProtocolDefinition,
  updateProtocolDefinition,
  deleteProtocolDefinition,
  getDeviceProtocolRelationPage,
  createDeviceProtocolRelation,
  getDeviceProtocolRelationByDevice,
  getDeviceProtocolRelationByProtocol,
};
