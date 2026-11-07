<template>
  <view class="network-layer">
    <FacilityMapTooltip :hover="facilityHover" />
    <LeakNetworkPanel
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
      @toggle-visible="togglePipeVisibility"
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
import type { TencentMapInstanceHandle } from "./tencent-map.types";
import { tencentDisplayCoordinate, tencentSourceCoordinate } from "../coordinateTransform";
import type { FacilityType, LeakMonitorFacility, LeakMonitorPipe, MapDevicePoint, MapRegion } from "../types";
import type { RejectedTubeRecord, TubeNetworkRecord } from "@/services/leak-monitor/tube-network";
import { useLeakMonitorI18n } from "../i18n";
import { getDraftPointCoordinates, getFacilityCoordinate, type PipeCreationController } from "../pipeCreation";
import { getNetworkViewportCoordinates } from "../networkViewport";

interface TencentMarkerLayer {
  setMap?: (map: TencentMapInstanceHandle | null) => void;
  setGeometries?: (geometries: unknown[]) => void;
  setStyles?: (styles: Record<string, unknown>) => void;
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
  PolylineStyle?: TencentPolylineStyle;
  MultiPolyline?: new (options: { map: TencentMapInstanceHandle; styles: Record<string, unknown>; geometries: unknown[] }) => TencentOverviewLayer;
  MarkerStyle?: new (options: { width: number; height: number; anchor: { x: number; y: number }; src: string }) => unknown;
  MultiMarker?: new (options: { map: TencentMapInstanceHandle; styles: Record<string, unknown>; geometries: unknown[] }) => TencentMarkerLayer;
}

const props = withDefaults(defineProps<{
  mapInstance?: TencentMapInstanceHandle | null;
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
const { hover: facilityHover, show: showFacilityHover, hide: hideFacilityHover } = useFacilityHover(
  (type) => t(type === "VALVE" ? "facilityValve" : type === "HYDRANT" ? "facilityHydrant" : "facilityPump"),
);
const pipeVisible = ref(true);
const panelCollapsed = ref(true);
let overviewLayer: TencentOverviewLayer | null = null;
let facilityLayer: TencentMarkerLayer | null = null;
let draftFacilityLayer: TencentMarkerLayer | null = null;
let draftPipeLayer: TencentOverviewLayer | null = null;
let draftPointLayer: TencentMarkerLayer | null = null;
const draftPointStyles = new Map<number, unknown>();
let layersMap: TencentMapInstanceHandle | null = null;
let draftSyncFrame: number | null = null;
let layerSyncFrame: number | null = null;
let hasOverviewPipeData = false;
let hasDraftPipeData = false;
let hasDraftPointData = false;
let hasFacilityData = false;
let hasDraftFacilityData = false;
const ACTIVE_PIPE_COLOR = "#16A34A";
const INACTIVE_PIPE_COLOR = "#94A3B8";

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
      syncDraftLayers();
    });
  },
  { deep: true },
);
watch(pipeVisible, applyVisibility);
onBeforeUnmount(() => {
  hideFacilityHover();
  if (draftSyncFrame !== null) window.cancelAnimationFrame(draftSyncFrame);
  if (layerSyncFrame !== null) window.cancelAnimationFrame(layerSyncFrame);
  destroyOverviewLayer(overviewLayer);
  destroyOverviewLayer(draftPipeLayer);
  destroyMarkerLayer(draftPointLayer);
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
  hideFacilityHover();
  const TMap = getTMap();
  if (!props.mapInstance || !TMap) {
    destroyOverviewLayer(overviewLayer);
    destroyOverviewLayer(draftPipeLayer);
    destroyMarkerLayer(draftPointLayer);
    destroyMarkerLayer(facilityLayer);
    destroyMarkerLayer(draftFacilityLayer);
    overviewLayer = null;
    draftPipeLayer = null;
    draftPointLayer = null;
    draftPointStyles.clear();
    facilityLayer = null;
    draftFacilityLayer = null;
    layersMap = null;
    hasOverviewPipeData = false;
    hasDraftPipeData = false;
    hasDraftPointData = false;
    hasFacilityData = false;
    hasDraftFacilityData = false;
    return;
  }

  // 地图实例变化时才重建图层（例如中英文地图供应商切换）。同一张地图
  // 的接口刷新只更新图层数据，避免重复创建 SDK 对象。
  if (layersMap !== props.mapInstance) {
    destroyOverviewLayer(overviewLayer);
    destroyOverviewLayer(draftPipeLayer);
    destroyMarkerLayer(draftPointLayer);
    destroyMarkerLayer(facilityLayer);
    destroyMarkerLayer(draftFacilityLayer);
    draftPipeLayer = null;
    draftPointLayer = null;
    draftPointStyles.clear();
    facilityLayer = null;
    draftFacilityLayer = null;
    layersMap = props.mapInstance;
    hasOverviewPipeData = false;
    hasDraftPipeData = false;
    hasDraftPointData = false;
    hasFacilityData = false;
    hasDraftFacilityData = false;

    if (TMap.MultiPolyline && TMap.PolylineStyle) {
      overviewLayer = new TMap.MultiPolyline({
        map: props.mapInstance,
        styles: createOverviewStyles(TMap),
        geometries: [],
      });
      draftPipeLayer = new TMap.MultiPolyline({
        map: props.mapInstance,
        styles: { draft: new TMap.PolylineStyle({ color: "#0EA5E9", width: 6 }) },
        geometries: [],
      });
    }

    if (TMap.MultiMarker && TMap.MarkerStyle) {
      draftPointLayer = new TMap.MultiMarker({ map: props.mapInstance, styles: {}, geometries: [] });
      facilityLayer = new TMap.MultiMarker({ map: props.mapInstance, styles: createFacilityStyles(TMap), geometries: [] });
      draftFacilityLayer = new TMap.MultiMarker({ map: props.mapInstance, styles: createFacilityStyles(TMap), geometries: [] });
      bindFacilityHover(facilityLayer, false);
      bindFacilityHover(draftFacilityLayer, true);
      draftFacilityLayer.on?.("dragend", handleDraftFacilityDrag);
    }
  }

  renderPipes(TMap);
  renderFacilities(TMap);
  renderDraftPipe(TMap);
  renderDraftPoints(TMap);
  renderDraftFacilities(TMap);
  applyVisibility();
}

function syncDraftLayers() {
  const TMap = getTMap();
  if (!props.mapInstance || !TMap) return;
  renderDraftPipe(TMap);
  renderDraftPoints(TMap);
  renderDraftFacilities(TMap);
  applyVisibility();
}

function renderPipes(TMap: TencentPipeApi) {
  if (!overviewLayer?.setGeometries) return;
  const geometries: unknown[] = [];
  props.formalTubes.forEach((tube) => (tube.lineCoords || []).forEach((part) => {
    const paths = part.map(([lng, lat]) => {
      const display = tencentDisplayCoordinate({ lng, lat }, tube.countryCode);
      return { lat: display.lat, lng: display.lng };
    });
    if (paths.length >= 2) geometries.push({ path: paths, radius: 4, styleId: tube.status === 0 ? "inactive" : "active", properties: { tubeId: tube.id, tubeName: tube.tubeName } });
  }));
  if (!geometries.length) {
    hasOverviewPipeData = false;
    overviewLayer?.setMap?.(null);
    return;
  }
  try {
    // MultiPolyline 接收一维 TMap.LatLng[] 路径；可视化 Pipe 的 Worker
    // 在地图缩放后可能无法重绘，正式管线改用 SDK 原生矢量图层。
    renderOverviewPipes(TMap, geometries);
    // Loading network data must not change the viewport; fit only on request.
  } catch (error) {
    hasOverviewPipeData = false;
    overviewLayer?.setMap?.(null);
    console.error("腾讯地图管线图层更新失败", error);
  }
}

function createOverviewStyles(TMap: TencentPipeApi) {
  if (!TMap.PolylineStyle) return {};
  return {
    active: new TMap.PolylineStyle({ color: ACTIVE_PIPE_COLOR, width: 6 }),
    inactive: new TMap.PolylineStyle({ color: INACTIVE_PIPE_COLOR, width: 4 }),
  };
}

function renderOverviewPipes(TMap: TencentPipeApi, pipeGeometries: unknown[]) {
  if (!overviewLayer?.setGeometries || !TMap.LatLng) return;
  const geometries = pipeGeometries.map((geometry: any, index) => ({
    id: `overview-pipe-${index}`,
    styleId: geometry.styleId === "inactive" ? "inactive" : "active",
    paths: geometry.path.map(({ lat, lng }: { lat: number; lng: number }) => new TMap.LatLng(lat, lng)),
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
  if (pipeVisible.value && hasOverviewPipeData) {
    overviewLayer?.setMap?.(props.mapInstance || null);
  } else {
    overviewLayer?.setMap?.(null);
  }
}

function renderDraftPipe(TMap: TencentPipeApi) {
  if (!draftPipeLayer?.setGeometries) return;
  const points = getDraftPointCoordinates(props.creation.draft);
  if (points.length < 2) {
    hasDraftPipeData = false;
    draftPipeLayer.setMap?.(null);
    return;
  }
  try {
    draftPipeLayer.setGeometries([{
      id: "draft-pipe",
      paths: points.map((point) => {
        const display = tencentDisplayCoordinate(point, props.creation.draft.countryCode);
        return new TMap.LatLng(display.lat, display.lng);
      }),
      styleId: "draft",
    }]);
    hasDraftPipeData = true;
  } catch (error) {
    hasDraftPipeData = false;
    draftPipeLayer.setMap?.(null);
    console.error("腾讯地图草稿管线图层更新失败", error);
  }
}

function renderDraftPoints(TMap: TencentPipeApi) {
  const MarkerStyle = TMap.MarkerStyle;
  if (!draftPointLayer?.setGeometries || !MarkerStyle) return;
  const points = props.creation.draft.active ? getDraftPointCoordinates(props.creation.draft) : [];
  const styles: Record<string, unknown> = {};
  const geometries = points.map((point, index) => {
    if (!draftPointStyles.has(index)) {
      const canvas = document.createElement("canvas");
      canvas.width = 48;
      canvas.height = 48;
      const context = canvas.getContext("2d");
      if (context) {
        context.scale(2, 2);
        context.beginPath();
        context.arc(12, 12, 10, 0, Math.PI * 2);
        context.fillStyle = "#0284C7";
        context.fill();
        context.lineWidth = 2;
        context.strokeStyle = "#FFFFFF";
        context.stroke();
        context.fillStyle = "#FFFFFF";
        context.font = "700 11px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(String(index + 1), 12, 12);
      }
      draftPointStyles.set(index, new MarkerStyle({
        width: 24, height: 24, anchor: { x: 12, y: 12 },
        src: context ? canvas.toDataURL("image/png") : "/static/icons/crosshair.svg",
      }));
    }
    const styleId = "draft-point-" + index;
    styles[styleId] = draftPointStyles.get(index);
    const display = tencentDisplayCoordinate(point, props.creation.draft.countryCode);
    return { id: styleId, styleId, position: new TMap.LatLng(display.lat, display.lng) };
  });
  draftPointLayer.setStyles?.(styles);
  draftPointLayer.setGeometries(geometries);
  hasDraftPointData = geometries.length > 0;
}

function renderFacilities(TMap: TencentPipeApi) {
  hideFacilityHover();
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
  hideFacilityHover();
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
function bindFacilityHover(layer: TencentMarkerLayer, draft: boolean) {
  const show = (event: any) => {
    const id = String(event?.geometry?.id || "").replace(draft ? /^draft-facility-/ : /^facility-/, "");
    const facility = draft
      ? props.creation.draft.facilities.find((item) => item.id === id)
      : props.formalFacilities.find((item) => String(item.id) === id);
    if (facility) showFacilityHover(facility, event.originalEvent);
    else hideFacilityHover();
  };
  layer.on?.("mouseover", show);
  layer.on?.("mousemove", show);
  layer.on?.("mouseout", hideFacilityHover);
  layer.on?.("dragstart", hideFacilityHover);
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
  draftPipeLayer?.setMap?.(props.creation.draft.active && hasDraftPipeData ? (props.mapInstance || null) : null);
  draftPointLayer?.setMap?.(props.creation.draft.active && hasDraftPointData ? (props.mapInstance || null) : null);
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

function fitNetwork(regionKey = "all") {
  const TMap = getTMap();
  if (!props.mapInstance || !TMap?.LatLngBounds) return;
  const bounds = new TMap.LatLngBounds();
  const coordinates = getNetworkViewportCoordinates(props.formalTubes, props.formalFacilities, pipeVisible.value, props.facilityVisibility, regionKey);
  if (!coordinates.length) { uni.showToast({ title: language.value === "zh-CN" ? "没有可定位的有效坐标" : "No visible coordinates to locate", icon: "none" }); return; }
  coordinates.forEach((coordinate) => {
    const display = tencentDisplayCoordinate(coordinate, coordinate.countryCode);
    bounds.extend?.(new TMap.LatLng(display.lat, display.lng));
  });
  // 面板占据地图中央；定位后先收起面板，让适配的管线范围完整可见。
  // 不通知外层恢复右侧设备面板，否则管线又会被遮住。
  panelCollapsed.value = true;
  props.mapInstance.fitBounds?.(bounds, { padding: 80 });
}

function destroyOverviewLayer(layer: TencentOverviewLayer | null) {
  layer?.setMap?.(null);
}

function destroyMarkerLayer(layer: TencentMarkerLayer | null) {
  layer?.setMap?.(null);
}
</script>
