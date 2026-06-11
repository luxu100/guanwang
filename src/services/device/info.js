import { createCrudService, getRequest } from "@/services/shared/crud";

const deviceApi = createCrudService("/api/device");
const deviceProductApi = createCrudService("/api/device-product");
const deviceProtocolApi = createCrudService("/api/device-protocol-relation");

export const getDevicePage = deviceApi.getPage;
export const getDeviceList = deviceApi.getList;
export const getDeviceDetail = deviceApi.getDetail;
export const createDevice = deviceApi.create;
export const updateDevice = deviceApi.update;
export const deleteDevice = deviceApi.delete;
export const batchDeleteDevice = deviceApi.batchDelete;

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

export default {
  getDevicePage,
  getDeviceList,
  getDeviceDetail,
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
};
