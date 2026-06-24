<template>
  <view class="toolbar">

    <view class="toolbar-row toolbar-row--filters">

      <view
          v-for="item in fields"
          :key="item.key"
          class="filter-group"
      >

        <text class="filter-label">{{ item.label }}</text>

        <!-- input -->
        <input
            v-if="item.type === 'input'"
            v-model="model[item.key]"
            class="filter-input"
            placeholder="请输入"
        />

        <!-- select -->
        <picker
            v-else-if="item.type === 'select'"
            :range="dictMap[item.dict]"
            range-key="label"
            @change="handleSelect(item, $event)"
        >
          <view class="filter-select">
            <text>{{ getLabel(item) }}</text>
            <text class="filter-select__arrow"></text>
          </view>
        </picker>

        <!-- date -->
        <DeviceDatetimePicker
            v-else-if="item.type === 'date'"
            :model-value="String(model[item.key] ?? '')"
            class="filter-datetime"
            :title="item.label"
            :placeholder="item.label"
        />

      </view>

    </view>

    <!-- ⭐ FIX：固定右下角 actions（不再参与 schema） -->
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
import DeviceDatetimePicker from "@/pages/device/components/DeviceDatetimePicker.vue";

/**
 * =========================
 * types
 * =========================
 */
type Option = { label: string; value: string | number };

type DictKey = "product" | "enable" | "install" | "online" | "leak" | "maintain";

type Field =
    | { key: string; label: string; type: "input" }
    | { key: string; label: string; type: "date" }
    | { key: string; label: string; type: "select"; dict: DictKey };

type DeviceForm = Record<string, string | number>;

/**
 * =========================
 * props
 * =========================
 */
const props = defineProps<{
  modelValue: DeviceForm;
  fields: readonly Field[];

  productOptions: Option[];
  enableStateOptions: Option[];
  installStateOptions: Option[];
  onlineStatusOptions: Option[];
  leakStatusOptions: Option[];
  maintainTypeOptions: Option[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: DeviceForm): void;
  (e: "search"): void;
  (e: "reset"): void;
  (e: "refresh"): void;
}>();

/**
 * =========================
 * model proxy
 * =========================
 */
const model = reactive<DeviceForm>({ ...props.modelValue });

watch(
    () => props.modelValue,
    (v) => Object.assign(model, v),
    { deep: true }
);

watch(
    model,
    (v) => emit("update:modelValue", { ...v }),
    { deep: true }
);

/**
 * =========================
 * dict map
 * =========================
 */
const dictMap: Record<DictKey, Option[]> = {
  product: props.productOptions,
  enable: props.enableStateOptions,
  install: props.installStateOptions,
  online: props.onlineStatusOptions,
  leak: props.leakStatusOptions,
  maintain: props.maintainTypeOptions,
};

/**
 * =========================
 * computed
 * =========================
 */
const fields = computed(() => props.fields);

/**
 * =========================
 * select handler (FIX TS ERROR HERE)
 * =========================
 */
type PickerEvent = {
  detail: {
    value: number;
  };
};

function handleSelect(item: Field, e: PickerEvent) {
  if (item.type !== "select") return;

  const list = dictMap[item.dict];
  const index = e.detail.value;

  model[item.key] = list[index]?.value ?? "";
}

/**
 * =========================
 * label
 * =========================
 */
function getLabel(item: Field) {
  const value = model[item.key];

  if (item.type !== "select") return String(value ?? "");

  const list = dictMap[item.dict];
  const hit = list.find(i => i.value === value);

  return hit?.label || "全部";
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