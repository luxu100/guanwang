<template>
  <view class="alarm-view">
    <view class="toolbar-panel">
      <view class="alarm-toolbar">
        <view class="toolbar-row toolbar-row--filters">
          <view class="filter-group">
          <text class="filter-label">{{ localeText("报警编号", "Alarm No.") }}</text>
          <input v-model="filters.alarmNo" class="filter-input" :placeholder="localeText('请输入报警编号', 'Enter alarm no.')" placeholder-class="input-placeholder" />
        </view>

        <view class="filter-group">
          <text class="filter-label">{{ localeText("报警类型", "Type") }}</text>
          <picker :range="ruleTypeOptions" range-key="label" :value="filters.ruleTypeIndex" @change="handleFilterTypeChange">
            <view class="filter-select">
              <text>{{ ruleTypeOptions[filters.ruleTypeIndex].label }}</text>
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
          <button class="toolbar-button toolbar-button--primary" @click="loadAlarms(1)">{{ localeText("查询", "Search") }}</button>
          <button class="toolbar-button" @click="resetFilters">{{ localeText("重置", "Reset") }}</button>
          <button class="toolbar-button" :disabled="selectedIds.length === 0" @click="handleBatchConfirm">{{ localeText("批量确认", "Batch Confirm") }}</button>
          <button class="toolbar-button" :loading="exporting" @click="handleExport">{{ localeText("导出", "Export") }}</button>
          </view>
        </view>
      </view>
    </view>

    <view class="table-panel">
      <view class="table-head">
        <text>{{ localeText("报警处理", "Alarm Handling") }}</text>
        <text class="table-head__meta">{{ localizedTotal(pagination.total) }}</text>
      </view>

      <scroll-view class="table-scroll" scroll-x scroll-y>
        <view class="table">
          <view class="table-row table-row--header record-table-row">
            <view class="table-cell table-header-cell col-check">
              <view class="checkbox" :class="{ 'checkbox--checked': isAllSelected, 'checkbox--partial': isPartSelected && !isAllSelected }" @click="toggleSelectAll">
                <text v-if="isAllSelected || isPartSelected" class="checkbox__mark">✓</text>
              </view>
            </view>
            <view v-for="column in recordColumns" :key="column.key" class="table-cell table-header-cell">
              <text>{{ column.label }}</text>
            </view>
          </view>

          <view v-if="loading" class="table-state">{{ localeText("加载中...", "Loading...") }}</view>
          <view v-else-if="alarmList.length === 0" class="table-state">{{ localeText("暂无报警数据", "No alarms") }}</view>

          <view v-for="(item, index) in alarmList" v-else :key="item.id" class="table-row record-table-row">
            <view class="table-cell col-check">
              <view
                v-if="item.status === 0"
                class="checkbox"
                :class="{ 'checkbox--checked': selectedIds.includes(item.id as number) }"
                @click="toggleSelect(item.id as number)"
              >
                <text v-if="selectedIds.includes(item.id as number)" class="checkbox__mark">✓</text>
              </view>
            </view>
            <text class="table-cell col-index">{{ (pagination.current - 1) * pagination.size + index + 1 }}</text>
            <text class="table-cell col-alarm-no" :title="item.alarmNo">{{ item.alarmNo || "-" }}</text>
            <text class="table-cell" :title="getRuleTypeText(item.ruleType)">{{ getRuleTypeText(item.ruleType) }}</text>
            <view class="table-cell">
              <text class="level-pill" :class="getLevelClass(item.alarmLevel)">{{ getLevelText(item.alarmLevel) }}</text>
            </view>
            <text class="table-cell" :title="item.deviceNumber">{{ item.deviceNumber || "-" }}</text>
            <text class="table-cell" :title="item.triggerValue">{{ item.triggerValue || "-" }}</text>
            <text class="table-cell" :title="item.thresholdSnapshot">{{ item.thresholdSnapshot || "-" }}</text>
            <text class="table-cell col-alarm-time" :title="item.alarmTime">{{ item.alarmTime || "-" }}</text>
            <view class="table-cell">
              <text class="status-pill" :class="getStatusClass(item.status)">{{ getStatusText(item.status) }}</text>
            </view>
            <view class="table-cell col-action">
              <button class="table-action-btn" @click.stop="openDetailDialog(item)">{{ localeText("详情", "Detail") }}</button>
              <button v-if="item.status === 0" class="table-action-btn" @click.stop="openHandleDialog(item, 'confirm')">{{ localeText("确认", "Confirm") }}</button>
              <button v-if="item.status === 0" class="table-action-btn" @click.stop="openHandleDialog(item, 'ignore')">{{ localeText("忽略", "Ignore") }}</button>
              <button v-if="item.status === 0" class="table-action-btn" @click.stop="openDispatchDialog(item)">{{ localeText("转工单", "Dispatch") }}</button>
            </view>
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

    <!-- 详情弹窗 -->
    <view v-if="detailVisible" class="dialog-mask" @click="detailVisible = false">
      <view class="dialog-panel dialog-panel--form" @click.stop>
        <view class="dialog-head">
          <view>
            <text class="dialog-title">{{ localeText("报警详情", "Alarm Detail") }}</text>
            <text class="dialog-subtitle">{{ detailRecord?.alarmNo || "-" }}</text>
          </view>
          <button class="icon-button" hover-class="icon-button--hover" :aria-label="localeText('关闭', 'Close')" @click="detailVisible = false">
            <text class="close-icon"></text>
          </button>
        </view>

        <view class="dialog-body">
          <view class="detail-grid">
            <view class="detail-item">
              <text class="detail-item__label">{{ localeText("报警编号", "Alarm No.") }}</text>
              <text class="detail-item__value" :title="detailRecord?.alarmNo">{{ detailRecord?.alarmNo || "-" }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-item__label">{{ localeText("类型", "Type") }}</text>
              <text class="detail-item__value">{{ getRuleTypeText(detailRecord?.ruleType) }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-item__label">{{ localeText("级别", "Level") }}</text>
              <text class="detail-item__value">
                <text class="level-pill" :class="getLevelClass(detailRecord?.alarmLevel)">{{ getLevelText(detailRecord?.alarmLevel) }}</text>
              </text>
            </view>
            <view class="detail-item">
              <text class="detail-item__label">{{ localeText("状态", "Status") }}</text>
              <text class="detail-item__value">
                <text class="status-pill" :class="getStatusClass(detailRecord?.status)">{{ getStatusText(detailRecord?.status) }}</text>
              </text>
            </view>
            <view class="detail-item">
              <text class="detail-item__label">{{ localeText("设备编号", "Device No.") }}</text>
              <text class="detail-item__value" :title="detailRecord?.deviceNumber">{{ detailRecord?.deviceNumber || "-" }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-item__label">{{ localeText("安装地址", "Install Address") }}</text>
              <text class="detail-item__value" :title="detailRecord?.deviceInstallAddress">{{ detailRecord?.deviceInstallAddress || "-" }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-item__label">{{ localeText("触发值", "Trigger Value") }}</text>
              <text class="detail-item__value" :title="detailRecord?.triggerValue">{{ detailRecord?.triggerValue || "-" }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-item__label">{{ localeText("阈值快照", "Threshold Snapshot") }}</text>
              <text class="detail-item__value" :title="detailRecord?.thresholdSnapshot">{{ detailRecord?.thresholdSnapshot || "-" }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-item__label">{{ localeText("命中规则", "Matched Rule") }}</text>
              <text class="detail-item__value" :title="detailRecord?.ruleName">{{ detailRecord?.ruleName || "-" }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-item__label">{{ localeText("报警时间", "Alarm Time") }}</text>
              <text class="detail-item__value" :title="detailRecord?.alarmTime">{{ detailRecord?.alarmTime || "-" }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-item__label">{{ localeText("触发次数", "Trigger Count") }}</text>
              <text class="detail-item__value">{{ detailRecord?.triggerCount ?? "-" }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-item__label">{{ localeText("恢复时间", "Recover Time") }}</text>
              <text class="detail-item__value" :title="detailRecord?.recoverTime">{{ detailRecord?.recoverTime || "-" }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-item__label">{{ localeText("处理人", "Handler") }}</text>
              <text class="detail-item__value" :title="detailRecord?.handler">{{ detailRecord?.handler || "-" }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-item__label">{{ localeText("处理时间", "Handle Time") }}</text>
              <text class="detail-item__value" :title="detailRecord?.handleTime">{{ detailRecord?.handleTime || "-" }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-item__label">{{ localeText("关联工单", "Related Worksheet") }}</text>
              <text class="detail-item__value" :title="detailRecord?.worksheetNo">{{ detailRecord?.worksheetNo || "-" }}</text>
            </view>
            <view class="detail-item detail-item--full">
              <text class="detail-item__label">{{ localeText("处理备注", "Handle Remark") }}</text>
              <text class="detail-item__value" :title="detailRecord?.handleRemark">{{ detailRecord?.handleRemark || "-" }}</text>
            </view>
          </view>
        </view>

        <view class="dialog-footer">
          <button class="toolbar-button" @click="detailVisible = false">{{ localeText("关闭", "Close") }}</button>
        </view>
      </view>
    </view>

    <!-- 确认/忽略弹窗 -->
    <view v-if="handleVisible" class="dialog-mask" @click="handleVisible = false">
      <view class="dialog-panel dialog-panel--narrow" @click.stop>
        <view class="dialog-head">
          <view>
            <text class="dialog-title">{{ handleAction === "confirm" ? localeText("确认报警", "Confirm Alarm") : localeText("忽略报警", "Ignore Alarm") }}</text>
            <text class="dialog-subtitle">{{ handleRecord?.alarmNo || "-" }}</text>
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

    <!-- 转工单弹窗 -->
    <view v-if="dispatchVisible" class="dialog-mask" @click="closeDispatchDialog">
      <view class="dialog-panel dialog-panel--form" @click.stop>
        <view class="dialog-head">
          <view>
            <text class="dialog-title">{{ localeText("报警转工单", "Dispatch to Worksheet") }}</text>
            <text class="dialog-subtitle">{{ dispatchRecord?.alarmNo || "-" }}</text>
          </view>
          <button class="icon-button" hover-class="icon-button--hover" :aria-label="localeText('关闭', 'Close')" @click="closeDispatchDialog">
            <text class="close-icon"></text>
          </button>
        </view>

        <view v-if="dispatchFormError" class="error-summary">{{ dispatchFormError }}</view>

        <view class="dialog-body">
          <view class="alarm-dialog-form">
            <view class="form-field">
              <text class="form-label form-label--required">{{ localeText("工单类型", "Worksheet Type") }}</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" @click.stop="toggleDispatchSelect('worksheetType')">
                  <text>{{ getWorksheetTypeText(dispatchForm.worksheetType) }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="activeSelect === 'worksheetType'" class="select-menu">
                  <view v-for="option in worksheetTypeOptions" :key="option.value" class="select-option" :class="{ 'select-option--active': dispatchForm.worksheetType === option.value }" @click.stop="selectWorksheetType(option.value)">
                    {{ option.label }}
                  </view>
                </view>
              </view>
            </view>

            <view class="form-field">
              <text class="form-label form-label--required">{{ localeText("执行人", "Executor") }}</text>
              <input v-model="dispatchForm.executeAccount" class="form-input" :class="{ 'form-control--error': dispatchErrors.executeAccount }" :placeholder="localeText('请输入执行人账号', 'Enter executor account')" placeholder-class="input-placeholder" @input="clearDispatchError('executeAccount')" />
              <text v-if="dispatchErrors.executeAccount" class="form-error">{{ dispatchErrors.executeAccount }}</text>
            </view>

            <view class="form-field">
              <text class="form-label">{{ localeText("紧急程度", "Urgency") }}</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" @click.stop="toggleDispatchSelect('urgencyLevel')">
                  <text>{{ getUrgencyText(dispatchForm.urgencyLevel) }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="activeSelect === 'urgencyLevel'" class="select-menu">
                  <view v-for="option in urgencyOptions" :key="option.value" class="select-option" :class="{ 'select-option--active': dispatchForm.urgencyLevel === option.value }" @click.stop="selectUrgency(option.value)">
                    {{ option.label }}
                  </view>
                </view>
              </view>
            </view>

            <view class="form-field">
              <text class="form-label">{{ localeText("截止时间", "Deadline") }}</text>
              <WorkOrderDatetimePicker v-model="dispatchForm.deadlineTime" :title="localeText('选择截止时间', 'Select Deadline')" :placeholder="localeText('请选择截止时间', 'Select Deadline')" />
            </view>

            <view class="form-field form-field--full">
              <text class="form-label">{{ localeText("工单说明", "Instruction") }}</text>
              <input v-model="dispatchForm.worksheetInstruction" class="form-input" :placeholder="localeText('请输入工单说明', 'Enter worksheet instruction')" placeholder-class="input-placeholder" />
            </view>

            <view class="form-field form-field--full">
              <text class="form-label">{{ localeText("备注", "Remark") }}</text>
              <input v-model="dispatchForm.remark" class="form-input" :placeholder="localeText('请输入备注', 'Enter remark')" placeholder-class="input-placeholder" />
            </view>
          </view>
        </view>

        <view class="dialog-footer">
          <button class="toolbar-button" @click="closeDispatchDialog">{{ localeText("取消", "Cancel") }}</button>
          <button class="toolbar-button toolbar-button--primary" :loading="dispatching" @click="submitDispatch">{{ localeText("提交", "Submit") }}</button>
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
  confirmAlarm,
  ignoreAlarm,
  batchConfirmAlarms,
  dispatchAlarm,
  exportAlarms,
  getLatestAlarms,
} from "@/services/alarm/processing";
import type { AlarmRecord } from "@/services/alarm/processing";
import { getDeptList } from "@/services/partition/partition";
import { confirmAction } from "@/utils/confirmAction";

const { locale } = useI18n();
const localeText = useLocaleText();
const isEnglishLocale = computed(() => locale.value === "en-US");
const filterDateText = computed(() => ({
  startTitle: isEnglishLocale.value ? "Select Start Time" : "选择开始时间",
  startPlaceholder: isEnglishLocale.value ? "Select Start Time" : "请选择开始时间",
  endTitle: isEnglishLocale.value ? "Select End Time" : "选择结束时间",
  endPlaceholder: isEnglishLocale.value ? "Select End Time" : "请选择结束时间",
}));
const localizedPageInfo = useLocalizedPageInfo();
const localizedTotal = useLocalizedTotal();

interface ApiLikeResponse<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

interface DeptItem {
  id: number;
  deptName: string;
}

const POLL_INTERVAL = 45 * 1000;

const ruleTypeOptions = [
  { label: localeText("不限", "All"), value: null },
  { label: localeText("压力异常", "Pressure Anomaly"), value: 1 },
  { label: localeText("渗漏", "Leakage"), value: 2 },
  { label: localeText("爆管", "Pipe Burst"), value: 3 },
  { label: localeText("离线", "Offline"), value: 4 },
];
const alarmLevelOptions = [
  { label: localeText("不限", "All"), value: null },
  { label: localeText("提示", "Info"), value: 1 },
  { label: localeText("警告", "Warning"), value: 2 },
  { label: localeText("严重", "Critical"), value: 3 },
];
const statusOptions = [
  { label: localeText("不限", "All"), value: null },
  { label: localeText("未处理", "Unhandled"), value: 0 },
  { label: localeText("已确认", "Confirmed"), value: 1 },
  { label: localeText("已忽略", "Ignored"), value: 2 },
  { label: localeText("已转工单", "Dispatched"), value: 3 },
  { label: localeText("已恢复", "Recovered"), value: 4 },
];
const worksheetTypeOptions = [
  { label: localeText("巡检", "Inspection"), value: 0 },
  { label: localeText("检漏", "Leak Detection"), value: 1 },
  { label: localeText("拆装", "Install/Remove"), value: 2 },
  { label: localeText("维护", "Maintenance"), value: 3 },
];
const urgencyOptions = [
  { label: localeText("一般", "Normal"), value: 0 },
  { label: localeText("紧急", "Urgent"), value: 1 },
];

const filters = reactive({
  alarmNo: "",
  ruleTypeIndex: 0,
  alarmLevelIndex: 0,
  statusIndex: 0,
  deviceNumber: "",
  deptIndex: 0,
  startTime: "",
  endTime: "",
});

const loading = ref(false);
const exporting = ref(false);
const alarmList = ref<AlarmRecord[]>([]);
const selectedIds = ref<number[]>([]);
const deptList = ref<DeptItem[]>([]);
const pagination = reactive({ current: 1, size: 10, total: 0 });
const jumpPage = ref<number | null>(null);

const recordColumns = [
  { key: "index", label: localeText("序号", "No.") },
  { key: "alarmNo", label: localeText("报警编号", "Alarm No.") },
  { key: "ruleType", label: localeText("类型", "Type") },
  { key: "alarmLevel", label: localeText("级别", "Level") },
  { key: "deviceNumber", label: localeText("设备编号", "Device No.") },
  { key: "triggerValue", label: localeText("触发值", "Trigger Value") },
  { key: "thresholdSnapshot", label: localeText("阈值", "Threshold") },
  { key: "alarmTime", label: localeText("报警时间", "Alarm Time") },
  { key: "status", label: localeText("状态", "Status") },
  { key: "action", label: localeText("操作", "Actions") },
];

const totalPages = computed(() => Math.max(1, Math.ceil(pagination.total / pagination.size)));

const selectableIds = computed(() =>
  alarmList.value.filter((item) => item.status === 0 && item.id != null).map((item) => item.id as number),
);
const isAllSelected = computed(() => selectableIds.value.length > 0 && selectableIds.value.every((id) => selectedIds.value.includes(id)));
const isPartSelected = computed(() => selectableIds.value.some((id) => selectedIds.value.includes(id)));

const deptPickerOptions = computed(() => [
  { label: localeText("不限", "All"), value: null as number | null },
  ...deptList.value.map((dept) => ({ label: dept.deptName, value: dept.id as number | null })),
]);

/* ========================= 文案映射 ========================= */

function getRuleTypeText(value?: number | null) {
  if (value == null) return "-";
  const map: Record<number, string> = { 1: "压力异常", 2: "渗漏", 3: "爆管", 4: "离线" };
  const enMap: Record<number, string> = { 1: "Pressure Anomaly", 2: "Leakage", 3: "Pipe Burst", 4: "Offline" };
  return localeText(map[value] || "-", enMap[value] || "-");
}

function getLevelText(value?: number | null) {
  if (value == null) return "-";
  const map: Record<number, string> = { 1: "提示", 2: "警告", 3: "严重" };
  const enMap: Record<number, string> = { 1: "Info", 2: "Warning", 3: "Critical" };
  return localeText(map[value] || "-", enMap[value] || "-");
}

function getLevelClass(value?: number | null) {
  if (value === 1) return "level-pill--info";
  if (value === 2) return "level-pill--warning";
  return "level-pill--critical";
}

function getStatusText(value?: number | null) {
  const map: Record<number, string> = { 0: "未处理", 1: "已确认", 2: "已忽略", 3: "已转工单", 4: "已恢复" };
  const enMap: Record<number, string> = { 0: "Unhandled", 1: "Confirmed", 2: "Ignored", 3: "Dispatched", 4: "Recovered" };
  const key = value ?? 0;
  return localeText(map[key] || "-", enMap[key] || "-");
}

function getStatusClass(value?: number | null) {
  const key = value ?? 0;
  if (key === 0) return "status-pill--processing";
  if (key === 1) return "status-pill--done";
  if (key === 2) return "status-pill--muted";
  if (key === 3) return "status-pill--closed";
  return "status-pill--open";
}

function getWorksheetTypeText(value?: number | null) {
  const map: Record<number, string> = { 0: "巡检", 1: "检漏", 2: "拆装", 3: "维护" };
  const enMap: Record<number, string> = { 0: "Inspection", 1: "Leak Detection", 2: "Install/Remove", 3: "Maintenance" };
  const key = value ?? 1;
  return localeText(map[key] || "检漏", enMap[key] || "Leak Detection");
}

function getUrgencyText(value?: number | null) {
  const map: Record<number, string> = { 0: "一般", 1: "紧急" };
  const enMap: Record<number, string> = { 0: "Normal", 1: "Urgent" };
  const key = value ?? 0;
  return localeText(map[key] || "一般", enMap[key] || "Normal");
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

function buildPageParams(page: number) {
  const params: Record<string, unknown> = {
    pageNum: page,
    pageSize: pagination.size,
  };
  if (filters.alarmNo.trim()) params.alarmNo = filters.alarmNo.trim();
  const ruleType = ruleTypeOptions[filters.ruleTypeIndex].value;
  if (ruleType !== null) params.ruleType = ruleType;
  const alarmLevel = alarmLevelOptions[filters.alarmLevelIndex].value;
  if (alarmLevel !== null) params.alarmLevel = alarmLevel;
  const status = statusOptions[filters.statusIndex].value;
  if (status !== null) params.status = status;
  if (filters.deviceNumber.trim()) params.deviceNumber = filters.deviceNumber.trim();
  const deptId = deptPickerOptions.value[filters.deptIndex].value;
  if (deptId !== null) params.deptId = deptId;
  params.startTime = normalizeDateForApi(filters.startTime, false);
  params.endTime = normalizeDateForApi(filters.endTime, true);
  return params;
}

async function loadAlarms(page = 1) {
  loading.value = true;
  const params = buildPageParams(page);
  try {
    const res = (await getAlarmPage(params as never)) as ApiLikeResponse<{ records?: AlarmRecord[]; total?: number }>;
    if (res.code !== undefined && res.code !== 200) {
      throw new Error(res.msg || "load failed");
    }
    const pageData = res.data || {};
    alarmList.value = pageData.records || [];
    pagination.total = pageData.total || 0;
    pagination.current = page;
  } catch {

      alarmList.value = [];
      pagination.total = 0;
      pagination.current = page;
      uni.showToast({ title: localeText("加载报警列表失败", "Failed to load alarms"), icon: "none" });
  } finally {
    loading.value = false;
    jumpPage.value = null;
    selectedIds.value = [];
  }
}

function resetFilters() {
  filters.alarmNo = "";
  filters.ruleTypeIndex = 0;
  filters.alarmLevelIndex = 0;
  filters.statusIndex = 0;
  filters.deviceNumber = "";
  filters.deptIndex = 0;
  filters.startTime = "";
  filters.endTime = "";
  loadAlarms(1);
}

function handlePageChange(page: number | null) {
  if (page == null || page < 1 || page > totalPages.value || page === pagination.current) return;
  loadAlarms(page);
}

/* ========================= 筛选事件 ========================= */

function handleFilterTypeChange(event: { detail: { value: number } }) {
  filters.ruleTypeIndex = Number(event.detail.value);
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

/* ========================= 行选择 ========================= */

function toggleSelect(id: number) {
  const index = selectedIds.value.indexOf(id);
  if (index >= 0) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = [...selectableIds.value];
  }
}

/* ========================= 详情弹窗 ========================= */

const detailVisible = ref(false);
const detailRecord = ref<AlarmRecord | null>(null);

function openDetailDialog(item: AlarmRecord) {
  detailRecord.value = item;
  detailVisible.value = true;
}

/* ========================= 确认/忽略 ========================= */

const handleVisible = ref(false);
const handleAction = ref<"confirm" | "ignore">("confirm");
const handleRecord = ref<AlarmRecord | null>(null);
const handleRemark = ref("");
const handling = ref(false);

function openHandleDialog(item: AlarmRecord, action: "confirm" | "ignore") {
  handleAction.value = action;
  handleRecord.value = item;
  handleRemark.value = "";
  handleVisible.value = true;
}

async function submitHandle() {
  if (!handleRecord.value?.id || handling.value) return;
  handling.value = true;
  try {
    const payload = { handleRemark: handleRemark.value.trim() };
    const res = (handleAction.value === "confirm"
      ? await confirmAlarm(handleRecord.value.id, payload)
      : await ignoreAlarm(handleRecord.value.id, payload)) as ApiLikeResponse;

    if (res.code !== undefined && res.code !== 200) {
      uni.showToast({ title: res.msg || localeText("处理失败", "Handle failed"), icon: "none" });
      return;
    }
    uni.showToast({ title: localeText("处理成功", "Handled"), icon: "success" });
    handleVisible.value = false;
    loadAlarms(pagination.current);
  } catch (error) {
    uni.showToast({ title: (error as { msg?: string })?.msg || localeText("处理失败", "Handle failed"), icon: "none" });
  } finally {
    handling.value = false;
  }
}

/* ========================= 批量确认 ========================= */

async function handleBatchConfirm() {
  if (selectedIds.value.length === 0) {
    uni.showToast({ title: localeText("请先勾选未处理的报警", "Select unhandled alarms first"), icon: "none" });
    return;
  }
  const confirmed = await confirmAction({
    content: localeText(`确认批量处理选中的 ${selectedIds.value.length} 条报警吗？`, `Batch confirm ${selectedIds.value.length} selected alarms?`),
  });
  if (!confirmed) return;

  try {
    const res = (await batchConfirmAlarms(selectedIds.value)) as ApiLikeResponse;
    if (res.code !== undefined && res.code !== 200) {
      throw new Error(res.msg);
    }
    uni.showToast({ title: localeText("批量确认成功", "Batch confirmed"), icon: "success" });
    loadAlarms(pagination.current);
  } catch (error) {
    uni.showToast({ title: (error as { msg?: string })?.msg || localeText("批量确认失败", "Batch confirm failed"), icon: "none" });
  }
}

/* ========================= 转工单 ========================= */

const dispatchVisible = ref(false);
const dispatching = ref(false);
const dispatchRecord = ref<AlarmRecord | null>(null);
const activeSelect = ref<string | null>(null);
const dispatchFormError = ref("");

const dispatchForm = reactive({
  worksheetType: 1,
  executeAccount: "",
  urgencyLevel: 0,
  deadlineTime: "",
  worksheetInstruction: "",
  remark: "",
});
const dispatchErrors = reactive<Record<string, string>>({});

function toggleDispatchSelect(key: string) {
  activeSelect.value = activeSelect.value === key ? null : key;
}

function clearDispatchError(key: string) {
  if (dispatchErrors[key]) {
    dispatchErrors[key] = "";
  }
}

function selectWorksheetType(value: number) {
  dispatchForm.worksheetType = value;
  activeSelect.value = null;
}

function selectUrgency(value: number) {
  dispatchForm.urgencyLevel = value;
  activeSelect.value = null;
}

function openDispatchDialog(item: AlarmRecord) {
  dispatchRecord.value = item;
  dispatchFormError.value = "";
  Object.keys(dispatchErrors).forEach((key) => {
    dispatchErrors[key] = "";
  });
  Object.assign(dispatchForm, {
    worksheetType: 1,
    executeAccount: "",
    urgencyLevel: 0,
    deadlineTime: "",
    worksheetInstruction: "",
    remark: "",
  });
  dispatchVisible.value = true;
}

function closeDispatchDialog() {
  dispatchVisible.value = false;
  activeSelect.value = null;
}

async function submitDispatch() {
  Object.keys(dispatchErrors).forEach((key) => {
    dispatchErrors[key] = "";
  });
  dispatchFormError.value = "";

  if (!dispatchForm.executeAccount.trim()) {
    dispatchErrors.executeAccount = localeText("请输入执行人账号", "Enter executor account");
  }
  if (Object.keys(dispatchErrors).some((key) => dispatchErrors[key])) return;
  if (!dispatchRecord.value?.id || dispatching.value) return;

  dispatching.value = true;
  try {
    const res = (await dispatchAlarm(dispatchRecord.value.id, {
      worksheetType: dispatchForm.worksheetType,
      executeAccount: dispatchForm.executeAccount.trim(),
      urgencyLevel: dispatchForm.urgencyLevel,
      deadlineTime: dispatchForm.deadlineTime || undefined,
      worksheetInstruction: dispatchForm.worksheetInstruction.trim(),
      remark: dispatchForm.remark.trim(),
    })) as ApiLikeResponse;

    if (res.code !== undefined && res.code !== 200) {
      dispatchFormError.value = res.msg || localeText("转工单失败", "Dispatch failed");
      return;
    }

    uni.showToast({ title: localeText("转工单成功", "Dispatched to worksheet"), icon: "success" });
    closeDispatchDialog();
    loadAlarms(pagination.current);
  } catch (error) {
    dispatchFormError.value = (error as { msg?: string })?.msg || localeText("转工单失败", "Dispatch failed");
  } finally {
    dispatching.value = false;
  }
}

/* ========================= 导出 ========================= */

async function handleExport() {
  if (exporting.value) return;
  exporting.value = true;
  try {
    const params = buildPageParams(pagination.current);
    delete params.pageNum;
    delete params.pageSize;
    await exportAlarms(params as never);
    uni.showToast({ title: localeText("导出成功", "Exported"), icon: "success" });
  } catch (error) {
    uni.showToast({ title: (error as { msg?: string })?.msg || localeText("导出失败", "Export failed"), icon: "none" });
  } finally {
    exporting.value = false;
  }
}

/* ========================= 增量轮询（需求 1.5 消费方） ========================= */

let pollTimer: ReturnType<typeof setInterval> | null = null;

async function pollLatestAlarms() {
  if (document.hidden) return;
  const latest = alarmList.value
    .map((item) => item.alarmTime || "")
    .filter(Boolean)
    .sort()
    .pop();
  if (!latest) return;

  try {
    const res = (await getLatestAlarms(latest)) as ApiLikeResponse<AlarmRecord[]>;
    const newRecords = (res.data || []).filter((item) => item.status === 0);
    if (newRecords.length > 0) {
      uni.showToast({ title: localeText("检测到新报警，已自动刷新", "New alarms detected, list refreshed"), icon: "none" });
      loadAlarms(pagination.current);
    }
  } catch {
    // 后端未就绪时静默跳过，不打扰用户
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

/* ========================= 生命周期 ========================= */

async function loadDeptOptions() {
  try {
    const res = (await getDeptList()) as ApiLikeResponse<DeptItem[]>;
    deptList.value = res.data || [];
  } catch {
    deptList.value = [];
  }
}

onMounted(() => {
  loadAlarms(1);
  loadDeptOptions();
  startPolling();
});

onUnmounted(() => {
  stopPolling();
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
  margin-top: 14px;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
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
  min-width: 1180px;
  grid-template-columns:
    44px
    54px
    minmax(140px, 1.3fr)
    minmax(88px, 1fr)
    minmax(72px, 0.8fr)
    minmax(96px, 0.9fr)
    minmax(96px, 1fr)
    minmax(120px, 1.1fr)
    minmax(140px, 1.3fr)
    minmax(80px, 0.8fr)
    minmax(186px, 1.7fr);
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 18px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  padding: 10px 12px;
  background: #f8fbfe;
  border: 1px solid #e6eef5;
  border-radius: 4px;
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
