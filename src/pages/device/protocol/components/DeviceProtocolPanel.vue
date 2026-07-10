<template>
  <view class = "panel">
    <DeviceProtocolTableView v-if="props.visible"
        :device-data="props.deviceData"
    />
  </view>
</template>

<script setup lang="ts">
import type {Device} from "@/services/device/types";
import DeviceProtocolTableView from "@/pages/device/protocol/components/DeviceProtocolTableView.vue";

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