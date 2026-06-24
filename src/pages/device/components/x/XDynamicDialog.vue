<template>
  <view v-if="visible" class="dialog-mask" @click="closeDialog">
    <view class="dialog-panel" @click.stop="closeSelect">
      <view class="dialog-head">
        <view>
          <text class="dialog-title">{{ title }}</text>
          <text v-if="subtitle" class="dialog-subtitle">{{ subtitle }}</text>
        </view>

        <button
            class="icon-button"
            hover-class="icon-button--hover"
            aria-label="关闭"
            @click="closeDialog"
        >
          <text class="close-icon"></text>
        </button>
      </view>

      <view v-if="firstError" class="error-summary">
        {{ firstError }}
      </view>

      <scroll-view class="dialog-body" scroll-y>
        <view class="form-layout">

          <view class="form-main">
            <view
                v-for="(section, index) in schema"
                :key="index"
                class="form-section"
            >
              <view class="section-head">
                <text class="section-title">{{ section.title }}</text>
              </view>

              <view class="form-grid form-grid--main">
                <view
                    v-for="field in section.fields"
                    :key="field.key"
                    class="form-field"
                >
                  <text
                      class="form-label"
                      :class="{ 'form-label--required': field.required }"
                  >
                    {{ field.label }}
                  </text>

                  <!-- input -->
                  <input
                      v-if="field.type === 'input'"
                      v-model="formData[field.key]"
                      class="form-input"
                      :placeholder="field.placeholder"
                      placeholder-class="input-placeholder"
                      @input="clearError(field.key)"
                  />

                  <!-- select -->
                  <view v-else-if="field.type === 'select'" class="select-field">
                    <view
                        class="form-select form-select--dropdown"
                        :class="{
                        'form-select--open': activeSelect === field.key,
                        'form-control--error': validationErrors[field.key]
                      }"
                        @click.stop="toggleSelect(field.key)"
                    >
                      <text
                          :class="{
                          'select-placeholder': !formData[field.key]
                        }"
                      >
                        {{
                          getSelectLabel(
                              field.options,
                              formData[field.key],
                              field.placeholder
                          )
                        }}
                      </text>
                      <text class="select-arrow"></text>
                    </view>

                    <view v-if="activeSelect === field.key" class="select-menu">
                      <view
                          v-for="option in field.options"
                          :key="option.value"
                          class="select-option"
                          :class="{
                          'select-option--active':
                            formData[field.key] === option.value
                        }"
                          @click.stop="selectOption(field.key, option.value)"
                      >
                        {{ option.label }}
                      </view>
                    </view>
                  </view>

                  <!-- datetime placeholder -->
                  <view
                      v-else-if="field.type === 'datetime'"
                      class="form-input"
                  >
                    {{ field.placeholder }}
                  </view>

                  <!-- textarea -->
                  <textarea
                      v-else-if="field.type === 'textarea'"
                      v-model="formData[field.key]"
                      class="form-textarea"
                      :class="{ 'form-textarea--large': field.large }"
                      :placeholder="field.placeholder"
                      placeholder-class="input-placeholder"
                      @input="clearError(field.key)"
                  />

                  <!-- error -->
                  <text
                      v-if="validationErrors[field.key]"
                      class="form-error"
                  >
                    {{ validationErrors[field.key] }}
                  </text>
                </view>
              </view>
            </view>
          </view>

          <!-- aside -->
          <view v-if="asideSchema" class="form-side">
            <view class="form-section">
              <view class="section-head">
                <text class="section-title">{{ asideSchema.title }}</text>
              </view>

              <view class="form-grid form-grid--side">
                <view
                    v-for="field in asideSchema.fields"
                    :key="field.key"
                    class="form-field"
                >
                  <text class="form-label">{{ field.label }}</text>
                  <input
                      v-model="formData[field.key]"
                      class="form-input"
                      :placeholder="field.placeholder"
                      placeholder-class="input-placeholder"
                  />
                </view>
              </view>
            </view>
          </view>

        </view>
      </scroll-view>

      <view class="dialog-actions">
        <button
            class="secondary-button"
            hover-class="secondary-button--hover"
            @click="handleCancel"
        >
          取消
        </button>

        <button
            class="secondary-button"
            hover-class="secondary-button--hover"
            @click="resetForm"
        >
          清空表单
        </button>

        <button
            class="primary-button"
            :disabled="submitting"
            hover-class="primary-button--hover"
            @click="handleSubmit"
        >
          {{ submitting ? "提交中..." : "确认提交" }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type {FieldOption, FormSection} from "@/pages/device/components/x/types";

interface Props {
  modelValue: Record<string, any>;
  schema: FormSection[];
  asideSchema?: FormSection;
  title?: string;
  subtitle?: string;
  visible: boolean;
}

interface Emits {
  (e: "update:modelValue", value: Record<string, any>): void;
  (e: "update:visible", value: boolean): void;
  (e: "submit", value: Record<string, any>): void;
  (e: "cancel"): void;
}

/* ===================== props ===================== */

const props = withDefaults(defineProps<Props>(), {
  title: "新增信息",
  subtitle: "",
  asideSchema: undefined
});

const emit = defineEmits<Emits>();

/* ===================== state ===================== */

const submitting = ref(false);
const activeSelect = ref("");

const formData = ref<Record<string, any>>({ ...props.modelValue });

const validationErrors = reactive<Record<string, string>>({});

/* ===================== visible control ===================== */

const visible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val)
});

/* ===================== computed ===================== */

const firstError = computed(() => {
  return Object.values(validationErrors).find(Boolean) || "";
});

/* ===================== sync model ===================== */

watch(
    () => props.modelValue,
    (val) => {
      Object.assign(formData.value, val);
    },
    { deep: true }
);

/* ===================== dialog control ===================== */

function openDialog() {
  visible.value = true;
  resetFormState();
}

function closeDialog() {
  if (submitting.value) return;
  visible.value = false;
  activeSelect.value = "";
}

/* ===================== select ===================== */

function toggleSelect(key: string) {
  activeSelect.value = activeSelect.value === key ? "" : key;
}

function closeSelect() {
  activeSelect.value = "";
}

function selectOption(key: string, value: any) {
  formData.value[key] = value;
  clearError(key);
  activeSelect.value = "";
}

/* ===================== form ===================== */

function resetFormState() {
  activeSelect.value = "";
  clearAllErrors();
}

function resetForm() {
  Object.keys(formData.value).forEach((key) => {
    formData.value[key] = "";
  });
  resetFormState();
}

function handleCancel() {
  emit("cancel");
  closeDialog();
}

async function handleSubmit() {
  if (!validateForm()) return;

  submitting.value = true;

  try {
    emit("submit", removeEmptyFields(formData.value));
    closeDialog();
    resetForm();
  } finally {
    submitting.value = false;
  }
}

/* ===================== validate ===================== */

function validateForm() {
  clearAllErrors();
  let isValid = true;

  props.schema.forEach((section) => {
    section.fields.forEach((field) => {
      if (field.required) {
        const value = formData.value[field.key];
        if (value === undefined || value === null || value.toString().trim() === "") {
          validationErrors[field.key] = `请输入${field.label}`;
          isValid = false;
        }
      }
    });
  });

  return isValid;
}

/* ===================== utils ===================== */

function clearError(key: string) {
  validationErrors[key] = "";
}

function clearAllErrors() {
  Object.keys(validationErrors).forEach((key) => {
    validationErrors[key] = "";
  });
}

function getSelectLabel(
    options: FieldOption[] = [],
    value: string | number | undefined,
    fallback: string = ""
) {
  if (value === undefined || value === null) return fallback;

  return options.find(opt => opt.value === value)?.label || fallback;
}

function removeEmptyFields(data: Record<string, any>) {
  const result: Record<string, any> = {};
  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (value !== "" && value !== null && value !== undefined) {
      result[key] = value;
    }
  });
  return result;
}

/* ===================== expose ===================== */

defineExpose({
  openDialog,
  closeDialog
});
</script>
<style scoped lang="scss">
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
