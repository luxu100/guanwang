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
          <button class="toolbar-icon-button" hover-class="toolbar-icon-button--hover" aria-label="刷新" @click="fetchLeakPoints"><text class="icon-refresh"></text></button>
        </view>
        <view class="toolbar-actions toolbar-actions--right">
          <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="handleExport">导出</button>
          <button class="toolbar-button" hover-class="toolbar-button--hover" @click="handleImport">导入</button>
          <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="openCreateDialog">新增漏点</button>
          <button class="toolbar-button toolbar-button--danger" hover-class="toolbar-button--hover" :disabled="selectedIds.size === 0" @click="handleBatchDelete">批量删除</button>
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

    <!-- 表格 + 详情 -->
    <view class="main-layout">
      <view class="table-panel">
        <view class="table-head"><text>漏点列表</text><text class="table-head__meta">共 {{ total }} 条</text></view>
        <scroll-view class="table-scroll" scroll-x scroll-y>
          <view class="data-table">
            <view class="data-row data-row--header">
              <view class="data-cell data-cell--checkbox">
                <view v-if="allSelectable" class="checkbox" :class="{ 'checkbox--checked': isAllSelected }" @click.stop="toggleSelectAll"><text v-if="isAllSelected" class="checkbox__mark"></text></view>
              </view>
              <text class="data-cell data-cell--index">序号</text>
              <text class="data-cell data-cell--time data-cell--sortable" @click.stop="toggleSort('detectedTime')">检出时间<text class="sort-arrow sort-arrow--active" v-if="sortField === 'detectedTime'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</text><text class="sort-arrow" v-else></text></text>
              <text class="data-cell data-cell--level data-cell--sortable" @click.stop="toggleSort('leakLevel')">渗漏级别<text class="sort-arrow sort-arrow--active" v-if="sortField === 'leakLevel'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</text><text class="sort-arrow" v-else></text></text>
              <text class="data-cell data-cell--address">漏点位置</text>
              <text class="data-cell data-cell--part">泄漏部位</text>
              <text class="data-cell data-cell--coord">渗漏坐标</text>
              <text class="data-cell data-cell--account">检出人</text>
              <text class="data-cell data-cell--material">管道材质</text>
              <text class="data-cell data-cell--bore">管道口径</text>
              <text class="data-cell data-cell--depth">管道埋深</text>
              <text class="data-cell data-cell--wsid">关联工单</text>
              <text class="data-cell data-cell--devices">关联设备</text>
              <text class="data-cell data-cell--distance">最近设备距离</text>
              <text class="data-cell data-cell--remark">备注</text>
              <text class="data-cell data-cell--created">创建时间</text>
            </view>
            <view v-if="loading" class="table-state">加载中...</view>
            <view v-else-if="records.length === 0" class="table-state">暂无漏点数据</view>
            <view v-for="(item, index) in records" v-else :key="getRowKey(item, index)" class="data-row data-row--body" :class="{ 'data-row--active': selectedRecordKey === getRowKey(item, index) }" @click="selectRecord(item, index)">
              <view class="data-cell data-cell--checkbox" @click.stop="toggleSelectItem(item)">
                <view v-if="allSelectable" class="checkbox" :class="{ 'checkbox--checked': isItemSelected(item) }"><text v-if="isItemSelected(item)" class="checkbox__mark"></text></view>
              </view>
              <text class="data-cell data-cell--index">{{ (pagination.pageNum - 1) * pagination.pageSize + index + 1 }}</text>
              <text class="data-cell data-cell--time">{{ formatDateTime(getFieldValue(item, "detectedTime")) }}</text>
              <text class="data-cell data-cell--level"><text class="level-pill" :class="getLeakLevelClass(item)">{{ getLeakLevelLabel(item) }}</text></text>
              <text class="data-cell data-cell--address">{{ getFieldValue(item, "leakAddress") || "-" }}</text>
              <text class="data-cell data-cell--part">{{ getFieldValue(item, "leakPart") || "-" }}</text>
              <text class="data-cell data-cell--coord">{{ getFieldValue(item, "leakCoordinate") || "-" }}</text>
              <text class="data-cell data-cell--account">{{ getFieldValue(item, "detectAccount") || "-" }}</text>
              <text class="data-cell data-cell--material">{{ getFieldValue(item, "tubeMaterial") || "-" }}</text>
              <text class="data-cell data-cell--bore">{{ getFieldValue(item, "tubeBore") || "-" }}</text>
              <text class="data-cell data-cell--depth">{{ getFieldValue(item, "tubeDepth") || "-" }}</text>
              <text class="data-cell data-cell--wsid">{{ getFieldValue(item, "referenceWorksheetId") || "-" }}</text>
              <text class="data-cell data-cell--devices">{{ getFieldValue(item, "referenceDevices") || "-" }}</text>
              <text class="data-cell data-cell--distance">{{ getFieldValue(item, "closestDeviceDistance") || "-" }}</text>
              <text class="data-cell data-cell--remark">{{ getFieldValue(item, "remark") || "-" }}</text>
              <text class="data-cell data-cell--created">{{ formatDateTime(getFieldValue(item, "createdAt")) }}</text>
            </view>
          </view>
        </scroll-view>
        <view class="pagination-bar">
          <button class="page-button" hover-class="page-button--hover" :disabled="pagination.pageNum <= 1" @click="changePage(-1)">上一页</button>
          <text class="page-info">第 {{ pagination.pageNum }} / {{ totalPages }} 页</text>
          <button class="page-button" hover-class="page-button--hover" :disabled="pagination.pageNum >= totalPages" @click="changePage(1)">下一页</button>
        </view>
      </view>
      <view class="detail-panel">
        <view v-if="!selectedRecord" class="detail-empty">请选择左侧漏点查看详情</view>
        <view v-else class="detail-body">
          <view class="detail-tabs">
            <view v-for="tab in detailTabs" :key="tab.value" class="detail-tab" :class="{ 'detail-tab--active': activeDetailTab === tab.value }" @click="activeDetailTab = tab.value">{{ tab.label }}</view>
          </view>
          <view v-if="activeDetailTab === 'base'" class="detail-section">
            <view class="detail-summary">
              <view class="detail-summary__main"><text class="detail-summary__label">漏点位置</text><text class="detail-summary__value">{{ getFieldValue(selectedRecord, "leakAddress") || "-" }}</text></view>
              <view class="detail-summary__badges"><text class="detail-summary__badge" :class="getLeakLevelBadgeClass(selectedRecord)">{{ getLeakLevelLabel(selectedRecord) }}</text></view>
            </view>
            <view class="detail-grid"><view v-for="item in baseDetailFields" :key="item.label" class="detail-item"><text class="detail-item__label">{{ item.label }}</text><text class="detail-item__value">{{ item.value }}</text></view></view>
          </view>
          <view v-if="activeDetailTab === 'pipe'" class="detail-section">
            <view class="detail-grid"><view v-for="item in pipeDetailFields" :key="item.label" class="detail-item"><text class="detail-item__label">{{ item.label }}</text><text class="detail-item__value">{{ item.value }}</text></view></view>
          </view>
          <view v-if="activeDetailTab === 'attach'" class="detail-section">
            <view class="detail-grid"><view v-for="item in attachDetailFields" :key="item.label" class="detail-item detail-item--note"><text class="detail-item__label">{{ item.label }}</text><text class="detail-item__value">{{ item.value }}</text></view></view>
          </view>
          <view class="detail-actions">
            <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="openEditDialog">编辑</button>
            <button class="toolbar-button toolbar-button--danger" hover-class="toolbar-button--hover" @click="handleDelete">删除</button>
          </view>
        </view>
      </view>
    </view>

    <!-- ========== 新增/编辑弹窗 ========== -->
    <view v-if="dialogVisible" class="dialog-mask" @click="closeDialog">
      <view class="dialog-panel" @click.stop>
        <view class="dialog-head">
          <view><text class="dialog-title">{{ isEditing ? "编辑漏点" : "新增漏点" }}</text><text class="dialog-subtitle">填写渗漏记录的基本信息、管道信息和关联数据</text></view>
          <button class="icon-button" hover-class="icon-button--hover" aria-label="关闭" @click="closeDialog"><text class="close-icon"></text></button>
        </view>
        <view class="dialog-body">
          <!-- 基础信息 -->
          <view class="form-section">
            <view class="section-head"><text class="section-title">基础信息</text></view>
            <view class="form-grid form-grid--two">
              <view class="form-field">
                <text class="form-label form-label--required">检出时间</text>
                <WorkOrderDatetimePicker v-model="form.detectedTime" title="选择检出时间" placeholder="请选择检出时间" :clearable="false" />
              </view>
              <view class="form-field select-field-wrapper">
                <text class="form-label form-label--required">渗漏级别</text>
                <view class="custom-select" :class="{ 'custom-select--open': leakDropdownOpen }" @click="leakDropdownOpen = !leakDropdownOpen">
                  <text :class="{ 'custom-select__placeholder': formLeakLevelIndex < 0 }">{{ currentFormLeakLevelLabel }}</text>
                  <text class="select-arrow" :class="{ 'select-arrow--up': leakDropdownOpen }"></text>
                </view>
                <view v-if="leakDropdownOpen" class="custom-select-dropdown">
                  <view v-for="(opt, idx) in leakLevelOptionsFiltered" :key="idx" class="custom-select-option" @click.stop="selectFormLeakLevel(idx)">
                    <text>{{ opt.label }}</text><text v-if="formLeakLevelIndex === idx" class="custom-select-check">✓</text>
                  </view>
                </view>
              </view>
              <view v-if="leakDropdownOpen" class="select-backdrop" @click="leakDropdownOpen = false" />
              <view class="form-field form-field--wide">
                <text class="form-label form-label--required">漏点位置</text>
                <input v-model="form.leakAddress" class="form-input" placeholder="请输入漏点位置" placeholder-class="input-placeholder" />
                <text v-if="validationErrors.leakAddress" class="form-error">{{ validationErrors.leakAddress }}</text>
              </view>
              <view class="form-field">
                <text class="form-label form-label--required">泄漏部位</text><input v-model="form.leakPart" class="form-input" :class="{ 'form-control--error': validationErrors.leakPart }" placeholder="请输入泄漏部位" placeholder-class="input-placeholder" />
                <text v-if="validationErrors.leakPart" class="form-error">{{ validationErrors.leakPart }}</text>
              </view>
              <view class="form-field">
                <text class="form-label">检出人</text><input v-model="form.detectAccount" class="form-input" placeholder="请输入检出人" placeholder-class="input-placeholder" />
              </view>
            </view>
          </view>
          <!-- 渗漏坐标 -->
          <view class="form-section">
            <view class="section-head"><text class="section-title">渗漏坐标</text><text class="section-hint">可手动输入或点击地图拾取</text></view>
            <view class="form-field">
              <view class="form-row">
                <input v-model="form.leakCoordinate" class="form-input form-input--flex" placeholder="格式: 经度,纬度 (如 121.4737,31.2304)" placeholder-class="input-placeholder" />
                <button class="form-action-btn" hover-class="form-action-btn--hover" @click="openMapPicker">
                  <text class="form-action-btn__icon form-action-btn__icon--map"></text><text>地图拾取</text>
                </button>
              </view>
              <!-- 地图选点面板 -->
              <view v-if="mapPickerVisible" class="map-picker-panel">
                <view class="map-picker-head">
                  <text class="map-picker-title">点击地图选取坐标</text>
                  <text class="map-picker-coord" :class="{ 'map-picker-coord--active': mapPickedCoord }">{{ mapPickedCoord || "请在地图上点击选择" }}</text>
                </view>
                <view class="map-picker-body">
                  <!-- #ifdef H5 -->
                  <div ref="mapPickerContainer" class="map-picker-canvas"></div>
                  <!-- #endif -->
                  <!-- #ifndef H5 -->
                  <view class="map-picker-canvas map-picker-canvas--fallback">地图选点仅支持 H5 端</view>
                  <!-- #endif -->
                </view>
                <view class="map-picker-actions">
                  <button class="dialog-btn dialog-btn--cancel" hover-class="dialog-btn--hover" @click="closeMapPicker">取消</button>
                  <button class="dialog-btn dialog-btn--primary" :disabled="!mapPickedCoord" hover-class="dialog-btn--hover" @click="confirmMapPick">确认选点</button>
                </view>
              </view>
            </view>
          </view>
          <!-- 管道信息 -->
          <view class="form-section">
            <view class="section-head"><text class="section-title">管道信息</text></view>
            <view class="form-grid form-grid--two">
              <view class="form-field"><text class="form-label form-label--required">管道材质</text><input v-model="form.tubeMaterial" class="form-input" :class="{ 'form-control--error': validationErrors.tubeMaterial }" placeholder="如 PE / 钢管 / 铸铁" placeholder-class="input-placeholder" /><text v-if="validationErrors.tubeMaterial" class="form-error">{{ validationErrors.tubeMaterial }}</text></view>
              <view class="form-field"><text class="form-label form-label--required">管道口径</text><input v-model="form.tubeBore" class="form-input" :class="{ 'form-control--error': validationErrors.tubeBore }" placeholder="如 DN200" placeholder-class="input-placeholder" /><text v-if="validationErrors.tubeBore" class="form-error">{{ validationErrors.tubeBore }}</text></view>
              <view class="form-field"><text class="form-label form-label--required">管道埋深</text><input v-model="form.tubeDepth" class="form-input" :class="{ 'form-control--error': validationErrors.tubeDepth }" placeholder="单位: 米" placeholder-class="input-placeholder" /><text v-if="validationErrors.tubeDepth" class="form-error">{{ validationErrors.tubeDepth }}</text></view>
            </view>
          </view>
          <!-- 关联数据 -->
          <view class="form-section">
            <view class="section-head"><text class="section-title">关联数据</text></view>
            <view class="form-grid form-grid--two">
              <view class="form-field"><text class="form-label">关联设备</text><input v-model="form.referenceDevices" class="form-input" placeholder="请输入设备编号" placeholder-class="input-placeholder" /></view>
              <view class="form-field"><text class="form-label">关联工单ID</text><input v-model="form.referenceWorksheetId" class="form-input" type="number" placeholder="请输入工单ID" placeholder-class="input-placeholder" /></view>
              <view class="form-field"><text class="form-label">最近设备距离</text><input v-model="form.closestDeviceDistance" class="form-input" placeholder="请输入距离" placeholder-class="input-placeholder" /></view>
              <view class="form-field">
                <text class="form-label">关联音频</text>
                <view class="form-row"><input v-model="form.referenceAudio" class="form-input form-input--flex" placeholder="音频文件ID" placeholder-class="input-placeholder" /><button class="form-action-btn form-action-btn--small" hover-class="form-action-btn--hover" @click="handleUploadAudio"><text>上传</text></button></view>
              </view>
            </view>
          </view>
          <!-- 渗漏照片 -->
          <view class="form-section">
            <view class="section-head"><text class="section-title">渗漏照片</text><text class="section-hint">支持 JPG/PNG，每张不超过 10MB</text></view>
            <view class="form-field">
              <view class="form-photo-area">
                <view v-if="photoList.length > 0" class="photo-preview-list">
                  <view v-for="(photo, idx) in photoList" :key="idx" class="photo-preview-item">
                    <image :src="photo.url" class="photo-thumb" mode="aspectFill" />
                    <button class="photo-remove-btn" hover-class="photo-remove-btn--hover" @click="removePhoto(idx)"><text class="photo-remove-icon"></text></button>
                  </view>
                </view>
                <view v-if="photoList.length < 9" class="photo-add-box" @click="handleUploadPhoto"><text class="photo-add-icon">+</text><text class="photo-add-label">{{ photoList.length === 0 ? "上传照片" : "继续添加" }}</text></view>
              </view>
              <input v-model="photoIdListText" class="form-input form-input--hidden-id" placeholder="照片ID (自动生成)" placeholder-class="input-placeholder" />
            </view>
          </view>
          <!-- 备注 -->
          <view class="form-section">
            <view class="section-head"><text class="section-title">备注</text></view>
            <view class="form-field"><textarea v-model="form.remark" class="form-textarea" placeholder="请输入备注信息（漏点原因、处理建议等）" placeholder-class="input-placeholder" /></view>
          </view>
        </view>
        <view class="dialog-actions">
          <button class="dialog-btn dialog-btn--cancel" hover-class="dialog-btn--hover" @click="closeDialog">取消</button>
          <button class="dialog-btn dialog-btn--primary" :disabled="submitting" hover-class="dialog-btn--hover" @click="submitForm">{{ submitting ? "提交中..." : "确定" }}</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from "vue";
import type { LeakLevel, LeakLevelOption } from "@/types/LeakPoint";
import type { DetailTab } from "@/types/LeakPoint";
import {
  getLeakPointPage,
  getLeakPointDetail,
  createLeakPoint,
  updateLeakPoint,
  deleteLeakPoint,
  batchDeleteLeakPoint,
} from "@/services/leak-report/leak-management";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";

type RecordItem = Record<string, unknown>;

interface Res {
  code?: number;
  data?: unknown;
  records?: unknown[];
  total?: number;
  msg?: string;
}

interface PhotoItem {
  url: string;
  id: string;
}

const leakLevelOptions: readonly LeakLevelOption[] = [
  { label: "不限", value: "" },
  { label: "轻度", value: 0 },
  { label: "中度", value: 1 },
  { label: "重度", value: 2 },
] as const;

const leakLevelOptionsWithoutAll: Pick<LeakLevelOption, "label" | "value">[] = [
  { label: "轻度", value: 0 },
  { label: "中度", value: 1 },
  { label: "重度", value: 2 },
];

const detailTabs: Array<{ label: string; value: DetailTab }> = [
  { label: "基本信息", value: "base" },
  { label: "管道信息", value: "pipe" },
  { label: "附件备注", value: "attach" },
];

const sortField = ref("detectedTime");
const sortOrder = ref("desc");

const filters = reactive({ startTime: "", endTime: "", leakLevel: "" as number | "", detectAccount: "" });
const pagination = reactive({ pageNum: 1, pageSize: 10 });
const records = ref<RecordItem[]>([]);
const selectedRecord = ref<RecordItem | null>(null);
const selectedRecordKey = ref("");
const selectedIds = ref(new Set<string>());
const total = ref(0);
const loading = ref(false);

const dialogVisible = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const activeDetailTab = ref<DetailTab>("base");
const formLeakLevelIndex = ref(0);
const leakDropdownOpen = ref(false);
const leakLevelOptionsFiltered = leakLevelOptionsWithoutAll;

const photoList = ref<PhotoItem[]>([]);
const photoIdListText = ref("");

const validationErrors = reactive({
  detectedTime: "",
  leakAddress: "",
  leakLevel: "",
  leakPart: "",
  tubeMaterial: "",
  tubeBore: "",
  tubeDepth: "",
});

const form = reactive({
  detectedTime: "",
  leakAddress: "",
  leakCoordinate: "",
  leakLevel: 0 as LeakLevel,
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

const currentLeakLevelLabel = computed(() => leakLevelOptions.find((o) => o.value === filters.leakLevel)?.label || "不限");

const currentFormLeakLevelLabel = computed(() => {
  const opt = leakLevelOptionsWithoutAll[formLeakLevelIndex.value];
  return opt?.label || "请选择渗漏级别";
});

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pagination.pageSize)));
const allSelectable = computed(() => records.value.length > 0);
const isAllSelected = computed(() => records.value.length > 0 && records.value.every((r) => isItemSelected(r)));

const statisticsCards = computed(() => {
  const light = records.value.filter((r) => Number(gv(r, "leakLevel")) === 0).length;
  const medium = records.value.filter((r) => Number(gv(r, "leakLevel")) === 1).length;
  const heavy = records.value.filter((r) => Number(gv(r, "leakLevel")) === 2).length;
  return [
    { label: "总记录数", value: String(total.value) },
    { label: "轻度", value: String(light) },
    { label: "中度", value: String(medium) },
    { label: "重度", value: String(heavy) },
  ];
});

function mkFields(r: RecordItem | null, defs: Array<[string, string, boolean?, string?]>) {
  const item = r || {};
  return defs.map(([label, key, fmt, override]) => ({
    label,
    value: override ?? (fmt ? fmtDt(gv(item, key)) : String(gv(item, key) ?? "-")),
  }));
}

const baseDetailFields = computed(() => mkFields(selectedRecord.value, [
  ["检出时间", "detectedTime", true],
  ["渗漏级别", "", false, getLeakLevelLabel(selectedRecord.value)],
  ["漏点位置", "leakAddress"],
  ["渗漏坐标", "leakCoordinate"],
  ["泄漏部位", "leakPart"],
  ["检出人", "detectAccount"],
  ["最近设备距离", "closestDeviceDistance"],
  ["关联工单ID", "referenceWorksheetId"],
  ["关联设备", "referenceDevices"],
  ["创建时间", "createdAt", true],
  ["更新时间", "updatedAt", true],
]));

const pipeDetailFields = computed(() => mkFields(selectedRecord.value, [
  ["管道材质", "tubeMaterial"],
  ["管道口径", "tubeBore"],
  ["管道埋深", "tubeDepth"],
]));

const attachDetailFields = computed(() => mkFields(selectedRecord.value, [
  ["关联音频", "referenceAudio"],
  ["渗漏照片", "leakPicture"],
  ["备注", "remark"],
]));

function gv(item: RecordItem, k: string) { return Object.hasOwn(item, k) ? item[k] : undefined; }
function getRowId(item: RecordItem): string { const v = gv(item, "id"); return typeof v === "string" || typeof v === "number" ? String(v) : ""; }
function getRowKey(item: RecordItem, i: number): string { return getRowId(item) || String(i); }

onMounted(() => fetchLeakPoints());

function handleLeakLevelChange(ev: { detail: { value: number } }) {
  const opt = leakLevelOptions[ev.detail.value];
  filters.leakLevel = (opt?.value as number | "") ?? "";
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
  fetchLeakPoints();
}

function buildQuery(): Record<string, unknown> {
  return rmEmpty({
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    startTime: normDate(filters.startTime, false),
    endTime: normDate(filters.endTime, true),
    sortOrder: sortOrder.value || "desc",
    sortField: sortField.value || "detectedTime",
    leakLevel: filters.leakLevel === "" ? undefined : filters.leakLevel,
    detectAccount: filters.detectAccount.trim() || undefined,
  });
}

async function fetchLeakPoints() {
  loading.value = true;
  try {
    const res = (await getLeakPointPage(buildQuery())) as Res;
    ok(res);
    const p = parsePage(res);
    records.value = applyLocalSort(p.records);
    total.value = p.total;
    selectedIds.value = new Set();
    selectFirstRow();
  } catch (e: unknown) {
    records.value = []; total.value = 0; selectedRecord.value = null; selectedRecordKey.value = "";
    uni.showToast({ title: (e as { msg?: string }).msg || "加载失败", icon: "none" });
  } finally { loading.value = false; }
}

function searchLeakPoints() { pagination.pageNum = 1; fetchLeakPoints(); }
function resetFilters() { filters.startTime = ""; filters.endTime = ""; filters.leakLevel = ""; filters.detectAccount = ""; searchLeakPoints(); }
function changePage(s: number) { const n = pagination.pageNum + s; if (n < 1 || n > totalPages.value) return; pagination.pageNum = n; fetchLeakPoints(); }

function selectFirstRow() {
  if (!records.value.length) { selectedRecord.value = null; selectedRecordKey.value = ""; return; }
  selectedRecord.value = records.value[0];
  selectedRecordKey.value = getRowKey(records.value[0], 0);
  activeDetailTab.value = "base";
}

function selectRecord(item: RecordItem, i: number) {
  selectedRecord.value = item; selectedRecordKey.value = getRowKey(item, i); activeDetailTab.value = "base";
  const id = getRowId(item);
  if (!id) return;
  getLeakPointDetail(id).then((res: unknown) => {
    ok(res as Res);
    const d = (res as Res)?.data;
    if (isObj(d)) selectedRecord.value = { ...item, ...(d as RecordItem) };
  }).catch(() => {});
}

function isItemSelected(item: RecordItem) { return selectedIds.value.has(getRowKey(item, records.value.indexOf(item))); }
function toggleSelectItem(item: RecordItem) {
  const key = getRowKey(item, records.value.indexOf(item));
  const s = new Set(selectedIds.value); s.has(key) ? s.delete(key) : s.add(key); selectedIds.value = s;
}
function toggleSelectAll() { selectedIds.value = isAllSelected.value ? new Set() : new Set(records.value.map((r, i) => getRowKey(r, i))); }

function openCreateDialog() { isEditing.value = false; resetForm(); dialogVisible.value = true; }
function openEditDialog() {
  if (!selectedRecord.value) { uni.showToast({ title: "请先选择漏点记录", icon: "none" }); return; }
  isEditing.value = true; fillForm(selectedRecord.value); dialogVisible.value = true;
}
function closeDialog() { dialogVisible.value = false; }

function resetForm() {
  form.detectedTime = ""; form.leakLevel = 0; form.leakAddress = ""; form.leakCoordinate = "";
  form.leakPart = ""; form.tubeMaterial = ""; form.tubeBore = ""; form.tubeDepth = "";
  form.detectAccount = ""; form.referenceDevices = ""; form.referenceWorksheetId = "";
  form.closestDeviceDistance = ""; form.referenceAudio = ""; form.leakPicture = ""; form.remark = "";
  formLeakLevelIndex.value = 0; photoList.value = []; photoIdListText.value = ""; clearValidationErrors();
}

function fillForm(item: RecordItem) {
  form.detectedTime = toLocal(gv(item, "detectedTime"));
  form.leakLevel = (Number(gv(item, "leakLevel")) ?? 0) as LeakLevel;
  const idx = leakLevelOptionsWithoutAll.findIndex((o) => o.value === form.leakLevel);
  formLeakLevelIndex.value = idx >= 0 ? idx : 0;
  form.leakAddress = String(gv(item, "leakAddress") ?? "");
  form.leakCoordinate = String(gv(item, "leakCoordinate") ?? "");
  form.leakPart = String(gv(item, "leakPart") ?? "");
  form.tubeMaterial = String(gv(item, "tubeMaterial") ?? "");
  form.tubeBore = String(gv(item, "tubeBore") ?? "");
  form.tubeDepth = String(gv(item, "tubeDepth") ?? "");
  form.detectAccount = String(gv(item, "detectAccount") ?? "");
  form.referenceDevices = String(gv(item, "referenceDevices") ?? "");
  form.referenceWorksheetId = String(gv(item, "referenceWorksheetId") ?? "");
  form.closestDeviceDistance = String(gv(item, "closestDeviceDistance") ?? "");
  form.referenceAudio = String(gv(item, "referenceAudio") ?? "");
  form.remark = String(gv(item, "remark") ?? "");
  const picId = String(gv(item, "leakPicture") ?? ""); form.leakPicture = picId; photoIdListText.value = picId;
  photoList.value = picId ? [{ url: `/api/file/preview/${picId}`, id: picId }] : [];
  clearValidationErrors();
}

function selectFormLeakLevel(idx: number) {
  formLeakLevelIndex.value = idx;
  form.leakLevel = leakLevelOptionsWithoutAll[idx].value as LeakLevel;
  leakDropdownOpen.value = false;
}

function handleFormLeakLevelChange(ev: { detail: { value: number } }) {
  formLeakLevelIndex.value = ev.detail.value;
  form.leakLevel = leakLevelOptionsWithoutAll[ev.detail.value].value as LeakLevel;
}

function clearValidationErrors() { validationErrors.detectedTime = ""; validationErrors.leakAddress = ""; validationErrors.leakLevel = ""; validationErrors.leakPart = ""; validationErrors.tubeMaterial = ""; validationErrors.tubeBore = ""; validationErrors.tubeDepth = ""; }

function validateForm(): boolean {
  clearValidationErrors(); let valid = true;
  if (!form.detectedTime) { validationErrors.detectedTime = "请选择检出时间"; valid = false; }
  if (!form.leakAddress.trim()) { validationErrors.leakAddress = "请输入漏点位置"; valid = false; }
  if (formLeakLevelIndex.value < 0) { validationErrors.leakLevel = "请选择渗漏级别"; valid = false; }
  if (!form.leakPart.trim()) { validationErrors.leakPart = "请输入泄漏部位"; valid = false; }
  if (!form.tubeMaterial.trim()) { validationErrors.tubeMaterial = "请选择管道材质"; valid = false; }
  if (!form.tubeBore.trim()) { validationErrors.tubeBore = "请输入管道口径"; valid = false; }
  if (!form.tubeDepth.trim()) { validationErrors.tubeDepth = "请输入管道埋深"; valid = false; }
  return valid;
}

function handleUploadPhoto() {
  uni.chooseImage({
    count: 9 - photoList.value.length, sizeType: ["compressed"], sourceType: ["album", "camera"],
    success: (res) => {
      const newPhotos: PhotoItem[] = [];
      const paths: string[] = Array.isArray(res.tempFilePaths) ? res.tempFilePaths : [res.tempFilePaths];
      paths.forEach((path: string, idx: number) => { newPhotos.push({ url: path, id: `img_${Date.now()}_${idx}` }); });
      photoList.value = [...photoList.value, ...newPhotos];
      form.leakPicture = photoList.value.map((p) => p.id).join(","); photoIdListText.value = form.leakPicture;
    },
    fail: () => { uni.showToast({ title: "取消选择", icon: "none" }); },
  });
}

function removePhoto(idx: number) { photoList.value.splice(idx, 1); form.leakPicture = photoList.value.map((p) => p.id).join(","); photoIdListText.value = form.leakPicture; }
function handleExport() {
  if (!records.value.length) { uni.showToast({ title: "暂无数据可导出", icon: "none" }); return; }
  // #ifdef H5
  const headers = ["检出时间", "渗漏级别", "漏点位置", "泄漏部位", "检出人", "管道材质", "管道口径", "管道埋深", "渗漏坐标", "关联设备", "备注"];
  const keys = ["detectedTime", "leakLevel", "leakAddress", "leakPart", "detectAccount", "tubeMaterial", "tubeBore", "tubeDepth", "leakCoordinate", "referenceDevices", "remark"];
  const levelMap: Record<number, string> = { 0: "轻度", 1: "中度", 2: "重度" };
  const rows = records.value.map((r) =>
    keys.map((k) => {
      let v = gv(r, k);
      if (k === "leakLevel") return levelMap[Number(v)] ?? "";
      if (v === undefined || v === null) return "";
      return String(v).replace(/"/g, '""');
    })
  );
  const csv = [headers.join(","), ...rows.map((row) => row.map((c) => `"${c}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `漏点数据_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  uni.showToast({ title: "导出成功", icon: "success" });
  // #endif
  // #ifndef H5
  uni.showToast({ title: "导出功能仅支持 H5 端", icon: "none" });
  // #endif
}

function handleImport() {
  // #ifdef H5
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".csv,.xlsx,.xls";
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    uni.showToast({ title: "导入功能开发中，请使用新增功能", icon: "none" });
  };
  input.click();
  // #endif
  // #ifndef H5
  uni.showToast({ title: "导入功能仅支持 H5 端", icon: "none" });
  // #endif
}

function handleUploadAudio() { uni.showToast({ title: "音频上传功能开发中", icon: "none" }); }

const mapPickerVisible = ref(false);
const mapPickedCoord = ref("");
const mapPickerContainer = ref<HTMLElement | null>(null);
let mapPickerInstance: { destroy?: () => void; on?: (event: string, handler: (e: { latLng: { getLat?: () => number; getLng?: () => number } }) => void) => void } | null = null;

const TENCENT_MAP_KEY = "JCDBZ-Z2HLI-V26GX-UL7VO-LJFO2-TIFMZ";
const TENCENT_MAP_SCRIPT_ID = "tencent-map-sdk-picker";
const TENCENT_MAP_SCRIPT_URL = `https://map.qq.com/api/gljs?v=1.exp&key=${TENCENT_MAP_KEY}`;

function loadTencentMapSDK(): Promise<void> {
  if (window.TMap) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(TENCENT_MAP_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing || document.createElement("script");
    script.id = TENCENT_MAP_SCRIPT_ID;
    script.charset = "utf-8";
    script.src = TENCENT_MAP_SCRIPT_URL;
    script.onload = () => { if (window.TMap) resolve(); else reject(new Error("SDK load failed")); };
    script.onerror = () => reject(new Error("SDK script failed"));
    if (!existing) document.body.appendChild(script);
  });
}

function initMapPicker(lng: number, lat: number) {
  if (!mapPickerContainer.value || !window.TMap) return;
  const center = new window.TMap.LatLng(lat, lng);
  const map = new window.TMap.Map(mapPickerContainer.value, { center, zoom: 15, pitch: 0, rotation: 0 });
  mapPickerInstance = map;
  map.on?.("click", (e: { latLng: { getLat?: () => number; getLng?: () => number } }) => {
    const clng = e.latLng.getLng?.().toFixed(6);
    const clat = e.latLng.getLat?.().toFixed(6);
    if (!clng || !clat) return;
    mapPickedCoord.value = `${clng},${clat}`;
  });
}

function openMapPicker() {
  mapPickerVisible.value = true;
  mapPickedCoord.value = "";
  uni.getLocation({
    type: "gcj02",
    success: (res) => { loadTencentMapSDK().then(() => initMapPicker(res.longitude, res.latitude)).catch(() => {}); },
    fail: () => { loadTencentMapSDK().then(() => initMapPicker(121.4737, 31.2304)).catch(() => {}); },
  });
}

function confirmMapPick() {
  if (mapPickedCoord.value) form.leakCoordinate = mapPickedCoord.value;
  closeMapPicker();
}

function closeMapPicker() {
  mapPickerVisible.value = false;
  mapPickedCoord.value = "";
  mapPickerInstance?.destroy?.();
  mapPickerInstance = null;
}

function buildPayload() {
  return rmEmpty({
    detectedTime: normDt(form.detectedTime), leakLevel: form.leakLevel, leakAddress: form.leakAddress.trim(),
    leakCoordinate: form.leakCoordinate.trim(), leakPart: form.leakPart.trim(),
    tubeMaterial: form.tubeMaterial.trim(), tubeBore: form.tubeBore.trim(), tubeDepth: form.tubeDepth.trim(),
    detectAccount: form.detectAccount.trim(), referenceDevices: form.referenceDevices.trim(),
    referenceWorksheetId: form.referenceWorksheetId ? Number(form.referenceWorksheetId) : undefined,
    closestDeviceDistance: form.closestDeviceDistance.trim(), referenceAudio: form.referenceAudio.trim(),
    leakPicture: form.leakPicture.trim() || undefined, remark: form.remark.trim(),
  });
}

async function submitForm() {
  if (!validateForm()) { const fe = validationErrors.detectedTime || validationErrors.leakAddress || validationErrors.leakLevel || validationErrors.leakPart || validationErrors.tubeMaterial || validationErrors.tubeBore || validationErrors.tubeDepth; if (fe) uni.showToast({ title: fe, icon: "none" }); return; }
  submitting.value = true;
  try {
    const payload = buildPayload(); let res: Res;
    if (isEditing.value) { res = (await updateLeakPoint(getRowId(selectedRecord.value!), payload)) as Res; }
    else { res = (await createLeakPoint(payload)) as Res; }
    ok(res); uni.showToast({ title: isEditing.value ? "编辑成功" : "新增成功", icon: "success" }); closeDialog(); fetchLeakPoints();
  } catch (e: unknown) { uni.showToast({ title: (e as { msg?: string }).msg || "提交失败", icon: "none" }); }
  finally { submitting.value = false; }
}

async function handleDelete() {
  if (!selectedRecord.value) { uni.showToast({ title: "请先选择漏点记录", icon: "none" }); return; }
  const id = getRowId(selectedRecord.value); if (!id) return;
  try { ok((await deleteLeakPoint(id)) as Res); uni.showToast({ title: "删除成功", icon: "success" }); selectedRecord.value = null; fetchLeakPoints(); }
  catch (e: unknown) { uni.showToast({ title: (e as { msg?: string }).msg || "删除失败", icon: "none" }); }
}

async function handleBatchDelete() {
  if (!selectedIds.value.size) return;
  const ids = Array.from(selectedIds.value).map((k) => { const i = records.value.findIndex((r, idx) => getRowKey(r, idx) === k); return i >= 0 ? getRowId(records.value[i]) : ""; }).filter(Boolean);
  if (!ids.length) return;
  try { ok((await batchDeleteLeakPoint(ids)) as Res); uni.showToast({ title: `已删除${ids.length}条`, icon: "success" }); selectedIds.value = new Set(); fetchLeakPoints(); }
  catch (e: unknown) { uni.showToast({ title: (e as { msg?: string }).msg || "批量删除失败", icon: "none" }); }
}

function getFieldValue(item: RecordItem | null, key: string): string { if (!item) return ""; const v = gv(item, key); if (v === undefined || v === null) return ""; return String(v); }
function formatDateTime(v: unknown): string { return fmtDt(v); }

function getLeakLevelLabel(item: RecordItem | null): string {
  if (!item) return "-"; const v = Number(gv(item, "leakLevel"));
  if (v === 0) return "轻度"; if (v === 1) return "中度"; if (v === 2) return "重度"; return "未知";
}
function getLeakLevelClass(item: RecordItem): string { const v = Number(gv(item, "leakLevel")); if (v === 0) return "level-pill--light"; if (v === 1) return "level-pill--medium"; if (v === 2) return "level-pill--heavy"; return ""; }
function getLeakLevelBadgeClass(item: RecordItem): string { const v = Number(gv(item, "leakLevel")); if (v === 0) return "detail-summary__badge--light"; if (v === 1) return "detail-summary__badge--medium"; if (v === 2) return "detail-summary__badge--heavy"; return ""; }

function fmtDt(v: unknown): string { if (!v || v === "-") return String(v || "-"); return String(v).replace("T", " ").replace(/\.\d+/, "").replace(/(?:Z|[+-]\d{2}:?\d{2})$/, ""); }
function toLocal(v: unknown): string { if (!v) return ""; const d = typeof v === "string" ? new Date(String(v).replace(" ", "T")) : new Date(v as number); if (isNaN(d.getTime())) return ""; return `${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`; }
function normDate(v: string, isEnd: boolean): string | undefined { if (!v) return undefined; const n = v.trim().replace(/\s+/, "T"); if (n.includes("T")) return n.length === 16 ? `${n}:00` : n; return `${n}T${isEnd ? "23:59:59" : "00:00:00"}`; }
function normDt(v: string): string | undefined { if (!v) return undefined; const n = v.trim().replace(/\s+/, "T"); return n.includes("T") ? (n.length === 16 ? `${n}:00` : n) : n; }
function p2(n: number): string { return String(n).padStart(2, "0"); }

function parsePage(res: Res) {
  const d = res?.data ?? res; const pg = findPg(d) || findPg(res) || (isObj(d) ? d : {});
  const recs = arr(pg, ["records","rows","list","items"]) || arr(res, ["records","rows","list","items"]);
  const t = num(pg, ["total","count","totalCount"]) ?? num(res, ["total","count","totalCount"]);
  const c = num(pg, ["current","pageNum","page","pageNo"]); const s = num(pg, ["size","pageSize","limit"]);
  if (c) pagination.pageNum = c; if (s) pagination.pageSize = s;
  const mt = (pagination.pageNum - 1) * pagination.pageSize + recs.length;
  return { records: recs.map((r: unknown) => (isObj(r) ? r : { value: r })), total: t === undefined ? recs.length : Math.max(t, mt) };
}
function findPg(v: unknown): RecordItem | null {
  if (!isObj(v)) return null;
  if (arr(v, ["records","rows","list","items"]).length > 0 || num(v, ["total","count","totalCount"]) !== undefined) return v as RecordItem;
  for (const k of ["data","result","page","pageData"]) { const m = findPg((v as RecordItem)[k]); if (m) return m; }
  return null;
}
function arr(v: unknown, ks: string[]): unknown[] { if (!isObj(v)) return []; for (const k of ks) { const a = (v as RecordItem)[k]; if (Array.isArray(a)) return a; } return []; }
function num(v: unknown, ks: string[]): number | undefined { if (!isObj(v)) return undefined; for (const k of ks) { const a = (v as RecordItem)[k]; if (typeof a === "number") return a; if (typeof a === "string" && a.trim() && !isNaN(Number(a))) return Number(a); } return undefined; }
function isObj(v: unknown): v is RecordItem { return Boolean(v && typeof v === "object" && !Array.isArray(v)); }
function rmEmpty(obj: RecordItem): RecordItem { return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v !== undefined && v !== null)); }
function applyLocalSort(list: RecordItem[]): RecordItem[] {
  if (!sortField.value || !sortOrder.value) return list;
  const field = sortField.value;
  const order = sortOrder.value;
  return [...list].sort((a, b) => {
    let va = gv(a, field);
    let vb = gv(b, field);
    if (field === "leakLevel") {
      va = Number(va);
      vb = Number(vb);
    } else if (field === "detectedTime" || field === "createdAt") {
      va = String(va ?? "");
      vb = String(vb ?? "");
    }
    if (va === undefined || va === null) return 1;
    if (vb === undefined || vb === null) return -1;
    if (va < vb) return order === "asc" ? -1 : 1;
    if (va > vb) return order === "asc" ? 1 : -1;
    return 0;
  });
}

function ok(res: Res | undefined) { const c = res?.code; if (c === undefined || c === 0 || c === 200) return; throw { code: c, msg: res?.msg || "请求失败" }; }
</script>

<style scoped lang="scss">
.leak-management-view { display: flex; flex-direction: column; box-sizing: border-box; height: 100%; min-height: 0; padding: 0 14px 14px; overflow: hidden; background: #eef4f8; }

.toolbar, .table-panel, .detail-panel, .stat-card { background: #fff; border: 1px solid #d8e5ef; border-radius: 6px; box-shadow: 0 12px 26px rgba(35,72,104,0.09); }
.toolbar { flex: none; display: flex; flex-direction: column; padding: 14px 14px 10px; margin-bottom: 12px; }
.toolbar-row { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.toolbar-row--filters { margin-bottom: 10px; }
.toolbar-row--bottom { justify-content: space-between; }
.filter-group { display: flex; align-items: center; gap: 8px; }
.filter-label { flex: none; color: #183755; font-size: 13px; font-weight: 700; white-space: nowrap; }
.filter-input { box-sizing: border-box; width: 140px; height: 38px; padding: 0 12px; color: #172033; font-size: 14px; background: #fbfdff; border: 1px solid #d5e2ee; border-radius: 4px; }
.input-placeholder { color: #7f8fa3; font-size: 14px; }
.filter-select { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; min-width: 100px; height: 38px; padding: 0 12px; color: #172033; font-size: 14px; background: #fbfdff; border: 1px solid #d5e2ee; border-radius: 4px; cursor: pointer; }
.filter-select__arrow { width: 0; height: 0; margin-left: 8px; border-top: 5px solid #7f8fa3; border-right: 5px solid transparent; border-left: 5px solid transparent; }
.date-range { display: flex; align-items: center; gap: 6px; }
.filter-datetime { width: 170px; }
.filter-separator { flex: none; color: #7f8fa3; font-size: 13px; }
.toolbar-actions { display: flex; align-items: center; gap: 10px; &--right { margin-left: auto; } }
.toolbar-button { display: flex; align-items: center; justify-content: center; box-sizing: border-box; min-width: 64px; height: 38px; margin: 0; padding: 0 16px; color: #183755; font-size: 14px; font-weight: 700; background: #fff; border: 1px solid #d5e2ee; border-radius: 6px; cursor: pointer; &--primary { color: #fff; background: #0d82ee; border-color: #0d82ee; } &--danger { color: #e74c3c; border-color: #e74c3c; } &--hover { opacity: 0.85; } &:disabled { opacity: 0.45; cursor: not-allowed; } }
.toolbar-icon-button { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; margin: 0; padding: 0; background: #fff; border: 1px solid #d5e2ee; border-radius: 6px; cursor: pointer; &--hover { background: #edf5ff; } }
.icon-refresh { display: block; width: 18px; height: 18px; border: 2px solid #7f8fa3; border-top-color: transparent; border-radius: 50%; }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; flex: none; margin-bottom: 12px; }
.stat-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 16px 12px; }
.stat-card__label { color: #64748b; font-size: 13px; }
.stat-card__value { color: #183755; font-size: 24px; font-weight: 900; }

.main-layout { display: flex; flex: 1; min-height: 0; gap: 12px; overflow: hidden; }
.table-panel { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
.table-head, .pagination-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; }
.table-head { flex: none; color: #183755; font-size: 15px; font-weight: 900; border-bottom: 1px solid #edf3f8; }
.table-head__meta { color: #64748b; font-size: 13px; font-weight: 600; }
.table-scroll { flex: 1; min-height: 0; overflow: auto; background: #ffffff; }
.data-table { display: flex; flex-direction: column; width: 1880px; min-width: 1880px; background: #ffffff; }
.data-row { display: grid; grid-template-columns: 40px 58px 180px 110px 150px 120px 150px 90px 100px 100px 100px 100px 120px 140px 120px 202px; min-height: 42px; width: 1880px; border-bottom: 1px solid #edf1f5; cursor: pointer; transition: background 0.18s ease, box-shadow 0.18s ease; &--header { position: sticky; top: 0; z-index: 1; min-height: 44px; color: #20384f; font-weight: 800; background: #f6f9fc; cursor: default; box-shadow: 0 1px 0 #dbe7f0; } &--active { position: relative; background: #e7f3ff !important; box-shadow: inset 0 0 0 1px #b9dcff; } }
.data-row:not(.data-row--header):nth-child(odd) { background: #fff; }
.data-row:not(.data-row--header):nth-child(even) { background: #fbfdff; }
.data-row:not(.data-row--header):hover { background: #f1f8ff; box-shadow: inset 0 0 0 1px #d7ebfb; }
.data-row--active::before { position: absolute; top: 7px; bottom: 7px; left: 0; width: 3px; content: ""; background: #0d82ee; border-radius: 0 999px 999px 0; }
.data-cell { display: flex; align-items: center; justify-content: center; min-width: 0; padding: 0 12px; overflow: hidden; color: #24384d; font-size: 13px; line-height: 1.35; text-align: center; text-overflow: ellipsis; white-space: nowrap; border-right: 1px solid #edf1f5; }
.data-row--header .data-cell { color: #415a73; font-size: 12px; letter-spacing: 0; }
.data-cell:last-child { border-right: 0; }
.data-cell--sortable { cursor: pointer; user-select: none; }
.data-cell--sortable:hover { color: #0d82ee; }
.data-cell--checkbox { justify-content: center; }
.data-cell--index { justify-content: center; color: #64748b; }
.data-cell--time { color: #0f4c81; font-family: "DIN Alternate", "Arial", sans-serif; font-weight: 800; }
.data-cell--address { justify-content: flex-start; text-align: left; }
.data-cell--remark { justify-content: flex-start; text-align: left; }
/* 排序箭头 */
.sort-arrow { flex: none; font-size: 10px; line-height: 1; margin-left: 2px; color: #bcc7d6; transition: color 0.18s ease; &--active { color: #0d82ee; } &--idle { opacity: 0.4; } }
.data-cell--sortable:hover .sort-arrow:not(.sort-arrow--active) { color: #7f8fa3; }
.checkbox { display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; border: 2px solid #cdd7e4; border-radius: 4px; cursor: pointer; &--checked { background: #0d82ee; border-color: #0d82ee; } }
.checkbox__mark { display: block; width: 6px; height: 10px; border-right: 2px solid #fff; border-bottom: 2px solid #fff; transform: rotate(45deg) translate(-1px, -1px); }
.level-pill { display: inline-block; padding: 2px 8px; font-size: 12px; font-weight: 700; border-radius: 10px; &--light { color: #16a34a; background: #dcfce7; } &--medium { color: #d97706; background: #fef3c7; } &--heavy { color: #dc2626; background: #fee2e2; } }
.table-state { padding: 32px; color: #7c8da1; font-size: 14px; text-align: center; }
.pagination-bar { flex: none; border-top: 1px solid #edf3f8; }
.page-button { display: flex; align-items: center; justify-content: center; min-width: 64px; height: 34px; margin: 0; padding: 0 14px; color: #183755; font-size: 13px; font-weight: 700; background: #fff; border: 1px solid #d5e2ee; border-radius: 6px; cursor: pointer; &--hover { background: #edf5ff; } &:disabled { opacity: 0.4; cursor: not-allowed; } }
.page-info { color: #64748b; font-size: 13px; font-weight: 600; }

.detail-panel { width: 340px; flex: none; display: flex; flex-direction: column; overflow: hidden; }
.detail-empty { flex: 1; display: flex; align-items: center; justify-content: center; color: #7c8da1; font-size: 14px; }
.detail-body { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
.detail-tabs { display: flex; flex: none; border-bottom: 1px solid #edf3f8; }
.detail-tab { flex: 1; display: flex; align-items: center; justify-content: center; height: 42px; color: #64748b; font-size: 13px; font-weight: 700; cursor: pointer; border-bottom: 2px solid transparent; &--active { color: #0d82ee; border-bottom-color: #0d82ee; } }
.detail-section { flex: 1; min-height: 0; padding: 14px; overflow-y: auto; }
.detail-summary { display: flex; flex-direction: column; gap: 8px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid #edf3f8; }
.detail-summary__main { display: flex; flex-direction: column; gap: 4px; }
.detail-summary__label { color: #64748b; font-size: 12px; font-weight: 600; }
.detail-summary__value { color: #172033; font-size: 16px; font-weight: 900; }
.detail-summary__badges { display: flex; gap: 8px; }
.detail-summary__badge { display: inline-block; padding: 2px 10px; font-size: 12px; font-weight: 700; border-radius: 10px; background: #edf5ff; color: #0d82ee; &--light { color: #16a34a; background: #dcfce7; } &--medium { color: #d97706; background: #fef3c7; } &--heavy { color: #dc2626; background: #fee2e2; } }
.detail-grid { display: flex; flex-direction: column; gap: 12px; }
.detail-item { display: flex; flex-direction: column; gap: 4px; &--note { padding-bottom: 12px; border-bottom: 1px solid #f3f7fc; } }
.detail-item__label { color: #64748b; font-size: 12px; font-weight: 600; }
.detail-item__value { color: #172033; font-size: 14px; font-weight: 600; word-break: break-all; }
.detail-actions { display: flex; gap: 10px; flex: none; padding: 12px 14px; border-top: 1px solid #edf3f8; }

.dialog-mask { position: fixed; inset: 0; z-index: 2000; display: flex; align-items: center; justify-content: center; background: rgba(15,35,55,0.22); }
.dialog-panel { display: flex; flex-direction: column; width: 720px; max-width: calc(100vw - 28px); max-height: 86vh; overflow: hidden; background: #fff; border-radius: 8px; box-shadow: 0 18px 46px rgba(15,35,55,0.2); }
.dialog-head { display: flex; align-items: center; justify-content: space-between; flex: none; padding: 18px 24px; background: #f8fbfe; border-bottom: 1px solid #edf3f8; }
.dialog-title { display: block; color: #183755; font-size: 22px; font-weight: 900; }
.dialog-subtitle { display: block; margin-top: 4px; color: #5f7188; font-size: 13px; }
.icon-button { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0; margin: 0; background: #f6fbff; border: 1px solid #d9e7f3; border-radius: 6px; cursor: pointer; &--hover { background: #edf7ff; border-color: #0d82ee; } }
.close-icon { position: relative; width: 14px; height: 14px; &::before, &::after { position: absolute; top: 6px; left: 0; width: 14px; height: 2px; content: ""; background: #64748b; border-radius: 2px; } &::before { transform: rotate(45deg); } &::after { transform: rotate(-45deg); } }
.dialog-body { flex: 1; min-height: 0; max-height: none; overflow-y: auto; padding: 18px 24px 16px; background: #fff; }

.form-section { margin-bottom: 14px; padding: 0; background: #fff; border: 0; border-radius: 0; &:last-child { margin-bottom: 0; } }
.section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 11px; padding-bottom: 9px; border-bottom: 1px solid #eef4fa; }
.section-title { position: relative; padding-left: 10px; color: #183755; font-size: 16px; font-weight: 900; &::before { position: absolute; top: 50%; left: 0; width: 3px; height: 16px; content: ""; background: #0d82ee; border-radius: 999px; transform: translateY(-50%); } }
.section-hint { color: #94a3b8; font-size: 12px; }

.form-grid { display: grid; gap: 12px 18px; &--two { grid-template-columns: repeat(2, 1fr); } }
.form-field { min-width: 0; &--wide { grid-column: span 2; } }
.form-label { display: block; margin-bottom: 5px; color: #34495e; font-size: 13px; font-weight: 700; &--required::after { margin-left: 4px; color: #ef4444; content: "*"; } }
.form-error { display: block; margin-top: 4px; color: #ef4444; font-size: 12px; }
.form-input, .form-select { box-sizing: border-box; min-width: 0; width: 100%; max-width: 100%; height: 38px; padding: 0 12px; overflow: hidden; color: #172033; font-size: 14px; line-height: 38px; text-overflow: ellipsis; background: #fbfdff; border: 1px solid #d5e2ee; border-radius: 4px; transition: border-color 0.16s ease, box-shadow 0.16s ease; &--flex { flex: 1; } }
.form-input:focus, .form-textarea:focus { background: #fff; border-color: #8fc8f8; box-shadow: 0 0 0 3px rgba(13,130,238,0.1); }
.form-select { display: flex; align-items: center; justify-content: space-between; &--dropdown { background: #f7fbff; box-shadow: inset 0 -1px 0 rgba(13,130,238,0.03); } &__placeholder { color: #9aa9b8; } }
.form-textarea { box-sizing: border-box; width: 100%; max-width: 100%; min-height: 88px; padding: 9px 12px; color: #172033; font-size: 14px; line-height: 1.45; background: #fbfdff; border: 1px solid #d5e2ee; border-radius: 4px; }

.select-arrow { width: 8px; height: 8px; border: solid #74879c; border-width: 0 2px 2px 0; transform: translateY(-2px) rotate(45deg); &--up { transform: translateY(2px) rotate(-135deg); } }

.select-field-wrapper { position: relative; }
.custom-select { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; width: 100%; height: 38px; padding: 0 12px; color: #172033; font-size: 14px; background: #fbfdff; border: 1px solid #d5e2ee; border-radius: 4px; cursor: pointer; transition: border-color 0.16s ease, box-shadow 0.16s ease; &--open { border-color: #8fc8f8; box-shadow: 0 0 0 3px rgba(13,130,238,0.1); } }
.custom-select__placeholder { color: #9aa9b8; }
.custom-select-dropdown { position: absolute; top: 100%; left: 0; z-index: 10; width: 100%; margin-top: 4px; background: #fff; border: 1px solid #d5e2ee; border-radius: 4px; box-shadow: 0 8px 24px rgba(15,35,55,0.12); overflow: hidden; }
.custom-select-option { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; font-size: 14px; color: #172033; cursor: pointer; &:hover { background: #edf5ff; } &--active { color: #0d82ee; font-weight: 700; } }
.custom-select-check { color: #0d82ee; font-size: 14px; }
.select-backdrop { position: fixed; inset: 0; z-index: 5; }

.form-row { display: flex; gap: 10px; align-items: center; }
.form-action-btn { display: flex; align-items: center; gap: 4px; flex: none; height: 38px; padding: 0 14px; color: #0d82ee; font-size: 13px; font-weight: 700; white-space: nowrap; background: #edf7ff; border: 1px solid #b8ddf8; border-radius: 4px; cursor: pointer; &--small { height: 38px; padding: 0 12px; font-size: 12px; } &--hover { background: #d6edfc; border-color: #0d82ee; } }
.form-action-btn__icon--map { display: inline-block; width: 14px; height: 14px; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230d82ee'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z'/%3E%3C/svg%3E") center/contain no-repeat; }

.form-photo-area { display: flex; flex-wrap: wrap; gap: 10px; }
.photo-preview-list { display: flex; flex-wrap: wrap; gap: 10px; }
.photo-preview-item { position: relative; width: 88px; height: 88px; border-radius: 6px; overflow: hidden; }
.photo-thumb { width: 100%; height: 100%; }
.photo-remove-btn { position: absolute; top: 2px; right: 2px; display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; padding: 0; margin: 0; background: rgba(0,0,0,0.55); border: 0; border-radius: 50%; cursor: pointer; &--hover { background: rgba(0,0,0,0.75); } }
.photo-remove-icon { position: relative; width: 10px; height: 10px; &::before, &::after { position: absolute; top: 4px; left: 0; width: 10px; height: 2px; content: ""; background: #fff; border-radius: 1px; } &::before { transform: rotate(45deg); } &::after { transform: rotate(-45deg); } }
.photo-add-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; width: 88px; height: 88px; border: 2px dashed #c5d2e2; border-radius: 6px; background: #fbfdff; cursor: pointer; transition: border-color 0.16s ease, background 0.16s ease; &:hover { border-color: #0d82ee; background: #edf7ff; } }
.photo-add-icon { font-size: 26px; font-weight: 300; color: #94a3b8; line-height: 1; }
.photo-add-label { font-size: 11px; color: #94a3b8; }
.form-input--hidden-id { margin-top: 10px; height: 32px; font-size: 12px; color: #94a3b8; background: #f9fafb; }

.dialog-actions { display: flex; flex: none; justify-content: flex-end; gap: 12px; padding: 12px 22px; padding-bottom: calc(12px + env(safe-area-inset-bottom)); background: #fff; border-top: 1px solid #edf3f8; box-shadow: 0 -4px 16px rgba(24,55,85,0.06); }
.dialog-btn { display: flex; align-items: center; justify-content: center; min-width: 80px; height: 38px; padding: 0 22px; font-size: 14px; font-weight: 700; border-radius: 6px; cursor: pointer; transition: opacity 0.16s ease; &--cancel { color: #34495e; background: #f1f5f9; border: 1px solid #d5e2ee; } &--primary { color: #fff; background: #0d82ee; border: 1px solid #0d82ee; } &--hover { opacity: 0.85; } &:disabled { opacity: 0.45; cursor: not-allowed; } }

/* ========== 地图选点面板 ========== */
.map-picker-panel {
  margin-top: 12px;
  border: 1px solid #d5e2ee;
  border-radius: 6px;
  overflow: hidden;
}

.map-picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f8fbfe;
  border-bottom: 1px solid #edf3f8;
}

.map-picker-title {
  color: #183755;
  font-size: 14px;
  font-weight: 700;
}

.map-picker-coord {
  color: #94a3b8;
  font-size: 13px;

  &--active {
    color: #0d82ee;
    font-weight: 700;
  }
}

.map-picker-body {
  position: relative;
  width: 100%;
  height: 300px;
}

.map-picker-canvas {
  width: 100%;
  height: 100%;

  &--fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #7c8da1;
    font-size: 14px;
    background: #f8fafc;
  }
}

.map-picker-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 10px 14px;
  background: #fff;
  border-top: 1px solid #edf3f8;
}

@media (max-width: 1024px) { .main-layout { flex-direction: column; } .detail-panel { width: 100%; max-height: 340px; } .stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .form-grid--two { grid-template-columns: 1fr; } .form-field--wide { grid-column: span 1; } }
</style>
