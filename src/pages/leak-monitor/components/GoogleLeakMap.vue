<template>
  <view class="google-map">
    <!-- #ifdef H5 -->
    <div ref="mapContainer" class="google-map__canvas"></div>
    <view v-if="mapError" class="google-map__error">{{ mapError }}</view>
    <!-- #endif -->

    <!-- #ifndef H5 -->
    <view class="google-map__error">当前地图 SDK 仅支持 H5 端展示</view>
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  getGoogleMapsErrorMessage,
  loadGoogleMaps,
} from "@/utils/googleMapsLoader";
import type { MapDevicePoint } from "../types";

const mapContainer = ref<HTMLElement | null>(null);
const mapError = ref("");

const props = withDefaults(
  defineProps<{
    lat?: number;
    lng?: number;
    points?: MapDevicePoint[];
    selectedDeviceNumber?: string;
  }>(),
  {
    lat: 31.2304,
    lng: 121.4737,
    points: () => [],
    selectedDeviceNumber: "",
  },
);

const emit = defineEmits<{
  (event: "device-click", point: MapDevicePoint): void;
  (event: "ready"): void;
  (event: "error", message: string): void;
}>();

let mapInstance: google.maps.Map | null = null;
let markers: google.maps.Marker[] = [];

onMounted(() => {
  void nextTick(() => {
    void initMap();
  });
});

onBeforeUnmount(() => {
  if (mapInstance) {
    google.maps.event.clearInstanceListeners(mapInstance);
  }

  clearMarkers();
  mapInstance = null;

  if (mapContainer.value) {
    mapContainer.value.innerHTML = "";
  }
});

async function initMap() {
  if (!mapContainer.value) {
    setMapError("Google 地图容器初始化失败");
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
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });
    renderMarkers();
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
    const marker = new google.maps.Marker({
      map: mapInstance,
      position: { lat: point.lat, lng: point.lng },
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

function focusDevice(deviceNumber: string) {
  if (!mapInstance) {
    return;
  }

  const point = props.points.find((item) => item.deviceNumber === deviceNumber);
  if (!point) {
    return;
  }

  mapInstance.panTo({ lat: point.lat, lng: point.lng });
  mapInstance.setZoom(17);
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
    bounds.extend({ lat: point.lat, lng: point.lng });
  });
  mapInstance.fitBounds(bounds, 80);
}

watch(
  () => props.points,
  () => renderMarkers(),
  { deep: true },
);

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
  resize: () => {
    if (mapInstance && typeof google !== "undefined") {
      google.maps.event.trigger(mapInstance, "resize");
    }
  },
});
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
</style>
