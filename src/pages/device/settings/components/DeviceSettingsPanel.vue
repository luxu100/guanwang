<template>
  <view v-if="visible" class="detail-panel">
    <view class="detail-summary-panel">
      <view class="detail-summary">
        <view class="detail-summary__main">
          <text class="detail-summary__label">{{ t('deviceSetting.settingInfo.title') }}</text>
          <text class="detail-summary__number">
            {{ settingData.deviceNumber || t('deviceSetting.settingInfo.unknownNumber') }}
          </text>
        </view>
        <view class="detail-summary__badges">
          <text
              class="detail-summary__badge"
              :class="settingData.enabledControl ? 'detail-summary__badge--success' : 'detail-summary__badge--muted'"
          >
            {{ settingData.enabledControl ? t('deviceSetting.settingTable.enabled') : t('deviceSetting.settingTable.disabled') }}
          </text>
          <text class="detail-summary__badge detail-summary__badge--type">
            {{ workModeLabel }}
          </text>
        </view>
      </view>
    </view>

    <view class="detail-tabs">
      <view
          v-for="tab in detailTabs"
          :key="tab.value"
          class="detail-tab"
          :class="{ 'detail-tab--active': activeTab === tab.value }"
          @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </view>
    </view>

    <view class="detail-body">
      <view v-if="currentFields.length" class="detail-grid">
        <view v-for="item in currentFields" :key="item.key" class="detail-item detail-item--base">
          <text class="detail-item__label">{{ t(item.labelKey) }}</text>
          <text class="detail-item__value">{{ item.value }}</text>
        </view>
      </view>
      <view v-else class="detail-empty">{{ t('common.table.empt') }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { DeviceSetting } from '@/services/device/types';
import { createScopedT } from "@/i18n";
const t = createScopedT("devicePage");

interface Props {
  visible: boolean;
  settingData: Partial<DeviceSetting>;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  settingData: () => ({})
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'edit', data: Partial<DeviceSetting>): void;
}>();

const activeTab = ref('basic');

const DICT_MAPS = computed<Record<string, Record<string | number, string>>>(() => ({
  enabledControl: {
    true: t('deviceSetting.settingInfo.dict.enabledControl.true'),
    false: t('deviceSetting.settingInfo.dict.enabledControl.false')
  },
  inspectionControl: {
    true: t('deviceSetting.settingInfo.dict.inspectionControl.true'),
    false: t('deviceSetting.settingInfo.dict.inspectionControl.false')
  },
  workMode: {
    0: t('deviceSetting.settingInfo.dict.workMode.0'),
    1: t('deviceSetting.settingInfo.dict.workMode.1'),
    2: t('deviceSetting.settingInfo.dict.workMode.2'),
    3: t('deviceSetting.settingInfo.dict.workMode.3')
  },
  filterMethod: {
    0: t('deviceSetting.settingInfo.dict.filterMethod.0'),
    1: t('deviceSetting.settingInfo.dict.filterMethod.1'),
    2: t('deviceSetting.settingInfo.dict.filterMethod.2'),
    3: t('deviceSetting.settingInfo.dict.filterMethod.3')
  },
  measureGainMode: {
    0: t('deviceSetting.settingInfo.dict.measureGainMode.0'),
    1: t('deviceSetting.settingInfo.dict.measureGainMode.1')
  },
  audioRule: {
    0: t('deviceSetting.settingInfo.dict.audioRule.0'),
    1: t('deviceSetting.settingInfo.dict.audioRule.1')
  },
  isDeleted: {
    true: t('deviceSetting.settingInfo.dict.isDeleted.true'),
    false: t('deviceSetting.settingInfo.dict.isDeleted.false')
  }
}));

// ✅ 3. 修改 FieldConfig 接口，将 label 改为 labelKey（i18n 路径）
interface FieldConfig {
  key: keyof DeviceSetting;
  labelKey: string; // 存储 i18n 路径
  type: 'text' | 'dict' | 'date';
  dict?: string;
}

// ✅ 4. 字段配置表，label 替换为对应的 JSON 路径
const basicFieldsConfig: FieldConfig[] = [
  { key: 'deviceNumber', labelKey: 'deviceSetting.settingInfo.fields.basic.deviceNumber', type: 'text' },
  { key: 'enabledControl', labelKey: 'deviceSetting.settingInfo.fields.basic.enabledControl', type: 'dict', dict: 'enabledControl' },
  { key: 'inspectionControl', labelKey: 'deviceSetting.settingInfo.fields.basic.inspectionControl', type: 'dict', dict: 'inspectionControl' },
  { key: 'workMode', labelKey: 'deviceSetting.settingInfo.fields.basic.workMode', type: 'dict', dict: 'workMode' },
  { key: 'onceMeasureLength', labelKey: 'deviceSetting.settingInfo.fields.basic.onceMeasureLength', type: 'text' },
  { key: 'signalLevel', labelKey: 'deviceSetting.settingInfo.fields.basic.signalLevel', type: 'text' },
  { key: 'signalChannel', labelKey: 'deviceSetting.settingInfo.fields.basic.signalChannel', type: 'text' }
];

const measureFieldsConfig: FieldConfig[] = [
  { key: 'measureGainMode', labelKey: 'deviceSetting.settingInfo.fields.measure.measureGainMode', type: 'dict', dict: 'measureGainMode' },
  { key: 'benchmarkValue', labelKey: 'deviceSetting.settingInfo.fields.measure.benchmarkValue', type: 'text' },
  { key: 'noiseBenchmarkValue', labelKey: 'deviceSetting.settingInfo.fields.measure.noiseBenchmarkValue', type: 'text' },
  { key: 'gainValue', labelKey: 'deviceSetting.settingInfo.fields.measure.gainValue', type: 'text' },
  { key: 'samplingWeekday', labelKey: 'deviceSetting.settingInfo.fields.measure.samplingWeekday', type: 'text' },
  { key: 'samplingTime', labelKey: 'deviceSetting.settingInfo.fields.measure.samplingTime', type: 'text' },
  { key: 'syncSamplingNumber', labelKey: 'deviceSetting.settingInfo.fields.measure.syncSamplingNumber', type: 'text' },
  { key: 'syncSamplingTime', labelKey: 'deviceSetting.settingInfo.fields.measure.syncSamplingTime', type: 'text' },
  { key: 'samplingPeriodTime', labelKey: 'deviceSetting.settingInfo.fields.measure.samplingPeriodTime', type: 'text' },
  { key: 'samplingCount', labelKey: 'deviceSetting.settingInfo.fields.measure.samplingCount', type: 'text' },
  { key: 'leakThreshold', labelKey: 'deviceSetting.settingInfo.fields.measure.leakThreshold', type: 'text' }
];

const filterFieldsConfig: FieldConfig[] = [
  { key: 'filterMethod', labelKey: 'deviceSetting.settingInfo.fields.filter.filterMethod', type: 'dict', dict: 'filterMethod' },
  { key: 'filterLowFrequency', labelKey: 'deviceSetting.settingInfo.fields.filter.filterLowFrequency', type: 'text' },
  { key: 'filterHighFrequency', labelKey: 'deviceSetting.settingInfo.fields.filter.filterHighFrequency', type: 'text' },
  { key: 'audioRule', labelKey: 'deviceSetting.settingInfo.fields.filter.audioRule', type: 'dict', dict: 'audioRule' }
];

const communicationFieldsConfig: FieldConfig[] = [
  { key: 'loraPower', labelKey: 'deviceSetting.settingInfo.fields.communication.loraPower', type: 'text' },
  { key: 'loraSignalFrequency', labelKey: 'deviceSetting.settingInfo.fields.communication.loraSignalFrequency', type: 'text' },
  { key: 'loraOpenDay', labelKey: 'deviceSetting.settingInfo.fields.communication.loraOpenDay', type: 'text' },
  { key: 'loraOpenDate', labelKey: 'deviceSetting.settingInfo.fields.communication.loraOpenDate', type: 'text' },
  { key: 'nb4gTrigger', labelKey: 'deviceSetting.settingInfo.fields.communication.nb4gTrigger', type: 'text' },
  { key: 'nb4gTransferSet', labelKey: 'deviceSetting.settingInfo.fields.communication.nb4gTransferSet', type: 'text' },
  { key: 'nb4gOpenTimeSet', labelKey: 'deviceSetting.settingInfo.fields.communication.nb4gOpenTimeSet', type: 'text' },
  { key: 'reportInterval', labelKey: 'deviceSetting.settingInfo.fields.communication.reportInterval', type: 'text' }
];

const systemFieldsConfig: FieldConfig[] = [
  { key: 'commandAccount', labelKey: 'deviceSetting.settingInfo.fields.system.commandAccount', type: 'text' },
  { key: 'orderTime', labelKey: 'deviceSetting.settingInfo.fields.system.orderTime', type: 'date' },
  { key: 'createdAt', labelKey: 'deviceSetting.settingInfo.fields.system.createdAt', type: 'date' },
  { key: 'updatedAt', labelKey: 'deviceSetting.settingInfo.fields.system.updatedAt', type: 'date' },
  { key: 'isDeleted', labelKey: 'deviceSetting.settingInfo.fields.system.isDeleted', type: 'dict', dict: 'isDeleted' }
];

const detailTabs = computed(() => [
  { label: t('deviceSetting.settingInfo.tabs.basic'), value: 'basic' },
  { label: t('deviceSetting.settingInfo.tabs.measure'), value: 'measure' },
  { label: t('deviceSetting.settingInfo.tabs.filter'), value: 'filter' },
  { label: t('deviceSetting.settingInfo.tabs.communication'), value: 'communication' },
  { label: t('deviceSetting.settingInfo.tabs.system'), value: 'system' }
]);

const resolveFields = (configs: FieldConfig[]) => {
  return configs.map(config => {
    let value = props.settingData[config.key];

    if (config.type === 'date') {
      value = formatDate(value as string);
    } else if (config.type === 'dict' && config.dict) {
      // 注意：从 computed 中获取字典
      value = DICT_MAPS.value[config.dict]?.[String(value)] ?? '--';
    } else {
      value = value !== undefined && value !== null && value !== ''
          ? value
          : '--';
    }

    return {
      key: config.key,
      labelKey: config.labelKey, // 返回 labelKey 供模板使用
      value
    };
  });
};

const currentFields = computed(() => {
  switch (activeTab.value) {
    case 'basic':
      return resolveFields(basicFieldsConfig);
    case 'measure':
      return resolveFields(measureFieldsConfig);
    case 'filter':
      return resolveFields(filterFieldsConfig);
    case 'communication':
      return resolveFields(communicationFieldsConfig);
    case 'system':
      return resolveFields(systemFieldsConfig);
    default:
      return [];
  }
});

const workModeLabel = computed(() => {
  const mode = props.settingData.workMode;
  if (mode === undefined || mode === null) return '--';
  return DICT_MAPS.value.workMode[mode] ?? t('deviceSetting.settingInfo.unknownNumber');
});

function formatDate(dateStr?: string) {
  if (!dateStr) return '--';

  const date = new Date(dateStr);

  if (isNaN(date.getTime())) return '--';

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');

  return `${y}-${m}-${d} ${h}:${mm}:${s}`;
}
</script>
<style scoped lang="scss">
.detail-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  height: 100%;

  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
}

.detail-tabs {
  flex: none;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  height: 54px;
  padding: 8px;
  background: #f6fafe;
  border-bottom: 1px solid #e3edf6;
}

.detail-tab {
  display: flex;
  align-items: center;
  justify-content: center;

  color: #5d7188;
  font-size: 13px;
  font-weight: 800;

  cursor: pointer;

  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;

  transition:
      color 0.18s ease,
      background 0.18s ease,
      border-color 0.18s ease;
}

.detail-tab--active {
  color: #0d82ee;
  background: #ffffff;
  border-color: #cfe7fb;
  box-shadow: 0 6px 14px rgba(13, 130, 238, 0.1);
}

.detail-body {
  flex: 1;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;

  background:
      linear-gradient(180deg, #f5faff 0, #ffffff 142px),
      #ffffff;
}

.detail-body::-webkit-scrollbar {
  width: 9px;
}

.detail-body::-webkit-scrollbar-track {
  background: #edf3f8;
  border-radius: 999px;
}

.detail-body::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, #9fb4c8, #6f8ba8);
  border: 2px solid #edf3f8;
  border-radius: 999px;
}

.detail-body::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(90deg, #7f9ab4, #4d6f91);
}


.detail-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;

  min-width: 0;

  padding: 14px 16px;

  background: #ffffff;

  border: 1px solid #dce9f4;
  border-left: 4px solid #0d82ee;
  border-radius: 6px;

  box-shadow: 0 8px 18px rgba(33, 72, 108, 0.045);
}

.detail-summary__main {
  min-width: 0;
}

.detail-summary__label {
  display: block;

  color: #6b7f94;
  font-size: 12px;
  font-weight: 800;
}

.detail-summary__number {
  display: block;
  margin-top: 7px;

  color: #0f4c81;

  font-family: "DIN Alternate", "Arial", sans-serif;
  font-size: 17px;
  font-weight: 900;
  line-height: 1.25;

  overflow-wrap: anywhere;
}

.detail-summary__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.detail-summary__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-height: 26px;

  padding: 0 10px;

  font-size: 12px;
  font-weight: 900;

  border: 1px solid transparent;
  border-radius: 999px;
}

.detail-summary__badge--status {
  color: #0d5ea6;
  background: #eaf4ff;
  border-color: #cfe7fb;
}

.detail-summary__badge--level {
  color: #177245;
  background: #eaf8ef;
  border-color: #bfe8ce;
}

.detail-grid {
  display: grid;
  gap: 12px;
}

.detail-grid--base {
  grid-template-columns: 1fr;
  gap: 0;

  overflow: hidden;

  background: #ffffff;

  border: 1px solid #dfebf5;
  border-radius: 6px;

  box-shadow: 0 8px 18px rgba(33, 72, 108, 0.045);
}

.detail-item {
  display: flex;
  flex-direction: column;

  min-height: 74px;

  padding: 12px 13px;

  background: rgba(255, 255, 255, 0.94);

  border: 1px solid #dfebf5;
  border-radius: 6px;
}

.detail-item--base {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);

  align-items: center;

  min-height: 48px;

  padding: 8px 14px;

  background: #ffffff;

  border: 0;
  border-bottom: 1px solid #edf3f8;

  border-radius: 0;

  box-shadow: none;
}

.detail-grid--base .detail-item--base:last-child {
  border-bottom: 0;
}

.detail-item__label {
  color: #71869b;
  font-size: 12px;
  font-weight: 800;
}

.detail-item__value {
  margin-top: 0;

  color: #172033;
  font-size: 14px;
  font-weight: 700;

  text-align: right;

  word-break: break-all;
}

.time-section {
  padding: 14px;

  background: rgba(255, 255, 255, 0.96);

  border: 1px solid #dfebf5;
  border-radius: 6px;

  box-shadow: 0 8px 18px rgba(33, 72, 108, 0.055);
}

.detail-section-title {
  display: block;

  margin-bottom: 12px;

  color: #183755;
  font-size: 14px;
  font-weight: 900;
}

.detail-summary__badge--success {
  color: #177245;
  background: #eaf8ef;
  border-color: #bfe8ce;
}

.detail-summary__badge--warning {
  color: #b42318;
  background: #fff1ee;
  border-color: #ffd3cb;
}

.detail-summary__badge--muted {
  color: #5f7186;
  background: #f3f6f9;
  border-color: #dbe4ec;
}

</style>
