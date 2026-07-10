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
        :visible="visible"
    />
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import XBaseToolbar from "@/pages/device/components/x/XBaseToolbar.vue";
import type { Field } from "@/pages/device/components/x/types";
import {createScopedT} from "@/i18n";
const t = createScopedT("devicePage");

// ===== 1. 定义 Props 和 Emits =====
const props = defineProps<{
  modelValue: {
    leakStatus?: number | null;
    startTime: string;
    endTime: string;
  };
  visible: boolean;
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
    labelKey: "deviceTable.leakStatus",
    type: "select",
    dict: "leakStatus"
  },
  {
    key: "startTime",
    labelKey: "maintain.fields.startTime",
    type: "date"
  },
  {
    key: "endTime",
    labelKey: "maintain.fields.endTime",
    type: "date"
  }
];

// ===== 4. 字典映射 =====
const dictMap = {
  leakStatus: [
    { labelKey: "common.all", value: null },
    { labelKey: "status.leak.leak", value: 0 },
    { labelKey: "status.leak.normal", value: 1 },
    { labelKey: "status.leak.suspected", value: 2 },
    { labelKey: "status.leak.unknown", value: 3 }
  ]
};
</script>