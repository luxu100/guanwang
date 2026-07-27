<!-- 固件管理业务视图：对接 /api/firmware 全量管理接口。 -->
<template>
  <view class="firmware-management">
    <view class="toolbar panel">
      <view class="toolbar__filters">
        <view class="field field--search field--inline">
          <text class="field__label">{{ localeText("固件名称", "Firmware name") }}</text>
          <input
            v-model="filters.firmwareName"
            class="control"
            :placeholder="localeText('输入固件名称', 'Enter firmware name')"
            placeholder-class="placeholder"
            @confirm="handleSearch"
          />
        </view>
      </view>

      <view class="toolbar__actions">
        <button class="button button--primary" :disabled="loading" @click="handleSearch">
          {{ localeText("查询", "Search") }}
        </button>
        <button class="button" :disabled="loading" @click="resetFilters">
          {{ localeText("重置", "Reset") }}
        </button>
        <button class="button" :disabled="loading" @click="loadFirmwarePage">
          {{ localeText("刷新", "Refresh") }}
        </button>
        <button
          class="button button--danger"
          :disabled="!selectedIds.length || deleting"
          @click="confirmBatchDelete"
        >
          {{ localeText(`批量删除 (${selectedIds.length})`, `Delete selected (${selectedIds.length})`) }}
        </button>
        <button class="button button--primary" @click="openUpload">
          {{ localeText("上传固件", "Upload firmware") }}
        </button>
      </view>
    </view>

    <view class="content-layout">
      <view class="table-panel panel">
        <view class="panel-head">
          <view>
            <text class="panel-head__title">{{ localeText("固件管理", "Firmware repository") }}</text>
            </view>
          <text class="panel-head__meta">{{ localizedTotal(total) }}</text>
        </view>

        <CommandDataTable
          :columns="firmwareColumns"
          :data="firmwareList"
          :loading="loading"
          :selected="selectedFirmware?.id"
          :page-current="pagination.pageNum"
          :page-size="pagination.pageSize"
          :loading-text="localeText('正在加载固件数据…', 'Loading firmware…')"
          :empty-text="localeText('暂无固件记录', 'No firmware records')"
          @row-click="selectFirmware"
        >
          <template #header-selected>
            <view class="selection-cell" @click.stop="togglePageSelection">
              <text class="checkbox" :class="{ 'checkbox--checked': isPageSelected }">{{ isPageSelected ? "✓" : "" }}</text>
            </view>
          </template>
          <template #cell-selected="{ row }">
            <view class="selection-cell" @click.stop="toggleSelection(row.id)">
              <text class="checkbox" :class="{ 'checkbox--checked': selectedIds.includes(row.id) }">
                {{ selectedIds.includes(row.id) ? "✓" : "" }}
              </text>
            </view>
          </template>
          <template #cell-firmwareVersion="{ row }">
            <text class="version-pill">{{ row.firmwareVersion || "-" }}</text>
          </template>
          <template #footer>
            <CommandPaginationBar
              :current="pagination.pageNum"
              :size="pagination.pageSize"
              :total="total"
              @change-page="changePage"
              @change-size="handlePageSizeChange"
            />
          </template>
        </CommandDataTable>
      </view>

      <view class="detail-panel panel">
        <view v-if="detailLoading" class="detail-empty">{{ localeText("正在加载详情…", "Loading details…") }}</view>
        <view v-else-if="!selectedFirmware" class="detail-empty">
          <text>{{ localeText("请选择左侧固件查看详情", "Select firmware to view details") }}</text>
        </view>
        <template v-else>
          <view class="detail-head">
            <view>
              <text class="detail-head__eyebrow">{{ localeText("固件详情", "Firmware details") }}</text>
              <text class="detail-head__title">{{ selectedFirmware.firmwareName }}</text>
            </view>
            <text class="version-pill version-pill--large">{{ selectedFirmware.firmwareVersion }}</text>
          </view>
          <scroll-view class="detail-scroll" scroll-y>
            <view class="file-card">
              <text class="file-card__icon">TXT</text>
              <view class="file-card__content">
                <text class="file-card__name">{{ getFileName(selectedFirmware.filePath) }}</text>
                <text class="file-card__meta">ID {{ selectedFirmware.fileId || "-" }}</text>
              </view>
            </view>

            <view class="detail-section">
              <text class="detail-section__title">{{ localeText("基本信息", "Basic information") }}</text>
              <view class="info-row"><text>{{ localeText("记录 ID", "Record ID") }}</text><text>{{ selectedFirmware.id }}</text></view>
              <view class="info-row"><text>{{ localeText("固件版本", "Version") }}</text><text>{{ selectedFirmware.firmwareVersion || "-" }}</text></view>
              <view class="info-row"><text>{{ localeText("上传时间", "Uploaded at") }}</text><text>{{ formatTime(selectedFirmware.uploadTime) }}</text></view>
              <view class="info-row"><text>{{ localeText("创建时间", "Created at") }}</text><text>{{ formatTime(selectedFirmware.createdAt) }}</text></view>
              <view class="info-row info-row--path">
                <text>{{ localeText("文件路径", "File path") }}</text>
                <text class="path-value" :title="selectedFirmware.filePath || '-'">{{ selectedFirmware.filePath || "-" }}</text>
              </view>
            </view>

            <view class="detail-section">
              <text class="detail-section__title">{{ localeText("固件说明", "Description") }}</text>
              <text class="detail-copy">{{ selectedFirmware.instruction || localeText("暂无说明", "No description") }}</text>
            </view>
            <view class="detail-section">
              <text class="detail-section__title">{{ localeText("备注", "Remark") }}</text>
              <text class="detail-copy">{{ selectedFirmware.remark || localeText("暂无备注", "No remark") }}</text>
            </view>
          </scroll-view>
          <view class="detail-actions">
            <button class="button" @click="openEdit(selectedFirmware)">{{ localeText("编辑信息", "Edit") }}</button>
            <button class="button button--danger" :disabled="deleting" @click="confirmDelete(selectedFirmware)">
              {{ deleting ? localeText("正在删除…", "Deleting…") : localeText("删除固件", "Delete") }}
            </button>
          </view>
        </template>
      </view>
    </view>

    <!-- 新建/编辑固件记录 -->
    <view v-if="formVisible" class="modal-mask" @click.self="closeForm">
      <view class="modal">
        <view class="modal-head">
          <view>
            <text class="modal-head__eyebrow">{{ formMode === "create" ? localeText("创建元数据记录", "Create metadata record") : localeText("更新固件信息", "Update firmware") }}</text>
            <text class="modal-head__title">{{ formMode === "create" ? localeText("新建固件记录", "New firmware record") : localeText("编辑固件", "Edit firmware") }}</text>
          </view>
          <button class="modal-close" @click="closeForm">×</button>
        </view>
        <view class="modal-body">
          <view class="form-grid">
            <view class="field">
              <text class="field__label field__label--required">{{ localeText("固件名称", "Firmware name") }}</text>
              <input v-model="form.firmwareName" class="control" :placeholder="localeText('输入固件名称', 'Enter firmware name')" />
            </view>
            <view class="field">
              <text class="field__label field__label--required">{{ localeText("固件版本", "Firmware version") }}</text>
              <input v-model="form.firmwareVersion" class="control control--mono" placeholder="V1.1" maxlength="4" />
              <text class="field__hint">{{ localeText("必须为 4 个 ASCII 字符", "Must contain exactly 4 ASCII characters") }}</text>
            </view>
            <view class="field field--wide">
              <text class="field__label">{{ localeText("固件说明", "Description") }}</text>
              <textarea v-model="form.instruction" class="textarea" :placeholder="localeText('输入固件用途和升级说明', 'Enter firmware description')" />
            </view>
            <view class="field field--wide">
              <text class="field__label">{{ localeText("备注", "Remark") }}</text>
              <textarea v-model="form.remark" class="textarea" :placeholder="localeText('输入内部备注', 'Enter internal remark')" />
            </view>
          </view>
        </view>
        <view class="modal-actions">
          <button class="button" :disabled="submitting" @click="closeForm">{{ localeText("取消", "Cancel") }}</button>
          <button class="button button--primary" :disabled="submitting" @click="submitForm">
            {{ submitting ? localeText("正在保存…", "Saving…") : localeText("保存", "Save") }}
          </button>
        </view>
      </view>
    </view>

    <!-- 上传固件 -->
    <view v-if="uploadVisible" class="modal-mask" @click.self="closeUpload">
      <view class="modal">
        <view class="modal-head">
          <view>
            <text class="modal-head__eyebrow">{{ localeText("上传并创建记录", "Upload and create record") }}</text>
            <text class="modal-head__title">{{ localeText("上传固件", "Upload firmware") }}</text>
          </view>
          <button class="modal-close" @click="closeUpload">×</button>
        </view>
        <view class="modal-body">
          <view
            class="upload-box"
            :class="{ 'upload-box--selected': uploadForm.file || uploadForm.filePath }"
            @click="chooseFirmwareFile"
          >
            <text class="upload-box__icon">{{ uploadForm.file || uploadForm.filePath ? "TXT" : "＋" }}</text>
            <text class="upload-box__title">{{ uploadForm.fileName || localeText("点击从文件夹选择 TXT 固件文件", "Choose a TXT firmware file") }}</text>
            <text class="upload-box__hint">{{ localeText("仅支持 .txt 文件，不限制文件帧数", "TXT files only; no frame limit") }}</text>
          </view>
          <view v-if="uploading" class="upload-progress">
            <view class="upload-progress__track"><view :style="{ width: `${uploadPercent}%` }"></view></view>
            <text>{{ uploadPercent }}%</text>
          </view>
          <view v-if="uploadStatusText" class="upload-status" :class="{ 'upload-status--error': uploadError }">
            <text>{{ uploadStatusText }}</text>
          </view>
          <view class="form-grid">
            <view class="field">
              <text class="field__label field__label--required">{{ localeText("固件名称", "Firmware name") }}</text>
              <input v-model="uploadForm.firmwareName" class="control" />
            </view>
            <view class="field">
              <text class="field__label field__label--required">{{ localeText("固件版本", "Firmware version") }}</text>
              <input v-model="uploadForm.firmwareVersion" class="control control--mono" placeholder="V1.1" maxlength="4" />
            </view>
            <view class="field field--wide">
              <text class="field__label">{{ localeText("固件说明", "Description") }}</text>
              <textarea v-model="uploadForm.instruction" class="textarea" />
            </view>
            <view class="field field--wide">
              <text class="field__label">{{ localeText("备注", "Remark") }}</text>
              <textarea v-model="uploadForm.remark" class="textarea" />
            </view>
          </view>
        </view>
        <view class="modal-actions">
          <button class="button" :disabled="uploading" @click="closeUpload">{{ localeText("取消", "Cancel") }}</button>
          <button class="button button--primary" :disabled="uploading" @click="submitUpload">
            {{ uploading ? localeText("正在上传…", "Uploading…") : localeText("开始上传", "Upload") }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, markRaw, onMounted, reactive, ref, toRaw } from "vue";
import { useLocaleText, useLocalizedTotal } from "@/i18n/localeText";
import CommandDataTable from "@/pages/command/components/t/CommandDataTable.vue";
import CommandPaginationBar from "@/pages/command/components/t/CommandPaginationBar.vue";
import type { CommandTableColumn } from "@/pages/command/components/t/types";
import {
  batchDeleteFirmware,
  createFirmware,
  deleteFirmware,
  getFirmwareDetail,
  getFirmwarePage,
  updateFirmware,
  uploadFirmware,
  type Firmware,
} from "@/services/firmware/manage";

interface FirmwareRow extends Firmware {
  id: number;
}

interface ApiEnvelope<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
}

interface PagePayload {
  records?: FirmwareRow[];
  list?: FirmwareRow[];
  total?: number;
  current?: number;
  size?: number;
}

const localeText = useLocaleText();
const localizedTotal = useLocalizedTotal();

const filters = reactive({ firmwareName: "", firmwareVersion: "" });
const pagination = reactive({ pageNum: 1, pageSize: 10 });
const firmwareList = ref<FirmwareRow[]>([]);
const total = ref(0);
const loading = ref(false);
const detailLoading = ref(false);
const deleting = ref(false);
const selectedIds = ref<number[]>([]);
const selectedFirmware = ref<FirmwareRow | null>(null);

const formVisible = ref(false);
const formMode = ref<"create" | "edit">("create");
const submitting = ref(false);
const form = reactive<Firmware>({
  firmwareName: "",
  firmwareVersion: "",
  instruction: "",
  remark: "",
});

const uploadVisible = ref(false);
const uploading = ref(false);
const uploadPercent = ref(0);
const uploadError = ref("");
const uploadStatusText = ref("");
const uploadForm = reactive({
  file: undefined as File | undefined,
  filePath: "",
  fileName: "",
  firmwareName: "",
  firmwareVersion: "",
  instruction: "",
  remark: "",
});

const versionCount = computed(() => new Set(firmwareList.value.map((item) => item.firmwareVersion).filter(Boolean)).size);
const isPageSelected = computed(
  () => firmwareList.value.length > 0 && firmwareList.value.every((item) => selectedIds.value.includes(item.id)),
);
const firmwareColumns = computed<CommandTableColumn[]>(() => [
  { key: "selected", label: "", width: 48, align: "center" },
  { key: "firmwareName", label: localeText("固件名称", "Firmware name"), width: 180, className: "data-cell--number", align: "center", tooltip: true },
  { key: "firmwareVersion", label: localeText("版本", "Version"), width: 100, align: "center" },
  {
    key: "filePath",
    label: localeText("文件路径", "File path"),
    width: 280,
    className: "data-cell--address",
    bodyClassName: "data-cell--path",
    align: "center",
    formatter: (value) => value || "-",
    tooltip: true,
  },
  {
    key: "instruction",
    label: localeText("固件说明", "Description"),
    width: 220,
    className: "data-cell--remark",
    align: "center",
    formatter: (value) => value || "-",
    tooltip: true,
  },
  {
    key: "uploadTime",
    label: localeText("上传时间", "Uploaded at"),
    width: 170,
    className: "data-cell--time",
    align: "center",
    formatter: (value, row) => formatTime(value || row.createdAt),
  },
]);

function unwrapResponse<T>(response: ApiEnvelope<unknown>): T {
  if (response?.code !== undefined && response.code !== 0 && response.code !== 200) {
    throw new Error(response.msg || localeText("请求失败", "Request failed"));
  }
  return response?.data as T;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  const record = error as { msg?: string; message?: string };
  return record?.msg || record?.message || localeText("操作失败，请稍后重试", "Operation failed");
}

function toast(title: string, icon: "none" | "success" = "none") {
  uni.showToast({ title, icon });
}

async function loadFirmwarePage() {
  if (loading.value) return;
  loading.value = true;
  try {
    const response = await getFirmwarePage({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      firmwareName: filters.firmwareName.trim() || undefined,
      firmwareVersion: filters.firmwareVersion.trim() || undefined,
      sortOrder: "desc",
    });
    const payload = unwrapResponse<PagePayload | FirmwareRow[]>(response);
    const rows = Array.isArray(payload) ? payload : payload?.records || payload?.list || [];
    firmwareList.value = rows.filter((item): item is FirmwareRow => Number.isFinite(Number(item?.id)));
    total.value = Array.isArray(payload) ? payload.length : Number(payload?.total ?? rows.length);
    if (!Array.isArray(payload)) {
      pagination.pageNum = Number(payload?.current || pagination.pageNum);
      pagination.pageSize = Number(payload?.size || pagination.pageSize);
    }
    selectedIds.value = selectedIds.value.filter((id) => firmwareList.value.some((item) => item.id === id));
    const updated = selectedFirmware.value
      ? firmwareList.value.find((item) => item.id === selectedFirmware.value?.id)
      : null;
    selectedFirmware.value = updated || firmwareList.value[0] || null;
  } catch (error) {
    toast(getErrorMessage(error));
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.pageNum = 1;
  selectedIds.value = [];
  loadFirmwarePage();
}

function resetFilters() {
  filters.firmwareName = "";
  filters.firmwareVersion = "";
  handleSearch();
}

function changePage(pageNum: number) {
  const totalPages = Math.max(1, Math.ceil(total.value / pagination.pageSize));
  pagination.pageNum = Math.min(Math.max(1, pageNum), totalPages);
  selectedIds.value = [];
  loadFirmwarePage();
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize;
  pagination.pageNum = 1;
  selectedIds.value = [];
  loadFirmwarePage();
}

function toggleSelection(id: number) {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((item) => item !== id)
    : [...selectedIds.value, id];
}

function togglePageSelection() {
  selectedIds.value = isPageSelected.value ? [] : firmwareList.value.map((item) => item.id);
}

function selectFirmware(item: FirmwareRow) {
  selectedFirmware.value = item;
}

async function viewDetail(item: FirmwareRow) {
  selectedFirmware.value = item;
  detailLoading.value = true;
  try {
    const response = await getFirmwareDetail(item.id);
    const detail = unwrapResponse<Firmware>(response);
    selectedFirmware.value = detail?.id ? detail as FirmwareRow : item;
  } catch (error) {
    toast(getErrorMessage(error));
  } finally {
    detailLoading.value = false;
  }
}

function resetForm() {
  Object.assign(form, {
    id: undefined,
    firmwareName: "",
    firmwareVersion: "",
    instruction: "",
    remark: "",
  });
}

function openCreate() {
  formMode.value = "create";
  resetForm();
  formVisible.value = true;
}

function openEdit(item: FirmwareRow) {
  formMode.value = "edit";
  Object.assign(form, {
    ...item,
    firmwareName: item.firmwareName || "",
    firmwareVersion: item.firmwareVersion || "",
    instruction: item.instruction || "",
    remark: item.remark || "",
  });
  formVisible.value = true;
}

function closeForm() {
  if (!submitting.value) formVisible.value = false;
}

function validateMetadata(data: Firmware) {
  if (!data.firmwareName.trim()) return localeText("请输入固件名称", "Enter firmware name");
  if (!/^[\x20-\x7E]{4}$/.test(data.firmwareVersion.trim())) {
    return localeText("固件版本必须为 4 个 ASCII 字符", "Version must contain exactly 4 ASCII characters");
  }
  return "";
}

async function submitForm() {
  const payload: Firmware = {
    ...form,
    firmwareName: form.firmwareName.trim(),
    firmwareVersion: form.firmwareVersion.trim(),
    instruction: form.instruction?.trim(),
    remark: form.remark?.trim(),
  };
  const validationMessage = validateMetadata(payload);
  if (validationMessage) {
    toast(validationMessage);
    return;
  }

  submitting.value = true;
  try {
    const response = formMode.value === "create"
      ? await createFirmware(payload)
      : await updateFirmware(form.id as number, payload);
    unwrapResponse(response);
    formVisible.value = false;
    toast(localeText("保存成功", "Saved"), "success");
    await loadFirmwarePage();
    if (formMode.value === "edit" && form.id) {
      const current = firmwareList.value.find((item) => item.id === form.id);
      if (current) await viewDetail(current);
    }
  } catch (error) {
    toast(getErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

function confirmDelete(item: FirmwareRow) {
  if (deleting.value) return;
  uni.showModal({
    title: localeText("确认删除", "Confirm deletion"),
    content: localeText(
      `将强制删除固件“${item.firmwareName}（${item.firmwareVersion}）”，此操作不可撤销。`,
      `Permanently delete “${item.firmwareName} (${item.firmwareVersion})”?`,
    ),
    cancelText: localeText("取消", "Cancel"),
    confirmText: localeText("删除", "Delete"),
    confirmColor: "#d14343",
    success(result) {
      if (result.confirm) removeFirmware(item.id);
    },
  });
}

async function removeFirmware(id: number) {
  if (deleting.value) return;
  deleting.value = true;
  try {
    const response = await deleteFirmware(id);
    unwrapResponse(response);
    selectedIds.value = selectedIds.value.filter((item) => item !== id);
    if (selectedFirmware.value?.id === id) selectedFirmware.value = null;
    if (firmwareList.value.length === 1 && pagination.pageNum > 1) pagination.pageNum -= 1;
    toast(localeText("删除成功", "Deleted"), "success");
    await loadFirmwarePage();
  } catch (error) {
    toast(getErrorMessage(error));
  } finally {
    deleting.value = false;
  }
}

function confirmBatchDelete() {
  if (!selectedIds.value.length || deleting.value) return;
  uni.showModal({
    title: localeText("确认批量删除", "Confirm batch deletion"),
    content: localeText(
      `将强制删除已选择的 ${selectedIds.value.length} 个固件，此操作不可撤销。`,
      `Permanently delete ${selectedIds.value.length} selected firmware records?`,
    ),
    cancelText: localeText("取消", "Cancel"),
    confirmText: localeText("删除", "Delete"),
    confirmColor: "#d14343",
    success(result) {
      if (result.confirm) removeSelectedFirmware();
    },
  });
}

async function removeSelectedFirmware() {
  if (deleting.value) return;
  deleting.value = true;
  try {
    const ids = [...selectedIds.value];
    const response = await batchDeleteFirmware(ids);
    unwrapResponse(response);
    if (selectedFirmware.value && ids.includes(selectedFirmware.value.id)) selectedFirmware.value = null;
    selectedIds.value = [];
    toast(localeText("批量删除成功", "Deleted"), "success");
    await loadFirmwarePage();
  } catch (error) {
    toast(getErrorMessage(error));
  } finally {
    deleting.value = false;
  }
}

function resetUploadForm() {
  Object.assign(uploadForm, {
    file: undefined,
    filePath: "",
    fileName: "",
    firmwareName: "",
    firmwareVersion: "",
    instruction: "",
    remark: "",
  });
  uploadPercent.value = 0;
  uploadError.value = "";
  uploadStatusText.value = "";
}

function openUpload() {
  resetUploadForm();
  uploadVisible.value = true;
}

function closeUpload() {
  if (!uploading.value) uploadVisible.value = false;
}

function chooseFirmwareFile() {
  if (typeof document !== "undefined") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt,text/plain";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".txt")) {
        toast(localeText("请选择 TXT 固件文件", "Choose a TXT firmware file"));
        return;
      }
      applySelectedFile(file);
    };
    input.click();
    return;
  }

  uni.chooseFile({
    count: 1,
    extension: [".txt"],
    success(result) {
      const tempFiles = Array.isArray(result.tempFiles) ? result.tempFiles : [result.tempFiles].filter(Boolean);
      const file = tempFiles[0] as unknown as { path: string; name?: string };
      if (!file) return;
      uploadForm.file = undefined;
      uploadForm.filePath = file.path;
      uploadForm.fileName = file.name || getFileName(file.path);
      uploadError.value = "";
      uploadStatusText.value = localeText(`已选择 ${uploadForm.fileName}`, `Selected ${uploadForm.fileName}`);
      if (!uploadForm.firmwareName) uploadForm.firmwareName = uploadForm.fileName.replace(/\.txt$/i, "");
    },
    fail() {
      toast(localeText("当前平台未选择文件", "No file selected"));
    },
  });
}

function applySelectedFile(file: File) {
  if (!file.name.toLowerCase().endsWith(".txt")) {
    uploadError.value = localeText("请选择 TXT 固件文件", "Choose a TXT firmware file");
    uploadStatusText.value = uploadError.value;
    return;
  }

  uploadForm.file = markRaw(file);
  uploadForm.filePath = "";
  uploadForm.fileName = file.name;
  uploadError.value = "";
  uploadStatusText.value = localeText(`已选择 ${file.name}`, `Selected ${file.name}`);
  if (!uploadForm.firmwareName) {
    uploadForm.firmwareName = file.name.replace(/\.txt$/i, "");
  }
}

async function submitUpload() {
  uploadError.value = "";
  uploadStatusText.value = "";
  const validationMessage = validateMetadata(uploadForm);
  if (!uploadForm.file && !uploadForm.filePath) {
    uploadError.value = localeText("请选择 TXT 固件文件", "Choose a TXT firmware file");
    uploadStatusText.value = uploadError.value;
    return;
  }
  if (validationMessage) {
    uploadError.value = validationMessage;
    uploadStatusText.value = validationMessage;
    return;
  }

  uploading.value = true;
  uploadPercent.value = 1;
  uploadStatusText.value = localeText("正在连接服务器并上传固件…", "Connecting and uploading firmware…");
  try {
    const response = await uploadFirmware(
      {
        file: uploadForm.file ? toRaw(uploadForm.file) : undefined,
        filePath: uploadForm.filePath || undefined,
        firmwareName: uploadForm.firmwareName.trim(),
        firmwareVersion: uploadForm.firmwareVersion.trim(),
        instruction: uploadForm.instruction.trim() || undefined,
        remark: uploadForm.remark.trim() || undefined,
      },
      (percent) => {
        uploadPercent.value = Math.max(1, percent);
        uploadStatusText.value = percent >= 100
          ? localeText("文件已上传，正在等待服务器处理…", "File uploaded; waiting for server processing…")
          : localeText(`正在上传固件… ${percent}%`, `Uploading firmware… ${percent}%`);
      },
    );
    const created = unwrapResponse<Firmware>(response);
    uploadVisible.value = false;
    toast(localeText("固件上传成功", "Firmware uploaded"), "success");
    pagination.pageNum = 1;
    await loadFirmwarePage();
    if (created?.id) await viewDetail(created as FirmwareRow);
  } catch (error) {
    uploadError.value = getErrorMessage(error);
    uploadStatusText.value = uploadError.value;
  } finally {
    uploading.value = false;
  }
}

function getFileName(path?: string) {
  if (!path) return "-";
  return path.split(/[\\/]/).pop() || path;
}

function formatTime(value?: string) {
  if (!value) return "-";
  return String(value).replace("T", " ").replace(/\.\d+$/, "");
}

onMounted(loadFirmwarePage);
</script>

<style lang="scss" scoped>
.firmware-management {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 12px;
  gap: 12px;
  overflow: hidden;
  color: #233d55;
  background: #eef4f8;
  box-sizing: border-box;
}

.panel,
.summary-card {
  background: #fff;
  border: 1px solid #d8e5ef;
  border-radius: 7px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.08);
}

.toolbar {
  flex: none;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 14px;
}

.toolbar__filters,
.toolbar__actions,
.panel-head__actions,
.detail-actions,
.modal-actions,
.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar__filters {
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  width: 210px;
  gap: 6px;
}

.field--search {
  width: 300px;
}

.field--inline {
  align-items: center;
  flex-direction: row;
  width: 360px;
  gap: 10px;
}

.field--inline .field__label {
  flex: none;
  font-size: 14px;
}

.field--inline .control {
  flex: 1;
  min-width: 0;
}

.field--wide {
  grid-column: 1 / -1;
  width: auto;
}

.field__label {
  color: #587086;
  font-size: 12px;
  font-weight: 800;
}

.field__label--required::after {
  margin-left: 3px;
  color: #d14343;
  content: "*";
}

.field__hint {
  color: #8294a6;
  font-size: 11px;
}

.control,
.textarea {
  width: 100%;
  color: #24445f;
  font-size: 13px;
  background: #f8fbfe;
  border: 1px solid #d6e2ed;
  border-radius: 4px;
  box-sizing: border-box;
}

.control {
  height: 34px;
  padding: 0 10px;
  line-height: 34px;
}

.control--mono {
  font-family: Consolas, monospace;
}

.textarea {
  min-height: 82px;
  padding: 9px 10px;
  line-height: 1.5;
}

.placeholder {
  color: #9aaaba;
}

.button,
.page-button,
.row-action,
.text-button,
.modal-close {
  margin: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  box-sizing: border-box;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 36px;
  padding: 0 18px;
  color: #31516d;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  background: #f6fbff;
  border: 1px solid #cbdced;
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
}

.button:hover {
  color: #0d82ee;
  background: #edf7ff;
  border-color: #a9d7ff;
}

.button--primary {
  color: #fff;
  background: #0d82ee;
  border-color: #0d82ee;
}

.button--primary:hover {
  color: #fff;
  background: #0674d8;
  border-color: #0674d8;
}

.button--danger {
  color: #bd3434;
  background: #fff7f7;
  border-color: #efc9c9;
}

.button[disabled],
.page-button[disabled],
.text-button[disabled] {
  opacity: 0.45;
}

.summary-grid {
  flex: none;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 78px;
  padding: 12px 16px;
  overflow: hidden;
}

.summary-card::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 4px;
  content: "";
  background: #2e91d4;
}

.summary-card--green::before { background: #25a46f; }
.summary-card--orange::before { background: #e58b32; }
.summary-card--cyan::before { background: #1aa1aa; }

.summary-card__label {
  color: #657b8f;
  font-size: 13px;
  font-weight: 700;
}

.summary-card__value {
  color: #193d5b;
  font-size: 28px;
  font-weight: 900;
}

.summary-card__unit {
  margin-left: 4px;
  color: #7890a4;
  font-size: 12px;
}

.content-layout {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  min-height: 0;
  gap: 12px;
}

.table-panel,
.detail-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.table-panel > :deep(.data-table-container) {
  flex: 1;
  height: auto;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.panel-head,
.detail-head,
.modal-head {
  flex: none;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border-bottom: 1px solid #e8eff5;
}

.panel-head {
  align-items: center;
}

.panel-head__title,
.detail-head__title,
.modal-head__title {
  display: block;
  color: #183e5e;
  font-size: 17px;
  font-weight: 900;
}

.panel-head__subtitle,
.detail-head__eyebrow,
.modal-head__eyebrow {
  display: block;
  margin-top: 4px;
  color: #788da0;
  font-size: 12px;
}

.panel-head__meta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  margin: 0;
  padding: 0 14px;
  color: #647b91;
  font-size: 14px;
  font-weight: 800;
  line-height: 30px;
  white-space: nowrap;
  background: #f6f9fc;
  border: 1px solid #dce7f0;
  border-radius: 999px;
}

.text-button {
  height: 28px;
  padding: 0 6px;
  font-size: 12px;
  line-height: 28px;
}

.text-button--danger,
.row-action--danger {
  color: #c23b3b !important;
}

.table-scroll {
  flex: 1;
  min-height: 0;
}

.data-table {
  min-width: 1120px;
}

.data-row {
  display: grid;
  grid-template-columns: 46px 58px minmax(150px, 1.3fr) 90px minmax(130px, 1.1fr) minmax(190px, 1.5fr) 150px 168px;
  min-height: 50px;
  border-bottom: 1px solid #edf2f6;
}

.data-row:not(.data-row--header):hover {
  background: #f2f8fd;
}

.data-row--active {
  background: #e9f4fd !important;
  box-shadow: inset 3px 0 #1689d0;
}

.data-row--header {
  position: sticky;
  top: 0;
  z-index: 2;
  min-height: 44px;
  font-weight: 800;
  background: #f5f9fc;
}

.data-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 0 10px;
  overflow: hidden;
  color: #344f67;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-right: 1px solid #edf2f6;
  box-sizing: border-box;
}

.cell--name,
.cell--file,
.cell--instruction {
  justify-content: flex-start;
}

.cell--name {
  color: #145c91;
  font-weight: 800;
}

.checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  color: #fff;
  border: 1px solid #b9cad8;
  border-radius: 3px;
}

.checkbox--checked {
  background: #1689d0;
  border-color: #1689d0;
}

.version-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  height: 24px;
  padding: 0 9px;
  color: #166a67;
  font-family: Consolas, monospace;
  font-size: 12px;
  font-weight: 800;
  background: #eaf8f5;
  border: 1px solid #bfe6df;
  border-radius: 999px;
}

.version-pill--large {
  height: 28px;
}

.row-action {
  height: 26px;
  padding: 0 6px;
  color: #1577b6;
  font-size: 12px;
  line-height: 26px;
}

.row-actions,
.selection-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
}

.table-state,
.detail-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 180px;
  gap: 8px;
  color: #8192a3;
  font-size: 13px;
}

.table-state__title {
  color: #526c83;
  font-size: 15px;
  font-weight: 800;
}

.table-state__hint {
  font-size: 12px;
}

.pagination {
  flex: none;
  justify-content: flex-end;
  padding: 10px 14px;
  border-top: 1px solid #e8eff5;
}

.page-button,
.page-size {
  height: 29px;
  padding: 0 10px;
  color: #3f5d75;
  font-size: 12px;
  line-height: 28px;
  background: #fff;
  border: 1px solid #d2dfe9;
}

.page-size {
  border-radius: 4px;
}

.page-info {
  color: #657c90;
  font-size: 12px;
}

.detail-empty {
  flex: 1;
}

.detail-empty__mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  color: #5f87a5;
  font-family: Consolas, monospace;
  font-weight: 900;
  background: #edf5fb;
  border-radius: 12px;
}

.detail-scroll {
  flex: 1;
  min-height: 0;
  padding: 14px;
  box-sizing: border-box;
}

.file-card {
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 11px;
  background: #f2f8fc;
  border: 1px solid #d8e8f3;
  border-radius: 6px;
}

.file-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  color: #fff;
  font-size: 12px;
  font-weight: 900;
  background: #1689d0;
  border-radius: 5px;
}

.file-card__content,
.upload-box {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}

.file-card__name {
  overflow: hidden;
  color: #244964;
  font-size: 13px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-card__meta {
  color: #7b8fa1;
  font-size: 11px;
}

.detail-section {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #e8eff5;
}

.detail-section__title {
  display: block;
  margin-bottom: 9px;
  color: #365770;
  font-size: 13px;
  font-weight: 900;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 34px;
  gap: 10px;
  color: #6c8194;
  font-size: 12px;
}

.info-row > text:last-child {
  color: #2d4d66;
  text-align: right;
}

.info-row--path {
  min-width: 0;
}

.path-value {
  display: block;
  flex: 1;
  min-width: 0;
  max-width: 205px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help;
}

.detail-copy {
  display: block;
  color: #536d82;
  font-size: 12px;
  line-height: 1.65;
  white-space: pre-wrap;
}

.detail-actions {
  flex: none;
  justify-content: flex-end;
  padding: 12px 14px;
  border-top: 1px solid #e8eff5;
}

.modal-mask {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(14, 34, 51, 0.52);
  box-sizing: border-box;
}

.modal {
  display: flex;
  flex-direction: column;
  width: min(680px, 100%);
  max-height: 90vh;
  overflow: hidden;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 24px 70px rgba(9, 31, 49, 0.28);
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: #718497;
  font-size: 22px;
  line-height: 1;
}

.modal-close::after {
  border: 0;
}

.modal-body {
  overflow-y: auto;
  padding: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.modal-actions {
  justify-content: flex-end;
  padding: 12px 18px;
  background: #f8fafc;
  border-top: 1px solid #e6edf3;
}

.upload-box {
  align-items: center;
  justify-content: center;
  min-height: 130px;
  margin-bottom: 16px;
  padding: 18px;
  text-align: center;
  background: #f7fbfe;
  border: 1px dashed #a9c9df;
  border-radius: 7px;
}

.upload-box--selected {
  background: #f0faf7;
  border-color: #70bba2;
}

.upload-box__icon {
  color: #1689d0;
  font-size: 24px;
  font-weight: 900;
}

.upload-box__title {
  color: #315670;
  font-size: 14px;
  font-weight: 800;
}

.upload-box__hint {
  color: #8295a5;
  font-size: 11px;
}

.upload-progress {
  display: flex;
  align-items: center;
  margin: -4px 0 16px;
  gap: 10px;
  color: #527087;
  font-size: 12px;
}

.upload-progress__track {
  flex: 1;
  height: 7px;
  overflow: hidden;
  background: #e5edf3;
  border-radius: 999px;
}

.upload-progress__track > view {
  height: 100%;
  background: #21a574;
  border-radius: inherit;
  transition: width 0.2s ease;
}

.upload-status {
  margin: -4px 0 16px;
  padding: 9px 11px;
  color: #276b58;
  font-size: 12px;
  line-height: 1.5;
  background: #eef9f5;
  border: 1px solid #cceade;
  border-radius: 4px;
}

.upload-status--error {
  color: #a63636;
  background: #fff3f3;
  border-color: #efcccc;
}

@media (max-width: 1180px) {
  .content-layout {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .detail-panel {
    min-height: 500px;
  }
}

@media (max-width: 860px) {
  .firmware-management {
    overflow-y: auto;
  }

  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar__actions {
    flex-wrap: wrap;
  }

  .field,
  .field--search {
    width: calc(50% - 6px);
  }

  .field--wide {
    width: auto;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
