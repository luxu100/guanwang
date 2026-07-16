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
    <view class="chart-panel__fallback">{{ t("currentChartH5Only") }}</view>
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
import * as echarts from "echarts";
import "echarts-gl";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useLeakMonitorI18n } from "../i18n";

const { t } = useLeakMonitorI18n();

interface NamedSeries {
  name: string;
  data: number[];
  maxFrequency?: number;
}

const props = withDefaults(defineProps<{
  title: string;
  mode: "waveform" | "spectrum" | "spectrogram" | "trend-bar" | "trend-line" | "history3d";
  data?: number[];
  matrix?: number[][];
  labels?: string[];
  series?: NamedSeries[];
  xMaximum?: number;
  yMaximum?: number;
}>(), {
  data: () => [],
  matrix: () => [],
  labels: () => [],
  series: () => [],
  xMaximum: 0,
  yMaximum: 0,
});

const chartEl = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

const unitLabel = computed(() => {
  if (props.mode === "waveform") return t("amplitude");
  if (props.mode === "spectrum" || props.mode === "spectrogram" || props.mode === "history3d") return t("frequency");
  return t("featureValue");
});

onMounted(() => void nextTick(renderChart));
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  chart?.dispose();
  resizeObserver = null;
  chart = null;
});
watch(
  () => [props.mode, props.data, props.matrix, props.labels, props.series, props.xMaximum, props.yMaximum],
  renderChart,
  { deep: true },
);

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

function numericPoints(values: number[], maximum: number) {
  return values.map((value, index) => [
    values.length > 1 ? (index * maximum) / (values.length - 1) : 0,
    value,
  ]);
}

function zoomControls(includeVertical = false): echarts.DataZoomComponentOption[] {
  const controls: echarts.DataZoomComponentOption[] = [
    {
      type: "inside",
      xAxisIndex: 0,
      filterMode: "none",
      zoomOnMouseWheel: true,
      moveOnMouseMove: true,
      moveOnMouseWheel: false,
    },
    {
      type: "slider",
      xAxisIndex: 0,
      filterMode: "none",
      height: 14,
      bottom: 5,
      borderColor: "#cbd5e1",
      fillerColor: "rgba(14,165,233,.16)",
      handleStyle: { color: "#0ea5e9" },
      showDetail: false,
    },
  ];
  if (includeVertical) {
    controls.push({
      type: "inside",
      yAxisIndex: 0,
      filterMode: "none",
      zoomOnMouseWheel: "shift",
      moveOnMouseMove: true,
    });
  }
  return controls;
}

function toolbox(): echarts.ToolboxComponentOption {
  return {
    show: true,
    right: 8,
    top: 0,
    itemSize: 14,
    feature: {
      dataZoom: { yAxisIndex: false },
      restore: {},
      saveAsImage: { pixelRatio: 2 },
    },
  } as echarts.ToolboxComponentOption;
}

function valueTooltip(xLabel: string, yLabel: string, xDigits = 2) {
  return (params: any) => {
    const item = Array.isArray(params) ? params[0] : params;
    const value = item?.value || [];
    return [
      item?.marker ? item.marker + (item.seriesName || "") : "",
      `${xLabel}: ${Number(value[0] ?? 0).toFixed(xDigits)}`,
      `${yLabel}: ${Number(value[1] ?? 0).toFixed(3)}`,
    ].filter(Boolean).join("<br/>");
  };
}

function buildHistoryOption(): echarts.EChartsOption {
  const palette = ["#1685d1", "#9b174c", "#6dad3b", "#7b4b96", "#e5a91a", "#0f9f91", "#e05d44"];
  const maxFrequency = Math.max(
    1,
    ...props.series.map((item) => item.maxFrequency || props.xMaximum || 2048),
  );
  const maxAmplitude = Math.max(100, ...props.series.flatMap((item) => item.data));
  const dates = props.series.map((item) => item.name);
  const series = props.series.map((item, layerIndex) => {
    const color = palette[layerIndex % palette.length];
    const frequencyMaximum = item.maxFrequency || maxFrequency;
    return {
      name: item.name,
      type: "line3D",
      coordinateSystem: "cartesian3D",
      data: item.data.map((value, index) => [
        item.data.length > 1
          ? (index * frequencyMaximum) / (item.data.length - 1)
          : 0,
        item.name,
        value,
      ]),
      lineStyle: {
        color,
        width: 3,
        opacity: 0.96,
      },
      emphasis: {
        lineStyle: { width: 5, opacity: 1 },
      },
      silent: false,
    };
  });

  return {
    animation: false,
    color: palette,
    tooltip: {
      trigger: "item",
      formatter(params: any) {
        const value = params?.value || [];
        return [
          params?.marker + (params?.seriesName || ""),
          `${t("frequency")}: ${Number(value[0] || 0).toFixed(1)}`,
          `${t("dateLayer")}: ${String(value[1] || params?.seriesName || "")}`,
          `${t("amplitude")}: ${Number(value[2] || 0).toFixed(2)}`,
        ].join("<br/>");
      },
    },
    toolbox: {
      show: true,
      right: 8,
      top: 0,
      itemSize: 14,
      feature: {
        restore: {},
        saveAsImage: { pixelRatio: 2 },
      },
    },
    grid3D: {
      left: 8,
      right: 8,
      top: 8,
      bottom: 4,
      boxWidth: 210,
      boxDepth: Math.max(72, Math.min(132, dates.length * 18)),
      boxHeight: 112,
      environment: "#ffffff",
      axisLine: { lineStyle: { color: "#475569" } },
      axisPointer: {
        show: true,
        lineStyle: { color: "#0ea5e9", width: 1 },
        label: { show: true },
      },
      splitLine: {
        show: true,
        lineStyle: { color: "#d7dee7", width: 1 },
      },
      splitArea: {
        show: true,
        areaStyle: { color: ["rgba(248,250,252,.72)", "rgba(241,245,249,.42)"] },
      },
      viewControl: {
        projection: "perspective",
        alpha: 20,
        beta: -34,
        distance: 200,
        minDistance: 88,
        maxDistance: 300,
        rotateSensitivity: 1,
        zoomSensitivity: 1,
        panSensitivity: 1,
        autoRotate: false,
      },
      light: {
        main: { intensity: 0.7, shadow: false },
        ambient: { intensity: 0.8 },
      },
    },
    xAxis3D: {
      type: "value",
      name: t("frequency"),
      min: 0,
      max: maxFrequency,
      splitNumber: 6,
      axisLabel: { formatter: (value: number) => String(Math.round(value)) },
    },
    yAxis3D: {
      type: "category",
      name: t("dateLayer"),
      data: dates,
      axisLabel: {
        formatter: (value: string) => value.slice(5) || value,
      },
    },
    zAxis3D: {
      type: "value",
      name: t("amplitude"),
      min: 0,
      max: Math.ceil(maxAmplitude / 20) * 20,
      splitNumber: 5,
    },
    series,
  } as unknown as echarts.EChartsOption;
}

function buildOption(): echarts.EChartsOption {
  if (props.mode === "trend-bar" || props.mode === "trend-line") {
    const isBar = props.mode === "trend-bar";
    return {
      animation: false,
      tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
      toolbox: toolbox(),
      grid: { left: 52, right: 20, top: 28, bottom: 54 },
      xAxis: { type: "category", data: axisLabels(props.data.length), axisLabel: { hideOverlap: true } },
      yAxis: { type: "value", min: 0 },
      dataZoom: zoomControls(),
      series: [{
        type: isBar ? "bar" : "line",
        barMaxWidth: isBar ? 52 : undefined,
        barMinWidth: isBar ? 18 : undefined,
        barCategoryGap: isBar ? "58%" : undefined,
        data: props.data.map((value) => ({
          value,
          itemStyle: { color: leakColor(value) },
        })),
        smooth: false,
        symbolSize: 7,
        lineStyle: { width: 2, color: "#1685d1" },
        areaStyle: isBar ? undefined : { color: "rgba(22,133,209,.12)" },
      }],
    };
  }

  if (props.mode === "spectrogram") {
    const duration = props.xMaximum || Math.max(1, props.matrix.length - 1);
    const maxFrequency = props.yMaximum || Math.max(1, (props.matrix[0]?.length || 1) - 1);
    const timeLabels = props.matrix.map((_, index) =>
      props.matrix.length > 1
        ? ((index * duration) / (props.matrix.length - 1)).toFixed(2)
        : "0.00");
    const frequencyCount = props.matrix[0]?.length || 0;
    const frequencyLabels = Array.from({ length: frequencyCount }, (_, index) =>
      frequencyCount > 1
        ? ((index * maxFrequency) / (frequencyCount - 1)).toFixed(1)
        : "0.0");
    const values: Array<[number, number, number]> = [];
    props.matrix.forEach((row, timeIndex) => {
      row.forEach((value, frequencyIndex) => values.push([timeIndex, frequencyIndex, value]));
    });
    return {
      animation: false,
      backgroundColor: "#ffffff",
      tooltip: {
        trigger: "item",
        axisPointer: { type: "cross" },
        formatter(params: any) {
          const timeIndex = Number(params.value[0]);
          const frequencyIndex = Number(params.value[1]);
          return [
            `${t("time")}: ${timeLabels[timeIndex] || "0.00"} s`,
            `${t("frequency")}: ${frequencyLabels[frequencyIndex] || "0.0"}`,
            `${t("intensity")}: ${Number(params.value[2]).toFixed(2)}`,
          ].join("<br/>");
        },
      },
      toolbox: toolbox(),
      graphic: [
        {
          type: "text",
          left: 8,
          top: 2,
          style: {
            text: t("frequency").replace(/\s/g, ""),
            fill: "#1f2937",
            font: "700 12px sans-serif",
          },
        },
        {
          type: "text",
          right: 8,
          bottom: 22,
          style: {
            text: `${t("time")}/s`,
            fill: "#1f2937",
            font: "700 12px sans-serif",
          },
        },
      ],
      grid: { left: 62, right: 42, top: 18, bottom: 46 },
      xAxis: {
        type: "category",
        data: timeLabels,
        boundaryGap: true,
        axisLine: { lineStyle: { color: "#303846", width: 1 } },
        axisTick: { show: false },
        axisLabel: {
          color: "#303846",
          fontSize: 11,
          interval: Math.max(0, Math.floor(timeLabels.length / 4) - 1),
          margin: 8,
        },
        splitLine: { show: false },
        splitArea: { show: false },
      },
      yAxis: {
        type: "category",
        data: frequencyLabels,
        boundaryGap: true,
        axisLine: { lineStyle: { color: "#303846", width: 1 } },
        axisTick: { show: false },
        axisLabel: {
          color: "#303846",
          fontSize: 11,
          interval: Math.max(0, Math.floor(frequencyLabels.length / 4) - 1),
          margin: 8,
        },
        splitLine: { show: false },
        splitArea: { show: false },
      },
      dataZoom: zoomControls(true),
      visualMap: {
        show: false,
        min: 0,
        max: 100,
        inRange: {
          color: ["#151b62", "#2636a8", "#4652ce", "#665ed5", "#8b70dc", "#b79ae7"],
        },
      },
      series: [{
        type: "heatmap",
        data: values,
        progressive: 0,
        itemStyle: {
          borderColor: "rgba(218,205,255,.48)",
          borderWidth: 0.35,
        },
        emphasis: {
          itemStyle: {
            borderColor: "#ffffff",
            borderWidth: 1,
            shadowBlur: 4,
            shadowColor: "rgba(15,23,42,.35)",
          },
        },
      }],
    };
  }

  if (props.mode === "history3d") return buildHistoryOption();

  const isSpectrum = props.mode === "spectrum";
  const maximum = props.xMaximum || Math.max(1, props.data.length - 1);
  const points = numericPoints(props.data, maximum);
  const xLabel = isSpectrum ? t("frequency") : `${t("time")} / s`;
  const yLabel = isSpectrum ? t("intensity") : t("amplitude");
  return {
    animation: false,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross", snap: true },
      formatter: valueTooltip(xLabel, yLabel, isSpectrum ? 1 : 3),
    },
    toolbox: toolbox(),
    grid: { left: 58, right: 20, top: 28, bottom: 54 },
    xAxis: {
      type: "value",
      name: xLabel,
      min: 0,
      max: maximum,
      axisPointer: { show: true, label: { show: true } },
      splitLine: { lineStyle: { color: "#e2e8f0" } },
    },
    yAxis: {
      type: "value",
      name: yLabel,
      scale: props.mode === "waveform",
      axisPointer: { show: true, label: { show: true } },
      splitLine: { lineStyle: { color: "#e2e8f0" } },
    },
    dataZoom: zoomControls(),
    series: [{
      name: props.title,
      type: "line",
      smooth: false,
      showSymbol: false,
      sampling: "lttb",
      data: points,
      lineStyle: { width: 1.4, color: isSpectrum ? "#7c3aed" : "#0284c7" },
      areaStyle: isSpectrum ? { color: "rgba(124,58,237,.10)" } : undefined,
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
  height: 250px;
  background: #fff;
  border: 1px solid #e1e8f0;
  border-radius: 5px;
}
.chart-panel--large {
  height: clamp(520px, calc(100vh - 560px), 680px);
  min-height: 520px;
}
.chart-panel__header {
  position: absolute;
  top: 0;
  right: 112px;
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
.chart-panel__fallback { color: #64748b; font-size: 14px; line-height: 250px; text-align: center; }
</style>
