import { onBeforeUnmount, onMounted, ref } from 'vue';
import { getAlarmMap } from '@/services/alarm/api';
import { normalizeActiveMapAlarms, type ActiveMapAlarm } from '../activeMapAlarms';
export type { ActiveMapAlarm } from '../activeMapAlarms';
export function useActiveMapAlarms() {
  const alarms = ref<ActiveMapAlarm[]>([]);
  const error = ref('');
  const loading = ref(false);
  let disposed = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  async function refresh() {
    if (loading.value || disposed) return;
    loading.value = true;
    try {
      const response = await getAlarmMap({ status: 'ACTIVE' });
      const normalized = normalizeActiveMapAlarms(response);
      if (!disposed) { alarms.value = normalized; error.value = ''; }
    } catch (reason) {
      if (!disposed) {
        alarms.value = [];
        error.value = reason instanceof Error ? reason.message : String((reason as { msg?: string })?.msg || 'Alarm request failed');
      }
    } finally { if (!disposed) loading.value = false; }
  }
  onMounted(() => {
    void refresh();
    timer = setInterval(() => { if (!document.hidden) void refresh(); }, 60000);
  });
  onBeforeUnmount(() => { disposed = true; if (timer) clearInterval(timer); });
  return { alarms, error, loading, refresh };
}
