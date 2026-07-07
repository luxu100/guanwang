<template>
  <view class="worksheet-table-panel">
    <view class="table-head">
      <text>设备参数记录</text>
      <text class="table-head__meta">共 {{ pagination.total }} 条</text>
    </view>

    <scroll-view class="table-scroll" scroll-x scroll-y>
      <view class="data-table">
        <view class="data-row data-row--header">
          <text class="data-cell data-cell--index">序号</text>
          <text class="data-cell data-cell--device">设备编号</text>
          <text class="data-cell data-cell--status">启用控制</text>
          <text class="data-cell data-cell--status">巡检控制</text>
          <text class="data-cell data-cell--status">工作模式</text>
          <text class="data-cell data-cell--number">测量长度</text>
          <text class="data-cell data-cell--status">增益模式</text>
          <text class="data-cell data-cell--number">增益值</text>
          <text class="data-cell data-cell--number">泄漏阈值</text>
          <text class="data-cell data-cell--number">上报间隔</text>
          <text class="data-cell data-cell--time">指令时间</text>
        </view>

        <view v-if="loading" class="table-state">加载中...</view>
        <view v-else-if="filteredDeviceSettings.length === 0" class="table-state">暂无工单数据</view>

        <view
            v-for="(deviceSetting, index) in filteredDeviceSettings"
            :key="deviceSetting.id"
            class="data-row"
            :class="{ 'data-row--active': selectedId === deviceSetting.id }"
            @click="selectRow(deviceSetting)"
        >

          <text class="data-cell data-cell--index">
            {{ (pagination.current - 1) * pagination.size + index + 1 }}
          </text>

          <text class="data-cell data-cell--device">{{ deviceSetting.deviceNumber }}</text>
          <text class="data-cell data-cell--status"
                :class="{
                'is-enabled': deviceSetting.enabledControl === true,
                'is-disabled': deviceSetting.enabledControl === false
              }"
          >
            {{
              deviceSetting.enabledControl === true
                  ? '启用'
                  : deviceSetting.enabledControl === false
                      ? '停用'
                      : '-'
            }}
          </text>

          <text
              class="data-cell data-cell--status"
              :class="{
                'is-inspection-enabled': deviceSetting.inspectionControl === true,
                'is-inspection-disabled': deviceSetting.inspectionControl === false
              }"
          >
            {{
              deviceSetting.inspectionControl === true
                  ? '启用'
                  : deviceSetting.inspectionControl === false
                      ? '停用'
                      : '-'
            }}
          </text>

          <text
              class="data-cell data-cell--status"
              :class="getWorkModeClass(deviceSetting.workMode)"
          >
            {{ workModeMap[deviceSetting.workMode ?? -1] || '-' }}
          </text>

          <text class="data-cell data-cell--number">
            {{ deviceSetting.onceMeasureLength ?? '-' }}
          </text>

          <text
              class="data-cell data-cell--status"
              :class="getGainModeClass(deviceSetting.measureGainMode)"
          >
            {{ measureGainModeMap[deviceSetting.measureGainMode ?? -1] || '-' }}
          </text>

          <text class="data-cell data-cell--number">
            {{ deviceSetting.gainValue ?? '-' }}
          </text>

          <text class="data-cell data-cell--number">
            {{ deviceSetting.leakThreshold ?? '-' }}
          </text>

          <text class="data-cell data-cell--number">
            {{ deviceSetting.reportInterval ?? '-' }}
          </text>

          <text class="data-cell data-cell--time">
            {{ formatDate(deviceSetting.orderTime) }}
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
</template>
<script setup lang="ts">
import {ref, computed, reactive} from 'vue';
import type {Device, DeviceSetting} from '@/services/device/types';
import type {Pagination} from "@/types/api";
import XMapPopup from "@/pages/device/components/x/XMapPopup.vue";
import XPaginationBar from "@/pages/device/components/x/XPaginationBar.vue";

const props = defineProps<{
  deviceSettings: DeviceSetting[];
  pagination: Pagination;
}>();

const loading = ref(false);

const workModeMap: Record<number, string> = {
  0: '待启用',
  1: '网络模式',
  2: '现场模式',
  3: '网络巡检模式',
};

const measureGainModeMap: Record<number, string> = {
  0: '自动',
  1: '手动',
};

const emit = defineEmits<{
  (e: 'view', deviceSetting: DeviceSetting): void;
  (e: 'select', deviceSetting: DeviceSetting): void;
  (e: 'page-change', page: number): void;
  (e: 'page-size-change', size: number): void;
}>();

const searchKeyword = ref('');
const selectedId = ref<number | null>(null);

// ✅ 点击行：选中 + 查看
function selectRow(deviceSetting: DeviceSetting) {
  selectedId.value = deviceSetting.id ?? null;
  emit('view', deviceSetting);
  emit('select', deviceSetting);
}

function formatDate(
    dateStr: string | number | Date | undefined | null,
    format: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
}

// 过滤
const filteredDeviceSettings = computed(() => {
  if (!searchKeyword.value) return props.deviceSettings;

  const keyword = searchKeyword.value.toLowerCase();

  return props.deviceSettings.filter(d =>
      d.deviceNumber?.toLowerCase().includes(keyword) ?? false
  );
});

function getWorkModeClass(mode?: number | null) {
  switch (mode) {
    case 0:
      return 'mode-idle';
    case 1:
      return 'mode-network';
    case 2:
      return 'mode-local';
    case 3:
      return 'mode-inspection';
    default:
      return '';
  }
}

function getGainModeClass(mode?: number | null) {

  switch(mode){
    case 0:
      return 'gain-auto';
    case 1:
      return 'gain-manual';
    default:
      return '';
  }
}

</script>

<style scoped lang="scss">
.data-cell--coord {
  min-width: 140px;
  color: #172033;
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
}
.data-cell--link {
  color: #1677ff;
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
}

.data-cell--link:hover {
  color: #0d82ee;
  text-decoration: underline;
}

.data-cell--link:active {
  opacity: 0.7;
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

.is-enabled{
  color: #059669;
}

.is-inspection-enabled {
  color:#0891b2;
}

.is-inspection-disabled {
  color:#64748b;
}

/* ===========================
   工作模式
=========================== */
/* 待启用 */
.mode-idle {
  color:#94a3b8;
}

/* 网络模式 */
.mode-network {
  color:#2563eb;
}

/* 现场模式 */
.mode-local {
  color:#ea580c;
}

/* 网络巡检模式 */
.mode-inspection {
  color:#7c3aed;
}

/* ===========================
   增益模式
=========================== *
/* 自动 */

.gain-auto {
  color:#0284c7;
}

/* 手动 */
.gain-manual {
  color:#9333ea;
}
</style>
