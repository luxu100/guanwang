<template>
  <view class="page-container">
    <!-- 顶部筛选栏：时间范围 + 排名指标 -->
    <XConfigToolbar
        v-model="searchForm"
        :fields="toolbarFields"
        :show-add="false"
        :show-delete="false"
        :show-edit="false"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="fetchRanking"
    />

    <!-- 排名表格（行内展开同环比详情，手风琴模式） -->
    <view class="content-layout layout-full">
      <view class="data-table-container">
        <view class="table-head">
          <text>测点排名</text>
          <text class="table-head__meta">
            共 {{ pagination.total }} 条 · 点击行展开同环比分析
          </text>
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
              >
                {{ col.label }}
              </text>

              <text
                  class="data-cell"
                  style="width: 60px; text-align: center;"
              >
                展开
              </text>
            </view>

            <view v-if="loading" class="table-state">
              加载中…
            </view>

            <view
                v-else-if="!rankingList.length"
                class="table-state"
            >
              暂无数据
            </view>

            <template
                v-for="row in rankingList"
                :key="rowKey(row)"
            >
              <!-- 数据行 -->
              <view
                  class="data-row"
                  :class="{
                  'data-row--active': expandedKey === rowKey(row),
                }"
                  @click="toggleRow(row)"
              >
                <text class="data-cell data-cell--index">
                  {{ row.rank }}
                </text>

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
                  >
                    {{ leakStatusText(row.currentLeakStatus) }}
                  </text>

                  <template v-else>
                    {{ cellText(col, row) }}
                  </template>
                </text>

                <text
                    class="data-cell expand-cell"
                    style="width: 60px; text-align: center;"
                >
                  {{ expandedKey === rowKey(row) ? "▾" : "▸" }}
                </text>
              </view>

              <!-- 行内展开详情 -->
              <view
                  v-if="expandedKey === rowKey(row)"
                  class="expand-panel"
              >
                <view
                    v-if="detailLoading"
                    class="table-state"
                    style="height: 120px;"
                >
                  加载中…
                </view>

                <template v-else>
                  <!-- 指标切换 -->
                  <view class="metric-switch">
                    <text class="expand-title">
                      {{ row.deviceNumber }} 同环比分析
                    </text>

                    <view class="metric-buttons">
                      <text
                          v-for="m in metricOptions"
                          :key="m.value"
                          class="metric-btn"
                          :class="{
                          'metric-btn--active': metric === m.value,
                        }"
                          @click.stop="switchMetric(m.value)"
                      >
                        {{ m.label }}
                      </text>
                    </view>
                  </view>

                  <!-- 本期 / 同比 / 环比 三张卡片 -->
                  <view class="compare-cards">
                    <view class="stat-card stat-card--primary">
                      <view class="stat-card__head">
                        <view class="stat-card__title">
                          <text class="stat-card__marker" />
                          <text class="stat-card__label">
                            本期值（{{ periodLabel }}）
                          </text>
                        </view>
                      </view>

                      <view class="stat-card__body">
                        <text class="stat-card__value">
                          {{ fmtNum(overview?.currentValue) }}
                        </text>

                        <text class="stat-card__unit">
                          {{ overview?.unit || "" }}
                        </text>
                      </view>
                    </view>

                    <view class="stat-card stat-card--info">
                      <view class="stat-card__head">
                        <view class="stat-card__title">
                          <text class="stat-card__marker" />
                          <text class="stat-card__label">
                            去年同期（同比）
                          </text>
                        </view>
                      </view>

                      <view class="stat-card__body">
                        <text class="stat-card__value">
                          {{ fmtNum(overview?.yoyValue) }}
                        </text>

                        <text class="stat-card__unit">
                          {{ overview?.unit || "" }}
                        </text>
                      </view>

                      <view class="compare-rate">
                        <text :class="rateClass(overview?.yoyRate)">
                          同比 {{ fmtRate(overview?.yoyRate) }}
                        </text>
                      </view>
                    </view>

                    <view class="stat-card stat-card--success">
                      <view class="stat-card__head">
                        <view class="stat-card__title">
                          <text class="stat-card__marker" />
                          <text class="stat-card__label">
                            上一周期（环比）
                          </text>
                        </view>
                      </view>

                      <view class="stat-card__body">
                        <text class="stat-card__value">
                          {{ fmtNum(overview?.momValue) }}
                        </text>

                        <text class="stat-card__unit">
                          {{ overview?.unit || "" }}
                        </text>
                      </view>

                      <view class="compare-rate">
                        <text :class="rateClass(overview?.momRate)">
                          环比 {{ fmtRate(overview?.momRate) }}
                        </text>
                      </view>
                    </view>
                  </view>

                  <!-- 同环比趋势对比图 -->
                  <view
                      :ref="setTrendChartEl"
                      class="trend-chart"
                  />
                </template>
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
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from "vue";
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
  RankMetric,
} from "@/services/leak-burst/types";

/* ================= 时间工具 ================= */

function toDateStr(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${d.getFullYear()}-${m}-${day}`;
}

function defaultRange() {
  const end = new Date();
  const start = new Date(
      end.getTime() - 29 * 86400000
  );

  return {
    startTime: toDateStr(start),
    endTime: toDateStr(end),
  };
}

/**
 * 依据时间跨度推导周期粒度：
 * >45 天按月，否则按天
 */
function deriveGranularity(
    startTime: string,
    endTime: string
): "DAY" | "MONTH" {
  if (!startTime || !endTime) {
    return "DAY";
  }

  const diff =
      (new Date(endTime).getTime() -
          new Date(startTime).getTime()) /
      86400000;

  return Number.isFinite(diff) && diff > 45
      ? "MONTH"
      : "DAY";
}

/* ================= 筛选 ================= */

const searchForm = ref<Record<string, any>>({
  ...defaultRange(),
  rankMetric: "RISK_SCORE" as RankMetric,
});

const rankMetricOptions = [
  {
    label: "综合风险分",
    value: "RISK_SCORE",
  },
  {
    label: "漏损次数",
    value: "LEAK_COUNT",
  },
  {
    label: "疑似次数",
    value: "SUSPECTED_COUNT",
  },
  {
    label: "异常次数",
    value: "ANOMALY_COUNT",
  },
  {
    label: "平均漏水特征值",
    value: "AVG_LEAK_ESA",
  },
  {
    label: "最大漏水强度",
    value: "MAX_LEAK_INTENSITY",
  },
  {
    label: "平均噪声值",
    value: "AVG_NOISE",
  },
];

const toolbarFields: Field[] = [
  {
    key: "startTime",
    label: "开始时间",
    type: "date",
  },
  {
    key: "endTime",
    label: "结束时间",
    type: "date",
  },
  {
    key: "rankMetric",
    label: "排名指标",
    type: "select",
    options: rankMetricOptions,
  },
];

/* ================= 排名列表 ================= */

const rankingList = ref<PointRankingItem[]>([]);
const loading = ref(false);

const pagination = ref<Pagination>({
  current: 1,
  size: 10,
  total: 0,
});

interface Column {
  key: string;
  label: string;
  width: number;
  align?: "left" | "center" | "right";
  formatter?: (row: PointRankingItem) => string;
}

const columns: Column[] = [
  {
    key: "deviceNumber",
    label: "设备编号",
    width: 120,
  },
  {
    key: "deviceAlias",
    label: "测点别名",
    width: 120,
  },
  {
    key: "deptName",
    label: "所属分区",
    width: 120,
  },
  {
    key: "anomalyCount",
    label: "异常次数",
    width: 100,
    align: "right",
  },
  {
    key: "leakCount",
    label: "漏损次数",
    width: 100,
    align: "right",
  },
  {
    key: "suspectedCount",
    label: "疑似次数",
    width: 100,
    align: "right",
  },
  {
    key: "avgPressure",
    label: "平均压力",
    width: 100,
    align: "right",
    formatter: (r) => fmtNum(r.avgPressure),
  },
  {
    key: "avgNoise",
    label: "平均噪声",
    width: 100,
    align: "right",
    formatter: (r) => fmtNum(r.avgNoise),
  },
  {
    key: "riskScore",
    label: "综合风险分",
    width: 110,
    align: "right",
    formatter: (r) => fmtNum(r.riskScore),
  },
  {
    key: "currentLeakStatus",
    label: "漏损状态",
    width: 110,
    align: "center",
  },
  {
    key: "lastSamplingTime",
    label: "最近采样",
    width: 160,
    formatter: (r) =>
        r.lastSamplingTime
            ? formatDate(r.lastSamplingTime)
            : "-",
  },
];

function cellStyle(col: Column) {
  return {
    width: `${col.width}px`,
    textAlign: col.align || "left",
  };
}

function cellText(
    col: Column,
    row: PointRankingItem
) {
  if (col.formatter) {
    return col.formatter(row);
  }

  const v = (row as any)[col.key];

  return v == null || v === ""
      ? "-"
      : v;
}

function rowKey(row: PointRankingItem) {
  return `${row.deviceId}`;
}

function fmtNum(
    v: number | null | undefined
) {
  return v == null
      ? "-"
      : Number(v).toFixed(2);
}

/**
 * 漏损状态：
 * 0 漏损
 * 1 正常
 * 2 疑似
 * 3 未知
 */
function leakStatusText(
    status: number | undefined
) {
  switch (status) {
    case 0:
      return "漏损";
    case 1:
      return "正常";
    case 2:
      return "疑似";
    case 3:
      return "未知";
    default:
      return "-";
  }
}

function leakStatusClass(
    status: number | undefined
) {
  switch (status) {
    case 0:
      return "status-tag--danger";
    case 1:
      return "status-tag--success";
    case 2:
      return "status-tag--warning";
    default:
      return "status-tag--default";
  }
}

async function fetchRanking() {
  loading.value = true;

  try {
    const res = await getPointRankingT({
      startTime: searchForm.value.startTime,
      endTime: searchForm.value.endTime,
      rankMetric:
          searchForm.value.rankMetric as RankMetric,
      order: "DESC",
      pageNum: pagination.value.current,
      pageSize: pagination.value.size,
    });

    const page = res.data;

    rankingList.value =
        page?.records ?? [];

    pagination.value.total =
        page?.total ?? 0;

    // 列表刷新后收起已展开行
    expandedKey.value = null;
    expandedDevice.value = null;

    overview.value = null;
    trend.value = null;

    disposeChart();
  } finally {
    loading.value = false;
  }
}

/* ================= 行内展开：同环比详情 ================= */

const expandedKey =
    ref<string | null>(null);

const expandedDevice =
    ref<PointRankingItem | null>(null);

const detailLoading = ref(false);

const metric =
    ref<ComparisonMetric>("FLOW");

const metricOptions: {
  label: string;
  value: ComparisonMetric;
}[] = [
  {
    label: "流量",
    value: "FLOW",
  },
  {
    label: "压力",
    value: "PRESSURE",
  },
  {
    label: "噪声",
    value: "NOISE",
  },
];

const overview =
    ref<ComparisonOverview | null>(null);

const trend =
    ref<ComparisonTrendData | null>(null);

/**
 * 注意：
 * trendChartEl 位于 v-for 内部，
 * 不能直接依赖普通 ref，否则可能得到 ref 数组。
 *
 * 使用函数 ref，始终记录当前展开的 DOM。
 */
const trendChartEl =
    ref<HTMLElement | null>(null);

function setTrendChartEl(
    el: HTMLElement | null
) {
  trendChartEl.value = el;
}

let trendChart:
    echarts.ECharts | null = null;

let resizeObserver:
    ResizeObserver | null = null;

/* ================= 展开区周期 ================= */

function getPeriodLabel() {
  const startTime =
      searchForm.value.startTime;

  const endTime =
      searchForm.value.endTime;

  if (!startTime || !endTime) {
    return "-";
  }

  const g = deriveGranularity(
      startTime,
      endTime
  );

  return g === "MONTH"
      ? endTime.slice(0, 7)
      : endTime;
}

const periodLabel =
    ref(getPeriodLabel());

/* ================= 行展开 ================= */

async function toggleRow(
    row: PointRankingItem
) {
  const key = rowKey(row);

  // 当前已经展开，则收起
  if (expandedKey.value === key) {
    expandedKey.value = null;
    expandedDevice.value = null;

    overview.value = null;
    trend.value = null;

    disposeChart();

    return;
  }

  // 先销毁之前的图表
  disposeChart();

  expandedKey.value = key;
  expandedDevice.value = row;

  metric.value = "FLOW";

  overview.value = null;
  trend.value = null;

  await fetchDetail();
}

async function switchMetric(
    m: ComparisonMetric
) {
  if (metric.value === m) {
    return;
  }

  metric.value = m;

  await fetchDetail();
}

/* ================= 加载详情 ================= */

async function fetchDetail() {
  const row = expandedDevice.value;

  if (!row) {
    return;
  }

  detailLoading.value = true;

  periodLabel.value =
      getPeriodLabel();

  const granularity =
      deriveGranularity(
          searchForm.value.startTime,
          searchForm.value.endTime
      );

  const period =
      granularity === "MONTH"
          ? "MONTH"
          : "DAY";

  const periodValue =
      granularity === "MONTH"
          ? searchForm.value.endTime.slice(0, 7)
          : searchForm.value.endTime.slice(0, 10);

  try {
    const [
      overviewRes,
      trendRes,
    ] = await Promise.all([
      getComparisonOverviewT({
        metric: metric.value,
        period,
        periodValue,
        deviceId: row.deviceId,
      }),

      getComparisonTrendT({
        metric: metric.value,
        startTime:
        searchForm.value.startTime,
        endTime:
        searchForm.value.endTime,
        granularity,
        deviceId: row.deviceId,
      }),
    ]);

    overview.value =
        overviewRes.data ?? null;

    trend.value =
        trendRes.data ?? null;

    await nextTick();

    console.log(
        "同环比 trend:",
        trend.value
    );

    console.log(
        "ECharts DOM:",
        trendChartEl.value
    );

    console.log(
        "ECharts series:",
        trend.value?.series
    );

    renderTrendChart();
  } catch (error) {
    console.error(
        "加载同环比详情失败:",
        error
    );

    overview.value = null;
    trend.value = null;

    disposeChart();
  } finally {
    detailLoading.value = false;
  }
}

/* ================= 同环比格式化 ================= */

function fmtRate(
    v: number | null | undefined
) {
  if (v == null) {
    return "-";
  }

  return `${
      v > 0 ? "+" : ""
  }${Number(v).toFixed(1)}%`;
}

function rateClass(
    v: number | null | undefined
) {
  if (v == null) {
    return "rate-flat";
  }

  return v > 0
      ? "rate-up"
      : v < 0
          ? "rate-down"
          : "rate-flat";
}

/* ================= 趋势图 ================= */

function renderTrendChart() {
  const el =
      trendChartEl.value;

  const data =
      trend.value;

  console.log(
      "========== ECharts =========="
  );

  console.log(
      "DOM:",
      el
  );

  console.log(
      "data:",
      data
  );

  console.log(
      "series:",
      data?.series
  );

  console.log(
      "=============================="
  );

  if (!el) {
    console.warn(
        "ECharts 容器不存在"
    );
    return;
  }

  if (!data) {
    console.warn(
        "ECharts 数据不存在"
    );
    return;
  }

  const series =
      data.series ?? [];

  if (!series.length) {
    console.warn(
        "ECharts series 为空"
    );
  }

  /*
   * 如果之前存在图表，
   * 先销毁再重新初始化。
   * 这样切换指标、切换展开行时更加稳定。
   */
  if (
      trendChart &&
      !trendChart.isDisposed()
  ) {
    trendChart.dispose();
    trendChart = null;
  }

  resizeObserver?.disconnect();
  resizeObserver = null;

  trendChart =
      echarts.init(el);

  trendChart.setOption(
      {
        tooltip: {
          trigger: "axis",
        },

        legend: {
          data: [
            "本期值",
            "去年同期值",
            "环比增长率",
          ],
          top: 6,
        },

        grid: {
          left: 48,
          right: 52,
          top: 40,
          bottom: 30,
        },

        xAxis: {
          type: "category",
          data: series.map(
              (p) => p.period
          ),
        },

        yAxis: [
          {
            type: "value",
            name: data.unit || "值",
          },
          {
            type: "value",
            name: "%",
            axisLabel: {
              formatter:
                  "{value}%",
            },
          },
        ],

        series: [
          {
            name: "本期值",
            type: "line",
            smooth: true,
            data: series.map(
                (p) =>
                    p.currentValue ??
                    null
            ),
          },

          {
            name: "去年同期值",
            type: "line",
            smooth: true,
            data: series.map(
                (p) =>
                    p.yoyValue ??
                    null
            ),
          },

          {
            name: "环比增长率",
            type: "bar",
            yAxisIndex: 1,
            barWidth: 10,
            data: series.map(
                (p) =>
                    p.momRate ??
                    null
            ),
          },
        ],
      },
      true
  );

  trendChart.resize();

  resizeObserver =
      new ResizeObserver(() => {
        trendChart?.resize();
      });

  resizeObserver.observe(el);
}

/* ================= 销毁图表 ================= */

function disposeChart() {
  resizeObserver?.disconnect();
  resizeObserver = null;

  if (
      trendChart &&
      !trendChart.isDisposed()
  ) {
    trendChart.dispose();
  }

  trendChart = null;
}

/* ================= 查询/分页 ================= */

function handleSearch() {
  pagination.value.current = 1;

  fetchRanking();
}

function handleReset() {
  searchForm.value = {
    ...defaultRange(),
    rankMetric:
        "RISK_SCORE",
  };

  pagination.value.current = 1;

  fetchRanking();
}

function handlePageChange(
    page: number
) {
  pagination.value.current =
      page;

  fetchRanking();
}

function handlePageSizeChange(
    size: number
) {
  pagination.value.size =
      size;

  pagination.value.current =
      1;

  fetchRanking();
}

/* ================= 生命周期 ================= */

onMounted(() => {
  fetchRanking();
});

onBeforeUnmount(() => {
  disposeChart();
});
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

.metric-btn--active {
  color: #fff;
  background: #0d82ee;
  border-color: #0d82ee;
}

/* ================= 三张对比卡片 ================= */

.compare-cards {
  display: grid;
  grid-template-columns: repeat(
    3,
          minmax(0, 1fr)
  );
  gap: 12px;
  margin-bottom: 14px;
}

.compare-rate {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 800;
}

.rate-up {
  color: #dc2626;
}

.rate-down {
  color: #16a34a;
}

.rate-flat {
  color: #7a8b9d;
}

/* ================= 趋势图 ================= */

.trend-chart {
  width: 100%;
  height: 280px;
  min-height: 280px;
  background: #fff;
}
</style>