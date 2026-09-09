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
          <picker :range="alarmTypeFilterOptions" range-key="label" :value="filters.alarmTypeIndex" @change="handleFilterTypeChange">
            <view class="filter-select">
              <text>{{ alarmTypeFilterOptions[filters.alarmTypeIndex].label }}</text>
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
                <text class="level-pill" :class="getLevelClass(getCellValue(item, column.key) as string | null)">{{ getLevelText(getCellValue(item, column.key) as string | null) }}</text>
              </view>
              <view v-else-if="column.renderType === 'action'" class="table-cell col-action">
                <button class="table-action-btn" @click.stop="openEditDialog(item)">{{ localeText("编辑", "Edit") }}</button>
                <button class="table-action-btn" @click.stop="handleToggleEnabled(item)">{{ item.enabled ? localeText("停用", "Disable") : localeText("启用", "Enable") }}</button>
                <button v-if="item.ruleKind !== 'FIXED'" class="table-action-btn table-action-btn--danger" @click.stop="handleDelete(item)">{{ localeText("删除", "Delete") }}</button>
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
            <text class="dialog-subtitle">{{ isCreating ? localeText("新建自定义规则", "Create custom rule") : localeText("维护报警规则", "Maintain alarm rules") }}</text>
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

            <template v-if="!editingFixed">
              <view class="form-field">
                <text class="form-label form-label--required">{{ localeText("监测字段", "Monitor Field") }}</text>
                <view class="select-field">
                  <input
                    v-model="fieldKeyword"
                    class="form-input form-input--field"
                    :class="{ 'form-control--error': validationErrors.fieldName }"
                    type="text"
                    :placeholder="localeText('输入关键字筛选字段', 'Type to filter fields')"
                    placeholder-class="input-placeholder"
                    @focus="activeSelect = 'fieldName'"
                    @input="activeSelect = 'fieldName'"
                  />
                  <text class="select-arrow"></text>
                  <view v-if="activeSelect === 'fieldName'" class="select-menu select-menu--field">
                    <view
                      v-for="option in filteredFieldOptions"
                      :key="option.fieldName"
                      class="select-option"
                      :class="{ 'select-option--active': form.fieldName === option.fieldName }"
                      @click.stop="selectFieldName(option)"
                    >
                      {{ option.fieldCnName || option.fieldName }}
                    </view>
                    <view v-if="filteredFieldOptions.length === 0" class="select-option select-option--empty">
                      {{ localeText("无匹配字段", "No matching fields") }}
                    </view>
                  </view>
                </view>
                <text v-if="validationErrors.fieldName" class="form-error">{{ validationErrors.fieldName }}</text>
              </view>
            </template>

            <template v-else>
              <view v-if="form.alarmType === 'OFFLINE'" class="form-field">
                <text class="form-label form-label--required">{{ localeText("离线判定（分钟）", "Offline Threshold (min)") }}</text>
                <input v-model="form.thresholdMinutes" class="form-input" :class="{ 'form-control--error': validationErrors.thresholdMinutes }" type="number" :placeholder="localeText('设备离线超过该分钟数触发', 'Trigger after offline minutes')" placeholder-class="input-placeholder" @input="clearError('thresholdMinutes')" />
                <text v-if="validationErrors.thresholdMinutes" class="form-error">{{ validationErrors.thresholdMinutes }}</text>
              </view>
              <view v-if="form.alarmType === 'NO_DATA'" class="form-field">
                <text class="form-label form-label--required">{{ localeText("超时判定（小时）", "No-data Threshold (hours)") }}</text>
                <input v-model="form.thresholdHours" class="form-input" :class="{ 'form-control--error': validationErrors.thresholdHours }" type="number" :placeholder="localeText('无上报超过该小时数触发', 'Trigger after no-data hours')" placeholder-class="input-placeholder" @input="clearError('thresholdHours')" />
                <text v-if="validationErrors.thresholdHours" class="form-error">{{ validationErrors.thresholdHours }}</text>
              </view>
              <view v-if="form.alarmType === 'LEAK_SUSPECT'" class="form-field">
                <text class="form-label form-label--required">{{ localeText("渗漏触发值集合", "Leak Trigger Values") }}</text>
                <input v-model="form.triggerValue" class="form-input" :class="{ 'form-control--error': validationErrors.triggerValue }" type="text" :placeholder="localeText('命中集合即触发，如 2,0', 'Trigger when status in set, e.g. 2,0')" placeholder-class="input-placeholder" @input="clearError('triggerValue')" />
                <text v-if="validationErrors.triggerValue" class="form-error">{{ validationErrors.triggerValue }}</text>
              </view>
            </template>

            <view class="form-field">
              <text class="form-label form-label--required">{{ localeText("报警级别", "Alarm Level") }}</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" @click.stop="toggleSelect('alarmLevel')">
                  <text :class="{ 'select-placeholder': form.alarmLevel === null }">{{ getLevelText(form.alarmLevel, true) }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="activeSelect === 'alarmLevel'" class="select-menu">
                  <view v-for="option in alarmLevelOptions" :key="option.value" class="select-option" :class="{ 'select-option--active': form.alarmLevel === option.value }" @click.stop="selectAlarmLevel(option.value)">
                    {{ option.label }}
                  </view>
                </view>
              </view>
              <text v-if="validationErrors.alarmLevel" class="form-error">{{ validationErrors.alarmLevel }}</text>
            </view>

            <template v-if="!editingFixed">
              <view class="form-field">
                <text class="form-label">{{ localeText("区间下限", "Min Value") }}</text>
                <input v-model="form.minValue" class="form-input" :class="{ 'form-control--error': validationErrors.minValue }" type="digit" :placeholder="getFieldUnitPlaceholder()" placeholder-class="input-placeholder" @input="clearError('minValue')" />
                <text v-if="validationErrors.minValue" class="form-error">{{ validationErrors.minValue }}</text>
              </view>

              <view class="form-field">
                <text class="form-label">{{ localeText("区间上限", "Max Value") }}</text>
                <input v-model="form.maxValue" class="form-input" :class="{ 'form-control--error': validationErrors.maxValue }" type="digit" :placeholder="getFieldUnitPlaceholder()" placeholder-class="input-placeholder" @input="clearError('maxValue')" />
                <text v-if="validationErrors.maxValue" class="form-error">{{ validationErrors.maxValue }}</text>
              </view>
            </template>

            <view class="form-field">
              <text class="form-label">{{ localeText("生效范围", "Scope") }}</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" @click.stop="toggleSelect('scopeType')">
                  <text>{{ getScopeTypeText(form.scopeType) }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="activeSelect === 'scopeType'" class="select-menu">
                  <view v-for="option in scopeOptions" :key="option.value" class="select-option" :class="{ 'select-option--active': form.scopeType === option.value }" @click.stop="selectScopeType(option.value)">
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

            <view class="form-field">
              <text class="form-label">{{ localeText("启用状态", "Enabled Status") }}</text>
              <view class="switch-field" @click="form.enabled = !form.enabled">
                <view class="switch-track" :class="{ 'switch-track--on': form.enabled }">
                  <view class="switch-thumb"></view>
                </view>
                <text class="switch-label">{{ form.enabled ? localeText("启用", "Enabled") : localeText("停用", "Disabled") }}</text>
              </view>
            </view>

            <view class="form-field">
              <text class="form-label">{{ localeText("发送通知", "Notify") }}</text>
              <view class="switch-field" @click="form.notifyEnabled = !form.notifyEnabled">
                <view class="switch-track" :class="{ 'switch-track--on': form.notifyEnabled }">
                  <view class="switch-thumb"></view>
                </view>
                <text class="switch-label">{{ form.notifyEnabled ? localeText("开启", "On") : localeText("关闭", "Off") }}</text>
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
  toggleRule,
  getRuleFields,
} from "@/services/alarm/strategy";
import type { AlarmRule, AlarmRulePageQuery, AlarmRulePayload, PageInfo } from "@/services/alarm/strategy";
import {
  strategyColumns,
  strategyGridColumns,
  type AlarmTableColumn,
} from "@/pages/alarm/components/alarmColumns";
import { getDeptList } from "@/services/partition/partition";
import { confirmDangerAction } from "@/utils/confirmAction";

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

/** 报警类型筛选选项（后端字符串枚举；首项"不限"= 不过滤）。computed：随语言切换实时刷新。 */
const ALARM_TYPE_FILTERS = computed(() => [
  { label: localeText("不限", "All"), value: null as string | null },
  { label: localeText("设备离线", "Offline"), value: "OFFLINE" },
  { label: localeText("数据超时", "No Data"), value: "NO_DATA" },
  { label: localeText("渗漏疑似", "Leak Suspect"), value: "LEAK_SUSPECT" },
  { label: localeText("自定义规则", "Custom Rule"), value: "CUSTOM" },
]);
const alarmTypeFilterOptions = ALARM_TYPE_FILTERS;

/** 级别选项（筛选首项"不限"，表单用 slice 后的子集按值取）。 */
const alarmLevelOptions = computed(() => [
  { label: localeText("提示", "Info"), value: "INFO" },
  { label: localeText("警告", "Warning"), value: "WARNING" },
  { label: localeText("严重", "Critical"), value: "CRITICAL" },
]);
const enabledOptions = computed(() => [
  { label: localeText("不限", "All"), value: null },
  { label: localeText("启用", "Enabled"), value: 1 },
  { label: localeText("停用", "Disabled"), value: 0 },
]);
const scopeOptions = computed(() => [
  { label: localeText("全局", "Global"), value: 0 },
  { label: localeText("部门", "Department"), value: 1 },
]);

const filters = reactive({
  ruleName: "",
  alarmTypeIndex: 0,
  enabledIndex: 0,
});

const loading = ref(false);
const saving = ref(false);
const ruleList = ref<AlarmRule[]>([]);
const pagination = reactive({ current: 1, size: 10, total: 0 });
const jumpPage = ref<number | null>(null);

const ruleColumns = strategyColumns;

/* 枚举/计算列文本格式化器：与 alarmColumns.ts 的 formatKey 对应 */
const textFormatters: Record<string, (item: AlarmRule) => string> = {
  ruleKind: (item) => getRuleKindText(item.ruleKind),
  // 历史 CUSTOM 规则可能 alarmType 为空（后端建规则时不自动挂类型），回退显示"自定义规则"
  alarmType: (item) =>
    item.alarmTypeName ||
    (item.ruleKind === "CUSTOM" && !item.alarmType
      ? localeText("自定义规则", "Custom Rule")
      : getRuleTypeText(item.alarmType)),
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

/* ========================= 文案映射（对齐后端字符串枚举） ========================= */

const RULE_TYPE_ZH: Record<string, string> = {
  OFFLINE: "设备离线",
  NO_DATA: "数据超时",
  LEAK_SUSPECT: "渗漏疑似",
  CUSTOM: "自定义规则",
};
const RULE_TYPE_EN: Record<string, string> = {
  OFFLINE: "Offline",
  NO_DATA: "No Data",
  LEAK_SUSPECT: "Leak Suspect",
  CUSTOM: "Custom Rule",
};

function getRuleTypeText(value?: string | null, placeholder = false) {
  if (value == null) return placeholder ? localeText("请选择报警类型", "Select alarm type") : "-";
  return localeText(RULE_TYPE_ZH[value] || value, RULE_TYPE_EN[value] || value);
}

function getRuleKindText(value?: string | null) {
  if (value === "FIXED") return localeText("固定", "Fixed");
  if (value === "CUSTOM") return localeText("自定义", "Custom");
  return value || "-";
}

function getLevelText(value?: string | null, placeholder = false) {
  const zhMap: Record<string, string> = { INFO: "提示", WARNING: "警告", CRITICAL: "严重" };
  const enMap: Record<string, string> = { INFO: "Info", WARNING: "Warning", CRITICAL: "Critical" };
  if (value == null) return placeholder ? localeText("请选择报警级别", "Select alarm level") : "-";
  return localeText(zhMap[value] || value, enMap[value] || value);
}

function getLevelClass(value?: string | number | null) {
  if (value === "INFO") return "level-pill--info";
  if (value === "WARNING") return "level-pill--warning";
  return "level-pill--critical";
}

function getScopeTypeText(value?: number | null) {
  const zhMap: Record<number, string> = { 0: "全局", 1: "部门" };
  const enMap: Record<number, string> = { 0: "Global", 1: "Department" };
  const key = value ?? 0;
  return localeText(zhMap[key] || "全局", enMap[key] || "Global");
}

/** 判定条件列：对齐后端 FIXED 三类只读参数 + CUSTOM 字段区间 */
function getThresholdDescText(item: AlarmRule) {
  if (item.ruleKind === "FIXED") {
    if (item.alarmType === "OFFLINE") {
      return item.thresholdMinutes != null
        ? localeText(`离线超过 ${item.thresholdMinutes} 分钟`, `Offline > ${item.thresholdMinutes} min`)
        : "-";
    }
    if (item.alarmType === "NO_DATA") {
      return item.thresholdHours != null
        ? localeText(`无上报超过 ${item.thresholdHours} 小时`, `No data > ${item.thresholdHours} h`)
        : "-";
    }
    if (item.alarmType === "LEAK_SUSPECT") {
      return item.triggerValue
        ? localeText(`渗漏状态命中 ${item.triggerValue}`, `Leak status in ${item.triggerValue}`)
        : "-";
    }
    return "-";
  }
  const field = item.fieldName || "-";
  const upper = item.maxValue;
  const lower = item.minValue;
  if (upper == null && lower == null) return field;
  return `${field}: ${lower ?? "-∞"} ~ ${upper ?? "+∞"}`;
}

function getScopeText(item: AlarmRule) {
  if (item.deptId != null) {
    const deptName = deptList.value.find((dept) => dept.id === item.deptId)?.deptName;
    return deptName || localeText("部门", "Department");
  }
  return localeText("全局", "Global");
}

/** 字段下拉数据（GET /fields，供 CUSTOM 规则选择监测字段） */
const fieldOptions = ref<Array<{ fieldName?: string; fieldCnName?: string; unit?: string; description?: string }>>([]);

/** 可搜索下拉：按关键字过滤（匹配中文名/英文名，不区分大小写） */
const fieldKeyword = ref("");

const filteredFieldOptions = computed(() => {
  const kw = fieldKeyword.value.trim().toLowerCase();
  if (!kw) return fieldOptions.value;
  return fieldOptions.value.filter(
    (option) =>
      (option.fieldCnName || "").toLowerCase().includes(kw) ||
      (option.fieldName || "").toLowerCase().includes(kw),
  );
});

function getFieldUnitPlaceholder() {
  const hit = fieldOptions.value.find((option) => option.fieldName === form.fieldName);
  const unit = hit?.unit ? `（${hit.unit}）` : "";
  return localeText(`留空表示不限制${unit}`, `Empty for no limit${unit}`);
}

/* ========================= 数据加载 ========================= */

function buildPageParams(page: number): AlarmRulePageQuery {
  const params: AlarmRulePageQuery = {
    pageNum: page,
    pageSize: pagination.size,
  };
  if (filters.ruleName.trim()) params.ruleName = filters.ruleName.trim();
  const alarmType = alarmTypeFilterOptions.value[filters.alarmTypeIndex].value;
  if (alarmType !== null) params.alarmType = alarmType as AlarmRulePageQuery["alarmType"];
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
  filters.alarmTypeIndex = 0;
  filters.enabledIndex = 0;
  loadRules(1);
}

function handlePageChange(page: number | null) {
  if (page == null || page < 1 || page > totalPages.value || page === pagination.current) return;
  loadRules(page);
}

/* ========================= 筛选事件 ========================= */

function handleFilterTypeChange(event: { detail: { value: number } }) {
  filters.alarmTypeIndex = Number(event.detail.value);
}
function handleFilterEnabledChange(event: { detail: { value: number } }) {
  filters.enabledIndex = Number(event.detail.value);
}

/* ========================= 弹窗表单 ========================= */

const dialogVisible = ref(false);
const isCreating = ref(true);
const activeSelect = ref<string | null>(null);
const formError = ref("");
const deptList = ref<DeptItem[]>([]);

const form = reactive({
  id: null as number | null,
  ruleKind: "CUSTOM" as "FIXED" | "CUSTOM",
  alarmType: null as string | null,
  ruleName: "",
  alarmLevel: null as string | null,
  fieldName: "" as string,
  minValue: "" as string | number,
  maxValue: "" as string | number,
  thresholdMinutes: "" as string | number,
  thresholdHours: "" as string | number,
  triggerValue: "" as string,
  scopeType: 0,
  deptId: null as number | null,
  enabled: true,
  notifyEnabled: false,
  remark: "",
});

/** 编辑 FIXED 预置规则时表单切换为"参数可改"模式（监测字段/区间隐藏） */
const editingFixed = computed(() => form.ruleKind === "FIXED");

const validationErrors = reactive<Record<string, string>>({});

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

function selectFieldName(option: { fieldName?: string; fieldCnName?: string }) {
  if (!option.fieldName) return;
  form.fieldName = option.fieldName;
  // 回填中文名，作为下次筛选的初始关键字
  fieldKeyword.value = option.fieldCnName || option.fieldName;
  validationErrors.fieldName = "";
  activeSelect.value = null;
}

function selectAlarmLevel(value: string | null) {
  if (value === null) return;
  form.alarmLevel = value;
  validationErrors.alarmLevel = "";
  activeSelect.value = null;
}

function selectScopeType(value: number | null) {
  if (value === null) return;
  form.scopeType = value;
  if (value !== 1) validationErrors.deptId = "";
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

async function loadFieldOptions() {
  try {
    const res = (await getRuleFields()) as ApiLikeResponse<Array<{ fieldName?: string; fieldCnName?: string; unit?: string; description?: string }>>;
    fieldOptions.value = res.data || [];
  } catch {
    fieldOptions.value = [];
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
    ruleKind: "CUSTOM",
    alarmType: null,
    ruleName: "",
    alarmLevel: null,
    fieldName: "",
    minValue: "",
    maxValue: "",
    thresholdMinutes: "",
    thresholdHours: "",
    triggerValue: "",
    scopeType: 0,
    deptId: null,
    enabled: true,
    notifyEnabled: false,
    remark: "",
  });
  fieldKeyword.value = "";
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
    ruleKind: item.ruleKind || "CUSTOM",
    alarmType: item.alarmType || null,
    ruleName: item.ruleName || "",
    alarmLevel: item.alarmLevel || null,
    fieldName: item.fieldName || "",
    minValue: item.minValue ?? "",
    maxValue: item.maxValue ?? "",
    thresholdMinutes: item.thresholdMinutes ?? "",
    thresholdHours: item.thresholdHours ?? "",
    triggerValue: item.triggerValue || "",
    scopeType: item.deptId != null ? 1 : 0,
    deptId: item.deptId ?? null,
    enabled: item.enabled !== false,
    notifyEnabled: item.notifyEnabled === true,
    remark: item.remark || "",
  });
  // 回显字段名（优先中文名）
  const hit = fieldOptions.value.find((o) => o.fieldName === item.fieldName);
  fieldKeyword.value = item.fieldName ? hit?.fieldCnName || item.fieldName : "";
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
  if (form.alarmLevel === null) {
    validationErrors.alarmLevel = localeText("请选择报警级别", "Select alarm level");
  }

  if (editingFixed.value) {
    // FIXED 预置规则：只校验对应类型的判定参数
    if (form.alarmType === "OFFLINE" && (form.thresholdMinutes === "" || Number(form.thresholdMinutes) <= 0)) {
      validationErrors.thresholdMinutes = localeText("请输入离线判定分钟数", "Enter offline minutes");
    }
    if (form.alarmType === "NO_DATA" && (form.thresholdHours === "" || Number(form.thresholdHours) <= 0)) {
      validationErrors.thresholdHours = localeText("请输入超时判定小时数", "Enter no-data hours");
    }
    if (form.alarmType === "LEAK_SUSPECT" && !String(form.triggerValue).trim()) {
      validationErrors.triggerValue = localeText("请输入渗漏触发值集合", "Enter leak trigger values");
    }
  } else {
    // CUSTOM 自定义规则：字段 + 区间至少一项
    if (!form.fieldName) {
      validationErrors.fieldName = localeText("请选择监测字段", "Select monitor field");
    }
    if (form.minValue === "" && form.maxValue === "") {
      validationErrors.minValue = localeText("区间下限与上限至少填写一项", "Min or max value is required");
    }
    if (
      form.minValue !== "" &&
      form.maxValue !== "" &&
      Number(form.maxValue) <= Number(form.minValue)
    ) {
      validationErrors.maxValue = localeText("上限须大于下限", "Upper must be greater than lower");
    }
  }

  if (form.scopeType === 1 && form.deptId === null) {
    validationErrors.deptId = localeText("请选择部门", "Select department");
  }

  return !Object.values(validationErrors).some(Boolean) && !formError.value;
}

function buildSavePayload(): AlarmRulePayload {
  if (editingFixed.value) {
    // FIXED：仅提交可改项（判定参数 + 级别/启停/通知/备注），避免覆盖预置字段
    const payload: AlarmRulePayload = {
      alarmLevel: (form.alarmLevel ?? undefined) as AlarmRulePayload["alarmLevel"],
      notifyEnabled: form.notifyEnabled,
      enabled: form.enabled,
      remark: form.remark.trim(),
    };
    if (form.alarmType === "OFFLINE") payload.thresholdMinutes = Number(form.thresholdMinutes);
    if (form.alarmType === "NO_DATA") payload.thresholdHours = Number(form.thresholdHours);
    if (form.alarmType === "LEAK_SUSPECT") payload.triggerValue = String(form.triggerValue).trim();
    return payload;
  }

  return {
    ruleName: form.ruleName.trim(),
    // 后端新建 CUSTOM 时只强制 ruleKind，不自动设 alarmType；显式携带避免规则漏挂类型（否则按 alarmType=CUSTOM 筛选会漏）
    alarmType: "CUSTOM" as AlarmRulePayload["alarmType"],
    alarmLevel: (form.alarmLevel ?? undefined) as AlarmRulePayload["alarmLevel"],
    fieldName: form.fieldName,
    minValue: form.minValue === "" ? null : Number(form.minValue),
    maxValue: form.maxValue === "" ? null : Number(form.maxValue),
    deptId: form.scopeType === 1 ? form.deptId : null,
    notifyEnabled: form.notifyEnabled,
    enabled: form.enabled,
    remark: form.remark.trim(),
  };
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

/** 行内启停：走后端 PUT /{id}/toggle。 */
async function handleToggleEnabled(item: AlarmRule) {
  try {
    const res = await toggleRule(item.id as number);
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

onMounted(() => {
  loadRules(1);
  loadDeptOptions();
  loadFieldOptions();
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
.select-field {
  position: relative;
}

/* 监测字段：可输入搜索的下拉（输入框留出箭头位） */
.form-input--field {
  padding-right: 30px;
}

.select-field .select-arrow {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%) rotate(45deg);
  pointer-events: none;
}

.select-option--empty {
  color: #94a3b8;
  cursor: default;
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
