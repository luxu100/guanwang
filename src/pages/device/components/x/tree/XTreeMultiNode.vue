<template>
  <view class="tree-node">
    <view class="tree-row" :class="{ 'tree-row--selected': checked }" @click="select">
      <view class="tree-left" @click.stop="toggle">
        <text v-if="hasChildren" class="tree-arrow" :class="{ 'tree-arrow--expanded': expanded }">▶</text>
        <text v-else class="tree-dot">•</text>
      </view>

      <view class="tree-label">
        {{ node.name }}
      </view>

      <view class="tree-check" :class="{
        'tree-check--bound': isBound,
        'tree-check--selected': !isBound && checked
      }">
        <view v-if="checked" class="checkbox">✓</view>
        <view v-else class="checkbox"></view>
      </view>
    </view>

    <view v-if="hasChildren && expanded" class="tree-children">
      <XTreeMultiNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :selected-ids="selectedIds"
          :bound-ids="boundIds"
          @select="$emit('select',$event)"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import {computed,ref} from "vue";
import type {PartitionNode} from "./XTreeNode.vue";

const props=defineProps<{
  node:PartitionNode;
  selectedIds:(string|number)[];
  boundIds:(string|number)[];
}>();

const emit=defineEmits<{
  (e:"select",node:PartitionNode):void;
}>();

const expanded=ref(false);

const hasChildren=computed(()=>!!props.node.children?.length);

const isBound=computed(()=>props.boundIds.includes(props.node.id));

const checked=computed(()=>isBound.value || props.selectedIds.includes(props.node.id));

function toggle(){
  if(hasChildren.value){
    expanded.value=!expanded.value;
  }
}

function select(){
  emit("select",props.node);
}
</script>

<style scoped lang="scss">
.tree-node{
  margin-left:0;
}

.tree-row{
  display:flex;
  align-items:center;
  height:40px;
  padding:0 18px;
  border-radius:4px;
  cursor:pointer;
  transition:all .15s ease;

  &:hover{
    background:#edf7ff;
  }

  &--selected{
    background:#edf7ff;

    .tree-label{
      color:#0d82ee;
      font-weight:700;
    }
  }
}

.tree-left{
  width:24px;
  display:flex;
  align-items:center;
  justify-content:center;
  color:#74879c;
  font-size:12px;
}

.tree-arrow{
  display:inline-block;
  transition:transform .2s ease;
  font-size:10px;

  &--expanded{
    transform:rotate(90deg);
  }
}

.tree-dot{
  opacity:.4;
}

.tree-label{
  flex:1;
  color:#34495e;
  font-size:14px;
  font-weight:500;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.tree-check{
  width:40px;
  padding-right:12px;
  box-sizing:border-box;
  display:flex;
  align-items:center;
  justify-content:center;
}

.checkbox{
  width:16px;
  height:16px;
  border:1.5px solid #b0c4d8;
  border-radius:3px;
  box-sizing:border-box;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:12px;
  color:white;
  transition:all .15s;
}

.tree-check--bound .checkbox{
  background:#22c55e;
  border-color:#22c55e;
}

.tree-check--selected .checkbox{
  background:#0d82ee;
  border-color:#0d82ee;
}

.tree-children{
  margin-left:12px;
  padding-left:12px;
  border-left:1px dashed #d8e6f2;
}
</style>