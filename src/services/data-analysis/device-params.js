import { createCrudService } from "@/services/shared/crud";

const deviceSettingApi = createCrudService("/api/device-setting");
const deviceDailyDataApi = createCrudService("/api/device-daily-data");
const deviceStatusUploadApi = createCrudService("/api/device-status-upload");

export const getDeviceSettingPage = deviceSettingApi.getPage;
export const getDeviceSettingList = deviceSettingApi.getList;
export const getDeviceSettingDetail = deviceSettingApi.getDetail;
export const createDeviceSetting = deviceSettingApi.create;
export const updateDeviceSetting = deviceSettingApi.update;
export const deleteDeviceSetting = deviceSettingApi.delete;
export const batchDeleteDeviceSetting = deviceSettingApi.batchDelete;

export const getDeviceDailyDataPage = deviceDailyDataApi.getPage;
export const getDeviceStatusUploadPage = deviceStatusUploadApi.getPage;

export default {
  getDeviceSettingPage,
  getDeviceSettingList,
  getDeviceSettingDetail,
  createDeviceSetting,
  updateDeviceSetting,
  deleteDeviceSetting,
  batchDeleteDeviceSetting,
  getDeviceDailyDataPage,
  getDeviceStatusUploadPage,
};
