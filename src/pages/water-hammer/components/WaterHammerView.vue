<template>
  <view class="water-hammer-view">
    <header class="page-heading">
      <view class="heading-title"><h1>{{ tx('水锤分析', 'Water Hammer') }}</h1><span class="mock-badge">{{ tx('Mock · 静态模拟', 'Mock · Static simulation') }}</span></view>
      <view class="heading-actions">
        <label class="device-picker">{{ tx('监测设备', 'Device') }}
          <select v-model="selectedDeviceId" :disabled="busy" aria-label="监测设备 / Device"><option v-for="device in MOCK_DEVICES" :key="device.id" :value="device.id">{{ device.id }}</option></select>
        </label>
        <button class="icon-button" :title="tx('恢复正常波形', 'Reset to normal waveform')" :aria-label="tx('恢复正常波形', 'Reset to normal waveform')" :disabled="busy || !result" @click="resetResult"><image src="/static/icons/refresh-cw.svg" /></button>
        <button class="primary-button" :disabled="busy" @click="openEditor"><image src="/static/icons/facility-valve.svg" />{{ tx('模拟水锤', 'Simulate water hammer') }}</button>
      </view>
    </header>
    <p class="data-disclaimer">{{ tx('设备、阀门和波形均为模拟数据；不发送阀门指令，不作为实际管网安全评估依据。', 'Devices, valves and waveforms are simulated. No valve commands are sent; results are not a network safety assessment.') }}</p>

    <view class="metrics">
      <view class="metric"><span>{{ tx('基准压力', 'Baseline pressure') }}</span><strong>{{ device.pressure.toFixed(3) }}<small>MPa</small></strong></view>
      <view class="metric"><span>{{ tx('最高压力', 'Maximum pressure') }}</span><strong class="pressure-high">{{ summary.maximum.toFixed(3) }}<small>MPa</small></strong></view>
      <view class="metric"><span>{{ tx('最低压力', 'Minimum pressure') }}</span><strong>{{ summary.minimum.toFixed(3) }}<small>MPa</small></strong></view>
      <view class="metric"><span>{{ tx('最大模拟扰动', 'Maximum simulated deviation') }}</span><strong>{{ summary.maxDeviation.toFixed(3) }}<small>MPa</small></strong></view>
    </view>

    <section class="waveform-section" :aria-busy="busy">
      <view class="section-heading">
        <h2>{{ tx('压力波形', 'Pressure waveform') }}</h2>
        <view class="waveform-modes" role="group" :aria-label="tx('波形显示', 'Waveform display')">
          <button v-for="mode in modes" :key="mode.value" :class="{ selected: chartMode === mode.value }" :disabled="busy || (mode.value !== 'normal' && !result)" @click="chartMode = mode.value">{{ mode.label }}</button>
        </view>
      </view>
      <div ref="chartEl" class="pressure-chart" role="img" :aria-label="tx('60 秒压力变化趋势，单位 MPa', '60-second pressure trend in MPa')"></div>
      <DashboardLoading :active="busy" :label="tx('正在加载波形…', 'Loading waveform…')" />
    </section>

    <view class="details-grid">
      <section class="device-status">
        <view class="section-heading"><h2>{{ tx('设备最新状态', 'Latest device status') }}</h2><span class="normal-status">{{ tx('正常 · Mock', 'Normal · Mock') }}</span></view>
        <dl><div><dt>{{ tx('设备编号', 'Device number') }}</dt><dd>{{ device.id }}</dd></div><div><dt>{{ tx('电压', 'Voltage') }}</dt><dd>{{ device.voltage.toFixed(2) }} V</dd></div><div><dt>{{ tx('通信状态', 'Communication') }}</dt><dd>{{ tx('在线（模拟）', 'Online (simulated)') }}</dd></div><div><dt>{{ tx('采集时间', 'Sample time') }}</dt><dd>{{ sampleTime }}</dd></div></dl>
      </section>
      <section class="operation-results">
        <view class="section-heading"><h2>{{ tx('阀门操作记录', 'Valve operations') }}</h2><span>{{ result ? result.operations.length : 0 }} {{ tx('项', 'operations') }}</span></view>
        <view v-if="!result" class="empty-state"><image src="/static/icons/facility-valve.svg" /><span>{{ tx('尚未执行模拟', 'No simulation yet') }}</span></view>
        <view v-else class="table-scroll"><table><thead><tr><th>{{ tx('阀门', 'Valve') }}</th><th>{{ tx('操作 / 开度', 'Action / Opening') }}</th><th>{{ tx('开始', 'Start') }}</th><th>{{ tx('耗时', 'Duration') }}</th></tr></thead><tbody><tr v-for="operation in result.operations" :key="operation.id"><td>{{ operation.valveId }}</td><td>{{ operation.targetOpening < operation.initialOpening ? tx('关阀', 'Close') : tx('开阀', 'Open') }} · {{ operation.initialOpening }}% → {{ operation.targetOpening }}%</td><td>{{ operation.start }} s</td><td>{{ operation.duration }} s</td></tr></tbody></table></view>
      </section>
    </view>

    <view v-if="editorVisible" class="editor-backdrop" @click.self="closeEditor">
      <section ref="editorEl" class="simulation-editor" role="dialog" aria-modal="true" :aria-label="tx('阀门操作模拟', 'Valve operation simulation')" tabindex="-1" @keydown.esc="closeEditor" @keydown.tab="trapEditorFocus">
        <header class="editor-heading"><view><h2>{{ tx('阀门操作模拟', 'Valve operation simulation') }}</h2><span>{{ device.id }} · {{ tx('Mock 场景', 'Mock scenario') }}</span></view><button class="icon-button" :title="tx('关闭', 'Close')" :aria-label="tx('关闭', 'Close')" @click="closeEditor"><image class="close-icon" src="/static/icons/chevron-up.svg" /></button></header>
        <view class="editor-content">
          <label class="preset-label">{{ tx('操作场景', 'Scenario') }}<select v-model="preset" aria-label="操作场景 / Scenario" @change="applyPreset"><option value="fast">{{ tx('快速关阀', 'Fast closure') }}</option><option value="slow">{{ tx('缓慢关阀', 'Slow closure') }}</option><option value="open">{{ tx('开阀扰动', 'Opening disturbance') }}</option><option value="sequence">{{ tx('先关后开', 'Close then open') }}</option></select></label>
          <view class="operations-heading"><h3>{{ tx('阀门操作', 'Valve operations') }}</h3><button class="text-button" :disabled="draftOperations.length >= 6" @click="addOperation">+ {{ tx('添加操作', 'Add operation') }}</button></view>
          <view v-for="(operation, index) in draftOperations" :key="operation.id" class="operation-form">
            <view class="operation-label"><strong>{{ tx('操作', 'Operation') }} {{ index + 1 }}</strong><button class="text-button danger" :aria-label="tx('删除操作', 'Remove operation') + ' ' + (index + 1)" @click="draftOperations.splice(index, 1)">{{ tx('移除', 'Remove') }}</button></view>
            <view class="operation-fields">
              <label>{{ tx('模拟阀门', 'Mock valve') }}<select v-model="operation.valveId" :aria-label="tx('模拟阀门', 'Mock valve') + ' ' + (index + 1)"><option v-for="valve in MOCK_VALVES" :key="valve.id" :value="valve.id">{{ valve.id }} · {{ tx('初始', 'Initial') }} {{ valve.opening }}%</option></select></label>
              <label>{{ tx('目标开度 (%)', 'Target opening (%)') }}<input v-model.number="operation.targetOpening" type="number" min="0" max="100" :aria-label="tx('目标开度', 'Target opening') + ' ' + (index + 1)" /></label>
              <label>{{ tx('开始时间 (s)', 'Start time (s)') }}<input v-model.number="operation.start" type="number" min="1" max="54.8" step="0.1" :aria-label="tx('开始时间', 'Start time') + ' ' + (index + 1)" /></label>
              <label>{{ tx('操作耗时 (s)', 'Duration (s)') }}<input v-model.number="operation.duration" type="number" min="0.2" max="30" step="0.1" :aria-label="tx('操作耗时', 'Duration') + ' ' + (index + 1)" /></label>
            </view>
          </view>
          <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        </view>
        <footer class="editor-footer"><button class="secondary-button" @click="closeEditor">{{ tx('取消', 'Cancel') }}</button><button class="primary-button" :disabled="busy" @click="simulate"><image src="/static/icons/facility-valve.svg" />{{ tx('开始模拟', 'Run simulation') }}</button></footer>
      </section>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { useI18n } from '@/i18n';
import DashboardLoading from '@/pages/one-map/components/DashboardLoading.vue';
import { baselineWaveform, generateMockSimulation, MOCK_DEVICES, MOCK_VALVES, validateOperations, type MockValveOperation, type OperationError } from '../mock';

const { locale } = useI18n();
const tx = (zh: string, en: string) => locale.value === 'en-US' ? en : zh;
const selectedDeviceId = ref(MOCK_DEVICES[0].id);
const device = computed(() => MOCK_DEVICES.find((item) => item.id === selectedDeviceId.value) || MOCK_DEVICES[0]);
const baseline = computed(() => baselineWaveform(device.value));
const result = ref<ReturnType<typeof generateMockSimulation> | null>(null);
const summary = computed(() => result.value || { maximum: Math.max(...baseline.value.map((point) => point[1])), minimum: Math.min(...baseline.value.map((point) => point[1])), maxDeviation: 0 });
const chartMode = ref<'normal' | 'compare' | 'simulated'>('normal');
const modes = computed(() => [{ value: 'normal' as const, label: tx('正常', 'Normal') }, { value: 'compare' as const, label: tx('对比', 'Compare') }, { value: 'simulated' as const, label: tx('模拟', 'Simulated') }]);
const editorVisible = ref(false);
const editorEl = ref<HTMLElement | null>(null);
const chartEl = ref<HTMLElement | null>(null);
const busy = ref(false);
const preset = ref('fast');
const formErrorCode = ref<OperationError | null>(null);
const draftOperations = ref<MockValveOperation[]>([]);
const sampleTime = ref(formatTime());
let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let nextId = 0;
let previousFocus: HTMLElement | null = null;

const formError = computed(() => {
  const errors: Record<OperationError, [string, string]> = {
    required: ['请添加 1–6 项阀门操作', 'Add between 1 and 6 valve operations'],
    valve: ['请选择有效的模拟阀门', 'Select a valid mock valve'],
    number: ['请完整填写有效的数字', 'Complete all fields with valid numbers'],
    range: ['开度应为 0–100%；开始时间至少 1 秒，耗时 0.2–30 秒，操作须在 55 秒内结束', 'Opening must be 0–100%; start at 1 s or later, duration 0.2–30 s, and finish by 55 s'],
    overlap: ['同一阀门的操作时间不能重叠', 'Operations on the same valve cannot overlap'],
    unchanged: ['目标开度与该阀门操作前的开度相同', 'Target opening is unchanged from the previous valve state'],
  };
  return formErrorCode.value ? tx(...errors[formErrorCode.value]) : '';
});

function formatTime() { return new Date().toLocaleString('sv-SE'); }
function operation(valveId = 'MV-001', start = 10, duration = 0.8, targetOpening = 0): MockValveOperation {
  return { id: 'mock-operation-' + ++nextId, valveId, start, duration, targetOpening };
}
function applyPreset() {
  formErrorCode.value = null;
  draftOperations.value = preset.value === 'open' ? [operation('MV-003', 10, 1, 100)]
    : preset.value === 'sequence' ? [operation(), operation('MV-001', 30, 3, 100)]
    : [operation('MV-001', 10, preset.value === 'slow' ? 10 : 0.8, 0)];
}
function addOperation() {
  if (draftOperations.value.length >= 6) return;
  draftOperations.value.push(operation('MV-002', Math.min(45, 10 + draftOperations.value.length * 6), 2, 0));
}
async function openEditor() {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  if (!draftOperations.value.length) applyPreset();
  formErrorCode.value = null;
  editorVisible.value = true;
  await nextTick();
  editorEl.value?.focus();
}
function closeEditor() { editorVisible.value = false; previousFocus?.focus(); }
function trapEditorFocus(event: KeyboardEvent) {
  const controls = editorEl.value?.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), input:not(:disabled)');
  if (!controls?.length) return;
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && (document.activeElement === first || document.activeElement === editorEl.value)) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === editorEl.value)) {
    event.preventDefault(); first.focus();
  }
}
function simulate() {
  if (busy.value) return;
  formErrorCode.value = validateOperations(draftOperations.value);
  if (formErrorCode.value) return;
  const snapshot = draftOperations.value.map((item) => ({ ...item }));
  const selectedDevice = device.value;
  closeEditor();
  busy.value = true;
  timer = setTimeout(() => {
    result.value = generateMockSimulation(selectedDevice, snapshot);
    chartMode.value = 'compare';
    busy.value = false;
    timer = null;
  }, 450);
}
function resetResult() { result.value = null; chartMode.value = 'normal'; }
function renderChart() {
  if (!chart) return;
  const pressures = [...baseline.value, ...(chartMode.value !== 'normal' && result.value ? result.value.waveform : [])].map((point) => point[1]);
  const lowerBound = Math.min(0.15, Math.floor((Math.min(...pressures) - 0.03) * 20) / 20);
  const upperBound = Math.max(0.7, Math.ceil((Math.max(...pressures) + 0.03) * 20) / 20);
  const series: echarts.SeriesOption[] = [];
  if (chartMode.value !== 'simulated') series.push({ name: tx('正常波形 · Mock', 'Normal waveform · Mock'), type: 'line', data: baseline.value, showSymbol: false, lineStyle: { color: '#1682db', width: 2 }, itemStyle: { color: '#1682db' } });
  if (result.value && chartMode.value !== 'normal') series.push({ name: tx('模拟波形 · Mock', 'Simulated waveform · Mock'), type: 'line', data: result.value.waveform, showSymbol: false, lineStyle: { color: '#e26b35', width: 2 }, itemStyle: { color: '#e26b35' }, markLine: { silent: true, symbol: 'none', label: { show: false }, lineStyle: { color: '#94a3b8', type: 'dashed' }, data: result.value.operations.map((item) => ({ xAxis: item.start })) } });
  chart.setOption({
    animationDuration: 350,
    textStyle: { fontFamily: '"Microsoft YaHei", "Segoe UI", sans-serif', fontSize: 13 },
    color: ['#1682db', '#e26b35'],
    tooltip: { trigger: 'axis', confine: true, valueFormatter: (value: unknown) => Number(value).toFixed(4) + ' MPa' },
    legend: { top: 10, right: 20, icon: 'roundRect' },
    grid: { top: 58, left: 64, right: 30, bottom: 88 },
    xAxis: { type: 'value', name: 's', min: 0, max: 60, axisLine: { lineStyle: { color: '#cbd5e1' } }, axisLabel: { color: '#64748b' }, splitLine: { show: false } },
    yAxis: { type: 'value', name: 'MPa', min: lowerBound, max: upperBound, axisLabel: { color: '#64748b', formatter: (value: number) => value.toFixed(2) }, splitLine: { lineStyle: { color: '#edf1f5' } } },
    dataZoom: [{ type: 'inside', xAxisIndex: 0 }, { type: 'slider', xAxisIndex: 0, height: 22, bottom: 18, borderColor: '#dce3eb', fillerColor: 'rgba(24,130,219,.1)' }],
    series,
  }, { notMerge: true });
}
watch([result, chartMode, locale, baseline], () => { void nextTick(renderChart); });
watch(selectedDeviceId, () => {
  resetResult();
  busy.value = true;
  sampleTime.value = formatTime();
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { busy.value = false; timer = null; }, 300);
});
watch(draftOperations, () => { formErrorCode.value = null; }, { deep: true });
onMounted(() => {
  if (!chartEl.value) return;
  chart = echarts.init(chartEl.value);
  renderChart();
  resizeObserver = new ResizeObserver(() => chart?.resize());
  resizeObserver.observe(chartEl.value);
});
onBeforeUnmount(() => { if (timer) clearTimeout(timer); resizeObserver?.disconnect(); chart?.dispose(); chart = null; });
</script>

<style scoped lang="scss">
.water-hammer-view { box-sizing: border-box; height: 100%; overflow-y: auto; padding: 22px 24px 28px; background: #f5f7fa; color: #243b53; font-family: inherit; font-size: 14px; letter-spacing: 0; }
header, section, footer, div, view { box-sizing: border-box; }
h1, h2, h3, p { margin: 0; }
h1 { font-size: 22px; font-weight: 600; }
h2 { font-size: 16px; font-weight: 600; }
h3 { font-size: 14px; font-weight: 600; }
button, uni-button { margin: 0; padding: 0; display: inline-flex; align-items: center; justify-content: center; gap: 7px; font: inherit; line-height: 1.3; border-radius: 6px; cursor: pointer; }
button::after, uni-button::after { display: none; }
button:disabled, uni-button[disabled="true"] { cursor: not-allowed; opacity: .5; }
button:focus-visible, uni-button:focus-visible, select:focus-visible, input:focus-visible { outline: 2px solid #1876db; outline-offset: 2px; }
.primary-button image, .primary-button uni-image, .icon-button image, .icon-button uni-image { width: 19px; height: 19px; flex-shrink: 0; }
.page-heading, .heading-title, .heading-actions, .section-heading, .operations-heading, .operation-label { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.page-heading { flex-wrap: wrap; }
.heading-title { justify-content: flex-start; }
.heading-actions { flex-wrap: wrap; }
.mock-badge { color: #936c17; background: #fff5dc; font-size: 12px; padding: 5px 8px; border-radius: 4px; white-space: nowrap; }
.data-disclaimer { color: #667085; font-size: 13px; margin: 10px 0 20px; line-height: 1.6; }
.device-picker { display: flex; align-items: center; gap: 10px; }
select, input, uni-input { box-sizing: border-box; height: 36px; width: 100%; border: 1px solid #d3dee9; border-radius: 5px; padding: 0 10px; background: #fff; color: #243b53; font: inherit; }
uni-input :deep(input) { font: inherit; }
.device-picker select { width: 180px; }
.primary-button, .secondary-button { min-height: 36px; padding: 8px 14px; border: 1px solid #1876db; background: #1876db; color: white; }
.secondary-button { background: white; color: #475569; border-color: #cbd5e1; }
.icon-button { width: 36px; height: 36px; background: white; border: 1px solid #d3dee9; flex-shrink: 0; }
.primary-button:hover:not(:disabled):not([disabled="true"]) { background: #0866c6; }
.metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 18px; }
.metric { padding: 16px 20px; background: white; border: 1px solid #e1e7ef; border-radius: 6px; }
.metric span { color: #64748b; font-size: 13px; }
.metric strong { display: flex; gap: 10px; align-items: baseline; font-size: 26px; font-weight: 600; margin-top: 10px; font-variant-numeric: tabular-nums; }
.metric small { font-size: 12px; color: #64748b; font-weight: 400; }
.pressure-high { color: #c3642f; }
.waveform-section { position: relative; background: white; border-top: 1px solid #e1e7ef; border-bottom: 1px solid #e1e7ef; }
.section-heading { padding: 16px 20px; border-bottom: 1px solid #edf1f5; min-height: 60px; }
.section-heading > span { font-size: 12px; color: #64748b; }
.waveform-modes { display: flex; border: 1px solid #d5e1ec; border-radius: 5px; overflow: hidden; }
.waveform-modes button, .waveform-modes uni-button { border: 0; border-radius: 0; padding: 6px 15px; background: white; color: #64748b; min-width: 62px; }
.waveform-modes .selected { background: #e9f3ff; color: #1876db; }
.pressure-chart { width: 100%; height: 400px; min-width: 0; }
.details-grid { display: grid; grid-template-columns: minmax(280px, .75fr) minmax(0, 1.25fr); gap: 20px; margin-top: 20px; }
.device-status, .operation-results { background: white; min-width: 0; border-top: 1px solid #e1e7ef; border-bottom: 1px solid #e1e7ef; }
.section-heading .normal-status { color: #16845b; }
dl { margin: 0; padding: 10px 20px 16px; }
dl div { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; }
dt { color: #64748b; }
dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; }
.empty-state { display: flex; gap: 10px; justify-content: center; align-items: center; color: #94a3b8; min-height: 160px; }
.empty-state image, .empty-state uni-image { width: 28px; height: 28px; opacity: .65; }
.table-scroll { overflow: auto; }
table { border-collapse: collapse; width: 100%; font-size: 13px; }
th, td { text-align: left; padding: 13px 18px; border-bottom: 1px solid #edf1f5; white-space: nowrap; }
th { font-weight: 500; color: #64748b; background: #f9fbfd; }
.editor-backdrop { position: fixed; inset: 0; z-index: 1100; background: rgb(15 23 42 / 30%); display: flex; justify-content: flex-end; }
.simulation-editor { width: min(620px, calc(100vw - 32px)); height: 100%; background: white; box-shadow: -8px 0 32px rgb(15 23 42 / 12%); display: flex; flex-direction: column; outline: none; }
.editor-heading { display: flex; align-items: center; justify-content: space-between; padding: 22px 24px; border-bottom: 1px solid #dce3eb; }
.editor-heading span { display: block; margin-top: 8px; color: #64748b; font-size: 13px; }
.close-icon { transform: rotate(90deg); }
.editor-content { padding: 22px 24px; flex: 1; min-height: 0; overflow-y: auto; }
.preset-label { display: flex; align-items: center; gap: 14px; }
.preset-label select { flex: 1; }
.operations-heading { margin-top: 24px; margin-bottom: 4px; }
.text-button { border: 0; background: transparent; color: #1876db; padding: 7px 0; font-size: 13px; }
.text-button.danger { color: #d34848; }
.operation-form { padding: 16px 0 20px; border-bottom: 1px solid #e5ebf1; }
.operation-label { margin-bottom: 8px; }
.operation-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 18px; }
.operation-fields label { display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: #64748b; }
.form-error { padding: 12px; background: #fff1f1; color: #bc3838; border-radius: 4px; font-size: 13px; margin-top: 16px; line-height: 1.6; }
.editor-footer { padding: 16px 24px; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid #dce3eb; }
</style>
