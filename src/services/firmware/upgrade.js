/**
 * 固件升级操作接口封装。
 *
 * 对应后端 `/api/firmware-upgrade` 资源，包含升级检查、发起升级、
 * 取消升级，以及升级过程中的帧和上下行事件查询。
 */
import { getRequest, postRequest } from "@/services/shared/crud";

/** 发起固件升级。 */
export function startFirmwareUpgrade(data) {
  return postRequest("/api/firmware-upgrade/start", data);
}

/** 检查指定设备是否可以升级。 */
export function checkFirmwareUpdatable(data) {
  return postRequest("/api/firmware-upgrade/check-updatable", data);
}

/** 取消正在执行的固件升级。 */
export function cancelFirmwareUpgrade(data) {
  return postRequest("/api/firmware-upgrade/cancel", data);
}

/** 根据升级记录 ID 查询 TCP 直连固件升级帧。 */
export function getFirmwareUpgradeFrames(upgradeLogId) {
  return getRequest(`/api/firmware-upgrade/${encodeURIComponent(upgradeLogId)}/frames`);
}

/** 根据升级记录 ID 查询固件升级上下行事件。 */
export function getFirmwareUpgradeEvents(upgradeLogId) {
  return getRequest(`/api/firmware-upgrade/${encodeURIComponent(upgradeLogId)}/events`);
}

export default {
  startFirmwareUpgrade,
  checkFirmwareUpdatable,
  cancelFirmwareUpgrade,
  getFirmwareUpgradeFrames,
  getFirmwareUpgradeEvents,
};
