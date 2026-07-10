<template>
  <view class="worksheet-table-panel">
    <view class="table-head">
      <text>{{ t('valve.table.title') }}</text>
      <text class="table-head__meta">  {{ t('common.pagination.totalRecords', { total: pagination.total }) }}</text>
    </view>

    <scroll-view class="table-scroll" scroll-x scroll-y>
      <view class="data-table">
        <view class="data-row data-row--header">
          <text class="data-cell data-cell--index">{{ t('valve.table.index') }}</text>
          <text class="data-cell data-cell--device">{{ t('valve.table.pipelineName') }}</text>
          <text class="data-cell data-cell--device">{{ t('valve.table.valveNumber') }}</text>
          <text class="data-cell data-cell--device">{{ t('valve.table.valveName') }}</text>
          <text class="data-cell data-cell--device">{{ t('valve.table.coordinatePosition') }}</text>
          <text class="data-cell data-cell--status">{{ t('valve.table.branchCompany') }}</text>
          <text class="data-cell data-cell--status">{{ t('valve.table.region') }}</text>
          <text class="data-cell data-cell--number">{{ t('valve.table.tubeBore') }}</text>
          <text class="data-cell data-cell--status">{{ t('valve.table.tubeMaterial') }}</text>
          <text class="data-cell data-cell--coord">{{ t('valve.table.coordinate') }}</text>
          <text class="data-cell data-cell--time">{{ t('valve.table.createdAt') }}</text>
        </view>

        <view v-if="loading" class="table-state">{{ t('valve.table.loading') }}</view>
        <view v-else-if="filteredValves.length === 0" class="table-state">{{ t('valve.table.noData') }}</view>

        <view
            v-for="(valve, index) in filteredValves"
            :key="valve.id"
            class="data-row"
            :class="{ 'data-row--active': selectedId === valve.id }"
            @click="selectRow(valve)"
        >
          <text class="data-cell data-cell--index">{{ (pagination.current - 1) * pagination.size + index + 1 }}</text>
          <text class="data-cell data-cell--device">{{ valve.pipelineName || '-' }}</text>
          <text class="data-cell data-cell--device">{{ valve.valveNumber || '-' }}</text>
          <text class="data-cell data-cell--device">{{ valve.valveName || '-' }}</text>
          <text class="data-cell data-cell--device">{{ valve.coordinatePosition || '-' }}</text>
          <text class="data-cell data-cell--status">{{ valve.branchCompany || '-' }}</text>
          <text class="data-cell data-cell--status">{{ valve.region || '-' }}</text>
          <text class="data-cell data-cell--number">{{ valve.tubeBore || '-' }}</text>
          <text class="data-cell data-cell--status">{{ valve.tubeMaterial || '-' }}</text>
          <text
              class="data-cell data-cell--coord data-cell--link"
              @click.stop="handleCoordClick(valve.xCoordinate, valve.yCoordinate)"          >
            {{ valve.xCoordinate && valve.yCoordinate
              ? `${valve.xCoordinate}, ${valve.yCoordinate}`
              : '-' }}
          </text>

          <text class="data-cell data-cell--time">{{ formatDate(valve.createdAt) }}</text>
        </view>
      </view>
    </scroll-view>

    <XPaginationBar
        :current="pagination.current"
        :size="pagination.size"
        :total="pagination.total"
        @change-page="(page: number) => emit('page-change', page)"
        @change-size="(size: number) => emit('page-size-change', size)"
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
import {ref, computed} from 'vue';
import type {Valve} from '@/services/device/types';
import type {Pagination} from "@/types/api";
import XPaginationBar from "@/pages/device/components/x/XPaginationBar.vue";

import {createScopedT} from "@/i18n";
import XMapPopup from "@/pages/device/components/x/XMapPopup.vue";
import {formatDate} from "../../../../utils/time";
const t = createScopedT("devicePage");

const props = defineProps<{
  valves: Valve[];
  pagination: Pagination;
}>();

const loading = ref(false);

const emit = defineEmits<{
  (e: 'view', valve: Valve): void;
  (e: 'select', valve: Valve): void;
  (e: 'page-change', page: number): void;
  (e: 'page-size-change', size: number): void;
}>();

const searchKeyword = ref('');
const selectedId = ref<number | null>(null);

// ✅ 点击行：选中 + 查看
function selectRow(valve: Valve) {
  selectedId.value = valve.id ?? null;
  emit('view', valve);
  emit('select', valve);
}

// 过滤
const filteredValves = computed(() => {
  if (!searchKeyword.value) return props.valves;

  const keyword = searchKeyword.value.toLowerCase();

  return props.valves.filter(d =>
      d.valveNumber?.toLowerCase().includes(keyword) ?? false
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
