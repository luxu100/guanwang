<template>
  <view class="page-container">
    <view class="data-table-container">
      <view class="table-head">
        <text>{{ t("maintain.maintainTable.title") }}</text>
        <text class="table-head__meta">  {{ t('common.pagination.totalRecords', { total: pagination.total }) }}</text>
      </view>

      <XDataTable
          :columns="columns"
          :data="recordList"
          :show-index="true"
          id-key="id"
          v-model:selected="selectedId"
          @row-click="selectRow"
      >
        <template #footer>
          <XPaginationBar
              :current="pagination.current"
              :size="pagination.size"
              :total="pagination.total"
              @change-page="handlePageChange"
              @change-size="handlePageSizeChange"
          />
        </template>
      </XDataTable>
    </view>
  </view>

  <XDynamicDialog
      v-model:visible="dialogVisible"
      v-model="formData"
      :schema="addSchema"
      :title="isEditMode ? t('maintain.page.editMaintenance') : t('maintain.page.addMaintenance')"
      @submit="handleSubmit"
      @cancel="dialogVisible = false"
  />

  <XEntityDetailDialog
      v-model="detailData"
      v-model:visible="detailVisible"
      :title="t('maintain.maintainTable.title')"
      :schema="maintenanceRecordDetailSchema"
  />
</template>
<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import type {Device, MaintenanceRecord, MaintenanceCreateForm, DeviceProtocolRelationVO} from '@/services/device/types';
import type { Pagination } from '@/types/api';
import {
  createMaintenanceRecordT,
  deleteMaintenanceRecordT,
  getMaintenanceRecordPageT, updateMaintenanceRecordT
} from "@/services/device/maintenance.typed";
import type {FormSection, XDataColumn} from "@/pages/device/components/x/types";
import XDynamicDialog from "@/pages/device/components/x/dialog/XDynamicDialog.vue";
import XPaginationBar from "@/pages/device/components/x/table/XPaginationBar.vue";
import {createScopedT} from "@/i18n";
import {formatDate} from "@/utils/time";
import XEntityDetailDialog from "@/pages/device/components/x/dialog/XEntityDetailDialog.vue";
import {
  installModeOptions,
  installStateOptions,
  maintainTypeOptions,
  protocolColumnsMap
} from "@/pages/device/components/common";
import {updateDeviceT} from "@/services/device/info.typed";
import XDataTable from "@/pages/device/components/x/table/XDataTable.vue";
import {getFileDetail} from "@/services/device/sysFile";
import {normalizeUrl} from "@/utils/request";

const t = createScopedT("devicePage");

defineExpose({
  handleAdd,
  handleEdit,
  handleDelete,
  handleShowDetail
});

const emit = defineEmits<{
  (e: "deviceUpdated", deviceId: number): void;
}>();

// ===== 数据 =====
const loading = ref(false);

const recordList = ref<MaintenanceRecord[]>([]);

const pagination = ref<Pagination>({
  current: 1,
  size: 10,
  total: 0
});

let currentRequestId = 0;

const props = withDefaults(
    defineProps<{
      deviceData: Partial<Device>;
      query?: {
        maintainType?: number | null;
        startTime?: string;
        endTime?: string;
      };
    }>(),
    {
      query:()=>({
        maintainType:null,
        startTime:"",
        endTime:""
      })
    }
);

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
        disabled: true,
        placeholder: t("maintain.addSchema.basicInfo.deviceNumberPlaceholder")
      },
      {
        key: "deviceAlias",
        label: t("maintain.addSchema.basicInfo.deviceAlias"),
        type: "input",
        disabled: true,
        placeholder: t("maintain.addSchema.basicInfo.deviceAliasPlaceholder")
      },
      {
        key: "valveNumber",
        label: t("maintain.addSchema.basicInfo.valveNumber"),
        type: "input",
        disabled: true,
        placeholder: t("maintain.addSchema.basicInfo.valveNumberPlaceholder")
      },
      {
        key: "valveName",
        label: t("maintain.addSchema.basicInfo.valveName"),
        type: "input",
        disabled: true,
        placeholder: t("maintain.addSchema.basicInfo.valveNamePlaceholder")
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
        key: "coordinate",
        label: t("maintain.addSchema.basicInfo.maintainCoordinate"),
        type: "location"
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
        key: "installState",
        label: t("maintain.addSchema.basicInfo.installState"),
        type: "select",
        options: [
          {
            label: t("maintain.addSchema.option.installState.uninstalled"),
            value: 0
          },
          {
            label: t("maintain.addSchema.option.installState.installed"),
            value: 1
          }
        ]
      },
      {
        key: "uninstallType",
        label: t("maintain.addSchema.basicInfo.uninstallType"),
        type: "select",
        options: [
          {
            label: t("maintain.addSchema.option.uninstallType.normal"),
            value: 0
          },
          {
            label: t("maintain.addSchema.option.uninstallType.fault"),
            value: 1
          },
          {
            label: t("maintain.addSchema.option.uninstallType.other"),
            value: 2
          }
        ]
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
        type: "input",
        disabled: true
      },
      {
        key: "maintainFeedback",
        label: t("maintain.addSchema.extendInfo.maintainFeedback"),
        type: "textarea",
        large: true
      },
      {
        key: "maintainPicture",
        label: t("maintain.addSchema.extendInfo.maintainPicture"),
        type: "photo"
      }
    ]
  }
]);
const fixedColumns:XDataColumn[]=[
  {key:'deviceNumber',labelKey:'maintain.maintainTable.deviceNumber',width:180,className:'data-cell--device'},
  {key:'maintainType',labelKey:'maintain.maintainTable.type',width:120,options:maintainTypeOptions},
  {key:'maintainTime',labelKey:'maintain.maintainTable.time',width:180,className:'data-cell--time',formatter:v=>formatDate(v||'-')},
  {key:'maintainAddress',labelKey:'maintain.maintainTable.address',width:240,className:'data-cell--remark',formatter:v=>v||'-',tooltip:true},
  {key:'maintainCoordinate',labelKey:'maintain.maintainTable.coordinate',width:160,className:'data-cell--coord',bodyClassName:'data-cell--link',type:'coord'},
  {key:'maintainAccount',labelKey:'maintain.maintainTable.maintainAccount',width:160,className:'data-cell--text',formatter:v=>v||'-'},
  {key:'maintainPicture',labelKey:'maintain.maintainTable.maintainPicture',width:140,bodyClassName:'data-cell--link',type:'image',formatter:v=>v?t("common.viewImages",{count:getPictureList(v).length}):'-'},
  {key:'installMode',labelKey:'maintain.maintainTable.installMode',width:140,options:installModeOptions},
  {key:'tubeGroup',labelKey:'maintain.maintainTable.tubeGroup',width:160,className:'data-cell--number',formatter:v=>v??'-'},
  {key:'tubeMaterial',labelKey:'maintain.maintainTable.tubeMaterial',width:160,className:'data-cell--text',formatter:v=>v||'-'},
  {key:'tubeBore',labelKey:'maintain.maintainTable.tubeBore',width:120,className:'data-cell--number',formatter:v=>v??'-'},
  {key:'remark',labelKey:'maintain.maintainTable.remark',width:240,className:'data-cell--remark',formatter:v=>v||'-',tooltip:true}
];

const deviceParameterDynamicColumns:XDataColumn[]=[
  ...protocolColumnsMap[11],
  ...protocolColumnsMap[12],
  ...protocolColumnsMap[13]
];

const columns=computed<XDataColumn[]>(()=>{
  const keys = new Set(Object.keys(recordList.value[0] ?? {}));
  return [
    ...fixedColumns,
    ...deviceParameterDynamicColumns.filter(col=>keys.has(col.key))
  ];
});

watch(
    [
      () => props.deviceData?.deviceNumber,
      () => props.query?.maintainType,
      () => props.query?.startTime,
      () => props.query?.endTime,
    ],
    async () => {
      if (!props.deviceData?.deviceNumber) return;

      pagination.value.current = 1;

      const requestId = ++currentRequestId;

      await fetchMaintenanceRecords(requestId);

    },
    {
      immediate: true
    }
);

// ===== 选中行 =====
const selectedRecord = ref<MaintenanceRecord | null>(null);
const selectedId = ref<number|null>(null);

function selectRow(record: MaintenanceRecord) {
  selectedRecord.value = record;
  selectedId.value = record?.id ?? null;
}

// ===== 请求数据 =====
async function fetchMaintenanceRecords(requestId?: number) {
  loading.value = true;

  try {
    const res = await getMaintenanceRecordPageT({
      pageNum: pagination.value.current,
      pageSize: pagination.value.size,
      deviceNumber: props.deviceData.deviceNumber || undefined,
      maintainType: props.query.maintainType,
      startTime: props.query.startTime || undefined,
      endTime: props.query.endTime || undefined,
    });

    // 如果在 await 期间触发了新的 watch，requestId 会变大，当前的响应应该被丢弃
    if (requestId && requestId !== currentRequestId) {
      return;
    }

    const pageData = res.data;

    recordList.value = pageData?.records ?? [];
    pagination.value.total = pageData?.total ?? 0;
    pagination.value.current = pageData?.current ?? 1;
    pagination.value.size = pageData?.size ?? 10;

    selectRow(recordList.value[0] || null);

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
    // 设备信息
    deviceNumber: props.deviceData?.deviceNumber || "",
    deviceAlias: props.deviceData?.deviceAlias || "",
    valveNumber: props.deviceData?.valveNumber || "",

    // 维护信息
    maintainType: undefined,
    maintainTime: "",
    maintainAddress: "",
    maintainCoordinate: "",
    coordinate: "",

    // 安装信息
    installMode: undefined,
    installState: undefined,

    // 维护人员
    maintainAccount:
        uni.getStorageSync("userInfo")?.username || "",

    // 维护结果
    maintainFeedback: "",
    maintainPicture: "",

    // 拆卸信息
    uninstallType: undefined,

    // 其他
    remark: ""
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

async function updateDeviceInfo(form: MaintenanceCreateForm) {
  /**
   * 此处应该调用设备更新接口，同步更新设备安装坐标
   */
  // const tempDevice = {...props.deviceData}
  // tempDevice.installState = null;
  // if(form.maintainType === 1 && form.coordinate){
  //   tempDevice.installLongitude = parseFloat(form.coordinate.split(",")[0]);
  //   tempDevice.installLatitude = parseFloat(form.coordinate.split(",")[1]);
  // }else{
  //   tempDevice.installLongitude = 999;
  //   tempDevice.installLatitude = 999;
  // }
  // const ans = updateDeviceT(props.deviceData.id!,{...tempDevice});
  emit("deviceUpdated",props.deviceData.id!);
}

async function submitCreate(form: MaintenanceCreateForm) {
  if(form.coordinate) form.maintainCoordinate = form.coordinate;
  const res = await createMaintenanceRecordT(form);

  if (res.code === 200) {
    updateDeviceInfo(form);
  }else{
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
  if(form.coordinate) form.maintainCoordinate = form.coordinate;
  if (!editingId.value) return;

  const res = await updateMaintenanceRecordT(
    editingId.value,
      {...form}
  );

  if (res.code === 200) {
    updateDeviceInfo(form);
  }else{
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
      content: t("maintain.message.confirmDeleteContent"),
      success: async (res) => {
        if (!res.confirm) return;

        await deleteMaintenanceRecordT(selectedRecord.value?.id ?? 0);

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

  formData.value = { ...selectedRecord.value }

  if(selectedRecord.value.maintainCoordinate){
    formData.value.coordinate = selectedRecord.value.maintainCoordinate;
  }

  dialogVisible.value = true;
}

async function refreshList({ resetPage = false } = {}) {
  if (resetPage) pagination.value.current = 1;

  await fetchMaintenanceRecords();
}
/**
 * 维护记录详情表单配置
 */
const maintenanceRecordDetailSchema: FormSection[] = [
  {
    titleKey:"maintain.maintainTable.deviceInfo",
    fields:[
      {
        key:"deviceNumber",
        labelKey:"maintain.maintainTable.deviceNumber",
        type:"text"
      },
      {
        key:"deviceAlias",
        labelKey:"maintain.maintainTable.deviceAlias",
        type:"text"
      }
    ]
  },
  {
    titleKey:"maintain.maintainTable.maintainInfo",
    fields:[
      {
        key:"maintainType",
        labelKey:"maintain.maintainTable.type",
        type:"tag",
        options:maintainTypeOptions
      },
      {
        key:"maintainTime",
        labelKey:"maintain.maintainTable.time",
        type:"datetime"
      },
      {
        key:"maintainAddress",
        labelKey:"maintain.maintainTable.address",
        type:"text",
        layout:"full"
      },
      {
        key:"maintainCoordinate",
        labelKey:"maintain.maintainTable.coordinate",
        type:"text",
        layout:"full"
      }
    ]
  },
  {
    titleKey:"maintain.maintainTable.installInfo",
    fields:[
      {
        key:"installMode",
        labelKey:"maintain.maintainTable.installMode",
        type:"tag",
        options:installStateOptions
      },
      {
        key:"installState",
        labelKey:"maintain.maintainTable.installState",
        type:"tag",
        options:installStateOptions
      }
    ]
  },
  {
    titleKey:"maintain.maintainTable.maintainer",
    fields:[
      {
        key:"maintainAccount",
        labelKey:"maintain.maintainTable.maintainer",
        type:"text"
      }
    ]
  },
  {
    titleKey:"maintain.maintainTable.result",
    fields:[
      {
        key:"maintainFeedback",
        labelKey:"maintain.maintainTable.feedback",
        type:"text",
        layout:"full"
      },
      {
        key:"maintainPicture",
        labelKey:"maintain.maintainTable.maintainPicture",
        type:"image",
        layout:"full",
        imageResolver:async(value)=>{
          if(!value){
            return [];
          }
          const ids=value
              .split(",")
              .map((id:string)=>id.trim())
              .filter(Boolean);
          const list = await Promise.all(
              ids.map((id:string)=>getFileDetail(Number(id)))
          );
          return list
              .filter(item=>item.data)
              .map(item=>{
                const path=item.data.filePath;
                return path.startsWith("http")
                    ? path
                    : normalizeUrl(path);
              });
        }
      }
    ]
  },
  {
    titleKey:"maintain.maintainTable.tubeInfo",
    fields:[
      {
        key:"tubeGroup",
        labelKey:"maintain.maintainTable.tubeGroup",
        type:"text"
      },
      {
        key:"tubeMaterial",
        labelKey:"maintain.maintainTable.tubeMaterial",
        type:"text"
      },
      {
        key:"tubeBore",
        labelKey:"maintain.maintainTable.tubeBore",
        type:"text"
      },
      {
        key:"tubeOrder",
        labelKey:"maintain.maintainTable.tubeOrder",
        type:"text"
      }
    ]
  },
  {
    titleKey:"maintain.maintainTable.valveInfo",
    fields:[
      {
        key:"valveNumber",
        labelKey:"maintain.maintainTable.valveNumber",
        type:"text"
      },
      {
        key:"valveName",
        labelKey:"maintain.maintainTable.valveName",
        type:"text"
      }
    ]
  },
  {
    titleKey:"maintain.maintainTable.uninstallInfo",
    fields:[
      {
        key:"uninstallType",
        labelKey:"maintain.maintainTable.uninstallType",
        type:"tag",
        options:maintainTypeOptions
      }
    ]
  },
  {
    titleKey:"maintain.maintainTable.otherInfo",
    fields:[
      {
        key:"remark",
        labelKey:"maintain.maintainTable.remark",
        type:"text",
        layout:"full"
      }
    ]
  },
  {
    titleKey:"maintain.maintainTable.timeInfo",
    fields:[
      {
        key:"createdAt",
        labelKey:"maintain.maintainTable.createdAt",
        type:"datetime"
      },
      {
        key:"updatedAt",
        labelKey:"maintain.maintainTable.updatedAt",
        type:"datetime"
      }
    ]
  }
];

const detailVisible = ref(false);
const detailData = ref<MaintenanceRecord | null>(null);

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

function getPictureList(picture?:string){
  return picture
      ? picture.split(",").filter(Boolean)
      : [];
}
</script>
<style scoped lang="scss">
@import "@/pages/device/components/x/common/status.css";
@import "@/pages/device/components/x/table/styles/table-cell.css";
@import "@/pages/device/components/x/table/styles/table.css";
@import "@/pages/device/components/x/table/styles/table-row.css";
.toolbar-wrapper {
  padding-bottom: 12px;
}
</style>