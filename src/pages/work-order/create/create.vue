<template>
  <AppShell>
    <view class="work-order-create-page">
      <WorksheetTableView ref="tableViewRef" mode="create" @create="openCreateDialog" />

      <view v-if="dialogVisible" class="dialog-mask" @click="closeCreateDialog">
        <view class="dialog-panel" @click.stop>
          <view class="dialog-head">
            <view>
              <text class="dialog-title">新增工单</text>
              <text class="dialog-subtitle">填写基础信息后创建工单记录</text>
            </view>
            <button class="icon-button" hover-class="icon-button--hover" aria-label="关闭" @click="closeCreateDialog">
              <text class="close-icon"></text>
            </button>
          </view>

          <scroll-view class="dialog-body" scroll-y>
            <view class="form-grid">
              <view class="form-field">
                <text class="form-label">工单编号</text>
                <input v-model="createForm.worksheetNumber" class="form-input" placeholder="不填则自动生成" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">工单类型</text>
                <picker :range="worksheetTypeOptions" range-key="label" @change="handleTypeChange">
                  <view class="form-select">{{ currentTypeLabel }}</view>
                </picker>
              </view>
              <view class="form-field">
                <text class="form-label">紧急程度</text>
                <picker :range="urgencyOptions" range-key="label" @change="handleUrgencyChange">
                  <view class="form-select">{{ currentUrgencyLabel }}</view>
                </picker>
              </view>
              <view class="form-field">
                <text class="form-label">工单状态</text>
                <picker :range="worksheetStatusOptions" range-key="label" @change="handleStatusChange">
                  <view class="form-select">{{ currentStatusLabel }}</view>
                </picker>
              </view>
              <view class="form-field">
                <text class="form-label">发起人账号</text>
                <input v-model="createForm.riseAccount" class="form-input" placeholder="请输入发起人" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">执行人账号</text>
                <input v-model="createForm.executeAccount" class="form-input" placeholder="请输入执行人" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">关联设备</text>
                <input v-model="createForm.deviceReference" class="form-input" placeholder="设备编号，多个用逗号分隔" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">关联渗漏ID</text>
                <input v-model="createForm.leakageId" class="form-input" type="number" placeholder="可选" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">发起时间</text>
                <input v-model="createForm.riseTime" class="form-input" type="datetime-local" />
              </view>
              <view class="form-field">
                <text class="form-label">截止时间</text>
                <input v-model="createForm.deadlineTime" class="form-input" type="datetime-local" />
              </view>
              <view class="form-field form-field--wide">
                <text class="form-label">工单地址</text>
                <input v-model="createForm.address" class="form-input" placeholder="请输入地址" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">坐标</text>
                <input v-model="createForm.coordinate" class="form-input" placeholder="经度,纬度" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">照片ID</text>
                <input v-model="createForm.pictureIds" class="form-input" placeholder="文件ID，多个用逗号分隔" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field form-field--wide">
                <text class="form-label">工单说明</text>
                <textarea v-model="createForm.worksheetInstruction" class="form-textarea" placeholder="请输入工单说明" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field form-field--wide">
                <text class="form-label">备注</text>
                <textarea v-model="createForm.remark" class="form-textarea" placeholder="请输入备注" placeholder-class="input-placeholder" />
              </view>
            </view>
          </scroll-view>

          <view class="dialog-actions">
            <button class="secondary-button" hover-class="secondary-button--hover" @click="resetCreateForm">清空</button>
            <button class="secondary-button" hover-class="secondary-button--hover" @click="closeCreateDialog">取消</button>
            <button class="primary-button" :disabled="submitting" hover-class="primary-button--hover" @click="submitCreate">
              {{ submitting ? "提交中..." : "创建工单" }}
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
import { createWorksheet } from "@/services/work-order/create";

interface ApiResponseLike {
  code?: number;
  msg?: string;
  data?: unknown;
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
const createForm = reactive<CreateForm>(getDefaultCreateForm());

const currentTypeLabel = computed(() => getOptionLabel(worksheetTypeOptions, createForm.worksheetType, "巡检"));
const currentStatusLabel = computed(() => getOptionLabel(worksheetStatusOptions, createForm.worksheetStatus, "待处理"));
const currentUrgencyLabel = computed(() => getOptionLabel(urgencyOptions, createForm.urgencyLevel, "一般"));

function getDefaultCreateForm(): CreateForm {
  return {
    worksheetNumber: "",
    worksheetType: 0,
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

function openCreateDialog() {
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
  createForm.worksheetType = worksheetTypeOptions[event.detail.value]?.value ?? 0;
}

function handleStatusChange(event: { detail: { value: number } }) {
  createForm.worksheetStatus = worksheetStatusOptions[event.detail.value]?.value ?? 0;
}

function handleUrgencyChange(event: { detail: { value: number } }) {
  createForm.urgencyLevel = urgencyOptions[event.detail.value]?.value ?? 0;
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

function getOptionLabel(options: Array<{ label: string; value: number }>, value: number, fallback: string) {
  return options.find((item) => item.value === value)?.label || fallback;
}

function removeEmptyFields(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== "" && value !== undefined && value !== null));
}

function normalizeDatetimeForApi(value: string) {
  if (!value) {
    return undefined;
  }

  return value.includes("T") ? `${value.length === 16 ? `${value}:00` : value}` : value;
}

function toDatetimeLocal(value: Date) {
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function generateWorksheetNumber() {
  const now = new Date();
  const pad = (number: number) => String(number).padStart(2, "0");
  return `WO${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}
</script>

<style scoped lang="scss">
.work-order-create-page {
  position: relative;
  min-height: var(--shell-content-min-height);
  background: #eef4f8;
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
  height: 34px;
  padding: 0 16px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  line-height: 34px;
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
  height: 34px;
  padding: 0 14px;
  color: #31506d;
  font-size: 14px;
  font-weight: 700;
  line-height: 34px;
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
  padding: 24px;
  background: rgba(15, 35, 55, 0.36);
}

.dialog-panel {
  display: flex;
  flex-direction: column;
  width: min(980px, 96vw);
  max-height: 88vh;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #dbe6ee;
  border-radius: 6px;
  box-shadow: 0 18px 48px rgba(15, 35, 55, 0.22);
}

.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid #edf3f8;
}

.dialog-title {
  display: block;
  color: #183755;
  font-size: 17px;
  font-weight: 900;
}

.dialog-subtitle {
  display: block;
  margin-top: 4px;
  color: #64748b;
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
  max-height: calc(88vh - 124px);
  padding: 16px 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.form-field {
  min-width: 0;
}

.form-field--wide {
  grid-column: span 2;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  color: #34495e;
  font-size: 13px;
  font-weight: 700;
}

.form-input,
.form-select,
.form-textarea {
  box-sizing: border-box;
  width: 100%;
  color: #172033;
  font-size: 14px;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.form-input,
.form-select {
  height: 34px;
  padding: 0 10px;
  line-height: 34px;
}

.form-textarea {
  height: 82px;
  padding: 8px 10px;
  line-height: 1.45;
}

.input-placeholder {
  color: #9aa9b8;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 18px 16px;
  border-top: 1px solid #edf3f8;
}

@media (max-width: 980px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-field--wide {
    grid-column: span 1;
  }
}
</style>
