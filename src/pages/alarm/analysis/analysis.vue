<template>
  <AppShell>
    <!-- 报警分析页面：后续用于查看报警统计、趋势分析和报警记录导出。 -->
    <view class="content-page"></view>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from "@/components/AppShell.vue";
</script>

<style scoped lang="scss">
.content-page {
  min-height: var(--shell-content-min-height);
}
</style>

