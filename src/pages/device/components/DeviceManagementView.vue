<template>
  <view class="device-view" :class="`device-view--${mode}`">
    <AdminMetricRow :items="metrics" />

    <view class="device-workspace">
      <view class="table-panel">
        <view class="toolbar">
          <view class="toolbar__filters">
            <view class="filter-field">
              <text class="filter-label">{{ config.searchLabel }}</text>
              <input
                v-model="filters.keyword"
                class="filter-input"
                :placeholder="config.searchPlaceholder"
                placeholder-class="input-placeholder"
                @confirm="loadRecords"
              />
            </view>
            <view class="filter-field filter-field--short">
              <text class="filter-label">状态</text>
              <picker :range="statusOptions" range-key="label" @change="handleFilterStatusChange">
                <view class="filter-select">{{ currentFilterStatusLabel }}</view>
              </picker>
            </view>
          </view>
          <view class="toolbar__actions">
            <button class="toolbar-button toolbar-button--primary" hover-class="button-hover" @click="loadRecords">查询</button>
            <button class="toolbar-button" hover-class="button-hover" @click="resetFilters">重置</button>
            <button class="toolbar-button" hover-class="button-hover" @click="refreshAll">刷新</button>
            <button v-if="mode !== 'status'" class="toolbar-button toolbar-button--primary" hover-class="button-hover" @click="startCreate">{{ config.createText }}</button>
            <button v-if="mode === 'info'" class="toolbar-button" disabled hover-class="button-hover">导入待接入</button>
            <button v-if="mode === 'info'" class="toolbar-button" disabled hover-class="button-hover">导出待接入</button>
            <button v-if="mode !== 'status'" class="toolbar-button toolbar-button--danger" :disabled="!selectedId" hover-class="button-hover" @click="deleteCurrent">删除</button>
          </view>
        </view>

        <view class="table-head">
          <text>{{ config.tableTitle }}</text>
          <text class="table-head__meta">共 {{ total }} 条</text>
        </view>
        <scroll-view class="table-scroll" scroll-x scroll-y>
          <view class="data-table" :style="{ minWidth: config.minWidth }">
            <view class="data-row data-row--header" :style="{ gridTemplateColumns: config.gridColumns }">
              <text v-for="column in config.columns" :key="column.label" class="data-cell">{{ column.label }}</text>
            </view>
            <view v-if="loading" class="table-state">加载中...</view>
            <view v-else-if="!records.length" class="table-state">暂无{{ config.tableTitle }}数据</view>
            <view
              v-for="item in records"
              v-else
              :key="getId(item)"
              class="data-row"
              :class="{ 'data-row--active': selectedId === getId(item) }"
              :style="{ gridTemplateColumns: config.gridColumns }"
              @click="selectRecord(item)"
            >
              <text v-for="column in config.columns" :key="column.label" class="data-cell">
                <text v-if="column.status" class="status-pill" :class="getStatusClass(getCellValue(item, column))">{{ getStatusText(getCellValue(item, column)) }}</text>
                <text v-else>{{ getCellValue(item, column) }}</text>
              </text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="detail-panel">
        <view class="detail-head">
          <text>{{ detailTitle }}</text>
          <text class="detail-head__sub">{{ config.detailSub }}</text>
        </view>

        <view v-if="mode === 'info'" class="form-grid">
          <view class="form-field">
            <text class="form-label form-label--required">设备编号</text>
            <input v-model="infoForm.deviceNo" class="form-input" placeholder="请输入设备编号" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">设备型号</text>
            <input v-model="infoForm.model" class="form-input" placeholder="请输入设备型号" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">设备产品</text>
            <picker :disabled="!products.length" :range="productOptions" range-key="label" @change="handleProductChange">
              <view class="form-select">{{ currentProductLabel }}</view>
            </picker>
          </view>
          <view class="form-field">
            <text class="form-label">设备状态</text>
            <picker :range="recordStatusOptions" range-key="label" @change="handleInfoStatusChange">
              <view class="form-select">{{ getStatusText(infoForm.status) }}</view>
            </picker>
          </view>
          <view class="form-field">
            <text class="form-label">经度</text>
            <input v-model="infoForm.lng" class="form-input" type="digit" placeholder="经度" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">纬度</text>
            <input v-model="infoForm.lat" class="form-input" type="digit" placeholder="纬度" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field form-field--wide">
            <text class="form-label">安装位置</text>
            <textarea v-model="infoForm.location" class="form-textarea" placeholder="阀门井、管段、道路地址或区域说明" placeholder-class="input-placeholder" />
          </view>
        </view>

        <view v-else-if="mode === 'maintenance'" class="form-grid">
          <view class="form-field">
            <text class="form-label form-label--required">设备编号</text>
            <input v-model="maintenanceForm.deviceNo" class="form-input" placeholder="请输入设备编号" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">维护类型</text>
            <picker :range="maintenanceTypeOptions" range-key="label" @change="handleMaintenanceTypeChange">
              <view class="form-select">{{ currentMaintenanceTypeLabel }}</view>
            </picker>
          </view>
          <view class="form-field">
            <text class="form-label">维护方式</text>
            <input v-model="maintenanceForm.method" class="form-input" placeholder="现场处理 / 远程处理" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">维护人员</text>
            <input v-model="maintenanceForm.operator" class="form-input" placeholder="维护人员" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">处理结果</text>
            <input v-model="maintenanceForm.result" class="form-input" placeholder="处理结果" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">安装状态</text>
            <picker :range="installStatusOptions" range-key="label" @change="handleInstallStatusChange">
              <view class="form-select">{{ currentInstallStatusLabel }}</view>
            </picker>
          </view>
          <view class="form-field form-field--wide">
            <text class="form-label">过程说明</text>
            <textarea v-model="maintenanceForm.process" class="form-textarea" placeholder="维护过程、拆装去向、现场照片说明或备注" placeholder-class="input-placeholder" />
          </view>
        </view>

        <view v-else class="form-grid">
          <view class="form-field">
            <text class="form-label">设备编号</text>
            <input v-model="statusForm.deviceNo" class="form-input" disabled placeholder="未选择设备" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">启用状态</text>
            <picker :range="recordStatusOptions" range-key="label" @change="handleDeviceEnabledChange">
              <view class="form-select">{{ getStatusText(statusForm.enabled) }}</view>
            </picker>
          </view>
          <view class="form-field">
            <text class="form-label">安装状态</text>
            <picker :range="installStatusOptions" range-key="label" @change="handleStatusInstallChange">
              <view class="form-select">{{ currentStatusInstallLabel }}</view>
            </picker>
          </view>
          <view class="form-field">
            <text class="form-label">接收状态</text>
            <input v-model="statusForm.receiveStatus" class="form-input" placeholder="正常 / 长时间未接收" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">观测天数</text>
            <input v-model="statusForm.observationDays" class="form-input" type="number" placeholder="观测天数" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field">
            <text class="form-label">最近上报</text>
            <input v-model="statusForm.lastUploadTime" class="form-input" disabled placeholder="最近上报时间" placeholder-class="input-placeholder" />
          </view>
          <view class="form-field form-field--wide">
            <text class="form-label">关联信息</text>
            <view class="relation-strip">
              <view class="relation-item">
                <text class="relation-item__label">报警</text>
                <text class="relation-item__value">{{ getText(selectedRecord || {}, ['alarmCount', 'alarms'], '0') }}</text>
              </view>
              <view class="relation-item">
                <text class="relation-item__label">工单</text>
                <text class="relation-item__value">{{ getText(selectedRecord || {}, ['workOrderCount', 'orders'], '0') }}</text>
              </view>
              <view class="relation-item">
                <text class="relation-item__label">渗漏分析</text>
                <text class="relation-item__value">{{ getText(selectedRecord || {}, ['analysisCount', 'leakAnalysis'], '0') }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="form-actions">
          <button class="toolbar-button" hover-class="button-hover" @click="cancelEdit">取消</button>
          <button class="toolbar-button toolbar-button--primary" :disabled="saving || (mode === 'status' && !selectedId)" hover-class="button-hover" @click="saveCurrent">
            {{ saving ? "保存中..." : config.saveText }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import AdminMetricRow from "@/components/admin/AdminMetricRow.vue";
import {
  createDevice,
  deleteDevice,
  getDevicePage,
  getDeviceProductList,
  updateDevice,
} from "@/services/device/info";
import {
  createMaintenanceRecord,
  deleteMaintenanceRecord,
  getMaintenanceRecordPage,
  updateMaintenanceRecord,
} from "@/services/device/maintenance";
import {
  getDeviceDailyDataPage,
  getDeviceStatusPage,
  getDeviceStatusUploadPage,
  updateDeviceStatus,
} from "@/services/device/status";
import {
  type ApiResponseLike,
  type RecordLike,
  assertSuccessResponse,
  formatDateTime,
  getId,
  getText,
  getValue,
  parseListResponse,
  parsePageResponse,
  removeEmptyFields,
  toastError,
} from "@/utils/adminData";

type DeviceMode = "info" | "maintenance" | "status";
type ColumnConfig = {
  label: string;
  keys: string[];
  fallback?: string;
  status?: boolean;
};

const props = defineProps<{ mode: DeviceMode }>();

const statusOptions = [
  { label: "全部", value: "" },
  { label: "启用", value: 1 },
  { label: "禁用", value: 0 },
];
const recordStatusOptions = statusOptions.slice(1);
const maintenanceTypeOptions = [
  { label: "安装", value: "install" },
  { label: "拆卸", value: "remove" },
  { label: "维修", value: "repair" },
  { label: "巡检", value: "inspect" },
];
const installStatusOptions = [
  { label: "未安装", value: "uninstalled" },
  { label: "已安装", value: "installed" },
  { label: "已拆卸", value: "removed" },
];

const configs: Record<DeviceMode, {
  tableTitle: string;
  searchLabel: string;
  searchPlaceholder: string;
  createText: string;
  saveText: string;
  detailSub: string;
  minWidth: string;
  gridColumns: string;
  columns: ColumnConfig[];
}> = {
  info: {
    tableTitle: "设备信息",
    searchLabel: "设备查询",
    searchPlaceholder: "设备编号、型号、安装位置",
    createText: "新增设备",
    saveText: "保存设备信息",
    detailSub: "维护设备档案、产品型号、安装坐标和运行状态",
    minWidth: "1040px",
    gridColumns: "170px 150px 170px 230px 150px 120px",
    columns: [
      { label: "设备编号", keys: ["deviceNo", "deviceCode", "code"] },
      { label: "设备型号", keys: ["model", "deviceModel", "productModel"] },
      { label: "GPS 坐标", keys: ["gps", "coordinate", "lngLat"] },
      { label: "安装位置", keys: ["installLocation", "location", "address"] },
      { label: "创建时间", keys: ["createdAt", "createTime"] },
      { label: "状态", keys: ["status", "enabled"], status: true },
    ],
  },
  maintenance: {
    tableTitle: "拆装维护",
    searchLabel: "记录查询",
    searchPlaceholder: "设备编号、维护人员、处理结果",
    createText: "新增记录",
    saveText: "保存维护记录",
    detailSub: "记录安装、拆卸、维修方式、处理过程和处理结果",
    minWidth: "1080px",
    gridColumns: "160px 120px 130px 140px 160px 220px 150px",
    columns: [
      { label: "设备编号", keys: ["deviceNo", "deviceCode", "code"] },
      { label: "维护类型", keys: ["maintenanceType", "type"] },
      { label: "安装状态", keys: ["installStatus", "status"] },
      { label: "维护人员", keys: ["operator", "maintenancePerson", "userName"] },
      { label: "维护时间", keys: ["maintenanceTime", "createdAt", "createTime"] },
      { label: "处理结果", keys: ["result", "processResult"] },
      { label: "处理方式", keys: ["method", "maintenanceMethod"] },
    ],
  },
  status: {
    tableTitle: "设备状态",
    searchLabel: "状态查询",
    searchPlaceholder: "设备编号、接收状态、安装位置",
    createText: "",
    saveText: "保存状态",
    detailSub: "查看启用、安装、接收、观测天数和关联报警工单",
    minWidth: "1120px",
    gridColumns: "170px 120px 130px 150px 120px 160px 160px",
    columns: [
      { label: "设备编号", keys: ["deviceNo", "deviceCode", "code"] },
      { label: "启用状态", keys: ["enabled", "status"], status: true },
      { label: "安装状态", keys: ["installStatus"] },
      { label: "接收状态", keys: ["receiveStatus", "onlineStatus"] },
      { label: "观测天数", keys: ["observationDays", "observeDays"] },
      { label: "安装时间", keys: ["installTime"] },
      { label: "拆装时间", keys: ["removeTime", "maintenanceTime"] },
    ],
  },
};

const mode = computed(() => props.mode);
const config = computed(() => configs[props.mode]);
const filters = reactive({
  keyword: "",
  status: "" as string | number,
});
const infoForm = reactive({
  id: "",
  deviceNo: "",
  model: "",
  productId: "",
  status: 1,
  lng: "",
  lat: "",
  location: "",
});
const maintenanceForm = reactive({
  id: "",
  deviceNo: "",
  type: "install",
  method: "",
  operator: "",
  result: "",
  installStatus: "installed",
  process: "",
});
const statusForm = reactive({
  id: "",
  deviceNo: "",
  enabled: 1,
  installStatus: "installed",
  receiveStatus: "",
  observationDays: "",
  lastUploadTime: "",
});

const records = ref<RecordLike[]>([]);
const products = ref<RecordLike[]>([]);
const selectedRecord = ref<RecordLike | null>(null);
const total = ref(0);
const loading = ref(false);
const saving = ref(false);
const creating = ref(false);

const selectedId = computed(() => getId(selectedRecord.value));
const currentFilterStatusLabel = computed(() => statusOptions.find((item) => item.value === filters.status)?.label || "全部");
const currentProductLabel = computed(() => productOptions.value.find((item) => item.value === infoForm.productId)?.label || "未选择");
const productOptions = computed(() => {
  if (!products.value.length) {
    return [{ label: "暂无产品可选", value: "" }];
  }

  return [
    { label: "未选择", value: "" },
    ...products.value.map((item) => ({ label: getText(item, ["productName", "name", "model"], "未命名产品"), value: String(getId(item)) })),
  ];
});
const currentMaintenanceTypeLabel = computed(() => maintenanceTypeOptions.find((item) => item.value === maintenanceForm.type)?.label || "安装");
const currentInstallStatusLabel = computed(() => installStatusOptions.find((item) => item.value === maintenanceForm.installStatus)?.label || "已安装");
const currentStatusInstallLabel = computed(() => installStatusOptions.find((item) => item.value === statusForm.installStatus)?.label || "已安装");
const detailTitle = computed(() => {
  if (props.mode === "status") {
    return "设备状态详情";
  }
  return creating.value ? config.value.createText : `${config.value.tableTitle}配置`;
});
const metrics = computed(() => {
  const enabledCount = records.value.filter((item) => Number(getValue(item, ["status", "enabled"]) ?? 1) === 1).length;
  const disabledCount = records.value.length - enabledCount;
  const selectedName = selectedRecord.value ? getText(selectedRecord.value, ["deviceNo", "deviceCode", "code"], "已选择") : "未选择";
  return [
    { label: "记录总数", value: String(total.value || records.value.length) },
    { label: "启用数量", value: String(enabledCount) },
    { label: "异常/禁用", value: String(disabledCount) },
    { label: "当前记录", value: selectedName },
  ];
});

watch(() => props.mode, () => {
  resetForms();
  void refreshAll();
});

onMounted(() => {
  void refreshAll();
});

async function refreshAll() {
  await Promise.all([loadRecords(), props.mode === "info" ? loadProducts() : Promise.resolve()]);
}

async function loadRecords() {
  loading.value = true;
  try {
    const payload = removeEmptyFields({
      pageNum: 1,
      pageSize: 200,
      keyword: filters.keyword.trim() || undefined,
      deviceNo: filters.keyword.trim() || undefined,
      status: filters.status,
    });
    const response = await getPageByMode(payload) as ApiResponseLike;
    assertSuccessResponse(response);
    const parsed = parsePageResponse(response);
    records.value = parsed.records;
    total.value = parsed.total;
    selectRecord(records.value[0] || null);
    if (props.mode === "status") {
      void loadStatusRelated();
    }
  } catch (error) {
    records.value = [];
    total.value = 0;
    selectRecord(null);
    toastError(error, `${config.value.tableTitle}加载失败`);
  } finally {
    loading.value = false;
  }
}

async function loadProducts() {
  try {
    const response = await getDeviceProductList({}) as ApiResponseLike;
    assertSuccessResponse(response);
    products.value = parseListResponse(response);
  } catch {
    products.value = [];
  }
}

async function loadStatusRelated() {
  if (!selectedId.value) {
    return;
  }

  try {
    const [uploadResponse, dailyResponse] = await Promise.all([
      getDeviceStatusUploadPage({ pageNum: 1, pageSize: 1, deviceId: selectedId.value }) as Promise<ApiResponseLike>,
      getDeviceDailyDataPage({ pageNum: 1, pageSize: 1, deviceId: selectedId.value }) as Promise<ApiResponseLike>,
    ]);
    const upload = parsePageResponse(uploadResponse).records[0];
    const daily = parsePageResponse(dailyResponse).records[0];
    statusForm.lastUploadTime = formatDateTime(getText(upload || daily || {}, ["uploadTime", "createdAt", "createTime"], ""));
  } catch {
    statusForm.lastUploadTime = "";
  }
}

function getPageByMode(payload: RecordLike) {
  if (props.mode === "maintenance") {
    return getMaintenanceRecordPage(payload);
  }
  if (props.mode === "status") {
    return getDeviceStatusPage(payload);
  }
  return getDevicePage(payload);
}

function selectRecord(item: RecordLike | null) {
  selectedRecord.value = item;
  creating.value = false;
  if (!item) {
    resetForms();
    return;
  }

  Object.assign(infoForm, {
    id: String(getId(item)),
    deviceNo: getText(item, ["deviceNo", "deviceCode", "code"], ""),
    model: getText(item, ["model", "deviceModel", "productModel"], ""),
    productId: String(getValue(item, ["productId", "deviceProductId"]) || ""),
    status: Number(getValue(item, ["status", "enabled"]) ?? 1),
    lng: getText(item, ["lng", "longitude"], ""),
    lat: getText(item, ["lat", "latitude"], ""),
    location: getText(item, ["installLocation", "location", "address"], ""),
  });
  Object.assign(maintenanceForm, {
    id: String(getId(item)),
    deviceNo: getText(item, ["deviceNo", "deviceCode", "code"], ""),
    type: getText(item, ["maintenanceType", "type"], "install"),
    method: getText(item, ["method", "maintenanceMethod"], ""),
    operator: getText(item, ["operator", "maintenancePerson", "userName"], ""),
    result: getText(item, ["result", "processResult"], ""),
    installStatus: getText(item, ["installStatus", "status"], "installed"),
    process: getText(item, ["process", "remark"], ""),
  });
  Object.assign(statusForm, {
    id: String(getId(item)),
    deviceNo: getText(item, ["deviceNo", "deviceCode", "code"], ""),
    enabled: Number(getValue(item, ["enabled", "status"]) ?? 1),
    installStatus: getText(item, ["installStatus"], "installed"),
    receiveStatus: getText(item, ["receiveStatus", "onlineStatus"], ""),
    observationDays: getText(item, ["observationDays", "observeDays"], ""),
    lastUploadTime: "",
  });
}

function startCreate() {
  creating.value = true;
  selectedRecord.value = null;
  resetForms();
}

function cancelEdit() {
  selectRecord(selectedRecord.value || records.value[0] || null);
}

function resetForms() {
  Object.assign(infoForm, { id: "", deviceNo: "", model: "", productId: "", status: 1, lng: "", lat: "", location: "" });
  Object.assign(maintenanceForm, { id: "", deviceNo: "", type: "install", method: "", operator: "", result: "", installStatus: "installed", process: "" });
  Object.assign(statusForm, { id: "", deviceNo: "", enabled: 1, installStatus: "installed", receiveStatus: "", observationDays: "", lastUploadTime: "" });
}

function resetFilters() {
  filters.keyword = "";
  filters.status = "";
  void loadRecords();
}

async function saveCurrent() {
  if (props.mode === "maintenance") {
    await saveMaintenance();
  } else if (props.mode === "status") {
    await saveStatus();
  } else {
    await saveInfo();
  }
}

async function saveInfo() {
  if (!infoForm.deviceNo.trim()) {
    uni.showToast({ title: "请填写设备编号", icon: "none" });
    return;
  }

  saving.value = true;
  try {
    const payload = removeEmptyFields({
      deviceNo: infoForm.deviceNo.trim(),
      deviceCode: infoForm.deviceNo.trim(),
      model: infoForm.model.trim(),
      productId: infoForm.productId || undefined,
      status: infoForm.status,
      lng: infoForm.lng.trim(),
      lat: infoForm.lat.trim(),
      longitude: infoForm.lng.trim(),
      latitude: infoForm.lat.trim(),
      installLocation: infoForm.location.trim(),
      location: infoForm.location.trim(),
    });
    const response = infoForm.id ? await updateDevice(infoForm.id, payload) : await createDevice(payload);
    assertSuccessResponse(response as ApiResponseLike);
    uni.showToast({ title: "设备信息已保存", icon: "success" });
    await loadRecords();
  } catch (error) {
    toastError(error, "设备信息保存失败");
  } finally {
    saving.value = false;
  }
}

async function saveMaintenance() {
  if (!maintenanceForm.deviceNo.trim()) {
    uni.showToast({ title: "请填写设备编号", icon: "none" });
    return;
  }

  saving.value = true;
  try {
    const payload = removeEmptyFields({
      deviceNo: maintenanceForm.deviceNo.trim(),
      deviceCode: maintenanceForm.deviceNo.trim(),
      maintenanceType: maintenanceForm.type,
      type: maintenanceForm.type,
      method: maintenanceForm.method.trim(),
      operator: maintenanceForm.operator.trim(),
      result: maintenanceForm.result.trim(),
      installStatus: maintenanceForm.installStatus,
      process: maintenanceForm.process.trim(),
      remark: maintenanceForm.process.trim(),
    });
    const response = maintenanceForm.id ? await updateMaintenanceRecord(maintenanceForm.id, payload) : await createMaintenanceRecord(payload);
    assertSuccessResponse(response as ApiResponseLike);
    uni.showToast({ title: "维护记录已保存", icon: "success" });
    await loadRecords();
  } catch (error) {
    toastError(error, "维护记录保存失败");
  } finally {
    saving.value = false;
  }
}

async function saveStatus() {
  if (!statusForm.id) {
    uni.showToast({ title: "请先选择设备", icon: "none" });
    return;
  }

  saving.value = true;
  try {
    const payload = removeEmptyFields({
      enabled: statusForm.enabled,
      status: statusForm.enabled,
      installStatus: statusForm.installStatus,
      receiveStatus: statusForm.receiveStatus.trim(),
      observationDays: statusForm.observationDays,
    });
    const response = await updateDeviceStatus(statusForm.id, payload);
    assertSuccessResponse(response as ApiResponseLike);
    uni.showToast({ title: "设备状态已保存", icon: "success" });
    await loadRecords();
  } catch (error) {
    toastError(error, "设备状态保存失败");
  } finally {
    saving.value = false;
  }
}

async function deleteCurrent() {
  if (!selectedId.value) {
    return;
  }

  saving.value = true;
  try {
    const response = props.mode === "maintenance"
      ? await deleteMaintenanceRecord(selectedId.value)
      : await deleteDevice(selectedId.value);
    assertSuccessResponse(response as ApiResponseLike);
    selectedRecord.value = null;
    uni.showToast({ title: "删除成功", icon: "success" });
    await loadRecords();
  } catch (error) {
    toastError(error, "删除失败");
  } finally {
    saving.value = false;
  }
}

function handleFilterStatusChange(event: { detail: { value: number } }) {
  filters.status = statusOptions[event.detail.value]?.value ?? "";
}

function handleProductChange(event: { detail: { value: number } }) {
  infoForm.productId = productOptions.value[event.detail.value]?.value || "";
}

function handleInfoStatusChange(event: { detail: { value: number } }) {
  infoForm.status = Number(recordStatusOptions[event.detail.value]?.value ?? 1);
}

function handleMaintenanceTypeChange(event: { detail: { value: number } }) {
  maintenanceForm.type = maintenanceTypeOptions[event.detail.value]?.value || "install";
}

function handleInstallStatusChange(event: { detail: { value: number } }) {
  maintenanceForm.installStatus = installStatusOptions[event.detail.value]?.value || "installed";
}

function handleDeviceEnabledChange(event: { detail: { value: number } }) {
  statusForm.enabled = Number(recordStatusOptions[event.detail.value]?.value ?? 1);
}

function handleStatusInstallChange(event: { detail: { value: number } }) {
  statusForm.installStatus = installStatusOptions[event.detail.value]?.value || "installed";
}

function showUnsupported(action: string) {
  uni.showToast({ title: `${action}接口暂未提供`, icon: "none" });
}

function getCellValue(item: RecordLike, column: ColumnConfig) {
  if (column.label === "GPS 坐标") {
    const gps = getText(item, column.keys, "");
    if (gps) {
      return gps;
    }
    const lng = getText(item, ["lng", "longitude"], "");
    const lat = getText(item, ["lat", "latitude"], "");
    return lng || lat ? `${lng || "-"}, ${lat || "-"}` : "-";
  }
  return formatDateTime(getText(item, column.keys, column.fallback || "-"));
}

function getStatusText(value: unknown) {
  if (value === "installed") {
    return "已安装";
  }
  if (value === "removed") {
    return "已拆卸";
  }
  if (value === "uninstalled") {
    return "未安装";
  }
  return Number(value ?? 1) === 0 ? "禁用" : "启用";
}

function getStatusClass(value: unknown) {
  return Number(value ?? 1) === 0 || value === "removed" || value === "uninstalled" ? "status-pill--disabled" : "status-pill--enabled";
}

</script>

<style scoped lang="scss">
.device-view {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: var(--shell-content-min-height);
  padding: 14px;
  overflow: hidden;
  background: $color-admin-page-bg;
}

.table-panel,
.detail-panel {
  background: #ffffff;
  border: 1px solid $color-admin-panel-border;
  border-radius: 6px;
  box-shadow: $shadow-admin-panel;
}

.device-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 390px;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.table-panel,
.detail-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.toolbar,
.table-head,
.detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  gap: 12px;
  min-height: 44px;
  padding: 10px 12px;
  border-bottom: 1px solid #edf3f8;
}

.detail-head {
  align-items: flex-start;
  flex-direction: column;
  gap: 4px;
}

.table-head,
.detail-head {
  color: $color-admin-title;
  font-size: 15px;
  font-weight: 800;
}

.table-head__meta,
.detail-head__sub {
  color: $color-admin-muted;
  font-size: 13px;
  font-weight: 500;
}

.toolbar {
  flex-wrap: wrap;
}

.toolbar__filters,
.toolbar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-field {
  display: flex;
  align-items: center;
  gap: 7px;
}

.filter-field--short .filter-select {
  width: 94px;
}

.filter-label,
.form-label {
  flex: none;
  color: #34495e;
  font-size: 13px;
  font-weight: 800;
}

.form-label {
  display: block;
  margin-bottom: 6px;
}

.form-label--required::after {
  margin-left: 3px;
  color: #ef4444;
  content: "*";
}

.filter-input,
.filter-select,
.form-input,
.form-select,
.form-textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 34px;
  padding: 0 10px;
  color: #172033;
  font-size: 14px;
  line-height: 34px;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.filter-input {
  width: 260px;
}

.form-textarea {
  height: 86px;
  padding: 8px 10px;
  line-height: 20px;
}

.input-placeholder {
  color: #9aa9b8;
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 32px;
  margin: 0;
  padding: 0 13px;
  color: #31506d;
  font-size: 14px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.toolbar-button::after {
  border: 0;
}

.toolbar-button--primary {
  color: #ffffff;
  background: $color-admin-primary;
  border-color: $color-admin-primary;
}

.toolbar-button--danger {
  color: #b42318;
  background: #fff5f3;
  border-color: #ffc9c0;
}

.toolbar-button[disabled] {
  color: #9aa9b8;
  background: #eef2f6;
  border-color: #d7e0e8;
}

.button-hover {
  color: $color-admin-primary;
  background: #edf7ff;
  border-color: #a9d7ff;
}

.table-scroll {
  flex: 1;
  min-height: 0;
}

.data-row {
  display: grid;
  min-height: 42px;
  color: #24384d;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
}

.data-row--header {
  position: sticky;
  top: 0;
  z-index: 1;
  min-height: 40px;
  color: #5d7188;
  font-size: 14px;
  font-weight: 800;
  background: #f4faff;
  cursor: default;
}

.data-row:hover:not(.data-row--header),
.data-row--active {
  background: #f4faff;
}

.data-cell {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 0 12px;
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-right: 1px solid #edf1f5;
}

.table-state {
  padding: 26px 12px;
  color: #8a9aab;
  font-size: 14px;
  text-align: center;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 800;
  border-radius: 999px;
}

.status-pill--enabled {
  color: #16753a;
  background: #eafaf0;
}

.status-pill--disabled {
  color: #9f1f17;
  background: #fff0ee;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
  padding: 14px;
}

.form-field {
  min-width: 0;
}

.form-field--wide {
  grid-column: 1 / -1;
}

.relation-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.relation-item {
  padding: 10px;
  background: #f8fbfe;
  border: 1px solid #d8e6f2;
  border-radius: 4px;
}

.relation-item__label,
.relation-item__value {
  display: block;
}

.relation-item__label {
  color: $color-admin-muted;
  font-size: 12px;
  font-weight: 700;
}

.relation-item__value {
  margin-top: 5px;
  color: $color-admin-title;
  font-size: 18px;
  font-weight: 900;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: auto;
  padding: 12px 14px;
  border-top: 1px solid #edf3f8;
}

@media (max-width: 1120px) {
  .device-workspace {
    grid-template-columns: 1fr;
  }

  .detail-panel {
    min-height: 360px;
  }
}
</style>
