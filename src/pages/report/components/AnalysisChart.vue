<template>
  <view class="chart-wrap">
    <!-- #ifdef H5 -->
    <div ref="element" class="chart-canvas"></div>
    <!-- #endif -->
    <!-- #ifndef H5 -->
    <view class="fallback">请在网页端查看分析图表</view>
    <!-- #endif -->
  </view>
</template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import * as echarts from 'echarts';
const props = defineProps<{ option: echarts.EChartsOption }>();
const element = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | undefined;
let observer: ResizeObserver | undefined;
function resize() { chart?.resize(); }
onMounted(() => {
  // #ifdef H5
  if (!element.value) return;
  chart = echarts.init(element.value); chart.setOption(props.option);
  if (typeof ResizeObserver !== 'undefined') { observer = new ResizeObserver(resize); observer.observe(element.value); }
  window.addEventListener('resize', resize);
  // #endif
});
watch(() => props.option, option => chart?.setOption(option, true), { deep: true });
onBeforeUnmount(() => {
  observer?.disconnect(); chart?.dispose();
  // #ifdef H5
  window.removeEventListener('resize', resize);
  // #endif
});
</script>
<style scoped>
.chart-wrap,
.chart-canvas {
  width: 100%;
  height: 310px;
  min-width: 0;
}

.fallback {
  padding: 100px 0;
  text-align: center;
  color: #8295a7;
}
</style>
