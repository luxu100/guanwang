<template>
  <view class="alarm-view">
    <view class="toolbar-panel">
      <view class="alarm-toolbar">
        <view class="toolbar-row toolbar-row--filters">
          <view class="filter-group">
          <text class="filter-label">{{ localeText("报警类型", "Type") }}</text>
          <picker :range="alarmTypeOptions" range-key="label" :value="filters.alarmTypeIndex" @change="handleFilterTypeChange">
            <view class="filter-select">
              <text>{{ alarmTypeOptions[filters.alarmTypeIndex].label }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">{{ localeText("报警级别", "Level") }}</text>
          <picker :range="alarmLevelOptions" range-key="label" :value="filters.alarmLevelIndex" @change="handleFilterLevelChange">
            <view class="filter-select">
              <text>{{ alarmLevelOptions[filters.alarmLevelIndex].label }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">{{ localeText("状态", "Status") }}</text>
          <picker :range="statusOptions" range-key="label" :value="filters.statusIndex" @change="handleFilterStatusChange">
            <view class="filter-select">
              <text>{{ statusOptions[filters.statusIndex].label }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">{{ localeText("设备编号", "Device No.") }}</text>
          <input v-model="filters.deviceNumber" class="filter-input" :placeholder="localeText('请输入设备编号', 'Enter device no.')" placeholder-class="input-placeholder" />
        </view>

        <view class="filter-group">
          <text class="filter-label">{{ localeText("部门", "Department") }}</text>
          <picker :range="deptPickerOptions" range-key="label" :value="filters.deptIndex" @change="handleFilterDeptChange">
            <view class="filter-select">
              <text>{{ deptPickerOptions[filters.deptIndex].label }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        </view>

        <view class="toolbar-row toolbar-row--bottom">
          <view class="filter-group filter-group--date">
          <text class="filter-label">{{ localeText("时间段", "Time Range") }}</text>
          <view class="date-range">
            <WorkOrderDatetimePicker v-model="filters.startTime" class="filter-datetime" :title="filterDateText.startTitle" :placeholder="filterDateText.startPlaceholder" />
            <text class="filter-separator">至</text>
            <WorkOrderDatetimePicker v-model="filters.endTime" class="filter-datetime" :title="filterDateText.endTitle" :placeholder="filterDateText.endPlaceholder" />
          </view>
        </view>

        <view class="toolbar-actions">
          <button class="toolbar-button toolbar-button--primary" @click="searchAlarms">{{ localeText("查询", "Search") }}</button>
          <button class="toolbar-button" @click="resetFilters">{{ localeText("重置", "Reset") }}</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 表格 + 右侧详情（同漏点页双栏布局） -->
    <view class="main-layout">
      <view class="table-panel">
      <view class="table-head">
        <text>{{ localeText("报警处理", "Alarm Handling") }}</text>
        <view class="table-head__status">
          <text v-if="pollFailed" class="refresh-status refresh-status--failed">{{ localeText("更新失败，正在重试", "Update failed, retrying") }}</text>
          <text v-else-if="lastRefreshSuccessAt" class="refresh-status">{{ localeText("已更新", "Updated") }} {{ fmtClock(lastRefreshSuccessAt) }}</text>
        </view>
        <text class="table-head__meta">{{ localizedTotal(pagination.total) }}</text>
      </view>

      <scroll-view class="table-scroll" scroll-x scroll-y>
        <view class="table">
          <view class="table-row table-row--header record-table-row" :style="{ gridTemplateColumns: processingGridColumnsNoCheck }">
            <view v-for="column in recordColumns" :key="column.key" class="table-cell table-header-cell">
              <text>{{ localeText(column.label, column.labelEn) }}</text>
            </view>
          </view>

          <view v-if="loading" class="table-state">{{ localeText("加载中...", "Loading...") }}</view>
          <view v-else-if="alarmList.length === 0" class="table-state">{{ localeText("暂无报警数据", "No alarms") }}</view>

          <view
            v-for="(item, index) in alarmList"
            v-else
            :key="item.id"
            class="table-row record-table-row"
            :class="{ 'table-row--selected': selectedRecordKey === String(item.id) }"
            :style="{ gridTemplateColumns: processingGridColumnsNoCheck }"
          >
            <template v-for="column in recordColumns" :key="column.key">
              <text v-if="column.renderType === 'index'" class="table-cell" :class="column.className">{{ (pagination.current - 1) * pagination.size + index + 1 }}</text>
              <view v-else-if="column.renderType === 'level-pill'" class="table-cell" :class="column.className">
                <text class="level-pill" :class="getLevelClass(getCellValue(item, column.key) as string | null)">{{ getLevelText(getCellValue(item, column.key) as string | null) }}</text>
              </view>
              <view v-else-if="column.renderType === 'status-pill'" class="table-cell" :class="column.className">
                <text class="status-pill" :class="getStatusClass(getCellValue(item, column.key) as string | null)">{{ getStatusText(getCellValue(item, column.key) as string | null) }}</text>
              </view>
              <view v-else-if="column.renderType === 'action'" class="table-cell col-action">
                <button class="table-action-btn" :class="{ 'table-action-btn--active': selectedRecordKey === String(item.id) }" @click.stop="toggleDetail(item)">{{ localeText("详情", "Detail") }}</button>
                <button v-if="item.status === 'ACTIVE'" class="table-action-btn" @click.stop="openHandleDialog(item)">{{ localeText("确认", "Confirm") }}</button>
                <button v-if="item.status === 'ACTIVE' || item.status === 'CONFIRMED'" class="table-action-btn" @click.stop="openResolveDialog(item)">{{ localeText("关闭", "Close") }}</button>
              </view>
              <text v-else class="table-cell" :class="column.className" :title="cellText(item, column)">{{ cellText(item, column) }}</text>
            </template>
          </view>
        </view>
      </scroll-view>

      <view class="pagination-bar">
        <button class="page-btn" :disabled="pagination.current <= 1" @click="handlePageChange(pagination.current - 1)">
          {{ localeText("上一页", "Previous") }}
        </button>
        <text class="page-info">{{ localizedPageInfo(pagination.current, totalPages) }}</text>
        <button class="page-btn" :disabled="pagination.current >= totalPages" @click="handlePageChange(pagination.current + 1)">
          {{ localeText("下一页", "Next") }}
        </button>
        <text class="page-info">{{ localeText("到第", "Go to") }}</text>
        <input v-model.number="jumpPage" class="page-input" type="number" @keyup.enter="handlePageChange(jumpPage)" />
        <text class="page-info">{{ localeText("页", "page") }}</text>
        <button class="page-btn" :disabled="jumpPage === null || jumpPage < 1 || jumpPage > totalPages" @click="handlePageChange(jumpPage)">
          {{ localeText("跳转", "Go") }}
        </button>
      </view>
      </view>

    <!-- 右侧详情面板（同漏点页交互：点"详情"出现，再点一次隐藏） -->
    <view v-if="selectedRecord" class="detail-panel">
      <view class="detail-panel__head">
        <view class="detail-panel__title-wrap">
          <text class="detail-panel__title">{{ localeText("报警详情", "Alarm Detail") }}</text>
          <text class="detail-panel__subtitle">{{ selectedRecord.ruleName || "-" }}</text>
        </view>
        <button class="icon-button" hover-class="icon-button--hover" :aria-label="localeText('关闭', 'Close')" @click="closeDetail">
          <text class="close-icon"></text>
        </button>
      </view>
      <scroll-view class="detail-panel__body" scroll-y>
        <view class="detail-grid">
          <view
            v-for="field in detailFields"
            :key="field.key"
            class="detail-item"
            :class="{ 'detail-item--full': field.full }"
          >
            <text class="detail-item__label">{{ localeText(field.label, field.labelEn) }}</text>
            <text v-if="field.renderType === 'level-pill'" class="detail-item__value">
              <text class="level-pill" :class="getLevelClass(detailPillValue(field))">{{ getLevelText(detailPillValue(field)) }}</text>
            </text>
            <text v-else-if="field.renderType === 'status-pill'" class="detail-item__value">
              <text class="status-pill" :class="getStatusClass(detailPillValue(field))">{{ getStatusText(detailPillValue(field)) }}</text>
            </text>
            <text v-else class="detail-item__value" :title="detailValue(field)">{{ detailValue(field) }}</text>
          </view>
        </view>
      </scroll-view>
    </view>
    </view>

    <view v-if="handleVisible" class="dialog-mask" @click="handleVisible = false">
      <view class="dialog-panel dialog-panel--narrow" @click.stop>
        <view class="dialog-head">
          <view>
            <text class="dialog-title">{{ localeText("确认报警", "Confirm Alarm") }}</text>
            <text class="dialog-subtitle">{{ handleRecord?.ruleName || "-" }}</text>
          </view>
          <button class="icon-button" hover-class="icon-button--hover" :aria-label="localeText('关闭', 'Close')" @click="handleVisible = false">
            <text class="close-icon"></text>
          </button>
        </view>

        <view class="dialog-body">
          <view class="form-field">
            <text class="form-label">{{ localeText("处理备注", "Handle Remark") }}</text>
            <textarea v-model="handleRemark" class="form-textarea" :placeholder="localeText('请输入处理备注', 'Enter handle remark')" placeholder-class="input-placeholder" :maxlength="200" />
          </view>
        </view>

        <view class="dialog-footer">
          <button class="toolbar-button" @click="handleVisible = false">{{ localeText("取消", "Cancel") }}</button>
          <button class="toolbar-button toolbar-button--primary" :loading="handling" @click="submitHandle">{{ localeText("确认", "Confirm") }}</button>
        </view>
      </view>
    </view>

    <!-- 关闭报警弹窗（resolve：人工关闭，写恢复时间） -->
    <view v-if="resolveVisible" class="dialog-mask" @click="resolveVisible = false">
      <view class="dialog-panel dialog-panel--narrow" @click.stop>
        <view class="dialog-head">
          <view>
            <text class="dialog-title">{{ localeText("关闭报警", "Close Alarm") }}</text>
            <text class="dialog-subtitle">{{ resolveRecord?.ruleName || "-" }}</text>
          </view>
          <button class="icon-button" hover-class="icon-button--hover" :aria-label="localeText('关闭', 'Close')" @click="resolveVisible = false">
            <text class="close-icon"></text>
          </button>
        </view>

        <view class="dialog-body">
          <view class="form-field">
            <text class="form-label">{{ localeText("处理备注", "Handle Remark") }}</text>
            <textarea v-model="resolveRemark" class="form-textarea" :placeholder="localeText('请输入处理备注', 'Enter handle remark')" placeholder-class="input-placeholder" :maxlength="200" />
          </view>
        </view>

        <view class="dialog-footer">
          <button class="toolbar-button" @click="resolveVisible = false">{{ localeText("取消", "Cancel") }}</button>
          <button class="toolbar-button toolbar-button--primary" :loading="resolving" @click="submitResolve">{{ localeText("确认关闭", "Confirm Close") }}</button>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { useI18n } from "@/i18n";
import { useLocaleText, useLocalizedPageInfo, useLocalizedTotal } from "@/i18n/localeText";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";
import {
  getAlarmPage,
  getAlarmDetail,
  confirmAlarm,
  resolveAlarm,
  getLatestActiveAlarms,
} from "@/services/alarm/api";
import type { AlarmRecord } from "@/services/alarm/api";
import {
  processingColumns,
  processingDetailFields,
  processingGridColumnsNoCheck,
  type AlarmDetailField,
  type AlarmTableColumn,
} from "@/pages/alarm/components/alarmColumns";
import { getDeptList } from "@/services/partition/partition";

const { locale } = useI18n();
const localeText = useLocaleText();
const localizedPageInfo = useLocalizedPageInfo();
const localizedTotal = useLocalizedTotal();


/** 报警类型筛选（后端字符串枚举；首项"不限"= 不过滤）。computed：随语言切换实时刷新。 */
const alarmTypeOptions = computed(() => [
  { label: localeText("不限", "All"), value: null as string | null },
  { label: localeText("设备离线", "Offline"), value: "OFFLINE" },
  { label: localeText("数据超时", "No Data"), value: "NO_DATA" },
  { label: localeText("渗漏疑似", "Leak Suspect"), value: "LEAK_SUSPECT" },
  { label: localeText("自定义规则", "Custom Rule"), value: "CUSTOM" },
]);
const alarmLevelOptions = computed(() => [
  { label: localeText("不限", "All"), value: null as string | null },
  { label: localeText("提示", "Info"), value: "INFO" },
  { label: localeText("警告", "Warning"), value: "WARNING" },
  { label: localeText("严重", "Critical"), value: "CRITICAL" },
]);
/** 三态状态机（后端：ACTIVE→CONFIRMED→RESOLVED；自动恢复 ACTIVE→RESOLVED） */
const statusOptions = computed(() => [
  { label: localeText("不限", "All"), value: null as string | null },
  { label: localeText("活跃", "Active"), value: "ACTIVE" },
  { label: localeText("已确认", "Confirmed"), value: "CONFIRMED" },
  { label: localeText("已关闭", "Resolved"), value: "RESOLVED" },
]);
interface DeptItem {
  id: number;
  deptName: string;
}

const filters = reactive({
  alarmTypeIndex: 0,
  alarmLevelIndex: 0,
  statusIndex: 0,
  deviceNumber: "",
  deptIndex: 0,
  startTime: "",
  endTime: "",
});

const POLL_INTERVAL = 45 * 1000;

const isEnglishLocale = computed(() => locale.value === "en-US");
const filterDateText = computed(() => ({
  startTitle: isEnglishLocale.value ? "Select Start Time" : "选择开始时间",
  startPlaceholder: isEnglishLocale.value ? "Select Start Time" : "请选择开始时间",
  endTitle: isEnglishLocale.value ? "Select End Time" : "选择结束时间",
  endPlaceholder: isEnglishLocale.value ? "Select End Time" : "请选择结束时间",
}));
const loading = ref(false);
const alarmList = ref<AlarmRecord[]>([]);
const deptList = ref<DeptItem[]>([]);
const pagination = reactive({ current: 1, size: 10, total: 0 });
/** 轮询健康状态：最后一次成功刷新时间 / 是否处于失败态（供页面显示，不弹窗） */
const lastRefreshSuccessAt = ref<number | null>(null);
const pollFailed = ref(false);
const jumpPage = ref<number | null>(null);

const recordColumns = processingColumns;
const detailFields = processingDetailFields;

/* 文案映射（后端字符串枚举；类型优先取后端附带的中文名） */
const textFormatters: Record<string, (item: AlarmRecord) => string> = {
  alarmType: (item) => item.alarmTypeName || getRuleTypeText(item.alarmType),
  lastTriggeredAt: (item) => fmtDateTime(item.lastTriggeredAt),
};
const detailFormatters: Record<string, (item: AlarmRecord) => string> = {
  alarmType: (item) => item.alarmTypeName || getRuleTypeText(item.alarmType),
  ruleKind: (item) => getRuleKindText(item.ruleKind),
  triggerCount: (item) => (item.triggerCount == null ? "-" : String(item.triggerCount)),
  firstTriggeredAt: (item) => fmtDateTime(item.firstTriggeredAt),
  lastTriggeredAt: (item) => fmtDateTime(item.lastTriggeredAt),
  recoveredAt: (item) => fmtDateTime(item.recoveredAt),
};

/** 时间戳格式化为 HH:mm:ss（轮询状态展示用） */
function fmtClock(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 后端 LocalDateTime 形如 2026-09-09T12:02:00.146924，格式化为 YYYY-MM-DD HH:mm:ss */
function fmtDateTime(value?: string | null) {
  if (!value) return "-";
  const m = String(value).match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2}))?/);
  if (!m) return String(value);
  return `${m[1]} ${m[2]}:${m[3] || "00"}`;
}

function getCellValue(item: AlarmRecord, key: string): unknown {
  return (item as Record<string, unknown>)[key];
}

function cellText(item: AlarmRecord, column: AlarmTableColumn): string {
  const formatter = column.formatKey ? textFormatters[column.formatKey] : undefined;
  if (formatter) return formatter(item);
  const raw = getCellValue(item, column.key);
  return raw == null || raw === "" ? "-" : String(raw);
}

function detailPillValue(field: AlarmDetailField): string | null | undefined {
  if (!selectedRecord.value) return undefined;
  return (selectedRecord.value as Record<string, unknown>)[field.key] as string | null | undefined;
}

function detailValue(field: AlarmDetailField): string {
  const record = selectedRecord.value;
  if (!record) return "-";
  const formatter = field.formatKey ? detailFormatters[field.formatKey] : undefined;
  if (formatter) return formatter(record);
  const raw = (record as Record<string, unknown>)[field.key];
  return raw == null || raw === "" ? "-" : String(raw);
}

const totalPages = computed(() => Math.max(1, Math.ceil(pagination.total / pagination.size)));

const deptPickerOptions = computed(() => [
  { label: "不限", value: null as number | null },
  ...deptList.value.map((dept) => ({ label: dept.deptName, value: dept.id as number | null })),
]);

/* ========================= 文案映射（后端字符串枚举） ========================= */

function getRuleTypeText(value?: string | null) {
  if (value == null) return "-";
  const map: Record<string, string> = { OFFLINE: "设备离线", NO_DATA: "数据超时", LEAK_SUSPECT: "渗漏疑似", CUSTOM: "自定义规则" };
  const enMap: Record<string, string> = { OFFLINE: "Offline", NO_DATA: "No Data", LEAK_SUSPECT: "Leak Suspect", CUSTOM: "Custom Rule" };
  return localeText(map[value] || value, enMap[value] || value);
}

function getRuleKindText(value?: string | null) {
  if (value == null) return "-";
  const map: Record<string, string> = { FIXED: "固定", CUSTOM: "自定义" };
  const enMap: Record<string, string> = { FIXED: "Fixed", CUSTOM: "Custom" };
  return localeText(map[value] || value, enMap[value] || value);
}

function getLevelText(value?: string | null) {
  if (value == null) return "-";
  const map: Record<string, string> = { INFO: "提示", WARNING: "警告", CRITICAL: "严重" };
  const enMap: Record<string, string> = { INFO: "Info", WARNING: "Warning", CRITICAL: "Critical" };
  return localeText(map[value] || value, enMap[value] || value);
}

function getLevelClass(value?: string | number | null) {
  if (value === "INFO") return "level-pill--info";
  if (value === "WARNING") return "level-pill--warning";
  if (value === "CRITICAL") return "level-pill--critical";
  return "level-pill--muted"; // 未知级别用中性色，不误标为严重
}

function getStatusText(value?: string | null) {
  const map: Record<string, string> = { ACTIVE: "活跃", CONFIRMED: "已确认", RESOLVED: "已关闭" };
  const enMap: Record<string, string> = { ACTIVE: "Active", CONFIRMED: "Confirmed", RESOLVED: "Resolved" };
  if (value == null) return "-";
  return localeText(map[value] || value, enMap[value] || value);
}

function getStatusClass(value?: string | null) {
  if (value === "ACTIVE") return "status-pill--processing";
  if (value === "CONFIRMED") return "status-pill--done";
  if (value === "RESOLVED") return "status-pill--muted";
  return "status-pill--open";
}

/* ========================= 数据加载 ========================= */

function normalizeDisplayDatetime(value: string) {
  return value.trim().replace(/\s+/, "T");
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

/** 已应用的查询条件快照：点"查询"（或重置/翻页）时保存；轮询只使用它，
 * 不会把用户正在编辑、尚未点击查询的条件应用到请求里。 */
const appliedQuery = ref<Record<string, unknown>>({});

function buildPageParams(page: number, source: Record<string, unknown> = {}) {
  const params: Record<string, unknown> = {
    pageNum: page,
    pageSize: pagination.size,
    ...source,
  };
  return params;
}

/** 从当前筛选表单收集查询条件（不含分页） */
function collectFilterParams(): Record<string, unknown> {
  const filterParams: Record<string, unknown> = {};
  const alarmType = alarmTypeOptions.value[filters.alarmTypeIndex].value;
  if (alarmType !== null) filterParams.alarmType = alarmType;
  const alarmLevel = alarmLevelOptions.value[filters.alarmLevelIndex].value;
  if (alarmLevel !== null) filterParams.alarmLevel = alarmLevel;
  const status = statusOptions.value[filters.statusIndex].value;
  if (status !== null) filterParams.status = status;
  if (filters.deviceNumber.trim()) filterParams.deviceNumber = filters.deviceNumber.trim();
  const deptId = deptPickerOptions.value[filters.deptIndex].value;
  if (deptId !== null) filterParams.deptId = deptId;
  filterParams.startTime = normalizeDateForApi(filters.startTime, false);
  filterParams.endTime = normalizeDateForApi(filters.endTime, true);
  return filterParams;
}

let fetchRequestId = 0;

async function loadAlarms(page = 1, opts: { silent?: boolean; applyFilters?: boolean } = {}) {
  // 统一竞态守卫：静默刷新（轮询/页面恢复可见）遇到用户请求在途时让路，
  // 避免后发的静默请求作废用户正在等待的手动查询/翻页/操作后刷新
  if (opts.silent && loading.value) return;
  const requestId = ++fetchRequestId;
  if (!opts.silent) loading.value = true;
  // 仅显式 applyFilters（点查询/重置）才应用当前表单条件；
  // 操作成功后的刷新、翻页、轮询一律沿用已有快照，避免把未提交的筛选带进请求
  if (opts.applyFilters) appliedQuery.value = collectFilterParams();
  const params = buildPageParams(page, appliedQuery.value);
  try {
    const res = (await getAlarmPage(params as never)) as { code?: number; msg?: string; data?: { records?: AlarmRecord[]; total?: number } };
    if (requestId !== fetchRequestId) return;
    if (res.code !== undefined && res.code !== 200) {
      throw new Error(res.msg || "load failed");
    }
    lastRefreshSuccessAt.value = Date.now();
    pollFailed.value = false; // 列表已成功更新，立即清除"更新失败"提示
    const pageData = res.data || {};
    alarmList.value = pageData.records || [];
    pagination.total = pageData.total || 0;
    pagination.current = page;
    // 打开中的详情随列表刷新同步：只在列表仍包含该行时替换引用；
    // 列表更新本身会使旧详情请求失效（detailRequestId++），旧响应不会回写
    if (selectedRecord.value) {
      detailRequestId++;
      const refreshed = alarmList.value.find((item) => String(item.id) === selectedRecordKey.value);
      if (refreshed) {
        selectedRecord.value = refreshed;
      } else {
        // 详情所在行不在当前页/筛选结果中，关闭面板避免展示过期数据
        closeDetail();
      }
    }
  } catch {
    if (requestId !== fetchRequestId) return;
    if (opts.silent) {
      // 轮询静默失败：保留上次成功数据，标记失败态（不弹窗，45s 一次的弹窗是骚扰）
      pollFailed.value = true;
      return;
    }
    alarmList.value = [];
    pagination.total = 0;
    pagination.current = page;
    uni.showToast({ title: localeText("加载报警列表失败", "Failed to load alarms"), icon: "none" });
  } finally {
    if (requestId === fetchRequestId) {
      loading.value = false;
      jumpPage.value = null;
    }
  }
}

/** 点"查询"：应用当前表单条件并回到第一页 */
function searchAlarms() {
  loadAlarms(1, { applyFilters: true });
}

function resetFilters() {
  filters.alarmTypeIndex = 0;
  filters.alarmLevelIndex = 0;
  filters.statusIndex = 0;
  filters.deviceNumber = "";
  filters.deptIndex = 0;
  filters.startTime = "";
  filters.endTime = "";
  loadAlarms(1, { applyFilters: true });
}

function handlePageChange(page: number | null) {
  if (page == null || page < 1 || page > totalPages.value || page === pagination.current) return;
  loadAlarms(page);
}

/* ========================= 筛选事件 ========================= */

function handleFilterTypeChange(event: { detail: { value: number } }) {
  filters.alarmTypeIndex = Number(event.detail.value);
}
function handleFilterLevelChange(event: { detail: { value: number } }) {
  filters.alarmLevelIndex = Number(event.detail.value);
}
function handleFilterStatusChange(event: { detail: { value: number } }) {
  filters.statusIndex = Number(event.detail.value);
}
function handleFilterDeptChange(event: { detail: { value: number } }) {
  filters.deptIndex = Number(event.detail.value);
}

/* ========================= 右侧详情面板（同漏点页：点详情出现，再点隐藏） ========================= */

const selectedRecord = ref<AlarmRecord | null>(null);
const selectedRecordKey = ref("");
const detailLoading = ref(false);
let detailRequestId = 0;

async function toggleDetail(item: AlarmRecord) {
  const key = String(item.id);
  if (selectedRecordKey.value === key) {
    // 关闭面板时同步使在途详情请求失效，旧响应不允许再回写
    detailRequestId++;
    closeDetail();
    return;
  }
  // 先展示行数据（秒开），再拉详情接口校准最新值（报警合并/他人处理会持续变化）
  detailRequestId++;
  selectedRecord.value = item;
  selectedRecordKey.value = key;
  const requestId = detailRequestId;
  detailLoading.value = true;
  try {
    const res = (await getAlarmDetail(item.id as number)) as { code?: number; msg?: string; data?: AlarmRecord };
    if (requestId !== detailRequestId) return; // 期间切换过详情/关闭/列表刷新，丢弃
    if (res.code !== undefined && res.code !== 200) return; // 失败保留行数据
    // 仍选中同一条才回写；期间面板已换行/关闭则丢弃
    if (res.data && selectedRecordKey.value === key) {
      selectedRecord.value = res.data;
    }
  } catch {
    // 静默：详情接口失败时保留列表行数据展示
  } finally {
    if (requestId === detailRequestId) detailLoading.value = false;
  }
}

function closeDetail() {
  selectedRecord.value = null;
  selectedRecordKey.value = "";
}

/* ========================= 确认 ========================= */

const handleVisible = ref(false);
const handleRecord = ref<AlarmRecord | null>(null);
const handleRemark = ref("");
const handling = ref(false);

function openHandleDialog(item: AlarmRecord) {
  handleRecord.value = item;
  handleRemark.value = "";
  handleVisible.value = true;
}

async function submitHandle() {
  if (!handleRecord.value?.id || handling.value) return;
  handling.value = true;
  try {
    const payload = { handleRemark: handleRemark.value.trim() };
    const res = (await confirmAlarm(handleRecord.value.id, payload)) as { code?: number; msg?: string };

    if (res.code !== undefined && res.code !== 200) {
      uni.showToast({ title: res.msg || "处理失败", icon: "none" });
      return;
    }
    uni.showToast({ title: localeText("确认成功", "Confirmed"), icon: "success" });
    handleVisible.value = false;
    loadAlarms(pagination.current);
  } catch (error) {
    uni.showToast({ title: (error as { msg?: string })?.msg || "处理失败", icon: "none" });
  } finally {
    handling.value = false;
  }
}

/* ========================= 关闭（resolve：写恢复时间与处理备注） ========================= */

const resolveVisible = ref(false);
const resolveRecord = ref<AlarmRecord | null>(null);
const resolveRemark = ref("");
const resolving = ref(false);

function openResolveDialog(item: AlarmRecord) {
  resolveRecord.value = item;
  resolveRemark.value = "";
  resolveVisible.value = true;
}

async function submitResolve() {
  if (!resolveRecord.value?.id || resolving.value) return;
  resolving.value = true;
  try {
    const payload = { handleRemark: resolveRemark.value.trim() };
    const res = (await resolveAlarm(resolveRecord.value.id, payload)) as { code?: number; msg?: string };
    if (res.code !== undefined && res.code !== 200) {
      uni.showToast({ title: res.msg || "关闭失败", icon: "none" });
      return;
    }
    uni.showToast({ title: localeText("已关闭", "Resolved"), icon: "success" });
    resolveVisible.value = false;
    loadAlarms(pagination.current);
  } catch (error) {
    uni.showToast({ title: (error as { msg?: string })?.msg || "关闭失败", icon: "none" });
  } finally {
    resolving.value = false;
  }
}

/* 实时刷新轮询状态：以"见过的报警 ID 集合"为基准判新增（避免同时间戳报警漏提示）；
 * 首次成功轮询只建基准不提示。集合仅由轮询更新，与当前分页/筛选解耦。 */
const pollBaselineReady = ref(false);
const seenAlarmIds = ref<Set<number>>(new Set());

/* ========================= 实时刷新轮询（latest-active，仅 H5） ========================= */
// #ifdef H5
let pollTimer: ReturnType<typeof setInterval> | null = null;
let pollInFlight = false;

async function pollLatestAlarms() {
  if (document.hidden || pollInFlight) return;
  // 用户请求在途时本轮让路（兜底，统一守卫在 loadAlarms 内）
  if (loading.value) return;
  pollInFlight = true;
  try {
    // latest-active 返回 AlarmMapItemVO（含 alarmRecordId），非 AlarmRecord
    const res = (await getLatestActiveAlarms(200)) as { code?: number; msg?: string; data?: Array<{ alarmRecordId?: number }> };
    if (res.code !== undefined && res.code !== 200) {
      pollFailed.value = true;
      return;
    }
    const active = res.data || [];
    // 新报警判定（按 ID 去重，避免同秒报警漏提示）：
    // 首次成功轮询只建立基准（seenIds），不把已有报警当新报警提示
    const currentIds = new Set(active.map((item) => item.alarmRecordId).filter((id): id is number => id != null));
    let hasNew = false;
    if (pollBaselineReady.value) {
      for (const id of currentIds) {
        if (!seenAlarmIds.value.has(id)) {
          hasNew = true;
          break;
        }
      }
    } else {
      pollBaselineReady.value = true;
    }
    seenAlarmIds.value = currentIds;
    // 每轮都刷新当前列表（按已应用条件快照）：已有报警的触发次数/状态变化也能同步
    if (hasNew) {
      uni.showToast({ title: localeText("检测到新报警，已自动刷新", "New alarms detected, list refreshed"), icon: "none" });
    }
    // 成功/失败状态由随后的 loadAlarms(silent) 按列表实际结果更新（分开管理）；
    // 用户请求在途时 loadAlarms 内的统一守卫会让路
    await loadAlarms(pagination.current, { silent: true });
  } catch {
    // 轮询失败：保留上次成功数据，标记失败态（页面显示"更新失败"，不弹窗）
    pollFailed.value = true;
  } finally {
    pollInFlight = false;
  }
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(pollLatestAlarms, POLL_INTERVAL);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function onVisibilityChange() {
  if (!document.hidden) {
    // silent 刷新：用户请求在途时由 loadAlarms 内统一守卫让路，不会覆盖手动翻页/查询
    loadAlarms(pagination.current, { silent: true });
  }
}
// #endif

/* ========================= 生命周期 ========================= */

async function loadDeptOptions() {
  try {
    const res = (await getDeptList()) as { code?: number; data?: DeptItem[] };
    deptList.value = res.data || [];
  } catch {
    deptList.value = [];
  }
}

onMounted(() => {
  loadAlarms(1, { applyFilters: true });
  loadDeptOptions();
  // #ifdef H5
  startPolling();
  // 页面从后台切回时立即刷新一次（轮询在 hidden 时跳过，回来可能已错过更新）
  document.addEventListener("visibilitychange", onVisibilityChange);
  // #endif
});

onUnmounted(() => {
  // #ifdef H5
  stopPolling();
  document.removeEventListener("visibilitychange", onVisibilityChange);
  // #endif
});
</script>

<style scoped lang="scss">
.alarm-view {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding: 0 14px 14px;
  overflow: hidden;
  background: #eef4f8;
}

/* 表格 + 右侧详情双栏布局（同漏点页 main-layout 模式） */
.main-layout {
  display: flex;
  flex: 1;
  gap: 12px;
  min-height: 0;
  min-width: 0;
}

.detail-panel {
  display: flex;
  flex-direction: column;
  flex: 0 0 clamp(340px, 24vw, 420px);
  min-width: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
}

.detail-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid #e3edf5;
}

.detail-panel__title-wrap {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.detail-panel__title {
  color: #172033;
  font-size: 15px;
  font-weight: 800;
}

.detail-panel__subtitle {
  color: #52677b;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-panel__body {
  flex: 1;
  min-height: 0;
  padding: 12px 14px;
  box-sizing: border-box;
}

@media (max-width: 1024px) {
  .main-layout {
    flex-direction: column;
  }
  .detail-panel {
    flex: none;
    max-height: 340px;
  }
}

.toolbar-panel {
  flex: none;
  display: grid;
  gap: 12px;
  min-height: 0;
  padding: 14px;
  overflow: visible;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
}

.alarm-toolbar {
  display: grid;
  gap: 12px;
  min-width: 0;
  width: 100%;
}

.toolbar-row--filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 10px 12px;
}

.toolbar-row--bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 10px 12px;
  width: 100%;
}

.filter-group {
  display: grid;
  align-content: start;
  gap: 6px;
  flex: 0 0 136px;
  min-width: 0;
}

.filter-group--date {
  flex: 0 0 auto;
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
  height: 28px;
  color: #172033;
  font-size: 13px;
  font-weight: 600;
  line-height: 28px;
  padding: 0 10px;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.filter-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-select__arrow {
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  min-width: 0;
}

.filter-datetime {
  flex: 0 0 205px;
  width: 205px;
}

.filter-separator {
  color: #8191a2;
  font-size: 13px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
  align-self: end;
  margin-left: 0;
}

.table-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0;
  margin-top: 0;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
}

.refresh-status {
  color: #8191a2;
  font-size: 12px;
}

.refresh-status--failed {
  color: #d64541;
}

.table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  height: 50px;
  padding: 0 20px;
  color: #24445f;
  font-size: 16px;
  font-weight: 800;
  background: #ffffff;
  border-bottom: 1px solid #edf3ed;
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

.table-scroll :deep(.uni-scroll-view) {
  scrollbar-color: #9fb4c8 #edf3f8;
  scrollbar-width: thin;
}

.table {
  width: 100%;
  background: #ffffff;
  font-size: 12px;
}

.table-row {
  display: grid;
  width: 100%;
  min-height: 42px;
  border-bottom: 1px solid #edf1f5;
  transition: background 0.18s ease, box-shadow 0.18s ease;
}

.record-table-row {
  /* 列宽模板由 alarmColumns.ts 的 processingGridColumns 内联绑定（字段配置化） */
  min-width: 1180px;
}

.table-row--header {
  position: sticky;
  top: 0;
  z-index: 1;
  color: #20384f;
  min-height: 44px;
  font-weight: 800;
  background: #f6f9fc;
  cursor: default;
  box-shadow: 0 1px 0 #dbe7f0;
}

.table-row:not(.table-row--header):nth-child(odd) {
  background: #ffffff;
}

.table-row:not(.table-row--header):nth-child(even) {
  background: #fbfdff;
}

.table-row:not(.table-row--header):hover {
  background: #edf7ff;
  box-shadow: inset 0 0 0 1px #d7ebfb;
}

.table-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  padding: 0 10px;
  overflow: hidden;
  color: #24384d;
  font-size: 13px;
  line-height: 1.35;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-right: 1px solid #edf1f5;
}

.table-row--header .table-cell {
  color: #415a73;
  font-size: 12px;
}

.table-cell:last-child {
  border-right: 0;
}

.col-index {
  justify-content: center;
  color: #64748b;
}

.col-check {
  justify-content: center;
}

.col-alarm-no,
.col-alarm-time {
  justify-content: center;
}

.col-action {
  gap: 6px;
}

.checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: #ffffff;
  border: 1px solid #9db4c9;
  border-radius: 3px;
  cursor: pointer;
}

.checkbox--checked,
.checkbox--partial {
  background: #0d82ee;
  border-color: #0d82ee;
}

.checkbox__mark {
  color: #ffffff;
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
}

.table-state {
  height: 180px;
  color: #7c8da1;
  font-size: 14px;
  line-height: 180px;
  text-align: center;
}

.table-action-btn {
  min-width: 52px;
  height: 28px;
  padding: 0 8px;
  margin: 0;
  color: #0d82ee;
  font-size: 12px;
  line-height: 28px;
  background: #edf7ff;
  border: 1px solid #b9dcfb;
  border-radius: 4px;
}

.table-action-btn--active {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
}

.table-row--selected .table-cell {
  background: #f2f9ff;
}

.table-action-btn::after {
  border: 0;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-right: 5px;
  flex-shrink: 0;
}

.page-info {
  color: #64748b;
  font-size: 13px;
  padding: 10px;
}

.page-input {
  width: 40px;
  height: 30px;
  color: #31506d;
  font-size: 13px;
  padding: 0 6px;
  text-align: center;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  outline: none;
}

.page-btn {
  height: 30px;
  color: #31506d;
  font-size: 13px;
  margin: 0;
  padding: 0 12px;
  line-height: 30px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.page-btn::after {
  border: none;
}

.page-btn[disabled] {
  opacity: 0.5;
}

/* ========================= 按钮（对齐工单页规格） ========================= */

.toolbar-button {
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

.toolbar-button::after {
  border: 0;
}

.toolbar-button--primary {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
  box-shadow: 0 5px 12px rgba(13, 130, 238, 0.18);
}

.toolbar-actions .toolbar-button {
  height: 38px;
  line-height: 1.2;
}

.toolbar-button[disabled] {
  color: #93a5b8;
  background: #f1f5f9;
  border-color: #d8e1ea;
  cursor: not-allowed;
  box-shadow: none;
}


/* ========================= 状态胶囊 ========================= */

.status-pill {
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

.status-pill--open {
  color: #177245;
  background: #eaf8ef;
  border-color: #bfe8ce;
}

.status-pill--muted {
  color: #5f7186;
  background: #f3f6f9;
  border-color: #dbe4ec;
}

.status-pill--processing {
  color: #b42318;
  background: #fff1ee;
  border-color: #ffd3cb;
}

.status-pill--done {
  color: #177245;
  background: #eaf8ef;
  border-color: #bfe8ce;
}

.status-pill--closed {
  color: #6941c6;
  background: #f3f0ff;
  border-color: #d8ceff;
}

.level-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 46px;
  height: 24px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  line-height: 24px;
}

.level-pill--muted {
  color: #5f7186;
  background: #f3f6f9;
  border-color: #dbe4ec;
}

.level-pill--info {
  color: #5f7186;
  background: #f3f6f9;
  border-color: #dbe4ec;
}

.level-pill--warning {
  color: #b54708;
  background: #fffaeb;
  border-color: #fedf89;
}

.level-pill--critical {
  color: #b42318;
  background: #fff1ee;
  border-color: #ffd3cb;
}

/* ========================= 弹窗 ========================= */

.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  background: rgba(15, 35, 55, 0.36);
}

.dialog-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 18px 46px rgba(15, 35, 55, 0.2);
}

.dialog-panel--form {
  width: min(860px, 96vw);
  max-height: min(760px, 92vh);
}

.dialog-panel--narrow {
  width: min(480px, 96vw);
  max-height: min(480px, 92vh);
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

.dialog-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 24px 16px;
  background: #ffffff;
}

.error-summary {
  flex: none;
  margin: 12px 24px 0;
  padding: 9px 12px;
  color: #b42318;
  font-size: 13px;
  font-weight: 800;
  background: #fff5f3;
  border: 1px solid #ffc9c0;
  border-radius: 4px;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex: none;
  padding: 14px 24px;
  background: #f8fbfe;
  border-top: 1px solid #edf3f8;
}

.dialog-footer .toolbar-button {
  min-width: 72px;
  height: 38px;
  line-height: 1.2;
}

/* ========================= 详情网格 ========================= */

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 8px 10px;
  background: #f8fbfe;
  border: 1px solid #e6eef5;
  border-radius: 6px;
}

.detail-item--full {
  grid-column: 1 / -1;
}

.detail-item__label {
  color: #6a7f94;
  font-size: 12px;
  font-weight: 800;
}

.detail-item__value {
  overflow: hidden;
  color: #24384d;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========================= 表单 ========================= */

.alarm-dialog-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 18px;
}

.form-field {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-width: 0;
}

.form-field--full {
  grid-column: 1 / -1;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  margin: 0;
  flex-shrink: 0;
  color: #64748b;
  background: #f6fbff;
  border: 1px solid #d9e7f3;
  border-radius: 4px;
}

.icon-button::after {
  border: 0;
}

.icon-button--hover {
  color: #0d82ee;
  background: #edf7ff;
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
  background: currentColor;
  border-radius: 2px;
}

.close-icon::before {
  transform: rotate(45deg);
}

.close-icon::after {
  transform: rotate(-45deg);
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
.form-select {
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  height: 38px;
  line-height: 38px;
  padding: 0 12px;
  overflow: hidden;
  color: #172033;
  font-size: 14px;
  text-overflow: ellipsis;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
}

.form-input:focus {
  background: #ffffff;
  border-color: #8fc8f8;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.1);
}

.form-textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 90px;
  padding: 10px 12px;
  color: #172033;
  font-size: 14px;
  line-height: 1.5;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
}

.form-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-select--dropdown {
  background: #f7fbff;
  cursor: pointer;
}

.form-select--open {
  background: #ffffff;
  border-color: #8fc8f8;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.1);
}

.form-control--error,
.form-control--error:focus {
  background: #fffafa;
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-error {
  display: block;
  margin-top: 5px;
  color: #d92d20;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
}

.select-field {
  position: relative;
}

.select-arrow {
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.select-menu {
  position: absolute;
  right: 0;
  left: 0;
  z-index: 20;
  margin-top: 4px;
  overflow: hidden auto;
  max-height: 250px;
  background: #ffffff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  box-shadow: 0 14px 28px rgba(15, 35, 55, 0.16);
}

.select-option {
  min-height: 36px;
  padding: 0 12px;
  color: #172033;
  font-size: 14px;
  font-weight: 700;
  line-height: 36px;
  cursor: pointer;
  border-bottom: 1px solid #edf3f8;
}

.select-option:last-child {
  border-bottom: 0;
}

.select-option:hover,
.select-option--active {
  color: #0d82ee;
  background: #edf7ff;
}

.input-placeholder {
  color: #9aa9b8;
}
</style>
