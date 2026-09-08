import type { ApiResponse, PageResult } from "@/types/api";
import type {
  BurstPipeAnalyzeData, BurstPipeQuery, ComparisonOverviewQuery,
  ComparisonTrendQuery, HandlingEffectData, LeakAnomalyData,
  LeakReportQuery, PointRankingItem, PointRankingQuery,
} from "./types";
const dayMs = 86400000;
const round = (n: number, digits = 3) => Number(n.toFixed(digits));
function dateText(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function parseDate(s: string) { return new Date(s.replace(/-/g, '/')); }
const today = new Date();
today.setHours(0, 0, 0, 0);
function mockDelay<T>(data: T): Promise<ApiResponse<T>> { return new Promise(resolve => setTimeout(() => resolve({ code: 200, msg: 'success', data, timestamp: Date.now() }), 180)); }
function page<T>(records: T[], q: {
    pageNum?: number;
    pageSize?: number;
}): PageResult<T> {
    const current = q.pageNum || 1, size = q.pageSize || 10;
    return { records: records.slice((current - 1) * size, current * size), total: records.length, current, size };
}
function inRange(time: string, start?: string, end?: string) {
    const v = parseDate(time).getTime();
    return (!start || v >= parseDate(start).getTime()) && (!end || v <= parseDate(end.length === 10 ? end + ' 23:59:59' : end).getTime());
}
const burstDevices = Array.from({ length: 18 }, (_, i) => ({
    deviceId: 1001 + i,
    deviceNumber: `YL-${String(i + 1).padStart(3, '0')}`,
    deviceAlias: `${['东区泵站', '西区主干管', '南区支管', '北区末端'][i % 4]} ${Math.floor(i / 4) + 1} 号测点`,
    installAddress: `${['东区', '西区', '南区', '北区'][i % 4]}再生水管网 K${i + 1}+250`,
}));
// 100 Hz × 10 秒完整采样；列表、曲线和汇总使用相同数据，刷新不会随机变化。
const windows = burstDevices.flatMap((d, i) => Array.from({ length: 3 }, (_, w) => {
    const date = dateText(new Date(today.getTime() - (w + 1) * dayMs));
    const startTime = `${date} 08:${String(i * 3).padStart(2, '0')}:00`, endTime = startTime.slice(0, -2) + '10';
    const values = Array.from({ length: 1000 }, (_, j) => round(.38 + i * .006 + Math.sin(j * .19 + i) * .009 + Math.cos(j * .07) * .005 - (i % 3 === 0 && j >= 460 && j < 480 ? .15 : 0)));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
    const upperLimit = mean + 3 * stdDev, lowerLimit = mean - 3 * stdDev;
    const points = values.map((pressure, j) => ({ time: `${startTime.slice(0, -2)}${String(Math.floor(j / 100)).padStart(2, '0')}.${String(j % 100 * 10).padStart(3, '0')}`, pressure, abnormal: pressure > upperLimit || pressure < lowerLimit }));
    const abnormalCount = points.filter(p => p.abnormal).length;
    const burstSuspected = abnormalCount >= 10; // 仅为演示规则，生产环境采用后端识别结果。
    return { deptId: i % 4 + 1, result: { ...d, startTime, endTime, samplingRate: 100, mean, stdDev, upperLimit, lowerLimit, totalCount: 1000, abnormalCount, abnormalRate: abnormalCount / 10, burstSuspected, status: burstSuspected ? 'SUSPECTED_BURST' : 'NORMAL' }, points };
})).sort((a, b) => b.result.startTime.localeCompare(a.result.startTime));
export function mockGetBurstPipeResults(q: BurstPipeQuery) {
    return mockDelay(page(windows.filter(w => (!q.deviceId || w.result.deviceId === q.deviceId) && (!q.deviceNumber || w.result.deviceNumber.toLowerCase().includes(q.deviceNumber.trim().toLowerCase())) && (!q.deptId || w.deptId === q.deptId) && (typeof q.burstSuspected !== 'boolean' || w.result.burstSuspected === q.burstSuspected) && inRange(w.result.startTime, q.startTime, q.endTime)).map(w => w.result), q));
}
export function mockGetBurstPipeAnalyze(q: {
    deviceNumber: string;
    startTime: string;
    endTime: string;
}): Promise<ApiResponse<BurstPipeAnalyzeData>> {
    const w = windows.find(w => w.result.deviceNumber === q.deviceNumber && w.result.startTime === q.startTime && w.result.endTime === q.endTime);
    if (!w)
        return Promise.reject(new Error('识别窗口不存在'));
    return mockDelay({ ...w.result, points: w.points });
}
export function mockGetBurstPipeSummary() {
    const latest = burstDevices.map(d => windows.find(w => w.result.deviceId === d.deviceId)!.result);
    return mockDelay({ monitoredCount: latest.length, suspectedCount: latest.filter(r => r.burstSuspected).length, abnormalPointTotal: latest.reduce((s, r) => s + r.abnormalCount, 0), lastCheckTime: windows[0].result.endTime });
}
// 其余统计覆盖最近90天，各接口共享日记录和工单记录。
const daily = Array.from({ length: 90 }, (_, offset) => burstDevices.map((d, i) => ({ ...d, deptId: i % 4 + 1, period: dateText(new Date(today.getTime() - offset * dayMs)), leakCount: (offset + i * 3) % 13 === 0 ? 1 : 0, suspectedCount: (offset * 2 + i) % 7 === 0 ? 1 : 0, normalCount: 20 + (i + offset) % 8 }))).flat();
function dailyFor(q: LeakReportQuery) { return daily.filter(d => (!q.deptId || d.deptId === q.deptId) && inRange(d.period + ' 12:00:00', q.startTime, q.endTime)); }
export function mockGetPointRanking(q: PointRankingQuery) {
    const rows: PointRankingItem[] = [];
    burstDevices.forEach((d, i) => {
        const records = dailyFor(q).filter(r => r.deviceId === d.deviceId);
        if (!records.length)
            return;
        const leakCount = records.reduce((s, r) => s + r.leakCount, 0), suspectedCount = records.reduce((s, r) => s + r.suspectedCount, 0);
        rows.push({ ...d, rank: 0, deptName: ['东区', '西区', '南区', '北区'][i % 4], leakCount, suspectedCount, anomalyCount: leakCount + suspectedCount, avgLeakEsa: round(2 + i * .37, 2), maxLeakIntensity: 8 + i, avgNoise: round(42 + i * 1.3, 1), avgPressure: round(.38 + i * .006), riskScore: round(Math.min(100, leakCount * 8 + suspectedCount * 3 + i * .3), 1), currentLeakStatus: i % 6 === 0 ? 0 : i % 3 === 0 ? 2 : 1, lastSamplingTime: records[0].period + ' 12:00:00' });
    });
    const keys: Record<string, keyof PointRankingItem> = { RISK_SCORE: 'riskScore', LEAK_COUNT: 'leakCount', SUSPECTED_COUNT: 'suspectedCount', ANOMALY_COUNT: 'anomalyCount', AVG_LEAK_ESA: 'avgLeakEsa', MAX_LEAK_INTENSITY: 'maxLeakIntensity', AVG_NOISE: 'avgNoise' };
    const key = keys[q.rankMetric || 'RISK_SCORE'];
    rows.sort((a, b) => (Number(a[key]) - Number(b[key])) * (q.order === 'ASC' ? 1 : -1) || a.deviceId - b.deviceId);
    return mockDelay(page(rows.map((r, i) => ({ ...r, rank: i + 1 })), q));
}
function periods(start: string, end: string, monthly = false) {
    const out: string[] = [], cursor = parseDate(start.slice(0, 10)), stop = parseDate(end.slice(0, 10));
    if (monthly)
        cursor.setDate(1);
    while (cursor <= stop && out.length < 1100) {
        out.push(dateText(cursor).slice(0, monthly ? 7 : 10));
        if (monthly)
            cursor.setMonth(cursor.getMonth() + 1);
        else
            cursor.setDate(cursor.getDate() + 1);
    }
    return out;
}
function comparison(metric: string, period: string, id = 1001) {
    const d = parseDate(period.length === 7 ? period + '-01' : period), prev = new Date(d), year = new Date(d);
    if (period.length === 7)
        prev.setMonth(prev.getMonth() - 1);
    else
        prev.setDate(prev.getDate() - 1);
    const month = year.getMonth();
    year.setFullYear(year.getFullYear() - 1);
    if (year.getMonth() !== month)
        year.setDate(0);
    const unit = metric === 'FLOW' ? 'm³/h' : metric === 'PRESSURE' ? 'MPa' : 'dB', base = metric === 'FLOW' ? 120 : metric === 'PRESSURE' ? .42 : 48;
    const value = (date: Date) => round(base * (1 + (id - 1000) * .021 + Math.sin(Math.floor(date.getTime() / dayMs) * .12 + id) * .08));
    const currentValue = value(d), yoyValue = value(year), momValue = value(prev);
    return { period, unit, currentValue, yoyValue, momValue, yoyRate: round((currentValue - yoyValue) / yoyValue * 100, 2), momRate: round((currentValue - momValue) / momValue * 100, 2), sampleCount: period.length === 7 ? new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() * 1440 : 1440 };
}
export function mockGetComparisonOverview(q: ComparisonOverviewQuery) { return mockDelay({ ...comparison(q.metric, q.periodValue, q.deviceId || undefined), metric: q.metric, period: q.period, periodValue: q.periodValue }); }
export function mockGetComparisonTrend(q: ComparisonTrendQuery) { const series = periods(q.startTime, q.endTime, q.granularity === 'MONTH').map(p => comparison(q.metric, p, q.deviceId || undefined)); return mockDelay({ metric: q.metric, unit: series[0]?.unit, series }); }
export function mockGetLeakReportTrend(q: LeakReportQuery) {
    const groups = new Map<string, {
        period: string;
        leakCount: number;
        suspectedCount: number;
        normalCount: number;
    }>();
    dailyFor(q).forEach(r => { const key = r.period.slice(0, q.granularity === 'MONTH' ? 7 : 10), point = groups.get(key) || { period: key, leakCount: 0, suspectedCount: 0, normalCount: 0 }; point.leakCount += r.leakCount; point.suspectedCount += r.suspectedCount; point.normalCount += r.normalCount; groups.set(key, point); });
    return mockDelay({ series: [...groups.values()].sort((a, b) => a.period.localeCompare(b.period)) });
}
const events = daily.filter(r => r.leakCount).map((r, i) => ({ ...r, reportId: i + 1, reportTime: r.period + ' 12:00:00', leakPointPosition: r.installAddress, processStatus: i % 5 === 0 ? 0 : i % 5 === 1 ? 1 : 2 }));
function eventsFor(q: LeakReportQuery) { return events.filter(r => (!q.deptId || r.deptId === q.deptId) && inRange(r.reportTime, q.startTime, q.endTime)); }
export function mockGetLeakReportAnomaly(q: LeakReportQuery) {
    const rows = dailyFor(q), reports = eventsFor(q), sum = (key: 'leakCount' | 'suspectedCount' | 'normalCount') => rows.reduce((s, r) => s + r[key], 0);
    return mockDelay<LeakAnomalyData>({ pressureAbnormalCount: sum('leakCount'), flowAbnormalCount: sum('suspectedCount'), noiseAbnormalCount: Math.floor(sum('suspectedCount') * .6), burstSuspectedCount: windows.filter(w => w.result.burstSuspected && (!q.deptId || w.deptId === q.deptId) && inRange(w.result.startTime, q.startTime, q.endTime)).length, suspectedLeakCount: reports.length, leakPointCount: reports.filter(r => r.processStatus > 0).length, statusDistribution: [{ leakStatus: 0, count: sum('leakCount') }, { leakStatus: 1, count: sum('normalCount') }, { leakStatus: 2, count: sum('suspectedCount') }], suspectedList: reports });
}
export function mockGetLeakHandlingEffect(q: LeakReportQuery) {
    const reports = eventsFor(q), finished = reports.filter(r => r.processStatus === 2);
    return mockDelay<HandlingEffectData>({ totalWorkOrders: reports.length, pendingCount: reports.filter(r => r.processStatus === 0).length, handlingCount: reports.filter(r => r.processStatus === 1).length, finishedCount: finished.length, finishRate: reports.length ? round(finished.length / reports.length * 100, 1) : 0, confirmedLeakPoints: reports.filter(r => r.processStatus > 0).length, avgHandleDurationHours: finished.length ? 6 : undefined, avgRepairDurationHours: finished.length ? 6 : undefined, leakPointList: reports.filter(r => r.processStatus > 0).map(r => ({ deviceId: r.deviceId, deviceNumber: r.deviceNumber, detectTime: r.reportTime, repairTime: r.processStatus === 2 ? r.period + ' 18:00:00' : undefined, leakVolume: `${round(3 + r.deviceId % 9 * .8, 1)} m³/h`, leakPointType: '管道接口', repairMethod: r.processStatus === 2 ? '更换密封件' : '现场排查', leakStatus: r.processStatus === 2 ? '已修复' : '处理中' })) });
}
