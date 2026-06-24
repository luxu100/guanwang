<template>
  <view class="work-order-create-page">
      <WorksheetTableView ref="tableViewRef" mode="create" @create="openCreateDialog" />

      <view v-if="dialogVisible" class="dialog-mask" @click="closeCreateDialog">
        <view class="dialog-panel" @click.stop="closeCreateSelect">
          <view class="dialog-head">
            <view>
              <text class="dialog-title">新增工单</text>
              <text class="dialog-subtitle">按 Worksheet 字段填写工单类型、人员、时间和现场信息</text>
            </view>
            <button class="icon-button" hover-class="icon-button--hover" aria-label="关闭" @click="closeCreateDialog">
              <text class="close-icon"></text>
            </button>
          </view>

          <view v-if="firstCreateError" class="error-summary">{{ firstCreateError }}</view>

          <scroll-view class="dialog-body" scroll-y>
            <view class="form-layout">
              <view class="form-main">
                <view class="form-section">
                  <view class="section-head">
                    <text class="section-title">基础信息</text>
                  </view>
                  <view class="form-grid form-grid--main">
                    <view class="form-field">
                      <text class="form-label">工单编号</text>
                      <input v-model="createForm.worksheetNumber" class="form-input" placeholder="不填则自动生成" placeholder-class="input-placeholder" />
                    </view>
                    <view class="form-field">
                      <text class="form-label form-label--required">工单类型</text>
                      <view class="select-field">
                        <view class="form-select form-select--dropdown" :class="{ 'form-select--open': activeSelect === 'worksheetType', 'form-control--error': validationErrors.worksheetType }" @click.stop="toggleCreateSelect('worksheetType')">
                          <text :class="{ 'select-placeholder': createForm.worksheetType === '' }">{{ currentTypeLabel }}</text>
                          <text class="select-arrow"></text>
                        </view>
                        <view v-if="activeSelect === 'worksheetType'" class="select-menu">
                          <view
                            v-for="item in worksheetTypeOptions"
                            :key="item.value"
                            class="select-option"
                            :class="{ 'select-option--active': createForm.worksheetType === item.value }"
                            @click.stop="selectWorksheetType(item.value)"
                          >
                            {{ item.label }}
                          </view>
                        </view>
                      </view>
                      <text v-if="validationErrors.worksheetType" class="form-error">{{ validationErrors.worksheetType }}</text>
                    </view>
                    <view class="form-field">
                      <text class="form-label form-label--required">紧急等级</text>
                      <view class="select-field">
                        <view class="form-select form-select--dropdown" :class="{ 'form-select--open': activeSelect === 'urgencyLevel', 'form-control--error': validationErrors.urgencyLevel }" @click.stop="toggleCreateSelect('urgencyLevel')">
                          <text :class="{ 'select-placeholder': createForm.urgencyLevel === '' }">{{ currentUrgencyLabel }}</text>
                          <text class="select-arrow"></text>
                        </view>
                        <view v-if="activeSelect === 'urgencyLevel'" class="select-menu">
                          <view
                            v-for="item in urgencyOptions"
                            :key="item.value"
                            class="select-option"
                            :class="{ 'select-option--active': createForm.urgencyLevel === item.value }"
                            @click.stop="selectUrgencyLevel(item.value)"
                          >
                            {{ item.label }}
                          </view>
                        </view>
                      </view>
                      <text v-if="validationErrors.urgencyLevel" class="form-error">{{ validationErrors.urgencyLevel }}</text>
                    </view>
                    <view class="form-field">
                      <text class="form-label form-label--required">工单状态</text>
                      <view class="select-field">
                        <view class="form-select form-select--dropdown" :class="{ 'form-select--open': activeSelect === 'worksheetStatus', 'form-control--error': validationErrors.worksheetStatus }" @click.stop="toggleCreateSelect('worksheetStatus')">
                          <text :class="{ 'select-placeholder': createForm.worksheetStatus === '' }">{{ currentStatusLabel }}</text>
                          <text class="select-arrow"></text>
                        </view>
                        <view v-if="activeSelect === 'worksheetStatus'" class="select-menu">
                          <view
                            v-for="item in worksheetStatusOptions"
                            :key="item.value"
                            class="select-option"
                            :class="{ 'select-option--active': createForm.worksheetStatus === item.value }"
                            @click.stop="selectWorksheetStatus(item.value)"
                          >
                            {{ item.label }}
                          </view>
                        </view>
                      </view>
                      <text v-if="validationErrors.worksheetStatus" class="form-error">{{ validationErrors.worksheetStatus }}</text>
                    </view>
                  </view>
                </view>

                <view class="form-section">
                  <view class="section-head">
                    <text class="section-title">时间安排</text>
                  </view>
                  <view class="form-grid form-grid--main">
                    <view class="form-field">
                      <text class="form-label form-label--required">工单发起时间</text>
                      <WorkOrderDatetimePicker v-model="createForm.riseTime" title="选择工单发起时间" placeholder="请选择工单发起时间" :clearable="false" />
                    </view>
                    <view class="form-field">
                      <text class="form-label">工单截止时间</text>
                      <WorkOrderDatetimePicker v-model="createForm.deadlineTime" title="选择工单截止时间" placeholder="请选择工单截止时间" :min-value="createForm.riseTime" />
                      <text v-if="validationErrors.deadlineTime" class="form-error">{{ validationErrors.deadlineTime }}</text>
                    </view>
                    <view class="form-field">
                      <text class="form-label">工单完成时间</text>
                      <WorkOrderDatetimePicker v-model="createForm.finishTime" title="选择工单完成时间" placeholder="未完成可不填" :min-value="createForm.riseTime" />
                      <text v-if="validationErrors.finishTime" class="form-error">{{ validationErrors.finishTime }}</text>
                    </view>
                  </view>
                </view>

                <view class="form-section">
                  <view class="section-head">
                    <text class="section-title">派发信息</text>
                  </view>
                  <view class="form-grid form-grid--main">
                    <view class="form-field">
                      <text class="form-label form-label--required">工单发起人账号</text>
                      <input v-model="createForm.riseAccount" class="form-input" :class="{ 'form-control--error': validationErrors.riseAccount }" placeholder="请输入工单发起人账号" placeholder-class="input-placeholder" @input="clearCreateError('riseAccount')" />
                      <text v-if="validationErrors.riseAccount" class="form-error">{{ validationErrors.riseAccount }}</text>
                    </view>
                    <view class="form-field">
                      <text class="form-label form-label--required">工单执行人账号</text>
                      <input v-model="createForm.executeAccount" class="form-input" :class="{ 'form-control--error': validationErrors.executeAccount }" placeholder="请输入工单执行人账号" placeholder-class="input-placeholder" @input="clearCreateError('executeAccount')" />
                      <text v-if="validationErrors.executeAccount" class="form-error">{{ validationErrors.executeAccount }}</text>
                    </view>
                  </view>
                </view>

                <view class="form-section">
                  <view class="section-head">
                    <text class="section-title">说明备注</text>
                  </view>
                  <view class="form-grid form-grid--main">
                    <view class="form-field form-field--wide">
                      <text class="form-label form-label--required">工单说明</text>
                      <textarea v-model="createForm.worksheetInstruction" class="form-textarea form-textarea--large" :class="{ 'form-control--error': validationErrors.worksheetInstruction }" placeholder="请输入工单说明" placeholder-class="input-placeholder" @input="clearCreateError('worksheetInstruction')" />
                      <text v-if="validationErrors.worksheetInstruction" class="form-error">{{ validationErrors.worksheetInstruction }}</text>
                    </view>
                    <view class="form-field form-field--wide">
                      <text class="form-label">工单反馈</text>
                      <textarea v-model="createForm.worksheetFeedback" class="form-textarea" placeholder="未处理可不填" placeholder-class="input-placeholder" />
                    </view>
                  </view>
                </view>
              </view>

              <view class="form-side">
                <view class="form-section">
                  <view class="section-head">
                    <text class="section-title">位置与关联</text>
                  </view>
                  <view class="form-grid form-grid--side">
                    <view class="form-field">
                      <text class="form-label">关联设备</text>
                      <input v-model="createForm.deviceReference" class="form-input" placeholder="设备编号列表，多个用逗号分隔" placeholder-class="input-placeholder" />
                    </view>
                    <view class="form-field">
                      <text class="form-label">关联渗漏记录ID</text>
                      <input v-model="createForm.leakageId" class="form-input" type="number" placeholder="请输入关联渗漏记录ID" placeholder-class="input-placeholder" />
                    </view>
                    <view class="form-field">
                      <text class="form-label">工单地址</text>
                      <input v-model="createForm.address" class="form-input" placeholder="请输入工单地址" placeholder-class="input-placeholder" />
                    </view>
                    <view class="form-field">
                      <text class="form-label">工单坐标</text>
                      <input v-model="createForm.coordinate" class="form-input" placeholder="经度,纬度" placeholder-class="input-placeholder" />
                    </view>
                    <view class="form-field">
                      <text class="form-label">工单照片</text>
                      <input v-model="createForm.pictureIds" class="form-input" placeholder="文件 ID 列表，多个用逗号分隔" placeholder-class="input-placeholder" />
                    </view>
                    <view class="form-field">
                      <text class="form-label">备注</text>
                      <textarea v-model="createForm.remark" class="form-textarea form-textarea--large" placeholder="请输入备注" placeholder-class="input-placeholder" />
                    </view>
                  </view>
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
import { computed, reactive, ref } from "vue";
import WorksheetTableView from "@/pages/work-order/components/WorksheetTableView.vue";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";
import { createWorksheet } from "@/services/work-order/create";

interface ApiResponseLike {
  code?: number;
  msg?: string;
  data?: unknown;
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

type CreateSelectKey = "worksheetType" | "urgencyLevel" | "worksheetStatus";
type CreateValidationKey =
  | "worksheetType"
  | "urgencyLevel"
  | "worksheetStatus"
  | "riseAccount"
  | "executeAccount"
  | "worksheetInstruction"
  | "deadlineTime"
  | "finishTime";

const worksheetTypeOptions = [
  { label: "巡检", value: 0 },
  { label: "检漏", value: 1 },
  { label: "拆装", value: 2 },
  { label: "维护", value: 3 },
];

const worksheetStatusOptions = [
  { label: "待处理", value: 0 },
  { label: "处理中", value: 1 },
  { label: "已完成", value: 2 },
  { label: "已取消", value: 3 },
];

const urgencyOptions = [
  { label: "一般", value: 0 },
  { label: "紧急", value: 1 },
];

const tableViewRef = ref<InstanceType<typeof WorksheetTableView> | null>(null);
const dialogVisible = ref(false);
const submitting = ref(false);
const activeSelect = ref<CreateSelectKey | "">("");
const createForm = reactive<CreateForm>(getDefaultCreateForm());
const validationErrors = reactive<Record<CreateValidationKey, string>>(getEmptyValidationErrors());

const currentTypeLabel = computed(() => getOptionLabel(worksheetTypeOptions, createForm.worksheetType, "请选择工单类型"));
const currentStatusLabel = computed(() => getOptionLabel(worksheetStatusOptions, createForm.worksheetStatus, "请选择工单状态"));
const currentUrgencyLabel = computed(() => getOptionLabel(urgencyOptions, createForm.urgencyLevel, "请选择紧急等级"));
const firstCreateError = computed(() => Object.values(validationErrors).find(Boolean) || "");

function getDefaultCreateForm(): CreateForm {
  return {
    worksheetNumber: "",
    worksheetType: "",
    riseAccount: "",
    executeAccount: "",
    deviceReference: "",
    urgencyLevel: "",
    riseTime: toDatetimeLocal(new Date()),
    finishTime: "",
    deadlineTime: "",
    worksheetStatus: "",
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
  clearCreateErrors();
  activeSelect.value = "";
  dialogVisible.value = true;
}

function closeCreateDialog() {
  if (submitting.value) {
    return;
  }

  activeSelect.value = "";
  dialogVisible.value = false;
}

function resetCreateForm() {
  Object.assign(createForm, getDefaultCreateForm());
  clearCreateErrors();
  activeSelect.value = "";
}

function toggleCreateSelect(key: CreateSelectKey) {
  activeSelect.value = activeSelect.value === key ? "" : key;
}

function closeCreateSelect() {
  activeSelect.value = "";
}

function selectWorksheetType(value: number) {
  createForm.worksheetType = value;
  clearCreateError("worksheetType");
  activeSelect.value = "";
}

function selectWorksheetStatus(value: number) {
  createForm.worksheetStatus = value;
  clearCreateError("worksheetStatus");
  activeSelect.value = "";
}

function selectUrgencyLevel(value: number) {
  createForm.urgencyLevel = value;
  clearCreateError("urgencyLevel");
  activeSelect.value = "";
}

async function submitCreate() {
  if (!validateCreateForm()) {
    return;
  }

  submitting.value = true;

  try {
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
  }
}

function validateCreateForm() {
  clearCreateErrors();

  if (createForm.worksheetType === "") {
    return setCreateError("worksheetType", "请选择工单类型");
  }

  if (createForm.urgencyLevel === "") {
    return setCreateError("urgencyLevel", "请选择紧急等级");
  }

  if (createForm.worksheetStatus === "") {
    return setCreateError("worksheetStatus", "请选择工单状态");
  }

  if (!createForm.riseAccount.trim()) {
    return setCreateError("riseAccount", "请输入工单发起人账号");
  }

  if (!createForm.executeAccount.trim()) {
    return setCreateError("executeAccount", "请输入工单执行人账号");
  }

  if (!createForm.worksheetInstruction.trim()) {
    return setCreateError("worksheetInstruction", "请输入工单说明");
  }

  if (createForm.deadlineTime && !isDeadlineAfterRiseTime()) {
    return setCreateError("deadlineTime", "截止时间必须大于发起时间");
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
    worksheetType: createForm.worksheetType,
    riseAccount: createForm.riseAccount.trim(),
    executeAccount: createForm.executeAccount.trim(),
    deviceReference: createForm.deviceReference.trim(),
    urgencyLevel: createForm.urgencyLevel,
    riseTime: normalizeDatetimeForApi(createForm.riseTime),
    finishTime: normalizeDatetimeForApi(createForm.finishTime),
    deadlineTime: normalizeDatetimeForApi(createForm.deadlineTime),
    worksheetStatus: createForm.worksheetStatus,
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

function getOptionLabel(options: Array<{ label: string; value: number }>, value: number | "", fallback: string) {
  return options.find((item) => item.value === value)?.label || fallback;
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
  border-radius: 6px;
  box-shadow: 0 18px 46px rgba(15, 35, 55, 0.2);
}

.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  padding: 18px 24px;
  background: #f8fbfe;
  border-bottom: 1px solid #edf3f8;
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
  color: #5f7188;
  font-size: 13px;
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
  flex: 1;
  min-height: 0;
  max-height: none;
  padding: 18px 24px 16px;
  background: #ffffff;
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
  grid-template-columns: 640px 360px;
  gap: 24px;
  min-height: 100%;
  justify-content: start;
}

.form-main {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.form-side {
  min-width: 0;
  padding-left: 20px;
  border-left: 1px solid #e4edf6;
}

.form-section {
  padding: 0;
  background: #ffffff;
  border: 0;
  border-radius: 0;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 11px;
  padding-bottom: 9px;
  border-bottom: 1px solid #eef4fa;
}

.section-title {
  position: relative;
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

.form-grid {
  display: grid;
  gap: 12px 18px;
}

.form-grid--main {
  grid-template-columns: repeat(2, 305px);
  justify-content: start;
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
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 22px;
  background: #ffffff;
  border-top: 1px solid #edf3f8;
  box-shadow: 0 -8px 18px rgba(24, 55, 85, 0.04);
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
</style>
