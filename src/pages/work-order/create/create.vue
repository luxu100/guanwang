<template>
  <AppShell>
    <!-- 工单创建页面：后续用于由人工或疑点/报警信息创建维修处理工单。 -->
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

