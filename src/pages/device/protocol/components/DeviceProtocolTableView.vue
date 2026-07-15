<template>
  <view class="page-container">
    <view class="data-table-container">
      <view class="table-head">
        <text>{{ t("deviceProtocol.table.title") }}</text>
        <text class="table-head__meta">  {{ t('common.pagination.totalRecords', { total: deviceProtocolList.length }) }}</text>
      </view>

      <scroll-view class="table-scroll" scroll-x scroll-y>
        <view class="data-table">
          <view class="data-row data-row--header">
            <text class="data-cell data-cell--index">{{ t("common.table.index") }}</text>
            <text class="data-cell data-cell--large">{{ t("deviceProtocol.table.protocolCode") }}</text>
            <text class="data-cell data-cell--large">{{ t("deviceProtocol.table.protocolName") }}</text>
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

            <text class="data-cell data-cell--remark data-cell--large"
            >
              {{ record.protocolCode || '-' }}
            </text>
            <!--                  @mouseenter="showTooltip($event,record.protocolName)"-->
            <!--                  @mouseleave="hideTooltip"-->
            <text class="data-cell data-cell--remark data-cell--large"
            >
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

<!--            @mouseenter="showTooltip($event,record.description)"-->
<!--            @mouseleave="hideTooltip"-->
            <text class="data-cell data-cell--remark"
            >
              {{ record.description || '-' }}
            </text>

            <text class="data-cell data-cell--time">
              {{ formatDate(record.updatedAt || '-') }}
            </text>

          </view>
        </view>
      </scroll-view>
      <XTooltip
          :visible="tooltipVisible"
          :text="tooltipText"
          :x="tooltipX"
          :y="tooltipY"
      />
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

  <XEntityDetailDialog
      v-model="detailData"
      v-model:visible="detailVisible"
      title="协议绑定详情"
      :schema="deviceProtocolRelationDetailSchema"
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
import XTooltip from "@/pages/device/components/x/XTooltip.vue";
import XEntityDetailDialog from "@/pages/device/components/x/XEntityDetailDialog.vue";

const t = createScopedT("devicePage");

defineExpose({
  handleAdd,
  handleEdit,
  handleDelete,
  handleShowDetail
});

// ===== 数据 =====
const loading = ref(false);

const deviceProtocolList = ref<DeviceProtocolRelationVO[]>([]);

let currentRequestId = 0;

const props = withDefaults(
    defineProps<{
      deviceData: Partial<Device>;
      query?: {
        startTime?: string;
        endTime?: string;
      };
    }>(),
    {
      query:()=>({
        startTime:"",
        endTime:""
      })
    }
);

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
    [
      () => props.deviceData?.deviceNumber,
      () => props.query?.startTime,
      () => props.query?.endTime,
    ],
    async () => {
      if (!props.deviceData?.deviceNumber) return;

      await fetchDeviceProtocols();

    },
    {
      immediate: true
    }
);

// ===== 选中行 =====
const selectedRecord = ref<DeviceProtocolRelationVO | null>(null);

function selectRow(record: DeviceProtocolRelationVO) {
  if(!record) return;
  selectedRecord.value = {
    ...record
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
    selectRow(deviceProtocolList.value[0] || null);
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

/**
 * 设备协议关系详情表单配置
 */
const deviceProtocolRelationDetailSchema: FormSection[] = [
  {
    titleKey:"deviceProtocol.table.basicInfo",
    fields:[
      {
        key:"deviceId",
        labelKey:"deviceProtocol.table.deviceId",
        type:"text"
      },
      {
        key:"protocolId",
        labelKey:"deviceProtocol.table.protocolId",
        type:"text"
      }
    ]
  },
  {
    titleKey:"deviceProtocol.table.protocolInfo",
    fields:[
      {
        key:"protocolCode",
        labelKey:"deviceProtocol.table.protocolCode",
        type:"text"
      },
      {
        key:"protocolName",
        labelKey:"deviceProtocol.table.protocolName",
        type:"text"
      },
      {
        key:"protocolVersion",
        labelKey:"deviceProtocol.table.protocolVersion",
        type:"text"
      },
      {
        key:"description",
        labelKey:"deviceProtocol.table.description",
        type:"text",
        layout:"full"
      }
    ]
  },
  {
    titleKey:"deviceProtocol.table.bindingRule",
    fields:[
      {
        key:"afn",
        labelKey:"deviceProtocol.table.afn",
        type:"text"
      },
      {
        key:"taskType",
        labelKey:"deviceProtocol.table.taskType",
        type:"text"
      },
      {
        key:"contentPrefix",
        labelKey:"deviceProtocol.table.contentPrefix",
        type:"text",
        layout:"full"
      },
      {
        key:"priority",
        labelKey:"deviceProtocol.table.priority",
        type:"text"
      },
      {
        key:"enabled",
        labelKey:"deviceProtocol.table.enabled",
        type:"tag",
        options:[
          {
            labelKey:"status.status.enabled",
            value:true
          },
          {
            labelKey:"status.status.disabled",
            value:false
          }
        ]
      }
    ]
  },
  {
    titleKey:"deviceProtocol.table.timeInfo",
    fields:[
      {
        key:"createdAt",
        labelKey:"deviceProtocol.table.createdAt",
        type:"datetime"
      },
      {
        key:"updatedAt",
        labelKey:"deviceProtocol.table.updatedAt",
        type:"datetime"
      }
    ]
  }
];
const detailVisible = ref(false);
const detailData = ref<DeviceProtocolRelationVO | null>(null);

function handleShowDetail(){
  if (!selectedRecord.value) {
    uni.showToast({
      title:t("message.selectRecord"),
      icon:"none"
    });
    return;
  }

  detailData.value = selectedRecord.value;
  detailVisible.value = true;
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
.data-cell--large{
  width: 240px;
}
</style>