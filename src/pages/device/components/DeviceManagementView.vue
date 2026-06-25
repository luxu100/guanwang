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
        :maintain-type-options="maintainTypeOptions"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="fetchDevices"
        @delete="handleDelete"
        @add="handleAdd"
        @edit="handleEdit"
    />

    <!-- 主体 -->
    <view class="worksheet-layout" :class="layoutClass">

      <!-- 左侧 table（固定不变） -->
      <view class="table-panel">
        <DeviceTableView
            :devices="deviceList"
            :pagination="pagination"
            @view="handleView"
            @select="handleSelect"
        />
      </view>

      <!-- 右侧 panel（随mode变化） -->
      <view class="detail-panel">

        <view
            v-if="!currentDevice?.id"
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

  <XDynamicDialog
      v-model:visible="dialogVisible"
      v-model="formData"
      :schema="addSchema"
      :title="isEditMode ? '编辑设备' : '新增设备'"
      @submit="handleSubmit"
      @cancel="dialogVisible = false"
  />
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";

import type {Device, DeviceCreateForm, MaintenanceCreateForm} from "@/services/device/types";
import {
  createDeviceT,
  deleteDeviceT,
  getDevicePageT,
  getDeviceProductListT,
  updateDeviceT
} from "@/services/device/info.typed";

import DeviceInfoPanel from "../info/components/DeviceInfoPanel.vue";
import MaintenancePanel from "../maintenance/components/MaintenancePanel.vue";
import DeviceStatusPanel from "../status/components/DeviceStatusPanel.vue";

import DeviceToolbar from "./DeviceToolbar.vue";
import DeviceTableView from "./DeviceTableView.vue";
import XDynamicDialog from "@/pages/device/components/x/XDynamicDialog.vue";
import type {FormSection} from "@/pages/device/components/x/types";
import {createMaintenanceRecordT, updateMaintenanceRecordT} from "@/services/device/maintenance.typed";
import {updateDevice} from "@/services/device/info";

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
const currentDevice = ref<Device | null>(null);
const selectedDevice = ref<Device | null>(null);
const pagination = ref({
  current: 1,
  size: 10,
  total: 0,
});
const isEditMode = ref(false);
const editingId = ref<number | null>(null);

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
      deviceType: "",
      // installAddress: "",
      enableState: "",
      // installState: "",
      onlineStatus: "",
      leakStatus: "",
      startTime: "",
      endTime: "",
    },

    toolbar: [
      { key: "deviceNumber", label: "设备编号", type: "input" },
      { key: "deviceType", label: "产品型号", type: "select", dict: "product" },
      // { key: "installAddress", label: "安装位置", type: "input" },
      { key: "onlineStatus", label: "在线状态", type: "select", dict: "online" },
      // { key: "installState", label: "安装状态", type: "select", dict: "install" },
      { key: "enableState", label: "启用状态", type: "select", dict: "enable" },
      { key: "leakStatus", label: "渗漏状态", type: "select", dict: "leak" },
    ],
  },

  maintenance: {
    panel: MaintenancePanel,

    searchForm: {
      deviceNumber: "",
      maintainType: "",
      startTime: "",
      endTime: "",
    },

    toolbar: [
      { key: "deviceNumber", label: "设备编号", type: "input" },
      { key: "maintainType", label: "维护类型", type: "select", dict: "maintain" },
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
// const toolbarConfig = computed(() => currentModule.value.toolbar);
const toolbarConfig = computed(() => deviceModuleConfig['info'].toolbar);

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
  { label: "全部型号", value: "" },
  { label: "LD18", value: "LD18" },
  { label: "LD18E-FM", value: "LD18E-FM" },
  { label: "LD18HE-FM", value: "LD18HE-FM" },
]);

const enableStateOptions: SelectOption[] = [
  { label: "全部", value: "" },
  { label: "启用", value: 1 },
  { label: "禁用", value: 0 },
];

const maintainTypeOptions: SelectOption[] = [
  { label: "全部", value: "" },
  { label: "拆", value: 0 },
  { label: "装", value: 1 },
  { label: "维护", value: 2 },
  { label: "巡检", value: 3 },
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
  const res = await getDevicePageT({
    ...searchForm.value,
    pageNum: pagination.value.current,
    pageSize: pagination.value.size,
  });

  const pageData = res.data;

  deviceList.value = pageData?.records ?? [];
  pagination.value.total = pageData?.total ?? 0;
  pagination.value.current = pageData?.current ?? 1;
  pagination.value.size = pageData?.size ?? 10;

  currentDevice.value = deviceList.value[0] || {};
}

const deviceProductOptions = ref<{ label: string; value: number }[]>([]);

async function fetchProductOptions() {
  const res = await getDeviceProductListT();
  deviceProductOptions.value = (res.data || []).map((item: any) => ({
    label: item.productName,   // 或 name，看你后端字段
    value: item.id
  }));
  console.log("deviceProductOptions",deviceProductOptions);
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

function handleSelect(device: Device) {
  selectedDevice.value = device;
}

const dialogVisible = ref(false);
const formData = ref<DeviceCreateForm>({})
const addSchema = computed<FormSection[]>(() => [
  {
    title: "基础信息",
    fields: [
      {
        key: "deviceNumber",
        label: "设备编号",
        type: "input",
        required: true,
        placeholder: "请输入设备编号"
      },
      {
        key: "productId",
        label: "产品型号",
        type: "select",
        options: deviceProductOptions.value
      },
      {
        key: "deviceType",
        label: "设备类型",
        type: "select",
        options: [
          { label: "LD18", value: "LD18" },
          { label: "LD18E-FM", value: "LD18E-FM" },
          { label: "LD18HE-FM", value: "LD18HE-FM" }
        ]
      },
    ]
  },

  {
    title: "设备标识",
    fields: [
      {
        key: "nbNumber",
        label: "NB编号",
        type: "input"
      },
      {
        key: "deviceImei",
        label: "IMEI",
        type: "input"
      },
      {
        key: "deviceImsi",
        label: "IMSI",
        type: "input"
      },
      {
        key: "serialNumber",
        label: "序列号",
        type: "input"
      }
    ]
  },

  {
    title: "安装信息",
    fields: [
      {
        key: "installState",
        label: "安装状态",
        type: "select",
        options: [
          { label: "未安装", value: 0 },
          { label: "已安装", value: 1 }
        ]
      },
      {
        key: "installMode",
        label: "安装模式",
        type: "select",
        options: [
          { label: "固定点", value: 0 },
          { label: "流动点", value: 1 }
        ]
      },
      {
        key: "installAddress",
        label: "安装地址",
        type: "input"
      },
      {
        key: "installLongitude",
        label: "经度",
        type: "input"
      },
      {
        key: "installLatitude",
        label: "纬度",
        type: "input"
      }
    ]
  },

  {
    title: "设备状态",
    fields: [
      {
        key: "enableState",
        label: "启用状态",
        type: "select",
        options: [
          { label: "启用", value: 1 },
          { label: "禁用", value: 0 }
        ]
      },
      {
        key: "leakStatus",
        label: "渗漏状态",
        type: "select",
        options: [
          { label: "正常", value: 1 },
          { label: "渗漏", value: 0 },
          { label: "疑似", value: 2 },
          { label: "未知", value: 3 }
        ]
      },
      {
        key: "leakProperty",
        label: "渗漏值",
        type: "input"
      },
    ]
  },

  {
    title: "管网信息",
    fields: [
      {
        key: "tubeGroup",
        label: "管组编号",
        type: "input"
      },
      {
        key: "tubeOrder",
        label: "管序号",
        type: "input"
      }
    ]
  },

  {
    title: "系统信息（可选）",
    fields: [
      {
        key: "hardwareVersion",
        label: "硬件版本",
        type: "input"
      },
      {
        key: "softwareVersion",
        label: "软件版本",
        type: "input"
      }
    ]
  }
]);

function handleAdd() {
  selectedDevice.value = null;
  isEditMode.value = false;
  editingId.value = null;

  formData.value = {
    deviceNumber: "",
    productId: undefined,
    deviceType: "",

    nbNumber: "",
    deviceImei: "",
    deviceImsi: "",
    serialNumber: "",

    enableState: 1,
    installState: undefined,
    installMode: undefined,

    installAddress: "",
    installLongitude: undefined,
    installLatitude: undefined,

    tubeGroup: "",
    tubeOrder: undefined,

    hardwareVersion: "",
    softwareVersion: "",

    leakProperty: undefined,
    leakStatus: undefined
  };

  dialogVisible.value = true;
}


async function handleSubmit(form: DeviceCreateForm) {
  try {
    if (isEditMode.value) {
      await submitUpdate(form);
    } else {
      await submitCreate(form);
    }

    dialogVisible.value = false;
    await fetchDevices();

  } catch (e: any) {
    uni.showToast({
      title: e?.message || "操作失败",
      icon: "error"
    });
  }
}

async function submitCreate(form: DeviceCreateForm) {
  const res = await createDeviceT(form);

  if (res.code !== 200) {
    uni.showToast({
      title: res.msg || "新增失败",
      icon: "error"
    });
    throw new Error(res.msg);
  }

  uni.showToast({
    title: "新增成功",
    icon: "success"
  });
}

async function submitUpdate(form: DeviceCreateForm) {
  if (!editingId.value) return;

  const res = await updateDeviceT(
      editingId.value,
      {...form}
  );

  if (res.code !== 200) {
    uni.showToast({
      title: res.msg || "更新失败",
      icon: "error"
    });
    throw new Error(res.msg);
  }

  uni.showToast({
    title: "更新成功",
    icon: "success"
  });
}

function handleEdit() {
  if (!selectedDevice.value) {
    uni.showToast({ title: '请选择记录', icon: 'none' });
    return;
  }

  isEditMode.value = true;
  editingId.value = selectedDevice.value.id;

  formData.value = { ...selectedDevice.value }

  console.log("formData",formData.value);
  console.log("selectedDevice",selectedDevice.value);

  dialogVisible.value = true;
}

async function handleDelete() {
  try {
    if (!selectedDevice.value) {
      uni.showToast({
        title: '请先选择设备',
        icon: 'none'
      });
      return;
    }

    const device = selectedDevice.value;

    uni.showModal({
      title: '提示',
      content: `确定要删除设备 ${device.deviceNumber} 吗？`,
      success: async (res) => {
        if (!res.confirm) return;

        await deleteDeviceT(device.id);

        await fetchDevices();

        uni.showToast({
          title: '删除成功',
          icon: 'success'
        });

        selectedDevice.value = null;

        // 可选：同步清理右侧详情
        currentDevice.value = null;
      }
    });

  } catch (e: any) {
    uni.showToast({
      title: e?.message || '删除失败',
      icon: 'error'
    });
  }
}

const layoutClass = computed(() => {
  return props.mode === "info"
      ? "layout-split"
      : "layout-equal";
});

onMounted(() => {
  fetchDevices();
  fetchProductOptions();
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

  gap: 14px;
  margin-top: 14px;

  min-height: 0;
  overflow: hidden;
}

/* 默认：左列表 + 右详情 */
.layout-split {
  grid-template-columns: minmax(0, 1fr) 380px;
}

/* maintenance：左右等分 */
.layout-equal {
  grid-template-columns: 1fr 1fr;
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