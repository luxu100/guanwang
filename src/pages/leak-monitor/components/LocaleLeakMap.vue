<template>
  <view class="leak-workspace">
    <TencentLeakMap
      v-if="provider === 'tencent'"
      ref="mapRef"
      :points="mapPoints"
      :regions="mapRegions"
      :selected-device-number="selectedDevice?.deviceNumber"
      @device-click="handleMapDeviceClick"
      @ready="handleTencentMapReady"
    />
    <TencentPipeDemoLayer
      v-if="provider === 'tencent'"
      :map-instance="tencentMapInstance"
      :points="mapPoints"
      :formal-tubes="formalTubes"
      :formal-tube-rejected="formalTubesRejected"
      :formal-tube-error="formalTubesError"
      :formal-tube-loading="formalTubesLoading"
      :formal-facilities="formalFacilities"
      :formal-facility-rejected="formalFacilitiesRejected"
      :formal-facility-error="formalFacilitiesError"
      :formal-facility-loading="formalFacilitiesLoading"
      :facility-visibility="facilityVisibility"
      :creation="pipeCreation"
      source="api"
      @refresh="refreshNetworkLayers"
    />
    <GoogleLeakMap
      v-else
      ref="mapRef"
      :points="mapPoints"
      :regions="mapRegions"
      :selected-device-number="selectedDevice?.deviceNumber"
      @device-click="handleMapDeviceClick"
      @ready="handleGoogleMapReady"
    />
    <GooglePipeDemoLayer
      v-if="provider !== 'tencent'"
      :map-instance="googleMapInstance"
      :points="mapPoints"
      :formal-tubes="formalTubes"
      :formal-tube-rejected="formalTubesRejected"
      :formal-tube-error="formalTubesError"
      :formal-tube-loading="formalTubesLoading"
      :formal-facilities="formalFacilities"
      :formal-facility-rejected="formalFacilitiesRejected"
      :formal-facility-error="formalFacilitiesError"
      :formal-facility-loading="formalFacilitiesLoading"
      :facility-visibility="facilityVisibility"
      :creation="pipeCreation"
      source="api"
      @refresh="refreshNetworkLayers"
    />

    <LeakMonitorSidebar
      :filters="workspace.filters"
      :collapsed="sidebarCollapsed"
      :loading="loading || sidebarLoading"
      :metrics="metrics"
      :devices="devices"
      :regions="mapRegions"
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
      @focus-device="mapRef?.focusDevice?.($event)"
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
import TencentPipeDemoLayer from "./TencentPipeDemoLayer.vue";
import GooglePipeDemoLayer from "./GooglePipeDemoLayer.vue";
import type { TencentMapInstanceHandle } from "./tencent-map.types";
import { useLeakMonitorWorkspace } from "../composables/useLeakMonitorWorkspace";
import { LEAK_MONITOR_LOCALIZED_KEY } from "../i18n";
import type { LeakMonitorDevice, MapDevicePoint } from "../types";
import { getDraftPointCoordinates, usePipeCreation } from "../pipeCreation";
import { tencentDisplayCoordinate } from "../coordinateTransform";

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
  formalTubes,
  formalTubesError,
  formalTubesLoading,
  formalTubesRejected,
  formalFacilities,
  formalFacilitiesRejected,
  formalFacilitiesError,
  formalFacilitiesLoading,
  facilityVisibility,
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
  getMapInstance?: () => TencentMapInstanceHandle | google.maps.Map | null;
  focusDevice?: (deviceNumber: string) => void;
  fitDevices?: () => void;
  resize?: () => void;
} | null>(null);
const tencentMapInstance = ref<TencentMapInstanceHandle | null>(null);
const googleMapInstance = ref<google.maps.Map | null>(null);

async function refreshNetworkLayers() {
  await Promise.all([workspace.refreshFormalTubes(), workspace.refreshFormalFacilities()]);
}

function focusCreationCoordinate(coordinate: { lng: number; lat: number }, countryCode: string) {
  if (provider.value === "tencent") {
    const TMap = (window as unknown as { TMap?: { LatLng: new (lat: number, lng: number) => unknown } }).TMap;
    const map = tencentMapInstance.value;
    if (!map || !TMap?.LatLng) return;
    const display = tencentDisplayCoordinate(coordinate, countryCode);
    map.easeTo?.({ center: new TMap.LatLng(display.lat, display.lng), zoom: Math.max(16, map.getZoom?.() || 16) });
    return;
  }
  const map = googleMapInstance.value;
  if (!map) return;
  map.panTo({ lat: coordinate.lat, lng: coordinate.lng });
  map.setZoom(Math.max(16, map.getZoom() || 16));
}

const pipeCreation = usePipeCreation(formalTubes, {
  focusCoordinate: focusCreationCoordinate,
  onSaved: refreshNetworkLayers,
});

function handleSelectDevice(device: LeakMonitorDevice) {
  void workspace.openDevice(device);
  mapRef.value?.focusDevice?.(device.deviceNumber);
}
function handleMapDeviceClick(device: MapDevicePoint) {
  void workspace.openDevice(device);
}
function handleTencentMapReady() {
  tencentMapInstance.value =
    (mapRef.value?.getMapInstance?.() as TencentMapInstanceHandle | null) ?? null;
  focusActiveDraft();
}
function handleGoogleMapReady() {
  googleMapInstance.value =
    (mapRef.value?.getMapInstance?.() as google.maps.Map | null) ?? null;
  focusActiveDraft();
}
function focusActiveDraft() {
  if (!pipeCreation.draft.active || pipeCreation.draft.mode !== "pipe") return;
  const first = getDraftPointCoordinates(pipeCreation.draft)[0];
  if (first) focusCreationCoordinate(first, pipeCreation.draft.countryCode);
}
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
  requestMapLayoutRefresh();
}

function requestMapLayoutRefresh() {
  window.requestAnimationFrame(() => {
    mapRef.value?.resize?.();
  });
}

watch(() => mapPoints.value.length, () => {
  window.requestAnimationFrame(() => {
    mapRef.value?.resize?.();
  });
});

watch(provider, (nextProvider) => {
  if (nextProvider !== "tencent") {
    tencentMapInstance.value = null;
  } else {
    googleMapInstance.value = null;
  }
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
