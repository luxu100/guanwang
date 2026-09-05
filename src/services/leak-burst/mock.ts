import type { ApiResponse, PageResult } from "@/types/api";

import type {
    BurstPipeAnalyzeData,
    BurstPipeQuery,
    BurstPipeResult,
    BurstPipeSummary,
    ComparisonOverview,
    ComparisonOverviewQuery,
    ComparisonTrendData,
    ComparisonTrendQuery,
    HandlingEffectData,
    LeakAnomalyData,
    LeakReportQuery,
    LeakTrendData,
    PointRankingItem,
    PointRankingQuery,
} from "./types";

/**
 * Mock 数据统一延迟
 */
function mockDelay<T>(
    data: T,
    delay = 300
): Promise<ApiResponse<T>> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                code: 200,
                msg: "success",
                data,
                timestamp: Date.now(),
            });
        }, delay);
    });
}

/* =========================================================
 * 3.1 爆管识别结果列表
 * ========================================================= */

export function mockGetBurstPipeResults(
    params: BurstPipeQuery
): Promise<ApiResponse<PageResult<BurstPipeResult>>> {
    const records: BurstPipeResult[] = [
        {
            deviceId: 1001,
            deviceNumber: "YL-001",
            deviceAlias: "一号泵站压力测点",
            installAddress: "东区供水管网 A01",
            startTime: "2026-09-05 08:00:00",
            endTime: "2026-09-05 08:05:00",
            samplingRate: 10,
            mean: 0.42,
            stdDev: 0.08,
            upperLimit: 0.66,
            lowerLimit: 0.18,
            totalCount: 3000,
            abnormalCount: 42,
            abnormalRate: 1.4,
            burstSuspected: true,
            status: "SUSPECTED_BURST",
        },
        {
            deviceId: 1002,
            deviceNumber: "YL-002",
            deviceAlias: "二号泵站压力测点",
            installAddress: "东区供水管网 A02",
            startTime: "2026-09-05 08:00:00",
            endTime: "2026-09-05 08:05:00",
            samplingRate: 10,
            mean: 0.46,
            stdDev: 0.05,
            upperLimit: 0.61,
            lowerLimit: 0.31,
            totalCount: 3000,
            abnormalCount: 8,
            abnormalRate: 0.27,
            burstSuspected: false,
            status: "NORMAL",
        },
        {
            deviceId: 1003,
            deviceNumber: "YL-003",
            deviceAlias: "西区主干管测点",
            installAddress: "西区供水管网 B01",
            startTime: "2026-09-05 08:00:00",
            endTime: "2026-09-05 08:05:00",
            samplingRate: 20,
            mean: 0.51,
            stdDev: 0.11,
            upperLimit: 0.84,
            lowerLimit: 0.18,
            totalCount: 6000,
            abnormalCount: 76,
            abnormalRate: 1.27,
            burstSuspected: true,
            status: "SUSPECTED_BURST",
        },
        {
            deviceId: 1004,
            deviceNumber: "YL-004",
            deviceAlias: "南区管网测点",
            installAddress: "南区供水管网 C01",
            startTime: "2026-09-05 08:00:00",
            endTime: "2026-09-05 08:05:00",
            samplingRate: 10,
            mean: 0.39,
            stdDev: 0.04,
            upperLimit: 0.51,
            lowerLimit: 0.27,
            totalCount: 3000,
            abnormalCount: 5,
            abnormalRate: 0.17,
            burstSuspected: false,
            status: "NORMAL",
        },
        {
            deviceId: 1005,
            deviceNumber: "YL-005",
            deviceAlias: "北区主干管测点",
            installAddress: "北区供水管网 D01",
            startTime: "2026-09-05 08:00:00",
            endTime: "2026-09-05 08:05:00",
            samplingRate: 20,
            mean: 0.48,
            stdDev: 0.09,
            upperLimit: 0.75,
            lowerLimit: 0.21,
            totalCount: 6000,
            abnormalCount: 51,
            abnormalRate: 0.85,
            burstSuspected: true,
            status: "SUSPECTED_BURST",
        },
        {
            deviceId: 1006,
            deviceNumber: "YL-006",
            deviceAlias: "东区支管压力测点",
            installAddress: "东区供水管网 A03",
            startTime: "2026-09-05 08:00:00",
            endTime: "2026-09-05 08:05:00",
            samplingRate: 10,
            mean: 0.44,
            stdDev: 0.06,
            upperLimit: 0.62,
            lowerLimit: 0.26,
            totalCount: 3000,
            abnormalCount: 12,
            abnormalRate: 0.4,
            burstSuspected: false,
            status: "NORMAL",
        },
        {
            deviceId: 1007,
            deviceNumber: "YL-007",
            deviceAlias: "西区次干管测点",
            installAddress: "西区供水管网 B02",
            startTime: "2026-09-05 08:00:00",
            endTime: "2026-09-05 08:05:00",
            samplingRate: 20,
            mean: 0.37,
            stdDev: 0.1,
            upperLimit: 0.67,
            lowerLimit: 0.07,
            totalCount: 6000,
            abnormalCount: 64,
            abnormalRate: 1.07,
            burstSuspected: true,
            status: "SUSPECTED_BURST",
        },
        {
            deviceId: 1008,
            deviceNumber: "YL-008",
            deviceAlias: "北区支管测点",
            installAddress: "北区供水管网 D02",
            startTime: "2026-09-05 08:00:00",
            endTime: "2026-09-05 08:05:00",
            samplingRate: 10,
            mean: 0.47,
            stdDev: 0.05,
            upperLimit: 0.62,
            lowerLimit: 0.32,
            totalCount: 3000,
            abnormalCount: 6,
            abnormalRate: 0.2,
            burstSuspected: false,
            status: "NORMAL",
        },
        {
            deviceId: 1009,
            deviceNumber: "YL-009",
            deviceAlias: "南区主干管测点",
            installAddress: "南区供水管网 C02",
            startTime: "2026-09-05 08:00:00",
            endTime: "2026-09-05 08:05:00",
            samplingRate: 20,
            mean: 0.41,
            stdDev: 0.08,
            upperLimit: 0.65,
            lowerLimit: 0.17,
            totalCount: 6000,
            abnormalCount: 38,
            abnormalRate: 0.63,
            burstSuspected: true,
            status: "SUSPECTED_BURST",
        },
        {
            deviceId: 1010,
            deviceNumber: "YL-010",
            deviceAlias: "南区末端压力测点",
            installAddress: "南区供水管网 C03",
            startTime: "2026-09-05 08:00:00",
            endTime: "2026-09-05 08:05:00",
            samplingRate: 10,
            mean: 0.43,
            stdDev: 0.04,
            upperLimit: 0.55,
            lowerLimit: 0.31,
            totalCount: 3000,
            abnormalCount: 4,
            abnormalRate: 0.13,
            burstSuspected: false,
            status: "NORMAL",
        },
    ];

    let filtered = records;

    if (params.deviceId !== undefined && params.deviceId !== null) {
        filtered = filtered.filter(
            (item) => item.deviceId === params.deviceId
        );
    }

    if (params.deviceNumber) {
        filtered = filtered.filter((item) =>
            item.deviceNumber.includes(params.deviceNumber!)
        );
    }

    if (params.burstSuspected !== undefined && params.burstSuspected !== null) {
        filtered = filtered.filter(
            (item) => item.burstSuspected === params.burstSuspected
        );
    }

    const pageSize = params.pageSize ?? 10;
    const pageNum = params.pageNum ?? 1;

    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return mockDelay({
        records: filtered.slice(startIndex, endIndex),
        total: filtered.length,
        size: pageSize,
        current: pageNum,
    });
}

/* =========================================================
 * 3.2 爆管识别详情
 * ========================================================= */

export function mockGetBurstPipeAnalyze(
    params: {
        deviceNumber: string;
        startTime: string;
        endTime: string;
    }
): Promise<ApiResponse<BurstPipeAnalyzeData>> {
    const basePressure = 0.45;

    const points = Array.from(
        { length: 60 },
        (_, index) => {
            const minute = Math.floor(index / 10);
            const second = (index % 10) * 6;

            const time = `2026-09-05 08:${String(minute).padStart(
                2,
                "0"
            )}:${String(second).padStart(2, "0")}`;

            const abnormal =
                index >= 36 &&
                index <= 42;

            const normalPressure =
                basePressure +
                Math.sin(index / 4) * 0.025 +
                Math.cos(index / 7) * 0.012;

            const abnormalPressure =
                basePressure -
                0.2 -
                Math.sin(index) * 0.015;

            return {
                time,
                pressure: Number(
                    (abnormal ? abnormalPressure : normalPressure).toFixed(3)
                ),
                abnormal,
            };
        }
    );

    const abnormalCount = points.filter(
        (item) => item.abnormal
    ).length;

    return mockDelay({
        deviceId: 1001,
        deviceNumber: params.deviceNumber,
        deviceAlias: "一号泵站压力测点",
        startTime: params.startTime,
        endTime: params.endTime,
        mean: 0.45,
        stdDev: 0.07,
        upperLimit: 0.66,
        lowerLimit: 0.24,
        totalCount: points.length,
        abnormalCount,
        abnormalRate: Number(
            ((abnormalCount / points.length) * 100).toFixed(2)
        ),
        burstSuspected: true,
        points,
    });
}

/* =========================================================
 * 3.3 爆管识别概览
 * ========================================================= */

export function mockGetBurstPipeSummary():
    Promise<ApiResponse<BurstPipeSummary>> {
    return mockDelay({
        monitoredCount: 128,
        suspectedCount: 8,
        abnormalPointTotal: 326,
        lastCheckTime: "2026-09-05 08:30:00",
    });
}

/* =========================================================
 * 4.2 测点排名
 * ========================================================= */

export function mockGetPointRanking(
    params: PointRankingQuery
): Promise<ApiResponse<PageResult<PointRankingItem>>> {
    const records: PointRankingItem[] = [
        {
            rank: 1,
            deviceId: 1001,
            deviceNumber: "YL-001",
            deviceAlias: "一号泵站压力测点",
            deptName: "东区供水管理部",
            leakCount: 28,
            suspectedCount: 12,
            anomalyCount: 35,
            avgLeakEsa: 8.42,
            maxLeakIntensity: 15.72,
            avgNoise: 72.5,
            avgPressure: 0.42,
            riskScore: 92.6,
            currentLeakStatus: 1,
            lastSamplingTime: "2026-09-05 08:30:00",
        },
        {
            rank: 2,
            deviceId: 1003,
            deviceNumber: "YL-003",
            deviceAlias: "西区主干管测点",
            deptName: "西区供水管理部",
            leakCount: 24,
            suspectedCount: 10,
            anomalyCount: 31,
            avgLeakEsa: 7.86,
            maxLeakIntensity: 14.21,
            avgNoise: 68.3,
            avgPressure: 0.51,
            riskScore: 88.4,
            currentLeakStatus: 1,
            lastSamplingTime: "2026-09-05 08:29:00",
        },
        {
            rank: 3,
            deviceId: 1005,
            deviceNumber: "YL-005",
            deviceAlias: "北区主干管测点",
            deptName: "北区供水管理部",
            leakCount: 19,
            suspectedCount: 8,
            anomalyCount: 27,
            avgLeakEsa: 6.73,
            maxLeakIntensity: 12.56,
            avgNoise: 64.8,
            avgPressure: 0.48,
            riskScore: 82.7,
            currentLeakStatus: 1,
            lastSamplingTime: "2026-09-05 08:28:00",
        },
        {
            rank: 4,
            deviceId: 1002,
            deviceNumber: "YL-002",
            deviceAlias: "二号泵站压力测点",
            deptName: "东区供水管理部",
            leakCount: 11,
            suspectedCount: 4,
            anomalyCount: 16,
            avgLeakEsa: 4.52,
            maxLeakIntensity: 8.43,
            avgNoise: 56.2,
            avgPressure: 0.46,
            riskScore: 61.5,
            currentLeakStatus: 0,
            lastSamplingTime: "2026-09-05 08:27:00",
        },
        {
            rank: 5,
            deviceId: 1004,
            deviceNumber: "YL-004",
            deviceAlias: "南区管网测点",
            deptName: "南区供水管理部",
            leakCount: 7,
            suspectedCount: 2,
            anomalyCount: 9,
            avgLeakEsa: 2.85,
            maxLeakIntensity: 5.74,
            avgNoise: 48.7,
            avgPressure: 0.39,
            riskScore: 43.2,
            currentLeakStatus: 0,
            lastSamplingTime: "2026-09-05 08:26:00",
        },
        {
            rank: 6,
            deviceId: 1007,
            deviceNumber: "YL-007",
            deviceAlias: "西区次干管测点",
            deptName: "西区供水管理部",
            leakCount: 6,
            suspectedCount: 3,
            anomalyCount: 8,
            avgLeakEsa: 3.62,
            maxLeakIntensity: 7.13,
            avgNoise: 51.6,
            avgPressure: 0.37,
            riskScore: 55.8,
            currentLeakStatus: 1,
            lastSamplingTime: "2026-09-05 08:25:00",
        },
        {
            rank: 7,
            deviceId: 1009,
            deviceNumber: "YL-009",
            deviceAlias: "南区主干管测点",
            deptName: "南区供水管理部",
            leakCount: 5,
            suspectedCount: 2,
            anomalyCount: 7,
            avgLeakEsa: 3.18,
            maxLeakIntensity: 6.42,
            avgNoise: 49.3,
            avgPressure: 0.41,
            riskScore: 51.4,
            currentLeakStatus: 1,
            lastSamplingTime: "2026-09-05 08:24:00",
        },
        {
            rank: 8,
            deviceId: 1006,
            deviceNumber: "YL-006",
            deviceAlias: "东区支管压力测点",
            deptName: "东区供水管理部",
            leakCount: 4,
            suspectedCount: 1,
            anomalyCount: 5,
            avgLeakEsa: 2.46,
            maxLeakIntensity: 4.81,
            avgNoise: 45.2,
            avgPressure: 0.44,
            riskScore: 39.7,
            currentLeakStatus: 0,
            lastSamplingTime: "2026-09-05 08:23:00",
        },
    ];

    let filtered = records;

    if (params.deptId !== undefined && params.deptId !== null) {
        // Mock 中没有真实 deptId，这里保留参数兼容性。
        filtered = records;
    }

    const metric = params.rankMetric ?? "RISK_SCORE";
    const order = params.order ?? "DESC";

    const metricValue = (item: PointRankingItem): number => {
        switch (metric) {
            case "LEAK_COUNT":
                return item.leakCount ?? 0;
            case "SUSPECTED_COUNT":
                return item.suspectedCount ?? 0;
            case "ANOMALY_COUNT":
                return item.anomalyCount ?? 0;
            case "AVG_LEAK_ESA":
                return item.avgLeakEsa ?? 0;
            case "MAX_LEAK_INTENSITY":
                return item.maxLeakIntensity ?? 0;
            case "AVG_NOISE":
                return item.avgNoise ?? 0;
            case "RISK_SCORE":
            default:
                return item.riskScore ?? 0;
        }
    };

    filtered = [...filtered].sort((a, b) => {
        const diff = metricValue(a) - metricValue(b);
        return order === "ASC" ? diff : -diff;
    });

    filtered = filtered.map((item, index) => ({
        ...item,
        rank: index + 1,
    }));

    const pageSize = params.pageSize ?? 10;
    const pageNum = params.pageNum ?? 1;

    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return mockDelay({
        records: filtered.slice(startIndex, endIndex),
        total: filtered.length,
        size: pageSize,
        current: pageNum,
    });
}

/* =========================================================
 * 4.3 同环比概览
 * ========================================================= */

export function mockGetComparisonOverview(
    params: ComparisonOverviewQuery
): Promise<ApiResponse<ComparisonOverview>> {
    const values: Record<
        string,
        {
            unit: string;
            current: number;
            yoy: number;
            mom: number;
        }
    > = {
        FLOW: {
            unit: "m³/h",
            current: 1268.5,
            yoy: 1186.2,
            mom: 1215.6,
        },
        PRESSURE: {
            unit: "MPa",
            current: 0.46,
            yoy: 0.49,
            mom: 0.48,
        },
        NOISE: {
            unit: "dB",
            current: 62.8,
            yoy: 58.6,
            mom: 60.2,
        },
    };

    const value = values[params.metric] ?? values.FLOW;

    const yoyRate =
        value.yoy === 0
            ? 0
            : ((value.current - value.yoy) / value.yoy) * 100;

    const momRate =
        value.mom === 0
            ? 0
            : ((value.current - value.mom) / value.mom) * 100;

    return mockDelay({
        metric: params.metric,
        period: params.period,
        periodValue: params.periodValue,
        unit: value.unit,
        currentValue: value.current,
        yoyValue: value.yoy,
        yoyRate: Number(yoyRate.toFixed(2)),
        momValue: value.mom,
        momRate: Number(momRate.toFixed(2)),
        sampleCount: 8640,
    });
}

/* =========================================================
 * 4.4 同环比趋势
 * ========================================================= */

export function mockGetComparisonTrend(
    params: ComparisonTrendQuery
): Promise<ApiResponse<ComparisonTrendData>> {
    const series = Array.from(
        { length: 12 },
        (_, index) => {
            const currentValue =
                1000 +
                index * 25 +
                Math.sin(index) * 80;

            const yoyValue = currentValue * 0.92;

            const previousValue =
                index === 0
                    ? 1000
                    : 1000 +
                    (index - 1) * 25 +
                    Math.sin(index - 1) * 80;

            const yoyRate =
                yoyValue === 0
                    ? 0
                    : ((currentValue - yoyValue) / yoyValue) * 100;

            const momRate =
                previousValue === 0
                    ? 0
                    : ((currentValue - previousValue) / previousValue) * 100;

            return {
                period: `2026-${String(index + 1).padStart(2, "0")}`,
                currentValue: Number(currentValue.toFixed(2)),
                yoyValue: Number(yoyValue.toFixed(2)),
                yoyRate: Number(yoyRate.toFixed(2)),
                momRate: Number(momRate.toFixed(2)),
            };
        }
    );

    return mockDelay({
        metric: params.metric,
        unit:
            params.metric === "FLOW"
                ? "m³/h"
                : params.metric === "PRESSURE"
                    ? "MPa"
                    : "dB",
        series,
    });
}

/* =========================================================
 * 5.1 漏损趋势
 * ========================================================= */

export function mockGetLeakReportTrend(
    params: LeakReportQuery
): Promise<ApiResponse<LeakTrendData>> {
    const dailyData: LeakTrendData = {
        series: [
            {
                period: "2026-09-01",
                leakCount: 18,
                suspectedCount: 7,
                normalCount: 11,
            },
            {
                period: "2026-09-02",
                leakCount: 21,
                suspectedCount: 9,
                normalCount: 12,
            },
            {
                period: "2026-09-03",
                leakCount: 16,
                suspectedCount: 6,
                normalCount: 10,
            },
            {
                period: "2026-09-04",
                leakCount: 25,
                suspectedCount: 11,
                normalCount: 14,
            },
            {
                period: "2026-09-05",
                leakCount: 29,
                suspectedCount: 13,
                normalCount: 16,
            },
        ],
    };

    if (params.granularity === "MONTH") {
        return mockDelay({
            series: [
                {
                    period: "2026-05",
                    leakCount: 312,
                    suspectedCount: 128,
                    normalCount: 184,
                },
                {
                    period: "2026-06",
                    leakCount: 346,
                    suspectedCount: 142,
                    normalCount: 204,
                },
                {
                    period: "2026-07",
                    leakCount: 381,
                    suspectedCount: 156,
                    normalCount: 225,
                },
                {
                    period: "2026-08",
                    leakCount: 427,
                    suspectedCount: 181,
                    normalCount: 246,
                },
                {
                    period: "2026-09",
                    leakCount: 109,
                    suspectedCount: 47,
                    normalCount: 62,
                },
            ],
        });
    }

    return mockDelay(dailyData);
}

/* =========================================================
 * 5.2 异常情况统计
 * ========================================================= */

export function mockGetLeakReportAnomaly(
    params: LeakReportQuery
): Promise<ApiResponse<LeakAnomalyData>> {
    return mockDelay({
        pressureAbnormalCount: 86,
        flowAbnormalCount: 53,
        noiseAbnormalCount: 41,
        burstSuspectedCount: 18,
        suspectedLeakCount: 32,
        leakPointCount: 15,

        statusDistribution: [
            {
                leakStatus: 0,
                count: 86,
            },
            {
                leakStatus: 1,
                count: 32,
            },
            {
                leakStatus: 2,
                count: 15,
            },
            {
                leakStatus: 3,
                count: 8,
            },
            {
                leakStatus: 4,
                count: 5,
            },
        ],

        suspectedList: [
            {
                reportId: 10001,
                deviceNumber: "YL-001",
                reportTime: "2026-09-05 08:12:00",
                leakPointPosition: "东区主干管 K1+250",
                processStatus: 1,
            },
            {
                reportId: 10002,
                deviceNumber: "YL-003",
                reportTime: "2026-09-05 07:48:00",
                leakPointPosition: "西区主干管 K3+680",
                processStatus: 0,
            },
            {
                reportId: 10003,
                deviceNumber: "YL-005",
                reportTime: "2026-09-05 07:25:00",
                leakPointPosition: "北区供水管 K2+120",
                processStatus: 2,
            },
            {
                reportId: 10004,
                deviceNumber: "YL-002",
                reportTime: "2026-09-05 06:52:00",
                leakPointPosition: "东区支管 K5+320",
                processStatus: 1,
            },
            {
                reportId: 10005,
                deviceNumber: "YL-004",
                reportTime: "2026-09-05 06:18:00",
                leakPointPosition: "南区管网 K4+580",
                processStatus: 0,
            },
            {
                reportId: 10006,
                deviceNumber: "YL-007",
                reportTime: "2026-09-05 05:46:00",
                leakPointPosition: "西区次干管 K2+460",
                processStatus: 1,
            },
        ],
    });
}

/* =========================================================
 * 5.3 处理效果统计
 * ========================================================= */

export function mockGetLeakHandlingEffect(
    params: LeakReportQuery
): Promise<ApiResponse<HandlingEffectData>> {
    return mockDelay({
        totalWorkOrders: 86,
        pendingCount: 12,
        handlingCount: 18,
        finishedCount: 56,
        finishRate: 65.12,
        confirmedLeakPoints: 42,
        avgHandleDurationHours: 3.6,
        avgRepairDurationHours: 8.4,

        leakPointList: [
            {
                deviceId: 1001,
                deviceNumber: "YL-001",
                detectTime: "2026-09-01 09:20:00",
                repairTime: "2026-09-01 17:30:00",
                leakVolume: "12.6 m³/h",
                leakPointType: "管道接口",
                repairMethod: "更换密封件",
                leakStatus: "已修复",
            },
            {
                deviceId: 1003,
                deviceNumber: "YL-003",
                detectTime: "2026-09-02 10:15:00",
                repairTime: "2026-09-02 19:20:00",
                leakVolume: "18.4 m³/h",
                leakPointType: "管道破损",
                repairMethod: "管道更换",
                leakStatus: "已修复",
            },
            {
                deviceId: 1005,
                deviceNumber: "YL-005",
                detectTime: "2026-09-03 14:35:00",
                repairTime: "2026-09-04 08:20:00",
                leakVolume: "9.8 m³/h",
                leakPointType: "阀门",
                repairMethod: "阀门更换",
                leakStatus: "已修复",
            },
            {
                deviceId: 1002,
                deviceNumber: "YL-002",
                detectTime: "2026-09-04 11:05:00",
                repairTime: undefined,
                leakVolume: "6.3 m³/h",
                leakPointType: "法兰",
                repairMethod: "待处理",
                leakStatus: "处理中",
            },
            {
                deviceId: 1004,
                deviceNumber: "YL-004",
                detectTime: "2026-09-05 07:45:00",
                repairTime: undefined,
                leakVolume: "4.7 m³/h",
                leakPointType: "管道接口",
                repairMethod: "待处理",
                leakStatus: "待处理",
            },
            {
                deviceId: 1007,
                deviceNumber: "YL-007",
                detectTime: "2026-09-05 06:40:00",
                repairTime: undefined,
                leakVolume: "11.2 m³/h",
                leakPointType: "管道破损",
                repairMethod: "制定维修方案",
                leakStatus: "处理中",
            },
            {
                deviceId: 1009,
                deviceNumber: "YL-009",
                detectTime: "2026-09-05 05:55:00",
                repairTime: undefined,
                leakVolume: "7.5 m³/h",
                leakPointType: "阀门",
                repairMethod: "待派单",
                leakStatus: "待处理",
            },
        ],
    });
}