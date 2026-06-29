<template>
  <view class="worksheet-table-panel">
    <MaintenanceRecordToolbar
        v-model="searchForm"
        @search="handleSearch"
        @reset="handleSearch"
        @refresh="fetchMaintenanceRecords"
        @add="handleAdd"
        @delete="handleDelete"
        @edit="handleEdit"
    />

    <view class="table-head">
      <text>拆装维护详情</text>
      <text class="table-head__meta">共 {{ pagination.total }} 条</text>
    </view>

    <scroll-view class="table-scroll" scroll-x scroll-y>
      <view class="data-table">
        <view class="data-row data-row--header">

          <text class="data-cell data-cell--index">序号</text>
          <text class="data-cell data-cell--device">设备编号</text>
          <text class="data-cell data-cell--type">维护类型</text>
          <text class="data-cell data-cell--time">维护时间</text>
          <text class="data-cell data-cell--address">维护地址</text>
          <text class="data-cell data-cell--status">安装模式</text>
          <text class="data-cell data-cell--number">管组编号</text>
          <text class="data-cell data-cell--text">管材</text>
          <text class="data-cell data-cell--text">管径</text>
          <text class="data-cell data-cell--text">备注</text>
        </view>

        <view v-if="loading" class="loading-mask">加载中...</view>
        <view v-else-if="deviceList.length === 0" class="table-state">暂无工单数据</view>

        <view
            v-for="(record, index) in deviceList"
            :key="record.id"
            class="data-row"
            :class="{ 'data-row--active': selectedRecord?.id === record.id }"
            @click="selectRow(record)"
        >

          <text class="data-cell data-cell--index">
            {{ (pagination.current - 1) * pagination.size + index + 1 }}
          </text>

          <text class="data-cell data-cell--device">
            {{ record.deviceNumber || '-' }}
          </text>

          <text
              class="data-cell data-cell--type"
              :class="getMaintainTypeMeta(record.maintainType!).className"
          >
            {{ getMaintainTypeMeta(record.maintainType!).label }}
          </text>

          <text class="data-cell data-cell--time">
            {{ record.maintainTime || '-' }}
          </text>

          <text class="data-cell data-cell--address">
            {{ record.maintainAddress || '-' }}
          </text>

          <text
              class="data-cell data-cell--status"
              :class="{
              'is-fixed': record.installMode === 0,
              'is-mobile': record.installMode === 1
            }"
          >
            {{ record.installMode === 0 ? '固定点' : record.installMode === 1 ? '流动点' : '-' }}
          </text>

          <text class="data-cell data-cell--number">
            {{ record.tubeGroup || '-' }}
          </text>

          <text class="data-cell data-cell--text">
            {{ record.tubeMaterial || '-' }}
          </text>

          <text class="data-cell data-cell--text">
            {{ record.tubeBore || '-' }}
          </text>

          <text class="data-cell data-cell--text">
            {{ record.remark || '-' }}
          </text>

        </view>
      </view>
    </scroll-view>

    <view class="pagination-bar">
      <button class="page-button" :disabled="pagination.current <= 1" @click="changePage(-1)">上一页</button>
      <text class="page-info">第 {{ pagination.current }} / {{  Math.ceil(pagination.total / pagination.size) || 1  }} 页</text>
      <button class="page-button" :disabled="pagination.current >= 1" @click="changePage(1)">下一页</button>
    </view>
  </view>

  <XDynamicDialog
      v-model:visible="dialogVisible"
      v-model="formData"
      :schema="addSchema"
      :title="isEditMode ? '编辑维护记录' : '新增维护记录'"
      @submit="handleSubmit"
      @cancel="dialogVisible = false"
  />
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import type {Device, MaintenanceRecord,MaintenanceCreateForm} from '@/services/device/types';
import type { Pagination } from '@/types/api';
import {
  createMaintenanceRecordT,
  deleteMaintenanceRecordT,
  getMaintenanceRecordPageT, updateMaintenanceRecordT
} from "@/services/device/maintenance.typed";
import MaintenanceRecordToolbar from "@/pages/device/maintenance/components/MaintenanceRecordToolbar.vue";
import type {FormSection} from "@/pages/device/components/x/types";
import XDynamicDialog from "@/pages/device/components/x/XDynamicDialog.vue";


// ===== 数据 =====
const loading = ref(false);

const deviceList = ref<MaintenanceRecord[]>([]);

const pagination = ref<Pagination>({
  current: 1,
  size: 10,
  total: 0
});

let currentRequestId = 0;

const props = defineProps<{
  deviceData: Partial<Device>;
}>();

// ===== 查询条件（后端过滤）=====
const searchForm = ref({
  maintainType: null as number | null,
  startTime: '',
  endTime: ''
});

const dialogVisible = ref(false);
const formData = ref<MaintenanceCreateForm>({})
const isEditMode = ref(false);
const editingId = ref<number | null>(null);
const addSchema: FormSection[] = [
  {
    title: "基础信息",
    fields: [
      {
        key: "deviceNumber",
        label: "设备编号",
        type: "input",
        required: true
      },
      {
        key: "maintainType",
        label: "维护类型",
        type: "select",
        required: true,
        options: [
          { label: "拆卸", value: 0 },
          { label: "安装", value: 1 },
          { label: "维护", value: 2 },
          { label: "巡检", value: 3 }
        ]
      },
      {
        key: "maintainTime",
        label: "维护时间",
        type: "datetime",
        required: true
      },
      {
        key: "maintainAddress",
        label: "维护地址",
        type: "input"
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
        key: "tubeGroup",
        label: "管组编号",
        type: "input"
      },
      {
        key: "tubeMaterial",
        label: "管材",
        type: "input"
      },
      {
        key: "tubeBore",
        label: "管径",
        type: "input"
      },
      {
        key: "remark",
        label: "备注",
        type: "textarea"
      }
    ]
  },
  {
    title: "扩展信息（可选）",
    fields: [
      {
        key: "maintainAccount",
        label: "维护人员",
        type: "input"
      },
      {
        key: "maintainFeedback",
        label: "维护反馈",
        type: "textarea",
        large: true
      },
      {
        key: "maintainCoordinate",
        label: "坐标",
        type: "input"
      }
    ]
  }
];

watch(
    // 1. 直接监听具体的字段
    () => props.deviceData?.deviceNumber,
    async (newVal, oldVal) => {
      // 2. 增加判断：只有当值真正存在时才请求
      if (!newVal) return;

      // 3. 防止重复触发：如果正在加载中，且是同一个设备编号，不要重复请求
      if (loading.value && newVal === oldVal) {
        return;
      }

      // 重置分页
      pagination.value.current = 1;

      // 4. 【重要】竞态处理：记录当前请求ID
      const requestId = ++currentRequestId;

      await fetchMaintenanceRecords(requestId);
    },
    { immediate: true }
);

// ===== 选中行 =====
const selectedRecord = ref<MaintenanceRecord | null>(null);

function selectRow(record: MaintenanceRecord) {
  selectedRecord.value = record;
}

// ===== 请求数据 =====
async function fetchMaintenanceRecords(requestId?: number) {
  loading.value = true;

  try {
    const res = await getMaintenanceRecordPageT({
      pageNum: pagination.value.current,
      pageSize: pagination.value.size,
      deviceNumber: props.deviceData.deviceNumber || undefined,
      maintainType: searchForm.value.maintainType,
      startTime: searchForm.value.startTime || undefined,
      endTime: searchForm.value.endTime || undefined,
    });

    // 如果在 await 期间触发了新的 watch，requestId 会变大，当前的响应应该被丢弃
    if (requestId && requestId !== currentRequestId) {
      return;
    }

    const pageData = res.data;

    deviceList.value = pageData?.records ?? [];

    pagination.value.total = pageData?.total ?? 0;
    pagination.value.current = pageData?.current ?? 1;
    pagination.value.size = pageData?.size ?? 10;

  } finally {
    loading.value = false;
  }
}

// ===== 分页 =====
function changePage(step: number) {
  const maxPage = Math.ceil(pagination.value.total / pagination.value.size);

  const next = pagination.value.current + step;

  if (next < 1 || next > maxPage) return;

  pagination.value.current = next;
  fetchMaintenanceRecords();
}

// ===== 查询触发（建议你按钮调用）=====
async function handleSearch() {
  pagination.value.current = 1;
  await Promise.resolve();
  fetchMaintenanceRecords();
}

function handleAdd() {
  isEditMode.value = false;
  editingId.value = null;

  formData.value = {
    deviceNumber: props.deviceData?.deviceNumber || "",
    maintainType: undefined,
    maintainTime: "",
    maintainAddress: "",
    installMode: undefined,
    tubeGroup: "",
    tubeMaterial: "",
    tubeBore: "",
    tubeOrder: undefined,
    remark: "",
    maintainAccount: "",
    maintainFeedback: "",
    maintainCoordinate: "",
    maintainPicture: ""
  };

  dialogVisible.value = true;
}

async function handleSubmit(form: MaintenanceCreateForm) {
  try {
    if (isEditMode.value) {
      await submitUpdate(form);
    } else {
      await submitCreate(form);
    }

    dialogVisible.value = false;
    await refreshList({ resetPage: true });

  } catch (e: any) {
    uni.showToast({
      title: e?.message || "操作失败",
      icon: "error"
    });
  }
}

async function submitCreate(form: MaintenanceCreateForm) {
  const res = await createMaintenanceRecordT(form);

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

async function submitUpdate(form: MaintenanceCreateForm) {
  if (!editingId.value) return;

  const res = await updateMaintenanceRecordT(
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

async function handleDelete() {
  try {
    if (!selectedRecord.value?.id) return;

    uni.showModal({
      title: '提示',
      content: '确定要删除该记录吗？',
      success: async (res) => {
        if (!res.confirm) return;

        await deleteMaintenanceRecordT(selectedRecord.value?.id ?? 0);

        await refreshList();

        uni.showToast({
          title: '删除成功',
          icon: 'success'
        });

        selectedRecord.value = null;
      }
    });

  } catch (e: any) {
    uni.showToast({
      title: e?.message || '删除失败',
      icon: 'error'
    });
  }
}

async function handleEdit() {
  if (!selectedRecord.value) {
    uni.showToast({ title: '请选择记录', icon: 'none' });
    return;
  }

  isEditMode.value = true;
  editingId.value = selectedRecord.value.id;

  formData.value = { ...selectedRecord.value }

  dialogVisible.value = true;
}

async function refreshList({ resetPage = false } = {}) {
  if (resetPage) pagination.value.current = 1;

  await fetchMaintenanceRecords();
}


const maintainTypeMap = {
  0: { label: '拆卸', className: 'is-removed' },
  1: { label: '安装', className: 'is-installed' },
  2: { label: '维护', className: 'is-warning' },
  3: { label: '巡检', className: 'is-info' }
} as Record<number, { label: string; className: string }>;

// 获取维护类型元数据
const getMaintainTypeMeta = (type: number) => {
  return maintainTypeMap[type] || { label: '-', className: 'is-unknown' };
};

</script>
<style scoped lang="scss">


.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  z-index: 100;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(255, 255, 255, 0.6);

  color: #31506d;
  font-size: 14px;

  backdrop-filter: blur(1px);
}

.pagination-bar{
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-info {
  color: #64748b;
  font-size: 13px;
}

.page-button::after {
  border: 0;
}

.page-button {
  height: 30px;
  margin: 0;
  padding: 0 12px;
  color: #31506d;
  font-size: 13px;
  line-height: 30px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.page-button[disabled] {
  color: #a9b4c1;
  background: #f4f7fa;
}

.worksheet-table-panel {
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
  height: 100%;
}

.table-state {
  height: 180px;
  color: #7c8da1;
  font-size: 14px;
  line-height: 180px;
  text-align: center;
}

.worksheet-table-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.table-head {
  flex: none;
  height: 50px;
  padding: 0 16px;
  color: #24445f;
  font-size: 16px;
  font-weight: 800;
  background: #ffffff;
  border-bottom: 1px solid #edf3f8;
}

.table-head__meta {
  padding: 4px 10px;
  color: #6a7f94;
  font-size: 13px;
  font-weight: 800;
  background: #f7fafc;
  border: 1px solid #e3ebf2;
  border-radius: 999px;
}

.table-scroll {
  flex: 1;
  height: auto;
  min-height: 0;
  background: #ffffff;
  overflow-x: auto;
  white-space: nowrap;
}

.data-table {
  display: inline-flex;
  flex-direction: column;
  width: max-content;
  background: #ffffff;
}


.data-row {
  display: flex;
  grid-template-columns: 58px 190px 116px 110px 110px 110px 138px 104px 168px 168px 168px 220px 220px;
  min-height: 42px;
  width: max-content;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
  transition:
      background 0.18s ease,
      box-shadow 0.18s ease;
}

.data-row--header {
  position: sticky;
  top: 0;
  z-index: 1;
  min-height: 44px;
  color: #20384f;
  font-weight: 800;
  background: #f6f9fc;
  cursor: default;
  box-shadow: 0 1px 0 #dbe7f0;
}

.data-row:not(.data-row--header):nth-child(odd) {
  background: #ffffff;
}

.data-row:not(.data-row--header):nth-child(even) {
  background: #fbfdff;
}

.data-row:not(.data-row--header):hover {
  background: #f1f8ff;
  box-shadow: inset 0 0 0 1px #d7ebfb;
}

.data-row--active {
  position: relative;
  background: #e7f3ff !important;
  box-shadow: inset 0 0 0 1px #b9dcff;
}

.data-row--active::before {
  position: absolute;
  top: 7px;
  bottom: 7px;
  left: 0;
  width: 3px;
  content: "";
  background: #0d82ee;
  border-radius: 0 999px 999px 0;
}


.data-cell {
  display: flex !important;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 0 12px;
  overflow: hidden;
  color: #24384d;
  font-size: 13px;
  line-height: 1.35;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-right: 1px solid #edf1f5;
  width: 140px;
}

.data-row--header .data-cell {
  color: #415a73;
  font-size: 12px;
  letter-spacing: 0;
}

.data-cell:last-child {
  border-right: 0;
}

.data-cell--index {
  justify-content: center;
  color: #64748b;
  width:50px;
}

.data-cell--number {
  color: #0f4c81;
  font-family: "DIN Alternate", "Arial", sans-serif;
  font-weight: 800;
}

.data-cell--address,
.data-cell--remark {
  justify-content: flex-start;
  text-align: left;
}

.pagination-bar {
  flex: none;
  justify-content: flex-end;
  gap: 10px;
  height: 48px;
  padding: 0 14px;
  border-top: 1px solid #edf3f8;
}


/* 设备编号：通常由字母和数字组成，使用等宽字体更清晰，颜色适中 */
.data-cell--device {
  color: #1e293b;
  font-family: "DIN Alternate", "Arial", sans-serif;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 设备类型：作为普通文本标签，颜色略深以区分状态 */
.data-cell--type {
  color: #334155;
  font-weight: 600;
}

/* 状态类（启用/安装/渗漏/在线）：
   由于状态列通常包含不同状态，这里提供基础样式。
   实际开发中建议配合 JS 动态添加如 .is-online / .is-leak 等修饰类 */
.data-cell--status {
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase; /* 如果状态是英文，大写更美观；中文可去掉 */
  letter-spacing: 0.5px;
}

/* 安装模式：普通文本，稍浅的颜色 */
.data-cell--mode {
  color: #475569;
}

/* 最后采样时间：时间数据使用等宽字体对齐，颜色偏灰 */
.data-cell--time {
  color: #64748b;
  font-family: "DIN Alternate", "Arial", sans-serif;
  font-size: 12px;
}

/* 正常/在线/启用 */
.data-cell--status.is-online,
.data-cell--status.is-enabled {
  color: #10b981; /* 绿色 */
}

/* 异常/渗漏/离线 */
.data-cell--status.is-leak,
.data-cell--status.is-offline {
  color: #ef4444; /* 红色 */
}

/* 警告/安装中 */
.data-cell--status.is-warning,
.data-cell--status.is-installing {
  color: #f59e0b; /* 橙色 */
}

/* ==========================================
   状态列增强样式 (Status Badge Styles)
   ========================================== */

/* 基础状态样式：加粗、大写、紧凑间距 */
.data-cell--status {
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.5px;
  text-transform: uppercase; /* 如果是中文，可以删掉这行 */
  position: relative;
  padding-left: 24px; /* 为左侧圆点留出空间 */
}

/* --- 通用语义化颜色 --- */
/* 成功/启用/在线/已安装 (绿色) */
.is-enabled,
.is-installed,
.is-online,
.is-normal{
  color: #059669; /* 深绿 */
}

/* 警告/流动点/疑似 (琥珀色/橙色) */
.is-mobile,
.is-warning,
  /* 渗漏状态中的 "疑似" */
[data-v-xxxxxx] .is-leak-status-2 {
  color: #92400e; /* 深橙 */
}

/* 危险/停用/离线/渗漏 (红色) */
.is-disabled,
.is-offline,
.is-leak,
  /* 渗漏状态中的 "渗漏" */
[data-v-xxxxxx] .is-leak-status-0 {
  color: #991b1b; /* 深红 */
}

/* 未知/未安装/灰色 (中性色) */
.is-not-installed,
.is-unknown,
  /* 渗漏状态中的 "未知" */
[data-v-xxxxxx] .is-leak-status-3 {
  color: #4b5563; /* 灰 */
}

/* 固定点 (蓝色) */
.is-fixed {
  color: #1e40af;
}

.data-cell--info {
  color: #334155;
  font-size: 13px;
  text-align: center;
}

// 2. 维护类型的具体颜色定义
// 请根据你的设计稿调整这些颜色值
.is-removed { color: #991b1b; } // 深红 - 拆卸
.is-installed { color: #059669; } // 深绿 - 安装
.is-warning { color: #92400e; } // 深橙 - 维护
.is-info { color: #1e40af; } // 深蓝 - 巡检

// 3. 备注列样式 (参考文档)
.data-cell--remark {
  justify-content: flex-start;
  text-align: left;
  color: #64748b;
  font-size: 12px;
  padding: 0 12px;
}
</style>