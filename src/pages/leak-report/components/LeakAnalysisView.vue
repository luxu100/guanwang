<template>
  <view class="leak-analysis-view">
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

        <view class="filter-group">
          <text class="filter-label">设备编号</text>
          <input v-model="filters.deviceNumber" class="filter-input" placeholder="请输入设备编号" placeholder-class="input-placeholder" />
        </view>

        <!-- 算法分析tab：算法状态 -->
        <template v-if="dataType === 'algorithm'">
          <view class="filter-group">
            <text class="filter-label">算法状态</text>
            <picker :range="algorithmStatusOptions" range-key="label" @change="handleAlgorithmStatusChange">
              <view class="filter-select">
                <text>{{ currentAlgorithmStatusLabel }}</text>
                <text class="filter-select__arrow"></text>
              </view>
            </picker>
          </view>
        </template>

        <!-- 渗漏记录tab：渗漏级别 + 检出人 -->
        <template v-if="dataType === 'leakage'">
          <view class="filter-group">
            <text class="filter-label">渗漏级别</text>
            <picker :range="leakLevelOptions" range-key="label" @change="handleLeakLevelChange">
              <view class="filter-select">
                <text>{{ currentLeakLevelLabel }}</text>
                <text class="filter-select__arrow"></text>
              </view>
            </picker>
          </view>
          <view class="filter-group">
            <text class="filter-label">检出人</text>
            <input v-model="filters.inspector" class="filter-input" placeholder="请输入检出人" placeholder-class="input-placeholder" />
          </view>
        </template>

        <view class="filter-group">
          <text class="filter-label">数据类型</text>
          <picker :range="dataTypeOptions" range-key="label" @change="handleDataTypeChange">
            <view class="filter-select">
              <text>{{ currentDataTypeLabel }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>
      </view>

      <view class="toolbar-row toolbar-row--bottom">
        <view class="toolbar-actions">
          <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="searchAnalysis">查询</button>
          <button class="toolbar-button" hover-class="toolbar-button--hover" @click="resetFilters">重置</button>
          <button class="toolbar-icon-button" hover-class="toolbar-icon-button--hover" aria-label="刷新" @click="fetchAnalysisData">
            <text class="icon-refresh"></text>
          </button>
        </view>
        <view class="toolbar-actions toolbar-actions--right">
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

    <!-- 统计卡片 -->
    <view class="stats-grid">
      <view v-for="item in statisticsCards" :key="item.label" class="stat-card">
        <text class="stat-card__label">{{ item.label }}</text>
        <text class="stat-card__value">{{ item.value }}</text>
      </view>
    </view>

    <!-- 主内容区 -->
    <LeakTableView
      :title="`${dataTypeLabel}分析结果`"
      :total="total"
      :page-num="pagination.pageNum"
      :total-pages="totalPages"
      :has-detail="!!selectedRecord"
      detail-empty-text="请选择左侧记录查看详情"
      @prev-page="changePage(-1)"
      @next-page="changePage(1)"
    >
      <view class="data-table">
        <!-- 算法分析列头 -->
        <view v-if="dataType === 'algorithm'" class="data-row data-row--header data-row--algorithm">
          <text class="data-cell data-cell--index">序号</text>
          <text class="data-cell data-cell--device">设备编号</text>
          <text class="data-cell data-cell--time">音频时间</text>
          <text class="data-cell data-cell--signal">信号处理结果</text>
          <text class="data-cell data-cell--noise">噪音计结果</text>
          <text class="data-cell data-cell--leakage">泄漏判定</text>
          <text class="data-cell data-cell--zj">浙大算法</text>
        </view>

        <!-- 渗漏记录列头 -->
        <view v-else class="data-row data-row--header data-row--leakage">
          <text class="data-cell data-cell--index">序号</text>
          <text class="data-cell data-cell--time data-cell--sortable" @click.stop="toggleSort('detectedTime')">检出时间<text class="sort-arrow sort-arrow--active" v-if="sortField === 'detectedTime'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</text><text class="sort-arrow" v-else></text></text>
          <text class="data-cell data-cell--level data-cell--sortable" @click.stop="toggleSort('leakLevel')">渗漏级别<text class="sort-arrow sort-arrow--active" v-if="sortField === 'leakLevel'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</text><text class="sort-arrow" v-else></text></text>
          <text class="data-cell data-cell--address">漏点位置</text>
          <text class="data-cell data-cell--coord">渗漏坐标</text>
          <text class="data-cell data-cell--part">渗漏部位</text>
          <text class="data-cell data-cell--material">管道材质</text>
          <text class="data-cell data-cell--account">检出人</text>
        </view>

        <view v-if="loading" class="table-state">加载中...</view>
        <view v-else-if="records.length === 0" class="table-state">暂无分析数据</view>

        <!-- 算法分析行 -->
        <view
          v-for="(item, index) in records"
          v-else
          :key="getRowKey(item, index)"
          :class="['data-row', dataType === 'algorithm' ? 'data-row--algorithm' : 'data-row--leakage', { 'data-row--active': selectedRecordKey === getRowKey(item, index) }]"
          @click="selectRecord(item, index)"
        >
          <text class="data-cell data-cell--index">{{ (pagination.pageNum - 1) * pagination.pageSize + index + 1 }}</text>
          <template v-if="dataType === 'algorithm'">
            <text class="data-cell data-cell--device">{{ getFieldValue(item, "deviceNumber") || "-" }}</text>
            <text class="data-cell data-cell--time">{{ formatDateTime(getFieldValue(item, "audioTime")) }}</text>
            <text class="data-cell data-cell--signal">{{ getFieldValue(item, "signalprocessingResult") || "-" }}</text>
            <text class="data-cell data-cell--noise">{{ getFieldValue(item, "signalprocessingResult1") || "-" }}</text>
            <text class="data-cell data-cell--leakage">
              <text class="status-tag" :class="getLeakStatusTagClass(item, 'signalprocessingResult2')">
                {{ getFieldValue(item, "signalprocessingResult2") || "-" }}
              </text>
            </text>
            <text class="data-cell data-cell--zj">{{ getFieldValue(item, "signalprocessingResult3") || "-" }}</text>
          </template>
          <template v-else>
            <text class="data-cell data-cell--time">{{ formatDateTime(getFieldValue(item, "detectedTime")) }}</text>
            <text class="data-cell data-cell--level">
              <text class="level-pill" :class="getLeakLevelClass(item)">{{ getLeakLevelLabel(item) }}</text>
            </text>
            <text class="data-cell data-cell--address">{{ getFieldValue(item, "leakAddress") || "-" }}</text>
            <text class="data-cell data-cell--coord">{{ getFieldValue(item, "leakCoordinate") || "-" }}</text>
            <text class="data-cell data-cell--part">{{ getFieldValue(item, "leakPart") || "-" }}</text>
            <text class="data-cell data-cell--material">{{ getFieldValue(item, "tubeMaterial") || "-" }}</text>
            <text class="data-cell data-cell--account">{{ getFieldValue(item, "detectAccount") || "-" }}</text>
          </template>
        </view>
      </view>

      <!-- 右侧详情 -->
      <template #detail>
        <view class="detail-body">
          <view class="detail-tabs">
            <view
              v-for="tab in detailTabs"
              :key="tab.value"
              class="detail-tab"
              :class="{ 'detail-tab--active': activeDetailTab === tab.value }"
              @click="activeDetailTab = tab.value"
            >
              {{ tab.label }}
            </view>
          </view>

          <view class="detail-section">
            <view class="detail-grid">
              <view v-for="item in currentDetailFields" :key="item.label" class="detail-item" :class="getDetailItemClass(item)">
                <text class="detail-item__label">{{ item.label }}</text>
                <text class="detail-item__value">{{ item.value }}</text>
              </view>
            </view>
          </view>
          <view v-if="selectedRecord && dataType === 'algorithm'" class="detail-audio-section">
            <view class="detail-audio-header">
              <text class="detail-audio-title">关联音频</text>
              <button v-if="audioList.length > 0" class="audio-refresh-btn" hover-class="audio-refresh-btn--hover" @click="loadAudioList">刷新</button>
            </view>
            <view v-if="audioLoading" class="audio-state">加载中...</view>
            <view v-else-if="audioList.length === 0" class="audio-state">暂无关联音频</view>
            <view v-else class="audio-list">
              <view v-for="(audio, ai) in audioList" :key="ai" class="audio-item">
                <view class="audio-item__info">
                  <text class="audio-item__time">{{ formatDateTime(getFieldValue(audio, "audioTime")) }}</text>
                  <text class="audio-item__rate">采样率: {{ getFieldValue(audio, "samplingRate") || "-" }}</text>
                </view>
                <view class="audio-item__actions">
                  <button class="audio-play-btn" hover-class="audio-play-btn--hover" @click="toggleAudioPlay(audio, ai)">{{ playingAudioIndex === ai ? '暂停' : '播放' }}</button>
                  <a :href="getAudioWavUrl(audio, true)" class="audio-download-link">下载</a>
                </view>
              </view>
            </view>
          </view>
        </view>
      </template>
    </LeakTableView>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from "vue";
import {
  getLeakAnalysisPage,
  getAlgorithmAnalysisPage,
  getLeakAnalysisDetail,
  getAlgorithmAnalysisDetail,
} from "@/services/leak-report/leak-analysis";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";
import LeakTableView from "@/pages/leak-report/components/LeakTableView.vue";

function getBaseUrl(): string {
  return (import.meta as unknown as { env: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL || "";
}

type AnalysisRecord = Record<string, unknown>;
type DataType = "algorithm" | "leakage";
type DetailTab = "detail" | "extra";

interface ApiResponseLike {
  code?: number;
  data?: unknown;
  records?: unknown[];
  rows?: unknown[];
  total?: number;
  msg?: string;
}

const dataTypeOptions: Array<{ label: string; value: DataType }> = [
  { label: "算法分析", value: "algorithm" },
  { label: "渗漏记录", value: "leakage" },
];

const leakLevelOptions: Array<{ label: string; value: number | "" }> = [
  { label: "不限", value: "" },
  { label: "轻度", value: 0 },
  { label: "中度", value: 1 },
  { label: "重度", value: 2 },
  { label: "疑点", value: 3 },
];

const algorithmStatusOptions: Array<{ label: string; value: string }> = [
  { label: "不限", value: "" },
  { label: "等待处理", value: "PENDING" },
  { label: "处理成功", value: "SUCCESS" },
  { label: "处理失败", value: "FAILED" },
  { label: "跳过", value: "SKIPPED" },
];

const detailTabs: Array<{ label: string; value: DetailTab }> = [
  { label: "详情", value: "detail" },
];

const sortField = ref("createdAt");
const sortOrder = ref("desc");

const filters = reactive({
  startTime: "",
  endTime: "",
  deviceNumber: "",
  dataType: "algorithm" as DataType,
  leakLevel: "" as number | "",
  inspector: "",
  algorithmStatus: "" as string,
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
});

const records = ref<AnalysisRecord[]>([]);
const selectedRecord = ref<AnalysisRecord | null>(null);
const selectedRecordKey = ref("");
const total = ref(0);
const loading = ref(false);
const dataType = ref<DataType>("algorithm");
const activeDetailTab = ref<DetailTab>("detail");
const exportMenuVisible = ref(false);
const audioList = ref<Record<string, unknown>[]>([]);
const audioLoading = ref(false);
const playingAudioIndex = ref(-1);
let audioPlayerInstance: HTMLAudioElement | null = null;

const currentDataTypeLabel = computed(() =>
  dataTypeOptions.find((o) => o.value === filters.dataType)?.label || "算法分析",
);

const currentLeakLevelLabel = computed(() =>
  leakLevelOptions.find((o) => o.value === filters.leakLevel)?.label || "不限",
);

const currentAlgorithmStatusLabel = computed(() =>
  algorithmStatusOptions.find((o) => o.value === filters.algorithmStatus)?.label || "不限",
);

const dataTypeLabel = computed(() =>
  dataType.value === "algorithm" ? "算法" : "渗漏记录",
);

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pagination.pageSize)));

const statisticsCards = computed(() => {
  const totalCount = total.value;
  let leakCount = 0;
  let normalCount = 0;

  if (dataType.value === "algorithm") {
    leakCount = records.value.filter(
      (r) => String(getFieldValue(r, "signalprocessingResult2") || "").includes("Leakage") || String(getFieldValue(r, "signalprocessingResult2") || "").includes("leakage"),
    ).length;
  } else {
    normalCount = records.value.filter((r) => Number(getFieldValue(r, "leakLevel")) === 0).length;
    leakCount = records.value.filter((r) => Number(getFieldValue(r, "leakLevel")) !== 0).length;
  }

  return [
    { label: dataTypeLabel.value + "记录数", value: String(totalCount) },
    { label: "泄漏/异常", value: String(leakCount) },
    { label: "正常/轻度", value: String(dataType.value === "algorithm" ? total.value - leakCount : normalCount) },
    { label: "当前页条数", value: String(records.value.length) },
  ];
});

const currentDetailFields = computed(() => {
  const r = selectedRecord.value || {};
  if (dataType.value === "algorithm") {
    return [
      { label: "ID", value: String(getFieldValue(r, "id") || "-") },
      { label: "设备ID", value: String(getFieldValue(r, "deviceId") || "-") },
      { label: "设备编号", value: String(getFieldValue(r, "deviceNumber") || "-") },
      { label: "采样记录ID", value: String(getFieldValue(r, "samplingId") || "-") },
      { label: "音频文件ID", value: String(getFieldValue(r, "audioFileId") || "-") },
      { label: "音频时间", value: formatDateTime(getFieldValue(r, "audioTime") || "-") },
      { label: "信号处理结果(噪音计)", value: String(getFieldValue(r, "signalprocessingResult1") || "-") },
      { label: "泄漏判定", value: String(getFieldValue(r, "signalprocessingResult2") || "-") },
      { label: "浙大算法结果", value: String(getFieldValue(r, "signalprocessingResult3") || "-") },
      { label: "信号处理频率3", value: String(getFieldValue(r, "signalprocessingFrequency3") || "-") },
      { label: "信号处理结果", value: String(getFieldValue(r, "signalprocessingResult") || "-") },
      { label: "算法状态", value: String(getFieldValue(r, "algorithmStatus") || "-") },
      { label: "失败原因", value: String(getFieldValue(r, "algorithmError") || "-") },
      { label: "创建时间", value: formatDateTime(getFieldValue(r, "createdAt") || "-") },
    ];
  }
  return [
    { label: "ID", value: String(getFieldValue(r, "id") || "-") },
    { label: "检出时间", value: formatDateTime(getFieldValue(r, "detectedTime") || "-") },
    { label: "渗漏级别", value: getLeakLevelLabel(r) },
    { label: "状态", value: String(getFieldValue(r, "leakStatus") || "-") },
    { label: "漏点位置", value: String(getFieldValue(r, "leakAddress") || "-") },
    { label: "渗漏坐标", value: String(getFieldValue(r, "leakCoordinate") || "-") },
    { label: "泄漏部位", value: String(getFieldValue(r, "leakPart") || "-") },
    { label: "管道材质", value: String(getFieldValue(r, "tubeMaterial") || "-") },
    { label: "管道口径", value: String(getFieldValue(r, "tubeBore") || "-") },
    { label: "管道埋深", value: String(getFieldValue(r, "tubeDepth") || "-") },
    { label: "管道年限", value: String(getFieldValue(r, "tubeAge") || "-") },
    { label: "检出人", value: String(getFieldValue(r, "detectAccount") || "-") },
    { label: "最近设备距离", value: String(getFieldValue(r, "closestDeviceDistance") || "-") },
    { label: "关联设备", value: String(getFieldValue(r, "referenceDevices") || "-") },
    { label: "关联工单ID", value: String(getFieldValue(r, "referenceWorksheetId") || "-") },
    { label: "天气", value: String(getFieldValue(r, "weather") || "-") },
    { label: "增益", value: String(getFieldValue(r, "gain") || "-") },
    { label: "特征值", value: String(getFieldValue(r, "featureValue") || "-") },
    { label: "蓝鲸分析", value: String(getFieldValue(r, "blueWhaleAnalysis") || "-") },
    { label: "人工分析", value: String(getFieldValue(r, "manualAnalysis") || "-") },
    { label: "原因分析", value: String(getFieldValue(r, "causeAnalysis") || "-") },
    { label: "排查反馈", value: String(getFieldValue(r, "checkFeedback") || "-") },
    { label: "算法类型", value: String(getFieldValue(r, "algorithmType") || "-") },
    { label: "泄漏带宽", value: String(getFieldValue(r, "leakBandwidth") || "-") },
    { label: "泄漏能量", value: String(getFieldValue(r, "leakEnergy") || "-") },
    { label: "泄漏频率", value: String(getFieldValue(r, "leakFrequency") || "-") },
    { label: "阀门编号", value: String(getFieldValue(r, "valveNumber") || "-") },
    { label: "所属片区", value: String(getFieldValue(r, "areaName") || "-") },
    { label: "安装人员", value: String(getFieldValue(r, "installPerson") || "-") },
    { label: "安装地址", value: String(getFieldValue(r, "installAddress") || "-") },
    { label: "坐标位置", value: String(getFieldValue(r, "coordinate") || "-") },
    { label: "拆装", value: String(getFieldValue(r, "installStatus") || "-") },
    { label: "备注", value: String(getFieldValue(r, "remark") || "-") },
    { label: "创建时间", value: formatDateTime(getFieldValue(r, "createdAt") || "-") },
  ];
});

onMounted(() => {
  fetchAnalysisData();
});

function handleDataTypeChange(event: { detail: { value: number } }) {
  filters.dataType = dataTypeOptions[event.detail.value]?.value ?? "algorithm";
  searchAnalysis();
}

function handleLeakLevelChange(event: { detail: { value: number } }) {
  filters.leakLevel = leakLevelOptions[event.detail.value]?.value ?? "";
}

function handleAlgorithmStatusChange(event: { detail: { value: number } }) {
  filters.algorithmStatus = algorithmStatusOptions[event.detail.value]?.value ?? "";
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
  fetchAnalysisData();
}

function buildQueryParams() {
  const baseParams = removeEmptyFields({
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    startTime: normalizeDateForApi(filters.startTime, false),
    endTime: normalizeDateForApi(filters.endTime, true),
    sortOrder: sortOrder.value || "desc",
    sortField: sortField.value || (dataType.value === "algorithm" ? "createdAt" : "detectedTime"),
  });

  if (filters.deviceNumber.trim()) {
    (baseParams as Record<string, unknown>).deviceNumber = filters.deviceNumber.trim();
  }
  // 算法分析tab补充筛选
  if (dataType.value === "algorithm") {
    if (filters.algorithmStatus !== "") (baseParams as Record<string, unknown>).algorithmStatus = filters.algorithmStatus;
  }
  // 渗漏记录tab补充筛选
  if (dataType.value === "leakage") {
    if (filters.leakLevel !== "") (baseParams as Record<string, unknown>).leakLevel = filters.leakLevel;
    if (filters.inspector.trim()) (baseParams as Record<string, unknown>).inspector = filters.inspector.trim();
  }

  return baseParams;
}

async function fetchAnalysisData() {
  loading.value = true;
  dataType.value = filters.dataType;
  try {
    const apiFn = dataType.value === "algorithm" ? getAlgorithmAnalysisPage : getLeakAnalysisPage;
    const response = (await apiFn(buildQueryParams())) as ApiResponseLike;
    assertSuccessResponse(response);
    const parsed = parsePageResponse(response);
    if (parsed.pageNum && parsed.pageNum !== pagination.pageNum) pagination.pageNum = parsed.pageNum;
    if (parsed.pageSize && parsed.pageSize !== pagination.pageSize) pagination.pageSize = parsed.pageSize;
    records.value = applyLocalSort(parsed.records);
    total.value = parsed.total;
    selectFirstRow();
  } catch (error) {
    records.value = [];
    total.value = 0;
    selectedRecord.value = null;
    selectedRecordKey.value = "";
    uni.showToast({ title: (error as { msg?: string })?.msg || "分析数据加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function searchAnalysis() {
  pagination.pageNum = 1;
  fetchAnalysisData();
}

async function handleExport(scope: "current" | "all") {
  exportMenuVisible.value = false;
  let exportRecords = records.value;
  if (scope === "all") {
    try {
      const apiFn = dataType.value === "algorithm" ? getAlgorithmAnalysisPage : getLeakAnalysisPage;
      const params = { ...buildQueryParams(), pageNum: 1, pageSize: 99999 };
      const response = (await apiFn(params)) as ApiResponseLike;
      assertSuccessResponse(response);
      const parsed = parsePageResponse(response);
      exportRecords = parsed.records;
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
  const isAlgorithm = dataType.value === "algorithm";
  const headers = isAlgorithm
    ? ["序号", "设备编号", "音频时间", "信号处理结果", "噪音计结果", "泄漏判定", "浙大算法"]
    : ["序号", "检出时间", "渗漏级别", "漏点位置", "泄漏部位", "检出人", "渗漏次数"];
  const levelMap: Record<number, string> = { 0: "轻度", 1: "中度", 2: "重度" };
  const rows = exportRecords.map((r, idx) => {
    if (isAlgorithm) {
      const keys = ["deviceNumber", "audioTime", "signalprocessingResult", "signalprocessingResult1", "signalprocessingResult2", "signalprocessingResult3"];
      return [String(idx + 1), ...keys.map((k) => {
        const v = getFieldValue(r, k);
        return v === undefined || v === null ? "" : String(v).replace(/"/g, '""');
      })];
    }
    const keys = ["detectedTime", "leakLevel", "leakAddress", "leakPart", "detectAccount"];
    return [
      String(idx + 1),
      ...keys.map((k) => {
        if (k === "leakLevel") return levelMap[Number(getFieldValue(r, k))] ?? "";
        const v = getFieldValue(r, k);
        return v === undefined || v === null ? "" : String(v).replace(/"/g, '""');
      }),
      "-",
    ];
  });
  const csv = [headers.join(","), ...rows.map((row) => row.map((c) => `"${c}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${isAlgorithm ? "算法分析数据" : "渗漏记录数据"}_${new Date().toISOString().slice(0, 10)}.csv`;
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
  filters.deviceNumber = "";
  filters.dataType = "algorithm";
  filters.leakLevel = "";
  filters.inspector = "";
  filters.algorithmStatus = "";
  searchAnalysis();
}

function changePage(step: number) {
  const nextPage = pagination.pageNum + step;
  if (nextPage < 1 || nextPage > totalPages.value) return;
  pagination.pageNum = nextPage;
  fetchAnalysisData();
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
  activeDetailTab.value = "detail";
}

function selectRecord(item: AnalysisRecord, index: number) {
  selectedRecord.value = item;
  selectedRecordKey.value = getRowKey(item, index);
  activeDetailTab.value = "detail";
  loadAudioList();

  const id = getRowId(item);
  if (!id) return;

  const apiFn = dataType.value === "algorithm" ? getAlgorithmAnalysisDetail : getLeakAnalysisDetail;
  apiFn(id)
    .then((response: unknown) => {
      assertSuccessResponse(response as ApiResponseLike);
      const detailData = (response as ApiResponseLike)?.data;
      if (isObject(detailData)) {
        selectedRecord.value = { ...item, ...detailData };
      }
    })
    .catch(() => {});
}

function getAudioWavUrl(audio: Record<string, unknown>, download = false): string {
  const id = getFieldValue(audio, "id");
  if (!id) return "";
  const base = getBaseUrl();
  return `${base}/api/sampling-audio/${id}/wav${download ? "?download=true" : ""}`;
}

async function loadAudioList() {
  if (!selectedRecord.value) return;
  const deviceNumber = getFieldValue(selectedRecord.value, "deviceNumber");
  if (!deviceNumber) { audioList.value = []; return; }
  audioLoading.value = true;
  try {
    const { postRequest } = await import("@/services/shared/crud");
    const res = await postRequest("/api/sampling-audio/page", { pageNum: 1, pageSize: 10, deviceNumber }) as unknown as ApiResponseLike;
    const p = parsePageResponse(res);
    audioList.value = (p.records || []) as Record<string, unknown>[];
  } catch { audioList.value = []; }
  finally { audioLoading.value = false; }
}

function toggleAudioPlay(audio: Record<string, unknown>, index: number) {
  // #ifdef H5
  if (playingAudioIndex.value === index) {
    audioPlayerInstance?.pause();
    playingAudioIndex.value = -1;
    return;
  }
  audioPlayerInstance?.pause();
  audioPlayerInstance = new Audio(getAudioWavUrl(audio));
  audioPlayerInstance.onended = () => { playingAudioIndex.value = -1; };
  audioPlayerInstance.play();
  playingAudioIndex.value = index;
  // #endif
  // #ifndef H5
  uni.showToast({ title: "音频播放仅支持 H5 端", icon: "none" });
  // #endif
}

// --- helpers ---

function getRowId(item: AnalysisRecord) {
  const v = getFieldValue(item, "id");
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
}

function getRowKey(item: AnalysisRecord, index: number) {
  return getRowId(item) || String(index);
}

function getFieldValue(item: AnalysisRecord, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(item, key) ? item[key] : undefined;
}

function getLeakLevelLabel(item: AnalysisRecord) {
  const val = Number(getFieldValue(item, "leakLevel"));
  if (val === 0) return "轻度";
  if (val === 1) return "中度";
  if (val === 2) return "重度";
  return "未知";
}

function getLeakLevelClass(item: AnalysisRecord) {
  const val = Number(getFieldValue(item, "leakLevel"));
  if (val === 0) return "level-pill--light";
  if (val === 1) return "level-pill--medium";
  if (val === 2) return "level-pill--heavy";
  if (val === 3) return "level-pill--suspect";
  return "";
}

function getDetailItemClass(item: { label: string }) {
  if (item.label !== "渗漏级别" || !selectedRecord.value) return "";
  const v = Number(getFieldValue(selectedRecord.value, "leakLevel"));
  if (v === 0) return "detail-item--level-light";
  if (v === 1) return "detail-item--level-medium";
  if (v === 2) return "detail-item--level-heavy";
  return "";
}

function getLeakStatusTagClass(item: AnalysisRecord, key: string) {
  const val = String(getFieldValue(item, key) || "").toLowerCase();
  if (val.includes("leakage")) return "status-tag--leak";
  if (val.includes("noleakage")) return "status-tag--normal";
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

function findPageContainer(value: unknown): AnalysisRecord | null {
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

function applyLocalSort(list: AnalysisRecord[]): AnalysisRecord[] {
  if (!sortField.value || !sortOrder.value) return list;
  const field = sortField.value;
  const order = sortOrder.value;
  return [...list].sort((a, b) => {
    let va: unknown = a[field];
    let vb: unknown = b[field];
    if (field === "leakLevel") {
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
.leak-analysis-view {
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
.stat-card {
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
  margin-bottom: 12px;
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
  min-width: 110px;
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

.toolbar-button--hover {
  color: #3b82f6;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.toolbar-button--primary.toolbar-button--hover {
  color: #ffffff;
  background: #2563eb;
  border-color: #2563eb;
}

.toolbar-button:disabled {
  color: #9aa9b8;
  background: #eff6ff;
  border-color: #d7e0e8;
  cursor: not-allowed;
}

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

.toolbar-icon-button--hover {
  background: #eff6ff;
}

.icon-refresh {
  display: block;
  width: 18px;
  height: 18px;
  border: 2px solid #7f8fa3;
  border-top-color: transparent;
  border-radius: 50%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  flex: none;
  margin-bottom: 12px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px 12px;
}

.stat-card__label {
  color: #64748b;
  font-size: 13px;
}

.stat-card__value {
  color: #183755;
  font-size: 24px;
  font-weight: 900;
}

.main-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(380px, 20vw, 420px);
  flex: 1;
  min-height: 0;
  gap: 12px;
  overflow: hidden;
}

.table-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.table-head,
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.table-head {
  flex: none;
  height: 50px;
  color: #24445f;
  font-size: 16px;
  font-weight: 800;
  background: #ffffff;
  border-bottom: 1px solid #edf3f8;
}

.table-head__meta {
  padding: 4px 10px;
  color: #6a7f94;
  font-size: 13px;
  font-weight: 800;
  background: #f7fafc;
  border: 1px solid #e3ebf2;
  border-radius: 999px;
}

.table-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #ffffff;
}

.table-scroll::-webkit-scrollbar,
.detail-section::-webkit-scrollbar {
  width: 9px;
  height: 9px;
}

.table-scroll::-webkit-scrollbar-track,
.detail-section::-webkit-scrollbar-track {
  background: #edf3f8;
  border-radius: 999px;
}

.table-scroll::-webkit-scrollbar-thumb,
.detail-section::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, #9fb4c8, #6f8ba8);
  border: 2px solid #edf3f8;
  border-radius: 999px;
}

.table-scroll::-webkit-scrollbar-thumb:hover,
.detail-section::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(90deg, #7f9ab4, #4d6f91);
}

.data-table {
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.data-row {
  display: grid;
  grid-template-columns: 58px minmax(110px, 2.2fr) minmax(160px, 3fr) minmax(160px, 3.8fr) minmax(110px, 2.2fr) minmax(96px, 1.6fr) minmax(110px, 2fr);
  min-height: 48px;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
  transition: background 0.18s ease, box-shadow 0.18s ease;
}

.data-row--algorithm {
  grid-template-columns: 58px minmax(110px, 2.2fr) minmax(160px, 3fr) minmax(160px, 3.8fr) minmax(110px, 2.2fr) minmax(96px, 1.6fr) minmax(110px, 2fr);
}

.data-row--leakage {
  grid-template-columns: 58px minmax(160px, 2.6fr) minmax(80px, 1fr) minmax(160px, 3fr) minmax(120px, 2fr) minmax(96px, 1.6fr) minmax(96px, 1.4fr) minmax(80px, 1fr);
}

.data-row--header {
  position: sticky;
  top: 0;
  z-index: 1;
  min-height: 50px;
  color: #20384f;
  font-weight: 800;
  background: #fafafa;
  cursor: default;
  box-shadow: 0 1px 0 #dbe7f0;
}

.data-row:not(.data-row--header):nth-child(odd) {
  background: #ffffff;
}

.data-row:not(.data-row--header):nth-child(even) {
  background: #fbfdff;
}

.data-row:not(.data-row--header):hover {
  background: #eff6ff;
  box-shadow: inset 0 0 0 1px #cbd5e1;
}

.data-row--active {
  position: relative;
  background: #eff6ff !important;
  box-shadow: inset 0 0 0 1px #bfdbfe;
}

.data-row--active::before {
  position: absolute;
  top: 7px;
  bottom: 7px;
  left: 0;
  width: 3px;
  content: "";
  background: #3b82f6;
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
.data-cell--device { color: #0f4c81; font-family: "DIN Alternate", "Arial", sans-serif; font-weight: 800; }
.data-cell--time { color: #0f4c81; font-family: "DIN Alternate", "Arial", sans-serif; font-weight: 800; }
.data-cell--address { justify-content: center; text-align: center; }

.data-cell--sortable { cursor: pointer; user-select: none; }
.data-cell--sortable:hover { color: #3b82f6; }

.sort-arrow { flex: none; font-size: 10px; line-height: 1; margin-left: 2px; color: #bcc7d6; transition: color 0.18s ease; &--active { color: #3b82f6; } }
.data-cell--sortable:hover .sort-arrow:not(.sort-arrow--active) { color: #7f8fa3; }

.level-pill {
  display: inline-block;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 10px;
}

.level-pill--light {
  color: #22c55e;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.level-pill--medium {
  color: #f59e0b;
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.level-pill--heavy {
  color: #ef4444;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.level-pill--suspect {
  color: #8c8c8c;
  background: #fafafa;
  border: 1px solid #d9d9d9;
}

.status-tag {
  display: inline-block;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 10px;
  color: #64748b;
  background: #f1f5f9;
}

.status-tag--leak {
  color: #ef4444;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.status-tag--normal {
  color: #22c55e;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.status-tag--unknown {
  color: #f59e0b;
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.table-state {
  padding: 48px 32px;
  color: #a0aec0;
  font-size: 14px;
  text-align: center;
}

.pagination-bar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-top: 1px solid #edf3f8;
}

.page-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  height: 34px;
  margin: 0;
  padding: 0 14px;
  color: #183755;
  font-size: 13px;
  font-weight: 700;
  background: #ffffff;
  border: 1px solid #d5e2ee;
  border-radius: 6px;
  cursor: pointer;
}

.page-button--hover { background: #eff6ff; }
.page-button:disabled { opacity: 0.4; cursor: not-allowed; }

.page-info {
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
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

.detail-tabs {
  display: flex;
  flex: none;
  border-bottom: 1px solid #edf3f8;
}

.detail-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.detail-tab--active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.detail-section { flex: 1; min-height: 0; padding: 16px; overflow-y: auto; background: linear-gradient(180deg, #f8fafc 0, #ffffff 142px), #ffffff; }

.detail-grid { display: grid; gap: 0; overflow: hidden; background: #ffffff; border: 1px solid #dfebf5; border-radius: 6px; box-shadow: 0 8px 18px rgba(33, 72, 108, 0.045); }

.detail-item { display: grid; grid-template-columns: 92px minmax(0, 1fr); align-items: center; min-height: 48px; padding: 8px 14px; border-bottom: 1px solid #edf3f8; }

.detail-grid .detail-item:last-child { border-bottom: 0; }

.detail-item__label { display: flex; align-items: center; color: #71869b; font-size: 12px; font-weight: 800; line-height: 1.3; }

.detail-item__value { color: #172033; font-size: 14px; font-weight: 700; line-height: 1.45; text-align: right; word-break: break-all; }

.detail-item--level-light { border-left: 4px solid #22c55e; padding-left: 10px; background: #f0fdf4; }

.detail-item--level-medium { border-left: 4px solid #f59e0b; padding-left: 10px; background: #fffbeb; }

.detail-item--level-heavy { border-left: 4px solid #ef4444; padding-left: 10px; background: #fef2f2; }

@media (max-width: 1024px) {
  .main-layout {
    flex-direction: column;
  }

  .detail-panel {
    width: 100%;
    max-height: 340px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
.detail-audio-section { flex: none; padding: 12px 16px; border-top: 1px solid #edf3f8; max-height: 280px; overflow-y: auto; }
.detail-audio-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.detail-audio-title { font-size: 13px; font-weight: 800; color: #415a73; }
.audio-refresh-btn { min-width: 48px; height: 24px; padding: 0 8px; font-size: 12px; color: #3b82f6; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; }
.audio-refresh-btn--hover { background: #dbeafe; }
.audio-state { padding: 16px; text-align: center; color: #a0aec0; font-size: 13px; }
.audio-list { display: flex; flex-direction: column; gap: 8px; }
.audio-item { padding: 8px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
.audio-item__info { display: flex; gap: 12px; margin-bottom: 6px; }
.audio-item__time { font-size: 12px; font-weight: 700; color: #3b82f6; }
.audio-item__rate { font-size: 12px; color: #64748b; }
.audio-item__actions { display: flex; align-items: center; gap: 8px; }
.audio-play-btn { min-width: 48px; height: 28px; padding: 0 10px; font-size: 12px; color: #3b82f6; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; } .audio-play-btn--hover { background: #dbeafe; }
.audio-download-link { font-size: 12px; color: #3b82f6; text-decoration: underline; }
</style>
