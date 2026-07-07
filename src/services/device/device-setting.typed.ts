/**
 * 设备维护接口封装，围绕维护记录提供 CRUD 能力。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import {createCrudServiceTyped} from "@/services/shared/crud.typed";
import type {DeviceSetting} from "@/services/device/types";

const deviceSettingApi = createCrudServiceTyped<DeviceSetting>("/api/device-setting");

export const getDeviceSettingPageT = deviceSettingApi.getPage;
export const getDeviceSettingListT = deviceSettingApi.getList;
export const getDeviceSettingDetailT = deviceSettingApi.getDetail;
export const createDeviceSettingT = deviceSettingApi.create;
export const updateDeviceSettingT = deviceSettingApi.update;
export const deleteDeviceSettingT = deviceSettingApi.delete;
export const batchDeleteDeviceSettingT = deviceSettingApi.batchDelete;