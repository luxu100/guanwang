import { getRequest, postRequest } from "@/services/shared/crud";
import type {
  LeakDeviceSource,
  LeakDeviceStatus,
  LeakMonitorDevice,
  LeakMonitorFilters,
} from "@/pages/leak-monitor/types";

type ApiEnvelope<T = unknown> = {
  code?: number;
  msg?: string;
  data?: T;
  records?: unknown[];
  list?: unknown[];
  total?: number;
};

type PageResult = {
  records: LeakMonitorDevice[];
  total: number;
};

export function getDeviceQuerySidebar(data: Record<string, unknown>) {
  return postRequest("/api/device-query/sidebar", data);
}

export function getDeviceQueryTodayOnlineRate(data: Record<string, unknown>) {
  return postRequest("/api/device-query/sidebar/today-online-rate", data);
}

export function getDeviceQueryTcpTodayOnlineRate(data: Record<string, unknown>) {
  return postRequest("/api/device-query/sidebar/tcp-today-online-rate", data);
}

export function getDeviceQueryCommunicationSuccessRate(data: Record<string, unknown>) {
  return postRequest("/api/device-query/sidebar/communication-success-rate", data);
}

export function getDeviceQueryParameterPage(data: Record<string, unknown>) {
  return postRequest("/api/device-query/device-parameter/page", data);
}

export function getDeviceQueryInfoPage(data: Record<string, unknown>) {
  return postRequest("/api/device-query/device-info/page", data);
}

export function getDeviceQueryNearbyAnalysis(deviceNumber: string | number) {
  return getRequest(`/api/device-query/nearby-analysis/${deviceNumber}`);
}

export function getDeviceQueryParameterDetail(id: string | number) {
  return getRequest(`/api/device-query/device-parameter/${id}`);
}

export function getDeviceQueryInfoDetail(id: string | number) {
  return getRequest(`/api/device-query/device-info/${id}`);
}

function unwrapData<T = unknown>(response: ApiEnvelope<T> | T): T {
  if (response && typeof response === "object" && "data" in (response as ApiEnvelope<T>)) {
    return (response as ApiEnvelope<T>).data as T;
  }

  return response as T;
}

function readValue(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function toText(value: unknown, fallback = "") {
  if (value === undefined || value === null) {
    return fallback;
  }

  return String(value);
}

function normalizeStatus(row: Record<string, unknown>): { status: LeakDeviceStatus; text: string } {
  const value = toText(readValue(row, ["status", "deviceStatus", "leakStatus", "analysisStatus", "state"]), "unknown");
  const lowerValue = value.toLowerCase();

  if (["0", "normal", "online", "正常", "无噪声"].includes(lowerValue) || value.includes("正常")) {
    return { status: "normal", text: "正常" };
  }

  if (["1", "suspect", "疑似", "待探查"].includes(lowerValue) || value.includes("疑似")) {
    return { status: "suspect", text: "疑似" };
  }

  if (["2", "leak", "渗漏", "漏点"].includes(lowerValue) || value.includes("渗漏") || value.includes("漏")) {
    return { status: "leak", text: "渗漏" };
  }

  return { status: "unknown", text: value === "unknown" ? "未知" : value };
}

function normalizeDevice(row: unknown, source: LeakDeviceSource): LeakMonitorDevice {
  const record = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
  const deviceNumber = toText(readValue(record, ["deviceNumber", "deviceNo", "number", "code", "sn"]), "--");
  const id = readValue(record, ["id", "deviceId", "deviceID", "device_id"]) ?? deviceNumber;
  const lng = toNumber(readValue(record, ["lng", "longitude", "lon", "deviceLng", "gcjLng", "wgsLng"]));
  const lat = toNumber(readValue(record, ["lat", "latitude", "deviceLat", "gcjLat", "wgsLat"]));
  const status = normalizeStatus(record);

  return {
    id: id as string | number,
    deviceNumber,
    name: toText(readValue(record, ["deviceName", "name", "monitorName"]), deviceNumber),
    status: status.status,
    statusText: status.text,
    artificialStatus: toText(readValue(record, ["artificialStatus", "manualStatus", "manualAnalysis"]), ""),
    blueWhaleStatus: toText(readValue(record, ["blueWhaleStatus", "algorithmStatus", "analysisResult"]), ""),
    probability: readValue(record, ["probability", "confidence", "rate", "score"]) as number | string | undefined,
    lat,
    lng,
    source,
    raw: record,
  };
}

function normalizePage(response: unknown, source: LeakDeviceSource): PageResult {
  const data = unwrapData(response) as ApiEnvelope | unknown[];
  const records = Array.isArray(data)
    ? data
    : ((data.records || data.list || unwrapData(data) || []) as unknown[]);
  const total = Array.isArray(data)
    ? data.length
    : Number(data.total ?? records.length ?? 0);

  return {
    records: records.map((item) => normalizeDevice(item, source)),
    total,
  };
}

function normalizeRate(response: unknown): number | string {
  const data = unwrapData(response);

  if (typeof data === "number" || typeof data === "string") {
    return data;
  }

  if (!data || typeof data !== "object") {
    return "--";
  }

  const value = readValue(data as Record<string, unknown>, ["rate", "onlineRate", "successRate", "value", "percentage"]);
  return typeof value === "number" || typeof value === "string" ? value : "--";
}

function buildQuery(filters: LeakMonitorFilters, page: { current: number; size: number }) {
  return {
    current: page.current,
    pageNum: page.current,
    pageNo: page.current,
    size: page.size,
    pageSize: page.size,
    leakLocatePeriod: filters.leakLocatePeriod || undefined,
    deviceStatus: filters.deviceStatus || undefined,
    todayNew: filters.todayNew || undefined,
    latestInstall: filters.latestInstall || undefined,
    deviceModel: filters.deviceModel || undefined,
    keyword: filters.keyword || undefined,
    deviceNumber: filters.keyword || undefined,
  };
}

export async function fetchLeakMonitorSidebar(filters: LeakMonitorFilters) {
  const query = buildQuery(filters, { current: 1, size: 10 });
  const [sidebar, onlineRate, tcpOnlineRate, communicationRate] = await Promise.all([
    getDeviceQuerySidebar(query),
    getDeviceQueryTodayOnlineRate(query),
    getDeviceQueryTcpTodayOnlineRate(query),
    getDeviceQueryCommunicationSuccessRate(query),
  ]);

  const sidebarData = unwrapData(sidebar) as Record<string, unknown> | undefined;

  return {
    sidebar: sidebarData && typeof sidebarData === "object" ? sidebarData : {},
    onlineRate: normalizeRate(onlineRate),
    tcpOnlineRate: normalizeRate(tcpOnlineRate),
    communicationRate: normalizeRate(communicationRate),
  };
}

export async function fetchLeakMonitorDevices(
  filters: LeakMonitorFilters,
  page: { current: number; size: number },
  source: LeakDeviceSource,
) {
  const query = buildQuery(filters, page);
  const response = source === "device-parameter"
    ? await getDeviceQueryParameterPage(query)
    : await getDeviceQueryInfoPage(query);

  return normalizePage(response, source);
}

export async function fetchLeakMonitorDeviceDetail(device: LeakMonitorDevice) {
  const [info, parameter, nearby] = await Promise.allSettled([
    getDeviceQueryInfoDetail(device.id),
    getDeviceQueryParameterDetail(device.id),
    getDeviceQueryNearbyAnalysis(device.deviceNumber),
  ]);

  return {
    info: info.status === "fulfilled" ? unwrapData(info.value) as Record<string, unknown> : device.raw,
    parameter: parameter.status === "fulfilled" ? unwrapData(parameter.value) as Record<string, unknown> : undefined,
    nearby: nearby.status === "fulfilled" ? unwrapData(nearby.value) : undefined,
  };
}
