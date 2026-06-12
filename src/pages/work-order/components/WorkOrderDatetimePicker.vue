<template>
  <view class="datetime-picker">
    <view class="datetime-picker__control" :class="{ 'datetime-picker__control--empty': !displayValue }" @click="openPanel">
      <text class="datetime-picker__value">{{ displayValue || placeholder }}</text>
      <text class="datetime-picker__icon"></text>
    </view>

    <view v-if="panelVisible" class="datetime-panel-mask" @click="closePanel">
      <view class="datetime-panel" @click.stop>
        <view class="datetime-panel__head">
          <text class="datetime-panel__title">{{ title }}</text>
          <text class="datetime-panel__close" @click="closePanel">×</text>
        </view>

        <view class="datetime-panel__preview">{{ previewText }}</view>

        <view class="datetime-panel__grid">
          <view v-for="item in fieldConfigs" :key="item.key" class="datetime-stepper">
            <text class="datetime-stepper__label">{{ item.label }}</text>
            <view class="datetime-stepper__body">
              <button class="datetime-stepper__button" hover-class="datetime-stepper__button--hover" @click="adjustField(item.key, -1)">-</button>
              <text class="datetime-stepper__value">{{ item.value }}</text>
              <button class="datetime-stepper__button" hover-class="datetime-stepper__button--hover" @click="adjustField(item.key, 1)">+</button>
            </view>
          </view>
        </view>

        <view class="datetime-panel__quick">
          <button class="datetime-panel__quick-button" hover-class="datetime-panel__quick-button--hover" @click="setNow">当前时间</button>
          <button v-if="clearable" class="datetime-panel__quick-button" hover-class="datetime-panel__quick-button--hover" @click="clearValue">清空</button>
        </view>

        <view class="datetime-panel__actions">
          <button class="datetime-panel__button" hover-class="datetime-panel__button--hover" @click="closePanel">取消</button>
          <button class="datetime-panel__button datetime-panel__button--primary" hover-class="datetime-panel__button--primary-hover" @click="confirmValue">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";

type FieldKey = "year" | "month" | "day" | "hour" | "minute" | "second";

const props = withDefaults(defineProps<{
  modelValue?: string;
  placeholder?: string;
  title?: string;
  minValue?: string;
  clearable?: boolean;
}>(), {
  modelValue: "",
  placeholder: "请选择时间",
  title: "选择时间",
  minValue: "",
  clearable: true,
});

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

const panelVisible = ref(false);
const draft = reactive({
  year: 2026,
  month: 1,
  day: 1,
  hour: 0,
  minute: 0,
  second: 0,
});

const displayValue = computed(() => formatDatetimeForDisplay(props.modelValue));
const previewText = computed(() => formatDraft());
const fieldConfigs = computed(() => [
  { key: "year" as const, label: "年", value: String(draft.year) },
  { key: "month" as const, label: "月", value: padNumber(draft.month) },
  { key: "day" as const, label: "日", value: padNumber(draft.day) },
  { key: "hour" as const, label: "时", value: padNumber(draft.hour) },
  { key: "minute" as const, label: "分", value: padNumber(draft.minute) },
  { key: "second" as const, label: "秒", value: padNumber(draft.second) },
]);

function openPanel() {
  setDraftFromValue(props.modelValue || toDatetimeValue(new Date()));
  panelVisible.value = true;
}

function closePanel() {
  panelVisible.value = false;
}

function adjustField(field: FieldKey, step: number) {
  if (field === "year") {
    draft.year = clamp(draft.year + step, new Date().getFullYear() - 2, new Date().getFullYear() + 7);
  } else if (field === "month") {
    draft.month = wrap(draft.month + step, 1, 12);
  } else if (field === "day") {
    draft.day = wrap(draft.day + step, 1, getMaxDay());
  } else if (field === "hour") {
    draft.hour = wrap(draft.hour + step, 0, 23);
  } else if (field === "minute") {
    draft.minute = wrap(draft.minute + step, 0, 59);
  } else {
    draft.second = wrap(draft.second + step, 0, 59);
  }

  draft.day = Math.min(draft.day, getMaxDay());
}

function setNow() {
  setDraftFromValue(toDatetimeValue(new Date()));
}

function clearValue() {
  emit("update:modelValue", "");
  closePanel();
}

function confirmValue() {
  const nextValue = `${draft.year}-${padNumber(draft.month)}-${padNumber(draft.day)}T${padNumber(draft.hour)}:${padNumber(draft.minute)}:${padNumber(draft.second)}`;
  const minTimestamp = getTimestamp(props.minValue);
  const nextTimestamp = getTimestamp(nextValue);

  if (minTimestamp !== undefined && nextTimestamp !== undefined && nextTimestamp <= minTimestamp) {
    uni.showToast({ title: "截止时间必须大于发起时间", icon: "none" });
    return;
  }

  emit("update:modelValue", nextValue);
  closePanel();
}

function setDraftFromValue(value: string) {
  const normalizedValue = normalizeDatetime(value) || toDatetimeValue(new Date());
  const [datePart = "", timePart = ""] = normalizedValue.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour = 0, minute = 0, second = 0] = timePart.split(":").map(Number);

  draft.year = Number.isFinite(year) ? year : new Date().getFullYear();
  draft.month = Number.isFinite(month) ? month : 1;
  draft.day = Number.isFinite(day) ? day : 1;
  draft.hour = Number.isFinite(hour) ? hour : 0;
  draft.minute = Number.isFinite(minute) ? minute : 0;
  draft.second = Number.isFinite(second) ? second : 0;
  draft.day = Math.min(draft.day, getMaxDay());
}

function getMaxDay() {
  return new Date(draft.year, draft.month, 0).getDate();
}

function formatDraft() {
  return `${draft.year}-${padNumber(draft.month)}-${padNumber(draft.day)} ${padNumber(draft.hour)}:${padNumber(draft.minute)}:${padNumber(draft.second)}`;
}

function formatDatetimeForDisplay(value: string) {
  const normalizedValue = normalizeDatetime(value);
  return normalizedValue ? normalizedValue.replace("T", " ") : "";
}

function normalizeDatetime(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  const normalizedValue = trimmedValue.replace(/\s+/, "T");
  return normalizedValue.includes("T") && normalizedValue.length === 16 ? `${normalizedValue}:00` : normalizedValue;
}

function toDatetimeValue(value: Date) {
  return `${value.getFullYear()}-${padNumber(value.getMonth() + 1)}-${padNumber(value.getDate())}T${padNumber(value.getHours())}:${padNumber(value.getMinutes())}:${padNumber(value.getSeconds())}`;
}

function getTimestamp(value: string) {
  const normalizedValue = normalizeDatetime(value);
  if (!normalizedValue) {
    return undefined;
  }

  const timestamp = new Date(normalizedValue).getTime();
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

function wrap(value: number, min: number, max: number) {
  if (value > max) {
    return min;
  }

  if (value < min) {
    return max;
  }

  return value;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function padNumber(value: number) {
  return String(value).padStart(2, "0");
}
</script>

<style scoped lang="scss">
.datetime-picker {
  position: relative;
}

.datetime-picker__control {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 38px;
  padding: 0 12px;
  color: #172033;
  font-size: 14px;
  line-height: 38px;
  cursor: pointer;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
}

.datetime-picker__control--empty {
  color: #9aa9b8;
}

.datetime-picker__value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.datetime-picker__icon {
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.datetime-panel-mask {
  position: fixed;
  inset: 0;
  z-index: 1400;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 35, 55, 0.28);
}

.datetime-panel {
  width: 420px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #d8e6f2;
  border-radius: 6px;
  box-shadow: 0 18px 42px rgba(15, 35, 55, 0.2);
}

.datetime-panel__head,
.datetime-panel__actions,
.datetime-panel__quick {
  display: flex;
  align-items: center;
}

.datetime-panel__head {
  justify-content: space-between;
  margin-bottom: 12px;
}

.datetime-panel__title {
  color: #183755;
  font-size: 16px;
  font-weight: 900;
}

.datetime-panel__close {
  color: #64748b;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.datetime-panel__preview {
  height: 38px;
  margin-bottom: 14px;
  color: #0d82ee;
  font-size: 18px;
  font-weight: 900;
  line-height: 38px;
  text-align: center;
  background: #f0f7ff;
  border: 1px solid #cde5fb;
  border-radius: 4px;
}

.datetime-panel__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.datetime-stepper__label {
  display: block;
  margin-bottom: 6px;
  color: #34495e;
  font-size: 13px;
  font-weight: 800;
}

.datetime-stepper__body {
  display: grid;
  grid-template-columns: 32px 1fr 32px;
  align-items: center;
  height: 36px;
  overflow: hidden;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
}

.datetime-stepper__button {
  height: 36px;
  margin: 0;
  padding: 0;
  color: #31506d;
  font-size: 18px;
  line-height: 36px;
  background: #f6fbff;
  border: 0;
  border-radius: 0;
}

.datetime-stepper__button::after,
.datetime-panel__button::after,
.datetime-panel__quick-button::after {
  border: 0;
}

.datetime-stepper__button--hover {
  color: #0d82ee;
  background: #edf7ff;
}

.datetime-stepper__value {
  color: #172033;
  font-size: 15px;
  font-weight: 800;
  text-align: center;
}

.datetime-panel__quick {
  gap: 8px;
  margin-top: 14px;
}

.datetime-panel__quick-button {
  height: 32px;
  margin: 0;
  padding: 0 12px;
  color: #31506d;
  font-size: 13px;
  font-weight: 700;
  line-height: 32px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.datetime-panel__quick-button--hover {
  color: #0d82ee;
  border-color: #a9d7ff;
}

.datetime-panel__actions {
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.datetime-panel__button {
  min-width: 76px;
  height: 34px;
  margin: 0;
  padding: 0 14px;
  color: #31506d;
  font-size: 14px;
  font-weight: 800;
  line-height: 34px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.datetime-panel__button--hover {
  color: #0d82ee;
  border-color: #a9d7ff;
}

.datetime-panel__button--primary {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
}

.datetime-panel__button--primary-hover {
  background: #0674d8;
  border-color: #0674d8;
}
</style>
