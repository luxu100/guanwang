<template>
  <view class="page-container">
    <view class="module-heading"><view><text class="module-heading__title">测点分析</text><text class="module-heading__description">查看测点监测数据，展开查看流量、压力与噪声的同比、环比。</text></view><text v-if="USE_MOCK" class="demo-badge">演示数据</text></view>

    <!-- 顶部筛选栏：时间范围 + 排名指标 -->
    <XConfigToolbar
        v-model="searchForm"
        :fields="toolbarFields"
        :loading="loading"
        :show-add="false"
        :show-delete="false"
        :show-edit="false"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="fetchRanking"
    />

    <view v-if="error" class="module-error" @click="fetchRanking">{{ error }} · 点击重试</view>
    <view class="module-note">统计范围：{{ appliedForm.startTime }} ～ {{ appliedForm.endTime }}。排名指标待确认，当前按设备编号排列，不代表风险排名。点击测点展开分析。</view>
    <!-- 排名表格（行内展开同环比详情，手风琴模式） -->
    <view class="content-layout layout-full">
      <view class="data-table-container">
        <view class="table-head">
          <text>测点列表（排名规则待确认）</text>
          <text class="table-head__meta">共 {{ pagination.total }} 条 · 点击行展开同环比分析</text>
        </view>

        <scroll-view class="table-scroll" scroll-x scroll-y>
          <view class="data-table">

            <!-- 表头 -->
            <view class="data-row data-row--header">
              <text class="data-cell data-cell--index">#</text>
              <text
                  v-for="col in columns"
                  :key="col.key"
                  class="data-cell"
                  :style="cellStyle(col)"
              >{{ col.label }}</text>
              <text class="data-cell" style="width:60px;text-align:center;">展开</text>
            </view>

            <view v-if="loading" class="table-state">加载中…</view>
            <view v-else-if="!rankingList.length" class="table-state">暂无数据</view>

            <template v-for="row in rankingList" :key="row.deviceId">
              <!-- 数据行 -->
              <view
                  class="data-row"
                  :class="{ 'data-row--active': expandedKey === rowKey(row) }"
                  @click="toggleRow(row)"
              >
                <text class="data-cell data-cell--index">{{ row.rank }}</text>

                <text
                    v-for="col in columns"
                    :key="col.key"
                    class="data-cell"
                    :style="cellStyle(col)"
                >
                  <!-- 漏损状态：标签渲染 -->
                  <text
                      v-if="col.key === 'currentLeakStatus'"
                      class="status-tag"
                      :class="leakStatusClass(row.currentLeakStatus)"
                  >{{ leakStatusText(row.currentLeakStatus) }}</text>

                  <template v-else>{{ cellText(col, row) }}</template>
                </text>

                <text class="data-cell expand-cell" style="width:60px;text-align:center;">
                  {{ expandedKey === rowKey(row) ? '▾' : '▸' }}
                </text>
              </view>

              <!-- 行内展开详情（占满整行宽度） -->
              <view v-if="expandedKey === rowKey(row)" class="expand-panel">

                <!-- 指标切换 -->
                <view class="metric-switch">
                  <text class="expand-title">{{ row.deviceNumber }} 同环比分析</text>
                  <view class="metric-buttons">
                    <text
                        v-for="m in metricOptions"
                        :key="m.value"
                        class="metric-btn"
                        :class="{ 'metric-btn--active': metric === m.value, 'metric-btn--pending': detailLoading && requestedMetric === m.value }"
                        @click.stop="switchMetric(m.value)"
                    >{{ m.label }}</text>
                  </view>
                </view>

                <view class="detail-feedback" aria-live="polite">
                  <text v-if="detailLoading">{{ overview ? '正在切换指标…' : '正在加载分析数据…' }}</text>
                  <text v-else-if="detailError" class="detail-feedback--error" @click="fetchDetail(requestedMetric)">{{ detailError }} · 点击重试</text>
                </view>
                <!-- 本期 / 同比 / 环比 三张卡片 -->
                <view class="compare-cards">
                  <LeakStatCard :label="`本期值（${periodLabel}）`" :value="fmtNum(overview?.currentValue)" tone="primary" :unit="overview?.unit || ''">
                    <template #footer><text class="period-hint">{{ overview?.currentPeriodLabel }}</text></template>
                  </LeakStatCard>

                  <LeakStatCard label="去年同期（同比）" :value="fmtNum(overview?.yoyValue)" tone="info" :unit="overview?.unit || ''">
                    <template #footer>
                      <text class="period-hint">{{ overview?.yoyPeriodLabel }}</text>
                      <view class="compare-rate">
                        <text :class="rateClass(overview?.yoyRate)">同比 {{ fmtRate(overview?.yoyValue === 0 ? undefined : overview?.yoyRate) }}</text>
                      </view>
                    </template>
                  </LeakStatCard>

                  <LeakStatCard label="上月同期（环比）" :value="fmtNum(overview?.momValue)" tone="success" :unit="overview?.unit || ''">
                    <template #footer>
                      <text class="period-hint">{{ overview?.momPeriodLabel }}</text>
                      <view class="compare-rate">
                        <text :class="rateClass(overview?.momRate)">环比 {{ fmtRate(overview?.momValue === 0 ? undefined : overview?.momRate) }}</text>
                      </view>
                    </template>
                  </LeakStatCard>
                </view>

                <view class="module-note">概览显示截止日期所在{{ appliedForm.comparisonPeriod === 'MONTH' ? '月份截至该日' : '日期' }}的平均值；同比对比去年同期，环比对比上月同期。月末、闰日以目标月最后一天对齐。无对比数据或基数为零时不计算增长率。</view>
                <!-- 同环比趋势对比图 -->
                <view ref="trendChartEl" class="trend-chart"/>


              </view>
            </template>

          </view>
        </scroll-view>

        <XPaginationBar
            :current="pagination.current"
            :size="pagination.size"
            :total="pagination.total"
            @change-page="handlePageChange"
            @change-size="handlePageSizeChange"
        />
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import LeakStatCard from "./LeakStatCard.vue";
import { USE_MOCK } from "@/services/leak-burst";
import { chartElement, validateRange, deptOptions } from "./view-utils";
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import * as echarts from "echarts";
import XConfigToolbar from "@/pages/device/components/x/toolbar/XConfigToolbar.vue";
import XPaginationBar from "@/pages/device/components/x/table/XPaginationBar.vue";
import type { Field } from "@/pages/device/components/x/types";
import type { Pagination } from "@/types/api";
import { formatDate } from "@/utils/time";
import {
  getComparisonOverviewT,
  getComparisonTrendT,
  getPointRankingT,
} from "@/services/leak-burst";
import type {
  ComparisonMetric,
  ComparisonOverview,
  ComparisonTrendData,
  PointRankingItem,
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

/**
 * =========================
 * 筛选
 * =========================
 */
const searchForm = ref<Record<string, any>>({
  ...defaultRange(),
  comparisonPeriod: "DAY",
  order:"DESC", deptId:"",
});

const appliedForm = ref({...searchForm.value});
const error = ref("");
let rankingRequest = 0;
let detailRequest = 0;

const toolbarFields: Field[] = [
  {key:"deptId",label:"分区",type:"select",options:deptOptions},

  { key: "startTime", label: "开始时间", type: "date" },
  { key: "endTime", label: "结束时间", type: "date" },
  { key: "comparisonPeriod", label: "统计周期", type: "select", options: [{label:"日均值",value:"DAY"},{label:"月均值",value:"MONTH"}] },
];

/* ================= 排名列表 ================= */
const rankingList = ref<PointRankingItem[]>([]);
const loading = ref(false);
const pagination = ref<Pagination>({ current: 1, size: 10, total: 0 });

interface Column {
  key: string;
  label: string;
  width: number;
  align?: "left" | "center" | "right";
  formatter?: (row: PointRankingItem) => string;
}

const columns: Column[] = [
  {key:"avgLeakEsa",label:"平均漏水特征值",width:120},
  {key:"maxLeakIntensity",label:"最大漏水强度",width:115},
  { key: "deviceNumber", label: "设备编号", width: 120 },
  { key: "deviceAlias", label: "测点别名", width: 120 },
  { key: "deptName", label: "所属分区", width: 120 },
  { key: "anomalyCount", label: "异常次数", width: 100, align: "right" },
  { key: "leakCount", label: "漏损次数", width: 100, align: "right" },
  { key: "suspectedCount", label: "疑似次数", width: 100, align: "right" },
  { key: "avgPressure", label: "压力 MPa", width: 100, align: "right", formatter: (r) => fmtNum(r.avgPressure) },
  { key: "avgNoise", label: "噪声 dB", width: 100, align: "right", formatter: (r) => fmtNum(r.avgNoise) },
  { key: "currentLeakStatus", label: "漏损状态", width: 110, align: "center" },
  { key: "lastSamplingTime", label: "最近采样", width: 160, formatter: (r) => (r.lastSamplingTime ? formatDate(r.lastSamplingTime) : "-") },
];

function cellStyle(col: Column) {
  return { width: `${col.width}px`, textAlign: col.align || "left" };
}

function cellText(col: Column, row: PointRankingItem) {
  if (col.formatter) return col.formatter(row);
  const v = (row as any)[col.key];
  return v == null || v === "" ? "-" : v;
}

function rowKey(row: PointRankingItem) {
  return `${row.deviceId}`;
}

function fmtNum(v: number | null | undefined) {
  return v == null ? "-" : Number(v).toFixed(2);
}

/* 漏损状态：0 漏损 / 1 正常 / 2 疑似 / 3 未知 */
function leakStatusText(status: number | undefined) {
  switch (status) {
    case 0: return "漏损";
    case 1: return "正常";
    case 2: return "疑似";
    case 3: return "未知";
    default: return "-";
  }
}

function leakStatusClass(status: number | undefined) {
  switch (status) {
    case 0: return "status-tag--danger";
    case 1: return "status-tag--success";
    case 2: return "status-tag--warning";
    default: return "status-tag--default";
  }
}

async function fetchRanking() {
  if (!validateRange(searchForm.value)) return;
  const request = ++rankingRequest;
  ++detailRequest; detailCache.clear(); disposeChart();
  expandedKey.value = null; expandedDevice.value = null;
  appliedForm.value = {...searchForm.value};
  error.value = "";
  loading.value = true;
  try {
    const res = await getPointRankingT({
      startTime: searchForm.value.startTime,
      endTime: searchForm.value.endTime,
      rankMetric: "LEAK_COUNT",
      order: "DESC",
      deptId: searchForm.value.deptId === "" ? null : Number(searchForm.value.deptId),
      pageNum: pagination.value.current,
      pageSize: pagination.value.size,
    });
    if (request !== rankingRequest) return;
    const page = res.data;
    rankingList.value = page?.records ?? [];
    pagination.value.total = page?.total ?? 0;

    // 列表刷新后收起已展开行
    expandedKey.value = null;
  } catch {
    if (request !== rankingRequest) return;
    rankingList.value = []; pagination.value.total = 0;
    error.value = "测点排名加载失败";
  } finally {
    if (request === rankingRequest) loading.value = false;
  }
}

/**
 * =========================
 * 行内展开：同环比详情（手风琴）
 * =========================
 */
const expandedKey = ref<string | null>(null);
const expandedDevice = ref<PointRankingItem | null>(null);
const detailLoading = ref(false);
const metric = ref<ComparisonMetric>("FLOW");
const requestedMetric = ref<ComparisonMetric>("FLOW");
const detailError = ref("");
type MetricDetail = { overview: ComparisonOverview | null; trend: ComparisonTrendData | null };
// 缓存当前展开测点的请求，包括进行中的请求，避免切换时重复加载。
const detailCache = new Map<ComparisonMetric, Promise<MetricDetail>>();

const metricOptions: { label: string; value: ComparisonMetric }[] = [
  { label: "流量", value: "FLOW" },
  { label: "压力", value: "PRESSURE" },
  { label: "噪声", value: "NOISE" },
];

const overview = ref<ComparisonOverview | null>(null);
const trend = ref<ComparisonTrendData | null>(null);
const trendChartEl = ref<HTMLElement | null>(null);
let trendChart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

/** 展开区周期标签（随粒度变化） */
function getPeriodLabel() {
  const g = appliedForm.value.comparisonPeriod;
  return g === "MONTH" ? appliedForm.value.endTime.slice(0, 7) : appliedForm.value.endTime;
}
const periodLabel = ref(getPeriodLabel());

async function toggleRow(row: PointRankingItem) {
  if (loading.value) return;
  ++detailRequest;
  detailCache.clear();
  overview.value = null;
  trend.value = null;
  detailError.value = "";
  disposeChart();
  const key = rowKey(row);
  if (expandedKey.value === key) {
    expandedKey.value = null;
    expandedDevice.value = null;
    return;
  }

  expandedKey.value = key;
  expandedDevice.value = row;
  metric.value = "FLOW";
  await fetchDetail();
}

async function switchMetric(m: ComparisonMetric) {
  if (requestedMetric.value === m && detailLoading.value) return;
  if (metric.value === m && !detailLoading.value && !detailError.value) return;
  await fetchDetail(m);
}

function loadMetric(m: ComparisonMetric): Promise<MetricDetail> {
  const cached = detailCache.get(m);
  if (cached) return cached;
  const row = expandedDevice.value!;
  const form = {...appliedForm.value};
  const granularity: "DAY" | "MONTH" = form.comparisonPeriod;
  const periodValue = form.endTime.slice(0, granularity === "MONTH" ? 7 : 10);
  const pending = Promise.all([
    getComparisonOverviewT({ metric:m, period:granularity, periodValue, asOfDate:form.endTime.slice(0,10), deviceId:row.deviceId }),
    getComparisonTrendT({ metric:m, startTime:form.startTime, endTime:form.endTime, granularity, deviceId:row.deviceId }),
  ]).then(([overviewRes, trendRes]) => ({
    overview: overviewRes.data ?? null,
    trend: trendRes.data ?? null,
  })).catch(cause => {
    // 旧测点的请求失败不能清除新测点的缓存。
    if (detailCache.get(m) === pending) detailCache.delete(m);
    throw cause;
  });
  detailCache.set(m, pending);
  return pending;
}

async function fetchDetail(m: ComparisonMetric = "FLOW") {
  if (!expandedDevice.value) return;
  const request = ++detailRequest;
  requestedMetric.value = m;
  detailLoading.value = true;
  detailError.value = "";
  periodLabel.value = getPeriodLabel();
  try {
    const data = await loadMetric(m);
    if (request !== detailRequest) return;
    // 数据、单位和选中指标一起提交，等待期间保留原图与卡片。
    metric.value = m;
    overview.value = data.overview;
    trend.value = data.trend;
    detailLoading.value = false;
    await nextTick();
    if (request !== detailRequest) return;
    renderTrendChart();
    // 提前准备另外两个指标；失败时留给实际切换重试。
    metricOptions.forEach(option => {
      if (option.value !== m) void loadMetric(option.value).catch(() => {});
    });
  } catch {
    if (request !== detailRequest) return;
    detailError.value = "指标加载失败";
  } finally {
    if (request === detailRequest) detailLoading.value = false;
  }
}

function fmtRate(v: number | null | undefined) {
  if (v == null) return "-";
  return `${v > 0 ? "+" : ""}${Number(v).toFixed(1)}%`;
}

function rateClass(v: number | null | undefined) {
  if (v == null) return "rate-flat";
  return v > 0 ? "rate-up" : v < 0 ? "rate-down" : "rate-flat";
}

/* ================= 趋势图 ================= */
function renderTrendChart() {
  if (!trendChartEl.value || !trend.value) return;

  if (!trendChart || trendChart.isDisposed()) {
    trendChart = echarts.init(chartElement(trendChartEl.value)!);
    resizeObserver = new ResizeObserver(() => trendChart?.resize());
    resizeObserver.observe(chartElement(trendChartEl.value)!);
  }

  const series = trend.value.series ?? [];

  trendChart.setOption({
    animationDuration: 250,
    animationDurationUpdate: 300,
    animationEasingUpdate: "cubicOut",
    tooltip: { trigger: "axis" },
    legend: { data: ["本期值", "去年同期值", "上月同期值"], top: 6 },
    grid: { left: 48, right: 52, top: 40, bottom: 30 },
    xAxis: { type: "category", data: series.map((p) => p.period) },
    yAxis: [
      { type: "value", name: trend.value.unit || "值" },

    ],
    series: [
      {
        name: "本期值",
        type: "line",
        smooth: true,
        data: series.map((p) => p.currentValue ?? null),
        itemStyle: { color: "#0d82ee" },
      },
      {
        name: "去年同期值",
        type: "line",
        smooth: true,
        data: series.map((p) => p.yoyValue ?? null),
        itemStyle: { color: "#f59e0b" },
      },
      {
        name: "上月同期值",
        type: "line",
        smooth: true,
        data: series.map((p) => p.momValue ?? null),
        itemStyle: { color: "rgba(22,163,74,.55)" },
      },
    ],
  }, { notMerge: false });

  trendChart.resize();
}

function disposeChart() {
  trendChart?.dispose();
  trendChart = null;
  resizeObserver?.disconnect();
  resizeObserver = null;
}

/* ================= 查询/分页 ================= */
function handleSearch() {
  pagination.value.current = 1;
  fetchRanking();
}

async function handleReset() {
  await nextTick();
  searchForm.value = { ...defaultRange(), comparisonPeriod: "DAY", order:"DESC", deptId:"" };
  pagination.value.current = 1;
  fetchRanking();
}

function handlePageChange(page: number) {
  pagination.value.current = page;
  fetchRanking();
}

function handlePageSizeChange(size: number) {
  pagination.value.size = size;
  pagination.value.current = 1;
  fetchRanking();
}

onMounted(fetchRanking);
onBeforeUnmount(() => { ++rankingRequest; ++detailRequest; detailCache.clear(); disposeChart(); });
</script>

<style scoped lang="scss">
@import "@/pages/device/components/x/common/page-layout.css";
@import "@/pages/device/components/x/common/status.css";
@import "@/pages/device/components/x/table/styles/table.css";
@import "@/pages/device/components/x/table/styles/table-row.css";
@import "@/pages/device/components/x/table/styles/table-cell.css";

.table-scroll {
  flex: 1;
  min-height: 0;
}

.expand-cell {
  color: #0d82ee;
  font-weight: 800;
}

/* ================= 行内展开面板 ================= */
.expand-panel {
  padding: 14px 16px 18px;
  background: #f7fafd;
  border-bottom: 1px solid #dbe7f0;
}

.metric-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.expand-title {
  color: #24445f;
  font-size: 14px;
  font-weight: 800;
}

.metric-buttons {
  display: flex;
  gap: 8px;
}

.metric-btn {
  padding: 4px 14px;
  color: #31506d;
  font-size: 13px;
  font-weight: 700;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  cursor: pointer;
}

.metric-btn { transition: background-color .18s, color .18s, border-color .18s; }
.metric-btn--pending { border-color: #0d82ee; }
.detail-feedback { height: 22px; line-height: 22px; margin-bottom: 8px; font-size: 12px; color: #678094; }
.detail-feedback--error { color: #b42318; cursor: pointer; }

.metric-btn--active {
  color: #fff;
  background: #0d82ee;
  border-color: #0d82ee;
}

/* ================= 三张对比卡片 ================= */
.compare-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.period-hint { display:block; margin-top:8px; font-size:12px; color:#678094; }

.compare-rate {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 800;
}

.rate-up { color: #dc2626; }
.rate-down { color: #16a34a; }
.rate-flat { color: #7a8b9d; }

/* ================= 趋势图 ================= */
.trend-chart {
  width: 100%;
  height: 280px;
}
@import "./module.scss";
.data-table {display:flex;width:100%;min-width:100%;}
.data-row {min-width:100%;}
.expand-panel {box-sizing:border-box; position:sticky; left:0; width:100%; min-width:0;white-space:normal;}
@media(max-width:700px) { .compare-cards {grid-template-columns:1fr;} .metric-switch {flex-wrap:wrap;gap:10px;} }

</style>
