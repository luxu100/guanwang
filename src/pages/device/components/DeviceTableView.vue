<template>
  <view class="data-table-container">
    <view class="table-head">
      <text>{{ t('deviceTable.title') }}</text>
      <text class="table-head__meta">  {{ t('common.pagination.totalRecords', { total: pagination.total }) }}</text>
    </view>

    <XDataTable
        :columns="columns"
        :data="filteredDevices"
        :loading="loading"
        :show-index="true"
        :selected="props.selectedId"
        :page-current="pagination.current"
        :page-size="pagination.size"
        @row-click="selectRow"
        @update:selected="handleSelect"
    >
      <template #footer>
        <XPaginationBar :current="pagination.current" :size="pagination.size" :total="pagination.total" @change-page="page=>emit('page-change',page)" @change-size="size=>emit('page-size-change',size)"/>
      </template>
    </XDataTable>
  </view>
</template>
<script setup lang="ts">
import {ref, computed, watch} from 'vue';
import type { Device } from '@/services/device/types';
import type {Pagination} from "@/types/api";
import XMapPopup from "@/pages/device/components/x/map/XMapPopup.vue";
import XPaginationBar from "@/pages/device/components/x/table/XPaginationBar.vue";
import {createScopedT} from "@/i18n";
import {formatDate} from "../../../utils/time";
import XDataTable from "@/pages/device/components/x/table/XDataTable.vue";
import type {XDataColumn} from "@/pages/device/components/x/types";
import {
  algorithmTypeOptions,
  deviceTypeOptions,
  enableStateOptions,
  installModeOptions,
  installStateOptions, leakStatusOptions, onlineStatusOptions
} from "@/pages/device/components/common";
const t = createScopedT("devicePage");

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
  algorithmType: ['info', 'protocol'].includes(props.mode),
  algorithmVersion: ['info', 'protocol'].includes(props.mode),

  // 设备扩展
  valveNumber: props.mode === 'info',
  tubeMaterial: props.mode === 'info',
  tubeBore: props.mode === 'info',
  tubeNumber: props.mode === 'info',
}));

const loading = ref(false);
const columns = computed<XDataColumn[]>(()=>{
  const list:XDataColumn[] = [];
  if(columnVisible.value.deviceNumber) list.push({ key:'deviceNumber', labelKey:'deviceTable.deviceNumber', width:180, className:'data-cell--number' });
  if(columnVisible.value.deviceType) list.push({ key:'deviceType', labelKey:'deviceTable.deviceType', width:150, className:'data-cell--text', options:deviceTypeOptions });
  if(columnVisible.value.deviceAlias) list.push({ key:'deviceAlias', labelKey:'deviceTable.deviceAlias', width:180, className:'data-cell--remark', formatter:value=>value || '-' });
  if(columnVisible.value.enableState) list.push({ key:'enableState', labelKey:'deviceTable.enableState', width:120, className:'data-cell--status', options:enableStateOptions });
  if(columnVisible.value.installState) list.push({ key:'installState', labelKey:'deviceTable.installState', width:160, className:'data-cell--status', options:installStateOptions });
  if(columnVisible.value.installMode) list.push({ key:'installMode', labelKey:'deviceTable.installMode', width:160, className:'data-cell--status', options:installModeOptions });
  if(columnVisible.value.installAddress) list.push({ key:'installAddress', labelKey:'deviceTable.installAddress', width:240, className:'data-cell--address', formatter:value=>value || '-' ,tooltip:true });
  if(columnVisible.value.coordinate) list.push({ key:'coordinate', labelKey:'deviceTable.coordinate', width:180, className:'data-cell--coord', bodyClassName:'data-cell--link', type:'coord', formatter:(_,row)=>row.installLongitude===999&&row.installLatitude===999?'-':row.installLongitude&&row.installLatitude?`${row.installLongitude},${row.installLatitude}`:'-' });
  if(columnVisible.value.algorithmType) list.push({ key:'algorithmType', labelKey:'deviceTable.algorithmType', width:150, className:'data-cell--text', options:algorithmTypeOptions });
  if(columnVisible.value.algorithmVersion) list.push({ key:'algorithmVersion', labelKey:'deviceTable.algorithmVersion', width:160, className:'data-cell--text', formatter:value=>value || '-' });
  if(columnVisible.value.tubeGroup) list.push({ key:'tubeGroup', labelKey:'deviceTable.tubeGroup', width:120, className:'data-cell--number', formatter:value=>value || '-' });
  if(columnVisible.value.leakStatus) list.push({ key:'leakStatus', labelKey:'deviceTable.leakStatus', width:120, className:'data-cell--status', options:leakStatusOptions });
  if(columnVisible.value.lastSamplingTime) list.push({ key:'lastSamplingTime', labelKey:'deviceTable.lastSamplingTime', width:180, className:'data-cell--time', formatter:value=>formatDate(value) });
  if(columnVisible.value.onlineStatus) list.push({ key:'onlineStatus', labelKey:'deviceTable.onlineStatus', width:120, className:'data-cell--status', options:onlineStatusOptions });
  if(columnVisible.value.factoryTime) list.push({ key:'factoryTime', labelKey:'deviceTable.factoryTime', width:180, className:'data-cell--time', formatter:value=>formatDate(value) || '-' });
  return list;
});

const emit = defineEmits<{
  (e: 'view', device: Device): void;
  (e: 'select', device: Device): void;
  (e: 'page-change', page: number): void;
  (e: 'page-size-change', size: number): void;
}>();

const searchKeyword = ref('');

function selectRow(device:Device){
  emit('view',device);
}

function handleSelect(id:number){
  const device = props.devices.find(
      item=>item.id===id
  );

  if(device){
    emit('select',device);
  }
}

// 过滤
const filteredDevices = computed(() => {
  if (!searchKeyword.value) return props.devices;

  const keyword = searchKeyword.value.toLowerCase();

  return props.devices.filter(d =>
      d.deviceNumber.toLowerCase().includes(keyword)
  );
});
</script>

<style scoped lang="scss">
@import "@/pages/device/components/x/common/status.css";
@import "@/pages/device/components/x/table/styles/table-cell.css";
@import "@/pages/device/components/x/table/styles/table.css";
@import "@/pages/device/components/x/table/styles/table-row.css";
</style>
