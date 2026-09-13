<template>
  <view class="pipe-demo-layer">
    <view class="pipe-demo-panel" @click.stop>
      <view class="pipe-demo-panel__head">
        <view>
          <text class="pipe-demo-panel__title">管线演示</text>
          <text class="pipe-demo-panel__subtitle">
            {{ drawing ? "绘制模式：点击地图添加节点" : "Google Maps mock 图层" }}
          </text>
        </view>
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

      <view v-if="drawing" class="pipe-demo-drawing">
        <view class="pipe-demo-drawing__status">
          <text class="pipe-demo-drawing__dot"></text>
          <text>正在绘制，已添加 {{ draftPoints.length }} 个节点</text>
        </view>
        <view v-if="snapCandidate" class="pipe-demo-snap">
          <text class="pipe-demo-snap__title">检测到附近节点</text>
          <text class="pipe-demo-snap__text">
            是否与“{{ snapCandidate.junction.label }}”连通？
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
          <button class="pipe-demo-button" type="button" :disabled="!draftPoints.length && !snapCandidate" @click="undoLast">
            撤销节点
          </button>
          <button class="pipe-demo-button" type="button" :disabled="!draftPoints.length && !snapCandidate" @click="clearDraft">
            清空草稿
          </button>
        </view>
        <view class="pipe-demo-actions pipe-demo-actions--drawing">
          <button class="pipe-demo-button pipe-demo-button--primary" type="button" :disabled="draftPoints.length < 2 || Boolean(snapCandidate)" @click="completeDrawing">
            完成管线
          </button>
          <button class="pipe-demo-button" type="button" @click="cancelDrawing">取消绘制</button>
        </view>
      </view>

      <view class="pipe-demo-legend">
        <view class="pipe-demo-legend__title">演示图例</view>
        <view class="pipe-demo-legend__item">
          <text class="pipe-demo-legend__line pipe-demo-legend__line--normal"></text><text>正常管线</text>
        </view>
        <view class="pipe-demo-legend__item">
          <text class="pipe-demo-legend__line pipe-demo-legend__line--warning"></text><text>关注管线</text>
        </view>
        <view class="pipe-demo-legend__item">
          <text class="pipe-demo-legend__line pipe-demo-legend__line--danger"></text><text>高风险示例</text>
        </view>
        <view class="pipe-demo-legend__item">
          <text class="pipe-demo-legend__node pipe-demo-legend__node--connected"></text><text>连通节点</text>
        </view>
        <view class="pipe-demo-legend__item">
          <text class="pipe-demo-legend__node pipe-demo-legend__node--separate"></text><text>不连通交叉</text>
        </view>
      </view>
      <view class="pipe-demo-panel__footer">
        <text>{{ pipes.length }} 条示例管线 · {{ junctions.length }} 个节点</text>
      </view>
    </view>
    <view v-if="errorMessage" class="pipe-demo-error" @click.stop>{{ errorMessage }}</view>
  </view>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { MapCoordinate, MapDevicePoint } from "../types";
import {
  createDemoPipeNetwork,
  type DemoJunction,
  type DemoPipe,
  type DemoPipeStyleId,
} from "./pipe-demo-data";
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

const props = withDefaults(defineProps<{
  mapInstance?: google.maps.Map | null;
  points?: MapDevicePoint[];
}>(), {
  mapInstance: null,
  points: () => [],
});

const visible = ref(true);
const drawing = ref(false);
const pipeRadius = ref(4);
const pipes = ref<DemoPipe[]>([]);
const junctions = ref<DemoJunction[]>([]);
const draftPoints = ref<DraftPoint[]>([]);
const snapCandidate = ref<SnapCandidate | null>(null);
const errorMessage = ref("");
const gisVisible = ref(true);
const gisLayerVisible = ref<Record<W84LayerKey, boolean>>({
  pipes: true,
  hydrants: true,
  pumps: true,
  valves: true,
});

const COLORS: Record<DemoPipeStyleId, string> = {
  normal: "#2F80ED",
  warning: "#F59E0B",
  danger: "#EF4444",
};
const W84_LAYERS = Object.keys(W84_LAYER_LABELS) as W84LayerKey[];
const SNAP_DISTANCE_METERS = 42;

let finalLines: google.maps.Polyline[] = [];
let draftLine: google.maps.Polyline | null = null;
let junctionMarkers: google.maps.Marker[] = [];
let mapClickListener: google.maps.MapsEventListener | null = null;
let gisPipeLines: google.maps.Polyline[] = [];
let gisPointMarkers: google.maps.Marker[] = [];
let gisCrossingMarkers: google.maps.Marker[] = [];

onMounted(() => {
  regenerate();
  syncMap();
});

onBeforeUnmount(() => {
  stopMapClickListener();
  clearOverlays();
});

watch(() => props.mapInstance, () => {
  stopMapClickListener();
  clearOverlays();
  syncMap();
});

watch(() => props.points, () => {
  if (!drawing.value) {
    regenerate();
    renderAll();
  }
}, { deep: true });

function toggleVisible() {
  visible.value = !visible.value;
  applyVisibility();
}

function toggleGisVisible() {
  gisVisible.value = !gisVisible.value;
  applyGisVisibility();
}

function toggleGisLayer(layer: W84LayerKey) {
  gisLayerVisible.value[layer] = !gisLayerVisible.value[layer];
  renderGisLayers();
}

function focusGisLayer() {
  if (!props.mapInstance) return;
  const bounds = w84Bounds();
  if (!bounds) return;
  const mapBounds = new google.maps.LatLngBounds(
    { lat: bounds.south, lng: bounds.west },
    { lat: bounds.north, lng: bounds.east },
  );
  props.mapInstance.fitBounds(mapBounds, 80);
}

function handleRadiusChange(event: { detail?: { value?: number | string } }) {
  const value = Number(event.detail?.value);
  if (!Number.isFinite(value)) return;
  pipeRadius.value = Math.min(10, Math.max(1, Math.round(value)));
  renderAll();
}

function startDrawing() {
  drawing.value = true;
  draftPoints.value = [];
  snapCandidate.value = null;
  errorMessage.value = "";
  startMapClickListener();
  renderAll();
}

function cancelDrawing() {
  drawing.value = false;
  draftPoints.value = [];
  snapCandidate.value = null;
  stopMapClickListener();
  renderAll();
}

function clearDraft() {
  draftPoints.value = [];
  snapCandidate.value = null;
  renderAll();
}

function undoLast() {
  if (snapCandidate.value) {
    snapCandidate.value = null;
  } else {
    draftPoints.value = draftPoints.value.slice(0, -1);
  }
  renderAll();
}

function confirmSnap() {
  if (!snapCandidate.value) return;
  addDraftPoint(snapCandidate.value.coordinate, snapCandidate.value.junction.id);
  snapCandidate.value = null;
  renderAll();
}

function keepSeparate() {
  if (!snapCandidate.value) return;
  addDraftPoint(snapCandidate.value.coordinate);
  snapCandidate.value = null;
  renderAll();
}

function addDraftPoint(coordinate: MapCoordinate, junctionId?: string) {
  draftPoints.value = [...draftPoints.value, { coordinate, junctionId }];
}

function completeDrawing() {
  if (draftPoints.value.length < 2 || snapCandidate.value) return;
  const start = ensureJunction(draftPoints.value[0], "绘制起点");
  const end = ensureJunction(draftPoints.value[draftPoints.value.length - 1], "绘制终点");
  pipes.value = [
    ...pipes.value,
    {
      id: `google-draw-${Date.now()}`,
      name: "手绘演示管线",
      path: draftPoints.value.map((item) => item.coordinate),
      radius: pipeRadius.value,
      styleId: "warning",
      riskLevel: "medium",
      deviceNumbers: [],
      connectedJunctionIds: [start.id, end.id],
    },
  ];
  drawing.value = false;
  draftPoints.value = [];
  stopMapClickListener();
  renderAll();
}

function ensureJunction(point: DraftPoint, label: string) {
  if (point.junctionId) {
    return junctions.value.find((item) => item.id === point.junctionId) || {
      id: point.junctionId,
      coordinate: point.coordinate,
      type: "endpoint" as const,
      connected: true,
      label,
    };
  }
  const junction: DemoJunction = {
    id: `google-junction-${Date.now()}-${junctions.value.length}`,
    coordinate: point.coordinate,
    type: "endpoint",
    connected: false,
    label,
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
  renderAll();
}

function syncMap() {
  if (!props.mapInstance) return;
  errorMessage.value = "";
  renderAll();
  if (drawing.value) startMapClickListener();
}

function startMapClickListener() {
  if (!drawing.value || !props.mapInstance || mapClickListener) return;
  mapClickListener = props.mapInstance.addListener("click", handleMapClick);
}

function stopMapClickListener() {
  mapClickListener?.remove();
  mapClickListener = null;
}

function handleMapClick(event: google.maps.MapMouseEvent) {
  if (!drawing.value || snapCandidate.value || !event.latLng) return;
  const coordinate = { lat: event.latLng.lat(), lng: event.latLng.lng() };
  const nearest = findNearestJunction(coordinate);
  if (nearest && distanceMeters(coordinate, nearest.coordinate) <= SNAP_DISTANCE_METERS) {
    snapCandidate.value = { coordinate: nearest.coordinate, junction: nearest };
  } else {
    addDraftPoint(coordinate);
  }
  renderAll();
}

function renderAll() {
  if (!props.mapInstance) return;
  renderFinalLines();
  renderDraftLine();
  renderJunctionMarkers();
  applyVisibility();
  renderGisLayers();
}

function renderFinalLines() {
  finalLines.forEach((line) => line.setMap(null));
  finalLines = pipes.value.map((pipe) => new google.maps.Polyline({
    map: props.mapInstance,
    path: pipe.path.map((point) => ({ lat: point.lat, lng: point.lng })),
    strokeColor: COLORS[pipe.styleId],
    strokeOpacity: 0.95,
    strokeWeight: lineWeight(),
    clickable: false,
    zIndex: 2,
  }));
}

function renderDraftLine() {
  if (draftLine) draftLine.setMap(null);
  if (draftPoints.value.length < 2) {
    draftLine = null;
    return;
  }
  draftLine = new google.maps.Polyline({
    map: props.mapInstance,
    path: draftPoints.value.map((point) => ({ lat: point.coordinate.lat, lng: point.coordinate.lng })),
    strokeColor: "#64748B",
    strokeOpacity: 0.85,
    strokeWeight: lineWeight(),
    clickable: false,
    zIndex: 4,
  });
}

function renderJunctionMarkers() {
  junctionMarkers.forEach((marker) => marker.setMap(null));
  junctionMarkers = junctions.value.map((junction) => new google.maps.Marker({
    map: props.mapInstance,
    position: junction.coordinate,
    title: junction.label,
    label: {
      text: junction.label,
      color: "#24364D",
      fontSize: "10px",
      fontWeight: "700",
    },
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 6,
      fillColor: junction.connected ? "#16A34A" : "#FFFFFF",
      fillOpacity: 1,
      strokeColor: junction.connected ? "#16A34A" : "#F97316",
      strokeWeight: 3,
    },
    zIndex: 5,
  }));

  if (snapCandidate.value) {
    junctionMarkers.push(new google.maps.Marker({
      map: props.mapInstance,
      position: snapCandidate.value.coordinate,
      title: "待确认",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: "#64748B",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2,
      },
      zIndex: 6,
    }));
  }

  draftPoints.value.forEach((point) => {
    junctionMarkers.push(new google.maps.Marker({
      map: props.mapInstance,
      position: point.coordinate,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 5,
        fillColor: point.junctionId ? "#16A34A" : "#64748B",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2,
      },
      zIndex: 6,
    }));
  });
}

function applyVisibility() {
  finalLines.forEach((line) => line.setVisible(visible.value));
  draftLine?.setVisible(visible.value);
  junctionMarkers.forEach((marker) => marker.setVisible(visible.value));
}

function renderGisLayers() {
  clearGisOverlays();
  if (!props.mapInstance) return;

  if (gisLayerVisible.value.pipes) {
    W84_NETWORK_DATA.layers.pipes.features.forEach((feature) => {
      featurePaths(feature).forEach((path) => {
        const line = new google.maps.Polyline({
          map: props.mapInstance,
          path: path.map(([lng, lat]) => ({ lat, lng })),
          strokeColor: W84_LAYER_COLORS.pipes,
          strokeOpacity: 0.78,
          strokeWeight: Math.max(2, Math.round(lineWeight() * 0.8)),
          clickable: false,
          zIndex: 1,
        });
        gisPipeLines.push(line);
      });
    });
  }

  (Object.keys(W84_LAYER_LABELS) as W84LayerKey[])
    .filter((layer) => layer !== "pipes" && gisLayerVisible.value[layer])
    .forEach((layer) => {
      W84_NETWORK_DATA.layers[layer].features.forEach((feature) => {
        const point = featurePoint(feature);
        if (!point) return;
        gisPointMarkers.push(new google.maps.Marker({
          map: props.mapInstance,
          position: point,
          title: W84_LAYER_LABELS[layer],
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5,
            fillColor: W84_LAYER_COLORS[layer],
            fillOpacity: 0.92,
            strokeColor: "#FFFFFF",
            strokeWeight: 1.5,
          },
          zIndex: 1,
        }));
      });
    });

  W84_NETWORK_DATA.crossings.forEach((crossing) => {
    gisCrossingMarkers.push(new google.maps.Marker({
      map: props.mapInstance,
      position: { lng: crossing.coordinate[0], lat: crossing.coordinate[1] },
      title: crossing.label,
      label: { text: "不连通", color: "#9A3412", fontSize: "10px", fontWeight: "700" },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: "#FFFFFF",
        fillOpacity: 1,
        strokeColor: "#F97316",
        strokeWeight: 3,
      },
      zIndex: 3,
    }));
  });
  applyGisVisibility();
}

function applyGisVisibility() {
  const visible = gisVisible.value;
  gisPipeLines.forEach((line) => line.setVisible(visible && gisLayerVisible.value.pipes));
  gisPointMarkers.forEach((marker) => marker.setVisible(visible));
  gisCrossingMarkers.forEach((marker) => marker.setVisible(visible));
}

function clearGisOverlays() {
  gisPipeLines.forEach((line) => line.setMap(null));
  gisPointMarkers.forEach((marker) => marker.setMap(null));
  gisCrossingMarkers.forEach((marker) => marker.setMap(null));
  gisPipeLines = [];
  gisPointMarkers = [];
  gisCrossingMarkers = [];
}

function clearOverlays() {
  finalLines.forEach((line) => line.setMap(null));
  draftLine?.setMap(null);
  junctionMarkers.forEach((marker) => marker.setMap(null));
  finalLines = [];
  draftLine = null;
  junctionMarkers = [];
  clearGisOverlays();
}

function lineWeight() {
  return Math.max(2, Math.round(pipeRadius.value * 1.2));
}

function findNearestJunction(coordinate: MapCoordinate) {
  return junctions.value.reduce<DemoJunction | null>((nearest, junction) => {
    if (!nearest) return junction;
    return distanceMeters(coordinate, junction.coordinate) < distanceMeters(coordinate, nearest.coordinate)
      ? junction
      : nearest;
  }, null);
}

function distanceMeters(first: MapCoordinate, second: MapCoordinate) {
  const latScale = 111_320;
  const lngScale = 111_320 * Math.max(0.2, Math.cos(first.lat * Math.PI / 180));
  return Math.sqrt(((first.lat - second.lat) * latScale) ** 2 + ((first.lng - second.lng) * lngScale) ** 2);
}

</script>

<style scoped lang="scss">
.pipe-demo-layer { position: absolute; inset: 0; z-index: 6; pointer-events: none; }
.pipe-demo-panel { position: absolute; top: 88px; left: 18px; width: 270px; max-height: calc(100% - 106px); padding: 13px; overflow-y: auto; pointer-events: auto; background: rgba(255,255,255,.97); border: 1px solid #cbd8e5; border-left: 4px solid #2f80ed; border-radius: 6px; box-shadow: 0 10px 26px rgba(15,35,55,.16); }
.pipe-demo-panel__head,.pipe-demo-panel__footer,.pipe-demo-control,.pipe-demo-control__label,.pipe-demo-actions,.pipe-demo-legend__item,.pipe-demo-drawing__status { display: flex; align-items: center; }
.pipe-demo-panel__head,.pipe-demo-panel__footer,.pipe-demo-control,.pipe-demo-control__label { justify-content: space-between; gap: 10px; }
.pipe-demo-panel__title,.pipe-demo-panel__subtitle { display: block; }
.pipe-demo-panel__title { color: #172b3a; font-size: 14px; font-weight: 900; }
.pipe-demo-panel__subtitle { margin-top: 3px; color: #718397; font-size: 11px; }
.pipe-demo-icon-button,.pipe-demo-button { display: inline-flex; align-items: center; justify-content: center; gap: 5px; margin: 0; color: #31506d; background: #f6fbff; border: 1px solid #cbdced; border-radius: 4px; }
.pipe-demo-icon-button { width: 30px; height: 30px; padding: 0; }
.pipe-demo-icon-button::after,.pipe-demo-button::after { border: 0; }
.pipe-demo-eye { position: relative; width: 15px; height: 10px; border: 2px solid currentColor; border-radius: 3px; }
.pipe-demo-eye::after { position: absolute; top: 3px; right: -4px; width: 5px; height: 2px; content: ""; background: currentColor; transform: rotate(45deg); }
.pipe-demo-eye--off { opacity: .42; }
.pipe-demo-control { margin-top: 12px; padding-top: 11px; border-top: 1px solid #edf2f7; }
.pipe-demo-control--column { display: block; }
.pipe-demo-control__label { color: #3d536b; font-size: 12px; font-weight: 800; }
.pipe-demo-control__value { color: #2f80ed; font-size: 11px; }
.pipe-demo-switch { position: relative; width: 34px; height: 19px; margin-top: 1px; background: #cbd5e1; border-radius: 12px; cursor: pointer; }
.pipe-demo-switch--on { background: #2f80ed; }
.pipe-demo-switch__thumb { position: absolute; top: 3px; left: 3px; width: 13px; height: 13px; background: #fff; border-radius: 50%; box-shadow: 0 1px 3px rgba(15,23,42,.25); transition: transform 160ms ease; }
.pipe-demo-switch--on .pipe-demo-switch__thumb { transform: translateX(15px); }
.pipe-demo-slider { width: 100%; margin-top: 3px; }
.pipe-demo-actions { gap: 7px; margin-top: 12px; }
.pipe-demo-actions--drawing { margin-top: 7px; }
.pipe-demo-button { flex: 1; min-width: 0; height: 30px; padding: 0 7px; font-size: 11px; font-weight: 800; line-height: 28px; }
.pipe-demo-button--wide { width: 100%; margin-top: 8px; }
.pipe-demo-mini-button { margin: 0; padding: 2px 7px; color: #2f80ed; font-size: 10px; line-height: 20px; background: #eef6ff; border: 1px solid #cfe3ff; border-radius: 4px; }
.pipe-demo-mini-button::after { border: 0; }
.pipe-demo-button--primary { color: #fff; background: #2f80ed; border-color: #2f80ed; }
.pipe-demo-button--connect { color: #fff; background: #16a34a; border-color: #16a34a; }
.pipe-demo-button--separate { color: #9a3412; background: #fff7ed; border-color: #fdba74; }
.pipe-demo-button[disabled] { opacity: .45; }
.pipe-demo-button__plus { font-size: 17px; line-height: 1; }
.pipe-demo-button__refresh { position: relative; display: block; width: 12px; height: 12px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; }
.pipe-demo-button__refresh::after { position: absolute; right: -3px; bottom: -1px; width: 0; height: 0; content: ""; border-top: 4px solid currentColor; border-left: 4px solid transparent; }
.pipe-demo-drawing { margin-top: 12px; padding: 10px; background: #f5f9ff; border: 1px solid #cfe3ff; border-radius: 5px; }
.pipe-demo-gis { margin-top: 12px; padding-top: 11px; border-top: 1px solid #edf2f7; }
.pipe-demo-gis__layers { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; }
.pipe-demo-layer-toggle { display: flex; align-items: center; gap: 6px; min-width: 0; padding: 5px 6px; overflow: hidden; color: #64748b; font-size: 10px; text-align: left; white-space: nowrap; text-overflow: ellipsis; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; }
.pipe-demo-layer-toggle::after { border: 0; }
.pipe-demo-layer-toggle--active { color: #1e293b; background: #ffffff; border-color: #bfd5e9; }
.pipe-demo-layer-toggle__dot { display: block; flex: 0 0 auto; width: 8px; height: 8px; border-radius: 50%; }
.pipe-demo-gis__meta { display: block; margin-top: 7px; color: #718397; font-size: 10px; line-height: 1.4; }
.pipe-demo-drawing__status { gap: 7px; color: #1d66c2; font-size: 11px; font-weight: 800; }
.pipe-demo-drawing__dot { display: block; width: 8px; height: 8px; background: #2f80ed; border-radius: 50%; box-shadow: 0 0 0 4px rgba(47,128,237,.15); }
.pipe-demo-snap { margin-top: 9px; padding: 8px; background: #fff; border: 1px solid #d9e5f0; border-radius: 4px; }
.pipe-demo-snap__title,.pipe-demo-snap__text { display: block; }
.pipe-demo-snap__title { color: #172b3a; font-size: 11px; font-weight: 900; }
.pipe-demo-snap__text { margin-top: 4px; color: #718397; font-size: 10px; line-height: 1.4; }
.pipe-demo-snap__actions { display: flex; gap: 6px; margin-top: 7px; }
.pipe-demo-legend { display: grid; gap: 7px; margin-top: 12px; padding: 10px 0 2px; border-top: 1px solid #edf2f7; }
.pipe-demo-legend__title { color: #52677d; font-size: 11px; font-weight: 900; }
.pipe-demo-legend__item { gap: 8px; color: #52677d; font-size: 11px; }
.pipe-demo-legend__line { display: block; width: 25px; height: 4px; border-radius: 2px; }
.pipe-demo-legend__line--normal { background: #2f80ed; }.pipe-demo-legend__line--warning { background: #f59e0b; }.pipe-demo-legend__line--danger { background: #ef4444; }
.pipe-demo-legend__node { display: block; width: 11px; height: 11px; border: 3px solid #16a34a; border-radius: 50%; }.pipe-demo-legend__node--connected { background: #16a34a; }.pipe-demo-legend__node--separate { border-color: #f97316; }
.pipe-demo-panel__footer { margin-top: 10px; color: #718397; font-size: 10px; }
.pipe-demo-error { position: absolute; top: 18px; left: 310px; max-width: 300px; padding: 9px 12px; color: #b42318; font-size: 12px; line-height: 1.4; pointer-events: auto; background: #fff1ee; border: 1px solid #ffd3cb; border-radius: 4px; }
@media (max-width: 900px) { .pipe-demo-panel { top: 68px; left: 10px; width: min(270px, calc(100vw - 20px)); max-height: 42%; } .pipe-demo-error { top: auto; bottom: 12px; left: 10px; } }
</style>
