<template>
  <view class="worksheet-table-panel">
    <view class="toolbar-wrapper">
      <MaintenanceRecordToolbar
          v-model="searchForm"
          @search="handleSearch"
          @reset="handleSearch"
          @refresh="fetchMaintenanceRecords"
          @add="handleAdd"
          @delete="handleDelete"
          @edit="handleEdit"
          :visible="isToolbarVisible"
      />
    </view>

    <XFloatingCollapseHandle v-if="isFloatingVisible"
        v-model="isToolbarVisible"
    />

    <view class="table-head">
      <text>{{ t("maintain.maintainTable.title") }}</text>
      <text class="table-head__meta">  {{ t('common.pagination.totalRecords', { total: pagination.total }) }}</text>
    </view>

    <scroll-view class="table-scroll" scroll-x scroll-y>
      <view class="data-table">
        <view class="data-row data-row--header">
          <text class="data-cell data-cell--index">{{ t("common.table.index") }}</text>
          <text class="data-cell data-cell--device">{{ t("maintain.maintainTable.deviceNumber") }}</text>
          <text class="data-cell data-cell--type">{{ t("maintain.maintainTable.type") }}</text>
          <text class="data-cell data-cell--time">{{ t("maintain.maintainTable.time") }}</text>
          <text class="data-cell data-cell--address">{{ t("maintain.maintainTable.address") }}</text>
          <text class="data-cell data-cell--status">{{ t("maintain.maintainTable.installMode") }}</text>
          <text class="data-cell data-cell--number">{{ t("maintain.maintainTable.tubeGroup") }}</text>
          <text class="data-cell data-cell--text">{{ t("maintain.maintainTable.tubeMaterial") }}</text>
          <text class="data-cell data-cell--text">{{ t("maintain.maintainTable.tubeBore") }}</text>
          <text class="data-cell data-cell--text">{{ t("maintain.maintainTable.remark") }}</text>
        </view>

        <view v-if="loading" class="loading-mask">{{ t('common.table.loading') }}</view>
        <view v-else-if="deviceList.length === 0" class="table-state">{{ t('common.table.empty') }}</view>

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
            {{ formatDate(record.maintainTime) || '-' }}
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
            {{
              record.installMode === 0
                  ? t("status.installMode.fixed")
                  : record.installMode === 1
                      ? t("status.installMode.mobile")
                      : '-'
            }}
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

    <XPaginationBar
        :current="pagination.current"
        :size="pagination.size"
        :total="pagination.total"
        @change-page="handlePageChange"
        @change-size="handlePageSizeChange"
    />
  </view>

  <XDynamicDialog
      v-model:visible="dialogVisible"
      v-model="formData"
      :schema="addSchema"
      :title="isEditMode ? t('maintain.page.edit.Maintenance') : t('maintain.page.addMaintenance')"
      @submit="handleSubmit"
      @cancel="dialogVisible = false"
  />
</template>
<script setup lang="ts">
import {computed, ref, watch} from 'vue';
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
import XFloatingCollapseHandle from "@/pages/device/components/x/XFloatingCollapseHandle.vue";
import XPaginationBar from "@/pages/device/components/x/XPaginationBar.vue";
import {createScopedT} from "@/i18n";
import {formatDate} from "@/utils/time";

const t = createScopedT("devicePage");
const isToolbarVisible = ref(true);
const isFloatingVisible = ref(false);

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
const addSchema = computed<FormSection[]>(() => [
    {
    title: t("maintain.addSchema.basicInfo.title"),
    fields: [
      {
        key: "deviceNumber",
        label: t("maintain.addSchema.basicInfo.deviceNumber"),
        type: "input",
        required: true
      },
      {
        key: "maintainType",
        label: t("maintain.addSchema.basicInfo.maintainType"),
        type: "select",
        required: true,
        options: [
          {
            label: t("maintain.addSchema.option.maintainType.remove"),
            value: 0
          },
          {
            label: t("maintain.addSchema.option.maintainType.install"),
            value: 1
          },
          {
            label: t("maintain.addSchema.option.maintainType.maintenance"),
            value: 2
          },
          {
            label: t("maintain.addSchema.option.maintainType.inspect"),
            value: 3
          }
        ]
      },
      {
        key: "maintainTime",
        label: t("maintain.addSchema.basicInfo.maintainTime"),
        type: "datetime",
        required: true
      },
      {
        key: "maintainAddress",
        label: t("maintain.addSchema.basicInfo.maintainAddress"),
        type: "input"
      },
      {
        key: "installMode",
        label: t("maintain.addSchema.basicInfo.installMode"),
        type: "select",
        options: [
          {
            label: t("maintain.addSchema.option.installMode.fixed"),
            value: 0
          },
          {
            label: t("maintain.addSchema.option.installMode.mobile"),
            value: 1
          }
        ]
      },
      {
        key: "tubeGroup",
        label: t("maintain.addSchema.basicInfo.tubeGroup"),
        type: "input"
      },
      {
        key: "tubeMaterial",
        label: t("maintain.addSchema.basicInfo.tubeMaterial"),
        type: "input"
      },
      {
        key: "tubeBore",
        label: t("maintain.addSchema.basicInfo.tubeBore"),
        type: "input"
      },
      {
        key: "remark",
        label: t("maintain.addSchema.basicInfo.remark"),
        type: "textarea"
      }
    ]
  },
  {
    title: t("maintain.addSchema.extendInfo.title"),
    fields: [
      {
        key: "maintainAccount",
        label: t("maintain.addSchema.extendInfo.maintainAccount"),
        type: "input"
      },
      {
        key: "maintainFeedback",
        label: t("maintain.addSchema.extendInfo.maintainFeedback"),
        type: "textarea",
        large: true
      },
      {
        key: "maintainCoordinate",
        label: t("maintain.addSchema.extendInfo.maintainCoordinate"),
        type: "input"
      }
    ]
  }
]);

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
function handlePageChange(page:number){
  pagination.value.current = page;
  fetchMaintenanceRecords();
}

function handlePageSizeChange(pageSize:number){
  pagination.value.size = pageSize;
  pagination.value.current = 1;
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
      title: e?.message || t("message.operationFailed"),
      icon: "error"
    });
  }
}

async function submitCreate(form: MaintenanceCreateForm) {
  const res = await createMaintenanceRecordT(form);

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

async function submitUpdate(form: MaintenanceCreateForm) {
  if (!editingId.value) return;

  const res = await updateMaintenanceRecordT(
    editingId.value,
      {...form}
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
    if (!selectedRecord.value?.id) return;

    uni.showModal({
      title: t("message.confirmDeleteTitle"),
      content: t("maintain.message.confirmDeleteTitle"),
      success: async (res) => {
        if (!res.confirm) return;

        await deleteMaintenanceRecordT(selectedRecord.value?.id ?? 0);

        await refreshList();

        uni.showToast({
          title: t("message.deleteSuccess"),
          icon: 'success'
        });

        selectedRecord.value = null;
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
  if (!selectedRecord.value) {
    uni.showToast({ title: t("message.selectRecord"), icon: 'none' });
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
  0: { label: t("status.maintain.remove"), className: 'is-removed' },
  1: { label: t("status.maintain.install"), className: 'is-installed' },
  2: { label: t("status.maintain.maintenance"), className: 'is-warning' },
  3: { label: t("status.maintain.inspect"), className: 'is-info' }
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

.worksheet-table-panel {
  //background: #ffffff;
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
  justify-content: center;
  text-align: left;
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

.toolbar-wrapper {
  padding-bottom: 12px;
}
</style>