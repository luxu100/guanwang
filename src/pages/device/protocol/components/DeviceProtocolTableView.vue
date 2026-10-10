<template>
  <view class="page-container">
    <view class="data-table-container">
      <view class="table-head">
        <text>{{ t("deviceProtocol.table.title") }}</text>
        <text class="table-head__meta">  {{ t('common.pagination.totalRecords', { total: deviceProtocolList.length }) }}</text>
      </view>
      <view class="scene-filter">
        <text>{{ t('deviceProtocol.table.scene') }}</text>
        <select v-model="sceneFilter" :aria-label="t('deviceProtocol.table.scene')">
          <option v-for="option in sceneOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
        <image v-if="loading" src="/static/icons/loadin_minior.svg" mode="aspectFit" />
      </view>

      <XDataTable
          :columns="columns"
          :data="deviceProtocolList"
          :show-index="true"
          id-key="id"
          v-model:selected="selectedId"
          @row-click="selectRow"
      />
    </view>
  </view>

  <XDynamicDialog
      v-model:visible="dialogVisible"
      v-model="formData"
      :schema="addSchema"
      :title="isEditMode ? t('deviceProtocol.page.editProtocol') : t('deviceProtocol.page.addProtocol')"
      :submit-handler="handleSubmit"
      @field-change="handleBindingFieldChange"
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
  DeviceProtocolRelationVO, DeviceProtocolCreateFrom
} from '@/services/device/types';
import type {FieldOption, FormSection, XDataColumn} from "@/pages/device/components/x/types";
import XDynamicDialog from "@/pages/device/components/x/dialog/XDynamicDialog.vue";
import {createScopedT, useI18n} from "@/i18n";
import {
  deleteDeviceProtocolT,
  getDeviceProtocolDetailByDeviceId,
  updateDeviceProtocolT
} from "@/services/device/protocol.typed";
import {createDeviceProtocolT} from "@/services/device/info.typed";
import {getProtocolDefinitionList} from "@/services/data-receive/access";
import XEntityDetailDialog from "@/pages/device/components/x/dialog/XEntityDetailDialog.vue";
import {formatDate} from "@/utils/time";
import {confirmAction} from "@/utils/confirmAction";
import XDataTable from "@/pages/device/components/x/table/XDataTable.vue";
import {enableStateBooleanOptions} from "@/pages/device/components/common";
import { bindingSceneOptions, bindingSceneLabel, REALTIME_BINDING_RULES, assertProtocolResponse, type BindingSceneQuery } from "@/services/device/protocolBinding";

const t = createScopedT("devicePage");
const { locale } = useI18n();
const sceneOptions = computed(() => bindingSceneOptions(locale.value === 'en-US', true));
const sceneFilter = ref<BindingSceneQuery>('ALL');

defineExpose({
  handleAdd,
  handleEdit,
  handleDelete,
  handleShowDetail
});

// ===== 数据 =====
const loading = ref(false);
const deviceProtocolList = ref<DeviceProtocolRelationVO[]>([]);
const columns:XDataColumn[]=[
  {key:'scene',labelKey:'deviceProtocol.table.scene',width:220,formatter:v=>bindingSceneLabel(v, locale.value === 'en-US')},
  {key:'expectedPayloadBytes',labelKey:'deviceProtocol.table.expectedPayloadBytes',width:160,formatter:v=>v??'-'},
  {key:'protocolCode',labelKey:'deviceProtocol.table.protocolCode',width:240,className:'data-cell--remark',tooltip:true},
  {key:'protocolName',labelKey:'deviceProtocol.table.protocolName',width:240,className:'data-cell--remark',tooltip:true},
  {key:'protocolVersion',labelKey:'deviceProtocol.table.protocolVersion',width:160,className:'data-cell--text'},
  {key:'afn',labelKey:'deviceProtocol.table.afn',width:120,className:'data-cell--text'},
  {key:'taskType',labelKey:'deviceProtocol.table.taskType',width:120,className:'data-cell--text'},
  {key:'contentPrefix',labelKey:'deviceProtocol.table.contentPrefix',width:160,className:'data-cell--text'},
  {key:'priority',labelKey:'deviceProtocol.table.priority',width:100,className:'data-cell--number',formatter:v=>v??'-'},
  {key:'enabled',labelKey:'deviceProtocol.table.enabled',width:120,options:enableStateBooleanOptions},
  {key:'description',labelKey:'deviceProtocol.table.description',width:240,className:'data-cell--remark',formatter:v=>v||'-',tooltip:true},
  {key:'updatedAt',labelKey:'deviceProtocol.table.updatedAt',width:180,className:'data-cell--time',formatter:v=>formatDate(v||'-')}
];

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
          key: "scene", label: t("deviceProtocol.table.scene"), type: "select", required: true,
          options: bindingSceneOptions(locale.value === 'en-US'),
          disabled: isEditMode.value && Boolean(selectedRecord.value?.scene),
        },
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
          disabled: formData.value.scene === 'APP_REALTIME_SINGLE'
        },
        {
          key: "taskType",
          label: t("deviceProtocol.addSchema.basicInfo.taskType"),
          type: "input",
          disabled: formData.value.scene === 'APP_REALTIME_SINGLE'
        },
        {
          key: "contentPrefix",
          label: t("deviceProtocol.addSchema.basicInfo.contentPrefix"),
          type: "input",
          disabled: formData.value.scene === 'APP_REALTIME_SINGLE'
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
      () => sceneFilter.value,
    ],
    async () => {
      if (!props.deviceData?.deviceNumber) return;

      await fetchDeviceProtocols();

    },
    {
      immediate: true
    }
);

function handleBindingFieldChange(key: string, value: unknown) {
  if (key === 'scene') Object.assign(formData.value, value === 'APP_REALTIME_SINGLE' ? REALTIME_BINDING_RULES : { afn: '', taskType: '', contentPrefix: '' });
}

// ===== 选中行 =====
const selectedRecord = ref<DeviceProtocolRelationVO | null>(null);
const selectedId = ref<number | null>(null);

function selectRow(record: DeviceProtocolRelationVO | null) {
  if(!record) { selectedRecord.value = null; selectedId.value = null; return; }
  selectedRecord.value = {
    ...record
  };
  selectedId.value = record.id ?? null;
}

// ===== 请求数据 =====
async function fetchDeviceProtocols(requestId?: number) {
  if (!props.deviceData?.id) return;

  loading.value = true;
  const current = ++currentRequestId;

  try {
    const res = await getDeviceProtocolDetailByDeviceId(
        props.deviceData.id, sceneFilter.value
    );

    // 防止切换设备时旧请求覆盖新数据
    if (current !== currentRequestId) {
      return;
    }

    deviceProtocolList.value = res.data ?? [];
    selectRow(deviceProtocolList.value[0] || null);
  } catch (error: any) {
    if (current !== currentRequestId) return;
    deviceProtocolList.value = [];
    selectedRecord.value = null;
    selectedId.value = null;
    uni.showToast({ title: error?.msg || error?.message || t('message.operationFailed'), icon: 'none' });
  } finally {
    if (current === currentRequestId) loading.value = false;
  }
}

const protocolOptions = ref<FieldOption[]>([]);

async function fetchProtocolOptions() {
  const res = await getProtocolDefinitionList();
  assertProtocolResponse(res);

  protocolOptions.value = (res.data ?? [])
      .filter(item => item.id && item.enabled === true)
      .map(item => ({
        label: `${item.protocolCode || item.protocolName} · ${item.id}`,
        value: item.id!
      }));
}

async function handleAdd() {
  isEditMode.value = false;
  editingId.value = null;

  try { await fetchProtocolOptions(); } catch (error: any) {
    uni.showToast({ title: error?.message || t('message.operationFailed'), icon: 'none' }); return;
  }

  formData.value = {
    deviceId: props.deviceData?.id,
    protocolId: undefined,
    scene: '',
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
  if (isEditMode.value && form.scene === 'CLOUD' && ['afn', 'taskType', 'contentPrefix'].some(key =>
    Boolean((selectedRecord.value as Record<string, any> | null)?.[key]) && (form as Record<string, any>)[key] === ''
  )) {
    const confirmed = await confirmAction({
      title: locale.value === 'en-US' ? 'Confirm wildcard matching' : '确认扩大匹配范围',
      content: locale.value === 'en-US' ? 'Clearing matching conditions broadens this cloud binding. Continue?' : '清空匹配条件会扩大此云平台绑定的匹配范围，确定继续吗？',
    });
    if (!confirmed) throw new Error(locale.value === 'en-US' ? 'Save cancelled' : '已取消保存');
  }
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
      title: e?.msg || e?.message || t("message.operationFailed"),
      icon: "error"
    });
    throw e;
  }
}

async function submitCreate(form: DeviceProtocolCreateFrom) {
  const res = await createDeviceProtocolT({ ...form, scene: form.scene || undefined });

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
      {...form, scene: form.scene || undefined}
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
        selectedId.value = null;
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

  try { await fetchProtocolOptions(); } catch (error: any) {
    uni.showToast({ title: error?.message || t('message.operationFailed'), icon: 'none' }); return;
  }

  formData.value = { ...selectedRecord.value }

  dialogVisible.value = true;
}

async function refreshList() {
  await fetchDeviceProtocols();
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
      { key: "scene", labelKey: "deviceProtocol.table.scene", type: "text", formatter: value => bindingSceneLabel(value, locale.value === 'en-US') },
      { key: "expectedPayloadBytes", labelKey: "deviceProtocol.table.expectedPayloadBytes", type: "text", formatter: value => value == null ? '-' : String(value) },
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
@import "@/pages/device/components/x/common/status.css";
@import "@/pages/device/components/x/table/styles/table-cell.css";
@import "@/pages/device/components/x/table/styles/table.css";
@import "@/pages/device/components/x/table/styles/table-row.css";
.scene-filter { display: flex; align-items: center; gap: 12px; padding: 12px 18px; font-size: 14px; }
.scene-filter select { height: 34px; padding: 0 10px; border: 1px solid #d0d9e4; border-radius: 4px; font-family: inherit; background: #fff; }
.scene-filter image { width: 24px; height: 24px; }
</style>
