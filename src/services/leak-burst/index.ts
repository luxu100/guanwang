import { getRequestT } from "@/services/shared/crud.typed";
import { getWorksheetStatisticsList } from "@/services/work-order/statistics";
import {
  mockGetBurstPipeResults,
  mockGetBurstPipeAnalyze,
  mockGetBurstPipeSummary,
  mockGetPointRanking,
  mockGetComparisonOverview,
  mockGetComparisonTrend,
  mockGetLeakReportTrend,
  mockGetLeakCauseAnalysis,
  mockGetWaterHammerSummary,
} from "./mock";

import type { PageResult } from "@/types/api";

import type {
  BurstPipeAnalyzeData,
  BurstPipeQuery,
  BurstPipeResult,
  BurstPipeSummary,
  ComparisonOverview,
  ComparisonOverviewQuery,
  ComparisonTrendData,
  ComparisonTrendQuery,
  LeakReportQuery,
  LeakTrendData,
  PointRankingItem,
  PointRankingQuery,
  LeakCauseAnalysis,
  ReportWorkOrder,
  WaterHammerSummary,
} from "./types";

/**
 * 是否启用 Mock
 *
 * true  -> 使用 ./mock.ts
 * false -> 使用真实后端接口
 */
export const USE_MOCK = true;

/* ================= 爆管识别 ================= */

/**
 * 3.1 爆管识别结果列表
 */
export function getBurstPipeResultsT(params: BurstPipeQuery) {
  if (USE_MOCK) {
    return mockGetBurstPipeResults(params);
  }

  return getRequestT<PageResult<BurstPipeResult>>(
      "/api/leakage/burst-pipe/results",
      params
  );
}

/**
 * 3.2 爆管识别详情
 */
export function getBurstPipeAnalyzeT(params: {
  deviceNumber: string;
  startTime: string;
  endTime: string;
}) {
  if (USE_MOCK) {
    return mockGetBurstPipeAnalyze(params);
  }

  return getRequestT<BurstPipeAnalyzeData>(
      "/api/leakage/burst-pipe/analyze",
      params
  );
}

/**
 * 3.3 爆管识别概览
 */
export function getBurstPipeSummaryT() {
  if (USE_MOCK) {
    return mockGetBurstPipeSummary();
  }

  return getRequestT<BurstPipeSummary>(
      "/api/leakage/burst-pipe/summary"
  );
}

/* ================= 测点分析 ================= */

/**
 * 4.2 测点排名
 */
export function getPointRankingT(params: PointRankingQuery) {
  if (USE_MOCK) {
    return mockGetPointRanking(params);
  }

  return getRequestT<PageResult<PointRankingItem>>(
      "/api/leakage/point-ranking",
      params
  );
}

/**
 * 4.3 同环比概览
 */
export function getComparisonOverviewT(
    params: ComparisonOverviewQuery
) {
  if (USE_MOCK) {
    return mockGetComparisonOverview(params);
  }

  return getRequestT<ComparisonOverview>(
      "/api/leakage/comparison/overview",
      params
  );
}

/**
 * 4.4 同环比趋势
 */
export function getComparisonTrendT(
    params: ComparisonTrendQuery
) {
  if (USE_MOCK) {
    return mockGetComparisonTrend(params);
  }

  return getRequestT<ComparisonTrendData>(
      "/api/leakage/comparison/trend",
      params
  );
}

/* ================= 漏损报表 ================= */

/**
 * 5.1 漏损趋势
 */
export function getLeakReportTrendT(params: LeakReportQuery) {
  if (USE_MOCK) return mockGetLeakReportTrend(params);
  return getRequestT<LeakTrendData>(
      "/api/leakage/report/trend",
      params
  );
}

/** 报表页同环比：与测点分析共用后端地址，但始终请求真实接口。 */
export function getReportComparisonOverviewT(params: ComparisonOverviewQuery) {
  if (USE_MOCK) return mockGetComparisonOverview(params);
  return getRequestT<ComparisonOverview>("/api/leakage/comparison/overview", params);
}

/** 报表页测点排名：与测点分析共用后端地址，但始终请求真实接口。 */
export function getReportPointRankingT(params: PointRankingQuery) {
  if (USE_MOCK) return mockGetPointRanking(params);
  return getRequestT<PageResult<PointRankingItem>>("/api/leakage/point-ranking", params);
}

/**
 * 5.4 报表导出
 */
export function getLeakReportExportUrl(params: LeakReportQuery) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
        value !== undefined &&
        value !== null &&
        value !== ""
    ) {
      search.set(key, String(value));
    }
  });

  return `/api/leakage/report/export?${search.toString()}`;
}
/** 水锤报警率。后端暂无可复用接口，因此保持为独立报表接口。 */
export function getWaterHammerSummaryT(params: LeakReportQuery) {
  if (USE_MOCK) return mockGetWaterHammerSummary(params);
  return getRequestT<WaterHammerSummary>("/api/leakage/report/water-hammer", params);
}

/** 渗漏和爆管原因聚合。现有漏点接口不包含完整爆管原因，因此独立统计。 */
export function getLeakCauseAnalysisT(params: LeakReportQuery) {
  if (USE_MOCK) return mockGetLeakCauseAnalysis(params);
  return getRequestT<LeakCauseAnalysis>("/api/leakage/report/cause-analysis", params);
}

/** 维修完成情况直接复用已有 /api/worksheet/list，不新增后端地址。 */
export function getReportWorkOrdersT(params: LeakReportQuery) {
  void params;
  return getWorksheetStatisticsList() as Promise<import("@/types/api").ApiResponse<ReportWorkOrder[]>>;
}
