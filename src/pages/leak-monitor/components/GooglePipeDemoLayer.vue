<template>
  <view class="network-layer">
    <FacilityMapTooltip :hover="facilityHover" />
    <LeakNetworkPanel
      provider="google"
      :provider-label="providerLabel"
      :source="source"
      :pipes="pipes"
      :regions="regions"
      :facilities="formalFacilities"
      :device-points="points"
      :visible="pipeVisible"
      :collapsed="panelCollapsed"
      :loaded="loaded"
      :loading="loading"
      :error-message="networkError"
      :facility-visibility="facilityVisibility"
      :creation="creation"
      @expand="panelCollapsed = false; emit('panel-expand')"
      @collapse="panelCollapsed = true; emit('panel-collapse')"
      @refresh="emit('refresh')"
      @toggle-visible="pipeVisible = !pipeVisible"
      @toggle-facility="toggleFacility"
      @fit="fitNetwork"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import LeakNetworkPanel from "./LeakNetworkPanel.vue";
import FacilityMapTooltip from "./FacilityMapTooltip.vue";
import { useFacilityHover } from "../facilityHover";
import type { FacilityType, LeakMonitorFacility, LeakMonitorPipe, MapDevicePoint, MapRegion } from "../types";
import type { RejectedTubeRecord, TubeNetworkRecord } from "@/services/leak-monitor/tube-network";
import { useLeakMonitorI18n } from "../i18n";
import { getDraftPointCoordinates, getFacilityCoordinate, type PipeCreationController } from "../pipeCreation";
import { getNetworkViewportCoordinates } from "../networkViewport";

const props = withDefaults(defineProps<{
  mapInstance?: google.maps.Map | null;
  points?: MapDevicePoint[];
  regions?: MapRegion[];
  formalTubes?: TubeNetworkRecord[];
  formalTubeRejected?: RejectedTubeRecord[];
  formalTubeError?: string;
  formalTubeLoading?: boolean;
  formalFacilities?: LeakMonitorFacility[];
  formalFacilityRejected?: Array<{ id: number | null; facilityNumber: string | null; reason: string }>;
  formalFacilityError?: string;
  formalFacilityLoading?: boolean;
  facilityVisibility?: Record<FacilityType, boolean>;
  source?: "api" | "w84";
  creation: PipeCreationController;
}>(), {
  mapInstance: null,
  points: () => [],
  regions: () => [],
  formalTubes: () => [],
  formalTubeRejected: () => [],
  formalTubeError: "",
  formalTubeLoading: false,
  formalFacilities: () => [],
  formalFacilityRejected: () => [],
  formalFacilityError: "",
  formalFacilityLoading: false,
  facilityVisibility: () => ({ VALVE: true, HYDRANT: true, PUMP: true }),
  source: "api",
});

const emit = defineEmits<{ (event: "refresh"): void; (event: "panel-expand"): void; (event: "panel-collapse"): void }>();
const { language, t } = useLeakMonitorI18n();
const { hover: facilityHover, label: facilityLabel, show: showFacilityHover, hide: hideFacilityHover } = useFacilityHover(
  (type) => t(type === "VALVE" ? "facilityValve" : type === "HYDRANT" ? "facilityHydrant" : "facilityPump"),
);
const pipeVisible = ref(true);
const panelCollapsed = ref(true);
let pipeLines: google.maps.Polyline[] = [];
let facilityMarkers: google.maps.Marker[] = [];
let draftPipeLines: google.maps.Polyline[] = [];
let draftFacilityMarkers: google.maps.Marker[] = [];
const draftMarkerById = new Map<string, google.maps.Marker>();
let layersMap: google.maps.Map | null = null;
let draftSyncFrame: number | null = null;
let layerSyncFrame: number | null = null;
const pipeLineByKey = new Map<string, google.maps.Polyline>();
const facilityMarkerByKey = new Map<string, google.maps.Marker>();

const pipes = computed<LeakMonitorPipe[]>(() => props.formalTubes.map((tube) => ({
  id: tube.id,
  tubeName: tube.tubeName,
  status: tube.status,
  lineCoords: tube.lineCoords || [],
  coordinateSystem: "WGS84",
  countryCode: tube.countryCode,
  material: tube.material,
  diameterMm: tube.diameterMm,
  shapeLengthM: tube.shapeLengthM,
  deptId: tube.deptId,
})));
const loaded = computed(() => !props.formalTubeError && !props.formalFacilityError && !props.formalTubeLoading && !props.formalFacilityLoading);
const loading = computed(() => Boolean(props.formalTubeLoading || props.formalFacilityLoading));
const networkError = computed(() => [
  props.formalTubeError,
  props.formalFacilityError,
  props.formalTubeRejected?.length ? `${props.formalTubeRejected.length} pipe records were skipped because metadata is incomplete` : "",
  props.formalFacilityRejected?.length ? `${props.formalFacilityRejected.length} facility records were skipped because data is incomplete` : "",
].filter(Boolean).join("; "));
const providerLabel = computed(() => language.value === "zh-CN" ? "谷歌地图" : "Google Maps");

// 正式数据以新数组整体替换，禁止深度监听 lineCoords。深度监听会在坐标
// 数组被 Vue 代理遍历时反复重建全部 Polyline 和 Marker。
watch(
  () => [
    props.mapInstance,
    props.formalTubes,
    props.formalFacilities,
    props.facilityVisibility?.VALVE,
    props.facilityVisibility?.HYDRANT,
    props.facilityVisibility?.PUMP,
    language.value,
  ],
  scheduleLayerSync,
);
watch(
  () => props.creation.draft,
  () => {
    if (draftSyncFrame !== null) window.cancelAnimationFrame(draftSyncFrame);
    draftSyncFrame = window.requestAnimationFrame(() => {
      draftSyncFrame = null;
      renderDraftLayers();
    });
  },
  { deep: true },
);
watch(pipeVisible, applyVisibility);
onBeforeUnmount(() => {
  if (draftSyncFrame !== null) window.cancelAnimationFrame(draftSyncFrame);
  if (layerSyncFrame !== null) window.cancelAnimationFrame(layerSyncFrame);
  clearLayers();
});

function scheduleLayerSync() {
  if (layerSyncFrame !== null) return;
  layerSyncFrame = window.requestAnimationFrame(() => {
    layerSyncFrame = null;
    syncLayers();
  });
}

function syncLayers() {
  if (!props.mapInstance) {
    clearLayers();
    layersMap = null;
    return;
  }

  const mapChanged = layersMap !== props.mapInstance;
  if (mapChanged) {
    clearLayers();
    layersMap = props.mapInstance;
  }

  renderPipes();
  renderFacilities();
  if (mapChanged) renderDraftLayers();
  applyVisibility();
}

function renderPipes() {
  if (!props.mapInstance) return;
  const nextKeys = new Set<string>();
  const nextLines: google.maps.Polyline[] = [];
  props.formalTubes.forEach((tube) => (tube.lineCoords || []).forEach((part, partIndex) => {
    const path = part.map(([lng, lat]) => ({ lng, lat }));
    if (path.length < 2) return;
    const key = `${tube.id}:${partIndex}`;
    nextKeys.add(key);
    let line = pipeLineByKey.get(key);
    const inactive = tube.status === 0;
    const options: google.maps.PolylineOptions = {
      path,
      strokeColor: inactive ? "#94A3B8" : "#16A34A",
      strokeOpacity: inactive ? 0.95 : 0.9,
      strokeWeight: inactive ? 5 : 7,
      icons: inactive ? [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 }, offset: "0", repeat: "12px" }] : [],
      clickable: false,
      zIndex: 2,
    };
    if (!line) {
      line = new google.maps.Polyline({ ...options, map: props.mapInstance });
      pipeLineByKey.set(key, line);
    } else {
      line.setOptions(options);
      line.setMap(props.mapInstance);
    }
    nextLines.push(line);
  }));
  pipeLineByKey.forEach((line, key) => {
    if (!nextKeys.has(key)) {
      line.setMap(null);
      pipeLineByKey.delete(key);
    }
  });
  pipeLines = nextLines;
  // Loading network data must not change the viewport; fit only on request.
}

function renderFacilities() {
  if (!props.mapInstance) return;
  hideFacilityHover();
  const nextKeys = new Set<string>();
  const nextMarkers: google.maps.Marker[] = [];
  props.formalFacilities
    .filter((facility) => props.facilityVisibility?.[facility.facilityType] !== false)
    .forEach((facility) => {
      const key = String(facility.id);
      nextKeys.add(key);
      const position = { lat: facility.latitude, lng: facility.longitude };
      const icon = facility.facilityType === "VALVE"
        ? "/static/icons/facility-valve.svg"
        : facility.facilityType === "HYDRANT"
          ? "/static/icons/facility-hydrant.svg"
          : "/static/icons/facility-pump.svg";
      const options: google.maps.MarkerOptions = {
        position,
        title: facilityLabel(facility),
        icon: { url: icon, scaledSize: new google.maps.Size(36, 36), anchor: new google.maps.Point(18, 18) },
        zIndex: 4,
      };
      let marker = facilityMarkerByKey.get(key);
      if (!marker) {
        marker = new google.maps.Marker({ ...options, map: props.mapInstance });
        bindFacilityHover(marker, () => props.formalFacilities.find((item) => String(item.id) === key));
        facilityMarkerByKey.set(key, marker);
      } else {
        marker.setOptions(options);
        marker.setMap(props.mapInstance);
      }
      nextMarkers.push(marker);
    });
  facilityMarkerByKey.forEach((marker, key) => {
    if (!nextKeys.has(key)) {
      google.maps.event.clearInstanceListeners(marker);
      marker.setMap(null);
      facilityMarkerByKey.delete(key);
    }
  });
  facilityMarkers = nextMarkers;
}

function renderDraftLayers() {
  hideFacilityHover();
  if (!props.mapInstance || !props.creation.draft.active) {
    draftPipeLines.forEach((line) => line.setMap(null));
    draftPipeLines = [];
    draftMarkerById.forEach((marker) => {
      google.maps.event.clearInstanceListeners(marker);
      marker.setMap(null);
    });
    draftMarkerById.clear();
    draftFacilityMarkers = [];
    return;
  }

  const points = getDraftPointCoordinates(props.creation.draft);
  if (points.length >= 2) {
    let line = draftPipeLines[0];
    if (!line) {
      line = new google.maps.Polyline({ map: props.mapInstance, clickable: false, zIndex: 6 });
      draftPipeLines = [line];
    }
    line.setOptions({
      path: points,
      strokeColor: "#0EA5E9",
      strokeOpacity: 0.95,
      strokeWeight: 6,
      icons: [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 }, offset: "0", repeat: "16px" }],
    });
    line.setVisible(pipeVisible.value);
  } else {
    draftPipeLines.forEach((line) => line.setMap(null));
    draftPipeLines = [];
  }

  const visibleIds = new Set<string>();
  props.creation.draft.facilities
    .filter((facility) => props.facilityVisibility?.[facility.facilityType] !== false)
    .forEach((facility) => {
      const coordinate = getFacilityCoordinate(facility, points);
      if (!coordinate) return;
      visibleIds.add(facility.id);
      const icon = facility.facilityType === "VALVE"
        ? "/static/icons/facility-valve.svg"
        : facility.facilityType === "HYDRANT"
          ? "/static/icons/facility-hydrant.svg"
          : "/static/icons/facility-pump.svg";
      let marker = draftMarkerById.get(facility.id);
      if (!marker) {
        marker = new google.maps.Marker({ map: props.mapInstance, draggable: true, zIndex: 8 });
        bindFacilityHover(marker, () => props.creation.draft.facilities.find((item) => item.id === facility.id));
        marker.addListener("dragend", () => {
          const position = marker?.getPosition();
          if (position) props.creation.moveFacilityFromMap(facility.id, position.lng(), position.lat());
        });
        draftMarkerById.set(facility.id, marker);
      }
      marker.setOptions({
        position: coordinate, title: facilityLabel(facility),
        icon: { url: icon, scaledSize: new google.maps.Size(40, 40), anchor: new google.maps.Point(20, 20) },
      });
      marker.setMap(props.mapInstance);
    });
  draftMarkerById.forEach((marker, id) => {
    if (visibleIds.has(id)) return;
    google.maps.event.clearInstanceListeners(marker);
    marker.setMap(null);
    draftMarkerById.delete(id);
  });
  draftFacilityMarkers = [...draftMarkerById.values()];
}
function bindFacilityHover(marker: google.maps.Marker, resolve: () => LeakMonitorFacility | typeof props.creation.draft.facilities[number] | undefined) {
  const show = (event: google.maps.MapMouseEvent) => {
    const facility = resolve();
    if (facility && event.domEvent instanceof MouseEvent) showFacilityHover(facility, event.domEvent);
    else hideFacilityHover();
  };
  marker.addListener("mouseover", show);
  marker.addListener("mousemove", show);
  marker.addListener("mouseout", hideFacilityHover);
  marker.addListener("dragstart", hideFacilityHover);
}
function toggleFacility(type: FacilityType) {
  if (props.facilityVisibility) props.facilityVisibility[type] = !props.facilityVisibility[type];
  renderFacilities();
  renderDraftLayers();
}

function applyVisibility() {
  pipeLines.forEach((line) => line.setVisible(pipeVisible.value));
  draftPipeLines.forEach((line) => line.setVisible(pipeVisible.value));
}

function fitNetwork(regionKey = "all") {
  if (!props.mapInstance) return;
  const bounds = new google.maps.LatLngBounds();
  const coordinates = getNetworkViewportCoordinates(props.formalTubes, props.formalFacilities, pipeVisible.value, props.facilityVisibility, regionKey);
  if (!coordinates.length) { uni.showToast({ title: language.value === "zh-CN" ? "没有可定位的有效坐标" : "No visible coordinates to locate", icon: "none" }); return; }
  coordinates.forEach(({ lng, lat }) => bounds.extend({ lng, lat }));
  props.mapInstance.fitBounds(bounds, { left: 600, right: 80, top: 90, bottom: 80 });
}

function clearLayers() {
  hideFacilityHover();
  pipeLineByKey.forEach((line) => line.setMap(null));
  facilityMarkerByKey.forEach((marker) => {
    google.maps.event.clearInstanceListeners(marker);
    marker.setMap(null);
  });
  draftPipeLines.forEach((line) => line.setMap(null));
  draftMarkerById.forEach((marker) => {
    google.maps.event.clearInstanceListeners(marker);
    marker.setMap(null);
  });
  pipeLines = [];
  facilityMarkers = [];
  draftPipeLines = [];
  draftFacilityMarkers = [];
  draftMarkerById.clear();
  pipeLineByKey.clear();
  facilityMarkerByKey.clear();
  layersMap = null;
}
</script>

<style scoped lang="scss">
.network-layer { position: absolute; inset: 0; z-index: 6; pointer-events: none; }
</style>
