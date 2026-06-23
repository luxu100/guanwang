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

    <!-- 内容 -->
    <view class="detail-body">

      <!-- 基础信息 -->
      <view v-if="activeTab === 'base'" class="detail-grid">
        <view v-for="f in baseFields" :key="f.label" class="detail-item detail-item--base">
          <text class="detail-item__label">{{ f.label }}</text>
          <text class="detail-item__value">{{ f.value }}</text>
        </view>
      </view>

      <!-- 安装信息 -->
      <view v-if="activeTab === 'install'" class="detail-grid">
        <view v-for="f in installFields" :key="f.label" class="detail-item detail-item--base">
          <text class="detail-item__label">{{ f.label }}</text>
          <text class="detail-item__value">{{ f.value }}</text>
        </view>
      </view>

      <!-- 运行状态 -->
      <view v-if="activeTab === 'status'" class="detail-grid">
        <view v-for="f in statusFields" :key="f.label" class="detail-item detail-item--base">
          <text class="detail-item__label">{{ f.label }}</text>
          <text class="detail-item__value">{{ f.value }}</text>
        </view>
      </view>

      <!-- 管线信息 -->
      <view v-if="activeTab === 'tube'" class="detail-grid">
        <view v-for="f in tubeFields" :key="f.label" class="detail-item detail-item--base">
          <text class="detail-item__label">{{ f.label }}</text>
          <text class="detail-item__value">{{ f.value }}</text>
        </view>
      </view>

<!--      &lt;!&ndash; 协议信息 &ndash;&gt;-->
<!--      <view v-if="activeTab === 'protocol'" class="detail-grid">-->
<!--        <view v-for="f in protocolFields" :key="f.label" class="detail-item detail-item&#45;&#45;base">-->
<!--          <text class="detail-item__label">{{ f.label }}</text>-->
<!--          <text class="detail-item__value">{{ f.value }}</text>-->
<!--        </view>-->
<!--      </view>-->

    </view>
  </view>
</template>

<script setup lang="ts">
// ... (这部分的逻辑代码保持不变，直接复用你原来的)
import { computed, ref } from 'vue';
import { watch } from 'vue';
import type {Dept, Device, DeviceDept, DeviceProduct, TubeNetwork} from '@/services/device/types';
import {
  getDeviceProductByIdT,
  getTubeNetworkByTubeNameT,
  getDeptByIdT,
  getDeptDeviceByDeviceIdT
} from '@/services/device/info.typed';

interface Props {
  visible: boolean;
  deviceData: Partial<Device>;
}
const product = ref<DeviceProduct>();
const tube = ref<TubeNetwork>();
const dept = ref<Dept>();
const deviceDept = ref<DeviceDept>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'edit', data: Partial<Device>): void;
}>();

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  deviceData: () => ({}),
});

const activeTab = ref('base');

watch(
    () => props.deviceData.id,
    async (id) => {
      if (!id) return;

      await loadRelationData(props.deviceData);
    },
    {
      immediate: true
    }
);

const detailTabs = [
  { label: '基础信息', value: 'base' },
  { label: '安装信息', value: 'install' },
  { label: '运行状态', value: 'status' },
  { label: '管线信息', value: 'tube' },
  // { label: '协议信息', value: 'protocol' }
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
  { label: '产品型号', value: product.value?.productName },
  { label: 'IMEI', value: props.deviceData.deviceImei },
  { label: 'IMSI', value: props.deviceData.deviceImsi },
  { label: '序列号', value: props.deviceData.serialNumber },
  { label: '硬件版本', value: props.deviceData.hardwareVersion },
  { label: '软件版本', value: props.deviceData.softwareVersion },
  { label: '出厂时间', value: props.deviceData.factoryTime }
]);
const installFields = computed(() => [
  { label: '安装状态', value: props.deviceData.installState },
  { label: '安装模式', value: props.deviceData.installMode },
  { label: '安装地址', value: props.deviceData.installAddress },
  { label: '经度', value: props.deviceData.installLongitude },
  { label: '纬度', value: props.deviceData.installLatitude },
  { label: '管组编号', value: props.deviceData.tubeGroup },
  { label: '管线排序', value: props.deviceData.tubeOrder }
]);

const statusFields = computed(() => [
  { label: '启用状态', value: props.deviceData.enableState },
  { label: '在线状态', value: props.deviceData.onlineStatus },
  { label: '渗漏状态', value: props.deviceData.leakStatus },
  { label: '特征值', value: props.deviceData.leakProperty },
  { label: '最后采样时间', value: props.deviceData.lastSamplingTime },
  { label: '观测天数', value: props.deviceData.observeDay }
]);

const tubeFields = computed(() => [
  { label: '管组编号', value: props.deviceData.tubeGroup },
  { label: '管线名称', value: tube.value?.tubeName },
  { label: '管线类型', value: tube.value?.tubeType },
  { label: '分区信息', value: dept.value?.deptName }
]);

// const protocolFields = computed(() => [
//   { label: 'AFN', value: props.deviceData.afn },
//
//   {
//     label: '任务类型',
//     value: props.deviceData.taskType
//   },
//
//   {
//     label: '优先级',
//     value: props.deviceData.priority
//   },
//
//   {
//     label: '是否启用',
//     value: props.deviceData.enabled ? '是' : '否'
//   }
// ]);


async function loadRelationData(device: Partial<Device>) {
  if (!device?.id) return;

  // 1️⃣ 并发请求（允许 null 占位，避免 undefined 污染类型）
  const [productRes, deviceDeptRes, tubeRes] = await Promise.all([
    device.productId
        ? getDeviceProductByIdT(device.productId)
        : null,

    getDeptDeviceByDeviceIdT(device.id),

    device.tubeGroup
        ? getTubeNetworkByTubeNameT(device.tubeGroup)
        : null
  ]);

  // console.log('productRes', productRes);
  // console.log('deviceDeptRes', deviceDeptRes);
  // console.log('tubeRes', tubeRes);

  // 2️⃣ 统一解包 .data（关键）
  product.value = productRes?.data as DeviceProduct;
  deviceDept.value = deviceDeptRes?.data as DeviceDept;
  tube.value = tubeRes?.data as TubeNetwork;

  // 3️⃣ 串行依赖查询 dept
  if (deviceDept.value?.deptId) {
    const deptRes = await getDeptByIdT(deviceDept.value.deptId);
    dept.value = deptRes?.data as Dept;
  }

  // 4️⃣ debug
  // console.log('product', product.value);
  // console.log('dept', dept.value);
  // console.log('tube', tube.value);
  // console.log('deviceDept', deviceDept.value);
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