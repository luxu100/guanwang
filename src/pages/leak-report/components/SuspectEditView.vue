<template>
  <view class="suspect-edit-view">
    <SuspectTableView ref="tableViewRef" mode="management" @create="openCreateDialog" @edit="openEditDialog" />

    <view v-if="dialogVisible" class="dialog-mask" @click="closeDialog">
      <view class="dialog-panel" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">{{ dialogTitle }}</text>
          <button class="dialog-close" hover-class="dialog-close--hover" aria-label="关闭" @click="closeDialog">×</button>
        </view>

        <scroll-view class="dialog-body" scroll-y>
          <view class="form-layout">
            <view class="form-main">
              <view class="form-section">
                <view class="form-section__title">基础信息</view>
                <view class="form-grid">
                  <view class="form-field">
                    <text class="form-label form-label--required">检出时间</text>
                    <WorkOrderDatetimePicker v-model="form.detectedTime" placeholder="请选择检出时间" title="选择检出时间" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">渗漏部位</text>
                    <input v-model="form.leakPart" class="form-input" placeholder="请输入渗漏部位" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label form-label--required">检出人</text>
                    <input v-model="form.detectAccount" class="form-input" placeholder="请输入检出人账号" placeholder-class="input-placeholder" />
                  </view>
                </view>
              </view>

              <view class="form-section">
                <view class="form-section__title">位置信息</view>
                <view class="form-grid">
                  <view class="form-field form-field--full">
                    <text class="form-label">渗漏位置</text>
                    <input v-model="form.leakAddress" class="form-input" placeholder="请输入渗漏位置" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">渗漏坐标</text>
                    <input v-model="form.leakCoordinate" class="form-input" placeholder="请输入坐标" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">最近设备距离</text>
                    <input v-model="form.closestDeviceDistance" class="form-input" placeholder="请输入距离" placeholder-class="input-placeholder" />
                  </view>
                </view>
              </view>

              <view class="form-section">
                <view class="form-section__title">管道信息</view>
                <view class="form-grid">
                  <view class="form-field">
                    <text class="form-label">管道埋深</text>
                    <input v-model="form.tubeDepth" class="form-input" placeholder="请输入埋深" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">管道材料</text>
                    <input v-model="form.tubeMaterial" class="form-input" placeholder="请输入材料" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">管道口径</text>
                    <input v-model="form.tubeBore" class="form-input" placeholder="请输入口径" placeholder-class="input-placeholder" />
                  </view>
                </view>
              </view>
            </view>

            <view class="form-aside">
              <view class="form-section">
                <view class="form-section__title">关联信息</view>
                <view class="form-grid form-grid--single">
                  <view class="form-field">
                    <text class="form-label">关联设备</text>
                    <input v-model="form.referenceDevices" class="form-input" placeholder="请输入关联设备" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">关联音频</text>
                    <input v-model="form.referenceAudio" class="form-input" placeholder="请输入关联音频" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">关联工单ID</text>
                    <input v-model="form.referenceWorksheetId" class="form-input" placeholder="请输入关联工单ID" placeholder-class="input-placeholder" />
                  </view>
                </view>
              </view>

              <view class="form-section">
                <view class="form-section__title">照片备注</view>
                <view class="form-grid form-grid--single">
                  <view class="form-field">
                    <text class="form-label">渗漏照片</text>
                    <input v-model="form.leakPicture" class="form-input" placeholder="请输入照片地址或ID" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">备注</text>
                    <textarea v-model="form.remark" class="form-textarea" placeholder="请输入备注信息" placeholder-class="input-placeholder" />
                  </view>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>

        <view class="dialog-footer">
          <button class="dialog-button" hover-class="dialog-button--hover" @click="closeDialog">取消</button>
          <button class="dialog-button" hover-class="dialog-button--hover" @click="resetForm">清空表单</button>
          <button class="dialog-button dialog-button--primary" hover-class="dialog-button--primary-hover" :disabled="submitting" @click="submitForm">
            {{ submitting ? "提交中..." : (isEditMode ? "确认更新" : "确认创建") }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import SuspectTableView from "./SuspectTableView.vue";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";
import { createSuspect, updateSuspect } from "@/services/leak-report/suspect-management";

type SuspectRecord = Record<string, unknown>;

interface SuspectForm {
  detectedTime: string;
  leakPart: string;
  detectAccount: string;
  leakAddress: string;
  leakCoordinate: string;
  closestDeviceDistance: string;
  tubeDepth: string;
  tubeMaterial: string;
  tubeBore: string;
  referenceDevices: string;
  referenceAudio: string;
  referenceWorksheetId: string;
  leakPicture: string;
  remark: string;
}

const tableViewRef = ref<InstanceType<typeof SuspectTableView> | null>(null);
const dialogVisible = ref(false);
const submitting = ref(false);
const isEditMode = ref(false);
const editingId = ref<string | number>("");

const form = reactive<SuspectForm>({
  detectedTime: "",
  leakPart: "",
  detectAccount: "",
  leakAddress: "",
  leakCoordinate: "",
  closestDeviceDistance: "",
  tubeDepth: "",
  tubeMaterial: "",
  tubeBore: "",
  referenceDevices: "",
  referenceAudio: "",
  referenceWorksheetId: "",
  leakPicture: "",
  remark: "",
});

const dialogTitle = computed(() => (isEditMode.value ? "编辑疑点" : "新增疑点"));

function openCreateDialog() {
  isEditMode.value = false;
  editingId.value = "";
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(suspect: SuspectRecord) {
  isEditMode.value = true;
  editingId.value = String(suspect.id ?? "");
  fillForm(suspect);
  dialogVisible.value = true;
}

function fillForm(suspect: SuspectRecord) {
  form.detectedTime = String(suspect.detectedTime ?? "").replace("T", " ");
  form.leakPart = String(suspect.leakPart ?? "");
  form.detectAccount = String(suspect.detectAccount ?? "");
  form.leakAddress = String(suspect.leakAddress ?? "");
  form.leakCoordinate = String(suspect.leakCoordinate ?? "");
  form.closestDeviceDistance = String(suspect.closestDeviceDistance ?? "");
  form.tubeDepth = String(suspect.tubeDepth ?? "");
  form.tubeMaterial = String(suspect.tubeMaterial ?? "");
  form.tubeBore = String(suspect.tubeBore ?? "");
  form.referenceDevices = String(suspect.referenceDevices ?? "");
  form.referenceAudio = String(suspect.referenceAudio ?? "");
  form.referenceWorksheetId = String(suspect.referenceWorksheetId ?? "");
  form.leakPicture = String(suspect.leakPicture ?? "");
  form.remark = String(suspect.remark ?? "");
}

function closeDialog() {
  dialogVisible.value = false;
}

function resetForm() {
  form.detectedTime = "";
  form.leakPart = "";
  form.detectAccount = "";
  form.leakAddress = "";
  form.leakCoordinate = "";
  form.closestDeviceDistance = "";
  form.tubeDepth = "";
  form.tubeMaterial = "";
  form.tubeBore = "";
  form.referenceDevices = "";
  form.referenceAudio = "";
  form.referenceWorksheetId = "";
  form.leakPicture = "";
  form.remark = "";
}

function buildPayload() {
  return removeEmptyFields({
    detectedTime: normalizeDatetimeForApi(form.detectedTime),
    leakLevel: 3,
    leakPart: form.leakPart.trim(),
    detectAccount: form.detectAccount.trim(),
    leakAddress: form.leakAddress.trim(),
    leakCoordinate: form.leakCoordinate.trim(),
    closestDeviceDistance: form.closestDeviceDistance.trim(),
    tubeDepth: form.tubeDepth.trim(),
    tubeMaterial: form.tubeMaterial.trim(),
    tubeBore: form.tubeBore.trim(),
    referenceDevices: form.referenceDevices.trim(),
    referenceAudio: form.referenceAudio.trim(),
    referenceWorksheetId: form.referenceWorksheetId.trim(),
    leakPicture: form.leakPicture.trim(),
    remark: form.remark.trim(),
  });
}

function validate() {
  if (!form.detectedTime) {
    uni.showToast({ title: "请选择检出时间", icon: "none" });
    return false;
  }
  if (!form.detectAccount.trim()) {
    uni.showToast({ title: "请输入检出人", icon: "none" });
    return false;
  }
  return true;
}

async function submitForm() {
  if (!validate()) {
    return;
  }

  submitting.value = true;
  try {
    const payload = buildPayload();
    const response = isEditMode.value
      ? await updateSuspect(editingId.value, payload)
      : await createSuspect(payload);
    const code = (response as { code?: number })?.code;
    if (code !== undefined && code !== 0 && code !== 200) {
      throw response;
    }
    uni.showToast({ title: isEditMode.value ? "疑点更新成功" : "疑点创建成功", icon: "success" });
    dialogVisible.value = false;
    tableViewRef.value?.fetchSuspects?.();
  } catch (error) {
    uni.showToast({
      title: (error as { msg?: string })?.msg || (isEditMode.value ? "疑点更新失败" : "疑点创建失败"),
      icon: "none",
    });
  } finally {
    submitting.value = false;
  }
}

function removeEmptyFields(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== "" && value !== undefined && value !== null));
}

function normalizeDatetimeForApi(value: string) {
  if (!value) {
    return undefined;
  }
  const normalizedValue = value.trim().replace(/\s+/, "T");
  return normalizedValue.includes("T") ? `${normalizedValue.length === 16 ? `${normalizedValue}:00` : normalizedValue}` : normalizedValue;
}
</script>

<style scoped lang="scss">
.suspect-edit-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 1500;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 35, 55, 0.45);
}

.dialog-panel {
  display: flex;
  flex-direction: column;
  width: min(960px, calc(100vw - 32px));
  max-height: calc(100vh - 64px);
  overflow: hidden;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 24px 60px rgba(15, 35, 55, 0.28);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  height: 56px;
  padding: 0 20px;
  color: #183755;
  font-size: 18px;
  font-weight: 800;
  background: #f6fafe;
  border-bottom: 1px solid #e3edf6;
}

.dialog-title {
  color: #183755;
  font-size: 18px;
  font-weight: 800;
}

.dialog-close {
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  color: #64748b;
  font-size: 24px;
  line-height: 32px;
  background: transparent;
  border: 0;
  border-radius: 50%;
}

.dialog-close--hover {
  color: #b42318;
  background: #fff1ee;
}

.dialog-body {
  flex: 1;
  min-height: 0;
  padding: 20px;
  overflow-y: auto;
}

.form-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 18px;
}

.form-main,
.form-aside {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.form-section {
  padding: 16px;
  background: #fbfdff;
  border: 1px solid #e3edf6;
  border-radius: 6px;
}

.form-section__title {
  position: relative;
  margin-bottom: 14px;
  padding-left: 10px;
  color: #183755;
  font-size: 15px;
  font-weight: 800;
}

.form-section__title::before {
  position: absolute;
  top: 2px;
  left: 0;
  width: 3px;
  height: 16px;
  content: "";
  background: #0d82ee;
  border-radius: 999px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.form-grid--single {
  grid-template-columns: 1fr;
}

.form-field {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  color: #34495e;
  font-size: 13px;
  font-weight: 700;
}

.form-label--required::before {
  margin-right: 4px;
  color: #b42318;
  content: "*";
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
  height: 38px;
  padding: 0 12px;
  line-height: 38px;
}

.form-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.form-select__arrow {
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.form-textarea {
  height: 88px;
  padding: 8px 12px;
  line-height: 1.5;
}

.input-placeholder {
  color: #9aa9b8;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex: none;
  padding: 14px 20px;
  background: #fbfdff;
  border-top: 1px solid #e3edf6;
}

.dialog-button {
  height: 36px;
  margin: 0;
  padding: 0 18px;
  color: #31506d;
  font-size: 14px;
  font-weight: 700;
  line-height: 36px;
  background: #ffffff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.dialog-button::after {
  border: 0;
}

.dialog-button--hover {
  color: #0d82ee;
  background: #edf7ff;
  border-color: #a9d7ff;
}

.dialog-button--primary {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
}

.dialog-button--primary-hover {
  color: #ffffff;
  background: #0674d8;
  border-color: #0674d8;
}

.dialog-button[disabled] {
  color: #9aa9b8;
  background: #eef2f6;
  border-color: #d7e0e8;
}

@media (max-width: 720px) {
  .form-layout {
    grid-template-columns: 1fr;
  }
}
</style>