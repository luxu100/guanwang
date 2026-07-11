<template>
  <view v-if="modelValue" class="map-dialog-mask" @click="close">
    <view class="map-dialog" @click.stop>
      <view class="map-dialog__header">
        <text class="map-dialog__title">位置信息</text>
        <text class="map-dialog__coord">{{ displayCoord }}</text>
        <button class="map-dialog__close" @click="close">✕</button>
      </view>
      <view class="map-dialog__body">
        <!-- #ifdef H5 -->
        <div ref="mapContainerRef" class="map-dialog__canvas"></div>
        <view v-if="mapError" class="map-dialog__error">{{ mapError }}</view>
        <view v-else-if="parsedCoord" class="map-dialog__marker-info">📍 当前位置</view>
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <view class="map-dialog__error">当前地图 SDK 仅支持 H5 端展示</view>
        <!-- #endif -->
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

// ===== 腾讯地图常量 =====
const TENCENT_MAP_KEY = "JCDBZ-Z2HLI-V26GX-UL7VO-LJFO2-TIFMZ";
const TENCENT_MAP_SCRIPT_ID = "tencent-map-gl-sdk";
const TENCENT_MAP_SCRIPT_URL = `https://map.qq.com/api/gljs?v=1.exp&key=${TENCENT_MAP_KEY}`;

// ===== 最小类型声明 =====
interface TencentMapInstance {
  destroy?: () => void;
  resize?: () => void;
}

interface TencentMapApi {
  LatLng: { new (lat: number, lng: number): unknown };
  Map: { new (container: HTMLElement, options: { center: unknown; zoom: number; pitch: number; rotation: number }): TencentMapInstance };
  MultiMarker: { new (options: { map: TencentMapInstance; geometries: Array<{ id: string; position: unknown }> }): unknown };
}

declare global {
  interface Window {
    TMap?: TencentMapApi;
  }
}

// ===== Props & Emits =====
const props = withDefaults(defineProps<{
  modelValue: boolean;
  location: string;
}>(), {
  modelValue: false,
  location: "",
});

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();

// ===== State =====
const mapContainerRef = ref<HTMLElement | null>(null);
const mapError = ref("");
let mapInstance: TencentMapInstance | null = null;
let sdkLoadingPromise: Promise<void> | null = null;
let resizeObserver: ResizeObserver | null = null;
let resizeTimer: ReturnType<typeof window.setTimeout> | null = null;
let resizeFrame: number | null = null;

const displayCoord = computed(() => {
  return props.location || "";
});

const parsedCoord = computed(() => {
  if (!props.location) return null;
  const parts = props.location.split(",").map(Number);
  const lng = parts[0];
  const lat = parts[1];
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lng, lat };
});

// ===== 监听 visible 变化 =====
watch(() => props.modelValue, (visible) => {
  if (visible) {
    // #ifdef H5
    if (!parsedCoord.value) {
      mapError.value = "坐标数据无效";
      return;
    }
    nextTick(() => {
      loadTencentMap()
        .then(initMap)
        .catch(() => {
          mapError.value = "腾讯地图加载失败，请检查 Key 的 Web 端域名白名单";
        });
    });
    // #endif
  } else {
    destroyMap();
  }
});

onBeforeUnmount(() => {
  destroyMap();
});

// ===== SDK 加载 =====
function loadTencentMap() {
  if (window.TMap) return Promise.resolve();
  if (sdkLoadingPromise) return sdkLoadingPromise;

  sdkLoadingPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(TENCENT_MAP_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existingScript || document.createElement("script");

    script.id = TENCENT_MAP_SCRIPT_ID;
    script.charset = "utf-8";
    script.src = TENCENT_MAP_SCRIPT_URL;
    script.onload = () => {
      if (window.TMap) resolve();
      else reject(new Error("Tencent map SDK is unavailable after script loaded"));
    };
    script.onerror = () => reject(new Error("Tencent map SDK script failed to load"));

    if (!existingScript) document.body.appendChild(script);
  });

  return sdkLoadingPromise;
}

// ===== 地图初始化 =====
function initMap() {
  mapError.value = "";

  const coord = parsedCoord.value;
  if (!coord) {
    mapError.value = "坐标数据无效";
    return;
  }

  if (!mapContainerRef.value || !window.TMap) {
    mapError.value = "地图容器初始化失败";
    return;
  }

  const center = new window.TMap.LatLng(coord.lat, coord.lng);
  const map = new window.TMap.Map(mapContainerRef.value, {
    center,
    zoom: 16,
    pitch: 0,
    rotation: 0,
  });
  mapInstance = map;

  new window.TMap.MultiMarker({
    map,
    geometries: [
      {
        id: "map-dialog-marker",
        position: center,
      },
    ],
  });

  bindResizeObserver();
  resizeTimer = window.setTimeout(() => {
    resizeTimer = null;
    mapInstance?.resize?.();
  }, 300);
}

// ===== Resize =====
function bindResizeObserver() {
  if (!mapContainerRef.value || typeof ResizeObserver === "undefined") return;

  resizeObserver?.disconnect();
  resizeObserver = new ResizeObserver(scheduleMapResize);
  resizeObserver.observe(mapContainerRef.value);
}

function scheduleMapResize() {
  if (resizeTimer) window.clearTimeout(resizeTimer);
  if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);

  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = null;
    mapInstance?.resize?.();
    resizeTimer = window.setTimeout(() => {
      resizeTimer = null;
      mapInstance?.resize?.();
    }, 260);
  });
}

// ===== 销毁 =====
function destroyMap() {
  if (resizeTimer) {
    window.clearTimeout(resizeTimer);
    resizeTimer = null;
  }
  if (resizeFrame !== null) {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = null;
  }
  resizeObserver?.disconnect();
  resizeObserver = null;
  mapInstance?.destroy?.();
  mapInstance = null;
  mapError.value = "";
}

// ===== 关闭 =====
function close() {
  emit("update:modelValue", false);
}
</script>

<style scoped lang="scss">
.map-dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 1500;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 35, 55, 0.22);
}

.map-dialog {
  display: flex;
  flex-direction: column;
  width: min(680px, calc(100vw - 24px));
  max-height: calc(100vh - 60px);
  overflow: hidden;
  background: #ffffff;
  border-radius: 6px;
  box-shadow: 0 18px 42px rgba(15, 35, 55, 0.2);
}

.map-dialog__header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
  padding: 14px 18px;
  border-bottom: 1px solid #edf3f8;
}

.map-dialog__title {
  color: #24445f;
  font-size: 16px;
  font-weight: 800;
}

.map-dialog__coord {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #0d82ee;
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-dialog__close {
  flex: none;
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  color: #7f8fa3;
  font-size: 18px;
  line-height: 32px;
  text-align: center;
  background: transparent;
  border: 0;
  border-radius: 4px;
}

.map-dialog__close::after {
  border: 0;
}

.map-dialog__close:hover {
  color: #172033;
  background: #f5f7fa;
}

.map-dialog__body {
  position: relative;
  flex: 1;
  min-height: 400px;
  overflow: hidden;
  background: #edf5ff;
}

.map-dialog__canvas {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.map-dialog__error {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 2;
  max-width: calc(100% - 32px);
  padding: 10px 14px;
  color: #b91c1c;
  font-size: 14px;
  line-height: 1.4;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 6px;
}

.map-dialog__marker-info {
  position: absolute;
  bottom: 18px;
  left: 50%;
  z-index: 2;
  padding: 6px 14px;
  color: #172033;
  font-size: 13px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #d8e5ef;
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(15, 35, 55, 0.1);
  transform: translateX(-50%);
  white-space: nowrap;
}
</style>
