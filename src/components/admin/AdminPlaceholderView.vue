<template>
  <view class="admin-placeholder-view">
    <view class="admin-placeholder-panel">
      <view class="admin-placeholder-head">
        <text class="admin-placeholder-title">{{ title }}</text>
        <text class="admin-placeholder-path">{{ path }}</text>
      </view>
      <view class="admin-placeholder-empty">暂无内容</view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  path: string;
}>();
</script>

<style scoped lang="scss">
.admin-placeholder-view {
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding: var(--admin-page-padding, 14px);
  overflow: hidden;
  background: var(--admin-page-bg, #eef4f8);
}

.admin-placeholder-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--admin-surface-bg, #ffffff);
  border: 1px solid var(--admin-border-color, #dbe6ee);
  border-radius: var(--admin-radius, 6px);
  box-shadow: var(--admin-panel-shadow, 0 8px 18px rgba(40, 74, 104, 0.08));
}

.admin-placeholder-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  gap: 16px;
  min-height: 52px;
  padding: 0 18px;
  border-bottom: 1px solid var(--admin-subtle-border, #edf3f8);
}

.admin-placeholder-title {
  min-width: 0;
  overflow: hidden;
  color: var(--admin-title-color, #183755);
  font-size: 16px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-placeholder-path {
  flex: none;
  max-width: 50%;
  overflow: hidden;
  color: var(--admin-muted-color, #73859a);
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-placeholder-empty {
  flex: 1;
  min-height: 180px;
  color: var(--admin-muted-color, #7c8da1);
  font-size: 14px;
  line-height: 180px;
  text-align: center;
}
</style>
