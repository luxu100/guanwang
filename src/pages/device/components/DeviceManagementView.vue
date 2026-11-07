<template>
  <view class="device-page">
    <!--    全局toolbar-->
    <view class="global-toolbar">
      <DeviceToolbar
          v-model="searchForm"
          :fields="toolbarConfig"
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
              @device-updated="handleUpdateDevice"
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

  <XTreeMultiSelectDialog
      v-model:visible="treeVisible"
      v-model="deptIds"
      :tree-data="deptTree"
      :bound-ids="boundDeptIds"
      :remove-ids="removeIds"
      :title="t('page.bindDeptTitle')"
      :subtitle="t('page.bindDeptSubtitle')"
      @confirm="onDeptConfirm"
  />

  <ValveTableDialog
      v-model:visible="valveDialogVisible"
      v-model="valveId"
      :dept-list="deviceDeptList"
      :title="t('page.bindValveTitle')"
      :subtitle="t('page.bindValveSubtitle')"
      :dept-label="t('page.deptLabel')"
      @confirm="handleValveConfirm"
  />

</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";

import type {
  DeptDevice,
  DeptTreeVO,
  Device,
  DeviceCreateForm, DeviceDeptVO,
  ValveBindDeviceDTO
} from "@/services/device/types";
import {
  createDeptDeviceT,
  createDeviceT, deleteDeptDeviceT,
  deleteDeviceT, getDeptByIdT, getDeptTreeT, getDeviceDetailT,
  getDevicePageT,
  getDeviceProductListT,
  updateDeviceT
} from "@/services/device/info.typed";

import DeviceInfoPanel from "../info/components/DeviceInfoPanel.vue";
import MaintenancePanel from "../maintenance/components/MaintenancePanel.vue";
import DeviceToolbar from "./DeviceToolbar.vue";
import DeviceTableView from "./DeviceTableView.vue";
import XDynamicDialog from "@/pages/device/components/x/dialog/XDynamicDialog.vue";
import XTreeSelectDialog from "@/pages/device/components/x/dialog/XTreeSelectDialog.vue";
import type {FormSection} from "@/pages/device/components/x/types";
import type {PartitionNode} from "@/pages/device/components/x/tree/XTreeNode.vue";

import {createScopedT} from "@/i18n";
import {
  bindValveDevices,
  getDeptIdByDeviceId,
  getDeptInfoByDeviceIdT
} from "@/services/device/dept-device.typed";
import ValveTableDialog from "@/pages/device/valve/components/ValveTableDialog.vue";
import DeviceProtocolPanel from "@/pages/device/protocol/components/DeviceProtocolPanel.vue";
import XTreeMultiSelectDialog from "@/pages/device/components/x/dialog/XTreeMultiSelectDialog.vue";
const t = createScopedT("devicePage");

/**
 * =========================
 * mode
 * =========================
 */
const props = defineProps<{
  mode: "info" | "maintenance" | "protocol" ;
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
      deviceType: null,
      enableState: null,
      onlineStatus: null,
      leakStatus: null,
      startTime: "",
      endTime: "",
    },

    toolbar: [
      { key: "deviceNumber", labelKey: "fields.deviceNumber", type: "input",queryScope: "device"},
      { key: "deviceType", labelKey: "fields.deviceType", type: "select", dict: "deviceType",queryScope: "device"},
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
      maintainType: null,
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

  const firstDevice = deviceList.value[0] || null;
  currentDevice.value = firstDevice;
  selectedDeviceId.value = firstDevice?.id || null;
  selectedDevice.value = firstDevice;
}

async function handleUpdateDevice(deviceId: number) {
  const res = await getDeviceDetailT(deviceId);
  const index = deviceList.value.findIndex(item => item.id === deviceId);
  if (index !== -1 && res.data) {
    deviceList.value[index] = res.data;
  }

  currentDevice.value = deviceList.value[index];
}

async function handleDeleteDevice(deviceId: number) {
  await deleteDeviceT(deviceId);
  fetchDevices();
}


const deviceProductOptions = ref<{ label: string; value: number; aepProtocol?: string | null }[]>([]);
const compatibleProductOptions = computed(() => {
  const protocol = String(formData.value.aepProtocol || "").trim().toLowerCase();
  return protocol ? deviceProductOptions.value.filter(item => String(item.aepProtocol || "").trim().toLowerCase() === protocol) : deviceProductOptions.value;
});

async function fetchProductOptions() {
  const res = await getDeviceProductListT();
  deviceProductOptions.value = (res.data || []).map((item: any) => ({
    label: item.productName,   // 或 name，看你后端字段
    value: item.id,
    aepProtocol: item.aepProtocol,
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
        options: compatibleProductOptions.value
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
        key: "aepProtocol",
        label: t("fields.communication.aepProtocol"),
        type: "select",
        options: [
          { label: t("fields.communication.cloud4G"), value: "tcp" },
          { label: t("fields.communication.cloudNB"), value: "lwm2m" },
          { label: t("fields.communication.directTCP"), value: "" },
        ]
      },
      {
        key: "downlinkProtocolVersion",
        label: t("fields.communication.downlinkProtocolVersion"),
        type: "select",
        options: [
          { label: "NEW", value: "NEW" },
          { label: "LEGACY", value: "LEGACY" },
          { label: t("fields.communication.awaitingProtocol"), value: null },
        ]
      },
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
    aepProtocol: "",
    downlinkProtocolVersion: null,
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

  const original = selectedDevice.value || {};
  const changes = Object.fromEntries(Object.entries(form).filter(([key, value]) =>
    JSON.stringify(value) !== JSON.stringify((original as any)[key]),
  ));
  if (!Object.keys(changes).length) {
    dialogVisible.value = false;
    return;
  }

  const res = await updateDeviceT(
      editingId.value,
      changes
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
  if(props.mode !== "info"){
    currentPanelRef.value?.handleDelete();
    return;
  }

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
const deviceDeptList = ref<DeviceDeptVO[]>([]);
async function handleBindValve() {
  await loadDeviceDept();
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
const deptIds = ref<number[]>([]);
const boundDeptIds = ref<number[]>([]);
const deptTree = ref<PartitionNode[]>([]);
const removeIds = ref<number[]>([]);

async function handleBindDept(){
  await loadDeviceDept();
  boundDeptIds.value=deviceDeptList.value.map(
      item=>item.deptId
  );
  deptIds.value=[...boundDeptIds.value];
  await fetchDeptTree();
  treeVisible.value=true;
}

async function onDeptConfirm(data:{
  addIds:number[];
  removeIds:number[];
}) {

  if(!currentDevice.value){
    uni.showToast({
      title:t('message.pleaseSelectDevice'),
      icon:"none"
    });
    return;
  }

  const {addIds,removeIds}=data;

  try{
    // 新增绑定
    for(const deptId of addIds){
      const deptDevice:DeptDevice={
        deviceId:currentDevice.value.id,
        deptId,
        createdAt:new Date().toISOString(),
        updatedAt:new Date().toISOString()
      };
      const res=await createDeptDeviceT(deptDevice);
      if(res.code!==200){
        throw new Error(res.msg);
      }
    }

    // 删除绑定
    for(const deptId of removeIds){
      const binding=deviceDeptList.value.find(
          item=>item.deptId===deptId
      );
      if(!binding){
        continue;
      }
      const res=await deleteDeptDeviceT(
          binding.deptDeviceId
      );
      if(res.code!==200){
        throw new Error(res.msg);
      }
    }
    uni.showToast({
      title:t('message.operationSuccess'),
      icon:"success"
    });
    await loadDeviceDept();
  }catch(e){
    console.error(e);
    uni.showToast({
      title:t('message.operationFailed'),
      icon:"none"
    });
  }
}

async function loadDeviceDept(){
  if (!currentDevice.value) {
    uni.showToast({
      title: t("message.pleaseSelectDevice"),
      icon: "none"
    });
    return;
  }
  const res=await getDeptInfoByDeviceIdT(
      currentDevice.value.id
  );
  deviceDeptList.value=res.data ?? [];
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
    props.mode === "info" ? 420 : 1050
);

watch(
    () => props.mode,
    (mode) => {
      detailWidth.value =
          mode === "info"
              ? 420
              : 1050;
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
