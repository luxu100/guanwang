/**
 * 设备参数设置接口封装。
 *
 * 对应后端 `/api/device-setting` 资源，包含参数设置记录查询、
 * 按需设置设备参数，以及单台设备参数设置任务结果查询。
 * 页面层应调用本文件导出的语义化方法，避免直接拼接接口地址。
 */
import { createCrudService, getRequest, postRequest } from "@/services/shared/crud";

const deviceSettingApi = createCrudService("/api/device-setting");

/** 分页查询设备参数设置记录。 */
export const getDeviceSettingPage = deviceSettingApi.getPage;

/**
 * 按需设置一台或多台设备参数。
 *
 * @param {object} data 与后端 DeviceParameterApplyDTO 保持一致。
 */
export function applyDeviceParameters(data) {
  return postRequest("/api/device-setting/apply", data);
}

/** 根据记录 ID 获取设备参数设置详情。 */
export const getDeviceSettingDetail = deviceSettingApi.getDetail;

/**
 * 根据记录 ID 查询单台设备参数设置任务状态。
 *
 * @param {string|number} id 设备参数设置记录 ID。
 */
export function getDeviceSettingResult(id) {
  return getRequest(`/api/device-setting/${encodeURIComponent(id)}/result`);
}

/** 获取全部设备参数设置记录。 */
export const getDeviceSettingList = deviceSettingApi.getList;

export default {
  getDeviceSettingPage,
  applyDeviceParameters,
  getDeviceSettingDetail,
  getDeviceSettingResult,
  getDeviceSettingList,
};
