import { comparisonWindows } from "./comparison-period";
import type { ApiResponse, PageResult } from "@/types/api";
import type {
  BurstPipeAnalyzeData, BurstPipeConfirmRequest, BurstPipeQuery, BurstPipeResult, BurstStatus,
  ComparisonOverviewQuery, ComparisonTrendQuery, LeakCauseAnalysis, LeakReportQuery,
  PointRankingItem, PointRankingQuery, ReportWorkOrder, WaterHammerSummary,
} from "./types";

const dayMs = 86400000;
const round = (value: number, digits = 3) => Number(value.toFixed(digits));
const today = new Date();
today.setHours(0, 0, 0, 0);

function dateText(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function parseDate(value: string) { return new Date(value.replace(/-/g, "/")); }
function inRange(time: string, start?: string, end?: string) {
  const value = parseDate(time).getTime();
  return (!start || value >= parseDate(start).getTime()) && (!end || value <= parseDate(end.length === 10 ? `${end} 23:59:59` : end).getTime());
}
function success<T>(data: T): Promise<ApiResponse<T>> {
  return new Promise(resolve => setTimeout(() => resolve({ code: 200, msg: "操作成功", data, timestamp: Date.now() }), 180));
}
function page<T>(records: T[], query: {pageNum?: number; pageSize?: number}): PageResult<T> {
  const current = query.pageNum || 1;
  const size = Math.min(query.pageSize || 10, 200);
  return { records: records.slice((current - 1) * size, current * size), total: records.length, current, size };
}

const devices = Array.from({ length: 18 }, (_, index) => ({
  deviceId: 1001 + index,
  deviceNumber: `YL-${String(index + 1).padStart(3, "0")}`,
  deviceAlias: `${["东区泵站", "西区主干管", "南区支管", "北区末端"][index % 4]} ${Math.floor(index / 4) + 1} 号测点`,
  installAddress: `${["东区", "西区", "南区", "北区"][index % 4]}再生水管网 K${index + 1}+250`,
  deptId: index % 4 + 1,
}));

const windowRows = devices.flatMap((device, deviceIndex) => Array.from({ length: 2 }, (_, windowIndex) => {
  const date = dateText(new Date(today.getTime() - (windowIndex + 1) * dayMs));
  const startTime = `${date} 08:${String(deviceIndex * 3).padStart(2, "0")}:00.000`;
  const endTime = `${date} 08:${String(deviceIndex * 3).padStart(2, "0")}:10.000`;
  const values = Array.from({ length: 600 }, (_, pointIndex) => round(.38 + deviceIndex * .006 + Math.sin(pointIndex * .19 + deviceIndex) * .009 - (deviceIndex % 5 === 0 && pointIndex > 270 && pointIndex < 285 ? .12 : 0)));
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
  const upperLimit = mean + 3 * stdDev;
  const lowerLimit = mean - 3 * stdDev;
  const points = values.map((pressure, pointIndex) => ({
    time: `${date} 08:${String(deviceIndex * 3).padStart(2, "0")}:${String(Math.floor(pointIndex / 60)).padStart(2, "0")}.${String(pointIndex % 60 * 16).padStart(3, "0")}`,
    pressure,
    abnormal: pressure > upperLimit || pressure < lowerLimit,
  }));
  const abnormalCount = points.filter(point => point.abnormal).length;
  const tubeMaterial = ["铸铁", "球墨铸铁", "PE", "钢管"][deviceIndex % 4];
  const pipeAgeYears = [32, 22, 8, 15][deviceIndex % 4];
  const materialScore = [40, 25, 10, 30][deviceIndex % 4];
  const ageScore = pipeAgeYears >= 30 ? 40 : pipeAgeYears >= 20 ? 25 : pipeAgeYears >= 10 ? 10 : 0;
  const assetScore = materialScore + ageScore;
  const status: BurstStatus = assetScore >= 60 ? "SUSPECTED_BURST" : "NORMAL";
  const result: BurstPipeResult = {
    ...device, startTime, endTime, samplingRate: 256, mean, stdDev, upperLimit, lowerLimit,
    totalCount: points.length, abnormalCount, abnormalRate: round(abnormalCount / points.length * 100, 2),
    burstSuspected: status !== "NORMAL", status, tubeMaterial, pipeAgeYears, assetScore,
  };
  return { deptId: device.deptId, result, points };
})).sort((a, b) => b.result.startTime.localeCompare(a.result.startTime));

export function mockGetBurstPipeResults(query: BurstPipeQuery) {
  const rows = windowRows.filter(row =>
    (!query.status || row.result.status === query.status) &&
    (!query.deviceId || row.result.deviceId === query.deviceId) &&
    (!query.deviceNumber || row.result.deviceNumber.toLowerCase().includes(query.deviceNumber.trim().toLowerCase())) &&
    (!query.deptId || row.deptId === query.deptId) &&
    (typeof query.burstSuspected !== "boolean" || row.result.burstSuspected === query.burstSuspected) &&
    inRange(row.result.startTime, query.startTime, query.endTime)
  ).map(row => row.result);
  return success(page(rows, query));
}
export function mockGetBurstPipeAnalyze(query: {deviceNumber: string; startTime: string; endTime: string}): Promise<ApiResponse<BurstPipeAnalyzeData>> {
  const row = windowRows.find(item => item.result.deviceNumber === query.deviceNumber && item.result.startTime === query.startTime && item.result.endTime === query.endTime);
  if (!row) return Promise.reject({ code: 404, msg: "识别窗口不存在" });
  return success({ ...row.result, points: row.points });
}
export function mockGetBurstPipeSummary() {
  const latest = devices.map(device => windowRows.find(row => row.result.deviceId === device.deviceId)!.result);
  return success({
    monitoredCount: latest.length,
    suspectedCount: latest.filter(row => row.status === "SUSPECTED_BURST").length,
    confirmedCount: latest.filter(row => row.status === "BURST").length,
    abnormalPointTotal: latest.reduce((sum, row) => sum + (row.abnormalCount || 0), 0),
    lastCheckTime: windowRows[0]?.result.endTime ?? null,
  });
}
export function mockConfirmBurstPipe(request: BurstPipeConfirmRequest) {
  const row = windowRows.find(item => item.result.deviceNumber === request.deviceNumber && item.result.startTime === request.startTime && item.result.endTime === request.endTime);
  if (!row) return Promise.reject({ code: 404, msg: "识别窗口不存在" });
  if (!request.cause.trim()) return Promise.reject({ code: 400, msg: "确认原因不能为空" });
  if (row.result.status !== "SUSPECTED_BURST") return Promise.reject({ code: 400, msg: row.result.status === "BURST" ? "该窗口已确认" : "只有疑似爆管可以确认" });
  row.result.status = "BURST";
  row.result.burstSuspected = true;
  return success(row.result);
}

type DailyRow = typeof devices[number] & { period: string; leakStatus: 0 | 1 | 2; leakEsa: number; leakIntensity?: number; pressure: number; flow: number };
const daily: DailyRow[] = Array.from({ length: 90 }, (_, offset) => devices.map((device, index) => {
  const seed = offset + index * 3;
  const leakStatus: 0 | 1 | 2 = seed % 13 === 0 ? 0 : seed % 7 === 0 ? 2 : 1;
  return { ...device, period: dateText(new Date(today.getTime() - offset * dayMs)), leakStatus, leakEsa: leakStatus === 0 ? 24 + index % 5 : leakStatus === 2 ? 14 + index % 4 : 5 + index % 4, leakIntensity: seed % 4 ? 8 + index : undefined, pressure: round(.38 + index * .006), flow: round(110 + index * 2.4, 2) };
})).flat();
function dailyFor(query: {startTime: string; endTime: string; deptId?: number | null}) {
  return daily.filter(row => (!query.deptId || row.deptId === query.deptId) && inRange(`${row.period} 12:00:00`, query.startTime, query.endTime));
}

export function mockGetPointRanking(query: PointRankingQuery) {
  const rows: PointRankingItem[] = devices.flatMap(device => {
    const records = dailyFor(query).filter(row => row.deviceId === device.deviceId);
    if (!records.length) return [];
    const leakCount = records.filter(row => row.leakStatus === 0).length;
    const suspectedCount = records.filter(row => row.leakStatus === 2).length;
    const intensities = records.flatMap(row => row.leakIntensity == null ? [] : [row.leakIntensity]);
    return [{ ...device, rank: 0, deptName: ["东区", "西区", "南区", "北区"][device.deptId - 1], leakCount, suspectedCount, anomalyCount: leakCount + suspectedCount, avgLeakEsa: round(records.reduce((sum, row) => sum + row.leakEsa, 0) / records.length, 2), maxLeakIntensity: intensities.length ? Math.max(...intensities) : undefined, avgNoise: undefined, avgPressure: round(records.reduce((sum, row) => sum + row.pressure, 0) / records.length), riskScore: undefined, currentLeakStatus: records[0].leakStatus, lastSamplingTime: `${records[0].period} 12:00:00` }];
  });
  const keys: Record<string, keyof PointRankingItem> = { LEAK_COUNT: "leakCount", SUSPECTED_COUNT: "suspectedCount", ANOMALY_COUNT: "anomalyCount", AVG_LEAK_ESA: "avgLeakEsa", MAX_LEAK_INTENSITY: "maxLeakIntensity", AVG_NOISE: "avgNoise", RISK_SCORE: "riskScore" };
  const key = keys[query.rankMetric || "LEAK_COUNT"];
  rows.sort((a, b) => ((Number(a[key]) || 0) - (Number(b[key]) || 0)) * (query.order === "ASC" ? 1 : -1) || a.deviceId - b.deviceId);
  return success(page(rows.map((row, index) => ({ ...row, rank: index + 1 })), query));
}

function comparison(metric: string, periodValue: string, deviceId?: number, asOfDate?: string) {
  const period = periodValue.length === 4 ? "YEAR" : periodValue.length === 7 ? "MONTH" : "DAY";
  const ranges = comparisonWindows(period, periodValue, asOfDate);
  const unit = metric === "FLOW" ? "m³/h" : metric === "PRESSURE" ? "MPa" : "dB";
  if (metric === "NOISE") return { unit, currentValue: null, yoyValue: null, momValue: null, yoyRate: null, momRate: null, currentPeriodLabel: ranges.current.label, yoyPeriodLabel: ranges.yoy.label, momPeriodLabel: ranges.mom.label, sampleCount: 0 };
  const source = deviceId ? devices.find(device => device.deviceId === deviceId) : undefined;
  const base = metric === "FLOW" ? 120 : .42;
  const factor = source ? 1 + (source.deviceId - 1000) * .015 : 1.12;
  const currentValue = round(base * factor, metric === "FLOW" ? 2 : 3);
  const yoyValue = round(currentValue * .96, metric === "FLOW" ? 2 : 3);
  const momValue = round(currentValue * .98, metric === "FLOW" ? 2 : 3);
  return { unit, currentValue, yoyValue, momValue, yoyRate: round((currentValue - yoyValue) / yoyValue * 100, 2), momRate: round((currentValue - momValue) / momValue * 100, 2), currentPeriodLabel: ranges.current.label, yoyPeriodLabel: ranges.yoy.label, momPeriodLabel: ranges.mom.label, sampleCount: 1440 };
}
export function mockGetComparisonOverview(query: ComparisonOverviewQuery) {
  return success({ ...comparison(query.metric, query.periodValue, query.deviceId || undefined, query.asOfDate), metric: query.metric, period: query.period, periodValue: query.periodValue });
}
export function mockGetComparisonTrend(query: ComparisonTrendQuery) {
  const periods: string[] = [];
  const cursor = parseDate(query.startTime.slice(0, 10));
  const stop = parseDate(query.endTime.slice(0, 10));
  if (query.granularity === "MONTH") cursor.setDate(1);
  while (cursor <= stop && periods.length < 1100) {
    periods.push(dateText(cursor).slice(0, query.granularity === "MONTH" ? 7 : 10));
    query.granularity === "MONTH" ? cursor.setMonth(cursor.getMonth() + 1) : cursor.setDate(cursor.getDate() + 1);
  }
  const series = periods.map(period => ({ period, ...comparison(query.metric, period, query.deviceId || undefined, query.endTime.slice(0, 10)) }));
  return success({ metric: query.metric, unit: series[0]?.unit, series });
}
export function mockGetLeakReportTrend(query: LeakReportQuery) {
  const groups = new Map<string, {period: string; leakCount: number; suspectedCount: number; normalCount: number}>();
  dailyFor(query).forEach(row => {
    const key = row.period.slice(0, query.granularity === "MONTH" ? 7 : 10);
    const current = groups.get(key) || { period: key, leakCount: 0, suspectedCount: 0, normalCount: 0 };
    if (row.leakStatus === 0) current.leakCount += 1;
    if (row.leakStatus === 2) current.suspectedCount += 1;
    if (row.leakStatus === 1) current.normalCount += 1;
    groups.set(key, current);
  });
  return success({ series: [...groups.values()].sort((a, b) => a.period.localeCompare(b.period)) });
}
export function mockGetWaterHammerSummary(query: LeakReportQuery) {
  const monitoredTerminalCount = new Set(dailyFor(query).map(row => row.deviceId)).size;
  return success<WaterHammerSummary>({ monitoredTerminalCount, alarmTerminalCount: 0, alarmCount: 0, alarmRate: monitoredTerminalCount ? 0 : null });
}
export function mockGetLeakCauseAnalysis(query: LeakReportQuery) {
  const leakCount = dailyFor(query).filter(row => row.leakStatus === 0).length;
  const causes: LeakCauseAnalysis["causes"] = leakCount ? [
    { eventType: "LEAK", cause: "接口密封老化", count: Math.ceil(leakCount * .6), percent: 60 },
    { eventType: "LEAK", cause: "待查明", count: Math.floor(leakCount * .4), percent: 40 },
  ] : [];
  windowRows.filter(row => row.result.status === "BURST" && inRange(row.result.startTime, query.startTime, query.endTime)).forEach(() => causes.push({ eventType: "BURST", cause: "用户确认原因", count: 1, percent: 100 }));
  return success<LeakCauseAnalysis>({ causes });
}
export function mockGetReportWorkOrders(query: LeakReportQuery) {
  const rows: ReportWorkOrder[] = Array.from({ length: 12 }, (_, index) => ({ id: index + 1, worksheetNumber: `WX-${String(index + 1).padStart(4, "0")}`, worksheetType: 3, worksheetStatus: index % 4, riseTime: `${dateText(new Date(today.getTime() - index * dayMs))} 09:00:00`, finishTime: index % 4 === 2 ? `${dateText(new Date(today.getTime() - index * dayMs))} 18:00:00` : undefined, createdAt: `${dateText(new Date(today.getTime() - index * dayMs))} 09:00:00` }));
  return success(rows.filter(row => inRange(row.riseTime || row.createdAt || "", query.startTime, query.endTime)));
}
