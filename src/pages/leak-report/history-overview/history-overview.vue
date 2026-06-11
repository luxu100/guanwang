<template>
  <AppShell>
    <!-- 历史总览页面：后续用于汇总查看疑点和漏点历史数据。 -->
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

