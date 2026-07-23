<template>
  <view v-if="visible && primaryDevice && relatedDevice" class="correlation-mask" @click.self="$emit('close')">
    <view class="correlation-dialog" @click.stop>
      <view class="correlation-dialog__header">
        <view>
          <text class="correlation-dialog__title">{{ t("correlationDialogTitle") }}</text>
          <text class="correlation-dialog__subtitle">{{ t("correlationDialogSubtitle") }}</text>
        </view>
        <button class="icon-button" type="button" :aria-label="t('close')" @click="$emit('close')">×</button>
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
              <view>
                <text class="site-panel__eyebrow">{{ site.label }}</text>
                <text class="site-panel__number">{{ site.device.deviceNumber }}</text>
              </view>
              <text class="site-panel__distance">
                {{ site.key === "primary" ? "0 m" : `${Math.round(distanceKm * 1000)} m` }}
              </text>
            </view>
            <view class="site-panel__meta">
              <text>{{ site.device.model || "-" }}</text>
              <text>{{ displayAddress(site.device) }}</text>
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

            <view class="audio-preview">
              <view v-if="audioLoading[site.key]" class="loading-layer loading-layer--audio">
                <image class="audio-loading-icon" src="/static/icons/audioloading.svg" mode="aspectFit" />
                <text>{{ t("loadingAudio") }}</text>
              </view>
              <template v-else-if="site.analysis">
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
              <view v-else class="audio-empty">{{ audioErrors[site.key] || t("noSelectableAudio") }}</view>
            </view>
          </view>
        </view>

        <view class="parameter-band">
          <view class="parameter-band__heading">
            <text>{{ t("analysisParameters") }}</text>
            <text>{{ t("analysisMode") }}: {{ analysisModeOptions[analysisModeIndex].label }}</text>
          </view>
          <view class="parameter-grid">
            <label class="parameter-field">
              <text>{{ t("pipeDistance") }} (m)</text>
              <input v-model.number="form.pipeDistance" type="number" min="1" step="1" />
            </label>
            <label class="parameter-field">
              <text>{{ t("pipeDiameter") }} (mm)</text>
              <input v-model.number="form.pipeDiameter" type="number" min="10" step="10" />
            </label>
            <label class="parameter-field">
              <text>{{ t("sensorSpacing") }} (m)</text>
              <input v-model.number="form.sensorSpacing" type="number" min="1" step="1" />
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
            <view class="parameter-field parameter-field--wide">
              <text>{{ t("analysisMode") }}</text>
              <picker
                :range="analysisModeOptions"
                range-key="label"
                :value="analysisModeIndex"
                @change="analysisModeIndex = Number($event.detail.value)"
              >
                <view class="form-picker">{{ analysisModeOptions[analysisModeIndex].label }}</view>
              </picker>
            </view>
            <button class="analyze-button" type="button" :disabled="analyzing" @click="runMockAnalysis">
              {{ analyzing ? t("analyzing") : t("startAnalysis") }}
            </button>
          </view>
          <view v-if="validationError" class="validation-error">{{ validationError }}</view>
        </view>

        <view v-if="analyzing" class="analysis-loading">
          <view class="analysis-loading__copy">
            <text>{{ t("analyzingCorrelation") }}</text>
            <text>{{ progress }}%</text>
          </view>
          <view class="progress-track">
            <view class="progress-value" :style="{ width: `${progress}%` }"></view>
          </view>
        </view>

        <view v-if="result" class="result-panel">
          <view class="result-panel__heading">
            <view>
              <text class="result-panel__eyebrow">{{ t("calculationResult") }}</text>
              <text class="result-panel__title">{{ result.positionMeters.toFixed(1) }} m</text>
            </view>
            <view class="confidence-badge">
              <text>{{ t("confidence") }}</text>
              <text>{{ result.confidence }}%</text>
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
                :style="{ left: `${result.positionPercent}%` }"
                :title="`${result.positionMeters.toFixed(1)} m`"
              ></view>
              <text class="location-track__endpoint">B</text>
            </view>
            <view class="location-track__scale">
              <text>0 m</text>
              <text>{{ form.pipeDistance }} m</text>
            </view>
          </view>

          <text class="result-description">
            {{ t("resultDescription", {
              device: primaryDevice.deviceNumber,
              distance: result.positionMeters.toFixed(1),
            }) }}
          </text>
          <DeviceSpectrumChart
            :title="t('resultChart')"
            mode="trend-line"
            :data="result.correlationCurve"
            :labels="result.correlationLabels"
          />
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import {
  fetchLeakMonitorAudioOptions,
  fetchLeakMonitorWav,
} from "@/services/leak-monitor/device-query";
import { analyzeWavArrayBuffer } from "../audioAnalysis";
import type {
  AudioAnalysisData,
  CorrelationAudioOption,
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
const audioOptions = reactive<Record<SiteKey, AudioChoice[]>>({ primary: [], related: [] });
const audioIndexes = reactive<Record<SiteKey, number>>({ primary: 0, related: 0 });
const audioAnalyses = reactive<Record<SiteKey, AudioAnalysisData | null>>({ primary: null, related: null });
const audioUrls = reactive<Record<SiteKey, string>>({ primary: "", related: "" });
const audioLoading = reactive<Record<SiteKey, boolean>>({ primary: false, related: false });
const audioErrors = reactive<Record<SiteKey, string>>({ primary: "", related: "" });
const form = reactive({ pipeDistance: 100, pipeDiameter: 300, sensorSpacing: 100 });
const materialIndex = ref(0);
const analysisModeIndex = ref(0);
const analyzing = ref(false);
const progress = ref(0);
const validationError = ref("");
const result = ref<{
  confidence: number;
  positionMeters: number;
  positionPercent: number;
  correlationCurve: number[];
  correlationLabels: string[];
} | null>(null);
let progressTimer: ReturnType<typeof window.setInterval> | null = null;
let resultTimer: ReturnType<typeof window.setTimeout> | null = null;
let finishTimer: ReturnType<typeof window.setTimeout> | null = null;
let requestId = 0;

const materialOptions = computed(() => [
  { label: t("castIron"), value: "cast-iron" },
  { label: t("steel"), value: "steel" },
  { label: t("pePipe"), value: "pe" },
  { label: t("pvcPipe"), value: "pvc" },
]);
const analysisModeOptions = computed(() => [
  { label: t("overallAnalysis"), value: "overall" },
  { label: t("phaseAnalysis"), value: "phase" },
  { label: t("spectrumAnalysis"), value: "spectrum" },
]);

const sites = computed(() => ([
  buildSite("primary", t("primarySite"), props.primaryDevice),
  buildSite("related", t("relatedSite"), props.relatedDevice),
].filter((site): site is NonNullable<typeof site> => Boolean(site))));

watch(
  () => [props.visible, props.primaryDevice?.deviceNumber, props.relatedDevice?.deviceNumber],
  ([visible]) => {
    if (!visible) {
      requestId += 1;
      analyzing.value = false;
      clearProgressTimer();
      clearResultTimers();
      revokeAudioUrls();
      return;
    }
    if (!props.primaryDevice || !props.relatedDevice) return;
    form.pipeDistance = Math.max(1, Math.round((props.distanceKm || 0.1) * 1000));
    form.sensorSpacing = form.pipeDistance;
    result.value = null;
    validationError.value = "";
    void loadAudioOptions();
  },
);

onBeforeUnmount(() => {
  clearProgressTimer();
  clearResultTimers();
  revokeAudioUrls();
});

function buildSite(key: SiteKey, label: string, device: LeakMonitorDevice | null) {
  if (!device) return null;
  return {
    key,
    label,
    device,
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
  audioLoading[key] = true;
  audioErrors[key] = "";
  audioAnalyses[key] = null;
  try {
    const options = await fetchLeakMonitorAudioOptions(device.deviceNumber);
    if (currentRequest !== requestId) return;
    audioOptions[key] = options.map((item) => ({
      ...item,
      label: t("audioOptionLabel", {
        time: item.audioTime || "-",
        id: item.audioId,
      }),
    }));
    audioIndexes[key] = 0;
    if (audioOptions[key].length) await loadSelectedAudio(key, currentRequest);
  } catch (error: any) {
    if (currentRequest === requestId) {
      audioErrors[key] = error?.msg || error?.message || t("audioLoadingFailed");
    }
  } finally {
    if (currentRequest === requestId) audioLoading[key] = false;
  }
}

function setAudioIndex(key: SiteKey, index: number) {
  audioIndexes[key] = index;
  result.value = null;
  void loadSelectedAudio(key, requestId);
}

async function loadSelectedAudio(key: SiteKey, currentRequest: number) {
  const option = audioOptions[key][audioIndexes[key]];
  if (!option) return;
  audioLoading[key] = true;
  audioErrors[key] = "";
  audioAnalyses[key] = null;
  revokeAudioUrl(key);
  try {
    const wav = await fetchLeakMonitorWav(option.audioId);
    const analysis = await analyzeWavArrayBuffer(wav);
    if (currentRequest !== requestId) return;
    audioAnalyses[key] = analysis;
    if (typeof URL !== "undefined") {
      audioUrls[key] = URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
    }
  } catch (error: any) {
    if (currentRequest === requestId) {
      audioErrors[key] = error?.msg || error?.message || t("audioLoadingFailed");
    }
  } finally {
    if (currentRequest === requestId) audioLoading[key] = false;
  }
}

function runMockAnalysis() {
  if (
    !audioOptions.primary[audioIndexes.primary] ||
    !audioOptions.related[audioIndexes.related] ||
    !Number.isFinite(Number(form.pipeDistance)) ||
    Number(form.pipeDistance) <= 0
  ) {
    validationError.value = t("correlationInputRequired");
    return;
  }
  validationError.value = "";
  result.value = null;
  analyzing.value = true;
  progress.value = 8;
  clearProgressTimer();
  clearResultTimers();
  progressTimer = window.setInterval(() => {
    progress.value = Math.min(92, progress.value + Math.max(1, Math.round((96 - progress.value) / 7)));
  }, 260);
  resultTimer = window.setTimeout(() => {
    clearProgressTimer();
    const seed = (
      audioOptions.primary[audioIndexes.primary].audioId * 17 +
      audioOptions.related[audioIndexes.related].audioId * 11 +
      Math.round(form.pipeDistance)
    ) % 1000;
    const positionPercent = 24 + (seed % 53);
    const pointCount = 48;
    const curve = Array.from({ length: pointCount }, (_, index) => {
      const percent = index / (pointCount - 1) * 100;
      const peak = 84 * Math.exp(-Math.pow(percent - positionPercent, 2) / 42);
      const ripple = 7 + Math.sin((index + seed) * 0.72) * 5;
      return Math.max(0, Number((peak + ripple).toFixed(2)));
    });
    progress.value = 100;
    result.value = {
      confidence: 86 + (seed % 11),
      positionMeters: Number(form.pipeDistance) * positionPercent / 100,
      positionPercent,
      correlationCurve: curve,
      correlationLabels: curve.map((_, index) =>
        String(Math.round(index / (pointCount - 1) * Number(form.pipeDistance)))),
    };
    finishTimer = window.setTimeout(() => {
      analyzing.value = false;
    }, 180);
  }, 2200);
}

function displayAddress(device: LeakMonitorDevice) {
  return String(device.raw.installAddress ?? device.raw.deptNames ?? "-");
}

function clearProgressTimer() {
  if (progressTimer) {
    window.clearInterval(progressTimer);
    progressTimer = null;
  }
}

function clearResultTimers() {
  if (resultTimer) {
    window.clearTimeout(resultTimer);
    resultTimer = null;
  }
  if (finishTimer) {
    window.clearTimeout(finishTimer);
    finishTimer = null;
  }
}

function revokeAudioUrl(key: SiteKey) {
  if (audioUrls[key] && typeof URL !== "undefined") URL.revokeObjectURL(audioUrls[key]);
  audioUrls[key] = "";
}

function revokeAudioUrls() {
  revokeAudioUrl("primary");
  revokeAudioUrl("related");
}
</script>

<style scoped lang="scss">
.correlation-mask {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, .48);
}
.correlation-dialog {
  display: flex;
  flex-direction: column;
  width: min(1180px, 96vw);
  max-height: 92vh;
  overflow: hidden;
  background: #f7fafc;
  border: 1px solid #bfd0df;
  border-radius: 8px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, .3);
}
.correlation-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 68px;
  padding: 0 20px;
  color: #fff;
  background: #156f78;
}
.correlation-dialog__title,
.correlation-dialog__subtitle { display: block; }
.correlation-dialog__title { font-size: 18px; font-weight: 900; }
.correlation-dialog__subtitle { margin-top: 4px; font-size: 12px; opacity: .82; }
.icon-button {
  width: 34px;
  height: 34px;
  margin: 0;
  padding: 0;
  color: #fff;
  font-size: 26px;
  line-height: 32px;
  background: transparent;
  border: 0;
}
.icon-button::after,
.analyze-button::after { border: 0; }
.correlation-dialog__body { flex: 1; min-height: 0; }
.site-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; padding: 14px; }
.site-panel {
  min-width: 0;
  padding: 14px;
  background: #fff;
  border: 1px solid #d6e1e9;
  border-top: 4px solid #1686a0;
  border-radius: 6px;
}
.site-panel--related { border-top-color: #d46b38; }
.site-panel__heading { display: flex; justify-content: space-between; gap: 12px; }
.site-panel__eyebrow,
.site-panel__number { display: block; }
.site-panel__eyebrow { color: #64748b; font-size: 11px; font-weight: 800; }
.site-panel__number { margin-top: 4px; color: #172b3a; font-size: 18px; font-weight: 900; }
.site-panel__distance { color: #156f78; font-size: 13px; font-weight: 900; }
.site-panel__meta { display: flex; gap: 12px; min-height: 24px; margin-top: 6px; color: #64748b; font-size: 11px; }
.site-panel__meta text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.audio-picker-row { display: grid; grid-template-columns: 82px minmax(0, 1fr); align-items: center; gap: 8px; margin-top: 10px; }
.form-label,
.parameter-field > text { color: #43576a; font-size: 12px; font-weight: 800; }
.form-picker,
.parameter-field input {
  box-sizing: border-box;
  width: 100%;
  height: 34px;
  padding: 0 10px;
  color: #1e293b;
  font-size: 12px;
  line-height: 34px;
  background: #fff;
  border: 1px solid #c5d4df;
  border-radius: 4px;
}
.audio-preview { position: relative; min-height: 300px; margin-top: 10px; overflow: hidden; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; }
.audio-control { box-sizing: border-box; width: 100%; height: 50px; padding: 8px 10px 0; }
.audio-preview :deep(.chart-panel) { height: 240px; border: 0; border-radius: 0; }
.audio-empty { color: #64748b; font-size: 12px; line-height: 300px; text-align: center; }
.loading-layer { position: absolute; inset: 0; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #527083; font-size: 12px; background: rgba(248, 250, 252, .94); }
.audio-loading-icon { width: 42px; height: 42px; animation: audio-pulse .85s ease-in-out infinite alternate; }
.parameter-band { margin: 0 14px 14px; padding: 14px; background: #eaf3f4; border: 1px solid #c6dcdf; border-radius: 6px; }
.parameter-band__heading { display: flex; justify-content: space-between; margin-bottom: 10px; color: #20434a; font-size: 13px; font-weight: 900; }
.parameter-grid { display: grid; grid-template-columns: repeat(4, minmax(130px, 1fr)) minmax(130px, 1.2fr) auto; align-items: end; gap: 10px; }
.parameter-field { display: grid; gap: 6px; min-width: 0; }
.parameter-field--wide { min-width: 160px; }
.analyze-button { height: 34px; margin: 0; padding: 0 18px; color: #fff; font-size: 12px; font-weight: 900; line-height: 34px; background: #0c8795; border: 0; border-radius: 4px; }
.analyze-button[disabled] { opacity: .55; }
.validation-error { margin-top: 8px; color: #b42318; font-size: 12px; }
.analysis-loading { margin: 0 14px 14px; padding: 16px; background: #fff; border: 1px solid #d6e1e9; border-radius: 6px; }
.analysis-loading__copy { display: flex; justify-content: space-between; color: #43576a; font-size: 12px; font-weight: 800; }
.progress-track { height: 8px; margin-top: 10px; overflow: hidden; background: #dbe7eb; border-radius: 4px; }
.progress-value { height: 100%; background: #0c8795; border-radius: 4px; transition: width .25s ease; }
.result-panel { margin: 0 14px 14px; padding: 18px; background: #fff; border: 1px solid #d6e1e9; border-radius: 6px; }
.result-panel__heading { display: flex; align-items: center; justify-content: space-between; }
.result-panel__eyebrow,
.result-panel__title { display: block; }
.result-panel__eyebrow { color: #64748b; font-size: 11px; font-weight: 900; text-transform: uppercase; }
.result-panel__title { margin-top: 3px; color: #c85228; font-size: 24px; font-weight: 900; }
.confidence-badge { display: grid; gap: 2px; padding: 8px 12px; color: #0e6f65; font-size: 11px; font-weight: 900; text-align: right; background: #e7f6f2; border: 1px solid #b9e3d7; border-radius: 5px; }
.location-track { margin-top: 18px; padding: 18px 16px 10px; background: #eef5f8; border-radius: 5px; }
.location-track__labels,
.location-track__scale { display: flex; justify-content: space-between; color: #334155; font-size: 12px; font-weight: 800; }
.location-track__line { position: relative; display: flex; align-items: center; justify-content: space-between; height: 32px; margin-top: 10px; }
.location-track__line::before { position: absolute; right: 16px; left: 16px; height: 4px; content: ""; background: linear-gradient(90deg, #1686a0, #70a9b4 55%, #d46b38); }
.location-track__endpoint { z-index: 1; width: 30px; height: 30px; color: #fff; font-size: 12px; font-weight: 900; line-height: 30px; text-align: center; background: #156f78; border-radius: 50%; }
.location-track__endpoint:last-child { background: #d46b38; }
.location-track__marker { position: absolute; z-index: 2; width: 18px; height: 18px; margin-left: -9px; background: #e24319; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 0 0 2px rgba(226, 67, 25, .25); }
.result-description { display: block; margin: 14px 0; color: #43576a; font-size: 13px; line-height: 1.7; }
.result-panel :deep(.chart-panel) { height: 280px; }
@keyframes audio-pulse {
  from { transform: scaleY(.62); opacity: .55; }
  to { transform: scaleY(1.08); opacity: 1; }
}
@media (max-width: 1050px) {
  .site-grid { grid-template-columns: 1fr; }
  .parameter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
