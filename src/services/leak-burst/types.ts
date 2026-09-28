/**
 * 漏损爆管管理 — 类型定义
 * 对应《漏损爆管管理-需求与前端接口设计》文档
 */

/* ================= 爆管识别 ================= */
export type BurstStatus = "NORMAL" | "SUSPECTED_BURST" | "BURST";


/** 爆管识别结果（列表项，3.1 /leakage/burst-pipe/results） */
export interface BurstPipeResult {
  deviceId: number;
  deviceNumber: string;
  deviceAlias?: string;
  installAddress?: string;
  /** 识别窗口开始时间 */
  startTime: string;
  /** 识别窗口结束时间 */
  endTime: string;
  /** 采样率 Hz */
  samplingRate?: number;
  /** 压力均值 μ */
  mean?: number;
  /** 标准差 σ */
  stdDev?: number;
  /** 上限 μ+3σ */
  upperLimit?: number;
  /** 下限 μ-3σ */
  lowerLimit?: number;
  /** 窗口内采样点总数 */
  totalCount?: number;
  /** 异常点数 */
  abnormalCount?: number;
  /** 异常比例 % */
  abnormalRate?: number;
  /** 是否疑似爆管 */
  burstSuspected?: boolean;
  /** 已确认爆管必须由后端确认结果提供，不能仅由越界推断。 */
  status?: BurstStatus;
  /** 资产评分使用的管材原文。 */
  tubeMaterial?: string;
  /** 管龄，无法取得建设年份时为空。 */
  pipeAgeYears?: number | null;
  /** 临时材质与管龄评分。 */
  assetScore?: number | null;
}

export interface BurstPipeConfirmRequest {
  deviceNumber: string;
  startTime: string;
  endTime: string;
  cause: string;
}

/** 爆管识别查询参数 */
export interface BurstPipeQuery {
  status?: BurstStatus;
  deviceId?: number | null;
  deviceNumber?: string;
  deptId?: number | null;
  startTime?: string;
  endTime?: string;
  burstSuspected?: boolean | null;
  pageNum?: number;
  pageSize?: number;
}

/** 高频压力序列点 */
export interface BurstPipePoint {
  time: string;
  pressure: number;
  abnormal: boolean;
}

/** 爆管识别详情（3.2 /leakage/burst-pipe/analyze） */
export interface BurstPipeAnalyzeData {
  status?: BurstStatus;
  deviceId?: number;
  deviceNumber?: string;
  deviceAlias?: string;
  startTime: string;
  endTime: string;
  mean?: number;
  stdDev?: number;
  upperLimit?: number;
  lowerLimit?: number;
  totalCount?: number;
  abnormalCount?: number;
  abnormalRate?: number;
  burstSuspected?: boolean;
  tubeMaterial?: string;
  pipeAgeYears?: number | null;
  assetScore?: number | null;
  points: BurstPipePoint[];
}

/** 爆管识别概览（3.3 /leakage/burst-pipe/summary） */
export interface BurstPipeSummary {
  monitoredCount?: number;
  suspectedCount?: number;
  confirmedCount?: number;
  abnormalPointTotal?: number;
  lastCheckTime?: string;
}

/* ================= 测点分析 ================= */

/** 排名指标枚举（4.2） */
export type RankMetric =
  | "LEAK_COUNT"
  | "SUSPECTED_COUNT"
  | "ANOMALY_COUNT"
  | "AVG_LEAK_ESA"
  | "MAX_LEAK_INTENSITY"
  | "AVG_NOISE"
  | "RISK_SCORE";

/** 测点排名项（4.2 /leakage/point-ranking） */
export interface PointRankingItem {
  rank: number;
  deviceId: number;
  deviceNumber: string;
  deviceAlias?: string;
  deptName?: string;
  leakCount?: number;
  suspectedCount?: number;
  anomalyCount?: number;
  avgLeakEsa?: number;
  maxLeakIntensity?: number;
  avgNoise?: number;
  avgPressure?: number;
  riskScore?: number;
  currentLeakStatus?: number;
  lastSamplingTime?: string;
}

export interface PointRankingQuery {
  startTime: string;
  endTime: string;
  rankMetric?: RankMetric;
  order?: "ASC" | "DESC";
  deptId?: number | null;
  pageNum?: number;
  pageSize?: number;
}

/** 同环比指标 */
export type ComparisonMetric = "FLOW" | "PRESSURE" | "NOISE";

/** 周期粒度 */
export type ComparisonPeriod = "DAY" | "MONTH" | "YEAR";

/** 同环比概览（4.3 /leakage/comparison/overview） */
export interface ComparisonOverview {
  currentPeriodLabel?: string;
  yoyPeriodLabel?: string;
  momPeriodLabel?: string;
  metric: string;
  period?: string;
  periodValue?: string;
  unit?: string;
  currentValue?: number | null;
  yoyValue?: number | null;
  /** 同比增长率 % */
  yoyRate?: number | null;
  momValue?: number | null;
  /** 环比增长率 % */
  momRate?: number | null;
  sampleCount?: number;
}

export interface ComparisonOverviewQuery {
  /** 月周期截止日，用于本月未结束时的同期对齐。 */
  asOfDate?: string;
  metric: ComparisonMetric;
  aggType?: "AVG" | "MAX" | "MIN" | "SUM";
  period: ComparisonPeriod;
  periodValue: string;
  deviceId?: number | null;
  deptId?: number | null;
}

/** 同环比趋势序列点（4.4） */
export interface ComparisonTrendPoint {
  momValue?: number | null;
  period: string;
  currentValue?: number | null;
  yoyValue?: number | null;
  yoyRate?: number | null;
  momRate?: number | null;
}

/** 同环比趋势（4.4 /leakage/comparison/trend） */
export interface ComparisonTrendData {
  metric?: string;
  unit?: string;
  series: ComparisonTrendPoint[];
}

export interface ComparisonTrendQuery {
  metric: ComparisonMetric;
  startTime: string;
  endTime: string;
  granularity?: "DAY" | "MONTH";
  deviceId?: number | null;
  deptId?: number | null;
}

/* ================= 漏损报表 ================= */

/** 报表公共查询（5.1–5.3） */
export interface LeakReportQuery {
  comparisonPeriod?: "DAY" | "MONTH" | "YEAR";
  startTime: string;
  endTime: string;
  granularity?: "DAY" | "MONTH";
  deptId?: number | null;
}

/** 漏损趋势序列点（5.1） */
export interface LeakTrendPoint {
  period: string;
  leakCount?: number;
  suspectedCount?: number;
  normalCount?: number;
}

export interface LeakTrendData {
  series: LeakTrendPoint[];
}

/** 水锤报警汇总。当前后端未提供对应能力，接口需联调确认。 */
export interface WaterHammerSummary {
  monitoredTerminalCount: number;
  alarmTerminalCount: number;
  alarmCount: number;
  alarmRate: number | null;
}

export interface CauseReportRow {
  eventType: "LEAK" | "BURST";
  cause: string;
  count: number;
  percent: number;
}

export interface LeakCauseAnalysis {
  causes: CauseReportRow[];
}

/** 复用 /api/worksheet/list 时页面需要的最小工单字段。 */
export interface ReportWorkOrder {
  id?: number;
  worksheetNumber?: string;
  worksheetType?: number;
  worksheetStatus?: number;
  riseTime?: string;
  finishTime?: string;
  createdAt?: string;
}
