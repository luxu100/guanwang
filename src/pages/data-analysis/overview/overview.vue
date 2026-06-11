<template>
  <AppShell>
    <!-- 系统总览页面：后续用于展示设备、渗漏、工单、报警等核心指标概览。 -->
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

