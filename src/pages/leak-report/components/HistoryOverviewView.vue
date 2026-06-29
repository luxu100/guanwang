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

        <view class="filter-group">
          <text class="filter-label">渗漏状态</text>
          <picker :range="leakStatusOptions" range-key="label" @change="handleLeakStatusChange">
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
      </view>

      <view class="toolbar-row toolbar-row--bottom">
        <view class="toolbar-actions">
          <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="searchHistory">查询</button>
          <button class="toolbar-button" hover-class="toolbar-button--hover" @click="resetFilters">重置</button>
          <button class="toolbar-icon-button" hover-class="toolbar-icon-button--hover" aria-label="刷新" @click="fetchHistoryData">
            <text class="icon-refresh"></text>
          </button>
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

    <!-- 主内容区 -->
    <view class="main-layout">
      <!-- 左侧表格 -->
      <view class="table-panel">
        <view class="table-head">
          <text>{{ activeTabLabel }}历史</text>
          <text class="table-head__meta">共 {{ total }} 条</text>
        </view>

        <scroll-view class="table-scroll" scroll-x scroll-y>
          <view class="data-table">
            <!-- 渗漏记录列头 -->
            <view v-if="activeDataTab === 'leakage'" class="data-row data-row--header data-row--leakage">
              <text class="data-cell data-cell--index">序号</text>
              <text class="data-cell data-cell--time data-cell--sortable" @click.stop="toggleSort('detectedTime')">检出时间<text class="sort-arrow sort-arrow--active" v-if="sortField === 'detectedTime'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</text><text class="sort-arrow" v-else></text></text>
              <text class="data-cell data-cell--level data-cell--sortable" @click.stop="toggleSort('leakLevel')">渗漏级别<text class="sort-arrow sort-arrow--active" v-if="sortField === 'leakLevel'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</text><text class="sort-arrow" v-else></text></text>
              <text class="data-cell data-cell--address">漏点位置</text>
              <text class="data-cell data-cell--account">检出人</text>
              <text class="data-cell data-cell--material">管道材质</text>
              <text class="data-cell data-cell--remark">备注</text>
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
            </view>

            <!-- 算法分析列头 -->
            <view v-else-if="activeDataTab === 'algorithm'" class="data-row data-row--header data-row--algorithm">
              <text class="data-cell data-cell--index">序号</text>
              <text class="data-cell data-cell--time">音频时间</text>
              <text class="data-cell data-cell--device">设备编号</text>
              <text class="data-cell data-cell--signal">信号处理结果</text>
              <text class="data-cell data-cell--leakage">泄漏判定</text>
              <text class="data-cell data-cell--created">创建时间</text>
            </view>

            <!-- 采样记录列头 -->
            <view v-else class="data-row data-row--header data-row--sample">
              <text class="data-cell data-cell--index">序号</text>
              <text class="data-cell data-cell--time">采样时间</text>
              <text class="data-cell data-cell--device">设备编号</text>
              <text class="data-cell data-cell--status">渗漏标志位</text>
              <text class="data-cell data-cell--esa">特征值</text>
              <text class="data-cell data-cell--intensity">强度</text>
              <text class="data-cell data-cell--frequency">频率</text>
            </view>

            <view v-if="loading" class="table-state">加载中...</view>
            <view v-else-if="records.length === 0" class="table-state">暂无历史数据</view>

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
                <text class="data-cell data-cell--time">{{ formatDateTime(getFieldValue(item, "detectedTime")) }}</text>
                <text class="data-cell data-cell--level">
                  <text class="level-pill" :class="getLeakLevelClass(item)">{{ getLeakLevelLabel(item) }}</text>
                </text>
                <text class="data-cell data-cell--address">{{ getFieldValue(item, "leakAddress") || "-" }}</text>
                <text class="data-cell data-cell--account">{{ getFieldValue(item, "detectAccount") || "-" }}</text>
                <text class="data-cell data-cell--material">{{ getFieldValue(item, "tubeMaterial") || "-" }}</text>
                <text class="data-cell data-cell--remark">{{ getFieldValue(item, "remark") || "-" }}</text>
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
              </view>
            </view>

            <!-- 算法分析/采样记录行 -->
            <view v-else>
              <view
                v-for="(item, index) in records"
                :key="getRowKey(item, index)"
                :class="['data-row', activeDataTab === 'algorithm' ? 'data-row--algorithm' : 'data-row--sample', { 'data-row--active': selectedRecordKey === getRowKey(item, index) }]"
                @click="selectRecord(item, index)"
              >
                <text class="data-cell data-cell--index">{{ (pagination.pageNum - 1) * pagination.pageSize + index + 1 }}</text>
                <text class="data-cell data-cell--time">{{ formatDateTime(activeDataTab === 'algorithm' ? getFieldValue(item, "audioTime") : getFieldValue(item, "createdAt")) }}</text>
                <text class="data-cell data-cell--device">{{ getFieldValue(item, "deviceNumber") || "-" }}</text>
                <template v-if="activeDataTab === 'algorithm'">
                  <text class="data-cell data-cell--signal">{{ getFieldValue(item, "signalprocessingResult") || "-" }}</text>
                  <text class="data-cell data-cell--leakage">
                    <text class="status-tag" :class="getLeakStatusTagClass(item)">
                      {{ getFieldValue(item, "signalprocessingResult2") || "-" }}
                    </text>
                  </text>
                  <text class="data-cell data-cell--created">{{ formatDateTime(getFieldValue(item, "createdAt")) }}</text>
                </template>
                <template v-else>
                  <text class="data-cell data-cell--status">
                    <text class="status-tag" :class="getLeakStatusTagClass(item)">{{ getLeakStatusLabel(item) }}</text>
                  </text>
                  <text class="data-cell data-cell--esa">{{ getFieldValue(item, "leakEsa") ?? "-" }}</text>
                  <text class="data-cell data-cell--intensity">{{ getFieldValue(item, "leakIntensity") ?? "-" }}</text>
                  <text class="data-cell data-cell--frequency">{{ getFieldValue(item, "leakFrequency") ?? "-" }}</text>
                </template>
              </view>
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
  getLeakageHistoryPage,
  getLeakageHistoryDetail,
  getDeviceStatusUploadPage,
  getDeviceStatusUploadDetail,
  getAlgorithmResultHistoryPage,
  getAlgorithmResultHistoryDetail,
  getSamplingRecordHistoryPage,
  getSamplingRecordHistoryDetail,
} from "@/services/leak-report/history-overview";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";

type HistoryRecord = Record<string, unknown>;
type DataTab = "leakage" | "deviceUpload" | "algorithm" | "sampling";

interface ApiResponseLike {
  code?: number;
  data?: unknown;
  records?: unknown[];
  rows?: unknown[];
  total?: number;
  msg?: string;
}

const historyTabs: Array<{ label: string; value: DataTab }> = [
  { label: "渗漏记录", value: "leakage" },
  { label: "设备上报", value: "deviceUpload" },
  { label: "算法分析", value: "algorithm" },
  { label: "采样记录", value: "sampling" },
];

const leakStatusOptions: Array<{ label: string; value: number | "" }> = [
  { label: "不限", value: "" },
  { label: "渗漏", value: 0 },
  { label: "正常", value: 1 },
  { label: "疑似", value: 2 },
];

const tabLabelMap: Record<DataTab, string> = {
  leakage: "渗漏记录",
  deviceUpload: "设备上报",
  algorithm: "算法分析",
  sampling: "采样记录",
};

const sortField = ref("createdAt");
const sortOrder = ref("desc");

const filters = reactive({
  startTime: "",
  endTime: "",
  leakStatus: "" as number | "",
  deviceNumber: "",
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

const currentLeakStatusLabel = computed(() =>
  leakStatusOptions.find((o) => o.value === filters.leakStatus)?.label || "不限",
);
const activeTabLabel = computed(() => tabLabelMap[activeDataTab.value]);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pagination.pageSize)));

const currentDetailFields = computed(() => {
  const r = selectedRecord.value || {};
  if (activeDataTab.value === "leakage") {
    return getDetailFieldsForTab(r, [
      { label: "ID", key: "id" },
      { label: "检出时间", key: "detectedTime", format: true },
      { label: "渗漏级别", key: "leakLevel", as: getLeakLevelLabel(r) },
      { label: "漏点位置", key: "leakAddress" },
      { label: "渗漏坐标", key: "leakCoordinate" },
      { label: "泄漏部位", key: "leakPart" },
      { label: "管道材质", key: "tubeMaterial" },
      { label: "管道口径", key: "tubeBore" },
      { label: "管道埋深", key: "tubeDepth" },
      { label: "检出人", key: "detectAccount" },
      { label: "最近设备距离", key: "closestDeviceDistance" },
      { label: "关联设备", key: "referenceDevices" },
      { label: "关联工单ID", key: "referenceWorksheetId" },
      { label: "关联音频", key: "referenceAudio" },
      { label: "备注", key: "remark" },
      { label: "创建时间", key: "createdAt", format: true },
      { label: "更新时间", key: "updatedAt", format: true },
    ]);
  }
  if (activeDataTab.value === "deviceUpload") {
    return getDetailFieldsForTab(r, [
      { label: "ID", key: "id" },
      { label: "设备ID", key: "deviceId" },
      { label: "设备编号", key: "deviceNumber" },
      { label: "固件版本", key: "firmwareVersion" },
      { label: "硬件版本", key: "hardwareVersion" },
      { label: "工作模式", key: "workMode" },
      { label: "电池电压", key: "batteryVoltage" },
      { label: "终端温度", key: "deviceTemperature" },
      { label: "信号强度", key: "signalIntensity" },
      { label: "信号质量", key: "signalQuality" },
      { label: "渗漏标志位", key: "leakStatus", as: getLeakStatusLabel(r) },
      { label: "特征值", key: "leakEsa" },
      { label: "强度", key: "leakIntensity" },
      { label: "频率", key: "leakFrequency" },
      { label: "经纬度", key: "coordinateLocation" },
      { label: "上报时间", key: "uploadTime", format: true },
    ]);
  }
  if (activeDataTab.value === "algorithm") {
    return getDetailFieldsForTab(r, [
      { label: "ID", key: "id" },
      { label: "设备ID", key: "deviceId" },
      { label: "设备编号", key: "deviceNumber" },
      { label: "采样记录ID", key: "samplingId" },
      { label: "音频文件ID", key: "audioFileId" },
      { label: "音频时间", key: "audioTime", format: true },
      { label: "信号处理结果", key: "signalprocessingResult" },
      { label: "噪音计结果", key: "signalprocessingResult1" },
      { label: "泄漏判定", key: "signalprocessingResult2" },
      { label: "浙大算法结果", key: "signalprocessingResult3" },
      { label: "创建时间", key: "createdAt", format: true },
    ]);
  }
  return getDetailFieldsForTab(r, [
    { label: "ID", key: "id" },
    { label: "设备ID", key: "deviceId" },
    { label: "设备编号", key: "deviceNumber" },
    { label: "渗漏标志位", key: "leakStatus", as: getLeakStatusLabel(r) },
    { label: "特征值", key: "leakEsa" },
    { label: "强度", key: "leakIntensity" },
    { label: "频率", key: "leakFrequency" },
    { label: "压力", key: "pressure" },
    { label: "创建时间", key: "createdAt", format: true },
  ]);
});

onMounted(() => {
  fetchHistoryData();
});

function handleLeakStatusChange(event: { detail: { value: number } }) {
  filters.leakStatus = leakStatusOptions[event.detail.value]?.value ?? "";
}

function switchDataTab(tab: DataTab) {
  activeDataTab.value = tab;
  pagination.pageNum = 1;
  selectedRecord.value = null;
  selectedRecordKey.value = "";
  fetchHistoryData();
}

function getDetailFieldsForTab(r: HistoryRecord, fields: Array<{ label: string; key: string; format?: boolean; as?: string }>) {
  return fields.map((f) => ({
    label: f.label,
    value: f.as ?? (f.format ? formatDateTime(getFieldValue(r, f.key)) : String(getFieldValue(r, f.key) ?? "-")),
  }));
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
  const defaultSortField = activeDataTab.value === "algorithm" ? "createdAt" : activeDataTab.value === "deviceUpload" ? "uploadTime" : "createdAt";
  const baseParams = removeEmptyFields({
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    startTime: normalizeDateForApi(filters.startTime, false),
    endTime: normalizeDateForApi(filters.endTime, true),
    sortOrder: sortOrder.value || "desc",
    sortField: sortField.value || defaultSortField,
  });

  if (filters.leakStatus !== "") {
    (baseParams as Record<string, unknown>).leakStatus = filters.leakStatus;
  }
  if (activeDataTab.value !== "leakage" && filters.deviceNumber.trim()) {
    (baseParams as Record<string, unknown>).deviceNumber = filters.deviceNumber.trim();
  }

  return baseParams;
}

function getApiFunction() {
  const apiMap: Record<DataTab, { page: typeof getLeakageHistoryPage; detail: typeof getLeakageHistoryDetail }> = {
    leakage: { page: getLeakageHistoryPage, detail: getLeakageHistoryDetail },
    deviceUpload: { page: getDeviceStatusUploadPage, detail: getDeviceStatusUploadDetail },
    algorithm: { page: getAlgorithmResultHistoryPage, detail: getAlgorithmResultHistoryDetail },
    sampling: { page: getSamplingRecordHistoryPage, detail: getSamplingRecordHistoryDetail },
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
    records.value = applyLocalSort(parsed.records);
    total.value = parsed.total;
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

function resetFilters() {
  filters.startTime = "";
  filters.endTime = "";
  filters.leakStatus = "";
  filters.deviceNumber = "";
  searchHistory();
}

function changePage(step: number) {
  const nextPage = pagination.pageNum + step;
  if (nextPage < 1 || nextPage > totalPages.value) return;
  pagination.pageNum = nextPage;
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
        selectedRecord.value = { ...item, ...detailData };
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

function getLeakLevelLabel(item: HistoryRecord) {
  const val = Number(getFieldValue(item, "leakLevel"));
  if (val === 0) return "轻度";
  if (val === 1) return "中度";
  if (val === 2) return "重度";
  return "未知";
}

function getLeakLevelClass(item: HistoryRecord) {
  const val = Number(getFieldValue(item, "leakLevel"));
  if (val === 0) return "level-pill--light";
  if (val === 1) return "level-pill--medium";
  if (val === 2) return "level-pill--heavy";
  return "";
}

function getLeakStatusLabel(item: HistoryRecord) {
  const val = Number(getFieldValue(item, "leakStatus"));
  if (val === 0) return "渗漏";
  if (val === 1) return "正常";
  if (val === 2) return "疑似";
  if (val === 3) return "未抄";
  if (val === 4) return "无数据";
  return "未知";
}

function getLeakStatusTagClass(item: HistoryRecord) {
  const val = Number(getFieldValue(item, "leakStatus"));
  if (val === 0) return "status-tag--leak";
  if (val === 1) return "status-tag--normal";
  if (val === 2) return "status-tag--suspect";
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

function applyLocalSort(list: HistoryRecord[]): HistoryRecord[] {
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
  padding: 14px 14px 10px;
  margin-bottom: 10px;
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
  min-width: 100px;
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

.toolbar-button--hover { opacity: 0.85; }
.toolbar-button:disabled { opacity: 0.45; cursor: not-allowed; }

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

.toolbar-icon-button--hover { background: #edf5ff; }

.icon-refresh {
  display: block;
  width: 18px;
  height: 18px;
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
  color: #0d82ee;
  border-bottom-color: #0d82ee;
  background: #f7faff;
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
  background: #ffffff;
}

.data-table {
  display: flex;
  flex-direction: column;
  width: 1880px;
  min-width: 1880px;
  background: #ffffff;
}

.data-row {
  display: grid;
  grid-template-columns: 58px 340px 180px 360px 220px 300px 422px;
  min-height: 42px;
  width: 1880px;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
  transition: background 0.18s ease, box-shadow 0.18s ease;
}
.data-row--deviceUpload {
  grid-template-columns: 58px 340px 260px 220px 200px 350px 452px;
}
.data-row--algorithm {
  grid-template-columns: 58px 320px 260px 360px 220px 662px;
}
.data-row--sample {
  grid-template-columns: 58px 340px 260px 220px 200px 350px 452px;
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
  text-overflow: ellipsis;
  white-space: nowrap;
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
.data-cell--address { justify-content: flex-start; text-align: left; }
.data-cell--remark { justify-content: flex-start; text-align: left; }
.data-cell--device { color: #0f4c81; font-family: "DIN Alternate", "Arial", sans-serif; font-weight: 800; }

.data-cell--sortable { cursor: pointer; user-select: none; }
.data-cell--sortable:hover { color: #0d82ee; }

.sort-arrow { flex: none; font-size: 10px; line-height: 1; margin-left: 2px; color: #bcc7d6; transition: color 0.18s ease; &--active { color: #0d82ee; } }
.data-cell--sortable:hover .sort-arrow:not(.sort-arrow--active) { color: #7f8fa3; }

.level-pill {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 10px;
}

.level-pill--light { color: #16a34a; background: #dcfce7; }
.level-pill--medium { color: #d97706; background: #fef3c7; }
.level-pill--heavy { color: #dc2626; background: #fee2e2; }

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 10px;
  color: #64748b;
  background: #f1f5f9;
}

.status-tag--leak { color: #dc2626; background: #fee2e2; }
.status-tag--normal { color: #16a34a; background: #dcfce7; }
.status-tag--suspect { color: #d97706; background: #fef3c7; }
.status-tag--unknown { color: #64748b; background: #f1f5f9; }

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
}
</style>
