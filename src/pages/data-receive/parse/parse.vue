<template>
  <AppShell>
    <!-- 数据解析页面：后续用于维护协议字段、解析规则和解析记录。 -->
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

