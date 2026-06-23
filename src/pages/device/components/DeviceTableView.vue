<template>
  <view class="worksheet-table-panel">
    <view class="table-head">
      <text>设备创建记录</text>
      <text class="table-head__meta">共 {{ pagination.total }} 条</text>
    </view>

    <scroll-view class="table-scroll" scroll-x scroll-y>
      <view class="data-table">
        <view class="data-row data-row--header">

          <text class="data-cell data-cell--index">序号</text>
          <text class="data-cell data-cell--device">设备编号</text>
          <text class="data-cell data-cell--type">设备类型</text>
          <text class="data-cell data-cell--status">启用状态</text>
          <text class="data-cell data-cell--status">安装状态</text>
          <text class="data-cell data-cell--status">安装模式</text>
          <text class="data-cell data-cell--address">安装地址</text>
          <text class="data-cell data-cell--number">管组编号</text>
          <text class="data-cell data-cell--status">渗漏状态</text>
          <text class="data-cell data-cell--time">最后采样时间</text>
          <text class="data-cell data-cell--status">在线状态</text>
        </view>

        <view v-if="loading" class="table-state">加载中...</view>
        <view v-else-if="filteredDevices.length === 0" class="table-state">暂无工单数据</view>

        <view
            v-for="(device, index) in filteredDevices"
            :key="device.id"
            class="data-row"
            :class="{ 'data-row--active': selectedId === device.id }"
            @click="selectRow(device)"
        >

          <text class="data-cell data-cell--index">
            {{ (pagination.current - 1) * pagination.size + index + 1 }}
          </text>

          <text class="data-cell data-cell--device">{{ device.deviceNumber }}</text>
          <text class="data-cell data-cell--type">{{ device.deviceType }}</text>
          <text class="data-cell data-cell--status">
            {{ enableStateMap[device.enableState] || '-' }}
          </text>
          <text class="data-cell data-cell--status">
            {{ installStateMap[device.installState] || '-' }}
          </text>
          <text class="data-cell data-cell--status">
            {{ installModeMap[device.installMode] || '-' }}
          </text>
          <text class="data-cell data-cell--address">{{ device.installAddress }}</text>
          <text class="data-cell data-cell--number">{{ device.tubeGroup }}</text>
          <text class="data-cell data-cell--status">
            {{ leakStatusMap[device.leakStatus] || '-' }}
          </text>
          <text class="data-cell data-cell--time">{{ device.lastSamplingTime }}</text>
          <text class="data-cell data-cell--status">
            {{ onlineStatusMap[device.onlineStatus] || '-' }}
          </text>
        </view>
      </view>
    </scroll-view>

    <view class="pagination-bar">
      <button class="page-button" :disabled="pagination.current <= 1" @click="changePage(-1)">上一页</button>
      <text class="page-info">第 {{ pagination.current }} / {{  Math.ceil(pagination.total / pagination.size) || 1  }} 页</text>
      <button class="page-button" :disabled="pagination.current >= 1" @click="changePage(1)">下一页</button>
    </view>
  </view>
</template>
<script setup lang="ts">
import {ref, computed, reactive} from 'vue';
import type { Device } from '@/services/device/types';
import type {Pagination} from "@/types/api";

const props = defineProps<{
  devices: Device[];
  pagination: Pagination;
}>();

const loading = ref(false);
const enableStateMap: Record<number, string> = {
  0: '停用',
  1: '启用'
}

const installStateMap: Record<number, string> = {
  0: '未安装',
  1: '已安装'
}

const installModeMap: Record<number, string> = {
  0: '固定点',
  1: '流动点'
}

const onlineStatusMap: Record<number, string> = {
  0: '离线',
  1: '在线'
}

const leakStatusMap: Record<number, string> = {
  0: '渗漏',
  1: '正常',
  2: '疑似',
  3: '未知'
}

const emit = defineEmits<{
  (e: 'create'): void;
  (e: 'view', device: Device): void;
  (e: 'edit', device: Device): void;
  (e: 'delete', device: Device): void;
  (e: 'page-change', step: number): void;
}>();

const searchKeyword = ref('');
const selectedId = ref<number | null>(null);

// ✅ 点击行：选中 + 查看
function selectRow(device: Device) {
  selectedId.value = device.id;
  emit('view', device);
}

// 过滤
const filteredDevices = computed(() => {
  if (!searchKeyword.value) return props.devices;

  const keyword = searchKeyword.value.toLowerCase();

  return props.devices.filter(d =>
      d.deviceNumber.toLowerCase().includes(keyword)
  );
});

function changePage(step: number) {
  const maxPage = Math.ceil(props.pagination.total / props.pagination.size);

  const next = props.pagination.current + step;

  if (next < 1 || next > maxPage) return;

  emit('page-change', next);
}

</script>
<style scoped lang="scss">

.pagination-bar{
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-info {
  color: #64748b;
  font-size: 13px;
}

.page-button::after {
  border: 0;
}

.page-button {
  height: 30px;
  margin: 0;
  padding: 0 12px;
  color: #31506d;
  font-size: 13px;
  line-height: 30px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.page-button[disabled] {
  color: #a9b4c1;
  background: #f4f7fa;
}

.worksheet-table-panel {
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
  height: 100%;
}

.table-state {
  height: 180px;
  color: #7c8da1;
  font-size: 14px;
  line-height: 180px;
  text-align: center;
}

.worksheet-table-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.table-head {
  flex: none;
  height: 50px;
  padding: 0 16px;
  color: #24445f;
  font-size: 16px;
  font-weight: 800;
  background: #ffffff;
  border-bottom: 1px solid #edf3f8;
}

.table-head__meta {
  padding: 4px 10px;
  color: #6a7f94;
  font-size: 13px;
  font-weight: 800;
  background: #f7fafc;
  border: 1px solid #e3ebf2;
  border-radius: 999px;
}

.table-scroll {
  flex: 1;
  height: auto;
  min-height: 0;
  background: #ffffff;
  overflow-x: auto;
  white-space: nowrap;
}

.data-table {
  display: inline-flex;
  flex-direction: column;
  width: max-content;
  background: #ffffff;
}


.data-row {
  display: flex;
  grid-template-columns: 58px 190px 116px 110px 110px 110px 138px 104px 168px 168px 168px 220px 220px;
  min-height: 42px;
  width: max-content;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
  transition:
      background 0.18s ease,
      box-shadow 0.18s ease;
}

.data-row--header {
  position: sticky;
  top: 0;
  z-index: 1;
  min-height: 44px;
  color: #20384f;
  font-weight: 800;
  background: #f6f9fc;
  cursor: default;
  box-shadow: 0 1px 0 #dbe7f0;
}

.data-row:not(.data-row--header):nth-child(odd) {
  background: #ffffff;
}

.data-row:not(.data-row--header):nth-child(even) {
  background: #fbfdff;
}

.data-row:not(.data-row--header):hover {
  background: #f1f8ff;
  box-shadow: inset 0 0 0 1px #d7ebfb;
}

.data-row--active {
  position: relative;
  background: #e7f3ff !important;
  box-shadow: inset 0 0 0 1px #b9dcff;
}

.data-row--active::before {
  position: absolute;
  top: 7px;
  bottom: 7px;
  left: 0;
  width: 3px;
  content: "";
  background: #0d82ee;
  border-radius: 0 999px 999px 0;
}


.data-cell {
  display: flex !important;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 0 12px;
  overflow: hidden;
  color: #24384d;
  font-size: 13px;
  line-height: 1.35;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-right: 1px solid #edf1f5;
  width: 140px;
}

.data-row--header .data-cell {
  color: #415a73;
  font-size: 12px;
  letter-spacing: 0;
}

.data-cell:last-child {
  border-right: 0;
}

.data-cell--index {
  justify-content: center;
  color: #64748b;
}

.data-cell--number {
  color: #0f4c81;
  font-family: "DIN Alternate", "Arial", sans-serif;
  font-weight: 800;
}

.data-cell--address,
.data-cell--remark {
  justify-content: flex-start;
  text-align: left;
}

.pagination-bar {
  flex: none;
  justify-content: flex-end;
  gap: 10px;
  height: 48px;
  padding: 0 14px;
  border-top: 1px solid #edf3f8;
}
</style>