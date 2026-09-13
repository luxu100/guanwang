<template>
  <view class="google-map" :class="{ 'google-map--compact': compact }">
    <!-- #ifdef H5 -->
    <div ref="mapContainer" class="google-map__canvas"></div>
    <view
      v-if="hoveredPoint"
      class="device-hover-card"
      :style="{ left: `${hoverPosition.x}px`, top: `${hoverPosition.y}px` }"
    >
      <text class="device-hover-card__title">{{ hoveredPoint.deviceNumber }}</text>
      <view class="device-hover-card__row">
        <text>{{ t("leakStatusLabel") }}</text><text>{{ manualStatusLabel(hoveredPoint) }}</text>
      </view>
      <view class="device-hover-card__row">
        <text>{{ t("deviceStatus") }}</text><text>{{ deviceStatusLabel(hoveredPoint) }}</text>
      </view>
      <view class="device-hover-card__row">
        <text>{{ t("featureValue") }}</text><text>{{ hoveredPoint.leakProperty ?? "-" }}</text>
      </view>
      <view class="device-hover-card__row">
        <text>{{ t("address") }}</text><text>{{ hoveredPoint.installAddress || "-" }}</text>
      </view>
    </view>
    <view v-if="mapError" class="google-map__error">{{ mapError }}</view>
    <!-- #endif -->

    <!-- #ifndef H5 -->
    <view class="google-map__error">{{ t("mapH5Only") }}</view>
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  getGoogleMapsErrorMessage,
  loadGoogleMaps,
} from "@/utils/googleMapsLoader";
import { convertMapCoordinate } from "../coordinateTransform";
import { useLeakMonitorI18n } from "../i18n";
import type { MapDevicePoint, MapRegion } from "../types";

const { language, t } = useLeakMonitorI18n();

const mapContainer = ref<HTMLElement | null>(null);
const mapError = ref("");
const hoveredPoint = ref<MapDevicePoint | null>(null);
const hoverPosition = ref({ x: 18, y: 18 });

const props = withDefaults(
  defineProps<{
    lat?: number;
    lng?: number;
    points?: MapDevicePoint[];
    regions?: MapRegion[];
    selectedDeviceNumber?: string;
    compact?: boolean;
  }>(),
  {
    lat: 30.2741,
    lng: 120.1551,
    points: () => [],
    regions: () => [],
    selectedDeviceNumber: "",
    compact: false,
  },
);

const emit = defineEmits<{
  (event: "device-click", point: MapDevicePoint): void;
  (event: "ready"): void;
  (event: "error", message: string): void;
}>();

let mapInstance: google.maps.Map | null = null;
let markers: google.maps.Marker[] = [];
let regionPolygons: google.maps.Polygon[] = [];
let resizeObserver: ResizeObserver | null = null;
let resizeFrame: number | null = null;
let resizeTimer: ReturnType<typeof window.setTimeout> | null = null;

const DEFAULT_MAP_ZOOM = 10;
const DEVICE_FOCUS_ZOOM = 15;
const COMPACT_DEVICE_FOCUS_ZOOM = 18;

onMounted(() => {
  void nextTick(() => {
    bindResizeEvents();
    void initMap();
  });
});

onBeforeUnmount(() => {
  unbindResizeEvents();

  if (mapInstance) {
    google.maps.event.clearInstanceListeners(mapInstance);
  }

  clearMarkers();
  clearRegions();
  mapInstance = null;

  if (mapContainer.value) {
    mapContainer.value.innerHTML = "";
  }
});

async function initMap() {
  if (!mapContainer.value) {
    setMapError(t("mapContainerError"));
    return;
  }

  try {
    const { Map } = await loadGoogleMaps();
    mapError.value = "";
    mapInstance = new Map(mapContainer.value, {
      center: {
        lat: props.lat,
        lng: props.lng,
      },
      zoom: DEFAULT_MAP_ZOOM,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });
    renderRegions();
    renderMarkers();
    if (props.compact && props.selectedDeviceNumber) {
      window.setTimeout(() => focusDevice(props.selectedDeviceNumber), 0);
    }
    mapInstance.addListener("zoom_changed", renderRegions);
    bindContainerResizeObserver();
    scheduleMapResize();
    emit("ready");
  } catch (error) {
    console.error("Google Maps initialization failed:", error);
    setMapError(getGoogleMapsErrorMessage(error));
  }
}

function setMapError(message: string) {
  mapError.value = message;
  emit("error", message);
}

function clearMarkers() {
  markers.forEach((marker) => {
    google.maps.event.clearInstanceListeners(marker);
    marker.setMap(null);
  });
  markers = [];
}

function clearRegions() {
  regionPolygons.forEach((polygon) => {
    google.maps.event.clearInstanceListeners(polygon);
    polygon.setMap(null);
  });
  regionPolygons = [];
}

function pointPosition(point: MapDevicePoint) {
  return convertMapCoordinate(point, point.coordinateSystem, "WGS84");
}

function regionPath(region: MapRegion) {
  return region.boundary.map((coordinate) =>
    convertMapCoordinate(coordinate, region.coordinateSystem, "WGS84"));
}

function markerIcon(point: MapDevicePoint): google.maps.Symbol {
  const colorMap: Record<string, string> = {
    normal: "#00a870",
    suspect: "#f59e0b",
    leak: "#ef4444",
    unknown: "#64748b",
  };

  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: props.selectedDeviceNumber === point.deviceNumber ? 16 : 13,
    fillColor: colorMap[point.status] || colorMap.unknown,
    fillOpacity: 0.95,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  };
}

function renderMarkers() {
  if (!mapInstance || typeof google === "undefined") {
    return;
  }

  clearMarkers();
  markers = props.points.map((point) => {
    const position = pointPosition(point);
    const marker = new google.maps.Marker({
      map: mapInstance,
      position,
      title: point.deviceNumber + " · " + point.title,
      icon: markerIcon(point),
      label: {
        text: point.leakProperty === null ? "-" : String(point.leakProperty),
        color: "#ffffff",
        fontSize: "11px",
        fontWeight: "800",
      },
    });

    marker.addListener("click", () => emit("device-click", point));
    marker.addListener("mouseover", () => {
      hoveredPoint.value = point;
      updateHoverPosition(position);
    });
    marker.addListener("mouseout", () => {
      hoveredPoint.value = null;
    });
    return marker;
  });
}

function renderRegions() {
  if (!mapInstance || typeof google === "undefined") return;
  clearRegions();
  const zoom = mapInstance.getZoom() ?? 15;

  regionPolygons = props.regions
    .filter((region) => shouldShowRegion(region, zoom))
    .map((region) => {
      const polygon = new google.maps.Polygon({
        map: mapInstance,
        paths: regionPath(region),
        clickable: true,
        fillColor: region.color,
        fillOpacity: 0.16,
        strokeColor: region.color,
        strokeOpacity: 0.9,
        strokeWeight: 2,
        zIndex: 1,
      });
      polygon.addListener("click", () => focusRegion(region));
      return polygon;
    });
}

function shouldShowRegion(region: MapRegion, zoom: number) {
  return region.visible &&
    region.boundary.length >= 3 &&
    (region.minZoom === undefined || zoom >= region.minZoom) &&
    (region.maxZoom === undefined || zoom <= region.maxZoom);
}

function focusRegion(region: MapRegion) {
  if (!mapInstance || typeof google === "undefined") return;
  const path = regionPath(region);
  if (!path.length) return;
  const bounds = new google.maps.LatLngBounds();
  path.forEach((coordinate) => bounds.extend(coordinate));
  mapInstance.fitBounds(bounds, 80);
}

function focusDevice(deviceNumber: string) {
  if (!mapInstance) {
    return;
  }

  const point = props.points.find((item) => item.deviceNumber === deviceNumber);
  if (!point) {
    return;
  }

  mapInstance.panTo(pointPosition(point));
  mapInstance.setZoom(props.compact ? COMPACT_DEVICE_FOCUS_ZOOM : DEVICE_FOCUS_ZOOM);
}

function updateHoverPosition(position: { lat: number; lng: number }) {
  if (!mapInstance || !mapContainer.value || typeof google === "undefined") return;
  const bounds = mapInstance.getBounds();
  if (!bounds) return;
  const northEast = bounds.getNorthEast();
  const southWest = bounds.getSouthWest();
  const lngSpan = northEast.lng() - southWest.lng();
  const latSpan = northEast.lat() - southWest.lat();
  if (!lngSpan || !latSpan) return;
  const width = mapContainer.value.clientWidth;
  const height = mapContainer.value.clientHeight;
  const x = (position.lng - southWest.lng()) / lngSpan * width;
  const y = (northEast.lat() - position.lat) / latSpan * height;
  hoverPosition.value = {
    x: Math.min(width - 245, Math.max(12, x + 14)),
    y: Math.min(height - 145, Math.max(12, y + 14)),
  };
}

function manualStatusLabel(point: MapDevicePoint) {
  return analysisStatusText(point.manualStatus);
}

function deviceStatusLabel(point: MapDevicePoint) {
  return analysisStatusText(point.status);
}

function analysisStatusText(status: MapDevicePoint["status"]) {
  return t(status === "suspect" ? "suspect" : status);
}

function fitDevices() {
  if (!mapInstance || !props.points.length || typeof google === "undefined") {
    return;
  }

  if (props.points.length === 1) {
    focusDevice(props.points[0].deviceNumber);
    return;
  }

  const bounds = new google.maps.LatLngBounds();
  props.points.forEach((point) => {
    bounds.extend(pointPosition(point));
  });
  mapInstance.fitBounds(bounds, 80);
}

watch(
  () => props.points,
  () => renderMarkers(),
  { deep: true },
);

watch(
  () => props.compact,
  () => {
    if (props.compact && props.selectedDeviceNumber) focusDevice(props.selectedDeviceNumber);
  },
);

watch(
  () => props.regions,
  () => renderRegions(),
  { deep: true },
);

watch(language, () => {
  renderRegions();
  renderMarkers();
});

watch(
  () => props.selectedDeviceNumber,
  (deviceNumber) => {
    renderMarkers();
    if (deviceNumber) {
      focusDevice(deviceNumber);
    }
  },
);

defineExpose({
  getMapInstance: () => mapInstance,
  focusDevice,
  fitDevices,
  resize: () => scheduleMapResize(),
});

function bindResizeEvents() {
  window.addEventListener("resize", handleMapResize);
  document.addEventListener("fullscreenchange", handleMapResize);
  document.addEventListener("webkitfullscreenchange", handleMapResize);
}

function bindContainerResizeObserver() {
  if (!mapContainer.value || typeof ResizeObserver === "undefined") {
    return;
  }

  resizeObserver?.disconnect();
  resizeObserver = new ResizeObserver(handleMapResize);
  resizeObserver.observe(mapContainer.value);
}

function unbindResizeEvents() {
  window.removeEventListener("resize", handleMapResize);
  document.removeEventListener("fullscreenchange", handleMapResize);
  document.removeEventListener("webkitfullscreenchange", handleMapResize);
  resizeObserver?.disconnect();
  resizeObserver = null;

  if (resizeFrame !== null) {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = null;
  }

  if (resizeTimer) {
    window.clearTimeout(resizeTimer);
    resizeTimer = null;
  }
}

function handleMapResize() {
  scheduleMapResize();
}

function scheduleMapResize() {
  if (!mapInstance || !mapContainer.value || typeof google === "undefined") {
    return;
  }

  if (resizeFrame !== null) {
    window.cancelAnimationFrame(resizeFrame);
  }

  if (resizeTimer) {
    window.clearTimeout(resizeTimer);
  }

  const refreshViewport = () => {
    if (!mapInstance) return;
    google.maps.event.trigger(mapInstance, "resize");
  };

  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = null;
    refreshViewport();

    resizeTimer = window.setTimeout(() => {
      resizeTimer = null;
      refreshViewport();
    }, 260);
  });
}
</script>

<style scoped lang="scss">
.google-map {
  position: relative;
  z-index: 0;
  isolation: isolate;
  width: 100%;
  height: 100%;
  min-height: var(--shell-content-min-height);
  overflow: hidden;
  background: #edf5ff;
}

.google-map__canvas {
  width: 100%;
  height: 100%;
  min-height: var(--shell-content-min-height);
}

.google-map__error {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 2;
  max-width: 420px;
  padding: 10px 14px;
  color: #b91c1c;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 6px;
}
.device-hover-card {
  position: absolute;
  z-index: 4;
  width: 220px;
  padding: 10px 12px;
  pointer-events: none;
  color: #334155;
  background: rgba(255, 255, 255, .97);
  border: 1px solid #cbd8e5;
  border-left: 4px solid #1686a0;
  border-radius: 5px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, .18);
}
.device-hover-card__title { display: block; margin-bottom: 6px; color: #172b3a; font-size: 14px; font-weight: 900; }
.device-hover-card__row { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 8px; font-size: 11px; line-height: 20px; }
.device-hover-card__row text:first-child { color: #64748b; font-weight: 800; }
.device-hover-card__row text:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.google-map--compact,
.google-map--compact .google-map__canvas {
  min-height: 0;
}
</style>
