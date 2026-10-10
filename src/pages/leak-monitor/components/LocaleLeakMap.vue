<template>
  <view class="leak-workspace">
    <view v-if="navigationSaving" class="navigation-saving-mask"><image src="/static/icons/loadin_minior.svg" mode="aspectFit" /><text>{{ locale === 'zh-CN' ? '正在保存草稿...' : 'Saving draft...' }}</text></view>
    <view v-if="navigationPromptVisible" class="navigation-draft-mask" @click.stop>
      <view class="navigation-draft-dialog" @click.stop>
        <text class="navigation-draft-dialog__title">{{ locale === 'zh-CN' ? '还有未保存的管线草稿' : 'Unsaved network draft' }}</text>
        <text class="navigation-draft-dialog__copy">{{ locale === 'zh-CN' ? '离开前是否先保存当前草稿？' : 'Save the current draft before leaving?' }}</text>
        <view class="navigation-draft-dialog__actions">
          <button type="button" class="navigation-draft-dialog__keep" @click="keepEditingAfterNavigationPrompt">{{ locale === 'zh-CN' ? '取消' : 'Stay' }}</button>
          <button type="button" class="navigation-draft-dialog__discard" @click="discardBeforeNavigation">{{ locale === 'zh-CN' ? '否，放弃' : 'No, discard' }}</button>
          <button type="button" class="navigation-draft-dialog__save" @click="saveBeforeNavigation">{{ locale === 'zh-CN' ? '是，保存' : 'Yes, save' }}</button>
        </view>
      </view>
    </view>
    <TencentLeakMap
      v-if="provider === 'tencent'"
      ref="mapRef"
      :points="mapPoints"
      :regions="mapRegions"
      :selected-device-number="selectedDevice?.deviceNumber"
      @device-click="handleMapDeviceClick"
      @map-click="handleMapClick"
      @ready="handleTencentMapReady"
    />
    <TencentPipeDemoLayer
      v-if="provider === 'tencent'"
      :map-instance="tencentMapInstance"
      :points="mapPoints"
      :regions="mapRegions"
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
      @panel-expand="openNetworkPanel"
      @panel-collapse="closeNetworkPanel"
    />
    <GoogleLeakMap
      v-else
      ref="mapRef"
      :points="mapPoints"
      :regions="mapRegions"
      :selected-device-number="selectedDevice?.deviceNumber"
      @device-click="handleMapDeviceClick"
      @map-click="handleMapClick"
      @ready="handleGoogleMapReady"
    />
    <GooglePipeDemoLayer
      v-if="provider !== 'tencent'"
      :map-instance="googleMapInstance"
      :points="mapPoints"
      :regions="mapRegions"
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
      @panel-expand="openNetworkPanel"
      @panel-collapse="closeNetworkPanel"
    />

    <MapAlarmLayer :provider="provider" :map-instance="provider === 'tencent' ? tencentMapInstance : googleMapInstance"
      :alarms="activeAlarms" :points="mapPoints" @select="selectAlarmDevice" />
    <view v-if="activeAlarms.length || alarmError" class="map-alarm-summary" role="status">
      <text v-if="alarmError">{{ locale === 'zh-CN' ? '实时报警加载失败：' : 'Live alarms unavailable: ' }}{{ alarmError }}</text>
      <template v-else><text class="map-alarm-summary__mark">!</text>{{ locale === 'zh-CN' ? '活跃报警' : 'Active alarms' }} {{ activeAlarms.reduce((sum, alarm) => sum + alarm.count, 0) }}
        <text>{{ locale === 'zh-CN' ? '红：严重 · 黄：警告 · 蓝：提示' : 'Red: critical · Amber: warning · Blue: info' }}</text></template>
    </view>
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
import { computed, onBeforeUnmount, provide, ref, shallowRef, watch } from "vue";
import { useI18n } from "@/i18n";
import { getMapProvider } from "@/services/map/map";
import TencentLeakMap from "./TencentLeakMap.vue";
import GoogleLeakMap from "./GoogleLeakMap.vue";
import MapAlarmLayer from "./MapAlarmLayer.vue";
import { useActiveMapAlarms } from "../composables/useActiveMapAlarms";
import LeakMonitorSidebar from "./LeakMonitorSidebar.vue";
import DeviceDetailDialog from "./DeviceDetailDialog.vue";
import TencentPipeDemoLayer from "./TencentPipeDemoLayer.vue";
import GooglePipeDemoLayer from "./GooglePipeDemoLayer.vue";
import type { TencentMapInstanceHandle } from "./tencent-map.types";
import { useLeakMonitorWorkspace } from "../composables/useLeakMonitorWorkspace";
import { LEAK_MONITOR_LOCALIZED_KEY } from "../i18n";
import type { LeakMonitorDevice, MapDevicePoint } from "../types";
import { usePipeCreation } from "../pipeCreation";
import { tencentDisplayCoordinate, tencentSourceCoordinate } from "../coordinateTransform";
import { registerAppShellNavigationGuard } from "@/utils/appShellNavigation";
import { useDesktopMapEditor } from "../composables/useDesktopMapEditor";

const props = withDefaults(defineProps<{
  localized?: boolean;
}>(), {
  localized: true,
});

const { locale } = useI18n();
const { alarms: activeAlarms, error: alarmError } = useActiveMapAlarms();
const desktop = useDesktopMapEditor();
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
// 地图 SDK 实例必须保持原生对象。ref 会递归代理其内部字段，腾讯地图
// visualization 图层把被代理对象交给 Worker 时可能触发 DataCloneError。
const tencentMapInstance = shallowRef<TencentMapInstanceHandle | null>(null);
const googleMapInstance = shallowRef<google.maps.Map | null>(null);
let previousSidebarCollapsed = true;
function openNetworkPanel() {
  if (!desktop.value) return;
  previousSidebarCollapsed = sidebarCollapsed.value;
  sidebarCollapsed.value = true;
}
function closeNetworkPanel() {
  if (desktop.value) sidebarCollapsed.value = previousSidebarCollapsed;
}

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

const navigationPromptVisible = ref(false);
const navigationSaving = ref(false);
let resolveNavigationPrompt: ((allowed: boolean) => void) | null = null;
const unregisterNavigationGuard = registerAppShellNavigationGuard(async (targetPath) => {
  if (!desktop.value) return true;
  if (pipeCreation.draft.submitting || navigationSaving.value) return false;
  if (targetPath === "/pages/leak-monitor/leak-monitor" || !pipeCreation.hasUnsavedChanges.value) return true;
  navigationPromptVisible.value = true;
  return await new Promise<boolean>((resolve) => { resolveNavigationPrompt = resolve; });
});
onBeforeUnmount(() => unregisterNavigationGuard());
async function saveBeforeNavigation() {
  navigationPromptVisible.value = false;
  navigationSaving.value = true;
  let saved = false;
  try {
    saved = await pipeCreation.submit();
    if (!saved && pipeCreation.draft.submitError) uni.showToast({ title: pipeCreation.draft.submitError, icon: "none" });
  } finally {
    navigationSaving.value = false;
    const resolve = resolveNavigationPrompt;
    resolveNavigationPrompt = null;
    resolve?.(saved);
  }
}
function discardBeforeNavigation() {
  navigationPromptVisible.value = false;
  pipeCreation.discard();
  const resolve = resolveNavigationPrompt;
  resolveNavigationPrompt = null;
  if (resolve) resolve(true);
}
function keepEditingAfterNavigationPrompt() {
  navigationPromptVisible.value = false;
  const resolve = resolveNavigationPrompt;
  resolveNavigationPrompt = null;
  if (resolve) resolve(false);
}

function handleSelectDevice(device: LeakMonitorDevice) {
  void workspace.openDevice(device);
  mapRef.value?.focusDevice?.(device.deviceNumber);
}
function handleMapDeviceClick(device: MapDevicePoint) {
  void workspace.openDevice(device);
}
function selectAlarmDevice(number: string) {
  mapRef.value?.focusDevice?.(number);
  const point = mapPoints.value.find((item) => item.deviceNumber === number);
  if (point) handleMapDeviceClick(point);
}
function handleMapClick(coordinate: { lng: number; lat: number }) {
  if (!desktop.value || !pipeCreation.draft.active) return;
  if (pipeCreation.draft.mode === "pipe" && pipeCreation.draft.drawingActive) {
    pipeCreation.addMapPoint(provider.value === "tencent"
      ? tencentSourceCoordinate(coordinate, pipeCreation.draft.countryCode)
      : coordinate);
    return;
  }
  if (pipeCreation.draft.placementType) {
    pipeCreation.placeFacilityAt(provider.value === "tencent"
      ? tencentSourceCoordinate(coordinate, pipeCreation.draft.countryCode)
      : coordinate);
  }
}
function handleTencentMapReady() {
  tencentMapInstance.value =
    (mapRef.value?.getMapInstance?.() as TencentMapInstanceHandle | null) ?? null;
}
function handleGoogleMapReady() {
  googleMapInstance.value =
    (mapRef.value?.getMapInstance?.() as google.maps.Map | null) ?? null;
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
.map-alarm-summary { position: absolute; z-index: 5; bottom: 28px; left: 16px; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; max-width: calc(100% - 48px); padding: 8px 12px; color: #52677d; background: rgba(255,255,255,.96); border: 1px solid #d8e6f1; border-radius: 5px; font-size: 12px; }
.map-alarm-summary__mark { display: grid; place-items: center; width: 18px; height: 18px; color: #fff; background: #dc2626; border-radius: 50%; font-weight: 700; }
.leak-workspace {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: var(--shell-content-min-height);
  overflow: hidden;
}
.navigation-draft-mask { position: absolute; inset: 0; z-index: 80; display: flex; align-items: center; justify-content: center; background: rgba(18, 43, 70, .24); pointer-events: auto; }
.navigation-draft-dialog { width: min(420px, calc(100vw - 48px)); padding: 22px; background: #fff; border: 1px solid #d4e0ea; border-radius: 8px; box-shadow: 0 20px 52px rgba(18, 43, 70, .28); }.navigation-draft-dialog__title, .navigation-draft-dialog__copy { display: block; }.navigation-draft-dialog__title { color: #203a54; font-size: 16px; font-weight: 800; }.navigation-draft-dialog__copy { margin-top: 8px; color: #6b8092; font-size: 13px; }.navigation-draft-dialog__actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }.navigation-draft-dialog__actions button { height: 32px; margin: 0; padding: 0 12px; font-size: 12px; border-radius: 5px; }.navigation-draft-dialog__keep { color: #52677d; background: #f5f8fb; border: 1px solid #cddbe6; }.navigation-draft-dialog__discard { color: #fff; background: #c8463d; border: 1px solid #c8463d; }.navigation-draft-dialog__save { color: #fff; background: #2479b7; border: 1px solid #2479b7; }
.navigation-saving-mask { position: absolute; inset: 0; z-index: 90; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #fff; font-size: 13px; background: rgba(18, 43, 70, .42); pointer-events: auto; }.navigation-saving-mask image { width: 34px; height: 34px; }
</style>
