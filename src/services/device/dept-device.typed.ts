import {createCrudServiceTyped, getRequestT, postRequestT} from "@/services/shared/crud.typed";
import type {DeptDevice, DeptTreeVO, Device, DeviceDeptVO, ValveBindDeviceDTO} from "@/services/device/types";

const deptDeviceApi = createCrudServiceTyped<DeptDevice>("/api/dept-device");

export const getDeptDevicePageT = deptDeviceApi.getPage;
export const getDeptDeviceListT = deptDeviceApi.getList;
export const getDeptDeviceDetailT = deptDeviceApi.getDetail;
export const createDeptDeviceT = deptDeviceApi.create;
export const updateDeptDeviceT = deptDeviceApi.update;
export const deleteDeptDeviceT = deptDeviceApi.delete;
export const batchDeleteDeptDeviceT = deptDeviceApi.batchDelete;

export function getDeptIdByDeviceId(deviceId: number) {
    return getRequestT<number>(`/api/dept-device/dept-id/${deviceId}`);
}

export function getDeptInfoByDeviceId(deviceId: number) {
    return getRequestT<DeviceDeptVO[]>(`/api/dept-device/dept-info/${deviceId}`);
}

/**
 * 阀门绑定设备
 */
export function bindValveDevices(
    valveId:number,
    dto:ValveBindDeviceDTO
){
    return postRequestT<Device[]>(
        `/api/valve/${valveId}/bind-devices`,
        dto
    );
}