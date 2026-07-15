<template>
  <view class="data-table-container">
    <view class="table-head">
      <text>{{ t('deviceTable.title') }}</text>
      <text class="table-head__meta">  {{ t('common.pagination.totalRecords', { total: pagination.total }) }}</text>
    </view>

    <scroll-view class="table-scroll" scroll-x scroll-y>
      <view class="data-table">
        <view class="data-row data-row--header">
          <text v-if="columnVisible.index" class="data-cell data-cell--index">{{ tc('table.index') }}</text>
          <text v-if="columnVisible.deviceNumber" class="data-cell ">{{ t('deviceTable.deviceNumber') }}</text>
          <text v-if="columnVisible.deviceType" class="data-cell ">{{ t('deviceTable.deviceType') }}</text>
          <text v-if="columnVisible.deviceAlias" class="data-cell ">{{ t('deviceTable.deviceAlias') }}</text>
          <text v-if="columnVisible.enableState" class="data-cell ">{{ t('deviceTable.enableState') }}</text>
          <text v-if="columnVisible.installState" class="data-cell ">{{ t('deviceTable.installState') }}</text>
          <text v-if="columnVisible.installMode" class="data-cell ">{{ t('deviceTable.installMode') }}</text>
          <text v-if="columnVisible.installAddress" class="data-cell ">{{ t('deviceTable.installAddress') }}</text>
          <text v-if="columnVisible.coordinate" class="data-cell ">{{ t('deviceTable.coordinate') }}</text>
          <text v-if="columnVisible.tubeGroup" class="data-cell ">{{ t('deviceTable.tubeGroup') }}</text>
          <text v-if="columnVisible.leakStatus" class="data-cell ">{{ t('deviceTable.leakStatus') }}</text>
          <text v-if="columnVisible.lastSamplingTime" class="data-cell ">{{ t('deviceTable.lastSamplingTime') }}</text>
          <text v-if="columnVisible.onlineStatus" class="data-cell ">{{ t('deviceTable.onlineStatus') }}</text>
          <text v-if="columnVisible.factoryTime" class="data-cell ">{{ t('deviceTable.factoryTime') }}</text>
        </view>

        <view v-if="loading" class="table-state">{{ tc('table.loading') }}</view>
        <view v-else-if="filteredDevices.length === 0" class="table-state">{{ tc('table.empty') }}</view>

        <view
            v-for="(device, index) in filteredDevices"
            :key="device.id"
            class="data-row"
            :class="{ 'data-row--active': props.selectedId === device.id }"
            @click="selectRow(device)"
        >

          <text v-if="columnVisible.index" class="data-cell data-cell--index">
            {{ (pagination.current - 1) * pagination.size + index + 1 }}
          </text>

          <text v-if="columnVisible.deviceNumber" class="data-cell data-cell--device">{{ device.deviceNumber }}</text>
          <text v-if="columnVisible.deviceType" class="data-cell data-cell--type">{{ device.deviceType }}</text>
          <text v-if="columnVisible.deviceAlias" class="data-cell data-cell--device">
            {{ device.deviceAlias || '-' }}
          </text>
          <text
              v-if="columnVisible.enableState"
              class="data-cell data-cell--status"
          >
            <text
                class="status-tag"
                :class="{
                  'status-tag--success': device.enableState === 1,
                  'status-tag--danger': device.enableState === 0
                }"
            >
              {{ enableStateMap[device.enableState] || '-' }}
            </text>
          </text>
          <text
              v-if="columnVisible.installState"
              class="data-cell data-cell--status"
          >
            <text
                class="status-tag"
                :class="{
                  'status-tag--success': device.installState === 1,
                  'status-tag--default': device.installState === 0
                }"
            >
              {{ installStateMap[device.installState] || '-' }}
            </text>
          </text>
          <text
              v-if="columnVisible.installMode"
              class="data-cell data-cell--status"
          >
            <text
                class="status-tag"
                :class="{
                  'status-tag--primary': device.installMode === 0,
                  'status-tag--info': device.installMode === 1
                }"
            >
              {{ installModeMap[device.installMode] || '-' }}
            </text>
          </text>
          <text v-if="columnVisible.installAddress" class="data-cell data-cell--address">{{ device.installAddress }}</text>
          <text
              v-if="columnVisible.coordinate" class="data-cell data-cell--coord data-cell--link"
              @click.stop="handleCoordClick(device.installLongitude, device.installLatitude)"          >
            {{ device.installLongitude && device.installLatitude
              ? `${device.installLongitude}, ${device.installLatitude}`
              : '-' }}
          </text>
          <text v-if="columnVisible.tubeGroup" class="data-cell data-cell--number">{{ device.tubeGroup }}</text>
          <text
              v-if="columnVisible.leakStatus"
              class="data-cell data-cell--status"
          >
            <text
                class="status-tag"
                :class="getStatusClass('leak', device.leakStatus)"
            >
              {{ leakStatusMap[device.leakStatus] || '-' }}
            </text>
          </text>
          <text v-if="columnVisible.lastSamplingTime" class="data-cell data-cell--time">{{ formatDate(device.lastSamplingTime) }}</text>
          <text
              v-if="columnVisible.onlineStatus"
              class="data-cell data-cell--status"
          >
            <text
                class="status-tag"
                :class="{
                  'status-tag--success': device.onlineStatus === 1,
                  'status-tag--default': device.onlineStatus === 0
                }"
            >
              {{ onlineStatusMap[device.onlineStatus] || '-' }}
            </text>
          </text>
          <text v-if="columnVisible.factoryTime" class="data-cell data-cell--time">
            {{ formatDate(device.factoryTime) }}
          </text>
        </view>
      </view>
    </scroll-view>

    <XPaginationBar
        :current="pagination.current"
        :size="pagination.size"
        :total="pagination.total"
        @change-page="(page:number) => emit('page-change', page)"
        @change-size="(size:number) => emit('page-size-change', size)"
    />
  </view>

  <XMapPopup
      v-model:visible="showMap"
      :lng="lng"
      :lat="lat"
      :title="t('map.dialogTitle')"
  />
</template>
<script setup lang="ts">
import {ref, computed, watch} from 'vue';
import type { Device } from '@/services/device/types';
import type {Pagination} from "@/types/api";
import XMapPopup from "@/pages/device/components/x/map/XMapPopup.vue";
import XPaginationBar from "@/pages/device/components/x/table/XPaginationBar.vue";
import {createScopedT} from "@/i18n";
import {formatDate} from "../../../utils/time";
const t = createScopedT("devicePage");
const tc = createScopedT("devicePage.common");

const props = defineProps<{
  devices: Device[];
  selectedId: number | null;
  pagination: Pagination;
  mode:"info" | "maintenance" | "status" | "protocol";
}>();

const columnVisible = computed(() => ({
  // 基础
  index: true,
  deviceNumber: true,
  deviceType: true,

  deviceAlias: ['info', 'maintenance', 'protocol'].includes(props.mode),
  factoryTime: props.mode === 'info',

  // 状态
  enableState: ['info', 'status'].includes(props.mode),
  installState: ['info', 'maintenance'].includes(props.mode),
  installMode: ['info', 'maintenance'].includes(props.mode),
  installAddress: ['info', 'maintenance'].includes(props.mode),
  coordinate: ['info', 'maintenance'].includes(props.mode),

  // 管道
  tubeGroup: props.mode === 'info',

  // 泄漏
  leakStatus: ['info', 'maintenance', 'status'].includes(props.mode),

  // 数据
  lastSamplingTime: ['info', 'maintenance', 'status'].includes(props.mode),
  onlineStatus: true,

  // 协议
  aepProtocol: props.mode === 'protocol',
  hardwareVersion: props.mode === 'protocol',
  softwareVersion: props.mode === 'protocol',

  tcpOnlineStatus: props.mode === 'protocol',
  tcpRemoteIp: props.mode === 'protocol',
  tcpRemotePort: props.mode === 'protocol',
  tcpConnectedAt: props.mode === 'protocol',
  tcpLastSeenAt: props.mode === 'protocol',

  // 算法
  algorithmType: props.mode === 'protocol',
  algorithmVersion: props.mode === 'protocol',

  // 设备扩展
  valveNumber: props.mode === 'info',
  tubeMaterial: props.mode === 'info',
  tubeBore: props.mode === 'info',
  tubeNumber: props.mode === 'info',
}));

const loading = ref(false);
const enableStateMap = computed<Record<number, string>>(() => ({
  0: t('status.status.disabled'),
  1: t('status.status.enabled')
}));

const installStateMap = computed<Record<number, string>>(() => ({
  0: t('status.install.uninstalled'),
  1: t('status.install.installed')
}));

const installModeMap = computed<Record<number, string>>(() => ({
  0: t('status.installMode.fixed'),
  1: t('status.installMode.mobile')
}));

const onlineStatusMap = computed<Record<number, string>>(() => ({
  0: t('status.online.offline'),
  1: t('status.online.online')
}));

const leakStatusMap = computed<Record<number, string>>(() => ({
  0: t('status.leak.leak'),
  1: t('status.leak.normal'),
  2: t('status.leak.suspected'),
  3: t('status.leak.unknown')
}));


const emit = defineEmits<{
  (e: 'view', device: Device): void;
  (e: 'select', device: Device): void;
  (e: 'page-change', page: number): void;
  (e: 'page-size-change', size: number): void;
}>();

const searchKeyword = ref('');

// ✅ 点击行：选中 + 查看
function selectRow(device: Device) {
  emit('view', device);
  emit('select', device);
}

// 过滤
const filteredDevices = computed(() => {
  if (!searchKeyword.value) return props.devices;

  const keyword = searchKeyword.value.toLowerCase();

  return props.devices.filter(d =>
      d.deviceNumber.toLowerCase().includes(keyword)
  );
});

const showMap = ref(false);
const lng = ref(0);
const lat = ref(0);

function openCoord(longitude: number, latitude: number) {
  lng.value = longitude;
  lat.value = latitude;
  showMap.value = true;
}

const getStatusClass = (type: string, value: number) => {

  if (type === 'leak') {
    switch (value) {
      case 0:
        return 'status-tag--danger';   // 渗漏
      case 1:
        return 'status-tag--success';  // 正常
      case 2:
        return 'status-tag--warning';  // 疑似
      case 3:
        return 'status-tag--default';  // 未知
      default:
        return 'status-tag--default';
    }
  }

  return 'status-tag--default';
};

function handleCoordClick(longitude: number, latitude: number) {
  if (longitude && latitude) {
    // 有坐标，打开地图
    openCoord(longitude, latitude);
  } else {
    // 没有坐标，弹出提示
    uni.showToast({
      title: t('map.noCoordinate'),
      icon: 'none',
      duration: 2000
    });
  }
}

</script>

<style scoped lang="scss">
@import "@/pages/device/components/x/common/status.css";
@import "@/pages/device/components/x/table/styles/table-cell.css";
@import "@/pages/device/components/x/table/styles/table.css";
@import "@/pages/device/components/x/table/styles/table-row.css";
</style>
