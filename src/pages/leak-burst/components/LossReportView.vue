<template>
  <view class="page-container">
    <view class="module-heading"><view><text class="module-heading__title">漏损报表</text><text class="module-heading__description">汇总漏损变化、异常事件与处理结果，支持按统计范围导出报表。</text></view><text v-if="USE_MOCK" class="demo-badge">演示数据</text></view>

    <!-- 顶部筛选栏（含导出按钮） -->
    <XConfigToolbar
        v-model="searchForm"
        :fields="toolbarFields"
        :loading="loading"
        :show-add="false"
        :show-delete="false"
        :show-edit="false"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="fetchAll"
    >
      <template #actions-left>
        <button class="toolbar-button" :disabled="loading || !trendData" @click="handleExport">{{ USE_MOCK ? "导出报表 CSV" : "导出报表" }}</button>
      </template>
    </XConfigToolbar>

    <view v-if="error" class="module-error" @click="fetchAll">{{ error }} · 点击重试</view>
    <view v-if="loading" class="module-note">正在汇总统计数据…</view>
    <scroll-view class="report-scroll" scroll-y>
      <view class="module-note">{{ USE_MOCK ? '演示统计覆盖最近 90 天。' : '' }}趋势按测点状态次数统计；不同类型异常可能重叠，不宜直接相加。处理完成率 = 已完成工单 / 工单总数。</view>
      <view v-if="!loading && trendData && !trendData.series.length" class="module-note">所选时间和分区暂无监测记录，请调整筛选条件。</view>

      <!-- ================= 漏损趋势 ================= -->
      <view class="report-panel">
        <view class="table-head">
          <text>漏损趋势</text>
          <text class="table-head__meta">
            {{ appliedForm.startTime }} ~ {{ appliedForm.endTime }} · {{ granularityLabel }}
          </text>
        </view>
        <view ref="trendChartEl" class="report-chart"/>
      </view>

      <!-- ================= 异常情况统计 ================= -->
      <view class="report-section-title">异常情况统计</view>
      <view class="stat-grid stat-grid--six">
        <LeakStatCard label="压力异常次数" :value="anomaly?.pressureAbnormalCount ?? '-'" tone="warning" />

        <LeakStatCard label="流量异常次数" :value="anomaly?.flowAbnormalCount ?? '-'" tone="info" />

        <LeakStatCard label="噪声异常次数" :value="anomaly?.noiseAbnormalCount ?? '-'" tone="primary" />

        <LeakStatCard label="疑似爆管次数" :value="anomaly?.burstSuspectedCount ?? '-'" tone="danger" />

        <LeakStatCard label="疑似漏损上报数" :value="anomaly?.suspectedLeakCount ?? '-'" tone="warning" />

        <LeakStatCard label="确认漏点数" :value="anomaly?.leakPointCount ?? '-'" tone="danger" />
      </view>

      <view class="anomaly-row">
        <!-- 漏损状态分布饼图 -->
        <view class="report-panel">
          <view class="table-head"><text>漏损状态分布</text></view>
          <view ref="pieChartEl" class="pie-chart"/>
        </view>

        <!-- 疑似漏损事件列表 -->
        <view class="report-panel">
          <view class="table-head">
            <text>疑似漏损事件</text>
            <text class="table-head__meta">共 {{ suspectedList.length }} 条</text>
          </view>
          <XDataTable
              :columns="suspectedColumns"
              :data="suspectedList"
              :show-index="false"
              id-key="reportId"
              empty-text="暂无疑似漏损事件"
          />
        </view>
      </view>

      <!-- ================= 处理效果统计 ================= -->
      <view class="report-section-title">处理效果统计</view>
      <view class="stat-grid stat-grid--four">
        <LeakStatCard label="工单总数" :value="effect?.totalWorkOrders ?? '-'" tone="primary" />

        <LeakStatCard label="待处理" :value="effect?.pendingCount ?? '-'" tone="warning" />

        <LeakStatCard label="处理中" :value="effect?.handlingCount ?? '-'" tone="info" />

        <LeakStatCard label="已完成" :value="effect?.finishedCount ?? '-'" tone="success" :progress="finishRatePercent" />

        <LeakStatCard label="完成率" :value="fmtRate(effect?.finishRate)" tone="success" unit="%" />

        <LeakStatCard label="确认漏点数" :value="effect?.confirmedLeakPoints ?? '-'" tone="danger" />

        <LeakStatCard label="平均处理时长" :value="fmtNum(effect?.avgHandleDurationHours)" tone="info" unit="小时" />

        <LeakStatCard label="平均修复时长" :value="fmtNum(effect?.avgRepairDurationHours)" tone="warning" unit="小时" />
      </view>

      <!-- 漏点明细 -->
      <view class="report-panel">
        <view class="table-head">
          <text>漏点明细</text>
          <text class="table-head__meta">共 {{ leakPointList.length }} 条</text>
        </view>
        <XDataTable
            :columns="leakPointColumns"
            :data="leakPointList"
            :show-index="false"
            id-key="recordKey"
            empty-text="暂无漏点记录"
        />
      </view>

    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import LeakStatCard from "./LeakStatCard.vue";
import { USE_MOCK } from "@/services/leak-burst";
import { chartElement, validateRange, deptOptions } from "./view-utils";
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import * as echarts from "echarts";
import XConfigToolbar from "@/pages/device/components/x/toolbar/XConfigToolbar.vue";
import XDataTable from "@/pages/device/components/x/table/XDataTable.vue";
import type { Field, XDataColumn } from "@/pages/device/components/x/types";
import { formatDate } from "@/utils/time";
import {
  getLeakHandlingEffectT,
  getLeakReportAnomalyT,
  getLeakReportExportUrl,
  getLeakReportTrendT,
} from "@/services/leak-burst";
import type {
  HandlingEffectData,
  LeakAnomalyData,
  LeakPointItem,
  LeakTrendData,
  SuspectedLeakItem,
} from "@/services/leak-burst/types";

/* ================= 时间工具 ================= */
function toDateStr(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function defaultRange() {
  const end = new Date();
  const start = new Date(end.getTime() - 29 * 86400000);
  return { startTime: toDateStr(start), endTime: toDateStr(end) };
}

/** 依据时间跨度推导粒度：>45 天按月，否则按天 */
function deriveGranularity(startTime: string, endTime: string): "DAY" | "MONTH" {
  const diff = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 86400000;
  return Number.isFinite(diff) && diff > 45 ? "MONTH" : "DAY";
}

/**
 * =========================
 * 筛选
 * =========================
 */
const searchForm = ref<Record<string, any>>({
  ...defaultRange(),
  deptId: "",
});

const appliedForm = ref({...searchForm.value});
const loading = ref(false);
const error = ref("");
let reportRequest = 0;

const toolbarFields: Field[] = [
  { key: "startTime", label: "开始时间", type: "date" },
  { key: "endTime", label: "结束时间", type: "date" },
  { key: "deptId", label: "分区", type: "select", options:deptOptions },
];

const granularityLabel = computed(() =>
  deriveGranularity(appliedForm.value.startTime, appliedForm.value.endTime) === "MONTH"
    ? "按月统计"
    : "按天统计"
);

function buildQuery(form = appliedForm.value) {
  return {
    startTime: form.startTime,
    endTime: form.endTime,
    granularity: deriveGranularity(form.startTime, form.endTime),
    deptId: form.deptId === "" ? null : Number(form.deptId),
  };
}

function fmtNum(v: number | null | undefined) {
  return v == null ? "-" : Number(v).toFixed(1);
}

function fmtRate(v: number | null | undefined) {
  return v == null ? "-" : Number(v).toFixed(1);
}

/* ================= 漏损趋势 ================= */
const trendData = ref<LeakTrendData | null>(null);
const trendChartEl = ref<HTMLElement | null>(null);
let trendChart: echarts.ECharts | null = null;
let trendObserver: ResizeObserver | null = null;

function renderTrendChart() {
  if (!trendChartEl.value || !trendData.value) return;

  if (!trendChart || trendChart.isDisposed()) {
    trendChart = echarts.init(chartElement(trendChartEl.value)!);
    trendObserver = new ResizeObserver(() => trendChart?.resize());
    trendObserver.observe(chartElement(trendChartEl.value)!);
  }

  const series = trendData.value.series ?? [];
  trendChart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["漏损次数", "疑似次数", "正常次数"], selected: {"正常次数":false}, top: 6 },
    grid: { left: 44, right: 20, top: 40, bottom: 30 },
    xAxis: { type: "category", data: series.map((p) => p.period) },
    yAxis: { type: "value", minInterval: 1 },
    series: [
      {
        name: "漏损次数",
        type: "line",
        smooth: true,
        data: series.map((p) => p.leakCount ?? 0),
        itemStyle: { color: "#dc2626" },
        areaStyle: { color: "rgba(220,38,38,.08)" },
      },
      {
        name: "疑似次数",
        type: "line",
        smooth: true,
        data: series.map((p) => p.suspectedCount ?? 0),
        itemStyle: { color: "#f59e0b" },
      },
      {
        name: "正常次数",
        type: "line",
        smooth: true,
        data: series.map((p) => p.normalCount ?? 0),
        itemStyle: { color: "#16a34a" },
      },
    ],
  }, true);

  trendChart.resize();
}

/* ================= 异常情况统计 ================= */
const anomaly = ref<LeakAnomalyData | null>(null);
const suspectedList = ref<SuspectedLeakItem[]>([]);
const pieChartEl = ref<HTMLElement | null>(null);
let pieChart: echarts.ECharts | null = null;
let pieObserver: ResizeObserver | null = null;

/* 漏损状态：0 漏损 / 1 正常 / 2 疑似 / 3 未知 */
function leakStatusLabel(status: number) {
  switch (status) {
    case 0: return "漏损";
    case 1: return "正常";
    case 2: return "疑似";
    case 3: return "未知";
    default: return `状态${status}`;
  }
}

function renderPieChart() {
  if (!pieChartEl.value || !anomaly.value) return;

  if (!pieChart || pieChart.isDisposed()) {
    pieChart = echarts.init(chartElement(pieChartEl.value)!);
    pieObserver = new ResizeObserver(() => pieChart?.resize());
    pieObserver.observe(chartElement(pieChartEl.value)!);
  }

  const dist = anomaly.value.statusDistribution ?? [];
  pieChart.setOption({
    tooltip: { trigger: "item", formatter: "{b}：{c} 次（{d}%）" },
    legend: { bottom: 0 },
    color: ["#dc2626", "#16a34a", "#f59e0b", "#94a3b8"],
    series: [
      {
        type: "pie",
        radius: ["38%", "62%"],
        center: ["50%", "46%"],
        label: { formatter: "{b} {c}" },
        data: dist.map((d) => ({
          name: leakStatusLabel(d.leakStatus),
          value: d.count,
        })),
      },
    ],
  }, true);

  pieChart.resize();
}

const suspectedColumns: XDataColumn[] = [
  { key: "deviceNumber", label: "设备编号", width: 110 },
  { key: "reportTime", label: "上报时间", width: 160, formatter: (v) => (v ? formatDate(v) : "-") },
  { key: "leakPointPosition", label: "位置", width: 180, tooltip: true },
  {
    key: "processStatus",
    label: "处理状态",
    width: 100,
    formatter: (v) => {
      switch (v) {
        case 0: return "待处理";
        case 1: return "处理中";
        case 2: return "已完成";
        default: return "-";
      }
    },
  },
];

/* ================= 处理效果统计 ================= */
const effect = ref<HandlingEffectData | null>(null);
const leakPointList = ref<(LeakPointItem & {recordKey:string})[]>([]);

const finishRatePercent = computed(() => {
  const v = effect.value?.finishRate;
  return v == null ? 0 : Math.min(100, Math.max(0, Number(v)));
});

const leakPointColumns: XDataColumn[] = [
  { key: "deviceNumber", label: "设备编号", width: 110 },
  { key: "detectTime", label: "检出时间", width: 160, formatter: (v) => (v ? formatDate(v) : "-") },
  { key: "repairTime", label: "修复时间", width: 160, formatter: (v) => (v ? formatDate(v) : "-") },
  { key: "leakVolume", label: "漏量", width: 100 },
  { key: "leakPointType", label: "漏点类型", width: 110 },
  { key: "repairMethod", label: "修复方式", width: 120 },
  { key: "leakStatus", label: "漏点状态", width: 100 },
];

/* ================= 查询/导出 ================= */
async function fetchAll() {
  if (!validateRange(searchForm.value)) return;
  const request = ++reportRequest;
  const form = {...searchForm.value};
  const query = buildQuery(form);
  loading.value = true; error.value = "";
  try {
    const [t, a, e] = await Promise.all([getLeakReportTrendT(query),getLeakReportAnomalyT(query),getLeakHandlingEffectT(query)]);
    if (request !== reportRequest) return;
    appliedForm.value = form;
    trendData.value = t.data ?? null; anomaly.value = a.data ?? null; effect.value = e.data ?? null;
    suspectedList.value = a.data?.suspectedList ?? [];
    leakPointList.value = (e.data?.leakPointList ?? []).map((r,i)=>({...r,recordKey:`${r.deviceId}_${r.detectTime}_${i}`}));
    await nextTick(); renderTrendChart(); renderPieChart();
  } catch {
    if (request !== reportRequest) return;
    error.value = "报表加载失败，请重试";
    disposeCharts(); trendData.value = null; anomaly.value = null; effect.value = null;
    suspectedList.value = []; leakPointList.value = [];
  } finally { if (request === reportRequest) loading.value = false; }
}

function handleSearch() {
  fetchAll();
}

async function handleReset() {
  await nextTick();
  searchForm.value = { ...defaultRange(), deptId: "" };
  fetchAll();
}

function handleExport() {
  if (loading.value || !trendData.value) return;
  // #ifdef H5
  if (!USE_MOCK) { window.open(getLeakReportExportUrl(buildQuery()), "_blank"); return; }
  const rows: unknown[][] = [
    ["漏损报表（演示数据）"], ["开始时间",appliedForm.value.startTime,"结束时间",appliedForm.value.endTime],
    ["分区",deptOptions.find(d=>d.value===appliedForm.value.deptId)?.label || "全部分区"],
    [],["漏损趋势"],["周期","漏损次数","疑似次数","正常次数"],
    ...trendData.value.series.map(r=>[r.period,r.leakCount,r.suspectedCount,r.normalCount]),
    [],["异常情况"],["压力异常","流量异常","噪声异常","疑似爆管","疑似漏损上报","确认漏点"],
    [anomaly.value?.pressureAbnormalCount,anomaly.value?.flowAbnormalCount,anomaly.value?.noiseAbnormalCount,anomaly.value?.burstSuspectedCount,anomaly.value?.suspectedLeakCount,anomaly.value?.leakPointCount],
    [],["处理效果"],["工单总数","待处理","处理中","已完成","完成率%","平均处理小时","平均修复小时"],
    [effect.value?.totalWorkOrders,effect.value?.pendingCount,effect.value?.handlingCount,effect.value?.finishedCount,effect.value?.finishRate,effect.value?.avgHandleDurationHours,effect.value?.avgRepairDurationHours],
    [],["疑似漏损事件"],["设备编号","上报时间","位置","处理状态"],
    ...suspectedList.value.map(r=>[r.deviceNumber,r.reportTime,r.leakPointPosition,["待处理","处理中","已完成"][r.processStatus ?? -1]]),
    [],["漏点明细"],["设备编号","检出时间","修复时间","漏量","类型","修复方式","状态"],
    ...leakPointList.value.map(r=>[r.deviceNumber,r.detectTime,r.repairTime,r.leakVolume,r.leakPointType,r.repairMethod,r.leakStatus]),
  ];
  const cell = (value: unknown) => {
    let text = String(value ?? "");
    if (/^[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  const blob = new Blob(["\uFEFF" + rows.map(r=>r.map(cell).join(',')).join('\r\n')],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=`漏损报表_${appliedForm.value.startTime.slice(0,10)}_${appliedForm.value.endTime.slice(0,10)}.csv`;
  document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  // #endif
  // #ifndef H5
  uni.showToast({title:"请在浏览器端导出报表",icon:"none"});
  // #endif
}

function disposeCharts() {
  trendChart?.dispose();
  trendChart = null;
  trendObserver?.disconnect();
  trendObserver = null;
  pieChart?.dispose();
  pieChart = null;
  pieObserver?.disconnect();
  pieObserver = null;
}

onMounted(fetchAll);
onBeforeUnmount(() => { ++reportRequest; disposeCharts(); });
</script>

<style scoped lang="scss">
@import "@/pages/device/components/x/common/page-layout.css";
@import "@/pages/device/components/x/common/status.css";
@import "@/pages/device/components/x/table/styles/table.css";
@import "@/pages/device/components/x/table/styles/table-row.css";
@import "@/pages/device/components/x/table/styles/table-cell.css";

.report-scroll {
  flex: 1;
  margin-top: 14px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.report-panel {
  display: flex;
  flex-direction: column;
  flex: none;
  min-width: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
}

.report-section-title {
  flex: none;
  color: #24445f;
  font-size: 15px;
  font-weight: 800;
  padding-left: 2px;
}

.report-chart {
  width: 100%;
  height: 300px;
}

/* ================= 统计卡片 ================= */
.stat-grid {
  display: grid;
  gap: 12px;
  flex: none;
}

.stat-grid--six {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.stat-grid--four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

/* ================= 饼图 + 疑似事件 ================= */
.anomaly-row {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 14px;
  flex: none;
}

.pie-chart {
  width: 100%;
  height: 280px;
}

/* ================= 导出按钮 ================= */
.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  height: 34px;
  margin: 0;
  padding: 0 14px;
  color: #31506d;
  font-size: 14px;
  font-weight: 700;
  line-height: 34px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.toolbar-button::after {
  border: 0;
}
@import "./module.scss";
.report-scroll :deep(.uni-scroll-view-content) > view {margin-bottom:14px;}
.report-panel > :deep(.data-table-container) {height:320px;flex:none;border:0;box-shadow:none;}
.toolbar-button[disabled] {opacity:.5;}

</style>
