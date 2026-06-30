<template>
  <view class="leak-table-view">
    <view class="main-layout">
      <!-- 左侧表格面板 -->
      <view class="table-panel">
        <view class="table-head">
          <text class="table-head__title">{{ title }}</text>
          <text class="table-head__meta">共 {{ total }} 条</text>
        </view>

        <scroll-view class="table-scroll" scroll-y scroll-x>
          <slot />
        </scroll-view>

        <view class="pagination-bar">
          <button
            class="page-button"
            hover-class="page-button--hover"
            :disabled="pageNum <= 1"
            @click="$emit('prev-page')"
          >上一页</button>
          <text class="page-info">第 {{ pageNum }} / {{ totalPages }} 页</text>
          <button
            class="page-button"
            hover-class="page-button--hover"
            :disabled="pageNum >= totalPages"
            @click="$emit('next-page')"
          >下一页</button>
        </view>
      </view>

      <!-- 右侧详情面板 -->
      <view class="detail-panel">
        <view v-if="!hasDetail" class="detail-empty">
          <slot name="detail-empty">{{ detailEmptyText }}</slot>
        </view>
        <slot v-else name="detail" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  total: number;
  pageNum: number;
  totalPages: number;
  hasDetail: boolean;
  detailEmptyText?: string;
}>();

defineEmits<{
  (event: "prev-page"): void;
  (event: "next-page"): void;
}>();
</script>

<style lang="scss" scoped>
.leak-table-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.main-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(380px, 20vw, 420px);
  flex: 1;
  min-height: 0;
  gap: 12px;
  overflow: hidden;
}

.table-panel,
.detail-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
}

.table-head,
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.table-head {
  flex: none;
  height: 50px;
  color: #24445f;
  font-size: 16px;
  font-weight: 800;
  background: #ffffff;
  border-bottom: 1px solid #edf3f8;
}

.table-head__title {
  color: #24445f;
  font-size: 16px;
  font-weight: 800;
}

.table-head__meta {
  padding: 4px 10px;
  color: #6a7f94;
  font-size: 13px;
  font-weight: 800;
  background: #f7fafc;
  border: 1px solid #e3ebf2;
  border-radius: 999px;
}

.table-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #ffffff;
}

.table-scroll :deep(.uni-scroll-view) {
  scrollbar-color: #9fb4c8 #edf3f8;
  scrollbar-width: thin;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar) {
  width: 9px;
  height: 9px;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar-track) {
  background: #edf3f8;
  border-radius: 999px;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar-thumb) {
  background: linear-gradient(90deg, #9fb4c8, #6f8ba8);
  border: 2px solid #edf3f8;
  border-radius: 999px;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar-thumb:hover) {
  background: linear-gradient(90deg, #7f9ab4, #4d6f91);
}

.detail-panel :deep(.detail-body),
.detail-panel :deep(.detail-section) {
  scrollbar-color: #9fb4c8 #edf3f8;
  scrollbar-width: thin;
}

.detail-panel :deep(.detail-body::-webkit-scrollbar),
.detail-panel :deep(.detail-section::-webkit-scrollbar) {
  width: 9px;
  height: 9px;
}

.detail-panel :deep(.detail-body::-webkit-scrollbar-track),
.detail-panel :deep(.detail-section::-webkit-scrollbar-track) {
  background: #edf3f8;
  border-radius: 999px;
}

.detail-panel :deep(.detail-body::-webkit-scrollbar-thumb),
.detail-panel :deep(.detail-section::-webkit-scrollbar-thumb) {
  background: linear-gradient(90deg, #9fb4c8, #6f8ba8);
  border: 2px solid #edf3f8;
  border-radius: 999px;
}

.detail-panel :deep(.detail-body::-webkit-scrollbar-thumb:hover),
.detail-panel :deep(.detail-section::-webkit-scrollbar-thumb:hover) {
  background: linear-gradient(90deg, #7f9ab4, #4d6f91);
}

.pagination-bar {
  flex: none;
  justify-content: flex-end;
  gap: 10px;
  height: 48px;
  padding: 0 14px;
  border-top: 1px solid #edf3f8;
  background: #ffffff;
}

.page-button {
  height: 30px;
  margin: 0;
  padding: 0 12px;
  color: #31506d;
  font-size: 13px;
  line-height: 30px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.page-button--hover {
  background: #e6f3ff;
}

.page-button[disabled] {
  color: #a9b4c1;
  background: #f4f7fa;
}

.page-info {
  color: #64748b;
  font-size: 13px;
}

.detail-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7c8da1;
  font-size: 14px;
}

.detail-section {
  flex: 1;
  min-height: 0;
  padding: 14px;
  overflow-y: auto;
}

@media (max-width: 980px) {
  .main-layout {
    grid-template-columns: 1fr;
  }

  .detail-panel {
    min-height: 360px;
  }
}
</style>
