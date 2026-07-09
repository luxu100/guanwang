<template>
  <AppShell>
    <view class="suspect-management-page">
      <SuspectTableView
        ref="tableRef"
        mode="management"
        class="content-page"
        @create="openCreate"
        @edit="openEdit"
      />
      <SuspectEditView
        v-if="showEdit"
        :suspect="editingSuspect"
        @close="closeEdit"
        @saved="onSaved"
      />
    </view>
  </AppShell>
</template>

<script setup lang="ts">
import { ref } from "vue";
import AppShell from "@/components/AppShell.vue";
import SuspectTableView from "@/pages/leak-report/components/SuspectTableView.vue";
import SuspectEditView from "@/pages/leak-report/components/SuspectEditView.vue";

type SuspectRecord = Record<string, unknown>;

const tableRef = ref<InstanceType<typeof SuspectTableView> | null>(null);
const showEdit = ref(false);
const editingSuspect = ref<SuspectRecord | null>(null);

function openCreate() {
  editingSuspect.value = null;
  showEdit.value = true;
}

function openEdit(suspect: SuspectRecord) {
  editingSuspect.value = suspect;
  showEdit.value = true;
}

function closeEdit() {
  showEdit.value = false;
  editingSuspect.value = null;
}

function onSaved() {
  showEdit.value = false;
  editingSuspect.value = null;
  tableRef.value?.fetchSuspects();
}
</script>

<style scoped lang="scss">
.suspect-management-page {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: var(--shell-content-min-height);
}

.content-page {
  width: 100%;
  height: 100%;
}
</style>