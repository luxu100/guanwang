<template>
  <view>
    <XBaseToolbar
        v-model="model"
        :fields="fields"
        :dict-map="dictMap"
        :show-refresh="true"
        @search="emit('search')"
        @reset="emit('reset')"
        @refresh="emit('refresh')"
        :show-add="false"
        :show-edit="false"
        :show-delete="false"
    />
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import XBaseToolbar from "@/pages/device/components/x/XBaseToolbar.vue";
import type { Field } from "@/pages/device/components/x/types";

// ===== 1. 定义 Props 和 Emits =====
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

// ===== 2. 唯一数据源代理 =====
const model = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v)
});

// ===== 3. 字段配置 =====
const fields: Field[] = [
  {
    key: "leakStatus",
    label: "设备状态",
    type: "select",
    dict: "leakStatus"
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

// ===== 4. 字典映射 =====
const dictMap = {
  leakStatus: [
    { label: "全部", value: null },
    { label: "渗漏", value: 0 },
    { label: "正常", value: 1 },
    { label: "疑似", value: 2 }
  ]
};
</script>