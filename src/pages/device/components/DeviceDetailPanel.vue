<!-- components/DeviceDetailDrawer.vue -->
<template>
  <!--
    根节点：移除了 fixed 定位和遮罩层，改为使用模板的 worksheet-detail-panel 样式
    注意：v-if 移到了内部容器，如果不需要显示，直接不渲染内容即可
  -->
  <view v-if="visible" class="detail-panel">

    <!-- 1. 摘要信息 (复用模板的 detail-summary 结构) -->
    <!-- 注意：原模板中 detail-summary 是包含在 detail-body 内部的，这里为了结构清晰单独拿出来 -->
    <view class="detail-summary-panel">
      <view class="detail-summary">
        <view class="detail-summary__main">
          <text class="detail-summary__label">设备详情</text>
          <text class="detail-summary__number">{{ deviceData.deviceNumber || '未知编号' }}</text>
        </view>
        <view class="detail-summary__badges">
          <!-- 状态 Badge -->
          <text class="detail-summary__badge" :class="statusClass">
            {{ getDeviceStatusLabel }}
          </text>
          <!-- 类型 Badge -->
          <text class="detail-summary__badge detail-summary__badge--type">
            {{ getDeviceTypeLabel }}
          </text>
        </view>
      </view>
    </view>

    <!-- 2. Tab 切换栏 (直接复用模板类名) -->
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

    <!-- 3. 详情内容区域 (复用模板的 scroll 和 grid 样式) -->
    <!-- 注意：这里使用了 view 而不是 scroll-view，因为原模板使用的是普通的 overflow-y: auto -->
    <view class="detail-body">

      <!-- 基础信息 Tab -->
      <view v-if="activeTab === 'base'" class="detail-grid detail-grid--base">
        <view v-for="field in baseFields" :key="field.label" class="detail-item detail-item--base">
          <text class="detail-item__label">{{ field.label }}</text>
          <text class="detail-item__value">{{ field.value }}</text>
        </view>
      </view>

      <!-- 配置/参数 Tab -->
      <view v-if="activeTab === 'config'" class="detail-grid detail-grid--config">
        <view v-for="field in configFields" :key="field.label" class="detail-item detail-item--base">
          <text class="detail-item__label">{{ field.label }}</text>
          <text class="detail-item__value">{{ field.value }}</text>
        </view>
      </view>

      <!-- 运行状态 Tab -->
      <view v-if="activeTab === 'status'" class="detail-grid detail-grid--base">
        <view v-for="field in statusFields" :key="field.label" class="detail-item detail-item--base">
          <text class="detail-item__label">{{ field.label }}</text>
          <text class="detail-item__value">{{ field.value }}</text>
        </view>
      </view>

    </view>
  </view>
</template>

<script setup lang="ts">
// ... (这部分的逻辑代码保持不变，直接复用你原来的)
import { computed, ref } from 'vue';
import type { Device } from '@/services/device/types';

interface Props {
  visible: boolean;
  deviceData: Partial<Device>;
}

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'edit', data: Partial<Device>): void;
}>();

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  deviceData: () => ({}),
});

const activeTab = ref('base');

const detailTabs = [
  { label: '基础信息', value: 'base' },
  { label: '配置参数', value: 'config' },
  { label: '运行状态', value: 'status' },
];

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

function closeDrawer() {
  emit('update:visible', false);
}

function handleEdit() {
  emit('edit', props.deviceData);
}

const baseFields = computed(() => [
  { label: '设备编号', value: props.deviceData.deviceNumber },
  { label: '设备类型', value: props.deviceData.deviceType },
  { label: '产品ID', value: props.deviceData.productId },
  { label: 'NB编号', value: props.deviceData.nbNumber },
  { label: 'IMEI', value: props.deviceData.deviceImei },
  { label: 'IMSI', value: props.deviceData.deviceImsi },
  { label: '序列号', value: props.deviceData.serialNumber },
  { label: '安装地址', value: props.deviceData.installAddress }
])
const configFields = computed(() => [
  { label: '硬件版本', value: props.deviceData.hardwareVersion },
  { label: '软件版本', value: props.deviceData.softwareVersion },
  { label: '观察周期', value: props.deviceData.observeDay },
  { label: '发送方式', value: props.deviceData.commandSendway },
  { label: 'WiFi名称', value: props.deviceData.wifiName },
  { label: 'WiFi MAC', value: props.deviceData.wifiMac },
  { label: '服务器IP', value: props.deviceData.serverIp },
  { label: '端口', value: props.deviceData.serverPort },
  { label: '信号等级', value: props.deviceData.loraSignalLevel }
])
const statusFields = computed(() => [
  {
    label: '在线状态',
    value:
        props.deviceData.onlineStatus === 1
            ? '在线'
            : props.deviceData.onlineStatus === 0
                ? '离线'
                : '未知'
  },
  { label: '启用状态', value: props.deviceData.enableState },
  { label: '安装状态', value: props.deviceData.installState },
  { label: '安装模式', value: props.deviceData.installMode },
  { label: '漏损状态', value: props.deviceData.leakStatus },
  { label: '漏损属性', value: props.deviceData.leakProperty },
  { label: '采样时间', value: props.deviceData.lastSamplingTime },
  { label: '创建时间', value: props.deviceData.createdAt },
  { label: '更新时间', value: props.deviceData.updatedAt }
])
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
  grid-template-columns: repeat(3, 1fr);
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