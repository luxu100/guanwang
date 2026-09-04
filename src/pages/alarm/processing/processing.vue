<template>
  <AppShell>
    <!-- 报警处理页面：确认报警、忽略误报、批量确认和报警转工单。 -->
    <view class="content-page">
      <AlarmProcessingView />
    </view>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from "@/components/AppShell.vue";
import AlarmProcessingView from "@/pages/alarm/components/AlarmProcessingView.vue";
</script>

<style scoped lang="scss">
.content-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #eef4f8;
}
</style>
