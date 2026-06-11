<template>
  <AppShell>
    <!-- 指令管理页面：后续用于维护指令字典、指令参数、下发记录和固件升级。 -->
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

