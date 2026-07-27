import type { ApiResponse, ServiceId } from "./manage";

/** 发起固件升级参数，具体业务字段与后端 FirmwareUpgradeStartDTO 保持一致。 */
export interface FirmwareUpgradeStartParams {
  [key: string]: unknown;
}

/** 检查设备是否可升级参数。 */
export interface FirmwareUpgradeCheckParams {
  [key: string]: unknown;
}

/** 取消固件升级参数。 */
export interface FirmwareUpgradeCancelParams {
  [key: string]: unknown;
}

/** 发起升级后返回的信息。 */
export interface FirmwareUpgradeStartResult {
  [key: string]: unknown;
}

/** 设备可升级检查结果。 */
export interface FirmwareDeviceUpdatable {
  [key: string]: unknown;
}

/** TCP 直连固件升级帧。 */
export interface FirmwareUpgradeFrame {
  [key: string]: unknown;
}

/** 固件升级上下行事件。 */
export interface FirmwareUpgradeEvent {
  [key: string]: unknown;
}

/** 发起固件升级。 */
export function startFirmwareUpgrade(
  data: FirmwareUpgradeStartParams,
): Promise<ApiResponse<FirmwareUpgradeStartResult>>;

/** 检查指定设备是否可以升级。 */
export function checkFirmwareUpdatable(
  data: FirmwareUpgradeCheckParams,
): Promise<ApiResponse<FirmwareDeviceUpdatable[]>>;

/** 取消正在执行的固件升级。 */
export function cancelFirmwareUpgrade(
  data: FirmwareUpgradeCancelParams,
): Promise<ApiResponse<void>>;

/** 查询 TCP 直连固件升级帧。 */
export function getFirmwareUpgradeFrames(
  upgradeLogId: ServiceId,
): Promise<ApiResponse<FirmwareUpgradeFrame[]>>;

/** 查询固件升级上下行事件。 */
export function getFirmwareUpgradeEvents(
  upgradeLogId: ServiceId,
): Promise<ApiResponse<FirmwareUpgradeEvent[]>>;

declare const service: {
  startFirmwareUpgrade: typeof startFirmwareUpgrade;
  checkFirmwareUpdatable: typeof checkFirmwareUpdatable;
  cancelFirmwareUpgrade: typeof cancelFirmwareUpgrade;
  getFirmwareUpgradeFrames: typeof getFirmwareUpgradeFrames;
  getFirmwareUpgradeEvents: typeof getFirmwareUpgradeEvents;
};

export default service;
