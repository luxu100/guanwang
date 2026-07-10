<template>
  <AppShell>
    <SuspectTableView
      ref="tableRef"
      mode="processing"
      class="content-page"
    />
  </AppShell>
</template>

<script setup lang="ts">
import { ref } from "vue";
import AppShell from "@/components/AppShell.vue";
import SuspectTableView from "@/pages/leak-report/components/SuspectTableView.vue";

const tableRef = ref<InstanceType<typeof SuspectTableView> | null>(null);
</script>

<style scoped lang="scss">
.content-page {
  width: 100%;
  height: 100%;
  min-height: var(--shell-content-min-height);
}
</style>