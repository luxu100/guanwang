<template>
  <view class="worksheet-view">
    <view v-if="mode === 'statistics'" class="stats-grid">
      <view v-for="item in statisticsCards" :key="item.label" class="stat-card">
        <text class="stat-card__label">{{ item.label }}</text>
        <text class="stat-card__value">{{ item.value }}</text>
      </view>
    </view>

    <view class="worksheet-toolbar">
      <view class="toolbar-row toolbar-row--filters">
        <view class="filter-group">
          <text class="filter-label">工单编号</text>
          <input v-model="filters.worksheetNumber" class="filter-input" placeholder="请输入编号" placeholder-class="input-placeholder" />
        </view>

        <view class="filter-group">
          <text class="filter-label">工单类型</text>
          <picker :range="worksheetTypeOptions" range-key="label" :value="currentTypeIndex" @change="handleTypeChange">
            <view class="filter-select">
              <text>{{ currentTypeLabel }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">工单状态</text>
          <picker :range="worksheetStatusOptions" range-key="label" :value="currentStatusIndex" @change="handleStatusChange">
            <view class="filter-select">
              <text>{{ currentStatusLabel }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">紧急程度</text>
          <picker :range="urgencyFilterOptions" range-key="label" :value="currentUrgencyIndex" @change="handleUrgencyChange">
            <view class="filter-select">
              <text>{{ currentUrgencyLabel }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">发起人</text>
          <input v-model="filters.riseAccount" class="filter-input filter-input--name" placeholder="请输入发起人" placeholder-class="input-placeholder" />
        </view>

        <view class="filter-group">
          <text class="filter-label">执行人</text>
          <input v-model="filters.executeAccount" class="filter-input filter-input--name" placeholder="请输入执行人" placeholder-class="input-placeholder" />
        </view>

        <view class="filter-group">
          <text class="filter-label">关联设备</text>
          <input v-model="filters.deviceReference" class="filter-input filter-input--device" placeholder="设备编号" placeholder-class="input-placeholder" />
        </view>
      </view>

      <view class="toolbar-row toolbar-row--bottom">
        <view class="filter-group filter-group--date">
          <text class="filter-label">发起时间</text>
          <view class="date-range">
            <WorkOrderDatetimePicker v-model="filters.startTime" class="filter-datetime" title="选择开始时间" placeholder="请选择开始时间" />
            <text class="filter-separator">至</text>
            <WorkOrderDatetimePicker v-model="filters.endTime" class="filter-datetime" title="选择结束时间" placeholder="请选择结束时间" />
          </view>
        </view>

        <view class="toolbar-actions">
          <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="searchWorksheets">查询</button>
          <button class="toolbar-button" hover-class="toolbar-button--hover" @click="resetFilters">重置</button>
          <button class="toolbar-icon-button" hover-class="toolbar-icon-button--hover" aria-label="刷新" @click="fetchWorksheets">
            <text class="icon-refresh"></text>
          </button>
          <button
            v-if="mode === 'create'"
            class="toolbar-button toolbar-button--primary toolbar-button--create"
            hover-class="toolbar-button--hover"
            @click="emit('create')"
          >
            新增工单
          </button>
        </view>
      </view>
    </view>

    <view class="worksheet-layout" :class="{ 'worksheet-layout--statistics': mode === 'statistics' }">
      <view class="worksheet-table-panel">
        <view class="table-head">
          <text>{{ pageTitle }}</text>
          <text class="table-head__meta">共 {{ total }} 条</text>
        </view>

        <scroll-view class="table-scroll" scroll-x scroll-y>
          <view class="data-table">
            <view class="data-row data-row--header">
              <text class="data-cell data-cell--index">序号</text>
              <text class="data-cell data-cell--number">工单编号</text>
              <text class="data-cell data-cell--type">工单类型</text>
              <text class="data-cell data-cell--status">工单状态</text>
              <text class="data-cell data-cell--account">发起人</text>
              <text class="data-cell data-cell--account">执行人</text>
              <text class="data-cell data-cell--device">设备引用</text>
              <text class="data-cell data-cell--level">紧急程度</text>
              <text class="data-cell data-cell--time">发起时间</text>
              <text class="data-cell data-cell--time">截止时间</text>
              <text class="data-cell data-cell--time">完成时间</text>
              <text class="data-cell data-cell--address">地址</text>
              <text class="data-cell data-cell--remark">备注</text>
            </view>

            <view v-if="loading" class="table-state">加载中...</view>
            <view v-else-if="worksheets.length === 0" class="table-state">暂无工单数据</view>

            <view
              v-for="(item, index) in worksheets"
              v-else
              :key="getRowKey(item, index)"
              class="data-row"
              :class="{ 'data-row--active': selectedKey === getRowKey(item, index) }"
              @click="selectWorksheet(item, index)"
            >
              <text class="data-cell data-cell--index">{{ (pagination.pageNum - 1) * pagination.pageSize + index + 1 }}</text>
              <text class="data-cell data-cell--number">{{ getWorksheetNumber(item) }}</text>
              <text class="data-cell data-cell--type">{{ getWorksheetTypeLabel(item) }}</text>
              <text class="data-cell data-cell--status">
                <text class="status-pill" :class="getStatusClass(item)">{{ getWorksheetStatusLabel(item) }}</text>
              </text>
              <text class="data-cell data-cell--account">{{ getRiseAccount(item) }}</text>
              <text class="data-cell data-cell--account">{{ getExecuteAccount(item) }}</text>
              <text class="data-cell data-cell--device">{{ getDeviceReference(item) }}</text>
              <text class="data-cell data-cell--level">
                <text class="urgency-pill" :class="getUrgencyClass(item)">{{ getUrgencyLabel(item) }}</text>
              </text>
              <text class="data-cell data-cell--time">{{ getRiseTime(item) }}</text>
              <text class="data-cell data-cell--time">{{ getDeadlineTime(item) }}</text>
              <text class="data-cell data-cell--time">{{ getFinishTime(item) }}</text>
              <text class="data-cell data-cell--address">{{ getAddress(item) }}</text>
              <text class="data-cell data-cell--remark">{{ getRemark(item) }}</text>
            </view>
          </view>
        </scroll-view>

        <view class="pagination-bar">
          <button class="page-button" hover-class="page-button--hover" :disabled="pagination.pageNum <= 1" @click="changePage(-1)">上一页</button>
          <text class="page-info">第 {{ pagination.pageNum }} / {{ totalPages }} 页</text>
          <button class="page-button" hover-class="page-button--hover" :disabled="pagination.pageNum >= totalPages" @click="changePage(1)">下一页</button>
        </view>
      </view>

      <view class="worksheet-detail-panel">
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

        <view v-if="!selectedWorksheet" class="detail-empty">请选择左侧工单查看详情</view>
        <view v-else class="detail-body">
          <view v-if="activeTab === 'base'" class="detail-base-panel">
            <view class="detail-summary">
              <view class="detail-summary__main">
                <text class="detail-summary__label">工单编号</text>
                <text class="detail-summary__number">{{ baseSummary.number }}</text>
              </view>
              <view class="detail-summary__badges">
                <text class="detail-summary__badge detail-summary__badge--status">{{ baseSummary.status }}</text>
                <text class="detail-summary__badge detail-summary__badge--level">{{ baseSummary.urgency }}</text>
              </view>
            </view>

            <view class="detail-grid detail-grid--base">
              <view v-for="item in secondaryBaseDetailFields" :key="item.label" class="detail-item detail-item--base">
                <text class="detail-item__label">{{ item.label }}</text>
                <text class="detail-item__value">{{ item.value }}</text>
              </view>
            </view>
          </view>

          <view v-if="activeTab === 'content'" class="detail-grid detail-grid--content">
            <view v-for="item in contentDetailFields" :key="item.label" class="detail-item detail-item--note">
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

          <view v-if="mode === 'processing'" class="process-box">
            <text class="process-box__title">工单处理</text>
            <view class="form-field">
              <text class="form-label">处理状态</text>
              <picker :range="worksheetStatusOptionsWithoutAll" range-key="label" :value="processStatusIndex" @change="handleProcessStatusChange">
                <view class="form-select">{{ processStatusLabel }}</view>
              </picker>
            </view>
            <view class="form-field">
              <text class="form-label">执行人账号</text>
              <input v-model="processForm.executeAccount" class="form-input" placeholder="请输入执行人" placeholder-class="input-placeholder" />
            </view>
            <view class="form-field">
              <text class="form-label">完成时间</text>
              <input v-model="processForm.finishTime" class="form-input" type="datetime-local" />
            </view>
            <view class="form-field">
              <text class="form-label">处理反馈</text>
              <textarea v-model="processForm.worksheetFeedback" class="form-textarea" placeholder="请输入处理反馈" placeholder-class="input-placeholder" />
            </view>
            <view class="form-field">
              <text class="form-label">备注</text>
              <textarea v-model="processForm.remark" class="form-textarea" placeholder="请输入备注" placeholder-class="input-placeholder" />
            </view>
            <view class="process-actions">
              <button class="toolbar-button toolbar-button--primary" :disabled="submittingProcess" hover-class="toolbar-button--hover" @click="submitProcess">
                {{ submittingProcess ? "保存中..." : "保存处理" }}
              </button>
              <button class="toolbar-button" :disabled="submittingProcess" hover-class="toolbar-button--hover" @click="markFinished">标记完成</button>
              <button class="toolbar-button toolbar-button--danger" :disabled="submittingProcess" hover-class="toolbar-button--hover" @click="cancelWorksheet">取消工单</button>
            </view>
          </view>

          <view v-if="mode === 'statistics'" class="breakdown-box">
            <text class="process-box__title">分类统计</text>
            <view class="breakdown-section">
              <text class="breakdown-section__title">状态分布</text>
              <view v-for="item in statusBreakdown" :key="item.label" class="breakdown-row">
                <text>{{ item.label }}</text>
                <text>{{ item.count }} 条</text>
              </view>
            </view>
            <view class="breakdown-section">
              <text class="breakdown-section__title">类型分布</text>
              <view v-for="item in typeBreakdown" :key="item.label" class="breakdown-row">
                <text>{{ item.label }}</text>
                <text>{{ item.count }} 条</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { getWorksheetCreatePage } from "@/services/work-order/create";
import { closeWorksheet, getWorksheetProcessDetail, getWorksheetProcessPage, updateWorksheetProcess } from "@/services/work-order/processing";
import { getWorksheetStatisticsPage } from "@/services/work-order/statistics";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";

type WorkOrderMode = "create" | "processing" | "statistics";
type DetailTab = "base" | "content" | "time";
type WorksheetRecord = Record<string, unknown>;
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
  mode: WorkOrderMode;
}>();

const emit = defineEmits<{
  (event: "create"): void;
}>();

const pageTitleMap: Record<WorkOrderMode, string> = {
  create: "工单创建记录",
  processing: "工单处理列表",
  statistics: "工单查询与统计",
};

const worksheetTypeOptions: SelectOption[] = [
  { label: "不限", value: "" },
  { label: "巡检", value: 0 },
  { label: "检漏", value: 1 },
  { label: "拆装", value: 2 },
  { label: "维护", value: 3 },
];

const worksheetStatusOptions: SelectOption[] = [
  { label: "不限", value: "" },
  { label: "待处理", value: 0 },
  { label: "处理中", value: 1 },
  { label: "已完成", value: 2 },
  { label: "已取消", value: 3 },
];

const urgencyOptions: Array<SelectOption<number>> = [
  { label: "一般", value: 0 },
  { label: "紧急", value: 1 },
];
const urgencyFilterOptions: SelectOption[] = [
  { label: "不限", value: "" },
  ...urgencyOptions,
];

const detailTabs: Array<{ label: string; value: DetailTab }> = [
  { label: "工单详情", value: "base" },
  { label: "反馈说明", value: "content" },
  { label: "时间地点", value: "time" },
];

const worksheetTypeOptionsWithoutAll = worksheetTypeOptions.filter((item) => item.value !== "") as Array<{ label: string; value: number }>;
const worksheetStatusOptionsWithoutAll = worksheetStatusOptions.filter((item) => item.value !== "") as Array<{ label: string; value: number }>;

const filters = reactive({
  startTime: "",
  endTime: "",
  worksheetNumber: "",
  worksheetType: "" as number | "",
  worksheetStatus: "" as number | "",
  urgencyLevel: "" as number | "",
  riseAccount: "",
  executeAccount: "",
  deviceReference: "",
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
});

const processForm = reactive({
  worksheetStatus: 1,
  executeAccount: "",
  finishTime: "",
  worksheetFeedback: "",
  remark: "",
});

const worksheets = ref<WorksheetRecord[]>([]);
const selectedWorksheet = ref<WorksheetRecord | null>(null);
const selectedKey = ref("");
const total = ref(0);
const loading = ref(false);
const submittingProcess = ref(false);
const activeTab = ref<DetailTab>("base");

const pageTitle = computed(() => pageTitleMap[props.mode]);
const currentTypeLabel = computed(() => getOptionLabel(worksheetTypeOptions, filters.worksheetType, "不限"));
const currentStatusLabel = computed(() => getOptionLabel(worksheetStatusOptions, filters.worksheetStatus, "不限"));
const currentUrgencyLabel = computed(() => getOptionLabel(urgencyFilterOptions, filters.urgencyLevel, "不限"));
const processStatusLabel = computed(() => getOptionLabel(worksheetStatusOptionsWithoutAll, processForm.worksheetStatus, "处理中"));
const currentTypeIndex = computed(() => getOptionIndex(worksheetTypeOptions, filters.worksheetType));
const currentStatusIndex = computed(() => getOptionIndex(worksheetStatusOptions, filters.worksheetStatus));
const currentUrgencyIndex = computed(() => getOptionIndex(urgencyFilterOptions, filters.urgencyLevel));
const processStatusIndex = computed(() => getOptionIndex(worksheetStatusOptionsWithoutAll, processForm.worksheetStatus));
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pagination.pageSize)));

const baseDetailFields = computed(() => {
  const item = selectedWorksheet.value || {};

  return [
    { label: "工单编号", value: getWorksheetNumber(item) },
    { label: "工单类型", value: getWorksheetTypeLabel(item) },
    { label: "工单状态", value: getWorksheetStatusLabel(item) },
    { label: "紧急程度", value: getUrgencyLabel(item) },
    { label: "发起人", value: getRiseAccount(item) },
    { label: "执行人", value: getExecuteAccount(item) },
    { label: "设备引用", value: getDeviceReference(item) },
    { label: "关联渗漏ID", value: getTextValue(item, ["leakageId"], "-") },
  ];
});
const baseSummary = computed(() => {
  const item = selectedWorksheet.value || {};

  return {
    number: getWorksheetNumber(item),
    status: getWorksheetStatusLabel(item),
    urgency: getUrgencyLabel(item),
  };
});
const secondaryBaseDetailFields = computed(() =>
  baseDetailFields.value.filter((item) => item.label !== "工单编号" && item.label !== "工单状态" && item.label !== "紧急程度"),
);

const contentDetailFields = computed(() => {
  const item = selectedWorksheet.value || {};

  return [
    { label: "工单反馈", value: getWorksheetFeedback(item) },
    { label: "工单说明", value: getWorksheetInstruction(item) },
    { label: "照片ID", value: getTextValue(item, ["pictureIds"], "-") },
    { label: "备注", value: getRemark(item) },
  ];
});

const timeDetailFields = computed(() => {
  const item = selectedWorksheet.value || {};

  return [
    { label: "发起时间", value: getRiseTime(item) },
    { label: "截止时间", value: getDeadlineTime(item) },
    { label: "完成时间", value: getFinishTime(item) },
    { label: "创建时间", value: getCreatedAt(item) },
    { label: "更新时间", value: formatDateTime(getTextValue(item, ["updatedAt"], "-")) },
    { label: "地址", value: getAddress(item) },
    { label: "坐标", value: getTextValue(item, ["coordinate"], "-") },
  ];
});
const timeMomentFields = computed(() => timeDetailFields.value.filter((item) => item.label !== "地址" && item.label !== "坐标"));
const locationDetailFields = computed(() => timeDetailFields.value.filter((item) => item.label === "地址" || item.label === "坐标"));

const statusBreakdown = computed(() => countByOptions(worksheets.value, worksheetStatusOptionsWithoutAll, "worksheetStatus"));
const typeBreakdown = computed(() => countByOptions(worksheets.value, worksheetTypeOptionsWithoutAll, "worksheetType"));
const statisticsCards = computed(() => {
  const doneCount = worksheets.value.filter((item) => Number(getStableValue(item, ["worksheetStatus"])) === 2).length;
  const pendingCount = worksheets.value.filter((item) => Number(getStableValue(item, ["worksheetStatus"])) === 0).length;
  const processingCount = worksheets.value.filter((item) => Number(getStableValue(item, ["worksheetStatus"])) === 1).length;
  const urgentCount = worksheets.value.filter((item) => Number(getStableValue(item, ["urgencyLevel"])) === 1).length;
  const completionRate = worksheets.value.length > 0 ? Math.round((doneCount / worksheets.value.length) * 100) : 0;

  return [
    { label: "筛选结果", value: `${total.value}` },
    { label: "当前页待处理", value: `${pendingCount}` },
    { label: "当前页处理中", value: `${processingCount}` },
    { label: "当前页已完成", value: `${doneCount}` },
    { label: "当前页紧急", value: `${urgentCount}` },
    { label: "当前页完成率", value: `${completionRate}%` },
  ];
});

onMounted(() => {
  void fetchWorksheets();
});

watch(selectedWorksheet, (item) => {
  if (props.mode === "processing") {
    fillProcessForm(item);
  }
});

function handleTypeChange(event: { detail: { value: number } }) {
  filters.worksheetType = worksheetTypeOptions[event.detail.value]?.value ?? "";
}

function handleStatusChange(event: { detail: { value: number } }) {
  filters.worksheetStatus = worksheetStatusOptions[event.detail.value]?.value ?? "";
}

function handleUrgencyChange(event: { detail: { value: number } }) {
  filters.urgencyLevel = urgencyFilterOptions[event.detail.value]?.value ?? "";
}

function handleProcessStatusChange(event: { detail: { value: number } }) {
  processForm.worksheetStatus = worksheetStatusOptionsWithoutAll[event.detail.value]?.value ?? 1;
  if (processForm.worksheetStatus === 2 && !processForm.finishTime) {
    processForm.finishTime = toDatetimeLocal(new Date());
  }
}

function buildQueryParams() {
  if (!validateDateTimeRange()) {
    throw {
      code: -2,
      msg: "时间格式应为 YYYY-MM-DDTHH:mm:ss",
    };
  }

  return {
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    startTime: normalizeDateForApi(filters.startTime, false),
    endTime: normalizeDateForApi(filters.endTime, true),
    sortOrder: "desc",
    sortField: "createdAt",
    worksheetNumber: filters.worksheetNumber.trim() || undefined,
    worksheetType: filters.worksheetType === "" ? undefined : filters.worksheetType,
    worksheetStatus: filters.worksheetStatus === "" ? undefined : filters.worksheetStatus,
    urgencyLevel: filters.urgencyLevel === "" ? undefined : filters.urgencyLevel,
    riseAccount: filters.riseAccount.trim() || undefined,
    executeAccount: filters.executeAccount.trim() || undefined,
    deviceReference: filters.deviceReference.trim() || undefined,
  };
}

function validateDateTimeRange() {
  const pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
  return (!filters.startTime || pattern.test(filters.startTime)) && (!filters.endTime || pattern.test(filters.endTime));
}

async function fetchWorksheets() {
  loading.value = true;

  try {
    const response = await getPageApi()(buildQueryParams()) as ApiResponseLike;
    assertSuccessResponse(response);
    const parsed = parsePageResponse(response);
    worksheets.value = parsed.records;
    total.value = parsed.total;
    selectFirstRow();
  } catch (error) {
    worksheets.value = [];
    total.value = 0;
    selectedWorksheet.value = null;
    selectedKey.value = "";
    uni.showToast({
      title: (error as { msg?: string })?.msg || "工单数据加载失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
}

function getPageApi() {
  const apiMap = {
    create: getWorksheetCreatePage,
    processing: getWorksheetProcessPage,
    statistics: getWorksheetStatisticsPage,
  };

  return apiMap[props.mode];
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

function findPageContainer(value: unknown): WorksheetRecord | null {
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
  if (worksheets.value.length === 0) {
    selectedWorksheet.value = null;
    selectedKey.value = "";
    return;
  }

  const currentId = selectedWorksheet.value ? getRowId(selectedWorksheet.value) : "";
  const matched = currentId ? worksheets.value.find((item) => getRowId(item) === currentId) : null;
  const next = matched || worksheets.value[0];

  selectedWorksheet.value = next;
  selectedKey.value = getRowKey(next, worksheets.value.indexOf(next));
  activeTab.value = "base";
}

async function selectWorksheet(item: WorksheetRecord, index: number) {
  selectedWorksheet.value = item;
  selectedKey.value = getRowKey(item, index);
  activeTab.value = "base";

  const id = getRowId(item);
  if (!id) {
    return;
  }

  try {
    const response = await getWorksheetProcessDetail(id);
    assertSuccessResponse(response);
    if (isObject(response?.data)) {
      selectedWorksheet.value = {
        ...item,
        ...response.data,
      };
    }
  } catch {
    // 详情失败时保留列表数据，避免影响主表格展示。
  }
}

function fillProcessForm(item: WorksheetRecord | null) {
  if (!item) {
    processForm.worksheetStatus = 1;
    processForm.executeAccount = "";
    processForm.finishTime = "";
    processForm.worksheetFeedback = "";
    processForm.remark = "";
    return;
  }

  processForm.worksheetStatus = Number(getStableValue(item, ["worksheetStatus"]) ?? 1);
  processForm.executeAccount = getTextValue(item, ["executeAccount"], "");
  processForm.finishTime = toDatetimeLocal(getTextValue(item, ["finishTime"], ""));
  processForm.worksheetFeedback = getTextValue(item, ["worksheetFeedback"], "");
  processForm.remark = getTextValue(item, ["remark"], "");
}

async function submitProcess() {
  const id = selectedWorksheet.value ? getRowId(selectedWorksheet.value) : "";
  if (!id) {
    uni.showToast({ title: "请先选择工单", icon: "none" });
    return;
  }

  submittingProcess.value = true;

  try {
    const response = await updateWorksheetProcess(id, buildProcessPayload()) as ApiResponseLike;
    assertSuccessResponse(response);
    uni.showToast({ title: "处理已保存", icon: "success" });
    await fetchWorksheets();
  } catch (error) {
    uni.showToast({
      title: (error as { msg?: string })?.msg || "处理保存失败",
      icon: "none",
    });
  } finally {
    submittingProcess.value = false;
  }
}

function buildProcessPayload() {
  return removeEmptyFields({
    worksheetStatus: processForm.worksheetStatus,
    executeAccount: processForm.executeAccount.trim(),
    finishTime: normalizeDatetimeForApi(processForm.finishTime),
    worksheetFeedback: processForm.worksheetFeedback.trim(),
    remark: processForm.remark.trim(),
  });
}

function markFinished() {
  processForm.worksheetStatus = 2;
  if (!processForm.finishTime) {
    processForm.finishTime = toDatetimeLocal(new Date());
  }
  void submitProcess();
}

async function cancelWorksheet() {
  const id = selectedWorksheet.value ? getRowId(selectedWorksheet.value) : "";
  if (!id) {
    uni.showToast({ title: "请先选择工单", icon: "none" });
    return;
  }

  submittingProcess.value = true;

  try {
    const response = await closeWorksheet(id, buildCancelPayload()) as ApiResponseLike;
    assertSuccessResponse(response);
    uni.showToast({ title: "工单已取消", icon: "success" });
    await fetchWorksheets();
  } catch (error) {
    uni.showToast({
      title: (error as { msg?: string })?.msg || "取消工单失败",
      icon: "none",
    });
  } finally {
    submittingProcess.value = false;
  }
}

function buildCancelPayload() {
  return removeEmptyFields({
    executeAccount: processForm.executeAccount.trim(),
    worksheetFeedback: processForm.worksheetFeedback.trim(),
    remark: processForm.remark.trim(),
  });
}

function searchWorksheets() {
  pagination.pageNum = 1;
  void fetchWorksheets();
}

function resetFilters() {
  clearFilters();
  searchWorksheets();
}

function clearFilters() {
  filters.startTime = "";
  filters.endTime = "";
  filters.worksheetNumber = "";
  filters.worksheetType = "";
  filters.worksheetStatus = "";
  filters.urgencyLevel = "";
  filters.riseAccount = "";
  filters.executeAccount = "";
  filters.deviceReference = "";
}

function resetFiltersAndFetch() {
  clearFilters();
  pagination.pageNum = 1;
  return fetchWorksheets();
}

function changePage(step: number) {
  const nextPage = pagination.pageNum + step;
  if (nextPage < 1 || nextPage > totalPages.value) {
    return;
  }

  pagination.pageNum = nextPage;
  void fetchWorksheets();
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

function getRowId(item: WorksheetRecord) {
  const value = getStableValue(item, ["id"]);
  return typeof value === "string" || typeof value === "number" ? value : "";
}

function getRowKey(item: WorksheetRecord, index: number) {
  return String(getRowId(item) || getWorksheetNumber(item) || index);
}

function getWorksheetNumber(item: WorksheetRecord) {
  return getTextValue(item, ["worksheetNumber"], "-");
}

function getWorksheetTypeLabel(item: WorksheetRecord) {
  return getOptionLabel(worksheetTypeOptions, getStableValue(item, ["worksheetType"]), "未知类型");
}

function getWorksheetStatusLabel(item: WorksheetRecord) {
  return getOptionLabel(worksheetStatusOptions, getStableValue(item, ["worksheetStatus"]), "未知状态");
}

function getRiseAccount(item: WorksheetRecord) {
  return getTextValue(item, ["riseAccount"], "-");
}

function getExecuteAccount(item: WorksheetRecord) {
  return getTextValue(item, ["executeAccount"], "-");
}

function getDeviceReference(item: WorksheetRecord) {
  return getTextValue(item, ["deviceReference"], "-");
}

function getUrgencyLabel(item: WorksheetRecord) {
  return getOptionLabel(urgencyOptions, getStableValue(item, ["urgencyLevel"]), "一般");
}

function getRiseTime(item: WorksheetRecord) {
  return formatDateTime(getTextValue(item, ["riseTime"], "-"));
}

function getFinishTime(item: WorksheetRecord) {
  return formatDateTime(getTextValue(item, ["finishTime"], "-"));
}

function getDeadlineTime(item: WorksheetRecord) {
  return formatDateTime(getTextValue(item, ["deadlineTime"], "-"));
}

function getCreatedAt(item: WorksheetRecord) {
  return formatDateTime(getTextValue(item, ["createdAt"], "-"));
}

function getWorksheetFeedback(item: WorksheetRecord) {
  return getTextValue(item, ["worksheetFeedback"], "-");
}

function getWorksheetInstruction(item: WorksheetRecord) {
  return getTextValue(item, ["worksheetInstruction"], "-");
}

function getRemark(item: WorksheetRecord) {
  return getTextValue(item, ["remark"], "-");
}

function getAddress(item: WorksheetRecord) {
  return getTextValue(item, ["address"], "-");
}

function getStatusClass(item: WorksheetRecord) {
  const status = Number(getStableValue(item, ["worksheetStatus"]));

  if (status === 2) {
    return "status-pill--done";
  }

  if (status === 1) {
    return "status-pill--processing";
  }

  if (status === 3) {
    return "status-pill--closed";
  }

  return "status-pill--muted";
}

function getUrgencyClass(item: WorksheetRecord) {
  const level = Number(getStableValue(item, ["urgencyLevel"]));
  return level === 1 ? "urgency-pill--high" : "urgency-pill--normal";
}

function getDetailValueClass(label: string) {
  if (label === "工单状态") {
    return "detail-item__value--status";
  }

  if (label === "紧急程度") {
    return "detail-item__value--level";
  }

  return "";
}

function getOptionLabel(options: SelectOption[], value: unknown, fallback: string) {
  const normalized = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return options.find((item) => item.value === normalized)?.label || fallback;
}

function getOptionIndex(options: SelectOption[], value: unknown) {
  const normalized = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return Math.max(0, options.findIndex((item) => item.value === normalized));
}

function countByOptions(records: WorksheetRecord[], options: Array<{ label: string; value: number }>, key: string) {
  return options.map((option) => ({
    label: option.label,
    count: records.filter((item) => Number(getStableValue(item, [key])) === option.value).length,
  }));
}

function getTextValue(item: WorksheetRecord, keys: string[], fallback = "") {
  const value = getStableValue(item, keys);
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value);
}

function getStableValue(item: WorksheetRecord, keys: string[]) {
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

function isObject(value: unknown): value is WorksheetRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function removeEmptyFields(data: WorksheetRecord) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== "" && value !== undefined && value !== null));
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

function normalizeDatetimeForApi(value: string) {
  if (!value) {
    return undefined;
  }

  const normalizedValue = normalizeDisplayDatetime(value);
  return normalizedValue.includes("T") ? `${normalizedValue.length === 16 ? `${normalizedValue}:00` : normalizedValue}` : normalizedValue;
}

function normalizeDisplayDatetime(value: string) {
  return value.trim().replace(/\s+/, "T");
}

function toDatetimeLocal(value: Date | string) {
  if (!value) {
    return "";
  }

  const date = typeof value === "string" ? new Date(value.replace(" ", "T")) : value;
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}T${padNumber(date.getHours())}:${padNumber(date.getMinutes())}:${padNumber(date.getSeconds())}`;
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

function padNumber(number: number) {
  return String(number).padStart(2, "0");
}

function generateWorksheetNumber() {
  const now = new Date();
  return `WO${now.getFullYear()}${padNumber(now.getMonth() + 1)}${padNumber(now.getDate())}${padNumber(now.getHours())}${padNumber(now.getMinutes())}${padNumber(now.getSeconds())}`;
}

defineExpose({
  fetchWorksheets,
  resetFiltersAndFetch,
});
</script>

<style scoped lang="scss">
.worksheet-view {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding: 0 14px 14px;
  overflow: hidden;
  background: #eef4f8;
}

.worksheet-toolbar,
.worksheet-table-panel,
.worksheet-detail-panel,
.stat-card {
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
}

.pagination-bar,
.table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-field {
  min-width: 0;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  color: #34495e;
  font-size: 13px;
  font-weight: 700;
}

.form-input,
.form-select,
.form-textarea,
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

.form-input,
.form-select,
.filter-input,
.filter-select {
  height: 34px;
  padding: 0 10px;
  line-height: 34px;
}

.filter-input,
.filter-select {
  height: 30px;
  font-size: 13px;
  font-weight: 600;
  line-height: 30px;
}

.toolbar-row--filters .filter-input,
.toolbar-row--filters .filter-select {
  height: 28px;
  line-height: 28px;
}

.form-textarea {
  height: 76px;
  padding: 8px 10px;
  line-height: 1.45;
}

.input-placeholder {
  color: #9aa9b8;
}

.stats-grid {
  flex: none;
  display: grid;
  grid-template-columns: repeat(6, minmax(120px, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.stat-card {
  padding: 12px;
}

.stat-card__label {
  display: block;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.stat-card__value {
  display: block;
  margin-top: 8px;
  color: #183755;
  font-size: 24px;
  font-weight: 900;
}

.worksheet-toolbar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: none;
  gap: 8px;
  min-height: 96px;
  padding: 12px;
  overflow: visible;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 0 0 auto;
}

.toolbar-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.toolbar-row--filters {
  flex-wrap: wrap;
  gap: 8px 16px;
}

.toolbar-row--bottom {
  justify-content: space-between;
  gap: 16px;
}

.toolbar-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 16px;
  min-width: 0;
}

.filter-group--date {
  min-width: 0;
}

.filter-label {
  flex: none;
  color: #34495e;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.filter-input {
  width: 132px;
}

.filter-input--name {
  width: 120px;
}

.filter-input--device {
  width: 142px;
}

.filter-separator {
  color: #8191a2;
  font-size: 13px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-datetime {
  width: 188px;
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
  width: 104px;
}

.filter-select__arrow {
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.toolbar-button,
.toolbar-icon-button {
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

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  justify-content: flex-start;
  width: auto;
  margin-left: 0;
}

.toolbar-filters,
.toolbar-actions {
  align-self: center;
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
  width: 34px;
  padding: 0;
}

.icon-refresh {
  position: relative;
  width: 16px;
  height: 16px;
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

.worksheet-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  flex: 1;
  gap: 14px;
  margin-top: 14px;
  min-height: 0;
}

.worksheet-table-panel,
.worksheet-detail-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
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
  width: 1880px;
  min-width: 1880px;
  background: #ffffff;
}

.data-row {
  display: grid;
  grid-template-columns: 58px 190px 116px 110px 110px 110px 138px 104px 168px 168px 168px 220px 220px;
  min-height: 42px;
  width: 1880px;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
  transition:
    background 0.18s ease,
    box-shadow 0.18s ease;
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
  text-overflow: ellipsis;
  white-space: nowrap;
  border-right: 1px solid #edf1f5;
}

.data-row--header .data-cell {
  color: #415a73;
  font-size: 12px;
  letter-spacing: 0;
}

.data-cell:last-child {
  border-right: 0;
}

.data-cell--index {
  justify-content: center;
  color: #64748b;
}

.data-cell--number {
  color: #0f4c81;
  font-family: "DIN Alternate", "Arial", sans-serif;
  font-weight: 800;
}

.data-cell--address,
.data-cell--remark {
  justify-content: flex-start;
  text-align: left;
}

.status-pill,
.urgency-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  height: 24px;
  padding: 0 9px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  line-height: 24px;
}

.status-pill--processing,
.urgency-pill--high {
  color: #b42318;
  background: #fff1ee;
  border-color: #ffd3cb;
}

.status-pill--done,
.urgency-pill--normal {
  color: #177245;
  background: #eaf8ef;
  border-color: #bfe8ce;
}

.status-pill--closed {
  color: #6941c6;
  background: #f3f0ff;
  border-color: #d8ceff;
}

.status-pill--muted {
  color: #5f7186;
  background: #f3f6f9;
  border-color: #dbe4ec;
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

.detail-summary__badge--status {
  color: #0d5ea6;
  background: #eaf4ff;
  border-color: #cfe7fb;
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
.detail-item--note:nth-child(4) .detail-item__label {
  border-left-color: #cbd5e1;
}

.detail-item__value--status,
.detail-item__value--level {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 24px;
  padding: 0 9px;
  font-size: 13px;
  font-weight: 800;
  line-height: 24px;
  border-radius: 999px;
}

.detail-item__value--status {
  color: #0d5ea6;
  background: #eaf4ff;
}

.detail-item__value--level {
  color: #15803d;
  background: #eaf8ef;
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
  grid-template-columns: 54px minmax(0, 1fr);
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

.process-box,
.breakdown-box {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #edf3f8;
}

.process-box__title {
  display: block;
  margin-bottom: 12px;
  color: #183755;
  font-size: 15px;
  font-weight: 800;
}

.process-box .form-field,
.breakdown-section {
  margin-bottom: 12px;
}

.process-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.breakdown-section__title {
  display: block;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  color: #24384d;
  font-size: 14px;
  border-bottom: 1px solid #edf3f8;
}

@media (max-width: 1280px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .worksheet-layout {
    grid-template-columns: 1fr;
  }

  .worksheet-detail-panel {
    min-height: 360px;
  }
}

@media (max-width: 520px) {
  .detail-grid--base {
    grid-template-columns: 1fr;
  }

  .detail-item--base {
    grid-template-columns: 78px minmax(0, 1fr);
  }

  .detail-grid--content .detail-item {
    grid-template-columns: 1fr;
  }

  .detail-grid--content .detail-item__value {
    border-top: 1px solid #edf3f8;
    border-left: 0;
  }

  .detail-item--note .detail-item__label {
    min-height: 38px;
  }

  .time-row__content,
  .location-row {
    grid-template-columns: 1fr;
    gap: 5px;
  }
}
</style>
