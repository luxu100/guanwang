<template>
  <view class="work-order-create-page">
      <WorksheetTableView ref="tableViewRef" mode="create" @create="openCreateDialog" />

      <view v-if="dialogVisible" class="dialog-mask" @click="closeCreateDialog">
        <view class="dialog-panel" @click.stop>
          <view class="dialog-head">
            <view class="dialog-heading">
              <view class="dialog-heading__icon">工</view>
              <view>
                <text class="dialog-title">新增工单</text>
                <text class="dialog-subtitle">按工单接口字段填写派单信息与现场凭证</text>
              </view>
            </view>
            <button class="icon-button" hover-class="icon-button--hover" aria-label="关闭" @click="closeCreateDialog">
              <text class="close-icon"></text>
            </button>
          </view>

          <view v-if="firstCreateError" class="error-summary">{{ firstCreateError }}</view>

          <scroll-view class="dialog-body" scroll-y>
            <view class="form-layout">
              <view class="form-main">
                <view class="form-section form-card">
                  <view class="section-head"><text class="section-title">基础信息</text><text class="section-desc">工单标识与时间安排</text></view>
                  <view class="form-grid form-grid--main">
                    <view class="form-field"><text class="form-label">工单编号</text><input v-model="createForm.worksheetNumber" class="form-input" :placeholder="text.autoNumberPlaceholder" /></view>
                    <view class="form-field"><text class="form-label form-label--required">工单类型</text><WorkOrderSelect v-model="createForm.worksheetType" class="form-select" :options="worksheetTypeOptions" :placeholder="text.typePlaceholder" @change="handleCreateSelectChange('worksheetType')" /></view>
                    <view class="form-field"><text class="form-label form-label--required">紧急程度</text><WorkOrderSelect v-model="createForm.urgencyLevel" class="form-select" :options="urgencyOptions" :placeholder="text.urgencyPlaceholder" @change="handleCreateSelectChange('urgencyLevel')" /></view>
                    <view class="form-field"><text class="form-label form-label--required">工单状态</text><WorkOrderSelect v-model="createForm.worksheetStatus" class="form-select" :options="worksheetStatusOptions" :placeholder="text.statusPlaceholder" @change="handleCreateSelectChange('worksheetStatus')" /></view>
                    <view class="form-field"><text class="form-label form-label--required">发起时间</text><WorkOrderDatetimePicker v-model="createForm.riseTime" :title="text.riseTimeTitle" :placeholder="text.riseTimePlaceholder" /></view>
                    <view class="form-field"><text class="form-label">截止时间</text><WorkOrderDatetimePicker v-model="createForm.deadlineTime" :title="text.deadlineTitle" :placeholder="text.deadlinePlaceholder" /></view>
                    <view v-if="isCreateWorksheetFinished" class="form-field"><text class="form-label form-label--required">完成时间</text><WorkOrderDatetimePicker v-model="createForm.finishTime" :title="text.finishTimeTitle" :placeholder="finishTimePlaceholder" /></view>
                  </view>
                </view>
                <view class="form-section form-card">
                  <view class="section-head"><text class="section-title">处理安排</text><text class="section-desc">指派人员与处理流程</text></view>
                  <view class="form-grid form-grid--main">
                    <view class="form-field"><text class="form-label form-label--required">工单发起人</text><input v-model="createForm.riseAccount" class="form-input" :placeholder="text.initiatorPlaceholder" /></view>
                    <view class="form-field"><text class="form-label form-label--required">工单执行人</text><input v-model="createForm.executeAccount" class="form-input" :placeholder="text.assigneePlaceholder" /></view>
                    <view class="form-field"><text class="form-label">关联设备</text><input v-model="createForm.deviceReference" class="form-input" :placeholder="text.devicePlaceholder" /></view>
                    <view class="form-field"><text class="form-label">关联渗漏记录ID</text><input v-model="createForm.leakageId" class="form-input" type="number" :placeholder="text.leakageIdPlaceholder" /></view>
                    <view class="form-field form-field--wide"><text class="form-label form-label--required">工单说明</text><textarea v-model="createForm.worksheetInstruction" class="form-textarea" :placeholder="text.descriptionPlaceholder" /></view>
                    <view class="form-field form-field--wide"><text class="form-label">工单反馈</text><textarea v-model="createForm.worksheetFeedback" class="form-textarea" :placeholder="text.feedbackPlaceholder" /></view>
                    <view class="form-field form-field--wide"><text class="form-label">备注</text><textarea v-model="createForm.remark" class="form-textarea" :placeholder="text.remarkPlaceholder" /></view>
                  </view>
                </view>
              </view>
              <view class="form-side">
                <view class="form-section form-card form-card--side">
                  <view class="section-head"><text class="section-title">现场信息</text><text class="section-desc">位置与图片凭证</text></view>
                  <view class="form-field">
                    <text class="form-label">工单地址</text>
                    <input v-model="createForm.address" class="form-input" :placeholder="text.addressPlaceholder" />
                  </view>
                  <view class="form-field"><text class="form-label">工单坐标</text><input v-model="createForm.coordinate" class="form-input" :placeholder="text.coordinatePlaceholder" /></view>
                  <view class="form-field upload-field">
                    <text class="form-label">工单照片</text>
                    <view v-if="installImageItem.url" class="upload-preview">
                      <image :src="installImageItem.url" class="upload-preview__image" mode="aspectFill" @click="previewInstallImage" />
                      <view class="upload-preview__shade"><text>{{ uploadingImage ? `上传中 ${uploadProgress}%` : "点击图片预览" }}</text></view>
                      <button class="upload-remove" :disabled="uploadingImage" @click.stop="removeInstallImage">×</button>
                    </view>
                    <view v-else class="upload-placeholder" @click="pickInstallImage">
                      <view class="upload-placeholder__icon"><text>+</text></view>
                      <text class="upload-placeholder__title">选择本地图片</text>
                      <text class="upload-placeholder__hint">支持 JPG、PNG、WEBP，最多 1 张</text>
                    </view>
                  </view>
                  <view class="upload-tip"><text class="upload-tip__dot"></text><text>图片将在创建工单时自动上传</text></view>
                </view>
              </view>
            </view>
          </scroll-view>

          <view class="dialog-actions">
            <button class="secondary-button" hover-class="secondary-button--hover" @click="closeCreateDialog">取消</button>
            <button class="secondary-button" hover-class="secondary-button--hover" @click="resetCreateForm">清空表单</button>
            <button class="primary-button" :disabled="submitting" hover-class="primary-button--hover" @click="submitCreate">
              {{ submitting ? "创建中..." : "确认创建" }}
            </button>
          </view>
        </view>
      </view>
    </view>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "@/i18n";
import WorksheetTableView from "@/pages/work-order/components/WorksheetTableView.vue";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";
import WorkOrderSelect from "@/pages/work-order/components/WorkOrderSelect.vue";
import { createWorksheet } from "@/services/work-order/create";
import { uploadFile } from "@/services/leak-report/file-upload";

interface ApiResponseLike {
  code?: number;
  msg?: string;
  data?: unknown;
}

interface InstallImageItem {
  file?: File;
  path?: string;
  name: string;
  url: string;
}

interface CreateForm {
  worksheetNumber: string;
  worksheetType: number | "";
  riseAccount: string;
  executeAccount: string;
  deviceReference: string;
  urgencyLevel: number | "";
  riseTime: string;
  finishTime: string;
  deadlineTime: string;
  worksheetStatus: number | "";
  worksheetFeedback: string;
  worksheetInstruction: string;
  remark: string;
  address: string;
  coordinate: string;
  pictureIds: string;
  leakageId: string;
}

type CreateValidationKey =
  | "worksheetType"
  | "urgencyLevel"
  | "worksheetStatus"
  | "riseAccount"
  | "executeAccount"
  | "worksheetInstruction"
  | "deadlineTime"
  | "finishTime";

type NumericOption = { label: string; value: number };

const { locale } = useI18n();
const tableViewRef = ref<InstanceType<typeof WorksheetTableView> | null>(null);
const dialogVisible = ref(false);
const submitting = ref(false);
const uploadingImage = ref(false);
const uploadProgress = ref(0);
const installImageItem = ref<InstallImageItem>({ name: "", url: "" });
const createForm = reactive<CreateForm>(getDefaultCreateForm());
const validationErrors = reactive<Record<CreateValidationKey, string>>(getEmptyValidationErrors());
let installFileInput: HTMLInputElement | null = null;

const worksheetTypeOptions = reactive<NumericOption[]>([]);
const worksheetStatusOptions = reactive<NumericOption[]>([]);
const urgencyOptions = reactive<NumericOption[]>([]);
const text = computed(() => {
  const isEnglish = locale.value === "en-US";
  return {
    autoNumberPlaceholder: isEnglish ? "Leave blank to auto-generate" : "留空将自动生成",
    typePlaceholder: isEnglish ? "Select order type" : "请选择工单类型",
    urgencyPlaceholder: isEnglish ? "Select urgency level" : "请选择紧急程度",
    statusPlaceholder: isEnglish ? "Select order status" : "请选择工单状态",
    riseTimeTitle: isEnglish ? "Select initiation time" : "选择发起时间",
    riseTimePlaceholder: isEnglish ? "Select initiation time" : "请选择发起时间",
    deadlineTitle: isEnglish ? "Select deadline" : "选择截止时间",
    deadlinePlaceholder: isEnglish ? "Select deadline" : "请选择截止时间",
    finishTimeTitle: isEnglish ? "Select completion time" : "选择完成时间",
    initiatorPlaceholder: isEnglish ? "Enter initiator account" : "请输入发起人账号",
    assigneePlaceholder: isEnglish ? "Enter assignee account" : "请输入执行人账号",
    devicePlaceholder: isEnglish ? "Multiple device numbers separated by commas" : "多个设备编号用逗号分隔",
    leakageIdPlaceholder: isEnglish ? "Enter associated leak record ID" : "请输入渗漏记录ID",
    descriptionPlaceholder: isEnglish ? "Enter order description" : "请输入工单说明",
    feedbackPlaceholder: isEnglish ? "Optional until the order is processed" : "未处理时可不填",
    remarkPlaceholder: isEnglish ? "Add requirements or notes for the order" : "补充说明工单要求或注意事项",
    addressPlaceholder: isEnglish ? "Enter order address" : "请输入工单地址",
    coordinatePlaceholder: isEnglish ? "Longitude, Latitude" : "经度,纬度",
  };
});
const isCreateWorksheetFinished = computed(() => createForm.worksheetStatus === 2);
const finishTimePlaceholder = computed(() => {
  if (locale.value === "en-US") {
    return isCreateWorksheetFinished.value ? "Select completion time" : "Unavailable until completed";
  }
  return isCreateWorksheetFinished.value ? "请选择工单完成时间" : "未完成状态不可填写";
});
const firstCreateError = computed(() => Object.values(validationErrors).find(Boolean) || "");

watch(() => locale.value, syncCreateOptions, { immediate: true });

onMounted(() => {
  // #ifdef H5
  ensureInstallFileInput();
  // #endif
});

onBeforeUnmount(() => {
  // #ifdef H5
  removeInstallFileInput();
  // #endif
  clearInstallImage();
});

function syncCreateOptions() {
  const isEnglish = locale.value === "en-US";
  replaceNumericOptions(worksheetTypeOptions, [
    { label: isEnglish ? "Inspection" : "巡检", value: 0 },
    { label: isEnglish ? "Leak Inspection" : "检漏", value: 1 },
    { label: isEnglish ? "Installation / Removal" : "拆装", value: 2 },
    { label: isEnglish ? "Maintenance" : "维护", value: 3 },
  ]);
  replaceNumericOptions(worksheetStatusOptions, [
    { label: isEnglish ? "Pending" : "待处理", value: 0 },
    { label: isEnglish ? "In Progress" : "处理中", value: 1 },
    { label: isEnglish ? "Completed" : "已完成", value: 2 },
    { label: isEnglish ? "Canceled" : "已取消", value: 3 },
  ]);
  replaceNumericOptions(urgencyOptions, [
    { label: isEnglish ? "Normal" : "一般", value: 0 },
    { label: isEnglish ? "Urgent" : "紧急", value: 1 },
  ]);
}

function replaceNumericOptions(target: NumericOption[], source: NumericOption[]) {
  target.splice(0, target.length, ...source);
}

function getDefaultCreateForm(): CreateForm {
  return {
    worksheetNumber: "",
    worksheetType: "",
    riseAccount: "",
    executeAccount: "",
    deviceReference: "",
    urgencyLevel: 0,
    riseTime: toDatetimeLocal(new Date()),
    finishTime: "",
    deadlineTime: "",
    worksheetStatus: 0,
    worksheetFeedback: "",
    worksheetInstruction: "",
    remark: "",
    address: "",
    coordinate: "",
    pictureIds: "",
    leakageId: "",
  };
}

function getEmptyValidationErrors(): Record<CreateValidationKey, string> {
  return {
    worksheetType: "",
    urgencyLevel: "",
    worksheetStatus: "",
    riseAccount: "",
    executeAccount: "",
    worksheetInstruction: "",
    deadlineTime: "",
    finishTime: "",
  };
}

function openCreateDialog() {
  Object.assign(createForm, getDefaultCreateForm());
  clearInstallImage();
  clearCreateErrors();
  dialogVisible.value = true;
}

function closeCreateDialog() {
  if (submitting.value) {
    return;
  }

  dialogVisible.value = false;
}

function resetCreateForm() {
  Object.assign(createForm, getDefaultCreateForm());
  clearInstallImage();
  clearCreateErrors();
}

function handleCreateSelectChange(key: "worksheetType" | "urgencyLevel" | "worksheetStatus") {
  clearCreateError(key);
  if (key === "worksheetStatus") {
    clearCreateError("finishTime");
    if (createForm.worksheetStatus !== 2) {
      createForm.finishTime = "";
    }
  }
}

async function submitCreate() {
  if (!validateCreateForm()) {
    return;
  }

  submitting.value = true;

  try {
    createForm.pictureIds = await uploadInstallImage();
    const response = await createWorksheet(buildCreatePayload()) as ApiResponseLike;
    assertSuccessResponse(response);
    uni.showToast({ title: "工单创建成功", icon: "success" });
    dialogVisible.value = false;
    resetCreateForm();
    await tableViewRef.value?.fetchWorksheets();
  } catch (error) {
    uni.showToast({
      title: (error as { msg?: string })?.msg || "工单创建失败",
      icon: "none",
    });
  } finally {
    submitting.value = false;
    uploadingImage.value = false;
  }
}

function pickInstallImage() {
  // #ifdef H5
  const input = ensureInstallFileInput();
  input.click();
  // #endif

  // #ifndef H5
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (result) => {
      const path = result.tempFilePaths[0];
      if (!path) return;
      clearInstallImage();
      installImageItem.value = {
        path,
        name: path.split("/").pop() || "install-image.jpg",
        url: path,
      };
    },
  });
  // #endif
}

function ensureInstallFileInput() {
  if (installFileInput) {
    return installFileInput;
  }

  installFileInput = document.createElement("input");
  installFileInput.type = "file";
  installFileInput.accept = "image/jpeg,image/png,image/webp";
  installFileInput.style.position = "fixed";
  installFileInput.style.left = "-9999px";
  installFileInput.style.top = "-9999px";
  installFileInput.style.width = "1px";
  installFileInput.style.height = "1px";
  installFileInput.style.opacity = "0";
  installFileInput.style.pointerEvents = "none";
  installFileInput.addEventListener("change", handleInstallFileInputChange);
  document.body.appendChild(installFileInput);
  return installFileInput;
}

function removeInstallFileInput() {
  if (!installFileInput) {
    return;
  }

  installFileInput.removeEventListener("change", handleInstallFileInputChange);
  installFileInput.remove();
  installFileInput = null;
}

function handleInstallFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  clearInstallImage();
  installImageItem.value = {
    file,
    name: file.name || "install-image.jpg",
    url: URL.createObjectURL(file),
  };
}

function previewInstallImage() {
  if (!installImageItem.value.url) return;
  uni.previewImage({
    current: installImageItem.value.url,
    urls: [installImageItem.value.url],
  });
}

function removeInstallImage() {
  if (uploadingImage.value) return;
  clearInstallImage();
}

function clearInstallImage() {
  const currentUrl = installImageItem.value.url;
  if (currentUrl.startsWith("blob:")) {
    URL.revokeObjectURL(currentUrl);
  }
  installImageItem.value = { name: "", url: "" };
  createForm.pictureIds = "";
  uploadProgress.value = 0;
}

async function uploadInstallImage() {
  const image = installImageItem.value;
  const source = image.file || image.path;
  if (!source) {
    return "";
  }

  uploadingImage.value = true;
  uploadProgress.value = 0;
  const response = await uploadFile(source, image.name, (progress: number) => {
    uploadProgress.value = progress;
  }) as { data?: Record<string, unknown>; msg?: string };
  const data = response?.data || {};
  const uploadedValue = data.id ?? data.fileId ?? data.filePath ?? data.file_path ?? data.url;
  if (!uploadedValue) {
    throw { msg: response?.msg || "图片上传成功但未返回文件地址" };
  }
  uploadProgress.value = 100;
  return String(uploadedValue);
}

function validateCreateForm() {
  clearCreateErrors();

  if (createForm.worksheetType === "") {
    return setCreateError("worksheetType", "请选择工单类型");
  }

  if (createForm.urgencyLevel === "") {
    return setCreateError("urgencyLevel", "请选择紧急程度");
  }

  if (createForm.worksheetStatus === "") {
    return setCreateError("worksheetStatus", "请选择工单状态");
  }

  if (!createForm.riseAccount.trim()) {
    return setCreateError("riseAccount", "请输入工单发起人");
  }

  if (!createForm.executeAccount.trim()) {
    return setCreateError("executeAccount", "请输入工单执行人");
  }

  if (!createForm.worksheetInstruction.trim()) {
    return setCreateError("worksheetInstruction", "请输入工单说明");
  }

  if (createForm.deadlineTime && !isDeadlineAfterRiseTime()) {
    return setCreateError("deadlineTime", "截止时间必须晚于发起时间");
  }

  if (isCreateWorksheetFinished.value && !createForm.finishTime) {
    return setCreateError("finishTime", "请选择工单完成时间");
  }

  if (createForm.finishTime && !isFinishAfterRiseTime()) {
    return setCreateError("finishTime", "完成时间不能早于发起时间");
  }

  return true;
}

function setCreateError(key: CreateValidationKey, message: string) {
  validationErrors[key] = message;
  uni.showToast({ title: message, icon: "none" });
  return false;
}

function clearCreateError(key: CreateValidationKey) {
  validationErrors[key] = "";
}

function clearCreateErrors() {
  (Object.keys(validationErrors) as CreateValidationKey[]).forEach((key) => {
    validationErrors[key] = "";
  });
}

function buildCreatePayload() {
  return removeEmptyFields({
    worksheetNumber: createForm.worksheetNumber.trim() || generateWorksheetNumber(),
    worksheetType: Number(createForm.worksheetType),
    riseAccount: createForm.riseAccount.trim(),
    executeAccount: createForm.executeAccount.trim(),
    deviceReference: createForm.deviceReference.trim(),
    urgencyLevel: Number(createForm.urgencyLevel),
    riseTime: normalizeDatetimeForApi(createForm.riseTime),
    finishTime: normalizeDatetimeForApi(createForm.finishTime),
    deadlineTime: normalizeDatetimeForApi(createForm.deadlineTime),
    worksheetStatus: Number(createForm.worksheetStatus),
    worksheetFeedback: createForm.worksheetFeedback.trim(),
    worksheetInstruction: createForm.worksheetInstruction.trim(),
    remark: createForm.remark.trim(),
    address: createForm.address.trim(),
    coordinate: createForm.coordinate.trim(),
    pictureIds: createForm.pictureIds.trim(),
    leakageId: createForm.leakageId ? Number(createForm.leakageId) : undefined,
  });
}

function assertSuccessResponse(response: ApiResponseLike | undefined) {
  const code = response?.code;
  if (code === undefined || code === 0 || code === 200) {
    return;
  }

  throw {
    code,
    msg: response?.msg || "请求失败",
    data: response?.data,
  };
}

function removeEmptyFields(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== "" && value !== undefined && value !== null));
}

function normalizeDatetimeForApi(value: string) {
  if (!value) {
    return undefined;
  }

  const normalizedValue = normalizeDisplayDatetime(value);
  return normalizedValue.includes("T") ? `${normalizedValue.length === 16 ? `${normalizedValue}:00` : normalizedValue}` : normalizedValue;
}

function normalizeDisplayDatetime(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  return trimmedValue.replace(/\s+/, "T");
}

function isDeadlineAfterRiseTime() {
  const riseTimestamp = getDatetimeTimestamp(createForm.riseTime);
  const deadlineTimestamp = getDatetimeTimestamp(createForm.deadlineTime);
  return riseTimestamp !== undefined && deadlineTimestamp !== undefined && deadlineTimestamp > riseTimestamp;
}

function isFinishAfterRiseTime() {
  const riseTimestamp = getDatetimeTimestamp(createForm.riseTime);
  const finishTimestamp = getDatetimeTimestamp(createForm.finishTime);
  return riseTimestamp !== undefined && finishTimestamp !== undefined && finishTimestamp >= riseTimestamp;
}

function getDatetimeTimestamp(value: string) {
  const normalizedValue = normalizeDatetimeForApi(value);
  if (!normalizedValue) {
    return undefined;
  }

  const timestamp = new Date(normalizedValue).getTime();
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

function toDatetimeLocal(value: Date) {
  return `${toDatePart(value)}T${padNumber(value.getHours())}:${padNumber(value.getMinutes())}:${padNumber(value.getSeconds())}`;
}

function toDatePart(value: Date) {
  return `${value.getFullYear()}-${padNumber(value.getMonth() + 1)}-${padNumber(value.getDate())}`;
}

function padNumber(number: number) {
  return String(number).padStart(2, "0");
}

function generateWorksheetNumber() {
  const now = new Date();
  return `WO${now.getFullYear()}${padNumber(now.getMonth() + 1)}${padNumber(now.getDate())}${padNumber(now.getHours())}${padNumber(now.getMinutes())}${padNumber(now.getSeconds())}`;
}
</script>

<style scoped lang="scss">
.work-order-create-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #eef4f8;
}

.work-order-create-page :deep(.worksheet-view) {
  flex: 1;
  height: auto;
}

.primary-button,
.secondary-button,
.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  border-radius: 4px;
}

.primary-button::after,
.secondary-button::after,
.icon-button::after {
  border: 0;
}

.primary-button {
  min-width: 104px;
  height: 36px;
  padding: 0 18px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  line-height: 36px;
  background: #0d82ee;
  border: 1px solid #0d82ee;
}

.primary-button--hover {
  background: #0674d8;
  border-color: #0674d8;
}

.primary-button[disabled] {
  color: #dbeafe;
  background: #82b9ec;
  border-color: #82b9ec;
}

.secondary-button {
  min-width: 84px;
  height: 36px;
  padding: 0 14px;
  color: #31506d;
  font-size: 14px;
  font-weight: 700;
  line-height: 36px;
  background: #f6fbff;
  border: 1px solid #cbdced;
}

.secondary-button--hover {
  color: #0d82ee;
  background: #edf7ff;
  border-color: #a9d7ff;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  background: rgba(15, 35, 55, 0.36);
}

.dialog-panel {
  display: flex;
  flex-direction: column;
  width: min(1120px, calc(100vw - 44px));
  height: min(730px, calc(100vh - 28px));
  max-height: calc(100vh - 28px);
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d8e6f2;
  border-radius: 14px;
  box-shadow: 0 24px 64px rgba(15, 35, 55, 0.24);
}

.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  padding: 20px 26px;
  background: linear-gradient(135deg, #f4faff 0%, #ffffff 58%, #eef7ff 100%);
  border-bottom: 1px solid #edf3f8;
}

.dialog-heading {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 14px;
}

.dialog-heading__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: #ffffff;
  font-size: 19px;
  font-weight: 900;
  background: linear-gradient(145deg, #0d82ee, #0867c2);
  border-radius: 12px;
  box-shadow: 0 8px 18px rgba(13, 130, 238, 0.24);
}

.dialog-title {
  display: block;
  color: #183755;
  font-size: 22px;
  font-weight: 900;
}

.dialog-subtitle {
  display: block;
  margin-top: 4px;
  max-width: min(680px, calc(100vw - 180px));
  overflow: hidden;
  color: #5f7188;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-button {
  width: 32px;
  height: 32px;
  padding: 0;
  color: #64748b;
  background: #f6fbff;
  border: 1px solid #d9e7f3;
}

.icon-button--hover {
  color: #0d82ee;
  background: #edf7ff;
}

.close-icon {
  position: relative;
  width: 14px;
  height: 14px;
}

.close-icon::before,
.close-icon::after {
  position: absolute;
  top: 6px;
  left: 0;
  width: 14px;
  height: 2px;
  content: "";
  background: currentColor;
  border-radius: 2px;
}

.close-icon::before {
  transform: rotate(45deg);
}

.close-icon::after {
  transform: rotate(-45deg);
}

.dialog-body {
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  max-height: none;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  padding: 18px 24px 16px;
  background: #ffffff;
}

.dialog-body :deep(.uni-scroll-view-content) {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}

.error-summary {
  flex: none;
  margin: 12px 24px 0;
  padding: 9px 12px;
  color: #b42318;
  font-size: 13px;
  font-weight: 800;
  background: #fff5f3;
  border: 1px solid #ffc9c0;
  border-radius: 4px;
}

.form-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 340px);
  gap: 18px;
  min-height: 100%;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
}

.form-main {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.form-side {
  min-width: 0;
  padding-left: 0;
  border-left: 0;
}

.form-section {
  min-width: 0;
  padding: 0;
  background: #ffffff;
  border: 0;
  border-radius: 0;
}

.form-card {
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
  padding: 18px;
  background: #ffffff;
  border: 1px solid #e2ebf3;
  border-radius: 10px;
  box-shadow: 0 5px 16px rgba(26, 66, 105, 0.05);
}

.form-card--side {
  min-height: 100%;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbfe 100%);
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  min-width: 0;
  gap: 12px;
  margin-bottom: 11px;
  padding-bottom: 9px;
  border-bottom: 1px solid #eef4fa;
}

.section-title {
  position: relative;
  flex: none;
  padding-left: 10px;
  color: #183755;
  font-size: 16px;
  font-weight: 900;
}

.section-title::before {
  position: absolute;
  top: 50%;
  left: 0;
  width: 3px;
  height: 16px;
  content: "";
  background: #0d82ee;
  border-radius: 999px;
  transform: translateY(-50%);
}

.section-desc {
  min-width: 0;
  overflow: hidden;
  color: #8798aa;
  font-size: 12px;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-grid {
  display: grid;
  gap: 12px 18px;
}

.form-grid--main {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid--side {
  grid-template-columns: 1fr;
}

.form-field {
  position: relative;
  min-width: 0;
}

.form-field--wide {
  grid-column: span 2;
}

.form-label {
  display: block;
  margin-bottom: 5px;
  color: #34495e;
  font-size: 13px;
  font-weight: 700;
}

.form-label--required::after {
  margin-left: 4px;
  color: #ef4444;
  content: "*";
}

.form-input,
.form-select,
.form-textarea {
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  color: #172033;
  font-size: 14px;
  text-overflow: ellipsis;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    background-color 0.16s ease;
}

.form-select {
  max-width: 100%;
}

.form-select__value {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-grid--side .form-input,
.form-grid--side .form-select,
.form-grid--side .form-textarea {
  max-width: 100%;
}

.form-textarea--large {
  max-width: 100%;
}

.form-input,
.form-select {
  height: 38px;
  padding: 0 12px;
  line-height: 38px;
}

.form-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.form-select--dropdown {
  background: #f7fbff;
  box-shadow: inset 0 -1px 0 rgba(13, 130, 238, 0.03);
  cursor: pointer;
}

.form-select--open {
  background: #ffffff;
  border-color: #8fc8f8;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.1);
}

.form-input:focus,
.form-textarea:focus {
  background: #ffffff;
  border-color: #8fc8f8;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.1);
}

.form-control--error,
.form-control--error:focus {
  background: #fffafa;
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-error {
  display: block;
  margin-top: 5px;
  color: #d92d20;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
}

.form-textarea {
  height: 78px;
  padding: 9px 12px;
  line-height: 1.45;
}

.form-textarea--large {
  height: 92px;
}

.select-arrow {
  flex: none;
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.select-field {
  position: relative;
}

.select-menu {
  position: absolute;
  right: 0;
  left: 0;
  z-index: 20;
  margin-top: 4px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  box-shadow: 0 14px 28px rgba(15, 35, 55, 0.16);
}

.select-option {
  min-height: 36px;
  padding: 0 12px;
  color: #172033;
  font-size: 14px;
  font-weight: 700;
  line-height: 36px;
  cursor: pointer;
  border-bottom: 1px solid #edf3f8;
}

.select-option:last-child {
  border-bottom: 0;
}

.select-option:hover,
.select-option--active {
  color: #0d82ee;
  background: #edf7ff;
}

.select-placeholder {
  color: #9aa9b8;
}

.input-placeholder {
  color: #9aa9b8;
}

.dialog-actions {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
  min-width: 0;
  padding: 12px 22px;
  background: #ffffff;
  border-top: 1px solid #edf3f8;
  box-shadow: 0 -8px 18px rgba(24, 55, 85, 0.04);
}

.dialog-actions .primary-button,
.dialog-actions .secondary-button {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-field {
  margin-top: 18px;
}

.upload-placeholder {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 205px;
  padding: 24px 18px;
  background: linear-gradient(180deg, #f8fcff, #f2f8fd);
  border: 2px dashed #bad3e8;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.18s ease;
}

.upload-placeholder:hover {
  background: #edf7ff;
  border-color: #0d82ee;
  transform: translateY(-1px);
}

.upload-placeholder__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: 3px;
  color: #0d82ee;
  font-size: 30px;
  font-weight: 300;
  background: #ffffff;
  border: 1px solid #cce2f5;
  border-radius: 50%;
  box-shadow: 0 7px 18px rgba(13, 130, 238, 0.12);
}

.upload-placeholder__title {
  max-width: 100%;
  overflow: hidden;
  color: #24445f;
  font-size: 15px;
  font-weight: 800;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-placeholder__hint {
  max-width: 100%;
  overflow: hidden;
  color: #8496a8;
  font-size: 12px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-preview {
  position: relative;
  height: 245px;
  overflow: hidden;
  background: #eef5fa;
  border: 1px solid #cdddea;
  border-radius: 10px;
}

.upload-preview__image {
  width: 100%;
  height: 100%;
  cursor: zoom-in;
}

.upload-preview__shade {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 9px 12px;
  color: #ffffff;
  font-size: 12px;
  text-align: center;
  background: linear-gradient(transparent, rgba(10, 30, 48, 0.72));
  pointer-events: none;
}

.upload-remove {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 28px;
  height: 28px;
  margin: 0;
  padding: 0;
  color: #ffffff;
  font-size: 20px;
  line-height: 26px;
  background: rgba(185, 35, 35, 0.9);
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(93, 18, 18, 0.24);
}

.upload-remove::after {
  border: 0;
}

.upload-tip {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 12px;
  color: #6c8194;
  font-size: 12px;
}

.upload-tip__dot {
  width: 6px;
  height: 6px;
  background: #22a06b;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(34, 160, 107, 0.12);
}

@media (max-width: 980px) {
  .form-layout,
  .form-grid--main {
    grid-template-columns: 1fr;
  }

  .form-side {
    padding-left: 0;
    border-left: 0;
  }

  .form-field--wide {
    grid-column: span 1;
  }
}

@media (max-width: 1180px) {
  .dialog-body {
    padding: 16px 18px 14px;
  }

  .form-layout {
    grid-template-columns: minmax(0, 1fr) minmax(250px, 320px);
    gap: 16px;
  }
}

@media (max-width: 560px) {
  .dialog-panel {
    width: calc(100vw - 20px);
  }

  .dialog-head {
    padding: 16px;
  }

  .dialog-subtitle {
    max-width: calc(100vw - 132px);
  }
}
</style>
