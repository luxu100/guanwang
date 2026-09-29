<template>
  <view class="network-layer">
    <PipeCreationPanel :creation="creation" />
    <LeakNetworkPanel
      :provider-label="providerLabel"
      :source="source"
      :pipes="pipes"
      :facilities="formalFacilities"
      :device-points="points"
      :visible="pipeVisible"
      :collapsed="panelCollapsed"
      :loaded="loaded"
      :loading="loading"
      :error-message="networkError"
      :facility-visibility="facilityVisibility"
      :creation-active="creation.draft.active"
      @expand="panelCollapsed = false"
      @collapse="panelCollapsed = true"
      @toggle-visible="togglePipeVisibility"
      @toggle-facility="toggleFacility"
      @fit="fitNetwork"
      @start-creation="creation.start"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import LeakNetworkPanel from "./LeakNetworkPanel.vue";
import PipeCreationPanel from "./PipeCreationPanel.vue";
import type { TencentMapInstanceHandle } from "./tencent-map.types";
import { tencentDisplayCoordinate, tencentSourceCoordinate } from "../coordinateTransform";
import type { FacilityType, LeakMonitorFacility, LeakMonitorPipe, MapDevicePoint } from "../types";
import type { RejectedTubeRecord, TubeNetworkRecord } from "@/services/leak-monitor/tube-network";
import { useLeakMonitorI18n } from "../i18n";
import { getDraftPointCoordinates, getFacilityCoordinate, type PipeCreationController } from "../pipeCreation";

interface TencentLayer {
  setData?: (data: unknown[]) => void;
  addTo?: (map: TencentMapInstanceHandle) => void;
  show?: () => void;
  hide?: () => void;
  remove?: () => void;
  destroy?: () => void;
}

interface TencentMarkerLayer {
  setMap?: (map: TencentMapInstanceHandle | null) => void;
  setGeometries?: (geometries: unknown[]) => void;
  on?: (event: string, handler: (event: any) => void) => void;
}

interface TencentPolylineStyle {
  // TMap.PolylineStyle 的最小构造参数；MultiPolyline 用固定像素宽度，
  // 适合在较小 zoom 的总览视野中保持管线可见。
  new (options: {
    color: string;
    width: number;
    borderColor?: string;
    borderWidth?: number;
  }): unknown;
}

interface TencentOverviewLayer {
  setMap?: (map: TencentMapInstanceHandle | null) => void;
  setGeometries?: (geometries: unknown[]) => void;
  setStyles?: (styles: Record<string, unknown>) => void;
}

interface TencentPipeApi {
  LatLng: new (lat: number, lng: number, altitude?: number) => unknown;
  LatLngBounds?: new () => { extend?: (position: unknown) => void };
  visualization?: { Pipe: new (options: { pickStyle: (item: { styleId?: string }) => { color: string } }) => TencentLayer };
  PolylineStyle?: TencentPolylineStyle;
  MultiPolyline?: new (options: { map: TencentMapInstanceHandle; styles: Record<string, unknown>; geometries: unknown[] }) => TencentOverviewLayer;
  MarkerStyle?: new (options: { width: number; height: number; anchor: { x: number; y: number }; src: string }) => unknown;
  MultiMarker?: new (options: { map: TencentMapInstanceHandle; styles: Record<string, unknown>; geometries: unknown[] }) => TencentMarkerLayer;
}

const props = withDefaults(defineProps<{
  mapInstance?: TencentMapInstanceHandle | null;
  points?: MapDevicePoint[];
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

const emit = defineEmits<{ (event: "refresh"): void }>();
const { language } = useLeakMonitorI18n();
const pipeVisible = ref(true);
const panelCollapsed = ref(true);
let pipeLayer: TencentLayer | null = null;
let overviewLayer: TencentOverviewLayer | null = null;
let facilityLayer: TencentMarkerLayer | null = null;
let draftFacilityLayer: TencentMarkerLayer | null = null;
let draftPipeLayer: TencentLayer | null = null;
let layersMap: TencentMapInstanceHandle | null = null;
let draftSyncFrame: number | null = null;
let layerSyncFrame: number | null = null;
let hasFormalPipeData = false;
let hasOverviewPipeData = false;
let hasDraftPipeData = false;
let hasFacilityData = false;
let hasDraftFacilityData = false;
let hasAutoFocusedFormalNetwork = false;
let mapZoomHandler: (() => void) | null = null;

const ACTIVE_PIPE_COLOR = "#16A34A";
const INACTIVE_PIPE_COLOR = "#94A3B8";
const OVERVIEW_PIPE_MAX_ZOOM = 13;

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
})));
const loaded = computed(() => !props.formalTubeError && !props.formalFacilityError && !props.formalTubeLoading && !props.formalFacilityLoading);
const loading = computed(() => Boolean(props.formalTubeLoading || props.formalFacilityLoading));
const networkError = computed(() => [
  props.formalTubeError,
  props.formalFacilityError,
  props.formalTubeRejected?.length ? `${props.formalTubeRejected.length} 条管线因元数据不完整未显示` : "",
  props.formalFacilityRejected?.length ? `${props.formalFacilityRejected.length} 个设施因数据不完整未显示` : "",
].filter(Boolean).join("；"));
const providerLabel = computed(() => language.value === "zh-CN" ? "腾讯地图" : "Tencent Maps");

function getTMap(): TencentPipeApi | undefined {
  return (window as unknown as { TMap?: TencentPipeApi }).TMap;
}

// 这些数据由接口整体替换数组，不需要深度遍历嵌套坐标。深度监听会在每个
// 坐标字段变化时销毁并重建整套地图覆盖物，数据量一大就会阻塞主线程。
watch(
  () => [
    props.mapInstance,
    props.formalTubes,
    props.formalFacilities,
    props.facilityVisibility?.VALVE,
    props.facilityVisibility?.HYDRANT,
    props.facilityVisibility?.PUMP,
  ],
  scheduleLayerSync,
);
watch(
  () => props.creation.draft,
  () => {
    if (draftSyncFrame !== null) window.cancelAnimationFrame(draftSyncFrame);
    draftSyncFrame = window.requestAnimationFrame(() => {
      draftSyncFrame = null;
      syncDraftLayers();
    });
  },
  { deep: true },
);
watch(pipeVisible, applyVisibility);
onBeforeUnmount(() => {
  if (draftSyncFrame !== null) window.cancelAnimationFrame(draftSyncFrame);
  if (layerSyncFrame !== null) window.cancelAnimationFrame(layerSyncFrame);
  if (mapZoomHandler && layersMap?.off) layersMap.off("zoom", mapZoomHandler);
  destroyLayer(pipeLayer);
  destroyOverviewLayer(overviewLayer);
  destroyLayer(draftPipeLayer);
  destroyMarkerLayer(facilityLayer);
  destroyMarkerLayer(draftFacilityLayer);
});

function scheduleLayerSync() {
  if (layerSyncFrame !== null) return;
  layerSyncFrame = window.requestAnimationFrame(() => {
    layerSyncFrame = null;
    syncLayers();
  });
}

function syncLayers() {
  const TMap = getTMap();
  if (!props.mapInstance || !TMap) {
    if (mapZoomHandler && layersMap?.off) layersMap.off("zoom", mapZoomHandler);
    destroyLayer(pipeLayer);
    destroyOverviewLayer(overviewLayer);
    destroyLayer(draftPipeLayer);
    destroyMarkerLayer(facilityLayer);
    destroyMarkerLayer(draftFacilityLayer);
    pipeLayer = null;
    overviewLayer = null;
    draftPipeLayer = null;
    facilityLayer = null;
    draftFacilityLayer = null;
    layersMap = null;
    hasFormalPipeData = false;
    hasOverviewPipeData = false;
    hasDraftPipeData = false;
    hasFacilityData = false;
    hasDraftFacilityData = false;
    hasAutoFocusedFormalNetwork = false;
    mapZoomHandler = null;
    return;
  }

  // 地图实例变化时才重建图层（例如中英文地图供应商切换）。同一张地图
  // 的接口刷新只更新图层数据，避免重复创建 SDK 对象。
  if (layersMap !== props.mapInstance) {
    if (mapZoomHandler && layersMap?.off) layersMap.off("zoom", mapZoomHandler);
    destroyLayer(pipeLayer);
    destroyOverviewLayer(overviewLayer);
    destroyLayer(draftPipeLayer);
    destroyMarkerLayer(facilityLayer);
    destroyMarkerLayer(draftFacilityLayer);
    pipeLayer = null;
    draftPipeLayer = null;
    facilityLayer = null;
    draftFacilityLayer = null;
    layersMap = props.mapInstance;
    hasFormalPipeData = false;
    hasOverviewPipeData = false;
    hasDraftPipeData = false;
    hasFacilityData = false;
    hasDraftFacilityData = false;
    hasAutoFocusedFormalNetwork = false;

    if (TMap.visualization?.Pipe) {
      pipeLayer = new TMap.visualization.Pipe({
        pickStyle: (item) => ({ color: item.styleId === "inactive" ? INACTIVE_PIPE_COLOR : ACTIVE_PIPE_COLOR }),
      });
      pipeLayer.addTo?.(props.mapInstance);
      draftPipeLayer = new TMap.visualization.Pipe({ pickStyle: () => ({ color: "#0EA5E9" }) });
      draftPipeLayer.addTo?.(props.mapInstance);
    }

    if (TMap.MultiPolyline && TMap.PolylineStyle) {
      overviewLayer = new TMap.MultiPolyline({
        map: props.mapInstance,
        styles: createOverviewStyles(TMap),
        geometries: [],
      });
    }

    mapZoomHandler = () => applyOverviewVisibility();
    props.mapInstance.on?.("zoom", mapZoomHandler);

    if (TMap.MultiMarker && TMap.MarkerStyle) {
      facilityLayer = new TMap.MultiMarker({ map: props.mapInstance, styles: createFacilityStyles(TMap), geometries: [] });
      draftFacilityLayer = new TMap.MultiMarker({ map: props.mapInstance, styles: createFacilityStyles(TMap), geometries: [] });
      draftFacilityLayer.on?.("dragend", handleDraftFacilityDrag);
    }
  }

  renderPipes(TMap);
  renderFacilities(TMap);
  renderDraftPipe(TMap);
  renderDraftFacilities(TMap);
  applyVisibility();
}

function syncDraftLayers() {
  const TMap = getTMap();
  if (!props.mapInstance || !TMap) return;
  renderDraftPipe(TMap);
  renderDraftFacilities(TMap);
  applyVisibility();
}

function renderPipes(TMap: TencentPipeApi) {
  if (!pipeLayer?.setData) return;
  const geometries: unknown[] = [];
  props.formalTubes.forEach((tube) => (tube.lineCoords || []).forEach((part, partIndex) => {
    const paths = part.map(([lng, lat]) => {
      const display = tencentDisplayCoordinate({ lng, lat }, tube.countryCode);
      // visualization.Pipe transfers geometry to a worker; plain coordinate
      // objects are cloneable while SDK LatLng instances are not.
      return { lat: display.lat, lng: display.lng };
    });
    if (paths.length >= 2) geometries.push({ path: paths, radius: 4, styleId: tube.status === 0 ? "inactive" : "active", properties: { tubeId: tube.id, tubeName: tube.tubeName } });
  }));
  // 腾讯可视化 Pipe 在空数组上会在 SDK 内部执行 reduce，并抛出
  // "Reduce of empty array with no initial value"。接口加载期间没有数据时，
  // 只隐藏图层；不能调用 setData([])。
  if (!geometries.length) {
    hasFormalPipeData = false;
    hasOverviewPipeData = false;
    overviewLayer?.setMap?.(null);
    pipeLayer.hide?.();
    return;
  }
  try {
    pipeLayer.setData(geometries);
    hasFormalPipeData = true;
    renderOverviewPipes(TMap, geometries);
    if (!hasAutoFocusedFormalNetwork) {
      hasAutoFocusedFormalNetwork = true;
      window.requestAnimationFrame(() => fitNetwork());
    }
  } catch (error) {
    hasFormalPipeData = false;
    hasOverviewPipeData = false;
    overviewLayer?.setMap?.(null);
    pipeLayer.hide?.();
    console.error("腾讯地图管线图层更新失败", error);
  }
}

function createOverviewStyles(TMap: TencentPipeApi) {
  if (!TMap.PolylineStyle) return {};
  return {
    active: new TMap.PolylineStyle({ color: ACTIVE_PIPE_COLOR, width: 4 }),
    inactive: new TMap.PolylineStyle({ color: INACTIVE_PIPE_COLOR, width: 3 }),
  };
}

function renderOverviewPipes(TMap: TencentPipeApi, pipeGeometries: unknown[]) {
  if (!overviewLayer?.setGeometries || !TMap.LatLng) return;
  const geometries = pipeGeometries.map((geometry: any, index) => ({
    id: `overview-pipe-${index}`,
    styleId: geometry.styleId === "inactive" ? "inactive" : "active",
    paths: [geometry.path],
  }));
  if (!geometries.length) {
    hasOverviewPipeData = false;
    overviewLayer.setMap?.(null);
    return;
  }
  overviewLayer.setGeometries(geometries);
  hasOverviewPipeData = true;
  applyOverviewVisibility();
}

function applyOverviewVisibility() {
  const zoom = props.mapInstance?.getZoom?.() ?? OVERVIEW_PIPE_MAX_ZOOM;
  if (pipeVisible.value && hasOverviewPipeData && zoom <= OVERVIEW_PIPE_MAX_ZOOM) {
    overviewLayer?.setMap?.(props.mapInstance || null);
  } else {
    overviewLayer?.setMap?.(null);
  }
}

function renderDraftPipe(TMap: TencentPipeApi) {
  if (!draftPipeLayer?.setData) return;
  const points = props.creation.draft.points
    .filter((point) => point.lng.trim() && point.lat.trim())
    .map((point) => ({ lng: Number(point.lng), lat: Number(point.lat) }))
    .filter((point) => Number.isFinite(point.lng) && Number.isFinite(point.lat));
  if (points.length < 2) {
    hasDraftPipeData = false;
    draftPipeLayer.hide?.();
    return;
  }
  try {
    draftPipeLayer.setData([{
      path: points.map((point) => {
        const display = tencentDisplayCoordinate(point, props.creation.draft.countryCode);
        return { lat: display.lat, lng: display.lng };
      }),
      radius: 5,
      styleId: "draft",
      properties: { draft: true },
    }]);
    hasDraftPipeData = true;
  } catch (error) {
    hasDraftPipeData = false;
    draftPipeLayer.hide?.();
    console.error("腾讯地图草稿管线图层更新失败", error);
  }
}

function renderFacilities(TMap: TencentPipeApi) {
  if (!facilityLayer?.setGeometries) return;
  const geometries = props.formalFacilities
    .filter((facility) => props.facilityVisibility?.[facility.facilityType] !== false)
    .map((facility) => {
      const display = tencentDisplayCoordinate({ lat: facility.latitude, lng: facility.longitude }, facility.countryCode);
      return {
        id: "facility-" + facility.id,
        styleId: "facility-" + facility.facilityType,
        position: new TMap.LatLng(display.lat, display.lng),
        properties: { facilityId: facility.id, facilityNumber: facility.facilityNumber },
      };
    });
  if (!geometries.length) {
    hasFacilityData = false;
    facilityLayer.setMap?.(null);
    return;
  }
  facilityLayer.setGeometries(geometries);
  hasFacilityData = true;
}

function renderDraftFacilities(TMap: TencentPipeApi) {
  if (!draftFacilityLayer?.setGeometries) return;
  if (!props.creation.draft.active) {
    hasDraftFacilityData = false;
    draftFacilityLayer.setMap?.(null);
    return;
  }
  const points = getDraftPointCoordinates(props.creation.draft);
  const geometries: unknown[] = [];
  props.creation.draft.facilities
    .filter((facility) => props.facilityVisibility?.[facility.facilityType] !== false)
    .forEach((facility) => {
      const coordinate = getFacilityCoordinate(facility, points);
      if (!coordinate) return;
      const display = tencentDisplayCoordinate(coordinate, props.creation.draft.countryCode);
      geometries.push({
        id: "draft-facility-" + facility.id,
        styleId: "facility-" + facility.facilityType,
        position: new TMap.LatLng(display.lat, display.lng),
        draggable: true,
        properties: { draftFacilityId: facility.id, facilityNumber: facility.facilityNumber },
      });
    });
  if (!geometries.length) {
    hasDraftFacilityData = false;
    draftFacilityLayer.setMap?.(null);
    return;
  }
  draftFacilityLayer.setGeometries(geometries);
  hasDraftFacilityData = true;
}
function handleDraftFacilityDrag(event: any) {
  const id = String(event?.geometry?.id || "").replace(/^draft-facility-/, "");
  if (!id) return;
  const position = event?.geometry?.position || event?.latLng || event?.position;
  const lng = typeof position?.getLng === "function" ? position.getLng() : position?.lng;
  const lat = typeof position?.getLat === "function" ? position.getLat() : position?.lat;
  if (Number.isFinite(Number(lng)) && Number.isFinite(Number(lat))) {
    const sourceCoordinate = { lng: Number(lng), lat: Number(lat) };
    const coordinate = tencentSourceCoordinate(sourceCoordinate, props.creation.draft.countryCode);
    props.creation.moveFacilityFromMap(id, coordinate.lng, coordinate.lat);
  }
}

function createFacilityStyles(TMap: TencentPipeApi) {
  if (!TMap.MarkerStyle) return {};
  return {
    "facility-VALVE": createFacilityStyle(TMap, "/static/icons/facility-valve.svg"),
    "facility-HYDRANT": createFacilityStyle(TMap, "/static/icons/facility-hydrant.svg"),
    "facility-PUMP": createFacilityStyle(TMap, "/static/icons/facility-pump.svg"),
  };
}

function createFacilityStyle(TMap: TencentPipeApi, src: string) {
  if (!TMap.MarkerStyle) return {};
  return new TMap.MarkerStyle({ width: 36, height: 36, anchor: { x: 18, y: 18 }, src });
}

function applyVisibility() {
  if (pipeVisible.value && hasFormalPipeData) pipeLayer?.show?.(); else pipeLayer?.hide?.();
  if (props.creation.draft.active && hasDraftPipeData) draftPipeLayer?.show?.(); else draftPipeLayer?.hide?.();
  facilityLayer?.setMap?.(hasFacilityData ? (props.mapInstance || null) : null);
  draftFacilityLayer?.setMap?.(hasDraftFacilityData ? (props.mapInstance || null) : null);
  applyOverviewVisibility();
}

function togglePipeVisibility() { pipeVisible.value = !pipeVisible.value; }

function toggleFacility(type: FacilityType) {
  if (props.facilityVisibility) props.facilityVisibility[type] = !props.facilityVisibility[type];
  const TMap = getTMap();
  if (TMap) renderFacilities(TMap);
  if (TMap) renderDraftFacilities(TMap);
  applyVisibility();
}

function fitNetwork() {
  const TMap = getTMap();
  if (!props.mapInstance || !TMap?.LatLngBounds) return;
  const bounds = new TMap.LatLngBounds();
  let hasPoint = false;
  props.formalTubes.forEach((tube) => (tube.lineCoords || []).forEach((part) => part.forEach(([lng, lat]) => {
    const display = tencentDisplayCoordinate({ lng, lat }, tube.countryCode);
    bounds.extend?.(new TMap.LatLng(display.lat, display.lng));
    hasPoint = true;
  })));
  props.formalFacilities.forEach((facility) => {
    if (props.facilityVisibility?.[facility.facilityType] === false) return;
    const display = tencentDisplayCoordinate({ lat: facility.latitude, lng: facility.longitude }, facility.countryCode);
    bounds.extend?.(new TMap.LatLng(display.lat, display.lng));
    hasPoint = true;
  });
  if (hasPoint) props.mapInstance.fitBounds?.(bounds, { padding: 80 });
}

function destroyLayer(layer: TencentLayer | null) {
  layer?.remove?.();
  layer?.destroy?.();
}

function destroyOverviewLayer(layer: TencentOverviewLayer | null) {
  layer?.setMap?.(null);
}

function destroyMarkerLayer(layer: TencentMarkerLayer | null) {
  layer?.setMap?.(null);
}
</script>
