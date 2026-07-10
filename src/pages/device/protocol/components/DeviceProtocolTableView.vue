<template>
  <view class="worksheet-table-panel">
    <view class="toolbar-wrapper">
      <DeviceProtocolToolbar
          @add="handleAdd"
          @delete="handleDelete"
          @edit="handleEdit"
          :visible="isToolbarVisible"
      />
    </view>

    <view class="table-head">
      <text>{{ t("deviceProtocol.table.title") }}</text>
      <text class="table-head__meta">  {{ t('common.pagination.totalRecords', { total: deviceProtocolList.length }) }}</text>
    </view>

    <scroll-view class="table-scroll" scroll-x scroll-y>
      <view class="data-table">
        <view class="data-row data-row--header">
          <text class="data-cell data-cell--index">{{ t("common.table.index") }}</text>
          <text class="data-cell">{{ t("deviceProtocol.table.protocolCode") }}</text>
          <text class="data-cell">{{ t("deviceProtocol.table.protocolName") }}</text>
          <text class="data-cell">{{ t("deviceProtocol.table.protocolVersion") }}</text>
          <text class="data-cell">{{ t("deviceProtocol.table.afn") }}</text>
          <text class="data-cell">{{ t("deviceProtocol.table.taskType") }}</text>
          <text class="data-cell">{{ t("deviceProtocol.table.contentPrefix") }}</text>
          <text class="data-cell">{{ t("deviceProtocol.table.priority") }}</text>
          <text class="data-cell">{{ t("deviceProtocol.table.enabled") }}</text>
          <text class="data-cell">{{ t("deviceProtocol.table.description") }}</text>
          <text class="data-cell">{{ t("deviceProtocol.table.updatedAt") }}</text>
        </view>

        <view v-if="loading" class="loading-mask">{{ t('common.table.loading') }}</view>
        <view v-else-if="deviceProtocolList.length === 0" class="table-state">{{ t('common.table.empty') }}</view>

        <view
            v-for="(record, index) in deviceProtocolList"
            :key="record.id"
            class="data-row"
            :class="{ 'data-row--active': selectedRecord?.id === record.id }"
            @click="selectRow(record)"
        >

          <text class="data-cell data-cell--index">
            {{ index + 1 }}
          </text>

          <text class="data-cell data-cell--remark"
                @mouseenter="showTooltip($event,record.protocolCode)"
                @mouseleave="hideTooltip">
            {{ record.protocolCode || '-' }}
          </text>

          <text class="data-cell data-cell--remark"
                @mouseenter="showTooltip($event,record.protocolName)"
                @mouseleave="hideTooltip">
            {{ record.protocolName || '-' }}
          </text>

          <text class="data-cell">
            {{ record.protocolVersion || '-' }}
          </text>

          <text class="data-cell">
            {{ record.afn || '-' }}
          </text>

          <text class="data-cell">
            {{ record.taskType || '-' }}
          </text>

          <text class="data-cell">
            {{ record.contentPrefix || '-' }}
          </text>

          <text class="data-cell">
            {{ record.priority ?? '-' }}
          </text>

          <text
              class="data-cell"
              :class="{
                'is-enabled': record.enabled,
                'is-disabled': !record.enabled
              }"
          >
            {{ record.enabled ? '启用' : '禁用' }}
          </text>

          <text class="data-cell data-cell--remark"
                @mouseenter="showTooltip($event,record.description)"
                @mouseleave="hideTooltip">
            {{ record.description || '-' }}
          </text>

          <text class="data-cell data-cell--time">
            {{ formatDate(record.updatedAt || '-') }}
          </text>

        </view>
      </view>
    </scroll-view>
    <view
        v-if="tooltipVisible"
        class="table-tooltip"
        :style="{
         left: tooltipX+'px',
         top: tooltipY+'px'
       }"
    >
      {{tooltipText}}
    </view>
  </view>

  <XDynamicDialog
      v-model:visible="dialogVisible"
      v-model="formData"
      :schema="addSchema"
      :title="isEditMode ? t('deviceProtocol.page.editProtocol') : t('deviceProtocol.page.addProtocol')"
      @submit="handleSubmit"
      @cancel="dialogVisible = false"
  />
</template>
<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import type {
  Device,
  MaintenanceRecord,
  MaintenanceCreateForm,
  DeviceProtocol,
  DeviceProtocolRelationVO, DeviceProtocolCreateFrom
} from '@/services/device/types';
import {
  createMaintenanceRecordT,
  deleteMaintenanceRecordT,
  getMaintenanceRecordPageT, updateMaintenanceRecordT
} from "@/services/device/maintenance.typed";
import type {FieldOption, FormSection} from "@/pages/device/components/x/types";
import XDynamicDialog from "@/pages/device/components/x/XDynamicDialog.vue";
import XPaginationBar from "@/pages/device/components/x/XPaginationBar.vue";
import {createScopedT} from "@/i18n";
import DeviceProtocolToolbar from "@/pages/device/protocol/components/DeviceProtocolToolbar.vue";
import {
  deleteDeviceProtocolT,
  getDeviceProtocolByDeviceId,
  getDeviceProtocolDetailByDeviceId,
  updateDeviceProtocolT
} from "@/services/device/protocol.typed";
import {formatDate} from "@/utils/time";
import {createDeviceProtocolT} from "@/services/device/info.typed";
import {getProtocolDefinitionList} from "@/services/data-receive/access";

const t = createScopedT("devicePage");
const isToolbarVisible = ref(true);

// ===== 数据 =====
const loading = ref(false);

const deviceProtocolList = ref<DeviceProtocolRelationVO[]>([]);

let currentRequestId = 0;

const props = defineProps<{
  deviceData: Partial<Device>;
}>();

const dialogVisible = ref(false);
const formData = ref<DeviceProtocolCreateFrom>({})
const isEditMode = ref(false);
const editingId = ref<number | null>(null);
const addSchema = computed<FormSection[]>(() => {
  return [
    {
      title: t("deviceProtocol.addSchema.basicInfo.title"),
      fields: [
        {
          key: "protocolId",
          label: t("deviceProtocol.addSchema.basicInfo.protocolId"),
          type: "select",
          required: true,
          options: protocolOptions.value
        },
        {
          key: "afn",
          label: t("deviceProtocol.addSchema.basicInfo.afn"),
          type: "input",
          required: true
        },
        {
          key: "taskType",
          label: t("deviceProtocol.addSchema.basicInfo.taskType"),
          type: "input",
          required: true
        },
        {
          key: "contentPrefix",
          label: t("deviceProtocol.addSchema.basicInfo.contentPrefix"),
          type: "input"
        },
        {
          key: "priority",
          label: t("deviceProtocol.addSchema.basicInfo.priority"),
          type: "input"
        },
        {
          key: "enabled",
          label: t("deviceProtocol.addSchema.basicInfo.enabled"),
          type: "select",
          options: [
            {
              label: "启用",
              value: true
            },
            {
              label: "禁用",
              value: false
            }
          ]
        }
      ]
    }
  ];
});

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

      // 4. 【重要】竞态处理：记录当前请求ID
      const requestId = ++currentRequestId;

      await fetchDeviceProtocols(requestId);
    },
    { immediate: true }
);

// ===== 选中行 =====
const selectedRecord = ref<DeviceProtocol | null>(null);

function selectRow(record: DeviceProtocolRelationVO) {
  selectedRecord.value = {
    id: record.id,
    afn: record.afn,
    taskType: record.taskType,
    contentPrefix: record.contentPrefix,
    priority: record.priority,
    enabled: record.enabled,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deviceId: record.deviceId,
    protocolId: record.protocolId
  };
}

// ===== 请求数据 =====
async function fetchDeviceProtocols(requestId?: number) {
  if (!props.deviceData?.id) return;

  loading.value = true;

  try {
    const res = await getDeviceProtocolDetailByDeviceId(
        props.deviceData.id
    );

    // 防止切换设备时旧请求覆盖新数据
    if (requestId && requestId !== currentRequestId) {
      return;
    }

    deviceProtocolList.value = res.data ?? [];

  } finally {
    loading.value = false;
  }
}

const protocolOptions = ref<FieldOption[]>([]);

async function fetchProtocolOptions() {
  const res = await getProtocolDefinitionList();

  protocolOptions.value = (res.data ?? [])
      .filter(item => item.id && item.protocolName)
      .map(item => ({
        label: item.protocolName!,
        value: item.id!
      }));
}

function handleAdd() {
  isEditMode.value = false;
  editingId.value = null;

  fetchProtocolOptions();

  formData.value = {
    deviceId: props.deviceData?.id,
    protocolId: undefined,
    afn: "",
    taskType: "",
    contentPrefix: "",
    priority: 0,
    enabled: true,
    createdAt: undefined,
    updatedAt: undefined,
    isDeleted: false
  };

  dialogVisible.value = true;
}

async function handleSubmit(form: DeviceProtocolCreateFrom) {
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

async function submitCreate(form: DeviceProtocolCreateFrom) {
  const res = await createDeviceProtocolT(form);

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

async function submitUpdate(form: DeviceProtocolCreateFrom) {
  if (!editingId.value) return;

  const res = await updateDeviceProtocolT(
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
      content: t("deviceProtocol.message.confirmDeleteTitle"),
      success: async (res) => {
        if (!res.confirm) return;

        await deleteDeviceProtocolT(selectedRecord.value?.id ?? 0);

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

async function refreshList() {
  await fetchDeviceProtocols();
}

const tooltipText = ref('');
const tooltipVisible = ref(false);
const tooltipX = ref(0);
const tooltipY = ref(0);

function showTooltip(e:any,text?:string){
  if(!text || text === '-') return;
  tooltipText.value=text;
  tooltipX.value =
      e.clientX ??
      e.detail?.x ??
      0;
  tooltipY.value =
      (e.clientY ??
          e.detail?.y ??
          0) + 10;
  tooltipVisible.value=true;
}

function hideTooltip(){
  tooltipVisible.value = false;
}

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

.table-tooltip {
  position: fixed;
  z-index: 9999;
  max-width: 360px;
  min-width: 120px;
  padding: 10px 14px;
  color: #24384d;
  font-size: 13px;
  line-height: 20px;
  background: #fff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(35,72,104,.15);
  white-space: normal;
  word-break: break-all;
  pointer-events: none;
  animation: tooltip-show .15s ease-out;
}

.table-tooltip::before {
  content: "";
  position: absolute;
  top: -6px;
  left: 18px;
  width: 10px;
  height: 10px;
  background: #fff;
  border-left: 1px solid #d8e5ef;
  border-top: 1px solid #d8e5ef;
  transform: rotate(45deg);
}

@keyframes tooltip-show {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>