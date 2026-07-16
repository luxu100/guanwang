<template>
  <view class="chart-panel" :class="{ 'chart-panel--large': mode === 'history3d' }">
    <view class="chart-panel__header">
      <text class="chart-panel__title">{{ title }}</text>
      <text class="chart-panel__unit">{{ unitLabel }}</text>
    </view>
    <!-- #ifdef H5 -->
    <div ref="chartEl" class="chart-panel__canvas"></div>
    <!-- #endif -->
    <!-- #ifndef H5 -->
    <view class="chart-panel__fallback">当前图表仅支持 H5 展示</view>
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
import * as echarts from "echarts";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

interface NamedSeries {
  name: string;
  data: number[];
}

const props = withDefaults(defineProps<{
  title: string;
  mode: "waveform" | "spectrum" | "spectrogram" | "trend-bar" | "trend-line" | "history3d";
  data?: number[];
  matrix?: number[][];
  labels?: string[];
  series?: NamedSeries[];
}>(), {
  data: () => [],
  matrix: () => [],
  labels: () => [],
  series: () => [],
});

const chartEl = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

const unitLabel = computed(() => {
  if (props.mode === "waveform") return "幅度";
  if (props.mode === "spectrum" || props.mode === "spectrogram" || props.mode === "history3d") return "频率 / Hz";
  return "特征值";
});

onMounted(() => void nextTick(renderChart));
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  chart?.dispose();
  resizeObserver = null;
  chart = null;
});
watch(() => [props.mode, props.data, props.matrix, props.labels, props.series], renderChart, { deep: true });

function axisLabels(length: number) {
  return props.labels.length === length
    ? props.labels
    : Array.from({ length }, (_, index) => String(index));
}

function leakColor(value: number) {
  if (value >= 20) return "#ef4444";
  if (value >= 10) return "#f59e0b";
  return "#16a36a";
}

function baseGrid() {
  return { left: 52, right: 20, top: 24, bottom: 40, containLabel: false };
}

function buildOption(): echarts.EChartsOption {
  if (props.mode === "trend-bar" || props.mode === "trend-line") {
    const isBar = props.mode === "trend-bar";
    return {
      tooltip: { trigger: "axis" },
      grid: baseGrid(),
      xAxis: { type: "category", data: axisLabels(props.data.length), axisLabel: { hideOverlap: true } },
      yAxis: { type: "value", min: 0 },
      series: [{
        type: isBar ? "bar" : "line",
        data: props.data.map((value) => ({
          value,
          itemStyle: { color: leakColor(value) },
        })),
        smooth: !isBar,
        symbolSize: 7,
        lineStyle: { width: 2, color: "#4b9aea" },
        areaStyle: isBar ? undefined : { color: "rgba(75,154,234,.12)" },
      }],
    };
  }

  if (props.mode === "spectrogram") {
    const values: Array<[number, number, number]> = [];
    props.matrix.forEach((row, timeIndex) => {
      row.forEach((value, frequencyIndex) => values.push([timeIndex, frequencyIndex, value]));
    });
    return {
      tooltip: { formatter: (params: any) => "强度 " + params.value[2] },
      grid: baseGrid(),
      xAxis: { type: "category", name: "时间", data: axisLabels(props.matrix.length) },
      yAxis: {
        type: "category",
        name: "频率",
        data: Array.from({ length: props.matrix[0]?.length || 0 }, (_, index) => String(index)),
      },
      visualMap: {
        show: true,
        min: 0,
        max: 100,
        right: 0,
        top: 28,
        calculable: false,
        itemWidth: 8,
        itemHeight: 70,
        inRange: { color: ["#172554", "#1d4ed8", "#06b6d4", "#fde047", "#ef4444"] },
      },
      series: [{ type: "heatmap", data: values, progressive: 5000 }],
    };
  }

  if (props.mode === "history3d") {
    const series = props.series.map((item, seriesIndex) => ({
      name: item.name,
      type: "line" as const,
      smooth: true,
      showSymbol: false,
      data: item.data.map((value) => value + seriesIndex * 22),
      lineStyle: { width: 1.5, opacity: 0.9 },
      areaStyle: { opacity: 0.08 },
    }));
    return {
      color: ["#2563eb", "#06b6d4", "#10b981", "#84cc16", "#f59e0b", "#ef4444", "#a855f7"],
      tooltip: { trigger: "axis" },
      legend: { type: "scroll", top: 0, right: 20, left: 90, textStyle: { fontSize: 10 } },
      grid: { left: 52, right: 20, top: 45, bottom: 40 },
      xAxis: {
        type: "category",
        name: "频率",
        data: axisLabels(props.series[0]?.data.length || 0),
        axisLabel: { interval: 15 },
      },
      yAxis: { type: "value", name: "日期层", axisLabel: { show: false }, splitLine: { lineStyle: { type: "dashed" } } },
      series,
    };
  }

  const isSpectrum = props.mode === "spectrum";
  return {
    tooltip: { trigger: "axis" },
    grid: baseGrid(),
    xAxis: {
      type: "category",
      name: isSpectrum ? "频率" : "时间",
      data: axisLabels(props.data.length),
      axisLabel: { interval: Math.max(0, Math.floor(props.data.length / 8)) },
    },
    yAxis: { type: "value", name: isSpectrum ? "强度" : "幅度" },
    series: [{
      type: "line",
      smooth: isSpectrum,
      showSymbol: false,
      data: props.data,
      lineStyle: { width: 1.6, color: isSpectrum ? "#7c3aed" : "#0284c7" },
      areaStyle: isSpectrum ? { color: "rgba(124,58,237,.12)" } : undefined,
    }],
  };
}

function renderChart() {
  if (!chartEl.value) return;
  if (!chart) {
    chart = echarts.init(chartEl.value);
    resizeObserver = new ResizeObserver(() => chart?.resize());
    resizeObserver.observe(chartEl.value);
  }
  chart.setOption(buildOption(), true);
}
</script>

<style scoped lang="scss">
.chart-panel {
  position: relative;
  min-width: 0;
  height: 220px;
  background: #fff;
  border: 1px solid #e1e8f0;
  border-radius: 5px;
}
.chart-panel--large { height: 300px; }
.chart-panel__header {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 30px;
  padding: 0 10px;
  pointer-events: none;
}
.chart-panel__title { color: #26384d; font-size: 13px; font-weight: 800; }
.chart-panel__unit { color: #64748b; font-size: 11px; font-weight: 700; }
.chart-panel__canvas { position: absolute; top: 30px; right: 0; bottom: 0; left: 0; width: 100%; height: auto; }
.chart-panel__fallback { color: #64748b; font-size: 14px; line-height: 220px; text-align: center; }
</style>