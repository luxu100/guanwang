/**
 * 设备参数接口封装，包含设备参数、状态上报和设备日数据查询。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudServiceTyped } from "@/services/shared/crud.typed";
import type {DeviceStatusVO} from "@/services/device/types";

const deviceStatusUploadApi = createCrudServiceTyped<DeviceStatusVO>("/api/device-status-upload");
export const getDeviceStatusUploadPageT = deviceStatusUploadApi.getPage;
export const getDeviceStatusUploadListT = deviceStatusUploadApi.getList;
export const getDeviceStatusUploadDetailT = deviceStatusUploadApi.getDetail;

export default {
  getDeviceStatusUploadPageT,
  getDeviceStatusUploadListT,
  getDeviceStatusUploadDetailT,
};
