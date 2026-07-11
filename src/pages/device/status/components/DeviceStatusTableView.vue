<template>
  <DeviceStatusToolbar
      v-model="searchForm"
      @search="handleSearch"
      @reset="handleSearch"
      @refresh="fetchDeviceStatuss"
      :visible="isToolbarVisible"
  />
  <view class="data-table-container">

    <XFloatingCollapseHandle v-if="isFloatingVisible"
        v-model="isToolbarVisible"
    />

    <view class="table-head">
      <text>{{ t("device-status.statusTable.title") }}</text>
      <text class="table-head__meta">  {{ t('common.pagination.totalRecords', { total: pagination.total }) }}</text>
    </view>

    <scroll-view class="table-scroll" scroll-x scroll-y>
      <view class="data-table">
        <view class="data-row data-row--header">

          <text class="data-cell data-cell--index">{{ t("common.table.index") }}</text>
          <text class="data-cell data-cell--device">{{ t("device-status.statusTable.deviceNumber") }}</text>
          <text class="data-cell data-cell--status">{{ t("device-status.statusTable.leakStatus") }}</text>

          <text class="data-cell data-cell--device">{{ t("device-status.statusTable.firmwareVersion") }}</text>
          <text class="data-cell data-cell--device">{{ t("device-status.statusTable.hardwareVersion") }}</text>

          <text class="data-cell data-cell--status">{{ t("device-status.statusTable.workMode") }}</text>

          <text class="data-cell data-cell--text">{{ t("device-status.statusTable.batteryVoltage") }}</text>
          <text class="data-cell data-cell--text">{{ t("device-status.statusTable.deviceTemperature") }}</text>

          <text class="data-cell data-cell--text">{{ t("device-status.statusTable.signalIntensity") }}</text>
          <text class="data-cell data-cell--text">{{ t("device-status.statusTable.signalQuality") }}</text>

          <text class="data-cell data-cell--text">{{ t("device-status.statusTable.coordinateLocation") }}</text>

          <text class="data-cell data-cell--text">{{ t("device-status.statusTable.leakEsa") }}</text>
          <text class="data-cell data-cell--text">{{ t("device-status.statusTable.leakIntensity") }}</text>
          <text class="data-cell data-cell--text">{{ t("device-status.statusTable.leakFrequency") }}</text>

          <text class="data-cell data-cell--time">{{ t("device-status.statusTable.uploadTime") }}</text>
        </view>

        <view v-if="loading" class="loading-mask">{{ t('common.table.loading') }}</view>
        <view v-else-if="deviceList.length === 0" class="table-state">{{ t('common.table.empty') }}</view>

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

          <!-- 设备编号 -->
          <text class="data-cell data-cell--device">
            {{ record.deviceNumber || '-' }}
          </text>

          <!-- 渗漏状态 -->
          <text class="data-cell data-cell--status">
            <text
                class="status-tag"
                :class="getStatusClass('leak', record.leakStatus)"
            >
              {{
                record.leakStatus === 0
                    ? t("status.leak.leak")
                    : record.leakStatus === 1
                        ? t("status.leak.normal")
                        : record.leakStatus === 2
                            ? t("status.leak.suspected")
                            : record.leakStatus === 3
                                ? t("status.leak.unknown")
                                : "-"
              }}
            </text>
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
import XPaginationBar from "@/pages/device/components/x/XPaginationBar.vue";
import {createScopedT} from "@/i18n";
const t = createScopedT("devicePage");

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
  pagination.value.current = 1;
  fetchDeviceStatuss();
}

// ===== 查询触发（建议你按钮调用）=====
function handleSearch() {
  pagination.value.current = 1;
  fetchDeviceStatuss();
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
</script>
<style scoped lang="scss">
@import "@/pages/device/components/x/status.css";
@import "@/pages/device/components/x/table-cell.css";
@import "@/pages/device/components/x/table.css";
@import "@/pages/device/components/x/table-row.css";
</style>