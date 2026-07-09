/**
 * 电信云回调接口封装。
 *
 * 通常由后端接收回调，前端仅在调试或联调时需要显式调用。
 */
import { postRequest } from "@/services/shared/crud";

export function receiveCtwingDeviceUpData(data) {
  return postRequest("/api/ctwing/device/up-data", data);
}

export function receiveCtwingDeviceOnlineStatus(data) {
  return postRequest("/api/ctwing/device/online-status", data);
}

export function receiveCtwingDeviceCommandResult(data) {
  return postRequest("/api/ctwing/device/command-result", data);
}

export function receiveCtwingDeviceCommandReturned(data) {
  return postRequest("/api/ctwing/device/command-returned", data);
}

export default {
  receiveCtwingDeviceUpData,
  receiveCtwingDeviceOnlineStatus,
  receiveCtwingDeviceCommandResult,
  receiveCtwingDeviceCommandReturned,
};
