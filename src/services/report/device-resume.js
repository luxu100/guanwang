/**
 * 运维报表 — 设备履历接口封装。
 */
import { getRequest, postRequest } from "@/services/shared/crud";
import { getDeptTree } from "@/services/partition/partition";

/** 查询设备分页列表，复用现有设备信息分页接口。 */
export function getDeviceResumePage(data) {
  return postRequest("/api/device-query/device-info/page", data);
}

/** 获取设备建档、安装、维护、拆卸、维修、巡检、报废等履历。 */
export function getDeviceLifecycle(deviceId) {
  return getRequest(`/api/device/${encodeURIComponent(String(deviceId))}/lifecycle`);
}

/** 获取分区筛选树，复用分区模块请求。 */
export function getDeviceResumeDeptTree() {
  return getDeptTree();
}

export default {
  getDeviceResumePage,
  getDeviceLifecycle,
  getDeviceResumeDeptTree,
};
