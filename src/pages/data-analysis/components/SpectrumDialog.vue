<template>
  <view v-if="visible" class="spectrum-dialog-mask" @click="close">
    <view class="spectrum-dialog" @click.stop>
      <view class="spectrum-dialog__header">
        <view class="spectrum-title-group">
          <view class="spectrum-title-mark">
            <text></text><text></text><text></text><text></text>
          </view>
          <view>
            <view class="spectrum-title-line">
              <text class="spectrum-dialog__title">频谱分析</text>
              <text class="spectrum-device-tag">{{ item?.deviceId || "未知设备" }}</text>
            </view>
            <text class="spectrum-dialog__subtitle">AUDIO SPECTRUM · 0—2,000 HZ SIGNAL INSIGHT</text>
          </view>
        </view>
        <view class="header-status">
          <view class="analysis-status"><text class="analysis-status__dot"></text><text>分析就绪</text></view>
          <button class="spectrum-dialog__close" aria-label="关闭频谱分析" @click="close">×</button>
        </view>
      </view>

      <view class="spectrum-dialog__body">
        <!-- #ifdef H5 -->
        <view class="spectrum-metrics">
          <view class="spectrum-metric">
            <text class="spectrum-metric__label">峰值频率</text>
            <view><text class="spectrum-metric__value">{{ formatMetric(peakFrequency) }}</text><text class="spectrum-metric__unit">Hz</text></view>
          </view>
          <view class="spectrum-metric">
            <text class="spectrum-metric__label">峰值幅值</text>
            <view><text class="spectrum-metric__value">{{ Math.round(peakAmplitude) }}</text><text class="spectrum-metric__unit">dB</text></view>
          </view>
          <view class="spectrum-metric">
            <text class="spectrum-metric__label">频谱质心</text>
            <view><text class="spectrum-metric__value">{{ formatMetric(spectralCentroid) }}</text><text class="spectrum-metric__unit">Hz</text></view>
          </view>
          <view class="spectrum-metric">
            <text class="spectrum-metric__label">采样率</text>
            <view><text class="spectrum-metric__value">{{ formatSampleRate(sampleRateValue) }}</text><text class="spectrum-metric__unit">kHz</text></view>
          </view>
        </view>

        <view class="spectrum-chart-panel">
          <view class="chart-corner chart-corner--top-left"></view>
          <view class="chart-corner chart-corner--top-right"></view>
          <view class="chart-corner chart-corner--bottom-left"></view>
          <view class="chart-corner chart-corner--bottom-right"></view>
          <view class="chart-topline">
            <view><text class="chart-topline__pulse"></text><text>实时频域特征</text></view>
            <text>FFT 2048 · HANN WINDOW</text>
          </view>
          <view v-if="loading" class="spectrum-dialog__loading">
            <text class="loading-radar"><text></text></text>
            <text class="loading-title">正在解析音频信号</text>
            <text class="loading-hint">生成频域特征与关键指标...</text>
          </view>
          <view v-else-if="errorMsg" class="spectrum-dialog__loading spectrum-dialog__loading--error">
            <text class="error-symbol">!</text>
            <text class="loading-title">频谱加载失败</text>
            <text class="loading-hint">{{ errorMsg }}</text>
          </view>
          <div v-else ref="containerRef" class="spectrum-canvas-container"></div>
        </view>
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <text class="spectrum-dialog__empty">频谱分析仅支持 H5 端</text>
        <!-- #endif -->
      </view>

      <view class="spectrum-player">
        <view class="player-progress-row">
          <text class="progress-time progress-time--current">{{ formatTime(currentTime) }}</text>
          <view class="progress-bar" :class="{ 'progress-bar--disabled': !audioReady }" @click="seekFromProgress">
            <view class="progress-bar__buffer"></view>
            <view class="progress-bar__fill" :style="{ width: progress + '%' }"></view>
            <view class="progress-bar__thumb" :style="{ left: progress + '%' }"></view>
          </view>
          <text class="progress-time">{{ formatTime(duration) }}</text>
        </view>

        <view class="player-controls">
          <view class="player-side-info">
            <text class="player-side-info__label">播放状态</text>
            <view><text class="player-side-info__dot" :class="{ 'player-side-info__dot--active': playing }"></text><text>{{ playing ? "正在播放" : audioReady ? "已暂停" : "等待音频" }}</text></view>
          </view>

          <view class="player-control-group">
            <button class="seek-button" :disabled="!audioReady || loading" aria-label="后退1秒" @click="seekBy(-1)">
              <view class="seek-button__icon seek-button__icon--minus"></view>
              <text class="seek-button__text">1s</text>
            </button>
            <button
              class="play-button"
              :class="{ 'play-button--playing': playing }"
              :disabled="!audioReady || loading"
              :aria-label="playing ? '暂停' : '播放'"
              @click="togglePlayback"
            >
              <text v-if="!playing" class="play-icon"></text>
              <view v-else class="pause-icon"><text></text><text></text></view>
            </button>
            <button class="seek-button" :disabled="!audioReady || loading" aria-label="前进1秒" @click="seekBy(1)">
              <view class="seek-button__icon seek-button__icon--plus"></view>
              <text class="seek-button__text">1s</text>
            </button>
          </view>

          <view class="player-side-info player-side-info--right">
            <text class="player-side-info__label">音频时长</text>
            <text class="player-side-info__duration">{{ formatTime(duration) }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from "vue";
// #ifdef H5
import * as echarts from "echarts";
import { getAudioWav } from "@/services/data-analysis/audio";
// #endif

interface AudioDataItem {
  id: number;
  deviceId: string;
  audioTime: string;
  audioId: number;
  weather: string;
  status: string;
  installer: string;
  deptName: string;
  address: string;
  location: string;
  repairTime: string;
  valveNumber: string;
}

const props = defineProps<{
  visible: boolean;
  item: AudioDataItem | null;
}>();

const emit = defineEmits<{
  (event: "close"): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const loading = ref(false);
const errorMsg = ref("");
const playing = ref(false);
const audioReady = ref(false);
const progress = ref(0);
const currentTime = ref(0);
const duration = ref(0);
const peakFrequency = ref(0);
const peakAmplitude = ref(0);
const spectralCentroid = ref(0);
const sampleRateValue = ref(0);

// #ifdef H5
let audioContext: AudioContext | null = null;
let audioBuffer: AudioBuffer | null = null;
let sourceNode: AudioBufferSourceNode | null = null;
let chartInstance: echarts.ECharts | null = null;
let progressTimer: number | null = null;
let playbackStartedAt = 0;
let playbackOffset = 0;
let playbackGeneration = 0;

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatMetric(value: number) {
  if (!value || !isFinite(value)) return "0";
  return value >= 1000 ? value.toFixed(0) : value.toFixed(1);
}

function formatSampleRate(value: number) {
  if (!value || !isFinite(value)) return "0";
  return (value / 1000).toFixed(1);
}

function close() {
  resetPlayback(true);
  emit("close");
}

function getAudioCtx(): AudioContext {
  if (!audioContext) audioContext = new AudioContext();
  return audioContext;
}

function getChart(): echarts.ECharts {
  if (chartInstance) {
    chartInstance.resize();
    return chartInstance;
  }
  const container = containerRef.value;
  if (!container) throw new Error("频谱图容器尚未就绪");
  chartInstance = echarts.init(container);
  return chartInstance;
}

function disposeChart() {
  if (!chartInstance) return;
  chartInstance.dispose();
  chartInstance = null;
}

function clearProgressTimer() {
  if (progressTimer === null) return;
  clearInterval(progressTimer);
  progressTimer = null;
}

function stopSourceOnly() {
  playbackGeneration += 1;
  if (!sourceNode) return;
  sourceNode.onended = null;
  try {
    sourceNode.stop();
  } catch (_) {
    // source may already have ended
  }
  sourceNode.disconnect();
  sourceNode = null;
}

function resetPlayback(resetPosition: boolean) {
  clearProgressTimer();
  stopSourceOnly();
  playing.value = false;
  if (resetPosition) {
    currentTime.value = 0;
    progress.value = 0;
    playbackOffset = 0;
  }
}

function updatePlaybackProgress() {
  if (!audioBuffer || !playing.value || !audioContext) return;
  const elapsed = audioContext.currentTime - playbackStartedAt;
  const nextTime = Math.min(playbackOffset + elapsed, audioBuffer.duration);
  currentTime.value = nextTime;
  progress.value = audioBuffer.duration > 0 ? Math.min((nextTime / audioBuffer.duration) * 100, 100) : 0;
}

async function startPlayback(offset: number) {
  if (!audioBuffer) return;
  const ctx = getAudioCtx();
  if (ctx.state === "suspended") await ctx.resume();

  stopSourceOnly();
  clearProgressTimer();

  const safeOffset = Math.max(0, Math.min(offset, audioBuffer.duration));
  const normalizedOffset = safeOffset >= audioBuffer.duration ? 0 : safeOffset;
  currentTime.value = normalizedOffset;
  playbackOffset = normalizedOffset;
  progress.value = audioBuffer.duration > 0 ? (normalizedOffset / audioBuffer.duration) * 100 : 0;

  const generation = playbackGeneration;
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(ctx.destination);
  sourceNode = source;
  playbackStartedAt = ctx.currentTime;
  source.onended = () => {
    if (generation !== playbackGeneration || sourceNode !== source) return;
    clearProgressTimer();
    sourceNode = null;
    playing.value = false;
    currentTime.value = audioBuffer?.duration || 0;
    progress.value = 100;
    playbackOffset = currentTime.value;
  };
  source.start(0, normalizedOffset);
  playing.value = true;
  progressTimer = window.setInterval(updatePlaybackProgress, 80);
}

function pausePlayback() {
  updatePlaybackProgress();
  playbackOffset = currentTime.value;
  clearProgressTimer();
  stopSourceOnly();
  playing.value = false;
}

function togglePlayback() {
  if (!audioBuffer) return;
  if (playing.value) pausePlayback();
  else startPlayback(currentTime.value);
}

function seekBy(seconds: number) {
  if (!audioBuffer) return;
  const nextTime = Math.max(0, Math.min(currentTime.value + seconds, audioBuffer.duration));
  currentTime.value = nextTime;
  playbackOffset = nextTime;
  progress.value = audioBuffer.duration > 0 ? (nextTime / audioBuffer.duration) * 100 : 0;
  if (playing.value) startPlayback(nextTime);
}

function seekFromProgress(event: MouseEvent) {
  if (!audioBuffer) return;
  const element = event.currentTarget as HTMLElement | null;
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const ratio = Math.max(0, Math.min((event.clientX - rect.left) / rect.width, 1));
  const nextTime = ratio * audioBuffer.duration;
  currentTime.value = nextTime;
  playbackOffset = nextTime;
  progress.value = ratio * 100;
  if (playing.value) startPlayback(nextTime);
}

async function computeSpectrum(buffer: AudioBuffer, fftSize: number): Promise<Uint8Array> {
  const offlineCtx = new OfflineAudioContext(1, fftSize, buffer.sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;
  const analyser = offlineCtx.createAnalyser();
  analyser.fftSize = fftSize;
  source.connect(analyser);
  analyser.connect(offlineCtx.destination);
  source.start(0);
  await offlineCtx.startRendering();
  const freqData = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(freqData);
  return freqData;
}

function renderChart(freqData: Uint8Array, sampleRate: number) {
  const chart = getChart();
  const nyquist = sampleRate / 2;
  const maxFreq = 2000;
  const binCount = freqData.length;
  const displayBins = Math.min(binCount, Math.ceil((maxFreq / nyquist) * binCount));
  const points: Array<[number, number]> = [];

  let maxValue = -1;
  let maxValueFrequency = 0;
  let weightedFrequency = 0;
  let amplitudeSum = 0;

  for (let index = 0; index < displayBins; index++) {
    const frequency = (index / displayBins) * maxFreq;
    const amplitude = freqData[index];
    points.push([frequency, amplitude]);
    amplitudeSum += amplitude;
    weightedFrequency += frequency * amplitude;
    if (amplitude > maxValue) {
      maxValue = amplitude;
      maxValueFrequency = frequency;
    }
  }

  peakFrequency.value = maxValueFrequency;
  peakAmplitude.value = Math.max(0, maxValue);
  spectralCentroid.value = amplitudeSum > 0 ? weightedFrequency / amplitudeSum : 0;
  sampleRateValue.value = sampleRate;

  chart.setOption(
    {
      backgroundColor: "transparent",
      animationDuration: 850,
      animationEasing: "cubicOut",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(5, 22, 39, 0.96)",
        borderColor: "rgba(55, 196, 255, 0.46)",
        borderWidth: 1,
        padding: [9, 12],
        textStyle: { color: "#dff6ff", fontSize: 11 },
        axisPointer: {
          type: "cross",
          lineStyle: { color: "rgba(76, 205, 255, 0.55)", type: "dashed" },
          crossStyle: { color: "rgba(76, 205, 255, 0.55)" },
          label: { backgroundColor: "#0877a8", color: "#fff" },
        },
        formatter: (params: any) => {
          const point = Array.isArray(params) ? params[0] : params;
          if (!point?.value) return "";
          return `<div style="color:#7edcff;font-size:10px;margin-bottom:4px">FREQUENCY RESPONSE</div><b>${Number(point.value[0]).toFixed(1)} Hz</b><span style="margin-left:14px;color:#8faec0">${Number(point.value[1]).toFixed(0)} dB</span>`;
        },
      },
      grid: { left: 62, right: 28, top: 34, bottom: 48, containLabel: false },
      xAxis: {
        type: "value",
        min: 0,
        max: maxFreq,
        interval: 250,
        name: "FREQUENCY / Hz",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: { color: "#6e9bb4", fontSize: 9, letterSpacing: 1.5 },
        axisLine: { lineStyle: { color: "rgba(99, 158, 190, 0.52)" } },
        axisTick: { show: false },
        axisLabel: {
          color: "#789db2",
          fontSize: 10,
          margin: 11,
          formatter: (value: number) => (value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : `${Math.round(value)}`),
        },
        splitLine: { show: true, lineStyle: { color: "rgba(76, 138, 171, 0.14)", type: "dashed" } },
        minorTick: { show: true, splitNumber: 5, lineStyle: { color: "rgba(76, 138, 171, 0.2)" } },
        minorSplitLine: { show: true, lineStyle: { color: "rgba(76, 138, 171, 0.045)" } },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 255,
        interval: 50,
        name: "AMPLITUDE / dB",
        nameGap: 42,
        nameLocation: "middle",
        nameTextStyle: { color: "#6e9bb4", fontSize: 9, letterSpacing: 1.2 },
        axisLine: { lineStyle: { color: "rgba(99, 158, 190, 0.52)" } },
        axisTick: { show: false },
        axisLabel: { color: "#789db2", fontSize: 10, margin: 10 },
        splitLine: { lineStyle: { color: "rgba(76, 138, 171, 0.14)", type: "dashed" } },
      },
      series: [
        {
          type: "line",
          data: points,
          smooth: 0.22,
          showSymbol: false,
          sampling: "lttb",
          lineStyle: {
            color: "#38caff",
            width: 2,
            shadowColor: "rgba(42, 198, 255, 0.58)",
            shadowBlur: 10,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(31, 189, 255, 0.38)" },
              { offset: 0.56, color: "rgba(17, 134, 210, 0.12)" },
              { offset: 1, color: "rgba(6, 51, 87, 0.015)" },
            ]),
          },
          markPoint: {
            symbol: "circle",
            symbolSize: 9,
            label: { show: false },
            itemStyle: { color: "#7fe8ff", borderColor: "#073f62", borderWidth: 2, shadowColor: "#39d6ff", shadowBlur: 12 },
            data: [{ coord: [maxValueFrequency, maxValue] }],
          },
          markLine: {
            silent: true,
            symbol: ["none", "none"],
            label: {
              show: true,
              formatter: "频谱质心",
              position: "insideEndTop",
              color: "#69bddf",
              fontSize: 9,
              padding: [3, 5],
              backgroundColor: "rgba(5, 37, 60, 0.82)",
            },
            lineStyle: { color: "rgba(63, 202, 255, 0.38)", type: "dashed", width: 1 },
            data: [{ xAxis: spectralCentroid.value }],
          },
        },
      ],
    },
    { notMerge: true },
  );
  chart.resize();
}

async function loadAndDraw() {
  if (!props.item?.audioId) return;
  resetPlayback(true);
  disposeChart();
  audioReady.value = false;
  loading.value = true;
  errorMsg.value = "";
  peakFrequency.value = 0;
  peakAmplitude.value = 0;
  spectralCentroid.value = 0;
  sampleRateValue.value = 0;

  try {
    const arrayBuffer = (await getAudioWav(props.item.audioId, false)) as ArrayBuffer;
    if (!arrayBuffer || arrayBuffer.byteLength === 0) throw new Error("未获取到音频数据");

    const ctx = getAudioCtx();
    audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    duration.value = audioBuffer.duration;
    audioReady.value = true;

    loading.value = false;
    await nextTick();
    const freqData = await computeSpectrum(audioBuffer, 2048);
    renderChart(freqData, ctx.sampleRate);
  } catch (error: any) {
    errorMsg.value = error?.message || "音频加载失败";
    loading.value = false;
    audioReady.value = false;
    duration.value = 0;
  }
}

watch(
  () => [props.visible, props.item?.audioId] as const,
  ([visible, audioId]) => {
    if (visible && audioId) loadAndDraw();
    else {
      resetPlayback(true);
      disposeChart();
      audioBuffer = null;
      audioReady.value = false;
      duration.value = 0;
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  resetPlayback(true);
  disposeChart();
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
});
// #endif
</script>

<style scoped lang="scss">
.spectrum-dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 1400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background:
    radial-gradient(circle at 50% 25%, rgba(30, 106, 160, 0.13), transparent 42%),
    rgba(11, 29, 46, 0.48);
  backdrop-filter: blur(3px);
  box-sizing: border-box;
}

.spectrum-dialog {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(80vw, 1200px);
  max-height: 92vh;
  overflow: hidden;
  background: #f4f8fb;
  border: 1px solid rgba(151, 190, 216, 0.7);
  border-radius: 8px;
  box-shadow: 0 28px 76px rgba(6, 27, 45, 0.34), 0 0 0 1px rgba(255, 255, 255, 0.74) inset;
}

.spectrum-dialog::before {
  position: absolute;
  top: 0;
  left: 18px;
  right: 18px;
  z-index: 2;
  height: 2px;
  content: "";
  background: linear-gradient(90deg, transparent, #26baf8 30%, #68d9ff 50%, #26baf8 70%, transparent);
  opacity: 0.78;
}

.spectrum-dialog__header {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 68px;
  padding: 0 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbfd 100%);
  border-bottom: 1px solid #dce8f0;
  box-sizing: border-box;
}

.spectrum-title-group,
.spectrum-title-line,
.header-status,
.analysis-status {
  display: flex;
  align-items: center;
}

.spectrum-title-group { gap: 12px; }
.spectrum-title-group > view:last-child { display: flex; flex-direction: column; gap: 4px; }
.spectrum-title-line { gap: 10px; }

.spectrum-title-mark {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 38px;
  height: 38px;
  gap: 3px;
  padding: 8px 7px;
  background: linear-gradient(145deg, #0878cf, #08a3dd);
  border: 1px solid rgba(35, 147, 212, 0.72);
  border-radius: 6px;
  box-shadow: 0 7px 15px rgba(12, 120, 191, 0.22);
  box-sizing: border-box;
}

.spectrum-title-mark text { width: 3px; background: #c6f4ff; border-radius: 2px; animation: spectrum-bars 1.3s ease-in-out infinite alternate; }
.spectrum-title-mark text:nth-child(1) { height: 9px; animation-delay: -0.3s; }
.spectrum-title-mark text:nth-child(2) { height: 19px; animation-delay: -0.8s; }
.spectrum-title-mark text:nth-child(3) { height: 14px; animation-delay: -0.5s; }
.spectrum-title-mark text:nth-child(4) { height: 7px; animation-delay: -1s; }
@keyframes spectrum-bars { to { height: 20px; opacity: 0.78; } }

.spectrum-dialog__title { color: #203f59; font-size: 17px; font-weight: 900; letter-spacing: 0.2px; }
.spectrum-device-tag { padding: 3px 8px; color: #0876c5; font-size: 11px; font-family: Consolas, monospace; font-weight: 800; background: #e8f5ff; border: 1px solid #bfe1f7; border-radius: 999px; }
.spectrum-dialog__subtitle { color: #7890a3; font-size: 9px; font-family: Consolas, monospace; letter-spacing: 1.25px; }
.header-status { gap: 12px; }
.analysis-status { gap: 6px; color: #3d718e; font-size: 11px; font-weight: 800; }
.analysis-status__dot { width: 7px; height: 7px; background: #24b985; border-radius: 50%; box-shadow: 0 0 0 4px rgba(36, 185, 133, 0.12), 0 0 10px rgba(36, 185, 133, 0.5); }

.spectrum-dialog__close {
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  color: #7890a3;
  font-size: 22px;
  line-height: 30px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 5px;
}
.spectrum-dialog__close::after { border: 0; }
.spectrum-dialog__close:hover { color: #1d4c6c; background: #edf5fa; border-color: #d3e3ed; }

.spectrum-dialog__body {
  flex: 1;
  min-height: 0;
  padding: 14px 18px 12px;
  overflow-y: auto;
  background: #edf4f8;
  box-sizing: border-box;
}

.spectrum-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 9px; margin-bottom: 10px; }
.spectrum-metric { position: relative; display: flex; flex-direction: column; gap: 7px; min-width: 0; padding: 10px 12px; overflow: hidden; background: linear-gradient(135deg, #fff, #f5fafc); border: 1px solid #d5e4ed; border-radius: 5px; box-shadow: 0 5px 14px rgba(34, 77, 106, 0.05); cursor: pointer; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s; }
.spectrum-metric:hover { border-color: #acd9f2; background: linear-gradient(135deg, #fafdff, #eaf7ff); box-shadow: 0 5px 18px rgba(8, 127, 201, 0.12); }
.spectrum-metric::after { position: absolute; top: 0; right: 0; width: 36px; height: 36px; content: ""; background: linear-gradient(135deg, transparent 50%, rgba(14, 132, 204, 0.08) 50%); }
.spectrum-metric__label { color: #71879a; font-size: 10px; font-weight: 800; }
.spectrum-metric > view { display: flex; align-items: baseline; gap: 5px; }
.spectrum-metric__value { color: #234a66; font-size: 21px; font-family: Consolas, "Courier New", monospace; font-weight: 900; line-height: 1; }
.spectrum-metric:hover .spectrum-metric__value { color: #087fc9; }
.spectrum-metric__unit { color: #8296a7; font-size: 9px; font-weight: 800; }

.spectrum-chart-panel {
  position: relative;
  min-height: clamp(280px, 40vh, 620px);
  overflow: hidden;
  background:
    radial-gradient(circle at 75% 15%, rgba(14, 123, 173, 0.17), transparent 30%),
    linear-gradient(145deg, #071a2b, #09253a 58%, #061a2a);
  border: 1px solid #1a526f;
  border-radius: 6px;
  box-shadow: 0 13px 26px rgba(7, 35, 54, 0.18), 0 0 0 1px rgba(91, 200, 244, 0.05) inset;
}
.spectrum-chart-panel::before { position: absolute; inset: 0; pointer-events: none; content: ""; background-image: linear-gradient(rgba(91, 189, 229, 0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(91, 189, 229, 0.025) 1px, transparent 1px); background-size: 22px 22px; }
.chart-topline { position: absolute; top: 9px; left: 14px; right: 14px; z-index: 3; display: flex; align-items: center; justify-content: space-between; color: #537f98; font-size: 8px; font-family: Consolas, monospace; letter-spacing: 1px; pointer-events: none; }
.chart-topline > view { display: flex; align-items: center; gap: 6px; color: #68c8eb; }
.chart-topline__pulse { width: 5px; height: 5px; background: #36d3ff; border-radius: 50%; box-shadow: 0 0 8px #36d3ff; animation: pulse-dot 1.2s ease-out infinite; }
@keyframes pulse-dot { 70% { box-shadow: 0 0 0 6px rgba(54, 211, 255, 0); } }
.chart-corner { position: absolute; z-index: 3; width: 16px; height: 16px; pointer-events: none; }
.chart-corner--top-left { top: 5px; left: 5px; border-top: 1px solid #32bde9; border-left: 1px solid #32bde9; }
.chart-corner--top-right { top: 5px; right: 5px; border-top: 1px solid #32bde9; border-right: 1px solid #32bde9; }
.chart-corner--bottom-left { bottom: 5px; left: 5px; border-bottom: 1px solid #32bde9; border-left: 1px solid #32bde9; }
.chart-corner--bottom-right { right: 5px; bottom: 5px; border-right: 1px solid #32bde9; border-bottom: 1px solid #32bde9; }
.spectrum-canvas-container { position: relative; z-index: 1; width: 100%; height: clamp(280px, 40vh, 620px); }

.spectrum-dialog__loading { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: clamp(280px, 40vh, 620px); color: #82a9be; }
.loading-radar { position: relative; display: block; width: 56px; height: 56px; margin-bottom: 13px; border: 1px solid rgba(54, 203, 255, 0.25); border-radius: 50%; box-shadow: 0 0 20px rgba(27, 165, 215, 0.12) inset; }
.loading-radar::before,
.loading-radar::after { position: absolute; content: ""; background: rgba(54, 203, 255, 0.22); }
.loading-radar::before { top: 50%; left: 5px; right: 5px; height: 1px; }
.loading-radar::after { top: 5px; bottom: 5px; left: 50%; width: 1px; }
.loading-radar > text { position: absolute; inset: 5px; display: block; overflow: hidden; border-radius: 50%; }
.loading-radar > text::before { position: absolute; top: 50%; left: 50%; width: 50%; height: 1px; content: ""; background: linear-gradient(90deg, #38d2ff, transparent); transform-origin: left center; animation: radar-spin 1.25s linear infinite; }
@keyframes radar-spin { to { transform: rotate(360deg); } }
.loading-title { color: #b9dae8; font-size: 13px; font-weight: 800; }
.loading-hint { margin-top: 5px; color: #648ba0; font-size: 10px; }
.spectrum-dialog__loading--error .loading-title { color: #f0bdbe; }
.error-symbol { display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; margin-bottom: 12px; color: #ffb2b2; font-size: 22px; font-weight: 900; background: rgba(197, 65, 65, 0.12); border: 1px solid rgba(237, 110, 110, 0.35); border-radius: 50%; }
.spectrum-dialog__empty { display: block; padding: 80px 0; color: #8a9aab; font-size: 14px; text-align: center; }

.spectrum-player { flex: none; padding: 12px 20px 14px; background: linear-gradient(180deg, #fff, #f7fafc); border-top: 1px solid #d9e6ee; }
.player-progress-row { display: flex; align-items: center; gap: 11px; }
.progress-time { flex: none; width: 44px; color: #71879a; font-size: 13px; font-family: Consolas, monospace; font-weight: 800; text-align: right; }
.progress-time--current { color: #087fc9; text-align: left; }
.progress-bar { position: relative; flex: 1; height: 16px; cursor: pointer; }
.progress-bar::before { position: absolute; top: 6px; left: 0; right: 0; height: 4px; content: ""; background: #dce7ee; border-radius: 999px; }
.progress-bar__buffer { position: absolute; top: 6px; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, rgba(133, 173, 197, 0.14), rgba(133, 173, 197, 0.38)); border-radius: 999px; }
.progress-bar__fill { position: absolute; top: 6px; left: 0; height: 4px; background: linear-gradient(90deg, #0c82dc, #31c5f2); border-radius: 999px; box-shadow: 0 0 8px rgba(24, 168, 226, 0.35); transition: width 0.08s linear; }
.progress-bar__thumb { position: absolute; top: 2px; width: 12px; height: 12px; background: #fff; border: 3px solid #18a7e1; border-radius: 50%; box-shadow: 0 2px 7px rgba(13, 100, 151, 0.28); transform: translateX(-50%); transition: left 0.08s linear; box-sizing: border-box; }
.progress-bar--disabled { cursor: not-allowed; opacity: 0.55; }
.player-controls { position: relative; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; margin-top: 8px; min-height: 52px; }
.player-control-group { display: flex; align-items: center; justify-content: center; gap: 15px; }
.seek-button { display: flex; align-items: center; justify-content: center; width: 50px; height: 34px; margin: 0; padding: 0; gap: 1px; color: #41677f; background: #f1f7fb; border: 1px solid #cbdde8; border-radius: 17px; box-shadow: 0 3px 8px rgba(38, 82, 110, 0.06); }
.seek-button::after,
.play-button::after { border: 0; }
.seek-button:hover:not([disabled]) { color: #087fc9; background: #e7f5fd; border-color: #9fd3ed; }
.seek-button[disabled],
.play-button[disabled] { opacity: 0.45; }
.seek-button__icon { width: 10px; height: 10px; position: relative; }
.seek-button__icon--minus::before { content: ""; position: absolute; top: 50%; left: 0; right: 0; height: 2px; background: currentColor; transform: translateY(-50%); border-radius: 1px; }
.seek-button__icon--plus::before,
.seek-button__icon--plus::after { content: ""; position: absolute; background: currentColor; border-radius: 1px; }
.seek-button__icon--plus::before { top: 50%; left: 0; right: 0; height: 2px; transform: translateY(-50%); }
.seek-button__icon--plus::after { left: 50%; top: 0; bottom: 0; width: 2px; transform: translateX(-50%); }
.seek-button__text { font-size: 14px; font-family: Consolas, monospace; font-weight: 900; }
.play-button { display: flex; align-items: center; justify-content: center; width: 50px; height: 50px; margin: 0; padding: 0; background: linear-gradient(145deg, #1297e8, #0872ca); border: 1px solid #0871bd; border-radius: 50%; box-shadow: 0 8px 18px rgba(8, 117, 191, 0.3), 0 0 0 5px rgba(22, 154, 222, 0.08); }
.play-button:hover:not([disabled]) { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(8, 117, 191, 0.36), 0 0 0 6px rgba(22, 154, 222, 0.1); }
.play-button--playing { background: linear-gradient(145deg, #08a6cc, #087fb4); }
.play-icon { width: 0; height: 0; margin-left: 3px; border-top: 8px solid transparent; border-bottom: 8px solid transparent; border-left: 12px solid #fff; }
.pause-icon { display: flex; gap: 4px; }
.pause-icon text { display: block; width: 4px; height: 15px; background: #fff; border-radius: 1px; }
.player-side-info { display: flex; flex-direction: column; gap: 4px; justify-self: start; }
.player-side-info--right { align-items: flex-end; justify-self: end; }
.player-side-info__label { color: #899ba9; font-size: 13px; font-weight: 800; letter-spacing: 0.4px; }
.player-side-info > view { display: flex; align-items: center; gap: 6px; color: #496b82; font-size: 14px; font-weight: 800; }
.player-side-info__dot { width: 8px; height: 8px; background: #9babb6; border-radius: 50%; }
.player-side-info__dot--active { background: #21b786; box-shadow: 0 0 7px rgba(33, 183, 134, 0.65); }
.player-side-info__duration { color: #345d77; font-size: 17px; font-family: Consolas, monospace; font-weight: 900; }


@media (max-width: 1020px) {
  .spectrum-dialog { width: 92vw; }
  .spectrum-metrics { grid-template-columns: repeat(2, 1fr); gap: 7px; }
  .spectrum-chart-panel,
  .spectrum-canvas-container,
  .spectrum-dialog__loading { min-height: clamp(240px, 35vh, 380px); height: clamp(240px, 35vh, 380px); }
  .spectrum-dialog__header { padding: 0 14px; }
  .spectrum-dialog__subtitle { display: none; }
}

</style>
