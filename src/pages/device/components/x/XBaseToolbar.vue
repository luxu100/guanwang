<template>
  <view class="toolbar">
    <view class="toolbar-row toolbar-row--filters">
      <!-- filters -->
      <view class="filter-group">

        <view
            v-for="item in fields"
            :key="item.key"
            class="filter-item"
        >

          <text class="filter-label">
            {{ item.label }}
          </text>

          <!-- input -->
          <input
              v-if="item.type === 'input'"
              v-model="model[item.key]"
              class="filter-input"
              placeholder="请输入"
          />

          <!-- select (dict) -->
          <picker
              v-else-if="item.type === 'select'"
              :range="dictMap[item.dict]"
              range-key="label"
              @change="handleSelect(item, $event)"
          >
            <view class="filter-select">
              <text>{{ getSelectLabel(item) }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>

          <!-- date -->
          <XDatetimePicker
              v-else-if="item.type === 'date'"
              v-model="model[item.key]"
              class="filter-datetime"
              :title="item.label"
              :placeholder="item.label"
          />

        </view>

      </view>

      <!-- actions -->
      <view class="toolbar-actions-wrapper">
        <XToolbarActions
            :loading="loading"
            :show-add="showAdd"
            :show-delete="showDelete"
            :show-refresh="showRefresh"
            :can-delete="canDelete"
            @search="$emit('search')"
            @reset="handleReset"
            @add="$emit('add')"
            @delete="$emit('delete')"
            @refresh="$emit('refresh')"
        >
          <template #left>
            <slot name="actions-left" />
          </template>

          <template #right>
            <slot name="actions-right" />
          </template>
        </XToolbarActions>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import XToolbarActions from "./XToolbarActions.vue";
import XDatetimePicker from "./XDatetimePicker.vue";
import type {Field,DictItem} from "@/pages/device/components/x/types";

const props = defineProps<{
  modelValue: Record<string, any>;
  fields: Field[];
  dictMap: Record<string, DictItem[]>;

  loading?: boolean;
  showAdd?: boolean;
  showDelete?: boolean;
  showRefresh?: boolean;
  canDelete?: boolean;
}>();

const emit = defineEmits([
  "update:modelValue",
  "search",
  "reset",
  "add",
  "delete",
  "refresh"
]);

// local model
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

// select label
function getSelectLabel(item: Extract<Field, { type: "select" }>) {
  const list = props.dictMap[item.dict] || [];
  const val = model[item.key];
  return list.find(i => i.value === val)?.label || "全部";
}

// select change
function handleSelect(
    item: Extract<Field, { type: "select" }>,
    e: { detail: { value: number } }
) {
  const index = e.detail.value;
  model[item.key] = props.dictMap[item.dict][index].value;
}
// reset
function handleReset() {
  props.fields.forEach(f => {
    if (f.type === "select") model[f.key] = null;
    else model[f.key] = "";
  });

  emit("reset");
}
</script>

<style scoped lang="scss">
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
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
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

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;

  flex: 1;
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
  height: 30px;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 600;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  box-sizing: border-box;
}

.filter-input--name {
  width: 120px;
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
  height: 30px;
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

.toolbar-actions-wrapper {
  display: flex;
  flex: none;
  margin-left: auto;
  align-self: flex-end;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
}

.filter-label {
  flex: none;
  white-space: nowrap;
}

.filter-input,
.filter-select,
.filter-datetime {
  flex: none;
}
</style>