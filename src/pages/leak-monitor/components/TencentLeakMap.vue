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

const mapContainer = ref<HTMLElement | null>(null);
const mapError = ref("");
let mapInstance: any = null;
let sdkLoadingPromise: Promise<void> | null = null;

declare global {
  interface Window {
    TMap?: any;
  }
}

onMounted(() => {
  // #ifdef H5
  nextTick(() => {
    loadTencentMap()
      .then(initMap)
      .catch(() => {
        mapError.value = "腾讯地图加载失败，请检查 Key 的 Web 端域名白名单是否包含当前访问域名";
      });
  });
  // #endif
});

onBeforeUnmount(() => {
  if (mapInstance?.destroy) {
    mapInstance.destroy();
  }
  mapInstance = null;
});

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
        reject();
      }
    };
    script.onerror = () => reject();

    if (!existingScript) {
      document.body.appendChild(script);
    }
  });

  return sdkLoadingPromise;
}

function initMap() {
  mapError.value = "";

  if (!mapContainer.value || !window.TMap) {
    mapError.value = "地图容器初始化失败";
    return;
  }

  const center = new window.TMap.LatLng(31.2304, 121.4737);
  mapInstance = new window.TMap.Map(mapContainer.value, {
    center,
    zoom: 13,
    pitch: 35,
    rotation: 0,
  });

  new window.TMap.MultiMarker({
    map: mapInstance,
    geometries: [
      {
        id: "leak-monitor-center",
        position: center,
      },
    ],
  });

  window.setTimeout(() => {
    mapInstance?.resize?.();
  }, 300);
}
</script>

<style scoped lang="scss">
.leak-map {
  position: relative;
  min-height: calc(100vh - 72px);
  background: #edf5ff;
}

.leak-map__canvas {
  width: 100%;
  height: calc(100vh - 72px);
  min-height: 520px;
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
