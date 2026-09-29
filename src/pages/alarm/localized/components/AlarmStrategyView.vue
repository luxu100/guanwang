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
                <button class="table-action-btn" :disabled="togglingId != null" @click.stop="handleToggleEnabled(item)">{{ item.enabled ? localeText("停用", "Disable") : localeText("启用", "Enable") }}</button>
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
            <text class="dialog-subtitle">{{ isCreating ? localeText("新建自定义规则", "Create custom rule") : localeText("维护报警规则", "Manage Alarm Rules") }}</text>
          </view>
          <button class="icon-button" hover-class="icon-button--hover" :aria-label="localeText('关闭', 'Close')" @click="closeDialog">
            <text class="close-icon"></text>
          </button>
        </view>

        <view v-if="formError" class="error-summary">{{ formError }}</view>

        <view class="dialog-body">
          <view class="alarm-dialog-form">
            <text class="form-group-title">{{ localeText("基本信息", "Basic Info") }}</text>
            <view class="form-field">
              <text class="form-label" :class="{ 'form-label--required': !editingFixed }">{{ localeText("规则名称", "Rule Name") }}</text>
              <!-- FIXED 预置规则名称只读（保存不提交该字段，可编辑会造成"假保存"） -->
              <input v-if="!editingFixed" v-model="form.ruleName" class="form-input" :class="{ 'form-control--error': validationErrors.ruleName }" :placeholder="localeText('请输入规则名称', 'Enter rule name')" placeholder-class="input-placeholder" @input="clearError('ruleName')" />
              <view v-else class="form-input form-input--readonly">{{ form.ruleName }}</view>
              <text v-if="validationErrors.ruleName" class="form-error">{{ validationErrors.ruleName }}</text>
            </view>

            <text class="form-group-title">{{ localeText("判定条件", "Trigger Condition") }}</text>
            <template v-if="!editingFixed">
              <view class="form-field form-field--full">
                <text class="form-label form-label--required">{{ localeText("监测字段", "Monitored Field") }}</text>
                <view class="select-field">
                  <input
                    v-model="fieldKeyword"
                    class="form-input form-input--field"
                    :class="{ 'form-control--error': validationErrors.fieldName }"
                    type="text"
                    :placeholder="localeText('输入关键字筛选字段', 'Type to filter fields')"
                    placeholder-class="input-placeholder"
                    @focus="onFieldFocus"
                    @input="onFieldKeywordInput"
                    @click.stop="toggleFieldMenu"
                  />
                  <text class="select-arrow"></text>
                  <view v-if="activeSelect === 'fieldName'" class="select-menu select-menu--field">
                    <view v-if="fieldLoadState === 'loading'" class="select-option select-option--empty">
                      {{ localeText("字段加载中...", "Loading fields...") }}
                    </view>
                    <view v-else-if="fieldLoadState === 'failed'" class="select-option select-option--empty" @click.stop="loadFieldOptions">
                      <text class="field-retry">{{ localeText("字段加载失败，点击重试", "Failed to load fields, tap to retry") }}</text>
                    </view>
                    <template v-else>
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
                    </template>
                  </view>
                </view>
                <text v-if="validationErrors.fieldName" class="form-error">{{ validationErrors.fieldName }}</text>
              </view>
            </template>

            <template v-else>
              <view v-if="form.alarmType === 'OFFLINE'" class="form-field">
                <text class="form-label form-label--required">{{ localeText("离线判定（分钟）", "Offline Threshold (min)") }}</text>
                <input v-model="form.thresholdMinutes" class="form-input" :class="{ 'form-control--error': validationErrors.thresholdMinutes }" type="number" :placeholder="localeText('设备离线超过该分钟数触发', 'Trigger when offline longer than this threshold')" placeholder-class="input-placeholder" @input="clearError('thresholdMinutes')" />
                <text v-if="validationErrors.thresholdMinutes" class="form-error">{{ validationErrors.thresholdMinutes }}</text>
              </view>
              <view v-if="form.alarmType === 'NO_DATA'" class="form-field">
                <text class="form-label form-label--required">{{ localeText("超时判定（小时）", "No-data Threshold (hours)") }}</text>
                <input v-model="form.thresholdHours" class="form-input" :class="{ 'form-control--error': validationErrors.thresholdHours }" type="number" :placeholder="localeText('无上报超过该小时数触发', 'Trigger when no data is reported for longer than this threshold')" placeholder-class="input-placeholder" @input="clearError('thresholdHours')" />
                <text v-if="validationErrors.thresholdHours" class="form-error">{{ validationErrors.thresholdHours }}</text>
              </view>
              <view v-if="form.alarmType === 'LEAK_SUSPECT'" class="form-field">
                <text class="form-label form-label--required">{{ localeText("渗漏触发值集合", "Leak Trigger Values") }}</text>
                <input v-model="form.triggerValue" class="form-input" :class="{ 'form-control--error': validationErrors.triggerValue }" type="text" :placeholder="localeText('命中集合即触发，如 2,0', 'Trigger when status matches any listed value, e.g. 2, 0')" placeholder-class="input-placeholder" @input="clearError('triggerValue')" />
                <text v-if="validationErrors.triggerValue" class="form-error">{{ validationErrors.triggerValue }}</text>
              </view>
            </template>

            <text class="form-group-title">{{ localeText("生效设置", "Effect Settings") }}</text>
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
              <view class="form-hint">{{ localeText("实测值落在区间外触发；只填下限=低于触发，只填上限=高于触发", "Trigger when the value falls outside the range; min-only triggers below, max-only above") }}</view>
            </template>

            <template v-if="!editingFixed">
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
                <text v-if="validationErrors.scopeType" class="form-error">{{ validationErrors.scopeType }}</text>
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
            </template>
            <!-- FIXED：生效范围只读（保存不提交该字段，避免"假保存"） -->
            <template v-else>
              <view class="form-field">
                <text class="form-label">{{ localeText("生效范围", "Scope") }}</text>
                <view class="form-input form-input--readonly">{{ getScopeTypeText(form.scopeType) }}</view>
              </view>
            </template>

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
              <text class="form-label">{{ localeText("邮件通知", "Email Notify") }}</text>
              <view class="switch-field" @click="form.notifyEnabled = !form.notifyEnabled">
                <view class="switch-track" :class="{ 'switch-track--on': form.notifyEnabled }">
                  <view class="switch-thumb"></view>
                </view>
                <text class="switch-label">{{ form.notifyEnabled ? localeText("开启", "On") : localeText("关闭", "Off") }}</text>
              </view>
              <view class="form-hint">{{ localeText("开启后新报警按系统配置发送邮件（默认 WARNING 及以上级别，收件人由系统统一配置）", "When on, new alarms send emails per system config (WARNING+ by default, recipients configured system-wide)") }}</view>
            </view>

            <view class="form-field form-field--full">
              <text class="form-label">{{ localeText("备注", "Remark") }}</text>
              <textarea v-model="form.remark" class="form-textarea" :placeholder="localeText('请输入备注', 'Enter remark')" placeholder-class="input-placeholder" :maxlength="255" />
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
import {
  ALARM_LEVEL_MAP as ALARM_LEVEL_MAP_LOCAL,
  ALARM_TYPE_MAP as ALARM_TYPE_MAP_LOCAL,
  RULE_KIND_MAP as RULE_KIND_MAP_LOCAL,
  alarmTypeOptions as publicAlarmTypeOptions,
  alarmLevelOptions as publicAlarmLevelOptions,
  mapEnumText,
} from "@/pages/alarm/components/alarmLocale";
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

/** 报警类型筛选选项（后端字符串枚举；首项"不限"= 不过滤）。
 * "自定义规则"筛选用 ruleKind=CUSTOM 而非 alarmType=CUSTOM：历史规则可能 alarmType 为空，
 * 按 alarmType 筛会漏掉它们；ruleKind 才是稳定的自定义标识。 */
const ALARM_TYPE_FILTERS = computed(() => [
  { label: localeText("不限", "All"), value: null as string | null },
  ...publicAlarmTypeOptions(localeText).slice(1).map((o, i) => (i === 2 ? { ...o, value: "kind:CUSTOM" } : o)),
]);
const alarmTypeFilterOptions = ALARM_TYPE_FILTERS;

/** 级别选项（公共映射；表单与筛选共用）。 */
const alarmLevelOptions = computed(() => publicAlarmLevelOptions(localeText));
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
    item.ruleKind === "CUSTOM" && !item.alarmType
      ? localeText("自定义规则", "Custom Rule")
      : getRuleTypeText(item.alarmType, item.alarmTypeName),
  alarmLevel: () => "",
  thresholdDesc: (item) => getThresholdDescText(item),
  scope: (item) => getScopeText(item),
  enabledText: (item) => (item.enabled ? localeText("启用", "Enabled") : localeText("停用", "Disabled")),
  // null（老数据/接口未返回）显示 "-"，不臆测为开或关
  notifyText: (item) =>
    item.notifyEnabled == null ? "-" : item.notifyEnabled ? localeText("开启", "On") : localeText("关闭", "Off"),
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

function getRuleTypeText(value?: string | null, fallbackName?: string | null, placeholder = false) {
  if (value == null) return placeholder ? localeText("请选择报警类型", "Select alarm type") : fallbackName || "-";
  return mapEnumText(ALARM_TYPE_MAP_LOCAL, value, localeText, fallbackName);
}

function getRuleKindText(value?: string | null) {
  return mapEnumText(RULE_KIND_MAP_LOCAL, value, localeText);
}

function getLevelText(value?: string | null, placeholder = false) {
  if (value == null) return placeholder ? localeText("请选择报警级别", "Select alarm level") : "-";
  return mapEnumText(ALARM_LEVEL_MAP_LOCAL, value, localeText);
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

/** 可搜索下拉：按关键字过滤（匹配中文名/英文名，不区分大小写）。
 * 关键字变化即取消已选字段——防止"改了文字没重选、保存仍提交旧字段"的静默不一致。 */
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

function onFieldKeywordInput() {
  const hit = fieldOptions.value.find((option) => option.fieldName === form.fieldName);
  const echo = hit?.fieldCnName || form.fieldName;
  if (form.fieldName && fieldKeyword.value.trim() !== (echo || "").trim()) {
    form.fieldName = "";
  }
  activeSelect.value = "fieldName";
}

/** 点输入框：已展开则收起，未展开则展开（再点一下可收起，不必点其他区域）。
 * 收起后紧随的 focus 事件不应重新展开，用时间戳抑制。 */
let fieldMenuCollapsedAt = 0;

function toggleFieldMenu() {
  if (activeSelect.value === "fieldName") {
    activeSelect.value = null;
    fieldMenuCollapsedAt = Date.now();
  } else {
    activeSelect.value = "fieldName";
  }
}

function onFieldFocus() {
  // 刚通过点击收起（300ms 内），本次 focus 不重新展开
  if (Date.now() - fieldMenuCollapsedAt < 300) return;
  onFieldKeywordInput();
}

/** 字段下拉加载状态：idle/loading/failed/ready（failed 时显示重试，避免与"无匹配"混淆） */
const fieldLoadState = ref<"idle" | "loading" | "failed" | "ready">("idle");

async function loadFieldOptions() {
  fieldLoadState.value = "loading";
  try {
    const res = (await getRuleFields()) as ApiLikeResponse<Array<{ fieldName?: string; fieldCnName?: string; unit?: string; description?: string }>>;
    // 业务层失败（如登录失效 code=401）也进入错误态，不能只看 HTTP 成功
    if (res.code !== undefined && res.code !== 200) {
      fieldOptions.value = [];
      fieldLoadState.value = "failed";
      return;
    }
    fieldOptions.value = res.data || [];
    fieldLoadState.value = "ready";
  } catch {
    fieldOptions.value = [];
    fieldLoadState.value = "failed";
  }
}

function getFieldUnitPlaceholder() {
  const hit = fieldOptions.value.find((option) => option.fieldName === form.fieldName);
  const unit = hit?.unit ? `（${hit.unit}）` : "";
  return localeText(`留空表示不限制${unit}`, `Leave blank for no limit${unit}`);
}

/* ========================= 数据加载 ========================= */

function buildPageParams(page: number): AlarmRulePageQuery {
  const params: AlarmRulePageQuery = {
    pageNum: page,
    pageSize: pagination.size,
  };
  if (filters.ruleName.trim()) params.ruleName = filters.ruleName.trim();
  const alarmType = alarmTypeFilterOptions.value[filters.alarmTypeIndex].value;
  if (alarmType !== null) {
    // "自定义规则"走 ruleKind 筛选，覆盖 alarmType 为空的历史规则；其余类型按 alarmType
    if (alarmType === "kind:CUSTOM") {
      params.ruleKind = "CUSTOM";
    } else {
      params.alarmType = alarmType as AlarmRulePageQuery["alarmType"];
    }
  }
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

/** 编辑 CUSTOM 规则时的原始值基线（null 清空语义未获后端支持，用于拦截清空类修改） */
const editBaseline = ref<{ deptId: number | null; minValue: number | string | null; maxValue: number | string | null } | null>(null);

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
  if (value === 1) validationErrors.scopeType = ""; // 改回部门即解除"改为全局"拦截
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

function openCreateDialog() {
  isCreating.value = true;
  editBaseline.value = null; // 新建无基线：null 即"不设置"，合法
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
  // 记录编辑前基线：用于拦截后端尚不支持的"清空"修改（null 不会真正清除数据库原值）
  editBaseline.value = {
    deptId: item.deptId ?? null,
    minValue: item.minValue ?? null,
    maxValue: item.maxValue ?? null,
  };
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
    const minutesNum = Number(form.thresholdMinutes);
    if (form.alarmType === "OFFLINE" && (!Number.isInteger(minutesNum) || minutesNum <= 0)) {
      validationErrors.thresholdMinutes = localeText("请输入正整数分钟数", "Enter a positive integer in minutes");
    }
    const hoursNum = Number(form.thresholdHours);
    if (form.alarmType === "NO_DATA" && (!Number.isInteger(hoursNum) || hoursNum <= 0)) {
      validationErrors.thresholdHours = localeText("请输入正整数小时数", "Enter a positive integer in hours");
    }
    // 触发值集合：逗号分隔的合法整数列表（如 "2,0"）
    if (form.alarmType === "LEAK_SUSPECT") {
      const raw = String(form.triggerValue).trim();
      if (!raw) {
        validationErrors.triggerValue = localeText("请输入渗漏触发值集合", "Enter leak trigger values");
      } else if (!/^-?\d+(\s*,\s*-?\d+)*$/.test(raw)) {
        validationErrors.triggerValue = localeText("触发值须为逗号分隔的整数，如 2,0", "Enter comma-separated integers, e.g. 2,0");
      }
    }
  } else {
    // CUSTOM 自定义规则：字段 + 区间至少一项
    if (!form.fieldName) {
      validationErrors.fieldName = localeText("请选择监测字段", "Select monitored field");
    }
    if (form.minValue === "" && form.maxValue === "") {
      validationErrors.minValue = localeText("区间下限与上限至少填写一项", "Enter a minimum or maximum value");
    }
    // 上下限必须为有限数值（防止 "abc" 等 Number() 结果为 NaN 的输入提交后端）
    if (form.minValue !== "" && !Number.isFinite(Number(form.minValue))) {
      validationErrors.minValue = localeText("下限须为有效数字", "Min value must be a valid number");
    }
    if (form.maxValue !== "" && !Number.isFinite(Number(form.maxValue))) {
      validationErrors.maxValue = localeText("上限须为有效数字", "Max value must be a valid number");
    }
    if (
      form.minValue !== "" &&
      form.maxValue !== "" &&
      Number(form.maxValue) <= Number(form.minValue)
    ) {
      validationErrors.maxValue = localeText("上限须大于下限", "Max value must be greater than min value");
    }
    // 编辑已有规则时拦截"清空"类修改：后端 updateById 会跳过 null 字段，
    // 提交 null 并不会真正清除数据库原值，会造成"保存成功但没改"的假象
    if (!isCreating.value && editBaseline.value) {
      const b = editBaseline.value;
      if (b.minValue != null && form.minValue === "") {
        validationErrors.minValue = localeText("后端暂不支持清空下限，可修改数值或删除规则后重建", "Clearing min value is not supported yet; edit the value or recreate the rule");
      }
      if (b.maxValue != null && form.maxValue === "") {
        validationErrors.maxValue = localeText("后端暂不支持清空上限，可修改数值或删除规则后重建", "Clearing max value is not supported yet; edit the value or recreate the rule");
      }
      if (b.deptId != null && form.scopeType !== 1) {
        // 挂在 scopeType 上：生效范围字段始终可见；deptId 错误所在区域在全局模式下是隐藏的
        validationErrors.scopeType = localeText("暂不支持将已有部门规则改为全局，请保留原范围", "Switching a department-scoped rule to global is not supported yet; keep the original scope");
      }
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
/** 行内启停进行中标记（防连点重复请求：刚停用又被启用） */
const togglingId = ref<number | null>(null);

async function handleToggleEnabled(item: AlarmRule) {
  if (togglingId.value != null) return;
  togglingId.value = item.id ?? null;
  try {
    const res = await toggleRule(item.id as number);
    if (res.code !== undefined && res.code !== 200) {
      throw new Error(res.msg);
    }
    // 等列表刷新完成再解锁：期间按钮保持禁用，避免行数据未更新时再次点击
    await loadRules(pagination.current);
  } catch (error) {
    uni.showToast({ title: (error as { msg?: string })?.msg || localeText("切换启停失败", "Toggle failed"), icon: "none" });
  } finally {
    togglingId.value = null;
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
  min-width: 1160px;
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

.form-group-title {
  grid-column: 1 / -1;
  margin-top: 4px;
  padding-left: 10px;
  border-left: 3px solid #3b82f6;
  color: #183755;
  font-size: 14px;
  font-weight: 900;
  line-height: 1.3;
}

.form-hint {
  color: #8191a2;
  font-size: 12px;
  line-height: 1.5;
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

.form-textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 64px;
  padding: 8px 12px;
  color: #172033;
  font-size: 14px;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
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

.field-retry {
  color: #0d82ee;
  text-decoration: underline;
}

.form-input--readonly {
  display: flex;
  align-items: center;
  color: #52677b;
  background: #f1f5f9;
  border-color: #e2e8f0;
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
