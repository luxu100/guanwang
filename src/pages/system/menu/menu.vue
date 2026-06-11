<template>
  <AppShell>
    <!-- 菜单管理页面：后续用于维护系统菜单、页面入口和菜单权限。 -->
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

