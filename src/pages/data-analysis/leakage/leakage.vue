<template>
  <AppShell>
    <!-- 渗漏数据页面：后续用于查询渗漏记录和算法识别结果。 -->
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

