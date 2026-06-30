<template>
  <view class = "panel">
    <DeviceStatusTableView v-if="visible"
        :device-data="props.deviceData"
    />
  </view>
</template>

<script setup lang="ts">
import DeviceStatusTableView from "@/pages/device/status/components/DeviceStatusTableView.vue";
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