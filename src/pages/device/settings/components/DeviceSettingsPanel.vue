<template>
  <view v-if="visible" class="detail-panel">
    <view class="detail-summary-panel">
      <view class="detail-summary">
        <view class="detail-summary__main">
          <text class="detail-summary__label">设备参数详情</text>
          <text class="detail-summary__number">
            {{ settingData.deviceNumber || '未知编号' }}
          </text>
        </view>
        <view class="detail-summary__badges">
          <text
              class="detail-summary__badge"
              :class="settingData.enabledControl ? 'detail-summary__badge--success' : 'detail-summary__badge--muted'"
          >
            {{ settingData.enabledControl ? '启用' : '停用' }}
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
          <text class="detail-item__label">{{ item.label }}</text>
          <text class="detail-item__value">{{ item.value }}</text>
        </view>
      </view>
      <view v-else class="detail-empty">暂无数据</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { DeviceSetting } from '@/services/device/types';

const DICT_MAPS: Record<string, Record<string | number, string>> = {
  enabledControl: { true: '启用', false: '停用' },
  inspectionControl: { true: '启用', false: '停用' },
  workMode: {
    0: '待启用',
    1: '网络模式',
    2: '现场模式',
    3: '网络巡检模式'
  },
  filterMethod: {
    0: '无滤波',
    1: '低通滤波',
    2: '高通滤波',
    3: '带通滤波'
  },
  measureGainMode: {
    0: '自动增益',
    1: '固定增益'
  },
  audioRule: {
    0: '关闭',
    1: '开启'
  },
  isDeleted: {
    true: '已删除',
    false: '正常'
  }
};

interface FieldConfig {
  key: keyof DeviceSetting;
  label: string;
  type: 'text' | 'dict' | 'date';
  dict?: string;
}

const basicFieldsConfig: FieldConfig[] = [
  { key:'deviceNumber', label:'设备编号', type:'text' },
  { key:'enabledControl', label:'启用控制', type:'dict', dict:'enabledControl' },
  { key:'inspectionControl', label:'巡检控制', type:'dict', dict:'inspectionControl' },
  { key:'workMode', label:'工作模式', type:'dict', dict:'workMode' },
  { key:'onceMeasureLength', label:'单次测量长度', type:'text' },
  { key:'signalLevel', label:'信号等级', type:'text' },
  { key:'signalChannel', label:'信号通道', type:'text' }
];

const measureFieldsConfig: FieldConfig[] = [
  { key:'measureGainMode', label:'测量增益模式', type:'dict', dict:'measureGainMode' },
  { key:'benchmarkValue', label:'基准值', type:'text' },
  { key:'noiseBenchmarkValue', label:'噪声基准值', type:'text' },
  { key:'gainValue', label:'增益值', type:'text' },
  { key:'samplingWeekday', label:'采样星期', type:'text' },
  { key:'samplingTime', label:'采样时间', type:'text' },
  { key:'syncSamplingNumber', label:'同步采样次数', type:'text' },
  { key:'syncSamplingTime', label:'同步采样时间', type:'text' },
  { key:'samplingPeriodTime', label:'采样周期', type:'text' },
  { key:'samplingCount', label:'采样次数', type:'text' },
  { key:'leakThreshold', label:'泄漏阈值', type:'text' }
];

const filterFieldsConfig: FieldConfig[] = [
  { key:'filterMethod', label:'滤波方式', type:'dict', dict:'filterMethod' },
  { key:'filterLowFrequency', label:'滤波低频', type:'text' },
  { key:'filterHighFrequency', label:'滤波高频', type:'text' },
  { key:'audioRule', label:'音频规则', type:'dict', dict:'audioRule' }
];

const communicationFieldsConfig: FieldConfig[] = [
  { key:'loraPower', label:'LoRa功率', type:'text' },
  { key:'loraSignalFrequency', label:'LoRa信号频率', type:'text' },
  { key:'loraOpenDay', label:'LoRa开启日期', type:'text' },
  { key:'loraOpenDate', label:'LoRa开启日期配置', type:'text' },
  { key:'nb4gTrigger', label:'NB4G触发配置', type:'text' },
  { key:'nb4gTransferSet', label:'NB4G传输配置', type:'text' },
  { key:'nb4gOpenTimeSet', label:'NB4G开启时间配置', type:'text' },
  { key:'reportInterval', label:'上报间隔', type:'text' }
];

const systemFieldsConfig: FieldConfig[] = [
  { key:'commandAccount', label:'指令账号', type:'text' },
  { key:'orderTime', label:'指令时间', type:'date' },
  { key:'createdAt', label:'创建时间', type:'date' },
  { key:'updatedAt', label:'更新时间', type:'date' },
  { key:'isDeleted', label:'删除状态', type:'dict', dict:'isDeleted' }
];

interface Props {
  visible:boolean;
  settingData:Partial<DeviceSetting>;
}

const props = withDefaults(defineProps<Props>(), {
  visible:false,
  settingData:()=>({})
});

const emit = defineEmits<{
  (e:'update:visible', value:boolean):void;
  (e:'edit', data:Partial<DeviceSetting>):void;
}>();

const activeTab = ref('basic');

const detailTabs = [
  { label:'基础控制', value:'basic' },
  { label:'测量参数', value:'measure' },
  { label:'滤波参数', value:'filter' },
  { label:'通信参数', value:'communication' },
  { label:'系统信息', value:'system' }
];

const resolveFields = (configs:FieldConfig[]) => {
  return configs.map(config => {
    let value = props.settingData[config.key];

    if (config.type === 'date') {
      value = formatDate(value as string);
    } else if (config.type === 'dict' && config.dict) {
      value = DICT_MAPS[config.dict]?.[String(value)] ?? '--';
    } else {
      value = value !== undefined && value !== null && value !== ''
          ? value
          : '--';
    }

    return {
      key:config.key,
      label:config.label,
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
  return DICT_MAPS.workMode[
  props.settingData.workMode ?? -1
      ] ?? '未知模式';
});

function formatDate(dateStr?:string) {
  if (!dateStr) return '--';

  const date = new Date(dateStr);

  if (isNaN(date.getTime())) return '--';

  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  const h = String(date.getHours()).padStart(2,'0');
  const mm = String(date.getMinutes()).padStart(2,'0');
  const s = String(date.getSeconds()).padStart(2,'0');

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
