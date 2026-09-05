<template>
  <view class="page-container">
    <!-- 顶部筛选栏 -->
    <XConfigToolbar
        v-model="searchForm"
        :fields="toolbarFields"
        :show-add="false"
        :show-delete="false"
        :show-edit="false"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="fetchAll"
    />

    <!-- 概览卡片 -->
    <view class="summary-row">
      <view class="stat-card stat-card--primary">
        <view class="stat-card__head">
          <view class="stat-card__title">
            <text class="stat-card__marker" />
            <text class="stat-card__label">参与识别测点数</text>
          </view>
        </view>
        <view class="stat-card__body">
          <text class="stat-card__value">
            {{ summary?.monitoredCount ?? "-" }}
          </text>
        </view>
      </view>

      <view class="stat-card stat-card--danger">
        <view class="stat-card__head">
          <view class="stat-card__title">
            <text class="stat-card__marker" />
            <text class="stat-card__label">疑似爆管测点数</text>
          </view>
        </view>
        <view class="stat-card__body">
          <text class="stat-card__value">
            {{ summary?.suspectedCount ?? "-" }}
          </text>
        </view>
      </view>

      <view class="stat-card stat-card--warning">
        <view class="stat-card__head">
          <view class="stat-card__title">
            <text class="stat-card__marker" />
            <text class="stat-card__label">异常点总数</text>
          </view>
        </view>
        <view class="stat-card__body">
          <text class="stat-card__value">
            {{ summary?.abnormalPointTotal ?? "-" }}
          </text>
        </view>
      </view>

      <view class="stat-card stat-card--success">
        <view class="stat-card__head">
          <view class="stat-card__title">
            <text class="stat-card__marker" />
            <text class="stat-card__label">最近识别时间</text>
          </view>
        </view>
        <view class="stat-card__body">
          <text class="stat-card__value stat-card__value--time">
            {{ summary?.lastCheckTime ? formatDate(summary.lastCheckTime) : "-" }}
          </text>
        </view>
      </view>
    </view>

    <!-- 主体 -->
    <view
        class="content-layout"
        :class="{ collapsed: isDetailCollapsed }"
        :style="layoutStyle"
    >
      <!-- 左侧列表 -->
      <view class="data-table-container">
        <view class="table-head">
          <text>爆管识别结果</text>
          <text class="table-head__meta">
            共 {{ pagination.total }} 条
          </text>
        </view>

        <XDataTable
            :columns="columns"
            :data="resultList"
            :loading="loading"
            :selected="selectedKey"
            id-key="resultKey"
            @row-click="handleRowClick"
        >
          <template #footer>
            <XPaginationBar
                :current="pagination.current"
                :size="pagination.size"
                :total="pagination.total"
                @change-page="handlePageChange"
                @change-size="handlePageSizeChange"
            />
          </template>
        </XDataTable>
      </view>

      <!-- 分割/折叠按钮 -->
      <view class="split-handle" @mousedown="startResize">
        {{ isDetailCollapsed ? "⟨" : "⟩" }}
      </view>

      <!-- 右侧详情 -->
      <view v-if="!isDetailCollapsed" class="detail-panel">
        <view class="table-head">
          <text>压力曲线（μ±3σ）</text>

          <text v-if="analyzeData" class="table-head__meta">
            {{ analyzeData.deviceNumber }}
            ·
            {{ analyzeData.startTime }}
            ~
            {{ analyzeData.endTime }}
          </text>
        </view>

        <view v-if="analyzeLoading" class="detail-empty">
          加载中…
        </view>

        <view v-else-if="!analyzeData" class="detail-empty">
          点击左侧列表查看 ±3σ 压力曲线
        </view>

        <template v-else>
          <!-- 统计信息 -->
          <view class="sigma-bar">
            <text class="sigma-item">
              均值 μ：{{ fmt(analyzeData.mean) }}
            </text>

            <text class="sigma-item">
              标准差 σ：{{ fmt(analyzeData.stdDev) }}
            </text>

            <text class="sigma-item sigma-item--upper">
              上限 μ+3σ：{{ fmt(analyzeData.upperLimit) }}
            </text>

            <text class="sigma-item sigma-item--lower">
              下限 μ-3σ：{{ fmt(analyzeData.lowerLimit) }}
            </text>

            <text class="sigma-item">
              异常 {{ analyzeData.abnormalCount ?? 0 }}/{{ analyzeData.totalCount ?? 0 }}
              （{{ fmt(analyzeData.abnormalRate) }}%）
            </text>

            <text
                class="status-tag"
                :class="
                analyzeData.burstSuspected
                  ? 'status-tag--danger'
                  : 'status-tag--success'
              "
            >
              {{ analyzeData.burstSuspected ? "疑似爆管" : "正常" }}
            </text>
          </view>

          <!-- 曲线图 -->
          <view ref="chartEl" class="burst-chart" />
        </template>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import * as echarts from "echarts";

import XConfigToolbar from "@/pages/device/components/x/toolbar/XConfigToolbar.vue";
import XDataTable from "@/pages/device/components/x/table/XDataTable.vue";
import XPaginationBar from "@/pages/device/components/x/table/XPaginationBar.vue";

import type {
  Field,
  XDataColumn,
} from "@/pages/device/components/x/types";

import type { Pagination } from "@/types/api";

import { formatDate } from "@/utils/time";

import {
  getBurstPipeAnalyzeT,
  getBurstPipeResultsT,
  getBurstPipeSummaryT,
} from "@/services/leak-burst";

import type {
  BurstPipeAnalyzeData,
  BurstPipeResult,
  BurstPipeSummary,
} from "@/services/leak-burst/types";

/* =========================
 * 筛选
 * ========================= */

const searchForm = ref<Record<string, any>>({
  deviceNumber: "",
  deptId: "",
  startTime: "",
  endTime: "",
  burstSuspected: "",
});

const toolbarFields: Field[] = [
  {
    key: "deviceNumber",
    label: "设备编号",
    type: "input",
  },
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
    key: "burstSuspected",
    label: "疑似爆管",
    type: "select",
    options: [
      {
        label: "仅看疑似爆管",
        value: true,
      },
      {
        label: "仅看正常",
        value: false,
      },
    ],
  },
];

/* =========================
 * 列表
 * ========================= */

const resultList = ref<
    (BurstPipeResult & {
      resultKey: string;
    })[]
>([]);

const loading = ref(false);

const pagination = ref<Pagination>({
  current: 1,
  size: 10,
  total: 0,
});

const selectedKey = ref<string | null>(null);

/**
 * 单条结果唯一键：
 * deviceId + 时间窗口
 */
function buildKey(row: BurstPipeResult) {
  return `${row.deviceId}_${row.startTime}_${row.endTime}`;
}

function fmt(v: number | null | undefined) {
  return v == null ? "-" : Number(v).toFixed(2);
}

const columns: XDataColumn[] = [
  {
    key: "deviceNumber",
    label: "设备编号",
    width: 110,
  },
  {
    key: "deviceAlias",
    label: "测点别名",
    width: 120,
  },
  {
    key: "startTime",
    label: "窗口开始",
    width: 160,
    formatter: (v) => (v ? formatDate(v) : "-"),
  },
  {
    key: "endTime",
    label: "窗口结束",
    width: 160,
    formatter: (v) => (v ? formatDate(v) : "-"),
  },
  {
    key: "mean",
    label: "均值 μ",
    width: 90,
    align: "right",
    formatter: (v) => fmt(v),
  },
  {
    key: "upperLimit",
    label: "上限 μ+3σ",
    width: 100,
    align: "right",
    formatter: (v) => fmt(v),
  },
  {
    key: "lowerLimit",
    label: "下限 μ-3σ",
    width: 100,
    align: "right",
    formatter: (v) => fmt(v),
  },
  {
    key: "abnormalCount",
    label: "异常点数",
    width: 90,
    align: "right",
  },
  {
    key: "abnormalRate",
    label: "异常比例",
    width: 90,
    align: "right",
    formatter: (v) =>
        v == null ? "-" : `${fmt(v)}%`,
  },
  {
    key: "status",
    label: "识别状态",
    width: 110,
    options: [
      {
        value: "NORMAL",
        label: "正常",
        tagClass: "status-tag--success",
      },
      {
        value: "SUSPECTED_BURST",
        label: "疑似爆管",
        tagClass: "status-tag--danger",
      },
    ],
  },
];

/* =========================
 * 获取识别结果
 * ========================= */

async function fetchResults() {
  loading.value = true;

  try {
    const res = await getBurstPipeResultsT({
      ...searchForm.value,
      pageNum: pagination.value.current,
      pageSize: pagination.value.size,
    });

    const page = res.data;

    resultList.value = (page?.records ?? []).map((row) => ({
      ...row,
      resultKey: buildKey(row),
    }));

    pagination.value.total = page?.total ?? 0;

    // 默认选中第一条
    const first = resultList.value[0];

    if (first) {
      await handleRowClick(first);
    } else {
      selectedKey.value = null;
      analyzeData.value = null;
      disposeChart();
    }
  } catch {
    resultList.value = [];
    pagination.value.total = 0;
    selectedKey.value = null;
    analyzeData.value = null;
    disposeChart();
  } finally {
    loading.value = false;
  }
}

/* =========================
 * 概览
 * ========================= */

const summary = ref<BurstPipeSummary | null>(null);

async function fetchSummary() {
  try {
    const res = await getBurstPipeSummaryT();

    summary.value = res.data ?? null;
  } catch {
    summary.value = null;
  }
}

/* =========================
 * ±3σ 曲线详情
 * ========================= */

const analyzeData = ref<BurstPipeAnalyzeData | null>(null);

const analyzeLoading = ref(false);

const chartEl = ref<HTMLElement | null>(null);

let chart: echarts.ECharts | null = null;

let resizeObserver: ResizeObserver | null = null;

async function handleRowClick(
    row: BurstPipeResult & {
      resultKey: string;
    },
) {
  selectedKey.value = row.resultKey;

  analyzeLoading.value = true;

  try {
    const res = await getBurstPipeAnalyzeT({
      deviceNumber: row.deviceNumber,
      startTime: row.startTime,
      endTime: row.endTime,
    });

    analyzeData.value = res.data ?? null;

    await nextTick();

    renderChart();
  } catch {
    analyzeData.value = null;
    disposeChart();
  } finally {
    analyzeLoading.value = false;
  }
}

/* =========================
 * ECharts
 * ========================= */

function renderChart() {
  if (!chartEl.value || !analyzeData.value) {
    return;
  }

  if (!chart || chart.isDisposed()) {
    chart = echarts.init(chartEl.value);

    resizeObserver = new ResizeObserver(() => {
      chart?.resize();
    });

    resizeObserver.observe(chartEl.value);
  }

  const data = analyzeData.value;
  const points = data.points ?? [];

  chart.setOption(
      {
        tooltip: {
          trigger: "axis",
        },

        legend: {
          data: [
            "压力",
            "均值 μ",
            "上限 μ+3σ",
            "下限 μ-3σ",
          ],
          top: 6,
        },

        grid: {
          left: 48,
          right: 20,
          top: 40,
          bottom: 56,
        },

        xAxis: {
          type: "category",
          data: points.map((p) => p.time),
          axisLabel: {
            rotate: 30,
          },
        },

        yAxis: {
          type: "value",
          name: "压力(MPa)",
          scale: true,
        },

        dataZoom: [
          {
            type: "inside",
          },
          {
            type: "slider",
            height: 18,
            bottom: 8,
          },
        ],

        series: [
          {
            name: "压力",
            type: "line",
            symbol: "circle",
            symbolSize: (
                _value: number,
                params: { dataIndex: number },
            ) => {
              return points[params.dataIndex]?.abnormal ? 8 : 3;
            },

            itemStyle: {
              color: (params: { dataIndex: number }) => {
                return points[params.dataIndex]?.abnormal
                    ? "#dc2626"
                    : "#0d82ee";
              },
            },

            lineStyle: {
              width: 1.4,
            },

            showSymbol: true,

            data: points.map((p) => p.pressure),
          },

          {
            name: "均值 μ",
            type: "line",
            symbol: "none",

            lineStyle: {
              type: "dashed",
              color: "#f59e0b",
              width: 1.5,
            },

            data: points.map(() => data.mean),
          },

          {
            name: "上限 μ+3σ",
            type: "line",
            symbol: "none",

            lineStyle: {
              type: "dashed",
              color: "#dc2626",
              width: 1.5,
            },

            data: points.map(() => data.upperLimit),
          },

          {
            name: "下限 μ-3σ",
            type: "line",
            symbol: "none",

            lineStyle: {
              type: "dashed",
              color: "#16a34a",
              width: 1.5,
            },

            data: points.map(() => data.lowerLimit),
          },
        ],
      },
      true,
  );

  chart.resize();
}

function disposeChart() {
  resizeObserver?.disconnect();
  resizeObserver = null;

  chart?.dispose();
  chart = null;
}

watch(analyzeData, async () => {
  await nextTick();
  renderChart();
});

/* =========================
 * 右侧面板拖拽 / 折叠
 * ========================= */

const isDetailCollapsed = ref(false);

const detailWidth = ref(560);

let startX = 0;

let startWidth = 0;

let isDragging = false;

const layoutStyle = computed(() => {
  if (isDetailCollapsed.value) {
    return {
      gridTemplateColumns: "minmax(0, 1fr) 24px",
    };
  }

  return {
    gridTemplateColumns: `minmax(0, 1fr) 24px ${detailWidth.value}px`,
  };
});

function startResize(e: MouseEvent) {
  startX = e.clientX;

  startWidth = detailWidth.value;

  isDragging = false;

  document.addEventListener("mousemove", resize);

  document.addEventListener("mouseup", stopResize);
}

function resize(e: MouseEvent) {
  const diff = startX - e.clientX;

  if (Math.abs(diff) > 3) {
    isDragging = true;
  }

  detailWidth.value = Math.max(
      360,
      Math.min(1000, startWidth + diff),
  );
}

function stopResize() {
  document.removeEventListener("mousemove", resize);

  document.removeEventListener("mouseup", stopResize);

  if (!isDragging) {
    isDetailCollapsed.value = !isDetailCollapsed.value;

    nextTick(() => {
      chart?.resize();
    });
  }
}

/* =========================
 * 查询 / 分页
 * ========================= */

function handleSearch() {
  pagination.value.current = 1;

  fetchResults();
}

function handleReset() {
  searchForm.value = {
    deviceNumber: "",
    deptId: "",
    startTime: "",
    endTime: "",
    burstSuspected: "",
  };

  pagination.value.current = 1;

  fetchAll();
}

function fetchAll() {
  fetchResults();
  fetchSummary();
}

function handlePageChange(page: number) {
  pagination.value.current = page;

  fetchResults();
}

function handlePageSizeChange(size: number) {
  pagination.value.size = size;

  pagination.value.current = 1;

  fetchResults();
}

/* =========================
 * 生命周期
 * ========================= */

onMounted(() => {
  fetchAll();
});

onBeforeUnmount(() => {
  document.removeEventListener("mousemove", resize);
  document.removeEventListener("mouseup", stopResize);

  disposeChart();
});
</script>

<style scoped lang="scss">
@import "@/pages/device/components/x/common/page-layout.css";
@import "@/pages/device/components/x/common/status.css";
@import "@/pages/device/components/x/table/styles/table.css";
@import "@/pages/device/components/x/table/styles/table-row.css";
@import "@/pages/device/components/x/table/styles/table-cell.css";

/* =========================
 * 概览卡片
 * ========================= */

.summary-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
  flex: none;
}

.stat-card__value--time {
  font-size: 15px;
}

/* =========================
 * 主体布局
 * ========================= */

.content-layout {
  min-height: 0;
}

/* =========================
 * 分割按钮
 * ========================= */

.split-handle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: col-resize;
  user-select: none;
  z-index: 10;
}

.split-handle::before {
  content: "";
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 50%;
  width: 1px;
  background: #e4e7ed;
  transform: translateX(-50%);
}

/* =========================
 * 右侧详情
 * ========================= */

.detail-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

/* =========================
 * 空状态
 * ========================= */

.detail-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 260px;
  color: #8a9bad;
  font-size: 13px;
}

/* =========================
 * Sigma 统计栏
 * ========================= */

.sigma-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  flex: none;
}

.sigma-item {
  padding: 3px 10px;
  color: #31506d;
  font-size: 12px;
  font-weight: 700;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 999px;
}

.sigma-item--upper {
  color: #b42318;
  border-color: #ffd3cb;
  background: #fff1ee;
}

.sigma-item--lower {
  color: #177245;
  border-color: #bfe8ce;
  background: #eaf8ef;
}

/* =========================
 * 曲线
 * ========================= */

.burst-chart {
  width: 100%;
  height: 320px;
  min-height: 260px;
  flex: 1;
}
</style>