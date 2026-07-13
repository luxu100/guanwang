<template>
  <view class="chart-panel">
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

const props = defineProps<{
  title: string;
  mode: "spectrogram" | "line" | "bar";
}>();

const chartEl = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;
const unitLabel = computed(() => {
  if (props.mode === "spectrogram") return "频率/Hz";
  if (props.mode === "bar") return "比例/%";
  return "幅度";
});

onMounted(() => {
  nextTick(renderChart);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  chart?.dispose();
  chart = null;
});

watch(() => props.mode, renderChart);

function buildOption(): echarts.EChartsOption {
  if (props.mode === "bar") {
    return {
      grid: { left: 46, right: 18, top: 24, bottom: 34 },
      xAxis: { type: "category", data: ["正常", "疑似", "渗漏", "未抄"] },
      yAxis: { type: "value" },
      series: [{ type: "bar", data: [96, 3, 1, 0], itemStyle: { color: "#4b9aea" } }],
    };
  }

  if (props.mode === "line") {
    return {
      grid: { left: 48, right: 18, top: 24, bottom: 34 },
      xAxis: { type: "category", data: ["0", "1", "2", "3", "4", "5"] },
      yAxis: { type: "value" },
      series: [{
        type: "line",
        smooth: true,
        showSymbol: false,
        data: [28, 24, 26, 25, 320, 29],
        lineStyle: { width: 2, color: "#2f8de4" },
      }],
    };
  }

  const data: Array<[number, number, number]> = [];
  for (let x = 0; x < 32; x += 1) {
    for (let y = 0; y < 18; y += 1) {
      data.push([x, y, Math.round(Math.random() * 60 + (x > 28 ? 40 : 0))]);
    }
  }

  return {
    grid: { left: 44, right: 18, top: 24, bottom: 34 },
    xAxis: { type: "category", name: "时间/s", data: Array.from({ length: 32 }, (_, index) => String(index)) },
    yAxis: { type: "category", data: Array.from({ length: 18 }, (_, index) => String(index * 64)) },
    visualMap: { show: false, min: 0, max: 100, inRange: { color: ["#332288", "#2d6cdf", "#00c2ff", "#ffd447"] } },
    series: [{ type: "heatmap", data }],
  };
}

function renderChart() {
  if (!chartEl.value) {
    return;
  }

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
  min-height: 0;
  height: 220px;
  background: #fff;
  border: 1px solid #e1e8f0;
  border-radius: 4px;
}

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

.chart-panel__title {
  color: #26384d;
  font-size: 13px;
  font-weight: 800;
}

.chart-panel__unit {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}

.chart-panel__canvas {
  position: absolute;
  top: 30px;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: auto;
}

.chart-panel__fallback {
  color: #64748b;
  font-size: 14px;
  line-height: 260px;
  text-align: center;
}
</style>
