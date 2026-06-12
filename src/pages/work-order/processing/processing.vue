<template>
  <AppShell>
    <view class="work-order-page">
      <WorksheetTableView mode="processing" />
    </view>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from "@/components/AppShell.vue";
import WorksheetTableView from "@/pages/work-order/components/WorksheetTableView.vue";
</script>

<style scoped lang="scss">
.work-order-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #eef4f8;
}

.work-order-page :deep(.worksheet-view) {
  flex: 1;
  height: auto;
}
</style>
