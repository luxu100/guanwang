<template>
  <view v-if="visible" class="dialog-mask" @click="closeDialog">
    <view class="dialog-panel" @click.stop>

      <!-- Header -->
      <view class="dialog-head">
        <view class="dialog-head-content">
          <view class="dialog-title">
            {{ title }}
          </view>
          <view v-if="subtitle" class="dialog-subtitle">
            {{ subtitle }}
          </view>
        </view>

        <button class="icon-button" @click="closeDialog">
          ✕
        </button>
      </view>


      <!-- Body -->
      <scroll-view scroll-y class="dialog-body">
        <view
            v-if="!treeData || treeData.length === 0"
            class="empty-state"
        >
          {{t('common.table.empty') }}
        </view>
        <XTreeNode
            v-for="node in treeData"
            :key="node.id"
            :node="node"
            :selected-id="innerValue"
            @select="handleSelect"
        />
      </scroll-view>

      <!-- Footer -->
      <view class="dialog-actions">
        <button
            class="secondary-button"
            @click="closeDialog"
        >
          {{t('common.cancel') }}
        </button>
        <button
            class="primary-button"
            @click="confirm"
        >
          {{t('common.confirm') }}
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
/* 遮罩 */
.dialog-mask{
  position:fixed;
  inset:0;
  z-index:1000;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:14px;
  background:rgba(15,35,55,.36);
}

/* 弹窗 */
.dialog-panel{
  width:60vw;
  max-width:900px;
  min-width:320px;
  height:min(620px,calc(100vh - 28px));
  display:flex;
  flex-direction:column;
  overflow:hidden;
  background:#fff;
  border:1px solid #d8e6f2;
  border-radius:6px;
  box-shadow:
      0 18px 46px rgba(15,35,55,.2);
}

/* Header */
.dialog-head{
  flex:none;
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding: 18px 24px;
  background:#f8fbfe;
  border-bottom: 1px solid #edf3f8;
}

.dialog-head-content{
  flex:1;
  min-width:0;
}

.dialog-title{
  color:#183755;
  font-size:20px;
  font-weight:900;
  line-height:1.2;
}

.dialog-subtitle{
  margin-top:4px;
  color:#5f7188;
  font-size:13px;
}

/* 关闭按钮 */
.icon-button{
  width:32px;
  height:32px;
  margin: 0 0 0 16px;
  padding:0;
  line-height:1;
  flex-shrink:0;
  display:flex;
  align-items:center;
  justify-content:center;
  color:#64748b;
  background:#f6fbff;
  border: 1px solid #d9e7f3;
  border-radius:4px;
  font-size:14px;
}

.icon-button:hover{
  background:#edf7ff;
  color:#0d82ee;
}

/* 内容 */
.dialog-body{
  flex:1;
  padding: 12px 16px;
  background:#fff;
}

.empty-state{
  padding:40px 0;
  text-align:center;
  color:#9aa9b8;
  font-size:14px;
}
.dialog-actions {
  flex: none;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #edf3f8;
}

.dialog-actions button {
  margin: 0;
}

/* 按钮 */
.primary-button,
.secondary-button {
  height: 38px;
  padding: 0 24px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 900;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.primary-button {
  background: #0d82ee;
  color: white;
}

.secondary-button {
  background: #f6fbff;
  color: #34495e;
  border-color: #d9e7f3;
}

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