/**
 * 设备接口封装，用于获取当前用户可见设备列表。
 * 调用 GET /api/device/visible-list，后端自动按用户绑定部门过滤。
 */
import { getRequest } from "@/services/shared/crud";

export function getDeviceVisibleList(params) {
  return getRequest("/api/device/visible-list", params);
}

export default {
  getDeviceVisibleList,
};