<template>
  <view class="leak-workspace">
    <TencentLeakMap
      v-if="provider === 'tencent'"
      ref="mapRef"
      :points="mapPoints"
      :regions="mapRegions"
      :selected-device-number="selectedDevice?.deviceNumber"
      @device-click="handleMapDeviceClick"
    />
    <GoogleLeakMap
      v-else
      ref="mapRef"
      :points="mapPoints"
      :regions="mapRegions"
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
      :sidebar-collapsed="sidebarCollapsed"
      :loading="detailLoading"
      :device="selectedDevice"
      :detail="detail"
      :visible-devices="mapDevices"
      :map-points="mapPoints"
      @close="workspace.closeDetail"
      @refresh-analysis="workspace.refreshDeviceAnalysis"
      @load-history="workspace.loadHistory"
      @load-manual="workspace.loadManualAnalysis"
      @download-audio="workspace.downloadLatestAudio"
      @submit-manual="workspace.submitManualAnalysis"
      @select-device="handleSelectDevice"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, provide, ref, watch } from "vue";
import { useI18n } from "@/i18n";
import { getMapProvider } from "@/services/map/map";
import TencentLeakMap from "./TencentLeakMap.vue";
import GoogleLeakMap from "./GoogleLeakMap.vue";
import LeakMonitorSidebar from "./LeakMonitorSidebar.vue";
import DeviceDetailDialog from "./DeviceDetailDialog.vue";
import { useLeakMonitorWorkspace } from "../composables/useLeakMonitorWorkspace";
import { LEAK_MONITOR_LOCALIZED_KEY } from "../i18n";
import type { LeakMonitorDevice, MapDevicePoint } from "../types";

const props = withDefaults(defineProps<{
  localized?: boolean;
}>(), {
  localized: true,
});

const { locale } = useI18n();
const provider = computed(() => getMapProvider(locale.value));
const localized = computed(() => props.localized);
provide(LEAK_MONITOR_LOCALIZED_KEY, localized);
const workspace = useLeakMonitorWorkspace(localized);
const {
  detail,
  detailLoading,
  detailVisible,
  devices,
  errorMessage,
  loading,
  mapDevices,
  mapPoints,
  mapRegions,
  metrics,
  selectedDevice,
  sidebarCollapsed,
  sidebarLoading,
} = workspace;
const mapRef = ref<{
  focusDevice?: (deviceNumber: string) => void;
  fitDevices?: () => void;
  resize?: () => void;
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
  requestMapLayoutRefresh();
}

function requestMapLayoutRefresh() {
  window.requestAnimationFrame(() => {
    mapRef.value?.resize?.();
    window.setTimeout(() => mapRef.value?.resize?.(), 280);
  });
}

watch(() => mapPoints.value.length, () => {
  window.requestAnimationFrame(() => {
    mapRef.value?.resize?.();
    mapRef.value?.fitDevices?.();
  });
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
