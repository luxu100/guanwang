<template>
  <view class="data-table-container">
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

          <text class="data-cell data-cell--type">
            <text
                class="status-tag"
                :class="getMaintainTypeMeta(record.maintainType).className"
            >
              {{ getMaintainTypeMeta(record.maintainType).label }}
            </text>
          </text>

          <text class="data-cell data-cell--time">
            {{ formatDate(record.maintainTime) || '-' }}
          </text>

          <text class="data-cell data-cell--address">
            {{ record.maintainAddress || '-' }}
          </text>

          <text class="data-cell data-cell--status">
            <text
                class="status-tag"
                :class="{
                  'status-tag--success': record.installMode === 0,
                  'status-tag--warning': record.installMode === 1
              }"
            >
              {{
                record.installMode === 0
                    ? t("status.installMode.fixed")
                    : record.installMode === 1
                        ? t("status.installMode.mobile")
                        : "-"
              }}
            </text>
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
      :title="isEditMode ? t('maintain.page.editMaintenance') : t('maintain.page.addMaintenance')"
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

type MaintainTypeMeta = {
  label: string;
  className: string;
};

const maintainTypeMap: Record<number, MaintainTypeMeta> = {
  0: {
    label: t("status.maintain.remove"),
    className: "status-tag--danger",
  },
  1: {
    label: t("status.maintain.install"),
    className: "status-tag--success",
  },
  2: {
    label: t("status.maintain.maintenance"),
    className: "status-tag--warning",
  },
  3: {
    label: t("status.maintain.inspect"),
    className: "status-tag--info",
  },
};

// 获取维护类型元数据
const getMaintainTypeMeta = (type?: number): MaintainTypeMeta => {
  return (
      maintainTypeMap[type ?? -1] ?? {
        label: "-",
        className: "status-tag--default",
      }
  );
};

</script>
<style scoped lang="scss">
@import "@/pages/device/components/x/status.css";
@import "@/pages/device/components/x/table-cell.css";
@import "@/pages/device/components/x/table.css";
@import "@/pages/device/components/x/table-row.css";
.toolbar-wrapper {
  padding-bottom: 12px;
}
</style>