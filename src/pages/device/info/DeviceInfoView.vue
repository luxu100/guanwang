<template>
  <view class="device-page">

    <!-- 顶部搜索栏 -->
    <DeviceToolbar
        v-model="searchForm"
        :product-options="productOptions"
        :enable-state-options="enableStateOptions"
        :install-state-options="installStateOptions"
        :online-status-options="onlineStatusOptions"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="fetchDevices"
        @create="handleCreate"
    />

    <!-- 下方主内容 -->
    <view class="worksheet-layout">

      <!-- 左侧设备列表 -->
      <view class="table-panel">
        <DeviceTableView
            :devices="deviceList"
            @create="handleCreate"
            @view="handleView"
            @edit="handleEdit"
            @delete="handleDelete"
        />
      </view>

      <!-- 右侧设备详情 -->
      <view class="detail-panel">

        <view
            v-if="!currentDevice.id"
            class="detail-empty"
        >
          请选择左侧设备查看详情
        </view>

        <DeviceDetailPanel
            v-else
            :visible="true"
            :device-data="currentDevice"
            @edit="handleEdit"
        />

      </view>

    </view>

  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

import type { Device } from "@/services/device/types";
import { getDeviceListT } from "@/services/device/info.typed";

import DeviceToolbar from "../components/DeviceToolbar.vue";
import DeviceTableView from "../components/DeviceTableView.vue";
import DeviceDetailPanel from "../components/DeviceDetailPanel.vue";

type SelectOption = {
  label: string;
  value: string | number;
};
interface DeviceSearchForm {
  deviceNumber: string;
  productId: string | number;

  nbNumber: string;
  deviceImei: string;

  enableState: string | number;
  installState: string | number;
  onlineStatus: string | number;

  startTime: string;
  endTime: string;
}

const deviceList = ref<Device[]>([]);
const currentDevice = ref<Partial<Device>>({});

/**
 * 搜索条件
 */
const searchForm = ref<DeviceSearchForm>({
  deviceNumber: "",
  productId: "",

  nbNumber: "",
  deviceImei: "",

  enableState: "",
  installState: "",
  onlineStatus: "",

  startTime: "",
  endTime: "",
});

/**
 * 产品列表
 */
const productOptions = ref<SelectOption[]>([
  {
    label: "全部产品",
    value: "",
  },
]);

/**
 * 启用状态
 */
const enableStateOptions: SelectOption[] = [
  {
    label: "全部",
    value: "",
  },
  {
    label: "启用",
    value: 1,
  },
  {
    label: "禁用",
    value: 0,
  },
];

/**
 * 安装状态
 */
const installStateOptions: SelectOption[] = [
  {
    label: "全部",
    value: "",
  },
  {
    label: "已安装",
    value: 1,
  },
  {
    label: "未安装",
    value: 0,
  },
];

/**
 * 在线状态
 */
const onlineStatusOptions: SelectOption[] = [
  {
    label: "全部",
    value: "",
  },
  {
    label: "在线",
    value: 1,
  },
  {
    label: "离线",
    value: 0,
  },
];

async function fetchDevices() {
  try {
    console.log("当前搜索条件：", searchForm.value);

    const res = await getDeviceListT();

    deviceList.value = res.data ?? [];

    if (deviceList.value.length > 0) {
      currentDevice.value = deviceList.value[0];
    } else {
      currentDevice.value = {};
    }
  } catch (error) {
    console.error("获取设备列表失败:", error);
  }
}

function handleSearch() {
  fetchDevices();
}

function handleReset() {
  searchForm.value = {
    deviceNumber: "",
    productId: "",

    nbNumber: "",
    deviceImei: "",

    enableState: "",
    installState: "",
    onlineStatus: "",

    startTime: "",
    endTime: "",
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