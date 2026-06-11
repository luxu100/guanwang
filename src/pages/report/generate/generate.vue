<template>
  <AppShell>
    <!-- 报表生成页面：后续用于维护报表模板、创建报表任务并生成报表。 -->
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

