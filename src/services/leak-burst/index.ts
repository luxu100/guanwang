import { getRequestT, postRequestT } from "@/services/shared/crud.typed";
import { getWorksheetStatisticsList } from "@/services/work-order/statistics";
import type { ApiResponse, PageResult } from "@/types/api";
import {
  mockConfirmBurstPipe, mockGetBurstPipeAnalyze, mockGetBurstPipeResults, mockGetBurstPipeSummary,
  mockGetComparisonOverview, mockGetComparisonTrend, mockGetLeakCauseAnalysis, mockGetLeakReportTrend,
  mockGetPointRanking, mockGetReportWorkOrders, mockGetWaterHammerSummary,
} from "./mock";

import type {
  BurstPipeAnalyzeData,
  BurstPipeQuery,
  BurstPipeResult,
  BurstPipeSummary,
  BurstPipeConfirmRequest,
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

function requireSuccess<T>(request: Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
  return request.then((response) => {
    if (response.code !== 200) return Promise.reject(response);
    return response;
  });
}

/** Spring 可选查询参数不发送空字符串、null 或 undefined。 */
function compactQuery<T extends object>(params: T): T {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined),
  ) as T;
}

export const USE_MOCK = false;

/* ================= 爆管识别 ================= */

/**
 * 3.1 爆管识别结果列表
 */
export function getBurstPipeResultsT(params: BurstPipeQuery) {
  if (USE_MOCK) return mockGetBurstPipeResults(params);
  return requireSuccess(getRequestT<PageResult<BurstPipeResult>>(
      "/api/leakage/burst-pipe/results",
      compactQuery(params)
  ));
}

/**
 * 3.2 爆管识别详情
 */
export function getBurstPipeAnalyzeT(params: {
  deviceNumber: string;
  startTime: string;
  endTime: string;
}) {
  if (USE_MOCK) return mockGetBurstPipeAnalyze(params);
  return requireSuccess(getRequestT<BurstPipeAnalyzeData>(
      "/api/leakage/burst-pipe/analyze",
      {
        deviceNumber: params.deviceNumber.trim(),
        // 这两个值必须与结果列表返回的识别窗口完全一致，包括毫秒。
        startTime: params.startTime,
        endTime: params.endTime,
      }
  ));
}

/**
 * 3.3 爆管识别概览
 */
export function getBurstPipeSummaryT() {
  if (USE_MOCK) return mockGetBurstPipeSummary();
  return requireSuccess(getRequestT<BurstPipeSummary>(
      "/api/leakage/burst-pipe/summary"
  ));
}

export function confirmBurstPipeT(data: BurstPipeConfirmRequest) {
  if (USE_MOCK) return mockConfirmBurstPipe(data);
  return requireSuccess(postRequestT<BurstPipeResult>("/api/leakage/burst-pipe/confirm", data));
}

/* ================= 测点分析 ================= */

/**
 * 4.2 测点排名
 */
export function getPointRankingT(params: PointRankingQuery) {
  if (USE_MOCK) return mockGetPointRanking(params);
  return requireSuccess(getRequestT<PageResult<PointRankingItem>>(
      "/api/leakage/point-ranking",
      params
  ));
}

/**
 * 4.3 同环比概览
 */
export function getComparisonOverviewT(
    params: ComparisonOverviewQuery
) {
  if (USE_MOCK) return mockGetComparisonOverview(params);
  return requireSuccess(getRequestT<ComparisonOverview>(
      "/api/leakage/comparison/overview",
      params
  ));
}

/**
 * 4.4 同环比趋势
 */
export function getComparisonTrendT(
    params: ComparisonTrendQuery
) {
  if (USE_MOCK) return mockGetComparisonTrend(params);
  return requireSuccess(getRequestT<ComparisonTrendData>(
      "/api/leakage/comparison/trend",
      params
  ));
}

/* ================= 漏损报表 ================= */

/**
 * 5.1 漏损趋势
 */
export function getLeakReportTrendT(params: LeakReportQuery) {
  if (USE_MOCK) return mockGetLeakReportTrend(params);
  return requireSuccess(getRequestT<LeakTrendData>(
      "/api/leakage/report/trend",
      params
  ));
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
  return requireSuccess(getRequestT<WaterHammerSummary>("/api/leakage/report/water-hammer", params));
}

/** 渗漏和爆管原因聚合。现有漏点接口不包含完整爆管原因，因此独立统计。 */
export function getLeakCauseAnalysisT(params: LeakReportQuery) {
  if (USE_MOCK) return mockGetLeakCauseAnalysis(params);
  return requireSuccess(getRequestT<LeakCauseAnalysis>("/api/leakage/report/cause-analysis", params));
}

/** 维修完成情况直接复用已有 /api/worksheet/list，不新增后端地址。 */
export function getReportWorkOrdersT(params: LeakReportQuery) {
  if (USE_MOCK) return mockGetReportWorkOrders(params);
  void params;
  return requireSuccess(getWorksheetStatisticsList() as Promise<ApiResponse<ReportWorkOrder[]>>);
}
