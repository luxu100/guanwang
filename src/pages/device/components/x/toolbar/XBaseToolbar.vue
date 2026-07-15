<template>
  <view class="toolbar-wrapper">

    <!-- toolbar -->
    <view class="toolbar" :class="{ collapsed: !props.visible }">

      <view class="toolbar-row toolbar-row--filters">

        <view  v-if="showFilterGroup"  class="filter-group">

          <view
              v-for="item in fields"
              :key="item.key"
              class="filter-item"
          >

            <text class="filter-label">
              {{ t(item.labelKey) }}
            </text>

            <!-- input -->
            <input
                v-if="item.type === 'input'"
                v-model="model[item.key]"
                class="filter-input"
                :placeholder="t('toolbar.filter.placeholder')"
            />

            <!-- select -->
            <picker
                v-else-if="item.type === 'select'"
                :range="getPickerRange(item)"
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
                :title="t(item.labelKey)"
                :placeholder="t(item.labelKey)"
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
              :show-edit="showEdit"
              :show-search="showSearch"
              :show-reset="showReset"
              @search="$emit('search')"
              @reset="handleReset"
              @add="$emit('add')"
              @delete="$emit('delete')"
              @refresh="$emit('refresh')"
              @edit="$emit('edit')"
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
  </view>
</template>

<script setup lang="ts">
import { reactive, watch, ref } from "vue";
import XToolbarActions from "./XToolbarActions.vue";
import XDatetimePicker from "../form/XDatetimePicker.vue";
import type { Field, DictItem } from "@/pages/device/components/x/types";

import {createScopedT} from "@/i18n";
const t = createScopedT("devicePage");

const props = withDefaults(defineProps<{
  modelValue: Record<string, any>;
  fields: Field[];
  dictMap: Record<string, DictItem[]>;

  loading?: boolean;
  showAdd?: boolean;
  showDelete?: boolean;
  showRefresh?: boolean;
  canDelete?: boolean;
  showEdit?: boolean;
  visible?: boolean;
  showFilterGroup?: boolean;
  showSearch?: boolean;
  showReset?: boolean;
}>(), {
  showAdd: true,
  showDelete: true,
  showRefresh: true,
  showSearch: true,
  showReset: true,
  canDelete: true,
  visible: false,
  showFilterGroup: true,
  loading: false,
});

const emit = defineEmits([
  "update:modelValue",
  "search",
  "reset",
  "add",
  "delete",
  "refresh",
  "edit",
]);

/** model */
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

/** select label */
function getSelectLabel(
    item: Extract<Field,{type:"select"}>
){
  const list = props.dictMap[item.dict] || [];

  const hit=list.find(
      i=>i.value===model[item.key]
  );

  return hit ? t(hit.labelKey) : "";
}

/** select change */
function handleSelect(
    item: Extract<Field, { type: "select" }>,
    e: { detail: { value: number } }
) {
  const list = props.dictMap[item.dict] || [];

  const option = list[e.detail.value];

  if (!option) return;

  model[item.key] = option.value;
}

/** reset */
function handleReset() {
  props.fields.forEach(f => {
    model[f.key] = f.type === "select" ? null : "";
  });

  emit("reset");
}

function getPickerRange(
    item: Extract<Field,{type:"select"}>
){
  return (props.dictMap[item.dict] || [])
      .map(i => t(i.labelKey));
}
</script>

<style scoped lang="scss">
.toolbar-wrapper {
  position: relative;
  width: 100%;
}

/* =======================
   TOOLBAR CORE
======================= */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;

  padding: 12px;
  padding-bottom: 15px;
  background: #fff;
  border: 1px solid #d8e5ef;
  overflow: hidden;

  max-height: 600px;
  opacity: 1;

  transition: max-height 0.3s ease, opacity 0.2s ease, padding 0.2s ease;
}

/* 折叠状态 */
.toolbar.collapsed {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  border: none;
}

/* =======================
   LAYOUT
======================= */
.toolbar-row {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  flex: 1;
}

/* =======================
   FILTER
======================= */
.filter-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-label {
  font-size: 13px;
  font-weight: 700;
  color: #34495e;
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
  width: 104px;
  height: 30px;
  padding: 0 10px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  font-size: 13px;
  font-weight: 600;

  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.filter-select__arrow {
  width: 8px;
  height: 8px;
  border: 2px solid #74879c;
  border-top: none;
  border-left: none;
  transform: rotate(45deg);
}

/* =======================
   ACTIONS
======================= */
.toolbar-actions-wrapper {
  margin-left: auto;
  align-self: flex-end;
}
</style>