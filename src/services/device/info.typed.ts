import {createCrudServiceTyped, getRequestT, postRequestT} from "@/services/shared/crud.typed";
import { getRequest, postRequest } from "@/services/shared/crud";
import type {
  Dept,
  DeptDevice,
  DeptTreeVO,
  Device,
  DeviceProduct,
  DeviceProtocol,
  DeviceRelationInfoVO,
  TubeNetwork,
  Valve
} from "./types";
import type {ApiResponse, PageResult} from "@/types/api";

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
  return getRequestT<Dept>(`/api/dept/${id}`);
}

const deptApi = createCrudServiceTyped<Dept>("/api/dept");

export const getDeptPageT = deptApi.getPage;
export const getDeptListT = deptApi.getList;
export const getDeptDetailT = deptApi.getDetail;
export const createDeptT = deptApi.create;
export const updateDeptT = deptApi.update;
export const deleteDeptT = deptApi.delete;
export const batchDeleteDeptT = deptApi.batchDelete;

export function getDeptTreeT() {
  return getRequestT<DeptTreeVO[]>(
      "/api/dept/tree"
  );
}

const deptDeviceApi = createCrudServiceTyped<DeptDevice>("/api/dept-device");

export const getDeptDevicePageT = deptDeviceApi.getPage;
export const getDeptDeviceListT = deptDeviceApi.getList;
export const getDeptDeviceDetailT = deptDeviceApi.getDetail;
export const createDeptDeviceT = deptDeviceApi.create;
export const updateDeptDeviceT = deptDeviceApi.update;
export const deleteDeptDeviceT = deptDeviceApi.delete;
export const batchDeleteDeptDeviceT = deptDeviceApi.batchDelete;

const valveApi = createCrudServiceTyped<Valve>("/api/valve");

export const getValvePageT = valveApi.getPage;
export const getValveListT = valveApi.getList;
export const getValveDetailT = valveApi.getDetail;
export const createValveT = valveApi.create;
export const updateValveT = valveApi.update;
export const deleteValveT = valveApi.delete;
export const batchDeleteValveT = valveApi.batchDelete;

export function bindValveDevicesT(valveId: string | number, data: Record<string, any>) {
  return postRequest(`/api/valve/${valveId}/bind-devices`, data);
}

export function unbindValveDevicesT(valveId: string | number, data: Record<string, any>) {
  return postRequest(`/api/valve/${valveId}/unbind-devices`, data);
}

export function getValveDeviceListT(valveId: string | number, params?: Record<string, any>) {
  return getRequestT<Device[]>(`/api/valve/${valveId}/devices`, params);
}

export function getValveDevicePageT(valveId: string | number, data: Record<string, any> = {}) {
  return postRequest(`/api/valve/${valveId}/devices/page`, data);
}

export function getDeviceRelationInfoT(id: number) {
  return getRequestT<DeviceRelationInfoVO>(
      `/api/device/${id}/relation-info`
  );
}

export function getDeviceInfoPageT<T>(
    data: Record<string, any>
): Promise<ApiResponse<PageResult<T>>> {
  return postRequestT<PageResult<T>>(
      '/api/device-query/device-info/page',
      data
  );
}