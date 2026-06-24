<template>
  <AppShell>
    <!-- 疑点管理页面：维护疑似漏点的基础信息，支持查询、新增、删除。 -->
    <SuspectEditView class="content-page" />
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from "@/components/AppShell.vue";
import SuspectEditView from "@/pages/leak-report/components/SuspectEditView.vue";
</script>

<style scoped lang="scss">
.content-page {
  height: 100%;
  min-height: var(--shell-content-min-height);
}
</style>
