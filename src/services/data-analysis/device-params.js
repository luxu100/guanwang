/**
 * 设备参数分析接口封装，包含设备设置、设备日数据和状态上报查询。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
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
