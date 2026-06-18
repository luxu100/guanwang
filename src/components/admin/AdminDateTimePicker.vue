<template>
  <view class="admin-datetime-picker" :class="{ 'admin-datetime-picker--empty': !modelValue, 'admin-datetime-picker--disabled': disabled }">
    <picker mode="date" :disabled="disabled" :value="dateValue" @change="handleDateChange">
      <view class="admin-datetime-picker__segment">
        <text>{{ dateValue || datePlaceholder }}</text>
      </view>
    </picker>
    <view class="admin-datetime-picker__divider"></view>
    <picker mode="time" :disabled="disabled" :value="timeValue || defaultPickerTime" @change="handleTimeChange">
      <view class="admin-datetime-picker__segment admin-datetime-picker__segment--time">
        <text>{{ timeValue || timePlaceholder }}</text>
      </view>
    </picker>
    <button v-if="modelValue && !disabled" class="admin-datetime-picker__clear" hover-class="admin-datetime-picker__clear--hover" @click.stop="clearValue">×</button>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { buildDateTimeValue, getTodayDate, splitDateTimeValue } from "@/utils/adminDateTime";

const props = withDefaults(defineProps<{
  modelValue?: string;
  defaultTime?: string;
  datePlaceholder?: string;
  timePlaceholder?: string;
  disabled?: boolean;
}>(), {
  modelValue: "",
  defaultTime: "00:00:00",
  datePlaceholder: "选择日期",
  timePlaceholder: "选择时间",
  disabled: false,
});

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
  (event: "change", value: string): void;
}>();

const parts = computed(() => splitDateTimeValue(props.modelValue));
const dateValue = computed(() => parts.value.date);
const timeValue = computed(() => parts.value.time);
const defaultPickerTime = computed(() => props.defaultTime.slice(0, 5));

function handleDateChange(event: { detail: { value: string } }) {
  const value = buildDateTimeValue(event.detail.value, timeValue.value, props.defaultTime);
  updateValue(value);
}

function handleTimeChange(event: { detail: { value: string } }) {
  const value = buildDateTimeValue(dateValue.value || getTodayDate(), event.detail.value, props.defaultTime);
  updateValue(value);
}

function clearValue() {
  updateValue("");
}

function updateValue(value: string) {
  emit("update:modelValue", value);
  emit("change", value);
}
</script>

<style scoped lang="scss">
@use "@/styles/variables.scss" as *;

.admin-datetime-picker {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(92px, 1fr) 1px minmax(74px, 0.78fr) 24px;
  align-items: center;
  width: 100%;
  height: 34px;
  overflow: hidden;
  color: $color-admin-title;
  background: #ffffff;
  border: 1px solid #d8e3ed;
  border-radius: 5px;
}

.admin-datetime-picker--empty {
  color: #9aa9b8;
}

.admin-datetime-picker--disabled {
  color: #9aa9b8;
  background: #f3f6f9;
}

.admin-datetime-picker__segment {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  min-width: 0;
  height: 32px;
  padding: 0 10px;
  font-size: 13px;
  line-height: 32px;
}

.admin-datetime-picker__segment text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-datetime-picker__segment--time {
  justify-content: center;
  padding: 0 8px;
}

.admin-datetime-picker__divider {
  width: 1px;
  height: 18px;
  background: #e3ebf2;
}

.admin-datetime-picker__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 32px;
  padding: 0;
  color: #8a9aab;
  font-size: 18px;
  line-height: 1;
  background: transparent;
  border: 0;
}

.admin-datetime-picker__clear::after {
  border: 0;
}

.admin-datetime-picker__clear--hover {
  color: $color-admin-primary;
  background: #eef7ff;
}
</style>
