<template>
  <view v-if="visible && device" class="detail-mask">
    <view class="detail-dialog" @click.stop>
      <view class="detail-header" :class="'detail-header--' + device.status">
        <view class="detail-header__title">
          <text class="detail-header__number">{{ device.deviceNumber }}</text>
          <text class="detail-header__meta">设备 ID：{{ device.id }}</text>
          <text class="detail-header__status">{{ device.statusText }}</text>
        </view>
        <button class="detail-header__close" type="button" aria-label="关闭设备详情" @click="$emit('close')">×</button>
      </view>

      <view class="tab-row">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-button"
          :class="{ active: activeTab === tab.key }"
          type="button"
          @click="selectTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </view>

      <scroll-view class="detail-body" scroll-y>
        <view v-if="loading" class="dialog-state">设备详情加载中...</view>

        <template v-else>
          <view v-if="activeTab === 'noise'" class="tab-content">
            <view class="analysis-toolbar">
              <text class="analysis-toolbar__label">解析音频时间</text>
              <picker mode="date" :value="noiseRange.start" :end="noiseRange.end" @change="noiseRange.start = String($event.detail.value)">
                <view class="date-field">{{ noiseRange.start }}</view>
              </picker>
              <text>至</text>
              <picker mode="date" :value="noiseRange.end" :start="noiseRange.start" @change="noiseRange.end = String($event.detail.value)">
                <view class="date-field">{{ noiseRange.end }}</view>
              </picker>
              <button class="small-button" :disabled="detail.analysisLoading" @click="refreshAnalysis">
                {{ detail.analysisLoading ? "加载中" : "查询" }}
              </button>
              <text class="analysis-toolbar__spacer"></text>
              <text class="audio-summary">
                {{ detail.latestAudio ? "最新音频 ID：" + detail.latestAudio.audioId : "该时间段暂无解析成功的音频" }}
              </text>
              <button class="small-button small-button--ghost" :disabled="!detail.latestAudio" @click="$emit('download-audio')">下载 WAV</button>
            </view>

            <view class="audio-trend-row">
              <view class="audio-player">
                <!-- #ifdef H5 -->
                <component :is="'audio'" v-if="detail.audioUrl" class="audio-player__control" :src="detail.audioUrl" controls preload="metadata"></component>
                <!-- #endif -->
                <!-- #ifndef H5 -->
                <text>音频播放请在 H5 端使用</text>
                <!-- #endif -->
                <text v-if="audioAnalysis" class="audio-player__meta">
                  {{ audioAnalysis.sampleRate }} Hz · {{ audioAnalysis.duration }} 秒
                </text>
              </view>
              <view class="trend-chips">
                <view
                  v-for="item in recentTrend"
                  :key="item.date"
                  class="trend-chip"
                  :class="trendTone(item.leakEsa)"
                  :title="item.date"
                >
                  <text class="trend-chip__value">{{ item.leakEsa ?? "-" }}</text>
                  <text class="trend-chip__date">{{ item.date.slice(5) }}</text>
                </view>
              </view>
            </view>

            <view v-if="detail.analysisLoading" class="inline-state">正在获取并解析最新 WAV 音频...</view>
            <view v-else-if="audioAnalysis" class="chart-grid">
              <DeviceSpectrumChart
                title="时域幅度图"
                mode="waveform"
                :data="audioAnalysis.waveform"
                :labels="waveformLabels"
              />
              <DeviceSpectrumChart
                title="频率幅度图"
                mode="spectrum"
                :data="audioAnalysis.spectrum"
                :labels="spectrumLabels"
              />
              <DeviceSpectrumChart
                class="chart-grid__wide"
                title="时频谱图"
                mode="spectrogram"
                :matrix="audioAnalysis.spectrogram"
              />
            </view>
            <view v-else class="dialog-state dialog-state--compact">请选择有解析成功音频的时间范围</view>
          </view>

          <view v-else-if="activeTab === 'history'" class="tab-content">
            <view class="analysis-toolbar">
              <text class="analysis-toolbar__label">历史范围</text>
              <picker mode="date" :value="historyRange.start" :end="historyRange.end" @change="historyRange.start = String($event.detail.value)">
                <view class="date-field">{{ historyRange.start }}</view>
              </picker>
              <text>至</text>
              <picker mode="date" :value="historyRange.end" :start="historyRange.start" @change="historyRange.end = String($event.detail.value)">
                <view class="date-field">{{ historyRange.end }}</view>
              </picker>
              <button class="small-button" :disabled="detail.historyLoading" @click="loadHistory">
                {{ detail.historyLoading ? "分析中" : "查询" }}
              </button>
              <text class="analysis-toolbar__spacer"></text>
              <button class="view-toggle" :class="{ active: historyChartMode === 'trend-bar' }" @click="historyChartMode = 'trend-bar'">柱状</button>
              <button class="view-toggle" :class="{ active: historyChartMode === 'trend-line' }" @click="historyChartMode = 'trend-line'">曲线</button>
            </view>

            <view v-if="detail.historyLoading" class="inline-state">正在遍历每日最新音频并生成历史频谱...</view>
            <view class="history-grid">
              <DeviceSpectrumChart
                title="历史特征值"
                :mode="historyChartMode"
                :data="historyValues"
                :labels="historyLabels"
              />
              <DeviceSpectrumChart
                title="每日频谱三维层叠图"
                mode="history3d"
                :series="dailySeries"
                :labels="dailyFrequencyLabels"
              />
            </view>
          </view>

          <view v-else-if="activeTab === 'detail'" class="tab-content">
            <view class="section-title">设备信息</view>
            <view class="field-grid">
              <view v-for="item in detailFields" :key="item.label" class="field-item">
                <text class="field-item__label">{{ item.label }}</text>
                <text class="field-item__value">{{ item.value }}</text>
              </view>
            </view>
          </view>

          <view v-else class="tab-content">
            <view class="maintenance-summary">
              <view class="maintenance-stat">
                <text class="maintenance-stat__value">{{ uninstallCount }}</text>
                <text class="maintenance-stat__label">拆卸总次数</text>
              </view>
              <view class="maintenance-stat maintenance-stat--install">
                <text class="maintenance-stat__value">{{ installCount }}</text>
                <text class="maintenance-stat__label">安装总次数</text>
              </view>
              <text class="maintenance-summary__total">共 {{ detail.maintenance.length }} 条维护记录</text>
            </view>

            <view class="maintenance-table">
              <view class="maintenance-table__row maintenance-table__head">
                <text>维护类型</text>
                <text>维护时间</text>
                <text>维护地址</text>
              </view>
              <view v-for="record in maintenancePageRecords" :key="String(record.id) + String(record.operationTime)" class="maintenance-table__row">
                <text>{{ maintenanceTypeLabel(record.maintainType) }}</text>
                <text>{{ displayValue(record.operationTime) }}</text>
                <text :title="displayValue(record.installAddress)">{{ displayValue(record.installAddress) }}</text>
              </view>
              <view v-if="detail.maintenanceLoading" class="inline-state">维护记录加载中...</view>
              <view v-else-if="!detail.maintenance.length" class="dialog-state dialog-state--compact">暂无维护记录</view>
            </view>
            <view class="maintenance-pagination">
              <button :disabled="maintenancePage <= 1" @click="maintenancePage -= 1">上一页</button>
              <text>{{ maintenancePage }} / {{ maintenanceTotalPages }}</text>
              <button :disabled="maintenancePage >= maintenanceTotalPages" @click="maintenancePage += 1">下一页</button>
            </view>
          </view>

          <view v-if="detail.errorMessage" class="detail-error">{{ detail.errorMessage }}</view>
        </template>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type {
  DateRangeValue,
  DeviceDetailState,
  FeatureTrendPoint,
  LeakMonitorDevice,
} from "../types";
import DeviceSpectrumChart from "./DeviceSpectrumChart.vue";

const props = defineProps<{
  visible: boolean;
  loading: boolean;
  device: LeakMonitorDevice | null;
  detail: DeviceDetailState;
}>();

const emit = defineEmits<{
  (event: "close"): void;
  (event: "refresh-analysis", range: DateRangeValue): void;
  (event: "load-history", range: DateRangeValue): void;
  (event: "download-audio"): void;
}>();

const tabs = [
  { key: "noise", label: "噪声分析" },
  { key: "history", label: "历史数据" },
  { key: "detail", label: "设备详情" },
  { key: "maintenance", label: "维护记录" },
] as const;
type TabKey = typeof tabs[number]["key"];

const activeTab = ref<TabKey>("noise");
const noiseRange = ref(createRecentRange(3));
const historyRange = ref(createRecentRange(7));
const historyChartMode = ref<"trend-bar" | "trend-line">("trend-bar");
const maintenancePage = ref(1);
const maintenancePageSize = 6;

watch(() => props.visible, (visible) => {
  if (!visible) return;
  activeTab.value = "noise";
  noiseRange.value = createRecentRange(3);
  historyRange.value = createRecentRange(7);
  maintenancePage.value = 1;
});
watch(() => props.detail.maintenance.length, () => {
  maintenancePage.value = Math.min(maintenancePage.value, maintenanceTotalPages.value);
});

const audioAnalysis = computed(() => props.detail.audioAnalysis);
const waveformLabels = computed(() => buildAxisLabels(
  audioAnalysis.value?.waveform.length || 0,
  audioAnalysis.value?.duration || 0,
  "s",
));
const spectrumLabels = computed(() => buildAxisLabels(
  audioAnalysis.value?.spectrum.length || 0,
  (audioAnalysis.value?.sampleRate || 0) / 2,
  "Hz",
));

const recentTrend = computed(() => {
  const byDate = new Map(props.detail.trend.map((item) => [item.date, item]));
  const end = new Date(noiseRange.value.end + "T00:00:00");
  return Array.from({ length: 7 }, (_, reverseIndex) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (6 - reverseIndex));
    const key = formatDate(date);
    return byDate.get(key) || { date: key, leakEsa: null };
  });
});
const historyPoints = computed(() => props.detail.trend.filter((item): item is FeatureTrendPoint & { leakEsa: number } => typeof item.leakEsa === "number"));
const historyLabels = computed(() => historyPoints.value.map((item) => item.date));
const historyValues = computed(() => historyPoints.value.map((item) => item.leakEsa));
const dailySeries = computed(() => props.detail.dailyAudio.map((item) => ({ name: item.date, data: item.spectrum })));
const dailyFrequencyLabels = computed(() => {
  const length = props.detail.dailyAudio[0]?.spectrum.length || 0;
  return buildAxisLabels(length, (audioAnalysis.value?.sampleRate || 4096) / 2, "Hz");
});

const detailFields = computed(() => {
  const info = props.detail.info || {};
  return [
    field("算法版本", info.algorithmVersion),
    field("位置坐标", info.coordinate),
    field("所属分区", info.deptNames),
    field("设备状态", statusLabel(info.deviceStatus, "在线", "离线")),
    field("安装地址", info.installAddress),
    field("安装状态", statusLabel(info.installState, "已安装", "未安装")),
    field("管道口径", info.tubeBore),
    field("管道材质", info.tubeMaterial),
    field("管道编号", info.tubeNumber),
    field("阀门编号", info.valveNumber),
    field("接收时间", info.lastSamplingTime),
    field("观测天数", info.measureDays),
    field("信号强度", info.signalIntensity),
    field("硬件版本", info.hardwareVersion),
    field("电池电压", info.batteryVoltage),
    field("固件版本", info.firmwareVersion),
    field("IMEI", info.nbgsm4gimei),
    field("IMSI", info.nbgsm4gimsi),
  ];
});

const uninstallCount = computed(() => props.detail.maintenance.filter((item) => item.maintainType === 0).length);
const installCount = computed(() => props.detail.maintenance.filter((item) => item.maintainType === 1).length);
const maintenanceTotalPages = computed(() => Math.max(1, Math.ceil(props.detail.maintenance.length / maintenancePageSize)));
const maintenancePageRecords = computed(() => {
  const start = (maintenancePage.value - 1) * maintenancePageSize;
  return props.detail.maintenance.slice(start, start + maintenancePageSize);
});

function createRecentRange(days: number): DateRangeValue {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - Math.max(0, days - 1));
  return { start: formatDate(start), end: formatDate(end) };
}
function formatDate(date: Date) {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 10);
}
function buildAxisLabels(length: number, maximum: number, suffix: string) {
  return Array.from({ length }, (_, index) => {
    if (!length || index % Math.max(1, Math.floor(length / 8)) !== 0) return "";
    return Math.round((index * maximum) / Math.max(1, length - 1)) + suffix;
  });
}
function field(label: string, value: unknown) {
  return { label, value: displayValue(value) };
}
function displayValue(value: unknown) {
  return value === undefined || value === null || value === "" ? "-" : String(value);
}
function statusLabel(value: unknown, enabled: string, disabled: string) {
  if (Number(value) === 1) return enabled;
  if (Number(value) === 0) return disabled;
  return "-";
}
function trendTone(value: number | null) {
  if (value === null) return "trend-chip--empty";
  if (value >= 20) return "trend-chip--danger";
  if (value >= 10) return "trend-chip--warning";
  return "trend-chip--success";
}
function maintenanceTypeLabel(value: number) {
  return ["拆卸", "安装", "维护", "巡检"][value] || "未知";
}
function refreshAnalysis() {
  emit("refresh-analysis", { ...noiseRange.value });
}
function loadHistory() {
  emit("load-history", { ...historyRange.value });
}
function selectTab(tab: TabKey) {
  activeTab.value = tab;
  if (tab === "history" && !props.detail.dailyAudio.length && !props.detail.historyLoading) {
    loadHistory();
  }
}
</script>

<style scoped lang="scss">
.detail-mask {
  position: absolute;
  top: 18px;
  right: 650px;
  bottom: 18px;
  left: 18px;
  z-index: 40;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  pointer-events: none;
}
.detail-dialog {
  display: flex;
  flex-direction: column;
  width: min(1040px, 100%);
  height: 100%;
  overflow: hidden;
  pointer-events: auto;
  background: #fff;
  border: 1px solid #cbd8e5;
  border-radius: 8px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.24);
}
.detail-header {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 45px;
  padding: 0 14px;
  color: #fff;
  background: #64748b;
}
.detail-header--normal { background: #00a870; }
.detail-header--suspect { background: #f59e0b; }
.detail-header--leak { background: #ef4444; }
.detail-header__title { display: flex; align-items: center; gap: 12px; min-width: 0; }
.detail-header__number { overflow: hidden; font-size: 18px; font-weight: 900; text-overflow: ellipsis; white-space: nowrap; }
.detail-header__meta { font-size: 12px; font-weight: 700; opacity: .9; }
.detail-header__status { padding: 3px 10px; font-size: 12px; font-weight: 900; background: rgba(255,255,255,.2); border-radius: 12px; }
.detail-header__close { width: 32px; height: 32px; margin: 0; padding: 0; color: #fff; font-size: 26px; line-height: 30px; background: transparent; border: 0; }
.detail-header__close::after,
.tab-button::after,
.small-button::after,
.view-toggle::after,
.maintenance-pagination button::after { border: 0; }

.tab-row { flex: none; display: flex; gap: 4px; padding: 8px 10px; background: #f8fafc; border-bottom: 1px solid #d8e5ef; }
.tab-button { height: 31px; margin: 0; padding: 0 14px; color: #26384d; font-size: 13px; font-weight: 800; line-height: 30px; background: #fff; border: 1px solid #d8e5ef; border-radius: 4px; }
.tab-button.active { color: #fff; background: #0ea5e9; border-color: #0ea5e9; }
.detail-body { flex: 1; min-height: 0; background: #f8fafc; }
.tab-content { padding: 10px; }

.analysis-toolbar { display: flex; align-items: center; gap: 8px; min-height: 36px; margin-bottom: 10px; color: #475569; font-size: 12px; }
.analysis-toolbar__label { color: #25364c; font-weight: 800; }
.analysis-toolbar__spacer { flex: 1; }
.date-field { min-width: 94px; height: 30px; padding: 0 9px; line-height: 30px; background: #fff; border: 1px solid #cbd8e5; border-radius: 4px; }
.small-button,
.view-toggle { height: 30px; margin: 0; padding: 0 12px; color: #fff; font-size: 12px; font-weight: 800; line-height: 30px; background: #0ea5e9; border: 0; border-radius: 4px; }
.small-button--ghost { color: #075985; background: #e0f2fe; }
.small-button[disabled] { opacity: .55; }
.view-toggle { padding: 0 9px; color: #52677d; background: #e8eef4; border-radius: 0; }
.view-toggle.active { color: #fff; background: #0ea5e9; }
.audio-summary { color: #64748b; font-size: 11px; }

.audio-trend-row { display: grid; grid-template-columns: minmax(220px, .7fr) minmax(420px, 1.3fr); gap: 10px; margin-bottom: 10px; }
.audio-player { display: flex; align-items: center; gap: 10px; min-height: 62px; padding: 8px 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 5px; }
.audio-player__control { width: 100%; height: 36px; }
.audio-player__meta { color: #64748b; font-size: 11px; white-space: nowrap; }
.trend-chips { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
.trend-chip { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 0; min-height: 62px; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 5px; }
.trend-chip--warning { color: #b45309; background: #fffbeb; border-color: #fde68a; }
.trend-chip--danger { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }
.trend-chip--empty { color: #64748b; background: #f8fafc; border-color: #e2e8f0; }
.trend-chip__value { font-size: 16px; font-weight: 900; }
.trend-chip__date { margin-top: 3px; font-size: 10px; }

.chart-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.chart-grid__wide { grid-column: 1 / -1; }
.history-grid { display: grid; gap: 10px; }
.inline-state { padding: 12px; color: #64748b; font-size: 12px; text-align: center; background: #fff; border: 1px dashed #cbd5e1; border-radius: 5px; }
.dialog-state { display: flex; align-items: center; justify-content: center; min-height: 220px; padding: 40px; color: #64748b; font-size: 14px; text-align: center; }
.dialog-state--compact { min-height: 100px; padding: 20px; }

.section-title { margin-bottom: 8px; color: #1e293b; font-size: 15px; font-weight: 900; }
.field-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px 10px; }
.field-item { min-width: 0; padding: 11px 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 5px; }
.field-item__label,
.field-item__value { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.field-item__label { color: #64748b; font-size: 11px; font-weight: 800; }
.field-item__value { margin-top: 6px; color: #1e293b; font-size: 13px; font-weight: 700; }

.maintenance-summary { display: flex; align-items: stretch; gap: 10px; margin-bottom: 10px; }
.maintenance-stat { min-width: 130px; padding: 10px 14px; color: #b45309; background: #fffbeb; border: 1px solid #fde68a; border-radius: 5px; }
.maintenance-stat--install { color: #047857; background: #ecfdf5; border-color: #a7f3d0; }
.maintenance-stat__value { display: block; font-size: 20px; font-weight: 900; }
.maintenance-stat__label { display: block; margin-top: 3px; font-size: 11px; font-weight: 800; }
.maintenance-summary__total { align-self: center; margin-left: auto; color: #64748b; font-size: 12px; }
.maintenance-table { overflow: hidden; background: #fff; border: 1px solid #d8e5ef; border-radius: 5px; }
.maintenance-table__row { display: grid; grid-template-columns: 120px 190px minmax(240px, 1fr); min-height: 44px; color: #334155; font-size: 13px; line-height: 44px; border-bottom: 1px solid #edf2f7; }
.maintenance-table__row > text { min-width: 0; padding: 0 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.maintenance-table__head { min-height: 38px; color: #1e293b; font-weight: 900; line-height: 38px; background: #f1f5f9; }
.maintenance-pagination { display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-top: 10px; color: #64748b; font-size: 12px; }
.maintenance-pagination button { height: 28px; margin: 0; padding: 0 12px; color: #31506d; font-size: 12px; line-height: 28px; background: #fff; border: 1px solid #cbd8e5; border-radius: 4px; }
.maintenance-pagination button[disabled] { opacity: .45; }
.detail-error { margin-top: 10px; padding: 8px 10px; color: #b42318; font-size: 12px; background: #fff1ee; border: 1px solid #ffd3cb; border-radius: 4px; }

@media (max-width: 1500px) {
  .detail-mask { right: 638px; left: 10px; }
  .audio-trend-row { grid-template-columns: 1fr; }
}
@media (max-width: 1150px) {
  .detail-mask { top: 10px; right: 10px; bottom: 10px; left: 10px; justify-content: center; }
  .detail-dialog { width: min(900px, 100%); }
  .field-grid,
  .chart-grid { grid-template-columns: 1fr; }
  .chart-grid__wide { grid-column: auto; }
}
</style>