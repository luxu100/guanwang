<template>
  <AppShell>
    <DeviceResumeView />
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from "@/components/AppShell.vue";
import DeviceResumeView from "@/pages/report/components/DeviceResumeView.vue";
</script>

<style scoped lang="scss">
.content-page {
  min-height: var(--shell-content-min-height);
}
</style>