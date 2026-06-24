<template>
  <view class="toolbar">

    <!-- 设备编号 -->
    <view class="filter-group">
      <text class="filter-label">维护类型</text>
      <picker :range="leakStatusOptions" range-key="label" @change="onLeakStatusChange">
        <view class="filter-select">
          <text>{{ leakStatusLabel }}</text>
          <text class="filter-select__arrow"></text>
        </view>
      </picker>

      <text class="filter-label">开始时间</text>

      <XDatetimePicker
          v-model="model.startTime"
          class="filter-datetime"
          title="开始时间"
          placeholder="请选择开始时间"
      />

      <text class="filter-label">结束时间</text>

      <XDatetimePicker
          v-model="model.endTime"
          class="filter-datetime"
          title="结束时间"
          placeholder="请选择结束时间"
      />
    </view>

    <!-- 操作区 -->
    <view class="toolbar-actions">

      <button
          class="toolbar-button toolbar-button--primary"
          hover-class="toolbar-button--hover"
          @click="emit('search')"
      >
        查询
      </button>

      <button
          class="toolbar-button"
          hover-class="toolbar-button--hover"
          @click="emit('reset')"
      >
        重置
      </button>

      <button
          class="toolbar-icon-button"
          hover-class="toolbar-icon-button--hover"
          aria-label="刷新"
          @click="emit('refresh')"
      >
        <text class="icon-refresh"></text>
      </button>

    </view>

  </view>
</template>
<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import XDatetimePicker from "@/pages/device/components/x/XDatetimePicker.vue";

type Option = { label: string; value: number | null };

const props = defineProps<{
  modelValue: {
    leakStatus?: number | null;
    startTime: string;
    endTime: string;
  };
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: typeof props.modelValue): void;
  (e: "search"): void;
  (e: "reset"): void;
  (e: "refresh"): void;
}>();

// ===== 本地 model =====
const model = reactive({ ...props.modelValue });

watch(
    () => props.modelValue,
    v => Object.assign(model, v),
    { deep: true }
);

watch(
    model,
    v => emit("update:modelValue", { ...v }),
    { deep: true }
);

// ===== 渗漏状态枚举 =====
const leakStatusOptions: Option[] = [
  { label: "全部", value: null },
  { label: "渗漏", value: 0 },
  { label: "正常", value: 1 },
  { label: "疑似", value: 2 }
];

// ===== label 显示 =====
const leakStatusLabel = computed(() => {
  const hit = leakStatusOptions.find(i => i.value === model.leakStatus);
  return hit?.label || "全部";
});

// ===== 选择 =====
function onLeakStatusChange(e: any) {
  const index = e.detail.value;
  model.leakStatus = leakStatusOptions[index].value;
}
</script>


<style scoped lang="scss">


.icon-refresh {
  position: relative;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
}

.icon-refresh::after {
  position: absolute;
  top: -3px;
  right: -2px;
  width: 0;
  height: 0;
  content: "";
  border: 4px solid transparent;
  border-left-color: currentColor;
  transform: rotate(-20deg);
}

.toolbar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: none;
  gap: 8px;
  min-height: 96px;
  padding: 12px;
  overflow: visible;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 0 0 auto;
}

.toolbar-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.toolbar-row--filters {
  flex-wrap: wrap;
  gap: 8px 16px;
  flex-direction: column;
}

.toolbar-row--bottom {
  justify-content: space-between;
  gap: 16px;
}

.toolbar-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 16px;
  min-width: 0;
}

.filter-group--date {
  min-width: 0;
}

.filter-label {
  flex: none;
  color: #34495e;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.filter-input {
  width: 132px;
}

.filter-input--name {
  width: 120px;
}

.filter-separator {
  color: #8191a2;
  font-size: 13px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-datetime {
  width: 188px;
}

.filter-datetime :deep(.datetime-picker__control) {
  height: 30px;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 600;
  line-height: 30px;
}

.filter-datetime :deep(.datetime-picker__value) {
  font-size: 13px;
  font-weight: 600;
}

.filter-datetime :deep(.datetime-picker__icon) {
  width: 15px;
  height: 15px;
}
.filter-select {
  display: flex;
  align-items: center;
  justify-content: space-between;

  width: 104px;
  height: 30px;               /* ⭐关键：你少的就是这个 */
  padding: 0 10px;

  font-size: 13px;
  font-weight: 600;
  color: #172033;

  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;

  box-sizing: border-box;
}

.filter-select__arrow {
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.toolbar-button,
.toolbar-icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  height: 34px;
  margin: 0;
  padding: 0 14px;
  color: #31506d;
  font-size: 14px;
  font-weight: 700;
  line-height: 34px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  justify-content: flex-start;
  width: auto;
  margin-left: auto;   /* ⭐关键：右对齐 */
  align-self: flex-end; /* ⭐关键：压到底部 */
}

.toolbar-filters,
.toolbar-actions {
  align-self: center;
}

.toolbar-button::after,
.toolbar-icon-button::after,
.page-button::after {
  border: 0;
}

.toolbar-button--primary {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
}

.toolbar-button--danger {
  color: #b42318;
  background: #fff5f3;
  border-color: #ffc9c0;
}

.toolbar-button--hover,
.toolbar-icon-button--hover {
  color: #0d82ee;
  background: #edf7ff;
  border-color: #a9d7ff;
}

.toolbar-button--primary.toolbar-button--hover {
  color: #ffffff;
  background: #0674d8;
  border-color: #0674d8;
}

.toolbar-button[disabled] {
  color: #9aa9b8;
  background: #eef2f6;
  border-color: #d7e0e8;
}

.toolbar-icon-button {
  width: 34px;
  padding: 0;
}

.toolbar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: none;
  gap: 8px;
  min-height: 96px;
  padding: 12px;
  overflow: visible;

  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
}

.toolbar-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.toolbar-row--filters {
  flex-wrap: wrap;
  gap: 8px 16px;
}

.toolbar-row--bottom {
  justify-content: space-between;
  gap: 16px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 7px;
}

.filter-label {
  flex: none;
  color: #34495e;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.filter-input {
  width: 132px;
  height: 30px;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 600;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.filter-select {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 104px;
}

.filter-select__arrow {
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-button {
  height: 34px;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 4px;
  border: 1px solid #cbdced;
  background: #f6fbff;
}

.toolbar-button--primary {
  color: #fff;
  background: #0d82ee;
  border-color: #0d82ee;
}

.input-placeholder {
  color: #9aa9b8;
}

.filter-separator {
  color: #8191a2;
  font-size: 13px;
}
</style>