<template>
  <view class = "panel">
    <MaintenanceRecordTableView
        v-if="props.visible"
        :device-data="props.deviceData"
        :query="props.query"
        ref="tableRef"
        @device-updated="emit('deviceUpdated', $event)"
    />
  </view>
</template>

<script setup lang="ts">
import MaintenanceRecordTableView from "@/pages/device/maintenance/components/MaintenanceRecordTableView.vue";
import type {Device} from "@/services/device/types";
import { ref } from "vue";
const props = defineProps<{
  visible: boolean;
  deviceData: Partial<Device>;
  query?: {
    maintainType?: number|null;
    startTime?:string;
    endTime?:string;
  }
}>();

const tableRef = ref();

const emit = defineEmits<{
  (e: "deviceUpdated", deviceId: number): void;
}>();

defineExpose({
  handleAdd(){
    tableRef.value?.handleAdd();
  },

  handleEdit(){
    tableRef.value?.handleEdit();
  },

  handleDelete(){
    tableRef.value?.handleDelete();
  },

  handleShowDetail(){
    tableRef.value?.handleShowDetail();
  }
});

</script>

<style scoped lang="scss">
.panel {
  height: 100%;
}
</style>