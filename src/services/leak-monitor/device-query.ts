import { getRequest, postRequest } from "@/services/shared/crud";
import { getAudioWav } from "@/services/data-analysis/audio";
import type {
  AudioRecord,
  DailyAudioRecord,
  FeatureTrendPoint,
  LeakDeviceStatus,
  LeakMonitorDevice,
  LeakMonitorFilters,
  MaintenanceRecord,
} from "@/pages/leak-monitor/types";

type ApiEnvelope<T = unknown> = {
  code?: number;
  msg?: string;
  data?: T;
};

type SidebarPayload = {
  devices?: unknown[];
  leakStatusCounts?: Record<string, unknown>;
  total?: number;
  [key: string]: unknown;
};

function unwrapData<T = unknown>(response: unknown): T {
  if (response && typeof response === "object" && "data" in (response as ApiEnvelope<T>)) {
    return (response as ApiEnvelope<T>).data as T;
  }
  return response as T;
}

function toText(value: unknown, fallback = "") {
  return value === undefined || value === null ? fallback : String(value);
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeAnalysisStatus(value: unknown): { status: LeakDeviceStatus; text: string } {
  const code = toNumber(value);
  if (code === 1) return { status: "normal", text: "正常" };
  if (code === 2) return { status: "suspect", text: "疑似" };
  if (code === 0) return { status: "leak", text: "渗漏" };
  return { status: "unknown", text: "未知" };
}

function parseCoordinate(value: unknown) {
  if (typeof value !== "string") return {};
  const [lngValue, latValue] = value.split(",").map((item) => Number(item.trim()));
  return Number.isFinite(lngValue) && Number.isFinite(latValue)
    ? { lng: lngValue, lat: latValue }
    : {};
}

export function normalizeLeakDevice(row: unknown): LeakMonitorDevice {
  const record = row && typeof row === "object" ? row as Record<string, unknown> : {};
  const deviceNumber = toText(record.deviceNumber, "--");
  const status = normalizeAnalysisStatus(record.leakStatus);
  const manualStatus = normalizeAnalysisStatus(record.manualAnalysisStatus);
  const algorithmStatus = normalizeAnalysisStatus(record.algorithmAnalysisStatus);
  const coordinate = parseCoordinate(record.coordinate);
  const leakProperty = toNumber(record.leakProperty);

  return {
    id: (record.deviceId ?? record.id ?? deviceNumber) as string | number,
    deviceNumber,
    model: toText(record.model || record.deviceType, "--"),
    status: status.status,
    statusText: status.text,
    manualStatus: manualStatus.status,
    manualStatusText: manualStatus.text,
    algorithmStatus: algorithmStatus.status,
    algorithmStatusText: algorithmStatus.text,
    leakProperty: leakProperty ?? null,
    onlineStatus: toNumber(record.deviceStatus ?? record.onlineStatus) ?? null,
    ...coordinate,
    raw: record,
  };
}

function normalizeRate(response: unknown): number | string {
  const data = unwrapData(response);
  if (typeof data === "number" || typeof data === "string") return data;
  if (!data || typeof data !== "object") return "--";
  const rate = (data as Record<string, unknown>).rate;
  return typeof rate === "number" || typeof rate === "string" ? rate : "--";
}

function normalizeSidebar(response: unknown) {
  const data = unwrapData<SidebarPayload>(response) || {};
  const rawDevices = Array.isArray(data.devices) ? data.devices : [];
  return {
    data,
    devices: rawDevices.map(normalizeLeakDevice),
    total: Number(data.total ?? rawDevices.length ?? 0),
  };
}

function optionalBoolean(value: string) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export function buildLeakMonitorQuery(
  filters: LeakMonitorFilters,
  page: { current: number; size: number },
) {
  return {
    pageNum: page.current,
    pageSize: page.size,
    deviceNumber: filters.deviceNumber || undefined,
    deviceType: filters.deviceType || undefined,
    onlineStatus: filters.onlineStatus === "" ? undefined : Number(filters.onlineStatus),
    leakStatus: filters.leakStatus === "" ? undefined : Number(filters.leakStatus),
    todayNew: optionalBoolean(filters.todayNew),
    latestInstalled: optionalBoolean(filters.latestInstalled),
  };
}

export function isDomesticLeakMonitorUser(userInfo = uni.getStorageSync("userInfo")) {
  const region = String(userInfo?.region ?? "").trim().toLowerCase();
  if (["国外", "overseas", "foreign", "international", "en"].includes(region)) {
    return false;
  }
  return true;
}

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

export function getLeakMonitorDeviceDetail(id: string | number) {
  return getRequest("/api/device/" + id + "/detail");
}

export function getLeakMonitorAudioPage(data: Record<string, unknown>) {
  return postRequest("/api/data-query/audio/page", data);
}

export function getLeakMonitorFeatureTrend(
  deviceNumber: string,
  params: { startDate: string; endDate: string },
) {
  return getRequest("/api/data-query/leakage/feature-trend/" + deviceNumber, params);
}

export function getLeakMonitorDailyLatestAudio(
  deviceNumber: string,
  params: { startDate: string; endDate: string },
) {
  return getRequest("/api/data-query/audio/daily-latest/" + deviceNumber, params);
}

export function getLeakMonitorMaintenancePage(deviceNumber: string) {
  return postRequest("/api/maintenance-record/manage/page", {
    pageNum: 1,
    pageSize: 1000,
    sortOrder: "desc",
    sortField: "createdAt",
    deviceNumber,
  });
}

export async function fetchLeakMonitorSidebar() {
  const domestic = isDomesticLeakMonitorUser();
  const [sidebarResponse, communicationResponse, onlineResponse] = await Promise.all([
    getDeviceQuerySidebar({}),
    getDeviceQueryCommunicationSuccessRate({}),
    domestic ? getDeviceQueryTodayOnlineRate({}) : getDeviceQueryTcpTodayOnlineRate({}),
  ]);
  const sidebar = normalizeSidebar(sidebarResponse);

  return {
    ...sidebar,
    communicationRate: normalizeRate(communicationResponse),
    onlineRate: normalizeRate(onlineResponse),
    domestic,
  };
}

export async function fetchLeakMonitorDevices(
  filters: LeakMonitorFilters,
  page: { current: number; size: number },
) {
  const response = await getDeviceQuerySidebar(buildLeakMonitorQuery(filters, page));
  const normalized = normalizeSidebar(response);
  return { records: normalized.devices, total: normalized.total };
}

export async function fetchLeakMonitorDeviceInfo(device: LeakMonitorDevice) {
  const response = await getLeakMonitorDeviceDetail(device.id);
  const data = unwrapData<Record<string, unknown>>(response);
  return data && typeof data === "object" ? data : device.raw;
}

export async function fetchLeakMonitorLatestAudio(
  deviceNumber: string,
  startTime: string,
  endTime: string,
) {
  const response = await getLeakMonitorAudioPage({
    pageNum: 1,
    pageSize: 10,
    startTime,
    endTime,
    sortOrder: "desc",
    sortField: "createdAt",
    deviceNumber,
    parseStatus: "success",
  });
  const data = unwrapData<Record<string, unknown>>(response) || {};
  const records = Array.isArray(data.records) ? data.records : [];
  return (records[0] || null) as AudioRecord | null;
}

export async function fetchLeakMonitorTrend(
  deviceNumber: string,
  startDate: string,
  endDate: string,
) {
  const response = await getLeakMonitorFeatureTrend(deviceNumber, { startDate, endDate });
  const data = unwrapData<unknown[]>(response);
  return (Array.isArray(data) ? data : []).map((item) => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      date: toText(row.date),
      leakEsa: toNumber(row.leakEsa) ?? null,
      parseTime: toText(row.parseTime),
    } satisfies FeatureTrendPoint;
  });
}

export async function fetchLeakMonitorDailyAudio(
  deviceNumber: string,
  startDate: string,
  endDate: string,
) {
  const response = await getLeakMonitorDailyLatestAudio(deviceNumber, { startDate, endDate });
  const data = unwrapData<unknown[]>(response);
  return (Array.isArray(data) ? data : []).map((item) => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      audioId: Number(row.audioId),
      audioTime: toText(row.audioTime),
      date: toText(row.date),
    } satisfies DailyAudioRecord;
  }).filter((item) => Number.isFinite(item.audioId) && item.date);
}

export async function fetchLeakMonitorMaintenance(deviceNumber: string) {
  const response = await getLeakMonitorMaintenancePage(deviceNumber);
  const data = unwrapData<Record<string, unknown>>(response) || {};
  const records = Array.isArray(data.records) ? data.records : [];
  return records.map((item) => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      ...row,
      maintainType: Number(row.maintainType ?? -1),
    } as MaintenanceRecord;
  });
}

export function fetchLeakMonitorWav(audioId: number) {
  return getAudioWav(audioId, false) as Promise<ArrayBuffer>;
}