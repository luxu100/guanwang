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
        :show-edit="true"
        @search="emit('search')"
        @reset="emit('reset')"
        @add="emit('add')"
        @delete="emit('delete')"
        @refresh="emit('refresh')"
        @edit="emit('edit')"
        :visible="visible"
    />
  </view>
</template>
<script setup lang="ts">
import { computed,ref } from "vue";
import XBaseToolbar from "@/pages/device/components/x/toolbar/XBaseToolbar.vue";
import type { Field } from "@/pages/device/components/x/types";
import {createScopedT} from "@/i18n";
const t = createScopedT("devicePage");

const props = defineProps<{
  modelValue: {
    maintainType: number | null;
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
  (e: "add"): void;
  (e: "delete"): void;
  (e: "edit"): void;
}>();

const toolbarRef = ref();

function toggleVisible() {
  toolbarRef.value?.toggleVisible();
}

defineExpose({
  toggleVisible
});

// ===== 唯一数据源代理（正确写法）=====
const model = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v)
});

// ===== fields 配置 =====
const fields: Field[] = [
  {
    key: "maintainType",
    labelKey: 'maintain.fields.type',
    type: "select",
    dict: "maintainType"
  },
  {
    key: "startTime",
    labelKey: 'maintain.fields.startTime',
    type: "date"
  },
  {
    key: "endTime",
    labelKey: 'maintain.fields.endTime',
    type: "date"
  }
];

// ===== 字典 =====
const dictMap = {
  maintainType: [
    { labelKey: 'common.all', value: '' },
    { labelKey: 'status.maintain.remove', value: 0},
    { labelKey: 'status.maintain.install', value: 1},
    { labelKey: 'status.maintain.maintenance', value: 2},
    { labelKey: 'status.maintain.inspect', value: 3 }
  ]
};
</script>