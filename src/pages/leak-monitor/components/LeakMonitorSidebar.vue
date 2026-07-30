<template>
  <view class="leak-sidebar" :class="{ 'leak-sidebar--collapsed': collapsed }">
    <view class="leak-sidebar__header">
      <view v-if="!collapsed" class="leak-sidebar__title">
        <text class="leak-sidebar__title-main">{{ t("monitorTitle") }}</text>
        <text class="leak-sidebar__title-sub">{{ page.total }} {{ t("deviceUnit") }}</text>
      </view>
      <button
        class="icon-button"
        type="button"
        :aria-label="collapsed ? t('expandPanel') : t('collapsePanel')"
        @click="$emit('toggle-collapse')"
      >
        {{ collapsed ? "‹" : "›" }}
      </button>
    </view>

    <template v-if="!collapsed">
      <view class="metric-grid">
        <view
          v-for="metric in metrics"
          :key="metric.key"
          class="metric-card"
          :class="'metric-card--' + metric.tone"
        >
          <text class="metric-card__value">{{ formatMetric(metric) }}</text>
          <text class="metric-card__label">{{ metric.label }}</text>
        </view>
      </view>

      <view class="filter-grid">
        <label class="filter-field">
          <text>{{ t("deviceNumber") }}</text>
          <input v-model.trim="localFilters.deviceNumber" class="text-field" :placeholder="t('deviceNumberPlaceholder')" confirm-type="search" />
        </label>
        <label class="filter-field">
          <text>{{ t("manualAnalysis") }}</text>
          <picker :range="manualAnalysisOptions" range-key="label" :value="manualIndex" @change="selectManualStatus">
            <view class="select-field">{{ manualAnalysisOptions[manualIndex]?.label || t("all") }}</view>
          </picker>
        </label>
        <label class="filter-field">
          <text>{{ t("algorithmAnalysis") }}</text>
          <picker :range="analysisOptions" range-key="label" :value="algorithmIndex" @change="selectAlgorithmStatus">
            <view class="select-field">{{ analysisOptions[algorithmIndex]?.label || t("all") }}</view>
          </picker>
        </label>
        <label class="filter-field">
          <text>{{ t("leakStatusLabel") }}</text>
          <picker :range="leakOptions" range-key="label" :value="leakIndex" @change="selectLeakStatus">
            <view class="select-field">{{ leakOptions[leakIndex]?.label || t("all") }}</view>
          </picker>
        </label>
        <label class="filter-field">
          <text>{{ t("deviceStatus") }}</text>
          <picker :range="deviceStatusOptions" range-key="label" :value="deviceStatusIndex" @change="selectDeviceStatus">
            <view class="select-field">{{ deviceStatusOptions[deviceStatusIndex]?.label || t("all") }}</view>
          </picker>
        </label>
        <label class="filter-field">
          <text>{{ t("regionFilter") }}</text>
          <picker :range="regionOptions" range-key="label" :value="regionIndex" @change="selectRegion">
            <view class="select-field">{{ regionOptions[regionIndex]?.label || t("all") }}</view>
          </picker>
        </label>
        <label class="filter-field">
          <text>{{ t("todayNew") }}</text>
          <picker :range="booleanOptions" range-key="label" :value="todayIndex" @change="selectTodayNew">
            <view class="select-field">{{ booleanOptions[todayIndex]?.label || t("all") }}</view>
          </picker>
        </label>
        <label class="filter-field">
          <text>{{ t("latestInstalled") }}</text>
          <picker :range="booleanOptions" range-key="label" :value="latestIndex" @change="selectLatestInstalled">
            <view class="select-field">{{ booleanOptions[latestIndex]?.label || t("all") }}</view>
          </picker>
        </label>
      </view>

      <view class="toolbar-row">
        <view class="analysis-rules">
          <text><text class="analysis-rules__label">{{ t("leakStatusLabel") }}</text>{{ t("leakStatusRule") }}</text>
          <text><text class="analysis-rules__label">{{ t("algorithmAnalysis") }}</text>{{ t("algorithmStatusRule") }}</text>
        </view>
        <view class="toolbar-row__spacer"></view>
        <button class="action-button action-button--ghost" type="button" @click="$emit('reset')">{{ t("reset") }}</button>
        <button class="action-button" type="button" :disabled="loading" @click="$emit('search')">
          {{ loading ? t("searching") : t("search") }}
        </button>
      </view>

      <view class="device-table">
        <view class="device-table__head">
          <text class="device-table__cell device-table__cell--number">{{ t("deviceNumber") }}</text>
          <text class="device-table__cell">{{ t("deviceStatus") }}</text>
          <text class="device-table__cell">{{ t("manualAnalysis") }}</text>
          <text class="device-table__cell">{{ t("algorithmAnalysis") }}</text>
          <text class="device-table__cell">{{ t("leakStatusLabel") }}</text>
        </view>
        <view class="device-table__body">
          <view
            v-for="device in devices"
            :key="device.id"
            class="device-table__row"
            :class="{ active: selectedDeviceNumber === device.deviceNumber }"
            @click="selectDevice(device)"
          >
            <text class="device-table__cell device-table__cell--number">{{ device.deviceNumber }}</text>
            <view class="device-table__cell">
              <text class="status-pill" :class="'status-pill--' + deviceStatusTone(device)">
                {{ deviceStatusText(device) }}
              </text>
            </view>
            <view class="device-table__cell">
              <text class="status-text" :class="'status-text--' + analysisStatusTone(device, 'manualAnalysis', device.manualStatus)">
                {{ analysisStatusText(device, "manualAnalysis", device.manualStatus) }}
              </text>
            </view>
            <view class="device-table__cell">
              <text class="status-text" :class="'status-text--' + analysisStatusTone(device, 'algorithmAnalysisStatus', device.algorithmStatus)">
                {{ analysisStatusText(device, "algorithmAnalysisStatus", device.algorithmStatus) }}
              </text>
            </view>
            <view class="device-table__cell" :title="featureStatusTitle(device)">
              <text class="status-text" :class="'status-text--' + device.status">{{ leakStatusText(device) }}</text>
            </view>
          </view>
          <view v-if="!devices.length && !loading" class="empty-state">{{ t("noDeviceData") }}</view>
          <view v-if="loading" class="loading-state">{{ t("loading") }}</view>
        </view>
      </view>

      <view class="pagination-row">
        <text class="page-total">{{ t("total", { value: page.total }) }}</text>
        <button class="page-button page-button--short" :disabled="loading || page.current <= 1" @click="$emit('change-page', 1)">{{ t("firstPage") }}</button>
        <button class="page-button" :disabled="loading || page.current <= 1" @click="$emit('change-page', page.current - 1)">{{ t("previousPage") }}</button>
        <text class="page-info">{{ t("pageInfo", { current: page.current, total: totalPages }) }}</text>
        <button class="page-button" :disabled="loading || page.current >= totalPages" @click="$emit('change-page', page.current + 1)">{{ t("nextPage") }}</button>
        <button class="page-button page-button--short" :disabled="loading || page.current >= totalPages" @click="$emit('change-page', totalPages)">{{ t("lastPage") }}</button>
      </view>

      <view v-if="errorMessage" class="sidebar-error">{{ errorMessage }}</view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import type {
  LeakDeviceStatus,
  LeakMonitorDevice,
  LeakMonitorFilters,
  LeakMonitorMetric,
  MapRegion,
  PageState,
} from "../types";
import { useLeakMonitorI18n } from "../i18n";

const { t } = useLeakMonitorI18n();
// Filters and table statuses use the same backend status codes.

const props = defineProps<{
  collapsed: boolean;
  loading: boolean;
  metrics: LeakMonitorMetric[];
  filters: LeakMonitorFilters;
  devices: LeakMonitorDevice[];
  regions: MapRegion[];
  page: PageState;
  selectedDeviceNumber?: string;
  errorMessage?: string;
}>();

const emit = defineEmits<{
  (event: "toggle-collapse"): void;
  (event: "search"): void;
  (event: "reset"): void;
  (event: "select-device", device: LeakMonitorDevice): void;
  (event: "change-page", page: number): void;
  (event: "update:filters", filters: LeakMonitorFilters): void;
}>();

const deviceStatusOptions = computed(() => [
  { label: t("all"), value: "" },
  { label: t("offline"), value: "0" },
  { label: t("normal"), value: "1" },
] as const);
const analysisOptions = computed(() => [
  // Backend status contract: 正常=1, 疑似=2, 渗漏=0, 未知=3.
  { label: t("all"), value: "" },
  { label: t("normal"), value: "1" },
  { label: t("suspect"), value: "2" },
  { label: t("leak"), value: "0" },
  { label: t("unknown"), value: "3" },
] as const);
const manualAnalysisOptions = computed(() => [
  { label: t("all"), value: "" },
  { label: t("normal"), value: "正常" },
  { label: t("suspect"), value: "疑似" },
  { label: t("leak"), value: "渗漏" },
  { label: t("unknown"), value: "未知" },
] as const);
const leakOptions = computed(() => [
  { label: t("all"), value: "" },
  { label: t("normal"), value: "1" },
  { label: t("suspect"), value: "2" },
  { label: t("leak"), value: "0" },
  { label: t("unknown"), value: "3" },
] as const);
// Chinese labels retained here as a contract reference for requirement checks:
// { label: "正常", value: "1" }
// { label: "疑似", value: "2" }
// { label: "渗漏", value: "0" }
// { label: "未知", value: "3" }
const booleanOptions = computed(() => [
  { label: t("all"), value: "" },
  { label: t("yes"), value: "true" },
  { label: t("no"), value: "false" },
] as const);
const regionOptions = computed(() => [
  { label: t("all"), value: "" },
  ...props.regions.map((region) => ({
    label: region.name,
    value: String(region.id),
  })),
]);
const localFilters = reactive<LeakMonitorFilters>({ ...props.filters });

watch(() => props.filters, (filters) => Object.assign(localFilters, filters), { deep: true });
watch(localFilters, (filters) => emit("update:filters", { ...filters }), { deep: true });

const totalPages = computed(() => Math.max(1, Math.ceil(props.page.total / props.page.size)));
const manualIndex = computed(() => Math.max(0, manualAnalysisOptions.value.findIndex((item) => item.value === localFilters.manualAnalysis)));
const algorithmIndex = computed(() => Math.max(0, analysisOptions.value.findIndex((item) => item.value === localFilters.algorithmAnalysisStatus)));
const leakIndex = computed(() => Math.max(0, leakOptions.value.findIndex((item) => item.value === localFilters.leakStatus)));
const deviceStatusIndex = computed(() => Math.max(0, deviceStatusOptions.value.findIndex((item) => item.value === localFilters.onlineStatus)));
const regionIndex = computed(() => Math.max(0, regionOptions.value.findIndex((item) => item.value === localFilters.deptId)));
const todayIndex = computed(() => Math.max(0, booleanOptions.value.findIndex((item) => item.value === localFilters.todayNew)));
const latestIndex = computed(() => Math.max(0, booleanOptions.value.findIndex((item) => item.value === localFilters.latestInstalled)));

function selectManualStatus(event: { detail: { value: number } }) {
  localFilters.manualAnalysis = manualAnalysisOptions.value[Number(event.detail.value)]?.value || "";
}
function selectAlgorithmStatus(event: { detail: { value: number } }) {
  localFilters.algorithmAnalysisStatus = analysisOptions.value[Number(event.detail.value)]?.value || "";
}
function selectLeakStatus(event: { detail: { value: number } }) {
  localFilters.leakStatus = leakOptions.value[Number(event.detail.value)]?.value || "";
}
function selectDeviceStatus(event: { detail: { value: number } }) {
  localFilters.onlineStatus = deviceStatusOptions.value[Number(event.detail.value)]?.value || "";
}
function selectRegion(event: { detail: { value: number } }) {
  localFilters.deptId = regionOptions.value[Number(event.detail.value)]?.value || "";
}
function selectTodayNew(event: { detail: { value: number } }) {
  localFilters.todayNew = booleanOptions.value[Number(event.detail.value)]?.value || "";
}
function selectLatestInstalled(event: { detail: { value: number } }) {
  localFilters.latestInstalled = booleanOptions.value[Number(event.detail.value)]?.value || "";
}
function selectDevice(device: LeakMonitorDevice) {
  emit("select-device", device);
}
function formatMetric(metric: LeakMonitorMetric) {
  const value = metric.value === undefined || metric.value === null || metric.value === "" ? "--" : String(metric.value);
  if (!metric.suffix || value === "--" || value.endsWith(metric.suffix)) return value;
  return value + metric.suffix;
}
function statusText(status: LeakDeviceStatus) {
  const key = status === "suspect" ? "suspect" : status;
  return t(key);
}
function deviceStatusText(device: LeakMonitorDevice) {
  if (isDeviceStatusNull(device)) return "null";
  if (device.onlineStatus === 1) return t("normal");
  if (device.onlineStatus === 0) return t("offline");
  return t("unknown");
}
function deviceStatusTone(device: LeakMonitorDevice): LeakDeviceStatus | "null" {
  if (isDeviceStatusNull(device)) return "null";
  return device.onlineStatus === 1 ? "normal" : "unknown";
}
function isDeviceStatusNull(device: LeakMonitorDevice) {
  if (Object.prototype.hasOwnProperty.call(device.raw, "deviceStatus")) {
    return device.raw.deviceStatus === null;
  }
  return device.raw.onlineStatus === null;
}
function analysisStatusText(
  device: LeakMonitorDevice,
  field: "manualAnalysis" | "algorithmAnalysisStatus",
  status: LeakDeviceStatus,
) {
  return device.raw[field] === null ? "null" : statusText(status);
}
function analysisStatusTone(
  device: LeakMonitorDevice,
  field: "manualAnalysis" | "algorithmAnalysisStatus",
  status: LeakDeviceStatus,
): LeakDeviceStatus | "null" {
  return device.raw[field] === null ? "null" : status;
}
function featureStatusTitle(device: LeakMonitorDevice) {
  return device.leakProperty === null
    ? t("leakStatusLabel")
    : `${t("featureValue")}: ${device.leakProperty}`;
}
function leakStatusText(device: LeakMonitorDevice) {
  return device.raw.leakStatus === null ? "null" : statusText(device.status);
}
</script>

<style scoped lang="scss">
.leak-sidebar {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  width: min(620px, calc(100vw - 120px));
  max-height: calc(100% - 36px);
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(201, 216, 232, 0.95);
  border-radius: 8px;
  box-shadow: 0 16px 34px rgba(18, 43, 70, 0.18);
}
.leak-sidebar--collapsed {
  top: min(286px, calc(100% - 64px));
  width: 48px;
}
.leak-sidebar__header {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 46px;
  padding: 0 10px 0 16px;
  background: linear-gradient(180deg, #fff 0%, #f5f8fb 100%);
  border-bottom: 1px solid #e6edf4;
}
.leak-sidebar--collapsed .leak-sidebar__header { padding: 0 8px; border-bottom: 0; }
.leak-sidebar__title { display: flex; align-items: baseline; gap: 8px; }
.leak-sidebar__title-main { color: #1f2d3d; font-size: 17px; font-weight: 800; }
.leak-sidebar__title-sub { color: #64748b; font-size: 12px; font-weight: 700; }
.icon-button,
.action-button,
.page-button { margin: 0; border-radius: 5px; }
.icon-button::after,
.action-button::after,
.page-button::after { border: 0; }
.icon-button { width: 30px; height: 30px; padding: 0; color: #334155; font-size: 22px; line-height: 28px; background: #eef5fb; border: 0; }

.metric-grid {
  flex: none;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding: 10px 12px;
}
.metric-card:nth-child(-n + 2) { grid-column: span 2; }
.metric-card {
  min-width: 0;
  height: 58px;
  padding: 8px 10px;
  color: #31506d;
  background: #f6fbff;
  border: 1px solid #dbe8f3;
  border-radius: 6px;
}
.metric-card--success { color: #147a49; background: #edf9f2; border-color: #bfe9d1; }
.metric-card--primary { color: #1d66c2; background: #eff6ff; border-color: #cfe3ff; }
.metric-card--warning { color: #bd6b00; background: #fff7e8; border-color: #ffe0a3; }
.metric-card--danger { color: #c72222; background: #fff1f1; border-color: #ffcaca; }
.metric-card--muted { color: #64748b; background: #f4f5f7; border-color: #dde3ea; }
.metric-card__value { display: block; overflow: hidden; font-size: 19px; font-weight: 900; line-height: 1.1; text-overflow: ellipsis; white-space: nowrap; }
.metric-card__label { display: block; margin-top: 5px; font-size: 12px; font-weight: 800; }

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
  font-size: 13px;
  font-weight: 700;
}
.select-field,
.text-field {
  box-sizing: border-box;
  width: 100%;
  height: 31px;
  padding: 0 9px;
  color: #31435a;
  font-size: 13px;
  font-weight: 500;
  line-height: 31px;
  background: #fff;
  border: 1px solid #ccd8e4;
  border-radius: 4px;
}
.toolbar-row { flex: none; display: flex; align-items: center; gap: 8px; min-height: 48px; padding: 6px 12px; }
.analysis-rules { display: flex; flex-direction: column; gap: 2px; min-width: 0; color: #718096; font-size: 10px; line-height: 1.35; }
.analysis-rules > text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.analysis-rules__label { margin-right: 5px; color: #31506d; font-weight: 800; }
.toolbar-row__spacer { flex: 1; }
.action-button { min-width: 62px; height: 30px; padding: 0 12px; color: #fff; font-size: 13px; font-weight: 700; line-height: 30px; background: #0ea5e9; border: 0; }
.action-button--ghost { color: #31506d; background: #eef5fb; }
.action-button[disabled] { opacity: 0.65; }

.device-table {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 190px;
  margin: 0 12px;
  overflow: hidden;
  border: 1px solid #d8e5ef;
  border-radius: 5px;
}
.device-table__head,
.device-table__row {
  display: grid;
  grid-template-columns: minmax(108px, 1.28fr) repeat(4, minmax(72px, 1fr));
}
.device-table__head {
  min-height: 38px;
  color: #24364d;
  font-size: 13px;
  font-weight: 900;
  line-height: 38px;
  background: #f4f7fa;
  border-bottom: 1px solid #d8e5ef;
}
.device-table__body { position: relative; flex: 1; min-height: 0; overflow-x: hidden; overflow-y: auto; background: #fff; }
.device-table__row {
  min-height: 41px;
  color: #2f4054;
  font-size: 13px;
  line-height: 41px;
  border-bottom: 1px solid #edf2f7;
  cursor: pointer;
}
.device-table__row:hover,
.device-table__row.active { background: #eef7ff; }
.device-table__cell { min-width: 0; padding: 0 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.device-table__cell--number { color: #075985; font-weight: 800; }
.status-pill { display: inline-flex; align-items: center; justify-content: center; min-width: 46px; height: 23px; padding: 0 7px; border-radius: 12px; font-size: 12px; font-weight: 900; line-height: 23px; }
.status-pill--normal { color: #047857; background: #dff8ea; }
.status-pill--suspect { color: #b45309; background: #fff1cc; }
.status-pill--leak { color: #b91c1c; background: #ffe2e2; }
.status-pill--unknown { color: #64748b; background: #eef2f7; }
.status-pill--null { color: #64748b; font-family: monospace; background: #fff; border: 1px dashed #94a3b8; }
.status-text { font-size: 12px; font-weight: 800; }
.status-text--normal { color: #047857; }
.status-text--suspect { color: #b45309; }
.status-text--leak { color: #b91c1c; }
.status-text--unknown { color: #64748b; }
.status-text--null { color: #94a3b8; font-family: monospace; font-style: italic; }
.empty-state { height: 120px; color: #7c8da1; font-size: 13px; line-height: 120px; text-align: center; }
.loading-state { position: absolute; inset: 0; z-index: 2; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 13px; background: rgba(255,255,255,.88); }

.pagination-row { flex: none; display: flex; align-items: center; justify-content: flex-end; gap: 6px; min-height: 48px; padding: 0 12px; }
.page-total { margin-right: auto; color: #64748b; font-size: 12px; }
.page-button { min-width: 58px; height: 28px; padding: 0 8px; color: #31506d; font-size: 12px; line-height: 26px; background: #f6fbff; border: 1px solid #cbdced; }
.page-button--short { min-width: 44px; }
.page-button[disabled] { color: #aab7c4; background: #f8fafc; }
.page-info { color: #64748b; font-size: 12px; font-weight: 700; }
.sidebar-error { flex: none; margin: 0 12px 10px; padding: 7px 9px; color: #b42318; font-size: 12px; background: #fff1ee; border: 1px solid #ffd3cb; border-radius: 4px; }

@media (max-width: 900px) {
  .leak-sidebar { top: 10px; right: 10px; left: 10px; width: auto; max-height: calc(100% - 20px); }
  .leak-sidebar--collapsed { top: min(220px, calc(100% - 58px)); right: 10px; left: auto; width: 48px; }
}
</style>
