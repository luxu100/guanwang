<template>
  <AppShell>
    <!-- 设备参数页面：后续用于分析设备配置、设备日数据和状态上报参数。 -->
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

