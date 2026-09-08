<template>
  <view class="alarm-view">
    <view class="toolbar-panel">
      <view class="alarm-toolbar">
        <view class="filter-group filter-group--wide">
          <text class="filter-label">{{ localeText("规则名称", "Rule Name") }}</text>
          <input v-model="filters.ruleName" class="filter-input" :placeholder="localeText('请输入规则名称', 'Enter rule name')" placeholder-class="input-placeholder" />
        </view>

        <view class="filter-group">
          <text class="filter-label">{{ localeText("报警类型", "Alarm Type") }}</text>
          <picker :range="alarmTypeFilterOptions" range-key="label" :value="filters.ruleTypeIndex" @change="handleFilterTypeChange">
            <view class="filter-select">
              <text>{{ alarmTypeFilterOptions[filters.ruleTypeIndex].label }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">{{ localeText("启用状态", "Enabled Status") }}</text>
          <picker :range="enabledOptions" range-key="label" :value="filters.enabledIndex" @change="handleFilterEnabledChange">
            <view class="filter-select">
              <text>{{ enabledOptions[filters.enabledIndex].label }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="toolbar-actions">
          <button class="toolbar-button toolbar-button--primary" @click="loadRules(1)">{{ localeText("查询", "Search") }}</button>
          <button class="toolbar-button" @click="resetFilters">{{ localeText("重置", "Reset") }}</button>
          <button class="toolbar-button" @click="openCreateDialog">{{ localeText("新增", "Add") }}</button>
        </view>
      </view>
    </view>

    <view class="table-panel">
      <view class="table-head">
        <text>{{ localeText("报警策略", "Alarm Rules") }}</text>
        <text class="table-head__meta">{{ localizedTotal(pagination.total) }}</text>
      </view>

      <scroll-view class="table-scroll" scroll-x scroll-y>
        <view class="table">
          <view class="table-row table-row--header rule-table-row" :style="{ gridTemplateColumns: strategyGridColumns }">
            <view v-for="column in ruleColumns" :key="column.key" class="table-cell table-header-cell">
              <text>{{ localeText(column.label, column.labelEn) }}</text>
            </view>
          </view>

          <view v-if="loading" class="table-state">{{ localeText("加载中...", "Loading...") }}</view>
          <view v-else-if="ruleList.length === 0" class="table-state">{{ localeText("暂无规则数据", "No rules") }}</view>

          <view
            v-for="(item, index) in ruleList"
            v-else
            :key="item.id"
            class="table-row rule-table-row"
            :style="{ gridTemplateColumns: strategyGridColumns }"
          >
            <template v-for="column in ruleColumns" :key="column.key">
              <text v-if="column.renderType === 'index'" class="table-cell" :class="column.className">{{ (pagination.current - 1) * pagination.size + index + 1 }}</text>
              <view v-else-if="column.renderType === 'level-pill'" class="table-cell" :class="column.className">
                <text class="level-pill" :class="getLevelClass(getCellValue(item, column.key) as number | null)">{{ getLevelText(getCellValue(item, column.key) as number | null) }}</text>
              </view>
              <view v-else-if="column.renderType === 'action'" class="table-cell col-action">
                <button class="table-action-btn" @click.stop="openEditDialog(item)">{{ localeText("编辑", "Edit") }}</button>
                <button class="table-action-btn" @click.stop="handleToggleEnabled(item)">{{ item.enabled ? localeText("停用", "Disable") : localeText("启用", "Enable") }}</button>
                <button class="table-action-btn table-action-btn--danger" @click.stop="handleDelete(item)">{{ localeText("删除", "Delete") }}</button>
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

    <view v-if="dialogVisible" class="dialog-mask" @click="closeDialog">
      <view class="dialog-panel dialog-panel--form" @click.stop>
        <view class="dialog-head">
          <view>
            <text class="dialog-title">{{ isCreating ? localeText("新增规则", "Add Rule") : localeText("编辑规则", "Edit Rule") }}</text>
            <text class="dialog-subtitle">{{ localeText("维护报警规则", "Maintain alarm rules") }}</text>
          </view>
          <button class="icon-button" hover-class="icon-button--hover" :aria-label="localeText('关闭', 'Close')" @click="closeDialog">
            <text class="close-icon"></text>
          </button>
        </view>

        <view v-if="formError" class="error-summary">{{ formError }}</view>

        <view class="dialog-body">
          <view class="alarm-dialog-form">
            <view class="form-field">
              <text class="form-label form-label--required">{{ localeText("规则名称", "Rule Name") }}</text>
              <input v-model="form.ruleName" class="form-input" :class="{ 'form-control--error': validationErrors.ruleName }" :placeholder="localeText('请输入规则名称', 'Enter rule name')" placeholder-class="input-placeholder" @input="clearError('ruleName')" />
              <text v-if="validationErrors.ruleName" class="form-error">{{ validationErrors.ruleName }}</text>
            </view>

            <view class="form-field">
              <text class="form-label form-label--required">{{ localeText("报警类型", "Alarm Type") }}</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" @click.stop="toggleSelect('ruleType')">
                  <text :class="{ 'select-placeholder': form.ruleType === null }">{{ getRuleTypeText(form.ruleType, true) }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="activeSelect === 'ruleType'" class="select-menu">
                  <view v-for="option in ALARM_TYPES" :key="option.label" class="select-option" :class="{ 'select-option--active': form.ruleType === option.value }" @click.stop="selectRuleType(option.value)">
                    {{ option.label }}
                  </view>
                </view>
              </view>
              <text v-if="validationErrors.ruleType" class="form-error">{{ validationErrors.ruleType }}</text>
            </view>

            <view class="form-field">
              <text class="form-label form-label--required">{{ localeText("报警级别", "Alarm Level") }}</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" @click.stop="toggleSelect('alarmLevel')">
                  <text :class="{ 'select-placeholder': form.alarmLevel === null }">{{ getLevelText(form.alarmLevel, true) }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="activeSelect === 'alarmLevel'" class="select-menu">
                  <view v-for="option in alarmLevelOptions.slice(1)" :key="option.label" class="select-option" :class="{ 'select-option--active': form.alarmLevel === option.value }" @click.stop="selectAlarmLevel(option.value)">
                    {{ option.label }}
                  </view>
                </view>
              </view>
              <text v-if="validationErrors.alarmLevel" class="form-error">{{ validationErrors.alarmLevel }}</text>
            </view>

            <view class="form-field">
              <text class="form-label form-label--required">{{ localeText("阈值模式", "Threshold Mode") }}</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" @click.stop="toggleSelect('thresholdType')">
                  <text>{{ getThresholdTypeText(form.thresholdType) }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="activeSelect === 'thresholdType'" class="select-menu">
                  <view v-for="option in thresholdTypeOptions" :key="option.label" class="select-option" :class="{ 'select-option--active': form.thresholdType === option.value }" @click.stop="selectThresholdType(option.value)">
                    {{ option.label }}
                  </view>
                </view>
              </view>
            </view>

            <template v-if="form.thresholdType === 0">
              <view class="form-field">
                <text class="form-label form-label--required">{{ localeText("阈值上限", "Threshold Upper") }}</text>
                <input v-model="form.thresholdUpper" class="form-input" :class="{ 'form-control--error': validationErrors.thresholdUpper }" type="digit" :placeholder="localeText('请输入阈值上限', 'Enter threshold upper')" placeholder-class="input-placeholder" @input="clearError('thresholdUpper')" />
                <text v-if="validationErrors.thresholdUpper" class="form-error">{{ validationErrors.thresholdUpper }}</text>
              </view>
              <view class="form-field">
                <text class="form-label form-label--required">{{ localeText("阈值下限", "Threshold Lower") }}</text>
                <input v-model="form.thresholdLower" class="form-input" :class="{ 'form-control--error': validationErrors.thresholdLower }" type="digit" :placeholder="localeText('请输入阈值下限', 'Enter threshold lower')" placeholder-class="input-placeholder" @input="clearError('thresholdLower')" />
                <text v-if="validationErrors.thresholdLower" class="form-error">{{ validationErrors.thresholdLower }}</text>
              </view>
            </template>

            <template v-else>
              <view class="form-field">
                <text class="form-label form-label--required">{{ localeText("统计窗口长度（分钟）", "Window Length (min)") }}</text>
                <input v-model="form.windowMinutes" class="form-input" :class="{ 'form-control--error': validationErrors.windowMinutes }" type="number" :placeholder="localeText('请输入统计窗口长度', 'Enter window length')" placeholder-class="input-placeholder" @input="clearError('windowMinutes')" />
                <text v-if="validationErrors.windowMinutes" class="form-error">{{ validationErrors.windowMinutes }}</text>
              </view>
              <view class="form-field">
                <text class="form-label form-label--required">{{ localeText("倍数 N（均值±Nσ）", "Sigma Times N") }}</text>
                <input v-model="form.sigmaTimes" class="form-input" :class="{ 'form-control--error': validationErrors.sigmaTimes }" type="digit" :placeholder="localeText('请输入倍数 N', 'Enter sigma times N')" placeholder-class="input-placeholder" @input="clearError('sigmaTimes')" />
                <text v-if="validationErrors.sigmaTimes" class="form-error">{{ validationErrors.sigmaTimes }}</text>
              </view>
            </template>

            <view class="form-field">
              <text class="form-label">{{ localeText("持续时长（秒）", "Duration (s)") }}</text>
              <input v-model="form.durationSeconds" class="form-input" :class="{ 'form-control--error': validationErrors.durationSeconds }" type="number" :placeholder="localeText('超限持续该时长才报警', 'Alarm after duration')" placeholder-class="input-placeholder" @input="clearError('durationSeconds')" />
              <text v-if="validationErrors.durationSeconds" class="form-error">{{ validationErrors.durationSeconds }}</text>
            </view>

            <view class="form-field">
              <text class="form-label">{{ localeText("静默期（秒）", "Silence Period (s)") }}</text>
              <input v-model="form.silenceSeconds" class="form-input" :class="{ 'form-control--error': validationErrors.silenceSeconds }" type="number" :placeholder="localeText('静默期内重复触发不重复报警', 'No repeat alarm within silence period')" placeholder-class="input-placeholder" @input="clearError('silenceSeconds')" />
              <text v-if="validationErrors.silenceSeconds" class="form-error">{{ validationErrors.silenceSeconds }}</text>
            </view>

            <view class="form-field">
              <text class="form-label">{{ localeText("生效时间段", "Effective Period") }}</text>
              <input v-model="form.effectivePeriod" class="form-input" :placeholder="localeText('如 22:00-06:00，留空为全天', 'e.g. 22:00-06:00, empty for all day')" placeholder-class="input-placeholder" />
            </view>

            <view class="form-field">
              <text class="form-label">{{ localeText("生效范围", "Scope") }}</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" @click.stop="toggleSelect('scopeType')">
                  <text>{{ getScopeTypeText(form.scopeType) }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="activeSelect === 'scopeType'" class="select-menu">
                  <view v-for="option in scopeOptions" :key="option.label" class="select-option" :class="{ 'select-option--active': form.scopeType === option.value }" @click.stop="selectScopeType(option.value)">
                    {{ option.label }}
                  </view>
                </view>
              </view>
            </view>

            <view v-if="form.scopeType === 1" class="form-field">
              <text class="form-label form-label--required">{{ localeText("部门", "Department") }}</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" @click.stop="toggleSelect('deptId')">
                  <text :class="{ 'select-placeholder': form.deptId === null }">{{ getDeptName(form.deptId) }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="activeSelect === 'deptId'" class="select-menu">
                  <view v-for="dept in deptList" :key="dept.id" class="select-option" :class="{ 'select-option--active': form.deptId === dept.id }" @click.stop="selectDept(dept.id)">
                    {{ dept.deptName }}
                  </view>
                </view>
              </view>
              <text v-if="validationErrors.deptId" class="form-error">{{ validationErrors.deptId }}</text>
            </view>

            <view v-if="form.scopeType === 2" class="form-field form-field--full">
              <text class="form-label form-label--required">{{ localeText("指定设备", "Specific Devices") }}</text>
              <view class="device-select-field">
                <button class="toolbar-button device-select-btn" type="button" @click="openDeviceDialog">{{ localeText("请选择设备", "Select devices") }}（{{ form.deviceIds.length }}）</button>
                <view v-if="form.deviceIds.length" class="device-tags">
                  <text v-for="tag in deviceTagList" :key="tag" class="device-tag" :title="tag">{{ tag }}</text>
                </view>
              </view>
              <text v-if="validationErrors.deviceIds" class="form-error">{{ validationErrors.deviceIds }}</text>
            </view>

            <view class="form-field">
              <text class="form-label">{{ localeText("启用状态", "Enabled Status") }}</text>
              <view class="switch-field" @click="form.enabled = !form.enabled">
                <view class="switch-track" :class="{ 'switch-track--on': form.enabled }">
                  <view class="switch-thumb"></view>
                </view>
                <text class="switch-label">{{ form.enabled ? localeText("启用", "Enabled") : localeText("停用", "Disabled") }}</text>
              </view>
            </view>

            <view class="form-field form-field--full">
              <text class="form-label">{{ localeText("备注", "Remark") }}</text>
              <input v-model="form.remark" class="form-input" :placeholder="localeText('请输入备注', 'Enter remark')" placeholder-class="input-placeholder" />
            </view>
          </view>
        </view>

        <view class="dialog-footer">
          <button class="toolbar-button" @click="closeDialog">{{ localeText("取消", "Cancel") }}</button>
          <button class="toolbar-button toolbar-button--primary" :loading="saving" @click="handleSave">{{ localeText("保存", "Save") }}</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "@/i18n";
import { useLocaleText, useLocalizedPageInfo, useLocalizedTotal } from "@/i18n/localeText";
import {
  getRulePage,
  createRule,
  updateRule,
  deleteRule,
} from "@/services/alarm/strategy";
import type { AlarmRule, AlarmRulePageQuery, AlarmRulePayload, PageInfo } from "@/services/alarm/strategy";
import {
  strategyColumns,
  strategyGridColumns,
  type AlarmTableColumn,
} from "@/pages/alarm/components/alarmColumns";
import { getDeptList } from "@/services/partition/partition";
import { getDeviceList } from "@/services/device/info";
import { confirmDangerAction } from "@/utils/confirmAction";
import XTreeMultiSelectDialog from "@/pages/device/components/x/dialog/XTreeMultiSelectDialog.vue";
import type { PartitionNode } from "@/pages/device/components/x/tree/XTreeNode.vue";

const localeText = useLocaleText();
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

interface DeviceItem {
  id: number;
  deviceNumber: string;
  deptId?: number | null;
}

/** 报警类型（协议四类）。computed：随语言切换实时刷新选项文案。 */
const ALARM_TYPES = computed(() => [
  { label: localeText("压力异常", "Pressure Anomaly"), value: 1 },
  { label: localeText("渗漏", "Leakage"), value: 2 },
  { label: localeText("爆管", "Pipe Burst"), value: 3 },
  { label: localeText("设备离线", "Offline"), value: 4 },
]);

/** 筛选专用：首项"不限"= 不过滤（表单必填选择直接用 ALARM_TYPES） */
const alarmTypeFilterOptions = computed(() => [
  { label: localeText("不限", "All"), value: null as number | null },
  ...ALARM_TYPES.value,
]);

const alarmLevelOptions = computed(() => [
  { label: localeText("不限", "All"), value: null },
  { label: localeText("提示", "Info"), value: 1 },
  { label: localeText("警告", "Warning"), value: 2 },
  { label: localeText("严重", "Critical"), value: 3 },
]);
const enabledOptions = computed(() => [
  { label: localeText("不限", "All"), value: null },
  { label: localeText("启用", "Enabled"), value: 1 },
  { label: localeText("停用", "Disabled"), value: 0 },
]);
const thresholdTypeOptions = computed(() => [
  { label: localeText("静态", "Static"), value: 0 },
  { label: localeText("动态", "Dynamic"), value: 1 },
]);
const scopeOptions = computed(() => [
  { label: localeText("全局", "Global"), value: 0 },
  { label: localeText("部门", "Department"), value: 1 },
  { label: localeText("指定设备", "Specific Devices"), value: 2 },
]);

const filters = reactive({
  ruleName: "",
  ruleTypeIndex: 0,
  alarmLevelIndex: 0,
  enabledIndex: 0,
  scopeIndex: 0,
});

const loading = ref(false);
const saving = ref(false);
const ruleList = ref<AlarmRule[]>([]);
const pagination = reactive({ current: 1, size: 10, total: 0 });
const jumpPage = ref<number | null>(null);

const ruleColumns = strategyColumns;

/* 枚举/计算列文本格式化器：与 alarmColumns.ts 的 formatKey 对应 */
const textFormatters: Record<string, (item: AlarmRule) => string> = {
  ruleKind: (item) => getRuleTypeText(item.ruleType as number | null),
  alarmType: (item) => getRuleTypeText(item.ruleType as number | null),
  alarmLevel: () => "",
  thresholdDesc: (item) => getThresholdDescText(item),
  scope: (item) => getScopeText(item),
  enabledText: (item) => (item.enabled ? localeText("启用", "Enabled") : localeText("停用", "Disabled")),
};

function getCellValue(item: AlarmRule, key: string): unknown {
  return (item as Record<string, unknown>)[key];
}

function cellText(item: AlarmRule, column: AlarmTableColumn): string {
  const formatter = column.formatKey ? textFormatters[column.formatKey] : undefined;
  if (formatter) return formatter(item);
  const raw = getCellValue(item, column.key);
  return raw == null || raw === "" ? "-" : String(raw);
}

const totalPages = computed(() => Math.max(1, Math.ceil(pagination.total / pagination.size)));

/* ========================= 文案映射 ========================= */

function getRuleTypeText(value?: number | null, placeholder = false) {
  const zhMap: Record<number, string> = { 1: "压力异常", 2: "渗漏", 3: "爆管", 4: "设备离线" };
  const enMap: Record<number, string> = { 1: "Pressure Anomaly", 2: "Leakage", 3: "Pipe Burst", 4: "Offline" };
  if (value == null) return placeholder ? localeText("请选择报警类型", "Select alarm type") : "-";
  return localeText(zhMap[value] || "-", enMap[value] || "-");
}

function getLevelText(value?: number | null, placeholder = false) {
  const zhMap: Record<number, string> = { 1: "提示", 2: "警告", 3: "严重" };
  const enMap: Record<number, string> = { 1: "Info", 2: "Warning", 3: "Critical" };
  if (value == null) return placeholder ? localeText("请选择报警级别", "Select alarm level") : "-";
  return localeText(zhMap[value] || "-", enMap[value] || "-");
}

function getLevelClass(value?: string | number | null) {
  if (value === 1 || value === "INFO") return "level-pill--info";
  if (value === 2 || value === "WARNING") return "level-pill--warning";
  return "level-pill--critical";
}

function getThresholdTypeText(value?: number | null) {
  return value === 1 ? localeText("动态", "Dynamic") : localeText("静态", "Static");
}

function getScopeTypeText(value?: number | null) {
  const zhMap: Record<number, string> = { 0: "全局", 1: "部门", 2: "指定设备" };
  const enMap: Record<number, string> = { 0: "Global", 1: "Department", 2: "Specific Devices" };
  const key = value ?? 0;
  return localeText(zhMap[key] || "全局", enMap[key] || "Global");
}

/** 判定条件列：静态=上下限 / 动态=窗口+Nσ / 离线=分钟 */
function getThresholdDescText(item: AlarmRule) {
  if (Number(item.ruleType) === 4) {
    return item.offlineMinutes != null
      ? localeText(`离线超过 ${item.offlineMinutes} 分钟`, `Offline > ${item.offlineMinutes} min`)
      : "-";
  }
  if (Number(item.thresholdType) === 1) {
    const w = item.windowMinutes ?? "-";
    const s = item.sigmaTimes ?? "-";
    return localeText(`窗口 ${w}分钟 ±${s}σ`, `Window ${w}min ±${s}σ`);
  }
  const upper = item.thresholdUpper;
  const lower = item.thresholdLower;
  if (upper == null && lower == null) return "-";
  return `${lower ?? "-∞"} ~ ${upper ?? "+∞"}`;
}

function getScopeText(item: AlarmRule) {
  if (Number(item.scopeType) === 2) {
    const ids = Array.isArray(item.deviceIds) ? item.deviceIds : [];
    return ids.length ? `${localeText("设备", "Devices")} ×${ids.length}` : localeText("指定设备", "Specific Devices");
  }
  if (Number(item.scopeType) === 1) {
    const deptName = deptList.value.find((dept) => dept.id === item.deptId)?.deptName;
    return deptName || localeText("部门", "Department");
  }
  return localeText("全局", "Global");
}

/* ========================= 数据加载 ========================= */

function buildPageParams(page: number): AlarmRulePageQuery {
  const params: AlarmRulePageQuery = {
    pageNum: page,
    pageSize: pagination.size,
  };
  if (filters.ruleName.trim()) params.ruleName = filters.ruleName.trim();
  const ruleType = alarmTypeFilterOptions.value[filters.ruleTypeIndex].value;
  if (ruleType !== null) params.ruleType = ruleType;
  const alarmLevel = filters.alarmLevelIndex > 0 ? filters.alarmLevelIndex : null;
  if (alarmLevel !== null) params.alarmLevel = alarmLevel;
  const enabled = filters.enabledIndex > 0 ? filters.enabledIndex === 1 : null;
  if (enabled !== null) params.enabled = enabled;
  return params;
}

let fetchRequestId = 0;

async function loadRules(page = 1) {
  const requestId = ++fetchRequestId;
  loading.value = true;
  const params = buildPageParams(page);
  try {
    const res = await getRulePage(params);
    if (requestId !== fetchRequestId) return;
    if (res.code !== undefined && res.code !== 200) {
      throw new Error(res.msg || "load failed");
    }
    const pageData: PageInfo<AlarmRule> = res.data || {};
    ruleList.value = pageData.records || [];
    pagination.total = pageData.total || 0;
    pagination.current = page;
  } catch {
    if (requestId !== fetchRequestId) return;
    ruleList.value = [];
    pagination.total = 0;
    pagination.current = page;
    uni.showToast({ title: localeText("加载规则列表失败", "Failed to load rules"), icon: "none" });
  } finally {
    if (requestId === fetchRequestId) {
      loading.value = false;
      jumpPage.value = null;
    }
  }
}

function resetFilters() {
  filters.ruleName = "";
  filters.ruleTypeIndex = 0;
  filters.alarmLevelIndex = 0;
  filters.enabledIndex = 0;
  filters.scopeIndex = 0;
  loadRules(1);
}

function handlePageChange(page: number | null) {
  if (page == null || page < 1 || page > totalPages.value || page === pagination.current) return;
  loadRules(page);
}

/* ========================= 筛选事件 ========================= */

function handleFilterTypeChange(event: { detail: { value: number } }) {
  filters.ruleTypeIndex = Number(event.detail.value);
}
function handleFilterLevelChange(event: { detail: { value: number } }) {
  filters.alarmLevelIndex = Number(event.detail.value);
}
function handleFilterEnabledChange(event: { detail: { value: number } }) {
  filters.enabledIndex = Number(event.detail.value);
}
function handleFilterScopeChange(event: { detail: { value: number } }) {
  filters.scopeIndex = Number(event.detail.value);
}

/* ========================= 弹窗表单 ========================= */

const dialogVisible = ref(false);
const isCreating = ref(true);
const activeSelect = ref<string | null>(null);
const formError = ref("");
const deptList = ref<DeptItem[]>([]);
const deviceDialogVisible = ref(false);
const deviceDialogValue = ref<number[]>([]);
const deviceTree = ref<PartitionNode[]>([]);
const deviceMap = ref<Map<number, DeviceItem>>(new Map());

const form = reactive({
  id: null as number | null,
  ruleName: "",
  ruleType: null as number | null,
  alarmLevel: null as number | null,
  thresholdType: 0,
  thresholdUpper: "" as string | number,
  thresholdLower: "" as string | number,
  windowMinutes: "" as string | number,
  sigmaTimes: "" as string | number,
  durationSeconds: "" as string | number,
  silenceSeconds: "" as string | number,
  effectivePeriod: "",
  scopeType: 0,
  deptId: null as number | null,
  deviceIds: [] as number[],
  enabled: true,
  remark: "",
});

const validationErrors = reactive<Record<string, string>>({});

const deviceTagList = computed(() =>
  form.deviceIds.map((id) => deviceMap.value.get(id)?.deviceNumber || `#${id}`),
);

function toggleSelect(key: string) {
  activeSelect.value = activeSelect.value === key ? null : key;
}

function clearError(key: string) {
  if (validationErrors[key]) {
    validationErrors[key] = "";
  }
}

function getDeptName(deptId: number | null) {
  if (deptId == null) return localeText("请选择部门", "Select department");
  return deptList.value.find((dept) => dept.id === deptId)?.deptName || `#${deptId}`;
}

function selectRuleType(value: number | null) {
  if (value === null) return;
  form.ruleType = value;
  validationErrors.ruleType = "";
  activeSelect.value = null;
}

function selectAlarmLevel(value: number | null) {
  if (value === null) return;
  form.alarmLevel = value;
  validationErrors.alarmLevel = "";
  activeSelect.value = null;
}

function selectThresholdType(value: number | null) {
  if (value === null) return;
  form.thresholdType = value;
  activeSelect.value = null;
}

function selectScopeType(value: number | null) {
  if (value === null) return;
  form.scopeType = value;
  if (value !== 1) validationErrors.deptId = "";
  if (value !== 2) validationErrors.deviceIds = "";
  activeSelect.value = null;
}

function selectDept(value: number) {
  form.deptId = value;
  validationErrors.deptId = "";
  activeSelect.value = null;
}

async function loadDeptOptions() {
  try {
    const res = (await getDeptList()) as ApiLikeResponse<DeptItem[]>;
    deptList.value = res.data || [];
  } catch {
    deptList.value = [];
  }
}

async function loadDeviceTreeBase() {
  try {
    const [deptRes, deviceRes] = (await Promise.all([
      getDeptList() as Promise<ApiLikeResponse<DeptItem[]>>,
      getDeviceList({ pageSize: 999 }) as Promise<ApiLikeResponse<DeviceItem[]>>,
    ])) as [ApiLikeResponse<DeptItem[]>, ApiLikeResponse<DeviceItem[]>];

    const depts = deptRes.data || [];
    const devices = deviceRes.data || [];

    const map = new Map<number, DeviceItem>();
    devices.forEach((device) => map.set(device.id, device));
    deviceMap.value = map;

    const childrenByDept = new Map<number, DeviceItem[]>();
    devices.forEach((device) => {
      if (device.deptId == null) return;
      const list = childrenByDept.get(device.deptId) || [];
      list.push(device);
      childrenByDept.set(device.deptId, list);
    });

    deviceTree.value = depts.map((dept) => ({
      id: dept.id,
      name: dept.deptName,
      children: (childrenByDept.get(dept.id) || []).map((device) => ({
        id: device.id,
        name: device.deviceNumber,
      })),
    }));
  } catch {
    deviceTree.value = [];
  }
}

function openCreateDialog() {
  isCreating.value = true;
  formError.value = "";
  Object.keys(validationErrors).forEach((key) => {
    validationErrors[key] = "";
  });
  Object.assign(form, {
    id: null,
    ruleName: "",
    ruleType: null,
    alarmLevel: null,
    thresholdType: 0,
    thresholdUpper: "",
    thresholdLower: "",
    windowMinutes: "",
    sigmaTimes: "",
    durationSeconds: "",
    silenceSeconds: "",
    effectivePeriod: "",
    scopeType: 0,
    deptId: null,
    deviceIds: [],
    enabled: true,
    remark: "",
  });
  dialogVisible.value = true;
}

function openEditDialog(item: AlarmRule) {
  isCreating.value = false;
  formError.value = "";
  Object.keys(validationErrors).forEach((key) => {
    validationErrors[key] = "";
  });
  Object.assign(form, {
    id: item.id ?? null,
    ruleName: item.ruleName || "",
    ruleType: (Number(item.ruleType) || null) as number | null,
    alarmLevel: (Number(item.alarmLevel) || null) as number | null,
    thresholdType: Number(item.thresholdType) || 0,
    thresholdUpper: item.thresholdUpper ?? "",
    thresholdLower: item.thresholdLower ?? "",
    windowMinutes: item.windowMinutes ?? "",
    sigmaTimes: item.sigmaTimes ?? "",
    durationSeconds: item.durationSeconds ?? "",
    silenceSeconds: item.silenceSeconds ?? "",
    effectivePeriod: item.effectivePeriod || "",
    scopeType: Number(item.scopeType) || 0,
    deptId: item.deptId ?? null,
    deviceIds: Array.isArray(item.deviceIds) ? [...item.deviceIds] : [],
    enabled: item.enabled !== false,
    remark: item.remark || "",
  });
  dialogVisible.value = true;
}

function closeDialog() {
  dialogVisible.value = false;
  activeSelect.value = null;
}

function validateForm() {
  Object.keys(validationErrors).forEach((key) => {
    validationErrors[key] = "";
  });
  formError.value = "";

  if (!form.ruleName.trim()) {
    validationErrors.ruleName = localeText("规则名称必填", "Rule name is required");
  }
  if (form.ruleType === null) {
    validationErrors.ruleType = localeText("请选择报警类型（必填）", "Alarm type is required");
  }
  if (form.alarmLevel === null) {
    validationErrors.alarmLevel = localeText("请选择报警级别", "Select alarm level");
  }

  if (form.thresholdType === 0) {
    if (form.thresholdUpper === "" || form.thresholdUpper === null) {
      validationErrors.thresholdUpper = localeText("请输入阈值上限", "Enter threshold upper");
    }
    if (form.thresholdLower === "" || form.thresholdLower === null) {
      validationErrors.thresholdLower = localeText("请输入阈值下限", "Enter threshold lower");
    }
    if (
      form.thresholdUpper !== "" &&
      form.thresholdLower !== "" &&
      Number(form.thresholdUpper) <= Number(form.thresholdLower)
    ) {
      validationErrors.thresholdUpper = localeText("上限须大于下限", "Upper must be greater than lower");
    }
  } else if (form.windowMinutes === "" || Number(form.windowMinutes) <= 0) {
    validationErrors.windowMinutes = localeText("请输入统计窗口长度", "Enter window length");
  }

  if (form.durationSeconds !== "" && Number(form.durationSeconds) < 0) {
    validationErrors.durationSeconds = localeText("持续时长不能为负数", "Duration cannot be negative");
  }
  if (form.silenceSeconds !== "" && Number(form.silenceSeconds) < 0) {
    validationErrors.silenceSeconds = localeText("静默期不能为负数", "Silence period cannot be negative");
  }

  if (form.scopeType === 1 && form.deptId === null) {
    validationErrors.deptId = localeText("请选择部门", "Select department");
  }
  if (form.scopeType === 2 && form.deviceIds.length === 0) {
    validationErrors.deviceIds = localeText("生效范围为指定设备时必须选择设备", "Devices are required for specific devices scope");
  }

  return !Object.values(validationErrors).some(Boolean) && !formError.value;
}

function buildSavePayload(): AlarmRulePayload {
  const payload: AlarmRulePayload = {
    ruleName: form.ruleName.trim(),
    ruleType: form.ruleType ?? undefined,
    alarmLevel: form.alarmLevel ?? undefined,
    thresholdType: form.thresholdType,
    durationSeconds: form.durationSeconds === "" ? 0 : Number(form.durationSeconds),
    silenceSeconds: form.silenceSeconds === "" ? 0 : Number(form.silenceSeconds),
    effectivePeriod: form.effectivePeriod.trim(),
    scopeType: form.scopeType,
    enabled: form.enabled,
    remark: form.remark.trim(),
  };

  if (form.thresholdType === 0) {
    payload.thresholdUpper = form.thresholdUpper === "" ? null : Number(form.thresholdUpper);
    payload.thresholdLower = form.thresholdLower === "" ? null : Number(form.thresholdLower);
    payload.windowMinutes = null;
    payload.sigmaTimes = null;
  } else {
    payload.thresholdUpper = null;
    payload.thresholdLower = null;
    payload.windowMinutes = Number(form.windowMinutes) || null;
    payload.sigmaTimes = form.sigmaTimes === "" ? null : Number(form.sigmaTimes);
  }

  if (form.scopeType === 1) {
    payload.deptId = form.deptId;
    payload.deviceIds = null;
  } else if (form.scopeType === 2) {
    payload.deptId = null;
    payload.deviceIds = form.deviceIds;
  } else {
    payload.deptId = null;
    payload.deviceIds = null;
  }

  return payload;
}

async function handleSave() {
  if (!validateForm() || saving.value) return;

  saving.value = true;
  try {
    const payload = buildSavePayload();
    const res = isCreating.value
      ? await createRule(payload)
      : await updateRule(form.id as number, payload);

    if (res.code !== undefined && res.code !== 200) {
      formError.value = res.msg || localeText("保存失败", "Save failed");
      return;
    }

    uni.showToast({ title: localeText("保存成功", "Saved"), icon: "success" });
    closeDialog();
    loadRules(pagination.current);
  } catch (error) {
    formError.value = (error as { msg?: string })?.msg || localeText("保存失败", "Save failed");
  } finally {
    saving.value = false;
  }
}

/** 行内启停：翻转 enabled 后整体保存（走 updateRule）。 */
async function handleToggleEnabled(item: AlarmRule) {
  try {
    const res = await updateRule(item.id as number, { ...item, enabled: !item.enabled } as AlarmRulePayload);
    if (res.code !== undefined && res.code !== 200) {
      throw new Error(res.msg);
    }
    loadRules(pagination.current);
  } catch (error) {
    uni.showToast({ title: (error as { msg?: string })?.msg || localeText("切换启停失败", "Toggle failed"), icon: "none" });
  }
}

async function handleDelete(item: AlarmRule) {
  const confirmed = await confirmDangerAction({
    content: localeText(`确认删除规则「${item.ruleName || ""}」吗？`, `Delete rule "${item.ruleName || ""}"?`),
  });
  if (!confirmed) return;

  try {
    const res = await deleteRule(item.id as number);
    if (res.code !== undefined && res.code !== 200) {
      throw new Error(res.msg);
    }
    uni.showToast({ title: localeText("删除成功", "Deleted"), icon: "success" });
    if (ruleList.value.length === 1 && pagination.current > 1) {
      loadRules(pagination.current - 1);
    } else {
      loadRules(pagination.current);
    }
  } catch (error) {
    uni.showToast({ title: (error as { msg?: string })?.msg || localeText("删除规则失败", "Failed to delete rule"), icon: "none" });
  }
}

/* ========================= 设备选择 ========================= */

function openDeviceDialog() {
  deviceDialogValue.value = [...form.deviceIds];
  deviceDialogVisible.value = true;
}

function handleDeviceConfirm(data: { addIds: number[]; removeIds: number[] }) {
  form.deviceIds = deviceDialogValue.value;
  if (form.deviceIds.length) {
    validationErrors.deviceIds = "";
  }
  void data;
}

onMounted(() => {
  loadRules(1);
  loadDeptOptions();
  loadDeviceTreeBase();
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
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 10px 12px;
  min-width: 0;
  width: 100%;
}

.filter-group {
  display: grid;
  align-content: start;
  gap: 6px;
  flex: 0 0 136px;
  min-width: 0;
}

.filter-group--wide {
  flex-basis: 200px;
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

.rule-table-row {
  /* 列宽模板由 alarmColumns.ts 的 strategyGridColumns 内联绑定（字段配置化） */
  min-width: 1080px;
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

.col-rule-name {
  justify-content: center;
}

.col-action {
  gap: 6px;
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

.table-action-btn--danger {
  color: #ef4444;
  background: #fff5f3;
  border-color: #ffc9c0;
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

.select-placeholder {
  color: #9aa9b8;
}

.input-placeholder {
  color: #9aa9b8;
}

/* ========================= 设备选择 / 开关 ========================= */

.device-select-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.device-select-btn {
  align-self: flex-start;
}

.device-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.device-tag {
  padding: 3px 10px;
  color: #0d82ee;
  font-size: 12px;
  font-weight: 700;
  background: #edf7ff;
  border: 1px solid #b9dcfb;
  border-radius: 999px;
}

.switch-field {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  cursor: pointer;
}

.switch-track {
  position: relative;
  width: 42px;
  height: 22px;
  background: #cbdced;
  border-radius: 999px;
  transition: background 0.18s ease;
}

.switch-track--on {
  background: #0d82ee;
}

.switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(15, 35, 55, 0.28);
  transition: transform 0.18s ease;
}

.switch-track--on .switch-thumb {
  transform: translateX(20px);
}

.switch-label {
  color: #34495e;
  font-size: 13px;
  font-weight: 700;
}
</style>
