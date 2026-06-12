<template>
  <AppShell>
    <view class="work-order-create-page">
      <WorksheetTableView ref="tableViewRef" mode="create" @create="openCreateDialog" />

      <view v-if="dialogVisible" class="dialog-mask" @click="closeCreateDialog">
        <view class="dialog-panel" @click.stop>
          <view class="dialog-head">
            <view>
              <text class="dialog-title">新增工单</text>
              <text class="dialog-subtitle">按工单类型、派发人员和现场信息生成新工单</text>
            </view>
            <button class="icon-button" hover-class="icon-button--hover" aria-label="关闭" @click="closeCreateDialog">
              <text class="close-icon"></text>
            </button>
          </view>

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
                      <picker :range="worksheetTypeOptions" range-key="label" @change="handleTypeChange">
                        <view class="form-select form-select--dropdown">
                          <text>{{ currentTypeLabel }}</text>
                          <text class="select-arrow"></text>
                        </view>
                      </picker>
                    </view>
                    <view class="form-field">
                      <text class="form-label form-label--required">紧急程度</text>
                      <picker :range="urgencyOptions" range-key="label" @change="handleUrgencyChange">
                        <view class="form-select form-select--dropdown">
                          <text>{{ currentUrgencyLabel }}</text>
                          <text class="select-arrow"></text>
                        </view>
                      </picker>
                    </view>
                    <view class="form-field">
                      <text class="form-label form-label--required">工单状态</text>
                      <picker :range="worksheetStatusOptions" range-key="label" @change="handleStatusChange">
                        <view class="form-select form-select--dropdown">
                          <text>{{ currentStatusLabel }}</text>
                          <text class="select-arrow"></text>
                        </view>
                      </picker>
                    </view>
                  </view>
                </view>

                <view class="form-section">
                  <view class="section-head">
                    <text class="section-title">时间安排</text>
                  </view>
                  <view class="form-grid form-grid--main">
                    <view class="form-field">
                      <text class="form-label form-label--required">发起时间</text>
                      <WorkOrderDatetimePicker v-model="createForm.riseTime" title="选择发起时间" placeholder="请选择发起时间" :clearable="false" />
                    </view>
                    <view class="form-field">
                      <text class="form-label">截止时间</text>
                      <WorkOrderDatetimePicker v-model="createForm.deadlineTime" title="选择截止时间" placeholder="请选择截止时间" :min-value="createForm.riseTime" />
                    </view>
                  </view>
                </view>

                <view class="form-section">
                  <view class="section-head">
                    <text class="section-title">派发信息</text>
                  </view>
                  <view class="form-grid form-grid--main">
                    <view class="form-field">
                      <text class="form-label form-label--required">发起人账号</text>
                      <input v-model="createForm.riseAccount" class="form-input" placeholder="请输入发起人账号" placeholder-class="input-placeholder" />
                    </view>
                    <view class="form-field">
                      <text class="form-label form-label--required">执行人账号</text>
                      <input v-model="createForm.executeAccount" class="form-input" placeholder="请输入执行人账号" placeholder-class="input-placeholder" />
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
                      <textarea v-model="createForm.worksheetInstruction" class="form-textarea form-textarea--large" placeholder="请输入工单说明" placeholder-class="input-placeholder" />
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
                      <input v-model="createForm.deviceReference" class="form-input" placeholder="设备编号，多个用逗号分隔" placeholder-class="input-placeholder" />
                    </view>
                    <view class="form-field">
                      <text class="form-label">关联渗漏ID</text>
                      <input v-model="createForm.leakageId" class="form-input" type="number" placeholder="可选" placeholder-class="input-placeholder" />
                    </view>
                    <view class="form-field">
                      <text class="form-label">工单地址</text>
                      <input v-model="createForm.address" class="form-input" placeholder="请输入工单地址" placeholder-class="input-placeholder" />
                    </view>
                    <view class="form-field">
                      <text class="form-label">坐标</text>
                      <input v-model="createForm.coordinate" class="form-input" placeholder="经度,纬度" placeholder-class="input-placeholder" />
                    </view>
                    <view class="form-field">
                      <text class="form-label">照片ID</text>
                      <input v-model="createForm.pictureIds" class="form-input" placeholder="文件ID，多个用逗号分隔" placeholder-class="input-placeholder" />
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
  </AppShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import AppShell from "@/components/AppShell.vue";
import WorksheetTableView from "@/pages/work-order/components/WorksheetTableView.vue";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";
import { createWorksheet } from "@/services/work-order/create";

interface ApiResponseLike {
  code?: number;
  msg?: string;
  data?: unknown;
}

interface SelectOption {
  label: string;
  value: number;
}

interface CreateForm {
  worksheetNumber: string;
  worksheetType: number;
  riseAccount: string;
  executeAccount: string;
  deviceReference: string;
  urgencyLevel: number;
  riseTime: string;
  finishTime: string;
  deadlineTime: string;
  worksheetStatus: number;
  worksheetFeedback: string;
  worksheetInstruction: string;
  remark: string;
  address: string;
  coordinate: string;
  pictureIds: string;
  leakageId: string;
}

const worksheetTypeOptions: SelectOption[] = [
  { label: "巡检", value: 0 },
  { label: "检漏", value: 1 },
  { label: "拆装", value: 2 },
  { label: "维护", value: 3 },
];

const worksheetStatusOptions: SelectOption[] = [
  { label: "待处理", value: 0 },
  { label: "处理中", value: 1 },
  { label: "已完成", value: 2 },
  { label: "已取消", value: 3 },
];

const urgencyOptions: SelectOption[] = [
  { label: "一般", value: 0 },
  { label: "紧急", value: 1 },
];

const tableViewRef = ref<InstanceType<typeof WorksheetTableView> | null>(null);
const dialogVisible = ref(false);
const submitting = ref(false);
const createForm = reactive<CreateForm>(getDefaultCreateForm());

const currentTypeLabel = computed(() => getOptionLabel(worksheetTypeOptions, createForm.worksheetType, "巡检"));
const currentStatusLabel = computed(() => getOptionLabel(worksheetStatusOptions, createForm.worksheetStatus, "待处理"));
const currentUrgencyLabel = computed(() => getOptionLabel(urgencyOptions, createForm.urgencyLevel, "一般"));

function getDefaultCreateForm(): CreateForm {
  return {
    worksheetNumber: "",
    worksheetType: getDefaultOptionValue(worksheetTypeOptions),
    riseAccount: "",
    executeAccount: "",
    deviceReference: "",
    urgencyLevel: getDefaultOptionValue(urgencyOptions),
    riseTime: toDatetimeLocal(new Date()),
    finishTime: "",
    deadlineTime: "",
    worksheetStatus: getDefaultOptionValue(worksheetStatusOptions),
    worksheetFeedback: "",
    worksheetInstruction: "",
    remark: "",
    address: "",
    coordinate: "",
    pictureIds: "",
    leakageId: "",
  };
}

function openCreateDialog() {
  Object.assign(createForm, getDefaultCreateForm());
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
}

function handleTypeChange(event: { detail: { value: number } }) {
  createForm.worksheetType = worksheetTypeOptions[event.detail.value]?.value ?? getDefaultOptionValue(worksheetTypeOptions);
}

function handleStatusChange(event: { detail: { value: number } }) {
  createForm.worksheetStatus = worksheetStatusOptions[event.detail.value]?.value ?? getDefaultOptionValue(worksheetStatusOptions);
}

function handleUrgencyChange(event: { detail: { value: number } }) {
  createForm.urgencyLevel = urgencyOptions[event.detail.value]?.value ?? getDefaultOptionValue(urgencyOptions);
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
  if (!createForm.riseAccount.trim()) {
    uni.showToast({ title: "请输入发起人账号", icon: "none" });
    return false;
  }

  if (!createForm.executeAccount.trim()) {
    uni.showToast({ title: "请输入执行人账号", icon: "none" });
    return false;
  }

  if (!createForm.worksheetInstruction.trim()) {
    uni.showToast({ title: "请输入工单说明", icon: "none" });
    return false;
  }

  if (createForm.deadlineTime && !isDeadlineAfterRiseTime()) {
    uni.showToast({ title: "截止时间必须大于发起时间", icon: "none" });
    return false;
  }

  return true;
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

function getDefaultOptionValue(options: SelectOption[]) {
  return options[0]?.value ?? 0;
}

function getOptionLabel(options: SelectOption[], value: number, fallback: string) {
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
}

.form-input:focus,
.form-textarea:focus {
  background: #ffffff;
  border-color: #8fc8f8;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.1);
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
