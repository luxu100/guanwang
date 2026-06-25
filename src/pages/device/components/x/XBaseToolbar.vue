<template>
  <view class="toolbar-wrapper">

    <!-- toolbar -->
    <view class="toolbar" :class="{ collapsed: !visible }">

      <view class="toolbar-row toolbar-row--filters">

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

            <!-- select -->
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

    <!-- collapse handle（永远可见） -->
    <view class="collapse-handle" @click="toggleVisible">
      <text
          class="collapse-arrow"
          :class="{ 'is-collapsed': !visible }"
      ></text>
    </view>

  </view>
</template>

<script setup lang="ts">
import { reactive, watch, ref } from "vue";
import XToolbarActions from "./XToolbarActions.vue";
import XDatetimePicker from "./XDatetimePicker.vue";
import type { Field, DictItem } from "@/pages/device/components/x/types";

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

/** 折叠状态 */
const visible = ref(true);

function toggleVisible() {
  visible.value = !visible.value;
}

defineExpose({ toggleVisible, visible });

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
function getSelectLabel(item: Extract<Field, { type: "select" }>) {
  const list = props.dictMap[item.dict] || [];
  const val = model[item.key];
  return list.find(i => i.value === val)?.label || "全部";
}

/** select change */
function handleSelect(
    item: Extract<Field, { type: "select" }>,
    e: { detail: { value: number } }
) {
  const index = e.detail.value;
  model[item.key] = props.dictMap[item.dict][index].value;
}

/** reset */
function handleReset() {
  props.fields.forEach(f => {
    model[f.key] = f.type === "select" ? null : "";
  });

  emit("reset");
}
</script>

<style scoped lang="scss">
.toolbar-wrapper {
  position: relative;
  width: 100%;
  margin-bottom: 12px;
}

/* =======================
   TOOLBAR CORE
======================= */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;

  padding: 12px;
  background: #fff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);

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

/* =======================
   COLLAPSE HANDLE (关键)
======================= */
.collapse-handle {
  position: absolute;
  right: 12px;
  bottom: -10px;

  width: 32px;
  height: 16px;

  display: flex;
  justify-content: center;
  align-items: center;

  cursor: pointer;

  background: transparent;
}

.collapse-arrow {
  width: 8px;
  height: 8px;
  border: 2px solid #74879c;
  border-top: none;
  border-left: none;
  transform: rotate(-135deg);
  transition: transform 0.25s ease;
}

/* 收起：箭头向上 */
.is-collapsed {
  transform: rotate(45deg);
}

.toolbar:not(.collapsed) + .collapse-handle {
  transform: translateY(-8px);
}
</style>