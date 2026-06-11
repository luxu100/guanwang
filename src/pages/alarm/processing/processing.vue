<template>
  <AppShell>
    <!-- 报警处理页面：后续用于确认报警、忽略误报和报警转工单。 -->
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

