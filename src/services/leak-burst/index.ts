import { mockGetExtendedLeakReport } from "./mock";
import type { ExtendedLeakReport } from "./types";
import { getRequestT } from "@/services/shared/crud.typed";
import {
  mockGetBurstPipeResults,
  mockGetBurstPipeAnalyze,
  mockGetBurstPipeSummary,
  mockGetPointRanking,
  mockGetComparisonOverview,
  mockGetComparisonTrend,
  mockGetLeakReportTrend,
  mockGetLeakReportAnomaly,
  mockGetLeakHandlingEffect,
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
  HandlingEffectData,
  LeakAnomalyData,
  LeakReportQuery,
  LeakTrendData,
  PointRankingItem,
  PointRankingQuery,
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
  if (USE_MOCK) {
    return mockGetLeakReportTrend(params);
  }

  return getRequestT<LeakTrendData>(
      "/api/leakage/report/trend",
      params
  );
}

/**
 * 5.2 异常情况统计
 */
export function getLeakReportAnomalyT(params: LeakReportQuery) {
  if (USE_MOCK) {
    return mockGetLeakReportAnomaly(params);
  }

  return getRequestT<LeakAnomalyData>(
      "/api/leakage/report/anomaly",
      params
  );
}

/**
 * 5.3 处理效果统计
 */
export function getLeakHandlingEffectT(params: LeakReportQuery) {
  if (USE_MOCK) {
    return mockGetLeakHandlingEffect(params);
  }

  return getRequestT<HandlingEffectData>(
      "/api/leakage/report/handling-effect",
      params
  );
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
/** 新增报表接口为前端约定，后端地址和字段需联调确认。 */
export function getExtendedLeakReportT(params: LeakReportQuery) {
  if (USE_MOCK) return mockGetExtendedLeakReport(params);
  return getRequestT<ExtendedLeakReport>("/api/leakage/report/extended", params);
}
