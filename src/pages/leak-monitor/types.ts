export type LeakDeviceStatus = "normal" | "suspect" | "leak" | "unknown";
export type LeakDeviceSource = "device-info" | "device-parameter";

export interface LeakMonitorFilters {
  leakLocatePeriod: string;
  deviceStatus: string;
  todayNew: string;
  latestInstall: string;
  deviceModel: string;
  keyword: string;
}

export interface LeakMonitorMetric {
  key: string;
  label: string;
  value: number | string;
  suffix?: string;
  tone: "success" | "primary" | "warning" | "danger" | "muted";
}

export interface LeakMonitorDevice {
  id: string | number;
  deviceNumber: string;
  name: string;
  status: LeakDeviceStatus;
  statusText: string;
  artificialStatus?: string;
  blueWhaleStatus?: string;
  probability?: number | string;
  lat?: number;
  lng?: number;
  source: LeakDeviceSource;
  raw: Record<string, unknown>;
}

export interface MapDevicePoint {
  id: string | number;
  deviceNumber: string;
  title: string;
  status: LeakDeviceStatus;
  lat: number;
  lng: number;
}

export interface PageState {
  current: number;
  size: number;
  total: number;
}

export interface DeviceDetailState {
  info?: Record<string, unknown>;
  parameter?: Record<string, unknown>;
  nearby?: unknown;
}
