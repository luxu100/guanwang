<template>
  <view v-if="visible && primaryDevice && relatedDevice" class="correlation-mask" @click.self="$emit('close')">
    <view class="correlation-dialog" @click.stop>
      <view class="correlation-dialog__header">
        <view class="correlation-dialog__heading">
          <text class="correlation-dialog__title">{{ t("correlationDialogTitle") }}</text>
          <text class="correlation-dialog__subtitle">{{ t("correlationDialogSubtitle") }}</text>
        </view>
        <view class="correlation-dialog__header-actions">
          <view class="device-pair">
            <text>{{ primaryDevice.deviceNumber }}</text>
            <view class="device-pair__line"></view>
            <text>{{ relatedDevice.deviceNumber }}</text>
            <text class="device-pair__distance">{{ formattedDistanceAB }} m</text>
          </view>
          <button class="icon-button" type="button" :aria-label="t('close')" @click="$emit('close')">×</button>
        </view>
      </view>

      <scroll-view class="correlation-dialog__body" scroll-y>
        <view class="site-grid">
          <view
            v-for="site in sites"
            :key="site.key"
            class="site-panel"
            :class="'site-panel--' + site.key"
          >
            <view class="site-panel__heading">
              <view class="site-panel__identity">
                <text class="site-panel__letter">{{ site.key === "primary" ? "A" : "B" }}</text>
                <view>
                  <text class="site-panel__eyebrow">{{ site.label }}</text>
                  <text class="site-panel__number">{{ site.device.deviceNumber }}</text>
                </view>
              </view>
              <text class="site-panel__distance">
                {{ site.key === "primary" ? "0 m" : `${formattedDistanceAB} m` }}
              </text>
            </view>
            <view class="site-panel__meta">
              <view class="site-panel__meta-item">
                <text class="site-panel__meta-label">{{ t("model") }}</text>
                <text class="site-panel__meta-value">{{ site.device.model || "-" }}</text>
              </view>
              <view class="site-panel__meta-item">
                <text class="site-panel__meta-label">{{ t("address") }}</text>
                <text class="site-panel__meta-value">{{ displayAddress(site.device) }}</text>
              </view>
            </view>

            <view class="audio-selection">
              <view class="audio-picker-row">
                <text class="form-label">{{ t("selectDate") }}</text>
                <picker
                  class="audio-picker"
                  mode="date"
                  :value="site.date"
                  :end="today"
                  @change="setAudioDate(site.key, String($event.detail.value))"
                >
                  <view class="form-picker">{{ site.date }}</view>
                </picker>
              </view>

              <view class="audio-picker-row">
                <text class="form-label">{{ t("selectAudio") }}</text>
                <picker
                  class="audio-picker"
                  :range="site.options"
                  range-key="label"
                  :value="site.index"
                  @change="setAudioIndex(site.key, Number($event.detail.value))"
                >
                  <view class="form-picker">
                    {{ site.options[site.index]?.label || t("noSelectableAudio") }}
                  </view>
                </picker>
              </view>
            </view>

            <view class="audio-preview">
              <view class="audio-preview__header">
                <text>{{ t("signalPreview") }}</text>
                <text v-if="site.options[site.index]">ID {{ site.options[site.index].audioId }}</text>
              </view>
              <view v-if="audioLoading[site.key]" class="loading-layer loading-layer--audio">
                <image class="audio-loading-icon" src="/static/icons/audioloading.svg" mode="aspectFit" />
                <text>{{ t("loadingAudio") }}</text>
              </view>
              <view class="audio-preview__content">
                <template v-if="site.analysis">
                  <!-- #ifdef H5 -->
                  <component
                    :is="'audio'"
                    v-if="site.audioUrl"
                    class="audio-control"
                    :src="site.audioUrl"
                    controls
                    preload="metadata"
                  />
                  <!-- #endif -->
                  <DeviceSpectrumChart
                    :title="language === 'en-US' ? 'Audio waveform' : '音频波形'"
                    mode="waveform"
                    :data="site.analysis.waveform"
                    :x-maximum="site.analysis.duration"
                  />
                </template>
                <view v-else-if="!audioLoading[site.key]" class="audio-empty">
                  {{ audioErrors[site.key] || t("noSelectableAudio") }}
                </view>
              </view>
            </view>
          </view>
        </view>

        <view class="parameter-band">
          <view class="parameter-band__heading">
            <text>{{ t("analysisParameters") }}</text>
            <text>
              {{ t("automaticAudioIds", {
                audioId1: selectedPrimaryAudio?.audioId ?? "-",
                audioId2: selectedRelatedAudio?.audioId ?? "-",
              }) }}
            </text>
          </view>
          <view class="parameter-grid">
            <label class="parameter-field">
              <text>{{ t("pipeDistance") }} (m)</text>
              <input v-model.number="form.distanceAB" type="number" min="0.01" step="0.01" />
            </label>
            <label class="parameter-field">
              <text>{{ t("pipeDiameter") }} (mm)</text>
              <input v-model.number="form.diameterMm" type="number" min="0.01" step="0.01" />
            </label>
            <label class="parameter-field">
              <text>{{ t("wallThickness") }} (mm)</text>
              <input v-model.number="form.wallThicknessMm" type="number" min="0.01" step="0.01" />
            </label>
            <view class="parameter-field">
              <text>{{ t("pipeMaterialLabel") }}</text>
              <picker
                :range="materialOptions"
                range-key="label"
                :value="materialIndex"
                @change="materialIndex = Number($event.detail.value)"
              >
                <view class="form-picker">{{ materialOptions[materialIndex].label }}</view>
              </picker>
            </view>
            <view class="parameter-field">
              <text>{{ t("soilTypeLabel") }}</text>
              <picker
                :range="soilOptions"
                range-key="label"
                :value="soilIndex"
                @change="soilIndex = Number($event.detail.value)"
              >
                <view class="form-picker">{{ soilOptions[soilIndex].label }}</view>
              </picker>
            </view>
            <label class="parameter-field">
              <text>{{ t("buriedDepth") }} (m)</text>
              <input v-model.number="form.buriedDepthM" type="number" min="0.01" step="0.01" />
            </label>
          </view>
          <view class="parameter-actions">
            <button class="analyze-button" type="button" :disabled="analyzing" @click="runAnalysis">
              {{ analyzing ? t("analyzing") : t("startAnalysis") }}
            </button>
          </view>
          <view v-if="validationError" class="validation-error">{{ validationError }}</view>
        </view>

        <view v-if="analyzing" class="analysis-loading">
          <view class="analysis-loading__copy">
            <text>{{ t("analyzingCorrelation") }}</text>
          </view>
          <view class="progress-track"><view class="progress-value"></view></view>
        </view>

        <view v-if="result" class="result-panel">
          <view class="result-panel__heading">
            <view>
              <text class="result-panel__eyebrow">{{ t("calculationResult") }}</text>
              <text class="result-panel__title">{{ formatResultNumber(result.leakDistanceA) }} m</text>
            </view>
            <view class="position-badge">
              <text>{{ t("positionFlag") }}</text>
              <text>{{ positionFlagLabel }}</text>
            </view>
          </view>

          <view class="location-track">
            <view class="location-track__labels">
              <text>{{ primaryDevice.deviceNumber }}</text>
              <text>{{ relatedDevice.deviceNumber }}</text>
            </view>
            <view class="location-track__line">
              <text class="location-track__endpoint">A</text>
              <view
                class="location-track__marker"
                :class="`location-track__marker--${positionFlagTone}`"
                :style="{ left: `${resultPositionPercent}%` }"
                :title="`${formatResultNumber(result.leakDistanceA)} m`"
              >
                <text class="location-track__result">
                  {{ t("resultPoint") }} {{ formatResultNumber(result.leakDistanceA) }} m
                </text>
              </view>
              <text class="location-track__endpoint">B</text>
            </view>
            <view class="location-track__scale">
              <text class="location-track__scale-value">0 m</text>
              <text class="location-track__scale-value location-track__scale-value--end">
                {{ resultDistanceAB }} m
              </text>
            </view>
          </view>

          <view class="result-metrics">
            <view class="result-metric">
              <text>{{ t("amplitudeA") }}</text>
              <text>{{ formatResultNumber(result.amplitudeA) }}</text>
            </view>
            <view class="result-metric">
              <text>{{ t("amplitudeB") }}</text>
              <text>{{ formatResultNumber(result.amplitudeB) }}</text>
            </view>
            <view class="result-metric">
              <text>{{ t("attenuationCoefficient") }}</text>
              <text>{{ formatResultNumber(result.totalAlpha) }} m⁻¹</text>
            </view>
            <view class="result-metric">
              <text>{{ t("leakDistanceA") }}</text>
              <text>{{ formatResultNumber(result.leakDistanceA) }} m</text>
            </view>
          </view>

          <view v-if="submittedPayload" class="result-request">
            <view class="result-request__heading">{{ t("submittedParameters") }}</view>
            <view class="result-request__grid">
              <view class="result-request__item">
                <text>{{ t("audioId1") }}</text>
                <text>{{ submittedPayload.audioId1 }}</text>
              </view>
              <view class="result-request__item">
                <text>{{ t("audioId2") }}</text>
                <text>{{ submittedPayload.audioId2 }}</text>
              </view>
              <view class="result-request__item">
                <text>{{ t("pipeDistance") }}</text>
                <text>{{ formatResultNumber(submittedPayload.distanceAB) }} m</text>
              </view>
              <view class="result-request__item">
                <text>{{ t("pipeMaterialLabel") }}</text>
                <text>{{ materialLabel(submittedPayload.pipeMaterial) }}</text>
              </view>
              <view class="result-request__item">
                <text>{{ t("pipeDiameter") }}</text>
                <text>{{ formatResultNumber(submittedPayload.diameterMm) }} mm</text>
              </view>
              <view class="result-request__item">
                <text>{{ t("wallThickness") }}</text>
                <text>{{ formatResultNumber(submittedPayload.wallThicknessMm) }} mm</text>
              </view>
              <view class="result-request__item">
                <text>{{ t("soilTypeLabel") }}</text>
                <text>{{ soilLabel(submittedPayload.soilType) }}</text>
              </view>
              <view class="result-request__item">
                <text>{{ t("buriedDepth") }}</text>
                <text>{{ formatResultNumber(submittedPayload.buriedDepthM) }} m</text>
              </view>
            </view>
          </view>

          <text class="result-description">{{ resultDescription }}</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import {
  fetchLeakLocationAnalysis,
  fetchLeakMonitorDailyLatestAudioOption,
  fetchLeakMonitorWav,
} from "@/services/leak-monitor/device-query";
import { analyzeWavArrayBuffer } from "../audioAnalysis";
import type {
  AudioAnalysisData,
  CorrelationAudioOption,
  LeakLocationAnalyzePayload,
  LeakLocationResult,
  LeakMonitorDevice,
} from "../types";
import { useLeakMonitorI18n } from "../i18n";
import DeviceSpectrumChart from "./DeviceSpectrumChart.vue";

type SiteKey = "primary" | "related";
type AudioChoice = CorrelationAudioOption & { label: string };

const props = defineProps<{
  visible: boolean;
  primaryDevice: LeakMonitorDevice | null;
  relatedDevice: LeakMonitorDevice | null;
  distanceKm: number;
}>();

defineEmits<{ (event: "close"): void }>();
const { language, t } = useLeakMonitorI18n();
const today = formatDate(new Date());
const audioOptions = reactive<Record<SiteKey, AudioChoice[]>>({ primary: [], related: [] });
const audioIndexes = reactive<Record<SiteKey, number>>({ primary: 0, related: 0 });
const audioDates = reactive<Record<SiteKey, string>>({ primary: today, related: today });
const audioAnalyses = reactive<Record<SiteKey, AudioAnalysisData | null>>({ primary: null, related: null });
const audioUrls = reactive<Record<SiteKey, string>>({ primary: "", related: "" });
const audioLoading = reactive<Record<SiteKey, boolean>>({ primary: false, related: false });
const audioErrors = reactive<Record<SiteKey, string>>({ primary: "", related: "" });
const form = reactive({
  distanceAB: 100,
  diameterMm: 300,
  wallThicknessMm: 10,
  buriedDepthM: 1,
});
const materialIndex = ref(0);
const soilIndex = ref(0);
const analyzing = ref(false);
const validationError = ref("");
const result = ref<LeakLocationResult | null>(null);
const submittedPayload = ref<LeakLocationAnalyzePayload | null>(null);
let requestId = 0;
let analysisRequestId = 0;
const siteRequestIds: Record<SiteKey, number> = { primary: 0, related: 0 };

const materialOptions = computed<Array<{
  label: string;
  value: LeakLocationAnalyzePayload["pipeMaterial"];
}>>(() => [
  { label: t("steel"), value: "STEEL" },
  { label: t("ductileIron"), value: "DUCTILE_IRON" },
  { label: t("castIron"), value: "CAST_IRON" },
  { label: t("hdpePipe"), value: "HDPE" },
  { label: t("pvcUPipe"), value: "PVC_U" },
]);
const soilOptions = computed<Array<{
  label: string;
  value: LeakLocationAnalyzePayload["soilType"];
}>>(() => [
  { label: t("clay"), value: "CLAY" },
  { label: t("sand"), value: "SAND" },
  { label: t("gravel"), value: "GRAVEL" },
]);

const sites = computed(() => ([
  buildSite("primary", t("primarySite"), props.primaryDevice),
  buildSite("related", t("relatedSite"), props.relatedDevice),
].filter((site): site is NonNullable<typeof site> => Boolean(site))));
const selectedPrimaryAudio = computed(() =>
  audioOptions.primary[audioIndexes.primary] || null);
const selectedRelatedAudio = computed(() =>
  audioOptions.related[audioIndexes.related] || null);
const formattedDistanceAB = computed(() => {
  const distance = Number(form.distanceAB);
  return Number.isFinite(distance) && distance > 0
    ? formatResultNumber(distance)
    : "-";
});
const resultDistanceAB = computed(() =>
  formatResultNumber(submittedPayload.value?.distanceAB ?? Number(form.distanceAB)));
const normalizedPositionFlag = computed(() =>
  String(result.value?.positionFlag || "UNKNOWN").trim().toUpperCase());
const resultPositionPercent = computed(() => {
  if (!result.value) return 0;
  if (normalizedPositionFlag.value === "OUTSIDE_A") return 0;
  if (normalizedPositionFlag.value === "OUTSIDE_B") return 100;
  const distance = Number(resultDistanceAB.value);
  if (!Number.isFinite(distance) || distance <= 0) return 0;
  return Math.min(100, Math.max(0, result.value.leakDistanceA / distance * 100));
});
const positionFlagTone = computed(() => {
  if (normalizedPositionFlag.value === "BETWEEN_AB") return "between";
  if (normalizedPositionFlag.value === "OUTSIDE_A") return "outside-a";
  if (normalizedPositionFlag.value === "OUTSIDE_B") return "outside-b";
  return "unknown";
});
const positionFlagLabel = computed(() => {
  if (normalizedPositionFlag.value === "BETWEEN_AB") return t("positionBetween");
  if (normalizedPositionFlag.value === "OUTSIDE_A") return t("positionOutsideA");
  if (normalizedPositionFlag.value === "OUTSIDE_B") return t("positionOutsideB");
  return t("positionUnknown");
});
const resultDescription = computed(() => {
  if (!result.value || !props.primaryDevice) return "";
  const params = {
    device: props.primaryDevice.deviceNumber,
    distance: formatResultNumber(result.value.leakDistanceA),
  };
  if (normalizedPositionFlag.value === "BETWEEN_AB") {
    return t("resultDescriptionBetween", params);
  }
  if (normalizedPositionFlag.value === "OUTSIDE_A") {
    return t("resultDescriptionOutsideA", params);
  }
  if (normalizedPositionFlag.value === "OUTSIDE_B") {
    return t("resultDescriptionOutsideB", params);
  }
  return t("resultDescriptionUnknown", params);
});

watch(
  () => [props.visible, props.primaryDevice?.deviceNumber, props.relatedDevice?.deviceNumber],
  ([visible]) => {
    if (!visible) {
      requestId += 1;
      analysisRequestId += 1;
      analyzing.value = false;
      revokeAudioUrls();
      return;
    }
    if (!props.primaryDevice || !props.relatedDevice) return;
    analysisRequestId += 1;
    analyzing.value = false;
    form.distanceAB = Math.max(0.01, Math.round((props.distanceKm || 0.1) * 1000));
    form.diameterMm = 300;
    form.wallThicknessMm = 10;
    form.buriedDepthM = 1;
    materialIndex.value = 0;
    soilIndex.value = 0;
    audioDates.primary = today;
    audioDates.related = today;
    result.value = null;
    submittedPayload.value = null;
    validationError.value = "";
    void loadAudioOptions();
  },
);

onBeforeUnmount(() => {
  requestId += 1;
  analysisRequestId += 1;
  revokeAudioUrls();
});

function buildSite(key: SiteKey, label: string, device: LeakMonitorDevice | null) {
  if (!device) return null;
  return {
    key,
    label,
    device,
    date: audioDates[key],
    options: audioOptions[key],
    index: audioIndexes[key],
    analysis: audioAnalyses[key],
    audioUrl: audioUrls[key],
  };
}

async function loadAudioOptions() {
  const currentRequest = ++requestId;
  revokeAudioUrls();
  result.value = null;
  submittedPayload.value = null;
  await Promise.all([
    loadSiteOptions("primary", props.primaryDevice, currentRequest),
    loadSiteOptions("related", props.relatedDevice, currentRequest),
  ]);
}

async function loadSiteOptions(
  key: SiteKey,
  device: LeakMonitorDevice | null,
  currentRequest: number,
) {
  if (!device) return;
  const siteRequest = ++siteRequestIds[key];
  audioLoading[key] = true;
  audioErrors[key] = "";
  audioAnalyses[key] = null;
  audioOptions[key] = [];
  audioIndexes[key] = 0;
  revokeAudioUrl(key);
  try {
    const options = await fetchLeakMonitorDailyLatestAudioOption(
      device.deviceNumber,
      audioDates[key],
    );
    if (!isCurrentSiteRequest(key, currentRequest, siteRequest)) return;
    audioOptions[key] = options.map((item) => ({
      ...item,
      label: t("audioOptionLabel", {
        time: formatAudioTime(item.audioTime) || "-",
        id: item.audioId,
      }),
    }));
    audioIndexes[key] = 0;
    if (audioOptions[key].length) {
      await loadSelectedAudio(key, currentRequest, siteRequest);
    } else {
      audioErrors[key] = t("noAudioForDate");
    }
  } catch (error: any) {
    if (isCurrentSiteRequest(key, currentRequest, siteRequest)) {
      audioErrors[key] = error?.msg || error?.message || t("audioLoadingFailed");
    }
  } finally {
    if (isCurrentSiteRequest(key, currentRequest, siteRequest)) audioLoading[key] = false;
  }
}

function setAudioDate(key: SiteKey, date: string) {
  audioDates[key] = date || today;
  analysisRequestId += 1;
  analyzing.value = false;
  result.value = null;
  submittedPayload.value = null;
  const device = key === "primary" ? props.primaryDevice : props.relatedDevice;
  void loadSiteOptions(key, device, requestId);
}

function setAudioIndex(key: SiteKey, index: number) {
  audioIndexes[key] = index;
  analysisRequestId += 1;
  analyzing.value = false;
  result.value = null;
  submittedPayload.value = null;
  const siteRequest = ++siteRequestIds[key];
  void loadSelectedAudio(key, requestId, siteRequest);
}

async function loadSelectedAudio(
  key: SiteKey,
  currentRequest: number,
  siteRequest: number,
) {
  const option = audioOptions[key][audioIndexes[key]];
  if (!option) return;
  audioLoading[key] = true;
  audioErrors[key] = "";
  audioAnalyses[key] = null;
  revokeAudioUrl(key);
  try {
    const wav = await fetchLeakMonitorWav(option.audioId);
    const analysis = await analyzeWavArrayBuffer(wav);
    if (!isCurrentSiteRequest(key, currentRequest, siteRequest)) return;
    audioAnalyses[key] = analysis;
    if (typeof URL !== "undefined") {
      audioUrls[key] = URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
    }
  } catch (error: any) {
    if (isCurrentSiteRequest(key, currentRequest, siteRequest)) {
      audioErrors[key] = error?.msg || error?.message || t("audioLoadingFailed");
    }
  } finally {
    if (isCurrentSiteRequest(key, currentRequest, siteRequest)) audioLoading[key] = false;
  }
}

function isCurrentSiteRequest(
  key: SiteKey,
  currentRequest: number,
  siteRequest: number,
) {
  return currentRequest === requestId && siteRequest === siteRequestIds[key];
}

async function runAnalysis() {
  const primaryAudio = selectedPrimaryAudio.value;
  const relatedAudio = selectedRelatedAudio.value;
  const numericValues = [
    form.distanceAB,
    form.diameterMm,
    form.wallThicknessMm,
    form.buriedDepthM,
  ].map(Number);
  if (
    !primaryAudio ||
    !relatedAudio ||
    numericValues.some((value) => !Number.isFinite(value) || value <= 0)
  ) {
    validationError.value = t("correlationInputRequired");
    return;
  }

  const currentRequest = ++analysisRequestId;
  const payload: LeakLocationAnalyzePayload = {
    audioId1: primaryAudio.audioId,
    audioId2: relatedAudio.audioId,
    distanceAB: numericValues[0],
    pipeMaterial: materialOptions.value[materialIndex.value].value,
    diameterMm: numericValues[1],
    wallThicknessMm: numericValues[2],
    soilType: soilOptions.value[soilIndex.value].value,
    buriedDepthM: numericValues[3],
  };
  validationError.value = "";
  result.value = null;
  analyzing.value = true;
  try {
    const analysisResult = await fetchLeakLocationAnalysis(payload);
    if (currentRequest === analysisRequestId) {
      result.value = analysisResult;
      submittedPayload.value = payload;
    }
  } catch (error: any) {
    if (currentRequest === analysisRequestId) {
      validationError.value =
        error?.msg || error?.message || t("correlationAnalysisFailed");
    }
  } finally {
    if (currentRequest === analysisRequestId) analyzing.value = false;
  }
}

function displayAddress(device: LeakMonitorDevice) {
  return String(device.raw.installAddress ?? device.raw.deptNames ?? "-");
}

function formatResultNumber(value: number) {
  if (!Number.isFinite(value)) return "-";
  const absolute = Math.abs(value);
  if (absolute > 0 && absolute < 0.000001) return value.toExponential(3);
  return Number(value.toFixed(6)).toString();
}

function formatAudioTime(value: string) {
  return String(value || "").replace("T", " ");
}

function materialLabel(value: LeakLocationAnalyzePayload["pipeMaterial"]) {
  return materialOptions.value.find((item) => item.value === value)?.label || value;
}

function soilLabel(value: LeakLocationAnalyzePayload["soilType"]) {
  return soilOptions.value.find((item) => item.value === value)?.label || value;
}

function revokeAudioUrl(key: SiteKey) {
  if (audioUrls[key] && typeof URL !== "undefined") URL.revokeObjectURL(audioUrls[key]);
  audioUrls[key] = "";
}

function revokeAudioUrls() {
  revokeAudioUrl("primary");
  revokeAudioUrl("related");
}

function formatDate(date: Date) {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 10);
}
</script>

<style scoped lang="scss">
.correlation-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  pointer-events: auto;
  background: rgba(15, 35, 55, .56);
  backdrop-filter: blur(2px);
}
.correlation-dialog {
  display: flex;
  flex-direction: column;
  width: min(1220px, 96vw);
  height: min(900px, calc(100vh - 48px));
  max-height: calc(100vh - 48px);
  overflow: hidden;
  pointer-events: auto;
  background: #f4f8f6;
  border: 1px solid #8dd5b9;
  border-radius: 8px;
  box-shadow: 0 24px 72px rgba(15, 35, 55, .34);
}
.correlation-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
  padding: 0 18px 0 22px;
  color: #fff;
  background: #00a870;
  border-bottom: 1px solid #008c5e;
}
.correlation-dialog__heading { min-width: 0; }
.correlation-dialog__title,
.correlation-dialog__subtitle { display: block; }
.correlation-dialog__title { font-size: 18px; font-weight: 900; }
.correlation-dialog__subtitle { margin-top: 4px; font-size: 12px; opacity: .88; }
.correlation-dialog__header-actions,
.device-pair { display: flex; align-items: center; }
.correlation-dialog__header-actions { gap: 12px; }
.device-pair {
  gap: 8px;
  min-height: 30px;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 800;
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.25);
  border-radius: 4px;
}
.device-pair__line { width: 30px; height: 1px; background: rgba(255,255,255,.65); }
.device-pair__distance {
  padding-left: 8px;
  color: #e2fff4;
  border-left: 1px solid rgba(255,255,255,.25);
}
.icon-button {
  position: relative;
  z-index: 2;
  width: 34px;
  height: 34px;
  margin: 0;
  padding: 0;
  color: #fff;
  font-size: 26px;
  line-height: 32px;
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.22);
  border-radius: 4px;
  cursor: pointer;
}
.icon-button::after,
.analyze-button::after { border: 0; }
.correlation-dialog__body {
  flex: 1;
  width: 100%;
  height: 0;
  min-height: 0;
}
.correlation-dialog__body :deep(.uni-scroll-view-content) {
  box-sizing: border-box;
  padding-bottom: 24px;
}
.site-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; padding: 14px; }
.site-panel {
  min-width: 0;
  background: #fff;
  border: 1px solid #cddbe6;
  border-radius: 6px;
  box-shadow: 0 5px 16px rgba(50, 80, 108, .07);
}
.site-panel__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 62px;
  gap: 12px;
  padding: 0 14px;
  background: #f7fbfe;
  border-bottom: 1px solid #dce8f1;
}
.site-panel__identity { display: flex; align-items: center; gap: 10px; min-width: 0; }
.site-panel__letter {
  flex: none;
  width: 32px;
  height: 32px;
  color: #fff;
  font-size: 13px;
  font-weight: 900;
  line-height: 32px;
  text-align: center;
  background: #00a870;
  border-radius: 4px;
}
.site-panel--related .site-panel__letter { background: #008f62; }
.site-panel__eyebrow,
.site-panel__number { display: block; }
.site-panel__eyebrow { color: #64748b; font-size: 11px; font-weight: 800; }
.site-panel__number { margin-top: 3px; color: #172b3a; font-size: 17px; font-weight: 900; }
.site-panel__distance {
  flex: none;
  padding: 5px 9px;
  color: #007d55;
  font-size: 12px;
  font-weight: 900;
  background: #e8f8f1;
  border: 1px solid #b7e5d3;
  border-radius: 4px;
}
.site-panel__meta {
  display: grid;
  grid-template-columns: minmax(100px, .7fr) minmax(0, 1.3fr);
  min-height: 52px;
  padding: 10px 14px;
  border-bottom: 1px solid #e5edf3;
}
.site-panel__meta-item { min-width: 0; padding-right: 12px; }
.site-panel__meta-item + .site-panel__meta-item {
  padding-left: 12px;
  border-left: 1px solid #e2e8f0;
}
.site-panel__meta-label,
.site-panel__meta-value { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.site-panel__meta-label { color: #7a8b9b; font-size: 10px; font-weight: 800; }
.site-panel__meta-value { margin-top: 4px; color: #334155; font-size: 11px; font-weight: 700; }
.audio-selection {
  display: grid;
  grid-template-columns: minmax(0, .85fr) minmax(0, 1.15fr);
  gap: 10px;
  padding: 12px 14px;
  background: #fff;
}
.audio-picker-row { display: grid; gap: 5px; min-width: 0; }
.form-label,
.parameter-field > text { color: #43576a; font-size: 12px; font-weight: 800; }
.audio-picker { min-width: 0; }
.form-picker,
.parameter-field input {
  box-sizing: border-box;
  width: 100%;
  height: 34px;
  padding: 0 10px;
  color: #1e293b;
  font-size: 12px;
  line-height: 34px;
  background: #fbfdff;
  border: 1px solid #bfcfdb;
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.audio-preview { position: relative; min-height: 292px; margin: 0 14px 14px; overflow: hidden; background: #f8fafc; border: 1px solid #d9e4ec; border-radius: 5px; }
.audio-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 34px;
  padding: 0 10px;
  color: #52677d;
  font-size: 11px;
  font-weight: 800;
  background: #edf4f8;
  border-bottom: 1px solid #d9e4ec;
}
.audio-preview__content { min-height: 257px; }
.audio-control { box-sizing: border-box; width: 100%; height: 48px; padding: 7px 10px 0; background: #fff; }
.audio-preview :deep(.chart-panel) { height: 209px; border: 0; border-top: 1px solid #e2e8f0; border-radius: 0; }
.audio-empty { display: flex; align-items: center; justify-content: center; min-height: 257px; padding: 20px; color: #64748b; font-size: 12px; text-align: center; }
.loading-layer { position: absolute; inset: 35px 0 0; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #527083; font-size: 12px; background: rgba(248, 250, 252, .96); }
.audio-loading-icon { width: 42px; height: 42px; animation: audio-pulse .85s ease-in-out infinite alternate; }
.parameter-band { margin: 0 14px 14px; padding: 14px; background: #fff; border: 1px solid #cddbe6; border-left: 4px solid #00a870; border-radius: 5px; box-shadow: 0 4px 14px rgba(50,80,108,.05); }
.parameter-band__heading { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px 16px; margin-bottom: 12px; color: #176044; font-size: 13px; font-weight: 900; }
.parameter-grid { display: grid; grid-template-columns: repeat(3, minmax(150px, 1fr)); align-items: end; gap: 10px; }
.parameter-field { display: grid; gap: 6px; min-width: 0; }
.parameter-actions { display: flex; justify-content: flex-end; margin-top: 10px; }
.analyze-button { height: 34px; margin: 0; padding: 0 20px; color: #fff; font-size: 12px; font-weight: 900; line-height: 34px; background: #00a870; border: 0; border-radius: 4px; cursor: pointer; box-shadow: 0 4px 10px rgba(0,168,112,.2); }
.analyze-button[disabled] { opacity: .55; }
.validation-error { margin-top: 8px; color: #b42318; font-size: 12px; }
.analysis-loading { margin: 0 14px 14px; padding: 16px; background: #fff; border: 1px solid #cddbe6; border-radius: 5px; }
.analysis-loading__copy { display: flex; justify-content: space-between; color: #43576a; font-size: 12px; font-weight: 800; }
.progress-track { height: 7px; margin-top: 10px; overflow: hidden; background: #d8eee5; border-radius: 3px; }
.progress-value { width: 38%; height: 100%; background: #00a870; border-radius: 3px; animation: analysis-progress 1.2s ease-in-out infinite; }
.result-panel { margin: 0 14px 14px; padding: 18px; background: #fff; border: 1px solid #cddbe6; border-radius: 5px; }
.result-panel__heading { display: flex; align-items: center; justify-content: space-between; }
.result-panel__eyebrow,
.result-panel__title { display: block; }
.result-panel__eyebrow { color: #64748b; font-size: 11px; font-weight: 900; text-transform: uppercase; }
.result-panel__title { margin-top: 3px; color: #008f62; font-size: 24px; font-weight: 900; }
.position-badge { display: grid; gap: 2px; padding: 8px 12px; color: #00734f; font-size: 11px; font-weight: 900; text-align: right; background: #e8f8f1; border: 1px solid #b7e5d3; border-radius: 5px; }
.location-track { margin-top: 18px; padding: 18px 16px 10px; background: #eff8f4; border: 1px solid #d1e9df; border-radius: 5px; }
.location-track__labels,
.location-track__scale { display: flex; justify-content: space-between; color: #334155; font-size: 12px; font-weight: 800; }
.location-track__scale { min-height: 18px; line-height: 18px; }
.location-track__scale-value { flex: none; min-width: 64px; white-space: nowrap; }
.location-track__scale-value--end { text-align: right; }
.location-track__line { position: relative; display: flex; align-items: center; justify-content: space-between; height: 32px; margin-top: 10px; }
.location-track__line::before { position: absolute; right: 16px; left: 16px; height: 4px; content: ""; background: #75c9aa; }
.location-track__endpoint { z-index: 1; width: 30px; height: 30px; color: #fff; font-size: 12px; font-weight: 900; line-height: 30px; text-align: center; background: #00a870; border-radius: 50%; }
.location-track__endpoint:last-child { background: #008f62; }
.location-track__marker { position: absolute; z-index: 2; width: 18px; height: 18px; margin-left: -9px; background: #ef4444; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 0 0 2px rgba(239,68,68,.28); }
.location-track__result {
  position: absolute;
  bottom: 23px;
  left: 50%;
  padding: 2px 6px;
  color: #b91c1c;
  font-size: 10px;
  font-weight: 900;
  line-height: 16px;
  white-space: nowrap;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 3px;
  transform: translateX(-50%);
}
.result-description { display: block; margin: 14px 0; color: #43576a; font-size: 13px; line-height: 1.7; }
.result-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-top: 14px; }
.result-metric { display: grid; gap: 5px; min-width: 0; padding: 10px; background: #f7fbfe; border: 1px solid #d9e5ed; border-radius: 4px; }
.result-metric > text:first-child { color: #64748b; font-size: 11px; font-weight: 800; }
.result-metric > text:last-child { overflow: hidden; color: #1e293b; font-size: 14px; font-weight: 900; text-overflow: ellipsis; white-space: nowrap; }
.result-request { margin-top: 14px; padding: 12px; background: #f7fbfe; border: 1px solid #d9e5ed; border-radius: 4px; }
.result-request__heading { margin-bottom: 9px; color: #176044; font-size: 12px; font-weight: 900; }
.result-request__grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.result-request__item { display: grid; gap: 4px; min-width: 0; }
.result-request__item > text:first-child { color: #64748b; font-size: 10px; font-weight: 800; }
.result-request__item > text:last-child { overflow: hidden; color: #1e293b; font-size: 12px; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
@keyframes audio-pulse {
  from { transform: scaleY(.62); opacity: .55; }
  to { transform: scaleY(1.08); opacity: 1; }
}
@keyframes analysis-progress {
  0% { transform: translateX(-130%); }
  100% { transform: translateX(330%); }
}
@media (max-width: 1050px) {
  .device-pair { display: none; }
  .site-grid { grid-template-columns: 1fr; }
  .parameter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .result-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .result-request__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-height: 720px) {
  .correlation-mask { padding: 12px; }
  .correlation-dialog {
    height: calc(100vh - 24px);
    max-height: calc(100vh - 24px);
  }
}
@media (max-width: 560px) {
  .parameter-grid,
  .result-metrics { grid-template-columns: 1fr; }
  .result-request__grid { grid-template-columns: 1fr; }
  .parameter-band__heading { display: grid; }
}
</style>
