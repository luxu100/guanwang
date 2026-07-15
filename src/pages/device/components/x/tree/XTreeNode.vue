<template>
  <view class="tree-node">
    <view
        class="tree-row"
        :class="{ 'tree-row--selected': selectedId === node.id }"
        @click="select"
    >
      <!-- 展开/折叠按钮 -->
      <view class="tree-left" @click.stop="toggle">
        <text v-if="hasChildren" class="tree-arrow" :class="{ 'tree-arrow--expanded': expanded }">
          ▶
        </text>
        <text v-else class="tree-dot">•</text>
      </view>

      <!-- 节点名称 -->
      <view class="tree-label">
        {{ node.name }}
      </view>

      <!-- 单选图标 -->
      <view class="tree-radio">
        <text v-if="selectedId === node.id">◉</text>
        <text v-else>○</text>
      </view>
    </view>

    <!-- 子节点容器 -->
    <view v-if="hasChildren && expanded" class="tree-children">
      <XTreeNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :selected-id="selectedId"
          @select="$emit('select', $event)"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

export interface PartitionNode {
  id: number;
  name: string;
  children?: PartitionNode[];
}

const props = defineProps<{
  node: PartitionNode;
  selectedId: string | number | null;
}>();

const emit = defineEmits<{
  (e: "select", node: PartitionNode): void;
}>();

const hasChildren = computed(() => props.node.children && props.node.children.length > 0);
const expanded = ref(false);

function toggle() {
  if (hasChildren.value) {
    expanded.value = !expanded.value;
  }
}

function select() {
  emit("select", props.node);
}
</script>

<style scoped lang="scss">
.tree-node {
  margin-left: 0;
}

.tree-row {
  display: flex;
  align-items: center;
  height: 40px; /* 稍微增加高度，提升点击体验 */
  padding: 0 18px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #edf7ff;
  }

  &--selected {
    background: #edf7ff;
    .tree-label {
      color: #0d82ee;
      font-weight: 700;
    }
    .tree-radio {
      color: #0d82ee;
    }
  }
}

.tree-left {
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #74879c;
  font-size: 12px;
}

.tree-arrow {
  display: inline-block;
  transition: transform 0.2s ease;
  font-size: 10px;

  &--expanded {
    transform: rotate(90deg);
  }
}

.tree-dot {
  opacity: 0.4;
}

.tree-label {
  flex: 1;
  color: #34495e;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-radio {
  width: 40px;
  padding-right: 12px;
  box-sizing: border-box;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #b0c4d8;
  font-size: 16px;
  transition: color 0.15s;
}

.tree-children {
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px dashed #d8e6f2;
}
</style>