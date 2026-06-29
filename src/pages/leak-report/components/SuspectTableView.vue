<template>
  <view class="suspect-view">
    <view class="suspect-toolbar">
      <view class="toolbar-row toolbar-row--filters">
        <view class="filter-group">
          <text class="filter-label">检出人</text>
          <input v-model="filters.detectAccount" class="filter-input" placeholder="请输入检出人" placeholder-class="input-placeholder" />
        </view>

        <view class="filter-group filter-group--date">
          <text class="filter-label">检出时间</text>
          <view class="date-range">
            <WorkOrderDatetimePicker v-model="filters.startTime" class="filter-datetime" title="选择开始时间" placeholder="请选择开始时间" />
            <text class="filter-separator">至</text>
            <WorkOrderDatetimePicker v-model="filters.endTime" class="filter-datetime" title="选择结束时间" placeholder="请选择结束时间" />
          </view>
        </view>
      </view>

      <view class="toolbar-row toolbar-row--bottom">
        <view class="toolbar-actions toolbar-actions--left">
          <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="searchSuspects">查询</button>
          <button class="toolbar-button" hover-class="toolbar-button--hover" @click="resetFilters">重置</button>
          <button class="toolbar-icon-button" hover-class="toolbar-icon-button--hover" aria-label="刷新" @click="fetchSuspects">
            <text class="icon-refresh"></text>
          </button>
        </view>
        <view class="toolbar-spacer"></view>
        <view v-if="mode === 'management'" class="toolbar-actions toolbar-actions--right">
          <button
            class="toolbar-button toolbar-button--primary toolbar-button--create"
            hover-class="toolbar-button--hover"
            @click="emit('create')"
          >
            新增疑点
          </button>
          <button
            class="toolbar-button"
            :disabled="!selectedSuspect"
            hover-class="toolbar-button--hover"
            @click="selectedSuspect && emit('edit', selectedSuspect)"
          >
            编辑疑点
          </button>
          <button
            class="toolbar-button toolbar-button--danger"
            :disabled="!selectedSuspect"
            hover-class="toolbar-button--hover"
            @click="removeSuspect"
          >
            删除疑点
          </button>
        </view>
      </view>
    </view>

    <view class="suspect-layout">
      <view class="suspect-table-panel">
        <view class="table-head">
          <text>{{ pageTitle }}</text>
          <text class="table-head__meta">共 {{ total }} 条</text>
        </view>

        <scroll-view class="table-scroll" scroll-y>
          <view class="data-table">
            <view class="data-row data-row--header">
              <text class="data-cell data-cell--index data-cell--sortable" @click="toggleSort('index')">序号<text class="sort-indicator" :class="getSortClass('index')"></text></text>
              <text class="data-cell data-cell--time data-cell--sortable" @click="toggleSort('detectedTime')">检出时间<text class="sort-indicator" :class="getSortClass('detectedTime')"></text></text>
              <text class="data-cell data-cell--address data-cell--sortable" @click="toggleSort('leakAddress')">渗漏位置<text class="sort-indicator" :class="getSortClass('leakAddress')"></text></text>
              <text class="data-cell data-cell--account data-cell--sortable" @click="toggleSort('detectAccount')">检出人<text class="sort-indicator" :class="getSortClass('detectAccount')"></text></text>
              <text class="data-cell data-cell--worksheet data-cell--sortable" @click="toggleSort('referenceWorksheetId')">关联工单<text class="sort-indicator" :class="getSortClass('referenceWorksheetId')"></text></text>
            </view>

            <view v-if="loading" class="table-state">加载中...</view>
            <view v-else-if="suspects.length === 0" class="table-state">暂无疑点数据</view>

            <view v-else class="data-table-body" :class="{ 'data-table-body--loading': loading }">
              <view
                v-for="(item, index) in suspects"
                :key="getRowKey(item, index)"
                class="data-row"
                :class="{ 'data-row--active': selectedKey === getRowKey(item, index) }"
                @click="selectSuspect(item, index)"
              >
                <text class="data-cell data-cell--index">{{ (pagination.pageNum - 1) * pagination.pageSize + index + 1 }}</text>
                <text class="data-cell data-cell--time">{{ getDetectedTime(item) }}</text>
                <text class="data-cell data-cell--address">{{ getLeakAddress(item) }}</text>
                <text class="data-cell data-cell--account">{{ getDetectAccount(item) }}</text>
                <text class="data-cell data-cell--worksheet">{{ getReferenceWorksheetId(item) }}</text>
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

      <view class="suspect-detail-panel">
        <view class="detail-tabs">
          <view
            v-for="tab in detailTabs"
            :key="tab.value"
            class="detail-tab"
            :class="{ 'detail-tab--active': activeTab === tab.value }"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </view>
        </view>

        <view v-if="!selectedSuspect" class="detail-empty">请选择左侧疑点查看详情</view>
        <view v-else class="detail-body">
          <view v-if="activeTab === 'base'" class="detail-base-panel">
            <view class="detail-summary">
              <view class="detail-summary__main">
                <text class="detail-summary__label">疑点编号</text>
                <text class="detail-summary__number">{{ baseSummary.id }}</text>
              </view>
            </view>

            <view class="detail-grid detail-grid--base">
              <view v-for="item in secondaryBaseDetailFields" :key="item.label" class="detail-item detail-item--base">
                <text class="detail-item__label">{{ item.label }}</text>
                <text class="detail-item__value">{{ item.value }}</text>
              </view>
            </view>
          </view>

          <view v-if="activeTab === 'pipe'" class="detail-grid detail-grid--content">
            <view v-for="item in pipeDetailFields" :key="item.label" class="detail-item detail-item--note">
              <text class="detail-item__label">{{ item.label }}</text>
              <text class="detail-item__value">{{ item.value }}</text>
            </view>
          </view>

          <view v-if="activeTab === 'time'" class="detail-time-panel">
            <view class="time-section">
              <text class="detail-section-title">时间信息</text>
              <view class="time-list">
                <view v-for="item in timeMomentFields" :key="item.label" class="time-row">
                  <view class="time-row__marker"></view>
                  <view class="time-row__content">
                    <text class="time-row__label">{{ item.label }}</text>
                    <text class="time-row__value">{{ item.value }}</text>
                  </view>
                </view>
              </view>
            </view>

            <view class="time-section time-section--location">
              <text class="detail-section-title">地点信息</text>
              <view v-for="item in locationDetailFields" :key="item.label" class="location-row">
                <text class="location-row__label">{{ item.label }}</text>
                <text class="location-row__value">{{ item.value }}</text>
              </view>
            </view>
          </view>
        </view>

        <view v-if="mode === 'processing' && selectedSuspect" class="process-box">
          <text class="process-box__title">疑点处理</text>
          <view class="process-actions">
            <button class="toolbar-button process-action process-action--confirm" :disabled="processing" hover-class="toolbar-button--hover" @click="openConfirmDialog">确认疑点</button>
            <button class="toolbar-button process-action process-action--exclude" :disabled="processing" hover-class="toolbar-button--hover" @click="handleExclude">排除疑点</button>
            <button class="toolbar-button process-action process-action--worksheet" :disabled="processing" hover-class="toolbar-button--hover" @click="openWorksheetDialog">转工单</button>
          </view>
        </view>
      </view>
    </view>

    <view v-if="confirmDialogVisible" class="dialog-mask" @click.self="closeConfirmDialog">
      <view class="dialog-panel dialog-panel--sm" @click.stop>
        <view class="dialog-header">
          <view>
            <text class="dialog-title">确认疑点</text>
            <text class="dialog-subtitle">选择渗漏级别，确认后该疑点将转为漏点</text>
          </view>
          <button class="dialog-close" hover-class="dialog-close--hover" aria-label="关闭" @click="closeConfirmDialog">×</button>
        </view>
        <view class="dialog-body">
          <view class="form-field">
            <text class="form-label">编号</text>
            <view class="form-readonly">{{ worksheetSuspectId || "-" }}</view>
          </view>
          <view class="form-field">
            <text class="form-label form-label--required">渗漏级别</text>
            <view class="option-group">
              <button
                v-for="item in confirmLevelOptions"
                :key="item.value"
                class="option-button"
                :class="{ 'option-button--active': confirmLevel === item.value }"
                hover-class="option-button--hover"
                @click="confirmLevel = item.value"
              >
                {{ item.label }}
              </button>
            </view>
          </view>
          <view class="form-field">
            <text class="form-label">备注</text>
            <textarea v-model="confirmRemark" class="form-textarea" placeholder="请输入确认备注" placeholder-class="input-placeholder" />
          </view>
        </view>
        <view class="dialog-footer">
          <button class="dialog-button" hover-class="dialog-button--hover" @click="closeConfirmDialog">取消</button>
          <button class="dialog-button dialog-button--primary" :disabled="processing" hover-class="dialog-button--hover" @click="submitConfirm">
            {{ processing ? "处理中..." : "确认" }}
          </button>
        </view>
      </view>
    </view>

    <view v-if="worksheetDialogVisible" class="dialog-mask" @click.self="closeWorksheetDialog">
      <view class="dialog-panel dialog-panel--sm" @click.stop>
        <view class="dialog-header">
          <view>
            <text class="dialog-title">转工单</text>
            <text class="dialog-subtitle">填写工单信息，创建工单并关联当前疑点</text>
          </view>
          <button class="dialog-close" hover-class="dialog-close--hover" aria-label="关闭" @click="closeWorksheetDialog">×</button>
        </view>
        <view class="dialog-body">
          <view class="form-field">
            <text class="form-label">编号</text>
            <view class="form-readonly">{{ worksheetSuspectId || "-" }}</view>
          </view>
          <view class="form-field">
            <text class="form-label form-label--required">工单标题</text>
            <input v-model="worksheetForm.title" class="form-input" placeholder="请输入工单标题" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label form-label--required">工单类型</text>
            <view class="select-field">
              <view
                class="form-select form-select--dropdown"
                :class="{ 'form-select--open': worksheetTypeSelectOpen, 'form-control--error': worksheetTypeError }"
                @click.stop="worksheetTypeSelectOpen = !worksheetTypeSelectOpen"
              >
                <text :class="{ 'select-placeholder': worksheetForm.type === '' }">{{ worksheetTypeLabel }}</text>
                <text class="select-arrow"></text>
              </view>
              <view v-if="worksheetTypeSelectOpen" class="select-menu">
                <view
                  v-for="item in worksheetTypeOptions"
                  :key="item.value"
                  class="select-option"
                  :class="{ 'select-option--active': worksheetForm.type === item.value }"
                  @click.stop="selectWorksheetType(item.value)"
                >
                  {{ item.label }}
                </view>
              </view>
            </view>
            <text v-if="worksheetTypeError" class="form-error">{{ worksheetTypeError }}</text>
          </view>
          <view class="form-field">
            <text class="form-label">工单描述</text>
            <textarea v-model="worksheetForm.description" class="form-textarea" placeholder="请输入工单描述" placeholder-class="input-placeholder" />
          </view>
        </view>
        <view class="dialog-footer">
          <button class="dialog-button" hover-class="dialog-button--hover" @click="closeWorksheetDialog">取消</button>
          <button class="dialog-button dialog-button--primary" :disabled="processing" hover-class="dialog-button--hover" @click="submitWorksheet">
            {{ processing ? "处理中..." : "转工单" }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { getSuspectPage, getSuspectDetail, deleteSuspect } from "@/services/leak-report/suspect-management";
import { confirmSuspect, excludeSuspect, convertToWorksheet } from "@/services/leak-report/suspect-processing";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";

type SuspectMode = "management" | "processing";
type DetailTab = "base" | "pipe" | "time";
type SuspectRecord = Record<string, unknown>;
type OptionValue = number | "";
type SelectOption<T extends OptionValue = OptionValue> = {
  label: string;
  value: T;
};

interface ApiResponseLike {
  code?: number;
  data?: unknown;
  records?: unknown[];
  rows?: unknown[];
  total?: number;
  msg?: string;
}

const props = defineProps<{
  mode: SuspectMode;
}>();

const emit = defineEmits<{
  (event: "create"): void;
  (event: "edit", suspect: SuspectRecord): void;
}>();

const pageTitleMap: Record<SuspectMode, string> = {
  management: "疑点管理列表",
  processing: "疑点处理列表",
};

const leakLevelOptions: SelectOption[] = [
  { label: "不限", value: "" },
  { label: "轻度", value: 0 },
  { label: "中度", value: 1 },
  { label: "重度", value: 2 },
  { label: "疑点", value: 3 },
];

const detailTabs: Array<{ label: string; value: DetailTab }> = [
  { label: "疑点详情", value: "base" },
  { label: "管道信息", value: "pipe" },
  { label: "时间地点", value: "time" },
];

const filters = reactive({
  startTime: "",
  endTime: "",
  leakLevel: 3 as number | "",
  detectAccount: "",
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
});

const suspects = ref<SuspectRecord[]>([]);
const selectedSuspect = ref<SuspectRecord | null>(null);
const selectedKey = ref("");
const total = ref(0);
const loading = ref(false);
const activeTab = ref<DetailTab>("base");

const sortField = ref<string>("");
const sortOrder = ref<"asc" | "desc" | "">("");

const pageTitle = computed(() => pageTitleMap[props.mode]);
const currentLevelLabel = computed(() => getOptionLabel(leakLevelOptions, filters.leakLevel, "不限"));
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pagination.pageSize)));

const baseDetailFields = computed(() => {
  const item = selectedSuspect.value || {};

  return [
    { label: "疑点编号", value: getId(item) },
    { label: "渗漏部位", value: getLeakPart(item) },
    { label: "检出人", value: getDetectAccount(item) },
    { label: "关联设备", value: getReferenceDevices(item) },
    { label: "关联音频", value: getReferenceAudio(item) },
    { label: "关联工单ID", value: getReferenceWorksheetId(item) },
    { label: "渗漏照片", value: getLeakPicture(item) },
    { label: "备注", value: getRemark(item) },
  ];
});

const baseSummary = computed(() => {
  const item = selectedSuspect.value || {};
  return {
    id: getId(item),
  };
});

const secondaryBaseDetailFields = computed(() =>
  baseDetailFields.value.filter((item) => item.label !== "疑点编号"),
);

const pipeDetailFields = computed(() => {
  const item = selectedSuspect.value || {};

  return [
    { label: "管道埋深", value: getTubeDepth(item) },
    { label: "管道材料", value: getTubeMaterial(item) },
    { label: "管道口径", value: getTubeBore(item) },
    { label: "最近设备距离", value: getClosestDeviceDistance(item) },
    { label: "关联设备", value: getReferenceDevices(item) },
    { label: "关联音频", value: getReferenceAudio(item) },
  ];
});

const timeDetailFields = computed(() => {
  const item = selectedSuspect.value || {};

  return [
    { label: "检出时间", value: getDetectedTime(item) },
    { label: "创建时间", value: getCreatedAt(item) },
    { label: "更新时间", value: formatDateTime(getTextValue(item, ["updatedAt"], "-")) },
    { label: "渗漏位置", value: getLeakAddress(item) },
    { label: "渗漏坐标", value: getLeakCoordinate(item) },
  ];
});
const timeMomentFields = computed(() => timeDetailFields.value.filter((item) => item.label !== "渗漏位置" && item.label !== "渗漏坐标"));
const locationDetailFields = computed(() => timeDetailFields.value.filter((item) => item.label === "渗漏位置" || item.label === "渗漏坐标"));

onMounted(() => {
  void fetchSuspects();
});

watch(selectedSuspect, () => {
  // 选中变化时无需额外动作，详情由 computed 派生
});

function handleLevelChange(event: { detail: { value: number } }) {
  filters.leakLevel = leakLevelOptions[event.detail.value]?.value ?? "";
}

function buildQueryParams() {
  if (!validateDateTimeRange()) {
    throw {
      code: -2,
      msg: "时间格式应为 YYYY-MM-DDTHH:mm:ss",
    };
  }

  const queryLeakLevel = 3;

  return {
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    startTime: normalizeDateForApi(filters.startTime, false),
    endTime: normalizeDateForApi(filters.endTime, true),
    sortOrder: sortOrder.value || "desc",
    sortField: sortField.value || "createdAt",
    leakLevel: queryLeakLevel,
    detectAccount: filters.detectAccount.trim() || undefined,
  };
}

function validateDateTimeRange() {
  const pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
  return (!filters.startTime || pattern.test(filters.startTime)) && (!filters.endTime || pattern.test(filters.endTime));
}

async function fetchSuspects() {
  loading.value = true;

  try {
    const response = await getSuspectPage(buildQueryParams()) as ApiResponseLike;
    assertSuccessResponse(response);
    const parsed = parsePageResponse(response);
    suspects.value = parsed.records;
    total.value = parsed.total;
    selectFirstRow();
  } catch (error) {
    suspects.value = [];
    total.value = 0;
    selectedSuspect.value = null;
    selectedKey.value = "";
    uni.showToast({
      title: (error as { msg?: string })?.msg || "疑点数据加载失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
}

function parsePageResponse(response: ApiResponseLike) {
  const data = response?.data ?? response;
  const pageData = findPageContainer(data) || findPageContainer(response) || (isObject(data) ? data : {});
  const records = getFirstArray(pageData, ["records", "rows", "list", "items"]);
  const topLevelRecords = getFirstArray(response, ["records", "rows", "list", "items"]);
  const finalRecords = records.length > 0 ? records : topLevelRecords;
  const totalValue = getFirstNumber(pageData, ["total", "count", "totalCount", "totalRow", "totalRows", "totalElements"]) ??
    getFirstNumber(response, ["total", "count", "totalCount", "totalRow", "totalRows", "totalElements"]);
  const current = getFirstNumber(pageData, ["current", "pageNum", "page", "pageNo"]);
  const size = getFirstNumber(pageData, ["size", "pageSize", "limit"]);

  if (current) {
    pagination.pageNum = current;
  }

  if (size) {
    pagination.pageSize = size;
  }

  const minimumVisibleTotal = (pagination.pageNum - 1) * pagination.pageSize + finalRecords.length;
  const resolvedTotal = totalValue === undefined ? finalRecords.length : Math.max(totalValue, minimumVisibleTotal);

  return {
    records: finalRecords.map((item) => (isObject(item) ? item : { value: item })),
    total: resolvedTotal,
  };
}

function findPageContainer(value: unknown): SuspectRecord | null {
  if (!isObject(value)) {
    return null;
  }

  const hasRecords = getFirstArray(value, ["records", "rows", "list", "items"]).length > 0;
  const hasTotal = getFirstNumber(value, ["total", "count", "totalCount", "totalRow", "totalRows", "totalElements"]) !== undefined;
  if (hasRecords || hasTotal) {
    return value;
  }

  for (const key of ["data", "result", "page", "pageData"]) {
    const matched = findPageContainer(value[key]);
    if (matched) {
      return matched;
    }
  }

  return null;
}

function selectFirstRow() {
  if (suspects.value.length === 0) {
    selectedSuspect.value = null;
    selectedKey.value = "";
    return;
  }

  const currentId = selectedSuspect.value ? getRowId(selectedSuspect.value) : "";
  const matched = currentId ? suspects.value.find((item) => getRowId(item) === currentId) : null;
  const next = matched || suspects.value[0];

  selectedSuspect.value = next;
  selectedKey.value = getRowKey(next, suspects.value.indexOf(next));
  activeTab.value = "base";
}

async function selectSuspect(item: SuspectRecord, index: number) {
  selectedSuspect.value = item;
  selectedKey.value = getRowKey(item, index);
  activeTab.value = "base";

  const id = getRowId(item);
  if (!id) {
    return;
  }

  try {
    const response = await getSuspectDetail(id);
    assertSuccessResponse(response);
    if (isObject(response?.data)) {
      selectedSuspect.value = {
        ...item,
        ...response.data,
      };
    }
  } catch {
    // 详情失败时保留列表数据，避免影响主表格展示。
  }
}

async function removeSuspect() {
  const id = selectedSuspect.value ? getRowId(selectedSuspect.value) : "";
  if (!id) {
    uni.showToast({ title: "请先选择疑点", icon: "none" });
    return;
  }

  uni.showModal({
    title: "确认删除",
    content: "确定要删除该疑点吗？删除后不可恢复。",
    success: (modalRes) => {
      if (!modalRes.confirm) {
        return;
      }
      void confirmDelete(id);
    },
  });
}

async function confirmDelete(id: string | number) {
  try {
    const response = await deleteSuspect(id) as ApiResponseLike;
    assertSuccessResponse(response);
    uni.showToast({ title: "疑点已删除", icon: "success" });
    await fetchSuspects();
  } catch (error) {
    uni.showToast({
      title: (error as { msg?: string })?.msg || "疑点删除失败",
      icon: "none",
    });
  }
}

function searchSuspects() {
  pagination.pageNum = 1;
  void fetchSuspects();
}

function toggleSort(field: string) {
  if (sortField.value === field) {
    if (sortOrder.value === "asc") {
      sortOrder.value = "desc";
    } else if (sortOrder.value === "desc") {
      sortField.value = "";
      sortOrder.value = "";
    } else {
      sortOrder.value = "asc";
    }
  } else {
    sortField.value = field;
    sortOrder.value = "asc";
  }
  searchSuspects();
}

function getSortClass(field: string) {
  if (sortField.value !== field) return "sort-indicator--default";
  return sortOrder.value === "asc" ? "sort-indicator--asc" : "sort-indicator--desc";
}

function resetFilters() {
  clearFilters();
  searchSuspects();
}

function clearFilters() {
  filters.startTime = "";
  filters.endTime = "";
  filters.leakLevel = "";
  filters.detectAccount = "";
}

const confirmLevelOptions: SelectOption<number>[] = [
  { label: "轻度", value: 0 },
  { label: "中度", value: 1 },
  { label: "重度", value: 2 },
];

const worksheetTypeOptions: SelectOption<number>[] = [
  { label: "巡检", value: 0 },
  { label: "检漏", value: 1 },
  { label: "拆装", value: 2 },
  { label: "维护", value: 3 },
];

const processing = ref(false);
const confirmDialogVisible = ref(false);
const confirmLevel = ref<number>(0);
const confirmRemark = ref("");
const worksheetDialogVisible = ref(false);
const worksheetTypeSelectOpen = ref(false);
const worksheetTypeError = ref("");
const worksheetForm = reactive({ title: "", type: "" as number | "", description: "" });

const confirmLevelLabel = computed(() => confirmLevelOptions.find((item) => item.value === confirmLevel.value)?.label || "请选择");
const worksheetTypeLabel = computed(() => {
  if (worksheetForm.type === "") return "请选择工单类型";
  return worksheetTypeOptions.find((item) => item.value === worksheetForm.type)?.label || "请选择工单类型";
});
const worksheetSuspectId = computed(() => (selectedSuspect.value ? getRowId(selectedSuspect.value) : ""));

function handleConfirmLevelChange(event: { detail: { value: number } }) {
  confirmLevel.value = confirmLevelOptions[event.detail.value]?.value ?? 0;
}

function selectWorksheetType(value: number) {
  worksheetForm.type = value;
  worksheetTypeSelectOpen.value = false;
  worksheetTypeError.value = "";
}

function openConfirmDialog() {
  confirmLevel.value = 0;
  confirmRemark.value = "";
  confirmDialogVisible.value = true;
}

function closeConfirmDialog() {
  confirmDialogVisible.value = false;
}

function openWorksheetDialog() {
  worksheetForm.title = "";
  worksheetForm.type = "";
  worksheetForm.description = "";
  worksheetTypeSelectOpen.value = false;
  worksheetTypeError.value = "";
  worksheetDialogVisible.value = true;
}

function closeWorksheetDialog() {
  worksheetDialogVisible.value = false;
  worksheetTypeSelectOpen.value = false;
  worksheetTypeError.value = "";
}

async function submitConfirm() {
  const id = selectedSuspect.value ? getRowId(selectedSuspect.value) : "";
  if (!id) {
    uni.showToast({ title: "请先选择疑点", icon: "none" });
    return;
  }

  processing.value = true;
  try {
    const response = await confirmSuspect(id, {
      leakLevel: confirmLevel.value,
      remark: confirmRemark.value.trim(),
    }) as ApiResponseLike;
    assertSuccessResponse(response);
    uni.showToast({ title: "疑点已确认", icon: "success" });
    confirmDialogVisible.value = false;
    await fetchSuspects();
  } catch (error) {
    uni.showToast({
      title: (error as { msg?: string })?.msg || "确认失败",
      icon: "none",
    });
  } finally {
    processing.value = false;
  }
}

async function handleExclude() {
  const id = selectedSuspect.value ? getRowId(selectedSuspect.value) : "";
  if (!id) {
    uni.showToast({ title: "请先选择疑点", icon: "none" });
    return;
  }

  uni.showModal({
    title: "确认排除",
    content: "确定要排除该疑点吗？排除后将物理删除，不可恢复。",
    success: (modalRes) => {
      if (!modalRes.confirm) {
        return;
      }
      void doExclude(id);
    },
  });
}

async function doExclude(id: string | number) {
  processing.value = true;
  try {
    const response = await excludeSuspect(id) as ApiResponseLike;
    assertSuccessResponse(response);
    uni.showToast({ title: "疑点已排除", icon: "success" });
    await fetchSuspects();
  } catch (error) {
    uni.showToast({
      title: (error as { msg?: string })?.msg || "排除失败",
      icon: "none",
    });
  } finally {
    processing.value = false;
  }
}

async function submitWorksheet() {
  const id = selectedSuspect.value ? getRowId(selectedSuspect.value) : "";
  if (!id) {
    uni.showToast({ title: "请先选择疑点", icon: "none" });
    return;
  }
  if (!worksheetForm.title.trim()) {
    uni.showToast({ title: "请输入工单标题", icon: "none" });
    return;
  }
  if (worksheetForm.type === "") {
    worksheetTypeError.value = "请选择工单类型";
    return;
  }

  processing.value = true;
  try {
    const response = await convertToWorksheet(id, {
      title: worksheetForm.title.trim(),
      type: worksheetForm.type,
      description: worksheetForm.description.trim(),
    }) as ApiResponseLike;
    assertSuccessResponse(response);
    uni.showToast({ title: "已转工单", icon: "success" });
    worksheetDialogVisible.value = false;
    await fetchSuspects();
  } catch (error) {
    uni.showToast({
      title: (error as { msg?: string })?.msg || "转工单失败",
      icon: "none",
    });
  } finally {
    processing.value = false;
  }
}

function resetFiltersAndFetch() {
  clearFilters();
  pagination.pageNum = 1;
  return fetchSuspects();
}

function changePage(step: number) {
  const nextPage = pagination.pageNum + step;
  if (nextPage < 1 || nextPage > totalPages.value) {
    return;
  }

  pagination.pageNum = nextPage;
  void fetchSuspects();
}

function assertSuccessResponse(response: ApiResponseLike | undefined) {
  const code = response?.code;
  if (code === undefined || code === 0 || code === 200) {
    return;
  }

  throw {
    code,
    msg: response?.msg || "请求失败",
    data: response?.data,
  };
}

function getRowId(item: SuspectRecord) {
  const value = getStableValue(item, ["id"]);
  return typeof value === "string" || typeof value === "number" ? value : "";
}

function getRowKey(item: SuspectRecord, index: number) {
  return String(getRowId(item) || index);
}

function getId(item: SuspectRecord) {
  return getTextValue(item, ["id"], "-");
}

function getDetectedTime(item: SuspectRecord) {
  return formatDateTime(getTextValue(item, ["detectedTime"], "-"));
}

function getLeakAddress(item: SuspectRecord) {
  return getTextValue(item, ["leakAddress"], "-");
}

function getLeakCoordinate(item: SuspectRecord) {
  return getTextValue(item, ["leakCoordinate"], "-");
}

function getLeakLevelLabel(item: SuspectRecord) {
  return getOptionLabel(leakLevelOptions, getStableValue(item, ["leakLevel"]), "未知");
}

function getLeakPart(item: SuspectRecord) {
  return getTextValue(item, ["leakPart"], "-");
}

function getReferenceDevices(item: SuspectRecord) {
  return getTextValue(item, ["referenceDevices"], "-");
}

function getReferenceAudio(item: SuspectRecord) {
  return getTextValue(item, ["referenceAudio"], "-");
}

function getReferenceWorksheetId(item: SuspectRecord) {
  return getTextValue(item, ["referenceWorksheetId"], "-");
}

function getClosestDeviceDistance(item: SuspectRecord) {
  return getTextValue(item, ["closestDeviceDistance"], "-");
}

function getTubeDepth(item: SuspectRecord) {
  return getTextValue(item, ["tubeDepth"], "-");
}

function getTubeMaterial(item: SuspectRecord) {
  return getTextValue(item, ["tubeMaterial"], "-");
}

function getTubeBore(item: SuspectRecord) {
  return getTextValue(item, ["tubeBore"], "-");
}

function getDetectAccount(item: SuspectRecord) {
  return getTextValue(item, ["detectAccount"], "-");
}

function getLeakPicture(item: SuspectRecord) {
  return getTextValue(item, ["leakPicture"], "-");
}

function getRemark(item: SuspectRecord) {
  return getTextValue(item, ["remark"], "-");
}

function getCreatedAt(item: SuspectRecord) {
  return formatDateTime(getTextValue(item, ["createdAt"], "-"));
}

function getLevelClass(item: SuspectRecord) {
  const level = Number(getStableValue(item, ["leakLevel"]));
  if (level === 2) {
    return "level-pill--high";
  }
  if (level === 1) {
    return "level-pill--mid";
  }
  if (level === 3) {
    return "level-pill--suspect";
  }
  return "level-pill--low";
}

function getOptionLabel(options: SelectOption[], value: unknown, fallback: string) {
  const normalized = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return options.find((item) => item.value === normalized)?.label || fallback;
}

function getTextValue(item: SuspectRecord, keys: string[], fallback = "") {
  const value = getStableValue(item, keys);
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value);
}

function getStableValue(item: SuspectRecord, keys: string[]) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(item, key)) {
      return item[key];
    }
  }

  return undefined;
}

function getFirstArray(item: unknown, keys: string[]) {
  if (!isObject(item)) {
    return [];
  }

  for (const key of keys) {
    const value = item[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function getFirstNumber(item: unknown, keys: string[]) {
  if (!isObject(item)) {
    return undefined;
  }

  for (const key of keys) {
    const value = item[key];
    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }

  return undefined;
}

function isObject(value: unknown): value is SuspectRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeDateForApi(value: string, isEnd: boolean) {
  if (!value) {
    return undefined;
  }

  const normalizedValue = normalizeDisplayDatetime(value);

  if (normalizedValue.includes("T")) {
    return normalizedValue.length === 16 ? `${normalizedValue}:00` : normalizedValue;
  }

  return `${normalizedValue}T${isEnd ? "23:59:59" : "00:00:00"}`;
}

function normalizeDisplayDatetime(value: string) {
  return value.trim().replace(/\s+/, "T");
}

function formatDateTime(value: string) {
  if (!value || value === "-") {
    return value || "-";
  }

  return value
    .replace("T", " ")
    .replace(/\.\d+/, "")
    .replace(/(?:Z|[+-]\d{2}:?\d{2})$/, "");
}

defineExpose({
  fetchSuspects,
  resetFiltersAndFetch,
});
</script>

<style scoped lang="scss">
.suspect-view {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding: 0 14px 14px;
  overflow: hidden;
  overflow-x: hidden;
  background: #eef4f8;
}

.suspect-toolbar,
.suspect-table-panel,
.suspect-detail-panel {
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
  min-width: 0;
  overflow: hidden;
}

.pagination-bar,
.table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-group {
  display: grid;
  align-content: start;
  gap: 6px;
  flex: 0 0 136px;
  min-width: 0;
}

.toolbar-row {
  min-width: 0;
}

.toolbar-row--filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 10px 12px;
}

.toolbar-row--bottom {
  display: flex;
  align-items: end;
  gap: 12px;
  width: 100%;
}

.toolbar-spacer {
  flex: 1;
}

.filter-label {
  color: #52677b;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
  white-space: nowrap;
}

.filter-input,
.filter-select {
  box-sizing: border-box;
  width: 100%;
  color: #172033;
  font-size: 14px;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.filter-input,
.filter-select {
  height: 30px;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 600;
  line-height: 30px;
}

.toolbar-row--filters .filter-input,
.toolbar-row--filters .filter-select {
  height: 28px;
  line-height: 28px;
}

.input-placeholder {
  color: #9aa9b8;
}

.filter-input {
  width: 100%;
}

.filter-input--name {
  width: 100%;
}

.filter-separator {
  color: #8191a2;
  font-size: 13px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.filter-group--date {
  flex: 0 0 auto;
  min-width: 0;
}

.filter-datetime {
  flex: 0 0 200px;
  width: 200px;
}

.filter-datetime :deep(.datetime-picker__control) {
  height: 30px;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 600;
  line-height: 30px;
}

.filter-datetime :deep(.datetime-picker__value) {
  font-size: 13px;
  font-weight: 600;
}

.filter-datetime :deep(.datetime-picker__icon) {
  width: 15px;
  height: 15px;
}

.filter-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.filter-select__arrow {
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.suspect-toolbar {
  flex: none;
  display: grid;
  gap: 12px;
  min-height: 0;
  padding: 14px;
  overflow: visible;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.toolbar-button,
.toolbar-icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  height: 30px;
  margin: 0;
  padding: 0 12px;
  color: #31506d;
  font-size: 13px;
  font-weight: 700;
  line-height: 30px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 0 0 auto;
  justify-content: flex-start;
  width: auto;
  margin-left: 0;
}

.toolbar-actions--right {
  margin-left: auto;
  justify-content: flex-end;
}

.toolbar-actions .toolbar-button,
.toolbar-actions .toolbar-icon-button {
  height: 38px;
  line-height: 1.2;
  border-radius: 5px;
}

.toolbar-actions .toolbar-button {
  min-width: 64px;
  padding: 0 15px;
}

.toolbar-actions .toolbar-icon-button {
  width: 38px;
}

.toolbar-button::after,
.toolbar-icon-button::after,
.page-button::after {
  border: 0;
}

.toolbar-button--primary {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
  box-shadow: 0 5px 12px rgba(13, 130, 238, 0.18);
}

.toolbar-button--danger {
  color: #b42318;
  background: #fff5f3;
  border-color: #ffc9c0;
}

.toolbar-button--hover,
.toolbar-icon-button--hover {
  color: #0d82ee;
  background: #edf7ff;
  border-color: #a9d7ff;
}

.toolbar-button--primary.toolbar-button--hover {
  color: #ffffff;
  background: #0674d8;
  border-color: #0674d8;
}

.toolbar-button[disabled] {
  color: #9aa9b8;
  background: #eef2f6;
  border-color: #d7e0e8;
}

.toolbar-icon-button {
  width: 30px;
  padding: 0;
}

.icon-refresh {
  position: relative;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
}

.icon-refresh::after {
  position: absolute;
  top: -3px;
  right: -2px;
  width: 0;
  height: 0;
  content: "";
  border: 4px solid transparent;
  border-left-color: currentColor;
  transform: rotate(-20deg);
}

.suspect-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  flex: 1;
  gap: 14px;
  margin-top: 14px;
  min-height: 0;
  overflow: hidden;
  overflow-x: hidden;
}

.suspect-table-panel,
.suspect-detail-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  overflow-x: hidden;
}

.table-head {
  flex: none;
  height: 50px;
  padding: 0 16px;
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
  height: auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background: #ffffff;
}

.table-scroll :deep(.uni-scroll-view),
.detail-body :deep(.uni-scroll-view) {
  scrollbar-color: #9fb4c8 #edf3f8;
  scrollbar-width: thin;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar),
.detail-body::-webkit-scrollbar {
  width: 9px;
  height: 9px;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar-track),
.detail-body::-webkit-scrollbar-track {
  background: #edf3f8;
  border-radius: 999px;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar-thumb),
.detail-body::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, #9fb4c8, #6f8ba8);
  border: 2px solid #edf3f8;
  border-radius: 999px;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar-thumb:hover),
.detail-body::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(90deg, #7f9ab4, #4d6f91);
}

.data-table {
  width: 100%;
  min-width: 0;
  background: #ffffff;
}

.data-row {
  display: grid;
  grid-template-columns: 52px 1fr 2fr 1fr 1fr;
  min-height: 42px;
  width: 100%;
  min-width: 0;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
  transition:
    background 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.2s ease;
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

.data-table-body {
  transition: opacity 0.25s ease;
}

.data-table-body--loading {
  opacity: 0.5;
  pointer-events: none;
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
  transform: translateY(-1px);
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
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
  justify-content: center;
  color: #415a73;
  font-size: 12px;
  letter-spacing: 0;
  text-align: center;
}

.data-cell--sortable {
  cursor: pointer;
  user-select: none;
  transition: color 0.18s ease;
}

.data-cell--sortable:hover {
  color: #0d82ee;
}

.sort-indicator {
  display: inline-block;
  width: 0;
  height: 0;
  margin-left: 4px;
  vertical-align: middle;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
}

.sort-indicator--default {
  border-top: 5px solid #c5d2e0;
  opacity: 0.4;
}

.sort-indicator--asc {
  border-bottom: 5px solid #0d82ee;
  border-top: 0;
}

.sort-indicator--desc {
  border-top: 5px solid #0d82ee;
}

.data-cell:last-child {
  border-right: 0;
}

.data-cell--index {
  justify-content: center;
  color: #64748b;
}

.data-cell--address,
.data-cell--remark {
  justify-content: flex-start;
  text-align: left;
}

.data-cell--time {
  color: #0f4c81;
  font-family: "DIN Alternate", "Arial", sans-serif;
  font-weight: 800;
}

.data-cell--device {
  color: #0f4c81;
  font-family: "DIN Alternate", "Arial", sans-serif;
  font-weight: 800;
}

.data-cell--account {
  color: #24384d;
}

.data-cell--worksheet {
  color: #0f4c81;
  font-family: "DIN Alternate", "Arial", sans-serif;
  font-weight: 800;
}

.table-state {
  height: 180px;
  color: #7c8da1;
  font-size: 14px;
  line-height: 180px;
  text-align: center;
}

.pagination-bar {
  flex: none;
  justify-content: flex-end;
  gap: 10px;
  height: 48px;
  padding: 0 14px;
  border-top: 1px solid #edf3f8;
}

.page-button {
  height: 30px;
  margin: 0;
  padding: 0 12px;
  color: #31506d;
  font-size: 13px;
  line-height: 30px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.page-button[disabled] {
  color: #a9b4c1;
  background: #f4f7fa;
}

.page-info {
  color: #64748b;
  font-size: 13px;
}

.detail-tabs {
  flex: none;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  height: 54px;
  padding: 8px;
  background: #f6fafe;
  border-bottom: 1px solid #e3edf6;
}

.detail-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5d7188;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}

.detail-tab--active {
  color: #0d82ee;
  background: #ffffff;
  border-color: #cfe7fb;
  box-shadow: 0 6px 14px rgba(13, 130, 238, 0.1);
}

.detail-body {
  flex: 1;
  height: auto;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
  background:
    linear-gradient(180deg, #f5faff 0, #ffffff 142px),
    #ffffff;
}

.detail-empty {
  height: 260px;
  color: #8a9aab;
  font-size: 14px;
  line-height: 260px;
  text-align: center;
}

.detail-grid {
  display: grid;
  gap: 12px;
}

.detail-base-panel {
  display: grid;
  gap: 12px;
}

.detail-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
  min-width: 0;
  padding: 14px 16px;
  background: #ffffff;
  border: 1px solid #dce9f4;
  border-left: 4px solid #0d82ee;
  border-radius: 6px;
  box-shadow: 0 8px 18px rgba(33, 72, 108, 0.045);
}

.detail-summary__main {
  min-width: 0;
}

.detail-summary__label {
  display: block;
  color: #6b7f94;
  font-size: 12px;
  font-weight: 800;
}

.detail-summary__number {
  display: block;
  margin-top: 7px;
  color: #0f4c81;
  font-family: "DIN Alternate", "Arial", sans-serif;
  font-size: 17px;
  font-weight: 900;
  line-height: 1.25;
  word-break: normal;
  overflow-wrap: anywhere;
}

.detail-summary__badges {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 7px;
}

.detail-summary__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 900;
  border: 1px solid transparent;
  border-radius: 999px;
}

.detail-summary__badge--level {
  color: #177245;
  background: #eaf8ef;
  border-color: #bfe8ce;
}

.detail-grid--base {
  grid-template-columns: 1fr;
  gap: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #dfebf5;
  border-radius: 6px;
  box-shadow: 0 8px 18px rgba(33, 72, 108, 0.045);
}

.detail-grid--content {
  grid-template-columns: 1fr;
  gap: 8px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  min-height: 74px;
  padding: 12px 13px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #dfebf5;
  border-radius: 6px;
  box-shadow: 0 8px 18px rgba(33, 72, 108, 0.055);
}

.detail-item--base {
  position: relative;
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  align-items: center;
  min-height: 48px;
  padding: 8px 14px;
  background: #ffffff;
  border: 0;
  border-bottom: 1px solid #edf3f8;
  border-radius: 0;
  box-shadow: none;
}

.detail-item--base::before {
  display: none;
}

.detail-grid--base .detail-item--base:last-child {
  border-bottom: 0;
}

.detail-item--base .detail-item__label {
  color: #71869b;
}

.detail-item--base .detail-item__value {
  margin-top: 0;
  text-align: right;
}

.detail-grid--content .detail-item {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  align-items: stretch;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background: #ffffff;
  border-color: #dfebf5;
  box-shadow: none;
}

.detail-item__label {
  display: flex;
  align-items: center;
  color: #6b7f94;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.3;
}

.detail-item__value {
  display: block;
  margin-top: 8px;
  color: #172033;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  word-break: break-all;
}

.detail-grid--content .detail-item__value {
  min-height: 52px;
  margin-top: 0;
  padding: 14px 14px;
  color: #172033;
  font-size: 13px;
  font-weight: 700;
  background: #fbfdff;
  border-left: 1px solid #edf3f8;
  border-radius: 0;
  box-shadow: none;
  white-space: pre-wrap;
}

.detail-item--note .detail-item__label {
  display: flex;
  align-items: center;
  padding: 0 12px;
  color: #5f7891;
  font-size: 12px;
  background: #f7fafc;
  border-left: 3px solid #b9dcff;
}

.detail-item--note:nth-child(1) .detail-item__label {
  border-left-color: #7dd3fc;
}

.detail-item--note:nth-child(2) .detail-item__label {
  border-left-color: #86efac;
}

.detail-item--note:nth-child(3) .detail-item__label,
.detail-item--note:nth-child(4) .detail-item__label,
.detail-item--note:nth-child(5) .detail-item__label,
.detail-item--note:nth-child(6) .detail-item__label {
  border-left-color: #cbd5e1;
}

.detail-time-panel {
  display: grid;
  gap: 12px;
}

.time-section {
  min-width: 0;
  padding: 14px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #dfebf5;
  border-radius: 6px;
  box-shadow: 0 8px 18px rgba(33, 72, 108, 0.055);
}

.detail-section-title {
  display: block;
  margin-bottom: 12px;
  color: #183755;
  font-size: 14px;
  font-weight: 900;
}

.time-list {
  position: relative;
  display: grid;
  gap: 0;
}

.time-list::before {
  position: absolute;
  top: 16px;
  bottom: 16px;
  left: 6px;
  width: 2px;
  content: "";
  background: #d7e8f6;
}

.time-row {
  position: relative;
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 10px;
  min-width: 0;
  padding: 9px 0;
}

.time-row__marker {
  position: relative;
  z-index: 1;
  width: 10px;
  height: 10px;
  margin-top: 4px;
  background: #0d82ee;
  border: 3px solid #e8f4ff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px #b9dcff;
}

.time-row__content {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.time-row__label {
  color: #6b7f94;
  font-size: 12px;
  font-weight: 800;
}

.time-row__value {
  min-width: 0;
  color: #172033;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  word-break: break-all;
}

.time-section--location {
  background:
    linear-gradient(90deg, rgba(13, 130, 238, 0.08), rgba(255, 255, 255, 0) 58%),
    rgba(255, 255, 255, 0.96);
}

.location-row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 10px;
  min-width: 0;
  padding: 11px 0;
  border-top: 1px solid #edf3f8;
}

.location-row__label {
  color: #6b7f94;
  font-size: 12px;
  font-weight: 800;
}

.location-row__value {
  color: #172033;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
  word-break: break-all;
}

/* ============================================
   响应式布局
   ============================================ */

/* 大屏（>= 1440px）：表格与详情面板并排 */
@media (min-width: 1440px) {
  .suspect-layout {
    grid-template-columns: minmax(0, 1fr) 420px;
  }

  .data-row {
    grid-template-columns: 52px 1fr 2.5fr 1fr 1fr;
  }
}

/* 中屏（<= 1280px）：表格与详情面板上下堆叠 */
@media (max-width: 1280px) {
  .suspect-layout {
    grid-template-columns: 1fr;
  }

  .suspect-detail-panel {
    min-height: 320px;
  }

  .data-row {
    grid-template-columns: 52px 1fr 2fr 1fr 1fr;
  }
}

/* 小屏平板（<= 960px） */
@media (max-width: 960px) {
  .suspect-view {
    padding: 0 8px 10px;
  }

  .suspect-layout {
    gap: 10px;
    margin-top: 10px;
  }

  .toolbar-row--filters {
    flex-direction: column;
    gap: 8px;
  }

  .filter-group {
    flex: 1 1 100%;
    min-width: 0;
  }

  .filter-group--date {
    flex: 1 1 100%;
  }

  .date-range {
    flex-wrap: wrap;
  }

  .filter-datetime {
    flex: 1 1 140px;
    width: auto;
  }

  .data-row {
    grid-template-columns: 48px 1fr 2fr 1fr 1fr;
    min-height: 40px;
  }

  .data-cell {
    padding: 0 8px;
    font-size: 12px;
  }

  .detail-tabs {
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    height: 48px;
    padding: 6px;
  }

  .detail-tab {
    font-size: 12px;
  }

  .process-actions {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

/* 手机（<= 640px） */
@media (max-width: 640px) {
  .suspect-view {
    padding: 0 4px 8px;
  }

  .suspect-toolbar {
    padding: 10px;
    gap: 8px;
  }

  .toolbar-row--filters {
    gap: 6px;
  }

  .toolbar-row--bottom {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .toolbar-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 6px;
  }

  .toolbar-actions .toolbar-button {
    min-width: 56px;
    padding: 0 10px;
    font-size: 12px;
    height: 34px;
  }

  .toolbar-actions .toolbar-icon-button {
    width: 34px;
    height: 34px;
  }

  .suspect-layout {
    grid-template-columns: 1fr;
    gap: 8px;
    margin-top: 8px;
  }

  .suspect-detail-panel {
    min-height: 280px;
  }

  .table-head {
    height: 42px;
    padding: 0 10px;
    font-size: 14px;
  }

  .table-head__meta {
    font-size: 11px;
    padding: 2px 8px;
  }

  .data-row {
    grid-template-columns: 42px 1fr 2fr 1fr 1fr;
    min-height: 38px;
  }

  .data-row--header {
    min-height: 38px;
  }

  .data-cell {
    padding: 0 6px;
    font-size: 11px;
  }

  .data-row--header .data-cell {
    font-size: 11px;
  }

  .detail-tabs {
    grid-template-columns: repeat(4, 1fr);
    gap: 3px;
    height: 44px;
    padding: 4px;
  }

  .detail-tab {
    font-size: 11px;
  }

  .detail-body {
    padding: 10px;
  }

  .detail-item--base {
    grid-template-columns: 72px minmax(0, 1fr);
    min-height: 40px;
    padding: 6px 10px;
  }

  .detail-grid--content .detail-item {
    grid-template-columns: 1fr;
  }

  .detail-grid--content .detail-item__value {
    border-top: 1px solid #edf3f8;
    border-left: 0;
  }

  .detail-item--note .detail-item__label {
    min-height: 34px;
  }

  .time-row__content,
  .location-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .pagination-bar {
    height: 40px;
    padding: 0 8px;
    gap: 6px;
  }

  .page-button {
    height: 28px;
    padding: 0 8px;
    font-size: 12px;
    line-height: 28px;
  }

  .page-info {
    font-size: 12px;
  }
}

/* 极小屏（<= 400px） */
@media (max-width: 400px) {
  .data-row {
    grid-template-columns: 36px 1fr 2fr 1fr 1fr;
    min-height: 36px;
  }

  .data-cell {
    padding: 0 4px;
    font-size: 10px;
  }

  .data-row--header .data-cell {
    font-size: 10px;
  }

  .detail-tabs {
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 2px;
    height: 40px;
    padding: 3px;
  }

  .detail-tab {
    font-size: 10px;
  }
}

.process-box {
  flex: none;
  margin-top: 16px;
  padding: 16px 18px 18px;
  background: #f8fbfe;
  border-top: 1px solid #e3edf6;
}

.process-box__title {
  display: block;
  margin-bottom: 14px;
  padding-left: 10px;
  color: #183755;
  font-size: 15px;
  font-weight: 800;
  border-left: 3px solid #0d82ee;
  border-radius: 2px;
}

.process-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.process-action {
  width: 100%;
  height: 40px;
  margin: 0;
  padding: 0 12px;
  font-size: 14px;
  font-weight: 800;
  line-height: 40px;
  border-radius: 6px;
}

.process-action--confirm {
  color: #177245;
  background: #eaf8ef;
  border-color: #bfe8ce;
}

.process-action--exclude {
  color: #b42318;
  background: #fff5f3;
  border-color: #ffc9c0;
}

.process-action--worksheet {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 35, 55, 0.22);
}

.dialog-panel--sm {
  display: flex;
  flex-direction: column;
  width: min(480px, calc(100vw - 32px));
  max-height: calc(100vh - 64px);
  overflow: hidden;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 18px 46px rgba(15, 35, 55, 0.2);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  padding: 18px 24px;
  background: #f8fbfe;
  border-bottom: 1px solid #edf3f8;
}

.dialog-title {
  display: block;
  color: #183755;
  font-size: 22px;
  font-weight: 900;
}

.dialog-subtitle {
  display: block;
  margin-top: 4px;
  color: #5f7188;
  font-size: 13px;
}

.dialog-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  background: #f6fbff;
  border: 1px solid #d9e7f3;
  border-radius: 6px;
  cursor: pointer;
}

.dialog-close--hover {
  background: #edf7ff;
  border-color: #0d82ee;
}

.dialog-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 24px 16px;
  background: #fff;
}

.form-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 14px;
}

.form-label {
  display: block;
  margin-bottom: 5px;
  color: #34495e;
  font-size: 13px;
  font-weight: 700;
}

.form-label--required::after {
  margin-left: 4px;
  color: #ef4444;
  content: "*";
}

.form-input,
.form-select,
.form-textarea {
  box-sizing: border-box;
  width: 100%;
  color: #172033;
  font-size: 14px;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.form-input,
.form-select {
  height: 38px;
  padding: 0 12px;
  line-height: 38px;
}

.form-input:focus,
.form-textarea:focus {
  background: #fff;
  border-color: #8fc8f8;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.1);
}

.form-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.form-select__arrow {
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.select-field {
  position: relative;
}

.select-placeholder {
  color: #9aa9b8;
}

.select-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
  box-shadow: 0 8px 24px rgba(15, 35, 55, 0.12);
}

.select-option {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 12px;
  color: #172033;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.14s ease;
}

.select-option:hover {
  background: #edf7ff;
}

.select-option--active {
  color: #0d82ee;
  background: #e8f4ff;
}

.form-control--error {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
}

.form-error {
  display: block;
  margin-top: 4px;
  color: #ef4444;
  font-size: 12px;
  font-weight: 600;
}

.form-textarea {
  min-height: 88px;
  padding: 9px 12px;
  line-height: 1.45;
}

.form-readonly {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  height: 38px;
  padding: 0 12px;
  color: #31506d;
  font-size: 14px;
  font-weight: 700;
  background: #f1f5f9;
  border: 1px solid #e3edf6;
  border-radius: 4px;
}

.input-placeholder {
  color: #9aa9b8;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex: none;
  padding: 12px 22px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #edf3f8;
  box-shadow: 0 -4px 16px rgba(24, 55, 85, 0.06);
}

.dialog-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  height: 38px;
  margin: 0;
  padding: 0 22px;
  color: #34495e;
  font-size: 14px;
  font-weight: 700;
  line-height: 38px;
  background: #f1f5f9;
  border: 1px solid #d5e2ee;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.16s ease;
}

.dialog-button::after {
  border: 0;
}

.dialog-button--hover {
  opacity: 0.85;
}

.dialog-button--primary {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
}

.dialog-button[disabled] {
  opacity: 0.45;
  cursor: not-allowed;
}

.option-group {
  display: flex;
  gap: 8px;
}

.option-button {
  flex: 1;
  height: 38px;
  margin: 0;
  padding: 0 12px;
  color: #31506d;
  font-size: 14px;
  font-weight: 700;
  line-height: 38px;
  text-align: center;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.option-button::after {
  border: 0;
}

.option-button--hover {
  border-color: #8fc8f8;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.1);
}

.option-button--active {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
  box-shadow: 0 5px 12px rgba(13, 130, 238, 0.18);
}
</style>
