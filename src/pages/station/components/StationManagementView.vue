<template>
  <view class="station-view">
    <AdminMetricRow :items="metrics" />

    <view class="station-workspace">
      <view class="station-side">
        <view class="panel-head">
          <text class="panel-title">分区结构</text>
          <button class="icon-button" hover-class="button-hover" aria-label="刷新" @click="refreshAll">
            <text class="icon-refresh"></text>
          </button>
        </view>
        <scroll-view class="tree-list" scroll-y>
          <view
            class="tree-node"
            :class="{ 'tree-node--active': activePartitionId === 'all' }"
            @click="selectPartition('all')"
          >
            <text class="tree-node__mark"></text>
            <text class="tree-node__label">全部分区</text>
            <text class="tree-node__count">{{ partitions.length }}</text>
          </view>
          <view
            v-for="item in partitions"
            :key="getId(item)"
            class="tree-node"
            :class="{ 'tree-node--active': activePartitionId === getId(item) }"
            @click="selectPartition(getId(item))"
          >
            <text class="tree-node__mark"></text>
            <text class="tree-node__label">{{ getPartitionName(item) }}</text>
            <text class="tree-node__count">{{ getText(item, ['code', 'partitionCode', 'networkCode'], '-') }}</text>
          </view>
          <view v-if="!partitions.length && !loading" class="empty-tip">暂无分区数据</view>
        </scroll-view>
      </view>

      <view class="station-main">
        <view class="toolbar">
          <view class="toolbar__filters">
            <view class="filter-field">
              <text class="filter-label">资源查询</text>
              <input
                v-model="filters.keyword"
                class="filter-input"
                placeholder="分区名称、资源编码、地理位置"
                placeholder-class="input-placeholder"
                @confirm="loadPartitions"
              />
            </view>
            <view class="filter-field filter-field--short">
              <text class="filter-label">资源类型</text>
              <picker :range="stationTypeOptions" range-key="label" @change="handleTypeChange">
                <view class="filter-select">{{ currentTypeLabel }}</view>
              </picker>
            </view>
          </view>
          <view class="toolbar__actions">
            <button class="toolbar-button toolbar-button--primary" hover-class="button-hover" @click="loadPartitions">查询</button>
            <button class="toolbar-button" hover-class="button-hover" @click="resetFilters">重置</button>
            <button class="toolbar-button" hover-class="button-hover" @click="refreshAll">刷新</button>
            <button class="toolbar-button toolbar-button--primary" hover-class="button-hover" @click="startCreatePartition">新增分区</button>
            <button class="toolbar-button" disabled hover-class="button-hover">站点接口待接入</button>
            <button class="toolbar-button toolbar-button--danger" :disabled="!selectedPartitionId" hover-class="button-hover" @click="deleteSelectedPartition">删除</button>
          </view>
        </view>

        <view class="station-table-panel">
          <view class="panel-head">
            <text class="panel-title">分区资源列表</text>
            <text class="panel-meta">共 {{ filteredRows.length }} 条</text>
          </view>
          <scroll-view class="table-scroll" scroll-x scroll-y>
            <view class="data-table">
              <view class="data-row data-row--header">
                <text class="data-cell data-cell--index">序号</text>
                <text class="data-cell data-cell--partition">所属分区</text>
                <text class="data-cell data-cell--code">资源编码</text>
                <text class="data-cell data-cell--name">资源名称</text>
                <text class="data-cell data-cell--type">资源类型</text>
                <text class="data-cell data-cell--location">地理位置</text>
                <text class="data-cell data-cell--action">操作</text>
              </view>
              <view v-if="loading" class="table-state">加载中...</view>
              <view v-else-if="!filteredRows.length" class="table-state">暂无分区资源数据</view>
              <view
                v-for="(item, index) in filteredRows"
                v-else
                :key="getId(item) || index"
                class="data-row"
                :class="{ 'data-row--active': selectedPartitionId === getId(item) }"
                @click="selectRecord(item)"
              >
                <text class="data-cell data-cell--index">{{ index + 1 }}</text>
                <text class="data-cell data-cell--partition">{{ getPartitionName(item) }}</text>
                <text class="data-cell data-cell--code">{{ getStationCode(item) }}</text>
                <text class="data-cell data-cell--name">{{ getStationName(item) }}</text>
                <text class="data-cell data-cell--type">{{ getStationTypeLabel(getText(item, ['stationType', 'type'], 'partition')) }}</text>
                <text class="data-cell data-cell--location">{{ getStationLocation(item) }}</text>
                <view class="data-cell data-cell--action">
                  <button class="link-button" hover-class="link-button--hover" @click.stop="selectRecord(item)">分区配置</button>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>

        <view class="config-grid">
          <view class="config-panel">
            <view class="panel-head panel-head--stack">
              <text class="panel-title">{{ editingPartition ? "分区管理" : "新增分区" }}</text>
              <text class="panel-meta">维护分区编码、范围、中心点和组织归属</text>
            </view>
            <view class="form-grid">
              <view class="form-field">
                <text class="form-label form-label--required">分区名称</text>
                <input v-model="partitionForm.name" class="form-input" placeholder="请输入分区名称" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">分区编码</text>
                <input v-model="partitionForm.code" class="form-input" placeholder="请输入分区编码" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">分区类型</text>
                <input v-model="partitionForm.type" class="form-input" placeholder="管网分区 / 行政分区" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">颜色标识</text>
                <input v-model="partitionForm.color" class="form-input" placeholder="#0d82ee" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">中心经度</text>
                <input v-model="partitionForm.centerLng" class="form-input" type="digit" placeholder="经度" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">中心纬度</text>
                <input v-model="partitionForm.centerLat" class="form-input" type="digit" placeholder="纬度" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field form-field--wide">
                <text class="form-label">分区范围</text>
                <textarea v-model="partitionForm.scope" class="form-textarea" placeholder="GIS 范围、道路范围或管网边界说明" placeholder-class="input-placeholder" />
              </view>
            </view>
            <view class="form-actions">
              <button class="toolbar-button" hover-class="button-hover" @click="startCreatePartition">清空</button>
              <button class="toolbar-button toolbar-button--primary" :disabled="saving" hover-class="button-hover" @click="savePartition">
                {{ saving ? "保存中..." : "保存分区" }}
              </button>
            </view>
          </view>

          <view class="config-panel">
            <view class="panel-head panel-head--stack">
              <text class="panel-title">站点配置待接入</text>
              <text class="panel-meta">后端暂未提供独立站点接口，当前仅开放分区资源维护</text>
            </view>
            <view class="station-api-notice">
              <text class="station-api-notice__title">站点新增、编辑和删除将在接口接入后开放</text>
              <text class="station-api-notice__text">现在请先维护左侧分区结构。避免将站点数据误提交到分区接口。</text>
            </view>
            <view class="form-grid">
              <view class="form-field">
                <text class="form-label form-label--required">站点编号</text>
                <input v-model="stationForm.stationNo" class="form-input" disabled placeholder="站点接口接入后可填写" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label form-label--required">站点名称</text>
                <input v-model="stationForm.stationName" class="form-input" disabled placeholder="站点接口接入后可填写" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">站点全称</text>
                <input v-model="stationForm.fullName" class="form-input" disabled placeholder="站点全称" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">管理编号</text>
                <input v-model="stationForm.manageNo" class="form-input" disabled placeholder="管理编号" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">所属部门</text>
                <picker disabled :range="deptOptions" range-key="label" @change="handleDeptChange">
                  <view class="form-select">{{ currentDeptLabel }}</view>
                </picker>
              </view>
              <view class="form-field">
                <text class="form-label">站点类型</text>
                <picker disabled :range="stationTypeOptions.slice(1)" range-key="label" @change="handleStationTypeChange">
                  <view class="form-select">{{ getStationTypeLabel(stationForm.stationType) }}</view>
                </picker>
              </view>
              <view class="form-field">
                <text class="form-label">经度</text>
                <input v-model="stationForm.lng" class="form-input" disabled type="digit" placeholder="经度" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">纬度</text>
                <input v-model="stationForm.lat" class="form-input" disabled type="digit" placeholder="纬度" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field form-field--wide">
                <text class="form-label">安装位置 / 备注</text>
                <textarea v-model="stationForm.location" class="form-textarea" disabled placeholder="安装位置、管段、重点站点说明" placeholder-class="input-placeholder" />
              </view>
            </view>
            <view class="form-actions">
              <button class="toolbar-button" disabled hover-class="button-hover">等待接口</button>
              <button class="toolbar-button toolbar-button--primary" disabled hover-class="button-hover" @click="saveStation">站点接口待接入</button>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import AdminMetricRow from "@/components/admin/AdminMetricRow.vue";
import {
  createPartition,
  deletePartition,
  getDeptList,
  getPartitionPage,
  updatePartition,
} from "@/services/station/station";
import {
  type ApiResponseLike,
  type RecordLike,
  assertSuccessResponse,
  getId,
  getText,
  getValue,
  parseListResponse,
  parsePageResponse,
  removeEmptyFields,
  toastError,
} from "@/utils/adminData";

const stationTypeOptions = [
  { label: "全部", value: "" },
  { label: "分区站点", value: "partition" },
  { label: "监测站点", value: "monitor" },
  { label: "阀门站点", value: "valve" },
  { label: "关键站点", value: "key" },
];

const filters = reactive({
  keyword: "",
  stationType: "",
});
const partitionForm = reactive({
  id: "",
  name: "",
  code: "",
  type: "",
  color: "#0d82ee",
  centerLng: "",
  centerLat: "",
  scope: "",
});
const stationForm = reactive({
  id: "",
  stationNo: "",
  stationName: "",
  fullName: "",
  manageNo: "",
  deptId: "",
  stationType: "partition",
  lng: "",
  lat: "",
  location: "",
});

const partitions = ref<RecordLike[]>([]);
const depts = ref<RecordLike[]>([]);
const selectedRecord = ref<RecordLike | null>(null);
const activePartitionId = ref<string | number>("all");
const loading = ref(false);
const saving = ref(false);
const total = ref(0);

const selectedPartitionId = computed(() => getId(selectedRecord.value));
const editingPartition = computed(() => Boolean(partitionForm.id));
const editingStation = computed(() => Boolean(stationForm.id));
const currentTypeLabel = computed(() => stationTypeOptions.find((item) => item.value === filters.stationType)?.label || "全部");
const deptOptions = computed(() => [
  { label: "未选择", value: "" },
  ...depts.value.map((item) => ({ label: getText(item, ["deptName", "name", "label"], "未命名部门"), value: String(getId(item)) })),
]);
const currentDeptLabel = computed(() => deptOptions.value.find((item) => item.value === stationForm.deptId)?.label || "未选择");
const filteredRows = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase();
  return partitions.value.filter((item) => {
    const matchesPartition = activePartitionId.value === "all" || getId(item) === activePartitionId.value;
    const matchesKeyword = !keyword || [getPartitionName(item), getStationCode(item), getStationName(item), getStationLocation(item)]
      .some((value) => value.toLowerCase().includes(keyword));
    const type = getText(item, ["stationType", "type"], "partition");
    const matchesType = !filters.stationType || type === filters.stationType;
    return matchesPartition && matchesKeyword && matchesType;
  });
});
const metrics = computed(() => [
  { label: "分区总数", value: String(total.value || partitions.value.length) },
  { label: "分区记录", value: String(filteredRows.value.length) },
  { label: "管理部门", value: String(depts.value.length) },
  { label: "当前分区", value: activePartitionId.value === "all" ? "全部" : getPartitionName(selectedRecord.value || {}) },
]);

onMounted(() => {
  void refreshAll();
});

async function refreshAll() {
  await Promise.all([loadPartitions(), loadDepts()]);
}

async function loadPartitions() {
  loading.value = true;
  try {
    const response = await getPartitionPage(removeEmptyFields({
      pageNum: 1,
      pageSize: 200,
      keyword: filters.keyword.trim() || undefined,
      name: filters.keyword.trim() || undefined,
    })) as ApiResponseLike;
    assertSuccessResponse(response);
    const parsed = parsePageResponse(response);
    partitions.value = parsed.records;
    total.value = parsed.total;
    if (!selectedRecord.value && partitions.value.length) {
      selectRecord(partitions.value[0]);
    }
  } catch (error) {
    partitions.value = [];
    total.value = 0;
    selectedRecord.value = null;
    toastError(error, "站点分区数据加载失败");
  } finally {
    loading.value = false;
  }
}

async function loadDepts() {
  try {
    const response = await getDeptList({}) as ApiResponseLike;
    assertSuccessResponse(response);
    depts.value = parseListResponse(response);
  } catch {
    depts.value = [];
  }
}

function selectPartition(id: string | number) {
  activePartitionId.value = id;
  if (id === "all") {
    return;
  }
  const record = partitions.value.find((item) => getId(item) === id);
  if (record) {
    selectRecord(record);
  }
}

function selectRecord(item: RecordLike) {
  selectedRecord.value = item;
  activePartitionId.value = getId(item) || "all";
  Object.assign(partitionForm, {
    id: String(getId(item)),
    name: getPartitionName(item),
    code: getText(item, ["code", "partitionCode", "networkCode"], ""),
    type: getText(item, ["type", "partitionType", "networkType"], ""),
    color: getText(item, ["color", "areaColor"], "#0d82ee"),
    centerLng: getText(item, ["centerLng", "longitude", "lng"], ""),
    centerLat: getText(item, ["centerLat", "latitude", "lat"], ""),
    scope: getText(item, ["scope", "range", "remark"], ""),
  });
  Object.assign(stationForm, {
    id: String(getId(item)),
    stationNo: getStationCode(item),
    stationName: getStationName(item),
    fullName: getText(item, ["fullName", "stationFullName"], getStationName(item)),
    manageNo: getText(item, ["manageNo", "managerNo"], ""),
    deptId: String(getValue(item, ["deptId", "departmentId"]) || ""),
    stationType: getText(item, ["stationType", "type"], "partition"),
    lng: getText(item, ["lng", "longitude", "centerLng"], ""),
    lat: getText(item, ["lat", "latitude", "centerLat"], ""),
    location: getStationLocation(item),
  });
}

function startCreatePartition() {
  selectedRecord.value = null;
  Object.assign(partitionForm, { id: "", name: "", code: "", type: "", color: "#0d82ee", centerLng: "", centerLat: "", scope: "" });
}

function startCreateStation() {
  const baseId = selectedRecord.value ? String(getId(selectedRecord.value)) : "";
  Object.assign(stationForm, {
    id: baseId,
    stationNo: "",
    stationName: "",
    fullName: "",
    manageNo: "",
    deptId: "",
    stationType: "partition",
    lng: "",
    lat: "",
    location: "",
  });
}

function resetFilters() {
  filters.keyword = "";
  filters.stationType = "";
  activePartitionId.value = "all";
  void loadPartitions();
}

async function savePartition() {
  if (!partitionForm.name.trim()) {
    uni.showToast({ title: "请填写分区名称", icon: "none" });
    return;
  }

  saving.value = true;
  try {
    const payload = removeEmptyFields({
      name: partitionForm.name.trim(),
      partitionName: partitionForm.name.trim(),
      code: partitionForm.code.trim(),
      partitionCode: partitionForm.code.trim(),
      type: partitionForm.type.trim(),
      color: partitionForm.color.trim(),
      centerLng: partitionForm.centerLng.trim(),
      centerLat: partitionForm.centerLat.trim(),
      scope: partitionForm.scope.trim(),
      remark: partitionForm.scope.trim(),
    });
    const response = partitionForm.id ? await updatePartition(partitionForm.id, payload) : await createPartition(payload);
    assertSuccessResponse(response as ApiResponseLike);
    uni.showToast({ title: "分区已保存", icon: "success" });
    await loadPartitions();
  } catch (error) {
    toastError(error, "分区保存失败");
  } finally {
    saving.value = false;
  }
}

function saveStation() {
  uni.showToast({ title: "站点接口暂未提供", icon: "none" });
}

async function deleteSelectedPartition() {
  if (!selectedPartitionId.value) {
    return;
  }

  saving.value = true;
  try {
    const response = await deletePartition(selectedPartitionId.value);
    assertSuccessResponse(response as ApiResponseLike);
    selectedRecord.value = null;
    activePartitionId.value = "all";
    uni.showToast({ title: "删除成功", icon: "success" });
    await loadPartitions();
  } catch (error) {
    toastError(error, "删除失败");
  } finally {
    saving.value = false;
  }
}

function handleTypeChange(event: { detail: { value: number } }) {
  filters.stationType = stationTypeOptions[event.detail.value]?.value || "";
}

function handleDeptChange(event: { detail: { value: number } }) {
  stationForm.deptId = deptOptions.value[event.detail.value]?.value || "";
}

function handleStationTypeChange(event: { detail: { value: number } }) {
  stationForm.stationType = stationTypeOptions.slice(1)[event.detail.value]?.value || "partition";
}

function getStationTypeLabel(value: string) {
  return stationTypeOptions.find((item) => item.value === value)?.label || "分区站点";
}

function getPartitionName(item: RecordLike) {
  return getText(item, ["partitionName", "networkName", "name"], "未命名分区");
}

function getStationCode(item: RecordLike) {
  return getText(item, ["stationNo", "stationCode", "code", "partitionCode", "networkCode"], "-");
}

function getStationName(item: RecordLike) {
  return getText(item, ["stationName", "name", "partitionName", "networkName"], "-");
}

function getStationLocation(item: RecordLike) {
  return getText(item, ["location", "installLocation", "address", "remark"], "-");
}

</script>

<style scoped lang="scss">
.station-view {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: var(--shell-content-min-height);
  padding: 14px;
  overflow: hidden;
  background: $color-admin-page-bg;
}

.station-side,
.station-main,
.station-table-panel,
.config-panel {
  background: #ffffff;
  border: 1px solid $color-admin-panel-border;
  border-radius: 6px;
  box-shadow: $shadow-admin-panel;
}

.station-workspace {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.station-side,
.station-main,
.station-table-panel,
.config-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.panel-head,
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  gap: 12px;
  min-height: 44px;
  padding: 10px 12px;
  border-bottom: 1px solid #edf3f8;
}

.panel-head--stack {
  align-items: flex-start;
  flex-direction: column;
  gap: 4px;
}

.panel-title {
  color: $color-admin-title;
  font-size: 15px;
  font-weight: 800;
}

.panel-meta {
  color: $color-admin-muted;
  font-size: 13px;
}

.tree-list {
  flex: 1;
  min-height: 0;
  padding: 10px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 8px 10px;
  color: #334155;
  border-radius: 4px;
  cursor: pointer;
}

.tree-node:hover,
.tree-node--active {
  color: $color-admin-primary;
  background: #f0f7ff;
}

.tree-node__mark {
  flex: none;
  width: 7px;
  height: 7px;
  background: currentColor;
  border-radius: 50%;
}

.tree-node__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-node__count {
  flex: none;
  color: #7b8fa5;
  font-size: 12px;
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
  width: 110px;
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
  width: 270px;
}

.form-textarea {
  height: 70px;
  padding: 8px 10px;
  line-height: 20px;
}

.input-placeholder {
  color: #9aa9b8;
}

.toolbar-button,
.icon-button,
.link-button {
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

.toolbar-button::after,
.icon-button::after,
.link-button::after {
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

.form-input[disabled],
.form-textarea[disabled],
.form-select {
  color: #8a9aab;
  background: #f3f6f9;
}

.button-hover,
.link-button--hover {
  color: $color-admin-primary;
  background: #edf7ff;
  border-color: #a9d7ff;
}

.icon-button {
  width: 30px;
  padding: 0;
}

.icon-refresh {
  position: relative;
  width: 15px;
  height: 15px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
}

.icon-refresh::after {
  position: absolute;
  top: -4px;
  right: -2px;
  width: 6px;
  height: 6px;
  content: "";
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
  transform: rotate(25deg);
}

.station-main {
  gap: 12px;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.station-table-panel {
  flex: 1;
  min-height: 240px;
}

.table-scroll {
  flex: 1;
  min-height: 0;
}

.data-table {
  min-width: 1040px;
}

.data-row {
  display: grid;
  grid-template-columns: 70px 170px 150px 180px 130px 260px 100px;
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

.data-cell--action {
  justify-content: center;
}

.link-button {
  height: 26px;
  padding: 0 10px;
  color: $color-admin-primary;
  border-color: #c8e3fb;
}

.table-state,
.empty-tip {
  padding: 26px 12px;
  color: #8a9aab;
  font-size: 14px;
  text-align: center;
}

.config-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 12px;
  flex: none;
  min-height: 300px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
  padding: 14px;
}

.station-api-notice {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 12px 14px 0;
  padding: 10px 12px;
  color: #31506d;
  background: #f4faff;
  border: 1px solid #cfe4f7;
  border-radius: 5px;
}

.station-api-notice__title {
  font-size: 13px;
  font-weight: 800;
}

.station-api-notice__text {
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
}

.form-field {
  min-width: 0;
}

.form-field--wide {
  grid-column: 1 / -1;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid #edf3f8;
}

@media (max-width: 1120px) {
  .station-workspace,
  .config-grid {
    grid-template-columns: 1fr;
  }

  .station-side {
    min-height: 180px;
  }
}
</style>
