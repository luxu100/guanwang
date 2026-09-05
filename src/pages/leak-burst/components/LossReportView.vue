<template>
  <view class="page-container">

    <!-- 顶部筛选栏（含导出按钮） -->
    <XConfigToolbar
        v-model="searchForm"
        :fields="toolbarFields"
        :show-add="false"
        :show-delete="false"
        :show-edit="false"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="fetchAll"
    >
      <template #actions-left>
        <button class="toolbar-button" @click="handleExport">导出报表</button>
      </template>
    </XConfigToolbar>

    <scroll-view class="report-scroll" scroll-y>

      <!-- ================= 漏损趋势 ================= -->
      <view class="report-panel">
        <view class="table-head">
          <text>漏损趋势</text>
          <text class="table-head__meta">
            {{ searchForm.startTime }} ~ {{ searchForm.endTime }} · {{ granularityLabel }}
          </text>
        </view>
        <view ref="trendChartEl" class="report-chart"/>
      </view>

      <!-- ================= 异常情况统计 ================= -->
      <view class="report-section-title">异常情况统计</view>
      <view class="stat-grid stat-grid--six">
        <view class="stat-card stat-card--warning">
          <view class="stat-card__head">
            <view class="stat-card__title">
              <text class="stat-card__marker"/><text class="stat-card__label">压力异常次数</text>
            </view>
          </view>
          <view class="stat-card__body">
            <text class="stat-card__value">{{ anomaly?.pressureAbnormalCount ?? '-' }}</text>
          </view>
        </view>

        <view class="stat-card stat-card--info">
          <view class="stat-card__head">
            <view class="stat-card__title">
              <text class="stat-card__marker"/><text class="stat-card__label">流量异常次数</text>
            </view>
          </view>
          <view class="stat-card__body">
            <text class="stat-card__value">{{ anomaly?.flowAbnormalCount ?? '-' }}</text>
          </view>
        </view>

        <view class="stat-card stat-card--primary">
          <view class="stat-card__head">
            <view class="stat-card__title">
              <text class="stat-card__marker"/><text class="stat-card__label">噪声异常次数</text>
            </view>
          </view>
          <view class="stat-card__body">
            <text class="stat-card__value">{{ anomaly?.noiseAbnormalCount ?? '-' }}</text>
          </view>
        </view>

        <view class="stat-card stat-card--danger">
          <view class="stat-card__head">
            <view class="stat-card__title">
              <text class="stat-card__marker"/><text class="stat-card__label">疑似爆管次数</text>
            </view>
          </view>
          <view class="stat-card__body">
            <text class="stat-card__value">{{ anomaly?.burstSuspectedCount ?? '-' }}</text>
          </view>
        </view>

        <view class="stat-card stat-card--warning">
          <view class="stat-card__head">
            <view class="stat-card__title">
              <text class="stat-card__marker"/><text class="stat-card__label">疑似漏损上报数</text>
            </view>
          </view>
          <view class="stat-card__body">
            <text class="stat-card__value">{{ anomaly?.suspectedLeakCount ?? '-' }}</text>
          </view>
        </view>

        <view class="stat-card stat-card--danger">
          <view class="stat-card__head">
            <view class="stat-card__title">
              <text class="stat-card__marker"/><text class="stat-card__label">确认漏点数</text>
            </view>
          </view>
          <view class="stat-card__body">
            <text class="stat-card__value">{{ anomaly?.leakPointCount ?? '-' }}</text>
          </view>
        </view>
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
        <view class="stat-card stat-card--primary">
          <view class="stat-card__head">
            <view class="stat-card__title">
              <text class="stat-card__marker"/><text class="stat-card__label">工单总数</text>
            </view>
          </view>
          <view class="stat-card__body">
            <text class="stat-card__value">{{ effect?.totalWorkOrders ?? '-' }}</text>
          </view>
        </view>

        <view class="stat-card stat-card--warning">
          <view class="stat-card__head">
            <view class="stat-card__title">
              <text class="stat-card__marker"/><text class="stat-card__label">待处理</text>
            </view>
          </view>
          <view class="stat-card__body">
            <text class="stat-card__value">{{ effect?.pendingCount ?? '-' }}</text>
          </view>
        </view>

        <view class="stat-card stat-card--info">
          <view class="stat-card__head">
            <view class="stat-card__title">
              <text class="stat-card__marker"/><text class="stat-card__label">处理中</text>
            </view>
          </view>
          <view class="stat-card__body">
            <text class="stat-card__value">{{ effect?.handlingCount ?? '-' }}</text>
          </view>
        </view>

        <view class="stat-card stat-card--success">
          <view class="stat-card__head">
            <view class="stat-card__title">
              <text class="stat-card__marker"/><text class="stat-card__label">已完成</text>
            </view>
          </view>
          <view class="stat-card__body">
            <text class="stat-card__value">{{ effect?.finishedCount ?? '-' }}</text>
          </view>
          <view class="stat-card__progress">
            <view class="stat-card__progress-bar" :style="{ width: finishRatePercent + '%' }"/>
          </view>
        </view>

        <view class="stat-card stat-card--success">
          <view class="stat-card__head">
            <view class="stat-card__title">
              <text class="stat-card__marker"/><text class="stat-card__label">完成率</text>
            </view>
          </view>
          <view class="stat-card__body">
            <text class="stat-card__value">{{ fmtRate(effect?.finishRate) }}</text>
            <text class="stat-card__unit">%</text>
          </view>
        </view>

        <view class="stat-card stat-card--danger">
          <view class="stat-card__head">
            <view class="stat-card__title">
              <text class="stat-card__marker"/><text class="stat-card__label">确认漏点数</text>
            </view>
          </view>
          <view class="stat-card__body">
            <text class="stat-card__value">{{ effect?.confirmedLeakPoints ?? '-' }}</text>
          </view>
        </view>

        <view class="stat-card stat-card--info">
          <view class="stat-card__head">
            <view class="stat-card__title">
              <text class="stat-card__marker"/><text class="stat-card__label">平均处理时长</text>
            </view>
          </view>
          <view class="stat-card__body">
            <text class="stat-card__value">{{ fmtNum(effect?.avgHandleDurationHours) }}</text>
            <text class="stat-card__unit">小时</text>
          </view>
        </view>

        <view class="stat-card stat-card--warning">
          <view class="stat-card__head">
            <view class="stat-card__title">
              <text class="stat-card__marker"/><text class="stat-card__label">平均修复时长</text>
            </view>
          </view>
          <view class="stat-card__body">
            <text class="stat-card__value">{{ fmtNum(effect?.avgRepairDurationHours) }}</text>
            <text class="stat-card__unit">小时</text>
          </view>
        </view>
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
            id-key="deviceId"
            empty-text="暂无漏点记录"
        />
      </view>

    </scroll-view>
  </view>
</template>

<script setup lang="ts">
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

const toolbarFields: Field[] = [
  { key: "startTime", label: "开始时间", type: "date" },
  { key: "endTime", label: "结束时间", type: "date" },
  { key: "deptId", label: "分区ID", type: "input" },
];

const granularityLabel = computed(() =>
  deriveGranularity(searchForm.value.startTime, searchForm.value.endTime) === "MONTH"
    ? "按月统计"
    : "按天统计"
);

function buildQuery() {
  return {
    startTime: searchForm.value.startTime,
    endTime: searchForm.value.endTime,
    granularity: deriveGranularity(searchForm.value.startTime, searchForm.value.endTime),
    deptId: searchForm.value.deptId === "" ? null : Number(searchForm.value.deptId),
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

async function fetchTrend() {
  try {
    const res = await getLeakReportTrendT(buildQuery());
    trendData.value = res.data ?? null;
    await nextTick();
    renderTrendChart();
  } catch {
    trendData.value = null;
  }
}

function renderTrendChart() {
  if (!trendChartEl.value || !trendData.value) return;

  if (!trendChart || trendChart.isDisposed()) {
    trendChart = echarts.init(trendChartEl.value);
    trendObserver = new ResizeObserver(() => trendChart?.resize());
    trendObserver.observe(trendChartEl.value);
  }

  const series = trendData.value.series ?? [];
  trendChart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["漏损次数", "疑似次数", "正常次数"], top: 6 },
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

async function fetchAnomaly() {
  try {
    const res = await getLeakReportAnomalyT(buildQuery());
    anomaly.value = res.data ?? null;
    suspectedList.value = res.data?.suspectedList ?? [];
    await nextTick();
    renderPieChart();
  } catch {
    anomaly.value = null;
    suspectedList.value = [];
  }
}

function renderPieChart() {
  if (!pieChartEl.value || !anomaly.value) return;

  if (!pieChart || pieChart.isDisposed()) {
    pieChart = echarts.init(pieChartEl.value);
    pieObserver = new ResizeObserver(() => pieChart?.resize());
    pieObserver.observe(pieChartEl.value);
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
const leakPointList = ref<LeakPointItem[]>([]);

const finishRatePercent = computed(() => {
  const v = effect.value?.finishRate;
  return v == null ? 0 : Math.min(100, Math.max(0, Number(v)));
});

async function fetchEffect() {
  try {
    const res = await getLeakHandlingEffectT(buildQuery());
    effect.value = res.data ?? null;
    leakPointList.value = res.data?.leakPointList ?? [];
  } catch {
    effect.value = null;
    leakPointList.value = [];
  }
}

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
function fetchAll() {
  fetchTrend();
  fetchAnomaly();
  fetchEffect();
}

function handleSearch() {
  fetchAll();
}

function handleReset() {
  searchForm.value = { ...defaultRange(), deptId: "" };
  fetchAll();
}

function handleExport() {
  const url = getLeakReportExportUrl(buildQuery());
  // 后端返回 Excel 文件流，浏览器直接触发下载
  window.open(url, "_blank");
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
onBeforeUnmount(disposeCharts);
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
</style>
