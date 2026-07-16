<template>
  <view class="history-overview-view">
    <!-- 筛选栏 -->
    <view class="toolbar">
      <view class="toolbar-row toolbar-row--filters">
        <view class="filter-group">
          <text class="filter-label">时间范围</text>
          <view class="date-range">
            <WorkOrderDatetimePicker v-model="filters.startTime" class="filter-datetime" title="选择开始时间" placeholder="请选择开始时间" />
            <text class="filter-separator">至</text>
            <WorkOrderDatetimePicker v-model="filters.endTime" class="filter-datetime" title="选择结束时间" placeholder="请选择结束时间" />
          </view>
        </view>

        <!-- 渗漏记录tab：渗漏状态 + 巡检人员 -->
        <template v-if="activeDataTab === 'leakage'">
          <view class="filter-group">
            <text class="filter-label">渗漏状态</text>
            <picker :range="activeLeakStatusOptions" range-key="label" @change="handleLeakStatusChange">
              <view class="filter-select">
                <text>{{ currentLeakStatusLabel }}</text>
                <text class="filter-select__arrow"></text>
              </view>
            </picker>
          </view>
          <view class="filter-group">
            <text class="filter-label">巡检人员</text>
            <input v-model="filters.inspector" class="filter-input" placeholder="请输入巡检人员" placeholder-class="input-placeholder" />
          </view>
        </template>

        <!-- 设备上报tab：渗漏状态 + 设备编号 -->
        <template v-else-if="activeDataTab === 'deviceUpload'">
          <view class="filter-group">
            <text class="filter-label">渗漏状态</text>
            <picker :range="activeLeakStatusOptions" range-key="label" @change="handleLeakStatusChange">
              <view class="filter-select">
                <text>{{ currentLeakStatusLabel }}</text>
                <text class="filter-select__arrow"></text>
              </view>
            </picker>
          </view>
          <view class="filter-group">
            <text class="filter-label">设备编号</text>
            <input v-model="filters.deviceNumber" class="filter-input" placeholder="请输入设备编号" placeholder-class="input-placeholder" />
          </view>
        </template>

        <!-- 算法分析tab：设备编号 + 算法状态 + 算法名称 -->
        <template v-else-if="activeDataTab === 'algorithm'">
          <view class="filter-group">
            <text class="filter-label">设备编号</text>
            <input v-model="filters.deviceNumber" class="filter-input" placeholder="请输入设备编号" placeholder-class="input-placeholder" />
          </view>
          <view class="filter-group">
            <text class="filter-label">执行状态</text>
            <picker :range="algorithmStatusOptions" range-key="label" @change="handleAlgorithmStatusChange">
              <view class="filter-select">
                <text>{{ currentAlgorithmStatusLabel }}</text>
                <text class="filter-select__arrow"></text>
              </view>
            </picker>
          </view>
          <view class="filter-group">
            <text class="filter-label">算法名称</text>
            <input v-model="filters.algorithmName" class="filter-input" placeholder="请输入算法名称" placeholder-class="input-placeholder" />
          </view>
        </template>

        <view class="toolbar-actions toolbar-actions--right">
          <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="searchHistory">查询</button>
          <button class="toolbar-button" hover-class="toolbar-button--hover" @click="resetFilters">重置</button>
          <button class="toolbar-icon-button" hover-class="toolbar-icon-button--hover" aria-label="刷新" @click="fetchHistoryData">
            <text class="icon-refresh"></text>
          </button>
          <view class="export-dropdown">
            <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="exportMenuVisible = !exportMenuVisible">导出</button>
            <view v-if="exportMenuVisible" class="export-menu">
              <view class="export-menu__item" @click="handleExport('current')">导出当前页</view>
              <view class="export-menu__item" @click="handleExport('all')">导出全部</view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Tab 切换 -->
    <view class="tabs-bar">
      <view
        v-for="tab in historyTabs"
        :key="tab.value"
        class="tabs-bar__item"
        :class="{ 'tabs-bar__item--active': activeDataTab === tab.value }"
        @click="switchDataTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- KPI 概览条 -->
    <view class="kpi-strip">
      <view
        v-for="kpi in currentKpis"
        :key="kpi.label"
        class="kpi-card"
        :class="kpi.tone ? `kpi-card--${kpi.tone}` : ''"
      >
        <text class="kpi-card__label">{{ kpi.label }}</text>
        <text class="kpi-card__value">{{ kpi.value }}</text>
        <text v-if="kpi.hint" class="kpi-card__hint">{{ kpi.hint }}</text>
      </view>
    </view>

    <!-- 趋势图区（可折叠） -->
    <view class="chart-zone" :class="{ 'chart-zone--collapsed': chartCollapsed }">
      <view class="chart-zone__header">
        <view class="chart-zone__title-wrap" @click="toggleChartCollapse">
          <view class="chart-zone__title-row">
            <text class="chart-zone__title">数据趋势 · {{ activeTabLabel }}</text>
            <text class="chart-zone__toggle">{{ chartCollapsed ? "展开" : "收起" }}</text>
          </view>
          <text v-if="!chartCollapsed" class="chart-zone__hint">{{ currentChartConfig.hint }}</text>
        </view>
        <view v-if="!chartCollapsed" class="chart-zone__actions">
          <view class="chart-zone__modes">
            <view
              v-for="opt in currentChartModes"
              :key="opt.value"
              class="chart-zone__mode"
              :class="{ 'chart-zone__mode--active': activeChartModeValue === opt.value }"
              @click="switchChartMode(opt.value)"
            >
              {{ opt.label }}
            </view>
          </view>
          <view class="chart-zone__scope">
            <view
              class="chart-zone__scope-btn"
              :class="{ 'chart-zone__scope-btn--active': chartDataScope === 'page' }"
              @click="chartDataScope !== 'page' && toggleChartDataScope()"
            >本页</view>
            <view
              class="chart-zone__scope-btn"
              :class="{ 'chart-zone__scope-btn--active': chartDataScope === 'all' }"
              @click="chartDataScope !== 'all' && toggleChartDataScope()"
            >{{ chartAllLoading ? "加载中…" : "全部" }}</view>
          </view>
        </view>
      </view>
      <view v-show="!chartCollapsed" class="chart-zone__body">
        <!-- #ifdef H5 -->
        <div ref="chartEl" class="chart-zone__canvas"></div>
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <view class="chart-zone__fallback">当前图表仅支持 H5 展示</view>
        <!-- #endif -->
      </view>
    </view>

    <!-- 主内容区 -->
    <LeakTableView
      :title="`${activeTabLabel}历史`"
      :total="total"
      :page-num="pagination.pageNum"
      :page-size="pagination.pageSize"
      :total-pages="totalPages"
      :has-detail="!!selectedRecord"
      detail-empty-text="请选择左侧记录查看详情"
      @prev-page="changePage(-1)"
      @next-page="changePage(1)"
      @jump-page="jumpToPage"
      @page-size-change="handlePageSizeChange"
    >
      <view class="data-table">
        <!-- 渗漏记录列头 -->
        <view v-if="activeDataTab === 'leakage'" class="data-row data-row--header data-row--leakage">
          <text class="data-cell data-cell--index">序号</text>
          <text class="data-cell data-cell--time data-cell--sortable" @click.stop="toggleSort('detectTime')">检出时间<text class="sort-arrow sort-arrow--active" v-if="sortField === 'detectTime'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</text><text class="sort-arrow" v-else></text></text>
          <text class="data-cell data-cell--level data-cell--sortable" @click.stop="toggleSort('leakStatus')">渗漏状态<text class="sort-arrow sort-arrow--active" v-if="sortField === 'leakStatus'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</text><text class="sort-arrow" v-else></text></text>
          <text class="data-cell data-cell--type">漏点类型</text>
          <text class="data-cell data-cell--address">漏点位置</text>
          <text class="data-cell data-cell--account">巡检人员</text>
          <text class="data-cell data-cell--material">管道材质</text>
          <text class="data-cell data-cell--remark">描述</text>
        </view>

        <!-- 设备上报列头 -->
        <view v-else-if="activeDataTab === 'deviceUpload'" class="data-row data-row--header data-row--deviceUpload">
          <text class="data-cell data-cell--index">序号</text>
          <text class="data-cell data-cell--time">上报时间</text>
          <text class="data-cell data-cell--device">设备编号</text>
          <text class="data-cell data-cell--status">渗漏标志位</text>
          <text class="data-cell data-cell--esa">特征值</text>
          <text class="data-cell data-cell--intensity">强度</text>
          <text class="data-cell data-cell--frequency">频率</text>
          <text class="data-cell data-cell--firmware">固件版本</text>
        </view>

        <!-- 算法分析列头 -->
        <view v-else-if="activeDataTab === 'algorithm'" class="data-row data-row--header data-row--algorithm">
          <text class="data-cell data-cell--index">序号</text>
          <text class="data-cell data-cell--time">创建时间</text>
          <text class="data-cell data-cell--device">设备编号</text>
          <text class="data-cell data-cell--signal">算法名称</text>
          <text class="data-cell data-cell--status">执行状态</text>
          <text class="data-cell data-cell--signal">输出值</text>
          <text class="data-cell data-cell--esa">耗时(ms)</text>
        </view>

        <view v-if="loading" class="table-state table-state--loading"><view class="state-spinner"></view><text class="state-text">加载中...</text></view>
        <view v-else-if="records.length === 0" class="table-state table-state--empty"><view class="state-icon-empty"></view><text class="state-text">暂无历史数据</text></view>

        <!-- 渗漏记录行 -->
        <view v-else-if="activeDataTab === 'leakage'">
          <view
            v-for="(item, index) in records"
            :key="getRowKey(item, index)"
            class="data-row data-row--leakage"
            :class="{ 'data-row--active': selectedRecordKey === getRowKey(item, index) }"
            @click="selectRecord(item, index)"
          >
            <text class="data-cell data-cell--index">{{ (pagination.pageNum - 1) * pagination.pageSize + index + 1 }}</text>
            <text class="data-cell data-cell--time">{{ formatDateTime(getFieldValue(item, "detectTime")) }}</text>
            <text class="data-cell data-cell--level"><text class="status-tag" :class="getLeakageStatusTagClass(item)">{{ getFieldValue(item, "leakStatus") || "-" }}</text></text>
            <text class="data-cell data-cell--type">{{ getFieldValue(item, "leakPointType") || "-" }}</text>
            <text class="data-cell data-cell--address">{{ getFieldValue(item, "leakPointPosition") || "-" }}</text>
            <text class="data-cell data-cell--account">{{ getFieldValue(item, "inspector") || "-" }}</text>
            <text class="data-cell data-cell--material">{{ getFieldValue(item, "tubeMaterial") || "-" }}</text>
            <text class="data-cell data-cell--remark">{{ getFieldValue(item, "description") || "-" }}</text>
          </view>
        </view>

        <!-- 设备上报行 -->
        <view v-else-if="activeDataTab === 'deviceUpload'">
          <view
            v-for="(item, index) in records"
            :key="getRowKey(item, index)"
            class="data-row data-row--deviceUpload"
            :class="{ 'data-row--active': selectedRecordKey === getRowKey(item, index) }"
            @click="selectRecord(item, index)"
          >
            <text class="data-cell data-cell--index">{{ (pagination.pageNum - 1) * pagination.pageSize + index + 1 }}</text>
            <text class="data-cell data-cell--time">{{ formatDateTime(getFieldValue(item, "uploadTime")) }}</text>
            <text class="data-cell data-cell--device">{{ getFieldValue(item, "deviceNumber") || "-" }}</text>
            <text class="data-cell data-cell--status">
              <text class="status-tag" :class="getLeakStatusTagClass(item)">{{ getLeakStatusLabel(item) }}</text>
            </text>
            <text class="data-cell data-cell--esa">{{ getFieldValue(item, "leakEsa") ?? "-" }}</text>
            <text class="data-cell data-cell--intensity">{{ getFieldValue(item, "leakIntensity") ?? "-" }}</text>
            <text class="data-cell data-cell--frequency">{{ getFieldValue(item, "leakFrequency") ?? "-" }}</text>
            <text class="data-cell data-cell--firmware">{{ getFieldValue(item, "firmwareVersion") || "-" }}</text>
          </view>
        </view>

        <!-- 算法分析行 -->
        <view v-else-if="activeDataTab === 'algorithm'">
          <view
            v-for="(item, index) in records"
            :key="getRowKey(item, index)"
            class="data-row data-row--algorithm"
            :class="{ 'data-row--active': selectedRecordKey === getRowKey(item, index) }"
            @click="selectRecord(item, index)"
          >
            <text class="data-cell data-cell--index">{{ (pagination.pageNum - 1) * pagination.pageSize + index + 1 }}</text>
            <text class="data-cell data-cell--time">{{ formatDateTime(getFieldValue(item, "createdAt")) }}</text>
            <text class="data-cell data-cell--device">{{ getFieldValue(item, "deviceNumber") || "-" }}</text>
            <text class="data-cell data-cell--signal">{{ getFieldValue(item, "algorithmName") || "-" }}</text>
            <text class="data-cell data-cell--status">
              <text v-if="getFieldValue(item, 'status')" class="status-tag" :class="getAlgorithmStatusTagClass(item)">{{ getAlgorithmStatusLabel(item) }}</text>
              <text v-else>-</text>
            </text>
            <text class="data-cell data-cell--signal" :title="String(getFieldValue(item, 'outputValue') || '')">{{ getFieldValue(item, "outputValue") || "-" }}</text>
            <text class="data-cell data-cell--esa">{{ getFieldValue(item, "costMs") ?? "-" }}</text>
          </view>
        </view>
      </view>

      <!-- 右侧详情 -->
      <template #detail>
        <view class="detail-body">
          <view class="detail-section">
            <!-- 摘要 -->
            <view class="detail-summary">
              <view class="detail-summary__main">
                <text class="detail-summary__label">{{ summaryLabel }}</text>
                <text class="detail-summary__value">{{ summaryValue }}</text>
              </view>
              <view v-if="summaryMetaFields.length > 0" class="detail-summary__meta">
                <view v-for="item in summaryMetaFields" :key="item.label" class="detail-summary__meta-item">
                  <text class="detail-summary__meta-label">{{ item.label }}</text>
                  <text class="detail-summary__meta-value" :title="item.value">{{ item.value }}</text>
                </view>
              </view>
            </view>

            <!-- 时间信息（时间线） -->
            <view v-if="timeDetailFields.length > 0" class="time-section">
              <text class="detail-section-title">时间信息</text>
              <view class="time-list">
                <view v-for="item in timeDetailFields" :key="item.label" class="time-row">
                  <view class="time-row__marker"></view>
                  <view class="time-row__content">
                    <text class="time-row__label">{{ item.label }}</text>
                    <text class="time-row__value">{{ item.value }}</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- 地点信息 -->
            <view v-if="locationFields.length > 0" class="time-section time-section--location">
              <text class="detail-section-title">地点信息</text>
              <view v-for="item in locationFields" :key="item.label" class="location-row">
                <text class="location-row__label">{{ item.label }}</text>
                <text class="location-row__value">{{ item.value }}</text>
              </view>
            </view>

            <!-- 其他字段（卡片网格） -->
            <view v-if="cardFields.length > 0" class="detail-fields-grid">
              <view v-for="item in cardFields" :key="item.label" class="detail-field-card">
                <text class="detail-field-card__label">{{ item.label }}</text>
                <text class="detail-field-card__value" :title="item.value">{{ item.value }}</text>
              </view>
            </view>
          </view>
        </view>
      </template>
    </LeakTableView>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import * as echarts from "echarts";
import {
  getLeakageHistoryPage,
  getLeakageHistoryDetail,
  getDeviceStatusUploadPage,
  getDeviceStatusUploadDetail,
  getAlgorithmResultHistoryPage,
  getAlgorithmResultHistoryDetail,
} from "@/services/leak-report/history-overview";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";
import LeakTableView from "@/pages/leak-report/components/LeakTableView.vue";

type HistoryRecord = Record<string, unknown>;
type DataTab = "leakage" | "deviceUpload" | "algorithm";

interface ApiResponseLike {
  code?: number;
  data?: unknown;
  records?: unknown[];
  rows?: unknown[];
  total?: number;
  msg?: string;
}

interface DetailField {
  label: string;
  value: string;
}

type KpiTone = "default" | "success" | "warning" | "danger";

interface KpiItem {
  label: string;
  value: string;
  hint?: string;
  tone?: KpiTone;
}

const historyTabs: Array<{ label: string; value: DataTab }> = [
  { label: "渗漏记录", value: "leakage" },
  { label: "设备上报", value: "deviceUpload" },
  { label: "算法日志", value: "algorithm" },
];

const leakStatusOptions: Array<{ label: string; value: number | "" }> = [
  { label: "不限", value: "" },
  { label: "渗漏", value: 0 },
  { label: "正常", value: 1 },
  { label: "疑似", value: 2 },
  { label: "未知", value: 3 },
];

// 渗漏记录 tab 专属：漏点记录的 leakStatus 是字符串（已修复/未修复），后端不支持该字段筛选，需本地过滤
const leakageStatusOptions: Array<{ label: string; value: number | string | "" }> = [
  { label: "不限", value: "" },
  { label: "已修复", value: "已修复" },
  { label: "未修复", value: "未修复" },
];

// 根据当前 tab 动态选择渗漏状态选项（统一类型，避免联合类型不可调用）
const activeLeakStatusOptions = computed<Array<{ label: string; value: number | string | "" }>>(() =>
  activeDataTab.value === "leakage" ? leakageStatusOptions : leakStatusOptions,
);

const algorithmStatusOptions: Array<{ label: string; value: string }> = [
  { label: "不限", value: "" },
  { label: "执行成功", value: "SUCCESS" },
  { label: "执行失败", value: "FAILED" },
  { label: "超时", value: "TIMEOUT" },
  { label: "跳过", value: "SKIPPED" },
];

const tabLabelMap: Record<DataTab, string> = {
  leakage: "渗漏记录",
  deviceUpload: "设备上报",
  algorithm: "算法日志",
};

const sortField = ref("createdAt");
const sortOrder = ref("desc");

const filters = reactive({
  startTime: "",
  endTime: "",
  leakStatus: "" as number | string | "",
  deviceNumber: "",
  inspector: "",
  algorithmStatus: "" as string,
  algorithmName: "",
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
});

const records = ref<HistoryRecord[]>([]);
const selectedRecord = ref<HistoryRecord | null>(null);
const selectedRecordKey = ref("");
const total = ref(0);
const loading = ref(false);
const activeDataTab = ref<DataTab>("leakage");
const exportMenuVisible = ref(false);

const currentLeakStatusLabel = computed(() =>
  activeLeakStatusOptions.value.find((o) => o.value === filters.leakStatus)?.label || "不限",
);
const currentAlgorithmStatusLabel = computed(() =>
  algorithmStatusOptions.find((o) => o.value === filters.algorithmStatus)?.label || "不限",
);
const activeTabLabel = computed(() => tabLabelMap[activeDataTab.value]);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pagination.pageSize)));

// 顶部 KPI 概览条（基于当前页数据 + 后端 total 本地计算）
const currentKpis = computed<KpiItem[]>(() => {
  const list = chartRecords.value;
  const t = total.value;
  const page = list.length;
  const isAll = chartDataScope.value === "all";
  const scopeLabel = isAll ? "全部记录" : "当前页";
  const pageText = isAll ? `全量 ${t} 条` : `第 ${pagination.pageNum}/${totalPages.value} 页`;
  const prefix = isAll ? "全部" : "本页";
  const tone = (ok: boolean): KpiTone => (ok ? "success" : "warning");

  if (activeDataTab.value === "leakage") {
    const repaired = list.filter((r) => normalizeLeakStatus(getFieldValue(r, "leakStatus"), "leakage") === "已修复").length;
    const unrepaired = list.filter((r) => normalizeLeakStatus(getFieldValue(r, "leakStatus"), "leakage") === "未修复").length;
    const rate = page > 0 ? Math.round((repaired / page) * 100) : 0;
    return [
      { label: "总记录数", value: String(t), hint: "全量数据" },
      { label: scopeLabel, value: String(page), hint: pageText },
      { label: `${prefix}已修复`, value: String(repaired), tone: "success" },
      { label: `${prefix}未修复`, value: String(unrepaired), tone: "danger" },
      { label: `${prefix}修复率`, value: `${rate}%`, tone: rate >= 50 ? "success" : "warning" },
    ];
  }

  if (activeDataTab.value === "deviceUpload") {
    const leak = list.filter((r) => normalizeLeakStatus(getFieldValue(r, "leakStatus"), "deviceUpload") === "渗漏").length;
    const normal = list.filter((r) => normalizeLeakStatus(getFieldValue(r, "leakStatus"), "deviceUpload") === "正常").length;
    const devices = new Set(list.map((r) => String(getFieldValue(r, "deviceNumber") || "")).filter(Boolean)).size;
    const abnormalRate = page > 0 ? Math.round((leak / page) * 100) : 0;
    return [
      { label: "上报总数", value: String(t), hint: "全量数据" },
      { label: scopeLabel, value: String(page), hint: pageText },
      { label: `${prefix}渗漏`, value: String(leak), tone: "danger" },
      { label: `${prefix}正常`, value: String(normal), tone: "success" },
      { label: "涉及设备", value: String(devices) },
      { label: "异常率", value: `${abnormalRate}%`, tone: abnormalRate >= 30 ? "danger" : "warning" },
    ];
  }

  if (activeDataTab.value === "algorithm") {
    const success = list.filter((r) => String(getFieldValue(r, "status") || "").toUpperCase() === "SUCCESS").length;
    const failed = list.filter((r) => ["FAILED", "TIMEOUT"].includes(String(getFieldValue(r, "status") || "").toUpperCase())).length;
    const successRate = page > 0 ? Math.round((success / page) * 100) : 0;
    return [
      { label: "执行总数", value: String(t), hint: "全量数据" },
      { label: scopeLabel, value: String(page), hint: pageText },
      { label: `${prefix}成功`, value: String(success), tone: "success" },
      { label: `${prefix}失败`, value: String(failed), tone: "danger" },
      { label: "成功率", value: `${successRate}%`, tone: tone(successRate >= 80) },
    ];
  }

  return [];
});

// ==================== 趋势图区（每个 Tab 专属图表配置） ====================
type ChartType = "line" | "bar" | "pie" | "stackedBar" | "histogram";
type ChartGroupBy = "time" | "device" | "leakType" | "leakStatus" | "algorithmStatus" | "featureValue";

interface ChartModeConfig {
  label: string;        // 切换按钮显示文本
  value: string;        // 模式唯一标识
  type: ChartType;      // echarts 图表类型
  groupBy: ChartGroupBy; // 分组维度
  hint: string;         // 图表区副标题（说明当前模式的维度含义）
}

// 每个 Tab 的专属图表模式列表
const chartModeConfigs: Record<DataTab, ChartModeConfig[]> = {
  leakage: [
    { label: "每日趋势", value: "trend", type: "line", groupBy: "time", hint: "按检出日期统计渗漏记录数趋势" },
    { label: "漏点类型", value: "leakType", type: "pie", groupBy: "leakType", hint: "按漏点类型分布占比" },
    { label: "渗漏状态", value: "leakStatus", type: "pie", groupBy: "leakStatus", hint: "已修复 vs 未修复 占比" },
  ],
  deviceUpload: [
    { label: "每日趋势", value: "trend", type: "line", groupBy: "time", hint: "按上报日期统计记录数趋势" },
    { label: "渗漏状态", value: "leakStatus", type: "pie", groupBy: "leakStatus", hint: "渗漏 vs 正常 占比" },
    { label: "设备 Top10", value: "device", type: "bar", groupBy: "device", hint: "上报次数最多的前 10 个设备" },
  ],
  algorithm: [
    { label: "每日趋势", value: "trend", type: "line", groupBy: "time", hint: "按日期统计算法执行次数趋势" },
    { label: "执行结果", value: "algoStatus", type: "pie", groupBy: "algorithmStatus", hint: "成功 / 失败 / 超时 占比" },
    { label: "成功失败对比", value: "successFail", type: "stackedBar", groupBy: "time", hint: "按日期堆叠统计成功与失败次数对比" },
  ],
};

const chartEl = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

// 当前 tab 可用的图表模式列表
const currentChartModes = computed(() => chartModeConfigs[activeDataTab.value]);
// 当前选中的图表模式 value（每个 tab 默认 "trend"）
const activeChartModeValue = ref<string>("trend");
// 当前选中的图表模式配置
const currentChartConfig = computed<ChartModeConfig>(() =>
  currentChartModes.value.find((m) => m.value === activeChartModeValue.value) || currentChartModes.value[0],
);

// 图表数据范围：「本页」或「全部」
const chartDataScope = ref<"page" | "all">("page");
const allRecords = ref<HistoryRecord[]>([]);
const chartAllLoading = ref(false);
// 图表实际使用的数据源
const chartRecords = computed<HistoryRecord[]>(() =>
  chartDataScope.value === "all" ? applyLocalFilters(allRecords.value) : records.value,
);

// 解析记录的时间字段，返回 YYYY-MM-DD
function parseRecordDate(r: HistoryRecord): string {
  const fields = ["detectTime", "uploadTime", "createdAt", "createTime", "samplingTime", "dailyDate", "reportDate"];
  for (const f of fields) {
    const v = getFieldValue(r, f);
    if (v) {
      const m = String(v).match(/\d{4}-\d{2}-\d{2}/);
      if (m) return m[0];
    }
  }
  return "未知";
}

// 按时间分组统计
function groupByTime(list: HistoryRecord[]): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const r of list) {
    const d = parseRecordDate(r);
    map.set(d, (map.get(d) || 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name, value }));
}

// 按设备分组统计（取 Top 10）
function groupByDevice(list: HistoryRecord[]): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const r of list) {
    const d = String(getFieldValue(r, "deviceNumber") || "未知");
    map.set(d, (map.get(d) || 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));
}

// 按漏点类型分组统计（leakPointType 为空时回退到 leakPart 漏点部位）
function groupByLeakType(list: HistoryRecord[]): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const r of list) {
    const v = getFieldValue(r, "leakPointType") || getFieldValue(r, "leakPart");
    const s = v ? String(v) : "未知";
    map.set(s, (map.get(s) || 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
}

// 归一化 leakStatus：兼容字符串文本（已修复/未修复/渗漏/正常）和数字编码（0/1）
function normalizeLeakStatus(raw: unknown, tab: DataTab): string {
  if (raw == null || raw === "") return "未知";
  const s = String(raw);
  // 字符串文本形式（后端实际返回格式）
  if (tab === "leakage") {
    if (s === "已修复" || s === "未修复") return s;
  } else {
    if (s === "渗漏" || s === "正常" || s === "疑似") return s;
  }
  // 数字编码形式（兼容旧接口）
  const n = Number(raw);
  if (!Number.isNaN(n)) {
    if (tab === "leakage") {
      return n === 1 ? "已修复" : n === 0 ? "未修复" : "未知";
    }
    return n === 0 ? "渗漏" : n === 1 ? "正常" : n === 2 ? "疑似" : "未知";
  }
  return s;
}

// 按渗漏状态分组（leakage tab 是已修复/未修复，其他 tab 是渗漏/正常）
function groupByLeakStatusForPie(list: HistoryRecord[], tab: DataTab): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const r of list) {
    const s = normalizeLeakStatus(getFieldValue(r, "leakStatus"), tab);
    map.set(s, (map.get(s) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

// 按算法执行状态分组
function groupByAlgorithmStatus(list: HistoryRecord[]): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const r of list) {
    const su = String(getFieldValue(r, "status") || "").toUpperCase();
    const s = su === "SUCCESS" ? "成功" : su === "FAILED" ? "失败" : su === "TIMEOUT" ? "超时" : "未知";
    map.set(s, (map.get(s) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

// 按特征值（leakEsa）分桶直方图
function groupByFeatureValue(list: HistoryRecord[]): Array<{ name: string; value: number }> {
  const values = list
    .map((r) => Number(getFieldValue(r, "leakEsa")))
    .filter((v) => Number.isFinite(v) && v > 0);
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  // 单一值时只返回一个桶
  if (min === max) return [{ name: `${min}`, value: values.length }];

  const binCount = 8;
  const binSize = Math.max(1, (max - min) / binCount);
  const bins: Array<{ name: string; value: number }> = [];
  for (let i = 0; i < binCount; i += 1) {
    const start = Math.round(min + i * binSize);
    const end = Math.round(min + (i + 1) * binSize);
    const isLast = i === binCount - 1;
    const count = values.filter((v) => (isLast ? v >= start && v <= end : v >= start && v < end)).length;
    bins.push({ name: `${start}-${end}`, value: count });
  }
  return bins;
}

// 堆叠柱状图：按日期 + 算法状态拆分
function buildStackedBarData(list: HistoryRecord[]): {
  times: string[];
  success: number[];
  failed: number[];
  timeout: number[];
} {
  const map = new Map<string, { success: number; failed: number; timeout: number }>();
  for (const r of list) {
    const t = parseRecordDate(r);
    if (!map.has(t)) map.set(t, { success: 0, failed: 0, timeout: 0 });
    const stat = map.get(t)!;
    const su = String(getFieldValue(r, "status") || "").toUpperCase();
    if (su === "SUCCESS") stat.success += 1;
    else if (su === "FAILED") stat.failed += 1;
    else if (su === "TIMEOUT") stat.timeout += 1;
  }
  const times = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
  return {
    times,
    success: times.map((t) => map.get(t)!.success),
    failed: times.map((t) => map.get(t)!.failed),
    timeout: times.map((t) => map.get(t)!.timeout),
  };
}

function buildChartOption(): echarts.EChartsOption {
  const list = chartRecords.value;
  const cfg = currentChartConfig.value;

  // 全量数据加载中：优先显示加载提示
  if (chartAllLoading.value) {
    return {
      title: {
        text: "全量数据加载中…",
        left: "center",
        top: "center",
        textStyle: { color: "#3b82f6", fontSize: 13, fontWeight: 600 },
      },
    };
  }

  if (list.length === 0) {
    return {
      title: {
        text: "暂无数据",
        left: "center",
        top: "center",
        textStyle: { color: "#94a3b8", fontSize: 13, fontWeight: 600 },
      },
    };
  }

  // 通用网格与坐标轴样式
  const grid = { left: 64, right: 24, top: 24, bottom: 48 };
  const axisLineColor = { lineStyle: { color: "#cbd5e1" } };
  const splitLineStyle = { lineStyle: { color: "#eef2f7" } };
  const axisLabelStyle = { fontSize: 11, color: "#64748b" };
  const axisNameStyle = { fontSize: 11, color: "#475569", fontWeight: 600 as const };

  // 根据图表类型与当前 Tab 生成 X 轴名称
  function getXAxisName(): string {
    if (cfg.type === "histogram") return "leakEsa 区间";
    if (cfg.type === "bar" && cfg.groupBy === "device") return "设备编号";
    if (cfg.type === "line" || cfg.type === "stackedBar") return "日期";
    return "";
  }

  // 根据图表类型与当前 Tab 生成 Y 轴名称（含单位）
  function getYAxisName(): string {
    if (cfg.type === "pie") return "";
    if (cfg.type === "histogram") return "记录数 / 条";
    if (cfg.type === "stackedBar") return "次数 / 次";
    if (cfg.type === "bar" && cfg.groupBy === "device") return "上报次数 / 次";
    // line：按 tab 区分语义
    switch (activeDataTab.value) {
      case "leakage": return "记录数 / 条";
      case "deviceUpload": return "上报次数 / 次";
      case "algorithm": return "执行次数 / 次";
      default: return "记录数 / 条";
    }
  }

  const xAxisName = getXAxisName();
  const yAxisName = getYAxisName();

  // 折线图：按时间趋势
  if (cfg.type === "line") {
    const data = groupByTime(list);
    return {
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          const p = (params as { axisValue: string; data: [string, number] }[])[0];
          if (!p) return "";
          return `${p.axisValue}<br/>${yAxisName}: ${p.data[1]}`;
        },
      },
      grid: { left: 64, right: 24, top: 24, bottom: 48 },
      xAxis: {
        type: "time",
        name: xAxisName,
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: axisNameStyle,
        axisLabel: {
          ...axisLabelStyle,
          showMinLabel: true,
          showMaxLabel: true,
          hideOverlap: true,
          formatter: "{yyyy}-{MM}-{dd}",
        },
        axisLine: axisLineColor,
      },
      yAxis: {
        type: "value",
        name: yAxisName,
        nameLocation: "middle",
        nameGap: 44,
        nameTextStyle: axisNameStyle,
        axisLabel: axisLabelStyle,
        splitLine: splitLineStyle,
      },
      series: [{
        type: "line",
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        data: data.map((d) => [d.name, d.value]),
        lineStyle: { width: 2, color: "#3b82f6" },
        itemStyle: { color: "#3b82f6" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(59, 130, 246, 0.25)" },
              { offset: 1, color: "rgba(59, 130, 246, 0)" },
            ],
          },
        },
      }],
    };
  }

  // 柱状图：按设备 Top10
  if (cfg.type === "bar" && cfg.groupBy === "device") {
    const data = groupByDevice(list);
    return {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid,
      xAxis: {
        type: "category",
        data: data.map((d) => d.name),
        name: xAxisName,
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: axisNameStyle,
        axisLabel: { ...axisLabelStyle, interval: 0, rotate: data.length > 6 ? 30 : 0 },
        axisLine: axisLineColor,
      },
      yAxis: {
        type: "value",
        name: yAxisName,
        nameLocation: "middle",
        nameGap: 44,
        nameTextStyle: axisNameStyle,
        axisLabel: axisLabelStyle,
        splitLine: splitLineStyle,
      },
      series: [{
        type: "bar",
        data: data.map((d) => d.value),
        itemStyle: { color: "#3b82f6", borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 36,
      }],
    };
  }

  // 直方图：特征值分布
  if (cfg.type === "histogram") {
    const data = groupByFeatureValue(list);
    if (data.length === 0) {
      return {
        title: {
          text: "暂无特征值数据",
          left: "center",
          top: "center",
          textStyle: { color: "#94a3b8", fontSize: 13, fontWeight: 600 },
        },
      };
    }
    return {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid,
      xAxis: {
        type: "category",
        data: data.map((d) => d.name),
        name: xAxisName,
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: axisNameStyle,
        axisLabel: { ...axisLabelStyle, rotate: data.length > 6 ? 30 : 0 },
        axisLine: axisLineColor,
      },
      yAxis: {
        type: "value",
        name: yAxisName,
        nameLocation: "middle",
        nameGap: 44,
        nameTextStyle: axisNameStyle,
        axisLabel: axisLabelStyle,
        splitLine: splitLineStyle,
      },
      series: [{
        type: "bar",
        data: data.map((d) => d.value),
        itemStyle: { color: "#8b5cf6", borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 36,
      }],
    };
  }

  // 堆叠柱状图：每日成功失败对比（仅 algorithm tab）
  if (cfg.type === "stackedBar") {
    const { times, success, failed, timeout } = buildStackedBarData(list);
    return {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      legend: { data: ["成功", "失败", "超时"], bottom: 0, textStyle: { fontSize: 11, color: "#64748b" } },
      grid: { left: 64, right: 24, top: 24, bottom: 56 },
      xAxis: {
        type: "time",
        name: xAxisName,
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: axisNameStyle,
        axisLabel: {
          ...axisLabelStyle,
          showMinLabel: true,
          showMaxLabel: true,
          hideOverlap: true,
          formatter: "{yyyy}-{MM}-{dd}",
        },
        axisLine: axisLineColor,
      },
      yAxis: {
        type: "value",
        name: yAxisName,
        nameLocation: "middle",
        nameGap: 44,
        nameTextStyle: axisNameStyle,
        axisLabel: axisLabelStyle,
        splitLine: splitLineStyle,
      },
      series: [
        { name: "成功", type: "bar", stack: "total", data: times.map((t, i) => [t, success[i]]), itemStyle: { color: "#22c55e" }, barMaxWidth: 36 },
        { name: "失败", type: "bar", stack: "total", data: times.map((t, i) => [t, failed[i]]), itemStyle: { color: "#ef4444" }, barMaxWidth: 36 },
        { name: "超时", type: "bar", stack: "total", data: times.map((t, i) => [t, timeout[i]]), itemStyle: { color: "#f59e0b" }, barMaxWidth: 36 },
      ],
    };
  }

  // 饼图：按不同维度（leakType / leakStatus / algorithmStatus）
  if (cfg.type === "pie") {
    let data: Array<{ name: string; value: number }> = [];
    if (cfg.groupBy === "leakType") data = groupByLeakType(list);
    else if (cfg.groupBy === "algorithmStatus") data = groupByAlgorithmStatus(list);
    else if (cfg.groupBy === "leakStatus") data = groupByLeakStatusForPie(list, activeDataTab.value);

    // 按名称语义匹配颜色（绿=正常/已修复/成功，红=渗漏/未修复/失败，橙=疑似/超时，灰=未知）
    function getSemanticColor(name: string): string {
      if (["已修复", "正常", "成功"].includes(name)) return "#22c55e";
      if (["未修复", "渗漏", "失败"].includes(name)) return "#ef4444";
      if (["疑似", "超时"].includes(name)) return "#f59e0b";
      return "#94a3b8";
    }

    // 漏点类型无语义颜色，用多色调按顺序分配
    const multiColorPalette = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#94a3b8"];
    const finalData =
      cfg.groupBy === "leakType"
        ? data.map((d, i) => ({ ...d, itemStyle: { color: multiColorPalette[i % multiColorPalette.length] } }))
        : data.map((d) => ({ ...d, itemStyle: { color: getSemanticColor(d.name) } }));

    const total = data.reduce((sum, d) => sum + d.value, 0);

    return {
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: { bottom: 0, textStyle: { fontSize: 11, color: "#64748b" } },
      series: [{
        type: "pie",
        radius: ["38%", "62%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 2 },
        label: { show: true, formatter: "{b}\n{c} ({d}%)", fontSize: 11, color: "#475569" },
        data: finalData,
      }],
      graphic: {
        type: "text",
        left: "center",
        top: "middle",
        style: {
          text: `{a|${total}}\n{b|总数}`,
          rich: {
            a: { fontSize: 22, fontWeight: 900, fill: "#0f172a", align: "center", lineHeight: 28 },
            b: { fontSize: 11, fontWeight: 600, fill: "#64748b", align: "center" },
          },
          textAlign: "center",
          textVerticalAlign: "middle",
        },
      } as unknown as echarts.GraphicComponentOption,
    };
  }

  // 兜底：暂无数据
  return {
    title: { text: "暂无数据", left: "center", top: "center", textStyle: { color: "#94a3b8", fontSize: 13, fontWeight: 600 } },
  };
}

function renderChart() {
  if (!chartEl.value) return;
  if (!chart) {
    chart = echarts.init(chartEl.value);
    resizeObserver = new ResizeObserver(() => chart?.resize());
    resizeObserver.observe(chartEl.value);
  }
  // 折叠后展开时，canvas 尺寸可能为 0，需要强制 resize 恢复正确尺寸
  chart.resize();
  chart.setOption(buildChartOption(), true);
}

function switchChartMode(mode: string) {
  activeChartModeValue.value = mode;
  nextTick(renderChart);
}

// 拉取全量数据：分页并发拉取（每页 200 条，最多 5 个并发）
async function ensureAllRecords() {
  if (allRecords.value.length > 0 || chartAllLoading.value) return;
  chartAllLoading.value = true;
  try {
    const api = getApiFunction();
    const pageSize = 200;
    // 先请求第一页，获取 total
    const firstParams = { ...buildQueryParams(), pageNum: 1, pageSize };
    const firstResponse = (await api.page(firstParams)) as ApiResponseLike;
    assertSuccessResponse(firstResponse);
    const firstParsed = parsePageResponse(firstResponse);
    const totalCount = firstParsed.total;
    const totalPages = Math.ceil(totalCount / pageSize);

    if (totalPages <= 1) {
      allRecords.value = firstParsed.records;
    } else {
      // 并发请求剩余页（每批最多 5 个并发）
      const restPages: number[] = [];
      for (let p = 2; p <= totalPages; p++) restPages.push(p);
      const allData: HistoryRecord[] = [...firstParsed.records];
      for (let i = 0; i < restPages.length; i += 5) {
        const batch = restPages.slice(i, i + 5);
        const results = await Promise.all(
          batch.map((p) =>
            (api.page({ ...buildQueryParams(), pageNum: p, pageSize })) as PromiseLike<ApiResponseLike>,
          ),
        );
        for (const res of results) {
          assertSuccessResponse(res);
          allData.push(...parsePageResponse(res).records);
        }
      }
      allRecords.value = allData;
    }
  } catch {
    allRecords.value = [];
    uni.showToast({ title: "全量数据加载失败", icon: "none" });
  } finally {
    chartAllLoading.value = false;
  }
}

// 切换图表数据范围
async function toggleChartDataScope() {
  chartDataScope.value = chartDataScope.value === "page" ? "all" : "page";
  if (chartDataScope.value === "all") {
    await ensureAllRecords();
  }
  nextTick(renderChart);
}

// 图表区折叠/展开
const chartCollapsed = ref(false);
function toggleChartCollapse() {
  chartCollapsed.value = !chartCollapsed.value;
  if (!chartCollapsed.value) {
    // 展开时需要重新渲染（canvas 尺寸从 0 恢复）
    nextTick(renderChart);
  }
}

watch(() => chartRecords.value, () => {
  if (!chartCollapsed.value) nextTick(renderChart);
});
// 加载状态变化时重新渲染（显示「加载中…」或数据）
watch(() => chartAllLoading.value, () => {
  if (!chartCollapsed.value) nextTick(renderChart);
});
watch(() => activeDataTab.value, () => {
  // 切换 tab 时重置为「每日趋势」模式，并重新渲染
  activeChartModeValue.value = "trend";
  if (!chartCollapsed.value) nextTick(renderChart);
});

// 详情字段分组
const summaryLabel = computed(() => {
  const map: Record<DataTab, string> = {
    leakage: "漏点位置",
    deviceUpload: "设备编号",
    algorithm: "设备编号",
  };
  return map[activeDataTab.value];
});

const summaryValue = computed(() => {
  const r = selectedRecord.value || {};
  if (activeDataTab.value === "leakage") return String(getFieldValue(r, "leakPointPosition") || "-");
  return String(getFieldValue(r, "deviceNumber") || "-");
});

const summaryMetaFields = computed<DetailField[]>(() => {
  const r = selectedRecord.value || {};
  if (activeDataTab.value === "leakage") {
    return [
      { label: "渗漏状态", value: String(getFieldValue(r, "leakStatus") || "-") },
      { label: "漏点类型", value: String(getFieldValue(r, "leakPointType") || "-") },
      { label: "巡检人员", value: String(getFieldValue(r, "inspector") || "-") },
      { label: "检出类型", value: String(getFieldValue(r, "detectType") || "-") },
      { label: "检出难度", value: String(getFieldValue(r, "detectDifficulty") || "-") },
      { label: "定漏人员", value: String(getFieldValue(r, "locator") || "-") },
    ];
  }
  if (activeDataTab.value === "deviceUpload") {
    return [
      { label: "渗漏标志位", value: getLeakStatusLabel(r) },
      { label: "固件版本", value: String(getFieldValue(r, "firmwareVersion") || "-") },
      { label: "硬件版本", value: String(getFieldValue(r, "hardwareVersion") || "-") },
      { label: "工作模式", value: String(getFieldValue(r, "workMode") ?? "-") },
    ];
  }
  if (activeDataTab.value === "algorithm") {
    return [
      { label: "执行状态", value: getAlgorithmStatusLabel(r) },
      { label: "失败原因", value: String(getFieldValue(r, "errorMessage") || "-") },
    ];
  }
  return [];
});

const timeDetailFields = computed<DetailField[]>(() => {
  const r = selectedRecord.value || {};
  if (activeDataTab.value === "leakage") {
    return [
      { label: "检出时间", value: formatDateTime(getFieldValue(r, "detectTime")) },
      { label: "噪音时间", value: formatDateTime(getFieldValue(r, "noiseTime")) },
      { label: "创建时间", value: formatDateTime(getFieldValue(r, "createdAt")) },
      { label: "修复时间", value: formatDateTime(getFieldValue(r, "repairTime")) },
      { label: "更新时间", value: formatDateTime(getFieldValue(r, "updatedAt")) },
    ];
  }
  if (activeDataTab.value === "deviceUpload") {
    return [
      { label: "上报时间", value: formatDateTime(getFieldValue(r, "uploadTime")) },
    ];
  }
  if (activeDataTab.value === "algorithm") {
    return [
      { label: "创建时间", value: formatDateTime(getFieldValue(r, "createdAt")) },
    ];
  }
  return [];
});

const locationFields = computed<DetailField[]>(() => {
  const r = selectedRecord.value || {};
  if (activeDataTab.value === "leakage") {
    return [
      { label: "坐标位置", value: formatCoordinate(getFieldValue(r, "coordinatePosition")) },
      { label: "漏点区域", value: String(getFieldValue(r, "leakArea") || "-") },
    ];
  }
  if (activeDataTab.value === "deviceUpload") {
    return [
      { label: "经纬度", value: formatCoordinate(getFieldValue(r, "coordinateLocation")) },
    ];
  }
  return [];
});

const cardFields = computed<DetailField[]>(() => {
  const r = selectedRecord.value || {};
  if (activeDataTab.value === "leakage") {
    return [
      { label: "ID", value: String(getFieldValue(r, "id") ?? "-") },
      { label: "疑点ID", value: String(getFieldValue(r, "suspectedLeakId") ?? "-") },
      { label: "渗漏部位", value: String(getFieldValue(r, "leakPart") || "-") },
      { label: "漏点距离", value: String(getFieldValue(r, "leakDistance") ?? "-") },
      { label: "漏水量", value: String(getFieldValue(r, "leakVolume") ?? "-") },
      { label: "漏点原因", value: String(getFieldValue(r, "leakReason") || "-") },
      { label: "特征值", value: String(getFieldValue(r, "featureValue") ?? "-") },
      { label: "费用", value: String(getFieldValue(r, "cost") || "-") },
      { label: "人工复核次数", value: String(getFieldValue(r, "manualReviewCount") ?? "-") },
      { label: "维修方式", value: String(getFieldValue(r, "repairMethod") || "-") },
      { label: "管道材质", value: String(getFieldValue(r, "tubeMaterial") || "-") },
      { label: "管道口径", value: String(getFieldValue(r, "tubeBore") ?? "-") },
      { label: "管道埋深", value: String(getFieldValue(r, "tubeBuriedDepth") ?? "-") },
      { label: "管龄", value: String(getFieldValue(r, "tubeAge") ?? "-") },
      { label: "关联设备", value: String(getFieldValue(r, "deviceNumber") || "-") },
      { label: "关联工单ID", value: String(getFieldValue(r, "workOrderId") ?? "-") },
      { label: "音频文件", value: String(getFieldValue(r, "audioFile") || "-") },
      { label: "现场视频", value: String(getFieldValue(r, "sceneVideo") || "-") },
      { label: "噪音样本", value: String(getFieldValue(r, "noiseSample") || "-") },
      { label: "描述", value: String(getFieldValue(r, "description") || "-") },
    ];
  }
  if (activeDataTab.value === "deviceUpload") {
    return [
      { label: "ID", value: String(getFieldValue(r, "id") || "-") },
      { label: "设备ID", value: String(getFieldValue(r, "deviceId") || "-") },
      { label: "电池电压", value: String(getFieldValue(r, "batteryVoltage") ?? "-") },
      { label: "终端温度", value: String(getFieldValue(r, "deviceTemperature") ?? "-") },
      { label: "信号强度", value: String(getFieldValue(r, "signalIntensity") ?? "-") },
      { label: "信号质量", value: String(getFieldValue(r, "signalQuality") ?? "-") },
      { label: "特征值", value: String(getFieldValue(r, "leakEsa") ?? "-") },
      { label: "强度", value: String(getFieldValue(r, "leakIntensity") ?? "-") },
      { label: "频率", value: String(getFieldValue(r, "leakFrequency") ?? "-") },
    ];
  }
  if (activeDataTab.value === "algorithm") {
    return [
      { label: "ID", value: String(getFieldValue(r, "id") ?? "-") },
      { label: "设备ID", value: String(getFieldValue(r, "deviceId") ?? "-") },
      { label: "关联音频ID", value: String(getFieldValue(r, "audioId") ?? "-") },
      { label: "算法名称", value: String(getFieldValue(r, "algorithmName") || "-") },
      { label: "算法输出值", value: String(getFieldValue(r, "outputValue") || "-") },
      { label: "耗时(ms)", value: String(getFieldValue(r, "costMs") ?? "-") },
      { label: "MATLAB实例", value: String(getFieldValue(r, "matlabInstance") || "-") },
      { label: "失败原因", value: String(getFieldValue(r, "errorMessage") || "-") },
    ];
  }
  return [];
});

onMounted(() => {
  fetchHistoryData();
  nextTick(renderChart);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  chart?.dispose();
  chart = null;
});

function handleLeakStatusChange(event: { detail: { value: number } }) {
  filters.leakStatus = activeLeakStatusOptions.value[event.detail.value]?.value ?? "";
  searchHistory();
}

function handleAlgorithmStatusChange(event: { detail: { value: number } }) {
  filters.algorithmStatus = algorithmStatusOptions[event.detail.value]?.value ?? "";
  searchHistory();
}

function switchDataTab(tab: DataTab) {
  activeDataTab.value = tab;
  pagination.pageNum = 1;
  selectedRecord.value = null;
  selectedRecordKey.value = "";
  fetchHistoryData();
}

function toggleSort(field: string) {
  if (sortField.value === field) {
    if (sortOrder.value === "asc") { sortOrder.value = "desc"; }
    else if (sortOrder.value === "desc") { sortField.value = ""; sortOrder.value = ""; return; }
  } else {
    sortField.value = field;
    sortOrder.value = "asc";
  }
  pagination.pageNum = 1;
  fetchHistoryData();
}

function buildQueryParams() {
  const defaultSortField = activeDataTab.value === "leakage" ? "detectTime" : activeDataTab.value === "algorithm" ? "createdAt" : activeDataTab.value === "deviceUpload" ? "uploadTime" : "createdAt";
  const baseParams = removeEmptyFields({
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    startTime: normalizeDateForApi(filters.startTime, false),
    endTime: normalizeDateForApi(filters.endTime, true),
    sortOrder: sortOrder.value || "desc",
    sortField: sortField.value || defaultSortField,
  });

  // 按 tab 传递对应的业务筛选参数
  if (activeDataTab.value === "leakage") {
    // 后端 LeakPointRecordPageDTO 不支持 leakStatus 和 inspector，这两个走本地过滤
  } else if (activeDataTab.value === "deviceUpload") {
    if (filters.leakStatus !== "") (baseParams as Record<string, unknown>).leakStatus = filters.leakStatus;
    if (filters.deviceNumber.trim()) (baseParams as Record<string, unknown>).deviceNumber = filters.deviceNumber.trim();
  } else if (activeDataTab.value === "algorithm") {
    if (filters.deviceNumber.trim()) (baseParams as Record<string, unknown>).deviceNumber = filters.deviceNumber.trim();
    if (filters.algorithmStatus !== "") (baseParams as Record<string, unknown>).status = filters.algorithmStatus;
    if (filters.algorithmName.trim()) (baseParams as Record<string, unknown>).algorithmName = filters.algorithmName.trim();
  }

  return baseParams;
}

function getApiFunction() {
  const apiMap: Record<DataTab, { page: typeof getLeakageHistoryPage; detail: typeof getLeakageHistoryDetail }> = {
    leakage: { page: getLeakageHistoryPage, detail: getLeakageHistoryDetail },
    deviceUpload: { page: getDeviceStatusUploadPage, detail: getDeviceStatusUploadDetail },
    algorithm: { page: getAlgorithmResultHistoryPage, detail: getAlgorithmResultHistoryDetail },
  };
  return apiMap[activeDataTab.value];
}

async function fetchHistoryData() {
  loading.value = true;
  try {
    const api = getApiFunction();
    const response = (await api.page(buildQueryParams())) as ApiResponseLike;
    assertSuccessResponse(response);
    const parsed = parsePageResponse(response);
    if (parsed.pageNum && parsed.pageNum !== pagination.pageNum) pagination.pageNum = parsed.pageNum;
    if (parsed.pageSize && parsed.pageSize !== pagination.pageSize) pagination.pageSize = parsed.pageSize;
    const filteredRecords = applyLocalFilters(parsed.records);
    records.value = applyLocalSort(filteredRecords);
    total.value = filteredRecords.length !== parsed.records.length ? filteredRecords.length : parsed.total;
    // 筛选/分页条件变化时清空全量数据缓存，强制重新拉取
    allRecords.value = [];
    // 如果当前是「全部」模式，清空后需要重新拉取全量数据
    if (chartDataScope.value === "all") {
      ensureAllRecords().then(() => nextTick(renderChart));
    }
    selectFirstRow();
  } catch (error) {
    records.value = [];
    total.value = 0;
    selectedRecord.value = null;
    selectedRecordKey.value = "";
    uni.showToast({ title: (error as { msg?: string })?.msg || "历史数据加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function searchHistory() {
  pagination.pageNum = 1;
  fetchHistoryData();
}

async function handleExport(scope: "current" | "all") {
  exportMenuVisible.value = false;
  let exportRecords = records.value;
  if (scope === "all") {
    try {
      const api = getApiFunction();
      const params = { ...buildQueryParams(), pageNum: 1, pageSize: 99999 };
      const response = (await api.page(params)) as ApiResponseLike;
      assertSuccessResponse(response);
      const parsed = parsePageResponse(response);
      exportRecords = applyLocalFilters(parsed.records);
    } catch {
      uni.showToast({ title: "获取全部数据失败", icon: "none" });
      return;
    }
  }
  if (!exportRecords.length) {
    uni.showToast({ title: "暂无数据可导出", icon: "none" });
    return;
  }
  // #ifdef H5
  const tab = activeDataTab.value;
  let headers: string[] = [];
  let keys: string[] = [];
  if (tab === "leakage") {
    headers = ["序号", "检出时间", "渗漏状态", "漏点类型", "漏点位置", "巡检人员", "管道材质", "描述"];
    keys = ["detectTime", "leakStatus", "leakPointType", "leakPointPosition", "inspector", "tubeMaterial", "description"];
  } else if (tab === "deviceUpload") {
    headers = ["序号", "上报时间", "设备编号", "渗漏标志位", "特征值", "强度", "频率"];
    keys = ["uploadTime", "deviceNumber", "leakStatus", "leakEsa", "leakIntensity", "leakFrequency"];
  } else if (tab === "algorithm") {
    headers = ["序号", "创建时间", "设备编号", "算法名称", "执行状态", "输出值", "耗时(ms)"];
    keys = ["createdAt", "deviceNumber", "algorithmName", "status", "outputValue", "costMs"];
  }
  const rows = exportRecords.map((r, idx) => {
    const row = [String(idx + 1)];
    keys.forEach((k) => {
      if (k === "leakStatus") {
        if (tab === "leakage") {
          const v = getFieldValue(r, k);
          row.push(v === undefined || v === null ? "" : String(v).replace(/"/g, '""'));
        } else {
          row.push(getLeakStatusLabel(r));
        }
      } else if (k === "status") {
        row.push(getAlgorithmStatusLabel(r));
      } else if (k === "audioTime" || k === "detectTime" || k === "uploadTime" || k === "createdAt" || k === "samplingTime") {
        row.push(formatDateTime(getFieldValue(r, k)));
      } else {
        const v = getFieldValue(r, k);
        row.push(v === undefined || v === null ? "" : String(v).replace(/"/g, '""'));
      }
    });
    return row;
  });
  const csv = [headers.join(","), ...rows.map((row) => row.map((c) => `"${c}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${tabLabelMap[tab]}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  uni.showToast({ title: "导出成功", icon: "success" });
  // #endif
  // #ifndef H5
  uni.showToast({ title: "导出功能仅支持 H5 端", icon: "none" });
  // #endif
}

function resetFilters() {
  filters.startTime = "";
  filters.endTime = "";
  filters.leakStatus = "";
  filters.deviceNumber = "";
  filters.inspector = "";
  filters.algorithmStatus = "";
  filters.algorithmName = "";
  searchHistory();
}

function changePage(step: number) {
  const nextPage = pagination.pageNum + step;
  if (nextPage < 1 || nextPage > totalPages.value) return;
  pagination.pageNum = nextPage;
  fetchHistoryData();
}

function jumpToPage(p: number) {
  if (p < 1 || p > totalPages.value) return;
  pagination.pageNum = p;
  fetchHistoryData();
}

function handlePageSizeChange(size: number) {
  pagination.pageSize = size;
  pagination.pageNum = 1;
  fetchHistoryData();
}

function selectFirstRow() {
  if (records.value.length === 0) {
    selectedRecord.value = null;
    selectedRecordKey.value = "";
    return;
  }
  const first = records.value[0];
  selectedRecord.value = first;
  selectedRecordKey.value = getRowKey(first, 0);
}

function selectRecord(item: HistoryRecord, index: number) {
  selectedRecord.value = item;
  selectedRecordKey.value = getRowKey(item, index);

  const id = getRowId(item);
  if (!id) return;

  getApiFunction().detail(id)
    .then((response: unknown) => {
      assertSuccessResponse(response as ApiResponseLike);
      const detailData = (response as ApiResponseLike)?.data;
      if (isObject(detailData)) {
        const cleanDetail = Object.fromEntries(Object.entries(detailData as Record<string, unknown>).filter(([, v]) => v !== null && v !== undefined));
        selectedRecord.value = { ...item, ...cleanDetail };
      }
    })
    .catch(() => {});
}

// --- helpers ---

function getRowId(item: HistoryRecord) {
  const v = getFieldValue(item, "id");
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
}

function getRowKey(item: HistoryRecord, index: number) {
  return getRowId(item) || String(index);
}

function getFieldValue(item: HistoryRecord, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(item, key) ? item[key] : undefined;
}

// 格式化经纬度字符串，保留 4 位小数（支持 "经度,纬度" 或 "经度 纬度" 格式）
function formatCoordinate(value: unknown): string {
  if (value == null || value === "") return "-";
  const s = String(value).trim();
  const parts = s.split(/[,，\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    const lng = parseFloat(parts[0]);
    const lat = parseFloat(parts[1]);
    if (!Number.isNaN(lng) && !Number.isNaN(lat)) {
      return `${lng.toFixed(4)},${lat.toFixed(4)}`;
    }
  }
  return s;
}

function getLeakStatusLabel(item: HistoryRecord) {
  const raw = getFieldValue(item, "leakStatus");
  if (raw === null || raw === undefined || raw === "") return "-";
  const val = Number(raw);
  if (Number.isNaN(val)) return "-";
  if (val === 0) return "渗漏";
  if (val === 1) return "正常";
  if (val === 2) return "疑似";
  if (val === 3) return "未知";
  if (val === 4) return "无数据";
  return "未知";
}

function getLeakageStatusTagClass(item: HistoryRecord) {
  const s = String(getFieldValue(item, "leakStatus") || "");
  if (s === "已修复") return "status-tag--normal";
  if (s === "未修复") return "status-tag--leak";
  return "status-tag--unknown";
}

function getLeakStatusTagClass(item: HistoryRecord) {
  const raw = getFieldValue(item, "leakStatus");
  if (raw === null || raw === undefined || raw === "") return "status-tag--unknown";
  const val = Number(raw);
  if (Number.isNaN(val)) return "status-tag--unknown";
  if (val === 0) return "status-tag--leak";
  if (val === 1) return "status-tag--normal";
  if (val === 2) return "status-tag--suspect";
  return "status-tag--unknown";
}

function getAlgorithmStatusLabel(item: HistoryRecord) {
  const status = String(getFieldValue(item, "status") || "").toUpperCase();
  const map: Record<string, string> = {
    SUCCESS: "执行成功",
    FAILED: "执行失败",
    TIMEOUT: "超时",
    SKIPPED: "跳过",
  };
  return map[status] || status || "-";
}

function getAlgorithmStatusTagClass(item: HistoryRecord) {
  const status = String(getFieldValue(item, "status") || "").toUpperCase();
  if (status === "SUCCESS") return "status-tag--success";
  if (status === "FAILED") return "status-tag--failed";
  if (status === "TIMEOUT") return "status-tag--failed";
  if (status === "SKIPPED") return "status-tag--skipped";
  return "status-tag--unknown";
}

function formatDateTime(value: unknown) {
  if (!value || value === "-") return String(value || "-");
  return String(value).replace("T", " ").replace(/\.\d+/, "").replace(/(?:Z|[+-]\d{2}:?\d{2})$/, "");
}

function normalizeDateForApi(value: string, isEnd: boolean) {
  if (!value) return undefined;
  const nv = value.trim().replace(/\s+/, "T");
  if (nv.includes("T")) return nv.length === 16 ? `${nv}:00` : nv;
  return `${nv}T${isEnd ? "23:59:59" : "00:00:00"}`;
}

function parsePageResponse(response: ApiResponseLike) {
  const data = response?.data ?? response;
  const pageData = findPageContainer(data) || findPageContainer(response) || (isObject(data) ? data : {});
  const recs = getFirstArray(pageData, ["records", "rows", "list", "items"]);
  const topRecs = getFirstArray(response, ["records", "rows", "list", "items"]);
  const finalRecords = recs.length > 0 ? recs : topRecs;
  const totalVal =
    getFirstNumber(pageData, ["total", "count", "totalCount", "totalRow", "totalRows", "totalElements"]) ??
    getFirstNumber(response, ["total", "count", "totalCount", "totalRow", "totalRows", "totalElements"]);
  const cur = getFirstNumber(pageData, ["current", "pageNum", "page", "pageNo"]);
  const sz = getFirstNumber(pageData, ["size", "pageSize", "limit"]);
  const pageNum = cur || pagination.pageNum;
  const pageSize = sz || pagination.pageSize;
  const minVisibleTotal = (pageNum - 1) * pageSize + finalRecords.length;
  const resolved = totalVal === undefined ? finalRecords.length : Math.max(totalVal, minVisibleTotal);
  return { records: finalRecords.map((r) => (isObject(r) ? r : { value: r })), total: resolved, pageNum, pageSize };
}

function findPageContainer(value: unknown): HistoryRecord | null {
  if (!isObject(value)) return null;
  const hasRecs = getFirstArray(value, ["records", "rows", "list", "items"]).length > 0;
  const hasTotal = getFirstNumber(value, ["total", "count", "totalCount", "totalRow", "totalRows", "totalElements"]) !== undefined;
  if (hasRecs || hasTotal) return value;
  for (const key of ["data", "result", "page", "pageData"]) {
    const matched = findPageContainer((value as Record<string, unknown>)[key]);
    if (matched) return matched;
  }
  return null;
}

function getFirstArray(item: unknown, keys: string[]): unknown[] {
  if (!isObject(item)) return [];
  for (const key of keys) {
    const v = (item as Record<string, unknown>)[key];
    if (Array.isArray(v)) return v;
  }
  return [];
}

function getFirstNumber(item: unknown, keys: string[]): number | undefined {
  if (!isObject(item)) return undefined;
  for (const key of keys) {
    const v = (item as Record<string, unknown>)[key];
    if (typeof v === "number") return v;
    if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  }
  return undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function removeEmptyFields(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== "" && v !== undefined && v !== null));
}

// 本地过滤兜底：仅对后端不支持的字段生效（当前仅 leakage tab 的 leakStatus 和 inspector）
function applyLocalFilters(list: HistoryRecord[]): HistoryRecord[] {
  if (activeDataTab.value !== "leakage") return list;
  const inspectorKey = filters.inspector.trim().toLowerCase();
  const statusKey = filters.leakStatus !== "" ? String(filters.leakStatus) : "";
  if (!inspectorKey && !statusKey) return list;
  return list.filter((item) => {
    if (inspectorKey) {
      const inspector = String(getFieldValue(item, "inspector") || "").toLowerCase();
      if (!inspector.includes(inspectorKey)) return false;
    }
    if (statusKey) {
      const normalized = normalizeLeakStatus(getFieldValue(item, "leakStatus"), "leakage");
      if (normalized !== statusKey) return false;
    }
    return true;
  });
}

function applyLocalSort(list: HistoryRecord[]): HistoryRecord[] {
  if (!sortField.value || !sortOrder.value) return list;
  const field = sortField.value;
  const order = sortOrder.value;
  return [...list].sort((a, b) => {
    let va: unknown = a[field];
    let vb: unknown = b[field];
    if (field === "leakStatus") {
      va = Number(va); vb = Number(vb);
    } else {
      va = String(va ?? ""); vb = String(vb ?? "");
    }
    if (va === undefined || va === null) return 1;
    if (vb === undefined || vb === null) return -1;
    if (va < vb) return order === "asc" ? -1 : 1;
    if (va > vb) return order === "asc" ? 1 : -1;
    return 0;
  });
}

function assertSuccessResponse(response: ApiResponseLike | undefined) {
  const code = response?.code;
  if (code === undefined || code === 0 || code === 200) return;
  throw { code, msg: response?.msg || "请求失败", data: response?.data };
}
</script>

<style scoped lang="scss">
.history-overview-view {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding: 0 14px 14px;
  overflow: hidden;
  background: #eef4f8;
}

.toolbar,
.table-panel,
.detail-panel,
.tabs-bar {
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
}

.toolbar {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  margin-bottom: 10px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.toolbar-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-row--filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 10px 12px;
}

.toolbar-row--bottom {
  justify-content: space-between;
}

.filter-group {
  display: grid;
  align-content: start;
  gap: 6px;
}

.filter-label {
  color: #52677b;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
  white-space: nowrap;
}

.filter-input {
  box-sizing: border-box;
  width: 140px;
  height: 28px;
  padding: 0 10px;
  color: #172033;
  font-size: 13px;
  font-weight: 600;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  line-height: 28px;
}

.filter-input:focus, .filter-select:hover { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

.filter-input::placeholder,
.input-placeholder {
  color: #9aa9b8;
  font-size: 13px;
}

.filter-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  min-width: 100px;
  height: 28px;
  padding: 0 10px;
  color: #172033;
  font-size: 13px;
  font-weight: 600;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  cursor: pointer;
  line-height: 28px;
}

.filter-select__arrow {
  width: 8px;
  height: 8px;
  margin-left: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.filter-datetime {
  width: 200px;
}

.filter-datetime :deep(.datetime-picker__control) {
  height: 28px;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 600;
  line-height: 28px;
}

.filter-datetime :deep(.datetime-picker__value) {
  font-size: 13px;
  font-weight: 600;
}

.filter-datetime :deep(.datetime-picker__icon) {
  width: 15px;
  height: 15px;
}

.filter-separator {
  flex: none;
  color: #8191a2;
  font-size: 13px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 7px;
}

.toolbar-actions--right {
  margin-left: auto;
}

.export-dropdown {
  position: relative;
}

.export-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 20;
  margin-top: 4px;
  background: #ffffff;
  border: 1px solid #d5e2ee;
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(15, 35, 55, 0.12);
  overflow: hidden;
}

.export-menu__item {
  padding: 10px 18px;
  color: #24384d;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
}

.export-menu__item:hover {
  background: #eff6ff;
  color: #3b82f6;
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 64px;
  height: 38px;
  margin: 0;
  padding: 0 15px;
  color: #31506d;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 5px;
  cursor: pointer;
}

.toolbar-button--primary {
  color: #ffffff;
  background: #3b82f6;
  border-color: #3b82f6;
}

.toolbar-button--hover { color: #3b82f6; background: #eff6ff; border-color: #bfdbfe; }
.toolbar-button--primary.toolbar-button--hover { color: #ffffff; background: #2563eb; border-color: #2563eb; }
.toolbar-button:disabled { color: #9aa9b8; background: #eff6ff; border-color: #d7e0e8; cursor: not-allowed; }

.toolbar-icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  margin: 0;
  padding: 0;
  color: #31506d;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 5px;
  cursor: pointer;
}

.toolbar-icon-button--hover { color: #3b82f6; background: #eff6ff; border-color: #bfdbfe; }

.icon-refresh {
  display: block;
  width: 16px;
  height: 16px;
  border: 2px solid #7f8fa3;
  border-top-color: transparent;
  border-radius: 50%;
}

.tabs-bar {
  display: flex;
  flex: none;
  margin-bottom: 12px;
  padding: 0;
  overflow: hidden;
}

.tabs-bar__item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tabs-bar__item--active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background: #f7faff;
}

/* KPI 概览条 */
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-left: 4px solid #3b82f6;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(33, 72, 108, 0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(33, 72, 108, 0.1);
}

.kpi-card--success {
  border-left-color: #22c55e;
}

.kpi-card--warning {
  border-left-color: #f59e0b;
}

.kpi-card--danger {
  border-left-color: #ef4444;
}

.kpi-card__label {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.3px;
}

.kpi-card__value {
  color: #0f172a;
  font-size: 22px;
  font-weight: 900;
  font-family: "DIN Alternate", "Arial", sans-serif;
  line-height: 1.2;
}

.kpi-card__hint {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
}

/* 趋势图区 */
.chart-zone {
  margin-bottom: 12px;
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  overflow: hidden;
}

.chart-zone--collapsed {
  margin-bottom: 12px;
}

.chart-zone--collapsed .chart-zone__header {
  border-bottom: none;
}

.chart-zone__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #eef2f7;
}

.chart-zone__body {
  position: relative;
}

.chart-zone__title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  cursor: pointer;
  user-select: none;
}

.chart-zone__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-zone__title {
  color: #26384d;
  font-size: 13px;
  font-weight: 800;
}

.chart-zone__toggle {
  padding: 2px 8px;
  color: #3b82f6;
  font-size: 11px;
  font-weight: 700;
  background: #eaf2ff;
  border-radius: 3px;
  transition: background 0.18s ease;
}

.chart-zone__title-wrap:hover .chart-zone__toggle {
  background: #d6e6ff;
}

.chart-zone__hint {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
}

.chart-zone__modes {
  display: flex;
  gap: 4px;
}

.chart-zone__mode {
  padding: 4px 12px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.18s ease;
}

.chart-zone__mode:hover {
  background: #f1f5fb;
  color: #3b82f6;
}

.chart-zone__mode--active {
  background: #3b82f6;
  color: #ffffff;
}

.chart-zone__mode--active:hover {
  background: #2563eb;
  color: #ffffff;
}

.chart-zone__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.chart-zone__scope {
  display: flex;
  border: 1px solid #d8e5ef;
  border-radius: 4px;
  overflow: hidden;
}

.chart-zone__scope-btn {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  background: #ffffff;
  cursor: pointer;
  user-select: none;
  transition: all 0.18s ease;
  min-width: 44px;
  text-align: center;
}

.chart-zone__scope-btn:hover {
  background: #f1f5f9;
}

.chart-zone__scope-btn--active {
  color: #ffffff;
  background: #3b82f6;
}

.chart-zone__scope-btn--active:hover {
  background: #2563eb;
}

.chart-zone__canvas {
  width: 100%;
  height: 260px;
}

.chart-zone__fallback {
  color: #64748b;
  font-size: 13px;
  line-height: 240px;
  text-align: center;
}

.data-table {
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.data-row {
  display: grid;
  grid-template-columns: 58px minmax(160px, 3.4fr) minmax(96px, 1.8fr) minmax(160px, 3.6fr) minmax(96px, 3fr) minmax(96px, 2.2fr) minmax(120px, 4.2fr);
  min-height: 42px;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
  transition: background 0.18s ease, box-shadow 0.18s ease;
}
.data-row--leakage {
  grid-template-columns: 58px minmax(160px, 3fr) minmax(96px, 1.6fr) minmax(110px, 2fr) minmax(160px, 3fr) minmax(96px, 2fr) minmax(96px, 1.8fr) minmax(120px, 3fr);
}
.data-row--deviceUpload {
  grid-template-columns: 58px minmax(160px, 2.6fr) minmax(110px, 1.8fr) minmax(96px, 1.2fr) minmax(72px, 0.9fr) minmax(72px, 0.9fr) minmax(72px, 0.9fr) minmax(110px, 1.6fr);
}
.data-row--algorithm {
  grid-template-columns: 58px minmax(160px, 2.6fr) minmax(110px, 1.8fr) minmax(130px, 2fr) minmax(96px, 1.2fr) minmax(150px, 2.4fr) minmax(80px, 1fr);
}
.data-row:not(.data-row--header):nth-child(odd) { background: #fff; }
.data-row:not(.data-row--header):nth-child(even) { background: #fbfdff; }
.data-row:not(.data-row--header):hover { background: #f1f8ff; box-shadow: inset 0 0 0 1px #d7ebfb; }

.data-row--header {
  position: sticky;
  top: 0;
  z-index: 1;
  min-height: 44px;
  color: #20384f;
  font-weight: 800;
  background: #f6f9fc;
  cursor: default;
  box-shadow: 0 1px 0 #dbe7f0;
}

.data-row--active {
  position: relative;
  background: #e7f3ff !important;
  box-shadow: inset 0 0 0 1px #b9dcff;
}

.data-row--active::before {
  position: absolute;
  top: 7px;
  bottom: 7px;
  left: 0;
  width: 3px;
  content: "";
  background: #0d82ee;
  border-radius: 0 999px 999px 0;
}

.data-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 0 12px;
  overflow: hidden;
  color: #24384d;
  font-size: 13px;
  line-height: 1.35;
  text-align: center;
  white-space: nowrap;
  text-overflow: ellipsis;
  border-right: 1px solid #edf1f5;
}

.data-row--header .data-cell {
  color: #415a73;
  font-size: 12px;
  letter-spacing: 0;
}

.data-cell:last-child { border-right: 0; }

.data-cell--index { justify-content: center; color: #64748b; }
.data-cell--time { color: #0f4c81; font-family: "DIN Alternate", "Arial", sans-serif; font-weight: 800; }
.data-cell--address { justify-content: center; text-align: center; }
.data-cell--remark { justify-content: center; text-align: center; }
.data-cell--device { color: #0f4c81; font-family: "DIN Alternate", "Arial", sans-serif; font-weight: 800; }
.data-cell--error { color: #475569; text-align: center; justify-content: center; }

.data-cell--sortable { cursor: pointer; user-select: none; }
.data-cell--sortable:hover { color: #3b82f6; }

.sort-arrow { flex: none; font-size: 10px; line-height: 1; margin-left: 2px; color: #bcc7d6; transition: color 0.18s ease; &--active { color: #3b82f6; } }
.data-cell--sortable:hover .sort-arrow:not(.sort-arrow--active) { color: #7f8fa3; }

.status-tag {
  display: inline-block;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 10px;
  color: #64748b;
  background: #f1f5f9;
}

.status-tag--leak { color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; }
.status-tag--normal { color: #22c55e; background: #f0fdf4; border: 1px solid #bbf7d0; }
.status-tag--suspect { color: #f59e0b; background: #fffbeb; border: 1px solid #fde68a; }
.status-tag--unknown { color: #64748b; background: #f1f5f9; }
.status-tag--pending { color: #d97706; background: #fffbeb; border: 1px solid #fde68a; }
.status-tag--success { color: #16a34a; background: #f0fdf4; border: 1px solid #bbf7d0; }
.status-tag--failed { color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; }
.status-tag--skipped { color: #6b7280; background: #f9fafb; border: 1px solid #e5e7eb; }

.table-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 32px;
  color: #a0aec0;
  font-size: 14px;
  text-align: center;
}

.state-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: state-spin 0.7s linear infinite;
}

@keyframes state-spin {
  to { transform: rotate(360deg); }
}

.state-icon-empty {
  width: 40px;
  height: 40px;
  border: 2px dashed #cbd5e1;
  border-radius: 50%;
  position: relative;
}

.state-icon-empty::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 2px;
  background: #cbd5e1;
  transform: translate(-50%, -50%);
}

.detail-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.detail-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7c8da1;
  font-size: 14px;
}

.detail-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.detail-section { flex: 1; min-height: 0; padding: 16px; overflow-y: auto; background: linear-gradient(180deg, #f8fafc 0, #ffffff 142px), #ffffff; }

.detail-summary { display: flex; flex-direction: column; gap: 12px; padding: 14px 16px; margin-bottom: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 6px; box-shadow: 0 8px 18px rgba(33, 72, 108, 0.045); }
.detail-summary__main { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
.detail-summary__label { color: #475569; font-size: 12px; font-weight: 800; }
.detail-summary__value { color: #0f4c81; font-family: "DIN Alternate", "Arial", sans-serif; font-size: 17px; font-weight: 900; line-height: 1.25; word-break: normal; overflow-wrap: anywhere; }
.detail-summary__meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding-top: 10px; border-top: 1px solid #edf3f8; }
.detail-summary__meta-item { min-width: 0; padding: 8px 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e8eef5; }
.detail-summary__meta-label { display: block; color: #475569; font-size: 11px; font-weight: 800; }
.detail-summary__meta-value { display: block; margin-top: 4px; color: #0f172a; font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.detail-fields-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 12px; }
.detail-field-card { display: flex; flex-direction: column; gap: 6px; min-width: 0; padding: 12px 14px; background: #ffffff; border: 1px solid #c4d3e3; border-radius: 8px; box-shadow: 0 2px 8px rgba(33, 72, 108, 0.08); transition: border-color 0.18s ease, box-shadow 0.18s ease; }
.detail-field-card:hover { border-color: #4a90d9; box-shadow: 0 4px 12px rgba(33, 72, 108, 0.12); }
.detail-field-card__label { display: flex; align-items: center; gap: 6px; color: #4a5e73; font-size: 11px; font-weight: 800; letter-spacing: 0.3px; }
.detail-field-card__label::before { content: ""; width: 3px; height: 12px; background: #4a90d9; border-radius: 999px; flex-shrink: 0; }
.detail-field-card__value { color: #0f172a; font-size: 14px; font-weight: 700; line-height: 1.45; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-left: 9px; }

.time-section { min-width: 0; margin-top: 14px; padding: 14px; background: rgba(255, 255, 255, 0.96); border: 1px solid #dfebf5; border-radius: 6px; box-shadow: 0 8px 18px rgba(33, 72, 108, 0.055); }
.detail-section-title { display: block; margin-bottom: 12px; color: #183755; font-size: 14px; font-weight: 900; }
.time-list { position: relative; display: grid; gap: 0; }
.time-list::before { position: absolute; top: 16px; bottom: 16px; left: 6px; width: 2px; content: ""; background: #d7e8f6; }
.time-row { position: relative; display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 10px; min-width: 0; padding: 9px 0; }
.time-row__marker { position: relative; z-index: 1; width: 10px; height: 10px; margin-top: 4px; background: #0d82ee; border: 3px solid #e8f4ff; border-radius: 50%; box-shadow: 0 0 0 1px #b9dcff; }
.time-row__content { display: grid; grid-template-columns: 72px minmax(0, 1fr); align-items: center; gap: 10px; min-width: 0; }
.time-row__label { color: #6b7f94; font-size: 12px; font-weight: 800; }
.time-row__value { min-width: 0; color: #172033; font-size: 14px; font-weight: 700; line-height: 1.45; word-break: break-all; }
.time-section--location { background: linear-gradient(90deg, rgba(13, 130, 238, 0.08), rgba(255, 255, 255, 0) 58%), rgba(255, 255, 255, 0.96); margin-top: 10px; }
.location-row { display: grid; grid-template-columns: 60px minmax(0, 1fr); gap: 10px; min-width: 0; padding: 11px 0; border-bottom: 1px solid #edf3f8; &:last-child { border-bottom: 0; } }
.location-row__label { color: #6b7f94; font-size: 12px; font-weight: 800; }
.location-row__value { min-width: 0; color: #172033; font-size: 14px; font-weight: 700; word-break: break-all; }

@media (max-width: 1024px) {
  .main-layout {
    flex-direction: column;
  }

  .detail-panel {
    width: 100%;
    max-height: 340px;
  }
}
</style>
