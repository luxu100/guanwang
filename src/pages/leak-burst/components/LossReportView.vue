<template>
  <view class="page-container report-page">
    <view class="module-heading">
      <view>
        <text class="module-heading__title">漏损报表</text>
        <text class="module-heading__description">面向全部设备，查看同环比、漏损趋势、测点排名及处置情况。</text>
      </view>
      <text v-if="USE_MOCK" class="demo-badge">统计演示数据 · 工单真实数据</text>
    </view>

    <XConfigToolbar
      v-model="searchForm"
      :fields="toolbarFields"
      :loading="loading"
      :show-add="false"
      :show-delete="false"
      :show-edit="false"
      @search="fetchReport"
      @reset="handleReset"
      @refresh="fetchReport"
    >
      <template #actions-left>
        <button class="export-button" :disabled="loading || !loaded" @click="handleExport">导出报表</button>
      </template>
    </XConfigToolbar>

    <view v-if="error" class="module-error" @click="fetchReport">{{ error }} · 点击重试</view>
    <view v-if="loading" class="module-note">正在汇总报表数据…</view>

    <scroll-view v-else class="report-scroll" scroll-y>
      <view class="scope-bar">
        <view>
          <text class="scope-bar__title">全部设备汇总</text>
          <text class="scope-bar__period">{{ appliedForm.startTime }} 至 {{ appliedForm.endTime }}</text>
        </view>
        <text class="scope-bar__rule">同比：去年同期　环比：上月同期</text>
      </view>

      <view class="section-heading">
        <view><text class="section-heading__title">流量、压力与噪声</text><text class="section-heading__hint">当前统计周期的全设备均值</text></view>
      </view>
      <view class="comparison-grid">
        <view v-for="item in comparisonCards" :key="item.metric" class="comparison-card" :class="`comparison-card--${item.tone}`">
          <view class="comparison-card__head"><text>{{ item.label }}</text><text>{{ item.unit || "—" }}</text></view>
          <view class="comparison-card__value">{{ formatValue(item.currentValue) }}</view>
          <text class="comparison-card__period">{{ item.currentPeriodLabel || "本期暂无数据" }}</text>
          <view class="comparison-card__changes">
            <view><text>同比</text><text :class="changeClass(item.yoyRate)">{{ formatRate(item.yoyRate) }}</text></view>
            <view><text>环比</text><text :class="changeClass(item.momRate)">{{ formatRate(item.momRate) }}</text></view>
          </view>
        </view>
      </view>

      <view class="dashboard-grid">
        <view class="report-panel trend-panel">
          <view class="panel-head"><view><text class="panel-head__title">漏损趋势</text><text class="panel-head__hint">漏损与疑似事件变化</text></view></view>
          <view v-if="trend?.series.length" ref="trendChartEl" class="trend-chart" />
          <view v-else class="empty-block">暂无趋势数据</view>
        </view>

        <view class="report-panel status-panel">
          <view class="panel-head"><view><text class="panel-head__title">报警与处置</text><text class="panel-head__hint">水锤统计与维修工单</text></view></view>
          <view class="status-item">
            <view><text class="status-item__label">水锤报警率</text><text class="status-item__detail">{{ waterHammer?.alarmTerminalCount ?? "—" }} / {{ waterHammer?.monitoredTerminalCount ?? "—" }} 台终端</text></view>
            <text class="status-item__value status-item__value--warning">{{ formatRate(waterHammer?.alarmRate) }}</text>
          </view>
          <view class="status-item">
            <view><text class="status-item__label">水锤报警次数</text><text class="status-item__detail">统计周期内累计</text></view>
            <text class="status-item__value">{{ waterHammer?.alarmCount ?? "—" }} 次</text>
          </view>
          <view class="status-divider" />
          <view v-if="workOrderError" class="work-order-error">真实工单数据加载失败，请稍后刷新</view>
          <view class="status-item">
            <view><text class="status-item__label">维修完成率</text><text class="status-item__detail">{{ workOrderSummary.finished }} / {{ workOrderSummary.total }} 张有效工单</text></view>
            <text class="status-item__value status-item__value--success">{{ workOrderSummary.finishRate.toFixed(1) }}%</text>
          </view>
          <view class="progress-track"><view class="progress-value" :style="{ width: `${workOrderSummary.finishRate}%` }" /></view>
          <view class="status-counts">
            <text>待处理 {{ workOrderSummary.pending }}</text><text>处理中 {{ workOrderSummary.processing }}</text><text>已完成 {{ workOrderSummary.finished }}</text>
          </view>
        </view>
      </view>

      <view class="detail-grid">
        <view class="report-panel">
          <view class="panel-head"><view><text class="panel-head__title">测点风险排名</text><text class="panel-head__hint">复用测点排名接口 · 综合风险前 5 名</text></view></view>
          <XDataTable :columns="rankingColumns" :data="rankingRows" id-key="deviceId" :show-index="false" empty-text="暂无排名数据" />
        </view>
        <view class="report-panel">
          <view class="panel-head"><view><text class="panel-head__title">渗漏与爆管原因</text><text class="panel-head__hint">按事件类型分别统计</text></view></view>
          <XDataTable :columns="causeColumns" :data="causeRows" id-key="rowKey" :show-index="false" empty-text="暂无原因分析数据" />
        </view>
      </view>

      <view class="caliber-note">水锤报警率暂按“发生过报警的多探头终端数 ÷ 参与监测终端数”计算；维修情况直接取自现有工单数据，已取消工单不计入完成率。</view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import * as echarts from "echarts";
import { chartElement, validateRange } from "./view-utils";
import XConfigToolbar from "@/pages/device/components/x/toolbar/XConfigToolbar.vue";
import XDataTable from "@/pages/device/components/x/table/XDataTable.vue";
import type { Field, XDataColumn } from "@/pages/device/components/x/types";
import {
  getLeakCauseAnalysisT,
  getLeakReportExportUrl,
  getLeakReportTrendT,
  getReportComparisonOverviewT,
  getReportPointRankingT,
  getReportWorkOrdersT,
  getWaterHammerSummaryT,
  USE_MOCK,
} from "@/services/leak-burst";
import type {
  CauseReportRow,
  ComparisonMetric,
  ComparisonOverview,
  LeakReportQuery,
  LeakTrendData,
  PointRankingItem,
  ReportWorkOrder,
  WaterHammerSummary,
} from "@/services/leak-burst/types";

const metricOptions: Array<{ metric: ComparisonMetric; label: string; tone: string }> = [
  { metric: "FLOW", label: "流量", tone: "blue" },
  { metric: "PRESSURE", label: "压力", tone: "cyan" },
  { metric: "NOISE", label: "噪声", tone: "orange" },
];

function toDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function defaultForm() {
  const end = new Date();
  const start = new Date(end.getTime() - 29 * 86400000);
  return { startTime: toDateString(start), endTime: toDateString(end), comparisonPeriod: "DAY" };
}
function granularity(start: string, end: string): "DAY" | "MONTH" {
  return (new Date(end).getTime() - new Date(start).getTime()) / 86400000 > 45 ? "MONTH" : "DAY";
}

const searchForm = ref<Record<string, any>>(defaultForm());
const appliedForm = ref({ ...searchForm.value });
const loading = ref(false);
const loaded = ref(false);
const error = ref("");
const comparisons = ref<ComparisonOverview[]>([]);
const trend = ref<LeakTrendData | null>(null);
const waterHammer = ref<WaterHammerSummary | null>(null);
const workOrders = ref<ReportWorkOrder[]>([]);
const workOrderError = ref(false);
const rankings = ref<PointRankingItem[]>([]);
const causes = ref<CauseReportRow[]>([]);
let requestId = 0;

const toolbarFields: Field[] = [
  { key: "startTime", label: "开始时间", type: "date" },
  { key: "endTime", label: "结束时间", type: "date" },
  { key: "comparisonPeriod", label: "同环比周期", type: "select", options: [{ label: "按日", value: "DAY" }, { label: "按月", value: "MONTH" }] },
];

const comparisonCards = computed(() => metricOptions.map((option) => ({
  ...option,
  ...(comparisons.value.find((item) => item.metric === option.metric) ?? {}),
})));
const rankingRows = computed(() => rankings.value.slice(0, 5));
const causeRows = computed(() => causes.value.map((item) => ({ ...item, rowKey: `${item.eventType}_${item.cause}` })));
const workOrderSummary = computed(() => {
  const active = workOrders.value.filter((item) => Number(item.worksheetStatus) !== 3);
  const count = (status: number) => active.filter((item) => Number(item.worksheetStatus) === status).length;
  const finished = count(2);
  return { total: active.length, pending: count(0), processing: count(1), finished, finishRate: active.length ? finished / active.length * 100 : 0 };
});

const rankingColumns: XDataColumn[] = [
  { key: "rank", label: "排名", width: 64 }, { key: "deviceNumber", label: "设备编号", width: 110 },
  { key: "deviceAlias", label: "测点名称", width: 160 }, { key: "riskScore", label: "风险分", width: 90, formatter: (value) => formatValue(value, 1) },
];
const eventOptions = [
  { value: "LEAK", label: "渗漏", tagClass: "status-tag--warning" }, { value: "BURST", label: "爆管", tagClass: "status-tag--danger" },
];
const causeColumns: XDataColumn[] = [
  { key: "eventType", label: "类型", width: 88, options: eventOptions }, { key: "cause", label: "原因", width: 160 },
  { key: "count", label: "数量", width: 76 }, { key: "percent", label: "占比", width: 88, formatter: (value) => `${value}%` },
];

function formatValue(value: unknown, digits = 2) { return value == null || value === "" ? "—" : Number(value).toFixed(digits); }
function formatRate(value: unknown) {
  if (value == null || value === "") return "—";
  const number = Number(value);
  return `${number > 0 ? "+" : ""}${number.toFixed(1)}%`;
}
function changeClass(value: unknown) { const number = Number(value); return number > 0 ? "change-up" : number < 0 ? "change-down" : ""; }
function buildQuery(form = appliedForm.value): LeakReportQuery {
  return { startTime: form.startTime, endTime: form.endTime, comparisonPeriod: form.comparisonPeriod as "DAY" | "MONTH", granularity: granularity(form.startTime, form.endTime) };
}

const trendChartEl = ref<HTMLElement | null>(null);
let trendChart: echarts.ECharts | null = null;
let trendObserver: ResizeObserver | null = null;
function renderTrend() {
  if (!trendChartEl.value || !trend.value?.series.length) { disposeTrend(); return; }
  const element = chartElement(trendChartEl.value);
  if (!element) return;
  if (!trendChart || trendChart.isDisposed()) {
    trendChart = echarts.init(element);
    trendObserver = new ResizeObserver(() => trendChart?.resize());
    trendObserver.observe(element);
  }
  const points = trend.value.series;
  trendChart.setOption({
    color: ["#e05a47", "#efad32"], tooltip: { trigger: "axis" }, legend: { top: 2, right: 8, data: ["漏损", "疑似"] },
    grid: { left: 42, right: 18, top: 42, bottom: 30 }, xAxis: { type: "category", boundaryGap: false, data: points.map((item) => item.period), axisLine: { lineStyle: { color: "#cbd8e3" } } },
    yAxis: { type: "value", minInterval: 1, splitLine: { lineStyle: { color: "#edf2f6" } } },
    series: [
      { name: "漏损", type: "line", smooth: true, symbol: "none", data: points.map((item) => item.leakCount ?? 0), areaStyle: { color: "rgba(224,90,71,.08)" } },
      { name: "疑似", type: "line", smooth: true, symbol: "none", data: points.map((item) => item.suspectedCount ?? 0) },
    ],
  }, true);
}
function disposeTrend() { trendChart?.dispose(); trendChart = null; trendObserver?.disconnect(); trendObserver = null; }

async function fetchReport() {
  if (!validateRange(searchForm.value)) return;
  const currentRequest = ++requestId;
  const form = { ...searchForm.value };
  const query = buildQuery(form);
  const period = form.comparisonPeriod as "DAY" | "MONTH";
  const periodValue = form.endTime.slice(0, period === "MONTH" ? 7 : 10);
  loading.value = true; error.value = "";
  try {
    const comparisonQuery = { period, periodValue, asOfDate: form.endTime };
    const [flow, pressure, noise, trendResult, rankingResult, waterResult, workOrderResult, causeResult] = await Promise.all([
      getReportComparisonOverviewT({ ...comparisonQuery, metric: "FLOW" }),
      getReportComparisonOverviewT({ ...comparisonQuery, metric: "PRESSURE" }),
      getReportComparisonOverviewT({ ...comparisonQuery, metric: "NOISE" }),
      getLeakReportTrendT(query),
      getReportPointRankingT({ startTime: form.startTime, endTime: form.endTime, rankMetric: "RISK_SCORE", order: "DESC", pageNum: 1, pageSize: 5 }),
      getWaterHammerSummaryT(query),
      getReportWorkOrdersT(query).catch(() => null),
      getLeakCauseAnalysisT(query),
    ]);
    if (currentRequest !== requestId) return;
    appliedForm.value = form;
    comparisons.value = [flow.data, pressure.data, noise.data].filter(Boolean) as ComparisonOverview[];
    trend.value = trendResult.data ?? null;
    rankings.value = rankingResult.data?.records ?? [];
    waterHammer.value = waterResult.data ?? null;
    workOrderError.value = !workOrderResult;
    workOrders.value = (workOrderResult?.data ?? []).filter((item) => {
      const time = item.riseTime || item.createdAt;
      return !time || (time.slice(0, 10) >= form.startTime && time.slice(0, 10) <= form.endTime);
    });
    causes.value = causeResult.data?.causes ?? [];
    loaded.value = true;
    // 先结束加载，让 v-else 中的图表容器重新挂载，再初始化 ECharts。
    loading.value = false;
    await nextTick();
    renderTrend();
  } catch {
    if (currentRequest !== requestId) return;
    comparisons.value = []; trend.value = null; rankings.value = []; waterHammer.value = null; workOrders.value = []; causes.value = []; workOrderError.value = false;
    loaded.value = false; disposeTrend(); error.value = "报表加载失败，请重试";
  } finally { if (currentRequest === requestId) loading.value = false; }
}
async function handleReset() { await nextTick(); searchForm.value = defaultForm(); fetchReport(); }

function handleExport() {
  if (!loaded.value) return;
  // #ifdef H5
  if (!USE_MOCK) {
    window.open(getLeakReportExportUrl(buildQuery()), "_blank");
    return;
  }
  const rows: unknown[][] = [
    ["漏损报表（统计为演示数据，工单为真实数据）"],
    ["开始时间", appliedForm.value.startTime, "结束时间", appliedForm.value.endTime],
    [], ["指标同环比"], ["指标", "本期", "同比%", "环比%", "单位"],
    ...comparisonCards.value.map(item => [item.label, item.currentValue, item.yoyRate, item.momRate, item.unit]),
    [], ["漏损趋势"], ["周期", "漏损", "疑似"],
    ...(trend.value?.series ?? []).map(item => [item.period, item.leakCount, item.suspectedCount]),
    [], ["水锤报警"], ["监测终端", "报警终端", "报警次数", "报警率%"],
    [waterHammer.value?.monitoredTerminalCount, waterHammer.value?.alarmTerminalCount, waterHammer.value?.alarmCount, waterHammer.value?.alarmRate],
    [], ["真实维修工单汇总"], ["有效工单", "待处理", "处理中", "已完成", "完成率%"],
    [workOrderSummary.value.total, workOrderSummary.value.pending, workOrderSummary.value.processing, workOrderSummary.value.finished, workOrderSummary.value.finishRate.toFixed(1)],
    [], ["原因分析"], ["类型", "原因", "数量", "占比%"],
    ...causes.value.map(item => [item.eventType === "LEAK" ? "渗漏" : "爆管", item.cause, item.count, item.percent]),
  ];
  const cell = (value: unknown) => {
    let text = String(value ?? "");
    if (/^[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map(row => row.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `漏损报表_${appliedForm.value.startTime}_${appliedForm.value.endTime}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  // #endif
  // #ifndef H5
  uni.showToast({ title: "请在浏览器端导出报表", icon: "none" });
  // #endif
}

onMounted(fetchReport);
onBeforeUnmount(() => { ++requestId; disposeTrend(); });
</script>

<style scoped lang="scss">
@import "@/pages/device/components/x/common/page-layout.css";
@import "@/pages/device/components/x/common/status.css";
@import "@/pages/device/components/x/table/styles/table.css";
@import "@/pages/device/components/x/table/styles/table-row.css";
@import "@/pages/device/components/x/table/styles/table-cell.css";
@import "./module.scss";

.report-page { background: #f5f8fb; }
.report-scroll { flex: 1; min-height: 0; margin-top: 12px; }
.report-scroll :deep(.uni-scroll-view-content) > view { margin-bottom: 12px; }
.scope-bar { display: flex; align-items: center; justify-content: space-between; padding: 13px 18px; color: #34516b; background: linear-gradient(100deg,#eef7ff,#f7fbff); border: 1px solid #d8e8f5; border-radius: 8px; }
.scope-bar__title { display: block; font-size: 15px; font-weight: 800; }
.scope-bar__period,.scope-bar__rule { display: block; margin-top: 3px; color: #73889a; font-size: 12px; }
.section-heading,.panel-head { display: flex; align-items: center; justify-content: space-between; }
.section-heading__title,.panel-head__title { display: block; color: #1f3f59; font-size: 15px; font-weight: 800; }
.section-heading__hint,.panel-head__hint { display: block; margin-top: 3px; color: #8495a4; font-size: 12px; }
.comparison-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 12px; }
.comparison-card { position: relative; overflow: hidden; padding: 16px 18px; background: #fff; border: 1px solid #dfe8ef; border-radius: 8px; box-shadow: 0 5px 16px rgba(42,73,98,.06); }
.comparison-card::before { position: absolute; top: 0; left: 0; width: 4px; height: 100%; content: ""; background: #3189d8; }
.comparison-card--cyan::before { background: #21a6a1; }.comparison-card--orange::before { background: #e69b32; }
.comparison-card__head { display: flex; justify-content: space-between; color: #537087; font-size: 13px; font-weight: 700; }
.comparison-card__value { margin-top: 9px; color: #183b56; font-size: 27px; font-weight: 800; line-height: 1.1; }
.comparison-card__period { display: block; height: 18px; margin-top: 5px; overflow: hidden; color: #91a0ac; font-size: 11px; white-space: nowrap; text-overflow: ellipsis; }
.comparison-card__changes { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; padding-top: 10px; border-top: 1px solid #edf1f4; }
.comparison-card__changes view { display: flex; justify-content: space-between; color: #7a8d9e; font-size: 12px; }.comparison-card__changes text:last-child { color: #405b70; font-weight: 700; }
.change-up { color: #d45b48 !important; }.change-down { color: #1b9b72 !important; }
.dashboard-grid { display: grid; grid-template-columns: minmax(0,1.75fr) minmax(300px,.75fr); gap: 12px; }
.detail-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; }
.report-panel { min-width: 0; overflow: hidden; background: #fff; border: 1px solid #dfe8ef; border-radius: 8px; box-shadow: 0 5px 16px rgba(42,73,98,.05); }
.panel-head { min-height: 54px; padding: 0 16px; border-bottom: 1px solid #edf1f4; }
.trend-chart { width: 100%; height: 265px; }.empty-block { display: flex; align-items: center; justify-content: center; height: 265px; color: #8a9ba9; }
.status-panel { padding-bottom: 14px; }.status-item { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px 5px; }
.status-item__label { display: block; color: #36546b; font-size: 13px; font-weight: 700; }.status-item__detail { display: block; margin-top: 3px; color: #93a2ae; font-size: 11px; }
.status-item__value { color: #254e6c; font-size: 20px; font-weight: 800; }.status-item__value--warning { color: #dc8a22; }.status-item__value--success { color: #1b9670; }
.status-divider { height: 1px; margin: 8px 16px 0; background: #edf1f4; }.progress-track { height: 6px; margin: 9px 16px; overflow: hidden; background: #eaf0f3; border-radius: 99px; }.progress-value { height: 100%; background: #27a77c; border-radius: 99px; }
.work-order-error { margin: 12px 16px 0; padding: 8px 10px; color: #b45309; font-size: 12px; background: #fff7ed; border-radius: 4px; }
.status-counts { display: flex; justify-content: space-between; padding: 2px 16px 0; color: #758a9a; font-size: 11px; }
.detail-grid .report-panel > :deep(.data-table-container) { height: 250px; border: 0; box-shadow: none; }
.caliber-note { padding: 10px 14px; color: #748898; font-size: 12px; line-height: 1.7; background: #eef3f7; border-radius: 6px; }
.export-button { height: 34px; margin: 0; padding: 0 15px; color: #fff; font-size: 13px; font-weight: 700; line-height: 34px; background: #187ecc; border: 0; border-radius: 5px; }.export-button::after { border: 0; }.export-button[disabled] { opacity: .5; }
@media (max-width: 1050px) { .dashboard-grid,.detail-grid { grid-template-columns: 1fr; }.comparison-grid { grid-template-columns: 1fr; } }
</style>
