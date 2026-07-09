<template>
  <view class="suspect-mgmt">
    <SuspectTableView
      ref="tableRef"
      mode="management"
      class="suspect-mgmt__table"
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
</template>

<script setup lang="ts">
import { ref } from "vue";
import SuspectTableView from "./SuspectTableView.vue";
import SuspectEditView from "./SuspectEditView.vue";

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
.suspect-mgmt {
  position: relative;
  width: 100%;
  height: 100%;
}

.suspect-mgmt__table {
  width: 100%;
  height: 100%;
}
</style>