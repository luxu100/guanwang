<template>
  <view class = "panel">
    <DeviceTableMaintenanceRecordView
        :device-data="props.deviceData"
    />
  </view>
</template>

<script setup lang="ts">
import DeviceTableMaintenanceRecordView from "@/pages/device/components/DeviceTableMaintenanceRecordView.vue";
import type {Device} from "@/services/device/types";
import {watch} from "vue";

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