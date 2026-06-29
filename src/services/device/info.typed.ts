import {createCrudServiceTyped, getRequestT} from "@/services/shared/crud.typed";
import { getRequest } from "@/services/shared/crud";
import type {Dept, Device, DeviceProduct, DeviceProtocol, TubeNetwork} from "./types";
import type {ApiResponse} from "@/types/api";

// ================= device =================
const deviceApi = createCrudServiceTyped<Device>("/api/device");

export const getDevicePageT = deviceApi.getPage;
export const getDeviceListT = deviceApi.getList;
export const getDeviceDetailT = deviceApi.getDetail;
export const createDeviceT = deviceApi.create;
export const updateDeviceT = deviceApi.update;
export const deleteDeviceT = deviceApi.delete;
export const batchDeleteDeviceT = deviceApi.batchDelete;

// ================= device product =================
const deviceProductApi =
    createCrudServiceTyped<DeviceProduct>("/api/device-product");

export const getDeviceProductPageT = deviceProductApi.getPage;
export const getDeviceProductListT = deviceProductApi.getList;
export const getDeviceProductDetailT = deviceProductApi.getDetail;
export const createDeviceProductT = deviceProductApi.create;
export const updateDeviceProductT = deviceProductApi.update;
export const deleteDeviceProductT = deviceProductApi.delete;
export const batchDeleteDeviceProductT = deviceProductApi.batchDelete;

// ================= device protocol =================
const deviceProtocolApi =
    createCrudServiceTyped<DeviceProtocol>("/api/device-protocol-relation");

const tubeNetworkApi = createCrudServiceTyped<TubeNetwork>("/api/tube-network");

export const getDeviceProtocolPageT = deviceProtocolApi.getPage;
export const createDeviceProtocolT = deviceProtocolApi.create;

export function getDeviceProtocolByDeviceT(
    deviceId: string | number,
    params?: Record<string, any>
) {
  return getRequest(
      `/api/device-protocol-relation/by-device/${deviceId}`,
      params
  );
}

export function getDeviceProtocolByProtocolT(
    protocolId: string | number,
    params?: Record<string, any>
) {
  return getRequest(
      `/api/device-protocol-relation/by-protocol/${protocolId}`,
      params
  );
}

export function getDeviceProductByIdT(id: string | number) {
  return getRequestT<ApiResponse<DeviceProduct>>(`/api/device-product/${id}`);
}

export const getTubeNetworkListT = tubeNetworkApi.getList;

export function getDeptByIdT(id: string | number) {
  return getRequestT<ApiResponse<Dept>>(`/api/dept/${id}`);
}
