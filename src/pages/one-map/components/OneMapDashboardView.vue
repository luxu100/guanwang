<template>
  <view class="one-map-view">
    <view class="one-map-header">
      <view>
        <text class="page-kicker">{{ tx("在线监测总览", "ONLINE MONITORING") }}</text>
        <text class="page-title">{{ tx("一张图", "One Map") }}</text>
        <text class="page-subtitle">{{ tx("把报警、设备状态和水锤监测放在同一个工作台中查看", "View alarms, device status, and water-hammer monitoring in one workspace") }}</text>
      </view>
      <view class="header-actions">
        <view class="range-switch" role="group" :aria-label="tx('趋势时间范围', 'Trend range')">
          <button
            v-for="option in rangeOptions"
            :key="option.value"
            class="range-button"
            :class="{ 'range-button--active': rangeKey === option.value }"
            :disabled="loading"
            @click="changeRange(option.value)"
          >{{ option.label }}</button>
        </view>
        <button class="refresh-button" :disabled="loading" @click="loadDashboard">
          <image v-if="loading" class="refresh-button__loading" src="/static/icons/loadin_minior.svg" mode="aspectFit" />
          <text v-else class="refresh-button__icon">↻</text>
          <text>{{ loading ? tx("加载中", "Loading") : tx("刷新", "Refresh") }}</text>
        </button>
      </view>
    </view>

    <view v-if="globalError" class="global-error">
      <text>{{ globalError }}</text>
      <button class="error-retry" :disabled="loading" @click="loadDashboard">{{ tx("重新加载", "Retry") }}</button>
    </view>

    <view class="metric-grid" :aria-busy="loading">
      <DashboardLoading :active="loading" :label="tx('加载中', 'Loading')" />
      <view v-for="metric in metricCards" :key="metric.key" class="metric-card" :class="`metric-card--${metric.tone}`">
        <view class="metric-card__topline">
          <text class="metric-card__label">{{ metric.label }}</text>
          <text class="metric-card__mark"></text>
        </view>
        <view class="metric-card__value">{{ metric.value }}<text class="metric-card__unit">{{ metric.unit }}</text></view>
        <text class="metric-card__hint">{{ metric.hint }}</text>
      </view>
    </view>

    <view class="dashboard-grid dashboard-grid--top">
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

      <view class="dashboard-block dashboard-block--waveform">
        <view class="block-head">
          <view>
            <text class="block-title">{{ tx("水锤压力波形", "Water-hammer pressure waveform") }}</text>
            <text class="block-hint">{{ tx("当前后端只提供水锤汇总，压力采样点接口待接入", "The backend currently provides summary data only; pressure samples are pending") }}</text>
          </view>
          <text class="block-status">{{ tx("接口状态", "API status") }}</text>
        </view>
        <view class="waveform-placeholder">
          <view class="waveform-grid">
            <view v-for="line in 5" :key="line" class="waveform-grid__line"></view>
            <view class="waveform-baseline"></view>
          </view>
          <view class="waveform-message">
            <text class="waveform-message__title">{{ tx("暂无真实压力波形", "No pressure waveform yet") }}</text>
            <text class="waveform-message__text">{{ tx("收到高频压力采样点后，这里显示原始波形与异常区段。", "The raw waveform and abnormal sections will appear when high-frequency pressure samples are available.") }}</text>
          </view>
        </view>
        <view class="data-loading-region" :aria-busy="loading">
          <DashboardLoading :active="loading" :label="tx('加载中', 'Loading')" />
          <view class="waveform-summary">
            <view><text>{{ tx("监测终端", "Monitored terminals") }}</text><strong>{{ waterHammer.monitoredTerminalCount ?? "--" }}</strong></view>
            <view><text>{{ tx("水锤报警", "Water-hammer alarms") }}</text><strong>{{ waterHammer.alarmCount ?? "--" }}</strong></view>
            <view><text>{{ tx("报警率", "Alarm rate") }}</text><strong>{{ formatRate(waterHammer.alarmRate) }}</strong></view>
          </view>
        </view>
      </view>
    </view>

    <view class="dashboard-grid dashboard-grid--middle">
      <view class="dashboard-block dashboard-block--locations" :aria-busy="loading">
        <DashboardLoading :active="loading" :label="tx('加载中', 'Loading')" />
        <view class="block-head">
          <view>
            <text class="block-title">{{ tx("报警分布位置", "Alarm locations") }}</text>
            <text class="block-hint">{{ tx("颜色表示该位置的最高报警级别，条形长度表示报警数量", "Color shows the highest alarm severity at each location; bar length shows alarm count") }}</text>
          </view>
          <text class="block-count">{{ locationRows.length }} {{ tx("个位置", "locations") }}</text>
        </view>
        <view class="location-legend" :aria-label="tx('报警级别图例', 'Alarm severity legend')">
          <view><text class="location-dot location-dot--red"></text><text>{{ tx("严重", "Critical") }}</text></view>
          <view><text class="location-dot location-dot--orange"></text><text>{{ tx("警告", "Warning") }}</text></view>
          <view><text class="location-dot"></text><text>{{ tx("提示", "Info") }}</text></view>
        </view>
        <view v-if="errors.locations" class="block-error">{{ errors.locations }}</view>
        <view v-else-if="!locationRows.length" class="block-empty">{{ tx("暂无带位置的报警", "No alarm locations") }}</view>
        <view v-else class="location-list">
          <view v-for="row in locationRows" :key="row.key" class="location-row">
            <view class="location-row__name"><text class="location-dot" :class="`location-dot--${row.tone}`"></text><text :title="row.label">{{ row.label }}</text></view>
            <view class="location-row__bar"><view class="location-row__bar-fill" :class="`location-row__bar-fill--${row.tone}`" :style="{ width: `${row.ratio}%` }"></view></view>
            <text class="location-row__count">{{ row.count }}</text>
          </view>
        </view>
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
      <scroll-view v-else class="alarm-table" scroll-x>
        <view class="alarm-table__row alarm-table__row--head">
          <text>{{ tx("设备", "Device") }}</text><text>{{ tx("报警类型", "Type") }}</text><text>{{ tx("级别", "Level") }}</text><text>{{ tx("状态", "Status") }}</text><text>{{ tx("触发时间", "Triggered") }}</text><text>{{ tx("位置", "Location") }}</text>
        </view>
        <view v-for="row in alarmRows" :key="String(row.id)" class="alarm-table__row">
          <text class="alarm-table__device">{{ row.device }}</text><text>{{ row.type }}</text><text><text class="level-tag" :class="`level-tag--${row.levelTone}`">{{ row.level }}</text></text><text>{{ row.status }}</text><text>{{ row.time }}</text><text class="alarm-table__location" :title="row.location">{{ row.location }}</text>
        </view>
      </scroll-view>
    </view>

    <view class="data-footnote">
      <text>{{ tx("数据来源：报警记录、可见设备列表和水锤汇总接口。压力波形接口尚未提供，当前不生成演示波形。", "Sources: alarm records, visible devices, and the water-hammer summary API. No demo waveform is generated before a pressure waveform API is available.") }}</text>
      <text v-if="lastUpdated">{{ tx("最近刷新", "Last refreshed") }} {{ lastUpdated }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import * as echarts from "echarts";
import { useI18n } from "@/i18n";
import { getAlarmMap, getAlarmOverview, getAlarmPage, getAlarmTrend } from "@/services/alarm/api";
import { getWaterHammerSummaryT } from "@/services/leak-burst";
import { fetchLeakMonitorSidebar } from "@/services/leak-monitor/device-query";
import DashboardLoading from "./DashboardLoading.vue";

type RangeKey = "7d" | "30d" | "1y";
type Tone = "blue" | "green" | "orange" | "red" | "muted";
type RawRecord = Record<string, any>;

interface TrendRow { bucket: string; total: number; critical: number; warning: number; info: number }
interface LocationRow { key: string; label: string; count: number; ratio: number; tone: Tone }
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
const rangeKey = ref<RangeKey>("7d");
const loading = ref(false);
const globalError = ref("");
const lastUpdated = ref("");
const trend = ref<TrendRow[]>([]);
const locationRows = ref<LocationRow[]>([]);
const deviceRows = ref<DeviceRow[]>([]);
const alarmRows = ref<AlarmRow[]>([]);
const activeCount = ref<number | null>(null);
const overview = ref<RawRecord | null>(null);
const waterHammer = ref<RawRecord>({});
const trendChartEl = ref<HTMLElement | null>(null);
const errors = reactive({ trend: "", locations: "", devices: "", alarms: "" });
let trendChart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;
let disposed = false;

const rangeOptions = computed(() => [
  { value: "7d" as const, label: tx("近 7 天", "7 days") },
  { value: "30d" as const, label: tx("近 30 天", "30 days") },
  { value: "1y" as const, label: tx("近 1 年", "1 year") },
]);

const metricCards = computed(() => [
  { key: "total", label: tx("报警总数", "Total alarms"), value: overview.value?.todayTotal ?? "--", unit: tx("条", ""), hint: tx("当前统计口径的新增报警", "New alarms in the current scope"), tone: "blue" as Tone },
  { key: "active", label: tx("活跃报警", "Active alarms"), value: overview.value?.activeTotal ?? activeCount.value ?? "--", unit: tx("条", ""), hint: tx("需要关注或处理的报警", "Alarms requiring attention"), tone: "red" as Tone },
  { key: "devices", label: tx("可见设备", "Visible devices"), value: deviceRows.value.length || "--", unit: tx("台", ""), hint: tx("当前账号可见的终端数量", "Visible terminals for this account"), tone: "green" as Tone },
  { key: "communication", label: tx("通信状态", "Communication"), value: onlineDeviceCount.value, unit: tx("台在线", "online"), hint: tx("按设备最新状态统计", "Based on latest device status"), tone: "orange" as Tone },
]);

const onlineDeviceCount = computed(() => deviceRows.value.filter((item) => item.statusTone === "green").length);
const trendStatus = computed(() => loading.value ? tx("加载中", "Loading") : tx("已更新", "Updated"));
const trendTitle = computed(() => {
  if (rangeKey.value === "30d") return tx("近 30 天报警变化趋势", "30-day alarm trend");
  if (rangeKey.value === "1y") return tx("近一年报警变化趋势", "One-year alarm trend");
  return tx("近一周报警变化趋势", "Seven-day alarm trend");
});

function tx(zh: string, en: string) { return locale.value === "en-US" ? en : zh; }

function rangeDates() {
  const end = new Date();
  const start = new Date(end);
  const days = rangeKey.value === "7d" ? 6 : rangeKey.value === "30d" ? 29 : 364;
  start.setDate(start.getDate() - days);
  const date = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  return { start: date(start), end: date(end) };
}

function unwrap(response: unknown): unknown {
  if (!response || typeof response !== "object") return response;
  const record = response as RawRecord;
  if (record.code !== undefined && Number(record.code) !== 200) {
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
  return { code: 200, data: result.devices };
}

function normalizeTrend(value: unknown): TrendRow[] {
  const source = recordsFrom(value);
  return source.map((row, index) => ({
    bucket: textValue(row.bucket ?? row.date ?? row.period, String(index + 1)),
    total: numberValue(row.total ?? row.totalCount ?? row.count),
    critical: numberValue(row.critical ?? row.criticalCount),
    warning: numberValue(row.warning ?? row.warningCount),
    info: numberValue(row.info ?? row.infoCount),
  }));
}

function normalizeLocations(value: unknown): LocationRow[] {
  const source = recordsFrom(value);
  const groups = new Map<string, { label: string; count: number; level: string }>();
  source.forEach((row) => {
    const label = textValue(row.installAddress ?? row.address ?? row.deviceAlias ?? row.deviceName ?? row.deviceNumber, tx("未标注位置", "Unspecified location"));
    const current = groups.get(label) || { label, count: 0, level: "INFO" };
    current.count += 1;
    if (String(row.alarmLevel || "").toUpperCase() === "CRITICAL") current.level = "CRITICAL";
    else if (String(row.alarmLevel || "").toUpperCase() === "WARNING" && current.level !== "CRITICAL") current.level = "WARNING";
    groups.set(label, current);
  });
  const rows = Array.from(groups.entries()).map(([key, row]) => ({
    key,
    label: row.label,
    count: row.count,
    ratio: 0,
    tone: row.level === "CRITICAL" ? "red" as Tone : row.level === "WARNING" ? "orange" as Tone : "blue" as Tone,
  }));
  const max = Math.max(1, ...rows.map((row) => row.count));
  rows.forEach((row) => { row.ratio = Math.max(12, Math.round(row.count / max * 100)); });
  return rows.sort((left, right) => right.count - left.count).slice(0, 8);
}

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
  globalError.value = "";
  Object.assign(errors, { trend: "", locations: "", devices: "", alarms: "" });
  try {
    const dates = rangeDates();
    const results = await Promise.allSettled([
      getAlarmTrend({ startTime: dates.start, endTime: dates.end }),
      getAlarmOverview({ startTime: dates.start, endTime: dates.end }),
      getAlarmMap({ startTime: dates.start, endTime: dates.end }),
      getAlarmPage({ startTime: `${dates.start}T00:00:00`, endTime: `${dates.end}T23:59:59`, pageNum: 1, pageSize: 10 }),
      getLeakMonitorSidebar(),
      getWaterHammerSummaryT({ startTime: dates.start, endTime: `${dates.end}T23:59:59` } as never),
    ]);
    if (disposed) return;

    const [trendResult, overviewResult, locationsResult, alarmsResult, devicesResult, waterHammerResult] = results;
    consumeResult(trendResult, (value) => { trend.value = normalizeTrend(value); }, (reason) => { errors.trend = errorText(reason); });
    consumeResult(overviewResult, (value) => {
      overview.value = (value || {}) as RawRecord;
      activeCount.value = numberValue(overview.value.activeTotal, 0);
    }, (reason) => { globalError.value = errorText(reason); });
    consumeResult(locationsResult, (value) => { locationRows.value = normalizeLocations(value); }, (reason) => { errors.locations = errorText(reason); });
    consumeResult(alarmsResult, (value) => { alarmRows.value = normalizeAlarms(value); }, (reason) => { errors.alarms = errorText(reason); });
    consumeResult(devicesResult, (value) => { deviceRows.value = normalizeDevices(value); }, (reason) => { errors.devices = errorText(reason); });
    consumeResult(waterHammerResult, (value) => { waterHammer.value = (value || {}) as RawRecord; }, () => { /* 汇总缺失时保留波形接口占位状态。 */ });
    lastUpdated.value = new Date().toLocaleTimeString(locale.value === "en-US" ? "en-US" : "zh-CN", { hour12: false });
    await nextTick();
    renderTrendChart();
  } catch (reason) {
    if (!disposed) globalError.value = errorText(reason);
  } finally {
    loading.value = false;
  }
}

function errorText(reason: unknown) {
  return reason instanceof Error ? reason.message : tx("接口加载失败", "API request failed");
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
  if (loading.value || rangeKey.value === value) return;
  rangeKey.value = value;
  void loadDashboard();
}

function renderTrendChart() {
  if (disposed || !trendChartEl.value) return;
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
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => trendChart?.resize());
    if (trendChartEl.value) resizeObserver.observe(trendChartEl.value);
  }
});

onUnmounted(() => {
  disposed = true;
  resizeObserver?.disconnect();
  resizeObserver = null;
  trendChart?.dispose();
  trendChart = null;
});
</script>

<style scoped lang="scss">
.one-map-view { box-sizing: border-box; min-height: 100%; overflow-y: auto; padding: 18px 20px 24px; background: #eef4f8; color: #18344d; }
.one-map-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; padding: 4px 2px 18px; }
.page-kicker { display: block; color: #2c86c9; font-size: 11px; font-weight: 800; letter-spacing: 1.2px; }
.page-title { display: block; margin-top: 4px; color: #173b58; font-size: 24px; font-weight: 900; line-height: 1.2; }
.page-subtitle { display: block; margin-top: 7px; color: #71869a; font-size: 13px; }
.header-actions { display: flex; align-items: center; gap: 10px; }
.range-switch { display: flex; gap: 2px; padding: 3px; background: #e4edf4; border-radius: 5px; }
.range-button, .refresh-button, .error-retry { margin: 0; border: 1px solid transparent; border-radius: 4px; cursor: pointer; }
.range-button { height: 30px; padding: 0 11px; color: #64788c; font-size: 12px; background: transparent; }
.range-button--active { color: #1769aa; background: #fff; border-color: #d4e3ef; box-shadow: 0 1px 3px rgba(29, 73, 105, .08); font-weight: 800; }
.refresh-button { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 13px; color: #fff; font-size: 13px; background: #2187cc; border-color: #2187cc; }
.refresh-button[disabled] { opacity: .58; cursor: wait; }
.refresh-button__icon { font-size: 17px; line-height: 1; }
.refresh-button__loading { width: 17px; height: 17px; animation: minor-spin 1.05s linear infinite; }
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
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
.metric-card, .dashboard-block { background: #fff; border: 1px solid #d8e6f1; border-radius: 6px; box-shadow: 0 5px 16px rgba(35, 72, 104, .045); }
.metric-card { min-width: 0; padding: 15px 17px; border-top: 3px solid #4798d1; }
.metric-card--green { border-top-color: #25a36f; }.metric-card--orange { border-top-color: #e7a23b; }.metric-card--red { border-top-color: #e76f69; }
.metric-card__topline { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.metric-card__label { color: #60788e; font-size: 12px; font-weight: 800; }.metric-card__mark { width: 7px; height: 7px; border-radius: 50%; background: #4798d1; }.metric-card--green .metric-card__mark { background: #25a36f; }.metric-card--orange .metric-card__mark { background: #e7a23b; }.metric-card--red .metric-card__mark { background: #e76f69; }
.metric-card__value { margin-top: 10px; color: #1b6eaa; font-size: 28px; font-weight: 900; line-height: 1; font-variant-numeric: tabular-nums; }.metric-card--green .metric-card__value { color: #1e8d63; }.metric-card--orange .metric-card__value { color: #c4811e; }.metric-card--red .metric-card__value { color: #cc554e; }
.metric-card__unit { margin-left: 5px; color: #8495a5; font-size: 12px; font-weight: 600; }.metric-card__hint { display: block; margin-top: 8px; color: #91a0ae; font-size: 11px; }
.dashboard-grid { display: grid; gap: 14px; margin-bottom: 14px; }.dashboard-grid--top { grid-template-columns: minmax(0, 1.12fr) minmax(360px, .88fr); }.dashboard-grid--middle { grid-template-columns: minmax(0, .92fr) minmax(0, 1.08fr); }
.dashboard-block { min-width: 0; overflow: hidden; }.block-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 14px 16px 8px; border-bottom: 1px solid #edf3f7; }.block-title { display: block; color: #21425e; font-size: 15px; font-weight: 900; }.block-hint { display: block; margin-top: 4px; color: #8b9bab; font-size: 11px; line-height: 1.4; }.block-status, .block-count { flex: none; color: #7b8e9f; font-size: 11px; }.block-status--error { color: #c94c45; }.block-error { margin: 12px; padding: 9px 10px; font-size: 12px; }.block-empty, .chart-empty { padding: 32px 14px; color: #98a7b4; font-size: 12px; text-align: center; }
.trend-chart { height: 258px; padding: 4px 8px 8px; }.trend-chart__canvas { width: 100%; height: 100%; }.chart-empty { margin-top: -170px; position: relative; pointer-events: none; }
.waveform-placeholder { position: relative; min-height: 258px; margin: 8px 14px 0; overflow: hidden; background: #f8fbfd; border: 1px solid #e7eef3; border-radius: 4px; }.waveform-grid { position: absolute; inset: 22px 18px 30px; }.waveform-grid__line { height: 25%; border-top: 1px dashed #dce8ef; }.waveform-baseline { position: absolute; top: 52%; right: 0; left: 0; border-top: 1px solid #b7d0df; }.waveform-message { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 7px; padding: 20px; text-align: center; }.waveform-message__title { color: #59758b; font-size: 14px; font-weight: 800; }.waveform-message__text { max-width: 310px; color: #91a1af; font-size: 11px; line-height: 1.6; }.waveform-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 12px 14px 14px; }.waveform-summary view { display: flex; flex-direction: column; gap: 4px; padding: 8px 10px; background: #f7fafc; border: 1px solid #e8eff4; border-radius: 4px; }.waveform-summary text { color: #8294a3; font-size: 11px; }.waveform-summary strong { color: #335b75; font-size: 16px; font-weight: 900; }
.location-list { padding: 7px 16px 13px; }.location-row { display: grid; grid-template-columns: minmax(120px, 1.2fr) minmax(70px, 1fr) 30px; align-items: center; gap: 10px; min-height: 34px; border-bottom: 1px solid #f0f4f7; }.location-row:last-child { border-bottom: 0; }.location-row__name { display: flex; align-items: center; min-width: 0; gap: 7px; color: #526d83; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.location-dot { width: 7px; height: 7px; flex: none; border-radius: 50%; background: #398bca; }.location-dot--red { background: #e26a64; }.location-dot--orange { background: #e7a23b; }.location-row__bar { height: 6px; overflow: hidden; background: #edf3f6; border-radius: 99px; }.location-row__bar-fill { height: 100%; background: #398bca; border-radius: 99px; }.location-row__bar-fill--red { background: #e26a64; }.location-row__bar-fill--orange { background: #e7a23b; }.location-row__count { color: #365a72; font-size: 12px; font-weight: 900; text-align: right; }
.device-list { max-height: 214px; padding: 3px 16px 8px; box-sizing: border-box; }.device-row { display: grid; grid-template-columns: minmax(120px, 1.2fr) 70px 118px 48px; align-items: center; gap: 10px; min-height: 45px; border-bottom: 1px solid #f0f4f7; }.device-row:last-child { border-bottom: 0; }.device-row__identity { min-width: 0; }.device-row__name, .device-row__number, .device-row__data { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.device-row__name { color: #355b75; font-size: 12px; font-weight: 800; }.device-row__number { margin-top: 3px; color: #9aa8b4; font-size: 10px; }.device-row__data text { display: block; color: #9aa8b4; font-size: 10px; }.device-row__data strong { display: block; margin-top: 3px; color: #45657a; font-size: 11px; font-weight: 800; }.status-tag, .level-tag { display: inline-flex; align-items: center; justify-content: center; border-radius: 99px; font-size: 10px; font-weight: 800; }.status-tag { height: 21px; padding: 0 7px; }.status-tag--green { color: #18744e; background: #eaf8ef; }.status-tag--red { color: #b42318; background: #fff0ed; }.status-tag--muted { color: #718294; background: #f0f4f7; }
.dashboard-block--table { margin-bottom: 12px; }.alarm-table { width: 100%; padding: 0 10px 8px; box-sizing: border-box; }.alarm-table__row { display: grid; grid-template-columns: 1.05fr .9fr .65fr .75fr 1fr 1.6fr; align-items: center; min-width: 720px; min-height: 39px; border-bottom: 1px solid #edf2f5; }.alarm-table__row > text { min-width: 0; padding: 0 7px; overflow: hidden; color: #526c82; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }.alarm-table__row--head { min-height: 34px; background: #f7fafc; border-bottom-color: #e5edf2; }.alarm-table__row--head > text { color: #7890a2; font-size: 10px; font-weight: 800; }.alarm-table__device { color: #246d9f !important; font-weight: 800; }.alarm-table__location { color: #71899a !important; }.level-tag { height: 20px; padding: 0 7px; }.level-tag--blue { color: #2f6fa5; background: #edf6fd; }.level-tag--orange { color: #b56f12; background: #fff6df; }.level-tag--red { color: #b42318; background: #fff0ed; }
.data-footnote { display: flex; justify-content: space-between; gap: 10px; padding: 2px 3px 0; color: #8a9aa8; font-size: 11px; line-height: 1.5; }
button::after { border: 0; }
@media (max-width: 1050px) { .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.dashboard-grid--top, .dashboard-grid--middle { grid-template-columns: 1fr; }.one-map-header { align-items: flex-start; flex-direction: column; }.header-actions { width: 100%; justify-content: space-between; } }
@media (max-width: 680px) { .one-map-view { padding: 12px; }.metric-grid { gap: 8px; }.metric-card { padding: 12px; }.metric-card__value { font-size: 23px; }.header-actions { align-items: flex-start; flex-direction: column; }.data-footnote { flex-direction: column; }.device-row { grid-template-columns: minmax(100px, 1fr) 62px 100px 44px; gap: 6px; } }
</style>
