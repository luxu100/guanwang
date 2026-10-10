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
            :aria-label="t('common.close')"
            @click="closeDialog"
        >
          <text class="close-icon"></text>
        </button>
      </view>

      <view v-if="firstError" class="error-summary">
        {{ firstError }}
      </view>

      <scroll-view class="dialog-body" scroll-y>
        <view class="form-layout" :class="{ 'form-layout--with-side': asideSchema }">

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
                    :class="{
                        'form-field--full':
                            field.type === 'location'
                    }"
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
                      :class="{ 'form-input--disabled': field.disabled }"
                      :disabled="field.disabled || submitting"
                      class="form-input"
                      :placeholder="field.placeholder || t('form.inputPlaceholder', { label: field.label })"
                      placeholder-class="input-placeholder"
                      @input="clearError(field.key)"
                  />

                  <XUploadPhoto
                      v-else-if="field.type==='photo'"
                      v-model="formData[field.key]"
                      :placeholder="field.placeholder || t('form.uploadPhotoPlaceholder', { label: field.label })"
                      placeholder-class="input -placeholder"
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
                              field.placeholder ||  t('form.selectPlaceholder', { label: field.label })
                          )
                        }}
                      </text>
                      <text class="select-arrow"></text>
                    </view>

                    <view v-if="activeSelect === field.key" class="select-menu">
                      <view
                          v-for="option in field.options"
                          :key="String(option.value)"
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
                  <XDatetimePicker
                      v-else-if="field.type === 'datetime'"
                      v-model="formData[field.key]"
                      class="datetime-wrapper"
                      :title="field.label"
                      :placeholder="field.placeholder || field.label"
                  />

                  <!-- textarea -->
                  <textarea
                      v-else-if="field.type === 'textarea'"
                      v-model="formData[field.key]"
                      class="form-textarea"
                      :class="{ 'form-textarea--large': field.large }"
                      :disabled="field.disabled || submitting"
                      :placeholder="field.placeholder || t('form.inputPlaceholder', { label: field.label })"
                      placeholder-class="input-placeholder"
                      @input="clearError(field.key)"
                  />

                  <!-- location（整行） -->
                  <view v-else-if="field.type === 'location'" class="location-wrapper">
                    <view class="form-row">
                      <input
                          v-model="formData[field.key]"
                          class="form-input"
                          :placeholder="t('formDialog.location.placeholder')"
                          @input="clearError(field.key)"
                      />

                      <button class="form-action-btn" hover-class="form-action-btn--hover" @click="openMapPicker">
                        <text class="form-action-btn__icon form-action-btn__icon--map"></text><text>{{t('formDialog.location.pickMap')}}</text>
                      </button>
                    </view>
                    <!--  地图弹层 -->
                    <view v-if="mapPickerVisible" class="map-picker-panel">

                      <!-- 顶部提示 -->
                      <view class="map-picker-head">
                        <text class="map-picker-title">{{t('formDialog.location.title')}}</text>

                        <text
                            class="map-picker-coord"
                            :class="{ 'map-picker-coord--active': mapPickedCoord }"
                        >
                          {{ mapPickedCoord || t('formDialog.location.selectHint') }}
                        </text>
                      </view>

                      <!-- 地图主体 -->
                      <view class="map-picker-body">

                        <!-- H5 地图 -->
                        <!-- #ifdef H5 -->
                        <XSelectCoordinateMap
                            :lng="mapPickerCenter.lng"
                            :lat="mapPickerCenter.lat"
                            selectable
                            @pick="handleMapPick"
                        />
                        <!-- #endif -->

                        <!-- 非 H5 fallback -->
                        <!-- #ifndef H5 -->
                        <view class="map-picker-canvas">
                          {{t('formDialog.location.onlyH5')}}
                        </view>
                        <!-- #endif -->

                      </view>

                      <!-- 操作按钮 -->
                      <view class="map-picker-actions">
                        <button
                            class="dialog-btn dialog-btn--cancel"
                            @click="closeMapPicker"
                        >
                          {{t('formDialog.cancel')}}
                        </button>

                        <button
                            class="dialog-btn dialog-btn--primary"
                            :disabled="!mapPickedCoord"
                            @click="confirmMapPick"
                        >
                          {{t('formDialog.location.confirm')}}
                        </button>
                      </view>

                    </view>
                  </view>
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
            :disabled="submitting"
        >
          {{t('formDialog.cancel')}}
        </button>

        <button
            class="secondary-button"
            hover-class="secondary-button--hover"
            @click="resetForm"
            :disabled="submitting"
        >
          {{t('formDialog.reset')}}
        </button>

        <button
            class="primary-button"
            :disabled="submitting"
            hover-class="primary-button--hover"
            @click="handleSubmit"
        >
          {{ submitting ? t('formDialog.submitting') : t('formDialog.submit') }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type {FieldOption, FormSection} from "@/pages/device/components/x/types";
import XDatetimePicker from "@/pages/device/components/x/form/XDatetimePicker.vue";
import XSelectCoordinateMap from "@/pages/device/components/x/form/XSelectCoordinateMap.vue";

import {createScopedT} from "@/i18n";
import XUploadPhoto from "@/pages/device/components/x/upload/XUploadPhoto.vue";
const t = createScopedT("devicePage");

interface Props {
  modelValue: Record<string, any>;
  schema: FormSection[];
  asideSchema?: FormSection;
  title?: string;
  subtitle?: string;
  visible: boolean;
  submitHandler?: (value: Record<string, any>) => Promise<void>;
}

interface Emits {
  (e: "field-change", key: string, value: any): void;
  (e: "update:modelValue", value: Record<string, any>): void;
  (e: "update:visible", value: boolean): void;
  (e: "submit", value: Record<string, any>): void;
  (e: "cancel"): void;
}

/* ===================== props ===================== */

const props = withDefaults(defineProps<Props>(), {
  title: "",
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
  if (submitting.value || props.schema.some(section => section.fields.some(field => field.key === key && field.disabled))) return;
  activeSelect.value = activeSelect.value === key ? "" : key;
}

function closeSelect() {
  activeSelect.value = "";
}

function selectOption(key: string, value: any) {
  if (submitting.value) return;
  formData.value[key] = value;
  if (props.submitHandler) emit("update:modelValue", { ...formData.value });
  if (props.submitHandler) emit("field-change", key, value);
  clearError(key);
  activeSelect.value = "";
}

/* ===================== form ===================== */

function resetFormState() {
  activeSelect.value = "";
  clearAllErrors();
}

function resetForm() {
  if (submitting.value) return;
  if (props.submitHandler) {
    formData.value = { ...props.modelValue };
    resetFormState();
    return;
  }
  Object.keys(formData.value).forEach((key) => {
    formData.value[key] = "";
  });
  resetFormState();
}

function handleCancel() {
  if (submitting.value) return;
  emit("cancel");
  closeDialog();
}

async function handleSubmit() {
  if (submitting.value) return;
  if (!validateForm()) return;

  submitting.value = true;

  try {
    if (props.submitHandler) {
      await props.submitHandler({ ...formData.value });
      visible.value = false;
      resetFormState();
      return;
    }
    emit("submit", removeEmptyFields(formData.value));
    submitting.value = false;
    closeDialog();
    resetForm();
  } catch (error: any) {
    validationErrors.submit = error?.msg || error?.message || t('message.operationFailed');
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
          validationErrors[field.key] = t('form.inputPlaceholder', {
            label: field.label
          });
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

const mapPickerVisible = ref(false);
const mapPickedCoord = ref("");
const mapPickerCenter = ref({
  lng: 121.4737,
  lat: 31.2304,
});

function openMapPicker() {
  mapPickedCoord.value = "";
  uni.getLocation({
    type: "gcj02",
    success: (result) => {
      mapPickerCenter.value = {
        lng: result.longitude,
        lat: result.latitude,
      };

      mapPickerVisible.value = true;
    },

    fail: () => {
      mapPickerCenter.value = {
        lng: 121.4737,
        lat: 31.2304,
      };

      mapPickerVisible.value = true;
    },
  });
}

function handleMapPick(coordinate: {
  lng: number;
  lat: number;
}) {
  mapPickedCoord.value =
      `${coordinate.lng.toFixed(6)},${coordinate.lat.toFixed(6)}`;
}

function confirmMapPick() {
  if (mapPickedCoord.value){
    formData.value.coordinate = mapPickedCoord.value;
  }
  closeMapPicker();
}

function closeMapPicker() {
  mapPickerVisible.value = false;
  mapPickedCoord.value = "";
}
</script>
<style scoped lang="scss">
.datetime-wrapper {
  display: block;
  width: 100%;
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
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  background: rgba(15, 35, 55, 0.36);
}

.dialog-panel {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
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
  box-sizing: border-box;
  width: 100%;
  min-height: 0;
  max-height: none;
  padding: 18px 24px 16px;
  overflow-x: hidden;
  overflow-y: auto;
  background: #ffffff;
}

.dialog-body :deep(.uni-scroll-view-content) {
  box-sizing: border-box;
  width: 100%;
  min-height: 100%;
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

/* ===================== layout ===================== */

.form-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  box-sizing: border-box;
  width: 100%;
  min-height: 100%;
  justify-content: start;
}

.form-layout--with-side {
  grid-template-columns: minmax(0, 640px) minmax(280px, 360px);
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

/* ===================== grid ===================== */

.form-grid {
  display: grid;
  gap: 12px 18px;
}

.form-grid--main {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  justify-content: start;
}

.form-grid--side {
  grid-template-columns: 1fr;
}

/* ===================== ⭐新增：跨整行支持 ===================== */

.form-field--full {
  grid-column: 1 / -1;
}

/* ===================== field ===================== */

.form-field {
  position: relative;
  width: 100%;
  min-width: 0;
  overflow: visible;
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

/* ===================== inputs ===================== */

.form-input,
.form-select,
.form-textarea {
  box-sizing: border-box;
  width: 100%;
  color: #172033;
  font-size: 14px;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
  transition: all 0.16s ease;
}

.form-input,
.form-select {
  height: 38px;
  padding: 0 12px;
  line-height: 38px;
}

.form-textarea {
  height: 78px;
  padding: 9px 12px;
  line-height: 1.45;
}

.form-textarea--large {
  height: 92px;
}

/* focus */
.form-input:focus,
.form-textarea:focus {
  background: #ffffff;
  border-color: #8fc8f8;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.1);
}

/* ===================== select ===================== */

.form-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-select--dropdown {
  background: #f7fbff;
  cursor: pointer;
}

.form-select--open {
  background: #ffffff;
  border-color: #8fc8f8;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.1);
}

.select-arrow {
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.select-menu {
  position: absolute;
  right: 0;
  left: 0;
  z-index: 20;
  margin-top: 4px;
  background: #ffffff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  box-shadow: 0 14px 28px rgba(15, 35, 55, 0.16);
}

.select-option {
  min-height: 36px;
  padding: 0 12px;
  font-size: 14px;
  font-weight: 700;
  line-height: 36px;
  cursor: pointer;
  border-bottom: 1px solid #edf3f8;
}

.select-option:hover,
.select-option--active {
  color: #0d82ee;
  background: #edf7ff;
}

.select-placeholder {
  color: #9aa9b8;
}

/* ===================== error ===================== */

.form-error {
  margin-top: 5px;
  color: #d92d20;
  font-size: 12px;
  font-weight: 700;
}

/* ===================== actions ===================== */

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  flex: none;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 22px;
  background: #ffffff;
  border-top: 1px solid #edf3f8;
}

/* ===================== responsive ===================== */

@media (max-width: 980px) {
  .form-layout,
  .form-layout--with-side,
  .form-grid--main {
    grid-template-columns: 1fr;
  }

  .form-side {
    padding-left: 0;
    border-left: 0;
  }

  .form-field--full {
    grid-column: auto;
  }
}

/* ===================== location button ===================== */

.form-action-btn {
  display: flex;
  align-items: center;
  height: 38px;
  padding: 0 14px;
  width: 160px;
  color: #0d82ee;
  font-size: 13px;
  font-weight: 700;
  background: #edf7ff;
  border: 1px solid #b8ddf8;
  border-radius: 4px;
  gap: 4px;
}

.form-field--full {
  grid-column: 1 / -1;
}

/* 让 location 内部更稳定 */
.form-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* 小屏自动降级 */
@media (max-width: 980px) {
  .form-grid--main {
    grid-template-columns: 1fr;
  }

  .form-field--full {
    grid-column: auto;
  }
}

.form-action-btn__icon--map {
  display: inline-block;
  width: 14px;
  height: 14px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230d82ee'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z'/%3E%3C/svg%3E") center / contain no-repeat;
}

.map-picker-panel {
  margin-top: 12px;
  border: 1px solid #d5e2ee;
  border-radius: 6px;
  overflow: hidden;
}

.map-picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f8fbfe;
  border-bottom: 1px solid #edf3f8;
}

.map-picker-title {
  color: #183755;
  font-size: 14px;
  font-weight: 700;
}

.map-picker-coord {
  color: #94a3b8;
  font-size: 13px;

  &--active {
    color: #0d82ee;
    font-weight: 700;
  }
}

.map-picker-body {
  position: relative;
  width: 100%;
  height: 300px;
}

.map-picker-canvas {
  width: 100%;
  height: 100%;

  &--fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #7c8da1;
    font-size: 14px;
    background: #f8fafc;
  }
}

.map-picker-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 10px 14px;
  background: #fff;
  border-top: 1px solid #edf3f8;
}
.dialog-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  height: 38px;
  padding: 0 22px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.16s ease;

  // 取消按钮样式
  &--cancel {
    color: #34495e;
    background: #f1f5f9;
    border: 1px solid #d5e2ee;
  }

  // 主要按钮样式
  &--primary {
    color: #fff;
    background: #0d82ee;
    border: 1px solid #0d82ee;
  }

  // 悬停状态
  &--hover {
    opacity: 0.85;
  }

  // 禁用状态
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.form-input--disabled {
  color: #64748b;
  background: #f5f8fb;
  border-color: #d5e2ee;
  cursor: not-allowed;

  &:focus {
    background: #f5f8fb;
    border-color: #d5e2ee;
    box-shadow: none;
  }
}

.form-layout:not(.form-layout--with-side) {
  padding-right: 12px;
}
</style>
