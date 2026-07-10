<template>
  <view v-if="visible" class="detail-panel">
    <!-- 头部 -->
    <view class="detail-summary-panel">
      <view class="detail-summary">
        <view class="detail-summary__main">
          <text class="detail-summary__label">  {{ ti('title') }}</text>
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
      <view v-else class="detail-empty">{{ ti('empty') }}</view>
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
import {createScopedT} from "@/i18n";
import {formatDate} from "@/utils/time";
const ti = createScopedT("devicePage.info");
const ts = createScopedT("devicePage.status");

// ================= 1. 字典映射表 (基于数据库 DDL) =================
const DICT_MAPS: Record<string, Record<number, string>> = {
  enableState: {
    0: 'status.disabled',
    1: 'status.enabled'
  },

  onlineStatus: {
    0: 'online.offline',
    1: 'online.online'
  },

  installState: {
    0: 'install.uninstalled',
    1: 'install.installed'
  },

  installMode: {
    0: 'installMode.fixed',
    1: 'installMode.mobile'
  },

  leakStatus: {
    0: 'leak.leak',
    1: 'leak.normal',
    2: 'leak.suspected',
    3: 'leak.unknown'
  },

  tubeType: {
    1: 'tubeType.1',
    2: 'tubeType.2',
    3: 'tubeType.3'
  }
};

// ================= 2. 字段配置 (配置驱动) =================
interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'dict' | 'date'; // 增加 'date' 类型
  dict?: string;         // 对应 DICT_MAPS 的 key
}

// 设备详情
const deviceFieldsConfig: FieldConfig[] = [
  { key: 'deviceNumber', label: ti('fields.device.deviceNumber'), type: 'text' },
  { key: 'deviceAlias', label: ti('fields.device.deviceAlias'), type: 'text' },
  { key: 'deviceType', label: ti('fields.device.deviceType'), type: 'text' },
  { key: 'nbNumber', label: ti('fields.device.nbNumber'), type: 'text' },
  { key: 'deviceImei', label: ti('fields.device.deviceImei'), type: 'text' },
  { key: 'deviceImsi', label: ti('fields.device.deviceImsi'), type: 'text' },
  { key: 'serialNumber', label: ti('fields.device.serialNumber'), type: 'text' },
  { key: 'hardwareVersion', label: ti('fields.device.hardwareVersion'), type: 'text' },
  { key: 'softwareVersion', label: ti('fields.device.softwareVersion'), type: 'text' },
  { key: 'factoryTime', label: ti('fields.device.factoryTime'), type: 'date' },
  { key: 'enableState', label: ti('fields.status.enableState'), type: 'dict', dict: 'enableState' },
  { key: 'onlineStatus', label: ti('fields.status.onlineStatus'), type: 'dict', dict: 'onlineStatus' },
  { key: 'leakStatus', label: ti('fields.status.leakStatus'), type: 'dict', dict: 'leakStatus' },
  { key: 'leakProperty', label: ti('fields.status.leakProperty'), type: 'text' },
  { key: 'lastSamplingTime', label: ti('fields.status.lastSamplingTime'), type: 'text' },
  { key: 'observeDay', label: ti('fields.status.observeDay'), type: 'date' },
  { key: 'installState', label: ti('fields.install.installState'), type: 'dict', dict: 'installState' },
  { key: 'installMode', label: ti('fields.install.installMode'), type: 'dict', dict: 'installMode' },
  { key: 'installAddress', label: ti('fields.install.installAddress'), type: 'text' },
  { key: 'installLongitude', label: ti('fields.install.installLongitude'), type: 'text' },
  { key: 'installLatitude', label: ti('fields.install.installLatitude'), type: 'text' }
];


// 通信与协议
const communicationFieldsConfig: FieldConfig[] = [
  { key: 'wifiName', label: ti('fields.communication.wifiName'), type: 'text' },
  { key: 'wifiMac', label: ti('fields.communication.wifiMac'), type: 'text' },
  { key: 'serverIp', label: ti('fields.communication.serverIp'), type: 'text' },
  { key: 'serverPort', label: ti('fields.communication.serverPort'), type: 'text' },
  { key: 'tcpOnlineStatus', label: ti('fields.communication.tcpOnlineStatus'), type: 'dict', dict: 'onlineStatus' },
  { key: 'tcpRemoteIp', label: ti('fields.communication.tcpRemoteIp'), type: 'text' },
  { key: 'tcpRemotePort', label: ti('fields.communication.tcpRemotePort'), type: 'text' },
  { key: 'tcpSessionId', label: ti('fields.communication.tcpSessionId'), type: 'text' },
  { key: 'tcpConnectedAt', label: ti('fields.communication.tcpConnectedAt'), type: 'date' },
  { key: 'tcpLastSeenAt', label: ti('fields.communication.tcpLastSeenAt'), type: 'date' },
  { key: 'aepProtocol', label: ti('fields.communication.aepProtocol'), type: 'text' },
  { key: 'commandSendway', label: ti('fields.communication.commandSendway'), type: 'text' },
  { key: 'algorithmType', label: ti('fields.communication.algorithmType'), type: 'text' },
  { key: 'algorithmVersion', label: ti('fields.communication.algorithmVersion'), type: 'text' },
  { key: 'loraSignalLevel', label: ti('fields.communication.loraSignalLevel'), type: 'text' },
  { key: 'pressureSensorModel', label: ti('fields.communication.pressureSensorModel'), type: 'text' },
  { key: 'pressureSensorSerial', label: ti('fields.communication.pressureSensorSerial'), type: 'text' }
];

// 管网信息
const tubeFieldsConfig: FieldConfig[] = [
  { key: 'tubeGroup', label: ti('fields.tube.tubeGroup'), type: 'text' },
  { key: 'tubeName', label: ti('fields.tube.tubeName'), type: 'text' },
  { key: 'tubeType', label: ti('fields.tube.tubeType'), type: 'dict', dict: 'tubeType' },
  { key: 'tubeOrder', label: ti('fields.tube.tubeOrder'), type: 'text' },
  { key: 'tubeMaterial', label: ti('fields.tube.tubeMaterial'), type: 'text' },
  { key: 'tubeBore', label: ti('fields.tube.tubeBore'), type: 'text' },
  { key: 'tubeNumber', label: ti('fields.tube.tubeNumber'), type: 'text' }
];

// 产品信息
const productFieldsConfig: FieldConfig[] = [
  { key: 'productName', label: ti('fields.product.productName'), type: 'text' }
];

// 组织信息
const deptFieldsConfig: FieldConfig[] = [
  { key: 'deptName', label: ti('fields.dept.deptName'), type: 'text' }
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
      value = map?.[value] ? ts(map[value]) : '--';
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
  (e: 'edit', data: Partial<Device>): void;
}>();

const activeTab = ref('base');

const detailTabs = [
  { label: ti('tabs.device'), value: 'device' },
  { label: ti('tabs.communication'), value: 'communication' },
  { label: ti('tabs.tube'), value: 'tube' },
  { label: ti('tabs.product'), value: 'product' },
  { label: ti('tabs.dept'), value: 'dept' }
];

// 根据当前激活的 Tab，动态返回对应的字段列表
const currentFields = computed(() => {
  switch (activeTab.value) {
    case 'device':
      return resolveFields(deviceFieldsConfig);

    case 'communication':
      return resolveFields(communicationFieldsConfig);

    case 'tube':
      return resolveFields(tubeFieldsConfig);

    case 'product':
      return resolveFields(productFieldsConfig);

    case 'dept':
      return resolveFields(deptFieldsConfig);

    default:
      return [];
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
  const status = props.deviceData.onlineStatus;

  if (status === 1) return ts('online.online');
  if (status === 0) return ts('online.offline');

  return ts('online.unknown');
});

const getDeviceTypeLabel = computed(() => {
  return props.deviceData.deviceType;
});

function closeDrawer() {
  emit('update:visible', false);
}

function handleEdit() {
  emit('edit', props.deviceData);
}

// 监听数据加载
watch(
    () => props.deviceData.id,
    async (id) => {
      if (!id) return;
      await loadRelationData(props.deviceData);
    },
    { immediate: true }
);

const product = ref<DeviceProduct>();
const tube = ref<TubeNetwork>();
const dept = ref<Dept>();

async function loadRelationData(device: Partial<Device>) {
  // if (!device.id) return;
  //
  //
  // const [
  //   productRes,
  //   deptRes,
  //   tubeRes
  // ] = await Promise.all([
  //   device.productId
  //       ? getDeviceProductByIdT(device.productId)
  //       : null,
  //
  //   device.deptId
  //       ? getDeptByIdT(device.deptId)
  //       : null,
  //
  //   device.tubeGroup
  //       ? getTubeNetworkListT()
  //       : null
  // ]);
  //
  //
  // product.value = productRes?.data as DeviceProduct;
  //
  // dept.value = deptRes?.data as Dept;
  //
  //
  // const tubeList = (tubeRes?.data ?? []) as TubeNetwork[];
  //
  // tube.value = tubeList.find(item =>
  //     String(item.id) === String(device.tubeGroup)
  //     ||
  //     String(item.tubeName) === String(device.tubeGroup)
  // );
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
