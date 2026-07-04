<template>
  <view class="worksheet-table-panel">
    <DeviceStatusToolbar
        v-model="searchForm"
        @search="handleSearch"
        @reset="handleSearch"
        @refresh="fetchDeviceStatuss"
        :visible="isToolbarVisible"
    />

    <XFloatingCollapseHandle v-if="isFloatingVisible"
        v-model="isToolbarVisible"
    />

    <view class="table-head">
      <text>设备状态详情</text>
      <text class="table-head__meta">共 {{ pagination.total }} 条</text>
    </view>

    <scroll-view class="table-scroll" scroll-x scroll-y>
      <view class="data-table">
        <view class="data-row data-row--header">

          <text class="data-cell data-cell--index">序号</text>
<!--          <text class="data-cell data-cell&#45;&#45;device">设备ID</text>-->
          <text class="data-cell data-cell--device">设备编号</text>
          <text class="data-cell data-cell--status">渗漏状态</text>

          <text class="data-cell data-cell--device">固件版本</text>
          <text class="data-cell data-cell--device">硬件版本</text>

          <text class="data-cell data-cell--status">工作模式</text>

          <text class="data-cell data-cell--text">电池电压</text>
          <text class="data-cell data-cell--text">设备温度</text>

          <text class="data-cell data-cell--text">信号强度</text>
          <text class="data-cell data-cell--text">信号质量</text>

          <text class="data-cell data-cell--text">坐标位置</text>

          <text class="data-cell data-cell--text">ESA指标</text>
          <text class="data-cell data-cell--text">漏损强度</text>
          <text class="data-cell data-cell--text">漏损频率</text>

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
<!--          <text class="data-cell data-cell&#45;&#45;device">-->
<!--            {{ record.deviceId ?? '-' }}-->
<!--          </text>-->

          <!-- 设备编号 -->
          <text class="data-cell data-cell--device">
            {{ record.deviceNumber || '-' }}
          </text>

          <!-- 渗漏状态 -->
          <text
              class="data-cell data-cell--status"
              :class="getStatusClass('leak', record.leakStatus)"
          >
            {{
              record.leakStatus === 0 ? '渗漏' :
                  record.leakStatus === 1 ? '正常' :
                      record.leakStatus === 2 ? '疑似' : '-'
            }}
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
          <text class="data-cell data-cell--text">
            {{ record.batteryVoltage || '-' }}
          </text>

          <!-- 设备温度 -->
          <text class="data-cell data-cell--text">
            {{ record.deviceTemperature || '-' }}
          </text>

          <!-- 信号强度 -->
          <text class="data-cell data-cell--text">
            {{ record.signalIntensity || '-' }}
          </text>

          <!-- 信号质量 -->
          <text class="data-cell data-cell--text">
            {{ record.signalQuality || '-' }}
          </text>

          <!-- 坐标位置 -->
          <text class="data-cell data-cell--text">
            {{ record.coordinateLocation || '-' }}
          </text>

          <!-- ESA指标 -->
          <text class="data-cell data-cell--text">
            {{ record.leakEsa ?? '-' }}
          </text>

          <!-- 漏损强度 -->
          <text class="data-cell data-cell--text">
            {{ record.leakIntensity ?? '-' }}
          </text>

          <!-- 漏损频率 -->
          <text class="data-cell data-cell--text">
            {{ record.leakFrequency ?? '-' }}
          </text>

          <!-- 上报时间 -->
          <text class="data-cell data-cell--time">
            {{ record.uploadTime || '-' }}
          </text>

        </view>
      </view>
    </scroll-view>

    <XPaginationBar
        :current="pagination.current"
        :size="pagination.size"
        :total="pagination.total"
        @change-page="handlePageChange"
        @change-size="handlePageSizeChange"
    />
  </view>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import type {Device, DeviceStatusVO, MaintenanceRecord} from '@/services/device/types';
import type { Pagination } from '@/types/api';
import DeviceStatusToolbar from "@/pages/device/status/components/DeviceStatusToolbar.vue";
import {getDeviceStatusUploadPageT} from "@/services/device/status.typed";
import XFloatingCollapseHandle from "@/pages/device/components/x/XFloatingCollapseHandle.vue";
import MaintenanceRecordToolbar from "@/pages/device/maintenance/components/MaintenanceRecordToolbar.vue";
import XPaginationBar from "@/pages/device/components/x/XPaginationBar.vue";

const isToolbarVisible = ref(true);
const isFloatingVisible = ref(false);

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
  leakStatus: null as number | null,
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
function handlePageChange(page:number){
  pagination.value.current = page;
  fetchDeviceStatuss();
}
function handlePageSizeChange(pageSize:number){
  pagination.value.size = pageSize;
  fetchDeviceStatuss();
}

// ===== 查询触发（建议你按钮调用）=====
function handleSearch() {
  pagination.value.current = 1;
  fetchDeviceStatuss();
}

const getStatusClass = (type: string, value: number) => {
  // 如果是渗漏状态 (leak)
  if (type === 'leak') {
    switch (value) {
      case 0: return 'is-leak';      // 渗漏 -> 红色
      case 1: return 'is-normal';    // 正常 -> 绿色
      case 2: return 'is-warning';   // 疑似 -> 橙色
      case 3: return 'is-unknown';   // 未知 -> 灰色
      default: return 'is-unknown';
    }
  }
  // 如果以后有其他类型的状态，可以在这里添加逻辑
  return '';
};
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
  width:50px;
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

/* 设备编号：通常由字母和数字组成，使用等宽字体更清晰，颜色适中 */
.data-cell--device {
  color: #1e293b;
  font-family: "DIN Alternate", "Arial", sans-serif;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 设备类型：作为普通文本标签，颜色略深以区分状态 */
.data-cell--type {
  color: #334155;
  font-weight: 600;
}

/* 状态类（启用/安装/渗漏/在线）：
   由于状态列通常包含不同状态，这里提供基础样式。
   实际开发中建议配合 JS 动态添加如 .is-online / .is-leak 等修饰类 */
.data-cell--status {
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase; /* 如果状态是英文，大写更美观；中文可去掉 */
  letter-spacing: 0.5px;
}

/* 安装模式：普通文本，稍浅的颜色 */
.data-cell--mode {
  color: #475569;
}

/* 最后采样时间：时间数据使用等宽字体对齐，颜色偏灰 */
.data-cell--time {
  color: #64748b;
  font-family: "DIN Alternate", "Arial", sans-serif;
  font-size: 12px;
}

/* 正常/在线/启用 */
.data-cell--status.is-online,
.data-cell--status.is-enabled {
  color: #10b981; /* 绿色 */
}

/* 异常/渗漏/离线 */
.data-cell--status.is-leak,
.data-cell--status.is-offline {
  color: #ef4444; /* 红色 */
}

/* 警告/安装中 */
.data-cell--status.is-warning,
.data-cell--status.is-installing {
  color: #f59e0b; /* 橙色 */
}

/* ==========================================
   状态列增强样式 (Status Badge Styles)
   ========================================== */

/* 基础状态样式：加粗、大写、紧凑间距 */
.data-cell--status {
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.5px;
  text-transform: uppercase; /* 如果是中文，可以删掉这行 */
  position: relative;
  padding-left: 24px; /* 为左侧圆点留出空间 */
}

/* --- 通用语义化颜色 --- */
/* 成功/启用/在线/已安装 (绿色) */
.is-enabled,
.is-installed,
.is-online,
.is-normal{
  color: #059669; /* 深绿 */
}

/* 警告/流动点/疑似 (琥珀色/橙色) */
.is-mobile,
.is-warning,
  /* 渗漏状态中的 "疑似" */
[data-v-xxxxxx] .is-leak-status-2 {
  color: #92400e; /* 深橙 */
}

/* 危险/停用/离线/渗漏 (红色) */
.is-disabled,
.is-offline,
.is-leak,
  /* 渗漏状态中的 "渗漏" */
[data-v-xxxxxx] .is-leak-status-0 {
  color: #991b1b; /* 深红 */
}

/* 未知/未安装/灰色 (中性色) */
.is-not-installed,
.is-unknown,
  /* 渗漏状态中的 "未知" */
[data-v-xxxxxx] .is-leak-status-3 {
  color: #4b5563; /* 灰 */
}

/* 固定点 (蓝色) */
.is-fixed {
  color: #1e40af;
}

.data-cell--info {
  color: #334155;
  font-size: 13px;
  text-align: center;
}

// 2. 维护类型的具体颜色定义
// 请根据你的设计稿调整这些颜色值
.is-removed { color: #991b1b; } // 深红 - 拆卸
.is-installed { color: #059669; } // 深绿 - 安装
.is-warning { color: #92400e; } // 深橙 - 维护
.is-info { color: #1e40af; } // 深蓝 - 巡检

// 3. 备注列样式 (参考文档)
.data-cell--remark {
  justify-content: flex-start;
  text-align: left;
  color: #64748b;
  font-size: 12px;
  padding: 0 12px;
}
</style>