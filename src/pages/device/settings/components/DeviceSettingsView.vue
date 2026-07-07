<template>
  <view class="device-page">

    <!-- 顶部搜索栏（config驱动） -->
    <DeviceSettingsToolbar
        v-model="searchForm"
        :fields="toolbarConfig"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="fetchSettings"
    />

    <!-- 主体 -->
    <view class="worksheet-layout"
          :class="[layoutClass, { collapsed: isDetailCollapsed }]">

      <!-- 左侧 table（固定不变） -->
      <view class="table-panel">
        <DeviceSettingsTableView
            :device-settings="deviceSettingList"
            :pagination="pagination"
            @view="handleView"
            @select="handleSelect"
            @page-change="handlePageChange"
            @page-size-change="handlePageSizeChange"
        />
      </view>

      <view class="split-handle" @click="toggleDetailPanel">
        {{ isDetailCollapsed ? '⟨' : '⟩' }}
      </view>

      <!-- 右侧 panel（随mode变化） -->
      <view class="detail-panel">

        <view
            v-if="!currentDeviceSetting?.id"
            class="detail-empty"
        >
          {{ t('deviceSetting.emptyTip') }}
        </view>

        <DeviceSettingsPanel
            v-else
            :setting-data="currentDeviceSetting"
            :visible="isDetailPanelVisible"
        />
      </view>

    </view>

  </view>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import DeviceSettingsToolbar from "@/pages/device/settings/components/DeviceSettingsToolbar.vue";
import {getDeviceSettingPageT} from "@/services/device/device-setting.typed";
import type {DeviceSetting} from "@/services/device/types";
import DeviceSettingsTableView from "@/pages/device/settings/components/DeviceSettingsTableView.vue";
import DeviceSettingsPanel from "@/pages/device/settings/components/DeviceSettingsPanel.vue";
import { createScopedT } from "@/i18n";
const t = createScopedT("devicePage");

const deviceSettingsConfig = {
  searchForm: {
    deviceNumber: "",
    startTime: "",
    endTime: "",
  },

  toolbar: [
    { key: "deviceNumber", label: t('toolbar.deviceNumber'), type: "input" },
    { key: "startTime", label: t('toolbar.startTime'), type: "date" },
    { key: "endTime", label: t('toolbar.endTime'), type: "date" }
  ]
}as const;

const currentModule = computed(() => {
  return deviceSettingsConfig;
});

const searchForm = ref<any>({
  ...currentModule.value.searchForm,
});

const toolbarConfig = computed(() => currentModule.value.toolbar);

const deviceSettingList = ref<DeviceSetting[]>([]);
const currentDeviceSetting = ref<DeviceSetting | null>(null);
const selectedDeviceSetting = ref<DeviceSetting | null>(null);
const pagination = ref({
  current: 1,
  size: 10,
  total: 0,
});
const isDetailPanelVisible = ref(true)
const isDetailCollapsed = ref(false)
const toggleDetailPanel = () => {
  isDetailCollapsed.value = !isDetailCollapsed.value
  isDetailPanelVisible.value = !isDetailPanelVisible.value
}

function handleSearch() {
  fetchSettings();
}

function handleReset() {
  searchForm.value = {
    ...currentModule.value.searchForm,
  };

  fetchSettings();
}

async function fetchSettings() {
  const res = await getDeviceSettingPageT({
    ...searchForm.value,
    pageNum: pagination.value.current,
    pageSize: pagination.value.size,
  });

  const pageData = res.data;

  deviceSettingList.value = pageData?.records ?? [];
  pagination.value.total = pageData?.total ?? 0;
  pagination.value.current = pageData?.current ?? 1;
  pagination.value.size = pageData?.size ?? 10;

  currentDeviceSetting.value = deviceSettingList.value[0] || {};
}

function handlePageChange(page:number){
  pagination.value.current = page;
  fetchSettings();
}

function handlePageSizeChange(pageSize:number){
  pagination.value.size = pageSize;
  pagination.value.current = 1;
  fetchSettings();
}

function handleView(deviceSetting: DeviceSetting) {
  currentDeviceSetting.value = deviceSetting;
}

function handleSelect(deviceSetting: DeviceSetting) {
  selectedDeviceSetting.value = deviceSetting;
}

const layoutClass = computed(() => {
    return "layout-split";
});

onMounted(() => {
  fetchSettings();
});
</script>

<style scoped lang="scss">
.device-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 0 14px 14px;
  background: #eef4f8;
}

/* 顶部工具栏与下方内容间距 */
.device-page > :first-child {
  flex-shrink: 0;
}

/* 主体区域 */
.worksheet-layout {
  flex: 1;

  display: grid;

  gap: 0px;
  margin-top: 14px;

  min-height: 0;
  overflow: hidden;
}

/* 默认：左列表 + 右详情 */
.layout-split {
  grid-template-columns: minmax(0, 1fr) 24px 400px;
}

.layout-equal {
  grid-template-columns: 1fr 24px 1fr;
}

.layout-one-two {
  grid-template-columns: 1fr 24px 2fr;
}

.table-panel,
.detail-panel {
  display: flex;
  flex-direction: column;

  min-width: 0;
  min-height: 0;

  overflow: hidden;

  background: #ffffff;

  border: 1px solid #d8e5ef;
  border-radius: 6px;

  height: 100%;

  box-shadow: 0 12px 26px rgba(35,72,104,.09);
}

.detail-panel {
  overflow-y: auto;
}

/* 空状态 */
.detail-empty {
  display: flex;
  align-items: center;
  justify-content: center;

  height: 100%;

  color: #999;
  font-size: 14px;
}

.worksheet-layout.collapsed {
  grid-template-columns: minmax(0, 1fr) 24px 0;
}

.split-handle {
  display: flex;
  align-items: center;
  justify-content: center;

  cursor: col-resize;
  user-select: none;

  background: transparent;

  position: relative;

  //color: transparent; /* 默认不显示箭头 */

  z-index: 999;
}

.split-handle:hover {
  background: rgba(64, 158, 255, 0.06);
  color: #409eff;
}

.split-handle::before {
  content: '';
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 50%;
  width: 1px;
  background: #e4e7ed;
  transform: translateX(-50%);
}

.split-handle::after {
  content: '⋮';
  font-size: 10px;
  color: #c0c4cc;
  position: relative;
}

</style>