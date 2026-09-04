<template>
  <AppShell>
    <!-- 报警策略页面：维护报警规则、阈值和策略状态。 -->
    <view class="content-page">
      <AlarmStrategyView />
    </view>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from "@/components/AppShell.vue";
import AlarmStrategyView from "@/pages/alarm/components/AlarmStrategyView.vue";
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
