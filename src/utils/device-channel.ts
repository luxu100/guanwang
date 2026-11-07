export type DeviceTransportChannel = "DIRECT_TCP" | "AEP_NB" | "AEP_TCP" | "INVALID";

export interface DeviceChannelFields {
  aepProtocol?: string | null;
  nbNumber?: string | null;
  onlineStatus?: number | null;
  tcpOnlineStatus?: number | null;
  productId?: string | number | null;
  downlinkProtocolVersion?: string | null;
}

export function getDeviceConfigurationIssue(device: DeviceChannelFields, localeText: (zh: string, en: string) => string): string {
  const channel = getDeviceChannel(device);
  if (channel === "INVALID") return localeText("云通道协议缺失或无效", "Missing or invalid cloud protocol");
  if (channel === "DIRECT_TCP") return "";
  if (!String(device.nbNumber ?? "").trim()) return localeText("缺少电信平台设备 ID", "Missing CTWing device ID");
  if (!device.productId) return localeText("缺少云产品关联", "Missing cloud product");
  if (!device.downlinkProtocolVersion) return localeText("缺少下发协议版本，等待识别", "Missing downlink protocol version; awaiting detection");
  if (!["NEW", "LEGACY"].includes(device.downlinkProtocolVersion)) return localeText("下发协议版本无效", "Invalid downlink protocol version");
  return "";
}

export function getDeviceChannel(device: DeviceChannelFields): DeviceTransportChannel {
  const protocol = String(device.aepProtocol ?? "").trim().toLowerCase();
  if (protocol === "tcp") return "AEP_TCP";
  if (protocol === "lwm2m") return "AEP_NB";
  if (protocol || String(device.nbNumber ?? "").trim()) return "INVALID";
  return "DIRECT_TCP";
}

export function getDeviceOnline(device: DeviceChannelFields): boolean | null {
  const channel = getDeviceChannel(device);
  if (channel === "INVALID") return null;
  const value = channel === "DIRECT_TCP" ? device.tcpOnlineStatus : device.onlineStatus;
  if (value === 1) return true;
  if (value === 0) return false;
  return null;
}

export function getDeviceChannelText(channel: DeviceTransportChannel, localeText: (zh: string, en: string) => string): string {
  return ({
    DIRECT_TCP: localeText("TCP 直连", "Direct TCP"),
    AEP_NB: localeText("电信云 NB", "CTWing NB"),
    AEP_TCP: localeText("电信云 4G", "CTWing 4G"),
    INVALID: localeText("配置待核对", "Configuration needs review"),
  })[channel];
}
