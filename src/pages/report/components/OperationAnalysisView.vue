<template>
  <view class="operation-view">
    <view class="toolbar panel">
      <view class="filter-group"><text>时间范围</text>
        <view class="date-range">
          <WorkOrderDatetimePicker v-model="filters.start" class="filter-datetime" title="请选择开始时间" placeholder="请选择开始时间" />
          <text class="filter-separator">至</text>
          <WorkOrderDatetimePicker v-model="filters.end" class="filter-datetime" title="请选择结束时间" placeholder="请选择结束时间" />
        </view>
      </view>
      <!-- <view class="filter-group"><text>分区</text><picker :range="partitions" :value="filters.partition" @change="filters.partition = Number($event.detail.value)"><view class="select">{{ partitions[filters.partition] }}<text class="arrow" /></view></picker></view> -->
      <view class="filter-group"><text>分析报告</text><picker :range="reports" :value="filters.report" @change="changeReport(Number($event.detail.value))"><view class="select report-select">{{ reports[filters.report] }}<text class="arrow" /></view></picker></view>
      <view class="actions"><button class="primary" @click="search">查询</button><button @click="reset">重置</button><button class="primary" @click="generate">生成报告</button><button class="primary" @click="exportReport">导出</button></view>
      <text v-if="error" class="error">{{ error }}</text>
    </view>
    <view class="overview-heading"><text class="title">{{ reports[query.report] }}</text><text class="scope muted">{{ query.start.replace('T', ' ') }} 至 {{ query.end.replace('T', ' ') }} · <!-- {{ partitions[query.partition] }} --></text></view>
    <view class="statistics" :style="{ '--metric-columns': cards.length }">
      <view v-for="card in cards" :key="card.label" class="stat-card panel" :style="{ borderTopColor: card.color }">
        <text class="muted">{{ card.label }}</text><view class="number" :style="{ color: card.color }">{{ card.value }}<text class="unit">{{ card.unit }}</text></view><text class="hint">{{ card.hint }}</text>
      </view>
    </view>
    <view v-if="!rows.length" class="panel empty">暂无运行分析数据</view>
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
        <view class="heading"><view><text class="title">水锤报警趋势</text><text class="hint block">水锤报警率 = 水锤报警数 / 总报警数 × 100% · 点击图例可切换指标显示</text></view>
          <view class="grain-switch"><button v-for="item in grainOptions" :key="item.value" class="grain-button" :class="{ 'grain-button--active': grain === item.value }" :aria-pressed="grain === item.value" @click="grain = item.value">{{ item.label }}</button></view>
        </view><AnalysisChart :option="alarmOption" />
      </view>
      <view v-else-if="query.report === 1" class="panel chart-panel"><view class="heading"><view><text class="title">维修完成情况</text><text class="hint block">按工单创建日期统计当前完成情况</text></view><view class="chart-actions"><text class="badge success">完成率 {{ rate(totals.completed, totals.repairs) }}%</text><view class="grain-switch"><button v-for="item in grainOptions" :key="item.value" class="grain-button" :class="{ 'grain-button--active': grain === item.value }" :aria-pressed="grain === item.value" @click="grain = item.value">{{ item.label }}</button></view></view></view><AnalysisChart :option="repairOption" /></view>
      <view v-else class="panel chart-panel"><view class="heading"><view><text class="title">渗漏 / 爆管原因分布</text><text class="hint block">按事件主因归类，每个事件计入一次</text></view><text class="badge">共 {{ totals.leaks + totals.bursts }} 起</text></view><AnalysisChart :option="causeOption" /></view>
    </template>
    <view v-if="generated" class="panel report-panel">
      <view class="heading"><text class="title">{{ reports[query.report] }}摘要</text><text class="badge">生成时间：{{ generated }}</text></view>
      <view class="report-body"><text>统计范围：{{ query.start.replace('T', ' ') }} 至 {{ query.end.replace('T', ' ') }}<!-- ，{{ partitions[query.partition] }} -->。</text>
        <text v-if="query.report === 3">{{ summaryReportText }}</text>
        <text v-else-if="query.report === 0">报警总数 {{ totals.totalAlarms }} 次，其中水锤报警 {{ totals.alarms }} 次，水锤报警率 {{ rate(totals.alarms, totals.totalAlarms) }}%；受影响设备 {{ affectedDevices }} 台<!-- ，受影响分区 {{ affectedPartitions }} 个 -->。</text>
        <text v-else-if="query.report === 1">维修工单 {{ totals.repairs }} 单，已完成 {{ totals.completed }} 单，未完成 {{ totals.repairs - totals.completed }} 单，完成率 {{ rate(totals.completed, totals.repairs) }}%。</text>
        <text v-else>渗漏 {{ totals.leaks }} 起，爆管 {{ totals.bursts }} 起，主要原因为{{ leadingCause }}，建议优先核查相关管段并安排巡检。</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { EChartsOption } from 'echarts';
import AnalysisChart from './AnalysisChart.vue';
import WorkOrderDatetimePicker from '@/pages/work-order/components/WorkOrderDatetimePicker.vue';
type TrendGrain = 'day' | 'month' | 'year';
const grain = ref<TrendGrain>('day');
const grainOptions: { label: string; value: TrendGrain }[] = [{ label: '天', value: 'day' }, { label: '月', value: 'month' }, { label: '年', value: 'year' }];
const partitions = ref<string[]>(['全部分区']);
const reports = ['水锤报警率报告', '维修完成情况报告', '渗漏 / 爆管原因报告', '综合运行分析'];
const causes = ['管道老化', '接口松动', '压力波动', '外力破坏', '其他原因'];
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function defaultRange() { const end = new Date(); const start = new Date(end); start.setDate(start.getDate() - 29); return { start: `${dateKey(start)}T00:00:00`, end: `${dateKey(end)}T23:59:59` }; }
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
// 待接入运行分析接口，记录时间使用实际统计时间。
const records = ref<OperationAnalysisRecord[]>([]);
const filters = reactive({ ...defaultRange(), partition: 0, report: 3 });
const query = reactive({ ...filters });
const error = ref(''); const generated = ref('');
function normalizeTime(value: string) { return value.replace(' ', 'T'); }
const rows = computed(() => records.value.filter(row => normalizeTime(row.date) >= normalizeTime(query.start) && normalizeTime(row.date) <= normalizeTime(query.end) && (!query.partition || row.partition === partitions.value[query.partition])));
const totals = computed(() => rows.value.reduce((sum, row) => ({ alarms: sum.alarms + row.alarms, totalAlarms: sum.totalAlarms + row.totalAlarms, repairs: sum.repairs + row.repairs, completed: sum.completed + row.completed, leaks: sum.leaks + row.leaks, bursts: sum.bursts + row.bursts }), { alarms: 0, totalAlarms: 0, repairs: 0, completed: 0, leaks: 0, bursts: 0 }));
// 按所选范围去重，避免跨日重复累计设备和分区。
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
const affectedPartitions = computed(() => new Set(rows.value.filter(row => row.alarms > 0).map(row => row.partition)).size);
function rate(value: number, total: number) { return total ? (value / total * 100).toFixed(2) : '0.00'; }
function card(label: string, value: string | number, unit: string, hint: string, color: string) {
  return { label, value: rows.value.length ? value : '—', unit, hint, color };
}
const cards = computed(() => {
  const total = totals.value;
  if (query.report === 3) return [
    card('水锤报警数', total.alarms, '次', '所选范围内水锤报警总数', '#dfa23b'),
    card('水锤报警率', rate(total.alarms, total.totalAlarms), '%', '水锤报警数 / 总报警数 × 100%', '#31b59b'),
    card('维修完成率', rate(total.completed, total.repairs), '%', '已完成工单 / 维修工单总数 × 100%', '#7b88cb'),
    card('逾期数', overdueCount.value, '单', '超过截止时间仍未完成的维修工单', '#e47a77'),
    card('渗漏事件', total.leaks, '起', '所选时间内的渗漏事件总数', '#dfa23b'),
    card('爆管事件', total.bursts, '起', '所选时间内的爆管事件总数', '#e47a77'),
  ];
  if (query.report === 0) return [
    card('报警总数', total.totalAlarms, '次', '所选范围内全部类型报警', '#3287da'),
    card('水锤报警数', total.alarms, '次', '所选范围内水锤报警总数', '#dfa23b'),
    card('水锤报警率', rate(total.alarms, total.totalAlarms), '%', '水锤报警数 / 总报警数 × 100%', '#31b59b'),
    card('受影响设备数', affectedDevices.value, '台', '发生水锤报警的设备，按设备去重', '#7b88cb'),
    card('涉及阀门数', involvedValves.value, '个', '水锤报警涉及的阀门，按阀门去重', '#e47a77'),
    // card('受影响分区数', affectedPartitions.value, '个', '发生水锤报警的分区，按分区去重', '#e47a77'),
  ];
  if (query.report === 1) return [
    card('维修工单总数', total.repairs, '单', '所选时间内创建的维修工单', '#3287da'),
    card('已完成工单', total.completed, '单', '当前已完成的维修工单', '#31b59b'),
    card('未完成工单', total.repairs - total.completed, '单', '当前仍待完成的维修工单', '#dfa23b'),
    card('维修完成率', rate(total.completed, total.repairs), '%', '已完成工单 / 维修工单总数 × 100%', '#7b88cb'),
    card('逾期数', overdueCount.value, '单', '超过截止时间仍未完成的维修工单', '#e47a77'),
    card('平均维修时长', averageRepairHours.value, '小时', '已完成工单维修总时长 / 已完成工单数', '#479cae'),
  ];
  return [
    card('事件总数', total.leaks + total.bursts, '起', '渗漏与爆管事件合计', '#3287da'),
    card('渗漏事件', total.leaks, '起', '所选时间内的渗漏事件总数', '#dfa23b'),
    card('爆管事件', total.bursts, '起', '所选时间内的爆管事件总数', '#e47a77'),
    card('主要原因占比', rate(Math.max(...causeData.value.map(item => item.value)), total.leaks + total.bursts), '%', `主要原因：${leadingCause.value}`, '#31b59b'),
  ];
});
const trendData = computed(() => {
  const groups = new Map<string, { date: string; alarms: number; totalAlarms: number; repairs: number; completed: number }>();
  rows.value.forEach(row => {
    const key = row.date.slice(0, grain.value === 'year' ? 4 : grain.value === 'month' ? 7 : 10);
    const group = groups.get(key) || { date: key, alarms: 0, totalAlarms: 0, repairs: 0, completed: 0 };
    group.alarms += row.alarms; group.totalAlarms += row.totalAlarms;
    group.repairs += row.repairs; group.completed += row.completed; groups.set(key, group);
  });
  return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date));
});
function axes(): EChartsOption { return {
  color: ['#3287da', '#31b59b'], textStyle: { color: '#6c8295' }, tooltip: { trigger: 'axis', confine: true },
  legend: { top: 8, icon: 'roundRect', itemWidth: 14, itemHeight: 8 }, grid: { left: 22, right: 26, top: 55, bottom: 22, containLabel: true },
  xAxis: { type: 'category', data: trendData.value.map(row => row.date), axisLabel: { formatter: (value: string) => grain.value === 'day' ? value.slice(5) : grain.value === 'year' ? `${value}年` : `${value.slice(0, 4)}年${value.slice(5)}月` }, axisLine: { lineStyle: { color: '#dce7ef' } }, axisTick: { show: false } },
  yAxis: { type: 'value', splitLine: { lineStyle: { color: '#edf2f6', type: 'dashed' } } },
}; }
const alarmOption = computed<EChartsOption>(() => ({ ...axes(),
  color: ['#3287da', '#f2b44f', '#31b59b'],
  yAxis: [
    { type: 'value', name: '报警数（次）', minInterval: 1, splitLine: { lineStyle: { color: '#edf2f6', type: 'dashed' } } },
    { type: 'value', name: '水锤报警率（%）', min: 0, max: 100, axisLabel: { formatter: '{value}%' }, splitLine: { show: false } },
  ],
  series: [
    { name: '总报警数', type: 'bar', barMaxWidth: 18, data: trendData.value.map(row => row.totalAlarms), tooltip: { valueFormatter: value => `${value} 次` } },
    { name: '水锤报警数', type: 'bar', barMaxWidth: 18, data: trendData.value.map(row => row.alarms), tooltip: { valueFormatter: value => `${value} 次` } },
    { name: '水锤报警率', type: 'line', yAxisIndex: 1, smooth: true, symbolSize: 6, lineStyle: { width: 3 }, data: trendData.value.map(row => Number(rate(row.alarms, row.totalAlarms))), tooltip: { valueFormatter: value => `${value}%` } },
  ],
}));
const repairOption = computed<EChartsOption>(() => ({ ...axes(), color: ['#31b59b', '#f2b44f'], yAxis: { type: 'value', name: '工单（单）', minInterval: 1, splitLine: { lineStyle: { color: '#edf2f6', type: 'dashed' } } }, series: [
  { name: '已完成', type: 'bar', stack: 'repairs', barMaxWidth: 22, data: trendData.value.map(row => row.completed) },
  { name: '未完成', type: 'bar', stack: 'repairs', barMaxWidth: 22, itemStyle: { borderRadius: [3, 3, 0, 0] }, data: trendData.value.map(row => row.repairs - row.completed) },
] }));
const causeData = computed(() => causes.map((name, index) => ({ name, value: rows.value.reduce((sum, row) => sum + row.counts[index], 0) })));
const leadingCause = computed(() => [...causeData.value].filter(item => item.value > 0).sort((a, b) => b.value - a.value)[0]?.name || '—');
const causeOption = computed<EChartsOption>(() => ({ color: ['#3287da', '#31b59b', '#f2b44f', '#ec7b78', '#90a4c5'], tooltip: { trigger: 'item', confine: true, formatter: '{b}<br/>{c} 起（{d}%）' }, legend: { bottom: 10, icon: 'circle', itemWidth: 9, textStyle: { color: '#6c8295' } }, series: [{ type: 'pie', radius: ['40%', '64%'], center: ['50%', '44%'], avoidLabelOverlap: true, itemStyle: { borderColor: '#fff', borderWidth: 3, borderRadius: 4 }, label: { formatter: '{b}\n{d}%', color: '#6c8295', fontSize: 11 }, data: causeData.value }] }));
function search() { if (!filters.start || !filters.end || normalizeTime(filters.start) > normalizeTime(filters.end)) { error.value = '请选择有效的时间范围，开始日期不能晚于结束日期。'; return false; } error.value = ''; generated.value = ''; Object.assign(query, filters); return true; }
function reset() { Object.assign(filters, defaultRange(), { partition: 0, report: 3 }); grain.value = 'day'; search(); }
function changeReport(index: number) { filters.report = index; query.report = index; generated.value = ''; }
function generate() { if (!search()) return; if (!rows.value.length) { error.value = '当前筛选范围内没有数据，无法生成报告。'; return; } generated.value = new Date().toLocaleString('zh-CN', { hour12: false }); }

const summaryText = (zh: string, _en: string) => zh;
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
  const t = (zh: string, _en: string) => zh;
  if (!rows.value.length) {
    error.value = t('当前筛选范围内没有数据，无法导出报告。', 'No data in the current filter range. Cannot export report.');
    return;
  }
  try {
    downloadOperationReport({
      title: reports[query.report],
      start: query.start,
      end: query.end,
      report: query.report,
      grain: grainOptions.find(item => item.value === grain.value)?.label || grain.value,
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



