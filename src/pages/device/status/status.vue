<template>
  <AppShell>
    <!-- 设备状态页面：后续用于查看设备在线状态、状态上报和历史日数据。 -->
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

