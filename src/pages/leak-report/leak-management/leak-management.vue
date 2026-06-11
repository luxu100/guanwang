<template>
  <AppShell>
    <!-- 漏点管理页面：后续用于维护已确认漏点、处理状态和相关记录。 -->
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

