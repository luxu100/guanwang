<template>
  <view class="operation-view">
    <view v-if="USE_OPERATION_ANALYSIS_MOCK" class="demo-notice">{{ localeText('示例数据 · 当前为最近 400 天的模拟运行数据，仅用于界面预览。', 'Sample data · Simulated operation data for the last 400 days, for preview only.') }}</view>
    <view class="toolbar panel">
      <view class="filter-group">
        <text>{{ localeText("时间范围", "Time Range") }}</text>
        <view class="date-range">
          <WorkOrderDatetimePicker v-model="filters.start" class="filter-datetime" :title="localeText('请选择开始时间', 'Select start time')" :placeholder="localeText('请选择开始时间', 'Select start time')" />
          <text class="filter-separator">{{ localeText("至", "to") }}</text>
          <WorkOrderDatetimePicker v-model="filters.end" class="filter-datetime" :title="localeText('请选择结束时间', 'Select end time')" :placeholder="localeText('请选择结束时间', 'Select end time')" />
        </view>
      </view>
      <view class="filter-group">
        <text>{{ localeText("分析报告", "Analysis Report") }}</text>
        <picker :range="reportOptions" range-key="label" :value="filters.report" @change="changeReport(Number($event.detail.value))">
          <view class="select report-select"><text class="report-select__label" :title="reportOptions[filters.report]?.label">{{ reportOptions[filters.report]?.label }}</text><text class="arrow" /></view>
        </picker>
      </view>
      <view class="actions">
        <button class="primary" @click="search">{{ localeText("查询", "Search") }}</button>
        <button @click="reset">{{ localeText("重置", "Reset") }}</button>
        <button class="primary" @click="generate">{{ localeText("生成报告", "Generate Report") }}</button>
        <button class="primary" @click="exportReport">{{ localeText("导出", "Export") }}</button>
      </view>
      <text v-if="error" class="error">{{ error }}</text>
    </view>

    <view class="overview-heading">
      <text class="title">{{ getReportLabel(query.report) }}</text>
      <text class="scope muted">{{ formatRange(query.start, query.end) }}</text>
    </view>

    <view class="statistics" :style="{ '--metric-columns': cards.length }">
      <view v-for="card in cards" :key="card.label" class="stat-card panel" :style="{ borderTopColor: card.color }">
        <text class="muted">{{ card.label }}</text>
        <view class="number" :style="{ color: card.color }">{{ card.value }}<text class="unit">{{ card.unit }}</text></view>
        <text class="hint">{{ card.hint }}</text>
      </view>
    </view>

    <view v-if="!rows.length" class="panel empty">{{ localeText("暂无运行分析数据", "No operation analysis data") }}</view>
    <template v-else>
      <view v-if="query.report === 3" class="overview-charts">
        <view class="heading overview-charts__heading">
          <text class="title">{{ summaryText('综合运行概览', 'Operation Overview') }}</text>
          <view class="grain-switch">
            <button v-for="item in grainOptions" :key="item.value" class="grain-button" :class="{ 'grain-button--active': grain === item.value }" :aria-pressed="grain === item.value" @click="grain = item.value">{{ item.label }}</button>
          </view>
        </view>
        <view class="panel chart-panel">
          <view class="heading"><text class="title">{{ summaryText('水锤报警率趋势', 'Water Hammer Alarm Rate Trend') }}</text></view>
          <AnalysisChart :option="summaryAlarmOption" />
        </view>
        <view class="panel chart-panel">
          <view class="heading"><text class="title">{{ summaryText('维修完成率趋势', 'Repair Completion Rate Trend') }}</text></view>
          <AnalysisChart :option="summaryRepairOption" />
        </view>
        <view class="panel chart-panel overview-charts__causes">
          <view class="heading"><view><text class="title">{{ summaryText('主要渗漏 / 爆管原因', 'Leading Leak / Burst Causes') }}</text><text class="hint block">{{ summaryText('仅展示事件数最多的三项原因', 'Only the top three causes by event count') }}</text></view></view>
          <AnalysisChart v-if="topCauses.length" :option="summaryCauseOption" />
          <view v-else class="empty">{{ summaryText('暂无原因数据', 'No cause data') }}</view>
        </view>
      </view>
      <view v-else-if="query.report === 0" class="panel chart-panel">
        <view class="heading">
          <view>
            <text class="title">{{ localeText("水锤报警趋势", "Water Hammer Alarm Trend") }}</text>
            <text class="hint block">{{ localeText("水锤报警率 = 水锤报警数 / 总报警数 × 100% · 点击图例可切换指标显示", "Water hammer alarm rate = water hammer alarms / total alarms × 100%. Click legend items to toggle metrics.") }}</text>
          </view>
          <view class="grain-switch">
            <button v-for="item in grainOptions" :key="item.value" class="grain-button" :class="{ 'grain-button--active': grain === item.value }" :aria-pressed="grain === item.value" @click="grain = item.value">{{ item.label }}</button>
          </view>
        </view>
        <AnalysisChart :option="alarmOption" />
      </view>
      <view v-else-if="query.report === 1" class="panel chart-panel">
        <view class="heading">
          <view>
            <text class="title">{{ localeText("维修完成情况", "Repair Completion") }}</text>
            <text class="hint block">{{ localeText("按工单创建日期统计当前完成情况", "Statistics by worksheet creation date") }}</text>
          </view>
          <view class="chart-actions">
            <text class="badge success">{{ completionRateText }}</text>
            <view class="grain-switch">
              <button v-for="item in grainOptions" :key="item.value" class="grain-button" :class="{ 'grain-button--active': grain === item.value }" :aria-pressed="grain === item.value" @click="grain = item.value">{{ item.label }}</button>
            </view>
          </view>
        </view>
        <AnalysisChart :option="repairOption" />
      </view>
      <view v-else class="panel chart-panel">
        <view class="heading">
          <view>
            <text class="title">{{ localeText("渗漏 / 爆管原因分布", "Leak / Burst Cause Distribution") }}</text>
            <text class="hint block">{{ localeText("按事件主因归类，每个事件计入一次", "Classified by primary cause, each event counted once") }}</text>
          </view>
          <text class="badge">{{ totalEventsText }}</text>
        </view>
        <AnalysisChart :option="causeOption" />
      </view>
    </template>

    <view v-if="generated" class="panel report-panel">
      <view class="heading">
        <text class="title">{{ reportSummaryTitle }}</text>
        <text class="badge">{{ generatedText }}</text>
      </view>
      <view class="report-body">
        <text>{{ rangeSummaryText }}</text>
        <text v-if="query.report === 3">{{ summaryReportText }}</text>
        <text v-else-if="query.report === 0">{{ alarmSummaryText }}</text>
        <text v-else-if="query.report === 1">{{ repairSummaryText }}</text>
        <text v-else>{{ causeSummaryText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { EChartsOption } from 'echarts';
import { createMockOperationAnalysisRecords, USE_OPERATION_ANALYSIS_MOCK } from '@/pages/report/mock/operation-analysis';
import { useI18n } from '@/i18n';
import { useLocaleText } from '@/i18n/localeText';
import AnalysisChart from './AnalysisChart.vue';
import WorkOrderDatetimePicker from '@/pages/work-order/components/WorkOrderDatetimePicker.vue';

type TrendGrain = 'day' | 'month' | 'year';
interface OperationAnalysisRecord {
  date: string;
  partition: string;
  alarms: number;
  totalAlarms: number;
  deviceIds: string[];
  valveIds?: string[];
  repairs: number;
  completed: number;
  // 超过截止时间仍未完成的维修工单数。
  overdueRepairs?: number;
  // 已完成工单从开始维修到完成的总时长，单位：小时。
  totalRepairHours?: number;
  leaks: number;
  bursts: number;
  counts: number[];
}

const localeText = useLocaleText();
const { locale } = useI18n();
const grain = ref<TrendGrain>('day');
const grainOptions = computed<{ label: string; value: TrendGrain }[]>(() => [
  { label: localeText('天', 'Day'), value: 'day' },
  { label: localeText('月', 'Month'), value: 'month' },
  { label: localeText('年', 'Year'), value: 'year' },
]);
const partitions = ref<string[]>(['全部分区']);
const reportOptions = computed(() => [
  { label: localeText('水锤报警率报告', 'Water Hammer Alarm Rate Report'), value: 0 },
  { label: localeText('维修完成情况报告', 'Repair Completion Report'), value: 1 },
  { label: localeText('渗漏 / 爆管原因报告', 'Leak / Burst Cause Report'), value: 2 },
  { label: localeText('综合运行分析', 'Overall Operation Analysis'), value: 3 },
]);
const causeLabels = computed(() => [
  localeText('管道老化', 'Pipe Aging'),
  localeText('接口松动', 'Loose Joint'),
  localeText('压力波动', 'Pressure Fluctuation'),
  localeText('外力破坏', 'External Damage'),
  localeText('其他原因', 'Other Causes'),
]);

function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function defaultRange() { const end = new Date(); const start = new Date(end); start.setDate(start.getDate() - 29); return { start: `${dateKey(start)}T00:00:00`, end: `${dateKey(end)}T23:59:59` }; }
function normalizeTime(value: string) { return value.replace(' ', 'T'); }
function formatDateTime(value: string) { return value.replace('T', ' '); }
function formatRange(start: string, end: string) { return `${formatDateTime(start)} ${localeText('至', 'to')} ${formatDateTime(end)}`; }
function getReportLabel(index: number) { return reportOptions.value[index]?.label || reportOptions.value[0].label; }
function rate(value: number, total: number) { return total ? (value / total * 100).toFixed(2) : '0.00'; }

const records = ref<OperationAnalysisRecord[]>(USE_OPERATION_ANALYSIS_MOCK ? createMockOperationAnalysisRecords() : []);
const filters = reactive({ ...defaultRange(), partition: 0, report: 3 });
const query = reactive({ ...filters });
const error = ref('');
const generated = ref('');
const rows = computed(() => records.value.filter(row => normalizeTime(row.date) >= normalizeTime(query.start) && normalizeTime(row.date) <= normalizeTime(query.end) && (!query.partition || row.partition === partitions.value[query.partition])));
const totals = computed(() => rows.value.reduce((sum, row) => ({ alarms: sum.alarms + row.alarms, totalAlarms: sum.totalAlarms + row.totalAlarms, repairs: sum.repairs + row.repairs, completed: sum.completed + row.completed, leaks: sum.leaks + row.leaks, bursts: sum.bursts + row.bursts }), { alarms: 0, totalAlarms: 0, repairs: 0, completed: 0, leaks: 0, bursts: 0 }));
const overdueCount = computed(() => {
  const repairRows = rows.value.filter(row => row.repairs > 0);
  if (repairRows.some(row => row.overdueRepairs == null || !Number.isFinite(row.overdueRepairs) || row.overdueRepairs < 0)) return '—';
  return repairRows.reduce((sum, row) => sum + (row.overdueRepairs || 0), 0);
});
const averageRepairHours = computed(() => {
  const completedRows = rows.value.filter(row => row.completed > 0);
  if (!completedRows.length || completedRows.some(row => row.totalRepairHours == null || !Number.isFinite(row.totalRepairHours) || row.totalRepairHours < 0)) return '—';
  const hours = completedRows.reduce((sum, row) => sum + (row.totalRepairHours || 0), 0);
  const count = completedRows.reduce((sum, row) => sum + row.completed, 0);
  return (hours / count).toFixed(2);
});
const affectedDevices = computed(() => new Set(rows.value.filter(row => row.alarms > 0).flatMap(row => row.deviceIds)).size);
const involvedValves = computed(() => {
  const alarmRows = rows.value.filter(row => row.alarms > 0);
  if (alarmRows.some(row => !Array.isArray(row.valveIds))) return '—';
  return new Set(alarmRows.flatMap(row => row.valveIds || [])).size;
});
const completionRateText = computed(() => localeText(`完成率 ${rate(totals.value.completed, totals.value.repairs)}%`, `Completion Rate ${rate(totals.value.completed, totals.value.repairs)}%`));
const totalEventsText = computed(() => localeText(`共 ${totals.value.leaks + totals.value.bursts} 起`, `Total: ${totals.value.leaks + totals.value.bursts} events`));
const reportSummaryTitle = computed(() => localeText(`${getReportLabel(query.report)}摘要`, `${getReportLabel(query.report)} Summary`));
const generatedText = computed(() => localeText(`生成时间：${generated.value}`, `Generated: ${generated.value}`));
const rangeSummaryText = computed(() => localeText(`统计范围：${formatDateTime(query.start)} 至 ${formatDateTime(query.end)}。`, `Range: ${formatDateTime(query.start)} to ${formatDateTime(query.end)}.`));
const alarmSummaryText = computed(() => localeText(`报警总数 ${totals.value.totalAlarms} 次，其中水锤报警 ${totals.value.alarms} 次，水锤报警率 ${rate(totals.value.alarms, totals.value.totalAlarms)}%；受影响设备 ${affectedDevices.value} 台。`, `Total alarms: ${totals.value.totalAlarms}, water hammer alarms: ${totals.value.alarms}, water hammer alarm rate: ${rate(totals.value.alarms, totals.value.totalAlarms)}%; affected devices: ${affectedDevices.value}.`));
const repairSummaryText = computed(() => localeText(`维修工单 ${totals.value.repairs} 单，已完成 ${totals.value.completed} 单，未完成 ${totals.value.repairs - totals.value.completed} 单，完成率 ${rate(totals.value.completed, totals.value.repairs)}%。`, `Repair worksheets: ${totals.value.repairs}, completed: ${totals.value.completed}, unfinished: ${totals.value.repairs - totals.value.completed}, completion rate: ${rate(totals.value.completed, totals.value.repairs)}%.`));
const causeSummaryText = computed(() => localeText(`渗漏 ${totals.value.leaks} 起，爆管 ${totals.value.bursts} 起，主要原因为${leadingCause.value}，建议优先核查相关管段并安排巡检。`, `Leaks: ${totals.value.leaks}, bursts: ${totals.value.bursts}, leading cause: ${leadingCause.value}. Prioritize related pipe sections and schedule inspections.`));

function card(label: string, value: string | number, unit: string, hint: string, color: string) {
  return { label, value: rows.value.length ? value : '—', unit, hint, color };
}
const causeData = computed(() => causeLabels.value.map((name, index) => ({ name, value: rows.value.reduce((sum, row) => sum + row.counts[index], 0) })));
const leadingCause = computed(() => [...causeData.value].filter(item => item.value > 0).sort((a, b) => b.value - a.value)[0]?.name || '—');
const cards = computed(() => {
  const total = totals.value;
  if (query.report === 3) return [
    card(localeText('水锤报警数', 'Water Hammer Alarms'), total.alarms, localeText('次', 'times'), localeText('所选范围内水锤报警总数', 'Total water hammer alarms in the selected range'), '#dfa23b'),
    card(localeText('水锤报警率', 'Water Hammer Alarm Rate'), rate(total.alarms, total.totalAlarms), '%', localeText('水锤报警数 / 总报警数 × 100%', 'Water hammer alarms / total alarms × 100%'), '#31b59b'),
    card(localeText('维修完成率', 'Repair Completion Rate'), rate(total.completed, total.repairs), '%', localeText('已完成工单 / 维修工单总数 × 100%', 'Completed worksheets / repair worksheets × 100%'), '#7b88cb'),
    card(localeText('逾期数', 'Overdue Repairs'), overdueCount.value, localeText('单', 'orders'), localeText('超过截止时间仍未完成的维修工单', 'Unfinished repair worksheets past their deadline'), '#e47a77'),
    card(localeText('渗漏事件', 'Leak Events'), total.leaks, localeText('起', 'events'), localeText('所选时间内的渗漏事件总数', 'Total leak events in the selected range'), '#dfa23b'),
    card(localeText('爆管事件', 'Burst Events'), total.bursts, localeText('起', 'events'), localeText('所选时间内的爆管事件总数', 'Total burst events in the selected range'), '#e47a77'),
  ];
  if (query.report === 0) return [
    card(localeText('报警总数', 'Total Alarms'), total.totalAlarms, localeText('次', 'times'), localeText('所选范围内全部类型报警', 'All alarm types in the selected range'), '#3287da'),
    card(localeText('水锤报警数', 'Water Hammer Alarms'), total.alarms, localeText('次', 'times'), localeText('所选范围内水锤报警总数', 'Total water hammer alarms in the selected range'), '#dfa23b'),
    card(localeText('水锤报警率', 'Water Hammer Alarm Rate'), rate(total.alarms, total.totalAlarms), '%', localeText('水锤报警数 / 总报警数 × 100%', 'Water hammer alarms / total alarms × 100%'), '#31b59b'),
    card(localeText('受影响设备数', 'Affected Devices'), affectedDevices.value, localeText('台', 'devices'), localeText('发生水锤报警的设备，按设备去重', 'Devices with water hammer alarms, deduplicated by device'), '#7b88cb'),
    card(localeText('涉及阀门数', 'Involved Valves'), involvedValves.value, localeText('个', 'valves'), localeText('水锤报警涉及的阀门，按阀门去重', 'Valves involved in water hammer alarms, deduplicated by valve'), '#e47a77'),
  ];
  if (query.report === 1) return [
    card(localeText('维修工单总数', 'Repair Worksheets'), total.repairs, localeText('单', 'orders'), localeText('所选时间内创建的维修工单', 'Repair worksheets created in the selected time range'), '#3287da'),
    card(localeText('已完成工单', 'Completed Worksheets'), total.completed, localeText('单', 'orders'), localeText('当前已完成的维修工单', 'Repair worksheets currently completed'), '#31b59b'),
    card(localeText('未完成工单', 'Unfinished Worksheets'), total.repairs - total.completed, localeText('单', 'orders'), localeText('当前仍待完成的维修工单', 'Repair worksheets still unfinished'), '#dfa23b'),
    card(localeText('维修完成率', 'Repair Completion Rate'), rate(total.completed, total.repairs), '%', localeText('已完成工单 / 维修工单总数 × 100%', 'Completed worksheets / repair worksheets × 100%'), '#7b88cb'),
    card(localeText('逾期数', 'Overdue Repairs'), overdueCount.value, localeText('单', 'orders'), localeText('超过截止时间仍未完成的维修工单', 'Unfinished repair worksheets past their deadline'), '#e47a77'),
    card(localeText('平均维修时长', 'Average Repair Duration'), averageRepairHours.value, localeText('小时', 'hours'), localeText('已完成工单维修总时长 / 已完成工单数', 'Total repair duration / completed worksheets'), '#479cae'),
  ];
  return [
    card(localeText('事件总数', 'Total Events'), total.leaks + total.bursts, localeText('起', 'events'), localeText('渗漏与爆管事件合计', 'Total leak and burst events'), '#3287da'),
    card(localeText('渗漏事件', 'Leak Events'), total.leaks, localeText('起', 'events'), localeText('所选时间内的渗漏事件总数', 'Total leak events in the selected range'), '#dfa23b'),
    card(localeText('爆管事件', 'Burst Events'), total.bursts, localeText('起', 'events'), localeText('所选时间内的爆管事件总数', 'Total burst events in the selected range'), '#e47a77'),
    card(localeText('主要原因占比', 'Leading Cause Share'), rate(Math.max(...causeData.value.map(item => item.value)), total.leaks + total.bursts), '%', localeText(`主要原因：${leadingCause.value}`, `Leading cause: ${leadingCause.value}`), '#31b59b'),
  ];
});
const trendData = computed(() => {
  const groups = new Map<string, { date: string; alarms: number; totalAlarms: number; repairs: number; completed: number }>();
  rows.value.forEach(row => {
    const key = row.date.slice(0, grain.value === 'year' ? 4 : grain.value === 'month' ? 7 : 10);
    const group = groups.get(key) || { date: key, alarms: 0, totalAlarms: 0, repairs: 0, completed: 0 };
    group.alarms += row.alarms;
    group.totalAlarms += row.totalAlarms;
    group.repairs += row.repairs;
    group.completed += row.completed;
    groups.set(key, group);
  });
  return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date));
});
function axisDateLabel(value: string) {
  if (grain.value === 'day') return value.slice(5);
  if (grain.value === 'year') return localeText(`${value}年`, `${value}`);
  return localeText(`${value.slice(0, 4)}年${value.slice(5)}月`, `${value.slice(0, 4)}-${value.slice(5)}`);
}
function axes(): EChartsOption {
  return {
    color: ['#3287da', '#31b59b'],
    textStyle: { color: '#6c8295' },
    tooltip: { trigger: 'axis', confine: true },
    legend: { top: 8, icon: 'roundRect', itemWidth: 14, itemHeight: 8 },
    grid: { left: 22, right: 26, top: 55, bottom: 22, containLabel: true },
    xAxis: { type: 'category', data: trendData.value.map(row => row.date), axisLabel: { formatter: axisDateLabel }, axisLine: { lineStyle: { color: '#dce7ef' } }, axisTick: { show: false } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#edf2f6', type: 'dashed' } } },
  };
}
const alarmOption = computed<EChartsOption>(() => ({ ...axes(),
  color: ['#3287da', '#f2b44f', '#31b59b'],
  yAxis: [
    { type: 'value', name: localeText('报警数（次）', 'Alarms'), minInterval: 1, splitLine: { lineStyle: { color: '#edf2f6', type: 'dashed' } } },
    { type: 'value', name: localeText('水锤报警率（%）', 'Water Hammer Rate (%)'), min: 0, max: 100, axisLabel: { formatter: '{value}%' }, splitLine: { show: false } },
  ],
  series: [
    { name: localeText('总报警数', 'Total Alarms'), type: 'bar', barMaxWidth: 18, data: trendData.value.map(row => row.totalAlarms), tooltip: { valueFormatter: value => localeText(`${value} 次`, `${value} times`) } },
    { name: localeText('水锤报警数', 'Water Hammer Alarms'), type: 'bar', barMaxWidth: 18, data: trendData.value.map(row => row.alarms), tooltip: { valueFormatter: value => localeText(`${value} 次`, `${value} times`) } },
    { name: localeText('水锤报警率', 'Water Hammer Alarm Rate'), type: 'line', yAxisIndex: 1, smooth: true, symbolSize: 6, lineStyle: { width: 3 }, data: trendData.value.map(row => Number(rate(row.alarms, row.totalAlarms))), tooltip: { valueFormatter: value => `${value}%` } },
  ],
}));
const repairOption = computed<EChartsOption>(() => ({ ...axes(), color: ['#31b59b', '#f2b44f'], yAxis: { type: 'value', name: localeText('工单（单）', 'Worksheets'), minInterval: 1, splitLine: { lineStyle: { color: '#edf2f6', type: 'dashed' } } }, series: [
  { name: localeText('已完成', 'Completed'), type: 'bar', stack: 'repairs', barMaxWidth: 22, data: trendData.value.map(row => row.completed) },
  { name: localeText('未完成', 'Unfinished'), type: 'bar', stack: 'repairs', barMaxWidth: 22, itemStyle: { borderRadius: [3, 3, 0, 0] }, data: trendData.value.map(row => row.repairs - row.completed) },
] }));
const causeOption = computed<EChartsOption>(() => ({
  color: ['#3287da', '#31b59b', '#f2b44f', '#ec7b78', '#90a4c5'],
  tooltip: { trigger: 'item', confine: true, formatter: (params: unknown) => {
    const item = params as { name?: string; value?: number | string; percent?: number | string };
    return localeText(`${item.name || ''}<br/>${item.value ?? 0} 起（${item.percent ?? 0}%）`, `${item.name || ''}<br/>${item.value ?? 0} events (${item.percent ?? 0}%)`);
  } },
  legend: { bottom: 10, icon: 'circle', itemWidth: 9, textStyle: { color: '#6c8295' } },
  series: [{ type: 'pie', radius: ['40%', '64%'], center: ['50%', '44%'], avoidLabelOverlap: true, itemStyle: { borderColor: '#fff', borderWidth: 3, borderRadius: 4 }, label: { formatter: '{b}\n{d}%', color: '#6c8295', fontSize: 11 }, data: causeData.value }],
}));
function search() {
  if (!filters.start || !filters.end || normalizeTime(filters.start) > normalizeTime(filters.end)) {
    error.value = localeText('请选择有效的时间范围，开始日期不能晚于结束日期。', 'Select a valid time range. The start date cannot be later than the end date.');
    return false;
  }
  error.value = '';
  generated.value = '';
  Object.assign(query, filters);
  return true;
}
function reset() { Object.assign(filters, defaultRange(), { partition: 0, report: 3 }); grain.value = 'day'; search(); }
function changeReport(index: number) { filters.report = index; query.report = index; generated.value = ''; }
function generate() {
  if (!search()) return;
  if (!rows.value.length) {
    error.value = localeText('当前筛选范围内没有数据，无法生成报告。', 'No data in the current filter range. Cannot generate report.');
    return;
  }
  generated.value = new Date().toLocaleString(locale.value === 'en-US' ? 'en-US' : 'zh-CN', { hour12: false });
}

const summaryText = localeText;
const topCauses = computed(() => [...causeData.value].filter(item => item.value > 0).sort((a, b) => b.value - a.value).slice(0, 3));
function summaryRateOption(name: string, values: (number | null)[]): EChartsOption {
  return {
    ...axes(),
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' }, splitLine: { lineStyle: { color: '#edf2f6', type: 'dashed' } } },
    series: [{ name, type: 'line', smooth: true, symbolSize: 6, data: values, tooltip: { valueFormatter: value => value == null ? '—' : value + '%' } }],
  };
}
const summaryAlarmOption = computed(() => summaryRateOption(summaryText('水锤报警率', 'Water Hammer Alarm Rate'), trendData.value.map(row => row.totalAlarms ? Number(rate(row.alarms, row.totalAlarms)) : null)));
const summaryRepairOption = computed(() => summaryRateOption(summaryText('维修完成率', 'Repair Completion Rate'), trendData.value.map(row => row.repairs ? Number(rate(row.completed, row.repairs)) : null)));
const summaryCauseOption = computed<EChartsOption>(() => ({
  color: ['#3287da'],
  tooltip: { trigger: 'axis', confine: true },
  grid: { left: 24, right: 35, top: 20, bottom: 25, containLabel: true },
  xAxis: { type: 'value', minInterval: 1 },
  yAxis: { type: 'category', inverse: true, data: topCauses.value.map(item => item.name) },
  series: [{ name: summaryText('事件数', 'Events'), type: 'bar', barMaxWidth: 28, label: { show: true, position: 'right' }, data: topCauses.value.map(item => item.value) }],
}));
const summaryReportText = computed(() => cards.value.map(item => item.label + ': ' + item.value + (item.unit ? ' ' + item.unit : '')).join('；') + '；' + summaryText('主要原因：', 'Leading causes: ') + (topCauses.value.map(item => item.name).join('、') || '—'));

// 报表导出：在页面内生成 CSV 并下载。
type Cell = string | number;
type Translate = (zh: string, en: string) => string;

interface ReportExport {
  title: string;
  start: string;
  end: string;
  report: number;
  grain: string;
  cards: { label: string; value: Cell; unit: string; hint: string }[];
  trend: { date: string; totalAlarms: number; alarms: number; repairs: number; completed: number }[];
  causes: { name: string; value: number }[];
}

function buildOperationReportCsv(report: ReportExport, t: Translate): string {
  const rows: Cell[][] = [
    ...(USE_OPERATION_ANALYSIS_MOCK ? [[t('数据说明', 'Data Source'), t('示例数据，仅用于界面预览', 'Sample data for preview only')]] : []),
    [t('分析报告', 'Analysis Report'), report.title],
    [t('开始时间', 'Start Time'), report.start.replace('T', ' ')],
    [t('结束时间', 'End Time'), report.end.replace('T', ' ')],
    [],
    [t('指标', 'Metric'), t('数值', 'Value'), t('单位', 'Unit'), t('说明', 'Description')],
    ...report.cards.map(card => [card.label, card.value, card.unit, card.hint]),
    [],
  ];
  if (report.report === 3) {
    rows.push([t('统计粒度', 'Time Granularity'), report.grain]);
    rows.push([t('时间', 'Time'), t('水锤报警率（%）', 'Water Hammer Alarm Rate (%)'), t('维修完成率（%）', 'Repair Completion Rate (%)')]);
    rows.push(...report.trend.map(item => [item.date, item.totalAlarms ? (item.alarms / item.totalAlarms * 100).toFixed(2) : '—', item.repairs ? (item.completed / item.repairs * 100).toFixed(2) : '—']));
    rows.push([], [t('主要原因（前三项）', 'Leading Causes (Top 3)'), t('事件数', 'Events')]);
    rows.push(...[...report.causes].filter(item => item.value > 0).sort((a, b) => b.value - a.value).slice(0, 3).map(item => [item.name, item.value]));
  } else if (report.report === 2) {
    const total = report.causes.reduce((sum, item) => sum + item.value, 0);
    rows.push([t('原因', 'Cause'), t('事件数', 'Events'), t('占比（%）', 'Share (%)')]);
    rows.push(...report.causes.map(item => [item.name, item.value, total ? (item.value / total * 100).toFixed(2) : '—']));
  } else {
    rows.push([t('统计粒度', 'Time Granularity'), report.grain]);
    if (report.report === 0) {
      rows.push([t('时间', 'Time'), t('总报警数', 'Total Alarms'), t('水锤报警数', 'Water Hammer Alarms'), t('水锤报警率（%）', 'Water Hammer Alarm Rate (%)')]);
      rows.push(...report.trend.map(item => [item.date, item.totalAlarms, item.alarms, item.totalAlarms ? (item.alarms / item.totalAlarms * 100).toFixed(2) : '—']));
    } else {
      rows.push([t('时间', 'Time'), t('维修工单总数', 'Repair Worksheets'), t('已完成工单', 'Completed Worksheets'), t('未完成工单', 'Unfinished Worksheets'), t('维修完成率（%）', 'Repair Completion Rate (%)')]);
      rows.push(...report.trend.map(item => [item.date, item.repairs, item.completed, item.repairs - item.completed, item.repairs ? (item.completed / item.repairs * 100).toFixed(2) : '—']));
    }
  }
  return '\uFEFF' + rows.map(row => row.map(value => {
    let text = String(value);
    // 防止文本单元格被表格软件识别为公式。
    if (typeof value === 'string' && /^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return `"${text.replace(/"/g, '""')}"`;
  }).join(',')).join('\r\n');
}

function downloadOperationReport(report: ReportExport, t: Translate): void {
  // #ifdef H5
  const blob = new Blob([buildOperationReportCsv(report, t)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${report.title.replace(/[\\/:*?"<>|]/g, '-')}_${report.start.slice(0, 10)}_${report.end.slice(0, 10)}.csv`;
  try {
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  // #endif
  // #ifndef H5
  throw new Error(t('请在网页端导出报告', 'Please export reports in the web version'));
  // #endif
}

function exportReport() {
  if (!search()) return;
  const t = localeText;
  if (!rows.value.length) {
    error.value = t('当前筛选范围内没有数据，无法导出报告。', 'No data in the current filter range. Cannot export report.');
    return;
  }
  try {
    downloadOperationReport({
      title: getReportLabel(query.report),
      start: query.start,
      end: query.end,
      report: query.report,
      grain: grainOptions.value.find(item => item.value === grain.value)?.label || grain.value,
      cards: cards.value,
      trend: trendData.value,
      causes: causeData.value,
    }, t);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('导出失败，请重试。', 'Export failed. Please try again.');
  }
}
</script>

<style scoped lang="scss">
.demo-notice {
  margin-bottom: 10px;
  padding: 10px 14px;
  color: #aa813d;
  font-size: 12px;
  background: #fff6e6;
  border: 1px solid #f0dfbc;
  border-radius: 6px;
}

.operation-view {
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  padding: 0 14px 20px;
  background: #eef4f8;
  color: #24445f;
  font-size: 13px;
}

.panel {
  background: #fff;
  border: 1px solid #d8e6f2;
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(35, 72, 104, .05);
}

.toolbar {
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 10px 12px;
  padding: 14px;
  background: linear-gradient(180deg, #fff 0%, #fbfdff 100%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, .06);
}

.filter-group {
  display: grid;
  align-content: start;
  gap: 6px;
  min-width: 0;
}

.filter-group > text {
  color: #52677b;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
  white-space: nowrap;
}

.select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  gap: 15px;
  min-width: 100px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid #cbdced;
  border-radius: 4px;
  color: #172033;
  background: #f9fcff;
  font-size: 13px;
  font-weight: 600;
  line-height: 28px;
  cursor: pointer;
}

.report-select {
  width: 210px;
}

.report-select__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-select .arrow {
  flex-shrink: 0;
}

.select:hover {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, .1);
}

.arrow {
  width: 8px;
  height: 8px;
  margin-left: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.filter-datetime {
  width: 200px;
}

.filter-datetime :deep(.datetime-picker__control) {
  height: 28px;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 600;
  line-height: 28px;
}

.filter-datetime :deep(.datetime-picker__value) {
  font-size: 13px;
  font-weight: 600;
}

.filter-datetime :deep(.datetime-picker__icon) {
  width: 15px;
  height: 15px;
}

.filter-separator {
  flex: none;
  color: #8191a2;
  font-size: 13px;
}

.actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  line-height: 32px;
  margin: 0;
  padding: 0 16px;
  border: 1px solid #cedeea;
  border-radius: 4px;
  font-size: 13px;
  color: #49667e;
  background: #fff;
  cursor: pointer;
}

button::after {
  border: 0;
}

button.primary {
  color: #fff;
  background: #3287da;
  border-color: #3287da;
}

button:hover {
  opacity: .86;
}

.overview-heading {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin: 20px 0 12px;
}

.title {
  font-size: 15px;
  font-weight: 700;
}

.scope {
  margin-left: auto;
  font-size: 12px;
}

.muted {
  color: #8295a7;
}

.badge {
  padding: 4px 8px;
  background: #eff6fc;
  border-radius: 4px;
  color: #5782a6;
  font-size: 11px;
}

.success {
  background: #edf9f5;
  color: #26a28a;
}

.statistics {
  display: grid;
  grid-template-columns: repeat(var(--metric-columns, 5), minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border-top-width: 3px;
}

.number {
  font-size: 32px;
  line-height: 1.15;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.unit {
  margin-left: 7px;
  font-size: 13px;
  font-weight: 400;
  color: #8295a7;
}

.hint {
  color: #8295a7;
  font-size: 12px;
}

.block {
  display: block;
  margin-top: 7px;
}

.chart-panel {
  min-width: 0;
  margin-bottom: 16px;
  padding: 0 8px 8px;
}

.heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 17px 12px 8px;
}

.report-panel {
  padding: 0 8px 16px;
  margin-bottom: 14px;
}

.report-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 12px;
  line-height: 1.8;
}

.footnote {
  display: block;
  color: #8295a7;
  font-size: 12px;
}

.error {
  width: 100%;
  color: #d36363;
}

.empty {
  padding: 70px 20px;
  margin-bottom: 16px;
  text-align: center;
  color: #8295a7;
}

.actions button {
  min-width: 64px;
  height: 38px;
  padding: 0 15px;
  color: #31506d;
  font-weight: 700;
  line-height: 1.2;
  background: #f6fbff;
  border-color: #cbdced;
  border-radius: 5px;
}

.actions button.primary {
  color: #fff;
  background: #3b82f6;
  border-color: #3b82f6;
}

.chart-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.grain-switch {
  display: flex;
  flex: none;
  padding: 2px;
  gap: 2px;
  border-radius: 5px;
  background: #f1f5f9;
}

.grain-button {
  min-width: 38px;
  height: 26px;
  padding: 0 12px;
  border: 0;
  border-radius: 4px;
  line-height: 26px;
  font-size: 12px;
  color: #64748b;
  background: transparent;
}

.grain-button:hover {
  color: #3b82f6;
}

.grain-button--active {
  color: #3b82f6;
  background: #fff;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .08);
}

@media (max-width: 1100px) {
  .statistics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .toolbar {
    padding: 14px 10px;
  }

  .filter-group {
    flex-wrap: wrap;
    gap: 8px;
  }

  .select {
    min-width: 94px;
    padding: 0 8px;
  }

  .actions {
    margin-left: 0;
  }

  .stat-card {
    padding: 14px;
  }

  .number {
    font-size: 26px;
  }

  .scope {
    width: 100%;
    margin-left: 0;
  }
}

@media (max-width: 600px) {
  .date-range {
    flex-wrap: wrap;
  }

  .filter-datetime {
    width: 185px;
  }

  .filter-group {
    gap: 6px;
  }
}

.overview-charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.overview-charts__heading,
.overview-charts__causes {
  grid-column: 1 / -1;
}

.overview-charts .chart-panel {
  margin-bottom: 0;
}

.overview-charts {
  margin-bottom: 16px;
}

@media (max-width: 1100px) {
  .overview-charts {
    grid-template-columns: 1fr;
  }
}
</style>




