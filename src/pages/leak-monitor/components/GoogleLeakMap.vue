<template>
  <view class="google-map" :class="{ 'google-map--compact': compact }">
    <!-- #ifdef H5 -->
    <div ref="mapContainer" class="google-map__canvas"></div>
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
    lat: 31.2304,
    lng: 121.4737,
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

const DEFAULT_MAP_ZOOM = 13;
const DEVICE_FOCUS_ZOOM = 15;

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
  mapInstance.setZoom(DEVICE_FOCUS_ZOOM);
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
.google-map--compact,
.google-map--compact .google-map__canvas {
  min-height: 0;
}
</style>
