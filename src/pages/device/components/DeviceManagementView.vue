<template>
  <view class="device-page">
    <!--    全局toolbar-->
    <view class="global-toolbar">
      <DeviceToolbar
          v-model="searchForm"
          :fields="toolbarConfig"
          :product-options="productOptions"
          :enable-state-options="enableStateOptions"
          :install-state-options="installStateOptions"
          :online-status-options="onlineStatusOptions"
          :leak-status-options="leakStatusOptions"
          :maintain-type-options="maintainTypeOptions"
          :receive-status-options="receiveStatusOptions"
          :buttons="showButtonConfig"
          @search="handleSearch"
          @reset="handleReset"
          @refresh="fetchDevices"
          @delete="handleDelete"
          @add="handleAdd"
          @edit="handleEdit"
          @on-export="handleExport"
          @on-import="handleImport"
          @bind-dept="handleBindDept"
          @bind-valve="handleBindValve"
          @show-detail="handleShowDetail"
      />
    </view>

    <view
        class="worksheet-layout"
        :style="layoutStyle"
    >

      <!-- 左侧 -->
      <view class="table-panel">

        <!-- 左侧表格区域 -->
        <DeviceTableView
            :devices="deviceList"
            :pagination="pagination"
            :mode="props.mode"
            :selected-id="selectedDeviceId"
            @view="handleView"
            @select="handleSelect"
            @page-change="handlePageChange"
            @page-size-change="handlePageSizeChange"
        />
      </view>

      <!-- 中间拖拽 -->
      <view
          class="split-handle"
          @mousedown="startResize"
      >
        {{ isDetailCollapsed ? "⟨" : "⟩" }}
      </view>

      <!-- 右侧 -->
      <view
          class="detail-panel"
          v-if="!isDetailCollapsed"
      >

        <view
            v-if="!currentDevice?.id"
            class="detail-empty"
        >
          {{ t("page.selectDevice") }}
        </view>

        <view
            v-else
            class="panel-body"
        >

          <!--
            DeviceInfoPanel:
                DeviceInfo

            MaintenancePanel:
                Toolbar
                Table

            ProtocolPanel:
                Toolbar
                Table
          -->
          <component
              ref="currentPanelRef"
              :is="CurrentPanel"
              :device-data="currentDevice"
              :visible="isDetailPanelVisible"
              :query="panelQuery"
          />

        </view>

      </view>

    </view>

  </view>

  <!-- Dialog -->
  <XDynamicDialog
      v-model:visible="dialogVisible"
      v-model="formData"
      :schema="addSchema"
      :title="isEditMode ? t('page.editDevice') : t('page.addDevice')"
      @submit="handleSubmit"
      @cancel="dialogVisible = false"
  />

  <XTreeSelectDialog
      v-model:visible="treeVisible"
      v-model="deptId"
      :tree-data="deptTree"
      :title="t('page.bindDeptTitle')"
      :subtitle="t('page.bindDeptSubtitle')"
      @confirm="onDeptConfirm"
  />

  <ValveTableDialog
      v-model:visible="valveDialogVisible"
      v-model="valveId"
      :dept-id="currentDeptId"
      :dept-name="currentDeptName"
      :title="t('page.bindValveTitle')"
      :subtitle="t('page.bindValveSubtitle')"
      @confirm="handleValveConfirm"
  />

</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";

import type {
  DeptDevice,
  DeptTreeVO,
  Device,
  DeviceCreateForm,
  ValveBindDeviceDTO
} from "@/services/device/types";
import {
  createDeptDeviceT,
  createDeviceT,
  deleteDeviceT, getDeptByIdT, getDeptTreeT,
  getDevicePageT,
  getDeviceProductListT,
  updateDeviceT
} from "@/services/device/info.typed";

import DeviceInfoPanel from "../info/components/DeviceInfoPanel.vue";
import MaintenancePanel from "../maintenance/components/MaintenancePanel.vue";
import DeviceStatusPanel from "../status/components/DeviceStatusPanel.vue";

import DeviceToolbar from "./DeviceToolbar.vue";
import DeviceTableView from "./DeviceTableView.vue";
import XDynamicDialog from "@/pages/device/components/x/dialog/XDynamicDialog.vue";
import XTreeSelectDialog from "@/pages/device/components/x/dialog/XTreeSelectDialog.vue";
import type {FormSection} from "@/pages/device/components/x/types";
import type {PartitionNode} from "@/pages/device/components/x/tree/XTreeNode.vue";

import {createScopedT} from "@/i18n";
import {bindValveDevices, getDeptIdByDeviceId} from "@/services/device/dept-device.typed";
import ValveTableDialog from "@/pages/device/valve/components/ValveTableDialog.vue";
import DeviceProtocolPanel from "@/pages/device/protocol/components/DeviceProtocolPanel.vue";
const t = createScopedT("devicePage");

/**
 * =========================
 * mode
 * =========================
 */
const props = defineProps<{
  mode: "info" | "maintenance" | "status" | "protocol" ;
}>();

/**
 * =========================
 * table（固定）
 * =========================
 */
const deviceList = ref<Device[]>([]);
const currentDevice = ref<Device | null>(null);
const selectedDeviceId = ref<number | null>(null);
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
      enableState: "",
      onlineStatus: "",
      leakStatus: "",
      startTime: "",
      endTime: "",
    },

    toolbar: [
      { key: "deviceNumber", labelKey: "fields.deviceNumber", type: "input",queryScope: "device"},
      { key: "deviceType", labelKey: "fields.deviceType", type: "select", dict: "product",queryScope: "device"},
      { key: "onlineStatus", labelKey: "fields.onlineStatus", type: "select", dict: "online",queryScope: "device"},
      { key: "enableState", labelKey: "fields.enableState", type: "select", dict: "enable" ,queryScope: "device"},
      { key: "leakStatus", labelKey: "fields.leakStatus", type: "select", dict: "leak",queryScope: "device"},
      { key: "startTime", labelKey: "fields.startTime", type: "date",queryScope: "device"},
      { key: "endTime", labelKey: "fields.endTime", type: "date",queryScope: "device"},
    ],

    buttons: {
      add: true,
      edit: true,
      delete: true,
      refresh: true,
      bindDept: true,
      bindValve: true,
      import: true,
      export: true,
      detail:false
    },
  },

  maintenance: {
    panel: MaintenancePanel,

    searchForm: {
      deviceNumber: "",
      maintainType: null as number | null,
      startTime: '',
      endTime: ''
    },

    toolbar: [
      { key: "deviceNumber", labelKey: "fields.deviceNumber", type: "input" ,queryScope: "device"},
      { key: "maintainType", labelKey: "fields.maintainType", type: "select",dict: "maintain",queryScope: "maintenance"},
      { key: "startTime", labelKey: "fields.startTime", type: "date",queryScope: "maintenance"},
      { key: "endTime", labelKey: "fields.endTime", type: "date",queryScope: "maintenance"},
    ],

    buttons: {
      add: true,
      edit: true,
      delete: true,
      refresh: true,
      bindDept: false,
      bindValve: false,
      import: false,
      export: false,
      detail:true
    },
  },

  status: {
    panel: DeviceStatusPanel,

    searchForm: {
      deviceNumber: "",
    },

    toolbar: [
      { key: "deviceNumber", labelKey: "fields.deviceNumber", type: "input" ,queryScope: "device"},
    ],

    buttons: {
      add: false,
      edit: false,
      delete: false,
      refresh: true,
      bindDept: false,
      bindValve: false,
      import: false,
      export: false
    },
  },

  protocol: {
    panel: DeviceProtocolPanel,

    searchForm: {
      deviceNumber: "",
    },

    toolbar: [
      { key: "deviceNumber", labelKey: "fields.deviceNumber", type: "input" ,queryScope: "device"},
      { key: "startTime", labelKey: "fields.startTime", type: "date",queryScope: "protocol"},
      { key: "endTime", labelKey: "fields.endTime", type: "date",queryScope: "protocol"},
    ],

    buttons: {
      add: true,
      edit: true,
      delete: true,
      refresh: true,
      bindDept: false,
      bindValve: false,
      import: false,
      export: false,
      detail:true
    },
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
 * toolbar config（核心）
 */
const showButtonConfig = computed(() => currentModule.value.buttons);

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
    },
    { immediate: true }
);

/**
 * =========================
 * options（字典）
 * =========================
 */
const productOptions = ref([
  { labelKey: "common.all", value: "" },
  { labelKey: "status.product.TCP", value: "TCP" },
  { labelKey: "status.product.NB", value: "NB" },
]);

const enableStateOptions = [
  { labelKey: "common.all", value: "" },
  { labelKey: "status.status.enabled", value: 1 },
  { labelKey: "status.status.disabled", value: 0 },
];

const maintainTypeOptions = [
  { labelKey: "common.all", value: null },
  { labelKey: "status.maintain.remove", value: 0 },
  { labelKey: "status.maintain.install", value: 1 },
  { labelKey: "status.maintain.maintenance", value: 2 },
  { labelKey: "status.maintain.inspect", value: 3 },
];

const installStateOptions = [
  { labelKey: "common.all", value: "" },
  { labelKey: "status.install.installed", value: 1 },
  { labelKey: "status.install.uninstalled", value: 0 },
];

const onlineStatusOptions = [
  { labelKey: "common.all", value: "" },
  { labelKey: "status.online.online", value: 1 },
  { labelKey: "status.online.offline", value: 0 },
];

const leakStatusOptions = [
  { labelKey: "common.all", value: "" },
  { labelKey: "status.leak.normal", value: 1 },
  { labelKey: "status.leak.leak", value: 0 },
  { labelKey: "status.leak.suspected", value: 2 },
  { labelKey: "status.leak.unknown", value: 3 },
];

const receiveStatusOptions = [
  { labelKey: "common.all", value: "" },
  { labelKey: "status.receive.normal", value: 0 },
  { labelKey: "status.receive.short", value: 1 },
  { labelKey: "status.receive.long", value: 2 },
  { labelKey: "status.receive.error", value: 3 },
  { labelKey: "status.receive.uninit", value: 4 }
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
  selectedDeviceId.value = currentDevice.value.id;
}

const deviceProductOptions = ref<{ label: string; value: number }[]>([]);

async function fetchProductOptions() {
  const res = await getDeviceProductListT();
  deviceProductOptions.value = (res.data || []).map((item: any) => ({
    label: item.productName,   // 或 name，看你后端字段
    value: item.id
  }));
}

/**
 * =========================
 * actions
 * =========================
 */
/**
 * =========================
 * query
 * =========================
 */
const currentPanelRef = ref();
const lastQuery = ref({
  device: {
    deviceNumber: ''
  },
  info: {},
  maintenance: {},
  status: {},
  protocol: {}
});

function isQueryChanged(a:any,b:any){
  return JSON.stringify(a)!==JSON.stringify(b);
}

/**
 * 获取设备查询条件
 */
function getDeviceQuery(){
  const query:any={};
  toolbarConfig.value.forEach(item=>{
    if(item.queryScope==="device"){
      query[item.key]=searchForm.value[item.key];
    }
  });
  return query;
}

/**
 * 获取当前模块查询条件
 */
function getPanelQuery(){
  const query:any={};
  toolbarConfig.value.forEach(item=>{
    if(item.queryScope===props.mode){
      query[item.key]=searchForm.value[item.key];
    }
  });
  return query;
}


/**
 * panel query
 * 传递给 MaintenancePanel 等
 */
const panelQuery = ref<Record<string,any>>({});

/**
 * 搜索
 */
async function handleSearch(){
  const deviceQuery=getDeviceQuery();
  const query=getPanelQuery();

  const deviceChanged =
      isQueryChanged(
          deviceQuery,
          lastQuery.value.device
      );

  const panelChanged =
      isQueryChanged(
          query,
          lastQuery.value[props.mode]
      );

  if(deviceChanged){
    lastQuery.value.device={
      ...deviceQuery
    };
    lastQuery.value[props.mode]={
      ...query
    };
    panelQuery.value={
      ...query
    };
    await fetchDevices();
    return;
  }

  if(panelChanged){
    lastQuery.value[props.mode]={
      ...query
    };
    panelQuery.value={
      ...query
    };
  }
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
  selectedDeviceId.value = device.id;
}

const dialogVisible = ref(false);
const formData = ref<DeviceCreateForm>({})
const addSchema = computed<FormSection[]>(() => [
  {
    title: t("addSchema.basicInfo.title"),
    fields: [
      {
        key: "deviceNumber",
        label: t("addSchema.basicInfo.deviceNumber"),
        type: "input",
        required: true,
        placeholder: t("addSchema.basicInfo.deviceNumberPlaceholder")
      },
      {
        key: "deviceAlias",
        label: t("addSchema.basicInfo.deviceAlias"),
        type: "input",
      },
      {
        key: "productId",
        label: t("addSchema.basicInfo.productModel"),
        type: "select",
        options: deviceProductOptions.value
      },
      {
        key: "deviceType",
        label: t("addSchema.basicInfo.deviceType"),
        type: "input"
      },
      {
        key: "factoryTime",
        label: t("addSchema.basicInfo.factoryTime"),
        type: "datetime"
      }
    ]
  },

  {
    title: t("addSchema.identification.title"),
    fields: [
      {
        key: "nbNumber",
        label: t("addSchema.identification.nbNumber"),
        type: "input"
      },
      {
        key: "deviceImei",
        label: t("addSchema.identification.imei"),
        type: "input"
      },
      {
        key: "deviceImsi",
        label: t("addSchema.identification.imsi"),
        type: "input"
      },
      {
        key: "serialNumber",
        label: t("addSchema.identification.serialNumber"),
        type: "input"
      }
    ]
  },

  {
    title: t("addSchema.communication.title"),
    fields: [
      {
        key: "commandSendway",
        label: t("addSchema.communication.commandSendway"),
        type: "select",
        options: [
          {
            label: t("addSchema.option.commandSendway.4G"),
            value: 0
          },
          {
            label: t("addSchema.option.commandSendway.NB"),
            value: 1
          },
          {
            label: t("addSchema.option.commandSendway.opticalFiber"),
            value: 2
          },
          {
            label: t("addSchema.option.commandSendway.serialPort"),
            value: 3
          },
          {
            label: t("addSchema.option.commandSendway.networkPort"),
            value: 4
          }
        ]
      }
    ]
  },

  {
    title: t("addSchema.sensor.title"),
    fields: [
      {
        key: "pressureSensorModel",
        label: t("addSchema.sensor.pressureSensorModel"),
        type: "input"
      },
      {
        key: "pressureSensorSerial",
        label: t("addSchema.sensor.pressureSensorSerial"),
        type: "input"
      }
    ]
  },

  {
    title: t("addSchema.system.title"),
    fields: [
      {
        key: "hardwareVersion",
        label: t("addSchema.system.hardwareVersion"),
        type: "input"
      },
      {
        key: "softwareVersion",
        label: t("addSchema.system.softwareVersion"),
        type: "input"
      }
    ]
  },

  {
    title: t("addSchema.algorithm.title"),
    fields: [
      {
        key: "algorithmType",
        label: t("addSchema.algorithm.algorithmType"),
        type: "select",
        options: [
          {
            label: t("addSchema.option.algorithmType.Hydrophone"),
            value: "RN-3H"
          },
          {
            label: t("addSchema.option.algorithmType.NoiseMeter"),
            value: null
          }
        ]
      },
      {
        key: "algorithmVersion",
        label: t("addSchema.algorithm.algorithmVersion"),
        type: "input"
      }
    ]
  },
  {
    title: t("addSchema.other.title"),
    fields: [
      {
        key: "createUser",
        label: t("addSchema.other.createUser"),
        type: "input",
        disabled: true
      }
    ]
  }
]);

function handleAdd() {
  if(props.mode !== "info"){
    currentPanelRef.value?.handleAdd();
    return;
  }

  selectedDevice.value = null;
  isEditMode.value = false;
  editingId.value = null;
  formData.value = {
    // 基础信息
    deviceNumber: "",
    deviceType: "",
    productId: undefined,
    deviceAlias: "",

    // 设备识别
    nbNumber: "",
    deviceImei: "",
    deviceImsi: "",
    serialNumber: "",

    // 出厂信息
    factoryTime: "",

    // 固件信息
    hardwareVersion: "",
    softwareVersion: "",

    // 通信方式
    commandSendway: undefined,

    // 压力传感器
    pressureSensorModel: "",
    pressureSensorSerial: "",

    // 算法配置
    algorithmType: "",
    algorithmVersion: "",

    // 其他
    createUser: uni.getStorageSync("userInfo")?.username || ""
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
      title: e?.message || t('message.operationFailed'),
      icon: "error"
    });
  }
}

async function submitCreate(form: DeviceCreateForm) {
  const res = await createDeviceT(form);

  if (res.code !== 200) {
    uni.showToast({
      title: res.msg || t('message.addFail'),
      icon: "error"
    });
    throw new Error(res.msg);
  }

  uni.showToast({
    title: t('message.addSuccess'),
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
      title: res.msg || t('message.updateFail'),
      icon: "error"
    });
    throw new Error(res.msg);
  }

  uni.showToast({
    title: t('message.updateSuccess'),
    icon: "success"
  });
}

function handleEdit() {
  if(props.mode !== "info"){
    currentPanelRef.value?.handleEdit();
    return;
  }

  if (!selectedDevice.value) {
    uni.showToast({ title: t('message.selectRecord'), icon: 'none' });
    return;
  }

  isEditMode.value = true;
  editingId.value = selectedDevice.value.id;

  formData.value = { ...selectedDevice.value };

  dialogVisible.value = true;
}

async function handleDelete() {
  try {
    if (!selectedDevice.value) {
      uni.showToast({
        title: t('message.selectDevice'),
        icon: 'none'
      });
      return;
    }

    const device = selectedDevice.value;

    uni.showModal({
      title: t('message.confirmDeleteTitle'),
      content: t('message.confirmDeleteContent', {
        deviceNumber: device.deviceNumber
      }),
      cancelText: t('common.cancel'),
      confirmText: t('common.confirm'),
      success: async (res) => {
        if (!res.confirm) return;

        await deleteDeviceT(device.id);

        await fetchDevices();

        uni.showToast({
          title: t('message.deleteSuccess'),
          icon: 'success'
        });

        selectedDevice.value = null;

        // 可选：同步清理右侧详情
        currentDevice.value = null;
      }
    });

  } catch (e: any) {
    uni.showToast({
      title: e?.message || t('message.deleteFail'),
      icon: 'error'
    });
  }
}

function handleExport() {
  uni.showToast({
    title: t('message.exportNotReady'),
    icon: 'none'
  });
}

function handleImport() {
  uni.showToast({
    title: t('message.importNotReady'),
    icon: 'none'
  });
}

function handleShowDetail() {
  if(props.mode !== "info"){
    currentPanelRef.value?.handleShowDetail();
    return;
  }
  toggleDetailPanel();
}
/**
 * 绑定阀门
 */
const valveDialogVisible = ref(false);
const valveId = ref<number|null>(null);
const currentDeptId = ref<number|null>(null);
const currentDeptName = ref<string|null>(null);
async function handleBindValve() {
  if (!currentDevice.value) {
    uni.showToast({
      title: t("message.pleaseSelectDevice"),
      icon: "none"
    });
    return;
  }

  // 1. 获取当前设备所在分区
  const res = await getDeptIdByDeviceId(currentDevice.value.id);

  const deptId = res.data;

  if (!deptId) {
    uni.showToast({ title: t("message.noPartitionAssigned"), icon: "none" });
    return;
  }

  // 2. 将分区 ID 存入响应式变量，并打开弹窗
  // 弹窗内部的 watch 监听到 deptId 变化且 visible 为 true 时，会自动请求数据
  const deptRes = await getDeptByIdT(deptId)
  currentDeptId.value = deptId;
  currentDeptName.value = deptRes.data?.deptName || null;
  valveDialogVisible.value = true;
}

// ===== 弹窗确认回调 =====
async function handleValveConfirm(valve: any) {
  if (!valve || !currentDevice.value) {
    uni.showToast({ title: "未选择有效阀门", icon: "none" });
    return;
  }

  const valveBindDeviceDTO: ValveBindDeviceDTO = {
    deviceIds: [currentDevice.value.id]
  };

  const res = await bindValveDevices(valve.id, valveBindDeviceDTO)
  if(res.code === 200){
    uni.showToast({
      title: res.msg || t('message.bindSuccess'),
      icon: "success"
    });
  }else {
    uni.showToast({
      title: res.msg || t('message.bindFailed'),
      icon: "none"
    });
  }
}
/**
 * 部门树形控件
 */
const treeVisible = ref(false);
const deptId = ref<number | null>(null);
const deptName = ref("");
const deptTree = ref<PartitionNode[]>([]);

function handleBindDept(){
  fetchDeptTree();
  treeVisible.value = true;
}

async function onDeptConfirm(node: PartitionNode | null) {
  if (!node) return;
  if (!currentDevice.value) {
    uni.showToast({
      title: t('message.pleaseSelectDevice'),
      icon: "none"
    });
    return;
  }
  const deptDevice: DeptDevice = {
    deviceId: currentDevice.value.id,
    deptId: node.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  try {
    const res = await createDeptDeviceT(deptDevice);
    if (res.code === 200) {
      uni.showToast({
        title: res.msg || t('message.bindSuccess'),
        icon: "success"
      });
    } else {
      uni.showToast({
        title: res.msg || t('message.bindFailed'),
        icon: "none"
      });
    }
  } catch (e) {
    console.error(e);
    uni.showToast({
      title: t('message.requestError'),
      icon:"none"
    });
  }
  deptName.value = node.name;
}

function convertDeptTree(
    list: DeptTreeVO[]
): PartitionNode[] {
  return list.map(item => ({
    id:item.id,
    name:item.deptName,
    children:item.children
        ? convertDeptTree(item.children)
        : []
  }));
}

async function fetchDeptTree() {
  try {
    const res = await getDeptTreeT();
    deptTree.value = convertDeptTree(
        res.data ?? []
    );
  } catch (e) {
    deptTree.value = [];
    console.error(t('message.fetchDeptTreeFailed'), e);
  }
}

function handlePageChange(page:number){
  pagination.value.current = page;
  fetchDevices();
}

function handlePageSizeChange(pageSize:number){
  pagination.value.size = pageSize;
  pagination.value.current = 1;
  fetchDevices();
}

const isDetailPanelVisible = ref(true);
const isDetailCollapsed = ref(false);

const detailWidth = ref(
    props.mode === "info" ? 390 : 1100
);

watch(
    () => props.mode,
    (mode) => {
      detailWidth.value =
          mode === "info"
              ? 390
              : 1100;
    },
    { immediate: true }
);

function toggleDetailPanel() {
  isDetailCollapsed.value = !isDetailCollapsed.value;
  isDetailPanelVisible.value = !isDetailPanelVisible.value;
}

const layoutStyle = computed(() => {
  if (isDetailCollapsed.value) {
    return {
      gridTemplateColumns: "minmax(0, 1fr) 24px"
    };
  }

  return {
    gridTemplateColumns:
        `minmax(0, 1fr) 24px ${detailWidth.value}px`
  };
});

const isDragging = ref(false);

let startX = 0;
let startWidth = 0;

function startResize(e: MouseEvent) {
  startX = e.clientX;
  startWidth = detailWidth.value;
  isDragging.value = false;

  document.addEventListener("mousemove", resize);
  document.addEventListener("mouseup", stopResize);
}

function resize(e: MouseEvent) {
  const diff = startX - e.clientX;

  if (Math.abs(diff) > 3) {
    isDragging.value = true;
  }

  let width = startWidth + diff;

  width = Math.max(300, Math.min(width, 1200));

  detailWidth.value = width;
}

function stopResize() {
  document.removeEventListener("mousemove", resize);
  document.removeEventListener("mouseup", stopResize);

  if (!isDragging.value) {
    toggleDetailPanel();
  }
}

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

.global-toolbar {
  margin-bottom:14px;
  flex-shrink:0;
}

/* ===========================
   主布局
=========================== */

.worksheet-layout {
  flex: 1;
  display: grid;
  min-height: 0;
  overflow: hidden;
}

/* ===========================
   Panel
=========================== */

.table-panel,
.detail-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #eef4f8;
}

/* Panel内容区域 */
.panel-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

/* 如果Panel里面需要滚动 */
.panel-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

/* ===========================
   空状态
=========================== */

.detail-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}

/* ===========================
   中间拖拽
=========================== */

.split-handle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: col-resize;
  user-select: none;
  z-index: 10;
}

.split-handle:hover {
  background: rgba(64,158,255,.06);
  color: #409eff;
}

.split-handle::before {
  content: "";
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 50%;
  width: 1px;
  background: #e4e7ed;
  transform: translateX(-50%);
}

.split-handle::after {
  content: "⋮";
  position: relative;
  font-size: 10px;
  color: #c0c4cc;
}

</style>