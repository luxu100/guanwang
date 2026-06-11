<template>
  <AppShell>
    <!-- 漏点分析页面：后续用于展示漏点趋势、空间分布和修复统计。 -->
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

