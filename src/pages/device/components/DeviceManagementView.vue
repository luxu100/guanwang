<!--
注意：这个页面作为切换页面在AppShell中使用DeviceManagementView组件，传入不同的mode参数来切换不同的页面内容。
-->
<!--
代码在AppShell的shellContentDefinitions中：
"/pages/device/info/info": { component: DeviceManagementView, props: { mode: "info" } },
"/pages/device/maintenance/maintenance": { component: DeviceManagementView, props: { mode: "maintenance" } },
"/pages/device/status/status": { component: DeviceManagementView, props: { mode: "status" } },
-->

<template>
  <view class="device-page">

    <!-- 顶部搜索栏（config驱动） -->
    <DeviceToolbar
        v-model="searchForm"
        :fields="toolbarConfig"
        :product-options="productOptions"
        :enable-state-options="enableStateOptions"
        :install-state-options="installStateOptions"
        :online-status-options="onlineStatusOptions"
        :leak-status-options="leakStatusOptions"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="fetchDevices"
    />

    <!-- 主体 -->
    <view class="worksheet-layout">

      <!-- 左侧 table（固定不变） -->
      <view class="table-panel">
        <DeviceTableView
            :devices="deviceList"
            @create="handleCreate"
            @view="handleView"
            @edit="handleEdit"
            @delete="handleDelete"
        />
      </view>

      <!-- 右侧 panel（随mode变化） -->
      <view class="detail-panel">

        <view
            v-if="!currentDevice.id"
            class="detail-empty"
        >
          请选择左侧设备查看详情
        </view>

        <component
            v-else
            :is="CurrentPanel"
            :device-data="currentDevice"
            @edit="handleEdit"
            :visible=true
        />

      </view>

    </view>

  </view>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";

import type { Device } from "@/services/device/types";
import { getDeviceListT } from "@/services/device/info.typed";

import DeviceInfoPanel from "./DeviceInfoPanel.vue";
import DeviceMaintenancePanel from "./DeviceMaintenancePanel.vue";
import DeviceStatusPanel from "./DeviceStatusPanel.vue";

import DeviceToolbar from "./DeviceToolbar.vue";
import DeviceTableView from "./DeviceTableView.vue";

/**
 * =========================
 * mode
 * =========================
 */
const props = defineProps<{
  mode: "info" | "maintenance" | "status";
}>();

/**
 * =========================
 * table（固定）
 * =========================
 */
const deviceList = ref<Device[]>([]);
const currentDevice = ref<Partial<Device>>({});

/**
 * =========================
 * module config（核心）
 * =========================
 */
const deviceModuleConfig = {
  info: {
    panel: DeviceInfoPanel,

    searchForm: {
      deviceNumber: "",
      productId: "",
      installAddress: "",
      enableState: "",
      installState: "",
      onlineStatus: "",
      leakStatus: "",
      startTime: "",
      endTime: "",
    },

    toolbar: [
      { key: "deviceNumber", label: "设备编号", type: "input" },
      { key: "productId", label: "产品型号", type: "select", dict: "product" },
      { key: "installAddress", label: "安装位置", type: "input" },
      { key: "onlineStatus", label: "在线状态", type: "select", dict: "online" },
      { key: "installState", label: "安装状态", type: "select", dict: "install" },
      { key: "enableState", label: "启用状态", type: "select", dict: "enable" },
      { key: "leakStatus", label: "渗漏状态", type: "select", dict: "leak" },
    ],
  },

  maintenance: {
    panel: DeviceMaintenancePanel,

    searchForm: {
      deviceNumber: "",
      installState: "",
      startTime: "",
      endTime: "",
    },

    toolbar: [
      { key: "deviceNumber", label: "设备编号", type: "input" },
      { key: "installState", label: "安装状态", type: "select", dict: "install" },
      { key: "startTime", label: "开始时间", type: "date" },
      { key: "endTime", label: "结束时间", type: "date" },
    ],
  },

  status: {
    panel: DeviceStatusPanel,

    searchForm: {
      deviceNumber: "",
      onlineStatus: "",
      leakStatus: "",
      startTime: "",
      endTime: "",
    },

    toolbar: [
      { key: "deviceNumber", label: "设备编号", type: "input" },
      { key: "onlineStatus", label: "在线状态", type: "select", dict: "online" },
      { key: "leakStatus", label: "渗漏状态", type: "select", dict: "leak" },
    ],
  },
} as const;

/**
 * 当前模块
 */
const currentModule = computed(() => {
  return deviceModuleConfig[props.mode];
});

/**
 * panel
 */
const CurrentPanel = computed(() => currentModule.value.panel);

/**
 * toolbar config（核心）
 */
const toolbarConfig = computed(() => currentModule.value.toolbar);

/**
 * search form（随 mode 切换）
 */
const searchForm = ref<any>({
  ...currentModule.value.searchForm,
});

/**
 * mode变化重置
 */
watch(
    () => props.mode,
    () => {
      searchForm.value = {
        ...currentModule.value.searchForm,
      };

      fetchDevices();
    },
    { immediate: true }
);

/**
 * =========================
 * options（字典）
 * =========================
 */
type SelectOption = {
  label: string;
  value: string | number;
};

const productOptions = ref<SelectOption[]>([
  { label: "全部产品", value: "" },
]);

const enableStateOptions: SelectOption[] = [
  { label: "全部", value: "" },
  { label: "启用", value: 1 },
  { label: "禁用", value: 0 },
];

const installStateOptions: SelectOption[] = [
  { label: "全部", value: "" },
  { label: "已安装", value: 1 },
  { label: "未安装", value: 0 },
];

const onlineStatusOptions: SelectOption[] = [
  { label: "全部", value: "" },
  { label: "在线", value: 1 },
  { label: "离线", value: 0 },
];

const leakStatusOptions = [
  { label: "全部", value: "" },
  { label: "渗漏", value: 0 },
  { label: "正常", value: 1 },
  { label: "疑似", value: 2 },
  { label: "未知", value: 3 },
];

/**
 * =========================
 * api
 * =========================
 */
async function fetchDevices() {
  const res = await getDeviceListT();
  deviceList.value = res.data ?? [];

  currentDevice.value = deviceList.value[0] || {};
}

/**
 * =========================
 * actions
 * =========================
 */
function handleSearch() {
  fetchDevices();
}

function handleReset() {
  searchForm.value = {
    ...currentModule.value.searchForm,
  };

  fetchDevices();
}

function handleView(device: Device) {
  currentDevice.value = device;
}

function handleCreate() {
  currentDevice.value = {};
}

function handleEdit(device: Partial<Device>) {
  currentDevice.value = device;
}

function handleDelete(device: Device) {
  uni.showModal({
    title: "提示",
    content: `确定删除设备 ${device.deviceNumber} 吗？`,
    success(res) {
      if (res.confirm) {
        console.log("删除设备:", device.id);
      }
    },
  });
}

onMounted(() => {
  fetchDevices();
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
  grid-template-columns: minmax(0,1fr) 380px;

  gap: 14px;
  margin-top: 14px;

  min-height: 0;
  overflow: hidden;
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
</style>