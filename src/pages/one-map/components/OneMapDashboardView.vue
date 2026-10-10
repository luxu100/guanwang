<template>
  <view class="one-map-view">
    <view class="one-map-header">
      <view class="page-heading">
        <text class="page-kicker">{{ tx("在线监测", "ONLINE MONITORING") }}</text>
        <text class="page-title">{{ tx("一张图", "One Map") }}</text>
        <text class="page-subtitle">{{ tx("多探头预警终端 · 水锤监测", "Multi-probe terminals · Water hammer") }}</text>
      </view>
      <view class="metric-grid" :aria-busy="loading">
        <DashboardLoading :active="loading" :label="tx('加载中', 'Loading')" />
        <view v-for="metric in metricCards" :key="metric.key" class="metric-card" :class="`metric-card--${metric.tone}`" :title="metric.hint">
          <text class="metric-card__label">{{ metric.label }}</text>
          <view class="metric-card__value">{{ metric.value }}<text class="metric-card__unit">{{ metric.unit }}</text></view>
          <text class="metric-card__hint">{{ metric.hint }}</text>
        </view>
      </view>
      <view class="header-actions">
        <view class="range-switch" role="group" :aria-label="tx('趋势时间范围', 'Trend range')">
          <button
            v-for="option in rangeOptions"
            :key="option.value"
            class="range-button"
            :class="{ 'range-button--active': rangeKey === option.value }"
            :disabled="loading || historyLoading"
            @click="changeRange(option.value)"
          >{{ option.label }}</button>
        </view>
        <button class="refresh-button" :disabled="loading || historyLoading" @click="refreshView">
          <image v-if="loading || historyLoading" class="refresh-button__loading" src="/static/icons/loadin_minior.svg" mode="aspectFit" />
          <image v-else class="refresh-button__loading" src="/static/icons/refresh-cw.svg" mode="aspectFit" />
          <text>{{ loading || historyLoading ? tx("加载中", "Loading") : tx("刷新", "Refresh") }}</text>
        </button>
      </view>
    <div class="history-query">
      <div class="history-query__field">{{ tx('开始日期', 'Start date') }}<component :is="'input'" class="history-query__input" type="date" :aria-label="tx('开始日期', 'Start date')" :value="queryStart" :max="queryEnd" :disabled="loading" @input="queryStart = ($event.target as HTMLInputElement).value" /></div>
      <div class="history-query__field">{{ tx('结束日期', 'End date') }}<component :is="'input'" class="history-query__input" type="date" :aria-label="tx('结束日期', 'End date')" :value="queryEnd" :min="queryStart" :max="today" :disabled="loading" @input="queryEnd = ($event.target as HTMLInputElement).value" /></div>
      <select v-model="historyKind" :aria-label="tx('历史查询类型', 'History query type')"><option value="alarms">{{ tx('报警历史', 'Alarm history') }}</option><option value="risk">{{ tx('管线风险历史', 'Pipeline risk history') }}</option></select>
      <button :disabled="loading || historyLoading" @click="queryHistory">{{ tx('查询历史', 'Query history') }}</button>
      <text v-if="queryError" class="history-query__error" role="alert">{{ queryError }}</text>
    </div>
    </view>

    <view v-if="globalError" class="global-error">
      <text>{{ globalError }}</text>
      <button class="error-retry" :disabled="loading" @click="loadDashboard">{{ tx("重新加载", "Retry") }}</button>
    </view>

    <OneMapHistoryResults v-if="historyMode" :start="appliedDates.start" :end="appliedDates.end" :kind="appliedKind" :revision="historyRevision" @busy="historyLoading = $event" @back="returnToLive" />
    <section v-show="!historyMode" class="monitoring-board" :aria-label="tx('在线监测总览', 'Online monitoring overview')">
    <ResizablePanels class="monitoring-board__outer" :initial-ratio="70" :min-ratio="60" :max-ratio="80" :label="tx('调整右侧状态与报警面板宽度', 'Resize status and alarm panels')" storage-key="one-map-right-split">
      <template #left>
    <ResizablePanels class="monitoring-board__main" :initial-ratio="40" :label="tx('调整趋势与波形面板宽度', 'Resize trend and waveform panels')" storage-key="one-map-overview-split">
      <template #left>
      <div class="monitoring-column">
      <view class="dashboard-block dashboard-block--trend" :aria-busy="loading">
        <DashboardLoading :active="loading" :label="tx('加载中', 'Loading')" />
        <view class="block-head">
          <view>
            <text class="block-title">{{ trendTitle }}</text>
            <text class="block-hint">{{ tx("按报警记录统计，支持切换到更长时间范围", "Based on alarm records; longer ranges are available") }}</text>
          </view>
          <text class="block-status" :class="{ 'block-status--error': errors.trend }">{{ errors.trend || trendStatus }}</text>
        </view>
        <view class="trend-chart"><div ref="trendChartEl" class="trend-chart__canvas"></div></view>
        <view v-if="!trend.length && !loading" class="chart-empty">{{ errors.trend || tx("暂无报警趋势数据", "No alarm trend data") }}</view>
      </view>

      <view class="dashboard-block dashboard-block--devices" :aria-busy="loading">
        <DashboardLoading :active="loading" :label="tx('加载中', 'Loading')" />
        <view class="block-head">
          <view>
            <text class="block-title">{{ tx("实时状态", "Live status") }}</text>
            <text class="block-hint">{{ tx("展示当前可见的多探头预警终端", "Visible multi-probe warning terminals") }}</text>
          </view>
          <text class="block-count">{{ deviceRows.length }} {{ tx("台", "devices") }}</text>
        </view>
        <view v-if="errors.devices" class="block-error">{{ errors.devices }}</view>
        <view v-else-if="!deviceRows.length" class="block-empty">{{ tx("暂无设备状态数据", "No device status data") }}</view>
        <scroll-view v-else class="device-list" scroll-y>
          <view v-for="device in deviceRows.slice(0, 8)" :key="String(device.id)" class="device-row">
            <view class="device-row__identity">
              <text class="device-row__name">{{ device.name }}</text>
              <text class="device-row__number">{{ device.number }}</text>
            </view>
            <view class="device-row__data"><text>{{ tx("电压", "Voltage") }}</text><strong>{{ device.voltage }}</strong></view>
            <view class="device-row__data"><text>{{ tx("采集时间", "Sampled") }}</text><strong>{{ device.sampledAt }}</strong></view>
            <text class="status-tag" :class="`status-tag--${device.statusTone}`">{{ device.status }}</text>
          </view>
        </scroll-view>
      </view>
      </div>

      </template>
      <template #right>
      <div class="monitoring-column monitoring-column--center">
      <view class="dashboard-block dashboard-block--waveform" :aria-label="tx('水锤压力波形：暂无压力采样数据', 'Water-hammer waveform: pressure samples unavailable')">
        <view class="block-head">
          <view>
            <text class="block-title">{{ tx("水锤压力波形", "Water-hammer pressure waveform") }}</text>
            <text class="block-hint">{{ tx("当前后端只提供水锤汇总，压力采样点接口待接入", "The backend currently provides summary data only; pressure samples are pending") }}</text>
          </view>
          <text class="block-status">{{ tx("接口状态", "API status") }}</text>
        </view>
        <view class="waveform-placeholder">
          <view class="waveform-overlay data-loading-region" tabindex="0" :aria-label="tx('水锤监测汇总', 'Water-hammer summary')" :aria-busy="loading">
            <DashboardLoading :active="loading" :label="tx('加载中', 'Loading')" />
            <view class="waveform-summary">
              <view><text>{{ tx("监测终端", "Monitored terminals") }}</text><strong>{{ waterHammer.monitoredTerminalCount ?? "--" }}</strong></view>
              <view><text>{{ tx("水锤报警", "Water-hammer alarms") }}</text><strong>{{ waterHammer.alarmCount ?? "--" }}</strong></view>
              <view><text>{{ tx("报警率", "Alarm rate") }}</text><strong>{{ formatRate(waterHammer.alarmRate) }}</strong></view>
            </view>
          </view>
          <view class="waveform-grid">
            <view v-for="line in 5" :key="line" class="waveform-grid__line"></view>
            <view class="waveform-baseline"></view>
          </view>
          <view class="waveform-message">
            <text class="waveform-message__title">{{ tx("暂无真实压力波形", "No pressure waveform yet") }}</text>
            <text class="waveform-message__text">{{ tx("收到高频压力采样点后，这里显示原始波形与异常区段。", "The raw waveform and abnormal sections will appear when high-frequency pressure samples are available.") }}</text>
          </view>
        </view>
      </view>

    <OneMapRiskMap ref="riskMapRef" :tubes="networkTubes" :points="mapPoints" :alarms="locationRows" :loading="networkLoading" :error="networkError" :rejected-count="networkRejected" />
      </div>
      </template>
    </ResizablePanels>
      </template>
      <template #right>
    <aside class="monitoring-column monitoring-board__side">
      <view class="dashboard-block dashboard-block--locations" :aria-busy="loading">
        <DashboardLoading :active="loading" :label="tx('加载中', 'Loading')" />
        <view class="block-head">
          <view>
            <text class="block-title">{{ tx("报警分布位置", "Alarm locations") }}</text>
            <text class="block-hint">{{ selectedRange.start }} ~ {{ selectedRange.end }} · {{ tx("全部状态 · 按设备统计", "All statuses · By device") }}</text>
          </view>
          <text class="block-count">{{ locationRows.length }} {{ tx("台设备", "devices") }}</text>
        </view>
        <view class="location-legend" :aria-label="tx('报警级别图例', 'Alarm severity legend')">
          <view><text class="location-dot location-dot--red"></text><text>{{ tx("严重", "Critical") }}</text></view>
          <view><text class="location-dot location-dot--orange"></text><text>{{ tx("警告", "Warning") }}</text></view>
          <view><text class="location-dot"></text><text>{{ tx("提示", "Info") }}</text></view>
        </view>
        <view v-if="errors.locations" class="block-error">{{ errors.locations }}</view>
        <view v-else-if="!locationRows.length" class="block-empty">{{ tx("所选时段暂无报警", "No alarms in selected period") }}</view>
        <scroll-view v-else class="location-list" scroll-y>
          <view v-for="row in locationRows" :key="row.key" class="location-row" role="button" tabindex="0" :aria-label="tx(`定位报警设备 ${row.deviceNumber}`, `Locate alarm device ${row.deviceNumber}`)" @click="locateAlarm(row.deviceNumber)" @keydown.enter="locateAlarm(row.deviceNumber)" @keydown.space.prevent="locateAlarm(row.deviceNumber)">
            <view class="location-row__name"><text class="location-dot" :class="`location-dot--${row.tone}`"></text><text :title="row.label">{{ row.label }}</text></view>
            <view class="location-row__bar"><view class="location-row__bar-fill" :class="`location-row__bar-fill--${row.tone}`" :style="{ width: `${row.ratio}%` }"></view></view>
            <text class="location-row__count">{{ row.count }}</text>
          </view>
        </scroll-view>
      </view>

    <view class="dashboard-block dashboard-block--table" :aria-busy="loading">
      <DashboardLoading :active="loading" :label="tx('加载中', 'Loading')" />
      <view class="block-head">
        <view>
          <text class="block-title">{{ tx("报警明细", "Alarm details") }}</text>
          <text class="block-hint">{{ tx("最近报警记录，点击报警菜单查看完整处理流程", "Recent alarm records; use Alarm Management for the full workflow") }}</text>
        </view>
        <text class="block-count">{{ alarmRows.length }} {{ tx("条", "records") }}</text>
      </view>
      <view v-if="errors.alarms" class="block-error">{{ errors.alarms }}</view>
      <view v-else-if="!alarmRows.length" class="block-empty">{{ tx("暂无报警明细", "No alarm details") }}</view>
      <scroll-view v-else class="alarm-table" scroll-x scroll-y>
        <view class="alarm-table__row alarm-table__row--head">
          <text>{{ tx("设备", "Device") }}</text><text>{{ tx("报警类型", "Type") }}</text><text>{{ tx("级别", "Level") }}</text><text>{{ tx("状态", "Status") }}</text><text>{{ tx("触发时间", "Triggered") }}</text><text>{{ tx("位置", "Location") }}</text>
        </view>
        <view v-for="row in alarmRows" :key="String(row.id)" class="alarm-table__row">
          <text class="alarm-table__device">{{ row.device }}</text><text>{{ row.type }}</text><text><text class="level-tag" :class="`level-tag--${row.levelTone}`">{{ row.level }}</text></text><text>{{ row.status }}</text><text>{{ row.time }}</text><text class="alarm-table__location" :title="row.location">{{ row.location }}</text>
        </view>
      </scroll-view>
    </view>
    </aside>
      </template>
    </ResizablePanels>
    </section>

  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import * as echarts from "echarts";
import { useI18n } from "@/i18n";
import { getAlarmOverview, getAlarmPage, getAlarmTrend } from "@/services/alarm/api";
import { getWaterHammerSummaryT } from "@/services/leak-burst";
import { fetchLeakMonitorSidebar } from "@/services/leak-monitor/device-query";
import DashboardLoading from "./DashboardLoading.vue";
import ResizablePanels from "./ResizablePanels.vue";
import OneMapRiskMap from "./OneMapRiskMap.vue";
import { fetchFormalTubeNetworks, type TubeNetworkRecord } from "@/services/leak-monitor/tube-network";
import type { MapDevicePoint } from '@/pages/leak-monitor/types';
import { alarmLocations, loadPeriodAlarms, type AlarmLocation } from '../locations';
import OneMapHistoryResults from './OneMapHistoryResults.vue';

type RangeKey = "7d" | "30d" | "1y" | "custom";
type Tone = "blue" | "green" | "orange" | "red" | "muted";
type RawRecord = Record<string, any>;

interface TrendRow { bucket: string; total: number; critical: number; warning: number; info: number }
interface DeviceRow { id: string | number; name: string; number: string; voltage: string; sampledAt: string; status: string; statusTone: Tone }
interface AlarmRow { id: string | number; device: string; type: string; level: string; levelTone: Tone; status: string; time: string; location: string }

const emptyDeviceFilters = {
  deviceNumber: "",
  manualAnalysis: "" as const,
  algorithmAnalysisStatus: "" as const,
  onlineStatus: "" as const,
  leakStatus: "" as const,
  deptId: "",
  todayNew: "" as const,
  latestInstalled: "" as const,
};

const { locale } = useI18n();
const today = dateString(new Date());
const queryStart = ref(dateString(new Date(Date.now() - 6 * 86400000)));
const queryEnd = ref(today);
const queryError = ref('');
const appliedDates = ref({ start: queryStart.value, end: queryEnd.value });
const selectedRange = ref({ ...appliedDates.value });
const historyMode = ref(false);
const historyLoading = ref(false);
const historyKind = ref<'alarms' | 'risk'>('alarms');
const appliedKind = ref<'alarms' | 'risk'>('alarms');
const historyRevision = ref(0);
const mapPoints = ref<MapDevicePoint[]>([]);
const riskMapRef = ref<InstanceType<typeof OneMapRiskMap> | null>(null);
const rangeKey = ref<RangeKey>("7d");
const loading = ref(false);
const globalError = ref("");
const lastUpdated = ref("");
const trend = ref<TrendRow[]>([]);
const locationRows = ref<AlarmLocation[]>([]);
const deviceRows = ref<DeviceRow[]>([]);
const alarmRows = ref<AlarmRow[]>([]);
const activeCount = ref<number | null>(null);
const overview = ref<RawRecord | null>(null);
const waterHammer = ref<RawRecord>({});
const networkTubes = ref<TubeNetworkRecord[]>([]);
const networkLoading = ref(false);
const networkError = ref("");
const networkRejected = ref(0);
const trendChartEl = ref<HTMLElement | null>(null);
const errors = reactive({ trend: "", locations: "", devices: "", alarms: "" });
let trendChart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;
let disposed = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;

const rangeOptions = computed(() => [
  { value: "7d" as const, label: tx("近 7 天", "7 days") },
  { value: "30d" as const, label: tx("近 30 天", "30 days") },
  { value: "1y" as const, label: tx("近 1 年", "1 year") },
]);

const metricCards = computed(() => [
  { key: "total", label: tx("所选时段报警总数", "Alarms in selected range"), value: errors.trend ? "--" : trend.value.reduce((total, row) => total + row.total, 0), unit: tx("条", ""), hint: `${selectedRange.value.start} – ${selectedRange.value.end}`, tone: "blue" as Tone },
  { key: "active", label: tx("活跃报警", "Active alarms"), value: overview.value?.activeTotal ?? activeCount.value ?? "--", unit: tx("条", ""), hint: tx("需要关注或处理的报警", "Alarms requiring attention"), tone: "red" as Tone },
  { key: "devices", label: tx("可见设备", "Visible devices"), value: deviceRows.value.length || "--", unit: tx("台", ""), hint: tx("当前账号可见的终端数量", "Visible terminals for this account"), tone: "green" as Tone },
  { key: "communication", label: tx("通信状态", "Communication"), value: onlineDeviceCount.value, unit: tx("台在线", "online"), hint: tx("按设备最新状态统计", "Based on latest device status"), tone: "orange" as Tone },
]);

const onlineDeviceCount = computed(() => deviceRows.value.filter((item) => item.statusTone === "green").length);
const trendStatus = computed(() => loading.value ? tx("加载中", "Loading") : tx("已更新", "Updated"));
const trendTitle = computed(() => {
  if (rangeKey.value === "30d") return tx("近 30 天报警变化趋势", "30-day alarm trend");
  if (rangeKey.value === "1y") return tx("近一年报警变化趋势", "One-year alarm trend");
  if (rangeKey.value === "custom") return tx("所选时段报警趋势", "Alarm trend for selected dates");
  return tx("近一周报警变化趋势", "Seven-day alarm trend");
});

function tx(zh: string, en: string) { return locale.value === "en-US" ? en : zh; }

function rangeDates() {
  if (rangeKey.value === 'custom') return appliedDates.value;
  const end = new Date();
  const start = new Date(end);
  const days = rangeKey.value === "7d" ? 6 : rangeKey.value === "30d" ? 29 : 364;
  start.setDate(start.getDate() - days);
  const date = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  return { start: date(start), end: date(end) };
}

function dateString(value: Date) { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`; }
function queryHistory() {
  if (loading.value || historyLoading.value) return;
  const start = new Date(`${queryStart.value}T00:00:00`);
  const end = new Date(`${queryEnd.value}T00:00:00`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start > end || queryEnd.value > today) { queryError.value = tx('请选择有效的日期范围', 'Choose a valid date range'); return; }
  queryError.value = '';
  appliedDates.value = { start: queryStart.value, end: queryEnd.value };
  appliedKind.value = historyKind.value;
  historyMode.value = true;
  historyRevision.value++;
}
function refreshView() { if (historyMode.value) historyRevision.value++; else void loadDashboard(); }
function returnToLive() { historyMode.value = false; void nextTick(() => { trendChart?.resize(); renderTrendChart(); riskMapRef.value?.resize(); }); }
function locateAlarm(deviceNumber: string) { riskMapRef.value?.focusAlarm(deviceNumber); }
function unwrap(response: unknown): unknown {
  if (!response || typeof response !== "object") return response;
  const record = response as RawRecord;
  if (record.code !== undefined && record.code !== 200) {
    throw new Error(String(record.msg || tx("接口返回失败", "API request failed")));
  }
  return record.data ?? response;
}

function recordsFrom(value: unknown): RawRecord[] {
  if (Array.isArray(value)) return value.filter((item): item is RawRecord => Boolean(item && typeof item === "object"));
  if (!value || typeof value !== "object") return [];
  const record = value as RawRecord;
  for (const key of ["records", "rows", "items", "list", "devices", "points", "series"]) {
    if (Array.isArray(record[key])) return recordsFrom(record[key]);
  }
  return [];
}

function numberValue(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function textValue(value: unknown, fallback = "--") {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function formatRate(value: unknown) {
  if (value === null || value === undefined || value === "") return "--";
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(1)}%` : textValue(value);
}

function formatTime(value: unknown) {
  const text = textValue(value, "--").replace("T", " ");
  return text.length > 16 ? text.slice(5, 16) : text;
}

async function getLeakMonitorSidebar() {
  const result = await fetchLeakMonitorSidebar(emptyDeviceFilters);
  if (disposed) return { code: 200, data: [] };
  mapPoints.value = result.devices.filter((device) => typeof device.lat === 'number' && typeof device.lng === 'number' && Number.isFinite(device.lat) && Number.isFinite(device.lng) && Math.abs(device.lat) <= 90 && Math.abs(device.lng) <= 180).map((device) => ({
    ...device, lat: device.lat!, lng: device.lng!, title: String(device.raw.deviceAlias || device.deviceNumber),
    countryCode: device.raw.countryCode == null ? null : String(device.raw.countryCode),
    installAddress: String(device.raw.installAddress || ''),
  }));
  return { code: 200, data: result.devices.map((device) => ({ ...device.raw, ...device })) };
}

function normalizeTrend(value: unknown): TrendRow[] {
  const source = recordsFrom(value);
  return source.map((row, index) => ({
    bucket: textValue(row.bucket ?? row.date ?? row.period, String(index + 1)),
    total: numberValue(row.total ?? row.totalCount ?? row.count),
    critical: numberValue(row.CRITICAL ?? row.critical ?? row.criticalCount),
    warning: numberValue(row.WARNING ?? row.warning ?? row.warningCount),
    info: numberValue(row.INFO ?? row.info ?? row.infoCount),
  }));
}

function normalizeLocations(value: unknown) { return alarmLocations(recordsFrom(value)); }

function normalizeDevices(value: unknown): DeviceRow[] {
  return recordsFrom(value).map((row, index) => {
    const online = row.deviceStatus ?? row.onlineStatus;
    const onlineTone: Tone = Number(online) === 1 || String(online).toLowerCase() === "online" ? "green" : Number(online) === 0 || String(online).toLowerCase() === "offline" ? "red" : "muted";
    return {
      id: row.deviceId ?? row.id ?? row.deviceNumber ?? index,
      name: textValue(row.deviceAlias ?? row.deviceName ?? row.deviceNumber, tx("未命名设备", "Unnamed device")),
      number: textValue(row.deviceNumber),
      voltage: textValue(row.batteryVoltage ?? row.batteryGroupVoltage ?? row.sunBatteryVoltage, "--"),
      sampledAt: formatTime(row.lastSamplingTime ?? row.samplingTime ?? row.receiveTime ?? row.updatedAt),
      status: onlineTone === "green" ? tx("在线", "Online") : onlineTone === "red" ? tx("离线", "Offline") : tx("未知", "Unknown"),
      statusTone: onlineTone,
    };
  });
}

function normalizeAlarms(value: unknown): AlarmRow[] {
  return recordsFrom(value).slice(0, 10).map((row, index) => {
    const level = String(row.alarmLevel ?? "INFO").toUpperCase();
    const status = String(row.status ?? "ACTIVE").toUpperCase();
    return {
      id: row.id ?? row.alarmRecordId ?? index,
      device: textValue(row.deviceNumber ?? row.deviceAlias ?? row.deviceName),
      type: textValue(row.alarmTypeName ?? row.alarmType),
      level: level === "CRITICAL" ? tx("严重", "Critical") : level === "WARNING" ? tx("警告", "Warning") : tx("提示", "Info"),
      levelTone: level === "CRITICAL" ? "red" : level === "WARNING" ? "orange" : "blue",
      status: status === "RESOLVED" ? tx("已恢复", "Resolved") : status === "CONFIRMED" ? tx("已确认", "Confirmed") : tx("活跃", "Active"),
      time: formatTime(row.firstTriggeredAt ?? row.triggeredAt ?? row.createdAt),
      location: textValue(row.installAddress ?? row.address ?? row.deviceAlias ?? row.deviceNumber, "--"),
    };
  });
}

async function loadDashboard() {
  if (loading.value) return;
  loading.value = true;
  networkLoading.value = true;
  globalError.value = "";
  Object.assign(errors, { trend: "", locations: "", devices: "", alarms: "" });
  try {
    const dates = rangeDates();
    selectedRange.value = dates;
    const results = await Promise.allSettled([
      getAlarmTrend({ startTime: dates.start, endTime: dates.end, granularity: new Date(dates.end).getTime() - new Date(dates.start).getTime() > 90 * 86400000 ? 'MONTH' : 'DAY' }),
      getAlarmOverview({}),
      loadPeriodAlarms(getAlarmPage, dates, () => !disposed),
      getLeakMonitorSidebar(),
      getWaterHammerSummaryT({ startTime: dates.start, endTime: `${dates.end}T23:59:59` } as never),
      fetchFormalTubeNetworks(),
    ]);
    if (disposed) return;

    const [trendResult, overviewResult, alarmsResult, devicesResult, waterHammerResult, networkResult] = results;
    consumeResult(trendResult, (value) => { trend.value = normalizeTrend(value); }, (reason) => { trend.value = []; errors.trend = errorText(reason); });
    consumeResult(overviewResult, (value) => {
      overview.value = (value || {}) as RawRecord;
      activeCount.value = numberValue(overview.value.activeTotal, 0);
    }, (reason) => { overview.value = null; activeCount.value = null; globalError.value = errorText(reason); });
    consumeResult(alarmsResult, (value) => {
      locationRows.value = normalizeLocations(value); alarmRows.value = normalizeAlarms(value);
    }, (reason) => {
      locationRows.value = []; alarmRows.value = [];
      errors.locations = errorText(reason); errors.alarms = errorText(reason);
    });
    consumeResult(devicesResult, (value) => { deviceRows.value = normalizeDevices(value); }, (reason) => { deviceRows.value = []; mapPoints.value = []; errors.devices = errorText(reason); });
    consumeResult(waterHammerResult, (value) => { waterHammer.value = (value || {}) as RawRecord; }, () => { waterHammer.value = {}; });
    consumeResult(networkResult, (value) => {
      const result = value as { tubes: TubeNetworkRecord[]; rejected: unknown[] };
      networkTubes.value = result.tubes; networkRejected.value = result.rejected.length; networkError.value = "";
    }, (reason) => { networkTubes.value = []; networkRejected.value = 0; networkError.value = errorText(reason); });
    lastUpdated.value = new Date().toLocaleTimeString(locale.value === "en-US" ? "en-US" : "zh-CN", { hour12: false });
    await nextTick();
    renderTrendChart();
  } catch (reason) {
    if (!disposed) globalError.value = errorText(reason);
  } finally {
    loading.value = false;
    networkLoading.value = false;
  }
}

function errorText(reason: unknown) {
  return reason instanceof Error ? reason.message : String((reason as { msg?: string })?.msg || tx("接口加载失败", "API request failed"));
}

function consumeResult<T>(
  result: PromiseSettledResult<T>,
  onSuccess: (value: unknown) => void,
  onFailure: (reason: unknown) => void,
) {
  if (result.status === "rejected") {
    onFailure(result.reason);
    return;
  }
  try {
    onSuccess(unwrap(result.value));
  } catch (reason) {
    onFailure(reason);
  }
}

function changeRange(value: RangeKey) {
  if (loading.value || (!historyMode.value && rangeKey.value === value)) return;
  returnToLive();
  rangeKey.value = value;
  const dates = rangeDates();
  queryStart.value = dates.start; queryEnd.value = dates.end; queryError.value = '';
  void loadDashboard();
}

function renderTrendChart() {
  if (disposed || !trendChartEl.value || !trendChartEl.value.clientWidth || !trendChartEl.value.clientHeight) return;
  if (!trendChart) trendChart = echarts.init(trendChartEl.value);
  trendChart.setOption({
    animationDuration: 350,
    color: ["#2563eb", "#ef4444", "#f59e0b", "#22a06b"],
    tooltip: { trigger: "axis", confine: true },
    legend: { top: 2, right: 12, itemWidth: 14, itemHeight: 8, textStyle: { color: "#6b7f91", fontSize: 11 } },
    grid: { left: 42, right: 38, top: 36, bottom: 28, containLabel: true },
    xAxis: {
      type: "category", boundaryGap: false, data: trend.value.map((row) => row.bucket),
      axisTick: { show: false }, axisLine: { lineStyle: { color: "#d8e3ec" } },
      axisLabel: {
        color: "#8191a2", fontSize: 11, showMinLabel: true, showMaxLabel: true, hideOverlap: true,
        formatter: (value: string) => /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(5, 10) : value,
      },
    },
    yAxis: { type: "value", minInterval: 1, splitLine: { lineStyle: { color: "#edf2f6", type: "dashed" } }, axisLabel: { color: "#8191a2", fontSize: 11 } },
    series: [
      { name: tx("报警总数", "Total alarms"), type: "line", smooth: true, symbol: "circle", symbolSize: 6, lineStyle: { width: 2 }, data: trend.value.map((row) => row.total) },
      { name: tx("严重", "Critical"), type: "line", smooth: true, symbol: "none", lineStyle: { width: 2 }, data: trend.value.map((row) => row.critical) },
      { name: tx("警告", "Warning"), type: "line", smooth: true, symbol: "none", lineStyle: { width: 2 }, data: trend.value.map((row) => row.warning) },
    ],
  }, true);
}

watch([trend, locale], () => { void nextTick(renderTrendChart); });

onMounted(() => {
  void loadDashboard();
  pollTimer = setInterval(() => { if (!document.hidden && !historyMode.value) void loadDashboard(); }, 60000);
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      if (!trendChartEl.value?.clientWidth || !trendChartEl.value.clientHeight) return;
      trendChart?.resize();
      renderTrendChart();
    });
    if (trendChartEl.value) resizeObserver.observe(trendChartEl.value);
  }
});

onUnmounted(() => {
  disposed = true;
  if (pollTimer) clearInterval(pollTimer);
  resizeObserver?.disconnect();
  resizeObserver = null;
  trendChart?.dispose();
  trendChart = null;
});
</script>

<style scoped lang="scss">
.history-query { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 0 2px 14px; font-size: 12px; color: #52677d; }.history-query label { display: flex; align-items: center; gap: 8px; }.history-query input { box-sizing: border-box; height: 32px; padding: 0 8px; background: #fff; border: 1px solid #cbd8e5; border-radius: 4px; color: #335b75; font-size: 12px; }.history-query button { height: 32px; margin: 0; padding: 0 12px; color: #fff; background: #2187cc; border: 0; border-radius: 4px; font-size: 12px; cursor: pointer; }.history-query__error { color: #b42318; }.risk-history { margin-bottom: 14px; padding: 14px 16px; border-top: 1px solid #d8e6f1; border-bottom: 1px solid #d8e6f1; font-size: 12px; }.risk-history strong { color: #21425e; font-size: 14px; }.risk-history span { margin-left: 12px; color: #64788c; }.risk-history p { color: #64788c; margin: 8px 0 0; line-height: 1.6; }
.one-map-view { box-sizing: border-box; min-height: 100%; overflow-y: auto; padding: 18px 20px 24px; background: #eef4f8; color: #18344d; }
.one-map-header { display: grid; grid-template-columns: minmax(145px, .8fr) minmax(340px, 1.6fr) auto; align-items: center; gap: 18px; padding: 4px 2px 14px; }
.page-heading { min-width: 0; }
.page-kicker { display: block; color: #2c86c9; font-size: 11px; font-weight: 700; letter-spacing: 0; }
.page-title { display: block; margin-top: 4px; color: #173b58; font-size: 24px; font-weight: 900; line-height: 1.2; }
.page-subtitle { display: block; margin-top: 7px; color: #71869a; font-size: 12px; line-height: 1.6; }
.header-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.range-switch { display: flex; gap: 2px; padding: 3px; background: #e4edf4; border-radius: 5px; }
.range-button, .refresh-button, .error-retry { margin: 0; border: 1px solid transparent; border-radius: 4px; cursor: pointer; }
.range-button { height: 30px; padding: 0 11px; color: #64788c; font-size: 12px; background: transparent; }
.range-button--active { color: #1769aa; background: #fff; border-color: #d4e3ef; box-shadow: 0 1px 3px rgba(29, 73, 105, .08); font-weight: 800; }
.refresh-button { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 13px; color: #fff; font-size: 13px; background: #2187cc; border-color: #2187cc; }
.refresh-button[disabled] { opacity: .58; cursor: wait; }
.refresh-button__icon { font-size: 17px; line-height: 1; }
.refresh-button__loading { width: 17px; height: 17px; }
.refresh-button[disabled] .refresh-button__loading { animation: minor-spin .85s linear infinite; }
.history-query__field { display: flex; align-items: center; gap: 8px; }
.history-query__input { box-sizing: border-box; width: 156px; height: 32px; padding: 0 8px; border: 1px solid #cbd8e5; border-radius: 4px; font: inherit; color: #335b75; background: #fff; }
.history-query > button { flex: none; }
.block-head > view { min-width: 0; }
.block-status { max-width: 42%; overflow-wrap: anywhere; }
.refresh-button { min-width: 84px; }
.range-button[disabled], .error-retry[disabled] { cursor: wait; }
.metric-grid, .dashboard-block, .data-loading-region { position: relative; }
.dashboard-block--locations, .dashboard-block--devices { min-height: 286px; }
.dashboard-block--table { min-height: 160px; }
.location-legend { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; padding: 10px 16px 0; color: #64788c; font-size: 11px; }
.location-legend > view { display: flex; align-items: center; gap: 6px; }
@keyframes minor-spin { to { transform: rotate(360deg); } }
.global-error, .block-error { color: #b42318; background: #fff5f3; border: 1px solid #ffc9c0; border-radius: 5px; }
.global-error { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; padding: 9px 12px; font-size: 12px; }
.error-retry { height: 28px; padding: 0 10px; color: #b42318; background: #fff; border-color: #f3aaa0; font-size: 12px; }
.metric-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 0; }
.metric-card, .dashboard-block { background: #fff; border: 1px solid #d8e6f1; border-radius: 6px; box-shadow: 0 5px 16px rgba(35, 72, 104, .045); }
.metric-card { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 4px 8px; min-width: 0; min-height: 62px; box-sizing: border-box; padding: 8px 11px; border-left: 3px solid #4798d1; box-shadow: none; }
.metric-card--green { border-left-color: #25a36f; }.metric-card--orange { border-left-color: #e7a23b; }.metric-card--red { border-left-color: #e76f69; }
.metric-card__topline { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.metric-card__label { color: #526d83; font-size: 12px; font-weight: 600; overflow-wrap: anywhere; }
.metric-card__value { margin: 0; color: #1b6eaa; font-size: 21px; font-weight: 700; line-height: 1.2; font-variant-numeric: tabular-nums; white-space: nowrap; }.metric-card--green .metric-card__value { color: #1e8d63; }.metric-card--orange .metric-card__value { color: #c4811e; }.metric-card--red .metric-card__value { color: #cc554e; }
.metric-card__unit { margin-left: 5px; color: #8495a5; font-size: 11px; font-weight: 500; }.metric-card__hint { grid-column: 1 / -1; display: block; margin: 0; color: #71869a; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dashboard-grid { display: grid; gap: 14px; margin-bottom: 14px; }.dashboard-grid--top { grid-template-columns: minmax(0, 1.12fr) minmax(360px, .88fr); }.dashboard-grid--middle { grid-template-columns: minmax(0, .92fr) minmax(0, 1.08fr); }
.dashboard-block { min-width: 0; overflow: hidden; }.block-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 14px 16px 8px; border-bottom: 1px solid #edf3f7; }.block-title { display: block; color: #21425e; font-size: 15px; font-weight: 900; }.block-hint { display: block; margin-top: 4px; color: #8b9bab; font-size: 11px; line-height: 1.4; }.block-status, .block-count { flex: none; color: #7b8e9f; font-size: 11px; }.block-status--error { color: #c94c45; }.block-error { margin: 12px; padding: 9px 10px; font-size: 12px; }.block-empty, .chart-empty { padding: 32px 14px; color: #98a7b4; font-size: 12px; text-align: center; }
.trend-chart { height: 258px; padding: 4px 8px 8px; }.trend-chart__canvas { width: 100%; height: 100%; }.chart-empty { margin-top: -170px; position: relative; pointer-events: none; }
.waveform-placeholder { position: relative; min-height: 258px; margin: 8px 14px 0; overflow: hidden; background: #f8fbfd; border: 1px solid #e7eef3; border-radius: 4px; }.waveform-grid { position: absolute; inset: 22px 18px 30px; }.waveform-grid__line { height: 25%; border-top: 1px dashed #dce8ef; }.waveform-baseline { position: absolute; top: 52%; right: 0; left: 0; border-top: 1px solid #b7d0df; }.waveform-message { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 7px; padding: 20px; text-align: center; }.waveform-message__title { color: #59758b; font-size: 14px; font-weight: 800; }.waveform-message__text { max-width: 310px; color: #91a1af; font-size: 11px; line-height: 1.6; }.waveform-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 12px 14px 14px; }.waveform-summary view { display: flex; flex-direction: column; gap: 4px; padding: 8px 10px; background: #f7fafc; border: 1px solid #e8eff4; border-radius: 4px; }.waveform-summary text { color: #8294a3; font-size: 11px; }.waveform-summary strong { color: #335b75; font-size: 16px; font-weight: 900; }
.location-list { padding: 7px 16px 13px; }.location-row { display: grid; grid-template-columns: minmax(120px, 1.2fr) minmax(70px, 1fr) 30px; align-items: center; gap: 10px; min-height: 34px; border-bottom: 1px solid #f0f4f7; }.location-row:last-child { border-bottom: 0; }.location-row__name { display: flex; align-items: center; min-width: 0; gap: 7px; color: #526d83; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.location-dot { width: 7px; height: 7px; flex: none; border-radius: 50%; background: #398bca; }.location-dot--red { background: #e26a64; }.location-dot--orange { background: #e7a23b; }.location-row__bar { height: 6px; overflow: hidden; background: #edf3f6; border-radius: 99px; }.location-row__bar-fill { height: 100%; background: #398bca; border-radius: 99px; }.location-row__bar-fill--red { background: #e26a64; }.location-row__bar-fill--orange { background: #e7a23b; }.location-row__count { color: #365a72; font-size: 12px; font-weight: 900; text-align: right; }
.device-list { max-height: 214px; padding: 3px 16px 8px; box-sizing: border-box; }.device-row { display: grid; grid-template-columns: minmax(120px, 1.2fr) 70px 118px 48px; align-items: center; gap: 10px; min-height: 45px; border-bottom: 1px solid #f0f4f7; }.device-row:last-child { border-bottom: 0; }.device-row__identity { min-width: 0; }.device-row__name, .device-row__number, .device-row__data { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.device-row__name { color: #355b75; font-size: 12px; font-weight: 800; }.device-row__number { margin-top: 3px; color: #9aa8b4; font-size: 10px; }.device-row__data text { display: block; color: #9aa8b4; font-size: 10px; }.device-row__data strong { display: block; margin-top: 3px; color: #45657a; font-size: 11px; font-weight: 800; }.status-tag, .level-tag { display: inline-flex; align-items: center; justify-content: center; border-radius: 99px; font-size: 10px; font-weight: 800; }.status-tag { height: 21px; padding: 0 7px; }.status-tag--green { color: #18744e; background: #eaf8ef; }.status-tag--red { color: #b42318; background: #fff0ed; }.status-tag--muted { color: #718294; background: #f0f4f7; }
.dashboard-block--table { margin-bottom: 12px; }.alarm-table { width: 100%; padding: 0 10px 8px; box-sizing: border-box; }.alarm-table__row { display: grid; grid-template-columns: 1.05fr .9fr .65fr .75fr 1fr 1.6fr; align-items: center; min-width: 720px; min-height: 39px; border-bottom: 1px solid #edf2f5; }.alarm-table__row > text { min-width: 0; padding: 0 7px; overflow: hidden; color: #526c82; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }.alarm-table__row--head { min-height: 34px; background: #f7fafc; border-bottom-color: #e5edf2; }.alarm-table__row--head > text { color: #7890a2; font-size: 10px; font-weight: 800; }.alarm-table__device { color: #246d9f !important; font-weight: 800; }.alarm-table__location { color: #71899a !important; }.level-tag { height: 20px; padding: 0 7px; }.level-tag--blue { color: #2f6fa5; background: #edf6fd; }.level-tag--orange { color: #b56f12; background: #fff6df; }.level-tag--red { color: #b42318; background: #fff0ed; }
.data-footnote { display: flex; justify-content: space-between; gap: 10px; padding: 2px 3px 0; color: #8a9aa8; font-size: 11px; line-height: 1.5; }
button::after { border: 0; }
.monitoring-board {
  display: block;
  margin-bottom: 14px;
  background: transparent;
}
.monitoring-board__outer { margin-bottom: 0; }
.monitoring-board :deep(.resizable-panels__pane > .resizable-panels) { height: 100%; }
.monitoring-board__main { min-width: 0; margin-bottom: 0; }
.monitoring-column { display: flex; flex-direction: column; gap: 14px; min-width: 0; height: 100%; }
.monitoring-column > .dashboard-block { flex: none; }
.monitoring-board .dashboard-block--trend,
.monitoring-board .dashboard-block--waveform,
.monitoring-board .dashboard-block--devices { display: flex; flex-direction: column; height: 332px; min-height: 0; }
.monitoring-board .block-head { gap: 8px; padding: 13px 14px 10px; }
.monitoring-board .block-head > view { flex: 1; }
.monitoring-board .block-title { font-weight: 700; }
.monitoring-board .block-status { max-width: 30%; text-align: right; line-height: 1.5; }
.monitoring-board .trend-chart { flex: 1; min-height: 0; height: auto; }
.monitoring-board .chart-empty { position: absolute; inset: 50% 12px auto; margin: 0; padding: 0; }
.monitoring-board .waveform-placeholder { flex: 1; min-height: 140px; }
.monitoring-board .waveform-summary { padding: 10px 14px 12px; }
.monitoring-board .dashboard-block--locations,
.monitoring-board .dashboard-block--table { flex: 1; min-height: 320px; margin-bottom: 0; }
.monitoring-board .location-list { max-height: 376px; box-sizing: border-box; }
.monitoring-board .location-row { grid-template-columns: minmax(0, 1.2fr) minmax(35px, .8fr) 26px; gap: 8px; }
.monitoring-board .location-row__name > text:last-child { overflow: hidden; text-overflow: ellipsis; }
.monitoring-board .device-list { max-height: 256px; padding: 3px 14px 8px; }
.monitoring-board .device-row { grid-template-columns: minmax(0, 1fr) 48px 48px; gap: 7px; min-height: 70px; }
.monitoring-board .device-row__identity { grid-column: 1; grid-row: 1; }
.monitoring-board .device-row__data:nth-child(2) { grid-column: 2; grid-row: 1; }
.monitoring-board .device-row__data:nth-child(3) { grid-column: 1 / 3; grid-row: 2; display: flex; gap: 6px; align-items: baseline; padding-bottom: 7px; }
.monitoring-board .device-row__data:nth-child(3) strong { margin: 0; }
.monitoring-board .device-row > .status-tag { grid-column: 3; grid-row: 1; }
.monitoring-board .alarm-table { max-height: 420px; padding: 0 14px 8px; }
.monitoring-board .alarm-table__row {
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas: 'device level' 'type status' 'time time' 'location location';
  min-width: 0;
  gap: 5px 8px;
  padding: 11px 0;
}
.monitoring-board .alarm-table__row--head { display: none; }
.monitoring-board .alarm-table__row > text { padding: 0; font-size: 12px; line-height: 1.5; }
.monitoring-board .alarm-table__row > text:nth-child(1) { grid-area: device; }
.monitoring-board .alarm-table__row > text:nth-child(2) { grid-area: type; }
.monitoring-board .alarm-table__row > text:nth-child(3) { grid-area: level; text-align: right; }
.monitoring-board .alarm-table__row > text:nth-child(4) { grid-area: status; text-align: right; }
.monitoring-board .alarm-table__row > text:nth-child(5) { grid-area: time; color: #71899a; }
.monitoring-board .alarm-table__row > text:nth-child(6) { grid-area: location; }
.monitoring-column--center :deep(.risk-map-block:not(.risk-map-block--expanded)) { flex: none; margin-bottom: 0; }
.monitoring-column--center .risk-history { margin: 0; padding: 12px 2px; }
@media (max-width: 1250px) {
  .monitoring-board .block-head { flex-wrap: wrap; }
}
@media (max-width: 1050px) {
  .monitoring-column { height: auto; }
}
@media (max-width: 680px) {
  .monitoring-board__side { display: flex; }
}
@media (min-width: 1051px) {
  .one-map-view { display: flex; flex-direction: column; height: var(--shell-content-min-height); min-height: 0; }
  .one-map-header { flex: none; grid-template-columns: minmax(0, 1fr) minmax(420px, 1fr); grid-template-rows: auto auto; align-items: end; gap: 12px 16px; padding-bottom: 16px; }
  .global-error { flex: none; }
  .one-map-view :deep(.history-results) { flex: none; }
  .page-heading { grid-column: 1; grid-row: 1; align-self: center; }
  .waveform-overlay { position: absolute; top: 12px; left: 12px; z-index: 2; width: 340px; max-width: calc(100% - 24px); opacity: .3; transition: opacity .18s ease; }
  .waveform-overlay:hover, .waveform-overlay:focus-within { opacity: 1; }
  .waveform-overlay .waveform-summary { padding: 0; gap: 8px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .waveform-overlay .waveform-summary view { min-width: 0; padding: 8px; gap: 6px; background: #fff; }
  .waveform-overlay .waveform-summary text { font-size: 12px; line-height: 1.4; overflow-wrap: anywhere; }
  .waveform-overlay .waveform-summary strong { font-size: 18px; }
  .history-query { grid-column: 1; grid-row: 2; flex-wrap: wrap; gap: 8px; padding: 0; position: relative; }
  .history-query__field { gap: 5px; flex: none; }
  .history-query__input { width: 122px; }
  .history-query__error { width: 100%; }
  .metric-grid { grid-column: 2; grid-row: 1; grid-template-columns: repeat(4, minmax(0, 1fr)); width: 100%; min-height: 126px; min-width: 0; gap: 8px; }
  .metric-card { display: flex; flex-direction: column; align-items: flex-start; justify-content: space-between; gap: 6px; min-height: 126px; padding: 12px; }
  .metric-card__label { line-height: 1.4; }
  .metric-card__value { font-size: 24px; }
  .metric-card__hint { font-size: 11px; line-height: 1.4; white-space: normal; overflow-wrap: anywhere; }
  .header-actions { grid-column: 2; grid-row: 2; flex-direction: row; justify-content: flex-end; align-items: flex-end; gap: 10px; }
  .header-actions .range-switch { height: 32px; padding-top: 0; padding-bottom: 0; align-items: center; box-sizing: border-box; }
  .header-actions .refresh-button { height: 32px; }
  .monitoring-board { flex: 1 0 734px; min-height: 734px; margin-bottom: 0; }
  .monitoring-board__outer { height: 100%; min-height: 0; }
  .monitoring-board :deep(.resizable-panels) { grid-template-rows: minmax(0, 1fr); min-height: 0; }
  .monitoring-board :deep(.resizable-panels__pane) { min-height: 0; }
  .monitoring-column { display: grid; grid-template-rows: minmax(400px, 56fr) minmax(320px, 44fr); height: 100%; min-height: 0; }
  .monitoring-column--center .dashboard-block--waveform { grid-column: 1; grid-row: 2; }
  .monitoring-column--center :deep(.risk-map-block) { grid-column: 1; grid-row: 1; }
  .monitoring-board .dashboard-block--trend,
  .monitoring-board .dashboard-block--waveform,
  .monitoring-board .dashboard-block--devices,
  .monitoring-board .dashboard-block--locations,
  .monitoring-board .dashboard-block--table { display: flex; flex-direction: column; height: 100%; min-height: 0; box-sizing: border-box; }
  .monitoring-board .block-head { min-height: 72px; box-sizing: border-box; flex: none; }
  .monitoring-board .device-list,
  .monitoring-board .location-list,
  .monitoring-board .alarm-table { flex: 1; height: 0; min-height: 0; max-height: none; }
  .monitoring-column--center :deep(.risk-map-block:not(.risk-map-block--expanded)) { height: 100%; min-height: 0; box-sizing: border-box; }
  .monitoring-column--center :deep(.risk-map-block:not(.risk-map-block--expanded) .risk-map-block__canvas) { flex: 1; width: 100%; height: auto; min-height: 0; }
  .device-row { grid-template-columns: minmax(0, 1.2fr) minmax(48px, .6fr) minmax(75px, 1fr) 48px; }
  .monitoring-board .dashboard-block--waveform .block-head,
  .monitoring-board .dashboard-block--waveform .waveform-message,
  .monitoring-board .dashboard-block--waveform .waveform-baseline { display: none; }
  .monitoring-board .waveform-placeholder { margin: 0; border: 0; border-radius: 0; }
}
.history-query select { height: 32px; min-width: 108px; border: 1px solid #cbd8e5; border-radius: 4px; color: #335b75; background: #fff; font: inherit; }
.location-row[role="button"] { cursor: pointer; border-radius: 3px; }
.location-row[role="button"]:hover { background: #f0f7fc; }
.location-row[role="button"]:focus-visible { outline: 2px solid #2187cc; outline-offset: -2px; }
@media (max-width: 1050px) { .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.dashboard-grid--top, .dashboard-grid--middle { grid-template-columns: 1fr; }.one-map-header { grid-template-columns: minmax(145px, 1fr) minmax(280px, 2fr); }.header-actions { grid-column: 1 / -1; width: 100%; flex-direction: row; justify-content: space-between; } }
@media (max-width: 680px) { .one-map-view { padding: 12px; }.metric-grid { gap: 8px; }.metric-card { padding: 12px; }.metric-card__value { font-size: 23px; }.header-actions { align-items: flex-start; flex-direction: column; }.data-footnote { flex-direction: column; }.device-row { grid-template-columns: minmax(100px, 1fr) 62px 100px 44px; gap: 6px; } }
</style>
