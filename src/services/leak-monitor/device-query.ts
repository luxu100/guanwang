import { getRequest, postRequest } from "@/services/shared/crud";
import { getAudioWav } from "@/services/data-analysis/audio";
import { getLocale } from "@/i18n";
import type {
  AudioRecord,
  CoordinateSystem,
  DailyAudioRecord,
  FeatureTrendPoint,
  LeakDeviceStatus,
  LeakMonitorDevice,
  LeakMonitorFilters,
  MapCoordinate,
  MapRegion,
  NearbyAnalysisDevice,
  ManualAnalysisPayload,
  ManualAnalysisRecord,
  MaintenanceRecord,
  CorrelationAudioOption,
} from "@/pages/leak-monitor/types";
import { normalizeCoordinateSystem } from "@/pages/leak-monitor/coordinateTransform";

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

function normalizeAnalysisStatus(value: unknown): { status: LeakDeviceStatus } {
  const code = toNumber(value);
  if (code === 1) return { status: "normal" };
  if (code === 2) return { status: "suspect" };
  if (code === 0) return { status: "leak" };
  return { status: "unknown" };
}

function parseCoordinate(value: unknown): Partial<MapCoordinate> {
  if (Array.isArray(value)) {
    const lngValue = toNumber(value[0]);
    const latValue = toNumber(value[1]);
    return lngValue !== undefined && latValue !== undefined
      ? { lng: lngValue, lat: latValue }
      : {};
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const lngValue = toNumber(record.lng ?? record.longitude ?? record.x);
    const latValue = toNumber(record.lat ?? record.latitude ?? record.y);
    return lngValue !== undefined && latValue !== undefined
      ? { lng: lngValue, lat: latValue }
      : {};
  }

  if (typeof value !== "string") return {};
  const [lngValue, latValue] = value.split(",").map((item) => Number(item.trim()));
  return Number.isFinite(lngValue) && Number.isFinite(latValue)
    ? { lng: lngValue, lat: latValue }
    : {};
}

function getDefaultCoordinateSystem(domestic: boolean): CoordinateSystem {
  return domestic ? "GCJ02" : "WGS84";
}

export function normalizeLeakDevice(
  row: unknown,
  domestic = isDomesticLeakMonitorUser(),
): LeakMonitorDevice {
  const record = row && typeof row === "object" ? row as Record<string, unknown> : {};
  const deviceNumber = toText(record.deviceNumber, "--");
  const status = normalizeAnalysisStatus(record.leakStatus);
  const manualStatus = normalizeAnalysisStatus(record.manualAnalysisStatus);
  const algorithmStatus = normalizeAnalysisStatus(record.algorithmAnalysisStatus);
  const coordinate = parseCoordinate(
    record.coordinate ?? (
      record.installLongitude !== undefined || record.installLatitude !== undefined
        ? {
          lng: record.installLongitude,
          lat: record.installLatitude,
        }
        : undefined
    ),
  );
  const leakProperty = toNumber(record.leakProperty);

  return {
    id: (record.deviceId ?? record.id ?? deviceNumber) as string | number,
    deviceNumber,
    model: toText(record.model || record.deviceType, "--"),
    status: status.status,
    statusText: status.status,
    manualStatus: manualStatus.status,
    manualStatusText: manualStatus.status,
    algorithmStatus: algorithmStatus.status,
    algorithmStatusText: algorithmStatus.status,
    leakProperty: leakProperty ?? null,
    onlineStatus: toNumber(record.deviceStatus ?? record.onlineStatus) ?? null,
    regionId: (record.regionId ?? record.deptId ?? record.departmentId ?? null) as string | number | null,
    coordinateSystem: normalizeCoordinateSystem(
      record.coordinateSystem ?? record.coordType ?? record.coordinateType,
      getDefaultCoordinateSystem(domestic),
    ),
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

function normalizeSidebar(response: unknown, domestic = isDomesticLeakMonitorUser()) {
  const data = unwrapData<SidebarPayload>(response) || {};
  const rawDevices = Array.isArray(data.devices) ? data.devices : [];
  return {
    data,
    devices: rawDevices.map((item) => normalizeLeakDevice(item, domestic)),
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
  // The active interface language controls the live map provider. User region
  // only supplies the initial locale before a manual language choice exists.
  const locale = getLocale();
  if (locale === "zh-CN") return true;
  if (locale === "en-US") return false;

  const region = String(userInfo?.region ?? "").trim().toLowerCase();
  if (["国外", "overseas", "foreign", "international", "global", "en", "us"].includes(region)) {
    return false;
  }
  if (["国内", "china", "cn", "domestic"].includes(region)) return true;
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

export function getLeakMonitorVisibleDeviceList(params: Record<string, unknown> = {}) {
  return getRequest("/api/device/visible-list", params);
}

export function getLeakMonitorVisibleRegionList(params: Record<string, unknown> = {}) {
  return getRequest("/api/region/list", params);
}

export function getLeakMonitorDeviceDetail(id: string | number) {
  return getRequest("/api/device/" + id + "/detail");
}

export function getLeakMonitorAudioPage(data: Record<string, unknown>) {
  return postRequest("/api/data-query/audio/page", data);
}

export function getLeakMonitorDailyLatestAudioByDate(
  deviceNumber: string,
  date: string,
) {
  return getRequest(
    `/api/data-query/audio/daily-latest/${encodeURIComponent(deviceNumber)}`,
    {
      startDate: date,
      endDate: date,
    },
  );
}

export function getLeakMonitorFeatureTrend(
  deviceNumber: string,
  params: { startTime: string; endTime: string },
) {
  return postRequest("/api/data-query/leakage/page", {
    pageNum: 1,
    pageSize: 1000,
    sortOrder: "asc",
    sortField: "time",
    deviceNumber,
    ...params,
  });
}

export function getLeakMonitorDailyLatestAudio(
  deviceNumber: string,
  params: { startTime: string; endTime: string },
) {
  return postRequest("/api/data-query/audio/page", {
    pageNum: 1,
    pageSize: 1000,
    sortOrder: "desc",
    sortField: "createdAt",
    deviceNumber,
    parseStatus: "success",
    ...params,
  });
}

export function getLeakMonitorNearbyAnalysis(deviceNumber: string, radiusKm: number) {
  return getRequest(
    `/api/device-query/nearby-analysis/${encodeURIComponent(deviceNumber)}`,
    { radiusKm },
  );
}

export function getLeakMonitorMaintenancePage(deviceNumber: string) {
  return postRequest("/api/maintenance-record/page", {
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
  const sidebar = normalizeSidebar(sidebarResponse, domestic);

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
  const domestic = isDomesticLeakMonitorUser();
  const response = await getDeviceQuerySidebar(buildLeakMonitorQuery(filters, page));
  const normalized = normalizeSidebar(response, domestic);
  return { records: normalized.devices, total: normalized.total };
}

export function getLeakMonitorManualAnalysisPage(deviceNumber: string) {
  return postRequest("/api/data-query/leakage/page", {
    pageNum: 1,
    pageSize: 20,
    sortOrder: "desc",
    sortField: "time",
    deviceNumber,
  });
}

export function createLeakMonitorManualAnalysis(data: ManualAnalysisPayload) {
  return postRequest("/api/manual-analysis/work-orders", data);
}

export async function fetchLeakMonitorMapData() {
  const domestic = isDomesticLeakMonitorUser();
  const [deviceResponse, regionResponse] = await Promise.all([
    getLeakMonitorVisibleDeviceList({}),
    getLeakMonitorVisibleRegionList({}),
  ]);

  return {
    devices: normalizeVisibleDevices(deviceResponse, domestic),
    regions: normalizeVisibleRegions(regionResponse, domestic),
  };
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

export async function fetchLeakMonitorAudioOptions(
  deviceNumber: string,
  pageSize = 20,
): Promise<CorrelationAudioOption[]> {
  const response = await getLeakMonitorAudioPage({
    pageNum: 1,
    pageSize,
    sortOrder: "desc",
    sortField: "createdAt",
    deviceNumber,
    parseStatus: "success",
  });
  const options: CorrelationAudioOption[] = [];
  extractRecords(unwrapData<unknown>(response)).forEach((item) => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const audioId = Number(row.audioId ?? row.id);
    if (Number.isFinite(audioId)) {
      options.push({
        ...row,
        audioId,
        deviceNumber,
        audioTime: toText(
          row.audioTime ?? row.samplingTime ?? row.time ?? row.createdAt ?? row.parseTime,
        ),
        intensity: toNumber(
          row.noiseValue ?? row.intensity ?? row.soundLevel ?? row.leakEsa,
        ) ?? null,
      });
    }
  });
  return options;
}

export async function fetchLeakMonitorDailyLatestAudioOption(
  deviceNumber: string,
  date: string,
): Promise<CorrelationAudioOption[]> {
  const response = await getLeakMonitorDailyLatestAudioByDate(deviceNumber, date);
  const data = unwrapData<unknown>(response);
  const records = Array.isArray(data)
    ? data
    : extractRecords(data).length
      ? extractRecords(data)
      : data && typeof data === "object"
        ? [data]
        : [];

  return records.flatMap((item) => {
    const row = item && typeof item === "object"
      ? item as Record<string, unknown>
      : {};
    const audioId = Number(row.audioId ?? row.audioFileId ?? row.id);
    if (!Number.isFinite(audioId)) return [];
    return [{
      ...row,
      audioId,
      deviceNumber,
      audioTime: toText(
        row.audioTime ?? row.samplingTime ?? row.time ?? row.createdAt ?? row.parseTime,
      ),
      intensity: toNumber(
        row.noiseValue ?? row.intensity ?? row.soundLevel ?? row.leakEsa,
      ) ?? null,
    } satisfies CorrelationAudioOption];
  });
}

export async function fetchLeakMonitorNearbyAnalysis(
  deviceNumber: string,
  radiusKm: number,
): Promise<NearbyAnalysisDevice[]> {
  const response = await getLeakMonitorNearbyAnalysis(deviceNumber, radiusKm);
  const data = unwrapData<unknown>(response);
  const records = Array.isArray(data) ? data : extractRecords(data);
  return records
    .map((item) => {
      const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
      const nearbyDeviceNumber = toText(row.deviceNumber);
      if (!nearbyDeviceNumber) return null;
      return {
        deviceNumber: nearbyDeviceNumber,
        distanceKm: toNumber(row.distanceKm) ?? 0,
        signalprocessingResults: Array.isArray(row.signalprocessingResults)
          ? row.signalprocessingResults
          : [],
      } satisfies NearbyAnalysisDevice;
    })
    .filter((item): item is NearbyAnalysisDevice => Boolean(item));
}

export async function fetchLeakMonitorTrend(
  deviceNumber: string,
  startDate: string,
  endDate: string,
) {
  const response = await getLeakMonitorFeatureTrend(deviceNumber, {
    startTime: startDate + "T00:00:00",
    endTime: endDate + "T23:59:59",
  });
  const maximumByDate = new Map<string, FeatureTrendPoint>();
  extractRecords(unwrapData<unknown>(response)).forEach((item) => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const parseTime = toText(row.parseTime ?? row.time ?? row.createdAt ?? row.date);
    const date = toText(row.date ?? parseTime).slice(0, 10);
    if (!date) return;

    const candidate = {
      date,
      leakEsa: toNumber(row.leakEsa) ?? null,
      parseTime,
    } satisfies FeatureTrendPoint;

    const current = maximumByDate.get(date);
    const candidateValue = candidate.leakEsa;
    const currentValue = current?.leakEsa;
    if (
      !current ||
      (candidateValue !== null && (
        currentValue === null ||
        currentValue === undefined ||
        candidateValue > currentValue
      )) ||
      (candidateValue === currentValue && parseTime >= (current.parseTime || ""))
    ) {
      maximumByDate.set(date, candidate);
    }
  });

  return Array.from(maximumByDate.values()).sort((left, right) =>
    left.date.localeCompare(right.date));
}

export async function fetchLeakMonitorDailyAudio(
  deviceNumber: string,
  startDate: string,
  endDate: string,
) {
  const response = await getLeakMonitorDailyLatestAudio(deviceNumber, {
    startTime: startDate + "T00:00:00",
    endTime: endDate + "T23:59:59",
  });
  const latestByDate = new Map<string, DailyAudioRecord>();
  extractRecords(unwrapData<unknown>(response)).forEach((item) => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const audioTime = toText(
      row.audioTime ?? row.time ?? row.samplingTime ?? row.createdAt,
    );
    const date = audioTime.slice(0, 10);
    const audioId = Number(row.audioId);
    if (!date || !Number.isFinite(audioId) || latestByDate.has(date)) return;
    latestByDate.set(date, { audioId, audioTime, date });
  });
  return Array.from(latestByDate.values()).sort((left, right) =>
    left.date.localeCompare(right.date));
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

export async function fetchLeakMonitorManualAnalysis(deviceNumber: string) {
  const response = await getLeakMonitorManualAnalysisPage(deviceNumber);
  return extractRecords(unwrapData<unknown>(response))
    .map((item) => {
      const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return {
        ...row,
        id: row.id as string | number | undefined,
        manualAnalysis: toText(row.manualAnalysis),
        troubleshootingFeedback: toText(row.troubleshootingFeedback),
        reasonAnalysis: toText(row.reasonAnalysis),
        resetDate: toText(row.resetDate),
        createdAt: toText(row.time ?? row.createdAt ?? row.parseTime),
      } satisfies ManualAnalysisRecord;
    })
    .filter((item) =>
      item.manualAnalysis ||
      item.troubleshootingFeedback ||
      item.reasonAnalysis);
}

export async function submitLeakMonitorManualAnalysis(payload: ManualAnalysisPayload) {
  return createLeakMonitorManualAnalysis(payload);
}

function normalizeVisibleDevices(response: unknown, domestic: boolean) {
  const data = unwrapData<unknown>(response);
  const records = extractRecords(data);
  return records
    .map((item) => normalizeLeakDevice(item, domestic))
    .filter((item) => item.deviceNumber !== "--");
}

function normalizeVisibleRegions(response: unknown, domestic: boolean): MapRegion[] {
  const data = unwrapData<unknown>(response);
  return extractRecords(data)
    .map((item) => normalizeRegion(item, domestic))
    .filter((item): item is MapRegion => Boolean(item));
}

function normalizeRegion(row: unknown, domestic: boolean): MapRegion | null {
  const record = row && typeof row === "object"
    ? row as Record<string, unknown>
    : {};
  const id = record.id ?? record.regionId ?? record.deptId;
  if (id === undefined || id === null) return null;

  const coordinateSystem = normalizeCoordinateSystem(
    record.coordinateSystem ?? record.coordType ?? record.coordinateType,
    getDefaultCoordinateSystem(domestic),
  );
  const scope =
    record.regionScope ??
    record.boundary ??
    record.coordinates ??
    record.path ??
    record.points;

  return {
    id: id as string | number,
    name: toText(record.deptName ?? record.regionName ?? record.name, String(id)),
    color: normalizeColor(record.regionColor ?? record.color),
    center: normalizeRegionCenter(
      record.regionCenter ?? record.center,
    ),
    boundary: parseRegionBoundary(scope),
    coordinateSystem,
    visible: record.gisVisible !== false && Number(record.gisVisible ?? 1) !== 0,
    minZoom: toNumber(record.gisMinLevel ?? record.minZoom),
    maxZoom: toNumber(record.gisMaxLevel ?? record.maxZoom),
    raw: record,
  };
}

function extractRecords(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  for (const key of ["records", "rows", "list", "devices", "regions"]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

function normalizeRegionCenter(value: unknown): MapCoordinate | null {
  const coordinate = parseCoordinate(value);
  return typeof coordinate.lng === "number" && typeof coordinate.lat === "number"
    ? { lng: coordinate.lng, lat: coordinate.lat }
    : null;
}

function parseRegionBoundary(value: unknown): MapCoordinate[] {
  const text = typeof value === "string" ? value.trim() : "";
  if (text) {
    const jsonPoints: MapCoordinate[] = [];
    try {
      appendRegionCoordinates(JSON.parse(text), jsonPoints);
      if (jsonPoints.length >= 3) return jsonPoints;
    } catch {
      // The region module currently stores semicolon-separated lng,lat pairs.
    }

    const textPoints: MapCoordinate[] = [];
    const numbers = text.match(/-?\d+(?:\.\d+)?/g) || [];
    for (let index = 0; index < numbers.length - 1; index += 2) {
      const lng = Number(numbers[index]);
      const lat = Number(numbers[index + 1]);
      if (isValidCoordinate(lng, lat)) textPoints.push({ lng, lat });
    }
    return textPoints;
  }

  const points: MapCoordinate[] = [];
  appendRegionCoordinates(value, points);
  return points;
}

function appendRegionCoordinates(value: unknown, points: MapCoordinate[]) {
  if (Array.isArray(value)) {
    const coordinate = parseCoordinate(value);
    if (typeof coordinate.lng === "number" && typeof coordinate.lat === "number") {
      points.push({ lng: coordinate.lng, lat: coordinate.lat });
      return;
    }
    value.forEach((item) => appendRegionCoordinates(item, points));
    return;
  }

  if (!value || typeof value !== "object") return;
  const coordinate = parseCoordinate(value);
  if (typeof coordinate.lng === "number" && typeof coordinate.lat === "number") {
    points.push({ lng: coordinate.lng, lat: coordinate.lat });
    return;
  }

  const record = value as Record<string, unknown>;
  ["points", "coordinates", "path", "range", "regionScope", "boundary"].forEach((key) => {
    appendRegionCoordinates(record[key], points);
  });
}

function isValidCoordinate(lng: number, lat: number) {
  return Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90;
}

function normalizeColor(value: unknown) {
  const color = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : "#0d82ee";
}
