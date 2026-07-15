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
        :visible="props.visible"
        :show-filter-group="false"
        :show-reset="false"
        :show-search="false"
        @add="emit('add')"
        @delete="emit('delete')"
        @edit="emit('edit')"
    />
  </view>
</template>
<script setup lang="ts">
import {computed, ref} from "vue";
import XBaseToolbar from "@/pages/device/components/x/toolbar/XBaseToolbar.vue";
import type {Field} from "@/pages/device/components/x/types";

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
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
const model = ref({
  visible: props.visible
});

// ===== fields 配置 =====
const fields: Field[] = [];

// ===== 字典 =====
const dictMap = {};
</script>