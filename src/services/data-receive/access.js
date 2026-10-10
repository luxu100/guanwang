/**
 * 数据接入接口封装，包含协议定义和设备协议绑定能力。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService, getRequest } from "@/services/shared/crud";
import { buildBindingPayload, assertProtocolResponse } from "@/services/device/protocolBinding";

const protocolDefinitionApi = createCrudService("/api/protocol-definition");
const deviceProtocolRelationApi = createCrudService("/api/device-protocol-relation");

export async function getProtocolDefinitionPage(data) { return assertProtocolResponse(await protocolDefinitionApi.getPage(data)); }
export async function getProtocolDefinitionList(params) { return assertProtocolResponse(await protocolDefinitionApi.getList(params)); }
export async function getProtocolDefinitionDetail(id) { return assertProtocolResponse(await protocolDefinitionApi.getDetail(id)); }
export async function createProtocolDefinition(data) { return assertProtocolResponse(await protocolDefinitionApi.create(data)); }
export async function updateProtocolDefinition(id, data) { return assertProtocolResponse(await protocolDefinitionApi.update(id, data), true); }
export async function deleteProtocolDefinition(id, isForce) { return assertProtocolResponse(await protocolDefinitionApi.delete(id, isForce)); }
export async function batchDeleteProtocolDefinition(data, isForce) { return assertProtocolResponse(await protocolDefinitionApi.batchDelete(data, isForce)); }

export async function getDeviceProtocolRelationPage(data) {
  return assertProtocolResponse(await deviceProtocolRelationApi.getPage(data));
}
export async function getDeviceProtocolRelationList(params) {
  return assertProtocolResponse(await deviceProtocolRelationApi.getList(params));
}
export async function getDeviceProtocolRelationDetail(id) {
  return assertProtocolResponse(await deviceProtocolRelationApi.getDetail(id));
}
export async function createDeviceProtocolRelation(data) {
  return assertProtocolResponse(await deviceProtocolRelationApi.create(buildBindingPayload(data, true)));
}
export async function updateDeviceProtocolRelation(id, data) {
  return assertProtocolResponse(await deviceProtocolRelationApi.update(id, buildBindingPayload(data)), true);
}
export async function deleteDeviceProtocolRelation(id, isForce) {
  return assertProtocolResponse(await deviceProtocolRelationApi.delete(id, isForce));
}
export async function batchDeleteDeviceProtocolRelation(ids, isForce) {
  return assertProtocolResponse(await deviceProtocolRelationApi.batchDelete(ids, isForce));
}

export async function getDeviceProtocolRelationByDevice(deviceId, params) {
  return assertProtocolResponse(await getRequest(`/api/device-protocol-relation/by-device/${deviceId}`, params));
}

export async function getDeviceProtocolRelationByProtocol(protocolId, params) {
  return assertProtocolResponse(await getRequest(`/api/device-protocol-relation/by-protocol/${protocolId}`, params));
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
