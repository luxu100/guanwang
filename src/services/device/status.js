/**
 * 设备参数接口封装，包含设备参数、状态上报和设备日数据查询。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService } from "@/services/shared/crud";

const deviceApi = createCrudService("/api/device");
const deviceStatusUploadApi = createCrudService("/api/device-status-upload");
const deviceDailyDataApi = createCrudService("/api/device-daily-data");

export const getDeviceStatusPage = deviceApi.getPage;
export const getDeviceStatusDetail = deviceApi.getDetail;
export const updateDeviceStatus = deviceApi.update;

export const getDeviceStatusUploadPage = deviceStatusUploadApi.getPage;
export const getDeviceStatusUploadList = deviceStatusUploadApi.getList;
export const getDeviceStatusUploadDetail = deviceStatusUploadApi.getDetail;

export const getDeviceDailyDataPage = deviceDailyDataApi.getPage;
export const getDeviceDailyDataList = deviceDailyDataApi.getList;
export const getDeviceDailyDataDetail = deviceDailyDataApi.getDetail;

export default {
  getDeviceStatusPage,
  getDeviceStatusDetail,
  updateDeviceStatus,
  getDeviceStatusUploadPage,
  getDeviceStatusUploadList,
  getDeviceStatusUploadDetail,
  getDeviceDailyDataPage,
  getDeviceDailyDataList,
  getDeviceDailyDataDetail,
};
