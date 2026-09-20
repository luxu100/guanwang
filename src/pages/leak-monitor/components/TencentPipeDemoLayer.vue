<template>
  <view class="pipe-demo-layer">
    <view
      v-if="panelCollapsed"
      class="pipe-demo-collapsed"
      @click.stop="openPanel"
    >
      <button
        class="pipe-demo-collapsed__button"
        type="button"
        aria-label="打开管线演示面板"
        @click.stop="openPanel"
      >
        <text class="pipe-demo-collapsed__icon"></text>
        <text>管线面板</text>
      </button>
    </view>
    <view v-else class="pipe-demo-panel" @click.stop>
      <view class="pipe-demo-panel__head">
        <view>
          <text class="pipe-demo-panel__title">管线演示</text>
          <text class="pipe-demo-panel__subtitle">
            {{ drawing ? "绘制模式：点击地图添加节点" : "腾讯 Pipe mock 图层" }}
          </text>
        </view>
        <button
          class="pipe-demo-icon-button pipe-demo-icon-button--collapse"
          type="button"
          aria-label="收起管线演示面板"
          @click="closePanel"
        >
          <text class="pipe-demo-chevron pipe-demo-chevron--up"></text>
        </button>
        <button
          class="pipe-demo-icon-button"
          type="button"
          :aria-label="visible ? '隐藏管线' : '显示管线'"
          @click="toggleVisible"
        >
          <text class="pipe-demo-eye" :class="{ 'pipe-demo-eye--off': !visible }"></text>
        </button>
      </view>

      <view class="pipe-demo-control" @click="toggleVisible">
        <view class="pipe-demo-control__label">
          <text>管线显示</text>
          <text class="pipe-demo-control__value">{{ visible ? "已显示" : "已隐藏" }}</text>
        </view>
        <view class="pipe-demo-switch" :class="{ 'pipe-demo-switch--on': visible }">
          <view class="pipe-demo-switch__thumb"></view>
        </view>
      </view>

      <view class="pipe-demo-control pipe-demo-control--column">
        <view class="pipe-demo-control__label">
          <text>管线粗细</text>
          <text class="pipe-demo-control__value">{{ pipeRadius }}m</text>
        </view>
        <slider
          class="pipe-demo-slider"
          min="1"
          max="10"
          step="1"
          :value="pipeRadius"
          activeColor="#2f80ed"
          backgroundColor="#dce8f5"
          block-color="#2f80ed"
          @changing="handleRadiusChange"
          @change="handleRadiusChange"
        />
      </view>

      <view class="pipe-demo-actions">
        <button
          class="pipe-demo-button pipe-demo-button--primary"
          type="button"
          :disabled="drawing"
          @click="startDrawing"
        >
          <text class="pipe-demo-button__plus">+</text>
          <text>绘制管线</text>
        </button>
        <button class="pipe-demo-button" type="button" @click="regenerate">
          <text class="pipe-demo-button__refresh"></text>
          <text>重置示例</text>
        </button>
      </view>

      <view class="pipe-demo-gis">
        <view class="pipe-demo-control__label">
          <text>GIS 管网图层</text>
          <button class="pipe-demo-mini-button" type="button" @click="toggleGisVisible">
            {{ gisVisible ? "隐藏" : "显示" }}
          </button>
        </view>
        <view class="pipe-demo-gis__layers">
          <button
            v-for="layer in W84_LAYERS"
            :key="layer"
            class="pipe-demo-layer-toggle"
            :class="{ 'pipe-demo-layer-toggle--active': gisLayerVisible[layer] && gisVisible }"
            type="button"
            @click="toggleGisLayer(layer)"
          >
            <text class="pipe-demo-layer-toggle__dot" :style="{ backgroundColor: W84_LAYER_COLORS[layer] }"></text>
            <text>{{ W84_LAYER_LABELS[layer] }}</text>
          </button>
        </view>
        <button class="pipe-demo-button pipe-demo-button--wide" type="button" @click="focusGisLayer">
          定位 GIS 图层
        </button>
        <text class="pipe-demo-gis__meta">
          管线 {{ W84_NETWORK_DATA.layers.pipes.features.length }} · 消防栓 {{ W84_NETWORK_DATA.layers.hydrants.features.length }} · 泵 {{ W84_NETWORK_DATA.layers.pumps.features.length }} · 阀门 {{ W84_NETWORK_DATA.layers.valves.features.length }}
        </text>
      </view>

      <view class="pipe-demo-gis pipe-demo-gis--formal">
        <view class="pipe-demo-control__label">
          <text>正式管线（API）</text>
          <button class="pipe-demo-mini-button" type="button" @click="toggleFormalVisible">
            {{ formalVisible ? "隐藏" : "显示" }}
          </button>
        </view>
        <view v-if="formalTubeLoading" class="pipe-demo-gis__meta">正式管线加载中…</view>
        <view v-else-if="formalTubeError" class="pipe-demo-error pipe-demo-error--inline">
          {{ formalTubeError }}
        </view>
        <template v-else>
          <button class="pipe-demo-button pipe-demo-button--wide" type="button" @click="focusFormalTubes">
            定位正式管线
          </button>
          <text class="pipe-demo-gis__meta">
            记录 {{ formalTubesStats.total }} 条（启用 {{ formalTubesStats.enabled }}）· 折线段 {{ formalTubesStats.partCount }} · 国家 {{ formalTubesStats.countries.join("/") || "--" }}
          </text>
          <text class="pipe-demo-gis__meta">
            长度合计 {{ formalTubesStats.lengthSum.toFixed(2) }} m
          </text>
          <view
            v-for="tube in formalTubes.slice(0, 8)"
            :key="tube.id"
            class="pipe-demo-gis__meta"
          >
            #{{ tube.id }} {{ tube.tubeName || "--" }} · {{ tube.countryCode }} · {{ tube.material || "--" }} · {{ tube.diameterMm ?? "--" }}mm · {{ tube.shapeLengthM ?? "--" }}m
          </view>
          <text v-if="formalTubes.length > 8" class="pipe-demo-gis__meta">
            …其余 {{ formalTubes.length - 8 }} 条略
          </text>
        </template>
        <view v-if="formalTubeRejected.length" class="pipe-demo-error pipe-demo-error--inline">
          {{ formalTubeRejected.length }} 条记录元数据缺失/非法已跳过：
          <view v-for="(item, index) in formalTubeRejected.slice(0, 3)" :key="index">
            #{{ item.id ?? "?" }} {{ item.tubeName || "--" }}：{{ item.reason }}
          </view>
        </view>
      </view>

      <view v-if="drawing" class="pipe-demo-drawing">
        <view class="pipe-demo-drawing__status">
          <text class="pipe-demo-drawing__dot"></text>
          <text>正在绘制，已添加 {{ draftPoints.length }} 个节点</text>
        </view>

        <view v-if="snapCandidate" class="pipe-demo-snap">
          <text class="pipe-demo-snap__title">检测到附近节点</text>
          <text class="pipe-demo-snap__text">
            是否与“{{ snapCandidate.junction.label || snapCandidate.junction.id }}”连通？
          </text>
          <view class="pipe-demo-snap__actions">
            <button class="pipe-demo-button pipe-demo-button--connect" type="button" @click="confirmSnap">
              连通
            </button>
            <button class="pipe-demo-button pipe-demo-button--separate" type="button" @click="keepSeparate">
              不连通
            </button>
          </view>
        </view>

        <view class="pipe-demo-actions pipe-demo-actions--drawing">
          <button
            class="pipe-demo-button"
            type="button"
            :disabled="!draftPoints.length && !snapCandidate"
            @click="undoLast"
          >
            撤销节点
          </button>
          <button
            class="pipe-demo-button"
            type="button"
            :disabled="!draftPoints.length && !snapCandidate"
            @click="clearDraft"
          >
            清空草稿
          </button>
        </view>
        <view class="pipe-demo-actions pipe-demo-actions--drawing">
          <button
            class="pipe-demo-button pipe-demo-button--primary"
            type="button"
            :disabled="draftPoints.length < 2 || Boolean(snapCandidate)"
            @click="completeDrawing"
          >
            完成管线
          </button>
          <button class="pipe-demo-button" type="button" @click="cancelDrawing">
            取消绘制
          </button>
        </view>
      </view>

      <view class="pipe-demo-legend">
        <view class="pipe-demo-legend__title">演示图例</view>
        <view class="pipe-demo-legend__item">
          <text class="pipe-demo-legend__line pipe-demo-legend__line--normal"></text>
          <text>正常管线</text>
        </view>
        <view class="pipe-demo-legend__item">
          <text class="pipe-demo-legend__line pipe-demo-legend__line--warning"></text>
          <text>关注管线</text>
        </view>
        <view class="pipe-demo-legend__item">
          <text class="pipe-demo-legend__line pipe-demo-legend__line--danger"></text>
          <text>高风险示例</text>
        </view>
        <view class="pipe-demo-legend__item">
          <text class="pipe-demo-legend__node pipe-demo-legend__node--connected"></text>
          <text>连通节点</text>
        </view>
        <view class="pipe-demo-legend__item">
          <text class="pipe-demo-legend__node pipe-demo-legend__node--separate"></text>
          <text>不连通交叉</text>
        </view>
      </view>

      <view class="pipe-demo-panel__footer">
        <text>{{ pipes.length }} 条示例管线 · {{ junctions.length }} 个节点</text>
      </view>
    </view>

    <view v-if="errorMessage" class="pipe-demo-error" @click.stop>
      {{ errorMessage }}
    </view>
  </view>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, computed, ref, watch } from "vue";
import type { MapCoordinate, MapDevicePoint } from "../types";
import {
  createDemoPipeNetwork,
  type DemoJunction,
  type DemoPipe,
  type DemoPipeStyleId,
} from "./pipe-demo-data";
import type { TencentMapInstanceHandle } from "./tencent-map.types";
import { convertMapCoordinate, tencentDisplayCoordinate } from "../coordinateTransform";
import type {
  RejectedTubeRecord,
  TubeNetworkRecord,
} from "@/services/leak-monitor/tube-network";
import {
  featurePaths,
  featurePoint,
  W84_LAYER_COLORS,
  W84_LAYER_LABELS,
  W84_NETWORK_DATA,
  w84Bounds,
  type W84LayerKey,
} from "./w84-gis-data";

interface DraftPoint {
  coordinate: MapCoordinate;
  junctionId?: string;
}

interface SnapCandidate {
  coordinate: MapCoordinate;
  junction: DemoJunction;
}

interface TencentPipeData {
  path: unknown[];
  radius: number;
  styleId: DemoPipeStyleId | "formal-enabled" | "formal-disabled";
  properties?: Record<string, unknown>;
}

interface TencentPipeLayer {
  addTo?: (map: TencentMapInstanceHandle) => void;
  setData?: (data: TencentPipeData[]) => void;
  show?: () => void;
  hide?: () => void;
  remove?: () => void;
  destroy?: () => void;
}

interface TencentMarkerLayer {
  setMap?: (map: TencentMapInstanceHandle | null) => void;
  setStyles?: (styles: Record<string, unknown>) => void;
  setGeometries?: (geometries: Array<{
    id: string;
    styleId?: string;
    position: unknown;
    properties?: Record<string, unknown>;
  }>) => void;
}

interface TencentPipeApi {
  LatLng: new (lat: number, lng: number, altitude?: number) => unknown;
  LatLngBounds?: new () => {
    extend?: (position: unknown) => void;
  };
  MarkerStyle?: new (options: {
    width: number;
    height: number;
    anchor: { x: number; y: number };
    src: string;
  }) => unknown;
  MultiMarker?: new (options: {
    map: TencentMapInstanceHandle;
    styles: Record<string, unknown>;
    geometries: Array<{
      id: string;
      styleId?: string;
      position: unknown;
      properties?: Record<string, unknown>;
    }>;
  }) => TencentMarkerLayer;
  visualization?: {
    Pipe: new (options: {
      pickStyle: (item: { styleId?: string }) => { color: string };
    }) => TencentPipeLayer;
  };
}

interface TencentRuntimeWindow {
  TMap?: TencentPipeApi;
}

interface TencentLatLngValue {
  getLat?: () => number;
  getLng?: () => number;
  lat?: number;
  lng?: number;
}

interface TencentMapClickEvent {
  latLng?: TencentLatLngValue;
}

const props = withDefaults(defineProps<{
  mapInstance?: TencentMapInstanceHandle | null;
  points?: MapDevicePoint[];
  /** 正式管线（后端 API）；与静态演示 JSON 完全独立，失败必须显式呈现 */
  formalTubes?: TubeNetworkRecord[];
  formalTubeRejected?: RejectedTubeRecord[];
  formalTubeError?: string;
  formalTubeLoading?: boolean;
}>(), {
  mapInstance: null,
  points: () => [],
  formalTubes: () => [],
  formalTubeRejected: () => [],
  formalTubeError: "",
  formalTubeLoading: false,
});

const visible = ref(true);
const panelCollapsed = ref(true);
const drawing = ref(false);
const pipeRadius = ref(4);
const pipes = ref<DemoPipe[]>([]);
const junctions = ref<DemoJunction[]>([]);
const draftPoints = ref<DraftPoint[]>([]);
const snapCandidate = ref<SnapCandidate | null>(null);
const errorMessage = ref("");
const gisLayerVisible = ref<Record<W84LayerKey, boolean>>({
  pipes: true,
  hydrants: true,
  pumps: true,
  valves: true,
});
// 正式管线（API）图层状态：默认开启。
// 演示静态 GIS 图层在正式验收模式下从初始化即关闭（不以"成功收到正式记录"为
// 关闭条件）：正式数据失败/为空/全部被拒时，地图上不得出现演示管线造成混淆；
// 需要看演示数据时手动打开开关。remount（切换地图 provider 后切回）同样保持关闭。
const formalVisible = ref(true);
const gisVisible = ref(false);

let pipeLayer: TencentPipeLayer | null = null;
let draftPipeLayer: TencentPipeLayer | null = null;
let junctionLayer: TencentMarkerLayer | null = null;
let gisPipeLayer: TencentPipeLayer | null = null;
let gisPointLayer: TencentMarkerLayer | null = null;
let formalPipeLayer: TencentPipeLayer | null = null;

const FORMAL_TUBE_COLORS = {
  enabled: "#16A34A",
  disabled: "#94A3B8",
} as const;

const formalTubesStats = computed(() => {
  const tubes = props.formalTubes;
  const enabled = tubes.filter((tube) => tube.status === 1).length;
  const partCount = tubes.reduce((sum, tube) => sum + (tube.lineCoords?.length ?? 0), 0);
  const lengthSum = tubes.reduce(
    (sum, tube) => sum + (Number(tube.shapeLengthM) || 0),
    0,
  );
  const countries = [...new Set(tubes.map((tube) => tube.countryCode).filter(Boolean))];
  return { total: tubes.length, enabled, partCount, lengthSum, countries };
});

const PIPE_COLORS: Record<DemoPipeStyleId, string> = {
  normal: "#2F80ED",
  warning: "#F59E0B",
  danger: "#EF4444",
};

const SNAP_DISTANCE_METERS = 42;
const W84_LAYERS = Object.keys(W84_LAYER_LABELS) as W84LayerKey[];

onMounted(() => {
  regenerate();
  syncPipeLayers();
});

onBeforeUnmount(() => {
  stopMapClickListener();
  destroyPipeLayer(pipeLayer);
  destroyPipeLayer(draftPipeLayer);
  destroyPipeLayer(gisPipeLayer);
  destroyPipeLayer(formalPipeLayer);
  junctionLayer?.setMap?.(null);
  gisPointLayer?.setMap?.(null);
  junctionLayer = null;
  gisPointLayer = null;
  gisPipeLayer = null;
  formalPipeLayer = null;
});

watch(
  () => props.mapInstance,
  () => {
    stopMapClickListener();
    destroyPipeLayer(pipeLayer);
    destroyPipeLayer(draftPipeLayer);
    destroyPipeLayer(gisPipeLayer);
    destroyPipeLayer(formalPipeLayer);
    junctionLayer?.setMap?.(null);
    gisPointLayer?.setMap?.(null);
    pipeLayer = null;
    draftPipeLayer = null;
    gisPipeLayer = null;
    formalPipeLayer = null;
    junctionLayer = null;
    gisPointLayer = null;
    syncPipeLayers();
    // 地图实例就绪即渲染正式管线（数据可能早于地图到达）
    renderFormalTubeLayer();
    applyLayerVisibility();
  },
);

watch(
  () => props.formalTubes,
  () => {
    renderFormalTubeLayer();
    applyLayerVisibility();
  },
  { deep: true },
);

watch(
  () => props.points,
  () => {
    if (!drawing.value) {
      regenerate();
      renderAllLayers();
    }
  },
  { deep: true },
);

function getTMap() {
  return (window as unknown as TencentRuntimeWindow).TMap;
}

function toggleVisible() {
  visible.value = !visible.value;
  applyLayerVisibility();
}

function openPanel() {
  panelCollapsed.value = false;
}

function closePanel() {
  panelCollapsed.value = true;
}

function toggleGisVisible() {
  gisVisible.value = !gisVisible.value;
  applyLayerVisibility();
}

function toggleGisLayer(layer: W84LayerKey) {
  gisLayerVisible.value[layer] = !gisLayerVisible.value[layer];
  renderGisLayers();
}

function focusGisLayer() {
  const TMap = getTMap();
  const bounds = w84Bounds();
  if (!props.mapInstance || !TMap?.LatLngBounds || !bounds) return;
  const mapBounds = new TMap.LatLngBounds();
  [
    { lat: bounds.south, lng: bounds.west },
    { lat: bounds.north, lng: bounds.east },
  ].forEach((coordinate) => {
    const converted = convertMapCoordinate(coordinate, "WGS84", "GCJ02");
    mapBounds.extend?.(new TMap.LatLng(converted.lat, converted.lng));
  });
  props.mapInstance.fitBounds?.(mapBounds, { padding: 80 });
}

function handleRadiusChange(event: { detail?: { value?: number | string } }) {
  const nextValue = Number(event.detail?.value);
  if (!Number.isFinite(nextValue)) return;
  pipeRadius.value = Math.min(10, Math.max(1, Math.round(nextValue)));
  renderAllLayers();
}

function startDrawing() {
  openPanel();
  drawing.value = true;
  draftPoints.value = [];
  snapCandidate.value = null;
  errorMessage.value = "";
  startMapClickListener();
  renderDraftLayer();
  renderJunctionLayer();
}

function cancelDrawing() {
  drawing.value = false;
  draftPoints.value = [];
  snapCandidate.value = null;
  stopMapClickListener();
  renderDraftLayer();
  renderJunctionLayer();
}

function clearDraft() {
  draftPoints.value = [];
  snapCandidate.value = null;
  renderDraftLayer();
  renderJunctionLayer();
}

function undoLast() {
  if (snapCandidate.value) {
    snapCandidate.value = null;
    return;
  }
  draftPoints.value = draftPoints.value.slice(0, -1);
  renderDraftLayer();
  renderJunctionLayer();
}

function confirmSnap() {
  const candidate = snapCandidate.value;
  if (!candidate) return;
  addDraftPoint(candidate.coordinate, candidate.junction.id);
  snapCandidate.value = null;
  renderDraftLayer();
  renderJunctionLayer();
}

function keepSeparate() {
  const candidate = snapCandidate.value;
  if (!candidate) return;
  addDraftPoint(candidate.coordinate);
  snapCandidate.value = null;
  renderDraftLayer();
  renderJunctionLayer();
}

function addDraftPoint(coordinate: MapCoordinate, junctionId?: string) {
  draftPoints.value = [...draftPoints.value, { coordinate, junctionId }];
}

function completeDrawing() {
  if (draftPoints.value.length < 2 || snapCandidate.value) return;

  const path = draftPoints.value.map((point) => point.coordinate);
  const start = ensureEndpointJunction(draftPoints.value[0], "绘制起点");
  const end = ensureEndpointJunction(draftPoints.value[draftPoints.value.length - 1], "绘制终点");
  const detectedCrossings = detectCrossings(path, pipes.value);

  detectedCrossings.forEach((coordinate, index) => {
    junctions.value.push({
      id: `draw-crossing-${Date.now()}-${index}`,
      coordinate,
      type: "crossing",
      connected: false,
      label: "不连通",
    });
  });

  pipes.value = [
    ...pipes.value,
    {
      id: `draw-pipe-${Date.now()}`,
      name: "手绘演示管线",
      path,
      radius: pipeRadius.value,
      styleId: "warning",
      riskLevel: "medium",
      deviceNumbers: [],
      startJunctionId: start.id,
      endJunctionId: end.id,
      connectedJunctionIds: [start.id, end.id],
      coordinateSystem: "GCJ02",
    },
  ];

  drawing.value = false;
  draftPoints.value = [];
  snapCandidate.value = null;
  stopMapClickListener();
  renderAllLayers();
}

function ensureEndpointJunction(point: DraftPoint, label: string) {
  if (point.junctionId) {
    return junctions.value.find((junction) => junction.id === point.junctionId) || {
      id: point.junctionId,
      coordinate: point.coordinate,
      type: "endpoint" as const,
      connected: true,
      label,
    };
  }

  const junction: DemoJunction = {
    id: `draw-junction-${Date.now()}-${junctions.value.length}`,
    coordinate: point.coordinate,
    type: "endpoint",
    connected: false,
    label,
    coordinateSystem: "GCJ02",
  };
  junctions.value.push(junction);
  return junction;
}

function regenerate() {
  const demo = createDemoPipeNetwork(props.points);
  pipes.value = demo.pipes;
  junctions.value = demo.junctions;
  drawing.value = false;
  draftPoints.value = [];
  snapCandidate.value = null;
  stopMapClickListener();
  errorMessage.value = "";
  renderAllLayers();
}

function syncPipeLayers() {
  if (!props.mapInstance) return;

  const TMap = getTMap();
  if (!TMap?.visualization?.Pipe) {
    errorMessage.value = "腾讯地图可视化能力未加载，暂时无法显示管线";
    return;
  }

  pipeLayer = new TMap.visualization.Pipe({
    pickStyle: (item) => ({
      color: PIPE_COLORS[normalizeStyleId(item.styleId)],
    }),
  });
  pipeLayer.addTo?.(props.mapInstance);

  draftPipeLayer = new TMap.visualization.Pipe({
    pickStyle: () => ({
      color: "#64748B",
    }),
  });
  draftPipeLayer.addTo?.(props.mapInstance);

  gisPipeLayer = new TMap.visualization.Pipe({
    pickStyle: () => ({ color: W84_LAYER_COLORS.pipes }),
  });
  gisPipeLayer.addTo?.(props.mapInstance);

  formalPipeLayer = new TMap.visualization.Pipe({
    pickStyle: (item) => ({
      color: item.styleId === "formal-disabled"
        ? FORMAL_TUBE_COLORS.disabled
        : FORMAL_TUBE_COLORS.enabled,
    }),
  });
  formalPipeLayer.addTo?.(props.mapInstance);

  if (TMap.MultiMarker && TMap.MarkerStyle) {
    junctionLayer = new TMap.MultiMarker({
      map: props.mapInstance,
      styles: createJunctionStyles(TMap),
      geometries: [],
    });
    gisPointLayer = new TMap.MultiMarker({
      map: props.mapInstance,
      styles: createGisMarkerStyles(TMap),
      geometries: [],
    });
  }

  startMapClickListener();
  renderAllLayers();
}

function startMapClickListener() {
  if (!drawing.value || !props.mapInstance?.on) return;
  props.mapInstance.on("click", handleMapClick as (...args: unknown[]) => void);
}

function stopMapClickListener() {
  if (!props.mapInstance?.off) return;
  props.mapInstance.off("click", handleMapClick as (...args: unknown[]) => void);
}

function handleMapClick(event: TencentMapClickEvent) {
  if (!drawing.value || snapCandidate.value) return;
  const coordinate = readCoordinate(event.latLng);
  if (!coordinate) return;

  const nearest = findNearestJunction(coordinate);
  if (nearest && distanceMeters(coordinate, nearest.coordinate) <= SNAP_DISTANCE_METERS) {
    snapCandidate.value = {
      coordinate: toTencentCoordinate(nearest.coordinate, nearest.coordinateSystem || "WGS84"),
      junction: nearest,
    };
    renderJunctionLayer();
    return;
  }

  addDraftPoint(coordinate);
  renderDraftLayer();
  renderJunctionLayer();
}

function renderAllLayers() {
  // 正式管线优先渲染：即使后续演示图层渲染异常，也不影响正式数据上屏
  renderFormalTubeLayer();
  renderPipeLayer();
  renderDraftLayer();
  renderJunctionLayer();
  renderGisLayers();
  applyLayerVisibility();
}

function renderPipeLayer() {
  if (!pipeLayer?.setData) return;
  pipeLayer.setData(toTencentPipeData(pipes.value));
}

function renderDraftLayer() {
  if (!draftPipeLayer?.setData) return;
  draftPipeLayer.setData(
    draftPoints.value.length >= 2
      ? [{
        path: toTencentPath(draftPoints.value.map((point) => point.coordinate), "GCJ02"),
        radius: pipeRadius.value,
        styleId: "normal",
      }]
      : [],
  );
}

function renderGisLayers() {
  if (!gisPipeLayer?.setData || !gisPointLayer?.setGeometries) return;
  const TMap = getTMap();
  if (!TMap) return;

  gisPipeLayer.setData(gisLayerVisible.value.pipes
    ? W84_NETWORK_DATA.layers.pipes.features.flatMap((feature) =>
      featurePaths(feature).map((path) => ({
        path: toTencentPath(path.map(([lng, lat]) => ({ lat, lng }))),
        radius: pipeRadius.value,
        styleId: "normal" as DemoPipeStyleId,
        properties: feature.properties,
      })))
    : []);

  const geometries: Array<{ id: string; styleId?: string; position: unknown; properties?: Record<string, unknown> }> = [];
  W84_LAYERS.filter((layer) => layer !== "pipes" && gisLayerVisible.value[layer]).forEach((layer) => {
    W84_NETWORK_DATA.layers[layer].features.forEach((feature) => {
      const point = featurePoint(feature);
      if (!point) return;
      const converted = convertMapCoordinate(point, "WGS84", "GCJ02");
      geometries.push({
        id: `${layer}-${feature.id}`,
        styleId: `gis-${layer}`,
        position: new TMap.LatLng(converted.lat, converted.lng),
        properties: { layer, ...feature.properties },
      });
    });
  });
  W84_NETWORK_DATA.crossings.forEach((crossing) => {
    const converted = convertMapCoordinate(
      { lat: crossing.coordinate[1], lng: crossing.coordinate[0] },
      "WGS84",
      "GCJ02",
    );
    geometries.push({
      id: crossing.crossingId,
      styleId: "gis-crossing",
      position: new TMap.LatLng(converted.lat, converted.lng),
      properties: { label: crossing.label, pipeIds: crossing.pipeIds },
    });
  });
  gisPointLayer.setGeometries(geometries);
}

function renderJunctionLayer() {
  if (!junctionLayer?.setGeometries) return;
  const TMap = getTMap();
  if (!TMap) return;

  const geometries = junctions.value.map((junction) => ({
    id: junction.id,
    styleId: junction.connected ? "junction-connected" : "junction-separate",
    position: (() => {
      const converted = convertMapCoordinate(
        junction.coordinate,
        junction.coordinateSystem || "WGS84",
        "GCJ02",
      );
      return new TMap.LatLng(converted.lat, converted.lng);
    })(),
    properties: {
      label: junction.label || (junction.connected ? "连通" : "不连通"),
    },
  }));

  if (snapCandidate.value) {
    geometries.push({
      id: "junction-pending",
      styleId: "junction-pending",
      position: new TMap.LatLng(
        snapCandidate.value.coordinate.lat,
        snapCandidate.value.coordinate.lng,
      ),
      properties: { label: "待确认" },
    });
  }

  draftPoints.value.forEach((point, index) => {
    geometries.push({
      id: `draft-point-${index}`,
      styleId: point.junctionId ? "junction-connected" : "junction-pending",
      position: new TMap.LatLng(point.coordinate.lat, point.coordinate.lng),
      properties: { label: point.junctionId ? "连通" : "绘制点" },
    });
  });

  junctionLayer.setGeometries(geometries);
}

/**
 * 正式管线渲染：每条记录 × 每段（partIndex）独立一条折线，key = `${id}:${partIndex}`，
 * 多段之间绝不拼接；坐标按国家策略转换（CN→GCJ02，MY 等海外原样），
 * API 加载失败时不进入本函数（数据层已拦截并显式报错，无演示回退）。
 */
function renderFormalTubeLayer() {
  if (!formalPipeLayer?.setData) return;
  const TMap = getTMap();
  if (!TMap) return;

  const data: TencentPipeData[] = [];  props.formalTubes.forEach((tube) => {
    const parts = tube.lineCoords ?? [];
    parts.forEach((part, partIndex) => {
      const path = part.map(([lng, lat]) => {
        const display = tencentDisplayCoordinate({ lat, lng }, tube.countryCode);
        return new TMap.LatLng(display.lat, display.lng, 0);
      });
      if (path.length < 2) return;
      data.push({
        path,
        radius: pipeRadius.value,
        styleId: tube.status === 0 ? "formal-disabled" : "formal-enabled",
        properties: {
          key: `${tube.id}:${partIndex}`,
          tubeId: tube.id,
          partIndex,
          tubeName: tube.tubeName,
          countryCode: tube.countryCode,
          coordinateSystem: tube.coordinateSystem,
          material: tube.material,
          diameterMm: tube.diameterMm,
          shapeLengthM: tube.shapeLengthM,
          status: tube.status,
          gisSource: tube.gisSource,
          gisSourceId: tube.gisSourceId,
        },
      });
    });
  });
  formalPipeLayer.setData(data);

  // 验收诊断钩子：正式管线原始数据 + 地图实例，供联调取证（控制台读取
  // window.__w84FormalTubesDebug，比对 getCenter() 与 API 原值，验证 MY 未做 GCJ02 偏移）
  if (typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>).__w84FormalTubesDebug = {
      tubes: props.formalTubes,
      map: props.mapInstance,
      sampleFirstPoint: props.formalTubes[0]?.lineCoords?.[0]?.[0] ?? null,
    };
  }
}

function toggleFormalVisible() {
  formalVisible.value = !formalVisible.value;
  applyLayerVisibility();
}

/** 正式管线定位：边界计算与折线绘制使用同一坐标策略（同国家、同转换）。 */
function focusFormalTubes() {
  const TMap = getTMap();
  if (!props.mapInstance || !TMap?.LatLngBounds) return;
  const bounds = new TMap.LatLngBounds();
  let extended = false;
  props.formalTubes.forEach((tube) => {
    (tube.lineCoords ?? []).forEach((part) => {
      part.forEach(([lng, lat]) => {
        const display = tencentDisplayCoordinate({ lat, lng }, tube.countryCode);
        bounds.extend?.(new TMap.LatLng(display.lat, display.lng));
        extended = true;
      });
    });
  });
  if (extended) {
    props.mapInstance.fitBounds?.(bounds, { padding: 80 });
  }
}

function applyLayerVisibility() {
  const layers = [pipeLayer, draftPipeLayer];
  layers.forEach((layer) => {
    if (!layer) return;
    if (visible.value) {
      layer.show?.();
    } else {
      layer.hide?.();
    }
  });

  if (!visible.value) {
    junctionLayer?.setMap?.(null);
  } else if (props.mapInstance) {
    junctionLayer?.setMap?.(props.mapInstance);
  }
  if (gisVisible.value) {
    gisPipeLayer?.show?.();
    gisPointLayer?.setMap?.(props.mapInstance || null);
  } else {
    gisPipeLayer?.hide?.();
    gisPointLayer?.setMap?.(null);
  }
  if (formalVisible.value) {
    formalPipeLayer?.show?.();
  } else {
    formalPipeLayer?.hide?.();
  }
}

function destroyPipeLayer(layer: TencentPipeLayer | null) {
  if (!layer) return;
  layer.setData?.([]);
  layer.remove?.();
  layer.destroy?.();
}

function toTencentPipeData(source: DemoPipe[]): TencentPipeData[] {
  return source.map((pipe) => ({
    path: toTencentPath(pipe.path, pipe.coordinateSystem || "WGS84"),
    radius: pipeRadius.value,
    styleId: pipe.styleId,
    properties: {
      pipeId: pipe.id,
      name: pipe.name,
      riskLevel: pipe.riskLevel,
      deviceNumbers: pipe.deviceNumbers,
      connectedJunctionIds: pipe.connectedJunctionIds,
    },
  }));
}

function toTencentPath(path: MapCoordinate[], source: "WGS84" | "GCJ02" = "WGS84") {
  const TMap = getTMap();
  if (!TMap) return [];
  return path.map((coordinate) => {
    const converted = convertMapCoordinate(coordinate, source, "GCJ02");
    return new TMap.LatLng(converted.lat, converted.lng, 0);
  });
}

function toTencentCoordinate(coordinate: MapCoordinate, source: "WGS84" | "GCJ02") {
  return convertMapCoordinate(coordinate, source, "GCJ02");
}

function createGisMarkerStyles(TMap: TencentPipeApi) {
  if (!TMap.MarkerStyle) return {};
  const styles: Record<string, unknown> = {};
  W84_LAYERS.filter((layer) => layer !== "pipes").forEach((layer) => {
    styles[`gis-${layer}`] = createGisMarkerStyle(TMap, W84_LAYER_COLORS[layer]);
  });
  styles["gis-crossing"] = createGisMarkerStyle(TMap, "#F97316", true);
  return styles;
}

function createGisMarkerStyle(TMap: TencentPipeApi, color: string, hollow = false) {
  if (!TMap.MarkerStyle) return {};
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext("2d");
  if (context) {
    context.beginPath();
    context.arc(16, 16, 7, 0, Math.PI * 2);
    context.fillStyle = hollow ? "#FFFFFF" : color;
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = color;
    context.stroke();
  }
  return new TMap.MarkerStyle({
    width: 32,
    height: 32,
    anchor: { x: 16, y: 16 },
    src: canvas.toDataURL("image/png"),
  });
}

function createJunctionStyles(TMap: TencentPipeApi) {
  if (!TMap.MarkerStyle) return {};
  return {
    "junction-connected": createJunctionStyle(TMap, "#16A34A", false, "连通"),
    "junction-separate": createJunctionStyle(TMap, "#F97316", true, "不连通"),
    "junction-pending": createJunctionStyle(TMap, "#64748B", false, "待确认"),
  };
}

function createJunctionStyle(
  TMap: TencentPipeApi,
  color: string,
  hollow: boolean,
  fallbackLabel: string,
) {
  const MarkerStyle = TMap.MarkerStyle;
  if (!MarkerStyle) return {};
  const size = 92;
  const canvas = document.createElement("canvas");
  canvas.width = size * 2;
  canvas.height = 28 * 2;
  const context = canvas.getContext("2d");
  if (context) {
    context.scale(2, 2);
    context.beginPath();
    context.arc(10, 14, 7, 0, Math.PI * 2);
    context.fillStyle = hollow ? "#FFFFFF" : color;
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = color;
    context.stroke();
    context.fillStyle = "#24364D";
    context.font = "800 11px sans-serif";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(fallbackLabel, 23, 14);
  }

  return new MarkerStyle({
    width: size,
    height: 28,
    anchor: { x: 10, y: 14 },
    src: canvas.toDataURL("image/png"),
  });
}

function readCoordinate(value?: TencentLatLngValue): MapCoordinate | null {
  const lat = value?.getLat?.() ?? value?.lat;
  const lng = value?.getLng?.() ?? value?.lng;
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }
  return { lat, lng };
}

function findNearestJunction(coordinate: MapCoordinate) {
  return junctions.value.reduce<DemoJunction | null>((nearest, junction) => {
    if (!nearest) return junction;
    const junctionCoordinate = toTencentCoordinate(
      junction.coordinate,
      junction.coordinateSystem || "WGS84",
    );
    const nearestCoordinate = toTencentCoordinate(
      nearest.coordinate,
      nearest.coordinateSystem || "WGS84",
    );
    return distanceMeters(coordinate, junctionCoordinate) <
      distanceMeters(coordinate, nearestCoordinate)
      ? junction
      : nearest;
  }, null);
}

function distanceMeters(first: MapCoordinate, second: MapCoordinate) {
  const latScale = 111_320;
  const lngScale = 111_320 * Math.max(0.2, Math.cos(first.lat * Math.PI / 180));
  return Math.sqrt(
    ((first.lat - second.lat) * latScale) ** 2 +
    ((first.lng - second.lng) * lngScale) ** 2,
  );
}

function detectCrossings(path: MapCoordinate[], existingPipes: DemoPipe[]) {
  const crossings: MapCoordinate[] = [];
  for (let index = 0; index < path.length - 1; index += 1) {
    for (const pipe of existingPipes) {
      const existingPath = pipe.path.map((coordinate) => toTencentCoordinate(
        coordinate,
        pipe.coordinateSystem || "WGS84",
      ));
      for (let pipeIndex = 0; pipeIndex < existingPath.length - 1; pipeIndex += 1) {
        const crossing = segmentIntersection(
          path[index],
          path[index + 1],
          existingPath[pipeIndex],
          existingPath[pipeIndex + 1],
        );
        if (crossing && !crossings.some((item) => distanceMeters(item, crossing) < 4)) {
          crossings.push(crossing);
        }
      }
    }
  }
  return crossings;
}

function segmentIntersection(
  firstStart: MapCoordinate,
  firstEnd: MapCoordinate,
  secondStart: MapCoordinate,
  secondEnd: MapCoordinate,
) {
  const denominator =
    (secondEnd.lng - secondStart.lng) * (firstEnd.lat - firstStart.lat) -
    (secondEnd.lat - secondStart.lat) * (firstEnd.lng - firstStart.lng);
  if (Math.abs(denominator) < 0.000000001) return null;

  const a =
    ((secondEnd.lat - secondStart.lat) * (firstStart.lng - secondStart.lng) -
      (secondEnd.lng - secondStart.lng) * (firstStart.lat - secondStart.lat)) /
    denominator;
  const b =
    ((firstEnd.lat - firstStart.lat) * (firstStart.lng - secondStart.lng) -
      (firstEnd.lng - firstStart.lng) * (firstStart.lat - secondStart.lat)) /
    denominator;

  if (a < 0 || a > 1 || b < 0 || b > 1) return null;
  return {
    lat: firstStart.lat + a * (firstEnd.lat - firstStart.lat),
    lng: firstStart.lng + a * (firstEnd.lng - firstStart.lng),
  };
}

function normalizeStyleId(value: unknown): DemoPipeStyleId {
  return value === "warning" || value === "danger" ? value : "normal";
}
</script>

<style scoped lang="scss">
.pipe-demo-layer {
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
}

.pipe-demo-collapsed {
  position: absolute;
  top: 88px;
  left: 18px;
  pointer-events: auto;
}

.pipe-demo-collapsed__button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 13px;
  color: #31506d;
  font-size: 12px;
  font-weight: 800;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid #cbd8e5;
  border-left: 4px solid #2f80ed;
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(15, 35, 55, 0.14);
}

.pipe-demo-collapsed__button::after {
  border: 0;
}

.pipe-demo-collapsed__icon {
  position: relative;
  display: block;
  width: 13px;
  height: 10px;
  border-top: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
}

.pipe-demo-collapsed__icon::after {
  position: absolute;
  top: 3px;
  left: 0;
  width: 13px;
  height: 2px;
  content: "";
  background: currentColor;
}

.pipe-demo-panel {
  position: absolute;
  top: 88px;
  left: 18px;
  width: 270px;
  max-height: calc(100% - 36px);
  padding: 13px;
  overflow-y: auto;
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid #cbd8e5;
  border-left: 4px solid #2f80ed;
  border-radius: 6px;
  box-shadow: 0 10px 26px rgba(15, 35, 55, 0.16);
}

.pipe-demo-panel__head,
.pipe-demo-panel__footer,
.pipe-demo-control,
.pipe-demo-control__label,
.pipe-demo-actions,
.pipe-demo-legend__item,
.pipe-demo-drawing__status {
  display: flex;
  align-items: center;
}

.pipe-demo-panel__head,
.pipe-demo-panel__footer,
.pipe-demo-control,
.pipe-demo-control__label {
  justify-content: space-between;
  gap: 10px;
}

.pipe-demo-panel__head > view:first-child {
  flex: 1;
  min-width: 0;
}

.pipe-demo-panel__title,
.pipe-demo-panel__subtitle {
  display: block;
}

.pipe-demo-panel__title {
  color: #172b3a;
  font-size: 14px;
  font-weight: 900;
}

.pipe-demo-panel__subtitle {
  margin-top: 3px;
  color: #718397;
  font-size: 11px;
}

.pipe-demo-icon-button,
.pipe-demo-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin: 0;
  color: #31506d;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}
.pipe-demo-button--wide { width: 100%; margin-top: 8px; }
.pipe-demo-mini-button { margin: 0; padding: 2px 7px; color: #2f80ed; font-size: 10px; line-height: 20px; background: #eef6ff; border: 1px solid #cfe3ff; border-radius: 4px; }
.pipe-demo-mini-button::after { border: 0; }

.pipe-demo-icon-button {
  width: 30px;
  height: 30px;
  padding: 0;
}

.pipe-demo-icon-button::after,
.pipe-demo-button::after {
  border: 0;
}

.pipe-demo-icon-button--collapse {
  color: #64748b;
}

.pipe-demo-chevron {
  display: block;
  width: 8px;
  height: 8px;
  border-top: 2px solid currentColor;
  border-left: 2px solid currentColor;
  transform: rotate(45deg) translate(1px, 1px);
}

.pipe-demo-eye {
  position: relative;
  width: 15px;
  height: 10px;
  border: 2px solid currentColor;
  border-radius: 3px;
}

.pipe-demo-eye::after {
  position: absolute;
  top: 3px;
  right: -4px;
  width: 5px;
  height: 2px;
  content: "";
  background: currentColor;
  transform: rotate(45deg);
}

.pipe-demo-eye--off {
  opacity: 0.42;
}

.pipe-demo-control {
  margin-top: 12px;
  padding-top: 11px;
  border-top: 1px solid #edf2f7;
}

.pipe-demo-control--column {
  display: block;
}

.pipe-demo-control__label {
  color: #3d536b;
  font-size: 12px;
  font-weight: 800;
}

.pipe-demo-control__value {
  color: #2f80ed;
  font-size: 11px;
}

.pipe-demo-switch {
  position: relative;
  width: 34px;
  height: 19px;
  margin-top: 1px;
  background: #cbd5e1;
  border-radius: 12px;
  cursor: pointer;
}

.pipe-demo-switch--on {
  background: #2f80ed;
}

.pipe-demo-switch__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 13px;
  height: 13px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.25);
  transition: transform 160ms ease;
}

.pipe-demo-switch--on .pipe-demo-switch__thumb {
  transform: translateX(15px);
}

.pipe-demo-slider {
  width: 100%;
  margin-top: 3px;
}

.pipe-demo-actions {
  gap: 7px;
  margin-top: 12px;
}

.pipe-demo-actions--drawing {
  margin-top: 7px;
}

.pipe-demo-button {
  flex: 1;
  min-width: 0;
  height: 30px;
  padding: 0 7px;
  font-size: 11px;
  font-weight: 800;
  line-height: 28px;
}

.pipe-demo-button--primary {
  color: #fff;
  background: #2f80ed;
  border-color: #2f80ed;
}

.pipe-demo-button--connect {
  color: #fff;
  background: #16a34a;
  border-color: #16a34a;
}

.pipe-demo-button--separate {
  color: #9a3412;
  background: #fff7ed;
  border-color: #fdba74;
}

.pipe-demo-button[disabled] {
  opacity: 0.45;
}

.pipe-demo-button__plus {
  font-size: 17px;
  line-height: 1;
}

.pipe-demo-button__refresh {
  position: relative;
  display: block;
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
}

.pipe-demo-button__refresh::after {
  position: absolute;
  right: -3px;
  bottom: -1px;
  width: 0;
  height: 0;
  content: "";
  border-top: 4px solid currentColor;
  border-left: 4px solid transparent;
}

.pipe-demo-drawing {
  margin-top: 12px;
  padding: 10px;
  background: #f5f9ff;
  border: 1px solid #cfe3ff;
  border-radius: 5px;
}
.pipe-demo-gis { margin-top: 12px; padding-top: 11px; border-top: 1px solid #edf2f7; }
.pipe-demo-gis__layers { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; }
.pipe-demo-layer-toggle { display: flex; align-items: center; gap: 6px; min-width: 0; padding: 5px 6px; overflow: hidden; color: #64748b; font-size: 10px; text-align: left; white-space: nowrap; text-overflow: ellipsis; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; }
.pipe-demo-layer-toggle::after { border: 0; }
.pipe-demo-layer-toggle--active { color: #1e293b; background: #ffffff; border-color: #bfd5e9; }
.pipe-demo-layer-toggle__dot { display: block; flex: 0 0 auto; width: 8px; height: 8px; border-radius: 50%; }
.pipe-demo-gis__meta { display: block; margin-top: 7px; color: #718397; font-size: 10px; line-height: 1.4; }

.pipe-demo-drawing__status {
  gap: 7px;
  color: #1d66c2;
  font-size: 11px;
  font-weight: 800;
}

.pipe-demo-drawing__dot {
  display: block;
  width: 8px;
  height: 8px;
  background: #2f80ed;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(47, 128, 237, 0.15);
}

.pipe-demo-snap {
  margin-top: 9px;
  padding: 8px;
  background: #fff;
  border: 1px solid #d9e5f0;
  border-radius: 4px;
}

.pipe-demo-snap__title,
.pipe-demo-snap__text {
  display: block;
}

.pipe-demo-snap__title {
  color: #172b3a;
  font-size: 11px;
  font-weight: 900;
}

.pipe-demo-snap__text {
  margin-top: 4px;
  color: #718397;
  font-size: 10px;
  line-height: 1.4;
}

.pipe-demo-snap__actions {
  display: flex;
  gap: 6px;
  margin-top: 7px;
}

.pipe-demo-legend {
  display: grid;
  gap: 7px;
  margin-top: 12px;
  padding: 10px 0 2px;
  border-top: 1px solid #edf2f7;
}

.pipe-demo-legend__title {
  color: #52677d;
  font-size: 11px;
  font-weight: 900;
}

.pipe-demo-legend__item {
  gap: 8px;
  color: #52677d;
  font-size: 11px;
}

.pipe-demo-legend__line {
  display: block;
  width: 25px;
  height: 4px;
  border-radius: 2px;
}

.pipe-demo-legend__line--normal {
  background: #2f80ed;
}

.pipe-demo-legend__line--warning {
  background: #f59e0b;
}

.pipe-demo-legend__line--danger {
  background: #ef4444;
}

.pipe-demo-legend__node {
  display: block;
  width: 11px;
  height: 11px;
  border: 3px solid #16a34a;
  border-radius: 50%;
}

.pipe-demo-legend__node--connected {
  background: #16a34a;
}

.pipe-demo-legend__node--separate {
  border-color: #f97316;
}

.pipe-demo-panel__footer {
  margin-top: 10px;
  color: #718397;
  font-size: 10px;
}

.pipe-demo-error {
  position: absolute;
  top: 18px;
  left: 310px;
  max-width: 300px;
  padding: 9px 12px;
  color: #b42318;
  font-size: 12px;
  line-height: 1.4;
  pointer-events: auto;
  background: #fff1ee;
  border: 1px solid #ffd3cb;
  border-radius: 4px;
}

@media (max-width: 900px) {
  .pipe-demo-collapsed {
    top: 68px;
    left: 10px;
  }

  .pipe-demo-panel {
    top: 68px;
    left: 10px;
    width: min(270px, calc(100vw - 20px));
    max-height: 48%;
  }

  .pipe-demo-error {
    top: auto;
    bottom: 12px;
    left: 10px;
  }
}
</style>
