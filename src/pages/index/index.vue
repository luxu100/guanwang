<template>
  <AppShell>
    <!-- 首页/我的收藏页面：登录后的默认入口，后续用于承载收藏站点、常用功能或总览快捷入口。 -->
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
