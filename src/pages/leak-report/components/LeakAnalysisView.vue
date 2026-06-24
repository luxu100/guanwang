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
    <view class="main-layout">
      <!-- 左侧表格 -->
      <view class="table-panel">
        <view class="table-head">
          <text>{{ dataTypeLabel }}分析结果</text>
          <text class="table-head__meta">共 {{ total }} 条</text>
        </view>

        <scroll-view class="table-scroll" scroll-x scroll-y>
          <view class="data-table">
            <!-- 算法分析列头 -->
            <view v-if="dataType === 'algorithm'" class="data-row data-row--header">
              <text class="data-cell data-cell--index">序号</text>
              <text class="data-cell data-cell--device">设备编号</text>
              <text class="data-cell data-cell--time">音频时间</text>
              <text class="data-cell data-cell--signal">信号处理结果</text>
              <text class="data-cell data-cell--noise">噪音计结果</text>
              <text class="data-cell data-cell--leakage">泄漏判定</text>
              <text class="data-cell data-cell--zj">浙大算法</text>
            </view>

            <!-- 渗漏记录列头 -->
            <view v-else class="data-row data-row--header">
              <text class="data-cell data-cell--index">序号</text>
              <text class="data-cell data-cell--time">检出时间</text>
              <text class="data-cell data-cell--level">渗漏级别</text>
              <text class="data-cell data-cell--address">漏点位置</text>
              <text class="data-cell data-cell--part">泄漏部位</text>
              <text class="data-cell data-cell--account">检出人</text>
              <text class="data-cell data-cell--count">渗漏次数</text>
            </view>

            <view v-if="loading" class="table-state">加载中...</view>
            <view v-else-if="records.length === 0" class="table-state">暂无分析数据</view>

            <!-- 算法分析行 -->
            <view
              v-for="(item, index) in records"
              v-else
              :key="getRowKey(item, index)"
              class="data-row"
              :class="{ 'data-row--active': selectedRecordKey === getRowKey(item, index) }"
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
                <text class="data-cell data-cell--part">{{ getFieldValue(item, "leakPart") || "-" }}</text>
                <text class="data-cell data-cell--account">{{ getFieldValue(item, "detectAccount") || "-" }}</text>
                <text class="data-cell data-cell--count">-</text>
              </template>
            </view>
          </view>
        </scroll-view>

        <view class="pagination-bar">
          <button class="page-button" hover-class="page-button--hover" :disabled="pagination.pageNum <= 1" @click="changePage(-1)">上一页</button>
          <text class="page-info">第 {{ pagination.pageNum }} / {{ totalPages }} 页</text>
          <button class="page-button" hover-class="page-button--hover" :disabled="pagination.pageNum >= totalPages" @click="changePage(1)">下一页</button>
        </view>
      </view>

      <!-- 右侧详情 -->
      <view class="detail-panel">
        <view v-if="!selectedRecord" class="detail-empty">请选择左侧记录查看详情</view>
        <view v-else class="detail-body">
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
              <view v-for="item in currentDetailFields" :key="item.label" class="detail-item">
                <text class="detail-item__label">{{ item.label }}</text>
                <text class="detail-item__value">{{ item.value }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
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

const detailTabs: Array<{ label: string; value: DetailTab }> = [
  { label: "详情", value: "detail" },
];

const filters = reactive({
  startTime: "",
  endTime: "",
  deviceNumber: "",
  dataType: "algorithm" as DataType,
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

const currentDataTypeLabel = computed(() =>
  dataTypeOptions.find((o) => o.value === filters.dataType)?.label || "算法分析",
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
      { label: "信号处理结果", value: String(getFieldValue(r, "signalprocessingResult") || "-") },
      { label: "创建时间", value: formatDateTime(getFieldValue(r, "createdAt") || "-") },
    ];
  }
  return [
    { label: "ID", value: String(getFieldValue(r, "id") || "-") },
    { label: "检出时间", value: formatDateTime(getFieldValue(r, "detectedTime") || "-") },
    { label: "渗漏级别", value: getLeakLevelLabel(r) },
    { label: "漏点位置", value: String(getFieldValue(r, "leakAddress") || "-") },
    { label: "渗漏坐标", value: String(getFieldValue(r, "leakCoordinate") || "-") },
    { label: "泄漏部位", value: String(getFieldValue(r, "leakPart") || "-") },
    { label: "管道材质", value: String(getFieldValue(r, "tubeMaterial") || "-") },
    { label: "管道口径", value: String(getFieldValue(r, "tubeBore") || "-") },
    { label: "管道埋深", value: String(getFieldValue(r, "tubeDepth") || "-") },
    { label: "检出人", value: String(getFieldValue(r, "detectAccount") || "-") },
    { label: "关联设备", value: String(getFieldValue(r, "referenceDevices") || "-") },
    { label: "关联工单ID", value: String(getFieldValue(r, "referenceWorksheetId") || "-") },
    { label: "备注", value: String(getFieldValue(r, "remark") || "-") },
  ];
});

onMounted(() => {
  fetchAnalysisData();
});

function handleDataTypeChange(event: { detail: { value: number } }) {
  filters.dataType = dataTypeOptions[event.detail.value]?.value ?? "algorithm";
}

function buildQueryParams() {
  const baseParams = removeEmptyFields({
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    startTime: normalizeDateForApi(filters.startTime, false),
    endTime: normalizeDateForApi(filters.endTime, true),
    sortOrder: "desc",
    sortField: dataType.value === "algorithm" ? "createdAt" : "detectedTime",
  });

  if (filters.deviceNumber.trim()) {
    (baseParams as Record<string, unknown>).deviceNumber = filters.deviceNumber.trim();
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
    records.value = parsed.records;
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

function resetFilters() {
  filters.startTime = "";
  filters.endTime = "";
  filters.deviceNumber = "";
  filters.dataType = "algorithm";
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
  if (cur) pagination.pageNum = cur;
  if (sz) pagination.pageSize = sz;
  const minVisibleTotal = (pagination.pageNum - 1) * pagination.pageSize + finalRecords.length;
  const resolved = totalVal === undefined ? finalRecords.length : Math.max(totalVal, minVisibleTotal);
  return { records: finalRecords.map((r) => (isObject(r) ? r : { value: r })), total: resolved };
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
  padding: 14px 14px 10px;
  margin-bottom: 12px;
}

.toolbar-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-row--filters {
  margin-bottom: 10px;
}

.toolbar-row--bottom {
  justify-content: space-between;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  flex: none;
  color: #183755;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.filter-input {
  box-sizing: border-box;
  width: 140px;
  height: 38px;
  padding: 0 12px;
  color: #172033;
  font-size: 14px;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
}

.filter-input::placeholder,
.input-placeholder {
  color: #7f8fa3;
  font-size: 14px;
}

.filter-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  min-width: 110px;
  height: 38px;
  padding: 0 12px;
  color: #172033;
  font-size: 14px;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
  cursor: pointer;
}

.filter-select__arrow {
  width: 0;
  height: 0;
  margin-left: 8px;
  border-top: 5px solid #7f8fa3;
  border-right: 5px solid transparent;
  border-left: 5px solid transparent;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-datetime {
  width: 170px;
}

.filter-separator {
  flex: none;
  color: #7f8fa3;
  font-size: 13px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 64px;
  height: 38px;
  margin: 0;
  padding: 0 16px;
  color: #183755;
  font-size: 14px;
  font-weight: 700;
  background: #ffffff;
  border: 1px solid #d5e2ee;
  border-radius: 6px;
  cursor: pointer;
}

.toolbar-button--primary {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
}

.toolbar-button--hover {
  opacity: 0.85;
}

.toolbar-button:disabled {
  opacity: 0.45;
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
  background: #ffffff;
  border: 1px solid #d5e2ee;
  border-radius: 6px;
  cursor: pointer;
}

.toolbar-icon-button--hover {
  background: #edf5ff;
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
  display: flex;
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
  padding: 12px 14px;
}

.table-head {
  flex: none;
  color: #183755;
  font-size: 15px;
  font-weight: 900;
  border-bottom: 1px solid #edf3f8;
}

.table-head__meta {
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
}

.table-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.data-table {
  min-width: 780px;
}

.data-row {
  display: flex;
  align-items: center;
  height: 46px;
  border-bottom: 1px solid #f3f7fc;
  cursor: pointer;
}

.data-row--header {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f7fafd;
  cursor: default;
}

.data-row--active {
  background: #edf5ff;
}

.data-row:hover:not(.data-row--header) {
  background: #f7fafd;
}

.data-cell {
  flex: none;
  padding: 0 8px;
  overflow: hidden;
  color: #172033;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.data-row--header .data-cell {
  color: #183755;
  font-weight: 700;
}

.data-cell--index { width: 52px; text-align: center; }
.data-cell--device { width: 120px; }
.data-cell--time { width: 150px; }
.data-cell--signal { width: 140px; }
.data-cell--noise { width: 120px; }
.data-cell--leakage { width: 100px; }
.data-cell--zj { width: 120px; }
.data-cell--level { width: 80px; }
.data-cell--address { width: 140px; }
.data-cell--part { width: 90px; }
.data-cell--account { width: 90px; }
.data-cell--count { width: 80px; text-align: center; }

.level-pill {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 10px;
}

.level-pill--light {
  color: #16a34a;
  background: #dcfce7;
}

.level-pill--medium {
  color: #d97706;
  background: #fef3c7;
}

.level-pill--heavy {
  color: #dc2626;
  background: #fee2e2;
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 10px;
  color: #64748b;
  background: #f1f5f9;
}

.status-tag--leak {
  color: #dc2626;
  background: #fee2e2;
}

.status-tag--normal {
  color: #16a34a;
  background: #dcfce7;
}

.status-tag--unknown {
  color: #d97706;
  background: #fef3c7;
}

.table-state {
  padding: 32px;
  color: #7c8da1;
  font-size: 14px;
  text-align: center;
}

.pagination-bar {
  flex: none;
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

.page-button--hover { background: #edf5ff; }
.page-button:disabled { opacity: 0.4; cursor: not-allowed; }

.page-info {
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
}

.detail-panel {
  width: 340px;
  flex: none;
  display: flex;
  flex-direction: column;
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
  color: #0d82ee;
  border-bottom-color: #0d82ee;
}

.detail-section {
  flex: 1;
  min-height: 0;
  padding: 14px;
  overflow-y: auto;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item__label {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.detail-item__value {
  color: #172033;
  font-size: 14px;
  font-weight: 600;
  word-break: break-all;
}

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
</style>
