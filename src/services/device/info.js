/**
 * 设备信息接口封装，包含设备、设备产品和设备协议绑定能力。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService, getRequest, postRequest } from "@/services/shared/crud";

const deviceApi = createCrudService("/api/device");
const deviceProductApi = createCrudService("/api/device-product");
const deviceProtocolApi = createCrudService("/api/device-protocol-relation");
const valveApi = createCrudService("/api/valve");

export const getDevicePage = deviceApi.getPage;
export const getDeviceList = deviceApi.getList;
export const getDeviceDetail = deviceApi.getDetail;
export const createDevice = deviceApi.create;
export const updateDevice = deviceApi.update;
export const deleteDevice = deviceApi.delete;
export const batchDeleteDevice = deviceApi.batchDelete;

export function getDeviceFullDetail(id) {
  return getRequest(`/api/device/${id}/detail`);
}

export function getVisibleDeviceList(params) {
  return getRequest("/api/device/visible-list", params);
}

export const getDeviceProductPage = deviceProductApi.getPage;
export const getDeviceProductList = deviceProductApi.getList;
export const getDeviceProductDetail = deviceProductApi.getDetail;
export const createDeviceProduct = deviceProductApi.create;
export const updateDeviceProduct = deviceProductApi.update;
export const deleteDeviceProduct = deviceProductApi.delete;
export const batchDeleteDeviceProduct = deviceProductApi.batchDelete;

export const getDeviceProtocolPage = deviceProtocolApi.getPage;
export const createDeviceProtocol = deviceProtocolApi.create;

export function getDeviceProtocolByDevice(deviceId, params) {
  return getRequest(`/api/device-protocol-relation/by-device/${deviceId}`, params);
}

export function getDeviceProtocolByProtocol(protocolId, params) {
  return getRequest(`/api/device-protocol-relation/by-protocol/${protocolId}`, params);
}

export const getValvePage = valveApi.getPage;
export const getValveList = valveApi.getList;
export const getValveDetail = valveApi.getDetail;
export const createValve = valveApi.create;
export const updateValve = valveApi.update;
export const deleteValve = valveApi.delete;
export const batchDeleteValve = valveApi.batchDelete;

export function createValveDirect(data) {
  return postRequest("/api/valve", data);
}

export function bindValveDevices(valveId, data) {
  return postRequest(`/api/valve/${valveId}/bind-devices`, data);
}

export function unbindValveDevices(valveId, data) {
  return postRequest(`/api/valve/${valveId}/unbind-devices`, data);
}

export function getValveDeviceList(valveId, params) {
  return getRequest(`/api/valve/${valveId}/devices`, params);
}

export function getValveDevicePage(valveId, data = {}) {
  return postRequest(`/api/valve/${valveId}/devices/page`, data);
}

export default {
  getDevicePage,
  getDeviceList,
  getDeviceDetail,
  getDeviceFullDetail,
  getVisibleDeviceList,
  createDevice,
  updateDevice,
  deleteDevice,
  batchDeleteDevice,
  getDeviceProductPage,
  getDeviceProductList,
  getDeviceProductDetail,
  createDeviceProduct,
  updateDeviceProduct,
  deleteDeviceProduct,
  batchDeleteDeviceProduct,
  getDeviceProtocolPage,
  createDeviceProtocol,
  getDeviceProtocolByDevice,
  getDeviceProtocolByProtocol,
  getValvePage,
  getValveList,
  getValveDetail,
  createValve,
  createValveDirect,
  updateValve,
  deleteValve,
  batchDeleteValve,
  bindValveDevices,
  unbindValveDevices,
  getValveDeviceList,
  getValveDevicePage,
};
