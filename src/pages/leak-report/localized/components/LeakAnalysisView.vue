<template>
  <view class="leak-analysis-view">
    <!-- 筛选栏 -->
    <view class="toolbar">
      <view class="toolbar-row toolbar-row--filters">
        <view class="filter-group">
          <text class="filter-label">{{ t('time.timeRange') }}</text>
          <view class="date-range">
            <WorkOrderDatetimePicker v-model="filters.startTime" class="filter-datetime" :title="t('time.pleaseSelectStartTime')" :placeholder="t('time.pleaseSelectStartTime')" />
            <text class="filter-separator">{{ t('time.to') }}</text>
            <WorkOrderDatetimePicker v-model="filters.endTime" class="filter-datetime" :title="t('time.pleaseSelectEndTime')" :placeholder="t('time.pleaseSelectEndTime')" />
          </view>
        </view>

        <view class="filter-group">
          <text class="filter-label">{{ t('filter.deviceNumber') }}</text>
          <input v-model="filters.deviceNumber" class="filter-input" :placeholder="t('filter.pleaseInputDeviceNumber')" placeholder-class="input-placeholder" />
        </view>

        <!-- 算法状态 -->
        <view class="filter-group">
          <text class="filter-label">{{ t('filter.algorithmStatus') }}</text>
          <picker :range="algorithmStatusOptions" range-key="label" @change="handleAlgorithmStatusChange">
            <view class="filter-select">
              <text>{{ currentAlgorithmStatusLabel }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="toolbar-actions toolbar-actions--right">
          <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="searchAnalysis">{{ t('common.search') }}</button>
          <button class="toolbar-button" hover-class="toolbar-button--hover" @click="resetFilters">{{ t('common.reset') }}</button>
          <button class="toolbar-icon-button" hover-class="toolbar-icon-button--hover" :aria-label="t('common.refresh')" @click="fetchAnalysisData">
            <text class="icon-refresh"></text>
          </button>
          <view class="export-dropdown">
            <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="exportMenuVisible = !exportMenuVisible">{{ t('common.export') }}</button>
            <view v-if="exportMenuVisible" class="export-menu">
              <view class="export-menu__item" @click="handleExport('current')">{{ t('common.exportCurrentPage') }}</view>
              <view class="export-menu__item" @click="handleExport('all')">{{ t('common.exportAll') }}</view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 主内容区 -->
    <LeakTableView
      :title="t('leakAnalysis.title')"
      :total="total"
      :page-num="pagination.pageNum"
      :page-size="pagination.pageSize"
      :total-pages="totalPages"
      :has-detail="!!selectedRecord"
      :detail-empty-text="t('leakAnalysis.detailEmpty')"
      @prev-page="changePage(-1)"
      @next-page="changePage(1)"
      @jump-page="jumpToPage"
      @page-size-change="handlePageSizeChange"
    >
      <view class="data-table" :style="{ minWidth: tableMinWidth }">
        <!-- 算法分析列头 -->
        <view class="data-row data-row--header data-row--algorithm" :style="{ gridTemplateColumns: tableGridTemplateColumns, minWidth: tableMinWidth }">
          <text class="data-cell data-cell--index">{{ t('table.index') }}</text>
          <text class="data-cell data-cell--device">{{ t('table.deviceNumber') }}</text>
          <text class="data-cell data-cell--time">{{ t('table.audioTime') }}</text>
          <text class="data-cell data-cell--audio-id">{{ t('table.audioFileId') }}</text>
          <text class="data-cell data-cell--process-result">{{ t('table.signalprocessingResult') }}</text>
          <text class="data-cell data-cell--status">{{ t('table.algorithmStatus') }}</text>
          <text class="data-cell data-cell--error">{{ t('table.algorithmError') }}</text>
        </view>

        <view v-if="loading" class="table-state table-state--loading"><view class="state-spinner"></view><text class="state-text">{{ t('common.loading') }}</text></view>
        <view v-else-if="records.length === 0" class="table-state table-state--empty"><view class="state-icon-empty"></view><text class="state-text">{{ t('leakAnalysis.noAnalysisData') }}</text></view>

        <!-- 算法分析行 -->
        <view
          v-for="(item, index) in records"
          v-else
          :key="getRowKey(item, index)"
          :class="['data-row', 'data-row--algorithm', { 'data-row--active': selectedRecordKey === getRowKey(item, index) }]"
          :style="{ gridTemplateColumns: tableGridTemplateColumns, minWidth: tableMinWidth }"
          @click="selectRecord(item, index)"
        >
          <text class="data-cell data-cell--index">{{ (pagination.pageNum - 1) * pagination.pageSize + index + 1 }}</text>
          <text class="data-cell data-cell--device">{{ displayValue(getFieldValue(item, "deviceNumber")) }}</text>
          <text class="data-cell data-cell--time">{{ formatDateTime(getFieldValue(item, "audioTime")) }}</text>
          <text class="data-cell data-cell--audio-id">{{ displayValue(getFieldValue(item, "audioFileId")) }}</text>
          <text class="data-cell data-cell--process-result" :title="getFieldValue(item, 'signalprocessingResult')">{{ displayValue(getFieldValue(item, "signalprocessingResult")) }}</text>
          <text class="data-cell data-cell--status"><text v-if="getFieldValue(item, 'algorithmStatus')" class="status-tag" :class="getAlgorithmStatusTagClass(item)">{{ getAlgorithmStatusLabel(item) }}</text><text v-else>-</text></text>
          <text class="data-cell data-cell--error" :title="getFieldValue(item, 'algorithmError')">{{ displayValue(getFieldValue(item, "algorithmError")) }}</text>
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

          <view v-if="activeDetailTab === 'base'" class="detail-section">
            <view class="detail-summary">
              <view class="detail-summary__main">
                <text class="detail-summary__label">{{ t('detail.fields.deviceNumber') }}</text>
                <text class="detail-summary__value">{{ displayValue(getFieldValue(selectedRecord, 'deviceNumber')) }}</text>
              </view>
              <view class="detail-summary__meta">
                <view v-for="item in baseDetailFields" :key="item.label" class="detail-summary__meta-item">
                  <text class="detail-summary__meta-label">{{ item.label }}</text>
                  <text class="detail-summary__meta-value">{{ item.value }}</text>
                </view>
              </view>
            </view>
            <view class="time-section">
              <text class="detail-section-title">{{ t('leakAnalysis.timeInfo') }}</text>
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
            <view v-if="selectedRecord" class="time-section">
              <view class="detail-audio-header">
                <text class="detail-section-title">{{ t('leakAnalysis.relatedAudio') }}</text>
                <button v-if="audioList.length > 0" class="audio-refresh-btn" hover-class="audio-refresh-btn--hover" @click="loadAudioList">{{ t('leakAnalysis.refreshAudio') }}</button>
              </view>
              <view v-if="audioLoading" class="audio-state">{{ t('leakAnalysis.audioLoading') }}</view>
              <view v-else-if="audioList.length === 0" class="audio-state">{{ t('leakAnalysis.noRelatedAudio') }}</view>
              <view v-else class="audio-list">
                <view v-for="(audio, ai) in visibleAudioList" :key="ai" class="audio-item">
                  <view class="audio-item__info">
                    <text class="audio-item__time">{{ formatDateTime(getFieldValue(audio, "audioTime")) }}</text>
                    <text class="audio-item__rate">{{ t('leakAnalysis.samplingRate') }}: {{ displayValue(getFieldValue(audio, "samplingRate")) }}</text>
                  </view>
                  <view class="audio-item__actions">
                    <button class="audio-play-btn" hover-class="audio-play-btn--hover" @click="toggleAudioPlay(audio, ai)">{{ playingAudioIndex === ai ? t('table.audioPause') : t('table.audioPlay') }}</button>
                    <a :href="getAudioWavUrl(audio, true)" class="audio-download-link">{{ t('table.audioDownload') }}</a>
                  </view>
                  <!-- 当前选中音频（播放或暂停）时显示可拖动进度条 -->
                  <view v-if="activeAudioIndex === ai" class="audio-item__progress">
                    <text class="audio-item__time-text">{{ formatAudioTime(audioCurrentTime) }}</text>
                    <view class="audio-item__seek-bar">
                      <view class="audio-item__seek-filled" :style="{ width: audioProgress + '%' }"></view>
                      <view class="audio-item__seek-thumb" :style="{ left: audioProgress + '%' }"></view>
                    </view>
                    <text class="audio-item__time-text">{{ formatAudioTime(audioDuration) }}</text>
                  </view>
                </view>
                <view v-if="audioList.length > AUDIO_COLLAPSED_LIMIT" class="audio-toggle" @click="audioListExpanded = !audioListExpanded">
                  <text class="audio-toggle__text">{{ audioListExpanded ? t('leakAnalysis.collapse') : t('leakAnalysis.expandAll', { count: audioList.length }) }}</text>
                  <text class="audio-toggle__arrow" :class="{ 'audio-toggle__arrow--up': audioListExpanded }"></text>
                </view>
              </view>
            </view>
            <view v-if="locationDetailFields.length > 0" class="time-section time-section--location">
              <text class="detail-section-title">{{ t('leakAnalysis.locationInfo') }}</text>
              <view v-for="item in locationDetailFields" :key="item.label" class="location-row">
                <text class="location-row__label">{{ item.label }}</text>
                <text class="location-row__value">{{ item.value }}</text>
              </view>
            </view>
          </view>
        </view>
      </template>
    </LeakTableView>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, onUnmounted } from "vue";
import {
  getAlgorithmAnalysisPage,
  getAlgorithmAnalysisDetail,
} from "@/services/leak-report/leak-analysis";
import { getAudioDataPage } from "@/services/data-analysis/audio";
import WorkOrderDatetimePicker from "@/pages/work-order/localized/components/WorkOrderDatetimePicker.vue";
import LeakTableView from "@/pages/leak-report/localized/components/LeakTableView.vue";
import { createScopedT, useI18n } from "@/i18n";
import { ALGORITHM_STATUS } from "@/pages/leak-report/constants/status";

const t = createScopedT("leakReport");
const { locale } = useI18n();

/**
 * 表格列宽动态配置
 *
 * 英文文本普遍比中文长（如 "Algorithm Processing Result" 27字符 vs "算法处理结果" 6字符），
 * 若共用一套列宽会导致英文表头被截断。因此根据当前 locale 返回不同配置：
 * - zh-CN：以中文表头长度为基准，min-width 820px
 * - en-US：以英文表头长度为基准，min-width 903px（关键列加宽）
 *
 * 每列 minmax 的最小值基于英文表头字符数 × 6.5px + 24px padding 计算，确保完整展示。
 */
const tableGridTemplateColumns = computed<string>(() => {
  if (locale.value === "en-US") {
    return "58px minmax(110px, 2.0fr) minmax(170px, 3.0fr) minmax(115px, 1.8fr) minmax(200px, 3.0fr) minmax(130px, 1.6fr) minmax(120px, 2.2fr)";
  }
  return "58px minmax(110px, 2.2fr) minmax(160px, 3fr) minmax(100px, 1.8fr) minmax(140px, 2.4fr) minmax(96px, 1.6fr) minmax(140px, 2.4fr)";
});

const tableMinWidth = computed<string>(() => (locale.value === "en-US" ? "903px" : "820px"));

function getBaseUrl(): string {
  return (import.meta as unknown as { env: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL || "";
}

type AnalysisRecord = Record<string, unknown>;
type DetailTab = "base" | "detail" | "pipe" | "attach";

interface ApiResponseLike {
  code?: number;
  data?: unknown;
  records?: unknown[];
  rows?: unknown[];
  total?: number;
  msg?: string;
}

const algorithmStatusOptions = computed<Array<{ label: string; value: string }>>(() => [
  { label: t("status.statusUnlimited"), value: "" },
  { label: t("status.pending"), value: ALGORITHM_STATUS.PENDING },
  { label: t("status.success"), value: ALGORITHM_STATUS.SUCCESS },
  { label: t("status.failed"), value: ALGORITHM_STATUS.FAILED },
  { label: t("status.skipped"), value: ALGORITHM_STATUS.SKIPPED },
]);

const detailTabs = computed<Array<{ label: string; value: DetailTab }>>(() => [
  { label: t("leakAnalysis.baseInfo"), value: "base" },
]);

const sortField = ref("createdAt");
const sortOrder = ref("desc");

const filters = reactive({
  startTime: "",
  endTime: "",
  deviceNumber: "",
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
const activeDetailTab = ref<DetailTab>("base");
const exportMenuVisible = ref(false);
const audioList = ref<Record<string, unknown>[]>([]);
const audioLoading = ref(false);
const playingAudioIndex = ref(-1);
const activeAudioIndex = ref(-1);
let audioPlayerInstance: HTMLAudioElement | null = null;
const audioDuration = ref(0);
const audioCurrentTime = ref(0);

const audioProgress = computed(() => {
  if (!audioDuration.value) return 0;
  return Math.min(100, (audioCurrentTime.value / audioDuration.value) * 100);
});

let detailRequestId = 0;
let fetchRequestId = 0;

const AUDIO_COLLAPSED_LIMIT = 3;
const audioListExpanded = ref(false);
const visibleAudioList = computed(() => {
  if (audioListExpanded.value) return audioList.value;
  return audioList.value.slice(0, AUDIO_COLLAPSED_LIMIT);
});

const currentAlgorithmStatusLabel = computed(() =>
  algorithmStatusOptions.value.find((o) => o.value === filters.algorithmStatus)?.label || t("status.statusUnlimited"),
);

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pagination.pageSize)));

const baseDetailFields = computed(() => {
  const r = selectedRecord.value || {};
  return [
    { label: t("leakAnalysis.id"), value: String(getFieldValue(r, "id") ?? "-") },
    { label: t("leakAnalysis.deviceId"), value: String(getFieldValue(r, "deviceId") ?? "-") },
    { label: t("detail.fields.deviceNumber"), value: displayValue(getFieldValue(r, "deviceNumber")) },
    { label: t("leakAnalysis.samplingId"), value: String(getFieldValue(r, "samplingId") ?? "-") },
    { label: t("detail.fields.audioFileId"), value: String(getFieldValue(r, "audioFileId") ?? "-") },
    { label: t("detail.fields.algorithmStatus"), value: getAlgorithmStatusLabel(r) },
    { label: t("detail.fields.signalprocessingResult"), value: displayValue(getFieldValue(r, "signalprocessingResult")) },
    { label: t("detail.fields.algorithmError"), value: displayValue(getFieldValue(r, "algorithmError")) },
  ];
});

const timeDetailFields = computed(() => {
  const r = selectedRecord.value || {};
  return [
    { label: t("detail.fields.audioTime"), value: formatDateTime(getFieldValue(r, "audioTime") || "-") },
    { label: t("detail.fields.createdAt"), value: formatDateTime(getFieldValue(r, "createdAt") || "-") },
  ];
});

const locationDetailFields = computed<Array<{ label: string; value: string }>>(() => {
  return [];
});

onMounted(() => {
  fetchAnalysisData();
  // #ifdef H5
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("touchmove", handleDocumentTouchMove, { passive: false });
  // #endif
});

onUnmounted(() => {
  // #ifdef H5
  document.removeEventListener("click", handleDocumentClick);
  document.removeEventListener("touchmove", handleDocumentTouchMove);
  // #endif
  if (audioPlayerInstance) { audioPlayerInstance.pause(); audioPlayerInstance.src = ""; audioPlayerInstance = null; }
});

function handleAlgorithmStatusChange(event: { detail: { value: number } }) {
  filters.algorithmStatus = algorithmStatusOptions.value[event.detail.value]?.value ?? "";
  searchAnalysis();
}

function toggleSort(field: string) {
  if (sortField.value === field) {
    if (sortOrder.value === "asc") { sortOrder.value = "desc"; }
    else if (sortOrder.value === "desc") { sortField.value = ""; sortOrder.value = ""; }
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
    sortField: sortField.value || "createdAt",
  });

  if (filters.deviceNumber.trim()) {
    (baseParams as Record<string, unknown>).deviceNumber = filters.deviceNumber.trim();
  }
  // 算法状态筛选
  if (filters.algorithmStatus !== "") (baseParams as Record<string, unknown>).algorithmStatus = filters.algorithmStatus;

  return baseParams;
}

async function fetchAnalysisData() {
  const reqId = ++fetchRequestId;
  loading.value = true;
  try {
    const response = (await getAlgorithmAnalysisPage(buildQueryParams())) as ApiResponseLike;
    if (reqId !== fetchRequestId) return;
    assertSuccessResponse(response);
    const parsed = parsePageResponse(response);
    if (parsed.pageNum && parsed.pageNum !== pagination.pageNum) pagination.pageNum = parsed.pageNum;
    if (parsed.pageSize && parsed.pageSize !== pagination.pageSize) pagination.pageSize = parsed.pageSize;
    records.value = applyLocalSort(parsed.records);
    total.value = parsed.total;
    selectFirstRow();
  } catch (error) {
    if (reqId !== fetchRequestId) return;
    records.value = [];
    total.value = 0;
    selectedRecord.value = null;
    selectedRecordKey.value = "";
    uni.showToast({ title: (error as { msg?: string })?.msg || t("leakAnalysis.loadFailed", "分析数据加载失败"), icon: "none" });
  } finally {
    if (reqId === fetchRequestId) loading.value = false;
  }
}

function searchAnalysis() {
  pagination.pageNum = 1;
  fetchAnalysisData();
}

function escapeCsvCell(value: unknown): string {
  if (value === undefined || value === null) return "";
  const text = String(value).replace(/"/g, '""');
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

// 已知技术债：导出全部使用 pageSize:99999 一次性拉取，后端限制最大 pageSize 或数据量超过 10 万时导出会静默不全。后续应改为循环分页拉取。
async function handleExport(scope: "current" | "all") {
  exportMenuVisible.value = false;
  let exportRecords = records.value;
  if (scope === "all") {
    try {
      const params = { ...buildQueryParams(), pageNum: 1, pageSize: 99999 };
      const response = (await getAlgorithmAnalysisPage(params)) as ApiResponseLike;
      assertSuccessResponse(response);
      const parsed = parsePageResponse(response);
      exportRecords = parsed.records;
    } catch {
      uni.showToast({ title: t("leakAnalysis.fetchAllFailed", "获取全部数据失败"), icon: "none" });
      return;
    }
  }
  if (!exportRecords.length) {
    uni.showToast({ title: t("common.noDataToExport"), icon: "none" });
    return;
  }
  // #ifdef H5
  const headers = [
    t("table.index"),
    t("table.deviceNumber"),
    t("table.audioTime"),
    t("table.audioFileId"),
    t("table.signalprocessingResult"),
    t("table.algorithmStatus"),
    t("table.algorithmError"),
  ];
  const rows = exportRecords.map((r, idx) => {
    const keys = ["deviceNumber", "audioTime", "audioFileId", "signalprocessingResult", "algorithmStatus", "algorithmError"];
    return [String(idx + 1), ...keys.map((k) => {
      if (k === "audioTime") return escapeCsvCell(formatDateTime(getFieldValue(r, k)));
      return escapeCsvCell(getFieldValue(r, k));
    })];
  });
  const csv = [headers.join(","), ...rows.map((row) => row.map((c) => `"${c}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${t("leakAnalysis.exportFileName", "算法分析数据")}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  uni.showToast({ title: t("common.exportSuccess"), icon: "success" });
  // #endif
  // #ifndef H5
  uni.showToast({ title: t("common.exportH5Only"), icon: "none" });
  // #endif
}

function resetFilters() {
  filters.startTime = "";
  filters.endTime = "";
  filters.deviceNumber = "";
  filters.algorithmStatus = "";
  searchAnalysis();
}

function changePage(step: number) {
  const nextPage = pagination.pageNum + step;
  if (nextPage < 1 || nextPage > totalPages.value) return;
  pagination.pageNum = nextPage;
  fetchAnalysisData();
}

function jumpToPage(p: number) {
  if (p < 1 || p > totalPages.value) return;
  pagination.pageNum = p;
  fetchAnalysisData();
}

function handlePageSizeChange(size: number) {
  pagination.pageSize = size;
  pagination.pageNum = 1;
  fetchAnalysisData();
}

function selectFirstRow() {
  detailRequestId++; // 使之前未完成的详情请求失效
  if (records.value.length === 0) {
    selectedRecord.value = null;
    selectedRecordKey.value = "";
    audioList.value = [];
    return;
  }
  const first = records.value[0];
  selectedRecord.value = first;
  selectedRecordKey.value = getRowKey(first, 0);
  activeDetailTab.value = "base";
  loadAudioList();
}

function selectRecord(item: AnalysisRecord, index: number) {
  selectedRecord.value = item;
  selectedRecordKey.value = getRowKey(item, index);
  activeDetailTab.value = "base";
  loadAudioList();

  const reqId = ++detailRequestId;
  const id = getRowId(item);
  if (!id) return;

  getAlgorithmAnalysisDetail(id)
    .then((response: unknown) => {
      if (reqId !== detailRequestId) return; // 竞态保护：丢弃过期请求
      assertSuccessResponse(response as ApiResponseLike);
      const detailData = (response as ApiResponseLike)?.data;
      if (isObject(detailData)) {
        const cleanDetail = Object.fromEntries(Object.entries(detailData as Record<string, unknown>).filter(([, v]) => v !== null && v !== undefined));
        selectedRecord.value = { ...item, ...cleanDetail };
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
  if (!deviceNumber) { audioList.value = []; audioListExpanded.value = false; return; }
  audioLoading.value = true;
  try {
    const res = await getAudioDataPage({ pageNum: 1, pageSize: 10, deviceNumber }) as unknown as ApiResponseLike;
    const p = parsePageResponse(res);
    audioList.value = (p.records || []) as Record<string, unknown>[];
  } catch { audioList.value = []; }
  finally { audioLoading.value = false; audioListExpanded.value = false; }
}

function toggleAudioPlay(audio: Record<string, unknown>, index: number) {
  // #ifdef H5
  // 同一个音频：切换播放/暂停（暂停时进度条保持显示）
  if (activeAudioIndex.value === index) {
    if (playingAudioIndex.value === index) {
      audioPlayerInstance?.pause();
      playingAudioIndex.value = -1;
    } else {
      audioPlayerInstance?.play();
      playingAudioIndex.value = index;
    }
    return;
  }
  // 切换到新音频
  audioPlayerInstance?.pause();
  audioPlayerInstance = new Audio(getAudioWavUrl(audio));
  audioDuration.value = 0;
  audioCurrentTime.value = 0;
  audioPlayerInstance.addEventListener("loadedmetadata", () => {
    if (isFinite(audioPlayerInstance!.duration) && audioPlayerInstance!.duration > 0) {
      audioDuration.value = audioPlayerInstance!.duration;
    }
  });
  audioPlayerInstance.addEventListener("durationchange", () => {
    if (isFinite(audioPlayerInstance!.duration) && audioPlayerInstance!.duration > 0) {
      audioDuration.value = audioPlayerInstance!.duration;
    }
  });
  audioPlayerInstance.addEventListener("timeupdate", () => {
    if (!audioPlayerInstance) return;
    if (isSeeking) {
      isSeeking = false;
      return;
    }
    audioCurrentTime.value = audioPlayerInstance.currentTime || 0;
    if (!audioDuration.value && isFinite(audioPlayerInstance.duration) && audioPlayerInstance.duration > 0) {
      audioDuration.value = audioPlayerInstance.duration;
    }
  });
  audioPlayerInstance.onended = () => {
    playingAudioIndex.value = -1;
    audioCurrentTime.value = 0;
  };
  audioPlayerInstance.play();
  activeAudioIndex.value = index;
  playingAudioIndex.value = index;
  // #endif
  // #ifndef H5
  uni.showToast({ title: t("leakAnalysis.audioH5Only"), icon: "none" });
  // #endif
}

// ===== 进度条拖动：使用 document 原生事件委托，绕过 uni-app 事件系统 =====
let isSeeking = false;

function doSeekAudio(clientX: number, bar: HTMLElement) {
  if (!audioPlayerInstance) return;
  // 优先用实例的 duration（更准确），兜底 audioDuration.value
  let duration = 0;
  if (isFinite(audioPlayerInstance.duration) && audioPlayerInstance.duration > 0) {
    duration = audioPlayerInstance.duration;
  } else if (isFinite(audioDuration.value) && audioDuration.value > 0) {
    duration = audioDuration.value;
  }
  if (!duration || !isFinite(duration)) return;
  const rect = bar.getBoundingClientRect();
  if (!rect.width) return;
  const x = clientX - rect.left;
  const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
  const time = (percent / 100) * duration;
  if (!isFinite(time) || time < 0) return;
  isSeeking = true;
  try { audioPlayerInstance.currentTime = time; } catch (_) { /* ignore */ }
  audioCurrentTime.value = time;
  audioDuration.value = duration;
}

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target) return;
  const seekBar = target.closest(".audio-item__seek-bar") as HTMLElement | null;
  if (seekBar) doSeekAudio(e.clientX, seekBar);
}

function handleDocumentTouchMove(e: TouchEvent) {
  const target = e.target as HTMLElement;
  if (!target) return;
  const seekBar = target.closest(".audio-item__seek-bar") as HTMLElement | null;
  if (seekBar && e.touches.length > 0) {
    doSeekAudio(e.touches[0].clientX, seekBar);
    e.preventDefault();
  }
}

function formatAudioTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// --- helpers ---

function getRowId(item: AnalysisRecord) {
  const v = getFieldValue(item, "id");
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
}

function getRowKey(item: AnalysisRecord, index: number) {
  return getRowId(item) || String(index);
}

function getFieldValue(item: AnalysisRecord | null, key: string): unknown {
  if (!item) return undefined;
  return Object.prototype.hasOwnProperty.call(item, key) ? item[key] : undefined;
}

/** 显示值：只把 null/undefined/空字符串显示为 '-'，保留合法的 0/false */
function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function getAlgorithmStatusLabel(item: AnalysisRecord) {
  const status = String(getFieldValue(item, "algorithmStatus") || "").toUpperCase();
  const map: Record<string, string> = {
    [ALGORITHM_STATUS.PENDING]: t("status.pending"),
    [ALGORITHM_STATUS.SUCCESS]: t("status.success"),
    [ALGORITHM_STATUS.FAILED]: t("status.failed"),
    [ALGORITHM_STATUS.SKIPPED]: t("status.skipped"),
  };
  return map[status] || status || "-";
}

function getAlgorithmStatusTagClass(item: AnalysisRecord) {
  const status = String(getFieldValue(item, "algorithmStatus") || "").toUpperCase();
  if (status === ALGORITHM_STATUS.SUCCESS) return "status-tag--success";
  if (status === ALGORITHM_STATUS.FAILED) return "status-tag--failed";
  if (status === ALGORITHM_STATUS.PENDING) return "status-tag--pending";
  if (status === ALGORITHM_STATUS.SKIPPED) return "status-tag--skipped";
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
    va = String(va ?? ""); vb = String(vb ?? "");
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
  throw { code, msg: response?.msg || t("common.requestError"), data: response?.data };
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
.detail-panel {
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
  width: 16px;
  height: 16px;
  border: 2px solid #7f8fa3;
  border-top-color: transparent;
  border-radius: 50%;
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
  width: 100%;
  min-width: 820px;
  background: #ffffff;
}

.data-row {
  display: grid;
  grid-template-columns: 58px minmax(110px, 2.2fr) minmax(160px, 3fr) minmax(100px, 1.8fr) minmax(140px, 2.4fr) minmax(96px, 1.6fr) minmax(140px, 2.4fr);
  min-height: 42px;
  width: 100%;
  min-width: 820px;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
  transition: background 0.18s ease, box-shadow 0.18s ease;
}

.data-row--algorithm {
  grid-template-columns: 58px minmax(110px, 2.2fr) minmax(160px, 3fr) minmax(100px, 1.8fr) minmax(140px, 2.4fr) minmax(96px, 1.6fr) minmax(140px, 2.4fr);
}


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

.data-row:not(.data-row--header):nth-child(odd) {
  background: #ffffff;
}

.data-row:not(.data-row--header):nth-child(even) {
  background: #fbfdff;
}

.data-row:not(.data-row--header):hover {
  background: #f1f8ff;
  box-shadow: inset 0 0 0 1px #d7ebfb;
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
.data-cell--device { color: #0f4c81; }
.data-cell--time { color: #0f4c81; }
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

.status-tag--pending {
  color: #d97706;
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.status-tag--success {
  color: #16a34a;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.status-tag--failed {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.status-tag--skipped {
  color: #6b7280;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.data-cell--error {
  color: #475569;
  text-align: center;
  justify-content: center;
}

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
.detail-audio-header { display: flex; align-items: center; justify-content: flex-start; gap: 2px; margin-bottom: 8px; }
.detail-audio-header .detail-section-title { margin-bottom: 0; }
.detail-audio-title { font-size: 13px; font-weight: 800; color: #415a73; }
.audio-refresh-btn { display: inline-flex; align-items: center; justify-content: center; min-width: 48px; height: 22px; margin: 0; padding: 0 8px; font-size: 12px; line-height: 1; color: #3b82f6; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; cursor: pointer; }
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
.audio-item__progress { display: flex; align-items: center; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #edf1f5; }
.audio-item__time-text { color: #64748b; font-size: 11px; font-weight: 700; font-family: monospace; min-width: 38px; text-align: center; flex-shrink: 0; }
.audio-item__seek-bar { position: relative; flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; cursor: pointer; }
.audio-item__seek-filled { position: absolute; top: 0; left: 0; height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb); border-radius: 3px; }
.audio-item__seek-thumb { position: absolute; top: 50%; width: 12px; height: 12px; background: #fff; border: 2px solid #3b82f6; border-radius: 50%; transform: translate(-50%, -50%); box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
.audio-toggle { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 6px; padding: 6px 10px; cursor: pointer; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 4px; transition: background 0.16s ease, border-color 0.16s ease; }
.audio-toggle:hover { background: #eff6ff; border-color: #93c5fd; }
.audio-toggle__text { font-size: 12px; font-weight: 700; color: #3b82f6; }
.audio-toggle__arrow { width: 0; height: 0; border-style: solid; border-width: 5px 4px 0 4px; border-color: #3b82f6 transparent transparent transparent; transition: transform 0.18s ease; }
.audio-toggle__arrow--up { transform: rotate(180deg); }
.detail-summary { display: flex; flex-direction: column; gap: 12px; padding: 14px 16px; margin-bottom: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 6px; box-shadow: 0 8px 18px rgba(33, 72, 108, 0.045); }
.detail-summary__main { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
.detail-summary__label { color: #475569; font-size: 12px; font-weight: 800; }
.detail-summary__value { color: #0f4c81; font-size: 17px; font-weight: 700; line-height: 1.25; word-break: normal; overflow-wrap: anywhere; }
.detail-summary__badges { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; margin-top: 6px; }
.detail-summary__badge { display: inline-block; min-width: 64px; height: 26px; line-height: 26px; text-align: center; padding: 0 10px; font-size: 12px; font-weight: 700; border-radius: 10px; background: #eff6ff; color: #3b82f6; }
.detail-summary__badge.level-pill--light { color: #22c55e; background: #f0fdf4; border: 1px solid #bbf7d0; }
.detail-summary__badge.level-pill--medium { color: #f59e0b; background: #fffbeb; border: 1px solid #fde68a; }
.detail-summary__badge.level-pill--heavy { color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; }
.detail-summary__badge.level-pill--suspect { color: #8c8c8c; background: #fafafa; border: 1px solid #d9d9d9; }
.detail-summary__meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding-top: 10px; border-top: 1px solid #edf3f8; margin-top: 10px; }
.detail-summary__meta-item { min-width: 0; padding: 8px 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e8eef5; }
.detail-summary__meta-label { display: block; color: #475569; font-size: 11px; font-weight: 800; }
.detail-summary__meta-value { display: block; margin-top: 4px; color: #0f172a; font-size: 14px; font-weight: 700; }
.detail-grid--content { grid-template-columns: 1fr; gap: 8px; overflow: visible; background: transparent; border: 0; border-radius: 0; box-shadow: none; }
.detail-grid--content .detail-item { display: grid; grid-template-columns: 86px minmax(0, 1fr); align-items: stretch; min-height: 0; padding: 0; overflow: hidden; background: #ffffff; border: 1px solid #dfebf5; border-radius: 6px; box-shadow: 0 8px 18px rgba(33, 72, 108, 0.055); }
.detail-grid--content .detail-item__label { display: flex; align-items: center; padding: 0 12px; color: #5f7891; font-size: 12px; font-weight: 800; background: #f7fafc; border-left: 3px solid #b9dcff; }
.detail-grid--content .detail-item__value { min-height: 52px; margin-top: 0; padding: 14px; color: #172033; font-size: 13px; font-weight: 700; line-height: 1.45; background: #fbfdff; border-left: 1px solid #edf3f8; border-radius: 0; box-shadow: none; white-space: pre-wrap; word-break: break-all; text-align: left; }
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
.detail-empty-text { display: flex; align-items: center; justify-content: center; padding: 40px 0; color: #7c8da1; font-size: 14px; }
</style>
