<template>
  <view class="alarm-view">
    <view class="toolbar-panel">
      <view class="alarm-toolbar">
        <view class="filter-group filter-group--wide">
          <text class="filter-label">规则名称</text>
          <input v-model="filters.ruleName" class="filter-input" placeholder="请输入规则名称" placeholder-class="input-placeholder" />
        </view>

        <view class="filter-group">
          <text class="filter-label">规则类型</text>
          <picker :range="ruleTypeOptions" range-key="label" :value="filters.ruleTypeIndex" @change="handleFilterTypeChange">
            <view class="filter-select">
              <text>{{ ruleTypeOptions[filters.ruleTypeIndex].label }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">报警级别</text>
          <picker :range="alarmLevelOptions" range-key="label" :value="filters.alarmLevelIndex" @change="handleFilterLevelChange">
            <view class="filter-select">
              <text>{{ alarmLevelOptions[filters.alarmLevelIndex].label }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">启用状态</text>
          <picker :range="enabledOptions" range-key="label" :value="filters.enabledIndex" @change="handleFilterEnabledChange">
            <view class="filter-select">
              <text>{{ enabledOptions[filters.enabledIndex].label }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">生效范围</text>
          <picker :range="scopeOptions" range-key="label" :value="filters.scopeIndex" @change="handleFilterScopeChange">
            <view class="filter-select">
              <text>{{ scopeOptions[filters.scopeIndex].label }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="toolbar-actions">
          <button class="toolbar-button toolbar-button--primary" @click="loadRules(1)">查询</button>
          <button class="toolbar-button" @click="resetFilters">重置</button>
          <button class="toolbar-button" @click="openCreateDialog">新增</button>
        </view>
      </view>
    </view>

    <view class="table-panel">
      <view class="table-head">
        <text>报警策略</text>
        <text class="table-head__meta">共 {{ pagination.total }} 条</text>
      </view>

      <scroll-view class="table-scroll" scroll-x scroll-y>
        <view class="table">
          <view class="table-row table-row--header rule-table-row">
            <view v-for="column in ruleColumns" :key="column.key" class="table-cell table-header-cell">
              <text>{{ column.label }}</text>
            </view>
          </view>

          <view v-if="loading" class="table-state">加载中...</view>
          <view v-else-if="ruleList.length === 0" class="table-state">暂无规则数据</view>

          <view v-for="(item, index) in ruleList" v-else :key="item.id" class="table-row rule-table-row">
            <text class="table-cell col-index">{{ (pagination.current - 1) * pagination.size + index + 1 }}</text>
            <text class="table-cell col-rule-name" :title="item.ruleName">{{ item.ruleName || "-" }}</text>
            <text class="table-cell" :title="getRuleTypeText(item.ruleType)">{{ getRuleTypeText(item.ruleType) }}</text>
            <view class="table-cell">
              <text class="level-pill" :class="getLevelClass(item.alarmLevel)">{{ getLevelText(item.alarmLevel) }}</text>
            </view>
            <text class="table-cell">{{ getThresholdTypeText(item.thresholdType) }}</text>
            <text class="table-cell" :title="getThresholdRangeText(item)">{{ getThresholdRangeText(item) }}</text>
            <text class="table-cell" :title="getSilenceText(item.silenceSeconds)">{{ getSilenceText(item.silenceSeconds) }}</text>
            <text class="table-cell" :title="getScopeText(item)">{{ getScopeText(item) }}</text>
            <view class="table-cell">
              <text class="status-pill" :class="item.enabled ? 'status-pill--open' : 'status-pill--muted'">
                {{ item.enabled ? "启用" : "停用" }}
              </text>
            </view>
            <view class="table-cell col-action">
              <button class="table-action-btn" @click.stop="openEditDialog(item)">编辑</button>
              <button class="table-action-btn table-action-btn--danger" @click.stop="handleDelete(item)">删除</button>
            </view>
          </view>
        </view>
      </scroll-view>

      <view class="pagination-bar">
        <button class="page-btn" :disabled="pagination.current <= 1" @click="handlePageChange(pagination.current - 1)">上一页</button>
        <text class="page-info">第 {{ pagination.current }} / {{ totalPages }} 页</text>
        <button class="page-btn" :disabled="pagination.current >= totalPages" @click="handlePageChange(pagination.current + 1)">下一页</button>
        <text class="page-info">到第</text>
        <input v-model.number="jumpPage" class="page-input" type="number" @keyup.enter="handlePageChange(jumpPage)" />
        <text class="page-info">页</text>
        <button class="page-btn" :disabled="jumpPage === null || jumpPage < 1 || jumpPage > totalPages" @click="handlePageChange(jumpPage)">跳转</button>
      </view>
    </view>

    <view v-if="dialogVisible" class="dialog-mask" @click="closeDialog">
      <view class="dialog-panel dialog-panel--form" @click.stop>
        <view class="dialog-head">
          <view>
            <text class="dialog-title">{{ isCreating ? "新增规则" : "编辑规则" }}</text>
            <text class="dialog-subtitle">维护报警规则</text>
          </view>
          <button class="icon-button" hover-class="icon-button--hover" aria-label="关闭" @click="closeDialog">
            <text class="close-icon"></text>
          </button>
        </view>

        <view v-if="formError" class="error-summary">{{ formError }}</view>

        <view class="dialog-body">
          <view class="alarm-dialog-form">
            <view class="form-field">
              <text class="form-label form-label--required">规则名称</text>
              <input v-model="form.ruleName" class="form-input" :class="{ 'form-control--error': validationErrors.ruleName }" placeholder="请输入规则名称" placeholder-class="input-placeholder" @input="clearError('ruleName')" />
              <text v-if="validationErrors.ruleName" class="form-error">{{ validationErrors.ruleName }}</text>
            </view>

            <view class="form-field">
              <text class="form-label form-label--required">规则类型</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" @click.stop="toggleSelect('ruleType')">
                  <text :class="{ 'select-placeholder': form.ruleType === null }">{{ getRuleTypeText(form.ruleType, true) }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="activeSelect === 'ruleType'" class="select-menu">
                  <view v-for="option in ruleTypeOptions.slice(1)" :key="option.label" class="select-option" :class="{ 'select-option--active': form.ruleType === option.value }" @click.stop="selectRuleType(option.value)">
                    {{ option.label }}
                  </view>
                </view>
              </view>
              <text v-if="validationErrors.ruleType" class="form-error">{{ validationErrors.ruleType }}</text>
            </view>

            <view class="form-field">
              <text class="form-label form-label--required">报警级别</text>
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
              <text class="form-label">阈值模式</text>
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
                <text class="form-label form-label--required">阈值上限</text>
                <input v-model="form.thresholdUpper" class="form-input" :class="{ 'form-control--error': validationErrors.thresholdUpper }" type="digit" placeholder="请输入阈值上限" placeholder-class="input-placeholder" @input="clearError('thresholdUpper')" />
                <text v-if="validationErrors.thresholdUpper" class="form-error">{{ validationErrors.thresholdUpper }}</text>
              </view>
              <view class="form-field">
                <text class="form-label form-label--required">阈值下限</text>
                <input v-model="form.thresholdLower" class="form-input" :class="{ 'form-control--error': validationErrors.thresholdLower }" type="digit" placeholder="请输入阈值下限" placeholder-class="input-placeholder" @input="clearError('thresholdLower')" />
                <text v-if="validationErrors.thresholdLower" class="form-error">{{ validationErrors.thresholdLower }}</text>
              </view>
            </template>

            <template v-else>
              <view class="form-field">
                <text class="form-label form-label--required">统计窗口长度（分钟）</text>
                <input v-model="form.windowMinutes" class="form-input" :class="{ 'form-control--error': validationErrors.windowMinutes }" type="number" placeholder="请输入统计窗口长度" placeholder-class="input-placeholder" @input="clearError('windowMinutes')" />
                <text v-if="validationErrors.windowMinutes" class="form-error">{{ validationErrors.windowMinutes }}</text>
              </view>
              <view class="form-field">
                <text class="form-label form-label--required">倍数 N（均值±Nσ）</text>
                <input v-model="form.sigmaTimes" class="form-input" :class="{ 'form-control--error': validationErrors.sigmaTimes }" type="digit" placeholder="请输入倍数 N" placeholder-class="input-placeholder" @input="clearError('sigmaTimes')" />
                <text v-if="validationErrors.sigmaTimes" class="form-error">{{ validationErrors.sigmaTimes }}</text>
              </view>
            </template>

            <view class="form-field">
              <text class="form-label">持续时长（秒）</text>
              <input v-model="form.durationSeconds" class="form-input" :class="{ 'form-control--error': validationErrors.durationSeconds }" type="number" placeholder="请输入持续时长" placeholder-class="input-placeholder" @input="clearError('durationSeconds')" />
              <text v-if="validationErrors.durationSeconds" class="form-error">{{ validationErrors.durationSeconds }}</text>
            </view>

            <view class="form-field">
              <text class="form-label">静默期（秒）</text>
              <input v-model="form.silenceSeconds" class="form-input" :class="{ 'form-control--error': validationErrors.silenceSeconds }" type="number" placeholder="请输入静默期" placeholder-class="input-placeholder" @input="clearError('silenceSeconds')" />
              <text v-if="validationErrors.silenceSeconds" class="form-error">{{ validationErrors.silenceSeconds }}</text>
            </view>

            <view class="form-field">
              <text class="form-label">生效时间段</text>
              <input v-model="form.effectivePeriod" class="form-input" placeholder="如 22:00-06:00，留空为全天" placeholder-class="input-placeholder" />
            </view>

            <view class="form-field">
              <text class="form-label">生效范围</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" @click.stop="toggleSelect('scopeType')">
                  <text>{{ getScopeTypeText(form.scopeType) }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="activeSelect === 'scopeType'" class="select-menu">
                  <view v-for="option in scopeOptions.slice(1)" :key="option.label" class="select-option" :class="{ 'select-option--active': form.scopeType === option.value }" @click.stop="selectScopeType(option.value)">
                    {{ option.label }}
                  </view>
                </view>
              </view>
            </view>

            <view v-if="form.scopeType === 1" class="form-field">
              <text class="form-label form-label--required">部门</text>
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
              <text class="form-label form-label--required">指定设备</text>
              <view class="device-select-field">
                <button class="toolbar-button device-select-btn" type="button" @click="openDeviceDialog">请选择设备（{{ form.deviceIds.length }}）</button>
                <view v-if="form.deviceIds.length" class="device-tags">
                  <text v-for="tag in deviceTagList" :key="tag" class="device-tag" :title="tag">{{ tag }}</text>
                </view>
              </view>
              <text v-if="validationErrors.deviceIds" class="form-error">{{ validationErrors.deviceIds }}</text>
            </view>

            <view class="form-field">
              <text class="form-label">启用状态</text>
              <view class="switch-field" @click="form.enabled = !form.enabled">
                <view class="switch-track" :class="{ 'switch-track--on': form.enabled }">
                  <view class="switch-thumb"></view>
                </view>
                <text class="switch-label">{{ form.enabled ? "启用" : "停用" }}</text>
              </view>
            </view>

            <view class="form-field form-field--full">
              <text class="form-label">备注</text>
              <input v-model="form.remark" class="form-input" placeholder="请输入备注" placeholder-class="input-placeholder" />
            </view>
          </view>
        </view>

        <view class="dialog-footer">
          <button class="toolbar-button" @click="closeDialog">取消</button>
          <button class="toolbar-button toolbar-button--primary" :loading="saving" @click="handleSave">保存</button>
        </view>
      </view>
    </view>

    <XTreeMultiSelectDialog
      v-model:visible="deviceDialogVisible"
      v-model="deviceDialogValue"
      :tree-data="deviceTree"
      :bound-ids="form.deviceIds"
      :remove-ids="[]"
      title="选择设备"
      subtitle="按部门选择生效设备"
      @confirm="handleDeviceConfirm"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { getRulePage, createRule, updateRule, deleteRule } from "@/services/alarm/strategy";
import type { AlarmRule } from "@/services/alarm/strategy";
import { getDeptList } from "@/services/partition/partition";
import { getDeviceList } from "@/services/device/info";
import { confirmDangerAction } from "@/utils/confirmAction";
import XTreeMultiSelectDialog from "@/pages/device/components/x/dialog/XTreeMultiSelectDialog.vue";
import type { PartitionNode } from "@/pages/device/components/x/tree/XTreeNode.vue";

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

/** 下拉选项（value 为 null 表示不限）。 */
const ruleTypeOptions = [
  { label: "不限", value: null },
  { label: "压力异常", value: 1 },
  { label: "渗漏", value: 2 },
  { label: "爆管", value: 3 },
  { label: "离线", value: 4 },
];
const alarmLevelOptions = [
  { label: "不限", value: null },
  { label: "提示", value: 1 },
  { label: "警告", value: 2 },
  { label: "严重", value: 3 },
];
const enabledOptions = [
  { label: "不限", value: null },
  { label: "启用", value: 1 },
  { label: "停用", value: 0 },
];
const scopeOptions = [
  { label: "不限", value: null },
  { label: "全局", value: 0 },
  { label: "部门", value: 1 },
  { label: "指定设备", value: 2 },
];
const thresholdTypeOptions = [
  { label: "静态", value: 0 },
  { label: "动态", value: 1 },
];

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

const ruleColumns = [
  { key: "index", label: "序号" },
  { key: "ruleName", label: "规则名称" },
  { key: "ruleType", label: "规则类型" },
  { key: "alarmLevel", label: "报警级别" },
  { key: "thresholdType", label: "阈值模式" },
  { key: "thresholdRange", label: "阈值范围" },
  { key: "silenceSeconds", label: "静默期" },
  { key: "scopeType", label: "生效范围" },
  { key: "enabled", label: "状态" },
  { key: "action", label: "操作" },
];

const totalPages = computed(() => Math.max(1, Math.ceil(pagination.total / pagination.size)));

/* ========================= 文案映射 ========================= */

function getRuleTypeText(value?: number | null, placeholder = false) {
  if (value == null) return placeholder ? "请选择规则类型" : "-";
  const map: Record<number, string> = { 1: "压力异常", 2: "渗漏", 3: "爆管", 4: "离线" };
  return map[value] || "-";
}

function getLevelText(value?: number | null, placeholder = false) {
  if (value == null) return placeholder ? "请选择报警级别" : "-";
  const map: Record<number, string> = { 1: "提示", 2: "警告", 3: "严重" };
  return map[value] || "-";
}

function getLevelClass(value?: number | null) {
  if (value === 1) return "level-pill--info";
  if (value === 2) return "level-pill--warning";
  return "level-pill--critical";
}

function getThresholdTypeText(value?: number | null) {
  return value === 1 ? "动态" : "静态";
}

function getThresholdRangeText(item: AlarmRule) {
  if (item.thresholdType === 1) {
    const extra = parseThresholdExtra(item.thresholdExtra);
    const windowText = extra?.windowMinutes ?? "-";
    const sigmaText = extra?.sigmaTimes ?? "-";
    return `窗口 ${windowText}分钟 ±${sigmaText}σ`;
  }
  const upper = item.thresholdUpper ?? "-";
  const lower = item.thresholdLower ?? "-";
  return `${lower} ~ ${upper}`;
}

function parseThresholdExtra(extra: AlarmRule["thresholdExtra"]) {
  if (!extra) return null;
  if (typeof extra === "string") {
    try {
      return JSON.parse(extra) as { windowMinutes?: number; sigmaTimes?: number };
    } catch {
      return null;
    }
  }
  return extra;
}

function getSilenceText(seconds?: number | null) {
  if (seconds == null) return "-";
  if (seconds >= 3600 && seconds % 3600 === 0) return `${seconds / 3600}小时`;
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60}分钟`;
  return `${seconds}秒`;
}

function getScopeTypeText(value?: number | null) {
  const map: Record<number, string> = { 0: "全局", 1: "部门", 2: "指定设备" };
  const key = value ?? 0;
  return map[key] || "全局";
}

function getScopeText(item: AlarmRule) {
  if (item.scopeType === 2) {
    const ids = Array.isArray(item.deviceIds) ? item.deviceIds : [];
    return ids.length ? `设备 ×${ids.length}` : "指定设备";
  }
  if (item.scopeType === 1) {
    const deptName = deptList.value.find((dept) => dept.id === item.deptId)?.deptName;
    return deptName || "部门";
  }
  return "全局";
}

/* ========================= 数据加载 ========================= */

function buildPageParams(page: number) {
  const params: Record<string, unknown> = {
    pageNum: page,
    pageSize: pagination.size,
  };
  if (filters.ruleName.trim()) params.ruleName = filters.ruleName.trim();
  const ruleType = ruleTypeOptions[filters.ruleTypeIndex].value;
  if (ruleType !== null) params.ruleType = ruleType;
  const alarmLevel = alarmLevelOptions[filters.alarmLevelIndex].value;
  if (alarmLevel !== null) params.alarmLevel = alarmLevel;
  const enabled = enabledOptions[filters.enabledIndex].value;
  if (enabled !== null) params.enabled = enabled === 1;
  const scopeType = scopeOptions[filters.scopeIndex].value;
  if (scopeType !== null) params.scopeType = scopeType;
  return params;
}

async function loadRules(page = 1) {
  loading.value = true;
  const params = buildPageParams(page);
  try {
    const res = (await getRulePage(params as never)) as ApiLikeResponse<{ records?: AlarmRule[]; total?: number }>;
    if (res.code !== undefined && res.code !== 200) {
      throw new Error(res.msg || "load failed");
    }
    const pageData = res.data || {};
    ruleList.value = pageData.records || [];
    pagination.total = pageData.total || 0;
    pagination.current = page;
  } catch {

      ruleList.value = [];
      pagination.total = 0;
      pagination.current = page;
      uni.showToast({ title: "加载规则列表失败", icon: "none" });
  } finally {
    loading.value = false;
    jumpPage.value = null;
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
  if (deptId == null) return "请选择部门";
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
  const extra = parseThresholdExtra(item.thresholdExtra);
  Object.assign(form, {
    id: item.id ?? null,
    ruleName: item.ruleName || "",
    ruleType: item.ruleType ?? null,
    alarmLevel: item.alarmLevel ?? null,
    thresholdType: item.thresholdType ?? 0,
    thresholdUpper: item.thresholdUpper ?? "",
    thresholdLower: item.thresholdLower ?? "",
    windowMinutes: extra?.windowMinutes ?? "",
    sigmaTimes: extra?.sigmaTimes ?? "",
    durationSeconds: item.durationSeconds ?? "",
    silenceSeconds: item.silenceSeconds ?? "",
    effectivePeriod: item.effectivePeriod || "",
    scopeType: item.scopeType ?? 0,
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
    validationErrors.ruleName = "规则名称必填";
  }
  if (form.ruleType === null) {
    validationErrors.ruleType = "请选择规则类型（必填）";
  }
  if (form.alarmLevel === null) {
    validationErrors.alarmLevel = "请选择报警级别";
  }

  if (form.thresholdType === 0) {
    if (form.thresholdUpper === "" || form.thresholdUpper === null) {
      validationErrors.thresholdUpper = "请输入阈值上限";
    }
    if (form.thresholdLower === "" || form.thresholdLower === null) {
      validationErrors.thresholdLower = "请输入阈值下限";
    }
    if (
      form.thresholdUpper !== "" &&
      form.thresholdLower !== "" &&
      Number(form.thresholdUpper) <= Number(form.thresholdLower)
    ) {
      validationErrors.thresholdUpper = "上限须大于下限";
    }
  } else if (form.windowMinutes === "" || Number(form.windowMinutes) <= 0) {
    validationErrors.windowMinutes = "请输入统计窗口长度";
  }

  if (form.durationSeconds !== "" && Number(form.durationSeconds) < 0) {
    validationErrors.durationSeconds = "持续时长不能为负数";
  }
  if (form.silenceSeconds !== "" && Number(form.silenceSeconds) < 0) {
    validationErrors.silenceSeconds = "静默期不能为负数";
  }

  if (form.scopeType === 1 && form.deptId === null) {
    validationErrors.deptId = "请选择部门";
  }
  if (form.scopeType === 2 && form.deviceIds.length === 0) {
    validationErrors.deviceIds = "生效范围为指定设备时必须选择设备";
  }

  return !Object.values(validationErrors).some(Boolean) && !formError.value;
}

function buildSavePayload() {
  const payload: Record<string, unknown> = {
    ruleName: form.ruleName.trim(),
    ruleType: form.ruleType,
    alarmLevel: form.alarmLevel,
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
    payload.thresholdExtra = null;
  } else {
    payload.thresholdUpper = null;
    payload.thresholdLower = null;
    payload.thresholdExtra = {
      windowMinutes: Number(form.windowMinutes) || null,
      sigmaTimes: form.sigmaTimes === "" ? null : Number(form.sigmaTimes),
    };
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
      ? ((await createRule(payload as never)) as ApiLikeResponse)
      : ((await updateRule(form.id as number, payload as never)) as ApiLikeResponse);

    if (res.code !== undefined && res.code !== 200) {
      formError.value = res.msg || "保存失败";
      return;
    }

    uni.showToast({ title: "保存成功", icon: "success" });
    closeDialog();
    loadRules(pagination.current);
  } catch (error) {
    formError.value = (error as { msg?: string })?.msg || "保存失败";
  } finally {
    saving.value = false;
  }
}

async function handleDelete(item: AlarmRule) {
  const confirmed = await confirmDangerAction({
    content: `确认删除规则「${item.ruleName || ""}」吗？`,
  });
  if (!confirmed) return;

  try {
    const res = (await deleteRule(item.id as number)) as ApiLikeResponse;
    if (res.code !== undefined && res.code !== 200) {
      throw new Error(res.msg);
    }
    uni.showToast({ title: "删除成功", icon: "success" });
    if (ruleList.value.length === 1 && pagination.current > 1) {
      loadRules(pagination.current - 1);
    } else {
      loadRules(pagination.current);
    }
  } catch (error) {
    uni.showToast({ title: (error as { msg?: string })?.msg || "删除规则失败", icon: "none" });
  }
}

/* ========================= 设备选择 ========================= */

async function loadDeviceTree() {
  try {
    const [deptRes, deviceRes] = (await Promise.all([
      getDeptList() as Promise<ApiLikeResponse<DeptItem[]>>,
      getDeviceList({ pageSize: 999 }) as Promise<ApiLikeResponse<DeviceItem[]>>,
    ])) as [ApiLikeResponse<DeptItem[]>, ApiLikeResponse<DeviceItem[]>];

    const depts = deptRes.data || [];
    const devices = deviceRes.data || [];
    deptList.value = depts;

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
  loadDeviceTree();
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
  min-width: 1080px;
  grid-template-columns:
    54px
    minmax(150px, 1.6fr)
    minmax(88px, 1fr)
    minmax(72px, 0.8fr)
    minmax(64px, 0.7fr)
    minmax(130px, 1.2fr)
    minmax(76px, 0.8fr)
    minmax(96px, 1fr)
    minmax(68px, 0.7fr)
    minmax(128px, 1.2fr);
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
