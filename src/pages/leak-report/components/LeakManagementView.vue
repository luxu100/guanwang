<template>
  <view class="leak-management-view">
    <!-- 筛选栏 -->
    <view class="toolbar">
      <view class="toolbar-row toolbar-row--filters">
        <view class="filter-group">
          <text class="filter-label">检出时间</text>
          <view class="date-range">
            <WorkOrderDatetimePicker v-model="filters.startTime" class="filter-datetime" title="选择开始时间" placeholder="请选择开始时间" />
            <text class="filter-separator">至</text>
            <WorkOrderDatetimePicker v-model="filters.endTime" class="filter-datetime" title="选择结束时间" placeholder="请选择结束时间" />
          </view>
        </view>

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
          <input v-model="filters.detectAccount" class="filter-input" placeholder="请输入检出人" placeholder-class="input-placeholder" />
        </view>
      </view>

      <view class="toolbar-row toolbar-row--bottom">
        <view class="toolbar-actions">
          <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="searchLeakPoints">查询</button>
          <button class="toolbar-button" hover-class="toolbar-button--hover" @click="resetFilters">重置</button>
          <button class="toolbar-icon-button" hover-class="toolbar-icon-button--hover" aria-label="刷新" @click="fetchLeakPoints">
            <text class="icon-refresh"></text>
          </button>
        </view>
        <view class="toolbar-actions toolbar-actions--right">
          <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="openCreateDialog">新增漏点</button>
          <button class="toolbar-button toolbar-button--danger" hover-class="toolbar-button--hover" :disabled="selectedIds.length === 0" @click="handleBatchDelete">批量删除</button>
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

    <!-- 主内容区：表格 + 详情 -->
    <view class="main-layout">
      <!-- 左侧表格 -->
      <view class="table-panel">
        <view class="table-head">
          <text>漏点列表</text>
          <text class="table-head__meta">共 {{ total }} 条</text>
        </view>

        <scroll-view class="table-scroll" scroll-x scroll-y>
          <view class="data-table">
            <view class="data-row data-row--header">
              <view class="data-cell data-cell--checkbox">
                <view v-if="allSelectable" class="checkbox" :class="{ 'checkbox--checked': isAllSelected }" @click.stop="toggleSelectAll">
                  <text v-if="isAllSelected" class="checkbox__mark"></text>
                </view>
              </view>
              <text class="data-cell data-cell--index">序号</text>
              <text class="data-cell data-cell--time">检出时间</text>
              <text class="data-cell data-cell--level">渗漏级别</text>
              <text class="data-cell data-cell--address">漏点位置</text>
              <text class="data-cell data-cell--part">泄漏部位</text>
              <text class="data-cell data-cell--account">检出人</text>
              <text class="data-cell data-cell--material">管道材质</text>
              <text class="data-cell data-cell--bore">管道口径</text>
              <text class="data-cell data-cell--depth">管道埋深</text>
            </view>

            <view v-if="loading" class="table-state">加载中...</view>
            <view v-else-if="records.length === 0" class="table-state">暂无漏点数据</view>

            <view
              v-for="(item, index) in records"
              v-else
              :key="getRowKey(item, index)"
              class="data-row"
              :class="{ 'data-row--active': selectedRecordKey === getRowKey(item, index) }"
              @click="selectRecord(item, index)"
            >
              <view class="data-cell data-cell--checkbox" @click.stop="toggleSelectItem(item)">
                <view v-if="allSelectable" class="checkbox" :class="{ 'checkbox--checked': isItemSelected(item) }">
                  <text v-if="isItemSelected(item)" class="checkbox__mark"></text>
                </view>
              </view>
              <text class="data-cell data-cell--index">{{ (pagination.pageNum - 1) * pagination.pageSize + index + 1 }}</text>
              <text class="data-cell data-cell--time">{{ formatDateTime(getFieldValue(item, "detectedTime")) }}</text>
              <text class="data-cell data-cell--level">
                <text class="level-pill" :class="getLeakLevelClass(item)">{{ getLeakLevelLabel(item) }}</text>
              </text>
              <text class="data-cell data-cell--address">{{ getFieldValue(item, "leakAddress") || "-" }}</text>
              <text class="data-cell data-cell--part">{{ getFieldValue(item, "leakPart") || "-" }}</text>
              <text class="data-cell data-cell--account">{{ getFieldValue(item, "detectAccount") || "-" }}</text>
              <text class="data-cell data-cell--material">{{ getFieldValue(item, "tubeMaterial") || "-" }}</text>
              <text class="data-cell data-cell--bore">{{ getFieldValue(item, "tubeBore") || "-" }}</text>
              <text class="data-cell data-cell--depth">{{ getFieldValue(item, "tubeDepth") || "-" }}</text>
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
        <view v-if="!selectedRecord" class="detail-empty">请选择左侧漏点查看详情</view>
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

          <!-- 基本信息 -->
          <view v-if="activeDetailTab === 'base'" class="detail-section">
            <view class="detail-summary">
              <view class="detail-summary__main">
                <text class="detail-summary__label">漏点位置</text>
                <text class="detail-summary__value">{{ getFieldValue(selectedRecord, "leakAddress") || "-" }}</text>
              </view>
              <view class="detail-summary__badges">
                <text class="detail-summary__badge" :class="getLeakLevelBadgeClass(selectedRecord)">{{ getLeakLevelLabel(selectedRecord) }}</text>
              </view>
            </view>
            <view class="detail-grid">
              <view v-for="item in baseDetailFields" :key="item.label" class="detail-item">
                <text class="detail-item__label">{{ item.label }}</text>
                <text class="detail-item__value">{{ item.value }}</text>
              </view>
            </view>
          </view>

          <!-- 管道信息 -->
          <view v-if="activeDetailTab === 'pipe'" class="detail-section">
            <view class="detail-grid">
              <view v-for="item in pipeDetailFields" :key="item.label" class="detail-item">
                <text class="detail-item__label">{{ item.label }}</text>
                <text class="detail-item__value">{{ item.value }}</text>
              </view>
            </view>
          </view>

          <!-- 附件/备注 -->
          <view v-if="activeDetailTab === 'attach'" class="detail-section">
            <view class="detail-grid">
              <view v-for="item in attachDetailFields" :key="item.label" class="detail-item detail-item--note">
                <text class="detail-item__label">{{ item.label }}</text>
                <text class="detail-item__value">{{ item.value }}</text>
              </view>
            </view>
          </view>

          <!-- 操作按钮 -->
          <view class="detail-actions">
            <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="openEditDialog">编辑</button>
            <button class="toolbar-button toolbar-button--danger" hover-class="toolbar-button--hover" @click="handleDelete">删除</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 新增/编辑弹窗 -->
    <view v-if="dialogVisible" class="dialog-mask" @click="closeDialog">
      <view class="dialog-panel" @click.stop>
        <view class="dialog-head">
          <text class="dialog-title">{{ isEditing ? "编辑漏点" : "新增漏点" }}</text>
          <button class="dialog-close" hover-class="dialog-close--hover" @click="closeDialog">
            <text class="dialog-close__icon"></text>
          </button>
        </view>

        <scroll-view class="dialog-body" scroll-y>
          <view class="form-field">
            <text class="form-label required">检出时间</text>
            <WorkOrderDatetimePicker v-model="form.detectedTime" title="选择检出时间" placeholder="请选择检出时间" :clearable="false" />
          </view>
          <view class="form-field">
            <text class="form-label required">渗漏级别</text>
            <picker :range="leakLevelOptionsWithoutAll" range-key="label" @change="handleFormLeakLevelChange">
              <view class="form-select">{{ formLeakLevelLabel }}</view>
            </picker>
          </view>
          <view class="form-field">
            <text class="form-label">漏点位置</text>
            <textarea v-model="form.leakAddress" class="form-textarea" placeholder="请输入漏点位置" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">渗漏坐标</text>
            <input v-model="form.leakCoordinate" class="form-input" placeholder="请输入坐标" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">泄漏部位</text>
            <input v-model="form.leakPart" class="form-input" placeholder="请输入泄漏部位" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">管道材质</text>
            <input v-model="form.tubeMaterial" class="form-input" placeholder="请输入管道材质" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">管道口径</text>
            <input v-model="form.tubeBore" class="form-input" placeholder="请输入管道口径" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">管道埋深</text>
            <input v-model="form.tubeDepth" class="form-input" placeholder="请输入管道埋深" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">检出人</text>
            <input v-model="form.detectAccount" class="form-input" placeholder="请输入检出人" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">关联设备</text>
            <input v-model="form.referenceDevices" class="form-input" placeholder="请输入关联设备编号" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">关联工单ID</text>
            <input v-model="form.referenceWorksheetId" class="form-input" type="number" placeholder="请输入关联工单ID" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">最近设备距离</text>
            <input v-model="form.closestDeviceDistance" class="form-input" placeholder="请输入距离" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">关联音频</text>
            <input v-model="form.referenceAudio" class="form-input" placeholder="请输入音频ID" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">渗漏照片</text>
            <input v-model="form.leakPicture" class="form-input" placeholder="请输入照片ID" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">备注</text>
            <textarea v-model="form.remark" class="form-textarea" placeholder="请输入备注" placeholder-class="input-placeholder" />
          </view>
        </scroll-view>

        <view class="dialog-footer">
          <button class="toolbar-button" hover-class="toolbar-button--hover" @click="closeDialog">取消</button>
          <button class="toolbar-button toolbar-button--primary" :disabled="submitting" hover-class="toolbar-button--hover" @click="submitForm">
            {{ submitting ? "提交中..." : "确定" }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from "vue";
import {
  getLeakPointPage,
  getLeakPointDetail,
  createLeakPoint,
  updateLeakPoint,
  deleteLeakPoint,
  batchDeleteLeakPoint,
} from "@/services/leak-report/leak-management";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";

type LeakPointRecord = Record<string, unknown>;
type DetailTab = "base" | "pipe" | "attach";
type LeakLevelOption = { label: string; value: number | "" };

interface ApiResponseLike {
  code?: number;
  data?: unknown;
  records?: unknown[];
  rows?: unknown[];
  total?: number;
  msg?: string;
}

const leakLevelOptions: LeakLevelOption[] = [
  { label: "不限", value: "" },
  { label: "轻度", value: 0 },
  { label: "中度", value: 1 },
  { label: "重度", value: 2 },
];

const leakLevelOptionsWithoutAll = leakLevelOptions.filter((o) => o.value !== "") as Array<{ label: string; value: number }>;

const detailTabs: Array<{ label: string; value: DetailTab }> = [
  { label: "基本信息", value: "base" },
  { label: "管道信息", value: "pipe" },
  { label: "附件备注", value: "attach" },
];

const filters = reactive({
  startTime: "",
  endTime: "",
  leakLevel: "" as number | "",
  detectAccount: "",
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
});

const records = ref<LeakPointRecord[]>([]);
const selectedRecord = ref<LeakPointRecord | null>(null);
const selectedRecordKey = ref("");
const selectedIds = ref<Set<string>>(new Set());
const total = ref(0);
const loading = ref(false);

const dialogVisible = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const activeDetailTab = ref<DetailTab>("base");

const form = reactive({
  detectedTime: "",
  leakAddress: "",
  leakCoordinate: "",
  leakLevel: 0,
  leakPart: "",
  tubeMaterial: "",
  tubeBore: "",
  tubeDepth: "",
  detectAccount: "",
  referenceDevices: "",
  referenceWorksheetId: "",
  closestDeviceDistance: "",
  referenceAudio: "",
  leakPicture: "",
  remark: "",
});

const currentLeakLevelLabel = computed(() =>
  leakLevelOptions.find((o) => o.value === filters.leakLevel)?.label || "不限",
);

const formLeakLevelLabel = computed(() =>
  leakLevelOptionsWithoutAll.find((o) => o.value === form.leakLevel)?.label || "轻度",
);

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pagination.pageSize)));

const allSelectable = computed(() => records.value.length > 0);
const isAllSelected = computed(() => records.value.length > 0 && records.value.every((item) => isItemSelected(item)));
const noSelection = computed(() => selectedIds.value.size === 0);

const statisticsCards = computed(() => {
  const lightCount = records.value.filter((r) => Number(getFieldValue(r, "leakLevel")) === 0).length;
  const mediumCount = records.value.filter((r) => Number(getFieldValue(r, "leakLevel")) === 1).length;
  const heavyCount = records.value.filter((r) => Number(getFieldValue(r, "leakLevel")) === 2).length;

  return [
    { label: "总记录数", value: String(total.value) },
    { label: "轻度", value: String(lightCount) },
    { label: "中度", value: String(mediumCount) },
    { label: "重度", value: String(heavyCount) },
  ];
});

const baseDetailFields = computed(() => {
  const r = selectedRecord.value || {};
  return [
    { label: "检出时间", value: formatDateTime(getFieldValue(r, "detectedTime") || "-") },
    { label: "渗漏级别", value: getLeakLevelLabel(r) },
    { label: "漏点位置", value: getFieldValue(r, "leakAddress") || "-" },
    { label: "渗漏坐标", value: getFieldValue(r, "leakCoordinate") || "-" },
    { label: "泄漏部位", value: getFieldValue(r, "leakPart") || "-" },
    { label: "检出人", value: getFieldValue(r, "detectAccount") || "-" },
    { label: "最近设备距离", value: getFieldValue(r, "closestDeviceDistance") || "-" },
    { label: "关联工单ID", value: getFieldValue(r, "referenceWorksheetId") || "-" },
    { label: "关联设备", value: getFieldValue(r, "referenceDevices") || "-" },
    { label: "创建时间", value: formatDateTime(getFieldValue(r, "createdAt") || "-") },
    { label: "更新时间", value: formatDateTime(getFieldValue(r, "updatedAt") || "-") },
  ];
});

const pipeDetailFields = computed(() => {
  const r = selectedRecord.value || {};
  return [
    { label: "管道材质", value: getFieldValue(r, "tubeMaterial") || "-" },
    { label: "管道口径", value: getFieldValue(r, "tubeBore") || "-" },
    { label: "管道埋深", value: getFieldValue(r, "tubeDepth") || "-" },
  ];
});

const attachDetailFields = computed(() => {
  const r = selectedRecord.value || {};
  return [
    { label: "关联音频", value: getFieldValue(r, "referenceAudio") || "-" },
    { label: "渗漏照片", value: getFieldValue(r, "leakPicture") || "-" },
    { label: "备注", value: getFieldValue(r, "remark") || "-" },
  ];
});

onMounted(() => {
  fetchLeakPoints();
});

function handleLeakLevelChange(event: { detail: { value: number } }) {
  filters.leakLevel = leakLevelOptions[event.detail.value]?.value ?? "";
}

function handleFormLeakLevelChange(event: { detail: { value: number } }) {
  form.leakLevel = leakLevelOptionsWithoutAll[event.detail.value]?.value ?? 0;
}

function buildQueryParams() {
  return removeEmptyFields({
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    startTime: normalizeDateForApi(filters.startTime, false),
    endTime: normalizeDateForApi(filters.endTime, true),
    sortOrder: "desc",
    sortField: "detectedTime",
    leakLevel: filters.leakLevel === "" ? undefined : filters.leakLevel,
    detectAccount: filters.detectAccount.trim() || undefined,
  });
}

async function fetchLeakPoints() {
  loading.value = true;
  try {
    const response = (await getLeakPointPage(buildQueryParams())) as ApiResponseLike;
    assertSuccessResponse(response);
    const parsed = parsePageResponse(response);
    records.value = parsed.records;
    total.value = parsed.total;
    selectedIds.value = new Set();
    selectFirstRow();
  } catch (error) {
    records.value = [];
    total.value = 0;
    selectedRecord.value = null;
    selectedRecordKey.value = "";
    uni.showToast({ title: (error as { msg?: string })?.msg || "漏点数据加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function searchLeakPoints() {
  pagination.pageNum = 1;
  fetchLeakPoints();
}

function resetFilters() {
  filters.startTime = "";
  filters.endTime = "";
  filters.leakLevel = "";
  filters.detectAccount = "";
  searchLeakPoints();
}

function changePage(step: number) {
  const nextPage = pagination.pageNum + step;
  if (nextPage < 1 || nextPage > totalPages.value) return;
  pagination.pageNum = nextPage;
  fetchLeakPoints();
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
  activeDetailTab.value = "base";
}

function selectRecord(item: LeakPointRecord, index: number) {
  selectedRecord.value = item;
  selectedRecordKey.value = getRowKey(item, index);
  activeDetailTab.value = "base";

  const id = getRowId(item);
  if (!id) return;

  getLeakPointDetail(id)
    .then((response: unknown) => {
      assertSuccessResponse(response as ApiResponseLike);
      if (isObject((response as ApiResponseLike)?.data)) {
        selectedRecord.value = { ...item, ...(response as ApiResponseLike).data };
      }
    })
    .catch(() => {});
}

function isItemSelected(item: LeakPointRecord) {
  return selectedIds.value.has(getRowKey(item, records.value.indexOf(item)));
}

function toggleSelectItem(item: LeakPointRecord) {
  const key = getRowKey(item, records.value.indexOf(item));
  const newSet = new Set(selectedIds.value);
  if (newSet.has(key)) {
    newSet.delete(key);
  } else {
    newSet.add(key);
  }
  selectedIds.value = newSet;
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = new Set();
  } else {
    selectedIds.value = new Set(records.value.map((r, i) => getRowKey(r, i)));
  }
}

function openCreateDialog() {
  isEditing.value = false;
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog() {
  if (!selectedRecord.value) {
    uni.showToast({ title: "请先选择漏点记录", icon: "none" });
    return;
  }
  isEditing.value = true;
  fillFormFromRecord(selectedRecord.value);
  dialogVisible.value = true;
}

function closeDialog() {
  dialogVisible.value = false;
}

function resetForm() {
  form.detectedTime = "";
  form.leakLevel = 0;
  form.leakAddress = "";
  form.leakCoordinate = "";
  form.leakPart = "";
  form.tubeMaterial = "";
  form.tubeBore = "";
  form.tubeDepth = "";
  form.detectAccount = "";
  form.referenceDevices = "";
  form.referenceWorksheetId = "";
  form.closestDeviceDistance = "";
  form.referenceAudio = "";
  form.leakPicture = "";
  form.remark = "";
}

function fillFormFromRecord(item: LeakPointRecord) {
  form.detectedTime = toDatetimeLocal(getFieldValue(item, "detectedTime") || "");
  form.leakLevel = Number(getFieldValue(item, "leakLevel")) ?? 0;
  form.leakAddress = String(getFieldValue(item, "leakAddress") || "");
  form.leakCoordinate = String(getFieldValue(item, "leakCoordinate") || "");
  form.leakPart = String(getFieldValue(item, "leakPart") || "");
  form.tubeMaterial = String(getFieldValue(item, "tubeMaterial") || "");
  form.tubeBore = String(getFieldValue(item, "tubeBore") || "");
  form.tubeDepth = String(getFieldValue(item, "tubeDepth") || "");
  form.detectAccount = String(getFieldValue(item, "detectAccount") || "");
  form.referenceDevices = String(getFieldValue(item, "referenceDevices") || "");
  form.referenceWorksheetId = String(getFieldValue(item, "referenceWorksheetId") || "");
  form.closestDeviceDistance = String(getFieldValue(item, "closestDeviceDistance") || "");
  form.referenceAudio = String(getFieldValue(item, "referenceAudio") || "");
  form.leakPicture = String(getFieldValue(item, "leakPicture") || "");
  form.remark = String(getFieldValue(item, "remark") || "");
}

function buildFormPayload() {
  return removeEmptyFields({
    detectedTime: normalizeDatetimeForApi(form.detectedTime),
    leakLevel: form.leakLevel,
    leakAddress: form.leakAddress.trim(),
    leakCoordinate: form.leakCoordinate.trim(),
    leakPart: form.leakPart.trim(),
    tubeMaterial: form.tubeMaterial.trim(),
    tubeBore: form.tubeBore.trim(),
    tubeDepth: form.tubeDepth.trim(),
    detectAccount: form.detectAccount.trim(),
    referenceDevices: form.referenceDevices.trim(),
    referenceWorksheetId: form.referenceWorksheetId ? Number(form.referenceWorksheetId) : undefined,
    closestDeviceDistance: form.closestDeviceDistance.trim(),
    referenceAudio: form.referenceAudio.trim(),
    leakPicture: form.leakPicture.trim(),
    remark: form.remark.trim(),
  });
}

async function submitForm() {
  if (!form.detectedTime) {
    uni.showToast({ title: "请选择检出时间", icon: "none" });
    return;
  }
  submitting.value = true;
  try {
    const payload = buildFormPayload();
    let response: ApiResponseLike;
    if (isEditing.value) {
      const id = selectedRecord.value ? getRowId(selectedRecord.value) : "";
      if (!id) {
        uni.showToast({ title: "编辑失败：无法获取记录ID", icon: "none" });
        return;
      }
      response = (await updateLeakPoint(id, payload)) as ApiResponseLike;
    } else {
      response = (await createLeakPoint(payload)) as ApiResponseLike;
    }
    assertSuccessResponse(response);
    uni.showToast({ title: isEditing.value ? "编辑成功" : "新增成功", icon: "success" });
    closeDialog();
    fetchLeakPoints();
  } catch (error) {
    uni.showToast({ title: (error as { msg?: string })?.msg || "提交失败", icon: "none" });
  } finally {
    submitting.value = false;
  }
}

async function handleDelete() {
  if (!selectedRecord.value) {
    uni.showToast({ title: "请先选择漏点记录", icon: "none" });
    return;
  }
  const id = getRowId(selectedRecord.value);
  if (!id) return;
  try {
    const response = (await deleteLeakPoint(id)) as ApiResponseLike;
    assertSuccessResponse(response);
    uni.showToast({ title: "删除成功", icon: "success" });
    selectedRecord.value = null;
    selectedRecordKey.value = "";
    fetchLeakPoints();
  } catch (error) {
    uni.showToast({ title: (error as { msg?: string })?.msg || "删除失败", icon: "none" });
  }
}

async function handleBatchDelete() {
  if (noSelection.value) return;
  const ids = Array.from(selectedIds.value)
    .map((key) => {
      const index = records.value.findIndex((r, i) => getRowKey(r, i) === key);
      return index >= 0 ? getRowId(records.value[index]) : "";
    })
    .filter(Boolean);
  if (ids.length === 0) return;
  try {
    const response = (await batchDeleteLeakPoint(ids)) as ApiResponseLike;
    assertSuccessResponse(response);
    uni.showToast({ title: `已删除 ${ids.length} 条记录`, icon: "success" });
    selectedIds.value = new Set();
    fetchLeakPoints();
  } catch (error) {
    uni.showToast({ title: (error as { msg?: string })?.msg || "批量删除失败", icon: "none" });
  }
}

// --- helpers ---

function getRowId(item: LeakPointRecord) {
  const v = getFieldValue(item, "id");
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
}

function getRowKey(item: LeakPointRecord, index: number) {
  return getRowId(item) || String(index);
}

function getFieldValue(item: LeakPointRecord, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(item, key) ? item[key] : undefined;
}

function getLeakLevelLabel(item: LeakPointRecord) {
  const val = Number(getFieldValue(item, "leakLevel"));
  if (val === 0) return "轻度";
  if (val === 1) return "中度";
  if (val === 2) return "重度";
  return "未知";
}

function getLeakLevelClass(item: LeakPointRecord) {
  const val = Number(getFieldValue(item, "leakLevel"));
  if (val === 0) return "level-pill--light";
  if (val === 1) return "level-pill--medium";
  if (val === 2) return "level-pill--heavy";
  return "";
}

function getLeakLevelBadgeClass(item: LeakPointRecord) {
  const val = Number(getFieldValue(item, "leakLevel"));
  if (val === 0) return "detail-summary__badge--light";
  if (val === 1) return "detail-summary__badge--medium";
  if (val === 2) return "detail-summary__badge--heavy";
  return "";
}

function formatDateTime(value: string) {
  if (!value || value === "-") return value || "-";
  return value.replace("T", " ").replace(/\.\d+/, "").replace(/(?:Z|[+-]\d{2}:?\d{2})$/, "");
}

function toDatetimeLocal(value: string | Date) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value.replace(" ", "T")) : value;
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function normalizeDateForApi(value: string, isEnd: boolean) {
  if (!value) return undefined;
  const nv = value.trim().replace(/\s+/, "T");
  if (nv.includes("T")) return nv.length === 16 ? `${nv}:00` : nv;
  return `${nv}T${isEnd ? "23:59:59" : "00:00:00"}`;
}

function normalizeDatetimeForApi(value: string) {
  if (!value) return undefined;
  const nv = value.trim().replace(/\s+/, "T");
  return nv.includes("T") ? (nv.length === 16 ? `${nv}:00` : nv) : nv;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
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

function findPageContainer(value: unknown): LeakPointRecord | null {
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
.leak-management-view {
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

.toolbar-actions--right {
  margin-left: auto;
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

.toolbar-button--danger {
  color: #e74c3c;
  border-color: #e74c3c;
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
  min-width: 860px;
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

.data-cell--checkbox { width: 40px; display: flex; align-items: center; justify-content: center; }
.data-cell--index { width: 52px; text-align: center; }
.data-cell--time { width: 150px; }
.data-cell--level { width: 80px; }
.data-cell--address { width: 160px; }
.data-cell--part { width: 100px; }
.data-cell--account { width: 100px; }
.data-cell--material { width: 90px; }
.data-cell--bore { width: 90px; }
.data-cell--depth { width: 90px; }

.checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 2px solid #cdd7e4;
  border-radius: 4px;
  cursor: pointer;
}

.checkbox--checked {
  background: #0d82ee;
  border-color: #0d82ee;
}

.checkbox__mark {
  display: block;
  width: 6px;
  height: 10px;
  border-right: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(45deg) translate(-1px, -1px);
}

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

.detail-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid #edf3f8;
}

.detail-summary__main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-summary__label {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.detail-summary__value {
  color: #172033;
  font-size: 16px;
  font-weight: 900;
}

.detail-summary__badges {
  display: flex;
  gap: 8px;
}

.detail-summary__badge {
  display: inline-block;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 10px;
  background: #edf5ff;
  color: #0d82ee;
}

.detail-summary__badge--light { color: #16a34a; background: #dcfce7; }
.detail-summary__badge--medium { color: #d97706; background: #fef3c7; }
.detail-summary__badge--heavy { color: #dc2626; background: #fee2e2; }

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

.detail-item--note {
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f7fc;
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

.detail-actions {
  display: flex;
  gap: 10px;
  flex: none;
  padding: 12px 14px;
  border-top: 1px solid #edf3f8;
}

// dialog
.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 35, 55, 0.22);
}

.dialog-panel {
  display: flex;
  flex-direction: column;
  width: min(520px, calc(100vw - 32px));
  max-height: 80vh;
  overflow: hidden;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 18px 42px rgba(15, 35, 55, 0.2);
}

.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  padding: 16px 20px;
  border-bottom: 1px solid #edf3f8;
}

.dialog-title {
  color: #183755;
  font-size: 16px;
  font-weight: 900;
}

.dialog-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}

.dialog-close--hover { background: #edf5ff; }

.dialog-close__icon {
  display: block;
  position: relative;
  width: 16px;
  height: 16px;
}
.dialog-close__icon::before,
.dialog-close__icon::after {
  content: "";
  position: absolute;
  top: 7px;
  left: 0;
  width: 16px;
  height: 2px;
  background: #7f8fa3;
}

.dialog-close__icon::before { transform: rotate(45deg); }
.dialog-close__icon::after { transform: rotate(-45deg); }

.dialog-body {
  flex: 1;
  min-height: 0;
  padding: 16px 20px;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex: none;
  padding: 14px 20px;
  border-top: 1px solid #edf3f8;
}

.form-field {
  margin-bottom: 14px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  color: #183755;
  font-size: 13px;
  font-weight: 700;
}

.form-label.required::after {
  content: " *";
  color: #dc2626;
}

.form-input,
.form-textarea,
.form-select {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 12px;
  color: #172033;
  font-size: 14px;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 6px;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #7f8fa3;
}

.form-textarea {
  min-height: 72px;
  resize: vertical;
}

.form-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 42px;
  cursor: pointer;
}

.form-select::after {
  content: "";
  width: 0;
  height: 0;
  border-top: 5px solid #7f8fa3;
  border-right: 5px solid transparent;
  border-left: 5px solid transparent;
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