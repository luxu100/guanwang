<template>
  <view v-if="visible" class="dialog__mask" @click="closeDialog">
    <view class="dialog__panel" @click.stop>
      <view class="dialog__header">
        <view class="dialog__header-content">
          <view class="dialog__title">{{ title }}</view>
          <view v-if="subtitle" class="dialog__subtitle">{{ subtitle }}</view>
        </view>
        <button class="button button__icon" @click="closeDialog"> <view class="close-icon"/> </button>
      </view>

      <view class="tree-legend">
        <view class="legend-item">
          <view class="legend-color legend-color--bound"></view>
          <text>{{ t('common.bound') }}</text>
        </view>

        <view class="legend-item">
          <view class="legend-color legend-color--selected"></view>
          <text>{{ t('common.newBind') }}</text>
        </view>
      </view>

      <scroll-view scroll-y class="dialog__body">
        <view v-if="!treeData || treeData.length===0" class="empty-state">
          {{ t('common.table.empty') }}
        </view>

        <XTreeMultiNode
            v-for="node in treeData"
            :key="node.id"
            :node="node"
            :selected-ids="innerValue"
            :bound-ids="boundIds"
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
import {ref,watch} from "vue";
import {createScopedT} from "@/i18n";
import XTreeMultiNode from "../tree/XTreeMultiNode.vue";
import type {PartitionNode} from "../tree/XTreeNode.vue";

const t=createScopedT("devicePage");

const props=defineProps<{
  visible:boolean;
  modelValue:number[];
  treeData:PartitionNode[];
  boundIds:number[];
  title?:string;
  subtitle?:string;
}>();

const emit=defineEmits<{
  (e:"update:visible",value:boolean):void;
  (e:"update:modelValue",value:number[]):void;
  (e:"confirm",value:number[]):void;
}>();

const innerValue=ref<number[]>([]);

watch(
    ()=>props.modelValue,
    val=>innerValue.value=[...(val||[])],
    {immediate:true}
);

function closeDialog(){
  emit("update:visible",false);
}

function handleSelect(node:PartitionNode){
  if(props.boundIds.includes(node.id)) return;

  const index=innerValue.value.indexOf(node.id);

  if(index>-1){
    innerValue.value.splice(index,1);
  }else{
    innerValue.value.push(node.id);
  }
}

function confirm(){
  emit("update:modelValue",innerValue.value);
  emit("confirm",innerValue.value);
  closeDialog();
}
</script>

<style scoped lang="scss">
@import "@/pages/device/components/x/dialog/styles/dialog.css";
@import "@/pages/device/components/x/common/button.css";

.tree-legend{
  display:flex;
  align-items:center;
  gap:24px;
  padding:10px 18px;
  border-bottom:1px solid #edf2f7;
  font-size:13px;
  color:#60758a;
}

.legend-item{
  display:flex;
  align-items:center;
  gap:6px;
}

.legend-color{
  width:14px;
  height:14px;
  border-radius:3px;
}

.legend-color--bound{
  background:#22c55e;
}

.legend-color--selected{
  background:#0d82ee;
}

@keyframes fadeIn{
  from{opacity:0}
  to{opacity:1}
}

@keyframes slideUp{
  from{opacity:0;transform:translateY(20px)}
  to{opacity:1;transform:translateY(0)}
}
</style>