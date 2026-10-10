<template>
  <section class="history-results" :aria-busy="loading">
    <header class="history-results__head">
      <div><strong>{{ tx('历史查询结果', 'History results') }}</strong><span>{{ start }} ~ {{ end }}</span></div>
      <button type="button" :disabled="loading" @click="$emit('back')"><image class="arrow-left" src="/static/icons/chevron-up.svg" />{{ tx('返回在线监测', 'Back to live monitoring') }}</button>
    </header>
    <div class="history-tabs" role="tablist">
      <button role="tab" :aria-selected="tab === 'alarms'" @click="tab = 'alarms'">{{ tx('报警历史', 'Alarm history') }}</button>
      <button role="tab" :aria-selected="tab === 'risk'" @click="tab = 'risk'">{{ tx('管线风险历史', 'Pipeline risk history') }}</button>
    </div>
    <div class="history-results__body">
      <DashboardLoading :active="loading" :label="tx('加载中', 'Loading')" />
      <template v-if="tab === 'risk'">
        <div class="history-unavailable" role="status">{{ tx('管线风险历史接口尚未提供，当前无法查询该时段的风险记录。', 'Pipeline risk history is not available from the backend for this period.') }}</div>
      </template>
      <template v-else>
        <div v-if="error" class="history-error" role="alert">{{ error }}<button :disabled="loading" @click="load">{{ tx('重试', 'Retry') }}</button></div>
        <div v-else-if="!rows.length && !loading" class="history-unavailable">{{ tx('该时段暂无报警记录', 'No alarms for this period') }}</div>
        <div v-else class="history-table-scroll">
          <table><thead><tr><th>{{ tx('设备', 'Device') }}</th><th>{{ tx('报警类型', 'Alarm type') }}</th><th>{{ tx('级别', 'Severity') }}</th><th>{{ tx('状态', 'Status') }}</th><th>{{ tx('触发时间', 'Triggered at') }}</th><th>{{ tx('位置', 'Location') }}</th></tr></thead>
            <tbody><tr v-for="row in rows" :key="row.id ?? row.alarmRecordId">
              <td>{{ row.deviceAlias || row.deviceNumber || '--' }}</td><td>{{ row.alarmTypeName || row.alarmType || '--' }}</td>
              <td><span class="history-level" :class="String(row.alarmLevel).toLowerCase()">{{ levelLabel(row.alarmLevel) }}</span></td>
              <td>{{ statusLabel(row.status) }}</td><td>{{ String(row.firstTriggeredAt || '--').replace('T', ' ') }}</td><td>{{ row.installAddress || row.address || '--' }}</td>
            </tr></tbody>
          </table>
        </div>
        <footer class="history-pagination">
          <span>{{ tx(`共 ${total} 条`, `${total} records`) }}</span>
          <button :disabled="loading || page <= 1" :aria-label="tx('上一页', 'Previous page')" @click="changePage(-1)"><image class="arrow-left" src="/static/icons/chevron-up.svg" /></button>
          <span>{{ page }} / {{ Math.max(1, Math.ceil(total / size)) }}</span>
          <button :disabled="loading || page * size >= total" :aria-label="tx('下一页', 'Next page')" @click="changePage(1)"><image class="arrow-right" src="/static/icons/chevron-up.svg" /></button>
        </footer>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from '@/i18n';
import { getAlarmPage } from '@/services/alarm/api';
import DashboardLoading from './DashboardLoading.vue';
const props = defineProps<{ start: string; end: string; kind: 'alarms' | 'risk'; revision: number }>();
const emit = defineEmits<{ (event: 'back'): void; (event: 'busy', value: boolean): void }>();
const { locale } = useI18n();
const tab = ref(props.kind);
const rows = ref<Record<string, any>[]>([]);
const loading = ref(false);
const error = ref('');
const page = ref(1);
const total = ref(0);
const size = 20;
let requestId = 0;
function tx(zh: string, en: string) { return locale.value === 'en-US' ? en : zh; }
function levelLabel(value: string) { return value === 'CRITICAL' ? tx('严重', 'Critical') : value === 'WARNING' ? tx('警告', 'Warning') : value === 'INFO' ? tx('提示', 'Info') : '--'; }
function statusLabel(value: string) { return value === 'ACTIVE' ? tx('活跃', 'Active') : value === 'CONFIRMED' ? tx('已确认', 'Confirmed') : value === 'RESOLVED' ? tx('已恢复', 'Resolved') : '--'; }
async function load() {
  const id = ++requestId;
  error.value = '';
  if (tab.value !== 'alarms') { loading.value = false; return; }
  loading.value = true;
  try {
    const response = await getAlarmPage({ startTime: `${props.start}T00:00:00`, endTime: `${props.end}T23:59:59`, pageNum: page.value, pageSize: size });
    if (id !== requestId) return;
    if (response.code !== 200) throw new Error(response.msg || tx('历史查询失败', 'History query failed'));
    const data = response.data;
    if (!data || !Array.isArray(data.records)) throw new Error(tx('历史查询返回格式不正确', 'Invalid history response'));
    rows.value = data.records;
    total.value = Number(data.total) || 0;
  } catch (reason) {
    if (id === requestId) { rows.value = []; total.value = 0; error.value = reason instanceof Error ? reason.message : String((reason as { msg?: string })?.msg || tx('历史查询失败', 'History query failed')); }
  } finally { if (id === requestId) loading.value = false; }
}
function changePage(delta: number) { if (loading.value) return; page.value += delta; void load(); }
watch(() => props.kind, (kind) => { tab.value = kind; });
watch(loading, (busy) => emit('busy', busy), { flush: 'sync' });
watch(() => [props.start, props.end, props.revision, tab.value], () => { page.value = 1; void load(); }, { immediate: true });
onBeforeUnmount(() => { requestId++; emit('busy', false); });
</script>

<style scoped>
.history-results { background: #fff; border: 1px solid #d8e6f1; border-radius: 6px; margin-bottom: 14px; overflow: hidden; }
.history-results__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px; border-bottom: 1px solid #edf3f7; }
.history-results__head strong { font-size: 15px; color: #21425e; }.history-results__head span { margin-left: 14px; color: #64788c; font-size: 12px; }
button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 32px; margin: 0; padding: 0 10px; border: 1px solid #d8e6f1; border-radius: 4px; background: #f3f8fc; color: #1769aa; font-size: 12px; cursor: pointer; }
button::after { border: 0; }button[disabled] { opacity: .5; cursor: default; }image { width: 16px; height: 16px; }
.arrow-left { transform: rotate(-90deg); }.arrow-right { transform: rotate(90deg); }
.history-tabs { display: flex; gap: 8px; padding: 12px 16px; }.history-tabs [aria-selected="true"] { color: #fff; background: #2187cc; border-color: #2187cc; }
.history-results__body { position: relative; min-height: 260px; }.history-unavailable { padding: 60px 20px; text-align: center; color: #64788c; font-size: 13px; }
.history-error { padding: 20px; color: #b42318; font-size: 13px; }.history-error button { margin-left: 12px; }
.history-table-scroll { overflow: auto; padding: 0 16px; }table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; }th { background: #f7fafc; color: #64788c; font-weight: 600; }th,td { padding: 12px; border-bottom: 1px solid #edf3f7; white-space: nowrap; color: #526d83; }
.history-level { color: #2563eb; }.history-level.critical { color: #b42318; }.history-level.warning { color: #b56f12; }
.history-pagination { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 14px 16px; font-size: 12px; color: #64788c; }.history-pagination button { width: 32px; padding: 0; }
</style>
