<template>
  <view
    v-if="visible && device"
    class="detail-mask"
    :class="{ 'detail-mask--sidebar-collapsed': sidebarCollapsed }"
  >
    <view class="detail-dialog" @click.stop>
      <view class="detail-header" :class="'detail-header--' + device.status">
        <view class="detail-header__title">
          <text class="detail-header__number">{{ device.deviceNumber }}</text>
          <text class="detail-header__meta">{{ t("deviceId") }}: {{ device.id }}</text>
          <text class="detail-header__status">{{ translatedStatus }}</text>
        </view>
        <button class="detail-header__close" type="button" :aria-label="t('closeDetail')" @click="$emit('close')">×</button>
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
        <view v-if="loading" class="dialog-state">{{ t("detailLoading") }}</view>

        <template v-else>
          <view v-if="activeTab === 'noise'" class="tab-content">
            <view class="analysis-toolbar">
              <text class="analysis-toolbar__label">{{ t("audioTime") }}</text>
              <picker mode="date" :value="noiseRange.start" :end="noiseRange.end" @change="noiseRange.start = String($event.detail.value)">
                <view class="date-field">{{ noiseRange.start }}</view>
              </picker>
              <text>{{ t("to") }}</text>
              <picker mode="date" :value="noiseRange.end" :start="noiseRange.start" @change="noiseRange.end = String($event.detail.value)">
                <view class="date-field">{{ noiseRange.end }}</view>
              </picker>
              <button class="small-button" :disabled="detail.analysisLoading" @click="refreshAnalysis">
                {{ detail.analysisLoading ? t("loading") : t("search") }}
              </button>
              <text class="analysis-toolbar__spacer"></text>
              <text class="audio-summary">
                {{ detail.latestAudio ? t("latestAudioId", { value: detail.latestAudio.audioId }) : t("noAudio") }}
              </text>
              <button class="small-button small-button--ghost" :disabled="!detail.latestAudio" @click="$emit('download-audio')">{{ t("downloadWav") }}</button>
            </view>

            <view class="audio-trend-row">
              <view class="audio-player">
                <!-- #ifdef H5 -->
                <component :is="'audio'" v-if="detail.audioUrl" class="audio-player__control" :src="detail.audioUrl" controls preload="metadata"></component>
                <!-- #endif -->
                <!-- #ifndef H5 -->
                <text>{{ t("audioH5Only") }}</text>
                <!-- #endif -->
                <text v-if="audioAnalysis" class="audio-player__meta">
                  {{ t("audioMeta", { rate: audioAnalysis.sampleRate, duration: audioAnalysis.duration }) }}
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

            <view v-if="detail.analysisLoading" class="inline-state">{{ t("analyzingAudio") }}</view>
            <view v-else-if="audioAnalysis" class="chart-grid">
              <DeviceSpectrumChart
                :title="language === 'en-US' ? 'Time-domain amplitude' : '时域幅度图'"
                mode="waveform"
                :data="audioAnalysis.waveform"
                :x-maximum="audioAnalysis.duration"
              />
              <DeviceSpectrumChart
                :title="language === 'en-US' ? 'Frequency amplitude' : '频率幅度图'"
                mode="spectrum"
                :data="audioAnalysis.spectrum"
                :x-maximum="audioAnalysis.sampleRate / 2"
              />
              <DeviceSpectrumChart
                class="chart-grid__wide"
                :title="language === 'en-US' ? 'Spectrogram' : '时频谱图'"
                mode="spectrogram"
                :matrix="audioAnalysis.spectrogram"
                :x-maximum="audioAnalysis.duration"
                :y-maximum="audioAnalysis.sampleRate / 2"
              />
            </view>
            <view v-else class="dialog-state dialog-state--compact">{{ t("selectAudioRange") }}</view>
            <view v-if="detail.analysisError" class="detail-error">{{ detail.analysisError }}</view>
          </view>

          <view v-else-if="activeTab === 'history'" class="tab-content">
            <view class="analysis-toolbar">
              <text class="analysis-toolbar__label">{{ t("historyRange") }}</text>
              <picker mode="date" :value="historyRange.start" :end="historyRange.end" @change="historyRange.start = String($event.detail.value)">
                <view class="date-field">{{ historyRange.start }}</view>
              </picker>
              <text>{{ t("to") }}</text>
              <picker mode="date" :value="historyRange.end" :start="historyRange.start" @change="historyRange.end = String($event.detail.value)">
                <view class="date-field">{{ historyRange.end }}</view>
              </picker>
              <button class="small-button" :disabled="detail.historyLoading" @click="loadHistory">
                {{ detail.historyLoading ? t("analyzing") : t("search") }}
              </button>
              <text class="analysis-toolbar__spacer"></text>
              <button class="view-toggle" :class="{ active: historyChartMode === 'trend-bar' }" @click="historyChartMode = 'trend-bar'">{{ t("bar") }}</button>
              <button class="view-toggle" :class="{ active: historyChartMode === 'trend-line' }" @click="historyChartMode = 'trend-line'">{{ t("line") }}</button>
            </view>

            <view v-if="detail.historyLoading" class="inline-state">{{ t("loadingHistory") }}</view>
            <view class="history-grid">
              <DeviceSpectrumChart
                :title="t('historyFeature')"
                :mode="historyChartMode"
                :data="historyValues"
                :labels="historyLabels"
              />
              <DeviceSpectrumChart
                :title="t('dailySpectrum')"
                mode="history3d"
                :series="dailySeries"
              />
            </view>
            <view v-if="detail.historyError" class="detail-error">{{ detail.historyError }}</view>
          </view>

          <view v-else-if="activeTab === 'detail'" class="tab-content">
            <view class="section-title">{{ t("deviceInfo") }}</view>
            <view class="field-grid">
              <view v-for="item in detailFields" :key="item.label" class="field-item">
                <text class="field-item__label">{{ item.label }}</text>
                <text class="field-item__value">{{ item.value }}</text>
              </view>
            </view>
            <view v-if="detail.detailError" class="detail-error">{{ detail.detailError }}</view>
          </view>

          <view v-else-if="activeTab === 'maintenance'" class="tab-content">
            <view class="maintenance-summary">
              <view class="maintenance-stat">
                <text class="maintenance-stat__value">{{ uninstallCount }}</text>
                <text class="maintenance-stat__label">{{ t("uninstallCount") }}</text>
              </view>
              <view class="maintenance-stat maintenance-stat--install">
                <text class="maintenance-stat__value">{{ installCount }}</text>
                <text class="maintenance-stat__label">{{ t("installCount") }}</text>
              </view>
              <text class="maintenance-summary__total">{{ t("maintenanceTotal", { value: detail.maintenance.length }) }}</text>
            </view>

            <view class="maintenance-table">
              <view class="maintenance-table__row maintenance-table__head">
                <text>{{ t("maintenanceType") }}</text>
                <text>{{ t("maintenanceTime") }}</text>
                <text>{{ t("maintenanceAddress") }}</text>
              </view>
              <view v-for="record in maintenancePageRecords" :key="String(record.id) + String(record.operationTime)" class="maintenance-table__row">
                <text>{{ maintenanceTypeLabel(record.maintainType) }}</text>
                <text>{{ displayValue(record.operationTime) }}</text>
                <text :title="displayValue(record.installAddress)">{{ displayValue(record.installAddress) }}</text>
              </view>
              <view v-if="detail.maintenanceLoading" class="inline-state">{{ t("maintenanceLoading") }}</view>
              <view v-else-if="!detail.maintenance.length" class="dialog-state dialog-state--compact">{{ t("noMaintenance") }}</view>
            </view>
            <view class="maintenance-pagination">
              <button :disabled="maintenancePage <= 1" @click="maintenancePage -= 1">{{ t("previousPage") }}</button>
              <text>{{ maintenancePage }} / {{ maintenanceTotalPages }}</text>
              <button :disabled="maintenancePage >= maintenanceTotalPages" @click="maintenancePage += 1">{{ t("nextPage") }}</button>
            </view>
            <view v-if="detail.maintenanceError" class="detail-error">{{ detail.maintenanceError }}</view>
          </view>

          <view v-else-if="activeTab === 'manual'" class="tab-content">
            <view class="section-title section-title--accent">{{ t("manualResult") }}</view>
            <view class="manual-layout">
              <view class="manual-form">
                <view class="form-row">
                  <text class="form-label">{{ t("manualJudgement") }}</text>
                  <picker
                    class="form-control"
                    :range="manualJudgementOptions"
                    range-key="label"
                    :value="manualJudgementIndex"
                    @change="manualJudgementIndex = Number($event.detail.value)"
                  >
                    <view class="form-picker">{{ manualJudgementOptions[manualJudgementIndex].label }}</view>
                  </picker>
                </view>
                <view class="form-row">
                  <text class="form-label">{{ t("troubleshootingFeedback") }}</text>
                  <picker
                    class="form-control"
                    :range="feedbackOptions"
                    range-key="label"
                    :value="feedbackIndex"
                    @change="feedbackIndex = Number($event.detail.value)"
                  >
                    <view class="form-picker">{{ feedbackOptions[feedbackIndex].label }}</view>
                  </picker>
                </view>
                <view class="form-row">
                  <text class="form-label">{{ t("resetDate") }}</text>
                  <picker mode="date" :value="manualForm.resetDate" @change="manualForm.resetDate = String($event.detail.value)">
                    <view class="form-picker">{{ manualForm.resetDate }}</view>
                  </picker>
                </view>
                <view class="form-row form-row--wide">
                  <text class="form-label">{{ t("reasonAnalysis") }}</text>
                  <textarea
                    v-model="manualForm.reasonAnalysis"
                    class="form-textarea"
                    :placeholder="t('reasonPlaceholder')"
                    placeholder-class="input-placeholder"
                  />
                </view>
              </view>

              <view class="manual-audio">
                <text class="manual-audio__title">{{ t("originalNoise") }}</text>
                <!-- #ifdef H5 -->
                <component :is="'audio'" v-if="detail.audioUrl" class="audio-player__control" :src="detail.audioUrl" controls preload="metadata"></component>
                <!-- #endif -->
                <view v-if="audioAnalysis" class="manual-spectrum">
                  <DeviceSpectrumChart
                    :title="language === 'en-US' ? 'Original spectrum' : '原始频谱'"
                    mode="spectrum"
                    :data="audioAnalysis.spectrum"
                    :x-maximum="audioAnalysis.sampleRate / 2"
                  />
                </view>
                <view v-else class="dialog-state dialog-state--compact">{{ t("noAudio") }}</view>
              </view>
            </view>

            <view class="form-actions">
              <button class="small-button small-button--ghost" type="button" @click="resetManualForm">{{ t("reset") }}</button>
              <button class="small-button small-button--ghost" type="button" @click="activeTab = 'noise'">{{ t("cancel") }}</button>
              <button class="small-button" type="button" :disabled="detail.manualSubmitting" @click="submitManual(true)">{{ t("dispatch") }}</button>
              <button class="small-button" type="button" :disabled="detail.manualSubmitting" @click="submitManual(false)">
                {{ detail.manualSubmitting ? t("saving") : t("confirm") }}
              </button>
            </view>

            <view class="section-title section-title--records">{{ t("analysisRecords") }}</view>
            <view class="manual-records">
              <view class="manual-records__row manual-records__head">
                <text>{{ t("manualJudgement") }}</text>
                <text>{{ t("troubleshootingFeedback") }}</text>
                <text>{{ t("reasonAnalysis") }}</text>
                <text>{{ t("maintenanceTime") }}</text>
              </view>
              <view v-for="record in detail.manualRecords" :key="String(record.id || record.createdAt)" class="manual-records__row">
                <text>{{ displayValue(record.manualAnalysis) }}</text>
                <text>{{ displayValue(record.troubleshootingFeedback) }}</text>
                <text :title="displayValue(record.reasonAnalysis)">{{ displayValue(record.reasonAnalysis) }}</text>
                <text>{{ displayValue(record.createdAt) }}</text>
              </view>
              <view v-if="detail.manualLoading" class="inline-state">{{ t("loading") }}</view>
              <view v-else-if="!detail.manualRecords.length" class="dialog-state dialog-state--compact">{{ t("noAnalysisRecords") }}</view>
            </view>
            <view v-if="detail.manualError" class="detail-error">{{ detail.manualError }}</view>
          </view>

          <view v-else-if="activeTab === 'correlation'" class="tab-content">
            <view class="correlation-toolbar">
              <text class="analysis-toolbar__label">{{ t("correlationRadius") }}</text>
              <input v-model.number="radiusKm" class="radius-input" type="number" min="0.1" max="20" step="0.1" />
              <text>km</text>
              <text class="correlation-toolbar__summary">
                {{ t("nearbyDeviceCount", { radius: radiusKm, value: nearbyDevices.length }) }}
              </text>
            </view>

            <view class="correlation-table">
              <view class="correlation-table__row correlation-table__head">
                <text>{{ t("deviceNumber") }}</text>
                <text>{{ t("distanceMeters") }}</text>
                <text>{{ t("leakTrend") }}</text>
                <text>{{ t("operation") }}</text>
              </view>
              <view
                v-for="item in nearbyDevices"
                :key="item.device.deviceNumber"
                class="correlation-table__row"
                :class="{ selected: relatedDeviceNumber === item.device.deviceNumber }"
              >
                <text>{{ item.device.deviceNumber }}</text>
                <text>{{ Math.round(item.distance) }}</text>
                <view class="mini-trend">
                  <text
                    v-for="(value, index) in deviceTrend(item.device)"
                    :key="index"
                    class="mini-trend__value"
                    :class="trendTone(value)"
                  >{{ value ?? "-" }}</text>
                </view>
                <view class="row-actions">
                  <button class="table-button" type="button" @click="focusRelated(item.device)">{{ t("relatedLocation") }}</button>
                  <button class="table-button" type="button" @click="relatedDeviceNumber = item.device.deviceNumber">{{ t("correlationAnalysis") }}</button>
                </view>
              </view>
              <view v-if="!nearbyDevices.length" class="dialog-state dialog-state--compact">{{ t("noNearbyDevices") }}</view>
            </view>

            <view v-if="relatedDevice" class="comparison-panel">
              <view class="comparison-item">
                <text class="comparison-item__label">{{ device?.deviceNumber }}</text>
                <text class="comparison-item__value">{{ translatedStatus }}</text>
                <text>{{ t("featureValue") }}: {{ device?.leakProperty ?? "-" }}</text>
              </view>
              <text class="comparison-divider">↔</text>
              <view class="comparison-item">
                <text class="comparison-item__label">{{ relatedDevice.deviceNumber }}</text>
                <text class="comparison-item__value">{{ statusText(relatedDevice) }}</text>
                <text>{{ t("featureValue") }}: {{ relatedDevice.leakProperty ?? "-" }}</text>
              </view>
              <button class="small-button" type="button" @click="$emit('select-device', relatedDevice)">{{ t("openDevice") }}</button>
            </view>
          </view>

          <view v-else class="tab-content finder-content">
            <view class="finder-device-summary">
              <view>
                <text class="finder-device-summary__number">{{ device.deviceNumber }}</text>
                <text class="finder-device-summary__meta">{{ device.model }} · {{ translatedStatus }}</text>
              </view>
              <text class="finder-device-summary__coordinate">{{ currentDeviceCoordinate }}</text>
            </view>
            <view v-if="currentDevicePoint.length" class="finder-map finder-map--single">
              <TencentLeakMap
                v-if="provider === 'tencent'"
                compact
                :points="currentDevicePoint"
                :selected-device-number="device.deviceNumber"
              />
              <GoogleLeakMap
                v-else
                compact
                :points="currentDevicePoint"
                :selected-device-number="device.deviceNumber"
              />
            </view>
            <view v-else class="dialog-state">{{ t("noCurrentDeviceCoordinate") }}</view>
          </view>
        </template>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { isDomesticLeakMonitorUser } from "@/services/leak-monitor/device-query";
import { convertMapCoordinate } from "../coordinateTransform";
import type {
  DateRangeValue,
  DeviceDetailState,
  FeatureTrendPoint,
  LeakMonitorDevice,
  ManualAnalysisPayload,
  MapDevicePoint,
} from "../types";
import { useLeakMonitorI18n } from "../i18n";
import DeviceSpectrumChart from "./DeviceSpectrumChart.vue";
import GoogleLeakMap from "./GoogleLeakMap.vue";
import TencentLeakMap from "./TencentLeakMap.vue";

const { language, t } = useLeakMonitorI18n();

const props = withDefaults(defineProps<{
  visible: boolean;
  loading: boolean;
  device: LeakMonitorDevice | null;
  detail: DeviceDetailState;
  visibleDevices?: LeakMonitorDevice[];
  mapPoints?: MapDevicePoint[];
  sidebarCollapsed?: boolean;
}>(), {
  visibleDevices: () => [],
  mapPoints: () => [],
  sidebarCollapsed: false,
});

const emit = defineEmits<{
  (event: "close"): void;
  (event: "refresh-analysis", range: DateRangeValue): void;
  (event: "load-history", range: DateRangeValue): void;
  (event: "download-audio"): void;
  (event: "load-manual"): void;
  (event: "submit-manual", payload: ManualAnalysisPayload): void;
  (event: "select-device", device: LeakMonitorDevice): void;
}>();

const tabs = computed(() => [
  { key: "noise" as const, label: t("noiseAnalysis") },
  { key: "history" as const, label: t("historyData") },
  { key: "detail" as const, label: t("deviceDetail") },
  { key: "maintenance" as const, label: t("maintenanceRecords") },
  { key: "manual" as const, label: t("manualAnalysis") },
  { key: "correlation" as const, label: t("correlationAnalysis") },
  { key: "finder" as const, label: t("deviceFinder") },
]);
type TabKey = "noise" | "history" | "detail" | "maintenance" | "manual" | "correlation" | "finder";

const activeTab = ref<TabKey>("noise");
const noiseRange = ref(createRecentRange(3));
const historyRange = ref(createRecentRange(7));
const historyChartMode = ref<"trend-bar" | "trend-line">("trend-bar");
const maintenancePage = ref(1);
const maintenancePageSize = 6;
const radiusKm = ref(2);
const relatedDeviceNumber = ref("");
const manualJudgementIndex = ref(0);
const feedbackIndex = ref(0);
const manualForm = ref({ reasonAnalysis: "", resetDate: formatDate(new Date()) });
const provider = computed(() => isDomesticLeakMonitorUser() ? "tencent" : "google");
const manualJudgementOptions = computed(() => [
  { label: t("normal"), value: 1 },
  { label: t("suspect"), value: 2 },
  { label: t("leak"), value: 0 },
  { label: t("valveLeak"), value: 3 },
]);
const feedbackOptions = computed(() => [
  { label: t("feedbackPending"), value: "pending" },
  { label: t("feedbackConfirmed"), value: "confirmed" },
  { label: t("feedbackExcluded"), value: "excluded" },
  { label: t("feedbackRepaired"), value: "repaired" },
]);

watch(() => props.visible, (visible) => {
  if (!visible) return;
  activeTab.value = "noise";
  noiseRange.value = createRecentRange(3);
  historyRange.value = createRecentRange(7);
  maintenancePage.value = 1;
  radiusKm.value = 2;
  relatedDeviceNumber.value = "";
  resetManualForm();
});
watch(() => props.detail.maintenance.length, () => {
  maintenancePage.value = Math.min(maintenancePage.value, maintenanceTotalPages.value);
});

const audioAnalysis = computed(() => props.detail.audioAnalysis);
const translatedStatus = computed(() => {
  if (!props.device) return t("unknown");
  return statusTextByStatus(props.device.status);
});
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
const historyPoints = computed(() => {
  const maximumByDate = new Map<string, FeatureTrendPoint & { leakEsa: number }>();
  props.detail.trend.forEach((item) => {
    if (typeof item.leakEsa !== "number") return;
    const current = maximumByDate.get(item.date);
    if (
      !current ||
      item.leakEsa > current.leakEsa ||
      (item.leakEsa === current.leakEsa && (item.parseTime || "") >= (current.parseTime || ""))
    ) {
      maximumByDate.set(item.date, item as FeatureTrendPoint & { leakEsa: number });
    }
  });
  return Array.from(maximumByDate.values()).sort((left, right) =>
    left.date.localeCompare(right.date));
});
const historyLabels = computed(() => historyPoints.value.map((item) => item.date));
const historyValues = computed(() => historyPoints.value.map((item) => item.leakEsa));
const dailySeries = computed(() => props.detail.dailyAudio.map((item) => ({
  name: item.date,
  data: item.spectrum,
  maxFrequency: item.sampleRate / 2,
})));

const detailFields = computed(() => {
  const info = props.detail.info || {};
  return [
    field(t("algorithmVersion"), info.algorithmVersion),
    field(t("coordinate"), info.coordinate),
    field(t("region"), info.deptNames),
    field(t("deviceStatus"), statusLabel(info.deviceStatus, t("online"), t("offline"))),
    field(t("installAddress"), info.installAddress),
    field(t("installStatus"), statusLabel(info.installState, t("installed"), t("notInstalled"))),
    field(t("tubeBore"), info.tubeBore),
    field(t("tubeMaterial"), info.tubeMaterial),
    field(t("tubeNumber"), info.tubeNumber),
    field(t("valveNumber"), info.valveNumber),
    field(t("receiveTime"), info.lastSamplingTime),
    field(t("measureDays"), info.measureDays),
    field(t("signalIntensity"), info.signalIntensity),
    field(t("hardwareVersion"), info.hardwareVersion),
    field(t("batteryVoltage"), info.batteryVoltage),
    field(t("firmwareVersion"), info.firmwareVersion),
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
const nearbyDevices = computed(() => {
  if (!props.device || typeof props.device.lat !== "number" || typeof props.device.lng !== "number") return [];
  const center = convertMapCoordinate(
    { lat: props.device.lat, lng: props.device.lng },
    props.device.coordinateSystem,
    "WGS84",
  );
  const maximum = Math.max(0.1, Number(radiusKm.value) || 2) * 1000;
  return props.visibleDevices
    .filter((item) =>
      item.deviceNumber !== props.device?.deviceNumber &&
      typeof item.lat === "number" &&
      typeof item.lng === "number")
    .map((item) => {
      const coordinate = convertMapCoordinate(
        { lat: item.lat as number, lng: item.lng as number },
        item.coordinateSystem,
        "WGS84",
      );
      return {
        device: item,
        distance: haversineDistance(center.lat, center.lng, coordinate.lat, coordinate.lng),
      };
    })
    .filter((item) => item.distance <= maximum)
    .sort((left, right) => left.distance - right.distance);
});
const relatedDevice = computed(() =>
  nearbyDevices.value.find((item) => item.device.deviceNumber === relatedDeviceNumber.value)?.device || null);
const currentDevicePoint = computed(() => {
  if (!props.device) return [];
  const point = props.mapPoints.find((item) =>
    item.deviceNumber === props.device?.deviceNumber ||
    String(item.id) === String(props.device?.id));
  if (point) return [point];
  if (typeof props.device.lat !== "number" || typeof props.device.lng !== "number") return [];
  return [{
    id: props.device.id,
    deviceNumber: props.device.deviceNumber,
    title: props.device.model || props.device.deviceNumber,
    status: props.device.status,
    leakProperty: props.device.leakProperty,
    regionId: props.device.regionId,
    coordinateSystem: props.device.coordinateSystem,
    lat: props.device.lat,
    lng: props.device.lng,
  } satisfies MapDevicePoint];
});
const currentDeviceCoordinate = computed(() => {
  const point = currentDevicePoint.value[0];
  return point
    ? `${point.lng.toFixed(6)}, ${point.lat.toFixed(6)}`
    : t("noCurrentDeviceCoordinate");
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
function statusText(device: LeakMonitorDevice) {
  return statusTextByStatus(device.status);
}
function statusTextByStatus(status: LeakMonitorDevice["status"]) {
  return t(status === "suspect" ? "suspect" : status);
}
function trendTone(value: number | null) {
  if (value === null) return "trend-chip--empty";
  if (value >= 20) return "trend-chip--danger";
  if (value >= 10) return "trend-chip--warning";
  return "trend-chip--success";
}
function deviceTrend(device: LeakMonitorDevice) {
  const current = typeof device.leakProperty === "number" ? device.leakProperty : null;
  const source = device.raw.recentLeakProperties ?? device.raw.leakStatusTrend ?? device.raw.trend;
  if (Array.isArray(source)) {
    return source.slice(-7).map((value) => {
      const normalized = typeof value === "object" && value
        ? (value as Record<string, unknown>).leakEsa ?? (value as Record<string, unknown>).value
        : value;
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    });
  }
  return [current];
}
function maintenanceTypeLabel(value: number) {
  return [t("uninstall"), t("install"), t("maintenance"), t("inspection")][value] || t("unknown");
}
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radians = (value: number) => value * Math.PI / 180;
  const earthRadius = 6371000;
  const latDelta = radians(lat2 - lat1);
  const lngDelta = radians(lng2 - lng1);
  const value = Math.sin(latDelta / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(lngDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
function refreshAnalysis() {
  emit("refresh-analysis", { ...noiseRange.value });
}
function loadHistory() {
  emit("load-history", { ...historyRange.value });
}
function focusRelated(device: LeakMonitorDevice) {
  relatedDeviceNumber.value = device.deviceNumber;
}
function resetManualForm() {
  manualJudgementIndex.value = 0;
  feedbackIndex.value = 0;
  manualForm.value = { reasonAnalysis: "", resetDate: formatDate(new Date()) };
}
function submitManual(dispatchRequested: boolean) {
  if (!props.device) return;
  const judgement = manualJudgementOptions.value[manualJudgementIndex.value];
  const feedback = feedbackOptions.value[feedbackIndex.value];
  emit("submit-manual", {
    deviceId: props.device.id,
    deviceNumber: props.device.deviceNumber,
    audioId: props.detail.latestAudio?.audioId,
    manualAnalysis: judgement.label,
    manualAnalysisStatus: judgement.value,
    troubleshootingFeedback: feedback.label,
    reasonAnalysis: manualForm.value.reasonAnalysis.trim(),
    resetDate: manualForm.value.resetDate,
    dispatchRequested,
  });
}
function selectTab(tab: TabKey) {
  activeTab.value = tab;
  if (tab === "history" && !props.detail.dailyAudio.length && !props.detail.historyLoading) loadHistory();
  if (tab === "manual" && !props.detail.manualLoaded && !props.detail.manualLoading) {
    emit("load-manual");
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
.detail-mask--sidebar-collapsed {
  right: 66px;
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
.table-button::after,
.finder-item::after,
.maintenance-pagination button::after { border: 0; }

.tab-row { flex: none; display: flex; gap: 4px; padding: 8px 10px; overflow-x: auto; background: #f8fafc; border-bottom: 1px solid #d8e5ef; }
.tab-button { flex: none; height: 31px; margin: 0; padding: 0 14px; color: #26384d; font-size: 13px; font-weight: 800; line-height: 30px; background: #fff; border: 1px solid #d8e5ef; border-radius: 4px; }
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
.section-title--accent { padding-left: 10px; border-left: 3px solid #0ea5e9; }
.section-title--records { margin-top: 16px; }
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
.manual-layout { display: grid; grid-template-columns: minmax(420px, .9fr) minmax(380px, 1.1fr); gap: 12px; }
.manual-form,
.manual-audio { padding: 12px; background: #fff; border: 1px solid #d8e5ef; border-radius: 5px; }
.manual-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 16px; align-content: start; }
.form-row { display: grid; grid-template-columns: 108px minmax(0, 1fr); align-items: center; gap: 8px; min-width: 0; }
.form-row--wide { grid-column: 1 / -1; align-items: start; }
.form-label { color: #475569; font-size: 12px; font-weight: 800; line-height: 32px; }
.form-control { min-width: 0; }
.form-picker,
.radius-input { box-sizing: border-box; width: 100%; height: 32px; padding: 0 10px; color: #1e293b; font-size: 12px; line-height: 32px; background: #fff; border: 1px solid #cbd8e5; border-radius: 4px; }
.form-textarea { box-sizing: border-box; width: 100%; min-height: 86px; padding: 9px 10px; color: #1e293b; font-size: 12px; line-height: 1.5; background: #fff; border: 1px solid #cbd8e5; border-radius: 4px; }
.manual-audio__title { display: block; margin-bottom: 8px; color: #334155; font-size: 12px; font-weight: 800; }
.manual-spectrum { height: 250px; margin-top: 8px; overflow: hidden; }
.form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
.manual-records,
.correlation-table { overflow: hidden; background: #fff; border: 1px solid #d8e5ef; border-radius: 5px; }
.manual-records__row { display: grid; grid-template-columns: 130px 150px minmax(220px, 1fr) 180px; min-height: 40px; border-bottom: 1px solid #edf2f7; }
.manual-records__row > text { min-width: 0; padding: 0 10px; overflow: hidden; color: #334155; font-size: 12px; line-height: 40px; text-overflow: ellipsis; white-space: nowrap; }
.manual-records__head,
.correlation-table__head { color: #1e293b; font-weight: 900; background: #f1f5f9; }
.correlation-toolbar { display: flex; align-items: center; gap: 8px; min-height: 38px; margin-bottom: 10px; color: #475569; font-size: 12px; }
.radius-input { width: 90px; }
.correlation-toolbar__summary { margin-left: auto; color: #1e293b; font-weight: 800; }
.correlation-table__row { display: grid; grid-template-columns: 170px 120px minmax(260px, 1fr) 210px; align-items: center; min-height: 48px; color: #334155; border-bottom: 1px solid #edf2f7; }
.correlation-table__row.selected { background: #f0f9ff; }
.correlation-table__row > text { padding: 0 12px; font-size: 12px; }
.mini-trend { display: grid; grid-template-columns: repeat(7, minmax(28px, 1fr)); gap: 3px; padding: 5px 8px; }
.mini-trend__value { min-width: 0; height: 26px; color: #047857; font-size: 11px; font-weight: 800; line-height: 26px; text-align: center; background: #d1fae5; }
.mini-trend__value.trend-chip--warning { color: #b45309; background: #fef3c7; }
.mini-trend__value.trend-chip--danger { color: #b91c1c; background: #fee2e2; }
.mini-trend__value.trend-chip--empty { color: #64748b; background: #f1f5f9; }
.row-actions { display: flex; justify-content: center; gap: 6px; }
.table-button { height: 28px; margin: 0; padding: 0 9px; color: #075985; font-size: 11px; line-height: 28px; background: #e0f2fe; border: 0; border-radius: 4px; }
.comparison-panel { display: flex; align-items: center; gap: 18px; margin-top: 12px; padding: 12px 16px; background: #fff; border: 1px solid #d8e5ef; border-radius: 5px; }
.comparison-item { display: grid; grid-template-columns: 120px 90px auto; align-items: center; gap: 10px; flex: 1; color: #475569; font-size: 12px; }
.comparison-item__label { color: #1e293b; font-weight: 900; }
.comparison-item__value { color: #0f766e; font-weight: 900; }
.comparison-divider { color: #0ea5e9; font-size: 22px; font-weight: 900; }
.finder-content { height: 100%; }
.finder-device-summary { display: flex; align-items: center; justify-content: space-between; min-height: 54px; margin-bottom: 10px; padding: 0 14px; background: #fff; border: 1px solid #d8e5ef; border-radius: 5px; }
.finder-device-summary__number,
.finder-device-summary__meta { display: block; }
.finder-device-summary__number { color: #1e293b; font-size: 15px; font-weight: 900; }
.finder-device-summary__meta { margin-top: 3px; color: #64748b; font-size: 11px; }
.finder-device-summary__coordinate { color: #334155; font-size: 12px; font-weight: 800; }
.finder-map { position: relative; min-width: 0; min-height: 0; }
.finder-map--single { height: min(590px, calc(100vh - 250px)); min-height: 420px; overflow: hidden; background: #fff; border: 1px solid #d8e5ef; border-radius: 5px; }
.detail-error { margin-top: 10px; padding: 8px 10px; color: #b42318; font-size: 12px; background: #fff1ee; border: 1px solid #ffd3cb; border-radius: 4px; }

@media (max-width: 1500px) {
  .detail-mask { right: 638px; left: 10px; }
  .audio-trend-row { grid-template-columns: 1fr; }
}
@media (max-width: 1150px) {
  .detail-mask { top: 10px; right: 10px; bottom: 10px; left: 10px; justify-content: center; }
  .detail-dialog { width: min(900px, 100%); }
  .field-grid,
  .chart-grid,
  .manual-layout { grid-template-columns: 1fr; }
  .chart-grid__wide { grid-column: auto; }
  .correlation-table__row { grid-template-columns: 130px 90px minmax(220px, 1fr) 180px; }
}
</style>
