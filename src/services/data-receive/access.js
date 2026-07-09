/**
 * 数据接入接口封装，包含协议定义和设备协议绑定能力。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService, getRequest } from "@/services/shared/crud";

const protocolDefinitionApi = createCrudService("/api/protocol-definition");
const deviceProtocolRelationApi = createCrudService("/api/device-protocol-relation");

export const getProtocolDefinitionPage = protocolDefinitionApi.getPage;
export const getProtocolDefinitionList = protocolDefinitionApi.getList;
export const getProtocolDefinitionDetail = protocolDefinitionApi.getDetail;
export const createProtocolDefinition = protocolDefinitionApi.create;
export const updateProtocolDefinition = protocolDefinitionApi.update;
export const deleteProtocolDefinition = protocolDefinitionApi.delete;
export const batchDeleteProtocolDefinition = protocolDefinitionApi.batchDelete;

export const getDeviceProtocolRelationPage = deviceProtocolRelationApi.getPage;
export const getDeviceProtocolRelationList = deviceProtocolRelationApi.getList;
export const getDeviceProtocolRelationDetail = deviceProtocolRelationApi.getDetail;
export const createDeviceProtocolRelation = deviceProtocolRelationApi.create;
export const updateDeviceProtocolRelation = deviceProtocolRelationApi.update;
export const deleteDeviceProtocolRelation = deviceProtocolRelationApi.delete;
export const batchDeleteDeviceProtocolRelation = deviceProtocolRelationApi.batchDelete;

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
  batchDeleteProtocolDefinition,
  getDeviceProtocolRelationPage,
  getDeviceProtocolRelationList,
  getDeviceProtocolRelationDetail,
  createDeviceProtocolRelation,
  updateDeviceProtocolRelation,
  deleteDeviceProtocolRelation,
  batchDeleteDeviceProtocolRelation,
  getDeviceProtocolRelationByDevice,
  getDeviceProtocolRelationByProtocol,
};
