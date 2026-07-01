<template>
  <view class = "panel">
    <MaintenanceRecordTableView v-if="props.visible"
        :device-data="props.deviceData"
    />
  </view>
</template>

<script setup lang="ts">
import MaintenanceRecordTableView from "@/pages/device/maintenance/components/MaintenanceRecordTableView.vue";
import type {Device} from "@/services/device/types";

const props = defineProps<{
  visible: boolean;
  deviceData: Partial<Device>;
}>();

</script>

<style scoped lang="scss">
.panel {
  height: 100%;
}
</style>