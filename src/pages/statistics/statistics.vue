<template>
  <AppShell>
    <!-- 统计分析页面：后续用于展示跨模块统计分析报表和关键指标。 -->
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

