<template>
  <view class="leak-sidebar" :class="{ 'leak-sidebar--collapsed': collapsed }">
    <view class="leak-sidebar__header">
      <view class="leak-sidebar__title">
        <text class="leak-sidebar__title-main">噪声监测仪</text>
        <text class="leak-sidebar__title-sub">{{ total }} 台设备</text>
      </view>
      <button class="icon-button" type="button" @click="$emit('toggle-collapse')">
        {{ collapsed ? "‹" : "›" }}
      </button>
    </view>

    <template v-if="!collapsed">
      <view class="metric-grid">
        <view
          v-for="metric in metrics"
          :key="metric.key"
          class="metric-card"
          :class="`metric-card--${metric.tone}`"
        >
          <text class="metric-card__value">{{ formatMetric(metric) }}</text>
          <text class="metric-card__label">{{ metric.label }}</text>
        </view>
      </view>

      <view class="filter-grid">
        <label class="filter-field">
          <text>漏点定位</text>
          <picker :range="periodOptions" :value="periodIndex" @change="selectPeriod">
            <view class="select-field">{{ filters.leakLocatePeriod || "请选择" }}</view>
          </picker>
        </label>

        <label class="filter-field">
          <text>设备状态</text>
          <picker :range="statusOptions" range-key="label" :value="statusIndex" @change="selectStatus">
            <view class="select-field">{{ selectedStatusLabel }}</view>
          </picker>
        </label>

        <label class="filter-field">
          <text>当日新增</text>
          <picker :range="yesNoOptions" range-key="label" :value="todayNewIndex" @change="selectTodayNew">
            <view class="select-field">{{ selectedTodayNewLabel }}</view>
          </picker>
        </label>

        <label class="filter-field">
          <text>最新安装</text>
          <picker :range="yesNoOptions" range-key="label" :value="latestInstallIndex" @change="selectLatestInstall">
            <view class="select-field">{{ selectedLatestInstallLabel }}</view>
          </picker>
        </label>

        <label class="filter-field">
          <text>设备型号</text>
          <input v-model="localFilters.deviceModel" class="text-field" placeholder="请输入" />
        </label>

        <label class="filter-field">
          <text>编号</text>
          <input v-model="localFilters.keyword" class="text-field" placeholder="设备编号" confirm-type="search" />
        </label>
      </view>

      <view class="toolbar-row">
        <view class="source-switch">
          <button
            class="source-switch__item"
            :class="{ active: source === 'device-info' }"
            type="button"
            @click="$emit('update-source', 'device-info')"
          >
            信息
          </button>
          <button
            class="source-switch__item"
            :class="{ active: source === 'device-parameter' }"
            type="button"
            @click="$emit('update-source', 'device-parameter')"
          >
            参数
          </button>
        </view>
        <view class="toolbar-row__spacer"></view>
        <button class="action-button action-button--ghost" type="button" @click="$emit('reset')">重置</button>
        <button class="action-button" type="button" :disabled="loading" @click="$emit('search')">{{ loading ? "查询中" : "查询" }}</button>
      </view>

      <view class="device-table">
        <view class="device-table__head">
          <text class="device-table__cell device-table__cell--index">#</text>
          <text class="device-table__cell device-table__cell--number">设备编号</text>
          <text class="device-table__cell">状态</text>
          <text class="device-table__cell">人工分析</text>
          <text class="device-table__cell">蓝鲸分析</text>
        </view>

        <view class="device-table__body" :key="page.current">
          <view
            v-for="(device, index) in devices"
            :key="`${device.source}-${device.id}`"
            class="device-table__row"
            :class="{ active: selectedDeviceNumber === device.deviceNumber }"
            @click="selectDevice(device)"
          >
            <text class="device-table__cell device-table__cell--index">{{ (page.current - 1) * page.size + index + 1 }}</text>
            <view class="device-table__cell device-table__cell--number">
              <text class="device-number-button">{{ device.deviceNumber }}</text>
            </view>
            <text class="device-table__cell">
              <text class="status-pill" :class="`status-pill--${device.status}`">{{ device.statusText }}</text>
            </text>
            <text class="device-table__cell">{{ device.artificialStatus || "--" }}</text>
            <text class="device-table__cell">{{ device.blueWhaleStatus || "--" }}</text>
          </view>
          <view v-if="!devices.length && !loading" class="empty-state">暂无设备数据</view>
          <view v-if="loading" class="loading-state">加载中...</view>
        </view>
      </view>

      <view class="pagination-row">
        <button class="page-button" type="button" :disabled="loading || page.current <= 1" @click="$emit('change-page', page.current - 1)">
          上一页
        </button>
        <text class="page-info">{{ page.current }} / {{ totalPages }}</text>
        <button class="page-button" type="button" :disabled="loading || page.current >= totalPages" @click="$emit('change-page', page.current + 1)">
          下一页
        </button>
      </view>

      <view v-if="errorMessage" class="sidebar-error">{{ errorMessage }}</view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import type { LeakDeviceSource, LeakMonitorDevice, LeakMonitorFilters, LeakMonitorMetric, PageState } from "../types";

const props = defineProps<{
  collapsed: boolean;
  loading: boolean;
  source: LeakDeviceSource;
  metrics: LeakMonitorMetric[];
  filters: LeakMonitorFilters;
  devices: LeakMonitorDevice[];
  page: PageState;
  selectedDeviceNumber?: string;
  errorMessage?: string;
}>();

const emit = defineEmits<{
  (e: "toggle-collapse"): void;
  (e: "search"): void;
  (e: "reset"): void;
  (e: "select-device", device: LeakMonitorDevice): void;
  (e: "change-page", page: number): void;
  (e: "update-source", source: LeakDeviceSource): void;
  (e: "update:filters", filters: LeakMonitorFilters): void;
}>();

const periodOptions = ["1周", "2周", "1月", "3月"];
const statusOptions = [
  { label: "请选择", value: "" },
  { label: "正常", value: "normal" },
  { label: "疑似", value: "suspect" },
  { label: "渗漏", value: "leak" },
];
const yesNoOptions = [
  { label: "请选择", value: "" },
  { label: "是", value: "1" },
  { label: "否", value: "0" },
];
const localFilters = reactive<LeakMonitorFilters>({ ...props.filters });

watch(
  () => props.filters,
  (filters) => Object.assign(localFilters, filters),
  { deep: true },
);

watch(
  localFilters,
  (filters) => emit("update:filters", { ...filters }),
  { deep: true },
);

const total = computed(() => props.page.total || props.devices.length);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / props.page.size)));
const periodIndex = computed(() => Math.max(0, periodOptions.indexOf(localFilters.leakLocatePeriod)));
const statusIndex = computed(() => Math.max(0, statusOptions.findIndex((item) => item.value === localFilters.deviceStatus)));
const todayNewIndex = computed(() => Math.max(0, yesNoOptions.findIndex((item) => item.value === localFilters.todayNew)));
const latestInstallIndex = computed(() => Math.max(0, yesNoOptions.findIndex((item) => item.value === localFilters.latestInstall)));
const selectedStatusLabel = computed(() => statusOptions[statusIndex.value]?.label || "请选择");
const selectedTodayNewLabel = computed(() => yesNoOptions[todayNewIndex.value]?.label || "请选择");
const selectedLatestInstallLabel = computed(() => yesNoOptions[latestInstallIndex.value]?.label || "请选择");
let lastSelectedDevice = "";
let lastSelectedAt = 0;

function selectPeriod(event: { detail: { value: number } }) {
  localFilters.leakLocatePeriod = periodOptions[Number(event.detail.value)] || "";
}

function selectStatus(event: { detail: { value: number } }) {
  localFilters.deviceStatus = statusOptions[Number(event.detail.value)]?.value || "";
}

function selectTodayNew(event: { detail: { value: number } }) {
  localFilters.todayNew = yesNoOptions[Number(event.detail.value)]?.value || "";
}

function selectLatestInstall(event: { detail: { value: number } }) {
  localFilters.latestInstall = yesNoOptions[Number(event.detail.value)]?.value || "";
}

function selectDevice(device: LeakMonitorDevice) {
  const now = Date.now();
  if (lastSelectedDevice === device.deviceNumber && now - lastSelectedAt < 250) {
    return;
  }

  lastSelectedDevice = device.deviceNumber;
  lastSelectedAt = now;
  emit("select-device", device);
}

function formatMetric(metric: LeakMonitorMetric) {
  const value = metric.value === undefined || metric.value === null || metric.value === "" ? "--" : String(metric.value);

  if (!metric.suffix || value === "--") {
    return value;
  }

  return value.endsWith(metric.suffix) ? value : `${value}${metric.suffix}`;
}
</script>

<style scoped lang="scss">
.leak-sidebar {
  position: absolute;
  top: 76px;
  right: 88px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  width: min(560px, calc(100vw - 120px));
  max-height: calc(100% - 96px);
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(201, 216, 232, 0.95);
  border-radius: 6px;
  box-shadow: 0 16px 34px rgba(18, 43, 70, 0.16);
}

.leak-sidebar--collapsed {
  width: 54px;
}

.leak-sidebar__header {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 14px 0 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f6f9fc 100%);
  border-bottom: 1px solid #e6edf4;
}

.leak-sidebar__title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.leak-sidebar__title-main {
  color: #1f2d3d;
  font-size: 18px;
  font-weight: 800;
}

.leak-sidebar__title-sub {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.icon-button,
.action-button,
.source-switch__item,
.page-button {
  margin: 0;
  border: 0;
  border-radius: 4px;
}

.icon-button::after,
.action-button::after,
.source-switch__item::after,
.page-button::after {
  border: 0;
}

.icon-button {
  width: 30px;
  height: 30px;
  padding: 0;
  color: #334155;
  font-size: 22px;
  line-height: 30px;
  background: transparent;
}

.metric-grid {
  flex: none;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  padding: 12px 12px 10px;
}

.metric-card:nth-child(-n + 2) {
  grid-column: span 3;
}

.metric-card:nth-child(n + 3) {
  grid-column: span 1;
}

.metric-card {
  min-width: 0;
  height: 64px;
  padding: 8px 10px;
  color: #31506d;
  background: #f6fbff;
  border: 1px solid #dbe8f3;
  border-radius: 6px;
}

.metric-card--success { background: #edf9f2; border-color: #bfe9d1; color: #147a49; }
.metric-card--primary { background: #eff6ff; border-color: #cfe3ff; color: #1d66c2; }
.metric-card--warning { background: #fff7e8; border-color: #ffe0a3; color: #bd6b00; }
.metric-card--danger { background: #fff1f1; border-color: #ffcaca; color: #c72222; }
.metric-card--muted { background: #f4f5f7; border-color: #dde3ea; color: #64748b; }

.metric-card__value {
  display: block;
  overflow: hidden;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-card__label {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  font-weight: 800;
}

.filter-grid {
  flex: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
  padding: 0 12px 10px;
  border-bottom: 1px solid #edf2f7;
}

.filter-field {
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  color: #26384d;
  font-size: 14px;
  font-weight: 700;
}

.select-field,
.text-field {
  box-sizing: border-box;
  width: 100%;
  height: 32px;
  padding: 0 10px;
  color: #31435a;
  font-size: 14px;
  font-weight: 500;
  line-height: 32px;
  background: #fff;
  border: 1px solid #ccd8e4;
  border-radius: 4px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.select-field:active,
.text-field:focus {
  background: #fbfdff;
  border-color: #38a7df;
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.12);
}

.toolbar-row {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
}

.toolbar-row__spacer {
  flex: 1;
  min-width: 8px;
}

.source-switch {
  display: inline-flex;
  overflow: hidden;
  border: 1px solid #c9d8e8;
  border-radius: 4px;
}

.source-switch__item {
  width: 58px;
  height: 32px;
  color: #496277;
  font-size: 13px;
  line-height: 32px;
  background: #fff;
}

.source-switch__item.active {
  color: #fff;
  background: #0ea5e9;
}

.action-button {
  min-width: 68px;
  height: 32px;
  padding: 0 14px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  line-height: 32px;
  background: #0ea5e9;
  box-shadow: 0 6px 14px rgba(14, 165, 233, 0.2);
}

.action-button[disabled] {
  opacity: 0.72;
  box-shadow: none;
}

.action-button--ghost {
  color: #31506d;
  background: #eef5fb;
  box-shadow: none;
}

.device-table {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 180px;
  margin: 0 12px;
  overflow: hidden;
  border: 1px solid #d8e5ef;
  border-radius: 4px;
}

.device-table__head,
.device-table__row {
  display: grid;
  grid-template-columns: 46px 132px 88px 104px 112px;
  min-width: 482px;
}

.device-table__head {
  height: 38px;
  color: #24364d;
  font-size: 14px;
  font-weight: 900;
  line-height: 38px;
  background: #f4f7fa;
  border-bottom: 1px solid #d8e5ef;
}

.device-table__body {
  position: relative;
  flex: 1;
  height: auto;
  min-height: 0;
  overflow: auto;
  background: #fff;
}

.loading-state {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.88);
}

.device-table__row {
  min-height: 40px;
  color: #2f4054;
  font-size: 14px;
  line-height: 40px;
  border-bottom: 1px solid #edf2f7;
  transition: background 0.12s ease;
  cursor: pointer;
}

.device-table__row.active,
.device-table__row:hover,
.device-table__row:active {
  background: #eef7ff;
}

.device-table__cell {
  min-width: 0;
  padding: 0 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.device-table__cell--index {
  color: #64748b;
  text-align: center;
}

.device-table__cell--number {
  font-weight: 700;
}

.device-number-button {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  max-width: 100%;
  height: 28px;
  margin: 0;
  padding: 0;
  color: #075985;
  font-size: 14px;
  font-weight: 800;
  line-height: 28px;
  background: transparent;
  border: 0;
  border-radius: 0;
  text-decoration: underline;
  cursor: pointer;
  text-underline-offset: 3px;
}

.device-number-button:hover,
.device-number-button:active {
  color: #0284c7;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  height: 24px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 900;
  line-height: 24px;
}

.status-pill--normal { color: #047857; background: #dff8ea; }
.status-pill--suspect { color: #b45309; background: #fff1cc; }
.status-pill--leak { color: #b91c1c; background: #ffe2e2; }
.status-pill--unknown { color: #64748b; background: #eef2f7; }

.empty-state {
  height: 120px;
  color: #7c8da1;
  font-size: 14px;
  line-height: 120px;
  text-align: center;
}

.pagination-row {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  height: 48px;
  padding: 0 12px;
}

.page-button {
  width: 72px;
  height: 30px;
  color: #31506d;
  font-size: 13px;
  line-height: 30px;
  background: #f6fbff;
  border: 1px solid #cbdced;
}

.page-info {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.sidebar-error {
  flex: none;
  margin: 0 14px 12px;
  padding: 8px 10px;
  color: #b42318;
  font-size: 13px;
  background: #fff1ee;
  border: 1px solid #ffd3cb;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .leak-sidebar {
    left: 10px;
    right: 10px;
    top: auto;
    bottom: 10px;
    width: auto;
    max-height: 78%;
  }

  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
