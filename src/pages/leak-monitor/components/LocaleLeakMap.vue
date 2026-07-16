<template>
  <view class="leak-workspace">
    <TencentLeakMap
      v-if="provider === 'tencent'"
      ref="mapRef"
      :points="mapPoints"
      :selected-device-number="selectedDevice?.deviceNumber"
      @device-click="handleMapDeviceClick"
    />
    <GoogleLeakMap
      v-else
      ref="mapRef"
      :points="mapPoints"
      :selected-device-number="selectedDevice?.deviceNumber"
      @device-click="handleMapDeviceClick"
    />

    <LeakMonitorSidebar
      :filters="workspace.filters"
      :collapsed="sidebarCollapsed"
      :loading="loading || sidebarLoading"
      :metrics="metrics"
      :devices="devices"
      :page="workspace.page"
      :selected-device-number="selectedDevice?.deviceNumber"
      :error-message="errorMessage"
      @toggle-collapse="toggleSidebar"
      @update:filters="Object.assign(workspace.filters, $event)"
      @search="workspace.refreshAll(true)"
      @reset="workspace.resetFilters"
      @select-device="handleSelectDevice"
      @change-page="workspace.updatePage"
    />

    <DeviceDetailDialog
      :visible="detailVisible"
      :loading="detailLoading"
      :device="selectedDevice"
      :detail="detail"
      @close="workspace.closeDetail"
      @refresh-analysis="workspace.refreshDeviceAnalysis"
      @load-history="workspace.loadHistory"
      @download-audio="workspace.downloadLatestAudio"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { isDomesticLeakMonitorUser } from "@/services/leak-monitor/device-query";
import TencentLeakMap from "./TencentLeakMap.vue";
import GoogleLeakMap from "./GoogleLeakMap.vue";
import LeakMonitorSidebar from "./LeakMonitorSidebar.vue";
import DeviceDetailDialog from "./DeviceDetailDialog.vue";
import { useLeakMonitorWorkspace } from "../composables/useLeakMonitorWorkspace";
import type { LeakMonitorDevice, MapDevicePoint } from "../types";

const provider = computed(() => isDomesticLeakMonitorUser() ? "tencent" : "google");
const workspace = useLeakMonitorWorkspace();
const {
  detail,
  detailLoading,
  detailVisible,
  devices,
  errorMessage,
  loading,
  mapPoints,
  metrics,
  selectedDevice,
  sidebarCollapsed,
  sidebarLoading,
} = workspace;
const mapRef = ref<{
  focusDevice?: (deviceNumber: string) => void;
  fitDevices?: () => void;
} | null>(null);

function handleSelectDevice(device: LeakMonitorDevice) {
  void workspace.openDevice(device);
  mapRef.value?.focusDevice?.(device.deviceNumber);
}
function handleMapDeviceClick(device: MapDevicePoint) {
  void workspace.openDevice(device);
}
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

watch(() => mapPoints.value.length, () => {
  setTimeout(() => mapRef.value?.fitDevices?.(), 80);
});
</script>

<style scoped lang="scss">
.leak-workspace {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: var(--shell-content-min-height);
  overflow: hidden;
}
</style>