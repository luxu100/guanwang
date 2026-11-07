import type { ApiResponse, ServiceId } from "./manage";

/** Request and response DTOs for firmware upgrade operations. */
export interface FirmwareUpgradeStartParams { firmwareId: number | string; deviceNumbers: string[]; createUser?: string }
export interface FirmwareUpgradeCheckParams { deviceNumbers: string[] }
export interface FirmwareUpgradeCancelParams { upgradeLogIds: Array<number | string> }
export interface FirmwareUpgradeStartResult { upgradeLogIds: Array<number | string> }
export interface FirmwareDeviceUpdatable { deviceNumber: string; updatable: boolean; reason?: string | null }
export interface FirmwareUpgradeFrame {
  id: number; frameIndex: number; payloadHex?: string; dataLength?: number;
  sendStatus?: number; sendRound?: number; sendAttempts?: number;
  lastSessionId?: string | null; lastSentAt?: string | null;
}
export interface FirmwareUpgradeEvent {
  id: number; upgradeLogId?: number; deviceNumber?: string; direction?: string;
  directionName?: string; eventType?: string; eventTypeName?: string; eventLevel?: string;
  summary?: string; frameIndex?: number | null; sessionId?: string | null; rawHex?: string | null;
  rawHexBytes?: number | null; detail?: string | null; createdAt?: string; updatedAt?: string;
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

/** 查询不同传输通道的固件升级帧。 */
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
