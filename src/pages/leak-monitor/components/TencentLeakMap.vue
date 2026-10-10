<template>
  <view class="leak-map" :class="{ 'leak-map--compact': compact }">
    <!-- #ifdef H5 -->
    <div ref="mapContainer" class="leak-map__canvas"></div>
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
    <view v-if="mapError" class="leak-map__error">{{ mapError }}</view>
    <!-- #endif -->

    <!-- #ifndef H5 -->
    <view class="leak-map__error">{{ t("mapH5Only") }}</view>
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { MAP_CONFIG } from "@/services/map/map";
import { convertMapCoordinate, tencentDisplayCoordinate } from "../coordinateTransform";
import { useLeakMonitorI18n } from "../i18n";
import type { MapDevicePoint, MapRegion } from "../types";
import { deviceBindingColor } from "./map-marker-style";

const { t } = useLeakMonitorI18n();
const TENCENT_MAP_KEY = MAP_CONFIG.tencentKey;
const TENCENT_MAP_SCRIPT_ID = "tencent-map-gl-sdk";
const TENCENT_MAP_SCRIPT_URL = `https://map.qq.com/api/gljs?v=1.exp&key=${TENCENT_MAP_KEY}`;
const MAP_RESIZE_DELAY = 180;

/**
 * 腾讯地图 GL JS SDK 没有在项目里安装类型包，这里只声明当前组件用到的最小接口。
 * 后续如果地图功能变复杂，应优先补充完整类型，而不是重新引入 any。
 */
interface TencentLatLngValue {
  getLat?: () => number;
  getLng?: () => number;
}

interface TencentLatLng {
  new (lat: number, lng: number): TencentLatLngValue;
}

interface TencentMapInstance {
  destroy?: () => void;
  resize?: () => void;
  easeTo?: (options: { center: unknown; zoom?: number }) => void;
  fitBounds?: (bounds: unknown, options?: { padding?: number }) => void;
  on?: (event: string, handler: (e: { latLng: TencentLatLngValue }) => void) => void;
  getZoom?: () => number;
}

interface TencentMapConstructor {
  new (
    container: HTMLElement,
    options: {
      center: unknown;
      zoom: number;
      pitch: number;
      rotation: number;
    },
  ): TencentMapInstance;
}

interface TencentMultiMarkerConstructor {
  new (options: {
    map: TencentMapInstance;
    styles: Record<string, unknown>;
    geometries: Array<{
      id: string;
      styleId?: string;
      position: unknown;
      properties?: Record<string, unknown>;
    }>;
  }): {
    setMap?: (map: TencentMapInstance | null) => void;
    setStyles?: (styles: Record<string, unknown>) => void;
    setGeometries?: (geometries: Array<{ id: string; styleId?: string; position: unknown; properties?: Record<string, unknown> }>) => void;
    on?: (event: string, handler: (event: {
      geometry?: { id?: string; properties?: Record<string, unknown> };
      originalEvent?: { clientX?: number; clientY?: number };
    }) => void) => void;
  };
}

interface TencentMultiPolygonConstructor {
  new (options: {
    map: TencentMapInstance;
    styles: Record<string, unknown>;
    geometries: Array<{
      id: string;
      styleId?: string;
      paths: unknown[][];
      properties?: Record<string, unknown>;
    }>;
  }): {
    setMap?: (map: TencentMapInstance | null) => void;
    setStyles?: (styles: Record<string, unknown>) => void;
    setGeometries?: (geometries: Array<{
      id: string;
      styleId?: string;
      paths: unknown[][];
      properties?: Record<string, unknown>;
    }>) => void;
    on?: (event: string, handler: (event: { geometry?: { id?: string } }) => void) => void;
  };
}

interface TencentMapApi {
  LatLng: TencentLatLng;
  Map: TencentMapConstructor;
  MultiMarker: TencentMultiMarkerConstructor;
  MultiPolygon: TencentMultiPolygonConstructor;
  MarkerStyle: new (options: { width: number; height: number; anchor: { x: number; y: number }; src: string }) => unknown;
  PolygonStyle: new (options: {
    color: string;
    showBorder: boolean;
    borderColor: string;
    borderWidth: number;
  }) => unknown;
  LatLngBounds?: new () => {
    extend?: (position: unknown) => void;
  };
}

const props = withDefaults(defineProps<{
  points?: MapDevicePoint[];
  regions?: MapRegion[];
  selectedDeviceNumber?: string;
  compact?: boolean;
}>(), {
  points: () => [],
  regions: () => [],
  selectedDeviceNumber: "",
  compact: false,
});

const emit = defineEmits<{
  (e: "device-click", point: MapDevicePoint): void;
  (e: "map-click", coordinate: { lng: number; lat: number }): void;
  (e: "ready"): void;
  (e: "error", message: string): void;
}>();

const mapContainer = ref<HTMLElement | null>(null);
const mapError = ref("");
const hoveredPoint = ref<MapDevicePoint | null>(null);
const hoverPosition = ref({ x: 18, y: 18 });
let mapInstance: TencentMapInstance | null = null;
let markerLayer: InstanceType<TencentMultiMarkerConstructor> | null = null;
let polygonLayer: InstanceType<TencentMultiPolygonConstructor> | null = null;
let sdkLoadingPromise: Promise<void> | null = null;
let resizeTimer: ReturnType<typeof window.setTimeout> | null = null;
let resizeObserver: ResizeObserver | null = null;

const HANGZHOU_CENTER = {
  lat: 30.2741,
  lng: 120.1551,
};
const DEFAULT_MAP_ZOOM = 10;
const DEVICE_FOCUS_ZOOM = 15;
const COMPACT_DEVICE_FOCUS_ZOOM = 18;

onMounted(() => {
  // #ifdef H5
  nextTick(() => {
    bindResizeEvents();
    loadTencentMap()
      .then(initMap)
      .catch(() => {
        mapError.value = t("tencentMapError");
      });
  });
  // #endif
});

onBeforeUnmount(() => {
  if (resizeTimer) {
    window.clearTimeout(resizeTimer);
    resizeTimer = null;
  }

  unbindResizeEvents();
  mapInstance?.destroy?.();
  mapInstance = null;
  markerLayer?.setMap?.(null);
  polygonLayer?.setMap?.(null);
  markerLayer = null;
  polygonLayer = null;
});

/**
 * 地图 SDK 通过 script 懒加载，避免登录页和非地图页面也加载地图资源。
 */
function loadTencentMap() {
  if (getTMap()) {
    return Promise.resolve();
  }

  if (sdkLoadingPromise) {
    return sdkLoadingPromise;
  }

  sdkLoadingPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(TENCENT_MAP_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existingScript || document.createElement("script");

    script.id = TENCENT_MAP_SCRIPT_ID;
    script.charset = "utf-8";
    script.src = TENCENT_MAP_SCRIPT_URL;
    script.onload = () => {
      if (getTMap()) {
        resolve();
      } else {
        reject(new Error("Tencent map SDK is unavailable after script loaded"));
      }
    };
    script.onerror = () => reject(new Error("Tencent map SDK script failed to load"));

    if (!existingScript) {
      document.body.appendChild(script);
    }
  });

  return sdkLoadingPromise;
}

function getTMap() {
  return (window as unknown as { TMap?: TencentMapApi }).TMap;
}

/**
 * 初始化地图实例和中心标记。
 *
 * 默认展示杭州市及周边区域，让页面进入后可以直接看到杭州范围内的设备站点。
 */
function initMap() {
  mapError.value = "";

  const TMap = getTMap();
  if (!mapContainer.value || !TMap) {
    mapError.value = t("mapContainerError");
    return;
  }

  const center = new TMap.LatLng(HANGZHOU_CENTER.lat, HANGZHOU_CENTER.lng);
  const map = new TMap.Map(mapContainer.value, {
    center,
    zoom: DEFAULT_MAP_ZOOM,
    pitch: 0,
    rotation: 0,
  });
  mapInstance = map;
  map.on?.("click", (event) => {
    const lat = event?.latLng?.getLat?.();
    const lng = event?.latLng?.getLng?.();
    if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
      emit("map-click", { lng: Number(lng), lat: Number(lat) });
    }
  });

  renderRegions();
  renderMarkers();
  map.on?.("zoom", renderRegions);
  if (props.compact && props.selectedDeviceNumber) {
    window.setTimeout(() => focusDevice(props.selectedDeviceNumber), 0);
  }

  bindContainerResizeObserver();
  resizeTimer = window.setTimeout(() => {
    resizeTimer = null;
    mapInstance?.resize?.();
  }, MAP_RESIZE_DELAY);
  emit("ready");
}

function deviceDisplayCoordinate(point: MapDevicePoint) {
  return point.coordinateSystem === 'WGS84' && point.countryCode
    ? tencentDisplayCoordinate(point, point.countryCode)
    : convertMapCoordinate(point, point.coordinateSystem, 'GCJ02');
}

function getMarkerGeometries() {
  const TMap = getTMap();
  if (!TMap) {
    return [];
  }

  return props.points.map((point) => {
    const coordinate = deviceDisplayCoordinate(point);
    return {
    id: point.deviceNumber,
    styleId: "device-" + point.deviceNumber,
    position: new TMap.LatLng(coordinate.lat, coordinate.lng),
    properties: {
      deviceNumber: point.deviceNumber,
      status: point.status,
      leakProperty: point.leakProperty,
    },
    };
  });
}

function createMarkerStyles() {
  const TMap = getTMap();
  if (!TMap) return {};

  const statusColors: Record<string, string> = {
    normal: "#00a870",
    suspect: "#f59e0b",
    leak: "#ef4444",
    unknown: "#64748b",
  };

  return Object.fromEntries(props.points.map((point) => {
    const selected = props.selectedDeviceNumber === point.deviceNumber;
    const size = selected ? 52 : 44;
    const canvas = document.createElement("canvas");
    canvas.width = size * 2;
    canvas.height = size * 2;
    const context = canvas.getContext("2d");
    if (context) {
      context.scale(2, 2);
      context.beginPath();
      context.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2);
      context.fillStyle = deviceBindingColor(point) || statusColors[point.status] || statusColors.unknown;
      context.fill();
      context.lineWidth = selected ? 4 : 3;
      context.strokeStyle = "#ffffff";
      context.stroke();
      context.fillStyle = "#ffffff";
      context.font = "800 12px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(point.leakProperty === null ? "-" : String(point.leakProperty), size / 2, size / 2);
    }

    return [
      "device-" + point.deviceNumber,
      new TMap.MarkerStyle({
        width: size,
        height: size,
        anchor: { x: size / 2, y: size / 2 },
        src: canvas.toDataURL("image/png"),
      }),
    ];
  }));
}
function renderMarkers() {
  const TMap = getTMap();
  if (!mapInstance || !TMap) {
    return;
  }

  const geometries = getMarkerGeometries();
  const styles = createMarkerStyles();

  if (!markerLayer) {
    const layer = new TMap.MultiMarker({
      map: mapInstance,
      styles,
      geometries,
    });
    layer.on?.("click", (event) => {
      const deviceNumber = String(event.geometry?.id || event.geometry?.properties?.deviceNumber || "");
      const point = props.points.find((item) => item.deviceNumber === deviceNumber);
      if (point) {
        emit("device-click", point);
      }
    });
    layer.on?.("mouseover", showMarkerInfo);
    layer.on?.("mousemove", showMarkerInfo);
    layer.on?.("mouseout", () => {
      hoveredPoint.value = null;
    });
    markerLayer = layer;
  } else {
    markerLayer.setStyles?.(styles);
    markerLayer.setGeometries?.(geometries);
  }
}

function renderRegions() {
  const TMap = getTMap();
  if (!mapInstance || !TMap?.MultiPolygon || !TMap.PolygonStyle) return;
  const zoom = mapInstance.getZoom?.() ?? 15;
  const visibleRegions = props.regions.filter((region) => shouldShowRegion(region, zoom));
  const styles = Object.fromEntries(visibleRegions.map((region) => [
    "region-" + region.id,
    new TMap.PolygonStyle({
      color: toRgba(region.color, 0.16),
      showBorder: true,
      borderColor: region.color,
      borderWidth: 2,
    }),
  ]));
  const geometries = visibleRegions.map((region) => ({
    id: String(region.id),
    styleId: "region-" + region.id,
    paths: [region.boundary.map((coordinate) => {
      const converted = convertMapCoordinate(
        coordinate,
        region.coordinateSystem,
        "GCJ02",
      );
      return new TMap.LatLng(converted.lat, converted.lng);
    })],
    properties: { name: region.name },
  }));

  if (!polygonLayer) {
    polygonLayer = new TMap.MultiPolygon({
      map: mapInstance,
      styles,
      geometries,
    });
    polygonLayer.on?.("click", (event) => {
      const region = props.regions.find((item) => String(item.id) === String(event.geometry?.id));
      if (region) focusRegion(region);
    });
  } else {
    polygonLayer.setStyles?.(styles);
    polygonLayer.setGeometries?.(geometries);
  }
}

function shouldShowRegion(region: MapRegion, zoom: number) {
  return region.visible &&
    region.boundary.length >= 3 &&
    (region.minZoom === undefined || zoom >= region.minZoom) &&
    (region.maxZoom === undefined || zoom <= region.maxZoom);
}

function focusRegion(region: MapRegion) {
  const TMap = getTMap();
  if (!mapInstance || !TMap?.LatLngBounds || !mapInstance.fitBounds) return;
  const bounds = new TMap.LatLngBounds();
  region.boundary.forEach((coordinate) => {
    const converted = convertMapCoordinate(
      coordinate,
      region.coordinateSystem,
      "GCJ02",
    );
    bounds.extend?.(new TMap.LatLng(converted.lat, converted.lng));
  });
  mapInstance.fitBounds(bounds, { padding: 80 });
}

function toRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red},${green},${blue},${alpha})`;
}

function focusDevice(deviceNumber: string) {
  const TMap = getTMap();
  if (!mapInstance || !TMap) {
    return;
  }

  const point = props.points.find((item) => item.deviceNumber === deviceNumber);
  if (!point) {
    return;
  }

  const coordinate = deviceDisplayCoordinate(point);
  mapInstance.easeTo?.({
    center: new TMap.LatLng(coordinate.lat, coordinate.lng),
    zoom: props.compact ? COMPACT_DEVICE_FOCUS_ZOOM : DEVICE_FOCUS_ZOOM,
  });
}

function showMarkerInfo(event: {
  geometry?: { id?: string; properties?: Record<string, unknown> };
  originalEvent?: { clientX?: number; clientY?: number };
}) {
  const deviceNumber = String(event.geometry?.id || event.geometry?.properties?.deviceNumber || "");
  const point = props.points.find((item) => item.deviceNumber === deviceNumber);
  if (!point) return;
  hoveredPoint.value = point;
  const rect = mapContainer.value?.getBoundingClientRect();
  if (rect && event.originalEvent?.clientX !== undefined && event.originalEvent?.clientY !== undefined) {
    hoverPosition.value = {
      x: Math.min(rect.width - 245, Math.max(12, event.originalEvent.clientX - rect.left + 14)),
      y: Math.min(rect.height - 145, Math.max(12, event.originalEvent.clientY - rect.top + 14)),
    };
  }
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
  const TMap = getTMap();
  if (!mapInstance || !TMap || !props.points.length) {
    return;
  }

  const firstPoint = props.points[0];
  if (props.points.length === 1) {
    focusDevice(firstPoint.deviceNumber);
    return;
  }

  if (!TMap.LatLngBounds || !mapInstance.fitBounds) {
    return;
  }

  const bounds = new TMap.LatLngBounds();
  props.points.forEach((point) => {
    const coordinate = deviceDisplayCoordinate(point);
    bounds.extend?.(new TMap.LatLng(coordinate.lat, coordinate.lng));
  });
  mapInstance.fitBounds(bounds, { padding: 80 });
}

watch(
  () => props.points,
  () => {
    renderMarkers();
  },
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
  getMapInstance: () => mapInstance,
  focusDevice,
  fitDevices,
  resize: () => mapInstance?.resize?.(),
});

function bindResizeEvents() {
  window.addEventListener("resize", scheduleMapResize);
  document.addEventListener("fullscreenchange", scheduleMapResize);
  document.addEventListener("webkitfullscreenchange", scheduleMapResize);

  scheduleMapResize();
}

function bindContainerResizeObserver() {
  if (!mapContainer.value || typeof ResizeObserver === "undefined") {
    return;
  }

  resizeObserver?.disconnect();
  resizeObserver = new ResizeObserver(scheduleMapResize);
  resizeObserver.observe(mapContainer.value);
}

function unbindResizeEvents() {
  window.removeEventListener("resize", scheduleMapResize);
  document.removeEventListener("fullscreenchange", scheduleMapResize);
  document.removeEventListener("webkitfullscreenchange", scheduleMapResize);
  resizeObserver?.disconnect();
  resizeObserver = null;
}

function scheduleMapResize() {
  if (!mapInstance) return;
  if (resizeTimer) {
    window.clearTimeout(resizeTimer);
  }
  resizeTimer = window.setTimeout(() => {
    resizeTimer = null;
    mapInstance?.resize?.();
  }, MAP_RESIZE_DELAY);
}
</script>

<style scoped lang="scss">
.leak-map {
  position: relative;
  z-index: 0;
  isolation: isolate;
  width: 100%;
  height: 100%;
  min-height: var(--shell-content-min-height);
  overflow: hidden;
  background: #edf5ff;
}

.leak-map__canvas {
  display: block;
  width: 100%;
  height: 100%;
  min-height: var(--shell-content-min-height);
  overflow: hidden;
}

.leak-map__error {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 2;
  max-width: 420px;
  padding: 10px 14px;
  color: #b91c1c;
  font-size: 14px;
  line-height: 1.4;
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
.leak-map--compact,
.leak-map--compact .leak-map__canvas {
  min-height: 0;
}
</style>
