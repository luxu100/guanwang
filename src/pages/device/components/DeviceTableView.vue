<template>
  <view class="worksheet-table-panel">
    <view class="table-head">
      <text>{{ 123 }}</text>
      <text class="table-head__meta">共 {{ 123 }} 条</text>
    </view>

    <scroll-view class="table-scroll" scroll-x scroll-y>
      <view class="data-table">
        <view class="data-row data-row--header">
          <text class="data-cell data-cell--index">序号</text>
          <text class="data-cell data-cell--number">工单编号</text>
          <text class="data-cell data-cell--type">工单类型</text>
          <text class="data-cell data-cell--status">工单状态</text>
          <text class="data-cell data-cell--account">发起人</text>
          <text class="data-cell data-cell--account">执行人</text>
          <text class="data-cell data-cell--device">设备引用</text>
          <text class="data-cell data-cell--level">紧急程度</text>
          <text class="data-cell data-cell--time">发起时间</text>
          <text class="data-cell data-cell--time">截止时间</text>
          <text class="data-cell data-cell--time">完成时间</text>
          <text class="data-cell data-cell--address">地址</text>
          <text class="data-cell data-cell--remark">备注</text>
        </view>

        <view v-if="loading" class="table-state">加载中...</view>
        <view v-else-if="filteredDevices.length === 0" class="table-state">暂无工单数据</view>

        <view
            v-for="device in filteredDevices"
            :key="device.id"
            class="data-row"
            :class="{ 'data-row--active': selectedId === device.id }"
            @click="selectRow(device)"
        >
          <text class="data-cell data-cell--index">{{ (pagination.pageNum - 1) * pagination.pageSize + index + 1 }}</text>
          <text class="data-cell data-cell--number">{{ getWorksheetNumber(item) }}</text>
          <text class="data-cell data-cell--type">{{ getWorksheetTypeLabel(item) }}</text>
          <text class="data-cell data-cell--status">
            <text class="status-pill" :class="getStatusClass(item)">{{ getWorksheetStatusLabel(item) }}</text>
          </text>
          <text class="data-cell data-cell--account">{{ getRiseAccount(item) }}</text>
          <text class="data-cell data-cell--account">{{ getExecuteAccount(item) }}</text>
          <text class="data-cell data-cell--device">{{ getDeviceReference(item) }}</text>
          <text class="data-cell data-cell--level">
            <text class="urgency-pill" :class="getUrgencyClass(item)">{{ getUrgencyLabel(item) }}</text>
          </text>
          <text class="data-cell data-cell--time">{{ getRiseTime(item) }}</text>
          <text class="data-cell data-cell--time">{{ getDeadlineTime(item) }}</text>
          <text class="data-cell data-cell--time">{{ getFinishTime(item) }}</text>
          <text class="data-cell data-cell--address">{{ getAddress(item) }}</text>
          <text class="data-cell data-cell--remark">{{ getRemark(item) }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="pagination-bar">
      <button class="page-button" :disabled="pagination.pageNum <= 1" @click="changePage(-1)">上一页</button>
      <text class="page-info">第 {{ pagination.pageNum }} / {{ 1 }} 页</text>
      <button class="page-button" :disabled="pagination.pageNum >= 1" @click="changePage(1)">下一页</button>
    </view>
  </view>
</template>
<script setup lang="ts">
import {ref, computed, reactive} from 'vue';
import type { Device } from '@/services/device/types';

interface Props {
  devices: Device[];
}

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
});

const loading = ref(false);

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'create'): void;
  (e: 'view', device: Device): void;
  (e: 'edit', device: Device): void;
  (e: 'delete', device: Device): void;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
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
}

.data-table {
  width: 1880px;
  min-width: 1880px;
  background: #ffffff;
}


.data-row {
  display: grid;
  grid-template-columns: 58px 190px 116px 110px 110px 110px 138px 104px 168px 168px 168px 220px 220px;
  min-height: 42px;
  width: 1880px;
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
  display: flex;
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