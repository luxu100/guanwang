<template>
  <view class="leak-map">
    <!-- #ifdef H5 -->
    <div ref="mapContainer" class="leak-map__canvas"></div>
    <view v-if="mapError" class="leak-map__error">{{ mapError }}</view>
    <!-- #endif -->

    <!-- #ifndef H5 -->
    <view class="leak-map__error">当前地图 SDK 仅支持 H5 端展示</view>
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

const TENCENT_MAP_KEY = "JCDBZ-Z2HLI-V26GX-UL7VO-LJFO2-TIFMZ";
const TENCENT_MAP_SCRIPT_ID = "tencent-map-gl-sdk";
const TENCENT_MAP_SCRIPT_URL = `https://map.qq.com/api/gljs?v=1.exp&key=${TENCENT_MAP_KEY}`;
const MAP_RESIZE_DELAY = 300;

const props = defineProps<{
  lat: number;
  lng: number;
}>();

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
  on?: (event: string, handler: (e: { latLng: TencentLatLngValue }) => void) => void;
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
    geometries: Array<{
      id: string;
      position: unknown;
    }>;
  }): unknown;
}

interface TencentMapApi {
  LatLng: TencentLatLng;
  Map: TencentMapConstructor;
  MultiMarker: TencentMultiMarkerConstructor;
}

const mapContainer = ref<HTMLElement | null>(null);
const mapError = ref("");
let mapInstance: TencentMapInstance | null = null;
let sdkLoadingPromise: Promise<void> | null = null;
let resizeTimer: ReturnType<typeof window.setTimeout> | null = null;
let resizeFrame: number | null = null;
let resizeObserver: ResizeObserver | null = null;

declare global {
  interface Window {
    TMap?: TencentMapApi;
  }
}

onMounted(() => {
  // #ifdef H5
  nextTick(() => {
    bindResizeEvents();
    loadTencentMap()
      .then(initMap)
      .catch(() => {
        mapError.value = "腾讯地图加载失败，请检查 Key 的 Web 端域名白名单是否包含当前访问域名";
      });
  });
  // #endif
});

onBeforeUnmount(() => {
  if (resizeTimer) {
    window.clearTimeout(resizeTimer);
    resizeTimer = null;
  }

  if (resizeFrame !== null) {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = null;
  }

  unbindResizeEvents();
  mapInstance?.destroy?.();
  mapInstance = null;
});

/**
 * 地图 SDK 通过 script 懒加载，避免登录页和非地图页面也加载地图资源。
 */
function loadTencentMap() {
  if (window.TMap) {
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
      if (window.TMap) {
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

/**
 * 初始化地图实例和中心标记。
 *
 * 当前坐标是上海中心点，后续接入真实站点/设备数据后应由接口返回或配置驱动。
 */
function initMap() {
  mapError.value = "";

  if (!mapContainer.value || !window.TMap) {
    mapError.value = "地图容器初始化失败";
    return;
  }

  const center = new window.TMap.LatLng(props.lat, props.lng);
  const map = new window.TMap.Map(mapContainer.value, {
    center,
    zoom: 15,
    pitch: 45,
    rotation: 0,
  });
  mapInstance = map;

  new window.TMap.MultiMarker({
    map,
    geometries: [
      {
        id: "leak-monitor-center",
        position: center,
      },
    ],
  });

  bindContainerResizeObserver();
  resizeTimer = window.setTimeout(() => {
    resizeTimer = null;
    mapInstance?.resize?.();
  }, MAP_RESIZE_DELAY);
}

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
  if (resizeTimer) {
    window.clearTimeout(resizeTimer);
  }

  if (resizeFrame !== null) {
    window.cancelAnimationFrame(resizeFrame);
  }

  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = null;
    mapInstance?.resize?.();

    resizeTimer = window.setTimeout(() => {
      resizeTimer = null;
      mapInstance?.resize?.();
    }, 260);
  });
}
</script>

<style scoped lang="scss">
.leak-map {
  position: relative;
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
</style>
