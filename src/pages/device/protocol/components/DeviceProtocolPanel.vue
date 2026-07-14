<template>
  <view class = "panel">
    <DeviceProtocolTableView
        v-if="props.visible"
        :device-data="props.deviceData"
        :query="props.query"
        ref="tableRef"
    />
  </view>
</template>

<script setup lang="ts">
import type {Device} from "@/services/device/types";
import DeviceProtocolTableView from "@/pages/device/protocol/components/DeviceProtocolTableView.vue";
import {ref} from "vue";
import MaintenanceRecordTableView from "@/pages/device/maintenance/components/MaintenanceRecordTableView.vue";

const props = defineProps<{
  visible: boolean;
  deviceData: Partial<Device>;
  query?: {
    startTime?:string;
    endTime?:string;
  }
}>();

const tableRef = ref();


defineExpose({
  handleAdd(){
    tableRef.value?.handleAdd();
  },

  handleEdit(){
    tableRef.value?.handleEdit();
  },

  handleDelete(){
    tableRef.value?.handleDelete();
  }
});

</script>

<style scoped lang="scss">
.panel {
  height: 100%;
}
</style>