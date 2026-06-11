<template>
  <AppShell>
    <!-- 站点管理页面：后续用于维护站点、分区、部门等管网基础资源。 -->
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
