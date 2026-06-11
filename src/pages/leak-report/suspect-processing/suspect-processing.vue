<template>
  <AppShell>
    <!-- 疑点处理页面：后续用于分配、确认、排除疑点，并支持疑点转工单。 -->
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

