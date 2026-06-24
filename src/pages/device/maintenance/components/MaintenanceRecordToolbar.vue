<template>
  <view>
    <XBaseToolbar
        v-model="model"
        :fields="fields"
        :dict-map="dictMap"
        :show-add="true"
        :show-delete="true"
        :show-refresh="true"
        :can-delete="true"
        @search="emit('search')"
        @reset="emit('reset')"
        @add="emit('add')"
        @delete="emit('delete')"
        @refresh="emit('refresh')"
    />
  </view>
</template>
<script setup lang="ts">
import { computed } from "vue";
import XBaseToolbar from "@/pages/device/components/x/XBaseToolbar.vue";
import type { Field } from "@/pages/device/components/x/types";

const props = defineProps<{
  modelValue: {
    maintainType: number | null;
    startTime: string;
    endTime: string;
  };
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: typeof props.modelValue): void;
  (e: "search"): void;
  (e: "reset"): void;
  (e: "refresh"): void;
  (e: "add"): void;
  (e: "delete"): void;
}>();

// ===== 唯一数据源代理（正确写法）=====
const model = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v)
});

// ===== fields 配置 =====
const fields: Field[] = [
  {
    key: "maintainType",
    label: "维护类型",
    type: "select",
    dict: "maintainType"
  },
  {
    key: "startTime",
    label: "开始时间",
    type: "date"
  },
  {
    key: "endTime",
    label: "结束时间",
    type: "date"
  }
];

// ===== 字典 =====
const dictMap = {
  maintainType: [
    { label: "全部", value: null },
    { label: "拆卸", value: 0 },
    { label: "安装", value: 1 },
    { label: "维护", value: 2 },
    { label: "巡检", value: 3 }
  ]
};
</script>