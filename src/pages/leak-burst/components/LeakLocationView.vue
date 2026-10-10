<template>
  <view class="leak-location">
    <view class="location-heading">
      <view class="location-heading__title"><image src="/static/icons/crosshair.svg" mode="aspectFit" /><text>{{ copy.title }}</text></view>
      <text class="location-stage">{{ ready ? copy.analysis : copy.selection }}</text>
    </view>
    <view class="device-pair-selection">
      <LeakLocationDeviceSelect v-model="primaryDevice" site="A" :excluded-number="relatedDevice?.deviceNumber" />
      <LeakLocationDeviceSelect v-model="relatedDevice" site="B" :excluded-number="primaryDevice?.deviceNumber" />
    </view>
    <CorrelationAnalysisDialog
      :visible="ready"
      :primary-device="primaryDevice"
      :related-device="relatedDevice"
      :distance-km="0"
      embedded
    />
    <view v-if="!ready" class="location-empty"><image src="/static/icons/crosshair.svg" mode="aspectFit" /><text>{{ copy.choosePair }}</text></view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useLeakMonitorI18n } from '@/pages/leak-monitor/i18n';
import type { LeakMonitorDevice } from '@/pages/leak-monitor/types';
import CorrelationAnalysisDialog from '@/pages/leak-monitor/components/CorrelationAnalysisDialog.vue';
import LeakLocationDeviceSelect from './LeakLocationDeviceSelect.vue';

const { language } = useLeakMonitorI18n();
const primaryDevice = ref<LeakMonitorDevice | null>(null);
const relatedDevice = ref<LeakMonitorDevice | null>(null);
const ready = computed(() => Boolean(primaryDevice.value && relatedDevice.value && primaryDevice.value.deviceNumber !== relatedDevice.value.deviceNumber));
const copy = computed(() => language.value === 'en-US'
  ? { title: 'Leak Localization', selection: 'Select devices', analysis: 'Audio and analysis', choosePair: 'Select devices A and B' }
  : { title: '漏点定位', selection: '选择设备', analysis: '音频与定位分析', choosePair: '请选择设备 A 和设备 B' });
</script>

<style scoped lang="scss">
.leak-location { box-sizing: border-box; width: 100%; height: 100%; padding: 22px 24px 32px; overflow-y: auto; background: #f5f7fa; color: #243b53; font-family: inherit; letter-spacing: 0; }
.location-heading { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; border-bottom: 1px solid #dce3eb; }
.location-heading__title { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 600; }
.location-heading__title image { width: 22px; height: 22px; }
.location-stage { color: #64748b; font-size: 13px; }
.device-pair-selection { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px; padding: 0 18px; margin-bottom: 18px; background: #fff; border-bottom: 1px solid #dce3eb; }
.location-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; min-height: 300px; color: #64748b; font-size: 15px; }
.location-empty image { width: 36px; height: 36px; opacity: .5; }
</style>
