<template>
  <view class="toolbar-wrapper">
    <DeviceProtocolToolbar
        @add="handleAdd"
        @delete="handleDelete"
        @edit="handleEdit"
        :visible="isToolbarVisible"
    />
  </view>
  <view class="data-table-container">
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

          <text class="data-cell">
            <text
                class="status-tag"
                :class="{
                  'status-tag--success': record.enabled,
                  'status-tag--danger': !record.enabled
                }"
            >
              {{ record.enabled ? t('status.status.enabled') : t('status.status.disable') }}
            </text>
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
@import "@/pages/device/components/x/status.css";
@import "@/pages/device/components/x/table-cell.css";
@import "@/pages/device/components/x/table.css";
@import "@/pages/device/components/x/table-row.css";

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