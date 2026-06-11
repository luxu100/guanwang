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
