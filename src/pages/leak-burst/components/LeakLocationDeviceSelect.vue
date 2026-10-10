<template>
  <view class="device-select" :aria-busy="loading">
    <view class="device-select__heading">
      <text class="device-letter">{{ site }}</text>
      <text>{{ copy.device }} {{ site }}</text>
      <text class="device-selection">{{ modelValue?.deviceNumber || copy.unselected }}</text>
    </view>
    <view class="device-search">
      <input v-model="keyword" :aria-label="`${copy.search} ${site}`" :placeholder="copy.search" @confirm="search" />
      <button type="button" :disabled="loading" @click="search">{{ t('search') }}</button>
      <button type="button" class="refresh" :title="copy.refresh" :aria-label="`${copy.refresh} ${site}`" :disabled="loading" @click="load(page)">
        <image src="/static/icons/refresh-cw.svg" mode="aspectFit" />
      </button>
    </view>
    <!-- #ifdef H5 -->
    <select class="device-options" :value="modelValue?.deviceNumber || ''" :aria-label="`${copy.device} ${site}`" :disabled="loading" @change="selectDevice">
      <option value="">{{ copy.choose }}</option>
      <option v-for="device in choices" :key="device.deviceNumber" :value="device.deviceNumber" :disabled="device.deviceNumber === excludedNumber">
        {{ device.deviceNumber }} · {{ device.model }}{{ device.deviceNumber === excludedNumber ? ` (${copy.used})` : '' }}
      </option>
    </select>
    <!-- #endif -->
    <view class="device-pagination">
      <view v-if="loading" class="loading-status"><image src="/static/icons/loadin_minior.svg" mode="aspectFit" />{{ t('loading') }}</view>
      <text v-else-if="error" class="device-error" role="alert">{{ error }}</text>
      <text v-else-if="!records.length">{{ t('noDeviceData') }}</text>
      <text v-else>{{ t('total', { value: total }) }}</text>
      <view class="page-actions">
        <button type="button" :disabled="loading || page <= 1" @click="load(page - 1)">{{ t('previousPage') }}</button>
        <text>{{ page }} / {{ pages }}</text>
        <button type="button" :disabled="loading || page >= pages" @click="load(page + 1)">{{ t('nextPage') }}</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { fetchLeakLocationDevices } from '@/services/leak-monitor/device-query';
import type { LeakMonitorDevice } from '@/pages/leak-monitor/types';
import { useLeakMonitorI18n } from '@/pages/leak-monitor/i18n';

const props = defineProps<{
  site: 'A' | 'B';
  modelValue: LeakMonitorDevice | null;
  excludedNumber?: string;
}>();
const emit = defineEmits<{ (event: 'update:modelValue', value: LeakMonitorDevice | null): void }>();
const { language, t } = useLeakMonitorI18n();
const copy = computed(() => language.value === 'en-US'
  ? { device: 'Device', search: 'Search device number', choose: 'Select a device', unselected: 'Not selected', refresh: 'Refresh devices', used: 'Selected on other side' }
  : { device: '设备', search: '搜索设备编号', choose: '请选择设备', unselected: '未选择', refresh: '刷新设备', used: '另一侧已选择' });
const keyword = ref('');
const query = ref('');
const page = ref(1);
const total = ref(0);
const loading = ref(false);
const error = ref('');
const records = ref<LeakMonitorDevice[]>([]);
let generation = 0;
const pages = computed(() => Math.max(1, Math.ceil(total.value / 50)));
const choices = computed(() => {
  const byNumber = new Map(records.value.filter(device => device.deviceNumber !== '--').map(device => [device.deviceNumber, device]));
  if (props.modelValue) byNumber.set(props.modelValue.deviceNumber, props.modelValue);
  return [...byNumber.values()];
});

function selectDevice(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  if (value && value === props.excludedNumber) return;
  emit('update:modelValue', choices.value.find(device => device.deviceNumber === value) || null);
}

function search() {
  query.value = keyword.value.trim();
  void load(1);
}

async function load(target: number) {
  const current = ++generation;
  loading.value = true;
  error.value = '';
  try {
    const response = await fetchLeakLocationDevices(query.value, target);
    if (current !== generation) return;
    records.value = response.records;
    total.value = response.total;
    page.value = target;
  } catch (failure: any) {
    if (current !== generation) return;
    records.value = [];
    total.value = 0;
    error.value = failure?.msg || failure?.message || t('deviceListLoadFailed');
  } finally {
    if (current === generation) loading.value = false;
  }
}

onMounted(() => { void load(1); });
onBeforeUnmount(() => { generation += 1; });
</script>

<style scoped lang="scss">
.device-select { min-width: 0; padding: 18px 0; }
.device-select__heading { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; color: #27394c; font-size: 15px; font-weight: 600; }
.device-letter { display: grid; place-items: center; width: 28px; height: 28px; color: #fff; background: #007c9a; border-radius: 4px; }
.device-selection { margin-left: auto; color: #617386; font-size: 13px; font-weight: 400; }
.device-search { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.device-search input { box-sizing: border-box; flex: 1; min-width: 0; height: 36px; padding: 0 10px; border: 1px solid #d2dbe5; border-radius: 4px; font-size: 14px; background: #fff; }
button { flex: none; margin: 0; padding: 0 12px; height: 36px; line-height: 34px; font-size: 13px; color: #2865a7; background: #f5f9fd; border: 1px solid #d4e2f0; border-radius: 4px; cursor: pointer; }
button::after { border: none; }
button[disabled] { opacity: .5; cursor: default; }
.refresh { display: grid; place-items: center; width: 36px; padding: 0; }
.refresh image { width: 17px; height: 17px; }
.device-options { box-sizing: border-box; width: 100%; height: 40px; padding: 0 10px; font-family: inherit; font-size: 14px; color: #243b53; background: #fff; border: 1px solid #bcccdc; border-radius: 4px; }
.device-pagination { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 36px; margin-top: 10px; color: #617386; font-size: 12px; }
.page-actions { display: flex; align-items: center; flex: none; gap: 10px; }
.page-actions button { height: 28px; padding: 0 8px; line-height: 26px; font-size: 12px; }
.device-error { color: #b42318; overflow-wrap: anywhere; }
.loading-status { display: flex; align-items: center; gap: 6px; }
.loading-status image { width: 22px; height: 22px; }
</style>
