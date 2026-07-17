<template>
  <view class="device-page">

    <!-- 顶部搜索栏（config驱动） -->
    <ValveToolbar
        v-model="searchForm"
        :fields="toolbarConfig"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="fetchValve"
        @bind-dept="handleBindDept"
        @edit="handleEdit"
        @delete="handleDelete"
        @add="handleAdd"
    />

    <!-- 主体 -->
    <view class="worksheet-layout">
        <ValveTableView
            :valves="valveList"
            :pagination="pagination"
            :sort-field="sortField"
            :sort-order="sortOrder"
            @view="handleView"
            @select="handleSelect"
            @page-change="handlePageChange"
            @page-size-change="handlePageSizeChange"
            @sort-change="handleSortChange"
        />
    </view>

  </view>

  <XTreeSelectDialog
      v-model:visible="treeVisible"
      v-model="deptId"
      :tree-data="deptTree"
      :title="t('page.bindDeptTitle')"
      :subtitle="t('page.bindDeptSubtitle')"
      @confirm="onDeptConfirm"
  />

  <XDynamicDialog
      v-model:visible="dialogVisible"
      v-model="formData"
      :schema="addSchema"
      :title="isEditMode ? t('valve.page.editValve') : t('valve.page.addValve')"
      @submit="handleSubmit"
      @cancel="dialogVisible = false"
  />
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import ValveToolbar from "@/pages/device/valve/components/ValveToolbar.vue";
import ValveTableView from "@/pages/device/valve/components/ValveTableView.vue";
import {createValveT, deleteValveT, getValvePageT, updateValveT} from "@/services/device/valve.typed";
import type {DeptTreeVO, Valve, ValveCreateFrom} from "@/services/device/types";
import {getDeptTreeT} from "@/services/device/info.typed";

import {createScopedT} from "@/i18n";
import type {PartitionNode} from "@/pages/device/components/x/tree/XTreeNode.vue";
import XTreeSelectDialog from "@/pages/device/components/x/dialog/XTreeSelectDialog.vue";
import XDynamicDialog from "@/pages/device/components/x/dialog/XDynamicDialog.vue";
import type {FormSection} from "@/pages/device/components/x/types";
const t = createScopedT("devicePage");

const valveConfig = {
  searchForm: {
    pipelineName: "",
    valveNumber: "",
    valveName: "",
    branchCompany: "",
    region: "",
    startTime: "",
    endTime: "",
  },

  toolbar: [
    { key: "pipelineName", labelKey: "valve.toolbar.pipelineName", type: "input" },
    { key: "valveNumber", labelKey: "valve.toolbar.valveNumber", type: "input" },
    { key: "valveName", labelKey: "valve.toolbar.valveName", type: "input" },
    { key: "branchCompany", labelKey :"valve.toolbar.branchCompany", type: "input" },
    { key: "region", labelKey: "valve.toolbar.region", type: "input" },
    { key: "startTime", labelKey: "valve.toolbar.startTime", type: "date" },
    { key: "endTime", labelKey: "valve.toolbar.endTime", type: "date" },
  ]
} as const;

const currentModule = computed(() => {
  return valveConfig;
});

const searchForm = ref<any>({
  ...currentModule.value.searchForm,
});

const toolbarConfig = computed(() => currentModule.value.toolbar);

const valveList = ref<Valve[]>([]);
const currentValve = ref<Valve | null>(null);
const selectedValve = ref<Valve | null>(null);
const pagination = ref({
  current: 1,
  size: 10,
  total: 0,
});

function handleSearch() {
  fetchValve();
}

function handleReset() {
  searchForm.value = {
    ...currentModule.value.searchForm,
  };

  fetchValve();
}

async function fetchValve() {
  const res = await getValvePageT({
    ...searchForm.value,
    pageNum: pagination.value.current,
    pageSize: pagination.value.size,
    sortField: sortField.value,
    sortOrder:sortOrder.value,
  });

  const pageData = res.data;

  valveList.value = pageData?.records ?? [];
  pagination.value.total = pageData?.total ?? 0;
  pagination.value.current = pageData?.current ?? 1;
  pagination.value.size = pageData?.size ?? 10;

  currentValve.value = valveList.value[0] || {};
}

function handlePageChange(page:number){
  pagination.value.current = page;
  fetchValve();
}

function handlePageSizeChange(pageSize:number){
  pagination.value.size = pageSize;
  pagination.value.current = 1;
  fetchValve();
}

function handleView(Valve: Valve) {
  currentValve.value = Valve;
}

function handleSelect(Valve: Valve) {
  selectedValve.value = Valve;
}

/**
 * 部门树形控件
 */
const treeVisible = ref(false);
const deptId = ref<number | null>(null);
const deptTree = ref<PartitionNode[]>([]);

function handleBindDept(){
  fetchDeptTree();
  treeVisible.value = true;
}

async function onDeptConfirm(node: PartitionNode | null) {
  if (!node) return;
  else if(node.id === currentValve.value?.deptId){
    uni.showToast({
      title: t('message.alreadyBoundToThisDept'),
      icon: 'none'
    });
    return;
  }
  if (!currentValve.value) {
    uni.showToast({
      title: t('message.selectRecord'),
      icon: "none"
    });
    return;
  }
  const valve: Valve = {
    ...currentValve.value,
    deptId: node.id,
  };
  try {
    const res = await updateValveT(currentValve.value.id,valve);
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

const dialogVisible = ref(false);
const formData = ref<ValveCreateFrom>({})
const isEditMode = ref(false);
const editingId = ref<number | null>(null);
const addSchema = computed<FormSection[]>(() => {
  return [
    {
      title: t("valve.addSchema.basicInfo.title"),
      fields: [
        {
          key: "pipelineName",
          label: t("valve.addSchema.basicInfo.pipelineName"),
          type: "input",
          required: true
        },
        {
          key: "valveNumber",
          label: t("valve.addSchema.basicInfo.valveNumber"),
          type: "input",
          required: true
        },
        {
          key: "valveName",
          label: t("valve.addSchema.basicInfo.valveName"),
          type: "input",
          required: true
        },
        {
          key: "coordinate",
          label: t("valve.addSchema.basicInfo.coordinate"),
          type: "location",
          placeholder: "格式:经度,纬度 （如 121.4737,31.2304)"
        },
        {
          key: "branchCompany",
          label: t("valve.addSchema.basicInfo.branchCompany"),
          type: "input"
        },
        {
          key: "region",
          label: t("valve.addSchema.basicInfo.region"),
          type: "input"
        },
        {
          key: "tubeBore",
          label: t("valve.addSchema.basicInfo.tubeBore"),
          type: "input"
        },
        {
          key: "tubeMaterial",
          label: t("valve.addSchema.basicInfo.tubeMaterial"),
          type: "input"
        }
      ]
    }
  ];
});

function handleAdd() {
  isEditMode.value = false;
  editingId.value = null;

  formData.value = {
    pipelineName: "",
    valveNumber: "",
    valveName: "",
    coordinatePosition: "",
    branchCompany: "",
    region: "",
    tubeBore: "",
    tubeMaterial: "",
    deptId: undefined,
    xCoordinate: undefined,
    yCoordinate: undefined,
    coordinate: "",
    isDeleted: false
  };

  dialogVisible.value = true;
}

async function handleSubmit(form: ValveCreateFrom) {
  try {
    if (isEditMode.value) {
      await submitUpdate(form);
    } else {
      await submitCreate(form);
    }

    dialogVisible.value = false;
    await refreshList();

  } catch (e: any) {
    uni.showToast({
      title: e?.message || t("message.operationFailed"),
      icon: "error"
    });
  }
}

async function submitCreate(form: ValveCreateFrom) {
  if (form.coordinate) {
    const [lng, lat] = form.coordinate.split(",").map(Number);

    if (!Number.isNaN(lng) && !Number.isNaN(lat)) {
      form.xCoordinate = lng;
      form.yCoordinate = lat;
    }
  }

  const res = await createValveT(form);

  if (res.code !== 200) {
    uni.showToast({
      title: res.msg || t("message.addFail"),
      icon: "error"
    });
    throw new Error(res.msg);
  }

  uni.showToast({
    title: t("message.addSuccess"),
    icon: "success"
  });
}

async function submitUpdate(form: ValveCreateFrom) {
  if (form.coordinate) {
    const [lng, lat] = form.coordinate.split(",").map(Number);

    if (!Number.isNaN(lng) && !Number.isNaN(lat)) {
      form.xCoordinate = lng;
      form.yCoordinate = lat;
    }
  }

  if (!editingId.value) return;

  const res = await updateValveT(
      editingId.value,
      {
        ...form
      }
  );

  if (res.code !== 200) {
    uni.showToast({
      title: res.msg || t("message.updateFail"),
      icon: "error"
    });
    throw new Error(res.msg);
  }

  uni.showToast({
    title: t("message.updateSuccess"),
    icon: "success"
  });
}

async function handleDelete() {
  try {
    if (!selectedValve.value?.id) return;

    uni.showModal({
      title: t("message.confirmDeleteTitle"),
      content: t("valve.message.confirmDeleteTitle"),
      success: async (res) => {
        if (!res.confirm) return;

        await deleteValveT(selectedValve.value?.id ?? 0);

        await refreshList();

        uni.showToast({
          title: t("message.deleteSuccess"),
          icon: 'success'
        });

        selectedValve.value = null;
      }
    });

  } catch (e: any) {
    uni.showToast({
      title: e?.message || t("message.deleteFail"),
      icon: 'error'
    });
  }
}

async function handleEdit() {
  if (!selectedValve.value) {
    uni.showToast({
      title: t("message.selectRecord"),
      icon: "none"
    });
    return;
  }

  isEditMode.value = true;
  editingId.value = selectedValve.value.id;

  formData.value = {
    pipelineName: selectedValve.value.pipelineName,
    valveNumber: selectedValve.value.valveNumber,
    valveName: selectedValve.value.valveName,
    coordinatePosition: selectedValve.value.coordinatePosition,
    branchCompany: selectedValve.value.branchCompany,
    region: selectedValve.value.region,
    tubeBore: selectedValve.value.tubeBore,
    tubeMaterial: selectedValve.value.tubeMaterial,
    deptId: selectedValve.value.deptId,
    xCoordinate: selectedValve.value.xCoordinate,
    yCoordinate: selectedValve.value.yCoordinate,
  };

  if (
      formData.value.xCoordinate != null &&
      formData.value.yCoordinate != null
  ) {
    formData.value.coordinate =
        `${formData.value.xCoordinate},${formData.value.yCoordinate}`;
  } else {
    formData.value.coordinate = "";
  }

  dialogVisible.value = true;
}

async function refreshList() {
  await fetchValve();
}

const sortField = ref('');
const sortOrder = ref<'asc'|'desc'>('asc');

function handleSortChange(
    field:string,
    order:'asc'|'desc'
){
  sortField.value = field;
  sortOrder.value = order;
  pagination.value.current = 1;
  fetchValve();
}

onMounted(() => {
  fetchValve();
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