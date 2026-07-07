<template>
  <view v-if="visible" class="detail-panel">
    <!-- 头部 -->
    <view class="detail-summary-panel">
      <view class="detail-summary">
        <view class="detail-summary__main">
          <text class="detail-summary__label">设备详情</text>
          <text class="detail-summary__number">
            {{ deviceData.deviceNumber || '未知编号' }}
          </text>
        </view>
        <view class="detail-summary__badges">
          <text class="detail-summary__badge" :class="statusClass">
            {{ getDeviceStatusLabel }}
          </text>
          <text class="detail-summary__badge detail-summary__badge--type">
            {{ getDeviceTypeLabel }}
          </text>
        </view>
      </view>
    </view>

    <!-- Tabs -->
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

    <!-- 内容 (统一渲染) -->
    <view class="detail-body">
      <view v-if="currentFields.length" class="detail-grid">
        <view v-for="f in currentFields" :key="f.key" class="detail-item detail-item--base">
          <text class="detail-item__label">{{ f.label }}</text>
          <text class="detail-item__value">{{ f.value }}</text>
        </view>
      </view>
      <view v-else class="detail-empty">暂无数据</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Dept, Device, DeviceProduct, TubeNetwork } from '@/services/device/types';
import {
  getDeviceProductByIdT,
  getTubeNetworkListT,
  getDeptByIdT
} from '@/services/device/info.typed';

// ================= 1. 字典映射表 (基于数据库 DDL) =================
const DICT_MAPS: Record<string, Record<number, string>> = {
  enableState: { 0: '停用', 1: '启用' },
  onlineStatus: { 0: '离线', 1: '在线' },
  installState: { 0: '未安装', 1: '已安装' },
  installMode: { 0: '固定点', 1: '流动点' },
  leakStatus: { 0: '渗漏', 1: '正常', 2: '疑似', 3: '未知' },
  tubeType: { 1: '主线', 2: '二级支线', 3: '三级支线' }
};

// ================= 2. 字段配置 (配置驱动) =================
interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'dict' | 'date'; // 增加 'date' 类型
  dict?: string;         // 对应 DICT_MAPS 的 key
}

// 基础信息
const baseFieldsConfig: FieldConfig[] = [
  { key: 'deviceNumber', label: '设备编号', type: 'text' },
  { key: 'productName', label: '产品型号', type: 'text' }, // 注意：这个值来自关联数据
  { key: 'deviceImei', label: 'IMEI', type: 'text' },
  { key: 'deviceImsi', label: 'IMSI', type: 'text' },
  { key: 'serialNumber', label: '序列号', type: 'text' },
  { key: 'hardwareVersion', label: '硬件版本', type: 'text' },
  { key: 'softwareVersion', label: '软件版本', type: 'text' },
  { key: 'factoryTime', label: '出厂时间', type: 'date' }
];

// 安装信息
const installFieldsConfig: FieldConfig[] = [
  { key: 'installState', label: '安装状态', type: 'dict', dict: 'installState' },
  { key: 'installMode', label: '安装模式', type: 'dict', dict: 'installMode' },
  { key: 'installAddress', label: '安装地址', type: 'text' },
  { key: 'installLongitude', label: '经度', type: 'text' },
  { key: 'installLatitude', label: '纬度', type: 'text' },
  { key: 'tubeGroup', label: '管组编号', type: 'text' },
  { key: 'tubeOrder', label: '管线排序', type: 'text' }
];

// 运行状态
const statusFieldsConfig: FieldConfig[] = [
  { key: 'enableState', label: '启用状态', type: 'dict', dict: 'enableState' },
  { key: 'onlineStatus', label: '在线状态', type: 'dict', dict: 'onlineStatus' },
  { key: 'leakStatus', label: '渗漏状态', type: 'dict', dict: 'leakStatus' },
  { key: 'leakProperty', label: '特征值', type: 'text' },
  { key: 'lastSamplingTime', label: '最后采样时间', type: 'text' },
  { key: 'observeDay', label: '观测天数', type: 'date' }
];

// 管线信息
const tubeFieldsConfig: FieldConfig[] = [
  { key: 'tubeGroup', label: '管组编号', type: 'text' },
  { key: 'tubeName', label: '管线名称', type: 'text' }, // 来自关联数据
  { key: 'tubeType', label: '管线类型', type: 'dict', dict: 'tubeType' },
  { key: 'deptName', label: '分区信息', type: 'text' }   // 来自关联数据
];

// ================= 3. 核心解析逻辑 =================
/**
 * 根据配置，动态解析出当前 Tab 需要展示的字段列表
 */
const resolveFields = (configs: FieldConfig[]): { key: string; label: string; value: any }[] => {
  return configs.map(config => {
    let value: any = '--';

    // 优先从关联数据中取值，取不到再从 deviceData 中取值
    if (config.key === 'productName') value = product.value?.productName;
    else if (config.key === 'tubeName') value = tube.value?.tubeName;
    else if (config.key === 'deptName') value = dept.value?.deptName;
    else value = props.deviceData[config.key as keyof Device];

    // 如果是 dict 类型，进行映射转换
    if (config.type === 'date') {
      value = formatDate(value);
    } else if (config.type === 'dict' && config.dict) {
      const map = DICT_MAPS[config.dict as keyof typeof DICT_MAPS];
      value = map?.[value] ?? '未知';
    } else {
      // 普通文本处理空值
      value = value !== undefined && value !== null && value !== '' ? value : '--';
    }

    return {
      key: config.key,
      label: config.label,
      value
    };
  });
};

function formatDate(
    dateStr: string | number | Date | undefined | null,
    format: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  if (!dateStr) return '--';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '--';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
}

// ================= 4. 组件基础逻辑 =================
interface Props {
  visible: boolean;
  deviceData: Partial<Device>;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  deviceData: () => ({})
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const product = ref<DeviceProduct>();
const tube = ref<TubeNetwork>();
const dept = ref<Dept>();

const activeTab = ref('base');

const detailTabs = [
  { label: '基础信息', value: 'base' },
  { label: '安装信息', value: 'install' },
  { label: '运行状态', value: 'status' },
  { label: '管线信息', value: 'tube' }
];

// 根据当前激活的 Tab，动态返回对应的字段列表
const currentFields = computed(() => {
  switch (activeTab.value) {
    case 'base': return resolveFields(baseFieldsConfig);
    case 'install': return resolveFields(installFieldsConfig);
    case 'status': return resolveFields(statusFieldsConfig);
    case 'tube': return resolveFields(tubeFieldsConfig);
    default: return [];
  }
});

// 头部状态样式和文字（保留原有逻辑）
const statusClass = computed(() => {
  const status = props.deviceData.onlineStatus;
  if (status === 1) return 'detail-summary__badge--success';
  if (status === 0) return 'detail-summary__badge--muted';
  return 'detail-summary__badge--warning';
});

const getDeviceStatusLabel = computed(() => {
  const status = props.deviceData.onlineStatus ?? -1;
  return { 1: '在线', 0: '离线', [-1]: '未知' }[status] || '未知';
});

const getDeviceTypeLabel = computed(() => {
  return props.deviceData.deviceType || '通用设备';
});

// 监听数据加载
watch(
    () => props.deviceData.id,
    async (id) => {
      if (!id) return;
      await loadRelationData(props.deviceData);
    },
    { immediate: true }
);

async function loadRelationData(device: Partial<Device>) {
  if (!device?.id) return;

  const deptId = device.deptId;

  const [productRes, deptRes, tubeListRes] = await Promise.all([
    device.productId ? getDeviceProductByIdT(device.productId) : null,
    deptId ? getDeptByIdT(deptId) : null,
    device.tubeGroup ? getTubeNetworkListT() : null
  ]);

  product.value = productRes?.data as DeviceProduct;
  dept.value = deptRes?.data as Dept;
  const tubeList = (tubeListRes?.data ?? []) as TubeNetwork[];
  tube.value = tubeList.find((item) => {
    return String(item.id) === String(device.tubeGroup) || String(item.tubeName) === String(device.tubeGroup);
  });
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
  grid-template-columns: repeat(4, 1fr);
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
