<template>
  <AppShell>
    <!-- 疑点管理页面：后续用于维护疑似漏点、疑点来源和疑点基础信息。 -->
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

