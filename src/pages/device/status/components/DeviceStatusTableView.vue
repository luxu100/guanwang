<template>
  <view class="worksheet-table-panel">
    <DeviceStatusToolbar
        v-model="searchForm"
        @search="handleSearch"
        @reset="handleSearch"
        @refresh="fetchDeviceStatuss"
    />

    <view class="table-head">
      <text>设备状态详情</text>
      <text class="table-head__meta">共 {{ pagination.total }} 条</text>
    </view>

    <scroll-view class="table-scroll" scroll-x scroll-y>
      <view class="data-table">
        <view class="data-row data-row--header">

          <text class="data-cell data-cell--index">序号</text>
          <text class="data-cell data-cell--device">设备ID</text>
          <text class="data-cell data-cell--device">设备编号</text>

          <text class="data-cell data-cell--device">固件版本</text>
          <text class="data-cell data-cell--device">硬件版本</text>

          <text class="data-cell data-cell--status">工作模式</text>

          <text class="data-cell data-cell--number">电池电压</text>
          <text class="data-cell data-cell--number">设备温度</text>

          <text class="data-cell data-cell--number">信号强度</text>
          <text class="data-cell data-cell--number">信号质量</text>

          <text class="data-cell data-cell--number">坐标位置</text>

          <text class="data-cell data-cell--number">ESA指标</text>
          <text class="data-cell data-cell--number">漏损强度</text>
          <text class="data-cell data-cell--number">漏损频率</text>

          <text class="data-cell data-cell--status">渗漏状态</text>

          <text class="data-cell data-cell--time">上报时间</text>
        </view>

        <view v-if="loading" class="loading-mask">加载中...</view>
        <view v-else-if="deviceList.length === 0" class="table-state">暂无工单数据</view>

        <view
            v-for="(record, index) in deviceList"
            :key="record.id"
            class="data-row"
            :class="{ 'data-row--active': selectedId === record.id }"
            @click="selectRow(record)"
        >

          <!-- 序号 -->
          <text class="data-cell data-cell--index">
            {{ (pagination.current - 1) * pagination.size + index + 1 }}
          </text>

          <!-- 设备ID -->
          <text class="data-cell data-cell--device">
            {{ record.deviceId ?? '-' }}
          </text>

          <!-- 设备编号 -->
          <text class="data-cell data-cell--device">
            {{ record.deviceNumber || '-' }}
          </text>

          <!-- 固件版本 -->
          <text class="data-cell data-cell--device">
            {{ record.firmwareVersion || '-' }}
          </text>

          <!-- 硬件版本 -->
          <text class="data-cell data-cell--device">
            {{ record.hardwareVersion || '-' }}
          </text>

          <!-- 工作模式 -->
          <text class="data-cell data-cell--status">
            {{ record.workMode ?? '-' }}
          </text>

          <!-- 电池电压 -->
          <text class="data-cell data-cell--number">
            {{ record.batteryVoltage || '-' }}
          </text>

          <!-- 设备温度 -->
          <text class="data-cell data-cell--number">
            {{ record.deviceTemperature || '-' }}
          </text>

          <!-- 信号强度 -->
          <text class="data-cell data-cell--number">
            {{ record.signalIntensity || '-' }}
          </text>

          <!-- 信号质量 -->
          <text class="data-cell data-cell--number">
            {{ record.signalQuality || '-' }}
          </text>

          <!-- 坐标位置 -->
          <text class="data-cell data-cell--number">
            {{ record.coordinateLocation || '-' }}
          </text>

          <!-- ESA指标 -->
          <text class="data-cell data-cell--number">
            {{ record.leakEsa ?? '-' }}
          </text>

          <!-- 漏损强度 -->
          <text class="data-cell data-cell--number">
            {{ record.leakIntensity ?? '-' }}
          </text>

          <!-- 漏损频率 -->
          <text class="data-cell data-cell--number">
            {{ record.leakFrequency ?? '-' }}
          </text>

          <!-- 渗漏状态 -->
          <text class="data-cell data-cell--status">
            {{
              record.leakStatus === 0 ? '渗漏' :
                  record.leakStatus === 1 ? '正常' :
                      record.leakStatus === 2 ? '疑似' : '-'
            }}
          </text>

          <!-- 上报时间 -->
          <text class="data-cell data-cell--time">
            {{ record.uploadTime || '-' }}
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
import { ref, watch } from 'vue';
import type {Device, DeviceStatusVO, MaintenanceRecord} from '@/services/device/types';
import type { Pagination } from '@/types/api';
import { getMaintenanceRecordPageT } from "@/services/device/maintenance.typed";
import DeviceStatusToolbar from "@/pages/device/status/components/DeviceStatusToolbar.vue";
import {getDeviceStatusUploadPageT} from "@/services/device/status.typed";


// ===== 数据 =====
const loading = ref(false);

const deviceList = ref<DeviceStatusVO[]>([]);

const pagination = ref<Pagination>({
  current: 1,
  size: 10,
  total: 0
});

let currentRequestId = 0;

const props = defineProps<{
  deviceData: Partial<Device>;
}>();

// ===== 查询条件（后端过滤）=====
const searchForm = ref({
  leakStatus: undefined as number | undefined,
  startTime: '',
  endTime: ''
});

watch(
    // 1. 直接监听具体的字段
    () => props.deviceData?.deviceNumber,
    async (newVal, oldVal) => {
      // 2. 增加判断：只有当值真正存在时才请求
      if (!newVal) return;

      // 3. 防止重复触发：如果正在加载中，且是同一个设备编号，不要重复请求
      if (loading.value && newVal === oldVal) {
        return;
      }

      // 重置分页
      pagination.value.current = 1;

      // 4. 【重要】竞态处理：记录当前请求ID
      const requestId = ++currentRequestId;

      await fetchDeviceStatuss(requestId);
    },
    { immediate: true }
);

// ===== 选中行 =====
const selectedId = ref<number | null>(null);

function selectRow(record: MaintenanceRecord) {
  selectedId.value = record.id;
}

// ===== 请求数据 =====
async function fetchDeviceStatuss(requestId?: number) {
  loading.value = true;

  try {
    const res = await getDeviceStatusUploadPageT({
      pageNum: pagination.value.current,
      pageSize: pagination.value.size,
      deviceNumber: props.deviceData.deviceNumber || undefined,
      leakStatus: searchForm.value.leakStatus,
      startTime: searchForm.value.startTime || undefined,
      endTime: searchForm.value.endTime || undefined,
    });

    // 如果在 await 期间触发了新的 watch，requestId 会变大，当前的响应应该被丢弃
    if (requestId && requestId !== currentRequestId) {
      return;
    }

    const pageData = res.data;

    deviceList.value = pageData?.records ?? [];

    pagination.value.total = pageData?.total ?? 0;
    pagination.value.current = pageData?.current ?? 1;
    pagination.value.size = pageData?.size ?? 10;

  } finally {
    loading.value = false;
  }
}

// ===== 分页 =====
function changePage(step: number) {
  const maxPage = Math.ceil(pagination.value.total / pagination.value.size);

  const next = pagination.value.current + step;

  if (next < 1 || next > maxPage) return;

  pagination.value.current = next;
  fetchDeviceStatuss();
}

// ===== 查询触发（建议你按钮调用）=====
function handleSearch() {
  pagination.value.current = 1;
  fetchDeviceStatuss();
}
</script>
<style scoped lang="scss">


.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  z-index: 100;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(255, 255, 255, 0.6);

  color: #31506d;
  font-size: 14px;

  backdrop-filter: blur(1px);
}

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