<template>
  <view v-if="visible" class="spectrum-dialog-mask" @click="close">
    <view class="spectrum-dialog" @click.stop>
      <view class="spectrum-dialog__header">
        <text class="spectrum-dialog__title">频谱分析 - {{ item?.deviceId }}</text>
        <button class="spectrum-dialog__close" @click="close">✕</button>
      </view>
      <view class="spectrum-dialog__body">
        <!-- #ifdef H5 -->
        <view v-if="loading" class="spectrum-dialog__loading">加载中...</view>
        <view v-else-if="errorMsg" class="spectrum-dialog__loading">{{ errorMsg }}</view>
        <div v-else ref="containerRef" class="spectrum-canvas-container"></div>
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <text class="spectrum-dialog__empty">频谱分析仅支持 H5 端</text>
        <!-- #endif -->
      </view>
      <view class="spectrum-dialog__footer">
        <button class="toolbar-button toolbar-button--primary" :disabled="playing || loading" @click="onPlay">播放</button>
        <button v-if="playing" class="toolbar-button" @click="onStop">停止</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from "vue";
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
  district: string;
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

// #ifdef H5
let audioContext: AudioContext | null = null;
let audioBuffer: AudioBuffer | null = null;
let sourceNode: AudioBufferSourceNode | null = null;
let chartInstance: echarts.ECharts | null = null;

function close() {
  stopPlayback();
  emit("close");
}

function stopPlayback() {
  if (sourceNode) {
    try { sourceNode.stop(); } catch (_) {}
    sourceNode = null;
  }
  playing.value = false;
}

function getAudioCtx(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function getChart(): echarts.ECharts {
  if (chartInstance) {
    chartInstance.resize();
    return chartInstance;
  }
  const container = containerRef.value;
  if (!container) throw new Error("容器未就绪");
  chartInstance = echarts.init(container);
  return chartInstance;
}

function disposeChart() {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
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

  const xData: number[] = [];
  const yData: number[] = [];
  for (let i = 0; i < displayBins; i++) {
    xData.push((i / displayBins) * maxFreq);
    yData.push(freqData[i]);
  }

  chart.setOption({
    backgroundColor: "#fff",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params;
        if (!p) return "";
        return `频率: ${Number(p.axisValue).toFixed(1)}Hz 幅值: ${Number(p.value[1])}dB`;
      },
    },
    grid: { left: 56, right: 24, top: 44, bottom: 16 },
    xAxis: {
      type: "value",
      position: "bottom",
      min: 0,
      max: maxFreq,
      axisLine: { lineStyle: { color: "#000" } },
      axisTick: { lineStyle: { color: "#000" } },
      axisLabel: {
        color: "#555",
        fontSize: 12,
        formatter: (value: number) => value >= 1000 ? (value / 1000).toFixed(1) + "k" : Math.round(value) + "",
      },
      splitLine: { lineStyle: { color: "#d0d5dc", type: "dashed" } },
      name: "Hz",
      nameTextStyle: { color: "#555", fontSize: 12 },
    },
    yAxis: {
      type: "value",
      position: "left",
      min: 0,
      max: 255,
      interval: 50,
      axisLine: { lineStyle: { color: "#000" } },
      axisTick: { lineStyle: { color: "#000" } },
      axisLabel: { color: "#555", fontSize: 12 },
      splitLine: { lineStyle: { color: "#d0d5dc", type: "dashed" } },
      name: "",
    },
    series: [{
      type: "line",
      data: yData.map((y, i) => [xData[i], y]),
      smooth: false,
      symbol: "none",
      lineStyle: { color: "#0d82ee", width: 1 },
    }],
  }, { notMerge: true });
  chart.resize();
}

async function loadAndDraw() {
  if (!props.item || !props.item.audioId) return;
  loading.value = true;
  errorMsg.value = "";

  try {
    const arrayBuffer = await getAudioWav(props.item.audioId, false) as ArrayBuffer;
    if (!arrayBuffer || arrayBuffer.byteLength === 0) throw new Error("未获取到音频数据");

    const ctx = getAudioCtx();
    audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    loading.value = false;
    await nextTick();
    const freqData = await computeSpectrum(audioBuffer, 2048);
    renderChart(freqData, ctx.sampleRate);
  } catch (err: any) {
    errorMsg.value = err?.message || "加载失败";
    loading.value = false;
  }
}

function onPlay() {
  if (!audioBuffer) return;
  stopPlayback();

  const ctx = getAudioCtx();
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  sourceNode = ctx.createBufferSource();
  sourceNode.buffer = audioBuffer;
  sourceNode.connect(ctx.destination);
  sourceNode.onended = () => {
    playing.value = false;
    sourceNode = null;
  };
  sourceNode.start(0);
  playing.value = true;
}

function onStop() {
  stopPlayback();
}

watch(
  () => [props.visible, props.item] as const,
  ([v, item]) => {
    if (v && item) {
      loadAndDraw();
    } else {
      stopPlayback();
      disposeChart();
      audioBuffer = null;
    }
  }
);

onUnmounted(() => {
  stopPlayback();
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
  background: rgba(15, 35, 55, 0.22);
}

.spectrum-dialog {
  width: min(820px, calc(100vw - 24px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border-radius: 6px;
  box-shadow: 0 18px 42px rgba(15, 35, 55, 0.2);
}

.spectrum-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 54px;
  padding: 0 18px;
  border-bottom: 1px solid #edf3f8;
}

.spectrum-dialog__title {
  color: #24445f;
  font-size: 16px;
  font-weight: 800;
}

.spectrum-dialog__close {
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  color: #7f8fa3;
  font-size: 18px;
  line-height: 32px;
  text-align: center;
  background: transparent;
  border: 0;
  border-radius: 4px;
}

.spectrum-dialog__close::after {
  border: 0;
}

.spectrum-dialog__close:hover {
  color: #172033;
  background: #f5f7fa;
}

.spectrum-dialog__body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  padding: 0;
  background: #ffffff;
}

.spectrum-dialog__empty,
.spectrum-dialog__loading {
  color: #8a9aab;
  font-size: 14px;
  padding: 60px 0;
}

.spectrum-canvas-container {
  width: 100%;
  height: 400px;
}

.spectrum-dialog__footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  height: 34px;
  margin: 0;
  padding: 0 14px;
  color: #31506d;
  font-size: 13px;
  font-weight: 700;
  line-height: 34px;
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

.toolbar-button[disabled] {
  opacity: 0.5;
}
</style>
