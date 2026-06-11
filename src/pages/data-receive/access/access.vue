<template>
  <AppShell>
    <!-- 数据接入页面：后续用于维护协议定义和设备协议绑定关系。 -->
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

