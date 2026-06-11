<template>
  <AppShell>
    <!-- 数据记录页面：后续用于查询采样记录、采样明细、日报、压力和 CSS 采样数据。 -->
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

