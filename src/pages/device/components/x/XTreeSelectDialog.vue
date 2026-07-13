<template>
  <view v-if="visible" class="dialog__mask" @click="closeDialog">
    <view class="dialog__panel" @click.stop>

      <view class="dialog__header">
        <view class="dialog__header-content">
          <view class="dialog__title">{{ title }}</view>
          <view v-if="subtitle" class="dialog__subtitle">{{ subtitle }}</view>
        </view>

        <button class="button button__icon" @click="closeDialog">
          <view class="close-icon"/>
        </button>
      </view>


      <scroll-view scroll-y class="dialog__body">
        <view v-if="!treeData || treeData.length === 0" class="empty-state">
          {{ t('common.table.empty') }}
        </view>

        <XTreeNode
            v-for="node in treeData"
            :key="node.id"
            :node="node"
            :selected-id="innerValue"
            @select="handleSelect"
        />
      </scroll-view>


      <view class="dialog__footer">
        <button class="button button__secondary" @click="closeDialog">
          {{ t('common.cancel') }}
        </button>

        <button class="button button__primary" @click="confirm">
          {{ t('common.confirm') }}
        </button>
      </view>

    </view>
  </view>
</template>


<script setup lang="ts">
import { ref, watch } from "vue";
import XTreeNode, { type PartitionNode } from "./XTreeNode.vue";
import {createScopedT} from "@/i18n";
const t = createScopedT("devicePage");

const props = defineProps<{
  visible: boolean;
  modelValue: string | number | null;
  treeData: PartitionNode[];
  title?: string;
  subtitle?: string;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "update:modelValue", value: string | number | null): void;
  (e: "confirm", node: PartitionNode | null): void;
}>();

const innerValue = ref<string | number | null>(null);
const selectedNode = ref<PartitionNode | null>(null);

watch(
    () => props.modelValue,
    (val) => {
      innerValue.value = val;
      selectedNode.value = findNode(
          props.treeData,
          val
      );
    },
    {
      immediate:true
    }
);

watch(
    () => props.treeData,
    () => {
      if(innerValue.value !== null){
        selectedNode.value = findNode(
            props.treeData,
            innerValue.value
        );
      }
    },
    {
      deep:true
    }
);

function closeDialog(){
  emit(
      "update:visible",
      false
  );
}

function handleSelect(node:PartitionNode){
  innerValue.value = node.id;
  selectedNode.value = node;
}
function confirm(){
  emit(
      "update:modelValue",
      innerValue.value
  );
  emit(
      "confirm",
      selectedNode.value
  );
  closeDialog();
}

function findNode(
    list:PartitionNode[],
    id:string|number|null
):PartitionNode|null{
  if(!list || id === null){
    return null;
  }
  for(const item of list){
    if(item.id === id){
      return item;
    }
    if(item.children?.length){
      const result = findNode(
          item.children,
          id
      );
      if(result){
        return result;
      }
    }
  }
  return null;
}
</script>

<style scoped lang="scss">
@import "@/pages/device/components/x/dialog.css";
@import "@/pages/device/components/x/button.css";

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>