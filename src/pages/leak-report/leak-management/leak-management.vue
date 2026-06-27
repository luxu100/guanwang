<template>
  <AppShell>
    <LeakManagementView />
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from "@/components/AppShell.vue";
import LeakManagementView from "@/pages/leak-report/components/LeakManagementView.vue";
</script>

<style scoped lang="scss">
.content-page {
  min-height: var(--shell-content-min-height);
}
</style>

