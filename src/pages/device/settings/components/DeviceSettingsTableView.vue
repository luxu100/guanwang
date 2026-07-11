<template>
  <view class="data-table-container">
    <view class="table-head">
      <text>{{ t('deviceSetting.settingTable.title') }}</text>
      <text class="table-head__meta">  {{ t('common.pagination.totalRecords', { total: pagination.total }) }}</text>
    </view>

    <scroll-view class="table-scroll" scroll-x scroll-y>
      <view class="data-table">
        <view class="data-row data-row--header">
          <text class="data-cell data-cell--index">{{ t('deviceSetting.settingTable.index') }}</text>
          <text class="data-cell data-cell--device">{{ t('deviceSetting.settingTable.deviceNumber') }}</text>
          <text class="data-cell data-cell--status">{{ t('deviceSetting.fields.enabledControl') }}</text>
          <text class="data-cell data-cell--status">{{ t('deviceSetting.fields.inspectionControl') }}</text>
          <text class="data-cell data-cell--status data-cell--workMode">{{ t('deviceSetting.fields.workMode') }}</text>
          <text class="data-cell data-cell--number">{{ t('deviceSetting.fields.measureLength') }}</text>
          <text class="data-cell data-cell--status">{{ t('deviceSetting.fields.gainMode') }}</text>
          <text class="data-cell data-cell--number">{{ t('deviceSetting.fields.gainValue') }}</text>
          <text class="data-cell data-cell--number">{{ t('deviceSetting.fields.leakThreshold') }}</text>
          <text class="data-cell data-cell--number">{{ t('deviceSetting.fields.reportInterval') }}</text>
          <text class="data-cell data-cell--time">{{ t('deviceSetting.fields.orderTime') }}</text>
        </view>

        <view v-if="loading" class="loading-mask">{{ t('common.table.loading') }}</view>
        <view v-else-if="filteredDeviceSettings.length === 0" class="table-state">{{ t('common.table.empty') }}</view>

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

          <!-- 启用控制 -->
          <text class="data-cell data-cell--status">
            <text
                class="status-tag"
                :class="{
                  'status-tag--success': deviceSetting.enabledControl === true,
                  'status-tag--danger': deviceSetting.enabledControl === false
                }"
            >
              {{
                deviceSetting.enabledControl === true
                    ? t('deviceSetting.settingTable.enabled')
                    : deviceSetting.enabledControl === false
                        ? t('deviceSetting.settingTable.disabled')
                        : '-'
              }}
            </text>
          </text>

          <!-- 巡检控制 -->
          <text class="data-cell data-cell--status">
            <text
                class="status-tag"
                :class="{
                  'status-tag--cyan': deviceSetting.inspectionControl === true,
                  'status-tag--default': deviceSetting.inspectionControl === false
                }"
            >
              {{
                deviceSetting.inspectionControl === true
                    ? t('deviceSetting.settingTable.enabled')
                    : deviceSetting.inspectionControl === false
                        ? t('deviceSetting.settingTable.disabled')
                        : '-'
              }}
            </text>
          </text>

          <!-- 工作模式 -->
          <text class="data-cell data-cell--status data-cell--workMode">
            <text
                class="status-tag"
                :class="getWorkModeClass(deviceSetting.workMode)"
            >
              {{ workModeMap[deviceSetting.workMode ?? -1] || '-' }}
            </text>
          </text>

          <text class="data-cell data-cell--number">{{ deviceSetting.onceMeasureLength ?? '-' }}</text>

          <!-- 增益模式 -->
          <text class="data-cell data-cell--status">
            <text
                class="status-tag"
                :class="getGainModeClass(deviceSetting.measureGainMode)"
            >
              {{ gainModeMap[deviceSetting.measureGainMode ?? -1] || '-' }}
            </text>
          </text>

          <text class="data-cell data-cell--number">{{ deviceSetting.gainValue ?? '-' }}</text>
          <text class="data-cell data-cell--number">{{ deviceSetting.leakThreshold ?? '-' }}</text>
          <text class="data-cell data-cell--number">{{ deviceSetting.reportInterval ?? '-' }}</text>
          <text class="data-cell data-cell--time">{{ formatDate(deviceSetting.orderTime) }}</text>
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
</template>
<script setup lang="ts">
import {ref, computed} from 'vue';
import type {DeviceSetting} from '@/services/device/types';
import type {Pagination} from "@/types/api";
import XPaginationBar from "@/pages/device/components/x/XPaginationBar.vue";

import {createScopedT} from "@/i18n";
import {formatDate} from "../../../../utils/time";
const t = createScopedT("devicePage");

const props = defineProps<{
  deviceSettings: DeviceSetting[];
  pagination: Pagination;
}>();

const loading = ref(false);

const workModeMap = computed<Record<number, string>>(() => ({
  0: t('deviceSetting.addSchema.option.workMode.0'),
  1: t('deviceSetting.addSchema.option.workMode.1'),
  2: t('deviceSetting.addSchema.option.workMode.2'),
  3: t('deviceSetting.addSchema.option.workMode.3'),
}));

const gainModeMap = computed<Record<number, string>>(() => ({
  0: t('deviceSetting.addSchema.option.gainMode.0'),
  1: t('deviceSetting.addSchema.option.gainMode.1'),
}));

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

// 过滤
const filteredDeviceSettings = computed(() => {
  if (!searchKeyword.value) return props.deviceSettings;

  const keyword = searchKeyword.value.toLowerCase();

  return props.deviceSettings.filter(d =>
      d.deviceNumber?.toLowerCase().includes(keyword) ?? false
  );
});

function getGainModeClass(mode?: number | null) {

  const map: Record<number, string> = {
    0: 'status-tag--primary', // 自动
    1: 'status-tag--warning', // 手动
  };

  return map[mode ?? -1] || 'status-tag--default';
}

function getWorkModeClass(mode?: number | null) {

  const map: Record<number, string> = {
    0: 'status-tag--default', // 空闲
    1: 'status-tag--primary', // 网络模式
    2: 'status-tag--success',  // 本地模式
    3: 'status-tag--cyan',     // 巡检模式
  };

  return map[mode ?? -1] || 'status-tag--default';
}
</script>

<style scoped lang="scss">
@import "@/pages/device/components/x/status.css";
@import "@/pages/device/components/x/table-cell.css";
@import "@/pages/device/components/x/table.css";
@import "@/pages/device/components/x/table-row.css";
.data-cell--workMode{
  width: 180px;
}
</style>
