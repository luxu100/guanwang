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
            <view v-for="(item, index) in records" v-else :key="getRowKey(item, index)" class="data-row" :class="{ 'data-row--active': selectedRecordKey === getRowKey(item, index) }" @click="selectRecord(item, index)">
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
            <view class="detail-grid">
              <view v-for="item in baseDetailFields" :key="item.label" class="detail-item"><text class="detail-item__label">{{ item.label }}</text><text class="detail-item__value">{{ item.value }}</text></view>
            </view>
          </view>
          <view v-if="activeDetailTab === 'pipe'" class="detail-section">
            <view class="detail-grid">
              <view v-for="item in pipeDetailFields" :key="item.label" class="detail-item"><text class="detail-item__label">{{ item.label }}</text><text class="detail-item__value">{{ item.value }}</text></view>
            </view>
          </view>
          <view v-if="activeDetailTab === 'attach'" class="detail-section">
            <view class="detail-grid">
              <view v-for="item in attachDetailFields" :key="item.label" class="detail-item detail-item--note"><text class="detail-item__label">{{ item.label }}</text><text class="detail-item__value">{{ item.value }}</text></view>
            </view>
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
        <!-- 头部 -->
        <view class="dialog-head">
          <view>
            <text class="dialog-title">{{ isEditing ? "编辑漏点" : "新增漏点" }}</text>
            <text class="dialog-subtitle">填写渗漏记录的基本信息、管道信息和关联数据</text>
          </view>
          <button class="icon-button" hover-class="icon-button--hover" aria-label="关闭" @click="closeDialog">
            <text class="close-icon"></text>
          </button>
        </view>

        <!-- 可滚动表单区 -->
        <view class="dialog-body">
          <!-- ====== 基础信息 ====== -->
          <view class="form-section">
            <view class="section-head">
              <text class="section-title">基础信息</text>
            </view>
            <view class="form-grid form-grid--two">
              <view class="form-field">
                <text class="form-label form-label--required">检出时间</text>
                <WorkOrderDatetimePicker v-model="form.detectedTime" title="选择检出时间" placeholder="请选择检出时间" :clearable="false" />
              </view>
              <view class="form-field">
                <text class="form-label form-label--required">渗漏级别</text>
                <picker :range="leakLevelOptionsWithoutAll" range-key="label" @change="handleFormLeakLevelChange">
                  <view class="form-select form-select--dropdown">
                    <text :class="{ 'form-select__placeholder': formLeakLevelIndex < 0 }">{{ currentFormLeakLevelLabel }}</text>
                    <text class="select-arrow"></text>
                  </view>
                </picker>
              </view>
              <view class="form-field form-field--wide">
                <text class="form-label form-label--required">漏点位置</text>
                <input v-model="form.leakAddress" class="form-input" placeholder="请输入漏点位置" placeholder-class="input-placeholder" />
                <text v-if="validationErrors.leakAddress" class="form-error">{{ validationErrors.leakAddress }}</text>
              </view>
              <view class="form-field">
                <text class="form-label">泄漏部位</text>
                <input v-model="form.leakPart" class="form-input" placeholder="请输入泄漏部位" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">检出人</text>
                <input v-model="form.detectAccount" class="form-input" placeholder="请输入检出人" placeholder-class="input-placeholder" />
              </view>
            </view>
          </view>

          <!-- ====== 渗漏坐标 ====== -->
          <view class="form-section">
            <view class="section-head">
              <text class="section-title">渗漏坐标</text>
              <text class="section-hint">可手动输入或点击地图拾取</text>
            </view>
            <view class="form-field">
              <view class="form-row">
                <input v-model="form.leakCoordinate" class="form-input form-input--flex" placeholder="格式: 经度,纬度 (如 121.4737,31.2304)" placeholder-class="input-placeholder" />
                <button class="form-action-btn" hover-class="form-action-btn--hover" @click="pickCoordinateOnMap">
                  <text class="form-action-btn__icon form-action-btn__icon--map"></text>
                  <text>地图拾取</text>
                </button>
              </view>
            </view>
          </view>

          <!-- ====== 管道信息 ====== -->
          <view class="form-section">
            <view class="section-head">
              <text class="section-title">管道信息</text>
            </view>
            <view class="form-grid form-grid--two">
              <view class="form-field">
                <text class="form-label">管道材质</text>
                <input v-model="form.tubeMaterial" class="form-input" placeholder="如 PE / 钢管 / 铸铁" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">管道口径</text>
                <input v-model="form.tubeBore" class="form-input" placeholder="如 DN200" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">管道埋深</text>
                <input v-model="form.tubeDepth" class="form-input" placeholder="单位: 米" placeholder-class="input-placeholder" />
              </view>
            </view>
          </view>

          <!-- ====== 关联数据 ====== -->
          <view class="form-section">
            <view class="section-head">
              <text class="section-title">关联数据</text>
            </view>
            <view class="form-grid form-grid--two">
              <view class="form-field">
                <text class="form-label">关联设备</text>
                <input v-model="form.referenceDevices" class="form-input" placeholder="请输入设备编号" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">关联工单ID</text>
                <input v-model="form.referenceWorksheetId" class="form-input" type="number" placeholder="请输入工单ID" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">最近设备距离</text>
                <input v-model="form.closestDeviceDistance" class="form-input" placeholder="请输入距离" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">关联音频</text>
                <view class="form-row">
                  <input v-model="form.referenceAudio" class="form-input form-input--flex" placeholder="音频文件ID" placeholder-class="input-placeholder" />
                  <button class="form-action-btn form-action-btn--small" hover-class="form-action-btn--hover" @click="handleUploadAudio">
                    <text>上传</text>
                  </button>
                </view>
              </view>
            </view>
          </view>

          <!-- ====== 渗漏照片 ====== -->
          <view class="form-section">
            <view class="section-head">
              <text class="section-title">渗漏照片</text>
              <text class="section-hint">支持 JPG/PNG，每张不超过 10MB</text>
            </view>
            <view class="form-field">
              <view class="form-photo-area">
                <view v-if="photoList.length > 0" class="photo-preview-list">
                  <view v-for="(photo, idx) in photoList" :key="idx" class="photo-preview-item">
                    <image :src="photo.url" class="photo-thumb" mode="aspectFill" />
                    <button class="photo-remove-btn" hover-class="photo-remove-btn--hover" @click="removePhoto(idx)">
                      <text class="photo-remove-icon"></text>
                    </button>
                  </view>
                </view>
                <view v-if="photoList.length < 9" class="photo-add-box" @click="handleUploadPhoto">
                  <text class="photo-add-icon">+</text>
                  <text class="photo-add-label">{{ photoList.length === 0 ? "上传照片" : "继续添加" }}</text>
                </view>
              </view>
              <input v-model="photoIdListText" class="form-input form-input--hidden-id" placeholder="照片ID (自动生成)" placeholder-class="input-placeholder" />
            </view>
          </view>

          <!-- ====== 备注 ====== -->
          <view class="form-section">
            <view class="section-head">
              <text class="section-title">备注</text>
            </view>
            <view class="form-field">
              <textarea v-model="form.remark" class="form-textarea" placeholder="请输入备注信息（漏点原因、处理建议等）" placeholder-class="input-placeholder" />
            </view>
          </view>
        </view>

        <!-- 吸底操作栏 -->
        <view class="dialog-actions">
          <button class="dialog-btn dialog-btn--cancel" hover-class="dialog-btn--hover" @click="closeDialog">取消</button>
          <button class="dialog-btn dialog-btn--primary" :disabled="submitting" hover-class="dialog-btn--hover" @click="submitForm">
            {{ submitting ? "提交中..." : "确定" }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from "vue";
import type { LeakLevel, LeakLevelOption, LeakPointRecord, LeakPointFilters, DetailTab } from "@/types/LeakPoint";
import {
  getLeakPointPage,
  getLeakPointDetail,
  createLeakPoint,
  updateLeakPoint,
  deleteLeakPoint,
  batchDeleteLeakPoint,
} from "@/services/leak-report/leak-management";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";

/* ---------- 类型 ---------- */
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

/* ---------- 静态选项 ---------- */
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

/* ---------- 响应式状态 ---------- */
const filters = reactive<LeakPointFilters>({ startTime: "", endTime: "", leakLevel: "", detectAccount: "" });
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

const photoList = ref<PhotoItem[]>([]);
const photoIdListText = ref("");

const validationErrors = reactive({
  detectedTime: "",
  leakAddress: "",
  leakLevel: "",
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

/* ---------- 计算属性 ---------- */
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

/* ---------- 辅助函数 ---------- */
function mkFields(r: RecordItem | null, defs: Array<[string, string, boolean?, string?]>) {
  const item = r || {};
  return defs.map(([label, key, fmt, override]) => ({
    label,
    value: override ?? (fmt ? fmtDt(gv(item, key)) : String(gv(item, key) ?? "-")),
  }));
}

function gv(item: RecordItem, k: string) {
  return Object.hasOwn(item, k) ? item[k] : undefined;
}

function getRowId(item: RecordItem): string {
  const v = gv(item, "id");
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
}

function getRowKey(item: RecordItem, i: number): string {
  return getRowId(item) || String(i);
}

/* ---------- 生命周期 ---------- */
onMounted(() => fetchLeakPoints());

/* ---------- 筛选 ---------- */
function handleLeakLevelChange(ev: { detail: { value: number } }) {
  const opt = leakLevelOptions[ev.detail.value];
  filters.leakLevel = (opt?.value as number | "") ?? "";
}

function buildQuery(): Record<string, unknown> {
  return rmEmpty({
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    startTime: normDate(filters.startTime, false),
    endTime: normDate(filters.endTime, true),
    sortOrder: "desc",
    sortField: "detectedTime",
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
    records.value = p.records;
    total.value = p.total;
    selectedIds.value = new Set();
    selectFirstRow();
  } catch (e: unknown) {
    records.value = [];
    total.value = 0;
    selectedRecord.value = null;
    selectedRecordKey.value = "";
    uni.showToast({ title: (e as { msg?: string }).msg || "加载失败", icon: "none" });
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

function changePage(s: number) {
  const n = pagination.pageNum + s;
  if (n < 1 || n > totalPages.value) return;
  pagination.pageNum = n;
  fetchLeakPoints();
}

/* ---------- 选中/批量 ---------- */
function selectFirstRow() {
  if (!records.value.length) {
    selectedRecord.value = null;
    selectedRecordKey.value = "";
    return;
  }
  selectedRecord.value = records.value[0];
  selectedRecordKey.value = getRowKey(records.value[0], 0);
  activeDetailTab.value = "base";
}

function selectRecord(item: RecordItem, i: number) {
  selectedRecord.value = item;
  selectedRecordKey.value = getRowKey(item, i);
  activeDetailTab.value = "base";
  const id = getRowId(item);
  if (!id) return;
  getLeakPointDetail(id)
    .then((res: unknown) => {
      ok(res as Res);
        const d = (res as Res)?.data;
        if (isObj(d)) {
          selectedRecord.value = { ...item, ...(d as RecordItem) };
        }
    })
    .catch(() => {});
}

function isItemSelected(item: RecordItem) {
  return selectedIds.value.has(getRowKey(item, records.value.indexOf(item)));
}

function toggleSelectItem(item: RecordItem) {
  const key = getRowKey(item, records.value.indexOf(item));
  const s = new Set(selectedIds.value);
  s.has(key) ? s.delete(key) : s.add(key);
  selectedIds.value = s;
}

function toggleSelectAll() {
  selectedIds.value = isAllSelected.value
    ? new Set()
    : new Set(records.value.map((r, i) => getRowKey(r, i)));
}

/* ---------- 弹窗控制 ---------- */
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
  fillForm(selectedRecord.value);
  dialogVisible.value = true;
}

function closeDialog() {
  dialogVisible.value = false;
}

/* ---------- 表单操作 ---------- */
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
  formLeakLevelIndex.value = 0;
  photoList.value = [];
  photoIdListText.value = "";
  clearValidationErrors();
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
  // 照片
  const picId = String(gv(item, "leakPicture") ?? "");
  form.leakPicture = picId;
  photoIdListText.value = picId;
  photoList.value = picId
    ? [{ url: `/api/file/preview/${picId}`, id: picId }]
    : [];
  clearValidationErrors();
}

function handleFormLeakLevelChange(ev: { detail: { value: number } }) {
  formLeakLevelIndex.value = ev.detail.value;
  form.leakLevel = leakLevelOptionsWithoutAll[ev.detail.value].value as LeakLevel;
}

function clearValidationErrors() {
  validationErrors.detectedTime = "";
  validationErrors.leakAddress = "";
  validationErrors.leakLevel = "";
}

/* ---------- 表单校验 ---------- */
function validateForm(): boolean {
  clearValidationErrors();
  let valid = true;
  if (!form.detectedTime) {
    validationErrors.detectedTime = "请选择检出时间";
    valid = false;
  }
  if (!form.leakAddress.trim()) {
    validationErrors.leakAddress = "请输入漏点位置";
    valid = false;
  }
  if (formLeakLevelIndex.value < 0) {
    validationErrors.leakLevel = "请选择渗漏级别";
    valid = false;
  }
  return valid;
}

/* ---------- 图片上传 ---------- */
function handleUploadPhoto() {
  uni.chooseImage({
    count: 9 - photoList.value.length,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (res) => {
      const newPhotos: PhotoItem[] = [];
      // H5 下 tempFilePaths 是 blob URL 或临时路径
      const paths: string[] = Array.isArray(res.tempFilePaths) ? res.tempFilePaths : [res.tempFilePaths];
      paths.forEach((path: string, idx: number) => {
        const id = `img_${Date.now()}_${idx}`;
        newPhotos.push({ url: path, id });
      });
      photoList.value = [...photoList.value, ...newPhotos];
      form.leakPicture = photoList.value.map((p) => p.id).join(",");
      photoIdListText.value = form.leakPicture;
      // TODO: 接入实际文件上传接口，替换临时 ID
    },
    fail: () => {
      uni.showToast({ title: "取消选择", icon: "none" });
    },
  });
}

function removePhoto(idx: number) {
  photoList.value.splice(idx, 1);
  form.leakPicture = photoList.value.map((p) => p.id).join(",");
  photoIdListText.value = form.leakPicture;
}

/* ---------- 音频上传 ---------- */
function handleUploadAudio() {
  uni.showToast({ title: "音频上传功能开发中", icon: "none" });
  // TODO: 接入音频选择与上传 API
}

/* ---------- 地图拾取坐标 ---------- */
function pickCoordinateOnMap() {
  uni.getLocation({
    type: "gcj02",
    success: (res) => {
      form.leakCoordinate = `${res.longitude},${res.latitude}`;
      uni.showToast({ title: "已获取当前位置坐标", icon: "success" });
    },
    fail: () => {
      uni.showToast({ title: "获取位置失败，请手动输入", icon: "none" });
    },
  });
}

/* ---------- 提交 ---------- */
function buildPayload() {
  return rmEmpty({
    detectedTime: normDt(form.detectedTime),
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
    leakPicture: form.leakPicture.trim() || undefined,
    remark: form.remark.trim(),
  });
}

async function submitForm() {
  if (!validateForm()) {
    const firstError = validationErrors.detectedTime || validationErrors.leakAddress || validationErrors.leakLevel;
    if (firstError) uni.showToast({ title: firstError, icon: "none" });
    return;
  }
  submitting.value = true;
  try {
    const payload = buildPayload();
    let res: Res;
    if (isEditing.value) {
      const id = selectedRecord.value ? getRowId(selectedRecord.value) : "";
      if (!id) {
        uni.showToast({ title: "无法获取记录ID", icon: "none" });
        return;
      }
      res = (await updateLeakPoint(id, payload)) as Res;
    } else {
      res = (await createLeakPoint(payload)) as Res;
    }
    ok(res);
    uni.showToast({ title: isEditing.value ? "编辑成功" : "新增成功", icon: "success" });
    closeDialog();
    fetchLeakPoints();
  } catch (e: unknown) {
    uni.showToast({ title: (e as { msg?: string }).msg || "提交失败", icon: "none" });
  } finally {
    submitting.value = false;
  }
}

/* ---------- 删除 ---------- */
async function handleDelete() {
  if (!selectedRecord.value) {
    uni.showToast({ title: "请先选择漏点记录", icon: "none" });
    return;
  }
  const id = getRowId(selectedRecord.value);
  if (!id) return;
  try {
    ok((await deleteLeakPoint(id)) as Res);
    uni.showToast({ title: "删除成功", icon: "success" });
    selectedRecord.value = null;
    fetchLeakPoints();
  } catch (e: unknown) {
    uni.showToast({ title: (e as { msg?: string }).msg || "删除失败", icon: "none" });
  }
}

async function handleBatchDelete() {
  if (!selectedIds.value.size) return;
  const ids = Array.from(selectedIds.value)
    .map((k) => {
      const i = records.value.findIndex((r, idx) => getRowKey(r, idx) === k);
      return i >= 0 ? getRowId(records.value[i]) : "";
    })
    .filter(Boolean);
  if (!ids.length) return;
  try {
    ok((await batchDeleteLeakPoint(ids)) as Res);
    uni.showToast({ title: `已删除${ids.length}条`, icon: "success" });
    selectedIds.value = new Set();
    fetchLeakPoints();
  } catch (e: unknown) {
    uni.showToast({ title: (e as { msg?: string }).msg || "批量删除失败", icon: "none" });
  }
}

function getFieldValue(item: RecordItem | null, key: string): string {
  if (!item) return "";
  const v = gv(item, key);
  if (v === undefined || v === null) return "";
  return String(v);
}

function formatDateTime(v: unknown): string {
  return fmtDt(v);
}

/* ---------- 工具函数 ---------- */
function getLeakLevelLabel(item: RecordItem | null): string {
  if (!item) return "-";
  const v = Number(gv(item, "leakLevel"));
  if (v === 0) return "轻度";
  if (v === 1) return "中度";
  if (v === 2) return "重度";
  return "未知";
}

function getLeakLevelClass(item: RecordItem): string {
  const v = Number(gv(item, "leakLevel"));
  if (v === 0) return "level-pill--light";
  if (v === 1) return "level-pill--medium";
  if (v === 2) return "level-pill--heavy";
  return "";
}

function getLeakLevelBadgeClass(item: RecordItem): string {
  const v = Number(gv(item, "leakLevel"));
  if (v === 0) return "detail-summary__badge--light";
  if (v === 1) return "detail-summary__badge--medium";
  if (v === 2) return "detail-summary__badge--heavy";
  return "";
}

function fmtDt(v: unknown): string {
  if (!v || v === "-") return String(v || "-");
  return String(v).replace("T", " ").replace(/\.\d+/, "").replace(/(?:Z|[+-]\d{2}:?\d{2})$/, "");
}

function toLocal(v: unknown): string {
  if (!v) return "";
  const d = typeof v === "string" ? new Date(String(v).replace(" ", "T")) : new Date(v as number);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
}

function normDate(v: string, isEnd: boolean): string | undefined {
  if (!v) return undefined;
  const n = v.trim().replace(/\s+/, "T");
  if (n.includes("T")) return n.length === 16 ? `${n}:00` : n;
  return `${n}T${isEnd ? "23:59:59" : "00:00:00"}`;
}

function normDt(v: string): string | undefined {
  if (!v) return undefined;
  const n = v.trim().replace(/\s+/, "T");
  return n.includes("T") ? (n.length === 16 ? `${n}:00` : n) : n;
}

function p2(n: number): string {
  return String(n).padStart(2, "0");
}

function parsePage(res: Res) {
  const d = res?.data ?? res;
  const pg = findPg(d) || findPg(res) || (isObj(d) ? d : {});
  const recs = arr(pg, ["records", "rows", "list", "items"]) || arr(res, ["records", "rows", "list", "items"]);
  const t = num(pg, ["total", "count", "totalCount"]) ?? num(res, ["total", "count", "totalCount"]);
  const c = num(pg, ["current", "pageNum", "page", "pageNo"]);
  const s = num(pg, ["size", "pageSize", "limit"]);
  if (c) pagination.pageNum = c;
  if (s) pagination.pageSize = s;
  const mt = (pagination.pageNum - 1) * pagination.pageSize + recs.length;
  return {
    records: recs.map((r: unknown) => (isObj(r) ? r : { value: r })),
    total: t === undefined ? recs.length : Math.max(t, mt),
  };
}

function findPg(v: unknown): RecordItem | null {
  if (!isObj(v)) return null;
  if (arr(v, ["records", "rows", "list", "items"]).length > 0 || num(v, ["total", "count", "totalCount"]) !== undefined) return v as RecordItem;
  for (const k of ["data", "result", "page", "pageData"]) {
    const m = findPg((v as RecordItem)[k]);
    if (m) return m;
  }
  return null;
}

function arr(v: unknown, ks: string[]): unknown[] {
  if (!isObj(v)) return [];
  for (const k of ks) {
    const a = (v as RecordItem)[k];
    if (Array.isArray(a)) return a;
  }
  return [];
}

function num(v: unknown, ks: string[]): number | undefined {
  if (!isObj(v)) return undefined;
  for (const k of ks) {
    const a = (v as RecordItem)[k];
    if (typeof a === "number") return a;
    if (typeof a === "string" && a.trim() && !isNaN(Number(a))) return Number(a);
  }
  return undefined;
}

function isObj(v: unknown): v is RecordItem {
  return Boolean(v && typeof v === "object" && !Array.isArray(v));
}

function rmEmpty(obj: RecordItem): RecordItem {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v !== undefined && v !== null));
}

function ok(res: Res | undefined) {
  const c = res?.code;
  if (c === undefined || c === 0 || c === 200) return;
  throw { code: c, msg: res?.msg || "请求失败" };
}
</script>

<style scoped lang="scss">
/* ===================== 页面基础 ===================== */
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

/* ===================== 工具栏 ===================== */
.toolbar, .table-panel, .detail-panel, .stat-card {
  background: #fff;
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
.toolbar-row--filters { margin-bottom: 10px; }
.toolbar-row--bottom { justify-content: space-between; }
.filter-group { display: flex; align-items: center; gap: 8px; }
.filter-label { flex: none; color: #183755; font-size: 13px; font-weight: 700; white-space: nowrap; }
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
.input-placeholder { color: #7f8fa3; font-size: 14px; }
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
.date-range { display: flex; align-items: center; gap: 6px; }
.filter-datetime { width: 170px; }
.filter-separator { flex: none; color: #7f8fa3; font-size: 13px; }
.toolbar-actions { display: flex; align-items: center; gap: 10px; }
.toolbar-actions--right { margin-left: auto; }
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
  background: #fff;
  border: 1px solid #d5e2ee;
  border-radius: 6px;
  cursor: pointer;
}
.toolbar-button--primary { color: #fff; background: #0d82ee; border-color: #0d82ee; }
.toolbar-button--danger { color: #e74c3c; border-color: #e74c3c; }
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
  background: #fff;
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

/* ===================== 统计卡片 ===================== */
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
.stat-card__label { color: #64748b; font-size: 13px; }
.stat-card__value { color: #183755; font-size: 24px; font-weight: 900; }

/* ===================== 表格区域 ===================== */
.main-layout { display: flex; flex: 1; min-height: 0; gap: 12px; overflow: hidden; }
.table-panel { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
.table-head, .pagination-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; }
.table-head { flex: none; color: #183755; font-size: 15px; font-weight: 900; border-bottom: 1px solid #edf3f8; }
.table-head__meta { color: #64748b; font-size: 13px; font-weight: 600; }
.table-scroll { flex: 1; min-height: 0; overflow: auto; }
.data-table { min-width: 860px; }
.data-row { display: flex; align-items: center; height: 46px; border-bottom: 1px solid #f3f7fc; cursor: pointer; }
.data-row--header { position: sticky; top: 0; z-index: 2; background: #f7fafd; cursor: default; }
.data-row--active { background: #edf5ff; }
.data-row:hover:not(.data-row--header) { background: #f7fafd; }
.data-cell {
  flex: none;
  padding: 0 8px;
  overflow: hidden;
  color: #172033;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.data-row--header .data-cell { color: #183755; font-weight: 700; }
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
.checkbox--checked { background: #0d82ee; border-color: #0d82ee; }
.checkbox__mark {
  display: block;
  width: 6px;
  height: 10px;
  border-right: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(45deg) translate(-1px, -1px);
}
.level-pill { display: inline-block; padding: 2px 8px; font-size: 12px; font-weight: 700; border-radius: 10px; }
.level-pill--light { color: #16a34a; background: #dcfce7; }
.level-pill--medium { color: #d97706; background: #fef3c7; }
.level-pill--heavy { color: #dc2626; background: #fee2e2; }
.table-state { padding: 32px; color: #7c8da1; font-size: 14px; text-align: center; }

/* ===================== 分页 ===================== */
.pagination-bar { flex: none; border-top: 1px solid #edf3f8; }
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
  background: #fff;
  border: 1px solid #d5e2ee;
  border-radius: 6px;
  cursor: pointer;
}
.page-button--hover { background: #edf5ff; }
.page-button:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { color: #64748b; font-size: 13px; font-weight: 600; }

/* ===================== 详情面板 ===================== */
.detail-panel { width: 340px; flex: none; display: flex; flex-direction: column; overflow: hidden; }
.detail-empty { flex: 1; display: flex; align-items: center; justify-content: center; color: #7c8da1; font-size: 14px; }
.detail-body { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
.detail-tabs { display: flex; flex: none; border-bottom: 1px solid #edf3f8; }
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
.detail-tab--active { color: #0d82ee; border-bottom-color: #0d82ee; }
.detail-section { flex: 1; min-height: 0; padding: 14px; overflow-y: auto; }
.detail-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid #edf3f8;
}
.detail-summary__main { display: flex; flex-direction: column; gap: 4px; }
.detail-summary__label { color: #64748b; font-size: 12px; font-weight: 600; }
.detail-summary__value { color: #172033; font-size: 16px; font-weight: 900; }
.detail-summary__badges { display: flex; gap: 8px; }
.detail-summary__badge { display: inline-block; padding: 2px 10px; font-size: 12px; font-weight: 700; border-radius: 10px; background: #edf5ff; color: #0d82ee; }
.detail-summary__badge--light { color: #16a34a; background: #dcfce7; }
.detail-summary__badge--medium { color: #d97706; background: #fef3c7; }
.detail-summary__badge--heavy { color: #dc2626; background: #fee2e2; }
.detail-grid { display: flex; flex-direction: column; gap: 12px; }
.detail-item { display: flex; flex-direction: column; gap: 4px; }
.detail-item--note { padding-bottom: 12px; border-bottom: 1px solid #f3f7fc; }
.detail-item__label { color: #64748b; font-size: 12px; font-weight: 600; }
.detail-item__value { color: #172033; font-size: 14px; font-weight: 600; word-break: break-all; }
.detail-actions { display: flex; gap: 10px; flex: none; padding: 12px 14px; border-top: 1px solid #edf3f8; }

/* ===================== 弹窗（重构版） ===================== */
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
  width: 720px;
  max-width: calc(100vw - 28px);
  max-height: 86vh;
  overflow: hidden;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 18px 46px rgba(15, 35, 55, 0.2);
}

.dialog-head {
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

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  margin: 0;
  background: #f6fbff;
  border: 1px solid #d9e7f3;
  border-radius: 6px;
  cursor: pointer;
}

.icon-button--hover {
  background: #edf7ff;
  border-color: #0d82ee;
}

.close-icon {
  position: relative;
  width: 14px;
  height: 14px;
}

.close-icon::before,
.close-icon::after {
  position: absolute;
  top: 6px;
  left: 0;
  width: 14px;
  height: 2px;
  content: "";
  background: #64748b;
  border-radius: 2px;
}

.close-icon::before { transform: rotate(45deg); }
.close-icon::after { transform: rotate(-45deg); }

.dialog-body {
  flex: 1;
  min-height: 0;
  max-height: none;
  overflow-y: auto;
  padding: 18px 24px 16px;
  background: #ffffff;
}

/* ========== 表单分区 ========== */
.form-section {
  margin-bottom: 14px;
  padding: 0;
  background: #ffffff;
  border: 0;
  border-radius: 0;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 11px;
  padding-bottom: 9px;
  border-bottom: 1px solid #eef4fa;
}

.section-title {
  position: relative;
  padding-left: 10px;
  color: #183755;
  font-size: 16px;
  font-weight: 900;

  &::before {
    position: absolute;
    top: 50%;
    left: 0;
    width: 3px;
    height: 16px;
    content: "";
    background: #0d82ee;
    border-radius: 999px;
    transform: translateY(-50%);
  }
}

.section-hint {
  color: #94a3b8;
  font-size: 12px;
}

/* ========== 表单网格 ========== */
.form-grid {
  display: grid;
  gap: 12px 18px;

  &--two {
    grid-template-columns: repeat(2, 1fr);
  }
}

.form-field {
  min-width: 0;

  &--wide {
    grid-column: span 2;
  }
}

.form-label {
  display: block;
  margin-bottom: 5px;
  color: #34495e;
  font-size: 13px;
  font-weight: 700;

  &--required::after {
    margin-left: 4px;
    color: #ef4444;
    content: "*";
  }
}

.form-error {
  display: block;
  margin-top: 4px;
  color: #ef4444;
  font-size: 12px;
}

.form-input,
.form-select {
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  height: 38px;
  padding: 0 12px;
  overflow: hidden;
  color: #172033;
  font-size: 14px;
  line-height: 38px;
  text-overflow: ellipsis;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;

  &--flex {
    flex: 1;
  }
}

.form-input:focus,
.form-textarea:focus {
  background: #ffffff;
  border-color: #8fc8f8;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.1);
}

.form-select {
  display: flex;
  align-items: center;
  justify-content: space-between;

  &--dropdown {
    background: #f7fbff;
    box-shadow: inset 0 -1px 0 rgba(13, 130, 238, 0.03);
  }

  &__placeholder {
    color: #9aa9b8;
  }
}

.form-textarea {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-height: 88px;
  padding: 9px 12px;
  color: #172033;
  font-size: 14px;
  line-height: 1.45;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
}

.select-arrow {
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

/* ========== 表单行（坐标/音频） ========== */
.form-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* ========== 操作按钮 ========== */
.form-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
  height: 38px;
  padding: 0 14px;
  color: #0d82ee;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  background: #edf7ff;
  border: 1px solid #b8ddf8;
  border-radius: 4px;
  cursor: pointer;
}

.form-action-btn--small {
  height: 38px;
  padding: 0 12px;
  font-size: 12px;
}

.form-action-btn--hover {
  background: #d6edfc;
  border-color: #0d82ee;
}

.form-action-btn__icon--map {
  display: inline-block;
  width: 14px;
  height: 14px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230d82ee'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z'/%3E%3C/svg%3E") center/contain no-repeat;
}

/* ========== 照片上传 ========== */
.form-photo-area {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.photo-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.photo-preview-item {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 6px;
  overflow: hidden;
}

.photo-thumb {
  width: 100%;
  height: 100%;
}

.photo-remove-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  margin: 0;
  background: rgba(0, 0, 0, 0.55);
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}

.photo-remove-btn--hover {
  background: rgba(0, 0, 0, 0.75);
}

.photo-remove-icon {
  position: relative;
  width: 10px;
  height: 10px;
}

.photo-remove-icon::before,
.photo-remove-icon::after {
  position: absolute;
  top: 4px;
  left: 0;
  width: 10px;
  height: 2px;
  content: "";
  background: #fff;
  border-radius: 1px;
}

.photo-remove-icon::before { transform: rotate(45deg); }
.photo-remove-icon::after { transform: rotate(-45deg); }

.photo-add-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 88px;
  height: 88px;
  border: 2px dashed #c5d2e2;
  border-radius: 6px;
  background: #fbfdff;
  cursor: pointer;
  transition: border-color 0.16s ease, background 0.16s ease;
}

.photo-add-box:hover {
  border-color: #0d82ee;
  background: #edf7ff;
}

.photo-add-icon {
  font-size: 26px;
  font-weight: 300;
  color: #94a3b8;
  line-height: 1;
}

.photo-add-label {
  font-size: 11px;
  color: #94a3b8;
}

.form-input--hidden-id {
  margin-top: 10px;
  height: 32px;
  font-size: 12px;
  color: #94a3b8;
  background: #f9fafb;
}

/* ========== 弹窗吸底按钮 ========== */
.dialog-actions {
  display: flex;
  flex: none;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 22px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1px solid #edf3f8;
  box-shadow: 0 -4px 16px rgba(24, 55, 85, 0.06);
}

.dialog-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  height: 38px;
  padding: 0 22px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.16s ease;
}

.dialog-btn--cancel {
  color: #34495e;
  background: #f1f5f9;
  border: 1px solid #d5e2ee;
}

.dialog-btn--primary {
  color: #fff;
  background: #0d82ee;
  border: 1px solid #0d82ee;
}

.dialog-btn--hover {
  opacity: 0.85;
}

.dialog-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ===================== 响应式 ===================== */
@media (max-width: 1024px) {
  .main-layout { flex-direction: column; }
  .detail-panel { width: 100%; max-height: 340px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .form-grid--two {
    grid-template-columns: 1fr;
  }
  .form-field--full {
    grid-column: span 1;
  }
}
</style>